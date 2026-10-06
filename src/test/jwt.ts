function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

// JWT sintético (assinatura falsa) para testes que dependem da expiração.
export function createTestJwt(payload: Record<string, unknown>): string {
  return [
    encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    encodeBase64Url(JSON.stringify(payload)),
    encodeBase64Url('assinatura-de-teste'),
  ].join('.')
}

// Momento fixo (2026-01-01T00:00:00Z) para testes de expiração.
export const TEST_NOW = Date.UTC(2026, 0, 1)

export function secondsFromNow(seconds: number, now = TEST_NOW): number {
  return Math.floor(now / 1000) + seconds
}
