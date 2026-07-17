"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@ordora/shared/lib/prisma"

export async function getStoreForSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized — please log in again")

  let tenantId = session.user.tenantId

  // Resolve tenantId from DB if not in session token
  if (!tenantId && session.user.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true },
    })
    tenantId = user?.tenantId || null
  }

  if (!tenantId) throw new Error("Your account is not linked to a business. Please contact support.")

  const store = await prisma.store.findFirst({ where: { tenantId, isActive: true } })
  if (!store) throw new Error("No active store found — please set up a store first.")

  return store
}
