import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  created_at: string;
  owner_id: string;
}

const MemberArea = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Pega sessão (mas não redireciona mais automaticamente)
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);
    };

    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) setUser(session.user);
        else setUser(null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 🔎 Carrega projeto pelo ID
  useEffect(() => {
    const loadProject = async () => {
      try {
        if (!id) return;

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          toast.error("Área de membros não encontrada.");
          setProject(null);
        } else {
          setProject(data);
        }
      } catch (error) {
        console.error("Erro ao carregar projeto:", error);
        toast.error("Erro ao carregar área de membros.");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-xl font-bold mb-4">Área de membros não encontrada</h1>
        <Button onClick={() => navigate("/dashboard")}>Voltar para o Dashboard</Button>
      </div>
    );
  }

  const isOwner = user?.id === project.owner_id;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Card className="shadow-card border-border/50 bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>
              {project.description || "Sem descrição"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Criado em {new Date(project.created_at).toLocaleDateString("pt-BR")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              ID do projeto: {project.id}
            </p>
          </CardContent>
        </Card>

        {isOwner ? (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">🔧 Construtor da Área de Membros</h2>
            <p className="text-sm text-muted-foreground">
              Aqui só o dono do projeto consegue editar módulos, vídeos ou materiais.
            </p>
            {/* Aqui vai o construtor de fato */}
          </div>
        ) : (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">📚 Conteúdo da Área de Membros</h2>
            <p className="text-sm text-muted-foreground">
              Bem-vindo! Aqui você verá os módulos, vídeos e materiais do projeto.
            </p>
            {/* Aqui vai o conteúdo liberado para alunos */}
          </div>
        )}
      </main>
    </div>
  );
};

export default MemberArea;
