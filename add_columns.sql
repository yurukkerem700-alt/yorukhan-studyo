-- Add new columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS production_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS launch_type VARCHAR(20) DEFAULT 'new_tab';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'live';
