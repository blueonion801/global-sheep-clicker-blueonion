import React from 'react';
import { GlobalStats, User, TIERS } from '../types/game';
import { Trophy, Target, Edit2 } from 'lucide-react';
import { audioManager } from '../utils/audioManager';
import { useTheme } from './ThemeProvider';

interface StatsDisplayProps {
  globalStats: GlobalStats | null;
  user: User | null;
  onUpdateNickname: (nickname: string) => void;
  onUpdateTier: (tier: number) => void;
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ 
  globalStats, 
  user, 
  onUpdateNickname, 
  onUpdateTier 
}) => {
  const [isEditingNickname, setIsEditingNickname] = React.useState(false);
  const [nicknameInput, setNicknameInput] = React.useState(user?.nickname || '');
  const { currentTheme } = useTheme();

  const currentTier = user ? TIERS.find(t => t.level === user.tier) : TIERS[0];
  const nextTier = user ? TIERS.find(t => t.level === user.tier + 1) : TIERS[1];
  const progress = user && nextTier ? 
    ((user.total_clicks - (TIERS[user.tier]?.requirement || 0)) / 
     (nextTier.requirement - (TIERS[user.tier]?.requirement || 0))) * 100 : 0;

  const handleNicknameSubmit = () => {
    if (nicknameInput.trim() && nicknameInput.trim() !== user?.nickname) {
      onUpdateNickname(nicknameInput.trim());
    }
    setIsEditingNickname(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNicknameSubmit();
    } else if (e.key === 'Escape') {
      setNicknameInput(user?.nickname || '');
      setIsEditingNickname(false);
    }
  };

  const unlockedTiers = user ? TIERS.filter(tier => user.total_clicks >= tier.requirement) : [TIERS[0]];


  return (
    <div className="space-y-6">
      {/* Global Stats */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Trophy className="text-yellow-400" />
            Global Sheep Count
          </h2>
          <div 
            className={`text-5xl font-bold bg-gradient-to-r ${currentTheme.gradient} bg-clip-text text-transparent`}
          >
            {globalStats?.total_sheep?.toLocaleString() || '0'}
          </div>
          <p className="text-gray-400 mt-2">sheep counted by all players</p>
        </div>
      </div>

      {/* Personal Stats */}
      {user && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
              <Target className="text-blue-400" />
              Your Progress
            </h3>
            
            {/* Username Section */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {isEditingNickname ? (
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    onBlur={handleNicknameSubmit}
                    onKeyDown={handleKeyPress}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center"
                    maxLength={20}
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="text-lg font-semibold text-white">{user.nickname}</span>
                    <button
                      onClick={() => {
                        audioManager.playGuiSound();
                        setIsEditingNickname(true);
                        setNicknameInput(user.nickname);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Current Tier */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">{currentTier?.icon}</span>
                <span className="text-lg font-semibold" style={{ color: currentTier?.color }}>
                  {currentTier?.name}
                </span>
              </div>
              <div className="text-3xl font-bold text-white">
                {user.total_clicks.toLocaleString()}
              </div>
              <p className="text-gray-400">sheep clicked</p>
            </div>

            {/* Tier Selection */}
            {unlockedTiers.length > 1 && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Display Tier:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {unlockedTiers.map((tier) => (
                    <button
                      key={tier.level}
                      onClick={() => onUpdateTier(tier.level)}
                      onMouseDown={() => audioManager.playGuiSound()}
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium transition-all
                        ${user.tier === tier.level
                          ? 'text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }
                      `}
                      style={user.tier === tier.level ? {
                        backgroundColor: currentTheme.colors.primary
                      } : {}}
                    >
                      {tier.icon} {tier.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Progress to next tier */}
            {nextTier && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Next: {nextTier.name} {nextTier.icon}</span>
                  <span>{user.total_clicks} / {nextTier.requirement}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full bg-gradient-to-r ${currentTheme.gradient} transition-all duration-500`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {nextTier.requirement - user.total_clicks} more to go!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};