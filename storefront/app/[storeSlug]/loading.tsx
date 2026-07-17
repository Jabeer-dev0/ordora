export default function StoreLoading() {
  return (
    <div className="min-h-screen">
      {/* Navbar skeleton */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: "var(--theme-ink)", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="max-w-[1600px] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-[61px]">
            <div className="h-10 w-32 animate-pulse rounded bg-white/10" />
            <div className="hidden md:flex items-center gap-4">
              <div className="h-5 w-12 animate-pulse rounded bg-white/10" />
              <div className="h-5 w-12 animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-9 w-20 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </header>

      {/* Hero skeleton */}
      <div className="w-full animate-pulse" style={{ backgroundColor: "var(--theme-ink)", minHeight: "26rem", height: "52vh" }} />

      {/* Star divider skeleton */}
      <div className="flex items-center justify-center py-4">
        <div className="w-10 h-10 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Deals skeleton */}
      <div className="py-8 sm:py-12" style={{ backgroundColor: "var(--paper-2)" }}>
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <div className="h-3 w-32 animate-pulse rounded bg-gray-300 mb-2" />
          <div className="h-8 w-64 animate-pulse rounded bg-gray-300 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2].map(i => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-300" style={{ borderRadius: "var(--radius-card)" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Star divider skeleton */}
      <div className="flex items-center justify-center py-4">
        <div className="w-10 h-10 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Popular skeleton */}
      <div className="py-8 sm:py-12">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <div className="mb-6">
            <div className="h-3 w-32 animate-pulse rounded bg-gray-200 mb-2" />
            <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-shrink-0 w-80 overflow-hidden bg-white animate-pulse" style={{ padding: "7px 8px 0", borderRadius: "30px" }}>
                <div className="animate-pulse bg-gray-200" style={{ borderRadius: "26px", height: "188px" }} />
                <div className="py-3 px-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
