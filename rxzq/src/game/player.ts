import * as C from '../core/constants';
import { PlayerDef, PlayerState } from '../core/types';

export class Player {
  x = 0; y = 0; z = 0;           // y=离地高度
  vx = 0; vy = 0; vz = 0;
  faceX = 1; faceZ = 0;
  state: PlayerState = 'idle';
  stateT = 0;
  team: number;                   // 0=左攻右, 1=右攻左
  index: number;                  // 0=门将
  def: PlayerDef;
  homeX = 0; homeZ = 0;           // 阵型基准位
  dashT = 0; dashCd = 0;
  dribbleCd = 0;
  dribbleDirX = 0; dribbleDirZ = 0;
  dribbleStartThreat = 0;         // 过人起手时最近对手距离
  wasDribbling = false;           // 上一帧是否处于 dribble(用于结果判定)
  shootChargeT = -1;              // -1=未蓄力,>=0=蓄力秒数
  shootAimX = 0;                  // 蓄力时缓存的最后有效瞄准(归一化,无输入=0,0)
  shootAimZ = 0;
  fakeShotT = 0;                  // 假射诱骗窗口
  passCallT = 0;                  // 要球请求剩余时间
  passCallDirX = 0; passCallDirZ = 0; // 要球方向(0=脚下,非0=前方空间)
  keeperDiveChargeT = -1;         // 门将扑救蓄力(-1=未蓄力)
  divePower = 0;                  // 本次扑救力度(0..1),决定扑救半径与高度
  chipRequestT = 0;               // 吊射请求窗口(过人键触发)
  trickType: 'none' | 'roulette' | 'stepover' | 'rainbow' | 'elastico' | 'croqueta' = 'none';
  trickT = 0;                     // 技巧动作剩余时间
  trickDoubleT = 0;               // 双击过人键检测窗口
  trickFired = false;             // 牛尾巴反向弹出是否已触发(一次性)
  landingGraceT = 0;              // 落地缓冲:能量满时落地后仍可短暂触发必杀
  shieldActive = false;           // 护球中(按住战术键)
  celebrateStyle = 0;             // 庆祝动作样式 0=滑跪 1=飞翔 2=摇篮舞 3=挥拳
  controlled = false;             // 当前被玩家操控
  kickCd = 0;                     // 踢球后小硬直
  stunned = 0;                    // 冻结(寒冰特效)
  animT = 0;
  stamina = C.STAMINA_MAX;        // 体力影响持续冲刺与后程移动

  constructor(team: number, index: number, def: PlayerDef) {
    this.team = team; this.index = index; this.def = def;
  }

  get isKeeper() { return this.index === 0; }
  get busy() { return this.state === 'fallen' || this.state === 'slide' || this.state === 'tackle' || this.state === 'kick' || this.state === 'dribble' || this.state === 'dive' || this.stunned > 0; }
  get onGround() { return this.y <= 0.001; }

  face(dx: number, dz: number) {
    const len = Math.hypot(dx, dz);
    if (len > 0.001) { this.faceX = dx / len; this.faceZ = dz / len; }
  }

  setState(s: PlayerState) { this.state = s; this.stateT = 0; }

  moveSpeed() {
    let s = C.RUN_SPEED * this.def.speed;
    if (this.isKeeper) s = C.KEEPER_SPEED * this.def.speed;
    if (this.state === 'dash') s = C.DASH_SPEED * this.def.speed;
    // 低体力不会让角色完全失去响应,但会明显削弱无脑长时间冲刺。
    const staminaScale = 0.8 + 0.2 * Math.sqrt(this.stamina / C.STAMINA_MAX);
    return s * staminaScale;
  }

  consumeStamina(amount: number) {
    if (this.stamina + 1e-6 < amount) return false;
    this.stamina = Math.max(0, this.stamina - amount);
    return true;
  }

  knockdown(dirX: number, dirZ: number, force = 10) {
    if (this.state === 'fallen') return;
    this.setState('fallen');
    this.vx = dirX * force; this.vz = dirZ * force;
    this.vy = 6;
  }

  update(dt: number) {
    this.stateT += dt;
    this.animT += dt;
    this.wasDribbling = this.state === 'dribble';
    if (this.kickCd > 0) this.kickCd = Math.max(0, this.kickCd - dt);
    if (this.dashCd > 0) this.dashCd = Math.max(0, this.dashCd - dt);
    if (this.dribbleCd > 0) this.dribbleCd = Math.max(0, this.dribbleCd - dt);
    if (this.fakeShotT > 0) this.fakeShotT = Math.max(0, this.fakeShotT - dt);
    if (this.passCallT > 0) this.passCallT = Math.max(0, this.passCallT - dt);
    if (this.chipRequestT > 0) this.chipRequestT = Math.max(0, this.chipRequestT - dt);
    if (this.trickT > 0) this.trickT = Math.max(0, this.trickT - dt);
    if (this.trickDoubleT > 0) this.trickDoubleT = Math.max(0, this.trickDoubleT - dt);
    if (this.landingGraceT > 0) this.landingGraceT = Math.max(0, this.landingGraceT - dt);
    if (this.stunned > 0) { this.stunned = Math.max(0, this.stunned - dt); this.vx = 0; this.vz = 0; }

    const moving = Math.hypot(this.vx, this.vz) > 1;
    if (this.state === 'dash') this.stamina = Math.max(0, this.stamina - 6 * dt);
    else if (this.state === 'dribble') this.stamina = Math.max(0, this.stamina - 3 * dt);
    else if (this.state === 'run' && moving) this.stamina = Math.max(0, this.stamina - C.STAMINA_RUN_DRAIN * dt);
    else if (this.state === 'idle' || this.state === 'kick' || this.state === 'fallen') {
      this.stamina = Math.min(C.STAMINA_MAX, this.stamina + C.STAMINA_RECOVERY * dt);
    }

    // 重力(跳跃/被击飞)
    if (this.y > 0 || this.vy > 0) {
      this.vy += C.GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0; this.vy = 0;
        if (this.state === 'jump' || this.state === 'headbutt') this.setState('idle');
      }
    }

    switch (this.state) {
      case 'dash':
        this.dashT -= dt;
        if (this.dashT <= 0) this.setState('run');
        break;
      case 'dribble': {
        // 技巧过人:回旋原地转身,单车小幅晃动;基础过人保持原爆发逻辑
        if (this.trickType === 'roulette') {
          const speed = this.stateT < C.TRICK_TIME ? 4.5 : 6;
          const spinDir = Math.sign(this.dribbleDirX * -this.faceZ + this.dribbleDirZ * this.faceX) || 1;
          this.vx = (this.faceX * -spinDir) * speed * 0.5;
          this.vz = (this.faceZ * -spinDir) * speed * 0.5;
          if (this.stateT >= C.TRICK_TIME) {
            this.face(this.dribbleDirX, this.dribbleDirZ);
            this.setState('run');
          }
          break;
        }
        if (this.trickType === 'stepover') {
          const sway = Math.sin(this.stateT * 26) * 3.2;
          const px = -this.dribbleDirZ, pz = this.dribbleDirX;
          this.vx = px * sway + this.dribbleDirX * 2.2;
          this.vz = pz * sway + this.dribbleDirZ * 2.2;
          if (this.stateT >= C.TRICK_TIME) {
            this.face(this.dribbleDirX, this.dribbleDirZ);
            this.vx = this.dribbleDirX * 9; this.vz = this.dribbleDirZ * 9;
            this.setState('run');
          }
          break;
        }
        // 彩虹过人:挑球越顶后自身加速追球
        if (this.trickType === 'rainbow') {
          const chase = 1.25 + this.stateT * 0.6;
          this.vx = this.dribbleDirX * 8.5 * chase;
          this.vz = this.dribbleDirZ * 8.5 * chase;
          if (this.stateT >= 0.5) {
            this.face(this.dribbleDirX, this.dribbleDirZ);
            this.setState('run');
          }
          break;
        }
        // 牛尾巴:先向外晃再急速反向弹出
        if (this.trickType === 'elastico') {
          const px = -this.dribbleDirZ, pz = this.dribbleDirX;
          if (this.stateT < 0.18) {
            // 外侧假动作
            this.vx = (px + this.dribbleDirX * 0.3) * 5;
            this.vz = (pz + this.dribbleDirZ * 0.3) * 5;
          } else {
            // 反向急弹
            this.vx = (-px * 1.1 + this.dribbleDirX * 0.55) * 11;
            this.vz = (-pz * 1.1 + this.dribbleDirZ * 0.55) * 11;
            if (!this.trickFired) {
              this.trickFired = true;
              this.face(-px + this.dribbleDirX, -pz + this.dribbleDirZ);
            }
          }
          if (this.stateT >= 0.45) {
            this.face(this.dribbleDirX, this.dribbleDirZ);
            this.vx = this.dribbleDirX * 10; this.vz = this.dribbleDirZ * 10;
            this.setState('run');
          }
          break;
        }
        // 油炸丸子:快速横拨小位移
        if (this.trickType === 'croqueta') {
          const px = -this.dribbleDirZ, pz = this.dribbleDirX;
          const kick = this.stateT < 0.12 ? 12 : 7;
          this.vx = px * kick; this.vz = pz * kick;
          if (this.stateT >= 0.3) {
            this.setState('run');
          }
          break;
        }
        const speed = this.stateT < C.DRIBBLE_BURST_START ? 6
          : this.stateT < C.DRIBBLE_BURST_END ? C.DRIBBLE_SPEED : 4;
        this.vx = this.dribbleDirX * speed;
        this.vz = this.dribbleDirZ * speed;
        if (this.stateT >= C.DRIBBLE_TIME) this.setState('run');
        break;
      }
      case 'slide':
      case 'tackle': {
        // 衰减常量按 60fps 定义,按 dt 换算后各帧率一致
        const decay = Math.pow(0.94, dt * 60);
        this.vx *= decay; this.vz *= decay;
        if (this.stateT >= C.SLIDE_TIME) this.setState('idle');
        break;
      }
      case 'dive': {
        const decay = Math.pow(0.975, dt * 60);
        this.vx *= decay; this.vz *= decay;
        if (this.stateT >= C.KEEPER_DIVE_TIME && this.onGround) this.setState('idle');
        break;
      }
      case 'fallen': {
        const decay = Math.pow(0.9, dt * 60);
        this.vx *= decay; this.vz *= decay;
        if (this.stateT >= C.FALL_TIME && this.onGround) this.setState('idle');
        break;
      }
      case 'kick':
        if (this.stateT >= 0.28) this.setState('idle');
        break;
      case 'celebrateSlide': {
        // 滑跪:前向滑行衰减,2.2s 后收势
        const decay = Math.pow(0.965, dt * 60);
        this.vx *= decay; this.vz *= decay;
        if (this.stateT >= 2.2) { this.vx = this.vz = 0; this.setState('idle'); }
        break;
      }
      case 'celebrateFly':
      case 'celebrateCradle':
      case 'celebrate': {
        if (this.stateT >= 3.0 && this.onGround) this.setState('idle');
        break;
      }
    }

    this.x += this.vx * dt;
    this.z += this.vz * dt;

    // 场地边界(球员可小幅出界)
    const mx = C.FIELD_LENGTH / 2 + 3, mz = C.FIELD_WIDTH / 2 + 3;
    this.x = Math.max(-mx, Math.min(mx, this.x));
    this.z = Math.max(-mz, Math.min(mz, this.z));
  }
}
