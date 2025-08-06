// src/routes/auth/login.ts
import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { LoginSchema, formatValidationErrors } from '@/routes/schemas'
import jwtService from '@/services/jwtService'

export default async function loginRoute(app: FastifyInstance) {
  app.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'User login',
      description: 'Logs in a user with ID and password. The user must be email-verified.',
      body: {
        type: 'object',
        required: ['id', 'password'],
        properties: {
          id: {
            type: 'string',
            description: 'User ID'
          },
          password: {
            type: 'string',
            description: 'User password'
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
                isVerified: { type: 'boolean' },
                groups: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            },
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
      const validationResult = LoginSchema.safeParse(request.body)
      if (!validationResult.success) {
        return reply.code(400).send({
          error: 'Validation error',
          details: formatValidationErrors(validationResult.error.issues)
        })
      }

      const { id, password } = validationResult.data

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          passwordHash: true,
          isVerified: true,
          groups: {
            select: {
              group: {
                select: {
                  name: true
                }
              }
            }
          },
          isActive: true
        }
      })

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      if (!user.isActive) {
        return reply.code(401).send({ error: 'User account is inactive' })
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash)
      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      if (!user.isVerified) {
        return reply.code(400).send({
          error: 'Email not verified. Please check your email or request a new verification.'
        })
      }

      // Generate JWT tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        groups: user.groups.map(group => group.group.name)
      }

      const tokens = await jwtService.generateTokenPair(tokenPayload)

      reply.code(200).send({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isVerified: user.isVerified,
          groups: user.groups.map(group => group.group.name)
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      })
    } catch (error) {
      console.error('Login failed:', error)
      reply.code(500).send({ error: 'Login failed' })
    }
  })
}
