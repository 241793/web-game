// 突破模式 - 攻方依次突破扇区防线
import { GameMode } from '../GameMode.js?v=20260811.1';

export class BreakthroughMode extends GameMode {
    constructor(game, modeConfig) {
        super(game, modeConfig);
        this.attackerTeam = modeConfig.attackerTeam ?? 0;
        this.defenderTeam = 1 - this.attackerTeam;
        this.sectorIndex = 0;
        this.sectors = [];
        this.transitionTimer = 0;
        this.overtime = false;
        this.overtimeRemaining = 0;
        this._transitionPending = false;
        this._maxMatchDuration = modeConfig.maxMatchDuration || modeConfig.matchDuration;
    }

    onMatchStart() {
        super.onMatchStart();
        this.sectors = this._buildSectors();
        this.sectorIndex = 0;
        this.transitionTimer = 0;
        this.overtime = false;
        this.overtimeRemaining = 0;
        this._maxMatchDuration = this.cfg.maxMatchDuration || this.cfg.matchDuration;
        this.game.world?.resetCapturePoints?.();
        this._activateSector(0);
        this.game.hud?.showNotification?.(
            this.attackerTeam === 0 ? '我方为攻方，突破敌方防线！' : '我方为守方，坚守阵地！',
            4
        );
    }

    onPlayerDeath(dead, killer) {
        if (!dead || dead.team !== this.attackerTeam) return;
        super.onPlayerDeath(dead, killer);
    }

    update(dt) {
        if (this.winner) return;
        if (this.transitionTimer > 0) {
            this.transitionTimer = Math.max(0, this.transitionTimer - dt);
            if (this.transitionTimer <= 0) this._activateSector(this.sectorIndex);
            return;
        }

        super.update(dt);
        if (this.winner || this.transitionTimer > 0) return;

        const points = this.getCurrentSectorPoints();
        if (points.length > 0 && points.every(cp => cp.team === this.attackerTeam)) {
            this._advanceSector();
        }
    }

    onTimeExpired(dt) {
        if (this.winner || this.transitionTimer > 0) return;
        const points = this.getCurrentSectorPoints();
        const pressure = points.some(cp => cp.captureProgress > 0 && cp.capturingTeam === this.attackerTeam) ||
            points.some(cp => {
                const attackerWeight = this.attackerTeam === 0 ? cp.friendlyWeight : cp.enemyWeight;
                const defenderWeight = this.attackerTeam === 0 ? cp.enemyWeight : cp.friendlyWeight;
                const attackerCount = this.attackerTeam === 0 ? cp.friendlyCount : cp.enemyCount;
                return (attackerWeight || 0) > (defenderWeight || 0) && (attackerCount || 0) > 0;
            });
        if (!pressure) {
            this.winner = this._teamResult(this.defenderTeam);
            return;
        }
        if (!this.overtime) {
            this.overtime = true;
            this.overtimeRemaining = this.cfg.overtimeDuration || 20;
            this.game.hud?.showNotification?.('突破加时！继续争夺前线！', 3);
            return;
        }
        this.overtimeRemaining = Math.max(0, this.overtimeRemaining - dt);
        if (this.overtimeRemaining <= 0) this.winner = this._teamResult(this.defenderTeam);
    }

    onCapturePoint(cp, team) {
        if (this.getCurrentSectorPoints().includes(cp) && team === this.attackerTeam) {
            this.game.hud?.showNotification?.(`攻方已控制 ${cp.name}，继续夺取当前扇区`, 2);
        }
    }

    onStrategicObjectiveDestroyed(obj, team) {
        if (team === this.attackerTeam) {
            // 攻方摧毁战略目标：加时 + 增援 + 当前扇区据点解锁加速
            this.matchTimer = Math.min(this._maxMatchDuration, this.matchTimer + (this.cfg.objectiveTimeBonus || 60));
            this.teamTickets[this.attackerTeam] = Math.min(
                this.cfg.startingTickets + (this.cfg.ticketReserveCap || 20),
                this.teamTickets[this.attackerTeam] + (this.cfg.objectiveTicketBonus || 10)
            );
            // 当前扇区据点占领进度推进 25%（攻方压力反馈）
            for (const cp of this.getCurrentSectorPoints()) {
                if (cp && cp.team !== this.attackerTeam) {
                    cp.captureProgress = Math.min(100, (cp.captureProgress || 0) + 25);
                    cp.capturingTeam = this.attackerTeam;
                }
            }
            if (this.game.hud) {
                this.game.hud.showNotification(`战略目标摧毁！攻方获得增援、加时与扇区推进`, 3);
            }
        } else if (team === this.defenderTeam) {
            // 守方摧毁战略目标（极少见，但保留对称）：扣除攻方少量票数
            this.teamTickets[this.attackerTeam] = Math.max(0, this.teamTickets[this.attackerTeam] - 5);
        }
    }

    checkGameOver() {
        if (this.winner) return this.winner;
        if (this.teamTickets[this.attackerTeam] <= 0) return (this.winner = this._teamResult(this.defenderTeam));
        if (this.sectorIndex >= this.sectors.length) return (this.winner = this._teamResult(this.attackerTeam));
        if (this.overtime && this.overtimeRemaining <= 0) return (this.winner = this._teamResult(this.defenderTeam));
        return null;
    }

    getCurrentSectorPoints() {
        const names = this.sectors[this.sectorIndex] || [];
        return names.map(name => this.game.world.capturePoints.find(cp => cp.name === name)).filter(Boolean);
    }

    getPriorityTarget(team) {
        const points = this.getCurrentSectorPoints();
        if (team === this.attackerTeam) return points.find(cp => cp.team !== team) || points[0] || null;
        return points.slice().sort((a, b) => ((b.enemyCount || 0) + (b.friendlyCount || 0)) - ((a.enemyCount || 0) + (a.friendlyCount || 0)))[0] || null;
    }

    getDeployPoint(team) {
        if (team === this.attackerTeam) {
            const pastNames = this.sectors.slice(0, this.sectorIndex).flat();
            for (let i = pastNames.length - 1; i >= 0; i--) {
                const cp = this.game.world.capturePoints.find(point => point.name === pastNames[i]);
                if (cp?.team === team) return cp;
            }
            return this.game.world.getTeamSpawnPoint?.(team) || null;
        }
        const nextNames = this.sectors[this.sectorIndex + 1] || [];
        const rearPoint = nextNames.length
            ? this.game.world.capturePoints.find(point => point.name === nextNames[0])
            : null;
        return rearPoint || this.game.world.getTeamSpawnPoint?.(team) || null;
    }

    getUIData() {
        const data = super.getUIData();
        data.currentSector = Math.min(this.sectorIndex + 1, this.sectors.length);
        data.totalSectors = this.sectors.length;
        data.attackerTeam = this.attackerTeam;
        data.sectorPointNames = this.sectors[this.sectorIndex] || [];
        data.transitionTimer = this.transitionTimer;
        data.overtime = this.overtime;
        data.overtimeRemaining = this.overtimeRemaining;
        data.defenderUnlimited = true;
        data.modeHint = this.overtime
            ? `突破加时 ${Math.ceil(this.overtimeRemaining)}s`
            : this.transitionTimer > 0
                ? `战线转移 ${Math.ceil(this.transitionTimer)}s`
                : `扇区 ${data.currentSector}/${data.totalSectors}：${data.sectorPointNames.join(' + ')}`;
        return data;
    }

    _buildSectors() {
        const configured = this.game.world?.mapConfig?.breakthroughSectors;
        if (Array.isArray(configured) && configured.length) return configured.map(group => group.slice());
        const points = this.game.world?.capturePoints || [];
        const count = Math.max(1, this.cfg.sectors || points.length);
        return points.reduce((groups, cp, index) => {
            const groupIndex = Math.min(count - 1, Math.floor(index * count / Math.max(1, points.length)));
            (groups[groupIndex] ||= []).push(cp.name);
            return groups;
        }, []);
    }

    _activateSector(index) {
        const points = this.game.world?.capturePoints || [];
        for (const cp of points) {
            const past = this.sectors.slice(0, index).some(group => group.includes(cp.name));
            const current = (this.sectors[index] || []).includes(cp.name);
            this.game.world.setCapturePointState?.(cp, {
                team: past ? this.attackerTeam : this.defenderTeam,
                locked: !current,
                capturingTeam: -1,
                captureProgress: 0,
                contested: false,
            });
        }
        this.overtime = false;
        this.overtimeRemaining = 0;
    }

    _advanceSector() {
        if (this._transitionPending) return;
        this._transitionPending = true;
        this.sectorIndex++;
        if (this.sectorIndex >= this.sectors.length) {
            this.winner = this._teamResult(this.attackerTeam);
            return;
        }
        this.teamTickets[this.attackerTeam] = Math.min(
            this.cfg.startingTickets + (this.cfg.ticketReserveCap || 20),
            this.teamTickets[this.attackerTeam] + (this.cfg.sectorTicketBonus || 35)
        );
        this.matchTimer = Math.min(this._maxMatchDuration, this.matchTimer + (this.cfg.sectorTimeBonus || 150));
        this.transitionTimer = this.cfg.transitionDuration || 8;
        this._transitionPending = false;
        for (const cp of this.game.world.capturePoints || []) {
            this.game.world.setCapturePointState?.(cp, { team: cp.team, locked: true });
        }
        this.game.hud?.showNotification?.(`战线推进！下一扇区：${(this.sectors[this.sectorIndex] || []).join(' + ')}`, 3);
    }

    _teamResult(team) {
        return team === 0 ? 'friendly' : 'enemy';
    }
}
