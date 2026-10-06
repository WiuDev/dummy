import { Button, Grid } from '@mantine/core'
import { Link } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatCount } from '@/lib/format'
import { paths } from '@/lib/paths'
import { CartItemList } from '../components/CartItemList'
import { CartSummary } from '../components/CartSummary'
import { useCart } from '../hooks/useCart'

// Carrinho: itens com quantidade e remoção, e o resumo com os totais. O
// "Finalizar compra" chega com o checkout, na Fase 5.
export function CartPage() {
  useDocumentTitle('Carrinho')
  const { items, totals, updateQuantity, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Carrinho" />
        <EmptyState
          title="Seu carrinho está vazio"
          description="Escolha os produtos no catálogo e adicione-os aqui."
        >
          <Button component={Link} to={paths.products}>
            Ver os produtos
          </Button>
        </EmptyState>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Carrinho"
        description={formatCount(totals.itemCount, 'item', 'itens')}
      />
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <CartItemList
            items={items}
            onQuantityChange={updateQuantity}
            onRemove={removeItem}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <CartSummary totals={totals} />
        </Grid.Col>
      </Grid>
    </>
  )
}
