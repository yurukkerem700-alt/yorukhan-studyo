import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      // Get Vercel token from environment
      const vercelToken = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
      
      if (!vercelToken) {
        return res.status(200).json({ 
          projects: [], 
          error: 'VERCEL_TOKEN tanımlı değil. Lütfen environment variables ekleyin.' 
        });
      }

      // Fetch projects from Vercel API
      const vercelRes = await fetch('https://api.vercel.com/v9/projects?limit=100', {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!vercelRes.ok) {
        const errorText = await vercelRes.text();
        console.error('Vercel API error:', errorText);
        return res.status(200).json({ 
          projects: [], 
          error: `Vercel API hatası: ${vercelRes.status}` 
        });
      }

      const vercelData = await vercelRes.json();
      
      // Transform Vercel projects to our format
      const projects = vercelData.projects.map(p => ({
        id: p.id,
        name: p.name,
        production_url: p.targets?.production?.url ? `https://${p.targets.production.url}` : null,
        github_url: p.link?.type === 'github' ? `https://github.com/${p.link.org}/${p.link.repo}` : null,
        created_at: p.createdAt,
        framework: p.framework,
        last_deployed: p.targets?.production?.createdAt
      }));

      return res.status(200).json({ 
        projects,
        total: vercelData.pagination?.count || projects.length,
        error: null
      });
    }

    if (req.method === 'POST') {
      // Sync selected projects to database
      const { projects: projectsToSync } = req.body;
      
      if (!projectsToSync || !Array.isArray(projectsToSync)) {
        return res.status(400).json({ error: 'Geçersiz proje verisi' });
      }

      const results = [];
      
      for (const project of projectsToSync) {
        const { data, error } = await supabase
          .from('projects')
          .upsert({
            name: project.name,
            description: project.description || '',
            category: project.category,
            image: project.image || '',
            production_url: project.production_url,
            github_url: project.github_url,
            launch_type: project.launch_type || 'new_tab',
            status: project.status || 'live'
          }, {
            onConflict: 'name'
          })
          .select()
          .single();
        
        if (error) {
          console.error(`Error syncing ${project.name}:`, error);
          results.push({ name: project.name, success: false, error: error.message });
        } else {
          results.push({ name: project.name, success: true, data });
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      return res.status(200).json({
        message: `${successCount}/${projectsToSync.length} proje senkronize edildi`,
        results
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Vercel sync API error:', err);
    res.status(500).json({ error: err.message });
  }
}