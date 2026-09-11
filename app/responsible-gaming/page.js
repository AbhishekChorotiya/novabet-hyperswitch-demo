"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AgeBadge, LicenseSeal, ResponsibleGamingSeal } from "@/components/Brand";
import { money } from "@/lib/format";

const LIMIT_PRESETS = [100, 500, 1000, 2500, 10000];
const EXCLUSION_PERIODS = ["24 hours", "7 days", "30 days", "6 months", "Permanent"];

export default function ResponsibleGamingPage() {
  const [dailyLimit, setDailyLimit] = useState(10000);
  const [saved, setSaved] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container-x py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <AgeBadge />
            <LicenseSeal />
            <ResponsibleGamingSeal />
          </div>

          <h1 className="mt-8 font-display text-4xl font-bold sm:text-5xl">
            Responsible <span className="text-gradient-volt">Gaming</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Gambling should stay entertainment. Set your own limits, take a break whenever you want,
            and we&apos;ll enforce it — no questions asked.
          </p>

          {/* Deposit limits */}
          <section className="card-surface mt-10 p-6 md:p-8">
            <h2 className="font-display text-xl font-bold">Daily deposit limit</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Applies across every payment method. Decreases take effect immediately; increases take
              24 hours.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {LIMIT_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setDailyLimit(p);
                    setSaved(false);
                  }}
                  className={`rounded-xl border px-5 py-3 font-display text-sm font-bold transition-all ${
                    dailyLimit === p
                      ? "border-volt-500 bg-volt-500/10 text-volt-600 shadow-glow-volt dark:text-volt-400"
                      : "border-slate-300 text-slate-600 hover:border-volt-500/60 dark:border-ink-600 dark:text-slate-300"
                  }`}
                >
                  {money(p).replace(".00", "")}
                </button>
              ))}
            </div>

            <button onClick={() => setSaved(true)} className="btn-primary mt-6">
              {saved ? "Limit saved ✓" : `Set limit to ${money(dailyLimit).replace(".00", "")}`}
            </button>

            {saved && (
              <p className="mt-3 text-sm font-semibold text-volt-600 dark:text-volt-400">
                Your daily deposit limit is now {money(dailyLimit).replace(".00", "")}. Deposits
                beyond this are declined automatically.
              </p>
            )}
          </section>

          {/* Self exclusion */}
          <section className="card-surface mt-6 p-6 md:p-8">
            <h2 className="font-display text-xl font-bold">Take a break</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              We&apos;ll lock your account and stop all marketing for the period you choose.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {EXCLUSION_PERIODS.map((p) => (
                <span
                  key={p}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:border-ink-600 dark:text-slate-300"
                >
                  {p}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Demo surface — self-exclusion is not wired up in this demonstration store.
            </p>
          </section>

          {/* Help */}
          <section className="card-surface mt-6 p-6 md:p-8">
            <h2 className="font-display text-xl font-bold">Need help?</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <span className="font-semibold">BeGambleAware</span> — free, confidential support,
                24/7
              </li>
              <li>
                <span className="font-semibold">GamCare</span> — counselling and self-assessment
                tools
              </li>
              <li>
                <span className="font-semibold">Gamblers Anonymous</span> — peer support groups
              </li>
            </ul>
            <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
              NOVABET is a demonstration store. Licensed by the Demo Gaming Authority #DGA-12345.
              18+ only. No real wagers are accepted.
            </p>
          </section>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/deposit" className="btn-ghost flex-1 !py-4">
              Back to Deposit
            </Link>
            <Link href="/" className="btn-ghost flex-1 !py-4">
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
