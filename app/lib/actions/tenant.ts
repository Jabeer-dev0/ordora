"use server"

import { prisma } from "@ordora/shared/lib/prisma"

export async function getTenants() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { stores: true, users: true } } },
  })
  return tenants
}

export async function getCurrentTenant() {
  const { getStoreForSession } = await import("./getStore")
  const { auth } = await import("@/lib/auth")
  const session = await auth()
  if (!session?.user) return null

  let tenantId = session.user.tenantId
  if (!tenantId && session.user.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { tenantId: true } })
    tenantId = user?.tenantId || null
  }
  if (!tenantId) return null

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { stores: true, _count: { select: { users: true } } },
  })
  return tenant
}
