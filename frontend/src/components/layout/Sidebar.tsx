import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Ticket,
  LayoutGrid,
  Users,
  Settings,
  Bell,
  LogOut,
  Shield,
  ChevronsUpDown,
  History
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from '@/components/ui/sidebar';

const roleLabels: Record<string, string> = {
  user: 'User',
  admin: 'Admin',
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();
  const permissions = usePermissions();
  const { isMobile } = useSidebar();
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);

  // Build navigation based on permissions
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, show: true },
    {
      name: 'Projects',
      href: '/projects',
      icon: FolderKanban,
      show: permissions.canViewProjects,
      children: [
        { name: 'Task Board', href: '/board', icon: LayoutGrid, show: permissions.canViewPages }
      ]
    },
    { name: 'Team', href: '/team', icon: Users, show: permissions.canViewTeam },

  ].filter(item => item.show);

  // Admin navigation
  const adminNavigation = [
    { name: 'User Management', href: '/admin/users', icon: Shield, show: permissions.canManageUsers },
    { name: 'Audit Log', href: '/admin/audit-logs', icon: History, show: permissions.canManageUsers },
  ].filter(item => item.show);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <FolderKanban className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">ProjectFlow</span>
                  <span className="truncate text-xs">Management System</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item: any) => {
                const isActive = location.pathname === item.href;
                const isChildActive = item.children?.some((child: any) => location.pathname === child.href);
                const showSubmenu = isActive || isChildActive || hoveredFolder === item.name;

                return (
                  <SidebarMenuItem
                    key={item.name}
                    onMouseEnter={() => setHoveredFolder(item.name)}
                    onMouseLeave={() => setHoveredFolder(null)}
                  >
                    <SidebarMenuButton asChild isActive={isActive || isChildActive} tooltip={item.name}>
                      <Link to={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.name}</span>
                        {item.children && item.children.length > 0 && (
                          <ChevronsUpDown className={`ml-auto size-4 transition-transform duration-200 ${showSubmenu ? 'rotate-180' : ''}`} />
                        )}
                      </Link>
                    </SidebarMenuButton>
                    {item.children && item.children.length > 0 && showSubmenu && (
                      <SidebarMenuSub>
                        {item.children.map((child: any) => {
                          if (!child.show) return null;
                          const isChildActive = location.pathname === child.href;
                          return (
                            <SidebarMenuSubItem key={child.name}>
                              <SidebarMenuSubButton asChild isActive={isChildActive} size="md">
                                <Link to={child.href}>
                                  <child.icon className="size-4" />
                                  <span>{child.name}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminNavigation.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                        <Link to={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Notifications">
              <Link to="/notifications">
                <Bell className="size-4" />
                <span>Notifications</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name || ''} />
                    <AvatarFallback className="rounded-lg">{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{profile?.name || 'User'}</span>
                    <span className="truncate text-xs">{role ? roleLabels[role] : ''}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name || ''} />
                      <AvatarFallback className="rounded-lg">{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{profile?.name || 'User'}</span>
                      <span className="truncate text-xs">{profile?.email || ''}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/notifications')}>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  );
}
