"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWallet } from "@/components/Providers";
import { money } from "@/lib/format";
import { formatCurrency, fromMinorUnits } from "@/lib/currency";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5252";

// A withdrawal is only debited once the underlying transaction has settled.
const SUCCESS_STATES = ["succeeded", "partially_captured"];
const PENDING_STATES = ["processing", "requires_capture"];

const FAILURE_COPY = {
  unverified:
    "We couldn't verify a withdrawal for this link, so nothing was deducted from your balance.",
  mismatch:
    "This payout reference doesn't match our records, so nothing was deducted from your balance.",
  wrongtype:
    "This reference isn't a withdrawal, so nothing was deducted from your balance.",
  unreachable:
    "We couldn't reach our payout service to confirm this withdrawal. Nothing was deducted — please retry.",
  declined:
    "Your bank declined this payout. Your balance is unchanged — please try again or use another method.",
};

const FAILURE_LABEL = {
  unverified: "Unverified",
  mismatch: "Verification failed",
  wrongtype: "Invalid reference",
  unreachable: "Could not verify",
  declined: "Declined",
};

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

function WithdrawResult() {
  const params = useSearchParams();
  const { cash, debit } = useWallet();

  const clientSecret = params.get("payment_intent_client_secret") || "";

  // "verifying" | "success" | "pending" | "failed"
  const [phase, setPhase] = useState("verifying");
  const [payout, setPayout] = useState(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const debitOnce = (paymentId, amt) => {
      // Idempotency: a withdrawal is debited at most once per payment id, so
      // refreshing the receipt never double-deducts the player's balance.
      const key = `novabet-debited:${paymentId}`;
      try {
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, String(Date.now()));
      } catch (e) {}
      debit(amt);
    };

    /*
     * SECURITY: mirrors the deposit receipt. The balance is debited ONLY from
     * a 2xx /withdrawal-status response, whose amount comes from the intent's
     * server-set metadata — never from the `amount` in this URL, which is
     * attacker-controlled. A 403 (secret mismatch), 409 (a deposit intent
     * replayed here), 404 or an unreachable server all end in "not completed".
     */
    const run = async () => {
      if (!clientSecret) {
        setPhase("failed");
        setPayout({ status: "unverified", verified: false });
        return;
      }

      let res;
      try {
        res = await fetch(
          `${SERVER_URL}/withdrawal-status?client_secret=${encodeURIComponent(
            clientSecret
          )}`
        );
      } catch (e) {
        setPhase("failed");
        setPayout({ status: "unreachable", verified: false });
        return;
      }

      if (!res.ok) {
        setPhase("failed");
        setPayout({
          status:
            res.status === 403
              ? "mismatch"
              : res.status === 409
              ? "wrongtype"
              : "unverified",
          verified: false,
        });
        return;
      }

      const data = await res.json();
      const ok = SUCCESS_STATES.includes(data.status);
      const pending = PENDING_STATES.includes(data.status);
      const amt = (Number(data.amount) || 0) / 100;

      setPayout({
        id: data.paymentId,
        amount: amt,
        status: ok || pending ? data.status : "declined",
        method: data.paymentMethodType || data.paymentMethod || "card",
        // Payout may settle in a different currency than the USD wallet.
        payoutAmount: data.payoutAmount,
        payoutCurrency: data.payoutCurrency,
        fxRate: data.fxRate,
        fxMarkupPct: data.fxMarkupPct,
        verified: true,
      });

      if (ok) debitOnce(data.paymentId, amt);
      setPhase(ok ? "success" : pending ? "pending" : "failed");
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "verifying") {
    return (
      <Shell>
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-volt-500/10">
          <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-volt-500/30 border-t-volt-500" />
        </div>
        <h1 className="mt-8 font-display text-2xl font-bold">
          Verifying your withdrawal…
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Confirming the payout with Hyperswitch.
        </p>
      </Shell>
    );
  }

  if (phase === "pending") {
    return (
      <Shell>
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gold-500/10">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFB800"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <h1 className="mt-8 font-display text-3xl font-bold">Withdrawal Pending</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Your payout of{" "}
          <strong className="text-slate-900 dark:text-white">
            {money(payout?.amount || 0)}
          </strong>{" "}
          is being processed. Your balance will update once it settles.
        </p>
        <div className="card-surface mt-8 space-y-3 p-6 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Status</span>
            <span className="font-semibold text-gold-700 dark:text-gold-500">
              {payout?.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Reference</span>
            <span className="font-mono text-xs">{payout?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Available cash
            </span>
            <span className="font-bold tabular-nums">{money(cash)}</span>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/casino" className="btn-primary !px-6 !py-3">
            Back to Casino
          </Link>
          <Link href="/withdraw" className="btn-secondary !px-6 !py-3">
            Withdrawals
          </Link>
        </div>
      </Shell>
    );
  }

  if (phase === "failed") {
    const key = payout?.status || "unverified";
    return (
      <Shell>
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-ember-500/10">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF2E55"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <h1 className="mt-8 font-display text-3xl font-bold">
          Withdrawal Not Completed
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          {FAILURE_COPY[key] || FAILURE_COPY.unverified}
        </p>

        <div className="card-surface mt-8 space-y-3 p-6 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Status</span>
            <span className="font-semibold text-ember-500">
              {FAILURE_LABEL[key] || FAILURE_LABEL.unverified}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Balance deducted
            </span>
            <span className="font-semibold">None</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Available cash
            </span>
            <span className="font-bold tabular-nums">{money(cash)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/withdraw" className="btn-primary !px-6 !py-3">
            Try Again
          </Link>
          <Link href="/casino" className="btn-ghost !px-6 !py-3">
            Back to Casino
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-volt-500/10 shadow-glow-volt">
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00E701"
          strokeWidth="2.5"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      </div>

      <h1 className="mt-8 font-display text-4xl font-bold">
        Withdrawal <span className="text-gradient-volt">Confirmed</span>
      </h1>
      <p className="mt-3 text-slate-500 dark:text-slate-400">
        {money(payout?.amount || 0)} is on its way to your card.
      </p>

      <div className="card-surface mt-8 overflow-hidden text-left">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-ink-700">
          <span className="chip bg-volt-500/10 text-volt-600 dark:text-volt-400">
            PAYOUT RECEIPT
          </span>
        </div>
        <div className="space-y-3 px-6 py-5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Amount</span>
            <span className="font-bold tabular-nums">
              {money(payout?.amount || 0)}
            </span>
          </div>
          {payout?.payoutCurrency && payout.payoutCurrency !== "USD" && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Paid out
                </span>
                <span className="font-bold tabular-nums">
                  {formatCurrency(
                    fromMinorUnits(payout.payoutAmount, payout.payoutCurrency),
                    payout.payoutCurrency
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Rate applied
                </span>
                <span className="tabular-nums text-xs">
                  1 USD = {Number(payout.fxRate).toFixed(4)}{" "}
                  {payout.payoutCurrency}
                  {payout.fxMarkupPct
                    ? ` (incl. ${payout.fxMarkupPct}% fee)`
                    : ""}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Destination</span>
            <span className="font-semibold capitalize">{payout?.method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Arrives</span>
            <span className="font-semibold">1–3 business days</span>
          </div>
          <div className="h-px bg-slate-200 dark:bg-ink-700" />
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Remaining cash
            </span>
            <span className="font-display text-base font-bold tabular-nums text-gradient-volt">
              {money(cash)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Reference</span>
            <span className="font-mono text-xs">{payout?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Status</span>
            <span className="font-semibold text-volt-600 dark:text-volt-400">
              Hyperswitch · verified
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/casino" className="btn-primary !px-6 !py-3">
          Back to Casino
        </Link>
        <Link href="/withdraw" className="btn-secondary !px-6 !py-3">
          Withdraw Again
        </Link>
      </div>

      <p className="mt-8 text-xs text-slate-500 dark:text-slate-400">
        Need help?{" "}
        <Link
          href="/responsible-gaming"
          className="font-semibold text-volt-600 hover:underline dark:text-volt-400"
        >
          Support &amp; limits
        </Link>
      </p>
    </Shell>
  );
}

export default function WithdrawSuccessPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-volt-500/10">
            <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-volt-500/30 border-t-volt-500" />
          </div>
        </Shell>
      }
    >
      <WithdrawResult />
    </Suspense>
  );
}
