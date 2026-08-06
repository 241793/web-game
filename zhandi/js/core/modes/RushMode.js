// 抢攻模式 - 攻方依次爆破 M-COM 目标，守方拆除
import { GameMode } from '../GameMode.js?v=20260802.4';

export class RushMode extends GameMode {
    constructor(game, modeConfig) {
        super(game, modeConfig);
        this.currentMcom = 0;
        this.totalMcoms = modeConfig.sectors || 3;
        this.attackerTeam = modeConfig.attackerTeam !== undefined ? modeConfig.attackerTeam : 0;
        this.defenderTeam = 1 - this.attackerTeam;
        this.armed = false;
        this.fuseTimer = 0;
        this.fuseDuration = modeConfig.fuseDuration || 40;
    }

    onMatchStart() {
        super.onMatchStart();
        this.currentMcom = 0;
        this.armed = false;
        this.fuseTimer = 0;
        this._setupMcoms();
        if (this.game.hud) {
            const isAtk = this.attackerTeam === 0;
            this.game.hud.showNotification(
                isAtk ? '抢攻：我方为攻方，依次爆破 M-COM！' : '抢攻：我方为守方，阻止敌方爆破！',
                4
            );
        }
    }

    _setupMcoms() {
        const cps = this.game.world?.capturePoints || [];
        this.totalMcoms = Math.min(this.totalMcoms, Math.max(1, cps.length));
        for (let i = 0; i < cps.length; i++) {
            const cp = cps[i];
            cp.locked = i !== this.currentMcom;
            cp.contested = false;
            cp.captureProgress = 0;
            // 当前与后续 M-COM 初始由守方控制；已爆破的保持攻方
            if (i >= this.currentMcom) {
                cp.team = this.defenderTeam;
                cp.label = cp.label || `M-COM ${String.fromCharCode(65 + i)}`;
            }
        }
    }

    _advanceMcom(destroyedCp) {
        this.currentMcom++;
        this.armed = false;
        this.fuseTimer = 0;
        if (this.currentMcom >= this.totalMcoms) {
            this.winner = this.attackerTeam === 0 ? 'friendly' : 'enemy';
            if (this.game.hud) {
                this.game.hud.showNotification('全部 M-COM 已爆破！攻方获胜', 4);
            }
            return;
        }
        // 攻方爆破奖励票数
        this.teamTickets[this.attackerTeam] = Math.min(
            this.cfg.startingTickets + 80,
            this.teamTickets[this.attackerTeam] + 40
        );
        this._setupMcoms();
        if (this.game.hud) {
            const name = destroyedCp?.name || destroyedCp?.label || String(this.currentMcom);
            this.game.hud.showNotification(`M-COM ${name} 已爆破！下一目标已解锁`, 3);
        }
    }

    update(dt) {
        super.update(dt);
        if (this.winner) return;

        const cps = this.game.world?.capturePoints || [];
        if (this.currentMcom >= this.totalMcoms || this.currentMcom >= cps.length) return;
        const cp = cps[this.currentMcom];
        if (!cp) return;

        // 攻方完成占领 = 安放炸药
        if (!this.armed && cp.team === this.attackerTeam) {
            this.armed = true;
            this.fuseTimer = this.fuseDuration;
            if (this.game.hud) {
                this.game.hud.showNotification(
                    `M-COM 已安放！${Math.ceil(this.fuseDuration)} 秒后爆破`,
                    3
                );
            }
        }

        if (this.armed) {
            // 守方夺回 = 拆除
            if (cp.team === this.defenderTeam) {
                this.armed = false;
                this.fuseTimer = 0;
                if (this.game.hud) {
                    this.game.hud.showNotification('M-COM 炸药已拆除！', 2.5);
                }
                return;
            }
            this.fuseTimer -= dt;
            if (this.fuseTimer <= 0) {
                this._advanceMcom(cp);
            }
        }
    }

    onCapturePoint(cp, team) {
        if (team === this.attackerTeam) {
            // 安放在 update 中检测
        } else if (team === this.defenderTeam && this.armed) {
            // 拆除在 update 中检测
        }
    }

    checkGameOver() {
        if (this.winner) return this.winner;
        if (this.teamTickets[this.attackerTeam] <= 0) {
            this.winner = this.defenderTeam === 0 ? 'friendly' : 'enemy';
            return this.winner;
        }
        if (this.teamTickets[this.defenderTeam] <= 0) {
            this.winner = this.attackerTeam === 0 ? 'friendly' : 'enemy';
            return this.winner;
        }
        if (this.currentMcom >= this.totalMcoms) {
            this.winner = this.attackerTeam === 0 ? 'friendly' : 'enemy';
            return this.winner;
        }
        if (this.matchTimer <= 0) {
            // 时间耗尽守方获胜
            this.winner = this.defenderTeam === 0 ? 'friendly' : 'enemy';
            return this.winner;
        }
        return null;
    }

    getUIData() {
        const data = super.getUIData();
        data.currentSector = this.currentMcom + 1;
        data.totalSectors = this.totalMcoms;
        data.attackerTeam = this.attackerTeam;
        data.armed = this.armed;
        data.fuseTimer = Math.max(0, this.fuseTimer);
        data.modeHint = this.armed
            ? `M-COM 爆破中 ${Math.ceil(this.fuseTimer)}s`
            : `M-COM ${this.currentMcom + 1}/${this.totalMcoms}`;
        return data;
    }
}
