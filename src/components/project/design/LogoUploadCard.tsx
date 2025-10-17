import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { toast } from "sonner";
import { useState } from "react";

interface LogoUploadCardProps {
  projectId: string;
  customLogoUrl: string | null;
  saveBranding: (branding: any) => Promise<any>;
}

const LogoUploadCard = ({ projectId, customLogoUrl, saveBranding }: LogoUploadCardProps) => {
  const [uploading, setUploading] = useState(false);

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

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle>Logo do Produto</CardTitle>
        <CardDescription>
          Logo que aparecerá na área de membros e no login dos seus clientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {customLogoUrl && (
          <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
            <img
              src={customLogoUrl}
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
  );
};

export default LogoUploadCard;