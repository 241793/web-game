import * as THREE from 'three';
import { CONFIG } from '../config.js?v=20260801.2';
import { createProceduralMaterial } from '../utils/VisualAssets.js?v=20260801.2';

// 武器系统 - 管理武器状态、射击、弹道、特效
export class WeaponSystem {
    constructor(scene, camera, audio, world, callbackScope) {
        this.scene = scene;
        this.camera = camera;
        this.audio = audio;
        this.world = world;
        this.cb = callbackScope; // 回调对象 { onHit, onKill, getTargets }

        // 武器状态
        this.weapons = [];        // 当前装备的武器列表
        this.currentWeaponIdx = 0;
        this.currentWeapon = null;

        // 射击状态
        this.lastFireTime = 0;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.reloadDuration = 0;  // 换弹总时长（用于计算动画进度）
        this.isFiring = false;
        this.isAiming = false;
        this.isHoldingBreath = false;
        this.isBraced = false;

        // 后坐力 - pendingRecoil 为一次性踢出量，由 PlayerController 消费
        this.pendingRecoil = { x: 0, y: 0 };
        // recoilOffset 用于武器模型视觉后坐力
        this.recoilOffset = new THREE.Vector2(0, 0);
        // 累积后坐力 - 用于后坐力恢复（视角不会永久偏移）
        this.accumulatedRecoil = { x: 0, y: 0 };
        // 连续射击扩散累积
        this.spreadAccumulation = 0; // 当前扩散累积值
        this.shotsFired = 0;         // 当前连射次数
        this.lastShotTime = 0;       // 上次射击时间
        // 后坐力模式（随机但有一致性）
        this.recoilPatternOffset = 0;

        // 弹道效果
        this.tracers = [];
        this.impacts = [];
        this._maxTracers = 24;
        this._maxImpacts = 40; // 性能优化：限制弹孔/特效数量上限
        this.muzzleFlash = null;
        this.muzzleFlashTimer = 0;

        // 手雷
        this.grenades = [];
        this.grenadeCount = 3;

        // 武器模型组
        this.weaponGroup = new THREE.Group();
        this.camera.add(this.weaponGroup);

        // 创建武器模型
        this.weaponModels = {};

        // 手持手雷模型（投掷时显示，模拟手持手雷准备投掷的姿态）
        this.heldGrenade = null;
        this.heldGrenadeTimer = 0;   // 投掷动画计时器
        this.heldGrenadeThrowing = false;  // 是否正在播放投掷动画
        this._createHeldGrenadeModel();

        // 视角动画
        this.viewBob = 0;
        this.viewSway = new THREE.Vector2(0, 0);
        this.aimLerp = 0;

        // 半自动射击控制
        this._canFireSemi = true;

        // 泵动霰弹枪（M870）状态
        this._pumpTimer = 0;
        this._pumpKick = 0;

        // 武器切换动画
        // 缩短到 0.15s：切枪后几乎能立即开枪（开枪无限制）
        this.switchAnimTimer = 0;
        this.switchAnimDuration = 0.15;
        this._pendingSwitchIdx = -1;

        // 后坐力消费返回对象（复用，避免每帧分配）
        this._recoilReturn = { x: 0, y: 0 };

        // 延迟回调跟踪（dispose 时取消）
        this._pendingTimeouts = [];
        this._disposed = false;

        // 是否正在移动（影响扩散）
        this._isMoving = false;
        this._isAirborne = false;
        this._isCrouching = false;
        this._isProne = false;

        // === 性能优化：复用临时对象，减少GC ===
        this._tmpOrigin = new THREE.Vector3();
        this._tmpDir = new THREE.Vector3();
        this._tmpQuat = new THREE.Quaternion();
        this._tmpVec1 = new THREE.Vector3();
        this._tmpVec2 = new THREE.Vector3();
        this._tmpVec3 = new THREE.Vector3();
        this._tmpUp = new THREE.Vector3(0, 1, 0);
        this._fireRaycaster = new THREE.Raycaster();
        this._dropRaycaster = new THREE.Raycaster();
        this._muzzlePos = new THREE.Vector3();
        this._forwardVec = new THREE.Vector3(0, 0, -1);

        // === 缓存几何体和材质 ===
        this._shellGeoRifle = new THREE.CylinderGeometry(0.005, 0.005, 0.025, 4);
        this._shellGeoPistol = new THREE.CylinderGeometry(0.004, 0.004, 0.018, 4);
        this._shellMat = new THREE.MeshStandardMaterial({ color: 0xccaa44, metalness: 0.8, roughness: 0.3 });
        this._tracerMatCache = {};  // 按颜色缓存弹道材质
        this._bloodMat = new THREE.PointsMaterial({ color: 0xcc0000, size: 0.1, transparent: true });
        this._bloodMistMat = new THREE.MeshBasicMaterial({ color: 0x880000, transparent: true, opacity: 0.4 });
        this._bloodMistGeo = new THREE.SphereGeometry(0.2, 6, 4);
    }

    // 装备武器
    loadWeapons(weaponNames) {
        this.weapons = [];
        for (const name of weaponNames) {
            const config = CONFIG.WEAPONS[name];
            if (config) {
                this.weapons.push({
                    name: name,
                    config: config,
                    ammoInMag: config.magSize,
                    reserveAmmo: config.reserveAmmo,
                    fireMode: this._getDefaultFireMode(config),
                });
            }
        }
        this.currentWeaponIdx = 0;
        this.currentWeapon = this.weapons[0];
        this._createWeaponModels();
        this._showWeaponModel(0);
    }

    _createWeaponModels() {
        // 清除旧模型
        while (this.weaponGroup.children.length > 0) {
            this._disposeObject3D(this.weaponGroup.children[0]);
        }
        this.weaponModels = {};

        for (let i = 0; i < this.weapons.length; i++) {
            const wpn = this.weapons[i];
            const model = this._buildWeaponModel(wpn.config);
            model.visible = (i === 0);
            this.weaponGroup.add(model);
            this.weaponModels[i] = model;
        }
    }

    _disposeObject3D(object) {
        if (!object) return;
        object.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if (mat && !mat.userData?.sharedProcedural) mat.dispose?.();
                    });
                } else if (!child.material.userData?.sharedProcedural && child.material.dispose) {
                    child.material.dispose();
                }
            }
        });
        if (object.parent) object.parent.remove(object);
    }

    // 创建手持手雷模型（投掷前在玩家手中显示）
    _createHeldGrenadeModel() {
        const group = new THREE.Group();
        // 手雷体（橄榄形）
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.055, 6, 5),
            new THREE.MeshStandardMaterial({ color: 0x3a4a2a, metalness: 0.5, roughness: 0.6 })
        );
        body.scale.y = 1.3;
        group.add(body);
        // 引信帽
        const fuseCap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.014, 0.016, 0.022, 5),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.4 })
        );
        fuseCap.position.y = 0.075;
        group.add(fuseCap);
        // 安全销
        const pin = new THREE.Mesh(
            new THREE.TorusGeometry(0.012, 0.002, 3, 5),
            new THREE.MeshStandardMaterial({ color: 0xcc4444, metalness: 0.8 })
        );
        pin.position.set(0.018, 0.07, 0);
        pin.rotation.y = Math.PI / 2;
        group.add(pin);

        // 定位在屏幕右下角（类似武器模型的位置）
        group.position.set(0.18, -0.16, -0.35);
        group.visible = false;
        this.weaponGroup.add(group);
        this.heldGrenade = group;
    }

    // 显示/隐藏手持手雷
    showHeldGrenade(visible) {
        if (this.heldGrenade) {
            this.heldGrenade.visible = visible;
            if (visible) {
                this.heldGrenadeTimer = 0;
                this.heldGrenadeThrowing = false;
            }
        }
    }

    // 播放投掷动画（挥臂动作）
    playThrowAnimation() {
        this.heldGrenadeThrowing = true;
        this.heldGrenadeTimer = 0;
    }

    _buildWeaponModel(config) {
        const group = new THREE.Group();

        // 材质库 - 不同武器的配色方案
        const isDark = config.name === 'AK-12' || config.name === 'UMP-45';
        const isTan = config.name === 'SCAR-H' || config.name === 'M870' || config.name === 'M40A5';
        const metalCol = isTan ? 0x6b5a3a : (isDark ? 0x1a1a1a : 0x2a2a2a);
        const stockCol = isTan ? 0x5a4a2a : 0x1a1a1a;
        const polymerCol = isTan ? 0x4a3a1a : 0x222222;
        const matMetal = createProceduralMaterial('metal', {
            baseColor: metalCol,
            accentColor: 0x101010,
            detailColor: 0x8a8a8a,
            size: 192,
            repeatX: 2,
            repeatY: 1,
            anisotropy: 8,
        }, { roughness: 0.36, metalness: 0.86, bumpScale: 0.014, useBump: true });
        const matStock = createProceduralMaterial('fabric', {
            baseColor: stockCol,
            accentColor: isTan ? 0x2a2116 : 0x080808,
            detailColor: isTan ? 0x8b7655 : 0x555555,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 8,
        }, { roughness: 0.72, metalness: 0.12, bumpScale: 0.014, useBump: true });
        const matPolymer = createProceduralMaterial('fabric', {
            baseColor: polymerCol,
            accentColor: 0x111111,
            detailColor: 0x4f4f4f,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 6,
        }, { roughness: 0.76, metalness: 0.1, bumpScale: 0.014, useBump: true });
        const matDark = createProceduralMaterial('metal', {
            baseColor: 0x0a0a0a,
            accentColor: 0x020202,
            detailColor: 0x404040,
            size: 128,
            repeatX: 1,
            repeatY: 1,
            anisotropy: 4,
        }, { roughness: 0.42, metalness: 0.62, bumpScale: 0.01, useBump: true });
        const matGlass = new THREE.MeshStandardMaterial({
            color: 0x113311,
            roughness: 0.06,
            metalness: 0.18,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
        });

        switch (config.type) {
            case 'rifle': {
                this._buildRifleModel(group, config, matMetal, matStock, matPolymer, matDark);
                break;
            }
            case 'lmg': {
                this._buildLMGModel(group, config, matMetal, matStock, matPolymer, matDark);
                break;
            }
            case 'dmr': {
                this._buildDMRModel(group, config, matMetal, matStock, matPolymer, matDark, matGlass);
                break;
            }
            case 'smg': {
                this._buildSMGModel(group, config, matMetal, matStock, matPolymer, matDark);
                break;
            }
            case 'sniper': {
                this._buildSniperModel(group, config, matMetal, matStock, matPolymer, matDark, matGlass);
                break;
            }
            case 'shotgun': {
                this._buildShotgunModel(group, config, matMetal, matStock, matPolymer, matDark);
                break;
            }
            case 'pistol': {
                this._buildPistolModel(group, config, matMetal, matStock, matDark);
                break;
            }
            case 'rocket': {
                this._buildRocketModel(group, config, matMetal, matStock, matDark);
                break;
            }
        }

        this._addWeaponDetailKit(group, config, matMetal, matStock, matPolymer, matDark);
        this._addWeaponAttachmentSuite(group, config, matMetal, matStock, matPolymer, matDark, matGlass);
        this._addWeaponSurfacePaneling(group, config, matMetal, matStock, matPolymer, matDark, matGlass);

        // 枪口闪光
        const flash = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0 })
        );
        // 闪光位置放在枪口
        const muzzleZ = config.type === 'pistol' ? -0.35 :
                         config.type === 'rocket' ? -0.7 :
                         config.type === 'sniper' ? -0.75 :
                         config.type === 'shotgun' ? -0.6 :
                         config.type === 'lmg' ? -0.8 :
                         config.type === 'dmr' ? -0.7 :
                         -0.65;
        flash.position.set(0, 0, muzzleZ);
        flash.name = 'muzzleFlash';
        flash.scale.set(1, 1, 1.5);
        group.add(flash);

        // === 第一人称手臂 ===
        this._buildFirstPersonArms(group, config);

        // 设置默认位置
        group.position.set(0.25, -0.22, -0.4);
        group.rotation.y = 0;

        return group;
    }

    _addWeaponDetailKit(group, config, matMetal, matStock, matPolymer, matDark) {
        const railMat = new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.35, metalness: 0.8 });
        const boltMat = new THREE.MeshStandardMaterial({ color: 0x5c5c5c, roughness: 0.25, metalness: 0.9 });
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9, metalness: 0.1 });
        const isPistol = config.type === 'pistol';
        const isRocket = config.type === 'rocket';

        if (!isPistol && !isRocket) {
            const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, config.type === 'sniper' ? 0.5 : 0.32), railMat);
            topRail.position.set(0, 0.085, -0.02);
            group.add(topRail);

            const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 0.05), matDark);
            rearSight.position.set(0, 0.08, 0.08);
            group.add(rearSight);

            const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.04), matDark);
            frontSight.position.set(0, 0.07, -0.4);
            group.add(frontSight);

            const slingLoop = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 4, 8), boltMat);
            slingLoop.position.set(0.08, -0.01, 0.18);
            slingLoop.rotation.y = Math.PI / 2;
            group.add(slingLoop);
        }

        if (isPistol) {
            const slideRail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.01, 0.14), railMat);
            slideRail.position.set(0, 0.055, -0.06);
            group.add(slideRail);

            const ejectionPort = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.06), matDark);
            ejectionPort.position.set(0.02, 0.045, 0.04);
            group.add(ejectionPort);
        }

        if (config.type === 'rifle' || config.type === 'lmg' || config.type === 'smg' || config.type === 'dmr') {
            const magRelease = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.025, 0.03), boltMat);
            magRelease.position.set(0.05, -0.03, 0.03);
            group.add(magRelease);
        }

        if (config.type === 'shotgun') {
            const pumpGrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.09), gripMat);
            pumpGrip.position.set(0, -0.03, -0.18);
            group.add(pumpGrip);

            const ventRib = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.38), railMat);
            ventRib.position.set(0, 0.06, -0.24);
            group.add(ventRib);
        }

        if (config.type === 'sniper') {
            const railCap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.22), railMat);
            railCap.position.set(0, 0.06, -0.02);
            group.add(railCap);
        }

        if (isRocket) {
            const shoulderPad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), matStock);
            shoulderPad.position.set(0, -0.02, 0.2);
            group.add(shoulderPad);

            const rearCap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.04), matDark);
            rearCap.position.set(0, -0.01, 0.42);
            group.add(rearCap);
        }

        // === 每个武器的独有视觉特征（参照原版战地的武器外观差异）===
        // 让同类型武器也能通过弹匣/瞄具/枪管/护木等细节区分
        this._addWeaponSignature(group, config, matMetal, matStock, matPolymer, matDark, railMat, boltMat, gripMat);
    }

    // 为每个武器添加独有的标志性外观特征
    _addWeaponSignature(group, config, matMetal, matStock, matPolymer, matDark, railMat, boltMat, gripMat) {
        const specMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.6 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.7, metalness: 0.1 });
        const tanMat = new THREE.MeshStandardMaterial({ color: 0x8b7655, roughness: 0.65, metalness: 0.15 });

        switch (config.name) {
            case 'M416': {
                // 下挂 M320 榴弹发射器（M416 标志性配件）
                const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.14, 8), specMat);
                gl.position.set(0, -0.07, -0.1);
                group.add(gl);
                // 全息瞄准镜（方形镜体）
                const holo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.025), matDark);
                holo.position.set(0, 0.105, 0.0);
                group.add(holo);
                break;
            }
            case 'AK-12': {
                // AK 标志性弧形弯弹匣
                const akMag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.13, 0.05), specMat);
                akMag.position.set(0, -0.09, 0.03);
                akMag.rotation.x = 0.18;
                group.add(akMag);
                // 木质护木
                const woodGuard = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.038, 0.2), woodMat);
                woodGuard.position.set(0, -0.005, -0.15);
                group.add(woodGuard);
                // 侧装瞄具导轨
                const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.12), railMat);
                sideRail.position.set(0.035, 0.06, -0.05);
                group.add(sideRail);
                break;
            }
            case 'SCAR-H': {
                // FN SCAR 方形护木（标志性外观）
                const scarHandguard = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.26), tanMat);
                scarHandguard.position.set(0, 0.0, -0.18);
                group.add(scarHandguard);
                // 粗枪管（7.62mm）
                const heavyBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.3, 8), matMetal);
                heavyBarrel.rotation.x = Math.PI / 2;
                heavyBarrel.position.set(0, 0.01, -0.3);
                group.add(heavyBarrel);
                // 弹匣加宽（7.62弹匣）
                const wideMag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.055), specMat);
                wideMag.position.set(0, -0.08, 0.03);
                group.add(wideMag);
                break;
            }
            case 'MP5': {
                // MP5 标志性弯曲弹匣
                const mp5Mag = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.1, 0.035), specMat);
                mp5Mag.position.set(0, -0.08, 0.03);
                mp5Mag.rotation.x = 0.12;
                group.add(mp5Mag);
                // 海军扳机护圈（MP5海军版特征）
                const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 4, 8, Math.PI), specMat);
                triggerGuard.position.set(0, -0.04, 0.06);
                triggerGuard.rotation.x = Math.PI / 2;
                group.add(triggerGuard);
                // 短枪管
                const shortBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), matMetal);
                shortBarrel.rotation.x = Math.PI / 2;
                shortBarrel.position.set(0, 0.01, -0.28);
                group.add(shortBarrel);
                break;
            }
            case 'UMP-45': {
                // UMP 直弹匣（.45口径）
                const umpMag = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.09, 0.045), specMat);
                umpMag.position.set(0, -0.08, 0.03);
                group.add(umpMag);
                // 粗枪管（.45口径）
                const thickBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.22, 8), matMetal);
                thickBarrel.rotation.x = Math.PI / 2;
                thickBarrel.position.set(0, 0.01, -0.3);
                group.add(thickBarrel);
                // 折叠枪托铰链
                const stockHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.04, 6), boltMat);
                stockHinge.rotation.z = Math.PI / 2;
                stockHinge.position.set(0, -0.01, 0.18);
                group.add(stockHinge);
                break;
            }
            case 'M870': {
                // 管状弹仓延伸（霰弹枪标志性）
                const tubeExt = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 8), matMetal);
                tubeExt.rotation.x = Math.PI / 2;
                tubeExt.position.set(0, -0.02, -0.3);
                group.add(tubeExt);
                // 弹仓帽
                const tubeCap = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 4), specMat);
                tubeCap.position.set(0, -0.02, -0.45);
                group.add(tubeCap);
                // 珠状准星
                const beadSight = new THREE.Mesh(new THREE.SphereGeometry(0.006, 4, 3), specMat);
                beadSight.position.set(0, 0.075, -0.5);
                group.add(beadSight);
                break;
            }
            case 'L96': {
                // 枪口制退器（狙击枪标志性）
                const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.06, 8), matMetal);
                brake.rotation.x = Math.PI / 2;
                brake.position.set(0, 0.01, -0.62);
                group.add(brake);
                // 贴腮板（狙击枪标志性）
                const cheekRest = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.15), matPolymer);
                cheekRest.position.set(0, 0.075, 0.15);
                group.add(cheekRest);
                // 高倍瞄准镜（长镜体）
                const scopeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.28, 12), specMat);
                scopeBody.rotation.x = Math.PI / 2;
                scopeBody.position.set(0, 0.1, -0.05);
                group.add(scopeBody);
                break;
            }
            case 'M40A5': {
                // 木质枪托（M40标志性的木质外观）
                const woodStock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.25), woodMat);
                woodStock.position.set(0, -0.03, 0.2);
                group.add(woodStock);
                // 皮革包裹（枪托贴腮部位）
                const leather = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.1), tanMat);
                leather.position.set(0, 0.07, 0.12);
                group.add(leather);
                // 中倍瞄准镜
                const scopeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.24, 12), specMat);
                scopeBody.rotation.x = Math.PI / 2;
                scopeBody.position.set(0, 0.1, -0.05);
                group.add(scopeBody);
                break;
            }
            case 'M249': {
                // 弹链箱（LMG标志性）
                const ammoBox = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.12), specMat);
                ammoBox.position.set(0.04, -0.07, 0.0);
                group.add(ammoBox);
                // 弹链（从弹箱到进弹口）
                const belt = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.06), boltMat);
                belt.position.set(0.02, -0.05, -0.04);
                group.add(belt);
                // 两脚架（LMG标志性）
                const bipodLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.003, 0.12, 4), matMetal);
                bipodLeg.rotation.z = 0.3;
                bipodLeg.position.set(0.03, -0.06, -0.35);
                group.add(bipodLeg);
                const bipodLeg2 = bipodLeg.clone();
                bipodLeg2.rotation.z = -0.3;
                bipodLeg2.position.x = -0.03;
                group.add(bipodLeg2);
                break;
            }
            case 'SKS': {
                // 木质枪身（SKS标志性的木质外观）
                const woodBody = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.4), woodMat);
                woodBody.position.set(0, 0.0, -0.1);
                group.add(woodBody);
                // 折叠刺刀座
                const bayonetLug = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.015, 0.04), matMetal);
                bayonetLug.position.set(0, -0.02, -0.42);
                group.add(bayonetLug);
                // 10发固定弹仓
                const fixedMag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.06), specMat);
                fixedMag.position.set(0, -0.05, 0.03);
                group.add(fixedMag);
                break;
            }
            case 'P226': {
                // P226 标志性扳机护圈
                const guard = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 4, 8, Math.PI), specMat);
                guard.position.set(0, -0.035, 0.04);
                guard.rotation.x = Math.PI / 2;
                group.add(guard);
                // 枪口帽
                const muzzleCap = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 6), matDark);
                muzzleCap.rotation.x = Math.PI / 2;
                muzzleCap.position.set(0, 0.03, -0.32);
                group.add(muzzleCap);
                break;
            }
            case 'MP443': {
                // 俄式手枪扳机护圈（方形）
                const ruGuard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.005, 0.04), specMat);
                ruGuard.position.set(0, -0.05, 0.04);
                ruGuard.rotation.x = 0.3;
                group.add(ruGuard);
                // 俄式握把纹理
                const gripTexture = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.04, 0.03), matDark);
                gripTexture.position.set(0.015, -0.04, 0.08);
                group.add(gripTexture);
                break;
            }
            case 'RPG-7': {
                // RPG-7 标志性锥形弹头
                const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 8), specMat);
                warhead.rotation.x = -Math.PI / 2;
                warhead.position.set(0, 0.0, -0.65);
                group.add(warhead);
                // 弹头尾部稳定环
                const finRing = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.006, 4, 8), matMetal);
                finRing.position.set(0, 0.0, -0.55);
                group.add(finRing);
                // RPG 标志性锥形喷管
                const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.1, 8), matDark);
                nozzle.rotation.x = Math.PI / 2;
                nozzle.position.set(0, 0.0, 0.4);
                group.add(nozzle);
                break;
            }
            case 'SMAW': {
                // SMAW 方形发射筒
                const squareTube = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.6), specMat);
                squareTube.position.set(0, 0.0, -0.1);
                group.add(squareTube);
                // 瞄准具
                const sight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.04), matDark);
                sight.position.set(0, 0.08, 0.1);
                group.add(sight);
                // 前握把
                const foregrip = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6), gripMat);
                foregrip.position.set(0, -0.06, -0.15);
                group.add(foregrip);
                break;
            }
        }
    }

    _addWeaponAttachmentSuite(group, config, matMetal, matStock, matPolymer, matDark, matGlass) {
        const accentMat = new THREE.MeshStandardMaterial({ color: 0x2f3432, roughness: 0.52, metalness: 0.65 });
        const rubberMat = new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 0.86, metalness: 0.08 });
        const markingMat = new THREE.MeshBasicMaterial({ color: 0x66d6c5, transparent: true, opacity: 0.7 });
        const isSidearm = config.type === 'pistol';
        const isTube = config.type === 'rocket';

        if (!isSidearm && !isTube) {
            const optic = new THREE.Group();
            const bodyLength = config.type === 'sniper' ? 0.24 : config.type === 'dmr' ? 0.18 : 0.11;
            const bodyRadius = config.type === 'sniper' ? 0.03 : 0.024;
            const opticBody = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLength, 14), matDark);
            opticBody.rotation.x = Math.PI / 2;
            optic.add(opticBody);

            const lensFront = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius * 0.82, bodyRadius * 0.82, 0.008, 14), matGlass);
            lensFront.rotation.x = Math.PI / 2;
            lensFront.position.z = -bodyLength / 2 - 0.004;
            optic.add(lensFront);

            const lensRear = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius * 0.72, bodyRadius * 0.72, 0.008, 14), matGlass);
            lensRear.rotation.x = Math.PI / 2;
            lensRear.position.z = bodyLength / 2 + 0.004;
            optic.add(lensRear);

            const mount = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.04), accentMat);
            mount.position.y = -0.035;
            optic.add(mount);
            optic.position.set(0, config.type === 'sniper' ? 0.14 : 0.105, config.type === 'smg' ? -0.04 : -0.02);
            group.add(optic);

            if (config.type === 'rifle' || config.type === 'lmg' || config.type === 'dmr') {
                const foreGrip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.11, 0.04), rubberMat);
                foreGrip.position.set(0, -0.07, config.type === 'lmg' ? -0.22 : -0.18);
                foreGrip.rotation.x = -0.12;
                group.add(foreGrip);

                const laserBox = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 0.09), accentMat);
                laserBox.position.set(0.045, 0.02, config.type === 'lmg' ? -0.28 : -0.25);
                group.add(laserBox);

                const laserLens = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.018, 0.006), markingMat);
                laserLens.position.set(0.045, 0.02, config.type === 'lmg' ? -0.33 : -0.295);
                group.add(laserLens);
            }
        }

        if (config.name === 'SCAR-H' || config.name === 'M40A5') {
            const brake = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.03, 0.055), matDark);
            brake.position.set(0, 0.02, config.type === 'sniper' ? -0.78 : -0.62);
            group.add(brake);
            for (let side = -1; side <= 1; side += 2) {
                const port = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.018, 0.02), matMetal);
                port.position.set(side * 0.024, 0.021, brake.position.z);
                group.add(port);
            }
        }

        if (config.name === 'MP5' || config.name === 'P226') {
            const tacLight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.024, 0.09), accentMat);
            tacLight.position.set(0.038, config.type === 'pistol' ? -0.005 : -0.015, config.type === 'pistol' ? -0.12 : -0.25);
            group.add(tacLight);
            const lens = new THREE.Mesh(new THREE.CircleGeometry(0.012, 10), matGlass);
            lens.position.set(0.038, tacLight.position.y, tacLight.position.z - 0.048);
            lens.rotation.y = Math.PI;
            group.add(lens);
        }

        if (config.type === 'shotgun') {
            for (let i = 0; i < 4; i++) {
                const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.055, 8), matStock);
                shell.rotation.x = Math.PI / 2;
                shell.position.set(0.055, 0.01, 0.08 + i * 0.035);
                group.add(shell);
            }
        }

        if (isTube) {
            const optic = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.055, 0.11), matDark);
            optic.position.set(0.075, 0.09, -0.04);
            optic.rotation.z = -0.08;
            group.add(optic);
            const cable = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.004, 5, 12, Math.PI), rubberMat);
            cable.position.set(-0.02, -0.045, -0.02);
            cable.rotation.y = Math.PI / 2;
            group.add(cable);
        }
    }

    // 构建第一人称手臂模型（连接到武器上，随武器一起移动）
    _addWeaponSurfacePaneling(group, config, matMetal, matStock, matPolymer, matDark, matGlass) {
        const markMat = new THREE.MeshBasicMaterial({ color: 0xb7c2ba, transparent: true, opacity: 0.78 });
        const amberMat = new THREE.MeshBasicMaterial({ color: 0xd3a44b, transparent: true, opacity: 0.82 });
        const screwMat = new THREE.MeshStandardMaterial({ color: 0x565a58, roughness: 0.32, metalness: 0.9 });
        const rubberMat = new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 0.9, metalness: 0.06 });

        const addBox = (name, size, pos, mat, rot = null) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
            mesh.name = name;
            mesh.position.set(pos[0], pos[1], pos[2]);
            if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
            group.add(mesh);
            return mesh;
        };
        const addCyl = (name, radius, height, pos, mat, rot = null, segments = 8) => {
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat);
            mesh.name = name;
            mesh.position.set(pos[0], pos[1], pos[2]);
            if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
            group.add(mesh);
            return mesh;
        };

        if (config.type !== 'rocket') {
            const railLength = config.type === 'sniper' ? 0.48 : config.type === 'lmg' ? 0.42 : config.type === 'pistol' ? 0.13 : 0.32;
            const railStart = config.type === 'pistol' ? -0.1 : -0.18;
            const toothCount = config.type === 'pistol' ? 4 : config.type === 'sniper' ? 9 : 7;
            for (let i = 0; i < toothCount; i++) {
                addBox('rail_tooth', [0.055, 0.008, 0.018], [0, config.type === 'pistol' ? 0.078 : 0.094, railStart + (i / Math.max(1, toothCount - 1)) * railLength], matDark);
            }

            addBox('receiver_side_plate_l', [0.006, 0.045, 0.16], [-0.038, 0.006, 0.02], matMetal);
            addBox('receiver_side_plate_r', [0.006, 0.045, 0.16], [0.038, 0.006, 0.02], matMetal);
            addBox('serial_plate', [0.007, 0.022, 0.09], [-0.042, 0.025, -0.035], markMat);
            addBox('selector_mark_safe', [0.006, 0.01, 0.018], [0.044, 0.01, 0.075], amberMat);
            addBox('selector_mark_fire', [0.006, 0.01, 0.028], [0.044, -0.012, 0.075], amberMat);
            addCyl('selector_pin', 0.01, 0.008, [0.046, -0.001, 0.06], screwMat, [0, 0, Math.PI / 2], 10);

            for (const side of [-1, 1]) {
                for (const z of [-0.18, -0.04, 0.12]) {
                    addCyl('receiver_screw', 0.008, 0.006, [side * 0.042, 0.025, z], screwMat, [0, 0, Math.PI / 2], 8);
                }
            }
        }

        if (config.type === 'rifle' || config.type === 'lmg' || config.type === 'dmr') {
            for (let i = 0; i < 5; i++) {
                const z = -0.27 + i * 0.045;
                addBox('handguard_slot_l', [0.006, 0.018, 0.025], [-0.034, 0.01, z], matDark);
                addBox('handguard_slot_r', [0.006, 0.018, 0.025], [0.034, 0.01, z], matDark);
            }
            const cable = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.0035, 4, 12, Math.PI), rubberMat);
            cable.name = 'weapon_pressure_cable';
            cable.position.set(-0.025, 0.032, -0.2);
            cable.rotation.y = Math.PI / 2;
            group.add(cable);
        }

        if (config.type === 'smg') {
            for (let i = 0; i < 4; i++) {
                addBox('smg_foregrip_rib', [0.058, 0.006, 0.012], [0, -0.037, -0.185 + i * 0.028], matDark);
            }
            addBox('smg_charging_slot', [0.006, 0.018, 0.11], [-0.036, 0.025, -0.12], matDark);
        }

        if (config.type === 'shotgun') {
            for (let i = 0; i < 5; i++) {
                addBox('shotgun_pump_groove', [0.06, 0.007, 0.01], [0, -0.058, -0.245 + i * 0.025], matDark);
            }
            addBox('shotgun_receiver_pin_a', [0.006, 0.012, 0.035], [0.041, 0.018, 0.025], screwMat);
            addBox('shotgun_receiver_pin_b', [0.006, 0.012, 0.035], [-0.041, 0.018, 0.025], screwMat);
        }

        if (config.type === 'sniper') {
            for (const z of [-0.14, 0.14]) {
                addCyl('scope_knurled_ring', 0.038, 0.018, [0, 0.09, z], matMetal, [Math.PI / 2, 0, 0], 16);
            }
            addBox('scope_sunshade_mark', [0.034, 0.004, 0.08], [0, 0.128, -0.19], markMat);
            addBox('sniper_bolt_handle', [0.014, 0.07, 0.018], [0.06, 0.015, 0.12], matMetal, [0, 0, -0.5]);
            addCyl('sniper_bolt_knob', 0.015, 0.016, [0.082, -0.02, 0.13], matDark, null, 10);
        }

        if (config.type === 'pistol') {
            for (let i = 0; i < 5; i++) {
                addBox('pistol_slide_serration', [0.004, 0.05, 0.01], [0.029, 0.035, 0.015 + i * 0.018], matDark, [0, 0, 0.25]);
                addBox('pistol_slide_serration_l', [0.004, 0.05, 0.01], [-0.029, 0.035, 0.015 + i * 0.018], matDark, [0, 0, -0.25]);
            }
            addBox('pistol_chamber_plate', [0.038, 0.006, 0.045], [0, 0.063, -0.035], matDark);
        }

        if (config.type === 'rocket') {
            for (const z of [-0.46, -0.22, 0.02, 0.18]) {
                addCyl('rocket_tube_band', 0.058, 0.018, [0, 0, z], matDark, [Math.PI / 2, 0, 0], 16);
            }
            addBox('rocket_warning_band', [0.12, 0.012, 0.02], [0, 0.058, -0.42], amberMat);
            addBox('rocket_sight_lens', [0.006, 0.035, 0.045], [0.116, 0.092, -0.04], matGlass);
        }

        if (config.type !== 'pistol' && config.type !== 'rocket') {
            for (let i = 0; i < 3; i++) {
                addBox('grip_texture_rib', [0.044, 0.006, 0.012], [0, -0.1 - i * 0.024, 0.13 - i * 0.006], rubberMat, [0.3, 0, 0]);
            }
        }
    }

    _buildFirstPersonArms(group, config) {
        const matSkin = new THREE.MeshStandardMaterial({ color: 0xcc9966, roughness: 0.8 });
        const matSleeve = createProceduralMaterial('camo', {
            baseColor: config.name === 'AK-12' || config.name === 'UMP-45' ? 0x1a1a1a : 0x2a4a3a,
            accentColor: 0x111111,
            detailColor: 0x5d6d5d,
            size: 128,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 4,
        }, { roughness: 0.92, bumpScale: 0.01, useBump: true });
        const matGlove = createProceduralMaterial('rubber', {
            baseColor: 0x1a1a1a,
            accentColor: 0x050505,
            detailColor: 0x555555,
            size: 128,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 4,
        }, { roughness: 0.78, metalness: 0.08, bumpScale: 0.01, useBump: true });

        const armsGroup = new THREE.Group();
        armsGroup.name = 'fpArms';

        // 武器类型决定手的位置
        const isPistol = config.type === 'pistol';
        const isRocket = config.type === 'rocket';
        const isSniper = config.type === 'sniper';
        const isLMG = config.type === 'lmg';

        // 右手 - 主手（扳机手）位置
        const rightHandX = isPistol ? 0.06 : 0.08;
        const rightHandY = isPistol ? -0.04 : -0.06;
        const rightHandZ = isRocket ? 0.1 : 0.12;

        // 右前臂（袖子）
        const rightForearm = new THREE.Mesh(
            new THREE.BoxGeometry(0.07, 0.07, 0.28), matSleeve
        );
        rightForearm.position.set(rightHandX, rightHandY, rightHandZ + 0.14);
        rightForearm.rotation.x = -0.3;
        armsGroup.add(rightForearm);

        // 右手套
        const rightGlove = new THREE.Mesh(
            new THREE.BoxGeometry(0.065, 0.06, 0.1), matGlove
        );
        rightGlove.position.set(rightHandX, rightHandY, rightHandZ);
        armsGroup.add(rightGlove);

        // 右手指节
        const rightKnuckle = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.04, 0.04), matSkin
        );
        rightKnuckle.position.set(rightHandX, rightHandY + 0.01, rightHandZ - 0.06);
        armsGroup.add(rightKnuckle);

        // 左手 - 副手（护木/弹匣手）；整体挂在命名组下，换弹动画时移到弹匣位置
        if (!isPistol) {
            const leftHandZ = isLMG ? -0.1 : isSniper ? -0.15 : isRocket ? -0.2 : -0.12;
            const leftHandY = -0.05;

            const leftHandGroup = new THREE.Group();
            leftHandGroup.name = 'leftHand';

            // 左前臂
            const leftForearm = new THREE.Mesh(
                new THREE.BoxGeometry(0.07, 0.07, 0.28), matSleeve
            );
            leftForearm.position.set(-0.1, leftHandY - 0.02, leftHandZ + 0.2);
            leftForearm.rotation.x = -0.5;
            leftForearm.rotation.z = 0.2;
            leftHandGroup.add(leftForearm);

            // 左手套
            const leftGlove = new THREE.Mesh(
                new THREE.BoxGeometry(0.065, 0.06, 0.1), matGlove
            );
            leftGlove.position.set(-0.06, leftHandY, leftHandZ);
            leftGlove.rotation.z = 0.15;
            leftHandGroup.add(leftGlove);

            // 左手指节
            const leftKnuckle = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.04, 0.04), matSkin
            );
            leftKnuckle.position.set(-0.06, leftHandY + 0.01, leftHandZ - 0.06);
            leftHandGroup.add(leftKnuckle);

            armsGroup.add(leftHandGroup);
        }

        // 手腕处袖口装饰
        const cuffMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
        const rightCuff = new THREE.Mesh(
            new THREE.TorusGeometry(0.04, 0.012, 6, 10), cuffMat
        );
        rightCuff.position.set(rightHandX, rightHandY, rightHandZ + 0.06);
        rightCuff.rotation.x = Math.PI / 2;
        armsGroup.add(rightCuff);

        if (!isPistol) {
            const leftHandZ = isLMG ? -0.1 : isSniper ? -0.15 : isRocket ? -0.2 : -0.12;
            const leftCuff = new THREE.Mesh(
                new THREE.TorusGeometry(0.04, 0.012, 6, 10), cuffMat
            );
            leftCuff.position.set(-0.06, -0.05, leftHandZ + 0.06);
            leftCuff.rotation.x = Math.PI / 2;
            leftCuff.rotation.z = 0.15;
            armsGroup.add(leftCuff);
        }

        group.add(armsGroup);
    }

    // === 突击步枪模型 (M416 / AK-12 / SCAR-H) ===
    _buildRifleModel(group, config, matMetal, matStock, matPolymer, matDark) {
        const isAK = config.name === 'AK-12';
        const isSCAR = config.name === 'SCAR-H';

        // 上机匣 - 主体
        const upperReceiver = new THREE.Mesh(
            new THREE.BoxGeometry(0.07, 0.08, 0.35), matMetal
        );
        upperReceiver.position.set(0, 0.01, 0.0);
        group.add(upperReceiver);

        // 下机匣
        const lowerReceiver = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.06, 0.3), matPolymer
        );
        lowerReceiver.position.set(0, -0.05, 0.02);
        group.add(lowerReceiver);

        // 枪管
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.018, 0.45, 12), matMetal
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.35);
        group.add(barrel);

        // 消焰器
        const muzzle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.022, 0.06, 8), matDark
        );
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 0.02, -0.58);
        group.add(muzzle);

        // 护木 - AK为木质，M416为聚合物
        const handguardMat = isAK ? matStock : matPolymer;
        const handguard = new THREE.Mesh(
            new THREE.BoxGeometry(0.055, 0.05, 0.22), handguardMat
        );
        handguard.position.set(0, 0.0, -0.18);
        group.add(handguard);

        // 导气管（AK特征）
        if (isAK) {
            const gasTube = new THREE.Mesh(
                new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), matMetal
            );
            gasTube.rotation.x = Math.PI / 2;
            gasTube.position.set(0, 0.035, -0.2);
            group.add(gasTube);
        }

        // 皮卡汀尼导轨（M416/SCAR特征）
        if (!isAK) {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(0.035, 0.015, 0.22), matDark
            );
            rail.position.set(0, 0.045, -0.18);
            group.add(rail);
        }

        // 弹匣 - AK弯弹匣，M416直弹匣（挂在命名组下，换弹动画可整体拆装）
        const magGroup = new THREE.Group();
        magGroup.name = 'magazine';
        if (isAK) {
            const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.06), matPolymer);
            mag.rotation.x = -0.15;  // AK弹匣前倾
            magGroup.add(mag);
            const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.02, 0.075), matDark);
            magBase.position.set(0, -0.09, 0.01);
            magBase.rotation.x = -0.15;
            magGroup.add(magBase);
            magGroup.position.set(0, -0.16, 0.0);
        } else {
            const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.07), matPolymer);
            magGroup.add(mag);
            const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.02, 0.075), matDark);
            magBase.position.set(0, -0.09, 0);
            magGroup.add(magBase);
            magGroup.position.set(0, -0.15, -0.02);
        }
        group.add(magGroup);

        // 握把
        const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.11, 0.05), matPolymer
        );
        grip.position.set(0, -0.1, 0.12);
        grip.rotation.x = 0.35;
        group.add(grip);

        // 枪托 - 可伸缩（M416）或固定（AK）
        if (isAK) {
            const stock = new THREE.Mesh(
                new THREE.BoxGeometry(0.045, 0.06, 0.2), matStock
            );
            stock.position.set(0, -0.01, 0.28);
            group.add(stock);
            // AK枪托下沿
            const stockLobe = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.08, 0.06), matStock
            );
            stockLobe.position.set(0, -0.05, 0.38);
            group.add(stockLobe);
        } else {
            // M416/SCAR 伸缩枪托
            const stock = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.05, 0.12), matPolymer
            );
            stock.position.set(0, -0.02, 0.25);
            group.add(stock);
            // 枪托底板
            const buttpad = new THREE.Mesh(
                new THREE.BoxGeometry(0.045, 0.1, 0.02), matDark
            );
            buttpad.position.set(0, -0.02, 0.32);
            group.add(buttpad);
        }

        // 准星 - 前准星
        const frontSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, 0.04, 0.015), matDark
        );
        frontSight.position.set(0, 0.05, -0.38);
        group.add(frontSight);

        // 后准星
        const rearSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.035, 0.02), matDark
        );
        rearSight.position.set(0, 0.06, -0.05);
        group.add(rearSight);

        // 拉机柄
        const chargingHandle = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, 0.02, 0.04), matMetal
        );
        chargingHandle.position.set(0, 0.035, 0.1);
        group.add(chargingHandle);

        // SCAR-H 额外粗枪管
        if (isSCAR) {
            const heavyBarrel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.022, 0.022, 0.2, 12), matMetal
            );
            heavyBarrel.rotation.x = Math.PI / 2;
            heavyBarrel.position.set(0, 0.02, -0.45);
            group.add(heavyBarrel);
        }
    }

    // === 轻机枪模型 (M249) ===
    _buildLMGModel(group, config, matMetal, matStock, matPolymer, matDark) {
        // 主体 - 更长更粗
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.10, 0.45), matMetal
        );
        body.position.set(0, 0.01, 0);
        group.add(body);

        // 重型枪管
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.028, 0.45, 12), matDark
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.4);
        group.add(barrel);

        // 消焰器
        const flashHider = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.035, 0.08, 8), matDark
        );
        flashHider.rotation.x = Math.PI / 2;
        flashHider.position.set(0, 0.02, -0.65);
        group.add(flashHider);

        // 大弹鼓 - M249标志（命名组，换弹时整体拆装）
        const magGroup = new THREE.Group();
        magGroup.name = 'magazine';
        const drum = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16), matPolymer
        );
        drum.rotation.x = Math.PI / 2;
        magGroup.add(drum);
        const drumCenter = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.07, 8), matMetal
        );
        drumCenter.rotation.x = Math.PI / 2;
        magGroup.add(drumCenter);
        magGroup.position.set(0, -0.06, -0.05);
        group.add(magGroup);

        // 握把
        const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.12, 0.05), matPolymer
        );
        grip.position.set(0, -0.08, 0.12);
        grip.rotation.x = 0.2;
        group.add(grip);

        // 枪托
        const stock = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.08, 0.2), matPolymer
        );
        stock.position.set(0, 0, 0.28);
        group.add(stock);

        // 双脚架（收起状态）
        const bipodLeft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.15, 4), matDark
        );
        bipodLeft.rotation.z = 0.3;
        bipodLeft.position.set(-0.03, -0.06, -0.3);
        group.add(bipodLeft);

        const bipodRight = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.15, 4), matDark
        );
        bipodRight.rotation.z = -0.3;
        bipodRight.position.set(0.03, -0.06, -0.3);
        group.add(bipodRight);

        // 提把
        const carryHandle = new THREE.Mesh(
            new THREE.TorusGeometry(0.04, 0.008, 6, 8, Math.PI), matMetal
        );
        carryHandle.position.set(0, 0.07, 0);
        carryHandle.rotation.x = Math.PI;
        group.add(carryHandle);

        // 准星
        const frontSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.04, 0.01), matDark
        );
        frontSight.position.set(0, 0.06, -0.55);
        group.add(frontSight);
    }

    // === 精准射手步枪模型 (SKS) ===
    _buildDMRModel(group, config, matMetal, matStock, matPolymer, matDark, matGlass) {
        // 主体
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.07, 0.08, 0.38), matMetal
        );
        body.position.set(0, 0.01, 0);
        group.add(body);

        // 枪管
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.02, 0.4, 12), matDark
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.35);
        group.add(barrel);

        // 枪口制退器
        const muzzleBrake = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8), matMetal
        );
        muzzleBrake.rotation.x = Math.PI / 2;
        muzzleBrake.position.set(0, 0.02, -0.58);
        group.add(muzzleBrake);

        // 中倍率瞄准镜
        const scopeBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.022, 0.022, 0.18, 12), matDark
        );
        scopeBody.rotation.x = Math.PI / 2;
        scopeBody.position.set(0, 0.07, -0.02);
        group.add(scopeBody);

        // 镜片
        const scopeLens = new THREE.Mesh(
            new THREE.CircleGeometry(0.02, 12), matGlass
        );
        scopeLens.position.set(0, 0.07, -0.11);
        scopeLens.rotation.y = Math.PI;
        group.add(scopeLens);

        // 弹匣
        const mag = new THREE.Mesh(
            new THREE.BoxGeometry(0.035, 0.1, 0.06), matPolymer
        );
        mag.name = 'magazine';
        mag.position.set(0, -0.07, 0);
        mag.rotation.x = -0.1;
        group.add(mag);

        // 木质护手 - SKS特色
        const woodHandguard = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.04, 0.2), matStock
        );
        woodHandguard.position.set(0, 0, -0.18);
        group.add(woodHandguard);

        // 握把
        const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.035, 0.1, 0.04), matStock
        );
        grip.position.set(0, -0.07, 0.12);
        grip.rotation.x = 0.2;
        group.add(grip);

        // 枪托
        const stock = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.07, 0.22), matStock
        );
        stock.position.set(0, 0, 0.27);
        group.add(stock);

        // 准星
        const frontSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.008, 0.035, 0.008), matDark
        );
        frontSight.position.set(0, 0.055, -0.5);
        group.add(frontSight);
    }

    // === 冲锋枪模型 (MP5 / UMP-45) ===
    _buildSMGModel(group, config, matMetal, matStock, matPolymer, matDark) {
        const isUMP = config.name === 'UMP-45';

        // 机匣
        const receiver = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.08, 0.25), matMetal
        );
        receiver.position.set(0, 0.0, 0.0);
        group.add(receiver);

        // 枪管
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.014, 0.014, 0.25, 10), matMetal
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.0, -0.22);
        group.add(barrel);

        // MP5前护木带散热孔
        const handguard = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.045, 0.12), matPolymer
        );
        handguard.position.set(0, -0.01, -0.15);
        group.add(handguard);

        // 消音器（MP5特征）
        if (!isUMP) {
            const suppressor = new THREE.Mesh(
                new THREE.CylinderGeometry(0.022, 0.022, 0.12, 12), matDark
            );
            suppressor.rotation.x = Math.PI / 2;
            suppressor.position.set(0, 0.0, -0.36);
            group.add(suppressor);
        } else {
            // UMP消焰器
            const flashHider = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.018, 0.05, 8), matDark
            );
            flashHider.rotation.x = Math.PI / 2;
            flashHider.position.set(0, 0.0, -0.38);
            group.add(flashHider);
        }

        // 弹匣 - MP5弯弹匣
        const magGeo = new THREE.BoxGeometry(0.035, 0.16, 0.05);
        const mag = new THREE.Mesh(magGeo, isUMP ? matPolymer : matStock);
        mag.name = 'magazine';
        mag.position.set(0, -0.14, -0.02);
        mag.rotation.x = -0.1;
        group.add(mag);

        // 握把
        const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.038, 0.1, 0.045), matPolymer
        );
        grip.position.set(0, -0.09, 0.1);
        grip.rotation.x = 0.3;
        group.add(grip);

        // MP5特征：枪管上方护手/导轨
        if (!isUMP) {
            const topRail = new THREE.Mesh(
                new THREE.BoxGeometry(0.025, 0.015, 0.15), matDark
            );
            topRail.position.set(0, 0.05, -0.1);
            group.add(topRail);
        }

        // 枪托 - MP5固定枪托
        if (!isUMP) {
            const stock = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.06, 0.16), matStock
            );
            stock.position.set(0, -0.01, 0.22);
            group.add(stock);
            const stockEnd = new THREE.Mesh(
                new THREE.BoxGeometry(0.045, 0.09, 0.03), matStock
            );
            stockEnd.position.set(0, -0.02, 0.3);
            group.add(stockEnd);
        } else {
            // UMP伸缩枪托
            const stock = new THREE.Mesh(
                new THREE.BoxGeometry(0.038, 0.04, 0.1), matPolymer
            );
            stock.position.set(0, -0.01, 0.2);
            group.add(stock);
            const buttpad = new THREE.Mesh(
                new THREE.BoxGeometry(0.042, 0.08, 0.02), matDark
            );
            buttpad.position.set(0, -0.01, 0.26);
            group.add(buttpad);
        }

        // 准星
        const frontSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.012, 0.035, 0.012), matDark
        );
        frontSight.position.set(0, 0.045, -0.25);
        group.add(frontSight);

        // 后准星
        const rearSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.025, 0.03, 0.018), matDark
        );
        rearSight.position.set(0, 0.05, 0.05);
        group.add(rearSight);

        // 扳机护圈
        const triggerGuard = new THREE.Mesh(
            new THREE.TorusGeometry(0.025, 0.005, 6, 8, Math.PI), matDark
        );
        triggerGuard.rotation.x = Math.PI / 2;
        triggerGuard.position.set(0, -0.07, 0.06);
        group.add(triggerGuard);
    }

    // === 狙击步枪模型 (L96 / M40A5) ===
    _buildSniperModel(group, config, matMetal, matStock, matPolymer, matDark, matGlass) {
        // 长枪管
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.016, 0.016, 0.6, 12), matMetal
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.4);
        group.add(barrel);

        // 枪口制退器
        const muzzleBrake = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.08, 8), matDark
        );
        muzzleBrake.rotation.x = Math.PI / 2;
        muzzleBrake.position.set(0, 0.02, -0.72);
        group.add(muzzleBrake);

        // 机匣
        const receiver = new THREE.Mesh(
            new THREE.BoxGeometry(0.07, 0.09, 0.35), matMetal
        );
        receiver.position.set(0, 0.0, 0.05);
        group.add(receiver);

        // 狙击镜 - 详细建模
        const scopeGroup = new THREE.Group();
        // 镜筒
        const scopeTube = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 0.28, 16), matDark
        );
        scopeTube.rotation.x = Math.PI / 2;
        scopeGroup.add(scopeTube);
        // 前镜片
        const frontLens = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16), matGlass
        );
        frontLens.rotation.x = Math.PI / 2;
        frontLens.position.z = -0.14;
        scopeGroup.add(frontLens);
        // 后镜片
        const rearLens = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.028, 0.01, 16), matGlass
        );
        rearLens.rotation.x = Math.PI / 2;
        rearLens.position.z = 0.14;
        scopeGroup.add(rearLens);
        // 调节旋钮
        const windage = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.025, 8), matMetal
        );
        windage.position.y = 0.04;
        scopeGroup.add(windage);
        const elevation = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.025, 8), matMetal
        );
        elevation.rotation.z = Math.PI / 2;
        elevation.position.x = 0.04;
        scopeGroup.add(elevation);
        // 镜架
        const scopeMount1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.03, 0.02), matMetal
        );
        scopeMount1.position.set(0, -0.035, -0.1);
        scopeGroup.add(scopeMount1);
        const scopeMount2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.03, 0.02), matMetal
        );
        scopeMount2.position.set(0, -0.035, 0.1);
        scopeGroup.add(scopeMount2);

        scopeGroup.position.set(0, 0.09, 0.0);
        group.add(scopeGroup);

        // 弹匣
        const mag = new THREE.Mesh(
            new THREE.BoxGeometry(0.045, 0.08, 0.08), matPolymer
        );
        mag.name = 'magazine';
        mag.position.set(0, -0.08, 0.05);
        group.add(mag);

        // 枪托 - 狙击枪有大型枪托
        const stock = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.08, 0.28), matStock
        );
        stock.position.set(0, -0.03, 0.3);
        group.add(stock);
        // 枪托底板（厚缓冲垫）
        const buttpad = new THREE.Mesh(
            new THREE.BoxGeometry(0.055, 0.12, 0.03), matPolymer
        );
        buttpad.position.set(0, -0.03, 0.45);
        group.add(buttpad);
        // 枪托贴腮板
        const cheekRiser = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.03, 0.12), matPolymer
        );
        cheekRiser.position.set(0, 0.04, 0.3);
        group.add(cheekRiser);

        // 握把
        const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.1, 0.05), matPolymer
        );
        grip.position.set(0, -0.08, 0.15);
        grip.rotation.x = 0.3;
        group.add(grip);

        // 扳机
        const trigger = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.03, 0.01), matMetal
        );
        trigger.position.set(0, -0.06, 0.12);
        group.add(trigger);
    }

    // === 霰弹枪模型 (M870) ===
    _buildShotgunModel(group, config, matMetal, matStock, matPolymer, matDark) {
        // 双管式枪管（上方+下方弹仓管）
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.022, 0.022, 0.5, 12), matMetal
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.03, -0.3);
        group.add(barrel);

        // 弹仓管
        const magTube = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.018, 0.4, 12), matMetal
        );
        magTube.rotation.x = Math.PI / 2;
        magTube.position.set(0, -0.015, -0.25);
        group.add(magTube);

        // 枪口
        const muzzle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.025, 0.04, 8), matDark
        );
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 0.03, -0.55);
        group.add(muzzle);

        // 机匣
        const receiver = new THREE.Mesh(
            new THREE.BoxGeometry(0.07, 0.08, 0.25), matMetal
        );
        receiver.position.set(0, 0.0, 0.0);
        group.add(receiver);

        // 泵动护木
        const pump = new THREE.Mesh(
            new THREE.BoxGeometry(0.055, 0.05, 0.1), matStock
        );
        pump.position.set(0, -0.03, -0.2);
        group.add(pump);
        // 泵动纹路
        const pumpRib1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.058, 0.005, 0.01), matDark
        );
        pumpRib1.position.set(0, -0.04, -0.22);
        group.add(pumpRib1);
        const pumpRib2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.058, 0.005, 0.01), matDark
        );
        pumpRib2.position.set(0, -0.04, -0.2);
        group.add(pumpRib2);
        const pumpRib3 = new THREE.Mesh(
            new THREE.BoxGeometry(0.058, 0.005, 0.01), matDark
        );
        pumpRib3.position.set(0, -0.04, -0.18);
        group.add(pumpRib3);

        // 弹仓底盖
        const magCap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8), matDark
        );
        magCap.rotation.x = Math.PI / 2;
        magCap.position.set(0, -0.015, -0.46);
        group.add(magCap);

        // 握把
        const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.045, 0.12, 0.06), matStock
        );
        grip.position.set(0, -0.1, 0.15);
        grip.rotation.x = 0.35;
        group.add(grip);

        // 枪托
        const stock = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.08, 0.25), matStock
        );
        stock.position.set(0, -0.03, 0.28);
        group.add(stock);
        // 枪托底板
        const buttpad = new THREE.Mesh(
            new THREE.BoxGeometry(0.055, 0.1, 0.025), matPolymer
        );
        buttpad.position.set(0, -0.03, 0.41);
        group.add(buttpad);

        // 准星珠
        const bead = new THREE.Mesh(
            new THREE.SphereGeometry(0.008, 8, 6), matMetal
        );
        bead.position.set(0, 0.06, -0.5);
        group.add(bead);
    }

    // === 手枪模型 (P226 / MP443) ===
    _buildPistolModel(group, config, matMetal, matStock, matDark) {
        // 滑套
        const slide = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.06, 0.22), matMetal
        );
        slide.position.set(0, 0.03, -0.04);
        group.add(slide);

        // 枪管（前端露出）
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8), matDark
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.03, -0.16);
        group.add(barrel);

        // 枪身框架
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(0.045, 0.04, 0.18), matStock
        );
        frame.position.set(0, -0.01, -0.02);
        group.add(frame);

        // 握把
        const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.12, 0.06), matStock
        );
        grip.position.set(0, -0.09, 0.04);
        grip.rotation.x = 0.2;
        group.add(grip);

        // 弹匣底板（手枪弹匣藏于握把内，仅底板可见，命名后换弹可抽出）
        const magBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.042, 0.015, 0.062), matDark
        );
        magBase.name = 'magazine';
        magBase.position.set(0, -0.15, 0.06);
        magBase.rotation.x = 0.2;
        group.add(magBase);

        // 准星
        const frontSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.008, 0.015, 0.008), matDark
        );
        frontSight.position.set(0, 0.07, -0.14);
        group.add(frontSight);

        // 照门
        const rearSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.025, 0.012, 0.012), matDark
        );
        rearSight.position.set(0, 0.065, 0.06);
        group.add(rearSight);

        // 扳机护圈
        const triggerGuard = new THREE.Mesh(
            new THREE.TorusGeometry(0.02, 0.004, 6, 8, Math.PI), matStock
        );
        triggerGuard.rotation.x = Math.PI / 2;
        triggerGuard.position.set(0, -0.03, -0.02);
        group.add(triggerGuard);

        // 扳机
        const trigger = new THREE.Mesh(
            new THREE.BoxGeometry(0.008, 0.025, 0.008), matDark
        );
        trigger.position.set(0, -0.02, 0.0);
        group.add(trigger);
    }

    // === 火箭筒模型 (RPG-7 / SMAW) ===
    _buildRocketModel(group, config, matMetal, matStock, matDark) {
        // 发射筒
        const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.055, 0.85, 16), matMetal
        );
        tube.rotation.x = Math.PI / 2;
        tube.position.set(0, 0, -0.2);
        group.add(tube);

        // 筒口
        const tubeMuzzle = new THREE.Mesh(
            new THREE.TorusGeometry(0.058, 0.008, 8, 16), matDark
        );
        tubeMuzzle.position.set(0, 0, -0.62);
        tubeMuzzle.rotation.x = Math.PI / 2;
        group.add(tubeMuzzle);

        // 筒尾
        const tubeEnd = new THREE.Mesh(
            new THREE.ConeGeometry(0.07, 0.12, 16), matMetal
        );
        tubeEnd.rotation.x = -Math.PI / 2;
        tubeEnd.position.set(0, 0, 0.23);
        group.add(tubeEnd);

        // 前握把
        const frontGrip = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.1, 0.05), matStock
        );
        frontGrip.position.set(0, -0.08, -0.15);
        group.add(frontGrip);

        // 后握把/扳机
        const rearGrip = new THREE.Mesh(
            new THREE.BoxGeometry(0.045, 0.12, 0.06), matStock
        );
        rearGrip.position.set(0, -0.1, 0.1);
        rearGrip.rotation.x = 0.25;
        group.add(rearGrip);

        // 瞄准器
        const sight = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.06, 0.03), matDark
        );
        sight.position.set(0, 0.07, 0.0);
        group.add(sight);

        // 火箭弹头（前端露出）
        const warhead = new THREE.Mesh(
            new THREE.ConeGeometry(0.04, 0.12, 12), matDark
        );
        warhead.rotation.x = Math.PI / 2;
        warhead.position.set(0, 0, -0.7);
        group.add(warhead);

        // RPG-7 特有的锥形弹头
        if (config.name === 'RPG-7') {
            const ogive = new THREE.Mesh(
                new THREE.ConeGeometry(0.035, 0.08, 12), matMetal
            );
            ogive.rotation.x = -Math.PI / 2;
            ogive.position.set(0, 0, -0.75);
            group.add(ogive);
        }
    }

    _showWeaponModel(idx) {
        for (let i = 0; i < this.weapons.length; i++) {
            if (this.weaponModels[i]) {
                this.weaponModels[i].visible = (i === idx);
            }
        }
    }

    switchWeapon(idx) {
        if (idx < 0 || idx >= this.weapons.length) return;
        if (idx === this.currentWeaponIdx) return;
        if (this.isReloading) return;
        // 启动切换动画
        this.switchAnimTimer = this.switchAnimDuration;
        this._pendingSwitchIdx = idx;
        if (this.audio) this.audio.playUISound('click');
    }

    // 实际执行武器切换
    _doSwitchWeapon(idx) {
        this.currentWeaponIdx = idx;
        this.currentWeapon = this.weapons[idx];
        this._showWeaponModel(idx);
    }

    startFire() {
        this.isFiring = true;
    }

    stopFire() {
        this.isFiring = false;
        this._canFireSemi = true; // 松开鼠标后允许下次半自动射击
    }

    _getAvailableFireModes(config) {
        if (config.fireModes && config.fireModes.length > 0) return config.fireModes;
        return config.auto ? ['auto', 'semi'] : ['semi'];
    }

    _getDefaultFireMode(config) {
        const modes = this._getAvailableFireModes(config);
        if (config.defaultFireMode && modes.includes(config.defaultFireMode)) return config.defaultFireMode;
        return modes[0] || 'semi';
    }

    getCurrentFireMode() {
        if (!this.currentWeapon) return 'semi';
        const modes = this._getAvailableFireModes(this.currentWeapon.config);
        if (!modes.includes(this.currentWeapon.fireMode)) {
            this.currentWeapon.fireMode = this._getDefaultFireMode(this.currentWeapon.config);
        }
        return this.currentWeapon.fireMode;
    }

    isHeldFireMode() {
        return this.getCurrentFireMode() === 'auto';
    }

    toggleFireMode() {
        if (!this.currentWeapon || this.isReloading || this.switchAnimTimer > 0) return null;
        const modes = this._getAvailableFireModes(this.currentWeapon.config);
        if (modes.length <= 1) return null;

        const current = this.getCurrentFireMode();
        const nextIdx = (modes.indexOf(current) + 1) % modes.length;
        this.currentWeapon.fireMode = modes[nextIdx];
        this.stopFire();
        if (this.audio) this.audio.playUISound('click');
        return this.getFireModeLabel();
    }

    getFireModeLabel() {
        const labels = { auto: '自动', semi: '单发' };
        return labels[this.getCurrentFireMode()] || this.getCurrentFireMode();
    }

    // 半自动单发射击 - 只在每次按下时触发一次
    tryFireOnce() {
        if (!this._canFireSemi) return;
        this._canFireSemi = false;
        const now = performance.now() / 1000;
        this.tryFire(now);
    }

    toggleAim() {
        this.isAiming = !this.isAiming;
    }

    setAiming(aiming) {
        this.isAiming = aiming;
    }

    canHoldBreath() {
        return !!(this.currentWeapon && this.currentWeapon.config.holdBreath);
    }

    reload() {
        if (this.isReloading) return;
        if (this.switchAnimTimer > 0) return;  // 切枪动画中不允许换弹，避免补弹给错误武器
        if (!this.currentWeapon) return;
        if (this.currentWeapon.ammoInMag >= this.currentWeapon.config.magSize) return;
        if (this.currentWeapon.reserveAmmo <= 0) return;

        this.isReloading = true;
        this.reloadTimer = this.currentWeapon.config.reloadTime;
        this.reloadDuration = this.currentWeapon.config.reloadTime;
        if (this.audio) this.audio.playReload(this.currentWeapon.config.soundType || this.currentWeapon.config.type, this.reloadDuration);

        // 弹匣类武器：换弹开始约 30% 时掉落空弹匣（视觉细节）
        const type = this.currentWeapon.config.type;
        if (type !== 'shotgun' && type !== 'rocket') {
            const delay = this.reloadDuration * 0.3 * 1000;
            const weaponIdx = this.currentWeaponIdx;
            const magTimer = setTimeout(() => {
                if (!this._disposed && this.currentWeaponIdx === weaponIdx && this.isReloading) this._dropMagazine();
            }, delay);
            this._pendingTimeouts.push(magTimer);
        }
    }

    // 从枪口下方掉落一个空弹匣（带重力/弹跳物理，复用 isShell 更新路径）
    _dropMagazine() {
        const model = this.weaponModels[this.currentWeaponIdx];
        if (!model) return;
        this._pruneImpacts(1);
        const type = this.currentWeapon?.config?.type || 'rifle';
        const magSize = type === 'pistol' ? [0.03, 0.10, 0.05] :
            type === 'lmg' ? [0.09, 0.14, 0.12] : [0.04, 0.16, 0.07];
        const mag = new THREE.Mesh(
            new THREE.BoxGeometry(...magSize),
            new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.6, metalness: 0.5, transparent: true })
        );
        const pos = this._muzzlePos;
        model.getWorldPosition(pos);
        pos.y -= 0.15;
        mag.position.copy(pos);
        mag.rotation.set(Math.random(), Math.random(), Math.random());
        this.scene.add(mag);
        this.impacts.push({
            mesh: mag,
            life: 5,
            maxLife: 5,
            isShell: true,
            velocity: new THREE.Vector3((Math.random() - 0.5) * 0.6, -0.8, (Math.random() - 0.5) * 0.6),
            angularVel: new THREE.Vector3(Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2),
        });
    }

    // 射击逻辑
    tryFire(now) {
        if (!this.currentWeapon || this.isReloading) return false;
        // 泵动枪械（M870）射击后必须完成泵动周期才能再次击发
        if (this._pumpTimer > 0) return false;
        // 移除切换动画期间不能射击的限制（开枪无限制）
        // 切换动画仍然播放（纯视觉），但不阻挡射击输入

        const config = this.currentWeapon.config;
        const interval = 60 / config.fireRate; // 秒/发

        if (now - this.lastFireTime < interval) return false;
        if (this.currentWeapon.ammoInMag <= 0) {
            // 自动换弹
            this.reload();
            return false;
        }

        this.lastFireTime = now;
        this.currentWeapon.ammoInMag--;
        this.shotsFired++;

        // 泵动霰弹枪：射击后进入泵动周期并播放护木后拉动画
        if (config.pumpAction) {
            this._pumpTimer = 0.45;
            this._pumpKick = 1;
        }

        // 播放枪声 - 复用临时向量
        const playerPos = this._tmpVec1;
        this.camera.getWorldPosition(playerPos);
        if (this.audio) {
            this.audio.playGunshot(config.soundType || config.type, playerPos, true);
            // 低弹药提示：最后 25% 弹匣每发附加干涩机械声（战地风格的换弹提醒）
            if (this.currentWeapon.ammoInMag <= Math.max(2, config.magSize * 0.25) && config.magSize > 5) {
                this.audio.playLowAmmoClick();
            }
        }

        // 射击
        if (config.pellets && config.pellets > 1) {
            // 霰弹枪 - 多弹丸
            for (let i = 0; i < config.pellets; i++) {
                this._fireRaycast(config, i);
            }
        } else if (config.explosive) {
            // 火箭弹 - 抛射物
            this._fireRocket(config);
        } else {
            this._fireRaycast(config);
        }

        const stabilityMultiplier = this._getStabilityMultiplier(config);

        // === 后坐力系统 ===
        // 首发后坐力较小（前几发更准确），后续递增
        const recoilScale = (1.0 + Math.min(this.shotsFired * 0.08, 0.6)) * stabilityMultiplier;
        // 后坐力模式：垂直向上 + 按武器 pattern 生成水平轨迹
        const shots = this.shotsFired;
        const off = this.recoilPatternOffset;
        let patternX;
        switch (config.recoil.pattern) {
            case 'climb':   // 水平逐渐向一侧漂移（扫射越打越偏）
                patternX = Math.sin(shots * 0.5 + off) * 0.4 + 0.25 * Math.sin(shots * 0.2 + off * 0.7);
                break;
            case 'tight':   // 紧凑小幅摆动，可控性好
                patternX = Math.sin(shots * 1.1 + off) * 0.35;
                break;
            case 'sniper':  // 垂直主导，水平几乎无偏移
                patternX = (Math.random() - 0.5) * 0.15;
                break;
            case 'kick':    // 大范围横扫（霰弹/火箭筒）
                patternX = Math.sin(shots * 0.45 + off) * 0.9 + (Math.random() - 0.5) * 0.4;
                break;
            default:        // 'linear'：对称正弦摆动
                patternX = Math.sin(shots * 0.7 + off) * 0.6 + (Math.random() - 0.5) * 0.4;
        }
        this.pendingRecoil.x += patternX * config.recoil.x * recoilScale;
        this.pendingRecoil.y += config.recoil.y * recoilScale;

        // 累积后坐力（用于恢复）
        this.accumulatedRecoil.x += patternX * config.recoil.x * recoilScale;
        this.accumulatedRecoil.y += config.recoil.y * recoilScale;

        // 武器模型视觉后坐力
        this.recoilOffset.x = patternX * config.recoil.x * recoilScale;
        this.recoilOffset.y = config.recoil.y * recoilScale;

        // 扩散累积 - 每发增加扩散，有上限
        const spreadAdd = config.type === 'smg' ? 0.004 : config.type === 'rifle' ? 0.003 : 0.002;
        this.spreadAccumulation = Math.min(this.spreadAccumulation + spreadAdd * stabilityMultiplier, config.spread * 3);

        // 枪口闪光
        this._showMuzzleFlash();

        // 弹壳抛出特效
        this._ejectShell(config);

        return true;
    }

    // 弹壳抛出特效
    _ejectShell(config) {
        const model = this.weaponModels[this.currentWeaponIdx];
        if (!model) return;

        // 获取弹壳抛出位置（武器模型右侧上方）- 复用临时向量
        const ejectPos = this._tmpVec1;
        model.getWorldPosition(ejectPos);
        ejectPos.x += 0.1; // 右侧
        ejectPos.y += 0.05; // 略高

        // 弹壳mesh - 使用缓存的几何体和材质
        const isPistol = config.type === 'pistol';
        const shellGeo = isPistol ? this._shellGeoPistol : this._shellGeoRifle;
        const shell = new THREE.Mesh(shellGeo, this._shellMat);
        shell.position.copy(ejectPos);
        shell.rotation.set(Math.random(), Math.random(), Math.random());
        this.scene.add(shell);

        // 弹壳速度 - 向右上方飞出+旋转（不能复用临时向量，因为需要长期保存）
        const velocity = new THREE.Vector3(
            2 + Math.random() * 2,    // 向右
            1.5 + Math.random() * 1,   // 向上
            (Math.random() - 0.5) * 1  // 微小前后
        );
        // 根据相机朝向旋转速度
        velocity.applyQuaternion(this.camera.quaternion);

        const angularVel = new THREE.Vector3(
            Math.random() * 20,
            Math.random() * 20,
            Math.random() * 20
        );

        this.impacts.push({
            mesh: shell,
            life: 1.5,
            maxLife: 1.5,
            isShell: true,
            velocity: velocity,
            angularVel: angularVel,
            sharedMat: true,
            sharedGeo: true,
        });
    }

    _fireRaycast(config, pelletIdx = 0) {
        const origin = this._tmpOrigin;
        this.camera.getWorldPosition(origin);
        const direction = this._tmpDir;
        this.camera.getWorldDirection(direction);

        // 计算枪口位置（用于弹道可视化，让弹道从枪口出来而非相机位置）
        const tracerStart = this._muzzlePos;
        const weaponModel = this.weaponModels[this.currentWeaponIdx] || this.weaponGroup;
        if (weaponModel) {
            weaponModel.getWorldPosition(tracerStart);
            const fwd = this._forwardVec.set(0, 0, -1);
            fwd.applyQuaternion(weaponModel.getWorldQuaternion(this._tmpQuat));
            tracerStart.add(fwd.multiplyScalar(0.5));
        } else {
            tracerStart.copy(origin);
        }

        // === 扩散系统（复刻BF手感）===
        // 瞄准时使用专门的ADS扩散
        let baseSpread = this.isAiming ? (config.spreadAds || config.spread * 0.25) : config.spread;
        // 移动时使用专门的移动扩散
        if (this._isMoving) baseSpread = this.isAiming ? (config.spreadMove || config.spread) * 0.6 : (config.spreadMove || config.spread * 1.8);
        // 空中扩散更大
        if (this._isAirborne) baseSpread *= 3.0;
        // 蹲伏减少扩散
        if (this._isCrouching) baseSpread *= 0.7;
        // 趴下和架枪进一步稳定
        if (this._isProne) baseSpread *= 0.55;
        if (this.isBraced) baseSpread *= 0.45;
        if (this.isHoldingBreath && config.holdBreath && this.isAiming) baseSpread *= 0.25;

        // 首发精度奖励 - 前两发扩散极小
        let firstShotBonus = 1.0;
        if (this.shotsFired <= 2) firstShotBonus = 0.4;
        else if (this.shotsFired <= 5) firstShotBonus = 0.7;

        const totalSpread = (baseSpread + this.spreadAccumulation) * firstShotBonus;
        // 不同武器散布模式不同
        const spreadAngle = totalSpread;
        // 霰弹枪散布为圆形，其他武器散布偏向纵向
        if (config.type === 'shotgun') {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * spreadAngle;
            direction.x += Math.cos(angle) * radius;
            direction.y += Math.sin(angle) * radius;
        } else {
            direction.x += (Math.random() - 0.5) * spreadAngle * 2;
            direction.y += (Math.random() - 0.5) * spreadAngle * 1.5; // 纵向略小
            direction.z += (Math.random() - 0.5) * spreadAngle;
        }
        direction.normalize();

        // 射线检测 - 复用raycaster（使用 .set() 正确设置 ray 的 origin 和 direction）
        this._fireRaycaster.set(origin, direction);
        this._fireRaycaster.near = 0.08;
        this._fireRaycaster.far = config.range;

        // 收集所有可被击中的目标
        const targets = [];
        // 世界障碍物
        const worldMeshes = this.world.getShootableMeshes();
        for (const m of worldMeshes) targets.push(m);

        // 敌方角色
        if (this.cb.getTargets) {
            const charTargets = this.cb.getTargets();
            for (const t of charTargets) {
                if (t.mesh) targets.push(t.mesh);
            }
        }

        const initialIntersects = this._fireRaycaster.intersectObjects(targets, true);

        // === 弹道下坠计算 ===
        // 对 hitscan 武器进行两阶段检测：先确定距离，再根据子弹速度和重力计算下坠量
        let intersects = initialIntersects;
        if (config.bulletDrop && config.bulletSpeed && initialIntersects.length > 0) {
            const hitDist = initialIntersects[0].distance;
            if (hitDist > 5) {
                const timeOfFlight = hitDist / config.bulletSpeed;
                const drop = 0.5 * config.bulletDrop * timeOfFlight * timeOfFlight;
                if (drop > 0.05) {
                    // 计算下坠角度，绕水平轴向下旋转弹道方向
                    const dropAngle = Math.atan2(drop, hitDist);
                    const right = this._tmpVec1.crossVectors(direction, this._tmpUp).normalize();
                    const adjustedDir = this._tmpVec2.copy(direction).applyAxisAngle(right, -dropAngle);

                    // 用调整后的方向重新检测 - 复用raycaster
                    this._dropRaycaster.set(origin, adjustedDir);
                    this._dropRaycaster.near = 0.08;
                    this._dropRaycaster.far = config.range;
                    const dropIntersects = this._dropRaycaster.intersectObjects(targets, true);
                    if (dropIntersects.length > 0) {
                        intersects = dropIntersects;
                    }
                }
            }
        }

        this._processRaycastHits(intersects, origin, direction, config, tracerStart);
    }

    // 检查物体是否可被子弹穿透
    _processRaycastHits(intersects, origin, direction, config, tracerStart) {
        // 计算弹道下坠量（用于曲线曳光弹可视化）
        const _calcDrop = (hitDist) => {
            if (!config.bulletDrop || !config.bulletSpeed || hitDist <= 5) return 0;
            const tof = hitDist / config.bulletSpeed;
            return 0.5 * config.bulletDrop * tof * tof;
        };

        if (!intersects || intersects.length === 0) {
            const endPoint = this._tmpVec3.copy(origin).add(direction.clone().multiplyScalar(config.range));
            let drop = 0;
            if (config.bulletDrop && config.bulletSpeed) {
                const tof = config.range / config.bulletSpeed;
                drop = 0.5 * config.bulletDrop * tof * tof;
                endPoint.y -= drop;
            }
            this._createTracer(tracerStart, endPoint, config.tracerColor, drop);
            return;
        }

        let hitCharacter = null;
        let hitCharacterPoint = null;
        let hitCharacterDistance = Infinity;
        let hitWorldPoint = null;
        let blocked = false;
        let penetrationScale = 1;
        let lastPenetrablePoint = null;
        const processedPenetrables = new Set();
        const supportInfo = this._getCurrentSupportInfo(origin);

        const calcDamage = (distance, scale = 1) => {
            let damage = config.damage * scale;
            const falloffStart = config.falloffStart || config.range * 0.5;
            const falloffEnd = config.falloffEnd || config.range;
            const minDamage = config.minDamage || config.damage * 0.5;
            if (distance > falloffStart) {
                const t = Math.min(1, (distance - falloffStart) / Math.max(0.001, falloffEnd - falloffStart));
                damage = damage + (minDamage - damage) * t;
            }
            return damage;
        };

        for (const hit of intersects) {
            if (!hit || !hit.object || hit.object.visible === false || hit.object.userData?.broken) continue;
            if (processedPenetrables.has(hit.object)) continue;
            if (this._shouldIgnoreCurrentSupportHit(hit, supportInfo, origin)) continue;
            if (this._shouldIgnoreShooterLocalWorldHit(hit, origin, direction, supportInfo)) continue;
            if (this._shouldIgnoreNonBlockingWorldHit(hit)) continue;

            const character = this._getCharacterFromObject(hit.object);
            if (character) {
                hitCharacter = character;
                hitCharacterPoint = hit.point;
                hitCharacterDistance = hit.distance;
                break;
            }

            const canPenetrate = this._canPenetrate(hit.object);
            this._createImpact(hit.point, hit.face ? hit.face.normal : null, hit.object, config);
            if (this.cb.onWorldHit) {
                this.cb.onWorldHit(hit.object, config.damage * penetrationScale, this.currentWeapon.name, hit.point, config);
            }

            if (this._isGlassHit(hit.object)) {
                processedPenetrables.add(hit.object);
                penetrationScale *= 0.82;
                lastPenetrablePoint = hit.point;
                continue;
            }

            if (!canPenetrate) {
                hitWorldPoint = hit.point;
                blocked = true;
                break;
            }

            processedPenetrables.add(hit.object);
            penetrationScale *= 0.55;
            lastPenetrablePoint = hit.point;
        }

        if (hitCharacter) {
            const damage = calcDamage(hitCharacterDistance, penetrationScale);
            const isHeadshot = hitCharacterPoint.y > hitCharacter.position.y + 1.5;
            // 爆头伤害倍率根据武器类型差异化（狙击枪一枪爆头，手枪爆头加成低）
            let headshotMultiplier = 2.0;
            if (config.headshotMultiplier !== undefined) {
                headshotMultiplier = config.headshotMultiplier;
            } else {
                switch (config.type) {
                    case 'sniper': headshotMultiplier = 2.5; break;   // 狙击枪：2.5x
                    case 'dmr': headshotMultiplier = 2.2; break;       // DMR：2.2x
                    case 'rifle': headshotMultiplier = 2.0; break;     // 步枪：2.0x
                    case 'lmg': headshotMultiplier = 1.8; break;       // LMG：1.8x
                    case 'smg': headshotMultiplier = 1.7; break;       // 冲锋枪：1.7x
                    case 'shotgun': headshotMultiplier = 1.5; break;   // 霰弹枪：1.5x
                    case 'pistol': headshotMultiplier = 1.5; break;    // 手枪：1.5x
                }
            }
            const finalDamage = isHeadshot ? damage * headshotMultiplier : damage;

            if (this.cb.onHit) {
                this.cb.onHit(hitCharacter, finalDamage, isHeadshot, this.currentWeapon.name, hitCharacterPoint);
            }
            // 命中音效由 Game._onPlayerHit 统一负责（区分击杀/爆头），此处不再重复播放
            this._createBloodEffect(hitCharacterPoint, direction);
            this._flashCharacterRed(hitCharacter);
            this._createTracer(tracerStart, hitCharacterPoint, config.tracerColor, _calcDrop(hitCharacterDistance));
            return;
        }

        if (blocked) {
            this._createTracer(tracerStart, hitWorldPoint, config.tracerColor, _calcDrop(hitWorldPoint.distanceTo(tracerStart)));
            return;
        }

        if (lastPenetrablePoint) {
            this._createTracer(tracerStart, lastPenetrablePoint, config.tracerColor, _calcDrop(lastPenetrablePoint.distanceTo(tracerStart)));
            return;
        }

        const endPoint = this._tmpVec3.copy(origin).add(direction.clone().multiplyScalar(config.range));
        let drop = 0;
        if (config.bulletDrop && config.bulletSpeed) {
            const tof = config.range / config.bulletSpeed;
            drop = 0.5 * config.bulletDrop * tof * tof;
            endPoint.y -= drop;
        }
        this._createTracer(tracerStart, endPoint, config.tracerColor, drop);
    }

    _getCharacterFromObject(mesh) {
        let obj = mesh;
        while (obj) {
            if (obj.userData.character) return obj.userData.character;
            obj = obj.parent;
        }
        return null;
    }

    _isGlassHit(mesh) {
        let obj = mesh;
        while (obj) {
            if (obj.userData?.isGlass || obj.userData?.buildingPart?.includes?.('_glass')) return true;
            obj = obj.parent;
        }
        return false;
    }

    _shouldIgnoreNonBlockingWorldHit(hit) {
        if (!hit?.object) return false;
        if (this._getCharacterFromObject(hit.object)) return false;
        if (this._isGlassHit(hit.object)) return false;

        let obj = hit.object;
        let explicitlyNonBlocking = false;
        let explicitlyBlocking = false;
        while (obj) {
            if (obj.userData?.blocksBullets === false) explicitlyNonBlocking = true;
            if (obj.userData?.blocksBullets === true || obj.userData?.collisionBox) explicitlyBlocking = true;
            obj = obj.parent;
        }

        return explicitlyNonBlocking && !explicitlyBlocking;
    }

    _getCurrentSupportInfo(origin) {
        if (!this.world?.getSupportSurfaceInfo) return null;

        const probe = this._tmpVec1;
        probe.set(origin.x, origin.y - 1.45, origin.z);
        const support = this.world.getSupportSurfaceInfo(
            probe,
            0.42,
            origin.y - 2.35,
            origin.y - 0.35
        );
        if (!support || !support.mesh || typeof support.y !== 'number') return null;
        return support;
    }

    _shouldIgnoreCurrentSupportHit(hit, supportInfo, origin) {
        if (!supportInfo?.mesh || !hit?.object) return false;
        if (!this._isObjectOrChildOf(hit.object, supportInfo.mesh)) return false;

        const nearFeetSurface = hit.point.y <= supportInfo.y + 0.35;
        const nearCamera = hit.distance <= 2.4;
        const belowMuzzle = hit.point.y < origin.y - 0.25;

        return nearCamera && (nearFeetSurface || belowMuzzle);
    }

    _shouldIgnoreShooterLocalWorldHit(hit, origin, direction, supportInfo) {
        if (!hit || !hit.object) return false;
        if (hit.object.userData?.character) return false;

        const dist = hit.distance ?? Infinity;
        if (dist > 0.5) return false;

        const hitPoint = hit.point;
        const isAboveOrigin = hitPoint.y >= origin.y - 0.1;
        const isVeryClose = dist <= 0.18;
        const isRoofEdge = hit.object.userData?.buildingPart === 'roof' && dist <= 2.8 && hitPoint.y > origin.y - 1.0;
        const isWindowFrame = typeof hit.object.userData?.buildingPart === 'string' &&
            hit.object.userData.buildingPart.includes('frame') &&
            dist <= 0.45;
        const isSupportAdjacent = supportInfo?.mesh && this._isObjectOrChildOf(hit.object, supportInfo.mesh) && dist <= 0.75;

        return isVeryClose || (isAboveOrigin && (isRoofEdge || isWindowFrame || isSupportAdjacent));
    }

    _isObjectOrChildOf(object, parent) {
        let obj = object;
        while (obj) {
            if (obj === parent) return true;
            obj = obj.parent;
        }
        return false;
    }

    _canPenetrate(mesh) {
        if (!mesh) return false;
        let obj = mesh;
        while (obj) {
            if (obj.userData?.broken) return true;
            if (obj.userData?.isGlass || obj.userData?.penetrable) return true;
            if (obj.userData?.blocksBullets || obj.userData?.collisionBox) return false;
            obj = obj.parent;
        }
        if (mesh.userData?.penetrable || mesh.userData?.isGlass || mesh.userData?.broken) return true;
        if (mesh.userData.penetrable) return true;

        // 根据武器类型调整穿透厚度阈值（模拟不同口径的穿透能力）
        // 狙击枪/DMR 大口径能穿透更厚的掩体，手枪/霰弹枪几乎不能穿透
        const wpnType = this.currentWeapon ? this.currentWeapon.config.type : 'rifle';
        const penetrationConfig = this.currentWeapon?.config?.penetration;
        let maxPenetrationThickness;
        if (penetrationConfig !== undefined) {
            maxPenetrationThickness = penetrationConfig;
        } else {
            switch (wpnType) {
                case 'sniper': maxPenetrationThickness = 0.15; break;   // 狙击枪：15cm
                case 'dmr': maxPenetrationThickness = 0.12; break;      // DMR：12cm
                case 'lmg': maxPenetrationThickness = 0.10; break;      // LMG：10cm
                case 'rifle': maxPenetrationThickness = 0.08; break;    // 步枪：8cm
                case 'smg': maxPenetrationThickness = 0.05; break;      // 冲锋枪：5cm
                case 'pistol': maxPenetrationThickness = 0.04; break;   // 手枪：4cm
                case 'shotgun': maxPenetrationThickness = 0.02; break;  // 霰弹枪：2cm
                default: maxPenetrationThickness = 0.08;
            }
        }

        if (mesh.geometry && mesh.geometry.parameters) {
            const params = mesh.geometry.parameters;
            const minDim = Math.min(
                params.width || Infinity,
                params.height || Infinity,
                params.depth || Infinity
            );
            if (minDim < maxPenetrationThickness) return true;
        }
        return false;
    }

    _fireRocket(config) {
        const origin = this._tmpOrigin;
        this.camera.getWorldPosition(origin);
        const direction = this._tmpDir;
        this.camera.getWorldDirection(direction);

        const rocket = {
            position: origin.clone(),
            velocity: direction.clone().multiplyScalar(config.bulletSpeed),
            mesh: null,
            config: config,
            life: 5.0,
        };

        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x884422 })
        );
        mesh.rotation.x = Math.PI / 2;
        mesh.position.copy(rocket.position);
        this.scene.add(mesh);
        rocket.mesh = mesh;

        this.grenades.push(rocket);
    }

    throwGrenade(position, direction, throwForce = 20) {
        if (this.grenadeCount <= 0) return;
        this.grenadeCount--;

        // 手榴弹抛物线跟随准心指向：direction 包含俯仰角
        // velocityY 由 direction.y 决定，看高处投得高，看低处投得低
        const grenade = {
            position: position.clone(),
            velocity: direction.clone().multiplyScalar(throwForce),
            velocityY: direction.y * throwForce + 2,  // 基础仰角+准心指向
            mesh: null,
            type: 'grenade',
            life: 2.5,   // 引信时间（秒），更新循环检查 g.life
            damage: 80,
            radius: 8,
            // 旋转状态（手雷飞行和弹跳时翻滚）
            rotation: new THREE.Vector3(0, 0, 0),
            angularVelocity: new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            ),
            isRolling: false,  // 是否在地面上滚动
        };

        // 手雷模型：橄榄形球体 + 顶部引信（更接近真实手雷外观）
        const grenadeGroup = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0x3a4a2a, metalness: 0.5, roughness: 0.6 })
        );
        body.scale.y = 1.3;  // 橄榄形
        grenadeGroup.add(body);
        // 顶部引信帽
        const fuseCap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.03, 0.04, 6),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.4 })
        );
        fuseCap.position.y = 0.14;
        grenadeGroup.add(fuseCap);
        // 安全销
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

        this.grenades.push(grenade);
    }

    _createTracer(start, end, color, dropAmount = 0) {
        // 使用圆柱体代替线段，更粗的弹道
        const dir = this._tmpVec1.copy(end).sub(start);
        const dist = dir.length();
        if (dist < 0.1) return;

        // 不同武器弹道粗细不同
        const config = this.currentWeapon ? this.currentWeapon.config : null;
        const thickness = config && config.type === 'sniper' ? 0.015 : config && config.type === 'shotgun' ? 0.02 : 0.008;

        // 按颜色缓存弹道材质
        const colorKey = color;
        if (!this._tracerMatCache[colorKey]) {
            this._tracerMatCache[colorKey] = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
        }

        let line;
        if (dropAmount > 0.05 && dist > 10) {
            // === 曲线弹道（真实弹道下坠可视化）===
            // 用二次贝塞尔曲线模拟抛物线：控制点在直线中点正下方 dropAmount/2 处
            // 这使得曲线中点正好下坠 dropAmount/4，与物理抛物线 P(t)=P0+v*t-0.5*g*t² 吻合
            const mid = this._tmpVec2.copy(start).add(end).multiplyScalar(0.5);
            mid.y -= dropAmount * 0.5;
            const curve = new THREE.QuadraticBezierCurve3(
                start.clone(),
                mid.clone(),
                end.clone()
            );
            const geo = new THREE.TubeGeometry(curve, Math.min(12, Math.max(5, Math.floor(dist / 15))), thickness, 5, false);
            line = new THREE.Mesh(geo, this._tracerMatCache[colorKey]);
        } else {
            // === 直线弹道（近距离无下坠）===
            dir.normalize();
            const geo = new THREE.CylinderGeometry(thickness, thickness * 0.5, dist, 6);
            line = new THREE.Mesh(geo, this._tracerMatCache[colorKey]);
            const mid = this._tmpVec2.copy(start).add(end).multiplyScalar(0.5);
            line.position.copy(mid);
            line.quaternion.setFromUnitVectors(this._tmpVec3.set(0, 1, 0), dir);
        }

        this.scene.add(line);
        while (this.tracers.length >= this._maxTracers) {
            const old = this.tracers.shift();
            if (!old) break;
            this.scene.remove(old.mesh);
            if (old.mesh.geometry) old.mesh.geometry.dispose();
        }
        this.tracers.push({ mesh: line, life: 0.1, maxLife: 0.1, isTracer: true });
    }

    // 血液飞溅特效
    _createBloodEffect(point, direction) {
        this._pruneImpacts(3);
        const bloodCount = 8;
        const bloodGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(bloodCount * 3);
        const velocities = [];
        for (let i = 0; i < bloodCount; i++) {
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
            // 血液沿子弹方向飞溅 + 随机散开
            velocities.push(new THREE.Vector3(
                direction.x * 2.5 + (Math.random() - 0.5) * 3.5,
                direction.y * 2 + Math.random() * 2.5,
                direction.z * 2.5 + (Math.random() - 0.5) * 3.5
            ));
        }
        bloodGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        // 使用缓存的血液材质
        const blood = new THREE.Points(bloodGeo, this._bloodMat);
        this.scene.add(blood);
        this.impacts.push({ mesh: blood, life: 0.55, maxLife: 0.55, isBlood: true, velocities: velocities, sharedMat: true });

        // 血雾球 - 使用缓存的几何体和材质
        const mist = new THREE.Mesh(this._bloodMistGeo, this._bloodMistMat);
        mist.position.copy(point);
        mist.scale.setScalar(1.15);
        this.scene.add(mist);
        this.impacts.push({ mesh: mist, life: 0.65, maxLife: 0.65, isBloodMist: true, sharedMat: true, sharedGeo: true });

        // 轻量点光闪一下（用灯池，禁止 new PointLight）
        const pool = this.scene?.userData?.lightPool;
        if (pool?.flash) {
            pool.flash(point, 0x880000, 0.6, 2.5, 0.08);
        }
    }

    // 受击闪红特效
    _flashCharacterRed(character) {
        if (!character || !character.model) return;
        let flashMesh = null;
        character.model.traverse(child => {
            if (child.isMesh && child.material && !flashMesh) {
                flashMesh = child;
            }
        });
        if (!flashMesh) return;
        // 首次命中时保存原始 emissive；连续命中复用同一原始值，
        // 避免后发 timer 把已污染的 0x660000 当作"原始值"导致角色永久泛红
        if (flashMesh.userData._origEmissive === undefined && flashMesh.material.emissive) {
            flashMesh.userData._origEmissive = flashMesh.material.emissive.clone();
        }
        // 闪红
        if (flashMesh.material.emissive) {
            flashMesh.material.emissive.setHex(0x660000);
        }
        // 0.1秒后恢复
        if (!this._flashTimers) this._flashTimers = [];
        this._flashTimers.push({ flashMesh, time: 0.1 });
    }

    // 设置移动状态（影响扩散）
    setMovementState(isMoving, isAirborne, isCrouching, isProne = false, isHoldingBreath = false) {
        this._isMoving = isMoving;
        this._isAirborne = isAirborne;
        this._isCrouching = isCrouching || false;
        this._isProne = isProne || false;
        this.isHoldingBreath = !!(isHoldingBreath && this.canHoldBreath() && this.isAiming);
        const config = this.currentWeapon ? this.currentWeapon.config : null;
        this.isBraced = !!(config && config.bipodBonus && this.isAiming && !isMoving && !isAirborne && (this._isCrouching || this._isProne));
    }

    _getStabilityMultiplier(config) {
        let multiplier = 1.0;
        if (this.isAiming) multiplier *= 0.92;
        if (this.isBraced && config.bipodBonus) multiplier *= 0.55;
        if (this.isHoldingBreath && config.holdBreath) multiplier *= 0.45;
        return multiplier;
    }

    _disposeImpactEntry(imp) {
        if (!imp) return;
        if (imp.mesh) {
            this.scene.remove(imp.mesh);
            if (!imp.sharedGeo && imp.mesh.geometry) imp.mesh.geometry.dispose();
            if (!imp.sharedMat && !imp.isTracer && imp.mesh.material) {
                imp.mesh.material.dispose();
            }
        }
        if (imp.light) this.scene.remove(imp.light);
    }

    _pruneImpacts(requiredSlots = 1) {
        const targetLength = Math.max(0, this._maxImpacts - requiredSlots);
        while (this.impacts.length > targetLength) {
            this._disposeImpactEntry(this.impacts.shift());
        }
    }

    _createImpact(point, normal, hitObject, config) {
        this._pruneImpacts(6);
        const highImpactLoad = this.impacts.length > this._maxImpacts * 0.62;
        const minimalImpactFx = this.impacts.length > this._maxImpacts * 0.82;
        // 性能优化：超过特效上限时移除最早的特效
        if (this.impacts.length >= this._maxImpacts) {
            this._disposeImpactEntry(this.impacts.shift());
        }

        // 将法线转换到世界空间（hit.face.normal 是局部空间）
        let worldNormal = normal;
        if (normal && hitObject) {
            worldNormal = normal.clone();
            worldNormal.transformDirection(hitObject.matrixWorld);
        } else if (!normal) {
            // 无法线信息时默认朝上
            worldNormal = new THREE.Vector3(0, 1, 0);
        }

        // === 判断表面材质，决定特效类型 ===
        const isGround = worldNormal.y > 0.5;
        let isMetal = false;
        let isWood = false;
        let isConcrete = false;
        if (hitObject && hitObject.material) {
            const color = hitObject.material.color;
            if (color) {
                const hex = color.getHex();
                // 金属：偏灰偏深
                if ((hex & 0xff0000) >> 16 < 100 && (hex & 0x00ff00) >> 8 < 100 && (hex & 0x0000ff) < 100) {
                    isMetal = true;
                }
                // 木质：偏棕偏红
                else if ((hex & 0xff0000) >> 16 > 80 && (hex & 0x00ff00) >> 8 < 80) {
                    isWood = true;
                }
                // 混凝土：偏黄灰
                else if ((hex & 0xff0000) >> 16 > 80 && (hex & 0xff0000) >> 16 < 180) {
                    isConcrete = true;
                }
            }
        }
        // 大弹径武器击中地面一律当混凝土处理
        if (isGround && !isMetal && !isWood) isConcrete = true;

        // === 共享几何体（弹孔/烟雾/尘土高频生成，几何体复用防 GC 卡顿；材质因逐实例透明度动画保持独立）===
        if (!this._sharedFx) {
            this._sharedFx = {
                holeGeo: new THREE.CircleGeometry(1, 10),
                smokeGeo: new THREE.SphereGeometry(0.1, 6, 4),
                dustGeo: new THREE.CircleGeometry(0.35, 8),
            };
        }
        const shared = this._sharedFx;

        // === 弹孔贴花（共享几何体，尺寸用 scale 控制）===
        const holeColor = isMetal ? 0x333333 : isWood ? 0x2a1a0a : 0x1a1a1a;
        const holeSize = config && config.type === 'sniper' ? 0.18 : config && config.type === 'shotgun' ? 0.15 : 0.10;
        const mat = new THREE.MeshBasicMaterial({
            color: holeColor,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -2,
        });
        const impact = new THREE.Mesh(shared.holeGeo, mat);
        impact.scale.setScalar(holeSize);
        impact.position.copy(point);
        // 让弹孔面向法线方向
        impact.lookAt(point.clone().add(worldNormal));
        // 沿法线稍微偏移避免 Z-fighting
        impact.position.add(worldNormal.clone().multiplyScalar(0.02));
        this.scene.add(impact);
        this.impacts.push({ mesh: impact, life: 8.0, maxLife: 8.0, sharedGeo: true });
        if (minimalImpactFx) return;

        // === 火花（金属/混凝土表面火花更多）===
        const sparkCount = highImpactLoad ? (isMetal ? 3 : 2) : (isMetal ? 8 : isConcrete ? 6 : isWood ? 3 : 4);
        const sparkGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(sparkCount * 3);
        const sparkVelocities = [];
        for (let i = 0; i < sparkCount; i++) {
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
            // 火花沿法线反弹+随机散开
            const speed = 3 + Math.random() * 4;
            sparkVelocities.push(new THREE.Vector3(
                worldNormal.x * speed + (Math.random() - 0.5) * 4,
                worldNormal.y * speed + Math.random() * 3,
                worldNormal.z * speed + (Math.random() - 0.5) * 4
            ));
        }
        sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const sparkColor = isMetal ? 0xffdd00 : 0xffaa00;
        const sparkMat = new THREE.PointsMaterial({ color: sparkColor, size: 0.08, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
        const sparks = new THREE.Points(sparkGeo, sparkMat);
        this.scene.add(sparks);
        this.impacts.push({ mesh: sparks, life: 0.5, maxLife: 0.5, isSpark: true, velocities: sparkVelocities });
        if (highImpactLoad) return;

        // === 烟雾（所有表面都有，不同材质颜色不同；共享几何体）===
        const smokeColor = isMetal ? 0x666666 : isWood ? 0x554433 : isConcrete ? 0x998877 : 0x777766;
        const smokeMat = new THREE.MeshBasicMaterial({
            color: smokeColor,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
        });
        const smoke = new THREE.Mesh(shared.smokeGeo, smokeMat);
        smoke.position.copy(point);
        smoke.position.add(worldNormal.clone().multiplyScalar(0.05));
        this.scene.add(smoke);
        this.impacts.push({ mesh: smoke, life: 0.8, maxLife: 0.8, isSmoke: true, sharedGeo: true });

        // === 尘土飞扬（地面击中时；共享几何体）===
        if (isGround) {
            const dustMat = new THREE.MeshBasicMaterial({
                color: 0x8a7a5a,
                transparent: true,
                opacity: 0.5,
                depthWrite: false,
            });
            const dust = new THREE.Mesh(shared.dustGeo, dustMat);
            dust.position.copy(point);
            dust.position.add(worldNormal.clone().multiplyScalar(0.01));
            dust.lookAt(point.clone().add(worldNormal));
            this.scene.add(dust);
            this.impacts.push({ mesh: dust, life: 1.2, maxLife: 1.2, isDust: true, sharedGeo: true });

            // 额外尘土粒子
            const dirtCount = 5;
            const dirtGeo = new THREE.BufferGeometry();
            const dirtPos = new Float32Array(dirtCount * 3);
            const dirtVels = [];
            for (let i = 0; i < dirtCount; i++) {
                dirtPos[i * 3] = point.x;
                dirtPos[i * 3 + 1] = point.y;
                dirtPos[i * 3 + 2] = point.z;
                dirtVels.push(new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    1 + Math.random() * 2,
                    (Math.random() - 0.5) * 2
                ));
            }
            dirtGeo.setAttribute('position', new THREE.BufferAttribute(dirtPos, 3));
            const dirtMat = new THREE.PointsMaterial({ color: 0x8a7a5a, size: 0.15, transparent: true, depthWrite: false });
            const dirt = new THREE.Points(dirtGeo, dirtMat);
            this.scene.add(dirt);
            this.impacts.push({ mesh: dirt, life: 1.0, maxLife: 1.0, isDirt: true, velocities: dirtVels });
        }

        // === 木屑（木质表面）===
        if (isWood) {
            const chipCount = 5;
            const chipGeo = new THREE.BufferGeometry();
            const chipPos = new Float32Array(chipCount * 3);
            const chipVels = [];
            for (let i = 0; i < chipCount; i++) {
                chipPos[i * 3] = point.x;
                chipPos[i * 3 + 1] = point.y;
                chipPos[i * 3 + 2] = point.z;
                chipVels.push(new THREE.Vector3(
                    worldNormal.x * 2 + (Math.random() - 0.5) * 2,
                    worldNormal.y * 2 + Math.random() * 2,
                    worldNormal.z * 2 + (Math.random() - 0.5) * 2
                ));
            }
            chipGeo.setAttribute('position', new THREE.BufferAttribute(chipPos, 3));
            const chipMat = new THREE.PointsMaterial({ color: 0x6b4a2a, size: 0.1, transparent: true, depthWrite: false });
            const chips = new THREE.Points(chipGeo, chipMat);
            this.scene.add(chips);
            this.impacts.push({ mesh: chips, life: 0.8, maxLife: 0.8, isDirt: true, velocities: chipVels });
        }
    }

    _showMuzzleFlash() {
        const model = this.weaponModels[this.currentWeaponIdx];
        if (!model) return;
        const flash = model.getObjectByName('muzzleFlash');
        if (flash) {
            flash.material.opacity = 1;
            // 不同武器闪光大小不同
            const config = this.currentWeapon.config;
            const flashScale = config.type === 'shotgun' ? 1.8 : config.type === 'sniper' ? 1.5 : config.type === 'rocket' ? 2.5 : 1.0;
            flash.scale.setScalar((0.7 + Math.random() * 0.6) * flashScale);
            flash.rotation.z = Math.random() * Math.PI;
            this.muzzleFlashTimer = 0.06;
        }
        // 枪口光源 - 从灯光池借用（不新建灯光，避免着色器重编译）
        const pool = this.scene.userData.lightPool;
        if (pool) {
            const muzzlePos = this._muzzlePos;
            if (model) {
                model.getWorldPosition(muzzlePos);
                // 用世界方向（相机有俯仰时局部四元数会偏离枪口指向）
                const forward = this._forwardVec;
                model.getWorldDirection(forward);
                muzzlePos.add(forward.multiplyScalar(0.5));
            }
            pool.flash(muzzlePos, 0xffaa44, 8, 8, 0.06);
        }
    }

    // 手雷弹跳时的小型尘土反馈（提示玩家手雷落点）
    _createGrenadeBounceDust(position, groundY) {
        const dustGeo = new THREE.CircleGeometry(0.22, 6);
        const dustMat = new THREE.MeshBasicMaterial({
            color: 0x9a8a6a,
            transparent: true,
            opacity: 0.45,
            depthWrite: false,
        });
        const dust = new THREE.Mesh(dustGeo, dustMat);
        dust.position.set(position.x, groundY + 0.02, position.z);
        dust.rotation.x = -Math.PI / 2;
        this.scene.add(dust);
        this.impacts.push({ mesh: dust, life: 0.45, maxLife: 0.45, isSmoke: true });
    }

    _createExplosion(position, radius, damage) {
        // 大爆炸允许更大视觉半径（坦克/飞机坠毁观感）
        const visualRadius = Math.min(Math.max(radius * 0.55, 2.2), 6.5);
        this._pruneImpacts(12);
        // 爆炸火球（外层橙色）
        const flash = new THREE.Mesh(
            new THREE.SphereGeometry(visualRadius, 12, 8),
            new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.85, depthWrite: false })
        );
        flash.position.copy(position);
        this.scene.add(flash);

        // 白热核心（内层，更亮更快消散）
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(visualRadius * 0.5, 10, 8),
            new THREE.MeshBasicMaterial({ color: 0xfff5d0, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        core.position.copy(position);
        this.scene.add(core);
        this.impacts.push({
            mesh: core,
            life: 0.28,
            maxLife: 0.28,
            isExplosion: true,
            initialScale: 0.45,
            targetScale: 1.45,
        });

        // 第二层橙红冲击壳
        const shell = new THREE.Mesh(
            new THREE.SphereGeometry(visualRadius * 0.7, 10, 6),
            new THREE.MeshBasicMaterial({
                color: 0xff2200, transparent: true, opacity: 0.55,
                blending: THREE.AdditiveBlending, depthWrite: false, wireframe: false,
            })
        );
        shell.position.copy(position);
        this.scene.add(shell);
        this.impacts.push({
            mesh: shell,
            life: 0.4,
            maxLife: 0.4,
            isExplosion: true,
            initialScale: 0.8,
            targetScale: 2.1,
        });

        // 爆炸光 - 从灯光池借用（双闪：主光 + 余烬）
        const pool = this.scene.userData.lightPool;
        if (pool) {
            pool.flash(position, 0xff9933, 6.5, visualRadius * 9, 0.55);
            pool.flash(
                new THREE.Vector3(position.x, position.y + 1.2, position.z),
                0xff4400, 2.5, visualRadius * 5, 0.8
            );
        }

        this.impacts.push({
            mesh: flash,
            life: 0.55,
            maxLife: 0.55,
            isExplosion: true,
            initialScale: 0.9,
            targetScale: 1.8,
        });

        // 火焰碎片（抛物线飞散的炽热颗粒）
        const debrisCount = Math.min(22, 10 + Math.floor(visualRadius * 2));
        const debrisGeo = new THREE.BufferGeometry();
        const debrisPos = new Float32Array(debrisCount * 3);
        const debrisVels = [];
        for (let i = 0; i < debrisCount; i++) {
            debrisPos[i * 3] = position.x;
            debrisPos[i * 3 + 1] = position.y + 0.3;
            debrisPos[i * 3 + 2] = position.z;
            const ang = Math.random() * Math.PI * 2;
            const spd = 4 + Math.random() * 9;
            debrisVels.push(new THREE.Vector3(
                Math.cos(ang) * spd,
                5 + Math.random() * 8,
                Math.sin(ang) * spd
            ));
        }
        debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPos, 3));
        const debrisMat = new THREE.PointsMaterial({
            color: 0xffaa33, size: 0.22, transparent: true,
            blending: THREE.AdditiveBlending, depthWrite: false,
        });
        const debris = new THREE.Points(debrisGeo, debrisMat);
        this.scene.add(debris);
        this.impacts.push({ mesh: debris, life: 1.1, maxLife: 1.1, isSpark: true, velocities: debrisVels });

        // 翻滚烟团（多个偏移球体，各自膨胀上升）
        const puffCount = visualRadius > 4 ? 7 : 5;
        for (let i = 0; i < puffCount; i++) {
            const puff = new THREE.Mesh(
                new THREE.SphereGeometry(visualRadius * (0.4 + Math.random() * 0.35), 7, 5),
                new THREE.MeshBasicMaterial({
                    color: i % 2 === 0 ? 0x2a2a2a : 0x4a4038,
                    transparent: true, opacity: 0.55, depthWrite: false,
                })
            );
            puff.position.set(
                position.x + (Math.random() - 0.5) * visualRadius * 1.4,
                position.y + Math.random() * visualRadius * 1.0,
                position.z + (Math.random() - 0.5) * visualRadius * 1.4
            );
            this.scene.add(puff);
            this.impacts.push({ mesh: puff, life: 1.5 + Math.random() * 0.9, maxLife: 2.4, isSmokeColumn: true });
        }

        const groundY = this.world.getHeight(position.x, position.z);
        const scorchY = Math.max(position.y, groundY) + 0.05;

        // === 冲击波环（表现爆炸范围，沿地面向外扩散）===
        const shockwave = new THREE.Mesh(
            new THREE.RingGeometry(0.2, 0.4, 20),
            new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false })
        );
        shockwave.rotation.x = -Math.PI / 2;
        shockwave.position.set(position.x, scorchY, position.z);
        this.scene.add(shockwave);
        this.impacts.push({
            mesh: shockwave,
            life: 0.45,
            maxLife: 0.45,
            isShockwave: true,
            targetScale: radius * 2.5,
        });

        // === 烟尘柱（向上膨胀的蘑菇云效果）===
        const smokeCol = new THREE.Mesh(
            new THREE.CylinderGeometry(visualRadius * 0.35, visualRadius * 0.75, visualRadius * 1.4, 8, 1, true),
            new THREE.MeshBasicMaterial({ color: 0x4a4a4a, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })
        );
        smokeCol.position.set(position.x, position.y + visualRadius * 0.5, position.z);
        this.scene.add(smokeCol);
        this.impacts.push({
            mesh: smokeCol,
            life: 0.9,
            maxLife: 0.9,
            isSmokeColumn: true,
        });

        // === 地面焦痕（持久的爆炸痕迹，缓慢淡出）===
        const scorch = new THREE.Mesh(
            new THREE.CircleGeometry(Math.min(radius * 0.7, 2.8), 12),
            new THREE.MeshBasicMaterial({ color: 0x1a0800, transparent: true, opacity: 0.75, depthWrite: false })
        );
        scorch.rotation.x = -Math.PI / 2;
        scorch.position.set(position.x, scorchY + 0.01, position.z);
        this.scene.add(scorch);
        // 焦痕8秒后开始淡出，10秒消失
        const scorchTimer = setTimeout(() => {
            let opacity = 0.75;
            const fadeScorch = () => {
                if (this._disposed) return;
                opacity -= 0.015;
                if (opacity <= 0 || !scorch.parent) {
                    if (scorch.parent) this.scene.remove(scorch);
                    scorch.geometry.dispose();
                    scorch.material.dispose();
                    return;
                }
                scorch.material.opacity = opacity;
                requestAnimationFrame(fadeScorch);
            };
            fadeScorch();
        }, 8000);
        this._pendingTimeouts.push(scorchTimer);

        if (this.audio) this.audio.playExplosion(position);

        // 范围伤害
        if (this.cb.onExplosion) {
            this.cb.onExplosion(position, radius, damage);
        }
    }

    update(dt, now, playerState) {
        // 武器切换动画
        if (this.switchAnimTimer > 0) {
            this.switchAnimTimer -= dt;
            const progress = 1 - (this.switchAnimTimer / this.switchAnimDuration);
            if (progress >= 0.5 && this._pendingSwitchIdx >= 0) {
                this._doSwitchWeapon(this._pendingSwitchIdx);
                this._pendingSwitchIdx = -1;
            }
            if (this.switchAnimTimer <= 0) {
                this.switchAnimTimer = 0;
            }
        }

        // 持续射击（开枪无限制：切换动画期间也允许射击）
        if (this.isFiring && this.currentWeapon) {
            if (this.isHeldFireMode()) {
                this.tryFire(now);
            }
        }

        // 换弹
        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                const needed = this.currentWeapon.config.magSize - this.currentWeapon.ammoInMag;
                const taken = Math.min(needed, this.currentWeapon.reserveAmmo);
                this.currentWeapon.ammoInMag += taken;
                this.currentWeapon.reserveAmmo -= taken;
                this.isReloading = false;
            }
        }

        // 手持手雷动画（呼吸晃动 + 投掷挥臂动作）
        if (this.heldGrenade && this.heldGrenade.visible) {
            this.heldGrenadeTimer += dt;
            if (this.heldGrenadeThrowing) {
                // 投掷动画：0.3秒，后拉蓄力→前挥→消失
                const throwDur = 0.3;
                const t = Math.min(1, this.heldGrenadeTimer / throwDur);
                if (t < 0.4) {
                    // 蓄力阶段：手雷向后上方拉
                    const pull = t / 0.4;
                    this.heldGrenade.position.y = -0.16 + pull * 0.08;
                    this.heldGrenade.position.z = -0.35 + pull * 0.1;
                    this.heldGrenade.rotation.x = -pull * 0.5;
                } else if (t < 0.8) {
                    // 挥出阶段：手雷快速向前下方挥
                    const swing = (t - 0.4) / 0.4;
                    const ease = swing * swing;  // 加速挥出
                    this.heldGrenade.position.y = -0.08 - ease * 0.12;
                    this.heldGrenade.position.z = -0.25 - ease * 0.25;
                    this.heldGrenade.rotation.x = -0.5 + ease * 1.2;
                } else {
                    // 投掷完成：隐藏手雷
                    this.heldGrenade.visible = false;
                    this.heldGrenadeThrowing = false;
                    // 重置位置
                    this.heldGrenade.position.set(0.18, -0.16, -0.35);
                    this.heldGrenade.rotation.set(0, 0, 0);
                }
            } else {
                // 待机状态：轻微呼吸晃动
                const sway = Math.sin(this.heldGrenadeTimer * 2.5) * 0.008;
                const sway2 = Math.cos(this.heldGrenadeTimer * 1.8) * 0.005;
                this.heldGrenade.position.y = -0.16 + sway;
                this.heldGrenade.position.x = 0.18 + sway2;
                this.heldGrenade.rotation.z = Math.sin(this.heldGrenadeTimer * 2) * 0.03;
            }
        }

        // 武器模型视觉后坐力恢复
        this.recoilOffset.x = THREE.MathUtils.lerp(this.recoilOffset.x, 0, dt * 12);
        this.recoilOffset.y = THREE.MathUtils.lerp(this.recoilOffset.y, 0, dt * 10);

        // === 后坐力恢复系统（差异化恢复速度）===
        // 不在射击时，累积后坐力逐渐恢复（视角回到原位）
        const timeSinceLastShot = now - this.lastFireTime;
        if (!this.isFiring && timeSinceLastShot > 0.15) {
            const config = this.currentWeapon ? this.currentWeapon.config : null;
            // 使用武器专属恢复速度
            const vRecover = config && config.recoilVRecover ? config.recoilVRecover : (this.isAiming ? 8 : 6);
            const hRecover = config && config.recoilHRecover ? config.recoilHRecover : (this.isAiming ? 6 : 4);
            const recoverX = this.accumulatedRecoil.x * Math.min(dt * hRecover, 1);
            const recoverY = this.accumulatedRecoil.y * Math.min(dt * vRecover, 1);
            this.accumulatedRecoil.x -= recoverX;
            this.accumulatedRecoil.y -= recoverY;
            // 通过 pendingRecoil 反向施加恢复
            this.pendingRecoil.x -= recoverX;
            this.pendingRecoil.y -= recoverY;
        }

        // === 扩散恢复系统 ===
        // 不在射击时，扩散逐渐恢复
        if (timeSinceLastShot > 0.2) {
            const cfg = this.currentWeapon ? this.currentWeapon.config : null;
            const baseRecover = cfg && cfg.bulletSpreadRecover ? cfg.bulletSpreadRecover : (this.isAiming ? 4 : 3);
            const spreadRecoverRate = baseRecover * 0.005;
            this.spreadAccumulation = Math.max(0, this.spreadAccumulation - spreadRecoverRate * dt * 60);
            // 重置射击计数（停火一段时间后）
            if (timeSinceLastShot > 0.5) {
                this.shotsFired = 0;
                this.spreadAccumulation = 0;
                // 新的后坐力模式偏移
                this.recoilPatternOffset = Math.random() * Math.PI * 2;
            }
        }

        // 泵动状态推进
        if (this._pumpTimer > 0) this._pumpTimer -= dt;
        if (this._pumpKick > 0) this._pumpKick = Math.max(0, this._pumpKick - dt * 4);

        // 瞄准动画：过渡速率按武器 adsTime 配置（狙击慢、手枪快），指数逼近约 3×adsTime 到位
        const targetAim = this.isAiming ? 1 : 0;
        const aimRate = this.currentWeapon?.config?.adsTime ? 3 / this.currentWeapon.config.adsTime : 10;
        this.aimLerp = THREE.MathUtils.lerp(this.aimLerp, targetAim, dt * aimRate);

        // 武器模型位置动画
        const model = this.weaponModels[this.currentWeaponIdx];
        if (model) {
            // 瞄准时移动到中心
            const aimX = THREE.MathUtils.lerp(0.25, 0, this.aimLerp);
            const aimY = THREE.MathUtils.lerp(-0.22, -0.15, this.aimLerp);
            const aimZ = THREE.MathUtils.lerp(-0.4, -0.25, this.aimLerp);
            model.position.x = aimX;
            model.position.y = aimY;
            model.position.z = aimZ;

            // 每帧重置旋转，防止累加导致枪模持续旋转
            model.rotation.set(0, 0, 0);

            // 视觉后坐力 - 武器模型向后踢
            model.position.z += this.recoilOffset.y * 0.5;
            model.position.y -= this.recoilOffset.y * 0.2;
            model.rotation.x -= this.recoilOffset.y * 0.3;

            // 泵动动画：护木后拉复位（M870）
            if (this._pumpKick > 0.001) {
                model.position.z += this._pumpKick * 0.14;
                model.rotation.x += this._pumpKick * 0.12;
            }

            // 视角晃动
            if (playerState) {
                const moveSpeed = playerState.moveSpeed || 0;
                if (moveSpeed > 0.5 && playerState.onGround) {
                    this.viewBob += dt * moveSpeed * 2;
                    const bobAmount = playerState.isSprinting ? 0.015 : 0.008;
                    model.position.y += Math.sin(this.viewBob * 2) * bobAmount;
                    model.position.x += Math.cos(this.viewBob) * bobAmount * 0.5;
                }

                // 武器晃动
                let swayAmount = this.isAiming ? 0.005 : 0.015;
                if (this.isHoldingBreath) swayAmount *= 0.25;
                if (this.isBraced) swayAmount *= 0.45;
                this.viewSway.x = THREE.MathUtils.lerp(this.viewSway.x, -playerState.mouseDeltaX * swayAmount, dt * 10);
                this.viewSway.y = THREE.MathUtils.lerp(this.viewSway.y, -playerState.mouseDeltaY * swayAmount, dt * 10);
                model.rotation.z += this.viewSway.x;
                model.rotation.x += this.viewSway.y;

                // 侧身（PUBG 风格）：武器随上半身探出，横向平移+轻微侧旋
                const lean = playerState.lean || 0;
                this._leanLerp = THREE.MathUtils.lerp(this._leanLerp || 0, lean, dt * 10);
                if (Math.abs(this._leanLerp) > 0.001) {
                    model.position.x += this._leanLerp * 0.09;
                    model.position.y += Math.abs(this._leanLerp) * 0.015;
                    model.rotation.z += this._leanLerp * 0.18;
                    model.rotation.y += this._leanLerp * 0.08;
                }

                // 冲刺持枪姿态：枪口下垂偏内（战地风格奔跑姿势）
                const sprinting = playerState.isSprinting && (playerState.moveSpeed || 0) > 5.5 &&
                    !this.isAiming && !this.isReloading && playerState.onGround;
                this._sprintLerp = THREE.MathUtils.lerp(this._sprintLerp || 0, sprinting ? 1 : 0, dt * 8);
                if (this._sprintLerp > 0.01) {
                    model.position.x -= this._sprintLerp * 0.06;
                    model.position.y -= this._sprintLerp * 0.06;
                    model.rotation.y += this._sprintLerp * 0.45;
                    model.rotation.x += this._sprintLerp * 0.2;
                    model.rotation.z -= this._sprintLerp * 0.14;
                }
            }

            // 换弹动画 - 真实换弹行为（四阶段：取弹匣→插弹匣→拉栓上膛→恢复）
            // 根据武器类型差异化动作幅度和时序，模拟真实换弹手感
            if (this.isReloading && this.reloadDuration > 0) {
                const reloadProgress = 1 - (this.reloadTimer / this.reloadDuration);
                const wpnType = this.currentWeapon.config.type;

                // 根据武器类型调整换弹动作参数
                // dipAmount: 下沉量  rotAmount: 前倾量  tiltAmount: 侧倾量
                // shiftAmount: 右移量  chargeAmount: 拉栓后拉量
                // phase1/2/3End: 取弹匣/插弹匣/拉栓 各阶段结束时间点
                let dipAmount, rotAmount, tiltAmount, shiftAmount, chargeAmount;
                let phase1End, phase2End, phase3End;
                switch (wpnType) {
                    case 'pistol':
                        // 手枪：快速弹匣更换，幅度小
                        dipAmount = 0.08; rotAmount = 0.08; tiltAmount = 0.04; shiftAmount = 0.02; chargeAmount = 0.03;
                        phase1End = 0.25; phase2End = 0.50; phase3End = 0.75; break;
                    case 'sniper':
                        // 狙击枪：明显拉栓动作
                        dipAmount = 0.10; rotAmount = 0.06; tiltAmount = 0.05; shiftAmount = 0.02; chargeAmount = 0.10;
                        phase1End = 0.30; phase2End = 0.50; phase3End = 0.85; break;
                    case 'shotgun':
                        // 霰弹枪：泵动动作，前后移动明显
                        dipAmount = 0.06; rotAmount = 0.04; tiltAmount = 0.03; shiftAmount = 0.02; chargeAmount = 0.08;
                        phase1End = 0.20; phase2End = 0.40; phase3End = 0.70; break;
                    case 'lmg':
                        // 轻机枪：大幅度、长时间换弹
                        dipAmount = 0.16; rotAmount = 0.10; tiltAmount = 0.08; shiftAmount = 0.04; chargeAmount = 0.06;
                        phase1End = 0.35; phase2End = 0.60; phase3End = 0.85; break;
                    case 'rocket':
                        // 火箭筒：装填动作，下沉很多
                        dipAmount = 0.20; rotAmount = 0.15; tiltAmount = 0.06; shiftAmount = 0.03; chargeAmount = 0.04;
                        phase1End = 0.40; phase2End = 0.70; phase3End = 0.90; break;
                    default:
                        // 步枪/冲锋枪/DMR：标准换弹
                        dipAmount = 0.12; rotAmount = 0.10; tiltAmount = 0.06; shiftAmount = 0.03; chargeAmount = 0.06;
                        phase1End = 0.30; phase2End = 0.55; phase3End = 0.80;
                }

                let dip, rot, tilt, shift, charge;
                if (reloadProgress < phase1End) {
                    // 阶段1：取出空弹匣 - 武器下沉、前倾、右倾（手部够向弹匣）
                    const t = reloadProgress / phase1End;
                    const ease = t * t; // 缓入，动作由慢到快
                    dip = ease; rot = ease; tilt = ease; shift = ease; charge = 0;
                } else if (reloadProgress < phase2End) {
                    // 阶段2：插入新弹匣 - 武器保持低位，手部抖动模拟操作
                    dip = 1.0 + Math.sin(reloadProgress * 30) * 0.02;
                    rot = 1.0 + Math.sin(reloadProgress * 25) * 0.03;
                    tilt = 1.0; shift = 1.0; charge = 0;
                } else if (reloadProgress < phase3End) {
                    // 阶段3：拉栓上膛 - 武器回升，拉栓后拉（钟形曲线：先拉后推）
                    const t = (reloadProgress - phase2End) / (phase3End - phase2End);
                    const recover = 1.0 - t * 0.7;
                    dip = recover; rot = recover; tilt = recover; shift = recover;
                    charge = Math.sin(t * Math.PI); // 0→1→0 钟形
                } else {
                    // 阶段4：恢复到原位
                    const remain = 1.0 - (reloadProgress - phase3End) / (1 - phase3End);
                    dip = remain * 0.3; rot = remain * 0.3; tilt = remain * 0.3; shift = remain * 0.3; charge = 0;
                }

                model.position.y -= dip * dipAmount;          // 下沉（模拟手部下探取弹匣）
                model.position.z += dip * dipAmount * 0.5;     // 后移
                model.position.x += shift * shiftAmount;       // 右移（手部够向弹匣井）
                model.rotation.x += rot * rotAmount;            // 前倾（枪口下压）
                model.rotation.z += tilt * tiltAmount;          // 侧倾（枪身倾斜方便操作）
                model.position.z += charge * chargeAmount;      // 拉栓后拉（枪身向后移动模拟拉栓）

                // === 可见的弹匣拆装动作 ===
                // 阶段1：旧弹匣沿弹匣井向下抽出并旋转脱落
                // 阶段2：新弹匣从下方快速插回（前半程在下方，后半程推入到位）
                // 左手全程跟随弹匣运动
                const magNode = model.getObjectByName('magazine');
                if (magNode) {
                    if (!magNode.userData.restPos) {
                        magNode.userData.restPos = magNode.position.clone();
                        magNode.userData.restRot = magNode.rotation.clone();
                    }
                    const rp = magNode.userData.restPos;
                    const rr = magNode.userData.restRot;
                    let magDrop = 0;    // 弹匣下移量（0=在位，1=完全脱离）
                    let magTilt = 0;    // 弹匣脱出时的旋转
                    if (reloadProgress < phase1End) {
                        // 抽出：后半段快速下拉
                        const t = reloadProgress / phase1End;
                        magDrop = Math.max(0, (t - 0.35) / 0.65);
                        magDrop = magDrop * magDrop;
                        magTilt = magDrop;
                    } else if (reloadProgress < phase2End) {
                        // 换新弹匣：前半程弹匣在下方不可见位置，后半程向上插入
                        const t = (reloadProgress - phase1End) / (phase2End - phase1End);
                        if (t < 0.45) {
                            magDrop = 1;
                            magTilt = 0.4;
                        } else {
                            const ins = (t - 0.45) / 0.55;
                            magDrop = 1 - ins * ins;   // 加速插入
                            magTilt = (1 - ins) * 0.4;
                        }
                    }
                    const dropDist = 0.24;
                    magNode.position.set(rp.x, rp.y - magDrop * dropDist, rp.z + magDrop * 0.05);
                    magNode.rotation.set(rr.x + magTilt * 0.5, rr.y, rr.z + magTilt * 0.2);
                    magNode.visible = magDrop < 0.98;   // 完全脱离时隐藏（模拟离手）

                    // 左手跟随弹匣（换弹全程握着弹匣操作）
                    const leftHand = model.getObjectByName('leftHand');
                    if (leftHand) {
                        if (!leftHand.userData.restPos) {
                            leftHand.userData.restPos = leftHand.position.clone();
                        }
                        const lrp = leftHand.userData.restPos;
                        const magWorldY = rp.y - magDrop * dropDist;
                        // 换弹期间左手移到弹匣位置附近
                        const reloadActive = reloadProgress < phase3End ? 1 : Math.max(0, 1 - (reloadProgress - phase3End) / (1 - phase3End) * 2);
                        leftHand.position.set(
                            THREE.MathUtils.lerp(lrp.x, rp.x + 0.02, reloadActive),
                            THREE.MathUtils.lerp(lrp.y, magWorldY - 0.06, reloadActive),
                            THREE.MathUtils.lerp(lrp.z, rp.z + magDrop * 0.05 + 0.03, reloadActive)
                        );
                    }
                }
            } else {
                // 非换弹状态：弹匣与左手复位
                const magNode = model.getObjectByName('magazine');
                if (magNode && magNode.userData.restPos) {
                    magNode.position.copy(magNode.userData.restPos);
                    magNode.rotation.copy(magNode.userData.restRot);
                    magNode.visible = true;
                }
                const leftHand = model.getObjectByName('leftHand');
                if (leftHand && leftHand.userData.restPos) {
                    leftHand.position.copy(leftHand.userData.restPos);
                }
            }

            // 武器切换动画
            if (this.switchAnimTimer > 0) {
                const progress = 1 - (this.switchAnimTimer / this.switchAnimDuration);
                let switchDip;
                if (progress < 0.5) {
                    // 下沉阶段
                    switchDip = progress / 0.5;
                } else {
                    // 上升阶段
                    switchDip = 1 - (progress - 0.5) / 0.5;
                }
                model.position.y -= switchDip * 0.25;
                model.position.z += switchDip * 0.12;
                model.rotation.x += switchDip * 0.3;  // 约17度，不再整个翻转
            }
        }

        // 枪口闪光淡出
        if (this.muzzleFlashTimer > 0) {
            this.muzzleFlashTimer -= dt;
            const model = this.weaponModels[this.currentWeaponIdx];
            if (model) {
                const flash = model.getObjectByName('muzzleFlash');
                if (flash) {
                    flash.material.opacity = Math.max(0, this.muzzleFlashTimer / 0.06);
                }
            }
        }
        // 更新受击闪红恢复（替代setTimeout）
        if (this._flashTimers && this._flashTimers.length > 0) {
            for (let i = this._flashTimers.length - 1; i >= 0; i--) {
                const t = this._flashTimers[i];
                t.time -= dt;
                if (t.time <= 0) {
                    if (t.flashMesh && t.flashMesh.material) {
                        if (t.flashMesh.material.emissive) {
                            const orig = t.flashMesh.userData._origEmissive;
                            if (orig) t.flashMesh.material.emissive.copy(orig);
                            else t.flashMesh.material.emissive.setHex(0x000000);
                        }
                    }
                    this._flashTimers.splice(i, 1);
                }
            }
        }

        // 更新弹道
        for (let i = this.tracers.length - 1; i >= 0; i--) {
            const t = this.tracers[i];
            t.life -= dt;
            t.mesh.material.opacity = (t.life / t.maxLife) * 0.8;
            if (t.life <= 0) {
                this.scene.remove(t.mesh);
                t.mesh.geometry.dispose();
                // 弹道材质是共享的，不释放
                this.tracers.splice(i, 1);
            }
        }

        // 更新弹孔
        for (let i = this.impacts.length - 1; i >= 0; i--) {
            const imp = this.impacts[i];
            imp.life -= dt;
            if (imp.isExplosion) {
                const progress = 1 - imp.life / imp.maxLife;
                imp.mesh.scale.setScalar(THREE.MathUtils.lerp(imp.initialScale, imp.targetScale, progress));
                imp.mesh.material.opacity = (1 - progress) * 0.8;
                if (imp.light) imp.light.intensity = (1 - progress) * 5;
            } else if (imp.isShockwave) {
                // 冲击波环沿地面向外扩散，表现爆炸范围
                const progress = 1 - imp.life / imp.maxLife;
                imp.mesh.scale.setScalar(THREE.MathUtils.lerp(0.5, imp.targetScale, progress));
                imp.mesh.material.opacity = (1 - progress) * 0.7;
            } else if (imp.isSmokeColumn) {
                // 烟尘柱向上膨胀+淡出（蘑菇云效果）
                const progress = 1 - imp.life / imp.maxLife;
                imp.mesh.scale.setScalar(1 + progress * 1.6);
                imp.mesh.position.y += dt * 2.5;  // 向上飘升
                imp.mesh.material.opacity = (imp.life / imp.maxLife) * 0.55;
            } else if (imp.isSpark) {
                // 火花粒子飞行+重力
                const positions = imp.mesh.geometry.attributes.position.array;
                if (imp.velocities) {
                    for (let j = 0; j < imp.velocities.length; j++) {
                        imp.velocities[j].y -= 20 * dt;  // 重力
                        imp.velocities[j].multiplyScalar(0.96); // 阻力
                        positions[j * 3] += imp.velocities[j].x * dt;
                        positions[j * 3 + 1] += imp.velocities[j].y * dt;
                        positions[j * 3 + 2] += imp.velocities[j].z * dt;
                    }
                    imp.mesh.geometry.attributes.position.needsUpdate = true;
                }
                imp.mesh.material.opacity = imp.life / imp.maxLife;
            } else if (imp.isSmoke) {
                // 烟雾膨胀+淡出
                const progress = 1 - imp.life / imp.maxLife;
                imp.mesh.scale.setScalar(1 + progress * 3);
                imp.mesh.material.opacity = (imp.life / imp.maxLife) * 0.5;
            } else if (imp.isDust) {
                imp.mesh.material.opacity = (imp.life / imp.maxLife) * 0.5;
            } else if (imp.isDirt) {
                // 尘土/木屑粒子动画
                const positions = imp.mesh.geometry.attributes.position.array;
                if (imp.velocities) {
                    for (let j = 0; j < imp.velocities.length; j++) {
                        imp.velocities[j].y -= 12 * dt;
                        positions[j * 3] += imp.velocities[j].x * dt;
                        positions[j * 3 + 1] += imp.velocities[j].y * dt;
                        positions[j * 3 + 2] += imp.velocities[j].z * dt;
                    }
                    imp.mesh.geometry.attributes.position.needsUpdate = true;
                }
                imp.mesh.material.opacity = imp.life / imp.maxLife;
            } else if (imp.isBlood) {
                // 血液粒子飞溅动画
                const positions = imp.mesh.geometry.attributes.position.array;
                if (imp.velocities) {
                    for (let j = 0; j < imp.velocities.length; j++) {
                        imp.velocities[j].y -= 15 * dt;
                        positions[j * 3] += imp.velocities[j].x * dt;
                        positions[j * 3 + 1] += imp.velocities[j].y * dt;
                        positions[j * 3 + 2] += imp.velocities[j].z * dt;
                    }
                    imp.mesh.geometry.attributes.position.needsUpdate = true;
                }
                imp.mesh.material.opacity = imp.life / imp.maxLife;
            } else if (imp.isBloodMist) {
                imp.mesh.material.opacity = (imp.life / imp.maxLife) * 0.4;
                imp.mesh.scale.setScalar(1 + (1 - imp.life / imp.maxLife) * 2);
            } else if (imp.isShell) {
                // 弹壳物理：重力+空气阻力+旋转+地面弹跳
                if (imp.velocity) {
                    imp.velocity.y -= 15 * dt; // 重力
                    imp.velocity.multiplyScalar(0.98); // 空气阻力
                    imp.mesh.position.x += imp.velocity.x * dt;
                    imp.mesh.position.y += imp.velocity.y * dt;
                    imp.mesh.position.z += imp.velocity.z * dt;

                    // 地面弹跳
                    const groundY = this.world.getHeight(imp.mesh.position.x, imp.mesh.position.z);
                    if (imp.mesh.position.y < groundY + 0.01) {
                        imp.mesh.position.y = groundY + 0.01;
                        imp.velocity.y = -imp.velocity.y * 0.3;
                        imp.velocity.x *= 0.5;
                        imp.velocity.z *= 0.5;
                        // 速度很小时停止
                        if (Math.abs(imp.velocity.y) < 0.5) {
                            imp.velocity.set(0, 0, 0);
                        }
                    }
                }
                // 旋转
                if (imp.angularVel) {
                    imp.mesh.rotation.x += imp.angularVel.x * dt;
                    imp.mesh.rotation.y += imp.angularVel.y * dt;
                    imp.mesh.rotation.z += imp.angularVel.z * dt;
                    imp.angularVel.multiplyScalar(0.95);
                }
            } else {
                // 弹孔淡出：前70%时间保持，后30%渐隐
                const ratio = imp.life / imp.maxLife;
                imp.mesh.material.opacity = ratio > 0.3 ? 0.9 : (ratio / 0.3) * 0.9;
            }
            if (imp.life <= 0) {
                this._disposeImpactEntry(imp);
                this.impacts.splice(i, 1);
            }
        }

        // 更新手雷/火箭弹
        for (let i = this.grenades.length - 1; i >= 0; i--) {
            const g = this.grenades[i];
            g.life -= dt;

            if (g.type === 'grenade') {
                // 抛物线物理
                g.velocityY -= 25 * dt;
                g.position.x += g.velocity.x * dt;
                g.position.y += g.velocityY * dt;
                g.position.z += g.velocity.z * dt;

                // 地面碰撞 - 真实弹跳+滚动
                const groundY = this.world.getHeight(g.position.x, g.position.z);
                if (g.position.y < groundY + 0.12) {
                    g.position.y = groundY + 0.12;
                    const impactSpeed = Math.abs(g.velocityY);
                    if (impactSpeed > 1.5) {
                        // 弹跳：反弹+能量损失+旋转增强
                        g.velocityY = impactSpeed * 0.4;
                        g.velocity.x *= 0.7;
                        g.velocity.z *= 0.7;
                        // 弹跳时增加旋转
                        g.angularVelocity.x += (Math.random() - 0.5) * 8;
                        g.angularVelocity.z += (Math.random() - 0.5) * 8;
                        // 高速落地产生尘土反馈（视觉提示手雷位置）
                        if (impactSpeed > 3) {
                            this._createGrenadeBounceDust(g.position, groundY);
                        }
                    } else {
                        // 低速停止弹跳，开始滚动
                        g.velocityY = 0;
                        g.isRolling = true;
                        // 滚动摩擦减速
                        g.velocity.x *= 0.92;
                        g.velocity.z *= 0.92;
                        // 滚动时旋转跟随移动方向
                        const rollSpeed = Math.sqrt(g.velocity.x * g.velocity.x + g.velocity.z * g.velocity.z);
                        if (rollSpeed > 0.1) {
                            g.angularVelocity.x = g.velocity.z * 3;
                            g.angularVelocity.z = -g.velocity.x * 3;
                        } else {
                            // 几乎停止时，旋转逐渐衰减
                            g.angularVelocity.multiplyScalar(0.9);
                        }
                    }
                } else {
                    g.isRolling = false;
                }

                // 障碍物碰撞 - 更真实的反弹（只反转碰撞方向的速度分量）
                if (this.world.checkCollision(g.position, 0.1, 0.1)) {
                    // 回退到上一帧位置避免穿墙
                    g.position.x -= g.velocity.x * dt;
                    g.position.z -= g.velocity.z * dt;
                    // 判断主要碰撞方向并反弹
                    if (Math.abs(g.velocity.x) > Math.abs(g.velocity.z)) {
                        g.velocity.x = -g.velocity.x * 0.5;
                    } else {
                        g.velocity.z = -g.velocity.z * 0.5;
                    }
                    g.velocity.y *= 0.7;
                    // 碰撞时增加随机旋转
                    g.angularVelocity.y += (Math.random() - 0.5) * 6;
                }

                // 更新位置和旋转
                g.mesh.position.copy(g.position);
                if (g.rotation && g.angularVelocity) {
                    g.rotation.x += g.angularVelocity.x * dt;
                    g.rotation.y += g.angularVelocity.y * dt;
                    g.rotation.z += g.angularVelocity.z * dt;
                    g.mesh.rotation.set(g.rotation.x, g.rotation.y, g.rotation.z);
                    // 飞行时旋转衰减较慢，滚动时旋转衰减较快
                    g.angularVelocity.multiplyScalar(g.isRolling ? 0.98 : 0.995);
                }

                // 引信
                if (g.life <= 0) {
                    this._createExplosion(g.position.clone(), g.radius, g.damage);
                    this.scene.remove(g.mesh);
                    // 释放手雷模型（Group含多个子mesh）的几何体和材质，避免内存泄漏
                    this._disposeObject3D(g.mesh);
                    this.grenades.splice(i, 1);
                }
            } else {
                // 火箭弹飞行：带下坠和直接命中检测
                const prevPos = g.position.clone();
                g.velocity.y -= (g.config.bulletDrop || 0) * dt;
                g.position.add(g.velocity.clone().multiplyScalar(dt));
                const projectileHit = this._findProjectileTargetHit(prevPos, g.position);
                if (projectileHit) {
                    g.position.copy(projectileHit);
                    this._createExplosion(g.position.clone(), g.config.explosionRadius, g.config.damage);
                    this.scene.remove(g.mesh);
                    this._disposeObject3D(g.mesh);
                    this.grenades.splice(i, 1);
                    continue;
                }

                // 地面碰撞
                const groundY = this.world.getHeight(g.position.x, g.position.z);
                if (g.position.y <= groundY + 0.1) {
                    this._createExplosion(g.position.clone(), g.config.explosionRadius, g.config.damage);
                    this.scene.remove(g.mesh);
                    this._disposeObject3D(g.mesh);
                    this.grenades.splice(i, 1);
                    continue;
                }

                // 障碍物碰撞
                if (this.world.checkCollision(g.position, 0.1, 0.1)) {
                    this._createExplosion(g.position.clone(), g.config.explosionRadius, g.config.damage);
                    this.scene.remove(g.mesh);
                    this._disposeObject3D(g.mesh);
                    this.grenades.splice(i, 1);
                    continue;
                }

                // 射程/时间到
                if (g.life <= 0) {
                    this._createExplosion(g.position.clone(), g.config.explosionRadius, g.config.damage);
                    this.scene.remove(g.mesh);
                    this._disposeObject3D(g.mesh);
                    this.grenades.splice(i, 1);
                    continue;
                }

                g.mesh.position.copy(g.position);
                g.mesh.lookAt(g.position.clone().add(g.velocity));
            }
        }
    }

    _findProjectileTargetHit(start, end) {
        if (!this.cb.getTargets) return null;
        const targets = this.cb.getTargets();
        const ab = this._tmpVec1.copy(end).sub(start);
        const lenSq = ab.lengthSq();
        if (lenSq <= 0.0001) return null;

        let bestHit = null;
        let bestT = Infinity;
        for (const target of targets) {
            if (!target || !target.position) continue;
            const center = this._tmpVec2.copy(target.position);
            const character = target.character;
            const hitRadius = character && character.type ? 2.4 : 0.65;
            center.y += character && character.type ? 1.1 : 1.0;

            const ap = this._tmpVec3.copy(center).sub(start);
            const t = THREE.MathUtils.clamp(ap.dot(ab) / lenSq, 0, 1);
            const closest = start.clone().add(ab.clone().multiplyScalar(t));
            if (closest.distanceTo(center) <= hitRadius && t < bestT) {
                bestT = t;
                bestHit = closest;
            }
        }
        return bestHit;
    }

    // 获取当前武器状态（供HUD显示）
    getWeaponState() {
        if (!this.currentWeapon) return null;
        return {
            name: this.currentWeapon.config.name,
            ammoInMag: this.currentWeapon.ammoInMag,
            reserveAmmo: this.currentWeapon.reserveAmmo,
            magSize: this.currentWeapon.config.magSize,
            isReloading: this.isReloading,
            isAiming: this.isAiming,
            weaponList: this.weapons.map(w => w.config.name),
            currentIdx: this.currentWeaponIdx,
            grenadeCount: this.grenadeCount,
            fireMode: this.getCurrentFireMode(),
            fireModeLabel: this.getFireModeLabel(),
            hasFireModeToggle: this._getAvailableFireModes(this.currentWeapon.config).length > 1,
            isHoldingBreath: this.isHoldingBreath,
            isBraced: this.isBraced,
        };
    }

    // 消费一次性后坐力踢出量（供相机使用，复用返回对象避免每帧分配）
    consumeRecoil() {
        this._recoilReturn.x = this.pendingRecoil.x;
        this._recoilReturn.y = this.pendingRecoil.y;
        this.pendingRecoil.x = 0;
        this.pendingRecoil.y = 0;
        return this._recoilReturn;
    }

    // 获取武器模型视觉后坐力
    getVisualRecoil() {
        return this.recoilOffset;
    }

    // 获取瞄准状态
    getAimLerp() {
        return this.aimLerp;
    }

    // 是否为狙击镜瞄准（zoom > 2 才显示遮罩；等开镜过渡过半再遮罩，让玩家看到放大过程）
    isScoped() {
        if (!this.currentWeapon) return false;
        return this.isAiming && this.currentWeapon.config.zoom >= 2.0 && this.aimLerp > 0.55;
    }

    // 获取当前武器缩放倍率（按 aimLerp 平滑过渡，开镜瞬间即开始放大）
    getZoom() {
        if (!this.currentWeapon) return 1.0;
        const zoom = this.currentWeapon.config.zoom || 1.0;
        if (!this.isAiming && this.aimLerp < 0.02) return 1.0;
        // 用 aimLerp 插值：过渡期间放大率渐进，到位后为完整倍率
        return 1 + (zoom - 1) * Math.min(1, this.aimLerp * 1.25);
    }

    dispose() {
        this.stopFire();

        for (const tracer of this.tracers) {
            if (!tracer?.mesh) continue;
            this.scene.remove(tracer.mesh);
            if (tracer.mesh.geometry) tracer.mesh.geometry.dispose();
        }
        this.tracers = [];

        for (const impact of this.impacts) {
            this._disposeImpactEntry(impact);
        }
        this.impacts = [];

        for (const grenade of this.grenades) {
            if (grenade?.mesh) {
                this.scene.remove(grenade.mesh);
                // 手雷模型是 Group，需遍历子 mesh 释放几何体和材质
                this._disposeObject3D(grenade.mesh);
            }
        }
        this.grenades = [];

        this._disposeObject3D(this.weaponGroup);
        this.weaponModels = {};

        this._shellGeoRifle?.dispose();
        this._shellGeoPistol?.dispose();
        this._shellMat?.dispose();
        this._bloodMat?.dispose();
        this._bloodMistMat?.dispose();
        this._bloodMistGeo?.dispose();

        for (const mat of Object.values(this._tracerMatCache || {})) {
            if (mat?.dispose) mat.dispose();
        }
        this._tracerMatCache = {};

        // 共享特效几何体（弹孔/烟雾/尘土，懒创建，dispose 时统一释放）
        if (this._sharedFx) {
            for (const geo of Object.values(this._sharedFx)) {
                if (geo?.dispose) geo.dispose();
            }
            this._sharedFx = null;
        }

        // 取消挂起的延迟回调，避免 dispose 后向已清理的场景添加网格
        this._disposed = true;
        for (const t of this._pendingTimeouts || []) clearTimeout(t);
        this._pendingTimeouts = [];
    }
}
