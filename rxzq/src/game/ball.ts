import * as C from '../core/constants';
import { SpecialDef } from '../core/specials';
import { Player } from './player';

export class Ball {
  x = 0; y = C.BALL_RADIUS; z = 0;
  prevX = 0; prevY = C.BALL_RADIUS; prevZ = 0;
  vx = 0; vy = 0; vz = 0;
  spin = 0;                       // 视觉旋转速度
  swerve = 0;                     // 普通球侧旋(正值向当前速度左侧弯曲)
  owner: Player | null = null;    // 持球者
  lastKicker: Player | null = null;
  lastTeam = -1;                  // 最后触球方(界外球判定)
  special: SpecialDef | null = null; // 处于必杀弹道中
  specialT = 0;
  specialDirX = 0; specialDirZ = 0;  // 必杀基准方向
  specialSide = 1;
  untouchable = 0;                // 踢出后短暂无法被同一人捡回
  flightId = 0;                   // 每次 kick 的唯一编号,供扫掠/统计去重

  reset(x = 0, z = 0) {
    this.x = this.prevX = x;
    this.z = this.prevZ = z;
    this.y = this.prevY = C.BALL_RADIUS;
    this.vx = this.vy = this.vz = 0;
    this.swerve = 0;
    this.owner = null; this.special = null; this.untouchable = 0;
  }

  kick(
    vx: number,
    vy: number,
    vz: number,
    kicker: Player | null,
    special: SpecialDef | null = null,
    swerve = 0,
  ) {
    this.prevX = this.x; this.prevY = this.y; this.prevZ = this.z;
    this.flightId++;
    this.owner = null;
    this.vx = vx; this.vy = vy; this.vz = vz;
    this.lastKicker = kicker;
    if (kicker) this.lastTeam = kicker.team;
    this.untouchable = 0.25;
    this.special = special;
    this.swerve = special ? 0 : swerve;
    this.specialT = 0;
    if (special) {
      const len = Math.hypot(vx, vz) || 1;
      this.specialDirX = vx / len; this.specialDirZ = vz / len;
      this.specialSide = Math.random() < 0.5 ? 1 : -1;
      this.untouchable = 0.35;
    }
  }

  update(dt: number, windX: number, windZ: number, friction = C.BALL_FRICTION) {
    this.prevX = this.x; this.prevY = this.y; this.prevZ = this.z;
    if (this.untouchable > 0) this.untouchable = Math.max(0, this.untouchable - dt);

    if (this.owner) {
      // 吸附在持球者脚下前方
      const o = this.owner;
      const ahead = 1.35;
      this.x = o.x + o.faceX * ahead;
      this.z = o.z + o.faceZ * ahead;
      this.y = C.BALL_RADIUS + (o.y > 0 ? o.y : 0);
      this.vx = this.vy = this.vz = 0;
      this.spin = Math.hypot(o.vx, o.vz) * 0.6;
      return;
    }

    const sp = this.special;
    if (sp) {
      this.specialT += dt;
      // 必杀弹道:基准方向恒速 + 弯曲/摆动,重力削弱
      const base = C.SPECIAL_SPEED * sp.speed;
      const t = this.specialT;
      const px = -this.specialDirZ, pz = this.specialDirX; // 垂直向量
      let lat = sp.curve * this.specialSide * t;           // 持续弯曲
      if (sp.wave > 0) lat += Math.sin(t * sp.waveFreq) * sp.wave;
      this.vx = this.specialDirX * base + px * lat;
      this.vz = this.specialDirZ * base + pz * lat;
      this.vy += C.GRAVITY * sp.gravityScale * dt;
      if (sp.ground) { this.y = C.BALL_RADIUS; this.vy = 0; }
      this.spin = 40;
      if (this.specialT > 2.2) this.special = null; // 超时衰减为普通球
    } else {
      // 普通物理
      this.vy += C.GRAVITY * dt;
      this.vx += windX * dt; this.vz += windZ * dt;
      // 马格努斯侧旋:加速度始终垂直于水平速度,不会凭空改变总速率。
      const hsp = Math.hypot(this.vx, this.vz);
      if (hsp > 3 && Math.abs(this.swerve) > 0.01) {
        const curveAccel = this.swerve * Math.min(1, hsp / 26);
        const sx = -this.vz / hsp, sz = this.vx / hsp;
        this.vx += sx * curveAccel * dt;
        this.vz += sz * curveAccel * dt;
        this.swerve *= Math.exp(-C.BALL_SPIN_DECAY * dt);
      }
      const frameDecay = this.y <= C.BALL_RADIUS + 0.01 ? friction : C.BALL_AIR_DRAG;
      const decay = Math.pow(frameDecay, dt * 60);
      this.vx *= decay; this.vz *= decay;
      this.spin = Math.max(0, this.spin - dt * 20);
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;

    // 地面反弹
    if (this.y < C.BALL_RADIUS) {
      this.y = C.BALL_RADIUS;
      if (this.vy < 0) {
        this.vy = -this.vy * C.BALL_BOUNCE;
        if (Math.abs(this.vy) < 2) this.vy = 0;
        if (this.special?.ground) this.vy = 0;
      }
    }
  }

  speed() { return Math.hypot(this.vx, this.vz); }
}
