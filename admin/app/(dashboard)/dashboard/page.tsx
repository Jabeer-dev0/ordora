import { prisma } from "@ordora/shared/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@ordora/shared/components/ui/card"
import { Building2, Store, Users, ShoppingCart, DollarSign } from "lucide-react"
import { formatCurrency } from "@ordora/shared/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const totalTenants = await prisma.tenant.count()
  const totalStores = await prisma.store.count()
  const totalUsers = await prisma.user.count()
  const totalOrders = await prisma.order.count()
  const revenue = await prisma.order.aggregate({ _sum: { total: true }, where: { status: "COMPLETED" } })

  const stats = [
    { name: "Total Tenants", value: totalTenants.toString(), icon: Building2 },
    { name: "Active Stores", value: totalStores.toString(), icon: Store },
    { name: "Total Users", value: totalUsers.toString(), icon: Users },
    { name: "Total Orders", value: totalOrders.toString(), icon: ShoppingCart },
    { name: "Platform Revenue", value: formatCurrency(Number(revenue._sum.total || 0)), icon: DollarSign },
  ]

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { store: { select: { name: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your Ordora platform</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">{order.store?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(order.total))}</p>
                    <p className="text-xs text-muted-foreground">{order.status.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
