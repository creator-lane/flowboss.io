// One-shot: creates FlowBoss Pro product + monthly/annual prices in Stripe.
// No dependencies — uses native fetch.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_live_... node scripts/create-stripe-products.mjs
//   (or sk_test_... for test mode)
//
// Safe to re-run: searches for an existing "FlowBoss Pro" product first.

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Missing STRIPE_SECRET_KEY env var');
  process.exit(1);
}

const mode = key.startsWith('sk_live') ? 'LIVE' : 'TEST';
console.log(`\n→ Stripe mode: ${mode}\n`);

async function stripe(path, { method = 'GET', body } = {}) {
  const url = `https://api.stripe.com/v1${path}`;
  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  const init = { method, headers };
  if (body) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined && v !== null) params.append(k, String(v));
    }
    init.body = params.toString();
  }
  const resp = await fetch(url, init);
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(`Stripe ${method} ${path}: ${JSON.stringify(json)}`);
  }
  return json;
}

// 1. Find or create the product
const search = await stripe(
  `/products/search?query=${encodeURIComponent('name:"FlowBoss Pro" AND active:"true"')}`
);
let product = search.data?.[0];
if (product) {
  console.log(`✓ Found existing product: ${product.id}`);
} else {
  product = await stripe('/products', {
    method: 'POST',
    body: {
      name: 'FlowBoss Pro',
      description:
        'Full access to FlowBoss — jobs, scheduling, invoicing, GC projects, and insights.',
    },
  });
  console.log(`✓ Created product: ${product.id}`);
}

// 2. Find or create prices
const allPrices = await stripe(`/prices?product=${product.id}&active=true&limit=100`);

async function ensurePrice({ amount, interval, lookupKey, nickname }) {
  const match = allPrices.data.find(
    (p) =>
      p.unit_amount === amount &&
      p.recurring?.interval === interval &&
      p.currency === 'usd'
  );
  if (match) {
    console.log(`✓ Found existing ${interval} price: ${match.id}`);
    return match;
  }
  const created = await stripe('/prices', {
    method: 'POST',
    body: {
      product: product.id,
      currency: 'usd',
      unit_amount: amount,
      'recurring[interval]': interval,
      lookup_key: lookupKey,
      nickname,
    },
  });
  console.log(`✓ Created ${interval} price: ${created.id}`);
  return created;
}

const monthly = await ensurePrice({
  amount: 2999,
  interval: 'month',
  lookupKey: 'flowboss_pro_monthly',
  nickname: 'FlowBoss Pro — Monthly',
});

const annual = await ensurePrice({
  amount: 19999,
  interval: 'year',
  lookupKey: 'flowboss_pro_annual',
  nickname: 'FlowBoss Pro — Annual',
});

console.log('\n────────────────────────────────────────');
console.log('Set these in Supabase:');
console.log(`  STRIPE_MONTHLY_PRICE_ID=${monthly.id}`);
console.log(`  STRIPE_ANNUAL_PRICE_ID=${annual.id}`);
console.log('────────────────────────────────────────\n');
console.log('Then run:');
console.log(`  supabase secrets set \\`);
console.log(`    STRIPE_MONTHLY_PRICE_ID=${monthly.id} \\`);
console.log(`    STRIPE_ANNUAL_PRICE_ID=${annual.id}`);
console.log('');
