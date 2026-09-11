"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { loadHyper } from "@juspay-tech/hyper-js";
import { HyperElements } from "@juspay-tech/react-hyper-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutForm from "@/components/CheckoutForm";
import { useTheme, useWallet, WAGERING_MULTIPLIER } from "@/components/Providers";
import { buildAppearance } from "@/lib/hyperAppearance";
import { money } from "@/lib/format";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatCurrency,
  rateLine,
} from "@/lib/currency";
import useSdkIframeHeightFix from "@/lib/useSdkIframeHeightFix";

const PRESETS = [25, 50, 100, 250, 500, 1000];
const MIN_DEPOSIT = 10;
const MAX_DEPOSIT = 10000;
// Same-origin Next route handlers (app/api/*). No separate server to keep
// alive, and no CORS — the API is deployed with the app.
const SERVER_URL = "/api";

export default function DepositPage() {
  const { theme } = useTheme();
  const { balance } = useWallet();

  const [amount, setAmount] = useState(100);
  const [confirmedAmount, setConfirmedAmount] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [hyperPromise, setHyperPromise] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [fetching, setFetching] = useState(false);

  // Dynamic Currency Conversion: the wallet stays in USD, but the player can
  // choose the currency they are charged in.
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [confirmedCurrency, setConfirmedCurrency] = useState(DEFAULT_CURRENCY);
  // The quote the SERVER used for the live intent. Displaying the server's
  // figure rather than a locally computed one keeps the screen and the charge
  // in agreement.
  const [quote, setQuote] = useState(null);

  const reqId = useRef(0);

  const startCheckout = useCallback(async (amt, cur) => {
    const id = ++reqId.current;
    setFetching(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `${SERVER_URL}/create-payment-intent?amount=${amt}&currency=${cur}`
      );
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      // Ignore stale responses so the rendered widget always matches the
      // last requested amount AND currency.
      if (id !== reqId.current) return;
      setClientSecret(data.clientSecret);
      setHyperPromise((prev) => prev || loadHyper(data.publishableKey));
      setConfirmedAmount(amt);
      setConfirmedCurrency(data.currency || cur);
      setQuote({
        currency: data.currency,
        presentmentAmount: data.presentmentAmount,
        usdAmount: data.usdAmount,
        effectiveRate: data.effectiveRate,
        markupPct: data.markupPct,
      });
    } catch (err) {
      if (id !== reqId.current) return;
      setLoadError(
        "Could not reach the payment service. Please check your connection and retry."
      );
    } finally {
      if (id === reqId.current) setFetching(false);
    }
  }, []);

  const clamped = Math.min(Math.max(Number(amount) || 0, MIN_DEPOSIT), MAX_DEPOSIT);
  const amountValid = Number(amount) >= MIN_DEPOSIT && Number(amount) <= MAX_DEPOSIT;

  // Auto-sync the payment intent whenever the amount changes (debounced),
  // so the widget, the summary and the pay button can never disagree.
  useEffect(() => {
    if (!amountValid) return;
    const t = setTimeout(() => {
      if (Number(amount) !== confirmedAmount || currency !== confirmedCurrency) {
        startCheckout(Number(amount), currency);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [
    amount,
    currency,
    amountValid,
    confirmedAmount,
    confirmedCurrency,
    startCheckout,
  ]);

  const appearance = useMemo(() => buildAppearance(theme), [theme]);

  // Keep the SDK iframe from either collapsing or padding itself with
  // dead space when it reports an implausible height.
  useSdkIframeHeightFix([clientSecret, theme]);

  const options = useMemo(
    () => ({ clientSecret, appearance, loader: "never" }),
    [clientSecret, appearance]
  );

  // Every figure on this page derives from confirmedAmount — the amount the
  // payment intent was actually created for.
  const chargeAmount = confirmedAmount ?? 0;
  const bonus = Math.min(chargeAmount * 2, 1000);
  const bonusPct = chargeAmount > 0 ? Math.round((bonus / chargeAmount) * 100) : 0;
  // The widget must be blocked whenever what's on screen could differ from
  // what will actually be charged: mid-sync OR an invalid amount (where we
  // deliberately don't create a new intent, leaving a stale one mounted).
  const syncing =
    fetching ||
    Number(amount) !== confirmedAmount ||
    currency !== confirmedCurrency;
  const blocked = syncing || !amountValid;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container-x py-10 md:py-16">
        {/* Steps */}
        <div className="mx-auto mb-10 flex max-w-3xl items-center justify-center gap-3 text-xs font-semibold uppercase tracking-wider">
          {["Amount", "Payment", "Play"].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    i < 2
                      ? "bg-volt-500 text-ink-950"
                      : "bg-slate-200 text-slate-500 dark:bg-ink-700 dark:text-slate-400"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={i < 2 ? "" : "text-slate-500 dark:text-slate-400"}>{step}</span>
              </div>
              {i < 2 && <span className="h-px w-10 bg-slate-300 dark:bg-ink-600" />}
            </div>
          ))}
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_420px]">
          {/* LEFT */}
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">
                Fund Your <span className="text-gradient-volt">Wallet</span>
              </h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Choose an amount — your funds are credited the moment payment completes.
              </p>
            </div>

            <div className="card-surface p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Current balance
                </span>
                <span className="font-display text-lg font-bold tabular-nums">
                  {money(balance)}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(p)}
                    className={`rounded-xl border py-3 font-display text-sm font-bold transition-all ${
                      Number(amount) === p
                        ? "border-volt-500 bg-volt-500/10 text-volt-600 shadow-glow-volt dark:text-volt-400"
                        : "border-slate-300 text-slate-600 hover:border-volt-500/60 dark:border-ink-600 dark:text-slate-300"
                    }`}
                  >
                    ${p}
                  </button>
                ))}
              </div>

              <div className="relative mt-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min={MIN_DEPOSIT}
                  max={MAX_DEPOSIT}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={() => setAmount(clamped)}
                  aria-label="Deposit amount"
                  className={`w-full rounded-xl border bg-white py-3.5 pl-9 pr-28 font-display text-lg font-bold outline-none transition-colors dark:bg-ink-850 dark:text-white ${
                    amountValid
                      ? "border-slate-300 focus:border-volt-500 dark:border-ink-600"
                      : "border-ember-500 text-ember-500"
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  {blocked && amountValid ? (
                    <span className="flex items-center gap-1.5 text-volt-600 dark:text-volt-400">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-volt-500/30 border-t-volt-500" />
                      Syncing
                    </span>
                  ) : (
                    "USD"
                  )}
                </span>
              </div>

              {!amountValid && (
                <p className="mt-2 text-xs font-semibold text-ember-500">
                  Enter an amount between ${MIN_DEPOSIT} and ${MAX_DEPOSIT.toLocaleString("en-US")}.
                </p>
              )}

              {/* Dynamic Currency Conversion.
                  Wallet stays USD; this only changes the charge currency. */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-ink-700 dark:bg-ink-850">
                <label
                  htmlFor="dcc-currency"
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Pay in your currency
                  </span>
                  <select
                    id="dcc-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none transition-colors focus:border-volt-500 dark:border-ink-600 dark:bg-ink-800 dark:text-white"
                  >
                    {Object.entries(CURRENCIES).map(([code, c]) => (
                      <option key={code} value={code}>
                        {code} · {c.symbol}
                      </option>
                    ))}
                  </select>
                </label>

                {currency !== DEFAULT_CURRENCY && (
                  <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-xs dark:border-ink-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        You&apos;ll be charged
                      </span>
                      <span className="font-bold tabular-nums">
                        {quote && quote.currency === currency
                          ? formatCurrency(quote.presentmentAmount, quote.currency)
                          : "…"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Exchange rate
                      </span>
                      <span className="tabular-nums">{rateLine(currency)}</span>
                    </div>
                    {/* Disclosing the FX margin is a regulatory requirement
                        for DCC, not a nicety — it must not be hidden in the
                        rate. */}
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Conversion fee (included)
                      </span>
                      <span className="tabular-nums">
                        {quote?.markupPct ?? 0}%
                      </span>
                    </div>
                    <p className="pt-1 text-slate-500 dark:text-slate-400">
                      Your wallet is credited{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {money(chargeAmount)}
                      </strong>{" "}
                      in USD. Rates are indicative and refresh on each change.
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded border border-slate-300 px-1.5 py-0.5 font-bold dark:border-ink-600">
                  18+
                </span>
                <span>
                  Per-deposit limit ${MAX_DEPOSIT.toLocaleString("en-US")} ·{" "}
                  <Link
                    href="/responsible-gaming"
                    className="font-semibold text-volt-600 hover:underline dark:text-volt-400"
                  >
                    Manage your limits
                  </Link>
                </span>
              </p>
            </div>

            {/* Bonus summary — always derived from the charged amount */}
            <div className="card-surface overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-gold-500/15 to-transparent px-6 py-4 dark:border-ink-700">
                <span className="chip bg-gold-500 text-ink-950">WELCOME BONUS APPLIED</span>
              </div>
              <div className="space-y-3 px-6 py-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Deposit</span>
                  <span className="font-bold tabular-nums">{money(chargeAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Welcome bonus (200% up to $1,000)
                    {bonus === 1000 && chargeAmount > 500 && (
                      <span className="ml-1 text-xs text-gold-700 dark:text-gold-500">max reached</span>
                    )}
                  </span>
                  <span className="font-bold tabular-nums text-gold-700 dark:text-gold-500">+{money(bonus)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Free spins</span>
                  <span className="font-bold text-volt-600 dark:text-volt-400">100 spins</span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-ink-700" />
                <div className="flex justify-between font-display text-base">
                  <span className="font-bold">Total playable</span>
                  <span className="font-bold tabular-nums text-gradient-volt">
                    {money(chargeAmount + bonus)}
                  </span>
                </div>
                {bonus > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {money(chargeAmount)} cash (withdrawable) + {money(bonus)} bonus, subject to{" "}
                    {WAGERING_MULTIPLIER}x wagering ({money(bonus * WAGERING_MULTIPLIER)}).{" "}
                    <Link
                      href="/responsible-gaming"
                      className="font-semibold text-volt-600 hover:underline dark:text-volt-400"
                    >
                      Bonus T&amp;Cs
                    </Link>
                  </p>
                )}
                {bonusPct > 0 && bonusPct < 200 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Effective bonus at this amount: {bonusPct}%
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/60 p-4 text-xs text-slate-500 dark:border-ink-700/60 dark:bg-ink-850/60 dark:text-slate-400">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-volt-500">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p>
                Your card details never touch NOVABET servers. All transactions are processed by
                Hyperswitch on PCI DSS Level 1 infrastructure.
              </p>
            </div>
          </div>

          {/* RIGHT — Hyperswitch Unified Checkout */}
          <div className="card-surface h-fit p-6 lg:sticky lg:top-24">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Payment Method</h2>
              <span className="chip bg-volt-500/10 text-volt-600 dark:text-volt-400">
                <span className="h-1.5 w-1.5 rounded-full bg-volt-500 animate-pulse-dot" />
                Secure
              </span>
            </div>

            {loadError && (
              <div className="rounded-xl border border-ember-500/40 bg-ember-500/10 px-4 py-4 text-sm text-ember-500">
                {loadError}
                <button
                  onClick={() => startCheckout(clamped, currency)}
                  className="mt-3 block w-full rounded-lg border border-ember-500/50 py-2 font-semibold transition-colors hover:bg-ember-500/10"
                >
                  Retry
                </button>
              </div>
            )}

            {!loadError && (!clientSecret || !hyperPromise) && (
              <div className="space-y-3">
                <div className="hs-skeleton h-12 rounded-xl" />
                <div className="hs-skeleton h-12 rounded-xl" />
                <div className="hs-skeleton h-32 rounded-xl" />
                <div className="hs-skeleton h-12 rounded-xl" />
              </div>
            )}

            {!loadError && clientSecret && hyperPromise && (
              /*
               * The `key` forces a full remount of HyperElements whenever the
               * client secret OR the site theme changes. The SDK reads
               * `appearance` (theme / variables / rules / colorScheme) at
               * element-creation time, so a remount is what makes the widget
               * re-render in dark vs light.
               */
              <div className={blocked ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
                <HyperElements
                  key={`${clientSecret}-${theme}`}
                  options={options}
                  hyper={hyperPromise}
                >
                  <CheckoutForm
                    amount={chargeAmount}
                    disabled={blocked}
                    presentment={
                      confirmedCurrency !== DEFAULT_CURRENCY &&
                      quote &&
                      quote.currency === confirmedCurrency
                        ? {
                            label: formatCurrency(
                              quote.presentmentAmount,
                              quote.currency
                            ),
                          }
                        : null
                    }
                  />
                </HyperElements>
              </div>
            )}
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400">
          Demo store ·{" "}
          <Link href="/" className="font-semibold text-volt-600 hover:underline dark:text-volt-400">
            Back to lobby
          </Link>{" "}
          · Deposits are subject to responsible gaming limits. Play responsibly.
        </p>
      </main>

      <Footer />
    </div>
  );
}
