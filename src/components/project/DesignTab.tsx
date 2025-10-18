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
  // Assuming URL format: https://<project_id>.supabase.co/storage/v1/object/public/project-files/<path_in_bucket>
  const parts = url.split('public/project-files/');
  console.log("DesignTab: getFilePathFromUrl - URL parts:", parts);
  return parts.length > 1 ? parts[1] : null;
};

const DesignTab = ({ projectId }: DesignTabProps) => {
  const { branding, loading, saveBranding, defaultBranding, loadBranding } = useProjectBranding(projectId);
  const [localColors, setLocalColors] = useState(defaultBranding);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);

  useEffect(() => {
    console.log("DesignTab: Branding effect triggered. Current branding:", branding);
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
      console.log("DesignTab: localColors updated from branding:", branding);
    }
  }, [branding, defaultBranding]);

  const handleSaveColors = async () => {
    console.log("DesignTab: handleSaveColors called. Local colors:", localColors);
    setSaving(true);
    await saveBranding({ ...localColors });
    setSaving(false);
    console.log("DesignTab: handleSaveColors finished.");
  };

  const handleResetDesign = async () => {
    if (!confirm("Tem certeza que deseja restaurar o design padrão? Isso removerá sua logo personalizada.")) return;
    console.log("DesignTab: handleResetDesign called.");
    setSaving(true);

    // Delete current logo from storage if it exists
    if (branding?.custom_logo_url) {
      const filePath = getFilePathFromUrl(branding.custom_logo_url);
      if (filePath) {
        console.log("DesignTab: Deleting old logo from storage during reset:", filePath);
        try {
          const { error: storageError } = await supabase.storage.from("project-files").remove([filePath]);
          if (storageError) {
            console.error("DesignTab: Error deleting old logo from storage during reset:", storageError);
            toast.error("Erro ao remover logo antiga do armazenamento.");
          } else {
            console.log("DesignTab: Old logo successfully deleted from storage during reset.");
          }
        } catch (error) {
          console.error("DesignTab: Unexpected error during old logo deletion on reset:", error);
        }
      }
    }

    const updatedBranding = await saveBranding({ ...defaultBranding, custom_logo_url: null });
    if (updatedBranding) {
      console.log("DesignTab: Branding reset to default and saved. Updated branding:", updatedBranding);
      setLocalColors(prev => ({ ...prev, custom_logo_url: updatedBranding.custom_logo_url }));
    }
    
    // Also update project's logo_url for consistency
    try {
      const { error: projectUpdateError } = await sb
        .from("projects")
        .update({ logo_url: null })
        .eq("id", projectId);
      if (projectUpdateError) {
        console.error("DesignTab: Error updating project logo_url during reset:", projectUpdateError);
      } else {
        console.log("DesignTab: Project logo_url set to null during reset.");
      }
    } catch (error) {
      console.error("DesignTab: Unexpected error updating project logo_url on reset:", error);
    }

    setSaving(false);
    loadBranding(); // Reload branding to reflect default values and null logo
    console.log("DesignTab: handleResetDesign finished.");
  };

  const handleLogoUpload = useCallback(async (file: File) => {
    console.log("DesignTab: handleLogoUpload called with file:", file);
    try {
      setUploadingLogo(true);

      // Delete old logo from storage if it exists
      if (branding?.custom_logo_url) {
        const oldFilePath = getFilePathFromUrl(branding.custom_logo_url);
        if (oldFilePath) {
          console.log("DesignTab: Deleting old logo from storage before new upload:", oldFilePath);
          try {
            const { error: storageError } = await supabase.storage.from("project-files").remove([oldFilePath]);
            if (storageError) {
              console.error("DesignTab: Error deleting old logo from storage during upload:", storageError);
              toast.error("Erro ao remover logo antiga do armazenamento.");
            } else {
              console.log("DesignTab: Old logo successfully deleted from storage during upload.");
            }
          } catch (error) {
            console.error("DesignTab: Unexpected error during old logo deletion on upload:", error);
          }
        }
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${projectId}-logo-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;
      console.log("DesignTab: Uploading new logo to path:", filePath);

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("project-files").getPublicUrl(filePath);
      console.log("DesignTab: New logo public URL:", data.publicUrl);

      const updatedBranding = await saveBranding({ custom_logo_url: data.publicUrl });

      // Also update project's logo_url for consistency
      try {
        const { error: projectUpdateError } = await sb
          .from("projects")
          .update({ logo_url: data.publicUrl })
          .eq("id", projectId);
        if (projectUpdateError) {
          console.error("DesignTab: Error updating project logo_url after new logo upload:", projectUpdateError);
        } else {
          console.log("DesignTab: Project logo_url updated after new logo upload.");
        }
      } catch (error) {
        console.error("DesignTab: Unexpected error updating project logo_url after new logo upload:", error);
      }

      if (updatedBranding) {
        setLocalColors(prev => ({ ...prev, custom_logo_url: updatedBranding.custom_logo_url }));
      }
      toast.success("Logo do Produto atualizado com sucesso!");
    } catch (error: any) {
      console.error("DesignTab: Upload error:", error);
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setUploadingLogo(false);
      console.log("DesignTab: handleLogoUpload finished.");
    }
  }, [projectId, saveBranding, branding]);

  const handleDeleteLogo = useCallback(async () => {
    if (!confirm("Tem certeza que deseja remover a logo?")) return;
    console.log("DesignTab: handleDeleteLogo called.");

    try {
      setDeletingLogo(true);

      // Delete logo from storage
      if (branding?.custom_logo_url) {
        const filePath = getFilePathFromUrl(branding.custom_logo_url);
        if (filePath) {
          console.log("DesignTab: Deleting logo from storage:", filePath);
          const { error: storageError } = await supabase.storage
            .from("project-files")
            .remove([filePath]);

          if (storageError) {
            console.error("DesignTab: Error deleting logo from storage:", storageError);
            throw storageError;
          }
          console.log("DesignTab: Logo successfully deleted from storage.");
        }
      }

      const updatedBranding = await saveBranding({ custom_logo_url: null });

      // Also update project's logo_url for consistency
      try {
        const { error: projectUpdateError } = await sb
          .from("projects")
          .update({ logo_url: null })
          .eq("id", projectId);
        if (projectUpdateError) {
          console.error("DesignTab: Error updating project logo_url after logo deletion:", projectUpdateError);
        } else {
          console.log("DesignTab: Project logo_url set to null after logo deletion.");
        }
      } catch (error) {
        console.error("DesignTab: Unexpected error updating project logo_url after logo deletion:", error);
      }

      if (updatedBranding) {
        setLocalColors(prev => ({ ...prev, custom_logo_url: updatedBranding.custom_logo_url }));
      }
      toast.success("Logo do Produto removida com sucesso!");
    } catch (error: any) {
      console.error("DesignTab: Delete logo error:", error);
      toast.error("Erro ao remover a logo: " + error.message);
    } finally {
      setDeletingLogo(false);
      console.log("DesignTab: handleDeleteLogo finished.");
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