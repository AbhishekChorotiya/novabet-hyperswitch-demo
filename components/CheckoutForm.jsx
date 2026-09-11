"use client";

import { useMemo, useState } from "react";
import { useHyper, useWidgets, UnifiedCheckout } from "@juspay-tech/react-hyper-js";
import { buildCheckoutOptions } from "@/lib/hyperAppearance";
import { compactMoney } from "@/lib/format";

/**
 * Shared confirm surface for BOTH the deposit and the (mocked) withdrawal
 * flow — see app/api/create-withdrawal-intent for why a withdrawal is a
 * no-3DS payment intent
 * here. `basePath` decides which receipt page we land on, and therefore which
 * verification endpoint runs.
 */
export default function CheckoutForm({
  amount,
  disabled,
  basePath = "/deposit",
  ctaLabel,
  cardsOnly = false,
  /** Charge currency + amount, when DCC is active. Display only. */
  presentment = null,
}) {
  const hyper = useHyper();
  const widgets = useWidgets();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${basePath}/success?amount=${amount}`
      : "";

  const checkoutOptions = useMemo(
    () => buildCheckoutOptions(returnUrl, { cardsOnly }),
    [returnUrl, cardsOnly]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!hyper || !widgets) return;
    setIsLoading(true);

    let error, status;
    try {
      const result = await hyper.confirmPayment({
        widgets,
        elements: widgets,
        confirmParams: { return_url: returnUrl },
        redirect: "always",
      });
      error = result?.error;
      status = result?.status;
    } catch (err) {
      setMessage("Could not be completed. Please try again.");
      setIsLoading(false);
      return;
    }

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
      setIsLoading(false);
      return;
    }

    if (status) {
      // redirect: "always" normally navigates for us; this covers the
      // non-redirect fallback path.
      window.location.href = `${returnUrl}&status=${status}`;
      return;
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-5">
      <UnifiedCheckout id="unified-checkout" options={checkoutOptions} />

      <button
        id="submit"
        type="submit"
        disabled={isLoading || disabled || !hyper || !amount}
        className="btn-primary w-full !py-4 !text-base disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-ink-950/30 border-t-ink-950" />
            Processing…
          </span>
        ) : (
          <>
            {ctaLabel ? (
              ctaLabel(compactMoney(amount))
            ) : (
              <>Deposit {compactMoney(amount)} Now</>
            )}
          </>
        )}
      </button>

      {presentment && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          {presentment.verb === "receive"
            ? "You will receive "
            : "You will be charged "}
          <strong className="text-slate-900 dark:text-white">
            {presentment.label}
          </strong>{" "}
          ·{" "}
          {presentment.verb === "receive"
            ? `${compactMoney(amount)} USD deducted`
            : `credited ${compactMoney(amount)} USD`}
        </p>
      )}

      {message && (
        <div
          id="payment-message"
          className="rounded-xl border border-ember-500/40 bg-ember-500/10 px-4 py-3 text-center text-sm font-medium text-ember-500"
        >
          {message}
        </div>
      )}

      <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        256-bit SSL · PCI DSS Level 1 · Powered by Hyperswitch
      </p>
    </form>
  );
}
