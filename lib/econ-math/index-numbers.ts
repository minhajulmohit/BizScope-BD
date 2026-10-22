export interface PriceIndexItem {
  name: string;
  price0: number;
  quantity0: number;
  price1: number;
  quantity1: number;
}

export interface PriceIndexResult {
  laspeyres: number;
  paasche: number;
  fisher: number;
  baseValue: number;
  currentValue: number;
  basketCostBaseWeights: number;
  basketCostCurrentWeights: number;
}

export function priceIndices(items: PriceIndexItem[]): PriceIndexResult {
  const baseValue = items.reduce(
    (running, item) => running + item.price0 * item.quantity0,
    0,
  );
  const laspeyresNumerator = items.reduce(
    (running, item) => running + item.price1 * item.quantity0,
    0,
  );
  const paascheDenominator = items.reduce(
    (running, item) => running + item.price0 * item.quantity1,
    0,
  );
  const currentValue = items.reduce(
    (running, item) => running + item.price1 * item.quantity1,
    0,
  );

  if (baseValue === 0 || paascheDenominator === 0) {
    throw new Error("Base-period values must be greater than zero.");
  }

  const laspeyres = (laspeyresNumerator / baseValue) * 100;
  const paasche = (currentValue / paascheDenominator) * 100;
  return {
    laspeyres,
    paasche,
    fisher: Math.sqrt(laspeyres * paasche),
    baseValue,
    currentValue,
    basketCostBaseWeights: laspeyresNumerator,
    basketCostCurrentWeights: paascheDenominator,
  };
}
