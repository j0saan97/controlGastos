import { describe, expect, it } from 'vitest'
import { parseAmount } from './amount'

describe('parseAmount (importes escritos a mano)', () => {
  it.each([
    ['12,5', 12.5],
    ['1.234,56', 1234.56],
    ['1234,56', 1234.56],
    ['1234.56', 1234.56],
    ['12.5', 12.5],
    ['12.50', 12.5],
    ['1200', 1200],
    ['-35', -35],
    ['50 €', 50],
    ['  7,00  ', 7],
  ])('"%s" → %d', (input, expected) => {
    expect(parseAmount(input)).toBe(expected)
  })

  it('punto con 3 cifras detrás = separador de miles (bug F10-03)', () => {
    expect(parseAmount('1.200')).toBe(1200)
    expect(parseAmount('1.200.000')).toBe(1200000)
    expect(parseAmount('-1.500')).toBe(-1500)
  })

  it.each(['', 'abc', '12a', '1,2,3', '€', '--5'])('"%s" no es un importe → NaN', (input) => {
    expect(parseAmount(input)).toBeNaN()
  })

  it('rechaza importes que no caben en la base de datos', () => {
    expect(parseAmount('999999999')).toBe(999999999)
    expect(parseAmount('2000000000')).toBeNaN()
  })
})
