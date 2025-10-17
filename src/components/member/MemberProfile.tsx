import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Upload, Lock, LogOut, User } from "lucide-react";
import bcrypt from "bcryptjs";

interface MemberProfileProps {
  memberId: string;
  projectId: string;
}

const MemberProfile = ({ memberId, projectId }: MemberProfileProps) => {
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (memberId) {
      loadMember();
    }
  }, [memberId]);

  const loadMember = async () => {
    try {
      const { data, error } = await sb
        .from("project_members")
        .select("*")
        .eq("id", memberId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setMember(data);
        // Atualizar sessão com foto atualizada
        const session = sessionStorage.getItem("member_session");
        if (session) {
          const sessionData = JSON.parse(session);
          sessionData.profile_photo_url = data.profile_photo_url;
          sessionStorage.setItem("member_session", JSON.stringify(sessionData));
        }
      }
    } catch (error) {
      console.error("Error loading member:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, selecione uma imagem válida");
        setUploading(false);
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${memberId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // Remover foto antiga se existir
      if (member?.profile_photo_url) {
        const oldPath = member.profile_photo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from("avatars")
            .remove([`profiles/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await sb
        .from("project_members")
        .update({ profile_photo_url: data.publicUrl })
        .eq("id", memberId);

      if (updateError) throw updateError;

      toast.success("Foto de perfil atualizada!");
      await loadMember();
      
      // Forçar recarga da página para atualizar o avatar no header
      window.location.reload();
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error(error.message || "Erro ao fazer upload da foto");
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      // Verificar senha atual
      const passwordMatch = await bcrypt.compare(currentPassword, member.password_hash);
      if (!passwordMatch) {
        toast.error("Senha atual incorreta");
        return;
      }

      // Hash da nova senha
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      const { error } = await sb
        .from("project_members")
        .update({ password_hash: newPasswordHash })
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Erro ao alterar senha");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("member_session");
    window.location.href = `/member/${projectId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Meu Perfil
          </CardTitle>
          <CardDescription>Gerencie suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Foto de Perfil */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-primary shadow-lg">
                <AvatarImage 
                  src={member?.profile_photo_url || undefined}
                  alt={member?.full_name}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl bg-primary text-primary-foreground font-bold">
                  {member?.full_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 p-3 bg-primary text-primary-foreground rounded-full cursor-pointer hover:scale-110 transition-smooth shadow-lg"
                title="Alterar foto do perfil"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">{member?.full_name}</p>
              <p className="text-sm text-muted-foreground">{member?.email}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Clique no ícone para alterar sua foto
              </p>
            </div>
          </div>

          {/* Informações */}
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label>Nome Completo</Label>
              <Input value={member?.full_name} disabled className="bg-muted/50" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={member?.email} disabled className="bg-muted/50" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Atualize sua senha de acesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current-password">Senha Atual</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button onClick={handlePasswordChange} className="w-full">
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      {/* Sair */}
      <Button 
        onClick={handleLogout} 
        variant="destructive" 
        className="w-full"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair da Conta
      </Button>
    </div>
  );
};

export default MemberProfile;
