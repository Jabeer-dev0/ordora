import { auth } from "@/lib/auth"
import { prisma } from "@ordora/shared/lib/prisma"
import { OrdersClient } from "./orders-client"

export default async function OrdersPage() {
  const session = await auth()
  const store = await prisma.store.findFirst({
    where: { tenantId: session?.user?.tenantId || "", isActive: true },
  })

  const orders = store
    ? await prisma.order.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
        include: {
          items: { include: { menuItem: true } },
          user: { select: { name: true } },
        },
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage and track all orders ({orders.length} total)</p>
      </div>
      <OrdersClient orders={JSON.parse(JSON.stringify(orders))} />
    </div>
  )
}
