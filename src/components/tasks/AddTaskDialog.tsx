import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Check, ChevronsUpDown, CalendarIcon, User, Link as LinkIcon, FileIcon, X, Plus, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const formSchema = z.object({
    taskName: z.string().min(1, 'Task name is required'),
    description: z.string().optional(),
    assignedDeveloper: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    startDate: z.date().optional(),
    dueDate: z.date().optional(),
    status: z.enum(['to_do', 'in_progress', 'in_review', 'done']).default('to_do'),
    urls: z.array(z.string()).optional(),
    attachments: z.array(z.object({
        name: z.string(),
        url: z.string(),
        type: z.string()
    })).optional(),
});

interface AddTaskDialogProps {
    projectId: string;
    projectMembers: any[]; // List of project members
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AddTaskDialog({ projectId, projectMembers, open, onOpenChange, onSuccess }: AddTaskDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openAssigneeCombo, setOpenAssigneeCombo] = useState(false);

    const [linkInput, setLinkInput] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);

    // Normalize members list for display
    const developers = projectMembers?.map(m => {
        const user = typeof m.user === 'object' ? m.user : { _id: m.user, name: 'Unknown', email: '' }; // Minimal fallback
        return {
            label: user.name,
            value: user._id,
            email: user.email
        };
    }) || [];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            taskName: '',
            description: '',
            priority: 'medium',
            status: 'to_do',
            urls: [],
            attachments: [],
        },
    });

    const handleAddLink = () => {
        if (!linkInput) return;
        const currentUrls = form.getValues('urls') || [];
        form.setValue('urls', [...currentUrls, linkInput]);
        setLinkInput('');
    };

    const handleRemoveLink = (index: number) => {
        const currentUrls = form.getValues('urls') || [];
        const newUrls = [...currentUrls];
        newUrls.splice(index, 1);
        form.setValue('urls', newUrls);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        setUploadingFiles(true);
        try {
            // Upload files first
            const uploadedAttachments = [];
            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                        const uploadRes = await api.post('/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        if (uploadRes.data.success) {
                            uploadedAttachments.push(uploadRes.data.file);
                        }
                    } catch (err) {
                        console.error('Failed to upload file:', file.name, err);
                        toast({
                            title: 'Upload Failed',
                            description: `Failed to upload ${file.name}`,
                            variant: 'destructive'
                        });
                    }
                }
            }

            await api.post('/tasks', {
                projectId,
                ...values,
                attachments: uploadedAttachments,
                startDate: values.startDate ? values.startDate.toISOString() : undefined,
                dueDate: values.dueDate ? values.dueDate.toISOString() : undefined
            });

            toast({
                title: 'Task Created',
                description: 'New task added successfully.',
            });

            form.reset();
            setLinkInput('');
            setSelectedFiles([]);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error adding task:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to add task',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
            setUploadingFiles(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>
                        Create a new task for this project.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="taskName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Task Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Homepage Design" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Details about this task..." className="min-h-[100px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Initial Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="to_do">To Do</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="in_review">In Review</SelectItem>
                                                <SelectItem value="done">Done</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="assignedDeveloper"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Assignee</FormLabel>
                                    <Popover open={openAssigneeCombo} onOpenChange={setOpenAssigneeCombo}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "justify-between pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value
                                                        ? developers.find(d => d.value === field.value)?.label || "Select member..."
                                                        : "Select member..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search team..." />
                                                <CommandList>
                                                    <CommandEmpty>No members found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {developers.map((dev) => (
                                                            <CommandItem
                                                                value={dev.label}
                                                                key={dev.value}
                                                                onSelect={() => {
                                                                    form.setValue("assignedDeveloper", dev.value);
                                                                    setOpenAssigneeCombo(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        dev.value === field.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span>{dev.label}</span>
                                                                    <span className="text-xs text-muted-foreground">{dev.email}</span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Start Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Due Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => {
                                                        const startDate = form.getValues('startDate');
                                                        return startDate ? date < startDate : date < new Date(new Date().setHours(0, 0, 0, 0));
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Links Section */}
                        <div className="space-y-3">
                            <FormLabel>Links</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://example.com/resource"
                                    value={linkInput}
                                    onChange={(e) => setLinkInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddLink();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" onClick={handleAddLink} size="icon">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <FormField
                                control={form.control}
                                name="urls"
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        {field.value && field.value.length > 0 && (
                                            <div className="grid gap-2">
                                                {field.value.map((url, index) => (
                                                    <div key={index} className="flex items-center justify-between p-2 bg-muted/40 rounded-md border text-sm">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <LinkIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-blue-500">
                                                                {url}
                                                            </a>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                            onClick={() => handleRemoveLink(index)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <FormMessage />
                                    </div>
                                )}
                            />
                        </div>

                        {/* Attachments Section */}
                        <div className="space-y-3">
                            <FormLabel>Attachments</FormLabel>
                            <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center space-y-2 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer relative">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Click to upload files</span>
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                    multiple
                                />
                            </div>

                            {selectedFiles.length > 0 && (
                                <div className="grid gap-2">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-muted/40 rounded-md border text-sm">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                <span className="truncate">{file.name}</span>
                                                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveFile(index)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Task
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
