import Link from "next/link";
import {
  VisaMark,
  MastercardMark,
  ApplePayMark,
  GooglePayMark,
  PaypalMark,
  CryptoMark,
  BankMark,
  AgeBadge,
  LicenseSeal,
  ProvablyFairSeal,
  ResponsibleGamingSeal,
} from "./Brand";

const COLUMNS = [
  {
    title: "Casino",
    items: [
      { label: "Slots", href: "/casino" },
      { label: "Live Casino", href: "/casino" },
      { label: "Blackjack", href: "/casino" },
      { label: "Roulette", href: "/casino" },
      { label: "Game Shows", href: "/casino" },
    ],
  },
  {
    title: "Sports",
    items: [
      { label: "Football", href: "/#sportsbook" },
      { label: "Basketball", href: "/#sportsbook" },
      { label: "Tennis", href: "/#sportsbook" },
      { label: "Esports", href: "/#sportsbook" },
      { label: "Horse Racing", href: "/#sportsbook" },
    ],
  },
  {
    // Compliance links must never land on a bonus promo — that's the one
    // link a compliance officer in the room will click.
    title: "Support",
    items: [
      { label: "Help Center", href: "/responsible-gaming" },
      { label: "Withdrawals", href: "/withdraw" },
      { label: "Responsible Gaming", href: "/responsible-gaming" },
      { label: "Terms of Service", href: "/responsible-gaming" },
      { label: "Privacy Policy", href: "/responsible-gaming" },
      { label: "AML Policy", href: "/responsible-gaming" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 dark:border-ink-700/50 dark:bg-ink-900">
      <div className="container-x">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-volt-500 font-display text-base font-bold text-ink-950">
                N
              </span>
              <span className="font-display text-lg font-bold">
                NOVA<span className="text-volt-500">BET</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              The next-generation casino &amp; sportsbook. Instant deposits, instant withdrawals,
              provably fair games.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <LicenseSeal />
              <ProvablyFairSeal />
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 transition-colors hover:text-volt-600 dark:text-slate-400 dark:hover:text-volt-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payments + trust strip */}
        <div className="mt-10 flex flex-col gap-6 border-t border-slate-200 pt-8 dark:border-ink-700/50">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-slate-500 dark:text-slate-400">
            <VisaMark className="h-4 w-auto text-[#1A1F71] dark:text-slate-200" />
            <MastercardMark className="h-5 w-auto" />
            <ApplePayMark className="h-5 w-auto text-slate-900 dark:text-slate-100" />
            <GooglePayMark className="h-5 w-auto" />
            <PaypalMark className="h-5 w-auto" />
            <CryptoMark className="h-5 w-auto" />
            <BankMark className="h-5 w-auto" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AgeBadge />
            <ResponsibleGamingSeal />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Gambling can be addictive. Set your limits and play within your means.
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            © 2026 NOVABET Demo · Licensed by the Demo Gaming Authority #DGA-12345 · This is a
            demonstration store — payments powered by{" "}
            <span className="font-semibold text-volt-600 dark:text-volt-400">Hyperswitch</span>. No
            real wagers are accepted.
          </p>
        </div>
      </div>
    </footer>
  );
}
