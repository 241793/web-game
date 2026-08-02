const fs = require('fs');
const path = 'js/world/Obstacles.js';
let content = fs.readFileSync(path, 'utf8');

const newBlock = `        // === 二楼 + 靠墙 L 型转弯楼梯（对足够高、足够大的建筑） ===
        // 设计：楼梯靠墙角爬升。第一段贴 -X 内墙沿 +Z 上升到 1.5m，
        //       转角平台（靠 -X -Z 角落），第二段贴 -Z 内墙沿 +X 上升到 3.0m 顶端即二楼地板。
        //       玩家一路向前走上去，不用回头。二楼地板整块铺满，仅在第一段上方留入口洞。
        if (height >= 6 && width >= 9 && depth >= 8) {
            const floor2Y = 3.0;
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

            // 第一段：贴 -X 内墙，从入口端 innerMinZ 起，沿 +Z 爬升到 halfH
            const run1MinZ = innerMinZ + 0.2;
            const run1MaxZ = run1MinZ + firstRunLen;
            const run1X = innerMinX + stairW / 2;

            // 转角平台：在 -X -Z 角落，方形
            const landingSize = stairW + 0.2;

            // 第二段：贴 -Z 内墙，从平台 +X 侧起，沿 +X 爬升到 floor2Y
            const run2MinX = innerMinX + landingSize;
            const run2MaxX = run2MinX + secondRunLen;
            const run2Z = innerMinZ + stairW / 2;

            // === 二楼地板：整块铺满，仅在第一段上方留入口洞 ===
            // 入口洞 = 第一段楼梯投影 + 缓冲
            const holeMinX = innerMinX - 0.05;
            const holeMaxX = innerMinX + stairW + 0.05;
            const holeMinZ = run1MinZ - 0.3;
            const holeMaxZ = run1MaxZ + 0.5;

            const slabThickness = 0.18;
            const slabAY0 = y + floor2Y;
            // 板 A：洞 +X 侧大板（覆盖大部分二楼）
            const aMinX = holeMaxX;
            const aMaxX = innerMaxX;
            if (aMaxX - aMinX > 0.3) {
                addPart('floor2_main', (aMinX + aMaxX) / 2, slabAY0, (innerMinZ + innerMaxZ) / 2, aMaxX - aMinX, slabThickness, innerDepth, floorMat, true);
            }
            // 板 B：洞 +Z 侧（洞上方从 holeMaxZ 到 innerMaxZ）
            const bMinZ = holeMaxZ;
            const bMaxZ = innerMaxZ;
            if (bMaxZ - bMinZ > 0.3 && holeMaxX - innerMinX > 0.3) {
                addPart('floor2_corner', (innerMinX + holeMaxX) / 2, slabAY0, (bMinZ + bMaxZ) / 2, holeMaxX - innerMinX, slabThickness, bMaxZ - bMinZ, floorMat, true);
            }

            // === 第一段楼梯（贴 -X 墙，沿 +Z 上升）===
            for (let i = 0; i < halfStepCount; i++) {
                const stepTopY = y + actualHalfStepH * (i + 1);
                const stepZPos = run1MinZ + i * stepD;
                addPart(\`stairs_a_\${i}\`, run1X, stepTopY - actualHalfStepH / 2, stepZPos, stairW, actualHalfStepH + 0.02, stepD + 0.04, trimMat, true);
            }

            // === 转角平台（在 -X -Z 角落，halfH 高度）===
            const landingCenterX = innerMinX + landingSize / 2;
            const landingCenterZ = innerMinZ + landingSize / 2;
            addPart('stairs_landing', landingCenterX, y + halfH - 0.09, landingCenterZ, landingSize, 0.18, landingSize, floorMat, true);

            // === 第二段楼梯（贴 -Z 墙，沿 +X 上升）===
            for (let i = 0; i < halfStepCount; i++) {
                const stepTopY = y + halfH + actualHalfStepH * (i + 1);
                const stepXPos = run2MinX + 0.2 + i * stepD;
                addPart(\`stairs_b_\${i}\`, stepXPos, stepTopY - actualHalfStepH / 2, run2Z, stepD + 0.04, actualHalfStepH + 0.02, stairW, trimMat, true);
            }

            // === 楼梯外侧护栏立柱（每侧 5 根，跟随台阶爬升）===
            const railH = 1.0;
            const postCount = 5;
            // 第一段 +X 侧立柱（外侧）
            const rail1X = run1X + stairW / 2 + 0.04;
            for (let i = 0; i < postCount; i++) {
                const t = i / (postCount - 1);
                const postZ = run1MinZ + t * (firstRunLen - stepD / 2);
                const stepIdx = Math.min(halfStepCount - 1, Math.floor(t * halfStepCount));
                const postY = y + actualHalfStepH * (stepIdx + 1) + 0.45;
                addPart(\`post_a_\${i}\`, rail1X, postY, postZ, 0.06, 0.9, 0.06, trimMat, true);
            }
            // 第二段 +Z 侧立柱（外侧）
            const rail2Z = run2Z + stairW / 2 + 0.04;
            for (let i = 0; i < postCount; i++) {
                const t = i / (postCount - 1);
                const postX = run2MinX + 0.2 + t * (secondRunLen - stepD / 2);
                const stepIdx = Math.min(halfStepCount - 1, Math.floor(t * halfStepCount));
                const postY = y + halfH + actualHalfStepH * (stepIdx + 1) + 0.45;
                addPart(\`post_b_\${i}\`, postX, postY, rail2Z, 0.06, 0.9, 0.06, trimMat, true);
            }

            // === 二楼地板开口边缘护栏（防止玩家从二楼踩空掉入楼梯井）===
            addPart('floor2_hole_rail_x', holeMaxX + 0.03, y + floor2Y + railH / 2, (holeMinZ + holeMaxZ) / 2, 0.06, railH, holeMaxZ - holeMinZ, trimMat, true);
            if (holeMaxZ < innerMaxZ - 0.1) {
                addPart('floor2_hole_rail_z', (holeMinX + holeMaxX) / 2, y + floor2Y + railH / 2, holeMaxZ + 0.03, holeMaxX - holeMinX, railH, 0.06, trimMat, true);
            }

            // === 二楼前后墙开窗（在 floor2Y+0.55 以上）===
            const sillH2 = floor2Y + 0.55;
            const openingH2 = 1.1;
            const lintelY2 = sillH2 + openingH2;
            const windowW2 = Math.min(Math.max(1.4, innerWidth * 0.35), 2.2);
            const wallSpanX = Math.min(width, innerWidth) - 0.1;
            for (const wallInfo of [
                { suffix: 'front', wz: z + depth / 2 - wallThickness / 2 },
                { suffix: 'back', wz: z - depth / 2 + wallThickness / 2 },
            ]) {
                const wz = wallInfo.wz;
                addPart(\`f2_\${wallInfo.suffix}_lower\`, x, y + (floor2Y + sillH2) / 2, wz, wallSpanX, sillH2 - floor2Y, wallThickness * 0.95, wallMat, true);
                addPart(\`f2_\${wallInfo.suffix}_upper\`, x, y + (lintelY2 + height) / 2, wz, wallSpanX, height - lintelY2, wallThickness * 0.95, wallMat, true);
                for (const sx of [-1, 1]) {
                    addPart(\`f2_\${wallInfo.suffix}_side_\${sx > 0 ? 'r' : 'l'}\`, x + sx * (windowW2 / 2 + 0.05), y + (sillH2 + lintelY2) / 2, wz, 0.1, openingH2, wallThickness * 0.95, wallMat, true);
                }
                const pane = addPart(\`f2_\${wallInfo.suffix}_glass\`, x, y + (sillH2 + lintelY2) / 2, wz, windowW2 * 0.94, openingH2 * 0.92, 0.03, glassMat, false);
                markGlass(pane);
                addPart(\`f2_\${wallInfo.suffix}_frame_low\`, x, y + sillH2 + 0.02, wz, windowW2 + 0.16, 0.06, wallThickness * 0.7, trimMat, false);
                addPart(\`f2_\${wallInfo.suffix}_frame_high\`, x, y + lintelY2 - 0.02, wz, windowW2 + 0.16, 0.06, wallThickness * 0.7, trimMat, false);
            }

            // === 二楼家具（6 件，放置在二楼主地板区域）===
            const f2y = y + floor2Y + 0.09;
            const furnCenterX = (holeMaxX + innerMaxX) / 2;
            const furnCenterZ = (innerMinZ + innerMaxZ) / 2;
            addPart('f2_bed', furnCenterX - 2.5, f2y + 0.35, furnCenterZ + 1.5, 1.4, 0.7, 2.0, trimMat, true);
            addPart('f2_desk', furnCenterX + 2.5, f2y + 0.38, furnCenterZ - 1.5, 1.8, 0.76, 0.9, trimMat, true);
            addPart('f2_desk_top', furnCenterX + 2.5, f2y + 0.76, furnCenterZ - 1.5, 1.85, 0.06, 0.95, trimMat, false);
            addPart('f2_sofa', furnCenterX + 2.5, f2y + 0.35, furnCenterZ + 1.0, 1.8, 0.7, 0.7, trimMat, true);
            addPart('f2_shelf', furnCenterX - 2.5, f2y + 0.75, furnCenterZ - 1.5, 1.0, 1.5, 0.4, trimMat, true);
            addPart('f2_crate', furnCenterX, f2y + 0.45, furnCenterZ, 0.9, 0.9, 0.9, trimMat, true);
        }`;

// 把 \${...} 还原成 JS 模板字符串语法
const finalBlock = newBlock.replace(/\\\$\{/g, '${');

// 找到 1071 行开始（"        // === 二楼 + L 型转弯楼梯"）和 1205 行结束（"        }"）
const lines = content.split(/\r?\n/);
// 找起始行
let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('二楼 + L 型转弯楼梯')) { startIdx = i; break; }
}
if (startIdx < 0) { console.error('start not found'); process.exit(1); }

// 找结束行：从 startIdx 开始找第一个 "        }" 后跟三个空行再跟 "        // 屋顶"
let endIdx = -1;
for (let i = startIdx + 1; i < lines.length - 5; i++) {
  const cur = lines[i].replace(/\s+$/, '');
  if (cur === '        }' && lines[i+1].trim() === '' && lines[i+2].trim() === '' && lines[i+3].trim() === '' && lines[i+4].includes('// 屋顶')) {
    endIdx = i; break;
  }
}
if (endIdx < 0) { console.error('end not found'); process.exit(1); }

console.log('Replacing lines', startIdx+1, 'to', endIdx+1);

// 替换
const newLines = [...lines.slice(0, startIdx), ...finalBlock.split(/\r?\n/), ...lines.slice(endIdx+1)];
const newContent = newLines.join('\r\n');
fs.writeFileSync(path, newContent);
console.log('Done. New line count:', newLines.length);
