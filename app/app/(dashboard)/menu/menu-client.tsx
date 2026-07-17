"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@ordora/shared/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@ordora/shared/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@ordora/shared/components/ui/select"
import { Input } from "@ordora/shared/components/ui/input"
import { Label } from "@ordora/shared/components/ui/label"
import { Textarea } from "@ordora/shared/components/ui/textarea"
import { Badge } from "@ordora/shared/components/ui/badge"
import {
  Plus, Pencil, Trash2, ArrowLeft, X, Settings2, FolderPlus, ImagePlus, Upload,
} from "lucide-react"
import {
  createMenuItem, updateMenuItem, deleteMenuItem,
  createModifierGroup, deleteModifierGroup, addModifierToGroup, deleteModifier,
} from "@/lib/actions/menu"
import { formatCurrency } from "@ordora/shared/lib/utils"

interface ModItem { id: string; name: string; price: number; maxQuantity: number }
interface ModGroup { id: string; name: string; required: boolean; minSelect: number; maxSelect: number; items: ModItem[] }
interface MenuItem {
  id: string; name: string; description: string | null; price: number; category: string; isAvailable: boolean; imageUrl: string | null
  modifierGroups: { modifierGroup: ModGroup }[]
}

type View = "categories" | "items" | "modifiers"

function ImageUpload({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (value) {
    return (
      <div className="relative group">
        <img src={value} alt="Menu item" className="h-32 w-full rounded-lg object-cover border" />
        <button onClick={() => onChange(null)}
          className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition">
          <X className="h-3 w-3" />
        </button>
        <button onClick={() => fileRef.current?.click()}
          className="absolute bottom-1 right-1 flex h-6 items-center gap-1 rounded-full bg-black/60 px-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition">
          <Upload className="h-3 w-3" /> Replace
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
          const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""
        }} />
      </div>
    )
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"}`}
    >
      <ImagePlus className="mb-1 h-6 w-6 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground/60">Click or drag image here</p>
      <p className="text-[10px] text-muted-foreground/40">JPG, PNG up to 2MB</p>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
        const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""
      }} />
    </div>
  )
}

export function MenuClient({ items, modifierGroups }: { items: MenuItem[]; modifierGroups: ModGroup[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [view, setView] = useState<View>("categories")
  const [selectedCategory, setSelectedCategory] = useState("")

  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null)
  const [editGroup, setEditGroup] = useState<ModGroup | null>(null)
  const [addModOpen, setAddModOpen] = useState(false)
  const [addModItemOpen, setAddModItemOpen] = useState(false)
  const [addCatOpen, setAddCatOpen] = useState(false)

  const [fName, setFName] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [fPrice, setFPrice] = useState("")
  const [fCategory, setFCategory] = useState("")
  const [fModGroupIds, setFModGroupIds] = useState<string[]>([])
  const [fImageUrl, setFImageUrl] = useState<string | null>(null)
  const [fGroupName, setFGroupName] = useState("")
  const [fGroupRequired, setFGroupRequired] = useState(false)
  const [fGroupMin, setFGroupMin] = useState("0")
  const [fGroupMax, setFGroupMax] = useState("1")
  const [fModName, setFModName] = useState("")
  const [fModPrice, setFModPrice] = useState("")
  const [fModMaxQty, setFModMaxQty] = useState("1")
  const [fNewCatName, setFNewCatName] = useState("")

  function reset() {
    setFName(""); setFDesc(""); setFPrice(""); setFCategory(""); setFModGroupIds([]); setFImageUrl(null)
    setFGroupName(""); setFGroupRequired(false); setFGroupMin("0"); setFGroupMax("1")
    setFModName(""); setFModPrice(""); setFModMaxQty("1")
  }

  const catItems = items.filter(i => i.category === selectedCategory)
  const grouped = items.reduce<Record<string, MenuItem[]>>((a, i) => { (a[i.category] = a[i.category] || []).push(i); return a }, {})
  const cats = Object.keys(grouped).sort()

  async function handleCreateItem() {
    if (!fName.trim() || !fPrice) { toast.error("Name and price are required"); return }
    const cat = fCategory.trim() || selectedCategory
    if (!cat) { toast.error("Select or type a category"); return }
    try {
      await createMenuItem({
        name: fName.trim(),
        price: parseFloat(fPrice),
        category: cat,
        description: fDesc.trim() || undefined,
        imageUrl: fImageUrl || undefined,
        modifierGroupIds: fModGroupIds.length > 0 ? fModGroupIds : undefined,
      })
      toast.success("Item created")
      setAddOpen(false)
      reset()
      if (cat !== selectedCategory) {
        setSelectedCategory(cat)
      }
      startTransition(() => router.refresh())
    } catch (e: any) {
      toast.error(e.message || "Failed to create item")
    }
  }

  async function handleUpdateItem() {
    if (!editItem) return
    try {
      await updateMenuItem(editItem.id, {
        name: fName.trim(),
        price: parseFloat(fPrice),
        category: fCategory.trim() || editItem.category,
        description: fDesc.trim() || undefined,
        imageUrl: fImageUrl || undefined,
        modifierGroupIds: fModGroupIds,
      })
      toast.success("Item updated")
      setEditItem(null)
      reset()
      startTransition(() => router.refresh())
    } catch (e: any) {
      toast.error(e.message || "Failed to update item")
    }
  }

  async function handleDeleteItem() {
    if (!deleteItem) return
    try {
      await deleteMenuItem(deleteItem.id)
      toast.success("Item deleted")
      setDeleteItem(null)
      startTransition(() => router.refresh())
    } catch (e: any) {
      toast.error(e.message || "Failed to delete item")
    }
  }

  async function handleCreateGroup() {
    if (!fGroupName.trim()) { toast.error("Enter group name"); return }
    try {
      await createModifierGroup({
        name: fGroupName.trim(),
        required: fGroupRequired,
        minSelect: parseInt(fGroupMin) || 0,
        maxSelect: parseInt(fGroupMax) || 1,
      })
      toast.success("Group created")
      setFGroupName(""); setFGroupMin("0"); setFGroupMax("1"); setFGroupRequired(false)
      startTransition(() => router.refresh())
    } catch (e: any) {
      toast.error(e.message || "Failed to create group")
    }
  }

  async function handleDeleteGroup(id: string) {
    try {
      await deleteModifierGroup(id)
      toast.success("Group deleted")
      startTransition(() => router.refresh())
    } catch (e: any) {
      toast.error(e.message || "Failed to delete group")
    }
  }

  async function handleAddModifier() {
    if (!fModName.trim() || !editGroup) return
    try {
      await addModifierToGroup(editGroup.id, { name: fModName.trim(), price: parseFloat(fModPrice) || 0, maxQuantity: parseInt(fModMaxQty) || 1 })
      toast.success("Option added")
      setFModName(""); setFModPrice(""); setFModMaxQty("1"); setAddModItemOpen(false)
      startTransition(() => router.refresh())
    } catch (e: any) {
      toast.error(e.message || "Failed to add option")
    }
  }

  async function handleDeleteModifier(id: string) {
    try {
      await deleteModifier(id)
      toast.success("Option removed")
      startTransition(() => router.refresh())
    } catch (e: any) {
      toast.error(e.message || "Failed to remove option")
    }
  }

  function handleCreateCategory() {
    if (!fNewCatName.trim()) { toast.error("Enter category name"); return }
    const name = fNewCatName.trim()
    if (cats.includes(name)) { toast.error("Category already exists"); return }
    setFNewCatName("")
    setAddCatOpen(false)
    setSelectedCategory(name)
    setView("items")
    setAddOpen(true)
    setFCategory(name)
  }

  const categoryEmoji: Record<string, string> = {
    Pizza: "🍕", Burgers: "🍔", Sides: "🍟", Drinks: "🥤", Desserts: "🍰", Starters: "🥗", Salads: "🥬",
  }

  // === CATEGORY VIEW ===
  if (view === "categories") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Select a category to manage items, or create new ones.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddModOpen(true)}>
              <Settings2 className="mr-1.5 h-4 w-4" /> Modifier Groups ({modifierGroups.length})
            </Button>
            <Button size="sm" onClick={() => { reset(); setFNewCatName(""); setAddCatOpen(true) }}>
              <FolderPlus className="mr-1.5 h-4 w-4" /> New Category
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {cats.map(cat => {
            const count = grouped[cat]?.length || 0
            const emoji = categoryEmoji[cat] || "🍽"
            return (
              <button key={cat} onClick={() => { setSelectedCategory(cat); setView("items") }}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-card p-6 text-center transition-all hover:border-[hsl(24,95%,53%)] hover:shadow-md hover:shadow-orange-500/5 active:scale-[0.97]">
                <span className="text-3xl">{emoji}</span>
                <span className="font-semibold">{cat}</span>
                <Badge variant="secondary" className="text-xs">{count} items</Badge>
              </button>
            )
          })}
          {cats.length === 0 && (
            <div className="col-span-full rounded-xl border-2 border-dashed p-12 text-center text-muted-foreground">
              No categories yet. Click &quot;New Category&quot; to create your first one.
            </div>
          )}
        </div>

        {/* Create Category Dialog */}
        <Dialog open={addCatOpen} onOpenChange={setAddCatOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
              <DialogDescription>Add a new menu category like &quot;Pizza&quot;, &quot;Drinks&quot;, etc.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Category Name *</Label><Input value={fNewCatName} onChange={e => setFNewCatName(e.target.value)} placeholder="e.g. Pizza" autoFocus onKeyDown={e => { if (e.key === "Enter") handleCreateCategory() }} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddCatOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCategory}>Create & Add Items</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modifier Groups Dialog */}
        <Dialog open={addModOpen} onOpenChange={setAddModOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier Groups</DialogTitle>
              <DialogDescription>Create groups like &quot;Size&quot;, &quot;Toppings&quot;, &quot;Sauce&quot; etc. Then assign them to menu items.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <Label className="text-xs">New Group</Label>
                <div className="flex gap-2">
                  <Input placeholder="Group name (e.g. Extra Toppings)" value={fGroupName} onChange={e => setFGroupName(e.target.value)} className="flex-1" />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={fGroupRequired} onChange={e => { setFGroupRequired(e.target.checked); if (e.target.checked) setFGroupMin("1") }} /> Required</label>
                  <div className="flex items-center gap-1"><Label className="text-xs w-10">Min:</Label><Input type="number" min="0" max="20" value={fGroupMin} onChange={e => setFGroupMin(e.target.value)} className="h-7 w-16 text-xs" /></div>
                  <div className="flex items-center gap-1"><Label className="text-xs w-10">Max:</Label><Input type="number" min="1" max="50" value={fGroupMax} onChange={e => setFGroupMax(e.target.value)} className="h-7 w-16 text-xs" /></div>
                </div>
                <Button size="sm" onClick={handleCreateGroup} disabled={isPending}>Create Group</Button>
              </div>
              {modifierGroups.map(mg => (
                <div key={mg.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{mg.name}</span>
                      <div className="flex gap-1 mt-0.5">
                        <Badge variant={mg.required ? "default" : "secondary"} className="text-[10px]">{mg.required ? `Required (min ${mg.minSelect})` : "Optional"}</Badge>
                        <Badge variant="outline" className="text-[10px]">Max {mg.maxSelect} selects</Badge>
                        <Badge variant="outline" className="text-[10px]">{mg.items.length} options</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteGroup(mg.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {mg.items.map(mod => (
                      <div key={mod.id} className="flex items-center justify-between text-sm py-0.5">
                        <span>{mod.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">{mod.price > 0 ? `+${formatCurrency(mod.price)}` : "Free"}</span>
                          <span className="text-muted-foreground text-[10px]">×{mod.maxQuantity}</span>
                          <button onClick={() => handleDeleteModifier(mod.id)} className="text-destructive text-xs hover:underline">✕</button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => { setEditGroup(mg); setAddModItemOpen(true) }} className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"><Plus className="h-3 w-3" /> Add option</button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Modifier Option Dialog */}
        <Dialog open={addModItemOpen} onOpenChange={setAddModItemOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Add to &quot;{editGroup?.name}&quot;</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={fModName} onChange={e => setFModName(e.target.value)} placeholder="e.g. Extra Cheese" /></div>
              <div><Label>Extra Price ($)</Label><Input type="number" step="0.01" value={fModPrice} onChange={e => setFModPrice(e.target.value)} placeholder="0" /></div>
              <div><Label>Max Quantity</Label><Input type="number" min="1" max="50" value={fModMaxQty} onChange={e => setFModMaxQty(e.target.value)} placeholder="1" /><p className="text-[10px] text-muted-foreground mt-0.5">How many times this option can be selected (e.g. 5 for Extra Cheese x5)</p></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddModItemOpen(false)}>Cancel</Button>
              <Button onClick={handleAddModifier} disabled={isPending}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // === ITEMS VIEW ===
  if (view === "items") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView("categories")}><ArrowLeft className="h-5 w-5" /></Button>
          <h2 className="text-xl font-bold">{selectedCategory}</h2>
          <Badge variant="secondary">{catItems.length} items</Badge>
          <div className="ml-auto"><Button size="sm" onClick={() => { reset(); setFCategory(selectedCategory); setAddOpen(true) }}><Plus className="mr-1 h-4 w-4" /> Add Item</Button></div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {catItems.map(item => (
            <div key={item.id} className="rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="h-36 w-full object-cover" />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-muted text-3xl">
                  {categoryEmoji[item.category] || "🍽"}
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-lg font-bold text-[hsl(24,95%,53%)]">{formatCurrency(item.price)}</p>
                    {item.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>}
                  </div>
                  <Badge variant={item.isAvailable ? "default" : "destructive"} className="text-[10px]">{item.isAvailable ? "Active" : "Hidden"}</Badge>
                </div>
                {item.modifierGroups.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.modifierGroups.map(({ modifierGroup: mg }) => (
                      <Badge key={mg.id} variant="outline" className="text-[10px]">{mg.name} ({mg.items.length})</Badge>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                    setFName(item.name); setFDesc(item.description || ""); setFPrice(String(item.price)); setFCategory(item.category); setFImageUrl(item.imageUrl || null)
                    setFModGroupIds(item.modifierGroups.map(mg => mg.modifierGroup.id))
                    setEditItem(item)
                  }}><Pencil className="mr-1 h-3 w-3" /> Edit</Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => setDeleteItem(item)}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                </div>
              </div>
            </div>
          ))}
          {catItems.length === 0 && (
            <div className="col-span-full rounded-xl border-2 border-dashed p-12 text-center text-muted-foreground">
              No items in this category yet. Add your first item!
            </div>
          )}
        </div>

        {/* Add Item Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <ImageUpload value={fImageUrl} onChange={setFImageUrl} />
              <div>
                <Label>Category *</Label>
                <Select value={fCategory || selectedCategory} onValueChange={v => setFCategory(v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    {fCategory && !cats.includes(fCategory) && <SelectItem value={fCategory}>{fCategory} (new)</SelectItem>}
                  </SelectContent>
                </Select>
                <Input className="mt-2" value={fCategory || selectedCategory} onChange={e => setFCategory(e.target.value)} placeholder="Or type a new category name" />
              </div>
              <div><Label>Name *</Label><Input value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. Margherita" /></div>
              <div><Label>Description</Label><Textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={2} placeholder="Brief description..." /></div>
              <div><Label>Price *</Label><Input type="number" step="0.01" value={fPrice} onChange={e => setFPrice(e.target.value)} placeholder="0.00" /></div>
              {modifierGroups.length > 0 && (
                <div>
                  <Label>Assign Modifier Groups</Label>
                  <p className="text-xs text-muted-foreground mb-1">Select which modifier groups this item should have</p>
                  <div className="space-y-1">
                    {modifierGroups.map(mg => (
                      <label key={mg.id} className={`flex items-center gap-2 rounded-lg border p-2 text-sm cursor-pointer transition ${fModGroupIds.includes(mg.id) ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                        <input type="checkbox" checked={fModGroupIds.includes(mg.id)} onChange={() => setFModGroupIds(prev => prev.includes(mg.id) ? prev.filter(id => id !== mg.id) : [...prev, mg.id])} className="rounded" />
                        <span className="flex-1">{mg.name}</span>
                        <span className="text-xs text-muted-foreground">{mg.required ? "Required" : "Optional"} · Max {mg.maxSelect}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateItem} disabled={isPending}>{isPending ? "..." : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={!!editItem} onOpenChange={o => { if (!o) { setEditItem(null); reset() } }}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit {editItem?.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <ImageUpload value={fImageUrl} onChange={setFImageUrl} />
              <div>
                <Label>Category</Label>
                <Select value={fCategory || editItem?.category || ""} onValueChange={v => setFCategory(v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    {fCategory && !cats.includes(fCategory) && <SelectItem value={fCategory}>{fCategory}</SelectItem>}
                  </SelectContent>
                </Select>
                <Input className="mt-2" value={fCategory} onChange={e => setFCategory(e.target.value)} placeholder="Or type a category name" />
              </div>
              <div><Label>Name</Label><Input value={fName} onChange={e => setFName(e.target.value)} /></div>
              <div><Label>Description</Label><Textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={2} /></div>
              <div><Label>Price</Label><Input type="number" step="0.01" value={fPrice} onChange={e => setFPrice(e.target.value)} /></div>
              {modifierGroups.length > 0 && (
                <div>
                  <Label>Modifier Groups</Label>
                  <div className="space-y-1 mt-1">
                    {modifierGroups.map(mg => (
                      <label key={mg.id} className={`flex items-center gap-2 rounded-lg border p-2 text-sm cursor-pointer transition ${fModGroupIds.includes(mg.id) ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                        <input type="checkbox" checked={fModGroupIds.includes(mg.id)} onChange={() => setFModGroupIds(prev => prev.includes(mg.id) ? prev.filter(id => id !== mg.id) : [...prev, mg.id])} className="rounded" />
                        <span className="flex-1">{mg.name}</span>
                        <span className="text-xs text-muted-foreground">{mg.required ? "Required" : "Optional"} · Max {mg.maxSelect}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditItem(null); reset() }}>Cancel</Button>
              <Button onClick={handleUpdateItem} disabled={isPending}>{isPending ? "..." : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteItem} onOpenChange={o => { if (!o) setDeleteItem(null) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete &quot;{deleteItem?.name}&quot;?</DialogTitle><DialogDescription>This cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteItem} disabled={isPending}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return null
}
