import { sfx } from '../audio/sfx';

// 比赛暂停层:继续 / 静音 / 训练重置 / 退出(二次确认)
export class PauseOverlay {
  root: HTMLDivElement;
  private visible = false;
  private quitBtn: HTMLButtonElement;
  private trainingResetBtn: HTMLButtonElement | null = null;
  private quitArmed = false;
  private quitTimer = 0;
  private onResume: () => void;
  private onQuit: () => void;
  private onTrainingReset?: () => void;
  private isTraining: () => boolean;

  constructor(parent: HTMLElement, opts: {
    onResume: () => void;
    onQuit: () => void;
    onTrainingReset?: () => void;
    isTraining: () => boolean;
  }) {
    this.onResume = opts.onResume;
    this.onQuit = opts.onQuit;
    this.onTrainingReset = opts.onTrainingReset;
    this.isTraining = opts.isTraining;

    this.root = document.createElement('div');
    this.root.style.cssText = `position:absolute;inset:0;display:none;align-items:center;justify-content:center;
      background:rgba(4,8,18,.8);z-index:40;font-family:"Courier New","SimHei",monospace;`;
    parent.appendChild(this.root);

    const box = document.createElement('div');
    box.style.cssText = 'border:3px solid #f5d33d;background:#0d1428f0;padding:28px 44px;text-align:center;max-width:min(90vw,420px);';
    const title = document.createElement('div');
    title.textContent = '暂停';
    title.style.cssText = 'font-size:30px;letter-spacing:8px;color:#f5d33d;text-shadow:2px 2px 0 #000;margin-bottom:18px;';
    box.appendChild(title);

    const mkBtn = (label: string, accent: string, cb: () => void): HTMLButtonElement => {
      const b = document.createElement('button');
      b.textContent = label;
      b.type = 'button';
      b.style.cssText = `display:block;width:100%;margin:8px 0;padding:10px 0;font-size:18px;letter-spacing:3px;cursor:pointer;
        color:#fff;background:#d83a2a22;border:2px solid ${accent};font-family:inherit;`;
      b.onclick = () => { sfx.ensure(); sfx.menuOk(); cb(); };
      box.appendChild(b);
      return b;
    };

    mkBtn('继续比赛', '#3df58a', () => this.hide());
    const muteBtn = mkBtn('', '#3dd5f5', () => {
      const muted = sfx.toggleMute();
      muteBtn.textContent = muted ? '🔇 恢复声音' : '🔊 静音';
    });
    muteBtn.textContent = sfx.muted ? '🔇 恢复声音' : '🔊 静音';

    if (this.onTrainingReset) {
      this.trainingResetBtn = mkBtn('重置训练 (R)', '#f5a63d', () => {
        if (this.isTraining()) this.onTrainingReset?.();
      });
    }

    this.quitBtn = mkBtn('退出比赛', '#f55', () => this.armQuit());
    box.appendChild(this.quitBtn);
    this.root.appendChild(box);
  }

  private armQuit() {
    if (this.quitArmed) { this.onQuit(); return; }
    this.quitArmed = true;
    this.quitTimer = 3;
    this.quitBtn.textContent = '再按一次确认退出';
    this.quitBtn.style.borderColor = '#fff';
  }

  update(dt: number) {
    if (this.quitArmed) {
      this.quitTimer -= dt;
      if (this.quitTimer <= 0) {
        this.quitArmed = false;
        this.quitBtn.textContent = '退出比赛';
        this.quitBtn.style.borderColor = '#f55';
      }
    }
  }

  toggle() { this.visible ? this.hide() : this.show(); }

  isVisible() { return this.visible; }

  show() {
    this.visible = true;
    if (this.trainingResetBtn) this.trainingResetBtn.style.display = this.isTraining() ? 'block' : 'none';
    this.root.style.display = 'flex';
    const first = this.root.querySelector('button') as HTMLButtonElement | null;
    first?.focus();
  }

  hide() {
    this.visible = false;
    this.quitArmed = false;
    this.quitBtn.textContent = '退出比赛';
    this.quitBtn.style.borderColor = '#f55';
    this.root.style.display = 'none';
    this.onResume();
  }

  destroy() { this.root.remove(); }
}
