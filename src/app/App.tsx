import '@mantine/core/styles.css'
import { MantineProvider } from '@mantine/core'
import { AppRoutes } from './AppRoutes'
import { theme } from './theme'

export function App() {
  return (
    <MantineProvider theme={theme}>
      <AppRoutes />
    </MantineProvider>
  )
}
