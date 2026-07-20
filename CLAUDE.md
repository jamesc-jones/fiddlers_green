# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This is a monorepo with two independent projects, neither of which is wired to the other yet:

- `fiddlers_green-frontend/` — a Next.js (App Router) site. This is where all current work happens.
- `fiddlers_green-backend/` — currently empty. No backend code, framework, or API exists yet. Don't assume any backend conventions until this is populated.

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

All primary routes are implemented and validated. The project has completed through Phase 9 — Cinematic Intro. The next phase is Phase 10 (optional) — AI Assistant, or Phase 11 — Final Polish & Production Preparation.

**Route status:**
- `/` — Hero section (Phase 3) plus a skippable cinematic intro sequence on first visit per session (Phase 9)
- `/catalog` — Editorial catalog with categories, product cards, hover effects (Phase 4)
- `/catalog/gummies` — Interactive two-stage Haney Pot strength selector (Phase 5)
- `/catalog/gummies/[strength]` — Stubbed strength detail page (to be expanded)
- `/catalog/[category]` — Stubbed dynamic category route (to be expanded)
- `/heritage` — Full cultural storytelling page with timeline (Phase 6)
- `/contact` — Still a placeholder stub

**Component directories in use:**
- `components/Navbar/` — Shared persistent navigation
- `components/Hero.tsx` — Homepage hero with northern lights atmosphere (Phase 7); accepts a `skipEntrance` prop so it can render already-settled when the Phase 9 intro owns the reveal
- `components/HomeClient.tsx` — Client orchestrator for `/`; decides whether the intro plays and coordinates it with `Hero` (Phase 9)
- `components/IntroSequence/` — Cinematic intro overlay: `index.tsx`, `SkipButton`, `LogoReveal`, `FeatherSVG`, `ChainFormation`, `WampumReveal` (Phase 9)
- `components/catalog/` — CatalogCover, CategorySection, ProductCard, TableOfContents, CategoryEffect
- `components/catalog/gummies/` — GummiesHero, GummiesEntrySelector, StrengthSelector, EntryOptionCard, StrengthButton
- `components/heritage/` — HeritageHero, ChapterSection, TwoRowWampum, CovenantChain, TyendinagaHistory, HeritageTimeline, HeritageDivider

**Data layer:**
- `data/products.ts` — Static typed catalog data (CATEGORIES array, Product and Category types)
- `data/strengths.ts` — Gummy strength options (STRENGTHS const, Strength type)
- `data/entryOptions.ts` — Gummy entry options (ENTRY_OPTIONS const, EntryOptionId type)

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

## Development Roadmap

### Phase 10 — AI Assistant (Optional)

**Status: FUTURE — OPTIONAL**

Purpose: interactive Budtender experience — product guidance, strain education, FAQ, personalized recommendations.

Key considerations before starting:
- API design and rate limiting strategy.
- Safety and compliance requirements (cannabis context).
- UX placement (floating widget vs. dedicated page vs. inline).
- Whether this belongs before or after launch.

---

### Phase 11 — Final Polish & Production Preparation

**Status: REQUIRED BEFORE DEPLOYMENT**

Purpose: move from polished prototype → production-ready website.

**Checklist:**

Visual:
- Brand consistency across every page and state.
- No placeholder content, stub sections, or unfinished copy.
- Final product photography replacing SVG placeholders in `data/products.ts`.

Responsive:
- Full end-to-end validation: 390px (iPhone SE), 768px (iPad), 1440px (desktop).
- Test on real devices, not only emulators.

Performance:
- Lighthouse audit (target: Performance ≥ 90, Accessibility ≥ 90).
- Bundle size review (`next build` output analysis).
- All images through `next/image` with correct `sizes`, `priority`, and formats.
- Animation jank check on low-end mobile (throttled CPU).

Accessibility:
- Keyboard navigation through every interactive element.
- Color contrast ratios ≥ 4.5:1 for all body text.
- `prefers-reduced-motion` respected everywhere.
- All images have meaningful `alt` text.
- Semantic HTML audit (`main`, `nav`, `section`, `article`, `h1`→`h6` hierarchy).

Deployment preparation:
- `NEXT_PUBLIC_SITE_URL` environment variable set in Vercel.
- `metadataBase` resolving correctly in production.
- Open Graph image (`/og-image.jpg`, 1200×630) created and wired into `layout.tsx`.
- Favicon and `apple-touch-icon` assets in `public/`.
- Analytics configured if required.
- Error monitoring configured (Sentry or equivalent) if required.

---

### Phase 12 — Deploy & Launch

**Status: FINAL**

Tasks:
- Production deployment to Vercel.
- Custom domain configuration and DNS propagation confirmed.
- Final QA on production URL (not preview deployment).
- Error monitoring active.
- Feedback collection mechanism in place.
