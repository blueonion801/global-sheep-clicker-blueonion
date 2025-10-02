import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, ChatMessage, GlobalStats, UserCurrency, UserStats } from '../types/game';
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
  const [userStats, setUserStats] = useState<UserStats | null>(null);
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
        sheep_gems: parseInt(localStorage.getItem('offline_sheep_gems') || '0'),
        last_daily_claim: localStorage.getItem('offline_last_daily_claim'),
        last_gem_claim: localStorage.getItem('offline_last_gem_claim'),
        consecutive_days: parseInt(localStorage.getItem('offline_consecutive_days') || '0'),
        selected_theme: localStorage.getItem('offline_selected_theme') || 'cosmic',
        unlocked_themes: JSON.parse(localStorage.getItem('offline_unlocked_themes') || '["cosmic"]'),
        selected_sheep_emoji: localStorage.getItem('offline_selected_sheep_emoji') || '🐑',
        selected_particle: localStorage.getItem('offline_selected_particle') || '✧',
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
          last_daily_box_claim: null,
          consecutive_days: 0,
          selected_theme: 'cosmic',
          unlocked_themes: ['cosmic'],
          updated_at: new Date().toISOString()
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('user_currency')
          .insert([initialCurrency])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return insertedData || initialCurrency;
      }

      return data;
    } catch (err) {
      console.warn('Failed to fetch user currency, using offline mode');
      return {
        user_id: userId,
        wool_coins: parseInt(localStorage.getItem('offline_wool_coins') || '0'),
        sheep_gems: parseInt(localStorage.getItem('offline_sheep_gems') || '0'),
        last_daily_claim: localStorage.getItem('offline_last_daily_claim'),
        last_gem_claim: localStorage.getItem('offline_last_gem_claim'),
        consecutive_days: parseInt(localStorage.getItem('offline_consecutive_days') || '0'),
        selected_theme: localStorage.getItem('offline_selected_theme') || 'cosmic',
        unlocked_themes: JSON.parse(localStorage.getItem('offline_unlocked_themes') || '["cosmic"]'),
        selected_sheep_emoji: localStorage.getItem('offline_selected_sheep_emoji') || '🐑',
        selected_particle: localStorage.getItem('offline_selected_particle') || '✧',
        updated_at: new Date().toISOString()
      };
    }
  };

  const fetchUserStats = async (userId: string): Promise<UserStats | null> => {
    if (isOfflineMode(forceOffline)) {
      // Return mock stats for offline mode
      return {
        user_id: userId,
        messages_sent: parseInt(localStorage.getItem('offline_messages_sent') || '0'),
        highest_daily_clicks: parseInt(localStorage.getItem('offline_highest_daily_clicks') || '0'),
        longest_coin_streak: parseInt(localStorage.getItem('offline_longest_coin_streak') || '0'),
        total_days_active: parseInt(localStorage.getItem('offline_total_days_active') || '1'),
        first_click_date: new Date().toISOString().split('T')[0], // Start from today for new feature
        last_active_date: new Date().toISOString().split('T')[0],
        daily_click_history: {}, // Start fresh for new feature
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    try {
      // First, get existing message count from chat_messages table
      const { count: existingMessageCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && !error.message.includes('Could not find')) {
        throw error;
      }

      if (!data) {
        // Create initial stats record
        const today = new Date().toISOString().split('T')[0];
        const initialStats: UserStats = {
          user_id: userId,
          messages_sent: existingMessageCount || 0, // Include existing messages
          highest_daily_clicks: 0,
          longest_coin_streak: 0,
          total_days_active: 1,
          first_click_date: today, // Start tracking from today
          last_active_date: today,
          daily_click_history: {}, // Start fresh for accurate daily averages
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('user_stats')
          .insert([initialStats])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return insertedData || initialStats;
      }

      return data;
    } catch (err) {
      console.warn('Failed to fetch user stats, using offline mode');
      return {
        user_id: userId,
        messages_sent: parseInt(localStorage.getItem('offline_messages_sent') || '0'),
        highest_daily_clicks: parseInt(localStorage.getItem('offline_highest_daily_clicks') || '0'),
        longest_coin_streak: parseInt(localStorage.getItem('offline_longest_coin_streak') || '0'),
        total_days_active: parseInt(localStorage.getItem('offline_total_days_active') || '1'),
        first_click_date: new Date().toISOString().split('T')[0],
        last_active_date: new Date().toISOString().split('T')[0],
        daily_click_history: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  };

  const claimDailyReward = useCallback(async (): Promise<void> => {
    if (!user || !userCurrency || !userStats) return;

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

    // Update longest streak if current is higher
    const updatedStats: UserStats = {
      ...userStats,
      longest_coin_streak: Math.max(userStats.longest_coin_streak, consecutiveDays),
      updated_at: now.toISOString()
    };

    setUserCurrency(updatedCurrency);
    setUserStats(updatedStats);

    if (isOfflineMode(forceOffline)) {
      localStorage.setItem('offline_wool_coins', updatedCurrency.wool_coins.toString());
      localStorage.setItem('offline_last_daily_claim', updatedCurrency.last_daily_claim);
      localStorage.setItem('offline_consecutive_days', updatedCurrency.consecutive_days.toString());
      localStorage.setItem('offline_longest_coin_streak', updatedStats.longest_coin_streak.toString());
    } else {
      try {
        await Promise.all([
          supabase
            .from('user_currency')
            .update({
              wool_coins: updatedCurrency.wool_coins,
              last_daily_claim: updatedCurrency.last_daily_claim,
              consecutive_days: updatedCurrency.consecutive_days,
              updated_at: updatedCurrency.updated_at
            })
            .eq('user_id', user.id),
          supabase
            .from('user_stats')
            .update({
              longest_coin_streak: updatedStats.longest_coin_streak,
              updated_at: updatedStats.updated_at
            })
            .eq('user_id', user.id)
        ]);
      } catch (error) {
        console.error('Failed to update daily reward:', error);
      }
    }
  }, [user, userCurrency, userStats, forceOffline]);

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

  const claimDailyGems = useCallback(async (): Promise<void> => {
    if (!user || !userCurrency) return;

    audioManager.playGuiSound();

    const now = new Date();
    const today = now.toDateString();
    const lastClaim = userCurrency.last_gem_claim ? new Date(userCurrency.last_gem_claim).toDateString() : null;

    // Check if already claimed today
    if (lastClaim === today) return;

    const updatedCurrency: UserCurrency = {
      ...userCurrency,
      sheep_gems: userCurrency.sheep_gems + 1,
      last_gem_claim: now.toISOString(),
      updated_at: now.toISOString()
    };

    setUserCurrency(updatedCurrency);

    if (isOfflineMode(forceOffline)) {
      localStorage.setItem('offline_sheep_gems', updatedCurrency.sheep_gems.toString());
      localStorage.setItem('offline_last_gem_claim', updatedCurrency.last_gem_claim);
    } else {
      try {
        await supabase
          .from('user_currency')
          .update({
            sheep_gems: updatedCurrency.sheep_gems,
            last_gem_claim: updatedCurrency.last_gem_claim,
            updated_at: updatedCurrency.updated_at
          })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to claim daily gems:', error);
      }
    }
  }, [user, userCurrency, forceOffline]);

  const openEmbroideredBox = useCallback(async (boxType: 'daily' | 'purchased'): Promise<any> => {
    if (!user || !userCurrency) return null;

    // Check if user can open the box
    if (boxType === 'purchased' && userCurrency.sheep_gems < 40) {
      return null;
    }
    
    // Check if daily box was already claimed today
    if (boxType === 'daily') {
      const today = new Date().toDateString();
      const lastClaim = userCurrency.last_daily_claim ? new Date(userCurrency.last_daily_claim).toDateString() : null;
      if (lastClaim === today) {
        return null; // Already claimed today
      }
    }

    audioManager.playTierUpSound();

    // Generate rewards (2 for daily box, 1 for purchased box)
    const numRewards = boxType === 'daily' ? 2 : 1;
    const rewards = [];
    
    for (let i = 0; i < numRewards; i++) {
      const rand = Math.random();
      let reward: any;

      if (boxType === 'daily') {
        // Daily box chances: 55% coins, 35% gems, 10% collectible
        if (rand < 0.55) {
          // 55% chance for coins
          const amount = Math.floor(Math.random() * 21) + 10; // 10-30 coins
          reward = {
            type: 'coins',
            amount: amount
          };
        } else if (rand < 0.9) {
          // 35% chance for gems
          const amount = Math.floor(Math.random() * 7) + 2; // 2-8 gems
          reward = {
            type: 'gems',
            amount: amount
          };
        } else {
          // 10% chance for collectible (7% normal, 2% epic, 1% legendary)
          const collectibleRand = Math.random();
          let targetRarity: string;
          
          if (collectibleRand < 0.7) {
            targetRarity = 'normal'; // 7% of total (70% of 10%)
          } else if (collectibleRand < 0.9) {
            targetRarity = 'epic'; // 2% of total (20% of 10%)
          } else {
            targetRarity = 'legendary'; // 1% of total (10% of 10%)
          }
          
          const collectible = await generateRandomCollectible(targetRarity);
          if (collectible) {
            reward = {
              type: 'collectible',
              collectible: collectible
            };
            
            // Add to user collectibles if not already owned
            try {
              await supabase
                .from('user_collectibles')
                .insert([{
                  user_id: user.id,
                  collectible_id: collectible.id,
                  obtained_from: 'box'
                }]);
            } catch (error) {
              // Ignore duplicate key errors (already owned)
              if (!error.message?.includes('duplicate key')) {
                console.error('Failed to add collectible to user:', error);
              }
            }
          } else {
            // Fallback to gems if no collectible available
            const amount = Math.floor(Math.random() * 7) + 2;
            reward = {
              type: 'gems',
              amount: amount
            };
          }
        }
      } else {
        // Premium box chances: 20% coins, 25% gems, 55% collectible
        if (rand < 0.2) {
          // 20% chance for coins
          const amount = Math.floor(Math.random() * 21) + 20; // 20-40 coins
          reward = {
            type: 'coins',
            amount: amount
          };
        } else if (rand < 0.45) {
          // 25% chance for gems
          const amount = Math.floor(Math.random() * 11) + 5; // 5-15 gems
          reward = {
            type: 'gems',
            amount: amount
          };
        } else {
          // 55% chance for collectible (35% normal, 15% epic, 5% legendary)
          const collectibleRand = Math.random();
          let targetRarity: string;
          
          if (collectibleRand < 0.636) {
            targetRarity = 'normal'; // 35% of total (63.6% of 55%)
          } else if (collectibleRand < 0.909) {
            targetRarity = 'epic'; // 15% of total (27.3% of 55%)
          } else {
            targetRarity = 'legendary'; // 5% of total (9.1% of 55%)
          }
          
          const collectible = await generateRandomCollectible(targetRarity);
          if (collectible) {
            reward = {
              type: 'collectible',
              collectible: collectible
            };
            
            // Add to user collectibles if not already owned
            try {
              await supabase
                .from('user_collectibles')
                .insert([{
                  user_id: user.id,
                  collectible_id: collectible.id,
                  obtained_from: 'box'
                }]);
            } catch (error) {
              // Ignore duplicate key errors (already owned)
              if (!error.message?.includes('duplicate key')) {
                console.error('Failed to add collectible to user:', error);
              }
            }
          } else {
            // Fallback to gems if no collectible available
            const amount = Math.floor(Math.random() * 11) + 5;
            reward = {
              type: 'gems',
              amount: amount
            };
          }
        }
      }
      
      rewards.push(reward);
    }

    // Update currency based on reward and box cost
    let updatedCurrency = { ...userCurrency };
    
    // Update last daily claim for daily boxes
    if (boxType === 'daily') {
      updatedCurrency.last_daily_claim = new Date().toISOString();
    }
    
    if (boxType === 'purchased') {
      updatedCurrency.sheep_gems -= 40;
    }

    // Apply all rewards
    for (const reward of rewards) {
      if (reward.type === 'coins') {
        updatedCurrency.wool_coins += reward.amount;
      } else if (reward.type === 'gems') {
        updatedCurrency.sheep_gems += reward.amount;
      }
    }

    updatedCurrency.updated_at = new Date().toISOString();
    setUserCurrency(updatedCurrency);

    if (isOfflineMode(forceOffline)) {
      localStorage.setItem('offline_wool_coins', updatedCurrency.wool_coins.toString());
      localStorage.setItem('offline_sheep_gems', updatedCurrency.sheep_gems.toString());
      if (boxType === 'daily') {
        localStorage.setItem('offline_last_daily_claim', updatedCurrency.last_daily_claim);
      }
    } else {
      try {
        await supabase
          .from('user_currency')
          .update({
            wool_coins: updatedCurrency.wool_coins,
            sheep_gems: updatedCurrency.sheep_gems,
            ...(boxType === 'daily' ? { last_daily_claim: updatedCurrency.last_daily_claim } : {}),
            updated_at: updatedCurrency.updated_at
          })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to open embroidered box:', error);
      }
    }

    return { rewards, totalRewards: numRewards };
  }, [user, userCurrency, forceOffline]);

  const generateRandomCollectible = async (targetRarity?: string): Promise<any | null> => {
    if (isOfflineMode(forceOffline)) {
      // Return a mock collectible for offline mode
      const mockCollectibles = [
        { id: 'sheep_chick', name: 'Chick', emoji: '🐤', type: 'sheep_emoji', rarity: 'normal' },
        { id: 'sheep_pig', name: 'Pig', emoji: '🐷', type: 'sheep_emoji', rarity: 'normal' },
        { id: 'particle_sparkle', name: 'Sparkle', emoji: '✨', type: 'particle', rarity: 'epic' },
        { id: 'particle_heart', name: 'Heart', emoji: '💖', type: 'particle', rarity: 'epic' }
      ];
      
      if (targetRarity) {
        const filtered = mockCollectibles.filter(c => c.rarity === targetRarity);
        return filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : mockCollectibles[Math.floor(Math.random() * mockCollectibles.length)];
      }
      return mockCollectibles[Math.floor(Math.random() * mockCollectibles.length)];
    }

    try {
      // Get all collectibles that can be obtained from boxes
      const { data: allCollectibles, error } = await supabase
        .from('collectibles')
        .select('*');

      if (error || !allCollectibles || allCollectibles.length === 0) {
        return null;
      }

      // Use provided target rarity or default distribution
      let finalRarity = targetRarity;
      if (!finalRarity) {
        const rarityRand = Math.random();
        if (rarityRand < 0.6) {
          finalRarity = 'normal';
        } else if (rarityRand < 0.9) {
          finalRarity = 'epic';
        } else {
          finalRarity = 'legendary';
        }
      }

      // Get collectibles of target rarity
      const rarityCollectibles = allCollectibles.filter(c => c.rarity === finalRarity);
      
      // If no collectibles of target rarity, fall back to normal
      const availableCollectibles = rarityCollectibles.length > 0 
        ? rarityCollectibles 
        : allCollectibles.filter(c => c.rarity === 'normal');

      if (availableCollectibles.length === 0) {
        return null;
      }

      // Return random collectible from available ones
      return availableCollectibles[Math.floor(Math.random() * availableCollectibles.length)];
    } catch (error) {
      console.error('Failed to generate random collectible:', error);
      return null;
    }
  };

  const purchaseCollectible = useCallback(async (collectibleId: string): Promise<boolean> => {
    if (!user || !userCurrency) return false;

    if (isOfflineMode(forceOffline)) {
      // In offline mode, just return true for free items
      audioManager.playGuiSound();
      return true;
    }

    try {
      // Fetch collectible data
      const { data: collectible, error: fetchError } = await supabase
        .from('collectibles')
        .select('*')
        .eq('id', collectibleId)
        .single();

      if (fetchError || !collectible) {
        console.error('Failed to fetch collectible:', fetchError);
        return false;
      }

      // Check if user can afford it
      if (userCurrency.sheep_gems < collectible.gem_cost) {
        return false;
      }

      // Check if user already owns it
      const { data: existingOwnership } = await supabase
        .from('user_collectibles')
        .select('*')
        .eq('user_id', user.id)
        .eq('collectible_id', collectibleId)
        .maybeSingle();

      if (existingOwnership) {
        return false; // Already owned
      }

      // For free collectibles, just add them without cost
      if (collectible.gem_cost === 0) {
        await supabase
          .from('user_collectibles')
          .insert([{
            user_id: user.id,
            collectible_id: collectibleId,
            obtained_from: 'free'
          }]);

        audioManager.playTierUpSound();
        return true;
      }

      // Deduct gems if not free
      if (collectible.gem_cost > 0) {
        const updatedCurrency: UserCurrency = {
          ...userCurrency,
          sheep_gems: userCurrency.sheep_gems - collectible.gem_cost,
          updated_at: new Date().toISOString()
        };
        setUserCurrency(updatedCurrency);

        await supabase
          .from('user_currency')
          .update({
            sheep_gems: updatedCurrency.sheep_gems,
            updated_at: updatedCurrency.updated_at
          })
          .eq('user_id', user.id);
      }

      // Add to user collectibles
      await supabase
        .from('user_collectibles')
        .insert([{
          user_id: user.id,
          collectible_id: collectibleId,
          obtained_from: collectible.gem_cost === 0 ? 'free' : 'purchase'
        }]);

      audioManager.playTierUpSound();
      return true;
    } catch (error) {
      console.error('Failed to purchase collectible:', error);
      return false;
    }
  }, [user, userCurrency]);

  const selectCollectible = useCallback(async (collectibleId: string, type: 'sheep_emoji' | 'particle'): Promise<void> => {
    if (!user || !userCurrency) return;

    // Get the collectible to find its emoji
    let collectibleEmoji = collectibleId;
    if (!isOfflineMode(forceOffline)) {
      try {
        const { data: collectible, error } = await supabase
          .from('collectibles')
          .select('emoji')
          .eq('id', collectibleId)
          .single();

        if (collectible && !error) {
          collectibleEmoji = collectible.emoji;
        }
      } catch (error) {
        console.error('Failed to fetch collectible emoji:', error);
      }
    } else {
      // In offline mode, map common IDs to emojis
      const offlineEmojiMap: Record<string, string> = {
        'sheep_sheep': '🐑',
        'sheep_chick': '🐤',
        'sheep_pig': '🐷',
        'sheep_cow': '🐄',
        'particle_star': '✧',
        'particle_sparkle': '✨',
        'particle_heart': '💖',
        'particle_diamond': '💎'
      };
      collectibleEmoji = offlineEmojiMap[collectibleId] || collectibleId;
    }

    audioManager.playGuiSound();

    const updatedCurrency: UserCurrency = {
      ...userCurrency,
      ...(type === 'sheep_emoji' ? { selected_sheep_emoji: collectibleEmoji } : { selected_particle: collectibleEmoji }),
      updated_at: new Date().toISOString()
    };

    setUserCurrency(updatedCurrency);

    if (isOfflineMode(forceOffline)) {
      if (type === 'sheep_emoji') {
        localStorage.setItem('offline_selected_sheep_emoji', collectibleEmoji);
      } else {
        localStorage.setItem('offline_selected_particle', collectibleEmoji);
      }
    } else {
      try {
        await supabase
          .from('user_currency')
          .update({
            ...(type === 'sheep_emoji' ? { selected_sheep_emoji: collectibleEmoji } : { selected_particle: collectibleEmoji }),
            updated_at: updatedCurrency.updated_at
          })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to select collectible:', error);
      }
    }
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
      
      // Fetch user currency and stats after user is initialized
      const [currencyData, userStatsData] = await Promise.all([
        fetchUserCurrency(userData.id),
        fetchUserStats(userData.id)
      ]);
      setUserCurrency(currencyData);
      setUserStats(userStatsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize data';
      console.error('Initialization error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Batch update function to handle multiple clicks efficiently
  const batchUpdateDatabase = useCallback(async (clicksToAdd: number, newUserState: User, newUserStats?: UserStats) => {
    if (isOfflineMode(forceOffline) || clicksToAdd === 0) return;

    try {
      // Update user stats, user stats, and global stats in parallel
      const promises = [
        supabase
          .from('users')
          .update({ 
            total_clicks: newUserState.total_clicks, 
            tier: newUserState.tier 
          })
          .eq('id', newUserState.id),
        
        supabase.rpc('increment_global_sheep', { increment_by: clicksToAdd })
      ];

      if (newUserStats) {
        promises.push(
          supabase
            .from('user_stats')
            .update({
              highest_daily_clicks: newUserStats.highest_daily_clicks,
              last_active_date: newUserStats.last_active_date,
              daily_click_history: newUserStats.daily_click_history,
              total_days_active: newUserStats.total_days_active,
              updated_at: newUserStats.updated_at
            })
            .eq('user_id', newUserState.id)
        );
      }

      const results = await Promise.all(promises);

      if (results[0].error) {
        console.error('Failed to update user stats:', results[0].error);
      }
      if (results[1].error) {
        console.error('Failed to update global stats:', results[1].error);
      }
      if (results[2]?.error) {
        console.error('Failed to update user stats:', results[2].error);
      }
    } catch (error) {
      console.error('Failed to batch update database:', error);
    }
  }, [forceOffline]);

  const incrementSheep = useCallback(async () => {
    if (!user || !userCurrency || !userStats) return;

    // Play click sound immediately for responsive feedback
    audioManager.playClickSound();

    // Update local state immediately for responsive UI
    const newClickCount = user.total_clicks + 1;
    const newTier = calculateTier(newClickCount);
    const previousTier = user.tier;
    const updatedUser = { ...user, total_clicks: newClickCount, tier: newTier };
    const updatedStats = { ...globalStats, total_sheep: globalStats.total_sheep + 1 };
    
    // Update user stats for daily tracking
    const today = new Date().toISOString().split('T')[0];
    const todayClicks = (userStats.daily_click_history[today] || 0) + 1;
    const updatedUserStats: UserStats = {
      ...userStats,
      highest_daily_clicks: Math.max(userStats.highest_daily_clicks, todayClicks),
      last_active_date: today,
      daily_click_history: {
        ...userStats.daily_click_history,
        [today]: todayClicks
      },
      total_days_active: Object.keys({
        ...userStats.daily_click_history,
        [today]: todayClicks
      }).length,
      updated_at: new Date().toISOString()
    };
    
    setUser(updatedUser);
    setGlobalStats(updatedStats);
    setUserStats(updatedUserStats);
    
    // Auto-award sheep gems every 500 clicks for tier 5+ users
    let updatedCurrency = userCurrency;
    if (newTier >= 5 && newClickCount % 500 === 0) {
      const gemsToAward = 1;
      updatedCurrency = {
        ...userCurrency,
        sheep_gems: userCurrency.sheep_gems + gemsToAward,
        updated_at: new Date().toISOString()
      };
      setUserCurrency(updatedCurrency);
      
      if (isOfflineMode(forceOffline)) {
        localStorage.setItem('offline_sheep_gems', updatedCurrency.sheep_gems.toString());
      } else {
        try {
          await supabase
            .from('user_currency')
            .update({
              sheep_gems: updatedCurrency.sheep_gems,
              updated_at: updatedCurrency.updated_at
            })
            .eq('user_id', user.id);
        } catch (error) {
          console.error('Failed to update sheep gems:', error);
        }
      }
    }
    
    // Award wool coins every 10 clicks for Shepherd tier and above
    if (newTier >= 1 && newClickCount % 100 === 0) {
      const coinsToAward = Math.max(1, Math.floor(newTier / 2)); // More coins for higher tiers
      updatedCurrency = {
        ...updatedCurrency,
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
      localStorage.setItem('offline_highest_daily_clicks', updatedUserStats.highest_daily_clicks.toString());
      localStorage.setItem('offline_daily_click_history', JSON.stringify(updatedUserStats.daily_click_history));
      localStorage.setItem('offline_total_days_active', updatedUserStats.total_days_active.toString());
    } else {
      // Clear existing timeout and set a new one for batching
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      const newTimeout = setTimeout(async () => {
        const clicksToUpdate = pendingClicks + 1; // Include current click
        setPendingClicks(0);
        await batchUpdateDatabase(clicksToUpdate, updatedUser, updatedUserStats);
      }, 300); // Batch updates every 300ms
      
      setUpdateTimeout(newTimeout);
    }
  }, [user, userCurrency, userStats, globalStats, pendingClicks, updateTimeout, batchUpdateDatabase, forceOffline]);

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
    if (!user || !userStats || !message.trim()) return;

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

    // Update message count in user stats
    const updatedUserStats: UserStats = {
      ...userStats,
      messages_sent: userStats.messages_sent + 1,
      updated_at: new Date().toISOString()
    };
    setUserStats(updatedUserStats);

    try {
      await Promise.all([
        supabase
          .from('chat_messages')
          .insert([newMessage]),
        supabase
          .from('user_stats')
          .update({
            messages_sent: updatedUserStats.messages_sent,
            updated_at: updatedUserStats.updated_at
          })
          .eq('user_id', user.id)
      ]);
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [user, userStats]);

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

    //
    // Set up real-time subscriptions for chat messages
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        setChatMessages(prev => [newMessage, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [forceOffline]);

  return {
    user,
    userCurrency,
    userStats,
    globalStats,
    chatMessages,
    loading,
    error,
    incrementSheep,
    updateTier,
    sendMessage,
    updateNickname,
    claimDailyReward,
    purchaseTheme,
    selectTheme,
    claimDailyGems,
    openEmbroideredBox,
    purchaseCollectible,
    selectCollectible
  };
};