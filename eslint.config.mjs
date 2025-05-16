import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import mdxPlugin from "eslint-plugin-mdx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // stávající Next.js konfigurace
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // MDX Lint konfigurace
  {
    plugins: { mdx: mdxPlugin },
    overrides: [
      {
        files: ["**/*.mdx"],
        processor: "mdx/mdx",
        extends: ["plugin:mdx/recommended"],
        settings: {
          // umožní lintovat kódové bloky uvnitř trojitých backticků
          "mdx/code-blocks": true,
        },
      },
    ],
  },
];
