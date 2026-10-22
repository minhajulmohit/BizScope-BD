import type { Language } from "@/lib/i18n";

const EN = {
  eyebrow: "Econ Math / Calculators",
  title: "Economics math & statistics",
  description:
    "Enter your numbers in a table and get the formula, the step-by-step solution, and a plain-language interpretation. Every calculation runs in your browser.",
  privacy:
    "Your data stays in this browser. Nothing is uploaded, stored, or sent to a server.",
  privacyTitle: "Private by design",
  educational:
    "Educational calculator, not financial or investment advice. Check assumptions before using a result in a real decision.",
  educationalTitle: "For learning",
  calculatorCount: (count: number) => `${count} calculators`,
  tabs: {
    calculators: "Calculators",
    formulas: "Formula guide",
  },
  picker: {
    label: "Calculator",
    search: "Search calculators",
    searchPlaceholder: "Search by name or topic",
    all: "All",
    noMatches: "No calculator matches that search.",
    results: (shown: number, total: number) => `${shown} of ${total}`,
    chooseMobile: "Choose a calculator",
  },
  actions: {
    example: "Load example",
    clear: "Clear",
    confirmClear: "Confirm clear",
    clearHelp: "Clear all inputs for this calculator",
    copy: "Copy result",
    copied: "Copied",
  },
  input: {
    parameters: "Parameters",
    parametersHelp: "Values that stay fixed for this calculation.",
    data: "Data table",
    addRow: "Add row",
    addColumn: "Add column",
    removeRow: "Remove this row",
    removeColumn: "Remove this column",
    rowLabel: "Label",
    rowLabelPlaceholder: "Label",
    columnHeader: "Column name",
    pasteHelp:
      "Tip: copy a block from Excel or Google Sheets and paste it into any cell.",
    emptyHint: "Enter values in the table to see results.",
    tableLabel: "Input table",
  },
  results: {
    title: "Result",
    waitingTitle: "Waiting for valid data",
    waitingBody:
      "Results update automatically as soon as the table contains enough valid numbers.",
    errorTitle: "Check the input",
    decision: "Decision",
    interpretation: "Interpretation",
    steps: "Step-by-step solution",
    formula: "Formula",
    substitution: "Substitution",
    warnings: "Warnings",
    assumptions: "Assumptions & limits",
    tables: "Working table",
    copyHeading: (title: string) => `${title} — Econ Math result`,
    noSteps: "No worked steps are available for this result.",
  },
  formulaGuide: {
    title: "Formula guide",
    description:
      "Browse every formula used on this page, grouped by topic. Open a calculator to see when to use it, the symbols, and its assumptions.",
    search: "Search formulas",
    searchPlaceholder: "Search formula, topic, or calculator",
    noMatches: "No formula matches that search.",
    whenToUse: "When to use it",
    symbols: "Symbols",
    assumptions: "Assumptions",
    formulas: "Formulas",
  },
  formula: {
    label: "Formula",
  },
  table: {
    noRows: "No rows",
  },
  badge: {
    browser: "Runs locally",
    educational: "Learning tool",
  },
  footerNote:
    "Econ Math computes with the numbers you enter. It does not fetch market data or replace statistical software for published research.",
};

export type MathCopy = {
  [K in keyof typeof EN]: (typeof EN)[K];
};

const BN: MathCopy = {
  eyebrow: "ইকন ম্যাথ / ক্যালকুলেটর",
  title: "অর্থনীতির গণিত ও পরিসংখ্যান",
  description:
    "টেবিলে আপনার সংখ্যা লিখুন এবং সূত্র, ধাপে ধাপে সমাধান ও সহজ ভাষায় ব্যাখ্যা পান। প্রতিটি গণনা আপনার ব্রাউজারেই হয়।",
  privacy:
    "আপনার ডেটা এই ব্রাউজারেই থাকে। কোথাও আপলোড, সংরক্ষণ বা সার্ভারে পাঠানো হয় না।",
  privacyTitle: "গোপনীয়তা সুরক্ষিত",
  educational:
    "শিক্ষামূলক ক্যালকুলেটর, আর্থিক বা বিনিয়োগ পরামর্শ নয়। বাস্তব সিদ্ধান্তে ব্যবহারের আগে অনুমানগুলো যাচাই করুন।",
  educationalTitle: "শেখার জন্য",
  calculatorCount: (count: number) => `${count}টি ক্যালকুলেটর`,
  tabs: {
    calculators: "ক্যালকুলেটর",
    formulas: "সূত্র গাইড",
  },
  picker: {
    label: "ক্যালকুলেটর",
    search: "ক্যালকুলেটর খুঁজুন",
    searchPlaceholder: "নাম বা বিষয় দিয়ে খুঁজুন",
    all: "সব",
    noMatches: "এই অনুসন্ধানে কোনো ক্যালকুলেটর মেলেনি।",
    results: (shown: number, total: number) => `${total}টির মধ্যে ${shown}টি`,
    chooseMobile: "একটি ক্যালকুলেটর বেছে নিন",
  },
  actions: {
    example: "উদাহরণ লোড করুন",
    clear: "মুছুন",
    confirmClear: "মুছে ফেলুন",
    clearHelp: "এই ক্যালকুলেটরের সব ইনপুট মুছুন",
    copy: "ফলাফল কপি",
    copied: "কপি হয়েছে",
  },
  input: {
    parameters: "প্যারামিটার",
    parametersHelp: "এই গণনার জন্য স্থির থাকা মানগুলো।",
    data: "ডেটা টেবিল",
    addRow: "সারি যোগ করুন",
    addColumn: "কলাম যোগ করুন",
    removeRow: "এই সারি সরান",
    removeColumn: "এই কলাম সরান",
    rowLabel: "লেবেল",
    rowLabelPlaceholder: "লেবেল",
    columnHeader: "কলামের নাম",
    pasteHelp:
      "টিপস: এক্সেল বা গুগল শিট থেকে একটি ব্লক কপি করে যেকোনো ঘরে পেস্ট করুন।",
    emptyHint: "ফলাফল দেখতে টেবিলে মান লিখুন।",
    tableLabel: "ইনপুট টেবিল",
  },
  results: {
    title: "ফলাফল",
    waitingTitle: "বৈধ ডেটার অপেক্ষায়",
    waitingBody:
      "টেবিলে যথেষ্ট বৈধ সংখ্যা আসার সঙ্গে সঙ্গে ফলাফল স্বয়ংক্রিয়ভাবে হালনাগাদ হবে।",
    errorTitle: "ইনপুট যাচাই করুন",
    decision: "সিদ্ধান্ত",
    interpretation: "ব্যাখ্যা",
    steps: "ধাপে ধাপে সমাধান",
    formula: "সূত্র",
    substitution: "মান বসানো",
    warnings: "সতর্কতা",
    assumptions: "অনুমান ও সীমাবদ্ধতা",
    tables: "কাজের টেবিল",
    copyHeading: (title: string) => `${title} — ইকন ম্যাথ ফলাফল`,
    noSteps: "এই ফলাফলের জন্য ধাপে ধাপে সমাধান নেই।",
  },
  formulaGuide: {
    title: "সূত্র গাইড",
    description:
      "এই পেজে ব্যবহৃত সব সূত্র বিষয় অনুযায়ী দেখুন। কখন ব্যবহার করবেন, প্রতীকগুলোর অর্থ ও অনুমান দেখতে ক্যালকুলেটরটি খুলুন।",
    search: "সূত্র খুঁজুন",
    searchPlaceholder: "সূত্র, বিষয় বা ক্যালকুলেটর খুঁজুন",
    noMatches: "এই অনুসন্ধানে কোনো সূত্র মেলেনি।",
    whenToUse: "কখন ব্যবহার করবেন",
    symbols: "প্রতীক",
    assumptions: "অনুমান",
    formulas: "সূত্র",
  },
  formula: {
    label: "সূত্র",
  },
  table: {
    noRows: "কোনো সারি নেই",
  },
  badge: {
    browser: "লোকালি চলে",
    educational: "শেখার টুল",
  },
  footerNote:
    "ইকন ম্যাথ আপনার দেওয়া সংখ্যা দিয়ে গণনা করে। এটি বাজার ডেটা আনে না বা প্রকাশিত গবেষণার পরিসংখ্যান সফটওয়্যারের বিকল্প নয়।",
};

export const MATH_COPY: Record<Language, MathCopy> = { en: EN, bn: BN };
