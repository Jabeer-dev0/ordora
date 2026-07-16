import { RegisterForm } from "@/components/register-form"

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-32 -top-32 w-[32rem] h-[32rem] rounded-full bg-brand-blue/[0.07] blur-[100px] animate-aurora-1" />
        <div className="absolute -right-24 -bottom-24 w-[28rem] h-[28rem] rounded-full bg-brand-orange/[0.06] blur-[100px] animate-aurora-2" />
      </div>
      <div className="relative z-10 grid min-h-screen w-full lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden p-9 lg:flex xl:p-12 bg-sidebar text-sidebar-foreground">
          <div className="relative z-[1]">
            <div className="inline-flex items-center rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-orange to-brand-orange/80 flex items-center justify-center"><span className="text-white font-bold text-sm">O</span></div>
                <span className="text-lg font-bold tracking-tight text-foreground">Ordora</span>
              </div>
            </div>
          </div>
          <div className="relative z-[1] max-w-sm">
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight">Start your journey with Ordora.</h2>
            <p className="mt-3.5 text-sm leading-relaxed text-sidebar-foreground/70">Create your account and start managing your restaurant in minutes.</p>
            <ul className="mt-8 space-y-1">
              <li className="flex items-start gap-3.5 rounded-2xl px-3 py-3 hover:bg-white/[0.04]">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m9 12 2 2 4-4"></path></svg></span>
                <span><span className="block text-sm font-semibold">Free to start</span><span className="block text-[13px] text-sidebar-foreground/60 mt-0.5">No credit card required.</span></span>
              </li>
              <li className="flex items-start gap-3.5 rounded-2xl px-3 py-3 hover:bg-white/[0.04]">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span>
                <span><span className="block text-sm font-semibold">Quick setup</span><span className="block text-[13px] text-sidebar-foreground/60 mt-0.5">Get up and running in under 5 minutes.</span></span>
              </li>
              <li className="flex items-start gap-3.5 rounded-2xl px-3 py-3 hover:bg-white/[0.04]">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></span>
                <span><span className="block text-sm font-semibold">Multi-location</span><span className="block text-[13px] text-sidebar-foreground/60 mt-0.5">Add unlimited stores as you grow.</span></span>
              </li>
            </ul>
          </div>
          <div className="relative z-[1] text-xs text-sidebar-foreground/50">© 2026 Ordora</div>
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
            <RegisterForm />
          </div>
        </div>
      </div>
    </main>
  )
}
