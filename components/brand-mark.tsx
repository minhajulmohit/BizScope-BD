"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/components/language-provider";

const TAGLINE = {
  en: "See Bangladesh Through Data",
  bn: "ডেটার মাধ্যমে বাংলাদেশকে দেখুন",
};

export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const language = useLanguage();

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg outline-offset-4",
        className,
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-brand text-brand-contrast shadow-sm">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="h-[22px] w-[22px]"
          aria-hidden="true"
        >
          <path
            d="M6.5 24V18.5M12 24V14M17.5 24V19.5M23 24V9"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M22 6.5H25.5V10"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M25 7L19.5 12.5L15.5 10L11 15.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.72"
          />
        </svg>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="whitespace-nowrap text-[15px] font-semibold leading-tight tracking-[-0.035em] text-foreground sm:text-[17px]">
          BizScope <span className="text-brand">BD</span>
        </span>
        {!compact ? (
          <span className="mt-0.5 text-[11px] font-medium uppercase leading-tight tracking-[0.13em] text-subtle">
            {TAGLINE[language]}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
