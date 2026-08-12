import type { Metadata } from "next";
import { ClientChrome } from "@/components/ClientChrome";
import "./globals.css";

/**
 * System fonts only — skip next/font/google.
 * Fetching Geist from Google during `next dev` often hangs indefinitely
 * on flaky networks and shows as "Compiling..." forever.
 */
export const metadata: Metadata = {
  title: {
    default: "Plethora — All AI Tools Under One Roof",
    template: "%s | Plethora",
  },
  description:
    "The middleman home base for AI: free tools, finder, prompts, MCP & installs under one roof — without 40 tabs.",
  metadataBase: new URL(
    process.env.PLETHORA_SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  openGraph: {
    siteName: "Plethora",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Plethora",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#080810] font-sans text-zinc-100">
        {children}
        <ClientChrome />
      </body>
    </html>
  );
}
