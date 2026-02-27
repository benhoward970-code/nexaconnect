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
      if (lower.includes("elite")) return "elite";
      if (lower.includes("premium")) return "premium";
      if (lower.includes("professional") || lower.includes("pro")) return "professional";
      return "starter";
    }

    // Helper to send email via send-email edge function
    async function sendEmail(to: string, subject: string, html: string) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ to, subject, html }),
        });
      } catch (emailErr) {
        console.error("Failed to send email:", emailErr);
      }
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadataType = session.metadata?.type;

        // ── Lead Unlock Payment ──
        if (metadataType === "lead_unlock") {
          const leadId = session.metadata?.leadId;
          const providerId = session.metadata?.providerId;

          if (leadId) {
            // Update lead status to unlocked
            await supabase.from("leads").update({
              status: "unlocked",
              payment_intent_id: session.payment_intent as string,
            }).eq("id", leadId);

            // Get lead details for notification
            const { data: lead } = await supabase.from("leads").select("*, provider:providers(name)").eq("id", leadId).single();
            const { data: participant } = lead?.participant_id
              ? await supabase.from("participants").select("user_id, email, name").eq("id", lead.participant_id).single()
              : { data: null };

            // Write notification to participant
            if (participant?.user_id) {
              const providerName = (lead as any)?.provider?.name || "A provider";
              await supabase.from("notifications").insert({
                user_id: participant.user_id,
                type: "lead",
                title: "A provider has accepted your request",
                body: `${providerName} has unlocked your support request and will be in touch soon.`,
                link: "leads",
              });

              // Send email to participant
              if (participant.email) {
                await sendEmail(
                  participant.email,
                  `${providerName} has accepted your support request — NexaConnect`,
                  `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                    <h2 style="color:#2563EB;">Good news!</h2>
                    <p><strong>${providerName}</strong> has accepted your support request and will be in touch shortly.</p>
                    <p>They now have access to your contact details so you can expect to hear from them soon.</p>
                    <p style="margin-top:24px;color:#64748B;font-size:14px;">— The NexaConnect Team</p>
                  </div>`
                );
              }
            }

            console.log(`Lead ${leadId} unlocked by provider ${providerId}`);
          }
          break;
        }

        // ── Subscription Payment ──
        const providerId = session.metadata?.providerId;
        const planName = session.metadata?.planName;

        if (providerId && session.subscription) {
          const tier = getTierFromPlan(planName);
          const verified = tier === "premium" || tier === "elite";

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
              verified: tier === "premium" || tier === "elite",
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
