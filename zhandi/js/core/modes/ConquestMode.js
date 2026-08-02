// 征服模式 - 占领据点消耗敌方票数
import { GameMode } from '../GameMode.js?v=20260801.2';

export class ConquestMode extends GameMode {
    constructor(game, modeConfig) {
        super(game, modeConfig);
    }

    // 每帧更新 - 计算据点数量差异导致的票数衰减
    update(dt) {
        super.update(dt);
        if (this.winner) return;

        // 计算据点控制差异
        const cps = this.game.world ? this.game.world.capturePoints : [];
        let friendlyCps = 0, enemyCps = 0;
        for (const cp of cps) {
            if (cp.team === 0) friendlyCps++;
            else if (cp.team === 1) enemyCps++;
        }

        // 据点多的一方持续扣减对方票数
        if (friendlyCps > enemyCps && this.cfg.ticketBleedRate > 0) {
            this.teamTickets[1] = Math.max(0, this.teamTickets[1] - this.cfg.ticketBleedRate * dt * (friendlyCps - enemyCps));
        } else if (enemyCps > friendlyCps && this.cfg.ticketBleedRate > 0) {
            this.teamTickets[0] = Math.max(0, this.teamTickets[0] - this.cfg.ticketBleedRate * dt * (enemyCps - friendlyCps));
        }
    }

    onCapturePoint(cp, team) {
        // 基类 onCapturePoint 已添加 capturePointBonus 到 friendlyScore/enemyScore
        // 此处仅处理征服模式特有的逻辑（据点占领通知等），不再重复加分
        super.onCapturePoint(cp, team);
    }
}
