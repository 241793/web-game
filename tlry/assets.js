/* ===== Terraria Web — 程序化像素素材生成器 =====
 * 不读取任何外部资源；所有 sprite 由 Canvas 现场绘制后缓存。
 * 输出 window.ASSETS = { sprites:{name:HTMLCanvasElement}, ts:16 (tile size) }
 */
(function(){
  const TS = 16;            // 一格 16x16 像素
  const SS = 16 * 3;        // 大 sprite 48x48 (玩家/怪物/NPC 暂用 48 便于表现)
  function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function ctx(c){const x=c.getContext('2d');x.imageSmoothingEnabled=false;return x;}
  // 简单噪声
  function rng(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296};}
  function px(x,c,r,g,b,a=255){x.fillStyle=`rgba(${r},${g},${b},${a/255})`;x.fillRect(c[0],c[1],1,1);}
  function fill(x,r,g,b,w,h){x.fillStyle=`rgb(${r},${g},${b})`;x.fillRect(0,0,w||x.canvas.width,h||x.canvas.height);}

  const sprites = {};

  // ---------- 地形方块 ----------
  function makeTile(name, base, speck, drawFn){
    const c=mk(TS,TS), x=ctx(c), r=rng(name.charCodeAt(0)*97+name.length*31+13);
    fill(x, ...base);
    // 主斑点
    for(let i=0;i<28;i++){
      const p=[Math.floor(r()*TS),Math.floor(r()*TS)];
      x.fillStyle=`rgba(${speck[0]},${speck[1]},${speck[2]},${0.5+r()*0.4})`;
      x.fillRect(p[0],p[1],1,1);
    }
    if(drawFn) drawFn(x,r);
    sprites[name]=c;
  }

  makeTile('grass',[110,170,70],[ 90,140,55],(x,r)=>{
    // 顶部高光草尖
    x.fillStyle='rgb(150,210,90)';
    for(let i=0;i<TS;i++) if(r()>.4) x.fillRect(i,0,1,1);
    x.fillStyle='rgb(70,120,40)';
    for(let i=0;i<TS;i++) if(r()>.7) x.fillRect(i,1,1,1);
  });
  makeTile('dirt',[120,80,50],[ 95,60,35]);
  makeTile('stone',[100,100,110],[80,80,90]);
  makeTile('wood',[140,90,45],[100,60,30],(x,r)=>{
    x.fillStyle='rgba(70,40,20,.5)';for(let i=0;i<3;i++){const y=Math.floor(r()*TS);x.fillRect(0,y,TS,1)}
  });
  makeTile('leaves',[60,140,60],[40,100,40]);
  makeTile('sand',[225,210,150],[200,180,120]);
  makeTile('plank',[170,120,60],[130,85,40],(x)=>{x.fillStyle='rgba(80,50,25,.5)';x.fillRect(0,5,TS,1);x.fillRect(0,11,TS,1)});
  makeTile('brick',[150,140,135],[110,100,95],(x)=>{x.fillStyle='rgba(80,75,72,.7)';x.fillRect(0,7,TS,1);x.fillRect(8,0,1,8);x.fillRect(0,15,8,1);x.fillRect(12,8,1,8)});
  makeTile('torch',[0,0,0,0],[0,0,0,0],(x)=>{
    // 透明底，画木杆 + 火焰
    x.clearRect(0,0,TS,TS);
    x.fillStyle='rgb(120,80,40)';x.fillRect(7,7,2,8);
    x.fillStyle='rgb(245,180,40)';x.fillRect(6,3,4,5);
    x.fillStyle='rgb(255,230,120)';x.fillRect(7,4,2,3);
  });
  makeTile('door',[0,0,0,0],[0,0,0,0],(x)=>{
    x.fillStyle='rgb(120,80,40)';x.fillRect(3,1,10,14);
    x.fillStyle='rgb(80,50,25)';x.fillRect(4,2,8,12);
    x.fillStyle='rgb(60,40,20)';x.fillRect(9,8,1,2); // 把手
  });
  makeTile('workbench',[0,0,0,0],[0,0,0,0],(x)=>{
    x.fillStyle='rgb(120,80,40)';x.fillRect(1,5,14,3);
    x.fillStyle='rgb(80,50,25)';x.fillRect(2,8,2,7);x.fillRect(12,8,2,7);
    x.fillStyle='rgb(160,110,55)';x.fillRect(0,4,16,2);
  });
  makeTile('platform',[0,0,0,0],[0,0,0,0],(x)=>{
    x.fillStyle='rgb(140,90,45)';x.fillRect(0,4,16,2);
    x.fillStyle='rgb(90,55,25)';x.fillRect(0,6,16,1);
  });
  makeTile('glass',[0,0,0,0],[0,0,0,0],(x)=>{
    x.fillStyle='rgba(180,220,240,.5)';x.fillRect(0,0,16,16);
    x.fillStyle='rgba(255,255,255,.6)';x.fillRect(2,2,4,1);x.fillRect(2,2,1,4);
    x.fillStyle='rgba(120,160,200,.5)';x.fillRect(0,0,16,1);x.fillRect(0,15,16,1);x.fillRect(0,0,1,16);x.fillRect(15,0,1,16);
  });
  makeTile('iron_ore',[100,100,110],[180,180,190],(x,r)=>{
    x.fillStyle='rgb(190,190,200)';
    for(let i=0;i<5;i++){const p=[Math.floor(r()*12)+2,Math.floor(r()*12)+2];x.fillRect(p[0],p[1],2,2)}
  });
  makeTile('gold_ore',[100,100,110],[230,200,80],(x,r)=>{
    x.fillStyle='rgb(255,215,80)';
    for(let i=0;i<5;i++){const p=[Math.floor(r()*12)+2,Math.floor(r()*12)+2];x.fillRect(p[0],p[1],2,2)}
  });
  makeTile('copper_ore',[100,100,110],[200,120,60],(x,r)=>{
    x.fillStyle='rgb(220,140,70)';
    for(let i=0;i<5;i++){const p=[Math.floor(r()*12)+2,Math.floor(r()*12)+2];x.fillRect(p[0],p[1],2,2)}
  });
  makeTile('coal',[100,100,110],[30,30,30],(x,r)=>{
    x.fillStyle='rgb(20,20,25)';
    for(let i=0;i<6;i++){const p=[Math.floor(r()*12)+2,Math.floor(r()*12)+2];x.fillRect(p[0],p[1],2,2)}
  });
  makeTile('silver_ore',[100,100,110],[220,220,230],(x,r)=>{
    x.fillStyle='rgb(240,240,245)';
    for(let i=0;i<5;i++){const p=[Math.floor(r()*12)+2,Math.floor(r()*12)+2];x.fillRect(p[0],p[1],2,2)}
  });
  makeTile('demonite_ore',[60,40,80],[120,80,160],(x,r)=>{
    x.fillStyle='rgb(150,100,200)';
    for(let i=0;i<6;i++){const p=[Math.floor(r()*12)+2,Math.floor(r()*12)+2];x.fillRect(p[0],p[1],2,2)}
  });
  makeTile('snow',[235,240,250],[210,220,235]);
  makeTile('ice',[180,210,235],[140,180,220],(x,r)=>{
    x.fillStyle='rgba(255,255,255,.6)';for(let i=0;i<6;i++){const p=[Math.floor(r()*12)+2,Math.floor(r()*12)+2];x.fillRect(p[0],p[1],1,1)}
  });
  makeTile('jungle_grass',[60,150,50],[40,110,30],(x,r)=>{
    x.fillStyle='rgb(110,200,80)';for(let i=0;i<TS;i++) if(r()>.4) x.fillRect(i,0,1,1);
    x.fillStyle='rgb(40,100,30)';for(let i=0;i<TS;i++) if(r()>.7) x.fillRect(i,1,1,1);
  });
  makeTile('mud',[90,70,50],[70,50,35]);
  makeTile('corruption_grass',[90,60,120],[120,80,160],(x,r)=>{
    x.fillStyle='rgb(150,90,200)';for(let i=0;i<TS;i++) if(r()>.4) x.fillRect(i,0,1,1);
  });
  makeTile('ebonstone',[50,40,60],[30,20,40]);
  makeTile('furnace',[80,70,60],[60,50,40],(x)=>{
    x.fillStyle='rgb(40,30,25)';x.fillRect(2,2,12,12);
    x.fillStyle='rgb(120,90,60)';x.fillRect(2,2,12,2);x.fillRect(2,12,12,2);
    x.fillStyle='rgb(220,80,30)';x.fillRect(5,6,6,5);
    x.fillStyle='rgb(255,180,40)';x.fillRect(6,7,4,3);
  });
  makeTile('anvil',[120,120,130],[80,80,90],(x)=>{
    x.fillStyle='rgb(140,140,150)';x.fillRect(2,4,12,3);
    x.fillStyle='rgb(80,80,90)';x.fillRect(2,7,3,5);x.fillRect(11,7,3,5);
    x.fillStyle='rgb(180,180,190)';x.fillRect(2,4,12,1);
  });
  makeTile('chest',[140,90,45],[100,60,30],(x)=>{
    x.fillStyle='rgb(160,110,55)';x.fillRect(2,4,12,10);
    x.fillStyle='rgb(100,60,30)';x.fillRect(2,4,12,2);x.fillRect(2,8,12,1);
    x.fillStyle='rgb(240,200,80)';x.fillRect(7,8,2,2);
  });
  makeTile('pot',[180,140,90],[140,100,60],(x)=>{
    x.fillStyle='rgb(180,140,90)';x.beginPath();x.arc(8,10,7,Math.PI,0);x.fill();
    x.fillStyle='rgb(120,80,50)';x.fillRect(4,3,8,2);
  });
  makeTile('shadow_orb',[60,40,90],[90,50,120],(x)=>{
    // 暗影宝珠：幽黑球体 + 紫色光晕 + 内发光
    x.fillStyle='rgba(120,80,180,.25)';x.beginPath();x.arc(8,8,7,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(30,20,45)';x.beginPath();x.arc(8,8,5,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(150,110,220)';x.fillRect(6,5,3,2);
    x.fillStyle='rgba(180,140,255,.6)';x.fillRect(5,8,2,2);
  });
  makeTile('hive',[180,140,50],[140,100,30],(x,r)=>{
    x.fillStyle='rgb(200,160,60)';for(let i=0;i<10;i++) if(r()>.4) x.fillRect(Math.floor(r()*TS),Math.floor(r()*TS),2,2);
    x.fillStyle='rgb(120,90,30)';x.fillRect(0,0,TS,1);x.fillRect(0,TS-1,TS,1);
  });
  makeTile('honey',[220,170,40],[255,200,60],(x)=>{
    x.fillStyle='rgba(255,200,40,.7)';x.fillRect(0,4,TS,12);
    x.fillStyle='rgba(255,230,120,.5)';x.fillRect(0,6,TS,3);
  });
  makeTile('larva',[240,220,80],[200,180,50],(x)=>{
    x.fillStyle='rgb(255,240,120)';x.beginPath();x.ellipse(8,9,6,5,0,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(80,60,20)';x.fillRect(5,7,2,2);x.fillRect(9,7,2,2);
    x.fillStyle='rgb(200,160,40)';x.fillRect(6,12,4,2);
  });
  makeTile('dungeon_brick',[70,70,100],[50,50,80],(x,r)=>{
    x.fillStyle='rgb(90,90,120)';x.fillRect(0,0,TS,TS);
    x.fillStyle='rgb(50,50,70)';
    x.fillRect(0,7,TS,1);x.fillRect(7,0,1,7);x.fillRect(7,8,1,8);
    for(let i=0;i<6;i++) if(r()>.5) x.fillRect(Math.floor(r()*TS),Math.floor(r()*TS),1,1);
  });
  makeTile('ash',[70,65,60],[50,45,40],(x,r)=>{
    for(let i=0;i<20;i++) if(r()>.4){x.fillStyle=r()>.5?'rgb(90,85,80)':'rgb(55,50,48)';x.fillRect(Math.floor(r()*TS),Math.floor(r()*TS),1,1);}
  });
  makeTile('hellstone',[90,40,30],[200,80,40],(x,r)=>{
    x.fillStyle='rgb(80,35,30)';x.fillRect(0,0,TS,TS);
    x.fillStyle='rgb(220,90,30)';for(let i=0;i<10;i++) if(r()>.45) x.fillRect(Math.floor(r()*TS),Math.floor(r()*TS),2,2);
    x.fillStyle='rgb(255,180,40)';for(let i=0;i<4;i++) if(r()>.6) x.fillRect(Math.floor(r()*TS),Math.floor(r()*TS),1,1);
  });
  makeTile('hellbrick',[100,50,40],[60,30,25],(x)=>{
    x.fillStyle='rgb(110,55,40)';x.fillRect(0,0,TS,TS);
    x.fillStyle='rgb(60,30,25)';x.fillRect(0,7,TS,1);x.fillRect(7,0,1,TS);
  });
  makeTile('cobalt_ore',[40,80,160],[80,140,220],(x,r)=>{
    x.fillStyle='rgb(50,70,100)';x.fillRect(0,0,TS,TS);
    x.fillStyle='rgb(60,140,230)';for(let i=0;i<8;i++) if(r()>.4) x.fillRect(Math.floor(r()*TS),Math.floor(r()*TS),2,2);
  });
  makeTile('mythril_ore',[40,120,90],[80,200,140],(x,r)=>{
    x.fillStyle='rgb(40,80,60)';x.fillRect(0,0,TS,TS);
    x.fillStyle='rgb(80,210,150)';for(let i=0;i<8;i++) if(r()>.4) x.fillRect(Math.floor(r()*TS),Math.floor(r()*TS),2,2);
  });
  makeTile('adamantite_ore',[140,40,60],[220,80,100],(x,r)=>{
    x.fillStyle='rgb(90,40,50)';x.fillRect(0,0,TS,TS);
    x.fillStyle='rgb(230,80,110)';for(let i=0;i<8;i++) if(r()>.4) x.fillRect(Math.floor(r()*TS),Math.floor(r()*TS),2,2);
  });
  makeTile('demon_altar',[80,40,100],[150,80,200],(x)=>{
    x.fillStyle='rgb(60,30,80)';x.fillRect(2,8,12,6);
    x.fillStyle='rgb(120,60,160)';x.fillRect(3,4,10,5);
    x.fillStyle='rgb(200,80,255)';x.fillRect(6,2,4,3);
    x.fillStyle='#000';x.fillRect(5,5,2,2);x.fillRect(9,5,2,2);
  });
  makeTile('pearlstone',[200,180,210],[240,220,250],(x,r)=>{
    x.fillStyle='rgb(210,190,220)';x.fillRect(0,0,TS,TS);
    x.fillStyle='rgb(255,240,255)';for(let i=0;i<8;i++) if(r()>.5) x.fillRect(Math.floor(r()*TS),Math.floor(r()*TS),2,1);
  });
  makeTile('hallowed_grass',[180,220,255],[255,180,220],(x,r)=>{
    x.fillStyle='rgb(120,200,120)';x.fillRect(0,0,TS,TS);
    x.fillStyle='rgb(255,160,220)';for(let i=0;i<TS;i++) if(r()>.45) x.fillRect(i,0,1,2);
    x.fillStyle='rgb(180,220,255)';for(let i=0;i<4;i++) if(r()>.5) x.fillRect(Math.floor(r()*TS),0,1,1);
  });
  makeTile('plantera_bulb',[220,120,180],[255,180,220],(x)=>{
    x.fillStyle='rgba(255,160,200,.5)';x.beginPath();x.arc(8,8,6,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(220,80,140)';x.fillRect(5,5,6,6);
    x.fillStyle='rgb(255,200,220)';x.fillRect(6,6,2,2);x.fillRect(9,9,1,1);
    x.fillStyle='rgb(120,200,80)';x.fillRect(7,2,2,3);
  });
  makeTile('lihzahrd_brick',[180,140,30],[120,90,15],(x)=>{
    x.fillStyle='rgb(200,160,40)';x.fillRect(0,0,TS,TS);
    x.fillStyle='rgb(140,100,20)';x.fillRect(0,7,TS,1);x.fillRect(7,0,1,TS);
  });
  makeTile('temple_altar',[160,120,30],[110,80,15],(x)=>{
    x.fillStyle='rgb(200,160,40)';x.fillRect(1,6,14,8);
    x.fillStyle='rgb(255,200,80)';x.fillRect(2,5,12,2);
    x.fillStyle='rgb(120,80,10)';x.fillRect(6,10,4,4);
  });
  makeTile('chlorophyte_ore',[60,140,40],[120,220,80],(x,r)=>{
    x.fillStyle='rgb(40,80,30)';x.fillRect(0,0,TS,TS);
    x.fillStyle='rgb(120,230,80)';for(let i=0;i<8;i++) if(r()>.4) x.fillRect(Math.floor(r()*TS),Math.floor(r()*TS),2,2);
    x.fillStyle='rgb(180,255,140)';for(let i=0;i<3;i++) if(r()>.6) x.fillRect(Math.floor(r()*TS),Math.floor(r()*TS),1,1);
  });
  makeTile('life_crystal',[200,40,80],[255,80,120],(x)=>{
    x.fillStyle='rgba(255,80,120,.85)';
    x.beginPath();
    x.moveTo(8,2);x.lineTo(14,8);x.lineTo(8,14);x.lineTo(2,8);x.closePath();x.fill();
    x.fillStyle='rgba(255,200,220,.9)';x.fillRect(5,5,3,2);
  });
  makeTile('mana_crystal',[60,120,220],[100,160,255],(x)=>{
    x.fillStyle='rgba(100,160,255,.9)';
    x.beginPath();
    x.moveTo(8,2);x.lineTo(14,8);x.lineTo(8,14);x.lineTo(2,8);x.closePath();x.fill();
    x.fillStyle='rgba(200,220,255,.9)';x.fillRect(5,5,3,2);
  });
  // 宝石（6 色）
  function gem(name,c1,c2){ makeTile(name,[100,100,110],c1,(x,r)=>{
    x.fillStyle=c2; for(let i=0;i<4;i++){const p=[Math.floor(r()*12)+2,Math.floor(r()*12)+2];x.fillRect(p[0],p[1],2,2)}
  });}
  gem('gem_amethyst',[180,80,220],[220,120,255]);
  gem('gem_topaz',[220,160,40],[255,200,80]);
  gem('gem_sapphire',[60,100,220],[100,160,255]);
  gem('gem_emerald',[40,180,80],[80,240,140]);
  gem('gem_ruby',[220,40,40],[255,80,80]);
  gem('gem_diamond',[220,230,240],[255,255,255]);
  makeTile('water',[40,80,160],[40,80,160]);
  makeTile('lava',[220,100,30],[255,160,40]);
  makeTile('cloud_block',[230,235,245],[255,255,255],(x,r)=>{
    x.fillStyle='rgba(255,255,255,.55)'; x.fillRect(2,4,12,8);
    x.fillStyle='rgba(200,210,230,.4)'; x.fillRect(1,6,4,4); x.fillRect(11,5,4,5);
  });

  // ---------- 道具 (16x16) ----------
  function item(name, fn){
    const c=mk(TS,TS),x=ctx(c);x.clearRect(0,0,TS,TS);fn(x);sprites[name]=c;
  }
  item('i_dirt',(x)=>{x.fillStyle='rgb(120,80,50)';x.fillRect(2,4,12,10);x.fillStyle='rgb(95,60,35)';x.fillRect(3,5,2,2);x.fillRect(10,9,2,2)});
  item('i_stone',(x)=>{x.fillStyle='rgb(110,110,120)';x.fillRect(3,4,10,9);x.fillStyle='rgb(80,80,90)';x.fillRect(5,6,3,3);x.fillRect(9,10,2,2)});
  item('i_wood',(x)=>{x.fillStyle='rgb(140,90,45)';x.fillRect(4,2,3,12);x.fillRect(9,2,3,12);x.fillStyle='rgb(90,55,25)';x.fillRect(4,7,8,1);x.fillRect(4,12,8,1)});
  item('i_plank',(x)=>{x.fillStyle='rgb(170,120,60)';x.fillRect(2,3,12,10);x.fillStyle='rgb(130,85,40)';x.fillRect(2,7,12,1);x.fillStyle='rgb(80,50,25)';x.fillRect(2,12,12,1)});
  item('i_brick',(x)=>{x.fillStyle='rgb(150,140,135)';x.fillRect(2,4,12,8);x.fillStyle='rgb(80,75,72)';x.fillRect(2,7,12,1);x.fillRect(7,4,1,3);x.fillRect(10,8,1,4)});
  item('i_torch',(x)=>{x.fillStyle='rgb(120,80,40)';x.fillRect(7,7,2,7);x.fillStyle='rgb(245,180,40)';x.fillRect(6,3,4,5);x.fillStyle='rgb(255,230,120)';x.fillRect(7,4,2,3)});
  item('i_glass',(x)=>{x.fillStyle='rgba(180,220,240,.7)';x.fillRect(3,3,10,10);x.fillStyle='#fff';x.fillRect(5,5,3,1);x.fillRect(5,5,1,3)});
  item('i_door',(x)=>{x.fillStyle='rgb(140,90,45)';x.fillRect(4,1,8,14);x.fillStyle='rgb(100,60,30)';x.fillRect(4,1,8,1);x.fillRect(4,14,8,1);x.fillStyle='rgb(220,180,80)';x.fillRect(10,8,1,2)});
  item('i_platform',(x)=>{x.fillStyle='rgb(160,110,55)';x.fillRect(1,6,14,3);x.fillStyle='rgb(110,70,35)';x.fillRect(1,8,14,1);x.fillStyle='rgb(200,150,80)';x.fillRect(1,6,14,1)});
  item('i_workbench',(x)=>{x.fillStyle='rgb(150,100,50)';x.fillRect(2,6,12,4);x.fillStyle='rgb(100,65,30)';x.fillRect(3,10,2,4);x.fillRect(11,10,2,4);x.fillStyle='rgb(180,130,70)';x.fillRect(2,6,12,1)});
  item('i_furnace',(x)=>{x.fillStyle='rgb(90,80,70)';x.fillRect(2,2,12,12);x.fillStyle='rgb(50,40,35)';x.fillRect(4,5,8,6);x.fillStyle='rgb(240,120,30)';x.fillRect(5,6,6,4);x.fillStyle='rgb(255,200,60)';x.fillRect(6,7,4,2)});
  item('i_anvil',(x)=>{x.fillStyle='rgb(140,140,150)';x.fillRect(2,5,12,3);x.fillStyle='rgb(90,90,100)';x.fillRect(4,8,3,5);x.fillRect(9,8,3,5);x.fillStyle='rgb(190,190,200)';x.fillRect(2,5,12,1)});
  item('i_chest',(x)=>{x.fillStyle='rgb(160,110,55)';x.fillRect(2,4,12,10);x.fillStyle='rgb(100,60,30)';x.fillRect(2,4,12,2);x.fillRect(2,8,12,1);x.fillStyle='rgb(240,200,80)';x.fillRect(7,8,2,2)});
  item('i_worm_food',(x)=>{x.fillStyle='rgb(140,100,60)';x.fillRect(3,5,10,7);x.fillStyle='rgb(100,70,40)';x.fillRect(3,10,10,2);x.fillStyle='rgb(80,160,80)';x.fillRect(5,6,2,2);x.fillRect(9,8,2,2)});
  item('i_demonite',(x)=>{x.fillStyle='rgb(120,80,180)';x.fillRect(3,5,10,6);x.fillStyle='rgb(80,50,120)';x.fillRect(3,9,10,2);x.fillStyle='rgb(180,140,230)';x.fillRect(4,5,2,1)});
  item('i_ironskin_potion',(x)=>{x.fillStyle='rgba(180,200,220,.8)';x.fillRect(5,2,6,11);x.fillStyle='rgb(160,160,180)';x.fillRect(5,6,6,6);x.fillStyle='rgb(220,220,230)';x.fillRect(6,7,2,3)});
  item('i_regen_potion',(x)=>{x.fillStyle='rgba(180,220,200,.8)';x.fillRect(5,2,6,11);x.fillStyle='rgb(80,200,120)';x.fillRect(5,6,6,6);x.fillStyle='rgb(180,255,200)';x.fillRect(6,7,2,3)});
  item('i_swiftness_potion',(x)=>{x.fillStyle='rgba(200,220,255,.8)';x.fillRect(5,2,6,11);x.fillStyle='rgb(80,160,240)';x.fillRect(5,6,6,6);x.fillStyle='rgb(180,220,255)';x.fillRect(6,7,2,3)});
  item('i_iron',(x)=>{x.fillStyle='rgb(190,190,200)';x.fillRect(4,4,8,8);x.fillStyle='rgb(140,140,150)';x.fillRect(6,6,4,4)});
  item('i_gold',(x)=>{x.fillStyle='rgb(255,215,80)';x.fillRect(4,4,8,8);x.fillStyle='rgb(200,160,40)';x.fillRect(6,6,4,4)});
  item('i_copper',(x)=>{x.fillStyle='rgb(220,140,70)';x.fillRect(4,4,8,8);x.fillStyle='rgb(170,90,40)';x.fillRect(6,6,4,4)});
  item('i_coal',(x)=>{x.fillStyle='rgb(30,30,35)';x.fillRect(4,4,8,8);x.fillStyle='rgb(60,60,70)';x.fillRect(6,6,3,3)});
  item('i_mushroom',(x)=>{x.fillStyle='rgb(220,200,180)';x.fillRect(5,4,6,4);x.fillStyle='rgb(180,80,80)';x.fillRect(4,3,8,2);x.fillStyle='rgb(240,240,230)';x.fillRect(6,7,4,4)});
  item('i_heart',(x)=>{x.fillStyle='rgb(220,60,60)';x.fillRect(5,4,6,2);x.fillRect(4,6,8,3);x.fillRect(5,9,6,2);x.fillRect(7,11,2,1);x.fillStyle='rgb(255,180,180)';x.fillRect(5,6,2,2)});
  item('i_star',(x)=>{x.fillStyle='rgb(220,180,40)';x.fillRect(7,3,2,2);x.fillRect(5,5,6,3);x.fillRect(3,8,10,2);x.fillRect(6,10,4,2);x.fillRect(7,12,2,1);x.fillStyle='rgb(255,240,150)';x.fillRect(7,5,2,2)});
  // 工具 / 武器
  item('i_pick_wood',(x)=>{ // 木镐
    x.fillStyle='rgb(120,80,40)';x.fillRect(7,8,2,7);
    x.fillStyle='rgb(160,110,55)';x.fillRect(4,3,8,2);x.fillRect(5,5,6,1);x.fillRect(6,6,4,1);
  });
  item('i_pick_iron',(x)=>{
    x.fillStyle='rgb(80,60,40)';x.fillRect(7,8,2,7);
    x.fillStyle='rgb(190,190,200)';x.fillRect(3,3,10,2);x.fillRect(4,5,8,1);x.fillRect(5,6,6,1);
  });
  item('i_sword_wood',(x)=>{
    x.fillStyle='rgb(140,90,45)';x.fillRect(6,2,4,9);x.fillStyle='rgb(100,60,30)';x.fillRect(7,3,2,7);
    x.fillStyle='rgb(120,80,40)';x.fillRect(5,11,6,2);x.fillStyle='rgb(160,110,55)';x.fillRect(6,12,4,2);
  });
  item('i_sword_iron',(x)=>{
    x.fillStyle='rgb(200,200,210)';x.fillRect(6,1,4,10);x.fillStyle='rgb(150,150,160)';x.fillRect(7,2,2,8);
    x.fillStyle='rgb(120,80,40)';x.fillRect(5,11,6,2);x.fillStyle='rgb(160,110,55)';x.fillRect(6,12,4,2);
  });
  item('i_axe_wood',(x)=>{
    x.fillStyle='rgb(120,80,40)';x.fillRect(8,7,2,8);
    x.fillStyle='rgb(160,110,55)';x.fillRect(4,2,4,3);x.fillRect(4,5,2,3);x.fillRect(10,2,2,6);
  });
  item('i_bow',(x)=>{
    x.fillStyle='rgb(140,90,45)';x.fillRect(3,2,1,12);x.fillRect(4,3,1,10);x.fillRect(11,2,1,12);x.fillRect(10,3,1,10);
    x.fillStyle='rgb(255,255,255)';x.fillRect(7,3,1,10);
  });
  item('i_arrow',(x)=>{
    x.fillStyle='rgb(140,90,45)';x.fillRect(2,7,10,1);
    x.fillStyle='rgb(220,220,220)';x.fillRect(12,7,2,1);
    x.fillStyle='rgb(80,80,80)';x.fillRect(1,6,2,3);
  });
  // 矿石
  item('i_copper_ore',(x)=>{x.fillStyle='rgb(120,80,50)';x.fillRect(3,4,10,9);x.fillStyle='rgb(220,140,70)';x.fillRect(5,6,3,3);x.fillRect(9,10,2,2)});
  item('i_iron_ore',(x)=>{x.fillStyle='rgb(120,110,120)';x.fillRect(3,4,10,9);x.fillStyle='rgb(190,190,200)';x.fillRect(5,6,3,3);x.fillRect(9,10,2,2)});
  item('i_silver_ore',(x)=>{x.fillStyle='rgb(140,140,150)';x.fillRect(3,4,10,9);x.fillStyle='rgb(240,240,245)';x.fillRect(5,6,3,3)});
  item('i_gold_ore',(x)=>{x.fillStyle='rgb(140,130,90)';x.fillRect(3,4,10,9);x.fillStyle='rgb(255,215,80)';x.fillRect(5,6,3,3)});
  item('i_coal_ore',(x)=>{x.fillStyle='rgb(80,80,90)';x.fillRect(3,4,10,9);x.fillStyle='rgb(20,20,25)';x.fillRect(5,6,3,3);x.fillRect(9,10,2,2)});
  item('i_demonite_ore',(x)=>{x.fillStyle='rgb(80,60,100)';x.fillRect(3,4,10,9);x.fillStyle='rgb(150,100,200)';x.fillRect(5,6,3,3);x.fillRect(9,10,2,2)});
  // 锭（别名）
  item('i_silver',(x)=>{x.fillStyle='rgb(200,200,210)';x.fillRect(3,5,10,6);x.fillStyle='rgb(150,150,160)';x.fillRect(3,9,10,2);x.fillStyle='rgb(245,245,250)';x.fillRect(4,5,2,1)});
  item('i_iron_bar',(x)=>{x.fillStyle='rgb(190,190,200)';x.fillRect(3,5,10,6);x.fillStyle='rgb(140,140,150)';x.fillRect(3,9,10,2);x.fillStyle='rgb(230,230,240)';x.fillRect(4,5,2,1)});
  item('i_copper_bar',(x)=>{x.fillStyle='rgb(220,140,70)';x.fillRect(3,5,10,6);x.fillStyle='rgb(170,90,40)';x.fillRect(3,9,10,2);x.fillStyle='rgb(255,180,100)';x.fillRect(4,5,2,1)});
  item('i_silver_bar',(x)=>{x.fillStyle='rgb(220,220,230)';x.fillRect(3,5,10,6);x.fillStyle='rgb(170,170,180)';x.fillRect(3,9,10,2);x.fillStyle='rgb(255,255,255)';x.fillRect(4,5,2,1)});
  item('i_gold_bar',(x)=>{x.fillStyle='rgb(255,215,80)';x.fillRect(3,5,10,6);x.fillStyle='rgb(200,160,40)';x.fillRect(3,9,10,2);x.fillStyle='rgb(255,240,140)';x.fillRect(4,5,2,1)});
  item('i_demonite_bar',(x)=>{x.fillStyle='rgb(120,80,180)';x.fillRect(3,5,10,6);x.fillStyle='rgb(80,50,120)';x.fillRect(3,9,10,2);x.fillStyle='rgb(180,140,230)';x.fillRect(4,5,2,1)});
  item('i_iron',(x)=>{x.fillStyle='rgb(190,190,200)';x.fillRect(4,4,8,8);x.fillStyle='rgb(140,140,150)';x.fillRect(6,6,4,4)}); // 旧别名
  item('i_gold',(x)=>{x.fillStyle='rgb(255,215,80)';x.fillRect(4,4,8,8);x.fillStyle='rgb(200,160,40)';x.fillRect(6,6,4,4)});
  item('i_copper',(x)=>{x.fillStyle='rgb(220,140,70)';x.fillRect(4,4,8,8);x.fillStyle='rgb(170,90,40)';x.fillRect(6,6,4,4)});
  item('i_coal',(x)=>{x.fillStyle='rgb(30,30,35)';x.fillRect(4,4,8,8);x.fillStyle='rgb(60,60,70)';x.fillRect(6,6,3,3)});
  // 生物群落材料
  item('i_sand',(x)=>{x.fillStyle='rgb(225,210,150)';x.fillRect(2,3,12,10);x.fillStyle='rgb(200,180,120)';x.fillRect(2,11,12,2)});
  item('i_snow',(x)=>{x.fillStyle='rgb(240,245,255)';x.fillRect(2,3,12,10);x.fillStyle='rgb(210,220,235)';x.fillRect(2,11,12,2)});
  item('i_ice',(x)=>{x.fillStyle='rgba(180,210,235,.9)';x.fillRect(2,3,12,10);x.fillStyle='rgba(255,255,255,.6)';x.fillRect(4,5,3,2);x.fillRect(8,8,3,2)});
  item('i_mud',(x)=>{x.fillStyle='rgb(90,70,50)';x.fillRect(2,3,12,10);x.fillStyle='rgb(70,50,35)';x.fillRect(2,11,12,2)});
  item('i_jungle_spore',(x)=>{x.fillStyle='rgb(80,200,80)';x.beginPath();x.arc(8,8,4,0,Math.PI*2);x.fill();x.fillStyle='rgb(220,255,180)';x.fillRect(6,6,2,2)});
  item('i_glass_bottle',(x)=>{x.fillStyle='rgba(180,220,240,.7)';x.fillRect(5,2,6,12);x.fillStyle='rgba(160,200,220,.7)';x.fillRect(4,2,8,2);x.fillStyle='rgba(255,255,255,.5)';x.fillRect(6,4,1,8)});
  // 宝石物品
  function gemItem(name,c){ item(name,(x)=>{x.fillStyle=c;x.beginPath();x.moveTo(8,2);x.lineTo(13,8);x.lineTo(8,14);x.lineTo(3,8);x.closePath();x.fill();x.fillStyle='rgba(255,255,255,.7)';x.fillRect(5,5,2,2)}); }
  gemItem('i_gem_amethyst','#c060e0'); gemItem('i_gem_topaz','#e8b830');
  gemItem('i_gem_sapphire','#4080e8'); gemItem('i_gem_emerald','#50c870');
  gemItem('i_gem_ruby','#e84040'); gemItem('i_gem_diamond','#e0e8f0');
  // 水晶
  item('i_life_crystal',(x)=>{x.fillStyle='rgba(255,80,120,.9)';x.beginPath();x.moveTo(8,2);x.lineTo(14,8);x.lineTo(8,14);x.lineTo(2,8);x.closePath();x.fill();x.fillStyle='rgba(255,200,220,.9)';x.fillRect(5,5,3,2)});
  item('i_mana_crystal',(x)=>{x.fillStyle='rgba(100,160,255,.9)';x.beginPath();x.moveTo(8,2);x.lineTo(14,8);x.lineTo(8,14);x.lineTo(2,8);x.closePath();x.fill();x.fillStyle='rgba(200,220,255,.9)';x.fillRect(5,5,3,2)});
  item('i_fallen_star',(x)=>{x.fillStyle='rgb(255,220,80)';x.fillRect(7,2,2,2);x.fillRect(5,4,6,3);x.fillRect(3,7,10,2);x.fillRect(6,9,4,2);x.fillRect(7,11,2,1);x.fillStyle='#fff';x.fillRect(7,4,2,2)});
  // 药水（瓶子+液）
  function potion(name,liquid){
    item(name,(x)=>{
      x.fillStyle='rgb(180,180,200)';x.fillRect(5,2,6,2);           // 瓶口
      x.fillStyle='rgba(220,240,250,.6)';x.fillRect(4,4,8,9);       // 瓶身
      x.fillStyle=liquid;x.fillRect(5,7,6,5);
      x.fillStyle='rgba(255,255,255,.5)';x.fillRect(5,5,2,3);
    });
  }
  potion('i_ironskin_potion','#a8a8b8');
  potion('i_regen_potion','#e88080');
  potion('i_swiftness_potion','#80e880');
  // 工具扩展
  item('i_pick_copper',(x)=>{x.fillStyle='rgb(100,60,30)';x.fillRect(7,8,2,7);x.fillStyle='rgb(220,140,70)';x.fillRect(3,3,10,2);x.fillRect(4,5,8,1);x.fillRect(5,6,6,1)});
  item('i_pick_silver',(x)=>{x.fillStyle='rgb(80,50,25)';x.fillRect(7,8,2,7);x.fillStyle='rgb(220,220,230)';x.fillRect(3,3,10,2);x.fillRect(4,5,8,1);x.fillRect(5,6,6,1)});
  item('i_pick_gold',(x)=>{x.fillStyle='rgb(80,50,25)';x.fillRect(7,8,2,7);x.fillStyle='rgb(255,215,80)';x.fillRect(3,3,10,2);x.fillRect(4,5,8,1);x.fillRect(5,6,6,1)});
  item('i_pick_demonite',(x)=>{x.fillStyle='rgb(60,40,80)';x.fillRect(7,8,2,7);x.fillStyle='rgb(150,100,200)';x.fillRect(2,3,12,2);x.fillRect(3,5,10,1);x.fillRect(4,6,8,1)});
  item('i_axe_copper',(x)=>{x.fillStyle='rgb(100,60,30)';x.fillRect(8,7,2,8);x.fillStyle='rgb(220,140,70)';x.fillRect(4,2,4,3);x.fillRect(4,5,2,3);x.fillRect(10,2,2,6)});
  item('i_axe_iron',(x)=>{x.fillStyle='rgb(80,50,25)';x.fillRect(8,7,2,8);x.fillStyle='rgb(200,200,210)';x.fillRect(4,2,4,3);x.fillRect(4,5,2,3);x.fillRect(10,2,2,6)});
  item('i_axe_gold',(x)=>{x.fillStyle='rgb(80,50,25)';x.fillRect(8,7,2,8);x.fillStyle='rgb(255,215,80)';x.fillRect(4,2,4,3);x.fillRect(4,5,2,3);x.fillRect(10,2,2,6)});
  item('i_sword_copper',(x)=>{x.fillStyle='rgb(220,140,70)';x.fillRect(6,2,4,9);x.fillStyle='rgb(170,90,40)';x.fillRect(7,3,2,7);x.fillStyle='rgb(100,60,30)';x.fillRect(5,11,6,2);x.fillStyle='rgb(160,110,55)';x.fillRect(6,12,4,2)});
  item('i_sword_silver',(x)=>{x.fillStyle='rgb(220,220,230)';x.fillRect(6,2,4,9);x.fillStyle='rgb(170,170,180)';x.fillRect(7,3,2,7);x.fillStyle='rgb(100,60,30)';x.fillRect(5,11,6,2);x.fillStyle='rgb(160,110,55)';x.fillRect(6,12,4,2)});
  item('i_sword_gold',(x)=>{x.fillStyle='rgb(255,215,80)';x.fillRect(6,2,4,9);x.fillStyle='rgb(200,160,40)';x.fillRect(7,3,2,7);x.fillStyle='rgb(100,60,30)';x.fillRect(5,11,6,2);x.fillStyle='rgb(160,110,55)';x.fillRect(6,12,4,2)});
  item('i_sword_demonite',(x)=>{x.fillStyle='rgb(150,100,200)';x.fillRect(6,1,4,10);x.fillStyle='rgb(100,60,150)';x.fillRect(7,2,2,8);x.fillStyle='rgb(60,40,80)';x.fillRect(5,11,6,2);x.fillStyle='rgb(120,80,160)';x.fillRect(6,12,4,2)});
  // 穿戴贴图（覆盖玩家 32x32 对应区域）
  function wornPiece(name,c1,c2,slot){
    const wc=mk(32,32),wx=ctx(wc);
    if(slot==='head'){
      wx.fillStyle=c1;wx.fillRect(10,2,12,11);
      wx.fillStyle=c2;wx.fillRect(10,2,12,2);wx.fillRect(9,11,14,2);
      wx.fillStyle='rgba(0,0,0,.3)';wx.fillRect(14,6,1,2);wx.fillRect(17,6,1,2);
      wx.fillStyle='rgba(255,255,255,.18)';wx.fillRect(11,4,8,1);
    } else if(slot==='body'){
      wx.fillStyle=c1;wx.fillRect(9,11,14,9);
      wx.fillRect(7,13,2,5);wx.fillRect(23,13,2,5);
      wx.fillStyle=c2;wx.fillRect(9,19,14,1);
      wx.fillStyle='rgba(255,255,255,.22)';wx.fillRect(14,12,2,7);
    } else {
      wx.fillStyle=c1;wx.fillRect(10,19,5,10);wx.fillRect(17,19,5,10);
      wx.fillStyle=c2;wx.fillRect(10,28,6,2);wx.fillRect(17,28,6,2);
      wx.fillStyle='rgba(0,0,0,.2)';wx.fillRect(12,20,2,6);wx.fillRect(18,20,2,6);
    }
    sprites['worn_'+name]=wc;
  }
  // 盔甲：头盔/胸甲/护腿 三色三套；同时生成穿戴贴图
  function armor(name,c1,c2,slot){
    item(name,(x)=>{
      if(slot==='head'){
        x.fillStyle=c1;x.fillRect(4,3,8,8);x.fillStyle=c2;x.fillRect(4,10,8,2);
        x.fillStyle='#000';x.fillRect(6,6,1,1);x.fillRect(9,6,1,1);
      } else if(slot==='body'){
        x.fillStyle=c1;x.fillRect(3,3,10,10);x.fillStyle=c2;x.fillRect(3,12,10,1);
        x.fillStyle='rgba(255,255,255,.3)';x.fillRect(7,3,2,9);
      } else {
        x.fillStyle=c1;x.fillRect(3,3,10,7);x.fillStyle=c2;x.fillRect(3,10,10,1);
        x.fillStyle='#3a2a1a';x.fillRect(3,3,4,6);x.fillRect(9,3,4,6);
      }
    });
    wornPiece(name,c1,c2,slot);
  }
  armor('i_helm_wood','#b88040','#7a5020','head'); armor('i_chest_wood','#b88040','#7a5020','body'); armor('i_legs_wood','#b88040','#7a5020','legs');
  armor('i_helm_copper','#c87840','#8a5020','head'); armor('i_chest_copper','#c87840','#8a5020','body'); armor('i_legs_copper','#c87840','#8a5020','legs');
  armor('i_helm_iron','#c8c8d0','#9090a0','head'); armor('i_chest_iron','#c8c8d0','#9090a0','body'); armor('i_legs_iron','#c8c8d0','#9090a0','legs');
  armor('i_helm_silver','#d8d8e0','#a0a0b0','head'); armor('i_chest_silver','#d8d8e0','#a0a0b0','body'); armor('i_legs_silver','#d8d8e0','#a0a0b0','legs');
  armor('i_helm_gold','#e8c850','#a88820','head'); armor('i_chest_gold','#e8c850','#a88820','body'); armor('i_legs_gold','#e8c850','#a88820','legs');
  armor('i_helm_shadow','#9060d0','#503080','head'); armor('i_chest_shadow','#9060d0','#503080','body'); armor('i_legs_shadow','#9060d0','#503080','legs');
  // 饰品
  item('i_acc_cloud',(x)=>{x.fillStyle='rgba(220,240,255,.8)';x.beginPath();x.arc(8,9,5,0,Math.PI*2);x.fill();x.fillStyle='rgba(255,255,255,.9)';x.fillRect(5,7,3,2)});
  item('i_acc_hermes',(x)=>{x.fillStyle='rgb(180,140,80)';x.fillRect(2,6,12,5);x.fillStyle='rgb(220,200,140)';x.fillRect(2,4,12,3);x.fillStyle='rgb(255,240,180)';x.fillRect(4,4,4,2)});
  item('i_acc_shield',(x)=>{x.fillStyle='rgb(180,180,200)';x.fillRect(4,2,8,12);x.fillStyle='rgb(120,120,160)';x.fillRect(4,11,8,2);x.fillStyle='rgb(240,240,255)';x.fillRect(6,4,4,4)});
  // 召唤物
  item('i_boss_summon_eoc',(x)=>{x.fillStyle='rgb(120,40,40)';x.beginPath();x.arc(8,8,6,0,Math.PI*2);x.fill();x.fillStyle='rgb(220,200,200)';x.fillRect(5,6,2,2);x.fillRect(9,6,2,2);x.fillStyle='#000';x.fillRect(5,6,1,1);x.fillRect(9,6,1,1)});
  item('i_suspicious_eye',(x)=>{x.fillStyle='rgb(120,40,40)';x.beginPath();x.arc(8,8,5,0,Math.PI*2);x.fill();x.fillStyle='rgb(220,200,200)';x.fillRect(6,6,4,3);x.fillStyle='#000';x.fillRect(7,7,2,1)});
  item('i_lens',(x)=>{x.fillStyle='rgb(220,220,200)';x.beginPath();x.arc(8,8,5,0,Math.PI*2);x.fill();x.fillStyle='#000';x.fillRect(6,7,4,2);x.fillStyle='rgb(120,120,100)';x.fillRect(4,3,8,1);x.fillRect(4,12,8,1)});
  item('i_rotten_chunk',(x)=>{x.fillStyle='rgb(120,140,80)';x.fillRect(3,6,10,4);x.fillStyle='rgb(80,100,50)';x.fillRect(3,8,10,2);x.fillStyle='rgb(160,180,100)';x.fillRect(4,6,2,1)});
  item('i_demonite_scale',(x)=>{x.fillStyle='rgb(150,100,200)';x.beginPath();x.moveTo(8,2);x.lineTo(13,12);x.lineTo(8,10);x.lineTo(3,12);x.closePath();x.fill();x.fillStyle='rgb(200,160,240)';x.fillRect(6,5,4,3)});
  item('i_ebonstone',(x)=>{x.fillStyle='rgb(50,40,60)';x.fillRect(3,4,10,9);x.fillStyle='rgb(30,20,40)';x.fillRect(5,6,3,3);x.fillRect(9,10,2,2)});
  item('i_corruption',(x)=>{x.fillStyle='rgb(90,60,120)';x.fillRect(2,4,12,8);x.fillStyle='rgb(60,40,80)';x.fillRect(2,10,12,2);x.fillStyle='rgb(150,90,200)';x.fillRect(4,5,2,2);x.fillRect(10,7,2,2)});
  item('i_jungle_rose',(x)=>{x.fillStyle='rgb(220,60,60)';x.beginPath();x.arc(8,8,4,0,Math.PI*2);x.fill();x.fillStyle='rgb(255,180,180)';x.fillRect(6,6,4,1);x.fillStyle='rgb(80,200,80)';x.fillRect(8,11,2,3)});
  item('i_stinger',(x)=>{x.fillStyle='rgb(220,220,200)';x.beginPath();x.moveTo(8,2);x.lineTo(12,12);x.lineTo(8,10);x.lineTo(4,12);x.closePath();x.fill();x.fillStyle='rgb(180,180,160)';x.fillRect(7,5,2,4)});
  item('i_vine',(x)=>{x.fillStyle='rgb(60,140,60)';x.fillRect(7,2,2,12);x.fillStyle='rgb(40,100,40)';x.fillRect(5,5,2,1);x.fillRect(9,9,2,1);x.fillRect(5,11,2,1)});
  // 金币
  item('i_copper_coin',(x)=>{x.fillStyle='rgb(200,120,60)';x.beginPath();x.arc(8,8,5,0,Math.PI*2);x.fill();x.fillStyle='rgb(255,200,120)';x.beginPath();x.arc(7,7,2,0,Math.PI*2);x.fill()});
  item('i_silver_coin',(x)=>{x.fillStyle='rgb(200,200,210)';x.beginPath();x.arc(8,8,5,0,Math.PI*2);x.fill();x.fillStyle='rgb(255,255,255)';x.beginPath();x.arc(7,7,2,0,Math.PI*2);x.fill()});
  item('i_gold_coin',(x)=>{x.fillStyle='rgb(240,200,80)';x.beginPath();x.arc(8,8,5,0,Math.PI*2);x.fill();x.fillStyle='rgb(255,240,160)';x.beginPath();x.arc(7,7,2,0,Math.PI*2);x.fill()});
  item('i_platinum_coin',(x)=>{x.fillStyle='rgb(220,220,240)';x.beginPath();x.arc(8,8,5,0,Math.PI*2);x.fill();x.fillStyle='rgb(255,255,255)';x.beginPath();x.arc(7,7,2,0,Math.PI*2);x.fill()});

  // ---------- 32x32 角色/怪物 ----------
  function charSprite(name, fn, scale=2){
    const base=mk(16,16), x=ctx(base); fn(x);
    const big=mk(16*scale,16*scale), bx=ctx(big);
    bx.drawImage(base,0,0,16*scale,16*scale);
    sprites[name]=big;
    return big;
  }
  // 玩家（致敬版中性造型）
  function playerFrame(facingRight, walkPhase){
    const c=mk(32,32),x=ctx(c);const F=facingRight;
    x.save();if(!F){x.translate(32,0);x.scale(-1,1);}
    // 头
    x.fillStyle='rgb(235,200,170)';x.fillRect(11,4,10,8);
    x.fillStyle='rgb(180,140,100)';x.fillRect(11,11,10,1);
    // 头发
    x.fillStyle='rgb(120,80,40)';x.fillRect(10,3,12,3);x.fillRect(10,6,2,2);
    // 眼
    x.fillStyle='rgb(40,40,60)';x.fillRect(15,8,2,2);
    // 衣服（蓝绿）
    x.fillStyle='rgb(80,140,180)';x.fillRect(10,12,12,8);
    x.fillStyle='rgb(60,110,150)';x.fillRect(10,19,12,1);
    // 手臂
    x.fillStyle='rgb(235,200,170)';x.fillRect(8,13,2,5);x.fillRect(22,13,2,5);
    // 腿（行走相位）
    const off = walkPhase===1?2:walkPhase===3?-2:0;
    x.fillStyle='rgb(60,80,140)'; // 裤
    x.fillRect(11,20,4,8+off); x.fillRect(17,20,4,8-off);
    x.fillStyle='rgb(60,40,20)'; // 鞋
    x.fillRect(11,28+off,5,2); x.fillRect(17,28-off,5,2);
    x.restore();
    return c;
  }
  sprites.player_idle_l = playerFrame(false,0);
  sprites.player_idle_r = playerFrame(true,0);
  sprites.player_walk1_l = playerFrame(false,1);
  sprites.player_walk1_r = playerFrame(true,1);
  sprites.player_walk2_l = playerFrame(false,2);
  sprites.player_walk2_r = playerFrame(true,2);
  sprites.player_walk3_l = playerFrame(false,3);
  sprites.player_walk3_r = playerFrame(true,3);

  // 星尘之翼（装备后显示；向右展开的单翼，绘制时左右镜像）
  sprites.wing = (()=>{const c=mk(40,40),x=ctx(c);
    x.fillStyle='rgba(110,180,255,.92)';
    x.beginPath(); x.moveTo(6,22); x.quadraticCurveTo(20,2,38,10); x.quadraticCurveTo(24,16,36,34); x.quadraticCurveTo(16,26,6,22); x.closePath(); x.fill();
    x.fillStyle='rgba(210,240,255,.95)'; x.fillRect(10,8,8,6);
    x.fillStyle='rgba(80,140,220,.9)'; x.fillRect(6,20,4,12);
    x.fillStyle='rgba(60,110,200,.8)'; x.fillRect(16,6,3,22);
    return c;})();

  // 史莱姆（绿）
  function slimeFrame(squash){
    const c=mk(32,24),x=ctx(c);
    const w = 18 + squash*4, h = 14 - squash*4, ox = (32-w)/2, oy = 24-h-2;
    x.fillStyle='rgba(120,220,140,.85)';
    // 身体
    x.beginPath();
    x.moveTo(ox, 24-2);
    x.lineTo(ox, oy+h*0.6);
    x.quadraticCurveTo(ox+w*0.5, oy-h*0.2, ox+w, oy+h*0.6);
    x.lineTo(ox+w, 24-2);
    x.closePath();x.fill();
    // 高光
    x.fillStyle='rgba(220,255,220,.6)';
    x.fillRect(ox+3, oy+2, 4, 3);
    // 眼
    x.fillStyle='#000';x.fillRect(ox+w*0.35, oy+h*0.5, 2,2);x.fillRect(ox+w*0.55, oy+h*0.5, 2,2);
    // 嘴
    x.fillStyle='#400';x.fillRect(ox+w*0.42, oy+h*0.7, w*0.16, 1);
    return c;
  }
  sprites.slime1 = slimeFrame(0);
  sprites.slime2 = slimeFrame(1);

  // 僵尸
  function zombieFrame(walkPhase){
    const c=mk(32,32),x=ctx(c);
    // 头
    x.fillStyle='rgb(110,150,110)';x.fillRect(11,4,10,8);
    x.fillStyle='rgb(70,100,70)';x.fillRect(11,11,10,1);
    // 眼红
    x.fillStyle='rgb(200,40,40)';x.fillRect(13,7,2,2);x.fillRect(18,7,2,2);
    // 衣服破
    x.fillStyle='rgb(70,70,90)';x.fillRect(10,12,12,8);
    x.fillStyle='rgb(40,40,50)';x.fillRect(14,15,4,3);
    // 手臂前伸
    x.fillStyle='rgb(110,150,110)';x.fillRect(22,13,3,5);x.fillRect(8,13,2,5);
    const off=walkPhase===1?2:walkPhase===3?-2:0;
    x.fillStyle='rgb(70,90,50)';
    x.fillRect(11,20,4,8+off);x.fillRect(17,20,4,8-off);
    x.fillStyle='rgb(40,30,20)';
    x.fillRect(11,28+off,5,2);x.fillRect(17,28-off,5,2);
    return c;
  }
  sprites.zombie1 = zombieFrame(0);
  sprites.zombie2 = zombieFrame(1);
  sprites.zombie3 = zombieFrame(2);

  // 向导 NPC
  function guideFrame(){
    const c=mk(32,32),x=ctx(c);
    // 头
    x.fillStyle='rgb(235,200,170)';x.fillRect(11,4,10,8);
    // 棕发
    x.fillStyle='rgb(100,60,30)';x.fillRect(10,3,12,3);x.fillRect(10,6,2,2);
    // 眼
    x.fillStyle='#000';x.fillRect(14,8,2,2);x.fillRect(18,8,2,2);
    // 蓝衣
    x.fillStyle='rgb(80,120,200)';x.fillRect(10,12,12,8);
    x.fillStyle='rgb(50,90,160)';x.fillRect(10,19,12,1);
    // 手臂
    x.fillStyle='rgb(235,200,170)';x.fillRect(8,13,2,5);x.fillRect(22,13,2,5);
    // 裤 + 鞋
    x.fillStyle='rgb(120,100,70)';x.fillRect(11,20,4,8);x.fillRect(17,20,4,8);
    x.fillStyle='rgb(60,40,20)';x.fillRect(11,28,5,2);x.fillRect(17,28,5,2);
    return c;
  }
  sprites.guide = guideFrame();

  // 商人 NPC（蓝衣 + 棕色围裙 + 金币袋）
  function merchantFrame(){
    const c=mk(32,32),x=ctx(c);
    // 头
    x.fillStyle='rgb(235,200,170)';x.fillRect(11,4,10,8);
    // 棕发
    x.fillStyle='rgb(160,110,60)';x.fillRect(10,3,12,3);x.fillRect(10,6,2,2);
    // 眼
    x.fillStyle='#000';x.fillRect(14,8,2,2);x.fillRect(18,8,2,2);
    // 白衬衣
    x.fillStyle='rgb(220,220,220)';x.fillRect(10,12,12,3);
    // 棕色围裙
    x.fillStyle='rgb(130,85,45)';x.fillRect(10,15,12,7);
    x.fillStyle='rgb(90,60,30)';x.fillRect(10,15,12,1);
    // 围裙带
    x.fillStyle='rgb(160,110,60)';x.fillRect(10,12,1,3);x.fillRect(21,12,1,3);
    // 腰间金币袋
    x.fillStyle='rgb(180,150,90)';x.fillRect(18,18,4,4);
    x.fillStyle='rgb(220,180,60)';x.fillRect(19,19,2,2);
    // 手臂
    x.fillStyle='rgb(235,200,170)';x.fillRect(8,13,2,5);x.fillRect(22,13,2,5);
    // 裤 + 鞋
    x.fillStyle='rgb(80,70,60)';x.fillRect(11,22,4,6);x.fillRect(17,22,4,6);
    x.fillStyle='rgb(40,30,20)';x.fillRect(11,28,5,2);x.fillRect(17,28,5,2);
    return c;
  }
  sprites.merchant = merchantFrame();

  // 护士 NPC（白衣 + 红色十字标识，32x32）
  function nurseFrame(){
    const c=mk(32,32),x=ctx(c);
    // 头
    x.fillStyle='rgb(240,210,180)';x.fillRect(11,4,10,8);
    // 棕发 + 护士帽（白）
    x.fillStyle='rgb(140,90,50)';x.fillRect(10,3,12,3);x.fillRect(10,6,2,2);
    x.fillStyle='rgb(245,245,245)';x.fillRect(10,2,12,2);
    x.fillStyle='rgb(220,220,220)';x.fillRect(13,1,6,1);x.fillRect(14,0,4,1);
    // 眼
    x.fillStyle='#000';x.fillRect(14,8,2,2);x.fillRect(18,8,2,2);
    // 白衣
    x.fillStyle='rgb(240,240,242)';x.fillRect(9,12,14,8);
    x.fillStyle='rgb(225,225,228)';x.fillRect(9,19,14,4);
    // 红色十字
    x.fillStyle='rgb(210,50,50)';x.fillRect(14,14,4,6);x.fillRect(12,16,8,2);
    // 手臂
    x.fillStyle='rgb(240,210,180)';x.fillRect(7,13,2,5);x.fillRect(23,13,2,5);
    // 白裤 + 鞋
    x.fillStyle='rgb(225,225,228)';x.fillRect(11,23,4,5);x.fillRect(17,23,4,5);
    x.fillStyle='rgb(50,50,60)';x.fillRect(11,28,5,2);x.fillRect(17,28,5,2);
    return c;
  }
  sprites.nurse = nurseFrame();

  // demon_eye 仆从（飞行小眼，32x24）
  function demonEyeFrame(){
    const c=mk(32,24),x=ctx(c);
    // 球体
    x.fillStyle='rgb(180,160,200)';x.beginPath();x.arc(16,12,8,0,Math.PI*2);x.fill();
    // 巩膜
    x.fillStyle='rgb(240,240,250)';x.beginPath();x.arc(16,12,5,0,Math.PI*2);x.fill();
    // 虹膜（红）
    x.fillStyle='rgb(220,60,60)';x.beginPath();x.arc(16,12,3,0,Math.PI*2);x.fill();
    // 瞳孔
    x.fillStyle='#000';x.fillRect(15,11,2,2);
    // 高光
    x.fillStyle='rgba(255,255,255,.8)';x.fillRect(14,10,1,1);
    // 翅膀（左右扑动）
    x.fillStyle='rgb(120,90,160)';
    x.beginPath();x.ellipse(6,8,4,6,0.3,0,Math.PI*2);x.fill();
    x.beginPath();x.ellipse(26,8,4,6,-0.3,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(90,60,130)';
    x.fillRect(4,12,4,2);x.fillRect(24,12,4,2);
    return c;
  }
  sprites.demon_eye = demonEyeFrame();

  // 克苏鲁之眼 Boss — 第一阶段（大眼球 + 两侧扇动翅膀），48x48
  function eocPhase1Sprite(){
    const c=mk(48,48),x=ctx(c);
    // 翅膀（左右）
    x.fillStyle='rgb(70,40,100)';
    x.beginPath();x.ellipse(8,18,7,12,0.25,0,Math.PI*2);x.fill();
    x.beginPath();x.ellipse(40,18,7,12,-0.25,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(110,70,150)';
    x.beginPath();x.ellipse(10,20,4,8,0.25,0,Math.PI*2);x.fill();
    x.beginPath();x.ellipse(38,20,4,8,-0.25,0,Math.PI*2);x.fill();
    // 眼球主体
    x.fillStyle='rgb(220,200,210)';x.beginPath();x.arc(24,24,14,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(180,150,170)';x.beginPath();x.arc(24,24,14,0,Math.PI*2);
    x.lineWidth=2;x.strokeStyle='rgb(120,80,110)';x.stroke();
    // 巩膜
    x.fillStyle='rgb(240,240,250)';x.beginPath();x.arc(24,24,10,0,Math.PI*2);x.fill();
    // 虹膜（深红）
    x.fillStyle='rgb(200,40,40)';x.beginPath();x.arc(24,24,6,0,Math.PI*2);x.fill();
    // 瞳孔（黑）
    x.fillStyle='#000';x.beginPath();x.arc(24,24,3,0,Math.PI*2);x.fill();
    // 高光
    x.fillStyle='rgba(255,255,255,.9)';x.fillRect(21,21,2,2);
    // 触手眼皮
    x.fillStyle='rgb(90,60,90)';
    for(let i=0;i<6;i++){const a=i*Math.PI/3;x.fillRect(24+Math.cos(a)*14-1,24+Math.sin(a)*14-1,2,2);}
    return c;
  }
  sprites.eoc_phase1 = eocPhase1Sprite();

  // 克苏鲁之眼 Boss — 第二阶段（锯齿嘴 + 凶瞳），48x48
  function eocPhase2Sprite(){
    const c=mk(48,48),x=ctx(c);
    // 翅膀（更张开）
    x.fillStyle='rgb(60,30,90)';
    x.beginPath();x.ellipse(6,16,8,14,0.3,0,Math.PI*2);x.fill();
    x.beginPath();x.ellipse(42,16,8,14,-0.3,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(100,60,140)';
    x.beginPath();x.ellipse(8,18,5,10,0.3,0,Math.PI*2);x.fill();
    x.beginPath();x.ellipse(40,18,5,10,-0.3,0,Math.PI*2);x.fill();
    // 眼球主体（更扁、有血管）
    x.fillStyle='rgb(210,180,190)';x.beginPath();x.ellipse(24,22,16,12,0,0,Math.PI*2);x.fill();
    x.strokeStyle='rgb(120,70,100)';x.lineWidth=2;x.stroke();
    // 血管
    x.strokeStyle='rgb(200,40,40)';x.lineWidth=1;
    for(let i=0;i<4;i++){const a=-0.6+i*0.4;x.beginPath();x.moveTo(24,22);x.lineTo(24+Math.cos(a)*14,22+Math.sin(a)*10);x.stroke();}
    // 巩膜
    x.fillStyle='rgb(245,245,250)';x.beginPath();x.arc(24,22,9,0,Math.PI*2);x.fill();
    // 凶瞳虹膜
    x.fillStyle='rgb(220,30,30)';x.beginPath();x.arc(24,22,7,0,Math.PI*2);x.fill();
    // 瞳孔（细缝）
    x.fillStyle='#000';x.fillRect(22,16,4,12);
    // 嘴（锯齿）
    x.fillStyle='rgb(40,20,30)';x.fillRect(10,34,28,6);
    x.fillStyle='rgb(240,240,240)';
    for(let i=0;i<7;i++){x.fillRect(11+i*4,34,2,3);x.fillRect(13+i*4,37,2,3);}
    return c;
  }
  sprites.eoc_phase2 = eocPhase2Sprite();

  // 树（背景大图，48x64）
  function treeSprite(){
    const c=mk(48,64),x=ctx(c);
    x.fillStyle='rgb(80,55,30)';x.fillRect(22,16,4,48);
    x.fillStyle='rgb(110,80,45)';x.fillRect(23,18,1,44);
    x.fillStyle='rgb(60,140,60)';
    x.beginPath();x.arc(24,16,16,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(80,170,80)';x.beginPath();x.arc(20,12,8,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(45,110,45)';x.beginPath();x.arc(30,20,7,0,Math.PI*2);x.fill();
    return c;
  }
  sprites.tree = treeSprite();

  // 太阳 / 月
  sprites.sun = (()=>{const c=mk(32,32),x=ctx(c);x.fillStyle='rgb(255,240,160)';x.beginPath();x.arc(16,16,12,0,Math.PI*2);x.fill();x.fillStyle='rgba(255,255,200,.5)';x.beginPath();x.arc(16,16,16,0,Math.PI*2);x.fill();return c})();
  sprites.moon = (()=>{const c=mk(32,32),x=ctx(c);x.fillStyle='rgb(220,225,235)';x.beginPath();x.arc(16,16,11,0,Math.PI*2);x.fill();x.fillStyle='rgb(180,190,210)';x.beginPath();x.arc(22,12,3,0,Math.PI*2);x.fill();x.beginPath();x.arc(12,20,2,0,Math.PI*2);x.fill();return c})();

  // 云
  sprites.cloud = (()=>{const c=mk(64,24),x=ctx(c);x.fillStyle='rgba(255,255,255,.85)';
    x.beginPath();x.arc(12,14,8,0,Math.PI*2);x.arc(26,10,10,0,Math.PI*2);x.arc(42,12,9,0,Math.PI*2);x.arc(54,16,7,0,Math.PI*2);x.fill();return c})();

  // 箭矢投射物 16x4（沿 x 轴向右，通常旋转发射）
  sprites.proj_arrow = (()=>{const c=mk(16,4),x=ctx(c);
    x.fillStyle='rgb(140,90,45)';x.fillRect(2,1,8,2);
    x.fillStyle='rgb(230,230,235)';x.fillRect(10,0,3,1);x.fillRect(10,3,3,1);x.fillRect(12,0,1,4);
    x.fillStyle='rgb(60,60,65)';x.fillRect(0,1,2,2);
    return c})();

  // 物品：蜂相关
  item('i_hive',(x)=>{x.fillStyle='rgb(200,160,50)';x.fillRect(3,3,10,10);x.fillStyle='rgb(120,90,30)';x.fillRect(3,7,10,1);x.fillRect(7,3,1,10)});
  item('i_honey',(x)=>{x.fillStyle='rgb(255,200,40)';x.fillRect(5,4,6,10);x.fillStyle='rgb(255,230,120)';x.fillRect(6,5,4,3)});
  item('i_beeswax',(x)=>{x.fillStyle='rgb(230,200,80)';x.fillRect(4,5,8,7);x.fillStyle='rgb(255,230,140)';x.fillRect(5,6,3,2)});
  item('i_stinger',(x)=>{x.fillStyle='rgb(80,180,60)';x.fillRect(3,7,8,2);x.fillStyle='rgb(200,220,80)';x.fillRect(11,6,3,4)});
  item('i_abeemination',(x)=>{x.fillStyle='rgb(255,220,60)';x.beginPath();x.arc(8,8,5,0,Math.PI*2);x.fill();x.fillStyle='rgb(40,40,40)';x.fillRect(5,6,2,2);x.fillRect(9,6,2,2)});
  item('i_bee_gun',(x)=>{x.fillStyle='rgb(180,140,40)';x.fillRect(2,6,10,3);x.fillStyle='rgb(255,220,80)';x.fillRect(11,5,3,5);x.fillStyle='rgb(80,60,20)';x.fillRect(4,5,2,5)});
  item('i_sword_bee',(x)=>{x.fillStyle='rgb(80,60,20)';x.fillRect(7,8,2,6);x.fillStyle='rgb(255,220,60)';x.fillRect(5,2,6,8);x.fillStyle='rgb(200,160,40)';x.fillRect(6,3,4,2)});
  item('i_helm_bee',(x)=>{x.fillStyle='rgb(240,200,50)';x.fillRect(4,4,8,8);x.fillStyle='rgb(40,40,40)';x.fillRect(5,7,2,2);x.fillRect(9,7,2,2)});
  item('i_chest_bee',(x)=>{x.fillStyle='rgb(240,200,50)';x.fillRect(4,3,8,10);x.fillStyle='rgb(40,40,40)';x.fillRect(6,6,4,4)});
  item('i_legs_bee',(x)=>{x.fillStyle='rgb(240,200,50)';x.fillRect(4,4,3,10);x.fillRect(9,4,3,10)});
  wornPiece('i_helm_bee','#f0c832','#282828','head'); wornPiece('i_chest_bee','#f0c832','#282828','body'); wornPiece('i_legs_bee','#f0c832','#282828','legs');
  item('i_dungeon_brick',(x)=>{x.fillStyle='rgb(80,80,110)';x.fillRect(3,3,10,10);x.fillStyle='rgb(50,50,70)';x.fillRect(3,7,10,1);x.fillRect(7,3,1,10)});
  item('i_bone',(x)=>{x.fillStyle='rgb(230,220,200)';x.fillRect(4,6,8,3);x.fillRect(3,4,3,7);x.fillRect(10,4,3,7)});
  item('i_dungeon_key',(x)=>{x.fillStyle='rgb(240,200,60)';x.fillRect(6,3,4,8);x.fillRect(4,10,8,2);x.fillRect(4,12,2,2);x.fillRect(10,12,2,2);x.beginPath();x.arc(8,4,3,0,Math.PI*2);x.fill()});
  item('i_boss_summon_qb',(x)=>{x.fillStyle='rgb(255,220,60)';x.beginPath();x.arc(8,8,5,0,Math.PI*2);x.fill();x.fillStyle='rgb(40,40,40)';x.fillRect(5,6,2,2);x.fillRect(9,6,2,2)});
  // 地狱 / 困难模式物品
  item('i_ash',(x)=>{x.fillStyle='rgb(90,85,80)';x.fillRect(2,3,12,10);x.fillStyle='rgb(60,55,50)';x.fillRect(4,5,3,3);x.fillRect(9,8,3,2)});
  item('i_hellstone',(x)=>{x.fillStyle='rgb(100,40,30)';x.fillRect(3,4,10,9);x.fillStyle='rgb(240,100,30)';x.fillRect(5,6,4,4);x.fillStyle='rgb(255,200,60)';x.fillRect(6,7,2,2)});
  item('i_hellstone_bar',(x)=>{x.fillStyle='rgb(220,90,40)';x.fillRect(3,5,10,6);x.fillStyle='rgb(160,50,20)';x.fillRect(3,9,10,2);x.fillStyle='rgb(255,180,80)';x.fillRect(4,5,2,1)});
  item('i_hellbrick',(x)=>{x.fillStyle='rgb(120,55,40)';x.fillRect(2,3,12,10);x.fillStyle='rgb(70,30,25)';x.fillRect(2,7,12,1);x.fillRect(7,3,1,10)});
  item('i_pick_molten',(x)=>{x.fillStyle='rgb(80,40,20)';x.fillRect(7,8,2,7);x.fillStyle='rgb(240,100,30)';x.fillRect(2,3,12,2);x.fillRect(3,5,10,1);x.fillStyle='rgb(255,200,60)';x.fillRect(4,3,2,1)});
  item('i_sword_molten',(x)=>{x.fillStyle='rgb(255,120,30)';x.fillRect(6,1,4,10);x.fillStyle='rgb(200,60,20)';x.fillRect(7,2,2,8);x.fillStyle='rgb(80,40,20)';x.fillRect(5,11,6,2);x.fillStyle='rgb(255,200,60)';x.fillRect(6,12,4,2)});
  item('i_axe_molten',(x)=>{x.fillStyle='rgb(80,40,20)';x.fillRect(8,7,2,8);x.fillStyle='rgb(240,100,30)';x.fillRect(4,2,4,3);x.fillRect(4,5,2,3);x.fillRect(10,2,2,6)});
  armor('i_helm_molten','#e86820','#903010','head'); armor('i_chest_molten','#e86820','#903010','body'); armor('i_legs_molten','#e86820','#903010','legs');
  item('i_voodoo_doll',(x)=>{x.fillStyle='rgb(160,120,80)';x.fillRect(5,3,6,10);x.fillStyle='rgb(220,180,140)';x.fillRect(5,3,6,4);x.fillStyle='#000';x.fillRect(6,4,1,1);x.fillRect(9,4,1,1);x.fillStyle='rgb(180,40,40)';x.fillRect(7,8,2,2)});
  item('i_pwnhammer',(x)=>{x.fillStyle='rgb(100,60,30)';x.fillRect(7,6,2,8);x.fillStyle='rgb(180,180,200)';x.fillRect(3,2,10,5);x.fillStyle='rgb(120,120,140)';x.fillRect(3,5,10,2)});
  item('i_cobalt_ore',(x)=>{x.fillStyle='rgb(50,70,100)';x.fillRect(3,4,10,9);x.fillStyle='rgb(60,140,230)';x.fillRect(5,6,4,4)});
  item('i_mythril_ore',(x)=>{x.fillStyle='rgb(40,80,60)';x.fillRect(3,4,10,9);x.fillStyle='rgb(80,210,150)';x.fillRect(5,6,4,4)});
  item('i_adamantite_ore',(x)=>{x.fillStyle='rgb(90,40,50)';x.fillRect(3,4,10,9);x.fillStyle='rgb(230,80,110)';x.fillRect(5,6,4,4)});
  item('i_cobalt_bar',(x)=>{x.fillStyle='rgb(60,140,230)';x.fillRect(3,5,10,6);x.fillStyle='rgb(40,90,160)';x.fillRect(3,9,10,2)});
  item('i_mythril_bar',(x)=>{x.fillStyle='rgb(80,210,150)';x.fillRect(3,5,10,6);x.fillStyle='rgb(40,130,90)';x.fillRect(3,9,10,2)});
  item('i_adamantite_bar',(x)=>{x.fillStyle='rgb(230,80,110)';x.fillRect(3,5,10,6);x.fillStyle='rgb(150,40,60)';x.fillRect(3,9,10,2)});
  item('i_pick_cobalt',(x)=>{x.fillStyle='rgb(40,60,90)';x.fillRect(7,8,2,7);x.fillStyle='rgb(60,140,230)';x.fillRect(3,3,10,2);x.fillRect(4,5,8,1)});
  item('i_sword_cobalt',(x)=>{x.fillStyle='rgb(60,140,230)';x.fillRect(6,2,4,9);x.fillStyle='rgb(40,90,160)';x.fillRect(7,3,2,7);x.fillStyle='rgb(40,50,70)';x.fillRect(5,11,6,2)});
  item('i_warrior_emblem',(x)=>{x.fillStyle='rgb(200,60,60)';x.beginPath();x.arc(8,8,6,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.fillRect(7,4,2,8);x.fillRect(4,7,8,2)});
  item('i_ranger_emblem',(x)=>{x.fillStyle='rgb(60,160,80)';x.beginPath();x.arc(8,8,6,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.fillRect(4,7,8,2);x.fillRect(10,5,2,6)});
  item('i_sorcerer_emblem',(x)=>{x.fillStyle='rgb(80,100,220)';x.beginPath();x.arc(8,8,6,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.fillRect(6,4,4,8);x.fillRect(5,5,6,2)});
  item('i_soul_might',(x)=>{x.fillStyle='rgba(220,80,80,.9)';x.beginPath();x.arc(8,9,5,0,Math.PI*2);x.fill();x.fillStyle='rgba(255,200,200,.8)';x.fillRect(7,3,2,5)});
  item('i_soul_sight',(x)=>{x.fillStyle='rgba(80,200,120,.9)';x.beginPath();x.arc(8,9,5,0,Math.PI*2);x.fill();x.fillStyle='rgba(200,255,220,.8)';x.fillRect(7,3,2,5)});
  item('i_soul_fright',(x)=>{x.fillStyle='rgba(120,140,255,.9)';x.beginPath();x.arc(8,9,5,0,Math.PI*2);x.fill();x.fillStyle='rgba(220,230,255,.8)';x.fillRect(7,3,2,5)});
  item('i_hallowed_bar',(x)=>{x.fillStyle='rgb(255,220,240)';x.fillRect(3,5,10,6);x.fillStyle='rgb(200,160,220)';x.fillRect(3,9,10,2);x.fillStyle='rgb(180,220,255)';x.fillRect(4,5,2,1)});
  item('i_mech_worm',(x)=>{x.fillStyle='rgb(120,120,140)';x.fillRect(2,6,12,4);x.fillStyle='rgb(200,60,60)';x.fillRect(12,5,3,6);x.fillStyle='#fff';x.fillRect(3,7,2,2)});
  item('i_mech_eye',(x)=>{x.fillStyle='rgb(200,200,210)';x.beginPath();x.arc(8,8,6,0,Math.PI*2);x.fill();x.fillStyle='rgb(220,40,40)';x.beginPath();x.arc(8,8,3,0,Math.PI*2);x.fill();x.fillStyle='#000';x.fillRect(7,7,2,2)});
  item('i_mech_skull',(x)=>{x.fillStyle='rgb(180,180,190)';x.fillRect(4,3,8,10);x.fillStyle='#111';x.fillRect(5,5,2,3);x.fillRect(9,5,2,3);x.fillStyle='#fff';x.fillRect(5,11,6,1)});
  item('i_pick_mythril',(x)=>{x.fillStyle='rgb(40,80,60)';x.fillRect(7,8,2,7);x.fillStyle='rgb(80,210,150)';x.fillRect(3,3,10,2);x.fillRect(4,5,8,1)});
  item('i_pick_adamantite',(x)=>{x.fillStyle='rgb(90,40,50)';x.fillRect(7,8,2,7);x.fillStyle='rgb(230,80,110)';x.fillRect(3,3,10,2);x.fillRect(4,5,8,1)});
  item('i_sword_excalibur',(x)=>{x.fillStyle='rgb(255,240,250)';x.fillRect(6,1,4,10);x.fillStyle='rgb(200,160,220)';x.fillRect(7,2,2,8);x.fillStyle='rgb(255,200,80)';x.fillRect(5,11,6,2)});
  armor('i_helm_hallowed','#f0d0f0','#c090d0','head'); armor('i_chest_hallowed','#f0d0f0','#c090d0','body'); armor('i_legs_hallowed','#f0d0f0','#c090d0','legs');
  item('i_pearlstone',(x)=>{x.fillStyle='rgb(220,200,230)';x.fillRect(3,4,10,9);x.fillStyle='rgb(255,240,255)';x.fillRect(5,6,3,3)});
  item('i_temple_key',(x)=>{x.fillStyle='rgb(200,160,40)';x.fillRect(6,3,4,8);x.fillRect(4,10,8,2);x.beginPath();x.arc(8,4,3,0,Math.PI*2);x.fill()});
  item('i_lihzahrd_brick',(x)=>{x.fillStyle='rgb(200,160,40)';x.fillRect(2,3,12,10);x.fillStyle='rgb(140,100,20)';x.fillRect(2,7,12,1);x.fillRect(7,3,1,10)});
  item('i_chlorophyte_ore',(x)=>{x.fillStyle='rgb(40,80,30)';x.fillRect(3,4,10,9);x.fillStyle='rgb(120,230,80)';x.fillRect(5,6,4,4)});
  item('i_chlorophyte_bar',(x)=>{x.fillStyle='rgb(120,230,80)';x.fillRect(3,5,10,6);x.fillStyle='rgb(60,150,40)';x.fillRect(3,9,10,2);x.fillStyle='rgb(200,255,160)';x.fillRect(4,5,2,1)});
  item('i_lihzahrd_battery',(x)=>{x.fillStyle='rgb(200,160,40)';x.fillRect(3,4,10,9);x.fillStyle='rgb(120,80,10)';x.fillRect(5,6,6,5);x.fillStyle='rgb(120,230,80)';x.fillRect(6,7,4,3)});
  item('i_plantera_bullet',(x)=>{x.fillStyle='rgb(255,160,200)';x.beginPath();x.arc(8,8,4,0,Math.PI*2);x.fill();x.fillStyle='rgb(120,200,80)';x.fillRect(7,2,2,4)});
  item('i_pick_chlorophyte',(x)=>{x.fillStyle='rgb(60,100,40)';x.fillRect(7,8,2,7);x.fillStyle='rgb(120,230,80)';x.fillRect(2,3,12,2);x.fillRect(4,5,8,1)});
  item('i_sword_chlorophyte',(x)=>{x.fillStyle='rgb(120,230,80)';x.fillRect(6,1,4,10);x.fillStyle='rgb(60,150,40)';x.fillRect(7,2,2,8);x.fillStyle='rgb(80,50,30)';x.fillRect(5,11,6,2)});
  armor('i_helm_chlorophyte','#80e050','#308020','head'); armor('i_chest_chlorophyte','#80e050','#308020','body'); armor('i_legs_chlorophyte','#80e050','#308020','legs');
  item('i_golem_eye',(x)=>{x.fillStyle='rgb(200,160,40)';x.beginPath();x.arc(8,8,6,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(8,8,3,0,Math.PI*2);x.fill();x.fillStyle='#f40';x.fillRect(7,7,2,2)});
  item('i_possessed_hatchet',(x)=>{x.fillStyle='rgb(160,120,40)';x.fillRect(2,4,8,8);x.fillStyle='rgb(200,200,60)';x.fillRect(10,7,4,2);x.fillStyle='#fff';x.fillRect(3,5,2,2)});
  item('i_stynger',(x)=>{x.fillStyle='rgb(180,160,40)';x.fillRect(2,6,12,4);x.fillStyle='rgb(120,200,80)';x.fillRect(11,5,3,6)});
  // 月球碎片 / 夜明 / 终极装备
  item('i_solar_fragment',(x)=>{x.fillStyle='rgb(255,140,40)';x.beginPath();x.moveTo(8,2);x.lineTo(12,8);x.lineTo(8,14);x.lineTo(4,8);x.closePath();x.fill();x.fillStyle='rgb(255,220,80)';x.fillRect(6,6,4,4)});
  item('i_nebula_fragment',(x)=>{x.fillStyle='rgb(200,100,255)';x.beginPath();x.moveTo(8,2);x.lineTo(12,8);x.lineTo(8,14);x.lineTo(4,8);x.closePath();x.fill();x.fillStyle='rgb(240,180,255)';x.fillRect(6,6,4,4)});
  item('i_vortex_fragment',(x)=>{x.fillStyle='rgb(40,220,200)';x.beginPath();x.moveTo(8,2);x.lineTo(12,8);x.lineTo(8,14);x.lineTo(4,8);x.closePath();x.fill();x.fillStyle='rgb(140,255,240)';x.fillRect(6,6,4,4)});
  item('i_stardust_fragment',(x)=>{x.fillStyle='rgb(100,180,255)';x.beginPath();x.moveTo(8,2);x.lineTo(12,8);x.lineTo(8,14);x.lineTo(4,8);x.closePath();x.fill();x.fillStyle='rgb(200,230,255)';x.fillRect(6,6,4,4)});
  item('i_luminite',(x)=>{x.fillStyle='rgb(60,90,80)';x.fillRect(3,4,10,9);x.fillStyle='rgb(120,255,200)';x.fillRect(5,6,4,4);x.fillStyle='rgb(200,255,240)';x.fillRect(6,7,2,2)});
  item('i_luminite_bar',(x)=>{x.fillStyle='rgb(120,255,200)';x.fillRect(3,5,10,6);x.fillStyle='rgb(40,140,110)';x.fillRect(3,9,10,2);x.fillStyle='rgb(200,255,240)';x.fillRect(4,5,2,1)});
  item('i_sword_meowmere',(x)=>{x.fillStyle='rgb(255,180,220)';x.fillRect(6,1,4,10);x.fillStyle='rgb(255,100,180)';x.fillRect(7,2,2,8);x.fillStyle='rgb(255,220,80)';x.fillRect(5,11,6,2);x.fillStyle='#fff';x.fillRect(7,3,2,2)});
  item('i_gun_sdmg',(x)=>{x.fillStyle='rgb(80,90,110)';x.fillRect(2,6,12,4);x.fillStyle='rgb(120,255,200)';x.fillRect(11,5,4,6);x.fillStyle='rgb(40,60,50)';x.fillRect(3,5,3,6)});
  item('i_staff_prism',(x)=>{x.fillStyle='rgb(180,160,255)';x.fillRect(7,2,2,11);x.fillStyle='rgb(255,100,255)';x.beginPath();x.arc(8,4,4,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.fillRect(7,3,2,2)});
  armor('i_helm_solar','#ff9020','#c04010','head'); armor('i_chest_solar','#ff9020','#c04010','body'); armor('i_legs_solar','#ff9020','#c04010','legs');
  armor('i_helm_nebula','#c060ff','#6020a0','head'); armor('i_chest_nebula','#c060ff','#6020a0','body'); armor('i_legs_nebula','#c060ff','#6020a0','legs');
  item('i_wing_stardust',(x)=>{x.fillStyle='rgb(100,180,255)';x.fillRect(2,4,5,10);x.fillRect(9,4,5,10);x.fillStyle='rgb(200,230,255)';x.fillRect(3,5,3,3);x.fillRect(10,5,3,3)});
  item('i_ancient_manipulator',(x)=>{x.fillStyle='rgb(80,100,140)';x.fillRect(2,4,12,10);x.fillStyle='rgb(120,255,200)';x.fillRect(5,6,6,6);x.fillStyle='#fff';x.fillRect(6,7,2,2)});
  item('i_celestial_sigil',(x)=>{x.fillStyle='rgb(40,60,90)';x.beginPath();x.arc(8,8,6,0,Math.PI*2);x.fill();x.fillStyle='rgb(120,255,200)';x.fillRect(5,5,6,6);x.fillStyle='#fff';x.fillRect(7,4,2,8);x.fillRect(4,7,8,2)});

  // 四职业武器与职业护甲
  function weaponSword(name,blade,edge){item(name,(x)=>{x.fillStyle='#603820';x.fillRect(7,9,2,6);x.fillStyle=blade;x.fillRect(6,2,4,9);x.fillStyle=edge;x.fillRect(7,2,1,8);x.fillStyle='#d0a050';x.fillRect(4,10,8,2)});}
  function weaponBow(name,col,glow){item(name,(x)=>{x.strokeStyle=col;x.lineWidth=2;x.beginPath();x.arc(5,8,6,-Math.PI/2,Math.PI/2);x.stroke();x.strokeStyle=glow;x.lineWidth=1;x.beginPath();x.moveTo(5,2);x.lineTo(11,8);x.lineTo(5,14);x.stroke()});}
  function weaponGun(name,col,glow){item(name,(x)=>{x.fillStyle=col;x.fillRect(2,6,12,4);x.fillStyle=glow;x.fillRect(10,5,4,2);x.fillStyle='#503820';x.fillRect(5,9,3,5);x.fillStyle='#202830';x.fillRect(2,7,3,2)});}
  function weaponStaff(name,col,gemc){item(name,(x)=>{x.fillStyle=col;x.fillRect(7,4,2,11);x.fillStyle=gemc;x.beginPath();x.arc(8,4,4,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.fillRect(7,2,2,2)});}
  weaponBow('i_bow_gold','#e8b840','#fff080'); weaponBow('i_bow_molten','#e85020','#ffcf50'); weaponGun('i_rifle_clockwork','#a0a0b0','#e8e0b0');
  weaponBow('i_repeater_hallowed','#e0c0f0','#fff0ff'); weaponGun('i_gun_vortex','#205c60','#60ffe0'); item('i_bullet',(x)=>{x.fillStyle='#c8b070';x.fillRect(5,3,6,10);x.fillStyle='#fff0b0';x.fillRect(6,3,4,2)});
  weaponStaff('i_staff_amethyst','#705030','#c060e0'); weaponStaff('i_staff_topaz','#806030','#f0b840'); weaponStaff('i_staff_sapphire','#605038','#5080e8');
  weaponStaff('i_spell_demon_scythe','#302040','#9050c0'); weaponStaff('i_staff_flower_fire','#704020','#ff6030'); weaponStaff('i_spell_crystal_storm','#406070','#70e8ff');
  weaponStaff('i_harp_hallowed','#806080','#ffc0ff'); weaponStaff('i_staff_chlorophyte','#406030','#70e850'); weaponStaff('i_staff_nebula','#503060','#d060ff');
  weaponStaff('i_staff_slime','#604830','#60c0e0'); weaponStaff('i_staff_hornet','#604820','#ffd040'); weaponStaff('i_staff_imp','#603020','#ff5020');
  weaponStaff('i_staff_spider','#403040','#d0d0d0'); weaponStaff('i_staff_pirate','#704020','#e0b050'); weaponStaff('i_staff_sphere','#404060','#a0a0ff'); weaponStaff('i_staff_stardust_dragon','#304060','#70b8ff');
  item('i_summoner_emblem',(x)=>{x.fillStyle='#e0a040';x.beginPath();x.arc(8,8,6,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.fillRect(6,4,4,3);x.fillRect(4,8,8,3)});
  armor('i_helm_wizard','#5050a0','#b080e0','head');armor('i_chest_wizard','#5050a0','#b080e0','body');armor('i_legs_wizard','#5050a0','#b080e0','legs');
  armor('i_helm_spider','#505060','#d0d0d0','head');armor('i_chest_spider','#505060','#d0d0d0','body');armor('i_legs_spider','#505060','#d0d0d0','legs');
  armor('i_helm_vortex','#206060','#60ffe0','head');armor('i_chest_vortex','#206060','#60ffe0','body');armor('i_legs_vortex','#206060','#60ffe0','legs');
  armor('i_helm_stardust','#305080','#80c0ff','head');armor('i_chest_stardust','#305080','#80c0ff','body');armor('i_legs_stardust','#305080','#80c0ff','legs');

  // 投射物
  function projectile(name,c1,c2,shape){const c=mk(16,8),x=ctx(c);x.clearRect(0,0,16,8);x.fillStyle=c1;if(shape==='orb'){x.beginPath();x.arc(8,4,4,0,Math.PI*2);x.fill();}else if(shape==='blade'){x.beginPath();x.moveTo(1,4);x.lineTo(8,0);x.lineTo(15,4);x.lineTo(8,8);x.closePath();x.fill();}else{x.fillRect(2,2,11,4);}x.fillStyle=c2;x.fillRect(6,2,4,2);sprites['proj_'+name]=c;}
  projectile('bullet','#d0b060','#fff0b0');projectile('vortexBullet','#20c0b0','#80fff0');projectile('luminiteBullet','#50d0a0','#d0fff0');
  projectile('fireArrow','#e85020','#ffd050');projectile('holyArrow','#e8d060','#fff');projectile('beeArrow','#e0b030','#303020');projectile('stynger','#80b030','#d8e860');
  projectile('amethystBolt','#a050d0','#f0b0ff','orb');projectile('topazBolt','#e0a030','#fff080','orb');projectile('sapphireBolt','#4080e0','#b0d0ff','orb');
  projectile('demonScythe','#603080','#c080e0','blade');projectile('fireball','#e84020','#ffd040','orb');projectile('crystal','#50c0e0','#d0ffff','blade');
  projectile('note','#d050b0','#ffd0ff','orb');projectile('leafBolt','#50b030','#d0ff80','blade');projectile('nebulaFlame','#a030d0','#f0a0ff','orb');
  projectile('catBlade','#ff70b0','#fff080','blade');projectile('hatchet','#a09030','#fff080','blade');projectile('bee','#d8a020','#303020','orb');
  projectile('minionBolt','#e0b040','#fff0a0','orb');projectile('impFire','#e84020','#ffd040','orb');projectile('stardustBolt','#5080e0','#c0e0ff','orb');
  // 随从精灵
  function minion(name,c1,c2,kind){const c=mk(16,16),x=ctx(c);x.clearRect(0,0,16,16);x.fillStyle=c1;if(kind==='orb'){x.beginPath();x.arc(8,8,6,0,Math.PI*2);x.fill();}else{x.fillRect(3,5,10,8);}x.fillStyle=c2;x.fillRect(5,7,2,2);x.fillRect(9,7,2,2);sprites['minion_'+name]=c;}
  minion('slimeMinion','#50b8d8','#fff');minion('hornetMinion','#e0b030','#202020');minion('impMinion','#d04020','#ffd040');
  minion('spiderMinion','#505060','#e0e0e0');minion('pirateMinion','#806030','#ffd060');minion('sphereMinion','#6060c0','#c0c0ff','orb');minion('stardustDragon','#4080d0','#c0e0ff');

  // 世纪之花 56x56
  sprites.plantera = (()=>{const c=mk(56,56),x=ctx(c);
    x.fillStyle='rgb(80,160,50)';x.beginPath();x.arc(28,28,22,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(120,200,80)';x.beginPath();x.arc(24,24,16,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(60,120,30)';
    for(let i=0;i<8;i++){const a=i*Math.PI/4;x.fillRect(28+Math.cos(a)*20-2,28+Math.sin(a)*20-2,4,8);}
    // 花瓣
    x.fillStyle='rgb(255,160,200)';
    x.beginPath();x.arc(28,16,6,0,Math.PI*2);x.fill();
    x.beginPath();x.arc(28,40,5,0,Math.PI*2);x.fill();
    // 嘴
    x.fillStyle='#210';x.fillRect(22,24,12,8);
    x.fillStyle='#fff';for(let i=0;i<4;i++)x.fillRect(22+i*3,24,2,3);
    return c})();
  // 石巨人 48x56
  sprites.golem = (()=>{const c=mk(48,56),x=ctx(c);
    // 头
    x.fillStyle='rgb(200,160,40)';x.fillRect(12,2,24,18);
    x.fillStyle='rgb(140,100,20)';x.fillRect(12,16,24,2);
    x.fillStyle='#f40';x.fillRect(16,8,5,4);x.fillRect(27,8,5,4);
    // 身
    x.fillStyle='rgb(200,160,40)';x.fillRect(8,22,32,28);
    x.fillStyle='rgb(160,120,30)';x.fillRect(8,22,32,3);x.fillRect(8,46,32,2);
    // 拳头
    x.fillStyle='rgb(180,140,30)';x.fillRect(0,28,8,12);x.fillRect(40,28,8,12);
    return c;})();

  // 恶魔 32x32
  sprites.demon = (()=>{const c=mk(32,32),x=ctx(c);
    x.fillStyle='rgb(120,40,40)';x.fillRect(10,8,12,14);
    x.fillStyle='rgb(90,30,30)';x.fillRect(8,4,16,6);
    x.fillStyle='rgb(220,60,40)';x.fillRect(12,10,2,2);x.fillRect(18,10,2,2);
    // 翅膀
    x.fillStyle='rgb(80,20,20)';x.fillRect(2,8,8,10);x.fillRect(22,8,8,10);
    x.fillStyle='rgb(40,10,10)';x.fillRect(11,22,4,8);x.fillRect(17,22,4,8);
    return c})();
  // 血肉墙口器 64x64
  sprites.wof_mouth = (()=>{const c=mk(64,64),x=ctx(c);
    x.fillStyle='rgb(160,60,70)';x.fillRect(4,8,56,48);
    x.fillStyle='rgb(100,30,40)';x.fillRect(12,16,40,32);
    // 牙
    x.fillStyle='#eee';
    for(let i=0;i<8;i++){x.fillRect(14+i*5,16,3,8);x.fillRect(14+i*5,40,3,8);}
    // 眼
    x.fillStyle='#fff';x.beginPath();x.arc(22,20,6,0,Math.PI*2);x.fill();x.beginPath();x.arc(42,20,6,0,Math.PI*2);x.fill();
    x.fillStyle='#000';x.fillRect(20,18,4,4);x.fillRect(40,18,4,4);
    x.fillStyle='rgb(200,40,40)';x.fillRect(28,30,8,10);
    return c})();
  // 血肉墙墙体段 32x64
  sprites.wof_wall = (()=>{const c=mk(32,64),x=ctx(c);
    x.fillStyle='rgb(140,50,60)';x.fillRect(0,0,32,64);
    x.fillStyle='rgb(100,30,40)';
    for(let y=0;y<64;y+=8) x.fillRect(0,y,32,3);
    x.fillStyle='rgb(200,80,90)';x.fillRect(8,10,6,6);x.fillRect(18,30,8,8);x.fillRect(6,48,10,6);
    return c})();

  // 蜂后 48x40
  sprites.queen_bee = (()=>{const c=mk(48,40),x=ctx(c);
    x.fillStyle='rgb(40,30,20)';x.fillRect(8,14,32,16);
    x.fillStyle='rgb(255,200,40)';x.fillRect(10,16,28,4);x.fillRect(10,24,28,4);
    x.fillStyle='rgb(30,25,20)';x.fillRect(10,20,28,4);
    // 头
    x.fillStyle='rgb(255,220,60)';x.beginPath();x.arc(12,18,8,0,Math.PI*2);x.fill();
    x.fillStyle='#000';x.fillRect(8,15,3,3);x.fillRect(13,15,3,3);
    // 翅膀
    x.fillStyle='rgba(200,230,255,.55)';
    x.beginPath();x.ellipse(24,10,10,6,0,0,Math.PI*2);x.fill();
    x.beginPath();x.ellipse(34,12,8,5,0.2,0,Math.PI*2);x.fill();
    // 毒刺
    x.fillStyle='rgb(80,180,60)';x.fillRect(38,20,8,2);
    return c})();
  // 小蜜蜂 20x16
  sprites.bee = (()=>{const c=mk(20,16),x=ctx(c);
    x.fillStyle='rgb(30,25,20)';x.fillRect(4,5,12,7);
    x.fillStyle='rgb(255,210,40)';x.fillRect(5,6,10,2);x.fillRect(5,10,10,2);
    x.fillStyle='rgba(200,230,255,.6)';x.fillRect(6,2,4,4);x.fillRect(11,2,4,4);
    x.fillStyle='#000';x.fillRect(5,7,2,2);
    return c})();
  // 骷髅王头 40x40
  sprites.skeletron_head = (()=>{const c=mk(40,40),x=ctx(c);
    x.fillStyle='rgb(220,215,200)';x.beginPath();x.arc(20,20,16,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(180,170,150)';x.beginPath();x.arc(20,20,16,0,Math.PI*2);x.lineWidth=2;x.strokeStyle='rgb(120,110,100)';x.stroke();
    // 眼窝
    x.fillStyle='#111';x.beginPath();x.ellipse(13,17,4,5,0,0,Math.PI*2);x.fill();
    x.beginPath();x.ellipse(27,17,4,5,0,0,Math.PI*2);x.fill();
    x.fillStyle='rgb(200,40,40)';x.fillRect(12,16,2,2);x.fillRect(26,16,2,2);
    // 鼻
    x.fillStyle='rgb(160,150,140)';x.fillRect(18,20,4,4);
    // 牙
    x.fillStyle='#fff';for(let i=0;i<5;i++)x.fillRect(12+i*3,28,2,3);
    return c})();
  // 骷髅手臂 28x12
  sprites.skeletron_arm = (()=>{const c=mk(28,12),x=ctx(c);
    x.fillStyle='rgb(220,215,200)';x.fillRect(0,4,24,4);
    x.fillStyle='rgb(200,190,170)';x.beginPath();x.arc(24,6,5,0,Math.PI*2);x.fill();
    x.fillStyle='#222';x.fillRect(22,4,2,2);x.fillRect(25,5,2,2);
    return c})();
  // 老人 NPC 32x32
  sprites.oldman = (()=>{const c=mk(32,32),x=ctx(c);
    x.fillStyle='rgb(220,200,180)';x.fillRect(11,5,10,8);
    x.fillStyle='rgb(200,200,210)';x.fillRect(10,3,12,4);x.fillRect(9,6,2,4);x.fillRect(21,6,2,4);
    x.fillStyle='#000';x.fillRect(13,8,2,2);x.fillRect(18,8,2,2);
    x.fillStyle='rgb(80,70,90)';x.fillRect(10,13,12,10);
    x.fillStyle='rgb(60,50,70)';x.fillRect(11,23,4,6);x.fillRect(17,23,4,6);
    x.fillStyle='rgb(40,30,30)';x.fillRect(11,28,5,2);x.fillRect(17,28,5,2);
    return c})();

  // 世界吞噬者 — 头部 36x24
  sprites.eow_head = (()=>{const c=mk(36,24),x=ctx(c);
    // 身体
    x.fillStyle='rgb(70,50,90)';x.fillRect(6,4,26,16);
    x.fillStyle='rgb(95,70,120)';x.fillRect(8,5,22,5);x.fillRect(8,14,20,5);
    // 下颚（张嘴）
    x.fillStyle='rgb(50,32,70)';x.fillRect(2,14,8,3);
    for(let i=0;i<4;i++){x.fillStyle='rgb(230,230,235)';x.fillRect(4+i*2,13,1,2);x.fillRect(4+i*2,16,1,2);}
    // 上颚
    x.fillStyle='rgb(60,42,80)';x.fillRect(2,6,6,3);
    for(let i=0;i<3;i++){x.fillStyle='rgb(235,235,235)';x.fillRect(3+i*2,5,1,2);}
    // 眼
    x.fillStyle='rgb(220,40,40)';x.fillRect(20,7,5,4);x.fillStyle='#000';x.fillRect(21,7,3,2);
    return c})();
  // 世界吞噬者 — 身体段 26x22
  sprites.eow_body = (()=>{const c=mk(26,22),x=ctx(c);
    x.fillStyle='rgb(65,46,85)';x.fillRect(3,3,20,16);
    x.fillStyle='rgb(95,70,120)';x.fillRect(5,5,16,4);x.fillRect(5,13,15,4);
    // 鳞片纹
    x.fillStyle='rgb(55,38,72)';x.fillRect(8,10,12,2);x.fillRect(6,10,2,2);
    return c})();
  // 世界吞噬者 — 尾部 28x22
  sprites.eow_tail = (()=>{const c=mk(28,22),x=ctx(c);
    x.fillStyle='rgb(65,46,85)';x.fillRect(2,4,20,14);
    x.fillStyle='rgb(95,70,120)';x.fillRect(4,6,15,4);x.fillRect(4,12,14,4);
    // 尾尖
    x.fillStyle='rgb(55,38,72)';x.fillRect(22,8,4,6);
    return c})();

  window.ASSETS = { sprites, TS, SS };
})();
