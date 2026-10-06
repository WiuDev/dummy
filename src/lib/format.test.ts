import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatPercent } from './format'

describe('formatCurrency', () => {
  it.each([
    [9.99, 'US$ 9,99'],
    [1234.5, 'US$ 1.234,50'],
    [0, 'US$ 0,00'],
  ])('formata %s como %s', (value, expected) => {
    expect(formatCurrency(value)).toBe(expected)
  })
})

describe('formatPercent', () => {
  it.each([
    [10.48, '10%'],
    [99.6, '100%'],
  ])('formata %s como %s', (value, expected) => {
    expect(formatPercent(value)).toBe(expected)
  })
})

describe('formatDate', () => {
  it('formata a data por extenso em pt-BR', () => {
    expect(formatDate('2025-04-30T09:41:02.053Z')).toBe('30 de abril de 2025')
  })

  it('usa o dia em UTC, sem depender do fuso da máquina', () => {
    expect(formatDate('2025-01-01T00:30:00.000Z')).toBe('1 de janeiro de 2025')
  })
})
