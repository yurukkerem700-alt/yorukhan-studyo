import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // Get maintenance status
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'maintenance_mode')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return res.status(200).json({ 
        enabled: data?.value === 'true' 
      });
    }

    // Set maintenance status
    if (req.method === 'POST') {
      const { enabled } = req.body;
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key: 'maintenance_mode', 
          value: enabled ? 'true' : 'false',
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      
      if (error) throw error;
      
      return res.status(200).json({ 
        ok: true, 
        enabled,
        message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled'
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Maintenance API error:', err);
    res.status(500).json({ error: err.message });
  }
}
