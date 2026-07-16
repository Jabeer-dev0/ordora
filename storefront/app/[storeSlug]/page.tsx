import { prisma } from "@ordora/shared/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Phone, MapPin, Clock, ChevronRight, ShoppingBag, Star } from "lucide-react"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function getOpenStatus(hours: { day: number; open: string; close: string; isActive: boolean }[]) {
  const now = new Date()
  const dayIndex = (now.getDay() + 6) % 7
  const today = hours.find(h => h.day === dayIndex && h.isActive)
  if (!today) return { isOpen: false, text: "Closed today" }
  const [oh, om] = today.open.split(":").map(Number)
  const [ch, cm] = today.close.split(":").map(Number)
  const current = now.getHours() * 60 + now.getMinutes()
  const openTime = oh * 60 + om
  const closeTime = ch * 60 + cm
  const isOpen = current >= openTime && current < closeTime
  return { isOpen, text: isOpen ? `Open until ${today.close}` : `Closed until ${today.open}` }
}

export default async function StorePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    include: {
      tenant: true,
      banners: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      openingHours: { where: { orderType: "STORE" }, orderBy: { day: "asc" } },
      menuItems: { where: { isAvailable: true, soldOut: false, isFeatured: true }, take: 6, orderBy: { sortOrder: "asc" } },
      modifierGroups: {
        include: { items: { orderBy: { sortOrder: "asc" } } },
      },
    },
  })
  if (!store || !store.isActive) notFound()

  const hours = getOpenStatus(store.openingHours as any)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href={`/${storeSlug}`} className="text-xl font-bold text-ink">{store.name}</Link>
          <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
            <Link href={`/${storeSlug}`} className="text-ink/60 hover:text-ink transition">Home</Link>
            <Link href={`/${storeSlug}/menu`} className="text-ink/60 hover:text-ink transition">Menu</Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs">
              <span className={`h-2 w-2 rounded-full ${hours.isOpen ? "bg-green-500" : "bg-red-500"}`} />
              {hours.isOpen ? "Open" : "Closed"}
            </span>
            <Link href={`/${storeSlug}/menu`} className="flex items-center gap-2 rounded-lg brand-bg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">
              <ShoppingBag className="h-4 w-4" /> Order Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[50vh] items-center justify-center bg-ink text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/90 to-ink/70" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">{store.name}</h1>
          {store.address && <p className="mt-4 text-lg text-white/70">{store.address}</p>}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/60">
            <Clock className="h-4 w-4" /> {hours.text}
          </div>
          <Link href={`/${storeSlug}/menu`} className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-bold brand-bg text-white hover:opacity-90 transition shadow-lg">
            <ShoppingBag className="h-5 w-5" /> Start Order <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Banners */}
      {store.banners.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {store.banners.map(banner => (
              <div key={banner.id} className="flex flex-col justify-between rounded-2xl bg-surface border border-line p-6 shadow-sm hover:shadow-md transition">
                <div>
                  <h3 className="text-lg font-bold text-ink">{banner.title}</h3>
                  {banner.subtitle && <p className="mt-1 text-sm text-ink/60">{banner.subtitle}</p>}
                </div>
                <Link href={`/${storeSlug}/menu`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold brand-text hover:underline">
                  {banner.ctaLabel || "Order Now"} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular Items */}
      {store.menuItems.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Popular Items
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {store.menuItems.map((item, i) => (
              <Link key={item.id} href={`/${storeSlug}/menu`} className="group rounded-xl border border-line bg-surface p-3 text-center shadow-sm hover:shadow-md hover:border-brand/30 transition">
                <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-paper text-2xl font-bold brand-text">
                  {i + 1}
                </div>
                <p className="text-sm font-semibold text-ink line-clamp-2">{item.name}</p>
                <p className="mt-1 text-sm font-bold brand-text">£{item.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Contact & Hours */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-4 text-lg font-bold text-ink">Contact & Location</h2>
            <div className="space-y-3 text-sm text-ink/70">
              {store.phone && (
                <a href={`tel:${store.phone}`} className="flex items-center gap-2 hover:text-ink transition">
                  <Phone className="h-4 w-4" /> {store.phone}
                </a>
              )}
              {store.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {store.address}{store.postcode ? `, ${store.postcode}` : ""}
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-4 text-lg font-bold text-ink">Opening Hours</h2>
            <div className="space-y-2 text-sm">
              {DAYS.map((day, i) => {
                const h = store.openingHours.find((o: any) => o.day === i)
                const isToday = (new Date().getDay() + 6) % 7 === i
                return (
                  <div key={day} className={`flex justify-between ${isToday ? "font-semibold brand-text" : "text-ink/60"}`}>
                    <span>{day}</span>
                    <span>{h?.isActive ? `${h.open} - ${h.close}` : "Closed"}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-surface py-6 text-center text-xs text-ink/40">
        <p>Powered by <span className="font-semibold brand-text">Ordora</span></p>
      </footer>
    </div>
  )
}
