import { Alert, Button, Grid, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/features/auth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatCount } from '@/lib/format'
import { paths } from '@/lib/paths'
import { loginRedirectState } from '@/lib/redirect'
import { cartItemTitleId } from '../components/cart-item-ids'
import { CartItemList } from '../components/CartItemList'
import { CartSummary } from '../components/CartSummary'
import { OrderConfirmation } from '../components/OrderConfirmation'
import { useCart } from '../hooks/useCart'
import { useCheckout } from '../hooks/useCheckout'

// Carrinho: itens com quantidade e remoção, o resumo com os totais e o
// "Finalizar compra" (D60). Sem login, o botão leva ao login e volta para cá;
// durante o envio, o carrinho não muda; na falha, ele fica e o motivo aparece
// no resumo; no sucesso, a confirmação toma o lugar do carrinho já limpo.
export function CartPage() {
  useDocumentTitle('Carrinho')
  const { items, totals, updateQuantity, removeItem } = useCart()
  const { isAuthenticated } = useAuth()
  const { state, placeOrder } = useCheckout()
  const location = useLocation()
  const navigate = useNavigate()
  const titleRef = useRef<HTMLHeadingElement>(null)
  // Quem recebe o foco depois de uma remoção: o id do item vizinho ou o título.
  const focusAfterRemoval = useRef<number | 'title' | null>(null)

  // O foco não se perde com a linha removida (D70): vai para o item seguinte
  // (ou para o anterior, se o removido era o último) e, com o carrinho vazio,
  // para o título.
  useEffect(() => {
    const target = focusAfterRemoval.current
    if (target === null) {
      return
    }
    focusAfterRemoval.current = null
    if (target === 'title') {
      titleRef.current?.focus()
    } else {
      document.getElementById(cartItemTitleId(target))?.focus()
    }
  }, [items])

  const handleRemove = (productId: number) => {
    const index = items.findIndex((item) => item.id === productId)
    const neighbor = items[index + 1] ?? items[index - 1]
    focusAfterRemoval.current = neighbor === undefined ? 'title' : neighbor.id
    removeItem(productId)
  }

  if (state.status === 'success') {
    return (
      <>
        <PageHeader title="Carrinho" />
        <OrderConfirmation order={state.data} />
      </>
    )
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Carrinho" titleRef={titleRef} />
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

  const pending = state.status === 'pending'
  const handleCheckout = () => {
    if (isAuthenticated) {
      void placeOrder()
    } else {
      void navigate(paths.login, { state: loginRedirectState(location) })
    }
  }

  return (
    <>
      <PageHeader
        title="Carrinho"
        description={formatCount(totals.itemCount, 'item', 'itens')}
        titleRef={titleRef}
      />
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <CartItemList
            items={items}
            onQuantityChange={updateQuantity}
            onRemove={handleRemove}
            disabled={pending}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <CartSummary totals={totals}>
            {state.status === 'error' && state.error.kind !== 'canceled' ? (
              <Alert
                color="red"
                title="Não foi possível finalizar a compra"
                icon={<IconAlertCircle aria-hidden />}
              >
                {state.error.message}
              </Alert>
            ) : null}
            <Button fullWidth loading={pending} onClick={handleCheckout}>
              Finalizar compra
            </Button>
            {isAuthenticated ? null : (
              <Text size="sm" c="dimmed">
                Para finalizar, entre na sua conta. O carrinho continua aqui.
              </Text>
            )}
          </CartSummary>
        </Grid.Col>
      </Grid>
    </>
  )
}
