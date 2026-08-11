import * as THREE from 'three';
import { CONFIG } from '../config.js?v=20260811.1';
import { InputManager } from './Input.js?v=20260808.1';
import { World } from '../world/World.js?v=20260811.1';
import { PlayerController } from '../player/PlayerController.js?v=20260808.1';
import { WeaponSystem } from '../weapons/WeaponSystem.js?v=20260811.1';
import { Bot } from '../ai/Bot.js?v=20260811.1';
import { Vehicle } from '../vehicles/Vehicle.js?v=20260811.3';
import { AudioManager } from '../audio/AudioManager.js?v=20260801.2';
import { HUD } from '../ui/HUD.js?v=20260811.1';
import { MenuManager } from '../ui/Menu.js?v=20260811.1';
import { GameModeFactory } from './GameModeFactory.js?v=20260811.1';
import { DestructibleRegistry } from '../world/DestructibleRegistry.js?v=20260801.2';
import { FortificationSystem } from '../world/FortificationSystem.js?v=20260801.2';
import { LightPool } from '../utils/LightPool.js?v=20260801.2';
import { CharacterModel } from '../player/CharacterModel.js?v=20260811.2';
import { TransientFxManager } from '../utils/TransientFxManager.js?v=20260807.2';
import { BattlefieldDirector } from './BattlefieldDirector.js?v=20260808.1';

// 主游戏引擎
export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.input = null;
        this.world = null;
        this.player = null;
        this.weaponSystem = null;
        this.audio = null;
        this.hud = null;
        this.menu = null;

        // 游戏状态
        this.state = 'loading';  // loading, menu, playing, paused, gameOver
        this.clock = new THREE.Clock();
        this.lastTime = 0;
        this.baseFov = 75; // 基础视野，由设置覆盖

        // 实体
        this.bots = [];
        this.vehicles = [];
        this.allCharacters = [];

        // 得分
        this.friendlyScore = 0;
        this.enemyScore = 0;
        this.timeLeft = CONFIG.GAME.matchDuration;

        // 征服模式票数
        this.friendlyTickets = CONFIG.GAME.startingTickets;
        this.enemyTickets = CONFIG.GAME.startingTickets;

        // 游戏模式系统
        this.currentMapId = 'default';
        this.currentModeId = 'conquest';
        this.gameMode = null;

        // 可破坏实体注册表
        this.destructibles = null;
        this.fortifications = null;
        this.director = null;
        this._directorSmokeZones = [];
        this._directorRally = null;
        this._supportPanelOpen = false;
        this._directorHudTimer = 0;

        // 狙击镜反光系统
        this._scopeGlareSprites = new Map();  // bot -> sprite
        this._scopeGlareMat = null;

        // 玩家统计
        this.playerStats = {
            kills: 0,
            deaths: 0,
            assists: 0,
            captures: 0,
            revives: 0,
            heals: 0,
            resupplies: 0,
            repairs: 0,
            spotAssists: 0,
            vehiclesDestroyed: 0,
            objectivesDestroyed: 0,
            missionsCompleted: 0,
            missionsParticipated: 0,
            fortificationsBuilt: 0,
        };
        this._playerDamageContributions = new Map();
        this._assistCleanupTimer = 0;

        // FPS
        this.fpsCounter = 0;
        this.fpsTimer = 0;
        this.currentFPS = 60;
        this._renderScale = 1;
        this._perfLowFpsSeconds = 0;
        this._perfHighFpsSeconds = 0;
        this._markerInterval = 0.1;
        this._compassInterval = 0.05;

        // 交互
        this.nearbyVehicle = null;
        this.nearbyReviveTarget = null;
        this.nearbyDragTarget = null;   // 附近可拖拽的倒地队友
        this.nearbyCapturePoint = null;

        // 手雷投掷
        this.grenadeThrowCooldown = 0;

        // 低血量心跳计时
        this.heartbeatTimer = 0;

        // 部署计时器
        this._deployTimer = 0;
        this._spectatingBot = null;

        // 连杀系统
        this._playerKillstreak = 0;
        this._killstreakTimer = 0;

        // 空投补给系统
        this._supplyDropTimer = 30; // 30秒后首次空投
        this._supplyDropInterval = 60; // 每60秒一次
        this._supplyDrops = [];

        // 3D标记节流
        this._markerUpdateTimer = 0;

        // 罗盘节流
        this._compassUpdateTimer = 0;

        // 指挥命令与战场节奏
        this.currentOrder = null;
        this._orderTimer = 0;
        this._battleIntensityTimer = 0;
        this._battleIntensity = 1;

        // AI载具与载具重生
        this._vehicleAiAssignments = new Map();
        this._vehicleRespawns = [];
        this._teamStrategicEffects = this._createTeamStrategicEffects();
        this._vehicleAssignTimer = 0;
        this._aiVehicleThinkTimer = 0;
        this._vehicleAiStartTimer = 0;
        this._tmpObjectivePos = new THREE.Vector3();
        this._spotCooldown = 0;
        this._spotRaycaster = new THREE.Raycaster();
        this._spotDirection = new THREE.Vector3();
        this._supportRaycaster = new THREE.Raycaster();
        this._supportDirection = new THREE.Vector3();
        this._supportTarget = new THREE.Vector3();
        this._supportScoreBank = { ammo: 0, heal: 0, repair: 0 };
    }

    async init() {
        // 场景
        this.scene = new THREE.Scene();

        // 相机
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 0);
        // 相机需加入场景，否则挂载在相机下的武器模型不会被渲染
        this.scene.add(this.camera);

        // 瞬态灯光池：固定数量，杜绝运行中灯光增删导致的着色器重编译卡顿
        this.lightPool = new LightPool(this.scene, 6);
        this.scene.userData.lightPool = this.lightPool;
        this.transientFx = new TransientFxManager(this.scene);
        this.scene.userData.transientFx = this.transientFx;
        this._gameFxGeo = {
            dust: this.transientFx.own(new THREE.CircleGeometry(1, 6)),
            flash: this.transientFx.own(new THREE.SphereGeometry(1, 10, 6)),
            shockwave: this.transientFx.own(new THREE.RingGeometry(0.2, 0.4, 20)),
            smokeColumn: this.transientFx.own(new THREE.CylinderGeometry(0.35, 0.75, 1.4, 8, 1, true)),
            scorch: this.transientFx.own(new THREE.CircleGeometry(1, 12)),
            spark: this.transientFx.own(new THREE.SphereGeometry(1, 4, 4)),
            directorSmoke: this.transientFx.own(new THREE.SphereGeometry(1, 7, 5)),
        };

        // 渲染器
        this.renderer = new THREE.WebGLRenderer({
            antialias: CONFIG.RENDERER.antialias,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // 性能优化：像素比压到1.0，优先帧率
        this.renderer.setPixelRatio(this._renderScale);
        this.renderer.shadowMap.enabled = CONFIG.RENDERER.shadowMapEnabled;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = CONFIG.RENDERER.toneMappingExposure ?? 1.1;
        document.body.appendChild(this.renderer.domElement);

        // 系统
        this.input = new InputManager();
        this.audio = new AudioManager();
        this.hud = new HUD();
        this.menu = new MenuManager(this.audio);
        this.menu.setGameReferences(this.input, this.audio, this.camera, this);

        // 世界
        this.menu.updateLoading(10, '生成地形...');
        this.world = new World(this.scene, this.currentMapId);
        await this._delay(100);

        this.menu.updateLoading(30, '构建战场...');
        this.world.init();
        this._applyMapRenderSettings();
        this.staticGuns = this.world.staticGuns || [];
        await this._delay(100);

        // 菜单回调
        this.menu.updateLoading(50, '加载系统...');
        this._setupMenuCallbacks();
        await this._delay(100);

        this.menu.updateLoading(70, '初始化AI...');
        this._spawnBots();
        this._setupSquads();
        await this._delay(100);

        this.menu.updateLoading(85, '部署载具...');
        this._spawnVehicles();
        this._applySceneShadows();
        await this._delay(100);

        this.menu.updateLoading(100, '准备完毕');
        await this._delay(200);

        // 事件
        window.addEventListener('resize', () => this._onResize());

        // 键盘事件
        this.input.onKeyDown = (code, e) => this._onKeyDown(code, e);

        this.menu.hideLoading();
        this.menu.show('mainMenu');
        this.state = 'menu';

        // 启动渲染循环
        this._animate();
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        else this.scene.remove(object);
    }

    _setupMenuCallbacks() {
        this.menu.onDeploy = (classType, loadout, mapId, modeId) => {
            this.startGame(classType, loadout, mapId, modeId);
        };
        this.menu.onResume = () => {
            this.resumeGame();
        };
        this.menu.onPause = () => {
            this.pauseGame();
        };
        this.menu.onQuit = () => {
            this.quitGame();
        };
        this.menu.onChangeClass = (classType, loadout) => {
            this.changeClassInGame(classType, loadout);
        };

        // 部署按钮
        const btnDeployNow = document.getElementById('btnDeployNow');
        if (btnDeployNow) {
            btnDeployNow.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (this.state !== 'playing' || this.player.alive || this.player.downed) return;
                // 倒计时未结束：只提示，但允许已选点在结束后自动/手动部署
                if (this._deployTimer > 0) {
                    this.hud.showNotification?.(`还需等待 ${Math.ceil(this._deployTimer)} 秒`, 1.2);
                    return;
                }
                // 未选部署点时自动选最近己方据点
                if (!this.hud.getSelectedDeployPoint() && !(this.hud.getSelectedSquadMember && this.hud.getSelectedSquadMember())) {
                    this._autoSelectDeployPoint();
                }
                this._respawnPlayer();
            });
        }
    }

    startGame(classType, loadoutOverride = null, mapId = null, modeId = null) {
        this.director?.dispose();
        this.director = null;
        this._directorSmokeZones.length = 0;
        this._directorRally = null;
        this._supportPanelOpen = false;
        this.hud?.hideSupportPanel?.();
        this.hud?.clearDirector?.();
        this.transientFx?.clear();
        // 设置地图和模式
        const prevMapId = this.currentMapId;
        if (mapId) this.currentMapId = mapId;
        if (modeId) this.currentModeId = modeId;
        // 地图变化或上一局已释放时重建完整战场
        if (this._battlefieldReleased || (this.world && this.world.mapId !== this.currentMapId)) {
            this._rebuildWorld();
        }
        this.audio.init();
        this.audio.resume();
        if (this.audio.startBattlefieldAmbience) {
            this.audio.startBattlefieldAmbience(0.85);
        }

        // 清理上一局残留的武器系统（更换兵种时）
        if (this.weaponSystem) {
            if (this.weaponSystem.dispose) this.weaponSystem.dispose();
            else this.camera.remove(this.weaponSystem.weaponGroup);
            this.weaponSystem = null;
        }

        // 清理上一局残留的部署物
        if (this._deployables) {
            for (const d of this._deployables) {
                if (d.mesh) this.world?.obstacles?.removeCollisionForMesh?.(d.mesh);
                if (d.mesh) this._disposeObject3D(d.mesh);
            }
            this._deployables = [];
        }
        if (this._pendingProjectiles) {
            for (const p of this._pendingProjectiles) {
                if (p.mesh) this._disposeObject3D(p.mesh);
            }
            this._pendingProjectiles = [];
        }

        // 应用设置（含阴影/渲染缩放）
        this.menu.applySettings(this.input, this.audio, this.camera, this);
        this.baseFov = this.camera.fov; // 保存基础 FOV
        this.camera.updateProjectionMatrix();

        this.director = new BattlefieldDirector(this);
        if (loadoutOverride?.specialization) this.director.setSpecialization(classType, loadoutOverride.specialization);

        // 创建玩家
        const classConfig = this.director.getRuntimeClassConfig(classType);
        const selectedLoadout = this._resolvePlayerLoadout(classType, loadoutOverride);
        selectedLoadout.specialization = this.director.getSpecializationState(classType)?.route || null;
        this.player = new PlayerController(this.camera, this.world, this.input);
        this.player.setAudio(this.audio);
        this.player.onLoudNoise = (position, type) => this._onPlayerLoudNoise(position, type);
        this.player.team = 0;
        this.player.onDeath = (killer) => this._onPlayerDeath(killer);
        this.player.onDowned = (attacker) => this._onPlayerDowned(attacker);

        // 出生位置
        const spawnPos = this.world.getTeamSpawnPoint ? this.world.getTeamSpawnPoint(0) : new THREE.Vector3(-95, 0, -95);
        this.player.spawn(spawnPos, classConfig);

        // 设置兵种
        this.player.setClass(classType, classConfig);
        this.playerClassType = classType;
        this.playerLoadout = selectedLoadout;
        this._specialCooldown = 0;
        this._specialMaxCooldown = CONFIG.SPECIALS?.[classConfig.special]?.cooldown || 0;

        // 武器系统
        const loadout = selectedLoadout;
        this.weaponSystem = new WeaponSystem(this.scene, this.camera, this.audio, this.world, {
            onHit: (target, damage, isHeadshot, weaponName, hitPoint) => this._onPlayerHit(target, damage, isHeadshot, weaponName, hitPoint),
            onWorldHit: (mesh, damage, weaponName, hitPoint, config) => this._onPlayerWorldHit(mesh, damage, weaponName, hitPoint, config),
            onKill: (target, weaponName) => this._onPlayerKill(target, weaponName),
            onExplosion: (position, radius, damage) => this._onExplosion(position, radius, damage, this.player.team, this.player),
            getTargets: () => this._getShootableTargets(),
            onNearMiss: (dist) => this._onBulletNearMiss(dist),
        });
        this.weaponSystem.loadWeapons([loadout.primary, loadout.secondary], loadout.optic);

        // 重置得分和票数
        this.friendlyScore = 0;
        this.enemyScore = 0;
        this.timeLeft = CONFIG.GAME.matchDuration;

        // 初始化游戏模式
        const modeConfig = CONFIG.GAME_MODES[this.currentModeId] || CONFIG.GAME_MODES.conquest;
        this.gameMode = GameModeFactory.create(this, modeConfig);
        this.world.strategicObjectivesEnabled = this.supportsStrategicObjectives();
        if (this.gameMode) {
            this.gameMode.onMatchStart();
            this.friendlyTickets = this.gameMode.teamTickets[0];
            this.enemyTickets = this.gameMode.teamTickets[1];
            this.timeLeft = this.gameMode.matchTimer;
        } else {
            this.friendlyTickets = CONFIG.GAME.startingTickets;
            this.enemyTickets = CONFIG.GAME.startingTickets;
        }
        this.director.start();
        this.menu.setSpecializationStateProvider?.(type => this.director?.getSpecializationState(type));
        this.hud.setSupportSelectCallback?.(type => this._requestDirectorSupport(type));

        // 可破坏实体注册表（每局重置；旧 Registry 的共享 GPU 资源在此释放）
        if (this.destructibles) {
            this.destructibles.dispose?.();
        }
        this.destructibles = new DestructibleRegistry(this.scene);
        if (this.fortifications) {
            this.fortifications.bindWorld(this.world, this.destructibles);
        } else {
            this.fortifications = new FortificationSystem(this.scene, {
                world: this.world,
                destructibles: this.destructibles,
                hud: this.hud,
                input: this.input,
                audio: this.audio,
                getPlayer: () => this.player,
                getWeapon: () => this.weaponSystem,
                getBots: () => this.bots,
                getVehicles: () => this.vehicles,
                getPlayerClass: () => this.playerClassType,
                isExecutionActive: () => !!this._executing,
                applyShadows: (root) => this._applyObjectShadows(root),
            });
        }
        this._registerDestructibles();

        // 更新HUD模式/地图标签
        const modeLabelEl = document.getElementById('gameModeLabel');
        if (modeLabelEl) modeLabelEl.textContent = modeConfig.name || this.currentModeId;
        this.playerStats = {
            kills: 0,
            deaths: 0,
            assists: 0,
            captures: 0,
            revives: 0,
            heals: 0,
            resupplies: 0,
            repairs: 0,
            spotAssists: 0,
            vehiclesDestroyed: 0,
            objectivesDestroyed: 0,
            missionsCompleted: 0,
            missionsParticipated: 0,
            fortificationsBuilt: 0,
        };
        this._playerDamageContributions.clear();
        this._supportScoreBank = { ammo: 0, heal: 0, repair: 0 };
        this.currentOrder = null;
        this._orderTimer = 3;
        this._resetStrategicEffects();
        this._resetStrategicObjectives();
        this._battleIntensity = 1;
        this._battleIntensityTimer = 0;
        this._vehicleAiAssignments.clear();
        this._vehicleRespawns.length = 0;
        this._vehicleAiStartTimer = CONFIG.GAME.aiVehicleStartDelay || 0;
        this._spotCooldown = 0;

        // 重置所有AI
        for (const bot of this.bots) {
            bot._assignedVehicle = null;
            bot.inVehicle = null;
            bot._vehicleSeat = 0;
            bot.model.visible = true;
            const spawnPos = bot.getRespawnPosition();
            spawnPos.y = this.world.getHeight(spawnPos.x, spawnPos.z);
            bot.spawn(spawnPos);
        }

        // 重置载具
        for (const vehicle of this.vehicles) {
            const spawn = this.world.vehicleSpawns.find(s => s.type === (vehicle.originalType || vehicle.type) && s.team === vehicle.team);
            if (spawn) {
                this._restoreVehicle(vehicle, spawn);
            }
        }

        // 据点回调
        this.world.onCapture = (cp) => this._onCapturePoint(cp);

        // 清理上一局残留的死亡/部署/倒地 UI（更换兵种路径若在死亡时触发，这些子层不会自动隐藏）
        this.hud.hideDeployScreen?.();
        this.hud.hideDeath?.();
        if (this.hud.hideDownedOverlay) this.hud.hideDownedOverlay();

        this.hud.show();
        this.hud.showCompass();
        this.state = 'playing';

        // 锁定鼠标
        if (!this.input.isMobile) {
            this.input.requestLock(this.renderer.domElement);
        }
        this.input.showMobileControls(true);

        this.hud.showNotification(`${modeConfig.name}模式开始：${modeConfig.description}！`, 3);
    }

    // 重建战场（切换地图时调用）
    _rebuildWorld() {
        this.director?.dispose();
        this.director = null;
        this._directorSmokeZones.length = 0;
        this._directorRally = null;
        this._supportPanelOpen = false;
        this.hud?.hideSupportPanel?.();
        this.hud?.clearDirector?.();
        this.transientFx?.clear();
        // 清理氛围特效
        for (const fx of this._ambientFx || []) {
            if (fx.light) this.scene.remove(fx.light);
            if (fx.smoke) {
                this.scene.remove(fx.smoke);
                fx.smoke.geometry.dispose();
                fx.smoke.material.dispose();
            }
        }
        this._ambientFx = [];
        this._clearAIGrenades();

        // 结束冲锋/退出防空炮
        if (this._banzaiActive) this._endBanzai(false);
        if (this.player?.inStaticGun) this.player.inStaticGun = null;
        if (this.player?.model) this.player.model.visible = true;
        if (this._mortarMapOpen) this._closeMortarMap();
        this.staticGuns = [];

        // 1. 销毁旧 bots
        for (const bot of this.bots) {
            if (bot.dispose) bot.dispose();
            else if (bot.model) this._disposeObject3D(bot.model);
        }
        this.bots = [];
        this._vehicleAiAssignments?.clear?.();

        // 2. 销毁旧 vehicles
        for (const vehicle of this.vehicles) {
            vehicle._stopEngineSound?.();
            vehicle.dispose?.();
        }
        this.vehicles = [];
        this._vehicleRespawns = [];
        this._resetStrategicEffects();
        this.scene.userData.vehicles = [];

        // 3. 销毁旧 World
        this.fortifications?.clear();
        if (this.destructibles) {
            this.destructibles.dispose?.();
            this.destructibles = null;
        }
        if (this.world) {
            this._resetStrategicObjectives();
            this.world.dispose();
            this.world = null;
        }

        // 4. 创建新 World
        this.world = new World(this.scene, this.currentMapId);
        this.world.init();
        this._applyMapRenderSettings();
        this.staticGuns = this.world.staticGuns || [];

        // 5. 重新生成 bots 和 vehicles
        this._spawnBots();
        this._setupSquads();
        this._spawnVehicles();
        this._applySceneShadows();
        this._battlefieldReleased = false;
    }

    // 为场景中的网格批量设置阴影标志（透明/发光辅助物不投影）
    _applySceneShadows() {
        if (!CONFIG.RENDERER.shadowMapEnabled) return;
        // 第一人称武器挂在相机下，不参与投影
        const excluded = new Set();
        if (this.camera) this.camera.traverse(o => excluded.add(o));
        this._applyObjectShadows(this.scene, excluded);
    }

    _applyObjectShadows(root, excluded = null) {
        if (!CONFIG.RENDERER.shadowMapEnabled || !root) return;
        root.traverse(obj => {
            if (excluded && excluded.has(obj)) return;
            if (!obj.isMesh) return;
            if (obj.userData.noShadow) return;
            const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
            if (!mat) return;
            const name = obj.name || '';
            if (name === 'terrain' || name === 'terrain_road') {
                obj.receiveShadow = true;
                obj.castShadow = false;
                return;
            }
            // 天空、透明标记环、发光体、精灵类不参与阴影
            if (mat.isShaderMaterial || mat.isSpriteMaterial) return;
            if (mat.transparent && (mat.opacity ?? 1) < 0.9) return;
            if (mat.isMeshBasicMaterial) return;
            obj.receiveShadow = true;
            // 性能：只有足够大的物体才投影（小碎件投影量大但视觉贡献极小）
            if (!obj.geometry.boundingSphere) obj.geometry.computeBoundingSphere();
            const worldRadius = (obj.geometry.boundingSphere?.radius || 0) *
                Math.max(obj.scale.x, obj.scale.y, obj.scale.z);
            obj.castShadow = worldRadius > 0.85;
        });
    }

    // 注册可破坏实体（沙袋、箱子、建筑墙体等）
    _registerDestructibles() {
        if (!this.destructibles || !this.world?.obstacles) return;
        const meshes = this.world.obstacles.getMeshes ? this.world.obstacles.getMeshes() : [];
        for (const mesh of meshes) {
            if (!mesh) continue;
            // 跳过玻璃（已有独立的 breakGlass 机制）
            if (mesh.userData?.isGlass) continue;
            // 跳过战略目标（有独立的伤害系统）
            if (mesh.userData?.strategicObjective) continue;
            // 跳过已注册的
            if (mesh.userData?.destructible) continue;

            const dtype = mesh.userData?.destructibleType;
            if (!dtype) continue;

            const cfg = CONFIG.DESTRUCTIBLES?.[dtype];
            if (!cfg) continue;

            this.destructibles.register(mesh, {
                health: cfg.health,
                armorMultiplier: cfg.armorMultiplier,
                breakType: cfg.breakType,
                type: dtype,
                onDestroy: (entity) => {
                    // 破坏后从碰撞 + 射线 mesh 列表移除，并失效缓存
                    const mesh = entity.mesh;
                    if (mesh && this.world?.obstacles?.removeCollisionForMesh) {
                        this.world.obstacles.removeCollisionForMesh(mesh);
                    } else if (mesh?.userData?.collisionBox) {
                        const obs = this.world?.obstacles?.obstacles;
                        if (obs) {
                            const idx = obs.indexOf(mesh.userData.collisionBox);
                            if (idx >= 0) obs.splice(idx, 1);
                        }
                    }
                    if (this.world?.invalidateMeshCaches) this.world.invalidateMeshCaches();
                },
            });
        }
    }

    // 狙击镜反光系统（战地5特色）
    // 当AI狙击手开镜瞄准时，镜片反射阳光形成周期性闪光，远处玩家可借此发现狙击手位置
    _updateScopeGlare(dt, now) {
        if (!this.player?.alive) {
            this._clearScopeGlare();
            return;
        }

        // 收集当前需要反光的 bot 集合
        const activeSnipers = new Set();
        for (const bot of this.bots) {
            if (!bot.alive) continue;
            if (bot.weaponConfig?.type !== 'sniper') continue;
            // 仅在战斗状态且接近静止时才反光（模拟开镜瞄准）
            const isAiming = bot.state === 'engage' && (bot.moveSpeed || 0) < 1.2;
            if (!isAiming) continue;
            activeSnipers.add(bot);
        }

        // 移除不再需要反光的 bot 的 sprite
        for (const [bot, sprite] of this._scopeGlareSprites) {
            if (!activeSnipers.has(bot)) {
                this.scene.remove(sprite);
                if (sprite.material) sprite.material.dispose();
                this._scopeGlareSprites.delete(bot);
            }
        }

        // 创建/更新反光 sprite
        for (const bot of activeSnipers) {
            let sprite = this._scopeGlareSprites.get(bot);
            if (!sprite) {
                // 懒初始化共享材质
                if (!this._scopeGlareMat) {
                    this._scopeGlareMat = new THREE.SpriteMaterial({
                        color: 0xfff4c0,
                        transparent: true,
                        opacity: 0,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                        depthTest: true,
                    });
                }
                sprite = new THREE.Sprite(this._scopeGlareMat.clone());
                sprite.scale.set(0.6, 0.6, 0.6);
                this.scene.add(sprite);
                this._scopeGlareSprites.set(bot, sprite);
                bot._scopeGlareTimer = 0;
            }

            // 位置：bot 头部上方（狙击镜位置）
            const headPos = bot.position.clone();
            headPos.y += 1.5;
            sprite.position.copy(headPos);

            // 周期性闪烁（每 3-4 秒闪一次，持续 0.4 秒）
            bot._scopeGlareTimer = (bot._scopeGlareTimer || 0) + dt;
            const cycle = 3.2;
            const flashDur = 0.45;
            const phase = bot._scopeGlareTimer % cycle;
            let intensity = 0;
            if (phase < flashDur) {
                // 闪烁曲线：快速亮起，缓慢消退
                intensity = Math.sin((phase / flashDur) * Math.PI);
            }

            // 距离衰减：远处反光略小但更亮（便于发现），近处较暗
            const distToPlayer = bot.position.distanceTo(this.player.position);
            const distFactor = Math.min(1, Math.max(0.3, distToPlayer / 80));

            // 大小随距离微调
            const scale = 0.4 + distFactor * 0.5;
            sprite.scale.set(scale, scale, scale);

            // 不透明度
            sprite.material.opacity = intensity * (0.35 + distFactor * 0.55);
        }
    }

    _clearScopeGlare() {
        for (const [bot, sprite] of this._scopeGlareSprites) {
            this.scene.remove(sprite);
            if (sprite.material) sprite.material.dispose();
        }
        this._scopeGlareSprites.clear();
    }

    _resolvePlayerLoadout(classType, override = null) {
        const classConfig = CONFIG.CLASSES[classType];
        if (!classConfig) return { primary: 'M416', secondary: 'P226', optic: null };

        const allowedPrimary = classConfig.weaponOptions || [classConfig.primary];
        const requestedPrimary = override?.primary || classConfig.primary;
        const primary = allowedPrimary.includes(requestedPrimary) ? requestedPrimary : classConfig.primary;
        const secondary = CONFIG.WEAPONS[override?.secondary] ? override.secondary : classConfig.secondary;

        // 瞄具校验：必须兼容所选主武器，否则回退默认
        const weaponCfg = CONFIG.WEAPONS[primary];
        const optics = weaponCfg?.optics || [];
        let optic = override?.optic || weaponCfg?.defaultOptic || null;
        if (optics.length > 0 && !optics.includes(optic)) {
            optic = weaponCfg.defaultOptic || optics[0];
        }

        return { primary, secondary, optic, special: classConfig.special || null };
    }

    // 局内更换兵种：不重开比赛，只重置玩家装备并在基地重生
    changeClassInGame(classType, loadoutOverride = null) {
        if (!CONFIG.CLASSES[classType] || !this.player) return;
        // 倒地/死亡时不允许用换兵种绕过票数与部署倒计时
        if (!this.player.alive || this.player.downed) {
            this.state = 'paused';
            this.menu.show('pause');
            this.hud.showNotification?.('倒地或阵亡时无法更换兵种', 1.5);
            return;
        }
        // 载具内换兵种必须完整退座并恢复相机参数
        if (this.player.inVehicle) {
            const vehicle = this.player.inVehicle;
            const seat = this.player.vehicleSeat;
            vehicle.exit?.(seat);
            this.player.exitVehicle?.();
            this.hud.hideVehicleUI?.();
        }
        // 防空炮炮手/刺雷冲锋退出
        if (this.player.inStaticGun) this._exitStaticGun();
        if (this._banzaiActive) this._endBanzai(false);
        // 迫击炮地图关闭
        if (this._mortarMapOpen) this._closeMortarMap();
        if (loadoutOverride?.specialization) this.director?.setSpecialization(classType, loadoutOverride.specialization);
        const classConfig = this.director?.getRuntimeClassConfig(classType) || CONFIG.CLASSES[classType];
        const loadout = this._resolvePlayerLoadout(classType, loadoutOverride);
        loadout.specialization = this.director?.getSpecializationState(classType)?.route || null;

        this.playerClassType = classType;
        this.playerLoadout = loadout;
        this.menu.selectedClass = classType;
        this._specialCooldown = 0;
        this._specialMaxCooldown = CONFIG.SPECIALS?.[classConfig.special]?.cooldown || 0;

        // 清掉旧部署物（医疗包/弹药包/传感器等归旧所有者）
        if (this._deployables) {
            for (let i = this._deployables.length - 1; i >= 0; i--) {
                const d = this._deployables[i];
                if (d.owner === this.player) {
                    if (d.mesh) this.world.obstacles?.removeCollisionForMesh?.(d.mesh);
                    if (d.mesh) this._disposeObject3D(d.mesh);
                    this._deployables.splice(i, 1);
                }
            }
        }

        // 在基地重生
        const spawnPos = this.world.getTeamSpawnPoint
            ? this.world.getTeamSpawnPoint(this.player.team)
            : new THREE.Vector3(-95, 0, -95);
        spawnPos.y = this.world.getHeight(spawnPos.x, spawnPos.z);
        this.player.spawn(spawnPos, classConfig);
        this.player.applyClassConfig?.(classType, classConfig, { preserveVitals: false });

        // 重置武器
        if (this.weaponSystem) {
            this.weaponSystem.loadWeapons([loadout.primary, loadout.secondary], loadout.optic);
            this.weaponSystem.grenadeCount = classConfig.grenadeMax || 3;
        }

        // 重置近战/处决和飞行中特殊投射物
        this._meleeActive = false;
        this._meleeCooldown = 0;
        if (this.player) this.player._meleeLock = false;
        if (this._pendingProjectiles) {
            for (const p of this._pendingProjectiles) {
                if (p.owner !== this.player) continue;
                if (p.mesh) this._disposeObject3D(p.mesh);
            }
            this._pendingProjectiles = this._pendingProjectiles.filter(p => p.owner !== this.player);
        }

        this.hud.hideDeath?.();
        this.hud.hideDeployScreen?.();
        this.hud.hideDownedOverlay?.();
        this.hud.hideVehicleUI?.();
        this.hud.showNotification?.(`已更换兵种：${classConfig.name}`, 2);
        this.state = 'playing';
        this.hud.show();
        this.input.showMobileControls(true);
        if (!this.input.isMobile) this.input.requestLock(this.renderer.domElement);
    }

    pauseGame() {
        if (this.state !== 'playing') return;
        this.fortifications?.cancel();
        this.state = 'paused';
        if (!this.input.isMobile) this.input.exitLock();
        this.input.showMobileControls(false);
        this.menu.show('pause');
    }

    resumeGame() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        this.hud.show();
        if (!this.input.isMobile) {
            this.input.requestLock(this.renderer.domElement);
        }
        this.input.showMobileControls(true);
    }

    quitGame() {
        this.state = 'menu';
        this.director?.dispose();
        this.director = null;
        this._directorSmokeZones.length = 0;
        this._directorRally = null;
        this._supportPanelOpen = false;
        this.hud?.hideSupportPanel?.();
        this.hud?.clearDirector?.();
        this.transientFx?.clear();
        if (this.audio?.stopBattlefieldAmbience) {
            this.audio.stopBattlefieldAmbience();
        }
        this.hud.hide();
        this.hud.hideCompass();
        this.hud.clearWorldMarkers();
        this.input.showMobileControls(false);

        // 完整释放武器资源
        if (this.weaponSystem?.dispose) {
            this.weaponSystem.dispose();
        }
        this.weaponSystem = null;
        if (this._executionKnife) {
            this.camera.remove(this._executionKnife);
            this._disposeObject3D(this._executionKnife);
            this._executionKnife = null;
        }
        // 清理相机下残留
        while (this.camera.children.length > 0) {
            const child = this.camera.children[0];
            this.camera.remove(child);
            this._disposeObject3D(child);
        }

        if (this.fortifications) {
            this.fortifications.dispose();
            this.fortifications = null;
        }
        if (this.destructibles) {
            this.destructibles.dispose?.();
            this.destructibles = null;
        }

        // bots / vehicles
        for (const bot of this.bots || []) {
            if (bot._respawnHandle) {
                clearTimeout(bot._respawnHandle);
                bot._respawnHandle = null;
            }
            if (bot.dispose) bot.dispose();
            else if (bot.model) this._disposeObject3D(bot.model);
        }
        this.bots = [];
        this._clearAIGrenades();
        for (const vehicle of this.vehicles || []) {
            vehicle._stopEngineSound?.();
            vehicle.dispose?.();
        }
        this.vehicles = [];
        this.scene.userData.vehicles = [];
        this._resetStrategicObjectives();
        this._resetStrategicEffects();
        this._vehicleRespawns.length = 0;
        this._battlefieldReleased = true;
        this._vehicleAiAssignments?.clear?.();
        this.player = null;
        this._executing = null;

        this.menu.show('mainMenu');
    }

    _spawnBots() {
        const botNames = [
            'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot',
            'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima',
        ];
        const classes = ['assault', 'medic', 'engineer', 'sniper'];

        // 我方AI
        const friendlyBase = this.world.getTeamSpawnPoint ? this.world.getTeamSpawnPoint(0) : new THREE.Vector3(-95, 0, -95);
        const friendlyCount = CONFIG.AI.count;
        for (let i = 0; i < friendlyCount; i++) {
            const classType = classes[i % classes.length];
            const bot = new Bot(this.scene, this.world, this.audio, 0, classType, botNames[i]);
            const spawnPos = this._spreadSpawnPosition(friendlyBase, i, friendlyCount);
            bot.spawn(spawnPos);
            this.bots.push(bot);
        }

        // 敌方AI
        const enemyBase = this.world.getTeamSpawnPoint ? this.world.getTeamSpawnPoint(1) : new THREE.Vector3(95, 0, 95);
        const enemyCount = CONFIG.AI.count;
        for (let i = 0; i < enemyCount; i++) {
            const classType = classes[i % classes.length];
            const bot = new Bot(this.scene, this.world, this.audio, 1, classType, '敌方-' + botNames[i]);
            const spawnPos = this._spreadSpawnPosition(enemyBase, i, enemyCount);
            bot.spawn(spawnPos);
            this.bots.push(bot);
        }
    }

    // 环形分散出生点，避免开局 NPC 堆叠穿插、视觉上原地乱动
    _spreadSpawnPosition(base, index, total) {
        const radius = Math.max(4, Math.min(14, total * 1.1));
        const angle = (index / total) * Math.PI * 2;
        const pos = new THREE.Vector3(
            base.x + Math.cos(angle) * radius + (Math.random() - 0.5) * 1.5,
            0,
            base.z + Math.sin(angle) * radius + (Math.random() - 0.5) * 1.5
        );
        pos.y = this.world.getHeight(pos.x, pos.z);
        return pos;
    }

    // 组建AI小队
    _setupSquads() {
        const squadSize = CONFIG.AI.squadSize || 4;
        // 按队伍分组
        for (let team = 0; team <= 1; team++) {
            const teamBots = this.bots.filter(b => b.team === team);
            // 每 squadSize 人一组
            for (let i = 0; i < teamBots.length; i += squadSize) {
                const squad = teamBots.slice(i, i + squadSize);
                const leader = squad[0];
                const squadId = team * 100 + Math.floor(i / squadSize);
                for (const member of squad) {
                    member.setSquad(squadId, leader, squad);
                }
            }
        }
        // 玩家加入友方第一小队
        if (this.player) {
            const alpha = this.bots.filter(b => b.team === 0 && b.squadId === 0);
            this.player.squadId = 0;
            this.player.squadLeader = alpha[0] || null;
            this.player.squadMembers = alpha;
            for (const m of alpha) {
                if (!m.squadMembers) m.squadMembers = [];
                if (!m.squadMembers.includes(this.player)) m.squadMembers.push(this.player);
            }
        }
    }

    _spawnVehicles() {
        for (const spawn of this.world.vehicleSpawns) {
            const vehicle = new Vehicle(this.scene, this.world, this.audio, spawn.type, spawn.team);
            vehicle.spawnConfig = { ...spawn };
            vehicle.place(spawn.x, spawn.z, spawn.yaw || 0);
            vehicle.onFireCannon = (muzzle, direction, damage, range, options = {}, targetPoint = null) => {
                this._onVehicleFire(vehicle, muzzle, direction, damage, range, options, targetPoint);
            };
            vehicle.onDestroyed = (position, radius, damage, sourceVehicle, attacker = null) => {
                const source = attacker || sourceVehicle;
                this._onExplosion(position, radius, damage, source.team ?? sourceVehicle.team, source, true);
            };
            this.vehicles.push(vehicle);
        }
        // 注册载具到场景，供AI工程兵查找
        this.scene.userData.vehicles = this.vehicles;
    }

    _restoreVehicle(vehicle, spawn = vehicle.spawnConfig) {
        if (!spawn) return;
        this.transientFx?.cancelOwner(vehicle);
        vehicle._stopEngineSound?.();
        for (let i = 0; i < vehicle.occupants.length; i++) {
            if (vehicle.occupants[i]) {
                this._releaseVehicleOccupant(vehicle.occupants[i]);
                vehicle.occupants[i] = null;
            }
        }
        vehicle.health = vehicle.config.maxHealth;
        vehicle.alive = true;
        vehicle.velocity = 0;
        vehicle.lateralVelocity = 0;
        vehicle.verticalVelocity = 0;
        vehicle.pitchAngle = 0;
        vehicle.rollAngle = 0;
        vehicle._crashing = false;
        vehicle._crashFinalized = false;
        if (vehicle._crashVelocity) vehicle._crashVelocity.set(0, 0, 0);
        if (vehicle._crashAngularVelocity) vehicle._crashAngularVelocity.set(0, 0, 0);
        vehicle._crashSmokeTimer = 0;
        vehicle._fpViewActive = false;
        vehicle.cannonCooldown = 0;
        vehicle.secondaryCooldown = 0;
        vehicle._turretRecoilTimer = 0;
        vehicle._turretRecoilOffset = 0;
        vehicle._damageSpeedMult = 1;
        vehicle._hitShake = 0;
        vehicle._hasDetachedPart = false;
        vehicle._detachedParts = [];
        // 清理损伤特效引用
        if (vehicle._damageSmoke) {
            if (vehicle.model) vehicle.model.remove(vehicle._damageSmoke);
            vehicle._disposePersistentFxGroup?.(vehicle._damageSmoke);
            vehicle._damageSmoke = null;
        }
        if (vehicle._damageFire) {
            if (vehicle.model) vehicle.model.remove(vehicle._damageFire);
            vehicle._disposePersistentFxGroup?.(vehicle._damageFire);
            vehicle._damageFire = null;
        }
        if (vehicle._damageLight) {
            if (vehicle.model) vehicle.model.remove(vehicle._damageLight);
            vehicle._damageLight = null;
        }
        if (vehicle.model) {
            this.scene.remove(vehicle.model);
            // 必须 dispose，否则载具反复重生泄漏 GPU 资源
            this._disposeObject3D(vehicle.model);
            vehicle.model = null;
        }
        vehicle.model = vehicle._buildModel();
        // 旧模型已通过 _disposeObject3D 释放（黑化克隆材质无共享标记），清空引用
        vehicle._blackenedMaterials = [];
        this.scene.add(vehicle.model);
        this._applyObjectShadows(vehicle.model);
        vehicle._collectFirstPersonHideMeshes();
        vehicle.place(spawn.x, spawn.z, spawn.yaw || 0);
        this._vehicleAiAssignments.delete(vehicle);
    }

    _onKeyDown(code, e) {
        if (this.state !== 'playing') return;

        // 迫击炮地图选点模式：Esc / 5 关闭；其余键忽略
        if (this._mortarMapOpen) {
            if (code === 'Escape' || code === 'Digit5') this._closeMortarMap();
            return;
        }

        // 防空炮炮手模式：只允许 F（离开）、Esc（暂停）、Tab（得分板）
        if (this.player.inStaticGun) {
            if (code === 'KeyF') this._handleInteraction();
            else if (code === 'Escape') this.pauseGame();
            else if (code === 'Tab') {
                e.preventDefault();
                this.hud.toggleScoreboard(true);
            }
            return;
        }

        if (this.fortifications?.handleKeyDown(code)) return;

        if (code === 'KeyB') {
            this._toggleSupportPanel();
            return;
        }
        if (this._supportPanelOpen && ['Digit1', 'Digit2', 'Digit3'].includes(code)) {
            const types = { Digit1: 'smoke', Digit2: 'supply', Digit3: 'rally' };
            this._requestDirectorSupport(types[code]);
            return;
        }

        // 武器切换
        if (code === 'Digit1' && this.weaponSystem) this.weaponSystem.switchWeapon(0);
        if (code === 'Digit2' && this.weaponSystem) this.weaponSystem.switchWeapon(1);

        // 兵种技能/装备 (3键)
        if (code === 'Digit3') {
            this._useGadget();
        }

        // 特殊装备 (5键)：刺雷/地雷/防空炮/沙袋
        if (code === 'Digit5') {
            this._useSpecial();
        }

        // 换弹
        if (code === 'KeyR' && this.weaponSystem) this.weaponSystem.reload();

        // 切换火力模式
        if (code === 'KeyX' && this.weaponSystem && !this.player.inVehicle) {
            const modeLabel = this.weaponSystem.toggleFireMode();
            if (modeLabel && this.hud) {
                this.hud.showNotification(`火力模式: ${modeLabel}`, 1.0);
            }
        }

        // 投掷手雷 - 根据视角/准心指向决定抛物线方向和力度
        if (code === 'KeyG' && this.weaponSystem) {
            if (this.weaponSystem.grenadeCount > 0 && this.grenadeThrowCooldown <= 0) {
                // 使用相机朝向（包含俯仰角），让手榴弹跟随准心指向
                const camDir = new THREE.Vector3();
                this.camera.getWorldDirection(camDir);
                // 限制最大仰角避免投得太高（不超过55度），最低允许向下投
                const maxUp = Math.sin(55 * Math.PI / 180);  // ≈ 0.819
                if (camDir.y > maxUp) camDir.y = maxUp;
                if (camDir.y < -0.6) camDir.y = -0.6;
                camDir.normalize();

                const throwPos = this.player.position.clone();
                throwPos.y += 1.5;
                // 投掷力度根据准心仰角微调：看高处力度稍大
                const throwForce = 18 + Math.max(0, camDir.y) * 6;
                this.weaponSystem.throwGrenade(throwPos, camDir, throwForce);

                // 显示手持手雷并播放投掷挥臂动画
                this.weaponSystem.showHeldGrenade(true);
                this.weaponSystem.playThrowAnimation();

                this.grenadeThrowCooldown = 2.0;
            }
        }

        // 互动
        if (code === 'KeyF') {
            this._handleInteraction();
        }

        // 拖拽倒地队友（战地5动作系统：KeyE 开始/停止拖拽）
        if (code === 'KeyE') {
            this._handleDragToggle();
        }

        if (code === 'KeyT') {
            this._spotTargetFromCrosshair();
        }

        // 切换载具视角（V键）
        if (code === 'KeyV' && this.player.inVehicle) {
            this.player.toggleVehicleView();
        }

        // 切换载具座位（C键）
        if (code === 'KeyC' && this.player.inVehicle) {
            this._switchVehicleSeat();
        }

        // 得分板
        if (code === 'Tab') {
            e.preventDefault();
            this.hud.toggleScoreboard(true);
        }

        // 暂停
        if (code === 'Escape') {
            if (this._supportPanelOpen) this._toggleSupportPanel(false);
            else this.pauseGame();
        }
    }

    _toggleSupportPanel(force = null) {
        this._supportPanelOpen = force == null ? !this._supportPanelOpen : !!force;
        if (this._supportPanelOpen) this.hud.showSupportPanel?.(this.director?.getHUDData());
        else this.hud.hideSupportPanel?.();
    }

    _requestDirectorSupport(type) {
        if (!this.director) return;
        const target = this._getDirectorSupportTarget(type);
        const result = this.director.requestSupport(type, target);
        this.hud.showNotification?.(result.ok ? '战术支援已确认' : result.reason, result.ok ? 2 : 1.6);
        if (result.ok) this._toggleSupportPanel(false);
        else this.hud.showSupportPanel?.(this.director.getHUDData());
    }

    _getDirectorSupportTarget(type) {
        if (type === 'rally') {
            this._supportTarget.copy(this.player.position);
            this._supportTarget.y = this.world.getHeight(this._supportTarget.x, this._supportTarget.z);
            return this._supportTarget;
        }
        this.camera.getWorldDirection(this._supportDirection);
        this._supportRaycaster.set(this.camera.position, this._supportDirection);
        this._supportRaycaster.near = 1;
        this._supportRaycaster.far = CONFIG.BATTLEFIELD_DIRECTOR.support.maxTargetDistance;
        const hits = this._supportRaycaster.intersectObjects(this.world.getShootableMeshes(), true);
        if (hits.length) return this._supportTarget.copy(hits[0].point);
        this._supportTarget.copy(this.camera.position).addScaledVector(this._supportDirection, 70);
        this._supportTarget.y = this.world.getHeight(this._supportTarget.x, this._supportTarget.z);
        return this._supportTarget;
    }

    _handleInteraction() {
        // 防空炮炮手模式：F 离开
        if (this.player.inStaticGun) {
            this._exitStaticGun();
            return;
        }
        if (this.player.inVehicle) {
            // 离开载具
            const vehicle = this.player.inVehicle;
            const seat = this.player.vehicleSeat;
            vehicle.exit(seat);
            this.player.exitVehicle();
            this.hud.hideVehicleUI();
            return;
        }

        // 进入载具
        if (this.nearbyReviveTarget) {
            this._reviveBot(this.nearbyReviveTarget, this.player);
            // 若正在拖拽该目标，复活后停止拖拽
            if (this.player.isDragging()) this.player._stopDrag();
            return;
        }

        // 正在拖拽时，按 F 直接尝试复活被拖拽的队友
        if (this.player.isDragging() && this.player._draggingBot) {
            const dragged = this.player._draggingBot;
            if (this._canPlayerRevive(dragged)) {
                this._reviveBot(dragged, this.player);
                this.player._stopDrag();
                return;
            }
        }

        // 处决倒地敌人
        if (this.nearbyExecuteTarget && !this._executing) {
            this._startExecution(this.nearbyExecuteTarget);
            return;
        }

        if (this.nearbyVehicle) {
            const seat = this.nearbyVehicle.getAvailableSeat();
            if (seat >= 0) {
                this.nearbyVehicle.enter(this.player, seat);
                this.player.enterVehicle(this.nearbyVehicle, seat, this.baseFov);
                this.hud.updateVehicle(this.nearbyVehicle.getState(), seat);
                // 显示载具准星（只有驾驶座且有武器才显示）
                this.hud.showVehicleCrosshair(this.nearbyVehicle.config.hasWeapon && seat === 0);
            }
            return;
        }

        // 进入固定防空炮台
        if (this.nearbyStaticGun) {
            this._enterStaticGun(this.nearbyStaticGun);
            return;
        }

        // 无交互目标：近战攻击
        this._tryMeleeAttack();
    }

    // === 固定防空炮台（地图自带，玩家可进入操作）===
    _enterStaticGun(gun) {
        if (!gun || !gun.alive) return;
        // 退出载具（若在车内）
        if (this.player.inVehicle) {
            const v = this.player.inVehicle;
            const seat = this.player.vehicleSeat;
            v.exit?.(seat);
            this.player.exitVehicle?.();
            this.hud.hideVehicleUI?.();
        }
        this.player.inStaticGun = gun;
        // 隐藏玩家模型
        if (this.player.model) this.player.model.visible = false;
        this._playerModelWasVisible = true;
        // 锁定到炮位
        this.player.position.copy(gun.position);
        this.player.position.y += 1.0;
        // 视角朝向炮管默认方向（保留玩家原朝向，但先对齐 yaw 到炮台朝向）
        this.player.yaw = gun.yaw;
        this.player.pitch = 0;
        this.hud.hideVehicleUI?.();
        this.hud.showNotification?.('按 F 离开防空炮', 3);
        if (this.audio?.playUISound) this.audio.playUISound('click');
    }

    _exitStaticGun() {
        const gun = this.player.inStaticGun;
        if (!gun) return;
        this.player.inStaticGun = null;
        // 恢复玩家模型
        if (this.player.model) this.player.model.visible = true;
        // 放到炮台旁
        const exitPos = gun.position.clone();
        exitPos.x += 2;
        exitPos.z += 1;
        exitPos.y = this.world.getHeight(exitPos.x, exitPos.z);
        this.player.position.copy(exitPos);
        if (this.hud.showInteraction) this.hud.hideInteraction();
        if (this.audio?.playUISound) this.audio.playUISound('click');
    }

    _updateStaticGuns(dt) {
        const gun = this.player.inStaticGun;
        if (!gun || !gun.alive) return;

        // 炮塔跟随玩家视角（由 PlayerController._updateLook 驱动的 yaw/pitch）
        gun.yaw = this.player.yaw;
        gun.pitch = this.player.pitch;

        // 旋转炮塔 mesh（炮管默认朝 -Z，yaw 绕 Y）
        if (gun.turretGroup) {
            gun.turretGroup.rotation.y = gun.yaw;
            gun.turretGroup.rotation.x = -Math.max(-0.1, Math.min(1.0, gun.pitch));
        }

        // 相机锁定在炮位（炮手眼位），朝向 = 玩家视角
        const camPos = gun.position.clone();
        camPos.y += 1.55;
        this.camera.position.copy(camPos);
        this.camera.quaternion.setFromEuler(new THREE.Euler(this.player.pitch, this.player.yaw, 0, 'YXZ'));

        // 更新炮口方向与位置
        const eyeDir = new THREE.Vector3(
            -Math.sin(this.player.yaw) * Math.cos(this.player.pitch),
            Math.sin(this.player.pitch),
            -Math.cos(this.player.yaw) * Math.cos(this.player.pitch)
        );
        if (gun.muzzle) gun.muzzle.copy(camPos).addScaledVector(eyeDir, 0.6);

        // 开火（左键持续）
        gun.cooldown = Math.max(0, (gun.cooldown || 0) - dt);
        if (this.input.isMouseDown(0) && gun.cooldown <= 0) {
            gun.cooldown = 60 / (gun.fireRate || 200);
            this._fireStaticGun(gun, eyeDir);
        }
    }

    _fireStaticGun(gun, direction) {
        const muzzle = gun.muzzle || gun.position.clone().add(new THREE.Vector3(0, 1.4, 0));
        const range = gun.range || 220;
        const raycaster = new THREE.Raycaster(muzzle, direction, 0.5, range);

        // 命中敌方载具
        let hitVehicle = null;
        let hitDist = Infinity;
        for (const v of this.vehicles) {
            if (!v.alive || v.team === gun.team) continue;
            const hits = raycaster.intersectObject(v.model, true);
            if (hits.length > 0 && hits[0].distance < hitDist) {
                hitDist = hits[0].distance;
                hitVehicle = v;
            }
        }
        // 命中敌方角色
        let hitBot = null;
        for (const bot of this.bots) {
            if (!bot.alive || bot.team === gun.team) continue;
            const hits = raycaster.intersectObject(bot.model, true);
            if (hits.length > 0 && hits[0].distance < hitDist) {
                hitDist = hits[0].distance;
                hitBot = bot;
                hitVehicle = null;
            }
        }

        // 曳光弹道
        const endPoint = muzzle.clone().addScaledVector(direction, hitDist !== Infinity ? hitDist : range);
        if (this.weaponSystem?._createTracer) {
            this.weaponSystem._createTracer(muzzle.clone(), endPoint, 0xffcc44, 0.8);
        }
        if (this.audio?.playHitMarker) this.audio.playHitMarker(false, false);

        if (hitVehicle) {
            const killed = hitVehicle.takeDamage(gun.damage, null, this.player);
            if (killed && gun.team === 0 && hitVehicle.team !== 0) {
                this._handleFriendlyKill(hitVehicle, '防空炮', this.player);
            }
            this._onExplosion(endPoint, 3, gun.damage * 0.3, gun.team, this.player, true);
        } else if (hitBot) {
            const wasDowned = !!hitBot.downed;
            const killed = hitBot.takeDamage(gun.damage, this.player, muzzle);
            if (this.player && this.player.team !== hitBot.team) {
                this._recordPlayerDamageContribution(hitBot, gun.damage);
            }
            if (killed) {
                this._handleFriendlyKill(hitBot, '防空炮', this.player);
            } else if (!wasDowned && hitBot.downed) {
                this.hud.addKillMessage?.('你', hitBot.name, '防空炮', {
                    isPlayerKill: true, isDown: true, killerTeam: 0, victimTeam: hitBot.team, showConfirm: true, scoreText: '击倒',
                });
            }
        }
    }

    // 近战攻击（F 键，无上车/救人/处决目标时）
    _tryMeleeAttack() {
        if (!this.player?.alive || this.player.downed || this.player.inVehicle || this.player.inStaticGun) return false;
        if (this._executing || this.player._executionLock) return false;
        if (this._meleeActive) return false;
        if ((this._meleeCooldown || 0) > 0) return false;

        this._meleeActive = true;
        this._meleeTimer = 0;
        this._meleeHitApplied = false;
        this._meleeCooldown = CONFIG.PLAYER.meleeCooldown || 0.55;
        this.player._meleeLock = true;

        // 亮出匕首，隐藏枪
        const knife = this._getExecutionKnife();
        if (knife) {
            knife.visible = true;
            knife.position.set(0.42, -0.38, -0.35);
            knife.rotation.set(0.35, 0.55, 0.25);
        }
        if (this.weaponSystem?.hideWeapon) this.weaponSystem.hideWeapon(true);
        else if (this.weaponSystem?.weaponGroup) this.weaponSystem.weaponGroup.visible = false;

        if (this.audio?.playUISound) this.audio.playUISound('click');
        return true;
    }

    _updateMelee(dt) {
        if (this._meleeCooldown > 0) this._meleeCooldown -= dt;
        if (!this._meleeActive) return;

        const duration = CONFIG.PLAYER.meleeDuration || 0.42;
        const hitTime = CONFIG.PLAYER.meleeHitTime || 0.18;
        this._meleeTimer += dt;
        const p = Math.min(1, this._meleeTimer / duration);

        const knife = this._executionKnife;
        if (knife) {
            knife.visible = true;
            // 五段：收刀 → 后拉蓄力 → 横斩 → 回收 → 收起
            if (p < 0.18) {
                const e = p / 0.18;
                knife.position.set(0.42 - e * 0.12, -0.38 + e * 0.08, -0.35 - e * 0.05);
                knife.rotation.set(0.35 + e * 0.4, 0.55 - e * 0.15, 0.25 + e * 0.5);
            } else if (p < 0.42) {
                const e = (p - 0.18) / 0.24;
                knife.position.set(0.30 - e * 0.55, -0.30 + e * 0.35, -0.40 - e * 0.15);
                knife.rotation.set(0.75 - e * 0.9, 0.40 - e * 0.55, 0.75 - e * 1.4);
            } else if (p < 0.72) {
                const e = (p - 0.42) / 0.30;
                knife.position.set(-0.25 + e * 0.35, 0.05 - e * 0.25, -0.55 + e * 0.15);
                knife.rotation.set(-0.15 + e * 0.4, -0.15 + e * 0.3, -0.65 + e * 0.5);
            } else {
                const e = (p - 0.72) / 0.28;
                knife.position.set(0.10 + e * 0.32, -0.20 - e * 0.18, -0.40 + e * 0.05);
                knife.rotation.set(0.25 + e * 0.1, 0.15 + e * 0.4, -0.15 + e * 0.4);
            }
        }

        // 命中判定
        if (!this._meleeHitApplied && this._meleeTimer >= hitTime) {
            this._meleeHitApplied = true;
            this._applyMeleeHit();
        }

        if (p >= 1) {
            this._meleeActive = false;
            this.player._meleeLock = false;
            if (this._executionKnife) this._executionKnife.visible = false;
            // 恢复枪（非载具/非处决时）
            if (this.weaponSystem?.weaponGroup && this.player.alive && !this.player.inVehicle && !this._executing) {
                if (this.weaponSystem.hideWeapon) this.weaponSystem.hideWeapon(false);
                else this.weaponSystem.weaponGroup.visible = true;
            }
        }
    }

    _applyMeleeHit() {
        if (!this.player?.alive) return;
        const range = CONFIG.PLAYER.meleeRange || 2.35;
        const halfAngle = CONFIG.PLAYER.meleeAngle || 0.95;
        const damage = CONFIG.PLAYER.meleeDamage || 55;
        const origin = this.player.position.clone();
        origin.y += 1.2;

        // 相机前向（水平为主）
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        if (forward.lengthSq() < 1e-6) {
            forward.set(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
        }
        forward.normalize();

        let hitSomething = false;
        // 打 AI
        for (const bot of this.bots) {
            if (!bot || bot.team === this.player.team) continue;
            if (!bot.alive && !bot.downed) continue;
            if (bot._assignedVehicle) continue;
            const to = bot.position.clone().sub(this.player.position);
            to.y = 0;
            const dist = to.length();
            if (dist > range || dist < 0.05) continue;
            to.normalize();
            if (forward.dot(to) < Math.cos(halfAngle)) continue;

            const wasDowned = !!bot.downed;
            bot._lastHitWasHeadshot = false;
            const killed = bot.takeDamage(damage, this.player, this.player.position);
            this._recordPlayerDamageContribution(bot, damage);
            hitSomething = true;
            this.hud.showHitMarker(killed || (!wasDowned && bot.downed), false);
            if (this.audio) {
                if (killed) this.audio.playHitConfirm?.();
                else this.audio.playHitMarker?.(false, false);
            }
            if (!killed && bot.downed && !wasDowned) {
                this.hud.addKillMessage('你', bot.name, '近战', {
                    isPlayerKill: true,
                    isDown: true,
                    killerTeam: 0,
                    victimTeam: bot.team,
                    showConfirm: true,
                    scoreText: '击倒',
                });
            } else if (killed) {
                this._onPlayerKill(bot, '近战', false);
            }
            break; // 单次只打一个
        }

        // 近战对载具无效（装甲），仅给出未穿透反馈
        if (!hitSomething) {
            for (const vehicle of this.vehicles) {
                if (!vehicle?.alive || vehicle.team === this.player.team) continue;
                const dist = this.player.position.distanceTo(vehicle.position);
                if (dist > range + 1.2) continue;
                const to = vehicle.position.clone().sub(this.player.position);
                to.y = 0;
                if (to.lengthSq() < 1e-4) continue;
                to.normalize();
                if (forward.dot(to) < Math.cos(halfAngle)) continue;
                if (vehicle.takeDamage) {
                    vehicle.takeDamage(damage, null, this.player, { damageType: 'melee' });
                    hitSomething = true;
                    this.hud.showHitMarker(false, false);
                }
                break;
            }
        }

        // 打碎近处玻璃
        if (this.world?.findBreakableGlassNear) {
            const glass = this.world.findBreakableGlassNear(origin, forward, range);
            if (glass?.mesh) {
                this.world.breakGlass(glass.mesh, glass.point);
                hitSomething = true;
            }
        }

        if (hitSomething) {
            this.player.addShake?.(0.12);
        } else {
            this.player.addShake?.(0.05);
        }
    }

    // 拖拽倒地队友切换（战地5动作系统）
    // 按下 KeyE：若正在拖拽则停止；否则尝试抓住附近的倒地队友
    _handleDragToggle() {
        if (!this.player?.alive || this.player.inVehicle) return;
        if (this.player.downed) return;

        // 正在拖拽 → 停止
        if (this.player.isDragging()) {
            this.player._stopDrag();
            if (this.hud?.showNotification) this.hud.showNotification('已放下队友', 1.5);
            if (this.audio?.playUISound) this.audio.playUISound('click');
            return;
        }

        // 尝试开始拖拽
        const target = this.nearbyDragTarget || this.nearbyReviveTarget;
        if (!target) {
            if (this.hud?.showNotification) this.hud.showNotification('附近没有可拖拽的倒地队友', 1.5);
            return;
        }
        // 仅可拖拽倒地状态（非彻底死亡）
        if (target.alive || !target.downed) return;
        if (target.team !== this.player.team) return;

        if (this.player._startDrag(target)) {
            if (this.hud?.showNotification) this.hud.showNotification('正在拖拽队友（按 E 放下）', 2.5);
            if (this.audio?.playUISound) this.audio.playUISound('click');
        }
    }

    // 查找附近可拖拽的倒地队友（任何队友均可拖拽，不限于小队/医疗兵）
    _findNearbyDraggableBot(position, team) {
        if (!position || !this.player?.alive) return null;
        const range = CONFIG.GAME.reviveRange || 3;
        let best = null;
        let bestDist = range;
        for (const bot of this.bots) {
            if (!bot || bot.alive || bot.team !== team) continue;
            if (!bot.downed) continue;   // 仅拖拽倒地状态（非彻底死亡）
            if (bot._assignedVehicle) continue;
            const dist = bot.position.distanceTo(position);
            if (dist < bestDist) {
                bestDist = dist;
                best = bot;
            }
        }
        return best;
    }

    _switchVehicleSeat() {
        const vehicle = this.player.inVehicle;
        if (!vehicle) return;
        const currentSeat = this.player.vehicleSeat;
        vehicle.exit(currentSeat);

        let nextSeat = -1;
        for (let offset = 1; offset <= vehicle.config.seats; offset++) {
            const candidate = (currentSeat + offset) % vehicle.config.seats;
            if (vehicle.occupants[candidate] === null) {
                nextSeat = candidate;
                break;
            }
        }

        if (nextSeat >= 0) {
            vehicle.enter(this.player, nextSeat);
            this.player.vehicleSeat = nextSeat;
            // 换到非驾驶位时强制第一人称（战地乘员位），航空载具除外
            if (nextSeat !== 0 && !vehicle.config?.isAircraft) {
                this.player.vehicleThirdPerson = false;
                this.player._vehicleLookYaw = 0;
                this.player._vehicleLookPitch = 0;
            } else if (vehicle.config?.isAircraft) {
                this.player.vehicleThirdPerson = true;
            }
            this.hud.updateVehicle(vehicle.getState(), nextSeat);
            // 更新载具准星显示（只有驾驶座且有武器才显示）
            this.hud.showVehicleCrosshair(vehicle.config.hasWeapon && nextSeat === 0);
        } else {
            // 座位被占，回退
            vehicle.enter(this.player, currentSeat);
        }
    }

    // === 特殊装备系统（刺雷/反坦克地雷/迫击炮/沙袋）===
    _useSpecial() {
        if (!this.player?.alive || this.player.downed || this.player.inVehicle || this.player.inStaticGun) return;
        // 冲锋中不能再用
        if (this._banzaiActive) return;
        const specialId = this.player.classConfig?.special;
        if (!specialId) {
            this.hud.showNotification?.('该兵种没有特殊装备', 1.2);
            return;
        }
        const cfg = CONFIG.SPECIALS?.[specialId];
        if (!cfg) return;
        if ((this._specialCooldown || 0) > 0) {
            this.hud.showNotification?.(`${cfg.name} 冷却中 ${Math.ceil(this._specialCooldown)}s`, 1);
            return;
        }

        let used = true;
        switch (cfg.type) {
            case 'charge': used = this._startBanzai(cfg); break;
            case 'mortar': used = this._deployMortar(cfg); break;
            case 'placeable': used = this._placeSpecial(cfg); break;
            default: used = false;
        }

        if (used && cfg.cooldown > 0 && cfg.type !== 'mortar') {
            this._specialCooldown = cfg.cooldown;
            this._specialMaxCooldown = cfg.cooldown;
        }
    }

    // === 刺雷冲锋（战地5刺雷：手持刺雷向前自动冲锋，撞到敌人/载具爆炸，自己也受重创）===
    _startBanzai(cfg) {
        if (!this.player?.alive || this.player.downed || this.player.inVehicle) return false;

        this._banzaiActive = true;
        this._banzaiTimer = cfg.chargeDuration || 2.2;
        this.player._banzaiCharge = true;
        this.player._banzaiSpeed = cfg.chargeSpeed || 12;
        // 冲锋方向 = 准心水平前向
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        dir.y = 0;
        if (dir.lengthSq() < 1e-4) dir.set(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
        dir.normalize();
        this.player._banzaiDir = dir;
        // 面向冲锋方向
        this.player.yaw = Math.atan2(-dir.x, -dir.z);

        // 隐藏武器，亮出刺雷（短刺锥）
        if (this.weaponSystem?.weaponGroup) this.weaponSystem.weaponGroup.visible = false;
        this._showBanzaiChargeModel();

        // 冲锋怒吼音效
        if (this.audio?.playUISound) this.audio.playUISound('charge');
        this.hud.showNotification?.('刺雷冲锋！', 1.2);
        return true;
    }

    _showBanzaiChargeModel() {
        if (!this._banzaiChargeModel) {
            const g = new THREE.Group();
            const mat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.4 });
            const matTip = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.3, metalness: 0.6 });
            // 手柄
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.28, 8), mat);
            handle.rotation.x = Math.PI / 2;
            handle.position.set(0.35, -0.25, -0.6);
            g.add(handle);
            // 弹头
            const head = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.4, 10), matTip);
            head.rotation.x = Math.PI / 2;
            head.position.set(0.35, -0.25, -0.95);
            g.add(head);
            this.camera.add(g);
            this._banzaiChargeModel = g;
        }
        this._banzaiChargeModel.visible = true;
    }

    _updateBanzai(dt) {
        if (!this._banzaiActive) return;
        this._banzaiTimer -= dt;
        const cfg = CONFIG.SPECIALS.hedgehog;
        const dir = this.player._banzaiDir;
        const origin = this.player.position.clone();
        origin.y += 1.2;

        // 检测前方撞击目标（距离 ~1.8m 内，方向对齐）
        let hitTarget = null;
        let hitVehicle = null;
        const maxReach = 2.0;
        for (const bot of this.bots) {
            if (!bot || bot.team === this.player.team) continue;
            if (!bot.alive && !bot.downed) continue;
            if (bot._assignedVehicle) continue;
            const to = bot.position.clone().sub(origin);
            const dist = to.length();
            if (dist > maxReach) continue;
            to.normalize();
            if (dir.dot(to) < 0.6) continue;
            hitTarget = bot;
            break;
        }
        if (!hitTarget) {
            for (const vehicle of this.vehicles) {
                if (!vehicle?.alive || vehicle.team === this.player.team) continue;
                const to = vehicle.position.clone().sub(origin);
                const dist = to.length();
                if (dist > maxReach + 1.2) continue;
                to.normalize();
                if (dir.dot(to) < 0.5) continue;
                hitVehicle = vehicle;
                break;
            }
        }

        // 撞到目标或超时 → 引爆（自己也受重创）
        if (hitTarget || hitVehicle || this._banzaiTimer <= 0) {
            this._endBanzai(true, hitTarget, hitVehicle);
        }
    }

    _endBanzai(detonate = false, hitTarget = null, hitVehicle = null) {
        this._banzaiActive = false;
        this.player._banzaiCharge = false;
        this.player._banzaiDir = null;
        if (this._banzaiChargeModel) this._banzaiChargeModel.visible = false;
        // 恢复武器（非载具/处决时）
        if (this.weaponSystem?.weaponGroup && this.player.alive && !this.player.inVehicle && !this._executing) {
            this.weaponSystem.weaponGroup.visible = true;
        }

        if (detonate) {
            const pos = this.player.position.clone();
            const cfg = CONFIG.SPECIALS.hedgehog;
            const bonus = 1 + (this.player.classConfig?.vehicleDamageBonus || 0);
            // 对目标与周围造成巨大爆炸，自己也受重创（战地5刺雷自杀式）
            this._onExplosion(pos, cfg.radius, cfg.damage * bonus, this.player.team, this.player, false, { antiVehicleMult: 1.0 });
            // 自己受伤（无视倒地保护，直接掉血）
            this._damagePlayer(cfg.selfDamage || 200, pos, null, false);
            if (this.player.addShake) this.player.addShake(0.7);
            if (this.audio?.playUISound) this.audio.playUISound('explosion');
            if (hitTarget) {
                this.hud.addKillMessage?.('你', hitTarget.name, '刺雷', {
                    isPlayerKill: true, killerTeam: 0, victimTeam: hitTarget.team, showConfirm: false,
                });
            }
        }
    }

    // === 迫击炮：部署在地上 + 地图选点打击 ===
    _deployMortar(cfg) {
        if (!this.player?.alive || this.player.downed || this.player.inVehicle || this.player.inStaticGun) return false;
        if (this._mortarActive) this._closeMortarMap();

        const pos = this.player.position.clone();
        pos.y = this.world.getHeight(pos.x, pos.z) + 0.05;
        const mesh = this._createMortarMesh(pos);
        this._mortarActive = {
            position: pos.clone(),
            mesh,
            ammo: cfg.ammo || 6,
            range: cfg.range || 90,
            minRange: 8,
            cfg,
        };

        // 退出指针锁定，让鼠标能点选地图
        if (!this.input.isMobile) this.input.exitLock();
        this.player._mortarLock = true;
        this.hud.showMortarMap(this._mortarActive.ammo);
        this.hud.setMortarClickCallback((px, py) => this._onMortarMapClick(px, py));
        this.hud.setMortarRedrawCallback(() => {
            if (this._mortarMapOpen) this._mortarMapTimer = 0;
        });
        this._mortarMapOpen = true;
        if (this.audio?.playUISound) this.audio.playUISound('click');
        this.hud.showNotification?.(`迫击炮已部署，点击地图选择打击区域`, 2.5);
        return true;
    }

    _createMortarMesh(pos) {
        const g = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.4 });
        const matDark = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.8 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.12, 12), matDark);
        base.position.y = 0.06;
        base.castShadow = true;
        g.add(base);
        // 底座支架
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), matDark);
        plate.position.y = 0.16;
        plate.castShadow = true;
        g.add(plate);
        // 炮管（倾斜朝上）
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 12), mat);
        barrel.position.set(0, 0.55, -0.15);
        barrel.rotation.x = 1.2;
        barrel.castShadow = true;
        g.add(barrel);
        g.position.copy(pos);
        this.scene.add(g);
        return g;
    }

    // 地图点击 → 换算世界坐标 → 发射
    _onMortarMapClick(px, py) {
        if (!this._mortarActive || !this._mortarMapOpen) return;
        const canvas = this.hud.elements.mortarMapCanvas;
        const worldSize = this.world.getMapSize ? this.world.getMapSize() : (this.world.mapConfig?.size || 400);
        const scale = canvas.width / worldSize;
        const x = px / scale - worldSize / 2;
        const z = py / scale - worldSize / 2;

        const mortar = this._mortarActive;
        const dx = x - mortar.position.x;
        const dz = z - mortar.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minRange = mortar.minRange || 8;
        const range = mortar.range || 90;
        if (dist < minRange) {
            this.hud.updateMortarTarget('距离太近，无法打击（≥ ' + Math.round(minRange) + 'm）');
            return;
        }
        if (dist > range) {
            this.hud.updateMortarTarget('超出射程（≤ ' + Math.round(range) + 'm）');
            return;
        }

        const target = new THREE.Vector3(x, this.world.getHeight(x, z), z);
        this._fireMortarShell(mortar, target);
    }

    _fireMortarShell(mortar, target) {
        if (!mortar || mortar.ammo <= 0) return;
        mortar.ammo--;
        this.hud.updateMortarAmmo(mortar.ammo);

        const startPos = mortar.position.clone();
        startPos.y += 0.7;
        const cfg = mortar.cfg;
        const owner = this.player;
        const team = owner.team;
        const flightTime = Math.min(1.6, Math.max(0.7, target.distanceTo(startPos) / 50));
        const projMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.7, roughness: 0.4 })
        );
        projMesh.position.copy(startPos);
        this.scene.add(projMesh);
        const ctrl = startPos.clone().lerp(target, 0.5);
        ctrl.y += (cfg.arc || 0.9) * Math.min(cfg.range || 90, 60) * 0.5;

        // 发射后跟随炮弹视角：隐藏选点地图，相机接管跟随炮弹，爆炸后回到地图/关闭
        this._mortarShellFollow = true;
        this._mortarShellTarget = target.clone();
        this.hud.hideMortarMap();

        this._pendingProjectiles = this._pendingProjectiles || [];
        this._pendingProjectiles.push({
            owner,
            mesh: projMesh,
            t: 0,
            duration: flightTime,
            from: startPos,
            to: target.clone(),
            ctrl,
            mortarFollow: true,
            onArrive: () => {
                if (projMesh.parent) this.scene.remove(projMesh);
                projMesh.geometry?.dispose?.();
                projMesh.material?.dispose?.();
                this._mortarShellFollow = false;
                this._onExplosion(target, cfg.radius, cfg.damage, team, owner, false, { antiVehicleMult: 0.8 });
                if (this.player.addShake && this.player.position.distanceTo(target) < cfg.radius * 3) {
                    this.player.addShake(0.25);
                }
                // 还有弹药 → 回到选点地图；耗尽 → 关闭
                setTimeout(() => {
                    if (this._mortarActive && this._mortarMapOpen) {
                        this.hud.showMortarMap(this._mortarActive.ammo);
                        this.hud.setMortarClickCallback((px, py) => this._onMortarMapClick(px, py));
                    } else if (!this._mortarActive) {
                        this._closeMortarMap();
                    }
                }, mortar.ammo > 0 ? 900 : 400);
            },
        });

        if (this.audio?.playUISound) this.audio.playUISound('mortar');
        // 弹药用尽自动关闭
        if (mortar.ammo <= 0) {
            this.hud.updateMortarTarget('弹药耗尽');
        }
    }

    // 迫击炮炮弹飞行/爆炸期间相机跟随
    _updateMortarShellCamera() {
        if (!this._mortarShellFollow || this._pendingProjectiles.length === 0) return;
        // 找在飞的迫击炮弹（最近的）
        let follow = null;
        for (const p of this._pendingProjectiles) {
            if (p.mortarFollow) { follow = p; break; }
        }
        if (!follow || !follow.mesh) return;
        const pos = follow.mesh.position;
        // 相机置于炮弹后方上方，看向炮弹/落点
        const toTarget = this._mortarShellTarget.clone().sub(pos);
        const dir = toTarget.lengthSq() > 0.001 ? toTarget.normalize() : new THREE.Vector3(0, 0, -1);
        const camPos = pos.clone().sub(dir.clone().multiplyScalar(4.5));
        camPos.y += 2.2;
        const groundY = this.world.getHeight(camPos.x, camPos.z);
        if (camPos.y < groundY + 1) camPos.y = groundY + 1;
        this.camera.position.lerp(camPos, 0.35);
        const lookAt = pos.clone();
        lookAt.y += 0.6;
        this.camera.lookAt(lookAt);
    }

    // 更新选点地图画面（节流 0.1s，避免每帧全量重绘 640x640）
    _updateMortarMap(dt) {
        if (!this._mortarMapOpen || !this._mortarActive) return;
        // 发射后跟随炮弹期间不重绘地图（相机在看炮弹）
        if (this._mortarShellFollow) return;
        this._mortarMapTimer = (this._mortarMapTimer || 0) - dt;
        if (this._mortarMapTimer > 0) return;
        this._mortarMapTimer = 0.1;
        const spotted = [];
        for (const bot of this.bots) {
            if (!bot.alive || bot.team === this.player.team) continue;
            if (!bot._spotted) continue;
            spotted.push({ x: bot.position.x, z: bot.position.z });
        }
        const mortarPos = this._mortarActive.position.clone();
        mortarPos.range = this._mortarActive.range || 90;
        mortarPos.minRange = this._mortarActive.minRange || 8;
        const worldSize = this.world.getMapSize ? this.world.getMapSize() : (this.world.mapConfig?.size || 400);
        this.hud.drawMortarMap(this.player.position, this.world.capturePoints, spotted, worldSize, mortarPos);
    }

    _closeMortarMap() {
        this._mortarMapOpen = false;
        this._mortarShellFollow = false;
        this._mortarShellTarget = null;
        this.player._mortarLock = false;
        this.hud.hideMortarMap();
        if (this._mortarActive?.mesh) this._disposeObject3D(this._mortarActive.mesh);
        this._mortarActive = null;
        // 恢复指针锁定
        if (this.state === 'playing' && !this.input.isMobile) {
            this.input.requestLock(this.renderer.domElement);
        }
        this._specialCooldown = CONFIG.SPECIALS?.mortar?.cooldown || 4;
        this._specialMaxCooldown = CONFIG.SPECIALS?.mortar?.cooldown || 4;
    }

    // 部署反坦克地雷 / 沙袋
    _placeSpecial(cfg) {
        const pos = this.player.position.clone();
        const groundY = this.world.getHeight(pos.x, pos.z);
        pos.y = groundY + 0.05;

        if (cfg.type === 'placeable' && cfg.antiVehicle) {
            // 限制同种活跃数量
            this._deployables = this._deployables || [];
            const active = this._deployables.filter(d => d.kind === 'atmine' && d.owner === this.player).length;
            const maxActive = cfg.maxActive || 3;
            if (active >= maxActive) {
                // 移除最旧的
                for (let i = 0; i < this._deployables.length && active >= maxActive; i++) {
                    const d = this._deployables[i];
                    if (d.kind === 'atmine' && d.owner === this.player) {
                        if (d.mesh) this._disposeObject3D(d.mesh);
                        this._deployables.splice(i, 1);
                        break;
                    }
                }
            }
            const mesh = this._createMineMesh(pos);
            this._deployables.push({
                kind: 'atmine',
                type: 'atmine',
                position: pos.clone(),
                radius: cfg.triggerRadius,
                damage: cfg.damage,
                blastRadius: cfg.radius,
                armingTime: cfg.armingTime,
                armingTimer: 0,
                team: this.player.team,
                owner: this.player,
                mesh,
            });
            this.hud.showNotification?.(`部署 ${cfg.name}`, 1.5);
        } else if (cfg.type === 'placeable') {
            // 沙袋掩体
            this._deployables = this._deployables || [];
            const active = this._deployables.filter(d => d.kind === 'sandbag' && d.owner === this.player).length;
            const maxActive = cfg.maxActive || 3;
            if (active >= maxActive) {
                for (let i = 0; i < this._deployables.length; i++) {
                    const d = this._deployables[i];
                    if (d.kind === 'sandbag' && d.owner === this.player) {
                        if (d.mesh) this.world.obstacles?.removeCollisionForMesh?.(d.mesh);
                        if (d.mesh) this._disposeObject3D(d.mesh);
                        this._deployables.splice(i, 1);
                        break;
                    }
                }
            }
            const mesh = this._createSandbagMesh(pos);
            const box = this.world.obstacles?.addCollisionBox?.(pos.x, pos.y, pos.z, 1.6, 1.0, 0.7, mesh, this.player.yaw);
            const d = {
                kind: 'sandbag',
                type: 'sandbag',
                position: pos.clone(),
                remainingTime: cfg.duration || 90,
                team: this.player.team,
                owner: this.player,
                mesh,
                collisionBox: box,
            };
            this._deployables.push(d);
            this.hud.showNotification?.(`部署 ${cfg.name}`, 1.5);
        }
        if (this.audio?.playUISound) this.audio.playUISound('click');
        return true;
    }

    // 部署防空炮（自动锁定空中载具射击）
    _deployFlakGun(cfg) {
        const pos = this.player.position.clone();
        const groundY = this.world.getHeight(pos.x, pos.z);
        pos.y = groundY;
        this._deployables = this._deployables || [];
        const existing = this._deployables.filter(d => d.kind === 'flakgun' && d.owner === this.player);
        if (existing.length >= (cfg.maxActive || 1)) {
            const oldest = existing[0];
            const idx = this._deployables.indexOf(oldest);
            if (oldest.mesh) this._disposeObject3D(oldest.mesh);
            if (idx >= 0) this._deployables.splice(idx, 1);
        }
        const mesh = this._createFlakGunMesh(pos);
        const d = {
            kind: 'flakgun',
            type: 'flakgun',
            position: pos.clone(),
            radius: cfg.range,
            damage: cfg.damage,
            fireRate: cfg.fireRate,
            antiAir: true,
            remainingTime: cfg.duration || 60,
            fireTimer: 0,
            team: this.player.team,
            owner: this.player,
            mesh,
            yaw: 0,
            _aimVector: new THREE.Vector3(),
            _tracerStart: new THREE.Vector3(),
            _tracerEnd: new THREE.Vector3(),
        };
        this._deployables.push(d);
        this.hud.showNotification?.(`部署 ${cfg.name}（自动锁定空中载具）`, 2);
        if (this.audio?.playUISound) this.audio.playUISound('click');
        return true;
    }

    _createMineMesh(pos) {
        const g = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.3 });
        const matTop = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.1, 16), mat);
        disc.position.y = 0.05;
        disc.castShadow = true;
        g.add(disc);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 12), matTop);
        top.position.y = 0.13;
        g.add(top);
        // 触压针
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6), matTop);
        pin.position.y = 0.21;
        g.add(pin);
        g.position.copy(pos);
        this.scene.add(g);
        return g;
    }

    _createSandbagMesh(pos) {
        const g = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x6b6048, roughness: 0.95 });
        // 三层沙袋堆
        for (let row = 0; row < 3; row++) {
            const count = 3;
            for (let i = 0; i < count; i++) {
                const bag = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.4), mat);
                bag.position.set((i - 1) * 0.5, 0.14 + row * 0.3, 0);
                bag.rotation.y = (Math.random() - 0.5) * 0.1;
                bag.castShadow = true;
                g.add(bag);
            }
        }
        g.position.copy(pos);
        g.rotation.y = this.player.yaw;
        this.scene.add(g);
        return g;
    }

    _createFlakGunMesh(pos) {
        const g = new THREE.Group();
        const matMetal = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5, metalness: 0.7 });
        const matDark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
        // 底座
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.25, 12), matDark);
        base.position.y = 0.12;
        base.castShadow = true;
        g.add(base);
        // 炮架
        const mount = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), matMetal);
        mount.position.y = 0.45;
        g.add(mount);
        // 双联炮管
        const barrelGroup = new THREE.Group();
        barrelGroup.position.y = 0.65;
        for (const sx of [-0.18, 0.18]) {
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 10), matMetal);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(sx, 0, -0.6);
            barrelGroup.add(barrel);
        }
        // 盾
        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.05), matDark);
        shield.position.set(0, 0.1, 0.1);
        barrelGroup.add(shield);
        g.userData.barrelGroup = barrelGroup;
        g.add(barrelGroup);
        g.position.copy(pos);
        this.scene.add(g);
        return g;
    }

    // 在 _updateDeployables 里处理地雷/防空炮/沙袋
    _updateSpecials(dt) {
        if (!this._deployables) return;
        for (let i = this._deployables.length - 1; i >= 0; i--) {
            const d = this._deployables[i];

            if (d.kind === 'atmine') {
                d.armingTimer = (d.armingTimer || 0) + dt;
                if (d.armingTimer < d.armingTime) continue;
                // 检查载具靠近
                for (const vehicle of this.vehicles) {
                    if (!vehicle.alive || vehicle.team === d.team) continue;
                    const dist = vehicle.position.distanceTo(d.position);
                    if (dist < d.radius + 1.2) {
                        // 引爆
                        const bonus = 1 + (d.owner?.classConfig?.vehicleDamageBonus || 0);
                        this._onExplosion(d.position.clone(), d.blastRadius, d.damage * bonus, d.team, d.owner, false);
                        if (d.mesh) this._disposeObject3D(d.mesh);
                        this._deployables.splice(i, 1);
                        break;
                    }
                }
            } else if (d.kind === 'flakgun') {
                d.remainingTime -= dt;
                d.fireTimer -= dt;
                // 找空中敌方载具
                let target = null;
                let bestDist = d.radius;
                for (const vehicle of this.vehicles) {
                    if (!vehicle.alive || vehicle.team === d.team) continue;
                    if (!vehicle.config?.isAircraft) continue;
                    const dist = vehicle.position.distanceTo(d.position);
                    if (dist < bestDist) { bestDist = dist; target = vehicle; }
                }
                if (target) {
                    // 炮管朝向目标
                    const to = d._aimVector.copy(target.position).sub(d.position);
                    d.yaw = Math.atan2(to.x, to.z);
                    if (d.mesh?.userData?.barrelGroup) {
                        d.mesh.userData.barrelGroup.rotation.y = d.yaw;
                    }
                    if (d.fireTimer <= 0) {
                        d.fireTimer = 60 / d.fireRate;
                        // 射出命中判定（简化：直接对目标造成伤害）
                        const dmg = d.damage * (1 + (d.owner?.classConfig?.vehicleDamageBonus || 0));
                        const killed = target.takeDamage?.(dmg, d.position, d.owner);
                        if (killed && d.team === 0 && target.team !== 0) {
                            this._handleFriendlyKill(target, '防空炮', d.owner);
                        }
                        // 弹道曳光
                        if (this.weaponSystem?._createTracer) {
                            this.weaponSystem._createTracer(
                                d._tracerStart.copy(d.position).setY(d.position.y + 0.65),
                                d._tracerEnd.copy(target.position),
                                0xffcc44
                            );
                        }
                        if (this.audio?.playHitMarker) this.audio.playHitMarker(false, false);
                    }
                }
                if (d.remainingTime <= 0) {
                    if (d.mesh) this._disposeObject3D(d.mesh);
                    this._deployables.splice(i, 1);
                }
            } else if (d.kind === 'sandbag') {
                d.remainingTime -= dt;
                if (d.remainingTime <= 0) {
                    if (d.mesh) this.world.obstacles?.removeCollisionForMesh?.(d.mesh);
                    if (d.mesh) this._disposeObject3D(d.mesh);
                    this._deployables.splice(i, 1);
                }
            }
        }
    }

    _updateSpecialCooldown(dt) {
        if (this._specialCooldown > 0) this._specialCooldown = Math.max(0, this._specialCooldown - dt);
    }

    _updatePendingProjectiles(dt) {
        if (!this._pendingProjectiles?.length) return;
        for (let i = this._pendingProjectiles.length - 1; i >= 0; i--) {
            const p = this._pendingProjectiles[i];
            p.t += dt;
            const t = Math.min(1, p.t / p.duration);
            if (p.mesh?.parent) {
                if (p.ctrl) {
                    // 二次贝塞尔弧线（迫击炮高抛弹道）
                    const m = p.mesh.position;
                    const a = p.from, b = p.to, c = p.ctrl;
                    const u = 1 - t;
                    m.x = u * u * a.x + 2 * u * t * c.x + t * t * b.x;
                    m.y = u * u * a.y + 2 * u * t * c.y + t * t * b.y;
                    m.z = u * u * a.z + 2 * u * t * c.z + t * t * b.z;
                } else {
                    p.mesh.position.lerpVectors(p.from, p.to, t);
                }
            }
            if (t >= 1) {
                p.onArrive?.();
                this._pendingProjectiles.splice(i, 1);
            }
        }
    }

    // === 兵种技能/装备系统 ===
    _useGadget() {
        if (!this.player || !this.player.alive || !this.player.classConfig) return;
        if (this.player.gadgetCooldown > 0) {
            this.hud.showNotification('技能冷却中...', 1);
            return;
        }

        const gadgetType = this.player.classConfig.gadget;
        const gadgetConfig = CONFIG.GADGETS[gadgetType];
        if (!gadgetConfig) return;

        let used = true;
        switch (gadgetType) {
            case 'ammobag':
                this._deployAmmoBag();
                break;
            case 'medbag':
                this._deployMedBag();
                break;
            case 'repairtool':
                used = this._useRepairTool();
                break;
            case 'sensor':
                this._deploySensor();
                break;
        }

        // 设置冷却（维修工具没修到则不消耗）
        if (used && gadgetConfig.cooldown > 0) {
            this.player.gadgetCooldown = gadgetConfig.cooldown;
            this.player.gadgetMaxCooldown = gadgetConfig.cooldown;
        }
    }

    // 部署弹药包
    _deployAmmoBag() {
        const pos = this.player.position.clone();
        pos.y = this.world.getHeight(pos.x, pos.z) + 0.1;
        this._deployables = this._deployables || [];
        const deployable = {
            type: 'ammo',
            position: pos,
            radius: CONFIG.GADGETS.ammobag.radius * (this.player.classConfig.gadgetRadiusMult || 1),
            remainingTime: CONFIG.GADGETS.ammobag.duration * (this.player.classConfig.gadgetDurationMult || 1),
            team: this.player.team,
            owner: this.player,
            mesh: this._createDeployableMesh(pos, 0xff8800, '弹药'),
        };
        this._deployables.push(deployable);
        this.hud.showNotification('弹药包已部署', 2);
        if (this.audio) this.audio.playUISound('click');
    }

    // 部署医疗包
    _deployMedBag() {
        const pos = this.player.position.clone();
        pos.y = this.world.getHeight(pos.x, pos.z) + 0.1;
        this._deployables = this._deployables || [];
        const deployable = {
            type: 'heal',
            position: pos,
            radius: CONFIG.GADGETS.medbag.radius * (this.player.classConfig.gadgetRadiusMult || 1),
            remainingTime: CONFIG.GADGETS.medbag.duration * (this.player.classConfig.gadgetDurationMult || 1),
            team: this.player.team,
            owner: this.player,
            mesh: this._createDeployableMesh(pos, 0xffffff, '医疗'),
        };
        this._deployables.push(deployable);
        this.hud.showNotification('医疗包已部署', 2);
        if (this.audio) this.audio.playUISound('click');
    }

    // 使用维修工具（被动，靠近载具时修复）
    _useRepairTool() {
        let repaired = false;
        for (const vehicle of this.vehicles) {
            if (!vehicle.alive) continue;
            if (vehicle.team !== this.player.team) continue;
            const dist = vehicle.position.distanceTo(this.player.position);
            if (dist < CONFIG.GADGETS.repairtool.radius) {
                const before = vehicle.health;
                vehicle.repair(50 * (this.player.classConfig.repairMult || 1));
                const restored = Math.max(0, vehicle.health - before);
                repaired = restored > 0 || repaired;
                if (restored > 0) this._awardSupportScore('repair', restored);
                // 火花特效
                this._createRepairSparks(vehicle.position);
            }
        }
        if (repaired) {
            this.hud.showNotification('载具已修复 +50', 2);
            if (this.audio) this.audio.playUISound('click');
        } else {
            this.hud.showNotification('附近没有可维修的友方载具', 2);
        }
        return repaired;
    }

    // 部署运动传感器
    _deploySensor() {
        const pos = this.player.position.clone();
        pos.y = this.world.getHeight(pos.x, pos.z) + 0.1;
        this._deployables = this._deployables || [];
        const deployable = {
            type: 'sensor',
            position: pos,
            radius: CONFIG.GADGETS.sensor.radius,
            remainingTime: CONFIG.GADGETS.sensor.duration,
            team: this.player.team,
            owner: this.player,
            mesh: this._createDeployableMesh(pos, 0x00ff00, '传感器'),
        };
        this._deployables.push(deployable);
        this.hud.showNotification('运动传感器已部署', 2);
        if (this.audio) this.audio.playUISound('click');
    }

    // 创建部署物视觉模型
    _createDeployableMesh(pos, color, label) {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, roughness: 0.5 });
        const matDark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });

        // 底座
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.25, 0.08, 12),
            matDark
        );
        base.position.y = 0.04;
        base.castShadow = true;
        group.add(base);

        // 主体
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.15, 0.25),
            mat
        );
        body.position.y = 0.16;
        body.castShadow = true;
        group.add(body);

        // 顶部指示灯
        const light = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 6),
            new THREE.MeshBasicMaterial({ color: color })
        );
        light.position.y = 0.26;
        group.add(light);

        // 部署物不挂点光源（顶部发光球已有指示效果；动态灯光会触发着色器重编译）

        group.position.copy(pos);
        this.scene.add(group);
        return group;
    }

    // 维修火花特效
    _createRepairSparks(pos) {
        for (let i = 0; i < 6; i++) {
            const material = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true });
            const spark = new THREE.Mesh(this._gameFxGeo.spark, material);
            spark.scale.setScalar(0.02);
            spark.position.set(
                pos.x + (Math.random() - 0.5),
                pos.y + 1 + (Math.random() - 0.5) * 0.5,
                pos.z + (Math.random() - 0.5)
            );
            this.transientFx.add({
                owner: this,
                category: 'impact',
                priority: 1,
                life: 0.3,
                object: spark,
                update: (effect, dt, progress) => {
                    spark.position.y += dt * 0.6;
                    material.opacity = 1 - progress;
                },
                release: () => material.dispose(),
                onReject: () => material.dispose(),
            });
        }
    }

    // 更新部署物
    _awardSupportScore(type, amount) {
        if (!amount || amount <= 0 || !this.player?.alive) return;
        const thresholds = { ammo: 30, heal: 25, repair: 50 };
        const points = {
            ammo: CONFIG.GAME.supplyScore || 2,
            heal: CONFIG.GAME.healScore || 2,
            repair: CONFIG.GAME.repairScore || 5,
        };
        const threshold = thresholds[type] || 25;
        this._supportScoreBank[type] = (this._supportScoreBank[type] || 0) + amount;
        const ticks = Math.floor(this._supportScoreBank[type] / threshold);
        if (ticks <= 0) return;
        this._supportScoreBank[type] -= ticks * threshold;
        const score = ticks * (points[type] || 1);
        this.friendlyScore += score;
        if (type === 'ammo') this.playerStats.resupplies += ticks;
        else if (type === 'heal') this.playerStats.heals += ticks;
        else if (type === 'repair') this.playerStats.repairs += ticks;
        this.director?.recordContribution('support', this.player, ticks, { supportType: type });
        if (this.hud) this.hud.showNotification(`Support +${score}`, 1.2);
    }

    _updateDeployables(dt) {
        if (!this._deployables) return;
        for (let i = this._deployables.length - 1; i >= 0; i--) {
            const d = this._deployables[i];
            // 特殊装备由 _updateSpecials 独立更新，避免重复计时/删除
            if (d.kind === 'atmine' || d.kind === 'flakgun' || d.kind === 'sandbag') continue;
            d.remainingTime -= dt;

            // 效果应用
            if (d.type === 'ammo') {
                // 给范围内的友方补充弹药
                if (this.player.alive && this.player.team === d.team) {
                    const dist = this.player.position.distanceTo(d.position);
                    if (dist < d.radius && this.weaponSystem) {
                        for (const wpn of this.weaponSystem.weapons) {
                            if (wpn.reserveAmmo < wpn.config.reserveAmmo) {
                                wpn.reserveAmmo = Math.min(wpn.reserveAmmo + 30 * dt, wpn.config.reserveAmmo);
                            }
                        }
                    }
                }
                for (const bot of this.bots) {
                    if (!bot.alive || bot.team !== d.team) continue;
                    const dist = bot.position.distanceTo(d.position);
                    if (dist < d.radius) {
                        const before = bot.reserveAmmo;
                        bot.reserveAmmo = Math.min(bot.reserveAmmo + 30 * dt, bot.weaponConfig.reserveAmmo);
                        if (d.owner === this.player && bot !== this.player) {
                            this._awardSupportScore('ammo', bot.reserveAmmo - before);
                        }
                    }
                }
            } else if (d.type === 'heal') {
                // 给范围内的友方治疗
                if (this.player.alive && this.player.team === d.team) {
                    const dist = this.player.position.distanceTo(d.position);
                    if (dist < d.radius) {
                        this.player.health = Math.min(this.player.health + 15 * dt, this.player.maxHealth);
                    }
                }
                for (const bot of this.bots) {
                    if (!bot.alive || bot.team !== d.team) continue;
                    const dist = bot.position.distanceTo(d.position);
                    if (dist < d.radius) {
                        const before = bot.health;
                        bot.health = Math.min(bot.health + 15 * dt, CONFIG.AI.health);
                        if (d.owner === this.player && bot !== this.player) {
                            this._awardSupportScore('heal', bot.health - before);
                        }
                    }
                }
            } else if (d.type === 'sensor') {
                // 传感器：在小地图上标记敌人（通过闪烁特效）
                // 简化处理：传感器周围敌人受到标记
                for (const bot of this.bots) {
                    if (!bot.alive || bot.team === d.team) continue;
                    const dist = bot.position.distanceTo(d.position);
                    if (dist < d.radius) {
                        bot._spotted = true;
                        bot._spotTimer = 1.0;
                    }
                }
            }

            // 指示灯闪烁
            if (d.mesh && d.mesh.children[2]) {
                d.mesh.children[2].material.opacity = 0.5 + Math.sin(performance.now() * 0.005) * 0.5;
                d.mesh.children[2].material.transparent = true;
            }

            // 过期移除
            if (d.remainingTime <= 0) {
                this._disposeObject3D(d.mesh);
                this._deployables.splice(i, 1);
            }
        }
    }

    _getShootableTargets() {
        const targets = [];
        for (const bot of this.bots) {
            if (bot.alive && !bot._assignedVehicle && bot.team !== this.player.team) {
                targets.push({ mesh: bot.model, character: bot, position: bot.position });
            }
        }
        for (const vehicle of this.vehicles) {
            if (vehicle.alive && vehicle.team !== this.player.team) {
                targets.push({ mesh: vehicle.model, character: vehicle, position: vehicle.position });
            }
        }
        return targets;
    }

    supportsStrategicObjectives() {
        return this.gameMode?.cfg?.supportsStrategicObjectives !== false;
    }

    _createTeamStrategicEffects() {
        return [
            { vehicleRespawnDelay: 0, ordersDisabled: false },
            { vehicleRespawnDelay: 0, ordersDisabled: false },
        ];
    }

    _resetStrategicEffects() {
        this._teamStrategicEffects = this._createTeamStrategicEffects();
    }

    _resetStrategicObjectives() {
        const objectives = this.world?.getStrategicObjectives?.() || [];
        for (const objective of objectives) {
            objective.alive = true;
            objective.health = objective.maxHealth;
            for (const effect of objective.destroyedEffects || []) {
                this._disposeObject3D(effect);
            }
            objective.destroyedEffects = [];
            this._updateStrategicObjectiveVisual(objective);
        }
    }

    _applyStrategicObjectiveEffect(objective) {
        const teamState = this._teamStrategicEffects?.[objective?.team];
        const effect = objective?.effect;
        if (!teamState || !effect) return '';

        const notices = [];
        const respawnDelay = Math.max(0, Number(effect.vehicleRespawnDelay) || 0);
        if (respawnDelay > teamState.vehicleRespawnDelay) {
            const addedDelay = respawnDelay - teamState.vehicleRespawnDelay;
            teamState.vehicleRespawnDelay = respawnDelay;
            for (const item of this._vehicleRespawns) {
                if (item.vehicle?.team !== objective.team || item.strategicDelayApplied) continue;
                item.time += addedDelay;
                item.strategicDelayApplied = true;
            }
            notices.push(`载具增援延迟 ${respawnDelay} 秒`);
        }
        if (effect.disableOrders && !teamState.ordersDisabled) {
            teamState.ordersDisabled = true;
            for (const bot of this.bots) {
                if (bot.team === objective.team) bot.setBattlefieldPriority?.(null);
            }
            notices.push('战场指挥链中断');
        }
        return notices.join('，');
    }

    _getStrategicObjectiveTargets() {
        const targets = [];
        if (!this.supportsStrategicObjectives()) return targets;
        const objectives = this.world.getStrategicObjectives ? this.world.getStrategicObjectives() : [];
        for (const objective of objectives) {
            if (!objective.alive) continue;
            targets.push({
                name: objective.name,
                team: objective.team,
                type: 'objective',
                alive: objective.alive,
                health: objective.health,
                maxHealth: objective.maxHealth,
                position: objective.position,
                objective,
                takeDamage: (damage, attacker = null) => {
                    const sourceTeam = attacker?.team ?? (objective.team === 0 ? 1 : 0);
                    const weaponName = attacker?.weaponConfig?.name || attacker?.config?.name || '武器';
                    this._damageStrategicObjective(objective, damage, sourceTeam, attacker, weaponName, objective.position);
                    return false;
                },
                onKilled: () => {},
            });
        }
        return targets;
    }

    _getStrategicObjectiveFromMesh(mesh) {
        let obj = mesh;
        while (obj) {
            if (obj.userData && obj.userData.strategicObjective) {
                return obj.userData.strategicObjective;
            }
            obj = obj.parent;
        }
        return null;
    }

    _onPlayerWorldHit(mesh, damage, weaponName, hitPoint, config = null) {
        if (this.world?.breakGlass?.(mesh, hitPoint)) {
            if (this.audio?.playGlassBreak) {
                this.audio.playGlassBreak(hitPoint, 0.9);
            }
            this._onPlayerLoudNoise(hitPoint, 'glass');
            return;
        }
        // 可破坏实体（沙袋、箱子等）—— 子弹直接伤害
        if (this.destructibles?.isDestructible?.(mesh)) {
            let dmgScale = 0.6;
            if (config?.type === 'pistol') dmgScale = 0.4;
            else if (config?.type === 'shotgun') dmgScale = 0.5;
            else if (config?.type === 'sniper' || config?.type === 'dmr') dmgScale = 0.9;
            else if (config?.type === 'lmg') dmgScale = 0.7;
            const destroyed = this.destructibles.applyDamage(mesh, Math.max(1, damage * dmgScale), hitPoint, config);
            if (this.hud) this.hud.showHitMarker(destroyed, false);
            // 可破坏物摧毁时给确认音；未摧毁不播人体命中音（避免误判打中人）
            if (this.audio && destroyed) this.audio.playHitConfirm();
            return;
        }
        const objective = this._getStrategicObjectiveFromMesh(mesh);
        if (!this.supportsStrategicObjectives() || !objective || !objective.alive || objective.team === this.player?.team) return;

        let damageScale = 0.65;
        if (config?.type === 'pistol') damageScale = 0.35;
        else if (config?.type === 'shotgun') damageScale = 0.45;
        else if (config?.type === 'sniper' || config?.type === 'dmr') damageScale = 0.85;
        else if (config?.type === 'lmg') damageScale = 0.75;

        this._damageStrategicObjective(
            objective,
            Math.max(1, damage * damageScale),
            this.player.team,
            this.player,
            weaponName,
            hitPoint
        );
    }

    _damageStrategicObjectivesInRadius(position, radius, damage, team, source, weaponName = '爆炸') {
        if (!this.supportsStrategicObjectives()) return;
        const objectives = this.world.getStrategicObjectives ? this.world.getStrategicObjectives() : [];
        for (const objective of objectives) {
            if (!objective.alive || objective.team === team) continue;
            const dist = objective.position.distanceTo(position);
            if (dist >= radius + 2.5) continue;
            const falloff = 1 - Math.min(1, dist / Math.max(1, radius + 2.5));
            this._damageStrategicObjective(
                objective,
                damage * falloff * 1.15,
                team,
                source,
                weaponName,
                position
            );
        }
    }

    _damageStrategicObjective(objective, amount, sourceTeam, source = null, weaponName = '武器', hitPoint = null) {
        if (!this.supportsStrategicObjectives() || !objective || !objective.alive || amount <= 0) return false;
        if (objective.team === sourceTeam) return false;

        objective.health = Math.max(0, objective.health - amount);
        const destroyed = objective.health <= 0;
        const playerInvolved = source === this.player || (source instanceof Vehicle && this._isPlayerDrivingVehicle(source));
        if (playerInvolved) this.director?.reportTargetDamaged(objective, this.player);

        this._updateStrategicObjectiveVisual(objective);

        if (playerInvolved && this.hud) {
            this.hud.showHitMarker(destroyed, false);
            // 战略目标摧毁时给确认音；未摧毁不播人体命中音
            if (this.audio && destroyed) this.audio.playHitConfirm();
        }

        if (destroyed) {
            this._onStrategicObjectiveDestroyed(objective, sourceTeam, source, weaponName, hitPoint);
        }
        return destroyed;
    }

    _onPlayerLoudNoise(position, type = 'noise') {
        if (!this.player?.alive || !position) return;

        const radius = type === 'glass' ? 82 : 55;
        let alerted = 0;
        for (const bot of this.bots) {
            if (!bot.alive || bot.team === this.player.team || bot._assignedVehicle) continue;
            const dist = bot.position.distanceTo(position);
            if (dist > radius) continue;

            const hasLos = bot._hasLineOfSight ? bot._hasLineOfSight(this.player.position) : dist < 18;
            if (hasLos || dist < 18) {
                bot.target = this.player;
                bot.state = 'engage';
                bot.reactionTimer = Math.min(bot.reactionTimer || CONFIG.AI.reactionTime, CONFIG.AI.reactionTime * 0.75);
            } else {
                bot.target = null;
                bot.state = 'patrol';
            }
            bot.stateTimer = 0;
            if (bot.patrolTarget?.copy) {
                bot.patrolTarget.copy(position);
            }
            bot._enemySearchTimer = Math.min(bot._enemySearchTimer || 0.2, 0.2);
            alerted++;
        }

        this.player._spotted = true;
        this.player._spotTimer = Math.max(this.player._spotTimer || 0, type === 'glass' ? 5 : 3);

        if (type === 'glass' && alerted > 0 && this.hud) {
            this.hud.showNotification(`玻璃破碎声暴露了你的位置：${alerted} 名敌人警觉`, 2.4);
        }
    }

    _updateStrategicObjectiveVisual(objective) {
        const pct = Math.max(0, objective.health / objective.maxHealth);
        const damageColor = new THREE.Color(0x1b1b1b);
        const materials = new Set();
        for (const part of objective.parts || []) {
            if (part.material) materials.add(part.material);
        }
        for (const material of materials) {
            if (!material.color) continue;
            if (!material.userData.objectiveBaseColor) {
                material.userData.objectiveBaseColor = material.color.clone();
            }
            material.color.copy(material.userData.objectiveBaseColor).lerp(damageColor, 1 - pct);
            if (material.transparent && material.opacity !== undefined) {
                if (material.userData.objectiveBaseOpacity === undefined) {
                    material.userData.objectiveBaseOpacity = material.opacity;
                }
                const baseOpacity = material.userData.objectiveBaseOpacity;
                material.opacity = objective.alive ? Math.max(0.05, baseOpacity * pct) : 0.05;
            }
        }
    }

    _onStrategicObjectiveDestroyed(objective, sourceTeam, source, weaponName, hitPoint) {
        objective.alive = false;
        objective.health = 0;
        this._updateStrategicObjectiveVisual(objective);

        const score = objective.scoreValue || 25;
        const tickets = objective.ticketDamage || 25;
        const playerInvolved = source === this.player || (source instanceof Vehicle && this._isPlayerDrivingVehicle(source));

        if (sourceTeam === 0) {
            this.friendlyScore += score;
            if (playerInvolved) this.playerStats.objectivesDestroyed++;
            if (this.gameMode) this.gameMode.onStrategicObjectiveDestroyed(objective, 0);
            else this.enemyTickets = Math.max(0, this.enemyTickets - tickets);
            if (playerInvolved && this.hud) {
                this.hud.addKillMessage('你', objective.name, weaponName, {
                    isPlayerKill: true,
                    killerTeam: 0,
                    victimTeam: 1,
                    showConfirm: true,
                    scoreText: `+${score}`,
                });
                this.hud.showNotification(`已摧毁 ${objective.name} +${score}分，敌方 -${tickets}票`, 4);
            }
        } else if (sourceTeam === 1) {
            this.enemyScore += score;
            if (this.gameMode) this.gameMode.onStrategicObjectiveDestroyed(objective, 1);
            else this.friendlyTickets = Math.max(0, this.friendlyTickets - tickets);
            if (this.hud) {
                this.hud.showNotification(`${objective.name} 被摧毁！我方 -${tickets}票`, 4);
            }
        }

        const effectNotice = this._applyStrategicObjectiveEffect(objective);
        if (effectNotice && this.hud) {
            const subject = objective.team === 0 ? '我方' : '敌方';
            this.hud.showNotification(`${subject}${objective.shortLabel || objective.name}失效：${effectNotice}`, 4.5);
        }

        this._createStrategicObjectiveWreck(objective);
        if (this.audio) this.audio.playUISound('capture');

        if (objective.type === 'fuel') {
            const blastPos = (hitPoint || objective.position).clone();
            blastPos.y = Math.max(blastPos.y, objective.position.y + 1.2);
            this._onExplosion(blastPos, 8, 90, sourceTeam, source);
        }
    }

    _createStrategicObjectiveWreck(objective) {
        const pos = objective.position;
        const fire = new THREE.Mesh(
            new THREE.ConeGeometry(0.9, 2.2, 8),
            new THREE.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: 0.65 })
        );
        fire.name = 'strategic_objective_fire';
        fire.position.set(pos.x, pos.y + 1.2, pos.z);
        this.scene.add(fire);

        const smoke = new THREE.Mesh(
            new THREE.SphereGeometry(1.6, 10, 8),
            new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.45 })
        );
        smoke.name = 'strategic_objective_smoke';
        smoke.position.set(pos.x, pos.y + 2.8, pos.z);
        this.scene.add(smoke);

        objective.destroyedEffects = [fire, smoke];
    }

    _onPlayerHit(target, damage, isHeadshot, weaponName, hitPoint) {
        // 载具命中：走装甲/伤害类型链，hitPoint 用于命中区域判定
        if (target instanceof Vehicle) {
            const cfg = this.weaponSystem?.currentWeapon?.config;
            const antiArmor = !!(cfg?.antiArmor || cfg?.type === 'rocket');
            this._recordPlayerDamageContribution(target, damage);
            const killed = target.takeDamage(damage, hitPoint || null, this.player, {
                damageType: antiArmor ? 'explosion' : 'bullet',
                antiArmor,
            });
            this.hud.showHitMarker(killed, false);
            if (this.audio) {
                if (killed) this.audio.playHitConfirm();
                else this.audio.playHitMarker(false, false);
            }
            if (killed) {
                if (target.team !== this.player.team) this._handleFriendlyKill(target, weaponName, this.player);
                else this._clearPlayerDamageContribution(target);
            }
            return;
        }
        // 必须传入玩家对象作为 attacker，否则 AI 倒地后 lastAttacker 为空、击杀无归属
        // （旧代码传 isHeadshot boolean，Bot.takeDamage 会忽略 attacker）
        if (target) target._lastHitWasHeadshot = !!isHeadshot;
        // 压制武器(M249/MG42)命中时标记，Bot 据此加重受击压制
        this.player._suppressiveHit = !!(this.weaponSystem?.currentWeapon?.config?.suppressive);
        const wasDowned = !!(target && target.downed);
        const killed = target.takeDamage(damage, this.player, this.player.position);
        this._recordPlayerDamageContribution(target, damage);
        this.hud.showHitMarker(killed, isHeadshot);

        // 浮动伤害数字
        if (hitPoint) {
            const screenPos = hitPoint.clone().project(this.camera);
            const sx = (screenPos.x + 1) / 2 * window.innerWidth;
            const sy = (-screenPos.y + 1) / 2 * window.innerHeight;
            const dmgType = isHeadshot ? 'headshot' : (damage > 50 ? 'critical' : 'normal');
            this.hud.showFloatingDamage(sx, sy, Math.round(damage), dmgType);
        }

        // 命中音效（爆头有专属清脆"叮"声；击杀用确认音；普通命中用标记音）
        if (this.audio) {
            if (isHeadshot) {
                this.audio.playHeadshotDing();
                if (killed) this.audio.playHitConfirm();
            } else if (killed) {
                this.audio.playHitConfirm();
            } else {
                this.audio.playHitMarker(false, false);
            }
        }

        // 刚击倒（进入倒地）：只提示，不计击杀分
        if (!killed && target instanceof Bot && target.downed && !wasDowned) {
            this.hud.addKillMessage('你', target.name, weaponName, {
                isPlayerKill: true,
                isHeadshot,
                isDown: true,
                killerTeam: 0,
                victimTeam: target.team,
                showConfirm: true,
                scoreText: isHeadshot ? '爆头击倒' : '击倒',
            });
            return;
        }

        // 彻底击杀（补枪/流血终结/载具摧毁）
        if (killed) {
            this._onPlayerKill(target, weaponName, isHeadshot);
        }
    }

    _onPlayerKill(target, weaponName, isHeadshot = false) {
        // 倒地状态不算击杀（防御性检查）
        if (target instanceof Bot && target.downed) return;
        // 防双重结算
        if (target && target._scoreSettled && target instanceof Bot) {
            // 已由处决等路径结算过，仍可确保重生排队
            if (!target.alive && !target.downed) this._respawnBot(target);
            return;
        }

        this._clearPlayerDamageContribution(target);
        this.playerStats.kills++;
        this.friendlyScore += 10;
        this.director?.recordContribution('kill', this.player, 1, { target });
        if (target) target._scoreSettled = true;

        // === 连杀系统 ===
        this._playerKillstreak++;
        const killstreak = this._playerKillstreak;
        let scoreBonus = 0;
        let ksTitle = '';
        let ksSubtitle = '';

        if (killstreak === 2) {
            scoreBonus = 5;
            ksTitle = '双杀';
            ksSubtitle = 'DOUBLE KILL  +5';
        } else if (killstreak === 3) {
            scoreBonus = 10;
            ksTitle = '三连杀';
            ksSubtitle = 'TRIPLE KILL  +10';
        } else if (killstreak === 4) {
            scoreBonus = 15;
            ksTitle = '四连杀';
            ksSubtitle = 'QUAD KILL  +15';
        } else if (killstreak === 5) {
            scoreBonus = 25;
            ksTitle = '五连杀!';
            ksSubtitle = 'PENTAKILL  +25';
        } else if (killstreak >= 6 && killstreak % 2 === 0) {
            scoreBonus = 30;
            ksTitle = `${killstreak}连杀!`;
            ksSubtitle = `RAMPAGE  +30`;
        }

        if (ksTitle) {
            this.friendlyScore += scoreBonus;
            this.hud.showKillstreak(ksTitle, ksSubtitle);
        }

        // 爆头额外加分
        if (isHeadshot) this.friendlyScore += 5;

        let scoreText = isHeadshot ? '+15' : '+10';
        if (scoreBonus > 0) scoreText += ` 连杀+${scoreBonus}`;
        if (target instanceof Bot) {
            this.hud.addKillMessage('你', target.name, weaponName, {
                isPlayerKill: true,
                isHeadshot,
                killerTeam: 0,
                victimTeam: target.team,
                showConfirm: true,
                scoreText,
            });
            // 重生由主循环统一排队；此处也可触发（_respawnQueued 防重入）
            this._respawnBot(target);
        } else if (target instanceof Vehicle) {
            this.playerStats.vehiclesDestroyed++;
            this.hud.addKillMessage('你', target.config.name, weaponName, {
                isPlayerKill: true,
                isHeadshot,
                killerTeam: 0,
                victimTeam: target.team ?? 1,
                showConfirm: true,
                scoreText,
            });
        }
    }

    _recordPlayerDamageContribution(target, damage) {
        if (!target || target.team === this.player?.team || damage <= 0) return;
        const entry = this._playerDamageContributions.get(target) || { damage: 0, time: 0 };
        entry.damage += damage;
        entry.time = performance.now() / 1000;
        this._playerDamageContributions.set(target, entry);
        this.director?.reportTargetDamaged(target, this.player);
    }

    _clearPlayerDamageContribution(target) {
        if (target) this._playerDamageContributions.delete(target);
    }

    _tryAwardPlayerAssist(target, killer, weaponName = '武器') {
        if (!target || !this.player || target.team === this.player.team) return false;
        if (killer === this.player) return false;

        const entry = this._playerDamageContributions.get(target);
        if (!entry) return false;

        const now = performance.now() / 1000;
        const assistWindow = CONFIG.GAME.assistWindow || 12;
        const minDamage = CONFIG.GAME.assistMinDamage || 35;
        if (now - entry.time > assistWindow || entry.damage < minDamage) {
            this._clearPlayerDamageContribution(target);
            return false;
        }

        this.playerStats.assists++;
        const assistScore = CONFIG.GAME.assistScore || 5;
        this.friendlyScore += assistScore;
        const targetName = target.name || target.config?.name || '敌方目标';
        const killerName = killer?.name || killer?.config?.name || '队友';
        // 队友击杀 feed 已由 _reportKillFeed 处理；这里只弹助攻确认
        this.hud.showKillConfirm({
            killer: killerName,
            victim: targetName,
            weapon: weaponName,
            scoreText: `助攻 +${assistScore}`,
        });
        this.hud.showNotification(`助攻 +${assistScore}分`, 1.5);
        this.director?.recordContribution('assist', this.player, 1, { target });
        this._clearPlayerDamageContribution(target);
        return true;
    }

    _tryAwardPlayerSpotAssist(target, killer) {
        if (!target || !this.player || killer === this.player) return false;
        if (target.team === this.player.team || killer?.team !== this.player.team) return false;
        if (!target._spottedByPlayer) return false;

        const score = CONFIG.GAME.spotAssistScore || 10;
        this.playerStats.spotAssists++;
        this.friendlyScore += score;
        target._spottedByPlayer = false;
        target._spottedByPlayerTimer = 0;
        this.director?.recordContribution('spotAssist', this.player, 1, { target });
        if (this.hud) this.hud.showNotification(`Spot assist +${score}`, 1.5);
        return true;
    }

    // 全局击杀 feed（AI 互杀 / 队友击杀），不弹玩家个人确认条
    _reportKillFeed(killer, victim, weaponName = '武器', extra = {}) {
        if (!this.hud || !victim) return;
        const killerIsPlayer = killer === this.player;
        const victimIsPlayer = victim === this.player;
        // 玩家自己的击杀/死亡已在专用路径处理
        if (killerIsPlayer || victimIsPlayer) return;

        const killerName = killer
            ? (killer.name || killer.config?.name || '未知')
            : '环境';
        const victimName = victim.name || victim.config?.name || '未知';
        const weapon = weaponName
            || killer?.weaponConfig?.name
            || killer?.config?.name
            || '武器';

        this.hud.addKillMessage(killerName, victimName, weapon, {
            isPlayerKill: false,
            isPlayerDeath: false,
            isHeadshot: !!extra.isHeadshot || !!victim._lastHitWasHeadshot,
            isDown: !!extra.isDown,
            isSuicide: !killer,
            killerTeam: typeof killer?.team === 'number' ? killer.team : null,
            victimTeam: typeof victim.team === 'number' ? victim.team : null,
            showConfirm: false,
        });
    }

    _cleanupPlayerDamageContributions() {
        const now = performance.now() / 1000;
        const assistWindow = CONFIG.GAME.assistWindow || 12;
        for (const [target, entry] of this._playerDamageContributions) {
            if (!target || !target.alive || now - entry.time > assistWindow) {
                this._playerDamageContributions.delete(target);
            }
        }
    }

    _handleFriendlyKill(target, weaponName, killer = this.player, isHeadshot = false) {
        if (!target || target.team === this.player?.team) return;
        target._scoreSettled = true;
        if (killer === this.player) {
            this._onPlayerKill(target, weaponName, isHeadshot);
        } else {
            this.friendlyScore += 10;
            this._tryAwardPlayerAssist(target, killer, weaponName);
            this._tryAwardPlayerSpotAssist(target, killer);
        }
    }

    _onExplosion(position, radius, damage, team, source = null, ignoreTeams = false, options = null) {
        // 近距离爆炸镜头震动（按距离衰减）
        if (this.player?.alive && this.player.addShake) {
            const shakeDist = this.player.position.distanceTo(position);
            const shakeRange = Math.max(radius * 3, 25);
            if (shakeDist < shakeRange) {
                this.player.addShake(Math.min(0.65, (1 - shakeDist / shakeRange) * 0.75));
            }
        }
        const damagedCharacters = new Set();
        const sourceVehicle = source instanceof Vehicle ? source : null;
        const playerDrivenSource = sourceVehicle && this._isPlayerDrivingVehicle(sourceVehicle);
        const weaponName = source === this.player ? '爆炸' : (sourceVehicle ? sourceVehicle.config.name : '爆炸');
        const damageAtDistance = (dist) => damage * (1 - Math.pow(Math.min(1, dist / radius), 1.5));

        // 遮挡检查：返回伤害衰减系数 (0.0 = 完全遮挡, 1.0 = 无遮挡)
        const losMeshes = this.world?.getLosMeshes?.() || [];
        const checkCover = (targetPos) => {
            if (losMeshes.length === 0) return 1.0;
            const dir = targetPos.clone().sub(position);
            const dist = dir.length();
            if (dist < 0.5) return 1.0;
            dir.normalize();
            this._explosionRaycaster = this._explosionRaycaster || new THREE.Raycaster();
            this._explosionRaycaster.set(position, dir);
            this._explosionRaycaster.far = dist;
            const hits = this._explosionRaycaster.intersectObjects(losMeshes, false);
            if (hits.length === 0) return 1.0;
            const blockingHit = hits.find(h => h.distance < dist - 0.2);
            if (!blockingHit) return 1.0;
            const thickness = blockingHit.object?.userData?.coverThickness || 1.0;
            return Math.max(0.15, 1.0 - thickness * 0.7);
        };
        const vehicleOccupants = new Set();
        const vehicleOccupantSnapshot = [];
        for (const vehicle of this.vehicles) {
            for (const occupant of vehicle.occupants || []) {
                if (!occupant) continue;
                vehicleOccupants.add(occupant);
                vehicleOccupantSnapshot.push({
                    vehicle,
                    occupant,
                    vehicleAlive: vehicle.alive,
                    position: (occupant.position || vehicle.position).clone(),
                });
            }
        }
        for (const bot of this.bots) {
            // 含倒地目标：爆炸可补死；彻底死亡的跳过
            if ((!bot.alive && !bot.downed) || vehicleOccupants.has(bot)) continue;
            const dist = bot.position.distanceTo(position);
            if (dist < radius) {
                const dmg = damageAtDistance(dist);
                if (ignoreTeams || team !== bot.team) {
                    const atk = playerDrivenSource ? this.player : (source || null);
                    if (atk === this.player || playerDrivenSource) {
                        this._recordPlayerDamageContribution(bot, dmg);
                    }
                    const killed = bot.takeDamage(dmg, atk, position);
                    damagedCharacters.add(bot);
                    if (killed) {
                        if (bot._assignedVehicle) {
                            this._releaseVehicleOccupant(bot);
                        }
                        if (team === 0 && bot.team !== 0) {
                            this._handleFriendlyKill(bot, weaponName, atk);
                        } else {
                            this._clearPlayerDamageContribution(bot);
                        }
                        this._respawnBot(bot);
                    }
                }
            }
        }

        // 载具伤害 - 排除发射载具自身，只伤害敌方载具
        for (const vehicle of this.vehicles) {
            if (!vehicle.alive) continue;
            if (vehicle === sourceVehicle) continue;  // 不伤害发射载具自身
            const dist = vehicle.position.distanceTo(position);
            if (dist < radius) {
                const dmg = damageAtDistance(dist) * (options?.antiVehicleMult || 1);
                if (ignoreTeams || team !== vehicle.team) {
                    if (source === this.player || playerDrivenSource) {
                        this._recordPlayerDamageContribution(vehicle, dmg);
                    }
                    const atk = playerDrivenSource ? this.player : (source || null);
                    const killed = vehicle.takeDamage(dmg, null, atk, { damageType: 'explosion', antiArmor: !!options?.antiArmor });
                    if (killed) {
                        if (team === 0 && vehicle.team !== 0) {
                            this._handleFriendlyKill(vehicle, weaponName, playerDrivenSource ? this.player : (source || null));
                        } else {
                            this._clearPlayerDamageContribution(vehicle);
                        }
                    }
                }
            }
        }

        this._damageStrategicObjectivesInRadius(position, radius, damage, team, source, weaponName);

        // 可破坏实体 AoE 伤害（沙袋、箱子等）
        if (this.destructibles) {
            this.destructibles.applyRadiusDamage(position, radius, damage, source);
        }

        for (const { vehicle, occupant, vehicleAlive, position: occupantPos } of vehicleOccupantSnapshot) {
            if (!occupant.alive || damagedCharacters.has(occupant)) continue;
            if (!ignoreTeams && team === occupant.team) continue;
            const dist = occupantPos.distanceTo(position);
            if (dist >= radius) continue;
            const crewMult = vehicleAlive ? (CONFIG.VEHICLES._explosionCrewDamageIfAlive || 0.25) : 1.0;
            const dmg = damageAtDistance(dist) * crewMult;
            if (occupant === this.player) {
                this._damagePlayer(dmg, position, playerDrivenSource ? this.player : (source || null), true);
                damagedCharacters.add(occupant);
            } else if (occupant.takeDamage) {
                const atk = playerDrivenSource ? this.player : (source || null);
                if (atk === this.player || playerDrivenSource) {
                    this._recordPlayerDamageContribution(occupant, dmg);
                }
                const killed = occupant.takeDamage(dmg, atk, position, true);
                damagedCharacters.add(occupant);
                if (killed) {
                    if (team === 0 && occupant.team !== 0) {
                        this._handleFriendlyKill(occupant, weaponName, atk);
                    } else {
                        this._clearPlayerDamageContribution(occupant);
                    }
                    this._respawnBot(occupant);
                }
            }
        }

        // 玩家伤害
        if (this.player && this.player.alive) {
            const playerPos = this.player.position.clone();
            const dist = playerPos.distanceTo(position);
            if (dist < radius) {
                const dmg = damageAtDistance(dist);
                if (!damagedCharacters.has(this.player) && (ignoreTeams || team !== this.player.team)) {
                    this._damagePlayer(dmg, position, playerDrivenSource ? this.player : (source || null));
                }
            }
        }
    }

    _onVehicleFire(vehicle, muzzle, direction, damage, range, options = {}, targetPoint = null) {
        const playerDriven = this._isPlayerDrivingVehicle(vehicle);
        // 主炮开火时车内玩家镜头震动
        if (damage >= 100 && this.player?.inVehicle === vehicle && this.player.addShake) {
            this.player.addShake(0.3);
        }
        const aimDirection = targetPoint && targetPoint.distanceToSquared(muzzle) > 0.01
            ? targetPoint.clone().sub(muzzle).normalize()
            : direction;
        // 射线检测（near=5 确保不会命中自身载具模型）
        const raycaster = new THREE.Raycaster(muzzle, aimDirection, 5, range);

        // 找到命中点
        let hitPoint = null;
        let hitDist = Infinity;
        const allMeshes = this.world.getShootableMeshes();

        // 检测敌方角色
        let hitCharacter = null;
        let isHeadshot = false;
        let hitVehicle = null;
        for (const bot of this.bots) {
            if (!bot.alive) continue;
            if (bot.team === vehicle.team) continue;
            const intersects = raycaster.intersectObject(bot.model, true);
            if (intersects.length > 0 && intersects[0].distance < hitDist) {
                hitDist = intersects[0].distance;
                hitPoint = intersects[0].point.clone();
                hitCharacter = bot;
                isHeadshot = intersects[0].point.y > bot.position.y + 1.5;
                hitVehicle = null;
            }
        }

        // 检测敌方载具（排除自身和友方）
        for (const v of this.vehicles) {
            if (!v.alive || v === vehicle) continue;
            if (v.team === vehicle.team) continue;
            const intersects = raycaster.intersectObject(v.model, true);
            if (intersects.length > 0 && intersects[0].distance < hitDist) {
                hitDist = intersects[0].distance;
                hitPoint = intersects[0].point.clone();
                hitVehicle = v;
                hitCharacter = null;
            }
        }

        // 检测障碍物和地形
        let hitObjective = null;
        const fallbackVehicleHit = this._findVehicleRayHit(vehicle, muzzle, aimDirection, range, hitDist);
        if (fallbackVehicleHit && fallbackVehicleHit.distance < hitDist) {
            hitDist = fallbackVehicleHit.distance;
            hitPoint = fallbackVehicleHit.point.clone();
            hitVehicle = fallbackVehicleHit.vehicle;
            hitCharacter = null;
        }

        const obstacleHits = raycaster.intersectObjects(allMeshes, true);
        if (obstacleHits.length > 0 && obstacleHits[0].distance < hitDist) {
            hitDist = obstacleHits[0].distance;
            hitPoint = obstacleHits[0].point.clone();
            hitObjective = this._getStrategicObjectiveFromMesh(obstacleHits[0].object);
            hitCharacter = null;
            hitVehicle = null;
        }

        // 检测地形（如果射线方向接近水平，可能没有命中任何物体）
        if (!hitPoint) {
            const farX = muzzle.x + aimDirection.x * range;
            const farZ = muzzle.z + aimDirection.z * range;
            const groundY = this.world.getHeight(farX, farZ);
            const distToGround = aimDirection.y !== 0 ? (groundY - muzzle.y) / aimDirection.y : -1;
            if (distToGround > 5 && distToGround < range) {
                hitPoint = muzzle.clone().add(aimDirection.clone().multiplyScalar(distToGround));
            } else {
                hitPoint = muzzle.clone().add(aimDirection.clone().multiplyScalar(range));
            }
        }

        // 直接命中伤害
        if (hitCharacter) {
            if (playerDriven) {
                this._recordPlayerDamageContribution(hitCharacter, damage);
            }
            const killed = hitCharacter.takeDamage(damage, vehicle, muzzle);
            if (killed) {
                if (vehicle.team === 0) {
                    this._handleFriendlyKill(hitCharacter, vehicle.config.name, playerDriven ? this.player : vehicle, isHeadshot);
                } else {
                    this.enemyScore += 10;
                    this._clearPlayerDamageContribution(hitCharacter);
                }
                this._respawnBot(hitCharacter);
            }
            if (playerDriven && this.hud) {
                this.hud.showHitMarker(killed, isHeadshot);
                if (this.audio) {
                    if (killed) this.audio.playHitConfirm();
                    else this.audio.playHitMarker();
                }
            }
        }
        if (hitVehicle) {
            if (playerDriven) {
                this._recordPlayerDamageContribution(hitVehicle, damage);
            }
            // 载具主炮对载具视为反装甲穿深
            const heavyGun = damage >= 80;
            const killed = hitVehicle.takeDamage(damage, hitPoint, playerDriven ? this.player : vehicle, {
                damageType: 'explosion',
                antiArmor: heavyGun,
            });
            if (killed) {
                if (vehicle.team === 0) {
                    this._handleFriendlyKill(hitVehicle, vehicle.config.name, playerDriven ? this.player : vehicle);
                } else {
                    this._clearPlayerDamageContribution(hitVehicle);
                }
            }
            if (playerDriven && this.hud) {
                this.hud.showHitMarker(killed, false);
                if (this.audio) {
                    if (killed) this.audio.playHitConfirm();
                    else this.audio.playHitMarker();
                }
            }
        }
        if (hitObjective) {
            this._damageStrategicObjective(hitObjective, damage * 0.75, vehicle.team, playerDriven ? this.player : vehicle, vehicle.config.name, hitPoint);
        }

        // 检测玩家 - 使用射线到点的垂直距离判断，更精确
        if (this.player && this.player.alive && this.player.team !== vehicle.team) {
            const playerPos = this.player.position.clone();
            playerPos.y += 1; // 胸部高度
            const toPlayer = playerPos.clone().sub(muzzle);
            const projDist = toPlayer.dot(aimDirection); // 沿射线方向的投影距离
            // projDist < hitDist 确保玩家不在障碍物后面
            if (projDist > 5 && projDist < range && projDist < hitDist) {
                // 计算玩家到射线的垂直距离
                const closestPoint = muzzle.clone().add(aimDirection.clone().multiplyScalar(projDist));
                const perpDist = playerPos.distanceTo(closestPoint);
                if (perpDist < 0.6) { // 玩家半径约0.6
                    this._damagePlayer(damage, muzzle, vehicle);
                    if (playerDriven && this.hud) {
                        this.hud.showHitMarker(false, false);
                        if (this.audio) this.audio.playHitMarker();
                    }
                }
            }
        }

        // 炮弹命中后产生范围爆炸伤害（根据载具类型调整参数，最小引信距离防止近距离自伤）
        const shellDist = hitPoint.distanceTo(muzzle);
        if (options.explosive !== false && hitPoint) {
            // 各载具的爆炸参数：坦克大爆炸，APC小爆炸（高频低伤），直升机中等爆炸
            const blastParams = {
                tank: { radius: 14, damageMult: 0.8, minDist: 8 },
                apc: { radius: 6, damageMult: 0.45, minDist: 5 },
                heli: { radius: 8, damageMult: 0.5, minDist: 5 },
                jeep: { radius: 3, damageMult: 0.3, minDist: 5 },
                plane: { radius: 5, damageMult: 0.5, minDist: 8 },
            };
            const params = blastParams[vehicle.type] || { radius: 3, damageMult: 0.3, minDist: 5 };
            if (shellDist > params.minDist) {
                this._onExplosion(hitPoint, params.radius, damage * params.damageMult, vehicle.team, vehicle);
            }
        }
    }

    _findVehicleRayHit(shooter, origin, direction, range, maxDistance = Infinity) {
        let best = null;
        const dims = {
            jeep: { radius: 1.8, height: 2.0 },
            apc: { radius: 2.5, height: 2.4 },
            tank: { radius: 3.0, height: 2.8 },
            heli: { radius: 3.4, height: 2.8 },
            plane: { radius: 4.2, height: 2.8 },
        };

        for (const target of this.vehicles) {
            if (!target.alive || target === shooter || target.team === shooter.team) continue;

            const d = dims[target.type] || { radius: 2.0, height: 2.2 };
            const center = target.position.clone();
            center.y += d.height * 0.5;
            const toTarget = center.clone().sub(origin);
            const projected = toTarget.dot(direction);
            if (projected <= 0 || projected > range || projected >= maxDistance) continue;

            const closest = origin.clone().add(direction.clone().multiplyScalar(projected));
            const radius = d.radius + (target.type === 'heli' ? 0.4 : 0.15);
            if (closest.distanceTo(center) <= radius) {
                best = {
                    vehicle: target,
                    distance: projected,
                    point: closest,
                };
                maxDistance = projected;
            }
        }

        return best;
    }

    // 载具瞄准：通过相机射线找到目标点，让炮塔对准该点（第一/第三人称通用）
    _updateVehicleTurretAim(vehicle) {
        if (!vehicle.config.hasWeapon || !vehicle.turret) return;
        // 固定翼：武器焊死在机头，飞行姿态即瞄准，跳过炮塔瞄准逻辑
        if (vehicle.config.isPlane) {
            if (vehicle.clearLocalAimRay) vehicle.clearLocalAimRay();
            return;
        }

        // 性能优化：复用 raycaster 和临时向量，避免每帧创建新对象
        if (!this._turretAimRaycaster) {
            this._turretAimRaycaster = new THREE.Raycaster();
            this._turretAimCameraDir = new THREE.Vector3();
            this._turretAimCameraPos = new THREE.Vector3();
            this._turretAimPoint = new THREE.Vector3();
        }

        // 从相机位置向前射线检测
        const cameraDir = this._turretAimCameraDir;
        this.camera.getWorldDirection(cameraDir);
        const cameraPos = this._turretAimCameraPos.copy(this.camera.position);

        // 收集所有可碰撞的mesh
        const meshes = this.world.getShootableMeshes();
        // near=3 跳过相机附近的载具自身模型
        const raycaster = this._turretAimRaycaster;
        raycaster.set(cameraPos, cameraDir);
        raycaster.near = 3;
        raycaster.far = 500;

        let nearestDist = Infinity;
        let aimPoint = null;
        const aimPointStore = this._turretAimPoint;

        // 检测世界障碍物和地形
        const worldHits = raycaster.intersectObjects(meshes, true);
        for (const hit of worldHits) {
            if (hit.distance < nearestDist) {
                nearestDist = hit.distance;
                if (!aimPoint) aimPoint = aimPointStore;
                aimPoint.copy(hit.point);
            }
        }

        // 检测敌方载具（排除自身和友方）
        for (const v of this.vehicles) {
            if (!v.alive || v === vehicle) continue;
            if (v.team === vehicle.team) continue;
            const hits = raycaster.intersectObject(v.model, true);
            if (hits.length > 0 && hits[0].distance < nearestDist) {
                nearestDist = hits[0].distance;
                if (!aimPoint) aimPoint = aimPointStore;
                aimPoint.copy(hits[0].point);
            }
        }

        // 检测敌方角色（排除友方）
        for (const bot of this.bots) {
            if (!bot.alive) continue;
            if (bot.team === vehicle.team) continue;
            const hits = raycaster.intersectObject(bot.model, true);
            if (hits.length > 0 && hits[0].distance < nearestDist) {
                nearestDist = hits[0].distance;
                if (!aimPoint) aimPoint = aimPointStore;
                aimPoint.copy(hits[0].point);
            }
        }

        // 如果没有命中任何物体，或命中点太近，沿射线方向投射远点
        if (!aimPoint || nearestDist < 10) {
            // 确保瞄准点至少在10米外，避免近距离视差导致炮塔乱转
            const minDist = Math.max(nearestDist, 10);
            const farDist = Math.max(minDist, 100);
            if (!aimPoint) aimPoint = aimPointStore;
            aimPoint.copy(cameraPos).addScaledVector(cameraDir, farDist);
        }

        if (vehicle.type === 'heli' && this.player?.inVehicle === vehicle && this.player.vehicleSeat === 0) {
            vehicle.setLocalAimRay(cameraPos, cameraDir, aimPoint);
        } else if (vehicle.clearLocalAimRay) {
            vehicle.clearLocalAimRay();
        }

        // 让炮塔瞄准该点
        vehicle.aimAtPoint(aimPoint);
    }

    // 判断乘员位是否控制载具武器（战地风格：坦克顶部机枪、直升机门机炮）
    _crewControlsVehicleWeapon(vehicle) {
        if (!vehicle || !vehicle.config.hasWeapon) return false;
        if (!this.player.inVehicle || this.player.inVehicle !== vehicle) return false;
        const seat = this.player.vehicleSeat;
        if (seat < 1) return false;
        // 坦克乘员位控制机枪（副武器），直升机乘员位控制机炮（主武器）
        return vehicle.type === 'tank' || vehicle.type === 'heli';
    }

    // 乘员位视角瞄准：设置 localAimRay，让载具武器按乘员位视角开火（不旋转炮塔）
    _setCrewVehicleAim(vehicle) {
        if (!this._crewAimCameraDir) {
            this._crewAimCameraDir = new THREE.Vector3();
            this._crewAimCameraPos = new THREE.Vector3();
        }
        this.camera.getWorldDirection(this._crewAimCameraDir);
        this._crewAimCameraPos.copy(this.camera.position);
        vehicle.setLocalAimRay(this._crewAimCameraPos, this._crewAimCameraDir);
    }

    _damagePlayer(damage, sourcePosition, attacker = null, bypassVehicle = false) {
        if (!this.player.alive && !this.player.downed) return;

        // 通过 takeDamage 处理，onDeath 回调会自动触发
        this.player.takeDamage(damage, attacker, bypassVehicle);
        // 受击镜头震动（伤害越高越强）
        if (this.player.addShake) {
            this.player.addShake(Math.min(0.45, 0.12 + damage * 0.005));
        }
        // 全屏红闪（战地受击反馈）
        if (this.hud?.flashDamage) {
            this.hud.flashDamage(Math.min(0.55, 0.22 + damage * 0.006));
        }

        // 使用真实的受击方向
        if (attacker && attacker.position) {
            const dir = attacker.position.clone().sub(this.player.position);
            const angle = Math.atan2(dir.x, dir.z) + this.player.yaw;
            this.hud.showDamageIndicator(angle * 180 / Math.PI);
        } else if (sourcePosition) {
            const dir = sourcePosition.clone().sub(this.player.position);
            const angle = Math.atan2(dir.x, dir.z) + this.player.yaw;
            this.hud.showDamageIndicator(angle * 180 / Math.PI);
        } else {
            this.hud.showDamageIndicator(0);
        }

        if (this.audio) this.audio.playHurt();
    }

    _isPlayerDrivingVehicle(vehicle) {
        return !!(this.player &&
            this.player.inVehicle === vehicle &&
            this.player.vehicleSeat === 0 &&
            vehicle.occupants &&
            vehicle.occupants[0] === this.player);
    }

    _handleVehicleRamming(vehicle, prevPos, dt) {
        if (!vehicle || !vehicle.alive || !prevPos || dt <= 0) return;

        const dx = vehicle.position.x - prevPos.x;
        const dz = vehicle.position.z - prevPos.z;
        const movedSpeed = Math.sqrt(dx * dx + dz * dz) / Math.max(dt, 0.001);
        const velocitySpeed = Math.sqrt(
            vehicle.velocity * vehicle.velocity +
            (vehicle.lateralVelocity || 0) * (vehicle.lateralVelocity || 0)
        );
        const impactSpeed = Math.max(movedSpeed, velocitySpeed);
        if (impactSpeed < 2.2) return;

        if (vehicle.type === 'heli') {
            const groundY = this.world.getHeight(vehicle.position.x, vehicle.position.z);
            if (vehicle.position.y - groundY > 3.5) return;
        }

        const ramRadiusByType = { jeep: 1.9, apc: 2.6, tank: 3.1, heli: 3.0 };
        const maxDamageByType = { jeep: 90, apc: 130, tank: 170, heli: 120 };
        const damageScaleByType = { jeep: 10, apc: 13, tank: 16, heli: 12 };
        const ramRadius = ramRadiusByType[vehicle.type] || 2.0;
        const maxDamage = maxDamageByType[vehicle.type] || 100;
        const damageScale = damageScaleByType[vehicle.type] || 10;
        const playerDriven = this._isPlayerDrivingVehicle(vehicle);
        const now = performance.now() / 1000;
        const cooldowns = vehicle._ramHitCooldowns || (vehicle._ramHitCooldowns = new WeakMap());

        const targets = [];
        for (const bot of this.bots) {
            if (!bot.alive || bot._assignedVehicle || bot.team === vehicle.team) continue;
            targets.push(bot);
        }
        if (this.player && this.player.alive && !this.player.inVehicle && this.player.team !== vehicle.team) {
            targets.push(this.player);
        }

        for (const target of targets) {
            const dist = this._distancePointToSegmentXZ(target.position, prevPos, vehicle.position);
            if (dist > ramRadius + CONFIG.PLAYER.radius) continue;

            const lastHit = cooldowns.get(target) || 0;
            if (now - lastHit < 0.55) continue;
            cooldowns.set(target, now);

            const contactFactor = 1 - Math.min(1, dist / (ramRadius + CONFIG.PLAYER.radius));
            const damage = THREE.MathUtils.clamp(
                (impactSpeed - 1.5) * damageScale * (0.55 + contactFactor * 0.45),
                12,
                maxDamage
            );

            if (target === this.player) {
                this._damagePlayer(damage, vehicle.position, vehicle);
                continue;
            }

            if (playerDriven) {
                this._recordPlayerDamageContribution(target, damage);
            }
            const killed = target.takeDamage(damage, vehicle, vehicle.position);
            if (playerDriven && this.hud) {
                this.hud.showHitMarker(killed, false);
                if (this.audio) {
                    if (killed) this.audio.playHitConfirm();
                    else this.audio.playHitMarker();
                }
            }

            if (killed) {
                if (vehicle.team === 0) {
                    this._handleFriendlyKill(target, vehicle.config.name, playerDriven ? this.player : vehicle);
                } else {
                    this.enemyScore += 10;
                    this._clearPlayerDamageContribution(target);
                }
                this._respawnBot(target);
            }
        }
    }

    _distancePointToSegmentXZ(point, a, b) {
        const abx = b.x - a.x;
        const abz = b.z - a.z;
        const apx = point.x - a.x;
        const apz = point.z - a.z;
        const lenSq = abx * abx + abz * abz;
        const t = lenSq > 0 ? THREE.MathUtils.clamp((apx * abx + apz * abz) / lenSq, 0, 1) : 0;
        const cx = a.x + abx * t;
        const cz = a.z + abz * t;
        const dx = point.x - cx;
        const dz = point.z - cz;
        return Math.sqrt(dx * dx + dz * dz);
    }

    _getVehicleCollisionRadius(vehicle) {
        const radiusByType = { jeep: 1.9, apc: 2.7, tank: 3.2, heli: 3.4 };
        return radiusByType[vehicle.type] || 2.2;
    }

    _getVehicleCollisionHeight(vehicle) {
        const heightByType = { jeep: 2.0, apc: 2.5, tank: 2.9, heli: 3.0 };
        return heightByType[vehicle.type] || 2.2;
    }

    _getVehiclePlanarVelocity(vehicle) {
        const forwardX = -Math.sin(vehicle.yaw);
        const forwardZ = -Math.cos(vehicle.yaw);
        const rightX = Math.cos(vehicle.yaw);
        const rightZ = -Math.sin(vehicle.yaw);
        return {
            x: forwardX * vehicle.velocity + rightX * (vehicle.lateralVelocity || 0),
            z: forwardZ * vehicle.velocity + rightZ * (vehicle.lateralVelocity || 0),
        };
    }

    _handleVehicleVehicleCollisions(dt) {
        if (!this.vehicles || this.vehicles.length < 2 || dt <= 0) return;

        const now = performance.now() / 1000;
        for (let i = 0; i < this.vehicles.length; i++) {
            const a = this.vehicles[i];
            if (!a.alive) continue;

            for (let j = i + 1; j < this.vehicles.length; j++) {
                const b = this.vehicles[j];
                if (!b.alive) continue;

                const heightA = this._getVehicleCollisionHeight(a);
                const heightB = this._getVehicleCollisionHeight(b);
                const minY = Math.max(a.position.y, b.position.y);
                const maxY = Math.min(a.position.y + heightA, b.position.y + heightB);
                if (maxY - minY < 0.35) continue;

                const radiusA = this._getVehicleCollisionRadius(a);
                const radiusB = this._getVehicleCollisionRadius(b);
                const dx = b.position.x - a.position.x;
                const dz = b.position.z - a.position.z;
                const minDist = radiusA + radiusB;
                const distSq = dx * dx + dz * dz;
                if (distSq >= minDist * minDist) continue;

                const dist = Math.sqrt(distSq) || 0.001;
                const nx = dx / dist;
                const nz = dz / dist;
                const overlap = minDist - dist;
                const massA = a.config.mass || 1;
                const massB = b.config.mass || 1;
                const totalMass = massA + massB;
                const moveA = overlap * (massB / totalMass);
                const moveB = overlap * (massA / totalMass);

                const aNew = a.position.clone();
                const bNew = b.position.clone();
                aNew.x -= nx * moveA;
                aNew.z -= nz * moveA;
                bNew.x += nx * moveB;
                bNew.z += nz * moveB;

                if (!a.config.isAircraft) aNew.y = this.world.getHeight(aNew.x, aNew.z);
                if (!b.config.isAircraft) bNew.y = this.world.getHeight(bNew.x, bNew.z);

                if (!this.world.checkCollision(aNew, radiusA * 0.85, heightA)) {
                    a.position.copy(aNew);
                }
                if (!this.world.checkCollision(bNew, radiusB * 0.85, heightB)) {
                    b.position.copy(bNew);
                }

                const velA = this._getVehiclePlanarVelocity(a);
                const velB = this._getVehiclePlanarVelocity(b);
                const relX = velA.x - velB.x;
                const relZ = velA.z - velB.z;
                const relSpeed = Math.sqrt(relX * relX + relZ * relZ);

                a.velocity *= -0.25;
                b.velocity *= -0.25;
                a.lateralVelocity *= -0.2;
                b.lateralVelocity *= -0.2;
                if (a._onCollision) a._onCollision();
                if (b._onCollision) b._onCollision();

                const cooldowns = a._vehicleImpactCooldowns || (a._vehicleImpactCooldowns = new WeakMap());
                const lastHit = cooldowns.get(b) || 0;
                if (relSpeed < 2.8 || now - lastHit < 0.45) continue;
                cooldowns.set(b, now);

                const damageA = THREE.MathUtils.clamp((relSpeed - 2) * 7 * massB, 8, 120);
                const damageB = THREE.MathUtils.clamp((relSpeed - 2) * 7 * massA, 8, 120);
                const playerInA = this._isPlayerDrivingVehicle(a);
                const playerInB = this._isPlayerDrivingVehicle(b);

                if (playerInA && b.team !== a.team) this._recordPlayerDamageContribution(b, damageB);
                if (playerInB && a.team !== b.team) this._recordPlayerDamageContribution(a, damageA);

                const killedA = a.takeDamage(damageA);
                const killedB = b.takeDamage(damageB);

                if (playerInA && b.team !== a.team && this.hud) {
                    this.hud.showHitMarker(killedB, false);
                    if (this.audio) {
                        if (killedB) this.audio.playHitConfirm();
                        else this.audio.playHitMarker();
                    }
                    if (killedB) this._handleFriendlyKill(b, a.config.name, this.player);
                }
                if (playerInB && a.team !== b.team && this.hud) {
                    this.hud.showHitMarker(killedA, false);
                    if (this.audio) {
                        if (killedA) this.audio.playHitConfirm();
                        else this.audio.playHitMarker();
                    }
                    if (killedA) this._handleFriendlyKill(a, b.config.name, this.player);
                }
            }
        }
    }

    // 子弹近飞回调 - 增加玩家压制值
    _onBulletNearMiss(dist) {
        if (!this.player.alive) return;
        // 距离越近压制越大
        const amount = CONFIG.AI.suppressionAmount * (1 - dist / 3.0);
        this.player.addSuppression(amount);
    }

    // 玩家倒地（区别于死亡，不扣票数、不显示部署界面）
    _onPlayerDowned(killer) {
        this.fortifications?.cancel();
        if (this._banzaiActive) this._endBanzai(false);
        if (this._mortarMapOpen) this._closeMortarMap();
        // 防空炮炮手退出
        if (this.player?.inStaticGun) this._exitStaticGun();
        // 倒地时若仍在载具内，强制下车并清 UI
        if (this.player?.inVehicle) {
            const v = this.player.inVehicle;
            const seat = this.player.vehicleSeat || 0;
            try { v.exit?.(seat); } catch (_) {}
            this.player.exitVehicle?.();
        }
        this.hud.hideVehicleUI?.();

        let killerName = '环境伤害';
        let killerTeam = 1;
        if (killer) {
            killerName = killer.name || (killer.config && killer.config.name) || '敌方';
            if (typeof killer.team === 'number') killerTeam = killer.team;
        }
        const weaponName = (killer && killer.weaponConfig) ? killer.weaponConfig.name
            : (killer?.config?.name || '武器');
        this.hud.addKillMessage(killerName, '你', weaponName, {
            isPlayerDeath: true,
            isDown: true,
            killerTeam,
            victimTeam: 0,
            showConfirm: true,
        });
        if (this.hud.showDownedOverlay) this.hud.showDownedOverlay();
        if (this.hud.showNotification) this.hud.showNotification('你已倒地！等待队友救援 (长按空格跳过)', 3);
    }

    _onPlayerDeath(killer) {
        this.fortifications?.cancel();
        if (this._banzaiActive) this._endBanzai(false);
        if (this._mortarMapOpen) this._closeMortarMap();
        // 防空炮炮手退出
        if (this.player?.inStaticGun) this._exitStaticGun();
        // 死亡时清掉载具 UI（坠毁/爆炸踢出后可能残留）
        if (this.player?.inVehicle) {
            const v = this.player.inVehicle;
            const seat = this.player.vehicleSeat || 0;
            try { v.exit?.(seat); } catch (_) {}
            this.player.exitVehicle?.();
        }
        this.hud.hideVehicleUI?.();
        this.playerStats.deaths++;
        // 击杀得分和票数扣除委托给游戏模式处理
        if (this.gameMode) {
            this.gameMode.onPlayerDeath(this.player, killer);
        } else {
            // 兼容旧逻辑：无 gameMode 时直接加分扣票
            if (killer && killer.team === 1) {
                this.enemyScore += 10;
            }
            this.friendlyTickets -= CONFIG.GAME.deathTicketCost;
        }
        // 重置连杀
        this._playerKillstreak = 0;

        let killerName = '环境伤害';
        let killerTeam = 1;
        if (killer) {
            killerName = killer.name || (killer.config && killer.config.name) || '敌方';
            if (typeof killer.team === 'number') killerTeam = killer.team;
        }
        const weaponName = (killer && killer.weaponConfig) ? killer.weaponConfig.name
            : (killer?.config?.name || '武器');
        this.hud.addKillMessage(killerName, '你', weaponName, {
            isPlayerDeath: true,
            isHeadshot: !!this.player?._lastHitWasHeadshot,
            killerTeam,
            victimTeam: 0,
            showConfirm: true,
        });

        // 显示部署界面（替代简单死亡画面）
        const squadMembers = this._getSquadMembers();
        this.hud.showDeployScreen(
            this.world.capturePoints,
            squadMembers,
            CONFIG.PLAYER.respawnTime,
            null,
            (member) => this._startSpectate(member)
        );
        this._deployTimer = CONFIG.PLAYER.respawnTime;
        if (!this.input.isMobile) this.input.exitLock();
    }

    // 死亡后观战：相机跟随指定队友，确认是否复活在其旁
    _startSpectate(member) {
        if (!member || !member.alive) return;
        const bot = this.bots.find(b => b.name === member.name && b.team === this.player.team);
        if (!bot || !bot.alive) return;
        this._spectatingBot = bot;
        this.hud.setSpectatingName(bot.name);
        if (this.hud.showNotification) {
            this.hud.showNotification(`观战 ${bot.name}，点击该成员或部署可结束观战`, 2.5);
        }
    }

    _stopSpectate() {
        this._spectatingBot = null;
        this.hud.setSpectatingName(null);
    }

    // 死亡观战相机：跟随目标队友（第三人称视角）
    _updateSpectateCamera(dt) {
        const bot = this._spectatingBot;
        if (!bot) return;
        if (!bot.alive) {
            this._stopSpectate();
            return;
        }
        // 相机放在目标后方上方，朝向目标
        const dist = 6;
        const height = 2.2;
        const backX = -Math.sin(bot.yaw) * dist;
        const backZ = -Math.cos(bot.yaw) * dist;
        const targetPos = this.camera.position.clone();
        const groundY = this.world.getHeight(bot.position.x, bot.position.z);
        targetPos.set(
            bot.position.x + backX,
            bot.position.y + height,
            bot.position.z + backZ
        );
        targetPos.y = Math.max(targetPos.y, groundY + 1.0);
        const lerp = Math.min(1, dt * 6);
        this.camera.position.lerp(targetPos, lerp);
        this.camera.lookAt(bot.position.x, bot.position.y + 1.4, bot.position.z);
    }

    _respawnBot(bot) {
        // 倒地中不可重生；彻底死亡后才排队
        if (!bot || bot._respawnQueued) return;
        if (bot.downed || bot.alive) return;
        bot._respawnQueued = true;
        this._clearPlayerDamageContribution(bot);
        bot._respawnHandle = setTimeout(() => {
            bot._respawnHandle = null;
            bot._respawnQueued = false;
            if (this.state === 'playing' || this.state === 'paused') {
                if (bot.alive || bot.downed) return;
                let pos = null;
                const rally = bot.team === 0 && bot.squadId === this.player?.squadId ? this.director?.getRallyPoint(0) : null;
                if (rally?.position && this._isSpawnPositionSafe(rally.position, bot.team)) {
                    pos = rally.position.clone();
                } else {
                    const modeDeploy = this.gameMode?.getDeployPoint?.(bot.team);
                    if (modeDeploy?.position) pos = modeDeploy.position.clone();
                    else if (Number.isFinite(modeDeploy?.x)) pos = new THREE.Vector3(modeDeploy.x, modeDeploy.y || 0, modeDeploy.z);
                    else pos = bot.getRespawnPosition();
                }
                pos.x += (Math.random() - 0.5) * 5;
                pos.z += (Math.random() - 0.5) * 5;
                pos.y = this.world.getHeight(pos.x, pos.z);
                bot._scoreSettled = false;
                bot.spawn(pos);
            }
        }, CONFIG.AI.respawnTime * 1000);
    }

    _isSpawnPositionSafe(position, team = 0) {
        const safetyRadius = CONFIG.GAME.spawnSafetyRadius || 20;
        for (const bot of this.bots) {
            if (!bot.alive || bot.team === team) continue;
            if (bot.position.distanceTo(position) < safetyRadius) return false;
        }
        for (const vehicle of this.vehicles) {
            if (!vehicle.alive || vehicle.team === team) continue;
            if (vehicle.position.distanceTo(position) < safetyRadius + 8) return false;
        }
        return true;
    }

    _isDeployPointSafe(cp) {
        if (!cp || cp.team !== 0) return false;
        if (cp.contested || (cp.captureProgress > 0 && cp.capturingTeam === 1)) return false;
        return this._isSpawnPositionSafe(new THREE.Vector3(cp.x, cp.y, cp.z), 0);
    }

    _respawnPlayer() {
        this._stopSpectate();
        const classType = this.playerClassType || this.menu.selectedClass || 'assault';
        const classConfig = this.director?.getRuntimeClassConfig(classType) || CONFIG.CLASSES[classType];

        // 获取部署点
        let spawnPos;
        const selectedSquad = this.hud.getSelectedSquadMember ? this.hud.getSelectedSquadMember() : null;
        const selectedCp = this.hud.getSelectedDeployPoint();
        if (selectedSquad && selectedSquad.position && selectedSquad.alive &&
            this._isSpawnPositionSafe(selectedSquad.position, this.player.team)) {
            // 小队部署：在存活队友附近重生
            spawnPos = new THREE.Vector3(
                selectedSquad.position.x + (Math.random() - 0.5) * 6,
                0,
                selectedSquad.position.z + (Math.random() - 0.5) * 6
            );
        } else if (selectedCp && this._isDeployPointSafe(selectedCp)) {
            // 在选定据点附近重生
            spawnPos = this.world.getDeployPositionNear
                ? this.world.getDeployPositionNear(selectedCp, this.player.team)
                : new THREE.Vector3(selectedCp.x + (Math.random() - 0.5) * 8, 0, selectedCp.z + (Math.random() - 0.5) * 8);
        } else {
            const rally = this.director?.getRallyPoint(this.player.team);
            if (rally?.position && this._isSpawnPositionSafe(rally.position, this.player.team)) {
                spawnPos = rally.position.clone();
            } else {
                const modeDeploy = this.gameMode?.getDeployPoint?.(this.player.team);
                if (modeDeploy?.position) spawnPos = modeDeploy.position.clone();
                else if (Number.isFinite(modeDeploy?.x)) spawnPos = new THREE.Vector3(modeDeploy.x, modeDeploy.y || 0, modeDeploy.z);
                else spawnPos = this.world.getTeamSpawnPoint ? this.world.getTeamSpawnPoint(this.player.team) : new THREE.Vector3(-95, 0, -95);
            }
        }
        spawnPos.y = this.world.getHeight(spawnPos.x, spawnPos.z);
        this.player.spawn(spawnPos, classConfig);

        // 重置武器
        const loadout = this.playerLoadout || this._resolvePlayerLoadout(classType);
        this.weaponSystem.loadWeapons([loadout.primary, loadout.secondary], loadout.optic);
        this.weaponSystem.grenadeCount = classConfig.grenadeMax || 3;

        this.hud.hideDeployScreen();
        this.hud.hideDeath();
        if (this.hud.hideDownedOverlay) this.hud.hideDownedOverlay();
        if (!this.input.isMobile) {
            this.input.requestLock(this.renderer.domElement);
        }
    }

    onSpecializationLevelUp(classType, state) {
        if (classType !== this.playerClassType || !this.player) return;
        const classConfig = this.director?.getRuntimeClassConfig(classType);
        if (!classConfig) return;
        this.player.applyClassConfig?.(classType, classConfig, { preserveVitals: true });
        if (this.weaponSystem) this.weaponSystem.grenadeCount = Math.min(this.weaponSystem.grenadeCount, classConfig.grenadeMax || 3);
        this.hud.showNotification?.(`专精升级：等级 ${state.level}`, 2.5);
    }

    // 获取玩家所在小队成员状态
    _getSquadMembers() {
        // 玩家小队：同 squadId 的友方（无 squad 时取前 4 名友军）
        const playerSquadId = this.player?.squadId;
        const friends = this.bots.filter(b => b.team === 0);
        let squad = playerSquadId != null
            ? friends.filter(b => b.squadId === playerSquadId)
            : friends.slice(0, 4);
        if (squad.length === 0) squad = friends.slice(0, 4);
        return squad.map(bot => ({
            name: bot.name,
            alive: bot.alive,
            downed: !!bot.downed,
            health: bot.health,
            position: bot.position,
            classType: bot.classType,
            isSelf: false,
        }));
    }

    _updateSquadHUD() {
        const members = this._getSquadMembers();
        // 把自己插到首位
        members.unshift({
            name: '你',
            alive: !!(this.player && this.player.alive),
            downed: !!(this.player && this.player.downed),
            health: this.player?.health ?? 0,
            classType: this.playerClassType || 'assault',
            isSelf: true,
        });
        this.hud.updateSquad(members);
    }

    _spotTargetFromCrosshair() {
        if (!this.player || !this.player.alive || !this.camera) return;
        if (this._spotCooldown > 0) {
            this.hud.showNotification(`战术标记冷却中 ${Math.ceil(this._spotCooldown)}秒`, 1);
            return;
        }

        this.camera.getWorldDirection(this._spotDirection);
        this._spotRaycaster.set(this.camera.position, this._spotDirection);
        this._spotRaycaster.near = 0.5;
        this._spotRaycaster.far = 120;

        let target = null;
        let targetDistance = Infinity;
        const checkTarget = (entity, model) => {
            if (!entity || !entity.alive || entity.team === this.player.team || !model) return;
            const hits = this._spotRaycaster.intersectObject(model, true);
            if (hits.length > 0 && hits[0].distance < targetDistance) {
                target = entity;
                targetDistance = hits[0].distance;
            }
        };

        for (const bot of this.bots) checkTarget(bot, bot.model);
        for (const vehicle of this.vehicles) checkTarget(vehicle, vehicle.model);

        if (!target) {
            this.hud.showNotification('准星附近没有可标记目标', 1.2);
            this._spotCooldown = 0.8;
            return;
        }

        const worldHits = this._spotRaycaster.intersectObjects(this.world.getShootableMeshes(), true);
        if (worldHits.length > 0 && worldHits[0].distance < targetDistance - 0.5) {
            this.hud.showNotification('目标被障碍物遮挡', 1.2);
            this._spotCooldown = 0.8;
            return;
        }

        target._spotted = true;
        target._spotTimer = this.player.classConfig?.spotDuration || CONFIG.GAME.spotDuration || 8;
        target._spottedByPlayer = true;
        target._spottedByPlayerTimer = target._spotTimer;
        this._spotCooldown = this.player.classConfig?.spotCooldown || CONFIG.GAME.spotCooldown || 3;

        if (target instanceof Bot) {
            for (const bot of this.bots) {
                if (!bot.alive || bot.team !== this.player.team || bot._assignedVehicle) continue;
                if (bot.position.distanceTo(target.position) < 90 && bot.state === 'patrol') {
                    bot.target = target;
                    bot.state = 'engage';
                    bot.reactionTimer = Math.max(bot.reactionTimer || 0, CONFIG.AI.reactionTime);
                }
            }
            this.hud.showNotification(`已标记敌人 ${target.name}`, 2);
        } else {
            this.hud.showNotification(`已标记敌方${target.config.name}`, 2);
        }
    }

    _onCapturePoint(cp) {
        // 委托给游戏模式处理得分
        if (this.gameMode) this.gameMode.onCapturePoint(cp, cp.team);
        else if (cp.team === 0) {
            this.friendlyScore += CONFIG.GAME.capturePointBonus;
        } else if (cp.team === 1) {
            this.enemyScore += CONFIG.GAME.capturePointBonus;
        }

        if (cp.team === 0) {
            this.hud.showNotification(`已占领 ${cp.name} ${cp.label || ''}！`, 3);
            // 玩家参与占领（在圈内）时给个人占领奖励（战地核心得分循环）
            if (this.player?.alive) {
                const dx = this.player.position.x - cp.x;
                const dz = this.player.position.z - cp.z;
                if (Math.sqrt(dx * dx + dz * dz) < cp.radius) {
                    const captureScore = 25;
                    this.friendlyScore += captureScore;
                    this.playerStats.captures++;
                    this.director?.recordContribution('capture', this.player, 1, { capturePoint: cp });
                    this.hud.showNotification(`占领得分 +${captureScore}`, 2);
                }
            }
            if (this.currentOrder && this.currentOrder.point === cp && this.currentOrder.type === 'attack') {
                this.friendlyScore += CONFIG.GAME.orderCompleteBonus;
                this.hud.showKillstreak('命令完成', `${cp.name} ${cp.label || ''} 已控制  +${CONFIG.GAME.orderCompleteBonus}`);
                this.currentOrder = null;
                this._orderTimer = 5;
            }
        } else if (cp.team === 1) {
            this.hud.showNotification(`敌方占领了 ${cp.name} ${cp.label || ''}`, 3);
        }
        if (this.audio) this.audio.playUISound('capture');
    }

    _checkInteraction() {
        this.nearbyExecuteTarget = null;
        // 防空炮炮手模式：进入时已提示一次，不在每帧续显
        if (this.player.inStaticGun) {
            this.hud.hideInteraction();
            return;
        }
        if (this.player.inVehicle) {
            // 载具内退出提示由 vehicleControls 短暂显示承担，不常驻中央提示
            this.hud.hideInteraction();
            return;
        }

        // 查找附近可复活/可拖拽的倒地队友
        this.nearbyReviveTarget = this._findNearbyRevivableBot(this.player.position, this.player.team);
        // 可拖拽范围更宽松：任何倒地队友（不限于小队/医疗兵）
        this.nearbyDragTarget = this._findNearbyDraggableBot(this.player.position, this.player.team);
        // 正在拖拽的目标不应被重复检测为可拖拽
        if (this.nearbyDragTarget && this.player.isDragging() && this.nearbyDragTarget === this.player._draggingBot) {
            this.nearbyDragTarget = null;
        }

        // 正在拖拽时：提示放下（E）和可选复活（F）
        if (this.player.isDragging()) {
            this.nearbyVehicle = null;
            const draggedBot = this.player._draggingBot;
            const canReviveDragged = draggedBot && this._canPlayerRevive(draggedBot);
            const actions = [{ key: 'E', label: '放下队友' }];
            if (canReviveDragged) actions.push({ key: 'F', label: '复活' });
            this.hud.showInteraction(actions);
            return;
        }

        if (this.nearbyReviveTarget) {
            this.nearbyVehicle = null;
            // 同时可复活又可拖拽：F=复活，E=拖拽
            this.hud.showInteraction([
                { key: 'F', label: '复活队友' },
                { key: 'E', label: '拖拽' },
            ]);
            return;
        }
        if (this.nearbyDragTarget) {
            this.nearbyVehicle = null;
            this.hud.showInteraction([{ key: 'E', label: '拖拽队友' }]);
            return;
        }

        // 附近倒地的敌人：可处决
        this.nearbyExecuteTarget = this._findNearbyExecutableBot();
        if (this.nearbyExecuteTarget) {
            this.nearbyVehicle = null;
            this.hud.showInteraction([{ key: 'F', label: '处决' }]);
            return;
        }

        this.nearbyVehicle = null;
        this.nearbyStaticGun = null;
        let bestScore = Infinity;
        for (const vehicle of this.vehicles) {
            if (!vehicle.alive) continue;
            // 大型载具（飞机/直升机）交互距离放宽（机身长，位置中心离舱门远）
            const reach = (vehicle.type === 'plane' || vehicle.type === 'heli') ? 5.5 : 4;
            const dist = this.player.position.distanceTo(vehicle.position);
            if (dist < reach && dist < bestScore) {
                bestScore = dist;
                this.nearbyVehicle = vehicle;
            }
        }

        // 固定防空炮台交互
        if (!this.nearbyVehicle && this.staticGuns) {
            for (const gun of this.staticGuns) {
                if (!gun.alive) continue;
                if (gun.team !== this.player.team) continue;
                const dist = this.player.position.distanceTo(gun.position);
                if (dist < 3.2) {
                    this.nearbyStaticGun = gun;
                    break;
                }
            }
        }

        if (this.nearbyVehicle) {
            this.hud.showInteraction([{ key: 'F', label: `进入${this.nearbyVehicle.config.name}` }]);
        } else if (this.nearbyStaticGun) {
            this.hud.showInteraction([{ key: 'F', label: '进入防空炮' }]);
        } else {
            // 无交互目标：F 近战仍可用，但不显示常驻提示
            this.hud.hideInteraction();
        }
    }

    // 查找附近可处决的倒地敌人（2.2m 内，玩家站立/蹲姿且不在载具中）
    _findNearbyExecutableBot() {
        if (!this.player?.alive || this.player.inVehicle || this.player.isDragging()) return null;
        if (this._executing) return null;
        let best = null;
        let bestDist = 2.2;
        for (const bot of this.bots) {
            if (bot.alive || !bot.downed || bot.team === this.player.team) continue;
            if (bot._assignedVehicle) continue;
            const dist = this.player.position.distanceTo(bot.position);
            if (dist < bestDist) {
                bestDist = dist;
                best = bot;
            }
        }
        return best;
    }

    // 构建第一人称匕首（挂在相机下，处决时出现）
    _getExecutionKnife() {
        if (this._executionKnife) return this._executionKnife;
        const knife = new THREE.Group();

        const matBlade = new THREE.MeshStandardMaterial({ color: 0xb8bec4, roughness: 0.25, metalness: 0.9 });
        const matHandle = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.85, metalness: 0.1 });
        const matGuard = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5, metalness: 0.7 });

        // 刀刃（尖端朝 -Z）
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.035, 0.24), matBlade);
        blade.position.z = -0.16;
        knife.add(blade);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 4), matBlade);
        tip.rotation.x = -Math.PI / 2;
        tip.scale.set(0.6, 1, 1.6);
        tip.position.z = -0.315;
        knife.add(tip);
        // 血槽
        const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.008, 0.18), matGuard);
        fuller.position.z = -0.15;
        knife.add(fuller);
        // 护手
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.02), matGuard);
        guard.position.z = -0.03;
        knife.add(guard);
        // 握柄
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.019, 0.11, 8), matHandle);
        handle.rotation.x = Math.PI / 2;
        handle.position.z = 0.035;
        knife.add(handle);
        // 持刀手（手套）
        const glove = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.1), new THREE.MeshStandardMaterial({ color: 0x22261f, roughness: 0.9 }));
        glove.position.set(0, -0.02, 0.04);
        knife.add(glove);
        // 前臂
        const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.3), new THREE.MeshStandardMaterial({ color: 0x2c3327, roughness: 0.9 }));
        forearm.position.set(0.04, -0.06, 0.22);
        forearm.rotation.x = -0.3;
        knife.add(forearm);

        knife.visible = false;
        this.camera.add(knife);
        this._executionKnife = knife;
        return knife;
    }

    // 处决：1.6秒动作，期间不能移动/开火；强制换刀，完成后倒地敌人立即死亡
    _startExecution(target) {
        if (!target || !target.downed || target.alive) return;
        this.fortifications?.cancel();
        this._executing = {
            target,
            timer: 1.6,
            duration: 1.6,
        };
        target._beingExecuted = true;
        target._executionProgress = 0;
        // 锁定玩家输入
        this.player._executionLock = true;
        this.player.velocity?.set?.(0, 0, 0);

        // 面向倒地敌人（处决对准）
        const dx = target.position.x - this.player.position.x;
        const dz = target.position.z - this.player.position.z;
        if (dx * dx + dz * dz > 0.01) {
            this.player.yaw = Math.atan2(-dx, -dz);
        }
        // 略微低头看躺地目标
        this.player.pitch = -0.35;

        if (this.weaponSystem) {
            this.weaponSystem.stopFire();
            this.weaponSystem.setAiming(false);
            // 彻底收起主武器（枪→刀切换；手臂在 weaponGroup 内一并隐藏）
            if (this.weaponSystem.weaponGroup) this.weaponSystem.weaponGroup.visible = false;
        }
        // 亮出匕首（从画面外预备位）
        const knife = this._getExecutionKnife();
        knife.visible = true;
        knife.position.set(0.55, -0.55, -0.25);
        knife.rotation.set(0.6, 0.5, 0.4);
        if (this.hud) this.hud.showNotification('处决中...', 1.4);
        if (this.player.addShake) this.player.addShake(0.12);
        if (this.audio?.playUISound) this.audio.playUISound('click');
    }

    _endExecution(target) {
        if (target) {
            target._beingExecuted = false;
            target._executionProgress = null;
        }
        this.player._executionLock = false;
        this._executing = null;
        if (this._executionKnife) this._executionKnife.visible = false;
        // 恢复主武器（含第一人称手臂）
        if (this.weaponSystem?.weaponGroup && !this.player.inVehicle && this.player.alive && !this.player.downed) {
            this.weaponSystem.weaponGroup.visible = true;
        }
    }

    _updateExecution(dt) {
        if (!this._executing) return;
        const ex = this._executing;
        const target = ex.target;

        // 目标已死亡/复活/超距 → 中断
        if (!target || !target.downed || target.alive ||
            !this.player.alive || this.player.downed ||
            this.player.position.distanceTo(target.position) > 3.5) {
            this._endExecution(target);
            return;
        }

        ex.timer -= dt;
        const p = 1 - ex.timer / ex.duration;
        // 同步给 bot 受刑动画
        target._executionProgress = p;

        // 持续面向目标 + 处决运镜（俯身压向躺地敌人）
        const dx = target.position.x - this.player.position.x;
        const dz = target.position.z - this.player.position.z;
        if (dx * dx + dz * dz > 0.01) {
            const desiredYaw = Math.atan2(-dx, -dz);
            let dyaw = desiredYaw - this.player.yaw;
            while (dyaw > Math.PI) dyaw -= Math.PI * 2;
            while (dyaw < -Math.PI) dyaw += Math.PI * 2;
            this.player.yaw += dyaw * Math.min(1, dt * 4);
        }
        // 镜头压低看向躺地目标胸口
        const lookDown = -0.25 - Math.sin(Math.min(p, 1) * Math.PI) * 0.28;
        this.player.pitch = THREE.MathUtils.lerp(this.player.pitch, lookDown, Math.min(1, dt * 5));
        // 处决时身体前倾滚转
        this.camera.rotation.z += Math.sin(p * Math.PI) * 0.04;

        // 全程确保枪隐藏、刀显示
        if (this.weaponSystem?.weaponGroup) this.weaponSystem.weaponGroup.visible = false;
        const knife = this._executionKnife;
        if (knife) knife.visible = true;

        // === 匕首动作序列（战地风格：拔刀→高举蓄力→猛刺胸口→拔出）===
        if (knife) {
            if (p < 0.18) {
                // 拔刀入画：从右髋部抽出上抬
                const t = p / 0.18;
                const e = 1 - (1 - t) * (1 - t);
                knife.position.set(0.55 - e * 0.32, -0.55 + e * 0.28, -0.25 - e * 0.2);
                knife.rotation.set(0.6 - e * 0.35, 0.5 - e * 0.3, 0.4 - e * 0.35);
            } else if (p < 0.48) {
                // 高举蓄力：举过右肩上方，刀尖朝下，微微颤抖
                const t = (p - 0.18) / 0.3;
                const e = t * t * (3 - 2 * t);
                const tremble = Math.sin(p * 55) * 0.008 * e;
                knife.position.set(0.23 - e * 0.08 + tremble, -0.27 + e * 0.48 + tremble * 0.5, -0.45 + e * 0.08);
                knife.rotation.set(0.25 + e * 1.35, 0.2 - e * 0.1, tremble * 4);
            } else if (p < 0.72) {
                // 猛刺：快速向下向前扎入躺地胸口（加速曲线）
                const t = (p - 0.48) / 0.24;
                const e = t * t * t; // 更狠的加速
                knife.position.set(0.15 + e * 0.02, 0.21 - e * 0.72, -0.37 - e * 0.32);
                knife.rotation.set(1.6 - e * 2.05, 0.1, e * 0.15);
            } else if (p < 0.85) {
                // 刺入停顿：刀没入，轻微搅动
                const t = (p - 0.72) / 0.13;
                const wiggle = Math.sin(t * Math.PI * 3) * 0.012;
                knife.position.set(0.17 + wiggle, -0.51 + wiggle * 0.5, -0.69);
                knife.rotation.set(-0.45 + wiggle * 2, 0.1, 0.15);
            } else {
                // 拔出回收：猛抽回再沉出画面
                const t = (p - 0.85) / 0.15;
                const e = t * t;
                knife.position.set(0.17 + e * 0.35, -0.51 - e * 0.25, -0.69 + e * 0.4);
                knife.rotation.set(-0.45 + e * 0.9, 0.1 + e * 0.25, 0.15 + e * 0.4);
            }
        }

        if (p >= 0.72 && !ex._struck) {
            // 刺入瞬间：音效+镜头猛沉+目标身上血雾（贴地高度）
            ex._struck = true;
            if (this.audio) this.audio.playHitConfirm();
            if (this.player.addShake) this.player.addShake(0.45);
            if (this.player._landDipVel !== undefined) this.player._landDipVel += 0.35;
            if (this.weaponSystem?.createBloodEffect && target.position) {
                // 躺地胸口约在 baseY + 0.25
                const stabPoint = target.position.clone();
                stabPoint.y += 0.28;
                const dir = stabPoint.clone().sub(this.camera.position).normalize();
                this.weaponSystem.createBloodEffect(stabPoint, dir);
                // 二次血雾强化处决感
                const weaponSystem = this.weaponSystem;
                this.transientFx.add({
                    owner: weaponSystem,
                    category: 'impact',
                    priority: 2,
                    delay: 0.08,
                    life: 0.001,
                    onActivate: () => {
                        const p2 = stabPoint.clone();
                        p2.y += 0.05;
                        weaponSystem.createBloodEffect(p2, dir);
                    },
                });
            }
        }

        if (ex.timer <= 0) {
            this._endExecution(target);
            // 立即终结（跳过流血倒计时；_finalizeDeath 触发 onKilled 走正常击杀结算）
            target.lastAttacker = this.player;
            target._scoreSettled = true;   // 处决独立计分，避免双重结算
            target._finalizeDeath?.();
            // 处决奖励
            this.playerStats.kills++;
            const score = 15;
            this.friendlyScore += score;
            this.hud.addKillMessage('你', target.name || '敌方士兵', '匕首处决', {
                isPlayerKill: true,
                killerTeam: 0,
                victimTeam: target.team ?? 1,
                showConfirm: true,
                scoreText: `+${score}`,
            });
            if (this.audio) this.audio.playUISound('capture');
        }
    }

    _canPlayerRevive(bot) {
        // 仅倒地可救，彻底死亡尸体不可 F 拉起
        if (!bot || bot.alive || !bot.downed || bot.team !== this.player?.team) return false;
        if (this.player.classType === 'medic') return true;
        return bot.squadId === 0;
    }

    _findNearbyRevivableBot(position, team) {
        if (!position || !this.player?.alive) return null;
        const range = this.player.classConfig?.reviveRange || CONFIG.GAME.reviveRange || 3;
        let best = null;
        let bestDist = range;
        for (const bot of this.bots) {
            if (!bot || bot.alive || !bot.downed || bot.team !== team || bot._assignedVehicle) continue;
            if (!this._canPlayerRevive(bot)) continue;
            const dist = bot.position.distanceTo(position);
            if (dist < bestDist) {
                bestDist = dist;
                best = bot;
            }
        }
        return best;
    }

    _reviveBot(bot, reviver = null) {
        if (!bot || bot.alive || !bot.downed) return false;
        if (bot._respawnHandle) {
            clearTimeout(bot._respawnHandle);
            bot._respawnHandle = null;
        }
        bot._respawnQueued = false;
        const pos = bot.position.clone();
        pos.y = this.world.getHeight(pos.x, pos.z);
        bot.spawn(pos);
        bot.health = Math.min(bot.health, this.player.classConfig?.reviveHealth || CONFIG.GAME.reviveHealth || 55);
        bot._ticketDeducted = false;
        bot._scoreSettled = false;
        bot._spotted = false;
        bot._spotTimer = 0;

        // 复活挽回增援资源（消耗战等模式据此减少损耗）
        this.gameMode?.onRevive?.(bot.team);

        if (reviver === this.player) {
            const score = this.player.classType === 'medic'
                ? (CONFIG.GAME.reviveScore || 20)
                : (CONFIG.GAME.squadReviveScore || 25);
            this.friendlyScore += score;
            this.playerStats.revives++;
            this.director?.recordContribution('revive', this.player, 1, { target: bot });
            if (this.hud) this.hud.showNotification(`Revive +${score}`, 1.8);
            if (this.audio) this.audio.playUISound('capture');
            this.nearbyReviveTarget = null;
        }
        return true;
    }

    _updateMedicRevives(dt) {
        const range = CONFIG.GAME.reviveRange || 3;

        // === 任何队友都可复活倒地的玩家（不限医疗兵）===
        if (this.player.downed && !this.player.alive) {
            for (const bot of this.bots) {
                if (!bot.alive || bot.team !== this.player.team || bot._assignedVehicle) continue;
                const dist = this.player.position.distanceTo(bot.position);
                if (dist < range) {
                    this.player.revive(bot);
                    // 复活后恢复第一人称武器
                    if (this.weaponSystem?.weaponGroup) this.weaponSystem.weaponGroup.visible = true;
                    if (this.hud.hideDownedOverlay) this.hud.hideDownedOverlay();
                    if (this.hud.hideDeployScreen) this.hud.hideDeployScreen();
                    if (this.hud.hideDeath) this.hud.hideDeath();
                    if (this.hud.showNotification) this.hud.showNotification(`被 ${bot.name} 救起！`, 2);
                    if (this.audio) this.audio.playUISound('capture');
                    break;
                }
            }
        }

        // === 医疗兵主动冲向并复活倒地队友（仅倒地；处决中不可救）===
        const seekRange = CONFIG.AI.medicReviveSeekRange || 45;
        for (const medic of this.bots) {
            if (!medic.alive || medic.classType !== 'medic' || medic._assignedVehicle) continue;
            medic._reviveThinkTimer = (medic._reviveThinkTimer || 0) - dt;
            if (medic._reviveThinkTimer > 0) continue;
            medic._reviveThinkTimer = 0.35 + Math.random() * 0.25;

            let target = null;
            let targetDist = seekRange;
            // 优先救玩家（同队倒地）
            if (this.player.downed && !this.player.alive && this.player.team === medic.team) {
                const d = medic.position.distanceTo(this.player.position);
                if (d < targetDist) {
                    targetDist = d;
                    target = this.player;
                }
            }
            for (const bot of this.bots) {
                if (!bot || bot === medic || bot.alive || bot.team !== medic.team || bot._assignedVehicle) continue;
                if (!bot.downed || bot._beingExecuted) continue;
                const dist = bot.position.distanceTo(medic.position);
                if (dist < targetDist) {
                    targetDist = dist;
                    target = bot;
                }
            }
            if (!target) {
                medic._reviveTarget = null;
                continue;
            }

            // 距离内：直接复活
            if (targetDist <= range) {
                if (target === this.player) {
                    this.player.revive(medic);
                    if (this.weaponSystem?.weaponGroup) this.weaponSystem.weaponGroup.visible = true;
                    if (this.hud.hideDownedOverlay) this.hud.hideDownedOverlay();
                    if (this.hud.hideDeployScreen) this.hud.hideDeployScreen();
                    if (this.hud.hideDeath) this.hud.hideDeath();
                    if (this.hud.showNotification) this.hud.showNotification(`被 ${medic.name} 救起！`, 2);
                    if (this.audio) this.audio.playUISound('capture');
                } else if (medic.medicHealCooldown <= 0) {
                    this._reviveBot(target, medic);
                    medic.medicHealCooldown = Math.max(medic.medicHealCooldown, CONFIG.AI.medicHealCooldown || 6);
                }
                medic._reviveTarget = null;
            } else {
                // 距离外：冲过去救人（覆盖巡逻/交战目标）
                medic._reviveTarget = target.position.clone();
            }
        }
    }

    // Bot 部署支援物资（战地5小队支援系统）
    // 医疗兵投掷医疗包、突击兵投掷弹药包、工程兵修复载具
    _updateBotDeployables(dt) {
        for (const bot of this.bots) {
            if (!bot.alive || bot._assignedVehicle) continue;
            bot._deployTimer = (bot._deployTimer || 0) - dt;
            if (bot._deployTimer > 0) continue;

            if (bot.classType === 'medic') {
                // 医疗兵：附近有低血量队友时投放医疗包
                let lowHealthNearby = 0;
                for (const t of this.bots) {
                    if (t === bot || !t.alive || t.team !== bot.team) continue;
                    if (t.health < 60 && bot.position.distanceTo(t.position) < 10) {
                        lowHealthNearby++;
                    }
                }
                if (lowHealthNearby >= 2) {
                    this._botDeployBag(bot, 'heal', 0xffffff);
                    bot._deployTimer = 20 + Math.random() * 5;
                } else {
                    bot._deployTimer = 5;
                }
            } else if (bot.classType === 'assault') {
                // 突击兵：附近有队友时投放弹药包
                let teammatesNearby = 0;
                for (const t of this.bots) {
                    if (t === bot || !t.alive || t.team !== bot.team) continue;
                    if (bot.position.distanceTo(t.position) < 12) teammatesNearby++;
                }
                if (teammatesNearby >= 2) {
                    this._botDeployBag(bot, 'ammo', 0xff8800);
                    bot._deployTimer = 25 + Math.random() * 5;
                } else {
                    bot._deployTimer = 5;
                }
            } else if (bot.classType === 'engineer') {
                // 工程兵：附近有受损友方载具时修复
                for (const vehicle of this.vehicles) {
                    if (!vehicle.alive || vehicle.team !== bot.team) continue;
                    if (vehicle.health < vehicle.maxHealth * 0.7) {
                        const dist = bot.position.distanceTo(vehicle.position);
                        if (dist < 5) {
                            vehicle.repair(30);
                            this._createRepairSparks(vehicle.position);
                            bot._deployTimer = 6;
                            break;
                        }
                    }
                }
                bot._deployTimer = bot._deployTimer || 3;
            } else {
                bot._deployTimer = 10;
            }
        }
    }

    // Bot 投放部署物
    _botDeployBag(bot, type, color) {
        const pos = bot.position.clone();
        pos.y = this.world.getHeight(pos.x, pos.z) + 0.1;
        this._deployables = this._deployables || [];
        const gadgetKey = type === 'heal' ? 'medbag' : 'ammobag';
        const cfg = CONFIG.GADGETS[gadgetKey];
        if (!cfg) return;
        const deployable = {
            type: type,
            position: pos,
            radius: cfg.radius,
            remainingTime: cfg.duration,
            team: bot.team,
            owner: bot,
            mesh: this._createDeployableMesh(pos, color, type === 'heal' ? '医疗' : '弹药'),
        };
        this._deployables.push(deployable);
    }

    // 更新拖拽状态：倒地队友跟随玩家移动（战地5动作系统）
    _updateDragging(dt) {
        if (!this.player?.isDragging()) return;
        const bot = this.player._draggingBot;
        if (!bot) {
            this.player._stopDrag();
            return;
        }
        // 中断条件：玩家或目标状态变化
        if (!this.player.alive || this.player.downed || this.player.inVehicle) {
            this.player._stopDrag();
            return;
        }
        if (bot.alive || !bot.downed) {
            // 队友被救活或彻底死亡 → 停止拖拽
            this.player._stopDrag();
            if (this.hud?.showNotification) this.hud.showNotification('队友已脱离倒地状态', 1.5);
            return;
        }
        // 距离过远（异常情况）→ 自动脱手
        const dist = bot.position.distanceTo(this.player.position);
        if (dist > 6) {
            this.player._stopDrag();
            if (this.hud?.showNotification) this.hud.showNotification('拖拽距离过远，已放开队友', 1.5);
            return;
        }

        // 拖拽位置：玩家身后 1.4m，贴地
        const yaw = this.player.yaw || 0;
        const offsetX = -Math.sin(yaw) * -1.4;   // 玩家身后
        const offsetZ = -Math.cos(yaw) * -1.4;
        const targetX = this.player.position.x + offsetX;
        const targetZ = this.player.position.z + offsetZ;
        const groundY = this.world.getHeight(targetX, targetZ);

        // 平滑跟随（避免瞬移感）
        const followSpeed = 12;
        bot.position.x += (targetX - bot.position.x) * Math.min(1, followSpeed * dt);
        bot.position.z += (targetZ - bot.position.z) * Math.min(1, followSpeed * dt);
        bot.position.y = groundY;

        // 同步模型：保持躺地姿态，朝向拖拽方向
        if (bot.model) {
            bot.model.userData.baseY = groundY;
            bot.model.position.copy(bot.position);
            bot.model.rotation.y = yaw;
            // 拖拽时强制完全倒地姿态（progress=0.5 → eased=1）
            bot.deathProgress = 0.5;
            CharacterModel.animateDowned(bot.model, 0.5);
            // 被拖时身体略微被拉直（少一点侧偏）
            bot.model.rotation.z = THREE.MathUtils.lerp(bot.model.rotation.z, 0.25, 0.15);
            bot.model.position.y = groundY - 0.85;
        }
    }

    _updateBattleOrders(dt) {
        if (this.director) {
            const mission = this.director.mission;
            this.currentOrder = mission && ['announced', 'active'].includes(this.director.missionState) && mission.target
                ? {
                    id: mission.id,
                    type: mission.type === 'defend' ? 'defend' : 'attack',
                    point: mission.target,
                    kind: mission.type,
                    completed: false,
                    holdTime: mission.holdTime || 0,
                }
                : null;
            return;
        }
        if (this.currentOrder?.point?.maxHealth && !this.currentOrder.point.alive) {
            this.currentOrder = null;
            this._orderTimer = 5;
            return;
        }

        if (this.currentOrder && this.currentOrder.type === 'defend') {
            const target = this.currentOrder.point;
            let safe = false;
            if (target?.maxHealth) {
                safe = target.alive && target.team === 0 && target.health > target.maxHealth * 0.85;
                if (!target.alive) {
                    this.currentOrder = null;
                    this._orderTimer = 5;
                    return;
                }
            } else {
                safe = target.team === 0 && !(target.captureProgress > 0 && target.capturingTeam === 1);
            }
            this.currentOrder.holdTime = safe ? (this.currentOrder.holdTime || 0) + dt : 0;
            if (this.currentOrder.holdTime >= 20) {
                this.friendlyScore += CONFIG.GAME.orderCompleteBonus;
                const label = target?.maxHealth ? target.name : `据点 ${target.name}`;
                this.hud.showKillstreak('防守成功', `${label} 稳定  +${CONFIG.GAME.orderCompleteBonus}`);
                this.currentOrder = null;
                this._orderTimer = 5;
                return;
            }
        }

        this._orderTimer -= dt;
        if (this._orderTimer > 0 && this.currentOrder) {
            return;
        }

        this._orderTimer = CONFIG.GAME.orderInterval;
        const target = this._selectPriorityBattleTarget();
        if (!target) return;

        const action = target.team === 0 ? 'defend' : 'attack';
        this.currentOrder = {
            id: `${action}_${target.name}_${Date.now()}`,
            type: action,
            point: target,
            kind: target.maxHealth ? 'objective' : 'capture',
            completed: false,
            holdTime: 0,
        };

        const targetLabel = target.maxHealth ? target.name : `据点 ${target.name}`;
        const text = action === 'attack'
            ? `新命令：进攻${target.maxHealth ? '次要目标 ' : ''}${targetLabel}`
            : `新命令：防守${target.maxHealth ? '次要目标 ' : ''}${targetLabel}`;
        this.hud.showNotification(text, 3);
    }

    _selectPriorityBattleTarget() {
        let best = this._selectPriorityCapturePoint();
        let bestScore = best ? this._scoreCaptureTarget(best) : -Infinity;

        const objectives = this.supportsStrategicObjectives() && this.world.getStrategicObjectives
            ? this.world.getStrategicObjectives()
            : [];
        for (const objective of objectives) {
            if (!objective.alive) continue;
            let score = objective.team === 1 ? 58 : 22;
            if (objective.type === 'fuel') score += 10;
            const healthPct = objective.maxHealth > 0 ? objective.health / objective.maxHealth : 1;
            score += (1 - healthPct) * 24;
            const dx = this.player ? this.player.position.x - objective.position.x : 0;
            const dz = this.player ? this.player.position.z - objective.position.z : 0;
            score -= Math.sqrt(dx * dx + dz * dz) * 0.06;

            if (score > bestScore) {
                bestScore = score;
                best = objective;
            }
        }

        return best;
    }

    _scoreCaptureTarget(cp) {
        if (!cp || cp.locked) return -Infinity;
        let score = 0;
        if (cp.team === 1) score += 60;
        else if (cp.team === -1) score += 45;
        else score += 15;

        if (cp.captureProgress > 0) {
            score += cp.capturingTeam === 1 ? 45 : 20;
        }

        const dx = this.player ? this.player.position.x - cp.x : 0;
        const dz = this.player ? this.player.position.z - cp.z : 0;
        score -= Math.sqrt(dx * dx + dz * dz) * 0.08;
        return score;
    }

    _selectPriorityCapturePoint() {
        let best = null;
        let bestScore = -Infinity;
        for (const cp of this.world.capturePoints) {
            const score = this._scoreCaptureTarget(cp);
            if (score > bestScore) {
                bestScore = score;
                best = cp;
            }
        }
        return best;
    }

    _steerBotByOrder(bot, dt) {
        const ordersDisabled = this._teamStrategicEffects?.[bot.team]?.ordersDisabled;
        const priority = ordersDisabled
            ? null
            : this.director?.getPriorityTarget(bot.team) || this.currentOrder?.point || this.gameMode?.getPriorityTarget?.(bot.team);
        bot.setBattlefieldPriority?.(priority || null);
        const supply = this._supplyDrops.find(drop => drop.landed && drop.team === bot.team && drop.kind === 'director') || null;
        bot.setSupportTargets?.({ supply, rally: this._directorRally, smokeZones: this._directorSmokeZones });
        if (!priority || !bot.alive) return;
        if (bot.team !== 0 && bot.team !== 1) return;
        if (bot.state !== 'patrol' && bot.state !== 'capture') return;

        bot._orderSteerTimer = (bot._orderSteerTimer || 0) - dt;
        if (bot._orderSteerTimer > 0) return;
        bot._orderSteerTimer = (2 + Math.random() * 2) / this._battleIntensity;

        const cp = priority;
        const coords = this._getBattleTargetCoords(cp);
        const offset = bot.team === 0 ? 8 : 12;
        const angle = Math.random() * Math.PI * 2;
        bot.patrolTarget = new THREE.Vector3(
            coords.x + Math.cos(angle) * offset,
            0,
            coords.z + Math.sin(angle) * offset
        );
    }

    _getBattleTargetCoords(target) {
        if (!target) return { x: 0, y: 0, z: 0 };
        if (target.position) return { x: target.position.x, y: target.position.y || 0, z: target.position.z };
        return { x: target.x || 0, y: target.y || 0, z: target.z || 0 };
    }

    _updateBattleIntensity(dt) {
        this._battleIntensityTimer -= dt;
        if (this._battleIntensityTimer > 0) return;
        this._battleIntensityTimer = 5;

        let contested = 0;
        let friendly = 0;
        let enemy = 0;
        for (const cp of this.world.capturePoints) {
            if (cp.captureProgress > 0) contested++;
            if (cp.team === 0) friendly++;
            else if (cp.team === 1) enemy++;
        }

        const ticketGap = Math.abs(this.friendlyTickets - this.enemyTickets);
        this._battleIntensity = THREE.MathUtils.clamp(1 + contested * 0.25 + ticketGap / 500 + Math.abs(friendly - enemy) * 0.1, 0.8, 1.6);
        if (this.audio?.setBattlefieldAmbienceIntensity) {
            this.audio.setBattlefieldAmbienceIntensity(this._battleIntensity / 1.6);
        }
    }

    _assignAIVehicles(dt = 0.016) {
        if (this._vehicleAiStartTimer > 0) {
            this._vehicleAiStartTimer -= dt;
            return;
        }

        // 每0.5秒尝试一次分配，避免每帧全量扫描
        this._vehicleAssignTimer = (this._vehicleAssignTimer || 0) - dt;
        if (this._vehicleAssignTimer > 0) return;
        this._vehicleAssignTimer = 0.5;

        // 每队最多 2 台 AI 驾驶载具，避免全图载具同时思考
        const teamCounts = { 0: 0, 1: 0 };
        for (const vehicle of this.vehicles) {
            if (this._vehicleAiAssignments.has(vehicle)) {
                teamCounts[vehicle.team] = (teamCounts[vehicle.team] || 0) + 1;
            }
        }

        for (const vehicle of this.vehicles) {
            if (!vehicle.alive) continue;
            if (this.player && this.player.inVehicle === vehicle) continue;
            if (vehicle.occupants[0]) continue;
            if (this._vehicleAiAssignments.has(vehicle)) continue;
            // 固定翼需要鼠标俯仰操控，AI 不驾驶（会失速撞地），留给玩家
            if (vehicle.config?.isPlane) continue;
            if ((teamCounts[vehicle.team] || 0) >= (CONFIG.GAME.aiVehicleMaxPerTeam || 1)) continue;

            const ordersDisabled = this._teamStrategicEffects?.[vehicle.team]?.ordersDisabled;
            const cp = (!ordersDisabled && this.currentOrder?.point) || this._selectPriorityCapturePoint();
            if (!cp) continue;
            const coords = this._getBattleTargetCoords(cp);
            const dx = vehicle.position.x - coords.x;
            const dz = vehicle.position.z - coords.z;
            const distToObjective = Math.sqrt(dx * dx + dz * dz);
            if (distToObjective < 35) continue;

            let bestBot = null;
            let bestDist = 10 + this._battleIntensity * 4;
            for (const bot of this.bots) {
                if (!bot.alive || bot.team !== vehicle.team || bot._assignedVehicle) continue;
                if (bot.classType !== 'engineer' && vehicle.config.hasWeapon && Math.random() > 0.35) continue;
                const dist = bot.position.distanceTo(vehicle.position);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestBot = bot;
                }
            }
            if (!bestBot) continue;

            vehicle.enter(bestBot, 0);
            bestBot._assignedVehicle = vehicle;
            bestBot.inVehicle = vehicle;
            bestBot._vehicleSeat = 0;
            bestBot.model.visible = false;
            this._vehicleAiAssignments.set(vehicle, bestBot);
            teamCounts[vehicle.team] = (teamCounts[vehicle.team] || 0) + 1;
        }
    }

    _releaseVehicleOccupant(occupant) {
        if (!occupant) return;
        if (occupant._assignedVehicle) {
            const vehicle = occupant._assignedVehicle;
            for (let i = 0; i < vehicle.occupants.length; i++) {
                if (vehicle.occupants[i] === occupant) vehicle.exit(i);
            }
            occupant._assignedVehicle = null;
            occupant.inVehicle = null;
            occupant._vehicleSeat = 0;
            occupant.model.visible = occupant.alive;
            const exitPos = vehicle.position.clone();
            exitPos.x += 2 + (Math.random() - 0.5) * 2;
            exitPos.z += (Math.random() - 0.5) * 2;
            exitPos.y = this.world.getHeight(exitPos.x, exitPos.z);
            occupant.position.copy(exitPos);
            this._vehicleAiAssignments.delete(vehicle);
        } else {
            // 乘员状态已被其他路径清理（如坠毁），确保 assignment map 无残留，
            // 否则载具重生后因 map.has 残留而永远不再被 AI 驾驶
            for (const [v, b] of this._vehicleAiAssignments) {
                if (b === occupant) this._vehicleAiAssignments.delete(v);
            }
        }
    }

    _getAIVehicleInput(vehicle, allTargets, dt = 0.016) {
        const driver = this._vehicleAiAssignments.get(vehicle);
        if (!driver || !driver.alive) {
            if (driver) this._releaseVehicleOccupant(driver);
            return null;
        }

        // 载具起火（血量<40%）时 AI 驾驶员弃车逃生，避免开到毁
        if (vehicle.health / vehicle.config.maxHealth < 0.4) {
            this._releaseVehicleOccupant(driver);
            return null;
        }

        if (vehicle._aiFireGap > 0) vehicle._aiFireGap -= dt;

        // 思考节流：每0.2秒更新目标/命令，输入结果缓存复用
        vehicle._aiThinkTimer = (vehicle._aiThinkTimer || 0) - dt;
        if (vehicle._aiThinkTimer <= 0 || !vehicle._cachedAIInput) {
            vehicle._aiThinkTimer = 0.2;
            const objective = this._getVehicleObjective(vehicle);
            const target = this._findVehicleTarget(vehicle, allTargets);
            vehicle._aiObjective = objective;
            vehicle._aiTarget = target;

            if (vehicle.config.hasWeapon && target && target.position) {
                this._tmpObjectivePos.copy(target.position);
                this._tmpObjectivePos.y += target.type ? 1.2 : 1.4;
                vehicle.aimAtPoint(this._tmpObjectivePos);
            } else if (objective) {
                const coords = this._getBattleTargetCoords(objective);
                this._tmpObjectivePos.set(coords.x, vehicle.position.y + 1.5, coords.z);
                vehicle.aimAtPoint(this._tmpObjectivePos);
            }

            vehicle._cachedAIInput = this._createVehicleInput(vehicle, objective, target);
        } else if (vehicle.config.hasWeapon && vehicle._aiTarget && vehicle._aiTarget.position) {
            // 轻量瞄准刷新
            this._tmpObjectivePos.copy(vehicle._aiTarget.position);
            this._tmpObjectivePos.y += vehicle._aiTarget.type ? 1.2 : 1.4;
            vehicle.aimAtPoint(this._tmpObjectivePos);
        }

        return vehicle._cachedAIInput;
    }

    _getVehicleObjective(vehicle) {
        const ordersDisabled = this._teamStrategicEffects?.[vehicle.team]?.ordersDisabled;
        if (!ordersDisabled && vehicle.team === 0 && this.currentOrder?.point) return this.currentOrder.point;

        let best = null;
        let bestScore = -Infinity;
        for (const cp of this.world.capturePoints) {
            let score = cp.team === vehicle.team ? 5 : 50;
            if (cp.captureProgress > 0 && cp.capturingTeam !== vehicle.team) score += 35;
            const dx = vehicle.position.x - cp.x;
            const dz = vehicle.position.z - cp.z;
            score -= Math.sqrt(dx * dx + dz * dz) * 0.05;
            if (score > bestScore) {
                bestScore = score;
                best = cp;
            }
        }
        const objectives = this.supportsStrategicObjectives() && this.world.getStrategicObjectives
            ? this.world.getStrategicObjectives()
            : [];
        for (const objective of objectives) {
            if (!objective.alive) continue;
            let score = objective.team === vehicle.team ? 8 : 56;
            if (objective.type === 'fuel') score += 10;
            const healthPct = objective.maxHealth > 0 ? objective.health / objective.maxHealth : 1;
            score += (1 - healthPct) * 18;
            const dx = vehicle.position.x - objective.position.x;
            const dz = vehicle.position.z - objective.position.z;
            score -= Math.sqrt(dx * dx + dz * dz) * 0.045;
            if (score > bestScore) {
                bestScore = score;
                best = objective;
            }
        }
        return best;
    }

    _findVehicleTarget(vehicle, allTargets) {
        if (!vehicle.config.hasWeapon) return null;
        let best = null;
        let bestDist = vehicle.config.cannonRange || 160;
        for (const target of allTargets) {
            if (!target || target === vehicle || !target.alive) continue;
            if (target.team === vehicle.team) continue;
            if (target._assignedVehicle === vehicle) continue;
            const dist = vehicle.position.distanceTo(target.position);
            if (dist < bestDist) {
                bestDist = dist;
                best = target;
            }
        }
        return best;
    }

    _createVehicleInput(vehicle, objective, target) {
        const keys = vehicle._aiKeys || (vehicle._aiKeys = new Set());
        keys.clear();
        let mouseFire = false;
        let targetPos = null;

        // === 卡住脱困（无额外 raycast）：位移过小 + 在推进 → 倒车偏航 1.5s ===
        const now = performance.now() / 1000;
        if (!vehicle._aiUnstuckCheckAt) vehicle._aiUnstuckCheckAt = now;
        if (!vehicle._aiLastPos) {
            vehicle._aiLastPos = vehicle.position.clone();
        }
        const finishInput = (fire) => {
            if (!vehicle._aiInputObj) {
                vehicle._aiInputObj = {
                    isKeyDown: (code) => vehicle._aiKeys.has(code),
                    isMouseDown: (button) => button === 0 && vehicle._aiWantFire && vehicle.cannonCooldown <= 0,
                };
            }
            vehicle._aiWantFire = !!fire;
            return vehicle._aiInputObj;
        };
        if (vehicle._aiUnstuckUntil && now < vehicle._aiUnstuckUntil) {
            keys.add('KeyS');
            keys.add(vehicle._aiUnstuckDir > 0 ? 'KeyA' : 'KeyD');
            if (vehicle.config.isAircraft) keys.add('Space');
            return finishInput(false);
        }
        if (now - vehicle._aiUnstuckCheckAt >= 0.25) {
            const dxm = vehicle.position.x - vehicle._aiLastPos.x;
            const dzm = vehicle.position.z - vehicle._aiLastPos.z;
            const moved = Math.sqrt(dxm * dxm + dzm * dzm);
            vehicle._aiLastPos.copy(vehicle.position);
            vehicle._aiUnstuckCheckAt = now;
            if (moved < 0.4 && (vehicle._collisionCooldown > 0 || Math.abs(vehicle.velocity) < 1.2)) {
                vehicle._aiUnstuckUntil = now + 1.5;
                vehicle._aiUnstuckDir = Math.random() < 0.5 ? 1 : -1;
                keys.add('KeyS');
                keys.add(vehicle._aiUnstuckDir > 0 ? 'KeyA' : 'KeyD');
                if (vehicle.config.isAircraft) keys.add('Space');
                return finishInput(false);
            }
        }

        if (target && vehicle.config.hasWeapon) {
            const dx0 = vehicle.position.x - target.position.x;
            const dz0 = vehicle.position.z - target.position.z;
            const dist = Math.sqrt(dx0 * dx0 + dz0 * dz0);
            targetPos = this._tmpObjectivePos.set(target.position.x, target.position.y, target.position.z);
            // 机炮/航炮降低开火频率，减少射线检测开销
            const fireReady = vehicle.type === 'tank'
                ? vehicle.cannonCooldown <= 0
                : (vehicle._aiFireGap || 0) <= 0 && vehicle.cannonCooldown <= 0;
            mouseFire = fireReady && dist < (vehicle.config.cannonRange || 120) * 0.85;
            if (mouseFire && vehicle.type !== 'tank') {
                vehicle._aiFireGap = 0.35;
            }
        } else if (objective) {
            const coords = this._getBattleTargetCoords(objective);
            targetPos = this._tmpObjectivePos.set(coords.x, vehicle.position.y, coords.z);
        }

        if (targetPos) {
            // 深水目标：地面载具改追附近高地，避免一直冲海里
            if (!vehicle.config.isAircraft && this.world.isUnderwater?.(targetPos.x, targetPos.z)) {
                targetPos = null;
            }
        }
        if (targetPos) {
            const dx = targetPos.x - vehicle.position.x;
            const dz = targetPos.z - vehicle.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const desiredYaw = Math.atan2(-dx, -dz);
            const yawDiff = this._normalizeAngle(desiredYaw - vehicle.yaw);

            if (Math.abs(yawDiff) > 0.12) {
                keys.add(yawDiff > 0 ? 'KeyA' : 'KeyD');
            }
            if (dist > (vehicle.config.isAircraft ? 25 : 10)) {
                keys.add('KeyW');
            } else if (!vehicle.config.isAircraft && vehicle.velocity > 4) {
                keys.add('KeyS');
            }
            // 前方 6m 深水：地面载具不加速，改为转向
            if (!vehicle.config.isAircraft && keys.has('KeyW')) {
                const fx = vehicle.position.x - Math.sin(vehicle.yaw) * 6;
                const fz = vehicle.position.z - Math.cos(vehicle.yaw) * 6;
                if (this.world.isUnderwater?.(fx, fz)) {
                    keys.delete('KeyW');
                    keys.add(Math.random() < 0.5 ? 'KeyA' : 'KeyD');
                    keys.add('KeyS');
                }
            }
            if (vehicle.config.isAircraft) {
                const groundY = this.world.getHeight(vehicle.position.x, vehicle.position.z);
                const desiredAlt = target ? 25 : 18;
                if (vehicle.position.y - groundY < desiredAlt) {
                    keys.add('Space');
                    // 固定翼无自动悬停，低了必须抬头爬升（直升机靠旋翼，无需额外指令）
                    if (vehicle.config.isPlane) keys.add('ShiftLeft');
                }
                // 固定翼 KeyS = 推杆低头（非着陆时），直升机 ShiftLeft = 下降
                if (vehicle.position.y - groundY > desiredAlt + 15) {
                    keys.add(vehicle.config.isPlane ? 'KeyS' : 'ShiftLeft');
                }
            }
        }

        if (!vehicle.config.isAircraft && Math.abs(vehicle.lateralVelocity) > 4) {
            keys.add('Space');
        }

        if (!vehicle._aiInputObj) {
            vehicle._aiInputObj = {
                isKeyDown: (code) => vehicle._aiKeys.has(code),
                isMouseDown: (button) => button === 0 && vehicle._aiWantFire && vehicle.cannonCooldown <= 0,
            };
        }
        vehicle._aiWantFire = mouseFire;
        return vehicle._aiInputObj;
    }

    _normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    _queueVehicleRespawn(vehicle) {
        if (this._vehicleRespawns.some(r => r.vehicle === vehicle)) return;
        const driver = this._vehicleAiAssignments.get(vehicle);
        if (driver) this._releaseVehicleOccupant(driver);
        const strategicDelay = this._teamStrategicEffects?.[vehicle.team]?.vehicleRespawnDelay || 0;
        this._vehicleRespawns.push({
            vehicle,
            time: CONFIG.GAME.vehicleRespawnTime + strategicDelay,
            strategicDelayApplied: strategicDelay > 0,
        });
    }

    _updateVehicleRespawns(dt) {
        for (let i = this._vehicleRespawns.length - 1; i >= 0; i--) {
            const item = this._vehicleRespawns[i];
            item.time -= dt;
            if (item.time <= 0) {
                this._restoreVehicle(item.vehicle);
                this._vehicleRespawns.splice(i, 1);
            }
        }
    }

    _updateCapturePointScoring(dt) {
        // 如果有游戏模式，票数衰减由gameMode.update处理
        if (this.gameMode) {
            this.gameMode.update(dt);
            this.timeLeft = this.gameMode.matchTimer;
            // 同步票数
            this.friendlyTickets = this.gameMode.teamTickets[0];
            this.enemyTickets = this.gameMode.teamTickets[1];
            return;
        }
        // 兼容旧逻辑
        let friendlyCps = 0;
        let enemyCps = 0;
        for (const cp of this.world.capturePoints) {
            if (cp.team === 0) {
                this.friendlyScore += CONFIG.GAME.capturePointPoints * dt;
                friendlyCps++;
            } else if (cp.team === 1) {
                this.enemyScore += CONFIG.GAME.capturePointPoints * dt;
                enemyCps++;
            }
        }
        if (friendlyCps > enemyCps) {
            this.enemyTickets -= CONFIG.GAME.ticketBleedRate * (friendlyCps - enemyCps) * dt;
        } else if (enemyCps > friendlyCps) {
            this.friendlyTickets -= CONFIG.GAME.ticketBleedRate * (enemyCps - friendlyCps) * dt;
        }
    }

    _updateCapturePointSupport(dt) {
        if (!this.world?.capturePoints) return;
        const supportRadius = 6;

        for (const cp of this.world.capturePoints) {
            if (!cp.supportPosition || cp.team < 0) continue;

            if (this.player?.alive && this.player.team === cp.team) {
                const dist = this.player.position.distanceTo(cp.supportPosition);
                if (dist < supportRadius) {
                    this.player.health = Math.min(this.player.health + 8 * dt, this.player.maxHealth);
                    this.player.armor = Math.min(this.player.armor + 5 * dt, this.player.maxArmor || CONFIG.PLAYER.maxArmor);
                    if (this.weaponSystem) {
                        for (const wpn of this.weaponSystem.weapons) {
                            wpn.reserveAmmo = Math.min(wpn.reserveAmmo + 16 * dt, wpn.config.reserveAmmo);
                        }
                    }
                    const now = performance.now() / 1000;
                    if (!cp._playerSupportNotified || now - cp._playerSupportNotified > 8) {
                        cp._playerSupportNotified = now;
                        this.hud.showNotification(`${cp.name} ${cp.label || ''} 补给中`, 1.5);
                    }
                }
            }

            for (const bot of this.bots) {
                if (!bot.alive || bot.team !== cp.team) continue;
                const dist = bot.position.distanceTo(cp.supportPosition);
                if (dist < supportRadius) {
                    bot.health = Math.min(bot.health + 6 * dt, CONFIG.AI.health);
                    bot.reserveAmmo = Math.min(bot.reserveAmmo + 14 * dt, bot.weaponConfig.reserveAmmo);
                }
            }
        }
    }

    _checkGameOver() {
        // 委托给游戏模式系统
        if (this.gameMode) {
            const winner = this.gameMode.checkGameOver();
            if (winner) {
                this._endGame(winner === 'friendly' || winner === true);
                return;
            }
            // 同步票数到旧字段（兼容HUD）
            this.friendlyTickets = this.gameMode.teamTickets[0];
            this.enemyTickets = this.gameMode.teamTickets[1];
            return;
        }
        // 兼容旧逻辑（无gameMode时）
        if (this.friendlyTickets <= 0) {
            this._endGame(false);
            return;
        }
        if (this.enemyTickets <= 0) {
            this._endGame(true);
            return;
        }
        if (this.friendlyScore >= CONFIG.GAME.teamScoreLimit) {
            this._endGame(true);
        } else if (this.enemyScore >= CONFIG.GAME.teamScoreLimit) {
            this._endGame(false);
        } else if (this.timeLeft <= 0) {
            this._endGame(this.friendlyScore > this.enemyScore);
        }
    }

    // === 3D世界标记更新 ===
    _updateWorldMarkers() {
        const markers = [];

        // 据点标记 — 仅显示250米内的据点3D标记，更远的据点在小地图上显示
        // （之前所有据点常驻显示导致"满屏标点"）
        for (const cp of this.world.capturePoints) {
            const dx = cp.x - this.player.position.x;
            const dz = cp.z - this.player.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 250) continue;

            let type = 'neutral';
            if (cp.team === 0) type = 'friendly';
            else if (cp.team === 1) type = 'enemy';

            markers.push({
                id: 'cp_' + cp.name,
                position: new THREE.Vector3(cp.x, cp.y + 14, cp.z),
                type: type,
                label: cp.name,
                text: cp.label || `据点 ${cp.name}`,
                distance: dist,
                _el: this._markerCache?.['cp_' + cp.name],
            });
        }

        // 战略目标标记
        const objectives = this.supportsStrategicObjectives() && this.world.getStrategicObjectives
            ? this.world.getStrategicObjectives()
            : [];
        for (const objective of objectives) {
            const dx = objective.position.x - this.player.position.x;
            const dz = objective.position.z - this.player.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const healthPct = objective.maxHealth > 0 ? Math.ceil((objective.health / objective.maxHealth) * 100) : 0;

            markers.push({
                id: 'obj_' + objective.id,
                position: objective.position.clone().add(new THREE.Vector3(0, objective.type === 'fuel' ? 4 : 6, 0)),
                type: 'objective',
                label: objective.alive ? 'X' : '✓',
                text: objective.alive ? `${objective.name} ${healthPct}%` : `${objective.name} 已摧毁`,
                distance: dist,
                _el: this._markerCache?.['obj_' + objective.id],
            });
        }

        // 空投标记
        for (const drop of this._supplyDrops) {
            if (!drop.landed) continue;
            const dx = drop.position.x - this.player.position.x;
            const dz = drop.position.z - this.player.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            markers.push({
                id: 'supply_' + drop.id,
                position: drop.position.clone().add(new THREE.Vector3(0, 3, 0)),
                type: 'supply',
                label: 'S',
                text: '补给箱',
                distance: dist,
                _el: this._markerCache?.['supply_' + drop.id],
            });
        }

        if (!this.director && this.currentOrder && this.currentOrder.point) {
            const cp = this.currentOrder.point;
            const coords = this._getBattleTargetCoords(cp);
            const dx = coords.x - this.player.position.x;
            const dz = coords.z - this.player.position.z;
            markers.push({
                id: 'order_' + cp.name,
                position: new THREE.Vector3(coords.x, (coords.y || cp.y || 0) + 18, coords.z),
                type: 'order',
                label: this.currentOrder.type === 'attack' ? '!' : '盾',
                text: this.currentOrder.type === 'attack' ? '进攻命令' : '防守命令',
                distance: Math.sqrt(dx * dx + dz * dz),
                _el: this._markerCache?.['order_' + cp.name],
            });
        }

        for (const directorMarker of this.director?.getWorldMarkers?.() || []) {
            const source = directorMarker.position;
            if (!source || !Number.isFinite(source.x) || !Number.isFinite(source.z)) continue;
            const baseY = Number.isFinite(source.y) ? source.y : this.world.getHeight(source.x, source.z);
            const position = new THREE.Vector3(source.x, baseY + 6, source.z);
            const dx = position.x - this.player.position.x;
            const dz = position.z - this.player.position.z;
            markers.push({
                ...directorMarker,
                position,
                distance: Math.sqrt(dx * dx + dz * dz),
                _el: this._markerCache?.[directorMarker.id],
            });
        }

        for (const bot of this.bots) {
            if (!bot.alive || bot.team === this.player.team || !bot._spotted) continue;
            const dx = bot.position.x - this.player.position.x;
            const dz = bot.position.z - this.player.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            markers.push({
                id: 'spot_' + bot.name,
                position: bot.position.clone().add(new THREE.Vector3(0, 2.2, 0)),
                type: 'spotted',
                label: '!',
                text: '已标记敌人',
                distance: dist,
                _el: this._markerCache?.['spot_' + bot.name],
            });
        }

        // 缓存marker元素引用
        this.hud.updateWorldMarkers(markers, this.camera);
        this._markerCache = {};
        for (const m of markers) {
            if (m._el && m._el.style) {
                this._markerCache[m.id] = m._el;
            }
        }
    }

    // === 部署界面实时更新 ===
    _updateDeployScreenPoints() {
        const cards = this.hud.elements.deployPoints.querySelectorAll('.deploy-point-card');
        cards.forEach(card => {
            const cpName = card.dataset.cpName || card.querySelector('.dp-letter')?.textContent;
            const cp = this.world.capturePoints.find(c => c.name === cpName);
            if (!cp) return;
            const statusEl = card.querySelector('.dp-status');
            if (!statusEl) return;
            if (cp.captureProgress > 0 && cp.capturingTeam !== 0) {
                statusEl.className = 'dp-status contested';
                statusEl.textContent = '争夺中!';
            } else {
                statusEl.className = 'dp-status friendly';
                statusEl.textContent = '己方控制';
            }
        });
    }

    // 自动选择最近的我方据点
    _autoSelectDeployPoint() {
        let nearestCp = null;
        let nearestDist = Infinity;
        for (const cp of this.world.capturePoints) {
            if (cp.team !== 0) continue; // 只选己方控制的
            const dx = cp.x - this.player.position.x;
            const dz = cp.z - this.player.position.z;
            const dist = dx * dx + dz * dz;
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestCp = cp;
            }
        }
        if (nearestCp) {
            this.hud._selectedDeployPoint = nearestCp;
        }
    }

    // === 空投补给系统 ===
    _updateSupplyDrops(dt) {
        // 定时生成空投
        this._supplyDropTimer -= dt;
        if (this._supplyDropTimer <= 0) {
            this._supplyDropTimer = this._supplyDropInterval;
            this._spawnSupplyDrop();
        }

        // 更新已有空投
        for (let i = this._supplyDrops.length - 1; i >= 0; i--) {
            const drop = this._supplyDrops[i];

            if (!drop.landed) {
                // 下落
                drop.velocityY -= 20 * dt;
                drop.position.y += drop.velocityY * dt;
                const groundY = this.world.getHeight(drop.position.x, drop.position.z);
                if (drop.position.y <= groundY + 0.5) {
                    drop.position.y = groundY + 0.5;
                    drop.landed = true;
                    drop.remainingTime = drop.duration;
                    this.hud.showNotification('补给箱已落地！查看地图标记', 4);
                    if (this.audio) this.audio.playUISound('capture');
                }
                drop.mesh.position.copy(drop.position);
                // 降落伞旋转
                if (drop.parachute) {
                    drop.parachute.rotation.y += dt * 0.5;
                }
            } else {
                drop.remainingTime -= dt;
                if (drop.kind === 'mission') {
                    let friendly = 0;
                    let enemy = 0;
                    if (this.player.alive && this.player.position.distanceTo(drop.position) < drop.radius) friendly++;
                    for (const bot of this.bots) {
                        if (!bot.alive || bot.position.distanceTo(drop.position) >= drop.radius) continue;
                        if (bot.team === 0) friendly++;
                        else enemy++;
                    }
                    if (friendly > 0 && enemy === 0) {
                        if (drop.captureTeam !== 0) { drop.captureTeam = 0; drop.captureProgress = Math.max(0, drop.captureProgress * 0.5); }
                        drop.captureProgress += dt / CONFIG.BATTLEFIELD_DIRECTOR.mission.captureHoldTime;
                    } else if (enemy > 0 && friendly === 0) {
                        if (drop.captureTeam !== 1) { drop.captureTeam = 1; drop.captureProgress = Math.max(0, drop.captureProgress * 0.5); }
                        drop.captureProgress += dt / CONFIG.BATTLEFIELD_DIRECTOR.mission.captureHoldTime;
                    } else if (friendly === 0 && enemy === 0) {
                        drop.captureProgress = Math.max(0, drop.captureProgress - dt * 0.12);
                    }
                    drop.captureProgress = Math.min(1, drop.captureProgress);
                    this.director?.reportMissionSupplyState(drop, drop.captureTeam, drop.captureProgress);
                } else {
                    const canPlayerUse = drop.team == null || drop.team === this.player.team;
                    if (this.player.alive && canPlayerUse && this.player.position.distanceTo(drop.position) < drop.radius) {
                        this.player.health = Math.min(this.player.health + 20 * dt, this.player.maxHealth);
                        if (this.weaponSystem) {
                            for (const wpn of this.weaponSystem.weapons) {
                                wpn.reserveAmmo = Math.min(wpn.reserveAmmo + 50 * dt, wpn.config.reserveAmmo);
                            }
                        }
                        if (!drop._notified) { drop._notified = true; this.hud.showNotification('正在补给...', 2); }
                    }
                    for (const bot of this.bots) {
                        if (!bot.alive || (drop.team != null && bot.team !== drop.team)) continue;
                        if (bot.position.distanceTo(drop.position) >= drop.radius) continue;
                        bot.health = Math.min(bot.maxHealth || 100, bot.health + 15 * dt);
                        bot.reserveAmmo = Math.min(bot.weaponConfig.reserveAmmo, bot.reserveAmmo + 35 * dt);
                    }
                }

                // 闪烁效果
                if (drop.mesh.children[1]) {
                    drop.mesh.children[1].material.opacity = 0.5 + Math.sin(performance.now() * 0.005) * 0.5;
                }

                // 过期
                if (drop.remainingTime <= 0) {
                    this._disposeObject3D(drop.mesh);
                    this._supplyDrops.splice(i, 1);
                }
            }
        }
    }

    _spawnSupplyDrop(position = null, options = {}) {
        const x = position?.x ?? (Math.random() - 0.5) * 120;
        const z = position?.z ?? (Math.random() - 0.5) * 120;
        const startY = position?.startY ?? 80;

        const group = new THREE.Group();

        // 补给箱主体
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.7 });
        const crate = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.5, 1.5),
            crateMat
        );
        crate.castShadow = true;
        group.add(crate);

        // 顶部指示灯
        const light = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xff9900, transparent: true, opacity: 0.8 })
        );
        light.position.y = 0.9;
        group.add(light);

        // 空投不挂点光源（信号球+降落伞已足够醒目）

        // 降落伞
        const parachute = new THREE.Mesh(
            new THREE.SphereGeometry(3, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.9, side: THREE.DoubleSide })
        );
        parachute.position.y = 4;
        group.add(parachute);

        group.position.set(x, startY, z);
        this.scene.add(group);

        const drop = {
            id: 'drop_' + Date.now() + '_' + this._supplyDrops.length,
            position: new THREE.Vector3(x, startY, z),
            velocityY: -5,
            landed: false,
            remainingTime: 0,
            duration: options.duration || 30,
            radius: options.radius || 5,
            team: options.team ?? null,
            kind: options.kind || 'ambient',
            captureProgress: 0,
            captureTeam: -1,
            mesh: group,
            parachute: parachute,
        };
        this._supplyDrops.push(drop);

        if (!options.silent) this.hud.showNotification('补给空投正在接近！', 4);
        if (this.audio) this.audio.playUISound('capture');
        return drop;
    }

    spawnDirectorMissionSupply() {
        return this._spawnSupplyDrop(null, {
            kind: 'mission',
            duration: CONFIG.BATTLEFIELD_DIRECTOR.mission.maxDuration + 10,
            radius: CONFIG.BATTLEFIELD_DIRECTOR.mission.supplyRadius,
        });
    }

    removeDirectorMissionSupply(drop) {
        if (!drop) return;
        const index = this._supplyDrops.indexOf(drop);
        if (index >= 0) {
            this._disposeObject3D(drop.mesh);
            this._supplyDrops.splice(index, 1);
        }
    }

    executeDirectorSupport(type, target, cfg) {
        if (type === 'supply') {
            const drop = this._spawnSupplyDrop({ x: target.x, z: target.z, startY: 65 }, {
                kind: 'director', team: 0, duration: cfg.duration, radius: cfg.radius, silent: true,
            });
            return { ok: true, duration: cfg.duration, handle: drop };
        }
        if (type === 'smoke') return this._createDirectorSmoke(target, cfg);
        if (type === 'rally') return this._createDirectorRally(target, cfg);
        return { ok: false, reason: '不支持的支援' };
    }

    cleanupDirectorSupport(support) {
        if (!support) return;
        if (support.type === 'supply') this.removeDirectorMissionSupply(support.handle);
        if (support.type === 'smoke') {
            this.transientFx?.cancelOwner(support.handle);
            const index = this._directorSmokeZones.indexOf(support.handle);
            if (index >= 0) this._directorSmokeZones.splice(index, 1);
            if (support.handle) support.handle.alive = false;
        }
        if (support.type === 'rally' && support.handle) {
            if (support.handle.mesh) this._disposeObject3D(support.handle.mesh);
            support.handle.expired = true;
            if (this._directorRally === support.handle) this._directorRally = null;
        }
    }

    isDirectorRallyPositionSafe(target) {
        return this._isSpawnPositionSafe(new THREE.Vector3(target.x, target.y || 0, target.z), 0);
    }

    _createDirectorSmoke(target, cfg) {
        const zone = {
            id: 'smoke_' + Date.now(), x: target.x, z: target.z,
            y: this.world.getHeight(target.x, target.z), radius: cfg.radius, alive: true, expired: false,
        };
        this._directorSmokeZones.push(zone);
        const materials = [];
        const clouds = [];
        for (let i = 0; i < 10; i++) {
            const material = new THREE.MeshBasicMaterial({ color: 0xb9bec2, transparent: true, opacity: 0.38, depthWrite: false });
            const cloud = new THREE.Mesh(this._gameFxGeo.directorSmoke, material);
            const angle = (i / 10) * Math.PI * 2;
            const distance = (i % 3) * cfg.radius * 0.25;
            cloud.position.set(target.x + Math.cos(angle) * distance, zone.y + 1.5 + (i % 2), target.z + Math.sin(angle) * distance);
            cloud.scale.set(2.8, 2.2, 2.8);
            materials.push(material);
            clouds.push(cloud);
        }
        this.transientFx.add({
            owner: zone, category: 'smoke', priority: 3, cost: 10, life: cfg.duration, objects: clouds,
            update: (effect, dt, progress) => {
                for (let i = 0; i < clouds.length; i++) {
                    clouds[i].position.y += dt * 0.12;
                    clouds[i].scale.multiplyScalar(1 + dt * 0.018);
                    materials[i].opacity = Math.sin(Math.min(1, progress) * Math.PI) * 0.42;
                }
            },
            release: () => { materials.forEach(material => material.dispose()); zone.alive = false; zone.expired = true; },
            onReject: () => { materials.forEach(material => material.dispose()); zone.alive = false; zone.expired = true; },
        });
        return { ok: true, duration: cfg.duration, handle: zone };
    }

    _createDirectorRally(target, cfg) {
        if (this._directorRally?.mesh) this._disposeObject3D(this._directorRally.mesh);
        const pos = new THREE.Vector3(target.x, this.world.getHeight(target.x, target.z) + 0.05, target.z);
        const mesh = this._createDeployableMesh(pos, 0x4ab5ff, '集结');
        const rally = { id: 'rally_' + Date.now(), position: pos, mesh, radius: cfg.radius, team: 0, expired: false };
        this._directorRally = rally;
        return { ok: true, duration: cfg.duration, handle: rally };
    }

    // 远处炮火视觉氛围：随机在远处产生爆炸闪光与烟柱（与音频氛围呼应）
    _updateAmbientBattlefieldFx(dt) {
        if (!this._ambientFx) this._ambientFx = [];
        for (let i = this._ambientFx.length - 1; i >= 0; i--) {
            const fx = this._ambientFx[i];
            fx.life -= dt;
            const p = 1 - fx.life / fx.maxLife;
            if (fx.light) fx.light.intensity = Math.max(0, 1 - p * 3) * fx.lightIntensity;
            if (fx.smoke) {
                fx.smoke.position.y += dt * 3.5;
                fx.smoke.scale.setScalar(1 + p * 2.2);
                fx.smoke.material.opacity = Math.max(0, 1 - p) * 0.5;
            }
            if (fx.life <= 0) {
                if (fx.light) this.scene.remove(fx.light);
                if (fx.smoke) {
                    this.scene.remove(fx.smoke);
                    fx.smoke.geometry.dispose();
                    fx.smoke.material.dispose();
                }
                this._ambientFx.splice(i, 1);
            }
        }

        this._ambientFxTimer = (this._ambientFxTimer ?? 8) - dt;
        if (this._ambientFxTimer > 0 || !this.player) return;
        this._ambientFxTimer = 7 + Math.random() * 11;
        if (this._ambientFx.length >= 3) return;

        // 找一个远离玩家的位置（>90m），营造远方战线的感觉
        const half = (CONFIG.WORLD.size / 2) - 20;
        let x = 0, z = 0;
        for (let tries = 0; tries < 8; tries++) {
            x = (Math.random() * 2 - 1) * half;
            z = (Math.random() * 2 - 1) * half;
            const dx = x - this.player.position.x;
            const dz = z - this.player.position.z;
            if (dx * dx + dz * dz > 90 * 90) break;
        }
        const y = this.world.getHeight(x, z);

        // 灯光池闪光 + 自发光烟团
        if (!this._ambientFlashPos) this._ambientFlashPos = new THREE.Vector3();
        this.lightPool?.flash(this._ambientFlashPos.set(x, y + 4, z), 0xffa040, 40, 70, 1.2);

        const smoke = new THREE.Mesh(
            new THREE.SphereGeometry(3.5, 7, 5),
            new THREE.MeshBasicMaterial({ color: 0x4a4640, transparent: true, opacity: 0.5, depthWrite: false })
        );
        smoke.position.set(x, y + 4, z);
        this.scene.add(smoke);

        this._ambientFx.push({ smoke, life: 4, maxLife: 4 });
    }

    _endGame(victory) {
        this.fortifications?.cancel();
        this.director?.freeze();
        this.state = 'gameOver';
        for (const vehicle of this.vehicles || []) vehicle._stopEngineSound?.();
        this.audio?.stopBattlefieldAmbience?.();
        if (!this.input.isMobile) this.input.exitLock();
        this.input.showMobileControls(false);
        // 结束时清理死亡/倒地/部署残留 UI
        this.hud.hideDeath?.();
        this.hud.hideDeployScreen?.();
        this.hud.hideDownedOverlay?.();
        this.hud.hide();

        const modeData = this.gameMode?.getUIData?.() || null;
        this.menu.showGameOver(victory, {
            kills: this.playerStats.kills,
            deaths: this.playerStats.deaths,
            assists: this.playerStats.assists,
            captures: this.playerStats.captures,
            revives: this.playerStats.revives,
            heals: this.playerStats.heals,
            resupplies: this.playerStats.resupplies,
            repairs: this.playerStats.repairs,
            spotAssists: this.playerStats.spotAssists,
            vehiclesDestroyed: this.playerStats.vehiclesDestroyed,
            objectivesDestroyed: this.playerStats.objectivesDestroyed,
            missionsCompleted: this.playerStats.missionsCompleted,
            fortificationsBuilt: this.playerStats.fortificationsBuilt,
            friendlyScore: Math.floor(this.friendlyScore),
            enemyScore: Math.floor(this.enemyScore),
            modeName: modeData?.name || '',
            modeHint: modeData?.modeHint || '',
            friendlyTickets: modeData?.tickets ? Math.ceil(modeData.tickets[0]) : null,
            enemyTickets: modeData?.tickets ? Math.ceil(modeData.tickets[1]) : null,
        });
    }

    _animate() {
        requestAnimationFrame(() => this._animate());

        const dt = Math.min(this.clock.getDelta(), 0.1);
        const now = performance.now() / 1000;

        // FPS
        this.fpsCounter++;
        this.fpsTimer += dt;
        if (this.fpsTimer >= 1) {
            this.currentFPS = this.fpsCounter;
            this.fpsCounter = 0;
            this.fpsTimer = 0;
            this.hud.updateFPS(this.currentFPS);
            this._updateAdaptivePerformance();
        }

        if (this.state === 'playing') {
            this.input.flushTouchLookDelta();
            this._updateGame(dt, now);
            this.director?.update(dt);
            this.transientFx?.update(dt);
        }
        this.lightPool?.update(dt);

        // 渲染
        this.renderer.render(this.scene, this.camera);

        // 得分板按键释放
        if (!this.input.isKeyDown('Tab')) {
            this.hud.toggleScoreboard(false);
        }
    }

    _updateAdaptivePerformance() {
        if (!this.renderer) return;

        if (this.currentFPS < 42) {
            this._perfLowFpsSeconds += 1;
            this._perfHighFpsSeconds = 0;
        } else if (this.currentFPS > 56) {
            this._perfHighFpsSeconds += 1;
            this._perfLowFpsSeconds = 0;
        } else {
            this._perfLowFpsSeconds = 0;
            this._perfHighFpsSeconds = 0;
        }

        if (this._perfLowFpsSeconds >= 3) {
            // 降级顺序：阴影质量 → 渲染分辨率
            const sq = this._shadowQualityLevel ?? 2;
            if (sq > 0) {
                this._shadowQualityLevel = sq - 1;
                this.world?.setShadowQuality?.(this._shadowQualityLevel);
            } else if (this._renderScale > 0.72) {
                this._renderScale = Math.max(0.72, this._renderScale - 0.08);
                this.renderer.setPixelRatio(this._renderScale);
                this._markerInterval = Math.min(0.18, this._markerInterval + 0.03);
                this._compassInterval = Math.min(0.1, this._compassInterval + 0.02);
            }
            this._perfLowFpsSeconds = 0;
        } else if (this._perfHighFpsSeconds >= 8) {
            // 恢复顺序：渲染分辨率 → 阴影质量
            if (this._renderScale < 1) {
                this._renderScale = Math.min(1, this._renderScale + 0.04);
                this.renderer.setPixelRatio(this._renderScale);
                this._markerInterval = Math.max(0.1, this._markerInterval - 0.02);
                this._compassInterval = Math.max(0.05, this._compassInterval - 0.01);
            } else if ((this._shadowQualityLevel ?? 2) < 2) {
                this._shadowQualityLevel = (this._shadowQualityLevel ?? 2) + 1;
                this.world?.setShadowQuality?.(this._shadowQualityLevel);
            }
            this._perfHighFpsSeconds = 0;
        }
    }

    _updateGame(dt, now) {
        // 更新计时器
        this.timeLeft -= dt;
        this.grenadeThrowCooldown -= dt;
        this._spotCooldown = Math.max(0, this._spotCooldown - dt);
        this._assistCleanupTimer -= dt;
        if (this._assistCleanupTimer <= 0) {
            this._assistCleanupTimer = 5;
            this._cleanupPlayerDamageContributions();
        }
        this._updateBattleOrders(dt);
        this._updateBattleIntensity(dt);

        // 可破坏实体粒子更新
        if (this.destructibles) this.destructibles.update(dt);

        // 建筑细节 LOD（每 0.35 秒更新，远处隐藏室内/窗框细节）
        this._buildingLodTimer = (this._buildingLodTimer || 0) - dt;
        if (this._buildingLodTimer <= 0) {
            this._buildingLodTimer = 0.35;
            this.world?.obstacles?.updateBuildingLOD?.(this.player?.position, 85);
        }

        // 狙击镜反光更新（战地5特色：远距离可发现狙击手位置）
        this._updateScopeGlare(dt, now);

        // === ADS 灵敏度缩放 ===
        // 战地标准手感：开镜时鼠标灵敏度随放大倍率自动降低，便于远距离精瞄。
        // 使用上一帧的 aimLerp 平滑过渡，避免突然跳变。在玩家 update 之前设置，
        // 这样本帧读取鼠标增量时已应用正确的灵敏度。
        if (this.weaponSystem) {
            const zoom = Math.max(1, this.weaponSystem.getZoom ? this.weaponSystem.getZoom() : 1);
            const aimLerp = this.weaponSystem.aimLerp || 0;
            // 1 / zoom^0.7 曲线：1x=1.0, 2x≈0.62, 4x≈0.38, 8x≈0.24
            const targetScale = 1 / Math.pow(zoom, 0.7);
            const scale = 1 - (1 - targetScale) * aimLerp;
            this.input.setAimSensitivityScale(scale);
        }

        // 处决动作更新（在玩家 update 前，锁定期间禁止移动）
        this._updateExecution(dt);
        // 近战挥砍
        this._updateMelee(dt);

        // 更新玩家
        let playerState = this.player.getState();
        this.player.update(dt, this.weaponSystem);
        playerState = this.player.getState();
        const fortificationInput = this.fortifications?.update(dt) || { wasActive: false, placed: false };

        // === 玩家倒地状态处理（区别于彻底死亡，不进入部署界面）===
        if (this.player.downed) {
            // 长按空格跳过等待，加速流血
            if (this.input.isKeyDown('Space')) {
                this.player.skipHoldTimer += dt;
                this.player.bleedOutTimer -= dt * (CONFIG.PLAYER.skipBleedOutAccelerate || 3);
                if (this.hud.updateSkipProgress) {
                    this.hud.updateSkipProgress(Math.min(1, this.player.skipHoldTimer / CONFIG.PLAYER.skipHoldTime));
                }
                // 跳过进度满 或 流血归零 → 彻底死亡
                if (this.player.skipHoldTimer >= CONFIG.PLAYER.skipHoldTime || this.player.bleedOutTimer <= 0) {
                    this.player._finalizeDeath(this.player.lastAttacker);
                    if (this.hud.hideDownedOverlay) this.hud.hideDownedOverlay();
                }
            } else {
                // 松开空格 → 跳过进度缓慢衰减（避免蹭一下就跳过）
                this.player.skipHoldTimer = Math.max(0, this.player.skipHoldTimer - dt * 0.5);
                if (this.hud.updateSkipProgress) {
                    this.hud.updateSkipProgress(this.player.skipHoldTimer / CONFIG.PLAYER.skipHoldTime);
                }
            }
            // 更新流血计时 UI
            if (this.hud.updateDownedBleedOut) {
                this.hud.updateDownedBleedOut(Math.max(0, this.player.bleedOutTimer), CONFIG.PLAYER.bleedOutTime);
            }
        }

        // 玩家死亡处理（仅彻底死亡，不含倒地状态）
        if (!this.player.alive && !this.player.downed) {
            // 更新部署计时器
            if (this._deployTimer > 0) {
                this._deployTimer -= dt;
                this.hud._updateDeployTimer(this._deployTimer);
            }
            // 计时器归零后自动部署
            if (this._deployTimer <= 0 && this.hud.elements.deployScreen && !this.hud.elements.deployScreen.classList.contains('hidden')) {
                // 显示“立即部署”按钮可用
                const btn = document.getElementById('btnDeployNow');
                if (btn) btn.disabled = false;
                // 更新部署界面中的据点状态（实时）
                this._updateDeployScreenPoints();
            }
            if (this.player.respawnTimer <= 0 && this._deployTimer <= 0) {
                // 如果玩家没有手动选择，自动部署到最近的我方据点
                if (!this.hud.getSelectedDeployPoint() && !(this.hud.getSelectedSquadMember && this.hud.getSelectedSquadMember())) {
                    this._autoSelectDeployPoint();
                }
                this._stopSpectate();
                this._respawnPlayer();
            }
        }

        // 死亡观战：相机跟随所选队友（此时玩家已死亡，相机由 Game 接管）
        if (!this.player.alive && !this.player.downed && this._spectatingBot) {
            this._updateSpectateCamera(dt);
        }

        // 更新武器系统（防空炮炮手 / 迫击炮选点期间跳过，避免干扰）
        let weaponUpdated = false;
        if (this.weaponSystem && this.player.alive && !this.player.inStaticGun && !this._mortarMapOpen) {
            if (this.player.inVehicle) {
                // 战地风格：载具内分两种情况
                // - 驾驶员(seat 0)：使用载具武器（由 Vehicle._handleInput 触发 _fireCannon），
                //   步兵武器收起，不开镜。
                // - 乘员(seat >= 1)：可以使用个人武器从车内向外射击（开放顶舱/侧门），
                //   这修复了"在载具里无法开枪"的 bug —— 任何位置都能开火。
                const isDriver = this.player.vehicleSeat === 0;
                if (isDriver) {
                    this.weaponSystem.weaponGroup.visible = false;
                    this.weaponSystem.stopFire();
                    this.weaponSystem.setAiming(false);
                    this.weaponSystem.setMovementState(false, false, false, false, false);
                    this.weaponSystem.update(dt, now, playerState);
                    weaponUpdated = true;
                    this.hud.hideScope();
                } else if (this.player.inVehicle.type === 'tank') {
                    // === 坦克乘员位：控制顶部机枪（副武器），战地风格 ===
                    // 隐藏个人武器，使用载具机枪
                    this.weaponSystem.weaponGroup.visible = false;
                    this.weaponSystem.stopFire();
                    this.weaponSystem.setAiming(false);
                    this.weaponSystem.setMovementState(false, false, false, false, false);
                    this.weaponSystem.update(dt, now, playerState);
                    weaponUpdated = true;
                    this.hud.hideScope();

                    // 左键开火（机枪）- localAim 已在载具循环中设置，按视角方向射击
                    const vehicle = this.player.inVehicle;
                    if (this.input.isMouseDown(0) && vehicle.secondaryCooldown <= 0 && vehicle.secondaryAmmo > 0) {
                        vehicle._fireSecondaryWeapon();
                    }
                    // 右键瞄准（缩放视野，便于精准扫射）
                    const isAiming = this.input.isMouseDown(2);
                    const crewZoom = isAiming ? 1.6 : 1.0;
                    const targetFov = this.baseFov / crewZoom;
                    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 12);
                    this.camera.updateProjectionMatrix();
                } else if (this.player.inVehicle.config.isAircraft) {
                    // === 飞机乘员位：控制门机枪（副武器），右键瞄准 ===
                    // 隐藏个人武器，使用载具门机枪（与驾驶员机炮独立，互不冲突）
                    this.weaponSystem.weaponGroup.visible = false;
                    this.weaponSystem.stopFire();
                    this.weaponSystem.setAiming(false);
                    this.weaponSystem.setMovementState(false, false, false, false, false);
                    this.weaponSystem.update(dt, now, playerState);
                    weaponUpdated = true;
                    this.hud.hideScope();

                    // 左键开火（门机枪）- localAim 已在载具循环中设置，按视角方向射击
                    const vehicle = this.player.inVehicle;
                    if (this.input.isMouseDown(0) && vehicle.secondaryCooldown <= 0 && vehicle.secondaryAmmo > 0) {
                        vehicle._fireSecondaryWeapon();
                    }
                    // 右键瞄准（缩放视野，空中精确打击）
                    const isAiming = this.input.isMouseDown(2);
                    const crewZoom = isAiming ? 2.0 : 1.0;
                    const targetFov = this.baseFov / crewZoom;
                    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 12);
                    this.camera.updateProjectionMatrix();
                } else {
                    // === 汽车等地面载具乘员位：个人武器射击（开放顶舱/侧门）===
                    const hideWeapon = this.weaponSystem.isScoped() && this.weaponSystem.aimLerp > 0.6;
                    this.weaponSystem.weaponGroup.visible = !hideWeapon;

                    // 乘员位于座位上，不冲刺、不跳跃，直接允许射击
                    const fireHeld = this.input.isMouseDown(0);
                    const firePressed = this.input.consumeMousePressed
                        ? this.input.consumeMousePressed(0)
                        : fireHeld;
                    if (fireHeld) {
                        if (this.weaponSystem.isHeldFireMode && this.weaponSystem.isHeldFireMode()) {
                            this.weaponSystem.startFire();
                        } else if (firePressed || fireHeld) {
                            this.weaponSystem.tryFireOnce();
                        }
                    } else {
                        this.weaponSystem.stopFire();
                    }

                    // 瞄准（右键）
                    const isAiming = this.input.isMouseDown(2);
                    this.weaponSystem.setAiming(isAiming);
                    if (!hideWeapon) {
                        this.weaponSystem.weaponGroup.visible = !this.weaponSystem.isScoped();
                    }

                    // 乘员视为静止蹲坐姿态，扩散较低便于精准射击
                    this.weaponSystem.setMovementState(false, false, true, false, false);

                    this.weaponSystem.update(dt, now, playerState);
                    weaponUpdated = true;

                    // 狙击镜 FOV 缩放
                    const zoom = this.weaponSystem.getZoom();
                    const targetFov = this.baseFov / zoom;
                    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 12);
                    this.camera.updateProjectionMatrix();

                    if (this.weaponSystem.isScoped()) {
                        this.hud.showScope();
                    } else {
                        this.hud.hideScope();
                    }
                }
            } else {
            // 武器模型：第三人称或驾驶武装载具时隐藏；处决中强制换刀隐藏枪
            const inArmedVehicleAsDriver = this.player.inVehicle &&
                this.player.vehicleSeat === 0 &&
                this.player.inVehicle.config.hasWeapon;
            const hideWeapon = !!this.player.inVehicle ||
                !!this.player.inStaticGun ||
                !!this._banzaiActive ||
                this.player.vehicleThirdPerson ||
                inArmedVehicleAsDriver ||
                this.weaponSystem.isScoped() ||
                !!this._executing ||
                !!this.player._executionLock ||
                !!this.player._meleeLock ||
                !!this._meleeActive ||
                !!this.fortifications?.active;
            this.weaponSystem.weaponGroup.visible = !hideWeapon;

            // 射击输入 - 半自动武器需要点击触发；处决/近战/防空炮/冲锋锁定期间禁止开火
            const fireHeld = this.input.isMouseDown(0);
            const canInfantryFire = !this.player.inVehicle && !this.player.inStaticGun && !this._banzaiActive && playerState.canFire && !this._executing && !this.player._executionLock && !this.player._meleeLock && !this._meleeActive && !fortificationInput.wasActive;
            const firePressed = canInfantryFire && this.input.consumeMousePressed
                ? this.input.consumeMousePressed(0)
                : fireHeld;
            if (fireHeld && canInfantryFire) {
                if (this.weaponSystem.isHeldFireMode && this.weaponSystem.isHeldFireMode()) {
                    this.weaponSystem.startFire();
                } else if (firePressed || fireHeld) {
                    // 半自动：仅在鼠标刚按下时触发一次
                    this.weaponSystem.tryFireOnce();
                }
            } else {
                this.weaponSystem.stopFire();
            }

            // 瞄准 - 右键按住瞄准，冲刺时不能瞄准
            const isAiming = this.input.isMouseDown(2) && !this.player.isSprinting && !fortificationInput.wasActive;
            this.weaponSystem.setAiming(isAiming);
            if (!hideWeapon) {
                this.weaponSystem.weaponGroup.visible = !this.weaponSystem.isScoped();
            }

            // 传递移动状态给武器系统（影响扩散）
            const isMoving = playerState.moveSpeed > 0.5;
            this.weaponSystem.setMovementState(
                isMoving,
                !playerState.onGround,
                this.player.stance === 'crouch',
                this.player.stance === 'prone',
                playerState.isHoldingBreath
            );

            this.weaponSystem.update(dt, now, playerState);
            weaponUpdated = true;

            // 狙击镜 FOV 缩放 + 冲刺 FOV 加宽（战地风格的速度感）
            const zoom = this.weaponSystem.getZoom();
            let targetFov = this.baseFov / zoom;
            // 冲刺时 FOV 略微加宽，营造速度感（仅在未瞄准时生效）
            if (this.player.isSprinting && !this.weaponSystem.isAiming) {
                targetFov += CONFIG.PLAYER.sprintFovBoost || 8;
            }
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 12);
            this.camera.updateProjectionMatrix();

            // 狙击镜遮罩
            if (this.weaponSystem.isScoped()) {
                this.hud.showScope(this.weaponSystem.currentWeapon?.optic?.style || 'sniper');
            } else {
                this.hud.hideScope();
            }
            }
        } else {
            // 非战斗状态恢复 FOV
            if (Math.abs(this.camera.fov - this.baseFov) > 0.1) {
                this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.baseFov, dt * 12);
                this.camera.updateProjectionMatrix();
            }
            this.hud.hideScope();
        }
        if (this.weaponSystem && !weaponUpdated) {
            this.weaponSystem.stopFire();
            this.weaponSystem.update(dt, now, playerState, false);
        }

        // 更新AI - 性能优化：缓存allTargets数组避免每帧创建
        if (!this._cachedAllTargets) {
            this._cachedAllTargets = [];
        }
        const allTargets = this._cachedAllTargets;
        allTargets.length = 0;
        for (let i = 0; i < this.bots.length; i++) {
            if (!this.bots[i]._assignedVehicle) allTargets.push(this.bots[i]);
        }
        for (let i = 0; i < this.vehicles.length; i++) {
            const v = this.vehicles[i];
            if (v.alive) allTargets.push(v);
        }
        if (this.player && this.player.alive) {
            allTargets.push(this.player);
        }
        if (!this._cachedCombatTargets) {
            this._cachedCombatTargets = [];
        }
        const combatTargets = this._cachedCombatTargets;
        combatTargets.length = 0;
        for (const target of allTargets) combatTargets.push(target);
        for (const objectiveTarget of this._getStrategicObjectiveTargets()) {
            combatTargets.push(objectiveTarget);
        }
        this._assignAIVehicles(dt);
        for (const bot of this.bots) {
            if (bot._spotTimer > 0) {
                bot._spotTimer -= dt;
                if (bot._spotTimer <= 0) bot._spotted = false;
            }
            if (bot._spottedByPlayerTimer > 0) {
                bot._spottedByPlayerTimer -= dt;
                if (bot._spottedByPlayerTimer <= 0) bot._spottedByPlayer = false;
            }
            if (bot._assignedVehicle) {
                // 复用临时向量，避免每帧 new Vector3
                if (!bot._tmpSeatPos) bot._tmpSeatPos = new THREE.Vector3();
                bot._tmpSeatPos.copy(bot._assignedVehicle.position);
                bot._tmpSeatPos.y += 1.5;
                bot.position.copy(bot._tmpSeatPos);
                bot.model.visible = false;
                continue;
            }
            bot.model.visible = true;
            this._steerBotByOrder(bot, dt);
            bot.update(dt, combatTargets, this.world.capturePoints, this.player);

            // AI 被击倒（非玩家击倒，玩家路径已在 _onPlayerHit 显示）
            if (bot.downed && !bot._downFeedReported) {
                bot._downFeedReported = true;
                if (bot.lastAttacker && bot.lastAttacker !== this.player) {
                    const wpn = bot.lastAttacker.weaponConfig?.name
                        || bot.lastAttacker.config?.name
                        || '武器';
                    this._reportKillFeed(bot.lastAttacker, bot, wpn, { isDown: true });
                }
            }
            if (!bot.downed && bot.alive) {
                bot._downFeedReported = false;
            }

            // AI彻底死亡（非倒地）：扣票 + 排队重生
            // 关键修复：倒地 bleedOut / 处决后 onKilled 是空实现，以前从不 _respawnBot，
            // 导致敌方倒地后"像没有复活"。这里在主循环统一触发重生。
            if (!bot.alive && !bot.downed) {
                if (!bot._ticketDeducted) {
                    bot._ticketDeducted = true;
                    if (this.gameMode) this.gameMode.onPlayerDeath(bot, bot.lastAttacker);
                    else if (bot.team === 0) {
                        this.friendlyTickets -= CONFIG.GAME.deathTicketCost;
                    } else {
                        this.enemyTickets -= CONFIG.GAME.deathTicketCost;
                    }

                    if (!bot._scoreSettled && bot.lastAttacker && bot.lastAttacker.team !== bot.team) {
                        const killer = bot.lastAttacker;
                        const weaponName = killer.weaponConfig?.name || killer.config?.name || '武器';
                        if (killer === this.player && bot.team === 1) {
                            // 流血自然死亡：归属最后攻击的玩家（完整击杀结算）
                            this._onPlayerKill(bot, weaponName, !!bot._lastHitWasHeadshot);
                        } else if (killer.team === 0 && bot.team === 1) {
                            this.friendlyScore += 10;
                            this._reportKillFeed(killer, bot, weaponName);
                            this._tryAwardPlayerAssist(bot, killer, weaponName);
                            this._tryAwardPlayerSpotAssist(bot, killer);
                            bot._scoreSettled = true;
                        } else if (killer.team === 1 && bot.team === 0) {
                            this.enemyScore += 10;
                            this._reportKillFeed(killer, bot, weaponName);
                            this._clearPlayerDamageContribution(bot);
                            bot._scoreSettled = true;
                        } else {
                            bot._scoreSettled = true;
                        }
                    } else if (!bot._scoreSettled && !bot.lastAttacker) {
                        // 环境/自杀：仍进 kill feed
                        this._reportKillFeed(null, bot, '环境');
                        bot._scoreSettled = true;
                    }
                }
                // 无论击杀路径如何，彻底死亡后必须排队重生
                if (!bot._respawnQueued) {
                    this._respawnBot(bot);
                }
            }

            // AI重生时重置标记
            if (bot.alive) {
                bot._ticketDeducted = false;
                bot._scoreSettled = false;
            }
        }

        // 更新载具
        let playerStillInVehicle = false;
        for (const vehicle of this.vehicles) {
            if (vehicle.alive) {
                if (vehicle._spotTimer > 0) {
                    vehicle._spotTimer -= dt;
                    if (vehicle._spotTimer <= 0) vehicle._spotted = false;
                }
                if (vehicle._spottedByPlayerTimer > 0) {
                    vehicle._spottedByPlayerTimer -= dt;
                    if (vehicle._spottedByPlayerTimer <= 0) vehicle._spottedByPlayer = false;
                }
                const isDriver = this.player.inVehicle === vehicle && this.player.vehicleSeat === 0;
                const aiInput = !isDriver ? this._getAIVehicleInput(vehicle, combatTargets, dt) : null;
                const isPlayerInVehicle = this.player.inVehicle === vehicle;
                if (!vehicle._ramPrevPosition) vehicle._ramPrevPosition = new THREE.Vector3();
                vehicle._ramPrevPosition.copy(vehicle.position);

                // 炮塔/武器瞄准
                if (isPlayerInVehicle && vehicle.config.hasWeapon) {
                    if (isDriver) {
                        // 驾驶员：炮塔跟随视角
                        this._updateVehicleTurretAim(vehicle);
                    } else if (this._crewControlsVehicleWeapon(vehicle)) {
                        // 乘员位控制载具武器：设置 localAimRay（按视角开火，不旋转炮塔）
                        this._setCrewVehicleAim(vehicle);
                    } else if (vehicle.clearLocalAimRay) {
                        vehicle.clearLocalAimRay();
                    }
                } else if (!isDriver && vehicle.clearLocalAimRay) {
                    vehicle.clearLocalAimRay();
                }

                vehicle.update(dt, aiInput || this.input, isDriver || !!aiInput);
                this._handleVehicleRamming(vehicle, vehicle._ramPrevPosition, dt);

                // 更新载具HUD
                if (this.player.inVehicle === vehicle) {
                    // 载具可能在 update 中被摧毁并踢出玩家
                    if (!this.player.inVehicle || this.player.inVehicle !== vehicle || !vehicle.alive) {
                        this.hud.hideVehicleUI();
                    } else {
                        playerStillInVehicle = true;
                        const state = vehicle.getState();
                        this.hud.updateVehicle(state, this.player.vehicleSeat);
                        // 按住 H 键临时显示载具控制提示（平时完全淡出不阻碍视野）
                        const vcEl = this.hud.elements.vehicleControls;
                        if (vcEl) vcEl.classList.toggle('show-hint', !!this.input.isKeyDown('KeyH'));
                        // 载具准星：驾驶员位 或 乘员位控制载具武器时显示
                        const isCrewWeapon = this._crewControlsVehicleWeapon(vehicle);
                        const showCrosshair = state.hasWeapon && (this.player.vehicleSeat === 0 || isCrewWeapon);
                        this.hud.showVehicleCrosshair(showCrosshair);
                        if (showCrosshair) {
                            // 乘员位（坦克机枪/飞机门机枪）用副武器冷却，驾驶员用主炮冷却
                            const weaponReady = isCrewWeapon
                                ? (vehicle.secondaryCooldown <= 0 && vehicle.secondaryAmmo > 0)
                                : (vehicle.cannonCooldown <= 0 && vehicle.cannonAmmo > 0);
                            this.hud.updateVehicleCrosshair(
                                weaponReady,
                                vehicle.type === 'heli' || vehicle.type === 'plane' ? 'aircraft' : 'default'
                            );
                        }
                    }
                }
            } else {
                // 载具已摧毁：若玩家仍挂在这台车上，强制清理 UI
                if (this.player.inVehicle === vehicle) {
                    if (this.player.exitVehicle) this.player.exitVehicle();
                    this.hud.hideVehicleUI();
                }
                if (vehicle._crashing && vehicle.updateCrash) {
                    vehicle.updateCrash(dt);
                } else {
                    this._queueVehicleRespawn(vehicle);
                }
            }
        }
        // 兜底：玩家已不在任何载具，但载具 UI 仍显示 → 强制隐藏
        if (!playerStillInVehicle && !this.player.inVehicle && this.hud._vehicleUiActive) {
            this.hud.hideVehicleUI();
        }
        this._updateMedicRevives(dt);
        this._updateBotDeployables(dt);
        this._updateDragging(dt);
        this._handleVehicleVehicleCollisions(dt);
        this._updateVehicleRespawns(dt);

        // 更新据点（模式可覆盖占领时长，如突破 30s）
        this.world.capturePointTimeOverride =
            this.gameMode?.cfg?.capturePointTime ||
            this.gameMode?.config?.capturePointTime ||
            null;
        this.world.updateCapturePoints(dt, allTargets);
        this.world.update(dt, this.player?.position || this.camera.position);
        this._updateAmbientBattlefieldFx(dt);
        this._updateCapturePointScoring(dt);
        this._updateCapturePointSupport(dt);

        // 处理AI投掷的手雷
        this._updateAIGrenades(dt);

        // 更新兵种部署物与特殊装备
        this._updateDeployables(dt);
        this._updateBanzai(dt);
        this._updateSpecials(dt);
        this._updateSpecialCooldown(dt);
        this._updatePendingProjectiles(dt);
        this._updateStaticGuns(dt);
        this._updateMortarMap(dt);
        this._updateMortarShellCamera();

        // 交互检测
        if (this.player.alive) {
            this._checkInteraction();
        }

        // 音频更新
        if (this.player.alive) {
            if (!this._audioForward) {
                this._audioForward = new THREE.Vector3();
                this._audioUp = new THREE.Vector3(0, 1, 0);
            }
            this.camera.getWorldDirection(this._audioForward);
            this.audio.updateListener(this.camera.position, this._audioForward, this._audioUp);
        }

        // 更新HUD
        this._updateHUD(dt);

        // === 罗盘更新（节流到每0.05秒）===
        this._compassUpdateTimer -= dt;
        if (this._compassUpdateTimer <= 0) {
            this._compassUpdateTimer = this._compassInterval;
            this.hud.updateCompass(this.player.yaw);
        }

        // === 3D世界标记更新（节流到每0.1秒）===
        this._markerUpdateTimer -= dt;
        if (this._markerUpdateTimer <= 0) {
            this._markerUpdateTimer = this._markerInterval;
            this._updateWorldMarkers();
        }

        // === 空投补给系统 ===
        this._updateSupplyDrops(dt);

        // 检查游戏结束
        this._checkGameOver();
    }

    _updateHUD(dt) {
        const playerState = this.player.getState();
        const weaponState = this.weaponSystem ? this.weaponSystem.getWeaponState() : null;

        // 载具模式下：驾驶员隐藏步兵准星（用载具准星），乘员仍可使用个人武器故保留准星
        // 防空炮炮手 / 迫击炮选点：隐藏步兵准星与武器
        if (playerState.inStaticGun || this._mortarMapOpen) {
            if (this.hud.elements.crosshair) {
                this.hud.elements.crosshair.style.opacity = '0';
                this.hud.elements.crosshair.classList.add('vehicle-hidden');
            }
            if (this.weaponSystem?.weaponGroup) this.weaponSystem.weaponGroup.visible = false;
        } else if (playerState.inVehicle && playerState.vehicleSeat === 0) {
            if (this.hud.elements.crosshair) {
                this.hud.elements.crosshair.style.opacity = '0';
                this.hud.elements.crosshair.classList.add('vehicle-hidden');
            }
        } else {
            if (this.hud.elements.crosshair) {
                this.hud.elements.crosshair.style.opacity = '';
                this.hud.elements.crosshair.classList.remove('vehicle-hidden');
            }
            // 准星
            this.hud.updateCrosshair(playerState, weaponState);
        }

        // 兜底：不在载具时确保载具 UI 已清干净
        if (!playerState.inVehicle && this.hud._vehicleUiActive) {
            this.hud.hideVehicleUI();
        }

        // 血量
        this.hud.updateHealth(playerState.health, this.player.maxHealth, playerState.armor, this.player.maxArmor);

        // 体力条
        this.hud.updateStamina(playerState.stamina, playerState.maxStamina, playerState.isExhausted);

        // 侧身指示
        this.hud.updateLean(playerState.lean);

        // 重生保护
        this.hud.updateSpawnProtection(playerState.spawnProtection);

        // 压制效果
        this.hud.updateSuppression(playerState.suppression);

        // 低血量效果
        const healthPct = playerState.health / this.player.maxHealth;
        this.hud.updateLowHealth(healthPct);

        // 低血量心跳声
        if (healthPct < 0.3 && this.player.alive) {
            this.heartbeatTimer -= dt;
            if (this.heartbeatTimer <= 0) {
                if (this.audio) this.audio.playHeartbeat();
                this.heartbeatTimer = 1.2; // 心跳间隔
            }
        }

        // 武器
        this.hud.updateWeapon(weaponState);

        // 兵种技能与特殊装备
        if (this.player.classConfig) {
            const gadgetConfig = CONFIG.GADGETS[this.player.classConfig.gadget];
            if (gadgetConfig) {
                this.hud.updateGadget(gadgetConfig.name, 0x00ff66, this.player.gadgetCooldown, this.player.gadgetMaxCooldown);
            }
            const specialConfig = CONFIG.SPECIALS?.[this.player.classConfig.special];
            if (this.hud.updateSpecial) {
                this.hud.updateSpecial(
                    specialConfig?.name || '',
                    this._specialCooldown || 0,
                    this._specialMaxCooldown || specialConfig?.cooldown || 1
                );
            }
        }

        // 比分和票数
        this.hud.updateScore(Math.floor(this.friendlyScore), Math.floor(this.enemyScore), this.timeLeft);
        this.hud.updateTickets(this.friendlyTickets, this.enemyTickets);

        this._directorHudTimer -= dt;
        if (this._directorHudTimer <= 0) {
            this._directorHudTimer = 0.2;
            const directorData = this.director?.getHUDData?.() || null;
            this.hud.updateDirector?.(directorData);
            if (this._supportPanelOpen) this.hud.showSupportPanel?.(directorData);
        }

        // 据点信息
        let nearestCp = null;
        let nearestDist = Infinity;
        for (const cp of this.world.capturePoints) {
            const dx = this.player.position.x - cp.x;
            const dz = this.player.position.z - cp.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestCp = cp;
            }
        }
        let nearestObjective = null;
        let nearestObjectiveDist = Infinity;
        const strategicObjectives = this.supportsStrategicObjectives() && this.world.getStrategicObjectives
            ? this.world.getStrategicObjectives()
            : [];
        for (const objective of strategicObjectives) {
            if (!objective.alive) continue;
            const dx = this.player.position.x - objective.position.x;
            const dz = this.player.position.z - objective.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < nearestObjectiveDist) {
                nearestObjectiveDist = dist;
                nearestObjective = objective;
            }
        }
        if (nearestObjective && nearestObjectiveDist < 45) {
            const pct = Math.max(0, Math.ceil((nearestObjective.health / nearestObjective.maxHealth) * 100));
            this.hud.updateObjective(`次要目标：${nearestObjective.name} ${pct}%`);
        } else if (nearestCp && nearestDist < 30) {
            const teamName = nearestCp.team === 0 ? '我方' : nearestCp.team === 1 ? '敌方' : '中立';
            let objText = `${nearestCp.name} ${nearestCp.label || '据点'} [${teamName}]`;
            if (nearestCp.captureProgress > 0) {
                objText += ` 占领中: ${Math.floor(nearestCp.captureProgress)}%`;
            }
            this.hud.updateObjective(objText);
        } else if (this.currentOrder && this.currentOrder.point) {
            const verb = this.currentOrder.type === 'attack' ? '进攻' : '防守';
            const p = this.currentOrder.point;
            const coords = this._getBattleTargetCoords(p);
            const tag = p.maxHealth ? p.name : `${p.name} (${Math.round(coords.x)}, ${Math.round(coords.z)})`;
            this.hud.updateObjective(`当前命令：${verb} ${tag} ${p.label || ''}`);
        } else {
            this.hud.updateObjective('占领据点获取分数');
        }

        // 小地图 - 性能优化：节流到每0.1秒更新一次（10fps足够）
        this.hud._minimapTimer -= dt;
        if (this.hud._minimapTimer <= 0) {
            this.hud._minimapTimer = 0.1;
            this.hud.updateMinimap(
                this.player.position,
                this.player.yaw,
                [...this.bots, this.player],
                this.world.capturePoints,
                CONFIG.WORLD.size,
                this.vehicles
            );
        }

        // 得分板 - 性能优化：节流到每0.5秒更新一次（避免每帧重建DOM）
        this.hud._scoreboardTimer -= dt;
        if (this.hud._scoreboardTimer <= 0) {
            this.hud._scoreboardTimer = 0.5;
            const friendlyBots = this.bots.filter(b => b.team === 0).map(b => b.getState());
            const enemyBots = this.bots.filter(b => b.team === 1).map(b => b.getState());
            friendlyBots.push({
                name: '你',
                kills: this.playerStats.kills,
                deaths: this.playerStats.deaths,
                assists: this.playerStats.assists || 0,
                isPlayer: true,
            });
            this.hud.updateScoreboard(friendlyBots, enemyBots);
            this._updateSquadHUD();

            // 模式动态目标（抢攻 fuse / 突破扇区）
            const modeUI = this.gameMode?.getUIData?.();
            if (modeUI?.modeHint) {
                this.hud.setObjectiveText(modeUI.modeHint);
            }
        }

        // 通知
        this.hud.updateNotification(dt);
    }

    _applyMapRenderSettings() {
        if (!this.renderer) return;
        const terrainConfig = this.world?.mapConfig?.terrain || {};
        this.renderer.toneMappingExposure = terrainConfig.toneMappingExposure ??
            CONFIG.RENDERER.toneMappingExposure ?? 1.1;
    }

    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    _clearAIGrenades() {
        const grenades = this.scene.userData.grenades;
        if (!grenades) return;
        for (const grenade of grenades) {
            if (grenade.mesh) this._disposeObject3D(grenade.mesh);
        }
        this.scene.userData.grenades = [];
    }

    // 处理AI投掷的手雷
    _updateAIGrenades(dt) {
        const grenades = this.scene.userData.grenades;
        if (!grenades || grenades.length === 0) return;

        for (let i = grenades.length - 1; i >= 0; i--) {
            const g = grenades[i];
            g.fuse -= dt;

            // 敌方手雷落在玩家附近：一次性急促警告音（战地经典的手雷警报）
            if (!g._warned && this.player?.alive && g.team !== this.player.team &&
                g.fuse < 2.2 && g.position.distanceToSquared(this.player.position) < 81) {
                g._warned = true;
                if (this.audio) this.audio.playGrenadeWarning();
                if (this.hud) this.hud.showNotification('⚠ 手雷！', 1.2);
            }

            // 抛物线运动
            g.velocityY -= 25 * dt;
            g.position.x += g.velocity.x * dt;
            g.position.y += g.velocityY * dt;
            g.position.z += g.velocity.z * dt;

            // 地面碰撞 - 真实弹跳+滚动（与玩家手雷一致的物理）
            const groundY = this.world.getHeight(g.position.x, g.position.z);
            if (g.position.y < groundY + 0.12) {
                g.position.y = groundY + 0.12;
                const impactSpeed = Math.abs(g.velocityY);
                if (impactSpeed > 1.5) {
                    // 弹跳：反弹+能量损失+旋转增强
                    g.velocityY = impactSpeed * 0.4;
                    g.velocity.x *= 0.7;
                    g.velocity.z *= 0.7;
                    if (g.angularVelocity) {
                        g.angularVelocity.x += (Math.random() - 0.5) * 8;
                        g.angularVelocity.z += (Math.random() - 0.5) * 8;
                    }
                    // 高速落地产生尘土反馈
                    if (impactSpeed > 3) {
                        this._createGrenadeBounceDust(g.position, groundY);
                    }
                } else {
                    // 低速停止弹跳，开始滚动
                    g.velocityY = 0;
                    g.isRolling = true;
                    g.velocity.x *= 0.92;
                    g.velocity.z *= 0.92;
                    if (g.angularVelocity) {
                        const rollSpeed = Math.sqrt(g.velocity.x * g.velocity.x + g.velocity.z * g.velocity.z);
                        if (rollSpeed > 0.1) {
                            g.angularVelocity.x = g.velocity.z * 3;
                            g.angularVelocity.z = -g.velocity.x * 3;
                        } else {
                            g.angularVelocity.multiplyScalar(0.9);
                        }
                    }
                }
            } else {
                g.isRolling = false;
            }

            // 障碍物碰撞 - 更真实的反弹
            if (this.world.checkCollision(g.position, 0.1, 0.1)) {
                g.position.x -= g.velocity.x * dt;
                g.position.z -= g.velocity.z * dt;
                if (Math.abs(g.velocity.x) > Math.abs(g.velocity.z)) {
                    g.velocity.x = -g.velocity.x * 0.5;
                } else {
                    g.velocity.z = -g.velocity.z * 0.5;
                }
                g.velocityY *= 0.7;
                if (g.angularVelocity) g.angularVelocity.y += (Math.random() - 0.5) * 6;
            }

            // 更新位置和旋转
            g.mesh.position.copy(g.position);
            if (g.rotation && g.angularVelocity) {
                g.rotation.x += g.angularVelocity.x * dt;
                g.rotation.y += g.angularVelocity.y * dt;
                g.rotation.z += g.angularVelocity.z * dt;
                g.mesh.rotation.set(g.rotation.x, g.rotation.y, g.rotation.z);
                g.angularVelocity.multiplyScalar(g.isRolling ? 0.98 : 0.995);
            }

            // 引信结束 - 爆炸
            if (g.fuse <= 0) {
                // 爆炸特效与实际范围伤害
                this._createGrenadeExplosion(g.position.clone(), g.radius, g.damage, g.team, g.owner || null);
                this.scene.remove(g.mesh);
                // 释放手雷模型（Group含多个子mesh）的几何体和材质，避免内存泄漏
                this._disposeObject3D(g.mesh);
                grenades.splice(i, 1);
            }
        }
    }

    // AI手雷弹跳尘土反馈（与玩家手雷一致的视觉表现）
    _createGrenadeBounceDust(position, groundY) {
        const material = new THREE.MeshBasicMaterial({
            color: 0x9a8a6a,
            transparent: true,
            opacity: 0.45,
            depthWrite: false,
        });
        const dust = new THREE.Mesh(this._gameFxGeo.dust, material);
        dust.position.set(position.x, groundY + 0.02, position.z);
        dust.rotation.x = -Math.PI / 2;
        dust.scale.setScalar(0.22);
        this.transientFx.add({
            owner: this,
            category: 'dust',
            priority: 1,
            life: 0.45,
            object: dust,
            update: (effect, dt, progress) => {
                dust.scale.setScalar(0.22 * (1 + progress * 3));
                material.opacity = (1 - progress) * 0.45;
            },
            release: () => material.dispose(),
            onReject: () => material.dispose(),
        });
    }

    // AI手雷爆炸 - 增强特效（冲击波环+烟尘柱+地面焦痕）
    _createGrenadeExplosion(position, radius, damage, team, source = null) {
        const visualRadius = Math.min(radius, 3);

        const flashMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8, depthWrite: false });
        const flash = new THREE.Mesh(this._gameFxGeo.flash, flashMat);
        flash.position.copy(position);
        flash.scale.setScalar(visualRadius);

        this.lightPool?.flash(position, 0xff6600, 2.5, visualRadius * 4, 0.45);

        const groundY = this.world.getHeight(position.x, position.z);
        const scorchY = groundY + 0.02;

        const shockwaveMat = new THREE.MeshBasicMaterial({
            color: 0xffcc44,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const shockwave = new THREE.Mesh(this._gameFxGeo.shockwave, shockwaveMat);
        shockwave.rotation.x = -Math.PI / 2;
        shockwave.position.set(position.x, scorchY, position.z);

        const smokeMat = new THREE.MeshBasicMaterial({
            color: 0x4a4a4a,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        const smokeCol = new THREE.Mesh(this._gameFxGeo.smokeColumn, smokeMat);
        smokeCol.position.set(position.x, position.y + visualRadius * 0.5, position.z);
        smokeCol.scale.setScalar(visualRadius);

        this.transientFx.add({
            owner: this,
            category: 'critical',
            priority: 4,
            cost: 3,
            life: 0.5,
            objects: [flash, shockwave, smokeCol],
            update: (effect, dt, progress) => {
                flash.scale.setScalar(visualRadius * THREE.MathUtils.lerp(1, 2.2, progress));
                flashMat.opacity = (1 - progress) * 0.8;
                shockwave.scale.setScalar(THREE.MathUtils.lerp(0.5, radius * 2.5, progress));
                shockwaveMat.opacity = (1 - progress) * 0.7;
                smokeCol.scale.setScalar(visualRadius * (1 + progress * 1.6));
                smokeCol.position.y += dt * 2.5;
                smokeMat.opacity = (1 - progress) * 0.55;
            },
            release: () => {
                flashMat.dispose();
                shockwaveMat.dispose();
                smokeMat.dispose();
            },
            onReject: () => {
                flashMat.dispose();
                shockwaveMat.dispose();
                smokeMat.dispose();
            },
        });

        const scorchMat = new THREE.MeshBasicMaterial({ color: 0x1a0800, transparent: true, opacity: 0.7, depthWrite: false });
        const scorch = new THREE.Mesh(this._gameFxGeo.scorch, scorchMat);
        scorch.rotation.x = -Math.PI / 2;
        scorch.position.set(position.x, scorchY + 0.01, position.z);
        scorch.scale.setScalar(Math.min(radius * 0.7, 2.5));
        this.transientFx.add({
            owner: this,
            category: 'mark',
            priority: 0,
            life: 8.75,
            object: scorch,
            update: (effect) => {
                const fade = Math.max(0, effect.elapsed - 8) / 0.75;
                scorchMat.opacity = (1 - fade) * 0.7;
            },
            release: () => scorchMat.dispose(),
            onReject: () => scorchMat.dispose(),
        });

        if (this.audio) this.audio.playExplosion(position);

        // 范围伤害
        this._onExplosion(position, radius, damage, team, source);
    }
}
