"use client";
import "./globals.css";
import localFont from "next/font/local";
import Footer from "./components/footer/footer";
import { ThemeProvider } from "./hooks/useTheme";

const jetbrainsMonoNF = localFont({
  src: "../public/fonts/JetBrainsMonoNerdFont-Regular.ttf",
  variable: "--font-jetbrains",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jetbrainsMonoNF.variable} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen font-[var(--font-jetbrains)]" suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
