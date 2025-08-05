// src/routes/auth/profile.ts
import { FastifyInstance } from 'fastify'
import { authMiddleware } from '@/services/authMiddleware'

export default async function profileRoute(app: FastifyInstance) {
  app.get('/profile', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Auth'],
      summary: 'Get user profile',
      description: 'Retrieves the profile information of the logged-in user (protected route)',
      headers: {
        type: 'object',
        properties: {
          authorization: {
            type: 'string',
            description: 'Bearer token (access token)'
          }
        },
        required: ['authorization']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                isVerified: { type: 'boolean' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // User is already verified by authMiddleware
      const user = request.user!

      reply.code(200).send({
        user: {
          id: user.userId,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified
        }
      })
    } catch (error) {
      console.error('Profile fetch failed:', error)
      reply.code(500).send({ error: 'Profile fetch failed' })
    }
  })
}
