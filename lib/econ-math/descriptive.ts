export interface SummaryStats {
  n: number;
  sum: number;
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  variance: number | null;
  standardDeviation: number | null;
  coefficientOfVariation: number | null;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number | null;
  kurtosis: number | null;
}

export function mean(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function sorted(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

/** Linear-interpolation quantile (the default method used by R and Excel). */
export function quantile(values: number[], p: number): number {
  if (values.length === 1) return values[0];
  const ordered = sorted(values);
  const position = (ordered.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const fraction = position - lower;
  return ordered[lower] + fraction * (ordered[upper] - ordered[lower]);
}

export function variance(values: number[], sample = true): number | null {
  const n = values.length;
  const divisor = sample ? n - 1 : n;
  if (divisor <= 0) return null;
  const average = mean(values);
  return (
    values.reduce((total, value) => total + (value - average) ** 2, 0) / divisor
  );
}

export function standardDeviation(
  values: number[],
  sample = true,
): number | null {
  const result = variance(values, sample);
  return result === null ? null : Math.sqrt(result);
}

export function mode(values: number[]): number[] {
  const counts = new Map<number, number>();
  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  let highest = 0;
  counts.forEach((count) => {
    if (count > highest) highest = count;
  });
  if (highest <= 1) return [];
  return [...counts.entries()]
    .filter(([, count]) => count === highest)
    .map(([value]) => value)
    .sort((a, b) => a - b);
}

export function skewness(values: number[]): number | null {
  const n = values.length;
  if (n < 3) return null;
  const average = mean(values);
  const sd = standardDeviation(values, true);
  if (sd === null || sd === 0) return null;
  const cubed = values.reduce(
    (total, value) => total + ((value - average) / sd) ** 3,
    0,
  );
  return (n / ((n - 1) * (n - 2))) * cubed;
}

export function excessKurtosis(values: number[]): number | null {
  const n = values.length;
  if (n < 4) return null;
  const average = mean(values);
  const sd = standardDeviation(values, true);
  if (sd === null || sd === 0) return null;
  const fourth = values.reduce(
    (total, value) => total + ((value - average) / sd) ** 4,
    0,
  );
  return (
    (n * (n + 1) * fourth) / ((n - 1) * (n - 2) * (n - 3)) -
    (3 * (n - 1) ** 2) / ((n - 2) * (n - 3))
  );
}

export function summarize(values: number[], sample = true): SummaryStats {
  const average = mean(values);
  const varianceValue = variance(values, sample);
  const sd = varianceValue === null ? null : Math.sqrt(varianceValue);
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  return {
    n: values.length,
    sum: sum(values),
    mean: average,
    median: quantile(values, 0.5),
    mode: mode(values),
    min: Math.min(...values),
    max: Math.max(...values),
    range: Math.max(...values) - Math.min(...values),
    variance: varianceValue,
    standardDeviation: sd,
    coefficientOfVariation:
      sd !== null && average !== 0 ? sd / Math.abs(average) : null,
    q1,
    q3,
    iqr: q3 - q1,
    skewness: skewness(values),
    kurtosis: excessKurtosis(values),
  };
}

/** Ranks with average ranks for tied values. */
export function ranks(values: number[]): number[] {
  const indexed = values.map((value, index) => ({ value, index }));
  indexed.sort((a, b) => a.value - b.value);
  const result = new Array<number>(values.length);
  let position = 0;

  while (position < indexed.length) {
    let end = position;
    while (
      end + 1 < indexed.length &&
      indexed[end + 1].value === indexed[position].value
    ) {
      end += 1;
    }
    const averageRank = (position + end) / 2 + 1;
    for (let i = position; i <= end; i += 1) {
      result[indexed[i].index] = averageRank;
    }
    position = end + 1;
  }

  return result;
}

export interface GroupedRow {
  lower: number;
  upper: number;
  frequency: number;
  midpoint: number;
  cumulative: number;
}

export interface GroupedSummary {
  rows: GroupedRow[];
  n: number;
  mean: number;
  median: number | null;
  mode: number | null;
  variance: number | null;
  standardDeviation: number | null;
}

export function summarizeGrouped(
  input: { lower: number; upper: number; frequency: number }[],
): GroupedSummary {
  const n = input.reduce((total, row) => total + row.frequency, 0);
  const rows: GroupedRow[] = [];
  let cumulative = 0;

  input.forEach((row) => {
    cumulative += row.frequency;
    rows.push({
      ...row,
      midpoint: (row.lower + row.upper) / 2,
      cumulative,
    });
  });

  const total = rows.reduce(
    (running, row) => running + row.midpoint * row.frequency,
    0,
  );
  const average = total / n;

  let median: number | null = null;
  const medianPosition = n / 2;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.cumulative >= medianPosition) {
      const previous = index === 0 ? 0 : rows[index - 1].cumulative;
      const width = row.upper - row.lower;
      median = row.lower + ((medianPosition - previous) / row.frequency) * width;
      break;
    }
  }

  const modalIndex = rows.reduce(
    (best, row, index) => (row.frequency > rows[best].frequency ? index : best),
    0,
  );
  const modal = rows[modalIndex];
  const before = modalIndex === 0 ? 0 : rows[modalIndex - 1].frequency;
  const after =
    modalIndex === rows.length - 1 ? 0 : rows[modalIndex + 1].frequency;
  const denominator = 2 * modal.frequency - before - after;
  const modalWidth = modal.upper - modal.lower;
  const modalValue =
    denominator > 0
      ? modal.lower + ((modal.frequency - before) / denominator) * modalWidth
      : null;

  const varianceValue =
    n > 1
      ? rows.reduce(
          (running, row) =>
            running + row.frequency * (row.midpoint - average) ** 2,
          0,
        ) /
        (n - 1)
      : null;

  return {
    rows,
    n,
    mean: average,
    median,
    mode: modalValue,
    variance: varianceValue,
    standardDeviation: varianceValue === null ? null : Math.sqrt(varianceValue),
  };
}
