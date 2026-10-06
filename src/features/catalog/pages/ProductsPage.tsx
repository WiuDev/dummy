import { Box, Button, Flex, Stack, Text } from '@mantine/core'
import { Navigate, useLocation } from 'react-router'
import { AsyncContent } from '@/components/AsyncContent'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { PaginationNav } from '@/components/PaginationNav'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { CategorySelect } from '../components/CategorySelect'
import { ProductGrid } from '../components/ProductGrid'
import { ProductGridSkeleton } from '../components/ProductGridSkeleton'
import { SearchField } from '../components/SearchField'
import { useCatalogParams } from '../hooks/useCatalogParams'
import { useCategories } from '../hooks/useCategories'
import { useProducts } from '../hooks/useProducts'

function countLabel(total: number): string {
  if (total === 0) {
    return 'Nenhum produto'
  }
  return total === 1 ? '1 produto' : `${total} produtos`
}

// Catálogo: busca com debounce, filtro de categoria (os dois juntos combinam no
// cliente, D6) e paginação, tudo guardado na URL.
export function ProductsPage() {
  useDocumentTitle('Produtos')
  const location = useLocation()
  const { params, setQuery, setCategory, setPage, clearFilters, searchFor } =
    useCatalogParams()
  const products = useProducts(params)
  const categories = useCategories()

  // Parâmetros inválidos já caem no padrão; a URL passa à forma canônica sem
  // criar entrada no histórico.
  const canonicalSearch = searchFor({})
  if (canonicalSearch !== location.search) {
    return <Navigate replace to={{ search: canonicalSearch }} />
  }

  // Página além da última (ex.: depois de mudar a categoria): vai para a última.
  if (
    products.status === 'success' &&
    products.data.pageCount > 0 &&
    params.page > products.data.pageCount
  ) {
    return (
      <Navigate
        replace
        to={{ search: searchFor({ page: products.data.pageCount }) }}
      />
    )
  }

  const shownPage =
    products.status === 'success'
      ? products.data
      : products.status === 'idle'
        ? undefined
        : products.previousData
  const hasFilters = params.query !== '' || params.category !== undefined

  return (
    <>
      <PageHeader title="Produtos">
        <Text c="dimmed" aria-live="polite">
          {shownPage === undefined ? '' : countLabel(shownPage.total)}
        </Text>
      </PageHeader>

      <Flex
        direction={{ base: 'column', sm: 'row' }}
        align={{ base: 'stretch', sm: 'flex-end' }}
        gap="md"
        mb="lg"
      >
        <Box flex={1}>
          <SearchField value={params.query} onSearch={setQuery} />
        </Box>
        <Box w={{ base: '100%', sm: 260 }}>
          <CategorySelect
            categories={categories.status === 'success' ? categories.data : []}
            value={params.category}
            onChange={setCategory}
            disabled={categories.status !== 'success'}
          />
        </Box>
      </Flex>

      <AsyncContent
        state={products}
        onRetry={products.reload}
        skeleton={<ProductGridSkeleton />}
      >
        {(page) =>
          page.total === 0 ? (
            <EmptyState
              title="Nenhum produto encontrado"
              description={
                hasFilters ? 'Tente outra busca ou outra categoria.' : undefined
              }
            >
              {hasFilters ? (
                <Button variant="light" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              ) : null}
            </EmptyState>
          ) : (
            <Stack gap="lg">
              <ProductGrid products={page.products} />
              {page.pageCount > 1 ? (
                <PaginationNav
                  total={page.pageCount}
                  value={page.page}
                  onChange={setPage}
                />
              ) : null}
            </Stack>
          )
        }
      </AsyncContent>
    </>
  )
}
