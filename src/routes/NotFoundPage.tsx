import { Button, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/lib/paths'

// Qualquer endereço sem rota. A URL é mantida, para quem a abriu ver o que
// digitou, e o botão leva de volta ao catálogo.
export function NotFoundPage() {
  useDocumentTitle('Página não encontrada')

  return (
    <Stack align="center" gap="md" py="xl" ta="center">
      <Title order={1}>Página não encontrada</Title>
      <Text c="dimmed">
        O endereço que você abriu não existe ou mudou de lugar.
      </Text>
      <Button component={Link} to={paths.products}>
        Ver os produtos
      </Button>
    </Stack>
  )
}
