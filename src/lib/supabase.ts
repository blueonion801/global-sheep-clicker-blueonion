import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nickname: string;
          total_clicks: number;
          tier: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nickname: string;
          total_clicks?: number;
          tier?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          total_clicks?: number;
          tier?: number;
          created_at?: string;
        };
      };
      global_stats: {
        Row: {
          id: string;
          total_sheep: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          total_sheep?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          total_sheep?: number;
          updated_at?: string;
        };
      };
      user_currency: {
        Row: {
          user_id: string;
          wool_coins: number;
          sheep_gems: number;
          last_daily_claim: string | null;
          last_gem_claim: string | null;
          consecutive_days: number;
          selected_theme: string;
          unlocked_themes: string[];
          selected_sheep_emoji: string;
          selected_particle: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          wool_coins?: number;
          sheep_gems?: number;
          last_daily_claim?: string | null;
          last_gem_claim?: string | null;
          consecutive_days?: number;
          selected_theme?: string;
          unlocked_themes?: string[];
          selected_sheep_emoji?: string;
          selected_particle?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          wool_coins?: number;
          sheep_gems?: number;
          last_daily_claim?: string | null;
          last_gem_claim?: string | null;
          consecutive_days?: number;
          selected_theme?: string;
          unlocked_themes?: string[];
          selected_sheep_emoji?: string;
          selected_particle?: string;
          updated_at?: string;
        };
      };
      user_stats: {
        Row: {
          user_id: string;
          messages_sent: number;
          highest_daily_clicks: number;
          longest_coin_streak: number;
          total_days_active: number;
          first_click_date: string | null;
          last_active_date: string | null;
          daily_click_history: Record<string, number>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          messages_sent?: number;
          highest_daily_clicks?: number;
          longest_coin_streak?: number;
          total_days_active?: number;
          first_click_date?: string | null;
          last_active_date?: string | null;
          daily_click_history?: Record<string, number>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          messages_sent?: number;
          highest_daily_clicks?: number;
          longest_coin_streak?: number;
          total_days_active?: number;
          first_click_date?: string | null;
          last_active_date?: string | null;
          daily_click_history?: Record<string, number>;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          nickname: string;
          message: string;
          tier: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nickname: string;
          message: string;
          tier?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nickname?: string;
          message?: string;
          tier?: number;
          created_at?: string;
        };
      };
      collectibles: {
        Row: {
          id: string;
          name: string;
          emoji: string;
          type: 'sheep_emoji' | 'particle';
          rarity: 'free' | 'normal' | 'epic' | 'legendary';
          gem_cost: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          emoji: string;
          type: 'sheep_emoji' | 'particle';
          rarity: 'free' | 'normal' | 'epic' | 'legendary';
          gem_cost?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          emoji?: string;
          type?: 'sheep_emoji' | 'particle';
          rarity?: 'free' | 'normal' | 'epic' | 'legendary';
          gem_cost?: number;
          created_at?: string;
        };
      };
      user_collectibles: {
        Row: {
          user_id: string;
          collectible_id: string;
          obtained_at: string;
          obtained_from: 'purchase' | 'box' | 'free';
        };
        Insert: {
          user_id: string;
          collectible_id: string;
          obtained_at?: string;
          obtained_from?: 'purchase' | 'box' | 'free';
        };
        Update: {
          user_id?: string;
          collectible_id?: string;
          obtained_at?: string;
          obtained_from?: 'purchase' | 'box' | 'free';
        };
      };
      embroidered_boxes: {
        Row: {
          id: string;
          user_id: string;
          box_type: 'daily' | 'purchased';
          opened_at: string;
          reward_type: 'coins' | 'gems' | 'collectible';
          reward_amount: number;
          reward_collectible_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          box_type: 'daily' | 'purchased';
          opened_at?: string;
          reward_type: 'coins' | 'gems' | 'collectible';
          reward_amount?: number;
          reward_collectible_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          box_type?: 'daily' | 'purchased';
          opened_at?: string;
          reward_type?: 'coins' | 'gems' | 'collectible';
          reward_amount?: number;
          reward_collectible_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
};