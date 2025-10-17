-- Adicionar colunas para personalização avançada da área de membros
ALTER TABLE project_branding 
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#0F172A',
ADD COLUMN IF NOT EXISTS container_color TEXT DEFAULT '#1E293B',
ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#6366F1',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#F1F5F9',
ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT false;

-- Adicionar colunas para perfil de membros
ALTER TABLE project_members
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;