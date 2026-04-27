"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@shoppexio/storefront";
import { getShoppexClient } from "@/lib/shoppex-client";
import { DEFAULT_VARIANT_ID, getUnitPrice } from "@/lib/product-utils";

const CART_CHANGED_EVENT = "shoppex-starter:cart-changed";

export type CartSnapshot = {
  items: CartItem[];
  totalQuantity: number;
};

function readCart(): CartSnapshot {
  if (typeof window === "undefined") {
    return { items: [], totalQuantity: 0 };
  }

  try {
    const client = getShoppexClient();
    return {
      items: client.getCart(),
      totalQuantity: client.getCartItemCount(),
    };
  } catch {
    return { items: [], totalQuantity: 0 };
  }
}

export function emitCartChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
  }
}

export function useCart() {
  const [snapshot, setSnapshot] = useState<CartSnapshot>(() => readCart());

  useEffect(() => {
    const refresh = () => setSnapshot(readCart());
    refresh();
    window.addEventListener(CART_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const addProduct = useCallback((product: Product, variantId: string, quantity: number) => {
    const client = getShoppexClient();
    const normalizedVariantId = variantId || DEFAULT_VARIANT_ID;
    client.addToCart(product.uniqid, normalizedVariantId, quantity, {
      price_variant_id: normalizedVariantId === DEFAULT_VARIANT_ID ? undefined : normalizedVariantId,
      price_data: {
        unit_price: getUnitPrice(product, normalizedVariantId),
      },
    });
    emitCartChanged();
  }, []);

  const updateQuantity = useCallback((item: CartItem, quantity: number) => {
    const client = getShoppexClient();
    if (quantity <= 0) {
      client.removeFromCart(item.product_id, item.variant_id);
    } else {
      client.updateCartItem(item.product_id, item.variant_id, { quantity });
    }
    emitCartChanged();
  }, []);

  const removeItem = useCallback((item: CartItem) => {
    getShoppexClient().removeFromCart(item.product_id, item.variant_id);
    emitCartChanged();
  }, []);

  const clearCart = useCallback(() => {
    getShoppexClient().clearCart();
    emitCartChanged();
  }, []);

  const refreshCart = useCallback(() => {
    setSnapshot(readCart());
  }, []);

  return useMemo(() => ({
    ...snapshot,
    addProduct,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
  }), [addProduct, clearCart, refreshCart, removeItem, snapshot, updateQuantity]);
}
