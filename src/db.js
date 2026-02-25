/* ═══════════════════════════════════════════════════════════════
   NexaConnect — Database Service Layer
   Abstracts Supabase queries with fallback to mock data
   ═══════════════════════════════════════════════════════════════ */

import { supabase, isSupabaseConfigured } from './supabase';

// ── Field mapping: Supabase snake_case ↔ App camelCase ──

function snakeToCamel(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    tier: row.tier,
    verified: row.verified,
    categories: row.categories || [],
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    phone: row.phone,
    website: row.website,
    description: row.description || '',
    shortDescription: row.short_description || '',
    photos: row.photos || [],
    rating: parseFloat(row.rating) || 0,
    reviewCount: row.review_count || 0,
    responseRate: row.response_rate || 0,
    responseTime: row.response_time || 'N/A',
    waitTime: row.wait_time || 'TBA',
    planTypes: row.plan_types || ['Plan Managed'],
    availability: row.availability || {},
    serviceAreas: row.service_areas || [],
    founded: row.founded,
    teamSize: row.team_size || '1',
    languages: row.languages || ['English'],
    features: row.features || [],
    viewsThisMonth: row.views_this_month || 0,
    enquiriesThisMonth: row.enquiries_this_month || 0,
    bookingsThisMonth: row.bookings_this_month || 0,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    createdAt: row.created_at,
  };
}

function camelToSnake(data) {
  const map = {
    userId: 'user_id',
    shortDescription: 'short_description',
    reviewCount: 'review_count',
    responseRate: 'response_rate',
    responseTime: 'response_time',
    waitTime: 'wait_time',
    planTypes: 'plan_types',
    serviceAreas: 'service_areas',
    teamSize: 'team_size',
    viewsThisMonth: 'views_this_month',
    enquiriesThisMonth: 'enquiries_this_month',
    bookingsThisMonth: 'bookings_this_month',
    stripeCustomerId: 'stripe_customer_id',
    stripeSubscriptionId: 'stripe_subscription_id',
    createdAt: 'created_at',
  };
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    result[map[key] || key] = value;
  }
  return result;
}

function snakeToParticipant(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    suburb: row.suburb,
    state: row.state,
    ndisNumber: row.ndis_number || '',
    planType: row.plan_type || 'Plan Managed',
    goals: row.goals || [],
    categories: row.categories || [],
    favourites: row.favourites || [],
    createdAt: row.created_at,
  };
}

function snakeToReview(row) {
  if (!row) return null;
  return {
    id: row.id,
    providerId: row.provider_id,
    participantId: row.participant_id,
    participantName: row.participant_name || '',
    rating: row.rating,
    text: row.text || '',
    date: row.created_at ? row.created_at.split('T')[0] : '',
    response: row.response,
    responseDate: row.response_date,
  };
}

function snakeToEnquiry(row) {
  if (!row) return null;
  return {
    id: row.id,
    providerId: row.provider_id,
    participantId: row.participant_id,
    participantName: row.participant_name || '',
    providerName: row.provider_name || '',
    subject: row.subject || '',
    status: row.status || 'active',
    messages: row.messages || [],
    createdAt: row.created_at ? row.created_at.split('T')[0] : '',
  };
}

function snakeToBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    providerId: row.provider_id,
    participantId: row.participant_id,
    participantName: row.participant_name || '',
    providerName: row.provider_name || '',
    service: row.service || '',
    date: row.date,
    time: row.time || '',
    duration: row.duration || '',
    status: row.status || 'pending',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

// ── Providers ──

export async function fetchProviders() {
  if (!isSupabaseConfigured()) return null; // signals caller to use mock data
  const { data, error } = await supabase.from('providers').select('*').order('created_at', { ascending: false });
  if (error) { console.error('fetchProviders:', error); return null; }
  return data.map(snakeToCamel);
}

export async function fetchProvider(id) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('providers').select('*').eq('id', id).single();
  if (error) { console.error('fetchProvider:', error); return null; }
  return snakeToCamel(data);
}

export async function fetchProviderByUserId(userId) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('providers').select('*').eq('user_id', userId).single();
  if (error) return null;
  return snakeToCamel(data);
}

export async function createProvider(userId, providerData) {
  if (!isSupabaseConfigured()) return null;
  const row = camelToSnake({ ...providerData, userId });
  const { data, error } = await supabase.from('providers').insert(row).select().single();
  if (error) { console.error('createProvider:', error); return null; }
  return snakeToCamel(data);
}

export async function updateProvider(id, updates) {
  if (!isSupabaseConfigured()) return null;
  const row = camelToSnake(updates);
  delete row.id;
  delete row.user_id;
  const { data, error } = await supabase.from('providers').update(row).eq('id', id).select().single();
  if (error) { console.error('updateProvider:', error); return null; }
  return snakeToCamel(data);
}

// ── Participants ──

export async function fetchParticipant(userId) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('participants').select('*').eq('user_id', userId).single();
  if (error) return null;
  return snakeToParticipant(data);
}

export async function createParticipant(userId, participantData) {
  if (!isSupabaseConfigured()) return null;
  const row = {
    user_id: userId,
    name: participantData.name,
    email: participantData.email,
    suburb: participantData.suburb || '',
    state: participantData.state || 'NSW',
    ndis_number: participantData.ndisNumber || '',
    plan_type: participantData.planType || 'Plan Managed',
    goals: participantData.goals || [],
    categories: participantData.categories || [],
    favourites: participantData.favourites || [],
  };
  const { data, error } = await supabase.from('participants').insert(row).select().single();
  if (error) { console.error('createParticipant:', error); return null; }
  return snakeToParticipant(data);
}

export async function updateParticipant(id, updates) {
  if (!isSupabaseConfigured()) return null;
  const row = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.email !== undefined) row.email = updates.email;
  if (updates.suburb !== undefined) row.suburb = updates.suburb;
  if (updates.state !== undefined) row.state = updates.state;
  if (updates.ndisNumber !== undefined) row.ndis_number = updates.ndisNumber;
  if (updates.planType !== undefined) row.plan_type = updates.planType;
  if (updates.goals !== undefined) row.goals = updates.goals;
  if (updates.categories !== undefined) row.categories = updates.categories;
  if (updates.favourites !== undefined) row.favourites = updates.favourites;
  const { data, error } = await supabase.from('participants').update(row).eq('id', id).select().single();
  if (error) { console.error('updateParticipant:', error); return null; }
  return snakeToParticipant(data);
}

// ── Reviews ──

export async function fetchReviews(providerId) {
  if (!isSupabaseConfigured()) return null;
  const query = providerId
    ? supabase.from('reviews').select('*').eq('provider_id', providerId).order('created_at', { ascending: false })
    : supabase.from('reviews').select('*').order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) { console.error('fetchReviews:', error); return null; }
  return data.map(snakeToReview);
}

export async function submitReview(reviewData) {
  if (!isSupabaseConfigured()) return null;
  const row = {
    provider_id: reviewData.providerId,
    participant_id: reviewData.participantId,
    participant_name: reviewData.participantName,
    rating: reviewData.rating,
    text: reviewData.text,
  };
  const { data, error } = await supabase.from('reviews').insert(row).select().single();
  if (error) { console.error('submitReview:', error); return null; }
  return snakeToReview(data);
}

export async function respondToReview(reviewId, response) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('reviews').update({
    response,
    response_date: new Date().toISOString().split('T')[0],
  }).eq('id', reviewId).select().single();
  if (error) { console.error('respondToReview:', error); return null; }
  return snakeToReview(data);
}

// ── Enquiries ──

export async function fetchEnquiries(userId, role) {
  if (!isSupabaseConfigured()) return null;
  // RLS handles access control — just fetch all accessible enquiries
  const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
  if (error) { console.error('fetchEnquiries:', error); return null; }
  return data.map(snakeToEnquiry);
}

export async function sendEnquiry(enquiryData) {
  if (!isSupabaseConfigured()) return null;
  const row = {
    provider_id: enquiryData.providerId,
    participant_id: enquiryData.participantId,
    participant_name: enquiryData.participantName,
    provider_name: enquiryData.providerName,
    subject: enquiryData.subject,
    status: 'active',
    messages: enquiryData.messages || [{
      from: 'participant',
      text: enquiryData.message,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }),
    }],
  };
  const { data, error } = await supabase.from('enquiries').insert(row).select().single();
  if (error) { console.error('sendEnquiry:', error); return null; }
  return snakeToEnquiry(data);
}

export async function replyEnquiry(enquiryId, message, from) {
  if (!isSupabaseConfigured()) return null;
  // Fetch current messages, append new one
  const { data: existing, error: fetchErr } = await supabase.from('enquiries').select('messages').eq('id', enquiryId).single();
  if (fetchErr) { console.error('replyEnquiry fetch:', fetchErr); return null; }
  const messages = [...(existing.messages || []), {
    from,
    text: message,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }),
  }];
  const { data, error } = await supabase.from('enquiries').update({ messages }).eq('id', enquiryId).select().single();
  if (error) { console.error('replyEnquiry:', error); return null; }
  return snakeToEnquiry(data);
}

export async function closeEnquiry(enquiryId) {
  if (!isSupabaseConfigured()) return null;
  const { error } = await supabase.from('enquiries').update({ status: 'closed' }).eq('id', enquiryId);
  if (error) { console.error('closeEnquiry:', error); return null; }
  return true;
}

// ── Bookings ──

export async function fetchBookings(userId, role) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
  if (error) { console.error('fetchBookings:', error); return null; }
  return data.map(snakeToBooking);
}

export async function createBooking(bookingData) {
  if (!isSupabaseConfigured()) return null;
  const row = {
    provider_id: bookingData.providerId,
    participant_id: bookingData.participantId,
    participant_name: bookingData.participantName,
    provider_name: bookingData.providerName,
    service: bookingData.service,
    date: bookingData.date,
    time: bookingData.time,
    duration: bookingData.duration,
    status: 'pending',
    notes: bookingData.notes || '',
  };
  const { data, error } = await supabase.from('bookings').insert(row).select().single();
  if (error) { console.error('createBooking:', error); return null; }
  return snakeToBooking(data);
}

export async function updateBooking(id, updates) {
  if (!isSupabaseConfigured()) return null;
  const row = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.notes !== undefined) row.notes = updates.notes;
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.time !== undefined) row.time = updates.time;
  const { data, error } = await supabase.from('bookings').update(row).eq('id', id).select().single();
  if (error) { console.error('updateBooking:', error); return null; }
  return snakeToBooking(data);
}

// ── Stripe helpers ──

export async function updateProviderStripe(providerId, stripeData) {
  if (!isSupabaseConfigured()) return null;
  const row = {};
  if (stripeData.stripeCustomerId) row.stripe_customer_id = stripeData.stripeCustomerId;
  if (stripeData.stripeSubscriptionId) row.stripe_subscription_id = stripeData.stripeSubscriptionId;
  if (stripeData.tier) row.tier = stripeData.tier;
  const { error } = await supabase.from('providers').update(row).eq('id', providerId);
  if (error) { console.error('updateProviderStripe:', error); return null; }
  return true;
}
