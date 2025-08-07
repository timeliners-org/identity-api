// src/index.ts
import Fastify from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { registerRoutes } from '@/routes/index'
import tokenCleanupService from '@/services/tokenCleanupService'
import dotenv from 'dotenv'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import initGroups from '@/lib/groups'
import { initAdminUser } from '@/lib/user'

dotenv.config()

const app = Fastify({ logger: true })

// Register Swagger
app.register(swagger, {
  openapi: {
    info: {
      title: 'Identity API',
      description: 'API documentation for the Identity Server',
      version: '0.1.0',
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and user management'
      },
      {
        name: 'User',
        description: 'User-related routes'
      },
      {
        name: 'Group',
        description: 'Group-related routes'
      }
    ]
  },
})

// Register Swagger UI
app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
  uiHooks: {
    onRequest: function (request, reply, next) { next() },
    preHandler: function (request, reply, next) { next() }
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
  transformSpecificationClone: true,

})

registerRoutes(app)

// Start token cleanup service
tokenCleanupService.start()

// Graceful shutdown
process.on('SIGTERM', () => {
  tokenCleanupService.stop()
  app.close()
})

process.on('SIGINT', () => {
  tokenCleanupService.stop()
  app.close()
})

app.listen({ port: Number.parseInt(process.env.PORT || "3000"), host: '0.0.0.0' }, err => {
  if (err) throw err
})

// Generate groups
await initGroups();
await initAdminUser();