import {
  Alert,
  Button,
  Code,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'
import { useCallback } from 'react'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { zodResolver } from '@/lib/forms/zodResolver'
import { type LoginFormValues, loginFormSchema } from '@/schemas/auth'
import { useAuth } from '../hooks/useAuth'

const INVALID_CREDENTIALS = 'Usuário ou senha inválidos.'

// Formulário de login (D59): validação com Zod no envio, erro da API num alerta
// e autocomplete para os gerenciadores de senha. Depois de entrar, quem leva à
// página de origem é a LoginPage.
export function LoginForm() {
  const { login } = useAuth()
  const form = useForm<LoginFormValues>({
    // Controlado: apagar a senha não remonta o campo, que recebe o foco.
    mode: 'controlled',
    initialValues: { username: '', password: '' },
    validate: zodResolver(loginFormSchema),
  })
  const { state, run } = useAsyncAction(
    useCallback(
      (signal: AbortSignal, values: LoginFormValues) =>
        login(values, { signal }),
      [login],
    ),
  )

  const signIn = async (values: LoginFormValues) => {
    const result = await run(loginFormSchema.parse(values))
    // Credenciais erradas: a senha sai do campo, que recebe o foco.
    if (!result.ok && result.error.kind === 'bad_request') {
      form.setFieldValue('password', '')
      form.getInputNode('password')?.focus()
    }
  }

  return (
    <form
      noValidate
      onSubmit={form.onSubmit((values) => {
        void signIn(values)
      })}
    >
      <Stack gap="md">
        {state.status === 'error' && state.error.kind !== 'canceled' ? (
          <Alert
            color="red"
            title="Não foi possível entrar"
            icon={<IconAlertCircle aria-hidden />}
          >
            {state.error.kind === 'bad_request'
              ? INVALID_CREDENTIALS
              : state.error.message}
          </Alert>
        ) : null}
        <TextInput
          label="Usuário"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          {...form.getInputProps('username')}
        />
        <PasswordInput
          label="Senha"
          name="password"
          autoComplete="current-password"
          visibilityToggleFocusable
          visibilityToggleButtonProps={{ 'aria-label': 'Mostrar a senha' }}
          {...form.getInputProps('password')}
        />
        <Button type="submit" loading={state.status === 'pending'}>
          Entrar
        </Button>
        <Text size="sm" c="dimmed">
          Para testar, use a conta pública da DummyJSON: usuário{' '}
          <Code>emilys</Code> e senha <Code>emilyspass</Code>.
        </Text>
      </Stack>
    </form>
  )
}
