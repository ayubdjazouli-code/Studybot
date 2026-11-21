import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://ayubdjazouli-code.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!stripeKey || !supabaseUrl || !anonKey) {
    return json({ error: "Les paiements ne sont pas encore configurés côté serveur." }, 503);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Connecte-toi avant de choisir un abonnement." }, 401);

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization },
  });
  if (!authResponse.ok) return json({ error: "Session invalide. Reconnecte-toi." }, 401);
  const user = await authResponse.json();
  if (!user?.id || !user?.email) return json({ error: "Un compte avec une adresse e-mail est nécessaire." }, 400);

  let body: { price_id?: string };
  try { body = await req.json(); } catch { return json({ error: "Requête invalide." }, 400); }
  const prices: Record<string, string> = {
    "price_1Uan3IPNbeiIpf4L7eHT5KQD": "Essentiel",
    "price_1Uan8bPNbeiIpf4LYXs4Gp5F": "Premium+",
  };
  const priceId = body.price_id || "";
  if (!Object.hasOwn(prices, priceId)) return json({ error: "Offre inconnue." }, 400);

  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    customer_email: user.email,
    client_reference_id: user.id,
    "metadata[supabase_user_id]": user.id,
    "metadata[price_id]": priceId,
    "subscription_data[metadata][supabase_user_id]": user.id,
    "subscription_data[metadata][price_id]": priceId,
    success_url: "https://ayubdjazouli-code.github.io/Studybot/?payment=success",
    cancel_url: "https://ayubdjazouli-code.github.io/Studybot/?payment=cancelled",
    allow_promotion_codes: "true",
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const session = await response.json().catch(() => ({}));
  if (!response.ok || typeof session.url !== "string") {
    console.error("Stripe Checkout error", response.status, session);
    return json({ error: "Impossible de préparer le paiement. Vérifie la configuration Stripe." }, 502);
  }
  return json({ url: session.url });
});
