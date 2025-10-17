import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, BookOpen, Video, FileText, Image as ImageIcon, CheckCircle, User, ArrowRight } from "lucide-react";
import MemberProfile from "@/components/member/MemberProfile";
import LessonComments from "@/components/member/LessonComments";
import { useProjectBranding } from "@/hooks/useProjectBranding";

interface Module {
  id: string;
  title: string;
  description: string;
  banner_url: string | null;
  display_order: number;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content: string | null;
  content_type: string;
  file_url: string | null;
  duration_minutes: number | null;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
}

const MemberArea = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<{ [key: string]: Lesson[] }>({});
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState("modules");

  const { branding, loading: loadingBranding, saveBranding } = useProjectBranding(projectId!);

  useEffect(() => {
    checkMemberSession();
  }, [projectId]);

  useEffect(() => {
    if (member) {
      loadData();
    }
  }, [member]);

  // const toggleDarkMode = async () => { // Removed
  //   if (!branding) return;
  //   await saveBranding({ dark_mode: !branding.dark_mode });
  // };

  const checkMemberSession = async () => {
    const session = sessionStorage.getItem("member_session");
    if (!session) {
      navigate(`/member/${projectId}`);
      return;
    }

    const memberData = JSON.parse(session);
    if (memberData.project_id !== projectId) {
      navigate(`/member/${projectId}`);
      return;
    }

    try {
      const { data: updatedMember } = await sb
        .from("project_members")
        .select("*")
        .eq("id", memberData.id)
        .maybeSingle();

      if (updatedMember) {
        const updatedSession = {
          ...memberData,
          profile_photo_url: updatedMember.profile_photo_url,
          full_name: updatedMember.full_name,
          email: updatedMember.email
        };
        sessionStorage.setItem("member_session", JSON.stringify(updatedSession));
        setMember(updatedSession);
      } else {
        setMember(memberData);
      }
    } catch (error) {
      console.error("Error reloading member data:", error);
      setMember(memberData);
    }
  };

  const loadData = async () => {
    try {
      setLoadingContent(true);

      const { data: projectData, error: projectError } = await sb
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) {
        console.error("Error loading project:", projectError);
        toast.error("Projeto não encontrado");
        return;
      }

      setProject(projectData);

      await sb
        .from("project_members")
        .update({ last_login: new Date().toISOString() })
        .eq("id", member.id);

      const { data: accessData } = await sb
        .from("member_module_access")
        .select("module_id")
        .eq("member_id", member.id);

      const moduleIds = accessData?.map(a => a.module_id) || [];

      if (moduleIds.length > 0) {
        const { data: modulesData, error: modulesError } = await sb
          .from("modules")
          .select("*")
          .in("id", moduleIds)
          .eq("is_published", true)
          .order("display_order", { ascending: true });

        if (modulesError) {
          console.error("Error loading modules:", modulesError);
        } else {
          setModules(modulesData || []);

          for (const module of modulesData || []) {
            const { data: lessonsData, error: lessonsError } = await sb
              .from("lessons")
              .select("*")
              .eq("module_id", module.id)
              .eq("is_published", true)
              .order("display_order", { ascending: true });

            if (lessonsError) {
              console.error(`Error loading lessons for module ${module.id}:`, lessonsError);
            } else {
              setLessons(prev => ({
                ...prev,
                [module.id]: lessonsData || []
              }));
            }
          }
        }
      } else {
        console.log("No module access found for member");
      }

      const { data: progressData } = await sb
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("member_id", member.id);

      setProgress(progressData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar conteúdo");
    } finally {
      setLoadingContent(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("member_session");
    navigate(`/member/${projectId}`);
    toast.success("Logout realizado com sucesso");
  };

  const toggleLessonCompletion = async (lessonId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await sb
          .from("lesson_progress")
          .delete()
          .eq("member_id", member.id)
          .eq("lesson_id", lessonId);
      } else {
        await sb
          .from("lesson_progress")
          .upsert({
            member_id: member.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
          });
      }

      setProgress(prev => {
        const filtered = prev.filter(p => p.lesson_id !== lessonId);
        if (!currentStatus) {
          return [...filtered, { lesson_id: lessonId, completed: true }];
        }
        return filtered;
      });

      toast.success(currentStatus ? "Marcado como não concluído" : "Marcado como concluído");
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Erro ao atualizar progresso");
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some(p => p.lesson_id === lessonId && p.completed);
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

  const renderFilePreview = (lesson: Lesson) => {
    if (!lesson.file_url) return null;

    switch (lesson.content_type) {
      case "video":
        return (
          <video
            controls
            className="w-full rounded-lg shadow-lg"
            src={lesson.file_url}
          >
            Seu navegador não suporta o elemento de vídeo.
          </video>
        );
      case "pdf":
        return (
          <iframe
            src={lesson.file_url}
            className="w-full h-[600px] rounded-lg shadow-lg"
            title={lesson.title}
          />
        );
      case "image":
        return (
          <img
            src={lesson.file_url}
            alt={lesson.title}
            className="w-full rounded-lg shadow-lg object-contain max-h-[600px]"
          />
        );
      default:
        return (
          <a
            href={lesson.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            style={{ color: 'var(--member-primary-color)' }}
          >
            Baixar arquivo
          </a>
        );
    }
  };

  const logoUrl = branding?.custom_logo_url || project?.logo_url;

  if (loadingContent || loadingBranding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--member-background-color)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--member-primary-color)]"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen`}>
      <div className="min-h-screen transition-colors bg-[var(--member-background-color)] text-[var(--member-text-color)]">
        {/* Header */}
        <header 
          className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-[var(--member-header-background-color)] text-[var(--member-header-text-color)]"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt={project?.name || "Logo"}
                    className="h-10 w-10 object-contain"
                  />
                )}
                <h1 className="text-xl font-bold hidden md:block text-[var(--member-header-text-color)]">{project?.name || "Área de Membros"}</h1>
              </div>

              <div className="flex items-center gap-4">
                {/* Removed Dark Mode Toggle */}
                <button
                  onClick={() => setActiveTab("profile")}
                  className="flex items-center gap-2 hover:opacity-80 transition-smooth"
                >
                  <Avatar className="h-9 w-9 border-2 border-[var(--member-primary-color)]">
                    <AvatarImage 
                      src={member?.profile_photo_url} 
                      alt={member?.full_name}
                    />
                    <AvatarFallback className="font-semibold bg-[var(--member-primary-color)] text-[var(--member-text-color)]">
                      {member?.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 text-[var(--member-text-color)]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 bg-[var(--member-container-color)] text-[var(--member-text-color)]">
              <TabsTrigger value="modules" className="gap-2 text-[var(--member-text-color)]">
                <BookOpen className="h-4 w-4" />
                Meus Módulos
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2 text-[var(--member-text-color)]">
                <User className="h-4 w-4" />
                Meu Perfil
              </TabsTrigger>
            </TabsList>

            <TabsContent value="modules">
              {/* Welcome Section */}
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-[var(--member-text-color)]">
                  Olá, {member?.full_name?.split(' ')[0]}!
                </h2>
                <p className="text-[var(--member-muted-text-color)]">
                  Bem-vindo(a) à sua área de membros
                </p>
              </div>

              {/* Modules Grid */}
              {modules.length === 0 ? (
                <Card className="shadow-sm bg-[var(--member-container-color)]">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <BookOpen className="h-16 w-16 mb-4 text-[var(--member-muted-text-color)]" />
                    <p className="text-center text-[var(--member-muted-text-color)]">
                      Nenhum módulo disponível ainda
                    </p>
                  </CardContent>
                </Card>
              ) : selectedLesson ? (
                // Lesson View
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedLesson(null)}
                    className="mb-4 text-[var(--member-text-color)]"
                  >
                    ← Voltar para módulos
                  </Button>
                  <Card className="shadow-sm bg-[var(--member-container-color)]">
                    {modules.find(m => m.id === selectedLesson.module_id)?.banner_url && (
                      <div className="aspect-[3/1] overflow-hidden rounded-t-lg">
                        <img
                          src={modules.find(m => m.id === selectedLesson.module_id)?.banner_url!}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-2xl md:text-3xl mb-2 text-[var(--member-card-text-color)]">{selectedLesson.title}</CardTitle>
                          <CardDescription className="text-base text-[var(--member-muted-text-color)]">{selectedLesson.description}</CardDescription>
                        </div>
                        <Button
                          size="lg"
                          onClick={() =>
                            toggleLessonCompletion(
                              selectedLesson.id,
                              isLessonCompleted(selectedLesson.id)
                            )
                          }
                          className="w-full md:w-auto"
                          style={{ 
                            backgroundColor: isLessonCompleted(selectedLesson.id) ? 'var(--member-primary-color)' : 'var(--member-button-color)', 
                            color: 'white',
                            opacity: isLessonCompleted(selectedLesson.id) ? 1 : 0.8
                          }}
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          {isLessonCompleted(selectedLesson.id) ? "Concluído" : "Marcar como concluído"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {renderFilePreview(selectedLesson)}
                      
                      {selectedLesson.content && (
                        <div className="mt-6 p-6 rounded-lg bg-[var(--member-background-color)]">
                          <h3 className="font-semibold mb-3 text-lg text-[var(--member-card-text-color)]">Conteúdo Adicional</h3>
                          <div
                            className="prose prose-sm max-w-none dark:prose-invert text-[var(--member-text-color)]"
                            dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                          />
                        </div>
                      )}

                      {/* Comentários */}
                      <LessonComments
                        lessonId={selectedLesson.id}
                        memberId={member.id}
                        moduleId={selectedLesson.module_id}
                      />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                // Modules Grid - Novo Layout
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modules.map((module) => {
                    const moduleLessons = lessons[module.id] || [];
                    const completedCount = moduleLessons.filter(l => isLessonCompleted(l.id)).length;
                    
                    return (
                      <Card
                        key={module.id}
                        className="overflow-hidden hover:shadow-xl transition-all border-border/50 group flex flex-col bg-[var(--member-container-color)]"
                      >
                        {/* Banner */}
                        {module.banner_url && (
                          <div className="aspect-video w-full overflow-hidden bg-muted">
                            <img
                              src={module.banner_url}
                              alt={module.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xl line-clamp-2 text-[var(--member-card-text-color)]">
                            {module.title}
                          </CardTitle>
                          {module.description && (
                            <CardDescription className="mt-2 line-clamp-3 text-[var(--member-muted-text-color)]">
                              {module.description}
                            </CardDescription>
                          )}
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                          {/* Stats */}
                          {moduleLessons.length > 0 && (
                            <div className="flex items-center gap-4 text-sm text-[var(--member-muted-text-color)]">
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" />
                                <span>{moduleLessons.length} aula{moduleLessons.length !== 1 ? 's' : ''}</span>
                              </div>
                              {completedCount > 0 && (
                                <div className="flex items-center gap-1 text-[var(--member-primary-color)]">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>{completedCount} concluída{completedCount !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Button */}
                          <Button
                            className="w-full gap-2 group-hover:gap-3 transition-all bg-[var(--member-button-color)] text-white"
                            size="lg"
                            onClick={() => {
                              const firstLesson = moduleLessons[0];
                              if (firstLesson) setSelectedLesson(firstLesson);
                            }}
                            disabled={moduleLessons.length === 0}
                          >
                            Acessar Módulo
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile">
              <MemberProfile memberId={member?.id} projectId={projectId!} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MemberArea;