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
import { Loader2, Check, ChevronsUpDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

const formSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
    startDate: z.string().optional(),
    deliveryDate: z.string().optional(),
    projectHead: z.string().min(1, 'Project Head is required'),
    members: z.array(z.object({
        user: z.string(),
        role: z.string()
    })).optional(),
});

interface User {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
}

interface EditProjectDialogProps {
    project: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditProjectDialog({ project, open, onOpenChange, onSuccess }: EditProjectDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            startDate: '',
            deliveryDate: '',
            projectHead: '',
            members: [],
        },
    });

    useEffect(() => {
        if (project) {
            form.reset({
                name: project.name,
                description: project.description || '',
                startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
                deliveryDate: project.deliveryDate ? format(new Date(project.deliveryDate), 'yyyy-MM-dd') : '',
                projectHead: typeof project.projectHead === 'object' ? project.projectHead._id : project.projectHead,
                members: project.members?.map((m: any) => ({
                    user: typeof m.user === 'object' ? m.user._id : m.user,
                    role: m.role
                })) || [],
            });
            // Pre-load current project head into users list if needed
            if (project.projectHead && typeof project.projectHead === 'object') {
                setUsers([project.projectHead]);
            }
        }
    }, [project, form]);

    useEffect(() => {
        if (openCombobox) {
            searchUsers('');
        }
    }, [openCombobox]);

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
            if (openCombobox && searchQuery) {
                searchUsers(searchQuery);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, openCombobox]);


    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            await api.put(`/projects/${project._id}`, values);
            toast({
                title: 'Project Updated',
                description: 'Project details have been updated successfully.',
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error updating project:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update project',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                        Update project details.
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
                                        <Textarea placeholder="Enter description" {...field} />
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

                        <FormField
                            control={form.control}
                            name="projectHead"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Project Head *</FormLabel>
                                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCombobox}
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value
                                                        ? users.find((user) => user._id === field.value)?.name || (typeof project.projectHead === 'object' && project.projectHead._id === field.value ? project.projectHead.name : "Select user...")
                                                        : "Select project head..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command shouldFilter={false}>
                                                <CommandInput placeholder="Search users by name or email..." onValueChange={setSearchQuery} />
                                                <CommandList>
                                                    {loadingUsers && <div className="py-6 text-center text-sm"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>}
                                                    {!loadingUsers && users.length === 0 && <CommandEmpty>No users found.</CommandEmpty>}
                                                    <CommandGroup>
                                                        {users.map((user) => (
                                                            <CommandItem
                                                                value={user.name}
                                                                key={user._id}
                                                                onSelect={() => {
                                                                    form.setValue("projectHead", user._id);
                                                                    setOpenCombobox(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        user._id === field.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span>{user.name}</span>
                                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
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

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Project
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
