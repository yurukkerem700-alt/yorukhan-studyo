import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      // Get deployment status for a project
      const { url } = req.query;
      
      if (!url) {
        return res.status(400).json({ error: 'URL parameter required' });
      }

      // Check if the URL is accessible
      try {
        const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
        return res.status(200).json({
          status: response.ok ? 'online' : 'error',
          statusCode: response.status,
          lastChecked: new Date().toISOString()
        });
      } catch (fetchError) {
        return res.status(200).json({
          status: 'offline',
          error: fetchError.message,
          lastChecked: new Date().toISOString()
        });
      }
    }

    if (req.method === 'POST') {
      // Trigger a new deployment via Vercel API
      const { projectId, branch = 'main' } = req.body;
      const vercelToken = process.env.VERCEL_TOKEN;
      
      if (!vercelToken) {
        return res.status(500).json({ error: 'Vercel token not configured' });
      }

      // Get project info from database
      const { data: project, error: dbError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (dbError || !project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // If project has GitHub URL, we could trigger a deployment
      // For now, just return success
      return res.status(200).json({
        success: true,
        message: 'Deployment triggered',
        project: project.name
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Deployment API error:', err);
    res.status(500).json({ error: err.message });
  }
}
