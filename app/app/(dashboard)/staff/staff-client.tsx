"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createStaff, updateStaffRole, removeStaff } from "@/lib/actions/staff"
import { Button } from "@ordora/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ordora/shared/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ordora/shared/components/ui/select"
import { Input } from "@ordora/shared/components/ui/input"
import { Label } from "@ordora/shared/components/ui/label"
import { Badge } from "@ordora/shared/components/ui/badge"
import { Card, CardContent } from "@ordora/shared/components/ui/card"
import { Plus, Pencil, Trash2 } from "lucide-react"

interface StaffMember {
  id: string
  name: string
  role: string
  email: string
  phone: string
  isActive: boolean
  createdAt: string
}

interface StaffClientProps {
  staff: StaffMember[]
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function StaffClient({ staff }: StaffClientProps) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ name: "", role: "WAITER", email: "", phone: "" })

  function resetForm() {
    setForm({ name: "", role: "WAITER", email: "", phone: "" })
  }

  function openAdd() {
    resetForm()
    setAddOpen(true)
  }

  function openEdit(member: StaffMember) {
    setSelected(member)
    setForm({ name: member.name, role: member.role, email: member.email, phone: member.phone })
    setEditOpen(true)
  }

  function openDelete(member: StaffMember) {
    setSelected(member)
    setDeleteOpen(true)
  }

  async function handleCreate() {
    if (!form.name || !form.email) {
      toast.error("Name and email are required")
      return
    }
    setLoading(true)
    try {
      await createStaff(form)
      toast.success("Staff member added")
      setAddOpen(false)
      resetForm()
      router.refresh()
    } catch {
      toast.error("Failed to add staff member")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    if (!selected) return
    setLoading(true)
    try {
      await updateStaffRole(selected.id, form.role)
      toast.success("Staff member updated")
      setEditOpen(false)
      router.refresh()
    } catch {
      toast.error("Failed to update staff member")
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    if (!selected) return
    setLoading(true)
    try {
      await removeStaff(selected.id)
      toast.success("Staff member removed")
      setDeleteOpen(false)
      router.refresh()
    } catch {
      toast.error("Failed to remove staff member")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No staff members yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                    {getInitials(member.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{member.role}</Badge>
                  <Badge variant={member.isActive ? "default" : "outline"}>
                    {member.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {member.phone && (
                  <p className="text-sm text-muted-foreground">{member.phone}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => openEdit(member)}>
                    <Pencil className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => openDelete(member)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="CHEF">Chef</SelectItem>
                  <SelectItem value="WAITER">Waiter</SelectItem>
                  <SelectItem value="CASHIER">Cashier</SelectItem>
                  <SelectItem value="HOST">Host</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full">
              {loading ? "Adding..." : "Add Staff"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="CHEF">Chef</SelectItem>
                  <SelectItem value="WAITER">Waiter</SelectItem>
                  <SelectItem value="CASHIER">Cashier</SelectItem>
                  <SelectItem value="HOST">Host</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdate} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Staff Member</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to remove <strong>{selected?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={loading}>
              {loading ? "Removing..." : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
