import * as THREE from 'three';
import { createProceduralTexture } from '../utils/VisualAssets.js?v=20260802.3';

// 地形系统 - 生成战场地形（基于地图配置的差异化地形）
export class Terrain {
    constructor(scene, size = 400, terrainConfig = null) {
        this.scene = scene;
        this.size = size;
        this.terrainConfig = terrainConfig || {};
        // 从配置读取地形参数（每张地图不同）
        this.seed = this.terrainConfig.seed || 1337;
        this.frequency = this.terrainConfig.frequency || 0.018;
        this.baseHeight = this.terrainConfig.baseHeight || 0;
        this.hillHeight = this.terrainConfig.hillHeight || 18;
        this.mountainHeight = this.terrainConfig.mountainHeight || 32;
        this.groundColor = new THREE.Color(this.terrainConfig.groundColor || 0x6b7a5a);
        this.fogColor = new THREE.Color(this.terrainConfig.fogColor || 0x8899aa);
        this.skyColor = new THREE.Color(this.terrainConfig.skyColor || 0x87a8c8);
        this.mesh = null;
        this.heightData = null;
        this.segments = 128; // 128段在400m地图上约3.1m/顶点，轮廓平滑且顶点量可控
        this.flatAreas = [];
    }

    // === 种子化值噪声（确定性，每张地图因 seed 不同而不同）===
    _hash2(x, z) {
        let h = (x * 374761393 + z * 668265263 + this.seed * 0x9E3779B9) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    _valueNoise(x, z) {
        const xi = Math.floor(x);
        const zi = Math.floor(z);
        const xf = x - xi;
        const zf = z - zi;
        const h00 = this._hash2(xi, zi);
        const h10 = this._hash2(xi + 1, zi);
        const h01 = this._hash2(xi, zi + 1);
        const h11 = this._hash2(xi + 1, zi + 1);
        // 平滑插值（Hermite 曲线）
        const u = xf * xf * (3 - 2 * xf);
        const v = zf * zf * (3 - 2 * zf);
        return (1 - u) * (1 - v) * h00 + u * (1 - v) * h10 + (1 - u) * v * h01 + u * v * h11;
    }

    // 多倍频分形噪声（0-1 范围），产生自然起伏
    // 3 个八度 + 0.38 衰减：细节八度幅度极小，地表平缓不颠簸（高频颠簸会让行走/驾驶发抖）
    _fractalNoise(x, z) {
        let value = 0;
        let amplitude = 1;
        let freq = 1;
        let maxValue = 0;
        for (let octave = 0; octave < 3; octave++) {
            value += this._valueNoise(x * freq, z * freq) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.38;
            freq *= 2;
        }
        return value / maxValue;
    }

    generate() {
        // 纹理颜色跟随地图地面色调（雪地/沙地/火山/草地）
        const gc = this.groundColor;
        const darker = gc.clone().multiplyScalar(0.55);
        const lighter = gc.clone().lerp(new THREE.Color(0xffffff), 0.3);
        const texBaseColor = this.terrainConfig.groundColor || 0x6e7650;
        const texAccentColor = (Math.floor(darker.r * 255) << 16) | (Math.floor(darker.g * 255) << 8) | Math.floor(darker.b * 255);
        const texDetailColor = (Math.floor(lighter.r * 255) << 16) | (Math.floor(lighter.g * 255) << 8) | Math.floor(lighter.b * 255);

        const terrainMap = createProceduralTexture('terrain', {
            baseColor: texBaseColor,
            accentColor: texAccentColor,
            detailColor: texDetailColor,
            size: 256,
            repeatX: 10,
            repeatY: 10,
            anisotropy: 8,
        });

        const geometry = new THREE.PlaneGeometry(
            this.size, this.size, this.segments, this.segments
        );
        geometry.rotateX(-Math.PI / 2);

        // 生成高度图（基于 seed 的分形噪声，每张地图不同）
        const positions = geometry.attributes.position;
        this.heightData = new Float32Array(positions.count);

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            // 分形噪声 (0-1)。采样尺度必须远大于顶点间距（约3m），
            // 否则相邻顶点落在不同噪声晶格里，高度互不相关 → 地形全是尖刺。
            // frequency*1.2 → 基础波长约46m，最细八度约5.8m，起伏平滑连贯。
            const n = this._fractalNoise(x * this.frequency * 1.2, z * this.frequency * 1.2);

            // 高度 = 基准 + 丘陵层 + 山峰层
            let height = this.baseHeight;
            height += n * this.hillHeight;
            // 山峰：仅在噪声值较高处出现，形成陡峭山脊
            const mountainMask = Math.max(0, n - 0.55) / 0.45;
            height += mountainMask * mountainMask * this.mountainHeight;

            // 边缘略高，形成自然边界
            const distFromCenter = Math.sqrt(x * x + z * z);
            const edgeFactor = Math.max(0, (distFromCenter - this.size * 0.35) / (this.size * 0.15));
            height += edgeFactor * 8;

            this.heightData[i] = height;
            positions.setY(i, height);
        }

        // 原始高度图：建筑 flatAreas 只改 heightData/mesh，不改 rawHeightData
        // 树/草必须读 raw，否则会贴在建筑平台高度上相对山谷“飞天”
        this.rawHeightData = new Float32Array(this.heightData);

        geometry.computeVertexNormals();

        // 顶点颜色 - 基于地图 groundColor，按高度做明暗/岩石变化
        const colors = new Float32Array(positions.count * 3);
        const rockColor = new THREE.Color(0x55504a); // 高地岩石色
        for (let i = 0; i < positions.count; i++) {
            const h = this.heightData[i];
            const hillTop = this.baseHeight + this.hillHeight;
            const t = Math.max(0, Math.min(1, (h - this.baseHeight) / Math.max(1, hillTop - this.baseHeight)));

            // 基色 = groundColor，低处偏暗、高处偏亮
            let r = gc.r * (0.55 + t * 0.55);
            let g = gc.g * (0.55 + t * 0.55);
            let b = gc.b * (0.55 + t * 0.55);

            // 高海拔过渡到岩石色
            const rockThreshold = hillTop * 0.7;
            if (h > rockThreshold) {
                const rockFactor = Math.min(1, (h - rockThreshold) / Math.max(1, this.mountainHeight * 0.5));
                r = r * (1 - rockFactor) + rockColor.r * rockFactor;
                g = g * (1 - rockFactor) + rockColor.g * rockFactor;
                b = b * (1 - rockFactor) + rockColor.b * rockFactor;
            }

            // 低洼处加深（模拟湿地/泥泞）
            if (h < this.baseHeight - 0.5) {
                const wet = Math.min(1, (this.baseHeight - 0.5 - h) / 2);
                r *= (1 - wet * 0.4);
                g *= (1 - wet * 0.4);
                b *= (1 - wet * 0.4);
            }

            // 道路附近颜色偏深
            const distFromRoad = Math.min(
                Math.abs(positions.getZ(i) % 12),
                Math.abs(positions.getX(i) % 12)
            );
            if (distFromRoad < 2) {
                r *= 0.65; g *= 0.65; b *= 0.65;
            }

            // 添加随机噪点
            const noise = (Math.random() - 0.5) * 0.04;
            colors[i * 3] = Math.max(0, Math.min(1, r + noise));
            colors[i * 3 + 1] = Math.max(0, Math.min(1, g + noise));
            colors[i * 3 + 2] = Math.max(0, Math.min(1, b + noise));
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            map: terrainMap,
            roughness: 1.0,
            metalness: 0.0,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = false;
        this.mesh.name = 'terrain';
        this.scene.add(this.mesh);

        // 生成道路
        this._createRoads();
    }

    _createRoads() {
        // 主路 - 十字交叉
        this._createTerrainRoad(0, 0, this.size * 0.8, 12, 0x3a3a3a, 0);
        this._createTerrainRoad(0, 0, 12, this.size * 0.8, 0x3a3a3a, 0);

        // 斜路
        this._createTerrainRoad(0, 0, this.size * 0.6, 10, 0x3a3a3a, Math.PI / 4);
        this._createTerrainRoad(-76, 20, 105, 8, 0x343536, -Math.PI / 5);
        this._createTerrainRoad(76, -20, 105, 8, 0x343536, -Math.PI / 5);
        this._createTerrainRoad(-104, -24, 115, 7, 0x3b3830, Math.PI / 2);
        this._createTerrainRoad(104, 24, 115, 7, 0x3b3830, Math.PI / 2);
    }

    _createTerrainRoad(cx, cz, width, depth, color, rotationY = 0) {
        const roadTexture = createProceduralTexture('road', {
            baseColor: color,
            accentColor: 0x1d1e20,
            detailColor: 0x8e8e8e,
            size: 256,
            repeatX: Math.max(2, Math.ceil(width / 8)),
            repeatY: Math.max(1, Math.ceil(depth / 8)),
            anisotropy: 8,
        });
        const segX = Math.max(2, Math.ceil(width / 8));
        const segZ = Math.max(2, Math.ceil(depth / 4));
        const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
        geo.rotateX(-Math.PI / 2);

        const cos = Math.cos(rotationY);
        const sin = Math.sin(rotationY);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const lx = pos.getX(i);
            const lz = pos.getZ(i);
            const x = cx + lx * cos - lz * sin;
            const z = cz + lx * sin + lz * cos;
            pos.setXYZ(i, x, this.getHeight(x, z) + 0.08, z);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();

        const road = new THREE.Mesh(
            geo,
            new THREE.MeshStandardMaterial({
                color,
                map: roadTexture,
                roughness: 0.98,
                metalness: 0.0,
            })
        );
        road.name = 'terrain_road';
        road.receiveShadow = false;
        this.scene.add(road);
        // 追踪道路，切图 dispose 时统一释放
        if (!this.roads) this.roads = [];
        this.roads.push(road);
    }

    addFlatArea(x, z, width, depth, height, padding = 0.5) {
        const area = {
            minX: x - width / 2 - padding,
            maxX: x + width / 2 + padding,
            minZ: z - depth / 2 - padding,
            maxZ: z + depth / 2 + padding,
            height,
        };
        this.flatAreas.push(area);
        this._applyFlatAreaToMesh(area);
    }

    _applyFlatAreaToMesh(area) {
        if (!this.mesh || !this.mesh.geometry?.attributes?.position) return;
        const positions = this.mesh.geometry.attributes.position;
        let changed = false;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            if (x < area.minX || x > area.maxX || z < area.minZ || z > area.maxZ) continue;
            positions.setY(i, area.height);
            if (this.heightData && i < this.heightData.length) {
                this.heightData[i] = area.height;
            }
            changed = true;
        }
        if (!changed) return;
        positions.needsUpdate = true;
        this.mesh.geometry.computeVertexNormals();
    }

    // 仅采样原始地形高度（忽略建筑 flatAreas 对 heightData 的烘焙）
    // 树木/草/灌木等装饰物必须用这个，否则会贴到建筑平台高度而相对真实山谷“飞天”
    getMeshHeight(x, z) {
        const data = this.rawHeightData || this.heightData;
        if (!data) return 0;
        // PlaneGeometry(r160) push (x,-y,0) 再 rotateX(-PI/2) 后：
        //   row 0 → z = -halfSize，row N → z = +halfSize
        const halfSize = this.size / 2;
        const fx = (x + halfSize) / this.size * this.segments;
        const fz = (z + halfSize) / this.size * this.segments;

        const ix = Math.floor(fx);
        const iz = Math.floor(fz);

        if (ix < 0 || ix >= this.segments || iz < 0 || iz >= this.segments) {
            return 0;
        }

        const idx00 = iz * (this.segments + 1) + ix;
        const idx10 = iz * (this.segments + 1) + ix + 1;
        const idx01 = (iz + 1) * (this.segments + 1) + ix;
        const idx11 = (iz + 1) * (this.segments + 1) + ix + 1;

        const tx = fx - ix;
        const tz = fz - iz;

        const h00 = data[idx00] || 0;
        const h10 = data[idx10] || 0;
        const h01 = data[idx01] || 0;
        const h11 = data[idx11] || 0;

        return (1 - tx) * (1 - tz) * h00 +
               tx * (1 - tz) * h10 +
               (1 - tx) * tz * h01 +
               tx * tz * h11;
    }

    // 是否落在建筑/平台平坦区内（含 padding）——装饰物应避开
    isInFlatArea(x, z) {
        for (let i = this.flatAreas.length - 1; i >= 0; i--) {
            const area = this.flatAreas[i];
            if (x >= area.minX && x <= area.maxX && z >= area.minZ && z <= area.maxZ) {
                return true;
            }
        }
        return false;
    }

    // 本地坡度（约 radius 米范围的高差），用于过滤陡坡上的树/草
    getLocalSlope(x, z, radius = 2.5) {
        const c = this.getMeshHeight(x, z);
        const h1 = this.getMeshHeight(x + radius, z);
        const h2 = this.getMeshHeight(x - radius, z);
        const h3 = this.getMeshHeight(x, z + radius);
        const h4 = this.getMeshHeight(x, z - radius);
        return Math.max(
            Math.abs(h1 - c), Math.abs(h2 - c),
            Math.abs(h3 - c), Math.abs(h4 - c)
        ) / radius;
    }

    // 获取指定坐标的可行走高度（含建筑 flatAreas 平台；与烘焙后的 mesh 一致）
    getHeight(x, z) {
        for (let i = this.flatAreas.length - 1; i >= 0; i--) {
            const area = this.flatAreas[i];
            if (x >= area.minX && x <= area.maxX && z >= area.minZ && z <= area.maxZ) {
                return area.height;
            }
        }
        if (!this.heightData) return this.getMeshHeight(x, z);
        const halfSize = this.size / 2;
        const fx = (x + halfSize) / this.size * this.segments;
        const fz = (z + halfSize) / this.size * this.segments;
        const ix = Math.floor(fx);
        const iz = Math.floor(fz);
        if (ix < 0 || ix >= this.segments || iz < 0 || iz >= this.segments) {
            return 0;
        }
        const idx00 = iz * (this.segments + 1) + ix;
        const idx10 = iz * (this.segments + 1) + ix + 1;
        const idx01 = (iz + 1) * (this.segments + 1) + ix;
        const idx11 = (iz + 1) * (this.segments + 1) + ix + 1;
        const tx = fx - ix;
        const tz = fz - iz;
        const d = this.heightData;
        return (1 - tx) * (1 - tz) * (d[idx00] || 0) +
               tx * (1 - tz) * (d[idx10] || 0) +
               (1 - tx) * tz * (d[idx01] || 0) +
               tx * tz * (d[idx11] || 0);
    }
}
