import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface DarkModeToggleCardProps {
  localDarkMode: boolean;
  setLocalDarkMode: (checked: boolean) => void;
}

const DarkModeToggleCard = ({ localDarkMode, setLocalDarkMode }: DarkModeToggleCardProps) => {
  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle>Modo Escuro</CardTitle>
        <CardDescription>
          Ativar tema escuro na área de membros
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="dark-mode">Ativar Modo Escuro</Label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              id="dark-mode"
              type="checkbox"
              checked={localDarkMode}
              onChange={(e) => setLocalDarkMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default DarkModeToggleCard;