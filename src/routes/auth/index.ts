// src/routes/auth/index.ts
import { FastifyInstance } from 'fastify'
import registerRoute from '@/routes/auth/register'
import loginRoute from '@/routes/auth/login'
import verifyEmailRoute from '@/routes/auth/verify-email'
import resendVerificationRoute from '@/routes/auth/resend-verification'
import refreshTokenRoute from '@/routes/auth/refresh-token'
import revokeTokenRoute from '@/routes/auth/revoke-token'
import profileRoute from '@/routes/auth/profile'

export default async function authRoutes(app: FastifyInstance) {
  // Register all auth routes
  await app.register(registerRoute)
  await app.register(loginRoute)
  await app.register(verifyEmailRoute)
  await app.register(resendVerificationRoute)
  await app.register(refreshTokenRoute)
  await app.register(revokeTokenRoute)
  await app.register(profileRoute)
}
