import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, Loader2, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import api from '@/services/api';
import { Notification } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n =>
        n._id === id || n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Notifications"
        description="Stay updated with latest activities."
        actions={
          notifications.length > 0 && notifications.some(n => !n.read) && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )
        }
      />

      <div className="max-w-3xl mx-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-muted/10 p-4 rounded-full mb-4">
              <Bell className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No Request Found</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notifications.map((notification) => (
              <Card
                key={notification._id || notification.id}
                className={cn(
                  "transition-all duration-200 hover:shadow-md cursor-pointer",
                  !notification.read && "bg-primary/5 border-primary/20"
                )}
                onClick={() => !notification.read && markAsRead(notification._id || notification.id)}
              >
                <CardContent className="p-4 flex gap-4">
                  <div className={cn(
                    "mt-1 p-2 rounded-full h-fit",
                    !notification.read ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className={cn("font-medium", !notification.read && "text-primary")}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
