// src/routes/user/get-user-by-id.ts
import { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma } from '@/lib/prisma'
import { GetUserByIdParamsSchema, formatValidationErrors } from '@/routes/schemas'
import { isAdmin } from '@/lib/groups'
import { authMiddleware } from '@/services/authMiddleware'

interface GetUserByIdParams {
  id: string
}

export default async function getUserByIdRoute(app: FastifyInstance) {
  app.get('/:id', {
    preHandler: authMiddleware,
    schema: {
      tags: ['User'],
      summary: 'Get user details (Admin only)',
      description: 'Retrieves full user information including groups. Only available for administrators.',
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
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'UUID of the user'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                isActive: { type: 'boolean' },
                isVerified: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
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
    },
    handler: async (request: FastifyRequest<{ Params: GetUserByIdParams }>, reply) => {
      try {
        // Validate parameters
        const paramsValidation = GetUserByIdParamsSchema.safeParse(request.params)
        if (!paramsValidation.success) {
          return reply.code(400).send({
            error: 'Invalid parameters',
            details: formatValidationErrors(paramsValidation.error.issues)
          })
        }

        const { id } = paramsValidation.data

        // Check if the user is an administrator
        if (!request.user || !(await isAdmin(request.user.userId))) {
          return reply.code(403).send({
            error: 'Access denied. Only administrators can retrieve user details.'
          })
        }

        // Retrieve user from the database
        const user = await prisma.user.findUnique({
          where: { id },
          include: {
            groups: {
              include: {
                group: true
              }
            }
          }
        })

        if (!user) {
          return reply.code(404).send({
            error: 'User not found'
          })
        }

        // Format response (without sensitive data like passwordHash)
        const userResponse = {
          id: user.id,
          email: user.email,
          username: user.username,
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          groups: user.groups.map(userGroup => ({
            name: userGroup.group.name,
            description: userGroup.group.description || ''
          }))
        }

        return reply.code(200).send({
          message: 'User details successfully retrieved',
          user: userResponse
        })

      } catch (error) {
        console.error('Error retrieving user details:', error)
        return reply.code(500).send({
          error: 'Internal server error while retrieving user details'
        })
      }
    }
  })
}
