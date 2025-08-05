// src/routes/auth/verify-email.ts
import { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'
import { VerifyEmailQuerySchema, formatValidationErrors } from '@/routes/schemas'

export default async function verifyEmailRoute(app: FastifyInstance) {
  app.get('/verify-email', {
    schema: {
      tags: ['Auth'],
      summary: 'Verify email',
      description: 'Verifies the email address of a user via a token',
      querystring: {
        type: 'object',
        required: ['token'],
        properties: {
          token: {
            type: 'string',
            description: 'Verification token from the email'
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
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Zod validation for query parameters
      const validationResult = VerifyEmailQuerySchema.safeParse(request.query)
      if (!validationResult.success) {
        return reply.code(400).send({
          error: 'Validation error',
          details: formatValidationErrors(validationResult.error.issues)
        })
      }

      const { token } = validationResult.data

      // Search for token in the database
      const verificationToken = await prisma.emailVerificationToken.findUnique({
        where: { token },
        include: { user: true }
      })

      if (!verificationToken) {
        return reply.code(400).send({ error: 'Invalid verification token' })
      }

      if (verificationToken.used) {
        return reply.code(400).send({ error: 'Token has already been used' })
      }

      if (verificationToken.expiresAt < new Date()) {
        return reply.code(400).send({ error: 'Token has expired' })
      }

      // Mark user as verified
      await prisma.user.update({
        where: { id: verificationToken.userId! },
        data: {
          isVerified: true,
          isActive: true // Optional: also mark user as active
        }
      })

      // Mark token as used
      await prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { used: true }
      })

      reply.code(200).send({ message: 'Email successfully verified!' })
    } catch (error) {
      console.error('Email verification failed:', error)
      reply.code(500).send({ error: 'Verification failed' })
    }
  })
}
