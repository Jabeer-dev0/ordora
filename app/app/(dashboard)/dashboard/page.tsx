import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@ordora/shared/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@ordora/shared/components/ui/card"
import { Badge } from "@ordora/shared/components/ui/badge"
import { DollarSign, ShoppingCart, Users, TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@ordora/shared/lib/utils"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  let tenantId = session.user.tenantId
  if (!tenantId) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { tenantId: true } })
    tenantId = user?.tenantId || null
  }

  const store = tenantId
    ? await prisma.store.findFirst({
        where: { tenantId, isActive: true },
        include: { _count: { select: { orders: true, menuItems: true, staff: true } } },
      })
    : null

  if (!store) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">No active store found. Please set up a store first.</p>
        </div>
      </div>
    )
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [todaysOrders, totalRevenue, todaysRevenue, avgOrder, pendingCount, preparingCount, completedToday, cancelledToday] = await Promise.all([
    prisma.order.findMany({
      where: { storeId: store.id, createdAt: { gte: todayStart } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } }, items: true },
    }),
    prisma.order.aggregate({
      where: { storeId: store.id, status: "COMPLETED" },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { storeId: store.id, status: "COMPLETED", createdAt: { gte: todayStart } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { storeId: store.id, status: "COMPLETED" },
      _avg: { total: true },
    }),
    prisma.order.count({
      where: { storeId: store.id, status: "PENDING" },
    }),
    prisma.order.count({
      where: { storeId: store.id, status: "PREPARING" },
    }),
    prisma.order.count({
      where: { storeId: store.id, status: "COMPLETED", createdAt: { gte: todayStart } },
    }),
    prisma.order.count({
      where: { storeId: store.id, status: "CANCELLED", createdAt: { gte: todayStart } },
    }),
  ])

  const stats = [
    { name: "Today's Revenue", value: formatCurrency(Number(todaysRevenue._sum.total || 0)), icon: DollarSign, color: "text-emerald-600" },
    { name: "Orders Today", value: completedToday.toString(), icon: ShoppingCart, color: "text-blue-600" },
    { name: "Avg Order Value", value: formatCurrency(Number(avgOrder._avg.total || 0)), icon: TrendingUp, color: "text-violet-600" },
    { name: "Staff Members", value: store._count.staff.toString(), icon: Users, color: "text-amber-600" },
  ]

  const orderStats = [
    { name: "Pending", value: pendingCount, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { name: "Preparing", value: preparingCount, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10" },
    { name: "Completed Today", value: completedToday, icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
    { name: "Cancelled Today", value: cancelledToday, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {orderStats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No orders yet today.</p>
            ) : (
              <div className="space-y-3">
                {todaysOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                        <ShoppingCart className="size-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Order #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">{order.user?.name || "Walk-in"} · {order.items.length} items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(Number(order.total))}</p>
                      <Badge variant={order.status === "COMPLETED" ? "default" : order.status === "PREPARING" ? "secondary" : order.status === "CANCELLED" ? "destructive" : "outline"} className="text-xs">
                        {order.status.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Total Revenue (All Time)</span>
              <span className="font-bold">{formatCurrency(Number(totalRevenue._sum.total || 0))}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Total Orders</span>
              <span className="font-bold">{store._count.orders}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Menu Items</span>
              <span className="font-bold">{store._count.menuItems}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Active Staff</span>
              <span className="font-bold">{store._count.staff}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
