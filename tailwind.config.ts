import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  content: [
    "./public/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      sm: "40rem", // Small devices (phones)
      md: "48rem", // Medium devices (tablets)
      lg: "64.5rem", // Large devices (laptops) - bigger to avoid 64rem breakpoint
      xl: "80rem", // Extra large devices
      "2xl": "96rem", // 2X large devices
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      typography: {
        DEFAULT: {
          css: {
            "code::before": { content: '""' },
            "code::after": { content: '""' },
            "font-family": "var(--content-font)",
            "font-size": "var(--content-font-size)",
            "line-height": "var(--content-line-height)",
            "--tw-prose-body": "var(--foreground)",
            "--tw-prose-headings": "var(--foreground)",
            "--tw-prose-links": "var(--foreground)",
            "--tw-prose-bold": "var(--foreground)",
            "--tw-prose-counters": "var(--foreground)",
            "--tw-prose-bullets": "var(--foreground)",
            "--tw-prose-quotes": "var(--foreground)",
            "--tw-prose-code": "var(--foreground)",
            "--tw-prose-hr": "var(--foreground)",
            "--tw-prose-th-borders": "var(--foreground)",
            "--tw-prose-td-borders": "var(--foreground)",
          },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config;
