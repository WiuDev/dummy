import { Box } from '@mantine/core'
import { Navigate, useLocation } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { redirectTarget } from '@/lib/redirect'
import { LoginForm } from '../components/LoginForm'
import { useAuth } from '../hooks/useAuth'

// Login, só para visitantes. Logado, inclusive logo depois de entrar, volta à
// página de origem (o from validado do state) sem deixar o login no histórico
// (D58).
export function LoginPage() {
  useDocumentTitle('Entrar')
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (isAuthenticated) {
    return <Navigate to={redirectTarget(location.state)} replace />
  }

  return (
    <Box maw={420} mx="auto">
      <PageHeader
        title="Entrar"
        description="Entre na sua conta para finalizar a compra e acessar a área administrativa."
      />
      <LoginForm />
    </Box>
  )
}
