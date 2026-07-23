import { storefrontApi } from "./api";

export interface StorefrontStore {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  postcode: string | null;
  brandColor: string | null;
  accentColor: string | null;
  tagline: string | null;
  heroImageUrl: string | null;
  description: string | null;
  isActive: boolean;
  acceptingOrders: boolean;
  closedUntil?: string | null;
  tenant?: { logoUrl: string | null } | null;
}

export async function getStoreBySlug(slug: string): Promise<StorefrontStore | null> {
  try {
    const { store } = await storefrontApi.store(slug);
    if (!store) return null;
    return {
      ...store,
      tenant: store.tenantLogoUrl ? { logoUrl: store.tenantLogoUrl } : null,
    };
  } catch {
    return null;
  }
}
