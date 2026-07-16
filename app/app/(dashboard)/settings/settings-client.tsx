"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateStoreSettings } from "@/lib/actions/settings"
import { Button } from "@ordora/shared/components/ui/button"
import { Input } from "@ordora/shared/components/ui/input"
import { Label } from "@ordora/shared/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@ordora/shared/components/ui/card"
import { Badge } from "@ordora/shared/components/ui/badge"

interface Store {
  id: string
  name: string
  phone: string
  address: string
}

interface Tenant {
  id: string
  name: string
  plan: string
}

interface SettingsClientProps {
  store: Store | null
  tenant: Tenant | null
}

export function SettingsClient({ store, tenant }: SettingsClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: store?.name || "",
    phone: store?.phone || "",
    address: store?.address || "",
  })

  async function handleSave() {
    if (!store) return
    setLoading(true)
    try {
      await updateStoreSettings(form)
      toast.success("Settings saved")
      router.refresh()
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your store and account settings</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {tenant && (
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <p className="text-lg font-medium">{tenant.plan}</p>
                <Badge variant="secondary">Active</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
