// src/routes/auth/revoke-token.ts
import { FastifyInstance } from 'fastify'
import { RevokeTokenSchema, formatValidationErrors } from '@/routes/schemas'
import jwtService from '@/services/jwtService'

export default async function revokeTokenRoute(app: FastifyInstance) {
  app.post('/revoke-token', {
    schema: {
      tags: ['Auth'],
      summary: 'Revoke refresh token',
      description: 'Revokes a refresh token (logout)',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Refresh token to revoke'
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
      const validationResult = RevokeTokenSchema.safeParse(request.body)
      if (!validationResult.success) {
        return reply.code(400).send({
          error: 'Validation error',
          details: formatValidationErrors(validationResult.error.issues)
        })
      }

      const { refreshToken } = validationResult.data

      // Revoke token
      await jwtService.revokeRefreshToken(refreshToken)

      reply.code(200).send({
        message: 'Token successfully revoked'
      })
    } catch (error) {
      console.error('Token revocation failed:', error)
      reply.code(500).send({ error: 'Token revocation failed' })
    }
  })

  // Route to revoke all tokens of a user
  app.post('/revoke-all-tokens', {
    schema: {
      tags: ['Auth'],
      summary: 'Revoke all refresh tokens',
      description: 'Revokes all refresh tokens of a user (logout from all devices)',
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
            message: { type: 'string' }
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
      const authHeader = request.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({
          error: 'Authorization header missing or invalid'
        })
      }

      const accessToken = authHeader.substring(7)
      const payload = jwtService.verifyAccessToken(accessToken)

      if (!payload) {
        return reply.code(401).send({
          error: 'Invalid access token'
        })
      }

      // Revoke all tokens of the user
      await jwtService.revokeAllUserRefreshTokens(payload.userId)

      reply.code(200).send({
        message: 'All tokens successfully revoked'
      })
    } catch (error) {
      console.error('Revocation of all tokens failed:', error)
      reply.code(500).send({ error: 'Revocation of all tokens failed' })
    }
  })
}
