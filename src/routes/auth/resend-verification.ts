// src/routes/auth/resend-verification.ts
import { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/services/emailService'
import { ResendVerificationSchema, formatValidationErrors } from '@/routes/schemas'

export default async function resendVerificationRoute(app: FastifyInstance) {
  app.post('/resend-verification', {
    schema: {
      tags: ['Auth'],
      summary: 'Resend verification email',
      description: 'Sends a new verification email to a user who is not yet verified',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
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
      // Zod validation
      const validationResult = ResendVerificationSchema.safeParse(request.body)
      if (!validationResult.success) {
        return reply.code(400).send({
          error: 'Validation error',
          details: formatValidationErrors(validationResult.error.issues)
        })
      }

      const { email } = validationResult.data

      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return reply.code(400).send({ error: 'User not found' })
      }

      if (user.isVerified) {
        return reply.code(400).send({ error: 'Email is already verified' })
      }

      // Invalidate old tokens
      await prisma.emailVerificationToken.updateMany({
        where: {
          user: {
            email
          },
          used: false
        },
        data: { used: true }
      })

      // Create new token
      const verificationToken = EmailService.generateVerificationToken()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      await prisma.emailVerificationToken.create({
        data: {
          token: verificationToken,
          userId: user.id,
          expiresAt
        }
      })

      // Send email
      const emailSent = await EmailService.sendVerificationEmail(user.email, verificationToken, user.username)

      if (!emailSent) {
        return reply.code(500).send({ error: 'Email could not be sent' })
      }

      reply.code(200).send({ message: 'Verification email has been resent' })
    } catch (error) {
      console.error('Resending verification email failed:', error)
      reply.code(500).send({ error: 'Error sending email' })
    }
  })
}
