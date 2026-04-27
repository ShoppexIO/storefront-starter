import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

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

describe("Shoppex webhook route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects invalid JSON", async () => {
    const response = await POST(new Request("http://localhost/api/shoppex/webhook", {
      method: "POST",
      body: "not-json",
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      received: false,
      error: "Invalid webhook payload",
    });
  });

  it("rejects invalid signatures when a webhook secret is configured", async () => {
    vi.stubEnv("SHOPPEX_WEBHOOK_SECRET", "secret");

    const response = await POST(new Request("http://localhost/api/shoppex/webhook", {
      method: "POST",
      headers: {
        "x-shoppex-signature": "invalid",
      },
      body: JSON.stringify({ event: "order:paid", data: { uniqid: "order_1" } }),
    }));

    expect(response.status).toBe(401);
  });

  it("accepts a signed paid order webhook", async () => {
    vi.stubEnv("SHOPPEX_WEBHOOK_SECRET", "secret");
    const body = JSON.stringify({ event: "order:paid", data: { uniqid: "order_1" } });
    const signature = await signPayload(body, "secret");

    const response = await POST(new Request("http://localhost/api/shoppex/webhook", {
      method: "POST",
      headers: {
        "x-shoppex-delivery": "delivery_1",
        "x-shoppex-signature": signature,
      },
      body,
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      received: true,
      delivered: false,
    });
  });
});
