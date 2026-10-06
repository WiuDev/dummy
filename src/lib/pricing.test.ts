import { describe, expect, it } from 'vitest'
import { discountedPrice, discountedPriceCents, toCents } from './pricing'

describe('discountedPrice', () => {
  it.each([
    [9.99, 10.48, 8.94],
    [549.99, 13.67, 474.81],
    [19.99, 0, 19.99],
    [50, 100, 0],
  ])('%s com %s%% de desconto custa %s', (price, discount, expected) => {
    expect(discountedPrice(price, discount)).toBe(expected)
  })
})

describe('discountedPriceCents', () => {
  it.each([
    [9.99, 10.48, 894],
    [19.99, 18.19, 1635],
    [19.99, 0, 1999],
    [50, 100, 0],
  ])(
    '%s com %s%% de desconto custa %s centavos',
    (price, discount, expected) => {
      expect(discountedPriceCents(price, discount)).toBe(expected)
    },
  )
})

describe('toCents', () => {
  it.each([
    [9.99, 999],
    [19.99, 1999],
    [0.1 + 0.2, 30],
    [1234.5, 123450],
  ])('%s dólares são %s centavos', (value, expected) => {
    expect(toCents(value)).toBe(expected)
  })
})
