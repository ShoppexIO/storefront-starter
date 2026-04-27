import type { Product, Shop } from "@shoppexio/storefront";
import { shoppexConfig } from "@/lib/shoppex-config";

export const sampleShop: Shop = {
  id: "sample_shop",
  name: "Neon Supply",
  slug: "demo",
  description: "Sample digital goods storefront powered by Shoppex.",
  currency: "USD",
  cart_enabled: true,
  hide_out_of_stock: false,
  hide_stock_counter: false,
};

export const sampleProducts: Product[] = [
  {
    uniqid: "sample_access_pass",
    title: "Access Pass",
    slug: "access-pass",
    description: "A premium membership pass with instant delivery after checkout.",
    price: "39",
    price_display: "39",
    currency: "USD",
    stock: 18,
    quantity_min: 1,
    quantity_max: 4,
    images: [{
      id: "sample_access_pass_image",
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      alt: "Abstract neon gradient",
    }],
    cdn_image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    variants: [
      { id: "standard", title: "Standard", price: 39, stock: 18 },
      { id: "priority", title: "Priority", price: 59, stock: 6 },
    ],
    product_highlights: ["Instant delivery", "Customer portal access", "Stock checked at checkout"],
  },
  {
    uniqid: "sample_launch_bundle",
    title: "Launch Bundle",
    slug: "launch-bundle",
    description: "A starter bundle for digital sellers with files, licenses, and updates.",
    price: "79",
    price_display: "79",
    currency: "USD",
    stock: 9,
    quantity_min: 1,
    quantity_max: 2,
    images: [{
      id: "sample_launch_bundle_image",
      url: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?auto=format&fit=crop&w=1200&q=80",
      alt: "Colorful abstract mesh",
    }],
    cdn_image_url: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?auto=format&fit=crop&w=1200&q=80",
    product_highlights: ["License delivery", "Download access", "Webhook-ready fulfillment"],
  },
  {
    uniqid: "sample_limited_drop",
    title: "Limited Drop",
    slug: "limited-drop",
    description: "A low-stock example product for testing sold-out and stock-count states.",
    price: "129",
    price_display: "129",
    currency: "USD",
    stock: 2,
    quantity_min: 1,
    quantity_max: 1,
    images: [{
      id: "sample_limited_drop_image",
      url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
      alt: "Arcade controls",
    }],
    cdn_image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    product_highlights: ["Low stock", "Quantity limited", "Checkout validation"],
  },
];

export function isSampleStorefrontEnabled(): boolean {
  return shoppexConfig.sampleData.enabled;
}

export function getSampleProduct(slugOrId: string): Product | null {
  return sampleProducts.find((product) => (
    product.slug === slugOrId || product.uniqid === slugOrId
  )) ?? null;
}
