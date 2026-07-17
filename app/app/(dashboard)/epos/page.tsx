import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@ordora/shared/lib/prisma"
import { EposClient } from "./epos-client"

export const dynamic = "force-dynamic"

export default async function EposPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  let tenantId = session.user.tenantId
  if (!tenantId) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { tenantId: true } })
    tenantId = user?.tenantId || null
  }

  const store = tenantId
    ? await prisma.store.findFirst({ where: { tenantId, isActive: true } })
    : null

  const menuItems = store
    ? await prisma.menuItem.findMany({
        where: { storeId: store.id, isAvailable: true },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
        include: {
          modifierGroups: {
            orderBy: { sortOrder: "asc" },
            include: {
              modifierGroup: {
                include: { items: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      })
    : []

  return <EposClient menuItems={JSON.parse(JSON.stringify(menuItems))} />
}
