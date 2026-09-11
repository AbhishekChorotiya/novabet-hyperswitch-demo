/**
 * Dynamic Currency Conversion (DCC).
 *
 * The player's wallet is denominated in USD. DCC lets them pay in a local
 * currency: we convert, create the intent in THAT currency, and settle the
 * wallet in USD at the rate quoted on screen.
 *
 * Rates here are static demo figures. In production these come from a rates
 * provider and must be quoted with an expiry — see RATE_TTL_MS.
 */

// Minor units per major unit. JPY/KRW are ZERO-DECIMAL: the Hyperswitch
// `amount` field is in minor units, so ¥5,000 is `amount: 5000`, NOT 500000.
// Getting this wrong overcharges by 100x. Note the SDK's own helper hardcodes
// a /100 divisor (Utils.res:1869 `minorUnitToString`) with no zero-decimal
// handling, so the correct exponent has to be applied on our side.
export const CURRENCIES = {
  USD: { label: "US Dollar", symbol: "$", rate: 1, exponent: 2, flag: "US" },
  EUR: { label: "Euro", symbol: "€", rate: 0.92, exponent: 2, flag: "EU" },
  GBP: { label: "British Pound", symbol: "£", rate: 0.79, exponent: 2, flag: "GB" },
  INR: { label: "Indian Rupee", symbol: "₹", rate: 83.2, exponent: 2, flag: "IN" },
  JPY: { label: "Japanese Yen", symbol: "¥", rate: 157.0, exponent: 0, flag: "JP" },
  AUD: { label: "Australian Dollar", symbol: "A$", rate: 1.52, exponent: 2, flag: "AU" },
  CAD: { label: "Canadian Dollar", symbol: "C$", rate: 1.37, exponent: 2, flag: "CA" },
  BRL: { label: "Brazilian Real", symbol: "R$", rate: 5.44, exponent: 2, flag: "BR" },
};

export const DEFAULT_CURRENCY = "USD";

/** A real quote expires; a demo one should visibly behave the same way. */
export const RATE_TTL_MS = 90_000;

/**
 * The markup a PSP/acquirer takes on a DCC conversion. Regulators (and the
 * EU's CBR rules in particular) require this be DISCLOSED rather than buried
 * in the rate, so it is applied and shown explicitly.
 */
export const DCC_MARKUP_PCT = 2.5;

export function isSupported(code) {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, code);
}

export function getCurrency(code) {
  return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Effective rate including the disclosed markup.
 *
 * `direction` matters. The markup must always work AGAINST the player, so:
 *   - "pay_in"  (deposit): player gives up MORE local currency -> rate * 1.025
 *   - "pay_out" (withdrawal): player receives LESS local currency -> rate / 1.025
 *
 * Reusing the pay-in rate for payouts would hand the spread back: deposit
 * €94.30 for $100, withdraw €94.30 for $100, and the round trip costs nothing.
 * With the inverse applied, the same round trip costs ~4.9% — which is the
 * real cost of converting twice.
 */
export function effectiveRate(code, direction = "pay_in") {
  const { rate } = getCurrency(code);
  if (code === DEFAULT_CURRENCY) return 1;
  const m = 1 + DCC_MARKUP_PCT / 100;
  return direction === "pay_out" ? rate / m : rate * m;
}

/** Convert a USD major-unit amount into the target currency's major units. */
export function convertFromUsd(usd, code, direction = "pay_in") {
  const amount = (Number(usd) || 0) * effectiveRate(code, direction);
  const { exponent } = getCurrency(code);
  // Round to the currency's own precision so the quoted figure and the
  // charged figure cannot disagree.
  return exponent === 0 ? Math.round(amount) : Math.round(amount * 100) / 100;
}

/** Convert back, for settling the wallet in USD. */
export function convertToUsd(amount, code, direction = "pay_in") {
  const r = effectiveRate(code, direction);
  if (!r) return 0;
  return Math.round(((Number(amount) || 0) / r) * 100) / 100;
}

/**
 * Major units -> minor units for the Hyperswitch `amount` field.
 * Respects zero-decimal currencies.
 */
export function toMinorUnits(amount, code) {
  const { exponent } = getCurrency(code);
  return Math.round((Number(amount) || 0) * 10 ** exponent);
}

/** Minor units -> major units. */
export function fromMinorUnits(minor, code) {
  const { exponent } = getCurrency(code);
  return (Number(minor) || 0) / 10 ** exponent;
}

/** Locale-correct formatting, honouring zero-decimal currencies. */
export function formatCurrency(amount, code) {
  const { exponent } = getCurrency(code);
  const n = Number(amount) || 0;
  try {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
    });
  } catch (e) {
    // Unknown code: fall back to the symbol rather than throwing.
    const { symbol } = getCurrency(code);
    return `${symbol}${n.toLocaleString("en-US", {
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
    })}`;
  }
}

/** "1 USD = 0.94 EUR" style disclosure string. */
export function rateLine(code, direction = "pay_in") {
  if (code === DEFAULT_CURRENCY) return null;
  const r = effectiveRate(code, direction);
  const { exponent } = getCurrency(code);
  const shown = exponent === 0 ? r.toFixed(2) : r.toFixed(4);
  return `1 USD = ${shown} ${code}`;
}
