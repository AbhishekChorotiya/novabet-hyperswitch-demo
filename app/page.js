import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WinTicker from "@/components/WinTicker";
import JackpotCounter from "@/components/JackpotCounter";
import LiveOdds from "@/components/LiveOdds";
import {
  VisaMark,
  MastercardMark,
  ApplePayMark,
  GooglePayMark,
  PaypalMark,
  CryptoMark,
  BankMark,
  SportIcon,
} from "@/components/Brand";

const GAMES = [
  { name: "Neon Roulette", tag: "LIVE", img: "/img/roulette.jpg", players: "2.4k" },
  { name: "Gates of Nova", tag: "HOT", img: "/img/slots.jpg", players: "8.1k" },
  { name: "Blackjack VIP", tag: "VIP", img: "/img/blackjack.jpg", players: "1.2k" },
  { name: "High Stakes Poker", tag: "NEW", img: "/img/poker-chips.jpg", players: "3.7k" },
  { name: "Lightning Dice", tag: "HOT", img: "/img/dice.jpg", players: "5.3k" },
  { name: "Royal Baccarat", tag: "LIVE", img: "/img/cards.jpg", players: "980" },
];

const SPORTS = [
  { name: "Football", sport: "football", img: "/img/football.jpg", markets: "1,240 markets" },
  { name: "Basketball", sport: "basketball", img: "/img/basketball.jpg", markets: "860 markets" },
  { name: "Tennis", sport: "tennis", img: "/img/tennis.jpg", markets: "540 markets" },
  { name: "Esports", sport: "esports", img: "/img/esports.jpg", markets: "720 markets" },
];

const PAYMENTS = [
  { label: "Visa", Mark: VisaMark, cls: "text-[#1A1F71] dark:text-slate-100" },
  { label: "Mastercard", Mark: MastercardMark, cls: "" },
  { label: "Apple Pay", Mark: ApplePayMark, cls: "text-slate-900 dark:text-slate-100" },
  { label: "Google Pay", Mark: GooglePayMark, cls: "" },
  { label: "PayPal", Mark: PaypalMark, cls: "" },
  { label: "Crypto", Mark: CryptoMark, cls: "" },
  { label: "Bank", Mark: BankMark, cls: "text-slate-600 dark:text-slate-300" },
];

const TAG_STYLES = {
  LIVE: "bg-ember-500 text-white",
  HOT: "bg-gold-500 text-ink-950",
  VIP: "bg-royal-500 text-white",
  NEW: "bg-volt-500 text-ink-950",
};

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/*
        HERO — intentionally dark in BOTH themes. Casino/sportsbook heroes are
        always dark (Stake, Roobet, Bet365); a light hero kills the neon accent
        and washes out the photography.
      */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="absolute inset-0">
          <Image
            src="/img/hero-casino.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/40" />
        </div>

        <div className="container-x relative py-20 md:py-28 lg:py-36">
          <div className="max-w-2xl animate-fade-up">
            <span className="chip border border-volt-500/40 bg-volt-500/10 text-volt-400">
              <span className="h-1.5 w-1.5 rounded-full bg-volt-500 animate-pulse-dot" />
              24,318 players online now
            </span>

            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Bet Bold.
              <br />
              <span className="text-gradient-volt">Win Bigger.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">
              4,000+ casino games, live sportsbook odds and instant payouts. Deposits land in your
              wallet in seconds — powered by Hyperswitch.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/deposit" className="btn-primary !px-8 !py-4 !text-base shadow-glow-volt">
                Deposit &amp; Play
              </Link>
              <Link
                href="/casino"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-8 py-4 font-display text-base font-bold uppercase tracking-wider text-white transition-all hover:border-volt-500 hover:text-volt-400"
              >
                Explore Casino
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-400">
              {["Instant deposits", "Provably fair", "Licensed & secure"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-volt-500">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Jackpot card */}
          <div className="absolute right-8 top-1/2 hidden w-80 -translate-y-1/2 rounded-2xl border border-white/10 bg-ink-850/80 p-6 shadow-card backdrop-blur-md animate-floaty lg:block">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Mega Jackpot
            </p>
            <p className="mt-2 text-3xl">
              <JackpotCounter />
            </p>
            <div className="mt-4 h-px bg-white/10" />
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-400">Last winner</span>
              <span className="font-semibold text-white">Sharkk88 · $42,100</span>
            </div>
            <Link href="/deposit" className="btn-primary mt-5 w-full">
              Play for the Jackpot
            </Link>
          </div>
        </div>
      </section>

      <WinTicker />

      {/* TRENDING GAMES */}
      <section className="container-x py-16 md:py-24">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-volt-600 dark:text-volt-400">
              Casino
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Trending Games</h2>
          </div>
          <Link
            href="/casino"
            className="hidden text-sm font-semibold text-slate-500 transition-colors hover:text-volt-600 sm:block dark:text-slate-400 dark:hover:text-volt-400"
          >
            View all 4,000+ games →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {GAMES.map((g) => (
            <Link
              key={g.name}
              href="/casino"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-light transition-transform hover:-translate-y-1.5 motion-reduce:hover:translate-y-0 dark:border-ink-700/60 dark:bg-ink-850 dark:shadow-card"
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={g.img}
                  alt={g.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110 motion-reduce:transition-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
                <span className={`chip absolute left-2.5 top-2.5 ${TAG_STYLES[g.tag]} !px-2 !py-0.5 text-[10px]`}>
                  {g.tag}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="font-display text-sm font-bold text-white">{g.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-volt-500 animate-pulse-dot" />
                    {g.players} playing
                  </p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-volt-500 text-ink-950 shadow-glow-volt-lg">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SPORTSBOOK */}
      <section id="sportsbook" className="scroll-mt-16 bg-white py-16 md:py-24 dark:bg-ink-900">
        <div className="container-x">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ember-500">
                Sportsbook
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                Live Odds, Real Time
              </h2>
              <p className="mt-4 max-w-md text-slate-500 dark:text-slate-400">
                Bet in-play across 40+ sports with the sharpest odds and cash-out anytime. Odds
                refresh in real time.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {SPORTS.map((s) => (
                  <Link
                    key={s.name}
                    href="/deposit"
                    className="group relative h-36 overflow-hidden rounded-2xl border border-slate-200 dark:border-ink-700/60"
                  >
                    <Image
                      src={s.img}
                      alt={s.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110 motion-reduce:transition-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 to-ink-950/10" />
                    <span className="absolute right-3 top-3 text-white/70">
                      <SportIcon sport={s.sport} className="h-5 w-5" />
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="font-display font-bold text-white">{s.name}</p>
                      <p className="text-xs text-slate-300">{s.markets}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-ember-500 animate-pulse-dot" />
                  Live Now
                </h3>
                <span className="text-sm text-slate-500 dark:text-slate-400">Odds update live</span>
              </div>
              <LiveOdds />
            </div>
          </div>
        </div>
      </section>

      {/* PROMOS */}
      <section id="promos" className="container-x scroll-mt-16 py-16 md:py-24">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-700 dark:text-gold-500">Promotions</p>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Boost Your Bankroll</h2>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-volt-600 to-volt-500 p-8 text-ink-950 md:col-span-2">
            <div className="relative z-10">
              <span className="chip bg-ink-950/15 font-bold !text-ink-950">WELCOME OFFER</span>
              <h3 className="mt-4 font-display text-3xl font-bold sm:text-5xl">
                200% up to $1,000
              </h3>
              <p className="mt-2 max-w-md font-medium text-ink-950/80">
                + 100 free spins on your first deposit. Funds credited instantly to your wallet.
              </p>
              <Link
                href="/deposit"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink-950 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-volt-400 transition-transform hover:scale-[1.03] motion-reduce:hover:scale-100"
              >
                Claim Bonus →
              </Link>
            </div>
            <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -bottom-16 right-20 h-40 w-40 rounded-full bg-ink-950/10 blur-xl" />
          </div>

          <div className="card-surface relative overflow-hidden p-8">
            <span className="chip bg-gold-500/15 text-gold-700 dark:text-gold-500">VIP CLUB</span>
            <h3 className="mt-4 font-display text-2xl font-bold">
              Rakeback up to <span className="text-gradient-gold">25%</span>
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Weekly cashback, dedicated host, and priority withdrawals for VIP members.
            </p>
            <Link
              href="/deposit"
              className="mt-6 inline-block text-sm font-bold text-gold-700 dark:text-gold-500 hover:underline"
            >
              Learn more →
            </Link>
            <div className="absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-gold-500/10 blur-2xl" />
          </div>
        </div>
      </section>

      {/* PAYMENTS STRIP */}
      <section className="border-t border-slate-200 bg-white py-14 dark:border-ink-700/50 dark:bg-ink-900">
        <div className="container-x flex flex-col items-center gap-8 text-center">
          <div>
            <h3 className="font-display text-2xl font-bold">
              Deposit in seconds. <span className="text-gradient-volt">Withdraw instantly.</span>
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              One integration, 20+ payment methods — cards, wallets, bank transfers and crypto.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {PAYMENTS.map(({ label, Mark, cls }) => (
              <span
                key={label}
                title={label}
                className="flex h-12 w-24 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-ink-600 dark:bg-ink-800"
              >
                <Mark className={`h-5 w-auto max-w-[64px] ${cls}`} />
              </span>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/deposit" className="btn-primary !px-10 !py-4 !text-base shadow-glow-volt">
              Make Your First Deposit
            </Link>
            <Link href="/withdraw" className="btn-secondary !px-8 !py-4 !text-base">
              Cash Out
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
