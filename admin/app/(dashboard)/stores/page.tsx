import { prisma } from "@ordora/shared/lib/prisma"
import { StoresClient } from "./stores-client"

export const dynamic = "force-dynamic"

export default async function StoresPage() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, slug: true, address: true, phone: true, postcode: true,
      brandColor: true, accentColor: true, tagline: true, heroImageUrl: true,
      webServiceCharge: true, bagCharge: true, isActive: true, tenantId: true, createdAt: true,
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
