import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Branding {
  id: string;
  custom_logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  hero_banner_url: string | null;
}

interface DesignTabProps {
  projectId: string;
}

const DesignTab = ({ projectId }: DesignTabProps) => {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [colors, setColors] = useState({
    primary_color: "#6366F1",
    secondary_color: "#22D3EE",
    accent_color: "#F59E0B",
    background_color: "#0F172A",
    container_color: "#1E293B",
    button_color: "#6366F1",
    text_color: "#F1F5F9",
  });

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadBranding();
  }, [projectId]);

  const loadBranding = async () => {
    try {
      const { data, error } = await sb
        .from("project_branding")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setBranding(data);
        setColors({
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          accent_color: data.accent_color,
          background_color: data.background_color || "#0F172A",
          container_color: data.container_color || "#1E293B",
          button_color: data.button_color || "#6366F1",
          text_color: data.text_color || "#F1F5F9",
        });
        setDarkMode(data.dark_mode || false);
      } else {
        // Create default branding
        const { data: newBranding, error: createError } = await sb
          .from("project_branding")
          .insert([{ project_id: projectId }])
          .select()
          .single();

        if (createError) throw createError;
        setBranding(newBranding);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar configurações de design");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: "logo" | "banner") => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${projectId}-${type}-${Math.random()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const updateData =
        type === "logo" ? { custom_logo_url: data.publicUrl } : { hero_banner_url: data.publicUrl };

      const { error: updateError } = await sb
        .from("project_branding")
        .update(updateData)
        .eq("project_id", projectId);

      if (updateError) throw updateError;

      toast.success(`${type === "logo" ? "Logo" : "Banner"} atualizado com sucesso!`);
      loadBranding();
    } catch (error: any) {
      toast.error("Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveColors = async () => {
    try {
      setSaving(true);

      const { error } = await sb
        .from("project_branding")
        .update({ ...colors, dark_mode: darkMode })
        .eq("project_id", projectId);

      if (error) throw error;

      // Also update project colors for backward compatibility
      await sb
        .from("projects")
        .update({
          primary_color: colors.primary_color,
          secondary_color: colors.secondary_color,
        })
        .eq("id", projectId);

      toast.success("Design atualizado com sucesso!");
      loadBranding();
    } catch (error: any) {
      toast.error("Erro ao salvar design");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDesign = async () => {
    try {
      setSaving(true);

      const defaultColors = {
        primary_color: "#D4AF37",
        secondary_color: "#FFD700",
        accent_color: "#F59E0B",
        background_color: "#0A0A0A",
        container_color: "#1A1A1A",
        button_color: "#D4AF37",
        text_color: "#F5F5F5",
      };

      const { error } = await sb
        .from("project_branding")
        .update({ ...defaultColors, dark_mode: false })
        .eq("project_id", projectId);

      if (error) throw error;

      setColors(defaultColors);
      setDarkMode(false);
      toast.success("Design restaurado para o padrão!");
      loadBranding();
    } catch (error: any) {
      toast.error("Erro ao restaurar design");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Identidade Visual</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Personalize o design da sua área de membros
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Logos e Imagens */}
        <div className="space-y-6">
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle>Logo do Projeto</CardTitle>
              <CardDescription>
                Upload do logo que aparecerá na área de membros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {branding?.custom_logo_url && (
                <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
                  <img
                    src={branding.custom_logo_url}
                    alt="Logo"
                    className="max-h-32 object-contain"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-smooth">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Clique para fazer upload do logo
                        </span>
                      </>
                    )}
                  </div>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "logo");
                  }}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle>Banner Hero</CardTitle>
              <CardDescription>
                Imagem de fundo da página inicial (recomendado: 1920x1080px)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {branding?.hero_banner_url && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/50">
                  <img
                    src={branding.hero_banner_url}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="banner-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-smooth">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    ) : (
                      <>
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Clique para fazer upload do banner
                        </span>
                      </>
                    )}
                  </div>
                </Label>
                <Input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "banner");
                  }}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cores */}
        <div className="space-y-6">
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle>Paleta de Cores</CardTitle>
              <CardDescription>
                Defina as cores principais da sua área de membros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Cor Primária</Label>
                  <div className="flex gap-3">
                    <Input
                      id="primary-color"
                      type="color"
                      value={colors.primary_color}
                      onChange={(e) =>
                        setColors({ ...colors, primary_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={colors.primary_color}
                      onChange={(e) =>
                        setColors({ ...colors, primary_color: e.target.value })
                      }
                      className="font-mono bg-muted/50"
                      placeholder="#6366F1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usada em botões principais e destaques
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Cor Secundária</Label>
                  <div className="flex gap-3">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={colors.secondary_color}
                      onChange={(e) =>
                        setColors({ ...colors, secondary_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={colors.secondary_color}
                      onChange={(e) =>
                        setColors({ ...colors, secondary_color: e.target.value })
                      }
                      className="font-mono bg-muted/50"
                      placeholder="#22D3EE"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usada em elementos secundários e gradientes
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent-color">Cor de Destaque</Label>
                  <div className="flex gap-3">
                    <Input
                      id="accent-color"
                      type="color"
                      value={colors.accent_color}
                      onChange={(e) =>
                        setColors({ ...colors, accent_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={colors.accent_color}
                      onChange={(e) =>
                        setColors({ ...colors, accent_color: e.target.value })
                      }
                      className="font-mono bg-muted/50"
                      placeholder="#F59E0B"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usada em notificações e alertas importantes
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background-color">Cor do Fundo</Label>
                  <div className="flex gap-3">
                    <Input
                      id="background-color"
                      type="color"
                      value={colors.background_color}
                      onChange={(e) =>
                        setColors({ ...colors, background_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={colors.background_color}
                      onChange={(e) =>
                        setColors({ ...colors, background_color: e.target.value })
                      }
                      className="font-mono bg-muted/50"
                      placeholder="#0F172A"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor de fundo da tela de login
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="container-color">Cor do Container</Label>
                  <div className="flex gap-3">
                    <Input
                      id="container-color"
                      type="color"
                      value={colors.container_color}
                      onChange={(e) =>
                        setColors({ ...colors, container_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={colors.container_color}
                      onChange={(e) =>
                        setColors({ ...colors, container_color: e.target.value })
                      }
                      className="font-mono bg-muted/50"
                      placeholder="#1E293B"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor da caixa de login
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="button-color">Cor do Botão</Label>
                  <div className="flex gap-3">
                    <Input
                      id="button-color"
                      type="color"
                      value={colors.button_color}
                      onChange={(e) =>
                        setColors({ ...colors, button_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={colors.button_color}
                      onChange={(e) =>
                        setColors({ ...colors, button_color: e.target.value })
                      }
                      className="font-mono bg-muted/50"
                      placeholder="#6366F1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor dos botões de ação
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color">Cor do Texto</Label>
                  <div className="flex gap-3">
                    <Input
                      id="text-color"
                      type="color"
                      value={colors.text_color}
                      onChange={(e) =>
                        setColors({ ...colors, text_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={colors.text_color}
                      onChange={(e) =>
                        setColors({ ...colors, text_color: e.target.value })
                      }
                      className="font-mono bg-muted/50"
                      placeholder="#F1F5F9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor principal dos textos
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode">Modo Escuro</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ativar tema escuro na área de membros
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="dark-mode"
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <h4 className="font-semibold">Pré-visualização</h4>
                <div className="space-y-3">
                  <div
                    className="h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: colors.button_color }}
                  >
                    Botão de Acesso
                  </div>
                  <div
                    className="p-4 rounded-lg"
                    style={{ 
                      backgroundColor: colors.container_color,
                      color: colors.text_color
                    }}
                  >
                    <p className="font-medium">Container de Login</p>
                    <p className="text-sm opacity-80">Exemplo de texto no container</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveColors}
                  disabled={saving}
                  className="flex-1 bg-gradient-primary hover:opacity-90 transition-smooth"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button
                  onClick={handleResetDesign}
                  disabled={saving}
                  variant="outline"
                  className="flex-1"
                >
                  Excluir Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DesignTab;
