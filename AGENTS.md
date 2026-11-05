# AGENTS.md — devaluar

Vue 3 + TypeScript + Vite SPA. Currently a fresh scaffold (Vite starter template); the app itself is not built yet.

## Commands

- Package manager: **pnpm** (lockfile is `pnpm-lock.yaml`; don't mix npm/yarn).
- `pnpm dev` — Vite dev server with HMR.
- `pnpm build` — `vue-tsc -b && vite build`. **The typecheck is part of the build**; there is no separate typecheck/lint script.
- `pnpm preview` — serve the production build.

There is **no test runner and no linter configured** (no vitest, eslint, prettier). Don't invent `pnpm test`/`pnpm lint`; if tests are needed, the framework has to be added first.

## TypeScript setup

- Project references: `tsconfig.json` → `tsconfig.app.json` (src) + `tsconfig.node.json` (vite.config.ts). Run `vue-tsc -b` from the root, not `vue-tsc -p src`.
- `tsconfig.app.json` inherits `@vue/tsconfig/tsconfig.dom.json` and enables `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`. Unused vars and non-erasable TS syntax (enums, parameter properties) break the build.
- `verbatimModuleSyntax` is on in the node config: use `import type` for type-only imports.

## Structure

- `index.html` → `src/main.ts` → `src/App.vue` → `src/components/*.vue`.
- `src/style.css` holds global CSS custom properties (colors, fonts) — use those vars rather than hardcoded colors.
- `src/assets/` is imported through Vite (`import heroImg from '../assets/hero.png'`); `public/` is served as-is (e.g. `/icons.svg#icon-id` sprite references).
- `public/icons.svg` is an SVG sprite referenced via `<use href="/icons.svg#id">`.

## Libraries

- `@vueuse/core` is available. When an equivalent utility exists in VueUse, prefer it over custom implementations (composables, storage, OS preference detection, etc.).

## Spec-driven workflow (important)

Two skills are installed in `.agents/skills/` (locked in `skills-lock.json`, sourced from `klerith/fernando-skills`):

- `/spec` — writes a design spec into `specs/NN-slug.md`. Phases must run in order; it asks clarifying questions before writing code and matches the language of the user's request.
- `/spec-impl` — implements a spec only when its status means "Approved" (any language), creates a git branch from the spec name, then implements step by step with diff reviews.

Consequences for agents:
- `specs/` does not exist yet; create it when running `/spec`. Specs are numbered `NN-slug.md`.
- Optional `specs/.spec-config.yml` controls `AutoCreateBranch` (default `true`).
- `/spec-impl` expects a **git repo** — this directory is not currently one, so branch creation will fail until `git init`.
- Do not implement features directly from a request that has a spec; the intended flow is spec → approve → `/spec-impl`.
