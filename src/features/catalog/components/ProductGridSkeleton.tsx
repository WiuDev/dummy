import {
  Card,
  SimpleGrid,
  Skeleton,
  Stack,
  VisuallyHidden,
} from '@mantine/core'
import { CATALOG_PAGE_SIZE } from '../hooks/useProducts'

export interface ProductGridSkeletonProps {
  readonly count?: number
}

// Esqueleto da grade na primeira carga, com o mesmo layout dos cards. O texto
// oculto avisa leitores de tela; os blocos ficam fora da árvore acessível.
export function ProductGridSkeleton({
  count = CATALOG_PAGE_SIZE,
}: ProductGridSkeletonProps) {
  const keys = Array.from({ length: count }, (_, slot) => `skeleton-${slot}`)

  return (
    <div aria-busy="true">
      <VisuallyHidden>Carregando produtos…</VisuallyHidden>
      <SimpleGrid
        cols={{ base: 1, xs: 2, md: 3, lg: 4 }}
        spacing="md"
        aria-hidden
      >
        {keys.map((key) => (
          <Card key={key} withBorder radius="md" padding="md">
            <Card.Section>
              <Skeleton h={180} radius={0} />
            </Card.Section>
            <Stack gap={8} mt="sm">
              <Skeleton h={10} w="40%" />
              <Skeleton h={14} />
              <Skeleton h={14} w="70%" />
              <Skeleton h={18} w="50%" />
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </div>
  )
}
