// src/routes/group/list.ts
import { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'

export default async function listGroupsRoute(app: FastifyInstance) {
  app.get('/list', {
    schema: {
      tags: ['Group'],
      summary: 'List all groups',
      description: 'Returns a list of all available groups with name and description',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            groups: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
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
      const groups = await prisma.group.findMany({
        select: {
          name: true,
          description: true
        }
      })

      return reply.code(200).send({
        success: true,
        groups: groups
      })
    } catch (error) {
      console.error('Error fetching groups:', error)
      return reply.code(500).send({
        error: 'Internal server error while fetching groups'
      })
    }
  })
}
