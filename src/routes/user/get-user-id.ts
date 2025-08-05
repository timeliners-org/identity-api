// src/routes/user/get-user-id.ts
import { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'
import { GetUserIdSchema, formatValidationErrors } from '@/routes/schemas'

export default async function getUserIdRoute(app: FastifyInstance) {
  app.post('/get-user-id', {
    schema: {
      tags: ['User'],
      summary: 'Get user ID',
      description: 'Retrieves the user ID via email or username. The logic automatically decides based on the @ symbol whether it is an email or a username.',
      body: {
        type: 'object',
        required: ['identifier'],
        properties: {
          identifier: {
            type: 'string',
            description: 'Email address or username of the user'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            userId: { type: 'string' }
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
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Zod validation
      const validationResult = GetUserIdSchema.safeParse(request.body)
      if (!validationResult.success) {
        return reply.code(400).send({
          error: 'Validation error',
          details: formatValidationErrors(validationResult.error.issues)
        })
      }

      const { identifier } = validationResult.data

      // Logic to determine whether it is an email or a username
      const isEmail = identifier.includes('@')

      let user
      if (isEmail) {
        // Search by email
        user = await prisma.user.findUnique({
          where: { email: identifier },
          select: { id: true }
        })
      } else {
        // Search by username
        user = await prisma.user.findUnique({
          where: { username: identifier },
          select: { id: true }
        })
      }

      if (!user) {
        return reply.code(404).send({
          error: isEmail
            ? 'No user found with this email address'
            : 'No user found with this username'
        })
      }

      reply.code(200).send({
        message: 'User ID successfully retrieved',
        userId: user.id
      })
    } catch (error) {
      console.error('Error retrieving user ID:', error)
      reply.code(500).send({ error: 'Error retrieving user ID' })
    }
  })
}
