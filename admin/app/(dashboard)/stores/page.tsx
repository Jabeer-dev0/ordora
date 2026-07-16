import { prisma } from "@ordora/shared/lib/prisma"
import { StoresClient } from "./stores-client"

export const dynamic = "force-dynamic"

export default async function StoresPage() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tenant: { select: { name: true, id: true } },
      _count: { select: { orders: true, menuItems: true, staff: true } },
    },
  })

  const tenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return <StoresClient stores={JSON.parse(JSON.stringify(stores))} tenants={JSON.parse(JSON.stringify(tenants))} />
}
