import type { Trend } from './inflation'

/** Home metric card: already formatted text plus an optional direction. */
export interface StatCardData {
  /** Short metric label, shown in small caps. */
  title: string
  /** Already formatted figure. The component formats nothing. */
  value: string
  /** Optional detail. Rendered only when not empty. */
  subtitle: string
  /** Direction of the change, if it applies. */
  trend?: Trend
  /** Accessible text explaining what the change is compared against. */
  trendDescription?: string
  /** Difference against the previous month, already formatted. */
  difference?: string
}
