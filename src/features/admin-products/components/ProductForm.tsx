import {
  Alert,
  Button,
  Fieldset,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  TagsInput,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'
import { Link } from 'react-router'
import { useCategories } from '@/features/catalog'
import { zodResolver } from '@/lib/forms/zodResolver'
import { paths } from '@/lib/paths'
import {
  productFormSchema,
  type ProductFormValues,
} from '@/schemas/product-form'
import type { AdminProductFields } from '../context/overlay-state'
import { toProductFields } from './product-form-values'

export interface ProductFormProps {
  readonly initialValues: ProductFormValues
  readonly submitLabel: string
  readonly onSubmit: (fields: AdminProductFields) => void
  // Envio em andamento: os campos ficam desabilitados.
  readonly pending: boolean
  // Motivo da falha do envio.
  readonly error?: string
}

// Formulário de produto (D67): @mantine/form com o zodResolver, validação no
// blur e no envio, e as categorias da API num Select pesquisável. Os valores
// iniciais valem só na montagem: a edição renderiza o formulário com a chave
// do produto.
export function ProductForm({
  initialValues,
  submitLabel,
  onSubmit,
  pending,
  error,
}: ProductFormProps) {
  const categories = useCategories()
  const form = useForm<ProductFormValues>({
    mode: 'controlled',
    initialValues,
    validate: zodResolver(productFormSchema),
    validateInputOnBlur: true,
  })

  return (
    <form
      noValidate
      onSubmit={form.onSubmit((values) => {
        onSubmit(toProductFields(productFormSchema.parse(values)))
      })}
    >
      <Fieldset variant="unstyled" disabled={pending}>
        <Stack gap="md" maw={720}>
          {error === undefined ? null : (
            <Alert
              color="red"
              title="Não foi possível salvar"
              icon={<IconAlertCircle aria-hidden />}
            >
              {error}
            </Alert>
          )}
          <TextInput label="Título" required {...form.getInputProps('title')} />
          <Textarea
            label="Descrição"
            required
            autosize
            minRows={3}
            {...form.getInputProps('description')}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Categoria"
              required
              searchable
              data={
                categories.status === 'success'
                  ? categories.data.map((category) => ({
                      value: category.slug,
                      label: category.name,
                    }))
                  : []
              }
              nothingFoundMessage="Nenhuma categoria encontrada"
              disabled={categories.status !== 'success'}
              {...form.getInputProps('category')}
            />
            <TextInput label="Marca" {...form.getInputProps('brand')} />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <NumberInput
              label="Preço (US$)"
              required
              min={0}
              decimalScale={2}
              allowNegative={false}
              {...form.getInputProps('price')}
            />
            <NumberInput
              label="Desconto (%)"
              min={0}
              max={100}
              decimalScale={2}
              allowNegative={false}
              {...form.getInputProps('discountPercentage')}
            />
            <NumberInput
              label="Estoque"
              required
              min={0}
              allowDecimal={false}
              allowNegative={false}
              {...form.getInputProps('stock')}
            />
          </SimpleGrid>
          <TextInput
            label="URL da imagem"
            description="Opcional; precisa começar com https://."
            type="url"
            inputMode="url"
            {...form.getInputProps('thumbnail')}
          />
          <TagsInput
            label="Tags"
            description="Até 10; Enter adiciona."
            maxTags={10}
            {...form.getInputProps('tags')}
          />
          <Group justify="flex-end" gap="sm">
            <Button component={Link} to={paths.adminProducts} variant="default">
              Cancelar
            </Button>
            <Button type="submit" loading={pending}>
              {submitLabel}
            </Button>
          </Group>
        </Stack>
      </Fieldset>
    </form>
  )
}
