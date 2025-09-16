import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, ChatMessage, GlobalStats, UserCurrency } from '../types/game';
import { TIERS, THEMES } from '../types/game';
import { audioManager } from '../utils/audioManager';

// Check if we're in offline mode (no valid Supabase connection)
const isOfflineMode = (forceOffline = false) => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return forceOffline || !url || url.includes('placeholder') || url.includes('localhost');
};

// Helper function to calculate tier based on clicks
const calculateTier = (clicks: number): number => {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (clicks >= TIERS[i].requirement) {
      return TIERS[i].level;
    }
  }
  return 0; // Default to Lamb
};

export const useGameState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userCurrency, setUserCurrency] = useState<UserCurrency | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ id: 'global', total_sheep: 0, updated_at: new Date().toISOString() });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceOffline, setForceOffline] = useState(false);
  
  // Batching state for database updates
  const [pendingClicks, setPendingClicks] = useState(0);
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchUserCurrency = async (userId: string): Promise<UserCurrency | null> => {
    if (isOfflineMode(forceOffline)) {
      // Return mock currency for offline mode
      return {
        user_id: userId,
        wool_coins: parseInt(localStorage.getItem('offline_wool_coins') || '0'),
        last_daily_claim: localStorage.getItem('offline_last_daily_claim'),
        consecutive_days: parseInt(localStorage.getItem('offline_consecutive_days') || '0'),
        selected_theme: localStorage.getItem('offline_selected_theme') || 'cosmic',
        unlocked_themes: JSON.parse(localStorage.getItem('offline_unlocked_themes') || '["cosmic"]'),
        updated_at: new Date().toISOString()
      };
    }

    try {
      const { data, error } = await supabase
        .from('user_currency')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && !error.message.includes('Could not find')) {
        throw error;
      }

      if (!data) {
        // Create initial currency record
        const initialCurrency: UserCurrency = {
          user_id: userId,
          wool_coins: 0,
          last_daily_claim: null,
          consecutive_days: 0,
          selected_theme: 'cosmic',
          unlocked_themes: ['cosmic'],
          updated_at: new Date().toISOString()
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('user_currency')
          .insert([initialCurrency]);

        if (insertError) {
          // If it's a duplicate key error, try to fetch the existing record
          if (insertError.code === '23505') {
            const { data: existingData, error: fetchError } = await supabase
              .from('user_currency')
              .select('*')
              .eq('user_id', userId)
              .single();
            
            if (fetchError) {
              throw fetchError;
            }
            
            return existingData;
          }
          throw insertError;
        }

        return initialCurrency;
      }

      return data;
    } catch (err) {
      console.warn('Failed to fetch user currency, using offline mode');
      return {
        user_id: userId,
        wool_coins: parseInt(localStorage.getItem('offline_wool_coins') || '0'),
        last_daily_claim: localStorage.getItem('offline_last_daily_claim'),
        consecutive_days: parseInt(localStorage.getItem('offline_consecutive_days') || '0'),
        selected_theme: localStorage.getItem('offline_selected_theme') || 'cosmic',
        unlocked_themes: JSON.parse(localStorage.getItem('offline_unlocked_themes') || '["cosmic"]'),
        updated_at: new Date().toISOString()
      };
    }
  };

  const claimDailyReward = useCallback(async (): Promise<void> => {
    if (!user || !userCurrency) return;

    audioManager.playGuiSound();

    const now = new Date();
    const today = now.toDateString();
    const lastClaim = userCurrency.last_daily_claim ? new Date(userCurrency.last_daily_claim).toDateString() : null;

    // Check if already claimed today
    if (lastClaim === today) return;

    // Calculate consecutive days
    let consecutiveDays = 1;
    if (lastClaim) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastClaim === yesterday.toDateString()) {
        consecutiveDays = userCurrency.consecutive_days + 1;
      }
    }

    // Calculate reward (5 base + 2 per consecutive day, max 15)
    const baseReward = 5;
    const bonusReward = Math.min(consecutiveDays * 2, 10);
    const totalReward = baseReward + bonusReward;

    const updatedCurrency: UserCurrency = {
      ...userCurrency,
      wool_coins: userCurrency.wool_coins + totalReward,
      last_daily_claim: now.toISOString(),
      consecutive_days: consecutiveDays,
      updated_at: now.toISOString()
    };

    setUserCurrency(updatedCurrency);

    if (isOfflineMode(forceOffline)) {
      localStorage.setItem('offline_wool_coins', updatedCurrency.wool_coins.toString());
      localStorage.setItem('offline_last_daily_claim', updatedCurrency.last_daily_claim);
      localStorage.setItem('offline_consecutive_days', updatedCurrency.consecutive_days.toString());
    } else {
      try {
        await supabase
          .from('user_currency')
          .update({
            wool_coins: updatedCurrency.wool_coins,
            last_daily_claim: updatedCurrency.last_daily_claim,
            consecutive_days: updatedCurrency.consecutive_days,
            updated_at: updatedCurrency.updated_at
          })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to update daily reward:', error);
      }
    }
  }, [user, userCurrency, forceOffline]);

  const purchaseTheme = useCallback(async (themeId: string): Promise<boolean> => {
    if (!user || !userCurrency) return false;

    const theme = THEMES.find(t => t.id === themeId);
    if (!theme || userCurrency.wool_coins < theme.cost || userCurrency.unlocked_themes.includes(themeId)) {
      return false;
    }

    audioManager.playTierUpSound();

    const updatedCurrency: UserCurrency = {
      ...userCurrency,
      wool_coins: userCurrency.wool_coins - theme.cost,
      unlocked_themes: [...userCurrency.unlocked_themes, themeId],
      selected_theme: themeId,
      updated_at: new Date().toISOString()
    };

    setUserCurrency(updatedCurrency);

    if (isOfflineMode(forceOffline)) {
      localStorage.setItem('offline_wool_coins', updatedCurrency.wool_coins.toString());
      localStorage.setItem('offline_unlocked_themes', JSON.stringify(updatedCurrency.unlocked_themes));
      localStorage.setItem('offline_selected_theme', updatedCurrency.selected_theme);
    } else {
      try {
        await supabase
          .from('user_currency')
          .update({
            wool_coins: updatedCurrency.wool_coins,
            unlocked_themes: updatedCurrency.unlocked_themes,
            selected_theme: updatedCurrency.selected_theme,
            updated_at: updatedCurrency.updated_at
          })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to purchase theme:', error);
        return false;
      }
    }

    return true;
  }, [user, userCurrency, forceOffline]);

  const selectTheme = useCallback(async (themeId: string): Promise<void> => {
    if (!user || !userCurrency || !userCurrency.unlocked_themes.includes(themeId)) return;

    audioManager.playGuiSound();

    const updatedCurrency: UserCurrency = {
      ...userCurrency,
      selected_theme: themeId,
      updated_at: new Date().toISOString()
    };

    setUserCurrency(updatedCurrency);

    if (isOfflineMode(forceOffline)) {
      localStorage.setItem('offline_selected_theme', themeId);
    } else {
      try {
        await supabase
          .from('user_currency')
          .update({
            selected_theme: themeId,
            updated_at: updatedCurrency.updated_at
          })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to select theme:', error);
      }
    }
  }, [user, userCurrency, forceOffline]);

  const initializeUser = async (): Promise<User> => {
    if (isOfflineMode(forceOffline)) {
      // Return mock user for offline mode
      const mockUser: User = {
        id: 'offline-user',
        nickname: `Sheep${Math.floor(Math.random() * 1000)}`,
        total_clicks: 0,
        tier: 0,
        created_at: new Date().toISOString()
      };
      return mockUser;
    }

    let userId = localStorage.getItem('sheep_user_id');
    
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (data && !error) {
          return data;
        }
      } catch (err) {
        // Check if it's a table not found error
        if (err instanceof Error && err.message.includes('Could not find the table')) {
          console.warn('Database tables not found, switching to offline mode');
          setForceOffline(true);
          const mockUser: User = {
            id: 'offline-user',
            nickname: `Sheep${Math.floor(Math.random() * 1000)}`,
            total_clicks: parseInt(localStorage.getItem('offline_user_clicks') || '0'),
            tier: Math.floor(parseInt(localStorage.getItem('offline_user_clicks') || '0') / 10) + 1,
            created_at: new Date().toISOString()
          };
          return mockUser;
        }
        console.warn('Failed to fetch existing user, creating new one');
      }
    }

    // Create new user
    const newUser: User = {
      id: crypto.randomUUID(),
      nickname: `Sheep${Math.floor(Math.random() * 1000)}`,
      total_clicks: 0,
      tier: 0,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('users')
        .insert([newUser]);

      if (error) {
        throw new Error(`Failed to create user: ${error.message}`);
      }
    } catch (err) {
      // Check if it's a table not found error
      if (err instanceof Error && err.message.includes('Could not find the table')) {
        console.warn('Database tables not found, switching to offline mode');
        setForceOffline(true);
      } else {
        console.warn('Failed to save user to database, using local storage only');
      }
    }

    localStorage.setItem('sheep_user_id', newUser.id);
    return newUser;
  };

  const fetchGlobalStats = async (): Promise<GlobalStats> => {
    if (isOfflineMode(forceOffline)) {
      // Return mock stats for offline mode
      return {
        id: 'global',
        total_sheep: parseInt(localStorage.getItem('offline_total_sheep') || '0'),
        updated_at: new Date().toISOString()
      };
    }

    try {
      const { data, error } = await supabase
        .from('global_stats')
        .select('*')
        .maybeSingle();

      if (error || !data) {
        // Initialize global stats if they don't exist
        const initialStats: GlobalStats = {
          id: 'global',
          total_sheep: 0,
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('global_stats')
          .insert([initialStats]);

        if (insertError) {
          throw new Error(`Failed to initialize global stats: ${insertError.message}`);
        }

        return initialStats;
      }

      return data;
    } catch (err) {
      // Check if it's a table not found error
      if (err instanceof Error && err.message.includes('Could not find the table')) {
        console.warn('Database tables not found, switching to offline mode');
        setForceOffline(true);
      } else {
        console.warn('Failed to fetch global stats, using offline mode');
      }
      return {
        id: 'global',
        total_sheep: parseInt(localStorage.getItem('offline_total_sheep') || '0'),
        updated_at: new Date().toISOString()
      };
    }
  };

  const fetchChatMessages = async (): Promise<ChatMessage[]> => {
    if (isOfflineMode(forceOffline)) {
      // Return empty array for offline mode
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(`Failed to fetch chat messages: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      // Check if it's a table not found error
      if (err instanceof Error && err.message.includes('Could not find the table')) {
        console.warn('Database tables not found, switching to offline mode');
        setForceOffline(true);
      } else {
        console.warn('Failed to fetch chat messages, using offline mode');
      }
      return [];
    }
  };

  const initializeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [userData, statsData, messagesData] = await Promise.all([
        initializeUser(),
        fetchGlobalStats(),
        fetchChatMessages()
      ]);
      
      setUser(userData);
      setGlobalStats(statsData);
      setChatMessages(messagesData);
      
      // Fetch user currency after user is initialized
      const currencyData = await fetchUserCurrency(userData.id);
      setUserCurrency(currencyData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize data';
      console.error('Initialization error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Batch update function to handle multiple clicks efficiently
  const batchUpdateDatabase = useCallback(async (clicksToAdd: number, newUserState: User) => {
    if (isOfflineMode(forceOffline) || clicksToAdd === 0) return;

    try {
      // Update user stats and global stats in parallel
      const [userResult, globalResult] = await Promise.all([
        supabase
          .from('users')
          .update({ 
            total_clicks: newUserState.total_clicks, 
            tier: newUserState.tier 
          })
          .eq('id', newUserState.id),
        
        supabase.rpc('increment_global_sheep', { increment_by: clicksToAdd })
      ]);

      if (userResult.error) {
        console.error('Failed to update user stats:', userResult.error);
      }
      if (globalResult.error) {
        console.error('Failed to update global stats:', globalResult.error);
      }
    } catch (error) {
      console.error('Failed to batch update database:', error);
    }
  }, [forceOffline]);

  const incrementSheep = useCallback(async () => {
    if (!user || !userCurrency) return;

    // Play click sound immediately for responsive feedback
    audioManager.playClickSound();

    // Update local state immediately for responsive UI
    const newClickCount = user.total_clicks + 1;
    const newTier = calculateTier(newClickCount);
    const previousTier = user.tier;
    const updatedUser = { ...user, total_clicks: newClickCount, tier: newTier };
    const updatedStats = { ...globalStats, total_sheep: globalStats.total_sheep + 1 };
    
    setUser(updatedUser);
    setGlobalStats(updatedStats);
    
    // Award wool coins every 10 clicks for Shepherd tier and above
    if (newTier >= 1 && newClickCount % 100 === 0) {
      const coinsToAward = Math.max(1, Math.floor(newTier / 2)); // More coins for higher tiers
      const updatedCurrency = {
        ...userCurrency,
        wool_coins: userCurrency.wool_coins + coinsToAward,
        updated_at: new Date().toISOString()
      };
      setUserCurrency(updatedCurrency);
      
      if (isOfflineMode(forceOffline)) {
        localStorage.setItem('offline_wool_coins', updatedCurrency.wool_coins.toString());
      } else {
        try {
          await supabase
            .from('user_currency')
            .update({
              wool_coins: updatedCurrency.wool_coins,
              updated_at: updatedCurrency.updated_at
            })
            .eq('user_id', user.id);
        } catch (error) {
          console.error('Failed to update wool coins:', error);
        }
      }
    }
    
    // Play tier up sound if tier increased
    if (newTier > previousTier) {
      setTimeout(() => audioManager.playTierUpSound(), 100);
    }
    
    // Track pending clicks for batching
    setPendingClicks(prev => prev + 1);

    if (isOfflineMode(forceOffline)) {
      // Store in localStorage for offline mode
      localStorage.setItem('offline_total_sheep', updatedStats.total_sheep.toString());
      localStorage.setItem('offline_user_clicks', newClickCount.toString());
    } else {
      // Clear existing timeout and set a new one for batching
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      const newTimeout = setTimeout(async () => {
        const clicksToUpdate = pendingClicks + 1; // Include current click
        setPendingClicks(0);
        await batchUpdateDatabase(clicksToUpdate, updatedUser);
      }, 300); // Batch updates every 300ms
      
      setUpdateTimeout(newTimeout);
    }
  }, [user, userCurrency, globalStats, pendingClicks, updateTimeout, batchUpdateDatabase, forceOffline]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [updateTimeout]);

  const updateTier = useCallback(async (newTier: number) => {
    if (!user) return;

    // Check if user has unlocked this tier
    const tierInfo = TIERS.find(t => t.level === newTier);
    if (!tierInfo || user.total_clicks < tierInfo.requirement) return;

    const updatedUser = { ...user, tier: newTier };
    setUser(updatedUser);

    if (!isOfflineMode(forceOffline)) {
      try {
        await supabase
          .from('users')
          .update({ tier: newTier })
          .eq('id', user.id);
      } catch (error) {
        console.error('Failed to update tier:', error);
      }
    }
  }, [user, forceOffline]);
  const sendMessage = useCallback(async (message: string) => {
    if (!user || !message.trim()) return;

    if (isOfflineMode(forceOffline)) {
      console.warn('Chat is not available in offline mode');
      return;
    }

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      nickname: user.nickname,
      message: message.trim(),
      tier: user.tier,
      created_at: new Date().toISOString()
    };

    try {
      await supabase
        .from('chat_messages')
        .insert([newMessage]);
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [user]);

  const updateNickname = useCallback(async (newNickname: string) => {
    if (!user || !newNickname.trim()) return;

    const updatedUser = { ...user, nickname: newNickname.trim() };
    setUser(updatedUser);

    if (!isOfflineMode(forceOffline)) {
      try {
        await supabase
          .from('users')
          .update({ nickname: newNickname.trim() })
          .eq('id', user.id);
      } catch (error) {
        console.error('Failed to update nickname:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (isOfflineMode(forceOffline)) {
      return;
    }

    // Set up real-time subscriptions
    const statsSubscription = supabase
      .channel('global_stats')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'global_stats'
      }, (payload) => {
        setGlobalStats(payload.new as GlobalStats);
      })
      .subscribe();

    const chatSubscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        // Play gentle notification sound for new messages (but not from current user)
        const newMessage = payload.new as ChatMessage;
        if (user && newMessage.user_id !== user.id) {
          audioManager.playNotificationSound();
        }
        setChatMessages(prev => [payload.new as ChatMessage, ...prev.slice(0, 49)]);
      })
      .subscribe();

    return () => {
      statsSubscription.unsubscribe();
      chatSubscription.unsubscribe();
    };
  }, [forceOffline, user]);

  return {
    user,
    userCurrency,
    globalStats,
    chatMessages,
    isOffline: isOfflineMode(forceOffline),
    loading,
    error,
    incrementSheep,
    claimDailyReward,
    purchaseTheme,
    selectTheme,
    sendMessage,
    updateNickname,
    updateTier
  };
};