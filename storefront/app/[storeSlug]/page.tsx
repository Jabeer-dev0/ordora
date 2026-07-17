import { prisma } from "@ordora/shared/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Phone, MapPin, Navigation, Star } from "lucide-react"
import { getStoreBySlug } from "@/lib/store"
import { getStoreOpenStatus } from "@/lib/hours"

export const revalidate = 60

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function StarDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`} aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 40 40" className="text-[#130c72] opacity-20">
        <path d="M20 2l4.5 10.5L36 14l-8.5 7.5L30 33l-10-5.5L10 33l2.5-11.5L4 14l11.5-1.5z" fill="currentColor" stroke="white" strokeWidth="1.5"/>
      </svg>
    </div>
  )
}

export default async function StorePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params

  let store, banners, openingHours, menuItems
  try {
    store = await getStoreBySlug(storeSlug)
    if (!store || !store.isActive) notFound()

    ;[banners, openingHours, menuItems] = await Promise.all([
      prisma.banner.findMany({ where: { storeId: store.id, isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.storeOpeningHour.findMany({ where: { storeId: store.id }, orderBy: { day: "asc" } }),
      prisma.menuItem.findMany({ where: { storeId: store.id, isAvailable: true, soldOut: false, isFeatured: true }, take: 8, orderBy: { sortOrder: "asc" } }),
    ])
  } catch {
    notFound()
  }

  const hours = getStoreOpenStatus({ acceptingOrders: store!.acceptingOrders, closedUntil: store!.closedUntil }, openingHours as any)
  const logoUrl = store!.tenant?.logoUrl || null
  const storeName = store!.name
  const storeAddress = store!.address ? `${store!.address}${store!.postcode ? `, ${store!.postcode}` : ""}` : ""

  const today = new Date().getDay()

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: "var(--theme-ink)", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="max-w-[1600px] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-[61px]">
            <Link href={`/${storeSlug}`} className="flex-shrink-0">
              <img src={logoUrl || "/brands/chesters/chesters-logo.png"} alt={storeName} className="h-10 w-auto object-contain" />
            </Link>

            <nav className="hidden md:flex items-center gap-7">
              <Link href={`/${storeSlug}`} className="text-sm font-bold uppercase tracking-wide text-white border-b-2 border-white pb-0.5">Home</Link>
              <Link href={`/${storeSlug}/menu`} className="text-sm font-bold uppercase tracking-wide text-white/60 hover:text-white transition pb-0.5">Menu</Link>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${hours.isOpen ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                <span className={`size-1.5 rounded-full ${hours.isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
                {hours.text}
              </span>
              <Link href={`/${storeSlug}/menu`}
                className="rounded-full px-3.5 py-2.5 text-sm font-bold shadow-sm transition-transform active:scale-95 sm:px-6 sm:py-3"
                style={{ backgroundColor: "var(--brand)", color: "var(--brand-ink, white)" }}>
                Order
              </Link>
            </div>

            <div className="md:hidden">
              <Link href={`/${storeSlug}/menu`}
                className="rounded-full px-4 py-2 text-xs font-bold"
                style={{ backgroundColor: "var(--brand)", color: "var(--brand-ink, white)" }}>
                Order
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative w-full overflow-hidden" style={{ backgroundColor: "var(--theme-ink)", minHeight: "26rem", height: "52vh" }}>
          <img
            src={store!.heroImageUrl || "/brands/chesters/chesters-hero.jpg"}
            alt={storeName}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.5) 100%)" }} />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0">
            <Link href={`/${storeSlug}/menu`}
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold shadow-lg transition-transform active:scale-95"
              style={{ backgroundColor: "var(--brand)", color: "var(--brand-ink, white)", fontFamily: "var(--font-display)" }}>
              Order now
            </Link>
          </div>
        </section>

        <StarDivider className="py-4" />

        {/* ── Deals Banners ── */}
        {banners.length > 0 && (
          <section className="py-8 sm:py-12" style={{ backgroundColor: "var(--paper-2)" }}>
            <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand)" }}>Deals</span>
                <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-tight mt-1" style={{ color: "var(--theme-ink)" }}>Deals Worth Queuing For</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {banners.map((banner: any) => (
                  <Link
                    key={banner.id}
                    href={`/${storeSlug}/menu`}
                    className="block h-full overflow-hidden transition-all hover:brightness-[1.03]"
                    style={{ borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)" }}
                  >
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt={banner.title || "Deal"} className="w-full h-auto object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-48 bg-gradient-to-br from-[var(--brand)] to-[var(--accent)]">
                        <span className="text-white font-display text-xl">{banner.title || "Deal"}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <StarDivider className="py-4" />

        {/* ── Popular Items - Today's Heat ── */}
        {menuItems.length > 0 && (
          <section className="py-8 sm:py-12">
            <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand)" }}>Popular right now</span>
                <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-tight mt-1" style={{ color: "var(--theme-ink)" }}>Today&apos;s Heat</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2" data-scroll="onDark">
                {menuItems.map((item, i) => (
                  <Link
                    key={item.id}
                    href={`/${storeSlug}/menu`}
                    className="flex-shrink-0 w-80 overflow-hidden transition-all hover:translate-y-[-2px]"
                    style={{ padding: "7px 8px 0", borderRadius: "30px", backgroundColor: "var(--theme-ink)", boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="relative overflow-hidden" style={{ borderRadius: "26px", height: "188px" }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
                          <span className="text-5xl text-white font-display">{item.name.charAt(0)}</span>
                        </div>
                      )}
                      {/* Rank badge */}
                      <div className="absolute top-0 left-0 flex items-center justify-center text-white text-xs font-extrabold" style={{ height: "34px", padding: "0 14px", background: "var(--brand)", borderRadius: "0 0 12px 0" }}>
                        #{i + 1} today
                      </div>
                      {/* Price pill */}
                      <div className="absolute top-3 right-3 flex items-center justify-center font-extrabold text-sm" style={{ borderRadius: "999px", padding: "7px 15px", backgroundColor: "var(--theme-ink)", color: "var(--theme-ink-foreground)", boxShadow: "0 2px 8px rgba(0,0,0,0.35)" }}>
                        £{item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="py-3 px-1">
                      <h3 className="font-bold text-sm truncate" style={{ color: "var(--theme-ink-foreground)" }}>{item.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <StarDivider className="py-4" />

        {/* ── Visit Us Section ── */}
        <section className="relative py-16 sm:py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/brands/chesters/chesters-hero.jpg"
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ backgroundColor: "rgb(10 10 10 / 0.82)" }} />
          </div>
          <div className="relative max-w-[1400px] mx-auto px-5 sm:px-8">
            {/* Section header above the picture/map */}
            <div className="mb-7">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--brand)" }}>Find us</span>
              <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-tight mt-1" style={{ color: "var(--theme-ink-foreground)" }}>Visit {storeName}</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 items-start">
              {/* Map */}
              <div className="overflow-hidden shadow-lg h-[360px] order-2 lg:order-1" style={{ borderRadius: "var(--radius-card)" }}>
                {store!.address ? (
                  <iframe
                    title={`${storeName} location`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(store!.address)}&z=15&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full" style={{ backgroundColor: "var(--paper-2, #f1e9de)" }}>
                    <MapPin size={48} style={{ color: "var(--smoke, #7a6f63)" }} />
                  </div>
                )}
              </div>

              {/* Info Panel */}
              <div className="overflow-hidden order-1 lg:order-2" style={{ backgroundColor: "white", borderRadius: "var(--radius-card)", boxShadow: "var(--card-shadow, var(--shadow-card))" }}>
                {/* Open status */}
                <div className="px-6 pt-6 pb-4">
                  <div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${hours.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      <span className={`size-1.5 rounded-full ${hours.isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
                      {hours.isOpen ? "Open now" : "Closed"}
                    </span>
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-0" style={{ borderTop: "1px solid var(--line, #e3d8c8)" }}>
                  {storeAddress && (
                    <div className="flex items-start gap-3 px-6 py-4" style={{ borderBottom: "1px solid var(--line, #e3d8c8)" }}>
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--brand-soft)", color: "var(--brand)" }}>
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--theme-ink)" }}>{storeAddress}</p>
                        {store!.phone && <p className="text-sm text-gray-500 mt-0.5">{store!.phone}</p>}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <a href={`https://maps.google.com/?q=${encodeURIComponent(store!.address || "")}`} target="_blank" rel="noopener"
                            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition hover:brightness-110"
                            style={{ backgroundColor: "var(--brand)", color: "white" }}>
                            <Navigation size={13} /> Get directions
                          </a>
                          {store!.phone && (
                            <a href={`tel:${store!.phone}`}
                              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition"
                              style={{ backgroundColor: "var(--paper-2, #f1e9de)", color: "var(--theme-ink)" }}>
                              <Phone size={13} /> Call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Opening Hours */}
                  <div className="px-6 py-4">
                    <h3 className="font-display text-base font-bold mb-2" style={{ color: "var(--theme-ink)" }}>Opening hours</h3>
                    <div className="space-y-1">
                      {DAYS.map((day, i) => {
                        const h = openingHours.find((o: any) => o.day === i && o.orderType === "COLLECTION")
                        const isToday = today === i
                        return (
                          <div key={day} className={`flex items-center justify-between text-sm py-1 ${isToday ? "font-bold" : "text-gray-500"}`} style={isToday ? { color: "var(--theme-ink)" } : undefined}>
                            <span>{day}{isToday ? " · today" : ""}</span>
                            <span>{h?.isActive ? `${h.open}\u2013${h.close}` : "Closed"}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: "var(--theme-ink)" }}>
        {/* Gradient top bar */}
        <div className="h-1" style={{ background: "linear-gradient(90deg, var(--brand), var(--gold, #b8862f), var(--accent))" }} />

        <div className="max-w-[1600px] mx-auto px-6 py-12">
          {/* Logo + columns in one row */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-16 mb-10">
            {/* Logo + tagline */}
            <div className="lg:w-[1.4fr] shrink-0">
              <img src={logoUrl || "/brands/chesters/chesters-logo.png"} alt={storeName} className="h-14 w-auto object-contain mb-3" />
              <p className="text-sm text-white/40">Order online for collection or delivery</p>
            </div>

            {/* 3 columns in a row */}
            <div className="flex flex-1 flex-wrap justify-between gap-10 sm:gap-16">
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white/50 mb-4">Explore</h3>
                <ul className="space-y-2.5">
                  <li><Link href={`/${storeSlug}`} className="text-sm hover:text-white transition" style={{ color: "#d8cfc4" }}>Home</Link></li>
                  <li><Link href={`/${storeSlug}/menu`} className="text-sm hover:text-white transition" style={{ color: "#d8cfc4" }}>Order online</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white/50 mb-4">Legal</h3>
                <ul className="space-y-2.5">
                  <li><Link href={`/${storeSlug}/terms`} className="text-sm hover:text-white transition" style={{ color: "#d8cfc4" }}>Terms &amp; Conditions</Link></li>
                  <li><Link href={`/${storeSlug}/privacy`} className="text-sm hover:text-white transition" style={{ color: "#d8cfc4" }}>Privacy Policy</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white/50 mb-4">Get in touch</h3>
                <ul className="space-y-2.5">
                {store!.phone && (
                  <li>
                    <a href={`tel:${store!.phone}`} className="text-sm hover:text-white transition flex flex-col gap-0.5" style={{ color: "#d8cfc4" }}>
                      {store!.phone}<span className="text-xs text-white/30">Tap to call</span>
                    </a>
                  </li>
                )}
                {store!.address && (
                  <li>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(store!.address)}`} target="_blank" rel="noopener"
                      className="text-sm hover:text-white transition flex flex-col gap-0.5" style={{ color: "#d8cfc4" }}>
                      {storeAddress}<span className="text-xs text-white/30">Get directions</span>
                    </a>
                  </li>
                )}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.25rem" }}>
            <p className="text-xs text-white/30">&copy; {new Date().getFullYear()} {storeName}. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-white/30">
              <Link href={`/${storeSlug}/terms`} className="hover:text-white transition">Terms</Link>
              <Link href={`/${storeSlug}/privacy`} className="hover:text-white transition">Privacy</Link>
              <span className="text-white/30">Powered by <span className="font-bold" style={{ color: "var(--red, #e31e24)" }}>Ordora</span></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
