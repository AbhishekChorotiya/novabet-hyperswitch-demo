/**
 * Inline brand/payment/trust marks. Inline SVG (not emoji, not remote logos)
 * so they render identically on every OS and never hit the network mid-pitch.
 */

export function VisaMark({ className = "" }) {
  return (
    <svg viewBox="0 0 48 16" className={className} role="img" aria-label="Visa">
      <path
        fill="currentColor"
        d="M19.3 15.6h-3.9L17.8.4h3.9l-2.4 15.2Zm14.2-14.9c-.8-.3-2-.6-3.5-.6-3.9 0-6.6 2-6.6 4.9 0 2.2 2 3.4 3.6 4.1 1.6.8 2.1 1.3 2.1 2 0 1-1.2 1.5-2.4 1.5-1.6 0-2.5-.2-3.8-.8l-.5-.3-.6 3.5c.9.4 2.7.8 4.5.8 4.2 0 6.8-2 6.8-5.1 0-1.7-1-3-3.4-4.1-1.4-.7-2.3-1.2-2.3-2 0-.7.8-1.4 2.4-1.4 1.3 0 2.3.3 3 .6l.4.2.6-3.2ZM43.9.4h-3c-.9 0-1.6.3-2 1.3l-5.8 13.9h4.1l.8-2.3h5l.5 2.3h3.6L43.9.4Zm-4.8 9.8 1.5-4.2.9 4.2h-2.4ZM12.6.4 8.7 10.8l-.4-2.1C7.5 6 5.3 3.2 2.7 1.8l.1 13.8h4.1L13.1.4h-.5ZM5 .4H0v.3c3.5.9 6.4 3.5 7.6 6.5L6.1 1.6C5.9.7 5.5.4 5 .4Z"
      />
    </svg>
  );
}

export function MastercardMark({ className = "" }) {
  return (
    <svg viewBox="0 0 32 20" className={className} role="img" aria-label="Mastercard">
      <circle cx="12" cy="10" r="8" fill="#EB001B" />
      <circle cx="20" cy="10" r="8" fill="#F79E1B" />
      <path
        fill="#FF5F00"
        d="M16 3.6a8 8 0 0 0 0 12.8 8 8 0 0 0 0-12.8Z"
      />
    </svg>
  );
}

export function ApplePayMark({ className = "" }) {
  return (
    <svg viewBox="0 0 48 20" className={className} role="img" aria-label="Apple Pay">
      <path
        fill="currentColor"
        d="M9.3 3.6c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.6.6-1 1.6-.9 2.6 1 0 1.9-.5 2.5-1.2Zm.9 1.4c-1.4-.1-2.6.8-3.2.8-.7 0-1.7-.8-2.8-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.3 1 8.4.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7 1.3 0 1.6.7 2.7.6 1.1 0 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.3-1.5-.6-2.3-2-2.3-3.6 0-1.4.7-2.4 1.4-3-.7-1-1.8-1.7-2.3-1.8ZM22.7 2.2h-4.8v15.3h2.4v-5.2h2.6c2.9 0 4.9-2 4.9-5s-2-5.1-5.1-5.1Zm-.5 8.1h-1.9v-6h1.9c1.9 0 3.1 1.1 3.1 3s-1.2 3-3.1 3Zm11.9-2.4c-2.3 0-3.9 1.3-4 3.2h2.2c.1-.9.9-1.4 1.9-1.4 1.2 0 1.9.6 1.9 1.6v.7l-2.7.2c-2.4.1-3.8 1.2-3.8 3 0 1.8 1.4 3 3.4 3 1.4 0 2.6-.7 3.2-1.8h.1v1.7h2.2v-7c0-2-1.6-3.3-4.4-3.3Zm2 7.1c0 1.1-1 2-2.3 2-1 0-1.7-.5-1.7-1.4 0-.8.6-1.3 1.8-1.4l2.2-.1v.9ZM47.9 8h-2.4l-2.3 7.3h-.1L40.8 8h-2.5l3.4 9.4-.2.6c-.3.9-.8 1.3-1.8 1.3h-.6v1.9h.9c2.2 0 3.2-.9 4-3.2L47.9 8Z"
      />
    </svg>
  );
}

export function GooglePayMark({ className = "" }) {
  return (
    <svg viewBox="0 0 52 20" className={className} role="img" aria-label="Google Pay">
      <path fill="#5F6368" d="M24.6 9.7v5.6h-1.8V1.5h4.7c1.2 0 2.2.4 3 1.2.9.8 1.3 1.8 1.3 2.9 0 1.2-.4 2.2-1.3 3-.8.8-1.8 1.1-3 1.1h-2.9Zm0-6.5v4.8h3c.7 0 1.3-.2 1.7-.7.5-.5.7-1 .7-1.7s-.2-1.2-.7-1.7c-.4-.5-1-.7-1.7-.7h-3Z" />
      <path fill="#5F6368" d="M36 5.5c1.3 0 2.4.4 3.1 1.1.8.7 1.1 1.7 1.1 2.9v5.8h-1.7v-1.3h-.1c-.7 1.1-1.7 1.6-2.9 1.6-1 0-1.9-.3-2.6-.9-.7-.6-1-1.4-1-2.3 0-1 .4-1.7 1.1-2.3.7-.6 1.7-.9 2.9-.9 1 0 1.9.2 2.5.6v-.4c0-.6-.2-1.2-.7-1.6-.5-.4-1.1-.6-1.7-.6-1 0-1.8.4-2.4 1.3l-1.6-1c.9-1.3 2.2-2 4-2Zm-2.3 6.9c0 .5.2.8.6 1.1.4.3.8.5 1.3.5.7 0 1.3-.3 1.9-.8.5-.5.8-1.1.8-1.8-.5-.4-1.3-.6-2.2-.6-.7 0-1.3.2-1.8.5-.4.3-.6.7-.6 1.1Z" />
      <path fill="#5F6368" d="M50 5.8l-5.9 13.6h-1.8l2.2-4.8-3.9-8.8h1.9l2.8 6.8h.1l2.7-6.8H50Z" />
      <path fill="#4285F4" d="M16.8 8.6c0-.6-.1-1.1-.2-1.6H8.9v3h4.4c-.2 1-.8 1.9-1.6 2.5v2h2.6c1.5-1.4 2.5-3.5 2.5-5.9Z" />
      <path fill="#34A853" d="M8.9 16.8c2.2 0 4-.7 5.4-2l-2.6-2c-.7.5-1.6.8-2.8.8-2.2 0-4-1.5-4.7-3.5H1.6v2.1c1.3 2.7 4.1 4.6 7.3 4.6Z" />
      <path fill="#FBBC04" d="M4.2 10.1c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V4.6H1.6C1 5.8.6 7.1.6 8.4s.4 2.6 1 3.8l2.6-2.1Z" />
      <path fill="#EA4335" d="M8.9 3.2c1.2 0 2.3.4 3.2 1.3l2.3-2.3C13 .8 11.1 0 8.9 0 5.7 0 2.9 1.9 1.6 4.6l2.6 2.1c.7-2 2.5-3.5 4.7-3.5Z" />
    </svg>
  );
}

export function PaypalMark({ className = "" }) {
  return (
    <svg viewBox="0 0 40 20" className={className} role="img" aria-label="PayPal">
      <path fill="#253B80" d="M6.9 3.1H2.6c-.3 0-.5.2-.6.5L.3 15.1c0 .2.1.4.3.4h2.1c.3 0 .5-.2.6-.5l.5-3.1c0-.3.3-.5.6-.5h1.4c2.9 0 4.5-1.4 5-4.1.2-1.2 0-2.1-.5-2.8-.7-.8-1.8-1.4-3.4-1.4Zm.5 4c-.2 1.5-1.4 1.5-2.5 1.5H4.3l.4-2.8c0-.2.2-.3.3-.3h.3c.8 0 1.5 0 1.9.5.2.2.3.6.2 1.1Z" />
      <path fill="#253B80" d="M21.1 7h-2.1c-.2 0-.3.1-.3.3l-.1.6-.2-.2c-.5-.7-1.3-.9-2.2-.9-2.1 0-3.8 1.6-4.2 3.8-.2 1.1.1 2.2.7 2.9.6.7 1.4.9 2.4.9 1.7 0 2.6-1.1 2.6-1.1l-.1.6c0 .2.1.4.3.4h1.9c.3 0 .5-.2.6-.5l1.1-7.1c0-.2-.1-.4-.3-.4Zm-2.9 3.7c-.2 1.1-1 1.8-2.1 1.8-.5 0-1-.2-1.2-.5-.3-.3-.4-.8-.3-1.3.2-1 1-1.8 2.1-1.8.5 0 .9.2 1.2.5.3.4.4.8.3 1.3Z" />
      <path fill="#253B80" d="M32.3 7h-2.1c-.2 0-.4.1-.5.3l-2.9 4.3-1.2-4.2c-.1-.3-.3-.4-.5-.4h-2.1c-.2 0-.4.2-.3.5l2.3 6.8-2.2 3.1c-.2.2 0 .5.3.5h2.1c.2 0 .4-.1.5-.3l7-10.1c.1-.2 0-.5-.4-.5Z" />
      <path fill="#179BD7" d="M35.2 3.1h-4.3c-.3 0-.5.2-.6.5l-1.7 11.5c0 .2.1.4.3.4h2.2c.2 0 .4-.2.4-.4l.5-3.2c0-.3.3-.5.6-.5h1.4c2.9 0 4.5-1.4 5-4.1.2-1.2 0-2.1-.5-2.8-.7-.8-1.8-1.4-3.3-1.4Zm.5 4c-.2 1.5-1.4 1.5-2.5 1.5h-.6l.4-2.8c0-.2.2-.3.3-.3h.3c.8 0 1.5 0 1.9.5.2.2.3.6.2 1.1Z" />
    </svg>
  );
}

export function CryptoMark({ className = "" }) {
  return (
    <svg viewBox="0 0 20 20" className={className} role="img" aria-label="Crypto">
      <circle cx="10" cy="10" r="9" fill="#F7931A" />
      <path
        fill="#fff"
        d="M13.9 8.8c.2-1.2-.8-1.9-2.1-2.3l.4-1.7-1-.3-.4 1.6c-.3-.1-.6-.1-.8-.2l.4-1.7-1-.2-.4 1.7-2.1-.5-.3 1.1s.8.2.8.2c.4.1.5.4.5.6l-1.2 4.7c0 .1-.2.3-.5.2 0 0-.8-.2-.8-.2l-.5 1.2 2.1.5-.4 1.7 1 .3.4-1.7.8.2-.4 1.7 1 .3.4-1.7c1.7.3 3 .2 3.5-1.4.4-1.2 0-1.9-.9-2.4.7-.1 1.2-.6 1.4-1.5Zm-2.4 3.3c-.3 1.2-2.4.5-3 .4l.6-2.3c.7.2 2.8.5 2.4 1.9Zm.3-3.3c-.3 1.1-2 .5-2.6.4l.5-2.1c.6.2 2.4.4 2.1 1.7Z"
      />
    </svg>
  );
}

export function BankMark({ className = "" }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" role="img" aria-label="Bank transfer">
      <path d="M2 8 10 3l8 5" />
      <path d="M4 8v8m4-8v8m4-8v8m4-8v8M2 17h16" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Trust / licensing seals ---------- */

export function AgeBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-ember-500 font-display text-[11px] font-bold text-ember-500 ${className}`}
      title="18+ only"
    >
      18+
    </span>
  );
}

export function LicenseSeal({ className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1.5 dark:border-ink-600 ${className}`}
      title="Demo licence"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-volt-500">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <span className="text-left text-[10px] font-semibold leading-tight">
        LICENSED
        <br />
        <span className="font-normal text-slate-500 dark:text-slate-400">Demo Gaming Authority</span>
      </span>
    </div>
  );
}

export function ProvablyFairSeal({ className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1.5 dark:border-ink-600 ${className}`}
      title="Provably fair RNG"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-volt-500">
        <path d="M12 3v18M5 7h14M7 7l-3 6h6L7 7Zm10 0-3 6h6l-3-6Z" />
      </svg>
      <span className="text-left text-[10px] font-semibold leading-tight">
        PROVABLY FAIR
        <br />
        <span className="font-normal text-slate-500 dark:text-slate-400">Verifiable RNG</span>
      </span>
    </div>
  );
}

export function ResponsibleGamingSeal({ className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1.5 dark:border-ink-600 ${className}`}
      title="Responsible gaming"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-volt-500">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5m0 3h.01" strokeLinecap="round" />
      </svg>
      <span className="text-left text-[10px] font-semibold leading-tight">
        PLAY SAFE
        <br />
        <span className="font-normal text-slate-500 dark:text-slate-400">Limits &amp; self-exclusion</span>
      </span>
    </div>
  );
}

/* ---------- Sport icons (replaces OS-dependent emoji) ---------- */

export function SportIcon({ sport, className = "h-5 w-5" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };

  switch (sport) {
    case "football":
      return (
        <svg {...common} role="img" aria-label="Football">
          <circle cx="12" cy="12" r="9" />
          <path d="m12 7 3.2 2.3-1.2 3.8h-4l-1.2-3.8L12 7Z" />
          <path d="M12 3v4m9 5-5.8-2.7M3 12l5.8-2.7m1.2 7L7 20.5m7-3.4 3 3.4" />
        </svg>
      );
    case "basketball":
      return (
        <svg {...common} role="img" aria-label="Basketball">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18M3 12h18M5.6 5.6c3.5 2 5.4 5.5 5.4 12.8M18.4 5.6c-3.5 2-5.4 5.5-5.4 12.8" />
        </svg>
      );
    case "tennis":
      return (
        <svg {...common} role="img" aria-label="Tennis">
          <circle cx="12" cy="12" r="9" />
          <path d="M5 5c4 2.4 5.6 8.4 3.6 14M19 5c-4 2.4-5.6 8.4-3.6 14" />
        </svg>
      );
    case "esports":
      return (
        <svg {...common} role="img" aria-label="Esports">
          <path d="M6 8h12a4 4 0 0 1 3.9 4.9l-.6 2.7A2.6 2.6 0 0 1 17 17l-1.6-2.2H8.6L7 17a2.6 2.6 0 0 1-4.3-1.4l-.6-2.7A4 4 0 0 1 6 8Z" />
          <path d="M8 11v2.5M6.8 12.2h2.5M15.5 11.5h.01M17.5 13h.01" />
        </svg>
      );
    case "racing":
      return (
        <svg {...common} role="img" aria-label="Racing">
          <path d="M4 4v16" />
          <path d="M4 5h14l-2 3 2 3H4" />
        </svg>
      );
    default:
      return (
        <svg {...common} role="img" aria-label="Sport">
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
