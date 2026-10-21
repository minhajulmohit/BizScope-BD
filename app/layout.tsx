import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { LanguageProvider } from "@/components/language-provider";
import { getLanguage } from "@/lib/i18n-server";
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

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  display: "swap",
});

const SITE_META = {
  en: {
    title: "BizScope BD \u2014 See Bangladesh Through Data",
    description:
      "BizScope BD is a Bangladesh business intelligence dashboard for exploring World Bank economic indicators, trade flows, third-party currency reference rates, and public datasets from OpenDataBD.",
    locale: "en_US",
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
  },
  bn: {
    title: "BizScope BD \u2014 ডেটার মাধ্যমে বাংলাদেশকে দেখুন",
    description:
      "BizScope BD একটি বাংলাদেশ ব্যবসায়িক অন্তর্দৃষ্টি ড্যাশবোর্ড—বিশ্বব্যাংকের অর্থনৈতিক সূচক, বাণিজ্য প্রবাহ, তৃতীয় পক্ষের মুদ্রা রেফারেন্স হার এবং OpenDataBD-র সর্বজনীন ডেটাসেট দেখার জন্য।",
    locale: "bn_BD",
    keywords: [
      "বাংলাদেশ অর্থনীতি",
      "বাংলাদেশ জিডিপি",
      "বাংলাদেশ মূল্যস্ফীতি",
      "বাংলাদেশ বাণিজ্য",
      "ডলার টাকা",
      "বাংলাদেশ ব্যবসায়িক অন্তর্দৃষ্টি",
      "বিশ্বব্যাংক ডেটা",
      "OpenDataBD",
      "অর্থনৈতিক ড্যাশবোর্ড",
    ],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguage();
  const meta = SITE_META[language];

  return {
    title: {
      default: meta.title,
      template: "%s \u00b7 BizScope BD",
    },
    description: meta.description,
    applicationName: "BizScope BD",
    authors: [{ name: "BizScope BD" }],
    creator: "BizScope BD",
    category: "business intelligence",
    keywords: [...meta.keywords],
    openGraph: {
      type: "website",
      locale: meta.locale,
      siteName: "BizScope BD",
      title: meta.title,
      description: meta.description,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const language = await getLanguage();

  return (
    <html
      lang={language}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoBengali.variable}`}
    >
      <body className="min-h-screen antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <LanguageProvider language={language}>
          <AppShell>{children}</AppShell>
        </LanguageProvider>
        <Script
          id="cloudflare-web-analytics"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          type="module"
          strategy="afterInteractive"
          data-cf-beacon={JSON.stringify({
            token: "2ac9ca3f1c584683a86f43605bc9b296",
          })}
        />
      </body>
    </html>
  );
}
