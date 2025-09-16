import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface SheepButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const SheepButton: React.FC<SheepButtonProps> = ({ onClick, disabled }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const { currentTheme } = useTheme();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);

    // Create particles
    const centerX = 0;
    const centerY = 0;
    
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: centerX + (Math.random() - 0.5) * 120,
      y: centerY + (Math.random() - 0.5) * 120
    }));

    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);

    onClick();
  };

  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          relative w-40 h-40 bg-gradient-to-br
          rounded-full shadow-2xl transition-all duration-200 text-6xl
          hover:scale-105 hover:shadow-lg
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isAnimating ? 'animate-pulse' : ''}
          border-4 border-white/20 backdrop-blur-sm
        `}
        style={{
          background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
          boxShadow: `0 25px 50px -12px ${currentTheme.colors.primary}40, 0 0 0 1px ${currentTheme.colors.primary}20`
        }}
      >
        🐑
        
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-full blur-xl -z-10" 
          style={{
            background: `linear-gradient(135deg, ${currentTheme.colors.primary}30, ${currentTheme.colors.secondary}30)`
          }}
        />
        
        {/* Click ripple effect */}
        {isAnimating && (
          <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping" />
        )}
      </button>

      {/* Particles */}
      {particles.map((particle) => (
        <Sparkles
          key={particle.id}
          className="absolute w-6 h-6 animate-ping pointer-events-none z-10"
          style={{
            color: currentTheme.colors.accent,
            left: `calc(50% + ${particle.x}px)`,
            top: `calc(50% + ${particle.y}px)`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};