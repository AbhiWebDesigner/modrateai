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
  title: "ModrateAI — AI YouTube Comment Moderation",
  description: "AI-powered YouTube comment moderation for Telugu, Hindi, Tamil, Kannada, Malayalam, Punjabi and 100+ languages. Bad comments hidden. Live chat timeouts. Auto-replied. 24/7.",
  keywords: "YouTube moderation, AI comment moderation, Telugu moderation, Hindi moderation, toxic comments, auto moderation",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}