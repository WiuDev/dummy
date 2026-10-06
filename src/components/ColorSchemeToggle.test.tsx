import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { ColorSchemeToggle } from './ColorSchemeToggle'

const appliedScheme = () =>
  document.documentElement.getAttribute('data-mantine-color-scheme')
const savedScheme = () => window.localStorage.getItem('dummy:color-scheme')

// No jsdom, o matchMedia do setup nunca casa: o tema do sistema é o claro.
describe('ColorSchemeToggle', () => {
  it('sem escolha salva, segue o sistema; o clique troca e salva o tema', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ColorSchemeToggle />)
    const toggle = screen.getByRole('button', { name: 'Tema escuro' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(appliedScheme()).toBe('light')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(appliedScheme()).toBe('dark')
    expect(savedScheme()).toBe('dark')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(appliedScheme()).toBe('light')
    expect(savedScheme()).toBe('light')
  })

  it('começa com o tema salvo', () => {
    window.localStorage.setItem('dummy:color-scheme', 'dark')
    renderWithProviders(<ColorSchemeToggle />)

    expect(screen.getByRole('button', { name: 'Tema escuro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(appliedScheme()).toBe('dark')
  })

  it('com texto, é um Switch', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ColorSchemeToggle withLabel />)
    const toggle = screen.getByRole('switch', { name: 'Tema escuro' })
    expect(toggle).not.toBeChecked()

    await user.click(toggle)

    expect(toggle).toBeChecked()
    expect(appliedScheme()).toBe('dark')
    expect(savedScheme()).toBe('dark')
  })
})
