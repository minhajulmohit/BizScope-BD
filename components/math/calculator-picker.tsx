"use client";

import { useMemo, useState } from "react";
import { Search, Sigma } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/econ-math/categories";
import type { CalculatorDef } from "@/lib/econ-math/types";
import { cn } from "@/lib/utils/cn";
import type { MathCopy } from "@/components/math/copy";

export function CalculatorPicker({
  calculators,
  selectedId,
  onSelect,
  language,
  copy,
}: {
  calculators: CalculatorDef[];
  selectedId: string;
  onSelect: (id: string) => void;
  language: Language;
  copy: MathCopy;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return calculators.filter((calculator) => {
      const inCategory = category === "all" || calculator.category === category;
      if (!inCategory) return false;
      if (!normalized) return true;
      return (
        calculator.title[language].toLowerCase().includes(normalized) ||
        calculator.description[language].toLowerCase().includes(normalized) ||
        calculator.whenToUse[language].toLowerCase().includes(normalized) ||
        calculator.formulaSummary.some((formula) =>
          formula.toLowerCase().includes(normalized),
        )
      );
    });
  }, [calculators, category, language, query]);

  return (
    <div className="rounded-card border border-line bg-surface shadow-card">
      <div className="border-b border-line p-3">
        <label htmlFor="calculator-search" className="sr-only">
          {copy.picker.search}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <input
            id="calculator-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.picker.searchPlaceholder}
            className="h-9 w-full rounded-lg border border-line bg-background pl-8 pr-3 text-[12px] text-foreground placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
            category === "all"
              ? "bg-brand-soft text-brand-strong"
              : "text-muted hover:bg-surface-muted hover:text-foreground",
          )}
        >
          {copy.picker.all}
        </button>
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
              category === item.id
                ? "bg-brand-soft text-brand-strong"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            {item.shortLabel[language]}
          </button>
        ))}
      </div>

      <div className="max-h-[560px] overflow-y-auto p-2 scrollbar-subtle">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] leading-5 text-muted">
            {copy.picker.noMatches}
          </p>
        ) : (
          <div className="space-y-3">
            {CATEGORIES.map((group) => {
              const items = filtered.filter(
                (calculator) => calculator.category === group.id,
              );
              if (items.length === 0) return null;
              return (
                <div key={group.id}>
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">
                    {group.label[language]}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((calculator) => {
                      const active = calculator.id === selectedId;
                      return (
                        <li key={calculator.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(calculator.id)}
                            aria-current={active ? "true" : undefined}
                            className={cn(
                              "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] leading-4 transition-colors",
                              active
                                ? "bg-brand-soft text-brand-strong"
                                : "text-foreground-soft hover:bg-surface-muted hover:text-foreground",
                            )}
                          >
                            <Sigma
                              className={cn(
                                "mt-0.5 h-3.5 w-3.5 shrink-0",
                                active ? "text-brand" : "text-subtle",
                              )}
                              aria-hidden="true"
                            />
                            <span className="min-w-0">
                              <span className="block font-medium">
                                {calculator.title[language]}
                              </span>
                              <span
                                className={cn(
                                  "mt-0.5 block text-[11px] leading-4",
                                  active ? "text-brand-strong/80" : "text-subtle",
                                )}
                              >
                                {calculator.description[language]}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-line px-3 py-2 text-[10px] text-subtle">
        {copy.picker.results(filtered.length, calculators.length)}
      </div>
    </div>
  );
}

export function CalculatorSelect({
  calculators,
  selectedId,
  onSelect,
  language,
  copy,
}: {
  calculators: CalculatorDef[];
  selectedId: string;
  onSelect: (id: string) => void;
  language: Language;
  copy: MathCopy;
}) {
  return (
    <div>
      <label
        htmlFor="calculator-select"
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle"
      >
        {copy.picker.chooseMobile}
      </label>
      <select
        id="calculator-select"
        value={selectedId}
        onChange={(event) => onSelect(event.target.value)}
        className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-[13px] font-medium text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
      >
        {CATEGORIES.map((group) => {
          const items = calculators.filter(
            (calculator) => calculator.category === group.id,
          );
          if (items.length === 0) return null;
          return (
            <optgroup key={group.id} label={group.label[language]}>
              {items.map((calculator) => (
                <option key={calculator.id} value={calculator.id}>
                  {calculator.title[language]}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}
