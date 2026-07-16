"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@ordora/shared/lib/prisma"

export async function getStores() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized — please log in again")

  let tenantId = session.user.tenantId
  if (!tenantId && session.user.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { tenantId: true } })
    tenantId = user?.tenantId || null
  }
  if (!tenantId) return []

  const stores = await prisma.store.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { menuItems: true, orders: true, staff: true } } },
  })
  return stores
}

export async function getCurrentStore() {
  const session = await auth()
  if (!session?.user) return null

  let tenantId = session.user.tenantId
  if (!tenantId && session.user.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { tenantId: true } })
    tenantId = user?.tenantId || null
  }
  if (!tenantId) return null

  const store = await prisma.store.findFirst({
    where: { tenantId, isActive: true },
    include: { _count: { select: { menuItems: true, orders: true, staff: true } } },
  })
  return store
}
