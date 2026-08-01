import * as THREE from 'three';
import { CONFIG } from '../config.js?v=20260801.2';
import { createProceduralMaterial, createSvgCanvasTexture } from '../utils/VisualAssets.js?v=20260801.2';

const _vehicleSvgTextureCache = new Map();
const _vehicleSvgMaterialCache = new Map();

function _vehicleHexToCss(hex) {
    return `#${(Number(hex) >>> 0).toString(16).padStart(6, '0')}`;
}

function _vehicleSvgTexture(key, svg) {
    if (_vehicleSvgTextureCache.has(key)) return _vehicleSvgTextureCache.get(key);
    const texture = createSvgCanvasTexture(svg, 512);
    if (!texture) return null;
    texture.userData.sharedProcedural = true;
    _vehicleSvgTextureCache.set(key, texture);
    return texture;
}

function _vehicleSvgMaterial(key, svg, opacity = 0.92) {
    const cacheKey = `${key}:${opacity}`;
    if (_vehicleSvgMaterialCache.has(cacheKey)) return _vehicleSvgMaterialCache.get(cacheKey);
    const material = new THREE.MeshBasicMaterial({
        map: _vehicleSvgTexture(key, svg),
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    material.userData.sharedProcedural = true;
    _vehicleSvgMaterialCache.set(cacheKey, material);
    return material;
}

function _vehicleBadgeSvg(teamColor, label) {
    const team = _vehicleHexToCss(teamColor);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 128"><rect width="256" height="128" rx="16" fill="#0b0d0c" fill-opacity=".55"/><path d="M128 14 222 46v34c0 35-39 58-94 35-55 23-94 0-94-35V46z" fill="${team}"/><path d="M64 54h128M78 80h100" stroke="#fff" stroke-opacity=".35" stroke-width="10" stroke-linecap="round"/><text x="128" y="84" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#07100e">${label}</text></svg>`;
}

function _vehicleNumberSvg(teamColor, numberText) {
    const team = _vehicleHexToCss(teamColor);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 128"><rect width="256" height="128" rx="10" fill="#10120f" fill-opacity=".48"/><path d="M24 22h208v84H24z" fill="none" stroke="${team}" stroke-width="10"/><text x="128" y="86" text-anchor="middle" font-family="Arial, sans-serif" font-size="68" font-weight="800" fill="#f0f0e8">${numberText}</text></svg>`;
}

function _addVehicleSvgDecal(parent, name, width, height, pos, rot, material) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.name = name;
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    parent.add(mesh);
    return mesh;
}

// 载具系统 - 可驾驶的战地载具
export class Vehicle {
    constructor(scene, world, audio, type, team) {
        this.scene = scene;
        this.world = world;
        this.audio = audio;
        this.originalType = type;   // 保存原始类型（如 sherman/tiger，用于配置查找）
        this.config = CONFIG.VEHICLES[type];
        // 如果配置指定了 modelType（如 sherman→tank），用 modelType 驱动模型和物理
        this.type = this.config?.modelType || type;
        this.team = team;

        this.position = new THREE.Vector3(0, 0, 0);
        this.yaw = 0;
        this.velocity = 0;          // 前向速度
        this.lateralVelocity = 0;   // 侧向速度（漂移）
        this.health = this.config.maxHealth;
        this.alive = true;
        this.onDestroyed = null;

        // 飞行高度（直升机用）
        this.verticalVelocity = 0;
        this.pitchAngle = 0;
        this.rollAngle = 0;

        // 炮塔
        this.turretYaw = 0;
        this.turretPitch = 0;
        this._targetTurretYaw = 0;   // 目标偏航（平滑旋转用）
        this._targetTurretPitch = 0; // 目标俯仰
        this.cannonCooldown = 0;
        this.secondaryCooldown = 0;

        // 弹药存量（战地风格：载具弹药有限，停火后自动补充）
        this.maxCannonAmmo = this.config.cannonAmmo || 0;
        this.cannonAmmo = this.maxCannonAmmo;
        this.maxSecondaryAmmo = this.config.secondaryAmmo || 0;
        this.secondaryAmmo = this.maxSecondaryAmmo;
        this._ammoRegenTimer = 0;  // 停火后弹药恢复计时

        // 乘员
        this.occupants = new Array(this.config.seats).fill(null);

        // 引擎
        this.engineSound = null;
        this._engineLoad = 0; // 引擎负载（用于音调）

        // 第一人称可见/隐藏部件缓存，必须在建模前初始化
        this._fpHiddenMeshes = [];
        this._fpHeliHiddenMeshes = [];
        this._fpHeliVisibleMeshes = [];
        this._fpViewActive = false;

        // 地面载具模型按 +Z 车头构建，而物理/射击约定为 −Z，整体翻转 180° 对齐
        this._modelFlipped = !(this.config.isAircraft);

        // 模型
        this.model = this._buildModel();
        this.scene.add(this.model);
        this._collectFirstPersonHideMeshes();

        // 轮迹/履带动画
        this.wheelOffset = 0;

        // 视觉特效状态
        this._exhaustTimer = 0;
        this._dustTimer = 0;
        this._damageSmoke = null;
        this._damageFire = null;
        this._damageLight = null;
        this._rotorWashTimer = 0;
        this._bodyRoll = 0;          // 转向时车身侧倾
        this._suspensionBounce = 0;  // 悬挂弹跳
        this._skidTimer = 0;         // 轮胎打滑计时
        this._isDrifting = false;    // 是否正在漂移
        this._isSkidding = false;    // 是否正在打滑

        // 损伤变形
        this._detachedParts = [];    // 已脱落的部件
        this._deformedMeshes = [];   // 已变形的网格

        // 碰撞反馈
        this._lastCollisionTime = 0;
        this._collisionCooldown = 0;

        // 轮胎痕迹
        this._skidMarks = [];
        this._maxSkidMarks = 60;

        // 飞机坠毁状态
        this._crashing = false;
        this._crashFinalized = false;
        this._crashVelocity = new THREE.Vector3();
        this._crashAngularVelocity = new THREE.Vector3();
        this._crashSmokeTimer = 0;

        this._activeTransientFx = 0;
        this._lastImpactFxTime = 0;
        this._lastMuzzleFxTime = 0;
        this._lastTracerFxTime = 0;
        this._vehicleTracerMaterials = {};

        // === 特效几何体缓存（避免每次射击创建新几何体导致GC卡顿）===
        // 所有特效通过 scale 调整大小，复用同一份 geometry
        this._fxGeo = {
            flash: new THREE.SphereGeometry(1, 6, 4),        // 火球/枪口闪光（单位球，通过scale缩放）
            smoke: new THREE.SphereGeometry(1, 5, 3),        // 烟雾
            spark: new THREE.BufferGeometry(),               // 火花（动态填充position）
        };
        // 火花基础位置缓冲（最大8个粒子×3，避免每次新建Float32Array）
        this._fxSparkPositions = new Float32Array(8 * 3);
        this._fxGeo.spark.setAttribute('position', new THREE.BufferAttribute(this._fxSparkPositions, 3));

        // 碰撞火花粒子池（最多4个并发）
        this._sparkPool = [];

        // 摧毁涂黑产生的克隆材质（重生时统一释放，避免每局泄漏）
        this._blackenedMaterials = [];
    }

    _buildModel() {
        const group = new THREE.Group();
        group.userData.vehicle = this;
        group.userData.character = this;  // 同时设为character，供射击命中检测使用

        const teamColor = this.team === 0 ? 0x3a5a3a : 0x5a3a3a;
        const matBody = createProceduralMaterial('metal', {
            baseColor: teamColor,
            accentColor: this.team === 0 ? 0x203421 : 0x342020,
            detailColor: 0x8e927a,
            size: 256,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 8,
        }, { roughness: 0.66, metalness: 0.46, bumpScale: 0.032 });
        const matDark = createProceduralMaterial('metal', {
            baseColor: 0x1a1a1a,
            accentColor: 0x080808,
            detailColor: 0x555555,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 8,
        }, { roughness: 0.58, metalness: 0.62, bumpScale: 0.025 });
        const matGlass = createProceduralMaterial('glass', {
            baseColor: 0x223344,
            accentColor: 0x5d8098,
            detailColor: 0xd8f2ff,
            size: 128,
            repeatX: 1,
            repeatY: 1,
            anisotropy: 4,
        }, { roughness: 0.08, metalness: 0.14, transparent: true, opacity: 0.48, depthWrite: false, useBump: false });
        const matTire = createProceduralMaterial('rubber', {
            baseColor: 0x111111,
            accentColor: 0x050505,
            detailColor: 0x555555,
            size: 192,
            repeatX: 4,
            repeatY: 1,
            anisotropy: 8,
        }, { roughness: 0.96, metalness: 0.05, bumpScale: 0.045 });

        // 保存原始材质引用用于损伤变形
        this._originalMaterials = { matBody, matDark, matGlass, matTire };

        switch (this.type) {
            case 'jeep':
                this._buildJeep(group, matBody, matDark, matGlass, matTire);
                break;
            case 'tank':
                this._buildTank(group, matBody, matDark, matTire);
                break;
            case 'apc':
                this._buildAPC(group, matBody, matDark, matGlass, matTire);
                break;
            case 'heli':
                this._buildHeli(group, matBody, matDark, matGlass);
                break;
            case 'plane':
                this._buildPlane(group, matBody, matDark, matGlass);
                break;
        }
        this._addVehicleDetailKit(group, matBody, matDark, matGlass);
        this._addVehicleSurfaceDetails(group, matBody, matDark, matGlass);

        return group;
    }

    _addVehicleDetailKit(group, matBody, matDark, matGlass) {
        const metalMat = createProceduralMaterial('metal', {
            baseColor: 0x3d3d38,
            accentColor: 0x1c1c19,
            detailColor: 0x888876,
            size: 160,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 6,
        }, { roughness: 0.58, metalness: 0.58, bumpScale: 0.025 });
        const rubberMat = createProceduralMaterial('rubber', {
            baseColor: 0x0b0b0b,
            accentColor: 0x020202,
            detailColor: 0x555555,
            size: 160,
            repeatX: 3,
            repeatY: 1,
            anisotropy: 6,
        }, { roughness: 0.9, metalness: 0.08, bumpScale: 0.035 });
        const lightMat = new THREE.MeshBasicMaterial({ color: this.team === 0 ? 0x55bbff : 0xff6655 });
        const amberMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });

        const addBox = (name, size, pos, mat = metalMat, rot = null) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
            mesh.name = name;
            mesh.position.set(pos[0], pos[1], pos[2]);
            if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
            group.add(mesh);
            return mesh;
        };
        const addCyl = (name, radius, height, pos, mat = metalMat, rot = null, segments = 8) => {
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat);
            mesh.name = name;
            mesh.position.set(pos[0], pos[1], pos[2]);
            if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
            group.add(mesh);
            return mesh;
        };

        if (this.type === 'jeep') {
            addBox('jeep_rollbar_front', [0.08, 1.0, 0.08], [-0.85, 1.55, -0.55], matDark);
            addBox('jeep_rollbar_front_r', [0.08, 1.0, 0.08], [0.85, 1.55, -0.55], matDark);
            addBox('jeep_rollbar_top', [1.8, 0.08, 0.08], [0, 2.05, -0.55], matDark);
            addCyl('jeep_spare_tire', 0.42, 0.18, [0, 1.05, -2.1], rubberMat, [Math.PI / 2, 0, 0], 16);
            addBox('jeep_jerrycan_l', [0.22, 0.42, 0.16], [-0.72, 0.95, -1.85], matBody);
            addBox('jeep_jerrycan_r', [0.22, 0.42, 0.16], [0.72, 0.95, -1.85], matBody);
            addBox('jeep_left_mirror', [0.04, 0.18, 0.22], [-1.08, 1.32, 0.78], matGlass, [0, 0.18, 0]);
            addBox('jeep_right_mirror', [0.04, 0.18, 0.22], [1.08, 1.32, 0.78], matGlass, [0, -0.18, 0]);
            addBox('jeep_tow_hook_front', [0.38, 0.08, 0.08], [0, 0.42, 2.25], matDark);
            addBox('jeep_rear_light_l', [0.16, 0.12, 0.03], [-0.72, 0.78, -2.02], lightMat);
            addBox('jeep_rear_light_r', [0.16, 0.12, 0.03], [0.72, 0.78, -2.02], lightMat);
        } else if (this.type === 'tank') {
            addBox('tank_rear_storage_bin', [1.4, 0.45, 0.32], [0, 1.28, -2.25], matDark);
            addBox('tank_left_side_storage', [0.24, 0.35, 1.2], [-1.55, 1.25, -0.6], matDark);
            addBox('tank_right_side_storage', [0.24, 0.35, 1.2], [1.55, 1.25, -0.6], matDark);
            addCyl('tank_exhaust_l', 0.09, 0.7, [-0.75, 1.32, -2.25], metalMat, [Math.PI / 2, 0, 0]);
            addCyl('tank_exhaust_r', 0.09, 0.7, [0.75, 1.32, -2.25], metalMat, [Math.PI / 2, 0, 0]);
            for (let side = -1; side <= 1; side += 2) {
                for (let i = 0; i < 3; i++) {
                    addCyl(`tank_smoke_launcher_${side}_${i}`, 0.055, 0.32, [side * 0.95, 2.05, -0.15 + i * 0.13], matDark, [0.45, 0, side * 0.25], 8);
                }
            }
            addBox('tank_antenna_base', [0.09, 0.08, 0.09], [0.9, 2.25, -0.55], matDark);
            addCyl('tank_antenna', 0.012, 1.4, [0.95, 2.95, -0.58], matDark, [0.15, 0, -0.18], 5);
            addBox('tank_thermal_sight', [0.22, 0.18, 0.28], [-0.45, 2.22, -0.25], matGlass);
        } else if (this.type === 'apc') {
            addBox('apc_roof_rack', [1.5, 0.08, 1.7], [0, 2.28, -0.65], matDark);
            addBox('apc_rear_ladder_l', [0.06, 1.0, 0.06], [-0.8, 1.35, -2.75], matDark);
            addBox('apc_rear_ladder_r', [0.06, 1.0, 0.06], [0.8, 1.35, -2.75], matDark);
            for (let y = 1.0; y <= 1.7; y += 0.35) {
                addBox(`apc_ladder_step_${y.toFixed(1)}`, [1.45, 0.04, 0.05], [0, y, -2.78], matDark);
            }
            addBox('apc_left_marker', [0.12, 0.08, 0.035], [-0.95, 1.15, 2.58], amberMat);
            addBox('apc_right_marker', [0.12, 0.08, 0.035], [0.95, 1.15, 2.58], amberMat);
            addCyl('apc_antenna_l', 0.01, 1.1, [-0.75, 2.75, -1.2], matDark, [0.08, 0, 0.2], 5);
            addCyl('apc_antenna_r', 0.01, 1.0, [0.75, 2.7, -1.15], matDark, [0.08, 0, -0.2], 5);
            addBox('apc_sensor_box', [0.28, 0.18, 0.26], [0.55, 2.48, 0.25], matGlass);
        } else if (this.type === 'heli') {
            addBox('heli_sensor_ball_mount', [0.22, 0.12, 0.22], [0, 1.08, -2.25], matDark);
            const sensorBall = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), matGlass);
            sensorBall.name = 'heli_sensor_ball';
            sensorBall.position.set(0, 0.92, -2.32);
            group.add(sensorBall);
            addBox('heli_door_left', [0.04, 0.75, 0.9], [-0.62, 1.55, -0.35], matDark);
            addBox('heli_door_right', [0.04, 0.75, 0.9], [0.62, 1.55, -0.35], matDark);
            addBox('heli_landing_light', [0.16, 0.08, 0.04], [0, 1.08, -2.92], lightMat);
            addCyl('heli_tail_antenna', 0.01, 0.9, [0, 2.35, 3.35], matDark, [0.4, 0, 0], 5);
            addBox('heli_tail_rotor_guard', [0.08, 1.45, 0.08], [0.42, 2.0, 4.5], matDark);
            for (let side = -1; side <= 1; side += 2) {
                addBox(`heli_pylon_marker_${side}`, [0.12, 0.08, 0.04], [side * 1.55, 1.25, -0.85], amberMat);
            }
        }
    }

    _buildJeep(group, matBody, matDark, matGlass, matTire) {
        // 底盘 - 更精细的梯形
        const chassis = new THREE.Mesh(
            new THREE.BoxGeometry(2.0, 0.5, 4.0), matBody
        );
        chassis.position.y = 0.6;
        chassis.castShadow = true;
        chassis.userData.partName = 'chassis';
        group.add(chassis);

        // 底盘裙边
        const skirt = new THREE.Mesh(
            new THREE.BoxGeometry(2.1, 0.15, 3.8), matDark
        );
        skirt.position.y = 0.4;
        group.add(skirt);

        // 车身 - 带斜面前部
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.9, 0.6, 2.0), matBody
        );
        body.position.set(0, 1.1, 0);
        body.castShadow = true;
        body.userData.partName = 'body';
        group.add(body);

        // 引擎盖 - 略带斜度
        const hood = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.4, 1.2), matBody
        );
        hood.position.set(0, 1.0, 1.5);
        hood.castShadow = true;
        hood.userData.partName = 'hood';
        group.add(hood);

        // 引擎盖通风口
        const vent = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.03, 0.3), matDark
        );
        vent.position.set(0, 1.21, 1.5);
        group.add(vent);

        // 挡风玻璃框
        const windshieldFrame = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.55, 0.08), matDark
        );
        windshieldFrame.position.set(0, 1.3, 0.9);
        windshieldFrame.rotation.x = -0.3;
        windshieldFrame.userData.fpHide = true;
        group.add(windshieldFrame);

        // 挡风玻璃
        const windshield = new THREE.Mesh(
            new THREE.BoxGeometry(1.7, 0.5, 0.05), matGlass
        );
        windshield.position.set(0, 1.3, 0.88);
        windshield.rotation.x = -0.3;
        windshield.userData.partName = 'windshield';
        windshield.userData.fpHide = true;
        group.add(windshield);

        // 侧窗
        for (let side = -1; side <= 1; side += 2) {
            const sideWindow = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.35, 0.8), matGlass
            );
            sideWindow.position.set(side * 0.95, 1.3, 0);
            group.add(sideWindow);
        }

        // 座椅 - 带靠背
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
        for (let i = 0; i < 2; i++) {
            const seatBase = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.1, 0.5), seatMat
            );
            seatBase.position.set(-0.4 + i * 0.8, 1.15, 0);
            group.add(seatBase);
            
            const seatBack = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.45, 0.08), seatMat
            );
            seatBack.position.set(-0.4 + i * 0.8, 1.35, -0.2);
            group.add(seatBack);
        }

        // 方向盒
        const dashboard = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.2, 0.3), matDark
        );
        dashboard.position.set(0, 1.25, 0.7);
        dashboard.userData.fpHide = true;
        group.add(dashboard);

        // 车轮 - 带轮毂
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        const hubGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.32, 8);
        const hubMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.3, metalness: 0.8 });
        const wheelPositions = [
            [-0.9, 0.4, 1.3], [0.9, 0.4, 1.3],
            [-0.9, 0.4, -1.3], [0.9, 0.4, -1.3],
        ];
        this.wheels = [];
        for (const [x, y, z] of wheelPositions) {
            const wheel = new THREE.Mesh(wheelGeo, matTire);
            wheel.position.set(x, y, z);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            group.add(wheel);
            this.wheels.push(wheel);
            
            // 轮毂
            const hub = new THREE.Mesh(hubGeo, hubMat);
            hub.position.set(x, y, z);
            hub.rotation.z = Math.PI / 2;
            group.add(hub);
        }

        // 前保险杠
        const bumper = new THREE.Mesh(
            new THREE.BoxGeometry(2.0, 0.15, 0.2), matDark
        );
        bumper.position.set(0, 0.5, 2.05);
        group.add(bumper);

        // 前灯 - 带外壳
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffff88 });
        const lightHousingMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 });
        for (let i = 0; i < 2; i++) {
            const housing = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.15, 0.08), lightHousingMat
            );
            housing.position.set(-0.5 + i * 1.0, 0.9, 2.08);
            group.add(housing);
            
            const light = new THREE.Mesh(
                new THREE.CircleGeometry(0.1, 10), lightMat
            );
            light.position.set(-0.5 + i * 1.0, 0.9, 2.13);
            group.add(light);
        }

        // 后视镜
        for (let side = -1; side <= 1; side += 2) {
            const mirrorArm = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.04, 0.15), matDark
            );
            mirrorArm.position.set(side * 0.95, 1.35, 0.8);
            group.add(mirrorArm);
            const mirror = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.1, 0.03), matGlass
            );
            mirror.position.set(side * 1.05, 1.35, 0.85);
            group.add(mirror);
        }

        // 排气管
        const exhaust = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.06, 0.3, 8), matDark
        );
        exhaust.rotation.x = Math.PI / 2;
        exhaust.position.set(0.7, 0.5, -2.1);
        group.add(exhaust);

        // 防滚架（座椅后方）
        const rollCageMat = matDark;
        // 后立柱
        for (let side = -1; side <= 1; side += 2) {
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), rollCageMat
            );
            post.position.set(side * 0.8, 1.45, -0.8);
            group.add(post);
        }
        // 顶部横梁
        const topBar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), rollCageMat
        );
        topBar.rotation.z = Math.PI / 2;
        topBar.position.set(0, 1.8, -0.8);
        group.add(topBar);
        // 前斜撑
        for (let side = -1; side <= 1; side += 2) {
            const strut = new THREE.Mesh(
                new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6), rollCageMat
            );
            strut.position.set(side * 0.8, 1.6, -0.4);
            strut.rotation.x = 0.6;
            group.add(strut);
        }

        // 备胎（尾部挂载）
        const spareTire = new THREE.Mesh(
            new THREE.CylinderGeometry(0.38, 0.38, 0.22, 14), matTire
        );
        spareTire.rotation.z = Math.PI / 2;
        spareTire.position.set(0, 0.9, -2.15);
        spareTire.userData.partName = 'spareTire';
        group.add(spareTire);
        // 备胎轮毂
        const spareHub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.14, 0.24, 8),
            new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.3, metalness: 0.8 })
        );
        spareHub.rotation.z = Math.PI / 2;
        spareHub.position.set(0, 0.9, -2.15);
        group.add(spareHub);

        // 大灯护栏（金属网格保护）
        for (let i = 0; i < 2; i++) {
            const guard = new THREE.Mesh(
                new THREE.BoxGeometry(0.22, 0.12, 0.02),
                new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.6, wireframe: false })
            );
            guard.position.set(-0.5 + i * 1.0, 0.9, 2.15);
            group.add(guard);
            // 护栏横条
            for (let bar = 0; bar < 3; bar++) {
                const barMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.2, 0.015, 0.015), matDark
                );
                barMesh.position.set(-0.5 + i * 1.0, 0.85 + bar * 0.05, 2.16);
                group.add(barMesh);
            }
        }

        // 前拖车钩
        const towHook = new THREE.Mesh(
            new THREE.TorusGeometry(0.06, 0.02, 6, 8), matDark
        );
        towHook.position.set(0, 0.5, 2.1);
        towHook.rotation.y = Math.PI / 2;
        group.add(towHook);

        // === 武装吉普：车顶环形机枪塔（hasWeapon 配置驱动）===
        if (this.config?.hasWeapon) {
            const turretGroup = new THREE.Group();

            // 环形座圈
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.42, 0.045, 8, 18), matDark
            );
            ring.rotation.x = Math.PI / 2;
            turretGroup.add(ring);

            // 机枪防盾
            const shield = new THREE.Mesh(
                new THREE.BoxGeometry(0.75, 0.42, 0.05), matBody
            );
            shield.position.set(0, 0.34, -0.32);
            shield.userData.partName = 'mgShield';
            turretGroup.add(shield);

            // 机枪主体
            const mgBody = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.14, 0.55), matDark
            );
            mgBody.position.set(0, 0.36, -0.05);
            turretGroup.add(mgBody);

            // 机枪管
            const mgBarrel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.028, 0.032, 0.8, 8), matDark
            );
            mgBarrel.rotation.x = Math.PI / 2;
            mgBarrel.position.set(0, 0.37, -0.72);
            mgBarrel.userData.fpHide = true;
            turretGroup.add(mgBarrel);

            // 弹药箱
            const ammoBox = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.16, 0.26),
                new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 0.8 })
            );
            ammoBox.position.set(-0.2, 0.32, 0.05);
            turretGroup.add(ammoBox);

            // 握把
            for (let side = -1; side <= 1; side += 2) {
                const grip = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.02, 0.02, 0.14, 6), matDark
                );
                grip.position.set(side * 0.09, 0.3, 0.28);
                grip.rotation.x = 0.5;
                turretGroup.add(grip);
            }

            turretGroup.position.set(0, 1.95, -0.5);
            group.add(turretGroup);
            this.turret = turretGroup;
        }

        // 团队标识 - 带旗杆
        const flagPole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), matDark
        );
        flagPole.position.set(0, 1.55, 0);
        group.add(flagPole);
        
        const flag = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6, 0.4),
            new THREE.MeshBasicMaterial({
                color: this.team === 0 ? CONFIG.TEAMS.friendly.markerColor : CONFIG.TEAMS.enemy.markerColor,
                side: THREE.DoubleSide
            })
        );
        flag.position.set(0.3, 1.8, 0);
        group.add(flag);

        // 可脱落部件记录
        this._detachableParts = ['hood', 'windshield'];
    }

    _addVehicleSurfaceDetails(group, matBody, matDark, matGlass) {
        const seamMat = createProceduralMaterial('rubber', {
            baseColor: 0x101010,
            accentColor: 0x030303,
            detailColor: 0x3d3d3d,
            size: 128,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 4,
        }, { roughness: 0.95, metalness: 0.05, bumpScale: 0.01 });
        const boltMat = createProceduralMaterial('metal', {
            baseColor: 0x777777,
            accentColor: 0x444444,
            detailColor: 0xc9c9c9,
            size: 128,
            repeatX: 1,
            repeatY: 1,
            anisotropy: 4,
        }, { roughness: 0.32, metalness: 0.88, bumpScale: 0.02 });
        const dirtMat = new THREE.MeshBasicMaterial({ color: 0x4a3a22, transparent: true, opacity: 0.14, depthWrite: false });
        const teamColor = this.team === 0 ? CONFIG.TEAMS.friendly.color : CONFIG.TEAMS.enemy.color;
        const teamLabel = this.team === 0 ? 'F' : 'E';
        const vehicleLabel = {
            jeep: 'J',
            tank: 'T',
            apc: 'A',
            heli: 'H',
            plane: 'P',
        }[this.type] || 'V';
        const serial = `${vehicleLabel}${this.team + 1}${String(this.originalType || this.type).length}`;
        const badgeMat = _vehicleSvgMaterial(
            `vehicle-badge-${teamColor}-${teamLabel}`,
            _vehicleBadgeSvg(teamColor, teamLabel),
            0.88,
        );
        const serialMat = _vehicleSvgMaterial(
            `vehicle-serial-${teamColor}-${serial}`,
            _vehicleNumberSvg(teamColor, serial),
            0.9,
        );

        const addBox = (size, pos, mat, rot = null) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
            mesh.position.set(pos[0], pos[1], pos[2]);
            if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
            group.add(mesh);
            return mesh;
        };

        const addBoltRow = (count, start, delta, posY, mat = boltMat) => {
            for (let i = 0; i < count; i++) {
                addBox([0.04, 0.04, 0.04], [start[0] + delta[0] * i, posY, start[2] + delta[2] * i], mat);
            }
        };

        if (this.type === 'jeep') {
            addBox([1.85, 0.03, 3.7], [0, 0.88, 0], seamMat);
            addBox([1.65, 0.03, 1.0], [0, 1.34, 1.4], seamMat);
            addBox([1.55, 0.02, 0.08], [0, 0.78, 1.95], seamMat);
            addBoltRow(5, [-0.72, 0, 1.68], [0.36, 0, 0], 1.58);
            addBox([1.6, 0.06, 0.14], [0, 0.72, 2.02], dirtMat);
            addBox([0.08, 0.3, 1.2], [-1.02, 1.02, -0.25], seamMat);
            addBox([0.08, 0.3, 1.2], [1.02, 1.02, -0.25], seamMat);
            addBox([0.12, 0.05, 0.9], [0, 1.52, -0.55], matDark);
            _addVehicleSvgDecal(group, 'jeep_hood_badge', 0.75, 0.38, [0, 1.215, 1.62], [-Math.PI / 2, 0, 0], badgeMat);
            _addVehicleSvgDecal(group, 'jeep_left_door_serial', 0.72, 0.36, [-1.061, 1.12, -0.25], [0, -Math.PI / 2, 0], serialMat);
            _addVehicleSvgDecal(group, 'jeep_right_door_serial', 0.72, 0.36, [1.061, 1.12, -0.25], [0, Math.PI / 2, 0], serialMat);
        } else if (this.type === 'tank') {
            addBox([2.45, 0.03, 3.8], [0, 1.5, 0], seamMat);
            addBox([0.18, 0.55, 3.6], [1.48, 1.1, 0], seamMat);
            addBox([0.18, 0.55, 3.6], [-1.48, 1.1, 0], seamMat);
            addBoltRow(6, [-1.0, 0, -1.8], [0.4, 0, 0.7], 1.55);
            addBoltRow(6, [-1.0, 0, 1.8], [0.4, 0, -0.7], 1.35);
            addBox([1.2, 0.12, 0.9], [0, 2.0, -0.2], dirtMat);
            addBox([1.5, 0.05, 0.3], [0, 2.55, -0.3], matDark);
            _addVehicleSvgDecal(group, 'tank_hull_top_badge', 0.95, 0.48, [0, 1.535, 1.0], [-Math.PI / 2, 0, 0], badgeMat);
            _addVehicleSvgDecal(group, 'tank_left_side_serial', 0.86, 0.43, [-1.575, 1.25, 0.55], [0, -Math.PI / 2, 0], serialMat);
            _addVehicleSvgDecal(group, 'tank_right_side_serial', 0.86, 0.43, [1.575, 1.25, 0.55], [0, Math.PI / 2, 0], serialMat);
        } else if (this.type === 'apc') {
            addBox([2.2, 0.03, 4.8], [0, 1.1, 0], seamMat);
            addBox([2.2, 0.02, 1.0], [0, 1.8, -0.8], seamMat);
            addBox([2.0, 0.02, 1.0], [0, 1.8, 1.1], seamMat);
            addBoltRow(6, [-0.95, 0, -1.9], [0.38, 0, 0], 1.55);
            addBox([1.0, 0.06, 0.22], [0, 2.25, -0.6], dirtMat);
            addBox([0.16, 0.2, 0.8], [1.28, 1.45, 1.8], matDark);
            addBox([0.16, 0.2, 0.8], [-1.28, 1.45, 1.8], matDark);
            _addVehicleSvgDecal(group, 'apc_roof_badge', 0.92, 0.46, [0, 2.015, 0.85], [-Math.PI / 2, 0, 0], badgeMat);
            _addVehicleSvgDecal(group, 'apc_left_side_serial', 0.78, 0.39, [-1.225, 1.55, 0.55], [0, -Math.PI / 2, 0], serialMat);
            _addVehicleSvgDecal(group, 'apc_right_side_serial', 0.78, 0.39, [1.225, 1.55, 0.55], [0, Math.PI / 2, 0], serialMat);
        } else if (this.type === 'heli') {
            addBox([0.95, 0.02, 4.2], [0, 1.86, 0], seamMat, [0, 0, 0.02]);
            addBox([0.8, 0.03, 1.8], [0, 1.32, -1.9], seamMat, [-0.12, 0, 0]);
            addBox([0.75, 0.03, 1.8], [0, 1.32, 1.9], seamMat, [0.12, 0, 0]);
            addBox([0.2, 0.5, 0.1], [0.55, 1.9, -1.0], matDark);
            addBox([0.2, 0.5, 0.1], [-0.55, 1.9, -1.0], matDark);
            _addVehicleSvgDecal(group, 'heli_left_fuselage_serial', 0.74, 0.37, [-0.615, 1.62, -0.15], [0, -Math.PI / 2, 0], serialMat);
            _addVehicleSvgDecal(group, 'heli_right_fuselage_serial', 0.74, 0.37, [0.615, 1.62, -0.15], [0, Math.PI / 2, 0], serialMat);
            _addVehicleSvgDecal(group, 'heli_tail_badge', 0.52, 0.26, [0, 2.08, 3.2], [0, Math.PI, 0], badgeMat);
        } else if (this.type === 'plane') {
            _addVehicleSvgDecal(group, 'plane_left_wing_badge', 0.9, 0.45, [-1.5, 1.63, -0.15], [-Math.PI / 2, 0, -0.08], badgeMat);
            _addVehicleSvgDecal(group, 'plane_right_wing_badge', 0.9, 0.45, [1.5, 1.63, -0.15], [-Math.PI / 2, 0, 0.08], badgeMat);
            _addVehicleSvgDecal(group, 'plane_fuselage_serial', 0.76, 0.38, [0, 1.92, 1.35], [0, Math.PI, 0], serialMat);
        }

        if (matGlass && this.type !== 'heli') {
            addBox([0.95, 0.28, 0.03], [0, 1.34, 0.86], matGlass, [-0.3, 0, 0]);
        }
    }

    _buildTank(group, matBody, matDark, matTire) {
        // 履带 - 更精细
        const trackMat = createProceduralMaterial('rubber', {
            baseColor: 0x2a2a2a,
            accentColor: 0x0f0f0f,
            detailColor: 0x565656,
            size: 192,
            repeatX: 4,
            repeatY: 1,
            anisotropy: 8,
        }, { roughness: 0.98, metalness: 0.08, bumpScale: 0.05 });
        const trackTreadMat = createProceduralMaterial('rubber', {
            baseColor: 0x1a1a1a,
            accentColor: 0x050505,
            detailColor: 0x494949,
            size: 160,
            repeatX: 3,
            repeatY: 1,
            anisotropy: 8,
        }, { roughness: 1.0, metalness: 0.05, bumpScale: 0.055 });
        const eraMat = createProceduralMaterial('metal', {
            baseColor: 0x444444,
            accentColor: 0x222222,
            detailColor: 0x858585,
            size: 160,
            repeatX: 2,
            repeatY: 1,
            anisotropy: 6,
        }, { roughness: 0.72, metalness: 0.35, bumpScale: 0.028 });
        // 保存履带纹路mesh用于动画
        this._tankTreads = [];
        // 保存履带轮用于动画
        this._tankRoadWheels = [];

        for (let side = -1; side <= 1; side += 2) {
            // 履带主体
            const track = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 1.0, 4.5), trackMat
            );
            track.position.set(side * 1.3, 0.5, 0);
            track.castShadow = true;
            track.userData.partName = `track_${side}`;
            group.add(track);

            // 履带表面纹路 - 存储引用用于动画
            const treadsForSide = [];
            for (let i = -4; i <= 4; i++) {
                const tread = new THREE.Mesh(
                    new THREE.BoxGeometry(0.62, 0.05, 0.2), trackTreadMat
                );
                tread.position.set(side * 1.3, 0.95, i * 0.5);
                tread.userData.baseZ = i * 0.5;
                tread.userData.side = side;
                group.add(tread);
                treadsForSide.push(tread);
            }
            this._tankTreads.push(...treadsForSide);

            // 履带轮 - 带细节
            const wheelsForSide = [];
            for (let i = -2; i <= 2; i++) {
                const wheel = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16), matDark
                );
                wheel.position.set(side * 1.3, 0.4, i * 0.9);
                wheel.rotation.z = Math.PI / 2;
                group.add(wheel);
                wheelsForSide.push(wheel);
                
                // 轮中心装饰
                const hub = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.15, 0.15, 0.52, 8), 
                    new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 })
                );
                hub.position.set(side * 1.3, 0.4, i * 0.9);
                hub.rotation.z = Math.PI / 2;
                group.add(hub);
            }
            this._tankRoadWheels.push(...wheelsForSide);
            
            // 驱动轮（后部）
            const driveWheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.45, 0.45, 0.5, 12), matDark
            );
            driveWheel.position.set(side * 1.3, 0.45, -2.3);
            driveWheel.rotation.z = Math.PI / 2;
            group.add(driveWheel);
            this._tankRoadWheels.push(driveWheel);

            // 回程轮（顶部小轮 - 支撑上方回程履带）
            for (let i = -1; i <= 1; i++) {
                const returnRoller = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.18, 0.18, 0.45, 10), matDark
                );
                returnRoller.position.set(side * 1.3, 0.92, i * 1.2);
                returnRoller.rotation.z = Math.PI / 2;
                group.add(returnRoller);
            }

            // 履带上方回程段（盖住顶部轮子）
            const trackReturn = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.08, 4.0), trackMat
            );
            trackReturn.position.set(side * 1.3, 1.0, 0);
            group.add(trackReturn);

            // 侧裙板反应装甲（ERA）
            for (let i = -2; i <= 2; i++) {
                const eraBlock = new THREE.Mesh(
                    new THREE.BoxGeometry(0.08, 0.35, 0.55), eraMat
                );
                eraBlock.position.set(side * 1.52, 0.8, i * 0.75);
                eraBlock.userData.partName = `era_${side}_${i}`;
                group.add(eraBlock);
            }
        }

        // 车体 - 带斜面装甲
        const hull = new THREE.Mesh(
            new THREE.BoxGeometry(2.6, 0.8, 4.0), matBody
        );
        hull.position.y = 1.1;
        hull.castShadow = true;
        hull.userData.partName = 'hull';
        group.add(hull);

        // 侧装甲板
        for (let side = -1; side <= 1; side += 2) {
            const sideArmor = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.6, 3.8), matBody
            );
            sideArmor.position.set(side * 1.35, 0.8, 0);
            group.add(sideArmor);
            
            // 裙板
            const fender = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.05, 4.0), matDark
            );
            fender.position.set(side * 1.45, 1.0, 0);
            group.add(fender);
        }

        // 前装甲斜面 - 更倾斜
        const armor = new THREE.Mesh(
            new THREE.BoxGeometry(2.6, 0.9, 0.8), matBody
        );
        armor.position.set(0, 1.0, 2.0);
        armor.rotation.x = -0.6;
        armor.userData.partName = 'armor';
        group.add(armor);

        // 前装甲附加板
        const extraArmor = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 0.5, 0.3), matDark
        );
        extraArmor.position.set(0, 0.9, 2.2);
        extraArmor.rotation.x = -0.6;
        group.add(extraArmor);

        // 工具箱
        for (let side = -1; side <= 1; side += 2) {
            const toolbox = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.3, 0.6), matDark
            );
            toolbox.position.set(side * 1.4, 1.4, -1.0);
            group.add(toolbox);
        }

        // 炮塔组
        const turretGroup = new THREE.Group();
        
        // 炮塔 - 更圆滑的形状
        const turret = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.4, 0.8, 12), matBody
        );
        turret.position.y = 0;
        turret.castShadow = true;
        turret.userData.partName = 'turret';
        turretGroup.add(turret);
        
        // 炮塔顶部装甲
        const turretTop = new THREE.Mesh(
            new THREE.CylinderGeometry(0.9, 1.2, 0.2, 12), matBody
        );
        turretTop.position.y = 0.5;
        turretGroup.add(turretTop);

        // 炮塔前部反应装甲（楔形附加装甲）
        for (let side = -1; side <= 1; side += 2) {
            const wedgeArmor = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.5, 0.6), eraMat
            );
            wedgeArmor.position.set(side * 0.85, 0.1, -0.8);
            wedgeArmor.rotation.y = side * 0.3;
            wedgeArmor.userData.partName = `turretArmor_${side}`;
            turretGroup.add(wedgeArmor);
        }

        // 烟雾弹发射器组（炮塔两侧前方）
        const smokeLauncherMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.6 });
        for (let side = -1; side <= 1; side += 2) {
            const launcherBox = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.15, 0.3), smokeLauncherMat
            );
            launcherBox.position.set(side * 1.0, 0.35, -0.5);
            launcherBox.userData.partName = `smokeLauncher_${side}`;
            turretGroup.add(launcherBox);
            // 发射管
            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 3; col++) {
                    const tube = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6), smokeLauncherMat
                    );
                    tube.position.set(side * 1.0 + (col - 1) * 0.06, 0.4 + row * 0.06, -0.6);
                    tube.rotation.x = -0.3;
                    turretGroup.add(tube);
                }
            }
        }

        // 车长指挥塔（带观察窗）
        const cupola = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.4, 0.25, 10), matBody
        );
        cupola.position.set(-0.4, 0.65, 0.3);
        cupola.userData.partName = 'cupola';
        turretGroup.add(cupola);
        // 指挥塔舱门
        const cupolaHatch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.22, 0.05, 8), matDark
        );
        cupolaHatch.position.set(-0.4, 0.8, 0.3);
        turretGroup.add(cupolaHatch);
        // 指挥塔观察潜望镜
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const periscope = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.08, 0.12),
                new THREE.MeshStandardMaterial({ color: 0x222244, metalness: 0.9, roughness: 0.1 })
            );
            periscope.position.set(
                -0.4 + Math.cos(angle) * 0.3,
                0.75,
                0.3 + Math.sin(angle) * 0.3
            );
            periscope.rotation.y = angle;
            turretGroup.add(periscope);
        }

        // 炮管 - 带炮口制退器（第一人称保留可见：观瞄位在炮塔上方，炮管位于视野下缘，
        // 提供"坐在坦克里"的方位感——战地风格）
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.15, 3.5, 12), matDark
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0, -1.8);
        barrel.userData.partName = 'barrel';
        turretGroup.add(barrel);

        // 炮口制退器
        const muzzleBrake = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.4, 8), matDark
        );
        muzzleBrake.rotation.x = Math.PI / 2;
        muzzleBrake.position.set(0, 0, -3.5);
        turretGroup.add(muzzleBrake);

        // 炮管热护套
        const heatShield = new THREE.Mesh(
            new THREE.CylinderGeometry(0.16, 0.16, 2.0, 8), matBody
        );
        heatShield.rotation.x = Math.PI / 2;
        heatShield.position.set(0, 0, -1.5);
        turretGroup.add(heatShield);

        // 同轴机枪
        const mg = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.08, 0.6), matDark
        );
        mg.position.set(0.3, -0.2, -1.0);
        mg.userData.partName = 'mg';
        turretGroup.add(mg);

        // 瞄准镜（炮手主瞄准镜）
        const sight = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.15, 0.3), matDark
        );
        sight.position.set(0.3, 0.45, -0.3);
        turretGroup.add(sight);
        const sightLens = new THREE.Mesh(
            new THREE.CircleGeometry(0.05, 8),
            new THREE.MeshStandardMaterial({ color: 0x113311, metalness: 0.9, roughness: 0.1 })
        );
        sightLens.position.set(0.3, 0.45, -0.46);
        turretGroup.add(sightLens);

        // 天线
        const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.015, 1.5, 4), matDark
        );
        antenna.position.set(0.8, 0.8, 0.5);
        antenna.rotation.x = -0.1;
        turretGroup.add(antenna);

        // 炮塔尾部储物框
        const storageBasket = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.3, 0.5), matDark
        );
        storageBasket.position.set(0, 0.1, 0.8);
        storageBasket.userData.partName = 'storageBasket';
        turretGroup.add(storageBasket);

        turretGroup.position.y = 1.7;
        group.add(turretGroup);
        this.turret = turretGroup;

        // 顶部舱口
        const hatch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.1, 10), matDark
        );
        hatch.position.set(0, 2.2, 0.3);
        hatch.userData.partName = 'hatch';
        group.add(hatch);
        
        // 舱口手柄
        const hatchHandle = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.03, 0.03), matDark
        );
        hatchHandle.position.set(0, 2.28, 0.3);
        group.add(hatchHandle);

        // 排气管
        const exhaust = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 0.4, 8), matDark
        );
        exhaust.rotation.x = Math.PI / 2;
        exhaust.position.set(0.8, 1.0, -2.2);
        group.add(exhaust);

        // 可脱落部件记录
        this._detachableParts = ['mg', 'hatch', 'cupola', 'storageBasket', 'turretArmor_-1', 'turretArmor_1'];
    }

    _buildAPC(group, matBody, matDark, matGlass, matTire) {
        // 车体 - 更精细
        const hull = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 1.0, 5.0), matBody
        );
        hull.position.y = 0.8;
        hull.castShadow = true;
        hull.userData.partName = 'hull';
        group.add(hull);

        // 底盘裙板
        const apron = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.2, 4.8), matDark
        );
        apron.position.y = 0.35;
        group.add(apron);

        // 上层
        const upper = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 0.8, 3.5), matBody
        );
        upper.position.y = 1.6;
        upper.castShadow = true;
        upper.userData.partName = 'upper';
        group.add(upper);

        // 前斜面 - 更倾斜的装甲
        const front = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 1.0, 0.6), matBody
        );
        front.position.set(0, 0.9, 2.3);
        front.rotation.x = -0.4;
        front.userData.partName = 'front';
        group.add(front);

        // 前装甲附加板
        const frontArmor = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 0.6, 0.2), matDark
        );
        frontArmor.position.set(0, 0.9, 2.5);
        frontArmor.rotation.x = -0.4;
        group.add(frontArmor);

        // 窗口 - 带框
        for (let i = -1; i <= 1; i++) {
            const windowFrame = new THREE.Mesh(
                new THREE.BoxGeometry(0.55, 0.35, 0.06), matDark
            );
            windowFrame.position.set(i * 0.7, 1.7, 1.82);
            group.add(windowFrame);
            
            const window = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.3, 0.05), matGlass
            );
            window.position.set(i * 0.7, 1.7, 1.8);
            window.userData.partName = `window_${i}`;
            group.add(window);
        }

        // 侧面射击孔
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 3; i++) {
                const port = new THREE.Mesh(
                    new THREE.CircleGeometry(0.06, 8), matDark
                );
                port.position.set(side * 1.21, 1.5, -0.5 + i * 0.5);
                port.rotation.y = side * Math.PI / 2;
                group.add(port);
            }
        }

        // 后门
        const rearDoor = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 1.2, 0.1), matDark
        );
        rearDoor.position.set(0, 1.0, -2.55);
        group.add(rearDoor);
        
        // 后门把手
        const doorHandle = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.05, 0.05), matDark
        );
        doorHandle.position.set(0, 0.8, -2.6);
        group.add(doorHandle);

        // 炮塔组 - 更精细
        const turretGroup = new THREE.Group();
        const turret = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.7, 0.5, 12), matBody
        );
        turret.userData.partName = 'turret';
        turretGroup.add(turret);
        
        // 炮塔顶部
        const turretTop = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.6, 0.15, 12), matBody
        );
        turretTop.position.y = 0.3;
        turretGroup.add(turretTop);

        // 炮管 - 圆筒形
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.06, 1.2, 10), matDark
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.1, -0.6);
        barrel.userData.partName = 'barrel';
        turretGroup.add(barrel);
        
        // 炮口装置
        const muzzleDevice = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8), matDark
        );
        muzzleDevice.rotation.x = Math.PI / 2;
        muzzleDevice.position.set(0, 0.1, -1.2);
        turretGroup.add(muzzleDevice);

        // 炮塔侧面观察窗
        for (let side = -1; side <= 1; side += 2) {
            const turretWindow = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.1, 0.15), matGlass
            );
            turretWindow.position.set(side * 0.65, 0.1, 0);
            turretGroup.add(turretWindow);
        }

        turretGroup.position.set(0, 2.2, 0);
        group.add(turretGroup);
        this.turret = turretGroup;

        // 车轮 - 带轮毂
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
        const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.32, 8);
        const hubMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.3, metalness: 0.8 });
        this.wheels = [];
        for (let side = -1; side <= 1; side += 2) {
            for (let i = -2; i <= 2; i++) {
                const wheel = new THREE.Mesh(wheelGeo, matTire);
                wheel.position.set(side * 1.2, 0.4, i * 1.0);
                wheel.rotation.z = Math.PI / 2;
                wheel.castShadow = true;
                group.add(wheel);
                this.wheels.push(wheel);
                
                // 轮毂
                const hub = new THREE.Mesh(hubGeo, hubMat);
                hub.position.set(side * 1.2, 0.4, i * 1.0);
                hub.rotation.z = Math.PI / 2;
                group.add(hub);
            }
        }

        // 前灯
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffff88 });
        for (let side = -1; side <= 1; side += 2) {
            const light = new THREE.Mesh(
                new THREE.CircleGeometry(0.1, 8), lightMat
            );
            light.position.set(side * 0.8, 1.0, 2.55);
            group.add(light);
        }

        // 排气管
        const exhaust = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8), matDark
        );
        exhaust.rotation.x = Math.PI / 2;
        exhaust.position.set(0.8, 0.6, -2.5);
        group.add(exhaust);

        // 顶部储物箱
        const storageBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.25, 0.5), matDark
        );
        storageBox.position.set(0, 2.3, -1.5);
        group.add(storageBox);

        // 顶部舱口（步兵出入舱口）
        for (let i = -1; i <= 1; i += 2) {
            const roofHatch = new THREE.Mesh(
                new THREE.BoxGeometry(0.7, 0.04, 0.6), matDark
            );
            roofHatch.position.set(0, 2.05, i * 1.2);
            roofHatch.userData.partName = `roofHatch_${i}`;
            group.add(roofHatch);
            // 舱口把手
            const hatchHandle = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.03, 0.03), matDark
            );
            hatchHandle.position.set(0, 2.1, i * 1.2 + 0.25);
            group.add(hatchHandle);
        }

        // 侧面反应装甲块（ERA）
        const eraMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7, metalness: 0.3 });
        for (let side = -1; side <= 1; side += 2) {
            for (let i = -2; i <= 2; i++) {
                const eraBlock = new THREE.Mesh(
                    new THREE.BoxGeometry(0.06, 0.4, 0.6), eraMat
                );
                eraBlock.position.set(side * 1.25, 1.1, i * 0.8);
                eraBlock.userData.partName = `era_${side}_${i}`;
                group.add(eraBlock);
            }
        }

        // 挡泥板（车轮后方）
        const mudFlapMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        for (let side = -1; side <= 1; side += 2) {
            const mudFlap = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.4, 0.05), mudFlapMat
            );
            mudFlap.position.set(side * 1.2, 0.25, -2.6);
            group.add(mudFlap);
        }

        // 拖车钩
        const towHook = new THREE.Mesh(
            new THREE.TorusGeometry(0.08, 0.02, 6, 8), matDark
        );
        towHook.position.set(0, 0.6, 2.6);
        towHook.rotation.y = Math.PI / 2;
        group.add(towHook);

        this._detachableParts = ['front', 'roofHatch_-1', 'roofHatch_1'];
    }

    // 固定翼攻击机（螺旋桨式，二战/现代通用轮廓）
    _buildPlane(group, matBody, matDark, matGlass) {
        // 机身（流线型圆柱）
        const fuselage = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.35, 6.0, 10), matBody
        );
        fuselage.rotation.x = Math.PI / 2;
        fuselage.position.set(0, 1.6, 0.3);
        fuselage.castShadow = true;
        fuselage.userData.partName = 'fuselage';
        group.add(fuselage);

        // 机鼻整流罩 + 发动机罩
        const noseCone = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.5, 0.7, 10), matDark
        );
        noseCone.rotation.x = Math.PI / 2;
        noseCone.position.set(0, 1.6, -3.0);
        noseCone.userData.fpHide = true;
        group.add(noseCone);

        // 螺旋桨毂
        const propHub = new THREE.Mesh(
            new THREE.ConeGeometry(0.18, 0.45, 8), matDark
        );
        propHub.rotation.x = -Math.PI / 2;
        propHub.position.set(0, 1.6, -3.5);
        propHub.userData.fpHide = true;
        group.add(propHub);

        // 螺旋桨（三叶，绕 Z 轴旋转）
        const propGroup = new THREE.Group();
        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 1.7, 0.04), matDark
            );
            blade.position.y = 0.8;
            const holder = new THREE.Group();
            holder.rotation.z = (i / 3) * Math.PI * 2;
            holder.add(blade);
            propGroup.add(holder);
        }
        propGroup.position.set(0, 1.6, -3.42);
        propGroup.userData.fpHide = true;
        group.add(propGroup);
        this.mainRotor = propGroup;   // 复用旋翼动画（绕Z旋转在 update 中特判）
        this._propIsPlane = true;

        // 螺旋桨模糊盘
        const rotorBlur = new THREE.Mesh(
            new THREE.CircleGeometry(1.75, 20),
            new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
        );
        rotorBlur.position.set(0, 1.6, -3.44);
        rotorBlur.visible = false;
        group.add(rotorBlur);
        this.rotorBlur = rotorBlur;

        // 座舱盖
        const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
            matGlass
        );
        canopy.position.set(0, 2.1, -0.6);
        canopy.scale.set(0.9, 0.7, 1.6);
        canopy.userData.partName = 'canopy';
        canopy.userData.fpHide = true;
        group.add(canopy);

        // 主机翼（左右各一，带轻微上反角）
        for (let side = -1; side <= 1; side += 2) {
            const wing = new THREE.Mesh(
                new THREE.BoxGeometry(4.2, 0.12, 1.5), matBody
            );
            wing.position.set(side * 2.4, 1.55, -0.3);
            wing.rotation.z = side * 0.06;
            wing.castShadow = true;
            wing.userData.partName = `wing_${side}`;
            group.add(wing);

            // 翼尖
            const wingTip = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.1, 1.0), matDark
            );
            wingTip.position.set(side * 4.6, 1.68, -0.3);
            wingTip.rotation.z = side * 0.06;
            group.add(wingTip);

            // 机翼下挂载火箭巢
            const rocketPod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.16, 0.16, 0.9, 8), matDark
            );
            rocketPod.rotation.x = Math.PI / 2;
            rocketPod.position.set(side * 1.8, 1.38, -0.3);
            group.add(rocketPod);
        }

        // 水平尾翼
        for (let side = -1; side <= 1; side += 2) {
            const hStab = new THREE.Mesh(
                new THREE.BoxGeometry(1.6, 0.08, 0.8), matBody
            );
            hStab.position.set(side * 1.0, 1.75, 3.0);
            group.add(hStab);
        }

        // 垂直尾翼
        const vStab = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 1.2, 1.1), matBody
        );
        vStab.position.set(0, 2.3, 3.0);
        vStab.castShadow = true;
        vStab.userData.partName = 'tail';
        group.add(vStab);

        // 起落架（固定式）
        for (let side = -1; side <= 1; side += 2) {
            const strut = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6), matDark
            );
            strut.position.set(side * 1.1, 0.9, -0.8);
            group.add(strut);
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28, 0.28, 0.18, 10),
                new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
            );
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(side * 1.1, 0.35, -0.8);
            group.add(wheel);
        }
        // 尾轮
        const tailWheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.12, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
        );
        tailWheel.rotation.z = Math.PI / 2;
        tailWheel.position.set(0, 0.22, 2.9);
        group.add(tailWheel);

        // 机头武器锚点（固定前射机枪；无炮塔，方向=机头朝向）
        const weaponAnchor = new THREE.Group();
        weaponAnchor.position.set(0, 1.5, -3.0);
        group.add(weaponAnchor);
        this.turret = weaponAnchor;
    }

    _buildHeli(group, matBody, matDark, matGlass) {
        // 机身
        const fuselage = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.4, 4.5, 10), matBody
        );
        fuselage.rotation.x = Math.PI / 2;
        fuselage.position.set(0, 1.5, 0);
        fuselage.castShadow = true;
        fuselage.userData.partName = 'fuselage';
        group.add(fuselage);

        // 驾驶舱玻璃
        const cockpit = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
            matGlass
        );
        cockpit.position.set(0, 1.8, -1.5);
        cockpit.scale.set(1, 0.8, 1.2);
        cockpit.userData.partName = 'cockpit';
        cockpit.userData.fpHide = true;
        group.add(cockpit);

        this._addHeliFirstPersonCockpit(group);

        // 机鼻
        const nose = new THREE.Mesh(
            new THREE.ConeGeometry(0.4, 1.2, 8), matBody
        );
        nose.rotation.x = -Math.PI / 2;
        nose.position.set(0, 1.5, -2.5);
        nose.castShadow = true;
        nose.userData.partName = 'nose';
        nose.userData.fpHide = true;
        group.add(nose);

        // 尾梁
        const tailBoom = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.15, 4.0, 8), matBody
        );
        tailBoom.rotation.x = Math.PI / 2;
        tailBoom.position.set(0, 1.8, 2.5);
        tailBoom.castShadow = true;
        tailBoom.userData.partName = 'tailBoom';
        group.add(tailBoom);

        // 尾翼
        const tailFin = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.8, 0.6), matBody
        );
        tailFin.position.set(0, 2.2, 4.3);
        tailFin.userData.partName = 'tailFin';
        group.add(tailFin);

        // 尾桨
        const tailRotorHub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.3, 6), matDark
        );
        tailRotorHub.rotation.z = Math.PI / 2;
        tailRotorHub.position.set(0.2, 2.0, 4.5);
        group.add(tailRotorHub);

        const tailRotorBlade = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 1.2, 0.06), matDark
        );
        tailRotorBlade.position.set(0.35, 2.0, 4.5);
        group.add(tailRotorBlade);
        this.tailRotor = tailRotorBlade;

        // 主旋翼毅 - 带倾斜盘细节
        const rotorHub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8), matDark
        );
        rotorHub.position.set(0, 2.6, 0);
        group.add(rotorHub);

        // 倾斜盘（swashplate）
        const swashplate = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.22, 0.06, 10), matDark
        );
        swashplate.position.set(0, 2.45, 0);
        group.add(swashplate);

        // 倾斜盘连杆
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const link = new THREE.Mesh(
                new THREE.BoxGeometry(0.03, 0.2, 0.03), matDark
            );
            link.position.set(Math.cos(angle) * 0.15, 2.55, Math.sin(angle) * 0.15);
            group.add(link);
        }

        // 主旋翼叶片
        const blade1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.03, 7.0), matDark
        );
        blade1.position.set(0, 2.8, 0);
        group.add(blade1);

        const blade2 = new THREE.Mesh(
            new THREE.BoxGeometry(7.0, 0.03, 0.15), matDark
        );
        blade2.position.set(0, 2.8, 0);
        group.add(blade2);

        this.mainRotor = new THREE.Group();
        this.mainRotor.add(blade1);
        this.mainRotor.add(blade2);
        group.add(this.mainRotor);

        const rotorBlurMat = new THREE.MeshBasicMaterial({
            color: 0x1f2424,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const rotorBlur = new THREE.Mesh(new THREE.CircleGeometry(3.7, 48), rotorBlurMat);
        rotorBlur.rotation.x = -Math.PI / 2;
        rotorBlur.position.set(0, 2.81, 0);
        rotorBlur.visible = false;
        group.add(rotorBlur);
        this.rotorBlur = rotorBlur;

        // 起落架
        const skidGeo = new THREE.BoxGeometry(0.1, 0.1, 4.0);
        const skidL = new THREE.Mesh(skidGeo, matDark);
        skidL.position.set(-0.8, 0.3, 0);
        skidL.userData.partName = 'skidL';
        group.add(skidL);
        const skidR = new THREE.Mesh(skidGeo, matDark);
        skidR.position.set(0.8, 0.3, 0);
        skidR.userData.partName = 'skidR';
        group.add(skidR);

        // 起落架支撑
        for (let z = -1; z <= 1; z += 2) {
            const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), matDark);
            strutL.position.set(-0.7, 0.7, z * 1.5);
            group.add(strutL);
            const strutR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), matDark);
            strutR.position.set(0.7, 0.7, z * 1.5);
            group.add(strutR);
        }

        // 武器挂架 - 带火箭巢
        for (let side = -1; side <= 1; side += 2) {
            const pylon = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.1, 1.0), matDark
            );
            pylon.position.set(side * 1.2, 1.3, 0);
            pylon.userData.partName = `pylon_${side}`;
            group.add(pylon);

            // 机炮
            const gun = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.15, 0.6), matDark
            );
            gun.position.set(side * 1.2, 1.15, -0.3);
            group.add(gun);

            // 火箭发射巢
            const rocketPod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 0.8, 10), matDark
            );
            rocketPod.rotation.x = Math.PI / 2;
            rocketPod.position.set(side * 1.2, 1.2, 0.3);
            rocketPod.userData.partName = `rocketPod_${side}`;
            group.add(rocketPod);
            // 火箭发射管细节
            for (let row = -1; row <= 1; row++) {
                for (let col = -1; col <= 1; col++) {
                    const tube = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.03, 0.03, 0.82, 6), matDark
                    );
                    tube.rotation.x = Math.PI / 2;
                    tube.position.set(side * 1.2 + col * 0.08, 1.2 + row * 0.08, 0.3);
                    group.add(tube);
                }
            }
        }

        // 舱门机枪（右侧）
        const doorGunMount = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.3, 0.04), matDark
        );
        doorGunMount.position.set(0.65, 1.6, -0.2);
        group.add(doorGunMount);
        const doorGun = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), matDark
        );
        doorGun.rotation.z = Math.PI / 2;
        doorGun.position.set(0.85, 1.5, -0.2);
        doorGun.userData.partName = 'doorGun';
        group.add(doorGun);
        // 机枪弹箱
        const ammoBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.1, 0.2), matDark
        );
        ammoBox.position.set(0.7, 1.65, -0.2);
        group.add(ammoBox);

        // 通讯天线
        const commAntenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.012, 1.2, 4), matDark
        );
        commAntenna.position.set(-0.4, 2.3, 0.8);
        commAntenna.rotation.x = -0.05;
        group.add(commAntenna);

        // 引擎排气口（带热偏导板）
        const exhaustPort = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.2, 0.1), matDark
        );
        exhaustPort.position.set(0, 1.4, 1.5);
        group.add(exhaustPort);
        // 热偏导板
        const heatDeflector = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.02, 0.25), matDark
        );
        heatDeflector.position.set(0, 1.5, 1.55);
        heatDeflector.rotation.x = 0.5;
        group.add(heatDeflector);

        // 炮塔组（机身下方机枪）
        const turretGroup = new THREE.Group();
        const turret = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.4), matBody
        );
        turretGroup.add(turret);
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), matDark
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0, -0.6);
        turretGroup.add(barrel);
        turretGroup.position.set(0, 1.0, -0.5);
        group.add(turretGroup);
        this.turret = turretGroup;

        // 旋翼动画状态
        this.rotorSpeed = 0;

        this._detachableParts = ['pylon_-1', 'pylon_1', 'tailFin', 'doorGun', 'rocketPod_-1', 'rocketPod_1'];
    }

    _addHeliFirstPersonCockpit(group) {
        if (!this._fpHeliVisibleMeshes) this._fpHeliVisibleMeshes = [];

        const frameMat = createProceduralMaterial('metal', {
            baseColor: 0x111716,
            accentColor: 0x050606,
            detailColor: 0x4f5c5a,
            size: 128,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 4,
        }, { roughness: 0.72, metalness: 0.35, bumpScale: 0.02 });
        const rubberMat = createProceduralMaterial('rubber', {
            baseColor: 0x070909,
            accentColor: 0x010202,
            detailColor: 0x3c4240,
            size: 128,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 4,
        }, { roughness: 0.9, metalness: 0.1, bumpScale: 0.025 });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x5f8fa8,
            roughness: 0.05,
            metalness: 0.25,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
        });
        const panelMat = createProceduralMaterial('metal', {
            baseColor: 0x171b1c,
            accentColor: 0x080a0a,
            detailColor: 0x434b4b,
            size: 128,
            repeatX: 2,
            repeatY: 1,
            anisotropy: 4,
        }, { roughness: 0.84, metalness: 0.24, bumpScale: 0.02 });
        const screenMat = new THREE.MeshBasicMaterial({
            color: 0x2fb7a8,
            transparent: true,
            opacity: 0.75,
        });

        const markFp = (mesh) => {
            mesh.userData.fpVisible = true;
            mesh.visible = false;
            mesh.renderOrder = 5;
            group.add(mesh);
            this._fpHeliVisibleMeshes.push(mesh);
            return mesh;
        };
        const addBox = (name, size, pos, mat, rot = null) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
            mesh.name = name;
            mesh.userData.partName = name;
            mesh.position.set(pos[0], pos[1], pos[2]);
            if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
            return markFp(mesh);
        };

        addBox('heli_fp_windshield_glass', [1.55, 0.62, 0.035], [0, 2.05, -2.12], glassMat, [-0.12, 0, 0]);
        addBox('heli_fp_windshield_top', [1.7, 0.07, 0.08], [0, 2.39, -2.04], frameMat, [-0.12, 0, 0]);
        addBox('heli_fp_windshield_bottom', [1.55, 0.08, 0.1], [0, 1.72, -2.16], rubberMat, [-0.12, 0, 0]);
        addBox('heli_fp_windshield_center_post', [0.055, 0.68, 0.075], [0, 2.05, -2.09], frameMat, [-0.12, 0, 0]);
        addBox('heli_fp_windshield_left_post', [0.065, 0.72, 0.08], [-0.82, 2.03, -2.02], frameMat, [-0.1, 0, -0.16]);
        addBox('heli_fp_windshield_right_post', [0.065, 0.72, 0.08], [0.82, 2.03, -2.02], frameMat, [-0.1, 0, 0.16]);
        addBox('heli_fp_left_window_frame', [0.06, 0.58, 0.82], [-0.92, 1.94, -1.62], frameMat, [0, -0.3, 0]);
        addBox('heli_fp_right_window_frame', [0.06, 0.58, 0.82], [0.92, 1.94, -1.62], frameMat, [0, 0.3, 0]);
        addBox('heli_fp_canopy_roof_bar', [1.45, 0.07, 0.55], [0, 2.45, -1.58], frameMat);
        addBox('heli_fp_dashboard', [1.25, 0.22, 0.42], [0, 1.58, -1.96], panelMat, [-0.2, 0, 0]);
        addBox('heli_fp_mfd_left', [0.28, 0.13, 0.025], [-0.32, 1.66, -2.18], screenMat, [-0.22, 0, 0]);
        addBox('heli_fp_mfd_right', [0.28, 0.13, 0.025], [0.32, 1.66, -2.18], screenMat, [-0.22, 0, 0]);
        addBox('heli_fp_sight_mount', [0.08, 0.22, 0.08], [0, 1.92, -2.22], rubberMat);
        addBox('heli_fp_sight_ring_h', [0.32, 0.025, 0.025], [0, 2.04, -2.25], screenMat);
        addBox('heli_fp_sight_ring_v', [0.025, 0.32, 0.025], [0, 2.04, -2.25], screenMat);
    }

    // 放置载具
    place(x, z, yaw = 0) {
        const safePos = this._findSafePlacePosition(x, z);
        this.position.set(safePos.x, 0, safePos.z);
        this.yaw = yaw;
        const groundY = this.world.getHeight(safePos.x, safePos.z);
        this.position.y = groundY;
        this._updateModel();
    }

    _findSafePlacePosition(x, z) {
        const radius = this.type === 'tank' ? 2.8 : (this.type === 'apc' ? 2.4 : (this.type === 'heli' ? 3.2 : 1.7));
        const height = this.type === 'tank' ? 2.8 : (this.type === 'apc' ? 2.4 : (this.type === 'heli' ? 3.0 : 2.0));
        const halfSize = CONFIG.WORLD.size / 2 - 8;
        const candidates = [
            [0, 0], [6, 0], [-6, 0], [0, 6], [0, -6],
            [10, 0], [-10, 0], [0, 10], [0, -10],
            [10, 8], [-10, 8], [10, -8], [-10, -8],
            [16, 0], [-16, 0], [0, 16], [0, -16],
            [18, 12], [-18, 12], [18, -12], [-18, -12],
        ];

        for (const [ox, oz] of candidates) {
            const px = THREE.MathUtils.clamp(x + ox, -halfSize, halfSize);
            const pz = THREE.MathUtils.clamp(z + oz, -halfSize, halfSize);
            const py = this.world.getHeight(px, pz);
            if (!this.world.checkCollision(new THREE.Vector3(px, py, pz), radius, height)) {
                return { x: px, z: pz };
            }
        }
        return { x, z };
    }

    // 更新载具
    update(dt, input, isDriver) {
        if (!this.alive) return;

        if (isDriver && input) {
            this._handleInput(dt, input);
        }

        // 物理更新
        this._updatePhysics(dt);

        // 炮塔冷却
        if (this.cannonCooldown > 0) {
            this.cannonCooldown -= dt;
        }
        if (this.secondaryCooldown > 0) {
            this.secondaryCooldown -= dt;
        }

        // 弹药自动恢复（战地风格：停火后缓慢补弹）
        this._ammoRegenTimer += dt;
        const regenDelay = CONFIG.VEHICLES._ammoRegenDelay || 5.0;
        const regenRate = CONFIG.VEHICLES._ammoRegenRate || 3.0;
        if (this._ammoRegenTimer >= regenDelay) {
            if (this.cannonAmmo < this.maxCannonAmmo) {
                this.cannonAmmo = Math.min(this.maxCannonAmmo, this.cannonAmmo + regenRate * dt);
            }
            if (this.secondaryAmmo < this.maxSecondaryAmmo) {
                this.secondaryAmmo = Math.min(this.maxSecondaryAmmo, this.secondaryAmmo + regenRate * dt);
            }
        }

        // 炮塔平滑旋转 - 带惯性：加速/减速更有质量感（战地坦克炮塔手感）
        if (this.config.hasWeapon && this.turret) {
            const yawDiff = this._shortestAngleDiff(this._targetTurretYaw, this.turretYaw);
            const pitchDiff = this._targetTurretPitch - this.turretPitch;
            // 角速度积分：先加速再减速，不再瞬跟
            if (this._turretYawVel === undefined) this._turretYawVel = 0;
            if (this._turretPitchVel === undefined) this._turretPitchVel = 0;
            const maxYawSpeed = this.config.isAircraft ? 4.5 : 2.2;   // rad/s
            const maxPitchSpeed = this.config.isAircraft ? 3.0 : 1.6;
            const yawAccel = maxYawSpeed * 6;
            const pitchAccel = maxPitchSpeed * 6;
            // 目标角速度与误差成正比，限幅
            const desiredYawVel = THREE.MathUtils.clamp(yawDiff * 8, -maxYawSpeed, maxYawSpeed);
            const desiredPitchVel = THREE.MathUtils.clamp(pitchDiff * 8, -maxPitchSpeed, maxPitchSpeed);
            this._turretYawVel = THREE.MathUtils.lerp(this._turretYawVel, desiredYawVel, 1 - Math.pow(0.02, dt));
            this._turretPitchVel = THREE.MathUtils.lerp(this._turretPitchVel, desiredPitchVel, 1 - Math.pow(0.02, dt));
            // 接近目标时额外阻尼，避免过冲抖动
            if (Math.abs(yawDiff) < 0.05) this._turretYawVel *= 0.85;
            if (Math.abs(pitchDiff) < 0.04) this._turretPitchVel *= 0.85;
            this.turretYaw += this._turretYawVel * dt;
            this.turretPitch += this._turretPitchVel * dt;
            this.turretPitch = THREE.MathUtils.clamp(this.turretPitch, -0.5, 0.7);
        }

        // 模型更新
        this._updateModel();

        // 视觉特效：AI载具降频，玩家驾驶保留完整效果
        const isPlayerDriver = isDriver && input && typeof input.getMouseDelta === 'function';
        this._updateVehicleEffects(dt, isPlayerDriver);

        // 引擎声（传入与玩家的距离：远处衰减+闷化，怠速压低音量）
        if (this.engineSound) {
            let dist = 0;
            const lp = this.audio?.listenerPosition;
            if (lp) {
                const dx = this.position.x - lp.x;
                const dy = this.position.y - lp.y;
                const dz = this.position.z - lp.z;
                dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            }
            this.engineSound.setSpeed(Math.abs(this.velocity), this._engineLoad, dist);
        }

        // 碰撞冷却
        if (this._collisionCooldown > 0) {
            this._collisionCooldown -= dt;
        }
    }

    _handleInput(dt, input) {
        if (this.config.isAircraft) {
            this._handleHeliInput(dt, input);
            return;
        }

        const dmgMult = this._damageSpeedMult ?? 1;
        const accel = this.config.acceleration * dmgMult;
        const maxSpeed = this.config.maxSpeed * dmgMult;
        const brakeForce = this.config.brakeForce || this.config.acceleration * 1.5;
        const grip = this.config.grip || 0.9;
        const driftFactor = this.config.driftFactor || 0.2;

        // 引擎负载计算
        let targetLoad = 0;

        // 加速/减速 - 使用平滑加速曲线
        const forwardInput = input.isKeyDown('KeyW');
        const reverseInput = input.isKeyDown('KeyS');
        if (forwardInput && !reverseInput) {
            const speedFactor = 1 - Math.abs(this.velocity) / maxSpeed * 0.5;
            this.velocity += accel * speedFactor * dt;
            targetLoad = 1.0;
        } else if (reverseInput && !forwardInput) {
            if (this.velocity > 0.5) {
                // 刹车
                this.velocity -= brakeForce * 1.25 * dt;
                targetLoad = 0.3;
            } else {
                // 倒车
                const speedFactor = 1 - Math.abs(this.velocity) / (maxSpeed * 0.4) * 0.5;
                this.velocity -= accel * 0.6 * speedFactor * dt;
                targetLoad = 0.5;
            }
        } else {
            // 自然减速（惯性）- 抓地力越低滑行越远
            const decel = (1 - grip) * 0.3 + 0.2;
            this.velocity *= Math.pow(decel, dt);
        }

        // 手刹 - 触发漂移
        const handbrake = input.isKeyDown('Space');
        if (handbrake) {
            this.velocity *= Math.pow(0.3, dt);
            // 手刹时大幅降低抓地力，触发漂移
            this._isDrifting = true;
        } else {
            this._isDrifting = false;
        }

        // 限速
        this.velocity = THREE.MathUtils.clamp(this.velocity, -maxSpeed * 0.4, maxSpeed);

        // 转向 - 速度越快转向越平滑
        const speedRatio = Math.min(Math.abs(this.velocity) / maxSpeed, 1);
        const steerAssist = Math.abs(this.velocity) < 0.6 ? 0.35 : 1.0;
        const turnSpeed = this.config.turnSpeed * (0.28 + speedRatio * 0.72) * steerAssist;
        const turnDir = this.velocity >= 0 ? 1 : -1;
        let turning = 0;
        if (input.isKeyDown('KeyA')) {
            this.yaw += turnSpeed * dt * turnDir;
            this._bodyRoll = THREE.MathUtils.lerp(this._bodyRoll, 0.05 * speedRatio, dt * 5);
            turning = 1;
        }
        if (input.isKeyDown('KeyD')) {
            this.yaw -= turnSpeed * dt * turnDir;
            this._bodyRoll = THREE.MathUtils.lerp(this._bodyRoll, -0.05 * speedRatio, dt * 5);
            turning = -1;
        }
        if (!input.isKeyDown('KeyA') && !input.isKeyDown('KeyD')) {
            this._bodyRoll = THREE.MathUtils.lerp(this._bodyRoll, 0, dt * 5);
        }

        // === 漂移物理 ===
        // 转向时产生侧向速度
        if (turning !== 0 && Math.abs(this.velocity) > 3) {
            const effectiveGrip = handbrake ? grip * 0.3 : grip;
            const lateralForce = turnSpeed * speedRatio * (1 - effectiveGrip) * driftFactor * 10;
            this.lateralVelocity += lateralForce * turning * dt * (this.velocity > 0 ? 1 : -1);
        }

        // 侧向速度衰减 - 抓地力越高衰减越快
        const effectiveGrip = handbrake ? grip * 0.3 : grip;
        this.lateralVelocity *= Math.pow(effectiveGrip, dt * 10);

        // 限幅
        this.lateralVelocity = THREE.MathUtils.clamp(this.lateralVelocity, -maxSpeed * 0.6, maxSpeed * 0.6);

        // 判断是否打滑
        this._isSkidding = Math.abs(this.lateralVelocity) > 1.5 && Math.abs(this.velocity) > 2;

        // 引擎负载平滑
        this._engineLoad = THREE.MathUtils.lerp(this._engineLoad, targetLoad, dt * 3);

        // 炮塔控制（如果有武器）
        if (this.config.hasWeapon && this.turret) {
            if (input.isMouseDown(0) && this.cannonCooldown <= 0) {
                this._fireCannon();
            }
            if (input.isMouseDown(2) && this.config.secondaryDamage && this.secondaryCooldown <= 0) {
                this._fireSecondaryWeapon();
            }
        }
    }

    // 固定翼飞行输入（战地风格）：机头指向=飞行方向=射击方向
    // W/S 或鼠标上下控制俯仰，机头朝下俯冲即可扫射地面，Space 油门
    _handlePlaneInput(dt, input) {
        const dmgMult = this._damageSpeedMult ?? 1;
        const accel = this.config.acceleration * dmgMult;
        const maxSpeed = this.config.maxSpeed * dmgMult;
        const groundY = this.world.getHeight(this.position.x, this.position.z);
        const isLanded = this.position.y <= groundY + 0.65;

        let targetLoad = 0;

        // === 油门：W 或 Space 加速 ===
        if (input.isKeyDown('KeyW') || input.isKeyDown('Space')) {
            this.velocity += accel * (isLanded ? 0.6 : 1) * dt;
            targetLoad = 1.0;
        } else if (input.isKeyDown('KeyS') && isLanded) {
            // 地面刹车/倒退
            this.velocity -= accel * 0.5 * dt;
        } else {
            // 空中滑翔阻力小
            this.velocity *= Math.pow(isLanded ? 0.55 : 0.99, dt);
        }

        // === 俯仰：鼠标上下（主）+ S/Shift 拉杆（辅），机头指哪飞哪 ===
        // 玩家驾驶时 PlayerController 不消费鼠标增量，这里直接读取（AI 输入无此方法）
        const mouseDelta = (typeof input.getMouseDelta === 'function') ? input.getMouseDelta() : null;
        if (!isLanded) {
            if (mouseDelta) {
                // 鼠标下移(movementY 为正)= 推杆低头（pitchAngle 减小 = 机头朝下）
                this.pitchAngle -= mouseDelta.y * 0.55;
                // 鼠标左右=滚转辅助转向
                this.yaw -= mouseDelta.x * 0.5;
                this._planeMouseRoll = THREE.MathUtils.clamp((this._planeMouseRoll || 0) - mouseDelta.x * 2.2, -0.7, 0.7);
            }
            // 键盘辅助俯仰：S 推杆低头，Shift 拉杆抬头（AI 无鼠标，需要独立低头指令）
            if (input.isKeyDown('KeyS')) {
                this.pitchAngle -= 0.9 * dt;   // 推杆低头
            }
            if (input.isKeyDown('ShiftLeft')) {
                this.pitchAngle += 0.9 * dt;   // 拉杆抬头
            }
            this.pitchAngle = THREE.MathUtils.clamp(this.pitchAngle, -1.1, 0.8);
        } else {
            // 地面滑跑：机头回平；速度够快自动抬头离地
            this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, 0, dt * 4);
            if (Math.abs(this.velocity) > maxSpeed * 0.55) {
                this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, 0.3, dt * 2);
                this.verticalVelocity = Math.max(this.verticalVelocity, 3);
            }
        }

        // === 转向：A/D 滚转+偏航 ===
        let rollTarget = this._planeMouseRoll || 0;
        this._planeMouseRoll = THREE.MathUtils.lerp(this._planeMouseRoll || 0, 0, dt * 3);
        if (input.isKeyDown('KeyA')) {
            this.yaw += this.config.turnSpeed * (isLanded ? 0.5 : 1) * dt;
            rollTarget += isLanded ? 0.03 : 0.45;
        } else if (input.isKeyDown('KeyD')) {
            this.yaw -= this.config.turnSpeed * (isLanded ? 0.5 : 1) * dt;
            rollTarget += isLanded ? -0.03 : -0.45;
        }
        this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, rollTarget, dt * 3.5);

        // === 垂直速度 = 机头俯仰 × 前进速度（机头指哪飞哪的核心）===
        const speedRatio = Math.abs(this.velocity) / maxSpeed;
        this.verticalVelocity = Math.sin(this.pitchAngle) * Math.abs(this.velocity);
        // 失速：速度不足时机头自动下垂 + 下坠
        if (!isLanded && speedRatio < 0.3) {
            const stall = 1 - speedRatio / 0.3;
            this.verticalVelocity -= 7 * stall;
            this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, -0.35 * stall, dt * 1.5);
        }
        // 俯冲加速/爬升减速（能量守恒手感）
        if (!isLanded) {
            this.velocity -= Math.sin(this.pitchAngle) * 3.5 * dt;
        }

        // 限速
        this.velocity = THREE.MathUtils.clamp(this.velocity, isLanded ? -maxSpeed * 0.2 : 0, maxSpeed * 1.15);
        this.lateralVelocity = 0;

        // 螺旋桨转速
        const rotorTarget = isLanded && targetLoad === 0 ? 14 : 34;
        this.rotorSpeed = THREE.MathUtils.lerp(this.rotorSpeed, rotorTarget, dt * 2);
        this._engineLoad = THREE.MathUtils.lerp(this._engineLoad, targetLoad, dt * 3);

        // 武器：机头机枪（只在空中或滑跑时能开火）
        if (this.config.hasWeapon && this.turret) {
            if (input.isMouseDown(0) && this.cannonCooldown <= 0) {
                this._fireCannon();
            }
        }
    }

    _handleHeliInput(dt, input) {
        // 固定翼分流到专属飞行操控
        if (this.config.isPlane) {
            this._handlePlaneInput(dt, input);
            return;
        }
        const dmgMult = this._damageSpeedMult ?? 1;
        const accel = this.config.acceleration * dmgMult;
        const maxSpeed = this.config.maxSpeed * dmgMult;
        const climbSpeed = this.config.climbSpeed * (0.6 + 0.4 * dmgMult);
        const groundY = this.world.getHeight(this.position.x, this.position.z);
        const isLanded = this.position.y <= groundY + 0.65;

        let targetLoad = 0;

        // 前进/后退
        if (input.isKeyDown('KeyW')) {
            this.velocity += accel * (isLanded ? 0.35 : 1) * dt;
            this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, isLanded ? -0.04 : -0.15, dt * 3);
            targetLoad = 1.0;
        } else if (input.isKeyDown('KeyS')) {
            this.velocity -= accel * (isLanded ? 0.25 : 0.7) * dt;
            this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, isLanded ? 0.03 : 0.1, dt * 3);
            targetLoad = 0.5;
        } else {
            this.velocity *= Math.pow(isLanded ? 0.55 : 0.92, dt);
            this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, 0, dt * 3);
        }

        // 横移：Q 向左、E 向右，便于低空修正落点
        const strafeAccel = accel * (isLanded ? 0.2 : 0.75);
        let rollTarget = 0;
        if (input.isKeyDown('KeyQ')) {
            this.lateralVelocity -= strafeAccel * dt;
            rollTarget += isLanded ? 0.03 : 0.10;
        } else if (input.isKeyDown('KeyE')) {
            this.lateralVelocity += strafeAccel * dt;
            rollTarget += isLanded ? -0.03 : -0.10;
        } else {
            this.lateralVelocity *= Math.pow(isLanded ? 0.45 : 0.88, dt);
        }

        // 上升/下降 - Space 上升，Shift 下降
        if (input.isKeyDown('Space')) {
            this.verticalVelocity += climbSpeed * dt;
            targetLoad = Math.max(targetLoad, 0.8);
        } else if (input.isKeyDown('ShiftLeft')) {
            this.verticalVelocity -= climbSpeed * dt;
        } else {
            this.verticalVelocity *= Math.pow(isLanded ? 0.2 : 0.86, dt);
        }

        // 限速
        const speedLimit = isLanded ? maxSpeed * 0.25 : maxSpeed;
        this.velocity = THREE.MathUtils.clamp(this.velocity, -speedLimit * 0.4, speedLimit);
        this.lateralVelocity = THREE.MathUtils.clamp(this.lateralVelocity, -speedLimit * 0.45, speedLimit * 0.45);
        this.verticalVelocity = THREE.MathUtils.clamp(this.verticalVelocity, -climbSpeed, climbSpeed);

        // 转向（A/D）
        if (input.isKeyDown('KeyA')) {
            this.yaw += this.config.turnSpeed * (isLanded ? 0.45 : 1) * dt;
            rollTarget += isLanded ? 0.04 : 0.15;
        } else if (input.isKeyDown('KeyD')) {
            this.yaw -= this.config.turnSpeed * (isLanded ? 0.45 : 1) * dt;
            rollTarget += isLanded ? -0.04 : -0.15;
        }
        this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, rollTarget, dt * 4);

        // 旋翼加速
        const rotorTarget = isLanded && !input.isKeyDown('Space') ? 14 : 30;
        this.rotorSpeed = THREE.MathUtils.lerp(this.rotorSpeed, rotorTarget, dt * 2);

        // 引擎负载
        this._engineLoad = THREE.MathUtils.lerp(this._engineLoad, targetLoad, dt * 3);

        // 武器
        if (this.config.hasWeapon && this.turret) {
            if (input.isMouseDown(0) && this.cannonCooldown <= 0) {
                this._fireCannon();
            }
            if (input.isMouseDown(2) && this.config.secondaryDamage && this.secondaryCooldown <= 0) {
                this._fireSecondaryWeapon();
            }
        }
    }

    // 设置炮塔跟随玩家视角（第一人称直接设置模式，保留兼容）
    setTurretYaw(yaw, pitch = 0) {
        if (this.config.hasWeapon && this.turret) {
            this._targetTurretYaw = yaw - this.yaw;
            this._targetTurretPitch = pitch;
        }
    }

    // 瞄准世界坐标点（通过相机射线找到目标点，让炮塔对准该点）
    aimAtPoint(targetPoint) {
        if (!this.config.hasWeapon || !this.turret) return;

        const muzzle = this._getCannonMuzzle();
        const dx = targetPoint.x - muzzle.x;
        const dy = targetPoint.y - muzzle.y;
        const dz = targetPoint.z - muzzle.z;
        const horizDist = Math.sqrt(dx * dx + dz * dz);

        // 世界空间的偏航角
        const totalYaw = Math.atan2(-dx, -dz);
        // 俯仰角（正值=向上）
        const pitch = Math.atan2(dy, horizDist);

        // 设置目标角度（不直接赋值，在update中平滑过渡）
        this._targetTurretYaw = totalYaw - this.yaw - (this._modelFlipped ? Math.PI : 0);
        this._targetTurretPitch = pitch;
    }

    setLocalAimRay(origin, direction, hitPoint = null) {
        if (!this._localAimOrigin) {
            this._localAimOrigin = new THREE.Vector3();
            this._localAimDirection = new THREE.Vector3();
            this._localAimHitPoint = new THREE.Vector3();
        }
        this._localAimOrigin.copy(origin);
        this._localAimDirection.copy(direction).normalize();
        if (hitPoint) {
            this._localAimHitPoint.copy(hitPoint);
            this._hasLocalAimHitPoint = true;
        } else {
            this._hasLocalAimHitPoint = false;
        }
        this._localAimActive = true;
    }

    clearLocalAimRay() {
        this._localAimActive = false;
        this._hasLocalAimHitPoint = false;
    }

    // 获取炮口射线（用于第三人称相机瞄准检测）
    getAimRay() {
        return {
            origin: this._getCannonMuzzle(),
            direction: this._getCannonDirection(),
        };
    }

    // 计算两个角度之间的最短差值（处理 -PI/PI 回绕）
    _shortestAngleDiff(target, current) {
        let diff = target - current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return diff;
    }

    _updatePhysics(dt) {
        if (this.config.isAircraft) {
            this._updateHeliPhysics(dt);
            return;
        }

        if (Math.abs(this.velocity) < 0.01 && Math.abs(this.lateralVelocity) < 0.01) {
            this.velocity = 0;
            this.lateralVelocity = 0;
            return;
        }

        const newPos = this.position.clone();
        const forward = new THREE.Vector3(
            -Math.sin(this.yaw),
            0,
            -Math.cos(this.yaw)
        );
        const right = new THREE.Vector3(
            Math.cos(this.yaw),
            0,
            -Math.sin(this.yaw)
        );

        // 前向 + 侧向移动
        newPos.add(forward.multiplyScalar(this.velocity * dt));
        newPos.add(right.multiplyScalar(this.lateralVelocity * dt));

        // 碰撞检测：不同载具有不同占地，避免坦克/APC 用过小碰撞体挤进建筑
        const radius = this.type === 'tank' ? 2.8 : (this.type === 'apc' ? 2.4 : 1.7);
        const height = this.type === 'tank' ? 2.8 : (this.type === 'apc' ? 2.4 : 2.0);
        if (!this.world.checkCollision(newPos, radius, height)) {
            this.position.copy(newPos);
        } else {
            // 尝试只移动一个轴
            const testX = this.position.clone();
            testX.x = newPos.x;
            if (!this.world.checkCollision(testX, radius, height)) {
                this.position.x = newPos.x;
            } else {
                const testZ = this.position.clone();
                testZ.z = newPos.z;
                if (!this.world.checkCollision(testZ, radius, height)) {
                    this.position.z = newPos.z;
                } else {
                    // 撞墙 - 根据质量影响反弹
                    const massFactor = 1 / (this.config.mass || 1);
                    this.velocity *= -0.3 * massFactor;
                    this.lateralVelocity *= -0.1;
                    // 碰撞音效和火花
                    this._onCollision();
                }
            }
        }

        // 边界
        const halfSize = CONFIG.WORLD.size / 2 - 3;
        const oldX = this.position.x;
        const oldZ = this.position.z;
        this.position.x = THREE.MathUtils.clamp(this.position.x, -halfSize, halfSize);
        this.position.z = THREE.MathUtils.clamp(this.position.z, -halfSize, halfSize);
        if (this.position.x !== oldX || this.position.z !== oldZ) {
            this._onCollision();
            this.velocity *= 0.3;
        }

        // 地形高度
        this.position.y = this.world.getHeight(this.position.x, this.position.z);

        // 深水阻尼：地面载具在水里动力骤降
        if (this.world.isUnderwater?.(this.position.x, this.position.z)) {
            this.velocity *= Math.pow(0.55, dt * 4);
            this.lateralVelocity *= Math.pow(0.4, dt * 4);
            // 车体略上浮到接近水面，避免完全沉底观感
            if (this.world.waterLevel != null) {
                this.position.y = Math.max(this.position.y, this.world.waterLevel - 0.35);
            }
        }

        // 悬挂弹跳 - 速度越快颠簸越明显
        const speedAbs = Math.abs(this.velocity);
        if (speedAbs > 2) {
            this._suspensionBounce = Math.sin(performance.now() * 0.02 * speedAbs) * 0.015 * speedAbs / this.config.maxSpeed;
        } else {
            this._suspensionBounce = THREE.MathUtils.lerp(this._suspensionBounce, 0, dt * 5);
        }

        // 轮子动画（地面载具模型翻转，滚动方向取反）
        if (this.wheels) {
            const wheelDir = this._modelFlipped ? -1 : 1;
            this.wheelOffset += this.velocity * dt * 3;
            for (const wheel of this.wheels) {
                wheel.rotation.x = this.wheelOffset * wheelDir;
            }
        }

        // 坦克履带纹路滚动动画
        if (this._tankTreads && this._tankTreads.length > 0) {
            const treadSpeed = this.velocity * dt * 0.5 * (this._modelFlipped ? -1 : 1);
            const trackLen = 4.5; // 履带长度
            const treadSpacing = 0.5; // 纹路间距
            for (const tread of this._tankTreads) {
                tread.userData.baseZ += treadSpeed;
                // 循环包裹：超出范围则从另一端回来
                while (tread.userData.baseZ > trackLen / 2) tread.userData.baseZ -= trackLen;
                while (tread.userData.baseZ < -trackLen / 2) tread.userData.baseZ += trackLen;
                tread.position.z = tread.userData.baseZ;
                // 纹路在底部时贴地，在顶部时贴回程段
                if (tread.userData.baseZ > -trackLen / 2 + 0.3 && tread.userData.baseZ < trackLen / 2 - 0.3) {
                    tread.position.y = 0.95;
                }
            }
        }

        // 坦克履带轮旋转动画
        if (this._tankRoadWheels && this._tankRoadWheels.length > 0) {
            const wheelSpin = this.velocity * dt * 3 * (this._modelFlipped ? -1 : 1);
            for (const wheel of this._tankRoadWheels) {
                // 履带轮旋转轴是X（因为rotation.z=PI/2后圆柱躺下），用rotation.x旋转
                wheel.rotation.x += wheelSpin;
            }
        }

        // 轮胎打滑痕迹
        if (this._isSkidding || this._isDrifting) {
            this._skidTimer += dt;
            if (this._skidTimer > 0.04) {
                this._skidTimer = 0;
                this._spawnSkidMarks();
            }
        }
    }

    _updateHeliPhysics(dt) {
        const newPos = this.position.clone();

        // 水平移动
        const dir = new THREE.Vector3(
            -Math.sin(this.yaw),
            0,
            -Math.cos(this.yaw)
        );
        const right = new THREE.Vector3(
            Math.cos(this.yaw),
            0,
            -Math.sin(this.yaw)
        );
        newPos.x += dir.x * this.velocity * dt;
        newPos.z += dir.z * this.velocity * dt;
        newPos.x += right.x * (this.lateralVelocity || 0) * dt;
        newPos.z += right.z * (this.lateralVelocity || 0) * dt;

        // 垂直移动
        newPos.y += this.verticalVelocity * dt;

        // 触水：高速擦海/入水直接坠毁（战地飞机砸海）
        if (this.world.waterLevel != null && newPos.y <= this.world.waterLevel + 0.4) {
            const impactSpeed = Math.sqrt(
                this.velocity * this.velocity +
                (this.verticalVelocity || 0) * (this.verticalVelocity || 0)
            );
            const inAir = !this._isLanded && (newPos.y - this.world.getHeight(newPos.x, newPos.z) > 1.0);
            if (inAir && impactSpeed > 8) {
                newPos.y = this.world.waterLevel;
                this.position.copy(newPos);
                this._crashIntoObstacle(impactSpeed, true);
                return;
            }
            // 低速迫降水面：也判定坠毁（固定翼不能水面滑行）
            if (this.config.isPlane && inAir) {
                newPos.y = this.world.waterLevel;
                this.position.copy(newPos);
                this._crashIntoObstacle(Math.max(impactSpeed, 10), true);
                return;
            }
        }

        // 地面检测
        const groundY = this.world.getHeight(newPos.x, newPos.z);
        const minY = groundY + 0.5; // 起落架高度
        const impactSpeed = Math.sqrt(
            this.velocity * this.velocity +
            (this.verticalVelocity || 0) * (this.verticalVelocity || 0) +
            (this.lateralVelocity || 0) * (this.lateralVelocity || 0)
        );
        if (newPos.y < minY) {
            // 固定翼坠地爆炸：俯冲/大下沉/大滚转才炸；平缓滑跑降落不炸
            if (this.config.isPlane && !this._isLanded) {
                const pitch = this.pitchAngle || 0;
                const roll = Math.abs(this.rollAngle || 0);
                const diveCrash = pitch < -0.32;                 // 机头明显朝下
                const hardSink = this.verticalVelocity < -6;     // 下沉过猛
                const badAttitude = roll > 0.7 || pitch < -0.18; // 姿态不正
                const bellySlam = impactSpeed > (this.config.maxSpeed || 40) * 0.55 && badAttitude;
                if (diveCrash || hardSink || bellySlam) {
                    newPos.y = minY;
                    this.position.copy(newPos);
                    this._crashIntoObstacle(impactSpeed, true);
                    return;
                }
            }
            // 直升机高速砸地也炸
            if (!this.config.isPlane && this.config.isAircraft && !this._isLanded &&
                (this.verticalVelocity < -12 || impactSpeed > (this.config.maxSpeed || 30) * 0.7)) {
                newPos.y = minY;
                this.position.copy(newPos);
                this._crashIntoObstacle(impactSpeed, true);
                return;
            }
            newPos.y = minY;
            if (this.verticalVelocity < 0) this.verticalVelocity = 0;
            this.velocity *= Math.pow(0.7, dt * 8);
            this.lateralVelocity *= Math.pow(0.6, dt * 8);
            // 固定翼触地拉平机头
            if (this.config.isPlane && this.pitchAngle < 0) this.pitchAngle = 0;
        }
        this._isLanded = newPos.y <= minY + 0.05;

        // 最大高度限制
        if (newPos.y > groundY + this.config.maxAltitude) {
            newPos.y = groundY + this.config.maxAltitude;
            if (this.verticalVelocity > 0) this.verticalVelocity = 0;
        }

        // 建筑/树木/墙体碰撞：固定翼任意高度都检测；直升机低空检测
        const altitude = newPos.y - groundY;
        const planeHitBox = this.config.isPlane ? 2.2 : 3.0;
        const shouldCheckWorldCol = this.config.isPlane
            ? true
            : (altitude < 8);
        if (shouldCheckWorldCol && this.world.checkCollision(newPos, planeHitBox, this.config.isPlane ? 1.6 : 2.5)) {
            // 固定翼高速撞墙/撞建筑 → 直接爆炸
            if (this.config.isPlane && impactSpeed > 8) {
                this.position.copy(newPos);
                this._crashIntoObstacle(impactSpeed, false);
                return;
            }
            const testX = this.position.clone();
            testX.x = newPos.x;
            testX.y = newPos.y;
            const testZ = this.position.clone();
            testZ.z = newPos.z;
            testZ.y = newPos.y;
            if (!this.world.checkCollision(testX, planeHitBox, 2.5)) {
                newPos.z = this.position.z;
            } else if (!this.world.checkCollision(testZ, planeHitBox, 2.5)) {
                newPos.x = this.position.x;
            } else {
                // 低速轻碰：反弹；中高速直升机撞建筑也炸
                if (this.config.isAircraft && impactSpeed > 12) {
                    this.position.copy(newPos);
                    this._crashIntoObstacle(impactSpeed, false);
                    return;
                }
                this.velocity *= -0.25;
                this.lateralVelocity *= -0.2;
                this._onCollision();
                newPos.copy(this.position);
            }
        }

        // 边界
        const halfSize = CONFIG.WORLD.size / 2 - 3;
        // 飞出地图边界高速撞击也炸
        if (this.config.isAircraft && (
            Math.abs(newPos.x) > halfSize || Math.abs(newPos.z) > halfSize
        ) && impactSpeed > 10) {
            newPos.x = THREE.MathUtils.clamp(newPos.x, -halfSize, halfSize);
            newPos.z = THREE.MathUtils.clamp(newPos.z, -halfSize, halfSize);
            this.position.copy(newPos);
            this._crashIntoObstacle(impactSpeed, false);
            return;
        }
        newPos.x = THREE.MathUtils.clamp(newPos.x, -halfSize, halfSize);
        newPos.z = THREE.MathUtils.clamp(newPos.z, -halfSize, halfSize);

        this.position.copy(newPos);
    }

    // 飞机/直升机撞击爆炸入口（撞墙 / 坠地）
    _crashIntoObstacle(impactSpeed = 20, fromGround = false) {
        if (!this.alive || this._crashing) return;
        // 记录撞击强度，供坠毁动画/爆炸用
        this._lastCrashSpeed = impactSpeed;
        this._crashFromGround = !!fromGround;
        // 直接打满伤害 → 航空器走 _beginCrash 坠落爆炸流程
        this.takeDamage(this.config.maxHealth);
    }

    _updateModel() {
        this.model.position.copy(this.position);
        this.model.rotation.y = this.yaw + (this._modelFlipped ? Math.PI : 0);

        // 受击震颤衰减
        if (this._hitShake && this._hitShake > 0.01) {
            const s = this._hitShake;
            this.model.position.x += (Math.random() - 0.5) * s * 0.12;
            this.model.position.z += (Math.random() - 0.5) * s * 0.12;
            this.model.rotation.z += (Math.random() - 0.5) * s * 0.04;
            this._hitShake *= 0.88;
        } else {
            this._hitShake = 0;
        }

        if (this.config.isAircraft) {
            // 直升机俯仰和横滚
            this.model.rotation.x = this.pitchAngle || 0;
            this.model.rotation.z = (this.rollAngle || 0) + (this._hitShake || 0) * (Math.random() - 0.5) * 0.05;

            // 旋翼旋转（固定翼螺旋桨绕 Z 轴，直升机主旋翼绕 Y 轴）
            if (this.mainRotor) {
                if (this._propIsPlane) {
                    this.mainRotor.rotation.z += this.rotorSpeed * 0.9;
                } else {
                    this.mainRotor.rotation.y += this.rotorSpeed * 0.5;
                }
            }
            if (this.tailRotor) {
                this.tailRotor.rotation.x += this.rotorSpeed;
            }
            if (this.rotorBlur) {
                const blurStrength = THREE.MathUtils.clamp(this.rotorSpeed / 18, 0, 1);
                this.rotorBlur.visible = blurStrength > 0.12;
                this.rotorBlur.material.opacity = blurStrength * 0.18;
            }
        } else {
            // 地面载具：车身侧倾和悬挂弹跳
            // 漂移时增加横滚
            const driftRoll = this._isSkidding ? Math.sin(performance.now() * 0.01) * 0.02 : 0;
            this.model.rotation.z = (this._bodyRoll || 0) + driftRoll;
            this.model.position.y += this._suspensionBounce || 0;
            // 漂移时车身轻微偏航抖动
            if (this._isSkidding) {
                this.model.rotation.y = this.yaw + (this._modelFlipped ? Math.PI : 0) + Math.sin(performance.now() * 0.015) * 0.005;
            }
            if (this.rotorBlur) {
                this.rotorBlur.visible = false;
            }
        }

        if (this.turret && !this.config?.isPlane) {
            // 使用YXZ旋转顺序：先偏航(Y)再俯仰(X)，与摄像机一致
            this.turret.rotation.order = 'YXZ';
            this.turret.rotation.y = this.turretYaw;
            if (this.turretPitch !== undefined) {
                this.turret.rotation.x = this.turretPitch;
            }
        }
    }

    // 碰撞处理
    _onCollision() {
        if (this._collisionCooldown > 0) return;
        this._collisionCooldown = 0.3;
        const impactSpeed = Math.abs(this.velocity);
        if (impactSpeed > 2) {
            // 碰撞音效
            if (this.audio && this.audio.playCollision) {
                this.audio.playCollision(this.position, impactSpeed / this.config.maxSpeed);
            }
            // 碰撞火花
            this._spawnCollisionSparks();
            // 高速碰撞造成伤害
            if (impactSpeed > 10) {
                this.takeDamage(impactSpeed * 0.5);
            }
        }
    }

    // 碰撞火花（粒子池复用，避免每次碰撞新建几何体/材质）
    _spawnCollisionSparks() {
        // 找一个空闲火花，没有且池未满则新建；池满直接跳过本次
        let spark = this._sparkPool.find(s => !s.active);
        if (!spark) {
            if (this._sparkPool.length >= 4) return;
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 3), 3));
            spark = { geo, active: false, velX: new Float32Array(8), velY: new Float32Array(8), velZ: new Float32Array(8), points: null, mat: null };
            this._sparkPool.push(spark);
        }
        spark.active = true;

        const pos = this.position;
        const positions = spark.geo.attributes.position.array;
        for (let i = 0; i < 8; i++) {
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y + 1;
            positions[i * 3 + 2] = pos.z;
            spark.velX[i] = (Math.random() - 0.5) * 6;
            spark.velY[i] = Math.random() * 4 + 1;
            spark.velZ[i] = (Math.random() - 0.5) * 6;
        }
        spark.geo.attributes.position.needsUpdate = true;

        if (!spark.points) {
            spark.mat = new THREE.PointsMaterial({ color: 0xffaa00, size: 0.15, transparent: true });
            spark.points = new THREE.Points(spark.geo, spark.mat);
        }
        this.scene.add(spark.points);

        let life = 0.4;
        const prev = performance.now();
        const animate = () => {
            const now = performance.now();
            const dt = Math.min((now - prev) / 1000, 0.05);
            if (now !== prev) life -= dt;
            if (life <= 0) {
                this.scene.remove(spark.points);
                spark.active = false;
                return;
            }
            for (let i = 0; i < 8; i++) {
                spark.velY[i] -= 15 * dt;
                positions[i * 3] += spark.velX[i] * dt;
                positions[i * 3 + 1] += spark.velY[i] * dt;
                positions[i * 3 + 2] += spark.velZ[i] * dt;
            }
            spark.geo.attributes.position.needsUpdate = true;
            spark.mat.opacity = life / 0.4;
            requestAnimationFrame(animate);
        };
        animate();
    }

    // 轮胎打滑痕迹
    _spawnSkidMarks() {
        if (!this.wheels || this.wheels.length === 0) return;
        // 后轮位置（APC 按 side 外层、i 内层排列：0/5 = 左/右最尾端轮）
        const rearWheels = this.type === 'jeep'
            ? [this.wheels[2], this.wheels[3]]
            : this.type === 'apc'
            ? [this.wheels[0], this.wheels[5]]
            : [this.wheels[2], this.wheels[3]];

        for (const wheel of rearWheels) {
            const worldPos = new THREE.Vector3();
            wheel.getWorldPosition(worldPos);
            worldPos.y = this.world.getHeight(worldPos.x, worldPos.z) + 0.02;

            const mark = new THREE.Mesh(
                new THREE.PlaneGeometry(0.25, 0.5),
                new THREE.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.5 })
            );
            mark.rotation.x = -Math.PI / 2;
            mark.rotation.z = -this.yaw;
            mark.position.copy(worldPos);
            this.scene.add(mark);
            this._skidMarks.push(mark);

            // 限制数量
            if (this._skidMarks.length > this._maxSkidMarks) {
                const old = this._skidMarks.shift();
                this.scene.remove(old);
                old.geometry.dispose();
                old.material.dispose();
            }

            // 5秒后淡出
            setTimeout(() => {
                let opacity = 0.5;
                const fade = () => {
                    opacity -= 0.01;
                    if (opacity <= 0) {
                        this.scene.remove(mark);
                        mark.geometry.dispose();
                        mark.material.dispose();
                        const idx = this._skidMarks.indexOf(mark);
                        if (idx >= 0) this._skidMarks.splice(idx, 1);
                        return;
                    }
                    mark.material.opacity = opacity;
                    requestAnimationFrame(fade);
                };
                fade();
            }, 5000);
        }
    }

    // 载具视觉特效更新
    _updateVehicleEffects(dt, isPlayerDriver = false) {
        const healthPct = this.health / this.config.maxHealth;
        const speedAbs = Math.abs(this.velocity);

        // === 损伤冒烟/着火（阈值提前：70% 冒烟、40% 着火，战地损伤反馈更早）===
        if (healthPct < 0.7 && !this._damageSmoke) {
            this._damageSmoke = this._createDamageSmoke();
            this.model.add(this._damageSmoke);
        }
        if (healthPct < 0.4 && !this._damageFire) {
            this._damageFire = this._createDamageFire();
            this.model.add(this._damageFire);
        }
        // 修复后移除
        if (healthPct >= 0.7 && this._damageSmoke) {
            this.model.remove(this._damageSmoke);
            this._damageSmoke = null;
        }
        if (healthPct >= 0.4 && this._damageFire) {
            this.model.remove(this._damageFire);
            if (this._damageLight) {
                this.model.remove(this._damageLight);
                this._damageLight = null;
            }
            this._damageFire = null;
        }

        // 损伤变形 - 严重受损时部件脱落
        if (healthPct < 0.2 && this._detachableParts && this._detachedParts.length === 0) {
            this._detachRandomPart();
        }

        // 损伤降速：血量越低引擎出力越差（玩家能感觉到"车坏了"）
        this._damageSpeedMult = healthPct > 0.6 ? 1
            : healthPct > 0.3 ? 0.75 + healthPct * 0.25
            : 0.45 + healthPct * 0.5;

        // 更新冒烟/着火动画
        if (this._damageSmoke) {
            const smokeIntensity = healthPct < 0.4 ? 2.4 : healthPct < 0.55 ? 1.6 : 1;
            this._damageSmoke.children.forEach((p, i) => {
                p.position.y += dt * (1 + i * 0.3) * smokeIntensity;
                p.scale.multiplyScalar(1 + dt * 0.5 * smokeIntensity);
                p.material.opacity *= 0.99;
                if (p.material.opacity < 0.05) {
                    p.position.y = 0;
                    p.scale.setScalar(0.3 + (1 - healthPct) * 0.2);
                    p.material.opacity = 0.35 + (1 - healthPct) * 0.25;
                }
            });
        }
        if (this._damageFire) {
            const flicker = 0.8 + Math.sin(performance.now() * 0.02) * 0.2;
            this._damageFire.scale.setScalar(flicker);
            if (this._damageLight) {
                this._damageLight.intensity = 2 + Math.random() * 2;
            }
        }

        // === 地面载具特效 ===
        // AI 载具只保留损伤烟火，跳过尾气/尘土/漂移粒子
        if (!this.config.isAircraft && isPlayerDriver) {
            // 尾气烟雾
            this._exhaustTimer += dt;
            if (this._exhaustTimer > 0.15 && this.occupants[0]) {
                this._exhaustTimer = 0;
                this._spawnExhaust();
            }

            // 尘土轨迹
            if (speedAbs > 5 && this.occupants[0]) {
                this._dustTimer += dt;
                if (this._dustTimer > 0.08) {
                    this._dustTimer = 0;
                    this._spawnDustTrail();
                }
            }

            // 漂移烟雾
            if (this._isSkidding && this.occupants[0]) {
                this._dustTimer += dt;
                if (this._dustTimer > 0.05) {
                    this._dustTimer = 0;
                    this._spawnDriftSmoke();
                }
            }

            // 轮胎摩擦声
            if (this._isSkidding && this.audio && this.audio.playTireSkid) {
                this.audio.playTireSkid(this.position, Math.abs(this.lateralVelocity));
            }
        }

        // === 直升机旋翼气流 ===
        if (this.config.isAircraft && this.rotorSpeed > 5 && isPlayerDriver) {
            const groundY = this.world.getHeight(this.position.x, this.position.z);
            const altAboveGround = this.position.y - groundY;
            if (altAboveGround < 15) {
                this._rotorWashTimer += dt;
                if (this._rotorWashTimer > 0.06) {
                    this._rotorWashTimer = 0;
                    this._spawnRotorWash(altAboveGround);
                }
            }
        }
    }

    // 部件脱落
    _detachRandomPart() {
        if (!this._detachableParts || this._detachableParts.length === 0) return;
        const partName = this._detachableParts[Math.floor(Math.random() * this._detachableParts.length)];
        // 找到对应部件
        let partMesh = null;
        this.model.traverse(child => {
            if (child.isMesh && child.userData.partName === partName && !partMesh) {
                partMesh = child;
            }
        });
        if (!partMesh) return;

        // 获取世界位置
        const worldPos = new THREE.Vector3();
        partMesh.getWorldPosition(worldPos);
        const worldQuat = new THREE.Quaternion();
        partMesh.getWorldQuaternion(worldQuat);

        // 从模型中移除
        if (partMesh.parent) {
            partMesh.parent.remove(partMesh);
        }

        // 添加到场景作为独立物体
        partMesh.position.copy(worldPos);
        partMesh.quaternion.copy(worldQuat);
        this.scene.add(partMesh);
        this._detachedParts.push(partMesh);

        // 物理掉落动画
        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            Math.random() * 3 + 2,
            (Math.random() - 0.5) * 5
        );
        const angVel = new THREE.Vector3(
            Math.random() * 3,
            Math.random() * 3,
            Math.random() * 3
        );
        let life = 4;
        const animate = (prev) => {
            const now = performance.now();
            const dt = Math.min((now - (prev || now)) / 1000, 0.05);
            life -= dt;
            if (life <= 0) {
                this.scene.remove(partMesh);
                if (partMesh.geometry) partMesh.geometry.dispose();
                if (partMesh.material) partMesh.material.dispose();
                return;
            }
            vel.y -= 20 * dt;
            partMesh.position.add(vel.clone().multiplyScalar(dt));
            partMesh.rotation.x += angVel.x * dt;
            partMesh.rotation.y += angVel.y * dt;
            partMesh.rotation.z += angVel.z * dt;

            // 地面检测
            const groundY = this.world.getHeight(partMesh.position.x, partMesh.position.z);
            if (partMesh.position.y < groundY + 0.2) {
                partMesh.position.y = groundY + 0.2;
                vel.y = -vel.y * 0.3;
                vel.x *= 0.5;
                vel.z *= 0.5;
            }
            requestAnimationFrame(() => animate(now));
        };
        animate();

        // 火花特效
        this._spawnCollisionSparks();
    }

    // 漂移烟雾
    _spawnDriftSmoke() {
        const rearOffset = this.type === 'jeep' ? -1.3 : this.type === 'apc' ? -2.0 : -2.0;
        for (let side = -1; side <= 1; side += 2) {
            const offset = new THREE.Vector3(side * 0.9, 0, rearOffset);
            offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
            const pos = this.position.clone().add(offset);
            pos.y = this.world.getHeight(pos.x, pos.z) + 0.1;

            const smoke = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 6, 4),
                new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.35 })
            );
            smoke.position.copy(pos);
            this.scene.add(smoke);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                0.5 + Math.random() * 0.5,
                (Math.random() - 0.5) * 1.5
            );
            let life = 1.0;
            const animate = (prev) => {
                const now = performance.now();
                const dt = Math.min((now - (prev || now)) / 1000, 0.05);
                life -= dt;
                if (life <= 0) {
                    this.scene.remove(smoke);
                    smoke.geometry.dispose();
                    smoke.material.dispose();
                    return;
                }
                smoke.position.add(vel.clone().multiplyScalar(dt));
                smoke.scale.setScalar(1 + (1.0 - life) * 2);
                smoke.material.opacity = (life / 1.0) * 0.35;
                requestAnimationFrame(() => animate(now));
            };
            animate();
        }
    }

    // 创建损伤冒烟
    _createDamageSmoke() {
        const group = new THREE.Group();
        const positions = [
            [0, 1.5, 0], [0.5, 1.2, 0.3], [-0.5, 1.2, -0.3]
        ];
        for (const [x, y, z] of positions) {
            const p = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 6, 4),
                new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.4 })
            );
            p.position.set(x, y, z);
            p.scale.setScalar(0.3 + Math.random() * 0.3);
            group.add(p);
        }
        return group;
    }

    // 创建损伤着火
    _createDamageFire() {
        const group = new THREE.Group();
        const fire = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.8 })
        );
        fire.position.set(0, 1.5, 0);
        group.add(fire);

        // 不再挂点光源：着火光效由灯光池的周期闪烁提供，避免灯光增删触发着色器重编译
        this._damageLight = null;

        return group;
    }

    // 尾气烟雾
    _spawnExhaust() {
        const offset = new THREE.Vector3(0, 0.8, 2.5);
        if (this.type === 'tank') offset.set(0.8, 0.5, 2.5);
        if (this.type === 'apc') offset.set(0, 0.6, 3.0);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const pos = this.position.clone().add(offset);

        const smoke = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 4, 3),
            new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.3 })
        );
        smoke.position.copy(pos);
        this.scene.add(smoke);

        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            0.5 + Math.random() * 0.3,
            (Math.random() - 0.5) * 0.5
        );
        let life = 1.5;
        const animate = (prev) => {
            const now = performance.now();
            const dt = Math.min((now - (prev || now)) / 1000, 0.05);
            life -= dt;
            if (life <= 0) {
                this.scene.remove(smoke);
                smoke.geometry.dispose();
                smoke.material.dispose();
                return;
            }
            smoke.position.add(vel.clone().multiplyScalar(dt));
            smoke.scale.setScalar(1 + (1.5 - life) * 0.5);
            smoke.material.opacity = (life / 1.5) * 0.3;
            requestAnimationFrame(() => animate(now));
        };
        animate();
    }

    // 尘土轨迹
    _spawnDustTrail() {
        const wheelOffsets = this.type === 'jeep'
            ? [[-0.9, -1.3], [0.9, -1.3]]
            : this.type === 'apc'
            ? [[-1.2, -2.0], [1.2, -2.0]]
            : [[-1.3, -2.0], [1.3, -2.0]];

        for (const [lx, lz] of wheelOffsets) {
            const offset = new THREE.Vector3(lx, 0, lz);
            offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
            const pos = this.position.clone().add(offset);
            pos.y = this.world.getHeight(pos.x, pos.z) + 0.1;

            const dust = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 5, 4),
                new THREE.MeshBasicMaterial({ color: 0x8a7a5a, transparent: true, opacity: 0.4 })
            );
            dust.position.copy(pos);
            this.scene.add(dust);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 1,
                0.3 + Math.random() * 0.5,
                (Math.random() - 0.5) * 1
            );
            let life = 0.8;
            const animate = (prev) => {
                const now = performance.now();
                const dt = Math.min((now - (prev || now)) / 1000, 0.05);
                life -= dt;
                if (life <= 0) {
                    this.scene.remove(dust);
                    dust.geometry.dispose();
                    dust.material.dispose();
                    return;
                }
                dust.position.add(vel.clone().multiplyScalar(dt));
                dust.scale.setScalar(1 + (0.8 - life) * 1.5);
                dust.material.opacity = (life / 0.8) * 0.4;
                requestAnimationFrame(() => animate(now));
            };
            animate();
        }
    }

    // 直升机旋翼气流
    _spawnRotorWash(altitude) {
        const spread = 2 + altitude * 0.2;
        const pos = this.position.clone();
        pos.x += (Math.random() - 0.5) * spread * 2;
        pos.z += (Math.random() - 0.5) * spread * 2;
        pos.y = this.world.getHeight(pos.x, pos.z) + 0.1;

        const dust = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 5, 4),
            new THREE.MeshBasicMaterial({ color: 0x9a8a6a, transparent: true, opacity: 0.3 })
        );
        dust.position.copy(pos);
        this.scene.add(dust);

        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            -0.5,
            (Math.random() - 0.5) * 3
        );
        // 修复：lifetime 未定义导致 ReferenceError 和尘埃粒子永不清理（内存泄漏+性能下降）
        const lifetime = 0.6;
        let life = lifetime;
        const animate = (prev) => {
            const now = performance.now();
            const dt = Math.min((now - (prev || now)) / 1000, 0.05);
            life -= dt;
            if (life <= 0) {
                this.scene.remove(dust);
                dust.geometry.dispose();
                dust.material.dispose();
                return;
            }
            dust.position.add(vel.clone().multiplyScalar(dt));
            dust.scale.setScalar(1 + (0.6 - life) * 2);
            dust.material.opacity = (life / 0.6) * 0.3;
            requestAnimationFrame(() => animate(now));
        };
        animate();
    }

    _fireCannon() {
        // 弹药检查（无弹药时不能开火）
        if (this.cannonAmmo <= 0) return;
        this.cannonAmmo--;
        this.cannonCooldown = this.config.cannonCooldown;
        this._ammoRegenTimer = 0;  // 重置弹药恢复计时

        // 获取炮口位置和方向
        const muzzlePos = this._getCannonMuzzle();
        const useLocalAim = this._localAimActive && this._localAimOrigin && this._localAimDirection;
        const rayOrigin = muzzlePos.clone();
        const direction = useLocalAim && this._hasLocalAimHitPoint
            ? this._localAimHitPoint.clone().sub(rayOrigin).normalize()
            : (useLocalAim ? this._localAimDirection.clone() : this._getCannonDirection());

        // 音效
        if (this.audio) {
            if (this.type === 'tank') {
                this.audio.playExplosion(muzzlePos);
            } else {
                this.audio.playGunshot('rifle', muzzlePos, false);
            }
        }

        // 射线检测命中点（near=3 + 过滤<5的命中点，确保不会命中自身载具）
        const raycaster = new THREE.Raycaster(rayOrigin, direction, useLocalAim ? 0.2 : 3, this.config.cannonRange);
        const meshes = this.world.getShootableMeshes();
        let hitPoint = null;

        if (useLocalAim && this._hasLocalAimHitPoint) {
            hitPoint = this._localAimHitPoint.clone();
        } else {
            const intersects = raycaster.intersectObjects(meshes, true);
            // 过滤掉距离过近的命中点（防止打中自身载具）
            const validHit = intersects.find(h => h.distance > (useLocalAim ? 0.5 : 5));
            if (validHit) {
                hitPoint = validHit.point.clone();
            } else {
                // 地面交汇计算（direction.y为0时水平射击，不会命中地面）
                if (Math.abs(direction.y) > 0.001) {
                    const groundY = this.world.getHeight(rayOrigin.x + direction.x * 100, rayOrigin.z + direction.z * 100);
                    const distToGround = (groundY - rayOrigin.y) / direction.y;
                    if (distToGround > 0 && distToGround < this.config.cannonRange) {
                        hitPoint = rayOrigin.clone().add(direction.clone().multiplyScalar(distToGround));
                    }
                }
            }
        }
        if (!hitPoint) {
            hitPoint = rayOrigin.clone().add(direction.clone().multiplyScalar(this.config.cannonRange));
        }
        if (hitPoint.distanceTo(rayOrigin) > this.config.cannonRange) {
            hitPoint.copy(rayOrigin).add(direction.clone().multiplyScalar(this.config.cannonRange));
        }

        // 发射回调
        if (this.onFireCannon) {
            this.onFireCannon(rayOrigin, direction, this.config.cannonDamage, this.config.cannonRange, {
                explosive: true,  // 所有载具炮击都有爆炸范围伤害
                weapon: 'main',
            }, hitPoint);
        }

        // 弹道效果 - 坦克用抛物线弹道
        if (this.type === 'tank') {
            this._createTankShell(muzzlePos, hitPoint);
        } else {
            // 其他载具用直线弹道
            this._createVehicleTracer(muzzlePos, hitPoint, 0xffdd44, 0.72, 60, 45);
        }

        // 命中爆炸特效
        this._createImpactExplosion(hitPoint, this.type === 'tank' ? 6 : 2.6);

        // 弹坑痕迹
        if (this.type === 'tank') {
            this._createCrater(hitPoint);
        }

        // 炮口爆炸效果
        this._createMuzzleFlash(muzzlePos);

        // 炮塔后坐力
        if (this.turret) {
            this.turret.position.z += 0.1;
            setTimeout(() => {
                if (this.turret) this.turret.position.z -= 0.1;
            }, 80);
        }
    }

    _fireSecondaryWeapon() {
        // 弹药检查（无弹药时不能开火）
        if (this.secondaryAmmo <= 0) return;
        this.secondaryAmmo--;
        this.secondaryCooldown = this.config.secondaryCooldown || 0.1;
        this._ammoRegenTimer = 0;  // 重置弹药恢复计时

        const muzzlePos = this._getCannonMuzzle();
        const useLocalAim = this._localAimActive && this._localAimOrigin && this._localAimDirection;
        const rayOrigin = muzzlePos.clone();
        const direction = useLocalAim && this._hasLocalAimHitPoint
            ? this._localAimHitPoint.clone().sub(rayOrigin).normalize()
            : (useLocalAim ? this._localAimDirection.clone() : this._getCannonDirection());
        const range = this.config.secondaryRange || 160;

        if (this.audio) {
            this.audio.playGunshot('rifle', muzzlePos, false);
        }

        const raycaster = new THREE.Raycaster(rayOrigin, direction, useLocalAim ? 0.2 : 3, range);
        const intersects = raycaster.intersectObjects(this.world.getShootableMeshes(), true);
        const validHit = intersects.find(h => h.distance > (useLocalAim ? 0.5 : 5));
        const hitPoint = validHit
            ? validHit.point.clone()
            : rayOrigin.clone().add(direction.clone().multiplyScalar(range));

        if (this.onFireCannon) {
            this.onFireCannon(rayOrigin, direction, this.config.secondaryDamage, range, {
                explosive: false,
                weapon: 'secondary',
            }, hitPoint);
        }

        this._createVehicleTracer(muzzlePos, hitPoint, 0xfff2a0, 0.55, 42, 35);

        this._createMuzzleFlash(muzzlePos);
    }

    _canSpawnTransientFx(cost = 1, limit = 9) {
        if (this._activeTransientFx + cost > limit) return false;
        this._activeTransientFx += cost;
        return true;
    }

    _releaseTransientFx(cost = 1) {
        this._activeTransientFx = Math.max(0, this._activeTransientFx - cost);
    }

    _getVehicleTracerMaterial(color, opacity) {
        const key = `${color}_${opacity}`;
        if (!this._vehicleTracerMaterials[key]) {
            this._vehicleTracerMaterials[key] = new THREE.LineBasicMaterial({
                color,
                transparent: true,
                opacity,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
        }
        return this._vehicleTracerMaterials[key];
    }

    _createVehicleTracer(start, end, color, opacity = 0.65, duration = 50, minInterval = 0) {
        const now = performance.now();
        if (minInterval > 0 && now - this._lastTracerFxTime < minInterval) return;
        if (!this._canSpawnTransientFx(1, 10)) return;
        this._lastTracerFxTime = now;

        const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
        const line = new THREE.Line(geo, this._getVehicleTracerMaterial(color, opacity));
        this.scene.add(line);
        setTimeout(() => {
            this.scene.remove(line);
            geo.dispose();
            this._releaseTransientFx(1);
        }, duration);
    }

    // 坦克炮弹弹道：高速平直射击（真实坦克炮初速极高，视觉上几乎直线）
    // 仅超远距离(>150m)有轻微弹道下坠
    _createTankShell(start, end) {
        const distance = start.distanceTo(end);
        // 150m 内完全平直，之后每 100m 下坠约 1.2m（战地风格的微量下坠）
        const arcHeight = distance > 150 ? Math.min((distance - 150) * 0.012, 2.5) : 0;
        const mid = start.clone().lerp(end, 0.5);
        mid.y += arcHeight;

        // 炮弹可视化（拉长的曳光弹头）
        const shell = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 6, 4),
            new THREE.MeshBasicMaterial({ color: 0xffcc55 })
        );
        shell.scale.set(1, 1, 2.6);
        this.scene.add(shell);

        // 弹道线
        const trailGeo = new THREE.BufferGeometry();
        const trailPoints = [];
        const trailMat = new THREE.LineBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.6 });
        const trail = new THREE.Line(trailGeo, trailMat);
        this.scene.add(trail);

        // 炮弹速度约 300m/s：飞行时间 = 距离/300，t 增量随真实时间推进
        const flightTime = Math.max(0.08, distance / 300);
        const dir = end.clone().sub(start).normalize();
        let t = 0;
        const animate = (prev) => {
            const now = performance.now();
            t += Math.min((now - (prev || now)) / 1000, 0.05) / flightTime;
            if (t >= 1) {
                this.scene.remove(shell);
                this.scene.remove(trail);
                shell.geometry.dispose();
                shell.material.dispose();
                trailGeo.dispose();
                trailMat.dispose();
                return;
            }
            // 二次贝塞尔（arcHeight=0 时即纯直线）
            const p = new THREE.Vector3();
            p.x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * mid.x + t * t * end.x;
            p.y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * mid.y + t * t * end.y;
            p.z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * mid.z + t * t * end.z;
            shell.position.copy(p);
            shell.lookAt(p.clone().add(dir));

            trailPoints.push(p.clone());
            if (trailPoints.length > 10) trailPoints.shift();
            trailGeo.setFromPoints(trailPoints);
            requestAnimationFrame(() => animate(now));
        };
        animate();
    }

    // 创建命中爆炸特效
    _createImpactExplosion(position, scale = 4) {
        const now = performance.now();
        const isHeavyImpact = this.type === 'tank' || scale >= 3.5;
        const minInterval = isHeavyImpact ? 80 : 140;
        if (now - this._lastImpactFxTime < minInterval) return;
        const fxCost = isHeavyImpact ? 3 : 2;
        if (!this._canSpawnTransientFx(fxCost, isHeavyImpact ? 5 : 3)) return;
        this._lastImpactFxTime = now;

        const visualScale = Math.min(scale, scale >= 5 ? 3.4 : (isHeavyImpact ? 2.6 : 1.2));
        const lifetime = scale >= 5 ? 0.4 : (isHeavyImpact ? 0.3 : 0.18);
        // 火球（复用缓存几何体，通过scale缩放，避免每次创建SphereGeometry导致GC卡顿）
        const flash = new THREE.Mesh(
            this._fxGeo.flash,
            new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9, depthWrite: false })
        );
        flash.scale.setScalar(visualScale * 0.42);
        flash.position.copy(position);
        this.scene.add(flash);

        // 光源 - 从灯光池借用（不新建灯光，避免着色器重编译）
        if (isHeavyImpact) {
            const pool = this.scene.userData.lightPool;
            if (pool) pool.flash(position, 0xff6600, scale >= 5 ? 2.2 : 1.6, visualScale * 3.2, lifetime);
        }

        // 烟雾（复用缓存几何体）
        const smoke = new THREE.Mesh(
            this._fxGeo.smoke,
            new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: isHeavyImpact ? 0.4 : 0.22, depthWrite: false })
        );
        smoke.scale.setScalar(visualScale * 0.55);
        smoke.position.copy(position);
        smoke.position.y += visualScale * 0.25;
        this.scene.add(smoke);

        // 火花碎屑（减少到2-3个小球Mesh，共享几何体和材质，避免BufferGeometry动态更新开销）
        const sparkCount = isHeavyImpact ? 3 : 2;
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, depthWrite: false });
        const sparks = [];
        const sparkVelocities = [];
        for (let i = 0; i < sparkCount; i++) {
            const spark = new THREE.Mesh(this._fxGeo.flash, sparkMat);
            spark.scale.setScalar(0.1);
            spark.position.copy(position);
            this.scene.add(spark);
            sparks.push(spark);
            sparkVelocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * visualScale * 2.2,
                Math.random() * visualScale * 1.4,
                (Math.random() - 0.5) * visualScale * 2.2
            ));
        }

        const flashBase = visualScale * 0.42;
        const smokeBase = visualScale * 0.55;
        let life = lifetime;
        let lastTime = performance.now();
        const animate = () => {
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;
            life -= dt;
            if (life <= 0) {
                this.scene.remove(flash);
                this.scene.remove(smoke);
                for (const s of sparks) this.scene.remove(s);
                // 只dispose材质，不dispose共享几何体（_fxGeo 在载具销毁时统一释放）
                flash.material.dispose();
                smoke.material.dispose();
                sparkMat.dispose();
                this._releaseTransientFx(fxCost);
                return;
            }
            const t = 1 - life / lifetime;
            flash.scale.setScalar(flashBase * (1 + t * visualScale));
            flash.material.opacity = (1 - t) * 0.9;
            smoke.scale.setScalar(smokeBase * (1 + t * 1.45));
            smoke.position.y += dt * 1.4;
            smoke.material.opacity = (1 - t) * (isHeavyImpact ? 0.4 : 0.22);
            for (let i = 0; i < sparks.length; i++) {
                sparkVelocities[i].y -= 20 * dt;
                sparks[i].position.x += sparkVelocities[i].x * dt;
                sparks[i].position.y += sparkVelocities[i].y * dt;
                sparks[i].position.z += sparkVelocities[i].z * dt;
            }
            sparkMat.opacity = 1 - t;
            requestAnimationFrame(animate);
        };
        animate();
    }

    // 创建弹坑痕迹
    _createCrater(position) {
        const groundY = this.world.getHeight(position.x, position.z);
        const craterY = Math.max(position.y, groundY) + 0.02;

        const craterGeo = new THREE.CircleGeometry(2.5, 16);
        const craterMat = new THREE.MeshStandardMaterial({
            color: 0x1a1008,
            roughness: 1.0,
            transparent: true,
            opacity: 0.9,
        });
        const crater = new THREE.Mesh(craterGeo, craterMat);
        crater.rotation.x = -Math.PI / 2;
        crater.position.set(position.x, craterY, position.z);
        this.scene.add(crater);

        const ringGeo = new THREE.RingGeometry(2.5, 4, 16);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x331100,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(position.x, craterY + 0.01, position.z);
        this.scene.add(ring);

        setTimeout(() => {
            let opacity = 0.9;
            const fadeAnim = (prev) => {
                const now = performance.now();
                const dt = Math.min((now - (prev || now)) / 1000, 0.05);
                opacity -= dt * 1.6; // 约0.56秒淡出
                if (opacity <= 0) {
                    this.scene.remove(crater);
                    this.scene.remove(ring);
                    craterGeo.dispose();
                    craterMat.dispose();
                    ringGeo.dispose();
                    ringMat.dispose();
                    return;
                }
                craterMat.opacity = opacity;
                ringMat.opacity = opacity * 0.5;
                requestAnimationFrame(() => fadeAnim(now));
            };
            fadeAnim();
        }, 15000);
    }

    // 炮口闪光
    _createMuzzleFlash(position) {
        const now = performance.now();
        const isHeavyMuzzle = this.type === 'tank';
        const minInterval = isHeavyMuzzle ? 60 : 95;
        if (now - this._lastMuzzleFxTime < minInterval) return;
        if (!this._canSpawnTransientFx(1, 6)) return;
        this._lastMuzzleFxTime = now;

        const lifetime = isHeavyMuzzle ? 0.14 : 0.07;
        const flashRadius = isHeavyMuzzle ? 0.5 : 0.26;
        // 枪口闪光（复用缓存几何体，通过scale缩放）
        const flash = new THREE.Mesh(
            this._fxGeo.flash,
            new THREE.MeshBasicMaterial({ color: 0xffee00, transparent: true, opacity: 0.9, depthWrite: false })
        );
        flash.scale.setScalar(flashRadius);
        flash.position.copy(position);
        this.scene.add(flash);

        if (isHeavyMuzzle) {
            const pool = this.scene.userData.lightPool;
            if (pool) pool.flash(position, 0xffaa00, 1.6, 6, lifetime);
        }

        // 烟雾（仅坦克，复用缓存几何体）
        const smoke = isHeavyMuzzle ? new THREE.Mesh(
            this._fxGeo.smoke,
            new THREE.MeshBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.35, depthWrite: false })
        ) : null;
        if (smoke) {
            smoke.scale.setScalar(0.32);
            smoke.position.copy(position);
            this.scene.add(smoke);
        }

        let life = lifetime;
        const animate = (prev) => {
            const now = performance.now();
            const dt = Math.min((now - (prev || now)) / 1000, 0.05);
            life -= dt;
            if (life <= 0) {
                this.scene.remove(flash);
                if (smoke) this.scene.remove(smoke);
                // 只dispose材质，不dispose共享几何体
                flash.material.dispose();
                if (smoke) smoke.material.dispose();
                this._releaseTransientFx(1);
                return;
            }
            const t = 1 - life / lifetime;
            flash.scale.setScalar(flashRadius * (1 + t * (isHeavyMuzzle ? 2.0 : 1.2)));
            flash.material.opacity = (1 - t) * 0.9;
            if (smoke) {
                smoke.scale.setScalar(0.32 * (1 + t * 1.2));
                smoke.material.opacity = (1 - t) * 0.28;
                smoke.position.y += 0.9 * dt;
            }
            requestAnimationFrame(() => animate(now));
        };
        animate();
    }

    _getCannonMuzzle() {
        if (!this.turret) return this.position.clone();
        const localOffset = new THREE.Vector3(0, 0, -3.5);
        let muzzleHeight = 1.7;
        if (this.type === 'apc') { localOffset.set(0, 0.1, -1.2); muzzleHeight = 2.2; }
        if (this.type === 'heli') { localOffset.set(0, 0, -1.0); muzzleHeight = 1.0; }
        if (this.type === 'jeep') { localOffset.set(0, 0, -1.3); muzzleHeight = 2.3; }
        if (this.type === 'plane') { localOffset.set(0, 0, -3.6); muzzleHeight = 1.5; }
        // 先按炮塔俯仰角旋转（绕X轴），再按炮塔偏航和车身偏航旋转（绕Y轴）
        const pitch = this.turretPitch || 0;
        localOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.turretYaw);
        localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw + (this._modelFlipped ? Math.PI : 0));
        return this.position.clone().add(localOffset).add(new THREE.Vector3(0, muzzleHeight, 0));
    }

    _getCannonDirection() {
        // 固定翼：武器固定前射，方向=机头朝向（含俯仰），无炮塔偏转
        // 注意符号：rotation.x = pitchAngle，机头方向 y 分量 = sin(pitchAngle)
        // （pitchAngle 为负 = 机头朝下 = 子弹朝下，俯冲扫射地面）
        if (this.config?.isPlane) {
            const pitch = this.pitchAngle || 0;
            return new THREE.Vector3(
                -Math.sin(this.yaw) * Math.cos(pitch),
                Math.sin(pitch),
                -Math.cos(this.yaw) * Math.cos(pitch)
            ).normalize();
        }
        const totalYaw = this.yaw + this.turretYaw + (this._modelFlipped ? Math.PI : 0);
        const pitch = this.turretPitch || 0;
        // 正俯仰角=向上看，方向Y分量应为正值（与摄像机一致）
        return new THREE.Vector3(
            -Math.sin(totalYaw) * Math.cos(pitch),
            Math.sin(pitch),
            -Math.cos(totalYaw) * Math.cos(pitch)
        ).normalize();
    }

    // 获取座位位置
    getSeatPosition(seat) {
        // 返回座位眼睛高度位置（第一人称用）
        const pos = this.position.clone();
        const sinY = Math.sin(this.yaw);
        const cosY = Math.cos(this.yaw);
        // 车头方向（与移动/炮塔一致）
        const fx = -sinY;
        const fz = -cosY;
        // 右侧方向
        const rx = cosY;
        const rz = -sinY;

        let localF = 0;
        let localR = 0;
        let localY = 1.4;

        if (this.type === 'jeep') {
            // 吉普车：前排驾驶/副驾，后排乘员
            if (seat === 0) { localF = 0.55; localR = -0.42; localY = 1.55; }
            else if (seat === 1) { localF = 0.55; localR = 0.42; localY = 1.55; }
            else { localF = -0.35; localR = (seat % 2 === 0 ? -0.4 : 0.4); localY = 1.5; }
        } else if (this.type === 'tank') {
            // 坦克：观瞄位抬高后移，炮管出现在视野下缘（可见但不挡准星）
            if (seat === 0) { localF = 0.1; localR = 0; localY = 2.95; }
            else { localF = -0.15; localR = 0.4; localY = 2.8; }
        } else if (this.type === 'heli') {
            // 直升机：驾驶员和副驾驶并排坐在座舱前部
            if (seat === 0) { localF = 1.55; localR = -0.25; localY = 1.95; }
            else { localF = 1.55; localR = 0.25; localY = 1.95; }
        } else if (this.type === 'plane') {
            // 攻击机：座舱位于机身中前部
            localF = 0.6; localR = 0; localY = 2.2;
        } else { // apc
            if (seat === 0) { localF = 1.15; localR = -0.3; localY = 1.85; }
            else if (seat === 1) { localF = 0.45; localR = 0.35; localY = 1.85; }
            else { localF = -0.4 - (seat - 2) * 0.55; localR = (seat % 2 === 0 ? -0.4 : 0.4); localY = 1.7; }
        }

        pos.x += fx * localF + rx * localR;
        pos.z += fz * localF + rz * localR;
        pos.y += localY;
        return pos;
    }

    // 进入载具
    enter(player, seat = 0) {
        if (this.occupants[seat]) return false;
        this.occupants[seat] = player;
        // 载具易主（战地缴获机制）：驾驶员上车且车上无其他阵营乘员时，载具归属驾驶员阵营。
        // 修复"友军攻击玩家驾驶的载具"：玩家开走敌方车后，载具 team 未变，
        // 友军 AI 仍把它当敌方载具打。
        if (seat === 0 && player.team !== undefined && player.team !== this.team) {
            const hasOtherTeamOccupant = this.occupants.some(
                o => o && o !== player && o.team !== player.team
            );
            if (!hasOtherTeamOccupant) {
                this.team = player.team;
            }
        }
        if (seat === 0 && !this.engineSound && this.audio) {
            this.engineSound = this.audio.createEngineSound(this.config.engineType, this.config.enginePitch);
        }
        return true;
    }

    _stopEngineSound() {
        const engineSound = this.engineSound;
        this.engineSound = null;
        if (engineSound?.stop) engineSound.stop();
    }

    // 离开载具
    exit(seat) {
        const player = this.occupants[seat];
        this.occupants[seat] = null;
        if (seat === 0) this._stopEngineSound();
        if (this.isEmpty() && this.setFirstPersonLocalView) {
            this.setFirstPersonLocalView(false);
        }
        return player;
    }

    _collectFirstPersonHideMeshes() {
        this._fpHiddenMeshes = [];
        this._fpHeliHiddenMeshes = [];
        this._fpHeliVisibleMeshes = [];
        if (!this.model) return;
        this.model.traverse((child) => {
            if (!child.isMesh) return;
            // 直升机内部细节（第一人称时显示）
            if (this.type === 'heli' && child.userData.fpVisible) {
                this._fpHeliVisibleMeshes.push(child);
                return;
            }
            // 只隐藏标记了 fpHide 的 mesh（挡风玻璃、炮管等挡视线部件）
            // 载具主体（车体、履带、炮塔等）保持可见，让玩家有"坐在载具中"的感觉
            if (child.userData.fpHide) {
                this._fpHiddenMeshes.push(child);
                if (this.type === 'heli') {
                    this._fpHeliHiddenMeshes.push(child);
                }
            }
        });
    }

    // 本地玩家第一人称时隐藏/弱化遮挡部件
    setFirstPersonLocalView(active) {
        active = !!active;
        if (this._fpViewActive === active) return;
        this._fpViewActive = active;

        if (!this._fpHiddenMeshes || this._fpHiddenMeshes.length === 0) {
            this._collectFirstPersonHideMeshes();
        }
        for (const mesh of this._fpHiddenMeshes) {
            mesh.visible = !active;
        }

        if (this.type === 'heli') {
            for (const mesh of this._fpHeliHiddenMeshes) {
                mesh.visible = !active;
            }
            for (const mesh of this._fpHeliVisibleMeshes) {
                mesh.visible = active;
            }
        }
    }

    // 获取可用座位
    getAvailableSeat() {
        for (let i = 0; i < this.occupants.length; i++) {
            if (!this.occupants[i]) return i;
        }
        return -1;
    }

    // 检查是否全空
    isEmpty() {
        return this.occupants.every(o => o === null);
    }

    // 受伤（带装甲减伤）
    takeDamage(amount, hitPoint = null, attacker = null) {
        if (!this.alive) return false;

        // === 装甲减伤 ===
        let effectiveDamage = amount;
        if (hitPoint) {
            const armorMult = this._getArmorMultiplier(hitPoint);
            effectiveDamage = amount * armorMult;
        } else {
            // 无命中点（如爆炸）→ 用侧面装甲平均值
            const armor = this.config.armor || { side: 1.0, rear: 1.0 };
            effectiveDamage = amount * ((armor.side + armor.rear) / 2);
        }

        this.health -= effectiveDamage;
        // 受击火花
        this._spawnCollisionSparks();
        // 受击震颤（车身抖动）
        this._hitShake = Math.min(1, (this._hitShake || 0) + Math.min(0.6, effectiveDamage / 80));
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
            this._destroyAttacker = attacker;
            if (this.config.isAircraft) {
                this._beginCrash();
                return true;
            }
            this._destroy();
            return true;
        }
        return false;
    }

    // 根据命中点方位计算装甲减伤倍率（前/侧/后/顶）
    _getArmorMultiplier(hitPoint) {
        const armor = this.config.armor;
        if (!armor) return 1.0;

        // 命中方向相对载具朝向
        const toHit = new THREE.Vector3().subVectors(hitPoint, this.position);
        const verticalDist = toHit.y;
        toHit.y = 0;

        // 顶部命中（命中点几乎在载具正上方/高仰角）
        const horizDist = Math.sqrt(toHit.x * toHit.x + toHit.z * toHit.z);
        if (horizDist < 0.2 || (verticalDist > 1.5 && verticalDist > horizDist * 0.6)) {
            return armor.top;
        }

        toHit.normalize();
        // 载具前方向量（与 yaw 对应）
        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const dot = toHit.dot(forward);

        // 前/后/侧
        if (dot > 0.4) return armor.front;
        if (dot < -0.4) return armor.rear;
        return armor.side;
    }

    _beginCrash() {
        this._crashing = true;
        this._crashFinalized = false;
        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
        this._crashVelocity.copy(forward).multiplyScalar(Math.max(6, Math.abs(this.velocity)));
        this._crashVelocity.addScaledVector(right, this.lateralVelocity || 0);
        this._crashVelocity.y = Math.min(this.verticalVelocity || 0, -4);
        this._crashAngularVelocity.set(
            (Math.random() - 0.5) * 1.4,
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 1.8
        );
        this.velocity *= 0.35;
        this.lateralVelocity *= 0.35;
        this.verticalVelocity = this._crashVelocity.y;
        this.rotorSpeed = Math.max(this.rotorSpeed || 0, 12);

        for (let i = 0; i < this.occupants.length; i++) {
            const occupant = this.occupants[i];
            if (!occupant) continue;
            if (occupant.exitVehicle) {
                occupant.exitVehicle();
            } else {
                // AI 乘员：彻底脱离载具，否则坠落期间会被 _assignedVehicle 过滤
                // 成"幽灵"（无法被射击/标记/复活，倒地后流血计时卡死）
                occupant.inVehicle = null;
                occupant.vehicleSeat = 0;
                if (occupant._assignedVehicle === this) {
                    occupant._assignedVehicle = null;
                    if (occupant.model) occupant.model.visible = occupant.alive;
                }
            }
            this.occupants[i] = null;
        }
    }

    updateCrash(dt) {
        if (!this._crashing || this._crashFinalized) return;

        this._crashVelocity.y -= 18 * dt;
        this._crashVelocity.y = Math.max(this._crashVelocity.y, -32);
        this._crashVelocity.x *= Math.pow(0.985, dt * 60);
        this._crashVelocity.z *= Math.pow(0.985, dt * 60);
        this.position.addScaledVector(this._crashVelocity, dt);

        this.pitchAngle += this._crashAngularVelocity.x * dt;
        this.rollAngle += this._crashAngularVelocity.z * dt;
        this.yaw += this._crashAngularVelocity.y * dt;
        this.rotorSpeed = Math.max(0, (this.rotorSpeed || 0) - dt * 3);

        const halfSize = CONFIG.WORLD.size / 2 - 3;
        this.position.x = THREE.MathUtils.clamp(this.position.x, -halfSize, halfSize);
        this.position.z = THREE.MathUtils.clamp(this.position.z, -halfSize, halfSize);

        // 坠毁过程中撞到建筑也立即引爆
        if (this.world.checkCollision(this.position, 2.0, 1.8)) {
            this._crashing = false;
            this._crashFinalized = true;
            this._updateModel();
            this._destroy();
            return;
        }

        this._crashSmokeTimer -= dt;
        if (this._crashSmokeTimer <= 0) {
            this._crashSmokeTimer = 0.08;
            this._spawnCrashSmoke();
        }

        this._updateModel();

        const groundY = this.world.getHeight(this.position.x, this.position.z);
        if (this.position.y <= groundY + 0.45) {
            this.position.y = groundY + 0.45;
            this.pitchAngle = THREE.MathUtils.clamp(this.pitchAngle, -0.9, 0.9);
            this.rollAngle = this.rollAngle || 0.7;
            this._crashing = false;
            this._crashFinalized = true;
            this._updateModel();
            this._destroy();
        }
    }

    _spawnCrashSmoke() {
        const smoke = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0x181818, transparent: true, opacity: 0.45 })
        );
        smoke.position.copy(this.position);
        smoke.position.y += 0.8;
        this.scene.add(smoke);

        let life = 1.1;
        const animateSmoke = (prev) => {
            const now = performance.now();
            const dt = Math.min((now - (prev || now)) / 1000, 0.05);
            life -= dt;
            if (life <= 0) {
                this.scene.remove(smoke);
                smoke.geometry.dispose();
                smoke.material.dispose();
                return;
            }
            smoke.position.y += 1.6 * dt;
            smoke.scale.setScalar(1 + (1.1 - life) * 1.8);
            smoke.material.opacity = (life / 1.1) * 0.45;
            requestAnimationFrame(() => animateSmoke(now));
        };
        animateSmoke();
    }

    _destroy() {
        // 多阶段爆炸链
        const center = this.position.clone().add(new THREE.Vector3(0, 1, 0));
        if (this.onDestroyed) {
            this.onDestroyed(
                center.clone(),
                this.config.explosionRadius || 12,
                this.config.explosionDamage || 160,
                this,
                this._destroyAttacker || null
            );
        }

        // 主爆炸 - 大火球
        this._createImpactExplosion(center, 6);
        if (this.audio) this.audio.playExplosion(this.position);

        // 延迟二次爆炸
        setTimeout(() => {
            if (this.audio) this.audio.playExplosion(this.position);
            this._createImpactExplosion(center.clone().add(new THREE.Vector3(0, 0.5, 0)), 4);
        }, 300);
        setTimeout(() => {
            this._createImpactExplosion(center.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * 2, 0.3, (Math.random() - 0.5) * 2
            )), 3);
        }, 600);

        // 飞溅碎片
        for (let i = 0; i < 12; i++) {
            const debris = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.2, 0.2),
                new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 })
            );
            debris.position.copy(center);
            this.scene.add(debris);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                Math.random() * 10 + 5,
                (Math.random() - 0.5) * 15
            );
            let dLife = 2;
            const animateDebris = (prev) => {
                const now = performance.now();
                const dt = Math.min((now - (prev || now)) / 1000, 0.05);
                dLife -= dt;
                if (dLife <= 0) {
                    this.scene.remove(debris);
                    debris.geometry.dispose();
                    debris.material.dispose();
                    return;
                }
                vel.y -= 25 * dt;
                debris.position.add(vel.clone().multiplyScalar(dt));
                debris.rotation.x += 6 * dt;
                debris.rotation.y += 5 * dt;
                requestAnimationFrame(() => animateDebris(now));
            };
            animateDebris();
        }

        // 持久烟雾柱
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const smoke = new THREE.Mesh(
                    new THREE.SphereGeometry(1.5, 8, 6),
                    new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.5 })
                );
                smoke.position.copy(center);
                smoke.position.x += (Math.random() - 0.5) * 2;
                smoke.position.z += (Math.random() - 0.5) * 2;
                this.scene.add(smoke);

                let sLife = 5;
                const animateSmoke = (prev) => {
                    const now = performance.now();
                    const dt = Math.min((now - (prev || now)) / 1000, 0.05);
                    sLife -= dt;
                    if (sLife <= 0) {
                        this.scene.remove(smoke);
                        smoke.geometry.dispose();
                        smoke.material.dispose();
                        return;
                    }
                    smoke.position.y += 1.2 * dt;
                    smoke.scale.setScalar(1 + (5 - sLife) * 0.3);
                    smoke.material.opacity = (sLife / 5) * 0.5;
                    requestAnimationFrame(() => animateSmoke(now));
                };
                animateSmoke();
            }, i * 200);
        }

        // 移除损伤特效
        if (this._damageSmoke) { this.model.remove(this._damageSmoke); this._damageSmoke = null; }
        if (this._damageFire) { this.model.remove(this._damageFire); this._damageFire = null; }
        if (this._damageLight) { this._damageLight = null; }

        // 踢出所有乘员
        for (let i = 0; i < this.occupants.length; i++) {
            const occupant = this.occupants[i];
            if (!occupant) continue;
            if (occupant.alive === false) {
                if (occupant.inVehicle === this) {
                    occupant.inVehicle = null;
                    occupant.vehicleSeat = 0;
                    occupant.vehicleThirdPerson = false;
                }
            } else if (occupant.exitVehicle) {
                occupant.exitVehicle();
                if (!this.onDestroyed) {
                    occupant.takeDamage(50);
                }
            }
            this.occupants[i] = null;
        }

        this._stopEngineSound();

        // 变黑 + 倾倒（克隆材质去掉共享标记并记录，重生时随旧模型一起释放，避免泄漏）
        this.model.traverse(child => {
            if (child.isMesh) {
                const mat = child.material.clone();
                delete mat.userData.sharedProcedural;
                mat.color.setHex(0x1a1a1a);
                child.material = mat;
                this._blackenedMaterials.push(mat);
            }
        });
        this.model.rotation.z = 0.3; // 倾倒效果
    }

    // 修复
    repair(amount) {
        this.health = Math.min(this.health + amount, this.config.maxHealth);
    }

    // 获取状态
    getState() {
        const groundY = this.world.getHeight(this.position.x, this.position.z);
        return {
            type: this.type,
            name: this.config.name,
            health: this.health,
            maxHealth: this.config.maxHealth,
            alive: this.alive,
            team: this.team,
            position: this.position.clone(),
            yaw: this.yaw,
            hasWeapon: this.config.hasWeapon,
            occupants: this.occupants.filter(o => o !== null).length,
            maxOccupants: this.config.seats,
            speed: this.velocity,
            lateralSpeed: this.lateralVelocity,
            altitude: this.config.isAircraft ? (this.position.y - groundY) : 0,
            isAircraft: this.config.isAircraft || false,
            cannonCooldown: this.cannonCooldown,
            maxCannonCooldown: this.config.cannonCooldown || 0,
            cannonAmmo: Math.floor(this.cannonAmmo),
            maxCannonAmmo: this.maxCannonAmmo,
            secondaryAmmo: Math.floor(this.secondaryAmmo),
            maxSecondaryAmmo: this.maxSecondaryAmmo,
            turretYaw: this.turretYaw,
            isDrifting: this._isSkidding,
            healthPct: this.health / this.config.maxHealth,
            engineType: this.config.engineType || 'wheeled',
        };
    }

    dispose() {
        this._stopEngineSound();
        // 清理轮胎痕迹
        for (const mark of this._skidMarks) {
            this.scene.remove(mark);
            if (mark.geometry) mark.geometry.dispose();
            if (mark.material) mark.material.dispose();
        }
        this._skidMarks = [];
        for (const mat of Object.values(this._vehicleTracerMaterials || {})) {
            if (mat) mat.dispose();
        }
        this._vehicleTracerMaterials = {};
        // 黑化克隆材质与共享特效几何体
        for (const mat of this._blackenedMaterials) mat.dispose();
        this._blackenedMaterials = [];
        for (const geo of [this._fxGeo?.flash, this._fxGeo?.smoke, this._fxGeo?.spark]) {
            if (geo) geo.dispose();
        }
        if (this.model) this.scene.remove(this.model);
    }
}
