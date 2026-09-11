import {
  assertConfigured,
  CUSTOMER_EMAIL,
  CUSTOMER_ID,
  DEMO_BILLING,
  DEMO_SHIPPING,
  fail,
  getPublishableKey,
  hyperswitch,
  MAX_DEPOSIT_USD,
  MIN_DEPOSIT_USD,
  parseCurrency,
  PROFILE_ID,
  quote,
  RATES,
  validateAmount,
} from "@/lib/hyperswitch.server";

// Never prerender or cache: this mints a payment intent on every call.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function createIntent(amountRaw, currencyRaw) {
  const notReady = assertConfigured();
  if (notReady) return notReady;

  const { value: usd, error } = validateAmount(
    amountRaw === undefined || amountRaw === null || amountRaw === "" ? 100 : amountRaw,
    { min: MIN_DEPOSIT_USD, max: MAX_DEPOSIT_USD, label: "Deposits" }
  );
  if (error) return error;

  const currency = parseCurrency(currencyRaw);
  if (!currency) {
    return fail(
      400,
      "Unsupported currency",
      `currency must be one of ${Object.keys(RATES).join(", ")}`
    );
  }

  const q = quote(usd, currency, "pay_in");

  const payload = {
    amount: q.minorAmount,
    currency,
    capture_method: "automatic",
    authentication_type: "no_three_ds",
    customer_id: CUSTOMER_ID,
    email: CUSTOMER_EMAIL,
    description: "NOVABET wallet deposit",
    metadata: {
      platform: "novabet-demo",
      type: "wallet_deposit",
      // The wallet is denominated in USD but the charge may be in another
      // currency via DCC. Record the USD value so verification credits the
      // right amount without reversing the conversion (or trusting a client
      // rate).
      deposit_usd_cents: String(Math.round(usd * 100)),
      presentment_currency: currency,
      fx_rate: String(q.effectiveRate),
      fx_markup_pct: String(q.markupPct),
    },
    billing: DEMO_BILLING,
    shipping: DEMO_SHIPPING,
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
      // Echo the server's own quote so the UI shows what will be charged.
      currency,
      usdAmount: usd,
      presentmentAmount: q.majorAmount,
      effectiveRate: q.effectiveRate,
      markupPct: q.markupPct,
      exponent: q.exponent,
    });
  } catch (err) {
    console.error("create-payment-intent failed", err.data || err.message);
    return fail(
      err.status || 500,
      "Failed to create payment intent",
      err.data || err.message
    );
  }
}

export async function GET(request) {
  const p = new URL(request.url).searchParams;
  return createIntent(p.get("amount"), p.get("currency"));
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  return createIntent(body.amount, body.currency);
}
