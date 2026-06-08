import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Add missing columns to projects table
    const migrations = [
      { table: 'projects', column: 'production_url', type: 'text' },
      { table: 'projects', column: 'github_url', type: 'text' },
      { table: 'projects', column: 'launch_type', type: 'text', default: "'new_tab'" },
      { table: 'projects', column: 'status', type: 'text', default: "'live'" }
    ];

    const results = [];

    for (const migration of migrations) {
      try {
        // Try to select the column to check if it exists
        const { error: checkError } = await supabase
          .rpc('exec_sql', { 
            query: `SELECT ${migration.column} FROM ${migration.table} LIMIT 1` 
          });
        
        if (checkError) {
          // Column doesn't exist, need to add it
          // Note: Supabase doesn't support ALTER TABLE through the client directly
          // We'll need to use the service role with direct SQL
          results.push({
            column: migration.column,
            status: 'needs_migration',
            message: 'Column needs to be added via Supabase dashboard'
          });
        } else {
          results.push({
            column: migration.column,
            status: 'exists'
          });
        }
      } catch (err) {
        results.push({
          column: migration.column,
          status: 'error',
          message: err.message
        });
      }
    }

    res.status(200).json({
      success: true,
      migrations: results,
      message: 'Run the following SQL in Supabase SQL Editor to add missing columns:\n\n' +
        'ALTER TABLE projects ADD COLUMN IF NOT EXISTS production_url TEXT;\n' +
        'ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url TEXT;\n' +
        'ALTER TABLE projects ADD COLUMN IF NOT EXISTS launch_type TEXT DEFAULT \'new_tab\';\n' +
        'ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'live\';'
    });
  } catch (err) {
    console.error('Migration API error:', err);
    res.status(500).json({ error: err.message });
  }
}
