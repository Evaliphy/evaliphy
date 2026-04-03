import { MessageSquarePlus } from "lucide-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Evaliphy | QA-First RAG Evaluation SDK",
  description: "Evaliphy is the end-to-end RAG evaluation SDK for QA engineers.Write assertions in TypeScript, test your real API, get structured reports.No ML background required.",
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
      <body className="min-h-full flex flex-col bg-white text-zinc-900 selection:bg-zinc-100">
        <div className="bg-amber-50 border-b border-amber-100 py-2 px-4 text-center text-xs font-medium text-amber-800">
          Evaliphy is currently in beta. It is not recommended for production use yet. Please try it out and{" "}
          <a
            href="https://github.com/priyanshus/evaliphy/issues"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-amber-200 hover:decoration-amber-400 transition-colors"
          >
            share your feedback
          </a>
          .
        </div>
        <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
          <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-6 md:gap-10">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight">Evaliphy</span>
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link
                  href="/docs/introduction"
                  className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                >
                  Documentation
                </Link>
                <Link
                  href="/docs/assertions-api"
                  className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                >
                  API Reference
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://forms.gle/5CQGzonT1XUUHCJu6"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                <MessageSquarePlus className="h-4 w-4" />
                <span>Feedback</span>
              </a>
              <a
                href="https://github.com/priyanshus/evaliphy"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
              >
                <span className="hidden sm:inline">Star on GitHub</span>
                <span className="sm:hidden">Star</span>
              </a>
            </div>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-zinc-100 py-12">
          <div className="container mx-auto max-w-screen-2xl px-4 md:px-8">
            <p className="text-center text-sm leading-loose text-zinc-500">
              Built for quality engineers. Evaliphy &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
