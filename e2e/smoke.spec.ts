import type { Page } from '@playwright/test'
import { expect, isDeployed, test } from './support/test.ts'

// No vite preview, uma rota desconhecida cai no index.html (status 200). No
// GitHub Pages quem responde é o 404.html (status 404), que também carrega a SPA.
const spaFallbackStatus = isDeployed ? 404 : 200

// O build grava GITHUB_SHA (ou "local") na meta app-version. No CI e no smoke
// pós-deploy, o build e os testes rodam no mesmo workflow, com o mesmo SHA.
const expectedVersion = process.env.GITHUB_SHA ?? 'local'

// O cabeçalho do PublicLayout aparece em todas as rotas.
async function expectLayout(page: Page) {
  const header = page.getByRole('banner')
  await expect(header.getByRole('link', { name: 'Loja Dummy' })).toBeVisible()
  await expect(
    header
      .getByRole('navigation', { name: 'Navegação principal' })
      .getByRole('link', { name: 'Produtos' }),
  ).toHaveAttribute('aria-current', 'page')
}

test.describe('smoke', { tag: '@smoke' }, () => {
  test('a home redireciona para o catálogo, dentro do layout', async ({
    page,
  }) => {
    await page.goto('./')

    await expect(page).toHaveURL(/\/produtos$/)
    await expect(page).toHaveTitle('Produtos · Loja Dummy')
    await expect(page.locator('meta[name="app-version"]')).toHaveAttribute(
      'content',
      expectedVersion,
    )
    await expectLayout(page)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Produtos' }),
    ).toBeVisible()
  })

  test('um deep link abre a rota e resiste ao recarregamento', async ({
    page,
  }) => {
    const response = await page.goto('produtos/1')

    expect(response?.status()).toBe(spaFallbackStatus)
    await expectLayout(page)
    await expect(page.getByRole('button', { name: 'Voltar' })).toBeVisible()

    await page.reload()

    await expect(page.getByRole('button', { name: 'Voltar' })).toBeVisible()
  })

  test('uma rota desconhecida mostra a página não encontrada', async ({
    page,
  }) => {
    const response = await page.goto('rota-que-nao-existe')

    expect(response?.status()).toBe(spaFallbackStatus)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeVisible()
    await expect(page).toHaveTitle('Página não encontrada · Loja Dummy')

    await page.getByRole('link', { name: 'Ver os produtos' }).click()

    await expect(page).toHaveURL(/\/produtos$/)
  })

  test('o 404.html do build é um shell funcional da aplicação', async ({
    page,
  }) => {
    const response = await page.goto('404.html')

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeVisible()
  })
})
