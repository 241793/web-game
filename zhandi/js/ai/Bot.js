import * as THREE from 'three';
import { CONFIG } from '../config.js?v=20260811.1';
import { CharacterModel } from '../player/CharacterModel.js?v=20260811.2';

// AI状态
const AIState = {
    PATROL: 'patrol',
    CAPTURE: 'capture',
    ENGAGE: 'engage',
    MOVE_TO_COVER: 'move_to_cover',
    RETREAT: 'retreat',
    DEAD: 'dead',
};

// AI机器人士兵
export class Bot {
    constructor(scene, world, audio, team, classType, name) {
        this.scene = scene;
        this.world = world;
        this.audio = audio;

        this.team = team;         // 0=friendly, 1=enemy
        this.classType = classType;
        this.name = name;

        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.health = CONFIG.AI.health;
        this.alive = true;

        // AI状态
        this.state = AIState.PATROL;
        this.target = null;          // 目标敌人
        this.patrolTarget = null;    // 巡逻目标
        this.lastFireTime = 0;
        this.respawnTimer = 0;
        this.stateTimer = 0;
        this.reactionTimer = 0;

        // 武器配置
        const loadout = CONFIG.CLASSES[classType];
        this.weaponConfig = CONFIG.WEAPONS[loadout.primary];
        this.ammoInMag = this.weaponConfig.magSize;
        this.reserveAmmo = this.weaponConfig.reserveAmmo;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.reloadDuration = 0;
        this.reloadAnimProgress = 0;

        // 爆发射击控制
        this.burstCount = 0;
        this.burstPause = 0;
        this.burstLength = this._getBurstLength();

        // 动画
        this.animTime = 0;
        this.deathProgress = 0;

        // 得分
        this.kills = 0;
        this.deaths = 0;

        // 导航
        this.pathTimer = 0;
        this.stuckTimer = 0;
        this.lastPosition = new THREE.Vector3();

        // 模型
        this.model = CharacterModel.build(team, classType);
        this.model.userData.character = this;  // 覆盖为实际对象引用，供射击命中检测使用
        this.scene.add(this.model);

        // 瞄准目标位置
        this.aimPosition = new THREE.Vector3();
        this.aimError = new THREE.Vector3();

        // 受伤反应
        this.lastAttacker = null;
        this.lastDamageTime = 0;
        this.suppressionLevel = 0;  // 压制等级（0-1），越高准确度越低

        // 掩体
        this.coverTarget = null;
        this.coverTimer = 0;

        // 侧移方向
        this.strafeDir = 0;  // -1, 0, 1
        this.strafeTimer = 0;

        // 武器最佳射程
        this.optimalRange = this._getOptimalRange();
        this.minRange = this._getMinRange();

        // 小队系统
        this.squadId = -1;
        this.squadLeader = null;
        this.squadMembers = [];

        // 主线程注入的动态战场目标/支援目标（只保存引用，不主动扫描）
        this._battlefieldPriorityTarget = null;
        this._supportSupplyTarget = null;
        this._supportRallyTarget = null;
        this._supportSupplyApproach = new THREE.Vector3();
        this._smokeZones = [];

        // 医疗兵
        this.medicHealCooldown = 0;

        // 手雷
        this.grenadeCooldown = 0;
        this.grenadeCount = 2;

        // 倒地状态
        this.downed = false;
        this.bleedOutTimer = 0;

        // 近飞压制计时
        this._nearMissTimer = 0;

        // === 性能优化：节流计时器 ===
        this._enemySearchTimer = 0;       // 敌人搜索间隔
        this._cachedTarget = null;       // 缓存的目标
        this._losRaycaster = new THREE.Raycaster(); // 复用raycaster

        // === 弹道对象池 ===
        this._tracerPool = [];           // 弹道线对象池
        this._activeTracers = [];        // 活跃的弹道
        this._tracerMat = null;          // 共享材质
        this._tmpVec1 = new THREE.Vector3();
        this._tmpVec2 = new THREE.Vector3();
        this._muzzleFlashMesh = null;
        this._muzzleFlashLight = null;
        this._muzzleFlashTimer = 0;
        this._muzzleFlashDuration = 0.05;
    }

    spawn(position) {
        this.position.copy(position);
        this.velocity.set(0, 0, 0);
        this.health = CONFIG.AI.health;
        this.alive = true;
        this.state = AIState.PATROL;
        this.target = null;
        this.ammoInMag = this.weaponConfig.magSize;
        this.reserveAmmo = this.weaponConfig.reserveAmmo;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.reloadDuration = 0;
        this.reloadAnimProgress = 0;
        this.deathProgress = 0;
        this.burstCount = 0;
        this.burstPause = 0;
        this.suppressionLevel = 0;
        this.coverTarget = null;
        this.lastAttacker = null;
        this.medicHealCooldown = 0;
        this.grenadeCooldown = 0;
        this.grenadeCount = 2;
        this.downed = false;
        this.bleedOutTimer = 0;
        this._beingExecuted = false;
        this._executionProgress = null;
        this._spottedByPlayer = false;
        this._spottedByPlayerTimer = 0;
        this._enemySearchTimer = 0.12 + Math.random() * 0.5;
        this._cachedTarget = null;
        this._farSkipCounter = Math.floor(Math.random() * 5);
        this._midSkipCounter = Math.floor(Math.random() * 2);
        this.pathTimer = Math.random() * 0.35;
        this.stuckTimer = 0;

        const groundY = this.world.getHeight(position.x, position.z);
        this.position.y = groundY;
        this.lastPosition.copy(this.position);

        this.model.visible = true;
        this.model.userData.baseY = groundY;
        this.model.position.copy(this.position);
        this.model.rotation.set(0, 0, 0);
        // 重置肢体旋转，避免重生后残留倒地姿态
        this.model.userData._proneProgress = 0;

        // 重新显示团队标记
        const marker = this.model.getObjectByName('teamMarker');
        if (marker) marker.visible = true;

        // 随机巡逻目标
        this._pickPatrolTarget();
    }

    setBattlefieldPriority(target) {
        this._battlefieldPriorityTarget = target || null;
    }

    setSupportTargets({ supply = null, rally = null, smokeZones = [] } = {}) {
        this._supportSupplyTarget = supply || null;
        this._supportRallyTarget = rally || null;
        this._smokeZones = Array.isArray(smokeZones)
            ? smokeZones
            : (smokeZones ? [smokeZones] : []);
    }

    update(dt, allTargets, capturePoints, player) {
        this._updateMuzzleFlash(dt);
        if (!this.alive) {
            if (this.downed) {
                // 倒地状态：平躺地上求救；被处决时播放受刑抽搐
                this.deathProgress = Math.min(0.5, this.deathProgress + dt * 2);
                // 每帧用当前位置的真实地面高度刷新 baseY，避免在斜坡/平台上倒地时模型陷地或浮空
                const gy = this.world.getHeight(this.position.x, this.position.z);
                this.model.userData.baseY = gy;
                if (this._beingExecuted && this._executionProgress != null) {
                    CharacterModel.animateBeingExecuted(this.model, this._executionProgress);
                } else {
                    CharacterModel.animateDowned(this.model, this.deathProgress);
                }
                this.bleedOutTimer -= dt;
                if (this.bleedOutTimer <= 0) {
                    this._finalizeDeath();
                }
                return null;
            }
            // 彻底死亡：继续倒地动画到完成
            this.respawnTimer -= dt;
            this.deathProgress = Math.min(1, this.deathProgress + dt * 2);
            // 同步 baseY 到真实地面，防止尸体在斜坡上陷入或悬空
            const gy2 = this.world.getHeight(this.position.x, this.position.z);
            this.model.userData.baseY = gy2;
            CharacterModel.animateDeath(this.model, this.deathProgress);
            return null;
        }

        // === LOD 距离优化：根据距玩家距离决定更新频率 ===
        let distToPlayer = 999;
        if (player && player.position) {
            const dx = this.position.x - player.position.x;
            const dz = this.position.z - player.position.z;
            distToPlayer = Math.sqrt(dx * dx + dz * dz);
        }

        // 三级LOD：
        // 近处(<40m)：每帧全量更新
        // 中距(40-90m)：每2帧更新一次重逻辑，但每帧移动
        // 远处(>90m)：每5帧更新一次重逻辑，但每帧移动，避免开局远处NPC原地顿跳
        // rawDt 供移动/动画使用，避免重逻辑帧的倍乘 dt 造成位移跳变
        const rawDt = dt;
        let runHeavyThink = true;
        if (distToPlayer > 90) {
            this._farSkipCounter = (this._farSkipCounter || 0) + 1;
            if (this._farSkipCounter < 5) {
                runHeavyThink = false;
            } else {
                this._farSkipCounter = 0;
                // 远处用更大的dt补偿低频重逻辑；位移仍使用原始dt逐帧执行
                dt = dt * 5;
            }
            if (!runHeavyThink) {
                const moveDt = dt;
                this._updateMovement(moveDt);
                this.animTime += moveDt;
                this.model.position.copy(this.position);
                this.model.userData.baseY = this.position.y;
                this.model.rotation.y = this.yaw;
                return null;
            }
        } else if (distToPlayer > 40) {
            this._midSkipCounter = (this._midSkipCounter || 0) + 1;
            if (this._midSkipCounter < 2) {
                // 跳过 AI 决策/射击，但保持移动与行走动画连续（否则中距人物看起来在滑行）
                this._updateMovement(dt);
                this.animTime += dt;
                this.model.position.copy(this.position);
                this.model.userData.baseY = this.position.y;
                this.model.rotation.y = this.yaw;
                if (!this.isReloading) {
                    CharacterModel.animateWalk(this.model, this.animTime, this.moveSpeed || 0, false, false, false);
                }
                return null;
            }
            this._midSkipCounter = 0;
            dt = dt * 2;
        }

        this.stateTimer += dt;
        this.pathTimer += dt;

        // 冷却计时
        if (this.medicHealCooldown > 0) this.medicHealCooldown -= dt;
        if (this.grenadeCooldown > 0) this.grenadeCooldown -= dt;

        // 压制效果衰减
        this.suppressionLevel = Math.max(0, this.suppressionLevel - dt * 0.3);

        // === 性能优化：节流敌人搜索（每0.3秒搜索一次，而非每帧）===
        this._enemySearchTimer -= dt;
        if (this._enemySearchTimer <= 0 || (this.target && !this.target.alive)) {
            this._enemySearchTimer = 0.45 + Math.random() * 0.25; // 添加随机避免同步
            this._cachedTarget = this._findNearestEnemy(allTargets, player);
        }

        // AI决策（使用缓存的搜索结果）
        this._updateAI(dt, allTargets, capturePoints, player, this._cachedTarget);

        // 兵种专属行为
        this._updateClassBehavior(dt, allTargets, capturePoints, player);

        // 小队协作
        this._updateSquadBehavior(dt, allTargets);

        // 手雷投掷
        this._updateGrenadeBehavior(dt);

        // 移动（用原始帧时间，LOD 倍乘只补偿决策计时，避免位移跳变）
        this._updateMovement(rawDt);

        // 射击 - 更近才射击（减少远程无效计算）
        if (distToPlayer < 80) {
            this._updateCombat(dt, player);
        }

        // 换弹
        if (this.isReloading) {
            this.reloadTimer -= dt;
            this.reloadAnimProgress = 1 - (this.reloadTimer / this.reloadDuration);
            if (this.reloadTimer <= 0) {
                const needed = this.weaponConfig.magSize - this.ammoInMag;
                const taken = Math.min(needed, this.reserveAmmo);
                this.ammoInMag += taken;
                this.reserveAmmo -= taken;
                this.isReloading = false;
                this.reloadAnimProgress = 0;
            }
        }

        // 更新弹道生命周期（替代setTimeout）
        this._updateTracers(dt);

        // 模型更新 - 可视范围内都播放动画（雾距340m，130m内漂移会非常显眼；
        // 中远距离本身已被 LOD 降频，动画开销可控）
        if (distToPlayer < 130) {
            this._updateModel(rawDt);
        } else {
            // 远处只更新位置和朝向
            this.model.position.copy(this.position);
            this.model.userData.baseY = this.position.y;
            if (this.target && this.target.alive) {
                this.model.rotation.y = Math.atan2(
                    this.target.position.x - this.position.x,
                    this.target.position.z - this.position.z
                );
            } else {
                this.model.rotation.y = this.yaw;
            }
        }

        // 卡住检测
        const distMoved = this.position.distanceTo(this.lastPosition);
        // ENGAGE 时也累计卡住，但阈值更大（交战微挪不算卡），超时后强制侧移脱困
        const stuckThreshold = this.state === AIState.ENGAGE ? 0.05 : 0.01;
        if (distMoved < stuckThreshold) {
            this.stuckTimer += dt;
            const stuckLimit = this.state === AIState.ENGAGE ? 0.8 : 1.0;
            if (this.stuckTimer > stuckLimit) {
                if (this.state === AIState.ENGAGE) {
                    // 交战卡墙：放弃当前掩体目标，强制侧移脱困
                    this.coverTarget = null;
                    this._findCover();
                    if (this.coverTarget) { this.state = AIState.MOVE_TO_COVER; this.coverTimer = 2.0; }
                } else {
                    this._pickPatrolTarget();
                }
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
        }
        this.lastPosition.copy(this.position);

        return null;
    }

    _updateAI(dt, allTargets, capturePoints, player, cachedEnemy) {
        // 载具规避 - 18m 内有接近的载具时强制侧移躲开，避免被撞死
        this._avoidVehicles(dt, allTargets);

        // 受伤反应 - 被攻击后短时间内寻找攻击者
        const timeSinceDamage = performance.now() / 1000 - this.lastDamageTime;
        if (this.lastAttacker && timeSinceDamage < 2.0 && this.state !== AIState.ENGAGE) {
            // 被偷袭时，立即转向攻击者
            this.target = this.lastAttacker.alive ? this.lastAttacker : null;
            if (this.target) {
                this.state = AIState.ENGAGE;
                this.reactionTimer = CONFIG.AI.reactionTime * 0.5; // 受伤反应更快
            }
        }

        // 使用缓存搜索结果而非每帧搜索
        const enemy = cachedEnemy || null;

        let seekingSupply = false;
        if (!enemy && (this.state === AIState.PATROL || this.state === AIState.CAPTURE) &&
            !this._getValidBattlefieldPriorityTarget()) {
            const supplyPos = this._getSupportSupplyPosition();
            seekingSupply = !!supplyPos && this._needsSupplySupport();
            if (seekingSupply) {
                this.patrolTarget = this._getSupportSupplyApproachPoint(supplyPos);
            }
        }

        if (enemy) {
            this.target = enemy;
            if (this.state !== AIState.ENGAGE) {
                this.state = AIState.ENGAGE;
                this.reactionTimer = CONFIG.AI.reactionTime;
            }
            // 重置巡逻计时器
            this.stateTimer = 0;
        } else {
            if (this.state === AIState.ENGAGE) {
                // 失去目标，回到巡逻
                this.state = AIState.PATROL;
                this.target = null;
                this._pickPatrolTarget();
            }
        }

        // 换弹决策 - 安全时低弹药自动换弹
        if (!this.isReloading && this.ammoInMag < this.weaponConfig.magSize * 0.3) {
            const hasNearbyEnemy = enemy && this.position.distanceTo(enemy.position) < this.weaponConfig.range;
            // 没有近距离敌人时换弹
            if (!hasNearbyEnemy && this.reserveAmmo > 0) {
                this._startReload();
            }
        }

        // 交战中换弹时寻找掩体（避免站桩挨打）
        if (this.isReloading && this.state === AIState.ENGAGE && !this.coverTarget && this.reloadTimer > 0.8) {
            this._findCover();
            if (this.coverTarget) {
                this.state = AIState.MOVE_TO_COVER;
                this.coverTimer = 3.0;
            }
        }

        // 被压制时寻找掩体
        if (this.suppressionLevel > 0.5 && this.state === AIState.ENGAGE && !this.coverTarget) {
            this._findCover();
            if (this.coverTarget) {
                this.state = AIState.MOVE_TO_COVER;
                this.coverTimer = 5.0;
            }
        }

        // 掩体移动完成
        if (this.state === AIState.MOVE_TO_COVER) {
            this.coverTimer -= dt;
            if (this.coverTarget && this.position.distanceTo(this.coverTarget) < 3) {
                // 到达掩体，重新交战
                this.state = AIState.ENGAGE;
                this.suppressionLevel *= 0.5;
                this.coverTarget = null;
            } else if (this.coverTimer <= 0) {
                // 超时，放弃掩体
                this.state = AIState.ENGAGE;
                this.coverTarget = null;
            }
        }

        // 检查是否需要占领据点
        if (this.state === AIState.PATROL && this.stateTimer > 5 && !seekingSupply) {
            const advancePoint = this._getAdvanceApproachPoint(capturePoints);
            // 70%概率前往当前战术目标
            if (advancePoint && Math.random() < 0.7) {
                this.patrolTarget = advancePoint;
            }
            this.stateTimer = 0;
        }

        // 血量低时撤退；非交战且已有己方补给时继续前往补给点
        if (this.health < 30 && this.state !== AIState.RETREAT && !seekingSupply) {
            this.state = AIState.RETREAT;
            this.stateTimer = 0;
        }
        if (this.state === AIState.RETREAT && (this.health > 50 || this.stateTimer > 5)) {
            this.state = AIState.PATROL;
            this._pickPatrolTarget();
        }
    }

    // 载具规避：18m 内有接近的载具时强制垂直侧移，避免被碾压
    _avoidVehicles(dt, allTargets) {
        if (!allTargets || !allTargets.length) return;
        let threat = null;
        let threatDist = Infinity;
        for (const t of allTargets) {
            if (!t || t === this) continue;
            // 只对载具（有 config.isVehicle 或 type 在载具列表）生效
            if (!t.config && !t.isVehicle) continue;
            if (t.alive === false) continue;
            if (!t.position) continue;
            // 静止载具不视为威胁：开局所有载具都停在基地，若按 yaw 推算行进方向会让 bot 围着载具反复横跳
            const vlen2 = (t.velocity ? Math.hypot(t.velocity.x, t.velocity.z) : 0);
            if (vlen2 < 2.5) continue;
            const dx = t.position.x - this.position.x;
            const dz = t.position.z - this.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < threatDist && dist < 18) {
                threat = t;
                threatDist = dist;
            }
        }
        if (!threat) {
            this._vehicleAvoidTimer = 0;
            return;
        }
        // 载具在移动，按速度方向计算
        let vdx, vdz;
        if (threat.velocity && (threat.velocity.x || threat.velocity.z)) {
            vdx = threat.velocity.x; vdz = threat.velocity.z;
        } else {
            const y = threat.yaw || 0;
            vdx = Math.sin(y); vdz = Math.cos(y);
        }
        const vlen = Math.sqrt(vdx * vdx + vdz * vdz) || 1;
        vdx /= vlen; vdz /= vlen;
        // 垂直方向（两个候选），选远离载具行进线的那一侧
        const perpA = { x: -vdz, z: vdx };
        const perpB = { x: vdz, z: -vdx };
        const toBot = { x: this.position.x - threat.position.x, z: this.position.z - threat.position.z };
        const dotA = toBot.x * perpA.x + toBot.z * perpA.z;
        const perp = dotA >= 0 ? perpA : perpB;
        // 设定侧移方向与逃跑目标点（沿垂直方向 8m）
        this._vehicleAvoidTarget = {
            x: this.position.x + perp.x * 8,
            z: this.position.z + perp.z * 8,
        };
        this._vehicleAvoidTimer = 1.2;
        // 近距载具压制射击精度
        this.suppressionLevel = Math.min(1, this.suppressionLevel + dt * 1.5);
    }

    _findNearestEnemy(allTargets, player) {
        let nearest = null;
        const baseSightRange = CONFIG.AI.sightRange;
        let nearestDist = baseSightRange;
        let nearestThreat = -1;

        // === 优化：先按距离排序，只对最近的几个做视线检测（大幅减少raycaster调用）===
        const candidates = [];

        // 检查玩家（排除载具内玩家；倒地玩家仍可作为补枪目标）
        if (player && !player.inVehicle && player.team !== this.team && (player.alive || player.downed)) {
            const dist = this.position.distanceTo(player.position);
            // 倒地目标威胁权重略降，但仍会被附近敌人补刀
            if (dist < nearestDist) {
                candidates.push({ target: player, dist: dist, isPlayer: true, downed: !!player.downed });
            }
        }

        // 检查其他AI（含倒地，可补枪 finish）
        for (const t of allTargets) {
            if (t === this) continue;
            if (!t.alive && !t.downed) continue;
            if (t.team === this.team) continue;

            const dist = this.position.distanceTo(t.position);
            if (dist < nearestDist) {
                candidates.push({ target: t, dist: dist, isPlayer: false, downed: !!t.downed });
            }
        }

        // 按距离排序，只对最近的2个做视线检测（大幅减少raycaster调用）
        candidates.sort((a, b) => a.dist - b.dist);
        const maxChecks = Math.min(candidates.length, 2);
        for (let i = 0; i < maxChecks; i++) {
            const c = candidates[i];
            const sightRange = this._isLineObscuredBySmoke(c.target.position)
                ? baseSightRange * 0.45
                : baseSightRange;
            if (c.dist > sightRange) continue;
            if (this._hasLineOfSight(c.target.position)) {
                let threat = (c.isPlayer ? 2.0 : 1.5) - c.dist / sightRange;
                if (c.downed) threat *= 0.75; // 倒地仍会追，但优先活着的威胁
                if (threat > nearestThreat) {
                    nearest = c.target;
                    nearestDist = c.dist;
                    nearestThreat = threat;
                }
            }
        }

        return nearest;
    }

    _isLineObscuredBySmoke(targetPos) {
        if (!targetPos || !this._smokeZones?.length) return false;

        const startX = this.position.x;
        const startZ = this.position.z;
        const endX = Number(targetPos.x);
        const endZ = Number(targetPos.z);
        if (!Number.isFinite(endX) || !Number.isFinite(endZ)) return false;

        const segX = endX - startX;
        const segZ = endZ - startZ;
        const segLenSq = segX * segX + segZ * segZ;

        for (const zone of this._smokeZones) {
            if (!zone || zone.alive === false) continue;
            const center = zone.position || zone.center || zone;
            const centerX = Number(center.x);
            const centerZ = Number(center.z);
            const radius = Number(zone.radius ?? center.radius);
            if (!Number.isFinite(centerX) || !Number.isFinite(centerZ) || !Number.isFinite(radius) || radius <= 0) continue;

            let t = 0;
            if (segLenSq > 0.0001) {
                t = ((centerX - startX) * segX + (centerZ - startZ) * segZ) / segLenSq;
                t = THREE.MathUtils.clamp(t, 0, 1);
            }
            const closestX = startX + segX * t;
            const closestZ = startZ + segZ * t;
            const dx = centerX - closestX;
            const dz = centerZ - closestZ;
            if (dx * dx + dz * dz <= radius * radius) return true;
        }

        return false;
    }

    _hasLineOfSight(targetPos) {
        // === 优化：复用raycaster，避免每帧创建新对象 ===
        const origin = this.position;
        const dx = targetPos.x - origin.x;
        const dy = targetPos.y - origin.y + 1.5;
        const dz = targetPos.z - origin.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance < 0.01) return true;

        const invDist = 1 / distance;
        // THREE.Raycaster 的 origin/direction 在 .ray 子对象上
        this._losRaycaster.ray.origin.set(origin.x, origin.y + 1.5, origin.z);
        this._losRaycaster.far = distance;
        this._losRaycaster.ray.direction.set(dx * invDist, dy * invDist, dz * invDist);

        const meshes = this.world.getLosMeshes ? this.world.getLosMeshes() : this.world.getShootableMeshes();
        const intersects = this._losRaycaster.intersectObjects(meshes, false);

        return intersects.length === 0 || intersects[0].distance >= distance - 1;
    }

    _updateMovement(dt) {
        let targetPos = null;
        let vehicleAvoiding = false;

        // 载具规避最高优先：附近有载具威胁时朝垂直方向逃跑
        if (this._vehicleAvoidTimer > 0 && this._vehicleAvoidTarget) {
            this._vehicleAvoidTimer -= dt;
            targetPos = this._vehicleAvoidTarget;
            vehicleAvoiding = true;
            if (this.position.distanceTo(targetPos) < 2) {
                this._vehicleAvoidTimer = 0;
            }
            // 跳过状态机移动决策，直接进入下方移动执行（带逃跑加速）
        } else {
        // 医疗兵冲向倒地队友优先（由 Game 写入 _reviveTarget）
        if (this.classType === 'medic' && this._reviveTarget && this.alive) {
            targetPos = this._reviveTarget;
            // 到达附近后清目标，让 Game 侧执行复活
            if (this.position.distanceTo(targetPos) < 2.2) {
                this._reviveTarget = null;
            }
        }

        switch (this.state) {
            case AIState.PATROL:
            case AIState.CAPTURE:
                if (!targetPos && this.patrolTarget) {
                    targetPos = this.patrolTarget;
                    if (this.position.distanceTo(targetPos) < 3) {
                        this._pickPatrolTarget();
                    }
                }
                break;
            case AIState.ENGAGE:
                // 正在救人时不追敌
                if (targetPos && this._reviveTarget) break;
                if (this.target && (this.target.alive || this.target.downed)) {
                    const dist = this.position.distanceTo(this.target.position);
                    // 倒地敌人：靠近补刀/补枪（战地 AI 会 finish 倒地目标）
                    if (this.target.downed && !this.target.alive) {
                        if (dist > 2.5) {
                            targetPos = this.target.position;
                            this._combatCrouch = false;
                        } else {
                            this.strafeDir = 0;
                            this._combatCrouch = true; // 近身蹲下补枪
                        }
                        break;
                    }
                    if (dist > this.optimalRange) {
                        // 太远：靠近；小队里部分人侧翼包抄
                        if (this._shouldFlank && this._flankPos) {
                            targetPos = this._flankPos;
                        } else {
                            targetPos = this.target.position;
                        }
                    } else if (dist < this.minRange) {
                        // 太近，后退到最佳射程
                        const dir = this.position.clone().sub(this.target.position).normalize();
                        targetPos = this.position.clone().add(dir.multiplyScalar(8));
                    } else {
                        // 在最佳射程内，进行侧移规避 / 偶尔侧翼绕后
                        this.strafeTimer -= dt;
                        if (this.strafeTimer <= 0) {
                            // 随机选择侧移方向；约 22% 概率启动侧翼包抄
                            if (Math.random() < 0.22 && dist > 12) {
                                this._shouldFlank = true;
                                this._pickFlankPosition();
                                this.strafeDir = 0;
                                this._combatCrouch = false;
                                this.strafeTimer = 2.5 + Math.random() * 1.5;
                            } else {
                                this._shouldFlank = false;
                                this.strafeDir = Math.random() < 0.5 ? -1 : 1;
                                // 偶尔停止移动（停下时有概率蹲下压枪，像真人找稳定射击姿态）
                                if (Math.random() < 0.2) {
                                    this.strafeDir = 0;
                                    this._combatCrouch = Math.random() < 0.55;
                                } else {
                                    this._combatCrouch = false;
                                }
                                this.strafeTimer = 1.5 + Math.random() * 2.0;
                            }
                        }

                        if (this._shouldFlank && this._flankPos) {
                            targetPos = this._flankPos;
                            if (this.position.distanceTo(this._flankPos) < 3) {
                                this._shouldFlank = false;
                            }
                        } else if (this.strafeDir !== 0) {
                            // 性能优化：复用临时向量避免clone
                            if (!this._tmpStrafe) this._tmpStrafe = new THREE.Vector3();
                            this._tmpStrafe.set(
                                Math.cos(this.yaw + Math.PI / 2) * this.strafeDir,
                                0,
                                Math.sin(this.yaw + Math.PI / 2) * this.strafeDir
                            );
                            targetPos = this.position.clone().add(this._tmpStrafe.multiplyScalar(6));
                        }
                    }
                }
                break;
            case AIState.MOVE_TO_COVER:
                if (!this._reviveTarget && this.coverTarget) {
                    targetPos = this.coverTarget;
                }
                break;
            case AIState.RETREAT:
                if (this._reviveTarget) break; // 救人优先于撤退
                if (this.target) {
                    const dir = this.position.clone().sub(this.target.position).normalize();
                    targetPos = this.position.clone().add(dir.multiplyScalar(20));
                } else {
                    this._pickPatrolTarget();
                    targetPos = this.patrolTarget;
                }
                break;
        }
        } // end else (非载具规避时走状态机)

        let actualSpeed = 0;
        if (targetPos) {
            // 性能优化：复用临时向量避免clone
            if (!this._tmpDir) this._tmpDir = new THREE.Vector3();
            this._tmpDir.copy(targetPos).sub(this.position);
            this._tmpDir.y = 0;
            const dist = this._tmpDir.length();

            if (dist > 0.5) {
                this._tmpDir.normalize();
                // 撤退冲刺；长距离转移（>18m）也小跑，近距离与交战中步行
                let speedMult = 1;
                if (vehicleAvoiding) speedMult = 1.5;
                else if (this.state === AIState.RETREAT) speedMult = 1.5;
                else if (this._reviveTarget) speedMult = 1.55; // 救人冲刺
                else if (this.state !== AIState.ENGAGE && dist > 18) speedMult = 1.35;
                // 深水大幅减速；目标在水中则放弃改巡逻
                if (this.world.isUnderwater?.(this.position.x, this.position.z)) {
                    speedMult *= 0.4;
                }
                if (this.world.isUnderwater?.(targetPos.x, targetPos.z)) {
                    if (this.state === AIState.PATROL || this.state === AIState.ENGAGE) {
                        this._pickPatrolTarget?.();
                        this._reviveTarget = null;
                        if (this.state !== AIState.ENGAGE) targetPos = this.patrolTarget;
                    }
                    speedMult *= 0.5;
                }
                const speed = CONFIG.AI.moveSpeed * speedMult;

                const oldX = this.position.x;
                const oldZ = this.position.z;

                // 性能优化：复用临时向量
                if (!this._tmpNewPos) this._tmpNewPos = new THREE.Vector3();
                this._tmpNewPos.copy(this.position);
                this._tmpNewPos.x += this._tmpDir.x * speed * dt;
                this._tmpNewPos.z += this._tmpDir.z * speed * dt;

                // 碰撞检测
                const resolved = this.world.resolveCharacterMovement
                    ? this.world.resolveCharacterMovement(this.position, this._tmpNewPos, 0.4, 1.7)
                    : this.world.resolveMovement(this.position, this._tmpNewPos, 0.4, 1.7);
                this.position.copy(resolved);

                // 计算实际移动速度
                const movedDist = Math.sqrt(
                    (this.position.x - oldX) * (this.position.x - oldX) +
                    (this.position.z - oldZ) * (this.position.z - oldZ)
                );
                actualSpeed = movedDist / dt;

                // 朝向移动方向或目标
                if (this.state === AIState.ENGAGE && this.target) {
                    this.yaw = Math.atan2(
                        -(this.target.position.x - this.position.x),
                        -(this.target.position.z - this.position.z)
                    );
                } else {
                    this.yaw = Math.atan2(-this._tmpDir.x, -this._tmpDir.z);
                }
            }
        }
        this.moveSpeed = actualSpeed;

        // 地形高度
        const groundY = this.world.getHeight(this.position.x, this.position.z);
        this.position.y = groundY;
    }

    _updateCombat(dt, player) {
        // 允许对倒地敌人补枪/处决靠近；彻底死亡才放弃
        if (!this.target) return;
        const targetDowned = !!(this.target.downed && !this.target.alive);
        if (!this.target.alive && !targetDowned) return;
        if (this.isReloading) return;

        const dist = this.position.distanceTo(this.target.position);
        const obscuredBySmoke = this._isLineObscuredBySmoke(this.target.position);
        // 倒地目标：靠近补枪（缩短交战距离）；烟幕同时压低有效射程
        let fireRange = targetDowned ? Math.min(CONFIG.AI.fireRange, 18) : CONFIG.AI.fireRange;
        if (obscuredBySmoke) fireRange *= 0.45;
        if (dist > fireRange) return;
        if (!this._hasLineOfSight(this.target.position)) return;

        // 反应时间
        if (this.reactionTimer > 0) {
            this.reactionTimer -= dt;
            return;
        }

        // 爆发间歇
        if (this.burstPause > 0) {
            this.burstPause -= dt;
            return;
        }

        // 射击间隔；穿烟时降低开火意愿，拉长点射间隔
        const fireInterval = (60 / this.weaponConfig.fireRate) * (obscuredBySmoke ? 1.8 : 1);
        const now = performance.now() / 1000;
        if (now - this.lastFireTime < fireInterval) return;

        // 弹药检查
        if (this.ammoInMag <= 0) {
            this._startReload();
            return;
        }

        // 爆发射击完成，进入间歇（狙击手栓动周期长；偶尔"重新确认目标"长停顿更像真人）
        if (this.burstCount >= this.burstLength) {
            this.burstCount = 0;
            const wt = this.weaponConfig.type;
            if (wt === 'sniper') {
                this.burstPause = 1.3 + Math.random() * 1.2;
            } else if (Math.random() < 0.18) {
                this.burstPause = 1.0 + Math.random() * 1.2;   // 观察/调整姿态
            } else {
                this.burstPause = 0.3 + Math.random() * 0.5;
            }
            this.burstLength = this._getBurstLength(); // 随机下一次爆发长度
            return;
        }

        // 射击
        this.lastFireTime = now;
        this.ammoInMag--;
        this.burstCount++;

        // 开火暴露（战地机制）：射击会在小地图上短暂暴露位置
        // 狙击枪动静大暴露更久；已被手动标记的不覆盖更长的标记时间
        const exposeTime = this.weaponConfig.type === 'sniper' ? 5 : 3;
        if (!this._spotted || (this._spotTimer || 0) < exposeTime) {
            this._spotted = true;
            this._spotTimer = exposeTime;
        }

        // 性能优化：只有在玩家附近时才播放枪声（距离<70米）
        if (this.audio && player && player.position) {
            const dx = this.position.x - player.position.x;
            const dz = this.position.z - player.position.z;
            const distToPlayer = Math.sqrt(dx * dx + dz * dz);
            if (distToPlayer < 70) {
                this.audio.playGunshot(this.weaponConfig.type, this.position, false);
            }
        } else if (this.audio) {
            this.audio.playGunshot(this.weaponConfig.type, this.position, false);
        }

        // 命中判定 - 基于准确度、距离、压制等级
        let hitChance = CONFIG.AI.accuracy * (1 - dist / fireRange);
        // 倒地目标几乎躺着不动，补枪更容易
        if (targetDowned) hitChance *= 1.35;
        // 压制和烟幕降低准确度
        hitChance *= (1 - this.suppressionLevel * 0.6);
        if (obscuredBySmoke) hitChance *= 0.45;
        // 真人手感：爆发首发最准，连发越打越飘（模拟后坐力失控）
        hitChance *= Math.max(0.55, 1 - this.burstCount * 0.07);
        // 自己在移动时命中率大幅下降（真人跑打很难压枪）
        if ((this.moveSpeed || 0) > 2) hitChance *= 0.6;
        // 蹲姿射击更稳
        if (this._combatCrouch) hitChance *= 1.25;
        // 刚进入交战的头两秒"慌乱期"，命中率减半（真人遭遇战反应）
        if (this.stateTimer < 2 && this.state === AIState.ENGAGE) hitChance *= 0.55;
        // 目标移动降低准确度
        const targetSpeed = this.target.velocity && typeof this.target.velocity.length === 'function'
            ? this.target.velocity.length()
            : Math.abs(this.target.velocity || 0);
        if (targetSpeed > 3) {
            hitChance *= 0.7;
        }
        // 狙击手远距离更准
        if (this.classType === 'sniper' && dist > 50) {
            hitChance *= 1.3;
        }
        // 工程兵对载具更准
        if (this.classType === 'engineer' && this.target && this.target.team !== undefined) {
            hitChance *= 1.2;
        }
        // 突击兵中距离加成
        if (this.classType === 'assault' && dist > 15 && dist < 40) {
            hitChance *= 1.1;
        }
        hitChance = Math.min(hitChance, 0.85); // 上限

        const isHit = Math.random() < hitChance;

        if (isHit) {
            // 计算伤害
            let damage = this.weaponConfig.damage;
            if (dist > this.weaponConfig.range * 0.7) damage *= 0.7;

            // 对目标造成伤害
            if (this.target.takeDamage) {
                // 载具目标无精确命中点：传 null 走装甲侧/后平均
                //（误传 Bot 对象当 hitPoint 会使装甲方位判定得到 NaN 并恒为侧面）
                const hitArg = Array.isArray(this.target.occupants) ? null : this;
                const killed = this.target.takeDamage(damage, hitArg);
                if (killed) {
                    this.kills++;
                    if (this.target.onKilled) {
                        this.target.onKilled(this);
                    }
                }
            }
        } else {
            // 未命中 - 如果目标是玩家，检测近飞压制
            if (this.target === player && player.addSuppression) {
                const missDist = 0.5 + Math.random() * 2.5;
                player.addSuppression(CONFIG.AI.suppressionAmount * (1 - missDist / 3.0));
                // 性能优化：限制呼啸声频率
                if (this.audio && (!this._lastWhizzTime || now - this._lastWhizzTime > 0.15)) {
                    this._lastWhizzTime = now;
                    const whizzPos = player.position.clone();
                    whizzPos.x += (Math.random() - 0.5) * 2;
                    whizzPos.y += 1 + Math.random();
                    whizzPos.z += (Math.random() - 0.5) * 2;
                    this.audio.playBulletWhizz(whizzPos);
                }
            }
        }

        // 弹道效果 - 性能优化：远距离不生成弹道线
        if (player && player.position) {
            const dx = this.position.x - player.position.x;
            const dz = this.position.z - player.position.z;
            const distToPlayer = Math.sqrt(dx * dx + dz * dz);
            if (distToPlayer < 80) {
                this._fireTracer(this.target.position, isHit);
            }
        } else {
            this._fireTracer(this.target.position, isHit);
        }
    }

    _fireTracer(targetPos, isHit) {
        // === 优化：复用材质，用对象池管理弹道线 ===
        if (!this._tracerMat) {
            this._tracerMat = new THREE.LineBasicMaterial({
                color: this.weaponConfig.tracerColor,
                transparent: true,
                opacity: 0.5,
            });
        }

        const origin = this._tmpVec1;
        origin.copy(this.position);
        origin.y += 1.4;

        const endPoint = this._tmpVec2;
        endPoint.copy(targetPos);
        endPoint.y += 1.0;
        if (!isHit) {
            endPoint.y += (Math.random() - 0.5) * 3;
            endPoint.x += (Math.random() - 0.5) * 3;
            endPoint.z += (Math.random() - 0.5) * 3;
        }

        // 枪口闪光
        this._showMuzzleFlash(origin);

        // 从对象池取或创建新几何体
        let geo;
        if (this._tracerPool.length > 0) {
            geo = this._tracerPool.pop();
            const pos = geo.attributes.position.array;
            pos[0] = origin.x; pos[1] = origin.y; pos[2] = origin.z;
            pos[3] = endPoint.x; pos[4] = endPoint.y; pos[5] = endPoint.z;
            geo.attributes.position.needsUpdate = true;
        } else {
            geo = new THREE.BufferGeometry().setFromPoints([origin, endPoint]);
        }

        const line = new THREE.Line(geo, this._tracerMat);
        this.scene.add(line);
        this._activeTracers.push({ line: line, geo: geo, life: 0.08 });
    }

    _showMuzzleFlash(position) {
        if (!this._muzzleFlashMesh) {
            this._muzzleFlashMesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 5, 3),
                new THREE.MeshBasicMaterial({
                    color: 0xffdd44,
                    transparent: true,
                    opacity: 0,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                })
            );
            this._muzzleFlashMesh.visible = false;
            this.scene.add(this._muzzleFlashMesh);
        }

        this._muzzleFlashMesh.position.copy(position);
        this._muzzleFlashMesh.scale.setScalar(1);
        this._muzzleFlashMesh.visible = true;
        this._muzzleFlashMesh.material.opacity = 0.72;
        const pool = this.scene.userData.lightPool;
        if (pool) pool.flash(position, 0xffaa00, 0.8, 4, this._muzzleFlashDuration);
        this._muzzleFlashTimer = this._muzzleFlashDuration;
    }

    _updateMuzzleFlash(dt) {
        if (!this._muzzleFlashMesh || this._muzzleFlashTimer <= 0) return;
        this._muzzleFlashTimer -= dt;
        const t = Math.max(0, this._muzzleFlashTimer / this._muzzleFlashDuration);
        this._muzzleFlashMesh.material.opacity = t * 0.72;
        this._muzzleFlashMesh.scale.setScalar(1 + (1 - t) * 1.2);
        if (this._muzzleFlashTimer <= 0) {
            this._muzzleFlashMesh.visible = false;
            this._muzzleFlashMesh.material.opacity = 0;
        }
    }

    // 更新弹道生命周期（替代setTimeout）
    _updateTracers(dt) {
        for (let i = this._activeTracers.length - 1; i >= 0; i--) {
            const t = this._activeTracers[i];
            t.life -= dt;
            if (t.life <= 0) {
                this.scene.remove(t.line);
                // 回收到对象池
                if (this._tracerPool.length < 20) {
                    this._tracerPool.push(t.geo);
                } else {
                    t.geo.dispose();
                }
                this._activeTracers.splice(i, 1);
            }
        }
    }

    _updateModel(dt) {
        this.animTime += dt;
        // _updateMovement 不更新 this.velocity（永远为 0），动画必须用 moveSpeed 才能进入走/跑分支
        const speed = this.moveSpeed || 0;

        if (this.target && this.target.alive) {
            // 面向目标 - 性能优化：避免clone
            this.model.rotation.y = Math.atan2(
                this.target.position.x - this.position.x,
                this.target.position.z - this.position.z
            );
        } else {
            this.model.rotation.y = this.yaw;
        }

        // 设置基础 Y（地面高度）供动画使用
        this.model.userData.baseY = this.position.y;
        this.model.position.copy(this.position);

        if (this.isReloading && this.reloadDuration > 0) {
            // 换弹动画
            CharacterModel.animateReload(this.model, this.reloadAnimProgress);
        } else if (this._hitReactionTimer && this._hitReactionTimer > 0) {
            // 受击反应动画 - 传入方向感知参数
            this._hitReactionTimer -= dt;
            const intensity = Math.max(0, this._hitReactionTimer / 0.3) * (this._hitReactionIntensity || 1.0);
            CharacterModel.animateHitReaction(this.model, intensity, this._hitDirection || 0);
        } else {
            // 行走动画 - 交战状态且静止时显示瞄准姿态
            const isAiming = this.state === AIState.ENGAGE && (this.moveSpeed || 0) < 1.0;
            CharacterModel.animateWalk(this.model, this.animTime, this.moveSpeed || 0, !!this._combatCrouch, false, isAiming);
        }

        // 如果在战斗中，标记更明显
        const marker = this.model.getObjectByName('teamMarker');
        if (marker) {
            marker.rotation.y += dt * 2;
            // 敌方标记闪烁
            if (this.team === 1 && this.state === AIState.ENGAGE) {
                marker.material.opacity = 0.5 + Math.sin(this.animTime * 10) * 0.3;
            }
        }
    }

    _pickPatrolTarget() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 40;
        this.patrolTarget = new THREE.Vector3(
            this.position.x + Math.cos(angle) * dist,
            0,
            this.position.z + Math.sin(angle) * dist
        );

        // 边界限制
        const halfSize = CONFIG.WORLD.size / 2 - 5;
        this.patrolTarget.x = THREE.MathUtils.clamp(this.patrolTarget.x, -halfSize, halfSize);
        this.patrolTarget.z = THREE.MathUtils.clamp(this.patrolTarget.z, -halfSize, halfSize);
    }

    _getCaptureApproachPoint(cp) {
        if (this.world && this.world.getInfantryApproachPoint) {
            const pos = this.world.getInfantryApproachPoint(cp, this.team);
            pos.x += (Math.random() - 0.5) * 3.5;
            pos.z += (Math.random() - 0.5) * 3.5;
            pos.y = 0;
            return pos;
        }
        if (this.world && this.world.getDeployPositionNear) {
            const pos = this.world.getDeployPositionNear(cp, this.team);
            pos.x += (Math.random() - 0.5) * 5;
            pos.z += (Math.random() - 0.5) * 5;
            pos.y = 0;
            return pos;
        }
        return new THREE.Vector3(
            cp.x + (Math.random() - 0.5) * 10,
            0,
            cp.z + (Math.random() - 0.5) * 10
        );
    }

    _getAdvanceApproachPoint(capturePoints) {
        const priority = this._getValidBattlefieldPriorityTarget();
        if (priority) {
            return this._getPriorityApproachPoint(priority);
        }

        const objective = this._selectStrategicObjectiveTarget();
        if (objective) {
            return this._getPriorityApproachPoint(objective);
        }

        const targetCps = Array.isArray(capturePoints)
            ? capturePoints.filter(cp => cp && !cp.locked && cp.team !== this.team)
            : [];
        if (targetCps.length === 0) return null;

        let nearestCp = null;
        let nearestDist = Infinity;
        for (const cp of targetCps) {
            const dx = cp.x - this.position.x;
            const dz = cp.z - this.position.z;
            const d = Math.sqrt(dx * dx + dz * dz);
            if (d < nearestDist) {
                nearestDist = d;
                nearestCp = cp;
            }
        }
        return nearestCp ? this._getCaptureApproachPoint(nearestCp) : null;
    }

    _getValidBattlefieldPriorityTarget() {
        const target = this._battlefieldPriorityTarget;
        if (!target) return null;
        if (target.locked || target.alive === false || !this._getTargetPosition(target)) {
            this._battlefieldPriorityTarget = null;
            return null;
        }
        return target;
    }

    _getPriorityApproachPoint(target) {
        const targetPos = this._getTargetPosition(target);
        if (!targetPos) return null;

        let pos = null;
        if (target.position && target.maxHealth !== undefined && this.world?.getStrategicObjectiveApproachPoint) {
            pos = this.world.getStrategicObjectiveApproachPoint(target, this.team);
        } else if (!target.position && Number.isFinite(Number(target.x)) && Number.isFinite(Number(target.z))) {
            pos = this._getCaptureApproachPoint(target);
        } else if (this.world?.getDeployPositionNear) {
            pos = this.world.getDeployPositionNear({
                x: targetPos.x,
                z: targetPos.z,
                radius: target.radius || 8,
            }, this.team);
        }

        if (!pos) {
            pos = new THREE.Vector3(targetPos.x, targetPos.y || 0, targetPos.z);
        }
        pos.x += (Math.random() - 0.5) * 4;
        pos.z += (Math.random() - 0.5) * 4;
        pos.y = 0;
        return pos;
    }

    _selectStrategicObjectiveTarget() {
        if (this.world?.strategicObjectivesEnabled === false) return null;
        if (!this.world?.getStrategicObjectives) return null;

        const objectives = (this.world.getStrategicObjectives() || [])
            .filter(obj => obj.alive && !obj.locked && obj.team !== this.team);
        if (objectives.length === 0) return null;

        let best = null;
        let bestScore = -Infinity;
        for (const obj of objectives) {
            const dx = obj.position.x - this.position.x;
            const dz = obj.position.z - this.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const healthPct = obj.maxHealth > 0 ? obj.health / obj.maxHealth : 1;
            let score = 50;
            if (obj.type === 'fuel') score += 10;
            if (this.classType === 'engineer') score += 14;
            score += (1 - healthPct) * 18;
            score -= dist * 0.08;
            if (score > bestScore) {
                bestScore = score;
                best = obj;
            }
        }

        return bestScore > 20 ? best : null;
    }

    _getTargetPosition(target) {
        if (!target) return null;
        const pos = target.position || target;
        const x = Number(pos.x);
        const z = Number(pos.z);
        if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
        return pos;
    }

    _getSupportSupplyPosition() {
        const supply = this._supportSupplyTarget;
        if (!supply) return null;
        if (supply.alive === false || supply.locked || (supply.team !== undefined && supply.team !== this.team)) {
            this._supportSupplyTarget = null;
            return null;
        }
        return this._getTargetPosition(supply);
    }

    _needsSupplySupport() {
        const reserveMax = Number(this.weaponConfig?.reserveAmmo);
        const lowAmmo = Number.isFinite(reserveMax) && reserveMax > 0 && this.reserveAmmo < reserveMax * 0.3;
        return this.health < 55 || lowAmmo;
    }

    _getSupportSupplyApproachPoint(supplyPos) {
        this._supportSupplyApproach.set(
            Number(supplyPos.x),
            0,
            Number(supplyPos.z)
        );
        return this._supportSupplyApproach;
    }

    // 寻找掩体位置
    // 侧翼包抄点：目标左右 10~16m 的侧向位置
    _pickFlankPosition() {
        if (!this.target) {
            this._shouldFlank = false;
            return;
        }
        const side = Math.random() < 0.5 ? 1 : -1;
        const toEnemyX = this.target.position.x - this.position.x;
        const toEnemyZ = this.target.position.z - this.position.z;
        const len = Math.sqrt(toEnemyX * toEnemyX + toEnemyZ * toEnemyZ) || 1;
        // 垂直于敌我连线的侧向
        const perpX = -toEnemyZ / len * side;
        const perpZ = toEnemyX / len * side;
        const along = 0.45 + Math.random() * 0.25; // 略微前压
        const sideDist = 10 + Math.random() * 6;
        const fx = this.position.x + toEnemyX * along + perpX * sideDist;
        const fz = this.position.z + toEnemyZ * along + perpZ * sideDist;
        const fy = this.world.getHeight ? this.world.getHeight(fx, fz) : this.position.y;
        if (!this._flankPos) this._flankPos = new THREE.Vector3();
        this._flankPos.set(fx, fy, fz);
    }

    _findCover() {
        const obstacles = this.world.getShootableMeshes ? this.world.getShootableMeshes() : [];
        if (obstacles.length === 0) return;

        // 在附近寻找障碍物作为掩体
        let bestCoverX = 0, bestCoverY = 0, bestCoverZ = 0;
        let bestDist = 15;
        let found = false;

        // 复用临时向量避免GC
        if (!this._tmpCoverObs) this._tmpCoverObs = new THREE.Vector3();
        if (!this._tmpCoverAway) this._tmpCoverAway = new THREE.Vector3();

        for (const obs of obstacles) {
            if (!obs.position) continue;
            const obsPos = this._tmpCoverObs;
            obsPos.copy(obs.position);
            const dx = obsPos.x - this.position.x;
            const dy = obsPos.y - this.position.y;
            const dz = obsPos.z - this.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < bestDist && dist > 3) {
                // 检查障碍物是否在敌人和自己之间（作为掩体）
                if (this.target) {
                    const tx = this.target.position.x - this.position.x;
                    const ty = this.target.position.y - this.position.y;
                    const tz = this.target.position.z - this.position.z;
                    const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz);
                    if (tLen > 0.01) {
                        const ox = dx / dist;
                        const oy = dy / dist;
                        const oz = dz / dist;
                        const dot = (tx / tLen) * ox + (ty / tLen) * oy + (tz / tLen) * oz;
                        // 障碍物在朝向敌人的方向附近，是有效掩体
                        if (dot > 0.3) {
                            bestCoverX = obsPos.x;
                            bestCoverY = obsPos.y;
                            bestCoverZ = obsPos.z;
                            bestDist = dist;
                            found = true;
                        }
                    }
                }
            }
        }

        if (found) {
            // 移动到障碍物远离敌人的一侧
            if (this.target) {
                const away = this._tmpCoverAway;
                away.set(bestCoverX - this.target.position.x,
                         bestCoverY - this.target.position.y,
                         bestCoverZ - this.target.position.z);
                const awayLen = Math.sqrt(away.x * away.x + away.y * away.y + away.z * away.z);
                if (awayLen > 0.01) {
                    away.multiplyScalar(1.5 / awayLen);
                }
                this.coverTarget = new THREE.Vector3(bestCoverX + away.x, bestCoverY + away.y, bestCoverZ + away.z);
            } else {
                this.coverTarget = new THREE.Vector3(bestCoverX, bestCoverY, bestCoverZ);
            }
        }
    }

    // 开始换弹
    _startReload() {
        if (this.isReloading) return;
        if (this.reserveAmmo <= 0) return;
        if (this.ammoInMag >= this.weaponConfig.magSize) return;

        this.isReloading = true;
        this.reloadTimer = this.weaponConfig.reloadTime;
        this.reloadDuration = this.weaponConfig.reloadTime;
        this.reloadAnimProgress = 0;
        this.burstCount = 0;
        this.burstPause = 0;
    }

    // 获取武器最佳射程
    _getOptimalRange() {
        switch (this.weaponConfig.type) {
            case 'sniper': return 60;
            case 'rifle': return 35;
            case 'smg': return 20;
            case 'shotgun': return 12;
            default: return 30;
        }
    }

    // 获取武器最小射程（小于此距离后撤）
    _getMinRange() {
        switch (this.weaponConfig.type) {
            case 'sniper': return 25;
            case 'rifle': return 8;
            case 'smg': return 5;
            case 'shotgun': return 3;
            default: return 8;
        }
    }

    // 获取爆发射击长度
    _getBurstLength() {
        switch (this.weaponConfig.type) {
            case 'sniper': return 1;       // 狙击手单发
            case 'shotgun': return 1;      // 霰弹枪单发
            case 'dmr': return 1 + Math.floor(Math.random() * 2);    // 1-2发点放
            case 'rifle': return 3 + Math.floor(Math.random() * 3);  // 3-5发
            case 'smg': return 4 + Math.floor(Math.random() * 4);    // 4-7发
            case 'lmg': return 6 + Math.floor(Math.random() * 6);    // 6-11发长点射（机枪压制）
            default: return 3;
        }
    }

    takeDamage(amount, source = null, attackerPosition = null, bypassVehicle = false) {
        if (!this.alive && !this.downed) return false;

        let damage = amount;
        let attacker = null;

        // source 兼容两种调用方式：
        // 1. Game.js 传入 isHeadshot (boolean) — 伤害已在 WeaponSystem 中计算好，这里不再翻倍
        // 2. Bot.js 传入 attacker (object)
        if (typeof source === 'boolean') {
            // isHeadshot: 伤害倍率已由 WeaponSystem._fireRaycast 应用
        } else if (source) {
            attacker = source;
        }

        // === 载具保护：乘员伤害由载具承受 ===
        if (!bypassVehicle && this._assignedVehicle && this._assignedVehicle.alive) {
            const overflow = damage * (CONFIG.VEHICLES._crewDamageOverflow || 0.15);
            // 无精确命中点：传 null 走装甲侧/后平均（传载具中心会恒判顶甲，最弱区域）
            this._assignedVehicle.takeDamage(damage, null, attacker);
            this.health -= overflow;
            if (this.health <= 0) this._enterDownedState();
            return false;
        }

        // === 倒地状态下再受击 = 补枪/处决加速 ===
        if (this.downed) {
            if (attacker) this.lastAttacker = attacker;
            else if (attackerPosition && !this.lastAttacker) {
                // 无明确 attacker 时至少保留受击时间
            }
            this.lastDamageTime = performance.now() / 1000;
            this.bleedOutTimer -= damage * 0.1;
            if (this.bleedOutTimer <= 0) {
                this._finalizeDeath();
                return true;
            }
            return false;
        }

        this.health -= damage;

        // 触发受击反应动画
        this._hitReactionTimer = 0.3;
        this._hitReactionIntensity = Math.min(1.0, damage / 30);

        // 计算受击方向（相对角色朝向），用于方向感知受击动画
        let hitFromPos = null;
        if (attackerPosition) {
            hitFromPos = attackerPosition;
        } else if (attacker && attacker.position) {
            hitFromPos = attacker.position;
        }
        if (hitFromPos) {
            const dx = hitFromPos.x - this.position.x;
            const dz = hitFromPos.z - this.position.z;
            this._hitDirection = Math.atan2(dx, dz) - this.yaw;
        }

        // 记录攻击者
        if (attacker) {
            this.lastAttacker = attacker;
            this.lastDamageTime = performance.now() / 1000;
            // 压制武器（M249/MG42）命中时压制加倍
            this.suppressionLevel = Math.min(1, this.suppressionLevel + 0.35 * (attacker._suppressiveHit ? 2 : 1));
            // 被打中时短时侧移/找掩体（真人受击反应）
            if (this.state === AIState.ENGAGE && Math.random() < 0.45) {
                this.strafeDir = Math.random() < 0.5 ? -1 : 1;
                this.strafeTimer = 0.6 + Math.random() * 0.5;
                this._combatCrouch = Math.random() < 0.4;
            }
            if (this.suppressionLevel > 0.55 && !this.coverTarget && Math.random() < 0.35) {
                this._findCover();
                if (this.coverTarget) this.state = AIState.MOVE_TO_COVER;
            }
        } else if (attackerPosition) {
            this.lastDamageTime = performance.now() / 1000;
            this.suppressionLevel = Math.min(1, this.suppressionLevel + 0.3);
        }

        if (this.health <= 0) {
            this._enterDownedState();
            return false;  // 倒地不算 killed，bleedOut 后才返回 true
        }

        return false;
    }

    // 进入倒地状态
    _enterDownedState() {
        this.health = 0;
        this.alive = false;
        this.downed = true;
        this.bleedOutTimer = CONFIG.AI.botBleedOutTime;
        this.deathProgress = 0; // 从站立重新播放倒地躺平
        this._beingExecuted = false;
        this._executionProgress = null;
        this.state = AIState.DEAD;
        // 不立即增加 deaths，bleedOut 完成后才算
    }

    // 倒地结束 → 真正死亡，触发 onKilled 让 Game 处理 respawn
    _finalizeDeath() {
        this.downed = false;
        this.deaths++;
        if (this.onKilled) this.onKilled(this.lastAttacker);
    }

    onKilled(killer) {
        // 由Game处理
    }

    // 获取重生位置
    getRespawnPosition() {
        if (this.world && this.world.getTeamSpawnPoint) {
            return this.world.getTeamSpawnPoint(this.team);
        }
        // 在己方据点附近重生
        const teamSpawn = this.team === 0 ?
            { x: -95, z: -95 } : { x: 95, z: 95 };
        return new THREE.Vector3(
            teamSpawn.x + (Math.random() - 0.5) * 10,
            0,
            teamSpawn.z + (Math.random() - 0.5) * 10
        );
    }

    // 清理
    dispose() {
        if (this._muzzleFlashMesh) {
            this.scene.remove(this._muzzleFlashMesh);
            if (this._muzzleFlashMesh.geometry) this._muzzleFlashMesh.geometry.dispose();
            if (this._muzzleFlashMesh.material) this._muzzleFlashMesh.material.dispose();
            this._muzzleFlashMesh = null;
        }
        for (const t of this._activeTracers) {
            this.scene.remove(t.line);
            if (t.geo) t.geo.dispose();
        }
        this._activeTracers = [];
        for (const geo of this._tracerPool) {
            if (geo) geo.dispose();
        }
        this._tracerPool = [];
        if (this._tracerMat) {
            this._tracerMat.dispose();
            this._tracerMat = null;
        }
        this.scene.remove(this.model);
    }

    // 获取状态
    getState() {
        return {
            name: this.name,
            team: this.team,
            health: this.health,
            alive: this.alive,
            kills: this.kills,
            deaths: this.deaths,
        };
    }

    // 设置小队
    setSquad(squadId, leader, members) {
        this.squadId = squadId;
        this.squadLeader = leader;
        this.squadMembers = members || [];
    }

    // 小队协作行为
    _updateSquadBehavior(dt, allTargets) {
        // 如果是小队成员（非队长），跟随队长
        if (this.squadLeader && this !== this.squadLeader && this.state === AIState.PATROL) {
            // 队长死亡/倒地后停止跟随（避免全体围向尸体）
            if (!this.squadLeader.alive) {
                this.squadLeader = null;
                return;
            }
            const distToLeader = this.position.distanceTo(this.squadLeader.position);
            if (distToLeader > CONFIG.AI.squadFollowRange) {
                // 性能优化：复用临时向量
                if (!this._tmpSquadDir) this._tmpSquadDir = new THREE.Vector3();
                this._tmpSquadDir.copy(this.squadLeader.position).sub(this.position);
                this._tmpSquadDir.y = 0;
                const dist = this._tmpSquadDir.length();
                if (dist > 1) {
                    this._tmpSquadDir.normalize();
                    const speed = CONFIG.AI.moveSpeed * 0.8;
                    if (!this._tmpSquadNewPos) this._tmpSquadNewPos = new THREE.Vector3();
                    this._tmpSquadNewPos.copy(this.position);
                    this._tmpSquadNewPos.x += this._tmpSquadDir.x * speed * dt;
                    this._tmpSquadNewPos.z += this._tmpSquadDir.z * speed * dt;
                    const resolved = this.world.resolveCharacterMovement
                        ? this.world.resolveCharacterMovement(this.position, this._tmpSquadNewPos, 0.4, 1.7)
                        : this.world.resolveMovement(this.position, this._tmpSquadNewPos, 0.4, 1.7);
                    this.position.copy(resolved);
                    this.yaw = Math.atan2(-this._tmpSquadDir.x, -this._tmpSquadDir.z);
                    this.moveSpeed = speed;
                }
            }
        }

        // 如果队长发现敌人，通知小队成员
        if (this.squadLeader === this && this.target && this.state === AIState.ENGAGE) {
            for (const member of this.squadMembers) {
                if (member && member.alive && member.state !== AIState.ENGAGE) {
                    member.target = this.target;
                    member.state = AIState.ENGAGE;
                    member.reactionTimer = CONFIG.AI.reactionTime;
                }
            }
        }
    }

    // 兵种专属行为
    _updateClassBehavior(dt, allTargets, capturePoints, player) {
        switch (this.classType) {
            case 'sniper':
                this._updateSniperBehavior(dt, capturePoints);
                break;
            case 'engineer':
                this._updateEngineerBehavior(dt, allTargets, player);
                break;
            case 'assault':
                this._updateAssaultBehavior(dt, capturePoints);
                break;
            case 'medic':
                this._updateMedicBehavior(dt, allTargets);
                break;
        }
    }

    // 狙击手行为：寻找高地和远距离射击
    _updateSniperBehavior(dt, capturePoints) {
        // 狙击手保持远距离，不主动推进
        if (this.state === AIState.ENGAGE && this.target && this.target.alive) {
            const dist = this.position.distanceTo(this.target.position);
            // 狙击手保持30米以上距离
            if (dist < 30 && this.state !== AIState.RETREAT) {
                const dir = this.position.clone().sub(this.target.position).normalize();
                const retreatPos = this.position.clone().add(dir.multiplyScalar(15));
                // 撤退到更远位置
                this.patrolTarget = retreatPos;
                this.state = AIState.MOVE_TO_COVER;
                this.coverTarget = retreatPos;
                this.coverTimer = 3.0;
            }
            // 狙击手减少侧移，保持稳定射击
            if (dist >= 30 && dist <= 80) {
                this.strafeDir = 0;
                this.strafeTimer = 2.0;
            }
        }

        // 狙击手寻找高地
        if (this.state === AIState.PATROL && this.stateTimer > 8) {
            this._findSniperPosition(capturePoints);
        }
    }

    // 寻找狙击位置（高地或远离交火区）
    _findSniperPosition(capturePoints) {
        const candidates = [];
        // 在据点周围寻找位置
        for (const cp of capturePoints) {
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.5;
                const dist = 30 + Math.random() * 20;
                const x = cp.x + Math.cos(angle) * dist;
                const z = cp.z + Math.sin(angle) * dist;
                const y = this.world.getHeight(x, z);
                candidates.push({ x, z, y });
            }
        }

        // 选择最高的位置
        candidates.sort((a, b) => b.y - a.y);
        if (candidates.length > 0) {
            const best = candidates[0];
            this.patrolTarget = new THREE.Vector3(best.x, 0, best.z);
        }
        this.stateTimer = 0;
    }

    // 工程兵行为：反载具、维修友方载具
    _updateEngineerBehavior(dt, allTargets, player) {
        // 工程兵优先攻击载具
        if (this.state !== AIState.ENGAGE || !this.target) {
            // 寻找敌方载具
            const enemyVehicles = this._findEnemyVehicles(player);
            if (enemyVehicles && enemyVehicles.length > 0) {
                const nearestVehicle = enemyVehicles[0];
                const dist = this.position.distanceTo(nearestVehicle.position);
                if (dist < CONFIG.AI.sightRange) {
                    this.target = {
                        position: nearestVehicle.position,
                        alive: true,
                        isVehicleTarget: true,
                        vehicle: nearestVehicle,
                        takeDamage: (dmg) => {
                            // 工程兵反装甲：走命中区域与反装甲穿深
                            nearestVehicle.takeDamage(dmg, nearestVehicle.position, this, {
                                damageType: 'explosion',
                                antiArmor: true,
                            });
                            return nearestVehicle.health <= 0;
                        },
                        team: nearestVehicle.team,
                    };
                    this.state = AIState.ENGAGE;
                    this.reactionTimer = CONFIG.AI.reactionTime;
                }
            }
        }

        // 工程兵对载具伤害加成（被动）
        // 在_takeDamage中已由Game处理
    }

    // 查找敌方载具
    _findEnemyVehicles(player) {
        // 通过场景中的载具数据查找
        if (!this.scene.userData.vehicles) return null;
        const enemyVehicles = this.scene.userData.vehicles.filter(v =>
            v.alive && v.team !== this.team
        );
        // 按距离排序
        enemyVehicles.sort((a, b) =>
            this.position.distanceTo(a.position) - this.position.distanceTo(b.position)
        );
        return enemyVehicles;
    }

    // 突击兵行为：激进推进
    _updateAssaultBehavior(dt, capturePoints) {
        // 突击兵更积极地向据点推进
        if (this.state === AIState.PATROL) {
            const supplyPos = this._getSupportSupplyPosition();
            const seekingSupply = !this._getValidBattlefieldPriorityTarget() &&
                !!supplyPos && this._needsSupplySupport();
            if (seekingSupply) {
                this.patrolTarget = this._getSupportSupplyApproachPoint(supplyPos);
            } else {
                const advancePoint = this._getAdvanceApproachPoint(capturePoints);
                if (advancePoint && this.stateTimer > 3) {
                    this.patrolTarget = advancePoint;
                    this.stateTimer = 0;
                }
            }
        }

        // 突击兵在交战时更激进，减少后撤
        if (this.state === AIState.ENGAGE && this.target) {
            const dist = this.position.distanceTo(this.target.position);
            // 突击兵可以更近
            if (dist < this.minRange * 0.5) {
                // 只有非常近才后撤
                const dir = this.position.clone().sub(this.target.position).normalize();
                this.patrolTarget = this.position.clone().add(dir.multiplyScalar(5));
            }
        }
    }

    // 医疗兵治疗行为
    _updateMedicBehavior(dt, allTargets) {
        if (this.medicHealCooldown > 0) return;

        // 寻找附近低血量队友
        for (const t of allTargets) {
            if (t === this || !t.alive) continue;
            if (t.team !== this.team) continue;
            if (!t.health) continue;

            const dist = this.position.distanceTo(t.position);
            if (dist < CONFIG.AI.medicHealRange && t.health < 50) {
                // 治疗队友
                if (t.heal) {
                    t.heal(CONFIG.AI.medicHealAmount);
                } else if (t.health !== undefined) {
                    t.health = Math.min(t.health + CONFIG.AI.medicHealAmount, CONFIG.AI.health);
                }
                this.medicHealCooldown = CONFIG.AI.medicHealCooldown;

                // 治疗特效
                if (this.audio) {
                    this.audio.playUISound('capture');
                }
                break;
            }
        }
    }

    // 手雷投掷行为
    _updateGrenadeBehavior(dt) {
        if (this.grenadeCooldown > 0 || this.grenadeCount <= 0) return;
        if (!this.target || !this.target.alive) return;
        if (this.state !== AIState.ENGAGE) return;

        const dist = this.position.distanceTo(this.target.position);
        if (dist > CONFIG.AI.grenadeRange || dist < 8) return;

        // 检查目标是否在掩体后（没有直接视线但有已知位置）
        const hasLOS = this._hasLineOfSight(this.target.position);
        // 如果有视线且距离适中，有概率投掷手雷
        if (hasLOS && Math.random() < 0.01) {
            this._throwGrenade();
            this.grenadeCooldown = CONFIG.AI.grenadeCooldown;
            this.grenadeCount--;
        }
    }

    _throwGrenade() {
        const throwPos = this.position.clone();
        throwPos.y += 1.5;

        // 抛物线计算
        const targetPos = this.target.position.clone();
        const dir = targetPos.clone().sub(throwPos);
        dir.y = 0;
        const dist = dir.length();
        dir.normalize();

        // 给手雷一个初速度
        const speed = 18 + dist * 0.3;
        const velocity = dir.clone().multiplyScalar(speed);
        velocity.y = 8 + dist * 0.15; // 上抛分量

        // 创建手雷实体
        const grenade = {
            position: throwPos.clone(),
            velocity: velocity,
            velocityY: velocity.y,
            mesh: null,
            type: 'grenade',
            fuse: 2.5,
            damage: 80,
            radius: 8,
            team: this.team,
            owner: this,  // 投掷者引用（用于爆炸伤害归属）
            // 旋转状态（与玩家手雷一致的物理表现）
            rotation: new THREE.Vector3(0, 0, 0),
            angularVelocity: new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            ),
            isRolling: false,
        };

        // 手雷模型：橄榄形球体 + 顶部引信帽 + 安全销（与玩家手雷一致的外观）
        const grenadeGroup = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0x3a4a2a, metalness: 0.5, roughness: 0.6 })
        );
        body.scale.y = 1.3;
        grenadeGroup.add(body);
        const fuseCap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.03, 0.04, 6),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.4 })
        );
        fuseCap.position.y = 0.14;
        grenadeGroup.add(fuseCap);
        // 安全销（与玩家手雷一致的视觉细节）
        const safetyPin = new THREE.Mesh(
            new THREE.TorusGeometry(0.02, 0.003, 4, 6),
            new THREE.MeshStandardMaterial({ color: 0xcc4444, metalness: 0.8 })
        );
        safetyPin.position.set(0.03, 0.13, 0);
        safetyPin.rotation.y = Math.PI / 2;
        grenadeGroup.add(safetyPin);

        grenadeGroup.position.copy(grenade.position);
        this.scene.add(grenadeGroup);
        grenade.mesh = grenadeGroup;

        // 存储到场景中等待爆炸处理
        if (!this.scene.userData.grenades) {
            this.scene.userData.grenades = [];
        }
        this.scene.userData.grenades.push(grenade);
    }
}
