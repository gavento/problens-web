import { join } from "path";
import { contentDirectory } from "./config";
import { readFileSync, readdirSync } from "fs";
import { compileMDX } from "next-mdx-remote/rsc";
import React from "react";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { Cite, References } from "@/components/content/Citations";
import { Footnote } from "@/components/content/Footnotes";
import { Footnotes } from "@/components/content/Footnotes";
import EvidenceAccumulationSimulator from "@/components/widgets/EvidenceAccumulationSimulator";
import FinanceImageSliderWidget from "@/components/widgets/FinanceSlider";
import SoftmaxWidget from "@/components/widgets/SoftmaxWidget";
import LogisticWidget from "@/components/widgets/LogisticWidget";
import DistributionComparisonWidget from "@/components/widgets/DistributionComparisonWidget";
import EntropyWidget from "@/components/widgets/EntropyWidget";
import MultipleChoiceQuestion from "@/components/widgets/MultipleChoiceQuestion";
import ExpertRatingWidget from "@/components/widgets/ExpertRatingWidget";
import { compile, evaluate } from "@mdx-js/mdx";
import chalk from "chalk";
import * as runtime from "react/jsx-runtime";
import KatexMath from "@/components/content/KatexMath";
import NumberedMath from "@/components/content/NumberedMath";
import EquationRef from "@/components/content/EquationRef";
import { EquationProvider } from "@/components/content/EquationContext";
import Block from "@/components/content/Block";
import Expand from "@/components/content/Expand";

// Force color support for CI/build environments
chalk.level = 3;

export async function getMdxContent(path: string) {
  const fullPath = join(contentDirectory, `${path}.mdx`);
  const source = readFileSync(fullPath, "utf-8");

  try {
    // Check if the file is valid MDX
    await compile(source);

    // const res = await evaluate(source, {
    //   ...runtime,
    //   // components: {
    //   //   Cite: Cite,
    //   //   References: References,
    //   //   Footnotes: Footnotes,
    //   //   Footnote: Footnote,
    //   //   EvidenceAccumulationSimulator: EvidenceAccumulationSimulator,
    //   // },
    //   baseUrl: import.meta.url,
    //   remarkPlugins: [
    //     remarkGfm, // GitHub Flavored Markdown
    //     remarkMath, // Math equations
    //   ],
    //   rehypePlugins: [
    //     [
    //       rehypeKatex,
    //       {
    //         macros: {
    //           "\\R": "\\mathbb{R}",
    //           "\\eps": "\\varepsilon",
    //         },
    //         trust: true,
    //       },
    //     ], // KaTeX for math rendering
    //     rehypeHighlight, // Syntax highlighting
    //   ],
    //   // development: true,
    // });
    // return res.default({});
  } catch (error) {
    const mdxError = error as any;
    const lineNumber = mdxError.line || mdxError.cause?.loc?.line;
    const column = mdxError.column || mdxError.cause?.loc?.column;
    const reason = mdxError.reason || mdxError.message;

    // Get the problematic line and surrounding context
    const lines = source.split("\n");

    // Create a context snippet with line numbers
    const startLine = Math.max(1, lineNumber - 2);
    const endLine = Math.min(lines.length, lineNumber + 2);
    const snippet = [];

    // Find the line number width for proper padding
    const lineNumWidth = String(endLine).length;

    // Check if this might be a curly brace issue in LaTeX
    const errorLine = lines[lineNumber - 1] || "";
    const hasCurlyBeforeError = column > 0 && errorLine.substring(0, column).includes("{");

    for (let i = startLine - 1; i < endLine; i++) {
      const isErrorLine = i === lineNumber - 1;
      const lineNum = String(i + 1).padStart(lineNumWidth, " ");

      if (isErrorLine) {
        // Add the error line in red
        snippet.push(chalk.gray(`${lineNum}|`) + " " + chalk.red(lines[i]));

        // Create the error marker line with precise alignment
        const errorPointer = " ".repeat(Math.max(0, column - 1)) + chalk.bold.red("^");
        snippet.push(chalk.gray(" ".repeat(lineNumWidth) + "|") + " " + errorPointer);
      } else {
        snippet.push(chalk.gray(`${lineNum}|`) + " " + lines[i]);
      }
    }

    let errorOutput =
      "\n" +
      chalk.bold.red(`Error parsing MDX file: ${path}.mdx\n`) +
      chalk.yellow(`${reason} at line ${lineNumber}${column ? `, column ${column}` : ""}\n\n`) +
      snippet.join("\n");

    // Add helpful hint for curly brace issues
    if (hasCurlyBeforeError) {
      errorOutput +=
        "\n\n" +
        chalk.cyan(
          "Hint: Unlike plain MD, MDX uses {...} for JSX expressions. To get literal curly braces, use \\{ and \\}",
        );
    }

    console.error(errorOutput + "\n");

    throw new Error(`Failed to compile MDX: ${reason}`);
  }

  const { content } = await compileMDX({
    source,
    components: {
      Cite: Cite,
      References: References,
      Footnotes: Footnotes,
      Footnote: Footnote,
      EvidenceAccumulationSimulator: EvidenceAccumulationSimulator,
      FinanceImageSliderWidget: FinanceImageSliderWidget,
      SoftmaxWidget: SoftmaxWidget,
      LogisticWidget: LogisticWidget,
      DistributionComparisonWidget: DistributionComparisonWidget,
      EntropyWidget: EntropyWidget,
      MultipleChoiceQuestion: MultipleChoiceQuestion,
      ExpertRatingWidget: ExpertRatingWidget,
      Math: NumberedMath,
      EqRef: EquationRef,
      Block: Block,
      Expand: Expand,
    },
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [
          remarkGfm, // GitHub Flavored Markdown
          remarkMath, // Math equations
        ],
        rehypePlugins: [
          [
            rehypeKatex,
            {
              macros: {
                "\\R": "\\mathbb{R}",
                "\\eps": "\\varepsilon",
              },
              trust: true,
            },
          ], // KaTeX for math rendering
          rehypeHighlight, // Syntax highlighting
        ],
        development: true,
      },
    },
  });

  return content;
}

export function getAllMdxPaths() {
  const files = readdirSync(contentDirectory);
  return files.filter((file) => file.endsWith(".mdx")).map((file) => file.replace(/\.mdx$/, ""));
}
