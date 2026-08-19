import { TeamDef } from './types';

// 原创国家队与原创角色(致敬街机热血风格,非原作角色)
export const TEAMS: TeamDef[] = [
  {
    id: 'cn', name: '中国龙焰', nameEn: 'DRAGON CN', color: 0xd83a2a, color2: 0xf5d33d,
    players: [
      { name: '石墙', speed: 0.9, power: 0.9, toughness: 1.2, special: 'blast', skin: 0xf0c8a0, hair: 0x202020 },
      { name: '烈风', speed: 1.15, power: 1.1, toughness: 1.0, special: 'cyclone', skin: 0xf0c8a0, hair: 0x202020 },
      { name: '铁牛', speed: 0.9, power: 1.2, toughness: 1.25, special: 'blast', skin: 0xe8b888, hair: 0x3a2a1a },
      { name: '小燕', speed: 1.2, power: 0.9, toughness: 0.85, special: 'serpent', skin: 0xf8d8b0, hair: 0x4a2a10 },
      { name: '雷鸣', speed: 1.0, power: 1.15, toughness: 1.1, special: 'meteor', skin: 0xf0c8a0, hair: 0x202020 },
      { name: '追云', speed: 1.1, power: 1.0, toughness: 0.95, special: 'banana', skin: 0xf0c8a0, hair: 0x202020 },
    ],
  },
  {
    id: 'jp', name: '樱岛疾风', nameEn: 'SAKURA JP', color: 0xffffff, color2: 0xd83a2a,
    players: [
      { name: '岩守', speed: 0.9, power: 0.9, toughness: 1.15, special: 'blast', skin: 0xf5d0a8, hair: 0x101010 },
      { name: '隼人', speed: 1.2, power: 1.05, toughness: 0.95, special: 'phantom', skin: 0xf5d0a8, hair: 0x101010 },
      { name: '武藏', speed: 0.95, power: 1.2, toughness: 1.2, special: 'blast', skin: 0xe8b888, hair: 0x101010 },
      { name: '枫', speed: 1.15, power: 0.95, toughness: 0.85, special: 'banana', skin: 0xf8d8b0, hair: 0x5a3a20 },
      { name: '狮童', speed: 1.0, power: 1.1, toughness: 1.1, special: 'meteor', skin: 0xf0c8a0, hair: 0x101010 },
      { name: '疾风', speed: 1.25, power: 1.0, toughness: 0.9, special: 'phantom', skin: 0xf5d0a8, hair: 0x101010 },
    ],
  },
  {
    id: 'br', name: '桑巴烈日', nameEn: 'SAMBA BR', color: 0xf2c53d, color2: 0x2a7a3a,
    players: [
      { name: '巨岩', speed: 0.9, power: 0.95, toughness: 1.2, special: 'blast', skin: 0xa06840, hair: 0x201510 },
      { name: '燃舞', speed: 1.25, power: 1.05, toughness: 0.9, special: 'serpent', skin: 0x8a5530, hair: 0x201510 },
      { name: '狂欢', speed: 1.15, power: 1.1, toughness: 0.95, special: 'banana', skin: 0xa06840, hair: 0x201510 },
      { name: '晨星', speed: 1.1, power: 1.0, toughness: 0.9, special: 'cyclone', skin: 0xc08858, hair: 0x2a1a10 },
      { name: '雨林', speed: 1.0, power: 1.15, toughness: 1.05, special: 'meteor', skin: 0x8a5530, hair: 0x201510 },
      { name: '海浪', speed: 1.1, power: 1.05, toughness: 0.95, special: 'serpent', skin: 0xa06840, hair: 0x201510 },
    ],
  },
  {
    id: 'de', name: '钢铁风暴', nameEn: 'STAHL DE', color: 0x2a2a2a, color2: 0xf2f2f2,
    players: [
      { name: '堡垒', speed: 0.85, power: 1.0, toughness: 1.3, special: 'blast', skin: 0xf8d8b8, hair: 0xc8a848 },
      { name: '铁锤', speed: 1.0, power: 1.25, toughness: 1.2, special: 'blast', skin: 0xf8d8b8, hair: 0xc8a848 },
      { name: '装甲', speed: 0.9, power: 1.15, toughness: 1.25, special: 'meteor', skin: 0xf0c8a0, hair: 0x8a5a2a },
      { name: '闪电', speed: 1.15, power: 1.05, toughness: 1.0, special: 'drill', skin: 0xf8d8b8, hair: 0xe8d888 },
      { name: '寒霜', speed: 1.05, power: 1.1, toughness: 1.1, special: 'freeze', skin: 0xf8d8b8, hair: 0xc8a848 },
      { name: '风车', speed: 1.1, power: 1.05, toughness: 1.05, special: 'cyclone', skin: 0xf0c8a0, hair: 0x8a5a2a },
    ],
  },
  {
    id: 'gb', name: '雾都骑士', nameEn: 'KNIGHT GB', color: 0x2a3a8a, color2: 0xf2f2f2,
    players: [
      { name: '城门', speed: 0.9, power: 0.9, toughness: 1.2, special: 'blast', skin: 0xf8d8b8, hair: 0x6a4a2a },
      { name: '长弓', speed: 1.1, power: 1.1, toughness: 1.0, special: 'banana', skin: 0xf8d8b8, hair: 0xa87838 },
      { name: '圆桌', speed: 0.95, power: 1.1, toughness: 1.15, special: 'meteor', skin: 0xf0c8a0, hair: 0x3a2a1a },
      { name: '迷雾', speed: 1.15, power: 0.95, toughness: 0.9, special: 'phantom', skin: 0xf8d8b8, hair: 0x6a4a2a },
      { name: '风笛', speed: 1.05, power: 1.05, toughness: 1.0, special: 'cyclone', skin: 0xf8d8b8, hair: 0xc85a2a },
      { name: '王冠', speed: 1.1, power: 1.05, toughness: 1.0, special: 'drill', skin: 0xf8d8b8, hair: 0x6a4a2a },
    ],
  },
  {
    id: 'us', name: '自由猛鹰', nameEn: 'EAGLE US', color: 0x3a5ac8, color2: 0xd83a2a,
    players: [
      { name: '磐石', speed: 0.9, power: 1.0, toughness: 1.25, special: 'blast', skin: 0x8a5530, hair: 0x201510 },
      { name: '火箭', speed: 1.2, power: 1.1, toughness: 1.0, special: 'meteor', skin: 0xf8d8b8, hair: 0xc8a848 },
      { name: '巨兽', speed: 0.9, power: 1.25, toughness: 1.3, special: 'blast', skin: 0xa06840, hair: 0x201510 },
      { name: '星条', speed: 1.15, power: 1.0, toughness: 0.95, special: 'drill', skin: 0xf8d8b8, hair: 0x8a5a2a },
      { name: '荒野', speed: 1.05, power: 1.1, toughness: 1.1, special: 'cyclone', skin: 0xf0c8a0, hair: 0x3a2a1a },
      { name: '雄鹰', speed: 1.1, power: 1.05, toughness: 1.0, special: 'banana', skin: 0xf8d8b8, hair: 0xc8a848 },
    ],
  },
];

TEAMS.push(
  {
    id: 'it', name: '亚平宁蓝狼', nameEn: 'AZZURRI IT', color: 0x1a5ac8, color2: 0xf2f2f2,
    players: [
      { name: '铁闸', speed: 0.9, power: 0.9, toughness: 1.3, special: 'blast', skin: 0xf0c8a0, hair: 0x2a1a10 },
      { name: '美声', speed: 1.1, power: 1.1, toughness: 1.0, special: 'banana', skin: 0xf0c8a0, hair: 0x1a1a1a },
      { name: '石柱', speed: 0.9, power: 1.15, toughness: 1.25, special: 'meteor', skin: 0xe8b888, hair: 0x2a1a10 },
      { name: '疾影', speed: 1.2, power: 0.95, toughness: 0.9, special: 'phantom', skin: 0xf0c8a0, hair: 0x1a1a1a },
      { name: '琴弦', speed: 1.05, power: 1.05, toughness: 1.0, special: 'serpent', skin: 0xf8d8b0, hair: 0x3a2a1a },
      { name: '斜塔', speed: 1.0, power: 1.1, toughness: 1.1, special: 'drill', skin: 0xf0c8a0, hair: 0x2a1a10 },
    ],
  },
  {
    id: 'es', name: '斗牛烈焰', nameEn: 'TORO ES', color: 0xd8352a, color2: 0xf2c53d,
    players: [
      { name: '斗篷', speed: 0.9, power: 0.95, toughness: 1.2, special: 'blast', skin: 0xe8b888, hair: 0x1a1a1a },
      { name: '弗拉门', speed: 1.2, power: 1.0, toughness: 0.9, special: 'serpent', skin: 0xe8b888, hair: 0x1a1a1a },
      { name: '公牛', speed: 0.95, power: 1.25, toughness: 1.25, special: 'blast', skin: 0xd8a878, hair: 0x1a1a1a },
      { name: '烈阳', speed: 1.1, power: 1.05, toughness: 1.0, special: 'cyclone', skin: 0xe8b888, hair: 0x2a1a10 },
      { name: '红缨', speed: 1.15, power: 1.0, toughness: 0.95, special: 'banana', skin: 0xf0c8a0, hair: 0x3a2010 },
      { name: '海风', speed: 1.05, power: 1.1, toughness: 1.05, special: 'freeze', skin: 0xe8b888, hair: 0x1a1a1a },
    ],
  },
  {
    id: 'sl', name: '少林铁僧', nameEn: 'SHAOLIN', color: 0xf5a020, color2: 0xd8352a,
    players: [
      { name: '铜人', speed: 0.88, power: 0.95, toughness: 1.3, special: 'blast', skin: 0xe8b888, hair: 0x000000, appearance: { build: 'heavy', hairStyle: 'bald', face: 'normal' } },
      { name: '罗汉', speed: 1.0, power: 1.2, toughness: 1.15, special: 'luohan', skin: 0xe8b888, hair: 0x000000, appearance: { build: 'medium', hairStyle: 'bald', face: 'frown' } },
      { name: '达摩', speed: 0.9, power: 1.2, toughness: 1.25, special: 'sweep', skin: 0xd8a878, hair: 0x000000, appearance: { build: 'heavy', hairStyle: 'bald', face: 'normal' } },
      { name: '慧空', speed: 1.2, power: 0.95, toughness: 0.9, special: 'serpent', skin: 0xf0c8a0, hair: 0x000000, appearance: { build: 'slim', hairStyle: 'bald', face: 'smile' } },
      { name: '玄铁', speed: 1.0, power: 1.15, toughness: 1.1, special: 'meteor', skin: 0xe8b888, hair: 0x000000, appearance: { build: 'medium', hairStyle: 'bald', face: 'normal' } },
      { name: '疾影', speed: 1.15, power: 1.0, toughness: 0.95, special: 'cyclone', skin: 0xf0c8a0, hair: 0x000000, appearance: { build: 'slim', hairStyle: 'bald', face: 'normal' } },
    ],
  },
);

export function teamById(id: string): TeamDef {
  return TEAMS.find(t => t.id === id) ?? TEAMS[0];
}

// 队伍综合实力(锦标赛模拟他场比分用)
export function teamStrength(t: TeamDef): number {
  return t.players.reduce((s, p) => s + p.speed + p.power + p.toughness, 0);
}
