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
import { ThemeToggle } from "@/components/theme-toggle";
import { SourceStatusPill } from "@/components/source-status-pill";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [{ href: "/", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Analysis",
    items: [
      { href: "/economy", label: "Economic analytics", icon: ChartNoAxesCombined },
      { href: "/trade", label: "Trade analytics", icon: ArrowLeftRight },
      { href: "/currency", label: "Currency & rates", icon: CircleDollarSign },
    ],
  },
  {
    label: "Explore",
    items: [
      { href: "/data", label: "Data explorer", icon: Database },
      { href: "/sources", label: "Sources & methodology", icon: BookOpenText },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/economy": "Economic analytics",
  "/trade": "Trade analytics",
  "/currency": "Currency & rates",
  "/data": "Data explorer",
  "/sources": "Sources & methodology",
};

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3 py-5">
      <div className="space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-subtle">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
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
                          "h-[17px] w-[17px] shrink-0",
                          active ? "text-brand" : "text-subtle",
                        )}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t border-line p-4">
      <div className="rounded-xl border border-line bg-background p-3.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground-soft">
            Data, with context
          </p>
        </div>
        <p className="mt-1.5 text-[11px] leading-[1.6] text-muted">
          Annual official statistics and a daily third-party currency reference.
          Nothing here is presented as real-time.
        </p>
        <Link
          href="/sources"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Read the methodology
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-3 px-1 text-[9px] leading-4 text-subtle">
        Public data. Not financial or investment advice.
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const currentTitle = PAGE_TITLES[pathname] ?? "BizScope BD";

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
        Skip to content
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
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
                aria-label="Open navigation menu"
                aria-expanded={drawerOpen}
                aria-controls="mobile-navigation"
              >
                <Menu className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>

              <div className="lg:hidden">
                <BrandMark compact />
              </div>

              <nav
                aria-label="Breadcrumb"
                className="hidden min-w-0 items-center gap-2 text-[12px] lg:flex"
              >
                <span className="text-muted">Workspace</span>
                <ChevronRight className="h-3 w-3 text-subtle" aria-hidden="true" />
                <span className="truncate font-medium text-foreground">
                  {currentTitle}
                </span>
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <SourceStatusPill />
              <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main id="main-content" className="page-container py-6 sm:py-8 lg:py-9">
          {children}
          <footer className="mt-12 flex flex-col gap-2 border-t border-line py-5 text-[11px] leading-5 text-subtle sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-semibold text-foreground-soft">BizScope BD</span>
              {" · "}See Bangladesh Through Data.
            </p>
            <p>Public data, clearly sourced. Not financial or investment advice.</p>
          </footer>
        </main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#071219]/55"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation menu"
          />
          <div
            ref={panelRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col border-r border-line bg-surface shadow-2xl"
          >
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-line px-5">
              <BrandMark />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                aria-label="Close navigation menu"
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
