// 团队死斗 - 纯击杀消耗票数，据点仅作战术位置
import { GameMode } from '../GameMode.js?v=20260802.4';

export class TDMMode extends GameMode {
    constructor(game, modeConfig) {
        super(game, modeConfig);
    }

    onMatchStart() {
        super.onMatchStart();
        // 锁定全部据点，避免误导为占领模式
        const cps = this.game.world?.capturePoints || [];
        for (const cp of cps) {
            cp.locked = true;
            cp.contested = false;
            cp.captureProgress = 0;
        }
        if (this.game.hud) {
            this.game.hud.showNotification('团队死斗：击杀敌方消耗票数，先清空对方票数获胜', 4);
        }
    }

    update(dt) {
        super.update(dt);
    }

    onCapturePoint() {
        // TDM 不奖励据点
    }

    onStrategicObjectiveDestroyed() {
        // TDM 无战略目标
    }

    getUIData() {
        const data = super.getUIData();
        data.modeHint = '团队死斗';
        return data;
    }
}
