import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@ordora/shared/lib/prisma"
import { MenuClient } from "./menu-client"

export const dynamic = "force-dynamic"

export default async function MenuPage() {
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

  const [menuItems, modifierGroups] = store
    ? await Promise.all([
        prisma.menuItem.findMany({
          where: { storeId: store.id },
          orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
          include: {
            modifierGroups: {
              include: {
                modifierGroup: {
                  include: { items: true },
                },
              },
            },
          },
        }),
        prisma.modifierGroup.findMany({
          where: { storeId: store.id },
          orderBy: { sortOrder: "asc" },
          include: { items: { orderBy: { sortOrder: "asc" } } },
        }),
      ])
    : [[], []]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Menu</h1>
        <p className="text-muted-foreground">
          Manage menu items and modifier groups ({menuItems.length} items, {modifierGroups.length} groups)
        </p>
      </div>
      <MenuClient
        items={JSON.parse(JSON.stringify(menuItems))}
        modifierGroups={JSON.parse(JSON.stringify(modifierGroups))}
      />
    </div>
  )
}
