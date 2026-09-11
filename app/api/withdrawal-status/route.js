import { assertConfigured, fail, hyperswitch } from "@/lib/hyperswitch.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Verifies a withdrawal server-side and reports the amount recorded on the
 * intent's metadata, never anything supplied by the client.
 */
export async function GET(request) {
  const notReady = assertConfigured();
  if (notReady) return notReady;

  const clientSecret = new URL(request.url).searchParams.get("client_secret");
  if (!clientSecret) return fail(400, "client_secret is required");

  const paymentId = String(clientSecret).split("_secret_")[0];

  try {
    const data = await hyperswitch(`/payments/${paymentId}?force_sync=true`);

    if (data.client_secret !== clientSecret) {
      return fail(403, "client_secret mismatch");
    }

    const meta = data.metadata || {};
    // Refuse to treat a deposit intent as a withdrawal. Without this a player
    // could take a deposit client_secret and replay it here, moving the
    // balance in whichever direction suited them.
    if (meta.type !== "wallet_withdrawal") {
      return fail(409, "not a withdrawal intent");
    }

    const recorded = Number(meta.withdrawal_amount_cents);
    if (!Number.isFinite(recorded)) {
      // Without a recorded USD figure we cannot know how much to debit. Do
      // NOT fall back to `data.amount`: with a foreign payout currency that is
      // the converted value (e.g. 8976 EUR-cents), and debiting it as USD
      // cents would take the wrong amount out of the wallet.
      return fail(409, "withdrawal intent is missing its USD amount");
    }

    return Response.json({
      paymentId: data.payment_id,
      status: data.status,
      // Authoritative debit amount, always USD minor units.
      amount: recorded,
      currency: "USD",
      // What the player actually receives, for the receipt.
      payoutAmount: data.amount,
      payoutCurrency: data.currency,
      fxRate: meta.payout_fx_rate ? Number(meta.payout_fx_rate) : null,
      fxMarkupPct: meta.payout_fx_markup_pct
        ? Number(meta.payout_fx_markup_pct)
        : null,
      paymentMethod: data.payment_method,
      paymentMethodType: data.payment_method_type,
    });
  } catch (err) {
    console.error("withdrawal-status failed", err.data || err.message);
    return fail(
      err.status || 500,
      "Failed to retrieve withdrawal",
      err.data || err.message
    );
  }
}
