import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

interface DesignPreviewCardProps {
  localColors: any; // Use a more specific type if available
  localDarkMode: boolean;
}

const DesignPreviewCard = ({ localColors, localDarkMode }: DesignPreviewCardProps) => {
  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle>Pré-visualização</CardTitle>
        <CardDescription>
          Veja como seu design aparecerá na área de membros
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default DesignPreviewCard;