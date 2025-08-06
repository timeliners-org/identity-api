import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function initAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin'

  const password = await bcrypt.hash(adminPassword, 10)
  return prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      email: adminEmail,
      username: adminUsername,
      passwordHash: password,
      groups: {
        create: {
          group: {
            connect: { name: 'admin' }
          }
        }
      },
      isActive: true,
      isVerified: true,
    },
  })
}
