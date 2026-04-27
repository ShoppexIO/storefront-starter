"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@shoppexio/storefront";
import { toast } from "sonner";
import { CartDrawer } from "@/components/cart-drawer";
import { useCart } from "@/components/use-cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shoppexConfig } from "@/lib/shoppex-config";
import { loadProductData } from "@/lib/storefront-data";
import {
  formatStockLabel,
  getAvailableStock,
  getProductImage,
  getProductOptions,
  getQuantityBounds,
  getUnitPrice,
  getVariantId,
  isSoldOut,
  isUnlimitedStock,
} from "@/lib/product-utils";

type ProductDetailProps = {
  slug: string;
};

export function ProductDetail({ slug }: ProductDetailProps) {
  const router = useRouter();
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [sample, setSample] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      const result = await loadProductData(slug);
      if (cancelled) return;

      if (!result.success) {
        setMessage(result.message);
        setRelatedProducts(result.products);
        setSample(result.sample);
        setLoading(false);
        return;
      }

      const selectedVariantId = getVariantId(result.product);
      setProduct(result.product);
      setVariantId(selectedVariantId);
      setRelatedProducts(result.products);
      setSample(result.sample);
      setLoading(false);
    }

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const imageUrl = getProductImage(product);
  const bounds = product ? getQuantityBounds(product, variantId) : { min: 1, max: -1 };
  const stock = product ? getAvailableStock(product, variantId) : -1;
  const soldOut = product ? isSoldOut(product, variantId) : false;
  const productOptions = useMemo(() => product ? getProductOptions(product) : [], [product]);
  const maxSelectableQuantity = bounds.max > 0 ? bounds.max : isUnlimitedStock(stock) ? Number.POSITIVE_INFINITY : stock;
  const canIncrease = product ? !soldOut && quantity < maxSelectableQuantity : false;
  const price = useMemo(() => product ? getUnitPrice(product, variantId) : 0, [product, variantId]);
  const cartProducts = useMemo(() => {
    if (!product) return relatedProducts;
    return [product, ...relatedProducts.filter((relatedProduct) => relatedProduct.uniqid !== product.uniqid)];
  }, [product, relatedProducts]);

  if (loading) {
    return <main className="detail-shell"><div className="product-skeleton product-skeleton--wide" /></main>;
  }

  if (!product) {
    return (
      <main className="detail-shell">
        <div className="error-panel">
          <h1>Product unavailable</h1>
          <p>{message ?? "This product could not be loaded."}</p>
          <Link href="/">Back to products</Link>
        </div>
      </main>
    );
  }

  const addToCart = () => {
    if (shoppexConfig.checkoutMode === "buy-now") {
      cart.clearCart();
    }
    cart.addProduct(product, variantId, quantity);
    toast.success("Added to cart.");
    if (shoppexConfig.checkoutMode === "buy-now") {
      router.push("/checkout");
      return;
    }
    setCartOpen(true);
  };

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/">
          <span>{product.title.slice(0, 1).toUpperCase()}</span>
          <strong>Storefront</strong>
        </Link>
        <nav>
          {sample ? <Badge className="nav-label" variant="outline">Demo</Badge> : null}
          <Button asChild className="nav-control" variant="outline">
            <Link href="/checkout">Checkout</Link>
          </Button>
          <Button className="nav-control" variant="outline" type="button" onClick={() => setCartOpen(true)}>
            Cart <span>{cart.totalQuantity}</span>
          </Button>
        </nav>
      </header>

      <section className="product-detail">
        <div className="product-detail__media">
          {imageUrl ? <img src={imageUrl} alt={product.title} /> : <span>{product.title.slice(0, 2).toUpperCase()}</span>}
        </div>

        <div className="product-detail__content">
          <Link href="/">Back to products</Link>
          <h1>{product.title}</h1>
          <p>{product.description?.replace(/<[^>]*>/g, "") || "Secure checkout and instant delivery through Shoppex."}</p>

          <div className="detail-price">
            <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(price)}</strong>
            {shoppexConfig.showStockCount ? (
              <Badge className={soldOut ? "stock stock--sold-out" : "stock"} variant="outline">
                {formatStockLabel(product, variantId)}
              </Badge>
            ) : null}
          </div>

          {productOptions.length > 0 ? (
            <div className="field">
              <span>Option</span>
              <Select value={variantId} onValueChange={(value) => {
                  setVariantId(value);
                  setQuantity(1);
                }}>
                <SelectTrigger className="store-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((variant) => (
                    <SelectItem value={variant.id} key={variant.id}>{variant.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="buy-row">
            <div className="quantity-control quantity-control--large">
              <Button type="button" variant="ghost" onClick={() => setQuantity(Math.max(bounds.min, quantity - 1))} aria-label="Decrease quantity">-</Button>
              <span>{quantity}</span>
              <Button type="button" variant="ghost" onClick={() => setQuantity(Math.min(maxSelectableQuantity, quantity + 1))} disabled={!canIncrease} aria-label="Increase quantity">+</Button>
            </div>
            <Button className="primary-action" type="button" disabled={soldOut} onClick={addToCart}>
              {soldOut ? "Sold out" : shoppexConfig.checkoutMode === "buy-now" ? "Buy now" : "Add to cart"}
            </Button>
          </div>
        </div>
      </section>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} products={cartProducts} />
    </main>
  );
}
