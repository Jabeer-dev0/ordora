import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@ordora/shared/lib/prisma"
import { StaffClient } from "./staff-client"

export const dynamic = "force-dynamic"

export default async function StaffPage() {
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
