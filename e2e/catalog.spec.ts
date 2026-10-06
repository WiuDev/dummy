import { fixtures } from './support/fixtures.ts'
import { expect, isDeployed, test } from './support/test.ts'

// A busca "phone" das fixtures tem 23 produtos, 16 deles smartphones. Com 12
// produtos por página, a página 2 da busca filtrada mostra os 4 últimos.
const secondPageTitles = fixtures.searchPhone.products
  .filter((product) => product.category === 'smartphones')
  .slice(12)
  .map((product) => product.title)

test.describe('catálogo', () => {
  // As contagens e os títulos vêm das fixtures: contra a API real, não valem.
  test.skip(isDeployed, 'depende da API mockada')

  test('busca, filtra, pagina, abre um produto e volta com o estado da URL', async ({
    page,
  }) => {
    const search = page.getByRole('searchbox', { name: 'Buscar produtos' })
    const category = page.getByRole('combobox', { name: 'Categoria' })
    const productLinks = page
      .getByRole('list', { name: 'Produtos' })
      .getByRole('link')

    await page.goto('produtos')
    await expect(productLinks).toHaveText(
      fixtures.productsPage.products.map((product) => product.title),
    )

    await search.fill('phone')

    await expect(page).toHaveURL(/\/produtos\?q=phone$/)
    await expect(page.getByText('23 produtos')).toBeVisible()

    await category.click()
    await page.getByRole('option', { name: 'Smartphones' }).click()

    await expect(page).toHaveURL(/\/produtos\?q=phone&categoria=smartphones$/)
    await expect(page.getByText('16 produtos')).toBeVisible()
    await expect(productLinks).toHaveCount(12)

    await page.getByRole('button', { name: 'Página 2' }).click()

    await expect(page).toHaveURL(
      /\/produtos\?q=phone&categoria=smartphones&pagina=2$/,
    )
    await expect(productLinks).toHaveText(secondPageTitles)

    const firstProduct = productLinks.first()
    const title = await firstProduct.innerText()
    await firstProduct.click()

    await expect(page).toHaveURL(/\/produtos\/\d+$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)

    await page.getByRole('button', { name: 'Voltar' }).click()

    await expect(page).toHaveURL(
      /\/produtos\?q=phone&categoria=smartphones&pagina=2$/,
    )
    await expect(search).toHaveValue('phone')
    await expect(category).toHaveValue('Smartphones')
    await expect(productLinks).toHaveText(secondPageTitles)

    await page.reload()

    await expect(search).toHaveValue('phone')
    await expect(category).toHaveValue('Smartphones')
    await expect(
      page.getByRole('button', { name: 'Página 2' }),
    ).toHaveAttribute('aria-current', 'page')
    await expect(productLinks).toHaveText(secondPageTitles)
  })

  test('um produto inexistente mostra o aviso, sem tentar de novo', async ({
    page,
  }) => {
    await page.goto('produtos/9999')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Produto não encontrado' }),
    ).toBeVisible()
    await expect(page).toHaveTitle('Produto não encontrado · Loja Dummy')
    await expect(
      page.getByRole('button', { name: 'Tentar novamente' }),
    ).toHaveCount(0)

    await page.getByRole('link', { name: 'Ver os produtos' }).click()

    await expect(page).toHaveURL(/\/produtos$/)
  })

  test.describe('no celular', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('a navegação fica num menu que fecha ao escolher a página', async ({
      page,
    }) => {
      const header = page.getByRole('banner')
      const menuButton = header.getByRole('button', { name: 'Abrir menu' })
      const menu = page.getByRole('dialog', { name: 'Menu' })

      await page.goto('produtos/1')

      await expect(
        header.getByRole('navigation', { name: 'Navegação principal' }),
      ).toBeHidden()

      await menuButton.click()

      await expect(menuButton).toHaveAttribute('aria-expanded', 'true')

      await menu.getByRole('link', { name: 'Produtos' }).click()

      await expect(page).toHaveURL(/\/produtos$/)
      await expect(menu).toBeHidden()
      await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
      await expect(
        page.getByRole('heading', { level: 1, name: 'Produtos' }),
      ).toBeVisible()
    })
  })
})
