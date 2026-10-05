import { expect, test } from '@playwright/test'

// No vite preview, uma rota desconhecida cai no index.html (status 200). No
// GitHub Pages quem responde é o 404.html (status 404), que também carrega a SPA.
const isDeployed = process.env.E2E_BASE_URL !== undefined

test.describe('smoke', { tag: '@smoke' }, () => {
  test('a home carrega a página em construção', async ({ page }) => {
    await page.goto('./')

    await expect(page).toHaveTitle('Loja Dummy')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Em construção' }),
    ).toBeVisible()
    await expect(page.getByText('/', { exact: true })).toBeVisible()
  })

  test('um deep link abre a rota e resiste ao recarregamento', async ({
    page,
  }) => {
    const response = await page.goto('produtos/1')

    expect(response?.status()).toBe(isDeployed ? 404 : 200)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Em construção' }),
    ).toBeVisible()
    await expect(page.getByText('/produtos/1', { exact: true })).toBeVisible()

    await page.reload()

    await expect(page.getByText('/produtos/1', { exact: true })).toBeVisible()
  })

  test('o 404.html do build é um shell funcional da aplicação', async ({
    page,
  }) => {
    const response = await page.goto('404.html')

    expect(response?.status()).toBe(200)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Em construção' }),
    ).toBeVisible()
  })
})
