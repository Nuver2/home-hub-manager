import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useComments, useCreateComment, useDeleteComment } from '@/hooks/useComments';
import { FileUpload } from '@/components/FileUpload';
import { formatRelativeTime } from '@/lib/date-utils';
import { toast } from 'sonner';
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface CommentsProps {
  taskId?: string;
  shoppingListId?: string;
}

export function Comments({ taskId, shoppingListId }: CommentsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useComments(taskId, shoppingListId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const [newComment, setNewComment] = useState('');
  const [commentAttachments, setCommentAttachments] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() && commentAttachments.length === 0) {
      toast.error(t('comments.commentRequired'));
      return;
    }

    try {
      await createComment.mutateAsync({
        content: newComment.trim() || '📎',
        task_id: taskId,
        shopping_list_id: shoppingListId,
        attachments: commentAttachments.length > 0 ? commentAttachments : undefined,
      });
      setNewComment('');
      setCommentAttachments([]);
      toast.success(t('success.commentAdded'));
    } catch (error: any) {
      toast.error(error.message || t('errors.failedAddComment'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('comments.deleteConfirm'))) return;
    
    try {
      await deleteComment.mutateAsync(id);
      toast.success(t('success.commentDeleted'));
    } catch (error: any) {
      toast.error(error.message || t('errors.failedDeleteComment'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {t('comments.title')} ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => {
              const isOwner = comment.user_id === user?.id;
              const canDelete = isOwner || user?.role === 'parent';

              return (
                <div
                  key={comment.id}
                  className={cn(
                    "flex gap-3 p-3 rounded-lg border bg-card",
                    isOwner && "bg-accent/5 border-accent/20"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {comment.userProfile?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">
                        {comment.userProfile?.name || t('comments.unknownUser')}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {comment.attachments.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:underline"
                          >
                            {t('attachments.attachment')} {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleteComment.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('comments.beFirst')}</p>
            </div>
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder={t('comments.writeComment')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={createComment.isPending}
          />
          <FileUpload
            bucket="attachments"
            folder="comments"
            existingFiles={commentAttachments}
            onUploadComplete={(url) => setCommentAttachments(prev => [...prev, url])}
            onRemove={(url) => setCommentAttachments(prev => prev.filter(a => a !== url))}
            maxFiles={3}
            maxSizeMB={10}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={(!newComment.trim() && commentAttachments.length === 0) || createComment.isPending}
            >
              {createComment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('comments.posting')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('comments.postComment')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

