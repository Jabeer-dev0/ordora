import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = { title: "Ordora Stores" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen bg-paper font-sans antialiased">{children}</body>
    </html>
  )
}
