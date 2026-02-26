// NexaConnect — Create Stripe Checkout Session
// Supabase Edge Function
//
// Required secrets (set via `supabase secrets set`):
//   STRIPE_SECRET_KEY=sk_live_...
//   SUPABASE_URL=https://xxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=eyJ...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify auth
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { providerId, priceId, planName, billingCycle, returnUrl } = await req.json();

    // Get provider info
    const { data: provider } = await supabase
      .from("providers")
      .select("email, name")
      .eq("id", providerId)
      .single();

    // Get Stripe customer ID from provider_billing
    const { data: billing } = await supabase
      .from("provider_billing")
      .select("stripe_customer_id")
      .eq("provider_id", providerId)
      .single();

    let customerId = billing?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: provider?.email || user.email,
        name: provider?.name,
        metadata: { providerId, supabaseUserId: user.id },
      });
      customerId = customer.id;

      // Save Stripe customer ID to provider_billing
      await supabase
        .from("provider_billing")
        .upsert({
          provider_id: providerId,
          user_id: user.id,
          stripe_customer_id: customerId,
        }, { onConflict: "provider_id" });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}?checkout=success&plan=${planName}`,
      cancel_url: `${returnUrl}?checkout=cancelled`,
      subscription_data: {
        metadata: { providerId, planName },
      },
      metadata: { providerId, planName },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
