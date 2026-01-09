import "./globals.css";
import localFont from "next/font/local";
import Footer from "./components/footer/footer";

const jetbrainsMonoNF = localFont({
  src: "../public/fonts/JetBrainsMonoNerdFont-Regular.ttf",
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata = {
  title: "Pucas01 | Mejedo",
  description: "Portfolio website",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jetbrainsMonoNF.variable}>
      <body className="flex flex-col min-h-screen font-[var(--font-jetbrains)]">
        {children}
        <Footer />
      </body>
    </html>
  );
}
