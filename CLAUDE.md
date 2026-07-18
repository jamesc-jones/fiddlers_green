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
- `app/layout.tsx` is the root layout: loads the Geist Sans/Mono fonts via `next/font/google` as CSS variables and sets global HTML/body structure.
- `app/globals.css` uses Tailwind v4's `@tailwind` directives; global background/foreground colors are set here (currently black background, white text) rather than per-page.
- `components/` and `sections/` exist as empty placeholder directories — no shared component or page-section pattern has been established yet. If you add the first component here, you're setting the convention, not following one.
- Styling is Tailwind CSS v4 (via `@tailwindcss/postcss`), utility classes only — no CSS modules or styled-components in use.
- Path alias `@/*` maps to the frontend project root (see `tsconfig.json`).
- `framer-motion` is a dependency but not yet used anywhere in the current pages — available for animation work.

### Current state

All routes (`/`, `/catalog`, `/contact`, `/heritage`) are placeholder stubs with minimal markup and no real content, data fetching, or shared layout elements (nav/footer) yet. Treat existing pages as scaffolding, not a pattern to preserve if a task calls for real implementation.
