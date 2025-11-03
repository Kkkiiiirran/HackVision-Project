
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from "react-router-dom";
import { authService, educatorService, studentService } from '../lib/api';
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  role: 'educator' | 'student';
}

interface Profile {
  id: string;
  userId: string;
  name: string;
  bio: string;
  role: "educator" | "student";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Decode token payload to determine role and avoid calling the wrong /me endpoint
        const decodeJwt = (jwtToken: string) => {
          try {
            const parts = jwtToken.split('.');
            if (parts.length !== 3) return null;
            const payload = parts[1];
            // base64url -> base64
            const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map(function(c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
            );
            return JSON.parse(jsonPayload);
          } catch (err) {
            return null;
          }
        };

        const payload = token ? decodeJwt(token) : null;
        const roleFromToken = payload?.role || payload?.user?.role || null;

        if (roleFromToken === 'educator') {
          const { data: educatorProfile } = await educatorService.getProfile();
          setProfile({ ...educatorProfile, role: 'educator' });
          setUser({
            id: educatorProfile.user_id || educatorProfile.userId,
            email: educatorProfile.email,
            role: 'educator'
          });
        } else if (roleFromToken === 'student') {
          const { data: studentProfile } = await studentService.getProfile();
          setProfile({ ...studentProfile, role: 'student' });
          setUser({
            id: studentProfile.user_id || studentProfile.userId,
            email: studentProfile.email,
            role: 'student'
          });
        } else {
          // Fallback: try educator, then student as before
          try {
            const { data: educatorProfile } = await educatorService.getProfile();
            setProfile({ ...educatorProfile, role: 'educator' });
            setUser({
              id: educatorProfile.user_id || educatorProfile.userId,
              email: educatorProfile.email,
              role: 'educator'
            });
          } catch (e1) {
            try {
              const { data: studentProfile } = await studentService.getProfile();
              setProfile({ ...studentProfile, role: 'student' });
              setUser({
                id: studentProfile.user_id || studentProfile.userId,
                email: studentProfile.email,
                role: 'student'
              });
            } catch (e2) {
              // Token might be invalid
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(email, password);
      
      // Store tokens - backend returns { token, refresh_token, user: {...} }
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      if (response.refresh_token) {
        localStorage.setItem('refreshToken', response.refresh_token);
      }
      
      // Map backend response to frontend User structure
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role
      };
      
      setUser(userData);
      
      // Get profile based on role
      if (userData.role === 'educator') {
        const { data: profileData } = await educatorService.getProfile();
        setProfile({ ...profileData, role: 'educator' });
      } else if (userData.role === 'student') {
        const { data: profileData } = await studentService.getProfile();
        setProfile({ ...profileData, role: 'student' });
      }
      
      navigate("/");
    } catch (err: any) {
      // Handle different error formats from backend
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to sign in';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      setError(null);

      let response: any;

      // Call the correct backend endpoint based on role
      if (userData.role === 'educator') {
        // Signup expects only name, email, password
        response = await authService.educatorSignup({
          email,
          password,
          name: userData.name
        });
      } else {
        response = await authService.studentSignup({
          email,
          password,
          name: userData.name
        });
      }

      // CRITICAL: Store tokens IMMEDIATELY before any other requests
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      if (response.refresh_token) {
        localStorage.setItem('refreshToken', response.refresh_token);
      }

      // Map backend response to frontend User structure
      // Backend returns: { id, user_id, email, role, name, token, refresh_token }
      const newUser: User = {
        id: response.user_id || response.id,
        email: response.email,
        role: response.role
      };
      
      setUser(newUser);

      // Fetch profile based on role and update optional fields (e.g., bio)
      // The axios interceptor should now include the token
      if (newUser.role === 'educator') {
        const profileRes = await educatorService.getProfile();
        setProfile({ ...profileRes.data, role: 'educator' });
        if (userData.bio) {
          await educatorService.updateProfile({ bio: userData.bio });
          const updated = await educatorService.getProfile();
          setProfile({ ...updated.data, role: 'educator' });
        }
      } else {
        const profileRes = await studentService.getProfile();
        setProfile({ ...profileRes.data, role: 'student' });
        if (userData.bio) {
          await studentService.updateProfile({ bio: userData.bio });
          const updated = await studentService.getProfile();
          setProfile({ ...updated.data, role: 'student' });
        }
      }

      toast.success('Account created! You are now logged in.');
      navigate("/");

    } catch (err: any) {
      // Handle different error formats from backend
      // Backend can return: { message: '...' }, { error: '...' }, or { error: '...', details: [...] }
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          (err.response?.data?.details && err.response.data.details[0]?.message) ||
                          'Failed to sign up';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      setUser(null);
      setProfile(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      navigate("/auth");
    } catch (err: any) {
      console.error('Error signing out:', err);
      // Clear local state even if logout fails
      setUser(null);
      setProfile(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;