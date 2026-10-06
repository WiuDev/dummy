import { createTheme, localStorageColorSchemeManager } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
})

// Tema claro ou escuro, salvo no navegador (D74). Sem escolha salva, vale o do
// sistema (defaultColorScheme="auto"). O script do index.html lê a mesma chave
// antes de o React montar, para a página não piscar no tema errado.
export const colorSchemeManager = localStorageColorSchemeManager({
  key: 'dummy:color-scheme',
})
