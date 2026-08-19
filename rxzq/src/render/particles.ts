import * as THREE from 'three';
import * as C from '../core/constants';
import { Weather } from '../game/match';

// 通用粒子池:烟花/尘土/雨雪,全部 Points 实现,零外部素材
interface Particle {
  active: boolean;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number;
  size: number;
  color: THREE.Color;
  gravity: number;
}

const MAX = 900;

export class ParticleSystem {
  points: THREE.Points;
  private parts: Particle[] = [];
  private geo = new THREE.BufferGeometry();
  private posAttr: THREE.BufferAttribute;
  private colAttr: THREE.BufferAttribute;
  private sizeAttr: THREE.BufferAttribute;

  constructor(scene: THREE.Scene) {
    for (let i = 0; i < MAX; i++) {
      this.parts.push({
        active: false, x: 0, y: -100, z: 0, vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 1, size: 1, color: new THREE.Color(), gravity: 0,
      });
    }
    this.posAttr = new THREE.BufferAttribute(new Float32Array(MAX * 3), 3);
    this.colAttr = new THREE.BufferAttribute(new Float32Array(MAX * 3), 3);
    this.sizeAttr = new THREE.BufferAttribute(new Float32Array(MAX), 1);
    this.geo.setAttribute('position', this.posAttr);
    this.geo.setAttribute('color', this.colAttr);
    this.geo.setAttribute('psize', this.sizeAttr);

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float psize;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = psize * (180.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.1, d);
          gl_FragColor = vec4(vColor, a);
        }`,
      vertexColors: true,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  private spawn(n: number, fn: (p: Particle) => void) {
    let spawned = 0;
    for (const p of this.parts) {
      if (spawned >= n) break;
      if (p.active) continue;
      p.active = true;
      fn(p);
      spawned++;
    }
  }

  // 进球烟花:多彩球状爆发(在球门上方多点)
  fireworks(x: number, z: number) {
    const colors = [0xffd23d, 0xf55a3d, 0x3df58a, 0x3dd5f5, 0xc03df5, 0xffffff];
    for (let burst = 0; burst < 4; burst++) {
      const bx = x + (Math.random() - 0.5) * 16;
      const bz = z + (Math.random() - 0.5) * 10;
      const by = 8 + Math.random() * 7;
      const col = new THREE.Color(colors[(Math.random() * colors.length) | 0]);
      this.spawn(46, p => {
        const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1);
        const sp = 6 + Math.random() * 9;
        p.x = bx; p.y = by; p.z = bz;
        p.vx = Math.sin(ph) * Math.cos(th) * sp;
        p.vy = Math.cos(ph) * sp;
        p.vz = Math.sin(ph) * Math.sin(th) * sp;
        p.life = p.maxLife = 1.1 + Math.random() * 0.7;
        p.size = 1.4 + Math.random();
        p.color.copy(col).offsetHSL((Math.random() - 0.5) * 0.08, 0, 0);
        p.gravity = -9;
      });
    }
  }

  // 尘土:踢球/铲球/落地
  dust(x: number, z: number, n = 10, spread = 3.5, colorHex = 0x9a8a68) {
    this.spawn(n, p => {
      const th = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * spread;
      p.x = x; p.y = 0.2 + Math.random() * 0.4; p.z = z;
      p.vx = Math.cos(th) * sp; p.vy = 1.5 + Math.random() * 2; p.vz = Math.sin(th) * sp;
      p.life = p.maxLife = 0.4 + Math.random() * 0.4;
      p.size = 1.2 + Math.random() * 1.4;
      p.color.setHex(colorHex);
      p.gravity = -8;
    });
  }

  // 必杀发动冲击环
  burst(x: number, y: number, z: number, colorHex: number) {
    this.spawn(60, p => {
      const th = Math.random() * Math.PI * 2;
      const sp = 5 + Math.random() * 10;
      p.x = x; p.y = y + 0.5; p.z = z;
      p.vx = Math.cos(th) * sp; p.vy = Math.random() * 4; p.vz = Math.sin(th) * sp;
      p.life = p.maxLife = 0.5 + Math.random() * 0.5;
      p.size = 1.6 + Math.random() * 1.2;
      p.color.setHex(colorHex);
      p.gravity = -2;
    });
  }

  // 天气:雨/雪持续洒落(在镜头附近区域)
  weatherTick(w: Weather, camX: number, camZ: number, dt: number) {
    if (w === 'clear') return;
    const rate = w === 'rain' ? 300 : 130; // 每秒粒子数
    const n = Math.floor(rate * dt + (Math.random() < rate * dt % 1 ? 1 : 0));
    this.spawn(n, p => {
      p.x = camX + (Math.random() - 0.5) * 110;
      p.z = camZ + (Math.random() - 0.5) * 90 - 20;
      p.y = 26 + Math.random() * 8;
      if (w === 'rain') {
        p.vx = -3; p.vy = -42; p.vz = 0;
        p.life = p.maxLife = 0.9;
        p.size = 0.9;
        p.color.setHex(0x7a9adf);
        p.gravity = 0;
      } else {
        p.vx = (Math.random() - 0.5) * 2.5; p.vy = -4.5 - Math.random() * 2; p.vz = (Math.random() - 0.5) * 2.5;
        p.life = p.maxLife = 6;
        p.size = 1.1 + Math.random() * 0.7;
        p.color.setHex(0xeef4ff);
        p.gravity = 0;
      }
    });
  }

  update(dt: number) {
    const pos = this.posAttr.array as Float32Array;
    const col = this.colAttr.array as Float32Array;
    const size = this.sizeAttr.array as Float32Array;
    for (let i = 0; i < MAX; i++) {
      const p = this.parts[i];
      if (!p.active) { pos[i * 3 + 1] = -100; size[i] = 0; continue; }
      p.life -= dt;
      if (p.life <= 0 || p.y < -1) { p.active = false; pos[i * 3 + 1] = -100; size[i] = 0; continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < 0.05 && p.gravity === 0) { p.active = false; } // 雨雪落地即灭
      const fade = Math.min(1, p.life / (p.maxLife * 0.5));
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      col[i * 3] = p.color.r * fade; col[i * 3 + 1] = p.color.g * fade; col[i * 3 + 2] = p.color.b * fade;
      size[i] = p.size * (0.6 + 0.4 * fade);
    }
    this.posAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
  }

  dispose() {
    this.geo.dispose();
    (this.points.material as THREE.Material).dispose();
    this.points.removeFromParent();
  }
}
