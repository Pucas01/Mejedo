import "./globals.css";
import localFont from "next/font/local";

const jetbrainsMonoNF = localFont({
  src: "../public/fonts/JetBrainsMonoNerdFont-Regular.ttf",
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata = {
  title: "mejedo",
  description: "Portfolio website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jetbrainsMonoNF.variable}>
      <body className="flex flex-col min-h-screen font-[var(--font-jetbrains)]">
        {children}
      </body>
    </html>
  );
}
