"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@ordora/shared/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@ordora/shared/components/ui/dialog"
import { Input } from "@ordora/shared/components/ui/input"
import { Label } from "@ordora/shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ordora/shared/components/ui/select"
import { Card, CardContent } from "@ordora/shared/components/ui/card"
import { Badge } from "@ordora/shared/components/ui/badge"
import { Building2, Plus, Trash2, Power, PowerOff } from "lucide-react"
import { createTenant, updateTenantStatus, deleteTenant } from "@/lib/actions/tenant"

interface Tenant {
  id: string; name: string; slug: string; plan: string; status: string
  _count: { stores: number; users: number }
}

export function TenantsClient({ tenants: initial }: { tenants: Tenant[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tenants, setTenants] = useState(initial)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null)
  const [fName, setFName] = useState("")
  const [fOwnerName, setFOwnerName] = useState("")
  const [fEmail, setFEmail] = useState("")
  const [fPassword, setFPassword] = useState("")
  const [fStoreName, setFStoreName] = useState("")
  const [fPlan, setFPlan] = useState("FREE")

  function reset() {
    setFName(""); setFOwnerName(""); setFEmail(""); setFPassword(""); setFStoreName(""); setFPlan("FREE")
  }

  async function handleCreate() {
    if (!fName.trim() || !fOwnerName.trim() || !fEmail.trim() || !fPassword.trim() || !fStoreName.trim()) {
      toast.error("All fields are required"); return
    }
    try {
      await createTenant({ name: fName.trim(), ownerName: fOwnerName.trim(), ownerEmail: fEmail.trim(), ownerPassword: fPassword, storeName: fStoreName.trim(), plan: fPlan })
      toast.success("Tenant created with store and owner account")
      setAddOpen(false); reset()
      startTransition(() => router.refresh())
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  async function handleToggleStatus(tenant: Tenant) {
    const ns = tenant.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await updateTenantStatus(tenant.id, ns)
      setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, status: ns } : t))
      toast.success(`Tenant ${ns === "ACTIVE" ? "activated" : "deactivated"}`)
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteTenant(deleteTarget.id)
      setTenants(prev => prev.filter(t => t.id !== deleteTarget.id))
      toast.success("Tenant deleted"); setDeleteTarget(null)
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">Manage all restaurant tenants ({tenants.length} total)</p>
        </div>
        <Button onClick={() => { reset(); setAddOpen(true) }}><Plus className="mr-1.5 h-4 w-4" /> New Tenant</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {tenants.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No tenants yet. Create your first tenant.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Tenant</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Slug</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Stores</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Users</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Plan</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10"><Building2 className="size-5 text-primary" /></div><span className="font-medium">{t.name}</span></div></td>
                      <td className="p-4 text-muted-foreground text-sm">{t.slug}</td>
                      <td className="p-4 font-medium">{t._count.stores}</td>
                      <td className="p-4 font-medium">{t._count.users}</td>
                      <td className="p-4"><Badge variant="outline">{t.plan}</Badge></td>
                      <td className="p-4"><Badge variant={t.status === "ACTIVE" ? "default" : "destructive"}>{t.status.toLowerCase()}</Badge></td>
                      <td className="p-4"><div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(t)}>{t.status === "ACTIVE" ? <PowerOff className="h-4 w-4 text-muted-foreground" /> : <Power className="h-4 w-4 text-green-600" />}</Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Tenant</DialogTitle><DialogDescription>This creates a tenant, store, and owner account.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Business Name *</Label><Input value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. Pizza Palace" /></div>
              <div className="space-y-2"><Label>Store Name *</Label><Input value={fStoreName} onChange={e => setFStoreName(e.target.value)} placeholder="e.g. Main Branch" /></div>
            </div>
            <div className="space-y-2"><Label>Owner Name *</Label><Input value={fOwnerName} onChange={e => setFOwnerName(e.target.value)} placeholder="e.g. John Smith" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Owner Email *</Label><Input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="owner@example.com" /></div>
              <div className="space-y-2"><Label>Password *</Label><Input type="password" value={fPassword} onChange={e => setFPassword(e.target.value)} placeholder="Min 8 characters" /></div>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={fPlan} onValueChange={setFPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="PRO">Professional</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isPending}>{isPending ? "..." : "Create Tenant"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete "{deleteTarget?.name}"?</DialogTitle><DialogDescription>This will permanently delete the tenant, all its stores, users, menu items, and orders.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
