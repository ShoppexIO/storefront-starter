# Fresh Start Migration

This guide is for merchants moving from Komerza, SellAuth, Sellpass, a custom frontend, or a no-code storefront.

The starter is not a historical importer. It gives you a clean custom storefront on Shoppex commerce.

Simple example:

```txt
Old stack:
custom frontend -> Komerza embeds

New stack:
custom Next.js storefront -> Shoppex products, cart, checkout, orders, portal, fulfillment
```

## What Moves Over

Plan to recreate these in Shoppex:

- products
- prices
- variants
- stock
- delivery settings
- checkout settings
- customer portal setup
- fulfillment webhooks

Plan to redesign these in the starter:

- homepage
- product grid
- product detail pages
- cart drawer
- checkout intro page
- brand colors and copy

## What Does Not Move Automatically

The starter does not automatically import:

- old order history
- customer accounts
- saved payment methods
- license keys already issued elsewhere
- historic analytics
- previous platform-specific embeds

Keep the old platform available for support until old customers no longer need it.

Simple example:

```txt
New purchases happen through Shoppex.
Old buyers still use the old platform for old orders until support is no longer needed.
```

## Recommended Cutover

1. Create the Shoppex store.
2. Add products, variants, stock, and delivery settings.
3. Configure the starter with the Shoppex shop slug.
4. Pick the customer portal URL.
5. Test a real checkout with a low-priced product.
6. Connect the production domain to the new storefront.
7. Keep the old storefront read-only for support.

## Customer Portal Choice

For a fully self-hosted storefront on Vercel, use a branded account subdomain:

```txt
store.example.com    -> Next.js storefront
account.example.com  -> Shoppex customer portal
```

For the fastest setup, use the hosted Shoppex portal URL:

```txt
https://your-shop.myshoppex.io/dashboard
```

Use `/dashboard` only when the same domain is routed through the Shoppex Storefront Worker.

## Fulfillment Cutover

Start with the included webhook route:

```txt
/api/shoppex/webhook
```

Use it to receive paid order events and forward notifications to Discord while you confirm the flow.

For production license delivery, store the Shoppex delivery id before granting access.

Simple example:

```txt
If delivery abc was already processed, return success.
If delivery abc is new, grant access and mark it processed.
```
