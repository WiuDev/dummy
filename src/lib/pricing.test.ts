import { describe, expect, it } from 'vitest'
import { discountedPrice } from './pricing'

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
