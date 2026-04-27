"use client";

import Link from "next/link";
import type { Product } from "@shoppexio/storefront";
import { Badge } from "@/components/ui/badge";
import { shoppexConfig } from "@/lib/shoppex-config";
import {
  formatStockLabel,
  getCurrency,
  getProductHref,
  getProductImage,
  getUnitPrice,
  isSoldOut,
} from "@/lib/product-utils";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = getProductImage(product);
  const soldOut = isSoldOut(product);

  return (
    <Link className="product-card" href={getProductHref(product)}>
      <div className="product-card__image" aria-hidden={!imageUrl}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.title} />
        ) : (
          <span>{product.title.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="product-card__body">
        <div>
          <h3>{product.title}</h3>
          <p>{product.description?.replace(/<[^>]*>/g, "").slice(0, 92) || "Instant checkout powered by Shoppex."}</p>
        </div>
        <div className="product-card__meta">
          <span>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: getCurrency(product),
            }).format(getUnitPrice(product))}
          </span>
          {shoppexConfig.showStockCount ? (
            <Badge className={soldOut ? "stock stock--sold-out" : "stock"} variant="outline">
              {formatStockLabel(product)}
            </Badge>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
