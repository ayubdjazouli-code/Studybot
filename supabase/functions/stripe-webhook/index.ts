import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = header.split(",").map((part) => part.split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || signatures.length === 0) return false;
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`)));
  const expected = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
  return signatures.some((signature) => {
    if (signature.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    return mismatch === 0;
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  const signingSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!signingSecret || !serviceKey || !supabaseUrl) return json({ error: "Configuration serveur incomplète." }, 503);

  const rawBody = await req.text();
  const signature = req.headers.get("Stripe-Signature") || "";
  if (!await verifyStripeSignature(rawBody, signature, signingSecret)) return json({ error: "Signature Stripe invalide." }, 400);

  let event: any;
  try { event = JSON.parse(rawBody); } catch { return json({ error: "Événement invalide." }, 400); }
  const object = event?.data?.object;
  if (!object) return json({ received: true });

  let userId = object.metadata?.supabase_user_id || object.client_reference_id || null;
  let subscriptionId = typeof object.subscription === "string" ? object.subscription : object.id;
  let customerId = typeof object.customer === "string" ? object.customer : null;
  let priceId = object.metadata?.price_id || object.items?.data?.[0]?.price?.id || null;
  let status = object.status || null;
  let periodEnd = object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null;

  if (event.type === "checkout.session.completed") {
    if (!userId || !subscriptionId || !customerId) return json({ received: true });
    if (object.payment_status !== "paid" && object.payment_status !== "no_payment_required") return json({ received: true });
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Clé Stripe absente." }, 503);
    const subResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const sub = await subResponse.json().catch(() => ({}));
    if (!subResponse.ok) return json({ error: "Impossible de vérifier l'abonnement Stripe." }, 502);
    userId = sub.metadata?.supabase_user_id || userId;
    priceId = sub.metadata?.price_id || sub.items?.data?.[0]?.price?.id || priceId;
    status = sub.status;
    periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
  } else if (!["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    return json({ received: true });
  }

  if (!userId || !subscriptionId || !customerId || !priceId || !status) return json({ received: true });
  const allowedPrices = ["price_1Uan3IPNbeiIpf4L7eHT5KQD", "price_1Uan8bPNbeiIpf4LYXs4Gp5F"];
  if (!allowedPrices.includes(priceId)) return json({ received: true });

  const response = await fetch(`${supabaseUrl}/rest/v1/subscriptions?on_conflict=user_id`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      price_id: priceId,
      status,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) {
    console.error("Subscription database update failed", response.status, await response.text());
    return json({ error: "Enregistrement de l'abonnement impossible." }, 500);
  }
  return json({ received: true });
});
