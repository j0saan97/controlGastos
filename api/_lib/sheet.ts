// Lectura del CSV publicado de Google Sheets (pestaña "app")

/** Parser CSV mínimo con soporte de comillas ("1.234,56") */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') inQuotes = false
      else cell += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (c !== '\r') cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows
}

/** "B3" → { row: 2, col: 1 } */
export function cellToIndex(ref: string): { row: number; col: number } {
  const m = /^([A-Z]+)(\d+)$/i.exec(ref.trim())
  if (!m) throw new Error(`Celda no válida: ${ref}`)
  const col = m[1].toUpperCase().split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1
  return { row: Number(m[2]) - 1, col }
}

/** "1.234,56 €" | "-35,5" | "1234.56" → número */
export function parseEuro(raw: string): number {
  let s = raw.replace(/[€\s ]/g, '')
  if (!s) throw new Error('Celda vacía')

  if (s.includes(',')) {
    // formato español: punto = miles, coma = decimal
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.234" sin decimales → miles
    s = s.replace(/\./g, '')
  }

  const n = Number(s)
  if (!Number.isFinite(n)) throw new Error(`Valor no numérico: "${raw}"`)
  return Math.round(n * 100) / 100
}

export async function readSheetCells(
  csvUrl: string,
  balanceCell: string,
  pnlCell: string,
): Promise<{ balance: number; pnl: number | null }> {
  const res = await fetch(csvUrl, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Google Sheets respondió ${res.status}`)
  const rows = parseCsv(await res.text())

  const get = (ref: string) => {
    const { row, col } = cellToIndex(ref)
    return rows[row]?.[col] ?? ''
  }

  const balance = parseEuro(get(balanceCell))
  const pnlRaw = get(pnlCell)
  const pnl = pnlRaw.trim() ? parseEuro(pnlRaw) : null
  return { balance, pnl }
}
