import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useProjectBranding } from "@/hooks/useProjectBranding";
import LogoUploadCard from "./design/LogoUploadCard";
import ColorPickerSection from "./design/ColorPickerSection";
import DarkModeToggleCard from "./design/DarkModeToggleCard";
import DesignPreviewCard from "./design/DesignPreviewCard";
import DesignActions from "./design/DesignActions";

interface DesignTabProps {
  projectId: string;
}

const DesignTab = ({ projectId }: DesignTabProps) => {
  const { branding, loading, saveBranding, defaultBranding } = useProjectBranding(projectId);
  const [localColors, setLocalColors] = useState(defaultBranding);
  const [localDarkMode, setLocalDarkMode] = useState(false);
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
        custom_logo_url: branding.custom_logo_url,
      });
      setLocalDarkMode(branding.dark_mode || false);
    }
  }, [branding, defaultBranding]);

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
        <div className="space-y-6">
          <LogoUploadCard
            projectId={projectId}
            customLogoUrl={localColors.custom_logo_url}
            saveBranding={saveBranding}
          />
        </div>

        <div className="space-y-6">
          <ColorPickerSection
            localColors={localColors}
            setLocalColors={setLocalColors}
            defaultBranding={defaultBranding}
          />

          <DarkModeToggleCard
            localDarkMode={localDarkMode}
            setLocalDarkMode={setLocalDarkMode}
          />

          <DesignPreviewCard
            localColors={localColors}
            localDarkMode={localDarkMode}
          />

          <DesignActions
            onSave={handleSaveColors}
            onReset={handleResetDesign}
            saving={saving}
            uploading={false} // LogoUploadCard manages its own uploading state
          />
        </div>
      </div>
    </div>
  );
};

export default DesignTab;