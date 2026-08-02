import * as THREE from 'three';

const _textureCache = new Map();
const _materialCache = new Map();

function _hexToRgb(hex) {
    const n = Number(hex) >>> 0;
    return {
        r: (n >> 16) & 255,
        g: (n >> 8) & 255,
        b: n & 255,
    };
}

function _rgbToCss(rgb) {
    return `rgb(${rgb.r | 0},${rgb.g | 0},${rgb.b | 0})`;
}

function _mixColor(a, b, t) {
    return {
        r: a.r + (b.r - a.r) * t,
        g: a.g + (b.g - a.g) * t,
        b: a.b + (b.b - a.b) * t,
    };
}

function _makeCanvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
}

function _paintNoise(ctx, size, baseColor, accentColor, detailColor, options = {}) {
    const density = options.density ?? 1800;
    const streaks = options.streaks ?? 40;
    const base = _hexToRgb(baseColor);
    const accent = _hexToRgb(accentColor ?? baseColor);
    const detail = _hexToRgb(detailColor ?? 0xffffff);

    ctx.fillStyle = _rgbToCss(base);
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < density; i++) {
        const t = Math.random();
        const c = _mixColor(base, accent, t * 0.75);
        const x = Math.random() * size;
        const y = Math.random() * size;
        const s = 1 + Math.random() * (options.maxDot ?? 2.5);
        ctx.fillStyle = _rgbToCss(c);
        ctx.globalAlpha = 0.08 + Math.random() * 0.18;
        ctx.fillRect(x, y, s, s);
    }

    ctx.globalAlpha = 1;
    ctx.strokeStyle = _rgbToCss(detail);
    ctx.lineWidth = 1;
    for (let i = 0; i < streaks; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const len = 8 + Math.random() * size * 0.18;
        const angle = Math.random() * Math.PI * 2;
        ctx.globalAlpha = 0.04 + Math.random() * 0.08;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

function _terrainPattern(ctx, size, baseColor, accentColor) {
    _paintNoise(ctx, size, baseColor, accentColor, 0xf4f0d0, { density: 2600, streaks: 55, maxDot: 3.5 });
    const dark = _hexToRgb(0x3c2d20);
    ctx.strokeStyle = _rgbToCss(dark);
    for (let i = 0; i < 30; i++) {
        const y = Math.random() * size;
        ctx.globalAlpha = 0.035 + Math.random() * 0.05;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y + (Math.random() - 0.5) * 10);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

function _roadPattern(ctx, size, baseColor, accentColor) {
    _paintNoise(ctx, size, baseColor, accentColor, 0x000000, { density: 1800, streaks: 28, maxDot: 2.2 });
    ctx.fillStyle = 'rgba(230, 230, 220, 0.12)';
    for (let i = 0; i < 10; i++) {
        const x = (i / 10) * size;
        ctx.fillRect(x, size * 0.47 + (Math.random() - 0.5) * 2, size * 0.03, 2);
    }
    ctx.globalAlpha = 1;
}

function _metalPattern(ctx, size, baseColor, accentColor) {
    _paintNoise(ctx, size, baseColor, accentColor, 0xffffff, { density: 1200, streaks: 18, maxDot: 2.0 });
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 20; i++) {
        const y = (i / 20) * size + (Math.random() - 0.5) * 5;
        ctx.globalAlpha = 0.08;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y + (Math.random() - 0.5) * 4);
        ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 24; i++) {
        const x = Math.random() * size;
        ctx.globalAlpha = 0.04 + Math.random() * 0.05;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (Math.random() - 0.5) * 2, size);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

function _fabricPattern(ctx, size, baseColor, accentColor) {
    _paintNoise(ctx, size, baseColor, accentColor, 0xffffff, { density: 1000, streaks: 0, maxDot: 1.4 });
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    for (let i = 0; i < size; i += 8) {
        ctx.globalAlpha = 0.06;
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

function _camoPattern(ctx, size, baseColor, accentColor, detailColor) {
    _paintNoise(ctx, size, baseColor, accentColor, detailColor, { density: 900, streaks: 0, maxDot: 1.2 });
    const base = _hexToRgb(baseColor);
    const accent = _hexToRgb(accentColor ?? 0x33442b);
    const detail = _hexToRgb(detailColor ?? 0x1d2618);
    const colors = [
        _rgbToCss(_mixColor(base, accent, 0.55)),
        _rgbToCss(_mixColor(base, detail, 0.7)),
        _rgbToCss(_mixColor(accent, detail, 0.45)),
    ];

    for (let i = 0; i < 46; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const rx = 10 + Math.random() * 28;
        const ry = 6 + Math.random() * 20;
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.26 + Math.random() * 0.2;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < size; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + Math.sin(i) * 2, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i + Math.cos(i) * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

function _rubberPattern(ctx, size, baseColor, accentColor) {
    _paintNoise(ctx, size, baseColor, accentColor, 0x808080, { density: 1000, streaks: 12, maxDot: 1.4 });
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 16; i++) {
        ctx.fillRect((i / 16) * size, 0, size * 0.02, size);
    }
}

function _woodPattern(ctx, size, baseColor, accentColor) {
    _paintNoise(ctx, size, baseColor, accentColor, 0x2a1a0a, { density: 1100, streaks: 35, maxDot: 2.0 });
    ctx.strokeStyle = 'rgba(80,40,10,0.22)';
    for (let i = 0; i < 18; i++) {
        const y = (i / 18) * size + (Math.random() - 0.5) * 4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y + Math.sin(i) * 3);
        ctx.stroke();
    }
}

function _grassBladesPattern(ctx, size, baseColor, accentColor) {
    ctx.clearRect(0, 0, size, size);
    const base = _hexToRgb(baseColor);
    const accent = _hexToRgb(accentColor ?? 0x8fae4f);
    const blades = 26;
    for (let i = 0; i < blades; i++) {
        const x = ((i + Math.random()) / blades) * size;
        const w = size * (0.012 + Math.random() * 0.022);
        const h = size * (0.45 + Math.random() * 0.5);
        const lean = (Math.random() - 0.5) * size * 0.14;
        const c = _mixColor(base, accent, Math.random());
        ctx.fillStyle = _rgbToCss(c);
        ctx.beginPath();
        ctx.moveTo(x - w, size);
        ctx.lineTo(x + w, size);
        ctx.lineTo(x + lean, size - h);
        ctx.closePath();
        ctx.fill();
    }
}

function _glassPattern(ctx, size, baseColor) {
    const base = _hexToRgb(baseColor);
    ctx.fillStyle = _rgbToCss(base);
    ctx.fillRect(0, 0, size, size);
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, 'rgba(255,255,255,0.20)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.03)');
    grad.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < 10; i++) {
        const x = (i / 10) * size;
        ctx.fillRect(x, 0, size * 0.01, size);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size * 0.1, size * 0.1);
    ctx.lineTo(size * 0.9, size * 0.9);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size * 0.15, size * 0.12);
    ctx.lineTo(size * 0.85, size * 0.78);
    ctx.stroke();
}

export function createProceduralTexture(kind, options = {}) {
    const baseColor = options.baseColor ?? 0x808080;
    const accentColor = options.accentColor ?? baseColor;
    const detailColor = options.detailColor ?? 0xffffff;
    const size = options.size ?? 256;
    const repeatX = options.repeatX ?? 1;
    const repeatY = options.repeatY ?? 1;
    const anisotropy = options.anisotropy ?? 4;
    const key = JSON.stringify([kind, baseColor, accentColor, detailColor, size, repeatX, repeatY, anisotropy]);
    if (_textureCache.has(key)) return _textureCache.get(key);

    const canvas = _makeCanvas(size);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    switch (kind) {
        case 'terrain':
            _terrainPattern(ctx, size, baseColor, accentColor);
            break;
        case 'road':
            _roadPattern(ctx, size, baseColor, accentColor);
            break;
        case 'metal':
            _metalPattern(ctx, size, baseColor, accentColor);
            break;
        case 'fabric':
            _fabricPattern(ctx, size, baseColor, accentColor);
            break;
        case 'camo':
            _camoPattern(ctx, size, baseColor, accentColor, detailColor);
            break;
        case 'rubber':
            _rubberPattern(ctx, size, baseColor, accentColor);
            break;
        case 'wood':
            _woodPattern(ctx, size, baseColor, accentColor);
            break;
        case 'glass':
            _glassPattern(ctx, size, baseColor);
            break;
        case 'grass_blades':
            _grassBladesPattern(ctx, size, baseColor, accentColor);
            break;
        case 'concrete':
            _paintNoise(ctx, size, baseColor, accentColor, detailColor, { density: 2200, streaks: 20, maxDot: 3.0 });
            break;
        default:
            _paintNoise(ctx, size, baseColor, accentColor, detailColor, { density: 1400, streaks: 20, maxDot: 2.5 });
            break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.userData.sharedProcedural = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = anisotropy;
    texture.needsUpdate = true;
    texture.repeat.set(repeatX, repeatY);

    _textureCache.set(key, texture);
    return texture;
}

// SVG data URL 纹理在部分 WebGL 驱动下直接上传会产生
// "texSubImage2D: bad image data" 警告。改为先解码到固定尺寸
// canvas 再上传，兼容性更好且纹理内容保持一致。
export function createSvgCanvasTexture(svg, size = 512) {
    const canvas = _makeCanvas(size);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.userData.sharedProcedural = true;

    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        texture.needsUpdate = true;
    };
    img.onerror = () => {
        ctx.fillStyle = '#202420';
        ctx.fillRect(0, 0, size, size);
        texture.needsUpdate = true;
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return texture;
}

export function createProceduralMaterial(kind, options = {}, materialOptions = {}) {
    const baseColor = options.baseColor ?? 0x808080;
    const hasTextureHints = options.accentColor !== undefined ||
        options.detailColor !== undefined ||
        options.repeatX !== undefined ||
        options.repeatY !== undefined ||
        (materialOptions.bumpScale ?? 0) > 0;
    const useMap = materialOptions.useMap !== false && hasTextureHints;
    const useBump = useMap && materialOptions.useBump === true && (materialOptions.bumpScale ?? 0) > 0;
    const materialKey = JSON.stringify([
        kind,
        baseColor,
        useMap ? options.accentColor ?? null : null,
        useMap ? options.detailColor ?? null : null,
        useMap ? options.size ?? null : null,
        useMap ? options.repeatX ?? null : null,
        useMap ? options.repeatY ?? null : null,
        useMap ? options.anisotropy ?? null : null,
        materialOptions.color ?? baseColor,
        materialOptions.roughness ?? 0.85,
        materialOptions.metalness ?? 0.0,
        materialOptions.transparent ?? false,
        materialOptions.opacity ?? 1,
        useBump ? materialOptions.bumpScale ?? 0 : 0,
        useBump,
        useMap,
        materialOptions.side ?? null,
        materialOptions.depthWrite ?? null,
        materialOptions.emissive ?? null,
        materialOptions.emissiveIntensity ?? null,
    ]);
    if (_materialCache.has(materialKey)) return _materialCache.get(materialKey);

    const texture = (useMap || useBump) ? createProceduralTexture(kind, options) : null;
    const params = {
        color: materialOptions.color ?? baseColor,
        roughness: materialOptions.roughness ?? 0.85,
        metalness: materialOptions.metalness ?? 0.0,
        transparent: materialOptions.transparent ?? false,
        opacity: materialOptions.opacity ?? 1,
    };
    if (useMap) {
        params.map = texture;
    }
    if (useBump) {
        params.bumpMap = texture;
        params.bumpScale = materialOptions.bumpScale ?? 0.03;
    }
    for (const key of ['side', 'depthWrite', 'emissive', 'emissiveIntensity']) {
        if (materialOptions[key] !== undefined) params[key] = materialOptions[key];
    }
    const material = new THREE.MeshStandardMaterial(params);
    material.userData.sharedProcedural = true;
    _materialCache.set(materialKey, material);
    return material;
}
