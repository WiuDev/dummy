import { server } from './server'

// Registra cópias das requisições que chegam ao MSW, para os testes lerem
// URL, cabeçalhos e corpo depois. O setup remove o ouvinte após cada teste.
export function recordRequests(): Request[] {
  const requests: Request[] = []
  server.events.on('request:start', ({ request }) => {
    requests.push(request.clone())
  })
  return requests
}

export interface RequestSummary {
  readonly method: string
  readonly path: string
  readonly params: Record<string, string>
  readonly authorization: string | null
  readonly body: unknown
}

// Resumo de uma requisição registrada, para comparar com toEqual.
export async function summarizeRequest(
  request: Request | undefined,
): Promise<RequestSummary> {
  if (request === undefined) {
    throw new Error('Nenhuma requisição chegou ao MSW.')
  }

  const url = new URL(request.url)
  const text = await request.text()
  const body: unknown = text === '' ? undefined : JSON.parse(text)

  return {
    method: request.method,
    path: url.pathname,
    params: Object.fromEntries(url.searchParams),
    authorization: request.headers.get('Authorization'),
    body,
  }
}
