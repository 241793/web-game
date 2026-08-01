// 可破坏实体注册表 - 统一管理可破坏物体的伤害分发与视觉效果
import * as THREE from 'three';

export class DestructibleRegistry {
    constructor(scene) {
        this.scene = scene;
        this.entities = new Map(); // mesh.uuid -> entity config
        this._debrisGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        this._tmpVec = new THREE.Vector3();
        this._tmpVec2 = new THREE.Vector3();
        // 共享粒子材质（按类型缓存，避免每粒子分配）
        this._sharedMats = new Map();
        // 倒塌动画实体
        this._collapsing = [];
    }

    _getParticleMat(type) {
        if (!this._sharedMats.has(type)) {
            const color = type === 'sandbag' ? 0x8a7a5a
                : type === 'crate' ? 0x8a6a3a
                : type === 'building' ? 0x9a8a7a
                : type === 'wall' ? 0x8a857a
                : 0xaaaaaa;
            this._sharedMats.set(type, new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.85,
            }));
        }
        // 返回克隆（粒子需要独立 opacity 淡出）
        return this._sharedMats.get(type).clone();
    }

    // 注册可破坏实体
    register(mesh, config) {
        if (!mesh) return;
        const entity = {
            mesh: mesh,
            health: config.health || 100,
            maxHealth: config.health || 100,
            armorMultiplier: config.armorMultiplier || 1.0,
            breakType: config.breakType || 'shatter',
            type: config.type || 'generic',
            onDestroy: config.onDestroy || null,
            destroyed: false,
            deformed: false,  // 变形标记（deform 类型用）
        };
        mesh.userData.destructible = true;
        mesh.userData.destructibleType = config.type;
        this.entities.set(mesh.uuid, entity);
    }

    // 对单个实体施加伤害
    applyDamage(mesh, amount, hitPoint, weaponConfig) {
        if (!mesh) return false;
        const entity = this.entities.get(mesh.uuid);
        if (!entity || entity.destroyed) return false;

        const effectiveDamage = amount * (entity.armorMultiplier || 1.0);
        entity.health -= effectiveDamage;

        // 受击粒子效果
        const worldPos = hitPoint ? hitPoint.clone() : this._getWorldPos(entity.mesh);
        this._spawnImpactParticles(worldPos, entity.type);

        if (entity.health <= 0) {
            this._destroyEntity(entity, hitPoint);
            return true;
        }
        return false;
    }

    // 对范围内所有可破坏实体施加 AoE 伤害
    applyRadiusDamage(position, radius, amount, source, weaponConfig) {
        const destroyed = [];
        for (const [uuid, entity] of this.entities) {
            if (entity.destroyed) continue;
            // 使用世界坐标计算距离（修复子级 mesh 的局部坐标问题）
            const worldPos = this._getWorldPos(entity.mesh);
            const dist = worldPos.distanceTo(position);
            if (dist <= radius) {
                const damage = amount * (1 - dist / radius);
                if (this.applyDamage(entity.mesh, damage, worldPos.clone(), weaponConfig)) {
                    destroyed.push(entity);
                }
            }
        }
        return destroyed;
    }

    // 获取 mesh 的世界坐标（支持 Group 子级）
    _getWorldPos(mesh) {
        if (mesh.isObject3D) {
            mesh.getWorldPosition(this._tmpVec);
            return this._tmpVec.clone();
        }
        return mesh.position.clone();
    }

    // 摧毁实体 — 根据 breakType 分派不同效果
    _destroyEntity(entity, hitPoint) {
        entity.destroyed = true;
        entity.health = 0;
        const worldPos = this._getWorldPos(entity.mesh);

        switch (entity.breakType) {
            case 'collapse':
                this._collapseEntity(entity, worldPos);
                break;
            case 'deform':
                this._deformEntity(entity, worldPos);
                break;
            case 'shatter':
            default:
                this._shatterEntity(entity, worldPos);
                break;
        }

        // 调用销毁回调
        if (entity.onDestroy) {
            try { entity.onDestroy(entity); } catch (e) { /* 忽略回调错误 */ }
        }

        // 从注册表移除（deform 类型保留在场景中但标记已破坏）
        if (entity.breakType !== 'deform') {
            this.entities.delete(entity.mesh.uuid);
        }
    }

    // shatter: 碎裂消失（箱子、围墙、栅栏）—— 大量碎片飞溅
    _shatterEntity(entity, worldPos) {
        // 生成大量碎片
        this._spawnDebris(worldPos, entity.type, 12, 6);
        // 生成灰尘云
        this._spawnDustCloud(worldPos, entity.type);

        if (entity.mesh.parent) {
            entity.mesh.parent.remove(entity.mesh);
        }
        this._disposeObject3D(entity.mesh);
    }

    // collapse: 倒塌（建筑）—— 缓慢下沉+倾斜，最后消失
    _collapseEntity(entity, worldPos) {
        // 生成大量碎屑和灰尘
        this._spawnDebris(worldPos, entity.type, 20, 8);
        this._spawnDustCloud(worldPos, entity.type);

        // 启动倒塌动画
        entity._collapseTimer = 0;
        entity._collapseDuration = 1.2;
        entity._origScale = entity.mesh.scale.clone();
        entity._origPos = entity.mesh.position.clone();
        this._collapsing.push(entity);

        // 禁用碰撞（建筑倒下后不再阻挡）
        if (entity.mesh.userData.collisionBox) {
            const obs = this.scene.userData?.obstacles?.obstacles;
            // 通过 onDestroy 回调处理碰撞移除
        }
    }

    // deform: 变形（沙袋）—— 压扁变暗但保留在场景中提供低矮掩体
    _deformEntity(entity, worldPos) {
        if (entity.deformed) return;
        entity.deformed = true;

        // 生成少量碎屑
        this._spawnDebris(worldPos, entity.type, 5, 3);

        // 压扁并变暗
        const mesh = entity.mesh;
        if (mesh.scale) {
            mesh.scale.y *= 0.4;  // 高度压扁到 40%
        }
        // 材质变暗
        mesh.traverse?.((child) => {
            if (child.isMesh && child.material) {
                const mat = Array.isArray(child.material) ? child.material[0] : child.material;
                if (mat.color) {
                    mat.color.multiplyScalar(0.6);
                }
                if (mat.emissive) {
                    mat.emissive.setHex(0x000000);
                }
            }
        });
        if (mesh.material) {
            const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
            if (mat.color) mat.color.multiplyScalar(0.6);
        }

        // 降低碰撞盒高度
        if (mesh.userData.collisionBox) {
            mesh.userData.collisionBox.height *= 0.4;
        }
    }

    // 生成破坏碎屑
    _spawnDebris(position, type, count = 8, spread = 5) {
        for (let i = 0; i < count; i++) {
            const mat = this._getParticleMat(type);
            const particle = new THREE.Mesh(this._debrisGeo, mat);
            particle.position.copy(position);
            particle.position.y += 0.5 + Math.random() * 0.5;
            particle.scale.setScalar(0.3 + Math.random() * 0.5);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * spread,
                Math.random() * 4 + 2,
                (Math.random() - 0.5) * spread
            );
            particle.userData.velocity = vel;
            particle.userData.life = 0.8 + Math.random() * 0.6;
            particle.userData.maxLife = particle.userData.life;
            this.scene.add(particle);

            if (!this._particles) this._particles = [];
            this._particles.push(particle);
        }
    }

    // 生成灰尘云（爆炸/倒塌视觉效果）
    _spawnDustCloud(position, type) {
        const cloudColor = type === 'building' ? 0x9a8a7a
            : type === 'wall' ? 0x8a857a
            : type === 'sandbag' ? 0x9a8a6a
            : 0xaaaaaa;
        for (let i = 0; i < 6; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: cloudColor,
                transparent: true,
                opacity: 0.4,
                depthWrite: false,
            });
            const sphereGeo = new THREE.SphereGeometry(0.5 + Math.random() * 0.8, 6, 4);
            const cloud = new THREE.Mesh(sphereGeo, mat);
            cloud.position.copy(position);
            cloud.position.y += 0.5 + Math.random() * 1.5;
            cloud.position.x += (Math.random() - 0.5) * 2;
            cloud.position.z += (Math.random() - 0.5) * 2;

            cloud.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                Math.random() * 1.5 + 0.5,
                (Math.random() - 0.5) * 1.5
            );
            cloud.userData.life = 1.5 + Math.random() * 0.8;
            cloud.userData.maxLife = cloud.userData.life;
            cloud.userData.isSmoke = true;
            cloud.userData.expandRate = 1.5 + Math.random();
            this.scene.add(cloud);

            if (!this._particles) this._particles = [];
            this._particles.push(cloud);
        }
    }

    // 生成受击粒子（火花/碎屑）
    _spawnImpactParticles(position, type) {
        const particleCount = 3;
        for (let i = 0; i < particleCount; i++) {
            const mat = this._getParticleMat(type);
            const particle = new THREE.Mesh(this._debrisGeo, mat);
            particle.position.copy(position);
            particle.scale.setScalar(0.25 + Math.random() * 0.25);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 2 + 1,
                (Math.random() - 0.5) * 3
            );
            particle.userData.velocity = vel;
            particle.userData.life = 0.4 + Math.random() * 0.3;
            particle.userData.maxLife = particle.userData.life;
            this.scene.add(particle);

            if (!this._particles) this._particles = [];
            this._particles.push(particle);
        }
    }

    // 更新粒子动画和倒塌动画
    update(dt) {
        // 粒子更新
        if (this._particles) {
            for (let i = this._particles.length - 1; i >= 0; i--) {
                const p = this._particles[i];
                p.userData.life -= dt;
                if (p.userData.life <= 0) {
                    this.scene.remove(p);
                    if (p.material) p.material.dispose();
                    if (p.geometry && p.userData.isSmoke) p.geometry.dispose();
                    this._particles.splice(i, 1);
                    continue;
                }
                // 重力（灰尘云不受重力影响，向上飘）
                if (!p.userData.isSmoke) {
                    p.userData.velocity.y -= 15 * dt;
                } else {
                    p.userData.velocity.y *= 0.98;  // 灰尘减速
                    // 灰尘膨胀
                    const expand = 1 + p.userData.expandRate * dt;
                    p.scale.multiplyScalar(expand);
                }
                p.position.addScaledVector(p.userData.velocity, dt);
                // 淡出
                p.material.opacity = p.userData.life / p.userData.maxLife * (p.userData.isSmoke ? 0.4 : 0.9);
            }
        }

        // 倒塌动画更新
        for (let i = this._collapsing.length - 1; i >= 0; i--) {
            const entity = this._collapsing[i];
            entity._collapseTimer += dt;
            const t = Math.min(1, entity._collapseTimer / entity._collapseDuration);
            const mesh = entity.mesh;

            // 下沉 + 倾斜 + 缩小
            if (mesh.position && entity._origPos) {
                mesh.position.y = entity._origPos.y - t * 3;
            }
            if (mesh.scale && entity._origScale) {
                const s = 1 - t * 0.7;
                mesh.scale.set(entity._origScale.x * s, entity._origScale.y * (1 - t * 0.9), entity._origScale.z * s);
            }
            if (mesh.rotation) {
                mesh.rotation.z = t * 0.3 * (entity._tiltDir || 1);
                mesh.rotation.x = t * 0.15;
            }

            if (t >= 1) {
                // 倒塌完成：移除 mesh
                if (mesh.parent) mesh.parent.remove(mesh);
                this._disposeObject3D(mesh);
                this._collapsing.splice(i, 1);
            }
        }
    }

    // 释放 Object3D 及其子级的几何体和材质
    _disposeObject3D(obj) {
        if (!obj) return;
        obj.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => {
                            if (!m.userData?.sharedProcedural) m.dispose();
                        });
                    } else if (!child.material.userData?.sharedProcedural) {
                        child.material.dispose();
                    }
                }
            }
        });
    }

    unregister(mesh) {
        if (!mesh) return false;
        const removed = this.entities.delete(mesh.uuid);
        if (mesh.userData) {
            delete mesh.userData.destructible;
            delete mesh.userData.destructibleType;
        }
        return removed;
    }

    isDestructible(mesh) {
        return mesh && this.entities.has(mesh.uuid);
    }

    clear() {
        // 1. 先释放倒塌动画中的 mesh（它们持有独立几何体）
        for (const entity of this._collapsing) {
            if (entity.mesh && entity.mesh.parent) {
                entity.mesh.parent.remove(entity.mesh);
                this._disposeObject3D(entity.mesh);
            }
        }
        this._collapsing = [];

        // 2. 清理粒子（独立几何体和克隆材质）
        if (this._particles) {
            for (const p of this._particles) {
                this.scene.remove(p);
                if (p.material) p.material.dispose();
                if (p.geometry && p.userData.isSmoke) p.geometry.dispose();
            }
            this._particles = [];
        }

        // 3. 清空注册表（不 dispose 共享 _debrisGeo / _sharedMats，由 dispose() 统一释放）
        this.entities.clear();
    }

    dispose() {
        this.clear();
        this._debrisGeo?.dispose?.();
        this._debrisGeo = null;
        for (const mat of this._sharedMats.values()) mat?.dispose?.();
        this._sharedMats.clear();
    }
}
