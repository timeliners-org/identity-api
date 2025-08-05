// src/routes/user/group.ts
import { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'
import { authMiddleware } from '@/services/authMiddleware'

export default async function userGroupRoute(app: FastifyInstance) {
  app.get('/group', {
    preHandler: authMiddleware,
    schema: {
      tags: ['User'],
      summary: 'Get own user groups',
      description: 'Retrieves the groups of the own account',
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
            success: { type: 'boolean' },
            userId: { type: 'string' },
            username: { type: 'string' },
            groups: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({
          error: 'Authentication required'
        })
      }

      // Retrieve user with groups
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          username: true,
          id: true,
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

      if (!user) {
        return reply.code(404).send({
          error: 'User not found'
        })
      }

      const groups = user.groups.map(g => g.group.name)

      return reply.code(200).send({
        success: true,
        userId: request.user.userId,
        username: user.username,
        groups
      })
    } catch (error) {
      console.error('Error fetching own user groups:', error)
      return reply.code(500).send({
        error: 'Internal server error while fetching own user groups'
      })
    }
  })
}
