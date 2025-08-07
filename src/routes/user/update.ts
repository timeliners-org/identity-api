// src/routes/user/update.ts
import { FastifyInstance } from 'fastify'
import { authMiddleware } from '@/services/authMiddleware'
import { prisma } from '@/lib/prisma'
import { UpdateUserSchema, formatValidationErrors } from '@/routes/schemas'

export default async function updateUserRoute(app: FastifyInstance) {
  app.put('', {
    preHandler: authMiddleware,
    schema: {
      tags: ['User'],
      summary: 'Update own profile',
      description: 'Updates the profile information of the logged-in user (protected route)',
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
      body: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
            description: 'New username (optional)'
          }
        },
        additionalProperties: false
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
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
        409: {
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
      // User is already verified by authMiddleware
      const user = request.user!

      // Validate request body
      const validation = UpdateUserSchema.safeParse(request.body)
      if (!validation.success) {
        return reply.code(400).send({
          error: 'Validation error',
          details: formatValidationErrors(validation.error.issues)
        })
      }

      const { username } = validation.data

      // If no fields to update, return early
      if (!username) {
        return reply.code(400).send({
          error: 'No fields to update provided'
        })
      }

      // Check if username is already taken by another user
      if (username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username,
            NOT: {
              id: user.userId
            }
          }
        })

        if (existingUser) {
          return reply.code(409).send({
            error: 'Username already taken'
          })
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: user.userId },
        data: {
          ...(username && { username })
        },
        select: {
          id: true,
          email: true,
          username: true,
          isVerified: true,
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

      const groups = updatedUser.groups.map(g => g.group.name)

      reply.code(200).send({
        success: true,
        message: 'User profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          isVerified: updatedUser.isVerified,
          groups: groups
        }
      })
    } catch (error) {
      console.error('User update failed:', error)
      reply.code(500).send({ error: 'User update failed' })
    }
  })
}
