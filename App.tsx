
import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from './components/Terminal';
import { ActionPanel } from './components/ActionPanel';
import { SettingsModal } from './components/SettingsModal';
import { GeminiGameEngine } from './services/geminiService';
import { GameState, PlayerStats, Scene, GameHistoryLog, Choice, Act, UserConfig } from './types';
import { Settings, User } from 'lucide-react';

const INITIAL_STATS: PlayerStats = {
  playerName: '',
  syncRate: 100,
  maxSyncRate: 100,
  lucidity: 100,
  maxLucidity: 100,
  noiseLevel: 10,
  godmotherHp: 100,
  maxGodmotherHp: 100,
  inventory: [],
  level: 1,
  currentAct: Act.ONE
};

const INITIAL_CONFIG: UserConfig = {
  avatarUrl: null,
  godmotherAvatarUrl: null,
  godmotherSpriteUrl: null,
  bgmTracks: {
    menu: null,
    [Act.ONE]: null,
    [Act.TWO]: null,
    [Act.THREE]: null,
    [Act.FOUR]: null
  },
  sfxTracks: {
    click: null,
    confirm: null,
    alert: null
  },
  sceneBackgrounds: {
    menu: null,
    [Act.ONE]: null,
    [Act.TWO]: null,
    [Act.THREE]: null,
    [Act.FOUR]: null
  },
  bgmVolume: 0.3,
  sfxEnabled: true
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  
  // Gameplay State
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [history, setHistory] = useState<GameHistoryLog[]>([]);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  
  // Setup inputs
  const [inputName, setInputName] = useState('');

  // Config & Settings
  const [userConfig, setUserConfig] = useState<UserConfig>(() => {
    const saved = localStorage.getItem('userConfig');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const engineRef = useRef<GeminiGameEngine | null>(null);
  
  // AUDIO ENGINE: Dual Decks for Crossfading
  const deckA = useRef<HTMLAudioElement | null>(null);
  const deckB = useRef<HTMLAudioElement | null>(null);
  const activeDeckRef = useRef<'A' | 'B'>('A');
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const sfxCtxRef = useRef<AudioContext | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('userConfig', JSON.stringify(userConfig));
  }, [userConfig]);

  // Audio Logic (BGM Crossfade)
  useEffect(() => {
    // Initialize Decks
    if (!deckA.current) { deckA.current = new Audio(); deckA.current.loop = true; }
    if (!deckB.current) { deckB.current = new Audio(); deckB.current.loop = true; }

    let targetTrack: string | null = null;
    if (gameState === GameState.SETUP) {
      targetTrack = userConfig.bgmTracks.menu;
    } else if (gameState === GameState.PLAYING || gameState === GameState.LOADING) {
      targetTrack = userConfig.bgmTracks[stats.currentAct];
    }

    const masterVol = userConfig.bgmVolume;
    const activeDeck = activeDeckRef.current === 'A' ? deckA.current : deckB.current;
    const inactiveDeck = activeDeckRef.current === 'A' ? deckB.current : deckA.current;

    // Determine if we need to switch tracks
    const currentSrc = activeDeck.getAttribute('src');
    
    // Logic: 
    // 1. If targetTrack is null, fade out active.
    // 2. If targetTrack is different from active, crossfade.
    // 3. If targetTrack is same, just update volume.

    if (!targetTrack) {
       // Just fade out active
       fadeOut(activeDeck);
       return;
    }

    if (targetTrack !== currentSrc) {
       console.log(`[Audio] Switching from ${currentSrc} to ${targetTrack}`);
       // Prepare Inactive Deck
       inactiveDeck.src = targetTrack;
       inactiveDeck.volume = 0;
       inactiveDeck.play().catch(e => console.warn("Autoplay blocked", e));

       // Start Crossfade
       if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
       
       const FADE_TIME = 2000; // 2 seconds
       const STEPS = 20;
       const intervalTime = FADE_TIME / STEPS;
       let step = 0;

       fadeIntervalRef.current = setInterval(() => {
          step++;
          const ratio = step / STEPS;
          
          // Fade In New
          inactiveDeck.volume = Math.min(masterVol, ratio * masterVol);
          // Fade Out Old
          activeDeck.volume = Math.max(0, masterVol - (ratio * masterVol));

          if (step >= STEPS) {
             if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
             activeDeck.pause();
             activeDeckRef.current = activeDeckRef.current === 'A' ? 'B' : 'A'; // Swap active ref
          }
       }, intervalTime);
    } else {
      // Just update volume if track is same (e.g. user moved slider)
      if (fadeIntervalRef.current === null) {
         activeDeck.volume = masterVol;
      }
    }

  }, [userConfig.bgmTracks, userConfig.bgmVolume, gameState, stats.currentAct]);

  const fadeOut = (audio: HTMLAudioElement) => {
    const startVol = audio.volume;
    if (startVol <= 0) {
      audio.pause();
      return;
    }
    const FADE_TIME = 1000;
    const STEPS = 10;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      audio.volume = Math.max(0, startVol * (1 - step/STEPS));
      if (step >= STEPS) {
        clearInterval(interval);
        audio.pause();
      }
    }, FADE_TIME/STEPS);
  };

  const handleConfigUpdate = (newConfig: Partial<UserConfig>) => {
    setUserConfig(prev => ({ ...prev, ...newConfig }));
  };

  // SFX Logic
  const playSfx = (type: 'click' | 'confirm' | 'alert') => {
    if (!userConfig.sfxEnabled) return;

    // 1. Try playing custom uploaded file
    const customSrc = userConfig.sfxTracks?.[type];
    if (customSrc) {
      const audio = new Audio(customSrc);
      audio.volume = 0.5;
      audio.play().catch(e => console.warn("SFX Play failed", e));
      return;
    }

    // 2. Fallback to Synth
    if (!sfxCtxRef.current) {
      sfxCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = sfxCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'confirm') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  };

  // Typewriter
  useEffect(() => {
    if (currentScene?.narrative) {
      setDisplayedText('');
      let i = 0;
      const text = currentScene.narrative;
      const speed = 20; 
      const interval = setInterval(() => {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }
  }, [currentScene]);

  const updateAct = (level: number): Act => {
    if (level < 4) return Act.ONE;
    if (level < 7) return Act.TWO;
    if (level < 10) return Act.THREE;
    return Act.FOUR;
  };

  const startGame = async () => {
    playSfx('confirm');
    const finalName = inputName.trim() || "迷失者";

    setStats({ ...INITIAL_STATS, playerName: finalName });
    setGameState(GameState.LOADING);
    engineRef.current = new GeminiGameEngine();

    try {
      const startScene = await engineRef.current.startGame(finalName);
      await handleNewScene(startScene);
      setGameState(GameState.PLAYING);
    } catch (error) {
      console.error(error);
      playSfx('alert');
      alert("启动失败。请重试。");
      setGameState(GameState.SETUP);
    }
  };

  const handleRestart = () => {
    playSfx('alert');
    setIsSettingsOpen(false);
    setGameState(GameState.SETUP);
    setStats({ ...INITIAL_STATS });
    setHistory([]);
    setCurrentScene(null);
    setDisplayedText('');
    setInputName('');
  };

  const handleChoice = async (choice: Choice, mode: 'silent' | 'loud') => {
    if (!engineRef.current || !currentScene) return;

    playSfx('click');

    const newHistory: GameHistoryLog[] = [
      ...history,
      { 
        role: 'system', 
        content: currentScene.narrative,
        image: currentScene.imageUrl
      },
      { 
        role: 'user', 
        content: `[ACTION: ${mode.toUpperCase()}] ${choice.text}` 
      }
    ];
    setHistory(newHistory);
    setIsProcessing(true);

    try {
      const tempStats = { ...stats };
      if (mode === 'loud') tempStats.noiseLevel = Math.min(100, tempStats.noiseLevel + 20);
      if (mode === 'silent') tempStats.noiseLevel = Math.max(0, tempStats.noiseLevel - 10);

      const nextScene = await engineRef.current.nextTurn(newHistory, choice.text, mode, tempStats);
      await handleNewScene(nextScene);
    } catch (error) {
      console.error(error);
      playSfx('alert');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewScene = async (scene: Scene) => {
    // Determine the next act
    const nextLevel = stats.level + 1;
    const nextAct = updateAct(nextLevel);
    
    // Check custom BG for the NEXT act
    const customBg = userConfig.sceneBackgrounds?.[nextAct];
    
    // If no custom bg, generate one
    if (customBg) {
      // scene.imageUrl will be ignored in getDisplayBackground in favor of userConfig
      // But we set it here just in case logic changes
      // scene.imageUrl = customBg; 
    } else if (engineRef.current && scene.visualCue) {
       const imageBase64 = await engineRef.current.generateImage(scene.visualCue);
       scene.imageUrl = imageBase64;
    }

    setStats(prev => {
      const newStats = { ...prev };
      if (scene.statUpdates) {
        if (scene.statUpdates.syncRate) newStats.syncRate = Math.min(newStats.maxSyncRate, newStats.syncRate + scene.statUpdates.syncRate);
        if (scene.statUpdates.lucidity) newStats.lucidity = Math.min(newStats.maxLucidity, newStats.lucidity + scene.statUpdates.lucidity);
        if (scene.statUpdates.noiseLevel) newStats.noiseLevel = Math.max(0, Math.min(100, newStats.noiseLevel + scene.statUpdates.noiseLevel));
        if (scene.statUpdates.godmotherHp) newStats.godmotherHp = Math.max(0, Math.min(newStats.maxGodmotherHp, newStats.godmotherHp + scene.statUpdates.godmotherHp));
        if (scene.statUpdates.item) {
          if (scene.statUpdates.item.startsWith('-')) {
             const toRemove = scene.statUpdates.item.substring(1);
             newStats.inventory = newStats.inventory.filter(i => i !== toRemove);
          } else {
             newStats.inventory = [...newStats.inventory, scene.statUpdates.item];
          }
        }
      }
      newStats.level += 1;
      newStats.currentAct = updateAct(newStats.level);
      return newStats;
    });

    setCurrentScene(scene);
    
    if (scene.gameOver || (stats.syncRate + (scene.statUpdates?.syncRate || 0)) <= 0) {
      playSfx('alert');
      setGameState(GameState.GAME_OVER);
    } else if (scene.victory) {
      playSfx('confirm');
      setGameState(GameState.VICTORY);
    }
  };

  const getDisplayBackground = () => {
    if (gameState === GameState.SETUP) {
       return userConfig.sceneBackgrounds?.menu || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop';
    }
    const actBg = userConfig.sceneBackgrounds?.[stats.currentAct];
    if (actBg) return actBg;
    if (currentScene?.imageUrl) return currentScene.imageUrl;
    return null; 
  };

  const bgImage = getDisplayBackground();

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden font-sans select-none">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        config={userConfig}
        onUpdate={handleConfigUpdate}
        onRestart={handleRestart}
      />

      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={() => {
            playSfx('click');
            setIsSettingsOpen(true);
          }}
          className="p-3 bg-black/50 border border-gray-700 rounded-full hover:border-cyber-blue hover:text-cyber-blue transition-all backdrop-blur-md"
        >
          <Settings size={20} className="animate-spin-slow" />
        </button>
      </div>

      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {bgImage ? (
          <img 
            src={bgImage} 
            alt="Background" 
            className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-[#0a0f14] flex items-center justify-center">
             {gameState !== GameState.SETUP && <span className="text-gray-800 animate-pulse font-serif italic text-4xl">Dreaming...</span>}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent md:w-1/3"></div>
      </div>

      {/* SETUP SCREEN */}
      {gameState === GameState.SETUP && (
         <div className="absolute inset-0 z-30 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            <div className="max-w-md w-full border-l-4 border-cyber-red p-8 shadow-2xl bg-black/80 relative overflow-hidden backdrop-blur-md z-10 animate-fade-in">
               <h1 className="text-5xl font-serif font-bold italic mb-2 text-white text-glow">
                 教母的囚笼
               </h1>
               <h2 className="text-sm tracking-[0.4em] uppercase mb-8 text-cyber-red font-sans">
                 Escape the Kindergarten
               </h2>

               <div className="space-y-6">
                 <div>
                   <label className="block text-[10px] uppercase tracking-widest mb-2 text-gray-400">玩家姓名 (Name)</label>
                   <input 
                     type="text" 
                     className="w-full bg-white/5 border-b border-gray-600 p-3 focus:border-cyber-blue focus:outline-none text-white font-serif italic text-lg transition-colors placeholder:text-gray-700"
                     placeholder="输入您的名字..."
                     value={inputName}
                     onChange={(e) => setInputName(e.target.value)}
                   />
                 </div>

                 <button 
                   onClick={startGame}
                   className="w-full bg-cyber-red text-white font-serif italic text-xl py-4 mt-4 hover:bg-white hover:text-black transition-all duration-300 relative overflow-hidden group shadow-[0_0_20px_rgba(255,0,60,0.3)]"
                 >
                   <span className="relative z-10">唤醒 (Wake Up)</span>
                   <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                 </button>
                 
                 <div className="text-center pt-2">
                   <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-xs text-gray-500 hover:text-cyber-blue font-mono uppercase tracking-widest border-b border-transparent hover:border-cyber-blue transition-all"
                   >
                     系统配置 / SYSTEM CONFIG
                   </button>
                 </div>
               </div>
            </div>
         </div>
      )}

      {/* GAMEPLAY UI */}
      {(gameState === GameState.PLAYING || gameState === GameState.LOADING || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 md:p-8 pointer-events-none">
           
           {/* TOP HUD: Godmother Boss Bar */}
           <div className="absolute top-4 left-0 right-0 flex justify-center z-40 pointer-events-none">
             <div className="w-full max-w-2xl px-4 flex flex-col items-center">
                <div className="flex items-center gap-4 w-full">
                  {/* GM Avatar Small */}
                  <div className="w-12 h-12 border border-cyber-red rounded-sm overflow-hidden bg-black shadow-[0_0_10px_rgba(255,0,0,0.5)]">
                     {userConfig.godmotherAvatarUrl ? (
                        <img src={userConfig.godmotherAvatarUrl} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center bg-cyber-red/20 text-cyber-red text-xs font-mono">GM</div>
                     )}
                  </div>
                  
                  {/* HP BAR */}
                  <div className="flex-1 flex flex-col">
                     <div className="flex justify-between text-[10px] text-cyber-red font-mono uppercase tracking-[0.2em] mb-1">
                        <span>The Godmother (教母)</span>
                        <span>{stats.godmotherHp}% CORRUPTION</span>
                     </div>
                     <div className="h-4 bg-black/50 border border-cyber-red/30 w-full relative skew-x-[-10deg]">
                        <div 
                           className="absolute top-0 left-0 h-full bg-cyber-red transition-all duration-500 ease-out shadow-[0_0_15px_rgba(255,0,60,0.6)]"
                           style={{ width: `${(stats.godmotherHp / stats.maxGodmotherHp) * 100}%` }}
                        />
                        {/* Glitch Overlay */}
                        <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] mix-blend-overlay opacity-20 pointer-events-none"></div>
                     </div>
                  </div>
                </div>
             </div>
           </div>

           {/* MAIN STAGE: Godmother Sprite */}
           {userConfig.godmotherSpriteUrl && (
              <div className="absolute bottom-0 right-0 md:right-20 h-[80vh] w-auto z-10 pointer-events-none animate-float opacity-90 transition-opacity duration-1000">
                 <img 
                  src={userConfig.godmotherSpriteUrl} 
                  className="h-full w-auto object-contain drop-shadow-[0_0_30px_rgba(255,0,60,0.3)] mask-image-gradient" 
                  alt="Godmother" 
                 />
              </div>
           )}
           
           {/* StatsPanel REMOVED */}

           {(gameState === GameState.LOADING || isProcessing) && (
              <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm pointer-events-auto">
                <div className="flex flex-col items-center">
                   <div className="w-16 h-16 border-2 border-white/20 border-t-cyber-blue rounded-full animate-spin mb-4"></div>
                   <span className="text-cyber-blue font-sans text-xs tracking-[0.3em] animate-pulse">数据同步中...</span>
                </div>
              </div>
           )}

           <div className="mt-auto w-full z-20 flex flex-col items-center md:items-end md:justify-end pointer-events-auto relative">
              
              {/* PLAYER PORTRAIT (Floating near dialogue) */}
              <div className="absolute bottom-[200px] left-4 md:left-10 z-30 hidden md:block">
                 <div className="w-24 h-24 md:w-32 md:h-32 bg-black/40 backdrop-blur-md border border-cyber-blue/50 rounded-lg p-1 relative group">
                    <div className="absolute -top-3 left-2 px-2 bg-cyber-blue text-black text-[10px] font-bold font-mono">PLAYER</div>
                    <div className="w-full h-full overflow-hidden rounded border border-white/10">
                       {userConfig.avatarUrl ? (
                          <img src={userConfig.avatarUrl} className="w-full h-full object-cover" alt="Player" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center text-cyber-blue">
                             <User size={32} />
                          </div>
                       )}
                    </div>
                    {/* Hologram Effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-cyber-blue/20 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyber-blue shadow-[0_0_10px_#00f3ff]"></div>
                 </div>
              </div>

              <Terminal 
                history={history} 
                currentText={displayedText} 
                isTyping={displayedText !== currentScene?.narrative}
                sceneTitle={currentScene?.title}
                godmotherAvatarUrl={userConfig.godmotherAvatarUrl}
              />
              
              {currentScene && gameState === GameState.PLAYING && (
                <ActionPanel 
                  choices={currentScene.choices} 
                  onSelect={handleChoice} 
                  disabled={isProcessing || displayedText !== currentScene.narrative}
                  noiseLevel={stats.noiseLevel}
                  onPlaySfx={() => playSfx('click')}
                />
              )}
           </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center text-cyber-red animate-fade-in pointer-events-auto">
          <h1 className="text-7xl font-serif italic mb-4 text-glow">沉睡</h1>
          <p className="text-xl mb-12 font-sans tracking-widest uppercase opacity-80">晚安, {stats.playerName || '孩子'}...</p>
          <button onClick={() => setGameState(GameState.SETUP)} className="border-b border-cyber-red pb-1 hover:text-white transition-colors uppercase tracking-widest text-sm">重置梦境</button>
        </div>
      )}

      {/* VICTORY */}
      {gameState === GameState.VICTORY && (
        <div className="absolute inset-0 z-[60] bg-white text-black flex flex-col items-center justify-center animate-fade-in pointer-events-auto">
          <h1 className="text-7xl font-serif italic mb-4">苏醒</h1>
          <p className="text-xl mb-12 font-sans tracking-widest uppercase opacity-80">你逃离了幼儿园, {stats.playerName}.</p>
          <button onClick={() => setGameState(GameState.SETUP)} className="border-b border-black pb-1 hover:text-cyber-red transition-colors uppercase tracking-widest text-sm">开始新的轮回</button>
        </div>
      )}

    </div>
  );
};

export default App;
