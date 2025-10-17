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
  background_color: string | null;
  container_color: string | null;
  button_color: string | null;
  text_color: string | null;
  dark_mode: boolean | null;
  header_background_color: string | null; // New
  header_text_color: string | null; // New
  card_text_color: string | null; // New
  muted_text_color: string | null; // New
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
    primary_color: "#D4AF37",
    secondary_color: "#FFD700",
    accent_color: "#F59E0B",
    background_color: "#0A0A0A",
    container_color: "#1A1A1A",
    button_color: "#D4AF37",
    text_color: "#F5F5F5",
    header_background_color: "#1E293B", // Default for new field
    header_text_color: "#F1F5F9", // Default for new field
    card_text_color: "#F1F5F9", // Default for new field
    muted_text_color: "#A0A0A0", // Default for new field
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
          background_color: data.background_color || "#0A0A0A",
          container_color: data.container_color || "#1A1A1A",
          button_color: data.button_color || "#D4AF37",
          text_color: data.text_color || "#F5F5F5",
          header_background_color: data.header_background_color || "#1E293B", // Load new field
          header_text_color: data.header_text_color || "#F1F5F9", // Load new field
          card_text_color: data.card_text_color || "#F1F5F9", // Load new field
          muted_text_color: data.muted_text_color || "#A0A0A0", // Load new field
        });
        setDarkMode(data.dark_mode || false);
      } else {
        // Create default branding with new fields
        const { data: newBranding, error: createError } = await sb
          .from("project_branding")
          .insert([{ 
            project_id: projectId,
            primary_color: colors.primary_color,
            secondary_color: colors.secondary_color,
            accent_color: colors.accent_color,
            background_color: colors.background_color,
            container_color: colors.container_color,
            button_color: colors.button_color,
            text_color: colors.text_color,
            header_background_color: colors.header_background_color, // Set default for new field
            header_text_color: colors.header_text_color, // Set default for new field
            card_text_color: colors.card_text_color, // Set default for new field
            muted_text_color: colors.muted_text_color, // Set default for new field
          }])
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

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${projectId}-logo-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("project-files").getPublicUrl(filePath);

      const { error: updateError } = await sb
        .from("project_branding")
        .update({ custom_logo_url: data.publicUrl })
        .eq("project_id", projectId);

      if (updateError) throw updateError;

      await sb
        .from("projects")
        .update({ logo_url: data.publicUrl })
        .eq("id", projectId);

      toast.success("Logo do Produto atualizado com sucesso!");
      loadBranding();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveColors = async () => {
    try {
      setSaving(true);

      // Use upsert for project_branding to create if not exists, update otherwise
      const { data: updatedBranding, error: brandingError } = await sb
        .from("project_branding")
        .upsert({ 
          project_id: projectId, // Ensure project_id is always included for upsert
          ...colors, 
          dark_mode: darkMode,
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id' }) // Conflict on project_id to update existing row
        .select()
        .single();

      if (brandingError) throw brandingError;

      // Update the local branding state with the new data
      setBranding(updatedBranding);

      // Update project's primary and secondary colors
      const { error: projectUpdateError } = await sb
        .from("projects")
        .update({
          primary_color: colors.primary_color,
          secondary_color: colors.secondary_color,
          updated_at: new Date().toISOString()
        })
        .eq("id", projectId);

      if (projectUpdateError) throw projectUpdateError;

      toast.success("Design atualizado com sucesso!");
      loadBranding(); // Reload to ensure all state is consistent
    } catch (error: any) {
      console.error("Error saving design:", error); // Log the actual error
      toast.error(error.message || "Erro ao salvar design");
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
        header_background_color: "#1E293B",
        header_text_color: "#F1F5F9",
        card_text_color: "#F1F5F9",
        muted_text_color: "#A0A0A0",
      };

      // Use upsert for project_branding
      const { error: brandingError } = await sb
        .from("project_branding")
        .upsert({ 
          project_id: projectId, // Ensure project_id is included
          ...defaultColors, 
          dark_mode: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id' });

      if (brandingError) throw brandingError;

      setColors(defaultColors);
      setDarkMode(false);
      toast.success("Design restaurado para o padrão!");
      loadBranding();
    } catch (error: any) {
      console.error("Error resetting design:", error); // Log the actual error
      toast.error(error.message || "Erro ao restaurar design");
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
              <CardTitle>Logo do Produto</CardTitle>
              <CardDescription>
                Logo que aparecerá na área de membros e no login dos seus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {branding?.custom_logo_url && (
                <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
                  <img
                    src={branding.custom_logo_url}
                    alt="Logo do Produto"
                    className="max-h-32 object-contain"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="product-logo-upload" className="cursor-pointer">
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
                  id="product-logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
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
                      placeholder="#D4AF37"
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
                      placeholder="#FFD700"
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
                  <Label htmlFor="background-color">Cor do Fundo (Geral)</Label>
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
                      placeholder="#0A0A0A"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor de fundo principal da área de membros e tela de login
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="container-color">Cor do Container (Cards)</Label>
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
                      placeholder="#1A1A1A"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor de fundo para cards de módulos/aulas e caixa de login
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
                      placeholder="#D4AF37"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor dos botões de ação na área de membros
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color">Cor do Texto (Principal)</Label>
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
                      placeholder="#F5F5F5"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor principal dos textos na área de membros
                  </p>
                </div>

                {/* New fields for header and card text */}
                <div className="space-y-2">
                  <Label htmlFor="header-background-color">Cor do Fundo do Cabeçalho</Label>
                  <div className="flex gap-3">
                    <Input
                      id="header-background-color"
                      type="color"
                      value={colors.header_background_color}
                      onChange={(e) =>
                        setColors({ ...colors, header_background_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={colors.header_background_color}
                      onChange={(e) =>
                        setColors({ ...colors, header_background_color: e.target.value })
                      }
                      className="font-mono bg-muted/50"
                      placeholder="#1E293B"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor de fundo da barra de navegação superior
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="header-text-color">Cor do Texto do Cabeçalho</Label>
                  <div className="flex gap-3">
                    <Input
                      id="header-text-color"
                      type="color"
                      value={colors.header_text_color}
                      onChange={(e) =>
                        setColors({ ...colors, header_text_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={colors.header_text_color}
                      onChange={(e) =>
                        setColors({ ...colors, header_text_color: e.target.value })
                      }
                      className="font-mono bg-muted/50"
                      placeholder="#F1F5F9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor dos títulos e ícones na barra de navegação
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-text-color">Cor do Texto dos Cards</Label>
                  <div className="flex gap-3">
                    <Input
                      id="card-text-color"
                      type="color"
                      value={colors.card_text_color}
                      onChange={(e) =>
                        setColors({ ...colors, card_text_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={colors.card_text_color}
                      onChange={(e) =>
                        setColors({ ...colors, card_text_color: e.target.value })
                      }
                      className="font-mono bg-muted/50"
                      placeholder="#F1F5F9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor dos títulos e descrições principais dentro dos cards
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="muted-text-color">Cor do Texto Secundário (Muted)</Label>
                  <div className="flex gap-3">
                    <Input
                      id="muted-text-color"
                      type="color"
                      value={colors.muted_text_color}
                      onChange={(e) =>
                        setColors({ ...colors, muted_text_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={colors.muted_text_color}
                      onChange={(e) =>
                        setColors({ ...colors, muted_text_color: e.target.value })
                      }
                      className="font-mono bg-muted/50"
                      placeholder="#A0A0A0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor para textos menores e menos proeminentes
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
                <div className="space-y-3 p-4 rounded-lg" style={{ backgroundColor: colors.background_color }}>
                  <div 
                    className="h-14 rounded-lg flex items-center justify-between px-4"
                    style={{ backgroundColor: colors.header_background_color, color: colors.header_text_color }}
                  >
                    <span className="font-bold text-lg">Cabeçalho</span>
                    <Palette className="h-6 w-6" />
                  </div>
                  <div
                    className="p-4 rounded-lg space-y-2"
                    style={{ 
                      backgroundColor: colors.container_color,
                      color: colors.card_text_color
                    }}
                  >
                    <p className="font-medium text-lg">Título do Card</p>
                    <p className="text-sm" style={{ color: colors.muted_text_color }}>
                      Exemplo de descrição ou texto secundário no card.
                    </p>
                    <Button
                      className="w-full h-10"
                      style={{ backgroundColor: colors.button_color, color: colors.text_color }}
                    >
                      Botão de Ação
                    </Button>
                  </div>
                  <p className="text-sm text-center" style={{ color: colors.text_color }}>
                    Texto geral da área de membros.
                  </p>
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