import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted rather than fetched from Google at build time: a build
// that depends on a network call fails when the network does, which it
// has. Files come from Fontsource, so updating is a version bump.
const display = localFont({
  src: "../fonts/bagel-fat-one-latin-400-normal.woff2",
  variable: "--font-display-face",
  display: "swap",
});

const sans = localFont({
  src: [
    { path: "../fonts/plus-jakarta-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/plus-jakarta-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../fonts/plus-jakarta-sans-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-sans-face",
  display: "swap",
});

const mono = localFont({
  src: [
    { path: "../fonts/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/jetbrains-mono-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CampusOS",
  description: "The academic home for students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Runs before paint: reading the preference in an effect means
            a flash of light before dark applies. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("campusos-theme")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
