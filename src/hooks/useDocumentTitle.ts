import { useEffect } from 'react'

const APP_NAME = 'Loja Dummy'

// Define o título da aba como "<título> · Loja Dummy" e restaura o anterior no
// cleanup (ao desmontar a página ou quando o título muda).
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} · ${APP_NAME}`

    return () => {
      document.title = previousTitle
    }
  }, [title])
}
