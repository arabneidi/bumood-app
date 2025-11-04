import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navigation from "@/components/ui/Navigation";
import { ThemeProvider } from "@/lib/themeContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BUMood - Track Your Mental Wellness",
  description: "A comprehensive mood tracking application to monitor your mental health and wellbeing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <Navigation />
            <main className="w-full min-h-screen py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
