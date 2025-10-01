import React, { useState, useEffect } from 'react';
import { Package, Gem, Gift, ShoppingBag, ChevronDown, ChevronUp, Sparkles, Star, Coins } from 'lucide-react';
import { UserCurrency, Collectible, UserCollectible, BoxReward } from '../types/game';
import { supabase } from '../lib/supabase';
import { audioManager } from '../utils/audioManager';
import { useTheme } from './ThemeProvider';
import { BoxOpeningModal } from './BoxOpeningModal';

interface CrochetShopProps {
  userCurrency: UserCurrency;
  onClaimDailyGems: () => Promise<void>;
  onOpenBox: (boxType: 'daily' | 'purchased') => Promise<BoxReward | null>;
  onPurchaseCollectible: (collectibleId: string) => Promise<boolean>;
  onSelectCollectible: (collectibleId: string, type: 'sheep_emoji' | 'particle') => Promise<void>;
  disabled?: boolean;
  hintsEnabled?: boolean;
}

export const CrochetShop: React.FC<CrochetShopProps> = ({
  userCurrency,
  onClaimDailyGems,
  onOpenBox,
  onPurchaseCollectible,
  onSelectCollectible,
  disabled,
  hintsEnabled = true
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('crochetShopExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [activeTab, setActiveTab] = useState<'boxes' | 'sheep' | 'particles'>('boxes');
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [userCollectibles, setUserCollectibles] = useState<UserCollectible[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [currentBoxRewards, setCurrentBoxRewards] = useState<any[] | null>(null);
  const [currentBoxType, setCurrentBoxType] = useState<'daily' | 'purchased'>('daily');
  const [isClaimingGems, setIsClaimingGems] = useState(false);
  const [isOpeningBox, setIsOpeningBox] = useState(false);
  const { currentTheme } = useTheme();

  const fetchCollectibles = async () => {
    try {
      // Define rarity order for sorting
      const rarityOrder = { 'free': 0, 'normal': 1, 'epic': 2, 'legendary': 3 };
      
      const { data, error } = await supabase
        .from('collectibles')
        .select('*')
        .order('gem_cost', { ascending: true });

      if (error) throw error;
      
      // Sort by rarity order, then by gem cost
      const sortedData = (data || []).sort((a, b) => {
        const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
        if (rarityDiff !== 0) return rarityDiff;
        return a.gem_cost - b.gem_cost;
      });
      
      setCollectibles(sortedData);
    } catch (error) {
      console.error('Failed to fetch collectibles:', error);
    }
  };

  const fetchUserCollectibles = async () => {
    if (!userCurrency?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('user_collectibles')
        .select('*')
        .eq('user_id', userCurrency.user_id);

      if (error) throw error;
      setUserCollectibles(data || []);
    } catch (error) {
      console.error('Failed to fetch user collectibles:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCollectibles(), fetchUserCollectibles()]);
      setLoading(false);
    };

    loadData();
  }, [userCurrency?.user_id]);

  const canClaimDailyGems = () => {
    if (!userCurrency.last_gem_claim) return true;
    const lastClaim = new Date(userCurrency.last_gem_claim);
    const today = new Date();
    return lastClaim.toDateString() !== today.toDateString();
  };

  const canClaimDailyBox = () => {
    if (!userCurrency.last_daily_claim) return true;
    const lastClaim = new Date(userCurrency.last_daily_claim);
    const today = new Date();
    return lastClaim.toDateString() !== today.toDateString();
  };

  const handleClaimDailyGems = async () => {
    if (isClaimingGems || !canClaimDailyGems()) return;
    
    audioManager.playGuiSound();
    setIsClaimingGems(true);
    
    try {
      await onClaimDailyGems();
    } finally {
      setIsClaimingGems(false);
    }
  };

  const handleOpenBox = async (boxType: 'daily' | 'purchased') => {
    if (isOpeningBox) return;
    if (boxType === 'purchased' && userCurrency.sheep_gems < 40) return;
    if (boxType === 'daily' && !canClaimDailyBox()) return;
    
    setIsOpeningBox(true);
    setCurrentBoxType(boxType);
    
    try {
      const reward = await onOpenBox(boxType);
      if (reward) {
        setCurrentBoxRewards(reward.rewards || []);
        setShowBoxModal(true);
        
        // Refresh user collectibles if a collectible was obtained
        if (reward.rewards && reward.rewards.some((r: any) => r.type === 'collectible')) {
          await fetchUserCollectibles();
        }
      }
    } finally {
      setIsOpeningBox(false);
    }
  };

  const handleCloseBoxModal = () => {
    setShowBoxModal(false);
    setCurrentBoxRewards(null);
    setIsOpeningBox(false);
  };

  const handlePurchaseCollectible = async (collectibleId: string) => {
    audioManager.playGuiSound();
    const success = await onPurchaseCollectible(collectibleId);
    if (success) {
      await fetchUserCollectibles();
    }
  };

  const handleSelectCollectible = async (collectibleId: string, type: 'sheep_emoji' | 'particle') => {
    audioManager.playGuiSound();
    await onSelectCollectible(collectibleId, type);
  };

  const toggleExpanded = () => {
    audioManager.playGuiSound();
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('crochetShopExpanded', JSON.stringify(newState));
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'free': return 'text-gray-400';
      case 'normal': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'free': return 'border-gray-600/50';
      case 'normal': return 'border-blue-500/50';
      case 'epic': return 'border-purple-500/50';
      case 'legendary': return 'border-yellow-500/50';
      default: return 'border-gray-600/50';
    }
  };

  const isCollectibleOwned = (collectibleId: string) => {
    return userCollectibles.some(uc => uc.collectible_id === collectibleId);
  };

  const isCollectibleSelected = (collectibleId: string, type: 'sheep_emoji' | 'particle') => {
    const collectible = collectibles.find(c => c.id === collectibleId);
    if (!collectible) return false;
    
    if (type === 'sheep_emoji') {
      return collectible.emoji === userCurrency.selected_sheep_emoji;
    } else {
      return collectible.emoji === userCurrency.selected_particle;
    }
  };

  const filterCollectiblesByType = (type: 'sheep_emoji' | 'particle') => {
    return collectibles.filter(c => c.type === type);
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="text-pink-400" />
            Crochet Shop
          </h3>
          <button
            onClick={toggleExpanded}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Gem className="w-5 h-5 text-cyan-400" />
            <span className="text-2xl font-bold text-cyan-400">
              {userCurrency.sheep_gems}
            </span>
            <span className="text-gray-400">Sheep Gems</span>
          </div>
          <div className="text-sm text-gray-400">
            Auto-earned every 500 clicks (Tier 5+)
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'boxes', label: 'Embroidered Boxes', icon: Gift },
              { id: 'sheep', label: 'Sheep Emojis', icon: Star },
              { id: 'particles', label: 'Click Particles', icon: Sparkles }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  audioManager.playGuiSound();
                  setActiveTab(tab.id as any);
                }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab.id
                    ? 'text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }
                `}
                style={activeTab === tab.id ? {
                  backgroundColor: currentTheme.colors.primary
                } : {}}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Boxes Tab */}
          {activeTab === 'boxes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Daily Box */}
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="text-center">
                    <Gift className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                    <h4 className="text-lg font-bold text-white mb-2">Daily Embroidered Box</h4>
                    <p className="text-sm text-gray-300 mb-4">
                      Claim your free daily box with random rewards!
                    </p>
                    <button
                      onClick={() => handleOpenBox('daily')}
                      disabled={disabled || isOpeningBox || !canClaimDailyBox()}
                      className={`
                        w-full py-2 px-4 rounded-lg font-medium transition-all
                        ${canClaimDailyBox() && !disabled
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {isOpeningBox ? 'Opening...' : canClaimDailyBox() ? 'Open Daily Box' : 'Claimed Today'}
                    </button>
                  </div>
                </div>

                {/* Purchase Box */}
                <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-lg p-4">
                  <div className="text-center">
                    <ShoppingBag className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                    <h4 className="text-lg font-bold text-white mb-2">Premium Embroidered Box</h4>
                    <p className="text-sm text-gray-300 mb-4">
                      Purchase additional boxes with gems or coins
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleOpenBox('purchased')}
                        disabled={disabled || isOpeningBox || userCurrency.sheep_gems < 40}
                        className={`
                          w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                          ${userCurrency.sheep_gems >= 40 && !disabled
                            ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        <Gem className="w-4 h-4" />
                        {isOpeningBox ? 'Opening...' : '40 Gems'}
                      </button>
                      <button
                        onClick={() => handleOpenBox('purchased')}
                        disabled={disabled || isOpeningBox || userCurrency.wool_coins < 500}
                        className={`
                          w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm
                          ${userCurrency.wool_coins >= 500 && !disabled
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        <Coins className="w-4 h-4" />
                        {isOpeningBox ? 'Opening...' : '500 Coins'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {hintsEnabled && (
                <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                  <h5 className="text-blue-400 font-medium mb-2">📦 Box Rewards:</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Daily boxes: 2 rewards each with 55% coins (10-30), 35% gems (2-8), 10% collectible</li>
                    <li>• Premium boxes: 1 reward with 20% coins (20-40), 25% gems (5-15), 55% collectible (40 gems or 500 coins)</li>
                    <li>• Collectible rarities - Daily: 7% normal, 2% epic, 1% legendary</li>
                    <li>• Collectible rarities - Premium: 35% normal, 15% epic, 5% legendary</li>
                    <li>• Earn 1 gem automatically every 500 clicks (Tier 5+)</li>
                    <li>• Free collectibles are available to select immediately</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Sheep Emojis Tab */}
          {activeTab === 'sheep' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filterCollectiblesByType('sheep_emoji').map(collectible => {
                  const isOwned = isCollectibleOwned(collectible.id);
                  const isSelected = isCollectibleSelected(collectible.id, 'sheep_emoji');
                  const canAfford = userCurrency.sheep_gems >= collectible.gem_cost;
                  
                  return (
                    <div
                      key={collectible.id}
                      className={`
                        p-3 rounded-lg border transition-all duration-300 text-center
                        ${isSelected 
                          ? 'border-2 shadow-lg' 
                          : isOwned
                            ? `bg-gray-700/50 ${getRarityBorder(collectible.rarity)} hover:bg-gray-700/70`
                            : canAfford && collectible.rarity !== 'legendary'
                              ? `bg-gray-800/50 ${getRarityBorder(collectible.rarity)} hover:bg-gray-700/50`
                              : `bg-gray-800/30 ${getRarityBorder(collectible.rarity)} opacity-60`
                        }
                      `}
                      style={isSelected ? {
                        background: `linear-gradient(to right, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20)`,
                        borderColor: `${currentTheme.colors.primary}80`,
                        boxShadow: `0 10px 15px -3px ${currentTheme.colors.primary}20`
                      } : {}}
                    >
                      <div className="text-3xl mb-2">{collectible.emoji}</div>
                      <h5 className={`font-medium text-xs mb-1 ${getRarityColor(collectible.rarity)}`}>
                        {collectible.name}
                      </h5>
                      
                      {isSelected && (
                        <span 
                          className="text-white text-xs px-2 py-1 rounded-full block mb-2"
                          style={{ backgroundColor: currentTheme.colors.primary }}
                        >
                          Selected
                        </span>
                      )}
                      
                      {isOwned && !isSelected && (
                        <button
                          onClick={() => handleSelectCollectible(collectible.id, 'sheep_emoji')}
                          disabled={disabled}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-2 py-1 rounded-full w-full mb-1"
                        >
                          Select
                        </button>
                      )}
                      
                      {!isOwned && collectible.rarity !== 'legendary' && (
                        <button
                          onClick={() => handlePurchaseCollectible(collectible.id)}
                          disabled={disabled || (!canAfford && collectible.gem_cost > 0)}
                          className={`
                            text-xs px-2 py-1 rounded-full w-full transition-colors flex items-center justify-center gap-1
                            ${(canAfford || collectible.gem_cost === 0) && !disabled
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }
                          `}
                        >
                          <Gem className="w-3 h-3" />
                          {collectible.gem_cost === 0 ? 'Free' : collectible.gem_cost}
                        </button>
                      )}
                      
                      {collectible.rarity === 'legendary' && !isOwned && (
                        <span className="text-xs text-yellow-400 px-2 py-1 rounded-full bg-yellow-900/20 block">
                          Box Only
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Particles Tab */}
          {activeTab === 'particles' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filterCollectiblesByType('particle').map(collectible => {
                  const isOwned = isCollectibleOwned(collectible.id);
                  const isSelected = isCollectibleSelected(collectible.id, 'particle');
                  const canAfford = userCurrency.sheep_gems >= collectible.gem_cost;
                  
                  return (
                    <div
                      key={collectible.id}
                      className={`
                        p-3 rounded-lg border transition-all duration-300 text-center
                        ${isSelected 
                          ? 'border-2 shadow-lg' 
                          : isOwned
                            ? `bg-gray-700/50 ${getRarityBorder(collectible.rarity)} hover:bg-gray-700/70`
                            : canAfford && collectible.rarity !== 'legendary'
                              ? `bg-gray-800/50 ${getRarityBorder(collectible.rarity)} hover:bg-gray-700/50`
                              : `bg-gray-800/30 ${getRarityBorder(collectible.rarity)} opacity-60`
                        }
                      `}
                      style={isSelected ? {
                        background: `linear-gradient(to right, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20)`,
                        borderColor: `${currentTheme.colors.primary}80`,
                        boxShadow: `0 10px 15px -3px ${currentTheme.colors.primary}20`
                      } : {}}
                    >
                      <div className="text-3xl mb-2">{collectible.emoji}</div>
                      <h5 className={`font-medium text-xs mb-1 ${getRarityColor(collectible.rarity)}`}>
                        {collectible.name}
                      </h5>
                      
                      {isSelected && (
                        <span 
                          className="text-white text-xs px-2 py-1 rounded-full block mb-2"
                          style={{ backgroundColor: currentTheme.colors.primary }}
                        >
                          Selected
                        </span>
                      )}
                      
                      {isOwned && !isSelected && (
                        <button
                          onClick={() => handleSelectCollectible(collectible.id, 'particle')}
                          disabled={disabled}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-2 py-1 rounded-full w-full mb-1"
                        >
                          Select
                        </button>
                      )}
                      
                      {!isOwned && collectible.rarity !== 'legendary' && (
                        <button
                          onClick={() => handlePurchaseCollectible(collectible.id)}
                          disabled={disabled || (!canAfford && collectible.gem_cost > 0)}
                          className={`
                            text-xs px-2 py-1 rounded-full w-full transition-colors flex items-center justify-center gap-1
                            ${(canAfford || collectible.gem_cost === 0) && !disabled
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }
                          `}
                        >
                          <Gem className="w-3 h-3" />
                          {collectible.gem_cost === 0 ? 'Free' : collectible.gem_cost}
                        </button>
                      )}
                      
                      {collectible.rarity === 'legendary' && !isOwned && (
                        <span className="text-xs text-yellow-400 px-2 py-1 rounded-full bg-yellow-900/20 block">
                          Box Only
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Box Opening Modal */}
      <BoxOpeningModal
        isOpen={showBoxModal}
        onClose={handleCloseBoxModal}
        rewards={currentBoxRewards}
        boxType={currentBoxType}
      />
    </div>
  );
};