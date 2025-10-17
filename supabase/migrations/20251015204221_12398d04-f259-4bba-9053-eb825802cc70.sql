-- Criar tabela de permissões de acesso de membros a módulos
CREATE TABLE public.member_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.project_members(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, module_id)
);

-- Habilitar RLS
ALTER TABLE public.member_module_access ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para controle de acesso
CREATE POLICY "Donos podem gerenciar acesso de membros"
  ON public.member_module_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      JOIN public.projects ON projects.id = project_members.project_id
      WHERE project_members.id = member_module_access.member_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem ver suas próprias permissões"
  ON public.member_module_access FOR SELECT
  USING (true);

-- Atualizar políticas de lessons para respeitar permissões de membros
DROP POLICY IF EXISTS "Todos podem ver aulas publicadas" ON public.lessons;

CREATE POLICY "Membros com acesso podem ver aulas publicadas"
  ON public.lessons FOR SELECT
  USING (
    is_published = true AND (
      -- Membro tem acesso ao módulo
      EXISTS (
        SELECT 1 FROM public.member_module_access
        JOIN public.project_members ON project_members.id = member_module_access.member_id
        WHERE member_module_access.module_id = lessons.module_id
      )
      OR
      -- Ou é o dono do projeto
      EXISTS (
        SELECT 1 FROM public.modules
        JOIN public.projects ON projects.id = modules.project_id
        WHERE modules.id = lessons.module_id
        AND projects.owner_id = auth.uid()
      )
    )
  );

-- Atualizar políticas de modules para respeitar permissões
DROP POLICY IF EXISTS "Todos podem ver módulos publicados" ON public.modules;

CREATE POLICY "Membros com acesso podem ver módulos publicados"
  ON public.modules FOR SELECT
  USING (
    is_published = true AND (
      -- Membro tem acesso ao módulo
      EXISTS (
        SELECT 1 FROM public.member_module_access
        WHERE member_module_access.module_id = modules.id
      )
      OR
      -- Ou é o dono do projeto
      EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = modules.project_id
        AND projects.owner_id = auth.uid()
      )
    )
  );

-- Adicionar trigger para updated_at na tabela de permissões
CREATE TRIGGER set_updated_at_member_module_access
  BEFORE UPDATE ON public.member_module_access
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Adicionar coluna content (conteúdo rich text) na tabela lessons se não existir
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content TEXT;