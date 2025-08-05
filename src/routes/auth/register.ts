// src/routes/auth/register.ts
import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/services/emailService'
import { RegisterSchema, formatValidationErrors } from '@/routes/schemas'

export default async function registerRoute(app: FastifyInstance) {
  app.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register user',
      description: 'Registers a new user and sends an email verification',
      body: {
        type: 'object',
        required: ['email', 'username', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
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
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
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
      const validationResult = RegisterSchema.safeParse(request.body)
      if (!validationResult.success) {
        return reply.code(400).send({
          error: 'Validation error',
          details: formatValidationErrors(validationResult.error.issues)
        })
      }

      const { email, username, password } = validationResult.data

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
        return reply.code(400).send({
          error: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        })
      }

      const hash = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash: hash,
          isVerified: false // User is not verified initially
        }
      })

      // Create verification token
      const verificationToken = EmailService.generateVerificationToken()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Token is valid for 24 hours

      await prisma.emailVerificationToken.create({
        data: {
          token: verificationToken,
          userId: user.id,
          expiresAt
        }
      })

      // Send verification email
      const emailSent = await EmailService.sendVerificationEmail(user.email, verificationToken, user.username)

      if (!emailSent) {
        console.error('Verification email could not be sent for user:', user.id)
      }

      reply.code(201).send({
        id: user.id,
        email: user.email,
        username: user.username,
        message: 'Registration successful. Please check your email for the verification link.'
      })
    } catch (error) {
      console.error('Registration failed:', error)
      reply.code(500).send({ error: 'Registration failed' })
    }
  })
}
