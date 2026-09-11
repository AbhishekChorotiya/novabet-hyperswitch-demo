"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CATEGORIES = ["All", "Slots", "Live Casino", "Table Games", "Game Shows", "Crash"];

const GAMES = [
  { name: "Gates of Nova", cat: "Slots", img: "/img/slots.jpg", rtp: "96.5%", tag: "HOT" },
  { name: "Neon Roulette", cat: "Live Casino", img: "/img/roulette.jpg", rtp: "97.3%", tag: "LIVE" },
  { name: "Blackjack VIP", cat: "Table Games", img: "/img/blackjack.jpg", rtp: "99.5%", tag: "VIP" },
  { name: "High Stakes Poker", cat: "Table Games", img: "/img/poker-chips.jpg", rtp: "98.9%", tag: "NEW" },
  { name: "Lightning Dice", cat: "Game Shows", img: "/img/dice.jpg", rtp: "96.2%", tag: "HOT" },
  { name: "Royal Baccarat", cat: "Live Casino", img: "/img/cards.jpg", rtp: "98.9%", tag: "LIVE" },
  { name: "Nova Crash", cat: "Crash", img: "/img/neon-bg.jpg", rtp: "97.0%", tag: "HOT" },
  { name: "Grand Prix Rush", cat: "Slots", img: "/img/racing.jpg", rtp: "95.8%", tag: "NEW" },
  { name: "Court Kings", cat: "Slots", img: "/img/basketball.jpg", rtp: "96.1%", tag: null },
  { name: "Striker Gold", cat: "Slots", img: "/img/football.jpg", rtp: "96.4%", tag: null },
  { name: "Ace Server", cat: "Slots", img: "/img/tennis.jpg", rtp: "95.9%", tag: null },
  { name: "Cyber Arena", cat: "Crash", img: "/img/esports.jpg", rtp: "97.2%", tag: "NEW" },
];

const TAG_STYLES = {
  LIVE: "bg-ember-500 text-white",
  HOT: "bg-gold-500 text-ink-950",
  VIP: "bg-royal-500 text-white",
  NEW: "bg-volt-500 text-ink-950",
};

export default function CasinoPage() {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = GAMES.filter(
    (g) =>
      (cat === "All" || g.cat === cat) &&
      g.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-ink-700/50">
        <div className="absolute inset-0">
          <Image
            src="/img/neon-bg.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40 dark:opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-100/70 to-slate-100 dark:from-ink-950/70 dark:to-ink-950" />
        </div>
        <div className="container-x relative py-14 md:py-20">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            Casino <span className="text-gradient-volt">Lobby</span>
          </h1>
          <p className="mt-3 max-w-lg text-slate-600 dark:text-slate-300">
            4,000+ games from 60+ providers. Slots, live dealers, game shows and
            originals — all provably fair.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="container-x py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  cat === c
                    ? "bg-volt-500 text-ink-950 shadow-glow-volt"
                    : "border border-slate-300 text-slate-600 hover:border-volt-500 hover:text-volt-600 dark:border-ink-600 dark:text-slate-300 dark:hover:border-volt-500 dark:hover:text-volt-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative md:w-72">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search games…"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-volt-500 dark:border-ink-600 dark:bg-ink-850 dark:text-white"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {filtered.map((g) => (
            <Link
              key={g.name}
              href="/deposit"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-light transition-transform hover:-translate-y-1.5 dark:border-ink-700/60 dark:bg-ink-850 dark:shadow-card"
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={g.img}
                  alt={g.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
                {g.tag && (
                  <span className={`chip absolute left-2.5 top-2.5 ${TAG_STYLES[g.tag]} !px-2 !py-0.5 text-[10px]`}>
                    {g.tag}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="font-display text-sm font-bold text-white">{g.name}</p>
                  <p className="mt-0.5 text-xs text-slate-300">
                    {g.cat} · RTP {g.rtp}
                  </p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-volt-500 text-ink-950 shadow-glow-volt-lg">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-16 text-center text-slate-500 dark:text-slate-400">No games found for “{query}”.</p>
        )}

        {/* Deposit CTA */}
        <div className="card-surface mt-12 flex flex-col items-center gap-5 overflow-hidden p-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h3 className="font-display text-2xl font-bold">
              Low balance? <span className="text-gradient-volt">Top up in seconds.</span>
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Cards, wallets and crypto — all supported. Funds are credited instantly.
            </p>
          </div>
          <Link href="/deposit" className="btn-primary shrink-0 !px-8 !py-4">
            Deposit Now
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
