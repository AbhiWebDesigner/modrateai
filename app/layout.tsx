import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "ModrateAI — AI YouTube Comment Moderation",
  description: "AI-powered YouTube comment moderation for Telugu, Hindi, Tamil, Kannada, Malayalam, Punjabi and 100+ languages. Bad comments hidden. Live chat timeouts. Auto-replied. 24/7.",
  keywords: "YouTube moderation, AI comment moderation, Telugu moderation, Hindi moderation, toxic comments, auto moderation",
  verification: {
    google: "45B8wJKk9HdcsKO1R8YKiA1es07W_chLwiQrdguuRcc",
  },
  openGraph: {
    title: "ModrateAI — AI YouTube Comment Moderation",
    description: "Stop toxic comments automatically in every language. 19-day free trial.",
    url: "https://moderateai.site",
    siteName: "ModrateAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ModrateAI — AI YouTube Comment Moderation",
    description: "Stop toxic comments automatically in every language.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}