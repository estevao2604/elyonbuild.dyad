-- Criar tabela de membros dos projetos (diferentes dos owners)
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, email)
);

-- Habilitar RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para membros
CREATE POLICY "Donos podem gerenciar membros de seus projetos"
  ON public.project_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_members.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem ver seus próprios dados"
  ON public.project_members FOR SELECT
  USING (true);

-- Criar tabela de módulos
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para módulos
CREATE POLICY "Donos podem gerenciar módulos de seus projetos"
  ON public.modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = modules.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Todos podem ver módulos publicados"
  ON public.modules FOR SELECT
  USING (is_published = true);

-- Criar tabela de aulas
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL, -- 'video', 'pdf', 'image', 'text'
  file_url TEXT,
  duration_minutes INTEGER,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para aulas
CREATE POLICY "Donos podem gerenciar aulas de seus projetos"
  ON public.lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.modules 
      JOIN public.projects ON projects.id = modules.project_id
      WHERE modules.id = lessons.module_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Todos podem ver aulas publicadas"
  ON public.lessons FOR SELECT
  USING (is_published = true);

-- Criar tabela de progresso dos membros
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.project_members(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, lesson_id)
);

-- Habilitar RLS
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para progresso
CREATE POLICY "Donos podem ver progresso de membros de seus projetos"
  ON public.lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      JOIN public.projects ON projects.id = project_members.project_id
      WHERE project_members.id = lesson_progress.member_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem gerenciar seu próprio progresso"
  ON public.lesson_progress FOR ALL
  USING (true);

-- Criar tabela de branding dos projetos
CREATE TABLE public.project_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  custom_logo_url TEXT,
  primary_color TEXT DEFAULT '#6366F1',
  secondary_color TEXT DEFAULT '#22D3EE',
  accent_color TEXT DEFAULT '#F59E0B',
  hero_banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.project_branding ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para branding
CREATE POLICY "Donos podem gerenciar branding de seus projetos"
  ON public.project_branding FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_branding.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Todos podem ver branding"
  ON public.project_branding FOR SELECT
  USING (true);

-- Criar tabela de posts da comunidade
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.project_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reactions_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para posts
CREATE POLICY "Donos podem gerenciar posts de seus projetos"
  ON public.community_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.modules
      JOIN public.projects ON projects.id = modules.project_id
      WHERE modules.id = community_posts.module_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem criar posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem ver posts"
  ON public.community_posts FOR SELECT
  USING (true);

CREATE POLICY "Autores podem editar seus posts"
  ON public.community_posts FOR UPDATE
  USING (author_id IN (SELECT id FROM public.project_members));

-- Criar tabela de comentários
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.project_members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  reactions_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para comentários
CREATE POLICY "Donos podem gerenciar comentários de seus projetos"
  ON public.community_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.community_posts
      JOIN public.modules ON modules.id = community_posts.module_id
      JOIN public.projects ON projects.id = modules.project_id
      WHERE community_posts.id = community_comments.post_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem criar comentários"
  ON public.community_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem ver comentários"
  ON public.community_comments FOR SELECT
  USING (true);

CREATE POLICY "Autores podem editar seus comentários"
  ON public.community_comments FOR UPDATE
  USING (author_id IN (SELECT id FROM public.project_members));

-- Triggers para updated_at
CREATE TRIGGER set_updated_at_project_members
  BEFORE UPDATE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_modules
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_lessons
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_lesson_progress
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_project_branding
  BEFORE UPDATE ON public.project_branding
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_community_posts
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_community_comments
  BEFORE UPDATE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Criar buckets de storage
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('project-files', 'project-files', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para project-files
CREATE POLICY "Donos podem upload de arquivos em seus projetos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-files' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Arquivos são públicos para visualização"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-files');

CREATE POLICY "Donos podem atualizar arquivos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-files' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Donos podem deletar arquivos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-files' AND
    auth.uid() IS NOT NULL
  );

-- Políticas de storage para avatars
CREATE POLICY "Usuários podem upload de avatares"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatares são públicos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Usuários podem atualizar avatares"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars');

CREATE POLICY "Usuários podem deletar avatares"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars');