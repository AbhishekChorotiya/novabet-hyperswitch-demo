"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme, useWallet, WAGERING_MULTIPLIER } from "./Providers";
import { money } from "@/lib/format";

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { balance, cash, bonus, resetWallet } = useWallet();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const links = [
    { href: "/", label: "Home", active: pathname === "/" },
    { href: "/casino", label: "Casino", active: pathname === "/casino" },
    { href: "/#sportsbook", label: "Sports", active: false },
    { href: "/#promos", label: "Promotions", active: false },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-ink-700/50 dark:bg-ink-950/85">
      <div className="container-x flex h-16 items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 lg:hidden dark:border-ink-600 dark:text-slate-300"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>

          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-volt-500 font-display text-lg font-bold text-ink-950 shadow-glow-volt">
              N
            </span>
            <span className="hidden font-display text-xl font-bold tracking-tight min-[420px]:inline">
              NOVA<span className="text-volt-500">BET</span>
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                l.active
                  ? "bg-slate-200/70 text-slate-900 dark:bg-ink-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition-colors hover:border-volt-500 hover:text-volt-600 dark:border-ink-600 dark:text-slate-300 dark:hover:border-volt-500 dark:hover:text-volt-400"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Wallet chip. Opens a menu (like every real betting app) rather
              than resetting on a stray click — a merchant exploring the UI
              must not be able to zero the demo wallet mid-story. */}
          <div className="relative">
            <button
              onClick={() => setWalletOpen((v) => !v)}
              aria-label="Wallet"
              aria-expanded={walletOpen}
              className="flex items-center gap-2 rounded-xl border border-slate-300 px-2.5 py-2 transition-colors hover:border-volt-500 sm:px-3 dark:border-ink-600 dark:hover:border-volt-500"
            >
              <span className="hidden h-2 w-2 rounded-full bg-volt-500 animate-pulse-dot sm:block" />
              <span className="font-display text-xs font-bold tabular-nums sm:text-sm">
                {money(balance)}
              </span>
            </button>

            {walletOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setWalletOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-card-light dark:border-ink-700 dark:bg-ink-850 dark:shadow-card">
                  <div className="space-y-2 px-3 py-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Cash · withdrawable
                      </p>
                      <p className="font-display text-lg font-bold tabular-nums text-volt-600 dark:text-volt-400">
                        {money(cash)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Bonus · {WAGERING_MULTIPLIER}x wagering
                      </p>
                      <p className="font-display text-sm font-bold tabular-nums text-gold-700 dark:text-gold-500">
                        {money(bonus)}
                      </p>
                    </div>
                  </div>
                  <div className="my-1 h-px bg-slate-200 dark:bg-ink-700" />
                  <Link
                    href="/deposit"
                    onClick={() => setWalletOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-ink-800"
                  >
                    Deposit funds
                  </Link>
                  <Link
                    href="/withdraw"
                    onClick={() => setWalletOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-ink-800"
                  >
                    Payout / withdraw cash
                  </Link>
                  <Link
                    href="/responsible-gaming"
                    onClick={() => setWalletOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-ink-800"
                  >
                    Deposit limits
                  </Link>
                  <div className="my-1 h-px bg-slate-200 dark:bg-ink-700" />
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Reset the demo wallet to $0.00? This clears the deposit history for this browser."
                        )
                      ) {
                        resetWallet();
                        setWalletOpen(false);
                      }
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-ink-800"
                  >
                    Reset demo wallet
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Payout CTA. Hidden below `sm`: at 430px the header has only
              ~58px of slack, so a second text button overflows. Mobile reaches
              it via the wallet dropdown and the hamburger menu instead. */}
          <Link
            href="/withdraw"
            className="btn-secondary hidden shrink-0 !px-4 !py-2.5 !text-sm sm:inline-flex"
          >
            Payout
          </Link>

          <Link href="/deposit" className="btn-primary shrink-0 !px-3 !py-2.5 !text-[11px] sm:!px-5 sm:!text-sm">
            Deposit
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-ink-700/50 dark:bg-ink-950">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`block rounded-lg px-4 py-3 text-sm font-semibold ${
                l.active
                  ? "bg-slate-200/70 text-slate-900 dark:bg-ink-800 dark:text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {l.label}
            </Link>
          ))}

          {/* Cashier actions. The header button is hidden on small screens,
              so these are the mobile route to both flows. */}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 dark:border-ink-700/50">
            <Link
              href="/deposit"
              onClick={() => setMenuOpen(false)}
              className="btn-primary !py-3 !text-xs"
            >
              Deposit
            </Link>
            <Link
              href="/withdraw"
              onClick={() => setMenuOpen(false)}
              className="btn-secondary !py-3 !text-xs"
            >
              Payout
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
