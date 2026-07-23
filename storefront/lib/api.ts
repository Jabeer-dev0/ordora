// Public client for the Ordora backend (Express + Supabase).
const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

async function getJSON(path: string) {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const storefrontApi = {
  listStores: () => getJSON(`/api/storefront/stores`),
  store: (slug: string) => getJSON(`/api/storefront/${slug}`),
  openingHours: (slug: string) => getJSON(`/api/storefront/${slug}/opening-hours`),
  banners: (slug: string) => getJSON(`/api/storefront/${slug}/banners`),
  menu: (slug: string) => getJSON(`/api/storefront/${slug}/menu`),

  // Place an online order (cash) via the public orders endpoint.
  createOrder: async (payload: any) => {
    const res = await fetch(`${BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Order failed: ${res.status}`);
    }
    return res.json();
  },
};

export const API_BASE = BASE;
