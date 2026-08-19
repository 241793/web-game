// 芯片音效合成器:方波/三角波/噪声,全部程序生成,FC 质感
export class Sfx {
  ctx: AudioContext | null = null;
  master!: GainNode;
  crowdNode: AudioBufferSourceNode | null = null;
  muted = false;

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.startCrowd();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  private tone(type: OscillatorType, freq: number, dur: number, vol = 0.3, slideTo?: number, delay = 0) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, vol = 0.25, freq = 1200, delay = 0) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filt).connect(g).connect(this.master);
    src.start(t0);
  }

  // 持续观众白噪声(低音量氛围)
  private startCrowd() {
    if (!this.ctx) return;
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; // 布朗噪声
      d[i] = last * 6;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const g = this.ctx.createGain();
    g.gain.value = 0.09;
    src.connect(g).connect(this.master);
    src.start();
    this.crowdNode = src;
  }

  kick() { this.noise(0.08, 0.35, 900); this.tone('square', 180, 0.07, 0.15, 90); }
  pass() { this.noise(0.06, 0.25, 1200); this.tone('square', 260, 0.05, 0.12, 160); }
  shoot() { this.noise(0.1, 0.4, 800); this.tone('square', 140, 0.12, 0.22, 60); }
  bounce() { this.tone('triangle', 220, 0.08, 0.2, 120); }
  jump() { this.tone('square', 300, 0.12, 0.15, 620); }
  dribble() { this.noise(0.07, 0.18, 1500); this.tone('triangle', 360, 0.09, 0.12, 520); }
  dribbleWin() { this.tone('square', 520, 0.08, 0.16, 720); this.tone('square', 780, 0.12, 0.14, undefined, 0.06); }
  fakeShot() { this.noise(0.08, 0.2, 1800); this.tone('square', 200, 0.07, 0.12, 90); }
  tackle() { this.noise(0.15, 0.3, 500); }
  collide() { this.noise(0.12, 0.4, 600); this.tone('square', 90, 0.15, 0.3, 40); }
  post() { this.tone('square', 520, 0.3, 0.3, 500); }
  save() { this.noise(0.1, 0.3, 1000); this.tone('square', 200, 0.1, 0.2); }
  switchPlayer() {
    this.tone('sine', 520, 0.055, 0.1, 720);
    this.tone('triangle', 780, 0.075, 0.08, undefined, 0.035);
  }
  tactic() {
    // 短促铜锣感:低频正弦叠加带通噪声。
    this.tone('sine', 150, 0.34, 0.18, 92);
    this.tone('triangle', 310, 0.22, 0.1, 180);
    this.noise(0.18, 0.09, 1800);
  }

  whistle() {
    // 裁判哨:双高频颤音
    if (!this.ctx) return;
    for (let i = 0; i < 2; i++) {
      this.tone('square', 2350, 0.16, 0.12, 2300, i * 0.2);
      this.tone('square', 2410, 0.16, 0.08, 2350, i * 0.2);
    }
  }

  special() {
    // 必杀发动:上升琶音 + 爆音
    const seq = [330, 440, 554, 660, 880];
    seq.forEach((f, i) => this.tone('square', f, 0.09, 0.2, undefined, i * 0.05));
    this.noise(0.35, 0.35, 700, 0.25);
    this.tone('sawtooth', 110, 0.4, 0.25, 45, 0.25);
  }

  knockdown() {
    this.tone('square', 400, 0.25, 0.25, 60);
    this.noise(0.2, 0.3, 400, 0.05);
  }

  goal() {
    // 进球小号式庆祝旋律(原创短句)
    const melody: [number, number][] = [
      [523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.3],
      [784, 0.12], [1047, 0.45],
    ];
    let t = 0;
    for (const [f, d] of melody) {
      this.tone('square', f, d, 0.22, undefined, t);
      this.tone('triangle', f / 2, d, 0.18, undefined, t);
      t += d + 0.02;
    }
    // 观众欢呼白噪声脉冲
    this.noise(1.4, 0.28, 2400, 0.1);
  }

  menuMove() { this.tone('square', 660, 0.05, 0.12); }
  menuOk() { this.tone('square', 523, 0.07, 0.15); this.tone('square', 784, 0.12, 0.15, undefined, 0.07); }
}

export const sfx = new Sfx();
