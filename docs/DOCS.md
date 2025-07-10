# Project Summary: Applied Information Theory Website

This document summarizes the motivation, proposed direction, and final agreed-upon structure for the Applied Information Theory course website project.

## User Motivation and Desiderata

**Initial Vision:**

- **Goal:** Develop an unconventional course on "applied information theory" designed as an interactive website.
- **Core Idea:** Bridge abstract mathematics (information theory, game theory, statistics) with real-world challenges, focusing on understanding, intuitive "grokking," prediction, and decision-making.
- **Target Audience & Vibe:** Curious undergraduate-level students (Math/CS/STEM), LessWrong readers, and similar audiences interested in deep understanding. The tone should be LessWrong-ish, emphasizing epistemology and practical reasoning, moving beyond standard textbook presentations.
- **Content Focus:** While KL divergence is a central tool, the course should be _problem-driven_, starting with real-world puzzles and introducing tools (often KL) as needed, rather than being purely KL-centric.
- **Format:** An interactive website with a book-like structure, incorporating links, media, and potential interactive elements. Base content derived from an initial LaTeX draft ("Ode to KL") which focused heavily on KL divergence and its applications.
- **Technical Base:** MDX format with KaTeX support for math and citation capabilities.

**Later Refinements & Choices:**

- **Structure Simplification:** Moved from a multi-chapter-file-per-part structure to a single, longer MDX file per logical part of the course for initial development simplicity.
- **MDX Formatting:** Agreed on specific conventions for headings (with embedded IDs for navigation), citations (`<Cite>key</Cite>`), footnotes (`<Footnote>`), math (`$...$`, `$$...$$`), and code blocks.
- **Widget Scope:** Limited initial interactive elements to standard `<Cite>` and `<Footnote>` tags.
- **Font Requirements:** Sought a _serif_ font suitable for a "book and serious deep curiosity" vibe, pairing well with KaTeX math, but less formal/archaic than traditional academic fonts. Readability for long-form content was paramount.

## Proposed Course Vision & Structure (Gemini's Input)

**Narrative & Framing:**

- Proposed reframing the course title/theme towards **"Reasoning and Acting Under Uncertainty: A Computational Toolkit."**
- Emphasized a **problem-centric narrative:** Each section/part should start with fundamental challenges (quantifying belief, updating knowledge, comparing models, making decisions under uncertainty) and then introduce information-theoretic and related tools (Entropy, KL, Bayes, MEP, MLE) as the means to address them. KL divergence emerges as a recurring, powerful tool within this framework, rather than the sole starting point.
- Suggested leveraging the riddles from the initial draft as motivators for different sections/parts.

**Initial Proposed Structure (Rich Version):**

- A multi-part structure (e.g., Introduction, Quantifying, Updating, Modeling, Advanced, Resources).
- Within each part, multiple chapter files (`.mdx`) dedicated to specific concepts (e.g., separate files for Entropy, KL Divergence, Cross-Entropy, Mutual Information in Part 1).
- Detailed content outlines for chapters following a "Puzzle -> Intuition -> Tool -> Formalism -> Application -> Connections" flow.
- Conceptual placeholders for future interactive elements to enhance intuition (e.g., KL calculators, distribution visualizers).

**Content Strategy Thinking:**

- Connect diverse applications (polling, finance, ML loss functions, VAEs, prediction scoring, algorithmic complexity, game theory) back to the core principles (KL minimization, Bayesian reasoning, MaxEnt).
- Systematically derive standard techniques (MLE, specific distributions via MEP, loss functions) from these first principles to provide deeper understanding.
- Maintain the LessWrong-ish spirit by focusing on _why_ things work, epistemological implications, and the nature of models vs. reality.

**Font Exploration:**

- Initially explored both sans-serif (Inter, Source Sans) and modern serif (Source Serif, Roboto Slab) options, considering readability, modernity, and academic tone.
- Upon user refinement towards a serif font, focused on candidates balancing book-like readability, compatibility with math rendering, and a "serious curiosity" vibe (Lora, Alegreya, Source Serif Pro, EB Garamond).

## Agreed Structure and Choices (Current Plan)

**File Structure:**

- **Ultra-Simplified:** One main MDX file per logical part, located in the project root for now.
  - `00-introduction.mdx` with the introduction and motivation, including the motivating riddles
  - `01-quantifying.mdx`
  - `02-updating.mdx`
  - `03-modeling.mdx`
  - `04-advanced.mdx`
  - `resources.mdx`
  - `about.mdx`
- Asset directory created for each part, e.g. `01-quantifying/`. This structure allows for potential expansion into chapter files later if desired.

**Content Implementation:**

- Each `XX-....mdx` file contains the merged content corresponding to that thematic part, structured internally using Markdown headings (`##`, `###`).

**MDX Formatting:**

- Headings: `# Part Title`, `## Section Title <a id="section-title"></a>`, same for H3 and on.
- Citations: `<Cite>key</Cite>` (using bibtex keys from a pending BibTeX bib file).
- Footnotes: `Footnote here<Footnote>...</Footnote>, custom mark<Footnote mark="*">This uses a custom mark</Footnote>, and reusing marks<Footnote mark="*" />..`
- Math: Inline `$..$` and display `$$..$$` via KaTeX. Neither `\[..\]`, `\(..\)`, nor `\begin{equation}...\end{equation}` are supported (now).
- Images generally go in section assets dir, e.g. `01-quantifying/`.
- Code: Markdown style, with syntax highlighting.

**Font Choice:**

- **Main Content Font:** **Lora** (Google Font), chosen for its balance of readability, book-like character, elegance, and suitability for the "serious deep curiosity" vibe while pairing well with math. Configured via `next/font` with CSS variable `--font-lora`.
- **Monospace Font:** **Fira Code** (Google Font), chosen for code blocks. Configured via `next/font` with CSS variable `--font-fira-code`.

### JSX & LaTeX escaping guideline 2025-07-10

When writing TeX inside JSX string literals (e.g. `InlineMath`), write **exactly one backslash per TeX command**.  
Since backslash isn’t an escape character in normal JS strings (except before special escapes like `\n`, `\t`), a single `\` is what you want.

```tsx
<InlineMath math="p(x) \propto x^{-\lambda}" />   // ✅ renders p(x) ∝ x^{-λ}
<InlineMath math="p(x) \\propto x^{-\\lambda}" /> // ❌ renders p(x) ∝ x^{-\lambda}
```

Avoid accidentally double-escaping.

This summary reflects the current state and decisions made on 2025-04-06 for proceeding with the website development.
