import {
  Anchor,
  Button,
  Card,
  Group,
  Image,
  NumberInput,
  Stack,
  Text,
  VisuallyHidden,
} from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Price } from '@/components/Price'
import { formatCents } from '@/lib/format'
import { PRODUCT_IMAGE_FALLBACK } from '@/lib/image-fallback'
import { paths } from '@/lib/paths'
import type { CartItem } from '@/schemas/cart'
import { lineTotalCents } from '../context/cart-state'

export interface CartItemRowProps {
  readonly item: CartItem
  readonly onQuantityChange: (productId: number, quantity: number) => void
  readonly onRemove: (productId: number) => void
}

// Linha do carrinho: produto, preço unitário, quantidade, total da linha e
// remoção. O campo guarda um rascunho: apagar o número para digitar outro não
// muda o carrinho, e ao sair do campo vazio a quantidade anterior volta.
export function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  const [draft, setDraft] = useState<number | string>(item.quantity)
  const [syncedQuantity, setSyncedQuantity] = useState(item.quantity)

  // A quantidade mudou por fora (outra aba, outro controle): o campo acompanha.
  if (item.quantity !== syncedQuantity) {
    setSyncedQuantity(item.quantity)
    setDraft(item.quantity)
  }

  return (
    <Card component="li" withBorder radius="md" padding="md">
      <Group align="flex-start" wrap="nowrap" gap="md">
        <Image
          src={item.thumbnail}
          alt=""
          w={72}
          h={72}
          fit="contain"
          fallbackSrc={PRODUCT_IMAGE_FALLBACK}
        />
        <Stack gap="xs" flex={1} miw={0}>
          <Anchor
            component={Link}
            to={paths.product(item.id)}
            fw={600}
            c="inherit"
          >
            {item.title}
          </Anchor>
          <Price
            price={item.price}
            discountPercentage={item.discountPercentage}
          />
          <Group align="flex-end" justify="space-between" gap="sm">
            <NumberInput
              label="Quantidade"
              aria-label={`Quantidade de ${item.title}`}
              value={draft}
              onChange={(value) => {
                setDraft(value)
                if (typeof value === 'number' && value >= 1) {
                  onQuantityChange(item.id, value)
                }
              }}
              onBlur={() => {
                if (typeof draft !== 'number') {
                  setDraft(item.quantity)
                }
              }}
              min={1}
              max={item.stock}
              clampBehavior="strict"
              allowDecimal={false}
              allowNegative={false}
              w={110}
            />
            <Text fw={700}>
              <VisuallyHidden>Total do item: </VisuallyHidden>
              {formatCents(lineTotalCents(item))}
            </Text>
            <Button
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={16} aria-hidden />}
              aria-label={`Remover ${item.title} do carrinho`}
              onClick={() => {
                onRemove(item.id)
              }}
            >
              Remover
            </Button>
          </Group>
        </Stack>
      </Group>
    </Card>
  )
}
