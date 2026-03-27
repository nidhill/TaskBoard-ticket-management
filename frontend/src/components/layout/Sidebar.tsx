import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
  History,
  HelpCircle,
  FolderPlus,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from '@/components/ui/sidebar';

const sidebarStyles = `
  /* Nav items */
  [data-sidebar="menu-button"] {
    border-radius: 0 !important;
    border-left: 2.5px solid transparent !important;
    padding: 10px 18px !important;
    font-size: 10.5px !important;
    font-weight: 700 !important;
    letter-spacing: 1.8px !important;
    text-transform: uppercase !important;
    color: rgba(255,255,255,0.36) !important;
    height: auto !important;
    min-height: unset !important;
    gap: 11px !important;
    transition: color .15s, background .15s, border-color .15s !important;
  }
  [data-sidebar="menu-button"]:hover {
    color: rgba(255,255,255,0.72) !important;
    background: rgba(255,255,255,0.04) !important;
  }
  [data-sidebar="menu-button"][data-active="true"] {
    color: rgba(255,255,255,0.92) !important;
    background: rgba(255,255,255,0.06) !important;
    border-left-color: #d97706 !important;
  }
  [data-sidebar="menu-button"] svg {
    width: 15px !important;
    height: 15px !important;
    opacity: 0.7;
    flex-shrink: 0;
  }
  [data-sidebar="menu-button"][data-active="true"] svg {
    opacity: 1;
  }
  /* Hide group labels */
  [data-sidebar="group-label"] { display: none !important; }
  /* Sub-menu items */
  [data-sidebar="menu-sub-button"] {
    font-size: 10px !important;
    font-weight: 600 !important;
    letter-spacing: 1.5px !important;
    text-transform: uppercase !important;
    color: rgba(255,255,255,0.28) !important;
    border-radius: 0 !important;
    padding: 9px 18px 9px 40px !important;
    height: auto !important;
    gap: 9px !important;
  }
  [data-sidebar="menu-sub-button"]:hover {
    color: rgba(255,255,255,0.62) !important;
    background: rgba(255,255,255,0.03) !important;
  }
  [data-sidebar="menu-sub-button"][data-active="true"] {
    color: rgba(255,255,255,0.85) !important;
  }
  [data-sidebar="menu-sub"] {
    margin: 0 !important;
    border-left: none !important;
    padding: 0 !important;
  }
  /* Footer buttons */
  [data-sidebar="footer"] [data-sidebar="menu-button"] {
    font-size: 10.5px !important;
  }
`;

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();
  const permissions = usePermissions();
  const { isMobile, state } = useSidebar();
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);

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
    { name: 'Notifications', href: '/notifications', icon: Bell, show: true },
  ].filter(item => item.show);

  const adminNavigation = [
    { name: 'User Management', href: '/admin/users', icon: Shield, show: permissions.canManageUsers },
    { name: 'Audit Log', href: '/admin/audit-logs', icon: History, show: permissions.canManageUsers },
  ].filter(item => item.show);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isCollapsed = state === 'collapsed';

  return (
    <ShadcnSidebar collapsible="icon">
      <style>{sidebarStyles}</style>

      {/* ── Header ── */}
      <SidebarHeader style={{ padding: '28px 0 20px' }}>
        <div style={{ paddingLeft: 20, paddingRight: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Grid icon */}
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: 'rgba(255,255,255,.07)',
              border: '1px solid rgba(255,255,255,.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.72)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            {!isCollapsed && (
              <div>
                <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: '-.2px', lineHeight: 1.1 }}>
                  Slate
                </div>
                <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', marginTop: 2 }}>
                  Project Management
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      {/* ── Nav ── */}
      <SidebarContent style={{ padding: '8px 0' }}>
        {/* Divider */}
        {!isCollapsed && (
          <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '0 0 8px' }} />
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item: any) => {
                const isActive = location.pathname === item.href;
                const isChildActive = item.children?.some((c: any) => location.pathname === c.href);
                const showSub = isActive || isChildActive || hoveredFolder === item.name;

                return (
                  <SidebarMenuItem
                    key={item.name}
                    onMouseEnter={() => setHoveredFolder(item.name)}
                    onMouseLeave={() => setHoveredFolder(null)}
                  >
                    <SidebarMenuButton asChild isActive={isActive || isChildActive} tooltip={item.name}>
                      <Link to={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                        {item.children?.length > 0 && (
                          <ChevronsUpDown style={{ marginLeft: 'auto', width: 12, height: 12, opacity: .4 }} />
                        )}
                      </Link>
                    </SidebarMenuButton>

                    {item.children?.length > 0 && showSub && (
                      <SidebarMenuSub>
                        {item.children.map((child: any) => {
                          if (!child.show) return null;
                          const childActive = location.pathname === child.href;
                          return (
                            <SidebarMenuSubItem key={child.name}>
                              <SidebarMenuSubButton asChild isActive={childActive}>
                                <Link to={child.href}>
                                  <child.icon />
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
          <>
            {!isCollapsed && <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '8px 0' }} />}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavigation.map(item => {
                    const isActive = location.pathname === item.href;
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                          <Link to={item.href}>
                            <item.icon />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter style={{ padding: '8px 0 16px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        {/* New Project button */}
        {permissions.canCreateProject && (
          <div style={{ padding: '10px 14px 6px' }}>
            {isCollapsed ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="New Project">
                    <Link to="/projects?create=true">
                      <FolderPlus />
                      <span>New Project</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : (
              <Link
                to="/projects?create=true"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '9px 14px', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.05)',
                  color: 'rgba(255,255,255,.72)', fontSize: 12, fontWeight: 600,
                  textDecoration: 'none', letterSpacing: '.2px',
                  transition: 'background .15s, border-color .15s, color .15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.1)';
                  (e.currentTarget as HTMLElement).style.color = '#fff';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.05)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.72)';
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Project
              </Link>
            )}
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/settings'} tooltip="Settings">
              <Link to="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Help">
              <Link to="/notifications">
                <HelpCircle />
                <span>Help</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User dropdown */}
        <SidebarMenu style={{ marginTop: 4 }}>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 0,
                    height: 'auto',
                    borderLeft: '2.5px solid transparent',
                    color: 'rgba(255,255,255,.5)',
                  }}
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="h-6 w-6 rounded-md flex-shrink-0">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name || ''} />
                    <AvatarFallback className="rounded-md text-[10px]">{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight overflow-hidden">
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'none', letterSpacing: 0 }}>
                      {profile?.name || 'User'}
                    </span>
                    <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,.28)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'none', letterSpacing: 0 }}>
                      {profile?.email || ''}
                    </span>
                  </div>
                  <ChevronsUpDown style={{ width: 12, height: 12, opacity: .4, flexShrink: 0 }} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
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
