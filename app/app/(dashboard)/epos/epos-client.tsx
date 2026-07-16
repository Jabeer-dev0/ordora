"use client"

import { useState, useMemo, useRef } from "react"
import { Button } from "@ordora/shared/components/ui/button"
import { Input } from "@ordora/shared/components/ui/input"
import { Label } from "@ordora/shared/components/ui/label"
import { Textarea } from "@ordora/shared/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@ordora/shared/components/ui/dialog"
import { toast } from "sonner"
import { createOrder } from "@/lib/actions/order"
import { formatCurrency } from "@ordora/shared/lib/utils"
import {
  Search,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  CreditCard,
  Banknote,
  Clock,
  X,
  StickyNote,
  Percent,
  DollarSign,
  Check,
  ArrowLeft,
  Printer,
} from "lucide-react"

interface Modifier {
  id: string
  name: string
  price: number
  isAvailable: boolean
}

interface ModifierGroup {
  id: string
  name: string
  required: boolean
  minSelect: number
  maxSelect: number
  items: Modifier[]
}

interface MenuItemModifierGroup {
  modifierGroup: ModifierGroup
  sortOrder: number
}

interface MenuItem {
  id: string
  name: string
  price: number
  description: string | null
  category: string
  modifierGroups: MenuItemModifierGroup[]
}

interface CartItemModifier {
  modifierId: string
  name: string
  price: number
}

interface CartItem {
  menuItemId: string
  name: string
  basePrice: number
  quantity: number
  modifiers: CartItemModifier[]
  notes: string
}

type OrderType = "dine-in" | "takeaway" | "delivery"
type PaymentMethod = "cash" | "not_paid"

const CASH_DENOMS = [5, 10, 20, 50, 100]

interface ReceiptData {
  orderId: string
  orderType: string
  paymentMethod: string
  items: { name: string; quantity: number; price: number; modifiers: { name: string }[] }[]
  subtotal: number
  discount: number
  tax: number
  total: number
  cashTendered: number
  change: number
  date: string
}

export function EposClient({ menuItems }: { menuItems: MenuItem[] }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [orderType, setOrderType] = useState<OrderType>("dine-in")
  const [notes, setNotes] = useState("")
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent")
  const [discountValue, setDiscountValue] = useState(0)
  const [showPayment, setShowPayment] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [cashTendered, setCashTendered] = useState(0)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [modifierSelections, setModifierSelections] = useState<Record<string, Record<string, number>>>({})
  const [search, setSearch] = useState("")
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  const categories = useMemo(() => {
    const catMap = new Map<string, number>()
    for (const item of menuItems) {
      catMap.set(item.category, (catMap.get(item.category) || 0) + 1)
    }
    return Array.from(catMap.entries()).map(([name, count]) => ({ name, count }))
  }, [menuItems])

  const filteredItems = useMemo(() => {
    let items = activeCategory
      ? menuItems.filter((i) => i.category === activeCategory)
      : menuItems
    if (search) {
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.description?.toLowerCase().includes(search.toLowerCase())
      )
    }
    return items
  }, [menuItems, activeCategory, search])

  const subtotal = useMemo(
    () =>
      cart.reduce((s, item) => {
        const modTotal = item.modifiers.reduce((ms, m) => ms + m.price, 0)
        return s + (item.basePrice + modTotal) * item.quantity
      }, 0),
    [cart]
  )

  const discount = useMemo(() => {
    if (discountType === "percent") return subtotal * (discountValue / 100)
    return Math.min(discountValue, subtotal)
  }, [subtotal, discountType, discountValue])

  const taxRate = 0.08
  const taxable = subtotal - discount
  const tax = taxable * taxRate
  const total = taxable + tax
  const change = paymentMethod === "cash" ? Math.max(0, cashTendered - total) : 0
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0)

  function getModifierGroups(item: MenuItem) {
    return item.modifierGroups
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((mg) => mg.modifierGroup)
  }

  function hasModifiers(item: MenuItem) {
    return item.modifierGroups.length > 0
  }

  function handleItemClick(item: MenuItem) {
    if (!hasModifiers(item)) {
      addToCart(item, [])
      return
    }
    setSelectedItem(item)
    const initial: Record<string, Record<string, number>> = {}
    for (const mg of getModifierGroups(item)) {
      initial[mg.id] = {}
    }
    setModifierSelections(initial)
  }

  function handleModifierToggle(groupId: string, modifierId: string, group: ModifierGroup) {
    setModifierSelections((prev) => {
      const current = prev[groupId] || {}
      const currentCount = current[modifierId] || 0
      const totalCount = Object.values(current).reduce((a, b) => a + b, 0)

      // Single select (required, max=1): replace selection
      if (group.required && group.maxSelect === 1) {
        return { ...prev, [groupId]: { [modifierId]: 1 } }
      }

      // Already selected: remove one
      if (currentCount > 0) {
        const updated = { ...current }
        updated[modifierId] = currentCount - 1
        if (updated[modifierId] === 0) delete updated[modifierId]
        return { ...prev, [groupId]: updated }
      }

      // At max: don't add
      if (totalCount >= group.maxSelect) return prev

      // Add one more
      return { ...prev, [groupId]: { ...current, [modifierId]: currentCount + 1 } }
    })
  }

  function getModifierGroupCount(groupId: string) {
    const sel = modifierSelections[groupId] || {}
    return Object.values(sel).reduce((a, b) => a + b, 0)
  }

  function getModifierCount(groupId: string, modifierId: string) {
    return (modifierSelections[groupId] || {})[modifierId] || 0
  }

  function canAddFromModifierPanel() {
    if (!selectedItem) return false
    for (const mg of getModifierGroups(selectedItem)) {
      if (getModifierGroupCount(mg.id) < mg.minSelect) return false
    }
    return true
  }

  function confirmAddWithModifiers() {
    if (!selectedItem) return
    const mods: CartItemModifier[] = []
    for (const mg of getModifierGroups(selectedItem)) {
      const sel = modifierSelections[mg.id] || {}
      for (const [modId, count] of Object.entries(sel)) {
        const mod = mg.items.find((m) => m.id === modId)
        if (mod) {
          for (let i = 0; i < count; i++) {
            mods.push({ modifierId: mod.id, name: mod.name, price: mod.price })
          }
        }
      }
    }
    addToCart(selectedItem, mods)
    setSelectedItem(null)
    setModifierSelections({})
  }

  function addToCart(item: MenuItem, modifiers: CartItemModifier[]) {
    const key = `${item.id}-${modifiers.map((m) => m.modifierId).sort().join(",")}`
    setCart((prev) => {
      const existingIdx = prev.findIndex((c) => {
        const cKey = `${c.menuItemId}-${c.modifiers.map((m) => m.modifierId).sort().join(",")}`
        return cKey === key
      })
      if (existingIdx >= 0) {
        const updated = [...prev]
        updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + 1 }
        return updated
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          basePrice: item.price,
          quantity: 1,
          modifiers,
          notes: "",
        },
      ]
    })
    toast.success(`Added ${item.name}`)
  }

  function updateQty(index: number, delta: number) {
    setCart((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], quantity: updated[index].quantity + delta }
      if (updated[index].quantity <= 0) updated.splice(index, 1)
      return updated
    })
  }

  function removeItem(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  function clearAll() {
    setCart([])
    setNotes("")
    setDiscountValue(0)
    setCashTendered(0)
    setPaymentMethod("cash")
    setOrderType("dine-in")
  }

  async function handlePayment() {
    if (cart.length === 0) return
    try {
      const order = await createOrder({
        orderType,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
          unitPrice: c.basePrice,
          modifiers: c.modifiers.map((m) => ({
            modifierId: m.modifierId,
            price: m.price,
          })),
        })),
        notes: notes || undefined,
        discount: discount || undefined,
        paymentMethod,
        source: "TILL",
      })

      const receipt: ReceiptData = {
        orderId: (order as any).id || "N/A",
        orderType,
        paymentMethod,
        items: cart.map(c => ({
          name: c.name,
          quantity: c.quantity,
          price: c.basePrice,
          modifiers: c.modifiers.map(m => ({ name: m.name })),
        })),
        subtotal,
        discount,
        tax,
        total,
        cashTendered: paymentMethod === "cash" ? cashTendered : total,
        change: paymentMethod === "cash" ? change : 0,
        date: new Date().toLocaleString(),
      }

      setReceiptData(receipt)
      setShowPayment(false)
      setShowReceipt(true)
      setCart([])
      setNotes("")
      setDiscountValue(0)
      setCashTendered(0)
      setPaymentMethod("cash")
      setOrderType("dine-in")
    } catch {
      toast.error("Failed to place order")
    }
  }

  function handlePrint() {
    const printContent = receiptRef.current
    if (!printContent) return
    const win = window.open("", "_blank", "width=380,height=700")
    if (!win) { toast.error("Popup blocked. Allow popups to print."); return }
    win.document.write(`
      <html><head><title>Receipt</title><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 16px; font-size: 13px; max-width: 300px; margin: 0 auto; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .right { text-align: right; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; vertical-align: top; }
        .item-name { font-weight: bold; }
        .mod-line { padding-left: 12px; color: #555; font-size: 12px; }
        .qty { width: 30px; }
        .price { text-align: right; white-space: nowrap; }
        .total-line { border-top: 2px solid #000; margin-top: 6px; padding-top: 6px; font-size: 15px; font-weight: bold; }
        .footer { margin-top: 16px; text-align: center; font-size: 11px; color: #888; }
      </style></head><body>
        ${printContent.innerHTML}
      </body></html>
    `)
    win.document.close()
    win.print()
    win.close()
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* LEFT PANEL: Categories */}
      <div className="flex w-[180px] flex-col border-r bg-card">
        <div className="border-b px-3 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => { setActiveCategory(null); setSelectedItem(null) }}
            className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
              activeCategory === null && !selectedItem
                ? "bg-[hsl(24,95%,53%)] text-white shadow-md shadow-orange-500/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>All Items</span>
            <span className="text-xs opacity-70">{menuItems.length}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => { setActiveCategory(cat.name); setSelectedItem(null) }}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                activeCategory === cat.name
                  ? "bg-[hsl(24,95%,53%)] text-white shadow-md shadow-orange-500/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-xs opacity-70">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MIDDLE PANEL: Items / Modifier Selection */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedItem ? (
          /* Modifier Selection Panel */
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center gap-3 border-b bg-card/50 px-5 py-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border transition hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-base font-bold">{selectedItem.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(selectedItem.price)}
                  {selectedItem.description && ` — ${selectedItem.description}`}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {getModifierGroups(selectedItem).map((group) => {
                const groupCount = getModifierGroupCount(group.id)
                const meetsMin = groupCount >= group.minSelect
                const atMax = group.maxSelect > 0 && groupCount >= group.maxSelect
                return (
                  <div key={group.id} className="mb-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold">{group.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {group.required ? (
                          group.maxSelect === 1 ? "Required — choose one" : `Select ${group.minSelect}${group.maxSelect < 99 ? `–${group.maxSelect}` : "+"}`
                        ) : (
                          `Optional${group.maxSelect < 99 ? ` (up to ${group.maxSelect})` : ""}`
                        )}
                        {!meetsMin && group.required && (
                          <span className="ml-1 text-destructive">({group.minSelect - groupCount} more needed)</span>
                        )}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {group.items.map((mod) => {
                        const count = getModifierCount(group.id, mod.id)
                        return (
                          <div key={mod.id} className="flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all border-muted">
                            <span className="text-sm font-medium">{mod.name}</span>
                            <div className="flex items-center gap-2">
                              {mod.price > 0 && (
                                <span className="text-xs text-muted-foreground">+{formatCurrency(mod.price)}</span>
                              )}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => count > 0 && handleModifierToggle(group.id, mod.id, group)}
                                  disabled={count === 0}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border bg-muted text-sm font-bold transition hover:bg-destructive hover:text-white disabled:opacity-30"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-7 text-center text-sm font-bold">{count}</span>
                                <button
                                  onClick={() => handleModifierToggle(group.id, mod.id, group)}
                                  disabled={atMax && count === 0}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border bg-muted text-sm font-bold transition hover:bg-[hsl(24,95%,53%)] hover:text-white disabled:opacity-30"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t px-5 py-3">
              <button
                onClick={confirmAddWithModifiers}
                disabled={!canAddFromModifierPanel()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(24,95%,53%)] text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[hsl(24,95%,48%)] active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
              >
                <Plus className="h-4 w-4" />
                Add to Order — {formatCurrency(selectedItem.price + (() => {
                  let modTotal = 0
                  for (const mg of getModifierGroups(selectedItem)) {
                    const sel = modifierSelections[mg.id] || {}
                    for (const [modId, count] of Object.entries(sel)) {
                      const mod = mg.items.find((m) => m.id === modId)
                      if (mod) modTotal += mod.price * count
                    }
                  }
                  return modTotal
                })())}
              </button>
            </div>
          </div>
        ) : (
          /* Item Grid */
          <div className="flex-1 overflow-y-auto p-4">
            {filteredItems.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ShoppingBag className="mx-auto mb-3 h-12 w-12 opacity-30" />
                  <p>No items found</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filteredItems.map((item) => {
                  const inCartCount = cart
                    .filter((c) => c.menuItemId === item.id)
                    .reduce((s, c) => s + c.quantity, 0)
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="group relative flex min-h-[100px] flex-col items-start rounded-xl border bg-card p-4 text-left transition-all hover:border-[hsl(24,95%,53%)]/40 hover:shadow-md hover:shadow-orange-500/5 active:scale-[0.97]"
                    >
                      <span className="mb-1 text-base font-semibold leading-tight group-hover:text-[hsl(24,95%,53%)]">
                        {item.name}
                      </span>
                      <span className="text-sm font-bold text-[hsl(24,95%,53%)]">
                        {formatCurrency(item.price)}
                      </span>
                      {item.description && (
                        <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                      {hasModifiers(item) && (
                        <span className="mt-auto pt-1 text-[10px] text-muted-foreground">
                          Tap to customize
                        </span>
                      )}
                      {inCartCount > 0 && (
                        <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[hsl(24,95%,53%)] px-1.5 text-[11px] font-bold text-white">
                          {inCartCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Cart */}
      <div className="flex w-[340px] flex-col border-l bg-card">
        {/* Header */}
        <div className="border-b px-5 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">New Order</h2>
            {cart.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Order Type Tabs */}
          <div className="mt-2 flex gap-1 rounded-lg bg-muted p-0.5">
            {(["dine-in", "takeaway", "delivery"] as OrderType[]).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-all ${
                  orderType === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "dine-in" ? "🍽 Dine In" : t === "takeaway" ? "📦 Takeaway" : "🚗 Delivery"}
              </button>
            ))}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <ShoppingBag className="mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm">Tap items to add to order</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, idx) => {
                const modTotal = item.modifiers.reduce((s, m) => s + m.price, 0)
                const lineTotal = (item.basePrice + modTotal) * item.quantity
                return (
                  <div
                    key={idx}
                    className="rounded-lg border bg-background p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        {item.modifiers.length > 0 && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {item.modifiers.map((m) => m.name).join(", ")}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatCurrency(item.basePrice)}
                          {modTotal > 0 && ` + ${formatCurrency(modTotal)} mods`}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(idx, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted transition hover:bg-destructive hover:text-white"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(idx, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted transition hover:bg-[hsl(24,95%,53%)] hover:text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="border-t px-5 py-3">
          {/* Quick Actions Row */}
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
            >
              <StickyNote className="h-3.5 w-3.5" />
              {notes ? "Notes ✓" : "Notes"}
            </button>
            <button
              onClick={() => {
                if (discountValue > 0) {
                  setDiscountValue(0)
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
            >
              {discountType === "percent" ? (
                <Percent className="h-3.5 w-3.5" />
              ) : (
                <DollarSign className="h-3.5 w-3.5" />
              )}
              {discountValue > 0
                ? `-${discountType === "percent" ? `${discountValue}%` : formatCurrency(discountValue)}`
                : "Discount"}
            </button>
          </div>

          {/* Notes Input */}
          {showNotes && (
            <div className="mb-3">
              <Textarea
                placeholder="Special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          )}

          {/* Discount Input */}
          <div className="mb-3 flex items-center gap-1">
            <button
              onClick={() => setDiscountType("percent")}
              className={`rounded-l-md border px-2 py-1.5 text-xs font-medium ${
                discountType === "percent"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              %
            </button>
            <button
              onClick={() => setDiscountType("fixed")}
              className={`rounded-r-md border border-l-0 px-2 py-1.5 text-xs font-medium ${
                discountType === "fixed"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              $
            </button>
            <Input
              type="number"
              min={0}
              value={discountValue || ""}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              placeholder="0"
              className="h-8 flex-1 text-sm"
            />
          </div>

          {/* Summary */}
          <div className="mb-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})
              </span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (8%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5 text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(24,95%,53%)] text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[hsl(24,95%,48%)] hover:shadow-orange-500/30 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
          >
            <CreditCard className="h-4 w-4" />
            Pay {formatCurrency(total)}
          </button>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">Complete Payment</DialogTitle>
            <DialogDescription>
              {orderType === "dine-in" ? "🍽 Dine In" : orderType === "takeaway" ? "📦 Takeaway" : "🚗 Delivery"} — {itemCount} item{itemCount !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Payment Method */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-sm font-medium transition ${
                  paymentMethod === "cash"
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                    : "border-muted text-muted-foreground hover:border-muted-foreground/30"
                }`}
              >
                <Banknote className="h-6 w-6" />
                Paid (Cash)
              </button>
              <button
                onClick={() => setPaymentMethod("not_paid")}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-sm font-medium transition ${
                  paymentMethod === "not_paid"
                    ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                    : "border-muted text-muted-foreground hover:border-muted-foreground/30"
                }`}
              >
                <Clock className="h-6 w-6" />
                Not Paid
              </button>
            </div>

            {/* Cash Input */}
            {paymentMethod === "cash" && (
              <div className="space-y-3">
                <div>
                  <Label className="mb-1 text-xs">Amount Tendered</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">£</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={cashTendered || ""}
                      onChange={(e) => setCashTendered(Number(e.target.value))}
                      placeholder="0.00"
                      className="h-12 pl-8 text-xl font-bold"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CASH_DENOMS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setCashTendered((p) => p + d)}
                      className="rounded-lg border bg-muted px-3 py-1.5 text-xs font-semibold transition hover:bg-muted/80"
                    >
                      £{d}
                    </button>
                  ))}
                  <button
                    onClick={() => setCashTendered(total)}
                    className="rounded-lg border bg-muted px-3 py-1.5 text-xs font-semibold transition hover:bg-muted/80"
                  >
                    Exact
                  </button>
                </div>
                {cashTendered >= total && (
                  <div className="rounded-xl bg-green-50 p-3 text-center dark:bg-green-950/30">
                    <p className="text-xs text-green-600 dark:text-green-400">Change</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(change)}
                    </p>
                  </div>
                )}
                {cashTendered > 0 && cashTendered < total && (
                  <p className="text-center text-sm text-destructive">
                    Remaining: {formatCurrency(total - cashTendered)}
                  </p>
                )}
              </div>
            )}

            {/* Not Paid */}
            {paymentMethod === "not_paid" && (
              <div className="rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-950/30">
                <p className="text-xs text-amber-600 dark:text-amber-400">Order will be marked as unpaid</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(total)}</p>
                <p className="text-xs text-amber-500 mt-1">Collect payment later</p>
              </div>
            )}

            {/* Confirm */}
            <button
              onClick={handlePayment}
              disabled={paymentMethod === "cash" && cashTendered < total}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(24,95%,53%)] text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[hsl(24,95%,48%)] disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Confirm {formatCurrency(total)}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" /> Order Placed!
            </DialogTitle>
          </DialogHeader>

          {receiptData && (
            <>
              {/* Hidden receipt for printing */}
              <div ref={receiptRef} style={{ display: "none" }}>
                <div className="center bold" style={{ fontSize: "16px" }}>ORDORA</div>
                <div className="center" style={{ fontSize: "11px", color: "#888" }}>Restaurant & Takeaway</div>
                <div className="line" />
                <table>
                  <tbody>
                    <tr><td>Order</td><td className="right bold">#{receiptData.orderId.slice(-6).toUpperCase()}</td></tr>
                    <tr><td>Type</td><td className="right">{receiptData.orderType.toUpperCase().replace("-", " ")}</td></tr>
                    <tr><td>Date</td><td className="right">{receiptData.date}</td></tr>
                    <tr><td>Payment</td><td className="right">{receiptData.paymentMethod === "cash" ? "CASH" : "NOT PAID"}</td></tr>
                  </tbody>
                </table>
                <div className="line" />
                {receiptData.items.map((item, i) => (
                  <div key={i}>
                    <table>
                      <tbody>
                        <tr>
                          <td className="qty">{item.quantity}x</td>
                          <td className="item-name">{item.name}</td>
                          <td className="price">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      </tbody>
                    </table>
                    {item.modifiers.map((mod, mi) => (
                      <div key={mi} className="mod-line">  1x {mod.name}</div>
                    ))}
                  </div>
                ))}
                <div className="line" />
                <table>
                  <tbody>
                    <tr><td>Subtotal</td><td className="right">{formatCurrency(receiptData.subtotal)}</td></tr>
                    {receiptData.discount > 0 && <tr><td>Discount</td><td className="right">-{formatCurrency(receiptData.discount)}</td></tr>}
                    <tr><td>Tax (8%)</td><td className="right">{formatCurrency(receiptData.tax)}</td></tr>
                    <tr className="total-line"><td className="bold" style={{ fontSize: "15px" }}>TOTAL</td><td className="right bold" style={{ fontSize: "15px" }}>{formatCurrency(receiptData.total)}</td></tr>
                  </tbody>
                </table>
                {receiptData.paymentMethod === "cash" && (
                  <table style={{ marginTop: "8px" }}>
                    <tbody>
                      <tr><td>Cash</td><td className="right">{formatCurrency(receiptData.cashTendered)}</td></tr>
                      <tr><td className="bold">Change</td><td className="right bold">{formatCurrency(receiptData.change)}</td></tr>
                    </tbody>
                  </table>
                )}
                <div className="line" />
                <div className="center footer">Thank you for your order!</div>
                <div className="center footer">www.ordora.com</div>
              </div>

              {/* Visible receipt preview */}
              <div className="rounded-xl border bg-white p-4 text-black font-mono text-xs dark:bg-gray-50">
                <div className="text-center font-bold text-base mb-0.5">ORDORA</div>
                <div className="text-center text-gray-500 text-[10px] mb-2">Restaurant & Takeaway</div>
                <div className="border-t border-dashed border-gray-300 my-2" />
                <div className="flex justify-between mb-0.5"><span>Order</span><span className="font-bold">#{receiptData.orderId.slice(-6).toUpperCase()}</span></div>
                <div className="flex justify-between mb-0.5"><span>Type</span><span>{receiptData.orderType.toUpperCase().replace("-", " ")}</span></div>
                <div className="flex justify-between mb-0.5"><span>Date</span><span>{receiptData.date}</span></div>
                <div className="flex justify-between mb-1"><span>Payment</span><span className={receiptData.paymentMethod === "not_paid" ? "text-amber-600 font-bold" : ""}>{receiptData.paymentMethod === "cash" ? "CASH" : "NOT PAID"}</span></div>
                <div className="border-t border-dashed border-gray-300 my-2" />
                {receiptData.items.map((item, i) => (
                  <div key={i} className="mb-1.5">
                    <div className="flex justify-between">
                      <span className="font-bold">{item.quantity}x {item.name}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                    {item.modifiers.map((mod, mi) => (
                      <div key={mi} className="pl-3 text-gray-500">1x {mod.name}</div>
                    ))}
                  </div>
                ))}
                <div className="border-t border-dashed border-gray-300 my-2" />
                <div className="flex justify-between mb-0.5"><span>Subtotal</span><span>{formatCurrency(receiptData.subtotal)}</span></div>
                {receiptData.discount > 0 && <div className="flex justify-between mb-0.5 text-green-600"><span>Discount</span><span>-{formatCurrency(receiptData.discount)}</span></div>}
                <div className="flex justify-between mb-0.5"><span>Tax (8%)</span><span>{formatCurrency(receiptData.tax)}</span></div>
                <div className="flex justify-between border-t-2 border-black mt-2 pt-2 text-sm font-bold">
                  <span>TOTAL</span><span>{formatCurrency(receiptData.total)}</span>
                </div>
                {receiptData.paymentMethod === "cash" && (
                  <div className="mt-2">
                    <div className="flex justify-between"><span>Cash</span><span>{formatCurrency(receiptData.cashTendered)}</span></div>
                    <div className="flex justify-between font-bold"><span>Change</span><span>{formatCurrency(receiptData.change)}</span></div>
                  </div>
                )}
                <div className="border-t border-dashed border-gray-300 my-2" />
                <div className="text-center text-gray-400 text-[10px]">Thank you for your order!</div>
                <div className="text-center text-gray-400 text-[10px]">www.ordora.com</div>
              </div>

              <div className="flex gap-2 mt-2">
                <Button onClick={handlePrint} className="flex-1" size="lg">
                  <Printer className="mr-2 h-4 w-4" /> Print Receipt
                </Button>
                <Button variant="outline" onClick={() => setShowReceipt(false)} className="flex-1" size="lg">
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
