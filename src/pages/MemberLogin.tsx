import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import bcrypt from "bcryptjs";
import { Eye, EyeOff, LogIn } from "lucide-react";

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

  useEffect(() => {
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

      // Carregar projeto primeiro
      const { data: projectData, error: projectError } = await sb
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) {
        console.error("Error loading project:", projectError);
        setError("Projeto não encontrado ou ID inválido");
        return;
      }

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
            <Button onClick={() => navigate("/")} className="w-full">
              Voltar para o início
            </Button>
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