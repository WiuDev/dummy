import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { AppRoutes } from './AppRoutes'
import { HttpErrorNotifier } from './HttpErrorNotifier'
import { theme } from './theme'

export function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <HttpErrorNotifier />
      <AppRoutes />
    </MantineProvider>
  )
}
