import { expect, test } from './support/test.ts'

// Seletor de tema (D74). Fora do smoke: não depende das fixtures, mas também
// não precisa rodar em produção.
test.describe('tema', () => {
  test('o seletor troca o tema, que continua ao recarregar', async ({
    page,
  }) => {
    const html = page.locator('html')
    const toggle = page
      .getByRole('banner')
      .getByRole('button', { name: 'Tema escuro' })

    await page.goto('produtos')

    await expect(html).toHaveAttribute('data-mantine-color-scheme', 'light')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await toggle.click()

    await expect(html).toHaveAttribute('data-mantine-color-scheme', 'dark')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await page.reload()

    await expect(html).toHaveAttribute('data-mantine-color-scheme', 'dark')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  test.describe('com o sistema no tema escuro', () => {
    test.use({ colorScheme: 'dark' })

    test('o tema do sistema vale antes de o React montar, sem piscar', async ({
      page,
    }) => {
      // Sem o JavaScript da aplicação, só o script do index.html age.
      await page.route('**/assets/*.js', (route) => route.abort())

      await page.goto('produtos')

      await expect(page.locator('html')).toHaveAttribute(
        'data-mantine-color-scheme',
        'dark',
      )
      // O fundo escuro do Mantine (dark-7) já vem do CSS.
      await expect(page.locator('body')).toHaveCSS(
        'background-color',
        'rgb(36, 36, 36)',
      )
    })

    test('a escolha salva vale mais que o sistema', async ({ page }) => {
      await page.addInitScript({
        content: `localStorage.setItem('dummy:color-scheme', 'light')`,
      })

      await page.goto('produtos')

      await expect(page.locator('html')).toHaveAttribute(
        'data-mantine-color-scheme',
        'light',
      )
      await expect(
        page.getByRole('banner').getByRole('button', { name: 'Tema escuro' }),
      ).toHaveAttribute('aria-pressed', 'false')
    })
  })
})
