import { AdminLoginForm } from "@/components/admin-login-form"
import { ShieldCheck } from "lucide-react"

export default function AdminLoginPage() {
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
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 mb-4">
              <ShieldCheck className="size-4" />
              <span className="text-xs font-medium">Admin Panel</span>
            </div>
            <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight">Platform Administration</h2>
            <p className="mt-3.5 text-sm leading-relaxed text-sidebar-foreground/70">Manage tenants, monitor activity, and configure your Ordora platform.</p>
          </div>
          <div className="relative z-[1] text-xs text-sidebar-foreground/50">© 2026 Ordora · Admin Panel</div>
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
            <AdminLoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}