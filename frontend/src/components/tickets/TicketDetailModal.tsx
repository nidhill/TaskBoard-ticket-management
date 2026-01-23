import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Loader2,
    Send,
    Paperclip,
    File,
    X,
    Image as ImageIcon,
    Clock,
    User
} from 'lucide-react';
import { format } from 'date-fns';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket, Comment, Attachment } from '@/types';
import { cn } from '@/lib/utils';

interface TicketDetailModalProps {
    ticket: Ticket;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void; // Trigger parent refresh
}

export function TicketDetailModal({ ticket, isOpen, onClose, onUpdate }: TicketDetailModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch comments when modal opens
    useEffect(() => {
        if (isOpen && ticket._id) {
            fetchComments();
        }
    }, [isOpen, ticket._id]);

    useEffect(() => {
        // Scroll to bottom when comments change
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const fetchComments = async () => {
        try {
            setLoadingComments(true);
            const res = await api.get(`/comments?ticketId=${ticket._id}`);
            setComments(res.data.comments);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // Limit checks could go here (e.g. max 5MB total)
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async (): Promise<Attachment[]> => {
        if (selectedFiles.length === 0) return [];

        const uploadedAttachments: Attachment[] = [];

        for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (res.data.success) {
                    uploadedAttachments.push(res.data.file);
                }
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                toast({
                    title: 'Upload Failed',
                    description: `Failed to upload ${file.name}`,
                    variant: 'destructive'
                });
            }
        }
        return uploadedAttachments;
    };

    const handleSendComment = async () => {
        if (!newComment.trim() && selectedFiles.length === 0) return;

        setSendingComment(true);
        setIsUploading(selectedFiles.length > 0);

        try {
            let attachments: Attachment[] = [];
            if (selectedFiles.length > 0) {
                attachments = await uploadFiles();
            }

            await api.post('/comments', {
                ticketId: ticket._id,
                text: newComment,
                attachments
            });

            setNewComment('');
            setSelectedFiles([]);
            fetchComments();
            toast({ title: 'Comment Sent' });
        } catch (error: any) {
            console.error('Error sending comment:', error);
            toast({
                title: 'Error',
                description: 'Failed to send comment',
                variant: 'destructive'
            });
        } finally {
            setSendingComment(false);
            setIsUploading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            await api.put(`/tickets/${ticket._id}`, { status: newStatus });
            toast({ title: 'Status Updated' });
            if (onUpdate) onUpdate();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update status',
                variant: 'destructive'
            });
        }
    };

    const handleUpdatePriority = async (newPriority: string) => {
        try {
            await api.put(`/tickets/${ticket._id}`, { priority: newPriority });
            toast({ title: 'Priority Updated' });
            if (onUpdate) onUpdate();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update priority',
                variant: 'destructive'
            });
        }
    };

    // Helper to render attachment preview
    const renderAttachment = (att: Attachment) => {
        const isImage = att.type.startsWith('image/');
        return (
            <a
                key={att.url}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded border bg-muted/50 hover:bg-muted transition-colors text-sm max-w-fit mt-1"
            >
                {isImage ? <ImageIcon className="w-4 h-4 text-blue-500" /> : <File className="w-4 h-4 text-orange-500" />}
                <span className="truncate max-w-[150px]">{att.name}</span>
            </a>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between mr-8">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-xl">Ticket Details</DialogTitle>
                            <Badge variant="outline" className="capitalize">{ticket.issueType.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select defaultValue={ticket.status} onValueChange={handleUpdateStatus}>
                                <SelectTrigger className="w-[140px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select defaultValue={ticket.priority} onValueChange={handleUpdatePriority}>
                                <SelectTrigger className="w-[110px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogDescription className="mt-2">
                        Created by <span className="font-medium text-foreground">{ticket.requestedBy.name}</span> on {format(new Date(ticket.createdAt), 'PPP')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Side (Details) - Mobile hidden usually, but let's keep it simple for now or responsive */}
                    <div className="w-1/3 border-r p-6 hidden md:block overflow-y-auto bg-muted/10">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Category</h4>
                                <Badge variant="secondary" className="capitalize">{ticket.category}</Badge>
                            </div>

                            {ticket.attachments && ticket.attachments.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Attachments</h4>
                                        <div className="flex flex-col gap-2">
                                            {ticket.attachments.map((att) => renderAttachment(att))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Side (Comments) */}
                    <div className="flex-1 flex flex-col bg-background">
                        <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
                            {/* Mobile Description View */}
                            <div className="md:hidden mb-6 pb-6 border-b">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                            </div>

                            <div className="space-y-6">
                                {loadingComments ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground text-sm">
                                        No comments yet. Start the conversation!
                                    </div>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment._id} className="flex gap-4 group">
                                            <Avatar className="w-8 h-8 mt-1">
                                                <AvatarImage src={comment.userId.avatar_url} />
                                                <AvatarFallback>{comment.userId.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{comment.userId.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                                                    </span>
                                                </div>
                                                <div className="text-sm leading-relaxed bg-muted/30 p-3 rounded-lg rounded-tl-none">
                                                    {comment.text}
                                                </div>
                                                {comment.attachments && comment.attachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {comment.attachments.map((att) => renderAttachment(att))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-background">
                            {/* File Preview */}
                            {selectedFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/20 rounded-lg">
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-background border px-2 py-1 rounded-full text-xs">
                                            <span className="truncate max-w-[100px]">{file.name}</span>
                                            <button onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-foreground">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => document.getElementById('comment-file-upload')?.click()}
                                    disabled={sendingComment}
                                >
                                    <Paperclip className="w-4 h-4" />
                                </Button>
                                <input
                                    type="file"
                                    id="comment-file-upload"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />

                                <Textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="min-h-[40px] max-h-[150px] resize-none py-2"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendComment();
                                        }
                                    }}
                                />

                                <Button
                                    size="icon"
                                    onClick={handleSendComment}
                                    disabled={(!newComment.trim() && selectedFiles.length === 0) || sendingComment}
                                >
                                    {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground px-1">
                                <span>Supported: Images, PDF, Docs</span>
                                {isUploading && <span className="text-blue-500 animate-pulse">Uploading attachments...</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
