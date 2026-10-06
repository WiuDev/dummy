import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { categoriesSchema } from '@/schemas/product'
import categoriesFixture from '@/test/fixtures/categories.json'
import { renderWithProviders } from '@/test/render'
import { CategorySelect } from './CategorySelect'

const categories = categoriesSchema.parse(categoriesFixture)

describe('CategorySelect', () => {
  it('lista as categorias e avisa a escolhida', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <CategorySelect
        categories={categories}
        value={undefined}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: 'Categoria' }))
    await user.click(await screen.findByRole('option', { name: 'Smartphones' }))

    expect(onChange).toHaveBeenCalledWith('smartphones')
  })

  it('mostra a categoria atual e permite limpar o filtro', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <CategorySelect
        categories={categories}
        value="smartphones"
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Categoria' })).toHaveValue(
      'Smartphones',
    )
    // O Mantine deixa o botão de limpar fora da árvore acessível (aria-hidden,
    // é um atalho de mouse), então ele não tem nome acessível; pelo teclado,
    // escolher a mesma opção de novo desfaz a seleção (teste abaixo).
    await user.click(screen.getByRole('button', { hidden: true }))

    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('pelo teclado, escolher a categoria atual de novo limpa o filtro', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <CategorySelect
        categories={categories}
        value="smartphones"
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: 'Categoria' }))
    await user.click(await screen.findByRole('option', { name: 'Smartphones' }))

    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('fica desabilitado enquanto as categorias não estão disponíveis', () => {
    renderWithProviders(
      <CategorySelect
        categories={[]}
        value={undefined}
        onChange={vi.fn()}
        disabled
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Categoria' })).toBeDisabled()
  })
})
