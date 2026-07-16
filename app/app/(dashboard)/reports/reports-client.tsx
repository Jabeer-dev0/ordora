"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@ordora/shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ordora/shared/components/ui/table"
import { Badge } from "@ordora/shared/components/ui/badge"
import { formatCurrency, formatDate } from "@ordora/shared/lib/utils"
import { DollarSign, ShoppingCart, TrendingUp, Calendar } from "lucide-react"

interface ReportsData {
  today: { revenue: number; orders: number; avg: number }
  week: { revenue: number; orders: number }
  month: { revenue: number; orders: number }
  topItems: Array<{
    menuItemId: string
    name: string
    category: string
    _sum: { quantity: number | null; total: number | null }
    _count: number
  }>
  recentOrders: Array<{
    id: string
    total: number
    status: string
    source: string
    createdAt: string
    items: Array<{ menuItem?: { name?: string } }>
    user?: { name?: string } | null
  }>
}

const statusVariant: Record<string, "outline" | "default" | "destructive" | "secondary"> = {
  PENDING: "outline",
  COMPLETED: "default",
  CANCELLED: "destructive",
  PREPARING: "secondary",
}

export function ReportsClient({ data }: { data: ReportsData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.today.revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {data.today.orders} orders &middot; {formatCurrency(data.today.avg)} avg
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.week.revenue)}</div>
            <p className="text-xs text-muted-foreground">{data.week.orders} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.month.revenue)}</div>
            <p className="text-xs text-muted-foreground">{data.month.orders} orders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Top Selling Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topItems.map((item, i) => (
                <TableRow key={item.menuItemId} className={i % 2 === 1 ? "bg-muted/50" : ""}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">{item._sum.quantity ?? 0}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item._sum.total ?? 0)}</TableCell>
                </TableRow>
              ))}
              {data.topItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No data yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                  <TableCell>{order.user?.name || "—"}</TableCell>
                  <TableCell className="text-right">{order.items.length}</TableCell>
                  <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.source}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[order.status] ?? "outline"}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                </TableRow>
              ))}
              {data.recentOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">No orders yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
