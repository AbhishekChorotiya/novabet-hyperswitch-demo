# NOVABET — Casino & Sportsbook Demo

A gaming/gambling demo store built to pitch the **Hyperswitch** Payment SDK to a
betting merchant. Next.js 14 (App Router) + Tailwind, dark/light theme, with a
real sandbox payment on the deposit page.

## Run it

```bash
npm install
cp .env.example .env   # then fill in your Hyperswitch sandbox keys
npm run dev            # that's it — app + API on :3000
```

`.env` is gitignored — it holds `HYPERSWITCH_SECRET_KEY`, which is only ever
read inside `lib/hyperswitch.server.js`. That module is marked `server-only`,
so importing it from a client component is a build error rather than a silent
key leak.

The API is a set of Next route handlers under `app/api/*` — there is no second
process to run, and nothing to keep warm. A standalone Express server was the
earlier approach; on Vercel it was an extra always-on dependency that could
stop independently of the app, and it needed CORS. Same-origin route handlers
deploy as serverless functions with the app and remove both problems.

| Route | Purpose |
|---|---|
| `POST\|GET /api/create-payment-intent` | Open a deposit intent (DCC-aware) |
| `GET /api/payment-status` | Verify a deposit before crediting |
| `GET /api/create-withdrawal-intent` | Open a payout intent (cards only) |
| `GET /api/withdrawal-status` | Verify a payout before debiting |
| `GET /api/rates` | Published FX table, both sides of the spread |
| `GET /api/health` | Config check — reports whether keys exist, never their values |

All six are `force-dynamic`: they mint or read live payment state, so they must
never be prerendered or served from the data cache. Note Next 14 patches global
`fetch` to `force-cache` by default, so every Hyperswitch call passes
`cache: "no-store"` explicitly — without it a payment retrieve can return a
stale status, which is precisely the value the credit decision rests on.

## Pages

| Route | What it shows |
|---|---|
| `/` | Landing: hero, live win ticker, jackpot counter, trending games, live sportsbook odds, promos, payment methods |
| `/casino` | Casino lobby: category filters + live search over 12 game tiles |
| `/deposit` | **Real checkout** — amount picker + Hyperswitch Unified Checkout, themed to the brand |
| `/deposit/success` | Server-verified receipt, cash/bonus split, wagering disclosure, confetti |
| `/withdraw` | **Cash out** — cash-only payout with a locked-bonus breakdown |
| `/withdraw/success` | Server-verified payout receipt, idempotent debit |
| `/responsible-gaming` | Deposit limits, self-exclusion periods, support resources |

## The pitch flow (happy path)

1. Land on `/`, note the **$0.00** wallet in the navbar.
2. Hit **Deposit & Play** → the payment intent is already created, so the
   checkout is rendered with zero perceived latency.
3. Pick an amount (e.g. $250). The intent, bonus summary and pay button all
   re-sync automatically — they can never disagree.
4. Pay with test card `4242 4242 4242 4242`, exp `12/29`, CVC `123`.
   It is a **3-field checkout** — card number, expiry, CVC only.
5. Land on the success page: balance counts up **$0 → $750**, split into
   **$250 withdrawable cash + $500 bonus at 35x wagering**, with the real
   `payment_id` and "Hyperswitch · verified".

**Best demo move:** toggle the theme (sun/moon in the navbar) while on
`/deposit`. The Unified Checkout re-renders into the brand's dark/light palette
live — see below.

To replay: wallet chip in the navbar → **Reset demo wallet** (behind a confirm,
so an exploring merchant can't zero it by accident).

## How the SDK is themed

All appearance config lives in [`lib/hyperAppearance.js`](lib/hyperAppearance.js)
and every key was validated against the `hyperswitch-web` source rather than
guessed:

| Config | Source of truth |
|---|---|
| `appearance.variables` (45 valid keys) | `src/CardTheme.res` → `getVariables` `validKeys` |
| `appearance.rules` class names | `src/MidnightTheme.res` / `src/DefaultTheme.res` rule maps |
| `appearance.theme` | `src/CardTheme.res` → `getTheme` |
| `appearance.colorScheme` | `src/CardTheme.res` → `getColorScheme` |
| element `options` | `src/Types/PaymentType.res` → `allowedPaymentElementOptions` |

Brand mapping: `colorPrimary` = volt green `#00E701`, surfaces = the app's
`ink-800/850` tokens, `borderRadius: 12px` and Inter to match `.card-surface`
and `.btn-primary` on the host page.

### Dark/light re-render

The SDK reads `appearance` when the element is **created**, so changing it in
place does nothing. `app/deposit/page.js` therefore keys the provider on the
theme, which forces a remount:

```jsx
<HyperElements key={`${clientSecret}-${theme}`} options={options} hyper={hyperPromise}>
```

`buildAppearance(theme)` returns the `midnight` base for dark and `default` for
light, and sets `colorScheme` so the `meta[name="color-scheme"]` inside the
iframe matches — native selects, autofill and scrollbars follow the site theme.

Verified in-iframe: dark → input `#111A30` on `#F1F5F9` text; light → `#FFFFFF`
on `#0F172A`.

## Payment integrity

This is a demo, but the money path is built the way a gambling merchant's risk
team would expect — and each property below is covered by an automated test:

- **Credit requires a 2xx verification.** `GET /payment-status` retrieves the
  payment from Hyperswitch and rejects a `client_secret` that doesn't match the
  payment it resolves to. The wallet is credited from the **API's** amount and
  status; there is deliberately **no fallback** that trusts the redirect query
  string, so a 403, a 404 or an unreachable server all end in "not completed".
- **Idempotent credit.** Each `payment_id` is recorded in `localStorage`, so
  refreshing the success page (or going back/forward) never double-credits.
- **Settled states only.** `processing` / `requires_capture` route to a separate
  "Deposit Pending" screen and credit **nothing** — crediting an unsettled bank
  push or an uncaptured auth would hand a player wagerable, cashoutable balance
  before the money cleared.
- **Cash vs bonus are separate ledgers.** Deposits credit withdrawable cash;
  the promo credits a bonus balance carrying a 35x wagering requirement, shown
  in the navbar wallet menu and on the receipt.
- **Limits enforced server-side too.** The route handlers reject anything outside
  $10–$10,000, so `curl '/create-payment-intent?amount=500000'` is a 400 rather
  than a $500k intent.
- **Declines render as declines** — a separate failure state with a "Try Again"
  route, never a success screen with an unchanged balance.

### Verification

Automated checks run against the live sandbox (18 assertions, all passing):

| Suite | Covers |
|---|---|
| Exploits (5/5) | forged `client_secret` (404), tampered secret (403), no secret, unpaid intent — none credit |
| Happy flow (8/8) | dark SDK render, amount re-sync, payment, $250 cash + $500 bonus split, verified receipt, wagering disclosed, credited once, refresh doesn't double-credit |
| Theme + sweep (5/5) | dark→light→dark SDK re-render, 3 routes × 3 widths with no overflow / broken images / emoji, no page errors |
| Withdrawal flow (11/11) | cash-only cap, locked bonus, over-balance + sub-minimum blocked, 3-field payout widget, debit 250→150 with bonus untouched, debited once, refresh safe |
| Withdrawal exploits (5/5) | forged secret, deposit-replayed-as-withdrawal, withdrawal-replayed-as-deposit, unsettled intent, inflated URL amount — none move the balance |
| Withdrawal edge cases (5/5) | zero-cash and sub-$20 empty states, cursors, no page errors |
| Cards-only (6/6) | withdraw offers card alone with no wallet buttons and no save-card option; deposit still offers all 17 methods |
| Withdrawal theming (2/2) | payout widget renders dark and re-renders light on toggle |
| Cursors (162/162) | every interactive control resolves to `pointer` (or `not-allowed` when disabled) |

## Address handling: server-side, not in the SDK

`lib/hyperswitch.server.js` attaches full `billing` and `shipping` objects to the payment
intent — the same shape as `Hyperswitch-React-Demo-App/server.js`. The client
then passes `fields: { billingDetails: "never" }`, the string form handled by
`PaymentType.res` `getShowDetails` → `defaultNeverBilling`, which switches off
name, email, phone **and** the entire address block in a single key.

Result: the cashier renders card number, expiry and CVC only — verified by an
assertion that counts zero address/name/email inputs in the iframe.

This is also the correct production pattern for a gambling merchant: KYC has
already captured a verified address, so re-collecting it at deposit time adds
friction and invites an AVS mismatch against the KYC record.

## Known SDK quirks worked around

Found while validating this integration against the SDK source:

1. **`options.defaultValues...address.country` always warns.**
   `PaymentType.res:663-670` calls `unknownPropValueWarning` whenever
   `country != ""` without checking membership first (contrast
   `getTypeArray`, line 817, which correctly guards with `if !Array.includes`).
   Also the client-side check compares against country *display names* while
   `POST /payments` only accepts ISO alpha-2 — so `"United States"` silences
   the warning but fails the API.
   **Avoided entirely** by attaching `billing`/`shipping` to the intent
   server-side (see below) instead of using client `defaultValues`.
2. **`colorIconCardCvc`, `colorIconCardCvcError`, `colorIconCardError`,
   `fontSize2Xl`** are read by `CardTheme.res` but missing from its `validKeys`,
   so passing them logs a spurious "Unknown Key". Those icons are styled via
   `.InputLogo` rules instead.
3. **`buttonRadius` is not valid under `options.wallets.style`**
   (`["type","theme","height"]` only) — it is set per-wallet under
   `wallets.googlePay` / `wallets.applePay`.
4. **Iframe height handshake can land a stale `9px`** below the `lg` breakpoint,
   clipping the form. `app/globals.css` floors it with a `min-height` on
   `iframe[id^="orca-payment-element-iframeRef"]` (CSS `min-height` beats the
   SDK's inline `height`, while a correct larger height still wins).

## Notes

Only the deposit flow is functional. Games, odds buttons, filters and footer
links are intentionally non-functional demo surface — they route to `/deposit`,
`/casino` or `/responsible-gaming` rather than dead-ending, and compliance
links never land on a bonus promo. Sport icons, payment marks and trust seals
are inline SVG (`components/Brand.jsx`) so nothing depends on the network or OS
emoji.

## Dynamic Currency Conversion

The wallet is denominated in **USD**; DCC lets the player choose the currency
they're *charged* in. Pick a currency on `/deposit` and the intent is recreated
in it, with the quote, rate and fee disclosed before payment.

- **The server owns the rate.** `lib/hyperswitch.server.js` holds the rate table and
  recomputes the charge from the USD figure. The client only ever displays the
  quote the server returned, so `?amount=1000&currency=JPY&rate=0.0001` can't
  buy a $1,000 deposit for pennies.
- **Limits stay in USD.** Min/max are evaluated pre-conversion, so switching
  currency can't slip past the $10–$10,000 cap.
- **Zero-decimal currencies are handled.** Hyperswitch `amount` is in minor
  units, and JPY has **no** minor unit: $100 → `amount: 16092` is ¥16,092, not
  ¥160.92. The web SDK's own helper divides by a hardcoded 100
  (`Utils.res:1869` `minorUnitToString`) with no zero-decimal branch, so the
  exponent is applied deliberately on both ends — getting this wrong is a 100x
  overcharge.
- **The wallet credits from USD, not the foreign amount.** The USD value is
  written to the intent's `metadata` at creation and read back on verification,
  so a €94.30 charge credits exactly $100 — never the raw 9430.
- **The FX margin is disclosed** (2.5%, shown as a separate line rather than
  buried in the rate), which is what DCC rules require.

### The spread has a direction

`/withdraw` has the same currency selector, but it must **not** reuse the
deposit rate. The markup always has to work against the player:

| | rate | $100 becomes |
|---|---|---|
| Deposit (`pay_in`) | `0.92 × 1.025` = 0.9430 | pay **€94.30** |
| Payout (`pay_out`) | `0.92 ÷ 1.025` = 0.8976 | get **€89.76** |

Reusing the pay-in rate on the payout side would mean depositing €94.30 and
withdrawing €94.30 back — converting twice would be **free**, which is wrong
and is a zero-cost FX round trip. With the inverse applied the round trip
costs ~4.8%, which is the real cost. `effectiveRate(code, direction)` and the
server's `quote(usd, currency, direction)` both take the direction explicitly.

The wallet debit is always the USD figure the player chose, independent of the
payout currency — a ¥15,317 payout still debits exactly $100. `/withdrawal-status`
refuses to fall back to the intent's `amount` if the recorded USD value is
missing, since that value is the *converted* one and debiting it as USD cents
would take the wrong amount out of the wallet.

## Withdrawals: what's real and what's mocked

**Read this before demoing `/withdraw`.**

A production cashier settles payouts with `POST /payouts` (Hyperswitch
Payouts). This demo does **not** use the payout SDK widget
(`paymentMethodCollect`), so the withdrawal is **mocked**: it opens a normal
no-3DS payment intent, lets the Payment SDK collect and verify the destination
card, and debits the player's cash balance on success.

So the sandbox transaction underneath is a *charge, not a credit* — the
direction of the money movement is the one thing here that isn't real. What
*is* real:

- **Cards only.** A payout must return to the original payment method, so
  wallets / BNPL / crypto are suppressed — the withdrawal cashier drops from
  17 offered methods to card alone, while the deposit page still shows all 17.
  This has to be enforced on the **intent**
  (`allowed_payment_method_types: ["credit","debit"]`), not just in SDK
  options: the SDK builds its tab list from the API's payment method list, and
  `paymentMethodOrder` only *reorders* it — `Utils.res` `sortBasedOnPriority`
  appends every method the merchant didn't list, so it can never remove one.
  The client also passes `wallets: { applePay: "never", ... }` and disables
  saved-method storage for the payout card.
- **Cash-only payouts.** The ceiling is the cash ledger, never `cash + bonus`.
  Bonus funds are shown as locked with their outstanding wagering requirement,
  so a $250-cash / $500-bonus wallet can withdraw at most $250.
- **Amount comes from the API, not the URL.** The withdrawal amount is written
  into the intent's `metadata` server-side and read back on verification, so
  `?amount=99999` on the receipt cannot drain a balance.
- **Cross-type replay is blocked both ways.** `/withdrawal-status` rejects a
  deposit intent (409) and `/payment-status` rejects a withdrawal intent (409).
  Without this, one `client_secret` could be replayed in whichever direction
  suited the player.
- **Idempotent debit**, clamped at zero, with `processing` / `requires_capture`
  routed to a pending screen rather than debited.

For a genuine payout demo, swap `/api/create-withdrawal-intent` for `POST /payouts`
(verified working on this sandbox account — it returns a `payout_id` and a
`requires_payout_method_data` status) and keep every guard above as-is.
