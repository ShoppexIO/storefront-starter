# Merchant Setup

This starter is for merchants who want a custom storefront while Shoppex handles commerce.

Simple example:

```txt
yourdomain.com          -> self-hosted Next.js storefront
checkout.shoppex.io     -> hosted payment flow
account.yourdomain.com  -> branded customer portal
```

If you are moving from another platform, treat this as a fresh storefront cutover. Products, stock, checkout, customer portal, and fulfillment move to Shoppex. Old order history and old customer accounts do not move automatically.

## 1. Create the Shoppex Store

In Shoppex, create the shop and add products first.

You need:

- shop slug
- product titles, prices, variants, and stock
- checkout/payment settings
- customer portal decision
- optional webhook subscription for fulfillment

## 2. Configure the Starter

Set environment variables:

```txt
NEXT_PUBLIC_SHOPPEX_SHOP_SLUG=your-shop
NEXT_PUBLIC_SHOPPEX_USE_SAMPLE_DATA=false
NEXT_PUBLIC_CUSTOMER_PORTAL_URL=https://account.yourdomain.com
SHOPPEX_WEBHOOK_SECRET=your-webhook-secret
SHOPPEX_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Then edit:

```txt
shoppex.config.ts
theme.config.ts
```

For preview screenshots before the Shoppex store is ready, use:

```txt
NEXT_PUBLIC_SHOPPEX_SHOP_SLUG=demo
```

The demo catalog is only for preview. It does not create real checkout sessions.

## 3. Choose Checkout Mode

Use cart mode for normal stores:

```ts
checkoutMode: "cart"
```

Use buy-now mode for single-product stores:

```ts
checkoutMode: "buy-now"
```

Buy-now mode clears the current cart, adds the selected product, and routes the buyer to `/checkout`.

## 4. Choose Customer Portal URL

Fastest setup:

```txt
https://your-shop.myshoppex.io/dashboard
```

Use this when the storefront is fully self-hosted and you do not have a branded account domain yet.

Shoppex-managed custom domain:

```txt
/dashboard
```

Use this only when the storefront domain is routed through the Shoppex Storefront Worker.

Premium self-hosted setup:

```txt
https://account.yourdomain.com
```

Use this for a custom Vercel storefront at `yourdomain.com`. The account subdomain avoids asset and route collisions between the Next.js storefront and the Shoppex customer portal.

## 5. Configure Webhooks

Create a webhook subscription in Shoppex for paid order events.

Use this starter endpoint:

```txt
https://yourdomain.com/api/shoppex/webhook
```

Set `SHOPPEX_WEBHOOK_SECRET` to the webhook signing secret. The starter verifies `X-Shoppex-Signature` when the secret is configured.

For real fulfillment, store `X-Shoppex-Delivery` before granting access.

Simple example:

```txt
Delivery arrives
  -> check delivery id in database
  -> if already processed, return 200
  -> if new, grant license key or Discord role
  -> store delivery id as processed
```

## 6. Deploy

For the exported public repo, use the Vercel clone URL from the README.

For the in-monorepo app, set the Vercel project root to:

```txt
apps/storefront-starter
```

Use Bun for install/build commands. The included `vercel.json` is written for the exported starter root.
