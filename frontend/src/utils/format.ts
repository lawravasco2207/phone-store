/**
 * Small formatting helpers used across the app.
 */

export function formatPrice(value: number, currency: 'USD' = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `$${value.toFixed(0)}`
  }
}
