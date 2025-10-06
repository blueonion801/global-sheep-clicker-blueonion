import React, { useState, useEffect } from 'react';
import { X, Settings, Coins, Gem, TrendingUp, Palette, Sparkles } from 'lucide-react';
import { User, UserCurrency, THEMES, TIERS } from '../types/game';
import { supabase } from '../lib/supabase';
import { useTheme } from './ThemeProvider';

interface DeveloperMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  userCurrency: UserCurrency | null;
  isOffline: boolean;
}

interface Collectible {
  id: string;
  name: string;
  emoji: string;
  type: 'sheep_emoji' | 'particle';
  rarity: string;
}

export const DeveloperMenu: React.FC<DeveloperMenuProps> = ({
  isOpen,
  onClose,
  user,
  userCurrency,
  isOffline
}) => {
  const { currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'currency' | 'themes' | 'collectibles' | 'progression'>('currency');
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [ownedCollectibles, setOwnedCollectibles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user || isOffline) return;

    const fetchCollectibles = async () => {
      try {
        const [allResult, ownedResult] = await Promise.all([
          supabase.from('collectibles').select('*').order('type').order('rarity'),
          supabase.from('user_collectibles').select('collectible_id').eq('user_id', user.id)
        ]);

        if (allResult.data) {
          setCollectibles(allResult.data);
        }
        if (ownedResult.data) {
          setOwnedCollectibles(new Set(ownedResult.data.map(c => c.collectible_id)));
        }
      } catch (error) {
        console.error('Failed to fetch collectibles:', error);
      }
    };

    fetchCollectibles();
  }, [isOpen, user, isOffline]);

  if (!isOpen || !user || isOffline) return null;

  const giveCurrency = async (type: 'coins' | 'gems', amount: number) => {
    if (!userCurrency || loading) return;
    setLoading(true);

    try {
      const updates = type === 'coins'
        ? { wool_coins: userCurrency.wool_coins + amount }
        : { sheep_gems: userCurrency.sheep_gems + amount };

      await supabase
        .from('user_currency')
        .update(updates)
        .eq('user_id', user.id);

      window.location.reload();
    } catch (error) {
      console.error('Failed to give currency:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockTheme = async (themeId: string) => {
    if (!userCurrency || loading) return;
    setLoading(true);

    try {
      const unlocked = userCurrency.unlocked_themes.includes(themeId)
        ? userCurrency.unlocked_themes
        : [...userCurrency.unlocked_themes, themeId];

      await supabase
        .from('user_currency')
        .update({
          unlocked_themes: unlocked,
          selected_theme: themeId
        })
        .eq('user_id', user.id);

      window.location.reload();
    } catch (error) {
      console.error('Failed to unlock theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockCollectible = async (collectibleId: string) => {
    if (loading || ownedCollectibles.has(collectibleId)) return;
    setLoading(true);

    try {
      await supabase
        .from('user_collectibles')
        .insert([{
          user_id: user.id,
          collectible_id: collectibleId,
          obtained_from: 'free'
        }]);

      setOwnedCollectibles(new Set([...ownedCollectibles, collectibleId]));
    } catch (error) {
      console.error('Failed to unlock collectible:', error);
    } finally {
      setLoading(false);
    }
  };

  const setClicks = async (clicks: number) => {
    if (loading) return;
    setLoading(true);

    try {
      const newTier = TIERS.findLast(t => clicks >= t.requirement)?.level || 0;

      // Only update user's clicks, not the global count
      await supabase
        .from('users')
        .update({
          total_clicks: clicks,
          tier: newTier
        })
        .eq('id', user.id);

      window.location.reload();
    } catch (error) {
      console.error('Failed to set clicks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400';
      case 'epic': return 'text-purple-400';
      case 'normal': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl border border-red-500/50 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-red-500/50 bg-red-900/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-red-400 flex items-center gap-3">
              <Settings className="w-6 h-6" />
              Developer Menu
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-red-300 text-sm mt-2">
            <strong>Dev Mode:</strong> Changes here only affect your account, not the global sheep count
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700/50 bg-gray-900/50">
          {[
            { id: 'currency', label: 'Currency', icon: Coins },
            { id: 'themes', label: 'Themes', icon: Palette },
            { id: 'collectibles', label: 'Collectibles', icon: Sparkles },
            { id: 'progression', label: 'Progression', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-red-400 border-b-2 border-red-400 bg-red-900/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'currency' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5" style={{ color: currentTheme.colors.accent }} />
                  Wool Coins
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[10, 50, 100, 500, 1000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => giveCurrency('coins', amount)}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      +{amount}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Gem className="w-5 h-5" style={{ color: currentTheme.colors.secondary }} />
                  Sheep Gems
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 25, 50, 100].map(amount => (
                    <button
                      key={amount}
                      onClick={() => giveCurrency('gems', amount)}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      +{amount}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEMES.map(theme => {
                const isUnlocked = userCurrency?.unlocked_themes.includes(theme.id);
                return (
                  <button
                    key={theme.id}
                    onClick={() => unlockTheme(theme.id)}
                    disabled={loading}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isUnlocked
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-gray-600 bg-gray-700/30 hover:bg-gray-700/50'
                    } disabled:opacity-50`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white mb-1">{theme.displayName}</h4>
                        <p className="text-sm text-gray-400">{theme.description}</p>
                      </div>
                      {isUnlocked && (
                        <span className="text-green-400 text-xs font-medium px-2 py-1 bg-green-900/30 rounded">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {Object.values(theme.colors).slice(0, 3).map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border-2 border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'collectibles' && (
            <div className="space-y-4">
              {['sheep_emoji', 'particle'].map(type => {
                const items = collectibles.filter(c => c.type === type);
                if (items.length === 0) return null;

                return (
                  <div key={type}>
                    <h3 className="text-lg font-semibold text-white mb-3 capitalize">
                      {type === 'sheep_emoji' ? 'Sheep Emojis' : 'Click Particles'}
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {items.map(item => {
                        const isOwned = ownedCollectibles.has(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => unlockCollectible(item.id)}
                            disabled={loading || isOwned}
                            className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all ${
                              isOwned
                                ? 'border-green-500 bg-green-900/20'
                                : 'border-gray-600 bg-gray-700/30 hover:bg-gray-700/50'
                            } disabled:opacity-50`}
                            title={`${item.name} (${item.rarity})`}
                          >
                            <span className="text-2xl">{item.emoji}</span>
                            <span className={`text-xs font-medium mt-1 ${getRarityColor(item.rarity)}`}>
                              {item.rarity[0].toUpperCase()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'progression' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Set Total Clicks</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Current: {user.total_clicks.toLocaleString()} clicks (Tier {user.tier})
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIERS.map(tier => (
                    <button
                      key={tier.level}
                      onClick={() => setClicks(tier.requirement)}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <span>{tier.icon}</span>
                      <span>{tier.name}</span>
                      <span className="text-xs text-gray-400">({tier.requirement})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  <strong>Note:</strong> Changes made here do not affect the global sheep count.
                  This is for testing purposes only.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
