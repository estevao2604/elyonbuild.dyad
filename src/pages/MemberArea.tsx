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
import { LogOut, BookOpen, Video, FileText, Image as ImageIcon, CheckCircle, User, Moon, Sun, ArrowRight } from "lucide-react";
import MemberProfile from "@/components/member/MemberProfile";
import LessonComments from "@/components/member/LessonComments";

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
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("modules");
  const [branding, setBranding] = useState<any>(null);

  useEffect(() => {
    checkMemberSession();
  }, [projectId]);

  useEffect(() => {
    if (member) {
      loadData();
    }
  }, [member]);

  const applyBrandingStyles = (brandingData: any) => {
    const root = document.documentElement;
    if (brandingData) {
      root.style.setProperty('--member-background-color', brandingData.background_color || "#0F172A");
      root.style.setProperty('--member-container-color', brandingData.container_color || "#1E293B");
      root.style.setProperty('--member-text-color', brandingData.text_color || "#F1F5F9");
      root.style.setProperty('--member-primary-color', brandingData.primary_color || "#6366F1");
      root.style.setProperty('--member-secondary-color', brandingData.secondary_color || "#22D3EE");
      root.style.setProperty('--member-accent-color', brandingData.accent_color || "#F59E0B");
      root.style.setProperty('--member-button-color', brandingData.button_color || "#6366F1");
      root.style.setProperty('--member-header-background-color', brandingData.header_background_color || "#1E293B");
      root.style.setProperty('--member-header-text-color', brandingData.header_text_color || "#F1F5F9");
      root.style.setProperty('--member-card-text-color', brandingData.card_text_color || "#F1F5F9");
      root.style.setProperty('--member-muted-text-color', brandingData.muted_text_color || "#A0A0A0");

      if (brandingData.dark_mode) {
        setDarkMode(true);
        root.classList.add("dark");
      } else {
        setDarkMode(false);
        root.classList.remove("dark");
      }
    } else {
      // Reset to default if no branding data
      root.style.removeProperty('--member-background-color');
      root.style.removeProperty('--member-container-color');
      root.style.removeProperty('--member-text-color');
      root.style.removeProperty('--member-primary-color');
      root.style.removeProperty('--member-secondary-color');
      root.style.removeProperty('--member-accent-color');
      root.style.removeProperty('--member-button-color');
      root.style.removeProperty('--member-header-background-color');
      root.style.removeProperty('--member-header-text-color');
      root.style.removeProperty('--member-card-text-color');
      root.style.removeProperty('--member-muted-text-color');
      root.classList.remove("dark");
      setDarkMode(false);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    const root = document.documentElement;
    if (newMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    try {
      await sb
        .from("project_branding")
        .update({ dark_mode: newMode })
        .eq("project_id", projectId);
    } catch (error) {
      console.error("Error saving dark mode:", error);
    }
  };

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
      setLoading(true);

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

      const { data: brandingData, error: brandingError } = await sb
        .from("project_branding")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (brandingError) {
        console.error("Error loading branding:", brandingError);
      } else {
        setBranding(brandingData);
        applyBrandingStyles(brandingData); // Apply branding styles here
      }

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
      setLoading(false);
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
          >
            Baixar arquivo
          </a>
        );
    }
  };

  const logoUrl = branding?.custom_logo_url || project?.logo_url;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--member-background-color, #0F172A)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--member-background-color, #0F172A)' }}>
        {/* Header */}
        <header 
          className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
          style={{ 
            backgroundColor: 'var(--member-header-background-color, #1E293B)',
            color: 'var(--member-header-text-color, #F1F5F9)'
          }}
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
                <h1 className="text-xl font-bold hidden md:block" style={{ color: 'var(--member-header-text-color, #F1F5F9)' }}>{project?.name || "Área de Membros"}</h1>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  className="rounded-full"
                  style={{ color: 'var(--member-header-text-color, #F1F5F9)' }}
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>

                <button
                  onClick={() => setActiveTab("profile")}
                  className="flex items-center gap-2 hover:opacity-80 transition-smooth"
                >
                  <Avatar className="h-9 w-9 border-2" style={{ borderColor: 'var(--member-primary-color, #6366F1)' }}>
                    <AvatarImage 
                      src={member?.profile_photo_url} 
                      alt={member?.full_name}
                    />
                    <AvatarFallback style={{ backgroundColor: 'var(--member-primary-color, #6366F1)', color: 'var(--member-text-color, #F1F5F9)' }} className="font-semibold">
                      {member?.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8" style={{ color: 'var(--member-text-color, #F1F5F9)' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8" style={{ backgroundColor: 'var(--member-container-color, #1E293B)' }}>
              <TabsTrigger value="modules" className="gap-2" style={{ color: 'var(--member-text-color, #F1F5F9)' }}>
                <BookOpen className="h-4 w-4" />
                Meus Módulos
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2" style={{ color: 'var(--member-text-color, #F1F5F9)' }}>
                <User className="h-4 w-4" />
                Meu Perfil
              </TabsTrigger>
            </TabsList>

            <TabsContent value="modules">
              {/* Welcome Section */}
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--member-text-color, #F1F5F9)' }}>
                  Olá, {member?.full_name?.split(' ')[0]}!
                </h2>
                <p style={{ color: 'var(--member-muted-text-color, #A0A0A0)' }}>
                  Bem-vindo(a) à sua área de membros
                </p>
              </div>

              {/* Modules Grid */}
              {modules.length === 0 ? (
                <Card className="shadow-sm" style={{ backgroundColor: 'var(--member-container-color, #1E293B)' }}>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <BookOpen className="h-16 w-16 mb-4" style={{ color: 'var(--member-muted-text-color, #A0A0A0)' }} />
                    <p className="text-center" style={{ color: 'var(--member-muted-text-color, #A0A0A0)' }}>
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
                    className="mb-4"
                    style={{ color: 'var(--member-text-color, #F1F5F9)' }}
                  >
                    ← Voltar para módulos
                  </Button>
                  <Card className="shadow-sm" style={{ backgroundColor: 'var(--member-container-color, #1E293B)' }}>
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
                          <CardTitle className="text-2xl md:text-3xl mb-2" style={{ color: 'var(--member-card-text-color, #F1F5F9)' }}>{selectedLesson.title}</CardTitle>
                          <CardDescription className="text-base" style={{ color: 'var(--member-muted-text-color, #A0A0A0)' }}>{selectedLesson.description}</CardDescription>
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
                            backgroundColor: isLessonCompleted(selectedLesson.id) ? 'var(--member-primary-color, #6366F1)' : 'var(--member-button-color, #6366F1)', 
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
                        <div className="mt-6 p-6 rounded-lg" style={{ backgroundColor: 'var(--member-background-color, #0F172A)' }}>
                          <h3 className="font-semibold mb-3 text-lg" style={{ color: 'var(--member-card-text-color, #F1F5F9)' }}>Conteúdo Adicional</h3>
                          <div
                            className="prose prose-sm max-w-none dark:prose-invert"
                            style={{ color: 'var(--member-text-color, #F1F5F9)' }}
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
                        className="overflow-hidden hover:shadow-xl transition-all border-border/50 group flex flex-col"
                        style={{ backgroundColor: 'var(--member-container-color, #1E293B)' }}
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
                          <CardTitle className="text-xl line-clamp-2" style={{ color: 'var(--member-card-text-color, #F1F5F9)' }}>
                            {module.title}
                          </CardTitle>
                          {module.description && (
                            <CardDescription className="mt-2 line-clamp-3" style={{ color: 'var(--member-muted-text-color, #A0A0A0)' }}>
                              {module.description}
                            </CardDescription>
                          )}
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                          {/* Stats */}
                          {moduleLessons.length > 0 && (
                            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--member-muted-text-color, #A0A0A0)' }}>
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" />
                                <span>{moduleLessons.length} aula{moduleLessons.length !== 1 ? 's' : ''}</span>
                              </div>
                              {completedCount > 0 && (
                                <div className="flex items-center gap-1" style={{ color: 'var(--member-primary-color, #6366F1)' }}>
                                  <CheckCircle className="h-4 w-4" />
                                  <span>{completedCount} concluída{completedCount !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Button */}
                          <Button
                            className="w-full gap-2 group-hover:gap-3 transition-all"
                            size="lg"
                            style={{ backgroundColor: 'var(--member-button-color, #6366F1)', color: 'white' }}
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