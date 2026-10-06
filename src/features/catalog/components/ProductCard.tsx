import {
  Anchor,
  Card,
  Group,
  Image,
  Rating,
  Stack,
  Text,
  Title,
  VisuallyHidden,
} from '@mantine/core'
import { Link } from 'react-router'
import { Price } from '@/components/Price'
import { formatRating } from '@/lib/format'
import { PRODUCT_IMAGE_FALLBACK } from '@/lib/image-fallback'
import { paths } from '@/lib/paths'
import type { ProductSummary } from '@/schemas/product'
import classes from './ProductCard.module.css'
import { StockBadge } from './StockBadge'

export interface ProductCardProps {
  readonly product: ProductSummary
}

// Card do catálogo. Só o título é link (nome acessível curto), mas o CSS
// Module estica a área clicável para o card inteiro.
export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card withBorder radius="md" padding="md" className={classes.card}>
      <Card.Section>
        <Image
          src={product.thumbnail}
          alt={product.title}
          h={180}
          fit="contain"
          loading="lazy"
          fallbackSrc={PRODUCT_IMAGE_FALLBACK}
        />
      </Card.Section>

      <Stack gap={6} mt="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {product.brand ?? product.category}
        </Text>
        <Title order={3} size="h5">
          <Anchor
            component={Link}
            to={paths.product(product.id)}
            c="inherit"
            underline="never"
            className={classes.link}
          >
            {product.title}
          </Anchor>
        </Title>
        <Group gap={6}>
          <Rating
            value={product.rating}
            fractions={4}
            readOnly
            size="xs"
            aria-hidden
          />
          <Text size="xs" c="dimmed">
            <VisuallyHidden>Avaliação: </VisuallyHidden>
            {formatRating(product.rating)}
          </Text>
        </Group>
        <Price
          price={product.price}
          discountPercentage={product.discountPercentage}
        />
        <div>
          <StockBadge
            stock={product.stock}
            availabilityStatus={product.availabilityStatus}
          />
        </div>
      </Stack>
    </Card>
  )
}
