// 消耗战模式 - 有限增援储备，医疗兵复活与支援直接影响资源损耗
import { GameMode } from '../GameMode.js?v=20260811.1';

export class AttritionMode extends GameMode {
    constructor(game, modeConfig) {
        super(game, modeConfig);
        this.reinforcements = [0, 0];
        this._maxReinforcements = modeConfig.maxReinforcements || 30;
    }

    onMatchStart() {
        super.onMatchStart();
        this.reinforcements = [this._maxReinforcements, this._maxReinforcements];
        if (this.game.hud) {
            this.game.hud.showNotification('消耗战：增援有限，医疗兵救援可减少资源损耗！', 5);
        }
    }

    update(dt) {
        super.update(dt);
    }

    onPlayerDeath(dead, killer) {
        if (!dead) return;
        const team = dead.team !== undefined ? dead.team : 0;
        if (this.reinforcements[team] > 0) {
            this.reinforcements[team]--;
        } else {
            super.onPlayerDeath(dead, killer);
        }
    }

    // 医疗兵复活节省一次增援消耗（复活的 Bot 不额外扣票）
    onRevive(team) {
        if (this.reinforcements[team] < this._maxReinforcements) {
            this.reinforcements[team] = Math.min(this._maxReinforcements, this.reinforcements[team] + 1);
        }
    }

    onCapturePoint(cp, team) {
        // 消耗战据点不产出分数
    }

    onStrategicObjectiveDestroyed(obj, team) {
        // 消耗战无战略目标
    }

    checkGameOver() {
        const base = super.checkGameOver();
        if (base) return base;
        // 双方增援全耗尽时靠票数决胜
        if (this.reinforcements[0] <= 0 && this.reinforcements[1] <= 0) {
            return this._decideWinnerByTickets() || null;
        }
        return null;
    }

    getUIData() {
        const data = super.getUIData();
        data.reinforcements = [...this.reinforcements];
        data.maxReinforcements = this._maxReinforcements;
        data.modeHint = `增援 我方 ${this.reinforcements[0]}/${this._maxReinforcements}  敌方 ${this.reinforcements[1]}/${this._maxReinforcements}`;
        return data;
    }
}
