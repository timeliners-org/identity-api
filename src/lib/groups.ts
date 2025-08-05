import { prisma } from "@/lib/prisma"

const groups: { name: string, description: string }[] = [
  {
    name: 'admin',
    description: 'Administrators with full rights'
  }
]

export default async function initGroups() {
  await prisma.group.deleteMany({ where: { name: { not: { in: groups.map(g => g.name) } } } })
  for (const group of groups) {
    await prisma.group.upsert({
      where: { name: group.name },
      update: { description: group.description },
      create: group
    })
  }
  console.log('Groups initialized:', groups.map(g => g.name).join(', '))
}

export async function isAdmin(userId: string): Promise<boolean> {
  const group = await prisma.group.findUnique({
    where: { name: 'admin' },
    include: { users: true }
  })
  return group ? group.users.some(user => user.userId === userId) : false
}

export async function hasGroup(userId: string, groupName: string): Promise<boolean> {
  if (await isAdmin(userId)) {
    return true
  }

  const group = await prisma.group.findUnique({
    where: { name: groupName },
    include: { users: true }
  })

  return group ? group.users.some(user => user.userId === userId) : false
}