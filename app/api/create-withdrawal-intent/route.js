import {
  assertConfigured,
  CUSTOMER_EMAIL,
  CUSTOMER_ID,
  DEMO_BILLING,
  fail,
  getPublishableKey,
  hyperswitch,
  MAX_WITHDRAWAL_USD,
  MIN_WITHDRAWAL_USD,
  parseCurrency,
  PROFILE_ID,
  quote,
  RATES,
  validateAmount,
} from "@/lib/hyperswitch.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/*
 * WHAT THIS IS: a production cashier settles payouts with `POST /payouts`
 * (Hyperswitch Payouts). This demo deliberately does NOT use the payout SDK
 * widget, so the withdrawal is MOCKED: it opens a normal no-3DS payment
 * intent, lets the Payment SDK collect and verify the destination card, and
 * debits the player's cash balance on success.
 *
 * The consequence when demoing: the underlying sandbox transaction is a
 * charge, not a credit. The UX, limits, FX and idempotency are all real; the
 * direction of the money movement is not.
 */
export async function GET(request) {
  const notReady = assertConfigured();
  if (notReady) return notReady;

  const params = new URL(request.url).searchParams;

  const { value: usd, error } = validateAmount(params.get("amount"), {
    min: MIN_WITHDRAWAL_USD,
    max: MAX_WITHDRAWAL_USD,
    label: "Withdrawals",
  });
  if (error) return error;

  const currency = parseCurrency(params.get("currency"));
  if (!currency) {
    return fail(
      400,
      "Unsupported currency",
      `currency must be one of ${Object.keys(RATES).join(", ")}`
    );
  }

  // Payout side of the spread: the player receives LESS local currency.
  const q = quote(usd, currency, "pay_out");

  // The wallet debit is always the USD figure the player chose, INDEPENDENT
  // of payout currency. Deriving it from the converted amount would let
  // rounding (and any rate drift) shift the balance.
  const debitUsdCents = Math.round(usd * 100);

  const payload = {
    amount: q.minorAmount,
    currency,
    capture_method: "automatic",
    // Explicitly no 3DS: a payout destination check should not throw an ACS
    // challenge at the player.
    authentication_type: "no_three_ds",
    customer_id: CUSTOMER_ID,
    email: CUSTOMER_EMAIL,
    description: "NOVABET wallet withdrawal",
    metadata: {
      platform: "novabet-demo",
      type: "wallet_withdrawal",
      withdrawal_amount_cents: String(debitUsdCents),
      payout_currency: currency,
      payout_fx_rate: String(q.effectiveRate),
      payout_fx_markup_pct: String(q.markupPct),
    },
    // Cards only. Payouts must return to the original payment method, so
    // offering wallets / BNPL / crypto as payout "destinations" would be
    // misleading (and for BNPL, meaningless).
    //
    // This has to be restricted HERE, not on the client: the SDK builds its
    // tab list from the API's payment method list, and `paymentMethodOrder`
    // only reorders it — Utils.res `sortBasedOnPriority` appends every method
    // the merchant didn't list, so it can never remove one.
    allowed_payment_method_types: ["credit", "debit"],
    billing: DEMO_BILLING,
  };

  if (PROFILE_ID) payload.profile_id = PROFILE_ID;

  try {
    const data = await hyperswitch("/payments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return Response.json({
      publishableKey: getPublishableKey(),
      clientSecret: data.client_secret,
      amount: q.minorAmount,
      currency,
      usdAmount: usd,
      payoutAmount: q.majorAmount,
      effectiveRate: q.effectiveRate,
      markupPct: q.markupPct,
      exponent: q.exponent,
    });
  } catch (err) {
    console.error("create-withdrawal-intent failed", err.data || err.message);
    return fail(
      err.status || 500,
      "Failed to create withdrawal intent",
      err.data || err.message
    );
  }
}
