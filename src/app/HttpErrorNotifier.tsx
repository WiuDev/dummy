import { notifications } from '@mantine/notifications'
import { useEffect } from 'react'
import { httpErrorEvents } from '@/services/http-events'

// Mostra as falhas de comunicação (rede, tempo esgotado, 5xx e 429) avisadas
// pelo interceptor do axios. O id por tipo de falha evita notificações
// repetidas quando várias requisições falham juntas.
export function HttpErrorNotifier(): null {
  useEffect(
    () =>
      httpErrorEvents.subscribe((error) => {
        notifications.show({
          id: `http-error-${error.kind}`,
          color: 'red',
          title: 'Falha de comunicação',
          message: error.message,
        })
      }),
    [],
  )

  return null
}
