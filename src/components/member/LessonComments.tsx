import { useState, useEffect } from "react";
import { sb } from "@/integrations/supabase/sb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Trash2, User, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author?: {
    full_name: string;
    profile_photo_url: string | null;
  };
}

interface LessonCommentsProps {
  lessonId: string;
  memberId: string;
  moduleId: string;
}

const LessonComments = ({ lessonId, memberId, moduleId }: LessonCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [lessonId]);

  const loadComments = async () => {
    try {
      // Primeiro, criar um post para esta aula se não existir
      const { data: existingPost } = await sb
        .from("community_posts")
        .select("id")
        .eq("module_id", moduleId)
        .eq("title", `Lesson:${lessonId}`)
        .maybeSingle();

      let postId = existingPost?.id;

      if (!postId) {
        const { data: newPost } = await sb
          .from("community_posts")
          .insert({
            module_id: moduleId,
            title: `Lesson:${lessonId}`,
            content: "Comentários da aula",
            author_id: memberId,
          })
          .select()
          .single();
        
        postId = newPost?.id;
      }

      if (!postId) {
        setLoading(false);
        return;
      }

      // Carregar comentários
      const { data, error } = await sb
        .from("community_comments")
        .select(`
          *,
          author:project_members!community_comments_author_id_fkey(full_name, profile_photo_url)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setComments(data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error("Digite um comentário");
      return;
    }

    try {
      setSubmitting(true);

      // Buscar ou criar post para esta aula
      let { data: existingPost } = await sb
        .from("community_posts")
        .select("id")
        .eq("module_id", moduleId)
        .eq("title", `Lesson:${lessonId}`)
        .maybeSingle();

      let postId = existingPost?.id;

      if (!postId) {
        const { data: newPost } = await sb
          .from("community_posts")
          .insert({
            module_id: moduleId,
            title: `Lesson:${lessonId}`,
            content: "Comentários da aula",
            author_id: memberId,
          })
          .select()
          .single();
        
        postId = newPost?.id;
      }

      // Criar comentário
      const { error } = await sb
        .from("community_comments")
        .insert({
          post_id: postId,
          content: newComment,
          author_id: memberId,
        });

      if (error) throw error;

      toast.success("Comentário enviado!");
      setNewComment("");
      loadComments();
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Erro ao enviar comentário");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este comentário?")) return;

    try {
      const { error } = await sb
        .from("community_comments")
        .delete()
        .eq("id", commentId)
        .eq("author_id", memberId);

      if (error) throw error;

      toast.success("Comentário excluído");
      loadComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Erro ao excluir comentário");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentários ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Novo comentário */}
        <div className="space-y-3">
          <Textarea
            placeholder="Compartilhe suas dúvidas ou comentários sobre esta aula..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Enviar Comentário
            </Button>
          </div>
        </div>

        {/* Lista de comentários */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Seja o primeiro a comentar!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-4 bg-muted/30 rounded-lg"
              >
                <Avatar className="h-10 w-10 border-2 border-border">
                  <AvatarImage
                    src={comment.author?.profile_photo_url || ""}
                    alt={comment.author?.full_name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {comment.author?.full_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">
                        {comment.author?.full_name || "Usuário"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(comment.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {comment.author_id === memberId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LessonComments;
