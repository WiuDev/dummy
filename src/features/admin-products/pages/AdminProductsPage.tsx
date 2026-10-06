import {
  Box,
  Button,
  Group,
  Skeleton,
  Stack,
  VisuallyHidden,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArrowBackUp, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { AsyncContent } from '@/components/AsyncContent'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { PaginationNav } from '@/components/PaginationNav'
import { SearchField } from '@/features/catalog'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatCount } from '@/lib/format'
import { paths } from '@/lib/paths'
import { ProductsTable } from '../components/ProductsTable'
import {
  type AdminProductRow,
  applyOverlay,
  hasChanges,
} from '../context/overlay-state'
import { useAdminProductPage } from '../hooks/useAdminProductPage'
import { useAdminProducts } from '../hooks/useAdminProducts'
import { useProductMutations } from '../hooks/useProductMutations'

const SIMULATION_NOTE = 'A DummyJSON simula a gravação: vale só nesta sessão.'

function TableSkeleton() {
  return (
    <div aria-busy="true">
      <VisuallyHidden>Carregando produtos…</VisuallyHidden>
      <Stack gap="xs" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} h={48} radius="sm" />
        ))}
      </Stack>
    </div>
  )
}

// Gestão de produtos: a página do servidor, pelas rotas /auth, com as
// alterações simuladas do overlay por cima (D64). A busca e a página ficam no
// AdminProductsProvider (G2). Excluir e descartar pedem confirmação.
export function AdminProductsPage() {
  useDocumentTitle('Gestão de produtos')
  const { overlay, filters, setQuery, setPage, discard } = useAdminProducts()
  const serverPage = useAdminProductPage(filters)
  const { remove } = useProductMutations()
  const [toDelete, setToDelete] = useState<AdminProductRow | null>(null)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)

  const shownPage =
    serverPage.status === 'success'
      ? serverPage.data
      : serverPage.status === 'idle'
        ? undefined
        : serverPage.previousData
  const shownTotal =
    shownPage === undefined
      ? undefined
      : applyOverlay(shownPage, overlay, filters).total

  const askToDelete = (row: AdminProductRow) => {
    remove.reset()
    setToDelete(row)
  }

  const confirmDelete = async () => {
    if (toDelete === null) {
      return
    }
    const result = await remove.run(toDelete)
    if (result.ok) {
      notifications.show({
        color: 'green',
        title: 'Produto excluído (simulação)',
        message: SIMULATION_NOTE,
      })
      setToDelete(null)
    }
  }

  const confirmDiscard = () => {
    discard()
    setConfirmingDiscard(false)
    notifications.show({
      title: 'Alterações simuladas descartadas',
      message: 'A tabela voltou aos dados da DummyJSON.',
    })
  }

  return (
    <>
      <PageHeader
        title="Gestão de produtos"
        description={
          <span aria-live="polite">
            {shownTotal === undefined
              ? ''
              : formatCount(shownTotal, 'produto', 'produtos')}
          </span>
        }
      >
        <Group gap="sm">
          <Button
            variant="default"
            leftSection={<IconArrowBackUp size={16} aria-hidden />}
            disabled={!hasChanges(overlay)}
            onClick={() => {
              setConfirmingDiscard(true)
            }}
          >
            Descartar alterações simuladas
          </Button>
          <Button
            component={Link}
            to={paths.adminProductNew}
            leftSection={<IconPlus size={16} aria-hidden />}
          >
            Novo produto
          </Button>
        </Group>
      </PageHeader>

      <Box maw={420} mb="lg">
        <SearchField value={filters.query} onSearch={setQuery} />
      </Box>

      <AsyncContent
        state={serverPage}
        onRetry={serverPage.reload}
        skeleton={<TableSkeleton />}
      >
        {(page) => {
          const view = applyOverlay(page, overlay, filters)
          if (view.total === 0) {
            return (
              <EmptyState
                title="Nenhum produto encontrado"
                description={
                  filters.query === '' ? undefined : 'Tente outra busca.'
                }
              />
            )
          }
          return (
            <Stack gap="lg">
              <ProductsTable rows={view.rows} onDelete={askToDelete} />
              {view.pageCount > 1 ? (
                <PaginationNav
                  total={view.pageCount}
                  value={filters.page}
                  onChange={setPage}
                />
              ) : null}
            </Stack>
          )
        }}
      </AsyncContent>

      <ConfirmDialog
        opened={toDelete !== null}
        title="Excluir produto"
        confirmLabel="Excluir"
        loading={remove.state.status === 'pending'}
        error={
          remove.state.status === 'error' &&
          remove.state.error.kind !== 'canceled'
            ? remove.state.error.message
            : undefined
        }
        onConfirm={() => {
          void confirmDelete()
        }}
        onClose={() => {
          setToDelete(null)
        }}
      >
        Excluir “{toDelete?.title}”? A exclusão é simulada e vale só nesta
        sessão.
      </ConfirmDialog>

      <ConfirmDialog
        opened={confirmingDiscard}
        title="Descartar alterações simuladas"
        confirmLabel="Descartar"
        onConfirm={confirmDiscard}
        onClose={() => {
          setConfirmingDiscard(false)
        }}
      >
        Os cadastros, as edições e as exclusões desta sessão serão desfeitos, e
        a tabela volta aos dados da DummyJSON.
      </ConfirmDialog>
    </>
  )
}
