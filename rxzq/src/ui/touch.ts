import { Input } from '../core/input';

// 移动端虚拟摇杆 + 四按钮(指针事件,支持多点与中断清理)
export class TouchControls {
  root: HTMLDivElement;
  private stickBase!: HTMLDivElement;
  private stickKnob!: HTMLDivElement;
  private stickActive = false;
  private stickId: number | null = null;
  private stickCenter = { x: 0, y: 0 };
  onPause: () => void = () => {};

  constructor(parent: HTMLElement, private input: Input) {
    this.root = document.createElement('div');
    this.root.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none;';
    parent.appendChild(this.root);

    if (this.isTouchDevice()) this.root.style.display = 'block';

    this.buildStick();
    this.buildButtons();
    this.buildPause();

    // 窗口失焦/切后台时统一复位,防止摇杆与按钮粘住
    window.addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.reset();
    });
  }

  isTouchDevice() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }

  reset() {
    this.stickActive = false;
    this.stickId = null;
    this.input.touchDir = { x: 0, z: 0, active: false };
    this.input.touchBtn = {
      pass: false, shoot: false, dash: false, jump: false, skill: false,
      tactic: false,
    };
    this.stickKnob.style.transform = 'translate(-50%,-50%)';
  }

  private buildStick() {
    const safeL = 'calc(env(safe-area-inset-left, 0px) + 3vw)';
    const safeB = 'calc(env(safe-area-inset-bottom, 0px) + 4vh)';
    this.stickBase = document.createElement('div');
    this.stickBase.style.cssText = `position:absolute;left:${safeL};bottom:${safeB};width:clamp(96px,14vw,124px);height:clamp(96px,14vw,124px);border-radius:50%;
      background:rgba(255,255,255,.08);border:3px solid rgba(255,255,255,.35);pointer-events:auto;touch-action:none;user-select:none;`;
    this.stickKnob = document.createElement('div');
    this.stickKnob.style.cssText = `position:absolute;left:50%;top:50%;width:44px;height:44px;border-radius:50%;
      background:rgba(255,255,255,.4);transform:translate(-50%,-50%);pointer-events:none;`;
    this.stickBase.appendChild(this.stickKnob);
    this.root.appendChild(this.stickBase);

    const onMove = (px: number, py: number) => {
      const dx = px - this.stickCenter.x, dy = py - this.stickCenter.y;
      const d = Math.hypot(dx, dy), max = this.stickBase.clientWidth / 2 - 10;
      const cl = Math.min(d, max);
      const nx = d > 4 ? dx / d : 0, ny = d > 4 ? dy / d : 0;
      this.stickKnob.style.transform = `translate(calc(-50% + ${nx * cl}px), calc(-50% + ${ny * cl}px))`;
      this.input.touchDir.x = nx * (cl / max);
      this.input.touchDir.z = ny * (cl / max);
      this.input.touchDir.active = true;
    };

    this.stickBase.addEventListener('pointerdown', e => {
      e.preventDefault();
      this.stickBase.setPointerCapture(e.pointerId);
      this.stickId = e.pointerId;
      this.stickActive = true;
      const r = this.stickBase.getBoundingClientRect();
      this.stickCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      onMove(e.clientX, e.clientY);
    });
    this.stickBase.addEventListener('pointermove', e => {
      if (this.stickActive && e.pointerId === this.stickId) onMove(e.clientX, e.clientY);
    });
    const release = (e: PointerEvent) => {
      if (e.pointerId !== this.stickId) return;
      this.stickId = null;
      this.stickActive = false;
      this.input.touchDir = { x: 0, z: 0, active: false };
      this.stickKnob.style.transform = 'translate(-50%,-50%)';
    };
    this.stickBase.addEventListener('pointerup', release);
    this.stickBase.addEventListener('pointercancel', release);
  }

  private buildButtons() {
    const safeR = 'calc(env(safe-area-inset-right, 0px) + 3vw)';
    const safeB = 'calc(env(safe-area-inset-bottom, 0px) + 4vh)';
    const defs: { key: 'pass' | 'shoot' | 'dash' | 'jump' | 'skill'; label: string; transform: string; color: string }[] = [
      { key: 'pass', label: '传/要/铲', transform: 'translate(calc(-1 * clamp(84px,14vw,112px)), -3vh)', color: '#3a8af5' },
      { key: 'shoot', label: '射门', transform: 'translate(0, -3vh)', color: '#f53d3d' },
      { key: 'jump', label: '跳', transform: 'translate(0, calc(-3vh - clamp(72px,12vw,88px)))', color: '#3df58a' },
      { key: 'dash', label: '冲刺', transform: 'translate(calc(-1 * clamp(84px,14vw,112px)), calc(-3vh - clamp(72px,12vw,88px)))', color: '#f5a63d' },
      { key: 'skill', label: '过人', transform: 'translate(calc(-.5 * clamp(84px,14vw,112px)), calc(-3vh - clamp(144px,24vw,176px)))', color: '#c56af5' },
    ];
    // 右下角按钮群
    for (const d of defs) {
      const btn = document.createElement('div');
      btn.textContent = d.label;
      btn.style.cssText = `position:absolute;right:${safeR};bottom:${safeB};width:clamp(56px,11vw,72px);height:clamp(56px,11vw,72px);border-radius:50%;
        background:${d.color}55;border:3px solid ${d.color};color:#fff;display:flex;align-items:center;justify-content:center;
        font-size:13px;font-weight:bold;pointer-events:auto;touch-action:none;user-select:none;text-shadow:1px 1px 0 #000;transform:${d.transform};`;
      const set = (v: boolean) => (this.input.touchBtn[d.key] = v);
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        set(true);
        btn.style.background = `${d.color}aa`;
      });
      const rel = () => { set(false); btn.style.background = `${d.color}55`; };
      btn.addEventListener('pointerup', rel);
      btn.addEventListener('pointercancel', rel);
      this.root.appendChild(btn);
    }

    // 摇杆上方的辅助按钮:即时战术，避免与五个动作键拥挤。
    const utility = [
      { key: 'tactic' as const, label: '战术', color: '#d84a3a', offset: 0 },
    ];
    for (const d of utility) {
      const btn = document.createElement('div');
      btn.textContent = d.label;
      btn.style.cssText = `position:absolute;left:calc(env(safe-area-inset-left, 0px) + 3vw + ${d.offset}px);bottom:calc(env(safe-area-inset-bottom, 0px) + 4vh + clamp(108px,16vw,142px));
        width:52px;height:34px;border-radius:17px;background:${d.color}55;border:2px solid ${d.color};
        color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;
        pointer-events:auto;touch-action:none;user-select:none;text-shadow:1px 1px 0 #000;`;
      const set = (value: boolean) => (this.input.touchBtn[d.key] = value);
      btn.addEventListener('pointerdown', e => {
        e.preventDefault(); btn.setPointerCapture(e.pointerId); set(true); btn.style.background = `${d.color}aa`;
      });
      const release = () => { set(false); btn.style.background = `${d.color}55`; };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      this.root.appendChild(btn);
    }
  }

  private buildPause() {
    const btn = document.createElement('div');
    btn.textContent = '⏸';
    btn.style.cssText = `position:absolute;top:calc(env(safe-area-inset-top, 0px) + 8px);left:10px;width:clamp(36px,8vw,48px);height:clamp(36px,8vw,48px);
      border-radius:50%;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.4);color:#fff;display:flex;align-items:center;justify-content:center;
      font-size:18px;pointer-events:auto;touch-action:none;user-select:none;`;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); this.onPause(); });
    this.root.appendChild(btn);
  }

  show(v: boolean) {
    this.root.style.display = v && this.isTouchDevice() ? 'block' : 'none';
    if (!v) this.reset();
  }
}
