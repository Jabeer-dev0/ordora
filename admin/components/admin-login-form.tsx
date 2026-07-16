"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@ordora/shared/components/ui/button"
import { Input } from "@ordora/shared/components/ui/input"
import { Label } from "@ordora/shared/components/ui/label"
import { Eye, EyeOff, Mail, Lock, ShieldCheck, Loader2 } from "lucide-react"

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError("Invalid credentials or insufficient permissions")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError("Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card transition-all duration-300 hover:shadow-card-hover">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 mb-4">
            <ShieldCheck className="size-4 text-primary" />
            <span className="text-xs font-medium text-primary">Admin Access</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Admin Sign In</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Sign in with your administrator credentials.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" placeholder="admin@ordora.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-11" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-11 pr-11" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" variant="ink" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="size-4 animate-spin" /> Signing in...</> : "Sign in as Admin"}
          </Button>
        </form>
      </div>
      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" /> Restricted access · Admin only
      </p>
    </>
  )
}
