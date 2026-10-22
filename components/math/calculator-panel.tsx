"use client";

import { useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/econ-math/categories";
import type {
  CalculatorDef,
  CalculatorDraft,
  ComputeResult,
} from "@/lib/econ-math/types";
import { cn } from "@/lib/utils/cn";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { MathCopy } from "@/components/math/copy";
import { InputTable } from "@/components/math/input-table";
import { ParameterFields } from "@/components/math/parameter-fields";
import { ResultsPanel } from "@/components/math/results-panel";

export function CalculatorPanel({
  calculator,
  draft,
  result,
  language,
  copy,
  onFieldChange,
  onTableChange,
  onLoadExample,
  onClear,
}: {
  calculator: CalculatorDef;
  draft: CalculatorDraft;
  result: ComputeResult;
  language: Language;
  copy: MathCopy;
  onFieldChange: (key: string, value: string) => void;
  onTableChange: (key: string, value: CalculatorDraft["tables"][string]) => void;
  onLoadExample: () => void;
  onClear: () => void;
}) {
  const [clearArmed, setClearArmed] = useState(false);
  const category = CATEGORIES.find((item) => item.id === calculator.category);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">{category?.label[language]}</p>
          <h2 className="mt-1 text-[22px] font-semibold leading-7 tracking-[-0.025em] text-foreground">
            {calculator.title[language]}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-muted">
            {calculator.description[language]}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setClearArmed(false);
              onLoadExample();
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand/25 bg-brand-soft px-2.5 text-[11px] font-semibold text-brand-strong transition-colors hover:border-brand/40 hover:bg-brand-soft/80"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.actions.example}
          </button>
          <button
            type="button"
            onClick={() => {
              if (clearArmed) {
                onClear();
                setClearArmed(false);
              } else {
                setClearArmed(true);
              }
            }}
            title={copy.actions.clearHelp}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors",
              clearArmed
                ? "border-danger/30 bg-danger-soft text-danger"
                : "border-line bg-surface text-muted hover:border-line-strong hover:text-foreground",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {clearArmed ? copy.actions.confirmClear : copy.actions.clear}
          </button>
        </div>
      </div>

      <Panel>
        <PanelHeader
          title={
            calculator.fields.length > 0
              ? copy.input.parameters
              : copy.input.data
          }
          description={
            calculator.fields.length > 0
              ? copy.input.parametersHelp
              : calculator.tables[0]?.description?.[language]
          }
        />
        <div className="space-y-5 p-4 sm:p-5">
          {calculator.fields.length > 0 ? (
            <ParameterFields
              fields={calculator.fields}
              values={draft.fields}
              onChange={onFieldChange}
              language={language}
              idPrefix={calculator.id}
            />
          ) : null}

          {calculator.tables.map((spec) => {
            const table = draft.tables[spec.key];
            if (!table) return null;
            return (
              <section key={spec.key} className="min-w-0">
                <div className="mb-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <h3 className="text-[12.5px] font-semibold text-foreground">
                      {spec.label?.[language] ?? copy.input.data}
                    </h3>
                    <span className="tabular text-[10px] text-subtle">
                      {language === "bn"
                        ? `${table.rows.length}টি সারি`
                        : `${table.rows.length} rows`}
                    </span>
                  </div>
                  {spec.description ? (
                    <p className="mt-0.5 max-w-2xl text-[11px] leading-5 text-muted">
                      {spec.description[language]}
                    </p>
                  ) : null}
                </div>
                <InputTable
                  spec={spec}
                  value={table}
                  onChange={(next) => onTableChange(spec.key, next)}
                  language={language}
                  copy={copy}
                />
              </section>
            );
          })}
        </div>
      </Panel>

      <ResultsPanel
        result={result}
        title={calculator.title[language]}
        assumptions={calculator.assumptions}
        language={language}
        copy={copy}
      />
    </div>
  );
}
