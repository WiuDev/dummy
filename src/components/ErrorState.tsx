import { Alert, Button, Stack, Text } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { AppError } from '@/lib/errors'

export interface ErrorStateProps {
  readonly error: AppError
  readonly onRetry: () => void
}

// Falha ao carregar dados: mostra a mensagem amigável do AppError (o Alert tem
// role="alert") e permite tentar de novo.
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Alert
      color="red"
      variant="light"
      title="Não foi possível carregar"
      icon={<IconAlertTriangle aria-hidden />}
    >
      <Stack gap="sm" align="flex-start">
        <Text size="sm">{error.message}</Text>
        <Button variant="light" color="red" onClick={onRetry}>
          Tentar novamente
        </Button>
      </Stack>
    </Alert>
  )
}
