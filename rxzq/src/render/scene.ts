import * as THREE from 'three';
import * as C from '../core/constants';
import { Match, MatchEvent } from '../game/match';
import { buildCharacter, animateRig, CharacterRig } from './characterMesh';
import { ParticleSystem } from './particles';
import { predictBallPosition } from '../game/football';

// 夜场球场 + 真实阴影 + 轻度像素化(高分辨率 RT 保持复古颗粒感但整体写实)
export class GameScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  rt: THREE.WebGLRenderTarget;
  quadScene = new THREE.Scene();
  quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  rigs: CharacterRig[] = [];
  crowdHypeT = 0;                            // 观众兴奋倒计时(进球/必杀后)
  private crowdBodies: THREE.InstancedMesh[] = [];   // 观众身体
  private crowdHeads: THREE.InstancedMesh[] = [];    // 观众头部(与身体一一对应)
  private crowdBases: { x: number; y: number; z: number; phase: number }[][] = [];
  ballMesh!: THREE.Group;
  shake = 0;
  fxGroup = new THREE.Group();
  trail: THREE.Mesh[] = [];
  trailIdx = 0;
  markerRing!: THREE.Mesh;
  auraRing!: THREE.Mesh;          // 能量满的持球者光环
  ballShadow!: THREE.Mesh;        // 球下高对比投影
  landingRing!: THREE.Mesh;       // 高空球落点环
  private ballArrow!: HTMLDivElement;
  nameTags: { team: 0 | 1; nick: string }[] = [];   // 联机双方受控球员头顶名牌
  private tagEls: HTMLDivElement[] = [];
  particles!: ParticleSystem;
  camPos = new THREE.Vector3(0, 22, 36);
  camLook = new THREE.Vector3();
  camMode: 'follow' | 'special' | 'goal' = 'follow';
  camT = 0;
  specialFocus = new THREE.Vector3();
  private reducedMotion = false;
  private followHeight = 22;
  private followDistance = 36;
  private onResize = () => this.resize();

  constructor(canvas: HTMLCanvasElement, private match: Match) {
    this.reducedMotion = typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.rt = new THREE.WebGLRenderTarget(C.RENDER_W, C.RENDER_H, {
      minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter,
      samples: this.reducedMotion || (navigator.maxTouchPoints > 0) ? 1 : 4,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: this.rt.texture }));
    this.quadScene.add(quad);

    this.camera = new THREE.PerspectiveCamera(40, C.RENDER_W / C.RENDER_H, 1, 600);

    this.buildSky(match.weather === 'snow');
    this.buildLights();
    this.buildField();
    this.buildStadium();
    this.buildBall();
    this.buildBallVisuals();
    this.buildPlayers();
    this.scene.add(this.fxGroup);
    this.buildTrailPool();
    this.buildMarker();
    this.buildBallArrow(canvas);
    this.particles = new ParticleSystem(this.scene);

    this.resize();
    window.addEventListener('resize', this.onResize);
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    // 像素预算:保持画面比例(RT 与窗口同宽高比,避免形变),移动端降采样
    const isMobile = navigator.maxTouchPoints > 0 && Math.min(w, h) < 900;
    const budget = isMobile ? (Math.min(w, h) < 500 ? 340 : 460) : C.RENDER_H;
    const scale = Math.min(1, budget / C.RENDER_H);
    let rw: number, rh: number;
    if (aspect >= C.RENDER_W / C.RENDER_H) {
      rh = Math.max(90, Math.round(C.RENDER_H * scale));
      rw = Math.max(160, Math.round(rh * aspect));
    } else {
      rw = Math.max(160, Math.round(C.RENDER_W * scale));
      rh = Math.max(90, Math.round(rw / aspect));
    }
    if (rw !== this.rt.width || rh !== this.rt.height) this.rt.setSize(rw, rh);
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 0.85 ? 48 : aspect < 1.2 ? 44 : 40;
    this.followHeight = aspect < 0.85 ? 25 : aspect < 1.2 ? 23 : 22;
    this.followDistance = aspect < 0.85 ? 43 : aspect < 1.2 ? 39 : 36;
    this.camera.updateProjectionMatrix();
  }

  // ---------- 天空:宣纸质感夜空 + 水墨远山 + 金月 ----------
  buildSky(snowy = false) {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 512;
    const g = cv.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 512);
    if (snowy) {
      grad.addColorStop(0, '#090b15');
      grad.addColorStop(0.55, '#1d2432');
      grad.addColorStop(0.82, '#49515b');
      grad.addColorStop(1, '#787b7a');
    } else {
      grad.addColorStop(0, '#04070b');
      grad.addColorStop(0.52, '#101d24');
      grad.addColorStop(0.8, '#273c40');
      grad.addColorStop(1, '#5c6a61');
    }
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 512);

    // 金月与薄云（只画景物，不把任何文字烘焙进天空，避免低清纹理乱码）。
    const moon = g.createRadialGradient(775, 118, 6, 775, 118, 57);
    moon.addColorStop(0, 'rgba(255,244,188,.98)');
    moon.addColorStop(.62, 'rgba(242,207,116,.82)');
    moon.addColorStop(1, 'rgba(221,165,70,0)');
    g.fillStyle = moon; g.beginPath(); g.arc(775, 118, 64, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,241,202,.72)'; g.beginPath(); g.arc(775, 118, 37, 0, Math.PI * 2); g.fill();
    g.lineCap = 'round';
    for (let i = 0; i < 11; i++) {
      const y = 170 + i * 17 + Math.sin(i * 1.9) * 9;
      g.strokeStyle = `rgba(210,219,205,${0.035 + (i % 3) * 0.018})`;
      g.lineWidth = 7 + (i % 4) * 3;
      g.beginPath();
      g.moveTo((i * 139) % 940 - 80, y);
      g.bezierCurveTo(210 + i * 32, y - 28, 430 + i * 17, y + 24, 710 + i * 23, y - 2);
      g.stroke();
    }

    // 三层水墨山，使用稳定的正弦组合形成可平铺轮廓。
    const mountainLayer = (base: number, amp: number, color: string, seed: number) => {
      g.beginPath(); g.moveTo(0, 512); g.lineTo(0, base);
      for (let x = 0; x <= 1024; x += 10) {
        const y = base - Math.abs(Math.sin(x * .009 + seed)) * amp
          - Math.abs(Math.sin(x * .024 + seed * 1.7)) * amp * .38;
        g.lineTo(x, y);
      }
      g.lineTo(1024, 512); g.closePath(); g.fillStyle = color; g.fill();
    };
    mountainLayer(405, 90, snowy ? 'rgba(57,65,74,.46)' : 'rgba(18,38,35,.43)', .8);
    mountainLayer(438, 68, snowy ? 'rgba(41,47,54,.64)' : 'rgba(10,29,27,.62)', 2.4);
    mountainLayer(474, 46, snowy ? 'rgba(25,29,34,.82)' : 'rgba(7,20,18,.83)', 4.2);

    // 宣纸颗粒，极低对比度以免出现色带。
    for (let i = 0; i < 7200; i++) {
      const a = Math.random() * 0.025;
      g.fillStyle = Math.random() < .5 ? `rgba(255,244,220,${a})` : `rgba(0,0,0,${a})`;
      g.fillRect(Math.random() * 1024, Math.random() * 512, 1.5, 1.5);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const skyGeo = new THREE.SphereGeometry(450, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));

    // 星星
    const starGeo = new THREE.BufferGeometry();
    const n = 210, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.42;
      const r = 430;
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) + 40;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe8d6a0, size: 1.35, sizeAttenuation: false })));

    this.scene.fog = new THREE.Fog(snowy ? 0x1e2630 : 0x091915, 175, 420);
  }

  buildLights() {
    this.scene.add(new THREE.AmbientLight(0x4a5a8a, 0.55));
    this.scene.add(new THREE.HemisphereLight(0x8ea2d8, 0x1a2a1a, 0.5));

    // 主泛光(带阴影)
    const key = new THREE.DirectionalLight(0xfff4e0, 1.6);
    key.position.set(-45, 85, 55);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const s = 80;
    key.shadow.camera.left = -s; key.shadow.camera.right = s;
    key.shadow.camera.top = s; key.shadow.camera.bottom = -s;
    key.shadow.camera.far = 250;
    key.shadow.bias = -0.0015;
    this.scene.add(key);

    // 补光
    const fill = new THREE.DirectionalLight(0xcdd8ff, 0.45);
    fill.position.set(50, 60, -40);
    this.scene.add(fill);
  }

  // ---------- 草皮:Canvas 纹理条纹 + 磨损(雪战覆雪) ----------
  private grassTexture(): THREE.CanvasTexture {
    const snowy = this.match.weather === 'snow';
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 664;
    const g = cv.getContext('2d')!;
    const stripes = 14;
    for (let i = 0; i < stripes; i++) {
      if (snowy) g.fillStyle = i % 2 === 0 ? '#c8d2e0' : '#bcc8da';
      else g.fillStyle = i % 2 === 0 ? '#2c7a34' : '#256b2d';
      g.fillRect((1024 / stripes) * i, 0, 1024 / stripes + 1, 664);
    }
    if (snowy) {
      // 雪地颗粒
      for (let i = 0; i < 5000; i++) {
        g.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`;
        g.fillRect(Math.random() * 1024, Math.random() * 664, 2, 2);
      }
      const tex0 = new THREE.CanvasTexture(cv);
      tex0.anisotropy = 4;
      return tex0;
    }
    // 草皮噪点
    for (let i = 0; i < 9000; i++) {
      const a = Math.random() * 0.06;
      g.fillStyle = Math.random() < 0.5 ? `rgba(255,255,220,${a})` : `rgba(0,40,0,${a + 0.02})`;
      g.fillRect(Math.random() * 1024, Math.random() * 664, 2, 2);
    }
    // 中路磨损
    const wear = g.createRadialGradient(512, 332, 30, 512, 332, 330);
    wear.addColorStop(0, 'rgba(120,110,60,0.10)');
    wear.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = wear;
    g.fillRect(0, 0, 1024, 664);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    return tex;
  }

  buildField() {
    const hx = C.FIELD_LENGTH / 2, hz = C.FIELD_WIDTH / 2;

    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(C.FIELD_LENGTH + 8, C.FIELD_WIDTH + 8),
      new THREE.MeshStandardMaterial({ map: this.grassTexture(), roughness: 0.95 })
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = true;
    this.scene.add(pitch);

    // 场外跑道区
    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(C.FIELD_LENGTH + 46, C.FIELD_WIDTH + 42),
      new THREE.MeshStandardMaterial({ color: 0x2a4630, roughness: 1 })
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = -0.03;
    apron.receiveShadow = true;
    this.scene.add(apron);

    // 白线
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });
    const mkLine = (w: number, d: number, x: number, z: number) => {
      const l = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat);
      l.rotation.x = -Math.PI / 2;
      l.position.set(x, 0.02, z);
      this.scene.add(l);
    };
    const LW = 0.28;
    mkLine(C.FIELD_LENGTH, LW, 0, -hz);
    mkLine(C.FIELD_LENGTH, LW, 0, hz);
    mkLine(LW, C.FIELD_WIDTH, -hx, 0);
    mkLine(LW, C.FIELD_WIDTH, hx, 0);
    mkLine(LW, C.FIELD_WIDTH, 0, 0);
    const circle = new THREE.Mesh(new THREE.RingGeometry(9.15, 9.15 + LW, 48), lineMat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.02;
    this.scene.add(circle);
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.25, 12), lineMat);
    spot.rotation.x = -Math.PI / 2; spot.position.y = 0.02;
    this.scene.add(spot);
    // 禁区 + 小禁区 + 点球点
    for (const s of [-1, 1]) {
      mkLine(LW, C.BOX_WIDTH, s * (hx - C.BOX_DEPTH), 0);
      mkLine(C.BOX_DEPTH, LW, s * (hx - C.BOX_DEPTH / 2), -C.BOX_WIDTH / 2);
      mkLine(C.BOX_DEPTH, LW, s * (hx - C.BOX_DEPTH / 2), C.BOX_WIDTH / 2);
      const smallD = 5.5, smallW = 18.3;
      mkLine(LW, smallW, s * (hx - smallD), 0);
      mkLine(smallD, LW, s * (hx - smallD / 2), -smallW / 2);
      mkLine(smallD, LW, s * (hx - smallD / 2), smallW / 2);
      const pen = new THREE.Mesh(new THREE.CircleGeometry(0.22, 10), lineMat);
      pen.rotation.x = -Math.PI / 2;
      pen.position.set(s * (hx - 11), 0.02, 0);
      this.scene.add(pen);
    }

    this.buildGoals(hx);
    this.buildCornerFlags(hx, hz);
  }

  buildGoals(hx: number) {
    const postMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.35, metalness: 0.3 });
    // 网格纹理球网
    const netCv = document.createElement('canvas');
    netCv.width = netCv.height = 64;
    const ng = netCv.getContext('2d')!;
    ng.clearRect(0, 0, 64, 64);
    ng.strokeStyle = 'rgba(230,235,255,0.75)';
    ng.lineWidth = 1.5;
    for (let i = 0; i <= 64; i += 8) {
      ng.beginPath(); ng.moveTo(i, 0); ng.lineTo(i, 64); ng.stroke();
      ng.beginPath(); ng.moveTo(0, i); ng.lineTo(64, i); ng.stroke();
    }
    const netTex = new THREE.CanvasTexture(netCv);
    netTex.wrapS = netTex.wrapT = THREE.RepeatWrapping;
    const netMat = new THREE.MeshBasicMaterial({ map: netTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });

    for (const s of [-1, 1]) {
      const gx = s * hx;
      const r = 0.09;
      const postGeo = new THREE.CylinderGeometry(r, r, C.GOAL_HEIGHT, 10);
      for (const gz of [-C.GOAL_WIDTH / 2, C.GOAL_WIDTH / 2]) {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(gx, C.GOAL_HEIGHT / 2, gz);
        post.castShadow = true;
        this.scene.add(post);
      }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, C.GOAL_WIDTH, 10), postMat);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(gx, C.GOAL_HEIGHT, 0);
      bar.castShadow = true;
      this.scene.add(bar);

      const mkNet = (w: number, h: number, px: number, py: number, pz: number, rx: number, ry: number, ru: number, rv: number) => {
        const net = new THREE.Mesh(new THREE.PlaneGeometry(w, h), netMat.clone());
        (net.material as THREE.MeshBasicMaterial).map = netTex.clone();
        const mm = (net.material as THREE.MeshBasicMaterial).map!;
        mm.wrapS = mm.wrapT = THREE.RepeatWrapping;
        mm.repeat.set(ru, rv);
        net.position.set(px, py, pz);
        net.rotation.x = rx; net.rotation.y = ry;
        this.scene.add(net);
      };
      // 后网/顶网/侧网
      mkNet(C.GOAL_WIDTH, C.GOAL_HEIGHT, gx + s * C.GOAL_DEPTH, C.GOAL_HEIGHT / 2, 0, 0, Math.PI / 2, 10, 4);
      mkNet(C.GOAL_DEPTH, C.GOAL_WIDTH, gx + s * C.GOAL_DEPTH / 2, C.GOAL_HEIGHT - 0.02, 0, -Math.PI / 2, Math.PI / 2, 3, 10);
      for (const gz of [-C.GOAL_WIDTH / 2, C.GOAL_WIDTH / 2]) {
        mkNet(C.GOAL_DEPTH, C.GOAL_HEIGHT, gx + s * C.GOAL_DEPTH / 2, C.GOAL_HEIGHT / 2, gz, 0, 0, 3, 4);
      }
    }
  }

  buildCornerFlags(hx: number, hz: number) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.5 });
    const flagMat = new THREE.MeshBasicMaterial({ color: 0xf5c53d, side: THREE.DoubleSide });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), poleMat);
      pole.position.set(sx * hx, 0.8, sz * hz);
      this.scene.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), flagMat);
      flag.position.set(sx * hx + 0.28, 1.4, sz * hz);
      this.scene.add(flag);
    }
  }

  // ---------- 看台/灯塔/广告牌 ----------
  buildStadium() {
    const hx = C.FIELD_LENGTH / 2, hz = C.FIELD_WIDTH / 2;
    const teamA = this.match.teams[0], teamB = this.match.teams[1];

    // 广告牌(围场一圈,程序纹理)
    const boardCv = document.createElement('canvas');
    boardCv.width = 1024; boardCv.height = 64;
    const bg = boardCv.getContext('2d')!;
    const brands = ['NEKKETSU STORM', 'PIXEL SPORTS', 'THUNDER COLA', 'DRAGON GEAR', 'STAR FM 88.8'];
    const cols = ['#d83a2a', '#2a5ad8', '#1a8a4a', '#8a2ad8', '#d8882a'];
    for (let i = 0; i < 8; i++) {
      bg.fillStyle = cols[i % cols.length];
      bg.fillRect(i * 128, 0, 128, 64);
      bg.fillStyle = '#fff';
      bg.font = 'bold 17px monospace';
      bg.textAlign = 'center';
      bg.fillText(brands[i % brands.length], i * 128 + 64, 38, 120);
    }
    const boardTex = new THREE.CanvasTexture(boardCv);
    boardTex.wrapS = THREE.RepeatWrapping;
    const mkBoards = (len: number, x: number, z: number, ry: number, repeat: number) => {
      const m = new THREE.MeshStandardMaterial({ map: boardTex.clone(), roughness: 0.6, emissive: 0x222222 });
      (m.map as THREE.Texture).wrapS = THREE.RepeatWrapping;
      (m.map as THREE.Texture).repeat.set(repeat, 1);
      const b = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.1), m);
      b.position.set(x, 0.55, z);
      b.rotation.y = ry;
      b.castShadow = true;
      this.scene.add(b);
    };
    mkBoards(C.FIELD_LENGTH + 10, 0, hz + 5, Math.PI, 6);
    mkBoards(C.FIELD_LENGTH + 10, 0, -hz - 5, 0, 6);
    mkBoards(C.FIELD_WIDTH + 6, -hx - 6, 0, Math.PI / 2, 4);
    mkBoards(C.FIELD_WIDTH + 6, hx + 6, 0, -Math.PI / 2, 4);

    // 看台:四面双层斜坡 + 头身两段式观众小人
    const standMat = new THREE.MeshStandardMaterial({ color: 0x27314f, roughness: 0.9 });
    const mkStand = (len: number, cx: number, cz: number, ry: number, tiers = 3, roof = true) => {
      const g = new THREE.Group();
      for (let t = 0; t < tiers; t++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(len, 2.6, 5), standMat);
        step.position.set(0, 1.3 + t * 2.4, 8 + t * 4.4);
        step.castShadow = true;
        g.add(step);
        // 观众:身体胶囊 + 头球(InstancedMesh 成对),颜色混入两队应援色
        const rows = 2, cols = Math.floor(len / 1.1);
        const total = rows * cols;
        const bodyMesh = new THREE.InstancedMesh(
          new THREE.CapsuleGeometry(0.24, 0.34, 3, 6),
          new THREE.MeshLambertMaterial(),
          total
        );
        const headMesh = new THREE.InstancedMesh(
          new THREE.SphereGeometry(0.21, 6, 5),
          new THREE.MeshLambertMaterial(),
          total
        );
        const dummy = new THREE.Object3D();
        const skinCols = [0xe8b48a, 0xc98d5f, 0x8a5a38, 0xf0c8a0];
        const kitPool = [teamA.color, teamA.color2, teamB.color, teamB.color2,
          0xd8564a, 0x4a6ad8, 0xe8e8e8, 0x333a55];
        const bases: { x: number; y: number; z: number; phase: number }[] = [];
        let idx = 0;
        for (let r = 0; r < rows; r++) {
          for (let c2 = 0; c2 < cols; c2++) {
            const wx = -len / 2 + c2 * 1.1 + Math.random() * 0.5;
            const wy = 2.75 + t * 2.4 + r * 0.5 + Math.random() * 0.2;
            const wz = 7 + t * 4.4 + r * 2 + Math.random() * 0.6;
            dummy.position.set(wx, wy, wz);
            dummy.updateMatrix();
            bodyMesh.setMatrixAt(idx, dummy.matrix);
            bodyMesh.setColorAt(idx, new THREE.Color(kitPool[(Math.random() * kitPool.length) | 0]));
            dummy.position.set(wx, wy + 0.52, wz);
            dummy.updateMatrix();
            headMesh.setMatrixAt(idx, dummy.matrix);
            headMesh.setColorAt(idx, new THREE.Color(skinCols[(Math.random() * skinCols.length) | 0]));
            bases.push({ x: wx, y: wy, z: wz, phase: Math.random() * Math.PI * 2 });
            idx++;
          }
        }
        g.add(bodyMesh);
        g.add(headMesh);
        this.crowdBodies.push(bodyMesh);
        this.crowdHeads.push(headMesh);
        this.crowdBases.push(bases);
      }
      if (roof) {
        const roofMesh = new THREE.Mesh(
          new THREE.BoxGeometry(len + 4, 0.5, 16),
          new THREE.MeshStandardMaterial({ color: 0x1a2238, roughness: 0.7 })
        );
        roofMesh.position.set(0, 10.5, 13);
        roofMesh.rotation.x = 0.12;
        g.add(roofMesh);
      }
      g.position.set(cx, 0, cz);
      g.rotation.y = ry;
      this.scene.add(g);
    };
    // 关键:台阶沿各自 local +z 延伸,旋转须让 local +z 指向场外,否则看台压进球场遮挡视野
    // 近侧(镜头侧)只留 1 层矮看台且无顶棚,避免挡住球场
    mkStand(C.FIELD_LENGTH + 20, 0, hz + 8, 0, 1, false);
    mkStand(C.FIELD_LENGTH + 20, 0, -hz - 8, Math.PI);   // 远侧:朝 -z 场外
    mkStand(C.FIELD_WIDTH + 14, hx + 9, 0, Math.PI / 2); // 右侧:朝 +x 场外
    mkStand(C.FIELD_WIDTH + 14, -hx - 9, 0, -Math.PI / 2); // 左侧:朝 -x 场外

    // 泛光灯塔(四角)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.7, 34, 8),
        new THREE.MeshStandardMaterial({ color: 0x39415f, roughness: 0.6 })
      );
      pole.position.y = 17;
      g.add(pole);
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(7, 4.5, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x222a3f, emissive: 0xf5f0d0, emissiveIntensity: 1.4 })
      );
      panel.position.y = 35;
      panel.lookAt(new THREE.Vector3(0, 2, 0).sub(new THREE.Vector3(sx * (hx + 18), 0, sz * (hz + 18))));
      g.add(panel);
      // 光晕面片
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(13, 9),
        new THREE.MeshBasicMaterial({ color: 0xfff8dd, transparent: true, opacity: 0.16, depthWrite: false })
      );
      glow.position.copy(panel.position);
      glow.quaternion.copy(panel.quaternion);
      glow.translateZ(0.8);
      g.add(glow);
      g.position.set(sx * (hx + 18), 0, sz * (hz + 18));
      this.scene.add(g);
    }
  }

  buildBall() {
    this.ballMesh = new THREE.Group();
    // 经典黑白拼块球 + 缝线 + 草渍
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 128;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#f4f4f2';
    g.fillRect(0, 0, 256, 128);
    g.strokeStyle = 'rgba(40,40,48,0.55)';
    g.lineWidth = 1.5;
    // 五边形拼块(更接近真实交错排列)
    const pent = (cx: number, cy: number, r: number) => {
      g.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
        k === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
      }
      g.closePath();
      g.fillStyle = '#191919';
      g.fill();
      g.stroke();
    };
    const cols = 5, rows = 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = 26 + c * 51 + (r % 2 === 0 ? 0 : 25);
        const cy = 26 + r * 76;
        pent(cx, cy, 15);
      }
    }
    // 中部黑块
    pent(128, 22, 15); pent(128, 106, 15);
    // 草渍
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(70,110,60,${Math.random() * 0.16})`;
      g.fillRect(Math.random() * 256, Math.random() * 128, 3, 2);
    }
    const tex = new THREE.CanvasTexture(cv);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(C.BALL_RADIUS, 20, 14),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42, metalness: 0.03 })
    );
    core.castShadow = true;
    this.ballMesh.add(core);
    this.scene.add(this.ballMesh);
  }

  buildPlayers() {
    for (let i = 0; i < this.match.players.length; i++) {
      const p = this.match.players[i];
      const team = this.match.teams[p.team];
      const rig = buildCharacter(p.def, team.color, team.color2, p.isKeeper, p.index);
      this.rigs.push(rig);
      this.scene.add(rig.root);
    }
  }

  buildTrailPool() {
    const geo = new THREE.SphereGeometry(0.42, 8, 6);
    for (let i = 0; i < 28; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
      m.visible = false;
      this.fxGroup.add(m);
      this.trail.push(m);
    }
  }

  buildMarker() {
    this.markerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.1, 24),
      new THREE.MeshBasicMaterial({ color: 0xffe23d, transparent: true, opacity: 0.9, depthWrite: false, depthTest: false })
    );
    this.markerRing.renderOrder = 999;
    this.markerRing.rotation.x = -Math.PI / 2;
    this.scene.add(this.markerRing);

    // 能量满光环:附着于持球者脚下,脉动
    this.auraRing = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.55, 28),
      new THREE.MeshBasicMaterial({ color: 0x3df5e1, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide })
    );
    this.auraRing.rotation.x = -Math.PI / 2;
    this.auraRing.visible = false;
    this.scene.add(this.auraRing);
  }

  // 球下投影 + 高空落点环(渲染态,不改比赛逻辑)
  buildBallVisuals() {
    this.ballShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
    );
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.ballShadow.position.y = 0.03;
    this.scene.add(this.ballShadow);

    this.landingRing = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.72, 20),
      new THREE.MeshBasicMaterial({ color: 0xffe23d, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide })
    );
    this.landingRing.rotation.x = -Math.PI / 2;
    this.landingRing.visible = false;
    this.scene.add(this.landingRing);
  }

  // 屏幕边缘球方向箭头(DOM,随场景销毁)
  buildBallArrow(canvas: HTMLCanvasElement) {
    this.ballArrow = document.createElement('div');
    this.ballArrow.dataset.testid = 'ball-arrow';
    this.ballArrow.style.cssText = 'position:absolute;display:none;font-size:14px;font-weight:bold;color:#ffe23d;'
      + 'text-shadow:0 2px 3px #000;pointer-events:none;z-index:5;white-space:nowrap;font-family:"Courier New",monospace;';
    (canvas.parentElement ?? document.body).appendChild(this.ballArrow);
  }

  // 联机名牌:按需创建/复用 DOM,显示在双方受控球员头顶
  private updateNameTags() {
    const parent = this.ballArrow.parentElement;
    if (!parent) return;
    // 同步 DOM 数量与名牌数
    while (this.tagEls.length < this.nameTags.length) {
      const el = document.createElement('div');
      el.style.cssText = 'position:absolute;display:none;font-size:12px;font-weight:bold;'
        + 'padding:1px 8px;border-radius:2px;pointer-events:none;z-index:4;white-space:nowrap;'
        + 'font-family:"Courier New","SimHei",monospace;text-shadow:0 1px 0 #000;';
      el.dataset.testid = 'player-nametag';
      parent.appendChild(el);
      this.tagEls.push(el);
    }
    for (let i = 0; i < this.tagEls.length; i++) {
      const el = this.tagEls[i];
      const tag = this.nameTags[i];
      if (!tag) { el.style.display = 'none'; continue; }
      const p = this.match.getControlled(tag.team);
      if (!p) { el.style.display = 'none'; continue; }
      const v = new THREE.Vector3(p.x, p.y + 2.6, p.z).project(this.camera);
      // 出屏(含上方越界)隐藏
      if (v.z >= 1 || Math.abs(v.x) > 1 || v.y > 1 || v.y < -1) {
        el.style.display = 'none';
        continue;
      }
      const teamColor = '#' + this.match.teams[tag.team].color.toString(16).padStart(6, '0');
      el.textContent = tag.nick;
      el.style.color = tag.team === this.match.humanTeam ? '#ffe23d' : '#ffffff';
      el.style.background = teamColor + 'aa';
      el.style.border = `1px solid ${teamColor}`;
      el.style.display = 'block';
      el.style.left = `${(v.x + 1) / 2 * 100}%`;
      el.style.top = `${(1 - v.y) / 2 * 100}%`;
      el.style.transform = 'translate(-50%,-100%)';
    }
  }

  handleEvents(events: MatchEvent[]) {
    const b = this.match.ball;
    for (const e of events) {
      switch (e.type) {
        case 'special':
          this.shake = this.reducedMotion ? 0 : Math.max(this.shake, 0.7);
          this.crowdHypeT = Math.max(this.crowdHypeT, 2);
          if (e.special) {
            this.particles.burst(e.x ?? b.x, 1, e.z ?? b.z, e.special.color);
            if (!this.reducedMotion) {
              this.camMode = 'special';
              this.camT = 0.45;
            }
          }
          break;
        case 'goal': {
          this.shake = this.reducedMotion ? 0 : Math.max(this.shake, 1.0);
          this.crowdHypeT = Math.max(this.crowdHypeT, 3.5);
          // 在进球一侧球门上空放烟花
          const gx = b.x > 0 ? C.FIELD_LENGTH / 2 : -C.FIELD_LENGTH / 2;
          this.particles.fireworks(gx * 0.85, 0);
          if (!this.reducedMotion) {
            this.camMode = 'goal';
            this.camT = 2.2;
            this.specialFocus.set(gx * 0.9, 1, 0);
          }
          break;
        }
        case 'knockdown':
        case 'collide':
          this.shake = this.reducedMotion ? 0 : Math.max(this.shake, 0.3);
          if (e.player) this.particles.dust(e.player.x, e.player.z, 12, 4);
          break;
        case 'tackle':
          if (e.player) this.particles.dust(e.player.x, e.player.z, 8, 3);
          break;
        case 'dribble':
          if (e.player) {
            // 花式招式专属粒子颜色:彩虹金/牛尾巴青/丸子白
            const trickCol = e.trick === 'rainbow' ? 0xf5d33d
              : e.trick === 'elastico' ? 0x3dd5f5
              : e.trick === 'croqueta' ? 0xffffff : 0x9a8a68;
            if (e.trick) this.particles.burst(e.player.x, 1, e.player.z, trickCol);
            else this.particles.dust(e.player.x, e.player.z, 10, 2.5);
          }
          break;
        case 'dribbleWin':
          if (e.player) this.particles.burst(e.player.x, 1, e.player.z, 0x3df58a);
          this.shake = this.reducedMotion ? 0 : Math.max(this.shake, 0.2);
          break;
        case 'dribbleFail':
          if (e.player) this.particles.dust(e.player.x, e.player.z, 14, 3.5, 0xf53d3d);
          break;
        case 'fakeShot':
          if (e.player) this.particles.dust(e.player.x, e.player.z, 8, 2, 0xf5d33d);
          break;
        case 'shoot':
        case 'kick':
          if (e.player) this.particles.dust(e.player.x, e.player.z, 5, 2);
          break;
        case 'save':
          if (e.player) this.particles.dust(e.player.x, e.player.z, 10, 3);
          this.crowdHypeT = Math.max(this.crowdHypeT, 1.2);
          break;
      }
    }
  }

  // 球离屏时的屏幕边缘方向箭头(含距离)
  private updateBallArrow() {
    const b = this.match.ball;
    const ctrl = this.match.humanTeam >= 0 ? this.match.getControlled(this.match.humanTeam) : null;
    if (!ctrl) { this.ballArrow.style.display = 'none'; return; }
    const v = new THREE.Vector3(b.x, b.y, b.z).project(this.camera);
    const mSide = 0.1, mTop = 0.18, mBottom = 0.14;
    if (v.z < 1 && Math.abs(v.x) < 1 - mSide && v.y < 1 - mTop && v.y > -1 + mBottom) {
      this.ballArrow.style.display = 'none';
      return;
    }
    // 钳制到安全区边缘
    const tx = v.x === 0 ? Infinity : (v.x > 0 ? (1 - mSide) : -(1 - mSide)) / v.x;
    const ty = v.y === 0 ? Infinity : (v.y > 0 ? (1 - mTop) : -(1 - mBottom)) / v.y;
    const t = Math.min(tx, ty);
    const cx = v.x * t, cy = v.y * t;
    const dist = Math.round(Math.hypot(b.x - ctrl.x, b.z - ctrl.z));
    this.ballArrow.textContent = `▶ ${dist}m`;
    this.ballArrow.style.display = 'block';
    this.ballArrow.style.left = `${(cx + 1) / 2 * 100}%`;
    this.ballArrow.style.top = `${(1 - cy) / 2 * 100}%`;
    this.ballArrow.style.transform = `translate(-50%,-50%) rotate(${Math.atan2(-v.y, v.x)}rad)`;
  }

  private disposed = false;

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    this.ballArrow.remove();
    for (const el of this.tagEls) el.remove();
    this.tagEls.length = 0;
    this.particles.dispose();
    this.rt.dispose();
    const disposeObj = (o: THREE.Object3D) => {
      const anyO = o as any;
      const mats = anyO.material ? (Array.isArray(anyO.material) ? anyO.material : [anyO.material]) : [];
      for (const m of mats) {
        if (m.map) m.map.dispose();
        if (m.dispose) m.dispose();
      }
      if (anyO.geometry?.dispose) anyO.geometry.dispose();
    };
    this.scene.traverse(disposeObj);
    this.quadScene.traverse(disposeObj);
    this.renderer.dispose();
  }

  update(dt: number) {
    const m = this.match;
    const b = m.ball;

    this.ballMesh.position.set(b.x, b.y, b.z);
    this.ballMesh.rotation.x += b.spin * dt * 0.6;
    this.ballMesh.rotation.z += b.spin * dt * 0.35;

    // 球下投影:高度越高越淡越小
    this.ballShadow.position.set(b.x, 0.03, b.z);
    const bh = Math.max(0, b.y);
    this.ballShadow.scale.setScalar(Math.max(0.35, 1 - bh / 14));
    (this.ballShadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.12, 0.4 - bh * 0.02);
    // 高空下落球的落点环(普通球可预测;特殊曲线不显示)
    if (!b.special && !b.owner && b.y > 2 && b.vy < 0) {
      const g = Math.abs(C.GRAVITY);
      const t = (b.vy + Math.sqrt(b.vy * b.vy + 2 * g * b.y)) / g;
      const land = predictBallPosition(b, Math.min(t, 2));
      this.landingRing.visible = true;
      this.landingRing.position.set(land.x, 0.05, land.z);
    } else {
      this.landingRing.visible = false;
    }

    // 必杀拖尾(按视觉风格差异化)
    if (b.special) {
      const sp = b.special;
      const t = this.trail[this.trailIdx++ % this.trail.length];
      const mat = t.material as THREE.MeshBasicMaterial;
      t.visible = true;
      const base = 1.0 * sp.trailScale;
      let ox = 0, oy = 0, oz = 0, col = sp.color, op = 0.8, sc = base;
      switch (sp.fxStyle) {
        case 'serpent': {
          // 沿垂直方向左右游走残影
          const wx = -b.specialDirZ, wz = b.specialDirX;
          const wob = Math.sin(b.specialT * 24) * 1.1;
          ox = wx * wob; oz = wz * wob;
          col = sp.color; sc = base * 0.9;
          break;
        }
        case 'meteor':
          col = Math.random() < 0.4 ? sp.color2 : sp.color;
          sc = base * (1.4 + Math.random() * 1.1);
          break;
        case 'arc':
          col = Math.random() < 0.5 ? sp.color2 : sp.color;
          sc = base * 0.9;
          break;
        case 'groundspark':
          oy = -b.y + 0.1; // 贴地火花
          col = Math.random() < 0.4 ? sp.color2 : sp.color;
          sc = base * (0.7 + Math.random() * 0.6);
          break;
        case 'ice':
          col = Math.random() < 0.5 ? 0xdff2ff : sp.color;
          sc = base * 0.85;
          op = 0.9;
          break;
        case 'clone':
          // 幻影残影:留上一帧位置的虚影
          t.position.set(b.prevX, b.prevY, b.prevZ);
          col = sp.color; sc = base * 0.9; op = 0.45;
          break;
        case 'spiral':
          col = Math.random() < 0.5 ? sp.color2 : sp.color;
          sc = base * 1.1;
          break;
        case 'fist':
          // 罗汉伏虎:金红交替爆冲,粗尾脉冲
          col = Math.random() < 0.5 ? sp.color2 : sp.color;
          sc = base * (1.1 + Math.abs(Math.sin(b.specialT * 30)) * 0.8);
          break;
        default: // blast:爆燃粗尾
          col = Math.random() < 0.35 ? sp.color2 : sp.color;
          sc = base * (1.2 + Math.random() * 0.7);
          break;
      }
      t.position.set(b.x + ox, b.y + oy, b.z + oz);
      mat.color.setHex(col);
      mat.opacity = op;
      t.scale.setScalar(sc);
    }
    for (const t of this.trail) {
      if (!t.visible) continue;
      const mm = t.material as THREE.MeshBasicMaterial;
      mm.opacity -= dt * 2.2;
      t.scale.multiplyScalar(1 - dt * 1.5);
      if (mm.opacity <= 0) t.visible = false;
    }

    // 球员
    for (let i = 0; i < m.players.length; i++) {
      const p = m.players[i];
      const rig = this.rigs[i];
      rig.root.position.set(p.x, 0, p.z);
      rig.body.rotation.y = Math.atan2(p.faceX, p.faceZ);
      // 飞翔庆祝:原地旋转(用 animT 累积,避免暂停跳变)
      if (p.state === 'celebrateFly') {
        rig.body.rotation.y = Math.atan2(p.faceX, p.faceZ) + p.animT * 6;
      }
      // 滑跪庆祝:拖出尘土(节流)
      if (p.state === 'celebrateSlide' && Math.hypot(p.vx, p.vz) > 2
          && (performance.now() | 0) % 3 === 0) {
        this.particles.dust(p.x, p.z, 4, 1.5, 0xcfc4a8);
      }
      const moving = Math.hypot(p.vx, p.vz) > 1;
      const speedNorm = Math.min(1, Math.hypot(p.vx, p.vz) / (C.DASH_SPEED * p.def.speed));
      animateRig(rig, p.stunned > 0 ? 'fallen' : p.state, p.animT, moving, p.y,
        p.state === 'dribble' && p.trickType !== 'none' ? p.trickType : undefined,
        speedNorm, p.stateT);
    }

    // 固定操控指示环(始终标记玩家自己的角色)
    const ctrl = m.humanTeam >= 0 ? m.getControlled(m.humanTeam) : null;
    if (ctrl) {
      this.markerRing.visible = true;
      this.markerRing.position.set(ctrl.x, 0.04, ctrl.z);
      const calling = ctrl.passCallT > 0;
      const pulse = calling
        ? 1 + Math.sin(performance.now() / 70) * 0.3
        : 1 + Math.sin(performance.now() / 150) * 0.1;
      this.markerRing.scale.setScalar(pulse);
    } else this.markerRing.visible = false;

    // 能量满:持球者脚下彩色光环脉动
    const holder = b.owner;
    if (holder && m.energyFull(holder.team)) {
      this.auraRing.visible = true;
      this.auraRing.position.set(holder.x, 0.06, holder.z);
      const t = performance.now() / 90;
      this.auraRing.scale.setScalar(1 + Math.sin(t) * 0.22);
      const mat = this.auraRing.material as THREE.MeshBasicMaterial;
      mat.color.setHSL((t * 0.02) % 1, 0.9, 0.6);
    } else this.auraRing.visible = false;

    // 观众欢呼跳动:平时轻微摇摆,进球/必杀后幅度与频率增大
    if (this.crowdHypeT > 0) this.crowdHypeT = Math.max(0, this.crowdHypeT - dt);
    if (this.crowdBodies.length) {
      const hype = this.crowdHypeT > 0;
      const now = performance.now() / 1000;
      const amp = (hype ? 0.42 : 0.09) * (this.reducedMotion ? 0 : 1);
      const freq = hype ? 9 : 2.2;
      const dummy = new THREE.Object3D();
      for (let ci = 0; ci < this.crowdBodies.length; ci++) {
        const bodyMesh = this.crowdBodies[ci];
        const headMesh = this.crowdHeads![ci];
        const bases = this.crowdBases[ci];
        let changed = false;
        for (let i = 0; i < bases.length; i++) {
          const base = bases[i];
          // 每个观众按相位错开起跳,兴奋时部分人持续跳跃
          const wave = Math.sin(now * freq + base.phase);
          const jump = hype && Math.sin(now * freq + base.phase * 3) > 0.2
            ? amp * Math.abs(Math.sin(now * freq * 2 + base.phase))
            : amp * (wave * 0.5 + 0.5) * 0.5;
          if (Math.abs(jump - ((base as any).lastJump ?? -99)) < 0.004) continue;
          (base as any).lastJump = jump;
          changed = true;
          dummy.position.set(base.x, base.y + jump, base.z);
          dummy.updateMatrix();
          bodyMesh.setMatrixAt(i, dummy.matrix);
          dummy.position.set(base.x, base.y + 0.52 + jump, base.z);
          dummy.updateMatrix();
          headMesh.setMatrixAt(i, dummy.matrix);
        }
        if (changed) {
          bodyMesh.instanceMatrix.needsUpdate = true;
          headMesh.instanceMatrix.needsUpdate = true;
        }
      }
    }

    // 天气粒子 + 尘土落点
    this.particles.weatherTick(m.weather, this.camPos.x, 0, dt);
    this.particles.update(dt);

    if (this.camT > 0) this.camT -= dt;
    else this.camMode = 'follow';
    const focused = this.camT > 0 && !this.reducedMotion;
    const shakeAmount = this.shake;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.2);

    let targetX: number, targetZ: number, targetY: number, targetDistance: number;
    if (focused) {
      if (this.camMode === 'special') {
        // 必杀短促构图:仍以固定角色为主体,只向球做有限偏移,不脱离操控视野
        const player = ctrl;
        if (player) {
          const ballOffsetX = Math.max(-10, Math.min(10, (b.x - player.x) * 0.22));
          const ballOffsetZ = Math.max(-5, Math.min(5, (b.z - player.z) * 0.22));
          targetX = player.x + ballOffsetX;
          targetZ = player.z + ballOffsetZ;
        } else {
          targetX = b.x; targetZ = b.z;
        }
        targetY = this.followHeight;
        targetDistance = this.followDistance * 0.85;
      } else {
        targetX = this.specialFocus.x;
        targetZ = this.specialFocus.z;
        targetY = 11;
        targetDistance = 24;
      }
    } else {
      const player = ctrl ?? m.getControlled(m.humanTeam >= 0 ? m.humanTeam : 0);
      const ballOffsetX = Math.max(-8, Math.min(8, (b.x - player.x) * 0.2));
      const ballOffsetZ = Math.max(-4, Math.min(4, (b.z - player.z) * 0.2));
      targetX = player.x + player.vx * 0.35 + ballOffsetX;
      targetZ = player.z + player.vz * 0.35 + ballOffsetZ;
      targetY = this.followHeight;
      targetDistance = this.followDistance;
    }
    targetX = Math.max(-C.FIELD_LENGTH / 2 + 6, Math.min(C.FIELD_LENGTH / 2 - 6, targetX));
    targetZ = Math.max(-C.FIELD_WIDTH / 2 + 8, Math.min(C.FIELD_WIDTH / 2 - 8, targetZ));

    const lookBlend = 1 - Math.exp(-5 * dt);
    const posBlend = 1 - Math.exp(-4 * dt);
    this.camLook.x += (targetX - this.camLook.x) * lookBlend;
    this.camLook.z += (targetZ - this.camLook.z) * lookBlend;
    this.camPos.x += (targetX - this.camPos.x) * posBlend;
    this.camPos.y += (targetY - this.camPos.y) * posBlend;
    this.camPos.z += (targetZ + targetDistance - this.camPos.z) * posBlend;

    let sx = 0, sy = 0;
    if (focused && shakeAmount > 0) {
      sx = (Math.random() - 0.5) * shakeAmount * 1.6;
      sy = (Math.random() - 0.5) * shakeAmount * 1.6;
    }
    this.camera.position.set(this.camPos.x + sx, this.camPos.y + sy, this.camPos.z);
    this.camera.lookAt(this.camLook.x, 1.6, this.camLook.z);

    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.quadScene, this.quadCam);
    this.updateBallArrow();
    if (this.nameTags.length) this.updateNameTags();
  }
}
