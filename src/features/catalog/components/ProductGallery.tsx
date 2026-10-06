import {
  Fieldset,
  Group,
  Image,
  Stack,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core'
import { useState } from 'react'
import { PRODUCT_IMAGE_FALLBACK } from './image-fallback'
import classes from './ProductGallery.module.css'

export interface ProductGalleryProps {
  readonly images: readonly string[]
  readonly title: string
}

// Galeria simples: a imagem principal e miniaturas que a trocam. Para começar
// de novo pela primeira imagem, a página usa a key do produto.
export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedImage = images[selectedIndex] ?? images[0] ?? null

  return (
    <Stack gap="sm">
      <Image
        src={selectedImage}
        alt={title}
        fit="contain"
        radius="md"
        className={classes.main}
        fallbackSrc={PRODUCT_IMAGE_FALLBACK}
      />
      {images.length > 1 ? (
        <Fieldset
          variant="unstyled"
          legend={<VisuallyHidden>Imagens do produto</VisuallyHidden>}
        >
          <Group gap="xs">
            {images.map((image, position) => (
              <UnstyledButton
                key={image}
                className={classes.thumb}
                aria-label={`Imagem ${position + 1} de ${images.length}`}
                aria-pressed={position === selectedIndex}
                onClick={() => {
                  setSelectedIndex(position)
                }}
              >
                <Image src={image} alt="" w={64} h={64} fit="contain" />
              </UnstyledButton>
            ))}
          </Group>
        </Fieldset>
      ) : null}
    </Stack>
  )
}
