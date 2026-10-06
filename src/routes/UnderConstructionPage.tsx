import { Code, Container, Stack, Text, Title } from '@mantine/core'
import { useLocation } from 'react-router'

// Página temporária: mostra a rota atual para comprovar que o basename e os
// deep links funcionam. Ocupa as rotas do catálogo até o PR 3b (D24). Fica
// dentro do main do PublicLayout, por isso é uma section.
export function UnderConstructionPage() {
  const { pathname } = useLocation()

  return (
    <Container component="section" size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Em construção</Title>
        <Text>
          A Loja Dummy está sendo construída: catálogo e compras com a API
          DummyJSON.
        </Text>
        <Text>
          Rota atual: <Code>{pathname}</Code>
        </Text>
      </Stack>
    </Container>
  )
}
