// Imagem neutra (proporção 4:3) para quando a foto do produto não carrega. O
// cinza é translúcido, para combinar com o fundo dos dois temas (D74).
export const PRODUCT_IMAGE_FALLBACK = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3" fill="#868e96" fill-opacity=".2"/></svg>',
)}`
