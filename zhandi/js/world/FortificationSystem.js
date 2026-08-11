import * as THREE from 'three';
import { CONFIG } from '../config.js?v=20260811.1';

export class FortificationSystem {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.world = options.world || null;
        this.destructibles = options.destructibles || null;
        this.hud = options.hud || null;
        this.input = options.input || null;
        this.getPlayer = options.getPlayer || (() => null);
        this.getWeapon = options.getWeapon || (() => null);
        this.getBots = options.getBots || (() => []);
        this.getVehicles = options.getVehicles || (() => []);
        this.getPlayerClass = options.getPlayerClass || (() => null);
        this.isExecutionActive = options.isExecutionActive || (() => false);
        this.applyShadows = options.applyShadows || null;
        this.audio = options.audio || null;

        this.config = CONFIG.FORTIFICATIONS;
        this.active = false;
        this.selectedType = 'sandbag';
        this.yawOffset = 0;
        this.cooldown = 0;
        this.items = [];
        this._nextId = 1;
        this._validationTimer = 0;
        this._valid = false;
        this._reason = '';
        this._groundY = 0;
        this._lastReasonNotice = '';
        this._lastReasonTime = -Infinity;
        this._resources = this._createResources();
        this._previewGroups = new Map();
        this._previewRoot = this._createPreview();
        this._tmpPosition = new THREE.Vector3();
        this._tmpSamples = Array.from({ length: 9 }, () => new THREE.Vector3());
        this._hudKey = '';
    }

    bindWorld(world, destructibles) {
        this.clear();
        this.world = world;
        this.destructibles = destructibles;
    }

    enter() {
        if (this.active) {
            this.cancel();
            return true;
        }
        const reason = this._getStateBlockReason();
        if (reason) {
            this._notify(reason);
            return true;
        }
        this.active = true;
        this.yawOffset = 0;
        this._validationTimer = 0;
        this._previewRoot.visible = true;
        this._syncPreviewType();
        this._stopWeaponInput();
        this._updateHud(true);
        return true;
    }

    cancel() {
        if (!this.active) return false;
        this.active = false;
        this.input?.clearMouseButtons?.();
        this._previewRoot.visible = false;
        this._valid = false;
        this._reason = '';
        this._updateHud(true);
        return true;
    }

    handleKeyDown(code) {
        if (code === 'Digit4') return this.enter();
        if (!this.active) return false;

        const typeByKey = {
            Digit1: 'sandbag',
            Digit2: 'wire',
            Digit3: 'hedgehog',
        };
        if (typeByKey[code]) {
            this.selectedType = typeByKey[code];
            this._validationTimer = 0;
            this._syncPreviewType();
            this._updateHud(true);
            return true;
        }
        if (code === 'Escape') {
            this.cancel();
            return true;
        }
        return true;
    }

    update(dt) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        let consumedBuildInput = false;

        if (this.active) {
            consumedBuildInput = true;
            const blocked = this._getStateBlockReason();
            if (blocked) {
                this.cancel();
                return { wasActive: true, placed: false };
            }

            const wheel = this.input?.getWheelDelta?.() || 0;
            if (wheel !== 0) {
                this.yawOffset += Math.sign(wheel) * this.config.rotationStep;
                this.yawOffset = THREE.MathUtils.euclideanModulo(this.yawOffset + Math.PI, Math.PI * 2) - Math.PI;
                this._validationTimer = 0;
            }

            this._updatePreviewTransform();
            this._validationTimer -= dt;
            if (this._validationTimer <= 0) {
                this._validationTimer = this.config.validationInterval;
                const result = this._validatePlacement();
                this._valid = result.valid;
                this._reason = result.reason;
                this._groundY = result.groundY;
                this._previewRoot.position.y = this._groundY;
                this._applyPreviewColor(this._valid);
            }

            if (this.input?.consumeMousePressed?.(2)) {
                this.input.clearMouseButtons?.();
                this.cancel();
                return { wasActive: true, placed: false };
            }

            if (this.input?.consumeMousePressed?.(0)) {
                if (this._valid) {
                    this._placeSelected();
                    this.input.clearMouseButtons?.();
                    this.cancel();
                    return { wasActive: true, placed: true };
                }
                this._notifyInvalidReason();
            }
            this._stopWeaponInput();
        }

        this._updateHud(false);
        return { wasActive: consumedBuildInput, placed: false };
    }

    getHudState() {
        const cfg = this.config.types[this.selectedType];
        const count = this.items.reduce((total, item) => total + (item.type === this.selectedType ? 1 : 0), 0);
        return {
            visible: this.getPlayerClass() === 'engineer',
            active: this.active,
            selectedType: this.selectedType,
            name: cfg?.name || '',
            count,
            maxCount: cfg?.maxCount || 0,
            cooldown: this.cooldown,
            valid: this._valid,
            reason: this._reason,
        };
    }

    clear() {
        this.cancel();
        for (let i = this.items.length - 1; i >= 0; i--) {
            this._removeItem(this.items[i], false);
        }
        this.items.length = 0;
        this.cooldown = 0;
        this._nextId = 1;
        this._updateHud(true);
    }

    dispose() {
        this.clear();
        if (this._previewRoot?.parent) this._previewRoot.parent.remove(this._previewRoot);
        for (const geometry of Object.values(this._resources.geometries)) geometry.dispose();
        for (const material of Object.values(this._resources.materials)) material.dispose();
        this._resources.previewValid.dispose();
        this._resources.previewInvalid.dispose();
        this._previewGroups.clear();
    }

    _getStateBlockReason() {
        const player = this.getPlayer();
        if (this.getPlayerClass() !== 'engineer') return '仅工程兵可以建造工事';
        if (!player?.alive || player.downed) return '当前状态无法建造';
        if (player.inVehicle) return '载具内无法建造';
        if (player._executionLock || this.isExecutionActive()) return '处决期间无法建造';
        if (player.isDragging?.()) return '拖拽队友时无法建造';
        if (player._climbing || !player.onGround) return '站稳后才能建造';
        return '';
    }

    _updatePreviewTransform() {
        const player = this.getPlayer();
        if (!player) return;
        const yaw = player.yaw || 0;
        const dist = this.config.placeDistance;
        this._previewRoot.position.set(
            player.position.x - Math.sin(yaw) * dist,
            this._groundY,
            player.position.z - Math.cos(yaw) * dist
        );
        this._previewRoot.rotation.y = yaw + this.yawOffset;
    }

    _validatePlacement() {
        const player = this.getPlayer();
        const cfg = this.config.types[this.selectedType];
        if (!player || !cfg || !this.world) return { valid: false, reason: '无法读取建造位置', groundY: 0 };
        if (this.cooldown > 0) {
            return { valid: false, reason: `建造冷却 ${this.cooldown.toFixed(1)}s`, groundY: this._groundY };
        }

        const x = this._previewRoot.position.x;
        const z = this._previewRoot.position.z;
        const yaw = this._previewRoot.rotation.y;
        const halfMap = (this.world.mapConfig?.size || CONFIG.WORLD.size) / 2 - this.config.boundaryPadding;
        if (Math.abs(x) + cfg.width / 2 > halfMap || Math.abs(z) + cfg.width / 2 > halfMap) {
            return { valid: false, reason: '超出战场边界', groundY: this.world.getHeight(x, z) };
        }

        const heights = this._sampleFootprint(x, z, yaw, cfg.width, cfg.depth);
        let minY = Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < heights.length; i++) {
            minY = Math.min(minY, heights[i]);
            maxY = Math.max(maxY, heights[i]);
        }
        const groundY = maxY - 0.03;
        if (this.world.isUnderwater?.(x, z, minY)) {
            return { valid: false, reason: '水中无法建造', groundY };
        }
        if (maxY - minY > cfg.maxGroundDelta) {
            return { valid: false, reason: '地面过于陡峭', groundY };
        }

        if (this.world.obstacles?.hasFootprintOverlap?.(x, z, cfg.width, cfg.depth, yaw, groundY, cfg.height, 0.12)) {
            return { valid: false, reason: '位置被障碍物占用', groundY };
        }
        if (this._overlapsCharacters(x, z, yaw, cfg.width, cfg.depth)) {
            return { valid: false, reason: '有人阻挡建造位置', groundY };
        }
        if (this._overlapsVehicles(x, z, yaw, cfg.width, cfg.depth, groundY, cfg.height)) {
            return { valid: false, reason: '载具阻挡建造位置', groundY };
        }
        return { valid: true, reason: '位置可建造', groundY };
    }

    _sampleFootprint(x, z, yaw, width, depth) {
        const cos = Math.cos(yaw);
        const sin = Math.sin(yaw);
        const hx = width * 0.46;
        const hz = depth * 0.46;
        const offsets = [
            [0, 0], [-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz],
            [-hx, 0], [hx, 0], [0, -hz], [0, hz],
        ];
        const heights = this._heightSamples || (this._heightSamples = new Float32Array(9));
        for (let i = 0; i < offsets.length; i++) {
            const lx = offsets[i][0];
            const lz = offsets[i][1];
            const sx = x + lx * cos + lz * sin;
            const sz = z - lx * sin + lz * cos;
            heights[i] = this.world.getHeight(sx, sz);
        }
        return heights;
    }

    _overlapsCharacters(x, z, yaw, width, depth) {
        const player = this.getPlayer();
        if (player && this._pointOverlapsFootprint(player.position, 0.55, x, z, yaw, width, depth)) return true;
        for (const bot of this.getBots()) {
            if (!bot || (!bot.alive && !bot.downed)) continue;
            if (this._pointOverlapsFootprint(bot.position, 0.55, x, z, yaw, width, depth)) return true;
        }
        return false;
    }

    _pointOverlapsFootprint(point, radius, x, z, yaw, width, depth) {
        const dx = point.x - x;
        const dz = point.z - z;
        const cos = Math.cos(yaw);
        const sin = Math.sin(yaw);
        const lx = dx * cos - dz * sin;
        const lz = dx * sin + dz * cos;
        return Math.abs(lx) < width / 2 + radius && Math.abs(lz) < depth / 2 + radius;
    }

    _overlapsVehicles(x, z, yaw, width, depth, groundY, height) {
        for (const vehicle of this.getVehicles()) {
            if (!vehicle?.alive || !vehicle.position || !vehicle.model) continue;
            const def = this.world._getVehicleCollisionDef?.(vehicle) || { w: 2.4, d: 4, h: 2.2 };
            if (groundY + height <= vehicle.position.y || groundY >= vehicle.position.y + def.h) continue;
            if (this._obbOverlap(x, z, width, depth, yaw, vehicle.position.x, vehicle.position.z, def.w, def.d, vehicle.yaw || 0, 0.15)) {
                return true;
            }
        }
        return false;
    }

    _obbOverlap(ax, az, aw, ad, ayaw, bx, bz, bw, bd, byaw, padding = 0) {
        const a0x = Math.cos(ayaw), a0z = -Math.sin(ayaw);
        const a1x = Math.sin(ayaw), a1z = Math.cos(ayaw);
        const b0x = Math.cos(byaw), b0z = -Math.sin(byaw);
        const b1x = Math.sin(byaw), b1z = Math.cos(byaw);
        const dx = bx - ax, dz = bz - az;
        const axes = [[a0x, a0z], [a1x, a1z], [b0x, b0z], [b1x, b1z]];
        const ahw = aw / 2 + padding, ahd = ad / 2 + padding;
        const bhw = bw / 2 + padding, bhd = bd / 2 + padding;
        for (const [ux, uz] of axes) {
            const dist = Math.abs(dx * ux + dz * uz);
            const ra = ahw * Math.abs(a0x * ux + a0z * uz) + ahd * Math.abs(a1x * ux + a1z * uz);
            const rb = bhw * Math.abs(b0x * ux + b0z * uz) + bhd * Math.abs(b1x * ux + b1z * uz);
            if (dist >= ra + rb) return false;
        }
        return true;
    }

    _placeSelected() {
        const cfg = this.config.types[this.selectedType];
        const sameType = this.items.filter(item => item.type === this.selectedType);
        if (sameType.length >= cfg.maxCount) this._removeItem(sameType[0], false);

        const root = this._createVisual(this.selectedType, false);
        root.position.copy(this._previewRoot.position);
        root.rotation.y = this._previewRoot.rotation.y;
        root.userData.fortificationVisual = true;
        this.scene.add(root);
        this.applyShadows?.(root);

        const proxyGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
        const proxyMat = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
            colorWrite: false,
        });
        const proxy = new THREE.Mesh(proxyGeo, proxyMat);
        proxy.position.set(root.position.x, root.position.y + cfg.height / 2, root.position.z);
        proxy.rotation.y = root.rotation.y;
        proxy.userData.destructibleType = this.selectedType === 'wire' ? 'fence' :
            this.selectedType === 'hedgehog' ? 'wall' : 'sandbag';
        proxy.userData.noShadow = true;
        this.scene.add(proxy);

        const collisionBox = this.world.obstacles.addCollisionBox(
            root.position.x,
            root.position.y,
            root.position.z,
            cfg.width,
            cfg.height,
            cfg.depth,
            proxy,
            root.rotation.y
        );
        const item = {
            id: this._nextId++,
            type: this.selectedType,
            root,
            proxy,
            collisionBox,
            materials: this._collectUniqueMaterials(root),
            deformed: false,
        };
        proxy.userData.fortificationItem = item;
        this.items.push(item);

        this.destructibles?.register(proxy, {
            health: cfg.health,
            armorMultiplier: cfg.armorMultiplier,
            breakType: cfg.breakType,
            type: this.selectedType === 'wire' ? 'fence' :
                this.selectedType === 'hedgehog' ? 'wall' : 'sandbag',
            onDestroy: () => this._onDestroyed(item),
        });
        this.world.invalidateMeshCaches?.();
        this.cooldown = this.config.cooldown;
        this._notify(`已建造${cfg.name}`);
        this.audio?.playUISound?.('click');
    }

    _onDestroyed(item) {
        if (!this.items.includes(item)) return;
        if (item.type === 'sandbag' && !item.deformed) {
            item.deformed = true;
            item.root.scale.y *= 0.4;
            item.root.position.y -= 0.03;
            for (const material of item.materials) {
                material.color?.multiplyScalar?.(0.6);
                material.emissive?.setHex?.(0x000000);
            }
            const box = item.collisionBox;
            if (box) {
                box.max.y = box.y + box.height;
                item.proxy.position.y = box.y + box.height / 2;
            }
            this.world.invalidateMeshCaches?.();
            return;
        }
        this._removeItem(item, true);
    }

    _removeItem(item, proxyAlreadyDestroyed) {
        const idx = this.items.indexOf(item);
        if (idx < 0) return;
        this.destructibles?.unregister?.(item.proxy);
        this.world?.obstacles?.removeCollisionForMesh?.(item.proxy);
        if (item.root?.parent) item.root.parent.remove(item.root);
        for (const material of item.materials || []) material.dispose();
        if (!proxyAlreadyDestroyed) {
            if (item.proxy?.parent) item.proxy.parent.remove(item.proxy);
            item.proxy?.geometry?.dispose?.();
            item.proxy?.material?.dispose?.();
        }
        this.items.splice(idx, 1);
        this.world?.invalidateMeshCaches?.();
    }

    _createResources() {
        const geometries = {
            bag: new THREE.CapsuleGeometry(0.22, 0.42, 3, 8),
            post: new THREE.CylinderGeometry(0.055, 0.075, 1.15, 6),
            wire: new THREE.CylinderGeometry(0.016, 0.016, 3.05, 5),
            coil: new THREE.TorusGeometry(0.34, 0.018, 4, 8),
            beam: new THREE.BoxGeometry(1.8, 0.16, 0.16),
            brace: new THREE.BoxGeometry(1.4, 0.12, 0.12),
        };
        const materials = {
            sandbag: new THREE.MeshStandardMaterial({ color: 0x75684c, roughness: 0.98 }),
            wire: new THREE.MeshStandardMaterial({ color: 0x4b4c47, roughness: 0.72, metalness: 0.62 }),
            hedgehog: new THREE.MeshStandardMaterial({ color: 0x4c504f, roughness: 0.78, metalness: 0.68 }),
        };
        return {
            geometries,
            materials,
            previewValid: new THREE.MeshBasicMaterial({ color: 0x3dff78, transparent: true, opacity: 0.38, depthWrite: false }),
            previewInvalid: new THREE.MeshBasicMaterial({ color: 0xff3d3d, transparent: true, opacity: 0.42, depthWrite: false }),
        };
    }

    _createPreview() {
        const root = new THREE.Group();
        for (const type of Object.keys(this.config.types)) {
            const group = this._createVisual(type, true);
            group.visible = type === this.selectedType;
            root.add(group);
            this._previewGroups.set(type, group);
        }
        root.visible = false;
        this.scene.add(root);
        return root;
    }

    _createVisual(type, preview) {
        const group = new THREE.Group();
        const material = preview ? this._resources.previewInvalid : this._resources.materials[type].clone();
        const addMesh = (geometry, position, rotation = null, scale = null) => {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(position[0], position[1], position[2]);
            if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
            if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
            mesh.castShadow = !preview;
            mesh.receiveShadow = !preview;
            group.add(mesh);
            return mesh;
        };

        if (type === 'sandbag') {
            for (let i = 0; i < 3; i++) addMesh(this._resources.geometries.bag, [(i - 1) * 0.84, 0.24, 0], [0, 0, Math.PI / 2], [1.08, 1, 1.35]);
            for (let i = 0; i < 2; i++) addMesh(this._resources.geometries.bag, [(i - 0.5) * 0.84, 0.69, 0], [0, 0, Math.PI / 2], [1.08, 1, 1.35]);
        } else if (type === 'wire') {
            addMesh(this._resources.geometries.post, [-1.48, 0.55, 0]);
            addMesh(this._resources.geometries.post, [1.48, 0.55, 0]);
            for (const y of [0.28, 0.58, 0.88]) addMesh(this._resources.geometries.wire, [0, y, 0], [0, 0, Math.PI / 2]);
            for (let i = -3; i <= 3; i++) addMesh(this._resources.geometries.coil, [i * 0.46, 0.52, 0], [0, Math.PI / 2, 0]);
        } else {
            addMesh(this._resources.geometries.beam, [0, 0.75, 0], [0, 0, Math.PI / 4]);
            addMesh(this._resources.geometries.beam, [0, 0.75, 0], [0, 0, -Math.PI / 4]);
            addMesh(this._resources.geometries.beam, [0, 0.75, 0], [0, Math.PI / 2, Math.PI / 4]);
            addMesh(this._resources.geometries.brace, [0, 0.3, 0], [0, Math.PI / 4, 0]);
        }
        return group;
    }

    _syncPreviewType() {
        for (const [type, group] of this._previewGroups) group.visible = type === this.selectedType;
        this._applyPreviewColor(this._valid);
    }

    _applyPreviewColor(valid) {
        const material = valid ? this._resources.previewValid : this._resources.previewInvalid;
        for (const group of this._previewGroups.values()) {
            group.traverse(child => {
                if (child.isMesh) child.material = material;
            });
        }
    }

    _collectUniqueMaterials(root) {
        const materials = new Set();
        root.traverse(child => {
            if (!child.isMesh || !child.material) return;
            if (Array.isArray(child.material)) child.material.forEach(material => materials.add(material));
            else materials.add(child.material);
        });
        return [...materials];
    }

    _stopWeaponInput() {
        const weapon = this.getWeapon();
        weapon?.stopFire?.();
        weapon?.setAiming?.(false);
    }

    _notifyInvalidReason() {
        const now = performance.now() / 1000;
        if (this._reason === this._lastReasonNotice && now - this._lastReasonTime < 0.8) return;
        this._lastReasonNotice = this._reason;
        this._lastReasonTime = now;
        this._notify(this._reason || '此处无法建造');
    }

    _notify(text) {
        this.hud?.showNotification?.(text, 1.4);
    }

    _updateHud(force) {
        const state = this.getHudState();
        const key = `${state.visible}|${state.active}|${state.selectedType}|${state.count}|${state.maxCount}|${Math.ceil(state.cooldown * 10)}|${state.valid}|${state.reason}`;
        if (!force && key === this._hudKey) return;
        this._hudKey = key;
        this.hud?.updateFortification?.(state);
    }
}
