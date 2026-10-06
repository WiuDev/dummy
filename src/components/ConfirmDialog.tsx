import { Alert, Button, Group, Modal, Stack } from '@mantine/core'
import type { ReactNode } from 'react'

export interface ConfirmDialogProps {
  readonly opened: boolean
  readonly title: string
  // Texto do botão que confirma (ex.: "Excluir").
  readonly confirmLabel: string
  readonly onConfirm: () => void
  readonly onClose: () => void
  // Confirmação em andamento: o botão fica ocupado e o diálogo não fecha.
  readonly loading?: boolean
  // Motivo da falha da confirmação, mostrado no próprio diálogo.
  readonly error?: string
  // A mensagem do diálogo.
  readonly children: ReactNode
}

// Diálogo de confirmação para ações destrutivas, como excluir um produto. O
// foco começa no Cancelar, a opção segura.
export function ConfirmDialog({
  opened,
  title,
  confirmLabel,
  onConfirm,
  onClose,
  loading = false,
  error,
  children,
}: ConfirmDialogProps) {
  const close = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={title}
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      closeButtonProps={{ 'aria-label': 'Fechar' }}
    >
      <Stack gap="md">
        <div>{children}</div>
        {error === undefined ? null : <Alert color="red">{error}</Alert>}
        <Group justify="flex-end" gap="sm">
          <Button
            variant="default"
            onClick={close}
            disabled={loading}
            data-autofocus
          >
            Cancelar
          </Button>
          <Button color="red" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
