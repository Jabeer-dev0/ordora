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
import { Store, Plus, Trash2, Power, PowerOff, ExternalLink, Edit, Settings } from "lucide-react"
import { createStore, updateStore, deleteStore } from "@/lib/actions/store"
import Link from "next/link"

const STOREFRONT_URL = "https://ordora-storefront.vercel.app"

interface StoreItem {
  id: string; name: string; slug: string | null; address: string | null; phone: string | null; postcode: string | null
  brandColor: string | null; accentColor: string | null; tagline: string | null; heroImageUrl: string | null
  webServiceCharge: number; bagCharge: number
  isActive: boolean; tenantId: string
  tenant: { name: string; id: string } | null
  _count: { orders: number; menuItems: number; staff: number }
}
interface TenantOption { id: string; name: string }

export function StoresClient({ stores: initial, tenants }: { stores: StoreItem[]; tenants: TenantOption[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [stores, setStores] = useState(initial)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StoreItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StoreItem | null>(null)
  const [createdStore, setCreatedStore] = useState<{ name: string; slug: string } | null>(null)

  // Create form
  const [fName, setFName] = useState("")
  const [fTenantId, setFTenantId] = useState("")
  const [fAddress, setFAddress] = useState("")
  const [fPhone, setFPhone] = useState("")
  const [fPostcode, setFPostcode] = useState("")
  const [fBrandColor, setFBrandColor] = useState("#FF5733")
  const [fAccentColor, setFAccentColor] = useState("#1E40AF")
  const [fTagline, setFTagline] = useState("")
  const [fHeroImageUrl, setFHeroImageUrl] = useState("")
  const [fWebServiceCharge, setFWebServiceCharge] = useState("0")
  const [fBagCharge, setFBagCharge] = useState("0")

  // Edit form
  const [eName, setEName] = useState("")
  const [eAddress, setEAddress] = useState("")
  const [ePhone, setEPhone] = useState("")
  const [ePostcode, setEPostcode] = useState("")
  const [eBrandColor, setEBrandColor] = useState("#FF5733")
  const [eAccentColor, setEAccentColor] = useState("#1E40AF")
  const [eTagline, setETagline] = useState("")
  const [eHeroImageUrl, setEHeroImageUrl] = useState("")
  const [eWebServiceCharge, setEWebServiceCharge] = useState("0")
  const [eBagCharge, setEBagCharge] = useState("0")

  function reset() {
    setFName(""); setFTenantId(""); setFAddress(""); setFPhone(""); setFPostcode("")
    setFBrandColor("#FF5733"); setFAccentColor("#1E40AF"); setFTagline(""); setFHeroImageUrl("")
    setFWebServiceCharge("0"); setFBagCharge("0")
  }

  function openEdit(s: StoreItem) {
    setEditTarget(s)
    setEName(s.name); setEAddress(s.address || ""); setEPhone(s.phone || ""); setEPostcode(s.postcode || "")
    setEBrandColor(s.brandColor || "#FF5733"); setEAccentColor(s.accentColor || "#1E40AF")
    setETagline(s.tagline || ""); setEHeroImageUrl(s.heroImageUrl || "")
    setEWebServiceCharge(String(s.webServiceCharge || 0)); setEBagCharge(String(s.bagCharge || 0))
  }

  async function handleCreate() {
    if (!fName.trim() || !fTenantId) { toast.error("Name and tenant are required"); return }
    try {
      const result = await createStore({
        name: fName.trim(), tenantId: fTenantId, address: fAddress.trim() || undefined, phone: fPhone.trim() || undefined,
        postcode: fPostcode.trim() || undefined, brandColor: fBrandColor || undefined,
        accentColor: fAccentColor || undefined, tagline: fTagline.trim() || undefined,
        heroImageUrl: fHeroImageUrl.trim() || undefined,
        webServiceCharge: parseFloat(fWebServiceCharge) || 0, bagCharge: parseFloat(fBagCharge) || 0,
      })
      const slug = fName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      const tenant = tenants.find(t => t.id === fTenantId)
      toast.success("Store created")
      setAddOpen(false); reset()
      setCreatedStore({ name: fName.trim(), slug })
      startTransition(() => router.refresh())
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  async function handleEdit() {
    if (!editTarget || !eName.trim()) { toast.error("Store name is required"); return }
    try {
      await updateStore(editTarget.id, {
        name: eName.trim(), address: eAddress.trim() || null, phone: ePhone.trim() || null,
        postcode: ePostcode.trim() || null, brandColor: eBrandColor || null,
        accentColor: eAccentColor || null, tagline: eTagline.trim() || null,
        heroImageUrl: eHeroImageUrl.trim() || null,
        webServiceCharge: parseFloat(eWebServiceCharge) || 0, bagCharge: parseFloat(eBagCharge) || 0,
      })
      setStores(prev => prev.map(s => s.id === editTarget.id ? {
        ...s, name: eName.trim(), address: eAddress.trim() || null, phone: ePhone.trim() || null,
        postcode: ePostcode.trim() || null, brandColor: eBrandColor, accentColor: eAccentColor,
        tagline: eTagline.trim() || null, heroImageUrl: eHeroImageUrl.trim() || null,
        webServiceCharge: parseFloat(eWebServiceCharge) || 0, bagCharge: parseFloat(eBagCharge) || 0,
      } : s))
      toast.success("Store updated")
      setEditTarget(null)
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

  function getStorefrontUrl(slug: string) { return `${STOREFRONT_URL}/${slug}` }

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

      {createdStore && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">Store &quot;{createdStore.name}&quot; created!</p>
              <p className="text-sm text-green-700 mt-1">Customer storefront is live at:</p>
            </div>
            <div className="flex items-center gap-2">
              <code className="bg-white px-3 py-1.5 rounded border text-sm">{getStorefrontUrl(createdStore.slug)}</code>
              <Button variant="outline" size="sm" asChild><a href={getStorefrontUrl(createdStore.slug)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Storefront URL</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Branding</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Items</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Orders</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                            <Store className="size-5 text-primary" />
                          </div>
                          <div>
                            <span className="font-medium">{s.name}</span>
                            {s.address && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{s.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{s.tenant?.name}</td>
                      <td className="p-4">
                        {s.slug ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">{STOREFRONT_URL}/{s.slug}</code>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {s.brandColor && <div className="w-5 h-5 rounded border" style={{ backgroundColor: s.brandColor }} title={`Brand: ${s.brandColor}`} />}
                          {s.accentColor && <div className="w-5 h-5 rounded border" style={{ backgroundColor: s.accentColor }} title={`Accent: ${s.accentColor}`} />}
                        </div>
                      </td>
                      <td className="p-4 font-medium">{s._count.menuItems}</td>
                      <td className="p-4 font-medium">{s._count.orders}</td>
                      <td className="p-4"><Badge variant={s.isActive ? "default" : "destructive"}>{s.isActive ? "Active" : "Inactive"}</Badge></td>
                      <td className="p-4"><div className="flex items-center gap-1">
                        <Link href={`/stores/${s.id}`}><Button variant="ghost" size="icon" className="h-8 w-8" title="Store Settings"><Settings className="h-4 w-4 text-primary" /></Button></Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)} title="Quick Edit"><Edit className="h-4 w-4 text-muted-foreground" /></Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Store</DialogTitle><DialogDescription>Add a store under an existing tenant. A slug is auto-generated for the storefront URL.</DialogDescription></DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Tenant *</Label>
              <Select value={fTenantId} onValueChange={setFTenantId}>
                <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Store Name *</Label><Input value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. High Street Branch" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Address</Label><Input value={fAddress} onChange={e => setFAddress(e.target.value)} placeholder="123 Main St, London" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="0123456789" /></div>
            </div>
            <div className="space-y-2"><Label>Postcode</Label><Input value={fPostcode} onChange={e => setFPostcode(e.target.value)} placeholder="SW1A 1AA" /></div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Branding (Customer Storefront)</h4>
              <div className="space-y-3">
                <div className="space-y-2"><Label>Tagline</Label><Input value={fTagline} onChange={e => setFTagline(e.target.value)} placeholder="e.g. Fresh food, fast delivery!" /></div>
                <div className="space-y-2"><Label>Hero Image URL</Label><Input value={fHeroImageUrl} onChange={e => setFHeroImageUrl(e.target.value)} placeholder="https://example.com/hero.jpg" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brand Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={fBrandColor} onChange={e => setFBrandColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                      <Input value={fBrandColor} onChange={e => setFBrandColor(e.target.value)} className="font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={fAccentColor} onChange={e => setFAccentColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                      <Input value={fAccentColor} onChange={e => setFAccentColor(e.target.value)} className="font-mono" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Charges</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Web Service Charge (£)</Label><Input type="number" step="0.01" value={fWebServiceCharge} onChange={e => setFWebServiceCharge(e.target.value)} /></div>
                <div className="space-y-2"><Label>Bag Charge (£)</Label><Input type="number" step="0.01" value={fBagCharge} onChange={e => setFBagCharge(e.target.value)} /></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isPending}>{isPending ? "Creating..." : "Create Store"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={o => { if (!o) setEditTarget(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Store — {editTarget?.name}</DialogTitle>
            <DialogDescription>Update store details and branding. Changes appear on the customer storefront.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2"><Label>Store Name</Label><Input value={eName} onChange={e => setEName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Address</Label><Input value={eAddress} onChange={e => setEAddress(e.target.value)} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={ePhone} onChange={e => setEPhone(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Postcode</Label><Input value={ePostcode} onChange={e => setEPostcode(e.target.value)} /></div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Branding</h4>
              <div className="space-y-3">
                <div className="space-y-2"><Label>Tagline</Label><Input value={eTagline} onChange={e => setETagline(e.target.value)} placeholder="e.g. Fresh food, fast delivery!" /></div>
                <div className="space-y-2"><Label>Hero Image URL</Label><Input value={eHeroImageUrl} onChange={e => setEHeroImageUrl(e.target.value)} placeholder="https://example.com/hero.jpg" /></div>
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

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Charges</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Web Service Charge (£)</Label><Input type="number" step="0.01" value={eWebServiceCharge} onChange={e => setEWebServiceCharge(e.target.value)} /></div>
                <div className="space-y-2"><Label>Bag Charge (£)</Label><Input type="number" step="0.01" value={eBagCharge} onChange={e => setEBagCharge(e.target.value)} /></div>
              </div>
            </div>

            {editTarget && editTarget.slug && (
              <div className="border-t pt-3">
                <Label className="text-muted-foreground">Customer Storefront URL</Label>
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
          <DialogHeader><DialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</DialogTitle><DialogDescription>This will permanently delete the store, its menu items, orders, and staff.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
