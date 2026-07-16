import { auth } from "@/lib/auth"
import { prisma } from "@ordora/shared/lib/prisma"
import { ReportsClient } from "./reports-client"

export default async function ReportsPage() {
  const session = await auth()
  const store = await prisma.store.findFirst({
    where: { tenantId: session?.user?.tenantId || "", isActive: true },
  })

  if (!store) {
    return <div className="p-6 text-muted-foreground">No active store found.</div>
  }

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [todayOrders, weekOrders, monthOrders, topItems, recentOrders] = await Promise.all([
    prisma.order.findMany({ where: { storeId: store.id, createdAt: { gte: todayStart } }, include: { items: true } }),
    prisma.order.findMany({ where: { storeId: store.id, createdAt: { gte: weekStart } }, include: { items: true } }),
    prisma.order.findMany({ where: { storeId: store.id, createdAt: { gte: monthStart } }, include: { items: true } }),
    prisma.orderItem.groupBy({ by: ["menuItemId"], where: { order: { storeId: store.id } }, _sum: { quantity: true, total: true }, _count: true, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    prisma.order.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: 20, include: { items: { include: { menuItem: true } }, user: { select: { name: true } } } }),
  ])

  const calcRevenue = (orders: any[]) => orders.filter(o => o.status === "COMPLETED").reduce((s, o) => s + o.total, 0)
  const calcCount = (orders: any[]) => orders.length

  const topItemIds = topItems.map(i => i.menuItemId)
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: topItemIds } }, select: { id: true, name: true, category: true } })
  const itemMap = Object.fromEntries(menuItems.map(m => [m.id, m]))
  const resolvedTopItems = topItems.map(i => ({
    ...i,
    name: itemMap[i.menuItemId]?.name || "Unknown",
    category: itemMap[i.menuItemId]?.category || "Unknown",
  }))

  const data = {
    today: { revenue: calcRevenue(todayOrders), orders: calcCount(todayOrders), avg: todayOrders.length > 0 ? calcRevenue(todayOrders) / todayOrders.filter(o => o.status === "COMPLETED").length : 0 },
    week: { revenue: calcRevenue(weekOrders), orders: calcCount(weekOrders) },
    month: { revenue: calcRevenue(monthOrders), orders: calcCount(monthOrders) },
    topItems: resolvedTopItems,
    recentOrders: JSON.parse(JSON.stringify(recentOrders)),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Sales analytics and insights</p>
      </div>
      <ReportsClient data={data} />
    </div>
  )
}
