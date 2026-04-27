import type { CartItem, PriceVariant, Product, ProductVariant } from "@shoppexio/storefront";

export const DEFAULT_VARIANT_ID = "default";

type ProductWithExtendedImages = Product & {
  detail_image_url?: string | null;
};

type VariantWithQuantityBounds = ProductVariant & {
  quantity_min?: number;
  quantity_max?: number;
  quantityMin?: number;
  quantityMax?: number;
};

type PriceVariantWithStock = PriceVariant & {
  stock?: number;
  quantity_min?: number;
  quantity_max?: number;
  quantityMin?: number;
  quantityMax?: number;
};

export function getProductHref(product: Product): string {
  return `/products/${encodeURIComponent(product.slug ?? product.uniqid)}`;
}

export function getProductImage(product: Product | null | undefined): string | null {
  if (!product) return null;
  const productWithImages = product as ProductWithExtendedImages;
  return (
    productWithImages.detail_image_url ??
    product.cdn_image_url ??
    product.images?.[0]?.url ??
    null
  );
}

export function getVariantId(product: Product, selectedVariantId?: string | null): string {
  if (selectedVariantId) return selectedVariantId;
  return getProductOptions(product)[0]?.id ?? DEFAULT_VARIANT_ID;
}

function priceVariantToProductOption(variant: PriceVariantWithStock): VariantWithQuantityBounds {
  return {
    id: variant.id,
    title: variant.title ?? variant.label ?? "Option",
    price: typeof variant.price === "number" ? variant.price : Number(variant.price) || 0,
    stock: typeof variant.stock === "number" ? variant.stock : undefined,
    quantity_min: variant.quantity_min,
    quantity_max: variant.quantity_max,
    quantityMin: variant.quantityMin,
    quantityMax: variant.quantityMax,
  };
}

export function getProductOptions(product: Product): ProductVariant[] {
  if (product.variants && product.variants.length > 0) {
    return product.variants;
  }

  return (product.price_variants ?? []).map((variant) =>
    priceVariantToProductOption(variant as PriceVariantWithStock)
  );
}

export function getVariant(product: Product, variantId?: string | null): ProductVariant | null {
  if (!variantId || variantId === DEFAULT_VARIANT_ID) return null;
  return getProductOptions(product).find((variant) => variant.id === variantId) ?? null;
}

export function getUnitPrice(product: Product, variantId?: string | null): number {
  const variant = getVariant(product, variantId);
  if (typeof variant?.price === "number") {
    return variant.price;
  }

  const priceVariant = product.price_variants?.find((entry) => entry.id === variantId);
  if (typeof priceVariant?.price === "number") {
    return priceVariant.price;
  }

  return Number(product.price_display ?? product.price ?? 0) || 0;
}

export function getCurrency(product: Product | null | undefined, fallback = "USD"): string {
  return product?.currency ?? fallback;
}

export function getAvailableStock(product: Product, variantId?: string | null): number {
  const variant = getVariant(product, variantId);
  if (typeof variant?.stock === "number") {
    return variant.stock;
  }
  if (typeof product.stock === "number") {
    return product.stock;
  }
  return -1;
}

export function isUnlimitedStock(stock: number): boolean {
  return stock < 0 || stock >= 999999;
}

export function isSoldOut(product: Product, variantId?: string | null): boolean {
  const stock = getAvailableStock(product, variantId);
  return !isUnlimitedStock(stock) && stock <= 0;
}

export function getQuantityBounds(product: Product, variantId?: string | null): { min: number; max: number } {
  const variant = getVariant(product, variantId) as VariantWithQuantityBounds | null;
  const min = Number(
    variant?.quantity_min ??
    variant?.quantityMin ??
    product.quantity_min ??
    product.min_quantity ??
    1,
  );
  const max = Number(
    variant?.quantity_max ??
    variant?.quantityMax ??
    product.quantity_max ??
    product.max_quantity ??
    -1,
  );

  return {
    min: Number.isFinite(min) && min > 0 ? Math.floor(min) : 1,
    max: Number.isFinite(max) && max > 0 ? Math.floor(max) : -1,
  };
}

export function formatStockLabel(product: Product, variantId?: string | null): string {
  const stock = getAvailableStock(product, variantId);
  if (isUnlimitedStock(stock)) return "In stock";
  if (stock <= 0) return "Sold out";
  if (stock === 1) return "1 left";
  return `${stock} left`;
}

export function isRecoverableCartError(message: string | null | undefined): boolean {
  const normalized = message?.trim().toLowerCase() ?? "";
  if (!normalized) return false;

  return [
    "product not found",
    "product not available",
    "products are no longer available",
    "outdated product",
    "insufficient stock",
    "selected product option not found",
    "maximum quantity",
    "minimum quantity",
    "cart is outdated",
  ].some((needle) => normalized.includes(needle));
}

export function getCartLineKey(item: CartItem): string {
  return `${item.product_id}:${item.variant_id}:${item.price_variant_id ?? ""}`;
}
