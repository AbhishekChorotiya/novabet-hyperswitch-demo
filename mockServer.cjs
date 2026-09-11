const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5252;

app.use(cors());
app.use(express.json());

const HYPERSWITCH_SECRET_KEY = process.env.HYPERSWITCH_SECRET_KEY;
const HYPERSWITCH_PUBLISHABLE_KEY = process.env.HYPERSWITCH_PUBLISHABLE_KEY;
const PROFILE_ID = process.env.PROFILE_ID;
const HYPERSWITCH_BASE_URL =
  process.env.HYPERSWITCH_SANDBOX_URL || 'https://sandbox.hyperswitch.io';

if (!HYPERSWITCH_SECRET_KEY || !HYPERSWITCH_PUBLISHABLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const makeHyperswitchRequest = async (endpoint, options = {}) => {
  const url = `${HYPERSWITCH_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'api-key': HYPERSWITCH_SECRET_KEY,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.response = { status: response.status, data };
    throw error;
  }

  return { data };
};

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: {
      baseUrl: HYPERSWITCH_BASE_URL,
      hasSecretKey: !!HYPERSWITCH_SECRET_KEY,
      hasPublishableKey: !!HYPERSWITCH_PUBLISHABLE_KEY,
    },
  });
});

// Deposit limits are enforced HERE as well as in the UI — a client-side
// clamp alone means `curl '/create-payment-intent?amount=500000'` can still
// mint a $500k intent.
const MIN_DEPOSIT_USD = 10;
const MAX_DEPOSIT_USD = 10000;

/*
 * Dynamic Currency Conversion.
 *
 * The rate table lives on the SERVER and is the only one that counts. The
 * client shows a quote, but the amount actually charged is recomputed here
 * from the USD figure — otherwise a caller could post
 * `?amount=1000&currency=JPY&rate=0.0001` and deposit $1,000 for pennies.
 *
 * `exponent` is the number of minor units per major unit. JPY is
 * ZERO-DECIMAL: ¥5,000 is `amount: 5000`, not 500000. Note the web SDK's own
 * helper divides by a hardcoded 100 (Utils.res:1869), so zero-decimal
 * currencies have to be handled deliberately on both ends.
 */
const RATES = {
  USD: { rate: 1, exponent: 2 },
  EUR: { rate: 0.92, exponent: 2 },
  GBP: { rate: 0.79, exponent: 2 },
  INR: { rate: 83.2, exponent: 2 },
  JPY: { rate: 157.0, exponent: 0 },
  AUD: { rate: 1.52, exponent: 2 },
  CAD: { rate: 1.37, exponent: 2 },
  BRL: { rate: 5.44, exponent: 2 },
};
const DCC_MARKUP_PCT = 2.5;

/**
 * `direction` decides which side of the spread the player lands on. The markup
 * must always work AGAINST them:
 *   pay_in  (deposit)    -> rate * 1.025, player pays more local currency
 *   pay_out (withdrawal) -> rate / 1.025, player receives less
 *
 * Reusing the pay-in rate on a payout would give the spread back — deposit
 * €94.30 for $100 then withdraw €94.30 for $100 makes converting free, which
 * is both wrong and exploitable as a zero-cost FX round trip.
 */
const quote = (usd, currency, direction = 'pay_in') => {
  const meta = RATES[currency];
  if (!meta) return null;
  const m = 1 + DCC_MARKUP_PCT / 100;
  const eff =
    currency === 'USD' ? 1 : direction === 'pay_out' ? meta.rate / m : meta.rate * m;
  const major =
    meta.exponent === 0
      ? Math.round(usd * eff)
      : Math.round(usd * eff * 100) / 100;
  return {
    currency,
    direction,
    effectiveRate: eff,
    majorAmount: major,
    minorAmount: Math.round(major * 10 ** meta.exponent),
    exponent: meta.exponent,
    markupPct: currency === 'USD' ? 0 : DCC_MARKUP_PCT,
  };
};

app.get('/rates', (req, res) => {
  res.json({
    base: 'USD',
    markupPct: DCC_MARKUP_PCT,
    // Quote expiry: a real DCC rate is only good for a short window.
    ttlMs: 90_000,
    quotedAt: Date.now(),
    rates: Object.fromEntries(
      Object.entries(RATES).map(([c, m]) => [
        c,
        {
          rate: m.rate,
          exponent: m.exponent,
          effectiveRate: c === 'USD' ? 1 : m.rate * (1 + DCC_MARKUP_PCT / 100),
        },
      ])
    ),
  });
});

const createPaymentIntent = async (amountUsd, res, currencyRaw) => {
  try {
    const requested = Number(amountUsd);
    if (amountUsd !== undefined && (!Number.isFinite(requested) || requested <= 0)) {
      return res.status(400).json({
        error: 'Invalid amount',
        details: 'amount must be a positive number',
      });
    }
    // Limits are always evaluated in USD, so switching currency can never be
    // used to slip past them.
    if (
      Number.isFinite(requested) &&
      (requested < MIN_DEPOSIT_USD || requested > MAX_DEPOSIT_USD)
    ) {
      return res.status(400).json({
        error: 'Amount out of range',
        details: `Deposits must be between $${MIN_DEPOSIT_USD} and $${MAX_DEPOSIT_USD}`,
      });
    }

    const currency = String(currencyRaw || 'USD').toUpperCase();
    if (!RATES[currency]) {
      return res.status(400).json({
        error: 'Unsupported currency',
        details: `currency must be one of ${Object.keys(RATES).join(', ')}`,
      });
    }

    const usd = Number.isFinite(requested) ? requested : 100;
    const q = quote(usd, currency);
    const amount = q.minorAmount;
    const paymentData = {
      amount,
      currency,
      capture_method: 'automatic',
      authentication_type: 'no_three_ds',
      customer_id: 'novabet_demo_customer',
      email: 'highroller@novabet.demo',
      description: 'NOVABET wallet deposit',
      metadata: {
        platform: 'novabet-demo',
        type: 'wallet_deposit',
        // The wallet is denominated in USD, but the charge may be in another
        // currency via DCC. Record the USD value here so verification credits
        // the right amount without having to reverse the conversion (and
        // without trusting a rate from the client).
        deposit_usd_cents: String(Math.round(usd * 100)),
        presentment_currency: currency,
        fx_rate: String(q.effectiveRate),
        fx_markup_pct: String(q.markupPct),
      },
      // Billing/shipping are attached to the intent SERVER-side (same shape as
      // Hyperswitch-React-Demo-App/server.js). Because the intent already
      // carries a complete address, the SDK does not render any address /
      // name / email fields — the player only sees card number, expiry, CVC.
      // This is the right pattern for a real gambling merchant too: KYC has
      // already captured the verified address, so re-collecting it at the
      // cashier is both friction and a mismatch risk.
      billing: {
        address: {
          line1: '42 Casino Boulevard',
          line2: 'Suite 7',
          city: 'Las Vegas',
          state: 'Nevada',
          zip: '89109',
          country: 'US',
          first_name: 'Demo',
          last_name: 'Player',
        },
        phone: { number: '7025550142', country_code: '+1' },
        email: 'highroller@novabet.demo',
      },
      shipping: {
        address: {
          line1: '42 Casino Boulevard',
          line2: 'Suite 7',
          city: 'Las Vegas',
          state: 'Nevada',
          zip: '89109',
          country: 'US',
          first_name: 'Demo',
          last_name: 'Player',
        },
        phone: { number: '7025550142', country_code: '+1' },
      },
    };

    if (PROFILE_ID) paymentData.profile_id = PROFILE_ID;

    const response = await makeHyperswitchRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });

    res.json({
      publishableKey: HYPERSWITCH_PUBLISHABLE_KEY,
      clientSecret: response.data.client_secret,
      amount,
      // Echo the quote the server actually used, so the UI displays the
      // figure that will be charged rather than its own local estimate.
      currency,
      usdAmount: usd,
      presentmentAmount: q.majorAmount,
      effectiveRate: q.effectiveRate,
      markupPct: q.markupPct,
      exponent: q.exponent,
    });
  } catch (error) {
    console.error(
      'Error creating payment intent',
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: 'Failed to create payment intent',
      details: error.response?.data || error.message,
    });
  }
};

app.get('/create-payment-intent', (req, res) =>
  createPaymentIntent(req.query.amount, res, req.query.currency)
);

app.post('/create-payment-intent', (req, res) =>
  createPaymentIntent(req.body?.amount, res, req.body?.currency)
);

// ---------------------------------------------------------------------------
// WITHDRAWALS
//
// NOTE ON WHAT THIS IS: a production gambling cashier must settle payouts with
// `POST /payouts` (Hyperswitch Payouts). This demo deliberately does NOT use
// the payout SDK widget (`paymentMethodCollect`), so the withdrawal here is
// *mocked*: we open a normal no-3DS payment intent, let the Payment SDK collect
// and verify the destination card, and on success debit the player's cash
// balance locally.
//
// The consequence to be aware of when demoing: the underlying sandbox
// transaction is a charge, not a credit. The UX, limits, cash-vs-bonus rules
// and idempotency are all real; the direction of the money movement is not.
//
// The withdrawal amount is written into `metadata` so it comes back from the
// Hyperswitch API on verification. The client therefore never has to trust an
// amount from the redirect URL — same threat model as the deposit flow.
const MIN_WITHDRAWAL_USD = 20;
const MAX_WITHDRAWAL_USD = 10000;

app.get('/create-withdrawal-intent', async (req, res) => {
  try {
    const requested = Number(req.query.amount);
    if (!Number.isFinite(requested) || requested <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        details: 'amount must be a positive number',
      });
    }
    if (requested < MIN_WITHDRAWAL_USD || requested > MAX_WITHDRAWAL_USD) {
      return res.status(400).json({
        error: 'Amount out of range',
        details: `Withdrawals must be between $${MIN_WITHDRAWAL_USD} and $${MAX_WITHDRAWAL_USD}`,
      });
    }

    const currency = String(req.query.currency || 'USD').toUpperCase();
    if (!RATES[currency]) {
      return res.status(400).json({
        error: 'Unsupported currency',
        details: `currency must be one of ${Object.keys(RATES).join(', ')}`,
      });
    }

    // Payout side of the spread: the player receives LESS local currency.
    const q = quote(requested, currency, 'pay_out');
    const amount = q.minorAmount;
    // The wallet debit is always the USD figure the player chose, INDEPENDENT
    // of the payout currency. Deriving it from the converted amount instead
    // would let rounding (and any rate drift between quote and settle) shift
    // the balance.
    const debitUsdCents = Math.round(requested * 100);

    const payload = {
      amount,
      currency,
      capture_method: 'automatic',
      // Explicitly no 3DS: a payout destination check should not throw an
      // ACS challenge at the player.
      authentication_type: 'no_three_ds',
      customer_id: 'novabet_demo_customer',
      email: 'highroller@novabet.demo',
      description: 'NOVABET wallet withdrawal',
      metadata: {
        platform: 'novabet-demo',
        // Read back on verification and used as the authoritative debit amount.
        type: 'wallet_withdrawal',
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
      // only *reorders* it — `Utils.res` `sortBasedOnPriority` appends every
      // method the merchant didn't list, so it can never remove one.
      allowed_payment_method_types: ['credit', 'debit'],
      billing: {
        address: {
          line1: '42 Casino Boulevard',
          line2: 'Suite 7',
          city: 'Las Vegas',
          state: 'Nevada',
          zip: '89109',
          country: 'US',
          first_name: 'Demo',
          last_name: 'Player',
        },
        phone: { number: '7025550142', country_code: '+1' },
        email: 'highroller@novabet.demo',
      },
    };

    if (PROFILE_ID) payload.profile_id = PROFILE_ID;

    const response = await makeHyperswitchRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    res.json({
      publishableKey: HYPERSWITCH_PUBLISHABLE_KEY,
      clientSecret: response.data.client_secret,
      amount,
      // Echo the server's own quote so the UI shows the figure that will
      // actually be paid out.
      currency,
      usdAmount: requested,
      payoutAmount: q.majorAmount,
      effectiveRate: q.effectiveRate,
      markupPct: q.markupPct,
      exponent: q.exponent,
    });
  } catch (error) {
    console.error(
      'Error creating withdrawal intent',
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: 'Failed to create withdrawal intent',
      details: error.response?.data || error.message,
    });
  }
});

// Verifies a withdrawal server-side and reports the amount that was recorded
// on the intent's metadata, NOT anything supplied by the client.
app.get('/withdrawal-status', async (req, res) => {
  const clientSecret = req.query.client_secret;
  if (!clientSecret) {
    return res.status(400).json({ error: 'client_secret is required' });
  }

  const paymentId = String(clientSecret).split('_secret_')[0];

  try {
    const response = await makeHyperswitchRequest(
      `/payments/${paymentId}?force_sync=true`
    );

    if (response.data.client_secret !== clientSecret) {
      return res.status(403).json({ error: 'client_secret mismatch' });
    }

    const meta = response.data.metadata || {};
    // Refuse to treat a deposit intent as a withdrawal. Without this, a player
    // could take a *deposit* client_secret and replay it here to get credited
    // and debited in whichever direction suited them.
    if (meta.type !== 'wallet_withdrawal') {
      return res.status(409).json({ error: 'not a withdrawal intent' });
    }

    const recorded = Number(meta.withdrawal_amount_cents);
    if (!Number.isFinite(recorded)) {
      // No recorded USD figure means we cannot know how much to debit. Do NOT
      // fall back to `response.data.amount`: with a foreign payout currency
      // that is the converted value (e.g. 9430 EUR-cents), and debiting it as
      // USD cents would take the wrong amount out of the wallet.
      return res
        .status(409)
        .json({ error: 'withdrawal intent is missing its USD amount' });
    }

    res.json({
      paymentId: response.data.payment_id,
      status: response.data.status,
      // Authoritative debit amount, always USD minor units.
      amount: recorded,
      currency: 'USD',
      // What the player actually receives, for the receipt.
      payoutAmount: response.data.amount,
      payoutCurrency: response.data.currency,
      fxRate: meta.payout_fx_rate ? Number(meta.payout_fx_rate) : null,
      fxMarkupPct: meta.payout_fx_markup_pct
        ? Number(meta.payout_fx_markup_pct)
        : null,
      paymentMethod: response.data.payment_method,
      paymentMethodType: response.data.payment_method_type,
    });
  } catch (error) {
    console.error(
      'Error retrieving withdrawal',
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: 'Failed to retrieve withdrawal',
      details: error.response?.data || error.message,
    });
  }
});

// Verifies a payment server-side so the client never has to trust the
// amount/status that came back in the redirect query string.
app.get('/payment-status', async (req, res) => {
  const clientSecret = req.query.client_secret;
  if (!clientSecret) {
    return res.status(400).json({ error: 'client_secret is required' });
  }

  const paymentId = String(clientSecret).split('_secret_')[0];

  try {
    const response = await makeHyperswitchRequest(
      `/payments/${paymentId}?force_sync=true`
    );

    // The client only ever knows the client_secret, so verify it actually
    // belongs to the retrieved payment before reporting a status back.
    if (response.data.client_secret !== clientSecret) {
      return res.status(403).json({ error: 'client_secret mismatch' });
    }

    // Symmetric guard to /withdrawal-status: a withdrawal intent must never be
    // verifiable as a deposit, or replaying its client_secret here would credit
    // the player for money they were taking out.
    if (response.data.metadata?.type === 'wallet_withdrawal') {
      return res.status(409).json({ error: 'not a deposit intent' });
    }

    // With DCC the charge may be in EUR/JPY/etc while the wallet is in USD.
    // Credit from the USD figure recorded on the intent at creation time, so
    // the wallet is never credited with a raw foreign-currency number (which
    // for JPY would be ~157x too large).
    const meta = response.data.metadata || {};
    const usdCents = Number(meta.deposit_usd_cents);

    res.json({
      paymentId: response.data.payment_id,
      status: response.data.status,
      // `amount` stays USD minor units — the wallet's unit of account.
      amount: Number.isFinite(usdCents) ? usdCents : response.data.amount,
      currency: 'USD',
      // What the player was actually charged, for display on the receipt.
      presentmentAmount: response.data.amount,
      presentmentCurrency: response.data.currency,
      fxRate: meta.fx_rate ? Number(meta.fx_rate) : null,
      fxMarkupPct: meta.fx_markup_pct ? Number(meta.fx_markup_pct) : null,
      paymentMethod: response.data.payment_method,
      paymentMethodType: response.data.payment_method_type,
    });
  } catch (error) {
    console.error(
      'Error retrieving payment',
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: 'Failed to retrieve payment',
      details: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hyperswitch mock server running on port ${PORT}`);
});

module.exports = app;
