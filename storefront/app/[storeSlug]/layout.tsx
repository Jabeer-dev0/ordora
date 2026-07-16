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
  }
}

export default async function StoreLayout({ params, children }: Props) {
  const { storeSlug } = await params
  const store = await getStoreBySlug(storeSlug)
  if (!store || !store.isActive) notFound()

  const style = {
    "--font-sans": '"Lato", "Lato Fallback", sans-serif',
    "--font-display": '"Archivo Black", "Archivo Black Fallback", sans-serif',
    "--font-body-serif": '"Source Serif 4", "Source Serif 4 Fallback", Georgia, serif',
    "--brand": "hsl(23, 91%, 54%)",
    "--brand-rgb": "232, 100, 44",
    "--brand-orange": "23 91% 54%",
    "--brand-blue": "207 90% 48%",
    "--background": "36 26% 94%",
    "--foreground": "222 70% 14%",
    "--card": "40 40% 99%",
    "--card-foreground": "222 70% 14%",
    "--primary": "23 91% 54%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "207 90% 48%",
    "--secondary-foreground": "0 0% 100%",
    "--muted": "38 30% 96%",
    "--muted-foreground": "230 9% 51%",
    "--accent": "23 91% 95%",
    "--accent-foreground": "23 80% 38%",
    "--destructive": "2 74% 51%",
    "--destructive-foreground": "0 0% 100%",
    "--border": "222 30% 90%",
    "--input": "222 20% 88%",
    "--ring": "23 91% 54%",
    "--radius": "0.75rem",
    "--ink": "222 80% 15%",
    "--ink-2": "221 78% 23%",
  } as React.CSSProperties

  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Lato:wght@400;700;900&family=Source+Serif+4:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-muted/30 font-sans antialiased" style={style} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
