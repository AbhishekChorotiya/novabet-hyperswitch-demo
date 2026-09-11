/**
 * Server-only Hyperswitch helpers, shared by the route handlers in app/api.
 *
 * Nothing here may be imported from a client component: it reads
 * HYPERSWITCH_SECRET_KEY, which must never reach the browser.
 */
import "server-only";

export const HYPERSWITCH_BASE_URL =
  process.env.HYPERSWITCH_SANDBOX_URL || "https://sandbox.hyperswitch.io";

const SECRET_KEY = process.env.HYPERSWITCH_SECRET_KEY;
const PUBLISHABLE_KEY = process.env.HYPERSWITCH_PUBLISHABLE_KEY;
export const PROFILE_ID = process.env.PROFILE_ID;

export function getPublishableKey() {
  return PUBLISHABLE_KEY;
}

/** Uniform JSON error, so every route fails the same shape. */
export function fail(status, error, details) {
  return Response.json({ error, ...(details ? { details } : {}) }, { status });
}

export function assertConfigured() {
  if (!SECRET_KEY || !PUBLISHABLE_KEY) {
    return fail(
      500,
      "Server is not configured",
      "HYPERSWITCH_SECRET_KEY and HYPERSWITCH_PUBLISHABLE_KEY must be set"
    );
  }
  return null;
}

/**
 * Call the Hyperswitch API.
 *
 * `cache: "no-store"` is NOT optional. Next 14 patches global fetch and
 * defaults to `force-cache`, so a payment retrieve would be served from the
 * data cache and report a stale status — the exact value the wallet credit
 * decision is based on. Every call here is a live read or a mutation.
 */
export async function hyperswitch(endpoint, options = {}) {
  const res = await fetch(`${HYPERSWITCH_BASE_URL}${endpoint}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "api-key": SECRET_KEY,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Hyperswitch responded ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// --------------------------------------------------------------------------
// Limits. Always evaluated in USD, before any currency conversion, so
// switching currency can never be used to slip past them.
export const MIN_DEPOSIT_USD = 10;
export const MAX_DEPOSIT_USD = 10000;
export const MIN_WITHDRAWAL_USD = 20;
export const MAX_WITHDRAWAL_USD = 10000;

// --------------------------------------------------------------------------
// Dynamic currency conversion.
//
// This table is the ONLY one that counts. The client renders a quote, but the
// charge is recomputed here from the USD figure — otherwise a caller could
// post `?amount=1000&currency=JPY&rate=0.0001`.
//
// `exponent` is minor units per major unit. JPY is ZERO-DECIMAL: ¥5,000 is
// `amount: 5000`, not 500000. The web SDK's own helper divides by a hardcoded
// 100 (Utils.res:1869 `minorUnitToString`), so this has to be deliberate.
export const RATES = {
  USD: { rate: 1, exponent: 2 },
  EUR: { rate: 0.92, exponent: 2 },
  GBP: { rate: 0.79, exponent: 2 },
  INR: { rate: 83.2, exponent: 2 },
  JPY: { rate: 157.0, exponent: 0 },
  AUD: { rate: 1.52, exponent: 2 },
  CAD: { rate: 1.37, exponent: 2 },
  BRL: { rate: 5.44, exponent: 2 },
};

export const DCC_MARKUP_PCT = 2.5;
export const RATE_TTL_MS = 90_000;

/**
 * `direction` decides which side of the spread the player lands on. The markup
 * must always work AGAINST them:
 *   pay_in  (deposit)    -> rate * 1.025, player pays more local currency
 *   pay_out (withdrawal) -> rate / 1.025, player receives less
 *
 * Reusing the pay-in rate on a payout would hand the spread back, making a
 * convert-both-ways round trip free.
 */
export function quote(usd, currency, direction = "pay_in") {
  const meta = RATES[currency];
  if (!meta) return null;
  const m = 1 + DCC_MARKUP_PCT / 100;
  const eff =
    currency === "USD"
      ? 1
      : direction === "pay_out"
      ? meta.rate / m
      : meta.rate * m;
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
    markupPct: currency === "USD" ? 0 : DCC_MARKUP_PCT,
  };
}

/**
 * Billing/shipping are attached to the intent SERVER-side, so the SDK renders
 * no address / name / email fields — the player sees only card number, expiry
 * and CVC. For a real gambling merchant this is also correct: KYC already
 * captured a verified address, so re-collecting it adds friction and invites
 * an AVS mismatch.
 */
const DEMO_ADDRESS = {
  line1: "42 Casino Boulevard",
  line2: "Suite 7",
  city: "Las Vegas",
  state: "Nevada",
  zip: "89109",
  country: "US",
  first_name: "Demo",
  last_name: "Player",
};

export const DEMO_BILLING = {
  address: DEMO_ADDRESS,
  phone: { number: "7025550142", country_code: "+1" },
  email: "highroller@novabet.demo",
};

export const DEMO_SHIPPING = {
  address: DEMO_ADDRESS,
  phone: { number: "7025550142", country_code: "+1" },
};

export const CUSTOMER_ID = "novabet_demo_customer";
export const CUSTOMER_EMAIL = "highroller@novabet.demo";

/** Validate + normalise a requested currency. */
export function parseCurrency(raw) {
  const code = String(raw || "USD").toUpperCase();
  return RATES[code] ? code : null;
}

/** Shared amount validation, returning a Response on failure. */
export function validateAmount(raw, { min, max, label }) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return { error: fail(400, "Invalid amount", "amount must be a positive number") };
  }
  if (n < min || n > max) {
    return {
      error: fail(
        400,
        "Amount out of range",
        `${label} must be between $${min} and $${max}`
      ),
    };
  }
  return { value: n };
}
