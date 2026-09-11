"use client";

import { useEffect } from "react";

/**
 * Works around an SDK iframe height quirk.
 *
 * The SDK measures its content with a ResizeObserver and posts the value to the
 * parent, which writes it straight onto the iframe as an inline height with no
 * clamping:
 *
 *   LoaderController.res:799      divH == 0 ? divH : divH + 1   // can post 0
 *   LoaderPaymentElement.res:404  ele->Window.setHeight(`${h}px`)
 *
 * When the observer fires before layout settles the reported height is `0`,
 * which collapses the widget. A static CSS `min-height` floor hides that, but
 * then any form SHORTER than the floor gets padded with dead space — which is
 * what put a visible gap between the card-only payout form and the Withdraw
 * button.
 *
 * This hook instead flags the iframe only while its height is implausible, so
 * the CSS floor applies in exactly that window and the iframe is left to size
 * itself the rest of the time.
 */
const MIN_PLAUSIBLE_HEIGHT = 120;

export default function useSdkIframeHeightFix(deps = []) {
  useEffect(() => {
    const SELECTOR = 'iframe[id^="orca-payment-element-iframeRef"]';

    const sync = () => {
      // Clear any stale flags first. The SDK appends its own divs directly to
      // <body> and React does not own them, so a flag left on an unmounted or
      // unrelated node outlives navigation and keeps the CSS floor alive —
      // that is what left 320px of dead scroll under the footer after leaving
      // /deposit.
      document.querySelectorAll('[data-sdk-height]').forEach((el) => {
        if (!el.querySelector(SELECTOR)) delete el.dataset.sdkHeight;
      });

      document.querySelectorAll(SELECTOR).forEach((el) => {
        // The inline height is what the SDK reported for this iframe.
        const reported = parseFloat(el.style.height);
        const bogus = !Number.isFinite(reported) || reported < MIN_PLAUSIBLE_HEIGHT;

        // Flag the SDK's OWN wrapper (`#orca-element-…`), not an arbitrary
        // ancestor: those wrappers sit between the iframe and our card and do
        // not inherit the iframe's height, so the floor has to reach them.
        // Anchoring on the id keeps the flag off body-level divs the SDK
        // appends, which have no iframe inside and must never be inflated.
        const target = el.closest('[id^="orca-element-"]');
        if (!target) return;

        if (bogus) {
          target.dataset.sdkHeight = "fallback";
        } else {
          delete target.dataset.sdkHeight;
          // The SDK reported a real height for the iframe but leaves its own
          // wrappers at whatever they were; clear any stale inline height so
          // they collapse onto the iframe instead of holding dead space.
          target
            .querySelectorAll(
              '#unified-checkout, [id^="orca-elements-payment-element"], [id^="orca-element-orca-elements-payment-element"]'
            )
            .forEach((w) => {
              if (w.style.height && w.style.height !== "auto") {
                w.style.height = "auto";
              }
            });
        }
      });
    };

    sync();

    // The SDK rewrites the inline height as the form grows/shrinks (extra
    // fields, validation errors), so track the attribute rather than polling.
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      observer.disconnect();
      // Drop every flag on unmount. These live on nodes the SDK attached to
      // <body>, outside React's tree, so nothing else will remove them and
      // the CSS floor would otherwise keep reserving height on the next page.
      document
        .querySelectorAll('[data-sdk-height]')
        .forEach((el) => delete el.dataset.sdkHeight);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
