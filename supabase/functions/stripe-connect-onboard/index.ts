// Supabase Edge Function: stripe-connect-onboard
//
// Connects the authenticated FlowBoss user to a Stripe account so they
// can collect card payments from THEIR customers via Stripe Checkout
// payment links. Returns either:
//   { connected: true,  accountId }   — already onboarded
//   { connected: false, url, accountId } — onboarding URL to open
//
// ── Architectural intent (READ FIRST) ────────────────────────────────
//
// FlowBoss is SaaS, NOT a marketplace. Contractors use their own Stripe
// to invoice their own customers; money flows directly to their bank;
// FlowBoss takes ZERO application fees and never sees the funds. This
// is fundamentally different from the Express/Custom "platform owns
// the connected accounts" model that Connect's defaults steer you
// toward. Hard to remember when you're staring at the Stripe docs at
// 2am — Express looks easier — DON'T REVERT THIS.
//
// Account type: STANDARD (not Express, not Custom).
//   - Standard accounts are owned by the contractor, full Stripe
//     dashboard access, FlowBoss has API access via the connected
//     account ID stored in profiles.stripe_account_id.
//   - Stripe's hosted onboarding for Standard accounts handles the
//     "do you have an existing Stripe account at this email?"
//     branch automatically — if yes, contractor signs in and links
//     their existing account; if no, Stripe walks them through a
//     fresh signup. We don't have to ask the question ourselves
//     (which is what the old Express flow forced us to consider).
//
// If Stripe rejects type:'standard' with "Standard accounts are not
// available on this platform", you need to file a support ticket with
// Stripe to enable Standard mode for your platform. Until they
// approve, the function will fail and contractors won't be able to
// connect — that's the correct failure mode (loud, not silent), so
// we know to chase the ticket. Don't fall back to Express silently.
//
// Required Supabase secrets:
//   STRIPE_SECRET_KEY          — live secret key (sk_live_...)
//   SUPABASE_URL               — auto
//   SUPABASE_SERVICE_ROLE_KEY  — auto

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno&no-check';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Server misconfigured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Pull existing profile so we can pre-fill what we know — the
    // less the contractor types into Stripe's hosted form, the higher
    // the activation conversion. business_name lands in
    // business_profile.name; the user's auth email is what Stripe
    // uses to recognize and offer to link an existing Stripe account.
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete, business_name, business_email, phone')
      .eq('id', user.id)
      .single();

    let accountId = profile?.stripe_account_id;

    // Already onboarded? Confirm with Stripe (charges_enabled means
    // they can actually accept money) and short-circuit.
    if (accountId && profile?.stripe_onboarding_complete) {
      try {
        const account = await stripe.accounts.retrieve(accountId);
        if (account.charges_enabled) {
          return json({ connected: true, accountId }, 200);
        }
      } catch (retrieveErr) {
        // Account might have been deleted on Stripe's side. Drop the
        // stale ID and fall through to create a new one.
        console.warn('stale stripe_account_id, recreating:', retrieveErr);
        accountId = null;
        await supabaseAdmin
          .from('profiles')
          .update({ stripe_account_id: null, stripe_onboarding_complete: false })
          .eq('id', user.id);
      }
    }

    if (!accountId) {
      // STANDARD account = the contractor owns it.
      //   - email is the linchpin: Stripe uses it during hosted
      //     onboarding to detect existing Stripe accounts and offer
      //     "sign in to link" instead of "create new". This is what
      //     gives users with an existing Stripe a 30-second connect
      //     experience instead of redoing KYC from scratch.
      //   - business_profile is best-effort prefill; contractor can
      //     edit during onboarding.
      //   - No `capabilities` block: Standard accounts manage their
      //     own capabilities through their own Stripe dashboard.
      const account = await stripe.accounts.create({
        type: 'standard',
        email: user.email ?? profile?.business_email ?? undefined,
        business_profile: {
          name: profile?.business_name ?? undefined,
          support_email: profile?.business_email ?? user.email ?? undefined,
          support_phone: profile?.phone ?? undefined,
        },
        metadata: {
          flowboss_user_id: user.id,
        },
      });

      accountId = account.id;

      await supabaseAdmin
        .from('profiles')
        .update({
          stripe_account_id: accountId,
          stripe_onboarding_complete: false,
        })
        .eq('id', user.id);
    }

    // AccountLink for hosted onboarding. Standard accounts use the
    // same `account_onboarding` link type as Express; Stripe handles
    // the "existing or new account" branch inside their hosted UI.
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      return_url: 'https://flowboss.io/stripe-connect?success=true',
      refresh_url: 'https://flowboss.io/stripe-connect?refresh=true',
    });

    return json({ connected: false, url: accountLink.url, accountId }, 200);
  } catch (err: any) {
    console.error('stripe-connect-onboard error:', err.message);
    return json({ error: err.message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
