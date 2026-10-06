import { type JwtPayload, jwtPayloadSchema } from '@/schemas/auth'

function decodeBase64Url(segment: string): string | null {
  try {
    const base64 = segment.replaceAll('-', '+').replaceAll('_', '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

// Lê o payload sem validar a assinatura (isso é papel da API). Serve para
// saber a expiração da sessão no navegador.
export function decodeJwtPayload(token: string): JwtPayload | null {
  const segments = token.split('.')
  const payloadSegment = segments[1]
  if (segments.length !== 3 || payloadSegment === undefined) {
    return null
  }

  const json = decodeBase64Url(payloadSegment)
  if (json === null) {
    return null
  }

  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return null
  }

  const result = jwtPayloadSchema.safeParse(data)
  return result.success ? result.data : null
}

// Expiração do token em milissegundos desde a época Unix.
export function getJwtExpiration(token: string): number | null {
  const payload = decodeJwtPayload(token)
  return payload === null ? null : payload.exp * 1000
}
