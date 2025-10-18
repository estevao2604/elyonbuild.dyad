import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useProjectBranding } from "@/hooks/useProjectBranding";
import BrandingSettingsForm from "./design/BrandingSettingsForm";
import BrandingPreview from "./design/BrandingPreview";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Loader2 } from "lucide-react";

interface DesignTabProps {
  projectId: string;
}

// Helper function to extract file path from Supabase public URL
const getFilePathFromUrl = (url: string | null): string | null => {
  if (!url) return null;
  const parts = url.split('public/project-files/');
  return parts.length > 1 ? parts[1] : null;
};

const DesignTab = ({ projectId }: DesignTabProps) => {
  const { branding, loading, saveBranding, defaultBranding, loadBranding } = useProjectBranding(projectId);
  const [localColors, setLocalColors] = useState(defaultBranding);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);

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
        custom_logo_url: branding.custom_logo_url,
        dark_mode: branding.dark_mode ?? defaultBranding.dark_mode,
      });
    }
  }, [branding, defaultBranding]);

  const handleSaveColors = async () => {
    setSaving(true);
    await saveBranding({ ...localColors });
    setSaving(false);
  };

  const handleResetDesign = async () => {
    if (!confirm("Tem certeza que deseja restaurar o design padrão? Isso removerá sua logo personalizada.")) return;
    setSaving(true);

    // Delete current logo from storage if it exists
    if (branding?.custom_logo_url) {
      const filePath = getFilePathFromUrl(branding.custom_logo_url);
      if (filePath) {
        try {
          await supabase.storage.from("project-files").remove([filePath]);
        } catch (error) {
          console.error("Error deleting old logo from storage during reset:", error);
          // Continue even if storage deletion fails, as DB update is more critical
        }
      }
    }

    await saveBranding({ ...defaultBranding, custom_logo_url: null });
    setSaving(false);
    loadBranding(); // Reload branding to reflect default values and null logo
  };

  const handleLogoUpload = useCallback(async (file: File) => {
    try {
      setUploadingLogo(true);

      // Delete old logo from storage if it exists
      if (branding?.custom_logo_url) {
        const oldFilePath = getFilePathFromUrl(branding.custom_logo_url);
        if (oldFilePath) {
          try {
            await supabase.storage.from("project-files").remove([oldFilePath]);
          } catch (error) {
            console.error("Error deleting old logo from storage:", error);
            // Continue with new upload even if old deletion fails
          }
        }
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${projectId}-logo-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("project-files").getPublicUrl(filePath);

      const updatedBranding = await saveBranding({ custom_logo_url: data.publicUrl });

      // Also update project's logo_url for consistency
      await sb
        .from("projects")
        .update({ logo_url: data.publicUrl })
        .eq("id", projectId);

      if (updatedBranding) {
        setLocalColors(prev => ({ ...prev, custom_logo_url: updatedBranding.custom_logo_url }));
      }
      toast.success("Logo do Produto atualizado com sucesso!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setUploadingLogo(false);
    }
  }, [projectId, saveBranding, branding]);

  const handleDeleteLogo = useCallback(async () => {
    if (!confirm("Tem certeza que deseja remover a logo?")) return;

    try {
      setDeletingLogo(true);

      // Delete logo from storage
      if (branding?.custom_logo_url) {
        const filePath = getFilePathFromUrl(branding.custom_logo_url);
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from("project-files")
            .remove([filePath]);

          if (storageError) throw storageError;
        }
      }

      const updatedBranding = await saveBranding({ custom_logo_url: null });

      // Also update project's logo_url for consistency
      await sb
        .from("projects")
        .update({ logo_url: null })
        .eq("id", projectId);

      if (updatedBranding) {
        setLocalColors(prev => ({ ...prev, custom_logo_url: updatedBranding.custom_logo_url }));
      }
      toast.success("Logo do Produto removida com sucesso!");
    } catch (error: any) {
      console.error("Delete logo error:", error);
      toast.error("Erro ao remover a logo: " + error.message);
    } finally {
      setDeletingLogo(false);
    }
  }, [projectId, saveBranding, branding]);

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
        <BrandingSettingsForm
          localColors={localColors}
          setLocalColors={setLocalColors}
          handleLogoUpload={handleLogoUpload}
          uploadingLogo={uploadingLogo}
          customLogoUrl={localColors.custom_logo_url}
          defaultBranding={defaultBranding}
          handleDeleteLogo={handleDeleteLogo}
          deletingLogo={deletingLogo}
        />

        <div className="space-y-6">
          <BrandingPreview
            localColors={localColors}
            customLogoUrl={localColors.custom_logo_url}
          />
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              onClick={handleSaveColors}
              disabled={saving || uploadingLogo || deletingLogo}
              className="flex-1 bg-gradient-primary hover:opacity-90 transition-smooth"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
            <Button
              onClick={handleResetDesign}
              disabled={saving || uploadingLogo || deletingLogo}
              variant="outline"
              className="flex-1"
            >
              Restaurar Padrão
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignTab;