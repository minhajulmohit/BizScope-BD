"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BookOpenText,
  ChartNoAxesCombined,
  ChevronRight,
  CircleDollarSign,
  Database,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BrandMark } from "@/components/brand-mark";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { SourceStatusPill } from "@/components/source-status-pill";
import { useLanguage } from "@/components/language-provider";

type NavKey =
  | "overview"
  | "economy"
  | "trade"
  | "currency"
  | "data"
  | "sources";

interface NavItem {
  href: string;
  key: NavKey;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", key: "overview", icon: LayoutDashboard },
  { href: "/economy", key: "economy", icon: ChartNoAxesCombined },
  { href: "/trade", key: "trade", icon: ArrowLeftRight },
  { href: "/currency", key: "currency", icon: CircleDollarSign },
  { href: "/data", key: "data", icon: Database },
  { href: "/sources", key: "sources", icon: BookOpenText },
];

const PAGE_KEYS: Record<string, NavKey> = {
  "/": "overview",
  "/economy": "economy",
  "/trade": "trade",
  "/currency": "currency",
  "/data": "data",
  "/sources": "sources",
};

const COPY = {
  en: {
    navAria: "Primary navigation",
    items: {
      overview: "Overview",
      economy: "Economy",
      trade: "Trade",
      currency: "Dollar rate",
      data: "Datasets",
      sources: "Sources",
    },
    breadcrumb: "Current page",
    skip: "Skip to content",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
    siteNavigation: "Site navigation",
    footerTitle: "Data, with context",
    footerDescription:
      "Official annual statistics plus a daily reference rate. No real-time claims.",
    methodology: "Read the methodology",
    tagline: "See Bangladesh Through Data.",
    footerNote: "Public data, clearly sourced. Not financial or investment advice.",
  },
  bn: {
    navAria: "প্রধান নেভিগেশন",
    items: {
      overview: "এক নজরে",
      economy: "অর্থনীতি",
      trade: "বাণিজ্য",
      currency: "ডলার রেট",
      data: "ডেটাসেট",
      sources: "উৎস",
    },
    breadcrumb: "বর্তমান পেজ",
    skip: "মূল কনটেন্টে যান",
    openMenu: "নেভিগেশন মেনু খুলুন",
    closeMenu: "নেভিগেশন মেনু বন্ধ করুন",
    siteNavigation: "সাইট নেভিগেশন",
    footerTitle: "প্রেক্ষাপটসহ ডেটা",
    footerDescription:
      "সরকারি বার্ষিক পরিসংখ্যান এবং একটি দৈনিক রেফারেন্স হার। রিয়েল-টাইম দাবি নয়।",
    methodology: "পদ্ধতি পড়ুন",
    tagline: "ডেটার মাধ্যমে বাংলাদেশকে দেখুন।",
    footerNote: "স্পষ্ট উৎসসহ সর্বজনীন ডেটা। এটি আর্থিক বা বিনিয়োগ পরামর্শ নয়।",
  },
} as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const language = useLanguage();
  const copy = COPY[language];

  return (
    <nav aria-label={copy.navAria} className="flex-1 overflow-y-auto px-3 py-5">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  active
                    ? "bg-brand-soft text-brand-strong"
                    : "text-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                {active ? (
                  <span
                    className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-brand"
                    aria-hidden="true"
                  />
                ) : null}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active ? "text-brand" : "text-subtle",
                  )}
                  aria-hidden="true"
                />
                <span>{copy.items[item.key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarFooter() {
  const language = useLanguage();
  const copy = COPY[language];

  return (
    <div className="border-t border-line p-5">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-foreground-soft">
          {copy.footerTitle}
        </p>
      </div>
      <p className="mt-1.5 text-[13px] leading-5 text-muted">
        {copy.footerDescription}
      </p>
      <Link
        href="/sources"
        className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {copy.methodology}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const language = useLanguage();
  const copy = COPY[language];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const pageKey = PAGE_KEYS[pathname];
  const currentTitle = pageKey ? copy.items[pageKey] : "BizScope BD";

  useEffect(() => {
    if (!drawerOpen) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    function handleDesktopChange(event: MediaQueryListEvent) {
      if (event.matches) setDrawerOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", handleDesktopChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", handleDesktopChange);
      previouslyFocused?.focus();
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-contrast focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {copy.skip}
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-20 shrink-0 items-center border-b border-line px-6">
          <BrandMark />
        </div>
        <SidebarNav />
        <SidebarFooter />
      </aside>

      <div className="min-w-0 lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-line bg-background">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
                aria-label={copy.openMenu}
                aria-expanded={drawerOpen}
                aria-controls="mobile-navigation"
              >
                <Menu className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>

              <div className="lg:hidden">
                <BrandMark compact />
              </div>

              <nav
                aria-label={copy.breadcrumb}
                className="hidden min-w-0 items-center gap-2 text-[14px] lg:flex"
              >
                <span className="text-muted">BizScope BD</span>
                <ChevronRight className="h-3.5 w-3.5 text-subtle" aria-hidden="true" />
                <span className="truncate font-medium text-foreground">
                  {currentTitle}
                </span>
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden sm:block">
                <SourceStatusPill />
              </div>
              <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
        </header>

        <main id="main-content" className="page-container py-6 sm:py-8 lg:py-9">
          {children}
          <footer className="mt-12 flex flex-col gap-2 border-t border-line py-5 text-[12px] leading-5 text-subtle sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-semibold text-foreground-soft">BizScope BD</span>
              {" · "}
              {copy.tagline}
            </p>
            <p>{copy.footerNote}</p>
          </footer>
        </main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#071219]/55"
            onClick={() => setDrawerOpen(false)}
            aria-label={copy.closeMenu}
          />
          <div
            ref={panelRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label={copy.siteNavigation}
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col border-r border-line bg-surface shadow-2xl"
          >
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-line px-5">
              <BrandMark />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                aria-label={copy.closeMenu}
              >
                <X className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            <SidebarFooter />
          </div>
        </div>
      ) : null}
    </div>
  );
}
