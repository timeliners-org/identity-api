// src/services/authMiddleware.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import jwtService, { TokenPayload } from '@/services/jwtService'

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: 'Authorization header missing or invalid'
      })
    }

    const token = authHeader.substring(7)

    // validate the user token with the database
    const user = await jwtService.validateUserToken(token)

    if (!user) {
      return reply.code(401).send({
        error: 'User not found or token is invalid'
      })
    }

    // Attach user information to the request
    request.user = user
  } catch (error) {
    console.error('Authentication failed:', error)
    return reply.code(401).send({
      error: 'Authentication failed'
    })
  }
}

export function registerAuthMiddleware(app: FastifyInstance) {
  app.decorate('authenticate', authMiddleware)
}
