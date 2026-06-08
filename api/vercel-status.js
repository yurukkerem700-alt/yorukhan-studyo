import supabase from './db-client.js';

// Vercel deployment status checker

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const vercelToken = process.env.VERCEL_API_TOKEN;
      
      if (!vercelToken) {
        return res.status(200).json({ 
          connected: false,
          message: 'VERCEL_API_TOKEN tanımlı değil'
        });
      }

      // Fetch deployments
      const response = await fetch('https://api.vercel.com/v13/deployments?limit=20', {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return res.status(200).json({ 
          connected: true,
          error: `Vercel API hatası: ${response.status}`
        });
      }

      const data = await response.json();
      
      // Process deployments
      const deployments = (data.deployments || []).map(d => ({
        id: d.uid,
        name: d.name,
        url: d.url ? `https://${d.url}` : null,
        state: d.state,
        created: d.created,
        target: d.target
      }));

      return res.status(200).json({
        connected: true,
        deployments,
        total: deployments.length
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Vercel status error:', err);
    res.status(500).json({ error: err.message });
  }
}