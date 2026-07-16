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
import { Building2, Plus, Trash2, Power, PowerOff, ExternalLink, Eye, Edit } from "lucide-react"
import { createTenant, updateTenant, updateTenantStatus, deleteTenant } from "@/lib/actions/tenant"

const STOREFRONT_URL = "https://ordora-storefront.vercel.app"

interface Tenant {
  id: string; name: string; slug: string; plan: string; status: string
  logoUrl: string | null; brandColor: string | null; accentColor: string | null; tagline: string | null
  _count: { stores: number; users: number }
}

export function TenantsClient({ tenants: initial }: { tenants: Tenant[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tenants, setTenants] = useState(initial)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Tenant | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null)
  const [createdStore, setCreatedStore] = useState<{ tenantName: string; storeSlug: string } | null>(null)

  const [fName, setFName] = useState("")
  const [fOwnerName, setFOwnerName] = useState("")
  const [fEmail, setFEmail] = useState("")
  const [fPassword, setFPassword] = useState("")
  const [fStoreName, setFStoreName] = useState("")
  const [fPlan, setFPlan] = useState("FREE")
  const [fLogoUrl, setFLogoUrl] = useState("")
  const [fBrandColor, setFBrandColor] = useState("#FF5733")
  const [fAccentColor, setFAccentColor] = useState("#1E40AF")
  const [fTagline, setFTagline] = useState("")

  // Edit form states
  const [eName, setEName] = useState("")
  const [eLogoUrl, setELogoUrl] = useState("")
  const [eBrandColor, setEBrandColor] = useState("#FF5733")
  const [eAccentColor, setEAccentColor] = useState("#1E40AF")
  const [eTagline, setETagline] = useState("")
  const [ePlan, setEPlan] = useState("FREE")

  function reset() {
    setFName(""); setFOwnerName(""); setFEmail(""); setFPassword(""); setFStoreName(""); setFPlan("FREE")
    setFLogoUrl(""); setFBrandColor("#FF5733"); setFAccentColor("#1E40AF"); setFTagline("")
  }

  function openEdit(t: Tenant) {
    setEditTarget(t)
    setEName(t.name)
    setELogoUrl(t.logoUrl || "")
    setEBrandColor(t.brandColor || "#FF5733")
    setEAccentColor(t.accentColor || "#1E40AF")
    setETagline(t.tagline || "")
    setEPlan(t.plan)
  }

  async function handleCreate() {
    if (!fName.trim() || !fOwnerName.trim() || !fEmail.trim() || !fPassword.trim() || !fStoreName.trim()) {
      toast.error("All fields are required"); return
    }
    try {
      const result = await createTenant({
        name: fName.trim(), ownerName: fOwnerName.trim(), ownerEmail: fEmail.trim(), ownerPassword: fPassword,
        storeName: fStoreName.trim(), plan: fPlan, logoUrl: fLogoUrl.trim() || undefined,
        brandColor: fBrandColor || undefined, accentColor: fAccentColor || undefined, tagline: fTagline.trim() || undefined,
      })
      const storeSlug = fStoreName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      toast.success("Tenant created with store and owner account")
      setAddOpen(false); reset()
      setCreatedStore({ tenantName: fName.trim(), storeSlug })
      startTransition(() => router.refresh())
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  async function handleEdit() {
    if (!editTarget || !eName.trim()) { toast.error("Business name is required"); return }
    try {
      await updateTenant(editTarget.id, {
        name: eName.trim(), logoUrl: eLogoUrl.trim() || null,
        brandColor: eBrandColor || null, accentColor: eAccentColor || null,
        tagline: eTagline.trim() || null, plan: ePlan,
      })
      setTenants(prev => prev.map(t => t.id === editTarget.id ? { ...t, name: eName.trim(), logoUrl: eLogoUrl.trim() || null, brandColor: eBrandColor, accentColor: eAccentColor, tagline: eTagline.trim() || null, plan: ePlan } : t))
      toast.success("Tenant updated")
      setEditTarget(null)
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

  function getStorefrontUrl(slug: string) {
    return `${STOREFRONT_URL}/${slug}`
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

      {createdStore && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">Tenant "{createdStore.tenantName}" created successfully!</p>
              <p className="text-sm text-green-700 mt-1">Your customer-facing store is live at:</p>
            </div>
            <div className="flex items-center gap-2">
              <code className="bg-white px-3 py-1.5 rounded border text-sm">{getStorefrontUrl(createdStore.storeSlug)}</code>
              <Button variant="outline" size="sm" asChild><a href={getStorefrontUrl(createdStore.storeSlug)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Storefront URL</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Branding</th>
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
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {t.logoUrl ? (
                            <img src={t.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border" />
                          ) : (
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                              <Building2 className="size-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium">{t.name}</span>
                            {t.tagline && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.tagline}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{STOREFRONT_URL}/{t.slug}</code>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {t.brandColor && <div className="w-5 h-5 rounded border" style={{ backgroundColor: t.brandColor }} title={`Brand: ${t.brandColor}`} />}
                          {t.accentColor && <div className="w-5 h-5 rounded border" style={{ backgroundColor: t.accentColor }} title={`Accent: ${t.accentColor}`} />}
                        </div>
                      </td>
                      <td className="p-4 font-medium">{t._count.stores}</td>
                      <td className="p-4 font-medium">{t._count.users}</td>
                      <td className="p-4"><Badge variant="outline">{t.plan}</Badge></td>
                      <td className="p-4"><Badge variant={t.status === "ACTIVE" ? "default" : "destructive"}>{t.status.toLowerCase()}</Badge></td>
                      <td className="p-4"><div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)} title="Edit"><Edit className="h-4 w-4 text-muted-foreground" /></Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Tenant</DialogTitle><DialogDescription>This creates a tenant, store, and owner account.</DialogDescription></DialogHeader>
          <div className="space-y-5">
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

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Branding (Customer Storefront)</h4>
              <div className="space-y-3">
                <div className="space-y-2"><Label>Logo URL</Label><Input value={fLogoUrl} onChange={e => setFLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" /></div>
                <div className="space-y-2"><Label>Tagline</Label><Input value={fTagline} onChange={e => setFTagline(e.target.value)} placeholder="e.g. Fresh food, fast delivery!" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brand Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={fBrandColor} onChange={e => setFBrandColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                      <Input value={fBrandColor} onChange={e => setFBrandColor(e.target.value)} placeholder="#FF5733" className="font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={fAccentColor} onChange={e => setFAccentColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                      <Input value={fAccentColor} onChange={e => setFAccentColor(e.target.value)} placeholder="#1E40AF" className="font-mono" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isPending}>{isPending ? "Creating..." : "Create Tenant"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={o => { if (!o) setEditTarget(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tenant — {editTarget?.name}</DialogTitle>
            <DialogDescription>Update branding and details. Changes appear on the customer storefront.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2"><Label>Business Name</Label><Input value={eName} onChange={e => setEName(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={ePlan} onValueChange={setEPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="PRO">Professional</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Branding</h4>
              <div className="space-y-3">
                <div className="space-y-2"><Label>Logo URL</Label><Input value={eLogoUrl} onChange={e => setELogoUrl(e.target.value)} placeholder="https://example.com/logo.png" /></div>
                <div className="space-y-2"><Label>Tagline</Label><Input value={eTagline} onChange={e => setETagline(e.target.value)} placeholder="e.g. Fresh food, fast delivery!" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brand Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={eBrandColor} onChange={e => setEBrandColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                      <Input value={eBrandColor} onChange={e => setEBrandColor(e.target.value)} className="font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={eAccentColor} onChange={e => setEAccentColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                      <Input value={eAccentColor} onChange={e => setEAccentColor(e.target.value)} className="font-mono" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {editTarget && (
              <div className="border-t pt-3">
                <Label className="text-muted-foreground">Storefront URL</Label>
                <p className="text-sm mt-1"><code className="bg-muted px-2 py-1 rounded">{getStorefrontUrl(editTarget.slug)}</code></p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</DialogTitle><DialogDescription>This will permanently delete the tenant, all its stores, users, menu items, and orders.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
