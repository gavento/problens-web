import Page from "@/components/Page";
import { DESCRIPTION, GTM_ID, TITLE } from "@/lib/config";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { StrictMode } from "react";
import "./globals.css";

// Define Source Serif Pro font configuration
const sourceSerif = Source_Serif_4({
  variable: "--font-serif", // CSS variable name for main font
  subsets: ["latin"],
  // Include a range of weights for flexibility in mathematical content
  weight: ["400", "500", "600", "700"],
});

// Define JetBrains Mono font configuration
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono", // CSS variable name for monospace font
  subsets: ["latin"],
  // Include multiple weights for better typography control
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={`${sourceSerif.variable} ${jetbrainsMono.variable}`}>
      <StrictMode>
        <body className="antialiased">
          <Page>{children}</Page>
        </body>
        {GTM_ID && <GoogleAnalytics gaId={GTM_ID} />}
      </StrictMode>
    </html>
  );
}
