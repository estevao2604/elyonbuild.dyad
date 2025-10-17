import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/integrations/supabase/sb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, User, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  reactions_count: number;
  author: {
    full_name: string;
    email: string;
  };
  module: {
    title: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: {
    full_name: string;
  };
}

interface CommunityTabProps {
  projectId: string;
}

const CommunityTab = ({ projectId }: CommunityTabProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [projectId]);

  const loadPosts = async () => {
    try {
      // Get modules from this project
      const { data: modules } = await sb
        .from("modules")
        .select("id")
        .eq("project_id", projectId);

      if (!modules || modules.length === 0) {
        setLoading(false);
        return;
      }

      const moduleIds = modules.map((m) => m.id);

      // Get posts
      const { data: postsData, error } = await sb
        .from("community_posts")
        .select(`
          *,
          author:project_members!community_posts_author_id_fkey(full_name, email),
          module:modules!community_posts_module_id_fkey(title)
        `)
        .in("module_id", moduleIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPosts(postsData || []);
    } catch (error: any) {
      toast.error("Erro ao carregar posts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data, error } = await sb
        .from("community_comments")
        .select(`
          *,
          author:project_members!community_comments_author_id_fkey(full_name)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setComments(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar comentários");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;

    try {
      const { error } = await sb
        .from("community_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast.success("Post excluído com sucesso!");
      loadPosts();
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
        setComments([]);
      }
    } catch (error: any) {
      toast.error("Erro ao excluir post");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este comentário?")) return;

    try {
      const { error } = await sb
        .from("community_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast.success("Comentário excluído com sucesso!");
      if (selectedPost) {
        loadComments(selectedPost.id);
      }
    } catch (error: any) {
      toast.error("Erro ao excluir comentário");
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
      <div>
        <h2 className="text-2xl font-bold mb-2">Comunidade</h2>
        <p className="text-muted-foreground">
          Moderação e gestão das discussões da comunidade
        </p>
      </div>

      {posts.length === 0 ? (
        <Card className="shadow-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Nenhum post na comunidade ainda</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              A comunidade será ativada quando você criar módulos e os membros começarem a interagir
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Posts */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Posts da Comunidade</h3>
            {posts.map((post) => (
              <Card
                key={post.id}
                className={`shadow-card border-border/50 cursor-pointer hover-lift ${
                  selectedPost?.id === post.id ? "border-primary" : ""
                }`}
                onClick={() => {
                  setSelectedPost(post);
                  loadComments(post.id);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {post.content}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.author.full_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.created_at).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.module.title}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(post.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Comentários */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              Comentários {selectedPost ? `- ${selectedPost.title}` : ""}
            </h3>

            {!selectedPost ? (
              <Card className="shadow-card border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Selecione um post para ver os comentários
                  </p>
                </CardContent>
              </Card>
            ) : comments.length === 0 ? (
              <Card className="shadow-card border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum comentário ainda</p>
                </CardContent>
              </Card>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="shadow-card border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm mb-2">{comment.content}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {comment.author.full_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(comment.created_at).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityTab;
