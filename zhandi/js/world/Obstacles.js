import * as THREE from 'three';
import { createProceduralMaterial } from '../utils/VisualAssets.js?v=20260802.3';

// 障碍物系统 - 建筑物、掩体、围墙等，带碰撞检测
export class ObstacleSystem {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];      // 碰撞盒列表 {min: Vec3, max: Vec3, mesh}
        this.meshes = [];         // 所有可被射线检测的mesh
        this.interactiveMeshes = []; // 可交互物体
        this.buildingFootprints = [];
        this.buildingDoorZones = [];
        this.strategicObjectives = [];
        // generateMap 期间新增到场景的所有顶层对象。
        // 不能只依赖 meshes：树木只登记树干，树叶 Group、草 InstancedMesh、灌木等不会进入射线列表。
        this.generatedObjects = new Set();
        this._glassRaycaster = new THREE.Raycaster();
        this._buildingLodEntries = [];
        // 2D 空间哈希：楼梯/二楼后碰撞盒暴增，全表扫描是卡顿主因
        this._gridCell = 10;
        this._grid = new Map();
        this._queryBuf = [];
        this._queryStamp = 1;
    }

    _cellKey(ix, iz) {
        // 地图坐标远小于 ±32768 格，数值打包避免热路径字符串分配。
        return (ix + 32768) * 65536 + (iz + 32768);
    }

    _boxWorldXZ(box) {
        // 旋转盒用外接 AABB 粗测
        if (!box.rotationY) {
            return { minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z };
        }
        const hw = box.width * 0.5;
        const hd = box.depth * 0.5;
        const cos = Math.abs(box.cos);
        const sin = Math.abs(box.sin);
        const extX = hw * cos + hd * sin;
        const extZ = hw * sin + hd * cos;
        return {
            minX: box.centerX - extX,
            maxX: box.centerX + extX,
            minZ: box.centerZ - extZ,
            maxZ: box.centerZ + extZ,
        };
    }

    _indexBox(box) {
        const b = this._boxWorldXZ(box);
        const cells = [];
        const c = this._gridCell;
        const i0 = Math.floor(b.minX / c);
        const i1 = Math.floor(b.maxX / c);
        const j0 = Math.floor(b.minZ / c);
        const j1 = Math.floor(b.maxZ / c);
        for (let ix = i0; ix <= i1; ix++) {
            for (let iz = j0; iz <= j1; iz++) {
                const key = this._cellKey(ix, iz);
                let arr = this._grid.get(key);
                if (!arr) {
                    arr = [];
                    this._grid.set(key, arr);
                }
                arr.push(box);
                cells.push(key);
            }
        }
        box._gridCells = cells;
    }

    _unindexBox(box) {
        const cells = box._gridCells;
        if (!cells) return;
        for (const key of cells) {
            const arr = this._grid.get(key);
            if (!arr) continue;
            const idx = arr.indexOf(box);
            if (idx >= 0) {
                arr[idx] = arr[arr.length - 1];
                arr.pop();
            }
            if (arr.length === 0) this._grid.delete(key);
        }
        box._gridCells = null;
    }

    _queryNearby(minX, maxX, minZ, maxZ) {
        const buf = this._queryBuf;
        buf.length = 0;
        const stamp = ++this._queryStamp;
        if (this._queryStamp > 1e9) {
            this._queryStamp = 1;
            for (const obs of this.obstacles) obs._qStamp = 0;
        }
        const c = this._gridCell;
        const i0 = Math.floor(minX / c);
        const i1 = Math.floor(maxX / c);
        const j0 = Math.floor(minZ / c);
        const j1 = Math.floor(maxZ / c);
        for (let ix = i0; ix <= i1; ix++) {
            for (let iz = j0; iz <= j1; iz++) {
                const arr = this._grid.get(this._cellKey(ix, iz));
                if (!arr) continue;
                for (let i = 0; i < arr.length; i++) {
                    const obs = arr[i];
                    if (obs._qStamp === stamp) continue;
                    obs._qStamp = stamp;
                    buf.push(obs);
                }
            }
        }
        return buf;
    }

    rebuildSpatialIndex() {
        this._grid.clear();
        for (const box of this.obstacles) this._indexBox(box);
    }

    // 添加碰撞盒
    addCollisionBox(x, y, z, width, height, depth, mesh = null, rotationY = null) {
        const rotY = rotationY ?? (mesh ? mesh.rotation.y || 0 : 0);
        const box = {
            min: new THREE.Vector3(x - width / 2, y, z - depth / 2),
            max: new THREE.Vector3(x + width / 2, y + height, z + depth / 2),
            centerX: x,
            centerZ: z,
            width: width,
            height: height,
            depth: depth,
            y: y,
            rotationY: rotY,
            cos: Math.cos(rotY),
            sin: Math.sin(rotY),
            mesh: mesh,
            _qStamp: 0,
        };
        this.obstacles.push(box);
        this._indexBox(box);
        if (mesh) {
            this.meshes.push(mesh);
            mesh.userData.collisionBox = box;
            mesh.userData.blocksBullets = true;
        }
        return box;
    }

    hasFootprintOverlap(x, z, width, depth, rotationY, y, height, padding = 0) {
        const cosA = Math.cos(rotationY);
        const sinA = Math.sin(rotationY);
        const a0x = cosA;
        const a0z = -sinA;
        const a1x = sinA;
        const a1z = cosA;
        const ahw = width / 2 + padding;
        const ahd = depth / 2 + padding;
        // 粗 AABB 邻域
        const ext = Math.max(width, depth) * 0.5 + padding + 1;
        const nearby = this._queryNearby(x - ext, x + ext, z - ext, z + ext);

        for (let i = 0; i < nearby.length; i++) {
            const obs = nearby[i];
            if (y + height <= obs.y + 0.05 || y >= obs.y + obs.height - 0.05) continue;

            const cosB = obs.cos ?? Math.cos(obs.rotationY || 0);
            const sinB = obs.sin ?? Math.sin(obs.rotationY || 0);
            const b0x = cosB;
            const b0z = -sinB;
            const b1x = sinB;
            const b1z = cosB;
            const bhw = obs.width / 2 + padding;
            const bhd = obs.depth / 2 + padding;
            const dx = obs.centerX - x;
            const dz = obs.centerZ - z;

            const axes = [
                [a0x, a0z], [a1x, a1z],
                [b0x, b0z], [b1x, b1z],
            ];
            let overlaps = true;
            for (const [ux, uz] of axes) {
                const distance = Math.abs(dx * ux + dz * uz);
                const radiusA = ahw * Math.abs(a0x * ux + a0z * uz) + ahd * Math.abs(a1x * ux + a1z * uz);
                const radiusB = bhw * Math.abs(b0x * ux + b0z * uz) + bhd * Math.abs(b1x * ux + b1z * uz);
                if (distance >= radiusA + radiusB) {
                    overlaps = false;
                    break;
                }
            }
            if (overlaps) return true;
        }
        return false;
    }

    // 获取所有碰撞盒
    getObstacles() {
        return this.obstacles;
    }

    // 获取所有mesh（用于射线检测）
    getMeshes() {
        return this.meshes;
    }

    // 从可射击 mesh 列表移除（破坏后调用，避免幽灵碰撞）
    removeMesh(mesh) {
        if (!mesh) return false;
        const idx = this.meshes.indexOf(mesh);
        if (idx >= 0) {
            this.meshes.splice(idx, 1);
            return true;
        }
        return false;
    }

    // 同时移除碰撞盒
    removeCollisionForMesh(mesh) {
        if (!mesh) return;
        const box = mesh.userData?.collisionBox;
        if (box) {
            this._unindexBox(box);
            const idx = this.obstacles.indexOf(box);
            if (idx >= 0) this.obstacles.splice(idx, 1);
            mesh.userData.collisionBox = null;
        }
        this.removeMesh(mesh);
    }

    getStrategicObjectives() {
        return this.strategicObjectives;
    }

    isInsideBuilding(x, z, padding = 0) {
        return this._isInsideBuildingFootprint(x, z, padding);
    }

    _findGlassMesh(mesh) {
        let obj = mesh;
        while (obj) {
            if (obj.userData?.isGlass || obj.userData?.buildingPart?.includes?.('_glass')) {
                return obj;
            }
            obj = obj.parent;
        }
        return null;
    }

    breakGlass(mesh, hitPoint = null) {
        const glass = this._findGlassMesh(mesh);
        if (!glass || glass.userData.broken) return false;

        glass.userData.broken = true;
        glass.userData.penetrable = true;
        glass.userData.blocksBullets = false;
        glass.visible = false;
        glass.raycast = () => {};

        const shardMat = this._glassShardMaterial || new THREE.MeshBasicMaterial({
            color: 0xb8e8ff,
            transparent: true,
            opacity: 0.42,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        this._glassShardMaterial = shardMat;

        const origin = hitPoint ? hitPoint.clone() : new THREE.Vector3();
        if (!hitPoint) glass.getWorldPosition(origin);
        const quat = new THREE.Quaternion();
        glass.getWorldQuaternion(quat);

        for (let i = 0; i < 7; i++) {
            const shard = new THREE.Mesh(
                new THREE.PlaneGeometry(0.08 + Math.random() * 0.18, 0.05 + Math.random() * 0.16),
                shardMat
            );
            shard.position.copy(origin);
            shard.position.x += (Math.random() - 0.5) * 0.75;
            shard.position.y += (Math.random() - 0.5) * 0.55;
            shard.position.z += (Math.random() - 0.5) * 0.75;
            shard.quaternion.copy(quat);
            shard.rotateZ(Math.random() * Math.PI);
            this.scene.add(shard);
            setTimeout(() => {
                this.scene.remove(shard);
                shard.geometry.dispose();
            }, 1800 + Math.random() * 700);
        }

        return true;
    }

    findBreakableGlassNear(origin, direction, maxDistance = 2.5) {
        if (!origin || !direction) return null;
        const glassMeshes = [];
        for (const mesh of this.meshes) {
            if (!mesh?.visible || mesh.userData?.broken) continue;
            if (mesh.userData?.isGlass || mesh.userData?.buildingPart?.includes?.('_glass')) {
                glassMeshes.push(mesh);
            }
        }
        if (glassMeshes.length === 0) return null;

        this._glassRaycaster.set(origin, direction);
        this._glassRaycaster.near = 0.05;
        this._glassRaycaster.far = maxDistance;
        const hits = this._glassRaycaster.intersectObjects(glassMeshes, false);
        if (hits.length === 0) return null;

        const hit = hits[0];
        return {
            mesh: hit.object,
            point: hit.point,
            distance: hit.distance,
        };
    }

    // AABB碰撞检测 - 检查位置是否与障碍物碰撞（空间哈希邻域查询）
    checkCollision(position, radius, height) {
        const px = position.x;
        const py = position.y;
        const pz = position.z;
        // 可踏上高度：楼梯台阶 ~0.2m，略放宽到 0.55 便于连续上台阶
        const maxStepUp = 0.55;
        const pad = radius + 0.05;
        const nearby = this._queryNearby(px - pad, px + pad, pz - pad, pz + pad);

        for (let i = 0; i < nearby.length; i++) {
            const obs = nearby[i];
            const topY = obs.y + obs.height;
            if (py + height <= obs.y) continue;
            // 已站在顶面之上
            if (py >= topY - 0.06) continue;
            // 顶面相对脚底在 step-up 范围内：不当作墙，交给支撑面系统踩上去
            if (topY > py - 0.02 && topY - py <= maxStepUp) continue;

            if (obs.rotationY) {
                const dx = px - obs.centerX;
                const dz = pz - obs.centerZ;
                const localX = dx * obs.cos - dz * obs.sin;
                const localZ = dx * obs.sin + dz * obs.cos;
                if (Math.abs(localX) < obs.width / 2 + radius &&
                    Math.abs(localZ) < obs.depth / 2 + radius) {
                    return true;
                }
            } else {
                const minX = obs.min.x - radius;
                const maxX = obs.max.x + radius;
                const minZ = obs.min.z - radius;
                const maxZ = obs.max.z + radius;

                if (px > minX && px < maxX &&
                    pz > minZ && pz < maxZ) {
                    return true;
                }
            }
        }
        return false;
    }

    getSupportHeight(position, radius = 0.35, fromFeetY = position.y, toFeetY = position.y) {
        const info = this.getSupportSurfaceInfo(position, radius, fromFeetY, toFeetY);
        return info ? info.y : null;
    }

    getSupportSurfaceInfo(position, radius = 0.35, fromFeetY = position.y, toFeetY = position.y) {
        const px = position.x;
        const pz = position.z;
        const minY = Math.min(fromFeetY, toFeetY) - 0.18;
        const maxY = Math.max(fromFeetY, toFeetY) + 0.18;
        let best = null;
        const edgeAllowance = Math.min(radius * 0.35, 0.16);
        const pad = radius + edgeAllowance + 0.05;
        const nearby = this._queryNearby(px - pad, px + pad, pz - pad, pz + pad);

        for (let i = 0; i < nearby.length; i++) {
            const obs = nearby[i];
            const topY = obs.y + obs.height;
            if (topY < minY || topY > maxY) continue;

            let overTop = false;
            if (obs.rotationY) {
                const dx = px - obs.centerX;
                const dz = pz - obs.centerZ;
                const localX = dx * obs.cos - dz * obs.sin;
                const localZ = dx * obs.sin + dz * obs.cos;
                overTop = Math.abs(localX) <= obs.width / 2 + edgeAllowance &&
                    Math.abs(localZ) <= obs.depth / 2 + edgeAllowance;
            } else {
                overTop = px >= obs.min.x - edgeAllowance &&
                    px <= obs.max.x + edgeAllowance &&
                    pz >= obs.min.z - edgeAllowance &&
                    pz <= obs.max.z + edgeAllowance;
            }

            if (overTop && (!best || topY > best.y)) {
                const part = obs.mesh?.userData?.buildingPart || null;
                best = {
                    y: topY,
                    mesh: obs.mesh || null,
                    kind: part ? 'building' : 'prop',
                    part,
                    structure: obs.mesh?.userData?.structure || null,
                    isRoof: part === 'roof',
                    isBuilding: !!part,
                };
            }
        }

        return best;
    }

    // 分轴碰撞解析 - 返回修正后的位置
    // 性能优化：复用临时向量避免每次调用都创建新Vector3
    _tmpTestX = new THREE.Vector3();
    _tmpTestZ = new THREE.Vector3();
    _tmpTestY = new THREE.Vector3();
    _tmpResult = new THREE.Vector3();
    resolveMovement(oldPos, newPos, radius, height) {
        const result = this._tmpResult;
        result.copy(newPos);

        // X轴
        this._tmpTestX.set(newPos.x, oldPos.y, oldPos.z);
        if (this.checkCollision(this._tmpTestX, radius, height)) {
            result.x = oldPos.x;
        }

        // Z轴
        this._tmpTestZ.set(result.x, oldPos.y, newPos.z);
        if (this.checkCollision(this._tmpTestZ, radius, height)) {
            result.z = oldPos.z;
        }

        // Y轴（用于跳跃/上下坡）
        this._tmpTestY.set(result.x, newPos.y, result.z);
        if (this.checkCollision(this._tmpTestY, radius, height)) {
            result.y = oldPos.y;
        }

        return result;
    }

    // 装饰物贴地高度：永远读真实地形 mesh，不读建筑 flatAreas
    // 否则树/草会贴到建筑平台高度，相对真实地形“飞天”
    _groundY(terrain, x, z) {
        if (terrain.getMeshHeight) return terrain.getMeshHeight(x, z);
        return terrain.getHeight(x, z);
    }

    // 水面之上才允许种树/草（诺曼底/硫磺岛有 water.level）
    _isAboveWater(y) {
        const waterLevel = this.mapConfig?.water?.level;
        if (waterLevel == null) return true;
        return y > waterLevel + 0.35;
    }

    // 陡坡过滤：坡度太大树/草会悬空或穿山
    _isGentleSlope(terrain, x, z, maxSlope = 0.55) {
        if (terrain.getLocalSlope) return terrain.getLocalSlope(x, z, 2.5) <= maxSlope;
        return true;
    }

    // 装饰物可放置性：贴地 + 不在水中 + 不在陡坡 + 不在建筑平台
    _canPlaceProp(terrain, x, z, opts = {}) {
        const maxSlope = opts.maxSlope ?? 0.55;
        const avoidBuildingPad = opts.avoidBuildingPad ?? 1.2;
        const maxPlatformDelta = opts.maxPlatformDelta ?? 0.45;
        if (this._isInsideBuildingFootprint?.(x, z, avoidBuildingPad)) return false;
        if (this._shouldSkipPropForBuildingAccess?.(x, z, avoidBuildingPad)) return false;
        // 建筑 flatAreas（含 padding）上禁止种树草，否则会贴平台高度悬在谷底视觉之上
        if (terrain.isInFlatArea?.(x, z)) return false;
        const y = this._groundY(terrain, x, z);
        if (!this._isAboveWater(y)) return false;
        if (!this._isGentleSlope(terrain, x, z, maxSlope)) return false;
        // 平台边缘：可行走高度被抬高、原始 mesh 仍低 → 差值大则跳过
        if (terrain.getHeight) {
            const walkY = terrain.getHeight(x, z);
            if (Math.abs(walkY - y) > maxPlatformDelta) return false;
        }
        return true;
    }

    // 长条障碍（墙/路障）在坡地上的贴地高度：取多点最低，并返回需要加长的裙边高度
    // 这样高处一端不会悬空，低处一端略埋入地面
    _getLinearPropGround(terrain, x, z, width, depth, rotationY = 0) {
        const cos = Math.cos(rotationY);
        const sin = Math.sin(rotationY);
        const hw = width * 0.5;
        const hd = depth * 0.5;
        const corners = [
            [0, 0],
            [hw, hd], [-hw, hd], [hw, -hd], [-hw, -hd],
            [hw, 0], [-hw, 0], [0, hd], [0, -hd],
        ];
        let minY = Infinity;
        let maxY = -Infinity;
        for (const [lx, lz] of corners) {
            const wx = x + lx * cos - lz * sin;
            const wz = z + lx * sin + lz * cos;
            const h = this._groundY(terrain, wx, wz);
            minY = Math.min(minY, h);
            maxY = Math.max(maxY, h);
        }
        if (!Number.isFinite(minY)) {
            const h = this._groundY(terrain, x, z);
            return { y: h, skirt: 0, spread: 0 };
        }
        const spread = maxY - minY;
        return { y: minY, skirt: Math.min(spread, 3.5), spread };
    }

    _createSeededRandom(salt = 0) {
        let state = ((this.mapConfig?.terrain?.seed || 1337) ^ Math.imul(salt + 1, 0x9E3779B9)) >>> 0;
        return () => {
            state += 0x6D2B79F5;
            let value = state;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    }

    _createInstancedDecoration(name, geometry, material, transforms) {
        if (!transforms.length) {
            geometry.dispose();
            return null;
        }
        const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
        mesh.name = name;
        mesh.userData.noShadow = true;
        mesh.userData.mapDecoration = true;
        const dummy = new THREE.Object3D();
        for (let i = 0; i < transforms.length; i++) {
            const transform = transforms[i];
            dummy.position.copy(transform.position);
            dummy.rotation.set(
                transform.rotation?.x || 0,
                transform.rotation?.y || 0,
                transform.rotation?.z || 0
            );
            const scale = transform.scale || { x: 1, y: 1, z: 1 };
            dummy.scale.set(scale.x, scale.y, scale.z);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
        this.scene.add(mesh);
        return mesh;
    }

    _isNearSpawnOrVehicle(x, z, padding = 8) {
        for (const team of [0, 1]) {
            const area = this.mapConfig?.spawnAreas?.[team];
            if (!area) continue;
            const dx = x - area.center.x;
            const dz = z - area.center.z;
            const radius = (area.radius || 10) + padding;
            if (dx * dx + dz * dz < radius * radius) return true;
        }
        for (const spawn of this.mapConfig?.vehicleSpawns || []) {
            const dx = x - spawn.x;
            const dz = z - spawn.z;
            if (dx * dx + dz * dz < padding * padding) return true;
        }
        return false;
    }

    // 生成整个地图的障碍物
    generateMap(terrain, mapConfig = null) {
        this.mapConfig = mapConfig || {};
        const existingSceneChildren = new Set(this.scene.children);

        this._createBuildings(terrain);
        this._createAccessPaths(terrain);
        this._createBattlefieldFlow(terrain);
        this._createBattlefieldSetPieces(terrain);
        this._createWalls(terrain);
        this._createSandbags(terrain);
        this._createCrates(terrain);
        this._createBarriers(terrain);
        this._createTrees(terrain);
        this._createFlagPoles(terrain);
        this._createContainerYard(terrain);
        this._createDestroyedVehicles(terrain);
        this._createTrenches(terrain);
        this._createRocks(terrain);
        this._createFuelTanks(terrain);
        this._createStrategicObjectives(terrain);
        this._createExpandedMapDistricts(terrain);
        this._createForwardBaseDetails(terrain);
        this._createGroundDetails(terrain);
        this._createBushes(terrain);
        // 草地统一由 World._createVegetation 差异化 InstancedMesh 负责；此处旧锥形草系统已移除，避免双份草叶重复绘制
        this._createBarbedWire(terrain);
        this._createTrenchDetails(terrain);
        // this._createDeadTrees(terrain);
        this._createProceduralScatter(terrain);
        this._createMapThemedSetPieces(terrain);
        this._createBeachFortifications(terrain);

        // 记录完整顶层对象，而不是只有碰撞 mesh。切图时据此移除树叶、草、灌木和装饰物。
        for (const object of this.scene.children) {
            if (!existingSceneChildren.has(object)) this.generatedObjects.add(object);
        }
        // 生成期 addCollisionBox 已实时索引；再重建一次确保一致
        this.rebuildSpatialIndex();
    }

    dispose() {
        const geometries = new Set();
        const materials = new Set();
        const textures = new Set();

        for (const object of this.generatedObjects) {
            if (!object) continue;
            object.traverse(child => {
                if (child.geometry) geometries.add(child.geometry);
                const mats = Array.isArray(child.material) ? child.material : (child.material ? [child.material] : []);
                for (const material of mats) {
                    if (!material || material.userData?.sharedProcedural) continue;
                    materials.add(material);
                    for (const value of Object.values(material)) {
                        if (value?.isTexture && !value.userData?.sharedProcedural) textures.add(value);
                    }
                }
            });
            if (object.parent) object.parent.remove(object);
        }

        for (const geometry of geometries) geometry.dispose?.();
        for (const texture of textures) texture.dispose?.();
        for (const material of materials) material.dispose?.();

        this.generatedObjects.clear();
        this.meshes = [];
        this.interactiveMeshes = [];
        this.obstacles = [];
        this.strategicObjectives = [];
        this.buildingFootprints = [];
        this.buildingDoorZones = [];
        this._treeMats = null;
        this._buildingLodEntries.length = 0;
        this._grid.clear();
        this._queryBuf.length = 0;
    }

    updateBuildingLOD(position, detailDistance = 85) {
        if (!position || this._buildingLodEntries.length === 0) return;
        const maxDistSq = detailDistance * detailDistance;
        for (let i = 0; i < this._buildingLodEntries.length; i++) {
            const entry = this._buildingLodEntries[i];
            const dx = entry.x - position.x;
            const dz = entry.z - position.z;
            const detailed = dx * dx + dz * dz <= maxDistSq;
            if (entry.detailed === detailed) continue;
            entry.detailed = detailed;
            for (let j = 0; j < entry.detailMeshes.length; j++) {
                entry.detailMeshes[j].visible = detailed;
            }
        }
    }

    // 地图专属主题景物
    _createMapThemedSetPieces(terrain) {
        const mapId = this.mapConfig?.id;
        if (mapId === 'normandy' || mapId === 'iwojima') {
            this._createBeachObstacles(terrain, mapId);
        } else if (mapId === 'ardennes') {
            this._createSnowDrifts(terrain);
        } else if (mapId === 'stalingrad') {
            this._createUrbanRuins(terrain);
        }
        this._createThemedSceneryBatches(terrain);
    }

    // 斯大林格勒：废墟墙段、倾倒烟囱、碎石堆
    _createUrbanRuins(terrain) {
        const concrete = createProceduralMaterial('battle_damage', {
            baseColor: 0x7a756c, accentColor: 0x3a3730, detailColor: 0x4a4132,
            size: 128, repeatX: 2, repeatY: 1, anisotropy: 4,
        }, { roughness: 0.98 });
        const brick = createProceduralMaterial('concrete', {
            baseColor: 0x8a5a42, accentColor: 0x4a2e20, detailColor: 0xb07a58,
            size: 128, repeatX: 2, repeatY: 2, anisotropy: 4,
        }, { roughness: 0.96 });
        const random = this._createSeededRandom(1942);
        const size = terrain.size;

        // 破碎墙段
        for (let i = 0; i < 18; i++) {
            const x = (random() - 0.5) * size * 0.75;
            const z = (random() - 0.5) * size * 0.75;
            if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;
            if (this._shouldSkipPropForBuildingAccess?.(x, z, 2.5)) continue;
            if (!this._canPlaceProp(terrain, x, z, { maxSlope: 0.55, avoidBuildingPad: 2 })) continue;
            const y = this._groundY(terrain, x, z);
            const w = 3 + random() * 5;
            const h = 1.5 + random() * 3.5;
            const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.45), random() < 0.5 ? concrete : brick);
            wall.position.set(x, y + h / 2, z);
            wall.rotation.y = random() * Math.PI;
            wall.name = 'ruin_wall';
            this.scene.add(wall);
            this.addCollisionBox(x, y, z, w * 0.85, h, 0.6, wall);
        }

        // 倾倒烟囱 / 柱
        for (let i = 0; i < 6; i++) {
            const x = (random() - 0.5) * size * 0.6;
            const z = (random() - 0.5) * size * 0.6;
            if (this._shouldSkipPropForBuildingAccess?.(x, z, 2)) continue;
            if (!this._canPlaceProp(terrain, x, z, { maxSlope: 0.5, avoidBuildingPad: 2 })) continue;
            const y = this._groundY(terrain, x, z);
            const h = 4 + random() * 5;
            const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, h, 8), concrete);
            col.position.set(x, y + h * 0.35, z);
            col.rotation.z = (0.4 + random() * 0.5) * (random() < 0.5 ? 1 : -1);
            col.rotation.y = random() * Math.PI;
            col.name = 'ruin_chimney';
            this.scene.add(col);
            this.addCollisionBox(x, y, z, 1.2, 2.2, 1.2, col);
        }

        // 碎石堆
        for (let i = 0; i < 14; i++) {
            const x = (random() - 0.5) * size * 0.7;
            const z = (random() - 0.5) * size * 0.7;
            if (!this._canPlaceProp(terrain, x, z, { maxSlope: 0.6, avoidBuildingPad: 1.5 })) continue;
            const y = this._groundY(terrain, x, z);
            const r = 0.8 + random() * 1.4;
            const pile = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), concrete);
            pile.position.set(x, y + r * 0.35, z);
            pile.scale.y = 0.45 + random() * 0.3;
            pile.name = 'rubble';
            this.scene.add(pile);
            this.addCollisionBox(x, y, z, r * 1.4, r * 0.7, r * 1.4, pile);
        }
    }

    _createThemedSceneryBatches(terrain) {
        const mapId = this.mapConfig?.id || 'default';
        const theme = this.mapConfig?.environment?.theme || 'frontline';
        const budget = this.mapConfig?.environment?.distantPropCount ?? 48;
        const points = this.mapConfig?.capturePoints || [];
        if (!points.length || budget <= 0) return;

        const random = this._createSeededRandom(53);
        const primary = [];
        const secondary = [];
        const size = terrain.size;
        let attempts = 0;
        while (primary.length + secondary.length < budget && attempts < budget * 12) {
            attempts++;
            const point = points[attempts % points.length];
            const angle = random() * Math.PI * 2;
            const distance = (point.radius || 12) + 7 + random() * 28;
            const x = point.x + Math.cos(angle) * distance;
            const z = point.z + Math.sin(angle) * distance;
            if (Math.abs(x) > size * 0.45 || Math.abs(z) > size * 0.45) continue;
            if (Math.abs(x) < 6.5 || Math.abs(z) < 6.5) continue;
            if (this._isNearSpawnOrVehicle(x, z, 7)) continue;
            if (!this._canPlaceProp(terrain, x, z, {
                maxSlope: theme === 'volcanic' ? 0.75 : 0.5,
                avoidBuildingPad: 2.2,
            })) continue;

            const y = this._groundY(terrain, x, z);
            const rotationY = random() * Math.PI * 2;
            const scale = 0.75 + random() * 0.75;
            const target = random() < 0.62 ? primary : secondary;
            target.push({
                position: new THREE.Vector3(x, y, z),
                rotation: new THREE.Euler(0, rotationY, 0),
                scale: { x: scale, y: scale * (0.8 + random() * 0.4), z: scale },
            });
        }

        let primaryGeometry;
        let secondaryGeometry;
        let primaryMaterial;
        let secondaryMaterial;

        if (theme === 'forest') {
            primaryGeometry = new THREE.CylinderGeometry(0.18, 0.28, 3.2, 6);
            primaryGeometry.rotateZ(Math.PI / 2);
            primaryGeometry.translate(0, 0.28, 0);
            secondaryGeometry = new THREE.ConeGeometry(0.55, 1.35, 6);
            secondaryGeometry.translate(0, 0.48, 0);
            primaryMaterial = createProceduralMaterial('wood', {
                baseColor: 0x4b3827, accentColor: 0x21170f, detailColor: 0x776047,
                size: 64, repeatX: 3, repeatY: 1, anisotropy: 2,
            }, { roughness: 0.98 });
            secondaryMaterial = createProceduralMaterial('fabric', {
                baseColor: 0x39483a, accentColor: 0x202b24, detailColor: 0x7d887d,
                size: 64, repeatX: 1, repeatY: 1, anisotropy: 2,
            }, { roughness: 1 });
        } else if (theme === 'beach') {
            primaryGeometry = new THREE.BoxGeometry(1.25, 0.36, 0.72);
            primaryGeometry.translate(0, 0.18, 0);
            secondaryGeometry = new THREE.CylinderGeometry(0.07, 0.12, 1.8, 5);
            secondaryGeometry.rotateZ(Math.PI * 0.38);
            secondaryGeometry.translate(0, 0.5, 0);
            primaryMaterial = createProceduralMaterial('wood', {
                baseColor: 0x66543c, accentColor: 0x332719, detailColor: 0x9a8562,
                size: 64, repeatX: 2, repeatY: 1, anisotropy: 2,
            }, { roughness: 0.98 });
            secondaryMaterial = createProceduralMaterial('wood', {
                baseColor: 0x493b2a, accentColor: 0x20170f, detailColor: 0x756145,
                size: 64, repeatX: 1, repeatY: 3, anisotropy: 2,
            }, { roughness: 1 });
        } else if (theme === 'volcanic') {
            primaryGeometry = new THREE.DodecahedronGeometry(0.72, 0);
            primaryGeometry.translate(0, 0.28, 0);
            secondaryGeometry = new THREE.BoxGeometry(1.55, 0.62, 0.72);
            secondaryGeometry.translate(0, 0.24, 0);
            primaryMaterial = createProceduralMaterial('concrete', {
                baseColor: 0x302d2a, accentColor: 0x171513, detailColor: 0x575049,
                size: 64, repeatX: 1, repeatY: 1, anisotropy: 2,
            }, { roughness: 1 });
            secondaryMaterial = createProceduralMaterial('concrete', {
                baseColor: 0x54504a, accentColor: 0x2b2926, detailColor: 0x777169,
                size: 64, repeatX: 2, repeatY: 1, anisotropy: 2,
            }, { roughness: 0.98 });
        } else if (theme === 'urban_ruin') {
            primaryGeometry = new THREE.BoxGeometry(1.4, 1.1, 0.35);
            primaryGeometry.translate(0, 0.55, 0);
            secondaryGeometry = new THREE.BoxGeometry(0.9, 0.55, 0.9);
            secondaryGeometry.translate(0, 0.28, 0);
            primaryMaterial = createProceduralMaterial('battle_damage', {
                baseColor: 0x6a655c, accentColor: 0x2e2b26, detailColor: 0x4a4132,
                size: 64, repeatX: 1, repeatY: 1, anisotropy: 2,
            }, { roughness: 0.98 });
            secondaryMaterial = createProceduralMaterial('concrete', {
                baseColor: 0x7a5a45, accentColor: 0x3a281c, detailColor: 0xa07858,
                size: 64, repeatX: 1, repeatY: 1, anisotropy: 2,
            }, { roughness: 0.97 });
        } else {
            primaryGeometry = new THREE.BoxGeometry(1.05, 0.58, 0.78);
            primaryGeometry.translate(0, 0.29, 0);
            secondaryGeometry = new THREE.CylinderGeometry(0.22, 0.24, 0.9, 8);
            secondaryGeometry.translate(0, 0.45, 0);
            primaryMaterial = createProceduralMaterial('wood', {
                baseColor: 0x645139, accentColor: 0x2b2116, detailColor: 0x9a7d55,
                size: 64, repeatX: 2, repeatY: 1, anisotropy: 2,
            }, { roughness: 0.96 });
            secondaryMaterial = createProceduralMaterial('metal', {
                baseColor: 0x3e4a4e, accentColor: 0x1e2426, detailColor: 0x768286,
                size: 64, repeatX: 1, repeatY: 2, anisotropy: 2,
            }, { roughness: 0.82, metalness: 0.25 });
        }

        this._createInstancedDecoration(`${mapId}_theme_primary`, primaryGeometry, primaryMaterial, primary);
        this._createInstancedDecoration(`${mapId}_theme_secondary`, secondaryGeometry, secondaryMaterial, secondary);
    }

    // 滩头障碍：捷克刺猬（反坦克桩）+ 木桩，散布在海滩侧
    _createBeachObstacles(terrain, mapId) {
        const steelMat = createProceduralMaterial('metal', {
            baseColor: 0x3d3a35, accentColor: 0x211f1c, detailColor: 0x6a5f4a,
            size: 64, repeatX: 1, repeatY: 1, anisotropy: 2,
        }, { roughness: 0.75, metalness: 0.55 });
        const woodMat = createProceduralMaterial('wood', {
            baseColor: 0x4a3a28, accentColor: 0x241a10, detailColor: 0x6f5a3c,
            size: 64, repeatX: 1, repeatY: 2, anisotropy: 2,
        }, { roughness: 0.95 });

        // 海滩在 +z 侧（两张地图的滩头据点都在 z>100）
        const beachZMin = mapId === 'normandy' ? 95 : 105;
        const beachZMax = 160;
        const count = 22;
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = beachZMin + Math.random() * (beachZMax - beachZMin);
            if (this._shouldSkipPropForBuildingAccess(x, z, 1.5)) continue;
            const y = this._groundY(terrain, x, z);
            if (!this._isAboveWater(y)) continue;
            if (this.checkCollision(new THREE.Vector3(x, 0, z), 1.6, 2)) continue;

            if (Math.random() < 0.65) {
                // 捷克刺猬：三根交叉工字钢
                const hedgehog = new THREE.Group();
                hedgehog.position.set(x, y + 0.45, z);
                for (let b = 0; b < 3; b++) {
                    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.1, 0.16), steelMat);
                    beam.rotation.set(
                        b === 0 ? Math.PI / 4 : b === 1 ? -Math.PI / 4 : Math.PI / 2,
                        (b / 3) * Math.PI * 2,
                        b === 2 ? Math.PI / 4 : 0
                    );
                    hedgehog.add(beam);
                }
                hedgehog.rotation.y = Math.random() * Math.PI;
                this.scene.add(hedgehog);
                this.addCollisionBox(x, y, z, 1.6, 1.3, 1.6, hedgehog);
            } else {
                // 斜插木桩
                const h = 1.6 + Math.random() * 0.9;
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, h, 5), woodMat);
                pole.position.set(x, y + h * 0.42, z);
                pole.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI, 0.5 + Math.random() * 0.25);
                this.scene.add(pole);
                this.addCollisionBox(x, y, z, 0.5, h, 0.5, pole);
            }
        }
    }

    // 诺曼底滩头碉堡 + 防波堤（海岸防御工事，含碰撞掩体）
    _createBeachFortifications(terrain) {
        const mapId = this.mapConfig?.id;
        if (mapId !== 'normandy') return;

        const bunkerMat = createProceduralMaterial('concrete', {
            baseColor: 0x8a8578, accentColor: 0x4a463d, detailColor: 0xb8b0a0,
            size: 128, repeatX: 2, repeatY: 1, anisotropy: 4,
        }, { roughness: 0.98 });
        const bunkerDark = createProceduralMaterial('concrete', {
            baseColor: 0x6f6a5e, accentColor: 0x38342d, detailColor: 0x97907f,
            size: 64, repeatX: 1, repeatY: 1, anisotropy: 2,
        }, { roughness: 0.98 });
        const random = this._createSeededRandom(99);

        // 防波堤条：沿海岸线（z≈140）排列，提供掩体
        const wallCount = 6;
        for (let i = 0; i < wallCount; i++) {
            const x = -90 + (i / (wallCount - 1)) * 180 + (random() - 0.5) * 6;
            const z = 138 + (random() - 0.5) * 6;
            if (this._shouldSkipPropForBuildingAccess(x, z, 2)) continue;
            const y = this._groundY(terrain, x, z);
            if (!this._isAboveWater(y)) continue;
            if (this.checkCollision(new THREE.Vector3(x, 0, z), 2.4, 3)) continue;
            const block = new THREE.Mesh(new THREE.BoxGeometry(5, 1.4, 1.1), bunkerMat);
            block.position.set(x, y + 0.7, z);
            block.name = 'seawall';
            this.scene.add(block);
            this.addCollisionBox(x, y, z, 5, 1.4, 1.1, block);
        }

        // 碉堡：3 个，贴海岸线稍靠内陆
        const bunkers = [
            { x: -50, z: 132, yaw: 0.3 },
            { x: 5, z: 136, yaw: -0.1 },
            { x: 62, z: 130, yaw: -0.4 },
        ];
        for (const b of bunkers) {
            if (this._shouldSkipPropForBuildingAccess(b.x, b.z, 5)) continue;
            const y = this._groundY(terrain, b.x, b.z);
            if (!this._isAboveWater(y)) continue;
            if (this.checkCollision(new THREE.Vector3(b.x, 0, b.z), 5.5, 4)) continue;
            const grp = new THREE.Group();
            // 主体
            const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.6, 4.5), bunkerMat);
            body.position.y = 1.3;
            grp.add(body);
            // 顶盖
            const cap = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.6, 5.2), bunkerDark);
            cap.position.y = 3.0;
            grp.add(cap);
            // 射击口（东西南北各看一个面加暗口）
            const embrasure = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.1), bunkerDark);
            embrasure.position.set(0, 1.5, 2.27);
            grp.add(embrasure);
            const embrasure2 = embrasure.clone();
            embrasure2.position.set(0, 1.5, -2.27);
            grp.add(embrasure2);
            // 入口门（朝内陆 -z 侧）
            const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.14), bunkerDark);
            door.position.set(0, 0.75, -2.27);
            grp.add(door);
            grp.position.set(b.x, y, b.z);
            grp.rotation.y = b.yaw;
            grp.name = 'bunker';
            this.scene.add(grp);
            this.addCollisionBox(b.x, y, b.z, 4.5, 2.6, 4.5, grp);
        }
    }

    // 雪堆：半埋圆丘（阿登雪原氛围，无碰撞装饰）
    _createSnowDrifts(terrain) {
        const snowMat = createProceduralMaterial('fabric', {
            baseColor: 0xe8eef5, accentColor: 0xc5d2e0, detailColor: 0xffffff,
            size: 64, repeatX: 2, repeatY: 2, anisotropy: 2,
        }, { roughness: 0.98 });
        const geometry = new THREE.SphereGeometry(1, 8, 5);
        const transforms = [];
        const random = this._createSeededRandom(71);
        const size = terrain.size;
        let attempts = 0;
        while (transforms.length < 40 && attempts < 240) {
            attempts++;
            const x = (random() - 0.5) * size * 0.85;
            const z = (random() - 0.5) * size * 0.85;
            if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
            if (this._isNearSpawnOrVehicle(x, z, 5)) continue;
            if (!this._canPlaceProp(terrain, x, z, { maxSlope: 0.5, avoidBuildingPad: 1 })) continue;
            const y = this._groundY(terrain, x, z);
            const radius = 1.2 + random() * 2.4;
            transforms.push({
                position: new THREE.Vector3(x, y - radius * 0.18, z),
                rotation: new THREE.Euler(0, random() * Math.PI, 0),
                scale: {
                    x: radius * (1 + random() * 0.8),
                    y: radius * 0.55,
                    z: radius * (1 + random() * 0.5),
                },
            });
        }
        this._createInstancedDecoration('ardennes_snow_drifts', geometry, snowMat, transforms);
    }

    // 基于地图配置的差异化散布（树木/岩石密度随地图变化）
    _createProceduralScatter(terrain) {
        const obs = this.mapConfig.obstacles || {};
        const treeCount = obs.trees || 60;
        const rockCount = Math.floor((obs.trees || 60) * 0.3);
        const size = terrain.size;
        // 地图色调决定树叶颜色（雪地偏白、火山偏黑、沙地偏黄）
        const groundColor = this.mapConfig.terrain?.groundColor || 0x6b7a5a;
        const isSnow = groundColor === 0xdde5ee;
        const isVolcanic = groundColor === 0x3a3530;
        const isSand = groundColor === 0x8a8068;

        // 补充树木（在已有 _createTrees 基础上增加密度，风格随地图）
        // 诺曼底海滩树木减半，且严格避开水面/陡坡/建筑平台
        const mapId = this.mapConfig?.id;
        const extraTrees = Math.max(0, treeCount - 18);
        // 诺曼底：配置 trees 很少时 extra 为 0；即使有也几乎不补
        const finalTreeBudget = mapId === 'normandy' ? Math.min(2, extraTrees) : extraTrees;
        let placed = 0;
        let attempts = 0;
        while (placed < finalTreeBudget && attempts < Math.max(8, finalTreeBudget * 6)) {
            attempts++;
            const x = (Math.random() - 0.5) * size * 0.85;
            const z = (Math.random() - 0.5) * size * 0.85;
            if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;
            // 诺曼底：只在内陆高地种极少树
            if (mapId === 'normandy' && z > 40) continue;
            if (!this._canPlaceProp(terrain, x, z, {
                maxSlope: 0.4,
                avoidBuildingPad: 3.0,
                maxPlatformDelta: 0.35,
            })) continue;
            if (this.checkCollision(new THREE.Vector3(x, 0, z), 1.5, 2)) continue;

            const y = this._groundY(terrain, x, z);
            this._buildTree(x, y - 0.08, z, 0.7 + Math.random() * 0.45);
            placed++;
        }

        // 补充岩石（火山岛和山地地图岩石更多）
        for (let i = 0; i < rockCount; i++) {
            const x = (Math.random() - 0.5) * size * 0.85;
            const z = (Math.random() - 0.5) * size * 0.85;
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
            if (!this._canPlaceProp(terrain, x, z, { maxSlope: 0.85, avoidBuildingPad: 2 })) continue;

            const y = this._groundY(terrain, x, z);
            const rockScale = 0.6 + Math.random() * 1.8;
            const rockColor = isVolcanic ? 0x2a2520 : isSnow ? 0x8a8a8a : 0x5a5650;
            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(rockScale, 0),
                createProceduralMaterial('concrete', {
                    baseColor: rockColor,
                    accentColor: 0x1a1a1a,
                    detailColor: 0x6a6a6a,
                    size: 64,
                    repeatX: 1,
                    repeatY: 1,
                    anisotropy: 2,
                }, { roughness: 0.95 })
            );
            // 略微埋入地面，避免悬空
            rock.position.set(x, y + rockScale * 0.18, z);
            rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            this.scene.add(rock);
            this.addCollisionBox(x, y, z, rockScale * 1.5, rockScale * 1.2, rockScale * 1.5, rock);
        }
    }

    // 建筑占地内的最大高差（用于坡度检测与地基裙边）
    _getFootprintHeightSpread(x, z, width, depth, terrain) {
        const samples = [
            [0, 0],
            [-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5],
            [-0.5, 0], [0.5, 0], [0, -0.5], [0, 0.5],
        ];
        let minY = Infinity, maxY = -Infinity;
        for (const [sx, sz] of samples) {
            const h = terrain.getHeight(x + sx * width, z + sz * depth);
            minY = Math.min(minY, h);
            maxY = Math.max(maxY, h);
        }
        return { minY, maxY, spread: maxY - minY };
    }

    _createBuilding(x, z, width, depth, height, terrain, color = 0x8a8a7a) {
        // 坡地检测：占地高差过大时，在附近搜索更平坦的位置（避免建筑插进山体/悬空穿模）
        {
            const maxSpread = 2.4;
            let info = this._getFootprintHeightSpread(x, z, width, depth, terrain);
            if (info.spread > maxSpread) {
                const searchOffsets = [
                    [10, 0], [-10, 0], [0, 10], [0, -10],
                    [14, 10], [-14, 10], [14, -10], [-14, -10],
                    [20, 0], [-20, 0], [0, 20], [0, -20],
                ];
                let best = { x, z, spread: info.spread };
                for (const [ox, oz] of searchOffsets) {
                    const nx = x + ox;
                    const nz = z + oz;
                    if (this._isInsideBuildingFootprint(nx, nz, Math.max(width, depth) * 0.6)) continue;
                    const s = this._getFootprintHeightSpread(nx, nz, width, depth, terrain).spread;
                    if (s < best.spread) best = { x: nx, z: nz, spread: s };
                    if (s < 1.0) break;
                }
                x = best.x;
                z = best.z;
                // 挪完仍在陡坡上（>4m 高差属于山脊/断崖）：放弃生成，避免必然穿模
                if (best.spread > 4.0) return null;
            }
        }

        const y = this._getFootprintPlatformHeight(x, z, width, depth, terrain);
        const heightInfo = this._getFootprintHeightSpread(x, z, width, depth, terrain);
        if (terrain.addFlatArea) {
            terrain.addFlatArea(x, z, width, depth, y, 0.35);
        }
        const group = new THREE.Group();
        group.position.set(x, y, z);
        this.scene.add(group);

        // 地基裙边：平台以建筑占地最高点为准，低侧会出现悬空缝隙——
        // 用一圈向下延伸的基座包住落差（战地风格的混凝土地基）
        if (heightInfo.spread > 0.4) {
            const skirtDepth = heightInfo.spread + 0.5;
            const skirtMat = createProceduralMaterial('concrete', {
                baseColor: 0x5f5b50, accentColor: 0x35322b, detailColor: 0x8a8578,
                size: 128, repeatX: 2, repeatY: 1, anisotropy: 4,
            }, { roughness: 0.98 });
            const skirt = new THREE.Mesh(
                new THREE.BoxGeometry(width + 0.6, skirtDepth, depth + 0.6),
                skirtMat
            );
            skirt.position.set(0, -skirtDepth / 2 + 0.06, 0);
            skirt.name = 'foundation';
            group.add(skirt);
            this.meshes.push(skirt);
        }

        const wallMat = createProceduralMaterial('battle_damage', {
            baseColor: color,
            accentColor: 0x3f3d35,
            detailColor: 0x4a4132,
            size: 256,
            repeatX: Math.max(1, Math.ceil(width / 5)),
            repeatY: Math.max(1, Math.ceil(height / 3)),
            anisotropy: 8,
        }, { roughness: 0.96, metalness: 0.02, bumpScale: 0.055 });
        const floorMat = createProceduralMaterial('concrete', {
            baseColor: 0x4a4a42,
            accentColor: 0x2c2b27,
            detailColor: 0x8c887a,
            size: 256,
            repeatX: Math.max(1, Math.ceil(width / 4)),
            repeatY: Math.max(1, Math.ceil(depth / 4)),
            anisotropy: 8,
        }, { roughness: 0.98, bumpScale: 0.035 });
        const trimMat = createProceduralMaterial('wood', {
            baseColor: 0x3a3328,
            accentColor: 0x1b1711,
            detailColor: 0x6f5d3d,
            size: 128,
            repeatX: 2,
            repeatY: 1,
            anisotropy: 4,
        }, { roughness: 0.9, bumpScale: 0.025 });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x89a8b8,
            roughness: 0.08,
            metalness: 0.12,
            transparent: true,
            opacity: 0.28,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        const wallThickness = 0.35;
        const doorWidth = Math.min(2.8, Math.max(2.1, width * 0.32));
        const sideDoorWidth = Math.min(2.6, Math.max(1.9, depth * 0.32));
        const doorHeight = Math.min(2.65, height * 0.68);

        this.buildingFootprints.push({
            minX: x - width / 2,
            maxX: x + width / 2,
            minZ: z - depth / 2,
            maxZ: z + depth / 2,
        });

        const addPart = (name, cx, cy, cz, w, h, d, mat, collide = true) => {
            if (w <= 0 || h <= 0 || d <= 0) return null;
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            mesh.name = name;
            mesh.position.set(cx - x, cy - y, cz - z);
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            mesh.userData.buildingPart = name;
            // 标记建筑墙体为可破坏实体（玻璃和屋顶除外）
            if (collide && !name.includes('glass') && !name.includes('roof')) {
                mesh.userData.destructibleType = 'building';
            }
            group.add(mesh);
            if (collide) {
                this.addCollisionBox(cx, cy - h / 2, cz, w, h, d, mesh);
            } else {
                mesh.userData.penetrable = true;
                mesh.userData.blocksBullets = false;
                this.meshes.push(mesh);
            }
            return mesh;
        };

        const markGlass = (pane) => {
            if (!pane) return;
            pane.userData.isGlass = true;
            pane.userData.penetrable = true;
            pane.userData.blocksBullets = false;
            pane.userData.glassHealth = 1;
            pane.userData.structure = 'building';
        };

        // 多层建筑：一楼墙只建到二楼地板高度，二楼再单独开窗；单层则用全高
        const hasSecondFloor = height >= 6 && width >= 9 && depth >= 8;
        const floor2Y = 3.0;
        const groundWallH = hasSecondFloor ? floor2Y : height;

        const addWindowedWallX = (prefix, cx, wallZ, spanW, wallH = height) => {
            const windowW = Math.min(Math.max(1.2, spanW * 0.42), Math.max(1.25, spanW - 0.8));
            const sillH = Math.min(1.05, Math.max(0.78, wallH * 0.28));
            const openingH = Math.min(1.15, Math.max(0.9, wallH * 0.34));
            const lintelY = y + Math.min(wallH - 0.35, sillH + openingH);
            const topH = Math.max(0.28, wallH - (lintelY - y));
            const sideW = Math.max(0.2, (spanW - windowW) / 2);
            if (spanW < 2.2 || windowW >= spanW - 0.25) {
                addPart(`${prefix}_solid`, cx, y + wallH / 2, wallZ, spanW, wallH, wallThickness, wallMat);
                return;
            }

            addPart(`${prefix}_left`, cx - windowW / 2 - sideW / 2, y + wallH / 2, wallZ, sideW, wallH, wallThickness, wallMat);
            addPart(`${prefix}_right`, cx + windowW / 2 + sideW / 2, y + wallH / 2, wallZ, sideW, wallH, wallThickness, wallMat);
            addPart(`${prefix}_sill`, cx, y + sillH / 2, wallZ, windowW, sillH, wallThickness, wallMat);
            addPart(`${prefix}_lintel`, cx, lintelY + topH / 2, wallZ, windowW, topH, wallThickness, wallMat);

            addPart(`${prefix}_frame_low`, cx, y + sillH + 0.05, wallZ, windowW + 0.18, 0.1, wallThickness * 0.7, trimMat, false);
            addPart(`${prefix}_frame_high`, cx, lintelY - 0.05, wallZ, windowW + 0.18, 0.1, wallThickness * 0.7, trimMat, false);
            addPart(`${prefix}_frame_left`, cx - windowW / 2 - 0.08, y + sillH + openingH / 2, wallZ, 0.1, openingH, wallThickness * 0.7, trimMat, false);
            addPart(`${prefix}_frame_right`, cx + windowW / 2 + 0.08, y + sillH + openingH / 2, wallZ, 0.1, openingH, wallThickness * 0.7, trimMat, false);
            const pane = addPart(`${prefix}_glass`, cx, y + sillH + openingH / 2, wallZ, windowW * 0.88, openingH * 0.86, 0.035, glassMat, false);
            markGlass(pane);
        };

        const addWindowedWallZ = (prefix, wallX, cz, spanD, wallH = height) => {
            const windowD = Math.min(Math.max(1.2, spanD * 0.42), Math.max(1.25, spanD - 0.8));
            const sillH = Math.min(1.05, Math.max(0.78, wallH * 0.28));
            const openingH = Math.min(1.15, Math.max(0.9, wallH * 0.34));
            const lintelY = y + Math.min(wallH - 0.35, sillH + openingH);
            const topH = Math.max(0.28, wallH - (lintelY - y));
            const sideD = Math.max(0.2, (spanD - windowD) / 2);
            if (spanD < 2.2 || windowD >= spanD - 0.25) {
                addPart(`${prefix}_solid`, wallX, y + wallH / 2, cz, wallThickness, wallH, spanD, wallMat);
                return;
            }

            addPart(`${prefix}_back`, wallX, y + wallH / 2, cz - windowD / 2 - sideD / 2, wallThickness, wallH, sideD, wallMat);
            addPart(`${prefix}_front`, wallX, y + wallH / 2, cz + windowD / 2 + sideD / 2, wallThickness, wallH, sideD, wallMat);
            addPart(`${prefix}_sill`, wallX, y + sillH / 2, cz, wallThickness, sillH, windowD, wallMat);
            addPart(`${prefix}_lintel`, wallX, lintelY + topH / 2, cz, wallThickness, topH, windowD, wallMat);

            addPart(`${prefix}_frame_low`, wallX, y + sillH + 0.05, cz, wallThickness * 0.7, 0.1, windowD + 0.18, trimMat, false);
            addPart(`${prefix}_frame_high`, wallX, lintelY - 0.05, cz, wallThickness * 0.7, 0.1, windowD + 0.18, trimMat, false);
            addPart(`${prefix}_frame_back`, wallX, y + sillH + openingH / 2, cz - windowD / 2 - 0.08, wallThickness * 0.7, openingH, 0.1, trimMat, false);
            addPart(`${prefix}_frame_front`, wallX, y + sillH + openingH / 2, cz + windowD / 2 + 0.08, wallThickness * 0.7, openingH, 0.1, trimMat, false);
            const pane = addPart(`${prefix}_glass`, wallX, y + sillH + openingH / 2, cz, 0.035, openingH * 0.86, windowD * 0.88, glassMat, false);
            markGlass(pane);
        };

        // 地板仅作为视觉和射线表面，不阻挡移动
        addPart('floor', x, y + 0.04, z, width, 0.08, depth, floorMat, false);

        // 前后墙开门洞：左右墙段 + 门楣（多层时门楣只到二楼地板）
        const sideWallWidth = (width - doorWidth) / 2;
        const leftCenterX = x - doorWidth / 2 - sideWallWidth / 2;
        const rightCenterX = x + doorWidth / 2 + sideWallWidth / 2;
        const frontZ = z + depth / 2 - wallThickness / 2;
        const backZ = z - depth / 2 + wallThickness / 2;
        const doorLintelH = Math.max(0.35, groundWallH - doorHeight);
        for (const wall of [
            { suffix: 'front', wz: frontZ },
            { suffix: 'back', wz: backZ },
        ]) {
            addWindowedWallX(`wall_${wall.suffix}_left`, leftCenterX, wall.wz, sideWallWidth, groundWallH);
            addWindowedWallX(`wall_${wall.suffix}_right`, rightCenterX, wall.wz, sideWallWidth, groundWallH);
            addPart(
                `wall_${wall.suffix}_lintel`,
                x,
                y + doorHeight + doorLintelH / 2,
                wall.wz,
                doorWidth,
                doorLintelH,
                wallThickness,
                wallMat
            );
        }

        // 左右墙也开门洞，避免从侧面接近时误以为房子不能进
        const sideWallDepth = (depth - sideDoorWidth) / 2;
        const backCenterZ = z - sideDoorWidth / 2 - sideWallDepth / 2;
        const frontCenterZ = z + sideDoorWidth / 2 + sideWallDepth / 2;
        const leftX = x - width / 2 + wallThickness / 2;
        const rightX = x + width / 2 - wallThickness / 2;
        for (const wall of [
            { suffix: 'left', wx: leftX },
            { suffix: 'right', wx: rightX },
        ]) {
            addWindowedWallZ(`wall_${wall.suffix}_back`, wall.wx, backCenterZ, sideWallDepth, groundWallH);
            addWindowedWallZ(`wall_${wall.suffix}_front`, wall.wx, frontCenterZ, sideWallDepth, groundWallH);
            addPart(
                `wall_${wall.suffix}_lintel`,
                wall.wx,
                y + doorHeight + doorLintelH / 2,
                z,
                wallThickness,
                doorLintelH,
                sideDoorWidth,
                wallMat
            );
        }

        this._registerBuildingDoorZone(x, frontZ + wallThickness * 1.6, Math.max(doorWidth, 2.4));
        this._registerBuildingDoorZone(x, backZ - wallThickness * 1.6, Math.max(doorWidth, 2.4));
        this._registerBuildingDoorZone(leftX - wallThickness * 1.6, z, Math.max(sideDoorWidth, 2.3));
        this._registerBuildingDoorZone(rightX + wallThickness * 1.6, z, Math.max(sideDoorWidth, 2.3));

        // 门框与内侧掩体细节，不阻挡移动
        addPart('door_frame_front_top', x, y + doorHeight + 0.08, frontZ + wallThickness * 0.55, doorWidth + 0.25, 0.16, 0.12, trimMat, false);
        addPart('door_frame_back_top', x, y + doorHeight + 0.08, backZ - wallThickness * 0.55, doorWidth + 0.25, 0.16, 0.12, trimMat, false);
        addPart('door_frame_left_top', leftX - wallThickness * 0.55, y + doorHeight + 0.08, z, 0.12, 0.16, sideDoorWidth + 0.25, trimMat, false);
        addPart('door_frame_right_top', rightX + wallThickness * 0.55, y + doorHeight + 0.08, z, 0.12, 0.16, sideDoorWidth + 0.25, trimMat, false);
        addPart('step_front', x, y + 0.03, frontZ + 0.75, doorWidth + 0.8, 0.06, 1.0, floorMat, false);
        addPart('step_back', x, y + 0.03, backZ - 0.75, doorWidth + 0.8, 0.06, 1.0, floorMat, false);
        addPart('step_left', leftX - 0.75, y + 0.03, z, 1.0, 0.06, sideDoorWidth + 0.8, floorMat, false);
        addPart('step_right', rightX + 0.75, y + 0.03, z, 1.0, 0.06, sideDoorWidth + 0.8, floorMat, false);
        addPart('interior_low_cover', x + width * 0.18, y + 0.45, z, width * 0.25, 0.9, 0.6, trimMat, true);
        addPart('interior_table', x - width * 0.22, y + 0.38, z + depth * 0.18, Math.min(2.2, width * 0.28), 0.76, 0.8, trimMat, true);
        addPart('interior_shelf', x + width * 0.34, y + 0.75, z - depth * 0.24, 0.55, 1.5, Math.min(2.2, depth * 0.28), trimMat, true);
        if (width >= 9 && depth >= 8) {
            addPart('interior_divider', x - width * 0.12, y + 0.6, z - depth * 0.18, 0.45, 1.2, Math.min(3.0, depth * 0.35), trimMat, true);
            addPart('interior_corner_crates', x + width * 0.28, y + 0.45, z + depth * 0.25, 1.1, 0.9, 1.1, trimMat, true);
        }
        if (height >= 6) {
            addPart('interior_upper_shadow_panel', x, y + 2.7, z, width * 0.35, 0.18, 0.7, trimMat, false);
        }

        // === 二楼 + 靠墙 L 型转弯楼梯（对足够高、足够大的建筑） ===
        // 正确 L 型（靠 -X/-Z 墙角，一路向前无需回头）：
        //   ① 第一段贴 -X 内墙：从房间内侧（较大 Z）起步，朝 -Z 走向墙角，升到 1.5m
        //   ② 转角平台：在 -X -Z 墙角，高度 1.5m（第一段终点）
        //   ③ 第二段贴 -Z 内墙：从平台沿 +X 离开墙角，升到 3.0m 二楼地板
        // 二楼地板 L 形开口覆盖两段楼梯投影，其余整块连通。
        if (hasSecondFloor) {
            const innerDepth = depth - wallThickness * 1.6;
            const innerWidth = width - wallThickness * 1.6;
            const innerMinX = x - innerWidth / 2;
            const innerMaxX = x + innerWidth / 2;
            const innerMinZ = z - innerDepth / 2;
            const innerMaxZ = z + innerDepth / 2;

            const stairW = 1.6;
            const halfH = floor2Y / 2;
            const targetStepH = 0.20;
            const stepD = 0.40;
            const halfStepCount = Math.max(6, Math.ceil(halfH / targetStepH));
            const actualHalfStepH = halfH / halfStepCount;
            const firstRunLen = halfStepCount * stepD;
            const secondRunLen = halfStepCount * stepD;
            const landingSize = Math.max(stairW, 1.7);

            // --- 几何：转角平台在 -X -Z 墙角 ---
            const landingMinX = innerMinX + 0.05;
            const landingMinZ = innerMinZ + 0.05;
            const landingCenterX = landingMinX + landingSize / 2;
            const landingCenterZ = landingMinZ + landingSize / 2;

            // 第一段：贴 -X 墙。底部在 +Z 侧，顶部接到平台（朝 -Z 爬升）
            const run1X = innerMinX + stairW / 2;
            const run1TopZ = landingMinZ + landingSize;           // 第一段最高级靠近平台
            const run1BottomZ = run1TopZ + firstRunLen;           // 起步更靠房间内侧
            // 第二段：贴 -Z 墙。从平台 +X 侧起，沿 +X 爬到二楼
            const run2Z = innerMinZ + stairW / 2;
            const run2StartX = landingMinX + landingSize;
            const run2EndX = run2StartX + secondRunLen;

            // === 二楼地板：L 形开口（覆盖第一段 + 第二段投影）===
            const holeMinX = innerMinX - 0.05;
            const holeMaxX = Math.max(innerMinX + stairW, run2EndX) + 0.15;
            const holeMinZ = innerMinZ - 0.05;
            const holeMaxZ = run1BottomZ + 0.25;
            // 第二段条带开口（靠 -Z）
            const run2HoleMaxZ = innerMinZ + stairW + 0.15;
            const run2HoleMaxX = run2EndX + 0.2;

            const slabThickness = 0.18;
            const slabY = y + floor2Y;

            // 板 A：洞口右侧大板（X > holeMaxX，全深度）—— 若第二段更长则 holeMaxX 已含第二段
            const aMinX = holeMaxX;
            if (innerMaxX - aMinX > 0.3) {
                addPart('floor2_main', (aMinX + innerMaxX) / 2, slabY, (innerMinZ + innerMaxZ) / 2,
                    innerMaxX - aMinX, slabThickness, innerDepth, floorMat, true);
            }
            // 板 B：第一段洞口上方（+Z 侧），X 在楼梯带内
            const bMinZ = holeMaxZ;
            if (innerMaxZ - bMinZ > 0.3) {
                addPart('floor2_over_run1', (holeMinX + Math.min(holeMaxX, innerMinX + stairW + 0.1)) / 2, slabY,
                    (bMinZ + innerMaxZ) / 2,
                    Math.min(holeMaxX, innerMinX + stairW + 0.1) - holeMinX,
                    slabThickness, innerMaxZ - bMinZ, floorMat, true);
            }
            // 板 C：第二段洞口旁边（X 在 run2 带内但 Z 已过 run2 宽度）—— 若 holeMaxX 大于 stairW
            // 主连通已由板 A 覆盖；此处补第一段条带右侧、第二段上方的角落
            const cMinX = innerMinX + stairW + 0.1;
            const cMaxX = Math.min(holeMaxX, run2HoleMaxX);
            const cMinZ = run2HoleMaxZ;
            const cMaxZ = holeMaxZ;
            if (cMaxX - cMinX > 0.3 && cMaxZ - cMinZ > 0.3) {
                addPart('floor2_corner_fill', (cMinX + cMaxX) / 2, slabY, (cMinZ + cMaxZ) / 2,
                    cMaxX - cMinX, slabThickness, cMaxZ - cMinZ, floorMat, true);
            }

            // === 第一段楼梯：贴 -X，朝 -Z 爬升（i=0 底部 / i=n-1 顶部接平台）===
            for (let i = 0; i < halfStepCount; i++) {
                const stepTopY = y + actualHalfStepH * (i + 1);
                // 从底部 Z 向 -Z 推进
                const stepZPos = run1BottomZ - stepD / 2 - i * stepD;
                addPart(`stairs_a_${i}`, run1X, stepTopY - actualHalfStepH / 2, stepZPos,
                    stairW, actualHalfStepH + 0.02, stepD + 0.04, trimMat, true);
            }

            // === 转角平台（-X -Z 墙角，第一段终点高度）===
            addPart('stairs_landing', landingCenterX, y + halfH - 0.09, landingCenterZ,
                landingSize, 0.18, landingSize, floorMat, true);

            // === 第二段楼梯：贴 -Z，沿 +X 爬升到二楼 ===
            for (let i = 0; i < halfStepCount; i++) {
                const stepTopY = y + halfH + actualHalfStepH * (i + 1);
                const stepXPos = run2StartX + stepD / 2 + i * stepD;
                addPart(`stairs_b_${i}`, stepXPos, stepTopY - actualHalfStepH / 2, run2Z,
                    stepD + 0.04, actualHalfStepH + 0.02, stairW, trimMat, true);
            }

            // === 楼梯下方掩体箱（平台正下方，不挡通行）===
            addPart('stair_crate_bot', landingCenterX + 0.35, y + 0.3, landingCenterZ + 0.35, 0.7, 0.6, 0.7, trimMat, true);
            addPart('stair_crate_top', landingCenterX + 0.85, y + 0.75, landingCenterZ + 0.7, 0.7, 0.6, 0.7, trimMat, true);

            // === 外侧护栏（第一段 +X 侧 / 第二段 +Z 侧）===
            const railH = 1.0;
            const postCount = 5;
            const rail1X = run1X + stairW / 2 + 0.04;
            let pzPrev = null, pyPrev = null;
            for (let i = 0; i < postCount; i++) {
                const t = i / (postCount - 1);
                // 从底部到顶部：Z 递减，高度递增
                const postZ = run1BottomZ - t * (firstRunLen - stepD / 2);
                const stepIdx = Math.min(halfStepCount - 1, Math.floor(t * halfStepCount));
                const postY = y + actualHalfStepH * (stepIdx + 1) + 0.45;
                addPart(`post_a_${i}`, rail1X, postY, postZ, 0.06, 0.9, 0.06, trimMat, true);
                if (pzPrev !== null) {
                    const zMid = (pzPrev + postZ) / 2;
                    const yMid = (pyPrev + postY) / 2;
                    const seg = Math.abs(postZ - pzPrev) - 0.08;
                    if (seg > 0.1) {
                        addPart(`rail_a_lo_${i - 1}`, rail1X, yMid + 0.22, zMid, 0.05, 0.07, seg, trimMat, false);
                        addPart(`rail_a_hi_${i - 1}`, rail1X, yMid + 0.52, zMid, 0.05, 0.08, seg, trimMat, false);
                    }
                }
                pzPrev = postZ; pyPrev = postY;
            }
            const rail2Z = run2Z + stairW / 2 + 0.04;
            let pxPrev = null, pyPrev2 = null;
            for (let i = 0; i < postCount; i++) {
                const t = i / (postCount - 1);
                const postX = run2StartX + t * (secondRunLen - stepD / 2);
                const stepIdx = Math.min(halfStepCount - 1, Math.floor(t * halfStepCount));
                const postY = y + halfH + actualHalfStepH * (stepIdx + 1) + 0.45;
                addPart(`post_b_${i}`, postX, postY, rail2Z, 0.06, 0.9, 0.06, trimMat, true);
                if (pxPrev !== null) {
                    const xMid = (pxPrev + postX) / 2;
                    const yMid = (pyPrev2 + postY) / 2;
                    const seg = Math.abs(postX - pxPrev) - 0.08;
                    if (seg > 0.1) {
                        addPart(`rail_b_lo_${i - 1}`, xMid, yMid + 0.22, rail2Z, seg, 0.07, 0.05, trimMat, false);
                        addPart(`rail_b_hi_${i - 1}`, xMid, yMid + 0.52, rail2Z, seg, 0.08, 0.05, trimMat, false);
                    }
                }
                pxPrev = postX; pyPrev2 = postY;
            }

            // === 二楼洞口护栏 ===
            // 第一段洞口 +X 边
            addPart('floor2_hole_rail_x1', innerMinX + stairW + 0.04, y + floor2Y + railH / 2,
                (run1TopZ + run1BottomZ) / 2, 0.06, railH, Math.max(0.5, run1BottomZ - run1TopZ), trimMat, true);
            // 第二段洞口 +Z 边
            addPart('floor2_hole_rail_z2', (run2StartX + run2EndX) / 2, y + floor2Y + railH / 2,
                run2HoleMaxZ + 0.03, Math.max(0.5, run2EndX - run2StartX), railH, 0.06, trimMat, true);
            // 洞口外角立柱
            addPart('floor2_hole_post', run2HoleMaxX + 0.02, y + floor2Y + railH / 2, run2HoleMaxZ + 0.02,
                0.08, railH, 0.08, trimMat, true);

            // === 二楼四面墙开窗（在一楼墙顶之上到屋顶）===
            const f2WallH = Math.max(2.2, height - floor2Y);
            const f2BaseY = y + floor2Y;
            const sillH2 = 0.55;
            const openingH2 = Math.min(1.25, Math.max(1.0, f2WallH * 0.48));
            const lintelY2 = sillH2 + openingH2;
            const topH2 = Math.max(0.35, f2WallH - lintelY2);
            const windowW2 = Math.min(Math.max(1.5, innerWidth * 0.38), 2.6);
            const windowD2 = Math.min(Math.max(1.4, innerDepth * 0.34), 2.4);
            const wallSpanX = Math.min(width, innerWidth) - 0.1;
            const wallSpanZ = Math.min(depth, innerDepth) - 0.1;

            // 前后墙二楼窗
            for (const wallInfo of [
                { suffix: 'front', wz: z + depth / 2 - wallThickness / 2 },
                { suffix: 'back', wz: z - depth / 2 + wallThickness / 2 },
            ]) {
                const wz = wallInfo.wz;
                const sideW = Math.max(0.25, (wallSpanX - windowW2) / 2);
                // 窗台下
                addPart(`f2_${wallInfo.suffix}_sill`, x, f2BaseY + sillH2 / 2, wz, wallSpanX, sillH2, wallThickness * 0.95, wallMat, true);
                // 左右侧
                addPart(`f2_${wallInfo.suffix}_side_l`, x - windowW2 / 2 - sideW / 2, f2BaseY + sillH2 + openingH2 / 2, wz, sideW, openingH2, wallThickness * 0.95, wallMat, true);
                addPart(`f2_${wallInfo.suffix}_side_r`, x + windowW2 / 2 + sideW / 2, f2BaseY + sillH2 + openingH2 / 2, wz, sideW, openingH2, wallThickness * 0.95, wallMat, true);
                // 门楣上
                addPart(`f2_${wallInfo.suffix}_upper`, x, f2BaseY + lintelY2 + topH2 / 2, wz, wallSpanX, topH2, wallThickness * 0.95, wallMat, true);
                // 玻璃 + 框
                const pane = addPart(`f2_${wallInfo.suffix}_glass`, x, f2BaseY + sillH2 + openingH2 / 2, wz, windowW2 * 0.94, openingH2 * 0.92, 0.03, glassMat, false);
                markGlass(pane);
                addPart(`f2_${wallInfo.suffix}_frame_low`, x, f2BaseY + sillH2 + 0.02, wz, windowW2 + 0.16, 0.06, wallThickness * 0.7, trimMat, false);
                addPart(`f2_${wallInfo.suffix}_frame_high`, x, f2BaseY + lintelY2 - 0.02, wz, windowW2 + 0.16, 0.06, wallThickness * 0.7, trimMat, false);
                addPart(`f2_${wallInfo.suffix}_frame_l`, x - windowW2 / 2 - 0.05, f2BaseY + sillH2 + openingH2 / 2, wz, 0.08, openingH2, wallThickness * 0.7, trimMat, false);
                addPart(`f2_${wallInfo.suffix}_frame_r`, x + windowW2 / 2 + 0.05, f2BaseY + sillH2 + openingH2 / 2, wz, 0.08, openingH2, wallThickness * 0.7, trimMat, false);
            }

            // 左右墙二楼窗
            for (const wallInfo of [
                { suffix: 'left', wx: x - width / 2 + wallThickness / 2 },
                { suffix: 'right', wx: x + width / 2 - wallThickness / 2 },
            ]) {
                const wx = wallInfo.wx;
                const sideD = Math.max(0.25, (wallSpanZ - windowD2) / 2);
                addPart(`f2_${wallInfo.suffix}_sill`, wx, f2BaseY + sillH2 / 2, z, wallThickness * 0.95, sillH2, wallSpanZ, wallMat, true);
                addPart(`f2_${wallInfo.suffix}_side_b`, wx, f2BaseY + sillH2 + openingH2 / 2, z - windowD2 / 2 - sideD / 2, wallThickness * 0.95, openingH2, sideD, wallMat, true);
                addPart(`f2_${wallInfo.suffix}_side_f`, wx, f2BaseY + sillH2 + openingH2 / 2, z + windowD2 / 2 + sideD / 2, wallThickness * 0.95, openingH2, sideD, wallMat, true);
                addPart(`f2_${wallInfo.suffix}_upper`, wx, f2BaseY + lintelY2 + topH2 / 2, z, wallThickness * 0.95, topH2, wallSpanZ, wallMat, true);
                const pane = addPart(`f2_${wallInfo.suffix}_glass`, wx, f2BaseY + sillH2 + openingH2 / 2, z, 0.03, openingH2 * 0.92, windowD2 * 0.94, glassMat, false);
                markGlass(pane);
                addPart(`f2_${wallInfo.suffix}_frame_low`, wx, f2BaseY + sillH2 + 0.02, z, wallThickness * 0.7, 0.06, windowD2 + 0.16, trimMat, false);
                addPart(`f2_${wallInfo.suffix}_frame_high`, wx, f2BaseY + lintelY2 - 0.02, z, wallThickness * 0.7, 0.06, windowD2 + 0.16, trimMat, false);
            }

            // === 二楼家具（放在主地板区域，避开 L 形洞口）===
            const f2y = y + floor2Y + 0.09;
            const furnCenterX = (holeMaxX + innerMaxX) / 2;
            const furnCenterZ = (holeMaxZ + innerMaxZ) / 2;
            addPart('f2_bed', furnCenterX - 1.8, f2y + 0.35, furnCenterZ + 1.2, 1.4, 0.7, 2.0, trimMat, true);
            addPart('f2_desk', furnCenterX + 1.8, f2y + 0.38, furnCenterZ - 0.8, 1.8, 0.76, 0.9, trimMat, true);
            addPart('f2_desk_top', furnCenterX + 1.8, f2y + 0.76, furnCenterZ - 0.8, 1.85, 0.06, 0.95, trimMat, false);
            addPart('f2_sofa', furnCenterX + 1.8, f2y + 0.35, furnCenterZ + 1.0, 1.8, 0.7, 0.7, trimMat, true);
            addPart('f2_shelf', furnCenterX - 1.8, f2y + 0.75, furnCenterZ - 0.8, 1.0, 1.5, 0.4, trimMat, true);
            addPart('f2_crate', furnCenterX, f2y + 0.45, furnCenterZ, 0.9, 0.9, 0.9, trimMat, true);
        }



        // 屋顶
        const roofGeo = new THREE.BoxGeometry(width + 0.4, 0.3, depth + 0.4);
        const roofMat = createProceduralMaterial('concrete', {
            baseColor: 0x4a4a3a,
            accentColor: 0x29291f,
            detailColor: 0x777257,
            size: 256,
            repeatX: Math.max(1, Math.ceil(width / 4)),
            repeatY: Math.max(1, Math.ceil(depth / 4)),
            anisotropy: 8,
        }, { roughness: 0.98, bumpScale: 0.04 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, height + 0.15, 0);
        roof.castShadow = false;
        roof.receiveShadow = false;
        roof.userData.buildingPart = 'roof';
        roof.userData.structure = 'building';
        group.add(roof);
        this.addCollisionBox(x, y + height, z, width + 0.4, 0.3, depth + 0.4, roof);

        // 建筑外观变体（确定性哈希，重建时稳定）：坡屋顶 / 烟囱 / 屋檐
        const variantSeed = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
        if (variantSeed < 0.45 && width <= 14) {
            // 双坡屋顶：两块斜板 + 山墙封板
            const ridgeH = Math.min(2.2, width * 0.22);
            const slopeLen = Math.sqrt((width / 2 + 0.3) ** 2 + ridgeH * ridgeH);
            const pitch = Math.atan2(ridgeH, width / 2 + 0.3);
            const pitchMat = createProceduralMaterial('wood', {
                baseColor: variantSeed < 0.22 ? 0x5a3a2c : 0x46433a,
                accentColor: 0x241a12, detailColor: 0x7a6248,
                size: 128, repeatX: 3, repeatY: 2, anisotropy: 4,
            }, { roughness: 0.95 });
            for (const side of [-1, 1]) {
                const slope = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.16, depth + 0.6), pitchMat);
                slope.position.set(side * (width / 4 + 0.08), height + 0.3 + ridgeH / 2, 0);
                slope.rotation.z = side * pitch;
                slope.userData.buildingPart = 'roof_pitch';
                slope.userData.structure = 'building';
                group.add(slope);
                this.meshes.push(slope);
            }
            const gableMat = wallMat;
            for (const gz of [-1, 1]) {
                const gable = new THREE.Mesh(new THREE.CylinderGeometry(0, width / 2 * 0.98, ridgeH, 4, 1), gableMat);
                gable.scale.z = 0.06;
                gable.rotation.y = Math.PI / 4;
                gable.position.set(0, height + 0.3 + ridgeH / 2, gz * (depth / 2 - 0.15));
                gable.userData.buildingPart = 'roof_gable';
                group.add(gable);
                this.meshes.push(gable);
            }
        }
        if (variantSeed > 0.3) {
            // 烟囱
            const chimney = new THREE.Mesh(
                new THREE.BoxGeometry(0.7, 1.6, 0.7),
                createProceduralMaterial('concrete', {
                    baseColor: 0x6a5548, accentColor: 0x3a2d24, detailColor: 0x8f7a66,
                    size: 64, repeatX: 1, repeatY: 2, anisotropy: 2,
                }, { roughness: 0.95 })
            );
            chimney.position.set(width * 0.28, height + 1.0, -depth * 0.22);
            chimney.userData.buildingPart = 'chimney';
            group.add(chimney);
            this.meshes.push(chimney);
        }
        // 屋檐（四周出挑的窄沿）
        const eave = new THREE.Mesh(new THREE.BoxGeometry(width + 0.9, 0.12, depth + 0.9), roofMat);
        eave.position.set(0, height + 0.02, 0);
        eave.userData.buildingPart = 'eave';
        group.add(eave);
        this.meshes.push(eave);

        // === 外墙焦痕贴片（视觉战损，collidable=false 不参与碰撞/寻路）===
        this._deployDamageDecals(group, x, z, width, depth, height, variantSeed);

        // 远处隐藏室内家具、楼梯细节、窗框与护栏，碰撞盒仍保留。
        // 这些小 Mesh 数量很多，是二楼建筑加入后 draw call 上升的主要来源。
        const detailMeshes = [];
        const detailPrefixes = [
            'interior_', 'stairs_', 'stair_', 'post_', 'rail_',
            'floor2_hole_', 'f2_bed', 'f2_desk', 'f2_sofa', 'f2_shelf',
            'f2_crate', 'f2_front_frame', 'f2_back_frame',
            'f2_left_frame', 'f2_right_frame'
        ];
        group.traverse(child => {
            if (!child.isMesh) return;
            const part = child.userData?.buildingPart || child.name || '';
            if (detailPrefixes.some(prefix => part.startsWith(prefix))) detailMeshes.push(child);
        });
        if (detailMeshes.length > 0) {
            this._buildingLodEntries.push({ x, z, detailMeshes, detailed: true });
        }

        return group;
    }

    // 在建筑外墙外侧随机贴 1-3 片炮弹焦痕（纯视觉，不影响弹道/寻路）
    _deployDamageDecals(group, bx, bz, width, depth, height, seed) {
        const n = seed < 0.25 ? 1 : (seed < 0.7 ? 2 : 3);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x1a1713,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        // 每个焦痕：墙面作为 +Z 朝向的面片，再用 lookAt 旋转到正确的墙面方向
        const halfW = width / 2, halfD = depth / 2;
        for (let i = 0; i < n; i++) {
            const face = (seed * 7 + i * 3) % 4;
            const u = ((seed * 13 + i * 5) % 100) / 100;          // 沿面偏移 0-1
            const v = 0.35 + ((seed * 11 + i * 7) % 60) / 100;    // 高度 0.35-0.95
            const s = 0.6 + ((seed * 17 + i * 11) % 40) / 100;    // 0.6-1.0 尺寸

            const burnGeo = new THREE.CircleGeometry(s * 0.5, 9);
            const decal = new THREE.Mesh(burnGeo, mat);
            decal.userData.buildingPart = 'scorch';

            // 定焦痕在墙面的坐标与墙外法线方向
            let pos, normal;
            if (face === 0 || face === 2) {
                // px / nx 侧壁
                const dz = (u - 0.5) * depth * 0.7;
                const side = face === 0 ? 1 : -1;
                pos = new THREE.Vector3(side * (halfW + 0.03), v * height, dz);
                normal = new THREE.Vector3(side, 0, 0);
            } else {
                // pz / nz 侧壁
                const dx = (u - 0.5) * width * 0.7;
                const side = face === 1 ? 1 : -1;
                pos = new THREE.Vector3(dx, v * height, side * (halfD + 0.03));
                normal = new THREE.Vector3(0, 0, side);
            }
            decal.position.copy(pos);
            // 面片默认法线 +Z，lookAt 令其朝向墙外法线，再绕自身轴随机转
            const lookTarget = new THREE.Vector3().copy(pos).add(normal);
            decal.lookAt(lookTarget);
            decal.rotateZ(Math.random() * Math.PI);
            // 轻微拉成椭圆焦痕，更自然
            decal.scale.set(1.25, 1.0, 1.0);
            group.add(decal);
            this.meshes.push(decal);
        }
    }

    _getFootprintPlatformHeight(x, z, width, depth, terrain) {
        const samples = [
            [0, 0],
            [-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5],
            [-0.5, 0], [0.5, 0], [0, -0.5], [0, 0.5],
        ];
        let maxY = -Infinity;
        for (const [sx, sz] of samples) {
            const px = x + sx * width;
            const pz = z + sz * depth;
            maxY = Math.max(maxY, terrain.getHeight(px, pz));
        }
        return Number.isFinite(maxY) ? maxY : terrain.getHeight(x, z);
    }

    _createAccessPaths(terrain) {
        const roadColor = 0x343638;
        const yardColor = 0x4b493f;

        this._createGroundPatch(0, 0, 320, 10, terrain, roadColor, 0.78, 0);
        this._createGroundPatch(0, 0, 10, 320, terrain, roadColor, 0.78, 0);
        this._createGroundPatch(0, 0, 260, 9, terrain, roadColor, 0.65, Math.PI / 4);

        for (const p of [
            { x: -95, z: -95, w: 28, d: 24 },
            { x: -45, z: -10, w: 36, d: 26 },
            { x: 0, z: 0, w: 34, d: 30 },
            { x: 45, z: 10, w: 38, d: 28 },
            { x: 95, z: 95, w: 30, d: 24 },
            { x: -112, z: 48, w: 42, d: 30 },
            { x: 112, z: -48, w: 46, d: 32 },
        ]) {
            this._createGroundPatch(p.x, p.z, p.w, p.d, terrain, yardColor, 0.58, 0);
        }

        for (const area of this.buildingFootprints) {
            const cx = (area.minX + area.maxX) / 2;
            const cz = (area.minZ + area.maxZ) / 2;
            const w = area.maxX - area.minX + 5;
            const d = area.maxZ - area.minZ + 5;
            this._createGroundPatch(cx, cz, w, d, terrain, yardColor, 0.48, 0);
        }
    }

    _createGroundPatch(cx, cz, width, depth, terrain, color, opacity = 0.65, rotationY = 0) {
        const segX = Math.max(1, Math.ceil(width / 6));
        const segZ = Math.max(1, Math.ceil(depth / 6));
        const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
        geo.rotateX(-Math.PI / 2);

        const cos = Math.cos(rotationY);
        const sin = Math.sin(rotationY);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const lx = pos.getX(i);
            const lz = pos.getZ(i);
            const wx = cx + lx * cos - lz * sin;
            const wz = cz + lx * sin + lz * cos;
            pos.setXYZ(i, wx, terrain.getHeight(wx, wz) + 0.075, wz);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();

        const patchKind = opacity > 0.7 ? 'road' : 'terrain';
        const mat = createProceduralMaterial(patchKind, {
            baseColor: color,
            accentColor: opacity > 0.7 ? 0x1e2021 : 0x625844,
            detailColor: 0x9a9280,
            size: 256,
            repeatX: Math.max(1, Math.ceil(width / 8)),
            repeatY: Math.max(1, Math.ceil(depth / 8)),
            anisotropy: 8,
        }, {
            color,
            roughness: 0.96,
            bumpScale: 0.02,
            transparent: opacity < 1,
            opacity,
            depthWrite: opacity >= 0.75,
        });
        const patch = new THREE.Mesh(geo, mat);
        patch.name = 'access_path';
        patch.receiveShadow = false;
        this.scene.add(patch);
        return patch;
    }

    _createBattlefieldFlow(terrain) {
        const mainRoad = 0x2f3335;
        const sideRoute = 0x4b473a;
        const helipad = 0x363b3d;

        // 明确三条路线：中线载具路、两条步兵侧翼路。
        this._createGroundPatch(-52, -52, 92, 7, terrain, mainRoad, 0.7, Math.PI / 4);
        this._createGroundPatch(52, 52, 92, 7, terrain, mainRoad, 0.7, Math.PI / 4);
        this._createGroundPatch(-48, 30, 96, 5.5, terrain, sideRoute, 0.55, -Math.PI / 5);
        this._createGroundPatch(48, -30, 96, 5.5, terrain, sideRoute, 0.55, -Math.PI / 5);
        this._createGroundPatch(-98, -98, 36, 24, terrain, sideRoute, 0.5, 0);
        this._createGroundPatch(98, 98, 36, 24, terrain, sideRoute, 0.5, 0);
        this._createGroundPatch(-82, -66, 18, 18, terrain, helipad, 0.55, 0);
        this._createGroundPatch(82, 66, 18, 18, terrain, helipad, 0.55, 0);

        this._createCapturePointCover(terrain);
        this._createVehicleLaneBarriers(terrain);
        this._createSpawnAreaCover(terrain);
        this._createMapLandmarks(terrain);
    }

    _createBattlefieldSetPieces(terrain) {
        const clusters = [
            { x: -76, z: -30, teamColor: 0x58725c, rot: 0.3 },
            { x: 76, z: 30, teamColor: 0x725858, rot: -0.3 },
            { x: -18, z: 58, teamColor: 0x5d6658, rot: 1.15 },
            { x: 18, z: -58, teamColor: 0x665d58, rot: -1.15 },
            { x: -58, z: 58, teamColor: 0x5a645f, rot: 0.75 },
            { x: 58, z: -58, teamColor: 0x645a5f, rot: -0.75 },
        ];

        for (const c of clusters) {
            const y = terrain.getHeight(c.x, c.z);
            this._createCoverBlock(c.x, c.z, 5.5, 1.15, 2.2, terrain, c.teamColor, c.rot, 'field_command_cover');
            this._createCoverBlock(c.x + Math.cos(c.rot) * 4.5, c.z + Math.sin(c.rot) * 4.5, 3.2, 0.85, 1.1, terrain, c.teamColor, c.rot, 'field_supply_cover');

            for (let i = -2; i <= 2; i++) {
                const ox = Math.cos(c.rot) * i * 1.4;
                const oz = Math.sin(c.rot) * i * 1.4;
                this._createCoverBlock(c.x + ox, c.z + oz, 1.2, 0.55, 0.55, terrain, 0x7a6a4a, c.rot, 'field_sandbag');
            }

            for (let i = 0; i < 3; i++) {
                const px = c.x + Math.cos(c.rot + Math.PI / 2) * (i * 0.9 - 0.9);
                const pz = c.z + Math.sin(c.rot + Math.PI / 2) * (i * 0.9 - 0.9);
                const box = new THREE.Mesh(
                    new THREE.BoxGeometry(0.95, 0.8, 0.85),
                    new THREE.MeshStandardMaterial({ color: 0x6b5a34, roughness: 0.9 })
                );
                box.position.set(px, y + 0.4, pz);
                box.rotation.y = c.rot;
                this.scene.add(box);
                this.addCollisionBox(px, y, pz, 0.95, 0.8, 0.85, box, c.rot);
            }

            const mast = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.16, 8.5, 8),
                new THREE.MeshStandardMaterial({ color: 0x4e5660, roughness: 0.7, metalness: 0.35 })
            );
            mast.position.set(c.x + 2.4, y + 4.25, c.z - 1.8);
            this.scene.add(mast);
            this.addCollisionBox(c.x + 2.4, y, c.z - 1.8, 0.35, 8.5, 0.35, mast);

            const dish = new THREE.Mesh(
                new THREE.SphereGeometry(0.85, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0x8ca1a8, roughness: 0.45, metalness: 0.35 })
            );
            dish.scale.set(1.3, 0.35, 0.9);
            dish.position.set(c.x + 2.9, y + 6.2, c.z - 1.6);
            dish.rotation.z = Math.PI / 8;
            this.scene.add(dish);

            const crater = new THREE.Mesh(
                new THREE.CircleGeometry(2.6 + Math.random() * 1.1, 18),
                new THREE.MeshBasicMaterial({ color: 0x221d16, transparent: true, opacity: 0.55 })
            );
            crater.rotation.x = -Math.PI / 2;
            crater.position.set(c.x - 2.2, y + 0.04, c.z + 2.0);
            this.scene.add(crater);

            const debris = new THREE.Mesh(
                new THREE.BoxGeometry(1.4, 0.28, 0.9),
                new THREE.MeshStandardMaterial({ color: 0x4b4539, roughness: 1.0 })
            );
            debris.position.set(c.x - 1.2, y + 0.14, c.z + 0.9);
            debris.rotation.y = c.rot * 0.8;
            this.scene.add(debris);
        }

        for (const p of [
            { x: -32, z: 0, rot: 0.2 },
            { x: 32, z: 0, rot: -0.2 },
            { x: 0, z: 32, rot: 1.55 },
            { x: 0, z: -32, rot: -1.55 },
        ]) {
            const y = terrain.getHeight(p.x, p.z);
            this._createCoverBlock(p.x, p.z, 2.8, 0.9, 1.1, terrain, 0x6c6652, p.rot, 'roadside_crate');
            const barrel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.42, 0.42, 0.9, 10),
                new THREE.MeshStandardMaterial({ color: 0x2f3940, roughness: 0.85, metalness: 0.15 })
            );
            barrel.position.set(p.x + 1.2, y + 0.45, p.z + 0.4);
            this.scene.add(barrel);
            this.addCollisionBox(p.x + 1.2, y, p.z + 0.4, 0.84, 0.9, 0.84, barrel, 0);
        }
    }

    _createCoverBlock(x, z, width, height, depth, terrain, color = 0x6c6755, rotationY = 0, name = 'cover') {
        if (this._shouldSkipPropForBuildingAccess(x, z, Math.max(width, depth) * 0.35)) return null;
        const ground = this._getLinearPropGround(terrain, x, z, width, depth, rotationY);
        // 坡差太大就放弃，避免巨型穿模墙
        if (ground.spread > 2.8) return null;
        const y = ground.y;
        const totalH = height + ground.skirt;
        let kind = 'concrete';
        if (name.includes('sandbag')) kind = 'fabric';
        else if (name.includes('crate')) kind = 'wood';
        else if (name.includes('barrier')) kind = 'concrete';
        else if (name.includes('tank')) kind = 'metal';
        const mat = createProceduralMaterial(kind, {
            baseColor: color,
            accentColor: color === 0x808080 ? 0x4f4f4f : 0x2d2d2d,
            detailColor: 0xbdb7a3,
            size: 192,
            repeatX: Math.max(1, Math.ceil(width / 2)),
            repeatY: Math.max(1, Math.ceil(totalH / 2)),
            anisotropy: 8,
        }, { roughness: 0.92, bumpScale: 0.04 });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, totalH, depth), mat);
        mesh.name = name;
        mesh.position.set(x, y + totalH / 2, z);
        mesh.rotation.y = rotationY;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        this.scene.add(mesh);
        this.addCollisionBox(x, y, z, width, totalH, depth, mesh, rotationY);
        return mesh;
    }

    _createCapturePointCover(terrain) {
        const points = this.mapConfig?.capturePoints || [];
        if (!points.length) return;

        const density = this.mapConfig?.environment?.captureDetailDensity ?? 1;
        if (density <= 0) return;
        const coverBudget = THREE.MathUtils.clamp(Math.round(density * 4), 2, 5);
        const palette = {
            default: [0x5f6f58, 0x7a6a4a, 0x62665f],
            ardennes: [0x5d6658, 0x6c6755, 0x70756c],
            normandy: [0x777267, 0x6c6755, 0x5d625f],
            iwojima: [0x57524b, 0x66615a, 0x4f5553],
        }[this.mapConfig?.id] || [0x6c6755];
        const random = this._createSeededRandom(17);
        const angleDistance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

        for (let index = 0; index < points.length; index++) {
            const point = points[index];
            const neighbours = [];
            if (points[index - 1]) neighbours.push(points[index - 1]);
            if (points[index + 1]) neighbours.push(points[index + 1]);
            const openAngles = neighbours.map(other => Math.atan2(other.z - point.z, other.x - point.x));
            if (openAngles.length === 1) openAngles.push(openAngles[0] + Math.PI);

            const radius = (point.radius || 12) + 2.4;
            const phase = random() * Math.PI * 0.3;
            let placed = 0;
            for (let step = 0; step < 12 && placed < coverBudget; step++) {
                const angle = phase + step / 12 * Math.PI * 2;
                if (openAngles.some(open => angleDistance(angle, open) < 0.48)) continue;
                const x = point.x + Math.cos(angle) * radius;
                const z = point.z + Math.sin(angle) * radius;
                if (this._isNearSpawnOrVehicle(x, z, 5.5)) continue;
                if (!this._canPlaceProp(terrain, x, z, { maxSlope: 0.48, avoidBuildingPad: 1.4 })) continue;
                const y = terrain.getHeight(x, z);
                const rotation = angle + Math.PI / 2;
                if (this.hasFootprintOverlap(x, z, 4.2, 0.75, rotation, y, 1.05, 0.25)) continue;
                this._createCoverBlock(
                    x, z, 4.2, 1.05, 0.75, terrain,
                    palette[index % palette.length], rotation, 'capture_cover'
                );
                placed++;
            }

            this._createGroundPatch(
                point.x, point.z,
                Math.max(8, (point.radius || 12) * 1.25),
                Math.max(8, (point.radius || 12) * 1.25),
                terrain,
                this.mapConfig?.id === 'iwojima' ? 0x3f3a34 : 0x555348,
                0.22,
                phase
            );
        }
    }

    _createVehicleLaneBarriers(terrain) {
        const barrierColor = 0x65655e;
        const lanePieces = [
            { x: -74, z: -48, rot: Math.PI / 4 }, { x: -55, z: -34, rot: Math.PI / 4 },
            { x: -32, z: -20, rot: Math.PI / 4 }, { x: 32, z: 20, rot: Math.PI / 4 },
            { x: 55, z: 34, rot: Math.PI / 4 }, { x: 74, z: 48, rot: Math.PI / 4 },
            { x: -74, z: -64, rot: Math.PI / 4 }, { x: -52, z: -46, rot: Math.PI / 4 },
            { x: 52, z: 46, rot: Math.PI / 4 }, { x: 74, z: 64, rot: Math.PI / 4 },
        ];
        for (const p of lanePieces) {
            this._createCoverBlock(p.x, p.z, 5.5, 1.15, 0.8, terrain, barrierColor, p.rot, 'vehicle_lane_barrier');
        }
    }

    _createSpawnAreaCover(terrain) {
        const friendly = 0x536854;
        const enemy = 0x6b4f4f;
        for (const p of [
            { x: -124, z: -118, rot: 0, color: friendly },
            { x: -110, z: -132, rot: Math.PI / 2, color: friendly },
            { x: -92, z: -86, rot: Math.PI / 4, color: friendly },
            { x: 124, z: 118, rot: 0, color: enemy },
            { x: 110, z: 132, rot: Math.PI / 2, color: enemy },
            { x: 92, z: 86, rot: Math.PI / 4, color: enemy },
        ]) {
            this._createCoverBlock(p.x, p.z, 7, 1.4, 0.9, terrain, p.color, p.rot, 'spawn_cover');
        }
    }

    _createFlatStripe(x, z, width, depth, terrain, color, rotationY = 0, name = 'marking') {
        const y = terrain.getHeight(x, z);
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.035, depth),
            new THREE.MeshBasicMaterial({ color })
        );
        mesh.name = name;
        mesh.position.set(x, y + 0.105, z);
        mesh.rotation.y = rotationY;
        mesh.receiveShadow = false;
        this.scene.add(mesh);
        return mesh;
    }

    _createMapLandmarks(terrain) {
        for (const p of [
            { x: -82, z: -66, teamColor: 0x6fa5ff },
            { x: 82, z: 66, teamColor: 0xff7766 },
        ]) {
            this._createFlatStripe(p.x - 3.1, p.z, 0.65, 8.2, terrain, 0xd8d8d0, 0, 'helipad_mark');
            this._createFlatStripe(p.x + 3.1, p.z, 0.65, 8.2, terrain, 0xd8d8d0, 0, 'helipad_mark');
            this._createFlatStripe(p.x, p.z, 5.8, 0.65, terrain, 0xd8d8d0, 0, 'helipad_mark');
            this._createFlatStripe(p.x, p.z - 6.2, 8.5, 0.35, terrain, p.teamColor, 0, 'helipad_team_mark');
            this._createFlatStripe(p.x, p.z + 6.2, 8.5, 0.35, terrain, p.teamColor, 0, 'helipad_team_mark');

            const y = terrain.getHeight(p.x, p.z);
            const tower = new THREE.Mesh(
                new THREE.CylinderGeometry(0.14, 0.22, 8.5, 6),
                new THREE.MeshStandardMaterial({ color: 0x47505a, roughness: 0.7, metalness: 0.3 })
            );
            tower.position.set(p.x + 5.5, y + 4.25, p.z - 5.2);
            this.scene.add(tower);
            this.addCollisionBox(p.x + 5.5, y, p.z - 5.2, 0.4, 8.5, 0.4, tower);

            const beacon = new THREE.Mesh(
                new THREE.SphereGeometry(0.28, 10, 8),
                new THREE.MeshBasicMaterial({ color: p.teamColor, transparent: true, opacity: 0.85 })
            );
            beacon.position.set(p.x + 5.5, y + 8.9, p.z - 5.2);
            this.scene.add(beacon);

            for (const [lx, lz] of [
                [p.x - 4.5, p.z - 4.5],
                [p.x - 4.5, p.z + 4.5],
                [p.x + 4.5, p.z - 4.5],
                [p.x + 4.5, p.z + 4.5],
            ]) {
                const ly = terrain.getHeight(lx, lz);
                const pole = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.06, 1.6, 6),
                    new THREE.MeshStandardMaterial({ color: 0x606060, roughness: 0.6, metalness: 0.3 })
                );
                pole.position.set(lx, ly + 0.8, lz);
                this.scene.add(pole);
                const lamp = new THREE.Mesh(
                    new THREE.BoxGeometry(0.12, 0.12, 0.12),
                    new THREE.MeshBasicMaterial({ color: p.teamColor })
                );
                lamp.position.set(lx, ly + 1.65, lz);
                this.scene.add(lamp);
            }
        }

        this._createCommsMast(-6, 6, terrain);
        this._createRouteSign(-64, -30, terrain, 'B', 0x7a6a4a);
        this._createRouteSign(30, -42, terrain, 'D', 0x5d5f58);
        this._createRouteSign(-32, 42, terrain, 'C', 0x6c6755);
        this._createRouteSign(64, 30, terrain, 'E', 0x6f5555);

        for (const p of [
            { x: -138, z: -104, rot: Math.PI / 4, color: 0x5f8cff },
            { x: -102, z: -138, rot: Math.PI / 4, color: 0x5f8cff },
            { x: 138, z: 104, rot: Math.PI / 4, color: 0xff6f5f },
            { x: 102, z: 138, rot: Math.PI / 4, color: 0xff6f5f },
        ]) {
            this._createCheckpointGate(p.x, p.z, terrain, p.rot, p.color);
        }

        for (const p of [
            { x: 94, z: -56, color: 0x72804d },
            { x: -94, z: 56, color: 0x7c644d },
        ]) {
            const y = terrain.getHeight(p.x, p.z);
            const stack = new THREE.Mesh(
                new THREE.CylinderGeometry(0.35, 0.45, 6.5, 8),
                new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.85, metalness: 0.1 })
            );
            stack.position.set(p.x - 4.5, y + 3.25, p.z + 4.2);
            this.scene.add(stack);
            this.addCollisionBox(p.x - 4.5, y, p.z + 4.2, 0.9, 6.5, 0.9, stack);

            const pipe = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, 8.2, 8),
                new THREE.MeshStandardMaterial({ color: 0x56606a, roughness: 0.75, metalness: 0.35 })
            );
            pipe.rotation.z = Math.PI / 2;
            pipe.position.set(p.x + 6.5, y + 3.8, p.z - 1.3);
            this.scene.add(pipe);
        }
    }

    _createCommsMast(x, z, terrain) {
        const y = terrain.getHeight(x, z);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x50555a, metalness: 0.6, roughness: 0.35 });
        const redMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x4a4a42, roughness: 0.85 });

        const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 2.4), baseMat);
        base.name = 'comms_mast_base';
        base.position.set(x, y + 0.4, z);
        this.scene.add(base);
        this.addCollisionBox(x, y, z, 2.4, 0.8, 2.4, base);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 11, 8), poleMat);
        pole.name = 'comms_mast';
        pole.position.set(x, y + 6.3, z);
        this.scene.add(pole);

        const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 1.0, 0.12, 16), poleMat);
        dish.name = 'comms_dish';
        dish.position.set(x + 0.8, y + 8.4, z);
        dish.rotation.z = Math.PI / 2;
        dish.rotation.y = Math.PI / 6;
        this.scene.add(dish);

        const light = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), redMat);
        light.name = 'comms_warning_light';
        light.position.set(x, y + 12, z);
        this.scene.add(light);
    }

    _createRouteSign(x, z, terrain, label, color) {
        const y = terrain.getHeight(x, z);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x454545, roughness: 0.8 });
        const signMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
        const textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6), postMat);
        post.position.set(x, y + 0.9, z);
        this.scene.add(post);

        const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 0.08), signMat);
        board.position.set(x, y + 1.65, z);
        board.rotation.y = Math.PI / 4;
        this.scene.add(board);

        const glyphs = label === 'C'
            ? [[0, 0, 0.42, 0.08], [-0.18, 0, 0.08, 0.42], [0, 0.34, 0.42, 0.08], [0, -0.34, 0.42, 0.08]]
            : [[0, 0, 0.42, 0.08], [0, 0.26, 0.42, 0.08], [0, -0.26, 0.42, 0.08]];
        for (const g of glyphs) {
            const mark = new THREE.Mesh(new THREE.BoxGeometry(g[2], g[3], 0.03), textMat);
            mark.position.set(x + g[0], y + 1.65 + g[1], z - 0.06);
            mark.rotation.y = Math.PI / 4;
            this.scene.add(mark);
        }
    }

    _createCheckpointGate(x, z, terrain, rotationY, color) {
        const y = terrain.getHeight(x, z);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x2f3131, roughness: 0.9 });

        const left = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.6, 0.45), dark);
        const right = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.6, 0.45), dark);
        const offset = new THREE.Vector3(0, 0, 2.7).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        left.position.set(x + offset.x, y + 1.3, z + offset.z);
        right.position.set(x - offset.x, y + 1.3, z - offset.z);
        this.scene.add(left);
        this.scene.add(right);

        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 5.8), mat);
        beam.position.set(x, y + 2.55, z);
        beam.rotation.y = rotationY;
        this.scene.add(beam);
    }

    _registerBuildingDoorZone(x, z, width) {
        this.buildingDoorZones.push({
            x,
            z,
            radius: Math.max(2.2, width * 0.75),
        });
    }

    _isInsideBuildingFootprint(x, z, padding = 0) {
        for (const area of this.buildingFootprints) {
            if (x >= area.minX - padding && x <= area.maxX + padding &&
                z >= area.minZ - padding && z <= area.maxZ + padding) {
                return true;
            }
        }
        return false;
    }

    _isNearBuildingDoor(x, z, padding = 0) {
        for (const door of this.buildingDoorZones) {
            const dx = x - door.x;
            const dz = z - door.z;
            const radius = door.radius + padding;
            if (dx * dx + dz * dz <= radius * radius) return true;
        }
        return false;
    }

    _shouldSkipPropForBuildingAccess(x, z, padding = 0.6) {
        return this._isInsideBuildingFootprint(x, z, padding) ||
               this._isNearBuildingDoor(x, z, padding);
    }

    _createBuildings(terrain) {
        // A 联合前哨（西南）
        this._createBuilding(-105, -90, 14, 11, 7, terrain, 0x7a8a7a);
        this._createBuilding(-88, -108, 11, 13, 6, terrain, 0x6a7a6a);

        // B 西侧补给站
        this._createBuilding(-55, -5, 15, 11, 7, terrain, 0x8a7a5a);
        this._createBuilding(-38, -18, 11, 11, 6, terrain, 0x7a6a4a);
        this._createBuilding(-52, 8, 9, 9, 5, terrain, 0x9a8a6a);

        // C 中央枢纽
        this._createBuilding(12, 8, 12, 11, 7, terrain, 0x8a7a6a);
        this._createBuilding(-12, -8, 11, 11, 7, terrain, 0x7a6a5a);
        this._createBuilding(18, -14, 9, 9, 5, terrain, 0x9a8a7a);
        this._createBuilding(-18, 14, 9, 9, 5, terrain, 0x8a9a7a);

        // D 东侧工业区
        this._createBuilding(55, 5, 17, 12, 8, terrain, 0x6a6a6a);
        this._createBuilding(40, 20, 11, 13, 6, terrain, 0x5a5a5a);
        this._createBuilding(62, -8, 13, 11, 7, terrain, 0x707060);

        // E 敌方要塞（东北）
        this._createBuilding(105, 90, 14, 11, 7, terrain, 0x8a6a6a);
        this._createBuilding(88, 108, 11, 13, 6, terrain, 0x7a5a5a);

        // 侧翼仓库（大平层）
        this._createBuilding(90, -40, 16, 18, 7, terrain, 0x5a5a5a);
        this._createBuilding(-90, 40, 16, 18, 7, terrain, 0x5a5a5a);

        // 前沿哨所
        this._createBuilding(-72, -42, 12, 10, 6, terrain, 0x6f705f);
        this._createBuilding(72, 42, 12, 10, 6, terrain, 0x705f5f);
        this._createBuilding(-66, 54, 11, 14, 7, terrain, 0x646c5a);
        this._createBuilding(66, -54, 11, 14, 7, terrain, 0x66615a);

        // 中线废弃岗楼
        this._createBuilding(-28, 28, 10, 10, 6, terrain, 0x80725c);
        this._createBuilding(28, -28, 10, 10, 6, terrain, 0x7a7564);

        this._createBuilding(-118, 56, 12, 11, 6, terrain, 0x6c7b78);
        this._createBuilding(-101, 42, 10, 11, 6, terrain, 0x66706a);
        this._createBuilding(-126, 34, 11, 9, 5, terrain, 0x747268);
        this._createBuilding(118, -56, 13, 11, 6, terrain, 0x756b5f);
        this._createBuilding(101, -42, 11, 13, 6, terrain, 0x6d665d);
        this._createBuilding(126, -34, 10, 10, 5, terrain, 0x80715e);
    }

    _createWalls(terrain) {
        const wallMat = createProceduralMaterial('concrete', {
            baseColor: 0x5a5a4a,
            accentColor: 0x33332c,
            detailColor: 0x8a8572,
            size: 256,
            repeatX: 4,
            repeatY: 1,
            anisotropy: 8,
        }, { roughness: 0.96, bumpScale: 0.045 });

        // 围墙段
        const wallSegments = [
            { x: 40, z: 0, w: 20, d: 1, h: 3 },
            { x: -40, z: 0, w: 20, d: 1, h: 3 },
            { x: 0, z: 40, w: 1, d: 20, h: 3 },
            { x: 0, z: -40, w: 1, d: 20, h: 3 },
            { x: 70, z: 70, w: 25, d: 1, h: 3 },
            { x: -70, z: -70, w: 25, d: 1, h: 3 },
        ];

        for (const seg of wallSegments) {
            const ground = this._getLinearPropGround(terrain, seg.x, seg.z, seg.w, seg.d, 0);
            if (ground.spread > 3.5) continue; // 太陡不放墙，避免穿山
            const y = ground.y;
            const totalH = seg.h + ground.skirt;
            const geo = new THREE.BoxGeometry(seg.w, totalH, seg.d);
            const wall = new THREE.Mesh(geo, wallMat);
            wall.position.set(seg.x, y + totalH / 2, seg.z);
            wall.castShadow = false;
            wall.receiveShadow = false;
            wall.userData.destructibleType = 'wall';  // 可破坏：炮击/爆炸可摧毁围墙
            this.scene.add(wall);
            this.addCollisionBox(seg.x, y, seg.z, seg.w, totalH, seg.d, wall);
        }
    }

    _createSandbags(terrain) {
        const bagMat = createProceduralMaterial('fabric', {
            baseColor: 0x7a6a4a,
            accentColor: 0x4a3e2b,
            detailColor: 0xb9aa83,
            size: 192,
            repeatX: 2,
            repeatY: 1,
            anisotropy: 6,
        }, { roughness: 0.98, bumpScale: 0.035 });

        // 掩体位置
        const positions = [
            [20, 10], [-20, -10], [10, -20], [-10, 20],
            [50, 0], [-50, 0], [0, 50], [0, -50],
            [35, 35], [-35, -35], [35, -35], [-35, 35],
        ];

        for (const [x, z] of positions) {
            if (this._shouldSkipPropForBuildingAccess(x, z, 2.2)) continue;
            // 半圆形沙袋掩体：每个沙袋独立贴 mesh 高度，避免坡地一端悬空
            for (let i = 0; i < 5; i++) {
                const angle = (i / 4 - 0.5) * Math.PI;
                const bx = x + Math.cos(angle) * 1.5;
                const bz = z + Math.sin(angle) * 1.5;
                const by = this._groundY(terrain, bx, bz);
                const geo = new THREE.BoxGeometry(1.0, 0.5, 0.6);
                const bag = new THREE.Mesh(geo, bagMat);
                bag.position.set(bx, by + 0.22, bz);
                bag.rotation.y = angle;
                bag.castShadow = false;
                bag.receiveShadow = false;
                bag.userData.destructibleType = 'sandbag';
                this.scene.add(bag);
                this.addCollisionBox(bx, by, bz, 1.0, 0.5, 0.6, bag);
            }
            // 第二层
            for (let i = 0; i < 4; i++) {
                const angle = (i / 3 - 0.5) * Math.PI * 0.8;
                const bx = x + Math.cos(angle) * 1.5;
                const bz = z + Math.sin(angle) * 1.5;
                const by = this._groundY(terrain, bx, bz);
                const geo = new THREE.BoxGeometry(1.0, 0.5, 0.6);
                const bag = new THREE.Mesh(geo, bagMat);
                bag.position.set(bx, by + 0.72, bz);
                bag.rotation.y = angle;
                bag.castShadow = false;
                bag.userData.destructibleType = 'sandbag';
                this.scene.add(bag);
                this.addCollisionBox(bx, by + 0.5, bz, 1.0, 0.5, 0.6, bag);
            }
        }
    }

    _createCrates(terrain) {
        const crateMat = createProceduralMaterial('wood', {
            baseColor: 0x6a4a2a,
            accentColor: 0x2e1d10,
            detailColor: 0xa17845,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 6,
        }, { roughness: 0.9, bumpScale: 0.04 });

        const positions = [
            [15, 5, 0], [16.5, 5, 0], [15, 6.5, 0], [15, 5, 1.5],
            [-15, -5, 0], [-16.5, -5, 0],
            [45, 15, 0], [46, 15, 0.8],
            [-45, -15, 0], [-46, -15, 0.8],
            [8, 30, 0], [9, 30, 0],
            [-8, -30, 0], [-9, -30, 0],
            [80, -20, 0], [-80, 20, 0],
        ];

        for (const [x, z, yOffset] of positions) {
            if (this._shouldSkipPropForBuildingAccess(x, z, 1.2)) continue;
            const y = terrain.getHeight(x, z) + yOffset;
            const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            const crate = new THREE.Mesh(geo, crateMat);
            crate.position.set(x, y + 0.75, z);
            crate.castShadow = false;
            crate.receiveShadow = false;
            crate.userData.destructibleType = 'crate';
            this.scene.add(crate);
            this.addCollisionBox(x, y, z, 1.5, 1.5, 1.5, crate);
        }
    }

    _createBarriers(terrain) {
        const barrierMat = createProceduralMaterial('concrete', {
            baseColor: 0x808080,
            accentColor: 0x4f4f4f,
            detailColor: 0xb5b5a8,
            size: 256,
            repeatX: 3,
            repeatY: 1,
            anisotropy: 8,
        }, { roughness: 0.95, bumpScale: 0.04 });

        // 混凝土路障
        const positions = [
            { x: 0, z: 15, rot: 0, w: 6, d: 0.8 },
            { x: 0, z: -15, rot: 0, w: 6, d: 0.8 },
            { x: 15, z: 0, rot: Math.PI / 2, w: 6, d: 0.8 },
            { x: -15, z: 0, rot: Math.PI / 2, w: 6, d: 0.8 },
            { x: 65, z: -30, rot: 0.3, w: 8, d: 0.8 },
            { x: -65, z: 30, rot: 0.3, w: 8, d: 0.8 },
        ];

        for (const b of positions) {
            if (this._shouldSkipPropForBuildingAccess(b.x, b.z, Math.max(b.w, b.d) * 0.5)) continue;
            const ground = this._getLinearPropGround(terrain, b.x, b.z, b.w, b.d, b.rot);
            if (ground.spread > 2.5) continue;
            const y = ground.y;
            const totalH = 1.2 + ground.skirt;
            const geo = new THREE.BoxGeometry(b.w, totalH, b.d);
            const barrier = new THREE.Mesh(geo, barrierMat);
            barrier.position.set(b.x, y + totalH / 2, b.z);
            barrier.rotation.y = b.rot;
            barrier.castShadow = false;
            barrier.receiveShadow = false;
            this.scene.add(barrier);
            this.addCollisionBox(b.x, y, b.z, b.w, totalH, b.d, barrier);
        }
    }

    // 树木风格由地图决定：conifer=针叶（雪地）、deciduous=阔叶、dead=枯木（火山）、sparse=稀疏灌木（沙地）
    _getTreeStyle() {
        const groundColor = this.mapConfig?.terrain?.groundColor || 0x6b7a5a;
        if (groundColor === 0xdde5ee) return 'conifer';
        if (groundColor === 0x3a3530) return 'dead';
        if (groundColor === 0x8a8068) return 'sparse';
        return 'deciduous';
    }

    _getTreeMaterials() {
        if (this._treeMats) return this._treeMats;
        const style = this._getTreeStyle();
        const leafColors = {
            conifer: { base: 0x2c4432, accent: 0x18281e, detail: 0xdde5ee },
            dead: { base: 0x2a2520, accent: 0x151210, detail: 0x453c30 },
            sparse: { base: 0x6a6038, accent: 0x453e22, detail: 0x8f8455 },
            deciduous: { base: 0x2a4a2a, accent: 0x172815, detail: 0x557548 },
        }[style];
        this._treeMats = {
            style,
            trunk: createProceduralMaterial('wood', {
                baseColor: style === 'dead' ? 0x2a2018 : 0x4a3a2a,
                accentColor: 0x21150c,
                detailColor: 0x7b6040,
                size: 192, repeatX: 1, repeatY: 4, anisotropy: 6,
            }, { roughness: 0.95, bumpScale: 0.05 }),
            leaf: createProceduralMaterial('fabric', {
                baseColor: leafColors.base,
                accentColor: leafColors.accent,
                detailColor: leafColors.detail,
                size: 192, repeatX: 2, repeatY: 2, anisotropy: 4,
            }, { roughness: 0.98, bumpScale: 0.025 }),
        };
        return this._treeMats;
    }

    // 构建一棵树（含碰撞），按地图风格差异化
    _buildTree(x, y, z, scale = 1) {
        const mats = this._getTreeMaterials();
        const group = new THREE.Group();
        group.name = `map_tree_${this.mapConfig?.id || 'default'}`;
        group.userData.mapDecoration = 'tree';
        group.position.set(x, y, z);
        group.rotation.y = Math.random() * Math.PI * 2;

        const style = mats.style;
        if (style === 'conifer') {
            // 针叶树：细高树干 + 3~4 层锥形树冠（雪地风格）
            const trunkH = (4 + Math.random() * 3) * scale;
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.3 * scale, trunkH, 6), mats.trunk);
            trunk.position.y = trunkH / 2;
            group.add(trunk);
            const tiers = 3 + (Math.random() < 0.5 ? 1 : 0);
            const baseR = (1.6 + Math.random() * 0.8) * scale;
            for (let t = 0; t < tiers; t++) {
                const f = t / tiers;
                const cone = new THREE.Mesh(
                    new THREE.ConeGeometry(baseR * (1 - f * 0.55), trunkH * 0.45, 7),
                    mats.leaf
                );
                cone.position.y = trunkH * (0.45 + f * 0.62);
                group.add(cone);
            }
            this.addCollisionBox(x, y, z, 0.7 * scale, trunkH, 0.7 * scale, trunk);
        } else if (style === 'dead') {
            // 枯木：扭曲主干 + 2~3 根斜出枯枝，无树冠（火山风格）
            const trunkH = (3 + Math.random() * 2.5) * scale;
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * scale, 0.32 * scale, trunkH, 5), mats.trunk);
            trunk.position.y = trunkH / 2;
            trunk.rotation.z = (Math.random() - 0.5) * 0.16;
            group.add(trunk);
            const branches = 2 + (Math.random() < 0.5 ? 1 : 0);
            for (let b = 0; b < branches; b++) {
                const bh = trunkH * (0.5 + Math.random() * 0.4);
                const bl = (0.8 + Math.random() * 1.2) * scale;
                const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.09 * scale, bl, 4), mats.trunk);
                const ang = Math.random() * Math.PI * 2;
                branch.position.set(Math.cos(ang) * bl * 0.3, bh, Math.sin(ang) * bl * 0.3);
                branch.rotation.z = Math.cos(ang) * 1.1;
                branch.rotation.x = Math.sin(ang) * 1.1;
                group.add(branch);
            }
            this.addCollisionBox(x, y, z, 0.6 * scale, trunkH, 0.6 * scale, trunk);
        } else {
            // 阔叶树：树干 + 3~5 团错落球形树冠（sparse 树冠更小更稀）
            const isSparse = style === 'sparse';
            const trunkH = (isSparse ? 2.2 + Math.random() * 1.6 : 3 + Math.random() * 3) * scale;
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * scale, 0.38 * scale, trunkH, 6), mats.trunk);
            trunk.position.y = trunkH / 2;
            group.add(trunk);
            const blobs = isSparse ? 2 : 3 + (Math.random() < 0.6 ? 2 : 0);
            const baseR = (isSparse ? 1.0 + Math.random() * 0.6 : 1.5 + Math.random() * 1.0) * scale;
            for (let b = 0; b < blobs; b++) {
                const r = baseR * (0.55 + Math.random() * 0.55);
                const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), mats.leaf);
                const ang = (b / blobs) * Math.PI * 2 + Math.random();
                const spread = b === 0 ? 0 : baseR * (0.4 + Math.random() * 0.5);
                blob.position.set(
                    Math.cos(ang) * spread,
                    trunkH + baseR * 0.35 + (Math.random() - 0.3) * baseR * 0.5,
                    Math.sin(ang) * spread
                );
                blob.scale.y = 0.8 + Math.random() * 0.3;
                group.add(blob);
            }
            this.addCollisionBox(x, y, z, 0.8 * scale, trunkH, 0.8 * scale, trunk);
        }

        this.scene.add(group);
        return group;
    }

    _createTrees(terrain) {
        const size = terrain.size;
        const mapId = this.mapConfig?.id;
        // 诺曼底几乎不种大树（海滩登陆），其它图保留少量基树
        const treeCount = mapId === 'normandy' ? 4 : 18;
        let placed = 0;
        let attempts = 0;
        while (placed < treeCount && attempts < treeCount * 8) {
            attempts++;
            const x = (Math.random() - 0.5) * size * 0.8;
            const z = (Math.random() - 0.5) * size * 0.8;

            // 避免在中心生成树；诺曼底海滩/海堤侧不种树
            if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
            if (mapId === 'normandy' && z > 40) continue;
            if (!this._canPlaceProp(terrain, x, z, {
                maxSlope: 0.4,
                avoidBuildingPad: 3.0,
                maxPlatformDelta: 0.35,
            })) continue;

            const y = this._groundY(terrain, x, z);
            // 树干略埋入地面，避免根部缝隙
            this._buildTree(x, y - 0.08, z, 0.85 + Math.random() * 0.4);
            placed++;
        }
    }

    _createFlagPoles(terrain) {
        // 据点旗杆由 World 管理，避免重复创建
    }

    _createContainerYard(terrain) {
        const colors = [0x884422, 0x224488, 0x448822, 0x884488, 0x888822, 0x448888];
        const positions = [
            [100, 60], [103.5, 60], [107, 60], [100, 63.5], [103.5, 63.5],
            [-100, -60], [-103.5, -60], [-107, -60], [-100, -63.5], [-103.5, -63.5],
            [100, -60], [103.5, -60], [100, -63.5],
            [-100, 60], [-103.5, 60], [-100, 63.5],
        ];

        for (let i = 0; i < positions.length; i++) {
            const [x, z] = positions[i];
            const y = terrain.getHeight(x, z);
            const color = colors[i % colors.length];
            const geo = new THREE.BoxGeometry(6, 2.5, 2.5);
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3 });
            const container = new THREE.Mesh(geo, mat);
            container.position.set(x, y + 1.25, z);
            container.castShadow = false;
            container.receiveShadow = false;
            this.scene.add(container);
            this.addCollisionBox(x, y, z, 6, 2.5, 2.5, container);
        }
    }

    // 摧毁的载具残骸
    _createDestroyedVehicles(terrain) {
        const wreckMat = new THREE.MeshStandardMaterial({ color: 0x3a3a2a, roughness: 0.95, metalness: 0.4 });
        const wreckMat2 = new THREE.MeshStandardMaterial({ color: 0x2a2a1a, roughness: 1.0 });

        const positions = [
            { x: 30, z: -40, rot: 0.5 },
            { x: -30, z: 40, rot: -0.3 },
            { x: 70, z: 20, rot: 1.2 },
            { x: -70, z: -20, rot: -1.0 },
            { x: 15, z: 60, rot: 2.0 },
            { x: -15, z: -60, rot: -2.2 },
        ];

        for (const p of positions) {
            if (this._shouldSkipPropForBuildingAccess(p.x, p.z, 3.0)) continue;
            const y = terrain.getHeight(p.x, p.z);

            // 车身
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(4, 1.2, 2),
                wreckMat
            );
            body.position.set(p.x, y + 0.6, p.z);
            body.rotation.y = p.rot;
            body.castShadow = false;
            body.receiveShadow = false;
            this.scene.add(body);
            this.addCollisionBox(p.x, y, p.z, 4, 1.2, 2, body);

            // 烧焦的引擎盖
            const hood = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.8, 1.8),
                wreckMat2
            );
            const offset = new THREE.Vector3(1.5, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rot);
            hood.position.set(p.x + offset.x, y + 1.0, p.z + offset.z);
            hood.rotation.y = p.rot;
            hood.castShadow = false;
            this.scene.add(hood);

            // 歪斜的轮子
            for (let side = -1; side <= 1; side += 2) {
                const wheelOffset = new THREE.Vector3(0, 0, side * 1.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), p.rot);
                const wheel = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8),
                    wreckMat2
                );
                wheel.position.set(p.x + wheelOffset.x, y + 0.3, p.z + wheelOffset.z);
                wheel.rotation.z = Math.PI / 2;
                wheel.rotation.y = p.rot;
                this.scene.add(wheel);
            }

            // 黑色焦痕
            const burn = new THREE.Mesh(
                new THREE.CircleGeometry(3, 16),
                new THREE.MeshBasicMaterial({ color: 0x1a1a0a, transparent: true, opacity: 0.4 })
            );
            burn.rotation.x = -Math.PI / 2;
            burn.position.set(p.x, y + 0.05, p.z);
            this.scene.add(burn);
        }
    }

    // 战壕掩体
    _createTrenches(terrain) {
        const dirtMat = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.95 });
        const dirtDarkMat = new THREE.MeshStandardMaterial({ color: 0x5a4a2a, roughness: 0.95 });

        // 战壕位置 - L型战壕
        const trenches = [
            // 战壕1 - 我方侧
            { x: -30, z: -20, w: 12, d: 2, h: 1.2, rot: 0 },
            { x: -25, z: -15, w: 2, d: 12, h: 1.2, rot: 0 },
            // 战壕2 - 敌方侧
            { x: 30, z: 20, w: 12, d: 2, h: 1.2, rot: 0 },
            { x: 25, z: 15, w: 2, d: 12, h: 1.2, rot: 0 },
            // 中央战壕
            { x: 0, z: 10, w: 10, d: 2, h: 1.0, rot: 0.2 },
        ];

        for (const t of trenches) {
            if (this._shouldSkipPropForBuildingAccess(t.x, t.z, Math.max(t.w, t.d) * 0.5)) continue;
            const y = terrain.getHeight(t.x, t.z);
            // 战壕墙体（两侧）
            for (let side = -1; side <= 1; side += 2) {
                const wall = new THREE.Mesh(
                    new THREE.BoxGeometry(t.w, t.h, 0.5),
                    dirtMat
                );
                const offsetZ = side * (t.d / 2 + 0.25);
                const cosR = Math.cos(t.rot);
                const sinR = Math.sin(t.rot);
                wall.position.set(
                    t.x + sinR * offsetZ,
                    y + t.h / 2,
                    t.z + cosR * offsetZ
                );
                wall.rotation.y = t.rot;
                wall.castShadow = false;
                wall.receiveShadow = false;
                this.scene.add(wall);
                this.addCollisionBox(wall.position.x, y, wall.position.z, t.w, t.h, 0.5, wall);
            }

            // 沙袋堆
            const sandbag = new THREE.Mesh(
                new THREE.BoxGeometry(t.w * 0.8, 0.4, t.d * 0.6),
                dirtDarkMat
            );
            sandbag.position.set(t.x, y + 0.2, t.z);
            sandbag.rotation.y = t.rot;
            sandbag.castShadow = false;
            this.scene.add(sandbag);
        }
    }

    // 岩石群
    _createRocks(terrain) {
        const rockMat = createProceduralMaterial('concrete', {
            baseColor: 0x6a6a6a,
            accentColor: 0x3f3f3f,
            detailColor: 0x9b9b9b,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 8,
        }, { roughness: 0.98, metalness: 0.02, bumpScale: 0.05 });
        const rockMat2 = createProceduralMaterial('concrete', {
            baseColor: 0x5a5a5a,
            accentColor: 0x373737,
            detailColor: 0x909090,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 8,
        }, { roughness: 0.99, metalness: 0.01, bumpScale: 0.045 });

        const positions = [
            { x: 45, z: -30, scale: 2.0 },
            { x: 48, z: -28, scale: 1.2 },
            { x: -45, z: 30, scale: 2.5 },
            { x: -48, z: 33, scale: 1.5 },
            { x: 60, z: 50, scale: 1.8 },
            { x: -60, z: -50, scale: 2.0 },
            { x: 20, z: -70, scale: 1.5 },
            { x: -20, z: 70, scale: 1.8 },
            { x: 85, z: -10, scale: 2.2 },
            { x: -85, z: 10, scale: 1.6 },
        ];

        for (const p of positions) {
            if (this._shouldSkipPropForBuildingAccess(p.x, p.z, p.scale + 1.2)) continue;
            const y = terrain.getHeight(p.x, p.z);
            const mat = Math.random() > 0.5 ? rockMat : rockMat2;

            // 主岩石 - 不规则形状
            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(p.scale, 0),
                mat
            );
            rock.position.set(p.x, y + p.scale * 0.4, p.z);
            rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            rock.scale.set(1, 0.7 + Math.random() * 0.3, 1);
            rock.castShadow = false;
            rock.receiveShadow = false;
            this.scene.add(rock);
            this.addCollisionBox(p.x, y, p.z, p.scale * 1.5, p.scale * 0.8, p.scale * 1.5, rock);

            // 小碎石
            if (p.scale > 1.5) {
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = p.scale + Math.random() * 1.5;
                    const px = p.x + Math.cos(angle) * dist;
                    const pz = p.z + Math.sin(angle) * dist;
                    const py = terrain.getHeight(px, pz);
                    const small = new THREE.Mesh(
                        new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3, 0),
                        mat
                    );
                    small.position.set(px, py + 0.2, pz);
                    small.rotation.set(Math.random(), Math.random(), Math.random());
                    small.castShadow = false;
                    this.scene.add(small);
                }
            }
        }
    }

    // 燃料罐
    _createFuelTanks(terrain) {
        const tankMat = createProceduralMaterial('metal', {
            baseColor: 0x666633,
            accentColor: 0x3f3d1f,
            detailColor: 0xb0a66f,
            size: 192,
            repeatX: 3,
            repeatY: 1,
            anisotropy: 8,
        }, { roughness: 0.58, metalness: 0.62, bumpScale: 0.03 });
        const rustMat = createProceduralMaterial('wood', {
            baseColor: 0x554422,
            accentColor: 0x2f2012,
            detailColor: 0x8a5c28,
            size: 128,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 4,
        }, { roughness: 0.92, metalness: 0.15, bumpScale: 0.03 });
        const pipeMat = createProceduralMaterial('metal', {
            baseColor: 0x444444,
            accentColor: 0x222222,
            detailColor: 0x888888,
            size: 192,
            repeatX: 2,
            repeatY: 1,
            anisotropy: 8,
        }, { roughness: 0.48, metalness: 0.75, bumpScale: 0.025 });

        const positions = [
            { x: 90, z: -60, count: 3 },
            { x: -90, z: 60, count: 3 },
        ];

        for (const p of positions) {
            for (let i = 0; i < p.count; i++) {
                const x = p.x + i * 4;
                const z = p.z;
                if (this._shouldSkipPropForBuildingAccess(x, z, 2.0)) continue;
                const y = terrain.getHeight(x, z);

                // 罐体（横放圆柱）
                const tank = new THREE.Mesh(
                    new THREE.CylinderGeometry(1.5, 1.5, 3.5, 16),
                    tankMat
                );
                tank.rotation.z = Math.PI / 2;
                tank.position.set(x, y + 1.5, z);
                tank.castShadow = false;
                tank.receiveShadow = false;
                this.scene.add(tank);
                this.addCollisionBox(x, y, z, 3.5, 3, 3, tank);

                // 支架
                for (let side = -1; side <= 1; side += 2) {
                    const support = new THREE.Mesh(
                        new THREE.BoxGeometry(0.3, 1.5, 0.3),
                        rustMat
                    );
                    support.position.set(x + side * 1.2, y + 0.75, z);
                    this.scene.add(support);
                }

                // 管道连接
                if (i < p.count - 1) {
                    const pipe = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8),
                        pipeMat
                    );
                    pipe.rotation.z = Math.PI / 2;
                    pipe.position.set(x + 2, y + 1.5, z);
                    this.scene.add(pipe);
                }

                // 警告标
                const warning = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.5, 0.5),
                    new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })
                );
                warning.position.set(x, y + 2.5, z + 1.51);
                this.scene.add(warning);
            }
        }
    }

    _registerStrategicObjectivePart(mesh, objective) {
        mesh.userData.strategicObjective = objective;
        mesh.userData.objectiveId = objective.id;
        objective.parts.push(mesh);
    }

    _createStrategicObjectives(terrain) {
        const specs = [
            {
                id: 'friendly_fuel',
                team: 0,
                name: '我方燃料库',
                shortLabel: '燃料库',
                type: 'fuel',
                x: -76,
                z: -122,
                color: 0x3d6f88,
                scoreValue: 18,
                ticketDamage: 18,
                health: 220,
            },
            {
                id: 'enemy_fuel',
                team: 1,
                name: '敌方燃料库',
                shortLabel: '燃料库',
                type: 'fuel',
                x: 76,
                z: 122,
                color: 0x8b4f4f,
                scoreValue: 30,
                ticketDamage: 28,
                health: 220,
            },
            {
                id: 'friendly_comms',
                team: 0,
                name: '我方通讯站',
                shortLabel: '通讯站',
                type: 'comms',
                x: -108,
                z: -64,
                color: 0x4e788b,
                scoreValue: 20,
                ticketDamage: 20,
                health: 180,
            },
            {
                id: 'enemy_comms',
                team: 1,
                name: '敌方通讯站',
                shortLabel: '通讯站',
                type: 'comms',
                x: 108,
                z: 64,
                color: 0x8b5d4e,
                scoreValue: 34,
                ticketDamage: 32,
                health: 180,
            },
        ];

        for (const spec of specs) {
            const y = terrain.getHeight(spec.x, spec.z);
            const objective = {
                ...spec,
                position: new THREE.Vector3(spec.x, y, spec.z),
                maxHealth: spec.health,
                health: spec.health,
                alive: true,
                parts: [],
            };

            const group = new THREE.Group();
            group.position.set(spec.x, y, spec.z);
            group.userData.strategicObjective = objective;
            this.scene.add(group);
            objective.group = group;

            const bodyMat = createProceduralMaterial('metal', {
                baseColor: spec.color,
                accentColor: 0x2d3030,
                detailColor: 0x8aa0a5,
                size: 192,
                repeatX: 2,
                repeatY: 2,
                anisotropy: 8,
            }, { roughness: 0.72, metalness: 0.34, bumpScale: 0.028 });
            const darkMat = createProceduralMaterial('metal', {
                baseColor: 0x2d2d2d,
                accentColor: 0x111111,
                detailColor: 0x777777,
                size: 192,
                repeatX: 2,
                repeatY: 2,
                anisotropy: 8,
            }, { roughness: 0.88, metalness: 0.28, bumpScale: 0.025 });
            const glowMat = new THREE.MeshBasicMaterial({
                color: spec.team === 0 ? 0x55ccff : 0xff6655,
                transparent: true,
                opacity: 0.6,
            });

            if (spec.type === 'fuel') {
                const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.2, 3.2), bodyMat);
                base.position.set(0, 0.6, 0);
                group.add(base);
                this.addCollisionBox(spec.x, y, spec.z, 4.2, 1.2, 3.2, base);
                this._registerStrategicObjectivePart(base, objective);

                const tank1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.9, 10), darkMat);
                tank1.rotation.z = Math.PI / 2;
                tank1.position.set(-1.15, 1.8, 0);
                group.add(tank1);
                this.addCollisionBox(spec.x - 1.15, y + 0.35, spec.z, 1.2, 2.9, 1.2, tank1);
                this._registerStrategicObjectivePart(tank1, objective);

                const tank2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.6, 10), darkMat);
                tank2.rotation.z = Math.PI / 2;
                tank2.position.set(1.1, 1.8, 0.25);
                group.add(tank2);
                this.addCollisionBox(spec.x + 1.1, y + 0.5, spec.z + 0.25, 1.1, 2.6, 1.1, tank2);
                this._registerStrategicObjectivePart(tank2, objective);

                const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.6, 8), glowMat);
                beacon.position.set(0, 3.2, 0);
                group.add(beacon);
                this._registerStrategicObjectivePart(beacon, objective);
            } else {
                const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 2.6), bodyMat);
                base.position.set(0, 0.6, 0);
                group.add(base);
                this.addCollisionBox(spec.x, y, spec.z, 2.6, 1.2, 2.6, base);
                this._registerStrategicObjectivePart(base, objective);

                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 7.5, 8), darkMat);
                pole.position.set(0, 4.3, 0);
                group.add(pole);
                this._registerStrategicObjectivePart(pole, objective);

                const dish = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8), glowMat);
                dish.scale.set(1.3, 0.55, 0.55);
                dish.position.set(0.4, 6.1, 0);
                group.add(dish);
                this._registerStrategicObjectivePart(dish, objective);

                const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.1), darkMat);
                box.position.set(-0.7, 1.2, 0.45);
                group.add(box);
                this.addCollisionBox(spec.x - 0.7, y + 0.8, spec.z + 0.45, 1.1, 0.8, 1.1, box);
                this._registerStrategicObjectivePart(box, objective);
            }

            const objectiveGlow = new THREE.Mesh(
                new THREE.CircleGeometry(4, 24),
                new THREE.MeshBasicMaterial({
                    color: spec.team === 0 ? 0x55ccff : 0xff6655,
                    transparent: true,
                    opacity: 0.14,
                    side: THREE.DoubleSide,
                })
            );
            objectiveGlow.rotation.x = -Math.PI / 2;
            objectiveGlow.position.set(0, 0.03, 0);
            group.add(objectiveGlow);
            this._registerStrategicObjectivePart(objectiveGlow, objective);

            this.strategicObjectives.push(objective);
        }
    }

    // === 草地 - 使用 InstancedMesh 高效渲染大量草丛 ===
    _createExpandedMapDistricts(terrain) {
        const concreteMat = createProceduralMaterial('concrete', {
            baseColor: 0x5b6059,
            accentColor: 0x2e302d,
            detailColor: 0x9b9585,
            size: 192,
            repeatX: 3,
            repeatY: 2,
            anisotropy: 6,
        }, { roughness: 0.96, bumpScale: 0.04 });
        const metalMat = createProceduralMaterial('metal', {
            baseColor: 0x515a5c,
            accentColor: 0x222829,
            detailColor: 0xa3b0ac,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 6,
        }, { roughness: 0.72, metalness: 0.42, bumpScale: 0.025 });
        const crateMat = createProceduralMaterial('wood', {
            baseColor: 0x6b5438,
            accentColor: 0x2e2115,
            detailColor: 0xb08c5a,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 6,
        }, { roughness: 0.92, bumpScale: 0.035 });
        const rubberMat = createProceduralMaterial('rubber', {
            baseColor: 0x171717,
            accentColor: 0x050505,
            detailColor: 0x4c4c4c,
            size: 128,
            repeatX: 2,
            repeatY: 1,
            anisotropy: 4,
        }, { roughness: 0.95, bumpScale: 0.03 });

        this._createGroundPatch(-112, 48, 42, 30, terrain, 0x475054, 0.5, -0.22);
        this._createGroundPatch(112, -48, 46, 32, terrain, 0x4b453b, 0.5, -0.22);
        this._createGroundPatch(-84, 20, 70, 7, terrain, 0x383a3b, 0.6, -Math.PI / 5);
        this._createGroundPatch(84, -20, 70, 7, terrain, 0x383a3b, 0.6, -Math.PI / 5);

        const addBox = (name, x, z, w, h, d, mat, rot = 0, collide = true) => {
            if (this._shouldSkipPropForBuildingAccess(x, z, Math.max(w, d) * 0.35)) return null;
            const y = terrain.getHeight(x, z);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            mesh.name = name;
            mesh.position.set(x, y + h / 2, z);
            mesh.rotation.y = rot;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            this.scene.add(mesh);
            if (collide) this.addCollisionBox(x, y, z, w, h, d, mesh, rot);
            return mesh;
        };

        const addCyl = (name, x, z, radius, height, mat, rot = 0, collide = true) => {
            if (this._shouldSkipPropForBuildingAccess(x, z, radius + 0.6)) return null;
            const y = terrain.getHeight(x, z);
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 12), mat);
            mesh.name = name;
            mesh.position.set(x, y + height / 2, z);
            mesh.rotation.y = rot;
            mesh.castShadow = false;
            this.scene.add(mesh);
            if (collide) this.addCollisionBox(x, y, z, radius * 2, height, radius * 2, mesh, rot);
            return mesh;
        };

        const radarBase = addBox('radar_control_plinth', -112, 48, 5.2, 1.0, 4.2, concreteMat, -0.2);
        if (radarBase) {
            const mast = addCyl('radar_mast', -112, 48, 0.22, 8.5, metalMat, 0, true);
            if (mast) {
                const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 1.8, 0.24, 18), metalMat);
                dish.name = 'radar_dish';
                dish.position.set(-111.4, mast.position.y + 3.8, 48.2);
                dish.rotation.z = Math.PI / 2;
                dish.rotation.y = -0.6;
                this.scene.add(dish);
            }
        }

        for (const p of [
            [-120, 45, 4.8, 1.05, 0.7, -0.15],
            [-104, 52, 4.8, 1.05, 0.7, 0.25],
            [-112, 36, 3.4, 0.8, 1.2, 0.7],
            [-130, 50, 2.0, 0.9, 1.3, 0.2],
        ]) {
            addBox('radar_ridge_cover', p[0], p[1], p[2], p[3], p[4], concreteMat, p[5]);
        }

        for (const p of [
            [107, -45, 4.8, 0.8, 2.2, 0.1],
            [117, -48, 3.8, 0.9, 1.6, -0.4],
            [122, -60, 2.0, 1.0, 1.2, 0.4],
            [99, -58, 3.0, 0.8, 1.4, -0.2],
        ]) {
            addBox('motor_pool_crate_stack', p[0], p[1], p[2], p[3], p[4], crateMat, p[5]);
        }

        for (const p of [
            [111, -38], [113, -38.1], [115, -38.2], [108, -62], [110, -62.2],
        ]) {
            const tire = addCyl('motor_pool_tire_stack', p[0], p[1], 0.48, 0.28, rubberMat, Math.PI / 2, true);
            if (tire) tire.rotation.z = Math.PI / 2;
        }

        const liftA = addBox('vehicle_lift_left', 111, -51, 0.28, 1.15, 4.8, metalMat, -0.12);
        const liftB = addBox('vehicle_lift_right', 114.2, -51.4, 0.28, 1.15, 4.8, metalMat, -0.12);
        if (liftA && liftB) {
            addBox('vehicle_lift_crossbar', 112.6, -51.2, 3.5, 0.18, 0.22, metalMat, -0.12, false);
        }

        for (const p of [
            [-96, 31, 5.5, 1.05, 0.65, -0.1],
            [-132, 64, 5.5, 1.05, 0.65, 0.35],
            [96, -31, 5.5, 1.05, 0.65, -0.1],
            [132, -64, 5.5, 1.05, 0.65, 0.35],
        ]) {
            addBox('flank_lane_barrier', p[0], p[1], p[2], p[3], p[4], concreteMat, p[5]);
        }
    }

    _createForwardBaseDetails(terrain) {
        const tarpMat = createProceduralMaterial('fabric', {
            baseColor: 0x5f674c,
            accentColor: 0x2f3527,
            detailColor: 0xb8ba96,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 6,
        }, { roughness: 0.96, bumpScale: 0.035, side: THREE.DoubleSide });
        const enemyTarpMat = createProceduralMaterial('fabric', {
            baseColor: 0x6a4e4e,
            accentColor: 0x362424,
            detailColor: 0xb8968f,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 6,
        }, { roughness: 0.96, bumpScale: 0.035, side: THREE.DoubleSide });
        const crateMat = createProceduralMaterial('wood', {
            baseColor: 0x665237,
            accentColor: 0x2c2114,
            detailColor: 0xa88658,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 6,
        }, { roughness: 0.92, bumpScale: 0.035 });
        const metalMat = createProceduralMaterial('metal', {
            baseColor: 0x454947,
            accentColor: 0x202322,
            detailColor: 0x9ca39b,
            size: 160,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 6,
        }, { roughness: 0.72, metalness: 0.38, bumpScale: 0.02 });
        const rubberMat = createProceduralMaterial('rubber', {
            baseColor: 0x151515,
            accentColor: 0x050505,
            detailColor: 0x555555,
            size: 128,
            repeatX: 2,
            repeatY: 1,
            anisotropy: 4,
        }, { roughness: 0.95, metalness: 0.05, bumpScale: 0.03 });
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0x15120e, transparent: true, opacity: 0.45, side: THREE.DoubleSide });

        const transform = (base, lx, lz) => ({
            x: base.x + lx * Math.cos(base.rot) - lz * Math.sin(base.rot),
            z: base.z + lx * Math.sin(base.rot) + lz * Math.cos(base.rot),
        });

        const addBox = (name, base, lx, lz, w, h, d, mat, collide = true, yawOffset = 0) => {
            const p = transform(base, lx, lz);
            if (this._shouldSkipPropForBuildingAccess(p.x, p.z, Math.max(w, d) * 0.45)) return null;
            const y = terrain.getHeight(p.x, p.z);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            mesh.name = name;
            mesh.position.set(p.x, y + h / 2, p.z);
            mesh.rotation.y = base.rot + yawOffset;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            this.scene.add(mesh);
            if (collide) this.addCollisionBox(p.x, y, p.z, w, h, d, mesh, mesh.rotation.y);
            return mesh;
        };

        const addCyl = (name, base, lx, lz, radius, height, mat, collide = false, yawOffset = 0) => {
            const p = transform(base, lx, lz);
            if (this._shouldSkipPropForBuildingAccess(p.x, p.z, radius + 0.4)) return null;
            const y = terrain.getHeight(p.x, p.z);
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 10), mat);
            mesh.name = name;
            mesh.position.set(p.x, y + height / 2, p.z);
            mesh.rotation.y = base.rot + yawOffset;
            mesh.castShadow = false;
            this.scene.add(mesh);
            if (collide) this.addCollisionBox(p.x, y, p.z, radius * 2, height, radius * 2, mesh, mesh.rotation.y);
            return mesh;
        };

        const bases = [
            { x: -122, z: -116, rot: 0.35, team: 0, color: 0x5f8cff },
            { x: 122, z: 116, rot: Math.PI + 0.35, team: 1, color: 0xff6f5f },
            { x: -84, z: -68, rot: -0.2, team: 0, color: 0x5f8cff },
            { x: 84, z: 68, rot: Math.PI - 0.2, team: 1, color: 0xff6f5f },
        ];

        for (const base of bases) {
            const mat = base.team === 0 ? tarpMat : enemyTarpMat;
            this._createGroundPatch(base.x, base.z, 18, 14, terrain, 0x4a473b, 0.46, base.rot);

            addBox('forward_tent_body', base, -2.6, 0, 4.4, 1.65, 3.6, mat, true);
            const roof = addBox('forward_tent_roof', base, -2.6, 0, 4.9, 0.32, 4.1, mat, false);
            if (roof) {
                roof.position.y += 1.62;
                roof.scale.y = 1.35;
            }
            const door = addBox('forward_tent_door_shadow', base, -2.6, 1.84, 1.15, 1.25, 0.04, shadowMat, false);
            if (door) door.position.y += 0.2;

            addBox('field_radio_table', base, 1.9, -1.3, 1.7, 0.75, 0.95, crateMat, true);
            addBox('field_radio_case', base, 1.9, -1.3, 1.0, 0.45, 0.55, metalMat, true);
            addBox('ammo_pallet_a', base, 2.8, 1.6, 1.4, 0.55, 0.9, crateMat, true, 0.12);
            addBox('ammo_pallet_b', base, 3.8, 1.2, 1.2, 0.55, 0.85, crateMat, true, -0.08);
            addBox('vehicle_service_box', base, -5.3, -1.8, 1.3, 0.65, 0.9, metalMat, true);

            for (let i = 0; i < 3; i++) {
                const tire = addCyl('stacked_tire', base, -5.1, 1.3 + i * 0.08, 0.45, 0.24, rubberMat, true, Math.PI / 2);
                if (tire) {
                    tire.rotation.z = Math.PI / 2;
                    tire.position.y += i * 0.18;
                }
            }

            for (const [lx, lz] of [[-7.2, -4.6], [7.2, -4.6], [-7.2, 4.6], [7.2, 4.6]]) {
                addCyl('field_marker_post', base, lx, lz, 0.055, 1.15, metalMat, false);
                const light = addBox('field_marker_light', base, lx, lz, 0.22, 0.12, 0.22, new THREE.MeshBasicMaterial({ color: base.color }), false);
                if (light) light.position.y += 1.16;
            }

            const mast = addCyl('field_radio_mast', base, 4.8, -3.5, 0.08, 5.8, metalMat, true);
            if (mast) {
                const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.58, 0.12, 12), metalMat);
                dish.name = 'field_radio_dish';
                dish.position.set(mast.position.x, mast.position.y + 1.25, mast.position.z);
                dish.rotation.z = Math.PI / 2;
                dish.rotation.y = base.rot + 0.55;
                this.scene.add(dish);
            }

            for (let i = -2; i <= 2; i++) {
                const p = transform(base, i * 1.35, 6.7 - Math.abs(i) * 0.35);
                this._createCoverBlock(
                    p.x,
                    p.z,
                    1.2,
                    0.5,
                    0.58,
                    terrain,
                    0x756548,
                    base.rot + i * 0.08,
                    'forward_sandbag_line'
                );
            }

            const stripeA = transform(base, 0, -5.8);
            const stripeB = transform(base, 0, 5.8);
            this._createFlatStripe(stripeA.x, stripeA.z, 7.5, 0.18, terrain, base.color, base.rot, 'forward_base_team_stripe');
            this._createFlatStripe(stripeB.x, stripeB.z, 7.5, 0.18, terrain, base.color, base.rot, 'forward_base_team_stripe');
        }

        for (const p of [
            { x: -18, z: -70, rot: 0.5 },
            { x: 18, z: 70, rot: Math.PI + 0.5 },
            { x: -72, z: 18, rot: -0.75 },
            { x: 72, z: -18, rot: Math.PI - 0.75 },
        ]) {
            const y = terrain.getHeight(p.x, p.z);
            const barricade = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.95, 0.32), metalMat);
            barricade.name = 'road_spike_barricade';
            barricade.position.set(p.x, y + 0.55, p.z);
            barricade.rotation.y = p.rot;
            this.scene.add(barricade);
            this.addCollisionBox(p.x, y, p.z, 4.2, 0.95, 0.32, barricade, p.rot);

            for (let i = -2; i <= 2; i++) {
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 4), metalMat);
                spike.name = 'road_spike';
                spike.position.set(
                    p.x + Math.cos(p.rot) * i * 0.78,
                    y + 0.35,
                    p.z + Math.sin(p.rot) * i * 0.78
                );
                spike.rotation.z = Math.PI / 2;
                spike.rotation.y = p.rot;
                this.scene.add(spike);
            }
        }
    }

    // === 灌木丛 - 提供视觉遮挡和轻度掩体 ===
    _createBushes(terrain) {
        const bushMat1 = new THREE.MeshStandardMaterial({ color: 0x3a4a2a, roughness: 1.0 });
        const bushMat2 = new THREE.MeshStandardMaterial({ color: 0x4a5a2a, roughness: 0.95 });
        const bushMat3 = new THREE.MeshStandardMaterial({ color: 0x2a3a1a, roughness: 1.0 });

        const size = terrain.size;
        const mapId = this.mapConfig?.id;
        const bushCount = mapId === 'normandy' ? 35 : 60;
        let placed = 0;
        let attempts = 0;

        while (placed < bushCount && attempts < bushCount * 5) {
            attempts++;
            const x = (Math.random() - 0.5) * size * 0.8;
            const z = (Math.random() - 0.5) * size * 0.8;
            // 避开中心区域和道路
            if (Math.abs(x) < 10 || Math.abs(z) < 10) continue;
            if (Math.abs(z) < 7 && Math.abs(x) < size * 0.35) continue;
            if (Math.abs(x) < 7 && Math.abs(z) < size * 0.35) continue;
            if (mapId === 'normandy' && z > 95) continue;
            if (!this._canPlaceProp(terrain, x, z, { maxSlope: 0.55, avoidBuildingPad: 1.5 })) continue;

            const y = this._groundY(terrain, x, z);
            const mat = [bushMat1, bushMat2, bushMat3][Math.floor(Math.random() * 3)];
            const bushRadius = 0.4 + Math.random() * 0.5;

            // 灌木主体 - 不规则球形；略埋入地面
            const bush = new THREE.Mesh(
                new THREE.SphereGeometry(bushRadius, 6, 5),
                mat
            );
            bush.position.set(x, y + bushRadius * 0.35, z);
            bush.scale.set(1.2 + Math.random() * 0.3, 0.8 + Math.random() * 0.3, 1.0 + Math.random() * 0.3);
            bush.castShadow = false;
            bush.receiveShadow = false;
            this.scene.add(bush);
            placed++;

            // 小型灌木不添加碰撞（玩家可以穿过），大型灌木添加轻度碰撞
            if (bushRadius > 0.6) {
                // 只添加很小的碰撞盒，不阻挡移动但可以被子弹击中
                this.meshes.push(bush);
            }

            // 旁边的小灌木簇
            if (Math.random() > 0.5) {
                const smallBush = new THREE.Mesh(
                    new THREE.SphereGeometry(bushRadius * 0.5, 5, 4),
                    mat
                );
                const angle = Math.random() * Math.PI * 2;
                const dist = bushRadius + 0.3;
                const sx = x + Math.cos(angle) * dist;
                const sz = z + Math.sin(angle) * dist;
                const sy = this._groundY(terrain, sx, sz);
                smallBush.position.set(
                    sx,
                    sy + bushRadius * 0.2,
                    sz
                );
                smallBush.castShadow = false;
                this.scene.add(smallBush);
            }
        }
    }

    // === 地面细节 - 弹坑、土堆、碎片 ===
    _createGroundDetails(terrain) {
        const craterMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1.0 });
        const dirtMat = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.95 });
        const debrisMat = new THREE.MeshStandardMaterial({ color: 0x4a4a3a, roughness: 0.9, metalness: 0.2 });

        // 弹坑 - 散布在战场上
        const craterPositions = [
            [12, 8], [-12, -8], [22, -18], [-22, 18],
            [40, -10], [-40, 10], [55, 25], [-55, -25],
            [8, 35], [-8, -35], [65, -45], [-65, 45],
            [18, -50], [-18, 50], [3, 22], [-3, -22],
        ];

        for (const [x, z] of craterPositions) {
            const y = terrain.getHeight(x, z);
            const radius = 1.5 + Math.random() * 1.5;

            // 弹坑凹陷 - 用环形+暗色圆模拟
            const crater = new THREE.Mesh(
                new THREE.CircleGeometry(radius, 16),
                craterMat
            );
            crater.rotation.x = -Math.PI / 2;
            crater.position.set(x, y + 0.02, z);
            this.scene.add(crater);

            // 弹坑边缘隆起
            const rim = new THREE.Mesh(
                new THREE.RingGeometry(radius * 0.9, radius * 1.3, 16),
                dirtMat
            );
            rim.rotation.x = -Math.PI / 2;
            rim.position.set(x, y + 0.03, z);
            this.scene.add(rim);

            // 周围散落的碎石
            for (let i = 0; i < 4; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = radius + 0.5 + Math.random() * 1;
                const px = x + Math.cos(angle) * dist;
                const pz = z + Math.sin(angle) * dist;
                const py = terrain.getHeight(px, pz);
                const debris = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.15, 0),
                    debrisMat
                );
                debris.position.set(px, py + 0.08, pz);
                debris.rotation.set(Math.random(), Math.random(), Math.random());
                debris.castShadow = false;
                this.scene.add(debris);
            }
        }

        // 散落的弹药箱和补给
        const supplyPositions = [
            [15, 12, 0.2], [-15, -12, -0.5],
            [28, -8, 1.0], [-28, 8, -1.0],
            [42, 30, 0], [-42, -30, 0],
        ];
        const ammoBoxMat = new THREE.MeshStandardMaterial({ color: 0x4a3a1a, roughness: 0.8, metalness: 0.2 });
        for (const [x, z, rot] of supplyPositions) {
            const y = terrain.getHeight(x, z);
            const box = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.3, 0.4),
                ammoBoxMat
            );
            box.position.set(x, y + 0.15, z);
            box.rotation.y = rot;
            box.castShadow = false;
            box.receiveShadow = false;
            this.scene.add(box);
            // 弹药箱上的标识
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.62, 0.05, 0.42),
                new THREE.MeshBasicMaterial({ color: 0xccaa00 })
            );
            stripe.position.set(x, y + 0.18, z);
            stripe.rotation.y = rot;
            this.scene.add(stripe);
        }

        // 散落的铁丝网碎片和金属残片
        const scrapMat = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.8, metalness: 0.5 });
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 300;
            const z = (Math.random() - 0.5) * 300;
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
            const y = terrain.getHeight(x, z);
            const scrap = new THREE.Mesh(
                new THREE.BoxGeometry(0.2 + Math.random() * 0.3, 0.02, 0.1 + Math.random() * 0.2),
                scrapMat
            );
            scrap.position.set(x, y + 0.02, z);
            scrap.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
            this.scene.add(scrap);
        }
    }

    // === 铁丝网围栏 ===
    _createBarbedWire(terrain) {
        const wireMat = new THREE.MeshStandardMaterial({ color: 0x4a4a3a, roughness: 0.6, metalness: 0.7 });
        const postMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 });

        // 铁丝网位置 - 战壕周围和据点边缘
        const fenceSegments = [
            { x: -30, z: -14, w: 8, rot: 0 },
            { x: -14, z: -20, w: 8, rot: Math.PI / 2 },
            { x: 30, z: 14, w: 8, rot: 0 },
            { x: 14, z: 20, w: 8, rot: Math.PI / 2 },
            { x: -5, z: 8, w: 6, rot: 0.2 },
        ];

        for (const seg of fenceSegments) {
            const y = terrain.getHeight(seg.x, seg.z);
            const postCount = Math.floor(seg.w / 1.5);

            for (let i = 0; i <= postCount; i++) {
                const t = i / postCount;
                const px = seg.x + (t - 0.5) * seg.w * Math.cos(seg.rot);
                const pz = seg.z + (t - 0.5) * seg.w * Math.sin(seg.rot);
                const py = terrain.getHeight(px, pz);

                // 木桩
                const post = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.06, 1.2, 6),
                    postMat
                );
                post.position.set(px, py + 0.6, pz);
                post.castShadow = false;
                this.scene.add(post);
            }

            // 铁丝网线 - 用细长的圆柱体模拟
            for (let row = 0; row < 3; row++) {
                const wireY = 0.3 + row * 0.3;
                const wire = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.008, 0.008, seg.w, 4),
                    wireMat
                );
                wire.rotation.z = Math.PI / 2;
                wire.rotation.y = seg.rot;
                wire.position.set(seg.x, y + wireY, seg.z);
                this.scene.add(wire);

                // 交错的铁丝（锯齿状）
                if (row === 1) {
                    for (let i = 0; i < postCount; i++) {
                        const t = (i + 0.5) / postCount;
                        const px = seg.x + (t - 0.5) * seg.w * Math.cos(seg.rot);
                        const pz = seg.z + (t - 0.5) * seg.w * Math.sin(seg.rot);
                        const py = terrain.getHeight(px, pz);
                        const zig = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.006, 0.006, 0.4, 3),
                            wireMat
                        );
                        zig.position.set(px, py + 0.5, pz);
                        zig.rotation.z = Math.PI / 4 + Math.random() * 0.3;
                        this.scene.add(zig);
                    }
                }
            }
        }
    }

    // === 战壕细节装饰 - 木板、弹药箱、支撑架 ===
    _createTrenchDetails(terrain) {
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3a1a, roughness: 0.9 });
        const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.95 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.6 });

        // 战壕位置（与 _createTrenches 对应）
        const trenches = [
            { x: -30, z: -20, rot: 0 },
            { x: 30, z: 20, rot: 0 },
            { x: 0, z: 10, rot: 0.2 },
        ];

        for (const t of trenches) {
            const y = terrain.getHeight(t.x, t.z);

            // 木质支撑梁（战壕壁加固）
            for (let i = -1; i <= 1; i++) {
                const beamX = t.x + i * 3 * Math.cos(t.rot);
                const beamZ = t.z + i * 3 * Math.sin(t.rot);
                const beamY = terrain.getHeight(beamX, beamZ);
                const beam = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 1.2, 2.5),
                    woodMat
                );
                beam.position.set(beamX, beamY + 0.6, beamZ);
                beam.rotation.y = t.rot;
                beam.castShadow = false;
                this.scene.add(beam);
            }

            // 横向木板（走道）
            const plank = new THREE.Mesh(
                new THREE.BoxGeometry(4, 0.08, 1.5),
                darkWoodMat
            );
            plank.position.set(t.x, y + 0.05, t.z);
            plank.rotation.y = t.rot;
            plank.receiveShadow = false;
            this.scene.add(plank);

            // 弹药箱堆（战壕角落）
            const crateX = t.x + 2 * Math.cos(t.rot + Math.PI / 2);
            const crateZ = t.z + 2 * Math.sin(t.rot + Math.PI / 2);
            const crateY = terrain.getHeight(crateX, crateZ);
            for (let s = 0; s < 2; s++) {
                const crate = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 0.35, 0.4),
                    woodMat
                );
                crate.position.set(crateX, crateY + 0.18 + s * 0.36, crateZ);
                crate.rotation.y = t.rot + (s * 0.1);
                crate.castShadow = false;
                crate.receiveShadow = false;
                this.scene.add(crate);
            }

            // 步枪架（靠在战壕壁上）
            const rackX = t.x - 2 * Math.cos(t.rot + Math.PI / 2);
            const rackZ = t.z - 2 * Math.sin(t.rot + Math.PI / 2);
            const rackY = terrain.getHeight(rackX, rackZ);
            const rack = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 1.0, 0.04),
                metalMat
            );
            rack.position.set(rackX, rackY + 0.5, rackZ);
            rack.rotation.z = 0.15;
            rack.castShadow = false;
            this.scene.add(rack);

            // 水壶/装备挂在壁上
            const canteen = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8),
                metalMat
            );
            const canteenX = t.x + 1 * Math.cos(t.rot + Math.PI / 2);
            const canteenZ = t.z + 1 * Math.sin(t.rot + Math.PI / 2);
            const canteenY = terrain.getHeight(canteenX, canteenZ);
            canteen.position.set(canteenX, canteenY + 0.4, canteenZ);
            this.scene.add(canteen);
        }
    }

    // === 枯死/断裂的树木 - 战场氛围 ===
    _createDeadTrees(terrain) {
        const deadTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.95 });
        const branchMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 1.0 });

        const size = terrain.size;
        const deadTreeCount = 15;

        for (let i = 0; i < deadTreeCount; i++) {
            const x = (Math.random() - 0.5) * size * 0.7;
            const z = (Math.random() - 0.5) * size * 0.7;
            if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;

            const y = terrain.getHeight(x, z);
            const trunkHeight = 2 + Math.random() * 3;
            const isBroken = Math.random() > 0.5;

            // 树干 - 断裂的树更短
            const actualHeight = isBroken ? trunkHeight * 0.5 : trunkHeight;
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.25, actualHeight, 6),
                deadTrunkMat
            );
            trunk.position.set(x, y + actualHeight / 2, z);
            trunk.rotation.z = (Math.random() - 0.5) * 0.15;
            trunk.castShadow = false;
            trunk.receiveShadow = false;
            this.scene.add(trunk);
            this.addCollisionBox(x, y, z, 0.5, actualHeight, 0.5, trunk);

            if (!isBroken) {
                // 断裂的树枝
                const branchCount = 2 + Math.floor(Math.random() * 3);
                for (let b = 0; b < branchCount; b++) {
                    const branchLen = 0.5 + Math.random() * 0.8;
                    const branch = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.03, 0.05, branchLen, 4),
                        branchMat
                    );
                    const angle = (b / branchCount) * Math.PI * 2 + Math.random() * 0.5;
                    const tilt = 0.5 + Math.random() * 0.5;
                    branch.position.set(
                        x + Math.cos(angle) * 0.3,
                        y + actualHeight - 0.2 + Math.sin(tilt) * 0.3,
                        z + Math.sin(angle) * 0.3
                    );
                    branch.rotation.set(tilt, angle, 0);
                    branch.castShadow = false;
                    this.scene.add(branch);
                }
            } else {
                // 断裂树桩旁的倒木
                const fallen = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.1, 0.2, 2 + Math.random() * 1.5, 6),
                    deadTrunkMat
                );
                const angle = Math.random() * Math.PI * 2;
                fallen.position.set(
                    x + Math.cos(angle) * 1.5,
                    y + 0.15,
                    z + Math.sin(angle) * 1.5
                );
                fallen.rotation.z = Math.PI / 2;
                fallen.rotation.y = angle;
                fallen.castShadow = false;
                fallen.receiveShadow = false;
                this.scene.add(fallen);
            }
        }
    }
}

