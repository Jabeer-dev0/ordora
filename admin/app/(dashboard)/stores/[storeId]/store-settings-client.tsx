"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@ordora/shared/components/ui/button"
import { Input } from "@ordora/shared/components/ui/input"
import { Label } from "@ordora/shared/components/ui/label"
import { Textarea } from "@ordora/shared/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@ordora/shared/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@ordora/shared/components/ui/tabs"
import { ArrowLeft, Save, ExternalLink, Clock, Truck, Palette, DollarSign, Store } from "lucide-react"
import { updateStore } from "@/lib/actions/store"
import { upsertOpeningHours } from "@/lib/actions/opening-hours"
import { upsertDeliveryZones } from "@/lib/actions/delivery-zones"
import Link from "next/link"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface StoreData {
  id: string; name: string; slug: string; address: string | null; phone: string | null; postcode: string | null
  description: string | null; website: string | null
  brandColor: string | null; accentColor: string | null; tagline: string | null; heroImageUrl: string | null
  webServiceCharge: number; bagCharge: number
  deliveryEnabled: boolean; collectionEnabled: boolean; minimumOrderAmount: number; deliveryFee: number; estimatedPrepTime: number
  acceptingOrders: boolean; isActive: boolean
  tenant: { name: string; id: string; slug: string } | null
  openingHours: { id: string; day: number; open: string; close: string; isActive: boolean; orderType: string }[]
  deliveryZones: { id: string; postcodePattern: string; label: string; deliveryFee: number; minimumOrder: number; estimatedMins: number; isActive: boolean; sortOrder: number }[]
}

export function StoreSettingsClient({ store }: { store: StoreData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState("general")

  // General
  const [name, setName] = useState(store.name)
  const [address, setAddress] = useState(store.address || "")
  const [phone, setPhone] = useState(store.phone || "")
  const [postcode, setPostcode] = useState(store.postcode || "")
  const [description, setDescription] = useState(store.description || "")
  const [website, setWebsite] = useState(store.website || "")
  const [acceptingOrders, setAcceptingOrders] = useState(store.acceptingOrders)
  const [isActive, setIsActive] = useState(store.isActive)

  // Branding
  const [brandColor, setBrandColor] = useState(store.brandColor || "#FF5733")
  const [accentColor, setAccentColor] = useState(store.accentColor || "#1E40AF")
  const [tagline, setTagline] = useState(store.tagline || "")
  const [heroImageUrl, setHeroImageUrl] = useState(store.heroImageUrl || "")

  // Opening Hours — Collection
  const defaultCollectionHours = Array.from({ length: 7 }, (_, i) => {
    const existing = store.openingHours.find((h: any) => h.day === i && h.orderType === "COLLECTION")
    return { day: i, open: existing?.open || "09:00", close: existing?.close || "22:00", isActive: existing?.isActive ?? (i === 0 ? false : true) }
  })
  const [collectionHours, setCollectionHours] = useState(defaultCollectionHours)

  // Opening Hours — Delivery
  const defaultDeliveryHours = Array.from({ length: 7 }, (_, i) => {
    const existing = store.openingHours.find((h: any) => h.day === i && h.orderType === "DELIVERY")
    return { day: i, open: existing?.open || "09:00", close: existing?.close || "22:00", isActive: existing?.isActive ?? (i === 0 ? false : true) }
  })
  const [deliveryHours, setDeliveryHours] = useState(defaultDeliveryHours)

  // Opening Hours — single (when only one mode)
  const defaultSingleHours = Array.from({ length: 7 }, (_, i) => {
    const existing = store.openingHours.find((h: any) => h.day === i && (h.orderType === "COLLECTION" || h.orderType === "DELIVERY"))
    return { day: i, open: existing?.open || "09:00", close: existing?.close || "22:00", isActive: existing?.isActive ?? (i === 0 ? false : true) }
  })
  const [singleHours, setSingleHours] = useState(defaultSingleHours)
  const [hoursTab, setHoursTab] = useState("collection")

  // Delivery
  const [deliveryEnabled, setDeliveryEnabled] = useState(store.deliveryEnabled)
  const [collectionEnabled, setCollectionEnabled] = useState(store.collectionEnabled)
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(String(store.minimumOrderAmount || 0))
  const [deliveryFee, setDeliveryFee] = useState(String(store.deliveryFee || 0))
  const [estimatedPrepTime, setEstimatedPrepTime] = useState(String(store.estimatedPrepTime || 15))

  // Delivery Zones
  const [zones, setZones] = useState(store.deliveryZones.map(z => ({
    postcodePattern: z.postcodePattern, label: z.label, deliveryFee: z.deliveryFee,
    minimumOrder: z.minimumOrder, estimatedMins: z.estimatedMins, isActive: z.isActive, sortOrder: z.sortOrder,
  })))

  // Charges
  const [webServiceCharge, setWebServiceCharge] = useState(String(store.webServiceCharge || 0))
  const [bagCharge, setBagCharge] = useState(String(store.bagCharge || 0))

  async function saveGeneral() {
    try {
      await updateStore(store.id, {
        name: name.trim(), address: address.trim() || null, phone: phone.trim() || null,
        postcode: postcode.trim() || null, description: description.trim() || null,
        website: website.trim() || null, acceptingOrders, isActive,
      })
      toast.success("General settings saved")
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  async function saveBranding() {
    try {
      await updateStore(store.id, {
        brandColor: brandColor || null, accentColor: accentColor || null,
        tagline: tagline.trim() || null, heroImageUrl: heroImageUrl.trim() || null,
      })
      toast.success("Branding saved")
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  async function saveCollectionHours() {
    try {
      await upsertOpeningHours(store.id, collectionHours, "COLLECTION")
      toast.success("Collection hours saved")
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  async function saveDeliveryHours() {
    try {
      await upsertOpeningHours(store.id, deliveryHours, "DELIVERY")
      toast.success("Delivery hours saved")
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  async function saveSingleHours() {
    try {
      const orderType = collectionEnabled ? "COLLECTION" : "DELIVERY"
      await upsertOpeningHours(store.id, singleHours, orderType)
      toast.success("Opening hours saved")
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  const bothEnabled = deliveryEnabled && collectionEnabled

  async function saveDelivery() {
    try {
      await updateStore(store.id, {
        deliveryEnabled, collectionEnabled,
        minimumOrderAmount: parseInt(minimumOrderAmount) || 0,
        deliveryFee: parseInt(deliveryFee) || 0,
        estimatedPrepTime: parseInt(estimatedPrepTime) || 15,
      })
      toast.success("Delivery settings saved")
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  async function saveZones() {
    try {
      await upsertDeliveryZones(store.id, zones)
      toast.success("Delivery zones saved")
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  async function saveCharges() {
    try {
      await updateStore(store.id, {
        webServiceCharge: parseInt(webServiceCharge) || 0,
        bagCharge: parseInt(bagCharge) || 0,
      })
      toast.success("Charges saved")
    } catch (e: any) { toast.error(e.message || "Failed") }
  }

  function updateCollectionHour(day: number, field: "open" | "close" | "isActive", value: string | boolean) {
    setCollectionHours(prev => prev.map(h => h.day === day ? { ...h, [field]: value } : h))
  }

  function updateDeliveryHour(day: number, field: "open" | "close" | "isActive", value: string | boolean) {
    setDeliveryHours(prev => prev.map(h => h.day === day ? { ...h, [field]: value } : h))
  }

  function updateSingleHour(day: number, field: "open" | "close" | "isActive", value: string | boolean) {
    setSingleHours(prev => prev.map(h => h.day === day ? { ...h, [field]: value } : h))
  }

  function addZone() {
    setZones(prev => [...prev, { postcodePattern: "", label: "", deliveryFee: 0, minimumOrder: 0, estimatedMins: 30, isActive: true, sortOrder: prev.length }])
  }

  function updateZone(idx: number, field: string, value: any) {
    setZones(prev => prev.map((z, i) => i === idx ? { ...z, [field]: value } : z))
  }

  function removeZone(idx: number) {
    setZones(prev => prev.filter((_, i) => i !== idx))
  }

  const storefrontUrl = `https://ordora-storefront.vercel.app/${store.slug}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/stores"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{store.name}</h1>
            <p className="text-sm text-muted-foreground">
              {store.tenant?.name} &middot; <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{store.slug}</code>
              {" "}&middot; <a href={storefrontUrl} target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">View Storefront <ExternalLink className="h-3 w-3" /></a>
            </p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general"><Store className="h-4 w-4 mr-1.5" /> General</TabsTrigger>
          <TabsTrigger value="hours"><Clock className="h-4 w-4 mr-1.5" /> Opening Hours</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="h-4 w-4 mr-1.5" /> Branding</TabsTrigger>
          <TabsTrigger value="delivery"><Truck className="h-4 w-4 mr-1.5" /> Delivery</TabsTrigger>
          <TabsTrigger value="charges"><DollarSign className="h-4 w-4 mr-1.5" /> Charges</TabsTrigger>
        </TabsList>

        {/* GENERAL TAB */}
        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle>General Settings</CardTitle><CardDescription>Basic store information and status</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Store Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Slug (URL)</Label><Input value={store.slug} disabled className="bg-muted" /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 High Street, London" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0123456789" /></div>
                <div className="space-y-2"><Label>Postcode</Label><Input value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="SW1A 1AA" /></div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="About this store..." rows={3} /></div>
              <div className="space-y-2"><Label>Website</Label><Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" /></div>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={acceptingOrders} onChange={e => setAcceptingOrders(e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
                  <span className="text-sm font-medium">Accepting Orders</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
                  <span className="text-sm font-medium">Store Active</span>
                </label>
              </div>
              <div className="pt-2"><Button onClick={saveGeneral} disabled={isPending}><Save className="h-4 w-4 mr-1.5" /> Save General</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OPENING HOURS TAB */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>{bothEnabled ? "Opening Hours" : "Opening Hours"}</CardTitle>
              <CardDescription>
                {bothEnabled
                  ? "Set separate hours for Collection and Delivery. Both tabs save independently."
                  : "Set opening and closing times for each day. Toggle off to mark as closed."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bothEnabled && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setHoursTab("collection")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${hoursTab === "collection" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    🛍️ Collection Hours
                  </button>
                  <button
                    onClick={() => setHoursTab("delivery")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${hoursTab === "delivery" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    🚗 Delivery Hours
                  </button>
                </div>
              )}

              {/* Collection Hours */}
              {(!bothEnabled || hoursTab === "collection") && (
                <div className="space-y-3">
                  {bothEnabled && <p className="text-sm font-medium text-foreground">Collection Hours</p>}
                  {(bothEnabled ? collectionHours : singleHours).map((h) => (
                    <div key={h.day} className={`flex items-center gap-4 p-3 rounded-lg border ${h.isActive ? "bg-white" : "bg-muted/50"}`}>
                      <div className="w-24 font-medium text-sm text-foreground">{DAYS[h.day]}</div>
                      <label className="flex items-center gap-2 cursor-pointer w-20">
                        <input
                          type="checkbox" checked={h.isActive}
                          onChange={e => bothEnabled
                            ? updateCollectionHour(h.day, "isActive", e.target.checked)
                            : updateSingleHour(h.day, "isActive", e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-foreground">{h.isActive ? "Open" : "Closed"}</span>
                      </label>
                      {h.isActive && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Open</Label>
                            <Input type="time" value={h.open}
                              onChange={e => bothEnabled
                                ? updateCollectionHour(h.day, "open", e.target.value)
                                : updateSingleHour(h.day, "open", e.target.value)}
                              className="w-32" />
                          </div>
                          <span className="text-muted-foreground mt-4">to</span>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Close</Label>
                            <Input type="time" value={h.close}
                              onChange={e => bothEnabled
                                ? updateCollectionHour(h.day, "close", e.target.value)
                                : updateSingleHour(h.day, "close", e.target.value)}
                              className="w-32" />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="pt-3">
                    <Button onClick={bothEnabled ? saveCollectionHours : saveSingleHours} disabled={isPending}>
                      <Save className="h-4 w-4 mr-1.5" /> Save {bothEnabled ? "Collection" : "Opening"} Hours
                    </Button>
                  </div>
                </div>
              )}

              {/* Delivery Hours */}
              {bothEnabled && hoursTab === "delivery" && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Delivery Hours</p>
                  {deliveryHours.map((h) => (
                    <div key={h.day} className={`flex items-center gap-4 p-3 rounded-lg border ${h.isActive ? "bg-white" : "bg-muted/50"}`}>
                      <div className="w-24 font-medium text-sm text-foreground">{DAYS[h.day]}</div>
                      <label className="flex items-center gap-2 cursor-pointer w-20">
                        <input type="checkbox" checked={h.isActive} onChange={e => updateDeliveryHour(h.day, "isActive", e.target.checked)} className="w-4 h-4 rounded" />
                        <span className="text-sm text-foreground">{h.isActive ? "Open" : "Closed"}</span>
                      </label>
                      {h.isActive && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Open</Label>
                            <Input type="time" value={h.open} onChange={e => updateDeliveryHour(h.day, "open", e.target.value)} className="w-32" />
                          </div>
                          <span className="text-muted-foreground mt-4">to</span>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Close</Label>
                            <Input type="time" value={h.close} onChange={e => updateDeliveryHour(h.day, "close", e.target.value)} className="w-32" />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="pt-3">
                    <Button onClick={saveDeliveryHours} disabled={isPending}>
                      <Save className="h-4 w-4 mr-1.5" /> Save Delivery Hours
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BRANDING TAB */}
        <TabsContent value="branding">
          <Card>
            <CardHeader><CardTitle>Branding</CardTitle><CardDescription>Customize how your store looks on the customer storefront</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Tagline</Label><Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Fresh food, fast delivery!" /></div>
              <div className="space-y-2"><Label>Hero Image URL</Label><Input value={heroImageUrl} onChange={e => setHeroImageUrl(e.target.value)} placeholder="https://example.com/hero.jpg" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                    <Input value={brandColor} onChange={e => setBrandColor(e.target.value)} className="font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                    <Input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="font-mono" />
                  </div>
                </div>
              </div>
              {(brandColor || accentColor) && (
                <div className="p-4 rounded-lg border" style={{ background: `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}>
                  <p className="text-white font-bold text-lg drop-shadow">{tagline || store.name}</p>
                  <p className="text-white/80 text-sm">Preview of your storefront gradient</p>
                </div>
              )}
              <div className="pt-2"><Button onClick={saveBranding} disabled={isPending}><Save className="h-4 w-4 mr-1.5" /> Save Branding</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DELIVERY TAB */}
        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Delivery & Collection Settings</CardTitle><CardDescription>Configure delivery and collection options</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={deliveryEnabled} onChange={e => setDeliveryEnabled(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm font-medium">Delivery Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={collectionEnabled} onChange={e => setCollectionEnabled(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm font-medium">Collection Available</span>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Min Order Amount (p)</Label><Input type="number" value={minimumOrderAmount} onChange={e => setMinimumOrderAmount(e.target.value)} /></div>
                <div className="space-y-2"><Label>Base Delivery Fee (p)</Label><Input type="number" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} /></div>
                <div className="space-y-2"><Label>Est. Prep Time (mins)</Label><Input type="number" value={estimatedPrepTime} onChange={e => setEstimatedPrepTime(e.target.value)} /></div>
              </div>
              <div className="pt-2"><Button onClick={saveDelivery} disabled={isPending}><Save className="h-4 w-4 mr-1.5" /> Save Delivery Settings</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Delivery Zones by Postcode</CardTitle><CardDescription>Set different delivery fees, minimum orders, and times per postcode area</CardDescription></div>
              <Button size="sm" onClick={addZone}>+ Add Zone</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {zones.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No delivery zones. Add one to set postcode-based delivery fees.</p>}
              {zones.map((z, i) => (
                <div key={i} className="flex items-end gap-3 p-3 rounded-lg border bg-white">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Postcode Pattern</Label>
                    <Input value={z.postcodePattern} onChange={e => updateZone(i, "postcodePattern", e.target.value)} placeholder="e.g. SW1A, E1, N16" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input value={z.label} onChange={e => updateZone(i, "label", e.target.value)} placeholder="e.g. Central London" />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Fee (p)</Label>
                    <Input type="number" value={z.deliveryFee} onChange={e => updateZone(i, "deliveryFee", parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Min Order (p)</Label>
                    <Input type="number" value={z.minimumOrder} onChange={e => updateZone(i, "minimumOrder", parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Mins</Label>
                    <Input type="number" value={z.estimatedMins} onChange={e => updateZone(i, "estimatedMins", parseInt(e.target.value) || 30)} />
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer pb-2">
                    <input type="checkbox" checked={z.isActive} onChange={e => updateZone(i, "isActive", e.target.checked)} className="w-4 h-4 rounded" />
                    <span className="text-xs">On</span>
                  </label>
                  <Button variant="ghost" size="sm" className="text-destructive mb-1" onClick={() => removeZone(i)}>Remove</Button>
                </div>
              ))}
              {zones.length > 0 && <div className="pt-2"><Button onClick={saveZones} disabled={isPending}><Save className="h-4 w-4 mr-1.5" /> Save Delivery Zones</Button></div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHARGES TAB */}
        <TabsContent value="charges">
          <Card>
            <CardHeader><CardTitle>Service Charges</CardTitle><CardDescription>Additional charges applied to online orders</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Web Service Charge (p)</Label><Input type="number" value={webServiceCharge} onChange={e => setWebServiceCharge(e.target.value)} /><p className="text-xs text-muted-foreground"> charged per order for online service</p></div>
                <div className="space-y-2"><Label>Bag Charge (p)</Label><Input type="number" value={bagCharge} onChange={e => setBagCharge(e.target.value)} /><p className="text-xs text-muted-foreground">charged per order for packaging</p></div>
              </div>
              <div className="pt-2"><Button onClick={saveCharges} disabled={isPending}><Save className="h-4 w-4 mr-1.5" /> Save Charges</Button></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
