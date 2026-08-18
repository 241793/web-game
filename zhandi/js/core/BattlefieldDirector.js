import { CONFIG } from '../config.js?v=20260812.1';

const MISSION_LABELS = {
    attack: '限时强攻',
    defend: '阵地坚守',
    supply: '争夺空投',
    vehicle: '猎杀载具',
    objective: '破坏设施',
    elimination: '歼灭目标',
};

export class BattlefieldDirector {
    constructor(game) {
        this.game = game;
        this.cfg = CONFIG.BATTLEFIELD_DIRECTOR;
        this._missionSerial = 0;
        this._snapshotKey = '';
        this.reset();
    }

    reset() {
        this.active = false;
        this.requisition = this.cfg.requisition.start;
        this.specializations = {};
        for (const classType of Object.keys(CONFIG.CLASSES)) {
            const route = Object.keys(CONFIG.CLASS_SPECIALIZATIONS?.[classType] || {})[0] || null;
            this.specializations[classType] = { route, xp: 0, level: 1 };
        }
        this.mission = null;
        this.missionState = 'idle';
        this.missionTimer = this.cfg.mission.firstDelay;
        this._thinkTimer = 0;
        this._missionParticipation = false;
        this._missionKillBaseline = this.game.playerStats?.kills || 0;
        this._settledMissionIds = new Set();
        this.supportCooldown = 0;
        this.supportTypeCooldowns = { smoke: 0, supply: 0, rally: 0 };
        this.activeSupports = [];
        this._snapshotKey = '';
    }

    start() {
        this.active = true;
        this.missionState = 'idle';
        this.missionTimer = this.cfg.mission.firstDelay;
    }

    freeze() {
        this.active = false;
    }

    dispose() {
        this.active = false;
        for (const support of this.activeSupports) {
            this.game.cleanupDirectorSupport?.(support);
        }
        this.activeSupports.length = 0;
        if (this.mission?.type === 'supply') {
            this.game.removeDirectorMissionSupply?.(this.mission.target);
        }
        this.mission = null;
        this.missionState = 'idle';
        this.game.hud?.clearDirector?.();
    }

    update(dt) {
        if (!this.active || dt <= 0) return;

        this.supportCooldown = Math.max(0, this.supportCooldown - dt);
        for (const type of Object.keys(this.supportTypeCooldowns)) {
            this.supportTypeCooldowns[type] = Math.max(0, this.supportTypeCooldowns[type] - dt);
        }
        for (let i = this.activeSupports.length - 1; i >= 0; i--) {
            const support = this.activeSupports[i];
            support.remaining -= dt;
            if (support.remaining <= 0 || support.handle?.expired) {
                this.game.cleanupDirectorSupport?.(support);
                this.activeSupports.splice(i, 1);
            }
        }

        this.missionTimer -= dt;
        if (this.missionState === 'idle' && this.missionTimer <= 0) {
            this._announceMission();
        } else if (this.missionState === 'announced' && this.missionTimer <= 0) {
            this._activateMission();
        } else if (this.missionState === 'active') {
            this._updateMission(dt);
        } else if ((this.missionState === 'success' || this.missionState === 'failure') && this.missionTimer <= 0) {
            this._clearMission();
        } else if (this.missionState === 'cooldown' && this.missionTimer <= 0) {
            this.missionState = 'idle';
            this.missionTimer = 0;
        }
    }

    setSpecialization(classType, route) {
        const routes = CONFIG.CLASS_SPECIALIZATIONS?.[classType];
        if (!routes || !routes[route]) return false;
        const state = this.specializations[classType] || { route: null, xp: 0, level: 1 };
        if (state.route !== route) {
            state.route = route;
            state.xp = 0;
            state.level = 1;
        }
        this.specializations[classType] = state;
        return true;
    }

    getSpecializationState(classType) {
        const state = this.specializations[classType];
        if (!state) return null;
        return {
            route: state.route,
            xp: state.xp,
            level: state.level,
            threshold: this.cfg.specialization.level2XP,
        };
    }

    getRuntimeClassConfig(classType, route = null) {
        const base = CONFIG.CLASSES[classType] || CONFIG.CLASSES.assault;
        if (route) this.setSpecialization(classType, route);
        const state = this.specializations[classType];
        const routeCfg = CONFIG.CLASS_SPECIALIZATIONS?.[classType]?.[state?.route];
        const levelData = routeCfg?.levels?.[Math.max(0, (state?.level || 1) - 1)] || {};
        return {
            ...base,
            ...levelData,
            specializationId: state?.route || null,
            specializationLevel: state?.level || 1,
        };
    }

    getGadgetModifiers(classType) {
        const runtime = this.getRuntimeClassConfig(classType);
        return {
            radiusMult: runtime.gadgetRadiusMult || 1,
            durationMult: runtime.gadgetDurationMult || 1,
            repairMult: runtime.repairMult || 1,
        };
    }

    recordContribution(kind, actor, value = 1, context = {}) {
        if (!this.active || context.fromDirectorSupport) return { requisition: 0, xp: 0 };
        const player = this.game.player;
        const isPlayer = actor === player;
        const isAlphaAI = actor && actor !== player && actor.team === 0 && actor.squadId === player?.squadId;
        if (!isPlayer && !isAlphaAI) return { requisition: 0, xp: 0 };

        const actorScale = isPlayer ? 1 : 0.25;
        const reqBase = this.cfg.requisition.contribution[kind] || 0;
        const reqGain = reqBase * Math.max(0, value) * actorScale * this._getComebackMultiplier();
        this.requisition = Math.min(this.cfg.requisition.max, this.requisition + reqGain);

        let xpGain = 0;
        if (isPlayer) {
            xpGain = (this.cfg.specialization.contributionXP[kind] || 0) * Math.max(0, value);
            this._addSpecializationXP(this.game.playerClassType, xpGain);
        }

        if (this.missionState === 'active' && isPlayer && this._isContributionRelevant(kind, context)) {
            this._missionParticipation = true;
            if (this.mission) this.mission.playerContributed = true;
        }
        return { requisition: reqGain, xp: xpGain };
    }

    requestSupport(type, target) {
        const supportCfg = this.cfg.support[type];
        if (!supportCfg) return { ok: false, reason: '未知支援类型' };
        const player = this.game.player;
        if (!this.active || !player?.alive || player.downed || player.inVehicle || player.inStaticGun) {
            return { ok: false, reason: '当前状态无法呼叫支援' };
        }
        if (this.supportCooldown > 0) return { ok: false, reason: `支援冷却 ${Math.ceil(this.supportCooldown)} 秒` };
        if (this.supportTypeCooldowns[type] > 0) return { ok: false, reason: `${Math.ceil(this.supportTypeCooldowns[type])} 秒后可再次呼叫` };
        if (this.activeSupports.length >= this.cfg.support.maxConcurrent) return { ok: false, reason: '战场支援数量已达上限' };
        if (this.requisition < supportCfg.cost) return { ok: false, reason: `需要 ${supportCfg.cost} 征用点` };
        if (!target || !this._isTargetInBounds(target)) return { ok: false, reason: '目标位置无效' };
        const distance = this._distance2D(player.position, target);
        if (type !== 'rally' && distance > this.cfg.support.maxTargetDistance) {
            return { ok: false, reason: '目标超出支援范围' };
        }
        if (type === 'rally' && !this.game.isDirectorRallyPositionSafe?.(target)) {
            return { ok: false, reason: '附近有敌人，无法建立集结点' };
        }

        const result = this.game.executeDirectorSupport?.(type, target, supportCfg);
        if (!result?.ok) return { ok: false, reason: result?.reason || '支援部署失败' };

        this.requisition -= supportCfg.cost;
        this.supportCooldown = this.cfg.support.globalCooldown;
        this.supportTypeCooldowns[type] = this.cfg.support.typeCooldown;
        this.activeSupports.push({
            id: `support_${type}_${Date.now()}`,
            type,
            target: { x: target.x, y: target.y || 0, z: target.z },
            remaining: result.duration || supportCfg.duration,
            handle: result.handle || null,
        });
        return { ok: true, cost: supportCfg.cost };
    }

    getPriorityTarget(team) {
        if (this.missionState === 'active' && this.mission?.target) return this.mission.target;
        return this.game.gameMode?.getPriorityTarget?.(team) || this.game.currentOrder?.point || null;
    }

    getRallyPoint(team = 0) {
        if (team !== 0) return null;
        const support = this.activeSupports.find(item => item.type === 'rally' && item.handle && !item.handle.expired);
        return support?.handle || null;
    }

    getHUDData() {
        const classType = this.game.playerClassType || 'assault';
        const spec = this.getSpecializationState(classType);
        const mode = this.game.gameMode?.getUIData?.() || null;
        const mission = this.mission;
        return {
            missionState: this.missionState,
            missionTitle: mission ? `${MISSION_LABELS[mission.type] || '战场任务'}：${mission.label}` : '等待新任务',
            missionTime: this.missionState === 'active' ? Math.max(0, this.missionTimer) : 0,
            missionProgress: mission?.progress || 0,
            requisition: Math.floor(this.requisition),
            requisitionMax: this.cfg.requisition.max,
            supportCooldown: Math.max(0, this.supportCooldown),
            supportTypeCooldowns: { ...this.supportTypeCooldowns },
            supportCosts: {
                smoke: this.cfg.support.smoke.cost,
                supply: this.cfg.support.supply.cost,
                rally: this.cfg.support.rally.cost,
            },
            specializationName: CONFIG.CLASS_SPECIALIZATIONS?.[classType]?.[spec?.route]?.name || '',
            specializationLevel: spec?.level || 1,
            specializationXP: spec?.xp || 0,
            specializationThreshold: spec?.threshold || this.cfg.specialization.level2XP,
            mode,
        };
    }

    getWorldMarkers() {
        const markers = [];
        if (this.mission && (this.missionState === 'announced' || this.missionState === 'active')) {
            const pos = this._targetPosition(this.mission.target);
            if (pos) markers.push({
                id: `mission_${this.mission.id}`,
                position: pos,
                type: 'mission',
                label: 'M',
                text: this.mission.label,
            });
        }
        for (const support of this.activeSupports) {
            if (support.type === 'rally') markers.push({
                id: support.id,
                position: support.target,
                type: 'rally',
                label: 'R',
                text: '小队集结点',
            });
            if (support.type === 'smoke') markers.push({
                id: support.id,
                position: support.target,
                type: 'smoke',
                label: 'S',
                text: '烟幕区域',
            });
        }
        return markers;
    }

    reportMissionSupplyState(drop, team, progress) {
        if (this.missionState !== 'active' || this.mission?.type !== 'supply' || this.mission.target !== drop) return;
        this.mission.progress = Math.max(0, Math.min(1, progress));
        if (team === 0 && progress >= 1) this._settleMission(true);
        else if (team === 1 && progress >= 1) this._settleMission(false);
    }

    reportTargetDamaged(target, actor) {
        if (this.missionState !== 'active' || this.mission?.target !== target) return;
        if (actor === this.game.player) {
            this._missionParticipation = true;
            this.mission.playerContributed = true;
        }
    }

    _announceMission() {
        const mission = this._selectMission();
        if (!mission) {
            this.missionState = 'cooldown';
            this.missionTimer = this.cfg.mission.cooldown;
            return;
        }
        this.mission = mission;
        this.missionState = 'announced';
        this.missionTimer = this.cfg.mission.announceDuration;
        this._missionParticipation = false;
        this.game.hud?.showNotification?.(`新战场任务：${mission.label}`, 3);
    }

    _activateMission() {
        if (!this.mission) return this._clearMission();
        if (this.mission.type === 'supply') {
            const drop = this.game.spawnDirectorMissionSupply?.();
            if (!drop) return this._settleMission(false);
            this.mission.target = drop;
        }
        this.missionState = 'active';
        this.missionTimer = this.mission.duration;
        this.mission.progress = 0;
    }

    _updateMission(dt) {
        const mission = this.mission;
        if (!mission) return this._clearMission();

        this._thinkTimer -= dt;
        if (this._thinkTimer <= 0) {
            this._thinkTimer = this.cfg.mission.thinkInterval;
            this._trackPlayerParticipation();
            if (mission.type === 'attack' && mission.target?.team === 0) return this._settleMission(true);
            if (mission.type === 'defend') {
                if (mission.target?.team === 1) return this._settleMission(false);
                const safe = mission.target?.team === 0 && !mission.target?.contested;
                mission.holdTime = safe ? (mission.holdTime || 0) + this.cfg.mission.thinkInterval : 0;
                mission.progress = Math.min(1, mission.holdTime / this.cfg.mission.defendHoldTime);
                if (mission.progress >= 1) return this._settleMission(true);
            }
            if (mission.type === 'elimination') {
                const kills = this.game.playerStats?.kills || 0;
                mission.progress = Math.min(1, Math.max(0, kills - mission.killBaseline) / mission.killTarget);
                if (mission.progress >= 1) return this._settleMission(true);
            }
            if ((mission.type === 'vehicle' || mission.type === 'objective') && mission.target?.alive === false) {
                return this._settleMission(!!mission.playerContributed);
            }
        }

        if (this.missionTimer <= 0) this._settleMission(false);
    }

    _selectMission() {
        const allowed = new Set(this.game.gameMode?.cfg?.directorMissionTypes || []);
        if (allowed.size === 0) return null;

        const candidates = [];
        const points = (this.game.world?.capturePoints || []).filter(cp => !cp.locked);
        if (allowed.has('attack')) {
            const attack = points.filter(cp => cp.team !== 0);
            if (attack.length) {
                const target = attack[Math.floor(Math.random() * attack.length)];
                candidates.push(this._makeMission('attack', target, `夺取 ${target.name} ${target.label || ''}`));
            }
        }
        if (allowed.has('defend')) {
            const defend = points.filter(cp => cp.team === 0);
            if (defend.length) {
                const target = defend[Math.floor(Math.random() * defend.length)];
                candidates.push(this._makeMission('defend', target, `坚守 ${target.name} ${target.label || ''}`));
            }
        }
        if (allowed.has('supply')) {
            candidates.push(this._makeMission('supply', null, '争夺战术空投'));
        }
        if (allowed.has('elimination')) {
            const killTarget = this.game.gameMode?.cfg?.id === 'tdm' ? 4 : 3;
            const mission = this._makeMission('elimination', null, `限时歼灭 ${killTarget} 名敌军`);
            mission.killTarget = killTarget;
            mission.killBaseline = this.game.playerStats?.kills || 0;
            candidates.push(mission);
        }

        if (allowed.has('vehicle')) {
            const vehicles = (this.game.vehicles || []).filter(vehicle => vehicle.alive && vehicle.team === 1);
            if (vehicles.length) {
                const target = vehicles[Math.floor(Math.random() * vehicles.length)];
                candidates.push(this._makeMission('vehicle', target, `摧毁 ${target.config?.name || '敌方载具'}`));
            }
        }
        if (allowed.has('objective') && this.game.supportsStrategicObjectives?.()) {
            const objectives = (this.game.world?.getStrategicObjectives?.() || []).filter(obj => obj.alive && obj.team === 1);
            if (objectives.length) {
                const target = objectives[Math.floor(Math.random() * objectives.length)];
                candidates.push(this._makeMission('objective', target, `破坏 ${target.name}`));
            }
        }
        return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
    }

    _makeMission(type, target, label) {
        const min = this.cfg.mission.minDuration;
        const max = this.cfg.mission.maxDuration;
        return {
            id: `mission_${++this._missionSerial}`,
            type,
            target,
            label: label.trim(),
            duration: min + Math.random() * Math.max(0, max - min),
            progress: 0,
            holdTime: 0,
        };
    }

    _settleMission(success) {
        const mission = this.mission;
        if (!mission || this._settledMissionIds.has(mission.id)) return;
        this._settledMissionIds.add(mission.id);
        if (success) {
            this.recordContribution('missionSuccess', this.game.player, 1, { missionId: mission.id });
            this._addSpecializationXP(this.game.playerClassType, this.cfg.specialization.missionXP);
            if (this.game.playerStats) this.game.playerStats.missionsCompleted++;
        } else if (this._missionParticipation) {
            const gain = this.cfg.requisition.contribution.missionParticipation;
            this.requisition = Math.min(this.cfg.requisition.max, this.requisition + gain * this._getComebackMultiplier());
            if (this.game.playerStats) this.game.playerStats.missionsParticipated++;
        }
        this.missionState = success ? 'success' : 'failure';
        this.missionTimer = 4;
        this.game.hud?.showNotification?.(success ? `任务完成：${mission.label}` : `任务失败：${mission.label}`, 3);
    }

    _clearMission() {
        if (this.mission?.type === 'supply') this.game.removeDirectorMissionSupply?.(this.mission.target);
        this.mission = null;
        this.missionState = 'cooldown';
        this.missionTimer = this.cfg.mission.cooldown;
        this._missionParticipation = false;
        this._missionKillBaseline = this.game.playerStats?.kills || 0;
    }

    _addSpecializationXP(classType, amount) {
        if (!classType || amount <= 0) return;
        const state = this.specializations[classType];
        if (!state) return;
        state.xp = Math.min(this.cfg.specialization.level2XP, state.xp + amount);
        if (state.xp >= this.cfg.specialization.level2XP && state.level < 2) {
            state.level = 2;
            this.game.onSpecializationLevelUp?.(classType, state);
        }
    }

    _getComebackMultiplier() {
        const friendly = this.game.friendlyTickets ?? this.game.friendlyScore ?? 0;
        const enemy = this.game.enemyTickets ?? this.game.enemyScore ?? 0;
        const gap = enemy - friendly;
        if (gap >= this.cfg.requisition.scoreGapForScaling) return this.cfg.requisition.trailingMultiplier;
        if (gap <= -this.cfg.requisition.scoreGapForScaling) return this.cfg.requisition.leadingMultiplier;
        return 1;
    }

    _isContributionRelevant(kind, context) {
        if (!this.mission) return false;
        if (context.missionId === this.mission.id) return true;
        const target = this.mission.target;
        const sameTarget = context.target === target || context.capturePoint === target;
        switch (this.mission.type) {
            case 'attack':
            case 'defend':
                // 仅承认对当前任务据点的占领/防守贡献
                return (kind === 'capture' || kind === 'kill' || kind === 'assist' || kind === 'spotAssist')
                    && sameTarget;
            case 'vehicle':
            case 'objective':
                // 仅承认对当前任务载具/战略目标的伤害与击杀链
                return kind === 'kill' || kind === 'assist' || kind === 'spotAssist' || sameTarget;
            case 'elimination':
                return kind === 'kill' || kind === 'assist' || kind === 'spotAssist';
            case 'supply':
                // 仅承认对当前任务空投的争夺贡献（抢到空投）
                return kind === 'support' && context.target === target;
            default:
                return false;
        }
    }

    _trackPlayerParticipation() {
        const player = this.game.player;
        const target = this.mission?.target;
        const pos = this._targetPosition(target);
        if (!player?.alive || !pos) return;
        const radius = target?.radius || (this.mission.type === 'supply' ? this.cfg.mission.supplyRadius : 14);
        if (this._distance2D(player.position, pos) <= radius * 1.35) this._missionParticipation = true;
    }

    _targetPosition(target) {
        if (!target) return null;
        if (target.position) return target.position;
        if (Number.isFinite(target.x) && Number.isFinite(target.z)) return target;
        return null;
    }

    _isTargetInBounds(target) {
        const size = this.game.world?.mapConfig?.size || CONFIG.WORLD.size;
        const half = size / 2 - 5;
        return Number.isFinite(target.x) && Number.isFinite(target.z) && Math.abs(target.x) <= half && Math.abs(target.z) <= half;
    }

    _distance2D(a, b) {
        const dx = (a?.x || 0) - (b?.x || 0);
        const dz = (a?.z || 0) - (b?.z || 0);
        return Math.sqrt(dx * dx + dz * dz);
    }
}
