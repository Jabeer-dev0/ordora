"use client"

import { Bell, Search, Moon, Sun, Shield } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@ordora/shared/components/ui/button"
import { Avatar, AvatarFallback } from "@ordora/shared/components/ui/avatar"

export function AdminTopbar() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input type="text" placeholder="Search tenants, stores..." className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative"><Bell className="size-5" /><span className="absolute top-1.5 right-1.5 size-2 bg-brand-orange rounded-full" /></Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Avatar className="ml-2"><AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm"><Shield className="size-4" /></AvatarFallback></Avatar>
      </div>
    </header>
  )
}
