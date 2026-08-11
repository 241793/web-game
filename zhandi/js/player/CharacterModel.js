import * as THREE from 'three';
import { CONFIG } from '../config.js?v=20260811.1';
import { createProceduralMaterial, createSvgCanvasTexture } from '../utils/VisualAssets.js?v=20260801.2';

const _svgTextureCache = new Map();
const _svgMaterialCache = new Map();

function _hexToCss(hex) {
    return `#${(Number(hex) >>> 0).toString(16).padStart(6, '0')}`;
}

function _svgTexture(key, svg) {
    if (_svgTextureCache.has(key)) return _svgTextureCache.get(key);
    const texture = createSvgCanvasTexture(svg, 256);
    if (!texture) return null;
    texture.userData.sharedProcedural = true;
    _svgTextureCache.set(key, texture);
    return texture;
}

function _svgDecalMaterial(key, svg, options = {}) {
    const cacheKey = JSON.stringify([key, options.opacity ?? 1, options.depthTest ?? true]);
    if (_svgMaterialCache.has(cacheKey)) return _svgMaterialCache.get(cacheKey);
    const material = new THREE.MeshBasicMaterial({
        map: _svgTexture(key, svg),
        transparent: true,
        opacity: options.opacity ?? 1,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: options.depthTest ?? true,
    });
    material.userData.sharedProcedural = true;
    _svgMaterialCache.set(cacheKey, material);
    return material;
}

function _addSvgDecal(parent, name, width, height, pos, rot, material) {
    if (!parent) return null;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.name = name;
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    parent.add(mesh);
    return mesh;
}

function _classInsigniaSvg(classType, accentColor) {
    const accent = _hexToCss(accentColor);
    const dim = '#0b0d0c';
    if (classType === 'medic') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="18" fill="${dim}" fill-opacity=".62"/><path d="M53 18h22v35h35v22H75v35H53V75H18V53h35z" fill="#f7f7f0"/><path d="M18 108h92" stroke="${accent}" stroke-width="8" stroke-linecap="round"/></svg>`;
    }
    if (classType === 'engineer') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="18" fill="${dim}" fill-opacity=".62"/><path d="M82 17a28 28 0 0 0-34 34L17 82l29 29 31-31a28 28 0 0 0 34-34L93 64 64 35z" fill="${accent}"/><path d="M36 87l50-50M47 98l50-50" stroke="#151515" stroke-width="8" stroke-linecap="round"/></svg>`;
    }
    if (classType === 'sniper') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="18" fill="${dim}" fill-opacity=".62"/><circle cx="64" cy="64" r="38" fill="none" stroke="${accent}" stroke-width="10"/><path d="M64 18v28M64 82v28M18 64h28M82 64h28" stroke="#e9f0df" stroke-width="8" stroke-linecap="round"/><circle cx="64" cy="64" r="8" fill="#e9f0df"/></svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="18" fill="${dim}" fill-opacity=".62"/><path d="M64 18 104 48 64 110 24 48z" fill="${accent}"/><path d="M42 52h44M48 70h32" stroke="#191919" stroke-width="10" stroke-linecap="round"/><path d="M64 18v92" stroke="#f5e4b8" stroke-width="7" stroke-linecap="round"/></svg>`;
}

function _teamPatchSvg(teamColor, label) {
    const team = _hexToCss(teamColor);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 90"><rect width="180" height="90" rx="12" fill="#0b0d0c" fill-opacity=".72"/><path d="M90 9 156 31v23c0 27-27 44-66 28-39 16-66-1-66-28V31z" fill="${team}"/><path d="M37 35h106M47 55h86" stroke="#ffffff" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/><text x="90" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#07100e">${label}</text></svg>`;
}

function _faceSvg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 96"><path d="M23 64c10 18 72 18 82 0v19H23z" fill="#171717" fill-opacity=".75"/><path d="M25 28h78v22H25z" fill="#0e2a35" fill-opacity=".88"/><path d="M32 34h27M70 34h27" stroke="#8fd6ff" stroke-width="6" stroke-linecap="round" stroke-opacity=".8"/><path d="M52 72c7 5 17 5 24 0" stroke="#2a1b18" stroke-width="5" stroke-linecap="round"/></svg>`;
}

// 角色模型构建器 - 构建士兵3D模型
export class CharacterModel {
    static build(team, classType = 'assault') {
        const group = new THREE.Group();
        group.userData.character = true;

        const teamColor = team === 0 ? CONFIG.TEAMS.friendly.color : CONFIG.TEAMS.enemy.color;
        // 不同队伍的制服颜色
        const uniformColor = team === 0 ? 0x2a4a3a : 0x4a2a2a;
        const vestColor = team === 0 ? 0x1a3a2a : 0x3a1a1a;
        // 不同兵种的装备配色
        const classAccent = {
            assault: 0xcc8800,    // 橙色 - 突击
            medic: 0xffffff,      // 白色 - 医疗
            engineer: 0xcc6600,   // 橘红 - 工程
            sniper: 0x3a5a2a,     // 暗绿 - 狙击
        };
        const accentColor = classAccent[classType] || 0xcc8800;

        // 材质
        const matSkin = new THREE.MeshStandardMaterial({ color: 0xcc9966, roughness: 0.8 });
        const matUniform = createProceduralMaterial('camo', {
            baseColor: uniformColor,
            accentColor: team === 0 ? 0x1d3327 : 0x332121,
            detailColor: 0x6f7f6f,
            size: 256,
            repeatX: 4,
            repeatY: 4,
            anisotropy: 8,
        }, { roughness: 0.94, bumpScale: 0.018, useBump: true });
        const matVest = createProceduralMaterial('fabric', {
            baseColor: vestColor,
            accentColor: 0x111111,
            detailColor: 0x555555,
            size: 256,
            repeatX: 3,
            repeatY: 3,
            anisotropy: 8,
        }, { roughness: 0.8, metalness: 0.12, bumpScale: 0.018, useBump: true });
        const matHelmet = createProceduralMaterial('metal', {
            baseColor: uniformColor,
            accentColor: 0x202020,
            detailColor: 0x8f9a8f,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 8,
        }, { roughness: 0.62, metalness: 0.28, bumpScale: 0.012, useBump: true });
        const matBoot = createProceduralMaterial('rubber', {
            baseColor: 0x1a1a1a,
            accentColor: 0x050505,
            detailColor: 0x555555,
            size: 192,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 6,
        }, { roughness: 0.88, metalness: 0.08, bumpScale: 0.03 });
        const matHands = new THREE.MeshStandardMaterial({ color: 0xcc9966, roughness: 0.8 });
        const matAccent = createProceduralMaterial('metal', {
            baseColor: accentColor,
            accentColor: 0x202020,
            detailColor: 0xdddddd,
            size: 128,
            repeatX: 1,
            repeatY: 1,
            anisotropy: 4,
        }, { roughness: 0.48, metalness: 0.4, bumpScale: 0.02 });
        const matDark = createProceduralMaterial('metal', {
            baseColor: 0x111111,
            accentColor: 0x030303,
            detailColor: 0x444444,
            size: 128,
            repeatX: 1,
            repeatY: 1,
            anisotropy: 4,
        }, { roughness: 0.56, metalness: 0.36, bumpScale: 0.015 });
        const matRubber = createProceduralMaterial('rubber', {
            baseColor: 0x080808,
            accentColor: 0x020202,
            detailColor: 0x404040,
            size: 128,
            repeatX: 2,
            repeatY: 2,
            anisotropy: 4,
        }, { roughness: 0.86, metalness: 0.08, bumpScale: 0.018 });
        const matLens = new THREE.MeshBasicMaterial({
            color: 0x72d8df,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false,
        });

        // === 头部 ===
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 12, 10),
            matSkin
        );
        head.position.y = 1.6;
        head.castShadow = false;
        head.name = 'head';
        head.userData.bodyPart = 'head';
        group.add(head);

        // 头盔 - 更逼真的形状
        const helmet = new THREE.Mesh(
            new THREE.SphereGeometry(0.19, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
            matHelmet
        );
        helmet.position.y = 1.63;
        helmet.castShadow = false;
        helmet.name = 'helmet';
        group.add(helmet);

        // 头盔前沿（遮阳）
        const helmetBrim = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.02, 0.08),
            matHelmet
        );
        helmetBrim.position.set(0, 1.58, 0.14);
        group.add(helmetBrim);

        // 夜视仪支架（所有兵种都有）
        const nvMount = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.03, 0.04),
            matDark
        );
        nvMount.position.set(0, 1.72, 0.1);
        group.add(nvMount);

        const goggles = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.055, 0.035),
            matLens
        );
        goggles.position.set(0, 1.61, 0.145);
        group.add(goggles);

        const faceMask = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.09, 0.035),
            matRubber
        );
        faceMask.position.set(0, 1.52, 0.135);
        group.add(faceMask);

        const neck = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.08, 0.12, 8),
            matSkin
        );
        neck.position.y = 1.43;
        group.add(neck);

        // === 躯干 ===
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.45, 0.6, 0.25),
            matUniform
        );
        torso.position.y = 1.05;
        torso.castShadow = false;
        torso.name = 'torso';
        torso.userData.bodyPart = 'body';
        group.add(torso);

        // 防弹背心 - 更精细
        const vest = new THREE.Mesh(
            new THREE.BoxGeometry(0.48, 0.45, 0.28),
            matVest
        );
        vest.position.y = 1.1;
        vest.castShadow = false;
        vest.name = 'vest';
        vest.userData.bodyPart = 'body';
        group.add(vest);

        // 背心上的弹匣袋
        const pouch1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.08, 0.04),
            matDark
        );
        pouch1.position.set(-0.12, 1.05, 0.15);
        group.add(pouch1);
        const pouch2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.08, 0.04),
            matDark
        );
        pouch2.position.set(-0.04, 1.05, 0.15);
        group.add(pouch2);
        const pouch3 = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.08, 0.04),
            matDark
        );
        pouch3.position.set(0.04, 1.05, 0.15);
        group.add(pouch3);
        const pouch4 = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.08, 0.04),
            matDark
        );
        pouch4.position.set(0.12, 1.05, 0.15);
        group.add(pouch4);

        for (let side = -1; side <= 1; side += 2) {
            const shoulderPad = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 0.08, 0.18),
                matVest
            );
            shoulderPad.position.set(side * 0.31, 1.33, 0);
            shoulderPad.rotation.z = side * 0.08;
            group.add(shoulderPad);

            const vestStrap = new THREE.Mesh(
                new THREE.BoxGeometry(0.055, 0.48, 0.035),
                matDark
            );
            vestStrap.position.set(side * 0.15, 1.17, 0.16);
            vestStrap.rotation.z = side * 0.08;
            group.add(vestStrap);
        }

        const radio = new THREE.Mesh(
            new THREE.BoxGeometry(0.09, 0.16, 0.055),
            matDark
        );
        radio.position.set(0.27, 1.18, -0.15);
        group.add(radio);

        const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.38, 5),
            matDark
        );
        antenna.position.set(0.31, 1.42, -0.16);
        antenna.rotation.z = -0.12;
        group.add(antenna);

        // 背包
        const backpack = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.38, 0.15),
            matVest
        );
        backpack.position.set(0, 1.08, -0.2);
        backpack.castShadow = false;
        group.add(backpack);

        // 腰带
        const belt = new THREE.Mesh(
            new THREE.BoxGeometry(0.47, 0.06, 0.27),
            matDark
        );
        belt.position.y = 0.78;
        group.add(belt);

        // === 手臂 - 持枪姿态（双手握枪）===
        // 上臂
        const upperArmGeo = new THREE.BoxGeometry(0.1, 0.28, 0.1);
        // 左臂 - 前伸握护木
        const leftArm = new THREE.Mesh(upperArmGeo, matUniform);
        leftArm.position.set(-0.20, 1.16, -0.03);
        leftArm.rotation.x = -0.55;
        leftArm.rotation.z = 0.18;
        leftArm.castShadow = false;
        leftArm.name = 'leftArm';
        group.add(leftArm);

        // 右臂 - 前伸握握把/扳机
        const rightArm = new THREE.Mesh(upperArmGeo, matUniform);
        rightArm.position.set(0.18, 1.15, -0.02);
        rightArm.rotation.x = -0.4;
        rightArm.rotation.z = -0.12;
        rightArm.castShadow = false;
        rightArm.name = 'rightArm';
        group.add(rightArm);

        // 前臂 - 弯曲到枪的位置
        const forearmGeo = new THREE.BoxGeometry(0.09, 0.25, 0.09);
        const leftForearm = new THREE.Mesh(forearmGeo, matUniform);
        leftForearm.position.set(-0.10, 1.0, -0.26);
        leftForearm.rotation.x = -1.15;
        leftForearm.rotation.z = 0.12;
        leftForearm.name = 'leftForearm';
        group.add(leftForearm);

        const rightForearm = new THREE.Mesh(forearmGeo, matUniform);
        rightForearm.position.set(0.05, 0.98, -0.14);
        rightForearm.rotation.x = -0.75;
        rightForearm.rotation.z = -0.08;
        rightForearm.name = 'rightForearm';
        group.add(rightForearm);

        // 手 - 放在武器握把和护木上
        const handGeo = new THREE.SphereGeometry(0.06, 8, 6);
        // 左手 - 握护木（武器前方）
        const leftHand = new THREE.Mesh(handGeo, matHands);
        leftHand.position.set(-0.04, 0.98, -0.40);
        leftHand.name = 'leftHand';
        group.add(leftHand);

        const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.08), matRubber);
        leftGlove.position.set(-0.04, 0.965, -0.40);
        group.add(leftGlove);

        // 右手 - 握握把（武器后方）
        const rightHand = new THREE.Mesh(handGeo, matHands);
        rightHand.position.set(0.02, 0.92, -0.18);
        rightHand.name = 'rightHand';
        group.add(rightHand);

        const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.08), matRubber);
        rightGlove.position.set(0.02, 0.905, -0.18);
        group.add(rightGlove);

        // === 腿（枢轴层级：髋关节组→大腿+膝关节组→小腿+护膝+靴子）===
        // 旋转髋组＝整腿从髋部摆动，旋转膝组＝小腿连靴子弯曲——脚会真正抬离地面
        const upperLegGeo = new THREE.BoxGeometry(0.14, 0.4, 0.14);
        const lowerLegGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
        const kneePadGeo = new THREE.BoxGeometry(0.15, 0.08, 0.04);
        const bootGeo = new THREE.BoxGeometry(0.16, 0.1, 0.28);
        const matKnee = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });

        const buildLeg = (side, xOffset) => {
            // 髋枢轴（大腿顶端）
            const hip = new THREE.Group();
            hip.name = `${side}Leg`;
            hip.position.set(xOffset, 0.75, 0);

            const thigh = new THREE.Mesh(upperLegGeo, matUniform);
            thigh.position.set(0, -0.2, 0);
            thigh.castShadow = false;
            hip.add(thigh);

            // 膝枢轴（小腿顶端），挂在髋下
            const knee = new THREE.Group();
            knee.name = `${side}Calf`;
            knee.position.set(0, -0.375, 0);
            hip.add(knee);

            const calf = new THREE.Mesh(lowerLegGeo, matUniform);
            calf.position.set(0, -0.175, 0);
            knee.add(calf);

            const kneePad = new THREE.Mesh(kneePadGeo, matKnee);
            kneePad.position.set(0, 0.005, 0.08);
            knee.add(kneePad);

            const boot = new THREE.Mesh(bootGeo, matBoot);
            boot.name = `${side}Boot`;
            boot.position.set(0, -0.325, 0.06);
            knee.add(boot);

            group.add(hip);
            return { hip, knee, boot, kneePad };
        };

        const legL = buildLeg('left', -0.12);
        const legR = buildLeg('right', 0.12);
        const leftLeg = legL.hip, leftCalf = legL.knee, leftBoot = legL.boot, leftKnee = legL.kneePad;
        const rightLeg = legR.hip, rightCalf = legR.knee, rightBoot = legR.boot, rightKnee = legR.kneePad;

        this._addSoldierDetailKit(group, {
            matUniform,
            matVest,
            matHelmet,
            matBoot,
            matAccent,
            matDark,
            matRubber,
            matLens,
            classType,
            teamColor,
        });

        // === 团队标识 ===
        // 头顶标记
        const markerGeo = new THREE.ConeGeometry(0.12, 0.25, 4);
        const markerMat = new THREE.MeshBasicMaterial({
            color: team === 0 ? CONFIG.TEAMS.friendly.markerColor : CONFIG.TEAMS.enemy.markerColor,
            transparent: true,
            opacity: 0.9,
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.y = 2.05;
        marker.rotation.x = Math.PI;
        marker.name = 'teamMarker';
        group.add(marker);

        // 臂章
        const armbandGeo = new THREE.BoxGeometry(0.12, 0.08, 0.12);
        const armbandMat = new THREE.MeshBasicMaterial({ color: teamColor });
        const leftArmband = new THREE.Mesh(armbandGeo, armbandMat);
        leftArmband.position.set(-0.28, 1.22, 0);
        group.add(leftArmband);
        const rightArmband = new THREE.Mesh(armbandGeo, armbandMat);
        rightArmband.position.set(0.28, 1.22, 0);
        group.add(rightArmband);

        // === 兵种专属装备 ===
        this._addClassEquipment(group, classType, matVest, matAccent, matDark);

        // === 武器模型 ===
        const weapon = this._buildWeaponModel(classType);
        weapon.name = 'weapon';
        group.add(weapon);

        // 存储部件引用用于动画
        group.userData.parts = {
            head, helmet, helmetBrim, torso, vest, backpack,
            leftArm, rightArm, leftForearm, rightForearm, leftHand, rightHand,
            leftLeg, rightLeg, leftCalf, rightCalf,
            leftBoot, rightBoot, leftKnee, rightKnee,
            marker, weapon
        };

        // 存储基础姿态位置（用于动画恢复）- 持枪姿态
        group.userData.restPose = {
            leftArm: { x: -0.20, y: 1.16, z: -0.03, rx: -0.55, ry: 0, rz: 0.18 },
            rightArm: { x: 0.18, y: 1.15, z: -0.02, rx: -0.4, ry: 0, rz: -0.12 },
            leftForearm: { x: -0.10, y: 1.0, z: -0.26, rx: -1.15, ry: 0, rz: 0.12 },
            rightForearm: { x: 0.05, y: 0.98, z: -0.14, rx: -0.75, ry: 0, rz: -0.08 },
            leftHand: { x: -0.04, y: 0.98, z: -0.40 },
            rightHand: { x: 0.02, y: 0.92, z: -0.18 },
            leftLeg: { x: -0.12, y: 0.75, z: 0, rx: 0 },
            rightLeg: { x: 0.12, y: 0.75, z: 0, rx: 0 },
            leftCalf: { x: 0, y: -0.375, z: 0, rx: 0 },
            rightCalf: { x: 0, y: -0.375, z: 0, rx: 0 },
            torso: { y: 1.05, rx: 0 },
            head: { y: 1.6, rx: 0 },
            weapon: { x: 0, y: 1.0, z: -0.3, rx: 0, ry: 0, rz: 0 },
        };

        return group;
    }

    static _buildWeaponModel(classType) {
        const group = new THREE.Group();
        const matMetal = createProceduralMaterial('metal', {
            baseColor: 0x2a2a2a,
            accentColor: 0x0d0d0d,
            detailColor: 0x777777,
            size: 128,
            repeatX: 2,
            repeatY: 1,
            anisotropy: 6,
        }, { roughness: 0.42, metalness: 0.82, bumpScale: 0.01, useBump: true });
        const matStock = createProceduralMaterial('rubber', {
            baseColor: 0x1a1a1a,
            accentColor: 0x050505,
            detailColor: 0x555555,
            size: 128,
            repeatX: 2,
            repeatY: 1,
            anisotropy: 6,
        }, { roughness: 0.72, metalness: 0.18, bumpScale: 0.01, useBump: true });
        const matDark = createProceduralMaterial('metal', {
            baseColor: 0x0a0a0a,
            accentColor: 0x010101,
            detailColor: 0x444444,
            size: 128,
            repeatX: 1,
            repeatY: 1,
            anisotropy: 4,
        }, { roughness: 0.5, metalness: 0.55, bumpScale: 0.008, useBump: true });
        const matLens = new THREE.MeshBasicMaterial({
            color: 0x72d8df,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false,
        });

        switch (classType) {
            case 'sniper': {
                // 狙击步枪 - 长枪管+瞄准镜
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8), matMetal);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0, -0.3);
                group.add(barrel);
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.3), matMetal);
                body.position.set(0, 0, 0.05);
                group.add(body);
                // 狙击镜
                const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 12, 1, true), matDark);
                scope.rotation.x = Math.PI / 2;
                scope.position.set(0, 0.08, 0);
                group.add(scope);
                const scopeLens = new THREE.Mesh(
                    new THREE.CircleGeometry(0.025, 12),
                    matLens
                );
                scopeLens.rotation.y = Math.PI;
                scopeLens.position.set(0, 0.08, -0.092);
                group.add(scopeLens);
                const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.05), matStock);
                mag.position.set(0, -0.07, 0.05);
                group.add(mag);
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.1, 0.22), matStock);
                stock.position.set(0, -0.02, 0.28);
                group.add(stock);
                const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.08, 0.04), matStock);
                grip.position.set(0, -0.06, 0.12);
                grip.rotation.x = 0.3;
                group.add(grip);
                break;
            }
            case 'engineer': {
                // 霰弹枪 - 粗枪管+泵动护木
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), matMetal);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0.02, -0.25);
                group.add(barrel);
                const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.35, 8), matMetal);
                magTube.rotation.x = Math.PI / 2;
                magTube.position.set(0, -0.02, -0.2);
                group.add(magTube);
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.25), matMetal);
                body.position.set(0, 0, 0.05);
                group.add(body);
                const pump = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.08), matStock);
                pump.position.set(0, -0.04, -0.15);
                group.add(pump);
                const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.05), matStock);
                grip.position.set(0, -0.08, 0.15);
                grip.rotation.x = 0.3;
                group.add(grip);
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.07, 0.2), matStock);
                stock.position.set(0, -0.02, 0.26);
                group.add(stock);
                break;
            }
            case 'medic': {
                // SMG - 短紧凑
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 8), matMetal);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0, -0.18);
                group.add(barrel);
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.2), matMetal);
                body.position.set(0, 0, 0.03);
                group.add(body);
                const mag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.13, 0.045), matStock);
                mag.position.set(0, -0.1, 0);
                mag.rotation.x = -0.08;
                group.add(mag);
                const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.08, 0.04), matStock);
                grip.position.set(0, -0.07, 0.12);
                grip.rotation.x = 0.3;
                group.add(grip);
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.12), matStock);
                stock.position.set(0, -0.01, 0.18);
                group.add(stock);
                break;
            }
            default: {
                // 突击步枪 - 通用
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.38, 8), matMetal);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0.01, -0.25);
                group.add(barrel);
                const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.018, 0.04, 8), matDark);
                muzzle.rotation.x = Math.PI / 2;
                muzzle.position.set(0, 0.01, -0.44);
                group.add(muzzle);
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.26), matMetal);
                body.position.set(0, 0, 0.03);
                group.add(body);
                const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.16), matStock);
                handguard.position.set(0, 0, -0.13);
                group.add(handguard);
                const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.06), matStock);
                mag.position.set(0, -0.12, -0.01);
                group.add(mag);
                const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.04), matStock);
                grip.position.set(0, -0.08, 0.13);
                grip.rotation.x = 0.3;
                group.add(grip);
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.14), matStock);
                stock.position.set(0, -0.01, 0.23);
                group.add(stock);
                const sight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.04), matDark);
                sight.position.set(0, 0.055, -0.03);
                group.add(sight);
                break;
            }
        }

        // 武器整体位置：双手前方，胸部高度
        this._addThirdPersonWeaponDetails(group, classType, matMetal, matStock, matDark);
        group.position.set(0, 1.0, -0.3);
        group.castShadow = false;
        return group;
    }

    static _addThirdPersonWeaponDetails(group, classType, matMetal, matStock, matDark) {
        const markMat = new THREE.MeshBasicMaterial({ color: 0xaeb8af, transparent: true, opacity: 0.78 });
        const amberMat = new THREE.MeshBasicMaterial({ color: 0xd0a04a, transparent: true, opacity: 0.85 });
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

        const isSniper = classType === 'sniper';
        const isEngineer = classType === 'engineer';
        const isMedic = classType === 'medic';
        const railLen = isSniper ? 0.42 : isEngineer ? 0.24 : isMedic ? 0.2 : 0.28;
        for (let i = 0; i < 5; i++) {
            addBox('tp_weapon_rail_tooth', [0.04, 0.008, 0.015], [0, 0.064, -0.18 + i * (railLen / 4)], matDark);
        }

        addBox('tp_weapon_receiver_plate', [0.006, 0.04, 0.14], [0.035, 0.01, 0.04], matMetal);
        addBox('tp_weapon_serial_plate', [0.006, 0.018, 0.065], [-0.036, 0.025, 0.02], markMat);
        addBox('tp_weapon_selector_mark', [0.006, 0.012, 0.026], [0.038, -0.015, 0.07], amberMat);
        addCyl('tp_weapon_sling_loop_front', 0.014, 0.006, [0.045, -0.01, -0.23], matMetal, [0, 0, Math.PI / 2], 8);
        addCyl('tp_weapon_sling_loop_rear', 0.014, 0.006, [0.045, -0.015, 0.22], matMetal, [0, 0, Math.PI / 2], 8);

        if (isSniper) {
            addCyl('tp_scope_front_ring', 0.036, 0.014, [0, 0.08, -0.12], matMetal, [Math.PI / 2, 0, 0], 12);
            addCyl('tp_scope_rear_ring', 0.034, 0.014, [0, 0.08, 0.12], matMetal, [Math.PI / 2, 0, 0], 12);
            addBox('tp_bolt_handle', [0.012, 0.06, 0.016], [0.052, 0.02, 0.11], matMetal, [0, 0, -0.45]);
        } else if (isEngineer) {
            addBox('tp_shotgun_pump_groove_a', [0.055, 0.006, 0.012], [0, -0.055, -0.18], matDark);
            addBox('tp_shotgun_pump_groove_b', [0.055, 0.006, 0.012], [0, -0.055, -0.13], matDark);
            addBox('tp_shell_holder', [0.018, 0.06, 0.11], [0.047, 0.005, 0.08], matStock);
        } else if (isMedic) {
            addBox('tp_smg_charging_slot', [0.006, 0.018, 0.1], [-0.034, 0.025, -0.12], matDark);
            addBox('tp_smg_light', [0.025, 0.022, 0.065], [0.04, -0.015, -0.22], matMetal);
        } else {
            addBox('tp_laser_box', [0.032, 0.022, 0.075], [0.04, 0.01, -0.25], matMetal);
            addBox('tp_foregrip', [0.032, 0.09, 0.035], [0, -0.07, -0.17], matDark, [-0.1, 0, 0]);
        }
    }

    static _addSoldierDetailKit(group, kit) {
        const {
            matVest,
            matHelmet,
            matBoot,
            matAccent,
            matDark,
            matRubber,
            matLens,
            classType,
            teamColor,
        } = kit;
        const classAccentColor = {
            assault: 0xcc8800,
            medic: 0xffffff,
            engineer: 0xcc6600,
            sniper: 0x3a5a2a,
        }[classType] || 0xcc8800;
        const teamLabel = teamColor === CONFIG.TEAMS.friendly.color ? 'F' : 'E';
        const classPatchMat = _svgDecalMaterial(
            `class-patch-${classType}-${classAccentColor}`,
            _classInsigniaSvg(classType, classAccentColor),
        );
        const teamPatchMat = _svgDecalMaterial(
            `team-patch-${teamColor}-${teamLabel}`,
            _teamPatchSvg(teamColor, teamLabel),
        );
        const faceMat = _svgDecalMaterial('soldier-face-v1', _faceSvg(), { opacity: 0.94 });
        const parts = {
            helmet: group.getObjectByName('helmet'),
            head: group.getObjectByName('head'),
            torso: group.getObjectByName('torso'),
            vest: group.getObjectByName('vest'),
            leftArm: group.getObjectByName('leftArm'),
            rightArm: group.getObjectByName('rightArm'),
            leftForearm: group.getObjectByName('leftForearm'),
            rightForearm: group.getObjectByName('rightForearm'),
            leftCalf: group.getObjectByName('leftCalf'),
            rightCalf: group.getObjectByName('rightCalf'),
            leftBoot: group.getObjectByName('leftBoot'),
            rightBoot: group.getObjectByName('rightBoot'),
        };

        const addChildBox = (parent, name, size, pos, mat, rot = null) => {
            if (!parent) return null;
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
            mesh.name = name;
            mesh.position.set(pos[0], pos[1], pos[2]);
            if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
            parent.add(mesh);
            return mesh;
        };
        const addChildCyl = (parent, name, radius, height, pos, mat, rot = null, segments = 8) => {
            if (!parent) return null;
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat);
            mesh.name = name;
            mesh.position.set(pos[0], pos[1], pos[2]);
            if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
            parent.add(mesh);
            return mesh;
        };

        addChildBox(parts.helmet, 'helmet_front_mount', [0.055, 0.035, 0.03], [0, 0.08, 0.16], matDark);
        addChildBox(parts.helmet, 'helmet_left_rail', [0.035, 0.025, 0.18], [-0.17, 0.02, 0.02], matDark, [0, 0.08, 0]);
        addChildBox(parts.helmet, 'helmet_right_rail', [0.035, 0.025, 0.18], [0.17, 0.02, 0.02], matDark, [0, -0.08, 0]);
        addChildBox(parts.helmet, 'helmet_rear_pack', [0.18, 0.045, 0.035], [0, -0.02, -0.16], matRubber);
        _addSvgDecal(parts.helmet, 'helmet_team_decal', 0.16, 0.08, [0, 0.025, 0.174], [0, 0, 0], teamPatchMat);

        const headsetL = addChildCyl(parts.head, 'headset_left', 0.035, 0.018, [-0.16, 0.01, 0.01], matDark, [0, 0, Math.PI / 2], 10);
        const headsetR = addChildCyl(parts.head, 'headset_right', 0.035, 0.018, [0.16, 0.01, 0.01], matDark, [0, 0, Math.PI / 2], 10);
        if (headsetL) headsetL.scale.y = 0.75;
        if (headsetR) headsetR.scale.y = 0.75;
        addChildBox(parts.head, 'mic_boom', [0.012, 0.012, 0.16], [0.13, -0.06, 0.12], matDark, [0.35, 0.12, -0.4]);
        addChildBox(parts.head, 'goggle_reflect_l', [0.08, 0.025, 0.006], [-0.055, 0.015, 0.162], matLens);
        addChildBox(parts.head, 'goggle_reflect_r', [0.08, 0.025, 0.006], [0.055, 0.015, 0.162], matLens);
        _addSvgDecal(parts.head, 'face_detail_decal', 0.28, 0.22, [0, -0.02, 0.166], [0, 0, 0], faceMat);

        for (let i = -2; i <= 2; i++) {
            addChildBox(parts.vest, `molle_row_${i}`, [0.39, 0.014, 0.012], [0, 0.12 - i * 0.055, 0.148], matDark);
        }
        for (let i = -2; i <= 2; i++) {
            addChildBox(parts.vest, `molle_col_${i}`, [0.012, 0.27, 0.012], [i * 0.075, -0.015, 0.15], matDark);
        }
        addChildBox(parts.vest, 'plate_carrier_front', [0.36, 0.28, 0.025], [0, 0.02, 0.156], matVest);
        addChildBox(parts.vest, 'team_id_patch', [0.12, 0.045, 0.012], [0.12, 0.2, 0.17], new THREE.MeshBasicMaterial({ color: teamColor }));
        _addSvgDecal(parts.vest, 'team_id_patch_decal', 0.115, 0.055, [0.12, 0.2, 0.184], [0, 0, 0], teamPatchMat);
        _addSvgDecal(parts.vest, 'class_insignia_decal', 0.135, 0.135, [-0.12, 0.18, 0.184], [0, 0, 0], classPatchMat);
        addChildBox(parts.vest, 'utility_pouch_left', [0.085, 0.11, 0.045], [-0.22, -0.12, 0.02], matDark);
        addChildBox(parts.vest, 'utility_pouch_right', [0.085, 0.11, 0.045], [0.22, -0.12, 0.02], matDark);

        addChildBox(parts.leftArm, 'left_shoulder_hard_plate', [0.13, 0.035, 0.13], [0, 0.08, 0], matVest);
        addChildBox(parts.rightArm, 'right_shoulder_hard_plate', [0.13, 0.035, 0.13], [0, 0.08, 0], matVest);
        _addSvgDecal(parts.leftArm, 'left_shoulder_decal', 0.09, 0.09, [0, 0.08, 0.071], [0, 0, 0], classPatchMat);
        _addSvgDecal(parts.rightArm, 'right_team_decal', 0.105, 0.055, [0, 0.08, 0.071], [0, 0, 0], teamPatchMat);
        addChildBox(parts.leftForearm, 'left_elbow_pad', [0.095, 0.035, 0.075], [0, -0.09, 0.028], matRubber);
        addChildBox(parts.rightForearm, 'right_elbow_pad', [0.095, 0.035, 0.075], [0, -0.09, 0.028], matRubber);
        addChildBox(parts.leftForearm, 'left_wrist_device', [0.1, 0.028, 0.065], [0, 0.09, 0.02], matDark);
        if (classType === 'engineer') {
            addChildBox(parts.rightForearm, 'engineer_forearm_tool', [0.032, 0.02, 0.14], [0.055, 0.02, 0], matAccent, [0, 0, 0.3]);
        }

        // 膝枢轴组原点在膝盖处，绑带位置为负 Y（沿小腿向下）
        addChildBox(parts.leftCalf, 'left_knee_strap_upper', [0.14, 0.025, 0.025], [0, -0.02, 0.075], matDark);
        addChildBox(parts.rightCalf, 'right_knee_strap_upper', [0.14, 0.025, 0.025], [0, -0.02, 0.075], matDark);
        addChildBox(parts.leftCalf, 'left_knee_strap_lower', [0.14, 0.025, 0.025], [0, -0.14, 0.075], matDark);
        addChildBox(parts.rightCalf, 'right_knee_strap_lower', [0.14, 0.025, 0.025], [0, -0.14, 0.075], matDark);

        addChildBox(parts.leftBoot, 'left_boot_sole', [0.18, 0.025, 0.31], [0, -0.062, 0.005], matRubber);
        addChildBox(parts.rightBoot, 'right_boot_sole', [0.18, 0.025, 0.31], [0, -0.062, 0.005], matRubber);
        addChildBox(parts.leftBoot, 'left_boot_toe_cap', [0.15, 0.035, 0.07], [0, 0.005, 0.135], matBoot);
        addChildBox(parts.rightBoot, 'right_boot_toe_cap', [0.15, 0.035, 0.07], [0, 0.005, 0.135], matBoot);

        if (classType === 'sniper') {
            const hood = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), matVest);
            hood.name = 'sniper_low_profile_hood';
            hood.position.set(0, 1.61, -0.02);
            hood.scale.set(1.08, 0.82, 1.0);
            group.add(hood);
        }
    }

    static _addClassEquipment(group, classType, matVest, matAccent, matDark) {
        switch (classType) {
            case 'assault': {
                // 弹药袋（胸挂）
                const ammoPouch = new THREE.Mesh(
                    new THREE.BoxGeometry(0.12, 0.1, 0.05),
                    matDark
                );
                ammoPouch.position.set(0, 1.0, 0.16);
                group.add(ammoPouch);
                // 额外弹药条
                const ammoStrip = new THREE.Mesh(
                    new THREE.BoxGeometry(0.08, 0.03, 0.15),
                    matAccent
                );
                ammoStrip.position.set(0, 0.95, 0.14);
                group.add(ammoStrip);
                break;
            }
            case 'medic': {
                // 医疗十字标（白色）
                const crossH = new THREE.Mesh(
                    new THREE.BoxGeometry(0.18, 0.05, 0.02),
                    new THREE.MeshBasicMaterial({ color: 0xffffff })
                );
                crossH.position.set(0, 1.15, 0.15);
                group.add(crossH);
                const crossV = new THREE.Mesh(
                    new THREE.BoxGeometry(0.05, 0.18, 0.02),
                    new THREE.MeshBasicMaterial({ color: 0xffffff })
                );
                crossV.position.set(0, 1.15, 0.15);
                group.add(crossV);
                // 医疗包（背包侧面）
                const medbag = new THREE.Mesh(
                    new THREE.BoxGeometry(0.14, 0.1, 0.08),
                    new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6 })
                );
                medbag.position.set(0.18, 1.0, -0.15);
                group.add(medbag);
                break;
            }
            case 'engineer': {
                // 工具包
                const toolPouch = new THREE.Mesh(
                    new THREE.BoxGeometry(0.14, 0.1, 0.06),
                    matDark
                );
                toolPouch.position.set(0.2, 0.85, 0.14);
                group.add(toolPouch);
                // 扳手（挂在腰间）
                const wrench = new THREE.Mesh(
                    new THREE.BoxGeometry(0.02, 0.02, 0.15),
                    matAccent
                );
                wrench.position.set(-0.2, 0.82, 0.05);
                wrench.rotation.x = 0.3;
                group.add(wrench);
                const wrenchHead = new THREE.Mesh(
                    new THREE.BoxGeometry(0.04, 0.02, 0.03),
                    matAccent
                );
                wrenchHead.position.set(-0.2, 0.82, -0.02);
                group.add(wrenchHead);
                // EOD防爆服特征 - 加厚肩部
                const shoulderPad = new THREE.Mesh(
                    new THREE.BoxGeometry(0.15, 0.08, 0.15),
                    matVest
                );
                shoulderPad.position.set(0, 1.35, 0);
                group.add(shoulderPad);
                break;
            }
            case 'sniper': {
                // 吉利服伪装 - 更蓬松
                const ghillieMat = new THREE.MeshStandardMaterial({ 
                    color: 0x3a4a2a, roughness: 1.0, transparent: true, opacity: 0.7 
                });
                // 上身吉利服
                const ghillie = new THREE.Mesh(
                    new THREE.SphereGeometry(0.32, 10, 8),
                    ghillieMat
                );
                ghillie.position.set(0, 1.1, 0);
                ghillie.scale.set(1, 1.2, 0.9);
                group.add(ghillie);
                // 头部伪装
                const headGhillie = new THREE.Mesh(
                    new THREE.SphereGeometry(0.24, 10, 8),
                    ghillieMat
                );
                headGhillie.position.set(0, 1.6, 0);
                group.add(headGhillie);
                // 伪装条带
                for (let i = 0; i < 6; i++) {
                    const strip = new THREE.Mesh(
                        new THREE.BoxGeometry(0.02, 0.15, 0.02),
                        ghillieMat
                    );
                    const angle = (i / 6) * Math.PI * 2;
                    strip.position.set(Math.cos(angle) * 0.2, 1.3, Math.sin(angle) * 0.18);
                    strip.rotation.z = angle;
                    group.add(strip);
                }
                break;
            }
        }
    }

    // 角色动画 - 走/跑/冲刺/idle
    static animateWalk(model, time, speed, isCrouch = false, isProne = false, isAiming = false) {
        const parts = model.userData.parts;
        if (!parts) return;
        const rest = model.userData.restPose;
        if (!rest) return;

        // 保存基础 Y
        const baseY = model.userData.baseY || 0;

        if (isProne) {
            // 平衡时逐渐躺下
            const proneProgress = model.userData._proneProgress || 0;
            model.userData._proneProgress = Math.min(1, proneProgress + 0.08);
            const p = model.userData._proneProgress;
            model.rotation.x = -Math.PI / 2 * p;
            model.position.y = baseY + 0.25 * p;

            // 匍匐爬行相位：移动时四肢交替划动，静止时为 0
            const crawling = speed > 0.3;
            const crawlPhase = crawling ? Math.sin(time * Math.min(speed * 2.2, 6)) : 0;
            const crawlAmp = crawling ? Math.min(speed * 0.12, 0.3) : 0;

            if (parts.torso) {
                // 爬行时躯干随划动轻微左右扭动
                parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, 0.35 + p * 0.3, 0.25);
                parts.torso.rotation.z = THREE.MathUtils.lerp(parts.torso.rotation.z, 0.02 + crawlPhase * 0.08, 0.25);
            }
            if (parts.head) {
                // 爬行时抬头看路
                parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, -0.18 * p - (crawling ? 0.15 : 0), 0.25);
            }
            // 手臂交替向前伸展划动（爬行的核心视觉）
            if (parts.leftArm) {
                parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, -0.6 - p * 0.2 - Math.max(0, crawlPhase) * crawlAmp * 2.2, 0.25);
                parts.leftArm.rotation.z = THREE.MathUtils.lerp(parts.leftArm.rotation.z, 0.1 + Math.max(0, crawlPhase) * 0.15, 0.25);
            }
            if (parts.rightArm) {
                parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, -0.55 - p * 0.15 - Math.max(0, -crawlPhase) * crawlAmp * 2.2, 0.25);
                parts.rightArm.rotation.z = THREE.MathUtils.lerp(parts.rightArm.rotation.z, -0.08 - Math.max(0, -crawlPhase) * 0.15, 0.25);
            }
            // 腿部交替蹬地
            if (parts.leftLeg) parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, 0.1 - Math.max(0, -crawlPhase) * crawlAmp * 1.6, 0.25);
            if (parts.rightLeg) parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, 0.1 - Math.max(0, crawlPhase) * crawlAmp * 1.6, 0.25);
            if (parts.leftCalf) parts.leftCalf.rotation.x = THREE.MathUtils.lerp(parts.leftCalf.rotation.x, 0.45 + Math.max(0, -crawlPhase) * crawlAmp * 2.0, 0.25);
            if (parts.rightCalf) parts.rightCalf.rotation.x = THREE.MathUtils.lerp(parts.rightCalf.rotation.x, 0.45 + Math.max(0, crawlPhase) * crawlAmp * 2.0, 0.25);
            if (parts.weapon) {
                parts.weapon.position.y = THREE.MathUtils.lerp(parts.weapon.position.y, rest.weapon.y - 0.22, 0.25);
                parts.weapon.position.z = THREE.MathUtils.lerp(parts.weapon.position.z, rest.weapon.z + 0.12, 0.25);
                parts.weapon.rotation.x = THREE.MathUtils.lerp(parts.weapon.rotation.x, 0.18, 0.25);
            }
            return;
        } else {
            // 恢复平衡
            if (model.userData._proneProgress && model.userData._proneProgress > 0) {
                model.userData._proneProgress = Math.max(0, model.userData._proneProgress - 0.1);
                model.rotation.x = -Math.PI / 2 * model.userData._proneProgress;
                model.position.y = baseY + 0.3 * model.userData._proneProgress;
                if (model.userData._proneProgress > 0) return;
            }
            model.rotation.x = 0;
        }

        const crouchOffset = isCrouch ? -0.35 : 0;
        // 蹲伏/站立平滑过渡
        if (!model.userData._crouchLerp) model.userData._crouchLerp = 0;
        const targetCrouch = isCrouch ? 1 : 0;
        model.userData._crouchLerp = THREE.MathUtils.lerp(model.userData._crouchLerp, targetCrouch, 0.15);
        const smoothCrouchOffset = model.userData._crouchLerp * -0.35;
        model.position.y = baseY + smoothCrouchOffset;

        // === 静止时的呼吸/idle动画 ===
        if (speed < 0.5) {
            const breath = Math.sin(time * 1.5) * 0.01;
            const breath2 = Math.sin(time * 2.3) * 0.005;
            const idleShift = Math.sin(time * 0.7) * 0.02; // 重心微移

            // === Idle变化系统 ===
            // 周期性的idle手势：每隔几秒切换不同姿态
            if (!model.userData._idleTimer) model.userData._idleTimer = 0;
            if (!model.userData._idleGesture) model.userData._idleGesture = 0;
            model.userData._idleTimer += 0.016;
            // 每5-8秒切换一次idle手势
            if (model.userData._idleTimer > 5 + Math.random() * 3) {
                model.userData._idleTimer = 0;
                model.userData._idleGesture = (model.userData._idleGesture + 1) % 3;
            }
            const gesture = model.userData._idleGesture;
            const gestureProgress = Math.min(model.userData._idleTimer / 1.0, 1.0); // 手势过渡进度

            // 躯干呼吸 - 平滑过渡
            parts.torso.position.y = THREE.MathUtils.lerp(parts.torso.position.y, rest.torso.y + breath, 0.15);
            parts.head.position.y = THREE.MathUtils.lerp(parts.head.position.y, rest.head.y + breath2, 0.15);
            
            // 手臂微动（保持 z 轴旋转）- 平滑过渡
            parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, rest.leftArm.rx + breath * 0.5, 0.15);
            parts.leftArm.rotation.z = THREE.MathUtils.lerp(parts.leftArm.rotation.z, rest.leftArm.rz + breath2 * 0.3 + idleShift, 0.15);
            parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, rest.rightArm.rx + breath2 * 0.5, 0.15);
            parts.rightArm.rotation.z = THREE.MathUtils.lerp(parts.rightArm.rotation.z, rest.rightArm.rz - breath2 * 0.3 - idleShift, 0.15);
            
            // 前臂微动 - 平滑过渡
            parts.leftForearm.rotation.x = THREE.MathUtils.lerp(parts.leftForearm.rotation.x, rest.leftForearm.rx + breath * 0.3, 0.15);
            parts.leftForearm.rotation.z = THREE.MathUtils.lerp(parts.leftForearm.rotation.z, rest.leftForearm.rz, 0.15);
            parts.rightForearm.rotation.x = THREE.MathUtils.lerp(parts.rightForearm.rotation.x, rest.rightForearm.rx + breath2 * 0.3, 0.15);
            parts.rightForearm.rotation.z = THREE.MathUtils.lerp(parts.rightForearm.rotation.z, rest.rightForearm.rz, 0.15);

            parts.leftHand.position.x = THREE.MathUtils.lerp(parts.leftHand.position.x, rest.leftHand.x, 0.18);
            parts.leftHand.position.y = THREE.MathUtils.lerp(parts.leftHand.position.y, rest.leftHand.y, 0.18);
            parts.leftHand.position.z = THREE.MathUtils.lerp(parts.leftHand.position.z, rest.leftHand.z, 0.18);
            parts.rightHand.position.x = THREE.MathUtils.lerp(parts.rightHand.position.x, rest.rightHand.x, 0.18);
            parts.rightHand.position.y = THREE.MathUtils.lerp(parts.rightHand.position.y, rest.rightHand.y, 0.18);
            parts.rightHand.position.z = THREE.MathUtils.lerp(parts.rightHand.position.z, rest.rightHand.z, 0.18);
            
            // 武器微微晃动 - 平滑过渡
            if (parts.weapon) {
                parts.weapon.position.y = THREE.MathUtils.lerp(parts.weapon.position.y, rest.weapon.y + breath * 0.3, 0.15);
                parts.weapon.rotation.x = THREE.MathUtils.lerp(parts.weapon.rotation.x, breath2 * 0.5, 0.15);
                parts.weapon.rotation.z = THREE.MathUtils.lerp(parts.weapon.rotation.z, breath2 * 0.3, 0.15);
            }

            // 躯干旋转回归零位（gesture 1 会覆盖此值）
            parts.torso.rotation.z = THREE.MathUtils.lerp(parts.torso.rotation.z, 0, 0.1);
            // 躯干前倾回归零位（瞄准代码会覆盖此值）
            if (!isAiming) {
                parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, 0, 0.1);
            }

            // === Idle手势变化 ===
            // gesture 0: 头部左右环视
            // gesture 1: 身体重心微移到右脚
            // gesture 2: 武器检查动作
            if (gesture === 0) {
                // 头部缓慢环视
                const lookAngle = Math.sin(time * 0.4) * 0.15 + Math.sin(time * 0.13) * 0.05;
                parts.head.rotation.y = THREE.MathUtils.lerp(parts.head.rotation.y, lookAngle, 0.08);
                parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, Math.sin(time * 0.3) * 0.03, 0.1);
            } else if (gesture === 1) {
                // 重心移到右脚
                const shiftAmount = Math.sin(gestureProgress * Math.PI) * 0.04;
                parts.torso.rotation.z = THREE.MathUtils.lerp(parts.torso.rotation.z, shiftAmount, 0.1);
                parts.head.rotation.y = THREE.MathUtils.lerp(parts.head.rotation.y, Math.sin(time * 0.5) * 0.06, 0.1);
                parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, 0, 0.15);
            } else {
                // 武器检查 - 轻微抬起武器查看
                if (parts.weapon) {
                    const checkAmount = Math.sin(gestureProgress * Math.PI) * 0.06;
                    parts.weapon.position.y = THREE.MathUtils.lerp(parts.weapon.position.y, rest.weapon.y + breath * 0.3 + checkAmount, 0.15);
                    parts.weapon.rotation.x = THREE.MathUtils.lerp(parts.weapon.rotation.x, breath2 * 0.5 + checkAmount * 0.5, 0.15);
                }
                parts.head.rotation.y = THREE.MathUtils.lerp(parts.head.rotation.y, Math.sin(time * 0.5) * 0.05, 0.1);
                parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, Math.sin(gestureProgress * Math.PI) * 0.05, 0.1);
                // 右手微调
                if (parts.rightForearm) {
                    parts.rightForearm.rotation.x = THREE.MathUtils.lerp(parts.rightForearm.rotation.x, rest.rightForearm.rx + Math.sin(gestureProgress * Math.PI) * 0.08, 0.15);
                }
            }

            // === 瞄准姿态（静止时）===
            if (isAiming) {
                // 武器抬高到瞄准位置 - 平滑过渡
                if (parts.weapon) {
                    parts.weapon.position.y = THREE.MathUtils.lerp(parts.weapon.position.y, rest.weapon.y + 0.1, 0.2);
                    parts.weapon.position.z = THREE.MathUtils.lerp(parts.weapon.position.z, rest.weapon.z - 0.06, 0.2);
                    parts.weapon.position.x = THREE.MathUtils.lerp(parts.weapon.position.x, rest.weapon.x + 0.01, 0.2);
                    parts.weapon.rotation.x = THREE.MathUtils.lerp(parts.weapon.rotation.x, -0.08, 0.2);
                    parts.weapon.rotation.z = THREE.MathUtils.lerp(parts.weapon.rotation.z, 0.02, 0.2);
                }
                // 头部微低瞄准
                parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, -0.05, 0.2);
                // 左手抬起来护木
                parts.leftForearm.rotation.x = THREE.MathUtils.lerp(parts.leftForearm.rotation.x, rest.leftForearm.rx - 0.15, 0.2);
                parts.leftHand.position.y = THREE.MathUtils.lerp(parts.leftHand.position.y, rest.leftHand.y + 0.03, 0.2);
                parts.rightHand.position.y = THREE.MathUtils.lerp(parts.rightHand.position.y, rest.rightHand.y - 0.02, 0.2);
                // 身体微前倾
                parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, 0.05, 0.2);
            }
            return;
        }

        // === 行走/跑步动画 ===
        // 阈值 4.5：AI 冲刺速度 4.8+ 能触发跑姿（玩家冲刺 8.5 也覆盖）
        const isSprinting = speed > 4.5;

        // 冲刺混合因子 - 平滑过渡消除硬切换（0=步行, 1=冲刺）
        if (model.userData._sprintBlend === undefined) model.userData._sprintBlend = 0;
        model.userData._sprintBlend = THREE.MathUtils.lerp(
            model.userData._sprintBlend, isSprinting ? 1 : 0, 0.1
        );
        const sb = model.userData._sprintBlend;

        // 使用混合因子插值各项参数，消除速度阈值处的突变
        // 幅度整体加大：步行大腿摆到约37°、冲刺约63°，远处也能看清腿部动作
        const swingFreq = speed * THREE.MathUtils.lerp(2.3, 3.0, sb);
        const swingAmountMax = THREE.MathUtils.lerp(0.65, 1.1, sb);
        const swingAmount = Math.min(speed * 0.26, swingAmountMax);
        const armSwing = swingAmount * THREE.MathUtils.lerp(0.55, 0.4, sb);
        // 蹲走：步幅减半（小碎步）
        const crouchStride = isCrouch ? 0.55 : 1;

        // 腿部摆动 - 大腿+小腿配合
        const legPhase = Math.sin(time * swingFreq);
        parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, legPhase * swingAmount * crouchStride + (isCrouch ? 0.5 : 0), 0.3);
        parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, -legPhase * swingAmount * crouchStride + (isCrouch ? 0.5 : 0), 0.3);

        // 小腿弯曲 - 冲刺时更明显（平滑过渡）；蹲姿小腿常弯
        const calfBend = THREE.MathUtils.lerp(0.45, 0.95, sb);
        const crouchCalf = isCrouch ? 0.7 : 0;
        parts.leftCalf.rotation.x = THREE.MathUtils.lerp(parts.leftCalf.rotation.x, crouchCalf + Math.max(0, -legPhase * calfBend * crouchStride), 0.3);
        parts.rightCalf.rotation.x = THREE.MathUtils.lerp(parts.rightCalf.rotation.x, crouchCalf + Math.max(0, legPhase * calfBend * crouchStride), 0.3);

        // 手臂摆动 + 冲刺收拢（合并为单一目标，避免重复设置）
        const armPhase = -legPhase;
        const armTuck = THREE.MathUtils.lerp(0, 0.3, sb); // 冲刺时手臂收拢量
        parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, rest.leftArm.rx + armPhase * armSwing * (1 - sb) + armTuck, 0.3);
        parts.leftArm.rotation.z = THREE.MathUtils.lerp(parts.leftArm.rotation.z, rest.leftArm.rz, 0.3);
        parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, rest.rightArm.rx - armPhase * armSwing * (1 - sb) + armTuck, 0.3);
        parts.rightArm.rotation.z = THREE.MathUtils.lerp(parts.rightArm.rotation.z, rest.rightArm.rz, 0.3);

        // 前臂保持弯曲持枪
        parts.leftForearm.rotation.x = THREE.MathUtils.lerp(parts.leftForearm.rotation.x, rest.leftForearm.rx + armPhase * armSwing * 0.3 * (1 - sb), 0.3);
        parts.leftForearm.rotation.z = THREE.MathUtils.lerp(parts.leftForearm.rotation.z, rest.leftForearm.rz, 0.3);
        parts.rightForearm.rotation.x = THREE.MathUtils.lerp(parts.rightForearm.rotation.x, rest.rightForearm.rx - armPhase * armSwing * 0.3 * (1 - sb), 0.3);
        parts.rightForearm.rotation.z = THREE.MathUtils.lerp(parts.rightForearm.rotation.z, rest.rightForearm.rz, 0.3);

        parts.leftHand.position.x = THREE.MathUtils.lerp(parts.leftHand.position.x, rest.leftHand.x, 0.25);
        parts.leftHand.position.y = THREE.MathUtils.lerp(parts.leftHand.position.y, rest.leftHand.y, 0.25);
        parts.leftHand.position.z = THREE.MathUtils.lerp(parts.leftHand.position.z, rest.leftHand.z, 0.25);
        parts.rightHand.position.x = THREE.MathUtils.lerp(parts.rightHand.position.x, rest.rightHand.x, 0.25);
        parts.rightHand.position.y = THREE.MathUtils.lerp(parts.rightHand.position.y, rest.rightHand.y, 0.25);
        parts.rightHand.position.z = THREE.MathUtils.lerp(parts.rightHand.position.z, rest.rightHand.z, 0.25);

        // 身体上下弹动（冲刺时幅度更大，平滑过渡）
        const bounce = Math.abs(Math.sin(time * swingFreq)) * THREE.MathUtils.lerp(0.03, 0.05, sb);
        parts.torso.position.y = THREE.MathUtils.lerp(parts.torso.position.y, rest.torso.y + bounce, 0.3);

        // 头部微动
        parts.head.position.y = THREE.MathUtils.lerp(parts.head.position.y, rest.head.y + bounce * 0.5, 0.3);

        // 身体前倾 + 头部前倾 + 武器状态 - 全部使用混合因子平滑过渡
        const torsoLeanTarget = THREE.MathUtils.lerp(isAiming ? 0.05 : 0, 0.2, sb);
        parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, torsoLeanTarget, 0.15);
        const headLeanTarget = THREE.MathUtils.lerp(0, -0.12, sb);
        parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, headLeanTarget, 0.15);

        // 武器位置/旋转 - 步行/瞄准/冲刺三态混合
        if (parts.weapon) {
            // Y 位置：步行(弹动) -> 瞄准(抬高) -> 冲刺(放低)
            const weaponYWalk = isAiming ? rest.weapon.y + 0.06 : rest.weapon.y + bounce * 0.3;
            const weaponYTarget = THREE.MathUtils.lerp(weaponYWalk, rest.weapon.y - 0.1, sb);
            parts.weapon.position.y = THREE.MathUtils.lerp(parts.weapon.position.y, weaponYTarget, 0.2);
            // 旋转：步行(摆动) -> 瞄准(微仰) -> 冲刺(下垂)
            const weaponRotWalk = isAiming ? -0.03 : armPhase * armSwing * 0.15;
            const weaponRotTarget = THREE.MathUtils.lerp(weaponRotWalk, 0.4, sb);
            parts.weapon.rotation.x = THREE.MathUtils.lerp(parts.weapon.rotation.x, weaponRotTarget, 0.2);
        }

        // 蹲伏姿态：身体大幅降低、弓背前倾、武器端平（战术蹲行）
        if (isCrouch) {
            parts.torso.position.y = THREE.MathUtils.lerp(parts.torso.position.y, rest.torso.y - 0.22 + bounce * 0.5, 0.2);
            parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, 0.28, 0.2);
            parts.head.position.y = THREE.MathUtils.lerp(parts.head.position.y, rest.head.y - 0.22 + bounce * 0.3, 0.2);
            parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, -0.2, 0.2);
            if (parts.weapon) {
                parts.weapon.position.y = THREE.MathUtils.lerp(parts.weapon.position.y, rest.weapon.y - 0.12, 0.2);
            }
        }
    }

    // 换弹动画 - 第三人称可见
    // 第三人称换弹：三阶段真实动作（卸弹匣→插新弹匣→拉栓上膛）
    static animateReload(model, progress) {
        const parts = model.userData.parts;
        if (!parts) return;
        const rest = model.userData.restPose;
        if (!rest) return;

        const easeInOut = (t) => t * t * (3 - 2 * t);

        // 各阶段强度（0~1）
        let dip;        // 武器下沉/前倾
        let magReach;   // 右手伸向弹匣井
        let magSlap;    // 拍入弹匣的冲击
        let charge;     // 左手拉栓
        if (progress < 0.32) {
            // 阶段1：右手抓弹匣、抽出（武器下沉倾斜）
            const t = easeInOut(progress / 0.32);
            dip = t; magReach = t; magSlap = 0; charge = 0;
        } else if (progress < 0.58) {
            // 阶段2：换新弹匣、用力拍入（末段有一个快速冲击）
            const t = (progress - 0.32) / 0.26;
            dip = 1;
            magReach = 1 - easeInOut(Math.max(0, t - 0.7) / 0.3) * 0.35;
            magSlap = t > 0.82 ? Math.sin((t - 0.82) / 0.18 * Math.PI) : 0;
            charge = 0;
        } else if (progress < 0.85) {
            // 阶段3：左手离开护木拉机柄，向后拉再释放
            const t = (progress - 0.58) / 0.27;
            dip = 1 - easeInOut(t) * 0.6;
            magReach = 1 - easeInOut(t);
            magSlap = 0;
            charge = Math.sin(t * Math.PI);
        } else {
            // 阶段4：恢复持枪姿态
            const t = easeInOut((progress - 0.85) / 0.15);
            dip = 0.4 * (1 - t); magReach = 0; magSlap = 0; charge = 0;
        }

        // 武器下沉+前倾（换弹姿态），拍入弹匣时上顶
        if (parts.weapon) {
            parts.weapon.position.y = rest.weapon.y - dip * 0.10 + magSlap * 0.04;
            parts.weapon.position.z = rest.weapon.z + dip * 0.05;
            parts.weapon.position.x = dip * 0.02;
            parts.weapon.rotation.x = dip * 0.22 - magSlap * 0.08;
            parts.weapon.rotation.z = dip * 0.10;
        }

        // 右手：伸向弹匣井（下前方），拍入时快速上推
        if (parts.rightHand) {
            parts.rightHand.position.x = rest.rightHand.x - magReach * 0.04;
            parts.rightHand.position.y = rest.rightHand.y - magReach * 0.30 + magSlap * 0.10;
            parts.rightHand.position.z = rest.rightHand.z + magReach * 0.16;
        }
        if (parts.rightArm) {
            parts.rightArm.rotation.x = rest.rightArm.rx + magReach * 0.55 - magSlap * 0.15;
            parts.rightArm.rotation.z = rest.rightArm.rz - magReach * 0.22;
        }
        if (parts.rightForearm) {
            parts.rightForearm.rotation.x = rest.rightForearm.rx + magReach * 0.75;
            parts.rightForearm.rotation.z = rest.rightForearm.rz - magReach * 0.3;
        }

        // 左手：阶段3抬到机匣上方做拉栓动作（沿枪身向后拉）
        if (parts.leftHand) {
            parts.leftHand.position.x = rest.leftHand.x + charge * 0.10;
            parts.leftHand.position.y = rest.leftHand.y + charge * 0.12;
            parts.leftHand.position.z = rest.leftHand.z + charge * 0.18;
        }
        if (parts.leftArm) {
            parts.leftArm.rotation.x = rest.leftArm.rx + charge * 0.35;
            parts.leftArm.rotation.z = rest.leftArm.rz + charge * 0.15;
        }
        if (parts.leftForearm) {
            parts.leftForearm.rotation.x = rest.leftForearm.rx - dip * 0.1 + charge * 0.45;
        }

        // 头部低头看弹匣井，拉栓时回正
        if (parts.head) {
            parts.head.rotation.x = magReach * 0.22 + charge * 0.08;
        }

        // 躯干微微前倾配合
        if (parts.torso) {
            parts.torso.rotation.x = dip * 0.06;
        }
    }

    // 倒地动画 - 战地风格平躺地上（progress 0→0.5，与 Bot.update 中 deathProgress 上限一致）
    // 先向后仰倒贴地，再微弱挣扎求救；与死亡侧翻区分开
    static animateDowned(model, progress) {
        const parts = model.userData.parts;
        if (!parts) return;
        const rest = model.userData.restPose;
        const baseY = model.userData.baseY || 0;
        // progress(0~0.5) → 0~1 倒地过程
        const raw = Math.min(Math.max(progress * 2, 0), 1);
        // 前 70% 快速倒地，后 30% 贴地微调
        const fallT = raw < 0.7 ? raw / 0.7 : 1;
        const eased = fallT < 0.5
            ? 2 * fallT * fallT
            : 1 - Math.pow(-2 * fallT + 2, 2) / 2;
        const settle = raw > 0.7 ? (raw - 0.7) / 0.3 : 0;
        const t = performance.now() * 0.001;
        // 贴地后微弱挣扎（呼吸 + 求救手势）
        const breath = Math.sin(t * 1.8) * 0.012;
        const struggle = Math.sin(t * 3.4) * 0.04 * settle;
        const reachPulse = (0.5 + 0.5 * Math.sin(t * 2.1)) * settle;

        // 向后仰倒 + 轻微侧偏（躺在地上，不是半跪）
        model.rotation.x = eased * (Math.PI * 0.48) + breath * 0.15;
        model.rotation.z = eased * 0.55 + struggle * 0.3;
        // 身体贴地：旋转 pivot 在脚底（model.position.y = baseY 时脚底贴地），
        // 旋转后身体水平面就在 baseY 高度，无需再下沉；原 -0.92 会把整具身体压入地下
        model.position.y = baseY + breath * 0.02;

        // 躯干：贴地后略挺胸抬头求救
        if (parts.torso) {
            parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, -0.15 + breath * 0.5, 0.2);
            parts.torso.rotation.z = THREE.MathUtils.lerp(parts.torso.rotation.z, 0.08, 0.2);
        }
        // 头部：抬离地面环顾求援
        if (parts.head) {
            parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, -0.55 + breath * 0.8, 0.18);
            parts.head.rotation.y = THREE.MathUtils.lerp(parts.head.rotation.y, Math.sin(t * 0.7) * 0.25 * settle, 0.12);
            parts.head.rotation.z = THREE.MathUtils.lerp(parts.head.rotation.z, -0.15, 0.18);
        }

        // 左臂摊在身侧
        if (parts.leftArm) {
            parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, 0.35 + struggle * 0.4, 0.2);
            parts.leftArm.rotation.z = THREE.MathUtils.lerp(parts.leftArm.rotation.z, 1.05 + settle * 0.15, 0.2);
        }
        if (parts.leftForearm) {
            parts.leftForearm.rotation.x = THREE.MathUtils.lerp(parts.leftForearm.rotation.x, 0.25, 0.2);
            parts.leftForearm.rotation.z = THREE.MathUtils.lerp(parts.leftForearm.rotation.z, 0.2, 0.2);
        }
        // 右臂无力向上伸（求救）
        if (parts.rightArm) {
            parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, -1.35 - reachPulse * 0.25, 0.18);
            parts.rightArm.rotation.z = THREE.MathUtils.lerp(parts.rightArm.rotation.z, -0.55 - reachPulse * 0.2, 0.18);
        }
        if (parts.rightForearm) {
            parts.rightForearm.rotation.x = THREE.MathUtils.lerp(parts.rightForearm.rotation.x, -0.4 - reachPulse * 0.15, 0.18);
            parts.rightForearm.rotation.z = THREE.MathUtils.lerp(parts.rightForearm.rotation.z, 0.1, 0.18);
        }
        if (parts.rightHand && rest?.rightHand) {
            parts.rightHand.position.y = THREE.MathUtils.lerp(parts.rightHand.position.y, rest.rightHand.y + 0.15 + reachPulse * 0.08, 0.15);
            parts.rightHand.position.z = THREE.MathUtils.lerp(parts.rightHand.position.z, rest.rightHand.z - 0.1, 0.15);
        }

        // 腿部：一腿蜷曲、一腿伸展（侧躺自然姿态）
        if (parts.leftLeg) {
            parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, 0.55 + struggle * 0.2, 0.2);
            parts.leftLeg.rotation.z = THREE.MathUtils.lerp(parts.leftLeg.rotation.z || 0, 0.15, 0.2);
        }
        if (parts.rightLeg) {
            parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, 0.2 + breath * 0.3, 0.2);
            parts.rightLeg.rotation.z = THREE.MathUtils.lerp(parts.rightLeg.rotation.z || 0, -0.25, 0.2);
        }
        if (parts.leftCalf) {
            parts.leftCalf.rotation.x = THREE.MathUtils.lerp(parts.leftCalf.rotation.x, 1.1, 0.2);
        }
        if (parts.rightCalf) {
            parts.rightCalf.rotation.x = THREE.MathUtils.lerp(parts.rightCalf.rotation.x, 0.35 + struggle * 0.15, 0.2);
        }

        // 武器松脱掉到身侧贴地
        if (parts.weapon && rest?.weapon) {
            parts.weapon.position.x = THREE.MathUtils.lerp(parts.weapon.position.x, rest.weapon.x + 0.35, 0.15);
            parts.weapon.position.y = THREE.MathUtils.lerp(parts.weapon.position.y, rest.weapon.y - 0.55, 0.15);
            parts.weapon.position.z = THREE.MathUtils.lerp(parts.weapon.position.z, rest.weapon.z + 0.05, 0.15);
            parts.weapon.rotation.x = THREE.MathUtils.lerp(parts.weapon.rotation.x, 0.9, 0.15);
            parts.weapon.rotation.z = THREE.MathUtils.lerp(parts.weapon.rotation.z, -1.1, 0.15);
            parts.weapon.rotation.y = THREE.MathUtils.lerp(parts.weapon.rotation.y, 0.4, 0.15);
        }

        // 标记闪烁（求救信号）
        if (parts.marker) {
            parts.marker.material.opacity = 0.45 + Math.sin(t * 8) * 0.35;
            parts.marker.visible = true;
            // 倒地后标记抬高，避免埋进地面
            parts.marker.position.y = 0.35 + settle * 0.15;
        }
    }

    // 被处决动画（progress 0→1，覆盖倒地姿态上的刺入反应）
    static animateBeingExecuted(model, progress) {
        const parts = model.userData.parts;
        if (!parts) return;
        const baseY = model.userData.baseY || 0;
        const p = Math.min(Math.max(progress, 0), 1);
        const t = performance.now() * 0.001;

        // 保持躺地，刺入时身体抽搐
        const preStrike = Math.min(p / 0.72, 1);
        const strike = p >= 0.72 ? Math.min((p - 0.72) / 0.15, 1) : 0;
        const after = p > 0.85 ? (p - 0.85) / 0.15 : 0;
        const thrash = strike > 0 && strike < 1
            ? Math.sin(t * 40) * 0.08 * (1 - strike)
            : 0;

        model.rotation.x = Math.PI * 0.48 + thrash * 0.5 - after * 0.05;
        model.rotation.z = 0.55 + thrash * 0.6 + strike * 0.15;
        // 处决动画贴地（同 animateDowned：旋转后身体水平面已在 baseY 高度，无需下沉）
        model.position.y = baseY + thrash * 0.04;

        // 双手本能护胸/挣扎
        if (parts.leftArm) {
            parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, -0.8 - preStrike * 0.4 + thrash, 0.25);
            parts.leftArm.rotation.z = THREE.MathUtils.lerp(parts.leftArm.rotation.z, 0.6 - preStrike * 0.3, 0.25);
        }
        if (parts.rightArm) {
            parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, -1.0 - preStrike * 0.3 + thrash, 0.25);
            parts.rightArm.rotation.z = THREE.MathUtils.lerp(parts.rightArm.rotation.z, -0.3 + thrash * 2, 0.25);
        }
        if (parts.head) {
            // 刺入前挣扎转头，刺入后猛然后仰再瘫软
            const headX = -0.4 - preStrike * 0.2 + strike * 0.5 - after * 0.3;
            parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, headX + thrash, 0.3);
            parts.head.rotation.y = THREE.MathUtils.lerp(parts.head.rotation.y, thrash * 3, 0.3);
        }
        if (parts.torso) {
            parts.torso.rotation.x = thrash * 0.4 - strike * 0.1;
        }
        // 腿部蹬地抽搐
        if (parts.leftLeg) {
            parts.leftLeg.rotation.x = 0.55 + thrash * 1.2 + strike * 0.2;
        }
        if (parts.rightLeg) {
            parts.rightLeg.rotation.x = 0.2 + thrash * 0.8;
        }
        if (parts.marker) parts.marker.visible = false;
    }

    // 死亡动画 - 彻底侧翻躺地（比倒地更瘫软、无求救）
    static animateDeath(model, progress) {
        const parts = model.userData.parts;
        if (!parts) return;

        const baseY = model.userData.baseY || 0;
        const rest = model.userData.restPose;

        // 平滑倒地动画
        const easedProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // 完全侧翻贴地
        model.rotation.z = easedProgress * (Math.PI * 0.52);
        model.rotation.x = easedProgress * 0.35;
        // 死亡贴地（旋转 pivot 在脚底，旋转后身体水平面已在 baseY，无需下沉；原 -0.95 会陷地）
        model.position.y = baseY;

        // 四肢完全放松摊开
        if (parts.leftArm) {
            parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, 0.55, easedProgress);
            parts.leftArm.rotation.z = THREE.MathUtils.lerp(parts.leftArm.rotation.z, 1.15, easedProgress);
        }
        if (parts.rightArm) {
            parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, 0.35, easedProgress);
            parts.rightArm.rotation.z = THREE.MathUtils.lerp(parts.rightArm.rotation.z, -0.95, easedProgress);
        }
        if (parts.leftForearm) {
            parts.leftForearm.rotation.x = THREE.MathUtils.lerp(parts.leftForearm.rotation.x, 0.2, easedProgress);
        }
        if (parts.rightForearm) {
            parts.rightForearm.rotation.x = THREE.MathUtils.lerp(parts.rightForearm.rotation.x, 0.15, easedProgress);
        }
        if (parts.leftLeg) {
            parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, 0.45, easedProgress);
            parts.leftLeg.rotation.z = THREE.MathUtils.lerp(parts.leftLeg.rotation.z || 0, 0.2, easedProgress);
        }
        if (parts.rightLeg) {
            parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, 0.25, easedProgress);
            parts.rightLeg.rotation.z = THREE.MathUtils.lerp(parts.rightLeg.rotation.z || 0, -0.35, easedProgress);
        }
        if (parts.leftCalf) {
            parts.leftCalf.rotation.x = THREE.MathUtils.lerp(parts.leftCalf.rotation.x, 0.6, easedProgress);
        }
        if (parts.rightCalf) {
            parts.rightCalf.rotation.x = THREE.MathUtils.lerp(parts.rightCalf.rotation.x, 0.3, easedProgress);
        }
        if (parts.head) {
            parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, 0.15, easedProgress);
            parts.head.rotation.z = THREE.MathUtils.lerp(parts.head.rotation.z, 0.25, easedProgress);
        }
        if (parts.torso) {
            parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, 0.05, easedProgress);
        }
        // 武器掉落贴地
        if (parts.weapon && rest?.weapon) {
            parts.weapon.position.x = THREE.MathUtils.lerp(parts.weapon.position.x, rest.weapon.x + 0.4, easedProgress);
            parts.weapon.position.y = THREE.MathUtils.lerp(parts.weapon.position.y, rest.weapon.y - 0.6, easedProgress);
            parts.weapon.position.z = THREE.MathUtils.lerp(parts.weapon.position.z, rest.weapon.z + 0.1, easedProgress);
            parts.weapon.rotation.x = THREE.MathUtils.lerp(parts.weapon.rotation.x, 1.0, easedProgress);
            parts.weapon.rotation.z = THREE.MathUtils.lerp(parts.weapon.rotation.z, -1.2, easedProgress);
        }

        if (parts.marker) {
            parts.marker.visible = false;
        }
    }

    // 受击反应动画 - 角色被击中时的后仰动作（支持方向感知）
    static animateHitReaction(model, intensity = 1.0, hitDirection = 0) {
        const parts = model.userData.parts;
        if (!parts) return;
        const rest = model.userData.restPose;
        if (!rest) return;

        // hitDirection: 0=正面, PI/2=右侧, PI=背面, -PI/2=左侧
        // 计算前后和左右偏移量
        const forwardBack = Math.cos(hitDirection); // 1=正面, -1=背面
        const leftRight = Math.sin(hitDirection);   // 1=右侧, -1=左侧

        // 躯干后仰（正面受击向后仰，背面受击向前頜）
        if (parts.torso) {
            parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, -0.15 * intensity * forwardBack, 0.4);
            parts.torso.rotation.z = THREE.MathUtils.lerp(parts.torso.rotation.z, 0.1 * intensity * leftRight, 0.4);
        }
        // 头部后仰（方向感知）
        if (parts.head) {
            parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, -0.2 * intensity * forwardBack, 0.4);
            parts.head.rotation.y = THREE.MathUtils.lerp(parts.head.rotation.y, 0.15 * intensity * leftRight, 0.4);
        }
        // 手臂外张（受冲击）- 根据方向调整左右手幅度
        if (parts.leftArm) {
            const leftFactor = 1 + leftRight * 0.5; // 右侧受击左手张得更大
            parts.leftArm.rotation.z = THREE.MathUtils.lerp(parts.leftArm.rotation.z, rest.leftArm.rz + 0.2 * intensity * leftFactor, 0.4);
            parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, rest.leftArm.rx + 0.1 * intensity * forwardBack, 0.4);
        }
        if (parts.rightArm) {
            const rightFactor = 1 - leftRight * 0.5; // 左侧受击右手张得更大
            parts.rightArm.rotation.z = THREE.MathUtils.lerp(parts.rightArm.rotation.z, rest.rightArm.rz - 0.2 * intensity * rightFactor, 0.4);
            parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, rest.rightArm.rx + 0.1 * intensity * forwardBack, 0.4);
        }
        // 武器轻微上扬
        if (parts.weapon) {
            parts.weapon.rotation.x = THREE.MathUtils.lerp(parts.weapon.rotation.x, 0.1 * intensity, 0.4);
        }
        // 背面受击时身体前傾
        if (parts.torso && forwardBack < 0) {
            parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, 0.12 * intensity, 0.4);
        }
    }

    // 跳跃/落地动画 - progress: 0=起跳, 0.5=最高点, 1=落地
    static animateJump(model, progress, isLanding = false) {
        const parts = model.userData.parts;
        if (!parts) return;
        const rest = model.userData.restPose;
        if (!rest) return;

        if (!isLanding) {
            // === 起跳阶段 (progress 0 -> 0.5) ===
            // 腿部弯曲准备
            const jumpPhase = progress * 2; // 0->1
            const legBend = Math.sin(jumpPhase * Math.PI) * 0.5;
            if (parts.leftLeg) {
                parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, legBend, 0.3);
            }
            if (parts.rightLeg) {
                parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, legBend, 0.3);
            }
            if (parts.leftCalf) {
                parts.leftCalf.rotation.x = THREE.MathUtils.lerp(parts.leftCalf.rotation.x, -legBend * 0.8, 0.3);
            }
            if (parts.rightCalf) {
                parts.rightCalf.rotation.x = THREE.MathUtils.lerp(parts.rightCalf.rotation.x, -legBend * 0.8, 0.3);
            }
            // 手臂上举
            const armRaise = Math.sin(jumpPhase * Math.PI) * 0.4;
            if (parts.leftArm) {
                parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, rest.leftArm.rx - armRaise, 0.3);
            }
            if (parts.rightArm) {
                parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, rest.rightArm.rx - armRaise, 0.3);
            }
            // 躯干微前倾
            if (parts.torso) {
                parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, 0.08 * jumpPhase, 0.3);
            }
        } else {
            // === 落地阶段 ===
            // 腿部弯曲缓冲（压缩效果）
            const landPhase = progress; // 0->1
            const squatAmount = Math.sin(landPhase * Math.PI) * 0.6;
            if (parts.leftLeg) {
                parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, squatAmount, 0.4);
            }
            if (parts.rightLeg) {
                parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, squatAmount, 0.4);
            }
            if (parts.leftCalf) {
                parts.leftCalf.rotation.x = THREE.MathUtils.lerp(parts.leftCalf.rotation.x, -squatAmount * 0.8, 0.4);
            }
            if (parts.rightCalf) {
                parts.rightCalf.rotation.x = THREE.MathUtils.lerp(parts.rightCalf.rotation.x, -squatAmount * 0.8, 0.4);
            }
            // 躯干前压缓冲
            if (parts.torso) {
                parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, 0.15 * Math.sin(landPhase * Math.PI), 0.4);
            }
            // 手臂下压保持平衡
            if (parts.leftArm) {
                parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, rest.leftArm.rx + 0.2 * Math.sin(landPhase * Math.PI), 0.4);
            }
            if (parts.rightArm) {
                parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, rest.rightArm.rx + 0.2 * Math.sin(landPhase * Math.PI), 0.4);
            }
            // 武器放低
            if (parts.weapon) {
                parts.weapon.position.y = THREE.MathUtils.lerp(parts.weapon.position.y, rest.weapon.y - 0.05 * Math.sin(landPhase * Math.PI), 0.4);
            }
        }
    }

    // 重置所有部件到基础姿态
    static resetPose(model) {
        const parts = model.userData.parts;
        const rest = model.userData.restPose;
        if (!parts || !rest) return;

        if (parts.leftArm) {
            parts.leftArm.position.set(rest.leftArm.x, rest.leftArm.y, rest.leftArm.z);
            parts.leftArm.rotation.set(rest.leftArm.rx || 0, 0, rest.leftArm.rz || 0);
        }
        if (parts.rightArm) {
            parts.rightArm.position.set(rest.rightArm.x, rest.rightArm.y, rest.rightArm.z);
            parts.rightArm.rotation.set(rest.rightArm.rx || 0, 0, rest.rightArm.rz || 0);
        }
        if (parts.leftForearm) {
            parts.leftForearm.position.set(rest.leftForearm.x, rest.leftForearm.y, rest.leftForearm.z);
            parts.leftForearm.rotation.set(rest.leftForearm.rx || 0, 0, rest.leftForearm.rz || 0);
        }
        if (parts.rightForearm) {
            parts.rightForearm.position.set(rest.rightForearm.x, rest.rightForearm.y, rest.rightForearm.z);
            parts.rightForearm.rotation.set(rest.rightForearm.rx || 0, 0, rest.rightForearm.rz || 0);
        }
        if (parts.leftHand) {
            parts.leftHand.position.set(rest.leftHand.x, rest.leftHand.y, rest.leftHand.z);
        }
        if (parts.rightHand) {
            parts.rightHand.position.set(rest.rightHand.x, rest.rightHand.y, rest.rightHand.z);
        }
        if (parts.weapon) {
            parts.weapon.position.set(rest.weapon.x, rest.weapon.y, rest.weapon.z);
            parts.weapon.rotation.set(0, 0, 0);
        }
        if (parts.head) {
            parts.head.rotation.set(0, 0, 0);
            parts.head.position.y = rest.head.y;
        }
        if (parts.torso) {
            parts.torso.rotation.set(0, 0, 0);
            parts.torso.position.y = rest.torso.y;
        }
    }
}
