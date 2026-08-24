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
export const RUN_SPEED = 7.6;
export const DASH_SPEED = 12.4;
export const DASH_TIME = 0.5;
export const DASH_COOLDOWN = 0.8;
export const JUMP_VEL = 10.5;
export const SLIDE_SPEED = 12;
export const SLIDE_TIME = 0.55;
export const SLIDE_EVADE_Y = 0.35;
export const DASH_HIT_MAX_DY = 1.2;
export const FALL_TIME = 1.2;     // 被撞倒后倒地时间
export const KEEPER_SPEED = 7.6;
export const KEEPER_DIVE_TIME = 0.62;
export const KEEPER_REACTION_MIN = 0.16;

export const DRIBBLE_TIME = 0.4;
export const DRIBBLE_BURST_START = 0.06;
export const DRIBBLE_BURST_END = 0.22;
export const DRIBBLE_SPEED = 9.6;
export const DRIBBLE_COOLDOWN = 1.4;

export const FAKE_SHOT_TAP = 0.14;      // 蓄力不足此值松开 = 假射
export const FAKE_SHOT_LOCK = 0.35;     // 假射后硬直
export const SHOOT_CHARGE_MAX = 0.5;    // 蓄力上限(满蓄=重炮/必杀地面触发)
export const SHOOT_CHARGE_PRECISE = 0.5;// 深蓄阈值(占比,≥此值获得精准修正)
export const CHARGE_MOVE_SCALE = 0.4;   // 蓄力期间可移动的跑速比例
export const FAKE_COMBO_WINDOW = 0.25;  // 假射后接过人的连招窗口
export const CANNON_POWER_MUL = 1.45;   // 重炮轰门力量倍率
export const CANNON_MAX_LIFT = 3.2;     // 重炮贴地强袭抬升上限

export const PASS_CALL_WINDOW = 0.9;    // 要球请求有效时长(秒)
export const PASS_CALL_SPACE = 5;       // 空间要球的落点偏移(米)

export const KEEPER_DIVE_CHARGE_MAX = 0.45; // 门将扑救蓄力上限
export const KEEPER_PUNCH_HOLD_T = 0.32;    // 长按跳跃达到此值松开=拳击解围
export const CHIP_WINDOW = 0.4;         // 吊射请求窗口(过人键触发后)
export const TRICK_TIME = 0.42;         // 技巧过人动作时长
export const TRICK_COOLDOWN = 1.3;      // 技巧过人冷却
export const RAINBOW_BALL_LIFT = 8.5;   // 彩虹过人挑球抬升
export const RAINBOW_UNTOUCH = 0.9;     // 彩虹挑球后无人可拾时长
export const ELASTICO_STUN = 0.7;       // 牛尾巴僵直时长
export const CROQUETA_CD = 0.7;         // 油炸丸子冷却(可连续串联)
export const DOUBLE_TAP_WINDOW = 0.28;  // 双击过人键判定窗口

export const STAMINA_MAX = 100;
export const STAMINA_DASH_COST = 15;
export const STAMINA_SLIDE_COST = 10;
export const STAMINA_DRIBBLE_COST = 7;
export const STAMINA_RECOVERY = 7.5;     // 低强度状态每秒恢复
export const STAMINA_RUN_DRAIN = 0.32;

export const PASS_SPEED = 19;
export const SHOOT_SPEED = 25;
export const SPECIAL_SPEED = 34;
export const SHOOT_LIFT = 7.5;

export const ENERGY_MAX = 100;
export const ENERGY_PER_PASS = 26;
export const ENERGY_PER_TACKLE = 12;
export const ENERGY_DRAIN = 0.55;  // 每秒缓慢衰减(放缓,能量更容易保持满槽)
export const COMBO_TIMEOUT = 5.5;  // 连续配合保留时间
export const LANDING_GRACE_T = 0.35; // 能量满时落地后仍可触发必杀的缓冲窗口

export const HALF_TIME = 90;      // 单半场秒数(街机节奏)
export const TEAM_SIZE = 6;       // 6v6(含门将)
export const SHIELD_MOVE_SCALE = 0.55; // 护球移动减速比例
export const SHIELD_ENERGY_RATE = 4;   // 护球每秒能量积累
export const SPRINT_BACK_WINDOW = 2.0; // 丢球后快速回追判定窗口(秒)
export const SPRINT_BACK_CD = 3.0;     // 快速回追冷却
export const GOAL_CELEBRATE_T = 3.4;   // 进球庆祝阶段时长

export const RENDER_W = 854;      // 渲染目标分辨率(轻度像素化+写实)
export const RENDER_H = 480;
