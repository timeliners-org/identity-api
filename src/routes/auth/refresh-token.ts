// src/routes/auth/refresh-token.ts
import { FastifyInstance } from 'fastify'
import { RefreshTokenSchema, formatValidationErrors } from '@/routes/schemas'
import jwtService from '@/services/jwtService'

export default async function refreshTokenRoute(app: FastifyInstance) {
  app.post('/refresh-token', {
    schema: {
      tags: ['Auth'],
      summary: 'Renew access token',
      description: 'Renews an access token with a valid refresh token',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Refresh token'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' }
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
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Zod validation
      const validationResult = RefreshTokenSchema.safeParse(request.body)
      if (!validationResult.success) {
        return reply.code(400).send({
          error: 'Validation error',
          details: formatValidationErrors(validationResult.error.issues)
        })
      }

      const { refreshToken } = validationResult.data

      // Renew token pair
      const newTokens = await jwtService.refreshTokenPair(refreshToken)

      if (!newTokens) {
        return reply.code(401).send({
          error: 'Invalid or expired refresh token'
        })
      }

      reply.code(200).send({
        message: 'Token successfully renewed',
        tokens: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresIn: newTokens.expiresIn
        }
      })
    } catch (error) {
      console.error('Token renewal failed:', error)
      reply.code(500).send({ error: 'Token renewal failed' })
    }
  })
}
