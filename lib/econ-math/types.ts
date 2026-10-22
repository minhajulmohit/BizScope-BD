import type { Language } from "@/lib/i18n";

export type { Language };

export interface BiText {
  en: string;
  bn: string;
}

export type CategoryId =
  | "descriptive"
  | "hypothesis"
  | "regression"
  | "micro"
  | "macro"
  | "finance"
  | "index";

export interface FieldOption {
  value: string;
  label: BiText;
}

export interface FieldSpec {
  key: string;
  label: BiText;
  help?: BiText;
  defaultValue: string;
  kind?: "number" | "select";
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
}

export interface ColumnSpec {
  key: string;
  label: BiText;
}

export interface TableSpec {
  key: string;
  label?: BiText;
  description?: BiText;
  columns: ColumnSpec[];
  /** The user can add numeric columns (for example ANOVA groups). */
  dynamicColumns?: boolean;
  /** The first cell of every row is a text label instead of a number. */
  rowLabels?: boolean;
  minRows: number;
  maxRows: number;
  initialRows: number;
  initialColumns?: number;
  addRowLabel?: BiText;
  addColumnLabel?: BiText;
}

export interface TableState {
  headers: string[];
  rows: string[][];
}

export interface CalculatorInput {
  fields: Record<string, string>;
  tables: Record<string, TableState>;
}

export interface CalculatorDraft {
  fields: Record<string, string>;
  tables: Record<string, TableState>;
}

export interface Metric {
  label: string | BiText;
  value: string | BiText;
  tone?: "default" | "brand" | "warning";
  hint?: BiText;
}

export interface Step {
  title: BiText;
  formula?: string;
  substitution?: string;
  note?: BiText;
}

export interface DecisionInfo {
  rejected: boolean;
  alpha: number;
  pValue: number;
}

export interface ResultTable {
  title?: BiText;
  headers: string[];
  rows: string[][];
  align?: ("left" | "right")[];
}

export interface CalculatorResult {
  metrics: Metric[];
  steps?: Step[];
  decision?: DecisionInfo;
  interpretation: BiText;
  warnings?: BiText[];
  tables?: ResultTable[];
}

export type ComputeResult = CalculatorResult | { error: BiText };

export interface CalculatorDef {
  id: string;
  category: CategoryId;
  title: BiText;
  description: BiText;
  whenToUse: BiText;
  assumptions: BiText;
  formulaSummary: string[];
  legend?: BiText;
  fields: FieldSpec[];
  tables: TableSpec[];
  example: {
    fields: Record<string, string>;
    tables: Record<string, string[][]>;
  };
  compute: (input: CalculatorInput) => ComputeResult;
}

export class CalcInputError extends Error {
  readonly biMessage: BiText;

  constructor(message: BiText) {
    super(message.en);
    this.name = "CalcInputError";
    this.biMessage = message;
  }
}

export function t(en: string, bn: string): BiText {
  return { en, bn };
}
