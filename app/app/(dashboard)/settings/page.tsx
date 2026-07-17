import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@ordora/shared/lib/prisma"
import { SettingsClient } from "./settings-client"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  let tenantId = session.user.tenantId
  if (!tenantId) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { tenantId: true } })
    tenantId = user?.tenantId || null
  }

  const tenant = tenantId
    ? await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { stores: true },
      })
    : null
  const store = tenant?.stores[0]

  return (
    <SettingsClient
      store={JSON.parse(JSON.stringify(store || null))}
      tenant={JSON.parse(JSON.stringify(tenant || null))}
    />
  )
}
