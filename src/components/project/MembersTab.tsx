import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Trash2, Mail, Shield, CheckCircle, XCircle, Key, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import bcrypt from "bcryptjs";
import AccessManagementDialog from "./AccessManagementDialog";

interface Member {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface MembersTabProps {
  projectId: string;
  projectName: string;
}

const MembersTab = ({ projectId, projectName }: MembersTabProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [publicAccessEnabled, setPublicAccessEnabled] = useState(false);

  const [newMember, setNewMember] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "member",
  });

  useEffect(() => {
    loadMembers();
    checkPublicAccess();
  }, [projectId]);

  const checkPublicAccess = async () => {
    try {
      // Verificar se há módulos publicados
      const { data: publishedModules } = await sb
        .from("modules")
        .select("id")
        .eq("project_id", projectId)
        .eq("is_published", true);

      setPublicAccessEnabled(publishedModules && publishedModules.length > 0);
    } catch (error) {
      console.error("Erro ao verificar acesso público:", error);
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await sb
        .from("project_members")
        .select("*")
        .eq("project_id", projectId)
        .not("email", "ilike", "public_%") // Excluir membros públicos
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar membros");
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewMember({ ...newMember, password });
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Hash password before storing
      const passwordHash = await bcrypt.hash(newMember.password, 10);

      const { data: newMemberData, error } = await sb.from("project_members").insert([
        {
          project_id: projectId,
          email: newMember.email,
          full_name: newMember.full_name,
          password_hash: passwordHash,
          role: newMember.role,
        },
      ]).select().single();

      if (error) throw error;
      
      // Dar acesso automático a todos os módulos publicados
      if (newMemberData) {
        const { data: modules } = await sb
          .from("modules")
          .select("id")
          .eq("project_id", projectId)
          .eq("is_published", true);

        if (modules && modules.length > 0) {
          const accessRecords = modules.map(module => ({
            member_id: newMemberData.id,
            module_id: module.id
          }));

          await sb
            .from("member_module_access")
            .insert(accessRecords);
        }
      }

      toast.success(`Membro ${newMember.full_name} adicionado com acesso a todos os módulos!`);
      toast.info(`Senha: ${newMember.password} (Anote esta senha, ela não será mostrada novamente)`, {
        duration: 10000,
      });
      
      setDialogOpen(false);
      setNewMember({ email: "", full_name: "", password: "", role: "member" });
      loadMembers();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Este email já está cadastrado neste projeto");
      } else {
        toast.error("Erro ao adicionar membro");
      }
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${memberName}?`)) return;

    try {
      const { error } = await sb.from("project_members").delete().eq("id", memberId);

      if (error) throw error;

      toast.success("Membro removido com sucesso!");
      loadMembers();
    } catch (error: any) {
      toast.error("Erro ao remover membro");
    }
  };

  const toggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    try {
      const { error } = await sb
        .from("project_members")
        .update({ is_active: !currentStatus })
        .eq("id", memberId);

      if (error) throw error;

      toast.success(`Membro ${!currentStatus ? "ativado" : "desativado"} com sucesso!`);
      loadMembers();
    } catch (error: any) {
      toast.error("Erro ao atualizar status do membro");
    }
  };

  const getMemberLoginUrl = () => {
    return `${window.location.origin}/member/${projectId}`;
  };

  const copyLoginUrl = () => {
    navigator.clipboard.writeText(getMemberLoginUrl());
    toast.success("URL de login copiada!");
  };

  const handleDirectAccess = () => {
    window.open(getMemberLoginUrl(), "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold">Gestão de Membros</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Adicione e gerencie os membros da sua área</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 transition-smooth w-full sm:w-auto flex-shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              <span className="whitespace-nowrap">Adicionar Membro</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Membro</DialogTitle>
              <DialogDescription>
                Crie um novo membro para {projectName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={newMember.full_name}
                  onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                  required
                  placeholder="João Silva"
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  required
                  placeholder="joao@email.com"
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    value={newMember.password}
                    onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                    required
                    placeholder="Senha do membro"
                    className="bg-muted/50"
                  />
                  <Button type="button" onClick={generatePassword} variant="outline">
                    Gerar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta senha será mostrada apenas uma vez. Anote-a ou envie ao membro.
                </p>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
                Adicionar Membro
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle>URL de Acesso da Área de Membros</CardTitle>
          <CardDescription>
            Compartilhe esta URL com seus membros para que eles possam acessar a área
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={getMemberLoginUrl()}
              readOnly
              className="bg-muted/50 font-mono text-sm flex-1"
            />
            <div className="flex gap-2">
              <Button onClick={copyLoginUrl} variant="outline" className="w-full sm:w-auto">
                Copiar
              </Button>
              <Button onClick={handleDirectAccess} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                <ExternalLink className="h-4 w-4 mr-2" />
                Acessar Área
              </Button>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {publicAccessEnabled ? (
                  <Eye className="h-5 w-5 text-green-500" />
                ) : (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">
                  {publicAccessEnabled 
                    ? "Acesso público habilitado" 
                    : "Acesso público desabilitado"}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {publicAccessEnabled 
                  ? "Visitantes podem acessar conteúdo público" 
                  : "Publique módulos para habilitar acesso público"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {members.length === 0 ? (
        <Card className="shadow-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum membro adicionado ainda</p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-primary hover:opacity-90"
            >
              Adicionar Primeiro Membro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card border-border/50">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[100px]">Função</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Adicionado em</TableHead>
                  <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.full_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {member.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {member.role}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMemberStatus(member.id, member.is_active)}
                        className="flex items-center gap-2"
                      >
                        {member.is_active ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-500">Ativo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-500">Inativo</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setAccessDialogOpen(true);
                          }}
                          title="Gerenciar Acesso"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMember(member.id, member.full_name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AccessManagementDialog
        open={accessDialogOpen}
        onOpenChange={setAccessDialogOpen}
        member={selectedMember}
        projectId={projectId}
      />
    </div>
  );
};

export default MembersTab;