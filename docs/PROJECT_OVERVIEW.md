# Project Overview

_A concise technical orientation for new contributors_

---

## 1. Purpose & Architecture

**problens-web** is an interactive, static-exported learning site (Next.js 14, App Router) that teaches probability / information-theory concepts through MDX chapters and live React widgets.

```
├─ app/                # Next.js routes (mostly catch-all MDX renderer)
├─ components/
│   ├─ content/        # Layout primitives (Block, Footnote, etc.)
│   └─ widgets/        # Interactive calculators (Bayes, KL, …)
├─ lib/                # MDX compilation pipeline + helpers
├─ public/             # MDX chapters, figures, data assets
├─ code/               # Python notebooks / scripts backing figures
└─ docs/               # Project docs (this file, CLAUDE.md, …)
```

Key build facts

- Tailwind CSS for styling, KaTeX for math.
- All narrative lives in `public/**/*.mdx`; widgets are imported directly.
- `next export` → static HTML in `/out` (deployed via GH Pages or Vercel preview).

## 2. Core Directories

| Path                 | Role                                                             |
| -------------------- | ---------------------------------------------------------------- |
| `components/widgets` | All interactive elements – each is a client component.           |
| `components/content` | Typographic helpers and MDX-only wrappers.                       |
| `public/XX-*.mdx`    | Chapters (00-introduction … 08-kolmogorov).                      |
| `code/`              | Research notebooks that generate data/figures referenced in MDX. |
| `scripts/`           | One-off helpers (data scraping, compression runs, etc.).         |

## 3. Recent Changes (May 2025)

- **BayesCalculatorWidget** now toggles between two- and three-hypothesis modes (default priors `3 : 2 : 1`).
- `01-kl_intro.mdx` switched to `\textsf{fair}` / `\textsf{biased}` convention.

## 4. Development Quick-Start

```bash
pnpm install        # deps
pnpm dev            # dev server → http://localhost:3000
pnpm build          # static export → /out
pnpm check          # ESLint + type-check
pnpm e2e:dev        # Cypress against dev server
```

_(Extended command list & CI-related notes live in [docs/CLAUDE.md](CLAUDE.md).)_

### Live-server Reminder (from CLAUDE.md)

- Always start **one** dev server (`pnpm dev`) on port 3000 and keep it running.
- If port 3000 is in use, assume the server is already running – _do **not** spawn another copy_.

## 5. Coding Patterns & Gotchas

1. **MDX Curly-brace Quirk** – if a math expression contains `{}`, wrap it in `<Math>` instead of `$…$` to avoid parser errors. _(See CLAUDE.md "MDX gotchas.")_
2. **Static asset paths** – in widgets, prepend `/problens-web/…` so links work in static export.
3. **Widget registration** – any new component used in MDX must be added to the `components` map inside `lib/lib.ts`.
4. **fn_index caveat** – widgets that call the HF Space must preserve existing `fn_index` values (don't renumber).

## 6. Roadmap / Open Todos

- Global layout / dark-mode theme.
- Re-usable hooks (`useBayes`, `useKL`).
- Build‐time notebook → figure pipeline.
- Expand Cypress suite; add unit tests for widget math.

## 7. Commands (from CLAUDE.md)

### Development

```bash
pnpm install   # Install dependencies
pnpm dev       # Dev server (Turbopack) → http://localhost:3000
pnpm build     # Static production export (to /out)
pnpm start     # Build + serve production output
```

### Testing & Validation

```bash
pnpm check     # TypeScript + ESLint
pnpm e2e:dev   # Cypress against dev server
pnpm e2e:build # Cypress against production build
```

## 8. Deeper Architecture Notes (from CLAUDE.md)

### Content System

- **MDX files** live under `public/`.
- Next.js App Router uses a dynamic catch-all route `app/[...path]/page.tsx` to render any MDX.
- Chapter list & sidebar are driven by `lib/config.ts` (`CHAPTERS` array).
- MDX is compiled via `next-mdx-remote` with: syntax‒highlighting, KaTeX, custom shortcodes (Block, Cite, Footnote, Math, EqRef, …).

### Page Layout & Components

- Global shell: `components/Page.tsx` (header / sidebar / footer wrappers).
- Interactive widgets live in `components/widgets` and are registered in `lib/lib.ts` so MDX can import them by name.
- Citation hover tooltips and footnotes come from dedicated components in `components/content`.

### Styling

- **Tailwind CSS** + typography plugin.
- Fonts: Merriweather (serif body), JetBrains Mono (code).
- Math: KaTeX + custom macros (see `lib/lib.ts`).

### Build & Deployment

- Static-export (`next export`) → `/out`.
- CI workflow builds and publishes to GitHub Pages; Vercel handles preview deployments for PRs.

## 9. Important Patterns & Gotchas (from CLAUDE.md)

1. **Adding new content**:
   1. Drop an `.mdx` file into `public/`.
   2. Append an entry to `CHAPTERS` in `lib/config.ts`.
   3. Use custom components (`<Cite>`, `<Footnote>`, `<Math>` …).
2. **MDX curly–brace quirk** – convert any math with `{}` to `<Math>` tags.
3. **Image paths** – always prepend `/problens-web/` so static export links resolve.
4. **Component registration** – add new MDX components to `lib/lib.ts`.
5. **Relative layout** – prefer relative positioning/lengths for mobile friendliness.
6. **HF Space widgets** – keep existing `fn_index` values; don't renumber.
7. **Server discipline** – one dev server on port 3000; check before starting.

## 10. Workflow Instructions (from CLAUDE.md)

**Push Monitoring**

1. After pushing, run `gh run list --limit 1` to verify the GH Actions build.
2. On failure, inspect logs via `gh run view --log`, fix, and re-push until green.

This keeps the GitHub Pages deployment healthy and prevents conversation blockers.

## 11. "Memories" Checklist (select highlights)

- `<Math>` tag usage & image path rule.
- Always run/keep a single `pnpm dev` in background on port 3000.
- Save widget-related files inside `public/` so they're exported.
- When interacting with HF Space `probabilistic-lenses-widgets`, minimise disruption to `fn_index`.
- Keep text tone inviting / non-academic.

(See **CLAUDE.md** for the full memory list.)

---

> **For deeper workflow instructions, CI tips, and philosophy of interacting with Claude Code, read [CLAUDE.md](CLAUDE.md).**
