"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { formatCurrency } from "@ordora/shared/lib/utils"
import { createOnlineOrder } from "@/lib/actions/order"
import { createCheckoutSession } from "@/lib/actions/payment"
import {
  Search, Minus, Plus, Trash2, ShoppingBag, ShoppingCart, X, ArrowLeft, Check, Truck, Store,
  AlertTriangle, MapPin, Phone, Clock, CreditCard, Banknote,
  ArrowRight,
} from "lucide-react"

interface Modifier { id: string; name: string; price: number; maxQuantity: number }
interface ModifierGroup { id: string; name: string; required: boolean; minSelect: number; maxSelect: number; items: Modifier[] }
interface MenuItemType { id: string; name: string; description: string; price: number; category: string; imageUrl: string | null; soldOut: boolean; isFeatured: boolean; allergens: string }
interface CartItemModifier { modifierId: string; name: string; price: number }
interface CartItem { menuItemId: string; name: string; basePrice: number; quantity: number; modifiers: CartItemModifier[]; notes: string }
type OrderType = "COLLECTION" | "DELIVERY"
type PaymentMethod = "CASH" | "CARD"

interface Props {
  store: { id: string; name: string; slug: string; phone: string | null; address: string | null; postcode: string | null; webServiceCharge: number; bagCharge: number; deliveryFee: number; logoUrl: string | null; brandColor: string | null; accentColor: string | null; tagline: string | null }
  menuItems: MenuItemType[]
  categories: string[]
  modifierGroups: ModifierGroup[]
  itemModLinks: Record<string, string[]>
  storeInfo: { isOpen: boolean; hoursText: string; hoursUntil: string; address: string; phone: string; collectionHours: string; deliveryHours: string }
}

export default function MenuClient({ store, menuItems, categories, modifierGroups, itemModLinks, storeInfo }: Props) {
  const searchParams = useSearchParams()
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const itemsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setShowOrderConfirmed(true)
      setOrderResult({ orderId: searchParams.get("session_id") || "stripe-paid", total: 0 })
    }
  }, [searchParams])

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
  const deliveryFee = orderType === "DELIVERY" ? store.deliveryFee : 0
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

  function handleModifierToggle(groupId: string, modifierId: string, group: ModifierGroup, modMaxQty: number = 1) {
    setModifierSelections(prev => {
      const current = prev[groupId] || {}
      const currentCount = current[modifierId] || 0
      const totalCount = Object.values(current).reduce((a, b) => a + b, 0)
      if (group.required && group.maxSelect === 1 && modMaxQty === 1) return { ...prev, [groupId]: { [modifierId]: 1 } }
      if (currentCount > 0) {
        const updated = { ...current }; updated[modifierId] = currentCount - 1
        if (updated[modifierId] === 0) delete updated[modifierId]
        return { ...prev, [groupId]: updated }
      }
      if (totalCount >= group.maxSelect) return prev
      if (currentCount >= modMaxQty) return prev
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
      if (paymentMethod === "CARD") {
        const result = await createCheckoutSession({
          storeName: store.name, customerName, customerPhone,
          customerAddress: orderType === "DELIVERY" ? customerAddress : undefined,
          orderType, items: cart.map(c => ({
            name: c.name, quantity: c.quantity, unitPrice: c.basePrice,
            modifiers: c.modifiers.map(m => ({ name: m.name, price: m.price })),
          })),
          subtotal, serviceCharge, bagCharge, deliveryFee, total,
          successUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/${store.slug}/menu`,
          cancelUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/${store.slug}/menu`,
        })
        if (result.url) { window.location.href = result.url; return }
        toast.error("Failed to create payment session")
        setSubmitting(false)
        return
      }
      const payMethod = orderType === "COLLECTION" ? "cash_collection" : "cash_delivery"
      const result = await createOnlineOrder({
        storeSlug: store.slug, customerName, customerPhone,
        customerAddress: orderType === "DELIVERY" ? customerAddress : undefined,
        orderType, paymentMethod: payMethod, notes: notes || undefined,
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
  const storeName = store.name
  const storeAddress = store.address ? `${store.address}${store.postcode ? `, ${store.postcode}` : ""}` : ""
  const logoUrl = store.logoUrl

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--paper, #faf6f0)" }}>
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: "var(--theme-ink, #141414)", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="max-w-[1600px] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-[61px]">
            <a href={`/${store.slug}`} className="flex-shrink-0">
              <img src={logoUrl || "/brands/chesters/chesters-logo.png"} alt={storeName} className="h-10 w-auto object-contain" />
            </a>

            <nav className="hidden md:flex items-center gap-7">
              <a href={`/${store.slug}`} className="text-sm font-bold uppercase tracking-wide text-white/60 hover:text-white transition pb-0.5">Home</a>
              <a href={`/${store.slug}/menu`} className="text-sm font-bold uppercase tracking-wide text-white border-b-2 border-white pb-0.5">Menu</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${storeInfo.isOpen ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                <span className={`size-1.5 rounded-full ${storeInfo.isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
                {storeInfo.hoursText}
              </span>
              <button onClick={() => setShowCart(true)} className="relative flex items-center gap-2 text-white px-4 py-2 rounded-full text-sm font-bold transition" style={{ backgroundColor: "var(--brand, hsl(23,91%,54%))" }}>
                <ShoppingBag size={16} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full text-[10px] font-bold cart-bump" style={{ backgroundColor: "white", color: "var(--brand, hsl(23,91%,54%))" }}>
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setShowCart(true)} className="relative flex items-center gap-2 text-white px-4 py-2 rounded-full text-xs font-bold" style={{ backgroundColor: "var(--brand, hsl(23,91%,54%))" }}>
                <ShoppingBag size={14} /> Cart
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: "white", color: "var(--brand, hsl(23,91%,54%))" }}>{itemCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative w-full overflow-hidden" style={{ backgroundColor: "var(--theme-ink, #141414)", height: "180px" }}>
        <img
          src="/brands/chesters/chesters-hero.jpg"
          alt={storeName}
          className="w-full h-full object-cover"
        />
      </section>

      {/* Category pills */}
      <div className="sticky top-[61px] z-30 border-b" style={{ backgroundColor: "var(--paper, #faf6f0)", borderColor: "var(--line, #e3d8c8)" }}>
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
            <button onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-5 py-2.5 text-sm font-bold uppercase tracking-wide rounded-full transition-all ${
                !activeCategory ? "text-white" : "border hover:border-current"
              }`}
              style={!activeCategory ? { backgroundColor: "var(--brand, hsl(23,91%,54%))" } : { borderColor: "var(--line, #e3d8c8)", color: "var(--theme-ink, #141414)" }}>
              All ({menuItems.length})
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => { setActiveCategory(cat); itemsRef.current?.scrollIntoView({ behavior: "smooth" }) }}
                className={`flex-shrink-0 px-5 py-2.5 text-sm font-bold uppercase tracking-wide rounded-full transition-all ${
                  activeCategory === cat ? "text-white" : "border hover:border-current"
                }`}
                style={activeCategory === cat ? { backgroundColor: "var(--brand, hsl(23,91%,54%))" } : { borderColor: "var(--line, #e3d8c8)", color: "var(--theme-ink, #141414)" }}>
                {cat} ({catItemCounts[cat] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-5 sm:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left - Menu items */}
          <div ref={itemsRef}>
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <ShoppingBag className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-sm">No items found</p>
              </div>
            ) : (
              visibleCategories.map(cat => {
                const catItems = filteredItems.filter(i => i.category === cat)
                if (catItems.length === 0) return null
                return (
                  <div key={cat} className="mb-10" id={`cat-${cat}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="font-display text-xl font-bold text-ink">{cat}</h2>
                      <span className="text-sm text-gray-400">{catItems.length} items</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {catItems.map((item) => {
                        const hasMods = getItemMods(item.id).length > 0
                        return (
                          <div key={item.id}
                            className={`bg-white rounded-card overflow-hidden shadow-card hover:shadow-card-lg transition-all ${item.soldOut ? "opacity-50" : ""}`}>
                            <div className="flex gap-0">
                              {/* Image */}
                              <div className="relative w-[110px] sm:w-[130px] flex-shrink-0 aspect-square overflow-hidden">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand, hsl(23,91%,54%)), var(--accent, hsl(207,90%,48%)))" }}>
                                    <span className="text-3xl text-white/80 font-display">{item.name.charAt(0)}</span>
                                  </div>
                                )}
                                {item.isFeatured && (
                                  <span className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--brand, hsl(23,91%,54%))" }}>
                                    Popular
                                  </span>
                                )}
                                {item.soldOut && (
                                  <span className="absolute top-2 right-2 bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    Sold Out
                                  </span>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                <div>
                                  <h3 className="font-bold text-sm text-ink truncate">{item.name}</h3>
                                  {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>}
                                  {item.allergens && (
                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700">
                                      <AlertTriangle className="h-3 w-3" /> {item.allergens}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-base font-bold" style={{ color: "var(--brand, hsl(23,91%,54%))" }}>£{item.price.toFixed(2)}</span>
                                  {item.soldOut ? (
                                    <span className="text-red-500 text-[10px] font-bold uppercase">Sold Out</span>
                                  ) : (
                                    <button onClick={() => handleItemClick(item)}
                                      className="text-white transition px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide"
                                      style={{ backgroundColor: "var(--brand, hsl(23,91%,54%))" }}>
                                      {hasMods ? "Customise" : "Add"}
                                    </button>
                                  )}
                                </div>
                              </div>
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

        {/* Right - Sticky basket (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-[76px]">
            <div className="overflow-hidden" style={{ borderRadius: "var(--radius-card-lg, 2.125rem)", boxShadow: "var(--shadow-card, 0 12px 35px rgba(11,30,76,0.10))", maxHeight: "calc(100vh - 96px)" }}>
              <div className="p-4" style={{ borderBottom: "1px solid var(--line, #e3d8c8)" }}>
                <h2 className="font-display text-lg font-bold" style={{ color: "var(--theme-ink, #141414)" }}>Your order</h2>
                </div>

                {/* Order type toggle */}
                <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--line, #e3d8c8)" }}>
                  <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: "var(--paper-2, #f1e9de)" }}>
                    {(["COLLECTION", "DELIVERY"] as OrderType[]).map(t => (
                      <button key={t} onClick={() => setOrderType(t)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${orderType === t ? "text-white shadow-md" : "text-gray-500"}`}
                        style={orderType === t ? { backgroundColor: "var(--brand, hsl(23,91%,54%))" } : {}}>
                        {t === "COLLECTION" ? <><Store className="h-3.5 w-3.5" /> Collection</> : <><Truck className="h-3.5 w-3.5" /> Delivery</>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cart items */}
                <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 280px)" }}>
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-400 text-sm">Your basket is empty</p>
                      <p className="text-xs text-gray-300 mt-1">Add items from the menu to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item, idx) => {
                        const modTotal = item.modifiers.reduce((s, m) => s + m.price, 0)
                        const lineTotal = (item.basePrice + modTotal) * item.quantity
                        return (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold text-ink truncate">{item.quantity}x {item.name}</h3>
                              {item.modifiers.length > 0 && <p className="mt-0.5 text-[10px] text-gray-400">{item.modifiers.map(m => m.name).join(", ")}</p>}
                              <div className="flex items-center gap-2 mt-1.5">
                                <button onClick={() => updateCartQty(idx, -1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 transition"><Minus size={12} /></button>
                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateCartQty(idx, 1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:text-white transition" style={{ ["--tw-hover-bg" as any]: "var(--brand, hsl(23,91%,54%))" }}><Plus size={12} /></button>
                                <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="ml-1 text-gray-300 hover:text-red-500 transition"><Trash2 size={12} /></button>
                              </div>
                            </div>
                            <span className="text-sm font-bold" style={{ color: "var(--brand, hsl(23,91%,54%))" }}>£{lineTotal.toFixed(2)}</span>
                          </div>
                        )
                      })}
                      <textarea placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                        className="w-full rounded-xl border border-gray-200 p-2.5 text-xs outline-none focus:border-current resize-none transition mt-2" />
                    </div>
                  )}
                </div>

                {/* Totals + Checkout */}
                {cart.length > 0 && (
                  <div className="p-4" style={{ borderTop: "1px solid var(--line, #e3d8c8)" }}>
                    <div className="space-y-1.5 text-sm mb-3">
                      <div className="flex justify-between"><span className="text-gray-500">Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span><span className="font-medium">£{subtotal.toFixed(2)}</span></div>
                      {serviceCharge > 0 && <div className="flex justify-between"><span className="text-gray-500">Service charge</span><span>£{serviceCharge.toFixed(2)}</span></div>}
                      {bagCharge > 0 && <div className="flex justify-between"><span className="text-gray-500">Bag</span><span>£{bagCharge.toFixed(2)}</span></div>}
                      {orderType === "DELIVERY" && <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>£{deliveryFee.toFixed(2)}</span></div>}
                          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                            <span>Total</span><span style={{ color: "var(--brand, hsl(23,91%,54%))" }}>£{total.toFixed(2)}</span>
                      </div>
                    </div>
                    <button onClick={() => { setShowCheckout(true) }}
                      className="w-full text-white py-3 rounded-full text-sm font-bold uppercase tracking-wide transition flex items-center justify-center gap-2"
                      style={{ backgroundColor: "var(--brand, hsl(23,91%,54%))" }}>
                      Checkout <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating cart button (mobile) */}
      {itemCount > 0 && !showCart && (
        <div className="fixed bottom-6 right-6 z-40 lg:hidden">
          <button onClick={() => setShowCart(true)}
            className="text-white flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl pulse-glow font-bold"
            style={{ backgroundColor: "var(--brand, hsl(23,91%,54%))" }}>
            <ShoppingBag size={20} />
            <span className="text-sm">{itemCount} {itemCount === 1 ? "Item" : "Items"}</span>
            <span className="text-sm px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "white", color: "var(--brand, hsl(23,91%,54%))" }}>£{total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Cart drawer (mobile) */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${showCart ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
        <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ${showCart ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between p-5 text-white" style={{ backgroundColor: "var(--theme-ink, #141414)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 className="font-display text-xl font-bold flex items-center gap-2"><ShoppingBag size={20} /> Your Cart</h2>
            <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/20 rounded-lg transition"><X size={20} /></button>
          </div>

          <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--line, #e3d8c8)" }}>
            <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: "var(--paper-2, #f1e9de)" }}>
              {(["COLLECTION", "DELIVERY"] as OrderType[]).map(t => (
                <button key={t} onClick={() => setOrderType(t)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition ${orderType === t ? "text-white shadow-md" : "text-gray-500"}`}
                  style={orderType === t ? { backgroundColor: "var(--brand, hsl(23,91%,54%))" } : {}}>
                  {t === "COLLECTION" ? <><Store className="h-3.5 w-3.5" /> Collection</> : <><Truck className="h-3.5 w-3.5" /> Delivery</>}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100%-260px)] p-5">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400">Your cart is empty</p>
                <p className="text-xs text-gray-300 mt-1">Add items from the menu to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, idx) => {
                  const modTotal = item.modifiers.reduce((s, m) => s + m.price, 0)
                  const lineTotal = (item.basePrice + modTotal) * item.quantity
                  return (
                    <div key={idx} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex gap-3 items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-ink truncate">{item.quantity}x {item.name}</h3>
                          {item.modifiers.length > 0 && <p className="mt-0.5 text-[10px] text-gray-400">{item.modifiers.map(m => m.name).join(", ")}</p>}
                        </div>
                        <span className="text-sm font-bold" style={{ color: "var(--brand, hsl(23,91%,54%))" }}>£{lineTotal.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => updateCartQty(idx, -1)} className="w-7 h-7 rounded-full bg-white border border-gray-200 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition"><Minus size={14} /></button>
                        <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQty(idx, 1)} className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center transition" style={{ ["--tw-hover-bg" as any]: "var(--brand, hsl(23,91%,54%))" }}><Plus size={14} /></button>
                        <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="ml-auto text-gray-400 hover:text-red-500 transition"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )
                })}
                <textarea placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs outline-none focus:border-current resize-none transition" />
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-white" style={{ borderTop: "1px solid var(--line, #e3d8c8)" }}>
              <div className="space-y-1.5 text-sm mb-4">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span><span className="font-medium">£{subtotal.toFixed(2)}</span></div>
                {serviceCharge > 0 && <div className="flex justify-between"><span className="text-gray-500">Service charge</span><span>£{serviceCharge.toFixed(2)}</span></div>}
                {bagCharge > 0 && <div className="flex justify-between"><span className="text-gray-500">Bag</span><span>£{bagCharge.toFixed(2)}</span></div>}
                {orderType === "DELIVERY" && <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>£{deliveryFee.toFixed(2)}</span></div>}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                  <span>Total</span><span style={{ color: "var(--brand, hsl(23,91%,54%))" }}>£{total.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => { setShowCart(false); setShowCheckout(true) }}
                className="w-full text-white py-3.5 rounded-full text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition">
                Checkout <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modifier Dialog */}
      {selectedItem && (
        <div className="fixed inset-0 z-50">
          <div className="scrim-enter absolute inset-0 bg-black/40" onClick={() => setSelectedItem(null)} />
          <div className="sheet-enter absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl shadow-2xl">
            <div className="sticky top-0 flex items-center gap-3 bg-white px-5 py-4 rounded-t-2xl" style={{ borderBottom: "1px solid var(--line, #e3d8c8)" }}>
              <button onClick={() => setSelectedItem(null)} className="rounded-lg p-1 hover:bg-gray-100 transition"><ArrowLeft className="h-5 w-5" /></button>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">{selectedItem.name}</h2>
                <p className="text-xs text-gray-500">£{selectedItem.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="px-5 py-4">
              {getItemMods(selectedItem.id).map(group => {
                const gc = getModifierGroupCount(group.id)
                return (
                  <div key={group.id} className="mb-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-ink">{group.name}</h3>
                      <span className="text-[11px] text-gray-400">
                        {group.required ? (group.maxSelect === 1 ? "Required" : `Select ${group.minSelect}–${group.maxSelect}`) : "Optional"}
                        {group.required && gc < group.minSelect && <span className="ml-1 text-red-500">({group.minSelect - gc} more)</span>}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {group.items.map(mod => {
                        const count = getModifierCount(group.id, mod.id)
                        const atModMax = count >= mod.maxQuantity
                        return (
                          <div key={mod.id} className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 transition ${count > 0 ? "bg-orange-50" : ""}`} style={count > 0 ? { borderColor: "var(--brand, hsl(23,91%,54%))" } : { borderColor: "var(--line, #e3d8c8)" }}>
                            <span className="text-sm font-medium text-ink">{mod.name}</span>
                            <div className="flex items-center gap-2">
                              {mod.price > 0 && <span className="text-xs text-gray-400">+£{mod.price.toFixed(2)}</span>}
                              <div className="flex items-center gap-1">
                                <button onClick={() => count > 0 && handleModifierToggle(group.id, mod.id, group, mod.maxQuantity)} disabled={count === 0}
                                  className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-red-50 hover:text-red-500 disabled:opacity-30 transition"><Minus className="h-3 w-3" /></button>
                                <span className="w-6 text-center text-sm font-bold">{count}</span>
                                <button onClick={() => handleModifierToggle(group.id, mod.id, group, mod.maxQuantity)}
                                  disabled={(group.maxSelect > 0 && gc >= group.maxSelect && count === 0) || atModMax}
                                  className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center disabled:opacity-30 transition hover:text-white disabled:hover:bg-white" style={{ ["--tw-hover-bg" as any]: "var(--brand, hsl(23,91%,54%))" }}>
                                  <Plus className="h-3 w-3" /></button>
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
            <div className="sticky bottom-0 bg-white px-5 py-3 rounded-b-2xl" style={{ borderTop: "1px solid var(--line, #e3d8c8)" }}>
              <button onClick={confirmAddWithModifiers} disabled={!canAddFromModifierPanel()}
                className="text-white flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold disabled:opacity-50 transition"
                style={{ backgroundColor: "var(--brand, hsl(23,91%,54%))" }}>
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
          <div className="sheet-enter absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between text-white px-5 py-4 rounded-t-2xl" style={{ backgroundColor: "var(--theme-ink, #141414)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <button onClick={() => setShowCheckout(false)} disabled={submitting} className="rounded-lg p-1 hover:bg-white/20 transition"><ArrowLeft className="h-5 w-5" /></button>
              <h2 className="font-display font-bold">Checkout</h2>
              <div className="w-8" />
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-500">Your Name *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Smith"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-current focus:ring-2 focus:ring-current/20 transition" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-500">Phone Number *</label>
                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="07123 456789"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-current focus:ring-2 focus:ring-current/20 transition" />
              </div>
              {orderType === "DELIVERY" && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-500">Delivery Address *</label>
                  <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="123 High Street, BB1 1AA" rows={2}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-current resize-none transition" />
                </div>
              )}
              <div>
                <label className="mb-2 block text-xs font-bold text-gray-500">Payment Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPaymentMethod("CASH")}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition ${paymentMethod === "CASH" ? "bg-orange-50 shadow-md" : "bg-white"}`}
                    style={{ borderColor: paymentMethod === "CASH" ? "var(--brand, hsl(23,91%,54%))" : "var(--line, #e3d8c8)" }}>
                    <Banknote className="h-6 w-6" style={{ color: paymentMethod === "CASH" ? "var(--brand, hsl(23,91%,54%))" : undefined }} />
                    <span className="text-xs font-bold text-ink">{orderType === "COLLECTION" ? "Cash on Collection" : "Cash on Delivery"}</span>
                  </button>
                  <button onClick={() => setPaymentMethod("CARD")}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition ${paymentMethod === "CARD" ? "bg-orange-50 shadow-md" : "bg-white"}`}
                    style={{ borderColor: paymentMethod === "CARD" ? "var(--brand, hsl(23,91%,54%))" : "var(--line, #e3d8c8)" }}>
                    <CreditCard className="h-6 w-6" style={{ color: paymentMethod === "CARD" ? "var(--brand, hsl(23,91%,54%))" : undefined }} />
                    <span className="text-xs font-bold text-ink">Pay by Card</span>
                    <span className="text-[10px] text-gray-400">Secure via Stripe</span>
                  </button>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 space-y-1.5 text-sm">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between"><span className="text-gray-500">{item.quantity}x {item.name}</span><span className="font-medium">£{((item.basePrice + item.modifiers.reduce((s, m) => s + m.price, 0)) * item.quantity).toFixed(2)}</span></div>
                ))}
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-1 font-bold text-base"><span>Total</span><span style={{ color: "var(--brand, hsl(23,91%,54%))" }}>£{total.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-5 py-3 rounded-b-2xl" style={{ borderTop: "1px solid var(--line, #e3d8c8)" }}>
              <button onClick={handleCheckout} disabled={submitting || cart.length === 0}
                className="text-white flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold disabled:opacity-50 transition"
                style={{ backgroundColor: "var(--brand, hsl(23,91%,54%))" }}>
                {submitting ? "Processing..." : paymentMethod === "CARD" ? (
                  <><CreditCard className="h-4 w-4" /> Pay by Card — £{total.toFixed(2)}</>
                ) : (
                  <><Check className="h-4 w-4" /> Place Order — £{total.toFixed(2)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmed */}
      {showOrderConfirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl sheet-enter">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-50">
              <Check className="size-8 text-emerald-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink">Order Confirmed!</h2>
            <p className="mt-2 text-sm text-gray-500">Your order has been placed successfully</p>
            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-400">Order ID</p>
              <p className="text-lg font-bold text-ink">#{(orderResult?.orderId || "").slice(-6).toUpperCase()}</p>
              {orderResult?.total ? (
                <>
                  <p className="mt-2 text-xs text-gray-400">Total</p>
                  <p className="text-lg font-bold" style={{ color: "var(--brand, hsl(23,91%,54%))" }}>£{orderResult.total.toFixed(2)}</p>
                </>
              ) : null}
            </div>
            <button onClick={() => { setShowOrderConfirmed(false); setOrderResult(null); window.history.replaceState({}, "", `/${store.slug}/menu`) }}
              className="mt-6 text-white flex h-12 w-full items-center justify-center rounded-full text-sm font-bold transition">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ backgroundColor: "var(--theme-ink, #141414)" }} className="mt-auto">
        <div className="h-1" style={{ background: "linear-gradient(90deg, var(--brand, hsl(23,91%,54%)), var(--gold, #b8862f), var(--accent, hsl(207,90%,48%)))" }} />
        <div className="max-w-[1600px] mx-auto px-6 py-16">
          <div className="mb-10">
            <img src={logoUrl || "/brands/chesters/chesters-logo.png"} alt={storeName} className="h-14 w-auto object-contain mb-3" />
            <p className="text-sm text-white/40">Order online for collection or delivery</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12 mb-10">
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white mb-4">Explore</h3>
              <ul className="space-y-2.5">
                <li><a href={`/${store.slug}`} className="text-sm transition" style={{ color: "#d8cfc4" }}>Home</a></li>
                <li><a href={`/${store.slug}/menu`} className="text-sm transition" style={{ color: "#d8cfc4" }}>Order online</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white mb-4">Legal</h3>
              <ul className="space-y-2.5">
                <li><a href={`/${store.slug}/terms`} className="text-sm transition" style={{ color: "#d8cfc4" }}>Terms &amp; Conditions</a></li>
                <li><a href={`/${store.slug}/privacy`} className="text-sm transition" style={{ color: "#d8cfc4" }}>Privacy Policy</a></li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white mb-4">Get in touch</h3>
              <ul className="space-y-2.5">
                {store.phone && (
                  <li>
                    <a href={`tel:${store.phone}`} className="text-sm flex items-center gap-1 transition" style={{ color: "#d8cfc4" }}>
                      {store.phone}<span className="text-xs text-white/30">Tap to call</span>
                    </a>
                  </li>
                )}
                {store.address && (
                  <li>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(store.address)}`} target="_blank" rel="noopener"
                      className="text-sm flex items-center gap-1 transition" style={{ color: "#d8cfc4" }}>
                      {storeAddress}<span className="text-xs text-white/30">Get directions</span>
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.25rem" }}>
            <p className="text-xs text-white/30">&copy; {new Date().getFullYear()} {storeName}. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-white/30">
              <a href={`/${store.slug}/terms`} className="transition">Terms</a>
              <a href={`/${store.slug}/privacy`} className="transition">Privacy</a>
            </div>
          </div>
          <div className="mt-6 pt-5 flex flex-col items-center gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="text-sm text-white/30">Powered by <span className="font-bold text-white/60">Ordora</span></span>
          </div>
        </div>
      </footer>
    </div>
  )
}
