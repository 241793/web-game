// 突破模式 - 攻方依次突破扇区防线
import { GameMode } from '../GameMode.js?v=20260802.4';

export class BreakthroughMode extends GameMode {
    constructor(game, modeConfig) {
        super(game, modeConfig);
        this.currentSector = 0;
        this.totalSectors = modeConfig.sectors || 3;
        this.attackerTeam = modeConfig.attackerTeam !== undefined ? modeConfig.attackerTeam : 0;
        this.defenderTeam = 1 - this.attackerTeam;
        this.sectorCaptureTimer = 0;
        this._sectorAnnounced = false;
    }

    onMatchStart() {
        super.onMatchStart();
        this.currentSector = 0;
        this._activateSector(0);
        // 通知攻守双方
        if (this.game.hud) {
            this.game.hud.showNotification(this.attackerTeam === 0 ? '我方为攻方，突破敌方防线！' : '我方为守方，坚守阵地！', 4);
        }
    }

    // 激活指定扇区的据点，锁定其他扇区
    _activateSector(sectorIndex) {
        if (!this.game.world || !this.game.world.capturePoints) return;
        const cps = this.game.world.capturePoints;
        // totalSectors 不超过实际据点数
        this.totalSectors = Math.min(this.totalSectors, cps.length);
        for (let i = 0; i < cps.length; i++) {
            const cp = cps[i];
            // 只有当前扇区的据点可占领
            cp.locked = (i !== sectorIndex);
            if (cp.locked) {
                cp.contested = false;
                cp.captureProgress = 0;
            }
        }
    }

    update(dt) {
        super.update(dt);
        if (this.winner) return;

        // 检查当前扇区是否已被攻占
        const cps = this.game.world ? this.game.world.capturePoints : [];
        if (this.currentSector < cps.length && this.currentSector < this.totalSectors) {
            const currentCp = cps[this.currentSector];
            if (currentCp && currentCp.team === this.attackerTeam) {
                // 当前扇区已被攻方占领，推进到下一扇区
                this.currentSector++;
                if (this.currentSector < this.totalSectors) {
                    this._activateSector(this.currentSector);
                    // 攻方获得额外票数奖励
                    this.teamTickets[this.attackerTeam] += 50;
                    if (this.game.hud) {
                        const sectorName = currentCp.name || `第${this.currentSector}扇区`;
                        this.game.hud.showNotification(`攻方已突破 ${sectorName}！战线推进`, 3);
                    }
                } else {
                    // 所有扇区攻占完毕，攻方获胜
                    this.winner = this.attackerTeam === 0 ? 'friendly' : 'enemy';
                }
            }
        }
    }

    onCapturePoint(cp, team) {
        // 突破模式据点占领不加分，但推进战线
        if (team === this.attackerTeam) {
            this.game.hud.showNotification(`攻方已突破第 ${this.currentSector + 1} 扇区！`, 3);
        }
    }

    // 突破模式：攻方票数耗尽则守方获胜，守方票数耗尽则攻方获胜
    checkGameOver() {
        if (this.winner) return this.winner;
        // 攻方票数耗尽 → 守方获胜
        if (this.teamTickets[this.attackerTeam] <= 0) {
            this.winner = this.defenderTeam === 0 ? 'friendly' : 'enemy';
            return this.winner;
        }
        // 守方票数耗尽 → 攻方获胜
        if (this.teamTickets[this.defenderTeam] <= 0) {
            this.winner = this.attackerTeam === 0 ? 'friendly' : 'enemy';
            return this.winner;
        }
        // 所有扇区攻占
        if (this.currentSector >= this.totalSectors) {
            this.winner = this.attackerTeam === 0 ? 'friendly' : 'enemy';
            return this.winner;
        }
        // 时间耗尽 → 守方获胜
        if (this.matchTimer <= 0) {
            this.winner = this.defenderTeam === 0 ? 'friendly' : 'enemy';
            return this.winner;
        }
        return null;
    }

    getUIData() {
        const data = super.getUIData();
        data.currentSector = this.currentSector + 1;
        data.totalSectors = this.totalSectors;
        data.attackerTeam = this.attackerTeam;
        return data;
    }
}
