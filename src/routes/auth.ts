// src/routes/auth.ts
import { FastifyInstance } from 'fastify'
import authRoutes from '@/routes/auth/index'

export default async function authRoutesMain(app: FastifyInstance) {
  // Register all auth routes with the new modular system
  await app.register(authRoutes)
}
