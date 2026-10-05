import { Code, Container, Stack, Text, Title } from '@mantine/core'
import { useLocation } from 'react-router'

// Página temporária da Fase 1: mostra a rota atual para comprovar que o
// basename e os deep links funcionam. Sai na Fase 3, com as rotas reais.
export function UnderConstructionPage() {
  const { pathname } = useLocation()

  return (
    <Container component="main" size="sm" py="xl">
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
