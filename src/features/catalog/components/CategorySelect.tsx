import { Select } from '@mantine/core'
import type { Category } from '@/schemas/product'

export interface CategorySelectProps {
  readonly categories: readonly Category[]
  // Slug da categoria atual; sem valor, o catálogo mostra todas.
  readonly value: string | undefined
  readonly onChange: (category: string | undefined) => void
  readonly disabled?: boolean
}

export function CategorySelect({
  categories,
  value,
  onChange,
  disabled = false,
}: CategorySelectProps) {
  return (
    <Select
      label="Categoria"
      placeholder="Todas as categorias"
      data={categories.map((category) => ({
        value: category.slug,
        label: category.name,
      }))}
      value={value ?? null}
      onChange={(next) => {
        onChange(next ?? undefined)
      }}
      searchable
      clearable
      clearButtonProps={{ 'aria-label': 'Limpar categoria' }}
      nothingFoundMessage="Nenhuma categoria encontrada"
      disabled={disabled}
    />
  )
}
