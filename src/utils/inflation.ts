import type {
  InflationDataset,
  InflationMonth,
  MonthSummary,
  Trend,
  YearSummary,
} from '../types/inflation'

/** Derives the 'YYYY-MM' key from a 'YYYY-MM-DD' date. */
export function keyFromDate(date: string): string {
  return date.slice(0, 7)
}

/**
 * Normalizes the raw dataset into a sorted monthly series, computing the
 * cumulative factor from the first month (inclusive).
 *
 * If any monthly change is `<= -100` the cumulative factor is not valid
 * (the price level is voided or inverted) and it is marked as `NaN` instead
 * of propagating a meaningless factor.
 */
export function normalizeSeries(dataset: InflationDataset): InflationMonth[] {
  const rows = [...dataset.data].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))

  let factor = 1
  return rows.map((row) => {
    const key = keyFromDate(row.fecha)
    const monthlyChange = row.inflacion_mensual_pct
    if (monthlyChange <= -100) {
      factor = Number.NaN
    } else if (!Number.isNaN(factor)) {
      factor *= 1 + monthlyChange / 100
    }
    return {
      key,
      year: Number(key.slice(0, 4)),
      month: Number(key.slice(5, 7)),
      monthlyChange,
      cumulativeFactor: factor,
    }
  })
}

/** Returns the last month of the series, if there is one. */
export function latestMonth(months: InflationMonth[]): InflationMonth | undefined {
  return months.length > 0 ? months[months.length - 1] : undefined
}

/**
 * Computes the derived figures of a given month: year-over-year change,
 * cumulative factor and the current value of a historical peso.
 *
 * Returns `null` if the key is not in the series.
 */
export function computeMonthSummary(
  months: InflationMonth[],
  key: string,
): MonthSummary | null {
  const index = months.findIndex((month) => month.key === key)
  if (index === -1) return null

  const month = months[index]
  const latest = latestMonth(months)
  const latestFactor = latest?.cumulativeFactor ?? Number.NaN

  // Year-over-year: product of the 12 months ending in this month.
  let yearOverYearChange = Number.NaN
  if (index >= 11) {
    let factor = 1
    for (let i = index - 11; i <= index; i += 1) {
      factor *= 1 + months[i].monthlyChange / 100
    }
    yearOverYearChange = (factor - 1) * 100
  }

  const cumulativeFactor = month.cumulativeFactor
  const cumulativeChangeFromStart = (cumulativeFactor - 1) * 100
  const currentValueOfHistoricalPeso = latestFactor / cumulativeFactor

  return {
    key: month.key,
    monthlyChange: month.monthlyChange,
    yearOverYearChange,
    cumulativeFactor,
    cumulativeChangeFromStart,
    currentValueOfHistoricalPeso,
  }
}

/**
 * Direction of a change: 'up' when positive, 'down' when negative.
 *
 * Returns `null` when there is no direction to draw: an exact zero change
 * (neither up nor down) or a non-finite value.
 */
export function trendFromValue(value: number): Trend | null {
  if (!Number.isFinite(value) || value === 0) return null
  return value > 0 ? 'up' : 'down'
}

/**
 * Difference in percentage points between a change and the previous period's:
 * `currentValue − previousValue`.
 *
 * Returns `null` if either value is not finite (no comparison is possible).
 * A difference of `0` is valid: the direction is decided by `trendFromValue`.
 */
export function differenceBetween(
  currentValue: number,
  previousValue: number,
): number | null {
  if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue)) return null
  return currentValue - previousValue
}

/**
 * Computes the derived figures of a calendar year. It may be incomplete (1943
 * starts in March and 2026 ends in September).
 */
export function computeYearSummary(months: InflationMonth[], year: number): YearSummary {
  const ofTheYear = months.filter((month) => month.year === year)

  let factor = 1
  let sum = 0
  for (const month of ofTheYear) {
    factor *= 1 + month.monthlyChange / 100
    sum += month.monthlyChange
  }

  return {
    year,
    annualChange: (factor - 1) * 100,
    includedMonths: ofTheYear.length,
    complete: ofTheYear.length === 12,
    averageMonthlyChange: ofTheYear.length > 0 ? sum / ofTheYear.length : Number.NaN,
  }
}
