export interface CompoundInterestResult {
  principal: number;
  annualRate: number;
  years: number;
  periodsPerYear: number;
  simpleInterest: number;
  simpleFutureValue: number;
  compoundFutureValue: number;
  compoundInterest: number;
  effectiveAnnualRate: number;
}

export function compoundInterest(
  principal: number,
  annualRate: number,
  years: number,
  periodsPerYear: number,
): CompoundInterestResult {
  if (principal < 0) throw new Error("The principal cannot be negative.");
  if (years < 0) throw new Error("The time period cannot be negative.");
  const simpleFutureValue = principal * (1 + annualRate * years);
  const compoundFutureValue =
    periodsPerYear === 0
      ? principal * Math.exp(annualRate * years)
      : principal * Math.pow(1 + annualRate / periodsPerYear, periodsPerYear * years);
  const effectiveAnnualRate =
    periodsPerYear === 0
      ? Math.exp(annualRate) - 1
      : Math.pow(1 + annualRate / periodsPerYear, periodsPerYear) - 1;
  return {
    principal,
    annualRate,
    years,
    periodsPerYear,
    simpleInterest: simpleFutureValue - principal,
    simpleFutureValue,
    compoundFutureValue,
    compoundInterest: compoundFutureValue - principal,
    effectiveAnnualRate,
  };
}

export interface EffectiveRateResult {
  nominalRate: number;
  periodsPerYear: number;
  effectiveAnnualRate: number;
}

export function effectiveAnnualRate(
  nominalRate: number,
  periodsPerYear: number,
): EffectiveRateResult {
  return {
    nominalRate,
    periodsPerYear,
    effectiveAnnualRate:
      periodsPerYear === 0
        ? Math.exp(nominalRate) - 1
        : Math.pow(1 + nominalRate / periodsPerYear, periodsPerYear) - 1,
  };
}

export interface LumpSumResult {
  presentValue: number;
  futureValue: number;
  rate: number;
  years: number;
  solved: "future" | "present";
}

export function solveLumpSum(
  presentValue: number | null,
  futureValue: number | null,
  rate: number,
  years: number,
): LumpSumResult {
  if (years < 0) throw new Error("The number of years cannot be negative.");
  if (rate <= -1) throw new Error("The interest rate must be greater than -100%.");
  if (presentValue !== null && futureValue === null) {
    return {
      presentValue,
      futureValue: presentValue * Math.pow(1 + rate, years),
      rate,
      years,
      solved: "future",
    };
  }
  if (presentValue === null && futureValue !== null) {
    return {
      presentValue: futureValue / Math.pow(1 + rate, years),
      futureValue,
      rate,
      years,
      solved: "present",
    };
  }
  throw new Error("Enter either the present value or the future value, not both.");
}

export interface AnnuityResult {
  payment: number;
  rate: number;
  periods: number;
  futureValue: number;
  presentValue: number;
  totalPayments: number;
  due: boolean;
}

export function annuity(
  payment: number,
  rate: number,
  periods: number,
  due: boolean,
): AnnuityResult {
  if (periods <= 0) throw new Error("The number of periods must be positive.");
  const factor = due ? 1 + rate : 1;
  const futureValue =
    rate === 0
      ? payment * periods
      : payment * ((Math.pow(1 + rate, periods) - 1) / rate) * factor;
  const presentValue =
    rate === 0
      ? payment * periods
      : payment * ((1 - Math.pow(1 + rate, -periods)) / rate) * factor;
  return {
    payment,
    rate,
    periods,
    futureValue,
    presentValue,
    totalPayments: payment * periods,
    due,
  };
}

function npvAt(rate: number, cashFlows: number[]): number {
  return cashFlows.reduce(
    (running, cashFlow, index) =>
      running + cashFlow / Math.pow(1 + rate, index),
    0,
  );
}

export interface NpvResult {
  rate: number;
  npv: number;
  presentValueInflows: number;
  presentValueOutflows: number;
  profitabilityIndex: number | null;
}

export function netPresentValue(
  rate: number,
  cashFlows: number[],
): NpvResult {
  if (rate <= -1) throw new Error("The discount rate must be greater than -100%.");
  const npv = npvAt(rate, cashFlows);
  const presentValueInflows = cashFlows.reduce(
    (running, cashFlow, index) =>
      cashFlow > 0
        ? running + cashFlow / Math.pow(1 + rate, index)
        : running,
    0,
  );
  const presentValueOutflows = cashFlows.reduce(
    (running, cashFlow, index) =>
      cashFlow < 0
        ? running + cashFlow / Math.pow(1 + rate, index)
        : running,
    0,
  );
  return {
    rate,
    npv,
    presentValueInflows,
    presentValueOutflows,
    profitabilityIndex:
      presentValueOutflows === 0
        ? null
        : presentValueInflows / Math.abs(presentValueOutflows),
  };
}

export interface IrrResult {
  irr: number | null;
  multipleSignChanges: boolean;
  npvAtIrr: number | null;
}

export function internalRateOfReturn(cashFlows: number[]): IrrResult {
  let signChanges = 0;
  for (let index = 1; index < cashFlows.length; index += 1) {
    if (
      (cashFlows[index - 1] > 0 && cashFlows[index] < 0) ||
      (cashFlows[index - 1] < 0 && cashFlows[index] > 0)
    ) {
      signChanges += 1;
    }
  }

  const candidates: number[] = [];
  for (let rate = -0.9999; rate <= 10; rate += 0.01) {
    candidates.push(rate);
  }

  let previousRate = candidates[0];
  let previousValue = npvAt(previousRate, cashFlows);

  for (let index = 1; index < candidates.length; index += 1) {
    const currentRate = candidates[index];
    const currentValue = npvAt(currentRate, cashFlows);
    if (previousValue === 0) {
      return {
        irr: previousRate,
        multipleSignChanges: signChanges > 1,
        npvAtIrr: 0,
      };
    }
    if (previousValue * currentValue < 0) {
      let low = previousRate;
      let high = currentRate;
      for (let iteration = 0; iteration < 200; iteration += 1) {
        const middle = (low + high) / 2;
        const middleValue = npvAt(middle, cashFlows);
        if (previousValue * middleValue <= 0) high = middle;
        else low = middle;
      }
      const root = (low + high) / 2;
      return {
        irr: root,
        multipleSignChanges: signChanges > 1,
        npvAtIrr: npvAt(root, cashFlows),
      };
    }
    previousRate = currentRate;
    previousValue = currentValue;
  }

  return {
    irr: null,
    multipleSignChanges: signChanges > 1,
    npvAtIrr: null,
  };
}

export interface PaybackYear {
  period: number;
  cashFlow: number;
  cumulative: number;
  discounted: number;
  discountedCumulative: number;
}

export interface PaybackResult {
  rows: PaybackYear[];
  payback: number | null;
  discountedPayback: number | null;
  totalUndiscounted: number;
  totalDiscounted: number;
}

function firstRecovery(rows: PaybackYear[], key: "cumulative" | "discountedCumulative"): number | null {
  for (let index = 0; index < rows.length; index += 1) {
    const value = rows[index][key];
    if (value >= 0) {
      if (index === 0) return 0;
      const previous = rows[index - 1][key];
      const flowAtPeriod =
        key === "cumulative"
          ? rows[index].cashFlow
          : rows[index].discounted;
      if (flowAtPeriod <= 0) return rows[index].period;
      return rows[index].period - 1 + Math.abs(previous) / flowAtPeriod;
    }
  }
  return null;
}

export function paybackPeriod(
  rate: number,
  cashFlows: number[],
): PaybackResult {
  let cumulative = 0;
  let discountedCumulative = 0;
  const rows = cashFlows.map((cashFlow, period) => {
    const discounted = cashFlow / Math.pow(1 + rate, period);
    cumulative += cashFlow;
    discountedCumulative += discounted;
    return {
      period,
      cashFlow,
      cumulative,
      discounted,
      discountedCumulative,
    };
  });

  return {
    rows,
    payback: firstRecovery(rows, "cumulative"),
    discountedPayback: firstRecovery(rows, "discountedCumulative"),
    totalUndiscounted: cumulative,
    totalDiscounted: discountedCumulative,
  };
}

export interface LoanPayment {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface LoanResult {
  principal: number;
  annualRate: number;
  months: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: LoanPayment[];
}

export function loanEmi(
  principal: number,
  annualRate: number,
  months: number,
): LoanResult {
  if (principal <= 0) throw new Error("The loan amount must be positive.");
  if (months <= 0) throw new Error("The loan term must be positive.");
  const monthlyRate = annualRate / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  const schedule: LoanPayment[] = [];
  let balance = principal;
  for (let period = 1; period <= months; period += 1) {
    const interest = balance * monthlyRate;
    const principalPart = monthlyPayment - interest;
    balance = Math.max(0, balance - principalPart);
    schedule.push({
      period,
      payment: monthlyPayment,
      interest,
      principal: principalPart,
      balance,
    });
  }

  return {
    principal,
    annualRate,
    months,
    monthlyPayment,
    totalPayment: monthlyPayment * months,
    totalInterest: monthlyPayment * months - principal,
    schedule,
  };
}

export interface DepreciationRow {
  year: number;
  depreciation: number;
  accumulated: number;
  bookValue: number;
}

export interface DepreciationResult {
  annualDepreciation: number;
  schedule: DepreciationRow[];
  totalDepreciation: number;
}

export function straightLineDepreciation(
  cost: number,
  salvage: number,
  life: number,
): DepreciationResult {
  if (life <= 0) throw new Error("The useful life must be positive.");
  if (salvage > cost) throw new Error("Salvage value cannot exceed the asset cost.");
  const annualDepreciation = (cost - salvage) / life;
  const schedule: DepreciationRow[] = [];
  let accumulated = 0;
  for (let year = 1; year <= life; year += 1) {
    accumulated += annualDepreciation;
    schedule.push({
      year,
      depreciation: annualDepreciation,
      accumulated,
      bookValue: cost - accumulated,
    });
  }
  return {
    annualDepreciation,
    schedule,
    totalDepreciation: cost - salvage,
  };
}
