import type { Metadata } from "next"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"

export const metadata: Metadata = {
  title: "Business Hub | Ordora",
  description: "Manage your restaurant with Ordora",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
