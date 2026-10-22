import {
  formatNumber,
  isBlank,
  parseCell,
} from "@/lib/econ-math/io";
import { priceIndices } from "@/lib/econ-math/index-numbers";
import {
  CalcInputError,
  t,
  type CalculatorDef,
  type CalculatorResult,
} from "@/lib/econ-math/types";

export const indexCalculators: CalculatorDef[] = [
  {
    id: "price-index",
    category: "index",
    title: t("Laspeyres, Paasche & Fisher price index", "ল্যাসপেয়ার্স, পাশে ও ফিশার মূল্য সূচক"),
    description: t(
      "Compute three common price indices from base-period and current-period prices and quantities.",
      "ভিত্তি ও চলতি সময়ের দাম ও পরিমাণ থেকে তিনটি সাধারণ মূল্য সূচক গণনা করুন।",
    ),
    whenToUse: t(
      "Use to measure the average price change of a basket of goods between two periods.",
      "দুই সময়ের মধ্যে পণ্য ঝুড়ির গড় দাম পরিবর্তন মাপতে ব্যবহার করুন।",
    ),
    assumptions: t(
      "The same items are priced in both periods, quantities are positive, and the base-period quantities are representative of the base basket. Fisher is the geometric mean of Laspeyres and Paasche.",
      "দুই সময়ে একই পণ্যের দাম, পরিমাণ ধনাত্মক এবং ভিত্তি সময়ের পরিমাণ ভিত্তি ঝুড়ির প্রতিনিধিত্ব করে। ফিশার হলো ল্যাসপেয়ার্স ও পাশের জ্যামিতিক গড়।",
    ),
    formulaSummary: [
      "Laspeyres = (\u03a3P\u2081Q\u2080 / \u03a3P\u2080Q\u2080) \u00d7 100",
      "Paasche = (\u03a3P\u2081Q\u2081 / \u03a3P\u2080Q\u2081) \u00d7 100",
      "Fisher = \u221a(Laspeyres \u00d7 Paasche)",
      "Inflation implied by Fisher = Fisher \u2212 100",
    ],
    legend: t(
      "P\u2080, Q\u2080 = base-period price and quantity; P\u2081, Q\u2081 = current-period price and quantity. An index of 110 means a 10% price increase from the base.",
      "P\u2080, Q\u2080 = ভিত্তি সময়ের দাম ও পরিমাণ; P\u2081, Q\u2081 = চলতি সময়ের দাম ও পরিমাণ। সূচক ১১০ মানে ভিত্তি থেকে ১০% দাম বৃদ্ধি।",
    ),
    fields: [],
    tables: [
      {
        key: "data",
        label: t("Basket prices and quantities", "ঝুড়ির দাম ও পরিমাণ"),
        columns: [
          { key: "p0", label: t("P\u2080 (base price)", "P\u2080 (ভিত্তি দাম)") },
          { key: "q0", label: t("Q\u2080 (base quantity)", "Q\u2080 (ভিত্তি পরিমাণ)") },
          { key: "p1", label: t("P\u2081 (current price)", "P\u2081 (চলতি দাম)") },
          { key: "q1", label: t("Q\u2081 (current quantity)", "Q\u2081 (চলতি পরিমাণ)") },
        ],
        rowLabels: true,
        minRows: 2,
        maxRows: 100,
        initialRows: 4,
        addRowLabel: t("Add item", "পণ্য যোগ করুন"),
      },
    ],
    example: {
      fields: {},
      tables: {
        data: [
          ["Rice (kg)", "60", "10", "70", "10"],
          ["Oil (litre)", "140", "4", "165", "4"],
          ["Lentil (kg)", "110", "3", "130", "3"],
          ["Sugar (kg)", "90", "2", "115", "2"],
        ],
      },
    },
    compute(input): CalculatorResult {
      const table = input.tables.data;
      if (!table) {
        throw new CalcInputError(t("The basket table is missing.", "ঝুড়ির টেবিল পাওয়া যায়নি।"));
      }
      const items: { name: string; price0: number; quantity0: number; price1: number; quantity1: number }[] = [];

      table.rows.forEach((row, index) => {
        if (row.slice(1).every((cell) => isBlank(cell))) return;
        const values = [row[1], row[2], row[3], row[4]].map((cell) => parseCell(cell));
        if (values.some((value) => value === null || Number.isNaN(value))) {
          throw new CalcInputError(
            t(
              `Row ${index + 1}: prices and quantities must all be numbers.`,
              `${index + 1} নম্বর সারি: দাম ও পরিমাণ সবই সংখ্যা হতে হবে।`,
            ),
          );
        }
        const [price0, quantity0, price1, quantity1] = values as number[];
        if (price0 <= 0 || price1 <= 0 || quantity0 <= 0 || quantity1 <= 0) {
          throw new CalcInputError(
            t(
              `Row ${index + 1}: prices and quantities must be positive.`,
              `${index + 1} নম্বর সারি: দাম ও পরিমাণ ধনাত্মক হতে হবে।`,
            ),
          );
        }
        items.push({
          name: row[0]?.trim() || `Item ${items.length + 1}`,
          price0,
          quantity0,
          price1,
          quantity1,
        });
      });

      if (items.length < 2) {
        throw new CalcInputError(
          t("Enter at least two items.", "অন্তত দুটি পণ্য লিখুন।"),
        );
      }

      const result = priceIndices(items);

      return {
        metrics: [
          { label: t("Laspeyres index", "ল্যাসপেয়ার্স সূচক"), value: formatNumber(result.laspeyres, 2) },
          { label: t("Paasche index", "পাশে সূচক"), value: formatNumber(result.paasche, 2) },
          { label: t("Fisher index", "ফিশার সূচক"), value: formatNumber(result.fisher, 2), tone: "brand" },
          { label: t("Implied inflation (Fisher)", "অন্তর্নিহিত মূল্যস্ফীতি (ফিশার)"), value: `${formatNumber(result.fisher - 100, 2)}%` },
        ],
        tables: [
          {
            headers: ["Item", "P\u2080", "Q\u2080", "P\u2081", "Q\u2081", "P\u2081Q\u2080", "P\u2080Q\u2081"],
            rows: items.map((item) => [
              item.name,
              formatNumber(item.price0, 2),
              formatNumber(item.quantity0, 2),
              formatNumber(item.price1, 2),
              formatNumber(item.quantity1, 2),
              formatNumber(item.price1 * item.quantity0, 2),
              formatNumber(item.price0 * item.quantity1, 2),
            ]),
            align: ["left", "right", "right", "right", "right", "right", "right"],
          },
        ],
        steps: [
          {
            title: t("Laspeyres", "ল্যাসপেয়ার্স"),
            formula: "L = (\u03a3P\u2081Q\u2080 / \u03a3P\u2080Q\u2080) \u00d7 100",
            substitution: `L = (${formatNumber(result.basketCostBaseWeights, 2)} / ${formatNumber(result.baseValue, 2)}) \u00d7 100 = ${formatNumber(result.laspeyres, 3)}`,
          },
          {
            title: t("Paasche", "পাশে"),
            formula: "P = (\u03a3P\u2081Q\u2081 / \u03a3P\u2080Q\u2081) \u00d7 100",
            substitution: `P = (${formatNumber(result.currentValue, 2)} / ${formatNumber(result.basketCostCurrentWeights, 2)}) \u00d7 100 = ${formatNumber(result.paasche, 3)}`,
          },
          {
            title: t("Fisher", "ফিশার"),
            formula: "F = \u221a(L \u00d7 P)",
            substitution: `F = \u221a(${formatNumber(result.laspeyres, 3)} \u00d7 ${formatNumber(result.paasche, 3)}) = ${formatNumber(result.fisher, 3)}`,
          },
        ],
        interpretation: t(
          `Prices rose by ${formatNumber(result.fisher - 100, 2)}% between the two periods according to the Fisher index. Laspeyres (${formatNumber(result.laspeyres, 2)}) uses base quantities and Paasche (${formatNumber(result.paasche, 2)}) uses current quantities.`,
          `ফিশার সূচক অনুযায়ী দুই সময়ের মধ্যে দাম ${formatNumber(result.fisher - 100, 2)}% বেড়েছে। ল্যাসপেয়ার্স (${formatNumber(result.laspeyres, 2)}) ভিত্তি পরিমাণ এবং পাশে (${formatNumber(result.paasche, 2)}) চলতি পরিমাণ ব্যবহার করে।`,
        ),
      };
    },
  },
];
