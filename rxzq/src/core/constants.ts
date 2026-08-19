// 全部长度单位为“米”(游戏内逻辑单位),坐标系: x=球场长轴(±为两侧球门), z=短轴, y=高度
export const FIELD_LENGTH = 105;  // 真实球场比例
export const FIELD_WIDTH = 68;
export const GOAL_WIDTH = 11;
export const GOAL_HEIGHT = 3.6;
export const GOAL_DEPTH = 2.6;
export const BOX_DEPTH = 16.5;    // 禁区深度(门将活动范围)
export const BOX_WIDTH = 40;

export const GRAVITY = -30;       // 仍偏街机,但更接近真实
export const BALL_RADIUS = 0.45;
export const BALL_BOUNCE = 0.62;
export const BALL_FRICTION = 0.985;
export const BALL_AIR_DRAG = 0.995;
export const BALL_SPIN_DECAY = 1.65; // 普通球侧旋每秒衰减
export const GOAL_FRAME_RADIUS = 0.12;

export const PLAYER_RADIUS = 0.9;
export const PLAYER_SCALE = 1.35; // 模型视觉缩放
export const RUN_SPEED = 10.5;
export const DASH_SPEED = 17;
export const DASH_TIME = 0.5;
export const DASH_COOLDOWN = 0.55;
export const JUMP_VEL = 10.5;
export const SLIDE_SPEED = 15;
export const SLIDE_TIME = 0.55;
export const SLIDE_EVADE_Y = 0.35;
export const DASH_HIT_MAX_DY = 1.2;
export const FALL_TIME = 1.2;     // 被撞倒后倒地时间
export const KEEPER_SPEED = 9.5;
export const KEEPER_DIVE_TIME = 0.62;
export const KEEPER_REACTION_MIN = 0.16;

export const DRIBBLE_TIME = 0.4;
export const DRIBBLE_BURST_START = 0.06;
export const DRIBBLE_BURST_END = 0.22;
export const DRIBBLE_SPEED = 13;
export const DRIBBLE_COOLDOWN = 1.1;

export const FAKE_SHOT_TAP = 0.14;      // 蓄力不足此值松开 = 假射
export const FAKE_SHOT_LOCK = 0.35;     // 假射后硬直
export const SHOOT_CHARGE_MAX = 0.5;    // 蓄力上限(力量加成)

export const STAMINA_MAX = 100;
export const STAMINA_DASH_COST = 15;
export const STAMINA_SLIDE_COST = 10;
export const STAMINA_DRIBBLE_COST = 7;
export const STAMINA_RECOVERY = 7.5;     // 低强度状态每秒恢复
export const STAMINA_RUN_DRAIN = 0.32;

export const PASS_SPEED = 26;
export const SHOOT_SPEED = 33;
export const SPECIAL_SPEED = 44;
export const SHOOT_LIFT = 7.5;

export const ENERGY_MAX = 100;
export const ENERGY_PER_PASS = 26;
export const ENERGY_PER_TACKLE = 12;
export const ENERGY_DRAIN = 1.2;  // 每秒缓慢衰减
export const COMBO_TIMEOUT = 5.5;  // 连续配合保留时间

export const HALF_TIME = 90;      // 单半场秒数(街机节奏)
export const TEAM_SIZE = 6;       // 6v6(含门将)

export const RENDER_W = 854;      // 渲染目标分辨率(轻度像素化+写实)
export const RENDER_H = 480;
