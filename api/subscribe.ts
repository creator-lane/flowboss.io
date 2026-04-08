import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://flowboss.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, trade } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    console.error('OneSignal credentials not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const response = await fetch('https://api.onesignal.com/apps/' + appId + '/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + apiKey,
      },
      body: JSON.stringify({
        properties: {
          tags: {
            trade: trade || 'unknown',
            source: 'website',
          },
        },
        subscriptions: [
          {
            type: 'Email',
            token: email.toLowerCase().trim(),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OneSignal error:', response.status, errorBody);
      return res.status(502).json({ error: 'Failed to subscribe' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('OneSignal request failed:', err);
    return res.status(502).json({ error: 'Failed to subscribe' });
  }
}
