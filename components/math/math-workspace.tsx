"use client";

import { useMemo, useState } from "react";
import { Sigma } from "lucide-react";
import type { Language } from "@/lib/i18n";
import {
  CALCULATORS,
  createDraft,
  getCalculator,
} from "@/lib/econ-math/catalog";
import {
  CalcInputError,
  type CalculatorDraft,
  type ComputeResult,
  type TableState,
} from "@/lib/econ-math/types";
import { cn } from "@/lib/utils/cn";
import { MATH_COPY } from "@/components/math/copy";
import {
  CalculatorPicker,
  CalculatorSelect,
} from "@/components/math/calculator-picker";
import { CalculatorPanel } from "@/components/math/calculator-panel";
import { FormulaLibrary } from "@/components/math/formula-library";

type Tab = "calculators" | "formulas";

export type MathTab = Tab;

function computeSafely(
  calculator: ReturnType<typeof getCalculator>,
  draft: CalculatorDraft,
): ComputeResult {
  try {
    return calculator.compute({ fields: draft.fields, tables: draft.tables });
  } catch (error) {
    if (error instanceof CalcInputError) {
      return { error: error.biMessage };
    }
    return {
      error: {
        en: "This input could not be computed. Check for unusual values such as division by zero.",
        bn: "এই ইনপুট দিয়ে গণনা করা যায়নি। শূন্য দিয়ে ভাগের মতো অস্বাভাবিক মান যাচাই করুন।",
      },
    };
  }
}

function replaceUrl(calculatorId: string, tab: Tab): void {
  const params = new URLSearchParams(window.location.search);
  if (calculatorId === CALCULATORS[0].id) {
    params.delete("calc");
  } else {
    params.set("calc", calculatorId);
  }
  if (tab === "formulas") {
    params.set("tab", "formulas");
  } else {
    params.delete("tab");
  }
  const query = params.toString();
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
  );
}

export function MathWorkspace({
  language,
  initialCalculatorId,
  initialTab,
}: {
  language: Language;
  initialCalculatorId?: string;
  initialTab?: string;
}) {
  const copy = MATH_COPY[language];
  const [tab, setTab] = useState<Tab>(
    initialTab === "formulas" ? "formulas" : "calculators",
  );
  const [selectedId, setSelectedId] = useState(
    () => getCalculator(initialCalculatorId).id,
  );
  const [drafts, setDrafts] = useState<Record<string, CalculatorDraft>>({});

  const calculator = getCalculator(selectedId);
  const draft = drafts[selectedId] ?? createDraft(calculator, { language });

  const result = useMemo(
    () => computeSafely(calculator, draft),
    [calculator, draft],
  );

  function selectCalculator(id: string): void {
    setSelectedId(id);
    replaceUrl(id, tab);
  }

  function selectTab(next: Tab): void {
    setTab(next);
    replaceUrl(selectedId, next);
  }

  function writeDraft(next: CalculatorDraft): void {
    setDrafts((previous) => ({ ...previous, [selectedId]: next }));
  }

  function handleFieldChange(key: string, value: string): void {
    writeDraft({
      ...draft,
      fields: { ...draft.fields, [key]: value },
    });
  }

  function handleTableChange(key: string, table: TableState): void {
    writeDraft({
      ...draft,
      tables: { ...draft.tables, [key]: table },
    });
  }

  function handleLoadExample(): void {
    writeDraft(createDraft(calculator, { example: true, language }));
  }

  function handleClear(): void {
    writeDraft(createDraft(calculator, { language }));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="inline-flex rounded-lg border border-line bg-surface-muted/60 p-0.5">
          <button
            type="button"
            onClick={() => selectTab("calculators")}
            aria-pressed={tab === "calculators"}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold transition-colors",
              tab === "calculators"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            <Sigma className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.tabs.calculators}
            <span
              className={cn(
                "tabular rounded px-1 py-0.5 text-[10px]",
                tab === "calculators"
                  ? "bg-brand-soft text-brand-strong"
                  : "bg-surface-muted text-subtle",
              )}
            >
              {CALCULATORS.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => selectTab("formulas")}
            aria-pressed={tab === "formulas"}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold transition-colors",
              tab === "formulas"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {copy.tabs.formulas}
          </button>
        </div>
      </div>

      {tab === "calculators" ? (
        <div className="grid items-start gap-5 lg:grid-cols-[264px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="hidden min-w-0 lg:block">
            <div className="lg:sticky lg:top-20">
              <CalculatorPicker
                calculators={CALCULATORS}
                selectedId={selectedId}
                onSelect={selectCalculator}
                language={language}
                copy={copy}
              />
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            <div className="lg:hidden">
              <CalculatorSelect
                calculators={CALCULATORS}
                selectedId={selectedId}
                onSelect={selectCalculator}
                language={language}
                copy={copy}
              />
            </div>

            <CalculatorPanel
              key={calculator.id}
              calculator={calculator}
              draft={draft}
              result={result}
              language={language}
              copy={copy}
              onFieldChange={handleFieldChange}
              onTableChange={handleTableChange}
              onLoadExample={handleLoadExample}
              onClear={handleClear}
            />
          </div>
        </div>
      ) : (
        <FormulaLibrary
          calculators={CALCULATORS}
          language={language}
          copy={copy}
        />
      )}
    </div>
  );
}
