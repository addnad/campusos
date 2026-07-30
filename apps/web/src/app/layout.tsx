import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusOS",
  description: "Know exactly what you need to do next.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
