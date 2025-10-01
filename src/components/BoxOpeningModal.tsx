import React, { useState, useEffect } from 'react';
import { X, Coins, Gem, Gift, Sparkles } from 'lucide-react';
import { BoxReward } from '../types/game';
import { useTheme } from './ThemeProvider';
import { audioManager } from '../utils/audioManager';

interface BoxOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: any[] | null;
  boxType: 'daily' | 'purchased';
}

export const BoxOpeningModal: React.FC<BoxOpeningModalProps> = ({
  isOpen,
  onClose,
  rewards,
  boxType
}) => {
  const [showRewards, setShowRewards] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'opening' | 'revealing' | 'complete'>('opening');
  const { currentTheme } = useTheme();

  useEffect(() => {
    if (isOpen && rewards) {
      setShowRewards(false);
      setAnimationPhase('opening');
      
      // Box opening animation sequence
      setTimeout(() => {
        audioManager.playTierUpSound();
        setAnimationPhase('revealing');
      }, 1000);
      
      setTimeout(() => {
        setShowRewards(true);
        setAnimationPhase('complete');
      }, 1500);
    }
  }, [isOpen, rewards]);

  const handleClose = () => {
    audioManager.playGuiSound();
    setShowRewards(false);
    setAnimationPhase('opening');
    onClose();
  };

  if (!isOpen || !rewards) return null;

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'coins':
        return <Coins className="w-8 h-8 text-yellow-400" />;
      case 'gems':
        return <Gem className="w-8 h-8 text-cyan-400" />;
      case 'collectible':
        return <Gift className="w-8 h-8 text-purple-400" />;
      default:
        return <Sparkles className="w-8 h-8 text-white" />;
    }
  };

  const getRewardText = (reward: any) => {
    if (reward.type === 'coins') {
      return `${reward.amount} Wool Coins`;
    } else if (reward.type === 'gems') {
      return `${reward.amount} Sheep Gems`;
    } else if (reward.type === 'collectible' && reward.collectible) {
      return `${reward.collectible.emoji} ${reward.collectible.name}`;
    }
    return 'Mystery Reward';
  };

  const getRewardColor = (type: string) => {
    switch (type) {
      case 'coins':
        return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
      case 'gems':
        return 'from-cyan-500/20 to-blue-500/20 border-cyan-500/50';
      case 'collectible':
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/50';
      default:
        return 'from-gray-500/20 to-gray-400/20 border-gray-500/50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-700/50 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            {boxType === 'daily' ? '🎁 Daily Box' : '💎 Premium Box'}
          </h2>
          <p className="text-gray-400">
            {animationPhase === 'opening' && 'Opening your embroidered box...'}
            {animationPhase === 'revealing' && 'Revealing your rewards...'}
            {animationPhase === 'complete' && 'Congratulations!'}
          </p>
        </div>

        {/* Animation Area */}
        <div className="p-8 min-h-[300px] flex flex-col items-center justify-center">
          {/* Box Opening Animation */}
          {animationPhase === 'opening' && (
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-xl border-4 animate-bounce"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
                  borderColor: currentTheme.colors.accent
                }}
              >
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  📦
                </div>
              </div>
              <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          )}

          {/* Revealing Animation */}
          {animationPhase === 'revealing' && (
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-xl border-4 animate-pulse"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
                  borderColor: currentTheme.colors.accent
                }}
              >
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  ✨
                </div>
              </div>
              {/* Sparkle effects */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                  style={{
                    top: `${20 + Math.sin(i * Math.PI / 4) * 40}px`,
                    left: `${20 + Math.cos(i * Math.PI / 4) * 40}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Rewards Display */}
          {showRewards && animationPhase === 'complete' && (
            <div className="w-full space-y-4 animate-fade-in">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h3 className="text-xl font-bold text-white mb-2">You received:</h3>
              </div>
              
              {rewards.map((reward, index) => (
                <div
                  key={index}
                  className={`
                    p-4 rounded-xl border bg-gradient-to-r ${getRewardColor(reward.type)}
                    transform transition-all duration-500 hover:scale-105
                  `}
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    animation: 'slideInUp 0.6s ease-out forwards'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getRewardIcon(reward.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-lg">
                        {getRewardText(reward)}
                      </h4>
                      {reward.type === 'collectible' && reward.collectible && (
                        <p className="text-sm text-gray-300 capitalize">
                          {reward.collectible.rarity} rarity
                        </p>
                      )}
                    </div>
                    {reward.type === 'collectible' && reward.collectible && (
                      <div className="text-3xl">
                        {reward.collectible.emoji}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {animationPhase === 'complete' && (
          <div className="p-6 border-t border-gray-700/50 text-center">
            <button
              onClick={handleClose}
              className="px-8 py-3 rounded-lg font-medium text-white transition-all hover:scale-105 shadow-lg"
              style={{
                backgroundColor: currentTheme.colors.primary,
                boxShadow: `0 10px 15px -3px ${currentTheme.colors.primary}40`
              }}
            >
              Awesome! Continue Playing
            </button>
          </div>
        )}

        {/* Skip button for impatient users */}
        {animationPhase !== 'complete' && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};