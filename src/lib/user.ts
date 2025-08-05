import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function initAdminUser() {
  const password = await bcrypt.hash('admin', 10)
  return prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      email: '',
      username: 'admin',
      passwordHash: password,
      groups: {
        create: {
          group: {
            connect: { name: 'admin' }
          }
        }
      },
    },
  })
}
