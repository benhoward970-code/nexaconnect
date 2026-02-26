// NexaConnect — Stripe Webhook Handler
// Supabase Edge Function
//
// Required secrets:
//   STRIPE_SECRET_KEY=sk_live_...
//   STRIPE_WEBHOOK_SECRET=whsec_...
//   SUPABASE_URL=https://xxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=eyJ...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify webhook signature manually (Stripe SDK async verification not reliable on Deno)
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

    let event: Stripe.Event;

    // Parse signature header
    const sigParts: Record<string, string> = {};
    for (const part of signature.split(",")) {
      const [k, v] = part.split("=");
      if (k && v) sigParts[k.trim()] = v.trim();
    }

    if (sigParts.t && sigParts.v1 && webhookSecret) {
      // Compute expected signature
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signed = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(`${sigParts.t}.${body}`)
      );
      const expected = Array.from(new Uint8Array(signed))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      if (expected !== sigParts.v1) {
        console.error("Webhook signature mismatch");
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }
      event = JSON.parse(body) as Stripe.Event;
    } else {
      console.error("Missing signature or webhook secret");
      return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 });
    }

    console.log("Stripe event:", event.type);

    // Map Stripe price/plan to NexaConnect tier
    function getTierFromPlan(planName?: string): string {
      if (!planName) return "starter";
      const lower = planName.toLowerCase();
      if (lower.includes("premium")) return "premium";
      if (lower.includes("professional") || lower.includes("pro")) return "professional";
      return "starter";
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const providerId = session.metadata?.providerId;
        const planName = session.metadata?.planName;

        if (providerId && session.subscription) {
          const tier = getTierFromPlan(planName);
          const verified = tier === "premium";

          // Update tier on providers table
          await supabase.from("providers").update({
            tier,
            verified,
          }).eq("id", providerId);

          // Save subscription ID to provider_billing
          await supabase.from("provider_billing").upsert({
            provider_id: providerId,
            stripe_subscription_id: session.subscription as string,
          }, { onConflict: "provider_id" });

          console.log(`Provider ${providerId} upgraded to ${tier}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const providerId = subscription.metadata?.providerId;

        if (providerId) {
          if (subscription.status === "active") {
            const planName = subscription.metadata?.planName;
            const tier = getTierFromPlan(planName);
            await supabase.from("providers").update({
              tier,
              verified: tier === "premium",
            }).eq("id", providerId);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const providerId = subscription.metadata?.providerId;

        if (providerId) {
          // Downgrade to starter when subscription cancelled
          await supabase.from("providers").update({
            tier: "starter",
            verified: false,
          }).eq("id", providerId);

          // Clear subscription ID from billing
          await supabase.from("provider_billing").update({
            stripe_subscription_id: null,
          }).eq("provider_id", providerId);

          console.log(`Provider ${providerId} downgraded to starter (subscription cancelled)`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment failed for invoice:", invoice.id);
        // Could send notification email here
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
