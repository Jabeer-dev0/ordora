import { auth } from "@/lib/auth"
import { prisma } from "@ordora/shared/lib/prisma"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const session = await auth()
  const tenant = session?.user?.tenantId
    ? await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
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
