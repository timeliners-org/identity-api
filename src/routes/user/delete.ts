// src/routes/user/delete.ts
import { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma } from '@/lib/prisma'
import { DeleteUserQuerySchema, formatValidationErrors } from '@/routes/schemas'
import { authMiddleware } from '@/services/authMiddleware'

interface DeleteUserQuery {
  confirm: 'true'
}

export default async function deleteUserRoute(app: FastifyInstance) {
  app.delete('', {
    preHandler: authMiddleware,
    schema: {
      tags: ['User'],
      summary: 'Delete own user profile',
      description: 'Permanently deletes the authenticated user\'s profile. Requires confirmation parameter.',
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
      querystring: {
        type: 'object',
        required: ['confirm'],
        properties: {
          confirm: {
            type: 'string',
            enum: ['true'],
            description: 'Must be set to "true" to confirm deletion'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
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
    handler: async (request: FastifyRequest<{ Querystring: DeleteUserQuery }>, reply) => {
      try {
        // Validate query parameters
        const queryValidation = DeleteUserQuerySchema.safeParse(request.query)
        if (!queryValidation.success) {
          return reply.code(400).send({
            error: 'Invalid parameters',
            details: formatValidationErrors(queryValidation.error.issues)
          })
        }

        // Ensure user is authenticated
        if (!request.user) {
          return reply.code(401).send({
            error: 'Authentication required'
          })
        }

        const userId = request.user.userId

        // Check if the user exists
        const existingUser = await prisma.user.findUnique({
          where: { id: userId }
        })

        if (!existingUser) {
          return reply.code(404).send({
            error: 'User not found'
          })
        }

        // Delete the user using a transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
          // Delete user-group relationships
          await tx.userGroup.deleteMany({
            where: { userId }
          })

          // Delete refresh tokens
          await tx.refreshToken.deleteMany({
            where: { userId }
          })

          // Delete email verification tokens
          await tx.emailVerificationToken.deleteMany({
            where: { userId }
          })

          // Finally, delete the user
          await tx.user.delete({
            where: { id: userId }
          })
        })

        console.log(`User ${userId} successfully deleted their profile`)

        return reply.code(200).send({
          message: 'User profile successfully deleted'
        })

      } catch (error) {
        console.error('Error deleting user profile:', error)
        return reply.code(500).send({
          error: 'Internal server error while deleting user profile'
        })
      }
    }
  })
}
