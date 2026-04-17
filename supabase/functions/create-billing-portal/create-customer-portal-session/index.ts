// Deploy this to Supabase Edge Functions as "create-customer-portal-session"
//
// Creates a Stripe Customer Portal session for the signed-in user, returning
// the URL for the front-end to redirect to. The portal lets users:
//   - Update their payment method
//   - View + download past invoices
//   - Cancel their subscription
//   - Switch between Monthly / Annual
//
// verify_jwt is false at the gateway (same pattern as create-checkout-session)
// because Supabase's edge gateway rejects ES256 tokens; auth is validated
// inside the function via supabase.auth.getUser(token).
//
// Environment variables needed:
//   STRIPE_SECRET_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SITE_URL (e.g. https://flowboss.io)
//
// Before this function can be called successfully, you MUST enable the
// Customer Portal in Stripe Dashboard → Settings → Billing → Customer portal
// (it's a one-time configuration — default settings are fine).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Not authenticated');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authError || !user) throw new Error('Not authenticated');

    // Fetch their Stripe customer id
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return new Response(
        JSON.stringify({
          error: "You don't have a billing account yet — start a subscription first.",
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://flowboss.io';

    // Create a portal session. return_url is where Stripe sends the user back
    // after they're done. We send them to /dashboard/settings so their billing
    // status (which the webhook may have just updated) is fresh when they land.
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/dashboard/settings`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    // Stripe returns a helpful error when the portal isn't configured —
    // surface it so Geoff sees what he needs to do in Stripe dashboard.
    const message = error?.message || 'Portal session creation failed';
    console.error('create-customer-portal-session:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
