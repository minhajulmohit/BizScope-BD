import Link from "next/link";
import type { Language } from "@/lib/i18n";
import { DataNotice } from "@/components/ui/data-notice";
import { BdtConversionNotice } from "@/components/ui/bdt-conversion-notice";
import { Disclosure } from "@/components/ui/disclosure";

const COPY = {
  en: {
    summary: "How to read these numbers",
    description: "Annual data, taka conversion, and source caveats",
  },
  bn: {
    summary: "সংখ্যাগুলো কীভাবে পড়বেন",
    description: "বার্ষিক ডেটা, টাকায় রূপান্তর ও উৎসের সতর্কতা",
  },
};

export function DataNotesDisclosure({
  annualTitle,
  annualBody,
  bdtPerUsd,
  updatedAt,
  language,
  methodologyLabel,
  methodologyHref = "/sources",
}: {
  annualTitle: string;
  annualBody: string;
  bdtPerUsd: number | null;
  updatedAt: string | null;
  language: Language;
  methodologyLabel?: string;
  methodologyHref?: string;
}) {
  const copy = COPY[language];

  return (
    <>
      {bdtPerUsd === null ? (
        <BdtConversionNotice
          bdtPerUsd={bdtPerUsd}
          updatedAt={updatedAt}
          language={language}
        />
      ) : null}
      <Disclosure summary={copy.summary} description={copy.description}>
        <div className="space-y-3">
          <DataNotice title={annualTitle}>
            {annualBody}
            {methodologyLabel ? (
              <>
                {" "}
                <Link
                  href={methodologyHref}
                  className="font-medium text-foreground-soft underline underline-offset-2 hover:text-foreground"
                >
                  {methodologyLabel}
                </Link>
                {language === "bn" ? "।" : "."}
              </>
            ) : null}
          </DataNotice>
          {bdtPerUsd !== null ? (
            <BdtConversionNotice
              bdtPerUsd={bdtPerUsd}
              updatedAt={updatedAt}
              language={language}
            />
          ) : null}
        </div>
      </Disclosure>
    </>
  );
}
