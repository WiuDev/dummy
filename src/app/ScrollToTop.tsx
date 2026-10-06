import { useEffect, useEffectEvent } from 'react'
import { useLocation, useNavigationType } from 'react-router'

export interface ScrollToTopProps {
  // Parâmetros da query string que, ao mudar, também levam ao topo (ex.: a
  // página do catálogo). Os demais (busca, categoria) não rolam a tela.
  readonly searchParams?: readonly string[]
}

// No modo declarativo, o React Router não controla a rolagem. Este componente
// volta ao topo quando o caminho ou um dos parâmetros indicados muda. No
// Voltar e no Avançar (navegação POP), a rolagem fica com o navegador.
export function ScrollToTop({ searchParams = [] }: ScrollToTopProps): null {
  const { pathname, search } = useLocation()
  const navigationType = useNavigationType()
  const query = new URLSearchParams(search)
  const watched = searchParams
    .map((name) => `${name}=${query.get(name) ?? ''}`)
    .join('&')

  // Lê o tipo da navegação atual sem virar dependência: só o caminho e os
  // parâmetros indicados disparam o efeito.
  const scrollToTop = useEffectEvent(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0)
    }
  })

  useEffect(() => {
    scrollToTop()
  }, [pathname, watched])

  return null
}
