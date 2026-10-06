import { SimpleGrid } from '@mantine/core'
import type { ProductSummary } from '@/schemas/product'
import { ProductCard } from './ProductCard'
import classes from './ProductGrid.module.css'

export interface ProductGridProps {
  readonly products: readonly ProductSummary[]
}

// Grade responsiva: 1 coluna no celular e até 4 em telas largas.
export function ProductGrid({ products }: ProductGridProps) {
  return (
    <SimpleGrid
      component="ul"
      aria-label="Produtos"
      cols={{ base: 1, xs: 2, md: 3, lg: 4 }}
      spacing="md"
      className={classes.list}
    >
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </SimpleGrid>
  )
}
