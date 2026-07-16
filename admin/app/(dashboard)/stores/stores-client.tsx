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
import { Store, Plus, Trash2, Power, PowerOff } from "lucide-react"
import { createStore, updateStore, deleteStore } from "@/lib/actions/store"

interface StoreItem {
  id: string; name: string; address: string | null; phone: string | null; isActive: boolean
  tenant: { name: string; id: string } | null
  _count: { orders: number; menuItems: number; staff: number }
}
interface TenantOption { id: string; name: string }

export function StoresClient({ stores: initial, tenants }: { stores: StoreItem[]; tenants: TenantOption[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [stores, setStores] = useState(initial)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StoreItem | null>(null)
  const [fName, setFName] = useState("")
  const [fTenantId, setFTenantId] = useState("")
  const [fAddress, setFAddress] = useState("")
  const [fPhone, setFPhone] = useState("")

  function reset() { setFName(""); setFTenantId(""); setFAddress(""); setFPhone("") }

  async function handleCreate() {
    if (!fName.trim() || !fTenantId) { toast.error("Name and tenant are required"); return }
    try {
      await createStore({ name: fName.trim(), tenantId: fTenantId, address: fAddress.trim() || undefined, phone: fPhone.trim() || undefined })
      toast.success("Store created")
      setAddOpen(false); reset()
      startTransition(() => router.refresh())
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  async function handleToggleActive(store: StoreItem) {
    try {
      await updateStore(store.id, { isActive: !store.isActive })
      setStores(prev => prev.map(s => s.id === store.id ? { ...s, isActive: !s.isActive } : s))
      toast.success(`Store ${store.isActive ? "deactivated" : "activated"}`)
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteStore(deleteTarget.id)
      setStores(prev => prev.filter(s => s.id !== deleteTarget.id))
      toast.success("Store deleted"); setDeleteTarget(null)
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
          <p className="text-muted-foreground">All stores across tenants ({stores.length} total)</p>
        </div>
        <Button onClick={() => { reset(); setAddOpen(true) }} disabled={tenants.length === 0}>
          <Plus className="mr-1.5 h-4 w-4" /> {tenants.length === 0 ? "Create a tenant first" : "New Store"}
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {stores.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No stores yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Store</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Tenant</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Items</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Staff</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Orders</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4"><div className="flex items-center gap-3"><div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10"><Store className="size-5 text-primary" /></div><div><span className="font-medium">{s.name}</span>{s.address && <p className="text-xs text-muted-foreground">{s.address}</p>}</div></div></td>
                      <td className="p-4 text-muted-foreground">{s.tenant?.name}</td>
                      <td className="p-4 font-medium">{s._count.menuItems}</td>
                      <td className="p-4 font-medium">{s._count.staff}</td>
                      <td className="p-4 font-medium">{s._count.orders}</td>
                      <td className="p-4"><Badge variant={s.isActive ? "default" : "destructive"}>{s.isActive ? "Active" : "Inactive"}</Badge></td>
                      <td className="p-4"><div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(s)}>{s.isActive ? <PowerOff className="h-4 w-4 text-muted-foreground" /> : <Power className="h-4 w-4 text-green-600" />}</Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create New Store</DialogTitle><DialogDescription>Add a store under an existing tenant.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tenant *</Label>
              <Select value={fTenantId} onValueChange={setFTenantId}>
                <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Store Name *</Label><Input value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. High Street Branch" /></div>
            <div className="space-y-2"><Label>Address</Label><Input value={fAddress} onChange={e => setFAddress(e.target.value)} placeholder="123 Main St, London" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="0123456789" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isPending}>{isPending ? "..." : "Create Store"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete "{deleteTarget?.name}"?</DialogTitle><DialogDescription>This will permanently delete the store, its menu items, orders, and staff.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
