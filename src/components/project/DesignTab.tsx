import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useProjectBranding } from "@/hooks/useProjectBranding";

interface DesignTabProps {
  projectId: string;
}

const DesignTab = ({ projectId }: DesignTabProps) => {
  const { branding, loading, saveBranding, defaultBranding } = useProjectBranding(projectId);
  const [localColors, setLocalColors] = useState(defaultBranding);
  const [localDarkMode, setLocalDarkMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (branding) {
      setLocalColors({
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        accent_color: branding.accent_color,
        background_color: branding.background_color || defaultBranding.background_color,
        container_color: branding.container_color || defaultBranding.container_color,
        button_color: branding.button_color || defaultBranding.button_color,
        text_color: branding.text_color || defaultBranding.text_color,
        header_background_color: branding.header_background_color || defaultBranding.header_background_color,
        header_text_color: branding.header_text_color || defaultBranding.header_text_color,
        card_text_color: branding.card_text_color || defaultBranding.card_text_color,
        muted_text_color: branding.muted_text_color || defaultBranding.muted_text_color,
        custom_logo_url: branding.custom_logo_url, // Keep logo URL in sync
        dark_mode: branding.dark_mode, // Keep dark mode in sync
      });
      setLocalDarkMode(branding.dark_mode || false);
    }
  }, [branding, defaultBranding]);

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

      await saveBranding({ custom_logo_url: data.publicUrl });

      // Also update project's logo_url for consistency
      await sb
        .from("projects")
        .update({ logo_url: data.publicUrl })
        .eq("id", projectId);

      toast.success("Logo do Produto atualizado com sucesso!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveColors = async () => {
    setSaving(true);
    await saveBranding({ ...localColors, dark_mode: localDarkMode });
    setSaving(false);
  };

  const handleResetDesign = async () => {
    setSaving(true);
    await saveBranding({ ...defaultBranding, custom_logo_url: null, dark_mode: false });
    setSaving(false);
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
              {localColors.custom_logo_url && (
                <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
                  <img
                    src={localColors.custom_logo_url}
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
                      value={localColors.primary_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, primary_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={localColors.primary_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, primary_color: e.target.value })
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
                      value={localColors.secondary_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, secondary_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={localColors.secondary_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, secondary_color: e.target.value })
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
                      value={localColors.accent_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, accent_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={localColors.accent_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, accent_color: e.target.value })
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
                      value={localColors.background_color || defaultBranding.background_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, background_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={localColors.background_color || defaultBranding.background_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, background_color: e.target.value })
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
                      value={localColors.container_color || defaultBranding.container_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, container_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={localColors.container_color || defaultBranding.container_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, container_color: e.target.value })
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
                      value={localColors.button_color || defaultBranding.button_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, button_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={localColors.button_color || defaultBranding.button_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, button_color: e.target.value })
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
                      value={localColors.text_color || defaultBranding.text_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, text_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={localColors.text_color || defaultBranding.text_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, text_color: e.target.value })
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
                      value={localColors.header_background_color || defaultBranding.header_background_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, header_background_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={localColors.header_background_color || defaultBranding.header_background_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, header_background_color: e.target.value })
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
                      value={localColors.header_text_color || defaultBranding.header_text_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, header_text_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={localColors.header_text_color || defaultBranding.header_text_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, header_text_color: e.target.value })
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
                      value={localColors.card_text_color || defaultBranding.card_text_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, card_text_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={localColors.card_text_color || defaultBranding.card_text_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, card_text_color: e.target.value })
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
                      value={localColors.muted_text_color || defaultBranding.muted_text_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, muted_text_color: e.target.value })
                      }
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={localColors.muted_text_color || defaultBranding.muted_text_color}
                      onChange={(e) =>
                        setLocalColors({ ...localColors, muted_text_color: e.target.value })
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
                      checked={localDarkMode}
                      onChange={(e) => setLocalDarkMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <h4 className="font-semibold">Pré-visualização</h4>
                <div className={`space-y-3 p-4 rounded-lg ${localDarkMode ? "member-dark" : ""}`} style={{ backgroundColor: localColors.background_color }}>
                  <div 
                    className="h-14 rounded-lg flex items-center justify-between px-4"
                    style={{ backgroundColor: localColors.header_background_color, color: localColors.header_text_color }}
                  >
                    <span className="font-bold text-lg">Cabeçalho</span>
                    <Palette className="h-6 w-6" />
                  </div>
                  <div
                    className="p-4 rounded-lg space-y-2"
                    style={{ 
                      backgroundColor: localColors.container_color,
                      color: localColors.card_text_color
                    }}
                  >
                    <p className="font-medium text-lg">Título do Card</p>
                    <p className="text-sm" style={{ color: localColors.muted_text_color }}>
                      Exemplo de descrição ou texto secundário no card.
                    </p>
                    <Button
                      className="w-full h-10"
                      style={{ backgroundColor: localColors.button_color, color: localColors.text_color }}
                    >
                      Botão de Ação
                    </Button>
                  </div>
                  <p className="text-sm text-center" style={{ color: localColors.text_color }}>
                    Texto geral da área de membros.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveColors}
                  disabled={saving || uploading}
                  className="flex-1 bg-gradient-primary hover:opacity-90 transition-smooth"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
                <Button
                  onClick={handleResetDesign}
                  disabled={saving || uploading}
                  variant="outline"
                  className="flex-1"
                >
                  Restaurar Padrão
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