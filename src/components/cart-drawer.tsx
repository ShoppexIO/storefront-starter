"use client";

import Link from "next/link";
import type { Product } from "@shoppexio/storefront";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getCartLineKey, getProductImage, getUnitPrice } from "@/lib/product-utils";
import { useCart } from "@/components/use-cart";
import { getCartIssueMap, reviewCartItems } from "@/lib/cart-review";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  products: Product[];
};

export function CartDrawer({ open, onClose, products }: CartDrawerProps) {
  const cart = useCart();
  const productMap = new Map(products.map((product) => [product.uniqid, product]));
  const review = reviewCartItems(cart.items, products);
  const issueMap = getCartIssueMap(review);
  const subtotal = cart.items.reduce((sum, item) => {
    const product = productMap.get(item.product_id);
    if (!product) return sum;
    return sum + getUnitPrice(product, item.price_variant_id ?? item.variant_id) * item.quantity;
  }, 0);
  const currency = cart.items.map((item) => productMap.get(item.product_id)?.currency).find(Boolean) ?? "USD";

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onClose();
    }}>
      <SheetContent className="cart-drawer" showCloseButton={false}>
        <SheetHeader className="cart-drawer__header">
          <div>
            <p>Cart</p>
            <SheetTitle>{cart.totalQuantity} {cart.totalQuantity === 1 ? "item" : "items"}</SheetTitle>
            <SheetDescription className="sr-only">Review products before checkout.</SheetDescription>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        </SheetHeader>

        <div className="cart-drawer__content">
          {cart.items.length === 0 ? (
            <div className="empty-state">
              <h3>Your cart is empty</h3>
              <p>Add a product to start checkout.</p>
            </div>
          ) : (
            cart.items.map((item) => {
              const product = productMap.get(item.product_id);
              const imageUrl = getProductImage(product);
              const unitPrice = product ? getUnitPrice(product, item.price_variant_id ?? item.variant_id) : 0;
              const issue = issueMap.get(getCartLineKey(item));

              return (
                <div className={issue ? "cart-line cart-line--issue" : "cart-line"} key={getCartLineKey(item)}>
                  <div className="cart-line__image">
                    {imageUrl ? <img src={imageUrl} alt={product?.title ?? "Product"} /> : <span />}
                  </div>
                  <div className="cart-line__main">
                    <div>
                      <h3>{product?.title ?? item.product_id}</h3>
                      <p>
                        {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(unitPrice)}
                      </p>
                      {issue ? <Badge className="cart-line__issue" variant="destructive">{issue.message}</Badge> : null}
                    </div>
                    <div className="quantity-control">
                      <Button type="button" variant="ghost" onClick={() => cart.updateQuantity(item, item.quantity - 1)} aria-label="Decrease quantity">-</Button>
                      <span>{item.quantity}</span>
                      <Button type="button" variant="ghost" onClick={() => cart.updateQuantity(item, item.quantity + 1)} aria-label="Increase quantity">+</Button>
                    </div>
                  </div>
                  <Button className="cart-line__remove" variant="ghost" type="button" onClick={() => cart.removeItem(item)}>Remove</Button>
                </div>
              );
            })
          )}
        </div>

        {cart.items.length > 0 ? (
          <footer className="cart-drawer__footer">
            <div>
              <span>Subtotal</span>
              <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency }).format(subtotal)}</strong>
            </div>
            {review.blockingIssues.length > 0 ? (
              <p className="cart-warning">Some items need review before checkout.</p>
            ) : null}
            <p>Stock, coupons, and final totals are checked by Shoppex at checkout.</p>
            <Button asChild className="primary-action">
              <Link href="/checkout" onClick={onClose}>Continue to checkout</Link>
            </Button>
          </footer>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
