import { Box, Button, Skeleton, Stack, VisuallyHidden } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { Link } from 'react-router'
import { AsyncContent } from '@/components/AsyncContent'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { PaginationNav } from '@/components/PaginationNav'
import { SearchField } from '@/features/catalog'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatCount } from '@/lib/format'
import { paths } from '@/lib/paths'
import { ProductsTable } from '../components/ProductsTable'
import { applyOverlay } from '../context/overlay-state'
import { useAdminProductPage } from '../hooks/useAdminProductPage'
import { useAdminProducts } from '../hooks/useAdminProducts'

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
// AdminProductsProvider (G2).
export function AdminProductsPage() {
  useDocumentTitle('Gestão de produtos')
  const { overlay, filters, setQuery, setPage } = useAdminProducts()
  const serverPage = useAdminProductPage(filters)

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
        <Button
          component={Link}
          to={paths.adminProductNew}
          leftSection={<IconPlus size={16} aria-hidden />}
        >
          Novo produto
        </Button>
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
              <ProductsTable rows={view.rows} />
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
    </>
  )
}
