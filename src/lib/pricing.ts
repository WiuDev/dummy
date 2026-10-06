// Preço com o desconto aplicado, em centavos inteiros. A API manda o preço
// cheio e o percentual de desconto (ex.: 9.99 e 10.48).
export function discountedPriceCents(
  price: number,
  discountPercentage: number,
): number {
  return Math.round(price * (100 - discountPercentage))
}

// O mesmo preço com desconto em dólares, arredondado para centavos.
export function discountedPrice(
  price: number,
  discountPercentage: number,
): number {
  return discountedPriceCents(price, discountPercentage) / 100
}

// Valor em dólares convertido para centavos inteiros: as somas do carrinho são
// feitas em centavos, sem o erro de arredondamento dos números de ponto
// flutuante.
export function toCents(value: number): number {
  return Math.round(value * 100)
}
