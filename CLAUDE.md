# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm install          # Install dependencies
pnpm dev             # Run development server with Turbopack at http://localhost:3000
pnpm build           # Build production version (outputs to /out directory)
pnpm start           # Build and serve production version
```

### Testing & Validation
```bash
pnpm check           # Run TypeScript and ESLint checks
pnpm e2e:dev        # Run Cypress E2E tests against dev server
pnpm e2e:build      # Run Cypress E2E tests against production build
```

## Architecture

### Content System
- **MDX Content**: All content is in MDX files located in `public/` directory
- **Routing**: Next.js App Router with dynamic catch-all route `app/[...path]/page.tsx`
- **Chapter Configuration**: Defined in `lib/config.ts` - controls navigation and available pages
- **MDX Processing**: Content is compiled using `next-mdx-remote` with custom components and plugins

### Key Components
- **Page Layout**: `components/Page.tsx` wraps all content with Header, Sidebar, and Footer
- **MDX Compilation**: `lib/lib.ts` handles MDX compilation with syntax highlighting, math rendering (KaTeX), and custom component registration
- **Citations**: BibTeX-based citation system with hover tooltips (`components/content/Citations.tsx`)
- **Footnotes**: Custom footnote system (`components/content/Footnotes.tsx`)
- **Interactive Widgets**: Located in `components/widgets/` - various educational interactive components

### Styling
- **CSS Framework**: Tailwind CSS with typography plugin
- **Fonts**: Merriweather (serif) for content, JetBrains Mono for code
- **Math Rendering**: KaTeX for LaTeX equations with custom macros

### Build & Deployment
- **Static Site Generation**: Next.js exports static HTML to `/out` directory
- **CI/CD**: GitHub Actions workflow builds and deploys to GitHub Pages on push to main
- **Preview Deployments**: Vercel provides preview deployments for PRs

## Important Patterns

### Adding New Content
1. Create MDX file in `public/` directory
2. Add chapter entry to `CHAPTERS` array in `lib/config.ts`
3. Use custom components: `<Cite>`, `<Footnote>`, `<Math>`, `<EqRef>`

### MDX Gotchas
- Curly braces `{}` are JSX expressions in MDX - use `\{` and `\}` for literal braces
- Math equations: inline `$...$` or display `$$...$$`
- Custom KaTeX macros defined in `lib/lib.ts` (e.g., `\R` for `\mathbb{R}`)

### Component Registration
New MDX components must be registered in `lib/lib.ts` in the `compileMDX` components object.

## Workflow Instructions

### Push Monitoring
After pushing commits to GitHub:
1. Check periodically if the workflow succeeded using `gh run list --limit 1` when you have no other work
2. If the user reports "your push failed", immediately investigate using `gh run view --log` and fix the issues
3. Push the fixes and repeat until the workflow succeeds

This ensures the deployment pipeline remains healthy and the static site builds correctly without blocking conversation.