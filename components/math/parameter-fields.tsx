"use client";

import type { Language } from "@/lib/i18n";
import type { FieldSpec } from "@/lib/econ-math/types";
import { cn } from "@/lib/utils/cn";

export function ParameterFields({
  fields,
  values,
  onChange,
  language,
  idPrefix,
}: {
  fields: FieldSpec[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  language: Language;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => {
        const id = `${idPrefix}-${field.key}`;
        const isSelect = field.kind === "select" && field.options?.length;
        return (
          <div key={field.key} className="min-w-0">
            <label
              htmlFor={id}
              className="mb-1 block text-[11px] font-semibold leading-4 text-foreground-soft"
            >
              {field.label[language]}
            </label>
            {isSelect ? (
              <select
                id={id}
                value={values[field.key] ?? field.defaultValue}
                onChange={(event) => onChange(field.key, event.target.value)}
                className="h-9 w-full rounded-lg border border-line bg-background px-2.5 text-[12.5px] font-medium text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[language]}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                type="text"
                inputMode="decimal"
                value={values[field.key] ?? ""}
                onChange={(event) => onChange(field.key, event.target.value)}
                placeholder={field.placeholder}
                className={cn(
                  "tabular h-9 w-full rounded-lg border border-line bg-background px-2.5 text-[12.5px] text-foreground",
                  "placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25",
                )}
              />
            )}
            {field.help ? (
              <p className="mt-1 text-[10.5px] leading-4 text-subtle">
                {field.help[language]}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
