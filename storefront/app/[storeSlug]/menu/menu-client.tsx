"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { toast } from "sonner"
import { formatCurrency } from "@ordora/shared/lib/utils"
import { createOnlineOrder } from "@/lib/actions/order"
import {
  Search,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Clock,
  X,
  ChevronRight,
  MapPin,
  Phone,
  ArrowLeft,
  Check,
  Star,
  Truck,
  Package,
  Store,
  AlertTriangle,
} from "lucide-react"

interface Modifier { id: string; name: string; price: number }
interface ModifierGroup { id: string; name: string; required: boolean; minSelect: number; maxSelect: number; items: Modifier[] }
interface MenuItemType { id: string; name: string; description: string; price: number; category: string; imageUrl: string | null; soldOut: boolean; isFeatured: boolean; allergens: string }
interface CartItemModifier { modifierId: string; name: string; price: number }
interface CartItem { menuItemId: string; name: string; basePrice: number; quantity: number; modifiers: CartItemModifier[]; notes: string }

type OrderType = "COLLECTION" | "DELIVERY"

interface Props {
  store: { id: string; name: string; slug: string; phone: string | null; address: string | null; webServiceCharge: number; bagCharge: number }
  menuItems: MenuItemType[]
  categories: string[]
  modifierGroups: ModifierGroup[]
  itemModLinks: Record<string, string[]>
}

export default function MenuClient({ store, menuItems, categories, modifierGroups, itemModLinks }: Props) {
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
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})
  const menuRef = useRef<HTMLDivElement>(null)

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
  const bagQty = cart.length > 0 ? 1 : 0
  const bagCharge = store.bagCharge * bagQty
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
    if (mods.length === 0) {
      addToCart(item, [])
      return
    }
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
        const updated = { ...current }
        updated[modifierId] = currentCount - 1
        if (updated[modifierId] === 0) delete updated[modifierId]
        return { ...prev, [groupId]: updated }
      }
      if (totalCount >= group.maxSelect) return prev
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
    const mods = getItemMods(selectedItem.id)
    for (const mg of mods) {
      if (getModifierGroupCount(mg.id) < mg.minSelect) return false
    }
    return true
  }

  function getModTotalForItem(item: MenuItemType) {
    let modTotal = 0
    const mods = getItemMods(item.id)
    for (const mg of mods) {
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
    const itemMods = getItemMods(selectedItem.id)
    for (const mg of itemMods) {
      const sel = modifierSelections[mg.id] || {}
      for (const [modId, count] of Object.entries(sel)) {
        const mod = mg.items.find(m => m.id === modId)
        if (mod) {
          for (let i = 0; i < count; i++) mods.push({ modifierId: mod.id, name: mod.name, price: mod.price })
        }
      }
    }
    addToCart(selectedItem, mods)
    setSelectedItem(null)
    setModifierSelections({})
  }

  function addToCart(item: MenuItemType, modifiers: CartItemModifier[]) {
    const key = `${item.id}-${modifiers.map(m => m.modifierId).sort().join(",")}`
    setCart(prev => {
      const existingIdx = prev.findIndex(c => {
        const cKey = `${c.menuItemId}-${c.modifiers.map(m => m.modifierId).sort().join(",")}`
        return cKey === key
      })
      if (existingIdx >= 0) {
        const updated = [...prev]
        updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + 1 }
        return updated
      }
      return [...prev, { menuItemId: item.id, name: item.name, basePrice: item.price, quantity: 1, modifiers, notes: "" }]
    })
    setItemQuantities(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))
    toast.success(`Added ${item.name}`)
  }

  function updateCartQty(index: number, delta: number) {
    setCart(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], quantity: updated[index].quantity + delta }
      if (updated[index].quantity <= 0) updated.splice(index, 1)
      return updated
    })
  }

  function removeCartItem(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  function clearCart() {
    setCart([])
    setItemQuantities({})
    setNotes("")
  }

  function scrollToCategory(cat: string) {
    setActiveCategory(cat)
    menuRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  async function handleCheckout() {
    if (!customerName || !customerPhone) {
      toast.error("Please enter your name and phone number")
      return
    }
    if (orderType === "DELIVERY" && !customerAddress) {
      toast.error("Please enter your delivery address")
      return
    }
    setSubmitting(true)
    try {
      const result = await createOnlineOrder({
        storeSlug: store.slug,
        customerName,
        customerPhone,
        customerAddress: orderType === "DELIVERY" ? customerAddress : undefined,
        orderType,
        notes: notes || undefined,
        items: cart.map(c => ({
          menuItemId: c.menuItemId,
          name: c.name,
          quantity: c.quantity,
          unitPrice: c.basePrice,
          modifiers: c.modifiers.map(m => ({ modifierId: m.modifierId, name: m.name, price: m.price })),
        })),
        subtotal,
        deliveryFee,
        serviceCharge,
        bagCharge,
        total,
      })
      setOrderResult(result)
      setShowCheckout(false)
      setShowCart(false)
      setShowOrderConfirmed(true)
      setCart([])
      setItemQuantities({})
      setCustomerName("")
      setCustomerPhone("")
      setCustomerAddress("")
      setNotes("")
    } catch {
      toast.error("Failed to place order. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const featuredItems = menuItems.filter(i => i.isFeatured && !i.soldOut).slice(0, 6)

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href={`/${store.slug}`} className="text-xl font-bold text-ink">{store.name}</a>
          <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
            <a href={`/${store.slug}`} className="text-ink/60 hover:text-ink transition">Home</a>
            <a href={`/${store.slug}/menu`} className="text-ink hover:text-ink/80 font-semibold transition">Menu</a>
          </nav>
          <button onClick={() => setShowCart(true)} className="relative flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 transition">
            <ShoppingBag className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full brand-bg px-1 text-[10px] font-bold text-white">{itemCount}</span>
            )}
            Cart
          </button>
        </div>
      </header>

      {/* Order Type Toggle */}
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="flex items-center gap-2 rounded-xl bg-surface border border-line p-1.5 shadow-sm">
          {(["COLLECTION", "DELIVERY"] as OrderType[]).map(t => (
            <button key={t} onClick={() => setOrderType(t)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${orderType === t ? "bg-ink text-white shadow-md" : "text-ink/60 hover:text-ink"}`}>
              {t === "COLLECTION" ? <><Store className="h-4 w-4" /> Collection</> : <><Truck className="h-4 w-4" /> Delivery</>}
            </button>
          ))}
        </div>
      </div>

      {/* Category Bar */}
      <div className="sticky top-[61px] z-30 border-b border-line bg-paper">
        <div className="mx-auto max-w-6xl overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 px-4 py-2">
            <button onClick={() => setActiveCategory(null)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${activeCategory === null ? "bg-ink text-white" : "bg-surface border border-line text-ink/60 hover:text-ink"}`}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => scrollToCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${activeCategory === cat ? "bg-ink text-white" : "bg-surface border border-line text-ink/60 hover:text-ink"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input type="text" placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-ink/30 transition" />
        </div>
      </div>

      {/* Featured Banner */}
      {!activeCategory && !search && featuredItems.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pb-2">
          <div className="rounded-2xl bg-gradient-to-r from-ink to-ink/80 p-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Popular Items</span>
            </div>
            <p className="text-sm text-white/60">Most loved by our customers</p>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div ref={menuRef} className="mx-auto max-w-6xl px-4 py-4 pb-24">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-ink/40">
            <ShoppingBag className="mb-3 h-12 w-12" />
            <p className="text-sm">No items found</p>
          </div>
        ) : (
          categories.filter(cat => !activeCategory || cat === activeCategory).map(cat => {
            const catItems = filteredItems.filter(i => i.category === cat)
            if (catItems.length === 0) return null
            return (
              <div key={cat} className="mb-6">
                <h2 className="mb-3 text-lg font-bold text-ink">{cat}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {catItems.map(item => (
                    <button key={item.id} onClick={() => handleItemClick(item)} disabled={item.soldOut}
                      className={`group relative flex items-start gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-all hover:shadow-md active:scale-[0.98] ${item.soldOut ? "opacity-50 cursor-not-allowed" : "hover:border-brand/30"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-ink group-hover:text-brand transition">{item.name}</h3>
                          <span className="shrink-0 text-sm font-bold brand-text">{formatCurrency(item.price)}</span>
                        </div>
                        {item.description && <p className="mt-1 text-xs text-ink/50 line-clamp-2">{item.description}</p>}
                        {item.allergens && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-600">
                            <AlertTriangle className="h-3 w-3" /> Allergens: {item.allergens}
                          </div>
                        )}
                        {item.soldOut ? (
                          <span className="mt-2 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">Sold Out</span>
                        ) : getItemMods(item.id).length > 0 ? (
                          <span className="mt-2 inline-block rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/40">Tap to customize</span>
                        ) : null}
                      </div>
                      {!item.soldOut && (
                        <div className="shrink-0">
                          {getItemMods(item.id).length === 0 ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full brand-bg text-white shadow-md shadow-brand/20 transition-all hover:scale-110 group-hover:shadow-lg">
                              <Plus className="h-5 w-5" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-ink/20 text-ink/30 transition-all group-hover:border-brand/40 group-hover:text-brand">
                              <Plus className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Cart Slide-in Panel */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-lg font-bold text-ink">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="rounded-lg p-1 hover:bg-ink/5"><X className="h-5 w-5" /></button>
            </div>

            {/* Order Type in Cart */}
            <div className="flex gap-1 border-b border-line px-5 py-3">
              {(["COLLECTION", "DELIVERY"] as OrderType[]).map(t => (
                <button key={t} onClick={() => setOrderType(t)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${orderType === t ? "bg-ink text-white" : "bg-paper text-ink/60"}`}>
                  {t === "COLLECTION" ? <Store className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-ink/30">
                  <ShoppingBag className="mb-3 h-10 w-10" />
                  <p className="text-sm">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, idx) => {
                    const modTotal = item.modifiers.reduce((s, m) => s + m.price, 0)
                    const lineTotal = (item.basePrice + modTotal) * item.quantity
                    return (
                      <div key={idx} className="rounded-xl border border-line bg-paper p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-ink">{item.name}</p>
                            {item.modifiers.length > 0 && (
                              <p className="mt-0.5 text-[11px] text-ink/40">{item.modifiers.map(m => m.name).join(", ")}</p>
                            )}
                          </div>
                          <button onClick={() => removeCartItem(idx)} className="ml-2 rounded p-0.5 text-ink/30 hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateCartQty(idx, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-ink/60 hover:bg-red-50 hover:text-red-600 transition">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-sm font-bold text-ink">{item.quantity}</span>
                            <button onClick={() => updateCartQty(idx, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-ink/60 hover:bg-brand/5 hover:text-brand transition">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-ink">{formatCurrency(lineTotal)}</span>
                        </div>
                      </div>
                    )
                  })}

                  {/* Notes */}
                  <div>
                    <textarea placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      className="w-full rounded-xl border border-line bg-surface p-3 text-sm outline-none focus:border-ink/30 transition resize-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="border-t border-line px-5 py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-ink/50">Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
                  <span className="text-ink">{formatCurrency(subtotal)}</span>
                </div>
                {serviceCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/50">Service charge ({store.webServiceCharge}%)</span>
                    <span className="text-ink">{formatCurrency(serviceCharge)}</span>
                  </div>
                )}
                {bagCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/50">Bag</span>
                    <span className="text-ink">{formatCurrency(bagCharge)}</span>
                  </div>
                )}
                {orderType === "DELIVERY" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/50">Delivery fee</span>
                    <span className="text-ink">{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
                  <span className="text-ink">Total</span>
                  <span className="text-ink">{formatCurrency(total)}</span>
                </div>
                <button onClick={() => { setShowCart(false); setShowCheckout(true) }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl brand-bg text-sm font-bold text-white shadow-lg shadow-brand/20 hover:opacity-90 active:scale-[0.98] transition mt-2">
                  Checkout {formatCurrency(total)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modifier Dialog */}
      {selectedItem && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedItem(null)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface shadow-2xl animate-fade-in-up sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            <div className="sticky top-0 flex items-center gap-3 border-b border-line bg-surface px-5 py-4 rounded-t-3xl sm:rounded-t-2xl">
              <button onClick={() => setSelectedItem(null)} className="rounded-lg p-1 hover:bg-ink/5"><ArrowLeft className="h-5 w-5" /></button>
              <div>
                <h2 className="font-bold text-ink">{selectedItem.name}</h2>
                <p className="text-xs text-ink/50">{formatCurrency(selectedItem.price)}</p>
              </div>
            </div>
            <div className="px-5 py-4">
              {getItemMods(selectedItem.id).map(group => {
                const groupCount = getModifierGroupCount(group.id)
                return (
                  <div key={group.id} className="mb-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-ink">{group.name}</h3>
                      <span className="text-[11px] text-ink/40">
                        {group.required ? (group.maxSelect === 1 ? "Required" : `Select ${group.minSelect}${group.maxSelect < 99 ? `-${group.maxSelect}` : "+"}`) : "Optional"}
                        {group.required && groupCount < group.minSelect && <span className="ml-1 text-red-500">({group.minSelect - groupCount} more)</span>}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {group.items.map(mod => {
                        const count = getModifierCount(group.id, mod.id)
                        return (
                          <div key={mod.id} className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 transition ${count > 0 ? "border-brand/40 bg-brand/5" : "border-line"}`}>
                            <span className="text-sm font-medium text-ink">{mod.name}</span>
                            <div className="flex items-center gap-2">
                              {mod.price > 0 && <span className="text-xs text-ink/40">+{formatCurrency(mod.price)}</span>}
                              <div className="flex items-center gap-1">
                                <button onClick={() => count > 0 && handleModifierToggle(group.id, mod.id, group)} disabled={count === 0}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-ink/60 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 transition">
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-6 text-center text-sm font-bold text-ink">{count}</span>
                                <button onClick={() => handleModifierToggle(group.id, mod.id, group)}
                                  disabled={group.maxSelect > 0 && groupCount >= group.maxSelect && count === 0}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-ink/60 hover:bg-brand/5 hover:text-brand disabled:opacity-30 transition">
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
            <div className="sticky bottom-0 border-t border-line bg-surface px-5 py-3 rounded-b-3xl sm:rounded-b-2xl">
              <button onClick={confirmAddWithModifiers} disabled={!canAddFromModifierPanel()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl brand-bg text-sm font-bold text-white shadow-lg shadow-brand/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition">
                <Plus className="h-4 w-4" />
                Add to Order — {formatCurrency(selectedItem.price + getModTotalForItem(selectedItem))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      {showCheckout && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && setShowCheckout(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-surface shadow-2xl animate-fade-in-up sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-5 py-4 rounded-t-3xl sm:rounded-t-2xl">
              <button onClick={() => setShowCheckout(false)} disabled={submitting} className="rounded-lg p-1 hover:bg-ink/5"><ArrowLeft className="h-5 w-5" /></button>
              <h2 className="font-bold text-ink">Checkout</h2>
              <div className="w-8" />
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/60">Your Name *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Smith"
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink/30 transition" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/60">Phone Number *</label>
                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="07123 456789"
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink/30 transition" />
              </div>
              {orderType === "DELIVERY" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink/60">Delivery Address *</label>
                  <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="123 High Street, BB1 1AA" rows={2}
                    className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink/30 transition resize-none" />
                </div>
              )}

              {/* Summary */}
              <div className="rounded-xl border border-line bg-paper p-4 space-y-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-ink/70">{item.quantity}x {item.name}</span>
                    <span className="font-medium text-ink">{formatCurrency((item.basePrice + item.modifiers.reduce((s, m) => s + m.price, 0)) * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-line pt-2 mt-2 flex justify-between text-base font-bold">
                  <span className="text-ink">Total</span>
                  <span className="text-ink">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 border-t border-line bg-surface px-5 py-3 rounded-b-3xl sm:rounded-b-2xl">
              <button onClick={handleCheckout} disabled={submitting || cart.length === 0}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl brand-bg text-sm font-bold text-white shadow-lg shadow-brand/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition">
                {submitting ? "Placing Order..." : <><Check className="h-4 w-4" /> Place Order — {formatCurrency(total)}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmed */}
      {showOrderConfirmed && orderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-8 text-center shadow-2xl animate-fade-in-up">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full brand-bg">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-ink">Order Confirmed!</h2>
            <p className="mt-2 text-sm text-ink/50">Your order has been placed successfully</p>
            <div className="mt-4 rounded-xl bg-paper p-4">
              <p className="text-xs text-ink/40">Order ID</p>
              <p className="text-lg font-bold text-ink">#{orderResult.orderId.slice(-6).toUpperCase()}</p>
              <p className="mt-2 text-xs text-ink/40">Total</p>
              <p className="text-lg font-bold brand-text">{formatCurrency(orderResult.total)}</p>
            </div>
            <button onClick={() => { setShowOrderConfirmed(false); setOrderResult(null) }}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl brand-bg text-sm font-bold text-white">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Footer */}
      {itemCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface px-4 py-3 shadow-lg">
          <button onClick={() => setShowCart(true)}
            className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-xl brand-bg px-5 py-3 text-white shadow-lg shadow-brand/20">
            <div className="flex items-center gap-3">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-bold">{itemCount}</span>
              <span className="text-sm font-semibold">View Order</span>
            </div>
            <span className="text-sm font-bold">{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-line bg-surface py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-ink">{store.name}</p>
              {store.address && <p className="text-xs text-ink/40 mt-0.5">{store.address}</p>}
            </div>
            <div className="flex items-center gap-4 text-xs text-ink/40">
              <a href={`/${store.slug}/terms`} className="hover:text-ink transition">Terms</a>
              <a href={`/${store.slug}/privacy`} className="hover:text-ink transition">Privacy</a>
              <a href={`/${store.slug}`} className="hover:text-ink transition">Home</a>
            </div>
          </div>
          <div className="mt-4 border-t border-line pt-4 text-center">
            <p className="text-xs text-ink/30">Powered by <span className="font-semibold brand-text">Ordora</span></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
