export function formatCurrency(value: number | null | undefined, currency?: string | null, locale = 'es-US') {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const safeCurrency = currency || 'USD';
  try {
    // Ensure currency is a string and not null
    return new Intl.NumberFormat(locale, { style: 'currency', currency: safeCurrency }).format(safeValue);
  } catch (e) {
    // Fallback: numeric format with currency code appended
    return `${safeValue.toFixed(2)} ${safeCurrency}`;
  }
}
