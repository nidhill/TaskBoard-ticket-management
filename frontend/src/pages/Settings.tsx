import { useState, useRef, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Bell, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

export default function Settings() {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [notifications, setNotifications] = useState({
    email: user?.notifications?.email ?? true,
    pageApproval: user?.notifications?.pageApproval ?? true,
    ticketUpdates: user?.notifications?.ticketUpdates ?? true,
    ticketLimit: user?.notifications?.ticketLimit ?? true,
  });

  // Cropping State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  // Update local state when user updates (e.g. after avatar upload)
  useEffect(() => {
    if (user) {
      setName(user.name);
      setDepartment(user.department);
      setNotifications({
        email: user?.notifications?.email ?? true,
        pageApproval: user?.notifications?.pageApproval ?? true,
        ticketUpdates: user?.notifications?.ticketUpdates ?? true,
        ticketLimit: user?.notifications?.ticketLimit ?? true,
      });
    }
  }, [user]);

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const handleSaveProfile = async () => {
    setIsLoading(true);
    const { error } = await updateUserProfile({
      name,
      department,
      notifications
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read the file as Data URL to show in cropper
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string);
      setIsCropDialogOpen(true);
      // Reset crop/zoom specific to new image if needed
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    });
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again if cancelled
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      if (!croppedImageBlob) {
        throw new Error('Failed to crop image');
      }

      const formData = new FormData();
      // Use original filename or default
      formData.append('file', croppedImageBlob, 'avatar.jpg');

      // 1. Upload file
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const avatarUrl = uploadRes.data.file.url;

      // 2. Update user profile with new avatar URL
      const { error } = await updateUserProfile({ avatar_url: avatarUrl });

      if (error) throw new Error(error.message);

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
      setIsCropDialogOpen(false);
      setImageSrc(null);
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => {
      const newSettings = { ...prev, [key]: !prev[key] };
      handleAutoSaveNotifications(newSettings);
      return newSettings;
    });
  };

  const handleAutoSaveNotifications = async (newSettings: any) => {
    // Background save
    await updateUserProfile({ notifications: newSettings });
  };

  return (
    <MainLayout>
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences."
      />

      <div className="max-w-3xl space-y-6">
        {/* Profile Section */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Profile</CardTitle>
            </div>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <Button variant="outline" size="sm" onClick={handleAvatarClick} disabled={isUploading}>
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Change Avatar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} disabled />
                <p className="text-xs text-muted-foreground">Contact admin to change email</p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex items-center h-10">
                  <Badge variant="secondary" className="capitalize">
                    {user.role.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={() => toggleNotification('email')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Page Approval Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when pages need approval</p>
              </div>
              <Switch
                checked={notifications.pageApproval}
                onCheckedChange={() => toggleNotification('pageApproval')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ticket Updates</Label>
                <p className="text-sm text-muted-foreground">Get notified about ticket status changes</p>
              </div>
              <Switch
                checked={notifications.ticketUpdates}
                onCheckedChange={() => toggleNotification('ticketUpdates')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ticket Limit Warnings</Label>
                <p className="text-sm text-muted-foreground">Alert when pages are near ticket limit</p>
              </div>
              <Switch
                checked={notifications.ticketLimit}
                onCheckedChange={() => toggleNotification('ticketLimit')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Security</CardTitle>
            </div>
            <CardDescription>Manage your security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </div>
            <Button>Update Password</Button>
          </CardContent>
        </Card>
      </div>

      {/* Crop Dialog */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Profile Picture</DialogTitle>
            <DialogDescription>
              Drag to position and use the slider to zoom.
            </DialogDescription>
          </DialogHeader>

          <div className="relative w-full h-[400px] mt-4 bg-black/5 rounded-md overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          <div className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <Label>Zoom</Label>
              <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropSave} disabled={isUploading}>
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
