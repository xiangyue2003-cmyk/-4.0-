
export enum GameState {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LOADING = 'LOADING',
  VICTORY = 'VICTORY'
}

export enum Act {
  ONE = '糖果囚笼',
  TWO = '致命午睡',
  THREE = '噪音反噬',
  FOUR = '最后的晚安'
}

export interface PlayerStats {
  playerName: string;
  syncRate: number;
  maxSyncRate: number;
  lucidity: number;
  maxLucidity: number;
  noiseLevel: number;
  godmotherHp: number;
  maxGodmotherHp: number;
  inventory: string[];
  level: number;
  currentAct: Act;
}

export interface AudioTracks {
  menu: string | null;
  [Act.ONE]: string | null;
  [Act.TWO]: string | null;
  [Act.THREE]: string | null;
  [Act.FOUR]: string | null;
}

export interface SfxTracks {
  click: string | null;
  confirm: string | null;
  alert: string | null;
}

export interface SceneBackgrounds {
  menu: string | null;
  [Act.ONE]: string | null;
  [Act.TWO]: string | null;
  [Act.THREE]: string | null;
  [Act.FOUR]: string | null;
}

export interface UserConfig {
  avatarUrl: string | null;
  godmotherAvatarUrl: string | null;
  godmotherSpriteUrl: string | null;
  bgmTracks: AudioTracks;
  sfxTracks: SfxTracks;
  sceneBackgrounds: SceneBackgrounds;
  bgmVolume: number; // 0.0 to 1.0
  sfxEnabled: boolean;
}

export interface Choice {
  id: string;
  text: string;
  type: 'interaction' | 'movement' | 'combat' | 'item';
}

export interface Scene {
  title: string;
  narrative: string;
  visualCue: string;
  imageUrl?: string;
  choices: Choice[];
  statUpdates?: {
    syncRate?: number;
    lucidity?: number;
    noiseLevel?: number;
    godmotherHp?: number;
    item?: string;
  };
  gameOver?: boolean;
  victory?: boolean;
}

export interface GameHistoryLog {
  role: 'system' | 'user' | 'model';
  content: string;
  image?: string;
}
