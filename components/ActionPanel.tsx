import React, { useState, useRef } from 'react';
import { Choice } from '../types';
import { ChevronRight } from 'lucide-react';

interface ActionPanelProps {
  choices: Choice[];
  onSelect: (choice: Choice, mode: 'silent' | 'loud') => void;
  disabled: boolean;
  noiseLevel: number;
  onPlaySfx?: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ choices, onSelect, disabled, onPlaySfx }) => {
  const [holdingId, setHoldingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  const HOLD_DURATION = 1500;

  const startHold = (id: string) => {
    if (disabled) return;
    if (onPlaySfx) onPlaySfx();
    setHoldingId(id);
    startTimeRef.current = Date.now();
    setProgress(0);

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setProgress(newProgress);

      if (elapsed < HOLD_DURATION) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        endHold(id, true);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const endHold = (id: string, completed: boolean = false) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setHoldingId(null);
    setProgress(0);

    if (disabled) return;

    if (completed) {
      onSelect(choices.find(c => c.id === id)!, 'silent');
    } else {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed < HOLD_DURATION && elapsed > 50) {
        onSelect(choices.find(c => c.id === id)!, 'loud');
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-0 pb-8 flex flex-col items-end z-40 pointer-events-auto">
      <div className="flex flex-col gap-3 w-full md:w-1/2 lg:w-1/3">
        {choices.map((choice) => {
          const isHolding = holdingId === choice.id;
          
          return (
            <button
              key={choice.id}
              onMouseDown={() => startHold(choice.id)}
              onMouseUp={() => isHolding && endHold(choice.id)}
              onMouseLeave={() => isHolding && endHold(choice.id, false)}
              onTouchStart={() => startHold(choice.id)}
              onTouchEnd={(e) => { e.preventDefault(); isHolding && endHold(choice.id); }}
              disabled={disabled}
              className={`
                group relative h-14 w-full overflow-hidden transition-all duration-300
                clip-path-slant bg-black/40 backdrop-blur-md border border-white/10
                hover:bg-white/10 hover:border-cyber-blue/50
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 95% 100%, 0 100%)' }}
            >
              {/* Progress Background */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyber-purple/40 to-transparent transition-all duration-75 ease-linear"
                style={{ width: isHolding ? `${progress}%` : '0%' }}
              />

              <div className="absolute inset-0 flex items-center justify-between px-6">
                <div className="flex flex-col items-start">
                   <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase group-hover:text-cyber-blue transition-colors">
                     {isHolding ? 'STEALTH EXECUTION' : 'INITIATE'}
                   </span>
                   <span className="font-sans font-semibold tracking-wide text-sm md:text-base text-gray-200 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all">
                     {choice.text}
                   </span>
                </div>
                
                <ChevronRight 
                   size={18} 
                   className={`text-gray-500 transition-transform duration-300 ${isHolding ? 'translate-x-1 text-cyber-purple' : 'group-hover:translate-x-1 group-hover:text-cyber-blue'}`} 
                />
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-2 text-[10px] text-gray-400 font-mono tracking-widest w-full md:w-1/2 lg:w-1/3 text-right pr-2">
         PRESS FOR ACTION / <span className="text-cyber-purple">HOLD FOR STEALTH</span>
      </div>
    </div>
  );
};