import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/projects': 'Projects',
    '/tasks': 'Tasks',
    '/tickets': 'Tickets',
    '/board': 'Board',
    '/team': 'Team',
    '/settings': 'Settings',
    '/notifications': 'Notifications',
    '/auth': 'Login',
    '/forgot-password': 'Forgot Password',
    '/admin/users': 'User Management',
    '/admin/audit-logs': 'Audit Logs',
};

export const usePageTitle = () => {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        let title = 'Slate';

        // Check exact matches
        if (routeTitles[path]) {
            title = `${routeTitles[path]} | Slate`;
        }
        // Handle dynamic routes
        else if (path.startsWith('/projects/')) {
            title = 'Project Details | Slate';
        } else if (path.startsWith('/tasks/')) {
            title = 'Task Details | Slate';
        }

        document.title = title;
    }, [location]);
};
