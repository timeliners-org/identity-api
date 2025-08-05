// src/routes/index.ts
import { FastifyInstance } from 'fastify'
import authRoutes from '@/routes/auth'
import userRoutes from '@/routes/user/index'
import groupRoutes from '@/routes/group/index'

export const registerRoutes = (app: FastifyInstance) => {
  app.register(authRoutes, { prefix: '/auth' })
  app.register(userRoutes, { prefix: '/user' })
  app.register(groupRoutes, { prefix: '/group' })
}
