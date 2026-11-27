/** Máximo que cabe en la BD (numeric(12,2)) con margen */
export const MAX_AMOUNT = 999_999_999

/**
 * Texto escrito por el usuario → número. Inválido → NaN.
 * "1.234,56" · "1234,56" · "1234.56" · "12,5" · "1.200" (miles) · "50 €"
 * Sin coma, un punto seguido de exactamente 3 cifras es de miles ("1.200" = 1200),
 * igual que en la lectura del Excel; "12.5" o "12.50" siguen siendo decimales.
 */
export function parseAmount(s: string): number {
  const t = s.trim().replace(/\s|€/g, '')
  let normalized = t
  if (t.includes(',')) normalized = t.replace(/\./g, '').replace(',', '.')
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) normalized = t.replace(/\./g, '')
  if (normalized === '' || !/^-?\d+(\.\d+)?$/.test(normalized)) return NaN
  const n = Number(normalized)
  return Math.abs(n) > MAX_AMOUNT ? NaN : n
}
