// Preço com o desconto aplicado, arredondado para centavos. A API manda o
// preço cheio e o percentual de desconto (ex.: 9.99 e 10.48).
export function discountedPrice(
  price: number,
  discountPercentage: number,
): number {
  return Math.round(price * (100 - discountPercentage)) / 100
}
