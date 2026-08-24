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
  lastPose: number[];      // 上帧关节姿态(姿态混合用)
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
// 锥台(上/下半径不同):四肢锥度化用
function taper(topR: number, bottomR: number, h: number, name: string) {
  const k = `${name}:${topR.toFixed(3)}:${bottomR.toFixed(3)}:${h.toFixed(3)}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.CylinderGeometry(topR, bottomR, h, 10); geoCache.set(k, g); }
  return g;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: number, rough = 0.85, metal = 0.02) {
  const k = `${color}:${rough}:${metal}`;
  let m = matCache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
    matCache.set(k, m);
  }
  return m;
}

// 颜色加深:各通道乘系数(门将球衣用,保留队色倾向)
function darkenColor(color: number, factor: number) {
  const r = Math.round(((color >> 16) & 255) * factor);
  const g = Math.round(((color >> 8) & 255) * factor);
  const b = Math.round((color & 255) * factor);
  return (r << 16) | (g << 8) | b;
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
    : (['short', 'spiky', 'long', 'bald', 'mohawk', 'ponytail', 'curly', 'buzz'] as const)[h % 8];
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

  // 门将球衣=本队主色加深(区分敌我门将),副色保持高亮黄便于识别身份
  const kitColor = isKeeper ? darkenColor(jersey, 0.45) : jersey;
  const kitColor2 = isKeeper ? 0xd8d84a : jersey2;
  // 材质:球衣微光泽织物感、皮肤微反光、头发有光泽
  const skin = mat(def.skin, 0.75);
  const kit = mat(kitColor, 0.72, 0.04);
  const kit2 = mat(kitColor2, 0.72, 0.04);
  const sock = mat(kitColor2, 0.85);
  const boot = mat(0x18181c, 0.55, 0.06);

  const torso = new THREE.Group();
  torso.position.y = HIP_Y;
  body.add(torso);

  // 躯干重塑:上宽下窄 V 型运动员轮廓——主胸胶囊 + 收腰短胶囊 + 圆肩头
  const chest = shadowMesh(new THREE.Mesh(capsule(chestR, H.torsoH - 0.24, 'chest'), kit));
  chest.position.y = H.torsoH / 2 + 0.05;
  torso.add(chest);
  const waistR = chestR * (app.build === 'heavy' ? 0.82 : app.build === 'slim' ? 0.62 : 0.72);
  const waist = shadowMesh(new THREE.Mesh(taper(chestR * 0.94, waistR, H.torsoH * 0.42, 'waist'), kit));
  waist.position.y = H.torsoH * 0.24;
  torso.add(waist);
  // 肩头小球:圆润溜肩过渡
  for (const sx of [-1, 1]) {
    const shoulderBall = shadowMesh(new THREE.Mesh(sphere(chestR * 0.52, 'shoulderBall'), kit));
    shoulderBall.position.set(sx * (chestR + armR * 0.4), H.torsoH - 0.06, 0);
    torso.add(shoulderBall);
  }
  // 球衣竖纹:两条 kit2 色细条(远看有球衣设计感)
  for (const sx of [-0.55, 0.55]) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, H.torsoH - 0.28, 0.02),
      new THREE.MeshBasicMaterial({ color: kitColor2, transparent: true, opacity: 0.85 })
    );
    stripe.position.set(sx * chestR * 1.9, H.torsoH / 2, -chestR - 0.005);
    torso.add(stripe);
    const stripeF = stripe.clone();
    stripeF.position.z = chestR + 0.005;
    torso.add(stripeF);
  }
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

  // 背号(背面 -z)
  const numBack = shadowMesh(new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 0.18),
    new THREE.MeshBasicMaterial({ map: numTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })
  ));
  numBack.position.set(0, H.torsoH / 2, -chestR - 0.012);
  numBack.rotation.y = Math.PI;
  torso.add(numBack);

  // 头 + 颈:锥台颈消除头身断裂,头部略拉长带下巴感
  const neck = shadowMesh(new THREE.Mesh(taper(0.042, 0.062, 0.09, 'neck'), skin));
  neck.position.y = H.torsoH + 0.05;
  torso.add(neck);
  const head = shadowMesh(new THREE.Mesh(sphere(H.headR, 'head'), skin));
  head.scale.set(1, 1.08, 0.98);
  head.position.y = HEAD_Y - HIP_Y;
  torso.add(head);
  // 双耳:两侧小压扁球
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(sphere(0.028, 'ear'), skin);
    ear.scale.set(0.5, 1, 0.8);
    ear.position.set(sx * (H.headR - 0.004), 0.005, 0);
    head.add(ear);
  }

  // 面部:眼(白底+瞳孔双层)/眉(随表情倾斜)/嘴(面向 +z)
  const eye = (side: number) => {
    const white = new THREE.Mesh(sphere(0.02, 'eyeWhite'), mat(0xf4f2ec, 0.4));
    white.scale.set(1, 1.15, 0.45);
    white.position.set(side * 0.045, 0.038, H.headR * 0.92 + 0.004);
    head.add(white);
    const pupil = new THREE.Mesh(boxGeo(0.016, 0.022, 0.012, 'pupil'), mat(0x14141c, 0.35));
    pupil.position.set(side * 0.045, 0.038, H.headR * 0.98 + 0.006);
    head.add(pupil);
    // 眉毛:frown 内高外低(皱眉),smile 平缓上扬
    const brow = shadowMesh(new THREE.Mesh(boxGeo(0.046, 0.016, 0.014, 'brow'), mat(def.hair, 0.85)));
    brow.position.set(side * 0.047, app.face === 'frown' ? 0.082 : 0.076, H.headR * 0.96 + 0.006);
    brow.rotation.z = side * (app.face === 'frown' ? -0.28 : app.face === 'smile' ? 0.1 : 0);
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
    } else if (app.hairStyle === 'mohawk') {
      // 莫西干:剃边 + 中央一排刺
      const side = shadowMesh(new THREE.Mesh(hairGeo, hairMat));
      side.scale.set(0.72, 0.5, 1);
      side.position.y = 0.02;
      head.add(side);
      for (let i = -2; i <= 2; i++) {
        const spike = shadowMesh(new THREE.Mesh(cone(0.03, 0.13 - Math.abs(i) * 0.02, 'mohawkSpike'), hairMat));
        spike.position.set(0, 0.14, i * 0.05);
        head.add(spike);
      }
    } else if (app.hairStyle === 'ponytail') {
      const cap = shadowMesh(new THREE.Mesh(hairGeo, hairMat));
      cap.scale.set(1, 0.76, 1);
      cap.position.y = 0.04;
      head.add(cap);
      // 马尾:脑后下垂束
      const tail = shadowMesh(new THREE.Mesh(capsule(0.035, 0.16, 'ponytail'), hairMat));
      tail.position.set(0, 0.02, -0.15);
      tail.rotation.x = 0.5;
      head.add(tail);
    } else if (app.hairStyle === 'curly') {
      // 爆炸卷发:头顶小球簇
      const cap = shadowMesh(new THREE.Mesh(hairGeo, hairMat));
      cap.scale.set(1.12, 0.9, 1.12);
      cap.position.y = 0.06;
      head.add(cap);
      for (let i = 0; i < 6; i++) {
        const curl = shadowMesh(new THREE.Mesh(sphere(0.052, 'curl'), hairMat));
        const a = (i / 6) * Math.PI * 2;
        curl.position.set(Math.cos(a) * 0.085, 0.12 + (i % 2) * 0.04, Math.sin(a) * 0.085);
        head.add(curl);
      }
    } else if (app.hairStyle === 'buzz') {
      // 寸头:贴头皮深色薄壳
      const buzzMat = mat(darkenColor(def.hair, 0.7), 0.95);
      const buzz = new THREE.Mesh(hairGeo, buzzMat);
      buzz.scale.set(0.99, 0.62, 0.99);
      buzz.position.y = 0.03;
      head.add(buzz);
    }
  }

  // 手臂(肩枢轴在肩点,几何体向下偏移;锥度化+手掌)
  const mkArm = (side: number) => {
    const sh = new THREE.Group();
    sh.position.set(side * (chestR + 0.06), H.torsoH - 0.05, 0);
    torso.add(sh);
    // 袖管(门将为长袖)
    const sleeve = shadowMesh(new THREE.Mesh(taper(armR + 0.006, armR * 0.82, H.armUpper * 0.62, 'sleeve'), kit));
    sleeve.position.y = -H.armUpper * 0.3;
    sh.add(sleeve);
    // 袖口:kit2 色薄环,增强球衣设计感
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(armR * 0.85, armR * 0.85, 0.03, 10), kit2);
    cuff.position.y = -H.armUpper * 0.62;
    sh.add(cuff);
    // 队长袖标(3 号中场核心):左臂金色环
    if (index === 3 && side === -1 && !isKeeper) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(armR * 0.92, armR * 0.92, 0.055, 10),
        mat(0xf5d33d, 0.5, 0.08));
      band.position.y = -H.armUpper * 0.42;
      sh.add(band);
    }
    // 上臂锥度
    const upper = shadowMesh(new THREE.Mesh(taper(armR * 0.8, armR * 0.62, H.armUpper * 0.55, 'armU'), skin));
    upper.position.y = -H.armUpper * 0.62;
    sh.add(upper);
    const lowerMat = isKeeper ? kit : skin;
    // 前臂锥度(腕部收细)
    const lower = shadowMesh(new THREE.Mesh(taper(armR * 0.6, armR * 0.42, H.armLower * 0.9, 'armL'), lowerMat));
    lower.position.y = -H.armUpper - H.armLower / 2 + 0.02;
    sh.add(lower);
    // 手掌(压扁球)/门将手套(大一号压扁球)
    const hand = shadowMesh(new THREE.Mesh(sphere(0.05, 'hand'), isKeeper ? kit2 : skin));
    hand.scale.set(0.72, 0.95, 0.5);
    hand.position.set(0, -H.armUpper - H.armLower + 0.01, 0.01);
    sh.add(hand);
    return sh;
  };
  const shoulderL = mkArm(-1);
  const shoulderR = mkArm(1);

  // 短裤
  const shorts = shadowMesh(new THREE.Mesh(boxGeo(0.36 * bodyW, 0.2, 0.24 * bodyW, 'shorts'), kit2));
  shorts.position.y = HIP_Y - 0.06;
  body.add(shorts);

  // 腿:髋枢轴 → 大腿;膝枢轴 → 小腿+袜+鞋;锥度化
  const mkLeg = (side: number) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.1, HIP_Y - 0.1, 0);
    body.add(hip);
    const thigh = shadowMesh(new THREE.Mesh(taper(thighR + 0.02, thighR * 0.72, H.legUpper * 0.92, 'thigh'), skin));
    thigh.position.y = -H.legUpper / 2;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -H.legUpper;
    hip.add(knee);
    const calf = shadowMesh(new THREE.Mesh(taper(0.058, 0.036, H.legLower * 0.82, 'calf'), sock));
    calf.position.y = -H.legLower / 2;
    knee.add(calf);
    // 球袜顶部白环
    const sockRing = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.03, 10), mat(0xf2f2f2, 0.85));
    sockRing.position.y = -H.legLower * 0.24;
    knee.add(sockRing);
    // 两段式球鞋:前掌低+后跟高台阶,白色鞋底薄层
    const sole = new THREE.Mesh(boxGeo(0.1, 0.022, 0.24, 'sole'), mat(0xececec, 0.5));
    sole.position.set(0, -H.legLower - 0.052, 0.05);
    knee.add(sole);
    const heel = shadowMesh(new THREE.Mesh(boxGeo(0.09, 0.05, 0.09, 'heel'), boot));
    heel.position.set(0, -H.legLower - 0.018, -0.04);
    knee.add(heel);
    const forefoot = shadowMesh(new THREE.Mesh(boxGeo(0.092, 0.036, 0.15, 'forefoot'), boot));
    forefoot.position.set(0, -H.legLower - 0.03, 0.08);
    knee.add(forefoot);
    // 鞋带:kit2 色薄条
    const lace = new THREE.Mesh(boxGeo(0.05, 0.016, 0.07, 'lace'), kit2);
    lace.position.set(0, -H.legLower - 0.006, 0.06);
    knee.add(lace);
    return { hip, knee };
  };
  const L = mkLeg(-1);
  const R = mkLeg(1);

  return {
    root, body, head,
    hipL: L.hip, hipR: R.hip, kneeL: L.knee, kneeR: R.knee,
    shoulderL, shoulderR, torso,
    lastPose: [0, 0, 0.02, 0.02, 0, 0],
  };
}

// 姿态动画:跑步摆臂摆腿 + 各状态姿势;关节角度向前帧缓存姿态插值,消除状态切换跳变
// speedNorm: 0..1 当前速度占冲刺速度比(驱动步频/前倾);stateT: 状态持续秒数(驱动 kick 三段)
export function animateRig(rig: CharacterRig, state: string, animT: number, moving: boolean, y: number,
                           trick?: string, speedNorm = 0.5, stateT = 0) {
  const b = rig.body;
  b.position.y = y;
  b.rotation.x = 0; b.rotation.z = 0;
  rig.torso.rotation.x = 0;
  // 骨盆滚动/手臂外张等 z 轴分量(每帧重置后按姿态写入)
  rig.hipL.rotation.z = 0; rig.hipR.rotation.z = 0;
  rig.shoulderL.rotation.z = 0; rig.shoulderR.rotation.z = 0;

  const target = [0, 0, 0.02, 0.02, 0, 0];
  const set = (hipL: number, hipR: number, kneeL: number, kneeR: number, armL: number, armR: number) => {
    target[0] = hipL; target[1] = hipR; target[2] = kneeL; target[3] = kneeR;
    target[4] = armL; target[5] = armR;
  };
  // 步频随速度提升:慢走低频、冲刺高频
  const strideF = 8 + Math.max(0, Math.min(1, speedNorm)) * 9;

  switch (state) {
    case 'run': {
      const swing = Math.sin(animT * strideF);
      const a = 0.6 + speedNorm * 0.3;
      set(swing * a, -swing * a,
        Math.max(0, -swing) * (0.9 + speedNorm * 0.5), Math.max(0, swing) * (0.9 + speedNorm * 0.5),
        -swing * a * 0.9, swing * a * 0.9);
      // 骨盆滚动:双髋反向微摆
      rig.hipL.rotation.z = swing * 0.07 * speedNorm;
      rig.hipR.rotation.z = -swing * 0.07 * speedNorm;
      // 手臂自然外张
      rig.shoulderL.rotation.z = -0.1 - speedNorm * 0.05;
      rig.shoulderR.rotation.z = 0.1 + speedNorm * 0.05;
      // 躯干前倾随速度
      rig.torso.rotation.x = 0.06 + speedNorm * 0.18;
      b.position.y = y + Math.abs(Math.sin(animT * strideF)) * 0.04;
      break;
    }
    case 'dash': {
      const swing = Math.sin(animT * (strideF + 2));
      set(swing, -swing,
        Math.max(0, -swing) * 1.4, Math.max(0, swing) * 1.4,
        -swing - 0.4, swing - 0.4);   // 双臂后摆冲刺姿态
      rig.hipL.rotation.z = swing * 0.09;
      rig.hipR.rotation.z = -swing * 0.09;
      rig.shoulderL.rotation.z = -0.14;
      rig.shoulderR.rotation.z = 0.14;
      rig.torso.rotation.x = 0.38;
      break;
    }
    case 'dribble': {
      // 花式招式专属姿态
      if (trick === 'rainbow') {
        // 彩虹挑球:单腿高抬后蹬,躯干后仰
        const kickT = Math.min(1, (animT % 1) * 3);
        set(-1.5 + kickT * 0.9, 0.35, 0.8, 0.3, -1.2, 1.4);
        rig.torso.rotation.x = -0.18;
        break;
      }
      if (trick === 'elastico') {
        // 牛尾巴:身体大幅交替倾斜(外晃内扣)
        const sway = Math.sin(animT * 30) * 0.32;
        set(sway * 0.7, -sway * 0.7, 0.45, 0.45, -sway, sway);
        b.rotation.z = sway;
        rig.torso.rotation.x = 0.24;
        break;
      }
      if (trick === 'croqueta') {
        // 油炸丸子:高频小跳步横拨
        const step = Math.sin(animT * 34);
        set(step * 0.55, -step * 0.55, 0.4, 0.4, -step * 0.6, step * 0.6);
        b.rotation.z = step * 0.12;
        rig.torso.rotation.x = 0.16;
        break;
      }
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
    case 'dive':
      // 门将扑救:身体横置、双臂向扑救方向前伸、双腿拖后
      b.rotation.x = -1.2;
      b.position.y = y + 0.28;
      set(0.3, -0.4, 0.5, 0.7, -1.5, -1.5);
      rig.torso.rotation.x = 0.12;
      break;
    case 'fallen':
      b.rotation.x = -Math.PI / 2;
      b.position.y = y + 0.22;
      set(0.12, -0.12, 0.15, 0.15, 0.5, -0.5);
      break;
    case 'kick': {
      // 三段发力:后摆蓄力 → 快速前摆 → 收势回弹(一次性质感而非静态定格)
      if (stateT < 0.09) {
        const t = stateT / 0.09;
        set(t * 0.55, -t * 0.7, t * 0.3, 0.5 + t * 0.4, t * 0.5, -t * 0.5);
        rig.torso.rotation.x = -0.12 * t;   // 躯干后仰蓄力
      } else if (stateT < 0.16) {
        const t = (stateT - 0.09) / 0.07;
        set(0.55 - t * 0.25, -0.7 + t * (-0.9), 0.3, 0.9 - t * 0.55, 0.5, -0.5);
        rig.torso.rotation.x = -0.12 + t * 0.34;
        b.position.y = y + t * 0.06;         // 发力瞬间轻微腾身
      } else {
        const t = Math.min(1, (stateT - 0.16) / 0.12);
        set(0.3 - t * 0.05, -1.6 + t * 1.3, 0.2, 0.35 - t * 0.15, 0.9 - t * 0.6, -0.9 + t * 0.6);
        rig.torso.rotation.x = 0.22 - t * 0.04;
      }
      break;
    }
    case 'celebrate':
      // 进球庆祝:挥拳跳跃
      set(-Math.abs(Math.sin(animT * 8)) * 0.5, Math.abs(Math.sin(animT * 8 + 1)) * 0.5,
        0.4, 0.4, -2.9 + Math.sin(animT * 8) * 0.4, -2.9 - Math.sin(animT * 8) * 0.4);
      b.position.y = y + Math.abs(Math.sin(animT * 8)) * 0.22;
      rig.torso.rotation.x = -0.12;
      break;
    case 'celebrateSlide': {
      // 滑跪:身体后仰、双臂展开、双腿前伸贴地
      b.rotation.x = 0.85;
      b.position.y = y + 0.12;
      const armWave = Math.sin(animT * 6) * 0.25;
      set(-1.35, -1.35, 0.15, 0.15, -2.4 + armWave, -2.4 - armWave);
      rig.torso.rotation.x = -0.3;
      break;
    }
    case 'celebrateFly': {
      // 飞翔:双臂平展如飞机,原地旋转由 scene 层处理 body.rotation.y
      b.position.y = y + Math.abs(Math.sin(animT * 5)) * 0.16;
      set(0, 0, 0.15, 0.15, -1.55, -1.55);
      rig.torso.rotation.x = 0.08;
      break;
    }
    case 'celebrateCradle': {
      // 摇篮舞:双臂环抱前后轻晃,头微低
      const rock = Math.sin(animT * 4) * 0.35;
      set(0, 0, 0.1, 0.1, -1.9 + rock, -1.9 - rock);
      rig.shoulderL.rotation.z = 0.9;
      rig.shoulderR.rotation.z = -0.9;
      rig.torso.rotation.x = 0.14;
      break;
    }
    default: {
      // idle:呼吸起伏 + 双臂垂放微外张 + 重心缓慢左右微移
      const breathe = Math.sin(animT * 2.4);
      const idle = breathe * 0.045;
      set(0, 0, 0.02, 0.02, idle, -idle);
      rig.shoulderL.rotation.z = -0.06;
      rig.shoulderR.rotation.z = 0.06;
      b.position.y = y + breathe * 0.014;
      break;
    }
  }

  // 姿态混合:快速指数插值到目标姿态
  const lp = rig.lastPose;
  for (let i = 0; i < 6; i++) {
    lp[i] += (target[i] - lp[i]) * 0.55;
  }
  rig.hipL.rotation.x = lp[0]; rig.hipR.rotation.x = lp[1];
  rig.kneeL.rotation.x = lp[2]; rig.kneeR.rotation.x = lp[3];
  rig.shoulderL.rotation.x = lp[4]; rig.shoulderR.rotation.x = lp[5];
}
