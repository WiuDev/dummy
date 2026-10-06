import { Group, Pagination } from '@mantine/core'

export interface PaginationNavProps {
  // Quantidade de páginas.
  readonly total: number
  readonly value: number
  readonly onChange: (page: number) => void
}

const CONTROL_LABELS = {
  first: 'Primeira página',
  previous: 'Página anterior',
  next: 'Próxima página',
  last: 'Última página',
} as const

// Paginação dentro de um nav "Paginação", com os rótulos em pt-BR: cada página
// é "Página N" para os leitores de tela.
export function PaginationNav({ total, value, onChange }: PaginationNavProps) {
  return (
    <Group component="nav" aria-label="Paginação" justify="center">
      <Pagination
        total={total}
        value={value}
        onChange={onChange}
        getItemProps={(page) => ({ 'aria-label': `Página ${page}` })}
        getControlProps={(control) => ({
          'aria-label': CONTROL_LABELS[control],
        })}
      />
    </Group>
  )
}
