import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Plus, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'tech_admin' | 'department_head' | 'developer' | 'requester';
  department: string;
  avatar_url?: string;
}

const roleColors: Record<string, string> = {
  tech_admin: 'bg-primary/10 text-primary',
  department_head: 'bg-warning/10 text-warning',
  developer: 'bg-info/10 text-info',
  requester: 'bg-muted text-muted-foreground',
};

const roleLabels: Record<string, string> = {
  tech_admin: 'Tech Admin',
  department_head: 'Department Head',
  developer: 'Developer',
  requester: 'Requester',
};

export default function Team() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    role: 'requester',
  });

  const { role, user: currentUser } = useAuth();
  const { toast } = useToast();

  const canManageTeam = role === 'tech_admin' || role === 'department_head';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      // Don't show error if it's just permission denied (requester view)
      if (error.response?.status !== 403) {
        toast({
          title: 'Error',
          description: 'Failed to load team members',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.department) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/users', formData);
      toast({
        title: 'Success',
        description: 'Team member added successfully',
      });
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        department: '',
        role: 'requester',
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add team member',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      toast({
        title: 'Success',
        description: 'Team member removed',
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove team member',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Team"
        description="Manage team members and their roles."
        actions={
          canManageTeam && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Create a new account for a team member. They will use these credentials to log in.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="e.g. john@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(val) => setFormData({ ...formData, department: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(val) => setFormData({ ...formData, role: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="requester">Requester</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="department_head">Department Head</SelectItem>
                          <SelectItem value="tech_admin">Tech Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateUser} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Member'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      {/* Access Denied State for Requesters/Developers who can't view list? 
          Wait, backend allows 'tech_admin' only? 
          My update allows 'department_head' too.
          What about others? They get 403.
      */}
      {!canManageTeam && users.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
          <ShieldAlert className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="text-muted-foreground mt-2">
            Only Department Heads and Tech Admins can view the full team roster.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user._id} className="glass-card hover-lift group relative">
            {/* Delete Button (Only for Admins/DeptHeads and not self) */}
            {canManageTeam && currentUser?.id !== user._id && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteUser(user._id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-2 mb-4">
                <h3 className="font-semibold text-foreground">{user.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={cn('font-medium', roleColors[user.role] || roleColors.requester)}>
                  {roleLabels[user.role] || user.role}
                </Badge>
                <Badge variant="outline">{user.department}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
