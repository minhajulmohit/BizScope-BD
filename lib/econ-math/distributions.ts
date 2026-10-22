/**
 * Small, self-contained distribution toolkit used by the Econ Math page.
 * Implementations follow the classic series / continued-fraction forms from
 * Numerical Recipes and are checked against R and SciPy reference values in
 * docs/econ-math-verification.md.
 */

const EPS = 3e-12;
const FPMIN = 1e-300;

export function logGamma(x: number): number {
  const coefficients = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let sum = 1.000000000190015;
  for (const coefficient of coefficients) {
    y += 1;
    sum += coefficient / y;
  }
  return -tmp + Math.log((2.5066282746310005 * sum) / x);
}

function gammaSeries(a: number, x: number): number {
  let sum = 1 / a;
  let term = sum;
  let ap = a;
  for (let n = 1; n <= 500; n += 1) {
    ap += 1;
    term *= x / ap;
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * EPS) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

function gammaContinuedFraction(a: number, x: number): number {
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 500; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

/** Regularised lower incomplete gamma function P(a, x). */
export function gammaP(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x < a + 1) return gammaSeries(a, x);
  return 1 - gammaContinuedFraction(a, x);
}

/** Regularised upper incomplete gamma function Q(a, x). */
export function gammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  if (x < a + 1) return 1 - gammaSeries(a, x);
  return gammaContinuedFraction(a, x);
}

function betaContinuedFraction(a: number, b: number, x: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= 500; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }

  return h;
}

/** Regularised incomplete beta function I_x(a, b). */
export function betaI(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (front * betaContinuedFraction(a, b, x)) / a;
  }
  return 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b;
}

function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + z / 2);
  const result =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t *
                                  (1.48851587 +
                                    t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? result : 2 - result;
}

export function normalPdf(z: number): number {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

export function normalCdf(z: number): number {
  return 0.5 * erfc(-z / Math.SQRT2);
}

export function normalUpperTail(z: number): number {
  return 0.5 * erfc(z / Math.SQRT2);
}

/** Quantile of the standard normal distribution, via bisection. */
export function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  let low = -10;
  let high = 10;
  while (normalCdf(low) > p) low -= 10;
  while (normalCdf(high) < p) high += 10;
  for (let i = 0; i < 200; i += 1) {
    const middle = (low + high) / 2;
    if (normalCdf(middle) < p) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function studentTPdf(value: number, df: number): number {
  return (
    Math.exp(
      logGamma((df + 1) / 2) -
        logGamma(df / 2) -
        0.5 * Math.log(df * Math.PI),
    ) * Math.pow(1 + (value * value) / df, -(df + 1) / 2)
  );
}

export function studentTCdf(value: number, df: number): number {
  const x = df / (df + value * value);
  const tail = 0.5 * betaI(df / 2, 0.5, x);
  return value >= 0 ? 1 - tail : tail;
}

export function studentTTwoTailedP(value: number, df: number): number {
  return betaI(df / 2, 0.5, df / (df + value * value));
}

export function studentTUpperTail(value: number, df: number): number {
  return value >= 0
    ? 0.5 * betaI(df / 2, 0.5, df / (df + value * value))
    : 1 - 0.5 * betaI(df / 2, 0.5, df / (df + value * value));
}

export function studentTQuantile(p: number, df: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  let low = -1e6;
  let high = 1e6;
  for (let i = 0; i < 200; i += 1) {
    const middle = (low + high) / 2;
    if (studentTCdf(middle, df) < p) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function chiSquarePdf(value: number, df: number): number {
  if (value < 0) return 0;
  if (value === 0) {
    return df === 2 ? 0.5 : df < 2 ? Infinity : 0;
  }
  return Math.exp(
    (df / 2 - 1) * Math.log(value) -
      value / 2 -
      (df / 2) * Math.log(2) -
      logGamma(df / 2),
  );
}

export function chiSquareCdf(value: number, df: number): number {
  return gammaP(df / 2, value / 2);
}

export function chiSquareUpperTail(value: number, df: number): number {
  return gammaQ(df / 2, value / 2);
}

export function chiSquareQuantile(p: number, df: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  let low = 0;
  let high = Math.max(10, df * 4);
  while (chiSquareCdf(high, df) < p) high *= 2;
  for (let i = 0; i < 200; i += 1) {
    const middle = (low + high) / 2;
    if (chiSquareCdf(middle, df) < p) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function fPdf(value: number, df1: number, df2: number): number {
  if (value <= 0) return 0;
  return Math.exp(
    (df1 / 2) * Math.log(df1 / df2) +
      (df1 / 2 - 1) * Math.log(value) -
      ((df1 + df2) / 2) * Math.log(1 + (df1 * value) / df2) -
      (logGamma(df1 / 2) + logGamma(df2 / 2) - logGamma((df1 + df2) / 2)),
  );
}

export function fCdf(value: number, df1: number, df2: number): number {
  if (value <= 0) return 0;
  return betaI(df1 / 2, df2 / 2, (df1 * value) / (df1 * value + df2));
}

export function fUpperTail(value: number, df1: number, df2: number): number {
  if (value <= 0) return 1;
  return betaI(df2 / 2, df1 / 2, df2 / (df2 + df1 * value));
}

export function fQuantile(p: number, df1: number, df2: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  let low = 0;
  let high = 10;
  while (fCdf(high, df1, df2) < p) high *= 2;
  for (let i = 0; i < 200; i += 1) {
    const middle = (low + high) / 2;
    if (fCdf(middle, df1, df2) < p) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function zCritical(alpha: number, tails: 1 | 2): number {
  return normalQuantile(1 - alpha / tails);
}

export function tCritical(alpha: number, df: number, tails: 1 | 2): number {
  return studentTQuantile(1 - alpha / tails, df);
}

export function chiSquareCritical(alpha: number, df: number): number {
  return chiSquareQuantile(1 - alpha, df);
}

export function fCritical(alpha: number, df1: number, df2: number): number {
  return fQuantile(1 - alpha, df1, df2);
}
