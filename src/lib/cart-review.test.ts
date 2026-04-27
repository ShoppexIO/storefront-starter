import { describe, expect, it } from "vitest";
import type { CartItem, Product } from "@shoppexio/storefront";
import { reviewCartItems } from "@/lib/cart-review";

function product(overrides: Partial<Product> = {}): Product {
  return {
    uniqid: "product_1",
    title: "Test Product",
    slug: "test-product",
    price: 1000,
    price_display: 1000,
    currency: "USD",
    stock: 10,
    variants: [],
    price_variants: [],
    ...overrides,
  } as Product;
}

function cartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    product_id: "product_1",
    variant_id: "default",
    quantity: 1,
    price_data: { unit_price: 1000 },
    ...overrides,
  };
}

describe("reviewCartItems", () => {
  it("removes products that no longer exist", () => {
    const review = reviewCartItems([cartItem()], []);

    expect(review.blockingIssues).toHaveLength(1);
    expect(review.blockingIssues[0]?.kind).toBe("missing-product");
    expect(review.blockingIssues[0]?.action).toBe("remove");
  });

  it("reduces quantity when stock drops below cart quantity", () => {
    const review = reviewCartItems(
      [cartItem({ quantity: 5 })],
      [product({ stock: 2 })],
    );

    expect(review.blockingIssues).toHaveLength(1);
    expect(review.blockingIssues[0]?.kind).toBe("above-maximum");
    expect(review.blockingIssues[0]?.action).toBe("update");
    expect(review.blockingIssues[0]?.nextQuantity).toBe(2);
  });

  it("removes items when stock drops below the minimum quantity", () => {
    const review = reviewCartItems(
      [cartItem({ quantity: 1 })],
      [product({ stock: 2, quantity_min: 3 })],
    );

    expect(review.blockingIssues).toHaveLength(1);
    expect(review.blockingIssues[0]?.kind).toBe("above-maximum");
    expect(review.blockingIssues[0]?.action).toBe("remove");
    expect(review.blockingIssues[0]?.nextQuantity).toBeUndefined();
  });

  it("removes sold-out products", () => {
    const review = reviewCartItems([cartItem()], [product({ stock: 0 })]);

    expect(review.blockingIssues).toHaveLength(1);
    expect(review.blockingIssues[0]?.kind).toBe("sold-out");
    expect(review.blockingIssues[0]?.action).toBe("remove");
  });

  it("removes default cart items when the product now requires a variant", () => {
    const review = reviewCartItems(
      [cartItem()],
      [product({
        variants: [{ id: "premium", title: "Premium", price: 1200, stock: 5 }],
      })],
    );

    expect(review.blockingIssues).toHaveLength(1);
    expect(review.blockingIssues[0]?.kind).toBe("missing-option");
    expect(review.blockingIssues[0]?.action).toBe("remove");
  });

  it("records price changes as a notice", () => {
    const review = reviewCartItems(
      [cartItem({ price_data: { unit_price: 1000 } })],
      [product({ price: "1200", price_display: "1200" })],
    );

    expect(review.blockingIssues).toHaveLength(0);
    expect(review.issues).toHaveLength(1);
    expect(review.issues[0]?.kind).toBe("price-changed");
    expect(review.issues[0]?.action).toBe("notice");
    expect(review.issues[0]?.nextUnitPrice).toBe(1200);
  });
});
