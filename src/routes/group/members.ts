// src/routes/group/members.ts
import { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/groups'
import { authMiddleware } from '@/services/authMiddleware'
import { GroupMemberSchema, formatValidationErrors } from '@/routes/schemas'

export default async function groupMembersRoute(app: FastifyInstance) {
  app.get('/:group/member', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Group'],
      summary: 'Get group members',
      description: 'Retrieves all members of a specific group (admins only)',
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
      params: {
        type: 'object',
        properties: {
          group: {
            type: 'string',
            description: 'Name of the group'
          }
        },
        required: ['group']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            group: { type: 'string' },
            members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  username: { type: 'string' }
                }
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
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
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
      // Only admins can use this route
      if (!request.user || !(await isAdmin(request.user.userId))) {
        return reply.code(403).send({
          error: 'Access denied. Only administrators can view group members.'
        })
      }

      // Parameter validation
      const validation = GroupMemberSchema.safeParse(request.params)
      if (!validation.success) {
        return reply.code(400).send({
          error: 'Validation error',
          details: formatValidationErrors(validation.error.issues)
        })
      }

      const { group: groupName } = validation.data

      // Retrieve group with members
      const group = await prisma.group.findUnique({
        where: { name: groupName },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          }
        }
      })

      if (!group) {
        return reply.code(404).send({
          error: 'Group not found'
        })
      }

      return reply.code(200).send({
        success: true,
        group: groupName,
        members: group.users.map(member => ({
          userId: member.user.id,
          username: member.user.username
        }))
      })
    } catch (error) {
      console.error('Error fetching group members:', error)
      return reply.code(500).send({
        error: 'Internal server error while fetching group members'
      })
    }
  })
}
