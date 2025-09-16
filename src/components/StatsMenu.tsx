import React from 'react';
import { X, BarChart3, TrendingUp, Calendar, MessageSquare, Flame, ShoppingBag } from 'lucide-react';
import { User, UserStats, UserCurrency, GlobalStats, THEMES } from '../types/game';
import { useTheme } from './ThemeProvider';

interface StatsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  userStats: UserStats | null;
  userCurrency: UserCurrency | null;
  globalStats: GlobalStats | null;
}

export const StatsMenu: React.FC<StatsMenuProps> = ({
  isOpen,
  onClose,
  user,
  userStats,
  userCurrency,
  globalStats
}) => {
  const { currentTheme } = useTheme();

  if (!isOpen || !user) return null;

  // Calculate user's contribution to global sheep count
  const globalContribution = globalStats && globalStats.total_sheep > 0 
    ? ((user.total_clicks / globalStats.total_sheep) * 100)
    : 0;

  // Calculate average clicks per day
  const averageClicksPerDay = userStats && Object.keys(userStats.daily_click_history).length > 0
    ? Object.values(userStats.daily_click_history).reduce((sum, clicks) => sum + clicks, 0) / Object.keys(userStats.daily_click_history).length
    : 0;

  // Calculate current upgrades percentage
  const totalThemes = THEMES.length;
  const unlockedThemes = userCurrency?.unlocked_themes.length || 1;
  const upgradesPercentage = (unlockedThemes / totalThemes) * 100;

  // Get longest coin streak (use current consecutive days as longest if no specific tracking)
  const longestCoinStreak = Math.max(
    userStats?.longest_coin_streak || 0,
    userCurrency?.consecutive_days || 0
  );

  const stats = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "Global Contribution",
      value: `${globalContribution.toFixed(3)}%`,
      description: `${user.total_clicks.toLocaleString()} of ${globalStats?.total_sheep.toLocaleString() || 0} total sheep`
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Daily Average Clicks",
      value: averageClicksPerDay.toFixed(1),
      description: `Over ${userStats?.total_days_active || 1} active days`
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Highest Daily Clicks",
      value: (userStats?.highest_daily_clicks || 0).toLocaleString(),
      description: "Your best single-day performance"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: "Messages Sent",
      value: (userStats?.messages_sent || 0).toLocaleString(),
      description: "Total chat messages sent"
    },
    {
      icon: <Flame className="w-5 h-5" />,
      label: "Longest Coin Streak",
      value: `${longestCoinStreak} days`,
      description: "Best consecutive daily reward streak"
    },
    {
      icon: <ShoppingBag className="w-5 h-5" />,
      label: "Themes Unlocked",
      value: `${upgradesPercentage.toFixed(0)}%`,
      description: `${unlockedThemes} of ${totalThemes} themes owned`
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-700/50 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <BarChart3 style={{ color: currentTheme.colors.primary }} />
              Detailed Statistics
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-400 mt-2">Your complete performance overview</p>
        </div>

        {/* Stats Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-gray-700/30 backdrop-blur-sm rounded-xl p-5 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${currentTheme.colors.primary}20` }}
                  >
                    <div style={{ color: currentTheme.colors.primary }}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-1">{stat.label}</h3>
                    <div 
                      className="text-2xl font-bold mb-2"
                      style={{ color: currentTheme.colors.primary }}
                    >
                      {stat.value}
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistics Info
            </h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Statistics are updated in real-time as you play</li>
              <li>• Daily averages are calculated from your active playing days</li>
              <li>• Global contribution shows your impact on the worldwide sheep count</li>
              <li>• Streak tracking helps you maintain consistent daily rewards</li>
            </ul>
          </div>

          {/* Account Info */}
          {userStats?.first_click_date && (
            <div className="mt-4 p-4 bg-purple-600/10 border border-purple-500/30 rounded-lg">
              <h4 className="text-purple-400 font-medium mb-2">Account Timeline</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p>First click: {new Date(userStats.first_click_date).toLocaleDateString()}</p>
                <p>Last active: {userStats.last_active_date ? new Date(userStats.last_active_date).toLocaleDateString() : 'Today'}</p>
                <p>Total active days: {userStats.total_days_active}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};