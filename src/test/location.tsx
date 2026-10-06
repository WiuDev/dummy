import { useLocation } from 'react-router'

// Mostra o endereço atual do roteador em memória, para os testes conferirem
// a URL (caminho e query string) depois das navegações.
export function LocationDisplay() {
  const { pathname, search } = useLocation()
  return <output aria-label="Endereço atual">{`${pathname}${search}`}</output>
}
