import { describe, expect, it } from "vitest";
import type { Product } from "@shoppexio/storefront";
import { getMaxSelectableQuantity, getProductOptions, getQuantityBounds, getVariant } from "@/lib/product-utils";

function product(overrides: Partial<Product> = {}): Product {
  return {
    uniqid: "product_1",
    title: "Test Product",
    slug: "test-product",
    price: 1000,
    price_display: 1000,
    currency: "USD",
    stock: -1,
    variants: [],
    price_variants: [],
    images: [],
    ...overrides,
  } as Product;
}

describe("product-utils", () => {
  it("uses price variants as storefront options when legacy variants are absent", () => {
    const options = getProductOptions(product({
      price_variants: [
        { id: "monthly", title: "Monthly", price: 999, quantity_max: 2 } as never,
        { id: "lifetime", label: "Lifetime", price: 4999 },
      ],
    }));

    expect(options).toEqual([
      expect.objectContaining({ id: "monthly", title: "Monthly", price: 999, quantity_max: 2 }),
      expect.objectContaining({ id: "lifetime", title: "Lifetime", price: 4999 }),
    ]);
  });

  it("resolves quantity bounds from price variant options", () => {
    const item = product({
      price_variants: [
        { id: "team", title: "Team", price: 1999, quantity_min: 2, quantity_max: 4 } as never,
      ],
    });

    expect(getVariant(item, "team")).toEqual(expect.objectContaining({ id: "team", title: "Team" }));
    expect(getQuantityBounds(item, "team")).toEqual({ min: 2, max: 4 });
  });

  it("preserves price variant quantity bounds when variants are prefilled", () => {
    const item = product({
      quantity_min: 1,
      quantity_max: 10,
      variants: [
        { id: "team", title: "Team", price: 1999 },
      ],
      price_variants: [
        { id: "team", title: "Team", price: 1999, stock: 3, quantity_min: 2, quantity_max: 4 } as never,
      ],
    });

    expect(getVariant(item, "team")).toEqual(expect.objectContaining({ id: "team", stock: 3 }));
    expect(getQuantityBounds(item, "team")).toEqual({ min: 2, max: 4 });
  });

  it("caps selectable quantity by finite stock and quantity maximum", () => {
    expect(getMaxSelectableQuantity(product({ stock: 2, quantity_max: 10 }))).toBe(2);
    expect(getMaxSelectableQuantity(product({ stock: 20, quantity_max: 10 }))).toBe(10);
    expect(getMaxSelectableQuantity(product({ stock: -1, quantity_max: 10 }))).toBe(10);
    expect(getMaxSelectableQuantity(product({ stock: -1, quantity_max: -1 }))).toBe(Number.POSITIVE_INFINITY);
  });
});
