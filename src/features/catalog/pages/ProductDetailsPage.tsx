import {
  Badge,
  Button,
  Grid,
  Group,
  List,
  Rating,
  Skeleton,
  Stack,
  Text,
  Title,
  VisuallyHidden,
} from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { AsyncContent } from '@/components/AsyncContent'
import { EmptyState } from '@/components/EmptyState'
import { Price } from '@/components/Price'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatRating } from '@/lib/format'
import { paths } from '@/lib/paths'
import { productIdParamSchema } from '@/schemas/catalog'
import type { Product } from '@/schemas/product'
import { ProductGallery } from '../components/ProductGallery'
import { ReviewList } from '../components/ReviewList'
import { StockBadge } from '../components/StockBadge'
import { useProduct } from '../hooks/useProduct'

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function ProductDetailsSkeleton() {
  return (
    <div aria-busy="true">
      <VisuallyHidden>Carregando produto…</VisuallyHidden>
      <Grid gap="xl" aria-hidden>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Skeleton h={380} radius="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Skeleton h={12} w="30%" />
            <Skeleton h={32} w="80%" />
            <Skeleton h={16} w="40%" />
            <Skeleton h={28} w="35%" />
            <Skeleton h={80} />
          </Stack>
        </Grid.Col>
      </Grid>
    </div>
  )
}

// Conteúdo do detalhe. Nomes, descrições, avaliações e textos de garantia,
// entrega e devolução vêm da API como estão (D43).
function ProductDetails({ product }: { readonly product: Product }) {
  return (
    <Stack gap="xl">
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <ProductGallery
            key={product.id}
            images={product.images}
            title={product.title}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Stack gap={4}>
              <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
                {product.brand === undefined
                  ? product.category
                  : `${product.brand} · ${product.category}`}
              </Text>
              <Title order={1}>{product.title}</Title>
            </Stack>
            <Group gap={6}>
              <Rating
                value={product.rating}
                fractions={4}
                readOnly
                aria-hidden
              />
              <Text size="sm">
                <VisuallyHidden>Avaliação: </VisuallyHidden>
                {formatRating(product.rating)}
                <VisuallyHidden> de 5</VisuallyHidden>
              </Text>
              <Text size="sm" c="dimmed">
                ({pluralize(product.reviews.length, 'avaliação', 'avaliações')})
              </Text>
            </Group>
            <Price
              price={product.price}
              discountPercentage={product.discountPercentage}
              size="xl"
            />
            <Group gap="xs">
              <StockBadge
                stock={product.stock}
                availabilityStatus={product.availabilityStatus}
              />
              {product.stock > 0 ? (
                <Text size="sm" c="dimmed">
                  {pluralize(product.stock, 'unidade', 'unidades')}
                </Text>
              ) : null}
            </Group>
            <Text>{product.description}</Text>
            <List size="sm" spacing={4}>
              <List.Item>Garantia: {product.warrantyInformation}</List.Item>
              <List.Item>Entrega: {product.shippingInformation}</List.Item>
              <List.Item>Devolução: {product.returnPolicy}</List.Item>
            </List>
            {product.tags.length > 0 ? (
              <Group gap={6}>
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline" color="gray">
                    {tag}
                  </Badge>
                ))}
              </Group>
            ) : null}
          </Stack>
        </Grid.Col>
      </Grid>

      <Stack component="section" aria-labelledby="avaliacoes" gap="md">
        <Title order={2} id="avaliacoes">
          Avaliações de clientes
        </Title>
        <ReviewList reviews={product.reviews} />
      </Stack>
    </Stack>
  )
}

// Detalhe do produto. O id da rota é validado com Zod: id inválido e 404 da
// API mostram "Produto não encontrado", sem "Tentar novamente"; as demais
// falhas usam o ErrorState com retry.
export function ProductDetailsPage() {
  const { id } = useParams()
  const parsedId = productIdParamSchema.safeParse(id)
  const productId = parsedId.success ? parsedId.data : null
  const product = useProduct(productId)
  const navigate = useNavigate()
  const location = useLocation()

  const notFound =
    productId === null ||
    (product.status === 'error' && product.error.kind === 'not_found')

  useDocumentTitle(
    notFound
      ? 'Produto não encontrado'
      : product.status === 'success'
        ? product.data.title
        : 'Produto',
  )

  // Com histórico no app, volta para onde estava (o catálogo com os filtros);
  // num deep link, vai para o catálogo sem criar entrada nova no histórico.
  const goBack = () => {
    if (location.key === 'default') {
      void navigate(paths.products, { replace: true })
    } else {
      void navigate(-1)
    }
  }

  return (
    <Stack gap="lg">
      <div>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} aria-hidden />}
          onClick={goBack}
        >
          Voltar
        </Button>
      </div>

      {notFound ? (
        <EmptyState
          headingOrder={1}
          title="Produto não encontrado"
          description="O produto que você procura não existe ou foi removido."
        >
          <Button component={Link} to={paths.products}>
            Ver os produtos
          </Button>
        </EmptyState>
      ) : (
        <AsyncContent
          state={product}
          onRetry={product.reload}
          skeleton={<ProductDetailsSkeleton />}
        >
          {(data) => <ProductDetails product={data} />}
        </AsyncContent>
      )}
    </Stack>
  )
}
