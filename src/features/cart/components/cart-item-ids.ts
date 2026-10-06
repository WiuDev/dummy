// Id do link do título de cada item do carrinho. Depois de uma remoção, o
// CartPage leva o foco ao item vizinho por ele (D70).
export function cartItemTitleId(productId: number): string {
  return `item-do-carrinho-${String(productId)}`
}
