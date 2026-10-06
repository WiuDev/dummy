import { Anchor, Button, Group, NumberInput, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconShoppingCartPlus } from '@tabler/icons-react'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router'
import { formatCount } from '@/lib/format'
import { paths } from '@/lib/paths'
import { type CartProduct, findCartItem } from '../context/cart-state'
import { useCart } from '../hooks/useCart'

export interface AddToCartFormProps {
  readonly product: CartProduct
}

// Quantidade e botão de adicionar, no detalhe do produto. A quantidade vai de 1
// até o que ainda resta do estoque, descontado o que já está no carrinho.
export function AddToCartForm({ product }: AddToCartFormProps) {
  const { items, addItem } = useCart()
  const [quantity, setQuantity] = useState<number | string>(1)

  if (product.stock < 1) {
    return (
      <Text c="dimmed">Produto esgotado: não há unidades para comprar.</Text>
    )
  }

  const inCart = findCartItem(items, product.id)?.quantity ?? 0
  const available = Math.max(product.stock - inCart, 0)
  const isValid =
    typeof quantity === 'number' &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= available

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid) {
      return
    }
    addItem(product, quantity)
    notifications.show({
      color: 'green',
      title: 'Produto adicionado ao carrinho',
      message: `${formatCount(quantity, 'unidade', 'unidades')} de ${product.title}.`,
    })
    setQuantity(1)
  }

  return (
    <Stack gap="xs">
      <form onSubmit={handleSubmit}>
        <Group align="flex-end" gap="sm">
          <NumberInput
            label="Quantidade"
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={Math.max(available, 1)}
            clampBehavior="strict"
            allowDecimal={false}
            allowNegative={false}
            disabled={available === 0}
            w={110}
          />
          <Button
            type="submit"
            leftSection={<IconShoppingCartPlus size={18} aria-hidden />}
            disabled={!isValid}
          >
            Adicionar ao carrinho
          </Button>
        </Group>
      </form>
      {inCart > 0 ? (
        <Text size="sm" c="dimmed">
          {available === 0
            ? 'Todas as unidades disponíveis já estão no carrinho. '
            : `${formatCount(inCart, 'unidade', 'unidades')} no carrinho. `}
          <Anchor component={Link} to={paths.cart}>
            Ver o carrinho
          </Anchor>
        </Text>
      ) : null}
    </Stack>
  )
}
