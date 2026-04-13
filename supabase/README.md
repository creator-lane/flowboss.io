# FlowBoss Supabase Setup

## Step 1: Run the GC Migration SQL
1. Go to Supabase Dashboard → SQL Editor
2. Paste the contents of `gc-migration.sql`
3. Click "Run"
This creates the GC tables + subscription columns.

## Step 2: Set up Stripe Products
1. Go to Stripe Dashboard → Products
2. Create a product "FlowBoss Pro"
3. Add two prices:
   - Monthly: $29.99/month (recurring)
   - Annual: $199.99/year (recurring)
4. Copy the Price IDs (starts with "price_")

## Step 3: Deploy Edge Functions
Deploy each function via Supabase CLI or Dashboard:

### create-checkout-session
- Function name: `create-checkout-session`
- File: `functions/create-checkout-session.ts`
- Environment variables:
  - STRIPE_SECRET_KEY
  - STRIPE_MONTHLY_PRICE_ID (from Step 2)
  - STRIPE_ANNUAL_PRICE_ID (from Step 2)
  - SITE_URL = https://flowboss.io

### stripe-webhook
- Function name: `stripe-webhook`
- File: `functions/stripe-webhook.ts`
- Environment variables:
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET (from Stripe webhook setup)
- After deploying, add the function URL as a webhook endpoint in Stripe:
  - URL: https://besbtasjpqmfqjkudmgu.supabase.co/functions/v1/stripe-webhook
  - Events: checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.deleted, customer.subscription.updated

### create-billing-portal
- Function name: `create-billing-portal`
- File: `functions/create-billing-portal.ts`
- Environment variables:
  - STRIPE_SECRET_KEY
  - SITE_URL = https://flowboss.io
