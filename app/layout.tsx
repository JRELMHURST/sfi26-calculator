import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SFI26 Calculator — Estimate your Sustainable Farming Incentive payment",
  description:
    "Free SFI26 calculator. Enter your land, see your estimated annual Sustainable Farming Incentive 2026 payment in 2 minutes. All 71 SFI26 actions and rates.",
  openGraph: {
    title: "SFI26 Calculator",
    description:
      "Free calculator for the Sustainable Farming Incentive 2026. Enter your land, see your estimated annual payment.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        {children}
      </body>
    </html>
  );
}
