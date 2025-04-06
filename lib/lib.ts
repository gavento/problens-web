import { join } from "path";
import { contentDirectory } from "./config";
import { readFileSync, readdirSync } from "fs";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { Cite, References } from "@/components/Citations";
import { Footnote } from "@/components/Footnotes";
import { Footnotes } from "@/components/Footnotes";

export async function getMdxContent(path: string) {
  const fullPath = join(contentDirectory, `${path}.mdx`);
  const source = readFileSync(fullPath, "utf-8");

  const { content } = await compileMDX({
    source,
    components: {
      Cite: Cite,
      References: References,
      Footnotes: Footnotes,
      Footnote: Footnote,
    },
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [
          remarkGfm, // GitHub Flavored Markdown
          remarkMath, // Math equations
        ],
        rehypePlugins: [
          rehypeKatex, // KaTeX for math rendering
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
