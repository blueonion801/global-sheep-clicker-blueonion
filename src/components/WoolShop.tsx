import React, { useState } from 'react';
import { Coins, Palette, Calendar, Flame, Gift, ChevronDown, ChevronUp } from 'lucide-react';
import { UserCurrency, THEMES, DailyReward } from '../types/game';
import { audioManager } from '../utils/audioManager';
import { useTheme } from './ThemeProvider';

interface WoolShopProps {
  userCurrency: UserCurrency;
  onClaimDailyReward: () => Promise<DailyReward | null>;
  onPurchaseTheme: (themeId: string) => Promise<boolean>;
  onSelectTheme: (themeId: string) => void;
  disabled?: boolean;
  hintsEnabled?: boolean;
}

export const WoolShop: React.FC<WoolShopProps> = ({ 
  userCurrency, 
  onClaimDailyReward, 
  onPurchaseTheme, 
  onSelectTheme,
  disabled,
  hintsEnabled = true
}) => {
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [lastReward, setLastReward] = useState<DailyReward | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const { currentTheme } = useTheme();

  const canClaimDaily = () => {
    if (!userCurrency.last_daily_claim) return true;
    const lastClaim = new Date(userCurrency.last_daily_claim);
    const today = new Date();
    return lastClaim.toDateString() !== today.toDateString();
  };

  const handleClaimDaily = async () => {
    if (isClaimingReward || !canClaimDaily()) return;
    
    audioManager.playGuiSound();
    setIsClaimingReward(true);
    
    try {
      const reward = await onClaimDailyReward();
      if (reward && reward.wool_coins_earned > 0) {
        setLastReward(reward);
        setTimeout(() => setLastReward(null), 3000);
      }
    } finally {
      setIsClaimingReward(false);
    }
  };

  const handlePurchaseTheme = async (themeId: string) => {
    audioManager.playGuiSound();
    const success = await onPurchaseTheme(themeId);
    if (!success) {
      // Could add error feedback here
    }
  };

  const handleSelectTheme = (themeId: string) => {
    audioManager.playGuiSound();
    onSelectTheme(themeId);
  };

  const toggleExpanded = () => {
    audioManager.playGuiSound();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Coins className="text-yellow-400" />
            Wool Shop
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">
              {userCurrency.wool_coins}
            </span>
            <span className="text-gray-400">Wool Coins</span>
          </div>
          
          {/* Daily Reward */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleClaimDaily}
              disabled={disabled || isClaimingReward || !canClaimDaily()}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all text-white
                ${canClaimDaily() && !disabled
                  ? 'shadow-lg'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }
              `}
              style={canClaimDaily() && !disabled ? {
                backgroundColor: currentTheme.colors.primary,
                boxShadow: `0 10px 15px -3px ${currentTheme.colors.primary}25`
              } : {}}
            >
              <Gift className="w-4 h-4" />
              {isClaimingReward ? 'Claiming...' : canClaimDaily() ? 'Daily Reward' : 'Claimed Today'}
            </button>
          </div>
        </div>
        
        {/* Consecutive days streak */}
        {userCurrency.consecutive_days > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 font-medium">
              {userCurrency.consecutive_days} day streak
            </span>
            <span className="text-gray-400">
              (+{Math.min(userCurrency.consecutive_days, 10)} bonus coins)
            </span>
          </div>
        )}
      </div>

      {/* Reward notification */}
      {lastReward && lastReward.wool_coins_earned > 0 && (
        <div className="bg-green-600/20 border-b border-green-500/30 p-4 text-center">
          <p className="text-green-400 font-medium">
            🎉 Daily reward claimed! +{lastReward.wool_coins_earned} Wool Coins
          </p>
          {lastReward.new_consecutive_days > 1 && (
            <p className="text-green-300 text-sm">
              {lastReward.new_consecutive_days} day streak bonus!
            </p>
          )}
        </div>
      )}

      {/* Themes */}
      {isExpanded && (<div className="p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Palette style={{ color: currentTheme.colors.primary }} />
          Themes
        </h4>
        
        <div className="space-y-3">
          {THEMES.map((theme) => {
            const isUnlocked = userCurrency.unlocked_themes.includes(theme.id);
            const isSelected = userCurrency.selected_theme === theme.id;
            const canAfford = userCurrency.wool_coins >= theme.cost;
            
            return (
              <div
                key={theme.id}
                className={`
                  p-4 rounded-lg border transition-all duration-300
                  ${isSelected 
                    ? 'border-2 shadow-lg' 
                    : isUnlocked
                      ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                      : canAfford
                        ? 'bg-gray-800/50 border-gray-600/50 hover:bg-gray-700/50'
                        : 'bg-gray-800/30 border-gray-700/30 opacity-60'
                  }
                `}
                style={isSelected ? {
                  background: `linear-gradient(to right, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20)`,
                  borderColor: `${currentTheme.colors.primary}80`,
                  boxShadow: `0 10px 15px -3px ${currentTheme.colors.primary}20`
                } : {}}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className={`w-6 h-6 rounded-full bg-gradient-to-r ${theme.gradient}`}
                      />
                      <h5 
                        className={`font-semibold ${
                          theme.id === 'neon'
                              ? 'bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent'
                              : 'text-white'
                        }`}
                      >
                        {theme.displayName}
                      </h5>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{theme.description}</p>
                    
                    {!isUnlocked && (
                      <div className="flex items-center gap-2 text-sm">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span className={`font-medium ${canAfford ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {theme.cost} Wool Coins
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {isSelected && (
                      <span 
                        className="text-white text-xs px-3 py-1 rounded-full"
                        style={{ backgroundColor: currentTheme.colors.primary }}
                      >
                        Active
                      </span>
                    )}
                    
                    {isUnlocked && !isSelected && (
                      <button
                        onClick={() => handleSelectTheme(theme.id)}
                        disabled={disabled}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-3 py-1 rounded-full transition-colors"
                      >
                        Select
                      </button>
                    )}
                    
                    {!isUnlocked && (
                      <button
                        onClick={() => handlePurchaseTheme(theme.id)}
                        disabled={disabled || !canAfford}
                        className={`
                          text-xs px-3 py-1 rounded-full transition-colors
                          ${canAfford && !disabled
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        {canAfford ? 'Purchase' : 'Not enough coins'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {hintsEnabled && (<div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
          <h5 className="text-blue-400 font-medium mb-2">💡 How to earn Wool Coins:</h5>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Earn 1+ coins every 100 sheep clicks (Shepherd tier required)</li>
            <li>• Claim daily rewards (5+ coins, streak bonuses up to +10)</li>
            <li>• Higher tiers earn more coins per 100 clicks</li>
            <li>• Premium themes offer unique visual experiences</li>
          </ul>
        </div>)}
      </div>
    )}</div>
  );
};