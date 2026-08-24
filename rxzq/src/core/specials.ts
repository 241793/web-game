import { SpecialShotId } from './types';

export type SpecialFxStyle =
  | 'arc' | 'spiral' | 'clone' | 'blast'
  | 'groundspark' | 'meteor' | 'serpent' | 'ice' | 'fist';

export interface SpecialDef {
  id: SpecialShotId;
  name: string;
  color: number;        // 特效主色
  color2: number;       // 特效副色(拖尾闪色)
  speed: number;        // 弹道速度倍率
  curve: number;        // 侧向弯曲力
  wave: number;         // 正弦摆动幅度
  waveFreq: number;
  lift: number;         // 初始抬升
  gravityScale: number; // 弹道期间重力倍率
  knockdown: boolean;   // 命中门将/球员是否击飞
  ground: boolean;      // 是否贴地弹道
  fxStyle: SpecialFxStyle; // 视觉表现语汇
  trailScale: number;   // 拖尾尺度倍率
  flash: boolean;       // 是否周期性副色闪光
}

export const SPECIALS: Record<SpecialShotId, SpecialDef> = {
  banana:  { id: 'banana',  name: '香蕉回旋', color: 0xf5e13d, color2: 0xffa63d, speed: 1.0,  curve: 34, wave: 0,  waveFreq: 0, lift: 0.9, gravityScale: 0.25, knockdown: false, ground: false, fxStyle: 'arc', trailScale: 1.0, flash: true },
  cyclone: { id: 'cyclone', name: '龙卷旋风', color: 0x3dd5f5, color2: 0xc8f5ff, speed: 0.92, curve: 0,  wave: 6,  waveFreq: 9, lift: 1.0, gravityScale: 0.1,  knockdown: true,  ground: false, fxStyle: 'spiral', trailScale: 1.3, flash: true },
  phantom: { id: 'phantom', name: '幻影分身', color: 0xc03df5, color2: 0xf5a6ff, speed: 1.08, curve: 0,  wave: 10, waveFreq: 14, lift: 0.7, gravityScale: 0.15, knockdown: false, ground: false, fxStyle: 'clone', trailScale: 0.9, flash: false },
  blast:   { id: 'blast',   name: '轰天爆裂', color: 0xf56a3d, color2: 0xff7a2a, speed: 1.2,  curve: 0,  wave: 0,  waveFreq: 0, lift: 0.8, gravityScale: 0.12, knockdown: true,  ground: false, fxStyle: 'blast', trailScale: 1.5, flash: false },
  drill:   { id: 'drill',   name: '螺旋钻地', color: 0xa8f53d, color2: 0xd8ff7a, speed: 1.05, curve: 0,  wave: 2.4, waveFreq: 22, lift: 0.1, gravityScale: 0.0, knockdown: true,  ground: true,  fxStyle: 'groundspark', trailScale: 1.1, flash: true },
  meteor:  { id: 'meteor',  name: '陨石坠击', color: 0xf53d5a, color2: 0xffd23d, speed: 0.95, curve: 0,  wave: 0,  waveFreq: 0, lift: 2.6, gravityScale: 1.6,  knockdown: true,  ground: false, fxStyle: 'meteor', trailScale: 1.8, flash: true },
  serpent: { id: 'serpent', name: '灵蛇游走', color: 0x3df58a, color2: 0x7affc8, speed: 0.98, curve: 0,  wave: 7,  waveFreq: 6, lift: 0.15, gravityScale: 0.0, knockdown: false, ground: true,  fxStyle: 'serpent', trailScale: 0.8, flash: false },
  freeze:  { id: 'freeze',  name: '寒冰冻结', color: 0x9ad8ff, color2: 0x5aa8ff, speed: 0.88, curve: 12, wave: 3,  waveFreq: 5, lift: 1.1, gravityScale: 0.08, knockdown: true,  ground: false, fxStyle: 'ice', trailScale: 0.9, flash: false },
  luohan:  { id: 'luohan',  name: '罗汉伏虎', color: 0xf5a020, color2: 0xd8352a, speed: 1.18, curve: 0,  wave: 0,  waveFreq: 0, lift: 0.85, gravityScale: 0.12, knockdown: true,  ground: false, fxStyle: 'fist', trailScale: 1.6, flash: true },
  sweep:   { id: 'sweep',   name: '扫堂腿',   color: 0xf5c53d, color2: 0x8a5a20, speed: 1.02, curve: 8,  wave: 2,  waveFreq: 7, lift: 0.1, gravityScale: 0.0,  knockdown: true,  ground: true,  fxStyle: 'groundspark', trailScale: 1.2, flash: true },
  eagle:   { id: 'eagle',   name: '鹰击长空', color: 0xf8f4d8, color2: 0xf5b93d, speed: 1.25, curve: 10, wave: 0,  waveFreq: 0, lift: 2.4, gravityScale: 1.45, knockdown: true,  ground: false, fxStyle: 'meteor', trailScale: 1.4, flash: true },
  mirage:  { id: 'mirage',  name: '沙漠幻影', color: 0x3df5c8, color2: 0xf5e13d, speed: 1.12, curve: 0,  wave: 9,  waveFreq: 11, lift: 0.6, gravityScale: 0.1, knockdown: true, ground: false, fxStyle: 'serpent', trailScale: 1.15, flash: true },
};
