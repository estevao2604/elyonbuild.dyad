import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Video, FileText, Image as ImageIcon, Upload, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  title: string;
  description: string;
  banner_url: string | null;
  display_order: number;
  is_published: boolean;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content: string;
  content_type: string;
  file_url: string | null;
  duration_minutes: number | null;
  display_order: number;
  is_published: boolean;
}

interface ContentTabProps {
  projectId: string;
}

const ContentTab = ({ projectId }: ContentTabProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    is_published: false,
  });

  const [moduleBannerFile, setModuleBannerFile] = useState<File | null>(null);

  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    content: "",
    content_type: "video",
    duration_minutes: 0,
    is_published: false,
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    loadModules();
  }, [projectId]);

  const loadModules = async () => {
    try {
      const { data, error } = await sb
        .from("modules")
        .select("*")
        .eq("project_id", projectId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar módulos");
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (moduleId: string) => {
    try {
      const { data, error } = await sb
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar aulas");
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let bannerUrl = editingModule?.banner_url || null;
      
      // Upload banner if file selected
      if (moduleBannerFile) {
        bannerUrl = await handleFileUpload(moduleBannerFile);
        if (!bannerUrl) return;
      }

      if (editingModule) {
        const { error } = await sb
          .from("modules")
          .update({
            title: newModule.title,
            description: newModule.description,
            is_published: newModule.is_published,
            banner_url: bannerUrl,
          })
          .eq("id", editingModule.id);

        if (error) throw error;
        toast.success("Módulo atualizado com sucesso!");
      } else {
      const { data: newModuleData, error } = await sb.from("modules").insert([
          {
            project_id: projectId,
            title: newModule.title,
            description: newModule.description,
            is_published: newModule.is_published,
            display_order: modules.length,
            banner_url: bannerUrl,
          },
        ]).select().single();

        if (error) throw error;
        
        // Dar acesso automático a todos os membros ativos do projeto
        if (newModuleData) {
          const { data: members } = await sb
            .from("project_members")
            .select("id")
            .eq("project_id", projectId)
            .eq("is_active", true);

          if (members && members.length > 0) {
            const accessRecords = members.map(member => ({
              member_id: member.id,
              module_id: newModuleData.id
            }));

            await sb
              .from("member_module_access")
              .insert(accessRecords);
          }
        }
        
        toast.success("Módulo criado e acesso concedido a todos os membros!");
      }

      setModuleDialogOpen(false);
      setEditingModule(null);
      setNewModule({ title: "", description: "", is_published: false });
      setModuleBannerFile(null);
      loadModules();
    } catch (error: any) {
      toast.error(editingModule ? "Erro ao atualizar módulo" : "Erro ao criar módulo");
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${projectId}-${Date.now()}.${fileExt}`;
      const filePath = `content/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("project-files") // Changed from "project-files" to "project-files"
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("project-files")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload do arquivo: " + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedModule) return;

    try {
      let fileUrl = editingLesson?.file_url || null;
      if (uploadedFile) {
        fileUrl = await handleFileUpload(uploadedFile);
        if (!fileUrl) return;
      }

      if (editingLesson) {
        const { error } = await sb
          .from("lessons")
          .update({
            title: newLesson.title,
            description: newLesson.description,
            content: newLesson.content,
            content_type: newLesson.content_type,
            file_url: fileUrl,
            duration_minutes: newLesson.duration_minutes || null,
            is_published: newLesson.is_published,
          })
          .eq("id", editingLesson.id);

        if (error) throw error;
        toast.success("Aula atualizada com sucesso!");
      } else {
        const { error } = await sb.from("lessons").insert([
          {
            module_id: selectedModule.id,
            title: newLesson.title,
            description: newLesson.description,
            content: newLesson.content,
            content_type: newLesson.content_type,
            file_url: fileUrl,
            duration_minutes: newLesson.duration_minutes || null,
            is_published: newLesson.is_published,
            display_order: lessons.length,
          },
        ]);

        if (error) throw error;
        toast.success("Aula criada com sucesso!");
      }

      setLessonDialogOpen(false);
      setEditingLesson(null);
      setNewLesson({
        title: "",
        description: "",
        content: "",
        content_type: "video",
        duration_minutes: 0,
        is_published: false,
      });
      setUploadedFile(null);
      loadLessons(selectedModule.id);
    } catch (error: any) {
      toast.error(editingLesson ? "Erro ao atualizar aula" : "Erro ao criar aula");
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Tem certeza que deseja excluir este módulo e todas as suas aulas?")) return;

    try {
      const { error } = await sb.from("modules").delete().eq("id", moduleId);

      if (error) throw error;

      toast.success("Módulo excluído com sucesso!");
      loadModules();
      if (selectedModule?.id === moduleId) {
        setSelectedModule(null);
        setLessons([]);
      }
    } catch (error: any) {
      toast.error("Erro ao excluir módulo");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta aula?")) return;

    try {
      const { error } = await sb.from("lessons").delete().eq("id", lessonId);

      if (error) throw error;

      toast.success("Aula excluída com sucesso!");
      if (selectedModule) {
        loadLessons(selectedModule.id);
      }
    } catch (error: any) {
      toast.error("Erro ao excluir aula");
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "pdf":
        return <FileText className="h-5 w-5" />;
      case "image":
        return <ImageIcon className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
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
          <h2 className="text-xl sm:text-2xl font-bold">Módulos e Aulas</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie o conteúdo da sua área de membros
          </p>
          <p className="text-xs text-primary mt-1">
            💡 Novos módulos são automaticamente liberados para todos os membros ativos
          </p>
        </div>

        <Dialog open={moduleDialogOpen} onOpenChange={(open) => {
          setModuleDialogOpen(open);
          if (!open) {
            setEditingModule(null);
            setNewModule({ title: "", description: "", is_published: false });
            setModuleBannerFile(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 transition-smooth w-full sm:w-auto flex-shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              <span className="whitespace-nowrap">Novo Módulo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
            <DialogHeader>
              <DialogTitle>{editingModule ? "Editar Módulo" : "Criar Novo Módulo"}</DialogTitle>
              <DialogDescription>
                {editingModule ? "Atualize as informações do módulo" : "Adicione um novo módulo de conteúdo"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Módulo</Label>
                <Input
                  id="title"
                  value={newModule.title}
                  onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                  required
                  placeholder="Ex: Módulo 1 - Introdução"
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  placeholder="Descreva o que será aprendido neste módulo"
                  className="bg-muted/50 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="module-banner">Banner do Módulo (Recomendado: 1200x400px)</Label>
                {editingModule?.banner_url && !moduleBannerFile && (
                  <div className="relative aspect-[3/1] rounded-lg overflow-hidden bg-muted/50 mb-2">
                    <img
                      src={editingModule.banner_url}
                      alt="Banner atual"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="module-banner"
                    type="file"
                    onChange={(e) => setModuleBannerFile(e.target.files?.[0] || null)}
                    accept="image/*"
                    className="bg-muted/50"
                  />
                  {uploading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>}
                </div>
                <p className="text-xs text-muted-foreground">
                  O banner será exibido no topo do módulo na área de membros
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={newModule.is_published}
                  onChange={(e) => setNewModule({ ...newModule, is_published: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="published">Publicar módulo</Label>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={uploading}>
                {uploading ? "Fazendo upload..." : editingModule ? "Atualizar Módulo" : "Criar Módulo"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {modules.length === 0 ? (
        <Card className="shadow-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum módulo criado ainda</p>
            <Button
              onClick={() => setModuleDialogOpen(true)}
              className="bg-gradient-primary hover:opacity-90"
            >
              Criar Primeiro Módulo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Módulos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base sm:text-lg">Módulos</h3>
            {modules.map((module) => (
              <Card
                key={module.id}
                className={`shadow-card border-border/50 cursor-pointer hover-lift overflow-hidden ${
                  selectedModule?.id === module.id ? "border-primary" : ""
                }`}
                onClick={() => {
                  setSelectedModule(module);
                  loadLessons(module.id);
                }}
              >
                {module.banner_url && (
                  <div className="aspect-[3/1] overflow-hidden">
                    <img
                      src={module.banner_url}
                      alt={module.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {module.description || "Sem descrição"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                          module.is_published
                            ? "bg-green-500/20 text-green-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {module.is_published ? "Publicado" : "Rascunho"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingModule(module);
                          setNewModule({
                            title: module.title,
                            description: module.description || "",
                            is_published: module.is_published,
                          });
                          setModuleDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModule(module.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Aulas */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-semibold text-base sm:text-lg min-w-0 truncate">
                Aulas {selectedModule ? `- ${selectedModule.title}` : ""}
              </h3>
              {selectedModule && (
                <Dialog open={lessonDialogOpen} onOpenChange={(open) => {
                  setLessonDialogOpen(open);
                  if (!open) {
                    setEditingLesson(null);
                    setNewLesson({
                      title: "",
                      description: "",
                      content: "",
                      content_type: "video",
                      duration_minutes: 0,
                      is_published: false,
                    });
                    setUploadedFile(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Aula
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingLesson ? "Editar Aula" : "Criar Nova Aula"}</DialogTitle>
                      <DialogDescription>
                        {editingLesson ? "Atualize as informações da aula" : "Adicione uma nova aula ao módulo"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateLesson} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="lesson-title">Título da Aula</Label>
                        <Input
                          id="lesson-title"
                          value={newLesson.title}
                          onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                          required
                          placeholder="Ex: Aula 1 - Conceitos Básicos"
                          className="bg-muted/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lesson-description">Descrição</Label>
                        <Textarea
                          id="lesson-description"
                          value={newLesson.description}
                          onChange={(e) =>
                            setNewLesson({ ...newLesson, description: e.target.value })
                          }
                          placeholder="Descreva o conteúdo da aula"
                          className="bg-muted/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lesson-content">Conteúdo (Texto/HTML)</Label>
                        <Textarea
                          id="lesson-content"
                          value={newLesson.content}
                          onChange={(e) =>
                            setNewLesson({ ...newLesson, content: e.target.value })
                          }
                          placeholder="Adicione texto, links ou conteúdo adicional da aula"
                          className="bg-muted/50 min-h-[150px] font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Você pode adicionar HTML básico aqui para formatar o conteúdo
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="content-type">Tipo de Conteúdo</Label>
                          <Select
                            value={newLesson.content_type}
                            onValueChange={(value) =>
                              setNewLesson({ ...newLesson, content_type: value })
                            }
                          >
                            <SelectTrigger className="bg-muted/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="video">Vídeo</SelectItem>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="image">Imagem</SelectItem>
                              <SelectItem value="text">Texto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="duration">Duração (minutos)</Label>
                          <Input
                            id="duration"
                            type="number"
                            value={newLesson.duration_minutes}
                            onChange={(e) =>
                              setNewLesson({ ...newLesson, duration_minutes: parseInt(e.target.value) })
                            }
                            min="0"
                            className="bg-muted/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="file">Upload de Arquivo</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="file"
                            type="file"
                            onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                            accept={
                              newLesson.content_type === "video"
                                ? "video/*"
                                : newLesson.content_type === "pdf"
                                ? "application/pdf"
                                : newLesson.content_type === "image"
                                ? "image/*"
                                : "*"
                            }
                            className="bg-muted/50"
                          />
                          {uploading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="lesson-published"
                          checked={newLesson.is_published}
                          onChange={(e) =>
                            setNewLesson({ ...newLesson, is_published: e.target.checked })
                          }
                          className="rounded"
                        />
                        <Label htmlFor="lesson-published">Publicar aula</Label>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-primary hover:opacity-90"
                        disabled={uploading}
                      >
                        {uploading ? "Fazendo upload..." : editingLesson ? "Atualizar Aula" : "Criar Aula"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {!selectedModule ? (
              <Card className="shadow-card border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Selecione um módulo para ver as aulas</p>
                </CardContent>
              </Card>
            ) : lessons.length === 0 ? (
              <Card className="shadow-card border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhuma aula criada ainda</p>
                  <Button
                    onClick={() => setLessonDialogOpen(true)}
                    size="sm"
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Criar Primeira Aula
                  </Button>
                </CardContent>
              </Card>
            ) : (
              lessons.map((lesson) => (
                <Card key={lesson.id} className="shadow-card border-border/50 hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="rounded-lg bg-primary/10 p-2 mt-1">
                          {getContentIcon(lesson.content_type)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{lesson.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {lesson.description || "Sem descrição"}
                          </CardDescription>
                          {lesson.duration_minutes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Duração: {lesson.duration_minutes} min
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            lesson.is_published
                              ? "bg-green-500/20 text-green-500"
                              : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {lesson.is_published ? "Publicado" : "Rascunho"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLesson(lesson);
                            setNewLesson({
                              title: lesson.title,
                              description: lesson.description || "",
                              content: (lesson as any).content || "",
                              content_type: lesson.content_type,
                              duration_minutes: lesson.duration_minutes || 0,
                              is_published: lesson.is_published,
                            });
                            setLessonDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLesson(lesson.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTab;