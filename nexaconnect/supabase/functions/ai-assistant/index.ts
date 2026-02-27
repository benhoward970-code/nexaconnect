// NexaConnect — Provider AI Assistant
// Supabase Edge Function
//
// Required secrets:
//   ANTHROPIC_API_KEY=sk-ant-...
//   SUPABASE_URL=https://xxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=eyJ...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const { message, providerId, context } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch provider context for system prompt
    let providerContext = "";
    if (providerId) {
      const { data: provider } = await supabase
        .from("providers")
        .select("name, tier, categories, suburb, state, rating, review_count, views_this_month, enquiries_this_month, bookings_this_month")
        .eq("id", providerId)
        .single();

      if (provider) {
        const { data: leads } = await supabase
          .from("leads")
          .select("id, status")
          .eq("provider_id", providerId);

        const leadCounts = {
          total: leads?.length || 0,
          new: leads?.filter((l: { status: string }) => l.status === "new").length || 0,
          unlocked: leads?.filter((l: { status: string }) => l.status === "unlocked").length || 0,
        };

        providerContext = `
Provider Profile:
- Name: ${provider.name}
- Tier: ${provider.tier}
- Categories: ${(provider.categories || []).join(", ")}
- Location: ${provider.suburb}, ${provider.state}
- Rating: ${provider.rating}/5 (${provider.review_count} reviews)
- This month: ${provider.views_this_month} views, ${provider.enquiries_this_month} enquiries, ${provider.bookings_this_month} bookings
- Leads: ${leadCounts.total} total (${leadCounts.new} new, ${leadCounts.unlocked} unlocked)`;
      }
    }

    const systemPrompt = `You are the NexaConnect Assistant, an AI helper for NDIS service providers on the NexaConnect marketplace platform. You help providers grow their business, improve their profiles, respond to leads, and understand the NDIS landscape.

${providerContext}

${context ? `Additional context: ${context}` : ""}

Guidelines:
- Be concise, friendly, and practical
- Give actionable advice specific to NDIS providers
- When asked about analytics or stats, reference the provider's actual data above
- For profile improvement tips, consider their current tier and categories
- For lead response help, suggest professional and empathetic messaging
- You can explain NexaConnect features like tier upgrades, lead unlocking ($25 per lead), and profile optimisation
- Keep responses under 300 words unless the user asks for detail
- Do not make up specific NDIS pricing, legislation numbers, or compliance details you're unsure about`;

    // Call Anthropic API
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Anthropic API error:", result);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reply = result.content?.[0]?.text || "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-assistant error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
