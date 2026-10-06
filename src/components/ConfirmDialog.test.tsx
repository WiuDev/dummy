import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog'

function renderDialog(props: Partial<ConfirmDialogProps> = {}) {
  const onConfirm = vi.fn()
  const onClose = vi.fn()
  renderWithProviders(
    <ConfirmDialog
      opened
      title="Excluir produto"
      confirmLabel="Excluir"
      onConfirm={onConfirm}
      onClose={onClose}
      {...props}
    >
      Excluir “Luminária de mesa”?
    </ConfirmDialog>,
  )
  return { onConfirm, onClose, dialog: screen.getByRole('dialog') }
}

describe('ConfirmDialog', () => {
  it('mostra o título e a mensagem, com o foco no Cancelar', async () => {
    const { dialog } = renderDialog()

    expect(dialog).toHaveAccessibleName('Excluir produto')
    expect(dialog).toHaveTextContent('Excluir “Luminária de mesa”?')
    await waitFor(() => {
      expect(
        within(dialog).getByRole('button', { name: 'Cancelar' }),
      ).toHaveFocus()
    })
  })

  it('confirma ou cancela', async () => {
    const user = userEvent.setup()
    const { onConfirm, onClose, dialog } = renderDialog()

    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }))
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('durante a confirmação, fica ocupado e não fecha', async () => {
    const user = userEvent.setup()
    const { onClose, dialog } = renderDialog({ loading: true })

    expect(
      within(dialog).getByRole('button', { name: 'Excluir' }),
    ).toHaveAttribute('data-loading', 'true')
    expect(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    ).toBeDisabled()
    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }))
    await user.keyboard('{Escape}')

    expect(onClose).not.toHaveBeenCalled()
  })

  it('mostra o motivo da falha', () => {
    const { dialog } = renderDialog({
      error: 'Erro no servidor. Tente novamente.',
    })

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'Erro no servidor. Tente novamente.',
    )
  })
})
