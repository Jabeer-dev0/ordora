import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-32 -top-32 w-[32rem] h-[32rem] rounded-full bg-brand-blue/[0.07] blur-[100px] animate-aurora-1" />
        <div className="absolute -right-24 -bottom-24 w-[28rem] h-[28rem] rounded-full bg-brand-orange/[0.06] blur-[100px] animate-aurora-2" />
        <div className="absolute left-1/2 top-1/3 w-[20rem] h-[20rem] rounded-full bg-brand-blue/[0.04] blur-[80px] animate-aurora-3" />
      </div>
      <div className="relative z-10 grid min-h-screen w-full lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden p-9 lg:flex xl:p-12 bg-sidebar text-sidebar-foreground">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full border-[28px] border-white/[0.04] pointer-events-none" />
          <div className="absolute -left-12 bottom-20 w-48 h-48 rounded-full bg-white/[0.03] pointer-events-none" />
          <div className="relative z-[1]">
            <div className="inline-flex items-center rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-orange to-brand-orange/80 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">O</span>
                </div>
                <span className="text-lg font-bold tracking-tight text-foreground">Ordora</span>
              </div>
            </div>
          </div>
          <div className="relative z-[1] max-w-sm">
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight">Run your restaurant from one place.</h2>
            <p className="mt-3.5 text-sm leading-relaxed text-sidebar-foreground/70">Orders, menu, staff, payments and reports. The whole business in a single hub.</p>
            <ul className="mt-8 space-y-1">
              <li className="flex items-start gap-3.5 rounded-2xl px-3 py-3 transition-colors hover:bg-white/[0.04]">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>
                </span>
                <span>
                  <span className="block text-sm font-semibold">Live orders</span>
                  <span className="block text-[13px] text-sidebar-foreground/60 mt-0.5">One board for web, phone and till orders.</span>
                </span>
              </li>
              <li className="flex items-start gap-3.5 rounded-2xl px-3 py-3 transition-colors hover:bg-white/[0.04]">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path></svg>
                </span>
                <span>
                  <span className="block text-sm font-semibold">Every location</span>
                  <span className="block text-[13px] text-sidebar-foreground/60 mt-0.5">Switch between your shops in a tap.</span>
                </span>
              </li>
              <li className="flex items-start gap-3.5 rounded-2xl px-3 py-3 transition-colors hover:bg-white/[0.04]">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"></path><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h5"></path><path d="M17.5 17.5 16 16.3V14"></path><circle cx="16" cy="16" r="6"></circle></svg>
                </span>
                <span>
                  <span className="block text-sm font-semibold">Menu &amp; hours</span>
                  <span className="block text-[13px] text-sidebar-foreground/60 mt-0.5">Update prices, items and opening times.</span>
                </span>
              </li>
            </ul>
          </div>
          <div className="relative z-[1] text-xs text-sidebar-foreground/50">© 2026 Ordora · Point of sale &amp; online ordering</div>
        </div>
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <div className="inline-flex items-center rounded-2xl bg-card px-3 py-2.5 shadow-sm ring-1 ring-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-orange to-brand-orange/80 flex items-center justify-center"><span className="text-white font-bold text-sm">O</span></div>
                  <span className="text-lg font-bold tracking-tight text-foreground">Ordora</span>
                </div>
              </div>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}
