import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { TITLES } from '../types/game';
import { audioManager } from '../utils/audioManager';

interface TitlesMenuProps {
  totalClicks: number;
  selectedTitle: string | null;
  unlockedTitles: string[];
  showTitle: boolean;
  currentTier: number;
  nickname: string;
  onSelectTitle: (titleId: string | null) => void;
  onToggleShowTitle: (show: boolean) => void;
}

export const TitlesMenu = ({
  totalClicks,
  selectedTitle,
  unlockedTitles,
  showTitle,
  currentTier,
  nickname,
  onSelectTitle,
  onToggleShowTitle
}: TitlesMenuProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const isDeveloper = ['SheepDev', 'SheepDev2', 'SheepDev3'].includes(nickname);
  const hasSheepGodTier = currentTier >= 9;

  if (!hasSheepGodTier && !isDeveloper) {
    return null;
  }

  const handleToggleExpand = () => {
    audioManager.playGuiSound();
    setIsExpanded(!isExpanded);
  };

  const handleSelectTitle = (titleId: string) => {
    audioManager.playGuiSound();
    if (selectedTitle === titleId) {
      onSelectTitle(null);
    } else {
      onSelectTitle(titleId);
    }
  };

  const handleToggleVisibility = () => {
    audioManager.playGuiSound();
    onToggleShowTitle(!showTitle);
  };

  const isTitleUnlocked = (titleId: string, requirement: number) => {
    if (isDeveloper) return true;
    return totalClicks >= requirement || unlockedTitles.includes(titleId);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          Titles System
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleVisibility}
            className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
            title={showTitle ? 'Hide title' : 'Show title'}
          >
            {showTitle ? (
              <Eye className="w-4 h-4 text-white" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-400" />
            )}
          </button>
          <button
            onClick={handleToggleExpand}
            className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-white" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          <p className="text-sm text-slate-300 mb-4">
            Unlock special titles and emojis by reaching click milestones. Selected title will appear before your username!
          </p>

          <div className="grid grid-cols-2 gap-3">
            {TITLES.map((title) => {
              const unlocked = isTitleUnlocked(title.id, title.requirement);
              const isSelected = selectedTitle === title.id;

              return (
                <button
                  key={title.id}
                  onClick={() => unlocked && handleSelectTitle(title.id)}
                  disabled={!unlocked}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${isSelected
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : unlocked
                        ? 'border-slate-600 bg-slate-700/30 hover:bg-slate-700/50 hover:border-slate-500'
                        : 'border-slate-700/50 bg-slate-800/30 cursor-not-allowed opacity-50'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className={`text-3xl ${!unlocked && 'grayscale opacity-30'}`}>
                      {unlocked ? title.emoji : '❓'}
                    </span>
                    <div className="text-center">
                      <p
                        className="font-semibold text-sm"
                        style={{
                          color: unlocked ? title.color : '#64748b',
                          fontStyle: 'italic'
                        }}
                      >
                        {unlocked ? title.name : '???'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {unlocked
                          ? `${title.requirement.toLocaleString()} clicks`
                          : `Reach ${title.requirement.toLocaleString()}`
                        }
                      </p>
                    </div>
                    {isSelected && (
                      <div className="text-xs text-yellow-400 font-semibold">
                        Selected
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {isDeveloper && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300">
                🛠️ Developer Mode: All titles unlocked for testing
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
