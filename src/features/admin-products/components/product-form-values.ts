import type { AdminProduct } from '@/schemas/admin'
import type { ProductFormData, ProductFormValues } from '@/schemas/product-form'
import type { AdminProductFields } from '../context/overlay-state'

// Formulário de cadastro, vazio (o desconto começa em 0).
export function emptyProductForm(): ProductFormValues {
  return {
    title: '',
    description: '',
    category: null,
    brand: '',
    price: '',
    discountPercentage: 0,
    stock: '',
    thumbnail: '',
    tags: [],
  }
}

// Produto → formulário da edição, já preenchido.
export function toFormValues(product: AdminProduct): ProductFormValues {
  return {
    title: product.title,
    description: product.description,
    category: product.category,
    brand: product.brand ?? '',
    price: product.price,
    discountPercentage: product.discountPercentage,
    stock: product.stock,
    thumbnail: product.thumbnail ?? '',
    tags: [...product.tags],
  }
}

// Dados validados → campos do produto: marca e imagem vazias ficam ausentes.
export function toProductFields(data: ProductFormData): AdminProductFields {
  return {
    title: data.title,
    description: data.description,
    category: data.category,
    brand: data.brand === '' ? undefined : data.brand,
    price: data.price,
    discountPercentage: data.discountPercentage,
    stock: data.stock,
    thumbnail: data.thumbnail === '' ? undefined : data.thumbnail,
    tags: data.tags,
  }
}
