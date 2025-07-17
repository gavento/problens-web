# Bayes Bits & Brains

This site is a mini-course in probability and information theory for machine learning. See it live at [bayesbitsbrains.github.io](https://bayesbitsbrains.github.io/).

**⚠️ This repository is archived. Development has moved to <a href="https://github.com/bayesbitsbrains/bayesbitsbrains.github.io">bayesbitsbrains</a>.**

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Content**: MDX with custom components
- **Testing**: Cypress
- **Deployment**: Vercel (preview) + GitHub Actions CI

## Content Editing (MDX)

Content is written in MDX files located in the `public/` directory. Key features:

### Citations

Use the `<Cite>` component to add citations:

```mdx
Single citation: <Cite>BibtexKey</Cite>
Multiple citations: <Cite>BibtexKey1,BibtexKey2</Cite>
```

Citations are automatically numbered and include hover tooltips. References section is auto-generated.
The citations are generated from the `references.bib` file (BibTex, configured in `lib/config.ts`).

### Footnotes

Use the `<Footnote>` component for footnotes, do **not** use the `[^1]` syntax of GitHub Flavored Markdown.

```mdx
Basic footnote<Footnote>Auto-numbered footnote text</Footnote>
Custom mark<Footnote mark="*">Custom marked footnote</Footnote>
Reuse mark<Footnote mark="*" />
```

### Other MDX Features

- Math: Inline `$a^2 = b^2 + c^2$` or displayed `$$\forall n>2: a^n \neq b^n + c^n$$` equations
- Code blocks with syntax highlighting
- Tables and lists (standard markdown)
- Text formatting (bold, italic, links)

## Development

Use DevContainers with `.devcontainer.json` to develop in a containerized environment.

Install dependencies:

```bash
pnpm install
```

Run development server:

```bash
pnpm dev
```

## Configuration

Edit `lib/config.ts` to modify:

- Chapter structure and slugs (`CHAPTERS` array)
- Site title and description
- Content directory path
- Analytics ID

## CI/CD

- GitHub Actions runs tests on PRs and pushes to main
- Vercel automatically deploys:
  - Preview deployments for PRs
  - Production deployments from main branch

## Adding New Content

1. Create new `.mdx` file in `public/`
2. Add chapter entry to `CHAPTERS` in `lib/config.ts`
3. Test locally and create PR
