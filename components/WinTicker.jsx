"use client";

const WINS = [
  { user: "Sharkk88", game: "Gates of Nova", amount: 4210.5 },
  { user: "LunaSpin", game: "Neon Roulette", amount: 1180.0 },
  { user: "BigDawg_", game: "Blackjack VIP", amount: 9600.0 },
  { user: "cryptoQueen", game: "Nova Crash", amount: 2444.9 },
  { user: "MaxHolt", game: "Sweet Riches", amount: 780.25 },
  { user: "spinz4life", game: "Dragon Fortune", amount: 15020.0 },
  { user: "AcePlays", game: "Lightning Dice", amount: 3325.75 },
  { user: "Nordic_V", game: "Mega Wheel", amount: 6875.0 },
];

function TickerRow() {
  // Each copy carries its own trailing gap (pr-10) so the two halves are
  // exactly equal width — otherwise translateX(-50%) lands mid-gap and the
  // marquee visibly jumps on every loop.
  return (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {WINS.map((w, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-volt-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">{w.user}</span>
          <span className="text-slate-500 dark:text-slate-400">won on {w.game}</span>
          <span className="font-display font-bold text-volt-600 dark:text-volt-400">
            ${w.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function WinTicker() {
  return (
    <div className="relative overflow-hidden border-y border-slate-200 bg-white py-3 dark:border-ink-700/50 dark:bg-ink-900">
      <div className="flex w-max animate-ticker whitespace-nowrap">
        <TickerRow />
        <TickerRow />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent dark:from-ink-900" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent dark:from-ink-900" />
    </div>
  );
}
