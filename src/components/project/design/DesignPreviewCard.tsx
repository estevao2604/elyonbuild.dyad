import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, BookOpen, CheckCircle } from "lucide-react";

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
        <div className={`space-y-4 p-4 rounded-lg border border-border ${localDarkMode ? "member-dark" : ""}`} style={{ backgroundColor: localColors.background_color }}>
          {/* Header Preview */}
          <div 
            className="h-14 rounded-lg flex items-center justify-between px-4"
            style={{ backgroundColor: localColors.header_background_color, color: localColors.header_text_color }}
          >
            <span className="font-bold text-lg">Meu Projeto</span>
            <Palette className="h-6 w-6" />
          </div>

          {/* Module Card Preview */}
          <div
            className="p-4 rounded-lg space-y-3 border border-border"
            style={{ 
              backgroundColor: localColors.container_color,
              color: localColors.card_text_color
            }}
          >
            <p className="font-medium text-lg">Título do Módulo</p>
            <p className="text-sm" style={{ color: localColors.muted_text_color }}>
              Uma breve descrição do conteúdo do módulo.
            </p>
            <div className="flex items-center gap-4 text-sm" style={{ color: localColors.muted_text_color }}>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>5 aulas</span>
              </div>
              <div className="flex items-center gap-1" style={{ color: localColors.primary_color }}>
                <CheckCircle className="h-4 w-4" />
                <span>2 concluídas</span>
              </div>
            </div>
            <Button
              className="w-full h-10"
              style={{ backgroundColor: localColors.button_color, color: localColors.text_color }}
            >
              Acessar Módulo
            </Button>
          </div>

          {/* General Text and Secondary Button */}
          <p className="text-sm text-center" style={{ color: localColors.text_color }}>
            Texto geral da área de membros.
          </p>
          <Button
            variant="outline"
            className="w-full h-10 border-2"
            style={{ 
              borderColor: localColors.primary_color, 
              color: localColors.primary_color,
              backgroundColor: 'transparent'
            }}
          >
            Botão Secundário
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DesignPreviewCard;