/* ===== 世界 / 方块系统 =====
 * 引用 data.js 中枢的 TILES / TILE_BY_NAME
 * 多生物群落：森林 / 沙漠 / 雪原 / 丛林 / 腐化
 * 深度矿石分布：铜→铁→银→金→魔矿；地下宝石、生命/魔力水晶、罐子、宝箱
 */
(function(){
  const TS = 16;
  const DATA = window.DATA;
  const TILES = DATA.TILES, BY_NAME = DATA.TILE_BY_NAME;
  const A = window.ASSETS.sprites;

  // tile id 速记
  const T = {
    air:0, grass:1, dirt:2, stone:3, wood:4, leaves:5, sand:6, plank:7, brick:8,
    torch:9, door:10, workbench:11, platform:12, glass:13, furnace:14, anvil:15,
    chest:16, pot:17, snow:18, ice:19,
    copper_ore:20, iron_ore:21, gold_ore:22, coal:23, silver_ore:28, demonite_ore:29,
    jungle_grass:24, mud:25, water:26, lava:27,
    life_crystal:30, mana_crystal:31,
    gem_amethyst:32, gem_topaz:33, gem_sapphire:34, gem_emerald:35, gem_ruby:36, gem_diamond:37,
    corruption_grass:38, ebonstone:39, shadow_orb:40,
    hive:41, honey:42, larva:43, dungeon_brick:44,
    ash:45, hellstone:46, hellbrick:47,
    cobalt_ore:48, mythril_ore:49, adamantite_ore:50,
    demon_altar:51, pearlstone:52, hallowed_grass:53,
    plantera_bulb:54, lihzahrd_brick:55, temple_altar:56, chlorophyte_ore:57, cloud:58,
  };
  function tileByName(n){ return BY_NAME[n]; }

  function World(w,h,seed){
    this.w=w; this.h=h; this.TS=TS;
    this.tiles=new Uint8Array(w*h);
    this.damage=new Float32Array(w*h);
    this.bg=new Uint8Array(w*h);      // 1=泥土墙 2=石墙 3=雪墙 4=沙墙 5=丛林墙 6=腐化墙
    this.chests=[];                   // {x,y,items:{key:n}}
    this.modified=new Set();          // 玩家改动过的 tile 索引（用于存档恢复）
    this.seed = seed || (Math.random()*1e9)|0;
    this.gen();
  }

  // 值噪声
  function vnoise(seed){
    let s=seed>>>0||1; const perm=new Uint8Array(512);
    for(let i=0;i<256;i++) perm[i]=i;
    let r=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296};
    for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));const t=perm[i];perm[i]=perm[j];perm[j]=t;}
    for(let i=0;i<256;i++) perm[256+i]=perm[i];
    const fade=t=>t*t*t*(t*(t*6-15)+10);
    return (x,y)=>{
      const X=Math.floor(x)&255, Y=Math.floor(y)&255;
      const xf=x-Math.floor(x), yf=y-Math.floor(y);
      const u=fade(xf), v=fade(yf);
      const aa=perm[perm[X]+Y], ab=perm[perm[X]+Y+1];
      const ba=perm[perm[X+1]+Y], bb=perm[perm[X+1]+Y+1];
      const lerp=(a,b,t)=>a+(b-a)*t;
      const g=(h,x,y)=>{const u=(h&1)?x:-x, v=(h&2)?y:-y; return u+v};
      const x1=lerp(g(aa,xf,yf), g(ba,xf-1,yf), u);
      const x2=lerp(g(ab,xf,yf-1), g(bb,xf-1,yf-1), u);
      return lerp(x1, x2, v);
    };
  }

  // 原版式大型连续区域；出生点固定为森林，世界方向随种子镜像
  function biomeAt(thisRef,x){
    const u=(x+0.5)/thisRef.w;
    const q=((thisRef.seed>>>0)&1) ? 1-u : u;
    if(q<0.06 || q>=0.94) return 'ocean';
    if(q<0.18) return 'snow';
    if(q<0.26) return 'forest';
    if(q<0.36) return 'corruption';
    if(q<0.62) return 'forest';
    if(q<0.72) return 'desert';
    if(q<0.78) return 'forest';
    if(q<0.92) return 'jungle';
    return 'forest';
  }

  World.prototype.gen=function(){
    const w=this.w,h=this.h;
    const seed=this.seed;
    const surf=vnoise(seed),cave=vnoise(seed+1),ore=vnoise(seed+2),ore2=vnoise(seed+3),gem=vnoise(seed+4);
    let rng=(seed^0x6d2b79f5)>>>0||1;
    const rnd=()=>{rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;return (rng>>>0)/4294967296;};
    const oceanW=Math.max(60, Math.floor(w*0.06));     // 边缘海洋宽度
    const heightMap=[];
    for(let x=0;x<w;x++){
      // 多倍频地形：大起伏 + 中起伏 + 细节
      const n=surf(x*0.018,0)*0.55 + surf(x*0.05,7)*0.28 + surf(x*0.13,3)*0.17;
      const b=biomeAt(this,x);
      // 地表基准拉到 22%，振幅按高度比例放大
      let base=h*0.22 + n*(h*0.10);
      if(b==='desert') base += h*0.02;        // 沙漠凹陷
      if(b==='snow')   base -= h*0.005;
      if(b==='jungle') base -= h*0.02;       // 丛林凹陷
      if(b==='corruption') base += 0;
      // 边缘海洋：向两岸渐沉入海面
      if(x<oceanW){
        const t=1 - x/oceanW;            // 0=陆地 1=最外
        base += t*t*h*0.18;
      } else if(x>=w-oceanW){
        const t=1 - (w-1-x)/oceanW;
        base += t*t*h*0.18;
      }
      heightMap.push(Math.floor(base));
    }
    this.heightMap=heightMap;
    this.oceanY=Math.floor(h*0.22);   // 海平面
    this.biomeMap=[];
    for(let x=0;x<w;x++) this.biomeMap.push(biomeAt(this,x));

    // 基本地表填充
    for(let x=0;x<w;x++){
      const gy=heightMap[x], b=this.biomeMap[x];
      for(let y=0;y<h;y++){
        const i=y*w+x;
        if(y<gy){ this.tiles[i]=0; continue; }
        if(y===gy){
          if(b==='desert'||b==='ocean') this.tiles[i]=T.sand;
          else if(b==='snow') this.tiles[i]=T.snow;
          else if(b==='jungle') this.tiles[i]=T.jungle_grass;
          else if(b==='corruption') this.tiles[i]=T.corruption_grass;
          else this.tiles[i]=T.grass;
        } else if(y<gy+6){
          if(b==='desert'||b==='ocean') this.tiles[i]=T.sand;
          else if(b==='snow') this.tiles[i]=T.snow;
          else if(b==='jungle') this.tiles[i]=T.mud;
          else if(b==='corruption') this.tiles[i]=T.ebonstone;
          else this.tiles[i]=T.dirt;
        } else {
          if(b==='corruption') this.tiles[i]=T.ebonstone;
          else this.tiles[i]=T.stone;
        }
        // 背景墙
        if(y>gy){
          if(b==='desert'||b==='ocean') this.bg[i]=4;
          else if(b==='snow') this.bg[i]=3;
          else if(b==='jungle') this.bg[i]=5;
          else if(b==='corruption') this.bg[i]=6;
          else if(y<gy+6) this.bg[i]=1;
          else this.bg[i]=2;
        }
      }
    }

    // 洞穴（多层噪声：大洞穴 + 走廊 + 细节）
    for(let x=0;x<w;x++) for(let y=0;y<h;y++){
      const i=y*w+x;
      if(this.tiles[i]===0) continue;
      const cv=cave(x*0.045, y*0.06);
      const cv2=cave(x*0.10+50, y*0.10+50);
      const cv3=cave(x*0.22+9, y*0.22+9);
      // 大洞穴更宽，走廊更细
      if(y>heightMap[x]+4 && ((cv>0.52 && cv3>0.35) || (cv2>0.55 && cv3>0.30))){
        this.tiles[i]=0;
        if(y>heightMap[x]+12) this.bg[i]=0;
      }
    }

    // 地下水池 / 岩浆池：在洞穴空腔底部填液
    for(let x=2;x<w-2;x++) for(let y=0;y<h;y++){
      const i=y*w+x;
      if(this.tiles[i]!==0) continue;
      // 空格下方有实体 → 可能是池底
      const below=this.tiles[(y+1)*w+x];
      if(below!==0){
        const d=y-heightMap[x];
        // 浅层水：地下 6~40 深度内偶有水池
        if(d>6 && d<h*0.45){
          if(ore(x*0.5+3, y*0.5+3)>0.62){
            // 向上填充至 3~5 格高
            const depth=3+Math.floor(ore(x*0.7, y*0.3)*3);
            for(let k=0;k<depth && y-k>=0;k++){
              const ii=(y-k)*w+x;
              if(this.tiles[ii]!==0) break;
              this.tiles[ii]=T.water;
            }
          }
        }
        // 深层岩浆：洞穴层底部（地狱上方）偶有岩浆池
        if(d>h*0.40 && d<h*0.78){
          if(ore2(x*0.5+11, y*0.5+11)>0.70){
            const depth=2+Math.floor(ore2(x*0.3, y*0.3)*2);
            for(let k=0;k<depth && y-k>=0;k++){
              const ii=(y-k)*w+x;
              if(this.tiles[ii]!==0) break;
              this.tiles[ii]=T.lava;
            }
          }
        }
      }
    }

    // 矿石按深度生成成片矿脉，而不是零散单格
    let oreSeed=(seed^0x0e5a)>>>0||1;
    const oreRand=()=>{oreSeed^=oreSeed<<13;oreSeed^=oreSeed>>>17;oreSeed^=oreSeed<<5;return (oreSeed>>>0)/4294967296;};
    const paintOreVeins=(tile,density,minDepth,maxDepth,minRadius,maxRadius)=>{
      const count=Math.floor(w*h*density);
      for(let n=0;n<count;n++){
        const cx=2+Math.floor(oreRand()*(w-4));
        const depth=Math.floor(h*(minDepth+oreRand()*(maxDepth-minDepth)));
        const cy=heightMap[cx]+depth;
        if(cy<2||cy>=Math.floor(h*0.84)) continue;
        const rx=minRadius+Math.floor(oreRand()*(maxRadius-minRadius+1));
        const ry=Math.max(1,rx-1+Math.floor(oreRand()*2));
        for(let dy=-ry;dy<=ry;dy++) for(let dx=-rx;dx<=rx;dx++){
          if((dx*dx)/(rx*rx)+(dy*dy)/(ry*ry)>1+oreRand()*0.35) continue;
          const tx=cx+dx, ty=cy+dy;
          if(tx<1||tx>=w-1||ty<1||ty>=h-1) continue;
          const i=ty*w+tx, current=this.tiles[i];
          if(current===T.stone||current===T.ebonstone) this.tiles[i]=tile;
        }
      }
    };
    paintOreVeins(T.coal,0.00080,0.02,0.55,1,3);
    paintOreVeins(T.copper_ore,0.00065,0.03,0.38,1,3);
    paintOreVeins(T.iron_ore,0.00058,0.10,0.52,1,3);
    paintOreVeins(T.silver_ore,0.00048,0.22,0.62,1,3);
    paintOreVeins(T.gold_ore,0.00042,0.34,0.72,1,3);
    paintOreVeins(T.demonite_ore,0.00022,0.18,0.68,1,2);

    // 雪原地下：冰层加厚
    for(let x=0;x<w;x++){
      if(this.biomeMap[x]!=='snow') continue;
      for(let y=heightMap[x]+8;y<h;y++){
        const i=y*w+x;
        if(this.tiles[i]===T.stone && ore(x*0.2,y*0.2)>0.5) this.tiles[i]=T.ice;
      }
    }

    // 宝石（地下深处稀疏）
    const gemIds=[T.gem_amethyst,T.gem_topaz,T.gem_sapphire,T.gem_emerald,T.gem_ruby,T.gem_diamond];
    for(let x=0;x<w;x++) for(let y=0;y<h;y++){
      const i=y*w+x;
      if(this.tiles[i]!==T.stone) continue;
      const d=y-heightMap[x];
      if(d<h*0.10) continue;
      const g=gem(x*0.1,y*0.1);
      if(g>0.92){
        const gi=Math.min(gemIds.length-1, Math.floor((g-0.92)*100) % gemIds.length);
        this.tiles[i]=gemIds[gi];
      }
    }

    // 生命水晶（地下深处，稀疏）
    for(let i=0;i<w*h;i++){
      if(this.tiles[i]!==T.stone) continue;
      const y=Math.floor(i/w), x=i%w;
      const d=y-heightMap[x];
      if(d<h*0.12) continue;
      if(ore(x*0.31+7,y*0.31+7)>0.985) this.tiles[i]=T.life_crystal;
    }
    // 魔力水晶（更深、更稀疏）
    for(let i=0;i<w*h;i++){
      if(this.tiles[i]!==T.stone) continue;
      const y=Math.floor(i/w), x=i%w;
      const d=y-heightMap[x];
      if(d<h*0.20) continue;
      if(ore(x*0.37+13,y*0.37+13)>0.99) this.tiles[i]=T.mana_crystal;
    }

    // ===== 浮空岛（空岛）：在地表上方随机几座云砖小岛 =====
    {
      const islandCount=3+Math.floor(w/600);
      this.skyIslands=[];
      for(let k=0;k<islandCount;k++){
        const ix=Math.floor(w*(0.12+0.76*(k+0.5)/islandCount) + (ore(k*7.7,0)-0.5)*w*0.04);
        if(ix<oceanW+10 || ix>w-oceanW-10) continue;
        const iy=Math.floor(h*0.05 + ore(ix*0.5, k*9.1)*h*0.04);
        const iw=14+Math.floor(ore(ix*0.3,9)*10);
        const ih=4+Math.floor(ore(ix*0.4,5)*3);
        // 底座云砖（实心椭球上半）
        for(let dy=0;dy<ih;dy++) for(let dx=-Math.floor(iw/2);dx<=Math.floor(iw/2);dx++){
          const tx=ix+dx, ty=iy+dy;
          if(tx<1||tx>=w-1||ty<0||ty>=h) continue;
          const ex=(dx*dx)/((iw/2)*(iw/2));
          const ey=(dy*dy)/(ih*ih);
          if(ex+ey>1) continue;
          this.tiles[ty*w+tx]=T.cloud;
          this.bg[ty*w+tx]=0;
        }
        // 岛上铺一层草地 + 一棵小树
        const topY=iy;
        for(let dx=-Math.floor(iw/2);dx<=Math.floor(iw/2);dx++){
          const tx=ix+dx;
          if(tx<1||tx>=w-1) continue;
          if(this.tiles[topY*w+tx]===T.cloud){
            this.tiles[topY*w+tx]=T.grass;
            if(Math.abs(dx)<2 && rnd()<0.5){
              const th=3+Math.floor(rnd()*2);
              for(let t=1;t<=th;t++) if(this.tiles[(topY-t)*w+tx]===0) this.tiles[(topY-t)*w+tx]=T.wood;
              for(let ddx=-2;ddx<=2;ddx++) for(let ddy=-2;ddy<=0;ddy++){
                const txx=ix+dx+ddx, tyy=topY-th+ddy;
                if(txx<0||txx>=w||tyy<0) continue;
                if(Math.abs(ddx)+Math.abs(ddy)<=2 && this.tiles[tyy*w+txx]===0) this.tiles[tyy*w+txx]=T.leaves;
              }
            }
          }
        }
        // 岛下偶有水滴池（小）
        if(rnd()<0.4){
          const px=ix, py=iy+ih+2+Math.floor(ore(ix,5)*3);
          if(py<h-2) this.tiles[py*w+px]=T.water;
        }
        this.skyIslands.push({x:ix,y:iy,w:iw,h:ih});
      }
    }

    // 边缘海洋：在地表低洼处填水至海平面
    {
      const oy=this.oceanY;
      for(let x=0;x<w;x++){
        const gy=heightMap[x];
        if(gy<=oy) continue;       // 没下沉，不填
        // 只在两侧海洋带内
        const inLeft=x<oceanW, inRight=x>=w-oceanW;
        if(!inLeft && !inRight) continue;
        for(let y=oy;y<gy && y<h;y++){
          const i=y*w+x;
          if(this.tiles[i]===0) this.tiles[i]=T.water;
        }
        // 海底沙化
        for(let y=gy;y<gy+3 && y<h;y++){
          const i=y*w+x;
          if(this.tiles[i]===T.dirt || this.tiles[i]===T.stone) this.tiles[i]=T.sand;
        }
      }
    }

    // 罐子（地表 + 浅洞）
    for(let x=0;x<w;x++){
      if(rnd()<0.04){
        const gy=heightMap[x];
        // 优先放在地表上方一格（地表 = gy，罐子 gy-1）
        const ty=gy-1;
        if(this.tiles[ty*w+x]===0){ this.tiles[ty*w+x]=T.pot; }
      }
      if(rnd()<0.02){
        const gy=heightMap[x];
        const ty=gy+5+Math.floor(rnd()*8);
        if(this.tiles[ty*w+x]===0 && this.tiles[(ty+1)*w+x]!==0){ this.tiles[ty*w+x]=T.pot; }
      }
    }

    // 树（森林地表）
    let x=4;
    while(x<w-4){
      const b=this.biomeMap[x];
      if((b==='forest'||b==='jungle') && rnd()<0.18){
        const gy=heightMap[x];
        const groundTile=this.tiles[gy*w+x];
        if(groundTile===T.grass || groundTile===T.jungle_grass){
          const th=3+Math.floor(rnd()*3);
          for(let t=1;t<=th;t++) this.tiles[(gy-t)*w+x]=T.wood;
          const cy=gy-th-1, cx=x;
          for(let dy=-2;dy<=1;dy++) for(let dx=-2;dx<=2;dx++){
            if(Math.abs(dx)+Math.abs(dy)<=2){
              const ti=(cy+dy)*w+(cx+dx);
              if(this.tiles[ti]===0) this.tiles[ti]=T.leaves;
            }
          }
          x+=3; continue;
        }
      }
      x++;
    }

    // 木宝箱（地下浅层，数量按世界宽度比例）
    const chestCount=Math.max(8, Math.floor(w/70));
    for(let i=0;i<chestCount;i++){
      const cx=Math.floor(rnd()*w);
      const gy=heightMap[cx];
      const ty=gy+8+Math.floor(rnd()*14);
      const tx=cx;
      if(this.tiles[ty*w+tx]===0 && this.tiles[(ty+1)*w+tx]!==0){
        this.tiles[ty*w+tx]=T.chest;
        this.chests.push({x:tx,y:ty,items:randomChestLoot(rnd)});
      }
    }

    // 出生点附近清空 + 工作台
    const sx=Math.floor(w/2);
    const gy=heightMap[sx];
    this.tiles[(gy-1)*w+sx+1]=T.workbench;
    this.heightStart=gy-3;

    // 暗影珠（腐化之地地下，3颗一组）
    this.shadowOrbs={broken:0, positions:[]};
    const corrXs=[];
    for(let x=0;x<w;x++) if(this.biomeMap[x]==='corruption') corrXs.push(x);
    if(corrXs.length>10){
      // 找3个腐化区域中心
      const picked=[];
      for(let g=0;g<3;g++){
        let best=-1, bestDist=-1;
        for(let a=0;a<20;a++){
          const c=corrXs[Math.floor(rnd()*corrXs.length)];
          const cx=Math.floor(w/2);
          let minDist=Infinity;
          for(const pk of picked) minDist=Math.min(minDist,Math.abs(pk-c));
          minDist=Math.min(minDist,Math.abs(cx-c));
          if(minDist>bestDist){bestDist=minDist; best=c;}
        }
        if(best>=0){ picked.push(best); this.shadowOrbs.positions.push(best); }
      }
      for(const cxp of picked){
        const depth=8+Math.floor(ore(cxp*0.3+99,0)*10);
        const oy=heightMap[cxp]+depth;
        const bx=cxp;
        // 挖一个2x2空腔放珠子
        this.tiles[oy*w+bx]=T.shadow_orb;
        this.tiles[(oy+1)*w+bx]=T.ebonstone;
        this.tiles[oy*w+bx+1]=T.ebonstone;
        this.tiles[(oy+1)*w+bx+1]=T.ebonstone;
      }
    }

    // 丛林蜂巢：在丛林地下挖出蜂巢腔 + 幼虫
    this.hives=[];
    const jungXs=[];
    for(let x=0;x<w;x++) if(this.biomeMap[x]==='jungle') jungXs.push(x);
    if(jungXs.length>12){
      const centers=[];
      for(let g=0;g<2;g++){
        let best=-1, bestDist=-1;
        for(let a=0;a<24;a++){
          const c=jungXs[Math.floor(rnd()*jungXs.length)];
          let minDist=Infinity;
          for(const pk of centers) minDist=Math.min(minDist,Math.abs(pk-c));
          minDist=Math.min(minDist,Math.abs(Math.floor(w/2)-c));
          if(minDist>bestDist){bestDist=minDist; best=c;}
        }
        if(best>=0) centers.push(best);
      }
      for(const cxp of centers){
        const depth=6+Math.floor(Math.abs(ore(cxp*0.2+7,0))*8);
        const cy=heightMap[cxp]+depth;
        // 椭圆腔
        for(let dy=-4;dy<=4;dy++) for(let dx=-6;dx<=6;dx++){
          if((dx*dx)/36+(dy*dy)/16>1) continue;
          const tx=cxp+dx, ty=cy+dy;
          if(tx<1||tx>=w-1||ty<1||ty>=h-1) continue;
          const edge=((dx*dx)/36+(dy*dy)/16)>0.55;
          this.tiles[ty*w+tx]=edge?T.hive:T.honey;
          if(!edge) this.bg[ty*w+tx]=5;
        }
        // 幼虫挂在腔顶附近
        const lx=cxp, ly=cy-2;
        this.tiles[ly*w+lx]=T.larva;
        this.hives.push({x:lx,y:ly,cx:cxp,cy});
      }
    }

    // 地牢：世界左侧或右侧选一段地表入口，向下延伸砖室
    this.dungeon=null;
    {
      const leftSide=rnd()<0.5;
      const band=leftSide
        ? Math.floor(w*0.08+rnd()*w*0.08)
        : Math.floor(w*0.84+rnd()*w*0.08);
      const entranceX=Math.max(8,Math.min(w-20,band));
      const gy=heightMap[entranceX];
      // 地表入口塔
      for(let dy=-6;dy<=0;dy++){
        this.tiles[(gy+dy)*w+entranceX]=T.dungeon_brick;
        this.tiles[(gy+dy)*w+entranceX+4]=T.dungeon_brick;
        for(let dx=1;dx<=3;dx++){
          this.tiles[(gy+dy)*w+entranceX+dx]=0;
          this.bg[(gy+dy)*w+entranceX+dx]=2;
        }
      }
      // 入口地板与门洞
      for(let dx=0;dx<=4;dx++) this.tiles[gy*w+entranceX+dx]=T.dungeon_brick;
      this.tiles[(gy-1)*w+entranceX+2]=0;
      this.tiles[(gy-2)*w+entranceX+2]=0;
      // 向下主走廊 + 房间（地牢向下延伸更深）
      const depth=Math.min(h-8, gy+Math.floor(h*0.20));
      for(let y=gy+1;y<=depth;y++){
        for(let dx=0;dx<=4;dx++){
          const solid=dx===0||dx===4;
          this.tiles[y*w+entranceX+dx]=solid?T.dungeon_brick:0;
          if(!solid) this.bg[y*w+entranceX+dx]=2;
        }
        // 每隔几层开侧室
        if(y%7===0){
          for(let dx=5;dx<=10;dx++){
            for(let dy=-2;dy<=2;dy++){
              const tx=entranceX+dx, ty=y+dy;
              if(tx>=w-1||ty>=h-1) continue;
              const wall=dx===10||dy===-2||dy===2;
              this.tiles[ty*w+tx]=wall?T.dungeon_brick:0;
              if(!wall) this.bg[ty*w+tx]=2;
            }
          }
          // 侧室宝箱
          const cx=entranceX+7, cy=y+1;
          if(this.tiles[cy*w+cx]===0){
            this.tiles[cy*w+cx]=T.chest;
            this.chests.push({x:cx,y:cy,items:randomChestLoot(rnd)});
          }
        }
      }
      this.dungeon={x:entranceX, y:gy-1, locked:true};
    }

    // ===== 地狱层（世界底部约 15% 高度，更深）=====
    this.hellY=Math.floor(h*0.85);
    for(let x=0;x<w;x++){
      // 地狱天花板灰烬
      for(let y=this.hellY;y<h;y++){
        const i=y*w+x;
        const rel=(y-this.hellY)/(h-this.hellY+1);
        // 岩浆湖：底层
        if(y>=h-3){ this.tiles[i]=T.lava; this.bg[i]=0; continue; }
        if(y>=h-5 && rnd()<0.55){ this.tiles[i]=T.lava; continue; }
        // 空腔：地狱走道
        const cav=cave(x*0.07+3, y*0.07+9);
        if(rel>0.15 && rel<0.75 && cav>0.15){
          this.tiles[i]=0; this.bg[i]=0;
          continue;
        }
        // 填充灰烬 / 狱石
        if(this.tiles[i]===0 || this.tiles[i]===T.stone || this.tiles[i]===T.dirt || this.tiles[i]===T.ebonstone || this.tiles[i]===T.sand || this.tiles[i]===T.ice){
          // 狱石：用绝对值噪声 + 较低阈值，保证地狱有可采矿脉
          const r=Math.abs(ore(x*0.11,y*0.11));
          const r2=Math.abs(ore(x*0.22+17,y*0.19+9));
          if(r>0.42 && r2>0.35) this.tiles[i]=T.hellstone;
          else this.tiles[i]=T.ash;
          this.bg[i]=0;
        }
      }
      // 少量狱岩桥
      if(x%37===0){
        const by=this.hellY+6+Math.floor(rnd()*8);
        for(let dx=0;dx<8;dx++){
          const tx=x+dx; if(tx>=w) break;
          this.tiles[by*w+tx]=T.hellbrick;
        }
      }
    }
    this.hardmode=false;

    this.spawnX=sx*TS; this.spawnY=this.heightStart*TS;
  };

  // 困难模式：在岩石层生成钴/秘银/精金 + 恶魔祭坛 + 神圣条带
  World.prototype.enableHardmode=function(){
    if(this.hardmode) return;
    this.hardmode=true;
    this.altarsBroken=0;
    this.spawnHardmodeOres(1.0);
    this.spawnDemonAltars();
    this.spawnHallowStrip();
    this.spawnChlorophyte();
    this.planteraBulbs=this.planteraBulbs||[];
    this.bossesDown={plantera:false,golem:false};
    this.spawnJungleTemple();
  };
  // 叶绿矿：地下丛林（石头或泥均可）随机
  World.prototype.spawnChlorophyte=function(){
    const w=this.w,h=this.h;
    let s=(this.seed^0xc10c)>>>0||1;
    const rnd=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};
    for(let x=0;x<w;x++) for(let y=0;y<h;y++){
      if(this.biomeMap[x]!=='jungle') continue;
      const t=this.tiles[y*w+x];
      if(t!==T.mud && t!==T.stone) continue;
      if(y<(this.heightMap[x]||0)+12) continue;
      if(rnd()>0.97) this.tiles[y*w+x]=T.chlorophyte_ore;
    }
  };
  // 世纪之花花苞：地下丛林刷一个（击败后再生）
  World.prototype.spawnPlanteraBulb=function(){
    if(this.planteraBulbs && this.planteraBulbs.length>=1) return false;
    const cands=[];
    for(let x=0;x<this.w;x++) for(let y=0;y<this.h;y++){
      if(this.biomeMap[x]!=='jungle') continue;
      if(this.tiles[y*this.w+x]===0 && this.isSolid(x,y+1)){
        if(y>(this.heightMap[x]||0)+10) cands.push({x,y});
      }
    }
    if(!cands.length) return false;
    const p=cands[Math.floor(Math.random()*cands.length)];
    this.tiles[p.y*this.w+p.x]=T.plantera_bulb;
    this.planteraBulbs=this.planteraBulbs||[];
    this.planteraBulbs.push(p);
    return true;
  };
  // 丛林神庙：蜥蜴砖封闭盒，内含祭坛
  World.prototype.spawnJungleTemple=function(){
    const jung=[];
    for(let x=4;x<this.w-4;x++) if(this.biomeMap[x]==='jungle') jung.push(x);
    if(!jung.length) { this.temple=null; return; }
    const cx=jung[Math.floor(jung.length*0.7)];
    const ty=(this.heightMap[cx]||40)+12;
    const tw=24, th=14;
    this.temple={x:cx-Math.floor(tw/2), y:ty, w:tw, h:th, locked:true};
    for(let dy=0;dy<th;dy++) for(let dx=0;dx<tw;dx++){
      const tx=cx-Math.floor(tw/2)+dx, tyy=ty+dy;
      if(tx<0||tx>=this.w||tyy<0||tyy>=this.h) continue;
      const wall=dx===0||dx===tw-1||dy===0||dy===th-1;
      if(wall) this.tiles[tyy*this.w+tx]=T.lihzahrd_brick;
      else { this.tiles[tyy*this.w+tx]=0; this.bg[tyy*this.w+tx]=5; }
      // 入口门洞（一侧中间）
      if(dx===0 && dy===Math.floor(th/2)) this.tiles[tyy*this.w+tx]=0;
    }
    // 祭坛放中央
    const ax=cx, ay=ty+Math.floor(th/2);
    this.tiles[ay*this.w+ax]=T.temple_altar;
  };
  World.prototype.spawnHardmodeOres=function(mul){
    mul=mul||1;
    const w=this.w,h=this.h;
    let s=(this.seed^(0x5a5a+((this.altarsBroken||0)*997)))>>>0||1;
    const rnd=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};
    // mul 越大生成越多（打碎祭坛后调用）
    const tAda=1-0.008*mul, tMy=1-0.018*mul, tCo=1-0.032*mul;
    let n=0;
    for(let x=0;x<w;x++) for(let y=0;y<h;y++){
      if(this.tiles[y*w+x]!==T.stone) continue;
      if(y<this.hellY-4 && y>(this.heightMap[x]||0)+12){
        const r=rnd();
        if(r>tAda){ this.tiles[y*w+x]=T.adamantite_ore; n++; }
        else if(r>tMy){ this.tiles[y*w+x]=T.mythril_ore; n++; }
        else if(r>tCo){ this.tiles[y*w+x]=T.cobalt_ore; n++; }
      }
    }
    return n;
  };
  World.prototype.spawnDemonAltars=function(){
    this.altars=this.altars||[];
    const w=this.w;
    // 腐化区地下放 3~5 座祭坛
    const corr=[];
    for(let x=4;x<w-4;x++) if(this.biomeMap[x]==='corruption') corr.push(x);
    if(!corr.length){ for(let x=20;x<w-20;x+=40) corr.push(x); }
    const count=3+Math.floor(Math.random()*3);
    for(let i=0;i<count;i++){
      const cx=corr[Math.floor(Math.random()*corr.length)];
      const gy=(this.heightMap[cx]||30)+8+Math.floor(Math.random()*20);
      // 找空位或石头上
      let y=gy;
      for(let k=0;k<12;k++){
        if(this.get(cx,y)===0 && this.isSolid(cx,y+1)) break;
        if(this.isSolid(cx,y)) { this.set(cx,y,0); break; }
        y++;
      }
      if(y>=this.h-2) continue;
      this.set(cx,y,T.demon_altar);
      this.altars.push({x:cx,y:y});
    }
  };
  World.prototype.spawnHallowStrip=function(){
    // 神圣 V 字条带（简化为一条地表条带）
    const w=this.w;
    const mid=Math.floor(w*(0.35+Math.random()*0.3));
    const half=Math.floor(w*0.08);
    for(let x=mid-half;x<=mid+half;x++){
      if(x<1||x>=w-1) continue;
      const gy=this.heightMap[x]||40;
      if(this.get(x,gy)===T.grass||this.get(x,gy)===T.corruption_grass||this.get(x,gy)===1)
        this.set(x,gy,T.hallowed_grass);
      for(let d=1;d<10;d++){
        if(this.get(x,gy+d)===T.stone) this.set(x,gy+d,T.pearlstone);
      }
    }
  };
  // 神锤打碎祭坛
  World.prototype.breakAltar=function(tx,ty){
    if(this.get(tx,ty)!==T.demon_altar) return false;
    this.set(tx,ty,0);
    this.altarsBroken=(this.altarsBroken||0)+1;
    const n=this.spawnHardmodeOres(1+this.altarsBroken*0.6);
    return {broken:this.altarsBroken, ores:n};
  };

  function randomChestLoot(rngFn){
    const loot={};
    const random=rngFn||Math.random;
    const pools=['i_iron_bar','i_copper_bar','i_torch','i_heart','i_star','i_mushroom','i_fallen_star','i_gem_topaz','i_gem_amethyst'];
    const n=2+Math.floor(random()*3);
    for(let i=0;i<n;i++){
      const k=pools[Math.floor(random()*pools.length)];
      loot[k]=(loot[k]||0)+1+Math.floor(random()*4);
    }
    return loot;
  }

  // 便捷：是否实体
  World.prototype.isSolid=function(x,y){
    const t=this.get(x,y);
    const d=TILES[t];
    return !!(d && d.solid);
  };
  World.prototype.get=function(x,y){ if(x<0||y<0||x>=this.w||y>=this.h) return 0; return this.tiles[y*this.w+x]; };
  World.prototype.getDef=function(t){ return TILES[t]||TILES[0]; };
  World.prototype.set=function(x,y,t){
    if(x<0||y<0||x>=this.w||y>=this.h) return;
    const i=y*this.w+x;
    if(this.tiles[i]===t) return;
    this.tiles[i]=t; this.damage[i]=0;
    this.modified.add(i);
  };
  // 存档用：玩家改动过的格子（[索引, tile 值]），读档后恢复
  World.prototype.diffChanges=function(){
    const out=[];
    for(const i of this.modified) out.push([i,this.tiles[i]]);
    return out;
  };
  World.prototype.applyChanges=function(list){
    if(!list||!list.length) return;
    for(let k=0;k<list.length;k++){
      const i=list[k][0], t=list[k][1];
      if(i>=0&&i<this.tiles.length){ this.tiles[i]=t; this.modified.add(i); }
    }
  };
  World.prototype.collide=function(px,py,pw,ph){
    const x0=Math.floor(px/TS), y0=Math.floor(py/TS);
    const x1=Math.floor((px+pw-1)/TS), y1=Math.floor((py+ph-1)/TS);
    let onGround=false;
    for(let ty=y0;ty<=y1;ty++) for(let tx=x0;tx<=x1;tx++){
      if(!this.isSolid(tx,ty)) continue;
      const by=ty*TS;
      if(py+ph>by && py+ph<by+TS*0.6+ph){ onGround=true; }
    }
    return {onGround};
  };

  window.World=World;
  window.TILE_DEFS=TILES;
  window.TILE_BY_NAME=BY_NAME;
})();
