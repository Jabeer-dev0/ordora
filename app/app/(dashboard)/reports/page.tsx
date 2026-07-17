import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@ordora/shared/lib/prisma"
import { ReportsClient } from "./reports-client"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
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

  if (!store) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">No active store found.</p>
        </div>
      </div>
    )
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

  const todayCompletedCount = todayOrders.filter(o => o.status === "COMPLETED").length
  const todayRevenue = calcRevenue(todayOrders)

  const data = {
    today: {
      revenue: todayRevenue,
      orders: calcCount(todayOrders),
      avg: todayCompletedCount > 0 ? todayRevenue / todayCompletedCount : 0,
    },
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
