"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/econ-math/categories";
import type { CalculatorDef } from "@/lib/econ-math/types";
import { Panel } from "@/components/ui/panel";
import type { MathCopy } from "@/components/math/copy";

export function FormulaLibrary({
  calculators,
  language,
  copy,
}: {
  calculators: CalculatorDef[];
  language: Language;
  copy: MathCopy;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return calculators;
    return calculators.filter((calculator) => {
      return (
        calculator.title[language].toLowerCase().includes(normalized) ||
        calculator.description[language].toLowerCase().includes(normalized) ||
        calculator.whenToUse[language].toLowerCase().includes(normalized) ||
        calculator.formulaSummary.some((formula) =>
          formula.toLowerCase().includes(normalized),
        )
      );
    });
  }, [calculators, language, query]);

  return (
    <div className="space-y-4">
      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-foreground">
              {copy.formulaGuide.title}
            </h2>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-5 text-muted">
              {copy.formulaGuide.description}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <label htmlFor="formula-search" className="sr-only">
              {copy.formulaGuide.search}
            </label>
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle"
              aria-hidden="true"
            />
            <input
              id="formula-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.formulaGuide.searchPlaceholder}
              className="h-9 w-full rounded-lg border border-line bg-background pl-8 pr-3 text-[12px] text-foreground placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
          </div>
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="px-5 py-10 text-center">
          <p className="text-[12.5px] text-muted">{copy.formulaGuide.noMatches}</p>
        </Panel>
      ) : (
        <div className="columns-1 gap-3 xl:columns-2">
          {CATEGORIES.map((category) => {
            const items = filtered.filter(
              (calculator) => calculator.category === category.id,
            );
            if (items.length === 0) return null;
            return (
              <section
                key={category.id}
                className="mb-3 min-w-0 break-inside-avoid space-y-2 last:mb-0"
              >
                <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle">
                  {category.label[language]}
                </h3>
                {items.map((calculator) => (
                  <details
                    key={calculator.id}
                    className="group rounded-card border border-line bg-surface shadow-card"
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold leading-5 text-foreground">
                          {calculator.title[language]}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-muted">
                          {calculator.description[language]}
                        </p>
                      </div>
                      <ChevronDown
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="space-y-3 border-t border-line px-4 py-3">
                      <div>
                        <p className="text-[9.5px] font-semibold uppercase tracking-[0.06em] text-subtle">
                          {copy.formulaGuide.formulas}
                        </p>
                        <ul className="mt-1 space-y-1">
                          {calculator.formulaSummary.map((formula, index) => (
                            <li key={`${calculator.id}-formula-${index}`}>
                              <code className="block whitespace-pre-wrap break-words rounded bg-surface-muted/60 px-2 py-1 font-mono text-[11px] leading-5 text-foreground-soft">
                                {formula}
                              </code>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[9.5px] font-semibold uppercase tracking-[0.06em] text-subtle">
                          {copy.formulaGuide.whenToUse}
                        </p>
                        <p className="mt-0.5 text-[11.5px] leading-5 text-muted">
                          {calculator.whenToUse[language]}
                        </p>
                      </div>
                      {calculator.legend ? (
                        <div>
                          <p className="text-[9.5px] font-semibold uppercase tracking-[0.06em] text-subtle">
                            {copy.formulaGuide.symbols}
                          </p>
                          <p className="mt-0.5 text-[11.5px] leading-5 text-muted">
                            {calculator.legend[language]}
                          </p>
                        </div>
                      ) : null}
                      <div>
                        <p className="text-[9.5px] font-semibold uppercase tracking-[0.06em] text-subtle">
                          {copy.formulaGuide.assumptions}
                        </p>
                        <p className="mt-0.5 text-[11.5px] leading-5 text-muted">
                          {calculator.assumptions[language]}
                        </p>
                      </div>
                    </div>
                  </details>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
