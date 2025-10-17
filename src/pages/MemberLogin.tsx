import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import bcrypt from "bcryptjs";
import { Eye, EyeOff, LogIn, Plus, Sparkles } from "lucide-react";

const MemberLogin = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    if (projectId) {
      console.log("Tentando carregar projeto com ID:", projectId);
      loadProject();
    } else {
      setError("ID do projeto não fornecido");
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) {
      setError("ID do projeto não fornecido");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Carregar todos os projetos primeiro para ver se o ID existe
      const { data: projectsData, error: projectsError } = await sb
        .from("projects")
        .select("*")
        .limit(20);

      if (projectsError) {
        console.error("Erro ao carregar projetos:", projectsError);
        setError("Erro ao carregar projetos do banco de dados");
        return;
      }

      setAllProjects(projectsData || []);

      // Verificar se o projeto existe
      const projectExists = projectsData?.some(p => p.id === projectId);
      
      if (!projectExists) {
        console.error("Projeto não encontrado:", projectId);
        console.log("Projetos disponíveis:", projectsData?.map(p => ({ id: p.id, name: p.name })));
        setError("Projeto não encontrado. Verifique se o ID está correto ou se o projeto foi excluído.");
        return;
      }

      // Carregar projeto específico
      const { data: projectData, error: projectError } = await sb
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) {
        console.error("Erro ao carregar projeto específico:", projectError);
        setError("Erro ao carregar informações do projeto");
        return;
      }

      console.log("Projeto encontrado:", projectData);
      setProject(projectData);

      // Carregar branding
      const { data: brandingData } = await sb
        .from("project_branding")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      setBranding(brandingData);
    } catch (error) {
      console.error("Error loading project:", error);
      setError("Erro ao carregar informações do projeto");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await sb.from("projects").insert([{
        name: newProject.name,
        description: newProject.description,
        owner_id: "test-user", // Usar um ID fixo para teste
      }]);
      if (error) throw error;
      toast.success("Projeto criado com sucesso!");
      setCreateDialogOpen(false);
      setNewProject({
        name: "",
        description: ""
      });
      loadProject(); // Recarregar projetos
    } catch (error: any) {
      toast.error("Erro ao criar projeto");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Buscar membro pelo email e projeto
      const { data: member, error } = await sb
        .from("project_members")
        .select("*")
        .eq("project_id", projectId)
        .eq("email", email)
        .single();

      if (error || !member) {
        toast.error("Email ou senha incorretos");
        setLoading(false);
        return;
      }

      // Verificar se está ativo
      if (!member.is_active) {
        toast.error("Sua conta está inativa. Entre em contato com o administrador.");
        setLoading(false);
        return;
      }

      // Verificar senha
      const passwordMatch = await bcrypt.compare(password, member.password_hash);

      if (!passwordMatch) {
        toast.error("Email ou senha incorretos");
        setLoading(false);
        return;
      }

      // Salvar dados do membro na sessão
      sessionStorage.setItem("member_session", JSON.stringify({
        id: member.id,
        email: member.email,
        full_name: member.full_name,
        project_id: projectId,
        profile_photo_url: member.profile_photo_url
      }));

      toast.success(`Bem-vindo, ${member.full_name}!`);
      navigate(`/member/${projectId}/area`);
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  // Usar branding ou dados do projeto como fallback
  const brandingData = branding || project?.project_branding?.[0];
  const backgroundColor = brandingData?.background_color || "#0F172A";
  const containerColor = brandingData?.container_color || "#1E293B";
  const buttonColor = brandingData?.button_color || "#6366F1";
  const textColor = brandingData?.text_color || "#F1F5F9";
  const logoUrl = brandingData?.custom_logo_url || project?.logo_url;
  const darkMode = brandingData?.dark_mode || false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor }}>
        <Card className="max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Erro</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            {error.includes("Projeto não encontrado") && (
              <div className="text-xs text-muted-foreground mb-4">
                <p>ID do projeto: {projectId}</p>
                {allProjects.length > 0 && (
                  <div className="mt-2">
                    <p>Projetos disponíveis:</p>
                    <ul className="text-left mt-1">
                      {allProjects.slice(0, 5).map(p => (
                        <li key={p.id} className="text-xs">
                          {p.name} (ID: {p.id})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/")} className="w-full">
                Voltar para o início
              </Button>
              <Button 
                onClick={() => navigate("/dashboard")} 
                variant="outline"
                className="w-full"
              >
                Ver meus projetos
              </Button>
              {allProjects.length === 0 && (
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-primary hover:opacity-90">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Projeto de Teste
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border/50">
                    <DialogHeader>
                      <DialogTitle>Criar Projeto de Teste</DialogTitle>
                      <DialogDescription>
                        Crie um projeto de teste para continuar
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateProject} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Projeto</Label>
                        <Input id="name" value={newProject.name} onChange={e => setNewProject({
                          ...newProject,
                          name: e.target.value
                        })} required placeholder="Meu Projeto de Teste" className="bg-muted/50" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea id="description" value={newProject.description} onChange={e => setNewProject({
                          ...newProject,
                          description: e.target.value
                        })} placeholder="Descrição do projeto..." className="bg-muted/50 min-h-[100px]" />
                      </div>

                      <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
                        Criar Projeto
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen flex items-center justify-center relative overflow-hidden ${darkMode ? "dark" : ""}`}
      style={{ backgroundColor }}
    >
      <div className="w-full max-w-md relative z-10 mx-4">
        <div className="text-center mb-8 space-y-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={project?.name || "Logo"}
              className="h-16 w-16 mx-auto object-contain"
            />
          )}
          <h1 className="text-2xl font-bold" style={{ color: textColor }}>
            {project?.name ? `Entrar na ${project.name}` : "Área de Membros"}
          </h1>
          <p className="text-sm" style={{ color: `${textColor}CC` }}>
            Acesse sua plataforma de infoprodutos
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: textColor }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-12 border-opacity-40"
                style={{ 
                  backgroundColor: containerColor,
                  borderColor: `${textColor}40`,
                  color: textColor
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: textColor }}>
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  className="h-12 pr-10 border-opacity-40"
                  style={{ 
                    backgroundColor: containerColor,
                    borderColor: `${textColor}40`,
                    color: textColor
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-smooth"
                  style={{ color: `${textColor}80` }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-medium transition-smooth hover:opacity-90"
              disabled={loading}
              style={{ 
                backgroundColor: buttonColor,
                color: "white"
              }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  <span>Entrando...</span>
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MemberLogin;