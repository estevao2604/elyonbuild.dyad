import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Module {
  id: string;
  title: string;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
}

interface AccessManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  projectId: string;
}

const AccessManagementDialog = ({ open, onOpenChange, member, projectId }: AccessManagementDialogProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [memberAccess, setMemberAccess] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && member) {
      loadModulesAndAccess();
    }
  }, [open, member, projectId]);

  const loadModulesAndAccess = async () => {
    if (!member) return;

    try {
      setLoading(true);

      // Carregar módulos do projeto
      const { data: modulesData, error: modulesError } = await sb
        .from("modules")
        .select("id, title")
        .eq("project_id", projectId)
        .order("display_order", { ascending: true });

      if (modulesError) throw modulesError;

      // Carregar acessos do membro
      const { data: accessData, error: accessError } = await sb
        .from("member_module_access")
        .select("module_id")
        .eq("member_id", member.id);

      if (accessError) throw accessError;

      setModules(modulesData || []);
      setMemberAccess(new Set(accessData?.map(a => a.module_id) || []));
    } catch (error: any) {
      toast.error("Erro ao carregar módulos e permissões");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async (moduleId: string) => {
    if (!member) return;

    const newAccess = new Set(memberAccess);
    const hasAccess = newAccess.has(moduleId);

    try {
      if (hasAccess) {
        // Remover acesso
        const { error } = await sb
          .from("member_module_access")
          .delete()
          .eq("member_id", member.id)
          .eq("module_id", moduleId);

        if (error) throw error;

        newAccess.delete(moduleId);
        toast.success("Acesso removido");
      } else {
        // Adicionar acesso
        const { error } = await sb
          .from("member_module_access")
          .insert({
            member_id: member.id,
            module_id: moduleId,
          });

        if (error) throw error;

        newAccess.add(moduleId);
        toast.success("Acesso concedido");
      }

      setMemberAccess(newAccess);
    } catch (error: any) {
      toast.error("Erro ao atualizar permissão");
      console.error(error);
    }
  };

  const handleGrantAllAccess = async () => {
    if (!member) return;

    try {
      setSaving(true);

      // Remover todos os acessos existentes
      await sb
        .from("member_module_access")
        .delete()
        .eq("member_id", member.id);

      // Adicionar acesso a todos os módulos
      const accessRecords = modules.map(module => ({
        member_id: member.id,
        module_id: module.id,
      }));

      const { error } = await sb
        .from("member_module_access")
        .insert(accessRecords);

      if (error) throw error;

      setMemberAccess(new Set(modules.map(m => m.id)));
      toast.success("Acesso total concedido!");
    } catch (error: any) {
      toast.error("Erro ao conceder acesso total");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeAllAccess = async () => {
    if (!member) return;

    try {
      setSaving(true);

      const { error } = await sb
        .from("member_module_access")
        .delete()
        .eq("member_id", member.id);

      if (error) throw error;

      setMemberAccess(new Set());
      toast.success("Todos os acessos removidos");
    } catch (error: any) {
      toast.error("Erro ao remover acessos");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Acesso</DialogTitle>
          <DialogDescription>
            Defina quais módulos {member?.full_name} pode acessar
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleGrantAllAccess}
                disabled={saving}
                className="flex-1"
              >
                Liberar Tudo
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRevokeAllAccess}
                disabled={saving}
                className="flex-1"
              >
                Bloquear Tudo
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {modules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum módulo criado ainda
                </p>
              ) : (
                modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center space-x-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={module.id}
                      checked={memberAccess.has(module.id)}
                      onCheckedChange={() => handleToggleAccess(module.id)}
                    />
                    <Label
                      htmlFor={module.id}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {module.title}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AccessManagementDialog;
