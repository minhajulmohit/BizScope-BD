export interface EquilibriumResult {
  price: number;
  quantity: number;
  demandQuantity: number;
  supplyQuantity: number;
}

/**
 * Qd = a - bP, Qs = c + dP.
 */
export function linearEquilibrium(
  demandIntercept: number,
  demandSlope: number,
  supplyIntercept: number,
  supplySlope: number,
): EquilibriumResult {
  const denominator = demandSlope + supplySlope;
  if (denominator === 0) {
    throw new Error("The demand and supply slopes cannot cancel each other.");
  }
  const price = (demandIntercept - supplyIntercept) / denominator;
  const quantity = demandIntercept - demandSlope * price;
  return {
    price,
    quantity,
    demandQuantity: quantity,
    supplyQuantity: supplyIntercept + supplySlope * price,
  };
}

export interface ElasticityResult {
  point: number;
  arc: number;
  slope: number;
  classification: "elastic" | "inelastic" | "unit" | "perfectly-elastic" | "perfectly-inelastic";
}

/**
 * Point elasticity uses the slope implied by the two observations:
 * Ed = (dQ/dP) * (P1/Q1). Arc elasticity is the midpoint formula.
 */
export function elasticity(
  x1: number,
  q1: number,
  x2: number,
  q2: number,
): ElasticityResult {
  const deltaX = x2 - x1;
  const deltaQ = q2 - q1;
  const slope = deltaX === 0 ? Infinity : deltaQ / deltaX;
  const point = slope * (x1 / q1);
  const averageX = (x1 + x2) / 2;
  const averageQ = (q1 + q2) / 2;
  const arc =
    averageX === 0 || averageQ === 0
      ? Number.NaN
      : ((q2 - q1) / averageQ) / ((x2 - x1) / averageX);

  let classification: ElasticityResult["classification"];
  const magnitude = Math.abs(arc);
  if (magnitude === 0) classification = "perfectly-inelastic";
  else if (!Number.isFinite(magnitude)) classification = "perfectly-elastic";
  else if (magnitude > 1) classification = "elastic";
  else if (magnitude < 1) classification = "inelastic";
  else classification = "unit";

  return { point, arc, slope, classification };
}

export interface SurplusResult {
  price: number;
  quantity: number;
  consumerSurplus: number;
  producerSurplus: number;
  totalSurplus: number;
}

/**
 * Demand P = a - bQ, supply P = c + dQ.
 */
export function marketSurplus(
  demandIntercept: number,
  demandSlope: number,
  supplyIntercept: number,
  supplySlope: number,
): SurplusResult {
  const denominator = demandSlope + supplySlope;
  if (denominator === 0) {
    throw new Error("The demand and supply slopes cannot cancel each other.");
  }
  const quantity = (demandIntercept - supplyIntercept) / denominator;
  const price = demandIntercept - demandSlope * quantity;
  const consumerSurplus = 0.5 * (demandIntercept - price) * quantity;
  const producerSurplus = 0.5 * (price - supplyIntercept) * quantity;
  return {
    price,
    quantity,
    consumerSurplus,
    producerSurplus,
    totalSurplus: consumerSurplus + producerSurplus,
  };
}

export interface CostRow {
  quantity: number;
  totalCost: number;
  averageCost: number | null;
  marginalCost: number | null;
}

export interface CostAnalysisResult {
  rows: CostRow[];
  fixedCost: number | null;
  minimumAverageCost: number | null;
}

export function costAnalysis(
  observations: { quantity: number; totalCost: number }[],
): CostAnalysisResult {
  const ordered = [...observations].sort((a, b) => a.quantity - b.quantity);
  const zeroRow = ordered.find((row) => row.quantity === 0);
  const fixedCost = zeroRow ? zeroRow.totalCost : null;

  const rows: CostRow[] = ordered.map((row, index) => {
    let marginalCost: number | null = null;
    if (index > 0) {
      const previous = ordered[index - 1];
      const deltaQuantity = row.quantity - previous.quantity;
      if (deltaQuantity !== 0) {
        marginalCost = (row.totalCost - previous.totalCost) / deltaQuantity;
      }
    }
    return {
      quantity: row.quantity,
      totalCost: row.totalCost,
      averageCost: row.quantity === 0 ? null : row.totalCost / row.quantity,
      marginalCost,
    };
  });

  const averages = rows
    .map((row) => row.averageCost)
    .filter((value): value is number => value !== null);

  return {
    rows,
    fixedCost,
    minimumAverageCost: averages.length === 0 ? null : Math.min(...averages),
  };
}

export interface BreakEvenResult {
  contributionMargin: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  marginOfSafetyUnits: number | null;
  marginOfSafetyPercent: number | null;
  targetProfitUnits: number | null;
}

export function breakEven(
  fixedCost: number,
  price: number,
  variableCost: number,
  expectedUnits: number | null,
  targetProfit: number | null,
): BreakEvenResult {
  const contributionMargin = price - variableCost;
  if (contributionMargin <= 0) {
    throw new Error(
      "Price must be greater than variable cost for a break-even point to exist.",
    );
  }
  const breakEvenUnits = fixedCost / contributionMargin;
  return {
    contributionMargin,
    breakEvenUnits,
    breakEvenRevenue: breakEvenUnits * price,
    marginOfSafetyUnits:
      expectedUnits === null ? null : expectedUnits - breakEvenUnits,
    marginOfSafetyPercent:
      expectedUnits === null || expectedUnits === 0
        ? null
        : (expectedUnits - breakEvenUnits) / expectedUnits,
    targetProfitUnits:
      targetProfit === null ? null : (fixedCost + targetProfit) / contributionMargin,
  };
}

export interface MonopolyResult {
  quantity: number;
  price: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
}

/**
 * Linear demand P = a - bQ, constant marginal cost and fixed cost.
 */
export function monopolyProfit(
  intercept: number,
  slope: number,
  fixedCost: number,
  marginalCost: number,
): MonopolyResult {
  if (slope <= 0) {
    throw new Error("The demand slope must be positive in P = a - bQ.");
  }
  const quantity = (intercept - marginalCost) / (2 * slope);
  const price = intercept - slope * quantity;
  const totalRevenue = price * quantity;
  const totalCost = fixedCost + marginalCost * quantity;
  return {
    quantity,
    price,
    totalRevenue,
    totalCost,
    profit: totalRevenue - totalCost,
  };
}
