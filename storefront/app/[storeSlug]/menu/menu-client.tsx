"use client"

import { useState, useMemo, useRef } from "react"
import { toast } from "sonner"
import { formatCurrency } from "@ordora/shared/lib/utils"
import { createOnlineOrder } from "@/lib/actions/order"
import {
  Search, Minus, Plus, Trash2, ShoppingBag, X, ArrowLeft, Check, Truck, Store,
  AlertTriangle, ChevronRight, MapPin, Phone, Clock, Navigation, Star,
} from "lucide-react"

interface Modifier { id: string; name: string; price: number }
interface ModifierGroup { id: string; name: string; required: boolean; minSelect: number; maxSelect: number; items: Modifier[] }
interface MenuItemType { id: string; name: string; description: string; price: number; category: string; imageUrl: string | null; soldOut: boolean; isFeatured: boolean; allergens: string }
interface CartItemModifier { modifierId: string; name: string; price: number }
interface CartItem { menuItemId: string; name: string; basePrice: number; quantity: number; modifiers: CartItemModifier[]; notes: string }
type OrderType = "COLLECTION" | "DELIVERY"

interface Props {
  store: { id: string; name: string; slug: string; phone: string | null; address: string | null; postcode: string | null; webServiceCharge: number; bagCharge: number }
  menuItems: MenuItemType[]
  categories: string[]
  modifierGroups: ModifierGroup[]
  itemModLinks: Record<string, string[]>
  storeInfo: { isOpen: boolean; hoursText: string; hoursUntil: string; address: string; phone: string; collectionHours: string; deliveryHours: string }
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function MenuClient({ store, menuItems, categories, modifierGroups, itemModLinks, storeInfo }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [orderType, setOrderType] = useState<OrderType>("COLLECTION")
  const [search, setSearch] = useState("")
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null)
  const [modifierSelections, setModifierSelections] = useState<Record<string, Record<string, number>>>({})
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showOrderConfirmed, setShowOrderConfirmed] = useState(false)
  const [orderResult, setOrderResult] = useState<{ orderId: string; total: number } | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const itemsRef = useRef<HTMLDivElement>(null)

  const filteredItems = useMemo(() => {
    let items = activeCategory ? menuItems.filter(i => i.category === activeCategory) : menuItems
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
    }
    return items
  }, [menuItems, activeCategory, search])

  const subtotal = useMemo(() =>
    cart.reduce((s, item) => {
      const modTotal = item.modifiers.reduce((ms, m) => ms + m.price, 0)
      return s + (item.basePrice + modTotal) * item.quantity
    }, 0), [cart])

  const serviceCharge = store.webServiceCharge > 0 ? Math.round(subtotal * store.webServiceCharge / 100) : 0
  const bagCharge = cart.length > 0 ? store.bagCharge : 0
  const deliveryFee = orderType === "DELIVERY" ? 300 : 0
  const total = subtotal + serviceCharge + bagCharge + deliveryFee
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0)

  function getItemMods(itemId: string): ModifierGroup[] {
    const groupIds = itemModLinks[itemId] || []
    return modifierGroups.filter(mg => groupIds.includes(mg.id))
  }

  function handleItemClick(item: MenuItemType) {
    if (item.soldOut) { toast.error(`${item.name} is sold out`); return }
    const mods = getItemMods(item.id)
    if (mods.length === 0) { addToCart(item, []); return }
    setSelectedItem(item)
    const initial: Record<string, Record<string, number>> = {}
    for (const mg of mods) initial[mg.id] = {}
    setModifierSelections(initial)
  }

  function handleModifierToggle(groupId: string, modifierId: string, group: ModifierGroup) {
    setModifierSelections(prev => {
      const current = prev[groupId] || {}
      const currentCount = current[modifierId] || 0
      const totalCount = Object.values(current).reduce((a, b) => a + b, 0)
      if (group.required && group.maxSelect === 1) return { ...prev, [groupId]: { [modifierId]: 1 } }
      if (currentCount > 0) {
        const updated = { ...current }; updated[modifierId] = currentCount - 1
        if (updated[modifierId] === 0) delete updated[modifierId]
        return { ...prev, [groupId]: updated }
      }
      if (totalCount >= group.maxSelect) return prev
      return { ...prev, [groupId]: { ...current, [modifierId]: currentCount + 1 } }
    })
  }

  function getModifierGroupCount(groupId: string) { return Object.values(modifierSelections[groupId] || {}).reduce((a, b) => a + b, 0) }
  function getModifierCount(groupId: string, modifierId: string) { return (modifierSelections[groupId] || {})[modifierId] || 0 }

  function canAddFromModifierPanel() {
    if (!selectedItem) return false
    for (const mg of getItemMods(selectedItem.id)) { if (getModifierGroupCount(mg.id) < mg.minSelect) return false }
    return true
  }

  function getModTotalForItem(item: MenuItemType) {
    let modTotal = 0
    for (const mg of getItemMods(item.id)) {
      const sel = modifierSelections[mg.id] || {}
      for (const [modId, count] of Object.entries(sel)) {
        const mod = mg.items.find(m => m.id === modId)
        if (mod) modTotal += mod.price * count
      }
    }
    return modTotal
  }

  function confirmAddWithModifiers() {
    if (!selectedItem) return
    const mods: CartItemModifier[] = []
    for (const mg of getItemMods(selectedItem.id)) {
      const sel = modifierSelections[mg.id] || {}
      for (const [modId, count] of Object.entries(sel)) {
        const mod = mg.items.find(m => m.id === modId)
        if (mod) for (let i = 0; i < count; i++) mods.push({ modifierId: mod.id, name: mod.name, price: mod.price })
      }
    }
    addToCart(selectedItem, mods)
    setSelectedItem(null)
    setModifierSelections({})
  }

  function addToCart(item: MenuItemType, modifiers: CartItemModifier[]) {
    const key = `${item.id}-${modifiers.map(m => m.modifierId).sort().join(",")}`
    setCart(prev => {
      const idx = prev.findIndex(c => `${c.menuItemId}-${c.modifiers.map(m => m.modifierId).sort().join(",")}` === key)
      if (idx >= 0) { const u = [...prev]; u[idx] = { ...u[idx], quantity: u[idx].quantity + 1 }; return u }
      return [...prev, { menuItemId: item.id, name: item.name, basePrice: item.price, quantity: 1, modifiers, notes: "" }]
    })
    toast.success(`Added ${item.name}`)
  }

  function updateCartQty(index: number, delta: number) {
    setCart(prev => {
      const u = [...prev]; u[index] = { ...u[index], quantity: u[index].quantity + delta }
      if (u[index].quantity <= 0) u.splice(index, 1); return u
    })
  }

  async function handleCheckout() {
    if (!customerName || !customerPhone) { toast.error("Please enter your name and phone number"); return }
    if (orderType === "DELIVERY" && !customerAddress) { toast.error("Please enter your delivery address"); return }
    setSubmitting(true)
    try {
      const result = await createOnlineOrder({
        storeSlug: store.slug, customerName, customerPhone,
        customerAddress: orderType === "DELIVERY" ? customerAddress : undefined,
        orderType, notes: notes || undefined,
        items: cart.map(c => ({
          menuItemId: c.menuItemId, name: c.name, quantity: c.quantity, unitPrice: c.basePrice,
          modifiers: c.modifiers.map(m => ({ modifierId: m.modifierId, name: m.name, price: m.price })),
        })),
        subtotal, deliveryFee, serviceCharge, bagCharge, total,
      })
      setOrderResult(result); setShowCheckout(false); setShowCart(false); setShowOrderConfirmed(true)
      setCart([]); setCustomerName(""); setCustomerPhone(""); setCustomerAddress(""); setNotes("")
    } catch { toast.error("Failed to place order.") } finally { setSubmitting(false) }
  }

  const catItemCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of menuItems) { counts[item.category] = (counts[item.category] || 0) + 1 }
    return counts
  }, [menuItems])

  const visibleCategories = activeCategory ? categories.filter(c => c === activeCategory) : categories

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href={`/${store.slug}`} className="font-display text-lg tracking-tight text-foreground">{store.name}</a>
          <nav className="hidden items-center gap-5 text-sm font-medium sm:flex">
            <a href={`/${store.slug}`} className="text-muted-foreground hover:text-foreground transition">Home</a>
            <a href={`/${store.slug}/menu`} className="text-secondary hover:underline underline-offset-2">Menu</a>
          </nav>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-semibold border border-border">
              <span className={`size-1.5 rounded-full ${storeInfo.isOpen ? "bg-emerald-500" : "bg-destructive"}`} />
              <span className={storeInfo.isOpen ? "text-emerald-700" : "text-destructive"}>{storeInfo.hoursText}</span>
            </span>
            <button onClick={() => setShowCart(true)}
              className="relative flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">
              <ShoppingBag className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground cart-bump">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile: Order Type */}
      <div className="mx-auto max-w-6xl px-4 pt-3 sm:hidden">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(["COLLECTION", "DELIVERY"] as OrderType[]).map(t => (
            <button key={t} onClick={() => setOrderType(t)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition ${orderType === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {t === "COLLECTION" ? <><Store className="h-3.5 w-3.5" /> Collection</> : <><Truck className="h-3.5 w-3.5" /> Delivery</>}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: Category Scroll */}
      <div className="sm:hidden overflow-x-auto no-scrollbar border-b border-border bg-background/80">
        <div className="flex gap-1 px-4 py-2">
          <button onClick={() => setActiveCategory(null)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeCategory === null ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"}`}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => { setActiveCategory(cat); itemsRef.current?.scrollIntoView({ behavior: "smooth" }) }}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: Search */}
      <div className="sm:hidden mx-auto max-w-6xl px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition" />
        </div>
      </div>

      {/* Desktop 3-column layout */}
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_340px] gap-0">

          {/* Left: Category Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[61px] max-h-[calc(100vh-61px)] overflow-y-auto no-scrollbar pr-2 pt-2">
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card py-2 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-secondary/30 transition" />
                </div>
              </div>
              <button onClick={() => setActiveCategory(null)}
                className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeCategory === null ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground"}`}>
                <span>All Items</span>
                <span className="text-xs opacity-70">{menuItems.length}</span>
              </button>
              {categories.map(cat => (
                <button key={cat} onClick={() => { setActiveCategory(cat); itemsRef.current?.scrollIntoView({ behavior: "smooth" }) }}
                  className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeCategory === cat ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground"}`}>
                  <span className="font-display text-xs uppercase tracking-wider">{cat}</span>
                  <span className="text-xs opacity-70">{catItemCounts[cat] || 0}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Center: Menu Items */}
          <div ref={itemsRef} className="lg:px-4 overflow-y-auto lg:max-h-[calc(100vh-61px)]">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <ShoppingBag className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-sm">No items found</p>
              </div>
            ) : (
              visibleCategories.map(cat => {
                const catItems = filteredItems.filter(i => i.category === cat)
                if (catItems.length === 0) return null
                return (
                  <div key={cat} className="mb-6">
                    <h2 className="mb-3 border-b border-border pb-2 text-base font-semibold text-foreground">{cat}</h2>
                    <div className="space-y-2">
                      {catItems.map(item => {
                        const hasMods = getItemMods(item.id).length > 0
                        return (
                          <div key={item.id}
                            className={`flex gap-4 rounded-xl border border-border bg-card p-3 transition hover:shadow-md ${item.soldOut ? "opacity-50" : ""}`}>
                            {/* Image */}
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                            ) : (
                              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-xl font-display text-muted-foreground/30">
                                {item.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-foreground">{item.name}</h3>
                                <span className="shrink-0 text-sm font-bold text-foreground">£{item.price.toFixed(2)}</span>
                              </div>
                              {item.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                              {item.allergens && (
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700">
                                  <AlertTriangle className="h-3 w-3" /> {item.allergens}
                                </div>
                              )}
                            </div>
                            {/* Add button */}
                            <div className="flex items-end shrink-0">
                              {item.soldOut ? (
                                <span className="rounded-full bg-destructive/10 px-3 py-1 text-[10px] font-bold text-destructive">Sold Out</span>
                              ) : (
                                <button onClick={() => handleItemClick(item)}
                                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition active:scale-95">
                                  {hasMods ? "Customise" : "+ Add"}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Right: Cart (Desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[61px] max-h-[calc(100vh-61px)] overflow-y-auto no-scrollbar pl-4 pt-2">
              {/* Order Type Toggle */}
              <div className="mb-3 flex gap-1 rounded-lg bg-muted p-1">
                {(["COLLECTION", "DELIVERY"] as OrderType[]).map(t => (
                  <button key={t} onClick={() => setOrderType(t)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition ${orderType === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                    {t === "COLLECTION" ? <Store className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Cart */}
              <div className="rounded-card-lg bg-card border border-border shadow-card">
                <div className="p-4">
                  <h3 className="mb-2 font-display text-sm tracking-tight text-foreground">Your order</h3>
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      <ShoppingBag className="mx-auto mb-2 h-8 w-8 opacity-20" />
                      <p>Your basket is empty</p>
                      <p className="mt-1 text-xs text-muted-foreground/60">Add items from the menu to get started.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {cart.map((item, idx) => {
                          const modTotal = item.modifiers.reduce((s, m) => s + m.price, 0)
                          const lineTotal = (item.basePrice + modTotal) * item.quantity
                          return (
                            <div key={idx} className="rounded-lg border border-border bg-muted/30 p-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground">{item.quantity}x {item.name}</p>
                                  {item.modifiers.length > 0 && (
                                    <p className="mt-0.5 text-[10px] text-muted-foreground">{item.modifiers.map(m => m.name).join(", ")}</p>
                                  )}
                                </div>
                                <span className="text-sm font-bold text-foreground">£{lineTotal.toFixed(2)}</span>
                              </div>
                              <div className="mt-1.5 flex items-center gap-1">
                                <button onClick={() => updateCartQty(idx, -1)}
                                  className="flex size-6 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition">
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-foreground">{item.quantity}</span>
                                <button onClick={() => updateCartQty(idx, 1)}
                                  className="flex size-6 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary transition">
                                  <Plus className="h-3 w-3" />
                                </button>
                                <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                                  className="ml-auto text-muted-foreground hover:text-destructive transition">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {/* Notes */}
                      <textarea placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                        className="mt-3 w-full rounded-lg border border-border bg-muted/30 p-2.5 text-xs outline-none focus:ring-2 focus:ring-secondary/30 transition resize-none" />
                    </>
                  )}
                </div>

                {/* Summary */}
                {cart.length > 0 && (
                  <div className="border-t border-border p-4 space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span><span className="font-medium">£{subtotal.toFixed(2)}</span></div>
                    {serviceCharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Service charge</span><span>£{serviceCharge.toFixed(2)}</span></div>}
                    {bagCharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Bag</span><span>£{bagCharge.toFixed(2)}</span></div>}
                    {orderType === "DELIVERY" && <div className="flex justify-between"><span className="text-muted-foreground">Delivery fee</span><span>£{deliveryFee.toFixed(2)}</span></div>}
                    <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                      <span>Total</span><span>£{total.toFixed(2)}</span>
                    </div>
                    <button onClick={() => setShowCheckout(true)}
                      className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition active:scale-[0.98]">
                      Checkout £{total.toFixed(2)}
                    </button>
                  </div>
                )}
              </div>

              {/* Store Info */}
              <div className="mt-4 rounded-card-lg bg-card border border-border p-4">
                <h4 className="mb-2 font-display text-xs tracking-tight text-foreground">Find us</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" />{store.address}{store.postcode ? `, ${store.postcode}` : ""}</div>
                  {store.phone && <a href={`tel:${store.phone}`} className="flex items-center gap-2 hover:text-foreground transition"><Phone className="h-3.5 w-3.5 shrink-0" />{store.phone}</a>}
                  <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 shrink-0" />{storeInfo.hoursText} {storeInfo.hoursUntil}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Cart Slide-in */}
      {showCart && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="scrim-enter absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="sheet-enter absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-base tracking-tight">Your order</h2>
              <button onClick={() => setShowCart(false)} className="rounded-lg p-1 hover:bg-muted transition"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ShoppingBag className="mb-3 h-10 w-10 opacity-20" />
                  <p className="text-sm">Your basket is empty</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, idx) => {
                    const lineTotal = (item.basePrice + item.modifiers.reduce((s, m) => s + m.price, 0)) * item.quantity
                    return (
                      <div key={idx} className="rounded-xl border border-border bg-card p-3">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-semibold">{item.quantity}x {item.name}</p>
                          <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        {item.modifiers.length > 0 && <p className="mt-0.5 text-[10px] text-muted-foreground">{item.modifiers.map(m => m.name).join(", ")}</p>}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateCartQty(idx, -1)} className="flex size-6 items-center justify-center rounded-md border border-border bg-muted text-foreground"><Minus className="h-3 w-3" /></button>
                            <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                            <button onClick={() => updateCartQty(idx, 1)} className="flex size-6 items-center justify-center rounded-md border border-border bg-muted text-foreground"><Plus className="h-3 w-3" /></button>
                          </div>
                          <span className="text-sm font-bold">£{lineTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })}
                  <textarea placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    className="w-full rounded-lg border border-border bg-muted/30 p-2.5 text-xs outline-none resize-none" />
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-border px-5 py-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
                {serviceCharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Service charge</span><span>£{serviceCharge.toFixed(2)}</span></div>}
                {bagCharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Bag</span><span>£{bagCharge.toFixed(2)}</span></div>}
                {orderType === "DELIVERY" && <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>£{deliveryFee.toFixed(2)}</span></div>}
                <div className="flex justify-between border-t border-border pt-2 font-bold"><span>Total</span><span>£{total.toFixed(2)}</span></div>
                <button onClick={() => { setShowCart(false); setShowCheckout(true) }}
                  className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">
                  Checkout £{total.toFixed(2)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Cart Footer */}
      {itemCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm px-4 py-3 shadow-lg lg:hidden">
          <button onClick={() => setShowCart(true)}
            className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-lg bg-primary px-5 py-3 text-primary-foreground">
            <div className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">{itemCount}</span>
              <span className="text-sm font-semibold">View order</span>
            </div>
            <span className="text-sm font-bold">£{total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modifier Dialog */}
      {selectedItem && (
        <div className="fixed inset-0 z-50">
          <div className="scrim-enter absolute inset-0 bg-black/40" onClick={() => setSelectedItem(null)} />
          <div className="sheet-enter absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[1.5rem] bg-background sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl shadow-2xl">
            <div className="sticky top-0 flex items-center gap-3 border-b border-border bg-background px-5 py-4 rounded-t-[1.5rem] sm:rounded-t-2xl">
              <button onClick={() => setSelectedItem(null)} className="rounded-lg p-1 hover:bg-muted transition"><ArrowLeft className="h-5 w-5" /></button>
              <div>
                <h2 className="font-semibold text-foreground">{selectedItem.name}</h2>
                <p className="text-xs text-muted-foreground">£{selectedItem.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="px-5 py-4">
              {getItemMods(selectedItem.id).map(group => {
                const gc = getModifierGroupCount(group.id)
                return (
                  <div key={group.id} className="mb-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
                      <span className="text-[11px] text-muted-foreground">
                        {group.required ? (group.maxSelect === 1 ? "Required" : `Select ${group.minSelect}–${group.maxSelect}`) : "Optional"}
                        {group.required && gc < group.minSelect && <span className="ml-1 text-destructive">({group.minSelect - gc} more)</span>}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {group.items.map(mod => {
                        const count = getModifierCount(group.id, mod.id)
                        return (
                          <div key={mod.id} className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 transition ${count > 0 ? "border-secondary bg-secondary/5" : "border-border"}`}>
                            <span className="text-sm font-medium text-foreground">{mod.name}</span>
                            <div className="flex items-center gap-2">
                              {mod.price > 0 && <span className="text-xs text-muted-foreground">+£{mod.price.toFixed(2)}</span>}
                              <div className="flex items-center gap-1">
                                <button onClick={() => count > 0 && handleModifierToggle(group.id, mod.id, group)} disabled={count === 0}
                                  className="flex size-7 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 transition">
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-6 text-center text-sm font-bold">{count}</span>
                                <button onClick={() => handleModifierToggle(group.id, mod.id, group)}
                                  disabled={group.maxSelect > 0 && gc >= group.maxSelect && count === 0}
                                  className="flex size-7 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition">
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
            <div className="sticky bottom-0 border-t border-border bg-background px-5 py-3 rounded-b-[1.5rem] sm:rounded-b-2xl">
              <button onClick={confirmAddWithModifiers} disabled={!canAddFromModifierPanel()}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 transition">
                <Plus className="h-4 w-4" /> Add to order — £{(selectedItem.price + getModTotalForItem(selectedItem)).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      {showCheckout && (
        <div className="fixed inset-0 z-50">
          <div className="scrim-enter absolute inset-0 bg-black/40" onClick={() => !submitting && setShowCheckout(false)} />
          <div className="sheet-enter absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-[1.5rem] bg-background sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-5 py-4 rounded-t-[1.5rem] sm:rounded-t-2xl">
              <button onClick={() => setShowCheckout(false)} disabled={submitting} className="rounded-lg p-1 hover:bg-muted transition"><ArrowLeft className="h-5 w-5" /></button>
              <h2 className="font-semibold">Checkout</h2>
              <div className="w-8" />
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Your Name *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Smith"
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary/30 transition" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Phone Number *</label>
                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="07123 456789"
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary/30 transition" />
              </div>
              {orderType === "DELIVERY" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Delivery Address *</label>
                  <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="123 High Street, BB1 1AA" rows={2}
                    className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary/30 transition resize-none" />
                </div>
              )}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1.5 text-sm">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between"><span className="text-muted-foreground">{item.quantity}x {item.name}</span><span className="font-medium">£{((item.basePrice + item.modifiers.reduce((s, m) => s + m.price, 0)) * item.quantity).toFixed(2)}</span></div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 mt-1 font-bold text-base"><span>Total</span><span>£{total.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="sticky bottom-0 border-t border-border bg-background px-5 py-3 rounded-b-[1.5rem] sm:rounded-b-2xl">
              <button onClick={handleCheckout} disabled={submitting || cart.length === 0}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition">
                {submitting ? "Placing Order..." : <><Check className="h-4 w-4" /> Place Order — £{total.toFixed(2)}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmed */}
      {showOrderConfirmed && orderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-card-lg bg-card p-8 text-center shadow-card-lg sheet-enter">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success/15">
              <Check className="size-8 text-success" />
            </div>
            <h2 className="font-display text-xl tracking-tight">Order Confirmed!</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your order has been placed successfully</p>
            <div className="mt-4 rounded-xl bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Order ID</p>
              <p className="text-lg font-bold text-foreground">#{orderResult.orderId.slice(-6).toUpperCase()}</p>
              <p className="mt-2 text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-secondary">£{orderResult.total.toFixed(2)}</p>
            </div>
            <button onClick={() => { setShowOrderConfirmed(false); setOrderResult(null) }}
              className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-3 font-display text-xs tracking-tight text-foreground uppercase">Explore</p>
              <div className="space-y-1.5 text-sm">
                <p><a href={`/${store.slug}`} className="text-muted-foreground hover:text-foreground transition">Home</a></p>
                <p><a href={`/${store.slug}/menu`} className="text-muted-foreground hover:text-foreground transition">Order online</a></p>
              </div>
            </div>
            <div>
              <p className="mb-3 font-display text-xs tracking-tight text-foreground uppercase">Legal</p>
              <div className="space-y-1.5 text-sm">
                <p><a href={`/${store.slug}/terms`} className="text-muted-foreground hover:text-foreground transition">Terms & Conditions</a></p>
                <p><a href={`/${store.slug}/privacy`} className="text-muted-foreground hover:text-foreground transition">Privacy Policy</a></p>
              </div>
            </div>
            <div>
              <p className="mb-3 font-display text-xs tracking-tight text-foreground uppercase">Get in touch</p>
              <div className="space-y-1.5 text-sm">
                {store.phone && <p><a href={`tel:${store.phone}`} className="text-muted-foreground hover:text-foreground transition">{store.phone}</a></p>}
                {store.address && <p className="text-muted-foreground">{store.address}{store.postcode ? `, ${store.postcode}` : ""}</p>}
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            <p>© 2026 {store.name}. All rights reserved.</p>
            <p className="mt-1">Powered by <span className="font-semibold text-secondary">Ordora</span></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
