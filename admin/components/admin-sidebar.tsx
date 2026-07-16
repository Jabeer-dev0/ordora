"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@ordora/shared/lib/utils"
import { LayoutDashboard, Building2, Store, Settings, LogOut, ChevronLeft, ChevronRight, Shield } from "lucide-react"
import { useState } from "react"
import { signOut } from "next-auth/react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tenants", href: "/tenants", icon: Building2 },
  { name: "Stores", href: "/stores", icon: Store },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn("flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-white/10 transition-all duration-300", collapsed ? "w-[72px]" : "w-64")}>
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white shadow-sm shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-orange to-brand-orange/80 flex items-center justify-center"><span className="text-white font-bold text-xs">O</span></div>
          </div>
          {!collapsed && <span className="text-lg font-bold tracking-tight">Ordora</span>}
        </Link>
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0">
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link key={item.name} href={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200", isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}>
              <item.icon className={cn("size-5 shrink-0", isActive && "text-brand-orange")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5", collapsed && "justify-center")}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary shrink-0"><Shield className="size-4" /></div>
          {!collapsed && <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">Super Admin</p><p className="text-xs text-white/50 truncate">Platform Admin</p></div>}
        </div>
      </div>
      <div className="p-3 border-t border-white/10">
        <button onClick={() => signOut({ callbackUrl: "/login" })} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors w-full", collapsed && "justify-center")}>
          <LogOut className="size-5 shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  )
}
