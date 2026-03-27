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
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any; needsVerification?: boolean; email?: string }>;
  signUp: (email: string, password: string, name: string, department: string) => Promise<{ error: any; needsVerification?: boolean; email?: string; devOtp?: string }>;
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
    // Check if user is logged in on mount (localStorage = remember me, sessionStorage = session only)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
          sessionStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string, rememberMe = true) => {
    try {
      const response = await authService.login({ email, password }, rememberMe);
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
      const data = error.response?.data;
      return {
        error: data?.message || error.message || 'Login failed',
        needsVerification: data?.needsVerification || false,
        email: data?.email,
      };
    }
  };

  const signUp = async (email: string, password: string, name: string, department: string) => {
    try {
      const response = await authService.register({ email, password, name, department });
      return { error: null, needsVerification: response.needsVerification, email: response.email };
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
