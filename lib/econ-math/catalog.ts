import type { Language } from "@/lib/i18n";
import { descriptiveCalculators } from "@/lib/econ-math/registry/descriptive";
import { financeCalculators } from "@/lib/econ-math/registry/finance";
import { hypothesisCalculators } from "@/lib/econ-math/registry/hypothesis";
import { indexCalculators } from "@/lib/econ-math/registry/index-numbers";
import { macroCalculators } from "@/lib/econ-math/registry/macro";
import { microCalculators } from "@/lib/econ-math/registry/micro";
import { regressionCalculators } from "@/lib/econ-math/registry/regression";
import {
  type CalculatorDef,
  type CalculatorDraft,
  type TableState,
} from "@/lib/econ-math/types";

export const CALCULATORS: CalculatorDef[] = [
  ...descriptiveCalculators,
  ...hypothesisCalculators,
  ...regressionCalculators,
  ...microCalculators,
  ...macroCalculators,
  ...financeCalculators,
  ...indexCalculators,
];

export const CALCULATOR_BY_ID = new Map(
  CALCULATORS.map((calculator) => [calculator.id, calculator]),
);

export function getCalculator(id: string | null | undefined): CalculatorDef {
  return (id && CALCULATOR_BY_ID.get(id)) || CALCULATORS[0];
}

export function calculatorsInCategory(category: string): CalculatorDef[] {
  return CALCULATORS.filter((calculator) => calculator.category === category);
}

function totalColumns(spec: CalculatorDef["tables"][number], dataColumns: number): number {
  return dataColumns + (spec.rowLabels ? 1 : 0);
}

function initialHeaders(
  calculator: CalculatorDef,
  spec: CalculatorDef["tables"][number],
  dataColumns: number,
  language: Language,
): string[] {
  if (!spec.dynamicColumns) {
    return spec.columns.map((column) => column.label.en);
  }
  return Array.from({ length: dataColumns }, (_, index) => {
    const column = spec.columns[index];
    if (column) return column.label[language];
    return language === "bn" ? `কলাম ${index + 1}` : `Column ${index + 1}`;
  });
}

export function createDraft(
  calculator: CalculatorDef,
  options: { example?: boolean; language?: Language } = {},
): CalculatorDraft {
  const language = options.language ?? "en";
  const useExample = options.example ?? false;
  const fields: Record<string, string> = {};
  calculator.fields.forEach((field) => {
    fields[field.key] = useExample
      ? calculator.example.fields[field.key] ?? field.defaultValue
      : field.defaultValue;
  });

  const tables: Record<string, TableState> = {};
  calculator.tables.forEach((spec) => {
    const exampleRows = useExample ? calculator.example.tables[spec.key] : undefined;
    const dataColumns = Math.max(
      spec.columns.length,
      spec.dynamicColumns
        ? Math.max(
            spec.initialColumns ?? spec.columns.length,
            exampleRows
              ? Math.max(
                  ...exampleRows.map(
                    (row) => row.length - (spec.rowLabels ? 1 : 0),
                  ),
                  spec.columns.length,
                )
              : 0,
          )
        : spec.columns.length,
    );
    const columnCount = totalColumns(spec, dataColumns);

    const rows: string[][] = useExample && exampleRows
      ? exampleRows.map((row) =>
          Array.from({ length: columnCount }, (_, index) => row[index] ?? ""),
        )
      : Array.from({ length: spec.initialRows }, () =>
          Array.from({ length: columnCount }, () => ""),
        );

    if (useExample && rows.length < spec.minRows) {
      while (rows.length < spec.minRows) {
        rows.push(Array.from({ length: columnCount }, () => ""));
      }
    }

    tables[spec.key] = {
      headers: initialHeaders(calculator, spec, dataColumns, language),
      rows,
    };
  });

  return { fields, tables };
}

export function emptyTableRow(
  calculator: CalculatorDef,
  specKey: string,
): string[] {
  const spec = calculator.tables.find((table) => table.key === specKey);
  if (!spec) return [];
  const count =
    (spec.dynamicColumns
      ? Math.max(spec.initialColumns ?? spec.columns.length, spec.columns.length)
      : spec.columns.length) + (spec.rowLabels ? 1 : 0);
  return Array.from({ length: count }, () => "");
}
