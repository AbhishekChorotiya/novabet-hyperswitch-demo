/**
 * NOVABET Hyperswitch appearance config.
 *
 * Keys below are validated against the hyperswitch-web SDK source:
 *  - appearance.variables valid keys  -> src/CardTheme.res `getVariables` validKeys
 *  - appearance.rules class names     -> src/MidnightTheme.res / DefaultTheme.res rule maps
 *  - appearance.theme values          -> src/CardTheme.res `getTheme`
 *      ("default" | "midnight" | "brutal" | "charcoal" | "soft" | "bubblegum" | "none")
 *  - appearance.colorScheme values    -> src/CardTheme.res `getColorScheme` ("light"|"dark"|"auto")
 *  - appearance.labels                -> "above" | "floating" | "none"
 *  - appearance.innerLayout           -> "spaced" | "compressed"
 *
 * NOTE: rules are MERGED over the theme's defaultRules (CardTheme.res:418
 * `mergeJsons(rulesJson, ...)`), so we only override what needs to match NOVABET.
 */

const BRAND = {
  volt: "#00E701",
  voltDim: "#00C305",
  gold: "#FFB800",
  ember: "#FF2E55",
};

const DARK = {
  surface: "#111A30", // ink-800
  surfaceSunken: "#0D1326", // ink-850
  border: "#243050", // ink-700/600
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  placeholder: "#64748B",
  disabled: "#0A0F1E",
};

const LIGHT = {
  surface: "#FFFFFF",
  surfaceSunken: "#F8FAFC",
  border: "#CBD5E1",
  text: "#0F172A",
  textSecondary: "#475569",
  placeholder: "#94A3B8",
  disabled: "#F1F5F9",
};

export function buildAppearance(theme) {
  const isDark = theme === "dark";
  const c = isDark ? DARK : LIGHT;

  return {
    // Midnight is the dark base theme in the SDK; default is the light base.
    theme: isDark ? "midnight" : "default",
    // Drives the `meta[name="color-scheme"]` inside the SDK iframe
    // (CardTheme.res `setColorSchemeMeta`) so native controls (selects,
    // autofill, scrollbars) match the host page.
    colorScheme: isDark ? "dark" : "light",
    labels: "above",
    innerLayout: "spaced",

    variables: {
      // Typography — matches the host page's Inter body font
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSizeBase: "15px",
      fontWeightLight: "400",
      fontWeightNormal: "500",
      fontWeightMedium: "600",
      fontWeightBold: "700",
      fontSizeXl: "17px",
      fontSizeLg: "15px",
      fontSizeSm: "13px",
      fontSizeXs: "11px",

      // Brand colors
      colorPrimary: BRAND.volt,
      colorPrimaryText: "#07101F", // dark ink on volt for contrast
      colorBackground: c.surface,
      colorBackgroundText: c.text,
      colorText: c.text,
      colorTextSecondary: c.textSecondary,
      colorTextPlaceholder: c.placeholder,
      colorDanger: BRAND.ember,
      colorDangerText: BRAND.ember,
      colorSuccess: BRAND.volt,
      colorSuccessText: BRAND.volt,
      colorWarning: BRAND.gold,
      colorWarningText: BRAND.gold,
      borderColor: c.border,

      // NOTE: colorIconCardCvc / colorIconCardCvcError / colorIconCardError /
      // fontSize2Xl are read by CardTheme.res but are missing from its
      // `validKeys` array, so passing them logs a spurious "Unknown Key"
      // warning. We style those icons via `.InputLogo` rules instead to keep
      // the merchant's console clean.

      // Geometry — matches .card-surface / .btn-primary radii on the host page
      borderRadius: "12px",
      spacingUnit: "10px",
      spacingTab: "12px",
      spacingGridColumn: "14px",
      spacingGridRow: "16px",
      spacingAccordionItem: "10px",
      inputFieldHeight: "48px",

      // Wallet / pay button geometry
      buttonBackgroundColor: BRAND.volt,
      buttonTextColor: "#07101F",
      buttonHeight: "48px",
      buttonWidth: "100%",
      buttonBorderRadius: "12px",
      buttonBorderColor: BRAND.volt,
      buttonBorderWidth: "0px",
      buttonTextFontSize: "15px",
      buttonTextFontWeight: "700",
    },

    rules: {
      ".Input": {
        backgroundColor: c.surfaceSunken,
        border: `1px solid ${c.border}`,
        borderRadius: "12px",
        color: c.text,
        boxShadow: "none",
        transition: "border .15s ease, box-shadow .15s ease",
      },
      ".Input:focus": {
        border: `1px solid ${BRAND.volt}`,
        boxShadow: `0 0 0 3px ${BRAND.volt}2e`,
      },
      ".Input--invalid": {
        border: `1px solid ${BRAND.ember}`,
        color: BRAND.ember,
        boxShadow: `0 0 0 3px ${BRAND.ember}26`,
      },
      ".Input::placeholder": {
        color: c.placeholder,
        fontWeight: "400",
      },
      ".Input:-webkit-autofill": {
        transition: "background-color 5000s ease-in-out 0s",
        "-webkitTextFillColor": `${c.text} !important`,
      },
      ".Label": {
        color: c.textSecondary,
        fontWeight: "600",
        fontSize: "13px",
        textAlign: "left",
      },
      ".Tab": {
        backgroundColor: c.surfaceSunken,
        border: `1px solid ${c.border}`,
        borderRadius: "12px",
        color: c.textSecondary,
        boxShadow: "none",
        cursor: "pointer",
        transition: "border .15s ease, background .15s ease, color .15s ease",
      },
      ".Tab:hover": {
        border: `1px solid ${BRAND.volt}80`,
        color: c.text,
      },
      ".Tab--selected": {
        backgroundColor: isDark ? "rgba(0,231,1,0.10)" : "rgba(0,231,1,0.08)",
        border: `1px solid ${BRAND.volt}`,
        color: c.text,
        boxShadow: `0 0 0 1px ${BRAND.volt}, 0 0 16px ${BRAND.volt}2e`,
      },
      ".Tab--selected:hover": {
        border: `1px solid ${BRAND.volt}`,
        color: c.text,
      },
      ".TabLabel": { fontWeight: "600", textAlign: "start" },
      ".TabIcon": { transition: "color .1s ease" },
      ".TabMore": {
        backgroundColor: c.surfaceSunken,
        border: `1px solid ${c.border}`,
        borderRadius: "12px",
        color: c.textSecondary,
        boxShadow: "none",
        cursor: "pointer",
      },
      ".Block": {
        backgroundColor: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: "12px",
      },
      ".BlockDivider": { border: `1px solid ${c.border}` },
      ".AccordionItem": {
        backgroundColor: c.surfaceSunken,
        border: `1px solid ${c.border}`,
        borderRadius: "12px",
        color: c.text,
        boxShadow: "none",
        cursor: "pointer",
      },
      ".AccordionItem--selected": { color: BRAND.volt },
      ".AccordionItemLabel--selected": { color: BRAND.volt },
      ".AccordionItemIcon--selected": { color: BRAND.volt },
      ".PickerItem": {
        backgroundColor: c.surfaceSunken,
        border: `1px solid ${c.border}`,
        borderRadius: "12px",
        color: c.text,
        cursor: "pointer",
      },
      ".PickerItem--selected": {
        backgroundColor: isDark ? "rgba(0,231,1,0.10)" : "rgba(0,231,1,0.08)",
        border: `1px solid ${BRAND.volt}`,
        color: c.text,
      },
      ".Checkbox": {
        color: c.textSecondary,
        fontWeight: "500",
        fontSize: "13px",
        cursor: "pointer",
      },
      ".InputLogo": { color: c.textSecondary },
      ".PaymentMethodsHeaderLabel": {
        color: c.text,
        fontSize: "20px",
        fontWeight: "700",
        marginBottom: "1rem",
      },
    },
  };
}

/**
 * Unified Checkout element options.
 * Valid keys validated against src/Types/PaymentType.res `allowedPaymentElementOptions`.
 *
 * `cardsOnly` is used by the withdrawal flow: a payout must return to the
 * original card, so wallets/BNPL/crypto are suppressed. Note this is only the
 * client half — the authoritative restriction is
 * `allowed_payment_method_types: ["credit","debit"]` on the intent
 * (mockServer.cjs), because the SDK derives its tab list from the API's
 * payment method list and `paymentMethodOrder` can only reorder, never remove.
 */
export function buildCheckoutOptions(returnUrl, { cardsOnly = false } = {}) {
  if (cardsOnly) {
    return {
      layout: { type: "tabs", defaultCollapsed: false },
      paymentMethodOrder: ["card"],
      // Every wallet explicitly off. "never" is the value handled by
      // PaymentType.res `getShowType`; applePay/googlePay/payPal take the
      // same string form via their get*WalletField decoders.
      wallets: {
        walletReturnUrl: returnUrl,
        applePay: "never",
        googlePay: "never",
        payPal: "never",
        klarna: "never",
        paze: "never",
        samsungPay: "never",
      },
      fields: { billingDetails: "never" },
      terms: { card: "never" },
      hideCardNicknameField: true,
      branding: "never",
      // A payout destination should not be silently stored for reuse.
      displaySavedPaymentMethods: false,
      displaySavedPaymentMethodsCheckbox: false,
    };
  }

  return {
    layout: {
      type: "tabs",
      defaultCollapsed: false,
    },
    // Card first so the default open tab is the card form
    // (PaymentElement.res warns when card isn't first priority).
    paymentMethodOrder: [
      "card",
      "google_pay",
      "apple_pay",
      "paypal",
      "klarna",
      "crypto_currency",
    ],
    wallets: {
      walletReturnUrl: returnUrl,
      // Valid keys for options.wallets.style are ["type", "theme", "height"]
      // (PaymentType.res:1190). `buttonRadius` is parsed but not whitelisted,
      // so it is set per-wallet below instead.
      style: {
        type: "pay",
        theme: "dark",
        height: 48,
      },
      // PayPal's shape defaults to `PaypalRect` (PaymentType.res:1289-1295,
      // "rect" | "pill" | "sharp"), which renders square-cornered. GooglePay
      // is radius-driven instead, so matching PayPal means radius 0 — a
      // rounded GPay button next to a rectangular PayPal button is the
      // mismatch. Heights are pinned equal so the row lines up too.
      googlePay: { buttonRadius: 0, height: 48 },
      applePay: { buttonRadius: 0, height: 48 },
      payPal: { shape: "rect", height: 48 },
    },
    // Billing/shipping are set SERVER-side on the payment intent (see
    // mockServer.cjs `billing`/`shipping`, mirroring
    // Hyperswitch-React-Demo-App/server.js). With a complete address already
    // on the intent we tell the SDK to collect none of it, so the cashier is
    // a 3-field form: card number, expiry, CVC.
    // `billingDetails: "never"` is the string form handled by
    // PaymentType.res `getShowDetails` -> `defaultNeverBilling`, which turns
    // off name, email, phone AND the whole address block in one key.
    fields: { billingDetails: "never" },
    terms: { card: "never" },
    hideCardNicknameField: true,
    branding: "never",
  };
}
