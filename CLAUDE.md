# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This is a monorepo with two independent projects, neither of which is wired to the other yet:

- `fiddlers_green-frontend/` — a Next.js (App Router) site.
- `fiddlers_green-backend/` — a minimal FastAPI backend (Phase 10), providing `/contact` and `/chat` endpoints. See [Phase 10 Completed](#phase-10-completed--backend--ai-assistant) below.

There is no root-level package.json, build system, or workspace tooling tying the two together — treat them as separate projects and `cd` into `fiddlers_green-frontend` for any npm/build/lint command.

## Working in fiddlers_green-frontend

### Commands

Run these from inside `fiddlers_green-frontend/`:

```bash
npm run dev       # start dev server (localhost:3000)
npm run build     # production build
npm run start     # serve a production build
npm run lint      # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test runner configured in this project yet.

### Important: this is a bleeding-edge Next.js version

`fiddlers_green-frontend/AGENTS.md` (referenced from `fiddlers_green-frontend/CLAUDE.md` via `@AGENTS.md`) warns that this project uses a Next.js version with breaking changes relative to what's in most training data — APIs, conventions, and file structure may differ from what you'd normally expect. **Before writing Next.js code, check the version-matched docs bundled in `fiddlers_green-frontend/node_modules/next/dist/docs/`** (organized as `01-app`, `02-pages`, `03-architecture`, `04-community`) rather than relying on memorized Next.js knowledge, and heed any deprecation notices found there.

Key versions actually installed: Next.js 16.2.10, React 19.2.4. The App Router (`app/`) is in use; there is no `pages/` directory.

### Architecture

- App Router only, under `app/`. Each route is a folder with a `page.tsx` (e.g. `app/catalog/page.tsx`, `app/contact/page.tsx`, `app/heritage/page.tsx`).
- `app/layout.tsx` is the root layout: loads the Cormorant Garamond (display) and Inter (body) fonts via `next/font/google` as CSS variables, sets metadata, and sets global HTML/body structure. See [Phase 2 Completed](#phase-2-completed--layout--navbar-foundation) below for full detail.
- `app/globals.css` uses Tailwind v4's `@import "tailwindcss";` entry point (not the v3 `@tailwind` directives); global background/foreground colors and brand design tokens are set here rather than per-page.
- `components/Navbar/index.tsx` is the first established shared component — see [Phase 2 Completed](#phase-2-completed--layout--navbar-foundation) below. `sections/` is still an empty placeholder directory; no page-section pattern has been established yet.
- Styling is Tailwind CSS v4 (via `@tailwindcss/postcss`), utility classes only — no CSS modules or styled-components in use.
- Path alias `@/*` maps to the frontend project root (see `tsconfig.json`).
- `framer-motion` is in use in `components/Navbar/index.tsx` for the mobile menu and hamburger icon animations.

### Current state

All primary routes are implemented and validated. Phases 1-13 are complete; the current completed milestone is Phase 13 — Final Production Polish & QA (Deployment Readiness). The next phase is Phase 14 — VPS Deployment with NGINX + Domain + SSL.

**Route status:**
- `/` — Hero section (Phase 3) plus a skippable cinematic intro sequence on first visit per session (Phase 9)
- `/catalog` — Editorial catalog with categories, product cards, hover effects (Phase 4)
- `/catalog/gummies` — Interactive two-stage Haney Pot strength selector (Phase 5)
- `/catalog/gummies/[strength]` — Stubbed strength detail page (to be expanded)
- `/catalog/[category]` — Stubbed dynamic category route (to be expanded)
- `/heritage` — Full cultural storytelling page with timeline (Phase 6)
- `/contact` — Working contact form, posts to the backend `/contact` endpoint (Phase 10)
- `/chat` — AI Budtender chat widget, posts to the backend `/chat` endpoint (Phase 10)

**Component directories in use:**
- `components/Navbar/` — Shared persistent navigation
- `components/Hero.tsx` — Homepage hero with northern lights atmosphere (Phase 7); accepts a `skipEntrance` prop so it can render already-settled when the Phase 9 intro owns the reveal
- `components/HomeClient.tsx` — Client orchestrator for `/`; decides whether the intro plays and coordinates it with `Hero` (Phase 9)
- `components/IntroSequence/` — Cinematic intro overlay: `index.tsx`, `SkipButton`, `LogoReveal`, `FeatherSVG`, `ChainFormation`, `WampumReveal` (Phase 9)
- `components/catalog/` — CatalogCover, CategorySection, ProductCard, TableOfContents, CategoryEffect
- `components/catalog/gummies/` — GummiesHero, GummiesEntrySelector, StrengthSelector, EntryOptionCard, StrengthButton
- `components/heritage/` — HeritageHero, ChapterSection, TwoRowWampum, CovenantChain, TyendinagaHistory, HeritageTimeline, HeritageDivider
- `components/contact/ContactForm.tsx` — Contact form, posts to backend `/contact` (Phase 10)
- `components/chat/ChatWidget.tsx` — AI Budtender chat UI, posts to backend `/chat` (Phase 10)
- `components/Footer.tsx` — Minimal branded footer, mounted in root layout (Phase 11)
- `components/FloatingChat/` — Persistent floating chat widget: `index.tsx` (root orchestrator), `ChatButton.tsx` (FAB), `ChatPanel.tsx` (dialog + FAQ quick-replies), `MessageList.tsx` (auto-scroll), `MessageInput.tsx` (Phase 12)

**Data layer:**
- `data/products.ts` — Static typed catalog data (CATEGORIES array, Product and Category types)
- `data/strengths.ts` — Gummy strength options (STRENGTHS const, Strength type)
- `data/entryOptions.ts` — Gummy entry options (ENTRY_OPTIONS const, EntryOptionId type)
- `lib/api.ts` — generic `postJson` helper against `NEXT_PUBLIC_BACKEND_URL` (Phase 10)
- `hooks/useChatMessages.ts` — shared message state and `sendMessage` logic; consumed by both `ChatWidget` and `FloatingChat` (Phase 12)

## Phase 2 Completed — Layout & Navbar Foundation

Phase 2 established the site's shared layout shell and primary navigation. This section documents the resulting architecture for reference in later phases.

### 1. Application architecture

- **Next.js App Router structure**: all routes live under `app/`, one folder per route with a `page.tsx` (`app/page.tsx`, `app/catalog/page.tsx`, `app/contact/page.tsx`, `app/heritage/page.tsx`). There is no `pages/` directory.
- **Root layout responsibilities**: `app/layout.tsx` is a Server Component and is the single place where document-level concerns live — HTML/body shell, fonts, global metadata, and the persistent navigation chrome. Route `page.tsx` files are only responsible for their own route content; none of them re-declare layout, fonts, or nav.
- **Shared component integration**: shared UI (currently just `Navbar`) lives under `components/` at the project root and is imported into `app/layout.tsx` via the `@/*` path alias (`@/components/Navbar`), not duplicated per-route. This is the established pattern for anything that should persist across routes (e.g. a future `Footer`).

### 2. Root layout implementation

`app/layout.tsx` is responsible for:

- **Metadata**: a static `Metadata` export (title with a `default`/`template` pair, description, keywords, `openGraph`, `twitter`) defined once at the root so every route inherits it unless a route overrides specific fields via its own `metadata` export.
- **`metadataBase` configuration**: `metadataBase: new URL(siteUrl)`, where `siteUrl` reads `process.env.NEXT_PUBLIC_SITE_URL` and falls back to `http://localhost:3000` in local dev. This is required by Next.js so that relative URLs in URL-based metadata fields (e.g. an eventual `openGraph.images` entry) resolve correctly instead of causing a build error. Set `NEXT_PUBLIC_SITE_URL` in the production environment once a real domain exists.
- **Google fonts**: `Cormorant_Garamond` (display font, weights 300/400/600, italic + normal) and `Inter` (body font, weights 300/400/500) are loaded via `next/font/google`, each exposed as a CSS variable (`--font-display`, `--font-body`) applied on the `<html>` element's `className`. `app/globals.css` maps these variables to `font-family` in `@layer base` and via `.font-display`/`.font-body` utility classes.
- **Global CSS import**: `app/layout.tsx` imports `./globals.css` once at the top of the file — the only place global styles are imported.
- **Navbar integration**: `<Navbar />` is rendered as the first child of `<body>`, before `<main>`, so it persists across all route navigations without remounting.
- **`html`/`body` structure**: `<html lang="en" data-scroll-behavior="smooth" className={...} suppressHydrationWarning>` wraps a `<body>` with base Tailwind utility classes (`bg-black text-brand-cream antialiased min-h-screen flex flex-col`). `data-scroll-behavior="smooth"` is a Next.js 16 opt-in: without it, Next.js no longer auto-suppresses CSS `scroll-behavior: smooth` during route transitions, which would make every navigation smooth-scroll to the top instead of jumping instantly. `<main>` wraps `{children}` with `pt-16 md:pt-20` to offset the fixed-position Navbar's height (`h-16 md:h-20`) — these values must be kept in sync if Navbar's height classes change.

### 3. Styling foundation

- **Tailwind CSS version**: Tailwind v4 (`tailwindcss@^4` + `@tailwindcss/postcss@^4`), configured via `postcss.config.mjs` with no `tailwind.config.js` — v4's CSS-first configuration model.
- **Tailwind v4 setup**: `app/globals.css` uses the v4 entry point `@import "tailwindcss";`, replacing the v3-style `@tailwind base; @tailwind components; @tailwind utilities;` directives that don't apply to this version.
- **Global CSS organization**: `app/globals.css` is structured in three parts — (1) the Tailwind import, (2) brand design tokens as `:root` custom properties, (3) an `@layer base` block for lowest-level element defaults (scroll behavior, body background/font, heading font, focus-visible ring) and an `@layer utilities` block for brand-specific utility classes, so Tailwind's own utilities can still override any of it per-element.
- **Brand token approach**: brand colors are declared once as CSS custom properties (`--color-brand-gold`, `--color-brand-smoke`, `--color-brand-cream`, `--color-brand-charcoal`) in `:root`, then manually exposed as Tailwind-style utility classes (`.text-brand-gold`, `.bg-brand-gold`, `.border-brand-gold`, etc.) in `@layer utilities`. This is a deliberate v3-style pattern rather than Tailwind v4's native `@theme` token block — it works correctly as-is; migrating to `@theme` would be a design-system change, not a bug fix, and hasn't been done yet.

### 4. Navbar component

- **Location**: `components/Navbar/index.tsx`.
- **Responsibilities**:
  - **Brand identity**: renders the "Fiddler's Green" wordmark and "Tyendinaga · Indigenous" tagline as a `Link` to `/`.
  - **Navigation links**: a single `NAV_LINKS` array drives both the desktop link row and the mobile full-screen menu, with active-route styling via `usePathname()`.
  - **Responsive menu**: desktop nav (`hidden md:flex`) and a mobile hamburger + full-screen overlay menu (`md:hidden`), driven by one `isMenuOpen` state.
  - **Mobile menu state**: `isMenuOpen` closes automatically on route change (handled during render by comparing against a `prevPathname` state value, not in a `useEffect`, per React's guidance against synchronous `setState` in effects) and locks `body` scroll while open.
  - **Scroll detection**: an `isScrolled` state (via a passive `scroll` listener) toggles a frosted-glass background on the fixed header once the page scrolls past 20px.
  - **Framer Motion integration**: `AnimatePresence` mounts/unmounts the mobile menu with enter/exit variants; the hamburger icon's three bars animate independently into an X; mobile nav links stagger in with per-item delay. Easing values are typed with `as const` to satisfy Framer Motion's `Easing` type.

### 5. Validation completed

Phase 2 passed all of the following, run from `fiddlers_green-frontend/`:

- `npm run lint` — no errors or warnings.
- `npx tsc --noEmit` — no type errors.
- `npm run build` — production build compiles, type-checks, and statically generates all 4 routes (`/`, `/catalog`, `/contact`, `/heritage`).
- Local development testing via `npm run dev`.

### 6. Important architectural decisions

- **Why Navbar uses client rendering**: `Navbar` needs `usePathname()` for active-link styling and route-change detection, local `useState` for menu/scroll state, and Framer Motion, all of which require the browser runtime — so it's marked `"use client"`. It's rendered from the server-rendered root layout, which is the standard App Router pattern for mixing client interactivity into an otherwise server-rendered shell.
- **Why layout.tsx remains a server component**: it has no interactivity of its own — only static metadata, font loading, and structural markup, all of which can (and should) run on the server. Keeping it server-only avoids shipping unnecessary JS and lets a single client-component island (`Navbar`) carry the interactive cost instead of the whole shell.
- **Why animations are limited to reusable UI behavior**: Framer Motion in Phase 2 is scoped to Navbar's own chrome (menu open/close, hamburger icon, link stagger) — general-purpose, reusable interaction patterns — rather than one-off content animation. This keeps the layout foundation content-agnostic so Phase 3 page/section work isn't constrained by animation choices made for the nav.
- **Why future sections should remain separate components**: `app/layout.tsx` and `Navbar` establish the pattern that persistent, cross-route UI lives in `components/`, while route-specific content belongs in each route's `page.tsx` (and, per the existing repo convention, larger page content should be broken into `sections/`). Keeping Phase 3 section work as separate components preserves this boundary and keeps the root layout stable as content is built out.

---

## Phase 3 Completed — Hero Section

Commit: included in Phase 3 delivery.

### What was built

- `components/Hero.tsx` — single-file component (no premature folder split).
- Four-layer structure: background (z-0) → overlay gradient (z-10) → content (z-30). This pattern is the standard for all full-bleed sections.
- Staggered Framer Motion entrance: background fades first, then eyebrow → headline → body → CTA at 0.25s increments.
- CSS radial gradient background (`#1c2b22` → `#0d1410` → black). Image/video swap is a layer-level change.
- Responsive font scale: `text-4xl sm:text-5xl md:text-7xl`.
- CTA links to `/catalog`.

### Animation decisions

- Framer Motion only. No GSAP.
- All entrance variants defined outside the component (not recreated on render).
- `AnimatePresence` not used — Hero never unmounts while visible.
- `prefers-reduced-motion` support to be added in Phase 8 polish.

### Refactor trigger for Hero

Split `Hero.tsx` into a folder (`Hero/index.tsx` + sub-components) when: file exceeds ~200 lines, or a sub-piece becomes reusable elsewhere. (Phase 9's cinematic intro ended up living entirely in `components/IntroSequence/` instead, coordinated via a `skipEntrance` prop on Hero — see [Phase 9 Completed](#phase-9-completed--cinematic-intro) below — so it did not trigger this split after all, and no GSAP was introduced.)

---

## Phase 4 Completed — Catalog Structure

Commit: included in Phase 4 delivery.

### What was built

- `app/catalog/page.tsx` — thin shell assembling sections in order.
- `app/catalog/[category]/page.tsx` — stubbed dynamic route.
- `components/catalog/CatalogCover.tsx` — editorial entry point, ~70vh.
- `components/catalog/TableOfContents.tsx` — scroll-anchor navigation to category sections.
- `components/catalog/CategorySection.tsx` — chapter-style section with `whileInView` entrance.
- `components/catalog/ProductCard.tsx` — product image, name, type label; hover: `scale(1.03)` + gold box-shadow glow + brightness lift.
- `data/products.ts` — static typed data: `CATEGORIES` array containing `Category[]` → `Product[]`. No CMS yet.

### Design decisions

- Magazine structure: Cover → TOC → CategorySections (not a generic product grid).
- Section `whileInView` with `once: true` and `amount: 0.2` — reveals on entry, does not replay.
- Product cards: dark `bg-brand-charcoal` background, no white/light card treatment (avoids generic ecommerce look).
- Gummies category links to `/catalog/gummies` (dedicated interactive route) rather than anchor-scrolling.

---

## Phase 5 Completed — Haney Pot Interactions

Commit: included in Phase 5 delivery.

### What was built

- `app/catalog/gummies/page.tsx` — orchestrator. Owns all state (`stage`, `entry`, `strength`) and router. No logic in child components.
- `app/catalog/gummies/template.tsx` — Next.js template for fade-in page transitions into `[strength]`.
- `app/catalog/gummies/[strength]/page.tsx` — stubbed strength detail page (async params per Next.js 16).
- `components/catalog/gummies/GummiesHero.tsx` — ambient floating gummy bear SVGs (low opacity, looping `y` + `rotate`, `pointer-events-none`).
- `components/catalog/gummies/GummiesEntrySelector.tsx` — pure component, selection only.
- `components/catalog/gummies/StrengthSelector.tsx` — pure component, selection only, includes back button.
- `components/catalog/gummies/EntryOptionCard.tsx` — `motion.button`, `aria-pressed`, disabled/selected states.
- `components/catalog/gummies/StrengthButton.tsx` — `motion.button`, gold glow on `whileHover`.
- `data/entryOptions.ts` — ENTRY_OPTIONS const + EntryOptionId type.
- `data/strengths.ts` — STRENGTHS const + Strength type.

### Key architecture decisions

- `AnimatePresence mode="wait"` on stage switcher — exit completes before enter begins.
- Selection lock: `if (selected) return;` guard in both selectors. Prevents double-firing.
- `NAVIGATE_DELAY_MS = 350` constant — gives selected state time to register visually before route change.
- Components are pure: no `useRouter`, no `setTimeout`. All side effects live in `page.tsx`.

---

## Phase 6 Completed — Heritage Page

Commit: included in Phase 6 delivery.

### What was built

- `app/heritage/page.tsx` — thin shell, assembles sections in order with chapter labels.
- `components/heritage/HeritageHero.tsx` — full-screen atmospheric intro with entrance animation.
- `components/heritage/ChapterSection.tsx` — reusable `whileInView` wrapper used by all content sections. `amount: 0.15` threshold for short-viewport mobile. `once: true`.
- `components/heritage/TwoRowWampum.tsx` — two-column layout (prose + SVG wampum belt placeholder).
- `components/heritage/CovenantChain.tsx` — centered prose with gold-bordered blockquote.
- `components/heritage/TyendinagaHistory.tsx` — text-focused history section.
- `components/heritage/HeritageTimeline.tsx` — vertical timeline, staggered `x` slide-in per item, gold dot markers.
- `components/heritage/HeritageDivider.tsx` — thin gold-tinted rule between chapters.

### Design decisions

- Roman numeral chapter labels (`I — The Belt`, `II — The Chain`, `III — The Land`) establish literary frame.
- Prose max-width: `max-w-2xl`. Section wrappers: `max-w-4xl`. Two-column layouts: `max-w-6xl`.
- No scroll hijacking. All animations are `whileInView`, not scroll-position-driven.
- `ChapterSection` is the single animation primitive — copy-paste is eliminated; all sections share one scroll behavior.

---

## Phase 7 Completed — Micro Animations

Commit: `034f5a6`

### What was built

**Product category effects** (`components/catalog/CategoryEffect.tsx`):
- Hash cards: slow upward drift overlay (`y: 0 → -8`, opacity fade, 8–10s loop, `pointer-events-none`). Implemented as thin SVG blur-filtered lines suggesting smoke.
- Flower cards: 4–5 tiny sparkle dots at randomized positions, staggered opacity loop. Minimal, botanical in character.
- Rosin: deferred — no rosin category in current `data/products.ts`. Effect is specced and ready; wire when category is added.

**`ProductCard.tsx`** updated to render `<CategoryEffect category={product.category} />` as an absolute overlay. Card structure and public interface unchanged.

**`Hero.tsx`** updated: additional animated gradient layer (northern lights atmosphere) beneath the overlay. Framer Motion `animate` keyframes on a linear gradient background-position shift. 15s loop, very low visual intensity (`opacity-[0.12]`, `mix-blend-screen`).

**`TwoRowWampum.tsx`** updated: blank placeholder replaced with a minimal static SVG wampum belt (white bead field, two purple bead rows). No animation — the belt renders fully static by deliberate design decision: as a cultural symbol it must read as still, intentional, and respectful, so looping or decorative motion was explicitly ruled out rather than merely deferred.

**`CovenantChain.tsx`** updated: blockquote gets a slow breathing `box-shadow` glow animation bleeding from the existing gold left border (`0 0 0px rgba(201,168,76,0)` ↔ `-8px 0 20px rgba(201,168,76,0.18)`), 7s loop. Single element, single loop.

**`CatalogCover.tsx`** updated: category links gain `text-shadow` glow on hover.

**Heritage timeline dot markers**: brief entrance pulse (`scale: 1 → 1.3 → 1`) as each item enters view.

### Animation philosophy

Every animation in Phase 7 passed the question: *"Does this make Fiddler's Green feel more premium?"* Effects that didn't pass were not shipped. The philosophy: luxury design is created through restraint.

- No GSAP introduced.
- No new dependencies added.
- No canvas or WebGL effects.
- No competing simultaneous animations.
- No scroll hijacking.

### Deferred (not implemented)

- Canoe / water ripple — no illustration exists in the codebase.
- Fire in glass pipe — no visual exists.
- Rosin jar rotation — no rosin category in product data.

---

## Phase 8 Completed — First Polish Pass

Commit: `a996f06`

### What was built

**Typography:**
- Standardised heritage eyebrow labels to `tracking-[0.3em]` + `font-body` across `HeritageHero.tsx` and `ChapterSection.tsx` (was `tracking-widest`, ~3× narrower than catalog/hero eyebrows).
- Restored `italic` to `HeritageHero` h1 — was missing, inconsistent with all other hero headings across the site.
- Added `md:text-lg` to `CategorySection` description text for improved legibility at desktop sizes.

**Layout:**
- Passed `className="max-w-6xl"` from `app/heritage/page.tsx` into the `ChapterSection` wrappers around `TwoRowWampum` and `TyendinagaHistory`. Those sections have internal two-column grids at `max-w-6xl`; the outer `ChapterSection` cap of `max-w-4xl` was constraining them at large viewports.

**Accessibility (`prefers-reduced-motion`):**
- `Hero.tsx`: northern lights animated gradient layer's `animate` and `transition` props set to `undefined` when `useReducedMotion()` is true — layer renders statically.
- `CategoryEffect.tsx`: `useReducedMotion()` result passed as prop to `SmokeDrift` and `SparkleDots`; smoke holds static, sparkles render at `opacity: 0.6` without looping animation.
- `ChapterSection.tsx`: when reduced, `initial={false}`, `whileInView={undefined}`, `animate={{ opacity: 1, y: 0 }}` — content displays immediately without scroll-triggered animation.
- `HeritageTimeline.tsx`: timeline items appear statically and dot pulse entrance is disabled when reduced. Easing standardised to `[0.22, 1, 0.36, 1] as const` (was `"easeOut"`).

**Motion:**
- `HeritageHero.tsx`: single entrance `motion.div` split into two — eyebrow animates at 0s, headline+body stagger in at 0.2s delay. More considered than a single simultaneous reveal.

**UX:**
- `StrengthSelector.tsx`: added `py-2` to back button — corrects a mobile tap target that was effectively ~12px tall.
- `app/contact/page.tsx`: replaced bare `<h1>Contact</h1>` stub with branded placeholder — dark radial gradient background, gold eyebrow, italic display heading, smoke-coloured body copy. Consistent with site's visual language.

**Docs:**
- Added comment above `unoptimized` prop in `ProductCard.tsx` flagging it for removal in Phase 11 when real photography replaces placeholder SVGs.

### Validation completed

- `npm run lint` — no errors.
- `npx tsc --noEmit` — no type errors.
- `npm run build` — production build clean.

---

## Phase 9 Completed — Cinematic Intro

Commit: `ca2e81d`

### What was built

- `app/page.tsx` — reduced to a thin Server Component rendering `<HomeClient />`.
- `components/HomeClient.tsx` — client orchestrator for `/`. Decides whether to show the intro inside a layout effect (fires before the browser paints, so there's never a flash of Hero-then-overlay or overlay-then-Hero in either direction), checking `prefers-reduced-motion` and a `sessionStorage` "seen this session" flag (`fg-intro-seen`). Renders `<Hero skipEntrance={showIntro} />` and, only when the intro should play, `<IntroSequence onComplete={...} />`.
- `components/Hero.tsx` — gained a `skipEntrance?: boolean` prop. When true, its fade-up entrance variants use `initial={false}` instead of `"hidden"`, so Hero renders already-settled rather than replaying its own entrance once the intro overlay fades away.
- `components/IntroSequence/` — the cinematic overlay, one file per element:
  - `index.tsx` — fixed fullscreen layer (`z-[100]`, above Navbar's `z-50`); orchestrates the timeline via chained delay constants (each element exports its own duration, and the next element's start is computed by summing prior durations, so the sequence can't silently drift out of sync when a duration changes).
  - `SkipButton.tsx` — subtle bottom-corner control, auto-focused on mount for keyboard/screen-reader users.
  - `LogoReveal.tsx` — wordmark + tagline fade/rise.
  - `FeatherSVG.tsx` — generated line-art feather (curved shaft + tapering barb strokes, no fill), gentle localized drift.
  - `ChainFormation.tsx` — 5 interlocking gold link outlines, opacity-only staggered fade-in then group fade-out.
  - `WampumReveal.tsx` — static belt strip reusing the Heritage page's bead-color grammar (purple rows on white/cream); a single fade in → hold → fade out, no per-bead animation.

### Timeline

Sequential, not layered: each cinematic element fully fades to nothing before the next begins, so there's never more than one focal point on screen and the logo always gets a calm, uncontested moment. Total runtime ~3.9s: feather (0.1–0.75s) → chain (0.75–1.73s) → wampum (1.73–2.63s) → quiet beat → logo (2.83–3.33s) → hold → exit fade (3.53–3.88s). Northern lights is the one continuous exception — a soft ambient gradient wash behind everything, not a shape competing for attention.

### Accessibility

- `prefers-reduced-motion`: checked in `HomeClient`'s layout effect; if set, the intro never mounts and Hero renders with its normal entrance immediately — verified via browser emulation, not just code review.
- Skip: button (keyboard-focusable, auto-focused), Escape key, and click/tap anywhere on the overlay all dismiss it.
- Intro plays once per browser session (`sessionStorage`), not on every visit to `/`.

### Critical bug found and fixed during validation

The root overlay's exit fade was originally built on Framer Motion's imperative `useAnimate()`, needed because skipping must interrupt an already-scheduled delayed animation (updating only a `transition` prop on an unchanged `animate` target doesn't retrigger a Motion tween). In production-build testing, that imperative `animate()` call reliably failed to resolve when invoked from a click handler or a `setTimeout` callback — the promise never settled, silently leaving the black overlay stuck forever with no console error. Fixed by dropping `useAnimate()` entirely for the root: the overlay's fade is now a plain CSS `transition` + `setTimeout`, opacity-only. Child layers (northern lights, feather, chain, wampum, logo) keep their original declarative Motion `animate` props, which were never affected. Verified reliable across 20+ trials against a production build (natural completion, skip via button, Escape, click-anywhere, reduced motion, mobile viewport).

### Refinement pass (feel, not architecture)

- Feather: peak opacity reduced (~15%), rotation swing narrowed (10° → 5°), travel distance shortened (~35%), eased with a neutral `easeInOut` instead of the brand's snappier ease-out — removes the "arrival" feeling so it reads as ambient rather than a feature.
- Chain: fixed (non-random, SSR-safe) jitter added to per-link stagger delay and fade duration; per-link easing switched to `easeInOut` so links rise gradually instead of "popping" near-instantly and holding. No movement, scale, or rotation added — opacity only.
- Wampum was explicitly left untouched — highest cultural weight, "presence not performance": one fade in, a brief hold, one fade out, never a per-bead animation.

### Validation completed

- `npm run lint` — no errors.
- `npx tsc --noEmit` — no type errors.
- `npm run build` — production build clean, all 8 routes generated, `/` still static.
- Manually verified in a browser against a **production build** (not just dev mode, where React's Strict Mode double-invokes effects and can mask or introduce timing differences): natural completion, skip (button/Escape/click-anywhere), reduced-motion bypass, mobile viewport, Hero non-double-animation.

### Deferred / known limitations

- Hero's own content entrance (independent of the intro) still doesn't gate on `prefers-reduced-motion` — only its northern-lights background layer does. An attempted fix caused an SSR/hydration mismatch (`useReducedMotion()` resolves synchronously on the client's first render, but the server always renders as motion-enabled); a proper fix needs the same "resolve before paint, client-side only" pattern `HomeClient` uses for the intro. Pre-existing gap from Phase 3/8, not fixed here.

---

## Phase 10 Completed — Backend & AI Assistant

### Implementation Summary

FastAPI backend created in `fiddlers_green-backend/` with the following structure:

```
fiddlers_green-backend/
├── main.py                  — app init, CORS, router registration
├── routes/
│   ├── contact.py           — POST /contact
│   └── chat.py              — POST /chat
├── services/
│   ├── email_service.py     — SMTP via asyncio.to_thread
│   └── ai_service.py        — Anthropic Claude integration
├── models/
│   ├── contact.py           — ContactRequest / ContactResponse (Pydantic)
│   └── chat.py              — ChatRequest / ChatResponse (Pydantic)
├── .env                     — secrets (git-ignored)
└── .env.example             — template (committed, no secrets)
```

**Endpoints:**
- `GET /health` — returns `{ "status": "ok" }`, used to confirm the service is running.
- `POST /contact` — Pydantic-validated body (`name`, `email`, `message`, `inquiry_type`); calls `email_service.py`; returns `{ ok, detail }` or HTTP 502 on delivery failure.
- `POST /chat` — validates message is non-empty; calls `ai_service.py`; returns `{ reply }` or HTTP 502 on API failure.

**Architecture constraints honored:** no authentication, no database, no sessions, no streaming, no background jobs, no logging framework. Failures surface as HTTP error responses with plain detail messages only.

**Bug fixed during validation:** the Anthropic client was constructed at module import time before `load_dotenv()` was called, so `ANTHROPIC_API_KEY` was always `None`. Fixed by calling `load_dotenv()` at the top of `ai_service.py` before the client is constructed.

### Frontend Integration

- `lib/api.ts` — generic `postJson` helper reads `NEXT_PUBLIC_BACKEND_URL` and handles error propagation for all backend calls.
- `components/contact/ContactForm.tsx` — `name`, `email`, `message`, `inquiry_type` fields; idle / loading / success / error states; wired into `app/contact/page.tsx`.
- `components/chat/ChatWidget.tsx` — user/assistant message list, input, send button, loading indicator. No streaming, no message persistence.
- `app/chat/page.tsx` — dedicated route rendering `ChatWidget`.
- `components/Navbar/index.tsx` — `Chat` link added to `NAV_LINKS`.

### AI Assistant Behavior

- Model: `claude-haiku-4-5-20251001`, `max_tokens: 512`. Stateless: each request is independent with no conversation history.
- System prompt establishes the budtender persona: calm, knowledgeable, premium in tone — not promotional or gimmicky.
- Hard limits enforced via system prompt: no medical or health claims, no dosage recommendations, no invented product details, no competitor discussion.
- Product catalog (all three categories, all eleven products, Haney Pot strength range) is included in the system prompt so replies are grounded in real catalog data.
- Wholesale and business inquiries are redirected to the contact form.
- If the assistant does not know a specific fact, it says so rather than hallucinating.

### Validation Completed

- `npm run lint` — no errors.
- `npx tsc --noEmit` — no type errors.
- `npm run build` — production build clean, all 9 routes generated (`/chat` added).
- `/health` returns `{ "status": "ok" }` — confirmed via `curl`.
- `/contact` tested via `curl` — success path and validation-error path both correct.
- `/chat` tested via `curl` — correct response shape returned.
- `/chat` verified with a live Anthropic API key — contextually appropriate, catalog-accurate replies returned with no backend errors.
- Contact form and chat widget tested end-to-end in a browser against the running backend.

### Security & Repo Hygiene

- `fiddlers_green-backend/.env` is git-ignored — API keys and SMTP credentials are never committed.
- `.env.example` files exist for both frontend and backend as templates with no secrets.
- `node_modules/` excluded via `.gitignore`.
- `.idea/` and editor metadata excluded via `.gitignore`.
- Repository is clean and production-safe.

### Git Milestone

Phase 10 committed and pushed. Repository is in a clean, deployable state.

---

Phase 10 is complete. The project is now a fully functional full-stack application with an integrated AI assistant.

---

## Phase 11 Completed — Final Production Polish & QA

### What was built
- Stub routes now redirect instead of showing placeholder text: `/catalog/[category]` → `/catalog`, `/catalog/gummies/[strength]` → `/catalog/gummies`.
- Contact form's `inquiry_type` changed from free-text to a validated `<select>` (`general` / `wholesale`), matching backend expectations, with a valid default.
- `ProductCard.tsx`: removed `unoptimized` from `<Image>` (Next.js already treats local `.svg` sources as unoptimized automatically via the default loader, so behavior is unchanged); added `priority` to the first product per category.
- Missing assets generated as branded placeholders: `favicon.ico`, `apple-touch-icon.png` (180×180), `og-image.png` (1200×630).
- `app/layout.tsx` metadata: `openGraph.images` wired to `/og-image.png`; `metadataBase` continues to read `NEXT_PUBLIC_SITE_URL`.
- Unused default Next.js SVGs (`file.svg`, `globe.svg`, `window.svg`) removed from `public/` after confirming no references.
- `components/Footer.tsx` added — minimal branded footer, mounted in root layout below `<main>`.
- Accessibility: chat input `aria-label`; `Hero.tsx` content entrance now respects `prefers-reduced-motion` via an isomorphic-layout-effect pattern mirroring `HomeClient.tsx`'s proven approach (framer-motion's `useReducedMotion()` resolves synchronously on the client's first render but always `false` on the server, so branching JSX on it directly causes an SSR/hydration mismatch — this instead starts in agreement with the server and flips state in a layout effect before first paint).

### Containerization
- `fiddlers_green-frontend/Dockerfile` (multi-stage Node build) and `fiddlers_green-backend/Dockerfile` (Python/uvicorn), plus a `.dockerignore` for each.
- `docker-compose.yml` at the repo root wires both services together.
- `NEXT_PUBLIC_BACKEND_URL` build arg defaults to empty: `lib/api.ts` falls back to `${window.location.protocol}//${window.location.hostname}:8000` in the browser when unset, so one built image keeps working across hosts (e.g. once a real domain is behind Nginx) without a rebuild.
- Backend healthcheck (`python -c "urllib.request..."`, `timeout=2` — `python:3.11-slim` has no `curl`) and frontend healthcheck (`node -e "fetch(...)"` — `node:20-alpine` has no `curl` either); frontend's `depends_on` gates on backend health.

### Validation completed
- `npm run lint`, `npx tsc --noEmit`, `npm run build` — all clean.
- `docker compose up --build` — both containers report `Up (healthy)`; `/health`, `/docs`, and `/` all verified reachable; CORS preflight clean; logs free of errors/warnings.

---

## Phase 12 — Chat Widget

**Status: COMPLETE**

### What was built
- `hooks/useChatMessages.ts` — message state (`messages`, `loading`) and `sendMessage`, extracted from the original `ChatWidget.tsx` so the logic is shared rather than duplicated.
- `components/chat/ChatWidget.tsx` — refactored onto the hook; UI unchanged.
- `components/FloatingChat/` — a new persistent floating widget: `ChatButton.tsx` (FAB, `z-[60]`, animated chat↔close icon, subtle idle pulse that stops once opened), `MessageInput.tsx`, `MessageList.tsx` (auto-scroll, loading indicator, empty state), `ChatPanel.tsx` (dialog, header, close button, FAQ quick-reply view shown only when there are no messages yet), `index.tsx` (root: open/close state, focus management, ESC-to-close, mobile-only body-scroll lock, hidden on `/chat`, a one-time delayed auto-open on first landing on `/` that never re-triggers once the user manually dismisses it this session).
- `app/layout.tsx` — mounts `<FloatingChat />` after `<Footer />` via `next/dynamic` (without `ssr: false`, which isn't valid on `next/dynamic` inside this Server Component — see inline comment there).

### Key decisions
- `FloatingChat` lives in the root layout, so its state (open/closed, message history) persists across client-side navigation, and is only hidden — not unmounted — on `/chat`, which has its own dedicated `ChatWidget`.
- Focus management uses `forwardRef` threaded down to the actual `<input>` (open → focus input, close → focus returns to the FAB), through every closing path (X button, ESC, and toggling the FAB itself).
- FAQ quick-replies call the existing `sendMessage()` directly rather than manually appending a message — `sendMessage` already does the optimistic user-message append itself, so a separate append would double it.

### Validation completed
- `npx tsc --noEmit` clean after every step; `npm run lint` clean; `npm run build` clean.
- Full live validation against the running Docker stack via browser automation: FAB visible on all routes except `/chat`; open/close, focus management, and ESC all verified; message send/receive verified against both a placeholder and a real `ANTHROPIC_API_KEY` (graceful error path and real reply path both confirmed); messages persist across client-side navigation; mobile body-scroll lock confirmed active at 375px width and correctly inactive at 1280px width.
- Accessibility: keyboard-only interaction verified (Tab to FAB, Enter submits), `aria-label`/`aria-expanded` on the FAB, `role="dialog"`/`aria-modal`/`aria-label` on the panel, focus-visible rings on all interactive elements, focus moves to the input on open and returns to the FAB on close.
- FAQ quick-replies (added in the post-completion refinement pass): auto-open behavior and session-dismissal persistence verified across hard reloads; clicking a FAQ button confirmed to produce exactly one user message (no duplicate) and a real backend reply.

---

## Phase 13 Completed — Final Production Polish & QA (Deployment Readiness)

### What was fixed
- **HTML structure (Section 3):** Removed nested `<main>` elements from all 5 affected route `page.tsx` files — `/catalog`, `/catalog/gummies`, `/heritage`, `/contact`, `/chat` (outer wrapper changed to `<div>`, all Tailwind classes preserved exactly, no visual change). The single `<main>` in `app/layout.tsx` remains the correct landmark.
- **Per-route metadata (Section 3):** Added `metadata` exports to the four public content routes (`/catalog`, `/heritage`, `/contact`, `/chat`).
- **`robots.txt` & sitemap (Section 3):** Created `public/robots.txt` (with a `PRODUCTION_DOMAIN` placeholder, not an invented domain) and `app/sitemap.ts` (generates all 6 public routes; excludes redirect stubs).
- **`next.config.ts` (Section 3):** Added `poweredByHeader: false`.
- **Accessibility (Section 4):** Added an ESC-key handler to `Navbar`'s mobile menu, mirroring `FloatingChat`'s existing pattern. The hamburger button's `aria-label`/`aria-expanded`/`aria-controls` were already present from earlier work, so no change was needed there.
- **Backend: FastAPI docs (Section 6):** `/docs` and `/redoc` now conditionally disabled via a `DISABLE_DOCS` environment variable; defaults to enabled (current local-dev behavior unchanged) unless explicitly set `true`.
- **Backend: `inquiry_type` validation (Section 6):** Changed `Optional[str] = None` to `Optional[Literal["general", "wholesale"]] = "general"` in `ContactRequest` — the only file touched for this fix, per the plan's explicit scope constraint.
- **Configuration (Section 2):** Both `.env.example` files fully commented; `NEXT_PUBLIC_SITE_URL` added to frontend; `DISABLE_DOCS` added to backend. Discovered and fixed that `fiddlers_green-frontend/.env.example` had never actually been committed to git — an overly broad `.env*` rule in the frontend `.gitignore` had silently blocked it since Phase 10 despite being documented as committed. Added `.env.local.example` as the Docker-facing template and the necessary `.gitignore` negations (`!.env.example`, `!.env.local.example`).

### Sections that required no code changes (audit-only)
- **Section 1 — Repository health:** confirmed clean tree, `main` branch, and CLAUDE.md accuracy. The empty `sections/` placeholder turned out to have never been tracked by git at all (Git doesn't track empty directories), so removing it from disk produced no commit.
- **Section 5 — Performance:** confirmed no `unoptimized` flag in `next.config.ts`; `CategoryEffect`'s and `ChatButton`'s looping animations correctly gate on `useReducedMotion()`/open-state; fonts use `display: "swap"`; `FloatingChat` is genuinely split into its own dynamic chunk (confirmed via a distinctive-string search in the built bundle, not just configuration inspection). No changes needed.
- **Section 7 — Responsive QA:** audited all 7 named components (plus `IntroSequence`'s 4 sub-components) against the four required viewports via code review. No confirmed bugs. Two observations documented rather than fixed — see known limitations below.

### Known limitations carried forward
- Hero's own content entrance (`fadeUp` variants on eyebrow, headline, body, CTA) still does not respect `prefers-reduced-motion` — a pre-existing gap from Phase 9 (only Hero's northern-lights background layer guards on it). Deliberately not touched here: the fix risks reintroducing the SSR/hydration mismatch that was specifically ruled out in Phase 11.
- Catalog's product grid (`CategorySection.tsx`) intentionally uses 2 columns even at 390px — a deliberate Phase 4 design choice, not a defect; flagged during the Section 7 audit only because the plan's own illustrative example assumed single-column mobile layouts.
- `HeritageTimeline`'s entrance animation wrapper has no explicit `overflow-hidden` safeguard. Risk is low given the small (-16px) offset, but not conclusively ruled out without live-browser verification — flagged for manual QA, not treated as fixed.

### Validation completed
- `npm run lint` — no errors. `npx tsc --noEmit` — no errors (run after every individual file edit throughout, not just at section boundaries). `npm run build` — clean, all 10 routes generated including `/sitemap.xml`; stub routes (`/catalog/[category]`, `/catalog/gummies/[strength]`) correctly render as dynamic redirects, not 404s.
- `docker compose up --build -d` — both containers reported `Up (healthy)`; `GET /health` → `{"status":"ok"}`; `GET /` → 200.
- Security: `GET /docs` → 200 (correct for local dev, since `DISABLE_DOCS` is unset); `POST /contact` with `inquiry_type: "invalid"` → 422.
- Accessibility: not freshly re-verified live in this final pass — browser automation tooling became unavailable partway through Section 4 and did not reconnect. Relying instead on prior verified behavior: `FloatingChat`'s full open/close/focus-management/ESC cycle was live-tested via Playwright during both Phase 12 and the Section 4 investigation; Navbar's new ESC handler was confirmed correct at the compiled-bundle level once a stale Docker container (the actual cause of an earlier apparent test failure, not a real code defect) was identified and removed.
- `git status` clean throughout every section; no `.env` files with real values were ever staged or committed.

---

## Phase 14 — VPS Deployment with NGINX + Domain + SSL

**Status: NOT STARTED**

Tasks:
- Production deployment to Vercel.
- Custom domain configuration and DNS propagation confirmed.
- Final QA on production URL (not preview deployment).
- Error monitoring active.
- Feedback collection mechanism in place.
