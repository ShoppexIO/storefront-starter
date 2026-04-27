import { shoppexConfig } from "../../shoppex.config";
export { shoppexConfig };
export type { CheckoutMode, CustomerPortalMode, StorefrontConfig } from "../../shoppex.config";

export function getCustomerPortalHref(): string {
  return shoppexConfig.customerPortal.url;
}
