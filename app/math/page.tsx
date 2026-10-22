import type { Metadata } from "next";
import { GraduationCap, ShieldCheck, Sigma } from "lucide-react";
import { getLanguage } from "@/lib/i18n-server";
import { CALCULATORS } from "@/lib/econ-math/catalog";
import { MATH_COPY } from "@/components/math/copy";
import { MathWorkspace } from "@/components/math/math-workspace";
import { PageHeader } from "@/components/ui/page-header";

const META = {
  en: {
    title: "Econ Math — Economics & Statistics Calculators",
    description:
      `${CALCULATORS.length} browser-based economics and statistics calculators with formulas, step-by-step workings, and bilingual interpretations. Paste data from Excel or Google Sheets; nothing leaves your browser.`,
    ogTitle: "Economics math & statistics calculators",
  },
  bn: {
    title: "ইকন ম্যাথ — অর্থনীতি ও পরিসংখ্যানের ক্যালকুলেটর",
    description:
      `সূত্র, ধাপে ধাপে সমাধান ও দ্বিভাষিক ব্যাখ্যাসহ ${CALCULATORS.length}টি অর্থনীতি ও পরিসংখ্যান ক্যালকুলেটর। এক্সেল বা গুগল শিট থেকে ডেটা পেস্ট করুন; কিছুই আপনার ব্রাউজার ছাড়ে না।`,
    ogTitle: "অর্থনীতি ও পরিসংখ্যানের গণিত ক্যালকুলেটর",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguage();
  const meta = META[language];

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.ogTitle,
      description: meta.description,
    },
  };
}

function HeaderBadge({
  icon: Icon,
  children,
}: {
  icon: typeof Sigma;
  children: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-medium text-muted">
      <Icon className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
      {children}
    </span>
  );
}

export default async function MathPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [language, params] = await Promise.all([getLanguage(), searchParams]);
  const copy = MATH_COPY[language];
  const calc = typeof params.calc === "string" ? params.calc : undefined;
  const tab = typeof params.tab === "string" ? params.tab : undefined;

  return (
    <div className="space-y-6 sm:space-y-7">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <HeaderBadge icon={Sigma}>
            {copy.calculatorCount(CALCULATORS.length)}
          </HeaderBadge>
          <HeaderBadge icon={ShieldCheck}>{copy.badge.browser}</HeaderBadge>
          <HeaderBadge icon={GraduationCap}>
            {copy.badge.educational}
          </HeaderBadge>
        </div>
      </PageHeader>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-strong">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-foreground-soft">
              {copy.privacyTitle}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-muted">
              {copy.privacy}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl border border-amber/20 bg-amber-soft/35 px-3.5 py-2.5">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-amber-soft text-amber">
            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-foreground-soft">
              {copy.educationalTitle}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-muted">
              {copy.educational}
            </p>
          </div>
        </div>
      </div>

      <MathWorkspace
        language={language}
        initialCalculatorId={calc}
        initialTab={tab}
      />

      <p className="border-t border-line pt-3 text-[10.5px] leading-4 text-subtle">
        {copy.footerNote}
      </p>
    </div>
  );
}
