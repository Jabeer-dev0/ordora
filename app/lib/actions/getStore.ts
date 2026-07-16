"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@ordora/shared/lib/prisma"

export async function getStoreForSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized — please log in again")

  let tenantId = session.user.tenantId
  let userId = session.user.id

  if (!tenantId && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } })
    tenantId = user?.tenantId || null
  }

  if (!tenantId && userId) {
    const firstTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } })
    if (firstTenant) {
      await prisma.user.update({ where: { id: userId }, data: { tenantId: firstTenant.id } })
      tenantId = firstTenant.id
    }
  }

  if (!tenantId) throw new Error("No tenants found in system. Please register a business first.")

  const store = await prisma.store.findFirst({ where: { tenantId, isActive: true } })
  if (!store) throw new Error("No active store found — please set up a store first.")
  return store
}
