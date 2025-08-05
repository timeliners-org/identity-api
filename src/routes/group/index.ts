// src/routes/group/index.ts
import { FastifyInstance } from 'fastify'
import listGroupsRoute from '@/routes/group/list'
import groupMembersRoute from '@/routes/group/members'
export default async function groupRoutes(app: FastifyInstance) {
  // Register all group routes
  await app.register(listGroupsRoute)
  await app.register(groupMembersRoute)
}
