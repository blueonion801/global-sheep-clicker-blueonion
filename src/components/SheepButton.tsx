import React, { useState } from 'react';
import { UserCurrency } from '../types/game';
import { useTheme } from './ThemeProvider';

interface SheepButtonProps {
  onClick: () => void;
  disabled?: boolean;
  userCurrency?: UserCurrency | null;
}

export const SheepButton: React.FC<SheepButtonProps> = ({ onClick, disabled, userCurrency }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; emoji: string; delay: number; scale: number }>>([]);
  const { currentTheme } = useTheme();

  const sheepEmoji = userCurrency?.selected_sheep_emoji || '🐑';
  const particleEmoji = userCurrency?.selected_particle || '✧';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Create particles with more spread and variation
    const centerX = 0;
    const centerY = 0;
    
    const newParticles = Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const distance = 80 + Math.random() * 120; // Spread particles further
      const x = centerX + Math.cos(angle) * distance + (Math.random() - 0.5) * 60;
      const y = centerY + Math.sin(angle) * distance + (Math.random() - 0.5) * 60;
      
      return {
      id: Date.now() + i,
        x: x,
        y: y,
        emoji: particleEmoji,
        delay: Math.random() * 0.3, // Stagger particle animations
        scale: 0.8 + Math.random() * 0.6 // Vary particle sizes
      };
    });

    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000); // Keep particles visible longer

    onClick();
  };

  return (
    <div className="relative flex items-center justify-center overflow-visible">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          relative w-40 h-40 bg-gradient-to-br z-10
          rounded-full shadow-2xl transition-all duration-300 text-6xl
          hover:scale-110 hover:shadow-xl active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isAnimating ? 'scale-110' : ''}
          border-4 border-white/20 backdrop-blur-sm
        `}
        style={{
          background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
          boxShadow: `0 25px 50px -12px ${currentTheme.colors.primary}40, 0 0 0 1px ${currentTheme.colors.primary}20, ${isAnimating ? `0 0 60px ${currentTheme.colors.primary}60` : ''}`
        }}
      >
        {sheepEmoji}
        
        {/* Glow effect */}
        <div 
          className={`absolute inset-0 rounded-full blur-xl -z-10 transition-all duration-300 ${isAnimating ? 'scale-125' : 'scale-100'}`}
          style={{
            background: `radial-gradient(circle, ${currentTheme.colors.primary}${isAnimating ? '50' : '30'}, ${currentTheme.colors.secondary}${isAnimating ? '50' : '30'})`
          }}
        />
        
        {/* Enhanced click ripple effects */}
        {isAnimating && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-white/60 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping animation-delay-150" />
            <div className="absolute -inset-4 rounded-full border-2 border-white/20 animate-ping animation-delay-300" />
          </>
        )}
      </button>

      {/* Enhanced particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none z-20 select-none animate-particle-float"
          style={{
            color: currentTheme.colors.accent,
            fontSize: `${1.5 + particle.scale}rem`,
            left: `calc(50% + ${particle.x}px)`,
            top: `calc(50% + ${particle.y}px)`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${particle.delay}s`,
            animationDuration: '2s',
            textShadow: `0 0 10px ${currentTheme.colors.accent}80`
          }}
        >
          {particle.emoji}
        </div>
      ))}
      
      {/* Additional visual feedback ring */}
      {isAnimating && (
        <div 
          className="absolute inset-0 rounded-full animate-pulse pointer-events-none -z-10"
          style={{
            background: `radial-gradient(circle, ${currentTheme.colors.primary}20, ${currentTheme.colors.secondary}20, transparent 70%)`,
            filter: 'blur(2px)',
            transform: 'scale(1.3)'
          }}
        />
      )}
      
      <style jsx>{`
        @keyframes particle-float {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2) rotate(90deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8) rotate(360deg);
          }
        }
        
        .animate-particle-float {
          animation: particle-float 2s ease-out forwards;
        }
        
        .animation-delay-150 {
          animation-delay: 0.15s;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
};