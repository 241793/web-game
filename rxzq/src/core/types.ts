export interface Vec3 { x: number; y: number; z: number; }

export type SpecialShotId =
  | 'banana'      // 香蕉弧线
  | 'cyclone'     // 龙卷旋风
  | 'phantom'     // 幻影分身
  | 'blast'       // 轰天爆裂
  | 'drill'       // 螺旋钻地
  | 'meteor'      // 陨石坠击
  | 'serpent'     // 灵蛇游走
  | 'freeze'      // 寒冰冻结
  | 'luohan'      // 罗汉伏虎
  | 'sweep';      // 扫堂腿

// 角色外观:未配置时由属性稳定推导,保证随机性不破坏辨识度
export interface PlayerAppearance {
  build: 'slim' | 'medium' | 'heavy';   // 体型
  hairStyle: 'short' | 'spiky' | 'long' | 'bald';
  face: 'normal' | 'smile' | 'frown';
}

export interface PlayerDef {
  name: string;
  speed: number;      // 0.8 ~ 1.25 倍率
  power: number;      // 射门力量倍率
  toughness: number;  // 对抗(被撞倒概率相关)
  special: SpecialShotId;
  skin: number;       // 肤色
  hair: number;       // 发色
  appearance?: PlayerAppearance;  // 可选覆盖,缺省按属性推导
}

export interface TeamDef {
  id: string;
  name: string;
  nameEn: string;
  color: number;      // 球衣主色
  color2: number;     // 球衣副色
  players: PlayerDef[]; // [0]=门将, 1..5 场上球员
}

export type PlayerState =
  | 'idle' | 'run' | 'dash' | 'dribble' | 'jump' | 'dive'
  | 'slide' | 'tackle' | 'fallen' | 'kick' | 'headbutt';

// 比赛中的即时战术。AI 会据此调整阵型纵深、压迫强度和传球风险。
export type TacticalStyle = 'balanced' | 'attack' | 'defend';

// 热血规则保留无犯规的街机节奏；竞技规则启用越位与危险铲球判罚。
export type Ruleset = 'arcade' | 'classic';

export type MatchPhase =
  | 'kickoff' | 'play' | 'goal' | 'throwin' | 'corner' | 'goalkick' | 'freekick'
  | 'halftime' | 'fulltime' | 'shootout';
