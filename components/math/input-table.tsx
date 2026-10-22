"use client";

import type { ClipboardEvent } from "react";
import { Columns3, Plus, Trash2, X } from "lucide-react";
import type { Language } from "@/lib/i18n";
import type { TableSpec, TableState } from "@/lib/econ-math/types";
import { cn } from "@/lib/utils/cn";
import type { MathCopy } from "@/components/math/copy";

function splitClipboard(text: string): string[][] {
  const normalized = text.replace(/\r/g, "");
  const lines = normalized.split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();

  const hasTab = normalized.includes("\t");
  const hasComma = normalized.includes(",");
  const hasSemicolon = normalized.includes(";");
  const delimiter = hasTab ? "\t" : hasComma ? "," : hasSemicolon ? ";" : "\t";

  return lines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
}

export function InputTable({
  spec,
  value,
  onChange,
  language,
  copy,
}: {
  spec: TableSpec;
  value: TableState;
  onChange: (next: TableState) => void;
  language: Language;
  copy: MathCopy;
}) {
  const offset = spec.rowLabels ? 1 : 0;
  const dataColumnCount = spec.dynamicColumns
    ? value.headers.length
    : spec.columns.length;
  const totalColumns = dataColumnCount + offset;
  const minColumns = spec.columns.length;

  const fixedHeaders = spec.columns.map((column) => column.label[language]);

  function normalizeRow(row: string[], columns = totalColumns): string[] {
    return Array.from({ length: columns }, (_, index) => row[index] ?? "");
  }

  function updateCell(
    rowIndex: number,
    cellIndex: number,
    nextValue: string,
  ): void {
    const rows = value.rows.map((row, index) => {
      const normalized = normalizeRow(row);
      if (index === rowIndex) normalized[cellIndex] = nextValue;
      return normalized;
    });
    onChange({ ...value, rows });
  }

  function addRow(): void {
    if (value.rows.length >= spec.maxRows) return;
    onChange({
      ...value,
      rows: [
        ...value.rows.map((row) => normalizeRow(row)),
        Array.from({ length: totalColumns }, () => ""),
      ],
    });
  }

  function removeRow(rowIndex: number): void {
    if (value.rows.length <= spec.minRows) return;
    onChange({
      ...value,
      rows: value.rows
        .filter((_, index) => index !== rowIndex)
        .map((row) => normalizeRow(row)),
    });
  }

  function addColumn(): void {
    if (!spec.dynamicColumns) return;
    const label =
      language === "bn"
        ? `কলাম ${value.headers.length + 1}`
        : `Column ${value.headers.length + 1}`;
    onChange({
      headers: [...value.headers, label],
      rows: value.rows.map((row) => [...normalizeRow(row), ""]),
    });
  }

  function removeColumn(columnIndex: number): void {
    if (!spec.dynamicColumns || value.headers.length <= minColumns) return;
    const dataIndex = offset + columnIndex;
    onChange({
      headers: value.headers.filter((_, index) => index !== columnIndex),
      rows: value.rows.map((row) => {
        const normalized = normalizeRow(row);
        normalized.splice(dataIndex, 1);
        return normalized;
      }),
    });
  }

  function updateHeader(columnIndex: number, nextValue: string): void {
    onChange({
      ...value,
      headers: value.headers.map((header, index) =>
        index === columnIndex ? nextValue : header,
      ),
    });
  }

  function handlePaste(
    event: ClipboardEvent<HTMLInputElement>,
    rowIndex: number,
    dataIndex: number,
  ): void {
    const text = event.clipboardData.getData("text");
    if (!text) return;
    const hasGrid = text.includes("\t") || text.includes("\n");
    if (!hasGrid) return;

    event.preventDefault();
    const grid = splitClipboard(text);
    if (grid.length === 0) return;

    const pastedWidth = Math.max(...grid.map((row) => row.length));
    const wantedColumns = dataIndex + pastedWidth;
    const nextDataColumns = spec.dynamicColumns
      ? Math.max(dataColumnCount, wantedColumns)
      : dataColumnCount;
    const nextTotalColumns = nextDataColumns + offset;

    const nextHeaders = spec.dynamicColumns
      ? Array.from({ length: nextDataColumns }, (_, index) => {
          if (index < value.headers.length) return value.headers[index];
          return language === "bn"
            ? `কলাম ${index + 1}`
            : `Column ${index + 1}`;
        })
      : value.headers;

    const rowsNeeded = Math.max(
      value.rows.length,
      Math.min(spec.maxRows, rowIndex + grid.length),
      spec.minRows,
    );

    const nextRows = Array.from({ length: rowsNeeded }, (_, currentRow) => {
      const normalized = normalizeRow(
        value.rows[currentRow] ?? [],
        nextTotalColumns,
      );
      const pastedRow = grid[currentRow - rowIndex];
      if (!pastedRow) return normalized;

      pastedRow.forEach((cell, pastedColumn) => {
        const targetDataIndex = dataIndex + pastedColumn;
        if (targetDataIndex >= nextDataColumns) return;
        normalized[offset + targetDataIndex] = cell;
      });
      return normalized;
    });

    onChange({ headers: nextHeaders, rows: nextRows });
  }

  function dataHeaderAt(index: number): string {
    if (spec.dynamicColumns) {
      return value.headers[index] || `${copy.input.columnHeader} ${index + 1}`;
    }
    return fixedHeaders[index] ?? "";
  }

  return (
    <div className="min-w-0">
      <div className="table-scroll overflow-x-auto rounded-lg border border-line scrollbar-subtle">
        <table className="w-full min-w-max text-[12px]">
          <caption className="sr-only">
            {spec.label?.[language] ?? copy.input.tableLabel}
          </caption>
          <thead>
            <tr className="bg-surface-muted/70">
              {spec.rowLabels ? (
                <th className="border-b border-line px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-subtle">
                  {copy.input.rowLabel}
                </th>
              ) : null}
              {Array.from({ length: dataColumnCount }, (_, index) => (
                <th
                  key={`header-${index}`}
                  className="border-b border-line px-2 py-1.5 text-left"
                >
                  {spec.dynamicColumns ? (
                    <div className="flex items-center gap-0.5">
                      <input
                        type="text"
                        value={value.headers[index] ?? ""}
                        onChange={(event) => updateHeader(index, event.target.value)}
                        aria-label={`${copy.input.columnHeader} ${index + 1}`}
                        className="h-7 w-full min-w-[82px] rounded border border-transparent bg-transparent px-1 text-[11px] font-semibold text-foreground-soft focus:border-brand focus:bg-background focus:outline-none focus:ring-1 focus:ring-brand/30"
                      />
                      {dataColumnCount > minColumns ? (
                        <button
                          type="button"
                          onClick={() => removeColumn(index)}
                          aria-label={`${copy.input.removeColumn}: ${dataHeaderAt(index)}`}
                          className="grid h-5 w-5 shrink-0 place-items-center rounded text-subtle hover:bg-danger-soft hover:text-danger"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <span className="block whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-[0.05em] text-subtle">
                      {dataHeaderAt(index)}
                    </span>
                  )}
                </th>
              ))}
              <th className="w-8 border-b border-line px-1 py-2">
                <span className="sr-only">Row actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {value.rows.map((row, rowIndex) => (
              <tr
                key={`row-${rowIndex}`}
                className="group border-b border-line/70 last:border-b-0 hover:bg-surface-muted/30"
              >
                {spec.rowLabels ? (
                  <td className="px-1.5 py-1">
                    <input
                      type="text"
                      value={row[0] ?? ""}
                      onChange={(event) =>
                        updateCell(rowIndex, 0, event.target.value)
                      }
                      placeholder={copy.input.rowLabelPlaceholder}
                      aria-label={`${copy.input.rowLabel} ${rowIndex + 1}`}
                      className="h-8 w-full min-w-[112px] rounded border border-transparent bg-transparent px-1.5 text-[12px] text-foreground placeholder:text-subtle/70 focus:border-brand focus:bg-background focus:outline-none focus:ring-1 focus:ring-brand/30"
                    />
                  </td>
                ) : null}
                {Array.from({ length: dataColumnCount }, (_, dataIndex) => {
                  const cellIndex = offset + dataIndex;
                  return (
                    <td key={`cell-${rowIndex}-${dataIndex}`} className="px-1 py-0.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row[cellIndex] ?? ""}
                        onChange={(event) =>
                          updateCell(rowIndex, cellIndex, event.target.value)
                        }
                        onPaste={(event) =>
                          handlePaste(event, rowIndex, dataIndex)
                        }
                        aria-label={`${dataHeaderAt(dataIndex)}, row ${rowIndex + 1}`}
                        className="tabular h-8 w-full min-w-[80px] rounded border border-transparent bg-transparent px-1.5 text-right text-[12px] text-foreground focus:border-brand focus:bg-background focus:outline-none focus:ring-1 focus:ring-brand/30"
                      />
                    </td>
                  );
                })}
                <td className="px-1 py-0.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    disabled={value.rows.length <= spec.minRows}
                    aria-label={`${copy.input.removeRow} (${rowIndex + 1})`}
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded text-subtle transition-colors",
                      "hover:bg-danger-soft hover:text-danger",
                      "disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-subtle",
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={addRow}
            disabled={value.rows.length >= spec.maxRows}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-surface px-2 text-[11px] font-medium text-foreground-soft transition-colors hover:border-line-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            {spec.addRowLabel?.[language] ?? copy.input.addRow}
          </button>
          {spec.dynamicColumns ? (
            <button
              type="button"
              onClick={addColumn}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-surface px-2 text-[11px] font-medium text-foreground-soft transition-colors hover:border-line-strong hover:text-foreground"
            >
              <Columns3 className="h-3 w-3" aria-hidden="true" />
              {spec.addColumnLabel?.[language] ?? copy.input.addColumn}
            </button>
          ) : null}
        </div>
        <p className="max-w-[420px] text-[10.5px] leading-4 text-subtle">
          {copy.input.pasteHelp}
        </p>
      </div>
    </div>
  );
}
