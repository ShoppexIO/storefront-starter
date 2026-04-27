"use client";

import { shoppex } from "@shoppexio/storefront";
import { shoppexConfig } from "@/lib/shoppex-config";

let initialized = false;

export function getShoppexClient() {
  if (!initialized) {
    shoppex.init(shoppexConfig.shopSlug, {
      apiBaseUrl: shoppexConfig.apiBaseUrl,
      checkoutBaseUrl: shoppexConfig.checkoutBaseUrl,
    });
    initialized = true;
  }

  return shoppex;
}
