export interface GdpExpenditureResult {
  consumption: number;
  investment: number;
  government: number;
  exports: number;
  imports: number;
  netExports: number;
  gdp: number;
}

export function gdpExpenditure(
  consumption: number,
  investment: number,
  government: number,
  exports: number,
  imports: number,
): GdpExpenditureResult {
  const netExports = exports - imports;
  return {
    consumption,
    investment,
    government,
    exports,
    imports,
    netExports,
    gdp: consumption + investment + government + netExports,
  };
}

export interface DeflatorResult {
  nominal: number;
  real: number;
  deflator: number;
  solved: "deflator" | "real" | "nominal";
}

export function solveDeflator(
  nominal: number | null,
  real: number | null,
  deflator: number | null,
): DeflatorResult {
  const supplied = [nominal, real, deflator].filter(
    (value): value is number => value !== null,
  ).length;

  if (supplied < 2) {
    throw new Error(
      "Enter at least two of nominal GDP, real GDP, and the GDP deflator.",
    );
  }

  if (nominal !== null && real !== null) {
    if (real === 0) throw new Error("Real GDP cannot be zero.");
    return {
      nominal,
      real,
      deflator: (nominal / real) * 100,
      solved: "deflator",
    };
  }

  if (nominal !== null && deflator !== null) {
    if (deflator === 0) throw new Error("The GDP deflator cannot be zero.");
    return {
      nominal,
      real: nominal / (deflator / 100),
      deflator,
      solved: "real",
    };
  }

  if (real !== null && deflator !== null) {
    return {
      nominal: real * (deflator / 100),
      real,
      deflator,
      solved: "nominal",
    };
  }

  throw new Error("Enter at least two of nominal GDP, real GDP, and the GDP deflator.");
}

export interface CpiRow {
  period: string;
  cpi: number;
  inflation: number | null;
}

export interface CpiResult {
  rows: CpiRow[];
  totalInflation: number;
  averageInflation: number;
}

export function cpiInflation(
  observations: { period: string; cpi: number }[],
): CpiResult {
  const rows: CpiRow[] = observations.map((row, index) => {
    if (index === 0) return { ...row, inflation: null };
    const previous = observations[index - 1].cpi;
    return {
      ...row,
      inflation: previous === 0 ? null : row.cpi / previous - 1,
    };
  });

  const first = observations[0].cpi;
  const last = observations[observations.length - 1].cpi;
  const periods = observations.length - 1;
  const totalInflation = first === 0 ? Number.NaN : last / first - 1;
  const averageInflation =
    first > 0 && last > 0 && periods > 0
      ? Math.pow(last / first, 1 / periods) - 1
      : Number.NaN;

  return { rows, totalInflation, averageInflation };
}

export interface GrowthResult {
  totalGrowth: number;
  cagr: number;
  doublingTime: number | null;
}

export function growthRate(
  beginning: number,
  ending: number,
  years: number,
): GrowthResult {
  if (beginning === 0) throw new Error("The beginning value cannot be zero.");
  if (years <= 0) throw new Error("The number of years must be positive.");
  const totalGrowth = ending / beginning - 1;
  const cagr = Math.pow(ending / beginning, 1 / years) - 1;
  return {
    totalGrowth,
    cagr,
    doublingTime: cagr > 0 ? Math.log(2) / Math.log(1 + cagr) : null,
  };
}

export interface GdpPerCapitaResult {
  gdpPerCapita: number;
  gdp: number;
  population: number;
}

export function gdpPerCapita(
  gdp: number,
  population: number,
): GdpPerCapitaResult {
  if (population <= 0) throw new Error("Population must be positive.");
  return { gdpPerCapita: gdp / population, gdp, population };
}

export interface UnemploymentResult {
  laborForce: number;
  unemployed: number;
  employed: number;
  unemploymentRate: number;
  employmentRate: number;
}

export function unemploymentRate(
  laborForce: number,
  unemployed: number,
): UnemploymentResult {
  if (laborForce <= 0) throw new Error("The labour force must be positive.");
  if (unemployed < 0 || unemployed > laborForce) {
    throw new Error("Unemployed workers must be between zero and the labour force.");
  }
  const employed = laborForce - unemployed;
  return {
    laborForce,
    unemployed,
    employed,
    unemploymentRate: unemployed / laborForce,
    employmentRate: employed / laborForce,
  };
}

export interface MoneyMultiplierResult {
  multiplier: number;
  moneySupply: number | null;
  createdMoney: number | null;
}

export function moneyMultiplier(
  reserveRatio: number,
  reserves: number | null,
): MoneyMultiplierResult {
  if (reserveRatio <= 0 || reserveRatio > 1) {
    throw new Error("The reserve ratio must be between 0 and 1.");
  }
  const multiplier = 1 / reserveRatio;
  return {
    multiplier,
    moneySupply: reserves === null ? null : reserves * multiplier,
    createdMoney:
      reserves === null ? null : reserves * multiplier - reserves,
  };
}

export interface ExpenditureMultiplierResult {
  simpleMultiplier: number;
  multiplierWithTax: number | null;
  changeInIncome: number | null;
  changeWithTax: number | null;
}

export function expenditureMultiplier(
  marginalPropensityToConsume: number,
  taxRate: number | null,
  changeInSpending: number | null,
): ExpenditureMultiplierResult {
  if (marginalPropensityToConsume <= 0 || marginalPropensityToConsume >= 1) {
    throw new Error("The marginal propensity to consume must be between 0 and 1.");
  }
  const simpleMultiplier = 1 / (1 - marginalPropensityToConsume);
  const multiplierWithTax =
    taxRate === null
      ? null
      : 1 / (1 - marginalPropensityToConsume * (1 - taxRate));
  return {
    simpleMultiplier,
    multiplierWithTax,
    changeInIncome:
      changeInSpending === null ? null : simpleMultiplier * changeInSpending,
    changeWithTax:
      changeInSpending === null || multiplierWithTax === null
        ? null
        : multiplierWithTax * changeInSpending,
  };
}

export interface FisherResult {
  exactRealRate: number;
  approximateRealRate: number;
  nominalRate: number;
  inflationRate: number;
}

export function fisherEquation(
  nominalRate: number,
  inflationRate: number,
): FisherResult {
  if (inflationRate === -1) {
    throw new Error("The inflation rate cannot be exactly -100%.");
  }
  return {
    exactRealRate: (1 + nominalRate) / (1 + inflationRate) - 1,
    approximateRealRate: nominalRate - inflationRate,
    nominalRate,
    inflationRate,
  };
}
