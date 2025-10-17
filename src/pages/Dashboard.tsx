import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, LogOut, FolderKanban, Sparkles } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import type { User } from "@supabase/supabase-js";
import UserProfile from "@/components/UserProfile";
interface Project {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
}
const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: ""
  });
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadProjects();
    };
    checkAuth();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const loadProjects = async () => {
    try {
      const {
        data,
        error
      } = await sb.from("projects").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar projetos");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        error
      } = await sb.from("projects").insert([{
        name: newProject.name,
        description: newProject.description,
        owner_id: user?.id
      }]);
      if (error) throw error;
      toast.success("Projeto criado com sucesso!");
      setCreateDialogOpen(false);
      setNewProject({
        name: "",
        description: ""
      });
      loadProjects();
    } catch (error: any) {
      toast.error("Erro ao criar projeto");
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logo} alt="Elyon Builder" className="h-6 w-6 sm:h-8 sm:w-8" />
            
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user && <UserProfile user={user} />}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 truncate">Meus Projetos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie suas áreas de membros em um só lugar
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 transition-smooth shadow-glow w-full sm:w-auto flex-shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Novo Projeto</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50">
              <DialogHeader>
                <DialogTitle>Criar Novo Projeto</DialogTitle>
                <DialogDescription>
                  Crie uma nova área de membros personalizada
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Projeto</Label>
                  <Input id="name" value={newProject.name} onChange={e => setNewProject({
                  ...newProject,
                  name: e.target.value
                })} required placeholder="Minha Área de Membros" className="bg-muted/50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" value={newProject.description} onChange={e => setNewProject({
                  ...newProject,
                  description: e.target.value
                })} placeholder="Descrição do seu projeto..." className="bg-muted/50 min-h-[100px]" />
                </div>

                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 transition-smooth">
                  Criar Projeto
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? <Card className="shadow-card border-border/50 bg-gradient-to-br from-card to-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <div className="rounded-full bg-primary/10 p-4 sm:p-6 mb-4">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">Comece sua jornada</h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 max-w-md px-4">
                Crie seu primeiro projeto e comece a construir áreas de membros incríveis sem programar
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-primary hover:opacity-90 transition-smooth shadow-glow">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Projeto
              </Button>
            </CardContent>
          </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => <Card key={project.id} className="shadow-card border-border/50 hover-lift cursor-pointer bg-gradient-to-br from-card to-muted/20" onClick={() => navigate(`/project/${project.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <FolderKanban className="h-6 w-6 text-primary" />
                    </div>
                    <div className="h-3 w-3 rounded-full" style={{
                backgroundColor: project.primary_color
              }} />
                  </div>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    Criado em {new Date(project.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </main>
    </div>;
};
export default Dashboard;