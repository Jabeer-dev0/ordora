import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@ordora/shared/components/ui/card"
import { Button } from "@ordora/shared/components/ui/button"
import { Input } from "@ordora/shared/components/ui/input"
import { Label } from "@ordora/shared/components/ui/label"
import { Settings, Shield, CreditCard, AlertTriangle } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Configure your Ordora platform</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10"><Settings className="size-5 text-primary" /></div>
            <div><CardTitle>General</CardTitle><CardDescription>Platform-wide settings</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Platform Name</Label><Input defaultValue="Ordora" /></div>
            <div className="space-y-2"><Label>Support Email</Label><Input defaultValue="support@ordora.com" /></div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10"><CreditCard className="size-5 text-primary" /></div>
            <div><CardTitle>Subscription Plans</CardTitle><CardDescription>Manage plan limits and pricing</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-xl border"><p className="font-medium">Starter</p><p className="text-sm text-muted-foreground">Up to 2 stores</p></div>
            <div className="p-4 rounded-xl border"><p className="font-medium">Professional</p><p className="text-sm text-muted-foreground">Up to 10 stores</p></div>
            <div className="p-4 rounded-xl border"><p className="font-medium">Enterprise</p><p className="text-sm text-muted-foreground">Unlimited stores</p></div>
          </div>
          <Button variant="outline">Edit Plans</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10"><AlertTriangle className="size-5 text-destructive" /></div>
            <div><CardTitle>Danger Zone</CardTitle><CardDescription>Irreversible actions</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Reset Platform Data</Button>
        </CardContent>
      </Card>
    </div>
  )
}