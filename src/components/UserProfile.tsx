import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User, Lock, Settings } from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfileProps {
  user: SupabaseUser;
}

const UserProfile = ({ user }: UserProfileProps) => {
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setFullName(data.full_name || "");
        setAvatarUrl(data.avatar_url || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await sb
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Foto atualizada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao fazer upload da foto");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleNameUpdate = async () => {
    try {
      const { error } = await sb
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Nome atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar nome");
      console.error(error);
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Senha redefinida com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("Erro ao redefinir senha");
      console.error(error);
    }
  };

  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setProfileDialogOpen(true)}
        className="relative"
      >
        <Avatar className="h-9 w-9 border-2 border-border">
          <AvatarImage src={avatarUrl} alt={fullName || user.email || ""} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </Button>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="bg-card border-border/50 max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Meu Perfil</DialogTitle>
            <DialogDescription>
              Gerencie suas informações pessoais e configurações de conta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-border">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-border">
                  <AvatarImage src={avatarUrl} alt={fullName || user.email || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="avatar-upload-profile" 
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                  ) : (
                    <Camera className="h-8 w-8 text-white" />
                  )}
                </label>
                <input
                  id="avatar-upload-profile"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Clique na foto para alterar
              </p>
            </div>

            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nome Completo</Label>
                <Input
                  id="profile-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={handleNameUpdate}
                  placeholder="Seu nome completo"
                  className="h-11 bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  value={user.email || ""}
                  disabled
                  className="h-11 bg-muted/50 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Segurança
              </h3>

              <div className="space-y-2">
                <Label htmlFor="new-password-profile">Nova Senha</Label>
                <Input
                  id="new-password-profile"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="h-11 bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password-profile">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password-profile"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="h-11 bg-background/50"
                />
              </div>

              <Button
                onClick={handlePasswordReset}
                disabled={!newPassword || !confirmPassword}
                className="w-full h-11 bg-gradient-primary hover:opacity-90 transition-smooth"
              >
                Redefinir Senha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserProfile;
