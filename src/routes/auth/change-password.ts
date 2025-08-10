// src/routes/auth/login.ts
import { FastifyInstance, FastifyRequest } from 'fastify'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { ChangePasswordSchema, LoginSchema, formatValidationErrors } from '@/routes/schemas'
import jwtService from '@/services/jwtService'
import { authMiddleware } from '@/services/authMiddleware'

interface ChangePasswordParams {
  old_password: string
  new_password: string
}

export default async function changePasswordRoute(app: FastifyInstance) {
  app.post('/change-password', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Auth'],
      summary: 'Change user password',
      description: 'Allows a user to change their password.',
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
        required: ['old_password', 'new_password'],
        properties: {
          old_password: {
            type: 'string',
            description: 'User old password'
          },
          new_password: {
            type: 'string',
            description: 'User new password'
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
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: ChangePasswordParams }>, reply) => {
    try {

      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      // Zod validation
      const validationResult = ChangePasswordSchema.safeParse(request.body)
      if (!validationResult.success) {
        return reply.code(400).send({
          error: 'Validation error',
          details: formatValidationErrors(validationResult.error.issues)
        })
      }

      const { old_password, new_password } = validationResult.data

      const user = await prisma.user.findUnique({
        where: { id: request.user?.userId },
        select: {
          id: true,
          passwordHash: true,
          isActive: true,
          isVerified: true
        }
      })

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      if (!user.isActive) {
        return reply.code(401).send({ error: 'User account is inactive' })
      }

      if (!user.isVerified) {
        return reply.code(400).send({
          error: 'Email not verified. Please check your email or request a new verification.'
        })
      }

      const isValidPassword = await bcrypt.compare(old_password, user.passwordHash)
      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      const newPasswordHash = await bcrypt.hash(new_password, 10)

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash }
      })

      reply.code(200).send({
        message: 'Password changed successfully'
      })
    } catch (error) {
      console.error('Change password failed:', error)
      reply.code(500).send({ error: 'Change password failed' })
    }
  })
}
