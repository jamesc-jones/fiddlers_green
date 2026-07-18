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

Routes `/catalog`, `/contact`, and `/heritage` are still placeholder stubs with minimal markup and no real content or data fetching. `/` and the shared layout (`app/layout.tsx` + `components/Navbar`) are implemented as of Phase 2 — see below. Treat the still-stub route pages as scaffolding, not a pattern to preserve if a task calls for real implementation.

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
