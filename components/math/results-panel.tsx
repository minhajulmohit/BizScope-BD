"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ListChecks,
  TriangleAlert,
} from "lucide-react";
import type { Language } from "@/lib/i18n";
import type {
  BiText,
  CalculatorResult,
  ComputeResult,
  Metric,
  ResultTable,
} from "@/lib/econ-math/types";
import { cn } from "@/lib/utils/cn";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { MathCopy } from "@/components/math/copy";

function resolve(value: string | { en: string; bn: string }, language: Language): string {
  return typeof value === "string" ? value : value[language];
}

function toneClass(tone: Metric["tone"]): string {
  if (tone === "brand") return "text-brand-strong";
  if (tone === "warning") return "text-amber";
  return "text-foreground";
}

function ResultTableBlock({
  table,
  language,
  copy,
}: {
  table: ResultTable;
  language: Language;
  copy: MathCopy;
}) {
  return (
    <div className="min-w-0">
      {table.title ? (
        <h4 className="mb-1.5 text-[11px] font-semibold text-foreground-soft">
          {table.title[language]}
        </h4>
      ) : null}
      <div className="table-scroll max-h-[360px] overflow-auto rounded-lg border border-line scrollbar-subtle">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 z-10 bg-surface-muted">
            <tr>
              {table.headers.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className={cn(
                    "whitespace-nowrap border-b border-line px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-subtle",
                    table.align?.[index] === "left" ? "text-left" : "text-right",
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr
                key={`result-row-${rowIndex}`}
                className="border-b border-line/60 last:border-b-0 odd:bg-background even:bg-surface-muted/25"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`cell-${rowIndex}-${cellIndex}`}
                    className={cn(
                      "tabular whitespace-nowrap px-2.5 py-1.5 text-foreground-soft",
                      table.align?.[cellIndex] === "left"
                        ? "text-left"
                        : "text-right",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.rows.length === 0 ? (
        <p className="mt-1 text-[11px] text-subtle">{copy.table.noRows}</p>
      ) : null}
    </div>
  );
}

function buildCopyText(
  result: CalculatorResult,
  title: string,
  language: Language,
  copy: MathCopy,
): string {
  const lines: string[] = [copy.results.copyHeading(title), ""];
  result.metrics.forEach((metric) => {
    lines.push(`${resolve(metric.label, language)}: ${resolve(metric.value, language)}`);
  });
  lines.push("", `${copy.results.interpretation}: ${result.interpretation[language]}`);
  if (result.steps?.length) {
    lines.push("", copy.results.steps);
    result.steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step.title[language]}`);
      if (step.formula) lines.push(`   ${copy.results.formula}: ${step.formula}`);
      if (step.substitution)
        lines.push(`   ${copy.results.substitution}: ${step.substitution}`);
      if (step.note) lines.push(`   ${step.note[language]}`);
    });
  }
  if (result.warnings?.length) {
    lines.push("", copy.results.warnings);
    result.warnings.forEach((warning) => lines.push(`- ${warning[language]}`));
  }
  return lines.join("\n");
}

export function ResultsPanel({
  result,
  title,
  assumptions,
  language,
  copy,
}: {
  result: ComputeResult;
  title: string;
  assumptions: BiText;
  language: Language;
  copy: MathCopy;
}) {
  const [copied, setCopied] = useState(false);

  if ("error" in result) {
    return (
      <Panel aria-live="polite">
        <PanelHeader title={copy.results.title} />
        <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface-muted text-muted">
            <ListChecks className="h-4 w-4" aria-hidden="true" />
          </span>
          <h3 className="mt-3 text-[13px] font-semibold text-foreground">
            {copy.results.waitingTitle}
          </h3>
          <p className="mt-1.5 max-w-sm text-[12px] leading-5 text-amber">
            {result.error[language]}
          </p>
          <p className="mt-2 max-w-sm text-[11.5px] leading-5 text-subtle">
            {copy.results.waitingBody}
          </p>
        </div>
      </Panel>
    );
  }

  const decisionMetric = result.metrics.find(
    (metric) => resolve(metric.label, language) === copy.results.decision,
  );
  const metrics = result.metrics.filter((metric) => metric !== decisionMetric);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(
        buildCopyText(result as CalculatorResult, title, language, copy),
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Panel aria-live="polite">
      <PanelHeader
        title={copy.results.title}
        action={
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[11px] font-medium text-foreground-soft transition-colors hover:border-line-strong hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? copy.actions.copied : copy.actions.copy}
          </button>
        }
      />
      <div className="space-y-4 p-4 sm:p-5">
        {decisionMetric ? (
          <div
            role="status"
            className={cn(
              "rounded-xl border px-3.5 py-2.5",
              decisionMetric.tone === "warning"
                ? "border-amber/25 bg-amber-soft/50"
                : "border-brand/25 bg-brand-soft/60",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-subtle">
              {copy.results.decision}
            </p>
            <p
              className={cn(
                "mt-0.5 text-[13px] font-semibold leading-5",
                decisionMetric.tone === "warning"
                  ? "text-amber"
                  : "text-brand-strong",
              )}
            >
              {resolve(decisionMetric.value, language)}
            </p>
            {result.decision ? (
              <p className="tabular mt-0.5 text-[10.5px] text-muted">
                p = {result.decision.pValue < 0.0001 ? "< 0.0001" : result.decision.pValue.toFixed(4)}
                {" · "}
                α = {result.decision.alpha}
              </p>
            ) : null}
          </div>
        ) : null}

        {metrics.length > 0 ? (
          <dl className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {metrics.map((metric, index) => (
              <div
                key={`${resolve(metric.label, "en")}-${index}`}
                className="min-w-0 rounded-lg border border-line bg-background px-2.5 py-2"
              >
                <dt className="truncate text-[9.5px] font-medium uppercase tracking-[0.04em] text-subtle">
                  {resolve(metric.label, language)}
                </dt>
                <dd
                  className={cn(
                    "tabular mt-0.5 break-words text-[13.5px] font-semibold leading-5",
                    toneClass(metric.tone),
                  )}
                >
                  {resolve(metric.value, language)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {result.tables?.map((table, index) => (
          <ResultTableBlock
            key={`table-${index}`}
            table={table}
            language={language}
            copy={copy}
          />
        ))}

        <div className="rounded-xl border border-brand/20 bg-brand-soft/40 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-strong/80">
            {copy.results.interpretation}
          </p>
          <p className="mt-1 text-[12.5px] leading-5 text-foreground-soft">
            {result.interpretation[language]}
          </p>
        </div>

        {result.warnings?.length ? (
          <div className="rounded-xl border border-amber/25 bg-amber-soft/40 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber">
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.results.warnings}
            </p>
            <ul className="mt-1.5 space-y-1">
              {result.warnings.map((warning, index) => (
                <li
                  key={`warning-${index}`}
                  className="text-[11.5px] leading-5 text-foreground-soft"
                >
                  {warning[language]}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {result.steps?.length ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-subtle">
              {copy.results.steps}
            </p>
            <ol className="space-y-2">
              {result.steps.map((step, index) => (
                <li
                  key={`step-${index}`}
                  className="rounded-lg border border-line bg-background px-3 py-2.5"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand-strong">
                      {index + 1}
                    </span>
                    <p className="text-[12px] font-semibold leading-5 text-foreground">
                      {step.title[language]}
                    </p>
                  </div>
                  {step.formula ? (
                    <div className="mt-1.5 pl-7">
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.05em] text-subtle">
                        {copy.results.formula}
                      </p>
                      <pre className="mt-0.5 whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-foreground-soft">
                        {step.formula}
                      </pre>
                    </div>
                  ) : null}
                  {step.substitution ? (
                    <div className="mt-1.5 pl-7">
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.05em] text-subtle">
                        {copy.results.substitution}
                      </p>
                      <pre className="mt-0.5 whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-muted">
                        {step.substitution}
                      </pre>
                    </div>
                  ) : null}
                  {step.note ? (
                    <p className="mt-1.5 pl-7 text-[11px] leading-5 text-muted">
                      {step.note[language]}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <details className="group rounded-lg border border-line bg-surface-muted/40">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-subtle [&::-webkit-details-marker]:hidden">
            {copy.results.assumptions}
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="border-t border-line px-3 py-2.5 text-[11.5px] leading-5 text-muted">
            {assumptions[language]}
          </p>
        </details>
      </div>
    </Panel>
  );
}
