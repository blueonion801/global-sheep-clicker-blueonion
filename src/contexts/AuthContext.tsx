import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

interface AuthContextType {
  authUserId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const storedAuthUserId = localStorage.getItem('auth_user_id');
      const storedUsername = localStorage.getItem('auth_username');

      if (storedAuthUserId && storedUsername) {
        setAuthUserId(storedAuthUserId);
        setUsername(storedUsername);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, username, auth_user_id, password_hash, nickname')
        .eq('username', username)
        .maybeSingle();

      const newAuthUserId = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(password, 10);

      if (existingUser) {
        // Check if the existing user is anonymous (no auth_user_id or password_hash)
        if (!existingUser.auth_user_id && !existingUser.password_hash) {
          // This is an anonymous account - claim it by adding auth credentials
          const { error: updateError } = await supabase
            .from('users')
            .update({
              auth_user_id: newAuthUserId,
              password_hash: passwordHash
            })
            .eq('id', existingUser.id);

          if (updateError) {
            return { success: false, error: updateError.message };
          }

          // Update local storage to point to the claimed account
          localStorage.setItem('auth_user_id', newAuthUserId);
          localStorage.setItem('auth_username', username);
          localStorage.setItem('sheep_user_id', existingUser.id);
          setAuthUserId(newAuthUserId);
          setUsername(username);

          return { success: true };
        } else {
          // This username is already claimed by someone else
          return { success: false, error: 'Username already exists' };
        }
      }

      const currentUserId = localStorage.getItem('sheep_user_id');

      if (currentUserId) {
        // Update current anonymous session with auth credentials
        const { error: updateError } = await supabase
          .from('users')
          .update({
            auth_user_id: newAuthUserId,
            username: username,
            password_hash: passwordHash
          })
          .eq('id', currentUserId);

        if (updateError) {
          return { success: false, error: updateError.message };
        }
      } else {
        // Create new account
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: crypto.randomUUID(),
            auth_user_id: newAuthUserId,
            username: username,
            password_hash: passwordHash,
            nickname: username,
            total_clicks: 0,
            tier: 0
          }]);

        if (insertError) {
          return { success: false, error: insertError.message };
        }
      }

      localStorage.setItem('auth_user_id', newAuthUserId);
      localStorage.setItem('auth_username', username);
      setAuthUserId(newAuthUserId);
      setUsername(username);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Failed to register' };
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, auth_user_id, username, password_hash, total_clicks, tier')
        .eq('username', username)
        .maybeSingle();

      if (error || !user) {
        return { success: false, error: 'Invalid username or password' };
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return { success: false, error: 'Invalid username or password' };
      }

      localStorage.setItem('auth_user_id', user.auth_user_id);
      localStorage.setItem('auth_username', user.username);
      localStorage.setItem('sheep_user_id', user.id);

      setAuthUserId(user.auth_user_id);
      setUsername(user.username);

      window.location.reload();

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Failed to login' };
    }
  };

  const logout = async () => {
    localStorage.removeItem('auth_user_id');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('sheep_user_id');

    localStorage.removeItem('offline_wool_coins');
    localStorage.removeItem('offline_sheep_gems');
    localStorage.removeItem('offline_last_daily_claim');
    localStorage.removeItem('offline_last_gem_claim');
    localStorage.removeItem('offline_consecutive_days');
    localStorage.removeItem('offline_selected_theme');
    localStorage.removeItem('offline_unlocked_themes');
    localStorage.removeItem('offline_selected_sheep_emoji');
    localStorage.removeItem('offline_selected_particle');
    localStorage.removeItem('offline_last_daily_box_claim');
    localStorage.removeItem('offline_messages_sent');
    localStorage.removeItem('offline_highest_daily_clicks');
    localStorage.removeItem('offline_longest_coin_streak');
    localStorage.removeItem('offline_total_days_active');
    localStorage.removeItem('offline_total_sheep');
    localStorage.removeItem('offline_user_clicks');
    localStorage.removeItem('offline_daily_click_history');

    setAuthUserId(null);
    setUsername(null);

    window.location.reload();
  };

  const value: AuthContextType = {
    authUserId,
    username,
    isAuthenticated: !!authUserId,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
