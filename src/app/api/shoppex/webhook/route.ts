type ShoppexWebhookPayload = {
  type?: string;
  event?: string;
  data?: {
    uniqid?: string;
    status?: string;
    customer_email?: string;
    product_title?: string;
    total?: string | number;
    currency?: string;
  };
};

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

async function signPayload(rawBody: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyShoppexSignature(request: Request, rawBody: string): Promise<boolean> {
  const webhookSecret = process.env.SHOPPEX_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return true;
  }

  const receivedSignature = request.headers.get("x-shoppex-signature")?.trim();
  if (!receivedSignature) {
    return false;
  }

  const expectedSignature = await signPayload(rawBody, webhookSecret);
  return timingSafeEqual(receivedSignature, expectedSignature);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureValid = await verifyShoppexSignature(request, rawBody);
  if (!signatureValid) {
    return Response.json({ received: false, error: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: ShoppexWebhookPayload | null = null;
  try {
    payload = JSON.parse(rawBody || "null") as ShoppexWebhookPayload | null;
  } catch {
    return Response.json({ received: false, error: "Invalid webhook payload" }, { status: 400 });
  }
  if (!payload) {
    return Response.json({ received: false, error: "Invalid webhook payload" }, { status: 400 });
  }
  const eventType = payload?.type ?? payload?.event ?? "unknown";
  const deliveryId = request.headers.get("x-shoppex-delivery") ?? "unknown";

  if (!eventType.startsWith("order:paid")) {
    return Response.json({ received: true, ignored: true });
  }

  const discordWebhookUrl = process.env.SHOPPEX_DISCORD_WEBHOOK_URL;
  if (!discordWebhookUrl) {
    return Response.json({
      received: true,
      delivered: false,
      message: "Set SHOPPEX_DISCORD_WEBHOOK_URL to forward paid order notifications.",
    });
  }

  const order = payload?.data ?? {};
  const content = [
    "**Shoppex order paid**",
    `Delivery: ${deliveryId}`,
    `Order: ${order.uniqid ?? "unknown"}`,
    `Customer: ${order.customer_email ?? "unknown"}`,
    order.product_title ? `Product: ${order.product_title}` : null,
    order.total ? `Total: ${order.total} ${order.currency ?? ""}`.trim() : null,
  ].filter(Boolean).join("\n");

  const response = await fetch(discordWebhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });

  return Response.json({
    received: true,
    delivered: response.ok,
  }, {
    status: response.ok ? 200 : 502,
  });
}
