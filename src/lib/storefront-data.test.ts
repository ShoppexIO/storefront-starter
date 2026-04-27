import { describe, expect, it, vi } from "vitest";
import type { Product, Shop } from "@shoppexio/storefront";
import { loadStorefrontData } from "@/lib/storefront-data";

const mocks = vi.hoisted(() => ({
  getStorefront: vi.fn(),
}));

vi.mock("@/lib/shoppex-client", () => ({
  getShoppexClient: () => ({
    getStorefront: mocks.getStorefront,
  }),
}));

vi.mock("@/lib/sample-storefront", () => ({
  isSampleStorefrontEnabled: () => false,
  sampleProducts: [],
  sampleShop: null,
  getSampleProduct: () => null,
}));

function product(index: number): Product {
  return {
    uniqid: `product_${index}`,
    title: `Product ${index}`,
    slug: `product-${index}`,
    price: "1000",
    price_display: "1000",
    currency: "USD",
    stock: 10,
    variants: [],
    price_variants: [],
    images: [],
  } as Product;
}

describe("loadStorefrontData", () => {
  it("keeps the full product list for cart validation", async () => {
    const products = Array.from({ length: 30 }, (_, index) => product(index));
    mocks.getStorefront.mockResolvedValue({
      success: true,
      data: {
        shop: { id: "shop_1", name: "Test Shop", slug: "test-shop" } as Shop,
        products,
      },
    });

    const result = await loadStorefrontData();

    expect(result.success).toBe(true);
    expect(result.success ? result.products : []).toHaveLength(30);
  });
});
