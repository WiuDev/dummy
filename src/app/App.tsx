import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { AuthProvider } from '@/features/auth'
import { CartProvider } from '@/features/cart'
import { AppRoutes } from './AppRoutes'
import { HttpErrorNotifier } from './HttpErrorNotifier'
import { ScrollToTop } from './ScrollToTop'
import { theme } from './theme'

// A página do catálogo (?pagina=, D36) também leva ao topo ao mudar.
const SCROLL_TO_TOP_PARAMS = ['pagina'] as const

export function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <HttpErrorNotifier />
      <ScrollToTop searchParams={SCROLL_TO_TOP_PARAMS} />
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </MantineProvider>
  )
}
