import { assertConfigured, fail, hyperswitch } from "@/lib/hyperswitch.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Verifies a deposit server-side, so the client never has to trust the amount
 * or status that came back in the redirect query string.
 */
export async function GET(request) {
  const notReady = assertConfigured();
  if (notReady) return notReady;

  const clientSecret = new URL(request.url).searchParams.get("client_secret");
  if (!clientSecret) return fail(400, "client_secret is required");

  const paymentId = String(clientSecret).split("_secret_")[0];

  try {
    const data = await hyperswitch(`/payments/${paymentId}?force_sync=true`);

    // The client only ever knows the client_secret, so confirm it actually
    // belongs to the payment we retrieved before reporting a status.
    if (data.client_secret !== clientSecret) {
      return fail(403, "client_secret mismatch");
    }

    // Symmetric guard to /withdrawal-status: a withdrawal intent must never be
    // verifiable as a deposit, or replaying its client_secret here would
    // credit the player for money they were taking out.
    const meta = data.metadata || {};
    if (meta.type === "wallet_withdrawal") {
      return fail(409, "not a deposit intent");
    }

    // With DCC the charge may be in EUR/JPY while the wallet is USD. Credit
    // from the USD figure recorded at creation, never the raw foreign amount
    // (which for JPY would be ~157x too large).
    const usdCents = Number(meta.deposit_usd_cents);

    return Response.json({
      paymentId: data.payment_id,
      status: data.status,
      // `amount` stays USD minor units — the wallet's unit of account.
      amount: Number.isFinite(usdCents) ? usdCents : data.amount,
      currency: "USD",
      // What the player was actually charged, for the receipt.
      presentmentAmount: data.amount,
      presentmentCurrency: data.currency,
      fxRate: meta.fx_rate ? Number(meta.fx_rate) : null,
      fxMarkupPct: meta.fx_markup_pct ? Number(meta.fx_markup_pct) : null,
      paymentMethod: data.payment_method,
      paymentMethodType: data.payment_method_type,
    });
  } catch (err) {
    console.error("payment-status failed", err.data || err.message);
    return fail(
      err.status || 500,
      "Failed to retrieve payment",
      err.data || err.message
    );
  }
}
