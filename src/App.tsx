import React from 'react';
import { useGameState } from './hooks/useGameState';
import { THEMES } from './types/game';
import { SheepButton } from './components/SheepButton';
import { StatsDisplay } from './components/StatsDisplay';
import { Chat } from './components/Chat';
import { TiersList } from './components/TiersList';
import { WoolShop } from './components/WoolShop';
import { StatsMenu } from './components/StatsMenu';
import { ThemeProvider } from './components/ThemeProvider';
import { useTheme } from './components/ThemeProvider';
import { Leaderboard } from './components/Leaderboard';
import { CrochetShop } from './components/CrochetShop';
import { DeveloperMenu } from './components/DeveloperMenu';
import { Loader2, Wifi, WifiOff, Volume2, VolumeX, BarChart3, HelpCircle, EyeOff, Code, LogIn, LogOut } from 'lucide-react';
import { audioManager } from './utils/audioManager';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';

function getEmojiName(emoji: string | undefined): string {
  if (!emoji) return 'Sheep';

  const emojiToName: { [key: string]: string } = {
    "🐜": "Ant",
    "🦡": "Badger",
    "🦫": "Beaver",
    "🐝": "Bee",
    "🐦": "Bird",
    "🦋": "Butterfly",
    "🎠": "Carousel Horse",
    "🐈": "Cat",
    "🐥": "Chick",
    "🐕": "Dog",
    "🐬": "Dolphin",
    "🐉": "Dragon",
    "🦆": "Duck",
    "🐟": "Fish",
    "🦩": "Flamingo",
    "🐐": "Goat",
    "🦔": "Hedgehog",
    "🐎": "Horse",
    "🪼": "Jellyfish",
    "🐞": "Ladybug",
    "🐙": "Octopus",
    "🦦": "Otter",
    "🦉": "Owl",
    "🦜": "Parrot",
    "🦚": "Peacock",
    "🐧": "Penguin",
    "🐦‍🔥": "Phoenix",
    "🐩": "Poodle",
    "🐏": "Ram",
    "🐑": "Sheep",
    "🐚": "Shell",
    "🦐": "Shrimp",
    "🦨": "Skunk",
    "🦥": "Sloth",
    "🐌": "Snail",
    "🦑": "Squid",
    "🐿️": "Squirrel",
    "🦢": "Swan",
    "🦖": "T-Rex",
    "🐠": "Tropical Fish",
    "🦄": "Unicorn",
    "🐳": "Whale"
  };

  return emojiToName[emoji] || 'Animal';
}

function App() {
  const { user, userCurrency, userStats, globalStats, chatMessages, loading, error, incrementSheep, claimDailyReward, claimDailyGems, openEmbroideredBox, openEmbroideredBoxWithCoins, purchaseCollectible, selectCollectible, purchaseTheme, selectTheme, sendMessage, updateNickname, updateTier, isOffline } = useGameState();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading sheep network...</p>
          <p className="text-gray-400 text-sm mt-2">Connecting to the global sheep network</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider selectedTheme={userCurrency?.selected_theme || 'cosmic'}>
      <MainLayout 
        user={user}
        userCurrency={userCurrency}
        userStats={userStats}
        globalStats={globalStats}
        chatMessages={chatMessages}
        error={error}
        incrementSheep={incrementSheep}
        claimDailyReward={claimDailyReward}
        purchaseTheme={purchaseTheme}
        selectTheme={selectTheme}
        claimDailyGems={claimDailyGems}
        openEmbroideredBox={openEmbroideredBox}
        openEmbroideredBoxWithCoins={openEmbroideredBoxWithCoins}
        purchaseCollectible={purchaseCollectible}
        selectCollectible={selectCollectible}
        sendMessage={sendMessage}
        updateNickname={updateNickname}
        updateTier={updateTier}
        isOffline={isOffline}
        loading={loading}
      />
    </ThemeProvider>
  );
}

function MainLayout({ user, userCurrency, userStats, globalStats, chatMessages, error, incrementSheep, claimDailyReward, purchaseTheme, selectTheme, claimDailyGems, openEmbroideredBox, openEmbroideredBoxWithCoins, purchaseCollectible, selectCollectible, sendMessage, updateNickname, updateTier, isOffline, loading }: {
  user: any;
  userCurrency: any;
  userStats: any;
  globalStats: any;
  chatMessages: any;
  error: string | null;
  incrementSheep: () => void;
  claimDailyReward: () => void;
  purchaseTheme: (themeId: string) => void;
  selectTheme: (themeId: string) => void;
  claimDailyGems: () => void;
  openEmbroideredBox: (boxType: 'daily' | 'purchased') => Promise<any>;
  openEmbroideredBoxWithCoins: (boxType: 'daily' | 'purchased') => Promise<any>;
  purchaseCollectible: (collectibleId: string) => Promise<boolean>;
  selectCollectible: (collectibleId: string, type: 'sheep_emoji' | 'particle') => Promise<void>;
  sendMessage: (message: string) => void;
  updateNickname: (nickname: string) => void;
  updateTier: (tier: number) => void;
  isOffline: boolean;
  loading: boolean;
}) {
  const [soundEnabled, setSoundEnabled] = React.useState(audioManager.isAudioEnabled());
  const [hintsEnabled, setHintsEnabled] = React.useState(() => {
    const saved = localStorage.getItem('hintsEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showStatsMenu, setShowStatsMenu] = React.useState(false);
  const [showDeveloperMenu, setShowDeveloperMenu] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const { currentTheme } = useTheme();
  const { isAuthenticated, username, logout } = useAuth();

  const isDeveloper = user && ['SheepDev', 'SheepDev2', 'SheepDev3'].includes(user.nickname);

  const toggleSound = () => {
    audioManager.playGuiSound();
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    audioManager.setEnabled(newState);
    
    // Play a test sound when enabling
    if (newState) {
      setTimeout(() => audioManager.playClickSound(), 100);
    }
  };

  const toggleHints = () => {
    audioManager.playGuiSound();
    const newState = !hintsEnabled;
    setHintsEnabled(newState);
    localStorage.setItem('hintsEnabled', JSON.stringify(newState));
  };

  const toggleStatsMenu = () => {
    audioManager.playGuiSound();
    setShowStatsMenu(!showStatsMenu);
  };

  const toggleDeveloperMenu = () => {
    audioManager.playGuiSound();
    setShowDeveloperMenu(!showDeveloperMenu);
  };

  const handleAuthClick = () => {
    audioManager.playGuiSound();
    if (isAuthenticated) {
      logout();
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="relative">
      {error && (
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error: {error}</div>
          <div className="text-gray-400 text-sm">
            The app is running in offline mode. Some features may be limited.
          </div>
        </div>
      )}
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #8B5CF6 0%, transparent 50%), radial-gradient(circle at 75% 75%, #EC4899 0%, transparent 50%)',
          backgroundSize: '400px 400px'
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className={`text-5xl font-bold bg-gradient-to-r ${currentTheme.gradient} bg-clip-text text-transparent mb-4`}>
            🐑 Global Sheep Clicker 🐑
          </h1>
          {isOffline && (
            <div className="text-yellow-400 text-sm mb-4 px-4 py-2 bg-yellow-900/20 rounded-lg border border-yellow-700/30">
              ⚠️ Running in offline mode - Connect to Supabase for full functionality
            </div>
          )}
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Join players worldwide in the ultimate sheep counting adventure! 
            Click, chat, and climb the ranks in this multiplayer clicker experience.
          </p>
          
          {/* Connection status */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {isOffline ? (
              <>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">Offline - some features may be limited</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">Connected to global network</span>
              </>
            )}
          </div>
        </header>

        {/* Top Right Buttons */}
        <div className="fixed top-4 right-4 z-40 flex flex-col gap-2 items-end">
          <button
            onClick={handleAuthClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all shadow-lg hover:scale-105"
            style={{
              backgroundColor: isAuthenticated ? '#10b98190' : `${currentTheme.colors.secondary}90`,
              backdropFilter: 'blur(10px)',
              border: isAuthenticated ? '1px solid #10b98130' : `1px solid ${currentTheme.colors.secondary}30`
            }}
          >
            {isAuthenticated ? (
              <>
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">{username}</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span className="hidden sm:inline">Log In</span>
              </>
            )}
          </button>
          <button
            onClick={toggleStatsMenu}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all shadow-lg hover:scale-105"
            style={{
              backgroundColor: `${currentTheme.colors.primary}90`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${currentTheme.colors.primary}30`
            }}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="hidden sm:inline">Stats</span>
          </button>
          {isDeveloper && (
            <button
              onClick={toggleDeveloperMenu}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all shadow-lg hover:scale-105"
              style={{
                backgroundColor: '#DC262690',
                backdropFilter: 'blur(10px)',
                border: '1px solid #DC262630'
              }}
            >
              <Code className="w-5 h-5" />
              <span className="hidden sm:inline">Dev</span>
            </button>
          )}
        </div>

        {/* Stats Menu */}
        <StatsMenu
          isOpen={showStatsMenu}
          onClose={() => setShowStatsMenu(false)}
          user={user}
          userStats={userStats}
          userCurrency={userCurrency}
          globalStats={globalStats}
          hintsEnabled={hintsEnabled}
        />

        {/* Developer Menu */}
        {isDeveloper && (
          <DeveloperMenu
            isOpen={showDeveloperMenu}
            onClose={() => setShowDeveloperMenu(false)}
            user={user}
            userCurrency={userCurrency}
            isOffline={isOffline}
          />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Stats */}
          <div className="space-y-8 xl:order-1">
            <StatsDisplay 
              globalStats={globalStats} 
              user={user} 
              onUpdateNickname={updateNickname}
              onUpdateTier={updateTier}
            />
            {/* Tiers list - hidden on mobile, shown on desktop */}
            <div className="hidden lg:block">
              <TiersList user={user} />
            </div>
          </div>

          {/* Center Column - Main Game */}
          <div className="flex flex-col items-center justify-center space-y-12 xl:order-2">
            <div className="text-center">
              <h2 className={`text-4xl font-bold mb-8 ${
                user && user.tier === 9
                  ? 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent'
                  : ''
              }`}>
                Click the {getEmojiName(userCurrency?.selected_sheep_emoji)}!
              </h2>
              <SheepButton onClick={incrementSheep} disabled={isOffline} userCurrency={userCurrency} />
              {hintsEnabled && (
                <p className="text-gray-400 mt-6 text-base">
                  Every click counts towards the global total
                </p>
              )}
            </div>

            {/* Welcome message for new users */}
            {user && user.total_clicks === 0 && (
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4 text-center max-w-md">
                <h3 className="font-semibold mb-2">Welcome, {user.nickname}! 🎉</h3>
                <p className="text-sm text-gray-300">
                  You're now part of the global sheep clicking community. 
                  Start clicking to earn tiers and unlock chat perks!
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Chat and Wool Shop */}
          <div className="space-y-8 xl:order-3">
            <Leaderboard 
              currentUser={user}
              isOffline={isOffline}
              hintsEnabled={hintsEnabled}
            />
            <Chat 
              messages={chatMessages} 
              onSendMessage={sendMessage}
              disabled={loading || isOffline}
              isOffline={isOffline}
            />

            {/* Wool Shop - shown under chat on desktop */}
            {user && user.tier >= 1 && userCurrency && (
              <div className="hidden lg:block">
                <WoolShop
                  userCurrency={userCurrency}
                  onClaimDailyReward={claimDailyReward}
                  onPurchaseTheme={purchaseTheme}
                  onSelectTheme={selectTheme}
                  disabled={loading || isOffline}
                  hintsEnabled={hintsEnabled}
                />
              </div>
            )}
            {/* Crochet Shop - shown under wool shop on desktop when unlocked */}
            {user && user.tier >= 5 && userCurrency && (
              <div className="hidden lg:block">
                <CrochetShop
                  userCurrency={userCurrency}
                  onClaimDailyGems={claimDailyGems}
                  onOpenBox={openEmbroideredBox}
                  onOpenBoxWithCoins={openEmbroideredBoxWithCoins}
                  onPurchaseCollectible={purchaseCollectible}
                  onSelectCollectible={selectCollectible}
                  disabled={loading || isOffline}
                  hintsEnabled={hintsEnabled}
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile/Tablet Wool Shop - shown when not on desktop */}
        {user && user.tier >= 1 && userCurrency && (
          <div className="lg:hidden mt-8">
            <WoolShop
              userCurrency={userCurrency}
              onClaimDailyReward={claimDailyReward}
              onPurchaseTheme={purchaseTheme}
              onSelectTheme={selectTheme}
              disabled={loading || isOffline}
              hintsEnabled={hintsEnabled}
            />
            
          </div>
        )}

        {/* Mobile/Tablet Crochet Shop - shown when not on desktop and unlocked */}
        {user && user.tier >= 5 && userCurrency && (
          <div className="lg:hidden mt-8">
            <CrochetShop
              userCurrency={userCurrency}
              onClaimDailyGems={claimDailyGems}
              onOpenBox={openEmbroideredBox}
              onOpenBoxWithCoins={openEmbroideredBoxWithCoins}
              onPurchaseCollectible={purchaseCollectible}
              onSelectCollectible={selectCollectible}
              disabled={loading || isOffline}
              hintsEnabled={hintsEnabled}
            />
          </div>
        )}

        {/* Mobile Tiers List - shown only on mobile, placed at bottom */}
        <div className="lg:hidden mt-8">
          <TiersList user={user} />
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm space-y-4">          
          <p>Made with 💜 for the global sheep community</p>
          <p className="mt-1">Keep clicking, keep chatting, keep counting!</p>
          
          {/* Sound Settings - moved to bottom */}
          <div className="flex justify-center pt-4 border-t border-gray-700/30">
            <div className="flex items-center gap-6">
              <span className="text-gray-400 text-xs">Sound Effects:</span>
              <button
                onClick={toggleSound}
                className={`
                  flex items-center gap-2 px-3 py-1 rounded-lg transition-all text-xs
                  ${soundEnabled 
                    ? 'border' 
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 border border-gray-600/30'
                  }
                `}
                style={soundEnabled ? {
                  backgroundColor: `${currentTheme.colors.primary}20`,
                  color: currentTheme.colors.primary,
                  borderColor: `${currentTheme.colors.primary}50`
                } : {}}
              >
                {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                <span>{soundEnabled ? 'On' : 'Off'}</span>
              </button>
              
              <span className="text-gray-400 text-xs">Hint Boxes:</span>
              <button
                onClick={toggleHints}
                className={`
                  flex items-center gap-2 px-3 py-1 rounded-lg transition-all text-xs
                  ${hintsEnabled 
                    ? 'border' 
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 border border-gray-600/30'
                  }
                `}
                style={hintsEnabled ? {
                  backgroundColor: `${currentTheme.colors.primary}20`,
                  color: currentTheme.colors.primary,
                  borderColor: `${currentTheme.colors.primary}50`
                } : {}}
              >
                {hintsEnabled ? <HelpCircle className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{hintsEnabled ? 'On' : 'Off'}</span>
              </button>
            </div>
          </div>
        </footer>

        {/* Mobile footer spacer to prevent "made in bolt" button overlap */}
        <div className="block sm:hidden h-16"></div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

export default App;
