"use client";
import "./globals.css";
import localFont from "next/font/local";
import Footer from "./components/footer/footer";
import { ThemeProvider } from "./hooks/useTheme";
import { CrtFilterProvider, useCrtFilter } from "./hooks/useCrtFilter";

const jetbrainsMonoNF = localFont({
  src: "../public/fonts/JetBrainsMonoNerdFont-Regular.ttf",
  variable: "--font-jetbrains",
  display: "swap",
});

function CrtOverlay() {
  const { crtEnabled, poweringOn } = useCrtFilter();
  if (!crtEnabled) return null;
  return (
    <div className="crt-overlay pointer-events-none fixed inset-0 z-[9999]">
      <div className="crt-scan-line" />
      {poweringOn && <div className="crt-power-on" />}
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jetbrainsMonoNF.variable} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen font-[var(--font-jetbrains)]" suppressHydrationWarning>
        <ThemeProvider>
          <CrtFilterProvider>
            {children}
            <Footer />
            <CrtOverlay />
          </CrtFilterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
