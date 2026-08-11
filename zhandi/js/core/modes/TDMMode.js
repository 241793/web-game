// 团队死斗 - 纯击杀消耗票数，击杀目标轮次制
import { GameMode } from '../GameMode.js?v=20260811.1';

export class TDMMode extends GameMode {
    constructor(game, modeConfig) {
        super(game, modeConfig);
        this.killGoal = modeConfig.killGoal || 50;
        this.roundKills = [0, 0];
        this.currentRound = 1;
        this.maxRounds = modeConfig.maxRounds || 3;
    }

    onMatchStart() {
        super.onMatchStart();
        this.roundKills = [0, 0];
        this.currentRound = 1;
        const cps = this.game.world?.capturePoints || [];
        for (const cp of cps) {
            cp.locked = true;
            cp.contested = false;
            cp.captureProgress = 0;
        }
        if (this.game.hud) {
            this.game.hud.showNotification(`团队死斗 第${this.currentRound}轮：率先击杀${this.killGoal}人获胜`, 4);
        }
    }

    update(dt) {
        super.update(dt);
    }

    onPlayerDeath(dead, killer) {
        super.onPlayerDeath(dead, killer);
        if (!killer || killer.team === dead.team) return;
        const killerTeam = killer.team !== undefined ? killer.team : 0;
        this.roundKills[killerTeam]++;

        if (this.roundKills[killerTeam] >= this.killGoal) {
            this.matchTimer = Math.min(this.cfg.matchDuration, this.matchTimer + 120);
            this.currentRound++;
            this.roundKills = [0, 0];
            if (this.currentRound > this.maxRounds) {
                this.winner = this._decideWinnerByTickets();
            } else {
                if (this.game.hud) {
                    this.game.hud.showNotification(`第${this.currentRound}轮开始，加时2分钟`, 3);
                }
            }
        }
    }

    onCapturePoint() {
        // TDM 不奖励据点
    }

    onStrategicObjectiveDestroyed() {
        // TDM 无战略目标
    }

    getUIData() {
        const data = super.getUIData();
        data.roundKills = [...this.roundKills];
        data.killGoal = this.killGoal;
        data.currentRound = this.currentRound;
        data.maxRounds = this.maxRounds;
        data.modeHint = `第${this.currentRound}轮 我方${this.roundKills[0]}/${this.killGoal}  敌方${this.roundKills[1]}/${this.killGoal}`;
        return data;
    }
}
