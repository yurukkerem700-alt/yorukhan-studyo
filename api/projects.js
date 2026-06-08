import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Add default values for missing columns
      const projectsWithDefaults = data.map(project => ({
        ...project,
        production_url: project.production_url || '',
        github_url: project.github_url || '',
        launch_type: project.launch_type || 'new_tab',
        status: project.status || 'live'
      }));
      
      return res.status(200).json(projectsWithDefaults);
    }

    if (req.method === 'POST') {
      const { 
        name, 
        description, 
        category, 
        image,
        production_url = '',
        github_url = '',
        launch_type = 'new_tab',
        status = 'live'
      } = req.body;
      
      // Try to insert with new columns, fall back to basic columns if they don't exist
      let data, error;
      
      try {
        const result = await supabase
          .from('projects')
          .insert({ 
            name, 
            description, 
            category, 
            image,
            production_url,
            github_url,
            launch_type,
            status
          })
          .select()
          .single();
        data = result.data;
        error = result.error;
      } catch (insertError) {
        // If new columns don't exist, try basic insert
        const result = await supabase
          .from('projects')
          .insert({ name, description, category, image })
          .select()
          .single();
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      return res.status(201).json({
        ...data,
        production_url: data.production_url || production_url,
        github_url: data.github_url || github_url,
        launch_type: data.launch_type || launch_type,
        status: data.status || status
      });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}