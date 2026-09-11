"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWallet, WAGERING_MULTIPLIER } from "@/components/Providers";
import { money } from "@/lib/format";
import { formatCurrency, fromMinorUnits } from "@/lib/currency";

// Same-origin Next route handlers (app/api/*). No separate server to keep
// alive, and no CORS — the API is deployed with the app.
const SERVER_URL = "/api";
// Settled states only. `processing` / `requires_capture` are NOT credited:
// crediting an unsettled bank push or an uncaptured auth would hand a player
// wagerable, cashoutable balance before the money has actually cleared.
const SUCCESS_STATES = ["succeeded", "partially_captured"];
const PENDING_STATES = ["processing", "requires_capture"];

const FAILURE_COPY = {
  unverified:
    "We couldn't verify a payment for this link, so no funds were credited.",
  mismatch:
    "This payment reference doesn't match our records, so no funds were credited.",
  unreachable:
    "We couldn't reach our payment service to confirm this deposit. Nothing was credited — please retry.",
};

const FAILURE_LABEL = {
  unverified: "Unverified",
  mismatch: "Verification failed",
  unreachable: "Could not verify",
};

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.6 + Math.random() * 1.8,
        size: 6 + Math.random() * 8,
        color: ["#00E701", "#FFB800", "#FF2E55", "#6C5CE7", "#7CFFB2"][i % 5],
        rotate: Math.random() * 360,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden motion-reduce:hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute -top-4 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s 2 forwards`,
            borderRadius: 2,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-24px) rotate(0deg);
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(540deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-x flex flex-col items-center py-16 md:py-24">
        <div className="w-full max-w-lg text-center">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

function SuccessContent() {
  const params = useSearchParams();
  const { balance, cash, bonus: bonusBalance, credit } = useWallet();

  const clientSecret = params.get("payment_intent_client_secret") || "";

  // "verifying" | "success" | "pending" | "failed"
  const [phase, setPhase] = useState("verifying");
  const [payment, setPayment] = useState(null);
  const [prevBalance, setPrevBalance] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const creditOnce = (paymentId, amt, bonusAmt) => {
      // Idempotency: a deposit is credited at most once per payment id,
      // so refreshing or navigating back never double-credits the wallet.
      const key = `novabet-credited:${paymentId}`;
      let baseline = 0;
      try {
        if (localStorage.getItem(key)) return;
        // Read the pre-credit balance straight from storage: the `balance`
        // closed over by this effect is the pre-hydration value (0), which
        // would make the count-up start from $0 on every repeat deposit.
        baseline = Number(localStorage.getItem("novabet-balance")) || 0;
        localStorage.setItem(key, String(Date.now()));
      } catch (e) {}
      setPrevBalance(baseline);
      credit(amt, bonusAmt);
    };

    /*
     * SECURITY: the wallet is credited ONLY from a 2xx /payment-status
     * response. There is deliberately no fallback that trusts the redirect
     * query string — `amount` and `status` in the URL are attacker-controlled,
     * so a 403 (client_secret mismatch), a 404 (unknown payment) or an
     * unreachable server must all end in "not completed", never in a credit.
     */
    const run = async () => {
      if (!clientSecret) {
        setPhase("failed");
        setPayment({ status: "unverified", verified: false });
        return;
      }

      let res;
      try {
        res = await fetch(
          `${SERVER_URL}/payment-status?client_secret=${encodeURIComponent(clientSecret)}`
        );
      } catch (e) {
        setPhase("failed");
        setPayment({ status: "unreachable", verified: false });
        return;
      }

      if (!res.ok) {
        // Server reached and rejected -> terminal. Do not credit.
        setPhase("failed");
        setPayment({
          status: res.status === 403 ? "mismatch" : "unverified",
          verified: false,
        });
        return;
      }

      const data = await res.json();
      const ok = SUCCESS_STATES.includes(data.status);
      const pending = PENDING_STATES.includes(data.status);
      const amt = (Number(data.amount) || 0) / 100;
      const bonusAmt = Math.min(amt * 2, 1000);

      setPayment({
        id: data.paymentId,
        amount: amt,
        bonus: bonusAmt,
        status: data.status,
        method: data.paymentMethodType || data.paymentMethod || "card",
        // With DCC the charge currency differs from the wallet currency.
        presentmentAmount: data.presentmentAmount,
        presentmentCurrency: data.presentmentCurrency,
        fxRate: data.fxRate,
        fxMarkupPct: data.fxMarkupPct,
        verified: true,
      });

      if (ok) creditOnce(data.paymentId, amt, bonusAmt);
      setPhase(ok ? "success" : pending ? "pending" : "failed");
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count up from the pre-deposit balance so the *credit* is the story,
  // not the total. Driven off `balance` only; `prevBalance` is captured
  // synchronously from storage in creditOnce before credit() lands.
  const [displayBalance, setDisplayBalance] = useState(0);
  useEffect(() => {
    if (phase !== "success") return;
    const from = prevBalance;
    const to = balance;
    let frame;
    const start = performance.now();
    const animate = (t) => {
      const p = Math.min((t - start) / 1100, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayBalance(from + (to - from) * eased);
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [phase, balance, prevBalance]);

  if (phase === "verifying") {
    return (
      <Shell>
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-volt-500/10">
          <span className="h-12 w-12 animate-spin rounded-full border-[3px] border-volt-500/25 border-t-volt-500" />
        </div>
        <h1 className="mt-8 font-display text-3xl font-bold">Verifying payment…</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Confirming your deposit with Hyperswitch. This takes a second.
        </p>
        <div className="card-surface mt-10 space-y-3 p-6">
          <div className="hs-skeleton h-10 rounded-xl" />
          <div className="hs-skeleton h-6 rounded-lg" />
          <div className="hs-skeleton h-6 rounded-lg" />
        </div>
      </Shell>
    );
  }

  if (phase === "failed") {
    return (
      <Shell>
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-ember-500/15">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ember-500 text-white shadow-glow-ember">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </div>
        </div>

        <h1 className="mt-8 font-display text-4xl font-bold sm:text-5xl">
          Deposit <span className="text-ember-500">Not Completed</span>
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          {FAILURE_COPY[payment?.status] ||
            "Your payment didn't go through, so nothing was charged and your balance is unchanged."}
        </p>

        <div className="card-surface mt-8 space-y-3 px-6 py-5 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Payment status</span>
            <span className="font-bold capitalize text-ember-500">
              {FAILURE_LABEL[payment?.status] ||
                String(payment?.status || "failed").replaceAll("_", " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Wallet balance</span>
            <span className="font-bold tabular-nums">{money(balance)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/deposit" className="btn-primary flex-1 !py-4">
            Try Again
          </Link>
          <Link href="/casino" className="btn-ghost flex-1 !py-4">
            Back to Casino
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-500 dark:text-slate-400">
          No funds were taken. Try another payment method — we support cards, wallets, bank
          transfers and crypto.
        </p>
      </Shell>
    );
  }

  if (phase === "pending") {
    return (
      <Shell>
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gold-500/15">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-500 text-ink-950 shadow-glow-gold">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
        </div>

        <h1 className="mt-8 font-display text-4xl font-bold sm:text-5xl">
          Deposit <span className="text-gradient-gold">Pending</span>
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Your payment is confirmed but not yet settled. Funds unlock in your wallet the moment it
          clears — usually within minutes.
        </p>

        <div className="card-surface mt-8 space-y-3 px-6 py-5 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Deposit amount</span>
            <span className="font-bold tabular-nums">{money(payment?.amount ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Payment status</span>
            <span className="font-bold capitalize text-gold-700 dark:text-gold-500">
              {String(payment?.status || "processing").replaceAll("_", " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Available to play</span>
            <span className="font-bold tabular-nums">{money(balance)}</span>
          </div>
          {payment?.id && (
            <div className="flex justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="shrink-0">Transaction ID</span>
              <span className="truncate font-mono">{payment.id}</span>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/casino" className="btn-primary flex-1 !py-4">
            Browse Casino
          </Link>
          <Link href="/deposit" className="btn-ghost flex-1 !py-4">
            Deposit Again
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-500 dark:text-slate-400">
          Bonus funds are applied once the deposit settles. We&apos;ll email you on confirmation.
        </p>
      </Shell>
    );
  }

  const amount = payment?.amount ?? 0;
  const bonus = payment?.bonus ?? 0;

  return (
    <>
      <Confetti />
      <Shell>
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-volt-500/15">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-volt-500 text-ink-950 shadow-glow-volt-lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>

        <h1 className="mt-8 font-display text-4xl font-bold sm:text-5xl">
          You&apos;re <span className="text-gradient-volt">Loaded!</span>
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Your deposit settled and your funds are ready to play.
        </p>

        <div className="card-surface mt-10 overflow-hidden text-left">
          <div className="bg-gradient-to-r from-volt-500/15 to-transparent px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              New wallet balance
            </p>
            <p className="mt-1 font-display text-4xl font-bold tabular-nums text-gradient-volt">
              {money(displayBalance)}
            </p>
            <p className="mt-1 text-xs font-semibold text-volt-600 dark:text-volt-400">
              +{money(amount + bonus)} credited instantly
            </p>
          </div>
          <div className="space-y-3 px-6 py-5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Deposit amount</span>
              <span className="font-bold tabular-nums">{money(amount)}</span>
            </div>
            {/* DCC: show what was actually charged, and at what rate. */}
            {payment?.presentmentCurrency &&
              payment.presentmentCurrency !== "USD" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Charged
                    </span>
                    <span className="font-bold tabular-nums">
                      {/* The API returns minor units; the divisor depends on
                          the currency's exponent (JPY is zero-decimal, so
                          dividing by 100 would show ¥160.92 for a ¥16,092
                          charge). */}
                      {formatCurrency(
                        fromMinorUnits(
                          payment.presentmentAmount,
                          payment.presentmentCurrency
                        ),
                        payment.presentmentCurrency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Rate applied
                    </span>
                    <span className="tabular-nums text-xs">
                      1 USD = {Number(payment.fxRate).toFixed(4)}{" "}
                      {payment.presentmentCurrency}
                      {payment.fxMarkupPct
                        ? ` (incl. ${payment.fxMarkupPct}% fee)`
                        : ""}
                    </span>
                  </div>
                </>
              )}
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                Welcome bonus (200% up to $1,000)
              </span>
              <span className="font-bold tabular-nums text-gold-700 dark:text-gold-500">+{money(bonus)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Free spins</span>
              <span className="font-bold text-volt-600 dark:text-volt-400">100 spins credited</span>
            </div>
            <div className="h-px bg-slate-200 dark:bg-ink-700" />
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Cash (withdrawable)</span>
              <span className="font-bold tabular-nums text-volt-600 dark:text-volt-400">
                {money(cash)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                Bonus ({WAGERING_MULTIPLIER}x wagering)
              </span>
              <span className="font-bold tabular-nums text-gold-700 dark:text-gold-500">
                {money(bonusBalance)}
              </span>
            </div>
            {bonus > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wagering requirement: {WAGERING_MULTIPLIER}x bonus ={" "}
                <span className="font-semibold">{money(bonus * WAGERING_MULTIPLIER)}</span> to
                unlock for withdrawal.{" "}
                <Link
                  href="/responsible-gaming"
                  className="font-semibold text-volt-600 hover:underline dark:text-volt-400"
                >
                  Bonus T&amp;Cs
                </Link>
              </p>
            )}
            <div className="h-px bg-slate-200 dark:bg-ink-700" />
            {payment?.id && (
              <div className="flex justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="shrink-0">Transaction ID</span>
                <span className="truncate font-mono">{payment.id}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Payment method</span>
              <span className="font-semibold capitalize">
                {String(payment?.method || "card").replaceAll("_", " ")}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Processed by</span>
              <span className="font-semibold text-volt-600 dark:text-volt-400">
                Hyperswitch
                {payment?.verified && (
                  <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">· verified</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/casino" className="btn-primary flex-1 !py-4">
            Start Playing →
          </Link>
          <Link href="/" className="btn-ghost flex-1 !py-4">
            Back to Home
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-500 dark:text-slate-400">
          A receipt has been sent to your email. Play responsibly — set your deposit limits in
          account settings.
        </p>
      </Shell>
    </>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SuccessContent />
    </Suspense>
  );
}
