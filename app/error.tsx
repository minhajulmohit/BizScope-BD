"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

const COPY = {
  en: {
    title: "This page could not be rendered",
    description:
      "An unexpected application error occurred. A data source may be temporarily unavailable. Try loading the page again.",
    retry: "Try again",
  },
  bn: {
    title: "এই পেজটি রেন্ডার করা যায়নি",
    description:
      "অপ্রত্যাশিত অ্যাপ্লিকেশন ত্রুটি ঘটেছে। কোনো ডেটা উৎস সাময়িকভাবে অনুপলব্ধ থাকতে পারে। পেজটি আবার লোড করার চেষ্টা করুন।",
    retry: "আবার চেষ্টা করুন",
  },
} as const;

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const language = useLanguage();
  const copy = COPY[language];

  useEffect(() => {
    console.error("BizScope BD render error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-lg rounded-card border border-line bg-surface p-7 text-center shadow-card">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-danger-soft text-danger">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-foreground">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">{copy.description}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          {copy.retry}
        </button>
      </div>
    </div>
  );
}
