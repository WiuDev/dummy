import type { Page } from '@playwright/test'
import { sessionScript } from './support/session.ts'
import { expect, isDeployed, test } from './support/test.ts'

// Fluxo 4: o CRUD da gestão de produtos sobre a API mockada, com as alterações
// simuladas no overlay da sessão (D64).

const ONE_HOUR = 60 * 60 * 1000

function adminTable(page: Page) {
  const table = page.getByRole('table', { name: 'Produtos' })
  return {
    rows: table.getByRole('row'),
    row: (title: string) => table.getByRole('row').filter({ hasText: title }),
  }
}

async function signIn(page: Page) {
  await page.getByRole('textbox', { name: 'Usuário' }).fill('emilys')
  await page.getByLabel('Senha', { exact: true }).fill('emilyspass')
  await page.getByRole('button', { name: 'Entrar' }).click()
}

async function editMascaraPrice(page: Page, price: string) {
  await page
    .getByRole('link', { name: 'Editar Essence Mascara Lash Princess' })
    .click()
  await page.getByRole('textbox', { name: 'Preço (US$)' }).fill(price)
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
}

async function confirmIn(page: Page, dialog: string, button: string) {
  await page
    .getByRole('dialog', { name: dialog })
    .getByRole('button', { name: button })
    .click()
}

test.describe('gestão de produtos', () => {
  // As contagens e os títulos vêm das fixtures: contra a API real, não valem.
  test.skip(isDeployed, 'depende da API mockada')

  test('cria, edita e exclui produtos, e as alterações sobrevivem ao recarregar', async ({
    page,
  }) => {
    const deletes: string[] = []
    page.on('request', (request) => {
      if (request.method() === 'DELETE') {
        deletes.push(request.url())
      }
    })
    await page.addInitScript({ content: sessionScript(Date.now() + ONE_HOUR) })
    const { rows, row } = adminTable(page)

    await page.goto('admin')

    await expect(page).toHaveURL(/\/admin\/produtos$/)
    await expect(
      page.getByRole('alert').filter({ hasText: 'Alterações simuladas' }),
    ).toBeVisible()
    await expect(rows).toHaveCount(3)

    // Cadastro, com a imagem recusada fora de https.
    await page.getByRole('link', { name: 'Novo produto' }).click()
    await page
      .getByRole('textbox', { name: 'Título' })
      .fill('Luminária de mesa')
    await page
      .getByRole('textbox', { name: 'Descrição' })
      .fill('Luminária de LED com braço articulado.')
    await page.getByRole('combobox', { name: 'Categoria' }).click()
    await page.getByRole('option', { name: 'Home Decoration' }).click()
    await page.getByRole('textbox', { name: 'Preço (US$)' }).fill('59.9')
    await page.getByRole('textbox', { name: 'Estoque' }).fill('12')
    const image = page.getByRole('textbox', { name: 'URL da imagem' })
    await image.fill('http://cdn.dummyjson.com/luminaria.webp')
    await image.blur()
    await expect(
      page.getByText('Use um endereço que comece com https://.'),
    ).toBeVisible()
    await image.fill('https://cdn.dummyjson.com/luminaria.webp')
    await page.getByRole('button', { name: 'Cadastrar' }).click()

    await expect(page).toHaveURL(/\/admin\/produtos$/)
    await expect(rows.nth(1)).toContainText('Luminária de mesa')
    await expect(rows.nth(1)).toContainText('Local')

    // Edição de um item do servidor.
    await editMascaraPrice(page, '12.5')

    await expect(row('Essence Mascara Lash Princess')).toContainText('Simulado')
    await expect(row('Essence Mascara Lash Princess')).toContainText(
      'US$ 12,50',
    )

    // Exclusões: o item local sem a API e o do servidor pelo DELETE.
    await page
      .getByRole('button', { name: 'Excluir Luminária de mesa' })
      .click()
    await confirmIn(page, 'Excluir produto', 'Excluir')
    await expect(row('Luminária de mesa')).toHaveCount(0)
    expect(deletes).toEqual([])

    await page
      .getByRole('button', { name: 'Excluir Eyeshadow Palette with Mirror' })
      .click()
    await confirmIn(page, 'Excluir produto', 'Excluir')
    await expect(row('Eyeshadow Palette with Mirror')).toHaveCount(0)
    await expect(page.getByText('193 produtos')).toBeVisible()
    expect(deletes).toHaveLength(1)

    await page.reload()

    await expect(row('Essence Mascara Lash Princess')).toContainText('Simulado')
    await expect(row('Eyeshadow Palette with Mirror')).toHaveCount(0)
    await expect(page.getByText('193 produtos')).toBeVisible()
  })

  test('a busca e a página sobrevivem à ida ao formulário e à volta', async ({
    page,
  }) => {
    await page.addInitScript({ content: sessionScript(Date.now() + ONE_HOUR) })
    const search = page.getByRole('searchbox', { name: 'Buscar produtos' })
    const page2 = page.getByRole('button', { name: 'Página 2' })

    await page.goto('admin/produtos')
    await search.fill('phone')
    await expect(page.getByText('23 produtos')).toBeVisible()
    await page2.click()
    await expect(page2).toHaveAttribute('aria-current', 'page')

    await page
      .getByRole('table', { name: 'Produtos' })
      .getByRole('link', { name: /^Editar / })
      .first()
      .click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Editar produto' }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Cancelar' }).click()

    await expect(search).toHaveValue('phone')
    await expect(page2).toHaveAttribute('aria-current', 'page')
  })

  test('descartar volta aos dados da DummyJSON, e sair apaga as alterações', async ({
    page,
  }) => {
    const { row } = adminTable(page)
    const mascara = row('Essence Mascara Lash Princess')

    await page.goto('admin')
    await signIn(page)
    await expect(page).toHaveURL(/\/admin\/produtos$/)

    await editMascaraPrice(page, '12.5')
    await expect(mascara).toContainText('Simulado')
    await page
      .getByRole('button', { name: 'Descartar alterações simuladas' })
      .click()
    await confirmIn(page, 'Descartar alterações simuladas', 'Descartar')
    await expect(mascara).not.toContainText('Simulado')

    await editMascaraPrice(page, '15')
    await expect(mascara).toContainText('Simulado')
    await page.getByRole('banner').getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/produtos$/)

    await page.goto('admin')
    await signIn(page)

    await expect(mascara).toContainText('US$ 9,99')
    await expect(mascara).not.toContainText('Simulado')
  })
})
