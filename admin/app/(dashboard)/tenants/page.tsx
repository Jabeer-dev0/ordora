import { prisma } from "@ordora/shared/lib/prisma"
import { TenantsClient } from "./tenants-client"

export const dynamic = "force-dynamic"

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { stores: true, users: true } } },
  })

  return <TenantsClient tenants={JSON.parse(JSON.stringify(tenants))} />
}
