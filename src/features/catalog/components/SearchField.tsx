import { TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useEffect, useEffectEvent, useState } from 'react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

export const SEARCH_DEBOUNCE_MS = 400

export interface SearchFieldProps {
  // Busca atual, vinda da URL.
  readonly value: string
  // Chamado 400 ms depois da última tecla, só se o texto diferir da busca atual.
  readonly onSearch: (query: string) => void
}

// Campo de busca com debounce. O texto digitado fica em estado local e só vai
// para a URL depois do debounce; a URL continua sendo a fonte da verdade.
export function SearchField({ value, onSearch }: SearchFieldProps) {
  const [text, setText] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)

  // A busca mudou por fora (Voltar, "Limpar filtros"): o campo acompanha. É o
  // ajuste de estado durante o render recomendado pelo React, sempre dentro de
  // um if, para não entrar em loop.
  if (value !== syncedValue) {
    setSyncedValue(value)
    setText(value)
  }

  const debouncedText = useDebouncedValue(text, SEARCH_DEBOUNCE_MS)

  // Lê a busca atual e o callback mais recentes sem virar dependência do efeito.
  const search = useEffectEvent((query: string) => {
    if (query.trim() !== value) {
      onSearch(query)
    }
  })

  // Depende só do texto com debounce: quando a URL muda por fora, este efeito
  // não roda e não reescreve a URL com um texto antigo.
  useEffect(() => {
    search(debouncedText)
  }, [debouncedText])

  return (
    <TextInput
      type="search"
      label="Buscar produtos"
      placeholder="Nome, marca ou descrição"
      leftSection={<IconSearch size={16} aria-hidden />}
      value={text}
      onChange={(event) => {
        setText(event.currentTarget.value)
      }}
      maxLength={100}
    />
  )
}
