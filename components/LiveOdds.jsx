"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SportIcon } from "./Brand";

const MATCHES = [
  {
    league: "Premier League",
    sport: "football",
    home: "Arsenal",
    away: "Liverpool",
    time: "72'",
    score: "2 — 1",
    odds: { home: 1.85, draw: 3.6, away: 4.2 },
    live: true,
  },
  {
    league: "NBA",
    sport: "basketball",
    home: "Lakers",
    away: "Celtics",
    time: "Q3 04:12",
    score: "88 — 91",
    odds: { home: 2.1, draw: null, away: 1.72 },
    live: true,
  },
  {
    league: "ATP Masters",
    sport: "tennis",
    home: "Alcaraz",
    away: "Sinner",
    time: "Set 2",
    score: "1 — 0",
    odds: { home: 1.55, draw: null, away: 2.45 },
    live: true,
  },
  {
    league: "CS2 — Major",
    sport: "esports",
    home: "NaVi",
    away: "FaZe",
    time: "Map 2",
    score: "1 — 0",
    odds: { home: 1.68, draw: null, away: 2.15 },
    live: true,
  },
  {
    league: "Champions League",
    sport: "football",
    home: "Real Madrid",
    away: "Bayern",
    time: "Tomorrow 20:00",
    score: null,
    odds: { home: 2.25, draw: 3.4, away: 2.95 },
    live: false,
  },
];

function jitter(v) {
  if (v == null) return null;
  const delta = (Math.random() - 0.5) * 0.1;
  return Math.max(1.01, +(v + delta).toFixed(2));
}

function UpArrow() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <path d="M6 2l4 6H2l4-6Z" />
    </svg>
  );
}

function DownArrow() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <path d="M6 10 2 4h8l-4 6Z" />
    </svg>
  );
}

export default function LiveOdds() {
  const [matches, setMatches] = useState(MATCHES);
  // { "matchIdx-outcome": "up" | "down" }
  const [drift, setDrift] = useState({});
  const timers = useRef([]);

  useEffect(() => {
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * MATCHES.length);
      setMatches((prev) => {
        const nextDrift = {};
        const next = prev.map((m, i) => {
          if (i !== idx) return m;
          const updated = {
            home: jitter(m.odds.home),
            draw: jitter(m.odds.draw),
            away: jitter(m.odds.away),
          };
          ["home", "draw", "away"].forEach((k) => {
            if (m.odds[k] != null && updated[k] !== m.odds[k]) {
              nextDrift[`${i}-${k}`] = updated[k] > m.odds[k] ? "up" : "down";
            }
          });
          return { ...m, odds: updated };
        });
        setDrift(nextDrift);
        const t = setTimeout(() => setDrift({}), 1100);
        timers.current.push(t);
        return next;
      });
    }, 2600);
    return () => {
      clearInterval(id);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="space-y-3">
      {matches.map((m, i) => (
        <div
          key={m.home + m.away}
          className="card-surface flex flex-col gap-4 p-4 transition-colors hover:border-volt-500/40 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-ink-800 dark:text-slate-400">
              <SportIcon sport={m.sport} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {m.live ? (
                  <span className="chip bg-ember-500/15 text-ember-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-ember-500 animate-pulse-dot" />
                    LIVE {m.time}
                  </span>
                ) : (
                  <span className="chip bg-slate-200 text-slate-600 dark:bg-ink-700 dark:text-slate-300">
                    {m.time}
                  </span>
                )}
                <span className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                  {m.league}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 font-display text-sm font-bold sm:text-base">
                <span className="truncate">{m.home}</span>
                {m.score ? (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs tabular-nums text-volt-600 dark:bg-ink-800 dark:text-volt-400">
                    {m.score}
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">vs</span>
                )}
                <span className="truncate">{m.away}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[
              { key: "home", label: "1", value: m.odds.home },
              { key: "draw", label: "X", value: m.odds.draw },
              { key: "away", label: "2", value: m.odds.away },
            ]
              .filter((o) => o.value != null)
              .map((o) => {
                const dir = drift[`${i}-${o.key}`];
                return (
                  <Link
                    key={o.key}
                    href="/deposit"
                    aria-label={`Bet ${m.home} vs ${m.away} outcome ${o.label} at ${o.value.toFixed(2)}`}
                    className={`relative flex min-w-[76px] flex-col items-center rounded-xl border px-4 py-2 transition-all hover:border-volt-500 hover:bg-volt-500/10 ${
                      dir === "up"
                        ? "border-volt-500 bg-volt-500/15"
                        : dir === "down"
                        ? "border-ember-500 bg-ember-500/10"
                        : "border-slate-200 dark:border-ink-600"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                      {o.label}
                    </span>
                    <span className="flex items-center gap-1 font-display text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {o.value.toFixed(2)}
                      {dir === "up" && (
                        <span className="text-volt-500">
                          <UpArrow />
                        </span>
                      )}
                      {dir === "down" && (
                        <span className="text-ember-500">
                          <DownArrow />
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
