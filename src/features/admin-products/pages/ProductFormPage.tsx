import { Button, Skeleton, Stack, VisuallyHidden } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Link, useNavigate, useParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { PageHeader } from '@/components/PageHeader'
import type { AsyncActionState } from '@/hooks/useAsyncAction'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/lib/paths'
import { productIdParamSchema } from '@/schemas/catalog'
import { ProductForm } from '../components/ProductForm'
import {
  emptyProductForm,
  toFormValues,
} from '../components/product-form-values'
import type { AdminProductFields } from '../context/overlay-state'
import { useAdminProduct } from '../hooks/useAdminProduct'
import { useProductMutations } from '../hooks/useProductMutations'

function errorOf(state: AsyncActionState<unknown>): string | undefined {
  return state.status === 'error' && state.error.kind !== 'canceled'
    ? state.error.message
    : undefined
}

function FormSkeleton() {
  return (
    <div aria-busy="true">
      <VisuallyHidden>Carregando produto…</VisuallyHidden>
      <Stack gap="md" maw={720} aria-hidden>
        <Skeleton h={56} />
        <Skeleton h={96} />
        <Skeleton h={56} />
      </Stack>
    </div>
  )
}

// Cadastro (/admin/produtos/novo) e edição (/admin/produtos/:id/editar). No
// sucesso, avisa que a gravação é simulada e volta à tabela, com replace, sem
// deixar o formulário no histórico.
export function ProductFormPage() {
  const { id } = useParams()
  const isNew = id === undefined
  const parsedId = productIdParamSchema.safeParse(id)
  const lookup = useAdminProduct(
    !isNew && parsedId.success ? parsedId.data : null,
  )
  const { create, update } = useProductMutations()
  const navigate = useNavigate()
  useDocumentTitle(isNew ? 'Novo produto' : 'Editar produto')

  const finish = (title: string) => {
    notifications.show({
      color: 'green',
      title,
      message: 'A DummyJSON simula a gravação: vale só nesta sessão.',
    })
    void navigate(paths.adminProducts, { replace: true })
  }

  if (isNew) {
    const handleCreate = async (fields: AdminProductFields) => {
      const result = await create.run(fields)
      if (result.ok) {
        finish('Produto cadastrado (simulação)')
      }
    }
    return (
      <>
        <PageHeader title="Novo produto" />
        <ProductForm
          initialValues={emptyProductForm()}
          submitLabel="Cadastrar"
          onSubmit={(fields) => {
            void handleCreate(fields)
          }}
          pending={create.state.status === 'pending'}
          error={errorOf(create.state)}
        />
      </>
    )
  }

  if (lookup.status === 'loading') {
    return (
      <>
        <PageHeader title="Editar produto" />
        <FormSkeleton />
      </>
    )
  }
  if (lookup.status === 'not_found') {
    return (
      <EmptyState
        headingOrder={1}
        title="Produto não encontrado"
        description="O produto não existe ou foi excluído nesta sessão."
      >
        <Button component={Link} to={paths.adminProducts}>
          Voltar à tabela
        </Button>
      </EmptyState>
    )
  }
  if (lookup.status === 'error') {
    return (
      <>
        <PageHeader title="Editar produto" />
        <ErrorState error={lookup.error} onRetry={lookup.reload} />
      </>
    )
  }

  const { product } = lookup
  const handleUpdate = async (fields: AdminProductFields) => {
    const result = await update.run(product, fields)
    if (result.ok) {
      finish('Alterações salvas (simulação)')
    }
  }
  return (
    <>
      <PageHeader title="Editar produto" description={product.title} />
      <ProductForm
        key={product.id}
        initialValues={toFormValues(product)}
        submitLabel="Salvar alterações"
        onSubmit={(fields) => {
          void handleUpdate(fields)
        }}
        pending={update.state.status === 'pending'}
        error={errorOf(update.state)}
      />
    </>
  )
}
