"use client";

import { useEffect, useState } from "react";
import type { Product, Shop } from "@shoppexio/storefront";
import { CartDrawer } from "@/components/cart-drawer";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/components/use-cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCustomerPortalHref } from "@/lib/shoppex-config";
import { loadStorefrontData } from "@/lib/storefront-data";
import { themeConfig } from "@/lib/theme-config";

type LoadState =
  | { status: "loading"; shop: null; products: Product[]; message: null; sample: false }
  | { status: "ready"; shop: Shop | null; products: Product[]; message: null; sample: boolean }
  | { status: "error"; shop: null; products: Product[]; message: string; sample: false };

export function StorefrontHome() {
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [state, setState] = useState<LoadState>({
    status: "loading",
    shop: null,
    products: [],
    message: null,
    sample: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadStorefront() {
      const result = await loadStorefrontData();
      if (cancelled) return;

      if (!result.success) {
        setState({
          status: "error",
          shop: null,
          products: [],
          message: result.message,
          sample: false,
        });
        return;
      }

      setState({
        status: "ready",
        shop: result.shop,
        products: result.products,
        message: null,
        sample: result.sample,
      });
    }

    void loadStorefront();

    return () => {
      cancelled = true;
    };
  }, []);

  const shopName = state.shop?.name ?? themeConfig.brandName;
  const visibleProducts = state.products.slice(0, 24);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/">
          <span>{shopName.slice(0, 1).toUpperCase()}</span>
          <strong>{shopName}</strong>
        </a>
        <nav>
          {state.sample ? <Badge className="nav-label" variant="outline">Demo</Badge> : null}
          <Button asChild className="nav-control" variant="outline">
            <a href={getCustomerPortalHref()}>My orders</a>
          </Button>
          <Button className="nav-control" variant="outline" type="button" onClick={() => setCartOpen(true)}>
            Cart <span>{cart.totalQuantity}</span>
          </Button>
        </nav>
      </header>

      <section className="hero">
        <div className="hero__content">
          <p>{themeConfig.announcement}</p>
          <h1>{themeConfig.tagline}</h1>
          <div className="hero__actions">
            <Button asChild className="primary-action">
              <a href="#products">Shop products</a>
            </Button>
            <Button asChild className="secondary-action" variant="outline">
              <a href={getCustomerPortalHref()}>Open customer portal</a>
            </Button>
          </div>
        </div>
        <div className="hero__panel">
          <span>{state.sample ? "Demo catalog" : "Powered by Shoppex"}</span>
          <strong>Products, stock checks, checkout, orders, downloads, and license keys.</strong>
        </div>
      </section>

      <section className="product-section" id="products">
        <div className="section-heading">
          <p>Catalog</p>
          <h2>Latest products</h2>
        </div>

        {state.status === "loading" ? (
          <div className="product-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="product-skeleton" key={index} />
            ))}
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="error-panel">
            <h3>Storefront unavailable</h3>
            <p>{state.message}</p>
          </div>
        ) : null}

        {state.status === "ready" && state.products.length === 0 ? (
          <div className="empty-state">
            <h3>No products yet</h3>
            <p>Add products in Shoppex to populate this storefront.</p>
          </div>
        ) : null}

        {state.status === "ready" && state.products.length > 0 ? (
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <ProductCard product={product} key={product.uniqid} />
            ))}
          </div>
        ) : null}
      </section>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} products={state.products} />
    </main>
  );
}
