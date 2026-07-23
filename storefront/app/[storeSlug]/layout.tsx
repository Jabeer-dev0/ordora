import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getStoreBySlug } from "@/lib/store"
import "../globals.css"

export const revalidate = 60

type Props = { params: Promise<{ storeSlug: string }>; children: React.ReactNode }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug } = await params
  const store = await getStoreBySlug(storeSlug)
  if (!store) return { title: "Store not found" }
  return {
    title: `${store.name} | Order online`,
    description: "Order online for collection or delivery",
    icons: {
      icon: store.tenant?.logoUrl || "https://pub-31a5979cb6eca0d06a2ee0cb849292d5.r2.dev/ordora/chesters/chesters-logo.png",
      apple: "https://pub-31a5979cb6eca0d06a2ee0cb849292d5.r2.dev/ordora/chesters/apple-touch-icon.png",
      other: [
        { rel: "icon", type: "image/png", sizes: "16x16", url: "https://pub-31a5979cb6eca0d06a2ee0cb849292d5.r2.dev/ordora/chesters/favicon-16x16.png" },
        { rel: "icon", type: "image/png", sizes: "32x32", url: "https://pub-31a5979cb6eca0d06a2ee0cb849292d5.r2.dev/ordora/chesters/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "48x48", url: "https://pub-31a5979cb6eca0d06a2ee0cb849292d5.r2.dev/ordora/chesters/favicon-48x48.png" },
        { rel: "icon", type: "image/png", sizes: "192x192", url: "https://pub-31a5979cb6eca0d06a2ee0cb849292d5.r2.dev/ordora/chesters/android-chrome-192x192.png" },
        { rel: "icon", type: "image/png", sizes: "512x512", url: "https://pub-31a5979cb6eca0d06a2ee0cb849292d5.r2.dev/ordora/chesters/android-chrome-512x512.png" },
      ],
    },
    manifest: undefined,
  }
}

export default async function StoreLayout({ params, children }: Props) {
  const { storeSlug } = await params
  const store = await getStoreBySlug(storeSlug)
  if (!store || !store.isActive) notFound()

  const brandColor = store.brandColor || "23"
  const accentColor = store.accentColor || "207"

  function toBrand(raw: string) {
    if (raw.startsWith("#") || raw.startsWith("rgb")) return raw
    if (raw.includes("%") || raw.includes("hsl")) return raw.startsWith("hsl") ? raw : `hsl(${raw})`
    return `hsl(${raw}, 91%, 54%)`
  }
  function toAccent(raw: string) {
    if (raw.startsWith("#") || raw.startsWith("rgb")) return raw
    if (raw.includes("%") || raw.includes("hsl")) return raw.startsWith("hsl") ? raw : `hsl(${raw})`
    return `hsl(${raw}, 90%, 48%)`
  }

  const brandCSS = toBrand(brandColor)
  const accentCSS = toAccent(accentColor)

  const style = {
    "--font-sans": '"Lato", "Lato Fallback", sans-serif',
    "--font-display": '"Archivo Black", "Arial Black", sans-serif',
    "--font-body-serif": '"Source Serif 4", Georgia, serif',
    "--brand": brandCSS,
    "--brand-rgb": "224, 115, 51",
    "--accent": accentCSS,
    "--accent-rgb": "37, 149, 213",
    "--brand-soft": "rgb(224 115 51 / 0.1)",
    "--background": "36 26% 94%",
    "--foreground": "222 70% 14%",
    "--card": "40 40% 99%",
    "--card-foreground": "222 70% 14%",
    "--muted": "38 30% 96%",
    "--muted-foreground": "230 9% 51%",
    "--border": "222 30% 90%",
    "--input": "222 20% 88%",
    "--ring": brandCSS,
    "--radius": "1rem",
    "--ink": "222 70% 14%",
    "--ink-2": "221 78% 23%",
    "--cream": "36 26% 94%",
    "--surface": "40 40% 99%",
    "--theme-ink": "#141414",
    "--theme-ink-foreground": "#faf6f0",
    "--paper": "#faf6f0",
    "--paper-2": "#f1e9de",
    "--line": "#e3d8c8",
    "--gold": "#b8862f",
    "--radius-card": "1.625rem",
    "--radius-card-lg": "2.125rem",
    "--shadow-card": "0 12px 35px rgba(11, 30, 76, 0.10)",
    "--shadow-card-lg": "0 24px 70px rgba(11, 30, 76, 0.12)",
  } as React.CSSProperties

  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Lato:wght@300;400;700;900&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen font-sans antialiased" style={style} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
