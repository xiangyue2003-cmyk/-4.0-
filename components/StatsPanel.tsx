
import React from 'react';
import { PlayerStats, Act } from '../types';
import { Activity, Brain, Volume2 } from 'lucide-react';

interface StatsPanelProps {
  stats: PlayerStats;
  avatarUrl: string | null;
}

const StatRow: React.FC<{ label: string; subLabel: string; value: number; max: number; icon: React.ReactNode; color: string; danger?: boolean }> = ({ label, subLabel, value, max, icon, color, danger }) => {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  const isDanger = danger && (value / max) > 0.8; 
  
  return (
    <div className="flex flex-col mb-6 group">
      <div className="flex items-center space-x-3 mb-1 text-gray-400 group-hover:text-white transition-colors">
        <div className={`p-1.5 rounded-full bg-cyber-dark border border-gray-800 ${isDanger ? 'animate-pulse text-cyber-red border-cyber-red' : ''}`}>
          {icon}
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] font-sans">{subLabel}</span>
            <span className="font-serif italic text-lg leading-none">{label}</span>
        </div>
      </div>
      
      {/* Deepspace style bar */}
      <div className="flex items-center space-x-2 mt-1">
          <div className="h-[2px] w-full bg-gray-800 relative">
             <div 
                className="absolute top-0 left-0 h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                style={{ width: `${percent}%`, backgroundColor: isDanger ? '#ff003c' : color }}
             />
          </div>
          <span className="font-mono text-xs w-8 text-right opacity-70">{value}</span>
      </div>
    </div>
  );
};

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, avatarUrl }) => {
  return (
    <div className="hidden md:flex flex-col absolute top-0 left-0 h-full w-80 p-8 z-30 pointer-events-none">
       {/* Avatar / Profile Header */}
       <div className="mb-8 pl-4 flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full border-2 border-cyber-red/50 overflow-hidden relative shadow-[0_0_15px_rgba(255,0,60,0.2)]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Agent" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-cyber-dark flex items-center justify-center text-cyber-red font-mono text-xs">
                NO IMG
              </div>
            )}
             {/* Scan line effect on avatar */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyber-red/10 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-3xl font-serif italic text-white mb-0 text-glow">Godmother</h1>
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyber-red font-sans">
              TARGET: {stats.playerName || 'UNKNOWN'}
            </div>
          </div>
       </div>

       {/* Stats Container */}
       <div className="flex-1 flex flex-col justify-center border-l-2 border-gray-800 pl-6 ml-8">
          <StatRow 
            label="Synchronization" 
            subLabel="Vitality"
            value={stats.syncRate} 
            max={stats.maxSyncRate} 
            color="#00ff41"
            icon={<Activity size={14} />} 
          />
          <StatRow 
            label="Lucidity" 
            subLabel="Mental State"
            value={stats.lucidity} 
            max={stats.maxLucidity} 
            color="#00f3ff"
            icon={<Brain size={14} />} 
          />
          <StatRow 
            label="Noise Level" 
            subLabel="Detection Risk"
            value={stats.noiseLevel} 
            max={100} 
            color="#b026ff"
            danger={true}
            icon={<Volume2 size={14} />} 
          />
       </div>

       {/* Footer / Act Info */}
       <div className="mt-auto pl-8">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-sans">Current Phase</div>
          <div className="text-xl font-display text-cyber-blue border-b border-gray-800 pb-2 mb-2">
             {stats.currentAct}
          </div>
          <div className="flex justify-between text-xs font-mono text-gray-400">
             <span>LVL.{stats.level}</span>
             <span>INV: {stats.inventory.length}</span>
          </div>
       </div>
    </div>
  );
};
