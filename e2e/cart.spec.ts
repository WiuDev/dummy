import { expect, isDeployed, test } from './support/test.ts'

// Produtos 1 e 2 das fixtures: rímel a US$ 8,94 e paleta a US$ 16,35, já com
// desconto. A Fase 5 estende este fluxo com o checkout.
test.describe('carrinho', () => {
  // Os títulos e preços vêm das fixtures: contra a API real, não valem.
  test.skip(isDeployed, 'depende da API mockada')

  test('adiciona, mostra o contador, altera, remove e mantém os itens ao recarregar', async ({
    page,
  }) => {
    const nav = page
      .getByRole('banner')
      .getByRole('navigation', { name: 'Navegação principal' })
    const cartItems = page
      .getByRole('list', { name: 'Itens do carrinho' })
      .getByRole('listitem')
    const summary = page.getByRole('region', { name: 'Resumo' })

    await page.goto('produtos/1')
    await page.getByRole('textbox', { name: 'Quantidade' }).fill('2')
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()

    await expect(page.getByRole('alert')).toContainText(
      '2 unidades de Essence Mascara Lash Princess.',
    )
    await expect(
      nav.getByRole('link', { name: 'Carrinho, 2 itens' }),
    ).toBeVisible()

    await nav.getByRole('link', { name: 'Produtos' }).click()
    await page
      .getByRole('list', { name: 'Produtos' })
      .getByRole('link', { name: 'Eyeshadow Palette with Mirror' })
      .click()
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()

    await expect(
      nav.getByRole('link', { name: 'Carrinho, 3 itens' }),
    ).toBeVisible()

    await nav.getByRole('link', { name: 'Carrinho, 3 itens' }).click()

    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(cartItems).toHaveCount(2)
    await expect(summary).toContainText('US$ 34,23')

    await page
      .getByRole('textbox', {
        name: 'Quantidade de Essence Mascara Lash Princess',
      })
      .fill('3')

    await expect(
      nav.getByRole('link', { name: 'Carrinho, 4 itens' }),
    ).toBeVisible()
    await expect(summary).toContainText('US$ 43,17')

    await page
      .getByRole('button', {
        name: 'Remover Eyeshadow Palette with Mirror do carrinho',
      })
      .click()

    await expect(cartItems).toHaveCount(1)
    await expect(
      nav.getByRole('link', { name: 'Carrinho, 3 itens' }),
    ).toBeVisible()
    await expect(summary).toContainText('US$ 26,82')

    await page.reload()

    await expect(cartItems).toHaveCount(1)
    await expect(
      page.getByRole('textbox', {
        name: 'Quantidade de Essence Mascara Lash Princess',
      }),
    ).toHaveValue('3')
    await expect(
      nav.getByRole('link', { name: 'Carrinho, 3 itens' }),
    ).toBeVisible()
    await expect(summary).toContainText('US$ 26,82')
  })
})
