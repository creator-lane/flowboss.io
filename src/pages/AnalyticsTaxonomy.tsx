import { useState } from 'react';

type Status = 'live' | 'defined';

interface EventParam {
  name: string;
  type: string;
  description: string;
}

interface AnalyticsEvent {
  name: string;
  category: string;
  status: Status;
  definition: string;
  params: EventParam[];
}

const EVENTS: AnalyticsEvent[] = [
  // ─── ONBOARDING ───────────────────────────────────────────
  {
    name: 'onboarding_started',
    category: 'Onboarding',
    status: 'live',
    definition: 'Fired when a user begins the onboarding flow on the Welcome screen.',
    params: [
      { name: 'variant', type: 'string', description: 'A/B test variant (default: "default")' },
      { name: 'timestamp', type: 'number', description: 'Unix ms when onboarding started' },
    ],
  },
  {
    name: 'onboarding_trade_selected',
    category: 'Onboarding',
    status: 'live',
    definition: 'Fired when a user selects their trade (plumbing, HVAC, electrical) during onboarding.',
    params: [
      { name: 'trade', type: 'string', description: 'Selected trade: "plumbing" | "hvac" | "electrical"' },
    ],
  },
  {
    name: 'onboarding_team_size_selected',
    category: 'Onboarding',
    status: 'live',
    definition: 'Fired when a user selects their team size during onboarding.',
    params: [
      { name: 'team_size', type: 'string', description: 'Selected team size option (e.g. "solo", "2–5", "6+")' },
    ],
  },
  {
    name: 'onboarding_step_completed',
    category: 'Onboarding',
    status: 'live',
    definition: 'Fired on completion of each onboarding screen. Used to measure funnel drop-off per step.',
    params: [
      { name: 'step', type: 'string', description: 'Step identifier (e.g. "welcome", "trade", "company", "paywall")' },
      { name: 'step_index', type: 'number', description: 'Zero-based index of the step in the flow' },
      { name: 'total_steps', type: 'number', description: 'Total number of onboarding steps' },
    ],
  },
  {
    name: 'onboarding_pre_paywall_completed',
    category: 'Onboarding',
    status: 'live',
    definition: 'Fired when a user completes all pre-paywall onboarding steps and reaches the paywall for the first time.',
    params: [
      { name: 'total_duration_ms', type: 'number', description: 'Total time spent in onboarding before hitting paywall' },
    ],
  },
  {
    name: 'company_info_completed',
    category: 'Onboarding',
    status: 'live',
    definition: 'Fired when a user submits their company info (business name, phone, ZIP) during onboarding.',
    params: [
      { name: 'has_business_name', type: 'boolean', description: 'Whether the user entered a business name' },
      { name: 'has_phone', type: 'boolean', description: 'Whether the user entered a phone number' },
      { name: 'has_zip', type: 'boolean', description: 'Whether the user entered a ZIP code' },
      { name: 'zip', type: 'string', description: 'ZIP code entered (for geo analysis)' },
    ],
  },
  {
    name: 'first_open',
    category: 'Onboarding',
    status: 'defined',
    definition: 'Intended to fire on first app open, before any onboarding. Not yet wired up — Firebase auto-tracks this natively.',
    params: [],
  },
  {
    name: 'onboarding_coach_mark_viewed',
    category: 'Onboarding',
    status: 'defined',
    definition: 'Intended to fire each time a coach mark / guided tip is shown during onboarding.',
    params: [
      { name: 'step', type: 'number', description: 'Coach mark step number' },
      { name: 'step_name', type: 'string', description: 'Human-readable name of the coach mark' },
      { name: 'total_steps', type: 'number', description: 'Total coach marks in the sequence' },
    ],
  },
  {
    name: 'onboarding_tour_completed',
    category: 'Onboarding',
    status: 'defined',
    definition: 'Intended to fire when a user completes the full guided tour.',
    params: [
      { name: 'total_dwell_ms', type: 'number', description: 'Total milliseconds spent in the tour' },
    ],
  },
  {
    name: 'onboarding_tour_skipped',
    category: 'Onboarding',
    status: 'defined',
    definition: 'Intended to fire when a user skips the guided tour.',
    params: [
      { name: 'skipped_at_step', type: 'number', description: 'Step index where the user skipped' },
      { name: 'total_steps', type: 'number', description: 'Total steps in the tour' },
    ],
  },
  {
    name: 'onboarding_pain_points_selected',
    category: 'Onboarding',
    status: 'defined',
    definition: 'Intended to fire when a user selects their pain points (invoicing, scheduling, etc.) during onboarding.',
    params: [
      { name: 'pain_points', type: 'string', description: 'Comma-separated list of selected pain points' },
      { name: 'pain_point_count', type: 'number', description: 'Number of pain points selected' },
    ],
  },

  // ─── PAYWALL ──────────────────────────────────────────────
  {
    name: 'paywall_viewed',
    category: 'Paywall',
    status: 'live',
    definition: 'Fired when the paywall screen is displayed to the user.',
    params: [
      { name: 'trigger', type: 'string', description: 'What caused the paywall to appear (e.g. "onboarding", "feature_gate")' },
      { name: 'variant', type: 'string', description: 'Paywall variant for A/B testing (default: "default")' },
      { name: 'timestamp', type: 'number', description: 'Unix ms when paywall was shown' },
    ],
  },
  {
    name: 'trial_started',
    category: 'Paywall',
    status: 'live',
    definition: 'Fired when a user starts a free trial. Sent alongside in_app_purchase for trial transactions.',
    params: [
      { name: 'product_id', type: 'string', description: 'StoreKit product ID (e.g. "com.flowboss.app.pro.annual")' },
      { name: 'plan_name', type: 'string', description: 'Human-readable plan name ("Annual" | "Monthly")' },
      { name: 'trial_days', type: 'number', description: 'Length of the trial in days' },
      { name: 'timestamp', type: 'number', description: 'Unix ms when trial started' },
    ],
  },
  {
    name: 'in_app_purchase',
    category: 'Paywall',
    status: 'live',
    definition: 'Fired on every subscription purchase or trial start. Maps to the standard Google Play / Firebase purchase event.',
    params: [
      { name: 'product_id', type: 'string', description: 'StoreKit / Play product ID' },
      { name: 'price', type: 'number', description: 'Price in local currency (0.00 for trials)' },
      { name: 'currency', type: 'string', description: 'ISO 4217 currency code (e.g. "USD")' },
      { name: 'plan_name', type: 'string', description: '"Annual" | "Monthly"' },
      { name: 'plan_duration', type: 'string', description: '"monthly" | "annual"' },
      { name: 'is_trial', type: 'boolean', description: 'Whether this is a free trial start' },
      { name: 'transaction_id', type: 'string', description: 'Platform transaction ID' },
      { name: 'coupon_code', type: 'string', description: 'Promo/coupon code applied (if any)' },
      { name: 'attribution_source', type: 'string', description: 'AppsFlyer attribution source (if available)' },
      { name: 'value', type: 'number', description: 'Revenue value for Firebase (0 for trials)' },
      { name: 'timestamp', type: 'number', description: 'Unix ms when purchase occurred' },
    ],
  },
  {
    name: 'paywall_cta_tapped',
    category: 'Paywall',
    status: 'defined',
    definition: 'Intended to fire when the user taps the main CTA button on the paywall.',
    params: [
      { name: 'plan_id', type: 'string', description: 'Which plan was selected ("annual" | "monthly")' },
      { name: 'trigger', type: 'string', description: 'What triggered the paywall' },
      { name: 'cta_text', type: 'string', description: 'Text on the CTA button' },
    ],
  },
  {
    name: 'paywall_dismissed',
    category: 'Paywall',
    status: 'defined',
    definition: 'Intended to fire when the user closes or dismisses the paywall without purchasing.',
    params: [
      { name: 'trigger', type: 'string', description: 'What triggered the paywall' },
      { name: 'dwell_ms', type: 'number', description: 'Time spent on paywall before dismissing' },
    ],
  },
  {
    name: 'helium_paywall_presented',
    category: 'Paywall',
    status: 'defined',
    definition: 'Intended to fire when Helium successfully presents its native paywall overlay.',
    params: [
      { name: 'trigger', type: 'string', description: 'Helium trigger ID that caused the paywall' },
      { name: 'paywall_id', type: 'string', description: 'Helium paywall configuration ID' },
    ],
  },
  {
    name: 'helium_paywall_closed',
    category: 'Paywall',
    status: 'defined',
    definition: 'Intended to fire when Helium\'s paywall is closed.',
    params: [
      { name: 'trigger', type: 'string', description: 'Helium trigger ID' },
      { name: 'outcome', type: 'string', description: '"purchased" | "dismissed" | "error"' },
    ],
  },
  {
    name: 'helium_purchase_completed',
    category: 'Paywall',
    status: 'defined',
    definition: 'Intended to fire when a purchase is completed through the Helium paywall.',
    params: [
      { name: 'trigger', type: 'string', description: 'Helium trigger ID' },
      { name: 'product_id', type: 'string', description: 'StoreKit product ID of the purchased plan' },
    ],
  },
  {
    name: 'subscription_renewed',
    category: 'Paywall',
    status: 'defined',
    definition: 'Intended to fire when a subscription renews (server-side webhook → analytics call).',
    params: [
      { name: 'product_id', type: 'string', description: 'StoreKit product ID' },
      { name: 'price', type: 'number', description: 'Renewal price' },
      { name: 'currency', type: 'string', description: 'ISO currency code' },
      { name: 'plan_name', type: 'string', description: 'Plan display name' },
      { name: 'plan_duration', type: 'string', description: '"monthly" | "annual"' },
      { name: 'renewal_count', type: 'number', description: 'How many times this sub has renewed' },
      { name: 'original_transaction_id', type: 'string', description: 'Original purchase transaction ID' },
      { name: 'value', type: 'number', description: 'Revenue value for Firebase' },
      { name: 'timestamp', type: 'number', description: 'Unix ms of renewal' },
    ],
  },
  {
    name: 'subscription_canceled',
    category: 'Paywall',
    status: 'defined',
    definition: 'Intended to fire when a subscription is canceled.',
    params: [
      { name: 'product_id', type: 'string', description: 'StoreKit product ID' },
      { name: 'plan_name', type: 'string', description: 'Plan display name' },
      { name: 'plan_duration', type: 'string', description: '"monthly" | "annual"' },
      { name: 'cancel_reason', type: 'string', description: '"user" | "billing" | "developer" | "system" | "unknown"' },
      { name: 'days_subscribed', type: 'number', description: 'Total days active before cancel' },
      { name: 'renewal_count', type: 'number', description: 'Number of successful renewals before cancel' },
      { name: 'was_trial', type: 'boolean', description: 'Whether the user was on a trial' },
      { name: 'timestamp', type: 'number', description: 'Unix ms of cancellation' },
    ],
  },
  {
    name: 'trial_converted',
    category: 'Paywall',
    status: 'defined',
    definition: 'Intended to fire when a free trial converts to a paid subscription.',
    params: [
      { name: 'product_id', type: 'string', description: 'StoreKit product ID' },
      { name: 'plan_name', type: 'string', description: 'Plan display name' },
      { name: 'trial_days_used', type: 'number', description: 'Days of trial used before conversion' },
      { name: 'timestamp', type: 'number', description: 'Unix ms of conversion' },
    ],
  },

  // ─── JOBS ─────────────────────────────────────────────────
  {
    name: 'job_created',
    category: 'Jobs',
    status: 'defined',
    definition: 'Intended to fire whenever a new job is created.',
    params: [
      { name: 'job_type', type: 'string', description: 'Categorized job type (e.g. "Water Heater", "Drain Clearing")' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo/seed data' },
      { name: 'source', type: 'string', description: 'How job was created ("manual" | "ai_suggestion" | "import")' },
      { name: 'scheduled_date', type: 'string', description: 'ISO date string if job is scheduled' },
    ],
  },
  {
    name: 'job_status_changed',
    category: 'Jobs',
    status: 'defined',
    definition: 'Intended to fire when a job\'s status changes (e.g. pending → complete).',
    params: [
      { name: 'job_id', type: 'string', description: 'Unique job identifier' },
      { name: 'from_status', type: 'string', description: 'Previous status' },
      { name: 'to_status', type: 'string', description: 'New status' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo data' },
    ],
  },
  {
    name: 'job_completed',
    category: 'Jobs',
    status: 'defined',
    definition: 'Intended to fire when a job is marked complete. High-value event for engagement/retention analysis.',
    params: [
      { name: 'job_id', type: 'string', description: 'Unique job identifier' },
      { name: 'job_type', type: 'string', description: 'Categorized job type' },
      { name: 'revenue', type: 'number', description: 'Revenue associated with the job' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo data' },
      { name: 'duration_minutes', type: 'number', description: 'Time from scheduled start to completion' },
      { name: 'value', type: 'number', description: 'Revenue value for Firebase' },
    ],
  },
  {
    name: 'job_viewed',
    category: 'Jobs',
    status: 'defined',
    definition: 'Intended to fire when a user opens a job detail screen.',
    params: [
      { name: 'job_id', type: 'string', description: 'Unique job identifier' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo data' },
    ],
  },
  {
    name: 'job_deleted',
    category: 'Jobs',
    status: 'defined',
    definition: 'Intended to fire when a job is deleted.',
    params: [
      { name: 'job_id', type: 'string', description: 'Unique job identifier' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo data' },
    ],
  },

  // ─── INVOICES ─────────────────────────────────────────────
  {
    name: 'invoice_created',
    category: 'Invoices',
    status: 'defined',
    definition: 'Intended to fire when a new invoice is created.',
    params: [
      { name: 'invoice_id', type: 'string', description: 'Unique invoice identifier' },
      { name: 'amount', type: 'number', description: 'Invoice total amount' },
      { name: 'line_item_count', type: 'number', description: 'Number of line items on the invoice' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo data' },
      { name: 'customer_id', type: 'string', description: 'Customer the invoice is for' },
      { name: 'value', type: 'number', description: 'Revenue value for Firebase' },
    ],
  },
  {
    name: 'invoice_sent',
    category: 'Invoices',
    status: 'defined',
    definition: 'Intended to fire when an invoice is sent to a customer.',
    params: [
      { name: 'invoice_id', type: 'string', description: 'Unique invoice identifier' },
      { name: 'amount', type: 'number', description: 'Invoice total' },
      { name: 'delivery_method', type: 'string', description: '"email" | "sms" | "share"' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo data' },
      { name: 'value', type: 'number', description: 'Revenue value for Firebase' },
    ],
  },
  {
    name: 'invoice_paid',
    category: 'Invoices',
    status: 'defined',
    definition: 'Intended to fire when an invoice is marked as paid. Key LTV indicator.',
    params: [
      { name: 'invoice_id', type: 'string', description: 'Unique invoice identifier' },
      { name: 'amount', type: 'number', description: 'Amount paid' },
      { name: 'payment_method', type: 'string', description: 'How payment was received (e.g. "stripe", "cash", "check")' },
      { name: 'days_to_payment', type: 'number', description: 'Days from invoice creation to payment' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo data' },
      { name: 'value', type: 'number', description: 'Revenue value for Firebase' },
    ],
  },
  {
    name: 'invoice_viewed',
    category: 'Invoices',
    status: 'defined',
    definition: 'Intended to fire when a user opens an invoice detail screen.',
    params: [
      { name: 'invoice_id', type: 'string', description: 'Unique invoice identifier' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo data' },
    ],
  },
  {
    name: 'invoice_overdue',
    category: 'Invoices',
    status: 'defined',
    definition: 'Intended to fire when an invoice passes its due date without payment.',
    params: [
      { name: 'invoice_id', type: 'string', description: 'Unique invoice identifier' },
      { name: 'amount', type: 'number', description: 'Overdue amount' },
      { name: 'days_overdue', type: 'number', description: 'Days past due date' },
      { name: 'value', type: 'number', description: 'Overdue amount for Firebase' },
    ],
  },

  // ─── ESTIMATES ────────────────────────────────────────────
  {
    name: 'estimate_created',
    category: 'Estimates',
    status: 'defined',
    definition: 'Intended to fire when a new estimate is created.',
    params: [
      { name: 'estimate_id', type: 'string', description: 'Unique estimate identifier' },
      { name: 'amount', type: 'number', description: 'Estimate total' },
      { name: 'line_item_count', type: 'number', description: 'Number of line items' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo data' },
      { name: 'value', type: 'number', description: 'Estimated value for Firebase' },
    ],
  },
  {
    name: 'estimate_sent',
    category: 'Estimates',
    status: 'defined',
    definition: 'Intended to fire when an estimate is sent to a customer.',
    params: [
      { name: 'estimate_id', type: 'string', description: 'Unique estimate identifier' },
      { name: 'amount', type: 'number', description: 'Estimate total' },
      { name: 'delivery_method', type: 'string', description: '"email" | "sms" | "share"' },
      { name: 'value', type: 'number', description: 'Estimated value for Firebase' },
    ],
  },
  {
    name: 'estimate_approved',
    category: 'Estimates',
    status: 'defined',
    definition: 'Intended to fire when a customer approves an estimate.',
    params: [
      { name: 'estimate_id', type: 'string', description: 'Unique estimate identifier' },
      { name: 'amount', type: 'number', description: 'Approved estimate amount' },
      { name: 'days_to_approval', type: 'number', description: 'Days from send to approval' },
      { name: 'value', type: 'number', description: 'Approved value for Firebase' },
    ],
  },
  {
    name: 'estimate_declined',
    category: 'Estimates',
    status: 'defined',
    definition: 'Intended to fire when a customer declines an estimate.',
    params: [
      { name: 'estimate_id', type: 'string', description: 'Unique estimate identifier' },
      { name: 'amount', type: 'number', description: 'Declined estimate amount' },
      { name: 'value', type: 'number', description: 'Declined value for Firebase' },
    ],
  },

  // ─── CUSTOMERS ────────────────────────────────────────────
  {
    name: 'customer_created',
    category: 'Customers',
    status: 'defined',
    definition: 'Intended to fire when a new customer record is created.',
    params: [
      { name: 'customer_id', type: 'string', description: 'Unique customer identifier' },
      { name: 'source', type: 'string', description: '"manual" | "import" | "referral"' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo data' },
      { name: 'has_email', type: 'boolean', description: 'Whether an email was provided' },
      { name: 'has_phone', type: 'boolean', description: 'Whether a phone number was provided' },
      { name: 'has_address', type: 'boolean', description: 'Whether an address was provided' },
    ],
  },
  {
    name: 'customer_viewed',
    category: 'Customers',
    status: 'defined',
    definition: 'Intended to fire when a user opens a customer detail screen.',
    params: [
      { name: 'customer_id', type: 'string', description: 'Unique customer identifier' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo data' },
    ],
  },
  {
    name: 'customer_updated',
    category: 'Customers',
    status: 'defined',
    definition: 'Intended to fire when a customer record is edited.',
    params: [
      { name: 'customer_id', type: 'string', description: 'Unique customer identifier' },
      { name: 'fields_updated', type: 'string', description: 'Comma-separated list of fields changed' },
      { name: 'field_count', type: 'number', description: 'Number of fields changed' },
    ],
  },
  {
    name: 'customer_deleted',
    category: 'Customers',
    status: 'defined',
    definition: 'Intended to fire when a customer record is deleted.',
    params: [
      { name: 'customer_id', type: 'string', description: 'Unique customer identifier' },
    ],
  },

  // ─── EXPENSES ─────────────────────────────────────────────
  {
    name: 'expense_created',
    category: 'Expenses',
    status: 'defined',
    definition: 'Intended to fire when a new expense is logged.',
    params: [
      { name: 'expense_id', type: 'string', description: 'Unique expense identifier' },
      { name: 'category', type: 'string', description: 'Expense category (e.g. "materials", "fuel", "tools")' },
      { name: 'amount', type: 'number', description: 'Expense amount' },
      { name: 'has_receipt', type: 'boolean', description: 'Whether a receipt photo was attached' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this is demo data' },
      { name: 'value', type: 'number', description: 'Expense amount for Firebase' },
    ],
  },

  // ─── ENGAGEMENT ───────────────────────────────────────────
  {
    name: 'push_permission_requested',
    category: 'Engagement',
    status: 'live',
    definition: 'Fired when the OS push notification permission prompt is shown and the user responds.',
    params: [
      { name: 'granted', type: 'boolean', description: 'Whether the user granted push notification permission' },
    ],
  },
  {
    name: 'route_optimized',
    category: 'Engagement',
    status: 'defined',
    definition: 'Intended to fire when a user optimizes their daily route.',
    params: [
      { name: 'job_count', type: 'number', description: 'Number of jobs in the route' },
      { name: 'estimated_savings_minutes', type: 'number', description: 'Estimated drive time saved in minutes' },
      { name: 'is_demo', type: 'boolean', description: 'Whether this used demo data' },
    ],
  },
  {
    name: 'route_navigated',
    category: 'Engagement',
    status: 'defined',
    definition: 'Intended to fire when a user taps to navigate to a job from the route screen.',
    params: [
      { name: 'job_id', type: 'string', description: 'Job being navigated to' },
      { name: 'navigation_provider', type: 'string', description: '"apple_maps" | "google_maps" | "waze"' },
    ],
  },
  {
    name: 'feature_used',
    category: 'Engagement',
    status: 'defined',
    definition: 'Generic event intended to track usage of major features not covered by specific events.',
    params: [
      { name: 'feature', type: 'string', description: 'Feature name (e.g. "pricebook", "insights", "project_view")' },
      { name: 'context', type: 'string', description: 'Screen or context where it was used' },
    ],
  },
  {
    name: 'pricebook_item_used',
    category: 'Engagement',
    status: 'defined',
    definition: 'Intended to fire when a user adds a pricebook item to an invoice or estimate.',
    params: [
      { name: 'item_id', type: 'string', description: 'Pricebook item identifier' },
      { name: 'price', type: 'number', description: 'Price of the item used' },
    ],
  },
  {
    name: 'photo_attached',
    category: 'Engagement',
    status: 'defined',
    definition: 'Intended to fire when a photo is attached to a job, project, or expense.',
    params: [
      { name: 'context', type: 'string', description: '"job" | "project" | "expense"' },
      { name: 'photo_count', type: 'number', description: 'Total photos after this attachment' },
    ],
  },
  {
    name: 'content_shared',
    category: 'Engagement',
    status: 'defined',
    definition: 'Intended to fire when a user shares an invoice, estimate, or report.',
    params: [
      { name: 'content_type', type: 'string', description: '"invoice" | "estimate" | "report"' },
      { name: 'share_method', type: 'string', description: 'iOS/Android share sheet method used' },
    ],
  },
  {
    name: 'session_started',
    category: 'Engagement',
    status: 'defined',
    definition: 'Intended to fire at the start of each app session for retention analysis.',
    params: [
      { name: 'session_number', type: 'number', description: 'Cumulative session count for this user' },
    ],
  },
  {
    name: 'search_performed',
    category: 'Engagement',
    status: 'defined',
    definition: 'Intended to fire when a user performs a search within the app.',
    params: [
      { name: 'search_term', type: 'string', description: 'Anonymized/hashed search term (no PII)' },
      { name: 'result_count', type: 'number', description: 'Number of results returned' },
      { name: 'context', type: 'string', description: 'Screen where search was performed' },
    ],
  },
  {
    name: 'guided_checklist_item_completed',
    category: 'Engagement',
    status: 'defined',
    definition: 'Intended to fire when a user completes an item in the guided setup checklist.',
    params: [
      { name: 'item_id', type: 'string', description: 'Checklist item identifier' },
      { name: 'item_index', type: 'number', description: 'Position in the checklist' },
      { name: 'completed_count', type: 'number', description: 'Total items completed so far' },
      { name: 'total_count', type: 'number', description: 'Total items in checklist' },
      { name: 'progress_pct', type: 'number', description: 'Completion percentage (0–100)' },
    ],
  },
  {
    name: 'guided_onboarding_completed',
    category: 'Engagement',
    status: 'defined',
    definition: 'Intended to fire when a user completes all items in the guided setup checklist.',
    params: [
      { name: 'total_duration_ms', type: 'number', description: 'Total time from first open to checklist completion' },
      { name: 'completed_count', type: 'number', description: 'Items completed' },
      { name: 'total_count', type: 'number', description: 'Total items in checklist' },
    ],
  },
  {
    name: 'rating_prompt_shown',
    category: 'Engagement',
    status: 'defined',
    definition: 'Intended to fire when the in-app review prompt is displayed.',
    params: [],
  },
  {
    name: 'rating_submitted',
    category: 'Engagement',
    status: 'defined',
    definition: 'Intended to fire when a user submits a rating through the in-app review prompt.',
    params: [
      { name: 'rating', type: 'number', description: 'Star rating (1–5)' },
    ],
  },

  // ─── ERRORS ───────────────────────────────────────────────
  {
    name: 'api_error',
    category: 'Errors',
    status: 'defined',
    definition: 'Intended to fire when an API call fails, for error rate monitoring.',
    params: [
      { name: 'endpoint', type: 'string', description: 'API endpoint that failed' },
      { name: 'status_code', type: 'number', description: 'HTTP status code returned' },
      { name: 'error_message', type: 'string', description: 'Sanitized error message' },
    ],
  },
  {
    name: 'payment_error',
    category: 'Errors',
    status: 'defined',
    definition: 'Intended to fire when a payment or subscription purchase fails.',
    params: [
      { name: 'provider', type: 'string', description: '"stripe" | "apple" | "google"' },
      { name: 'error_code', type: 'string', description: 'Provider-specific error code' },
      { name: 'amount', type: 'number', description: 'Transaction amount that failed' },
    ],
  },
  {
    name: 'js_exception',
    category: 'Errors',
    status: 'defined',
    definition: 'Intended to fire on unhandled JS exceptions. Also sent to Firebase Crashlytics.',
    params: [
      { name: 'error_name', type: 'string', description: 'Exception class name' },
      { name: 'error_message', type: 'string', description: 'Exception message' },
      { name: 'context', type: 'string', description: 'Screen or function where exception occurred' },
    ],
  },
];

const CATEGORIES = ['All', 'Onboarding', 'Paywall', 'Jobs', 'Invoices', 'Estimates', 'Customers', 'Expenses', 'Engagement', 'Errors'];

const LIVE_COUNT = EVENTS.filter(e => e.status === 'live').length;
const DEFINED_COUNT = EVENTS.filter(e => e.status === 'defined').length;

export function AnalyticsTaxonomy() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'defined'>('all');
  const [search, setSearch] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const filtered = EVENTS.filter(e => {
    if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.definition.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Header */}
      <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide mb-2">Internal Reference</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Taxonomy</h1>
      <p className="text-sm text-gray-500 mb-8">FlowBoss · Firebase Analytics + AppsFlyer · Last updated April 2026</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-3xl font-bold text-gray-900">{EVENTS.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total events defined</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-3xl font-bold text-green-700">{LIVE_COUNT}</p>
          <p className="text-sm text-green-600 mt-1">Live (firing in production)</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-3xl font-bold text-amber-700">{DEFINED_COUNT}</p>
          <p className="text-sm text-amber-600 mt-1">Defined, not yet wired up</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex gap-2">
          {(['all', 'live', 'defined'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'All' : s === 'live' ? '🟢 Live' : '🟡 Defined'}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              selectedCategory === cat
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
            <span className="ml-1.5 opacity-60">
              {cat === 'All' ? EVENTS.length : EVENTS.filter(e => e.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</p>

      {/* Event list */}
      <div className="space-y-2">
        {filtered.map(event => {
          const isOpen = expandedEvent === event.name;
          return (
            <div
              key={event.name}
              className="border border-gray-200 rounded-xl overflow-hidden bg-white"
            >
              <button
                onClick={() => setExpandedEvent(isOpen ? null : event.name)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`flex-shrink-0 w-2 h-2 rounded-full ${event.status === 'live' ? 'bg-green-500' : 'bg-amber-400'}`} />
                  <code className="text-sm font-mono font-semibold text-gray-900 truncate">{event.name}</code>
                  <span className="hidden sm:inline-flex flex-shrink-0 items-center px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-medium">
                    {event.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    event.status === 'live'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {event.status === 'live' ? 'Live' : 'Defined'}
                  </span>
                  <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  <p className="text-sm text-gray-700 mb-4">{event.definition}</p>

                  {event.params.length > 0 ? (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Parameters</p>
                      <div className="rounded-lg overflow-hidden border border-gray-200">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100 text-left">
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 w-1/4">Name</th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 w-1/6">Type</th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {event.params.map(param => (
                              <tr key={param.name}>
                                <td className="px-4 py-2.5">
                                  <code className="text-xs font-mono text-blue-600">{param.name}</code>
                                </td>
                                <td className="px-4 py-2.5">
                                  <code className="text-xs font-mono text-gray-500">{param.type}</code>
                                </td>
                                <td className="px-4 py-2.5 text-xs text-gray-600">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No parameters</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-medium">No events match your filters</p>
            <p className="text-sm mt-1">Try adjusting your search or category</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-10 pt-8 border-t border-gray-200 flex flex-wrap gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" /><span><strong className="text-gray-700">Live</strong> — firing in production builds</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" /><span><strong className="text-gray-700">Defined</strong> — schema exists in analytics.ts, not yet called</span></div>
      </div>
    </div>
  );
}
