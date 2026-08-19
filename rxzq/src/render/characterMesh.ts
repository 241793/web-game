import * as THREE from 'three';
import { PlayerDef, PlayerAppearance } from '../core/types';
import { PLAYER_SCALE } from '../core/constants';

// 写实比例人形(约1.8m):胶囊/圆柱拼装,关节用 Group 枢轴实现摆动,投射真实阴影
export interface CharacterRig {
  root: THREE.Group;       // 世界定位
  body: THREE.Group;       // 朝向旋转 + 整体姿态
  head: THREE.Mesh;
  hipL: THREE.Group;       // 左髋(大腿枢轴)
  hipR: THREE.Group;
  kneeL: THREE.Group;      // 膝(小腿枢轴)
  kneeR: THREE.Group;
  shoulderL: THREE.Group;  // 肩(手臂枢轴)
  shoulderR: THREE.Group;
  torso: THREE.Group;      // 躯干前倾
}

const geoCache = new Map<string, THREE.BufferGeometry>();
function capsule(r: number, len: number, name: string) {
  const k = `${name}:${r.toFixed(3)}:${len.toFixed(3)}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.CapsuleGeometry(r, len, 3, 8); geoCache.set(k, g); }
  return g;
}
function sphere(r: number, name: string) {
  const k = `${name}:${r.toFixed(3)}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.SphereGeometry(r, 12, 10); geoCache.set(k, g); }
  return g;
}
function boxGeo(w: number, h: number, d: number, name: string) {
  const k = `${name}:${w}:${h}:${d}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.BoxGeometry(w, h, d); geoCache.set(k, g); }
  return g;
}
function cone(r: number, h: number, name: string) {
  const k = `${name}:${r}:${h}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.ConeGeometry(r, h, 6); geoCache.set(k, g); }
  return g;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: number, rough = 0.85) {
  const k = `${color}:${rough}`;
  let m = matCache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.02 });
    matCache.set(k, m);
  }
  return m;
}

function shadowMesh(m: THREE.Mesh) {
  m.castShadow = true;
  return m;
}

// 外观推导:未配置 appearance 时按属性稳定生成,保证每名角色辨识度
export function deriveAppearance(def: PlayerDef, index: number, isKeeper: boolean): PlayerAppearance {
  if (def.appearance) return def.appearance;
  const build: PlayerAppearance['build'] =
    isKeeper ? 'heavy'
    : def.toughness >= 1.2 ? 'heavy'
    : def.speed >= 1.15 ? 'slim'
    : 'medium';
  const h = Math.round(def.power * 20 + def.speed * 17 + def.toughness * 13 + index * 7);
  const hairStyle: PlayerAppearance['hairStyle'] =
    isKeeper ? 'short'
    : (['short', 'spiky', 'long', 'bald'] as const)[h % 4];
  const face: PlayerAppearance['face'] = (['normal', 'smile', 'frown'] as const)[h % 3];
  return { build, hairStyle, face };
}

// 身体尺寸(米)
const H = {
  legUpper: 0.44, legLower: 0.42, footY: 0.06,
  torsoH: 0.62, torsoR: 0.17,
  armUpper: 0.3, armLower: 0.28,
  headR: 0.13,
};
const HIP_Y = H.footY + H.legLower + H.legUpper + 0.05; // ~0.97
const SHOULDER_Y = HIP_Y + H.torsoH;                     // ~1.59
const HEAD_Y = SHOULDER_Y + 0.19;                        // ~1.78

// 球衣号码:细长方布,颜色取与球衣对比度最高者
function numberTexture(index: number, jersey: number) {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  const g = cv.getContext('2d')!;
  g.clearRect(0, 0, 64, 64);
  const r = ((jersey >> 16) & 255) / 255, gg = ((jersey >> 8) & 255) / 255, b = (jersey & 255) / 255;
  const lum = 0.299 * r + 0.587 * gg + 0.114 * b;
  g.fillStyle = lum > 0.55 ? '#101014' : '#f4f4f8';
  g.font = 'bold 46px "Courier New",monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(index + 1), 32, 34);
  const tex = new THREE.CanvasTexture(cv);
  return tex;
}

export function buildCharacter(def: PlayerDef, jersey: number, jersey2: number, isKeeper: boolean, index = 1): CharacterRig {
  const root = new THREE.Group();
  root.scale.setScalar(PLAYER_SCALE);
  const body = new THREE.Group();
  root.add(body);

  const app = deriveAppearance(def, index, isKeeper);
  const bodyW = app.build === 'heavy' ? 1.22 : app.build === 'slim' ? 0.9 : 1.0;
  const chestR = (H.torsoR + 0.045) * bodyW;
  const thighR = 0.065 * (bodyW * 0.82 + 0.18);
  const armR = 0.055 * (bodyW * 0.75 + 0.25);

  const kitColor = isKeeper ? 0x2f2f35 : jersey;
  const kitColor2 = isKeeper ? 0xd8d84a : jersey2;
  const skin = mat(def.skin);
  const kit = mat(kitColor, 0.8);
  const kit2 = mat(kitColor2, 0.8);
  const sock = mat(kitColor2, 0.9);
  const boot = mat(0x18181c, 0.6);

  const torso = new THREE.Group();
  torso.position.y = HIP_Y;
  body.add(torso);

  // 躯干(球衣)
  const chest = shadowMesh(new THREE.Mesh(capsule(chestR, H.torsoH - 0.2, 'chest'), kit));
  chest.position.y = H.torsoH / 2;
  torso.add(chest);
  // 球衣下摆条纹
  const hem = shadowMesh(new THREE.Mesh(boxGeo(0.4 * bodyW, 0.075, 0.26 * bodyW, 'hem'), kit2));
  hem.position.y = 0.1;
  torso.add(hem);

  // 胸前号码(正面 +z)
  const numTex = numberTexture(index, kitColor);
  const num = shadowMesh(new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.16),
    new THREE.MeshBasicMaterial({ map: numTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })
  ));
  num.position.set(0, H.torsoH / 2, chestR + 0.012);
  torso.add(num);

  // 头 + 颈
  const neck = new THREE.Mesh(capsule(0.045, 0.06, 'neck'), skin);
  neck.position.y = H.torsoH + 0.05;
  torso.add(neck);
  const head = shadowMesh(new THREE.Mesh(sphere(H.headR, 'head'), skin));
  head.position.y = HEAD_Y - HIP_Y;
  torso.add(head);

  // 面部:眼/眉/嘴(面向 +z)
  const eye = (side: number) => {
    const m = shadowMesh(new THREE.Mesh(boxGeo(0.034, 0.05, 0.02, 'eye'), mat(0x14141c, 0.4)));
    m.position.set(side * 0.045, 0.035, H.headR + 0.004);
    head.add(m);
    const brow = shadowMesh(new THREE.Mesh(boxGeo(0.046, 0.018, 0.016, 'brow'), mat(def.hair, 0.9)));
    brow.position.set(side * 0.045, 0.078, H.headR + 0.006);
    head.add(brow);
  };
  eye(-1); eye(1);
  const mouth = shadowMesh(new THREE.Mesh(boxGeo(0.06, 0.014, 0.014, 'mouth'), mat(0x5a2020, 0.5)));
  mouth.position.set(0, app.face === 'frown' ? -0.09 : -0.05, H.headR + 0.006);
  if (app.face === 'smile') mouth.rotation.z = 0; else if (app.face === 'frown') mouth.rotation.z = 0;
  head.add(mouth);

  // 发型
  if (app.hairStyle !== 'bald') {
    const hairGeo = sphere(H.headR + 0.015, 'hair');
    const hairMat = mat(def.hair, 0.95);
    if (app.hairStyle === 'short') {
      const hair = shadowMesh(new THREE.Mesh(hairGeo, hairMat));
      hair.scale.set(1, 0.72, 1);
      hair.position.y = 0.05;
      head.add(hair);
    } else if (app.hairStyle === 'spiky') {
      const cap = shadowMesh(new THREE.Mesh(hairGeo, hairMat));
      cap.scale.set(1, 0.8, 1);
      cap.position.y = 0.07;
      head.add(cap);
      for (let i = 0; i < 5; i++) {
        const spike = shadowMesh(new THREE.Mesh(cone(0.028, 0.11, 'spike'), hairMat));
        const a = (i / 5) * Math.PI * 2;
        spike.position.set(Math.cos(a) * 0.09, 0.16 + Math.sin(i * 1.7) * 0.04, Math.sin(a) * 0.09);
        spike.rotation.z = Math.cos(a) * 0.4;
        spike.rotation.x = -Math.sin(a) * 0.4;
        head.add(spike);
      }
    } else if (app.hairStyle === 'long') {
      const cap = shadowMesh(new THREE.Mesh(hairGeo, hairMat));
      cap.scale.set(1.06, 0.78, 1.06);
      cap.position.y = 0.05;
      head.add(cap);
      // 后发垂尾
      const back = shadowMesh(new THREE.Mesh(boxGeo(0.16, 0.2, 0.08, 'longhair'), hairMat));
      back.position.set(0, -0.1, -0.1);
      head.add(back);
    }
  }

  // 手臂(肩枢轴在肩点,几何体向下偏移)
  const mkArm = (side: number) => {
    const sh = new THREE.Group();
    sh.position.set(side * (chestR + 0.06), H.torsoH - 0.05, 0);
    torso.add(sh);
    // 袖管(门将为长袖)
    const sleeve = shadowMesh(new THREE.Mesh(capsule(armR, H.armUpper * 0.9, 'sleeve'), kit));
    sleeve.position.y = -H.armUpper * 0.3;
    sh.add(sleeve);
    const upper = shadowMesh(new THREE.Mesh(capsule(0.04, H.armUpper * 0.5, 'armU'), skin));
    upper.position.y = -H.armUpper * 0.6;
    sh.add(upper);
    const lowerMat = isKeeper ? kit : skin;
    const lower = shadowMesh(new THREE.Mesh(capsule(isKeeper ? 0.042 : 0.04, H.armLower, 'armL'), lowerMat));
    lower.position.y = -H.armUpper - H.armLower / 2;
    sh.add(lower);
    if (isKeeper) {
      // 手套
      const glove = shadowMesh(new THREE.Mesh(boxGeo(0.07, 0.09, 0.12, 'glove'), kit2));
      glove.position.set(0, -H.armUpper - H.armLower - 0.02, 0);
      sh.add(glove);
    }
    return sh;
  };
  const shoulderL = mkArm(-1);
  const shoulderR = mkArm(1);

  // 短裤
  const shorts = shadowMesh(new THREE.Mesh(boxGeo(0.36 * bodyW, 0.2, 0.24 * bodyW, 'shorts'), kit2));
  shorts.position.y = HIP_Y - 0.06;
  body.add(shorts);

  // 腿:髋枢轴 → 大腿;膝枢轴 → 小腿+袜+鞋
  const mkLeg = (side: number) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.1, HIP_Y - 0.1, 0);
    body.add(hip);
    const thigh = shadowMesh(new THREE.Mesh(capsule(thighR, H.legUpper * 0.7, 'thigh'), skin));
    thigh.position.y = -H.legUpper / 2;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -H.legUpper;
    hip.add(knee);
    const calf = shadowMesh(new THREE.Mesh(capsule(0.05, H.legLower * 0.55, 'calf'), sock));
    calf.position.y = -H.legLower / 2;
    knee.add(calf);
    const foot = shadowMesh(new THREE.Mesh(boxGeo(0.09, 0.07, 0.22, 'foot'), boot));
    foot.position.set(0, -H.legLower - 0.02, 0.05);
    knee.add(foot);
    return { hip, knee };
  };
  const L = mkLeg(-1);
  const R = mkLeg(1);

  return {
    root, body, head,
    hipL: L.hip, hipR: R.hip, kneeL: L.knee, kneeR: R.knee,
    shoulderL, shoulderR, torso,
  };
}

// 姿态动画:跑步摆臂摆腿 + 各状态姿势
export function animateRig(rig: CharacterRig, state: string, animT: number, moving: boolean, y: number) {
  const b = rig.body;
  b.position.y = y;
  b.rotation.x = 0; b.rotation.z = 0;
  rig.torso.rotation.x = 0;

  const swing = Math.sin(animT * 11);
  const set = (hipL: number, hipR: number, kneeL: number, kneeR: number, armL: number, armR: number) => {
    rig.hipL.rotation.x = hipL; rig.hipR.rotation.x = hipR;
    rig.kneeL.rotation.x = kneeL; rig.kneeR.rotation.x = kneeR;
    rig.shoulderL.rotation.x = armL; rig.shoulderR.rotation.x = armR;
  };

  switch (state) {
    case 'run': {
      const a = 0.75;
      set(swing * a, -swing * a,
        Math.max(0, -swing) * 1.1, Math.max(0, swing) * 1.1,
        -swing * a * 0.9, swing * a * 0.9);
      rig.torso.rotation.x = 0.12;
      b.position.y = y + Math.abs(Math.sin(animT * 11)) * 0.04;
      break;
    }
    case 'dash': {
      const a = 1.0;
      set(swing * a, -swing * a,
        Math.max(0, -swing) * 1.3, Math.max(0, swing) * 1.3,
        -swing * a, swing * a);
      rig.torso.rotation.x = 0.32;
      break;
    }
    case 'dribble': {
      const step = Math.sin(animT * 24);
      set(step * 0.45, -step * 0.45, 0.55, 0.25, -step * 0.7, step * 0.7);
      b.rotation.z = step * 0.16;
      rig.torso.rotation.x = 0.22;
      break;
    }
    case 'jump':
    case 'headbutt':
      set(-0.5, 0.4, 1.0, 0.5, -2.7, -2.7);
      break;
    case 'slide':
    case 'tackle':
      b.rotation.x = -1.15;
      b.position.y = y + 0.18;
      set(0.25, -1.0, 0.1, 0.4, 1.3, -1.5);
      break;
    case 'fallen':
      b.rotation.x = -Math.PI / 2;
      b.position.y = y + 0.22;
      set(0.12, -0.12, 0.15, 0.15, 0.5, -0.5);
      break;
    case 'kick':
      set(0.3, -1.35, 0.2, 0.35, 0.9, -0.9);
      rig.torso.rotation.x = 0.18;
      break;
    default: {
      const idle = Math.sin(animT * 2.4) * 0.03;
      set(0, 0, 0.02, 0.02, idle, -idle);
      b.position.y = y + Math.sin(animT * 2.4) * 0.006;
      break;
    }
  }
}
