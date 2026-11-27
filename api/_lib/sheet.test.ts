import { afterEach, describe, expect, it, vi } from 'vitest'
import { cellToIndex, parseCsv, parseEuro, readSheetCells, toCsvUrl } from './sheet'

describe('parseCsv', () => {
  it('separa filas y columnas', () => {
    expect(parseCsv('a,b\nc,d')).toEqual([['a', 'b'], ['c', 'd']])
  })
  it('respeta comillas con comas dentro ("1.234,56 €")', () => {
    expect(parseCsv('"1.234,56 €",x\r\n')).toEqual([['1.234,56 €', 'x']])
  })
  it('comillas dobles escapadas', () => {
    expect(parseCsv('"di ""hola""",y')).toEqual([['di "hola"', 'y']])
  })
  it('celdas vacías', () => {
    expect(parseCsv(',,z')).toEqual([['', '', 'z']])
  })
})

describe('cellToIndex', () => {
  it.each([
    ['A1', 0, 0],
    ['B3', 2, 1],
    ['O4', 3, 14],
    ['X6', 5, 23],
    ['AA10', 9, 26],
    ['x3', 2, 23],
  ])('%s → fila %i, columna %i', (ref, row, col) => {
    expect(cellToIndex(ref)).toEqual({ row, col })
  })
  it('rechaza referencias no válidas', () => {
    expect(() => cellToIndex('3X')).toThrow()
  })
})

describe('parseEuro (celdas del Excel)', () => {
  it.each([
    ['1.234,56 €', 1234.56],
    ['150,00 €', 150],
    ['240 €', 240],
    ['-35,5', -35.5],
    ['1234.56', 1234.56],
    ['1.234', 1234],
    ['0 €', 0],
  ])('"%s" → %d', (raw, expected) => {
    expect(parseEuro(raw)).toBe(expected)
  })
  it('celda vacía o texto → error', () => {
    expect(() => parseEuro('')).toThrow('Celda vacía')
    expect(() => parseEuro('BANCA')).toThrow()
  })
})

describe('toCsvUrl (enlace normal de la hoja → CSV)', () => {
  const id = '1AbC-dEf_123'
  it('convierte edit?gid=… de la pestaña', () => {
    expect(toCsvUrl(`https://docs.google.com/spreadsheets/d/${id}/edit?gid=39478319#gid=39478319`))
      .toBe(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=39478319`)
  })
  it('sin gid usa la primera pestaña (gid=0)', () => {
    expect(toCsvUrl(`https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`))
      .toBe(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=0`)
  })
  it('deja tal cual un enlace ya publicado como CSV', () => {
    const pub = `https://docs.google.com/spreadsheets/d/e/2PACX-x/pub?gid=0&single=true&output=csv`
    expect(toCsvUrl(pub)).toBe(pub)
  })
})

describe('readSheetCells', () => {
  afterEach(() => vi.unstubAllGlobals())

  // Hoja de ejemplo con la forma de "Resumen Banca" (columnas W:X)
  const csv = [
    ',,,,,,,,,,,,,,,,,,,,,,Resumen Banca,',
    ',,,,,,,,,,,,,,,,,,,,,,BANCA ACTUAL,240 €',
    ',,,,,,,,,,,,,,,,,,,,,,STARS,90 €',
    ',,,,,,,,,,,,,,,,,,,,,,SPORTIUM MATI,"150,50 €"',
  ].join('\n')

  it('lee saldo y P/L; P/L vacío → null', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(csv, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const r = await readSheetCells('https://docs.google.com/spreadsheets/d/ID/edit?gid=7', 'X4', 'Y1')
    expect(r).toEqual({ balance: 150.5, pnl: null })
    // usa el enlace convertido a CSV
    expect(fetchMock.mock.calls[0][0]).toBe('https://docs.google.com/spreadsheets/d/ID/export?format=csv&gid=7')
  })

  it('error claro si Google no deja leer la hoja (privada → 401)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })))
    await expect(readSheetCells('https://x', 'A1', 'B1')).rejects.toThrow('Google Sheets respondió 401')
  })
})
