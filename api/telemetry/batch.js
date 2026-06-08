import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { events } = req.body;
      
      if (!events || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ error: 'Events array required' });
      }
      
      // Rate limit check - max 100 events per batch
      if (events.length > 100) {
        return res.status(429).json({ error: 'Too many events in batch' });
      }
      
      // Insert all events
      const { data, error } = await supabase
        .from('telemetry_logs')
        .insert(events.map(event => ({
          project_id: event.project_id,
          project_name: event.project_name,
          visitor_name: event.visitor_name || 'Anonim',
          interaction_label: event.interaction_label || 'Normal'
        })));
      
      if (error) throw error;
      
      return res.status(201).json({ 
        success: true, 
        count: events.length,
        message: 'Batch processed'
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Telemetry batch error:', err);
    res.status(500).json({ error: err.message });
  }
}