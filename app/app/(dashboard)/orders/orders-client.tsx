"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createOrder, updateOrderStatus } from "@/lib/actions/order"
import { Badge } from "@ordora/shared/components/ui/badge"
import { Button } from "@ordora/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ordora/shared/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ordora/shared/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ordora/shared/components/ui/table"
import { Input } from "@ordora/shared/components/ui/input"
import { Label } from "@ordora/shared/components/ui/label"
import { Textarea } from "@ordora/shared/components/ui/textarea"
import { Plus, Eye, ShoppingCart } from "lucide-react"
import { formatCurrency } from "@ordora/shared/lib/utils"

const STATUS_VARIANT: Record<string, string> = {
  PENDING: "outline",
  CONFIRMED: "secondary",
  PREPARING: "secondary",
  READY: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
}

interface OrderItem {
  id: string
  menuItemId: string
  quantity: number
  unitPrice: number
  total: number
  menuItem: { id: string; name: string; price: number }
}

interface Order {
  id: string
  status: string
  source: string
  subtotal: number
  tax: number
  total: number
  notes: string | null
  createdAt: string
  items: OrderItem[]
  user: { name: string | null } | null
}

interface MenuItem {
  id: string
  name: string
  price: number
}

interface OrdersClientProps {
  orders: Order[]
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedItems, setSelectedItems] = useState<
    { menuItemId: string; quantity: number; unitPrice: number }[]
  >([])
  const [notes, setNotes] = useState("")
  const [source, setSource] = useState("TILL")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetch("/api/menu-items")
        .then((res) => res.json())
        .then((data) => setMenuItems(data))
        .catch(() => toast.error("Failed to load menu items"))
    }
  }, [open])

  function addMenuItem() {
    if (menuItems.length === 0) return
    const first = menuItems[0]
    setSelectedItems((prev) => [
      ...prev,
      { menuItemId: first.id, quantity: 1, unitPrice: first.price },
    ])
  }

  function updateSelectedItem(index: number, field: string, value: string | number) {
    setSelectedItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        if (field === "menuItemId") {
          const mi = menuItems.find((m) => m.id === value)
          return { ...item, menuItemId: value as string, unitPrice: mi?.price || 0 }
        }
        return { ...item, [field]: value }
      })
    )
  }

  function removeSelectedItem(index: number) {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCreateOrder() {
    if (selectedItems.length === 0) {
      toast.error("Add at least one item")
      return
    }
    setLoading(true)
    try {
      await createOrder({ items: selectedItems, source, notes })
      toast.success("Order created")
      setOpen(false)
      setSelectedItems([])
      setNotes("")
      setSource("TILL")
      router.refresh()
    } catch {
      toast.error("Failed to create order")
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(orderId: string, status: string) {
    try {
      await updateOrderStatus(orderId, status)
      toast.success("Order updated")
      router.refresh()
    } catch {
      toast.error("Failed to update order")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TILL">Till</SelectItem>
                    <SelectItem value="WEB">Web</SelectItem>
                    <SelectItem value="PHONE">Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMenuItem}>
                    <Plus className="mr-1 h-3 w-3" /> Add Item
                  </Button>
                </div>
                {selectedItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Select
                      value={item.menuItemId}
                      onValueChange={(v) => updateSelectedItem(index, "menuItemId", v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {menuItems.map((mi) => (
                          <SelectItem key={mi.id} value={mi.id}>
                            {mi.name} - ${mi.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateSelectedItem(index, "quantity", parseInt(e.target.value) || 1)
                      }
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelectedItem(index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                {selectedItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">No items added yet.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
              </div>

              <div className="text-right font-medium">
                Total: ${selectedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0).toFixed(2)}
              </div>

              <Button onClick={handleCreateOrder} disabled={loading} className="w-full">
                {loading ? "Creating..." : "Place Order"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">View</TableHead>
              <TableHead className="w-[140px]">Update Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{order.user?.name || "Walk-in"}</TableCell>
                  <TableCell>{order.items.length}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.source}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[order.status] as any}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailOrder(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="PREPARING">Preparing</SelectItem>
                        <SelectItem value="READY">Ready</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={(open) => { if (!open) setDetailOrder(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order #{detailOrder?.id.slice(-6).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{detailOrder.user?.name || "Walk-in"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={STATUS_VARIANT[detailOrder.status] as any}>{detailOrder.status}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Source: <Badge variant="outline" className="ml-1">{detailOrder.source}</Badge></span>
                <span className="text-muted-foreground">{new Date(detailOrder.createdAt).toLocaleString()}</span>
              </div>
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">Items</p>
                {detailOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span>{item.menuItem.name} × {item.quantity}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              {detailOrder.notes && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Notes: {detailOrder.notes}</p>
                </div>
              )}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(detailOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(detailOrder.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(detailOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
