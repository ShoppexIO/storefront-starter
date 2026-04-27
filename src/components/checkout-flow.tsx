"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@shoppexio/storefront";
import { toast } from "sonner";
import { useCart } from "@/components/use-cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getShoppexClient } from "@/lib/shoppex-client";
import { getCartIssueMap, reviewCartItems, type CartReview } from "@/lib/cart-review";
import { getCartLineKey, getProductImage, getUnitPrice, isRecoverableCartError } from "@/lib/product-utils";
import { isSampleStorefrontEnabled } from "@/lib/sample-storefront";
import { loadProductsData } from "@/lib/storefront-data";

export function CheckoutFlow() {
  const cart = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsReview, setNeedsReview] = useState(false);
  const sample = isSampleStorefrontEnabled();

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      const result = await loadProductsData();
      if (cancelled) return;

      if (!cancelled && result.success) {
        setProducts(result.products);
        setProductsLoaded(true);
        return;
      }

      setError(result.message ?? "Product data could not be loaded.");
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const productMap = useMemo(() => new Map(products.map((product) => [product.uniqid, product])), [products]);
  const cartReview = useMemo(
    () => productsLoaded ? reviewCartItems(cart.items, products) : { issues: [], blockingIssues: [] },
    [cart.items, products, productsLoaded],
  );
  const issueMap = useMemo(() => getCartIssueMap(cartReview), [cartReview]);
  const currency = cart.items.map((item) => productMap.get(item.product_id)?.currency).find(Boolean) ?? "USD";
  const subtotal = cart.items.reduce((sum, item) => {
    const product = productMap.get(item.product_id);
    if (!product) return sum;
    return sum + getUnitPrice(product, item.price_variant_id ?? item.variant_id) * item.quantity;
  }, 0);

  const refreshCartData = async (): Promise<Product[] | null> => {
    const result = await loadProductsData();
    if (result.success) {
      const nextProducts = result.products;
      setProducts(nextProducts);
      setProductsLoaded(true);
      setNeedsReview(false);
      setError(null);
      return nextProducts;
    }
    setError(result.message ?? "Product data could not be refreshed.");
    return null;
  };

  const applyCartReview = (review: CartReview = cartReview) => {
    const client = getShoppexClient();

    for (const issue of review.issues) {
      if (issue.action === "remove") {
        client.removeFromCart(issue.item.product_id, issue.item.variant_id);
        continue;
      }

      if (issue.action === "update" && issue.nextQuantity) {
        client.updateCartItem(issue.item.product_id, issue.item.variant_id, {
          quantity: issue.nextQuantity,
        });
        continue;
      }

      if (issue.action === "notice" && typeof issue.nextUnitPrice === "number") {
        client.updateCartItem(issue.item.product_id, issue.item.variant_id, {
          price_data: { unit_price: issue.nextUnitPrice },
        });
      }
    }

    cart.refreshCart();
    setNeedsReview(false);
    setError(null);
  };

  const submitCheckout = async () => {
    setError(null);
    setNeedsReview(false);

    if (cart.items.length === 0) {
      setError("Your cart is empty.");
      toast.error("Your cart is empty.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      toast.error("Enter a valid email address.");
      return;
    }

    if (!acceptedTerms) {
      setError("Accept the terms before continuing.");
      toast.error("Accept the terms before continuing.");
      return;
    }

    if (sample) {
      setError("Demo catalog is active. Set a real Shoppex shop slug before creating payments.");
      toast.info("Connect a Shoppex shop to enable payment.");
      return;
    }

    setSubmitting(true);
    try {
      const latestProducts = await refreshCartData();
      if (!latestProducts) return;
      const activeReview = reviewCartItems(cart.items, latestProducts);

      if (activeReview.blockingIssues.length > 0) {
        setNeedsReview(true);
        setError("Review the cart updates before continuing to payment.");
        toast.warning("Review cart updates before payment.");
        return;
      }

      const result = await getShoppexClient().checkout({
        autoRedirect: true,
        email: email.trim(),
        coupon: coupon.trim() || undefined,
      });

      if (!result.success) {
        const message = result.message ?? "Checkout failed.";
        setError(message);
        setNeedsReview(isRecoverableCartError(message));
        toast.error(message);
        cart.refreshCart();
      }
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : "Checkout failed.";
      setError(message);
      setNeedsReview(isRecoverableCartError(message));
      toast.error(message);
      cart.refreshCart();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/">
          <span>C</span>
          <strong>Checkout</strong>
        </Link>
        <nav>
          <Button asChild className="nav-control" variant="outline">
            <Link href="/">Continue shopping</Link>
          </Button>
        </nav>
      </header>

      <section className="checkout-layout">
        <div className="checkout-form">
          <div className="section-heading">
            <p>Checkout</p>
            <h1>Review your order</h1>
          </div>

          {sample ? (
            <div className="review-panel">
              <h2>Demo catalog active</h2>
              <p>This preview uses sample products. Add your Shoppex shop slug to create real checkout sessions.</p>
            </div>
          ) : null}

          {needsReview || cartReview.issues.length > 0 ? (
            <div className="review-panel">
              <h2>Some cart items changed</h2>
              <p>Shoppex rechecked this cart and found updates that should be handled before payment.</p>
              {cartReview.issues.length > 0 ? (
                <ul>
                  {cartReview.issues.map((issue) => (
                    <li key={issue.key}>{issue.product?.title ?? issue.item.product_id}: {issue.message}</li>
                  ))}
                </ul>
              ) : null}
              <div className="review-panel__actions">
                {cartReview.issues.length > 0 ? (
                  <Button type="button" variant="outline" onClick={() => applyCartReview()}>Apply recommended updates</Button>
                ) : null}
                <Button type="button" variant="outline" onClick={() => void refreshCartData()}>Refresh product data</Button>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="error-panel">
              <h2>Checkout needs attention</h2>
              <p>{error}</p>
            </div>
          ) : null}

          <div className="field">
            <Label htmlFor="checkout-email">Email address</Label>
            <Input id="checkout-email" className="store-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" />
          </div>

          <div className="field">
            <Label htmlFor="checkout-coupon">Coupon code</Label>
            <Input id="checkout-coupon" className="store-input" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Optional" />
          </div>

          <Label className="checkbox-field">
            <Checkbox checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(checked === true)} />
            <span>I agree to the seller terms and understand Shoppex will validate stock and pricing before payment.</span>
          </Label>

          <Button className="primary-action" type="button" disabled={sample || submitting || cart.items.length === 0} onClick={submitCheckout}>
            {sample ? "Connect Shoppex to enable payment" : submitting ? "Creating checkout..." : "Continue to payment"}
          </Button>
        </div>

        <aside className="order-summary">
          <h2>Order summary</h2>
          {cart.items.length === 0 ? (
            <div className="empty-state">
              <h3>Your cart is empty</h3>
              <p>Add products before checkout.</p>
            </div>
          ) : (
            <>
              <div className="summary-lines">
                {cart.items.map((item) => {
                  const product = productMap.get(item.product_id);
                  const imageUrl = getProductImage(product);
                  const unitPrice = product ? getUnitPrice(product, item.price_variant_id ?? item.variant_id) : 0;
                  const issue = issueMap.get(getCartLineKey(item));

                  return (
                    <div className={issue ? "summary-line summary-line--issue" : "summary-line"} key={getCartLineKey(item)}>
                      <div className="summary-line__image">
                        {imageUrl ? <img src={imageUrl} alt={product?.title ?? "Product"} /> : null}
                      </div>
                      <div>
                        <h3>{product?.title ?? item.product_id}</h3>
                        <p>Quantity {item.quantity}</p>
                        {issue ? <Badge className="summary-line__issue" variant="destructive">{issue.message}</Badge> : null}
                      </div>
                      <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency }).format(unitPrice * item.quantity)}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="summary-total">
                <span>Subtotal</span>
                <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency }).format(subtotal)}</strong>
              </div>
              <p className="summary-note">Final discounts, fees, and payment options are handled by Shoppex checkout.</p>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}
