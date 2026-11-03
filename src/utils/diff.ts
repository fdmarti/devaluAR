import type { StatCardData } from '../types/card'
import { formatPercentage, formatTrendDescription } from './format'
import { differenceBetween, trendFromValue } from './inflation'

/**
 * Direction and difference of a change against the previous month.
 *
 * The arrow describes how the change **moved**, not whether it is positive: if
 * the monthly change went from 1,7 % to 1,9 %, the difference is `+0,2` and the
 * arrow points up in red. Without a computable difference there is no arrow.
 */
export function variationWithDifference(
  currentValue: number,
  previousValue: number | undefined,
): Pick<StatCardData, 'trend' | 'trendDescription' | 'difference'> {
  if (previousValue === undefined) return {}
  const difference = differenceBetween(currentValue, previousValue)
  if (difference === null) return {}
  const trend = trendFromValue(difference)
  if (!trend) return {}
  return {
    trend,
    trendDescription: formatTrendDescription(trend, 'respecto al mes anterior'),
    difference: formatPercentage(difference),
  }
}
