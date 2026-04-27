import type { CartItem, Product } from "@shoppexio/storefront";
import {
  DEFAULT_VARIANT_ID,
  getAvailableStock,
  getCartLineKey,
  getQuantityBounds,
  getUnitPrice,
  getVariant,
  isSoldOut,
  isUnlimitedStock,
} from "@/lib/product-utils";

export type CartIssueKind =
  | "missing-product"
  | "missing-option"
  | "sold-out"
  | "below-minimum"
  | "above-maximum"
  | "price-changed";

export type CartIssue = {
  key: string;
  kind: CartIssueKind;
  item: CartItem;
  product: Product | null;
  message: string;
  action: "remove" | "update" | "notice";
  nextQuantity?: number;
  nextUnitPrice?: number;
};

export type CartReview = {
  issues: CartIssue[];
  blockingIssues: CartIssue[];
};

function hasProductOption(product: Product, variantId: string): boolean {
  const variants = product.variants ?? [];
  const priceVariants = product.price_variants ?? [];

  if (!variantId) {
    return variants.length === 0 && priceVariants.length === 0;
  }

  if (variantId === DEFAULT_VARIANT_ID) {
    return variants.length === 0 && priceVariants.length === 0;
  }

  return Boolean(
    getVariant(product, variantId) ??
      priceVariants.find((entry) => entry.id === variantId),
  );
}

function getMaximumQuantity(product: Product, variantId: string): number {
  const bounds = getQuantityBounds(product, variantId);
  const stock = getAvailableStock(product, variantId);
  const candidates = [
    bounds.max > 0 ? bounds.max : null,
    isUnlimitedStock(stock) ? null : stock,
  ].filter((value): value is number => typeof value === "number" && value >= 0);

  return candidates.length > 0 ? Math.min(...candidates) : -1;
}

export function reviewCartItems(items: CartItem[], products: Product[]): CartReview {
  const productMap = new Map(products.map((product) => [product.uniqid, product]));
  const issues: CartIssue[] = [];

  for (const item of items) {
    const key = getCartLineKey(item);
    const product = productMap.get(item.product_id) ?? null;

    if (!product) {
      issues.push({
        key,
        kind: "missing-product",
        item,
        product: null,
        message: "This product is no longer available.",
        action: "remove",
      });
      continue;
    }

    const variantId = item.price_variant_id ?? item.variant_id;

    if (!hasProductOption(product, variantId)) {
      issues.push({
        key,
        kind: "missing-option",
        item,
        product,
        message: "This option is no longer available.",
        action: "remove",
      });
      continue;
    }

    if (isSoldOut(product, variantId)) {
      issues.push({
        key,
        kind: "sold-out",
        item,
        product,
        message: "This item is now sold out.",
        action: "remove",
      });
      continue;
    }

    const bounds = getQuantityBounds(product, variantId);
    const maximumQuantity = getMaximumQuantity(product, variantId);
    if (maximumQuantity >= 0 && maximumQuantity < bounds.min) {
      issues.push({
        key,
        kind: "above-maximum",
        item,
        product,
        message: `Only ${maximumQuantity} can be purchased right now, which is below the minimum quantity of ${bounds.min}.`,
        action: "remove",
      });
      continue;
    }

    if (item.quantity < bounds.min) {
      issues.push({
        key,
        kind: "below-minimum",
        item,
        product,
        message: `Minimum quantity is ${bounds.min}.`,
        action: "update",
        nextQuantity: bounds.min,
      });
      continue;
    }

    if (maximumQuantity >= 0 && item.quantity > maximumQuantity) {
      issues.push({
        key,
        kind: "above-maximum",
        item,
        product,
        message: `Only ${maximumQuantity} can be purchased right now.`,
        action: maximumQuantity > 0 ? "update" : "remove",
        nextQuantity: maximumQuantity > 0 ? maximumQuantity : undefined,
      });
      continue;
    }

    const currentUnitPrice = getUnitPrice(product, variantId);
    const previousUnitPrice = item.price_data?.unit_price;
    if (typeof previousUnitPrice === "number" && previousUnitPrice !== currentUnitPrice) {
      issues.push({
        key,
        kind: "price-changed",
        item,
        product,
        message: "The price changed since this item was added.",
        action: "notice",
        nextUnitPrice: currentUnitPrice,
      });
    }
  }

  const blockingIssues = issues.filter((issue) => issue.action !== "notice");
  return { issues, blockingIssues };
}

export function getCartIssueMap(review: CartReview): Map<string, CartIssue> {
  return new Map(review.issues.map((issue) => [issue.key, issue]));
}
