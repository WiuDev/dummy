import {
  ActionIcon,
  Switch,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

export interface ColorSchemeToggleProps {
  // Nos menus do celular, um Switch com o texto, no lugar do ícone.
  readonly withLabel?: boolean
}

const LABEL = 'Tema escuro'

// Alterna entre o tema claro e o escuro (D74); a escolha fica salva pelo
// colorSchemeManager do MantineProvider. O nome é sempre "Tema escuro", e o
// estado (aria-pressed no ícone, checked no Switch) diz se ele está ativo. O
// ícone mostra o tema para o qual o clique leva.
export function ColorSchemeToggle({
  withLabel = false,
}: ColorSchemeToggleProps) {
  const { setColorScheme } = useMantineColorScheme()
  // Numa SPA não há servidor: o tema é lido já no primeiro render.
  const isDark =
    useComputedColorScheme('light', { getInitialValueInEffect: false }) ===
    'dark'

  if (withLabel) {
    return (
      <Switch
        label={LABEL}
        checked={isDark}
        onChange={(event) => {
          setColorScheme(event.currentTarget.checked ? 'dark' : 'light')
        }}
      />
    )
  }

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      aria-label={LABEL}
      aria-pressed={isDark}
      onClick={() => {
        setColorScheme(isDark ? 'light' : 'dark')
      }}
    >
      {isDark ? (
        <IconSun aria-hidden size={20} stroke={1.75} />
      ) : (
        <IconMoon aria-hidden size={20} stroke={1.75} />
      )}
    </ActionIcon>
  )
}
