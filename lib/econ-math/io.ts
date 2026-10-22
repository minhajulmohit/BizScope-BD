import {
  CalcInputError,
  type BiText,
  type CalculatorInput,
  type TableState,
  t,
} from "@/lib/econ-math/types";

export function parseCell(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  let value = raw.trim();
  if (value === "") return null;

  value = value
    .replace(/[\u2212\u2013\u2014]/g, "-")
    .replace(/\u00a0/g, "")
    .replace(/\s+/g, "");

  let negative = false;
  if (value.startsWith("(") && value.endsWith(")")) {
    negative = true;
    value = value.slice(1, -1);
  }

  value = value.replace(/,/g, "");
  if (value === "" || value === "-") return null;
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(value)) {
    return Number.NaN;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Number.NaN;
  return negative ? -parsed : parsed;
}

export function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim() === "";
}

export function formatNumber(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value !== 0 && (Math.abs(value) >= 1e9 || Math.abs(value) < 1e-4)) {
    return value.toExponential(3);
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatFixed(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "\u2014";
  return value.toFixed(digits);
}

export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "\u2014";
  return `${formatNumber(value * 100, digits)}%`;
}

export function formatPValue(value: number): string {
  if (!Number.isFinite(value)) return "\u2014";
  if (value < 0.0001) return "< 0.0001";
  return value.toFixed(4);
}

export function field(input: CalculatorInput, key: string): string {
  return input.fields[key]?.trim() ?? "";
}

export function requireField(
  input: CalculatorInput,
  key: string,
  label: BiText,
): string {
  const value = field(input, key);
  if (value === "") {
    throw new CalcInputError(
      t(
        `Enter ${label.en.toLowerCase()}.`,
        `${label.bn} লিখুন।`,
      ),
    );
  }
  return value;
}

export function numberField(
  input: CalculatorInput,
  key: string,
  label: BiText,
): number {
  const raw = requireField(input, key, label);
  const parsed = parseCell(raw);
  if (parsed === null || Number.isNaN(parsed)) {
    throw new CalcInputError(
      t(`${label.en} must be a number.`, `${label.bn} একটি সংখ্যা হতে হবে।`),
    );
  }
  return parsed;
}

export function optionalNumberField(
  input: CalculatorInput,
  key: string,
  label: BiText,
): number | null {
  const raw = field(input, key);
  if (raw === "") return null;
  const parsed = parseCell(raw);
  if (parsed === null || Number.isNaN(parsed)) {
    throw new CalcInputError(
      t(`${label.en} must be a number.`, `${label.bn} একটি সংখ্যা হতে হবে।`),
    );
  }
  return parsed;
}

export function getTable(
  input: CalculatorInput,
  key: string,
  label: BiText,
): TableState {
  const table = input.tables[key];
  if (!table) {
    throw new CalcInputError(
      t(`The ${label.en} table is missing.`, `${label.bn} টেবিল পাওয়া যায়নি।`),
    );
  }
  return table;
}

function parseAt(raw: string, row: number, columnLabel: string): number {
  const parsed = parseCell(raw);
  if (parsed === null) {
    throw new CalcInputError(
      t(
        `${columnLabel}: row ${row + 1} is empty.`,
        `${columnLabel}: ${row + 1} নম্বর সারিটি খালি।`,
      ),
    );
  }
  if (Number.isNaN(parsed)) {
    throw new CalcInputError(
      t(
        `${columnLabel}: row ${row + 1} is not a valid number.`,
        `${columnLabel}: ${row + 1} নম্বর সারিতে বৈধ সংখ্যা নেই।`,
      ),
    );
  }
  return parsed;
}

/**
 * Reads one column, ignoring completely blank cells. A non-blank invalid cell
 * is reported with its row number instead of being silently dropped.
 */
export function numericColumn(
  input: CalculatorInput,
  tableKey: string,
  columnIndex: number,
  tableLabel: BiText,
  columnLabel: BiText,
  options: { skipBlank?: boolean } = {},
): number[] {
  const table = getTable(input, tableKey, tableLabel);
  const values: number[] = [];

  table.rows.forEach((row, index) => {
    const raw = row[columnIndex] ?? "";
    if (isBlank(raw)) {
      if (options.skipBlank === false) {
        throw new CalcInputError(
          t(
            `${columnLabel.en}: row ${index + 1} is empty.`,
            `${columnLabel.bn}: ${index + 1} নম্বর সারিটি খালি।`,
          ),
        );
      }
      return;
    }
    values.push(parseAt(raw, index, columnLabel.en));
  });

  if (values.length === 0) {
    throw new CalcInputError(
      t(
        `Enter at least one value in ${columnLabel.en}.`,
        `${columnLabel.bn}-এ অন্তত একটি মান লিখুন।`,
      ),
    );
  }

  return values;
}

/** Reads two columns and keeps only rows where both cells contain numbers. */
export function pairedColumns(
  input: CalculatorInput,
  tableKey: string,
  columnA: number,
  columnB: number,
  tableLabel: BiText,
  labelA: BiText,
  labelB: BiText,
): { a: number[]; b: number[]; skipped: number } {
  const table = getTable(input, tableKey, tableLabel);
  const a: number[] = [];
  const b: number[] = [];
  let skipped = 0;

  table.rows.forEach((row, index) => {
    const rawA = row[columnA] ?? "";
    const rawB = row[columnB] ?? "";
    if (isBlank(rawA) && isBlank(rawB)) return;
    if (isBlank(rawA) || isBlank(rawB)) {
      skipped += 1;
      return;
    }
    a.push(parseAt(rawA, index, labelA.en));
    b.push(parseAt(rawB, index, labelB.en));
  });

  if (a.length === 0) {
    throw new CalcInputError(
      t(
        `Enter at least one complete pair in ${labelA.en} and ${labelB.en}.`,
        `${labelA.bn} ও ${labelB.bn}-এ অন্তত একটি পূর্ণ জোড়া লিখুন।`,
      ),
    );
  }

  return { a, b, skipped };
}

export interface ParsedMatrix {
  headers: string[];
  rowLabels: string[];
  matrix: number[][];
  rowCount: number;
  columnCount: number;
}

/**
 * Reads a labelled contingency matrix. The first cell of each row is a label;
 * numeric columns follow. Completely empty rows and columns are ignored.
 */
export function labelledMatrix(
  input: CalculatorInput,
  tableKey: string,
  tableLabel: BiText,
): ParsedMatrix {
  const table = getTable(input, tableKey, tableLabel);
  const activeRows = table.rows.filter((row) =>
    row.slice(1).some((cell) => !isBlank(cell)),
  );

  if (activeRows.length === 0) {
    throw new CalcInputError(
      t("Enter counts in the table.", "টেবিলে গণনা লিখুন।"),
    );
  }

  const columnCount = Math.max(...activeRows.map((row) => row.length)) - 1;
  const usedColumns: number[] = [];
  for (let column = 1; column <= columnCount; column += 1) {
    if (activeRows.some((row) => !isBlank(row[column]))) {
      usedColumns.push(column);
    }
  }

  if (usedColumns.length < 2) {
    throw new CalcInputError(
      t(
        "The table needs at least two data columns.",
        "টেবিলে অন্তত দুটি ডেটা কলাম দরকার।",
      ),
    );
  }

  const rowLabels: string[] = [];
  const headers = usedColumns.map(
    (column) => table.headers[column - 1]?.trim() || `Column ${column}`,
  );
  const matrix: number[][] = [];

  activeRows.forEach((row) => {
    const label = row[0]?.trim() || `Row ${rowLabels.length + 1}`;
    const values = usedColumns.map((column) =>
      parseAt(row[column] ?? "", rowLabels.length, `Row ${rowLabels.length + 1}`),
    );
    rowLabels.push(label);
    matrix.push(values);
  });

  return {
    headers,
    rowLabels,
    matrix,
    rowCount: matrix.length,
    columnCount: usedColumns.length,
  };
}

export function alphaField(input: CalculatorInput): number {
  return numberField(
    input,
    "alpha",
    t("The significance level (alpha)", "তাৎপর্য স্তর (আলফা)"),
  );
}

export function tailField(input: CalculatorInput): "two-sided" | "greater" | "less" {
  const value = field(input, "tails");
  if (value === "greater" || value === "less") return value;
  return "two-sided";
}
