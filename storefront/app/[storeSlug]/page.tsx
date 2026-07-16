import { prisma } from "@ordora/shared/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Phone, MapPin, Clock, ShoppingBag, Navigation, Truck } from "lucide-react"
import { getStoreBySlug } from "@/lib/store"

export const revalidate = 60

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function getOpenStatus(hours: { day: number; open: string; close: string; isActive: boolean }[]) {
  const now = new Date()
  const dayIndex = now.getDay()
  const today = hours.find(h => h.day === dayIndex && h.isActive)
  if (!today) return { isOpen: false, text: "Closed today", until: "" }
  const [oh, om] = today.open.split(":").map(Number)
  const [ch, cm] = today.close.split(":").map(Number)
  const current = now.getHours() * 60 + now.getMinutes()
  const openTime = oh * 60 + om
  const closeTime = ch * 60 + cm
  const isOpen = current >= openTime && current < closeTime
  return { isOpen, text: isOpen ? "Open now" : "Closed", until: isOpen ? `until ${today.close}` : "" }
}

export default async function StorePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params
  const store = await getStoreBySlug(storeSlug)
  if (!store || !store.isActive) notFound()

  const [banners, openingHours, menuItems, deliveryZones] = await Promise.all([
    prisma.banner.findMany({ where: { storeId: store.id, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.storeOpeningHour.findMany({ where: { storeId: store.id }, orderBy: { day: "asc" } }),
    prisma.menuItem.findMany({ where: { storeId: store.id, isAvailable: true, soldOut: false, isFeatured: true }, take: 6, orderBy: { sortOrder: "asc" } }),
    prisma.deliveryZone.findMany({ where: { storeId: store.id, isActive: true }, orderBy: { sortOrder: "asc" } }),
  ])

  const hours = getOpenStatus(openingHours as any)
  const collectionHours = openingHours.filter((h: any) => h.orderType === "COLLECTION")
  const deliveryHours = openingHours.filter((h: any) => h.orderType === "DELIVERY")

  const brandColor = store.brandColor || "#FF5733"
  const accentColor = store.accentColor || "#1E40AF"
  const logoUrl = store.tenant?.logoUrl || null
  const tagline = store.tagline || null
  const headerBg = `linear-gradient(135deg, ${brandColor}, ${accentColor})`

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50" style={{ background: headerBg }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href={`/${storeSlug}`} className="flex items-center gap-2">
            {logoUrl && (
              <img src={logoUrl} alt={store.name} className="h-8 w-8 rounded-full object-cover" />
            )}
            <span className="font-display text-lg tracking-tight text-white">{store.name}</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium sm:flex">
            <Link href={`/${storeSlug}`} className="text-white/80 hover:text-white transition underline-offset-2">Home</Link>
            <Link href={`/${storeSlug}/menu`} className="text-white/80 hover:text-white transition">Menu</Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <span className={`size-1.5 rounded-full ${hours.isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
              <span className="text-white">{hours.text}</span>
            </span>
            <Link href={`/${storeSlug}/menu`}
              className="flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold transition hover:bg-white/90"
              style={{ color: brandColor }}>
              <ShoppingBag className="mr-1.5 h-4 w-4" /> Order
            </Link>
          </div>
        </div>
        {tagline && (
          <div className="mx-auto max-w-6xl px-4 pb-2">
            <p className="text-xs text-white/70">{tagline}</p>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        {store.description && (
          <section className="pt-6 pb-2">
            <p className="text-sm text-muted-foreground max-w-2xl">{store.description}</p>
          </section>
        )}

        <section className="pt-6 pb-4">
          <h2 className="mb-4 font-display text-2xl tracking-tight" style={{ color: brandColor }}>Popular right now</h2>
          {menuItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {menuItems.map((item, i) => (
                <Link key={item.id} href={`/${storeSlug}/menu`}
                  className="group rounded-card bg-card border border-border p-3 shadow-card lift">
                  <div className="relative mb-2">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-28 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-28 w-full items-center justify-center rounded-xl bg-muted text-3xl font-display text-muted-foreground/30">
                        {i + 1}
                      </div>
                    )}
                    <span className="absolute -top-1 -right-1 flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-md"
                      style={{ background: brandColor }}>
                      #{i + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:underline transition">{item.name}</h3>
                  <p className="mt-0.5 text-sm font-bold" style={{ color: brandColor }}>£{item.price.toFixed(2)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No featured items yet.</p>
          )}
        </section>

        <section className="rounded-card-lg bg-card border border-border shadow-card overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="mb-1 font-display text-xl tracking-tight" style={{ color: brandColor }}>Find us</h2>
            <p className="mb-5 text-sm text-muted-foreground">Visit {store.name}</p>

            <div className="flex items-center gap-2 mb-4">
              <span className={`size-2 rounded-full ${hours.isOpen ? "bg-emerald-500" : "bg-destructive"}`} />
              <span className={`text-sm font-semibold ${hours.isOpen ? "text-emerald-700" : "text-destructive"}`}>
                {hours.text} {hours.until}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              {store.address && (
                <div className="flex items-start gap-2.5 text-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p>{store.address}{store.postcode ? `, ${store.postcode}` : ""}</p>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(store.address || "")}`}
                      target="_blank" rel="noopener"
                      className="mt-0.5 inline-flex items-center gap-1 font-medium hover:underline text-xs"
                      style={{ color: brandColor }}>
                      <Navigation className="h-3 w-3" /> Get directions
                    </a>
                  </div>
                </div>
              )}
              {store.phone && (
                <a href={`tel:${store.phone}`} className="flex items-center gap-2.5 text-foreground hover:opacity-80 transition">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{store.phone}</span>
                  <span className="text-xs text-muted-foreground ml-auto">Tap to call</span>
                </a>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-muted/40 p-6 sm:p-8">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Clock className="h-4 w-4" style={{ color: brandColor }} /> Opening hours
            </h3>
            <div className="space-y-1.5 text-sm">
              {DAYS.map((day, i) => {
                const h = openingHours.find((o: any) => o.day === i)
                const isToday = new Date().getDay() === i
                return (
                  <div key={day} className={`flex items-center justify-between py-1 ${isToday ? "font-bold" : "text-muted-foreground"}`}>
                    <span className={isToday ? "text-foreground" : ""}>
                      {day}{isToday ? " · today" : ""}
                    </span>
                    <span className={isToday ? "" : ""} style={isToday ? { color: brandColor } : {}}>
                      {h?.isActive ? `${h.open}–${h.close}` : "Closed"}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex gap-2">
              {store.deliveryEnabled && (
                <span className="rounded-full border px-3 py-1 text-[11px] font-medium text-white"
                  style={{ background: accentColor }}>
                  delivery available
                </span>
              )}
              {store.collectionEnabled && (
                <span className="rounded-full border px-3 py-1 text-[11px] font-medium text-white"
                  style={{ background: brandColor }}>
                  collection available
                </span>
              )}
            </div>
          </div>

          {(store.deliveryEnabled || store.collectionEnabled) && (
            <div className="border-t border-border p-6 sm:p-8">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <Truck className="h-4 w-4" style={{ color: accentColor }} /> Delivery & Collection
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                {store.minimumOrderAmount > 0 && <p>Minimum order: <span className="font-semibold text-foreground">£{(store.minimumOrderAmount / 100).toFixed(2)}</span></p>}
                {store.deliveryFee > 0 && <p>Delivery fee from: <span className="font-semibold text-foreground">£{(store.deliveryFee / 100).toFixed(2)}</span></p>}
                {store.estimatedPrepTime > 0 && <p>Estimated prep time: <span className="font-semibold text-foreground">{store.estimatedPrepTime} mins</span></p>}
                {deliveryZones.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-foreground mb-1.5">Delivery areas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {deliveryZones.map((z: any) => (
                        <span key={z.id} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium bg-white" style={{ borderColor: accentColor, color: accentColor }}>
                          {z.label || z.postcodePattern} — £{(z.deliveryFee / 100).toFixed(2)} {z.estimatedMins && `· ${z.estimatedMins} mins`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="mt-6 text-center">
          <Link href={`/${storeSlug}/menu`}
            className="inline-flex h-12 items-center justify-center rounded-lg px-8 text-sm font-semibold text-white transition shadow-lg"
            style={{ background: headerBg }}>
            Order online for collection or delivery
          </Link>
        </div>
      </main>

      <footer style={{ background: headerBg }}>
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-3 font-display text-sm tracking-tight text-white">Explore</p>
              <div className="space-y-1.5 text-sm">
                <p><Link href={`/${storeSlug}`} className="text-white/70 hover:text-white transition">Home</Link></p>
                <p><Link href={`/${storeSlug}/menu`} className="text-white/70 hover:text-white transition">Order online</Link></p>
              </div>
            </div>
            <div>
              <p className="mb-3 font-display text-sm tracking-tight text-white">Legal</p>
              <div className="space-y-1.5 text-sm">
                <p><Link href={`/${storeSlug}/terms`} className="text-white/70 hover:text-white transition">Terms & Conditions</Link></p>
                <p><Link href={`/${storeSlug}/privacy`} className="text-white/70 hover:text-white transition">Privacy Policy</Link></p>
              </div>
            </div>
            <div>
              <p className="mb-3 font-display text-sm tracking-tight text-white">Get in touch</p>
              <div className="space-y-1.5 text-sm">
                {store.phone && (
                  <p><a href={`tel:${store.phone}`} className="text-white/70 hover:text-white transition">{store.phone}</a></p>
                )}
                {store.address && (
                  <p className="text-white/70">{store.address}{store.postcode ? `, ${store.postcode}` : ""}</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-white/20 pt-4 text-center text-xs text-white/60">
            <p>© 2026 {store.name}. All rights reserved.</p>
            <p className="mt-1">Powered by <span className="font-semibold text-white">Ordora</span></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
