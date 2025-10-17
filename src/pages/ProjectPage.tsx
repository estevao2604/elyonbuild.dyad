import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LogOut, BookOpen, Users, Palette, BarChart3, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import ContentTab from "@/components/project/ContentTab";
import MembersTab from "@/components/project/MembersTab";
import DesignTab from "@/components/project/DesignTab";
import AnalyticsTab from "@/components/project/AnalyticsTab";
import CommunityTab from "@/components/project/CommunityTab";

interface Project {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
}

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      loadProject();
    };

    checkAuth();
  }, [projectId, navigate]);

  const loadProject = async () => {
    try {
      const { data, error } = await sb
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      toast.error("Erro ao carregar projeto");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <img src={logo} alt="Elyon Builder" className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="font-semibold text-sm sm:text-lg truncate">{project.name}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Gerenciar projeto</p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border/50 flex-wrap h-auto p-1 gap-1">
            <TabsTrigger value="content" className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Conteúdo</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Membros</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
              <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Design</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Comunidade</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <ContentTab projectId={projectId!} />
          </TabsContent>

          <TabsContent value="members">
            <MembersTab projectId={projectId!} projectName={project.name} />
          </TabsContent>

          <TabsContent value="design">
            <DesignTab projectId={projectId!} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab projectId={projectId!} />
          </TabsContent>

          <TabsContent value="community">
            <CommunityTab projectId={projectId!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProjectPage;
