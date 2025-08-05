// src/routes/group/user.ts
import { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/groups'
import { authMiddleware } from '@/services/authMiddleware'
import { UserGroupSchema, formatValidationErrors } from '@/routes/schemas'

export default async function groupUserRoute(app: FastifyInstance) {
  app.get('/:id/groups', {
    preHandler: authMiddleware,
    schema: {
      tags: ['User'],
      summary: 'Get groups of a specific user',
      description: 'Retrieves the groups of a specific user (admins only)',
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
      params: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User ID of the user whose groups should be retrieved'
          }
        },
        required: ['id']
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
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
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
        },
        403: {
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

      // Only admins can retrieve groups of other users
      if (!(await isAdmin(request.user.userId))) {
        return reply.code(403).send({
          error: 'Access denied. Only administrators can view groups of other users.'
        })
      }

      // Parameter validation
      const validation = UserGroupSchema.safeParse(request.params)
      if (!validation.success) {
        return reply.code(400).send({
          error: 'Validation error',
          details: formatValidationErrors(validation.error.issues)
        })
      }

      const targetUserId = validation.data.id

      // Retrieve user with groups
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          username: true,
          id: true,
          groups: {
            select: {
              group: {
                select: {
                  name: true,
                  description: true
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

      return reply.code(200).send({
        success: true,
        userId: targetUserId,
        username: user.username,
        groups: user.groups.map(g => ({
          name: g.group.name,
          description: g.group.description
        }))
      })
    } catch (error) {
      console.error('Error fetching user groups:', error)
      return reply.code(500).send({
        error: 'Internal server error while fetching user groups'
      })
    }
  })
}
