import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User, TIERS } from '../types/game';
import { useTheme } from './ThemeProvider';
import { audioManager } from '../utils/audioManager';

interface LeaderboardProps {
  currentUser: User | null;
  isOffline: boolean;
  hintsEnabled?: boolean;
}

interface LeaderboardEntry {
  id: string;
  nickname: string;
  total_clicks: number;
  tier: number;
  rank: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser, isOffline, hintsEnabled = true }) => {
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('leaderboardExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const { currentTheme } = useTheme();

  const fetchLeaderboard = async () => {
    if (isOffline) {
      // Mock data for offline mode
      const mockData: LeaderboardEntry[] = [
        { id: '1', nickname: 'SheepMaster', total_clicks: 50000, tier: 8, rank: 1 },
        { id: '2', nickname: 'WoolKing', total_clicks: 35000, tier: 7, rank: 2 },
        { id: '3', nickname: 'FlockHero', total_clicks: 25000, tier: 6, rank: 3 }
      ];
      setTopPlayers(mockData);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nickname, total_clicks, tier')
        .order('total_clicks', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Failed to fetch leaderboard:', error);
        return;
      }

      const leaderboardData: LeaderboardEntry[] = (data || []).map((user, index) => ({
        ...user,
        rank: index + 1
      }));

      setTopPlayers(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [isOffline]);

  useEffect(() => {
    if (isOffline) return;

    // Set up real-time subscription for leaderboard updates
    const subscription = supabase
      .channel('leaderboard_updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users'
      }, () => {
        // Refetch leaderboard when any user updates
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isOffline]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-6 h-6 text-gray-500" />;
    }
  };

  const getRankColors = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'from-yellow-500/20 to-amber-500/20',
          border: 'border-yellow-500/50',
          text: 'text-yellow-400',
          glow: 'shadow-yellow-500/25'
        };
      case 2:
        return {
          bg: 'from-gray-400/20 to-slate-400/20',
          border: 'border-gray-400/50',
          text: 'text-gray-300',
          glow: 'shadow-gray-400/25'
        };
      case 3:
        return {
          bg: 'from-amber-600/20 to-orange-600/20',
          border: 'border-amber-600/50',
          text: 'text-amber-500',
          glow: 'shadow-amber-600/25'
        };
      default:
        return {
          bg: 'from-gray-700/20 to-gray-600/20',
          border: 'border-gray-600/50',
          text: 'text-gray-400',
          glow: 'shadow-gray-600/25'
        };
    }
  };

  const getTierInfo = (tierLevel: number) => {
    return TIERS.find(t => t.level === tierLevel) || TIERS[0];
  };

  const isCurrentUser = (playerId: string) => {
    return currentUser?.id === playerId;
  };

  const toggleExpanded = () => {
    audioManager.playGuiSound();
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('leaderboardExpanded', JSON.stringify(newState));
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy style={{ color: currentTheme.colors.accent }} />
            Top Sheep Clickers
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
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-700/50 rounded-lg p-4 h-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy style={{ color: currentTheme.colors.accent }} />
          Top Sheep Clickers
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
      
      {isExpanded && isOffline && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
          <p className="text-yellow-400 text-sm">
            ⚠️ Showing sample data - Connect to see real leaderboard
          </p>
        </div>
      )}

      {isExpanded && (<div className="space-y-3">
        {topPlayers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No players yet. Be the first to climb the ranks!</p>
          </div>
        ) : (
          topPlayers.map((player) => {
            const rankColors = getRankColors(player.rank);
            const tierInfo = getTierInfo(player.tier);
            const isCurrentUserEntry = isCurrentUser(player.id);
            
            return (
              <div
                key={player.id}
                className={`
                  relative p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02]
                  bg-gradient-to-r ${rankColors.bg} ${rankColors.border} shadow-lg ${rankColors.glow}
                  ${isCurrentUserEntry ? 'ring-2 ring-offset-2 ring-offset-gray-800' : ''}
                `}
                style={isCurrentUserEntry ? {
                  ringColor: currentTheme.colors.primary
                } : {}}
              >
                {/* Rank indicator */}
                <div className="absolute -top-2 -left-2 z-10">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    bg-gradient-to-br ${rankColors.bg} ${rankColors.border} border-2
                  `}>
                    {player.rank}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getRankIcon(player.rank)}
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{tierInfo.icon}</span>
                        <h4 
                          className={`font-bold truncate ${
                            tierInfo.color === 'rainbow'
                              ? 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent'
                              : isCurrentUserEntry ? '' : 'text-white'
                          }`}
                          style={{ 
                            color: tierInfo.color === 'rainbow' ? undefined : 
                                   isCurrentUserEntry ? currentTheme.colors.primary :
                                   tierInfo.color === '#FFFFFF' ? '#FFFFFF' : tierInfo.color
                          }}
                        >
                          {player.nickname}
                          {isCurrentUserEntry && (
                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-current/20">
                              You
                            </span>
                          )}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span 
                          className={`text-sm font-medium ${tierInfo.color === 'rainbow' ? 'text-gray-300' : ''}`}
                          style={{ 
                            color: tierInfo.color === 'rainbow' ? undefined : tierInfo.color
                          }}
                        >
                          {tierInfo.name}
                        </span>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-gray-300 text-sm">
                          {player.total_clicks.toLocaleString()} clicks
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className={`text-2xl font-bold ${rankColors.text}`}>
                      #{player.rank}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>Live</span>
                    </div>
                  </div>
                </div>

                {/* Special effects for #1 */}
                {player.rank === 1 && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 animate-pulse pointer-events-none" />
                )}
              </div>
            );
          })
        )}
      </div>)}

      {/* Info section */}
      {isExpanded && hintsEnabled && (<div className="mt-4 p-3 bg-blue-600/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-400 text-sm font-medium mb-1">🏆 Leaderboard Info</p>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• Rankings update in real-time as players click</li>
          <li>• Only the top 3 players are shown</li>
          <li>• Your position is highlighted when you're in the top 3</li>
        </ul>
      </div>
    )}</div>
  );
};