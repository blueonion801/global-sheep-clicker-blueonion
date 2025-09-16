import React from 'react';
import { Crown } from 'lucide-react';
import { TIERS, User } from '../types/game';
import { useTheme } from './ThemeProvider';

interface TiersListProps {
  user: User | null;
}

export const TiersList: React.FC<TiersListProps> = ({ user }) => {
  const { currentTheme } = useTheme();

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Crown style={{ color: currentTheme.colors.accent }} />
        Tier System
      </h3>
      
      <div className="space-y-3">
        {TIERS.map((tier) => {
          const isUnlocked = user ? user.total_clicks >= tier.requirement : false;
          const isCurrent = user ? user.tier === tier.level : false;
          
          return (
            <div
              key={tier.level}
              className={`
                p-4 rounded-lg border transition-all duration-300
                ${isCurrent 
                  ? 'border-2 shadow-lg' 
                  : isUnlocked
                    ? 'bg-gray-700/50 border-gray-600/50'
                    : 'bg-gray-800/30 border-gray-700/30 opacity-60'
                }
              `}
              style={isCurrent ? {
                background: `linear-gradient(to right, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20)`,
                borderColor: `${currentTheme.colors.primary}80`,
                boxShadow: `0 10px 15px -3px ${currentTheme.colors.primary}20`
              } : {}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tier.icon}</span>
                  <div>
                    <h4 
                      className={`font-semibold ${
                        tier.color === 'rainbow' && isUnlocked
                          ? 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-pulse'
                          : ''
                      }`}
                      style={{ 
                        color: tier.color === 'rainbow' ? undefined : (isUnlocked ? tier.color : '#9CA3AF')
                      }}
                    >
                      {tier.name}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {tier.requirement.toLocaleString()} clicks required
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <span 
                      className="text-white text-xs px-2 py-1 rounded-full"
                      style={{ backgroundColor: currentTheme.colors.primary }}
                    >
                      Current
                    </span>
                  )}
                  {isUnlocked && !isCurrent && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                      Unlocked
                    </span>
                  )}
                  {!isUnlocked && (
                    <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};