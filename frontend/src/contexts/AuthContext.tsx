import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, UserResponse } from '@/services/auth.service';

export type AppRole = 'admin' | 'user' | 'requester' | 'department_head' | 'developer' | 'tech_admin';

interface Profile {
  id: string;
  name: string;
  email: string;
  department: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: UserResponse | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, department: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserResponse>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      authService
        .getCurrentUser()
        .then((userData) => {
          setUser(userData);
          setProfile({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            department: userData.department,
            avatar_url: userData.avatar_url || null,
          });
          setRole(userData.role as AppRole);
        })
        .catch((error) => {
          console.error('Error fetching user:', error);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      setProfile({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        department: response.user.department,
        avatar_url: response.user.avatar_url || null,
      });
      setRole(response.user.role as AppRole);
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message || 'Login failed' };
    }
  };

  const signUp = async (email: string, password: string, name: string, department: string) => {
    try {
      const response = await authService.register({ email, password, name, department });
      setUser(response.user);
      setProfile({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        department: response.user.department,
        avatar_url: response.user.avatar_url || null,
      });
      setRole(response.user.role as AppRole);
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message || 'Registration failed' };
    }
  };

  const signOut = async () => {
    authService.logout();
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const updateUserProfile = async (data: Partial<UserResponse>) => {
    try {
      if (!user) throw new Error('No user logged in');
      const response = await authService.updateProfile(user.id, data);

      // Update local state
      const updatedUser = response.user;
      setUser(updatedUser);
      setProfile({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        department: updatedUser.department,
        avatar_url: updatedUser.avatar_url || null,
      });

      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
