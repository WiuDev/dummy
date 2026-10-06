import { sessionScript } from './support/session.ts'
import { expect, isDeployed, test } from './support/test.ts'

// Fluxo 3: autenticação com redirecionamento, sobre a API mockada.
test.describe('autenticação', () => {
  // Usa a conta de teste e o token das fixtures: contra a API real, não vale.
  test.skip(isDeployed, 'depende da API mockada')

  test('a área administrativa exige login e, depois de entrar, volta para ela', async ({
    page,
  }) => {
    const nav = page
      .getByRole('banner')
      .getByRole('navigation', { name: 'Navegação principal' })
    const password = page.getByLabel('Senha', { exact: true })

    await page.goto('admin')

    await expect(page).toHaveURL(/\/login$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Entrar' }),
    ).toBeVisible()

    await page.getByRole('textbox', { name: 'Usuário' }).fill('emilys')
    await password.fill('errada')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByRole('alert')).toContainText(
      'Usuário ou senha inválidos.',
    )
    await expect(password).toHaveValue('')

    await password.fill('emilyspass')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // O /admin leva à gestão de produtos, no layout do admin.
    await expect(page).toHaveURL(/\/admin\/produtos$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Gestão de produtos' }),
    ).toBeVisible()
    const adminHeader = page.getByRole('banner')
    await expect(adminHeader.getByText('Emily')).toBeVisible()

    await adminHeader.getByRole('button', { name: 'Sair' }).click()

    await expect(page).toHaveURL(/\/produtos$/)
    await expect(nav.getByRole('link', { name: 'Entrar' })).toBeVisible()
  })

  test('o Entrar do cabeçalho volta para a página em que a pessoa estava', async ({
    page,
  }) => {
    const nav = page
      .getByRole('banner')
      .getByRole('navigation', { name: 'Navegação principal' })

    await page.goto('produtos/1')
    await nav.getByRole('link', { name: 'Entrar' }).click()
    await page.getByRole('textbox', { name: 'Usuário' }).fill('emilys')
    await page.getByLabel('Senha', { exact: true }).fill('emilyspass')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/produtos\/1$/)
    await expect(nav.getByText('Emily')).toBeVisible()
  })

  test('uma sessão salva vencida leva ao login, com aviso', async ({
    page,
  }) => {
    await page.addInitScript({ content: sessionScript(Date.now() - 60_000) })

    await page.goto('admin')

    await expect(page).toHaveURL(/\/login$/)
    await expect(
      page.getByRole('alert').filter({ hasText: 'Sua sessão expirou' }),
    ).toBeVisible()
  })
})
