import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <header className="site-header">
          <div className="shell header-inner">
            <Link className="brand" href="/" aria-label="GameRadar CZ – domů">
              <span className="brand-mark">G</span>
              <span>
                GameRadar <b>CZ</b>
              </span>
            </Link>
            <nav className="desktop-nav" aria-label="Hlavní navigace">
              <Link href="/">Domů</Link>
              <Link href="/hledat">Hledat hry</Link>
            </nav>
            <details className="mobile-nav">
              <summary aria-label="Otevřít navigaci">
                <span />
                <span />
                <span />
              </summary>
              <nav aria-label="Mobilní navigace">
                <Link href="/">Domů</Link>
                <Link href="/hledat">Hledat hry</Link>
              </nav>
            </details>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <div>
              <div className="brand footer-brand">
                <span className="brand-mark">G</span>
                <span>
                  GameRadar <b>CZ</b>
                </span>
              </div>
              <p>Český přehled cen digitálních PC her.</p>
            </div>
            <p className="disclaimer">
              Ceny jsou orientační a mohou se v obchodě změnit. Vždy zkontrolujte konečnou cenu před
              nákupem.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
