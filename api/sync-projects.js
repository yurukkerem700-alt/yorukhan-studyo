import supabase from './db-client.js';

// Bu API, Vercel ve GitHub token'larını environment variables'dan okur
// Asla kaynak koda token yazmayın - Vercel dashboard'dan ekleyin

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      // Get sync status and available integrations
      const vercelToken = process.env.VERCEL_API_TOKEN;
      const githubToken = process.env.GITHUB_API_TOKEN;
      
      return res.status(200).json({
        vercel_connected: !!vercelToken,
        github_connected: !!githubToken,
        message: !vercelToken && !githubToken 
          ? 'API token\'ları Vercel Environment Variables üzerinden ekleyin: VERCEL_API_TOKEN ve GITHUB_API_TOKEN'
          : 'Entegrasyonlar hazır'
      });
    }

    if (req.method === 'POST') {
      const vercelToken = process.env.VERCEL_API_TOKEN;
      const githubToken = process.env.GITHUB_API_TOKEN;
      
      if (!vercelToken && !githubToken) {
        return res.status(400).json({ 
          error: 'API token\'ları tanımlı değil. Vercel dashboard > Settings > Environment Variables kısmından ekleyin.',
          required_vars: ['VERCEL_API_TOKEN', 'GITHUB_API_TOKEN']
        });
      }

      const syncedProjects = [];
      const errors = [];

      // Fetch Vercel Projects
      if (vercelToken) {
        try {
          const vercelResponse = await fetch('https://api.vercel.com/v9/projects', {
            headers: {
              'Authorization': `Bearer ${vercelToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (vercelResponse.ok) {
            const vercelData = await vercelResponse.json();
            
            for (const project of vercelData.projects || []) {
              // Determine category based on project name/description
              const name = project.name.toLowerCase();
              let category = 'completed_apps';
              
              // Game detection heuristics
              if (name.includes('game') || name.includes('oyun') || 
                  name.includes('adventure') || name.includes('rpg') ||
                  name.includes('puzzle') || name.includes('arcade')) {
                category = 'completed_games';
              }
              
              // Get production URL
              const productionUrl = project.targets?.production?.url 
                ? `https://${project.targets.production.url}`
                : `https://${project.name}.vercel.app`;
              
              // Check if project already exists
              const { data: existing } = await supabase
                .from('projects')
                .select('id')
                .eq('name', project.name)
                .single();
              
              if (existing) {
                // Update existing project
                const { error } = await supabase
                  .from('projects')
                  .update({
                    production_url: productionUrl,
                    github_url: project.link ? `https://github.com/${project.link}` : null,
                    status: 'live'
                  })
                  .eq('id', existing.id);
                
                if (!error) {
                  syncedProjects.push({ name: project.name, action: 'updated' });
                }
              } else {
                // Create new project
                const { error } = await supabase
                  .from('projects')
                  .insert({
                    name: project.name,
                    description: project.description || `${project.name} - Vercel üzerinden senkronize edildi`,
                    category: category,
                    production_url: productionUrl,
                    github_url: project.link ? `https://github.com/${project.link}` : null,
                    launch_type: 'new_tab',
                    status: 'live'
                  });
                
                if (!error) {
                  syncedProjects.push({ name: project.name, action: 'created' });
                } else {
                  errors.push({ project: project.name, error: error.message });
                }
              }
            }
          } else {
            errors.push({ source: 'vercel', error: `API hatası: ${vercelResponse.status}` });
          }
        } catch (err) {
          errors.push({ source: 'vercel', error: err.message });
        }
      }

      // Fetch GitHub Repos
      if (githubToken) {
        try {
          const githubResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (githubResponse.ok) {
            const repos = await githubResponse.json();
            
            for (const repo of repos) {
              // Skip if already synced from Vercel
              if (syncedProjects.find(p => p.name === repo.name)) continue;
              
              // Determine category
              const name = repo.name.toLowerCase();
              const description = (repo.description || '').toLowerCase();
              let category = 'completed_apps';
              
              if (name.includes('game') || name.includes('oyun') || 
                  description.includes('game') || description.includes('oyun')) {
                category = 'completed_games';
              }
              
              // Check if project exists
              const { data: existing } = await supabase
                .from('projects')
                .select('id')
                .eq('name', repo.name)
                .single();
              
              if (!existing) {
                // Create new project
                const { error } = await supabase
                  .from('projects')
                  .insert({
                    name: repo.name,
                    description: repo.description || `${repo.name} - GitHub üzerinden senkronize edildi`,
                    category: category,
                    production_url: repo.homepage || `https://${repo.owner.login}.github.io/${repo.name}`,
                    github_url: repo.html_url,
                    launch_type: 'new_tab',
                    status: 'live'
                  });
                
                if (!error) {
                  syncedProjects.push({ name: repo.name, action: 'created', source: 'github' });
                }
              }
            }
          } else {
            errors.push({ source: 'github', error: `API hatası: ${githubResponse.status}` });
          }
        } catch (err) {
          errors.push({ source: 'github', error: err.message });
        }
      }

      return res.status(200).json({
        success: true,
        synced: syncedProjects,
        errors: errors.length > 0 ? errors : undefined,
        message: `${syncedProjects.length} proje senkronize edildi`
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Sync API error:', err);
    res.status(500).json({ error: err.message });
  }
}