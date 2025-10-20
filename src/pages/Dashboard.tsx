import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut } from "lucide-react";
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
}

const MemberArea = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Checa autenticação
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // 🔎 Carrega o projeto específico
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="font-bold text-lg">{project.name}</div>
          </div>
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Card className="shadow-card border-border/50 bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>{project.description || "Sem descrição"}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Criado em {new Date(project.created_at).toLocaleDateString("pt-BR")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">ID do projeto: {project.id}</p>
          </CardContent>
        </Card>

        {/* Aqui você pode renderizar o conteúdo da área de membros */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Conteúdo da área de membros</h2>
          <p className="text-sm text-muted-foreground">Adicione aqui os módulos, vídeos ou materiais do projeto.</p>
        </div>
      </main>
    </div>
  );
};

export default MemberArea;
