// 抢攻模式 - 攻方依次爆破 M-COM 目标，守方拆除
import { GameMode } from '../GameMode.js?v=20260811.1';

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
        this.armDuration = modeConfig.armDuration || 3.0;
        this.defuseDuration = modeConfig.defuseDuration || 5.0;
        this.armProgress = 0;       // 攻方安放进度 0..1
        this.defuseProgress = 0;   // 守方拆除进度 0..1
        this.armInteractor = null; // 当前正在安放的玩家
        this.defuseInteractor = null;
        // 配置覆盖：抢攻模式不通过据点占领自动爆破
        this.capturePointTimeOverride = 9999;
    }

    onMatchStart() {
        super.onMatchStart();
        this.currentMcom = 0;
        this.armed = false;
        this.fuseTimer = 0;
        this.armProgress = 0;
        this.defuseProgress = 0;
        this.armInteractor = null;
        this.defuseInteractor = null;
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
        this.armProgress = 0;
        this.defuseProgress = 0;
        this.armInteractor = null;
        this.defuseInteractor = null;
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

    onPlayerDeath(dead, killer) {
        // 攻方死亡扣票，守方不扣票（守方靠时间和据点防守）
        if (!dead) return;
        const team = dead.team !== undefined ? dead.team : 0;
        if (team === this.attackerTeam) {
            super.onPlayerDeath(dead, killer);
        }
        // 死亡时打断该玩家正在进行的安放/拆除
        if (dead === this.armInteractor) this.armInteractor = null;
        if (dead === this.defuseInteractor) this.defuseInteractor = null;
    }

    // 玩家被击中时打断安放/拆除（由 Game 在伤害玩家后调用）
    onPlayerDamaged(player) {
        if (!player) return;
        if (player === this.armInteractor) {
            this.armInteractor = null;
            this.game.hud?.showNotification?.('安放被打断！', 1.5);
        }
        if (player === this.defuseInteractor) {
            this.defuseInteractor = null;
            this.game.hud?.showNotification?.('拆除被打断！', 1.5);
        }
    }

    // 玩家长按交互入口：team=玩家阵营；返回 true 表示模式接管了交互
    interact(player, dt) {
        if (this.winner) return false;
        const cps = this.game.world?.capturePoints || [];
        if (this.currentMcom >= this.totalMcoms || this.currentMcom >= cps.length) return false;
        const cp = cps[this.currentMcom];
        if (!cp || !player?.alive || player.downed) return false;

        const dx = player.position.x - cp.x;
        const dz = player.position.z - cp.z;
        const inRange = Math.sqrt(dx * dx + dz * dz) < (cp.radius || 6);
        if (!inRange) {
            if (player === this.armInteractor) this.armInteractor = null;
            if (player === this.defuseInteractor) this.defuseInteractor = null;
            return false;
        }

        const team = player.team !== undefined ? player.team : 0;
        if (team === this.attackerTeam && !this.armed) {
            this.armInteractor = player;
            this.armProgress = Math.min(1, this.armProgress + dt / this.armDuration);
            if (this.armProgress >= 1) {
                this.armed = true;
                this.fuseTimer = this.fuseDuration;
                this.armProgress = 0;
                this.armInteractor = null;
                if (this.game.hud) {
                    this.game.hud.showNotification(
                        `M-COM 已安放！${Math.ceil(this.fuseDuration)} 秒后爆破`,
                        3
                    );
                }
            }
            return true;
        }
        if (team === this.defenderTeam && this.armed) {
            this.defuseInteractor = player;
            this.defuseProgress = Math.min(1, this.defuseProgress + dt / this.defuseDuration);
            if (this.defuseProgress >= 1) {
                this.armed = false;
                this.fuseTimer = 0;
                this.defuseProgress = 0;
                this.defuseInteractor = null;
                this._lastFuseWarn = 0;
                if (this.game.hud) {
                    this.game.hud.showNotification('M-COM 炸药已拆除！', 2.5);
                }
            }
            return true;
        }
        return false;
    }

    // 玩家松开交互键时调用：打断当前进度
    cancelInteract(player) {
        if (player === this.armInteractor) this.armInteractor = null;
        if (player === this.defuseInteractor) this.defuseInteractor = null;
    }

    update(dt) {
        super.update(dt);
        if (this.winner) return;

        const cps = this.game.world?.capturePoints || [];
        if (this.currentMcom >= this.totalMcoms || this.currentMcom >= cps.length) return;
        const cp = cps[this.currentMcom];
        if (!cp) return;

        // 未安放时缓慢回退安放进度（玩家离开或被打断后）
        if (!this.armed && this.armInteractor == null && this.armProgress > 0) {
            this.armProgress = Math.max(0, this.armProgress - dt / this.armDuration * 0.5);
        }
        // 已安放但无人拆除时缓慢回退拆除进度
        if (this.armed && this.defuseInteractor == null && this.defuseProgress > 0) {
            this.defuseProgress = Math.max(0, this.defuseProgress - dt / this.defuseDuration * 0.5);
        }

        if (this.armed) {
            const prev = this.fuseTimer;
            this.fuseTimer -= dt;
            // 引线倒计时播报：10 秒内每秒提示一次
            if (this.fuseTimer <= 10) {
                const sec = Math.ceil(this.fuseTimer);
                if (sec !== this._lastFuseWarn && sec > 0) {
                    this._lastFuseWarn = sec;
                    this.game.hud?.showNotification?.(`M-COM 爆破倒计时 ${sec}`, 0.9);
                }
            }
            if (this.fuseTimer <= 0) {
                this._advanceMcom(cp);
            }
        }
    }

    onCapturePoint() {
        // 抢攻模式不再通过占领完成自动爆破；M-COM 状态完全由 interact/cancelInteract 管理
    }

    onTimeExpired() {
        if (!this.winner) this.winner = this.defenderTeam === 0 ? 'friendly' : 'enemy';
    }

    // 攻方在已爆破/已控制的最靠前据点部署；守方在当前及下一 M-COM 附近部署
    getDeployPoint(team) {
        const cps = this.game.world?.capturePoints || [];
        if (team === this.attackerTeam) {
            // 从当前目标往回找最靠前的攻方控制点
            for (let i = Math.min(this.currentMcom - 1, cps.length - 1); i >= 0; i--) {
                const cp = cps[i];
                if (cp && cp.team === this.attackerTeam) return cp;
            }
            return this.game.world?.getTeamSpawnPoint?.(team) || null;
        }
        // 守方在当前 M-COM 附近坚守
        const current = cps[this.currentMcom];
        return current || this.game.world?.getTeamSpawnPoint?.(team) || null;
    }

    getPriorityTarget(team) {
        const cps = this.game.world?.capturePoints || [];
        const current = cps[this.currentMcom];
        if (!current) return null;
        return current;
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
        data.armProgress = this.armProgress;
        data.defuseProgress = this.defuseProgress;
        data.modeHint = this.armed
            ? `M-COM 爆破中 ${Math.ceil(this.fuseTimer)}s`
            : `M-COM ${this.currentMcom + 1}/${this.totalMcoms}`;
        return data;
    }
}
