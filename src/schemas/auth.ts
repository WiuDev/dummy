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

export type AuthUser = z.infer<typeof authUserSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type CurrentUser = z.infer<typeof currentUserSchema>
export type JwtPayload = z.infer<typeof jwtPayloadSchema>
export type AuthSession = z.infer<typeof storedSessionSchema>
