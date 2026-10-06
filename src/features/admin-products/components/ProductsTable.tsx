import {
  Badge,
  Button,
  Group,
  Image,
  Stack,
  Table,
  Text,
  VisuallyHidden,
} from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { Link } from 'react-router'
import { formatCurrency, formatPercent } from '@/lib/format'
import { PRODUCT_IMAGE_FALLBACK } from '@/lib/image-fallback'
import { paths } from '@/lib/paths'
import type { AdminProductRow } from '../context/overlay-state'

export interface ProductsTableProps {
  readonly rows: readonly AdminProductRow[]
  readonly onDelete?: (row: AdminProductRow) => void
}

function OriginBadge({
  origin,
}: {
  readonly origin: AdminProductRow['origin']
}) {
  if (origin === 'local') {
    return (
      <Badge size="xs" variant="light" color="grape">
        Local
      </Badge>
    )
  }
  if (origin === 'edited') {
    return (
      <Badge size="xs" variant="light" color="orange">
        Simulado
      </Badge>
    )
  }
  return null
}

// Tabela da gestão de produtos. As ações de cada linha têm o título do produto
// no nome acessível ("Editar <título>", "Excluir <título>"), e os badges dizem
// o que é local ou simulado (G3, D64).
export function ProductsTable({ rows, onDelete }: ProductsTableProps) {
  return (
    <Table.ScrollContainer minWidth={760}>
      <Table aria-label="Produtos" verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Produto</Table.Th>
            <Table.Th>Categoria</Table.Th>
            <Table.Th ta="right">Preço</Table.Th>
            <Table.Th ta="right">Desconto</Table.Th>
            <Table.Th ta="right">Estoque</Table.Th>
            <Table.Th>
              <VisuallyHidden>Ações</VisuallyHidden>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.id}>
              <Table.Td>
                <Group gap="sm" wrap="nowrap">
                  <Image
                    src={row.thumbnail}
                    alt=""
                    w={40}
                    h={40}
                    fit="contain"
                    fallbackSrc={PRODUCT_IMAGE_FALLBACK}
                  />
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      {row.title}
                    </Text>
                    <OriginBadge origin={row.origin} />
                  </Stack>
                </Group>
              </Table.Td>
              <Table.Td>{row.category}</Table.Td>
              <Table.Td ta="right">{formatCurrency(row.price)}</Table.Td>
              <Table.Td ta="right">
                {formatPercent(row.discountPercentage)}
              </Table.Td>
              <Table.Td ta="right">{row.stock}</Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end" wrap="nowrap">
                  <Button
                    component={Link}
                    to={paths.adminProductEdit(row.id)}
                    variant="subtle"
                    size="compact-sm"
                    leftSection={<IconPencil size={14} aria-hidden />}
                    aria-label={`Editar ${row.title}`}
                  >
                    Editar
                  </Button>
                  {onDelete === undefined ? null : (
                    <Button
                      variant="subtle"
                      color="red"
                      size="compact-sm"
                      leftSection={<IconTrash size={14} aria-hidden />}
                      aria-label={`Excluir ${row.title}`}
                      onClick={() => {
                        onDelete(row)
                      }}
                    >
                      Excluir
                    </Button>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
