import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import bcrypt from "bcryptjs";
import { Eye, EyeOff, LogIn, User, Key } from "lucide-react";
import { useProjectBranding } from "@/hooks/useProjectBranding";

const MemberLogin = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login"); // "login" or "register"

  const { branding, loading: loadingBranding } = useProjectBranding(projectId!);

  useEffect(() => {
    console.log("Project ID da URL:", projectId);
    if (projectId) {
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

      console.log("Buscando projeto com ID:", projectId);
      
      // Verificar se o projeto existe
      const { data: projectData, error: projectError } = await sb
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      console.log("Resultado da busca:", { projectData, projectError });

      if (projectError || !projectData) {
        setError("Área de membros não encontrada. Verifique se o link está correto ou se o projeto foi excluído.");
        return;
      }

      setProject(projectData);
    } catch (error) {
      console.error("Erro ao carregar projeto:", error);
      setError("Erro ao carregar informações do projeto");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
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

      if (!member.is_active) {
        toast.error("Sua conta está inativa. Entre em contato com o administrador.");
        setLoading(false);
        return;
      }

      // Se não houver senha (membro público), permitir acesso
      if (!member.password_hash) {
        const memberSessionData = {
          id: member.id,
          email: member.email,
          full_name: member.full_name,
          project_id: projectId,
          profile_photo_url: member.profile_photo_url
        };
        sessionStorage.setItem("member_session", JSON.stringify(memberSessionData));

        toast.success(`Bem-vindo, ${member.full_name}!`);
        navigate(`/member/${projectId}/area`);
        return;
      }

      const passwordMatch = await bcrypt.compare(password, member.password_hash);

      if (!passwordMatch) {
        toast.error("Email ou senha incorretos");
        setLoading(false);
        return;
      }

      const memberSessionData = {
        id: member.id,
        email: member.email,
        full_name: member.full_name,
        project_id: projectId,
        profile_photo_url: member.profile_photo_url
      };
      sessionStorage.setItem("member_session", JSON.stringify(memberSessionData));

      toast.success(`Bem-vindo, ${member.full_name}!`);
      navigate(`/member/${projectId}/area`);
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handlePublicAccess = async () => {
    setLoading(true);
    setError(null);

    try {
      // Criar um membro temporário para acesso público
      const { data: publicMember, error } = await sb
        .from("project_members")
        .insert({
          project_id: projectId,
          email: `public_${Date.now()}@elyon.com`,
          full_name: "Visitante",
          is_active: true,
          password_hash: null, // Sem senha para acesso público
        })
        .select()
        .single();

      if (error) throw error;

      const memberSessionData = {
        id: publicMember.id,
        email: publicMember.email,
        full_name: publicMember.full_name,
        project_id: projectId,
        profile_photo_url: publicMember.profile_photo_url
      };
      sessionStorage.setItem("member_session", JSON.stringify(memberSessionData));

      toast.success("Acesso público concedido!");
      navigate(`/member/${projectId}/area`);
    } catch (error: any) {
      console.error("Erro ao criar acesso público:", error);
      toast.error("Erro ao conceder acesso público");
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = branding?.custom_logo_url || project?.logo_url;

  if (loading || loadingBranding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--member-background-color)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--member-primary-color)] mx-auto mb-4"></div>
          <p className="text-[var(--member-text-color)]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--member-background-color)]">
        <Card className="max-w-md mx-4 bg-[var(--member-container-color)] text-[var(--member-text-color)]">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Área de Membros Não Encontrada</h2>
            <p className="text-[var(--member-muted-text-color)] mb-4">
              {error}
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/dashboard")} className="w-full bg-[var(--member-button-color)] text-white">
                Ir para o Dashboard
              </Button>
              <Button 
                onClick={() => navigate("/")} 
                variant="outline"
                className="w-full border-[var(--member-primary-color)] text-[var(--member-primary-color)] hover:bg-[var(--member-primary-color)] hover:text-white"
              >
                Voltar para o Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen flex items-center justify-center relative overflow-hidden`}
      style={{ backgroundColor: 'var(--member-background-color)' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Logo Container */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        {logoUrl && (
          <div className="relative group">
            <img
              src={logoUrl}
              alt={project?.name || "Logo"}
              className="h-20 w-20 md:h-24 md:w-24 object-contain drop-shadow-2xl transition-all duration-300 group-hover:scale-110"
              style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.3))' }}
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--member-primary-color)]/20 to-[var(--member-secondary-color)]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md relative z-10 mx-4">
        <div className="text-center mb-8 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--member-text-color)]">
            {project?.name ? `Área de Membros - ${project.name}` : "Área de Membros"}
          </h1>
          <p className="text-base md:text-lg text-[var(--member-text-color)] opacity-80">
            Acesse sua plataforma de infoprodutos
          </p>
        </div>

        <div className="space-y-6">
          {/* Tabs para Login ou Acesso Público */}
          <div className="flex rounded-lg bg-[var(--member-container-color)] p-1">
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "login"
                  ? "bg-[var(--member-primary-color)] text-white"
                  : "text-[var(--member-text-color)] hover:bg-[var(--member-container-color)]/50"
              }`}
              onClick={() => setActiveTab("login")}
            >
              <User className="inline h-4 w-4 mr-2" />
              Login
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "public"
                  ? "bg-[var(--member-primary-color)] text-white"
                  : "text-[var(--member-text-color)] hover:bg-[var(--member-container-color)]/50"
              }`}
              onClick={() => setActiveTab("public")}
            >
              <Key className="inline h-4 w-4 mr-2" />
              Acesso Público
            </button>
          </div>

          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[var(--member-text-color)]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-12 border-opacity-40 text-lg bg-[var(--member-container-color)] text-[var(--member-text-color)] border-[var(--member-text-color)]/40 shadow-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[var(--member-text-color)]">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="h-12 pr-12 border-opacity-40 text-lg bg-[var(--member-container-color)] text-[var(--member-text-color)] border-[var(--member-text-color)]/40 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-smooth text-[var(--member-text-color)] opacity-50 hover:opacity-100"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-xl bg-[var(--member-button-color)] text-white shadow-[0_10px_25px_-5px_rgba(99,102,241,0.4)]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-[var(--member-text-color)] text-center">
                Acesse o conteúdo público desta área de membros sem necessidade de login.
              </p>
              <Button
                onClick={handlePublicAccess}
                className="w-full h-14 text-lg font-bold tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-xl bg-[var(--member-button-color)] text-white shadow-[0_10px_25px_-5px_rgba(99,102,241,0.4)]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                    <span>Acessando...</span>
                  </>
                ) : (
                  "Acessar Conteúdo Público"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 left-8 w-32 h-32 bg-[var(--member-primary-color)]/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute top-8 right-8 w-24 h-24 bg-[var(--member-secondary-color)]/10 rounded-full blur-3xl opacity-50" />
    </div>
  );
};

export default MemberLogin;