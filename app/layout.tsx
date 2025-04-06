import Page from "@/components/Page";
import { DESCRIPTION, GTM_ID, TITLE } from "@/lib/config";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Fira_Code, Lora } from "next/font/google";
import { StrictMode } from "react";
import "./globals.css";

// Define Lora font configuration
const lora = Lora({
  variable: "--font-lora", // CSS variable name for Lora
  subsets: ["latin"],
  // Include weights you'll likely use (e.g., Regular, Medium, SemiBold, Bold)
  weight: ["400", "500", "600", "700"],
});

// Define Fira Code font configuration
const firaCode = Fira_Code({
  variable: "--font-fira-code", // CSS variable name for Fira Code
  subsets: ["latin"],
  // Usually only need Regular weight for code, but include others if needed
  weight: ["400", "500", "600", "700"],
  // Optional: Disable ligatures if you prefer
  // variable: '--font-fira-code-nl', // Example if using no-ligature version
});

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lora.variable} ${firaCode.variable}`}>
      <StrictMode>
        <body className="antialiased">
          <Page>{children}</Page>
        </body>
        {GTM_ID && <GoogleAnalytics gaId={GTM_ID} />}
      </StrictMode>
    </html>
  );
}
