import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Send, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface CommentUser {
    _id: string;
    name: string;
    avatar_url?: string;
}

interface TaskComment {
    _id: string;
    taskId: string;
    userId: CommentUser;
    text: string;
    createdAt: string;
    updatedAt: string;
}

interface TaskCommentsProps {
    taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
    const { user } = useAuth();
    const { toast } = useToast();

    const [comments, setComments] = useState<TaskComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/task-comments/${taskId}`);
            setComments(res.data.comments || []);
        } catch (error: any) {
            console.error('Error fetching task comments:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to load comments',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (taskId) {
            fetchComments();
        }
    }, [taskId]);

    const handleSubmit = async () => {
        const text = commentText.trim();
        if (!text) return;

        setIsSubmitting(true);
        try {
            const res = await api.post(`/task-comments/${taskId}`, { text });
            setComments((prev) => [...prev, res.data.comment]);
            setCommentText('');
            textareaRef.current?.focus();
        } catch (error: any) {
            console.error('Error posting comment:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to post comment',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        setDeletingId(commentId);
        try {
            await api.delete(`/task-comments/${commentId}`);
            setComments((prev) => prev.filter((c) => c._id !== commentId));
            toast({
                title: 'Comment deleted',
                description: 'Your comment has been removed.',
            });
        } catch (error: any) {
            console.error('Error deleting comment:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete comment',
                variant: 'destructive',
            });
        } finally {
            setDeletingId(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">
                    Comments ({comments.length})
                </h2>
            </div>

            <Separator />

            {/* Comment list */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm">No comments yet. Be the first to add one.</p>
                    </div>
                ) : (
                    comments.map((comment) => {
                        const isOwn = user?.id === comment.userId._id;
                        const isAdmin = user?.role === 'admin';

                        return (
                            <div key={comment._id} className="flex gap-3 group">
                                <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                                    <AvatarImage src={comment.userId.avatar_url} alt={comment.userId.name} />
                                    <AvatarFallback className="text-xs">
                                        {getInitials(comment.userId.name)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                        <span className="font-medium text-sm">
                                            {isOwn ? 'You' : comment.userId.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap break-words">
                                        {comment.text}
                                    </p>
                                </div>

                                {(isOwn || isAdmin) && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(comment._id)}
                                        disabled={deletingId === comment._id}
                                        aria-label="Delete comment"
                                    >
                                        {deletingId === comment._id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <Separator />

            {/* New comment input */}
            <div className="flex gap-3 items-start">
                <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarImage src={user?.avatar_url} alt={user?.name} />
                    <AvatarFallback className="text-xs">
                        {user?.name ? getInitials(user.name) : '?'}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                    <Textarea
                        ref={textareaRef}
                        placeholder="Write a comment… (Ctrl+Enter to submit)"
                        className="min-h-[80px] resize-none"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isSubmitting}
                    />
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={!commentText.trim() || isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-3.5 w-3.5" />
                            )}
                            {isSubmitting ? 'Posting…' : 'Comment'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
