// 统一输入层:键盘 + 触屏虚拟按键 + Gamepad
// Xbox: X=传球/铲球 B=射门 Y=冲刺 A=跳跃 RB=过人
export interface InputState {
  dirX: number;   // -1..1  (屏幕坐标: 右为 +x)
  dirZ: number;   // -1..1  (下为 +z)
  pass: boolean;
  shoot: boolean;
  dash: boolean;
  jump: boolean;
  skill: boolean;
  tactic: boolean;
  passPressed: boolean;   // 本帧按下(边沿)
  shootPressed: boolean;
  dashPressed: boolean;
  jumpPressed: boolean;
  skillPressed: boolean;
  tacticPressed: boolean;
}

// 手柄标准布局(Xbox 风格):0=A 1=B 2=X 3=Y 4=LB 5=RB 6=LT 7=RT 9=Start 12-15=十字键
export class Input {
  private keys = new Set<string>();
  private prev = {
    pass: false, shoot: false, dash: false, jump: false, skill: false,
    tactic: false,
  };
  private prevStart = false;
  state: InputState = {
    dirX: 0, dirZ: 0, pass: false, shoot: false, dash: false, jump: false, skill: false,
    tactic: false,
    passPressed: false, shootPressed: false, dashPressed: false, jumpPressed: false, skillPressed: false,
    tacticPressed: false,
  };
  // 虚拟摇杆/按钮写入口(移动端 UI 调用)
  touchDir = { x: 0, z: 0, active: false };
  touchBtn = { pass: false, shoot: false, dash: false, jump: false, skill: false, tactic: false };
  // 暂停触发边沿(ESC 由 main 监听,此处处理手柄 Start)
  startPressed = false;

  constructor() {
    window.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab'].includes(e.key)) e.preventDefault();
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.touchDir.active = false;
      this.touchDir.x = 0; this.touchDir.z = 0;
      this.touchBtn.pass = this.touchBtn.shoot = this.touchBtn.dash = this.touchBtn.jump = this.touchBtn.skill = false;
      this.touchBtn.tactic = false;
    });
  }

  private key(...ks: string[]) { return ks.some(k => this.keys.has(k)); }

  private gpPad(): Gamepad | null {
    const pads = navigator.getGamepads?.();
    if (!pads) return null;
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      if (p && p.connected) return p;
    }
    return null;
  }

  update() {
    const s = this.state;
    const gp = this.gpPad();

    // 键盘方向
    let dx = 0, dz = 0;
    if (this.key('arrowleft', 'a')) dx -= 1;
    if (this.key('arrowright', 'd')) dx += 1;
    if (this.key('arrowup', 'w')) dz -= 1;
    if (this.key('arrowdown', 's')) dz += 1;

    // 手柄左摇杆/十字键(带死区)
    let gpX = 0, gpZ = 0;
    if (gp) {
      const dead = 0.2;
      const ax = gp.axes[0] ?? 0, ay = gp.axes[1] ?? 0;
      if (Math.abs(ax) > dead) gpX = (ax - Math.sign(ax) * dead) / (1 - dead);
      if (Math.abs(ay) > dead) gpZ = (ay - Math.sign(ay) * dead) / (1 - dead);
      const dp = gp.buttons;
      if (dp[12]?.pressed) gpZ = -1;
      if (dp[13]?.pressed) gpZ = 1;
      if (dp[14]?.pressed) gpX = -1;
      if (dp[15]?.pressed) gpX = 1;
    }
    if (this.touchDir.active) { dx = this.touchDir.x; dz = this.touchDir.z; }
    if (gp && (gpX !== 0 || gpZ !== 0)) { dx = gpX; dz = gpZ; }
    const len = Math.hypot(dx, dz);
    if (len > 1) { dx /= len; dz /= len; }
    s.dirX = dx; s.dirZ = dz;

    // 动作键(键盘/触屏/手柄任一触发)
    const pass = this.key('j', 'z') || this.touchBtn.pass || !!gp?.buttons[2]?.pressed;
    const shoot = this.key('k', 'x') || this.touchBtn.shoot || !!gp?.buttons[1]?.pressed;
    const dash = this.key('l', 'c', 'shift') || this.touchBtn.dash
      || !!gp?.buttons[3]?.pressed || (gp?.buttons[6]?.value ?? 0) > 0.5;
    const jump = this.key('i', ' ', 'v') || this.touchBtn.jump
      || !!gp?.buttons[0]?.pressed || (gp?.buttons[7]?.value ?? 0) > 0.5;
    const skill = this.key('q', 'u') || this.touchBtn.skill || !!gp?.buttons[5]?.pressed;
    const tactic = this.key('t') || this.touchBtn.tactic || !!gp?.buttons[10]?.pressed;

    s.passPressed = pass && !this.prev.pass;
    s.shootPressed = shoot && !this.prev.shoot;
    s.dashPressed = dash && !this.prev.dash;
    s.jumpPressed = jump && !this.prev.jump;
    s.skillPressed = skill && !this.prev.skill;
    s.tacticPressed = tactic && !this.prev.tactic;
    s.pass = pass; s.shoot = shoot; s.dash = dash; s.jump = jump; s.skill = skill;
    s.tactic = tactic;
    this.prev = { pass, shoot, dash, jump, skill, tactic };

    // 手柄 Start(暂停)
    const gpStart = !!gp?.buttons[9]?.pressed;
    this.startPressed = gpStart && !this.prevStart;
    this.prevStart = gpStart;
  }
}
