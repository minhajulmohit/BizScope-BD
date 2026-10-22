import {
  formatNumber,
  isBlank,
  numberField,
  parseCell,
} from "@/lib/econ-math/io";
import {
  costAnalysis,
  elasticity,
  linearEquilibrium,
  marketSurplus,
  monopolyProfit,
} from "@/lib/econ-math/micro";
import {
  CalcInputError,
  t,
  type CalculatorDef,
  type CalculatorResult,
  type Metric,
} from "@/lib/econ-math/types";

function elasticityClassification(
  value: number,
  kind: "price" | "income" | "cross",
): { en: string; bn: string } {
  if (!Number.isFinite(value)) {
    return t("Perfectly elastic", "পূর্ণ স্থিতিস্থাপক");
  }
  if (value === 0) {
    if (kind === "income") return t("No income effect", "আয়ের কোনো প্রভাব নেই");
    if (kind === "cross") return t("Unrelated goods", "অসম্পর্কিত পণ্য");
    return t("Perfectly inelastic", "পূর্ণ অস্থিতিস্থাপক");
  }
  if (kind === "price") {
    const magnitude = Math.abs(value);
    if (magnitude > 1) return t("Elastic demand", "স্থিতিস্থাপক চাহিদা");
    if (magnitude < 1) return t("Inelastic demand", "অস্থিতিস্থাপক চাহিদা");
    return t("Unit elastic demand", "একক স্থিতিস্থাপক চাহিদা");
  }
  if (kind === "income") {
    if (value < 0) return t("Inferior good", "নিম্নমানের পণ্য");
    if (value < 1) return t("Normal necessity", "স্বাভাবিক প্রয়োজনীয় পণ্য");
    return t("Normal luxury good", "স্বাভাবিক বিলাসী পণ্য");
  }
  if (value > 0) return t("Substitute goods", "বিকল্প পণ্য");
  return t("Complementary goods", "পরিপূরক পণ্য");
}

function elasticityMetrics(
  point: number,
  arc: number,
  classification: { en: string; bn: string },
): Metric[] {
  return [
    { label: t("Point elasticity", "বিন্দু স্থিতিস্থাপকতা"), value: formatNumber(point, 4) },
    { label: t("Arc elasticity (midpoint)", "চাপ স্থিতিস্থাপকতা (মধ্যবিন্দু)"), value: formatNumber(arc, 4) },
    {
      label: t("Classification", "শ্রেণিবিন্যাস"),
      value: t(classification.en, classification.bn),
      tone: "brand",
    },
  ];
}

function elasticitySteps(
  kind: "price" | "income" | "cross",
  xName: string,
  xNameBn: string,
  x1: number,
  q1: number,
  x2: number,
  q2: number,
  point: number,
  arc: number,
) {
  return [
    {
      title: t("Point elasticity", "বিন্দু স্থিতিস্থাপকতা"),
      formula: `E = (dQ/d${xName}) \u00d7 (${xName}\u2081/Q\u2081)`,
      substitution: `slope = (${formatNumber(q2, 3)} \u2212 ${formatNumber(q1, 3)}) / (${formatNumber(x2, 3)} \u2212 ${formatNumber(x1, 3)}) = ${formatNumber((q2 - q1) / (x2 - x1), 4)}; E = ${formatNumber(point, 4)}`,
      note: t(
        "The point estimate uses the slope implied by the two observations and the first observation's values.",
        `বিন্দু অনুমান দুই পর্যবেক্ষণ থেকে প্রাপ্ত ঢাল এবং প্রথম পর্যবেক্ষণের মান ব্যবহার করে।`,
      ),
    },
    {
      title: t("Arc elasticity", "চাপ স্থিতিস্থাপকতা"),
      formula: `E = [\u0394Q / ((Q\u2081+Q\u2082)/2)] / [\u0394${xName} / ((${xName}\u2081+${xName}\u2082)/2)]`,
      substitution: `E = ${formatNumber(arc, 4)}`,
      note: t(
        `${xNameBn} changes from ${formatNumber(x1, 3)} to ${formatNumber(x2, 3)} and quantity changes from ${formatNumber(q1, 3)} to ${formatNumber(q2, 3)}.`,
        `${xNameBn} ${formatNumber(x1, 3)} থেকে ${formatNumber(x2, 3)} এবং পরিমাণ ${formatNumber(q1, 3)} থেকে ${formatNumber(q2, 3)} হয়েছে।`,
      ),
    },
  ];
}

const ELASTICITY_FIELDS = (
  xKey: string,
  qKey: string,
  xLabel: string,
  xLabelBn: string,
) => [
  { key: `${xKey}1`, label: t(`${xLabel} 1`, `${xLabelBn} ১`), defaultValue: "100", kind: "number" as const },
  { key: `${qKey}1`, label: t("Quantity 1", "পরিমাণ ১"), defaultValue: "500", kind: "number" as const },
  { key: `${xKey}2`, label: t(`${xLabel} 2`, `${xLabelBn} ২`), defaultValue: "120", kind: "number" as const },
  { key: `${qKey}2`, label: t("Quantity 2", "পরিমাণ ২"), defaultValue: "450", kind: "number" as const },
];

export const microCalculators: CalculatorDef[] = [
  {
    id: "market-equilibrium",
    category: "micro",
    title: t("Market equilibrium", "বাজারের ভারসাম্য"),
    description: t(
      "Solve linear demand Qd = a \u2212 bP and supply Qs = c + dP for equilibrium price and quantity.",
      "রৈখিক চাহিদা Qd = a \u2212 bP ও যোগান Qs = c + dP থেকে ভারসাম্য দাম ও পরিমাণ বের করুন।",
    ),
    whenToUse: t(
      "Use when demand and supply are given as linear equations in quantity form.",
      "চাহিদা ও যোগান পরিমাণ আকারে রৈখিক সমীকরণ হিসেবে দেওয়া থাকলে ব্যবহার করুন।",
    ),
    assumptions: t(
      "Both equations are linear, the demand slope b is positive, the supply slope d is positive, and the equilibrium lies in the positive quadrant.",
      "দুটি সমীকরণই রৈখিক, চাহিদার ঢাল b ধনাত্মক, যোগানের ঢাল d ধনাত্মক এবং ভারসাম্য ধনাত্মক চতুর্ভাগে।",
    ),
    formulaSummary: [
      "Qd = a \u2212 bP",
      "Qs = c + dP",
      "Set Qd = Qs: P* = (a \u2212 c) / (b + d)",
      "Q* = a \u2212 bP*",
    ],
    legend: t(
      "a = demand intercept; b = demand slope; c = supply intercept; d = supply slope; P* = equilibrium price; Q* = equilibrium quantity.",
      "a = চাহিদার ছেদবিন্দু; b = চাহিদার ঢাল; c = যোগানের ছেদবিন্দু; d = যোগানের ঢাল; P* = ভারসাম্য দাম; Q* = ভারসাম্য পরিমাণ।",
    ),
    fields: [
      { key: "a", label: t("Demand intercept (a)", "চাহিদার ছেদবিন্দু (a)"), defaultValue: "100", kind: "number" },
      { key: "b", label: t("Demand slope (b)", "চাহিদার ঢাল (b)"), defaultValue: "2", kind: "number" },
      { key: "c", label: t("Supply intercept (c)", "যোগানের ছেদবিন্দু (c)"), defaultValue: "20", kind: "number" },
      { key: "d", label: t("Supply slope (d)", "যোগানের ঢাল (d)"), defaultValue: "1", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { a: "100", b: "2", c: "20", d: "1" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const a = numberField(input, "a", t("The demand intercept", "চাহিদার ছেদবিন্দু"));
      const b = numberField(input, "b", t("The demand slope", "চাহিদার ঢাল"));
      const c = numberField(input, "c", t("The supply intercept", "যোগানের ছেদবিন্দু"));
      const d = numberField(input, "d", t("The supply slope", "যোগানের ঢাল"));
      if (b <= 0 || d <= 0) {
        throw new CalcInputError(
          t("Demand and supply slopes must be positive.", "চাহিদা ও যোগানের ঢাল ধনাত্মক হতে হবে।"),
        );
      }
      const result = linearEquilibrium(a, b, c, d);
      const warnings = [] as { en: string; bn: string }[];
      if (result.price < 0 || result.quantity < 0) {
        warnings.push(
          t(
            "The intersection lies outside the positive quadrant, so it is not an economically meaningful equilibrium.",
            "ছেদবিন্দু ধনাত্মক চতুর্ভাগের বাইরে, তাই এটি অর্থনৈতিকভাবে অর্থবহ ভারসাম্য নয়।",
          ),
        );
      }

      return {
        metrics: [
          { label: t("Equilibrium price (P*)", "ভারসাম্য দাম (P*)"), value: formatNumber(result.price, 4), tone: "brand" },
          { label: t("Equilibrium quantity (Q*)", "ভারসাম্য পরিমাণ (Q*)"), value: formatNumber(result.quantity, 4), tone: "brand" },
          { label: t("Quantity demanded", "চাহিদার পরিমাণ"), value: formatNumber(result.demandQuantity, 4) },
          { label: t("Quantity supplied", "যোগানের পরিমাণ"), value: formatNumber(result.supplyQuantity, 4) },
        ],
        steps: [
          {
            title: t("Set demand equal to supply", "চাহিদা ও যোগান সমান করুন"),
            formula: "a \u2212 bP = c + dP",
            substitution: `${formatNumber(a, 3)} \u2212 ${formatNumber(b, 3)}P = ${formatNumber(c, 3)} + ${formatNumber(d, 3)}P`,
          },
          {
            title: t("Solve for price", "দামের জন্য সমাধান"),
            formula: "P* = (a \u2212 c) / (b + d)",
            substitution: `P* = (${formatNumber(a, 3)} \u2212 ${formatNumber(c, 3)}) / (${formatNumber(b, 3)} + ${formatNumber(d, 3)}) = ${formatNumber(result.price, 4)}`,
          },
          {
            title: t("Solve for quantity", "পরিমাণের জন্য সমাধান"),
            formula: "Q* = a \u2212 bP*",
            substitution: `Q* = ${formatNumber(a, 3)} \u2212 ${formatNumber(b, 3)} \u00d7 ${formatNumber(result.price, 4)} = ${formatNumber(result.quantity, 4)}`,
          },
        ],
        interpretation: t(
          `The market clears at a price of ${formatNumber(result.price, 3)} and a quantity of ${formatNumber(result.quantity, 3)}. At that price, quantity demanded and supplied are equal.`,
          `বাজার ${formatNumber(result.price, 3)} দামে ও ${formatNumber(result.quantity, 3)} পরিমাণে ভারসাম্যে পৌঁছায়। সেই দামে চাহিদার পরিমাণ ও যোগানের পরিমাণ সমান।`,
        ),
        warnings,
      };
    },
  },
  {
    id: "price-elasticity",
    category: "micro",
    title: t("Price elasticity of demand", "চাহিদার দাম স্থিতিস্থাপকতা"),
    description: t(
      "Point and arc price elasticity from two price-quantity observations.",
      "দুই দাম-পরিমাণ পর্যবেক্ষণ থেকে বিন্দু ও চাপ স্থিতিস্থাপকতা।",
    ),
    whenToUse: t(
      "Use to judge how sensitive quantity demanded is to a price change, such as before changing a product's price.",
      "দাম পরিবর্তনে চাহিদার পরিমাণ কতটা সংবেদনশীল তা বুঝতে ব্যবহার করুন, যেমন পণ্যের দাম বদলানোর আগে।",
    ),
    assumptions: t(
      "Demand is downward-sloping; both observations are on the same demand curve; no other factor changes between the two points.",
      "চাহিদা নিম্নমুখী; দুটি পর্যবেক্ষণ একই চাহিদা রেখার ওপর; দুই বিন্দুর মধ্যে অন্য কোনো কারণ বদলায় না।",
    ),
    formulaSummary: [
      "Point: E = (dQ/dP) \u00d7 (P/Q)",
      "Arc: E = [\u0394Q / ((Q\u2081+Q\u2082)/2)] / [\u0394P / ((P\u2081+P\u2082)/2)]",
      "|E| > 1 elastic ; |E| < 1 inelastic ; |E| = 1 unit elastic",
    ],
    legend: t(
      "Q = quantity; P = price. Elasticity is usually reported as an absolute value for demand.",
      "Q = পরিমাণ; P = দাম। চাহিদার ক্ষেত্রে স্থিতিস্থাপকতা সাধারণত পরম মানে প্রকাশ করা হয়।",
    ),
    fields: ELASTICITY_FIELDS("p", "q", "Price", "দাম"),
    tables: [],
    example: {
      fields: { p1: "100", q1: "500", p2: "120", q2: "450" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const p1 = numberField(input, "p1", t("Price 1", "দাম ১"));
      const q1 = numberField(input, "q1", t("Quantity 1", "পরিমাণ ১"));
      const p2 = numberField(input, "p2", t("Price 2", "দাম ২"));
      const q2 = numberField(input, "q2", t("Quantity 2", "পরিমাণ ২"));
      if (q1 <= 0 || q2 < 0 || p1 <= 0 || p2 <= 0) {
        throw new CalcInputError(
          t("Prices and quantities must be positive.", "দাম ও পরিমাণ ধনাত্মক হতে হবে।"),
        );
      }
      const result = elasticity(p1, q1, p2, q2);
      const classification = elasticityClassification(result.arc, "price");
      return {
        metrics: elasticityMetrics(result.point, result.arc, classification),
        steps: elasticitySteps("price", "P", "দাম", p1, q1, p2, q2, result.point, result.arc),
        interpretation: t(
          `The midpoint (arc) elasticity is ${formatNumber(result.arc, 3)}. A 1% price increase is associated with roughly a ${formatNumber(Math.abs(result.arc), 2)}% ${result.arc < 0 ? "decrease" : "increase"} in quantity demanded. Demand is ${classification.en.toLowerCase()}.`,
          `মধ্যবিন্দু (চাপ) স্থিতিস্থাপকতা ${formatNumber(result.arc, 3)}। দাম ১% বাড়লে চাহিদার পরিমাণ প্রায় ${formatNumber(Math.abs(result.arc), 2)}% ${result.arc < 0 ? "কমে" : "বাড়ে"}। চাহিদা ${classification.bn}।`,
        ),
        warnings:
          q2 === 0
            ? [
                t(
                  "The second quantity is zero, so the point elasticity is not meaningful there.",
                  "দ্বিতীয় পরিমাণ শূন্য, তাই সেখানে বিন্দু স্থিতিস্থাপকতা অর্থবহ নয়।",
                ),
              ]
            : undefined,
      };
    },
  },
  {
    id: "income-elasticity",
    category: "micro",
    title: t("Income elasticity of demand", "চাহিদার আয় স্থিতিস্থাপকতা"),
    description: t(
      "Measure how quantity demanded responds to a change in consumer income.",
      "ভোক্তার আয় পরিবর্তনে চাহিদার পরিমাণ কীভাবে সাড়া দেয় তা মাপুন।",
    ),
    whenToUse: t(
      "Use to classify a product as inferior, a necessity, or a luxury.",
      "পণ্যকে নিম্নমানের, প্রয়োজনীয় বা বিলাসী হিসেবে শ্রেণিবদ্ধ করতে ব্যবহার করুন।",
    ),
    assumptions: t(
      "Income is the only factor changing between the two observations; prices and preferences are held constant.",
      "দুই পর্যবেক্ষণের মধ্যে শুধু আয় বদলায়; দাম ও পছন্দ অপরিবর্তিত।",
    ),
    formulaSummary: [
      "Point: E_I = (dQ/dI) \u00d7 (I/Q)",
      "Arc: E_I = [\u0394Q / ((Q\u2081+Q\u2082)/2)] / [\u0394I / ((I\u2081+I\u2082)/2)]",
      "E_I < 0 inferior ; 0 < E_I < 1 necessity ; E_I > 1 luxury",
    ],
    legend: t(
      "I = income; Q = quantity demanded. The arc formula is the midpoint version.",
      "I = আয়; Q = চাহিদার পরিমাণ। চাপ সূত্রটি মধ্যবিন্দু সংস্করণ।",
    ),
    fields: ELASTICITY_FIELDS("i", "q", "Income", "আয়"),
    tables: [],
    example: {
      fields: { i1: "20000", q1: "100", i2: "25000", q2: "120" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const i1 = numberField(input, "i1", t("Income 1", "আয় ১"));
      const q1 = numberField(input, "q1", t("Quantity 1", "পরিমাণ ১"));
      const i2 = numberField(input, "i2", t("Income 2", "আয় ২"));
      const q2 = numberField(input, "q2", t("Quantity 2", "পরিমাণ ২"));
      if (i1 <= 0 || i2 <= 0 || q1 <= 0 || q2 < 0) {
        throw new CalcInputError(
          t("Incomes and quantities must be positive.", "আয় ও পরিমাণ ধনাত্মক হতে হবে।"),
        );
      }
      const result = elasticity(i1, q1, i2, q2);
      const classification = elasticityClassification(result.arc, "income");
      return {
        metrics: elasticityMetrics(result.point, result.arc, classification),
        steps: elasticitySteps("income", "I", "আয়", i1, q1, i2, q2, result.point, result.arc),
        interpretation: t(
          `The income elasticity is ${formatNumber(result.arc, 3)}, which makes this a ${classification.en.toLowerCase()}. A 1% rise in income is associated with about a ${formatNumber(result.arc, 2)}% change in quantity demanded.`,
          `আয় স্থিতিস্থাপকতা ${formatNumber(result.arc, 3)}, তাই এটি ${classification.bn}। আয় ১% বাড়লে চাহিদার পরিমাণ প্রায় ${formatNumber(result.arc, 2)}% পরিবর্তিত হয়।`,
        ),
      };
    },
  },
  {
    id: "cross-elasticity",
    category: "micro",
    title: t("Cross-price elasticity", "আন্তঃদাম স্থিতিস্থাপকতা"),
    description: t(
      "Measure how demand for one good responds to the price of another good.",
      "একটি পণ্যের দাম পরিবর্তনে অন্য পণ্যের চাহিদা কীভাবে সাড়া দেয় তা মাপুন।",
    ),
    whenToUse: t(
      "Use to identify substitutes and complements, or to estimate the demand effect of a competitor's price change.",
      "বিকল্প ও পরিপূরক পণ্য চিহ্নিত করতে, অথবা প্রতিযোগীর দাম পরিবর্তনের চাহিদা প্রভাব অনুমান করতে ব্যবহার করুন।",
    ),
    assumptions: t(
      "Only the other good's price changes between the two observations; all other prices and income stay constant.",
      "দুই পর্যবেক্ষণের মধ্যে শুধু অন্য পণ্যের দাম বদলায়; অন্যান্য দাম ও আয় অপরিবর্তিত।",
    ),
    formulaSummary: [
      "Point: E_xy = (dQ_y/dP_x) \u00d7 (P_x/Q_y)",
      "Arc: E_xy = [\u0394Q_y / avg(Q_y)] / [\u0394P_x / avg(P_x)]",
      "E_xy > 0 substitutes ; E_xy < 0 complements ; near 0 unrelated",
    ],
    legend: t(
      "P_x = price of the other good; Q_y = quantity demanded of this good.",
      "P_x = অন্য পণ্যের দাম; Q_y = এই পণ্যের চাহিদার পরিমাণ।",
    ),
    fields: ELASTICITY_FIELDS("px", "qy", "Price of related good", "সম্পর্কিত পণ্যের দাম"),
    tables: [],
    example: {
      fields: { px1: "80", qy1: "300", px2: "100", qy2: "330" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const p1 = numberField(input, "px1", t("Price of the related good 1", "সম্পর্কিত পণ্যের দাম ১"));
      const q1 = numberField(input, "qy1", t("Quantity 1", "পরিমাণ ১"));
      const p2 = numberField(input, "px2", t("Price of the related good 2", "সম্পর্কিত পণ্যের দাম ২"));
      const q2 = numberField(input, "qy2", t("Quantity 2", "পরিমাণ ২"));
      if (p1 <= 0 || p2 <= 0 || q1 <= 0 || q2 < 0) {
        throw new CalcInputError(
          t("Prices and quantities must be positive.", "দাম ও পরিমাণ ধনাত্মক হতে হবে।"),
        );
      }
      const result = elasticity(p1, q1, p2, q2);
      const classification = elasticityClassification(result.arc, "cross");
      return {
        metrics: elasticityMetrics(result.point, result.arc, classification),
        steps: elasticitySteps("cross", "P_x", "সম্পর্কিত পণ্যের দাম", p1, q1, p2, q2, result.point, result.arc),
        interpretation: t(
          `The cross-price elasticity is ${formatNumber(result.arc, 3)}. The two goods are ${classification.en.toLowerCase()}: a higher price for the related good is associated with ${result.arc > 0 ? "higher" : result.arc < 0 ? "lower" : "unchanged"} demand for this good.`,
          `আন্তঃদাম স্থিতিস্থাপকতা ${formatNumber(result.arc, 3)}। দুটি পণ্য ${classification.bn}। সম্পর্কিত পণ্যের দাম বাড়লে এই পণ্যের চাহিদা ${result.arc > 0 ? "বাড়ে" : result.arc < 0 ? "কমে" : "অপরিবর্তিত থাকে"}।`,
        ),
      };
    },
  },
  {
    id: "cost-analysis",
    category: "micro",
    title: t("Cost analysis (TC, AC, MC)", "ব্যয় বিশ্লেষণ (TC, AC, MC)"),
    description: t(
      "Turn a table of quantity and total cost into average and marginal cost.",
      "পরিমাণ ও মোট ব্যয়ের টেবিল থেকে গড় ও প্রান্তিক ব্যয় বের করুন।",
    ),
    whenToUse: t(
      "Use with cost data from a production run or a textbook cost schedule.",
      "উৎপাদন কার্যক্রম বা পাঠ্যবইয়ের ব্যয় সূচি থেকে পাওয়া ব্যয় ডেটার সঙ্গে ব্যবহার করুন।",
    ),
    assumptions: t(
      "Quantities are increasing and total cost is measured in the same currency. Marginal cost between rows is \u0394TC/\u0394Q; fixed cost is read from the Q = 0 row if present.",
      "পরিমাণ বৃদ্ধিশীল এবং মোট ব্যয় একই মুদ্রায় মাপা। সারির মধ্যে প্রান্তিক ব্যয় \u0394TC/\u0394Q; Q = 0 সারি থাকলে সেখান থেকে স্থির ব্যয় নেওয়া হয়।",
    ),
    formulaSummary: [
      "AC = TC / Q",
      "MC = \u0394TC / \u0394Q (between consecutive rows)",
      "Fixed cost = TC when Q = 0",
    ],
    legend: t(
      "TC = total cost; AC = average cost; MC = marginal cost; Q = quantity.",
      "TC = মোট ব্যয়; AC = গড় ব্যয়; MC = প্রান্তিক ব্যয়; Q = পরিমাণ।",
    ),
    fields: [],
    tables: [
      {
        key: "data",
        label: t("Cost schedule", "ব্যয় সূচি"),
        columns: [
          { key: "q", label: t("Quantity (Q)", "পরিমাণ (Q)") },
          { key: "tc", label: t("Total cost (TC)", "মোট ব্যয় (TC)") },
        ],
        minRows: 2,
        maxRows: 200,
        initialRows: 6,
        addRowLabel: t("Add row", "সারি যোগ করুন"),
      },
    ],
    example: {
      fields: {},
      tables: {
        data: [
          ["0", "100"],
          ["1", "140"],
          ["2", "170"],
          ["3", "195"],
          ["4", "225"],
          ["5", "265"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const table = input.tables.data;
      if (!table) {
        throw new CalcInputError(t("The cost table is missing.", "ব্যয়ের টেবিল পাওয়া যায়নি।"));
      }
      const observations: { quantity: number; totalCost: number }[] = [];
      table.rows.forEach((row, index) => {
        if (row.every((cell) => isBlank(cell))) return;
        const quantity = parseCell(row[0]);
        const totalCost = parseCell(row[1]);
        if (
          quantity === null ||
          totalCost === null ||
          Number.isNaN(quantity) ||
          Number.isNaN(totalCost)
        ) {
          throw new CalcInputError(
            t(
              `Row ${index + 1}: quantity and total cost must be numbers.`,
              `${index + 1} নম্বর সারি: পরিমাণ ও মোট ব্যয় সংখ্যা হতে হবে।`,
            ),
          );
        }
        if (quantity < 0 || totalCost < 0) {
          throw new CalcInputError(
            t(`Row ${index + 1}: values cannot be negative.`, `${index + 1} নম্বর সারি: মান ঋণাত্মক হতে পারে না।`),
          );
        }
        observations.push({ quantity, totalCost });
      });

      if (observations.length < 2) {
        throw new CalcInputError(
          t("Enter at least two cost observations.", "অন্তত দুটি ব্যয় পর্যবেক্ষণ লিখুন।"),
        );
      }
      const quantities = observations.map((row) => row.quantity);
      if (new Set(quantities).size !== quantities.length) {
        throw new CalcInputError(
          t("Each quantity must be unique.", "প্রতিটি পরিমাণ আলাদা হতে হবে।"),
        );
      }
      const result = costAnalysis(observations);

      return {
        metrics: [
          { label: t("Observations", "পর্যবেক্ষণ"), value: String(result.rows.length) },
          {
            label: t("Fixed cost (TC at Q = 0)", "স্থির ব্যয় (Q = 0-এ TC)"),
            value: result.fixedCost === null ? "\u2014" : formatNumber(result.fixedCost, 4),
          },
          {
            label: t("Minimum average cost", "সর্বনিম্ন গড় ব্যয়"),
            value:
              result.minimumAverageCost === null
                ? "\u2014"
                : formatNumber(result.minimumAverageCost, 4),
          },
        ],
        tables: [
          {
            headers: ["Q", "TC", "AC", "MC"],
            rows: result.rows.map((row) => [
              formatNumber(row.quantity, 3),
              formatNumber(row.totalCost, 3),
              row.averageCost === null ? "\u2014" : formatNumber(row.averageCost, 3),
              row.marginalCost === null ? "\u2014" : formatNumber(row.marginalCost, 3),
            ]),
            align: ["right", "right", "right", "right"],
          },
        ],
        steps: [
          {
            title: t("Average cost", "গড় ব্যয়"),
            formula: "AC = TC / Q",
            substitution: result.rows
              .filter((row) => row.averageCost !== null)
              .slice(0, 3)
              .map(
                (row) =>
                  `AC(${formatNumber(row.quantity, 2)}) = ${formatNumber(row.totalCost, 2)} / ${formatNumber(row.quantity, 2)} = ${formatNumber(row.averageCost ?? 0, 3)}`,
              )
              .join("  \u00b7  "),
          },
          {
            title: t("Marginal cost", "প্রান্তিক ব্যয়"),
            formula: "MC = \u0394TC / \u0394Q",
            substitution: result.rows
              .filter((row) => row.marginalCost !== null)
              .slice(0, 3)
              .map(
                (row, index) =>
                  `MC(${formatNumber(row.quantity, 2)}) = (${formatNumber(row.totalCost, 2)} \u2212 ${formatNumber(result.rows[index].totalCost, 2)}) / (${formatNumber(row.quantity, 2)} \u2212 ${formatNumber(result.rows[index].quantity, 2)}) = ${formatNumber(row.marginalCost ?? 0, 3)}`,
              )
              .join("  \u00b7  "),
          },
        ],
        interpretation: t(
          `Average cost is minimised near Q = ${
            result.rows
              .filter((row) => row.averageCost !== null)
              .sort((a, b) => (a.averageCost ?? 0) - (b.averageCost ?? 0))[0]?.quantity ?? 0
          } in the observed range. Marginal cost is the change in total cost between consecutive rows.`,
          `পর্যবেক্ষিত সীমার মধ্যে Q = ${
            result.rows
              .filter((row) => row.averageCost !== null)
              .sort((a, b) => (a.averageCost ?? 0) - (b.averageCost ?? 0))[0]?.quantity ?? 0
          }-এর কাছে গড় ব্যয় সর্বনিম্ন। প্রান্তিক ব্যয় হলো পরপর সারির মধ্যে মোট ব্যয়ের পরিবর্তন।`,
        ),
        warnings:
          result.fixedCost === null
            ? [
                t(
                  "No Q = 0 row was found, so fixed cost could not be separated from total cost.",
                  "Q = 0 সারি পাওয়া যায়নি, তাই স্থির ব্যয় মোট ব্যয় থেকে আলাদা করা যায়নি।",
                ),
              ]
            : undefined,
      };
    },
  },
  {
    id: "monopoly-profit",
    category: "micro",
    title: t("Monopoly profit maximisation", "একচেটিয়া মুনাফা সর্বোচ্চকরণ"),
    description: t(
      "Find the profit-maximising quantity and price for linear demand and constant marginal cost.",
      "রৈখিক চাহিদা ও ধ্রুবক প্রান্তিক ব্যয়ে মুনাফা-সর্বোচ্চকারী পরিমাণ ও দাম বের করুন।",
    ),
    whenToUse: t(
      "Use to model a single-price firm facing a downward-sloping linear demand curve.",
      "নিম্নমুখী রৈখিক চাহিদা রেখার মুখোমুখি একক-দামী প্রতিষ্ঠান মডেল করতে ব্যবহার করুন।",
    ),
    assumptions: t(
      "Demand is P = a \u2212 bQ, marginal cost is constant, fixed cost is known, and the firm sets one price for all units.",
      "চাহিদা P = a \u2212 bQ, প্রান্তিক ব্যয় ধ্রুবক, স্থির ব্যয় জানা এবং প্রতিষ্ঠান সব এককের জন্য একই দাম নির্ধারণ করে।",
    ),
    formulaSummary: [
      "P = a \u2212 bQ ; TR = aQ \u2212 bQ\u00b2 ; MR = a \u2212 2bQ",
      "Set MR = MC: Q* = (a \u2212 MC) / (2b)",
      "P* = a \u2212 bQ*",
      "Profit = TR \u2212 TC = P*Q* \u2212 (FC + MC\u00b7Q*)",
    ],
    legend: t(
      "a = demand intercept; b = demand slope; FC = fixed cost; MC = constant marginal cost.",
      "a = চাহিদার ছেদবিন্দু; b = চাহিদার ঢাল; FC = স্থির ব্যয়; MC = ধ্রুবক প্রান্তিক ব্যয়।",
    ),
    fields: [
      { key: "a", label: t("Demand intercept (a)", "চাহিদার ছেদবিন্দু (a)"), defaultValue: "100", kind: "number" },
      { key: "b", label: t("Demand slope (b)", "চাহিদার ঢাল (b)"), defaultValue: "2", kind: "number" },
      { key: "fc", label: t("Fixed cost (FC)", "স্থির ব্যয় (FC)"), defaultValue: "100", kind: "number" },
      { key: "mc", label: t("Marginal cost (MC)", "প্রান্তিক ব্যয় (MC)"), defaultValue: "20", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { a: "100", b: "2", fc: "100", mc: "20" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const a = numberField(input, "a", t("The demand intercept", "চাহিদার ছেদবিন্দু"));
      const b = numberField(input, "b", t("The demand slope", "চাহিদার ঢাল"));
      const fc = numberField(input, "fc", t("Fixed cost", "স্থির ব্যয়"));
      const mc = numberField(input, "mc", t("Marginal cost", "প্রান্তিক ব্যয়"));
      if (b <= 0) {
        throw new CalcInputError(
          t("The demand slope must be positive in P = a \u2212 bQ.", "P = a \u2212 bQ-এ চাহিদার ঢাল ধনাত্মক হতে হবে।"),
        );
      }
      if (fc < 0 || mc < 0) {
        throw new CalcInputError(t("Costs cannot be negative.", "ব্যয় ঋণাত্মক হতে পারে না।"));
      }
      if (a <= mc) {
        throw new CalcInputError(
          t(
            "The demand intercept must exceed marginal cost for a positive quantity.",
            "ধনাত্মক পরিমাণের জন্য চাহিদার ছেদবিন্দু প্রান্তিক ব্যয়ের চেয়ে বড় হতে হবে।",
          ),
        );
      }
      const result = monopolyProfit(a, b, fc, mc);

      return {
        metrics: [
          { label: t("Profit-maximising quantity (Q*)", "মুনাফা-সর্বোচ্চ পরিমাণ (Q*)"), value: formatNumber(result.quantity, 4), tone: "brand" },
          { label: t("Price (P*)", "দাম (P*)"), value: formatNumber(result.price, 4), tone: "brand" },
          { label: t("Total revenue", "মোট আয়"), value: formatNumber(result.totalRevenue, 4) },
          { label: t("Total cost", "মোট ব্যয়"), value: formatNumber(result.totalCost, 4) },
          { label: t("Profit", "মুনাফা"), value: formatNumber(result.profit, 4), tone: result.profit >= 0 ? "brand" : "warning" },
        ],
        steps: [
          {
            title: t("Revenue and marginal revenue", "আয় ও প্রান্তিক আয়"),
            formula: "TR = P \u00d7 Q = (a \u2212 bQ)Q = aQ \u2212 bQ\u00b2 ; MR = a \u2212 2bQ",
            substitution: `TR = ${formatNumber(a, 3)}Q \u2212 ${formatNumber(b, 3)}Q\u00b2 ; MR = ${formatNumber(a, 3)} \u2212 ${formatNumber(2 * b, 3)}Q`,
          },
          {
            title: t("Set MR = MC", "MR = MC করুন"),
            formula: "a \u2212 2bQ = MC",
            substitution: `${formatNumber(a, 3)} \u2212 ${formatNumber(2 * b, 3)}Q = ${formatNumber(mc, 3)}`,
          },
          {
            title: t("Solve for quantity and price", "পরিমাণ ও দামের সমাধান"),
            formula: "Q* = (a \u2212 MC) / (2b) ; P* = a \u2212 bQ*",
            substitution: `Q* = ${formatNumber(result.quantity, 4)} ; P* = ${formatNumber(result.price, 4)}`,
          },
          {
            title: t("Profit", "মুনাফা"),
            formula: "Profit = TR \u2212 TC = P*Q* \u2212 (FC + MC \u00d7 Q*)",
            substitution: `Profit = ${formatNumber(result.totalRevenue, 3)} \u2212 ${formatNumber(result.totalCost, 3)} = ${formatNumber(result.profit, 3)}`,
          },
        ],
        interpretation: t(
          `The firm maximises profit at Q* = ${formatNumber(result.quantity, 3)} and P* = ${formatNumber(result.price, 3)}, earning ${formatNumber(result.profit, 3)}. The price is above marginal cost, which is the monopoly markup.`,
          `প্রতিষ্ঠান Q* = ${formatNumber(result.quantity, 3)} ও P* = ${formatNumber(result.price, 3)}-এ মুনাফা সর্বোচ্চ করে, মুনাফা ${formatNumber(result.profit, 3)}। দাম প্রান্তিক ব্যয়ের চেয়ে বেশি, যা একচেটিয়া মার্কআপ।`,
        ),
      };
    },
  },
  {
    id: "consumer-producer-surplus",
    category: "micro",
    title: t("Consumer & producer surplus", "ভোক্তা ও উৎপাদক উদ্বৃত্ত"),
    description: t(
      "Compute equilibrium, consumer surplus, and producer surplus for linear demand and supply in price form.",
      "দাম আকারে রৈখিক চাহিদা ও যোগানের জন্য ভারসাম্য, ভোক্তা উদ্বৃত্ত ও উৎপাদক উদ্বৃত্ত।",
    ),
    whenToUse: t(
      "Use to measure the welfare created by a market when demand and supply are straight lines.",
      "চাহিদা ও যোগান সরলরেখা হলে বাজার যে কল্যাণ তৈরি করে তা মাপতে ব্যবহার করুন।",
    ),
    assumptions: t(
      "Demand is P = a \u2212 bQ and supply is P = c + dQ, with positive slopes and a > c. Surplus is the area of a triangle.",
      "চাহিদা P = a \u2212 bQ এবং যোগান P = c + dQ, ঢাল ধনাত্মক এবং a > c। উদ্বৃত্ত ত্রিভুজের ক্ষেত্রফল।",
    ),
    formulaSummary: [
      "Q* = (a \u2212 c) / (b + d)",
      "P* = a \u2212 bQ*",
      "CS = \u00bd(a \u2212 P*)Q*",
      "PS = \u00bd(P* \u2212 c)Q*",
      "Total surplus = CS + PS",
    ],
    legend: t(
      "a = demand choke price; b = demand slope; c = supply intercept; d = supply slope.",
      "a = চাহিদার সর্বোচ্চ দাম; b = চাহিদার ঢাল; c = যোগানের ছেদবিন্দু; d = যোগানের ঢাল।",
    ),
    fields: [
      { key: "a", label: t("Demand intercept (a)", "চাহিদার ছেদবিন্দু (a)"), defaultValue: "100", kind: "number" },
      { key: "b", label: t("Demand slope (b)", "চাহিদার ঢাল (b)"), defaultValue: "1", kind: "number" },
      { key: "c", label: t("Supply intercept (c)", "যোগানের ছেদবিন্দু (c)"), defaultValue: "20", kind: "number" },
      { key: "d", label: t("Supply slope (d)", "যোগানের ঢাল (d)"), defaultValue: "1", kind: "number" },
    ],
    tables: [],
    example: {
      fields: { a: "100", b: "1", c: "20", d: "1" },
      tables: {},
    },
    compute(input): CalculatorResult {
      const a = numberField(input, "a", t("The demand intercept", "চাহিদার ছেদবিন্দু"));
      const b = numberField(input, "b", t("The demand slope", "চাহিদার ঢাল"));
      const c = numberField(input, "c", t("The supply intercept", "যোগানের ছেদবিন্দু"));
      const d = numberField(input, "d", t("The supply slope", "যোগানের ঢাল"));
      if (b <= 0 || d <= 0) {
        throw new CalcInputError(
          t("Demand and supply slopes must be positive.", "চাহিদা ও যোগানের ঢাল ধনাত্মক হতে হবে।"),
        );
      }
      if (a <= c) {
        throw new CalcInputError(
          t(
            "The demand intercept must be above the supply intercept for a positive surplus.",
            "ধনাত্মক উদ্বৃত্তের জন্য চাহিদার ছেদবিন্দু যোগানের ছেদবিন্দুর চেয়ে উপরে হতে হবে।",
          ),
        );
      }
      const result = marketSurplus(a, b, c, d);

      return {
        metrics: [
          { label: t("Equilibrium price (P*)", "ভারসাম্য দাম (P*)"), value: formatNumber(result.price, 4) },
          { label: t("Equilibrium quantity (Q*)", "ভারসাম্য পরিমাণ (Q*)"), value: formatNumber(result.quantity, 4) },
          { label: t("Consumer surplus", "ভোক্তা উদ্বৃত্ত"), value: formatNumber(result.consumerSurplus, 4), tone: "brand" },
          { label: t("Producer surplus", "উৎপাদক উদ্বৃত্ত"), value: formatNumber(result.producerSurplus, 4), tone: "brand" },
          { label: t("Total surplus", "মোট উদ্বৃত্ত"), value: formatNumber(result.totalSurplus, 4) },
        ],
        steps: [
          {
            title: t("Equilibrium", "ভারসাম্য"),
            formula: "a \u2212 bQ = c + dQ",
            substitution: `Q* = (${formatNumber(a, 3)} \u2212 ${formatNumber(c, 3)}) / (${formatNumber(b, 3)} + ${formatNumber(d, 3)}) = ${formatNumber(result.quantity, 4)}; P* = ${formatNumber(result.price, 4)}`,
          },
          {
            title: t("Consumer surplus", "ভোক্তা উদ্বৃত্ত"),
            formula: "CS = \u00bd \u00d7 (a \u2212 P*) \u00d7 Q*",
            substitution: `CS = \u00bd \u00d7 (${formatNumber(a, 3)} \u2212 ${formatNumber(result.price, 3)}) \u00d7 ${formatNumber(result.quantity, 3)} = ${formatNumber(result.consumerSurplus, 4)}`,
          },
          {
            title: t("Producer surplus", "উৎপাদক উদ্বৃত্ত"),
            formula: "PS = \u00bd \u00d7 (P* \u2212 c) \u00d7 Q*",
            substitution: `PS = \u00bd \u00d7 (${formatNumber(result.price, 3)} \u2212 ${formatNumber(c, 3)}) \u00d7 ${formatNumber(result.quantity, 3)} = ${formatNumber(result.producerSurplus, 4)}`,
          },
        ],
        interpretation: t(
          `At equilibrium, consumers gain ${formatNumber(result.consumerSurplus, 3)} and producers gain ${formatNumber(result.producerSurplus, 3)}, for a total surplus of ${formatNumber(result.totalSurplus, 3)}.`,
          `ভারসাম্যে ভোক্তারা ${formatNumber(result.consumerSurplus, 3)} এবং উৎপাদকরা ${formatNumber(result.producerSurplus, 3)} উদ্বৃত্ত পায়, মোট উদ্বৃত্ত ${formatNumber(result.totalSurplus, 3)}।`,
        ),
      };
    },
  },
];
