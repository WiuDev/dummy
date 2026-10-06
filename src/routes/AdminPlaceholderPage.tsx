import { Text } from '@mantine/core'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/features/auth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

// Página provisória da área administrativa (D62), que existe para o fluxo de
// redirecionamento. A gestão de produtos da Fase 6 a substitui.
export function AdminPlaceholderPage() {
  useDocumentTitle('Área administrativa')
  const { user } = useAuth()

  return (
    <>
      <PageHeader
        title="Área administrativa"
        description={user === null ? undefined : `Olá, ${user.firstName}.`}
      />
      <Text>A gestão de produtos está em construção.</Text>
    </>
  )
}
