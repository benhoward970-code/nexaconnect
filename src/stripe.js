/* ═══════════════════════════════════════════════════════════════
   NexaConnect — Stripe Client Helpers
   ═══════════════════════════════════════════════════════════════ */

import { loadStripe } from '@stripe/stripe-js/pure';
import { supabase, isSupabaseConfigured } from './supabase';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise = null;
export function getStripe() {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
}

export function isStripeConfigured() {
  return !!stripePublishableKey;
}

/**
 * Redirect to Stripe Checkout for a subscription upgrade.
 * Calls the Supabase Edge Function `create-checkout`.
 */
export async function redirectToCheckout({ providerId, priceId, planName, billingCycle }) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      providerId,
      priceId,
      planName,
      billingCycle,
      returnUrl: window.location.origin,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    // Extract the actual error message from FunctionsHttpError
    let msg = error.message || 'Unknown error';
    if (error.context && typeof error.context.json === 'function') {
      try { const body = await error.context.json(); msg = body.error || msg; } catch (_) {}
    }
    throw new Error(msg);
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  if (data?.url) {
    window.location.href = data.url;
  } else {
    throw new Error('No checkout URL returned');
  }
}

/**
 * Redirect to Stripe Checkout to unlock a lead (one-time $25 payment).
 * Calls the Supabase Edge Function `unlock-lead`.
 */
export async function redirectToLeadUnlock({ providerId, leadId }) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('unlock-lead', {
    body: {
      providerId,
      leadId,
      returnUrl: window.location.origin,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    let msg = error.message || 'Unknown error';
    if (error.context && typeof error.context.json === 'function') {
      try { const body = await error.context.json(); msg = body.error || msg; } catch (_) {}
    }
    throw new Error(msg);
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  if (data?.url) {
    window.location.href = data.url;
  } else {
    throw new Error('No checkout URL returned');
  }
}

/**
 * Open Stripe Billing Portal for subscription management.
 * Calls the Supabase Edge Function `create-portal`.
 */
export async function openBillingPortal(providerId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('create-portal', {
    body: {
      providerId,
      returnUrl: window.location.origin,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    let msg = error.message || 'Unknown error';
    if (error.context && typeof error.context.json === 'function') {
      try { const body = await error.context.json(); msg = body.error || msg; } catch (_) {}
    }
    throw new Error(msg);
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  if (data?.url) {
    window.location.href = data.url;
  } else {
    throw new Error('No portal URL returned');
  }
}
