import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_DESCRIPTION =
  "BizScope BD is a Bangladesh business intelligence dashboard for exploring World Bank economic indicators, trade flows, third-party currency reference rates, and public datasets from OpenDataBD.";

export const metadata: Metadata = {
  title: {
    default: "BizScope BD \u2014 See Bangladesh Through Data",
    template: "%s \u00b7 BizScope BD",
  },
  description: SITE_DESCRIPTION,
  applicationName: "BizScope BD",
  authors: [{ name: "BizScope BD" }],
  creator: "BizScope BD",
  category: "business intelligence",
  keywords: [
    "Bangladesh economy",
    "Bangladesh GDP",
    "Bangladesh inflation",
    "Bangladesh trade",
    "USD BDT",
    "Bangladesh business intelligence",
    "World Bank data",
    "OpenDataBD",
    "economic dashboard",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "BizScope BD",
    title: "BizScope BD \u2014 See Bangladesh Through Data",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "BizScope BD \u2014 See Bangladesh Through Data",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0b141a" },
  ],
};

const THEME_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("bizscope-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (stored === "dark" || (!stored && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  } catch (error) {
    /* A stored preference is optional. */
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
