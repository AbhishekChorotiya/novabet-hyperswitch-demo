"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });

const WalletContext = createContext({
  cash: 0,
  bonus: 0,
  balance: 0,
  credit: () => {},
  debit: () => {},
  resetWallet: () => {},
});

export const WAGERING_MULTIPLIER = 35;

export function useTheme() {
  return useContext(ThemeContext);
}

export function useWallet() {
  return useContext(WalletContext);
}

export default function Providers({ children }) {
  const [theme, setTheme] = useState("dark");
  // Cash and bonus are tracked separately: bonus funds carry a wagering
  // requirement and are NOT withdrawable, which is how every real operator
  // works. Lumping them together is what makes demo wallets unbelievable.
  const [cash, setCash] = useState(0);
  const [bonus, setBonus] = useState(0);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("novabet-theme");
      if (storedTheme === "light") setTheme("light");

      const storedCash = localStorage.getItem("novabet-cash");
      const storedBonus = localStorage.getItem("novabet-bonus");
      if (storedCash !== null) setCash(Number(storedCash) || 0);
      if (storedBonus !== null) setBonus(Number(storedBonus) || 0);

      // Migrate the older single-balance key if present.
      const legacy = localStorage.getItem("novabet-balance");
      if (storedCash === null && legacy !== null) {
        setCash(Number(legacy) || 0);
      }
    } catch (e) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("novabet-theme", next);
      } catch (e) {}
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  /** Credit a settled deposit: real money to cash, promo to bonus. */
  const credit = useCallback((cashAmount, bonusAmount = 0) => {
    setCash((prev) => {
      const next = prev + cashAmount;
      try {
        localStorage.setItem("novabet-cash", String(next));
        localStorage.setItem("novabet-balance", String(next + bonusAmount));
      } catch (e) {}
      return next;
    });
    if (bonusAmount) {
      setBonus((prev) => {
        const next = prev + bonusAmount;
        try {
          localStorage.setItem("novabet-bonus", String(next));
        } catch (e) {}
        return next;
      });
    }
  }, []);

  /**
   * Debit a settled withdrawal. Only ever touches CASH — bonus funds carry a
   * wagering requirement and are not withdrawable, so a payout must never be
   * allowed to drain them. Clamped at zero so a stale or replayed callback
   * cannot drive the balance negative.
   */
  const debit = useCallback((amount) => {
    setCash((prev) => {
      // Read through to storage: another tab (or the count-up animation on a
      // freshly-loaded receipt page) may hold a staler value than React state.
      let current = prev;
      try {
        const stored = localStorage.getItem("novabet-cash");
        if (stored !== null) current = Number(stored) || 0;
      } catch (e) {}

      const next = Math.max(0, current - amount);
      try {
        localStorage.setItem("novabet-cash", String(next));
        const storedBonus = Number(localStorage.getItem("novabet-bonus")) || 0;
        localStorage.setItem("novabet-balance", String(next + storedBonus));
      } catch (e) {}
      return next;
    });
  }, []);

  const resetWallet = useCallback(() => {
    setCash(0);
    setBonus(0);
    try {
      localStorage.setItem("novabet-cash", "0");
      localStorage.setItem("novabet-bonus", "0");
      localStorage.removeItem("novabet-balance");
      Object.keys(localStorage)
        .filter((k) => k.startsWith("novabet-credited:"))
        .forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <WalletContext.Provider
        value={{
          cash,
          bonus,
          balance: cash + bonus,
          credit,
          debit,
          resetWallet,
        }}
      >
        {children}
      </WalletContext.Provider>
    </ThemeContext.Provider>
  );
}
