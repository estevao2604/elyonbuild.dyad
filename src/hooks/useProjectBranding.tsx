import { useState, useEffect, useCallback } from "react";
import { sb } from "@/integrations/supabase/sb";
import { toast } from "sonner";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

interface Branding {
  id?: string;
  project_id: string;
  custom_logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string | null;
  container_color: string | null;
  button_color: string | null;
  text_color: string | null;
  header_background_color: string | null;
  header_text_color: string | null;
  card_text_color: string | null;
  muted_text_color: string | null;
  dark_mode: boolean | null;
}

const defaultBranding: Omit<Branding, 'project_id'> = {
  custom_logo_url: null,
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
  dark_mode: false,
};

export function useProjectBranding(projectId: string) {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);

  const applyBrandingStyles = useCallback((currentBranding: Branding) => {
    console.log("useProjectBranding: Applying branding styles to root:", currentBranding);
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

    root.classList.remove("member-dark");
  }, []);

  const loadBranding = useCallback(async () => {
    if (!projectId) {
      console.warn("useProjectBranding: projectId is null or undefined, cannot load branding.");
      return;
    }
    setLoading(true);
    console.log("useProjectBranding: Loading branding for projectId:", projectId);
    try {
      let currentBrandingData: Branding | null = null;

      const { data, error } = await sb
        .from("project_branding")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("useProjectBranding: Error fetching branding (not PGRST116):", error);
        toast.error("Erro ao carregar configurações de design.");
        const fallbackBranding: Branding = { ...defaultBranding, project_id: projectId };
        setBranding(fallbackBranding);
        applyBrandingStyles(fallbackBranding);
        setLoading(false);
        return;
      }

      currentBrandingData = data;
      console.log("useProjectBranding: Fetched branding data:", currentBrandingData);

      if (!currentBrandingData) {
        console.log("useProjectBranding: No branding found, creating default.");
        const { data: newBranding, error: createError } = await sb
          .from("project_branding")
          .insert([{ ...defaultBranding, project_id: projectId }])
          .select()
          .single();
        if (createError) {
          console.error("useProjectBranding: Error creating default branding:", createError);
          toast.error("Erro ao criar configurações de design padrão.");
          const fallbackBranding: Branding = { ...defaultBranding, project_id: projectId };
          setBranding(fallbackBranding);
          applyBrandingStyles(fallbackBranding);
          setLoading(false);
          return;
        }
        currentBrandingData = newBranding;
        console.log("useProjectBranding: Default branding created:", currentBrandingData);
      }
      
      setBranding(currentBrandingData);
      applyBrandingStyles(currentBrandingData);

    } catch (error: any) {
      console.error("useProjectBranding: Unexpected error in loadBranding:", error);
      toast.error("Erro inesperado ao carregar design.");
      const fallbackBranding: Branding = { ...defaultBranding, project_id: projectId };
      setBranding(fallbackBranding);
      applyBrandingStyles(fallbackBranding);
    } finally {
      setLoading(false);
      console.log("useProjectBranding: Finished loading branding.");
    }
  }, [projectId, applyBrandingStyles]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const saveBranding = useCallback(async (newBranding: Partial<Branding>) => {
    if (!projectId) {
      console.warn("useProjectBranding: projectId is null or undefined, cannot save branding.");
      return null;
    }
    console.log("useProjectBranding: Saving branding for projectId:", projectId, "with changes:", newBranding);
    try {
      const baseBranding = branding || { ...defaultBranding, project_id: projectId };

      const upsertPayload: TablesInsert<'project_branding'> = {
        project_id: projectId,
        custom_logo_url: newBranding.custom_logo_url ?? baseBranding.custom_logo_url,
        primary_color: newBranding.primary_color ?? baseBranding.primary_color,
        secondary_color: newBranding.secondary_color ?? baseBranding.secondary_color,
        accent_color: newBranding.accent_color ?? baseBranding.accent_color,
        background_color: newBranding.background_color ?? baseBranding.background_color,
        container_color: newBranding.container_color ?? baseBranding.container_color,
        button_color: newBranding.button_color ?? baseBranding.button_color,
        text_color: newBranding.text_color ?? baseBranding.text_color,
        header_background_color: newBranding.header_background_color ?? baseBranding.header_background_color,
        header_text_color: newBranding.header_text_color ?? baseBranding.header_text_color,
        card_text_color: newBranding.card_text_color ?? baseBranding.card_text_color,
        muted_text_color: newBranding.muted_text_color ?? baseBranding.muted_text_color,
        dark_mode: newBranding.dark_mode ?? baseBranding.dark_mode ?? false,
        updated_at: new Date().toISOString(),
      };

      if (baseBranding.id) {
        upsertPayload.id = baseBranding.id;
      }
      console.log("useProjectBranding: Upsert payload:", upsertPayload);

      const { data, error } = await sb
        .from("project_branding")
        .upsert(upsertPayload, { onConflict: 'project_id' })
        .select()
        .single();

      if (error) {
        console.error("useProjectBranding: Error during upsert:", error);
        throw error;
      }
      
      console.log("useProjectBranding: Upsert successful, data:", data);
      setBranding(data);
      applyBrandingStyles(data);
      toast.success("Design atualizado com sucesso!");
      return data;
    } catch (error: any) {
      console.error("useProjectBranding: Error saving branding:", error);
      toast.error(error.message || "Erro ao salvar design");
      return null;
    }
  }, [projectId, branding, applyBrandingStyles]);

  return { branding, loading, saveBranding, loadBranding, defaultBranding };
}