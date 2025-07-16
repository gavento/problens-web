import Page from "@/components/Page";
import { DESCRIPTION, GTM_ID, TITLE } from "@/lib/config";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { JetBrains_Mono, Merriweather } from "next/font/google";
import { StrictMode } from "react";
import "./globals.css";

// Define Merriweather font configuration
const merriweather = Merriweather({
  variable: "--font-serif", // CSS variable name for main font
  subsets: ["latin"],
  // Include weights needed for mathematical content
  weight: ["300", "400", "700", "900"],
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
  other: {
    'http-equiv': 'refresh',
    content: '0;url=https://bayesbitsbrains.github.io/'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${merriweather.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Redirect to new site
              (function() {
                const currentPath = window.location.pathname;
                const newBaseUrl = 'https://bayesbitsbrains.github.io';
                
                // Remove /problens-web prefix if present
                const cleanPath = currentPath.replace(/^\/problens-web/, '');
                const redirectUrl = newBaseUrl + cleanPath;
                
                // Show a brief message before redirecting
                document.title = 'Redirecting to new site...';
                
                // Redirect after a short delay
                setTimeout(function() {
                  window.location.href = redirectUrl;
                }, 1000);
              })();
            `,
          }}
        />
      </head>
      <StrictMode>
        <body className="antialiased">
          <Page>{children}</Page>
        </body>
        {GTM_ID && <GoogleAnalytics gaId={GTM_ID} />}
      </StrictMode>
    </html>
  );
}
