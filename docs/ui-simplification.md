# UI simplification — balanced pass

Date: 2026-10-21
Branch: `ui-simplification`
Pre-change backup: `backup/pre-ui-simplification` (same commit as `main` at `6240a86`)

## Rollback

```bash
git switch main                 # go back to the pre-simplification code
# or discard this branch entirely:
git branch -D ui-simplification
```

Nothing was deleted from the data layer, so reverting the branch restores the full previous UI.

## What changed

### Navigation & shell
- Sidebar navigation is now a flat 6-item list with shorter labels:
  `Overview`, `Economy`, `Trade`, `Dollar rate`, `Datasets`, `Sources`
  (`এক নজরে`, `অর্থনীতি`, `বাণিজ্য`, `ডলার রেট`, `ডেটাসেট`, `উৎস`).
- Removed the group headers, the long sidebar disclaimer and the repeated footer disclaimer.
- Breadcrumb is now `BizScope BD > current page`.
- Header controls (menu, theme, language, source status) are 40–44 px tall.
- Language toggle always shows the full `English` / `বাংলা` label.
- Source status pill reads “All sources online” / “সব উৎস চালু” when every source is healthy.

### Overview (`app/page.tsx`)
- Compact hero: one short status line (`Latest observation`, `World Bank update`, `Last checked`) plus two call-to-action buttons.
- Four primary KPI cards (GDP, inflation, unemployment, USD→BDT); GDP growth and population moved into a “More indicators” disclosure.
- Annual-data and BDT-conversion notices moved into one “How to read these numbers” disclosure; the missing-rate warning still shows immediately.
- One chart visible at a time via `Growth & inflation` / `Trade flows` tabs.
- “Data table & sources” moved into a collapsed disclosure.

### KPI cards (`components/ui/kpi-card.tsx`)
- Removed the cadence badge and the delta chip (the chart and period still show movement and timing).
- Source / update metadata condensed into one compact footer row; cards are shorter.

### Trade
- Technical notices moved into the “How to read these numbers” disclosure.
- Data table and the definitions / official-sources panels are collapsed disclosures.
- Chart descriptions shortened; conversion note moved to the chart footer.

### Economy
- Notices moved into a disclosure.
- Metric selector now uses a readable 2/3/4-column grid with wrapped labels instead of 7 truncated chips.
- Removed the duplicated definition box that sat inside the chart.

### Currency
- Converter is visually first; the rate summary sits beside it.
- Third-party warning, history note and Bangladesh Bank panel are collapsed disclosures.

### Datasets
- Catalog notice moved below the explorer into an “About this catalog” disclosure.

### Typography & accessibility
- One-time size remap across `app/**` and `components/**` (8→10, 9→11, 10→11, 11→12, 12→13, 13→14 px).
- Panel headers (16 px title, 13 px description) and small text raised.
- Eyebrow labels are now sentence case in the sans font instead of uppercase mono.
- Bengali body text set to 15 px / 1.7 line height.
- Muted / subtle / amber text tokens darkened so all secondary text meets WCAG AA contrast (light and dark theme).

## What did not change
- Data providers, API endpoints and fetch timeouts.
- Indicator definitions, formulas, numeric series and the BDT conversion logic.
- Source truth and methodology text on `Sources`.
- Cloudflare Web Analytics, theme toggle, i18n cookie behaviour, responsive layout.

## Verification
- `npx tsc --noEmit` — clean.
- `npm run lint` — clean.
- `npm run build` — clean (Next.js 16.4.2).
- 120 automated checks pass: bilingual headings, axe WCAG 2 A/AA (light and dark) with 0 violations, no horizontal overflow at 320 / 360 / 390 / 1440 px, disclosures open/close, single overview chart, converter-first order on mobile.
- Bilingual copy parity: all 29 copy objects have matching keys in `en` and `bn`.
