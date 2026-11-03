/** Row as it comes from the hacecuentas.com dataset. */
export interface InflationRow {
  fecha: string // 'YYYY-MM-DD', last day of the month
  inflacion_mensual_pct: number
}

/** Wrapper around the full dataset. */
export interface InflationDataset {
  name: string
  description: string
  license: string
  licenseName: string
  creator: string
  creatorUrl: string
  source: string
  sourceUrl: string
  generatedAt: string
  fields: string[]
  rowCount: number
  data: InflationRow[]
}

/** A normalized month, with the 'YYYY-MM' key used for sorting and comparing. */
export interface InflationMonth {
  key: string // 'YYYY-MM'
  year: number
  month: number // 1-12
  monthlyChange: number // monthly %
  /** Cumulative factor since the first month of the dataset, inclusive. 1 = unchanged. */
  cumulativeFactor: number
}

/** Derived calculations for a single month. */
export interface MonthSummary {
  key: string
  monthlyChange: number
  /** Cumulative change over the 12 months ending in this month, in %. */
  yearOverYearChange: number
  /** Cumulative factor from the first month of the dataset to this month. */
  cumulativeFactor: number
  /** Cumulative change in % from the first month of the dataset to this month. */
  cumulativeChangeFromStart: number
  /** What one peso of this month is worth today. */
  currentValueOfHistoricalPeso: number
}

/** Calculations for a calendar year. It may be incomplete. */
export interface YearSummary {
  year: number
  /** Compound change of the available months of the year, in %. */
  annualChange: number
  includedMonths: number
  /** false when the year is missing months (1943 and 2026 are). */
  complete: boolean
  averageMonthlyChange: number
}

/** Direction of a change: 'up' (it went up) or 'down' (it went down). */
export type Trend = 'up' | 'down'
