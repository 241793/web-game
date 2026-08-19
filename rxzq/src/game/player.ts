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
  fakeShotT = 0;                  // 假射诱骗窗口
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
    }

    this.x += this.vx * dt;
    this.z += this.vz * dt;

    // 场地边界(球员可小幅出界)
    const mx = C.FIELD_LENGTH / 2 + 3, mz = C.FIELD_WIDTH / 2 + 3;
    this.x = Math.max(-mx, Math.min(mx, this.x));
    this.z = Math.max(-mz, Math.min(mz, this.z));
  }
}
