import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('telemetry_logs')
        .select('*')
        .order('clicked_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      
      const uniqueVisitors = new Set(data.map(log => log.visitor_name).filter(Boolean));
      const projectClicks = {};
      
      data.forEach(log => {
        if (log.project_name) {
          projectClicks[log.project_name] = (projectClicks[log.project_name] || 0) + 1;
        }
      });
      
      const topProject = Object.entries(projectClicks)
        .sort((a, b) => b[1] - a[1])[0];
      
      return res.status(200).json({
        logs: data,
        analytics: {
          totalUniqueVisitors: uniqueVisitors.size,
          totalClicks: data.length,
          topProject: topProject ? { name: topProject[0], clicks: topProject[1] } : null,
          projectClicks
        }
      });
    }

    if (req.method === 'POST') {
      const { project_id, project_name, visitor_name, interaction_label } = req.body;
      
      const insertData = {
        project_id,
        project_name,
        visitor_name: visitor_name || 'Anonim',
        interaction_label: interaction_label || 'Normal'
      };
      
      const { data, error } = await supabase
        .from('telemetry_logs')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      // Clear all telemetry logs (admin only)
      const { error } = await supabase
        .from('telemetry_logs')
        .delete()
        .neq('id', 0); // Delete all rows
      
      if (error) throw error;
      return res.status(200).json({ ok: true, message: 'All logs cleared' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Telemetry API error:', err);
    res.status(500).json({ error: err.message });
  }
}
