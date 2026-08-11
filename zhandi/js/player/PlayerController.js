import * as THREE from 'three';
import { CONFIG } from '../config.js?v=20260811.1';

// 玩家控制器 - 第一人称移动、视角、姿态控制
export class PlayerController {
    constructor(camera, world, input) {
        this.camera = camera;
        this.world = world;
        this.input = input;

        // 位置和速度
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.pitch = 0;

        // 姿态状态
        this.stance = 'stand';   // stand, crouch, prone
        this.isSprinting = false;
        this.onGround = true;
        this.currentHeight = CONFIG.PLAYER.height;

        // 移动状态
        this.moveSpeed = 0;
        this.isMoving = false;

        // 体力系统
        this.stamina = CONFIG.PLAYER.maxStamina;
        this.staminaRegenTimer = 0;
        this.isExhausted = false;

        // 侧身
        this.leanAmount = 0;
        this.currentLean = 0;

        // 脚步声计时
        this.footstepTimer = 0;

        // 后坐力
        this.recoilPitch = 0;
        this.recoilYaw = 0;

        // 生命体征
        this.health = CONFIG.PLAYER.maxHealth;
        this.armor = CONFIG.PLAYER.maxArmor;
        this.alive = true;
        this.team = 0;

        // 重生保护
        this.spawnProtection = 0;

        // 冲刺到射击过渡
        this.sprintFireCooldown = 0;

        // 复活
        this.respawnTimer = 0;

        // 载具
        this.inVehicle = null;
        this.vehicleSeat = 0;
        this.vehicleThirdPerson = false;
        this._vehicleCamPos = new THREE.Vector3();
        this._vehicleFpCamPos = new THREE.Vector3();
        this._vehicleLookYaw = 0;
        this._vehicleLookPitch = 0;
        this._vehicleCamSnap = false;
        this._vehicleFpCamSnap = false;
        this._seatEyePos = new THREE.Vector3();
        this._vehicleLookTarget = new THREE.Vector3();
        this._vehicleCamTarget = new THREE.Vector3();
        this._tmpCamProbe = new THREE.Vector3();
        this._tmpPlayerProbe = new THREE.Vector3();
        this._tmpPlayerResolveX = new THREE.Vector3();
        this._tmpPlayerResolveZ = new THREE.Vector3();
        this._tmpPlayerResolveY = new THREE.Vector3();
        this._tmpPlayerResolveResult = new THREE.Vector3();
        // 移动热路径复用向量（避免每帧 new/clone 造成 GC 压力）
        this._tmpMoveVelocity = new THREE.Vector3();
        this._tmpMoveNewPos = new THREE.Vector3();
        this._tmpMoveOldFeet = new THREE.Vector3();
        this._tmpMoveNewFeet = new THREE.Vector3();
        // 相机侧身/倒地偏移复用向量
        this._tmpLeanRight = new THREE.Vector3();
        this._tmpLeanBack = new THREE.Vector3();
        this._tmpLeanBase = new THREE.Vector3();
        this._vaultStartPos = new THREE.Vector3();
        this._vaultEndPos = new THREE.Vector3();
        this._vaultTempPos = new THREE.Vector3();
        this._vaultGlassOrigin = new THREE.Vector3();
        this._vaultGlassDirection = new THREE.Vector3();
        this._vaultTargetHeight = 0;
        this._vaultTimer = 0;
        this._vaultDuration = 0;
        this._vaulting = false;
        this._vaultCooldown = 0;

        // 攀爬（战地5动作系统：翻越高墙 1.45-2.5m，慢速拉身翻越）
        this._climbing = false;
        this._climbStartPos = new THREE.Vector3();
        this._climbEndPos = new THREE.Vector3();
        this._climbTempPos = new THREE.Vector3();
        this._climbTargetHeight = 0;
        this._climbTimer = 0;
        this._climbDuration = 0;
        this._climbCooldown = 0;

        // 拖拽倒地队友（战地5动作系统：将倒地队友拖到掩体后救援）
        this._draggingBot = null;     // 当前正在拖拽的倒地 bot
        this._dragSpeedFactor = 0.55; // 拖拽时移动速度倍率

        // 滞空
        this.airTime = 0;
        this.isParachuting = false;
        this._parachuteMesh = null;
        this._parachuteVisualParent = null;
        this._parachuteVelocity = new THREE.Vector3();

        // 死亡回调
        this.onDeath = null;
        this.onLoudNoise = null;
        this.lastAttacker = null;
        this.deathNotified = false;

        // 受击方向记录
        this.lastHitDirection = 0;
        this.lastHitTime = 0;

        // 压制值
        this.suppression = 0;
        this.isHoldingBreath = false;

        // 兵种与技能
        this.classType = null;
        this.classConfig = null;
        this.captureWeight = 1;
        this.gadgetCooldown = 0;
        this.gadgetMaxCooldown = 0;
        this.autoRegenTimer = 0;

        // 倒地状态
        this.downed = false;           // 是否倒地（区别于彻底死亡）
        this.bleedOutTimer = 0;        // 倒地流血计时
        this.reviveProgress = 0;       // 被复活进度 0-1
        this.skipHoldTimer = 0;        // 长按空格累计
        this.onDowned = null;          // 倒地回调（区别于 onDeath）
    }

    spawn(position, classConfig) {
        this.position.copy(position);
        this.velocity.set(0, 0, 0);
        this.yaw = 0;
        this.pitch = 0;
        this.stance = 'stand';
        this.isSprinting = false;
        this.onGround = true;
        this.currentHeight = CONFIG.PLAYER.height;
        const spawnClassType = this.classType;
        const runtimeClassConfig = classConfig || this.classConfig || {};
        this.applyClassConfig(spawnClassType, runtimeClassConfig);
        this.alive = true;
        this.inVehicle = null;
        this.inStaticGun = null;
        this.vehicleSeat = 0;
        this.vehicleThirdPerson = false;
        this.deathNotified = false;
        this.lastAttacker = null;
        this.stamina = CONFIG.PLAYER.maxStamina;
        this.staminaRegenTimer = 0;
        this.isExhausted = false;
        this.leanAmount = 0;
        this.currentLean = 0;
        this.spawnProtection = CONFIG.PLAYER.spawnProtectionTime;
        this.sprintFireCooldown = 0;
        this.suppression = 0;
        this.isHoldingBreath = false;
        this.downed = false;
        this.bleedOutTimer = 0;
        this.reviveProgress = 0;
        this.skipHoldTimer = 0;
        this._downedCamProgress = 0;
        this._executionLock = false;
        this._meleeLock = false;
        this._banzaiCharge = false;
        this._aircraftViewEverInited = undefined;
        this._planeFpActive = false;
        this._stopParachute();
        this._stopVault();
        this._stopClimb();
        this._stopDrag();

        const groundY = this.world.getHeight(position.x, position.z);
        this.position.y = groundY + this.currentHeight;
        this._updateCamera();
    }

    setClass(classType, classConfig) {
        this.applyClassConfig(classType, classConfig, { preserveVitals: true });
        this.gadgetCooldown = 0;
    }

    applyClassConfig(classType, classConfig, { preserveVitals = false } = {}) {
        const runtimeConfig = { ...(classConfig || {}) };
        this.classType = classType;
        this.classConfig = runtimeConfig;

        this.maxHealth = runtimeConfig.maxHealth || CONFIG.PLAYER.maxHealth;
        this.maxArmor = runtimeConfig.maxArmor || CONFIG.PLAYER.maxArmor;

        const configuredCaptureWeight = Number(runtimeConfig.captureWeight);
        this.captureWeight = Number.isFinite(configuredCaptureWeight) && configuredCaptureWeight
            ? configuredCaptureWeight
            : 1;

        const gadgetConfig = CONFIG.GADGETS[runtimeConfig.gadget];
        this.gadgetMaxCooldown = Number.isFinite(gadgetConfig?.cooldown) ? gadgetConfig.cooldown : 0;
        if (this.gadgetCooldown > this.gadgetMaxCooldown) {
            this.gadgetCooldown = this.gadgetMaxCooldown;
        }

        if (preserveVitals) {
            if (Number.isFinite(this.health)) this.health = Math.min(this.health, this.maxHealth);
            if (Number.isFinite(this.armor)) this.armor = Math.min(this.armor, this.maxArmor);
        } else {
            this.health = this.maxHealth;
            this.armor = this.maxArmor;
        }

        return this.classConfig;
    }

    updateClassPassive(dt) {
        if (!this.alive || !this.classConfig) return;

        if (this.gadgetCooldown > 0) {
            this.gadgetCooldown -= dt;
        }

        if (this.classConfig.autoRegen && this.health < this.maxHealth) {
            if (this.health < this.maxHealth * 0.5) {
                this.autoRegenTimer += dt;
                if (this.autoRegenTimer > 1.0) {
                    this.autoRegenTimer = 0;
                    this.health = Math.min(this.health + 5, this.maxHealth * 0.6);
                }
            }
        }
    }

    // 镜头震动（trauma 模型：震动强度 = trauma²，随时间衰减）
    addShake(amount) {
        this._shakeTrauma = Math.min(1, (this._shakeTrauma || 0) + amount);
    }

    _applyCameraShake(dt) {
        if (!this._shakeTrauma || this._shakeTrauma <= 0) return;
        this._shakeTime = (this._shakeTime || 0) + dt;
        const t = this._shakeTime;
        const s = this._shakeTrauma * this._shakeTrauma;
        const maxAngle = 0.05;
        this.camera.rotation.x += s * maxAngle * (Math.sin(t * 47.3) * 0.6 + Math.sin(t * 89.7) * 0.4);
        this.camera.rotation.y += s * maxAngle * (Math.sin(t * 39.1 + 1.7) * 0.6 + Math.sin(t * 77.3 + 0.4) * 0.4);
        this.camera.rotation.z += s * maxAngle * 0.7 * Math.sin(t * 61.9 + 3.1);
        this._shakeTrauma = Math.max(0, this._shakeTrauma - dt * 1.5);
    }

    update(dt, weaponSystem) {
        const wasGround = this.onGround;
        const prevAir = this.airTime;
        this._updateInner(dt, weaponSystem);

        // 落地检测：高处落下时镜头下沉 + 轻微震动
        if (!wasGround && this.onGround && prevAir > 0.25 && !this.inVehicle) {
            this._landDipVel = (this._landDipVel || 0) + Math.min(prevAir * 0.35, 0.45) * 3;
            if (prevAir > 0.7) this.addShake(Math.min(0.25, prevAir * 0.15));
        }
        // 落地下沉弹簧回弹
        if (this._landDip || this._landDipVel) {
            this._landDip = (this._landDip || 0) + (this._landDipVel || 0) * dt;
            this._landDipVel = (this._landDipVel || 0) - (this._landDip * 90 + this._landDipVel * 12) * dt;
            if (Math.abs(this._landDip) < 0.001 && Math.abs(this._landDipVel) < 0.01) {
                this._landDip = 0;
                this._landDipVel = 0;
            }
            this.camera.position.y -= Math.max(0, this._landDip);
        }

        this._applyCameraShake(dt);
    }

    _updateInner(dt, weaponSystem) {
        // 倒地状态：贴地视角 + 可环顾，不可移动/开火
        if (this.downed) {
            this.bleedOutTimer -= dt;
            // 倒地过程插值（0→1），进入时逐渐躺下
            this._downedCamProgress = Math.min(1, (this._downedCamProgress || 0) + dt * 2.2);
            // 倒地时仍允许视角环顾（寻找来救援的队友），但俯仰收窄
            this._updateLook(dt, weaponSystem);
            // 躺地俯仰限制：不能大幅抬头/低头
            const maxPitch = THREE.MathUtils.lerp(1.3, 0.55, this._downedCamProgress);
            const minPitch = THREE.MathUtils.lerp(-1.4, -0.35, this._downedCamProgress);
            this.pitch = THREE.MathUtils.clamp(this.pitch, minPitch, maxPitch);
            this._updateCamera();
            // 隐藏第一人称武器（躺地时枪已掉落）
            if (weaponSystem?.weaponGroup) weaponSystem.weaponGroup.visible = false;
            return;
        }
        if (!this.alive) {
            this.respawnTimer -= dt;
            return;
        }

        if (this.spawnProtection > 0) {
            this.spawnProtection -= dt;
        }

        if (this.sprintFireCooldown > 0) {
            this.sprintFireCooldown -= dt;
        }

        this.suppression = Math.max(0, this.suppression - dt * 0.9);
        this.updateClassPassive(dt);

        if (this.inVehicle) {
            this._updateVehicleMode(dt, weaponSystem);
            return;
        }

        // 迫击炮地图选点模式：锁定移动与视角（玩家在操作迫击炮）
        if (this._mortarLock) {
            this.velocity.set(0, 0, 0);
            this.isMoving = false;
            this.isSprinting = false;
            if (weaponSystem?.weaponGroup) weaponSystem.weaponGroup.visible = false;
            return;
        }

        // 固定防空炮炮手模式：视角由玩家标准 look 驱动（防空炮炮塔跟随 player.yaw/pitch），
        // 位置/相机由 Game 接管。复用 _updateLook 保证鼠标控制手感与平时一致。
        if (this.inStaticGun) {
            this.velocity.set(0, 0, 0);
            this.isMoving = false;
            this.isSprinting = false;
            if (weaponSystem?.weaponGroup) weaponSystem.weaponGroup.visible = false;
            this._updateLook(dt, weaponSystem);
            return;
        }

        if (this._vaultCooldown > 0) {
            this._vaultCooldown = Math.max(0, this._vaultCooldown - dt);
        }
        if (this._vaulting) {
            this._updateVault(dt);
            this._updateLook(dt, weaponSystem);
            this._updateLean(dt);
            this._updateCamera();
            return;
        }
        if (this._climbCooldown > 0) {
            this._climbCooldown = Math.max(0, this._climbCooldown - dt);
        }
        if (this._climbing) {
            this._updateClimb(dt);
            this._updateLook(dt, weaponSystem);
            this._updateLean(dt);
            this._updateCamera();
            return;
        }

        this._updateBreathHold(weaponSystem);
        this._updateStamina(dt);
        this._updateStance(dt);
        this._updateMovement(dt);
        if (!this.alive) return;
        this._updateLook(dt, weaponSystem);
        this._updateLean(dt);
        this._updateFootsteps(dt);
        this._updateCamera();
    }

    _updateStamina(dt) {
        if (this.isHoldingBreath) {
            const holdBonus = this.classConfig?.holdBreathBonus || 1;
            this.stamina -= CONFIG.PLAYER.staminaDrainRate * (0.45 / holdBonus) * dt;
            this.staminaRegenTimer = 1.0;
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.isExhausted = true;
                this.isHoldingBreath = false;
            }
            return;
        }

        if (this.isSprinting && this.moveSpeed > 0.5) {
            const discount = this.classConfig?.staminaDiscount || 0;
            this.stamina -= CONFIG.PLAYER.staminaDrainRate * (1 - discount) * dt;
            this.staminaRegenTimer = CONFIG.PLAYER.staminaRegenDelay;
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.isExhausted = true;
            }
        } else {
            if (this.staminaRegenTimer > 0) {
                this.staminaRegenTimer -= dt;
            } else {
                this.stamina += CONFIG.PLAYER.staminaRegenRate * dt;
                if (this.stamina >= CONFIG.PLAYER.maxStamina) {
                    this.stamina = CONFIG.PLAYER.maxStamina;
                }
                if (this.isExhausted && this.stamina >= CONFIG.PLAYER.minSprintStamina * 2) {
                    this.isExhausted = false;
                }
            }
        }
    }

    _updateBreathHold(weaponSystem) {
        const canHold = weaponSystem &&
            weaponSystem.canHoldBreath &&
            weaponSystem.canHoldBreath() &&
            weaponSystem.isAiming;
        this.isHoldingBreath = !!(canHold &&
            this.input.isKeyDown('ShiftLeft') &&
            !this.isExhausted &&
            this.stamina > 5 &&
            !this.isSprinting &&
            this.onGround);
    }

    _updateMovement(dt) {
        if (this.isParachuting) {
            this._updateParachuteMovement(dt);
            return;
        }

        const input = this.input;

        let speed = CONFIG.PLAYER.walkSpeed;
        this.isSprinting = false;

        // 刺雷冲锋：强制朝准心方向高速冲刺，无视玩家输入（战地5刺雷冲锋）
        if (this._banzaiCharge) {
            const dir = this._banzaiDir;
            this.isMoving = true;
            this.isSprinting = true;
            const targetVelocity = this._tmpMoveVelocity.set(dir.x * this._banzaiSpeed, 0, dir.z * this._banzaiSpeed);
            const accel = 60;
            const accelFactor = 1 - Math.exp(-accel * dt);
            this.velocity.x += (targetVelocity.x - this.velocity.x) * accelFactor;
            this.velocity.z += (targetVelocity.z - this.velocity.z) * accelFactor;
            this.moveSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);

            // 沿地面前冲（贴地 + 水平碰撞）
            const targetHeight = this._getStanceHeight();
            this._tmpMoveOldFeet.copy(this.position);
            this._tmpMoveOldFeet.y -= targetHeight;
            const oldFeet = this._tmpMoveOldFeet;
            const newFeet = this._tmpMoveNewFeet.copy(this.position);
            newFeet.x += this.velocity.x * dt;
            newFeet.z += this.velocity.z * dt;
            newFeet.y -= targetHeight;
            const groundY = this._getSupportGroundY(newFeet.x, newFeet.z, targetHeight, oldFeet, newFeet.y);
            newFeet.y = Math.min(newFeet.y, groundY);
            const resolved = this.world.resolveCharacterMovement
                ? this.world.resolveCharacterMovement(oldFeet, newFeet, CONFIG.PLAYER.radius, targetHeight)
                : this.world.resolveMovement(oldFeet, newFeet, CONFIG.PLAYER.radius, targetHeight);
            this.position.set(resolved.x, resolved.y + targetHeight, resolved.z);
            this.onGround = true;
            return;
        }

        // 处决动作期间锁定移动
        if (this._executionLock) {
            this.velocity.x = 0;
            this.velocity.z = 0;
            this.isMoving = false;
            return;
        }

        // 近战挥砍期间减速（仍可微调走位）
        if (this._meleeLock) {
            // 允许轻微移动，但禁止冲刺
        }

        // 拖拽倒地队友时禁止冲刺（双手被占用）
        const isDragging = !!this._draggingBot;

        if (this.stance === 'crouch') {
            speed = CONFIG.PLAYER.crouchSpeed;
        } else if (this.stance === 'prone') {
            speed = CONFIG.PLAYER.proneSpeed;
        } else if (input.isKeyDown('ShiftLeft') && !input.isMouseDown(2) && !isDragging) {
            if (!this.isExhausted && this.stamina > CONFIG.PLAYER.minSprintStamina && !this._meleeLock) {
                speed = CONFIG.PLAYER.sprintSpeed;
                this.isSprinting = true;
            }
        }

        if (this._meleeLock) {
            speed *= 0.45;
        }

        if (this.suppression > 0.3) {
            speed *= (1 - this.suppression * 0.3);
        }

        // 拖拽时整体减速（战地5：拖拽重负，移动缓慢）
        if (isDragging) {
            speed *= this._dragSpeedFactor;
        }

        // 深水：减速 + 持续掉血（诺曼底/硫磺岛）
        const inWater = this.world.isUnderwater?.(this.position.x, this.position.z);
        if (inWater) {
            speed *= 0.45;
            this.isSprinting = false;
            this._waterDmgTimer = (this._waterDmgTimer || 0) + dt;
            if (this._waterDmgTimer >= 1.0) {
                this._waterDmgTimer = 0;
                // 直接扣血，不走护甲（溺水）
                if (this.alive && !this.downed) {
                    this.health = Math.max(0, this.health - 8);
                    if (this.health <= 0) this._enterDownedState(null);
                }
            }
        } else {
            this._waterDmgTimer = 0;
        }

        let moveX = 0, moveZ = 0;
        if (input.isKeyDown('KeyW')) moveZ -= 1;
        if (input.isKeyDown('KeyS')) moveZ += 1;
        if (input.isKeyDown('KeyA')) moveX -= 1;
        if (input.isKeyDown('KeyD')) moveX += 1;

        this.isMoving = (moveX !== 0 || moveZ !== 0);

        const targetVelocity = this._tmpMoveVelocity.set(0, 0, 0);
        if (this.isMoving) {
            const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= len;
            moveZ /= len;

            if (this.isSprinting && moveZ < -0.5) {
                moveZ = -1;
                // 允许冲刺时对角线移动（保留侧向输入但减半，手感更自然）
                moveX *= 0.5;
            }

            const cos = Math.cos(this.yaw);
            const sin = Math.sin(this.yaw);
            const worldX = moveX * cos + moveZ * sin;
            const worldZ = moveZ * cos - moveX * sin;

            targetVelocity.x = worldX * speed;
            targetVelocity.z = worldZ * speed;

            if (this.isSprinting && this.sprintFireCooldown <= 0) {
                this.sprintFireCooldown = -1;
            }
        } else {
            if (this.sprintFireCooldown < 0) {
                this.sprintFireCooldown = CONFIG.PLAYER.sprintToFireDelay;
            }
        }

        const accel = this.onGround ? 28 : 8;
        const accelFactor = 1 - Math.exp(-accel * dt);
        if (this.isMoving) {
            this.velocity.x += (targetVelocity.x - this.velocity.x) * accelFactor;
            this.velocity.z += (targetVelocity.z - this.velocity.z) * accelFactor;
        } else {
            const friction = this.onGround ? 16 : 2.5;
            const drag = Math.exp(-friction * dt);
            this.velocity.x *= drag;
            this.velocity.z *= drag;
            if (Math.abs(this.velocity.x) < 0.02) this.velocity.x = 0;
            if (Math.abs(this.velocity.z) < 0.02) this.velocity.z = 0;
        }

        this.moveSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);

        if (!this.onGround) {
            this.velocity.y -= CONFIG.PLAYER.gravity * dt;
            this.airTime += dt;
        }

        if (input.isKeyDown('Space') && this.onGround && this.stance === 'stand') {
            if (this._tryStartVault()) {
                return;
            }
            // 翻越失败 → 尝试攀爬（更高的墙 1.45-2.5m）
            if (this._tryStartClimb()) {
                return;
            }
            // 都失败 → 普通跳跃
            this.velocity.y = CONFIG.PLAYER.jumpForce;
            this.onGround = false;
            this.airTime = 0;
        }

        const newPos = this._tmpMoveNewPos.copy(this.position);
        newPos.x += this.velocity.x * dt;
        newPos.y += this.velocity.y * dt;
        newPos.z += this.velocity.z * dt;

        const targetHeight = this._getStanceHeight();
        const oldFeetY = this.position.y - targetHeight;
        const newFeetY = newPos.y - targetHeight;
        const groundY = this._getSupportGroundY(newPos.x, newPos.z, targetHeight, oldFeetY, newFeetY);
        if (this.velocity.y <= 0 && newFeetY <= groundY + 0.08) {
            const landingSpeed = this.velocity.y;
            newPos.y = groundY + targetHeight;
            this.velocity.y = 0;
            if (!this.onGround) {
                this._handleLanding(landingSpeed);
            }
            this.onGround = true;
            this.airTime = 0;
        } else {
            this.onGround = false;
        }

        const halfSize = CONFIG.WORLD.size / 2 - 2;
        newPos.x = THREE.MathUtils.clamp(newPos.x, -halfSize, halfSize);
        newPos.z = THREE.MathUtils.clamp(newPos.z, -halfSize, halfSize);

        const collisionHeight = targetHeight;
        const oldFeet = this._tmpMoveOldFeet.copy(this.position);
        oldFeet.y -= collisionHeight;
        const newFeet = this._tmpMoveNewFeet.copy(newPos);
        newFeet.y -= collisionHeight;
        const resolvedFeet = this._resolvePlayerMovement(oldFeet, newFeet, collisionHeight);
        this.position.set(resolvedFeet.x, resolvedFeet.y + collisionHeight, resolvedFeet.z);

        if (Math.abs(resolvedFeet.x - newFeet.x) > 0.001) this.velocity.x = 0;
        if (Math.abs(resolvedFeet.z - newFeet.z) > 0.001) this.velocity.z = 0;
        if (resolvedFeet.y !== newFeet.y && this.velocity.y > 0) {
            this.velocity.y = 0;
        }
        if (this.velocity.y <= 0) {
            const correctedGround = this._getSupportGroundY(this.position.x, this.position.z, collisionHeight, oldFeet.y, this.position.y - collisionHeight);
            if (this.position.y <= correctedGround + collisionHeight + 0.08) {
                this.position.y = correctedGround + collisionHeight;
                this.onGround = true;
            }
        }
        this._recoverFromOverlap(collisionHeight);
    }

    _tryStartVault() {
        if (this._vaulting || this._vaultCooldown > 0) return false;
        if (!this.input.isKeyDown('KeyW')) return false;

        const radius = this._getCollisionRadius('stand');
        const height = this._getStanceHeight('stand');
        const feetY = this.position.y - height;
        const forwardX = -Math.sin(this.yaw);
        const forwardZ = -Math.cos(this.yaw);
        const probe = this._vaultTempPos;
        const hitOffsets = [0.42, 0.68, 0.94, 1.2, 1.46];

        let vaultTopY = null;
        let vaultKind = 'prop';
        let hitDist = 0;
        let landingFeet = null;
        for (const dist of hitOffsets) {
            probe.set(
                this.position.x + forwardX * dist,
                feetY + 0.1,
                this.position.z + forwardZ * dist
            );
            if (!this._checkWorldCollision(probe, radius, height)) continue;

            const lowSupport = this.world.getSupportSurfaceInfo
                ? this.world.getSupportSurfaceInfo(probe, radius, feetY - 0.1, feetY + 1.8)
                : null;

            const buildingPart = lowSupport?.part || '';
            // 允许翻越的 building 部件：仅低矮装饰件（窗框/门楣/低台阶等）
            // 排除楼梯、二楼隔墙、护栏、二楼地板边缘等，防止从二楼翻越穿模掉到一楼
            const isVaultableBuildingPart = lowSupport?.kind === 'building' &&
                /frame|sill|lintel|door_frame/i.test(buildingPart) &&
                !/stairs|floor2|partition|railing|rim|slab/i.test(buildingPart);
            if (lowSupport && typeof lowSupport.y === 'number' && (lowSupport.kind !== 'building' || isVaultableBuildingPart)) {
                const vaultHeight = lowSupport.y - feetY;
                if (vaultHeight >= 0.35 && vaultHeight <= 1.45) {
                    vaultTopY = lowSupport.y;
                    vaultKind = isVaultableBuildingPart ? 'window' : (lowSupport.kind || 'prop');
                    hitDist = dist;
                    break;
                }
            }
        }

        if (vaultTopY === null) return false;

        if (!landingFeet) {
            const landingDistances = [1.2, 1.5, 1.8, 2.1, 2.4, 2.7];
            landingFeet = this._vaultEndPos;
            let landingFound = false;
            for (const dist of landingDistances) {
                landingFeet.set(
                    this.position.x + forwardX * (hitDist + dist),
                    feetY,
                    this.position.z + forwardZ * (hitDist + dist)
                );
                const landingGround = this._getSupportGroundY(
                    landingFeet.x,
                    landingFeet.z,
                    height,
                    vaultTopY,
                    vaultTopY - 0.08
                );
                const landingGap = vaultKind === 'building' ? 4.8 : vaultKind === 'window' ? 3.4 : 1.9;
                if (landingGround < vaultTopY - landingGap) continue;
                if (vaultKind !== 'building' && landingGround > vaultTopY + 0.35) continue;
                landingFeet.y = landingGround;
                if (!this._checkWorldCollision(landingFeet, radius, height)) {
                    landingFound = true;
                    break;
                }
            }
            if (!landingFound) landingFeet = null;
        }

        if (!landingFeet || this._checkWorldCollision(landingFeet, radius, height)) {
            return false;
        }

        this._vaultStartPos.copy(this.position);
        this._vaultEndPos.set(landingFeet.x, landingFeet.y + height, landingFeet.z);
        this._vaultTargetHeight = vaultTopY;
        this._vaultTimer = 0;
        this._vaultDuration = THREE.MathUtils.clamp(0.42 + (vaultTopY - feetY) * 0.08, 0.42, 0.95);
        if (vaultKind === 'building') {
            this._vaultDuration = THREE.MathUtils.clamp(0.55 + (vaultTopY - feetY) * 0.1, 0.55, 1.1);
        }
        if (vaultKind === 'window') {
            this._breakGlassForVault(forwardX, forwardZ, hitDist + 1.2);
        }
        this.velocity.set(0, 0, 0);
        this.onGround = false;
        this.airTime = 0;
        this._vaulting = true;
        return true;
    }

    _breakGlassForVault(forwardX, forwardZ, maxDistance = 2.4) {
        if (!this.world?.findBreakableGlassNear) return false;

        const height = this._getStanceHeight('stand');
        const feetY = this.position.y - height;
        const origins = [
            feetY + 1.35,
            feetY + 1.15,
            feetY + 1.55,
        ];
        this._vaultGlassDirection.set(forwardX, 0, forwardZ).normalize();

        for (const y of origins) {
            this._vaultGlassOrigin.set(this.position.x, y, this.position.z);
            const hit = this.world.findBreakableGlassNear(
                this._vaultGlassOrigin,
                this._vaultGlassDirection,
                Math.max(1.4, maxDistance)
            );
            if (!hit?.mesh) continue;
            if (!this.world.breakGlass(hit.mesh, hit.point)) continue;

            if (this.audio?.playGlassBreak) {
                this.audio.playGlassBreak(hit.point, 1);
            }
            if (this.onLoudNoise) {
                this.onLoudNoise(hit.point.clone ? hit.point.clone() : hit.point, 'glass');
            }
            return true;
        }
        return false;
    }

    _updateVault(dt) {
        if (!this._vaulting) return;
        this._vaultTimer += dt;
        const t = Math.min(1, this._vaultTimer / this._vaultDuration);
        const eased = t * t * (3 - 2 * t);
        this.position.lerpVectors(this._vaultStartPos, this._vaultEndPos, eased);
        const arc = Math.sin(Math.PI * t) * Math.max(0.18, (this._vaultTargetHeight - (this._vaultStartPos.y - this._getStanceHeight('stand'))) * 0.35);
        this.position.y += arc;
        this.velocity.set(0, 0, 0);
        this.onGround = false;
        if (t >= 1) {
            this.position.copy(this._vaultEndPos);
            this.onGround = true;
            this._vaulting = false;
            this._vaultCooldown = 0.2;
        }
    }

    _stopVault() {
        this._vaulting = false;
        this._vaultTimer = 0;
        this._vaultDuration = 0;
        this._vaultCooldown = 0;
    }

    // === 攀爬系统（战地5动作增强）===
    // 与翻越的区别：翻越处理 0.35-1.45m 的低矮障碍（快速撑越）；
    // 攀爬处理 1.45-2.5m 的高墙/箱体（慢速拉身翻过），耗时更长，作为翻越失败后的兜底动作
    _tryStartClimb() {
        if (this._climbing || this._climbCooldown > 0) return false;
        if (!this.input.isKeyDown('KeyW')) return false;
        // 攀爬消耗体力：体力不足则无法攀爬（避免战斗中滥用）
        if (this.stamina < 15) return false;

        const radius = this._getCollisionRadius('stand');
        const height = this._getStanceHeight('stand');
        const feetY = this.position.y - height;
        const forwardX = -Math.sin(this.yaw);
        const forwardZ = -Math.cos(this.yaw);
        const probe = this._climbTempPos;

        // 由近到远探测障碍顶部，寻找 1.45-2.5m 之间的可攀爬表面
        const hitOffsets = [0.45, 0.7, 0.95, 1.2];
        let climbTopY = null;
        let hitDist = 0;
        let landingFeet = null;

        for (const dist of hitOffsets) {
            probe.set(
                this.position.x + forwardX * dist,
                feetY + 0.1,
                this.position.z + forwardZ * dist
            );
            if (!this._checkWorldCollision(probe, radius, height)) continue;

            // 探测支撑面（含建筑墙体顶部、箱体顶部）
            const support = this.world.getSupportSurfaceInfo
                ? this.world.getSupportSurfaceInfo(probe, radius, feetY - 0.1, feetY + 3.0)
                : null;
            if (!support || typeof support.y !== 'number') continue;

            const climbHeight = support.y - feetY;
            // 攀爬高度区间：高于翻越上限(1.45m)，低于玩家可触及上限(2.5m)
            if (climbHeight >= 1.45 && climbHeight <= 2.5) {
                climbTopY = support.y;
                hitDist = dist;
                break;
            }
        }

        if (climbTopY === null) return false;

        // 寻找落点：墙顶另一侧
        const landingDistances = [0.9, 1.2, 1.5, 1.8, 2.1];
        landingFeet = this._climbEndPos;
        let landingFound = false;
        for (const dist of landingDistances) {
            landingFeet.set(
                this.position.x + forwardX * (hitDist + dist),
                feetY,
                this.position.z + forwardZ * (hitDist + dist)
            );
            const landingGround = this._getSupportGroundY(
                landingFeet.x,
                landingFeet.z,
                height,
                climbTopY,
                climbTopY - 0.08
            );
            // 落点不能比墙顶高太多（否则只是另一面更高的墙）
            if (landingGround > climbTopY + 0.3) continue;
            landingFeet.y = landingGround;
            if (!this._checkWorldCollision(landingFeet, radius, height)) {
                landingFound = true;
                break;
            }
        }
        if (!landingFound || this._checkWorldCollision(landingFeet, radius, height)) {
            return false;
        }

        // 启动攀爬
        this._climbStartPos.copy(this.position);
        this._climbEndPos.set(landingFeet.x, landingFeet.y + height, landingFeet.z);
        this._climbTargetHeight = climbTopY;
        this._climbTimer = 0;
        // 攀爬耗时：基础 0.9s + 高度系数，比翻越慢
        this._climbDuration = THREE.MathUtils.clamp(0.9 + (climbTopY - feetY) * 0.18, 0.95, 1.6);
        this.velocity.set(0, 0, 0);
        this.onGround = false;
        this.airTime = 0;
        this._climbing = true;
        // 消耗体力
        this.stamina = Math.max(0, this.stamina - 15);
        this.staminaRegenTimer = CONFIG.PLAYER.staminaRegenDelay;
        return true;
    }

    _updateClimb(dt) {
        if (!this._climbing) return;
        this._climbTimer += dt;
        const t = Math.min(1, this._climbTimer / this._climbDuration);
        // 攀爬分两阶段：前 65% 拉身上墙（位置上升），后 35% 翻过落地
        const eased = t * t * (3 - 2 * t);
        this.position.lerpVectors(this._climbStartPos, this._climbEndPos, eased);
        // 攀爬弧线：比翻越更高更慢，模拟双手撑墙拉身
        const feetStartY = this._climbStartPos.y - this._getStanceHeight('stand');
        const climbHeight = this._climbTargetHeight - feetStartY;
        const arc = Math.sin(Math.PI * t) * Math.max(0.35, climbHeight * 0.55);
        this.position.y += arc;
        this.velocity.set(0, 0, 0);
        this.onGround = false;
        if (t >= 1) {
            this.position.copy(this._climbEndPos);
            this.onGround = true;
            this._climbing = false;
            this._climbCooldown = 0.35;
        }
    }

    _stopClimb() {
        this._climbing = false;
        this._climbTimer = 0;
        this._climbDuration = 0;
        this._climbCooldown = 0;
    }

    // === 拖拽倒地队友（战地5动作增强）===
    _startDrag(bot) {
        if (!bot || this._draggingBot) return false;
        this._draggingBot = bot;
        bot._beingDragged = true;
        return true;
    }

    _stopDrag() {
        if (this._draggingBot) {
            this._draggingBot._beingDragged = false;
            this._draggingBot = null;
        }
    }

    isDragging() {
        return !!this._draggingBot;
    }

    _handleLanding(landingSpeed) {
        const impactSpeed = Math.abs(Math.min(landingSpeed, 0));
        if (impactSpeed < 13 || this.spawnProtection > 0) return;

        const damage = Math.min(85, (impactSpeed - 12) * 6);
        if (damage > 0) {
            this.takeDamage(damage, null);
        }
    }

    _updateParachuteMovement(dt) {
        const input = this.input;
        const steerSpeed = 3.2;
        let moveX = 0, moveZ = 0;
        if (input.isKeyDown('KeyW')) moveZ -= 1;
        if (input.isKeyDown('KeyS')) moveZ += 1;
        if (input.isKeyDown('KeyA')) moveX -= 1;
        if (input.isKeyDown('KeyD')) moveX += 1;

        if (moveX !== 0 || moveZ !== 0) {
            const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= len;
            moveZ /= len;
            const cos = Math.cos(this.yaw);
            const sin = Math.sin(this.yaw);
            this._parachuteVelocity.x = (moveX * cos + moveZ * sin) * steerSpeed;
            this._parachuteVelocity.z = (moveZ * cos - moveX * sin) * steerSpeed;
        } else {
            this._parachuteVelocity.x *= Math.pow(0.82, dt * 60);
            this._parachuteVelocity.z *= Math.pow(0.82, dt * 60);
        }

        this.velocity.y = Math.max(this.velocity.y - CONFIG.PLAYER.gravity * 0.12 * dt, -3.4);
        this.onGround = false;
        this.airTime += dt;
        this.moveSpeed = Math.sqrt(
            this._parachuteVelocity.x * this._parachuteVelocity.x +
            this._parachuteVelocity.z * this._parachuteVelocity.z
        );

        const targetHeight = this._getStanceHeight();
        const newPos = this.position.clone();
        newPos.x += this._parachuteVelocity.x * dt;
        newPos.y += this.velocity.y * dt;
        newPos.z += this._parachuteVelocity.z * dt;

        const halfSize = CONFIG.WORLD.size / 2 - 2;
        newPos.x = THREE.MathUtils.clamp(newPos.x, -halfSize, halfSize);
        newPos.z = THREE.MathUtils.clamp(newPos.z, -halfSize, halfSize);

        const oldFeetY = this.position.y - targetHeight;
        const newFeetY = newPos.y - targetHeight;
        const groundY = this._getSupportGroundY(newPos.x, newPos.z, targetHeight, oldFeetY, newFeetY);
        if (this.velocity.y <= 0 && newFeetY <= groundY + 0.08) {
            newPos.y = groundY + targetHeight;
            this.velocity.y = 0;
            this._parachuteVelocity.set(0, 0, 0);
            this.onGround = true;
            this.airTime = 0;
            this._stopParachute();
        }

        const oldFeet = this.position.clone();
        oldFeet.y -= targetHeight;
        const newFeet = newPos.clone();
        newFeet.y -= targetHeight;
        const resolvedFeet = this.world.resolveCharacterMovement
            ? this.world.resolveCharacterMovement(oldFeet, newFeet, CONFIG.PLAYER.radius, targetHeight)
            : this.world.resolveMovement(oldFeet, newFeet, CONFIG.PLAYER.radius, targetHeight);
        this.position.set(resolvedFeet.x, resolvedFeet.y + targetHeight, resolvedFeet.z);
        this._recoverFromOverlap(targetHeight);
        this._updateParachuteMesh();
    }

    _getSupportGroundY(x, z, height, oldFeetY = null, newFeetY = null) {
        const terrainY = this.world.getHeight(x, z);
        if (!this.world.getSupportSurfaceInfo) return terrainY;

        const oldFeet = oldFeetY ?? terrainY;
        const newFeet = newFeetY ?? terrainY;
        // step-up：向上探测覆盖一级楼梯台阶（约 0.2m）并留余量，
        // 避免远处更高的台阶被 getSupportSurfaceInfo 当作支撑面导致跳级
        const stepProbeUp = 0.48;
        const probeToY = Math.max(newFeet, oldFeet + stepProbeUp);
        const probe = this._tmpPlayerProbe;
        probe.set(x, probeToY, z);
        const supportInfo = this.world.getSupportSurfaceInfo(
            probe,
            this._getCollisionRadius(),
            oldFeet,
            probeToY
        );
        if (!supportInfo || typeof supportInfo.y !== 'number') return terrainY;
        if (supportInfo.isRoof && oldFeet < supportInfo.y - 0.75 && newFeet < supportInfo.y - 0.75) {
            return terrainY;
        }
        // 支撑面不能比脚下高太多（楼梯台阶约 0.2m，允许连续上台）
        const maxStepUp = 0.55;
        if (supportInfo.y <= oldFeet + maxStepUp || oldFeet >= supportInfo.y - 0.35) {
            return Math.max(terrainY, supportInfo.y);
        }
        return terrainY;
    }

    _updateLook(dt, weaponSystem) {
        const mouseDelta = this.input.getMouseDelta();

        let recoilX = 0, recoilY = 0;
        if (weaponSystem) {
            const recoil = weaponSystem.consumeRecoil();
            recoilY = recoil.y;
            recoilX = recoil.x;
        }

        this.yaw -= mouseDelta.x;
        this.pitch -= mouseDelta.y;
        this.pitch += recoilY;
        this.yaw += recoilX;

        if (this.suppression > 0.2) {
            this.yaw += (Math.random() - 0.5) * this.suppression * 0.003;
            this.pitch += (Math.random() - 0.5) * this.suppression * 0.003;
        }

        this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);
        this.mouseDeltaX = mouseDelta.x;
        this.mouseDeltaY = mouseDelta.y;
    }

    _updateLean(dt) {
        const input = this.input;
        let targetLean = 0;

        // 拖拽倒地队友时禁用侧身（双手被占用，KeyE 用于拖拽切换）
        if (!this.isSprinting && this.stance !== 'prone' && !this._draggingBot) {
            if (input.isKeyDown('KeyQ')) targetLean = -1;
            if (input.isKeyDown('KeyE')) targetLean = 1;
        }

        this.leanAmount = THREE.MathUtils.lerp(this.leanAmount, targetLean, dt * CONFIG.PLAYER.leanSpeed);
        this.currentLean = this.leanAmount * CONFIG.PLAYER.leanAngle;
    }

    _updateStance(dt) {
        const input = this.input;
        let desiredStance = 'stand';
        if (input.isKeyDown('KeyZ')) {
            desiredStance = 'prone';
        } else if (input.isKeyDown('ControlLeft')) {
            desiredStance = 'crouch';
        }

        const oldStance = this.stance;
        const oldHeight = this._getStanceHeight(oldStance);
        const desiredHeight = this._getStanceHeight(desiredStance);
        if (this._canFitStance(desiredHeight, desiredStance)) {
            this.stance = desiredStance;
            if (this.onGround && this.stance !== oldStance) {
                const feetY = this.position.y - oldHeight;
                this.position.y = feetY + desiredHeight;
            }
        }

        const targetHeight = this._getStanceHeight();
        this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, targetHeight, dt * 10);
    }

    _canFitStance(height, stance = this.stance) {
        const feet = this._tmpPlayerProbe.copy(this.position);
        feet.y -= this._getStanceHeight(this.stance);
        return !this._checkPlayerCollision(feet, height, stance);
    }

    _getCollisionRadius(stance = this.stance) {
        return stance === 'prone' ? 0.34 : CONFIG.PLAYER.radius;
    }

    _checkPlayerCollision(feetPos, height, stance = this.stance) {
        if (stance !== 'prone') {
            return this._checkWorldCollision(feetPos, this._getCollisionRadius(stance), height);
        }

        const forwardX = -Math.sin(this.yaw);
        const forwardZ = -Math.cos(this.yaw);
        const rightX = Math.cos(this.yaw);
        const rightZ = -Math.sin(this.yaw);
        const samples = [
            { f: 0, r: 0, radius: 0.34 },
            { f: 0.78, r: 0, radius: 0.30 },
            { f: -0.68, r: 0, radius: 0.30 },
            { f: 0.22, r: 0.28, radius: 0.24 },
            { f: 0.22, r: -0.28, radius: 0.24 },
        ];

        for (const sample of samples) {
            this._tmpPlayerProbe.set(
                feetPos.x + forwardX * sample.f + rightX * sample.r,
                feetPos.y,
                feetPos.z + forwardZ * sample.f + rightZ * sample.r
            );
            if (this._checkWorldCollision(this._tmpPlayerProbe, sample.radius, height)) {
                return true;
            }
        }
        return false;
    }

    _resolvePlayerMovement(oldFeet, newFeet, height) {
        const result = this._tmpPlayerResolveResult;
        result.copy(newFeet);

        this._tmpPlayerResolveX.set(newFeet.x, oldFeet.y, oldFeet.z);
        if (this._checkPlayerCollision(this._tmpPlayerResolveX, height)) {
            result.x = oldFeet.x;
        }

        this._tmpPlayerResolveZ.set(result.x, oldFeet.y, newFeet.z);
        if (this._checkPlayerCollision(this._tmpPlayerResolveZ, height)) {
            result.z = oldFeet.z;
        }

        this._tmpPlayerResolveY.set(result.x, newFeet.y, result.z);
        if (this._checkPlayerCollision(this._tmpPlayerResolveY, height)) {
            result.y = oldFeet.y;
        }

        return result;
    }

    _recoverFromOverlap(height = this._getStanceHeight()) {
        const feetY = this.position.y - height;
        this._tmpPlayerProbe.set(this.position.x, feetY, this.position.z);
        if (!this._checkPlayerCollision(this._tmpPlayerProbe, height)) return;

        const offsets = [
            [0, 0.35], [0, -0.35], [0.35, 0], [-0.35, 0],
            [0.55, 0.55], [-0.55, 0.55], [0.55, -0.55], [-0.55, -0.55],
            [0, 0.85], [0, -0.85], [0.85, 0], [-0.85, 0],
            [0, 1.2], [0, -1.2], [1.2, 0], [-1.2, 0],
        ];

        for (const [ox, oz] of offsets) {
            const x = this.position.x + ox;
            const z = this.position.z + oz;
            const groundY = this._getSupportGroundY(x, z, height, feetY, feetY);
            this._tmpPlayerProbe.set(x, groundY, z);
            if (this._checkPlayerCollision(this._tmpPlayerProbe, height)) continue;
            this.position.set(x, groundY + height, z);
            this.velocity.set(0, 0, 0);
            this.onGround = true;
            this.airTime = 0;
            return;
        }
    }

    _checkWorldCollision(feetPos, radius, height) {
        if (this.world?.checkCharacterCollision) {
            return this.world.checkCharacterCollision(feetPos, radius, height, this.inVehicle || null);
        }
        if (this.world?.checkCollision) {
            return this.world.checkCollision(feetPos, radius, height);
        }
        return false;
    }

    _getStanceHeight(stance = this.stance) {
        switch (stance) {
            case 'crouch': return CONFIG.PLAYER.crouchHeight;
            case 'prone': return CONFIG.PLAYER.proneHeight;
            default: return CONFIG.PLAYER.height;
        }
    }

    _getStanceEyeHeight(stance = this.stance) {
        switch (stance) {
            case 'crouch': return 0.95;
            case 'prone': return 0.46;
            default: return CONFIG.PLAYER.height - 0.1;
        }
    }

    _updateFootsteps(dt) {
        if (this.isMoving && this.onGround && this.moveSpeed > 0.5) {
            this.footstepTimer += dt;
            const interval = this.isSprinting ? 0.3 : 0.5;
            if (this.footstepTimer >= interval) {
                this.footstepTimer = 0;
                if (this.audio) {
                    this.audio.playFootstep(this.position, this._getFootstepSurface());
                }
            }
        } else {
            this.footstepTimer = 0;
        }
    }

    _getFootstepSurface() {
        // 主路十字附近视为硬质路面
        if (Math.abs(this.position.x) < 7 || Math.abs(this.position.z) < 7) return 'road';
        const mapId = this.world?.mapId;
        if (mapId === 'ardennes') return 'snow';
        if (mapId === 'iwojima') return 'dirt';
        return 'grass';
    }

    _updateCamera() {
        const collisionHeight = this._getStanceHeight();
        const feetY = this.position.y - collisionHeight;
        let eyeHeight = Math.min(this._getStanceEyeHeight(), collisionHeight - 0.06);

        // 倒地：眼睛贴近地面（战地躺地视角）
        const downedP = this.downed ? (this._downedCamProgress || 0) : 0;
        if (downedP > 0) {
            // 贴地眼高约 0.18m，比趴姿更低
            const downedEye = 0.18;
            eyeHeight = THREE.MathUtils.lerp(eyeHeight, downedEye, downedP);
        }

        this.camera.position.copy(this.position);
        this.camera.position.y = feetY + eyeHeight;

        // 倒地时身体侧倾带来的水平位移（头偏向一侧贴地）
        if (downedP > 0.05) {
            const right = this._tmpLeanRight.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
            const sideShift = right.multiplyScalar(downedP * 0.28);
            // 轻微后仰：头向后倒
            const back = this._tmpLeanBack.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
            sideShift.addScaledVector(back, downedP * 0.12);
            this.camera.position.add(sideShift);
        }

        if (this.currentLean !== 0 && downedP < 0.3) {
            // PUBG 风格：相机横向位移减小（上半身探身而非整体平移）
            const right = this._tmpLeanRight.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
            const basePos = this._tmpLeanBase.copy(this.camera.position);
            const leanOffset = right.multiplyScalar(this.currentLean * 0.28);
            for (let i = 5; i >= 1; i--) {
                const t = i / 5;
                this._tmpCamProbe.copy(basePos).addScaledVector(leanOffset, t);
                this._tmpCamProbe.y -= 0.12;
                if (!this.world.checkCollision(this._tmpCamProbe, 0.18, 0.25)) {
                    this.camera.position.copy(basePos).addScaledVector(leanOffset, t);
                    break;
                }
            }
        }

        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
        // 倒地侧倾滚转（战地倒地视角的标志性倾斜）
        const downedRoll = downedP * 0.72;
        // PUBG 风格：侧身滚转更明显（0.42），强化上半身倾斜的视觉
        const leanRoll = downedP < 0.3 ? this.currentLean * 0.42 : 0;
        this.camera.rotation.z = leanRoll + downedRoll;
        // 倒地时轻微上下浮动（呼吸/失血感）
        if (downedP > 0.8) {
            const breath = Math.sin(performance.now() * 0.0025) * 0.008;
            this.camera.position.y += breath;
            this.camera.rotation.z += Math.sin(performance.now() * 0.0018) * 0.015;
        }
    }

    // === 战地风格载具相机 ===
    // 驾驶位: 第一人称驾驶舱 / 第三人称车后环绕
    // 乘员位: 强制第一人称，可自由环顾
    _updateVehicleMode(dt, weaponSystem) {
        const vehicle = this.inVehicle;
        this._seatEyePos.copy(vehicle.getSeatPosition(this.vehicleSeat));
        this.position.copy(this._seatEyePos);

        const isDriver = this.vehicleSeat === 0;
        // 固定翼驾驶：鼠标不在这里消费，留给 Vehicle._handlePlaneInput 直接读取
        // （机头指哪飞哪；相机自动回中跟随机尾）
        const isPlaneDriver = isDriver && !!vehicle.config?.isPlane;
        const mouseDelta = isPlaneDriver ? { x: 0, y: 0 } : this.input.getMouseDelta();
        if (weaponSystem) weaponSystem.consumeRecoil();

        const isAircraft = !!vehicle.config?.isAircraft;
        const isPlane = !!vehicle.config?.isPlane;
        // 航空载具默认第三人称；固定翼可用 V 切回第一人称座舱（等 V 键切换）
        if (isAircraft) {
            if (this._aircraftViewEverInited === undefined) {
                this._aircraftViewEverInited = true;
                this.vehicleThirdPerson = true;
            }
        }
        // 乘员不允许第三人称（战地乘员是座位第一人称），航空载具除外
        if (!isDriver && !isAircraft) this.vehicleThirdPerson = false;
        // 固定翼第一人称时：乘员仍第三人称
        if (isDriver && isPlane && !this.vehicleThirdPerson) {
            this._planeFpActive = true;
        } else {
            this._planeFpActive = false;
        }

        if (isPlaneDriver) {
            this._vehicleLookYaw = THREE.MathUtils.lerp(this._vehicleLookYaw, 0, Math.min(1, dt * 6));
            this._vehicleLookPitch = THREE.MathUtils.lerp(this._vehicleLookPitch, 0, Math.min(1, dt * 6));
        } else {
            this._vehicleLookYaw -= mouseDelta.x;
            this._vehicleLookPitch -= mouseDelta.y;
        }

        // 驾驶第三人称：环绕角
        // 驾驶第一人称 / 乘员：自由看
        if (isAircraft || (isDriver && this.vehicleThirdPerson)) {
            // 左右环绕不限，俯仰收窄
            const pitchMin = isAircraft ? -0.28 : -0.35;
            const pitchMax = isAircraft ? 0.62 : 0.55;
            this._vehicleLookPitch = THREE.MathUtils.clamp(this._vehicleLookPitch, pitchMin, pitchMax);
        } else {
            // 第一人称看向限制
            this._vehicleLookPitch = THREE.MathUtils.clamp(this._vehicleLookPitch, -1.2, 1.0);
            // 乘员可 360 环顾；驾驶第一人称也允许环顾（坦克/吉普）
            // 不限制 yaw
        }

        this.mouseDeltaX = mouseDelta.x;
        this.mouseDeltaY = mouseDelta.y;

        if ((isAircraft && this.vehicleThirdPerson) || (!isAircraft && isDriver && this.vehicleThirdPerson)) {
            this._updateDriverThirdPersonCamera(vehicle, dt);
            if (vehicle.setFirstPersonLocalView) vehicle.setFirstPersonLocalView(false);
        } else {
            this._updateVehicleFirstPersonCamera(vehicle, isDriver, dt);
            // 驾驶员第一人称隐藏外部模型避免遮挡视野；
            // 乘员位保留载具模型可见，让玩家能看到自己在载具中的位置
            if (vehicle.setFirstPersonLocalView) vehicle.setFirstPersonLocalView(isDriver);
        }

        // 进车相机过渡：从车外位置平滑插到驾驶位/环绕位
        if (this._vehicleEnterBlend !== undefined && this._vehicleEnterBlend < 1 && this._vehicleEnterFrom) {
            this._vehicleEnterBlend = Math.min(1, this._vehicleEnterBlend + dt * 3.2);
            const t = this._vehicleEnterBlend * this._vehicleEnterBlend * (3 - 2 * this._vehicleEnterBlend);
            this.camera.position.lerpVectors(this._vehicleEnterFrom, this.camera.position, t);
            if (this._vehicleEnterBlend >= 1) this._vehicleEnterFrom = null;
        }
    }

    _updateDriverThirdPersonCamera(vehicle, dt) {
        const vehicleType = vehicle.type;
        let camDist = 10.5;
        let camHeight = 2.8;
        let lookHeight = 1.6;
        if (vehicleType === 'tank') { camDist = 14; camHeight = 3.6; lookHeight = 2.1; }
        else if (vehicleType === 'apc') { camDist = 12; camHeight = 3.2; lookHeight = 1.8; }
        else if (vehicleType === 'heli') { camDist = 13; camHeight = 3.8; lookHeight = 1.8; }
        else if (vehicleType === 'plane') { camDist = 16; camHeight = 4.2; lookHeight = 1.8; }
        else if (vehicleType === 'jeep') { camDist = 9; camHeight = 2.4; lookHeight = 1.4; }
        const aircraftZoom = !!vehicle.config?.isAircraft && this.input.isMouseDown(2);
        if (aircraftZoom) {
            camDist *= 0.62;
            camHeight *= 0.9;
            lookHeight += 0.35;
        }

        // 战地风格：鼠标控制环绕视角，准星=瞄准方向
        // 前进方向约定：(-sin(yaw), 0, -cos(yaw))
        // 固定翼：相机跟随机身俯仰（俯冲时相机同步下压，准星始终指向飞行方向）
        const planePitch = vehicle.config?.isPlane ? (vehicle.pitchAngle || 0) : 0;
        const aimYaw = vehicle.yaw + this._vehicleLookYaw;
        const aimPitch = this._vehicleLookPitch + planePitch;
        const cosPitch = Math.cos(aimPitch);
        const dirX = -Math.sin(aimYaw) * cosPitch;
        const dirY = Math.sin(aimPitch);
        const dirZ = -Math.cos(aimYaw) * cosPitch;

        // 注视点：车身上方
        this._vehicleLookTarget.set(
            vehicle.position.x,
            vehicle.position.y + lookHeight,
            vehicle.position.z
        );

        // 相机在瞄准方向反方向（车后/侧后），不是车前
        this._vehicleCamTarget.set(
            this._vehicleLookTarget.x - dirX * camDist,
            this._vehicleLookTarget.y - dirY * camDist + camHeight * 0.55,
            this._vehicleLookTarget.z - dirZ * camDist
        );

        // 防穿地
        const minY = this.world.getHeight(this._vehicleCamTarget.x, this._vehicleCamTarget.z) + 1.3;
        if (this._vehicleCamTarget.y < minY) this._vehicleCamTarget.y = minY;

        // 防穿建筑
        this._resolveVehicleCameraCollision(this._vehicleLookTarget, this._vehicleCamTarget);

        const lerpFactor = this._vehicleCamSnap ? 1 : (1 - Math.pow(0.0005, dt));
        this._vehicleCamSnap = false;
        this._vehicleCamPos.lerp(this._vehicleCamTarget, lerpFactor);

        const groundY = this.world.getHeight(this._vehicleCamPos.x, this._vehicleCamPos.z) + 1.2;
        if (this._vehicleCamPos.y < groundY) this._vehicleCamPos.y = groundY;

        this.camera.position.copy(this._vehicleCamPos);

        // 朝向与瞄准方向一致：准星中心即弹着点
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = aimYaw;
        this.camera.rotation.x = aimPitch;
        this.camera.rotation.z = 0;
        this.yaw = aimYaw;
        this.pitch = aimPitch;

        if (typeof this._storedVehicleFov === 'number') {
            const targetFov = aircraftZoom ? Math.max(62, this._storedVehicleFov - 16) : this._storedVehicleFov;
            if (Math.abs(this.camera.fov - targetFov) > 0.1) {
                this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1, dt * 10));
                this.camera.updateProjectionMatrix();
            }
        } else if (aircraftZoom && Math.abs(this.camera.fov - 68) > 0.1) {
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 68, Math.min(1, dt * 10));
            this.camera.updateProjectionMatrix();
        }
    }

    _updateVehicleFirstPersonCamera(vehicle, isDriver, dt) {
        const isPlane = vehicle.config?.isPlane;
        // 固定翼第一人称：相机跟随机头俯仰（pitchAngle），鼠标留给飞机操控
        const lookYaw = vehicle.yaw + this._vehicleLookYaw;
        const lookPitch = isPlane && isDriver
            ? (vehicle.pitchAngle || 0)
            : this._vehicleLookPitch;

        // 载具第一人称保留一点前移，减少仪表板/车体穿模
        const push = vehicle.type === 'heli' ? 0.3 : (vehicle.type === 'tank' ? 0.14 : 0.1);
        this._vehicleLookTarget.copy(this._seatEyePos);
        this._vehicleCamTarget.copy(this._seatEyePos);
        this._vehicleCamTarget.x += -Math.sin(lookYaw) * Math.cos(lookPitch) * push;
        this._vehicleCamTarget.y += Math.sin(lookPitch) * push * 0.28;
        this._vehicleCamTarget.z += -Math.cos(lookYaw) * Math.cos(lookPitch) * push;
        this._resolveVehicleCameraCollision(this._vehicleLookTarget, this._vehicleCamTarget);

        if (this._vehicleFpCamSnap || !Number.isFinite(this._vehicleFpCamPos.x)) {
            this._vehicleFpCamPos.copy(this._vehicleCamTarget);
        } else {
            const lerpFactor = THREE.MathUtils.clamp(dt * 18, 0.18, 1);
            this._vehicleFpCamPos.lerp(this._vehicleCamTarget, lerpFactor);
        }
        this._vehicleFpCamSnap = false;
        this.camera.position.copy(this._vehicleFpCamPos);

        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = lookYaw;
        this.camera.rotation.x = lookPitch;
        this.camera.rotation.z = 0;

        this.yaw = lookYaw;
        this.pitch = lookPitch;

        const targetNear = vehicle.type === 'heli' ? 0.04 : 0.05;
        if (Math.abs(this.camera.near - targetNear) > 0.001) {
            this.camera.near = targetNear;
            this.camera.updateProjectionMatrix();
        }

        const baseFov = typeof this._storedVehicleFov === 'number' ? this._storedVehicleFov : this.camera.fov;
        const minVehicleFov = vehicle.type === 'heli'
            ? 88
            : vehicle.type === 'tank'
                ? 76
                : vehicle.type === 'apc'
                    ? 78
                    : 80;
        const targetFov = Math.max(baseFov, minVehicleFov);
        if (Math.abs(this.camera.fov - targetFov) > 0.1) {
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1, dt * 8));
            this.camera.updateProjectionMatrix();
        }
    }

    toggleVehicleView() {
        if (!this.inVehicle) return;
        // 直升机保持第三人称；固定翼/其他载具可切换
        const isHeli = this.inVehicle.type === 'heli';
        if (this.inVehicle.config?.isAircraft && isHeli) return;
        if (this.vehicleSeat !== 0) {
            this.vehicleThirdPerson = false;
            this._planeFpActive = false;
            return;
        }

        this.vehicleThirdPerson = !this.vehicleThirdPerson;
        if (this.inVehicle.config?.isPlane) {
            // 固定翼：第一人称座舱视角，炮管/机头跟随
            this._planeFpActive = !this.vehicleThirdPerson;
        } else {
            this._planeFpActive = false;
        }
        if (this.vehicleThirdPerson) {
            const v = this.inVehicle;
            // 立即放到车后
            const backX = Math.sin(v.yaw);
            const backZ = Math.cos(v.yaw);
            const dist = v.type === 'tank' ? 14 : (v.type === 'heli' ? 13 : 10);
            this._vehicleCamPos.set(
                v.position.x + backX * dist,
                v.position.y + 3.2,
                v.position.z + backZ * dist
            );
            // 第三人称进入时，环绕角归零（正后方）
            this._vehicleLookYaw = 0;
            this._vehicleLookPitch = 0.15;
            this._vehicleCamSnap = true;
        } else {
            // 回到第一人称时，把看向对齐车头
            this._vehicleLookYaw = 0;
            this._vehicleLookPitch = 0;
            this._vehicleCamSnap = false;
            this._vehicleFpCamSnap = true;
        }
    }

    _resolveVehicleCameraCollision(lookTarget, camTarget) {
        if (!this.world || !this.world.checkCollision) return;

        const dx = camTarget.x - lookTarget.x;
        const dy = camTarget.y - lookTarget.y;
        const dz = camTarget.z - lookTarget.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 0.001) return;

        const steps = 10;
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            this._tmpCamProbe.set(
                lookTarget.x + dx * t,
                lookTarget.y + dy * t,
                lookTarget.z + dz * t
            );
            if (this.world.checkCollision(this._tmpCamProbe, 0.3, 0.5)) {
                const safe = Math.max(0.2, (i - 1) / steps);
                camTarget.set(
                    lookTarget.x + dx * safe,
                    lookTarget.y + dy * safe,
                    lookTarget.z + dz * safe
                );
                return;
            }
        }
    }

    takeDamage(amount, attacker = null, bypassVehicle = false) {
        if (!this.alive && !this.downed) return false;
        if (this.spawnProtection > 0) return false;

        if (attacker) {
            this.lastAttacker = attacker;
            if (attacker.position) {
                const dir = attacker.position.clone().sub(this.position);
                this.lastHitDirection = Math.atan2(dir.x, dir.z) + this.yaw;
                this.lastHitTime = performance.now() / 1000;
            }
        }

        // === 载具保护：乘员伤害由载具承受 ===
        if (!bypassVehicle && this.inVehicle && this.inVehicle.alive) {
            const overflow = amount * (CONFIG.VEHICLES._crewDamageOverflow || 0.15);
            this.inVehicle.takeDamage(amount, this.position.clone(), attacker);
            if (overflow > 1) {
                this._applyDirectDamage(overflow, attacker);
                if (this.health <= 0) this._enterDownedState(attacker);
            }
            return false;
        }

        // === 倒地状态下再受击 = 处决加速 ===
        if (this.downed) {
            this.bleedOutTimer -= amount * 0.1;
            this._applyDirectDamage(amount * 0.3, attacker);
            if (this.bleedOutTimer <= 0 || this.health <= -50) {
                this._finalizeDeath(attacker);
            }
            return false;
        }

        this._applyDirectDamage(amount, attacker);

        if (this.health <= 0) {
            this._enterDownedState(attacker);
        }
        return !this.alive;
    }

    // 直接扣血（跳过载具/倒地保护），保留护甲吸收
    _applyDirectDamage(amount, attacker) {
        if (this.armor > 0) {
            const absorbed = Math.min(this.armor, amount * 0.5);
            this.armor -= absorbed;
            amount -= absorbed;
        }
        this.health -= amount;
        this.suppression = Math.min(0.8, this.suppression + 0.08);
    }

    // 进入倒地状态（区别于彻底死亡）
    _enterDownedState(attacker) {
        this.health = 0;
        this.alive = false;
        this.downed = true;
        this.bleedOutTimer = CONFIG.PLAYER.bleedOutTime;
        this.reviveProgress = 0;
        this.skipHoldTimer = 0;
        this._downedCamProgress = 0; // 相机躺地插值从 0 开始

        // 先按当前姿态算出脚底，再切到趴姿高度并贴地
        const oldHeight = this._getStanceHeight();
        const feetY = this.position.y - oldHeight;
        this.stance = 'prone';
        this.currentHeight = CONFIG.PLAYER.proneHeight;
        this.position.y = feetY + this.currentHeight;

        this.currentLean = 0;
        this.leanAmount = 0;
        this.velocity.set(0, 0, 0);
        this.isMoving = false;
        this.isSprinting = false;
        this._stopParachute();
        this._stopVault();
        this._stopClimb();
        this._stopDrag();
        if (this.inVehicle) {
            const vehicle = this.inVehicle;
            const seat = this.vehicleSeat;
            if (vehicle.exit) vehicle.exit(seat);
            if (vehicle.setFirstPersonLocalView) vehicle.setFirstPersonLocalView(false);
            this.inVehicle = null;
            this.vehicleSeat = 0;
            this.vehicleThirdPerson = false;
            this._restoreVehicleCameraSettings();
            // 下车后贴地
            const gy = this.world.getHeight(this.position.x, this.position.z);
            this.position.y = gy + this.currentHeight;
        }
        // 倒地瞬间镜头下沉震动
        this.addShake(0.4);
        this._landDipVel = (this._landDipVel || 0) + 0.8;
        if (!this.deathNotified) {
            this.deathNotified = true;
            if (this.onDowned) this.onDowned(attacker);
        }
    }

    // 倒地结束 → 真正死亡（触发 onDeath，进入部署界面）
    _finalizeDeath(attacker) {
        this.downed = false;
        this._downedCamProgress = 0;
        this.respawnTimer = CONFIG.PLAYER.respawnTime;
        if (this.onDeath) this.onDeath(attacker || this.lastAttacker);
    }

    // 被队友复活
    revive(reviver = null) {
        if (!this.downed) return false;
        this.downed = false;
        this.alive = true;
        this.health = CONFIG.PLAYER.downedReviveHealth;
        this.armor = Math.max(this.armor, 20);
        this.bleedOutTimer = 0;
        this.reviveProgress = 0;
        this.skipHoldTimer = 0;
        this._downedCamProgress = 0;
        // 复活后蹲起：脚底不变，抬高胶囊
        const feetY = this.position.y - this.currentHeight;
        this.stance = 'crouch';
        this.currentHeight = CONFIG.PLAYER.crouchHeight;
        this.position.y = feetY + this.currentHeight;
        this.spawnProtection = CONFIG.PLAYER.spawnProtectionTime;
        this.deathNotified = false;
        return true;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth || CONFIG.PLAYER.maxHealth);
    }

    repairArmor(amount) {
        this.armor = Math.min(this.armor + amount, this.maxArmor || CONFIG.PLAYER.maxArmor);
    }

    addSuppression(amount) {
        const resist = THREE.MathUtils.clamp(this.classConfig?.suppressionResist || 0, 0, 0.8);
        this.suppression = Math.min(1, this.suppression + amount * (1 - resist));
    }

    enterVehicle(vehicle, seat = 0, baseFov = null) {
        this._stopParachute();
        this._stopVault();
        this._stopClimb();
        this._stopDrag();
        this.inVehicle = vehicle;
        this.vehicleSeat = seat;
        this.velocity.set(0, 0, 0);
        // 进入载具时清理步兵移动状态，避免残留的冲刺/走动状态影响 canFire 判定
        this.moveSpeed = 0;
        this.isMoving = false;
        this.isSprinting = false;
        this.sprintFireCooldown = 0;
        this.vehicleThirdPerson = false;
        this._vehicleLookYaw = 0;
        this._vehicleLookPitch = 0;
        this._storedVehicleFov = baseFov ?? this.camera.fov;
        this._storedVehicleNear = this.camera.near;
        this.yaw = vehicle.yaw;
        this.pitch = 0;
        this._vehicleCamPos.copy(vehicle.position);
        this._vehicleCamPos.y += 4;
        this._vehicleFpCamPos.copy(vehicle.getSeatPosition(seat));
        // 进车过渡：相机从当前位置平滑插到座位/第三人称，避免瞬切
        this._vehicleEnterBlend = 0;
        this._vehicleEnterFrom = this.camera.position.clone();
        this._vehicleCamSnap = false;
        this._vehicleFpCamSnap = false;
        this.addShake(0.08);
        if (baseFov) {
            this.camera.fov = baseFov;
            this.camera.updateProjectionMatrix();
        }
        if (this.camera.near !== 0.1) {
            this.camera.near = 0.1;
            this.camera.updateProjectionMatrix();
        }
    }

    exitVehicle() {
        if (!this.inVehicle) return null;
        const vehicle = this.inVehicle;
        const exitSeat = this.vehicleSeat;
        if (vehicle.setFirstPersonLocalView) vehicle.setFirstPersonLocalView(false);
        this.inVehicle = null;
        this.vehicleSeat = 0;
        this.vehicleThirdPerson = false;
        this._vehicleEnterBlend = 1;

        this.yaw = vehicle.yaw + this._vehicleLookYaw;
        this.pitch = this._vehicleLookPitch;

        const aircraftAltitude = vehicle.config?.isAircraft
            ? vehicle.position.y - this.world.getHeight(vehicle.position.x, vehicle.position.z)
            : 0;
        const highAircraftExit = vehicle.config?.isAircraft && aircraftAltitude > 8;
        const exitPos = highAircraftExit
            ? this._findAircraftAirExitPosition(vehicle, exitSeat)
            : this._findVehicleExitPosition(vehicle);
        this.position.copy(exitPos);
        if (highAircraftExit) {
            this.velocity.set(0, -1.2, 0);
            this._parachuteVelocity.set(0, 0, 0);
            this.onGround = false;
            this.airTime = 0;
            this._startParachute();
        } else {
            this._stopParachute();
            // 下车短暂踉跄
            this._landDipVel = (this._landDipVel || 0) + 0.25;
            this.addShake(0.12);
        }

        this.spawnProtection = 1.0;

        this._restoreVehicleCameraSettings();
        return vehicle;
    }

    _restoreVehicleCameraSettings() {
        // 恢复进车前的相机参数
        if (typeof this._storedVehicleNear === 'number') {
            this.camera.near = this._storedVehicleNear;
        } else {
            this.camera.near = 0.1;
        }
        if (typeof this._storedVehicleFov === 'number') {
            this.camera.fov = this._storedVehicleFov;
        }
        this.camera.updateProjectionMatrix();
    }

    _findVehicleExitPosition(vehicle) {
        const sinY = Math.sin(vehicle.yaw);
        const cosY = Math.cos(vehicle.yaw);
        const fx = -sinY;
        const fz = -cosY;
        const rx = cosY;
        const rz = -sinY;
        const sideDist = vehicle.type === 'tank' ? 3.2 : (vehicle.type === 'apc' ? 3.0 : 2.4);
        const frontDist = vehicle.type === 'tank' ? 4.0 : (vehicle.type === 'heli' ? 4.5 : 3.0);
        const candidates = [
            { r: sideDist, f: 0 },
            { r: -sideDist, f: 0 },
            { r: sideDist, f: -frontDist * 0.6 },
            { r: -sideDist, f: -frontDist * 0.6 },
            { r: sideDist, f: frontDist * 0.6 },
            { r: -sideDist, f: frontDist * 0.6 },
            { r: 0, f: -frontDist },
            { r: 0, f: frontDist },
        ];
        const halfSize = CONFIG.WORLD.size / 2 - 2;
        const height = this._getStanceHeight();

        for (const c of candidates) {
            const pos = vehicle.position.clone();
            pos.x += rx * c.r + fx * c.f;
            pos.z += rz * c.r + fz * c.f;
            pos.x = THREE.MathUtils.clamp(pos.x, -halfSize, halfSize);
            pos.z = THREE.MathUtils.clamp(pos.z, -halfSize, halfSize);
            pos.y = this.world.getHeight(pos.x, pos.z) + height;
            const feet = pos.clone();
            feet.y -= height;
            const blocked = this.world.checkCharacterCollision
                ? this.world.checkCharacterCollision(feet, CONFIG.PLAYER.radius, height, vehicle)
                : this.world.checkCollision(feet, CONFIG.PLAYER.radius, height);
            if (!blocked) {
                return pos;
            }
        }

        const fallback = vehicle.position.clone();
        fallback.x = THREE.MathUtils.clamp(fallback.x + rx * sideDist, -halfSize, halfSize);
        fallback.z = THREE.MathUtils.clamp(fallback.z + rz * sideDist, -halfSize, halfSize);
        fallback.y = this.world.getHeight(fallback.x, fallback.z) + height;
        return fallback;
    }

    _findAircraftAirExitPosition(vehicle, seat = 0) {
        const sinY = Math.sin(vehicle.yaw);
        const cosY = Math.cos(vehicle.yaw);
        const rx = cosY;
        const rz = -sinY;
        const backX = sinY;
        const backZ = cosY;
        const halfSize = CONFIG.WORLD.size / 2 - 2;
        const pos = vehicle.position.clone();
        pos.x += rx * (seat === 0 ? -2.4 : 2.4) + backX * 1.5;
        pos.z += rz * (seat === 0 ? -2.4 : 2.4) + backZ * 1.5;
        pos.x = THREE.MathUtils.clamp(pos.x, -halfSize, halfSize);
        pos.z = THREE.MathUtils.clamp(pos.z, -halfSize, halfSize);
        pos.y += this._getStanceHeight() + 0.4;
        return pos;
    }

    _startParachute() {
        this.isParachuting = true;
        this.stance = 'stand';
        this.currentHeight = CONFIG.PLAYER.height;

        if (this._parachuteMesh) {
            this._updateParachuteMesh();
            return;
        }

        const group = new THREE.Group();
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(2.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0xd8d8d0, roughness: 0.85, side: THREE.DoubleSide })
        );
        canopy.scale.z = 0.65;
        canopy.position.y = 2.9;
        group.add(canopy);

        const lineMat = new THREE.LineBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.75 });
        const attachPoints = [
            [-1.5, 2.35, -0.55],
            [1.5, 2.35, -0.55],
            [-1.5, 2.35, 0.55],
            [1.5, 2.35, 0.55],
        ];
        for (const p of attachPoints) {
            const geo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(p[0], p[1], p[2]),
                new THREE.Vector3(0, 0.25, 0),
            ]);
            group.add(new THREE.Line(geo, lineMat));
        }

        this._parachuteMesh = group;
        this._parachuteVisualParent = this.camera.parent || null;
        if (this._parachuteVisualParent) {
            this._parachuteVisualParent.add(group);
        }
        this._updateParachuteMesh();
    }

    _updateParachuteMesh() {
        if (!this._parachuteMesh) return;
        this._parachuteMesh.position.copy(this.position);
        this._parachuteMesh.position.y += 0.3;
        this._parachuteMesh.rotation.y = this.yaw;
        this._parachuteMesh.rotation.z = Math.sin(performance.now() * 0.003) * 0.04;
    }

    _stopParachute() {
        this.isParachuting = false;
        if (!this._parachuteMesh) return;

        const mesh = this._parachuteMesh;
        if (mesh.parent) mesh.parent.remove(mesh);
        mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    for (const mat of child.material) mat.dispose();
                } else {
                    child.material.dispose();
                }
            }
        });
        this._parachuteMesh = null;
        this._parachuteVisualParent = null;
    }

    _isActivelySprinting() {
        return this.isSprinting &&
            this.isMoving &&
            this.onGround &&
            this.moveSpeed > CONFIG.PLAYER.walkSpeed * 1.05;
    }

    getState() {
        return {
            position: this.position,
            yaw: this.yaw,
            pitch: this.pitch,
            stance: this.stance,
            isSprinting: this.isSprinting,
            isMoving: this.isMoving,
            onGround: this.onGround,
            moveSpeed: this.moveSpeed,
            health: this.health,
            armor: this.armor,
            alive: this.alive,
            inVehicle: !!this.inVehicle,
            inStaticGun: !!this.inStaticGun,
            vehicleSeat: this.vehicleSeat,
            vehicleThirdPerson: this.vehicleThirdPerson,
            mouseDeltaX: this.mouseDeltaX || 0,
            mouseDeltaY: this.mouseDeltaY || 0,
            stamina: this.stamina,
            maxStamina: CONFIG.PLAYER.maxStamina,
            isExhausted: this.isExhausted,
            isHoldingBreath: this.isHoldingBreath,
            lean: this.currentLean,
            suppression: this.suppression,
            captureWeight: this.captureWeight,
            specializationId: this.classConfig?.specializationId ?? null,
            specializationLevel: this.classConfig?.specializationLevel ?? 0,
            spawnProtection: this.spawnProtection > 0,
            // 开枪无限制：只要活着就能开枪。
            // 移除了冲刺冷却/冲刺中/翻越中的限制 —— 这些"莫名其妙开不了枪"的根因。
            // 武器系统自身的射速/换弹/弹匣空检查仍保留（那是武器机制，不是人为限制）。
            canFire: this.alive && !this._executionLock && !this._meleeLock,
            isVaulting: this._vaulting,
            // 倒地状态
            downed: this.downed,
            bleedOutTimer: this.bleedOutTimer,
            reviveProgress: this.reviveProgress,
            skipHoldTimer: this.skipHoldTimer,
        };
    }

    getForward() {
        return new THREE.Vector3(
            -Math.sin(this.yaw) * Math.cos(this.pitch),
            Math.sin(this.pitch),
            -Math.cos(this.yaw) * Math.cos(this.pitch)
        );
    }

    getVehicleLookAngles() {
        if (!this.inVehicle) return { yaw: this.yaw, pitch: this.pitch };
        return {
            yaw: this.yaw,
            pitch: this.pitch,
        };
    }

    getPosition() {
        return this.position;
    }

    setAudio(audio) {
        this.audio = audio;
    }
}
