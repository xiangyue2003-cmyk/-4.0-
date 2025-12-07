import React from 'react';
import { GameHistoryLog } from '../types';

interface TerminalProps {
  history: GameHistoryLog[];
  currentText: string;
  isTyping: boolean;
  sceneTitle?: string;
  godmotherAvatarUrl?: string | null;
}

export const Terminal: React.FC<TerminalProps> = ({ currentText, isTyping, sceneTitle, godmotherAvatarUrl }) => {
  return (
    <div className="w-full max-w-5xl mx-auto mb-4 pointer-events-none relative">
      
      {/* Scene Title Float */}
      <div className="mb-4 text-center md:text-left md:pl-8">
         <span className="inline-block px-4 py-1 bg-black/50 backdrop-blur-md border border-gray-800 text-xs font-sans tracking-[0.3em] uppercase text-cyber-blue">
            {sceneTitle || "System Link Established"}
         </span>
      </div>

      {/* Godmother Portrait - Right Side Overlay */}
      {godmotherAvatarUrl && (
        <div className="absolute -top-12 -right-2 md:-right-8 z-20 hidden md:block animate-fade-in">
          <div className="w-20 h-20 md:w-28 md:h-28 relative transform rotate-2 transition-transform duration-500 hover:rotate-0">
             {/* Glitch frames */}
             <div className="absolute inset-0 border border-cyber-red/50 translate-x-1 translate-y-1"></div>
             
             <div className={`w-full h-full bg-black border-2 border-cyber-red overflow-hidden relative transition-all duration-300 ${isTyping ? 'shadow-[0_0_20px_rgba(255,0,60,0.8)] border-white' : 'shadow-[0_0_10px_rgba(255,0,60,0.4)]'}`}>
                <img src={godmotherAvatarUrl} alt="Godmother" className="w-full h-full object-cover" />
                {/* Scanline overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-30 pointer-events-none"></div>
                {/* Active Speaking Indicator */}
                {isTyping && <div className="absolute inset-0 bg-cyber-red/10 animate-pulse"></div>}
             </div>
             
             {/* Name Tag */}
             <div className="absolute -bottom-2 -right-2 bg-cyber-red text-black text-[10px] font-bold px-2 py-0.5 font-display shadow-lg -rotate-3 border border-white">
                GODMOTHER
             </div>
          </div>
        </div>
      )}

      {/* Main Dialogue Box */}
      <div className="glass-panel p-6 md:p-8 min-h-[160px] relative overflow-hidden rounded-sm md:rounded-tr-3xl border-l-4 border-l-cyber-red">
        
        {/* Speaker Name Tag */}
        <div className="absolute top-0 left-0 transform -translate-y-1/2 ml-6 bg-cyber-red px-4 py-1 shadow-lg shadow-cyber-red/20">
           <span className="text-xs font-bold text-black uppercase tracking-widest font-display">
             System Log
           </span>
        </div>

        {/* Text Content */}
        <div className="font-serif text-lg md:text-xl leading-relaxed text-gray-100 text-shadow-sm">
          {currentText}
          {isTyping && <span className="inline-block w-2 h-5 bg-cyber-blue ml-2 animate-pulse align-middle"></span>}
        </div>

        {/* Decorative Grid */}
        <div className="absolute top-4 right-4 w-16 h-16 opacity-20 border-t border-r border-white"></div>
        <div className="absolute bottom-4 right-4 flex space-x-1">
           <div className="w-1 h-1 bg-white opacity-50 rounded-full"></div>
           <div className="w-1 h-1 bg-white opacity-50 rounded-full"></div>
           <div className="w-1 h-1 bg-white opacity-50 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};
