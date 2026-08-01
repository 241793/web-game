import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Terrain } from './Terrain.js?v=20260801.2';
import { ObstacleSystem } from './Obstacles.js?v=20260801.2';
import { createProceduralTexture } from '../utils/VisualAssets.js?v=20260801.2';
import { CONFIG } from '../config.js?v=20260801.2';

// 世界管理器 - 管理场景、地形、障碍物、据点
export class World {
    constructor(scene, mapId = 'default') {
        this.scene = scene;
        this.mapId = mapId;
        this.mapConfig = CONFIG.MAPS[mapId] || CONFIG.MAPS.default;
        const size = this.mapConfig.size || CONFIG.WORLD.size;
        this.terrain = new Terrain(scene, size, this.mapConfig.terrain);
        this.obstacles = new ObstacleSystem(scene);
        this.capturePoints = [];
        this.vehicles = [];  // 载具生成点
        this.teamSpawnPoints = { 0: [], 1: [] };
        this.strategicObjectives = [];
        this.lights = [];
        this.sky = null;
    }

    init() {
        this._setupLighting();
        this._setupSky();
        this.terrain.generate();
        this.obstacles.generateMap(this.terrain, this.mapConfig);
        this._createVegetation();
        this._createWater();
        this.strategicObjectives = this.obstacles.getStrategicObjectives ? this.obstacles.getStrategicObjectives() : [];
        this._createCapturePoints();
        this._createTeamSpawnPoints();
        this._createVehicleSpawns();
        this._resolveVehicleSpawnCollisions();
    }

    _setupLighting() {
        // 从地图配置读取环境色调（每张地图不同：雪地偏冷、火山偏暗等）
        const tc = this.mapConfig.terrain || {};
        const fogColor = tc.fogColor || CONFIG.WORLD.fogColor || 0x8899aa;
        const skyColor = tc.skyColor || CONFIG.WORLD.skyColor || 0x87a8c8;
        const skyTHREE = new THREE.Color(skyColor);

        const ambientIntensity = tc.ambientIntensity ?? 0.65;
        const ambientColor = skyTHREE.clone().lerp(new THREE.Color(0xffffff), 0.18);
        const ambient = new THREE.AmbientLight(ambientColor.getHex(), ambientIntensity);
        this.scene.add(ambient);
        this.lights.push(ambient);

        const hemisphereIntensity = tc.hemisphereIntensity ?? 1.1;
        const hemisphereGroundColor = tc.hemisphereGroundColor ?? tc.groundColor ?? 0x6e695c;
        const hemi = new THREE.HemisphereLight(skyColor, hemisphereGroundColor, hemisphereIntensity);
        this.scene.add(hemi);
        this.lights.push(hemi);

        // 太阳方向（每张地图海拔角和方位角不同）
        const el = THREE.MathUtils.clamp(tc.sunElevation ?? 0.65, 0.2, 0.95);
        const horiz = Math.sqrt(1 - el * el);
        const azimuth = tc.sunAzimuth ?? 0.62;
        this.sunDirection = new THREE.Vector3(
            Math.cos(azimuth) * horiz, el, Math.sin(azimuth) * horiz
        ).normalize();

        // 主光源 - 太阳（带投影，阴影相机跟随玩家）
        const sunColor = tc.sunColor ?? CONFIG.WORLD.sunColor;
        const sunIntensity = tc.sunIntensity ?? CONFIG.WORLD.sunIntensity;
        const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
        sun.position.copy(this.sunDirection).multiplyScalar(160);
        if (CONFIG.RENDERER.shadowMapEnabled) {
            const d = CONFIG.RENDERER.shadowDistance ?? 70;
            sun.castShadow = true;
            sun.shadow.mapSize.set(CONFIG.RENDERER.shadowMapSize ?? 2048, CONFIG.RENDERER.shadowMapSize ?? 2048);
            sun.shadow.camera.left = -d;
            sun.shadow.camera.right = d;
            sun.shadow.camera.top = d;
            sun.shadow.camera.bottom = -d;
            sun.shadow.camera.near = 20;
            sun.shadow.camera.far = 360;
            sun.shadow.bias = -0.0004;
            sun.shadow.normalBias = 0.06;
        }
        this.scene.add(sun);
        this.scene.add(sun.target);
        this.sun = sun;
        this.lights.push(sun);

        // 低强度反向补光保留暗部可读性，同时避免抹平主太阳塑造的体积感
        const fillIntensity = tc.fillIntensity ?? 0.4;
        const fillColor = skyTHREE.clone().lerp(new THREE.Color(0xffffff), 0.08);
        const fillLight = new THREE.DirectionalLight(fillColor.getHex(), fillIntensity);
        fillLight.position.set(-this.sunDirection.x * 120, 55, -this.sunDirection.z * 120);
        this.scene.add(fillLight);
        this.lights.push(fillLight);

        // 雾：颜色跟随地图配置（可被地图覆盖距离）
        const fogNear = tc.fogNear ?? CONFIG.WORLD.fogNear ?? 55;
        const fogFar = tc.fogFar ?? CONFIG.WORLD.fogFar ?? 340;
        this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
        this.scene.background = new THREE.Color(fogColor);
    }

    // 阴影相机跟随目标（按纹素对齐，避免闪烁）
    updateShadowTarget(position) {
        if (!this.sun || !this.sun.castShadow) return;
        const d = CONFIG.RENDERER.shadowDistance ?? 70;
        const mapSize = this.sun.shadow.mapSize.x || 2048;
        const texel = (d * 2) / mapSize * 4;
        const tx = Math.round(position.x / texel) * texel;
        const tz = Math.round(position.z / texel) * texel;
        this.sun.target.position.set(tx, 0, tz);
        this.sun.position.set(
            tx + this.sunDirection.x * 160,
            this.sunDirection.y * 160,
            tz + this.sunDirection.z * 160
        );
    }

    // 阴影质量分级：2=全质量 1=低分辨率 0=关闭（自适应性能调用）
    setShadowQuality(level) {
        if (!this.sun) return;
        if (this._shadowQuality === level) return;
        this._shadowQuality = level;
        if (level <= 0) {
            this.sun.castShadow = false;
            return;
        }
        this.sun.castShadow = CONFIG.RENDERER.shadowMapEnabled;
        const size = level >= 2 ? (CONFIG.RENDERER.shadowMapSize ?? 2048) : 1024;
        if (this.sun.shadow.mapSize.x !== size) {
            this.sun.shadow.mapSize.set(size, size);
            if (this.sun.shadow.map) {
                this.sun.shadow.map.dispose();
                this.sun.shadow.map = null;
            }
        }
    }

    _setupSky() {
        // 从地图配置读取天空颜色（雪地偏亮、火山偏暗）
        const tc = this.mapConfig.terrain || {};
        const skyColor = tc.skyColor || CONFIG.WORLD.skyColor || 0x87a8c8;
        const fogColor = tc.fogColor || CONFIG.WORLD.fogColor || 0x8899aa;
        // 天空顶部 = 天空色，底部 = 雾色（地平线过渡）
        const topColor = new THREE.Color(skyColor);
        const horizonBrightness = tc.horizonBrightness ?? 0.15;
        const bottomColor = new THREE.Color(fogColor).lerp(new THREE.Color(0xffffff), horizonBrightness);
        const sunColor = new THREE.Color(tc.sunColor ?? 0xfff2dc);
        const sunDir = this.sunDirection || new THREE.Vector3(0.5, 0.65, 0.35).normalize();

        // 渐变天空 + 太阳圆盘 + 程序化动态云
        const skyGeo = new THREE.SphereGeometry(500, 24, 12);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: topColor },
                bottomColor: { value: bottomColor },
                sunColor: { value: sunColor },
                sunDir: { value: sunDir.clone() },
                cloudCover: { value: tc.cloudCover ?? 0.5 },
                time: { value: 0 },
                offset: { value: 33 },
                exponent: { value: 0.6 },
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform vec3 sunColor;
                uniform vec3 sunDir;
                uniform float cloudCover;
                uniform float time;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;

                float hash(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
                }
                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
                }
                float fbm(vec2 p) {
                    float v = 0.0;
                    float a = 0.5;
                    for (int i = 0; i < 4; i++) {
                        v += a * noise(p);
                        p = p * 2.15 + vec2(11.3, 7.7);
                        a *= 0.5;
                    }
                    return v;
                }

                void main() {
                    vec3 dir = normalize(vWorldPosition + vec3(0.0, offset, 0.0));
                    float h = max(dir.y, 0.0);

                    // 基础渐变
                    vec3 col = mix(bottomColor, topColor, pow(h, exponent));

                    // 太阳圆盘 + 光晕
                    float sunDot = max(dot(dir, normalize(sunDir)), 0.0);
                    float disc = smoothstep(0.9995, 0.99985, sunDot);
                    float halo = pow(sunDot, 240.0) * 0.55 + pow(sunDot, 12.0) * 0.14;
                    col += sunColor * (disc * 1.6 + halo);

                    // 云层（平面投影 + fbm，随时间漂移）
                    if (dir.y > 0.015) {
                        vec2 uv = dir.xz / (dir.y + 0.14) * 1.35;
                        uv += vec2(time * 0.012, time * 0.004);
                        float f = fbm(uv);
                        float cov = 1.0 - cloudCover;
                        float cloud = smoothstep(cov - 0.08, cov + 0.24, f);
                        // 云底稍暗，被太阳照亮的一侧偏暖
                        float shade = fbm(uv * 1.9 + 3.1);
                        vec3 cloudCol = mix(vec3(0.72, 0.74, 0.78), vec3(1.04, 1.02, 0.99), shade);
                        cloudCol += sunColor * pow(sunDot, 5.0) * 0.22;
                        // 地平线处云淡出
                        float horizonFade = smoothstep(0.015, 0.16, dir.y);
                        col = mix(col, cloudCol, cloud * horizonFade * 0.88);
                    }

                    gl_FragColor = vec4(col, 1.0);
                }
            `,
            side: THREE.BackSide,
            depthWrite: false,
        });
        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.sky.frustumCulled = false;
        this.sky.renderOrder = -10;
        this.scene.add(this.sky);
        this._skyMat = skyMat;
    }

    // 每帧更新：云漂移、水面波动、阴影相机跟随
    update(dt, playerPosition = null) {
        if (this._skyMat) {
            this._skyMat.uniforms.time.value += dt;
        }
        if (this._waterMat) {
            this._waterMat.uniforms.time.value += dt;
        }
        if (playerPosition) {
            this.updateShadowTarget(playerPosition);
        }
    }

    // 草地植被（InstancedMesh 单次绘制，密度/颜色随地图差异化）
    _createVegetation() {
        const tc = this.mapConfig.terrain || {};
        let count = tc.grassDensity ?? 1800;
        // 诺曼底：配置已压低，再额外砍一刀，只保留内陆稀疏草
        if (this.mapId === 'normandy') count = Math.floor(count * 0.7);
        if (count <= 0) return;

        const grassColor = new THREE.Color(tc.grassColor ?? 0x5e7a3a);
        const tex = createProceduralTexture('grass_blades', {
            baseColor: grassColor.getHex(),
            accentColor: grassColor.clone().lerp(new THREE.Color(0xd8e08a), 0.5).getHex(),
            size: 128,
        });

        const quadA = new THREE.PlaneGeometry(0.9, 0.55);
        quadA.translate(0, 0.26, 0);
        const quadB = quadA.clone().rotateY(Math.PI / 2);
        const geo = mergeGeometries([quadA, quadB]);
        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            alphaTest: 0.45,
            side: THREE.DoubleSide,
            roughness: 1.0,
            metalness: 0.0,
        });

        const mesh = new THREE.InstancedMesh(geo, mat, count);
        mesh.name = 'vegetation_grass';
        mesh.userData.noShadow = true;

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        const half = ((this.mapConfig.size || 400) / 2) * 0.94;
        const baseH = tc.baseHeight ?? 0;
        const maxGrassH = baseH + (tc.hillHeight ?? 18) * 0.85;
        const waterLevel = this.mapConfig.water?.level;
        let placed = 0;
        let attempts = 0;
        while (placed < count && attempts < count * 5) {
            attempts++;
            const x = (Math.random() * 2 - 1) * half;
            const z = (Math.random() * 2 - 1) * half;
            // 避开主路十字与建筑内部
            if (Math.abs(x) < 7.5 || Math.abs(z) < 7.5) continue;
            if (this.obstacles?.isInsideBuilding?.(x, z, 0.5)) continue;
            // 诺曼底：海滩侧不长草
            if (this.mapId === 'normandy' && z > 95) continue;
            // 建筑平台 / 道路平坦区不长草
            if (this.terrain.isInFlatArea?.(x, z)) continue;
            // 必须用原始 mesh 高度（rawHeightData），绝不用被建筑烘焙抬高的 heightData
            const y = this.terrain.getMeshHeight
                ? this.terrain.getMeshHeight(x, z)
                : this.getHeight(x, z);
            if (y > maxGrassH) continue;    // 高海拔岩石区不长草
            if (waterLevel != null && y <= waterLevel + 0.35) continue; // 水下不长草
            // 平台边缘：可行走高度被抬、原始地面仍低 → 草会“飞”在空中
            const walkY = this.getHeight(x, z);
            if (Math.abs(walkY - y) > 0.4) continue;
            // 陡坡过滤（更严，减少悬崖草）
            if (this.terrain.getLocalSlope && this.terrain.getLocalSlope(x, z, 2.2) > 0.45) continue;
            // 略微下压，避免根部悬空
            dummy.position.set(x, y - 0.04, z);
            dummy.rotation.y = Math.random() * Math.PI;
            const s = 0.7 + Math.random() * 0.9;
            dummy.scale.set(s, s * (0.8 + Math.random() * 0.5), s);
            dummy.updateMatrix();
            mesh.setMatrixAt(placed, dummy.matrix);
            color.setRGB(
                0.72 + Math.random() * 0.5,
                0.72 + Math.random() * 0.5,
                0.72 + Math.random() * 0.5
            );
            mesh.setColorAt(placed, color);
            placed++;
        }
        mesh.count = placed;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere();
        this.scene.add(mesh);
        this._grassMesh = mesh;
    }

    // 海面/水面（诺曼底、硫磺岛等海岸地图），简单波动着色
    _createWater() {
        const wc = this.mapConfig.water;
        if (!wc) return;

        const size = (this.mapConfig.size || 400) * 1.6;
        const geo = new THREE.PlaneGeometry(size, size, 48, 48);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterColor: { value: new THREE.Color(wc.color ?? 0x2a4a5e) },
                deepColor: { value: new THREE.Color(wc.deepColor ?? 0x16303f) },
                sunDir: { value: (this.sunDirection || new THREE.Vector3(0.5, 0.7, 0.3)).clone() },
                fogColor: { value: new THREE.Color(this.mapConfig.terrain?.fogColor ?? 0x8899aa) },
                fogNear: { value: this.scene.fog?.near ?? 55 },
                fogFar: { value: this.scene.fog?.far ?? 340 },
            },
            vertexShader: `
                uniform float time;
                varying vec3 vWorldPos;
                varying float vWave;
                void main() {
                    vec3 pos = position;
                    float w1 = sin(pos.x * 0.08 + time * 1.1) * cos(pos.z * 0.06 + time * 0.8);
                    float w2 = sin(pos.x * 0.021 + pos.z * 0.017 + time * 0.5);
                    pos.y += w1 * 0.25 + w2 * 0.4;
                    vWave = w1 * 0.5 + 0.5;
                    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
                    vWorldPos = worldPos.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            fragmentShader: `
                uniform vec3 waterColor;
                uniform vec3 deepColor;
                uniform vec3 sunDir;
                uniform vec3 fogColor;
                uniform float fogNear;
                uniform float fogFar;
                uniform float time;
                varying vec3 vWorldPos;
                varying float vWave;
                void main() {
                    vec3 col = mix(deepColor, waterColor, vWave);
                    // 太阳高光带
                    vec3 viewDir = normalize(cameraPosition - vWorldPos);
                    vec3 halfDir = normalize(viewDir + normalize(sunDir));
                    float spec = pow(max(halfDir.y, 0.0), 90.0);
                    col += vec3(1.0, 0.95, 0.8) * spec * 0.55;
                    // 微波纹闪烁
                    float sparkle = sin(vWorldPos.x * 2.1 + time * 2.5) * sin(vWorldPos.z * 1.7 + time * 2.0);
                    col += vec3(0.06) * max(sparkle, 0.0) * vWave;
                    // 场景雾
                    float dist = distance(cameraPosition, vWorldPos);
                    float fogF = clamp((dist - fogNear) / (fogFar - fogNear), 0.0, 1.0);
                    col = mix(col, fogColor, fogF);
                    gl_FragColor = vec4(col, 0.92);
                }
            `,
            transparent: true,
            depthWrite: false,
        });
        const water = new THREE.Mesh(geo, mat);
        water.position.y = wc.level ?? -1.2;
        water.name = 'water';
        water.userData.noShadow = true;
        this.scene.add(water);
        this._waterMesh = water;
        this._waterMat = mat;
        this.waterLevel = water.position.y;
    }

    _createCapturePoints() {
        // 从地图配置读取据点数据
        const configPoints = this.mapConfig.capturePoints || [];
        const points = configPoints.map((p, i) => ({
            x: p.x, z: p.z, name: p.name || p.id,
            team: i === 0 ? 0 : (i === configPoints.length - 1 ? 1 : -1),
            radius: p.radius || 12,
            label: p.label || p.name || p.id,
        }));

        // 如果配置没有据点，使用默认
        if (points.length === 0) {
            points.push(
                { x: -95, z: -95, name: 'A', team: 0, radius: 14, label: '我方基地' },
                { x: 0, z: 0, name: 'B', team: -1, radius: 15, label: '中央枢纽' },
                { x: 95, z: 95, name: 'C', team: 1, radius: 14, label: '敌方基地' },
            );
        }

        for (const p of points) {
            const y = this.terrain.getHeight(p.x, p.z);
            const cp = {
                x: p.x, z: p.z, y: y,
                name: p.name,
                team: p.team,         // 当前控制方: -1=中立, 0=我方, 1=敌方
                capturingTeam: -1,    // 正在占领的队伍
                captureProgress: 0,   // 0-100
                radius: p.radius || 12,
                flagMesh: null,
                flagPole: null,
                ringMesh: null,
                glowMesh: null,
                label: p.label || p.name,
                locked: false,        // 突破模式：是否锁定
            };

            // 旗杆
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.15, 12),
                new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 })
            );
            pole.position.set(p.x, y + 6, p.z);
            this.scene.add(pole);
            cp.flagPole = pole;

            // 旗帜
            const flagGeo = new THREE.PlaneGeometry(4, 2.5);
            const flagMat = new THREE.MeshStandardMaterial({
                color: 0x888888,
                side: THREE.DoubleSide,
                roughness: 0.8,
            });
            const flag = new THREE.Mesh(flagGeo, flagMat);
            flag.position.set(p.x + 2, y + 10, p.z);
            this.scene.add(flag);
            cp.flagMesh = flag;

            // 地面环
            const ringGeo = new THREE.RingGeometry(cp.radius - 0.5, cp.radius, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(p.x, y + 0.1, p.z);
            this.scene.add(ring);
            cp.ringMesh = ring;

            // 发光圆
            const glowGeo = new THREE.CircleGeometry(cp.radius, 32);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide,
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.rotation.x = -Math.PI / 2;
            glow.position.set(p.x, y + 0.05, p.z);
            this.scene.add(glow);
            cp.glowMesh = glow;

            this._updateCapturePointColor(cp);
            this.capturePoints.push(cp);
        }
        this._createCapturePointSupportAssets();
    }

    _createCapturePointSupportAssets() {
        for (const cp of this.capturePoints) {
            const angle = cp.team === 1 ? Math.PI * 0.25 : Math.PI * 1.25;
            const dist = Math.max(5.5, cp.radius * 0.45);
            const x = cp.x + Math.cos(angle) * dist;
            const z = cp.z + Math.sin(angle) * dist;
            const y = this.getHeight(x, z);

            const group = new THREE.Group();
            group.name = `support_${cp.name}`;
            group.position.set(x, y, z);

            const crateMat = new THREE.MeshStandardMaterial({ color: 0x4f5d4a, roughness: 0.85 });
            const medMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.65 });
            const ammoMat = new THREE.MeshStandardMaterial({ color: 0x6b5a34, roughness: 0.85 });
            const markerMat = new THREE.MeshBasicMaterial({ color: 0x44ccff, transparent: true, opacity: 0.75 });

            const base = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 1.1), crateMat);
            base.position.y = 0.45;
            group.add(base);

            const ammo = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.9), ammoMat);
            ammo.position.set(-0.55, 1.18, 0);
            group.add(ammo);

            const med = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.8), medMat);
            med.position.set(0.55, 1.15, 0);
            group.add(med);

            const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.04), new THREE.MeshBasicMaterial({ color: 0xcc3333 }));
            crossH.position.set(0.55, 1.42, 0.42);
            group.add(crossH);
            const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.04), new THREE.MeshBasicMaterial({ color: 0xcc3333 }));
            crossV.position.set(0.55, 1.42, 0.43);
            group.add(crossV);

            const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), markerMat);
            beacon.position.set(0, 2.1, 0);
            group.add(beacon);

            this.scene.add(group);
            this.obstacles.addCollisionBox(x, y, z, 1.9, 1.35, 1.1, base);
            cp.supportPosition = new THREE.Vector3(x, y, z);
            cp.supportMesh = group;
            this._updateCapturePointColor(cp);
        }
    }

    _updateCapturePointColor(cp) {
        let color;
        if (cp.team === 0) color = CONFIG.TEAMS.friendly.color;
        else if (cp.team === 1) color = CONFIG.TEAMS.enemy.color;
        else color = 0x888888;

        cp.flagMesh.material.color.setHex(color);
        cp.ringMesh.material.color.setHex(color);
        cp.glowMesh.material.color.setHex(color);
        if (cp.supportMesh) {
            cp.supportMesh.traverse(child => {
                if (child.isMesh && child.material && child.material.color && child.name !== 'medical_cross') {
                    if (child.material.opacity !== undefined && child.material.transparent) {
                        child.material.color.setHex(color);
                    }
                }
            });
        }
    }

    _createVehicleSpawns() {
        // 从地图配置读取载具刷新点
        if (this.mapConfig.vehicleSpawns && this.mapConfig.vehicleSpawns.length > 0) {
            this.vehicleSpawns = this.mapConfig.vehicleSpawns.map(s => ({ ...s }));
        } else {
            // 默认载具生成位置
            this.vehicleSpawns = [
                { type: 'jeep', x: -132, z: -112, team: 0, yaw: -Math.PI * 0.25 },
                { type: 'apc', x: -126, z: -96, team: 0, yaw: -Math.PI * 0.22 },
                { type: 'tank', x: -134, z: -76, team: 0, yaw: -Math.PI * 0.18 },
                { type: 'heli', x: -82, z: -66, team: 0, yaw: -Math.PI * 0.25 },
                { type: 'jeep', x: -138, z: 28, team: 0, yaw: -Math.PI * 0.05 },
                { type: 'jeep', x: 132, z: 112, team: 1, yaw: Math.PI * 0.75 },
                { type: 'apc', x: 126, z: 96, team: 1, yaw: Math.PI * 0.78 },
                { type: 'tank', x: 134, z: 76, team: 1, yaw: Math.PI * 0.82 },
                { type: 'heli', x: 82, z: 66, team: 1, yaw: Math.PI * 0.75 },
                { type: 'jeep', x: 138, z: -28, team: 1, yaw: Math.PI * 0.95 },
            ];
        }
    }

    _createTeamSpawnPoints() {
        // 从地图配置读取出生区
        const spawnAreas = this.mapConfig.spawnAreas;
        if (spawnAreas) {
            this.teamSpawnPoints = { 0: [], 1: [] };
            for (const team of [0, 1]) {
                const area = spawnAreas[team];
                if (!area) continue;
                const c = area.center;
                const r = area.radius || 10;
                // 在出生区圆内生成6个出生点
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
                    const dist = Math.random() * r;
                    this.teamSpawnPoints[team].push({
                        x: c.x + Math.cos(angle) * dist,
                        z: c.z + Math.sin(angle) * dist,
                    });
                }
            }
        } else {
            // 默认出生点
            this.teamSpawnPoints = {
                0: [
                    { x: -116, z: -126 }, { x: -104, z: -122 }, { x: -126, z: -108 },
                    { x: -92, z: -116 }, { x: -118, z: -92 }, { x: -84, z: -86 },
                ],
                1: [
                    { x: 116, z: 126 }, { x: 104, z: 122 }, { x: 126, z: 108 },
                    { x: 92, z: 116 }, { x: 118, z: 92 }, { x: 84, z: 86 },
                ],
            };
        }

        for (const team of [0, 1]) {
            for (const spawn of this.teamSpawnPoints[team]) {
                const safe = this._findSafeGroundPosition(spawn.x, spawn.z, 0.45, 1.8);
                spawn.x = safe.x;
                spawn.z = safe.z;
                spawn.y = safe.y;
            }
        }
    }

    _findSafeGroundPosition(x, z, radius = 0.45, height = 1.8) {
        const candidateOffsets = [
            [0, 0], [3, 0], [-3, 0], [0, 3], [0, -3],
            [5, 3], [-5, 3], [5, -3], [-5, -3],
            [8, 0], [-8, 0], [0, 8], [0, -8],
        ];
        const halfSize = CONFIG.WORLD.size / 2 - 4;
        for (const [ox, oz] of candidateOffsets) {
            const px = THREE.MathUtils.clamp(x + ox, -halfSize, halfSize);
            const pz = THREE.MathUtils.clamp(z + oz, -halfSize, halfSize);
            if (this._isGroundPositionClear(px, pz, radius, height)) {
                const py = this.getHeight(px, pz);
                return { x: px, y: py, z: pz };
            }
        }
        return { x, y: this.getHeight(x, z), z };
    }

    _isGroundPositionClear(x, z, radius = 0.45, height = 1.8) {
        const y = this.getHeight(x, z);
        return !this.checkCharacterCollision(new THREE.Vector3(x, y, z), radius, height);
    }

    getTeamSpawnPoint(team = 0) {
        const list = this.teamSpawnPoints[team] || this.teamSpawnPoints[0] || [];
        if (list.length === 0) {
            return new THREE.Vector3(team === 0 ? -95 : 95, 0, team === 0 ? -95 : 95);
        }
        const base = list[Math.floor(Math.random() * list.length)];
        const safe = this._findSafeGroundPosition(
            base.x + (Math.random() - 0.5) * 5,
            base.z + (Math.random() - 0.5) * 5,
            0.45,
            1.8
        );
        return new THREE.Vector3(safe.x, safe.y, safe.z);
    }

    getDeployPositionNear(cp, team = 0) {
        if (!cp) return this.getTeamSpawnPoint(team);
        const angleOffset = team === 0 ? Math.PI * 1.25 : Math.PI * 0.25;
        const samples = 12;
        for (let i = 0; i < samples; i++) {
            const angle = angleOffset + (i - samples / 2) * (Math.PI / samples);
            const dist = Math.max(7, (cp.radius || 12) * 0.65) + (i % 3) * 2;
            const x = cp.x + Math.cos(angle) * dist;
            const z = cp.z + Math.sin(angle) * dist;
            if (!this._isGroundPositionClear(x, z, 0.45, 1.8)) continue;
            const safe = this._findSafeGroundPosition(x, z, 0.45, 1.8);
            return new THREE.Vector3(safe.x, safe.y, safe.z);
        }
        return this.getTeamSpawnPoint(team);
    }

    getInfantryApproachPoint(cp, team = 0) {
        if (!cp || !this.obstacles?.buildingDoorZones) return this.getDeployPositionNear(cp, team);

        const doors = [];
        for (const door of this.obstacles.buildingDoorZones) {
            const dx = door.x - cp.x;
            const dz = door.z - cp.z;
            const distSq = dx * dx + dz * dz;
            if (distSq > (cp.radius + 24) * (cp.radius + 24)) continue;
            const teamBiasX = team === 0 ? -1 : 1;
            const teamBiasZ = team === 0 ? -1 : 1;
            const approachScore = Math.sqrt(distSq) - (door.x - cp.x) * teamBiasX * 0.15 - (door.z - cp.z) * teamBiasZ * 0.15;
            doors.push({ door, score: approachScore });
        }

        if (doors.length === 0) return this.getDeployPositionNear(cp, team);
        doors.sort((a, b) => a.score - b.score);
        const door = doors[Math.floor(Math.random() * Math.min(doors.length, 3))].door;
        const fromCpX = door.x - cp.x;
        const fromCpZ = door.z - cp.z;
        const len = Math.sqrt(fromCpX * fromCpX + fromCpZ * fromCpZ) || 1;
        const x = door.x + fromCpX / len * 2.2 + (Math.random() - 0.5) * 2.5;
        const z = door.z + fromCpZ / len * 2.2 + (Math.random() - 0.5) * 2.5;
        const safe = this._findSafeGroundPosition(x, z, 0.45, 1.8);
        return new THREE.Vector3(safe.x, safe.y, safe.z);
    }

    getStrategicObjectiveApproachPoint(objective, team = 0) {
        if (!objective) return this.getTeamSpawnPoint(team);

        const targetX = objective.position?.x ?? objective.x ?? 0;
        const targetZ = objective.position?.z ?? objective.z ?? 0;
        const bias = team === 0 ? -1 : 1;
        const samples = [
            [18 * bias, 0],
            [14 * bias, 10],
            [14 * bias, -10],
            [8 * bias, 14],
            [8 * bias, -14],
            [-12 * bias, 6],
            [-12 * bias, -6],
        ];

        for (const [ox, oz] of samples) {
            const x = targetX + ox;
            const z = targetZ + oz;
            if (!this._isGroundPositionClear(x, z, 0.45, 1.8)) continue;
            const safe = this._findSafeGroundPosition(x, z, 0.45, 1.8);
            return new THREE.Vector3(safe.x, safe.y, safe.z);
        }

        return this.getDeployPositionNear({ x: targetX, z: targetZ, radius: 12 }, team);
    }

    _resolveVehicleSpawnCollisions() {
        const radii = { jeep: 1.7, armedjeep: 1.7, apc: 2.4, tank: 2.8, heli: 3.2, plane: 4.8 };
        const height = { jeep: 2.0, armedjeep: 2.4, apc: 2.4, tank: 2.8, heli: 3.0, plane: 3.0 };
        const candidateOffsets = [
            [0, 0], [8, 0], [-8, 0], [0, 8], [0, -8],
            [12, 6], [-12, 6], [12, -6], [-12, -6],
            [18, 0], [-18, 0], [0, 18], [0, -18],
            [18, 12], [-18, 12], [18, -12], [-18, -12],
        ];
        const halfSize = CONFIG.WORLD.size / 2 - 8;

        for (const spawn of this.vehicleSpawns) {
            const radius = radii[spawn.type] || 2.0;
            const h = height[spawn.type] || 2.4;
            let resolved = false;
            for (const [ox, oz] of candidateOffsets) {
                const x = THREE.MathUtils.clamp(spawn.x + ox, -halfSize, halfSize);
                const z = THREE.MathUtils.clamp(spawn.z + oz, -halfSize, halfSize);
                const y = this.getHeight(x, z);
                if (!this.checkCollision(new THREE.Vector3(x, y, z), radius, h)) {
                    spawn.x = x;
                    spawn.z = z;
                    spawn.y = y;
                    resolved = true;
                    break;
                }
            }
            if (!resolved) {
                spawn.y = this.getHeight(spawn.x, spawn.z);
            }
        }
    }

    // 更新据点逻辑
    // capturePointTimeOverride：模式可覆盖全局占领时长（如突破 30s）
    updateCapturePoints(dt, players) {
        const captureTime = Math.max(1, this.capturePointTimeOverride || CONFIG.GAME.capturePointTime || 12);
        const captureRate = 100 / captureTime;

        for (const cp of this.capturePoints) {
            // 突破模式锁区：非当前扇区不可占领
            if (cp.locked) {
                cp.contested = false;
                cp.friendlyCount = 0;
                cp.enemyCount = 0;
                continue;
            }

            // 统计据点内的双方人数
            let friendlyCount = 0;
            let enemyCount = 0;

            for (const p of players) {
                if (!p.alive) continue;
                if (p.occupants && !p.occupants.some(o => o && o.alive)) continue;
                const dx = p.position.x - cp.x;
                const dz = p.position.z - cp.z;
                if (Math.sqrt(dx * dx + dz * dz) < cp.radius) {
                    if (p.team === 0) friendlyCount++;
                    else enemyCount++;
                }
            }

            cp.friendlyCount = friendlyCount;
            cp.enemyCount = enemyCount;
            cp.contested = friendlyCount > 0 && enemyCount > 0;

            // 推进占领进度（换向时先中和旧进度，避免继承 90% 瞬占）
            const pushCapture = (team, count) => {
                if (cp.team === team) {
                    // 己方已占：有守军时缓慢清掉敌方残留进度
                    if (cp.captureProgress > 0 && cp.capturingTeam !== team) {
                        cp.captureProgress = Math.max(0, cp.captureProgress - dt * captureRate * 0.8);
                        if (cp.captureProgress <= 0) cp.capturingTeam = team;
                    }
                    return;
                }
                const bonus = Math.min(0.75, Math.max(0, count - 1) * 0.25);
                const rate = captureRate * (1 + bonus);
                if (cp.capturingTeam !== undefined && cp.capturingTeam !== team && cp.captureProgress > 0) {
                    // 换向中和
                    cp.captureProgress -= dt * rate;
                    if (cp.captureProgress <= 0) {
                        cp.captureProgress = 0;
                        cp.capturingTeam = team;
                    }
                } else {
                    cp.capturingTeam = team;
                    cp.captureProgress += dt * rate;
                }
            };

            if (friendlyCount > 0 && enemyCount === 0) {
                pushCapture(0, friendlyCount);
            } else if (enemyCount > 0 && friendlyCount === 0) {
                pushCapture(1, enemyCount);
            } else if (friendlyCount > 0 && enemyCount > 0) {
                // 争夺中，暂停
            } else {
                // 无人，缓慢回退未完成进度
                if (cp.captureProgress > 0 && cp.capturingTeam !== cp.team) {
                    cp.captureProgress -= dt * captureRate * 0.35;
                    if (cp.captureProgress < 0) cp.captureProgress = 0;
                }
            }

            // 占领完成
            if (cp.captureProgress >= 100) {
                cp.team = cp.capturingTeam;
                cp.captureProgress = 0;
                this._updateCapturePointColor(cp);
                if (this.onCapture) this.onCapture(cp);
            }

            // 更新旗帜动画（降频）
            cp._animTimer = (cp._animTimer || 0) - dt;
            if (cp._animTimer <= 0) {
                cp._animTimer = 0.1;
                if (cp.flagMesh) {
                    cp.flagMesh.position.y = cp.y + 10 + Math.sin(performance.now() * 0.003) * 0.2;
                    cp.flagMesh.rotation.y += 0.05;
                }
            }
        }
    }

    // 获取地形高度
    getHeight(x, z) {
        return this.terrain.getHeight(x, z);
    }

    // 真实 mesh 高度（忽略建筑平台）
    getMeshHeight(x, z) {
        return this.terrain.getMeshHeight ? this.terrain.getMeshHeight(x, z) : this.getHeight(x, z);
    }

    // 水域判定：有 water.level 且地面低于水位
    isUnderwater(x, z, y = null) {
        if (this.waterLevel == null) return false;
        const ground = y != null ? y : this.getMeshHeight(x, z);
        return ground < this.waterLevel - 0.15;
    }

    // 水深（正值=在水下）
    getWaterDepth(x, z) {
        if (this.waterLevel == null) return 0;
        return Math.max(0, this.waterLevel - this.getMeshHeight(x, z));
    }

    // 碰撞检测
    checkCollision(position, radius, height) {
        return this.obstacles.checkCollision(position, radius, height);
    }

    getSupportHeight(position, radius, fromFeetY, toFeetY) {
        const info = this.getSupportSurfaceInfo(position, radius, fromFeetY, toFeetY);
        return info ? info.y : null;
    }

    getSupportSurfaceInfo(position, radius, fromFeetY, toFeetY) {
        let best = null;
        if (this.obstacles.getSupportSurfaceInfo) {
            best = this.obstacles.getSupportSurfaceInfo(position, radius, fromFeetY, toFeetY);
        }
        const vehicleTop = this.getVehicleSupportHeight(position, radius, fromFeetY, toFeetY);
        if (typeof vehicleTop === 'number' && (!best || vehicleTop > best.y)) {
            best = { y: vehicleTop, kind: 'vehicle', mesh: null };
        }
        return best;
    }

    isInsideBuilding(x, z, padding = 0) {
        return !!this.obstacles?.isInsideBuilding?.(x, z, padding);
    }

    breakGlass(mesh, hitPoint = null) {
        return !!this.obstacles?.breakGlass?.(mesh, hitPoint);
    }

    findBreakableGlassNear(origin, direction, maxDistance = 2.5) {
        if (!this.obstacles?.findBreakableGlassNear) return null;
        return this.obstacles.findBreakableGlassNear(origin, direction, maxDistance);
    }

    resolveMovement(oldPos, newPos, radius, height) {
        return this.obstacles.resolveMovement(oldPos, newPos, radius, height);
    }

    getDynamicVehicles() {
        return this.scene?.userData?.vehicles || [];
    }

    _getVehicleCollisionDef(vehicle) {
        // 行走碰撞用"实心车体"尺寸，不含旋翼/机翼等薄悬空件（机翼在头顶以上，人能从下面走过；
        // 用翼展当碰撞盒会产生 9m 宽空气墙，玩家根本无法靠近登机）
        const defs = {
            jeep: { w: 2.3, d: 4.5, h: 2.0 },
            apc: { w: 3.3, d: 5.8, h: 2.6 },
            tank: { w: 3.7, d: 6.2, h: 2.9 },
            heli: { w: 2.2, d: 5.5, h: 3.0 },
            plane: { w: 1.6, d: 6.5, h: 2.8 },
        };
        return defs[vehicle?.type] || { w: 2.4, d: 4.0, h: 2.2 };
    }

    _pointInVehicleFootprint(vehicle, x, z, radius = 0) {
        const def = this._getVehicleCollisionDef(vehicle);
        const dx = x - vehicle.position.x;
        const dz = z - vehicle.position.z;
        const cos = Math.cos(vehicle.yaw || 0);
        const sin = Math.sin(vehicle.yaw || 0);
        const lx = dx * cos - dz * sin;
        const lz = dx * sin + dz * cos;
        return Math.abs(lx) <= def.w / 2 + radius && Math.abs(lz) <= def.d / 2 + radius;
    }

    checkVehicleCollision(position, radius, height, ignoreVehicle = null) {
        const vehicles = this.getDynamicVehicles();
        const feetY = position.y;
        const headY = position.y + height;
        for (const vehicle of vehicles) {
            if (!vehicle || vehicle === ignoreVehicle || !vehicle.model) continue;
            if (vehicle.config?.isAircraft) {
                const groundY = this.getHeight(vehicle.position.x, vehicle.position.z);
                if (vehicle.position.y - groundY > 4.2) continue;
            }

            const def = this._getVehicleCollisionDef(vehicle);
            const baseY = vehicle.position.y;
            const topY = baseY + def.h;
            if (feetY >= topY - 0.04 || headY <= baseY + 0.08) continue;
            if (this._pointInVehicleFootprint(vehicle, position.x, position.z, radius)) {
                return true;
            }
        }
        return false;
    }

    checkCharacterCollision(position, radius, height, ignoreVehicle = null) {
        return this.checkCollision(position, radius, height) ||
            this.checkVehicleCollision(position, radius, height, ignoreVehicle);
    }

    resolveCharacterMovement(oldPos, newPos, radius, height, ignoreVehicle = null) {
        const result = this.resolveMovement(oldPos, newPos, radius, height).clone();
        if (!this.checkVehicleCollision(result, radius, height, ignoreVehicle)) {
            return result;
        }

        const testX = new THREE.Vector3(newPos.x, oldPos.y, oldPos.z);
        if (!this.checkCharacterCollision(testX, radius, height, ignoreVehicle)) {
            result.x = newPos.x;
        } else {
            result.x = oldPos.x;
        }

        const testZ = new THREE.Vector3(result.x, oldPos.y, newPos.z);
        if (!this.checkCharacterCollision(testZ, radius, height, ignoreVehicle)) {
            result.z = newPos.z;
        } else {
            result.z = oldPos.z;
        }

        const testY = new THREE.Vector3(result.x, newPos.y, result.z);
        if (!this.checkCharacterCollision(testY, radius, height, ignoreVehicle)) {
            result.y = newPos.y;
        } else {
            result.y = oldPos.y;
        }
        return result;
    }

    getVehicleSupportHeight(position, radius = 0.35, fromFeetY = position.y, toFeetY = position.y) {
        const minY = Math.min(fromFeetY, toFeetY) - 0.18;
        const maxY = Math.max(fromFeetY, toFeetY) + 0.18;
        let best = -Infinity;

        for (const vehicle of this.getDynamicVehicles()) {
            if (!vehicle || !vehicle.model) continue;
            if (vehicle.config?.isAircraft) {
                const groundY = this.getHeight(vehicle.position.x, vehicle.position.z);
                if (vehicle.position.y - groundY > 4.2) continue;
            }
            const def = this._getVehicleCollisionDef(vehicle);
            const topY = vehicle.position.y + def.h;
            if (topY < minY || topY > maxY) continue;
            if (this._pointInVehicleFootprint(vehicle, position.x, position.z, radius * 0.25)) {
                best = Math.max(best, topY);
            }
        }

        return Number.isFinite(best) ? best : null;
    }

    // 获取所有可被射击的mesh（缓存结果，避免每帧创建新数组）
    getShootableMeshes() {
        if (!this._cachedShootableMeshes) {
            const meshes = [...this.obstacles.getMeshes()];
            if (this.terrain.mesh) {
                meshes.push(this.terrain.mesh);
            }
            this._cachedShootableMeshes = meshes;
        }
        return this._cachedShootableMeshes;
    }

    // AI视线检测用：排除大地形网格，避免 Raycaster 过重
    getLosMeshes() {
        if (!this._cachedLosMeshes) {
            this._cachedLosMeshes = [...this.obstacles.getMeshes()];
        }
        return this._cachedLosMeshes;
    }

    // 破坏物移除/地图变更后必须失效缓存，否则子弹仍被“幽灵 mesh”挡住
    invalidateMeshCaches() {
        this._cachedShootableMeshes = null;
        this._cachedLosMeshes = null;
    }

    // 获取据点
    getCapturePoints() {
        return this.capturePoints;
    }

    getStrategicObjectives() {
        return this.strategicObjectives;
    }

    // 释放所有资源（切换地图时调用）
    dispose() {
        const scene = this.scene;
        if (!scene) return;

        // 灯光
        for (const light of this.lights || []) {
            if (light.target) scene.remove(light.target);
            scene.remove(light);
        }
        this.lights = [];
        this.sun = null;

        // 天空
        if (this.sky) {
            scene.remove(this.sky);
            this._disposeMesh(this.sky);
            this.sky = null;
            this._skyMat = null;
        }

        // 草地植被
        if (this._grassMesh) {
            scene.remove(this._grassMesh);
            this._grassMesh.geometry.dispose();
            if (!this._grassMesh.material.userData?.sharedProcedural) {
                this._grassMesh.material.dispose();
            }
            this._grassMesh = null;
        }

        // 水面
        if (this._waterMesh) {
            scene.remove(this._waterMesh);
            this._waterMesh.geometry.dispose();
            this._waterMesh.material.dispose();
            this._waterMesh = null;
            this._waterMat = null;
        }

        // 地形 + 道路
        if (this.terrain) {
            if (this.terrain.roads) {
                for (const road of this.terrain.roads) {
                    if (!road) continue;
                    scene.remove(road);
                    this._disposeMesh(road);
                }
                this.terrain.roads = [];
            }
            if (this.terrain.mesh) {
                scene.remove(this.terrain.mesh);
                this._disposeMesh(this.terrain.mesh);
                this.terrain.mesh = null;
            }
            this.terrain.heightData = null;
            this.terrain.rawHeightData = null;
            this.terrain.flatAreas = [];
        }

        // 障碍物完整清理：含树木 Group 的叶冠、InstancedMesh 草、灌木和所有无碰撞装饰物。
        // 旧逻辑只遍历 getMeshes()，只会删树干，叶冠/草会跨地图残留在空中。
        if (this.obstacles) {
            if (this.obstacles.dispose) {
                this.obstacles.dispose();
            } else {
                const meshes = this.obstacles.getMeshes ? this.obstacles.getMeshes() : [];
                for (const m of meshes) {
                    if (!m) continue;
                    if (m.parent) m.parent.remove(m);
                    this._disposeMesh(m);
                }
                this.obstacles.meshes = [];
                this.obstacles.obstacles = [];
            }
        }

        // 据点 mesh
        for (const cp of this.capturePoints || []) {
            for (const key of ['flagMesh', 'flagPole', 'ringMesh', 'glowMesh', 'supportMesh']) {
                if (cp[key]) {
                    scene.remove(cp[key]);
                    this._disposeMesh(cp[key]);
                    cp[key] = null;
                }
            }
        }
        this.capturePoints = [];
        this.strategicObjectives = [];
        this.invalidateMeshCaches();
        this.waterLevel = null;
        this.capturePointTimeOverride = null;
    }

    _disposeMesh(obj) {
        if (!obj) return;
        obj.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => {
                            if (m && !m.userData?.sharedProcedural) m.dispose?.();
                        });
                    } else if (!child.material.userData?.sharedProcedural && child.material.dispose) {
                        child.material.dispose();
                    }
                }
            }
        });
    }
}
