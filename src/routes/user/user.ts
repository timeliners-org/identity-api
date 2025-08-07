// src/routes/auth/profile.ts
import { FastifyInstance } from 'fastify'
import { authMiddleware } from '@/services/authMiddleware'
import { prisma } from '@/lib/prisma'

export default async function userRoute(app: FastifyInstance) {
  app.get('/', {
    preHandler: authMiddleware,
    schema: {
      tags: ['User'],
      summary: 'Get own profile',
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
                isVerified: { type: 'boolean' },
                groups: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
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

      // Fetch user's groups from the database
      const userWithGroups = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          groups: {
            select: {
              group: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

      const groups = userWithGroups?.groups.map(g => g.group.name) || []

      reply.code(200).send({
        user: {
          id: user.userId,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified,
          groups: groups
        }
      })
    } catch (error) {
      console.error('Profile fetch failed:', error)
      reply.code(500).send({ error: 'Profile fetch failed' })
    }
  })
}
