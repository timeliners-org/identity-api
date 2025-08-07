// src/routes/user/index.ts
import { FastifyInstance } from 'fastify'
import getUserIdRoute from '@/routes/user/get-user-id'
import userGroupRoute from '@/routes/user/own-group'
import groupUserRoute from '@/routes/user/group'
import createUserRoute from '@/routes/user/create'
import getUserByIdRoute from '@/routes/user/get-user-by-id'
import getUserRoute from '@/routes/user/get'
import updateUserRoute from '@/routes/user/update'

export default async function userRoutes(app: FastifyInstance) {
  // Registriere alle User-Routen
  await app.register(getUserIdRoute)
  await app.register(userGroupRoute)
  await app.register(groupUserRoute)
  await app.register(createUserRoute)
  await app.register(getUserByIdRoute)
  await app.register(getUserRoute)
  await app.register(updateUserRoute)
}
