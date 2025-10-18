import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrandingSettingsFormProps {
  localColors: any;
  setLocalColors: (colors: any) => void;
  handleLogoUpload: (file: File) => void;
  uploadingLogo: boolean;
  customLogoUrl: string | null;
  defaultBranding: any;
  handleDeleteLogo: () => void; // Nova prop para excluir a logo
  deletingLogo: boolean; // Nova prop para estado de carregamento da exclusão
}

// Componente ColorInput movido para dentro deste arquivo
const ColorInput = ({ id, label, value, onChange, placeholder, description }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-3">
        <Input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-20 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono bg-muted/50"
          placeholder={placeholder}
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
};

const BrandingSettingsForm = ({
  localColors,
  setLocalColors,
  handleLogoUpload,
  uploadingLogo,
  customLogoUrl,
  defaultBranding,
  handleDeleteLogo,
  deletingLogo,
}: BrandingSettingsFormProps) => {
  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle>Configurações de Design</CardTitle>
        <CardDescription>
          Personalize o logo e as cores da sua área de membros.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-4 border-b border-border pb-6">
          <h3 className="text-lg font-semibold">Logo do Produto</h3>
          {customLogoUrl && (
            <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg mb-4">
              <img
                src={customLogoUrl}
                alt="Logo do Produto"
                className="max-h-32 object-contain"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteLogo}
                disabled={deletingLogo}
                className="mt-4"
              >
                {deletingLogo ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Remover Logo
              </Button>
            </div>
          )}
          <div>
            <Label htmlFor="product-logo-upload" className="cursor-pointer">
              <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-smooth">
                {uploadingLogo ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {customLogoUrl ? "Clique para alterar o logo" : "Clique para fazer upload do logo"}
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
                if (file) handleLogoUpload(file);
              }}
              className="hidden"
            />
          </div>
        </div>

        {/* Color Pickers */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Paleta de Cores</h3>
          <ColorInput
            id="primary-color"
            label="Cor Primária"
            value={localColors.primary_color}
            onChange={(value) => setLocalColors({ ...localColors, primary_color: value })}
            placeholder="#D4AF37"
            description="Usada em botões principais e destaques"
          />

          <ColorInput
            id="secondary-color"
            label="Cor Secundária"
            value={localColors.secondary_color}
            onChange={(value) => setLocalColors({ ...localColors, secondary_color: value })}
            placeholder="#FFD700"
            description="Usada em elementos secundários e gradientes"
          />

          <ColorInput
            id="accent-color"
            label="Cor de Destaque"
            value={localColors.accent_color}
            onChange={(value) => setLocalColors({ ...localColors, accent_color: value })}
            placeholder="#F59E0B"
            description="Usada em notificações e alertas importantes"
          />

          <ColorInput
            id="background-color"
            label="Cor do Fundo (Geral)"
            value={localColors.background_color || defaultBranding.background_color}
            onChange={(value) => setLocalColors({ ...localColors, background_color: value })}
            placeholder="#0A0A0A"
            description="Cor de fundo principal da área de membros e tela de login"
          />

          <ColorInput
            id="container-color"
            label="Cor do Container (Cards)"
            value={localColors.container_color || defaultBranding.container_color}
            onChange={(value) => setLocalColors({ ...localColors, container_color: value })}
            placeholder="#1A1A1A"
            description="Cor de fundo para cards de módulos/aulas e caixa de login"
          />

          <ColorInput
            id="button-color"
            label="Cor do Botão"
            value={localColors.button_color || defaultBranding.button_color}
            onChange={(value) => setLocalColors({ ...localColors, button_color: value })}
            placeholder="#D4AF37"
            description="Cor dos botões de ação na área de membros"
          />

          <ColorInput
            id="text-color"
            label="Cor do Texto (Principal)"
            value={localColors.text_color || defaultBranding.text_color}
            onChange={(value) => setLocalColors({ ...localColors, text_color: value })}
            placeholder="#F5F5F5"
            description="Cor principal dos textos na área de membros"
          />

          <ColorInput
            id="header-background-color"
            label="Cor do Fundo do Cabeçalho"
            value={localColors.header_background_color || defaultBranding.header_background_color}
            onChange={(value) => setLocalColors({ ...localColors, header_background_color: value })}
            placeholder="#1E293B"
            description="Cor de fundo da barra de navegação superior"
          />

          <ColorInput
            id="header-text-color"
            label="Cor do Texto do Cabeçalho"
            value={localColors.header_text_color || defaultBranding.header_text_color}
            onChange={(value) => setLocalColors({ ...localColors, header_text_color: value })}
            placeholder="#F1F5F9"
            description="Cor dos títulos e ícones na barra de navegação"
          />

          <ColorInput
            id="card-text-color"
            label="Cor do Texto dos Cards"
            value={localColors.card_text_color || defaultBranding.card_text_color}
            onChange={(value) => setLocalColors({ ...localColors, card_text_color: value })}
            placeholder="#F1F5F9"
            description="Cor dos títulos e descrições principais dentro dos cards"
          />

          <ColorInput
            id="muted-text-color"
            label="Cor do Texto Secundário (Muted)"
            value={localColors.muted_text_color || defaultBranding.muted_text_color}
            onChange={(value) => setLocalColors({ ...localColors, muted_text_color: value })}
            placeholder="#A0A0A0"
            description="Cor para textos menores e menos proeminentes"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandingSettingsForm;