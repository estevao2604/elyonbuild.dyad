import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ColorInput from "./ColorInput";

interface ColorPickerSectionProps {
  localColors: any; // Use a more specific type if available
  setLocalColors: (colors: any) => void;
  defaultBranding: any; // Use a more specific type if available
}

const ColorPickerSection = ({ localColors, setLocalColors, defaultBranding }: ColorPickerSectionProps) => {
  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle>Paleta de Cores</CardTitle>
        <CardDescription>
          Defina as cores principais da sua área de membros
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
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

export default ColorPickerSection;