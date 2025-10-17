import { useState, useEffect, useCallback } from "react";
import { sb } from "@/integrations/supabase/sb";
import { toast } from "sonner";

interface Branding {
  id?: string;
  custom_logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string | null;
  container_color: string | null;
  button_color: string | null;
  text_color: string | null;
  dark_mode: boolean | null;
  header_background_color: string | null;
  header_text_color: string | null;
  card_text_color: string | null;
  muted_text_color: string | null;
}

const defaultBranding: Branding = {
  custom_logo_url: null,
  primary_color: "#D4AF37",
  secondary_color: "#FFD700",
  accent_color: "#F59E0B",
  background_color: "#0A0A0A",
  container_color: "#1A1A1A",
  button_color: "#D4AF37",
  text_color: "#F5F5F5",
  dark_mode: false,
  header_background_color: "#1E293B",
  header_text_color: "#F1F5F9",
  card_text_color: "#F1F5F9",
  muted_text_color: "#A0A0A0",
};

export function useProjectBranding(projectId: string) {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);

  const applyBrandingStyles = useCallback((currentBranding: Branding) => {
    const root = document.documentElement;
    root.style.setProperty('--member-background-color', currentBranding.background_color || defaultBranding.background_color);
    root.style.setProperty('--member-container-color', currentBranding.container_color || defaultBranding.container_color);
    root.style.setProperty('--member-text-color', currentBranding.text_color || defaultBranding.text_color);
    root.style.setProperty('--member-primary-color', currentBranding.primary_color || defaultBranding.primary_color);
    root.style.setProperty('--member-secondary-color', currentBranding.secondary_color || defaultBranding.secondary_color);
    root.style.setProperty('--member-accent-color', currentBranding.accent_color || defaultBranding.accent_color);
    root.style.setProperty('--member-button-color', currentBranding.button_color || defaultBranding.button_color);
    root.style.setProperty('--member-header-background-color', currentBranding.header_background_color || defaultBranding.header_background_color);
    root.style.setProperty('--member-header-text-color', currentBranding.header_text_color || defaultBranding.header_text_color);
    root.style.setProperty('--member-card-text-color', currentBranding.card_text_color || defaultBranding.card_text_color);
    root.style.setProperty('--member-muted-text-color', currentBranding.muted_text_color || defaultBranding.muted_text_color);

    if (currentBranding.dark_mode) {
      root.classList.add("member-dark");
    } else {
      root.classList.remove("member-dark");
    }
  }, []);

  const loadBranding = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("project_branding")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 means no rows found

      let currentBranding = data || { ...defaultBranding, project_id: projectId };

      // If no branding exists, create default one
      if (!data) {
        const { data: newBranding, error: createError } = await sb
          .from("project_branding")
          .insert([{ ...defaultBranding, project_id: projectId }])
          .select()
          .single();
        if (createError) throw createError;
        currentBranding = newBranding;
      }
      
      setBranding(currentBranding);
      applyBrandingStyles(currentBranding);

    } catch (error: any) {
      console.error("Error loading branding:", error);
      toast.error("Erro ao carregar configurações de design");
      setBranding({ ...defaultBranding, project_id: projectId }); // Fallback to default
      applyBrandingStyles({ ...defaultBranding, project_id: projectId });
    } finally {
      setLoading(false);
    }
  }, [projectId, applyBrandingStyles]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const saveBranding = useCallback(async (newBranding: Partial<Branding>) => {
    if (!projectId) return;
    try {
      const updatedBranding = { ...branding, ...newBranding, updated_at: new Date().toISOString() };
      const { data, error } = await sb
        .from("project_branding")
        .upsert({ ...updatedBranding, project_id: projectId }, { onConflict: 'project_id' })
        .select()
        .single();

      if (error) throw error;
      
      setBranding(data);
      applyBrandingStyles(data);
      toast.success("Design atualizado com sucesso!");
      return data;
    } catch (error: any) {
      console.error("Error saving branding:", error);
      toast.error(error.message || "Erro ao salvar design");
      return null;
    }
  }, [projectId, branding, applyBrandingStyles]);

  return { branding, loading, saveBranding, loadBranding, defaultBranding };
}