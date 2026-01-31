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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Check, ChevronsUpDown, X, Plus, Link as LinkIcon, FileIcon, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),

    startDate: z.string().optional(),
    deliveryDate: z.string().optional(),
    projectHeads: z.array(z.string()).min(1, 'At least one Project Head is required'),
    members: z.array(z.object({
        user: z.string(),
        role: z.enum(['developer', 'designer', 'manager', 'qa', 'other'])
    })).optional(),
    urls: z.array(z.string()).optional(),
    attachments: z.array(z.object({
        name: z.string(),
        url: z.string(),
        type: z.string()
    })).optional(),
});

interface User {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
}

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Member selection state
    const [openMemberCombobox, setOpenMemberCombobox] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'developer' | 'designer' | 'manager' | 'qa' | 'other'>('developer');
    // Map to store details of selected users for display (ID -> User)
    const [selectedMembersDetails, setSelectedMembersDetails] = useState<Record<string, User>>({});
    // Map to store details of selected project heads for display (ID -> User)
    const [selectedHeadsDetails, setSelectedHeadsDetails] = useState<Record<string, User>>({});

    const [linkInput, setLinkInput] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',

            startDate: '',
            deliveryDate: '',
            projectHeads: [],
            members: [],
            urls: [],
            attachments: [],
        },
    });

    useEffect(() => {
        if (openCombobox || openMemberCombobox) {
            searchUsers('');
        }
    }, [openCombobox, openMemberCombobox]);

    const searchUsers = async (query: string) => {
        try {
            setLoadingUsers(true);
            const response = await api.get(`/users/search?q=${query}`);
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if ((openCombobox || openMemberCombobox) && searchQuery) {
                searchUsers(searchQuery);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, openCombobox, openMemberCombobox]);



    const handleAddLink = () => {
        if (!linkInput) return;
        // Basic URL validation could be added here
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
            // Upload files first if any
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
                        // Continue with other files/submission? 
                        // For now let's continue but warn user
                    }
                }
            }

            const submissionData = {
                ...values,
                attachments: uploadedAttachments
            };

            await api.post('/projects', submissionData);
            toast({
                title: 'Project Created',
                description: 'Project created and sent for approval.',
            });
            form.reset();
            setLinkInput('');
            setSelectedFiles([]);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error creating project:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create project',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
            setUploadingFiles(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto overflow-x-hidden">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Details about the new project. The selected Project Heads must approve it.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter project name" {...field} />
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
                                        <Textarea placeholder="Enter description" className="resize-y" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="deliveryDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Project Heads Section */}
                        <div className="space-y-3">
                            <FormLabel>Project Heads *</FormLabel>
                            <div className="border rounded-md p-4 space-y-4">
                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCombobox}
                                            className="w-full justify-between"
                                        >
                                            Select project head to add...
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command shouldFilter={false}>
                                            <CommandInput placeholder="Search users by name or email..." onValueChange={setSearchQuery} />
                                            <CommandList>
                                                {loadingUsers && <div className="py-6 text-center text-sm"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>}
                                                {!loadingUsers && users.length === 0 && <CommandEmpty>No users found.</CommandEmpty>}
                                                <CommandGroup>
                                                    {users.map((user) => {
                                                        const isAlreadyHead = form.getValues('projectHeads')?.includes(user._id);
                                                        const isAlreadyMember = form.getValues('members')?.some(m => m.user === user._id);

                                                        if (isAlreadyHead) return null;

                                                        return (
                                                            <CommandItem
                                                                value={user.name}
                                                                key={user._id}
                                                                onSelect={() => {
                                                                    const currentHeads = form.getValues('projectHeads') || [];

                                                                    // Update display details
                                                                    setSelectedHeadsDetails(prev => ({
                                                                        ...prev,
                                                                        [user._id]: user
                                                                    }));

                                                                    form.setValue('projectHeads', [...currentHeads, user._id]);
                                                                    setOpenCombobox(false);
                                                                }}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span>{user.name}</span>
                                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                                </div>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                {/* Selected Project Heads List */}
                                <FormField
                                    control={form.control}
                                    name="projectHeads"
                                    render={({ field }) => (
                                        <div className="space-y-2">
                                            {field.value && field.value.length > 0 ? (
                                                <div className="grid gap-2">
                                                    {field.value.map((headId, index) => {
                                                        const headDetails = selectedHeadsDetails[headId];
                                                        const displayName = headDetails ? headDetails.name : `Head (ID: ${headId.slice(-4)})`;
                                                        const displayEmail = headDetails ? headDetails.email : 'Unknown email';

                                                        return (
                                                            <div key={index} className="flex items-center justify-between p-2 bg-muted/40 rounded-md border">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                                        {displayName.charAt(0)}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium">{displayName}</span>
                                                                        <span className="text-xs text-muted-foreground">{displayEmail}</span>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => {
                                                                        const newHeads = [...field.value!];
                                                                        newHeads.splice(index, 1);
                                                                        form.setValue('projectHeads', newHeads);
                                                                    }}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed rounded-md">
                                                    No project heads added
                                                </div>
                                            )}
                                            <FormMessage />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Team Members Section */}
                        <div className="space-y-3">
                            <FormLabel>Team Members</FormLabel>
                            <div className="border rounded-md p-4 space-y-4">
                                <div className="flex gap-2">
                                    <Popover open={openMemberCombobox} onOpenChange={setOpenMemberCombobox}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openMemberCombobox}
                                                className="flex-1 justify-between"
                                            >
                                                Select member to add...
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput placeholder="Search users..." onValueChange={setSearchQuery} />
                                                <CommandList>
                                                    {loadingUsers && <div className="py-6 text-center text-sm"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>}
                                                    {!loadingUsers && users.length === 0 && <CommandEmpty>No users found.</CommandEmpty>}
                                                    <CommandGroup>
                                                        {users.map((user) => {
                                                            const isAlreadyMember = form.getValues('members')?.some(m => m.user === user._id);
                                                            const isProjectHead = form.getValues('projectHeads')?.includes(user._id);

                                                            if (isAlreadyMember || isProjectHead) return null;

                                                            return (
                                                                <CommandItem
                                                                    value={user.name}
                                                                    key={user._id}
                                                                    onSelect={() => {
                                                                        const currentMembers = form.getValues('members') || [];

                                                                        // Update display details
                                                                        setSelectedMembersDetails(prev => ({
                                                                            ...prev,
                                                                            [user._id]: user
                                                                        }));

                                                                        form.setValue('members', [
                                                                            ...currentMembers,
                                                                            { user: user._id, role: selectedRole }
                                                                        ]);
                                                                        setOpenMemberCombobox(false);
                                                                    }}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span>{user.name}</span>
                                                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                                                    </div>
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    <Select
                                        value={selectedRole}
                                        onValueChange={(val: any) => setSelectedRole(val)}
                                    >
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="developer">Developer</SelectItem>
                                            <SelectItem value="designer">Designer</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="qa">QA</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Members List */}
                                <FormField
                                    control={form.control}
                                    name="members"
                                    render={({ field }) => (
                                        <div className="space-y-2">
                                            {field.value && field.value.length > 0 ? (
                                                <div className="grid gap-2">
                                                    {field.value.map((member, index) => {
                                                        // Look up user details
                                                        const memberDetails = selectedMembersDetails[member.user];
                                                        const displayName = memberDetails ? memberDetails.name : `Member (ID: ${member.user.slice(-4)})`;
                                                        const displayEmail = memberDetails ? memberDetails.email : 'Unknown email';

                                                        return (
                                                            <div key={index} className="flex items-center justify-between p-2 bg-muted/40 rounded-md border">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                                        {displayName.charAt(0)}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium">{displayName}</span>
                                                                        <span className="text-xs text-muted-foreground capitalize">{member.role} • {displayEmail}</span>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => {
                                                                        const newMembers = [...field.value!];
                                                                        newMembers.splice(index, 1);
                                                                        form.setValue('members', newMembers);
                                                                    }}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed rounded-md">
                                                    No team members added
                                                </div>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>
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

                            {/* Links List */}
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

                            {/* Files List */}
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
                                Create Project
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
