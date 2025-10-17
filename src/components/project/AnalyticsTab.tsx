import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, TrendingUp, MessageSquare, ThumbsUp } from "lucide-react";

interface AnalyticsTabProps {
  projectId: string;
}

interface Analytics {
  totalMembers: number;
  activeMembers: number;
  totalModules: number;
  totalLessons: number;
  completionRate: number;
  totalPosts: number;
  totalComments: number;
}

const AnalyticsTab = ({ projectId }: AnalyticsTabProps) => {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalMembers: 0,
    activeMembers: 0,
    totalModules: 0,
    totalLessons: 0,
    completionRate: 0,
    totalPosts: 0,
    totalComments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [projectId]);

  const loadAnalytics = async () => {
    try {
      // Total de membros
      const { count: totalMembers } = await sb
        .from("project_members")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      // Membros ativos
      const { count: activeMembers } = await sb
        .from("project_members")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("is_active", true);

      // Total de módulos
      const { count: totalModules } = await sb
        .from("modules")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      // Total de aulas
      const { data: modules } = await sb
        .from("modules")
        .select("id")
        .eq("project_id", projectId);

      let totalLessons = 0;
      if (modules && modules.length > 0) {
        const { count: lessonsCount } = await sb
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .in(
            "module_id",
            modules.map((m) => m.id)
          );
        totalLessons = lessonsCount || 0;
      }

      // Taxa de conclusão
      let completionRate = 0;
      if (totalMembers && totalLessons) {
        const { count: completedLessons } = await sb
          .from("lesson_progress")
          .select("*", { count: "exact", head: true })
          .eq("completed", true);

        const totalPossibleCompletions = (totalMembers || 0) * totalLessons;
        if (totalPossibleCompletions > 0) {
          completionRate = Math.round(
            ((completedLessons || 0) / totalPossibleCompletions) * 100
          );
        }
      }

      // Posts da comunidade
      let totalPosts = 0;
      if (modules && modules.length > 0) {
        const { count: postsCount } = await sb
          .from("community_posts")
          .select("*", { count: "exact", head: true })
          .in(
            "module_id",
            modules.map((m) => m.id)
          );
        totalPosts = postsCount || 0;
      }

      // Comentários
      const { data: posts } = await sb
        .from("community_posts")
        .select("id")
        .in(
          "module_id",
          modules?.map((m) => m.id) || []
        );

      let totalComments = 0;
      if (posts && posts.length > 0) {
        const { count: commentsCount } = await sb
          .from("community_comments")
          .select("*", { count: "exact", head: true })
          .in(
            "post_id",
            posts.map((p) => p.id)
          );
        totalComments = commentsCount || 0;
      }

      setAnalytics({
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        totalModules: totalModules || 0,
        totalLessons,
        completionRate,
        totalPosts,
        totalComments,
      });
    } catch (error: any) {
      console.error("Erro ao carregar analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total de Membros",
      value: analytics.totalMembers,
      icon: Users,
      description: `${analytics.activeMembers} ativos`,
      color: "text-blue-500",
    },
    {
      title: "Módulos",
      value: analytics.totalModules,
      icon: BookOpen,
      description: "Módulos criados",
      color: "text-purple-500",
    },
    {
      title: "Aulas",
      value: analytics.totalLessons,
      icon: GraduationCap,
      description: "Total de aulas",
      color: "text-green-500",
    },
    {
      title: "Taxa de Conclusão",
      value: `${analytics.completionRate}%`,
      icon: TrendingUp,
      description: "Média de progresso",
      color: "text-orange-500",
    },
    {
      title: "Posts na Comunidade",
      value: analytics.totalPosts,
      icon: MessageSquare,
      description: "Discussões criadas",
      color: "text-pink-500",
    },
    {
      title: "Comentários",
      value: analytics.totalComments,
      icon: ThumbsUp,
      description: "Interações totais",
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Analytics</h2>
        <p className="text-muted-foreground">
          Métricas e dados em tempo real da sua área de membros
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-card border-border/50 hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">
                  {stat.title}
                </CardDescription>
                <div className={`rounded-lg bg-muted/50 p-2 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle>Resumo do Projeto</CardTitle>
          <CardDescription>Visão geral do desempenho</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Engajamento de Membros</span>
              <span className="text-lg font-bold">
                {analytics.totalMembers > 0
                  ? Math.round((analytics.activeMembers / analytics.totalMembers) * 100)
                  : 0}
                %
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Conteúdo Disponível</span>
              <span className="text-lg font-bold">
                {analytics.totalModules} módulos, {analytics.totalLessons} aulas
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Atividade na Comunidade</span>
              <span className="text-lg font-bold">
                {analytics.totalPosts + analytics.totalComments} interações
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
