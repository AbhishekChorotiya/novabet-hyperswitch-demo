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
import useSdkIframeHeightFix from "@/lib/useSdkIframeHeightFix";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatCurrency,
  rateLine,
} from "@/lib/currency";

const MIN_WITHDRAWAL = 20;
const MAX_WITHDRAWAL = 10000;
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5252";

export default function WithdrawPage() {
  const { theme } = useTheme();
  const { cash, bonus } = useWallet();

  const [amount, setAmount] = useState("");
  const [confirmedAmount, setConfirmedAmount] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [hyperPromise, setHyperPromise] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [fetching, setFetching] = useState(false);

  // Payout currency. The wallet debit stays in USD; this only changes what
  // the player receives.
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [confirmedCurrency, setConfirmedCurrency] = useState(DEFAULT_CURRENCY);
  const [quote, setQuote] = useState(null);

  const reqId = useRef(0);

  // Only CASH is withdrawable. Bonus funds carry a wagering requirement, so
  // the ceiling here is the cash ledger, never `balance`.
  const withdrawable = cash;

  // Default to the full cash balance once the wallet has hydrated from storage.
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current && withdrawable > 0) {
      seeded.current = true;
      setAmount(String(Math.min(withdrawable, MAX_WITHDRAWAL)));
    }
  }, [withdrawable]);

  const startCheckout = useCallback(async (amt, cur) => {
    const id = ++reqId.current;
    setFetching(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `${SERVER_URL}/create-withdrawal-intent?amount=${amt}&currency=${cur}`
      );
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (id !== reqId.current) return;
      setClientSecret(data.clientSecret);
      setHyperPromise((prev) => prev || loadHyper(data.publishableKey));
      setConfirmedAmount(amt);
      setConfirmedCurrency(data.currency || cur);
      setQuote({
        currency: data.currency,
        payoutAmount: data.payoutAmount,
        usdAmount: data.usdAmount,
        effectiveRate: data.effectiveRate,
        markupPct: data.markupPct,
      });
    } catch (err) {
      if (id !== reqId.current) return;
      setLoadError(
        "Could not reach the payout server. Make sure `npm run server` is running on port 5252."
      );
    } finally {
      if (id === reqId.current) setFetching(false);
    }
  }, []);

  const numeric = Number(amount) || 0;
  const overBalance = numeric > withdrawable;
  const amountValid =
    numeric >= MIN_WITHDRAWAL && numeric <= MAX_WITHDRAWAL && !overBalance;

  const clamped = Math.min(
    Math.max(numeric, MIN_WITHDRAWAL),
    Math.min(MAX_WITHDRAWAL, Math.max(withdrawable, MIN_WITHDRAWAL))
  );

  // Same debounced auto-sync as the deposit page, so the widget and the
  // summary can never disagree about the amount.
  useEffect(() => {
    if (!amountValid) return;
    const t = setTimeout(() => {
      if (numeric !== confirmedAmount || currency !== confirmedCurrency) {
        startCheckout(numeric, currency);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [
    numeric,
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

  const payoutAmount = confirmedAmount ?? 0;
  const syncing =
    fetching ||
    numeric !== confirmedAmount ||
    currency !== confirmedCurrency;
  const blocked = syncing || !amountValid;
  const nothingToWithdraw = withdrawable < MIN_WITHDRAWAL;

  const presets = useMemo(() => {
    const opts = [50, 100, 250, 500].filter((p) => p <= withdrawable);
    return { opts, canMax: withdrawable >= MIN_WITHDRAWAL };
  }, [withdrawable]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container-x py-10 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_420px]">
          {/* LEFT */}
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">
                Cash <span className="text-gradient-volt">Out</span>
              </h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Withdraw your winnings back to the card you deposited with.
              </p>
            </div>

            {/* Wallet split — makes it obvious WHY bonus isn't withdrawable */}
            <div className="card-surface p-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    Withdrawable cash
                  </span>
                  <span className="font-display text-lg font-bold tabular-nums text-volt-600 dark:text-volt-400">
                    {money(cash)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Bonus balance
                    <span className="ml-1 text-xs">(locked)</span>
                  </span>
                  <span className="font-bold tabular-nums text-gold-700 dark:text-gold-500">
                    {money(bonus)}
                  </span>
                </div>
                {bonus > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bonus funds unlock after {WAGERING_MULTIPLIER}x wagering (
                    {money(bonus * WAGERING_MULTIPLIER)}) and cannot be cashed out
                    directly.{" "}
                    <Link
                      href="/responsible-gaming"
                      className="font-semibold text-volt-600 hover:underline dark:text-volt-400"
                    >
                      Bonus T&amp;Cs
                    </Link>
                  </p>
                )}
              </div>

              {nothingToWithdraw ? (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center dark:border-ink-700 dark:bg-ink-850">
                  <p className="text-sm font-semibold">
                    {cash > 0
                      ? `Minimum withdrawal is $${MIN_WITHDRAWAL}.`
                      : "No withdrawable cash yet."}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {cash > 0
                      ? `You have ${money(cash)} in cash.`
                      : "Deposit and play to build a cash balance."}
                  </p>
                  <Link
                    href="/deposit"
                    className="btn-primary mt-4 inline-flex !py-2.5 !text-sm"
                  >
                    Make a deposit
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {presets.opts.map((p) => (
                      <button
                        key={p}
                        onClick={() => setAmount(String(p))}
                        className={`rounded-xl border py-3 font-display text-sm font-bold transition-all ${
                          numeric === p
                            ? "border-volt-500 bg-volt-500/10 text-volt-600 shadow-glow-volt dark:text-volt-400"
                            : "border-slate-300 text-slate-600 hover:border-volt-500/60 dark:border-ink-600 dark:text-slate-300"
                        }`}
                      >
                        ${p}
                      </button>
                    ))}
                    {presets.canMax && (
                      <button
                        onClick={() =>
                          setAmount(String(Math.min(withdrawable, MAX_WITHDRAWAL)))
                        }
                        className={`rounded-xl border py-3 font-display text-sm font-bold transition-all ${
                          numeric === Math.min(withdrawable, MAX_WITHDRAWAL)
                            ? "border-volt-500 bg-volt-500/10 text-volt-600 shadow-glow-volt dark:text-volt-400"
                            : "border-slate-300 text-slate-600 hover:border-volt-500/60 dark:border-ink-600 dark:text-slate-300"
                        }`}
                      >
                        MAX
                      </button>
                    )}
                  </div>

                  <div className="relative mt-4">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      min={MIN_WITHDRAWAL}
                      max={Math.min(MAX_WITHDRAWAL, withdrawable)}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onBlur={() => setAmount(String(clamped))}
                      aria-label="Withdrawal amount"
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
                      {overBalance
                        ? `You can withdraw up to ${money(withdrawable)} in cash.`
                        : `Enter an amount between $${MIN_WITHDRAWAL} and ${money(
                            Math.min(MAX_WITHDRAWAL, withdrawable)
                          )}.`}
                    </p>
                  )}

                  {/* Payout currency. Uses the pay-OUT side of the spread, so
                      the quoted rate here is deliberately worse than the
                      deposit rate — converting both ways has a real cost. */}
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-ink-700 dark:bg-ink-850">
                    <label
                      htmlFor="payout-currency"
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Receive in
                      </span>
                      <select
                        id="payout-currency"
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
                            You&apos;ll receive
                          </span>
                          <span className="font-bold tabular-nums">
                            {quote && quote.currency === currency
                              ? formatCurrency(quote.payoutAmount, quote.currency)
                              : "…"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Payout rate
                          </span>
                          <span className="tabular-nums">
                            {rateLine(currency, "pay_out")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Conversion fee (included)
                          </span>
                          <span className="tabular-nums">
                            {quote?.markupPct ?? 0}%
                          </span>
                        </div>
                        <p className="pt-1 text-slate-500 dark:text-slate-400">
                          <strong className="text-slate-900 dark:text-white">
                            {money(payoutAmount)}
                          </strong>{" "}
                          is deducted from your USD balance. Converting to{" "}
                          {currency} and back has a cost — withdraw in USD to
                          avoid it.
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="rounded border border-slate-300 px-1.5 py-0.5 font-bold dark:border-ink-600">
                      KYC
                    </span>
                    <span>
                      Payouts return to the original payment method. Min $
                      {MIN_WITHDRAWAL} ·{" "}
                      <Link
                        href="/responsible-gaming"
                        className="font-semibold text-volt-600 hover:underline dark:text-volt-400"
                      >
                        Manage your limits
                      </Link>
                    </span>
                  </p>
                </>
              )}
            </div>

            {!nothingToWithdraw && (
              <div className="card-surface overflow-hidden">
                <div className="border-b border-slate-200 px-6 py-4 dark:border-ink-700">
                  <span className="chip bg-volt-500/10 text-volt-600 dark:text-volt-400">
                    PAYOUT SUMMARY
                  </span>
                </div>
                <div className="space-y-3 px-6 py-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Withdrawal amount
                    </span>
                    <span className="font-bold tabular-nums">{money(payoutAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Processing fee
                    </span>
                    <span className="font-bold tabular-nums text-volt-600 dark:text-volt-400">
                      Free
                    </span>
                  </div>
                  {confirmedCurrency !== DEFAULT_CURRENCY &&
                    quote &&
                    quote.currency === confirmedCurrency && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          Paid out in {confirmedCurrency}
                        </span>
                        <span className="font-bold tabular-nums">
                          {formatCurrency(quote.payoutAmount, quote.currency)}
                        </span>
                      </div>
                    )}
                  <div className="h-px bg-slate-200 dark:bg-ink-700" />
                  <div className="flex justify-between font-display text-base">
                    <span className="font-bold">You receive</span>
                    <span className="font-bold tabular-nums text-gradient-volt">
                      {money(payoutAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Remaining cash
                    </span>
                    <span className="font-bold tabular-nums">
                      {money(Math.max(0, cash - payoutAmount))}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Card payouts typically settle in 1–3 business days.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/60 p-4 text-xs text-slate-500 dark:border-ink-700/60 dark:bg-ink-850/60 dark:text-slate-400">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="shrink-0 text-volt-500"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p>
                Withdrawals are verified against your deposit method to prevent
                fraud. Card details are handled entirely by Hyperswitch.
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="card-surface h-fit p-6 lg:sticky lg:top-24">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Payout Destination</h2>
              <span className="chip bg-volt-500/10 text-volt-600 dark:text-volt-400">
                <span className="h-1.5 w-1.5 rounded-full bg-volt-500 animate-pulse-dot" />
                Secure
              </span>
            </div>

            {nothingToWithdraw && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-ink-700 dark:bg-ink-850 dark:text-slate-400">
                Add a cash balance to request a payout.
              </div>
            )}

            {!nothingToWithdraw && loadError && (
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

            {!nothingToWithdraw &&
              !loadError &&
              (!clientSecret || !hyperPromise) && (
                <div className="space-y-3">
                  <div className="hs-skeleton h-12 rounded-xl" />
                  <div className="hs-skeleton h-12 rounded-xl" />
                  <div className="hs-skeleton h-32 rounded-xl" />
                  <div className="hs-skeleton h-12 rounded-xl" />
                </div>
              )}

            {!nothingToWithdraw && !loadError && clientSecret && hyperPromise && (
              <div
                className={
                  blocked
                    ? "pointer-events-none opacity-50 transition-opacity"
                    : "transition-opacity"
                }
              >
                <HyperElements
                  key={`${clientSecret}-${theme}`}
                  options={options}
                  hyper={hyperPromise}
                >
                  <CheckoutForm
                    amount={payoutAmount}
                    disabled={blocked}
                    basePath="/withdraw"
                    ctaLabel={(amt) => <>Withdraw {amt}</>}
                    cardsOnly
                    presentment={
                      confirmedCurrency !== DEFAULT_CURRENCY &&
                      quote &&
                      quote.currency === confirmedCurrency
                        ? {
                            label: formatCurrency(
                              quote.payoutAmount,
                              quote.currency
                            ),
                            verb: "receive",
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
          <Link
            href="/"
            className="font-semibold text-volt-600 hover:underline dark:text-volt-400"
          >
            Back to lobby
          </Link>{" "}
          · Withdrawals are subject to verification. Play responsibly.
        </p>
      </main>

      <Footer />
    </div>
  );
}
