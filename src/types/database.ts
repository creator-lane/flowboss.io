// Domain types for the FlowBoss web dashboard.
//
// These describe the UI-facing shape — i.e. what consumers see AFTER
// `camelify()` has run over a Supabase row. DB columns are snake_case; these
// types are camelCase with the original snake_case keys also present on the
// object (camelify preserves both for backwards compat), so either access
// pattern works at runtime. We type only the camelCase surface here because
// that's what new code should prefer.
//
// Not every column on every table is modeled. Start with the fields actually
// read by UI today; extend as new fields land. The Supabase schema is the
// source of truth — if you add a column there, update this file.
//
// Nothing in this file imports from Supabase SDK types — the intent is a
// hand-rolled, stable UI contract, not a generated DB mirror.

// -- Shared primitives --------------------------------------------------------

export type UUID = string;
export type ISODateString = string; // e.g. "2026-04-22T14:30:00Z"

// `camelify()` preserves BOTH snake_case and camelCase keys on the same object
// at runtime, for backwards compat with pre-camelify call sites. Consumers
// routinely read either form. To keep TypeScript honest without fighting every
// legacy read, every entity interface extends this base — it pins the known
// fields for autocomplete while permitting snake_case/untyped access to fall
// through as `any`. Shrink the index signature surface incrementally as code
// migrates to camelCase-only access.
export interface SupabaseRow {
  [key: string]: any;
}

export type JobStatus = 'SCHEDULED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED';
export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | null;

export type SubscriptionPlan = 'starter' | 'pro' | 'gc' | null;

// -- Core business entities ---------------------------------------------------

export interface Profile extends SupabaseRow {
  id: UUID;
  userId: UUID;
  businessName?: string | null;
  trade?: string | null;
  phone?: string | null;
  email?: string | null;
  stripeAccountId?: string | null;
  stripeCustomerId?: string | null;
  stripeOnboardingComplete?: boolean | null;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionId?: string | null;
  subscriptionCurrentPeriodEnd?: ISODateString | null;
  fcmToken?: string | null;
  digestPreference?: 'none' | 'daily' | 'weekly' | null;
  digestEmail?: string | null;
}

export interface Customer extends SupabaseRow {
  id: UUID;
  userId: UUID;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  vip?: boolean | null;
  createdAt?: ISODateString;
}

export interface Property extends SupabaseRow {
  id: UUID;
  customerId: UUID;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
}

export interface JobLineItem extends SupabaseRow {
  id: UUID;
  jobId: UUID;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Job extends SupabaseRow {
  id: UUID;
  userId: UUID;
  customerId?: UUID | null;
  propertyId?: UUID | null;
  description?: string | null;
  status: JobStatus;
  priority?: JobPriority | null;
  scheduledStart?: ISODateString | null;
  scheduledEnd?: ISODateString | null;
  startedAt?: ISODateString | null;
  completedAt?: ISODateString | null;
  estimatedDuration?: number | null;
  notes?: string | null;
  // Joined / embedded
  customer?: Customer | null;
  property?: Property | null;
  lineItems?: JobLineItem[];
}

export interface InvoiceLineItem extends SupabaseRow {
  id: UUID;
  invoiceId: UUID;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice extends SupabaseRow {
  id: UUID;
  userId: UUID;
  customerId?: UUID | null;
  jobId?: UUID | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  tax?: number | null;
  taxRate?: number | null;
  total: number;
  balanceDue?: number | null;
  dueDate?: ISODateString | null;
  notes?: string | null;
  createdAt?: ISODateString;
  // Joined / embedded
  customer?: Customer | null;
  lineItems?: InvoiceLineItem[];
}

export interface PricebookItem extends SupabaseRow {
  id: UUID;
  userId: UUID;
  name: string;
  defaultPrice: number;
  category?: string | null;
  unit?: string | null;
  useCount?: number | null;
  lastUsedAt?: ISODateString | null;
}

export interface Expense extends SupabaseRow {
  id: UUID;
  userId: UUID;
  amount: number;
  category?: string | null;
  description?: string | null;
  date: ISODateString;
  receiptUrl?: string | null;
}

// -- GC / multi-trade coordination --------------------------------------------

export type GCProjectStatus =
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'canceled';

export type GCTradeStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'blocked';

export interface Organization extends SupabaseRow {
  id: UUID;
  name: string;
  ownerId: UUID;
  createdAt?: ISODateString;
}

export interface OrgMember extends SupabaseRow {
  id: UUID;
  orgId: UUID;
  userId?: UUID | null;
  role: 'owner' | 'admin' | 'member';
  invitedEmail?: string | null;
  status: 'active' | 'invited' | 'removed';
  createdAt?: ISODateString;
}

export interface GCProject extends SupabaseRow {
  id: UUID;
  orgId: UUID;
  name: string;
  description?: string | null;
  projectType?: string | null;
  status: GCProjectStatus;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  startDate?: ISODateString | null;
  endDate?: ISODateString | null;
  targetEndDate?: ISODateString | null;
  budget?: number | null;
  overheadPercent?: number | null;
  profitPercent?: number | null;
  createdAt?: ISODateString;
}

export interface GCProjectZone extends SupabaseRow {
  id: UUID;
  projectId: UUID;
  name: string;
  sortOrder?: number | null;
}

export interface GCProjectTrade extends SupabaseRow {
  id: UUID;
  projectId: UUID;
  zoneId?: UUID | null;
  trade: string;
  subUserId?: UUID | null;
  subName?: string | null;
  subEmail?: string | null;
  subPhone?: string | null;
  assignedOrgId?: UUID | null;
  assignedBusinessName?: string | null;
  laborHours?: number | null;
  laborRate?: number | null;
  materialsBudget?: number | null;
  budget?: number | null;
  status: GCTradeStatus;
  startDate?: ISODateString | null;
  endDate?: ISODateString | null;
  sortOrder?: number | null;
  createdAt?: ISODateString;
  // Joined
  tasks?: GCProjectTask[];
}

export interface GCProjectTask extends SupabaseRow {
  id: UUID;
  tradeId: UUID;
  projectId: UUID;
  title: string;
  completed: boolean;
  completedAt?: ISODateString | null;
  sortOrder?: number | null;
  createdAt?: ISODateString;
}

export interface GCProjectMessage extends SupabaseRow {
  id: UUID;
  tradeId?: UUID | null;
  projectId: UUID;
  userId: UUID;
  senderName?: string | null;
  content: string;
  category?: 'safety' | 'schedule' | 'change_order' | 'milestone' | 'general' | null;
  createdAt: ISODateString;
}

export interface GCTradeMaterial extends SupabaseRow {
  id: UUID;
  tradeId: UUID;
  projectId: UUID;
  name: string;
  quantity: number;
  unit?: string | null;
  unitCost?: number | null;
  purchased: boolean;
  createdAt?: ISODateString;
}

export interface GCTradeRating extends SupabaseRow {
  id: UUID;
  tradeId: UUID;
  quality: number; // 1-5
  timeliness: number; // 1-5
  budget: number; // 1-5
  communication: number; // 1-5
  notes?: string | null;
  createdAt?: ISODateString;
}

// -- Contractors / team -------------------------------------------------------

export interface Contractor extends SupabaseRow {
  id: UUID;
  userId: UUID;
  name: string;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
  trade?: string | null;
  notes?: string | null;
  createdAt?: ISODateString;
}

export interface TeamMember extends SupabaseRow {
  id: UUID;
  userId: UUID;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt?: ISODateString;
}

// -- API response envelope ----------------------------------------------------

export interface ApiResult<T> {
  data: T;
}

export interface ApiListResult<T> {
  data: T[];
}
