import { auth } from "@/lib/auth"
import { prisma } from "@ordora/shared/lib/prisma"
import { StaffClient } from "./staff-client"

export default async function StaffPage() {
  const session = await auth()
  const store = await prisma.store.findFirst({
    where: { tenantId: session?.user?.tenantId || "", isActive: true },
  })

  const staff = store
    ? await prisma.staff.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
        <p className="text-muted-foreground">Manage your team members ({staff.length} members)</p>
      </div>
      <StaffClient staff={JSON.parse(JSON.stringify(staff))} />
    </div>
  )
}
