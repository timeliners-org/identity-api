// src/routes/user/create.ts
import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/groups'
import { authMiddleware } from '@/services/authMiddleware'
import { EmailService } from '@/services/emailService'
import { CreateUserSchema, formatValidationErrors } from '@/routes/schemas'

export default async function createUserRoute(app: FastifyInstance) {
  app.post('/create', {
    preHandler: authMiddleware,
    schema: {
      tags: ['User'],
      summary: 'Create new user',
      description: 'Creates a new user (admins only)',
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
        required: ['email', 'username', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address of the new user'
          },
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
            description: 'Username (3-50 characters)'
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'Password (at least 8 characters)'
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                isVerified: { type: 'boolean' }
              }
            },
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
        403: {
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
      if (!request.user) {
        return reply.code(401).send({
          error: 'Authentication required'
        })
      }

      // Only admins can create new users
      if (!(await isAdmin(request.user.userId))) {
        return reply.code(403).send({
          error: 'Access denied. Only administrators can create new users.'
        })
      }

      // Input data validation
      const validation = CreateUserSchema.safeParse(request.body)
      if (!validation.success) {
        return reply.code(400).send({
          error: 'Validation error',
          details: formatValidationErrors(validation.error.issues)
        })
      }

      const { email, username, password } = validation.data

      // Check if email or username already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      })

      if (existingUser) {
        return reply.code(409).send({
          error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        })
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12)

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash
        }
      })

      return reply.code(201).send({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username
        },
        message: 'User successfully created'
      })
    } catch (error) {
      console.error('Error creating user:', error)
      return reply.code(500).send({
        error: 'Internal server error while creating user'
      })
    }
  })
}
