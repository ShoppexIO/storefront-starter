export type CheckoutMode = "cart" | "buy-now" | "embed";
export type CustomerPortalMode = "managed-domain" | "external-url" | "branded-subdomain";

export type StorefrontConfig = {
  shopSlug: string;
  checkoutMode: CheckoutMode;
  showStockCount: boolean;
  sampleData: {
    enabled: boolean;
  };
  apiBaseUrl: string;
  checkoutBaseUrl: string;
  customerPortal: {
    mode: CustomerPortalMode;
    url: string;
  };
};

export const shoppexConfig: StorefrontConfig = {
  shopSlug: process.env.NEXT_PUBLIC_SHOPPEX_SHOP_SLUG ?? "demo",
  checkoutMode: "cart",
  showStockCount: true,
  sampleData: {
    enabled:
      process.env.NEXT_PUBLIC_SHOPPEX_USE_SAMPLE_DATA === "true" ||
      (process.env.NEXT_PUBLIC_SHOPPEX_USE_SAMPLE_DATA !== "false" &&
        (process.env.NEXT_PUBLIC_SHOPPEX_SHOP_SLUG ?? "demo") === "demo"),
  },
  apiBaseUrl: process.env.NEXT_PUBLIC_SHOPPEX_API_URL ?? "https://api.shoppex.io",
  checkoutBaseUrl: process.env.NEXT_PUBLIC_SHOPPEX_CHECKOUT_URL ?? "https://checkout.shoppex.io",
  customerPortal: {
    mode: "external-url",
    url: process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL ?? "https://demo.myshoppex.io/dashboard",
  },
};
