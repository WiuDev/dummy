import type { AppError } from '@/lib/errors'
import { createEventChannel } from '@/lib/events'

export interface UnauthorizedEvent {
  // expired: a sessão salva venceu antes do envio; rejected: a API respondeu 401.
  readonly reason: 'expired' | 'rejected'
  readonly url: string | undefined
}

// Falhas de comunicação (rede, tempo esgotado, servidor e excesso de
// requisições), exibidas pelo HttpErrorNotifier.
export const httpErrorEvents = createEventChannel<AppError>()

// Sessão inválida em rota autenticada; quem cuida da sessão encerra o login.
export const unauthorizedEvents = createEventChannel<UnauthorizedEvent>()
