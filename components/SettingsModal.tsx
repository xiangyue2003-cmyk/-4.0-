
import React, { useRef, useState } from 'react';
import { UserConfig, Act, SfxTracks } from '../types';
import { X, Upload, Music, User, Volume2, Power, Image as ImageIcon, MousePointer, Bell, CheckCircle, Ghost, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserConfig;
  onUpdate: (newConfig: Partial<UserConfig>) => void;
  onRestart: () => void;
}

type Tab = 'identity' | 'cast' | 'bgm' | 'sfx' | 'scenery';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onUpdate, onRestart }) => {
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  
  // Refs for file inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const gmAvatarInputRef = useRef<HTMLInputElement>(null);
  const gmSpriteInputRef = useRef<HTMLInputElement>(null);
  const bgmRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const sfxRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const sceneRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, category: 'avatar' | 'gmAvatar' | 'gmSprite' | 'bgm' | 'sfx' | 'scene', key?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      
      if (category === 'avatar') {
        onUpdate({ avatarUrl: url });
      } else if (category === 'gmAvatar') {
        onUpdate({ godmotherAvatarUrl: url });
      } else if (category === 'gmSprite') {
        onUpdate({ godmotherSpriteUrl: url });
      } else if (category === 'bgm' && key) {
        onUpdate({ 
          bgmTracks: { ...config.bgmTracks, [key]: url } 
        });
      } else if (category === 'sfx' && key) {
        onUpdate({ 
          sfxTracks: { ...config.sfxTracks, [key]: url } 
        });
      } else if (category === 'scene' && key) {
        onUpdate({ 
          sceneBackgrounds: { ...config.sceneBackgrounds, [key]: url } 
        });
      }
    }
  };

  const acts = [
    { key: 'menu', label: '主菜单 (Main Menu)' },
    { key: Act.ONE, label: '第一幕：糖果囚笼' },
    { key: Act.TWO, label: '第二幕：致命午睡' },
    { key: Act.THREE, label: '第三幕：噪音反噬' },
    { key: Act.FOUR, label: '第四幕：最后的晚安' },
  ];

  const sfxItems = [
    { key: 'click', label: '按钮点击 (Click)', icon: <MousePointer size={14} /> },
    { key: 'confirm', label: '确认/成功 (Confirm)', icon: <CheckCircle size={14} /> },
    { key: 'alert', label: '警告/危险 (Alert)', icon: <Bell size={14} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4 md:p-10">
      <div className="w-full max-w-5xl h-[80vh] bg-[#0a0f14] border border-cyber-blue/30 flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,243,255,0.1)] overflow-hidden rounded-sm">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-cyber-dark border-r border-white/10 flex flex-col">
          <div className="p-6 border-b border-white/10">
             <h2 className="text-cyber-blue font-display tracking-widest uppercase text-lg flex items-center gap-2">
                <Power size={18} /> 系统设置
             </h2>
             <span className="text-[10px] text-gray-500 font-mono">SYSTEM CONFIGURATION</span>
          </div>
          
          <nav className="flex-1 overflow-y-auto">
            <button 
              onClick={() => setActiveTab('identity')}
              className={`w-full text-left px-6 py-4 border-l-2 transition-all flex items-center gap-3 ${activeTab === 'identity' ? 'bg-white/5 border-cyber-blue text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              <User size={16} />
              <div>
                <div className="font-sans text-sm font-bold">个人档案</div>
                <div className="text-[10px] font-mono">IDENTITY</div>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('cast')}
              className={`w-full text-left px-6 py-4 border-l-2 transition-all flex items-center gap-3 ${activeTab === 'cast' ? 'bg-white/5 border-cyber-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              <Ghost size={16} />
              <div>
                <div className="font-sans text-sm font-bold">角色配置</div>
                <div className="text-[10px] font-mono">CAST & VISUALS</div>
              </div>
            </button>
            
            <button 
              onClick={() => setActiveTab('bgm')}
              className={`w-full text-left px-6 py-4 border-l-2 transition-all flex items-center gap-3 ${activeTab === 'bgm' ? 'bg-white/5 border-cyber-green text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              <Music size={16} />
              <div>
                <div className="font-sans text-sm font-bold">背景音乐</div>
                <div className="text-[10px] font-mono">BGM TRACKS</div>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('sfx')}
              className={`w-full text-left px-6 py-4 border-l-2 transition-all flex items-center gap-3 ${activeTab === 'sfx' ? 'bg-white/5 border-cyber-yellow text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              <Volume2 size={16} />
              <div>
                <div className="font-sans text-sm font-bold">交互音效</div>
                <div className="text-[10px] font-mono">SOUND EFFECTS</div>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('scenery')}
              className={`w-full text-left px-6 py-4 border-l-2 transition-all flex items-center gap-3 ${activeTab === 'scenery' ? 'bg-white/5 border-cyber-purple text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              <ImageIcon size={16} />
              <div>
                <div className="font-sans text-sm font-bold">场景布置</div>
                <div className="text-[10px] font-mono">BACKGROUNDS</div>
              </div>
            </button>
          </nav>

          <div className="p-4 border-t border-white/10">
            <button onClick={onClose} className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs uppercase tracking-widest transition-colors">
              关闭 / Close
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#050505]/50 overflow-y-auto p-8 relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>

          {/* TAB: IDENTITY */}
          {activeTab === 'identity' && (
            <div className="space-y-8 animate-fade-in">
              <h3 className="text-xl font-display text-white border-b border-gray-800 pb-2 mb-6">玩家身份设定</h3>
              
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center">
                   <div 
                      className="w-40 h-40 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-cyber-blue transition-colors bg-black"
                      onClick={() => avatarInputRef.current?.click()}
                   >
                      {config.avatarUrl ? (
                        <img src={config.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={48} className="text-gray-700 group-hover:text-cyber-blue transition-colors" />
                      )}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={24} className="text-white" />
                      </div>
                   </div>
                   <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                   <p className="mt-3 text-xs font-mono text-gray-500">点击上传玩家头像</p>
                </div>

                <div className="flex-1 w-full space-y-6">
                   <div className="bg-white/5 p-6 rounded-sm border border-white/5">
                      <label className="block text-xs font-mono text-cyber-blue mb-4 uppercase tracking-widest">全局音量 (Master Volume)</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05"
                        value={config.bgmVolume}
                        onChange={(e) => onUpdate({ bgmVolume: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyber-blue mb-2"
                      />
                      <div className="text-right text-xs font-mono text-gray-400">{Math.round(config.bgmVolume * 100)}%</div>
                   </div>

                   <div className="bg-white/5 p-6 rounded-sm border border-white/5 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-white mb-1">启用音效 (SFX)</div>
                        <div className="text-xs text-gray-500">开启点击、警告等界面音效</div>
                      </div>
                      <button 
                        onClick={() => onUpdate({ sfxEnabled: !config.sfxEnabled })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${config.sfxEnabled ? 'bg-cyber-green' : 'bg-gray-700'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config.sfxEnabled ? 'left-7' : 'left-1'}`}></div>
                      </button>
                   </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-900/10 p-6 rounded-sm border border-red-500/20 mt-8">
                 <h4 className="text-red-500 font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-widest">
                   <AlertTriangle size={16} /> 危险区域 (Danger Zone)
                 </h4>
                 <p className="text-xs text-gray-400 mb-4">强制中断当前连接并重置系统。所有进度将丢失。</p>
                 <button 
                   onClick={() => {
                     if (window.confirm('确定要重启系统吗？所有进度将丢失。\nAre you sure you want to restart? Progress will be lost.')) {
                       onRestart();
                     }
                   }}
                   className="w-full py-3 bg-red-600/20 hover:bg-red-600 border border-red-600/50 hover:border-red-600 text-red-500 hover:text-white font-mono uppercase tracking-widest transition-all duration-300"
                 >
                   系统重置 / SYSTEM RESET
                 </button>
              </div>
            </div>
          )}

          {/* TAB: CAST (GODMOTHER) */}
          {activeTab === 'cast' && (
            <div className="space-y-8 animate-fade-in">
              <h3 className="text-xl font-display text-cyber-red border-b border-gray-800 pb-2 mb-6">反派角色配置 (The Godmother)</h3>
              <p className="text-xs text-gray-400 mb-6">配置教母的形象，将应用于对话框头像和立绘。</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Godmother Avatar */}
                 <div className="bg-white/5 p-6 rounded-sm border border-white/5 flex flex-col items-center">
                    <div className="text-sm font-bold text-white mb-4">头像 (HUD Avatar)</div>
                    <div 
                      className="w-32 h-32 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-cyber-red transition-colors bg-black"
                      onClick={() => gmAvatarInputRef.current?.click()}
                    >
                       {config.godmotherAvatarUrl ? (
                         <img src={config.godmotherAvatarUrl} alt="GM Avatar" className="w-full h-full object-cover" />
                       ) : (
                         <Ghost size={40} className="text-gray-700 group-hover:text-cyber-red transition-colors" />
                       )}
                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={24} className="text-white" />
                      </div>
                    </div>
                    <input type="file" ref={gmAvatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'gmAvatar')} />
                    <p className="mt-3 text-xs font-mono text-gray-500">上传正方形头像</p>
                 </div>

                 {/* Godmother Sprite */}
                 <div className="bg-white/5 p-6 rounded-sm border border-white/5 flex flex-col items-center">
                    <div className="text-sm font-bold text-white mb-4">立绘 (Full Body Sprite)</div>
                    <div 
                      className="w-32 h-48 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-cyber-red transition-colors bg-black"
                      onClick={() => gmSpriteInputRef.current?.click()}
                    >
                       {config.godmotherSpriteUrl ? (
                         <img src={config.godmotherSpriteUrl} alt="GM Sprite" className="w-full h-full object-contain" />
                       ) : (
                         <User size={40} className="text-gray-700 group-hover:text-cyber-red transition-colors" />
                       )}
                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={24} className="text-white" />
                      </div>
                    </div>
                    <input type="file" ref={gmSpriteInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'gmSprite')} />
                    <p className="mt-3 text-xs font-mono text-gray-500">上传全身立绘 (透明背景PNG)</p>
                 </div>
              </div>
            </div>
          )}

          {/* TAB: BGM */}
          {activeTab === 'bgm' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-display text-cyber-green border-b border-gray-800 pb-2 mb-6">场景音乐配置</h3>
              <p className="text-xs text-gray-400 mb-4">为不同的游戏阶段设置专属背景音乐。音乐将自动循环并平滑过渡。</p>

              <div className="grid grid-cols-1 gap-4">
                {acts.map((act) => (
                  <div key={act.key} className="bg-white/5 p-4 rounded-sm border border-white/5 flex items-center justify-between group hover:border-cyber-green/30 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`p-2 rounded bg-black/50 ${config.bgmTracks[act.key] ? 'text-cyber-green' : 'text-gray-600'}`}>
                           <Music size={20} />
                        </div>
                        <div>
                           <div className="text-sm font-bold text-gray-200">{act.label}</div>
                           <div className="text-[10px] font-mono text-gray-500">
                              {config.bgmTracks[act.key] ? '已加载音频' : '使用默认静音'}
                           </div>
                        </div>
                     </div>
                     
                     <input 
                        type="file" 
                        ref={(el) => { bgmRefs.current[act.key] = el; }} 
                        className="hidden" 
                        accept="audio/*" 
                        onChange={(e) => handleFileChange(e, 'bgm', act.key)} 
                     />
                     <button 
                        onClick={() => bgmRefs.current[act.key]?.click()}
                        className="px-4 py-2 text-xs font-mono border border-gray-600 hover:border-cyber-green hover:text-cyber-green transition-colors uppercase"
                     >
                        上传 / Upload
                     </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SFX */}
          {activeTab === 'sfx' && (
            <div className="space-y-6 animate-fade-in">
               <h3 className="text-xl font-display text-cyber-yellow border-b border-gray-800 pb-2 mb-6">交互音效配置</h3>
               <p className="text-xs text-gray-400 mb-4">自定义界面的反馈声音。</p>

               <div className="grid grid-cols-1 gap-4">
                  {sfxItems.map((item) => (
                     <div key={item.key} className="bg-white/5 p-4 rounded-sm border border-white/5 flex items-center justify-between group hover:border-cyber-yellow/30 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className={`p-2 rounded bg-black/50 ${config.sfxTracks?.[item.key as keyof SfxTracks] ? 'text-cyber-yellow' : 'text-gray-600'}`}>
                              {item.icon}
                           </div>
                           <div>
                              <div className="text-sm font-bold text-gray-200">{item.label}</div>
                              <div className="text-[10px] font-mono text-gray-500">
                                 {config.sfxTracks?.[item.key as keyof SfxTracks] ? '自定义音效已加载' : '使用系统默认合成音'}
                              </div>
                           </div>
                        </div>
                        
                        <input 
                           type="file" 
                           ref={(el) => { sfxRefs.current[item.key] = el; }} 
                           className="hidden" 
                           accept="audio/*" 
                           onChange={(e) => handleFileChange(e, 'sfx', item.key)} 
                        />
                        <button 
                           onClick={() => sfxRefs.current[item.key]?.click()}
                           className="px-4 py-2 text-xs font-mono border border-gray-600 hover:border-cyber-yellow hover:text-cyber-yellow transition-colors uppercase"
                        >
                           上传 / Upload
                        </button>
                     </div>
                  ))}
               </div>
            </div>
          )}

          {/* TAB: SCENERY */}
          {activeTab === 'scenery' && (
            <div className="space-y-6 animate-fade-in">
               <h3 className="text-xl font-display text-cyber-purple border-b border-gray-800 pb-2 mb-6">场景背景管理</h3>
               <p className="text-xs text-gray-400 mb-4">如果您上传了图片，游戏将优先显示该图片作为背景，不再请求 AI 生成。</p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {acts.map((act) => (
                     <div key={act.key} className="bg-white/5 p-4 rounded-sm border border-white/5 flex flex-col gap-3 group hover:border-cyber-purple/30 transition-colors">
                        <div className="flex items-center justify-between">
                           <div className="text-sm font-bold text-gray-200">{act.label}</div>
                           <button 
                              onClick={() => sceneRefs.current[act.key]?.click()}
                              className="text-xs text-cyber-purple hover:text-white underline decoration-dotted"
                           >
                              更改图片
                           </button>
                        </div>
                        
                        <div 
                           className="w-full h-32 bg-black border border-gray-800 relative overflow-hidden cursor-pointer"
                           onClick={() => sceneRefs.current[act.key]?.click()}
                        >
                           {config.sceneBackgrounds?.[act.key] ? (
                              <img src={config.sceneBackgrounds[act.key] || ''} className="w-full h-full object-cover" alt="Background" />
                           ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-700">
                                 <ImageIcon size={24} className="mb-2" />
                                 <span className="text-[10px] font-mono">NO IMAGE</span>
                              </div>
                           )}
                           <div className="absolute inset-0 bg-cyber-purple/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <input 
                           type="file" 
                           ref={(el) => { sceneRefs.current[act.key] = el; }} 
                           className="hidden" 
                           accept="image/*" 
                           onChange={(e) => handleFileChange(e, 'scene', act.key)} 
                        />
                     </div>
                  ))}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
