// Add TIERS import at the top

export interface User {
  id: string;
  nickname: string;
  total_clicks: number;
  tier: number;
  created_at: string;
}

export interface UserCurrency {
  user_id: string;
  wool_coins: number;
  last_daily_claim: string | null;
  consecutive_days: number;
  selected_theme: string;
  unlocked_themes: string[];
  updated_at: string;
}

export interface UserStats {
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
}

export interface ChatMessage {
  id: string;
  user_id: string;
  nickname: string;
  message: string;
  tier: number;
  created_at: string;
}

export interface GlobalStats {
  id: string;
  total_sheep: number;
  updated_at: string;
}

export interface Theme {
  id: string;
  name: string;
  displayName: string;
  cost: number;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  gradient: string;
}

export interface DailyReward {
  wool_coins_earned: number;
  new_consecutive_days: number;
  new_total_coins: number;
}

export interface TierInfo {
  level: number;
  name: string;
  icon: string;
  requirement: number;
  color: string;
}

export interface GameState {
  user: User | null;
  globalStats: GlobalStats;
  chatMessages: ChatMessage[];
  userCurrency: UserCurrency | null;
  isOffline: boolean;
  loading: boolean;
  error: string | null;
  incrementSheep: () => void;
  claimDailyReward: () => Promise<DailyReward | null>;
  purchaseTheme: (themeId: string) => Promise<boolean>;
  selectTheme: (themeId: string) => void;
  updateNickname: (nickname: string) => void;
  updateTier: (tier: number) => void;
}

export const THEMES: Theme[] = [
  {
    id: 'cosmic',
    name: 'cosmic',
    displayName: 'Cosmic Purple',
    cost: 0,
    description: 'The classic purple and pink cosmic theme',
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F59E0B',
      background: 'from-gray-900 via-purple-900 to-gray-900'
    },
    gradient: 'from-purple-400 to-pink-400'
  },
  {
    id: 'forest',
    name: 'forest',
    displayName: 'Emerald Forest',
    cost: 25,
    description: 'A fresh green theme inspired by nature',
    colors: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#F59E0B',
      background: 'from-gray-900 via-emerald-900 to-gray-900'
    },
    gradient: 'from-emerald-400 to-green-400'
  },
  {
    id: 'arctic',
    name: 'arctic',
    displayName: 'Arctic White',
    cost: 50,
    description: 'A clean, minimalist white and blue theme',
    colors: {
      primary: '#3B82F6',
      secondary: '#1D4ED8',
      accent: '#F59E0B',
      background: 'from-slate-100 via-blue-50 to-slate-100'
    },
    gradient: 'from-blue-400 to-cyan-400'
  },
  {
    id: 'sunset',
    name: 'sunset',
    displayName: 'Golden Sunset',
    cost: 75,
    description: 'Warm orange and red sunset colors',
    colors: {
      primary: '#F59E0B',
      secondary: '#EF4444',
      accent: '#8B5CF6',
      background: 'from-gray-900 via-orange-900 to-red-900'
    },
    gradient: 'from-orange-400 to-red-400'
  },
  {
    id: 'midnight',
    name: 'midnight',
    displayName: 'Midnight Blue',
    cost: 100,
    description: 'Deep blue theme for night owls',
    colors: {
      primary: '#1E40AF',
      secondary: '#3730A3',
      accent: '#F59E0B',
      background: 'from-slate-900 via-blue-900 to-indigo-900'
    },
    gradient: 'from-blue-400 to-indigo-400'
  },
  {
    id: 'neon',
    name: 'neon',
    displayName: 'Neon Cyber',
    cost: 250,
    description: 'Futuristic dark theme with vibrant neon highlights',
    colors: {
      primary: '#00FFFF',
      secondary: '#FF00FF',
      accent: '#00FF00',
      background: 'from-black via-gray-900 to-black'
    },
    gradient: 'from-cyan-400 to-pink-400'
  },
  {
    id: 'coral',
    name: 'coral',
    displayName: 'Coral Reef',
    cost: 500,
    description: 'Tropical coral theme with warm ocean vibes',
    colors: {
      primary: '#FF7F7F',
      secondary: '#40E0D0',
      accent: '#FFD700',
      background: 'from-pink-100 via-coral-50 to-turquoise-100'
    },
    gradient: 'from-pink-400 to-turquoise-400'
  },
  {
    id: 'rainbow',
    name: 'rainbow',
    displayName: 'Rainbow Spectrum',
    cost: 750,
    description: 'Vibrant rainbow theme with shifting colors',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#45B7D1',
      background: 'from-red-200 via-yellow-200 via-green-200 via-blue-200 to-purple-200'
    },
    gradient: 'from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400'
  },
  {
    id: 'galaxy',
    name: 'galaxy',
    displayName: 'Cosmic Galaxy',
    cost: 1000,
    description: 'Premium galaxy theme with stellar highlights',
    colors: {
      primary: '#9D4EDD',
      secondary: '#7209B7',
      accent: '#FFD60A',
      background: 'from-purple-900 via-indigo-900 to-black'
    },
    gradient: 'from-purple-400 via-blue-300 to-yellow-300'
  }
];

export const TIERS: TierInfo[] = [
  { level: 0, name: 'Lamb', icon: '🐑', requirement: 0, color: '#9CA3AF' },
  { level: 1, name: 'Shepherd', icon: '👨‍🌾', requirement: 100, color: '#10B981' },
  { level: 2, name: 'Flock Master', icon: '🌟', requirement: 500, color: '#3B82F6' },
  { level: 3, name: 'Wool Baron', icon: '👑', requirement: 1000, color: '#8B5CF6' },
  { level: 4, name: 'Sheep Lord', icon: '⚡', requirement: 2500, color: '#F59E0B' },
  { level: 5, name: 'Legendary Herder', icon: '🔥', requirement: 5000, color: '#EF4444' },
  { level: 6, name: 'Wool Deity', icon: '✨', requirement: 10000, color: '#EC4899' },
  { level: 7, name: 'Celestial Shepherd', icon: '🌙', requirement: 25000, color: '#A855F7' },
  { level: 8, name: 'Eternal Flockkeeper', icon: '🤍', requirement: 50000, color: '#FFFFFF' },
  { level: 9, name: 'Sheep God', icon: '🌈', requirement: 100000, color: 'rainbow' }
];