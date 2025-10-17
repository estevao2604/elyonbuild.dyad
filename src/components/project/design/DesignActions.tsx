import { Button } from "@/components/ui/button";

interface DesignActionsProps {
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  uploading: boolean;
}

const DesignActions = ({ onSave, onReset, saving, uploading }: DesignActionsProps) => {
  return (
    <div className="flex gap-3 pt-4 border-t border-border">
      <Button
        onClick={onSave}
        disabled={saving || uploading}
        className="flex-1 bg-gradient-primary hover:opacity-90 transition-smooth"
      >
        {saving ? "Salvando..." : "Salvar Alterações"}
      </Button>
      <Button
        onClick={onReset}
        disabled={saving || uploading}
        variant="outline"
        className="flex-1"
      >
        Restaurar Padrão
      </Button>
    </div>
  );
};

export default DesignActions;