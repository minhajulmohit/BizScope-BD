import { mean, ranks } from "@/lib/econ-math/descriptive";
import {
  studentTQuantile,
  studentTTwoTailedP,
  zCritical,
} from "@/lib/econ-math/distributions";

function validPairs(x: number[], y: number[]): { x: number[]; y: number[] } {
  if (x.length !== y.length) {
    throw new Error("Correlation inputs must have the same length.");
  }
  if (x.length < 3) {
    throw new Error("At least three complete pairs are required.");
  }
  return { x, y };
}

export interface CorrelationResult {
  n: number;
  r: number;
  rSquared: number;
  statistic: number;
  df: number;
  pValue: number;
  confidenceInterval: [number, number];
}

export function pearson(xInput: number[], yInput: number[]): CorrelationResult {
  const { x, y } = validPairs(xInput, yInput);
  const meanX = mean(x);
  const meanY = mean(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let index = 0; index < x.length; index += 1) {
    const dx = x[index] - meanX;
    const dy = y[index] - meanY;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  const r = sxy / Math.sqrt(sxx * syy);
  const df = x.length - 2;
  const statistic = r * Math.sqrt(df / Math.max(1e-15, 1 - r * r));
  const fisher = Math.atanh(Math.max(-0.999999, Math.min(0.999999, r)));
  const standardError = 1 / Math.sqrt(x.length - 3);
  const critical = zCritical(0.05, 2);
  return {
    n: x.length,
    r,
    rSquared: r * r,
    statistic,
    df,
    pValue: studentTTwoTailedP(statistic, df),
    confidenceInterval: [
      Math.tanh(fisher - critical * standardError),
      Math.tanh(fisher + critical * standardError),
    ],
  };
}

export interface OlsResult {
  n: number;
  slope: number;
  intercept: number;
  r: number;
  rSquared: number;
  standardErrorSlope: number;
  statistic: number;
  df: number;
  pValue: number;
  standardErrorEstimate: number;
  sxx: number;
  meanX: number;
  meanY: number;
  critical: number;
  slopeInterval: [number, number];
}

export function simpleOls(x: number[], y: number[]): OlsResult {
  validPairs(x, y);
  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let index = 0; index < n; index += 1) {
    const dx = x[index] - meanX;
    const dy = y[index] - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const fitted = x.map((value) => intercept + slope * value);
  const sse = y.reduce(
    (running, value, index) => running + (value - fitted[index]) ** 2,
    0,
  );
  const df = n - 2;
  const standardErrorEstimate = Math.sqrt(sse / df);
  const standardErrorSlope = standardErrorEstimate / Math.sqrt(sxx);
  const statistic = slope / standardErrorSlope;
  const critical = studentTQuantile(0.975, df);
  const r = sxy / Math.sqrt(sxx * syy);

  return {
    n,
    slope,
    intercept,
    r,
    rSquared: r * r,
    standardErrorSlope,
    statistic,
    df,
    pValue: studentTTwoTailedP(statistic, df),
    standardErrorEstimate,
    sxx,
    meanX,
    meanY,
    critical,
    slopeInterval: [
      slope - critical * standardErrorSlope,
      slope + critical * standardErrorSlope,
    ],
  };
}

export function spearman(x: number[], y: number[]): CorrelationResult {
  const ranked = pearson(ranks(x), ranks(y));
  return ranked;
}
