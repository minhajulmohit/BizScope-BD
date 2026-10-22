import { mean, standardDeviation, variance } from "@/lib/econ-math/descriptive";
import {
  chiSquareCritical,
  chiSquareUpperTail,
  fCritical,
  fUpperTail,
  normalUpperTail,
  studentTQuantile,
  studentTTwoTailedP,
  studentTUpperTail,
  zCritical,
} from "@/lib/econ-math/distributions";

export type Tails = "two-sided" | "greater" | "less";

export function tTailProbability(
  statistic: number,
  df: number,
  tails: Tails,
): number {
  if (tails === "two-sided") return studentTTwoTailedP(statistic, df);
  if (tails === "greater") return studentTUpperTail(statistic, df);
  return studentTUpperTail(-statistic, df);
}

export function zTailProbability(statistic: number, tails: Tails): number {
  if (tails === "two-sided") return 2 * normalUpperTail(Math.abs(statistic));
  if (tails === "greater") return normalUpperTail(statistic);
  return normalUpperTail(-statistic);
}

export interface OneSampleZResult {
  n: number;
  mean: number;
  sigma: number;
  standardError: number;
  statistic: number;
  pValue: number;
  critical: number;
  confidenceInterval: [number, number];
}

export function oneSampleZ(
  values: number[],
  hypothesizedMean: number,
  sigma: number,
  alpha: number,
  tails: Tails,
): OneSampleZResult {
  const average = mean(values);
  const standardError = sigma / Math.sqrt(values.length);
  const statistic = (average - hypothesizedMean) / standardError;
  const critical = zCritical(alpha, 2);
  return {
    n: values.length,
    mean: average,
    sigma,
    standardError,
    statistic,
    pValue: zTailProbability(statistic, tails),
    critical,
    confidenceInterval: [
      average - critical * standardError,
      average + critical * standardError,
    ],
  };
}

export interface OneSampleTResult {
  n: number;
  mean: number;
  standardDeviation: number;
  standardError: number;
  statistic: number;
  df: number;
  pValue: number;
  critical: number;
  confidenceInterval: [number, number];
  effectSize: number | null;
}

export function oneSampleT(
  values: number[],
  hypothesizedMean: number,
  alpha: number,
  tails: Tails,
): OneSampleTResult {
  const average = mean(values);
  const sd = standardDeviation(values, true) ?? 0;
  const standardError = sd / Math.sqrt(values.length);
  const statistic =
    standardError === 0 ? (average === hypothesizedMean ? 0 : Infinity) : (average - hypothesizedMean) / standardError;
  const df = values.length - 1;
  const critical = studentTQuantile(1 - alpha / 2, df);
  return {
    n: values.length,
    mean: average,
    standardDeviation: sd,
    standardError,
    statistic,
    df,
    pValue: tTailProbability(statistic, df, tails),
    critical,
    confidenceInterval: [
      average - critical * standardError,
      average + critical * standardError,
    ],
    effectSize: sd === 0 ? null : (average - hypothesizedMean) / sd,
  };
}

export interface TwoSampleTResult {
  n1: number;
  n2: number;
  mean1: number;
  mean2: number;
  difference: number;
  sd1: number;
  sd2: number;
  standardError: number;
  statistic: number;
  df: number;
  pValue: number;
  critical: number;
  confidenceInterval: [number, number];
  pooled: boolean;
  effectSize: number | null;
}

export function twoSampleT(
  first: number[],
  second: number[],
  alpha: number,
  tails: Tails,
  pooled: boolean,
): TwoSampleTResult {
  const n1 = first.length;
  const n2 = second.length;
  const mean1 = mean(first);
  const mean2 = mean(second);
  const sd1 = standardDeviation(first, true) ?? 0;
  const sd2 = standardDeviation(second, true) ?? 0;
  const variance1 = sd1 * sd1;
  const variance2 = sd2 * sd2;
  const difference = mean1 - mean2;

  let standardError: number;
  let df: number;

  if (pooled) {
    const pooledVariance =
      ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2);
    standardError = Math.sqrt(pooledVariance * (1 / n1 + 1 / n2));
    df = n1 + n2 - 2;
  } else {
    standardError = Math.sqrt(variance1 / n1 + variance2 / n2);
    const numerator = standardError ** 4;
    const denominator =
      variance1 ** 2 / (n1 ** 2 * (n1 - 1)) +
      variance2 ** 2 / (n2 ** 2 * (n2 - 1));
    df = denominator === 0 ? n1 + n2 - 2 : numerator / denominator;
  }

  const statistic =
    standardError === 0 ? (difference === 0 ? 0 : Infinity) : difference / standardError;
  const critical = studentTQuantile(1 - alpha / 2, df);
  const pooledSd = Math.sqrt(
    ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2),
  );

  return {
    n1,
    n2,
    mean1,
    mean2,
    difference,
    sd1,
    sd2,
    standardError,
    statistic,
    df,
    pValue: tTailProbability(statistic, df, tails),
    critical,
    confidenceInterval: [
      difference - critical * standardError,
      difference + critical * standardError,
    ],
    pooled,
    effectSize: pooledSd === 0 ? null : difference / pooledSd,
  };
}

export interface PairedTResult {
  n: number;
  meanDifference: number;
  sdDifference: number;
  standardError: number;
  statistic: number;
  df: number;
  pValue: number;
  critical: number;
  confidenceInterval: [number, number];
  effectSize: number | null;
}

export function pairedT(
  first: number[],
  second: number[],
  alpha: number,
  tails: Tails,
): PairedTResult {
  const differences = first.map((value, index) => value - second[index]);
  const average = mean(differences);
  const sd = standardDeviation(differences, true) ?? 0;
  const standardError = sd / Math.sqrt(differences.length);
  const statistic =
    standardError === 0 ? (average === 0 ? 0 : Infinity) : average / standardError;
  const df = differences.length - 1;
  const critical = studentTQuantile(1 - alpha / 2, df);
  return {
    n: differences.length,
    meanDifference: average,
    sdDifference: sd,
    standardError,
    statistic,
    df,
    pValue: tTailProbability(statistic, df, tails),
    critical,
    confidenceInterval: [
      average - critical * standardError,
      average + critical * standardError,
    ],
    effectSize: sd === 0 ? null : average / sd,
  };
}

export interface TwoProportionZResult {
  p1: number;
  p2: number;
  difference: number;
  pooledProportion: number;
  standardError: number;
  statistic: number;
  pValue: number;
  critical: number;
  confidenceInterval: [number, number];
}

export function twoProportionZ(
  successes1: number,
  n1: number,
  successes2: number,
  n2: number,
  alpha: number,
  tails: Tails,
): TwoProportionZResult {
  const p1 = successes1 / n1;
  const p2 = successes2 / n2;
  const pooled = (successes1 + successes2) / (n1 + n2);
  const standardError = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
  const difference = p1 - p2;
  const statistic = standardError === 0 ? 0 : difference / standardError;
  const critical = zCritical(alpha, 2);
  const unpooledSe = Math.sqrt(
    (p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2,
  );
  return {
    p1,
    p2,
    difference,
    pooledProportion: pooled,
    standardError,
    statistic,
    pValue: zTailProbability(statistic, tails),
    critical,
    confidenceInterval: [
      difference - critical * unpooledSe,
      difference + critical * unpooledSe,
    ],
  };
}

export interface VarianceFResult {
  n1: number;
  n2: number;
  variance1: number;
  variance2: number;
  statistic: number;
  df1: number;
  df2: number;
  pValue: number;
  critical: number;
  confidenceInterval: [number, number];
}

export function varianceFTest(
  first: number[],
  second: number[],
  alpha: number,
  tails: Tails,
): VarianceFResult {
  const variance1 = variance(first, true) ?? 0;
  const variance2 = variance(second, true) ?? 0;
  const df1 = first.length - 1;
  const df2 = second.length - 1;
  const statistic = variance2 === 0 ? Infinity : variance1 / variance2;
  const upper = fUpperTail(statistic, df1, df2);
  const lower = 1 - upper;

  let pValue: number;
  if (tails === "two-sided") pValue = Math.min(1, 2 * Math.min(upper, lower));
  else if (tails === "greater") pValue = upper;
  else pValue = lower;

  const upperCritical =
    tails === "less" ? fCritical(alpha, df2, df1) : fCritical(alpha, df1, df2);
  const lowerBound =
    statistic / fCritical(alpha / 2, df1, df2);
  const upperBound =
    statistic / (1 / fCritical(alpha / 2, df2, df1));

  return {
    n1: first.length,
    n2: second.length,
    variance1,
    variance2,
    statistic,
    df1,
    df2,
    pValue,
    critical: upperCritical,
    confidenceInterval: [
      Math.min(lowerBound, upperBound),
      Math.max(lowerBound, upperBound),
    ],
  };
}

export interface GoodnessOfFitCell {
  observed: number;
  expected: number;
  contribution: number;
}

export interface GoodnessOfFitResult {
  statistic: number;
  df: number;
  pValue: number;
  critical: number;
  cells: GoodnessOfFitCell[];
  smallExpected: number;
}

export function chiSquareGoodnessOfFit(
  observed: number[],
  expected: number[] | null,
  alpha: number,
): GoodnessOfFitResult {
  const total = observed.reduce((running, value) => running + value, 0);
  const expectedValues =
    expected ?? observed.map(() => total / observed.length);
  const cells = observed.map((value, index) => {
    const expectedValue = expectedValues[index];
    return {
      observed: value,
      expected: expectedValue,
      contribution:
        expectedValue === 0 ? 0 : (value - expectedValue) ** 2 / expectedValue,
    };
  });
  const statistic = cells.reduce(
    (running, cell) => running + cell.contribution,
    0,
  );
  const df = observed.length - 1;
  return {
    statistic,
    df,
    pValue: chiSquareUpperTail(statistic, df),
    critical: chiSquareCritical(alpha, df),
    cells,
    smallExpected: cells.filter((cell) => cell.expected < 5).length,
  };
}

export interface IndependenceResult {
  statistic: number;
  df: number;
  pValue: number;
  critical: number;
  expected: number[][];
  contributions: number[][];
  rowTotals: number[];
  columnTotals: number[];
  total: number;
  smallExpected: number;
  cramersV: number;
}

export function chiSquareIndependence(
  matrix: number[][],
  alpha: number,
  yates: boolean,
): IndependenceResult {
  const rows = matrix.length;
  const columns = matrix[0].length;
  const rowTotals = matrix.map((row) =>
    row.reduce((running, value) => running + value, 0),
  );
  const columnTotals = Array.from({ length: columns }, (_, column) =>
    matrix.reduce((running, row) => running + row[column], 0),
  );
  const total = rowTotals.reduce((running, value) => running + value, 0);

  const expected = matrix.map((row, rowIndex) =>
    row.map(
      (_, columnIndex) =>
        (rowTotals[rowIndex] * columnTotals[columnIndex]) / total,
    ),
  );

  const useYates = yates && rows === 2 && columns === 2;
  const contributions = matrix.map((row, rowIndex) =>
    row.map((value, columnIndex) => {
      const expectedValue = expected[rowIndex][columnIndex];
      if (expectedValue === 0) return 0;
      const difference = Math.abs(value - expectedValue);
      const adjusted = useYates ? Math.max(0, difference - 0.5) : difference;
      return (adjusted * adjusted) / expectedValue;
    }),
  );

  const statistic = contributions
    .flat()
    .reduce((running, value) => running + value, 0);
  const df = (rows - 1) * (columns - 1);

  return {
    statistic,
    df,
    pValue: chiSquareUpperTail(statistic, df),
    critical: chiSquareCritical(alpha, df),
    expected,
    contributions,
    rowTotals,
    columnTotals,
    total,
    smallExpected: expected
      .flat()
      .filter((value) => value < 5).length,
    cramersV: Math.sqrt(statistic / (total * Math.min(rows - 1, columns - 1))),
  };
}

export interface AnovaGroup {
  n: number;
  mean: number;
  standardDeviation: number;
}

export interface AnovaResult {
  groups: AnovaGroup[];
  grandMean: number;
  ssBetween: number;
  ssWithin: number;
  ssTotal: number;
  dfBetween: number;
  dfWithin: number;
  msBetween: number;
  msWithin: number;
  statistic: number;
  pValue: number;
  critical: number;
  etaSquared: number;
}

export function oneWayAnova(groups: number[][], alpha: number): AnovaResult {
  const all = groups.flat();
  const grandMean = mean(all);
  const summaries: AnovaGroup[] = groups.map((group) => ({
    n: group.length,
    mean: mean(group),
    standardDeviation: standardDeviation(group, true) ?? 0,
  }));

  const ssBetween = groups.reduce((running, group, index) => {
    return running + summaries[index].n * (summaries[index].mean - grandMean) ** 2;
  }, 0);

  const ssWithin = groups.reduce((running, group, index) => {
    const groupMean = summaries[index].mean;
    return (
      running +
      group.reduce((inner, value) => inner + (value - groupMean) ** 2, 0)
    );
  }, 0);

  const dfBetween = groups.length - 1;
  const dfWithin = all.length - groups.length;
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const statistic = msWithin === 0 ? Infinity : msBetween / msWithin;

  return {
    groups: summaries,
    grandMean,
    ssBetween,
    ssWithin,
    ssTotal: ssBetween + ssWithin,
    dfBetween,
    dfWithin,
    msBetween,
    msWithin,
    statistic,
    pValue: fUpperTail(statistic, dfBetween, dfWithin),
    critical: fCritical(alpha, dfBetween, dfWithin),
    etaSquared: ssBetween / (ssBetween + ssWithin),
  };
}
