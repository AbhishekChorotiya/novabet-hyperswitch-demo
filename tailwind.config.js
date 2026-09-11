/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Core surfaces
        ink: {
          950: "#070B14",
          900: "#0A0F1E",
          850: "#0D1326",
          800: "#111A30",
          700: "#1A2540",
          600: "#243050",
        },
        // Neon accent (primary)
        volt: {
          300: "#7CFFB2",
          400: "#34F58A",
          500: "#00E701",
          600: "#00C305",
          700: "#009A0A",
          // For volt used as FOREGROUND TEXT on a pale volt tint
          // (.btn-secondary): volt-700 on volt-500/10 is only 3.44:1, which
          // fails AA for a 16px label. This clears it at ~6.4:1.
          800: "#046B12",
        },
        // Gold accent (VIP / jackpot)
        gold: {
          300: "#FFE9A3",
          400: "#FFD558",
          500: "#FFB800",
          600: "#E09E00",
          // Darker ramp for gold used as FOREGROUND TEXT on light surfaces.
          // gold-500 on white is ~1.9:1 (fails AA); gold-700 is ~4.6:1.
          700: "#A67400",
          800: "#7A5500",
        },
        // Hot accent (live)
        ember: {
          400: "#FF5C7A",
          500: "#FF2E55",
          600: "#E01440",
        },
        royal: {
          400: "#8B7BFF",
          500: "#6C5CE7",
          600: "#5240D9",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        "glow-volt": "0 0 24px rgba(0, 231, 1, 0.35)",
        "glow-volt-lg": "0 0 48px rgba(0, 231, 1, 0.45)",
        "glow-gold": "0 0 24px rgba(255, 184, 0, 0.35)",
        "glow-ember": "0 0 20px rgba(255, 46, 85, 0.4)",
        card: "0 8px 32px rgba(0, 0, 0, 0.35)",
        "card-light": "0 8px 28px rgba(15, 23, 42, 0.10)",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.8)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "count-glow": {
          "0%, 100%": { textShadow: "0 0 12px rgba(255,184,0,0.6)" },
          "50%": { textShadow: "0 0 28px rgba(255,184,0,0.95)" },
        },
      },
      animation: {
        ticker: "ticker 30s linear infinite",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
        floaty: "floaty 5s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "fade-up": "fade-up 0.6s ease-out both",
        "count-glow": "count-glow 2.2s ease-in-out infinite",
      },
      backgroundImage: {
        "hero-fade":
          "linear-gradient(to right, rgba(7,11,20,0.96) 20%, rgba(7,11,20,0.75) 50%, rgba(7,11,20,0.3) 100%)",
      },
    },
  },
  plugins: [],
};
