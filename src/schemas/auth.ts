import { z } from 'zod'

export const authUserSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().min(1),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  image: z.url(),
})

// O campo do token é accessToken (versões antigas da API usavam token).
export const loginResponseSchema = authUserSchema.extend({
  accessToken: z.jwt(),
  refreshToken: z.jwt(),
})

// GET /auth/me devolve o usuário completo, inclusive dados sensíveis fictícios;
// o schema mantém só o necessário.
export const currentUserSchema = authUserSchema.extend({
  role: z.string().min(1),
})

export const jwtPayloadSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().min(1),
  iat: z.number().int(),
  exp: z.number().int(),
})

// Sessão salva no navegador (chave dummy:auth:v1).
export const storedSessionSchema = z.object({
  version: z.literal(1),
  accessToken: z.jwt(),
  expiresAt: z.number().int().positive(),
  user: authUserSchema,
})

// Formulário de login. As mensagens, em pt-BR, ficam no próprio schema, campo a
// campo, sem locale global do Zod (D59).
export const loginFormSchema = z.object({
  username: z.string().trim().min(1, 'Informe o usuário.'),
  password: z.string().min(1, 'Informe a senha.'),
})

// Caminho interno para onde voltar depois do login (D58): começa com uma única
// "/" e não tem barra invertida nem espaços, para nunca virar outra origem
// ("//evil.com", "/\evil.com") nem outro esquema ("javascript:").
export const internalPathSchema = z
  .string()
  .max(2048)
  .regex(/^\/(?![/\\])[^\s\\]*$/)

// Estado de navegação que leva ao login: de onde a pessoa veio.
export const loginRedirectStateSchema = z.object({ from: internalPathSchema })

export type AuthUser = z.infer<typeof authUserSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type CurrentUser = z.infer<typeof currentUserSchema>
export type JwtPayload = z.infer<typeof jwtPayloadSchema>
export type AuthSession = z.infer<typeof storedSessionSchema>
export type LoginFormValues = z.input<typeof loginFormSchema>
export type LoginRedirectState = z.infer<typeof loginRedirectStateSchema>
