import {
  DCC_MARKUP_PCT,
  RATE_TTL_MS,
  RATES,
} from "@/lib/hyperswitch.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Published rate table. A real DCC quote is only good for a short window. */
export async function GET() {
  return Response.json({
    base: "USD",
    markupPct: DCC_MARKUP_PCT,
    ttlMs: RATE_TTL_MS,
    quotedAt: Date.now(),
    rates: Object.fromEntries(
      Object.entries(RATES).map(([code, m]) => [
        code,
        {
          rate: m.rate,
          exponent: m.exponent,
          // Both sides of the spread, so a client can display either.
          payInRate: code === "USD" ? 1 : m.rate * (1 + DCC_MARKUP_PCT / 100),
          payOutRate: code === "USD" ? 1 : m.rate / (1 + DCC_MARKUP_PCT / 100),
        },
      ])
    ),
  });
}
