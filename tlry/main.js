/* ===== 主循环 / 渲染 / 输入 / 昼夜 ===== */
(function(){
  const TS=16, SPR=window.ASSETS.sprites, TILE=window.TILE_DEFS, BYNAME=window.TILE_BY_NAME;
  const DATA=window.DATA, ITEM=DATA.ITEM;
  // 难度配置（致敬原版经典/专家/大师）
  const DIFFS={
    classic:{key:'classic',name:'经典', dmgMul:1.0,  hpMul:1.0,  coinLoss:0.5},
    expert: {key:'expert', name:'专家', dmgMul:1.75, hpMul:1.75, coinLoss:0.75},
    master: {key:'master', name:'大师', dmgMul:2.5,  hpMul:2.5,  coinLoss:1.0}
  };

  function Game(){
    this.canvas=document.getElementById('game');
    this.ctx=this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled=false;
    this.resize();
    addEventListener('resize',()=>this.resize());

    this.input={left:false,right:false,jump:false};
    this.mouse={x:0,y:0,wx:0,wy:0,left:false,right:false};
    this.cam={x:0,y:0};
    this.dayTime=0.30; // 0=黎明 0.25=正午 0.50=黄昏 0.75=午夜
    this.dayLen=240;
    this.mining=null;
    this.particles=[];
    this.projectiles=[];
    this.arrows=this.projectiles;
    this.minions=[];
    this.damageTexts=[];
    this._attackSeq=0;
    this.drops=[];
    this.stingers=[];
    this.monsters=[];
    this.npcs=[];
    this.boss=null;
    this.hardmode=false;
    this.pillars=[];
    this.lunarActive=false;
    this.bloodMoon=false;
    this._bloodChecked=false;
    this.achievements={};
    this._achToast=null; this._achToastT=0;
    this._won=false;
    this.t=0;
    this.settingsOpen=false;
    this.diff=DIFFS.classic;
    this.newVol=window.AUDIO?window.AUDIO.getVolume():0.7;
    this.ui=new UI(this);
    this.bindInput();
    this.bindMenu();
  }
  Game.prototype.resize=function(){
    this.canvas.width=innerWidth;
    this.canvas.height=innerHeight;
    this.ctx.imageSmoothingEnabled=false;
  };

  Game.prototype.start=function(loadSave){
    let seed;
    if(loadSave){
      const data=window.SAVE.load();
      if(data){ seed=data.seed; this._pendingSave=data; }
    }
    // 浏览器大世界：1680×520 格
    // 地表约 22%，洞穴层约 45%，地狱约 85%，往下挖不再很快到底
    this.world=new World(1680,520,seed);
    const sx=Math.floor(this.world.w/2), gy=this.world.heightStart;
    this.player=new Player(this.world, sx*TS, gy*TS);
    // 起手物品
    this.player.give('i_pick_wood',1);
    this.player.give('i_axe_wood',1);
    this.player.give('i_sword_wood',1);
    this.player.give('i_torch',10);
    this.player.give('i_dirt',50);
    this.player.cur=0;
    // 向导 NPC
    this.npcs.push(new Guide(this.world, sx*TS-30, (gy-1)*TS));
    // 商人 NPC（在出生点旁边，需金币达到 50 银才显示）
    const merch=new Merchant(this.world, sx*TS+30, (gy-1)*TS);
    this.npcs.push(merch);
    // 护士 NPC（需最大生命过 100，入住到玩家建造的房屋）
    const nurse=new Nurse(this.world, sx*TS+60, (gy-1)*TS);
    this.npcs.push(nurse);
    this.npcHome=null; // 记录 NPC 入住点
    // 地牢老人（站在地牢入口）
    if(this.world.dungeon){
      const dx=this.world.dungeon.x, dy=this.world.dungeon.y;
      this.npcs.push(new OldMan(this.world, dx*TS+16, dy*TS));
    }
    // 加载存档
    if(this._pendingSave){ window.SAVE.applyTo(this, this._pendingSave); this._pendingSave=null; }
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    this.lastT=performance.now();
    this.running=true;
    requestAnimationFrame(this.loop.bind(this));
  };

  Game.prototype.save=function(){
    if(window.SAVE) window.SAVE.save(this);
  };

  Game.prototype.bindInput=function(){
    const k=this.input;
    addEventListener('keydown',e=>{
      if(e.code==='F1'){ e.preventDefault(); toggleConsole(); return; }
      if(consoleOpen()) return;   // 控制台打开时忽略游戏按键
      if(['KeyA','ArrowLeft'].includes(e.code)) k.left=true;
      if(['KeyD','ArrowRight'].includes(e.code)) k.right=true;
      if(['Space','KeyW','ArrowUp'].includes(e.code)){ k.jump=true; e.preventDefault(); }
      if(['KeyS','ArrowDown'].includes(e.code)) k.down=true;
      if(e.code==='KeyE'){
        this.ui.invOpen=!this.ui.invOpen;
        if(this.ui.invOpen) this.ui.achOpen=false;
        if(window.AUDIO) AUDIO.play('open');
      }
      if(e.code==='KeyB'){
        this.ui.achOpen=!this.ui.achOpen;
        if(this.ui.achOpen) this.ui.invOpen=false;
        if(window.AUDIO) AUDIO.play('open');
      }
      if(e.code==='KeyN'){ this.ui.minimap=!this.ui.minimap; }
      if(e.code==='KeyT'){ this.dropSelected(); }
      if(e.code==='KeyH'){ this.tryHeal(); }
      if(e.code==='KeyM'){ this.usePotion('i_star'); }
      if(e.code==='KeyF'){ this.tryOldManSummon(); }
      if(e.code==='KeyP'){ if(window.AUDIO){ const m=AUDIO.toggleMute(); console.log('mute',m); } }
      // 数字键 / 滚轮
      if(/^Digit[1-8]$/.test(e.code)){ this.player.cur=+e.code.slice(5)-1; }
    });
    addEventListener('keyup',e=>{
      if(['KeyA','ArrowLeft'].includes(e.code)) k.left=false;
      if(['KeyD','ArrowRight'].includes(e.code)) k.right=false;
      if(['Space','KeyW','ArrowUp'].includes(e.code)) k.jump=false;
      if(['KeyS','ArrowDown'].includes(e.code)) k.down=false;
    });
    const c=this.canvas;
    addEventListener('mousemove',e=>{
      this.mouse.x=e.clientX; this.mouse.y=e.clientY;
    });
    addEventListener('mousedown',e=>{
      if(this.ui.invOpen||this.settingsOpen) return;
      if(e.button===0) this.mouse.left=true;
      if(e.button===2) this.mouse.right=true;
    });
    addEventListener('mouseup',e=>{
      if(this.settingsOpen) return;
      if(e.button===0) this.mouse.left=false; if(e.button===2) this.mouse.right=false;
    });
    addEventListener('contextmenu',e=>e.preventDefault());
    addEventListener('wheel',e=>{
      if(this.settingsOpen){ e.preventDefault(); return; }
      if(this.ui.invOpen){
        this.ui.scrollBy(e.deltaY>0?28:-28);
        e.preventDefault();
        return;
      }
      this.player.cur=(this.player.cur+(e.deltaY>0?1:-1)+8)%8;
    },{passive:false});
    // 背包内点击：合成 / 拖滚动条由 ui 自身处理
    addEventListener('mousedown',e=>{
      if(this.ui.invOpen){ this.ui.mouseDown(e.clientX,e.clientY,e.button); return; }
    });
    addEventListener('mousemove',e=>{ if(this.ui.invOpen) this.ui.mouseMove(e.clientX,e.clientY); });
    addEventListener('mouseup',e=>{ if(this.ui.invOpen) this.ui.mouseUp(); });
  };
  Game.prototype.usePotion=function(it){
    const p=this.player;
    if((p.inv[it]||0)<=0) return;
    let used=false;
    if(it==='i_heart' && p.hp<p.maxHp){ p.hp=Math.min(p.maxHp,p.hp+100); p.inv[it]--; if(p.inv[it]<=0)delete p.inv[it]; used=true; }
    if(it==='i_star'  && p.mp<p.maxMp){ p.mp=Math.min(p.maxMp,p.mp+100); p.inv[it]--; if(p.inv[it]<=0)delete p.inv[it]; used=true; }
    if(used && window.AUDIO) AUDIO.play('potion');
  };
  // 治疗：靠近护士时优先让护士治疗，否则用药水
  Game.prototype.tryHeal=function(){
    const p=this.player;
    const nurse=this.npcs.find(n=>n.heal && n.spawned);
    if(nurse){
      const dx=p.x-nurse.x, dy=p.y-nurse.y;
      if(Math.abs(dx)<70 && Math.abs(dy)<70 && p.hp<p.maxHp){
        const cost=nurse.heal(p);
        if(cost>0){ if(window.AUDIO) window.AUDIO.play('potion'); return; }
        if(cost===-1){ // 钱不够
          this._msg='金币不足，无法治疗'; this._msgT=this.t;
          if(window.AUDIO) window.AUDIO.play('mine');
          return;
        }
      }
    }
    this.usePotion('i_heart');
  };
  Game.prototype.bindMenu=function(){
    // 难度选择
    const row=document.getElementById('diff-row');
    const hint=document.getElementById('diff-hint');
    const hintText={
      classic:'当前：经典 · 适合熟悉操作与探索',
      expert:'当前：专家 · 敌怪更硬更疼，掉落金币惩罚更高',
      master:'当前：大师 · 极限挑战，死亡清空金币'
    };
    if(row){
      row.querySelectorAll('.diff-btn').forEach(btn=>{
        btn.onclick=()=>{
          row.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          const k=btn.getAttribute('data-diff');
          this.diff=DIFFS[k]||DIFFS.classic;
          if(hint) hint.textContent=hintText[k]||hintText.classic;
        };
      });
    }
    document.getElementById('btn-start').onclick=()=>this.start(false);
    const btnCont=document.getElementById('btn-continue');
    if(btnCont){
      btnCont.onclick=()=>this.start(true);
      // 若无存档则隐藏
      if(!window.SAVE.load()) btnCont.style.display='none';
    }
    document.getElementById('btn-howto').onclick=()=>{
      const p=document.getElementById('howto');p.classList.toggle('hidden');
      document.getElementById('credit').classList.add('hidden');
    };
    document.getElementById('btn-credit').onclick=()=>{
      const p=document.getElementById('credit');p.classList.toggle('hidden');
      document.getElementById('howto').classList.add('hidden');
    };
    document.getElementById('btn-respawn').onclick=()=>this.respawn();
    document.getElementById('btn-tomenu').onclick=()=>location.reload();
    const vc=document.getElementById('btn-victory-continue');
    if(vc) vc.onclick=()=>{ document.getElementById('victory').classList.add('hidden'); this.running=true; this.lastT=performance.now(); requestAnimationFrame(this.loop.bind(this)); };
    const vm=document.getElementById('btn-victory-menu');
    if(vm) vm.onclick=()=>location.reload();
  };

  // 成就定义
  const ACH_DEFS=[
    {id:'first_blood', name:'初战告捷', desc:'击杀任意怪物'},
    {id:'eoc', name:'眼球之主', desc:'击败克苏鲁之眼'},
    {id:'eow', name:'蠕虫猎手', desc:'击败世界吞噬者'},
    {id:'queenbee', name:'养蜂人', desc:'击败蜂后'},
    {id:'skeletron', name:'骨头收藏家', desc:'击败骷髅王'},
    {id:'wof', name:'地狱来客', desc:'击败血肉墙'},
    {id:'hardmode', name:'世界震动', desc:'进入困难模式'},
    {id:'destroyer', name:'拆解者', desc:'击败毁灭者'},
    {id:'twins', name:'双目全灭', desc:'击败双子魔眼'},
    {id:'prime', name:'机械恐惧', desc:'击败骷髅统帅'},
    {id:'plantera', name:'园丁', desc:'击败世纪之花'},
    {id:'golem', name:'神庙破坏者', desc:'击败石巨人'},
    {id:'cultist', name:'邪教终结', desc:'击败拜月邪教徒'},
    {id:'moonlord', name:'泰拉征服者', desc:'击败月亮领主'},
    {id:'rich', name:'小富', desc:'持有 1 金以上'},
    {id:'maxhp', name:'钢铁心脏', desc:'最大生命达到 400'},
    {id:'hell', name:'深入地狱', desc:'抵达地狱层'},
    {id:'full_set', name:'盛装登场', desc:'穿齐三件套装'},
  ];
  Game.prototype.unlockAch=function(id){
    if(!this.achievements) this.achievements={};
    if(this.achievements[id]) return;
    const def=ACH_DEFS.find(a=>a.id===id);
    if(!def) return;
    this.achievements[id]=true;
    this._achToast=def.name;
    this._achToastT=180;
    if(window.AUDIO) AUDIO.play('craft');
  };
  Game.prototype.checkAchievements=function(){
    const p=this.player;
    if(!p) return;
    const bd=p.bossDown||{};
    if(bd.eoc) this.unlockAch('eoc');
    if(bd.eow) this.unlockAch('eow');
    if(bd.queenbee) this.unlockAch('queenbee');
    if(bd.skeletron) this.unlockAch('skeletron');
    if(bd.wof) this.unlockAch('wof');
    if(bd.destroyer) this.unlockAch('destroyer');
    if(bd.twins) this.unlockAch('twins');
    if(bd.prime) this.unlockAch('prime');
    if(bd.plantera) this.unlockAch('plantera');
    if(bd.golem) this.unlockAch('golem');
    if(bd.cultist) this.unlockAch('cultist');
    if(bd.moonlord) this.unlockAch('moonlord');
    if(this.hardmode||(this.world&&this.world.hardmode)) this.unlockAch('hardmode');
    if(p.coins>=10000) this.unlockAch('rich');
    if(p.maxHp>=400) this.unlockAch('maxhp');
    if(this.world&&this.world.hellY!=null && p.y/TS>=this.world.hellY) this.unlockAch('hell');
    if(p.setBonus && p.setBonus().set) this.unlockAch('full_set');
  };
  Game.prototype.showVictory=function(){
    this.running=false;
    this._won=true;
    this.unlockAch('moonlord');
    const box=document.getElementById('victory');
    if(!box) return;
    const stats=document.getElementById('victory-stats');
    const achN=Object.keys(this.achievements||{}).length;
    if(stats){
      stats.innerHTML=
        '<div>难度：<b>'+(this.diff?this.diff.name:'经典')+'</b></div>'+
        '<div>最大生命：<b>'+this.player.maxHp+'</b> · 金币：<b>'+this.player.coins+'</b></div>'+
        '<div>成就：<b>'+achN+'</b> / '+ACH_DEFS.length+'</div>'+
        '<div>困难模式：<b>'+(this.hardmode?'是':'否')+'</b></div>';
    }
    box.classList.remove('hidden');
    this.save();
  };
  Game.prototype.dropSelected=function(){
    const p=this.player;
    if(!p) return;
    // 优先丢背包选中悬停；否则丢当前快捷栏 1 个
    const it=p.hotbar[p.cur];
    if(!it || (p.inv[it]||0)<=0){ this._msg='没有可丢弃的物品'; this._msgT=this.t; return; }
    p.takeInv(it,1);
    this.spawnDrop(p.x+p.w/2+(p.facing?20:-20), p.y, it, 1);
    // 丢出的掉落物短时不可拾取
    const d=this.drops[this.drops.length-1];
    if(d) d.life=Math.min(d.life, 600), d.noPickup=45;
    if(window.AUDIO) AUDIO.play('mine');
    this._msg='丢弃 '+(window.ITEMS.NAMES[it]||it); this._msgT=this.t;
  };
  window.ACH_DEFS=ACH_DEFS;
  // 按难度缩放实体血量
  Game.prototype.scaleEntity=function(ent){
    if(!ent||!this.diff) return ent;
    const m=this.diff.hpMul||1;
    if(m===1) return ent;
    if(ent.hp!=null){ ent.hp=Math.round(ent.hp*m); ent.maxHp=Math.round((ent.maxHp||ent.hp)*m); }
    if(ent.segments){
      for(const s of ent.segments){ s.hp=Math.round(s.hp*m); s.maxHp=Math.round((s.maxHp||s.hp)*m); }
      if(ent.maxTotalHp!=null) ent.maxTotalHp=Math.round(ent.maxTotalHp*m);
      if(ent.totalHp!=null) ent.totalHp=ent.hpLeft?ent.hpLeft():ent.totalHp;
    }
    if(ent.arms){
      for(const a of ent.arms){ a.hp=Math.round(a.hp*m); a.maxHp=Math.round((a.maxHp||a.hp)*m); }
    }
    if(ent.eyes){
      for(const e of ent.eyes){ e.hp=Math.round(e.hp*m); e.maxHp=Math.round((e.maxHp||e.hp)*m); }
    }
    if(ent.fists){
      for(const f of ent.fists){ f.hp=Math.round(f.hp*m); f.maxHp=Math.round((f.maxHp||f.hp)*m); }
    }
    if(ent.core){ ent.core.hp=Math.round(ent.core.hp*m); ent.core.maxHp=Math.round((ent.core.maxHp||ent.core.hp)*m); }
    // 双子魔眼等独立命名子部件
    for(const k of ['retinazer','spazmatism']){
      if(ent[k]){ ent[k].hp=Math.round(ent[k].hp*m); ent[k].maxHp=Math.round((ent[k].maxHp||ent[k].hp)*m); }
    }
    return ent;
  };
  Game.prototype.respawn=function(){
    const sx=Math.floor(this.world.w/2), gy=this.world.heightStart;
    this.player.x=sx*TS; this.player.y=gy*TS;
    this.player.hp=this.player.maxHp; this.player.mp=this.player.maxMp;
    this.player.invuln=120;
    this.player.weaponCooldown=0; this.player.manaRegenDelay=0;
    this.projectiles=[]; this.arrows=this.projectiles; this.minions=[];
    document.getElementById('overlay').classList.add('hidden');
    this.monsters=[];
    // 恢复游戏循环（死亡时 running=false 且 rAF 链已断）
    this.running=true;
    this.lastT=performance.now();
    requestAnimationFrame(this.loop.bind(this));
  };

  // ---------- 设置界面（HTML 覆盖层，菜单/游戏内通用） ----------
  Game.prototype.openSettings=function(){
    this.toggleSettings(true);
  };
  Game.prototype.closeSettings=function(){
    this.toggleSettings(false);
  };
  Game.prototype.toggleSettings=function(show){
    const el=document.getElementById('settings');
    if(!el) return;
    this.settingsOpen = show!==undefined ? show : !this.settingsOpen;
    if(this.settingsOpen) el.classList.remove('hidden');
    else el.classList.add('hidden');
    if(window.AUDIO){
      this.newVol=window.AUDIO.getVolume();
      AIM.setVolDisplay(this.newVol);
      AUDIO.play('open');
    }
  };

  // 把鼠标屏幕坐标转换为世界瓦片坐标
  Game.prototype.mouseTile=function(){
    const wx=this.cam.x+this.mouse.x, wy=this.cam.y+this.mouse.y;
    return {tx:Math.floor(wx/TS),ty:Math.floor(wy/TS),wx,wy};
  };
  // 鼠标指向的实体（怪物/Boss/天界柱），无则 null
  Game.prototype.entityAtMouse=function(tx,ty){
    const mx=(tx+0.5)*TS, my=(ty+0.5)*TS;
    const list=this.monsters.filter(m=>m.alive);
    if(this.boss&&this.boss.alive) list.push(this.boss);
    if(this.pillars) for(const pl of this.pillars) if(pl.alive) list.push(pl);
    for(const e of list){
      if(e.getSegments){
        for(const s of e.getSegments()){
          if(s.alive===false) continue;
          if(mx>=s.x&&mx<=s.x+s.w&&my>=s.y&&my<=s.y+s.h) return {ent:e,seg:s};
        }
      } else if(mx>=e.x&&mx<=e.x+e.w&&my>=e.y&&my<=e.y+e.h){
        return {ent:e};
      }
    }
    return null;
  };

  Game.prototype.loop=function(now){
    if(!this.running) return;
    const dt=Math.min(50, now-this.lastT)/16.66; this.lastT=now;
    this.t+=dt;
    if(!this.ui.invOpen && !this.ui.achOpen && !this.settingsOpen && !consoleOpen()) this.update(dt);
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  };

  Game.prototype.update=function(dt){
    const prev=this.dayTime;
    this.dayTime=(this.dayTime+dt/60/this.dayLen)%1;
    // 昼夜切换音 + BGM 同步
    if(window.AUDIO){ AUDIO.setDayPhase(this.dayTime); }
    const enterNight = prev<0.55 && this.dayTime>=0.55;
    const enterDay   = prev>0.95 && this.dayTime<=0.05;
    if((enterNight||enterDay) && window.AUDIO){ AUDIO.play(enterNight?'night':'day'); }
    // 血月：进入夜晚时 12% 概率
    if(enterNight){
      this.bloodMoon = Math.random()<0.12;
      if(this.bloodMoon){ this._msg='血月升起……怪物更凶了！'; this._msgT=this.t; if(window.AUDIO) AUDIO.play('night'); }
    }
    if(enterDay) this.bloodMoon=false;
    const p=this.player;
    p.update(this.input,dt);
    // 装备特效粒子（参考原版：靴子奔跑拖尾 / 云瓶跳跃云迹 / 熔岩套火星）
    if(p.equip.acc.indexOf('i_acc_hermes')!==-1 && Math.abs(p.vx)>2.6 && p.onGround && Math.random()<0.35){
      this.particles.push({x:p.x+p.w/2-p.vx*0.4, y:p.y+p.h-2, vx:-p.vx*0.3+(Math.random()-.5), vy:-Math.random()*0.8, life:16, c:'#c8b888'});
    }
    if(p.equip.acc.indexOf('i_acc_cloud')!==-1 && !p.onGround && p.vy<0 && Math.random()<0.28){
      this.particles.push({x:p.x+p.w/2+(Math.random()-.5)*6, y:p.y+p.h-3, vx:(Math.random()-.5)*0.6, vy:0.5, life:22, c:'rgba(235,245,255,.75)'});
    }
    if(p.equip.head==='i_helm_molten'&&p.equip.body==='i_chest_molten'&&p.equip.legs==='i_legs_molten'&&p.onGround&&Math.random()<0.25){
      this.particles.push({x:p.x+Math.random()*p.w, y:p.y+p.h-1, vx:(Math.random()-.5)*0.8, vy:-Math.random()*0.6, life:14, c:Math.random()<0.5?'#ff9030':'#ffd040'});
    }
    // 相机跟随
    const cx=p.x+p.w/2 - this.canvas.width/2;
    const cy=p.y+p.h/2 - this.canvas.height/2;
    this.cam.x += (cx-this.cam.x)*0.15;
    this.cam.y += (cy-this.cam.y)*0.15;
    if(this.cam.x<0) this.cam.x=0; if(this.cam.x>this.world.w*TS-this.canvas.width) this.cam.x=this.world.w*TS-this.canvas.width;
    if(this.cam.y<0) this.cam.y=0; if(this.cam.y>this.world.h*TS-this.canvas.height) this.cam.y=this.world.h*TS-this.canvas.height;
    // 鼠标世界坐标
    this.mouse.wx=this.cam.x+this.mouse.x; this.mouse.wy=this.cam.y+this.mouse.y;

    // 挖掘 / 放置
    const mp=this.mouseTile();
    const reach=p.reach;
    const pcx=p.x+p.w/2, pcy=p.y+p.h/2;
    const inReach = Math.abs((mp.tx+0.5)*TS-pcx)<reach && Math.abs((mp.ty+0.5)*TS-pcy)<reach;
    const curItem=p.hotbar[p.cur];
    if(this.mouse.left && !this.ui.invOpen){
      const itDef=curItem?ITEM[curItem]:null;
      if(itDef && ['sword','bow','magic','minionStaff'].includes(itDef.kind)){
        this.useWeapon(curItem,itDef);
        this.mining=null;
      } else if(inReach){
        this.mine(mp.tx,mp.ty,curItem);
      } else {
        this.mining=null;
      }
    } else {
      this.mining=null;
    }
    if(this.mouse.right && !this.ui.invOpen){
      const ok=p.useItem(this.mouse.wx,this.mouse.wy,this.mouse.x,this.mouse.y);
      if(ok===true && window.AUDIO) AUDIO.play('place');
      else if(typeof ok==='string' && ok.startsWith('summon:')){
        if(this.summonBoss(ok.slice(7))){
          p.takeInv(curItem,1);
          if(window.AUDIO) AUDIO.play('night');
        } else { this._msg='当前无法召唤'; this._msgT=this.t; }
      } else if(ok==='voodoo'){
        if(this.trySummonWof()){
          p.takeInv(curItem,1);
        }
      }
      this.mouse.right=false; // 单击放置
    }

    // 怪物刷新：夜晚每 4 秒在屏幕外刷一只
    this.spawnTimer=(this.spawnTimer||0)+dt;
    const isNight=this.dayTime>0.55 && this.dayTime<0.95;
    const maxM=this.bloodMoon?14:8;
    const spawnEvery=this.bloodMoon?90:180;
    if(isNight && this.spawnTimer>spawnEvery && this.monsters.length<maxM){
      this.spawnTimer=0;
      const side=Math.random()<0.5?-1:1;
      const sx=Math.floor((this.cam.x+(side<0?-60:this.canvas.width+60))/TS);
      const gy=this.world.heightMap[Math.max(0,Math.min(this.world.w-1,sx))]-1;
      const x=sx*TS, y=gy*TS;
      if(Math.random()<0.7 || this.bloodMoon) this.monsters.push(this.scaleEntity(new Zombie(this.world,x,y)));
      else this.monsters.push(this.scaleEntity(new Slime(this.world,x,y)));
    }
    // 夜晚自然召唤 Boss：进度达标（拥有 40+ 生命 / 3000+ 金币）且未击败时低概率触发
    if(isNight && !this.boss && !p.bossDown.eoc && (p.maxHp>=40 || p.coins>=30000)){
      this._eocChance=(this._eocChance||0)+Math.random()*dt*0.004;
      if(this._eocChance>=1){
        this._eocChance=0;
        // 从玩家上方屏幕边缘飞来
        const px=p.x+p.w/2;
        const bx=px+(Math.random()<0.5?-260:260);
        this.boss=this.scaleEntity(new EoC(this.world, bx, p.y-200));
        if(window.AUDIO) AUDIO.play('night');
      }
    } else this._eocChance=0;

    // 困难模式：世纪之花花苞周期性刷新（未击败时）
    if(this.hardmode && !p.bossDown.plantera && this.world.spawnPlanteraBulb){
      this._bulbT=(this._bulbT||0)+dt;
      if(this._bulbT>1800){ this._bulbT=0; this.world.spawnPlanteraBulb(); }
    }
    // 击败石巨人后：地牢入口生成拜月邪教徒
    if(p.bossDown.golem && !p.bossDown.cultist && !p.bossDown.moonlord){
      this.trySpawnCultist();
    }
    // 困难模式机械 Boss：夜间低概率自然出现（未击败时）
    if(this.hardmode && isNight && !this.boss){
      this._mechChance=(this._mechChance||0)+Math.random()*dt*0.0012;
      if(this._mechChance>=1){
        this._mechChance=0;
        const px=p.x+p.w/2;
        const bx=px+(Math.random()<0.5?-300:300);
        if(!p.bossDown.destroyer){ this.boss=this.scaleEntity(new Destroyer(this.world,bx,p.y-100)); }
        else if(!p.bossDown.twins){ this.boss=this.scaleEntity(new Twins(this.world,bx,p.y-100)); }
        else if(!p.bossDown.prime){ this.boss=this.scaleEntity(new SkeletronPrime(this.world,bx,p.y-100)); }
        if(this.boss){ if(window.AUDIO) AUDIO.play('night'); this._msg='机械 Boss 来袭！'; this._msgT=this.t; }
      }
    } else this._mechChance=0;

    // 白天偶发史莱姆
    if(!isNight && Math.random()<0.003 && this.monsters.length<4){
      const side=Math.random()<0.5?-1:1;
      const sx=Math.floor((this.cam.x+(side<0?-60:this.canvas.width+60))/TS);
      const gy=this.world.heightMap[Math.max(0,Math.min(this.world.w-1,sx))]-1;
      this.monsters.push(this.scaleEntity(new Slime(this.world,sx*TS,gy*TS)));
    }

    // 更新怪物
    for(const m of this.monsters){
      const wasAlive=m.alive;
      m.update(p);
      if(wasAlive && !m.alive){ this.dropMonster(m); this.unlockAch('first_blood'); }
    }
    for(const n of this.npcs) n.update(p);
    // NPC 入住：玩家建好房子后，让已满足入住条件的 NPC 移入屋内
    this.updateHousing(p);
    if(this.boss){
      const wasAlive=this.boss.alive;
      this.boss.update(p);
      if(wasAlive && !this.boss.alive){ this.boss=null; }
    }
    // 天界柱（月球事件）
    if(this.pillars && this.pillars.length){
      for(const pl of this.pillars){ if(pl.alive) pl.update(p); }
      this.pillars=this.pillars.filter(pl=>pl.alive);
      if(this.lunarActive && this.pillars.length===0){
        this.lunarActive=false;
        // 一分钟后（这里简化：立即）召唤月亮领主
        if(!this.boss && !p.bossDown.moonlord){
          this.boss=this.scaleEntity(new MoonLord(this.world, p.x-50, p.y-160));
          this._msg='四柱尽灭……月亮领主降临！'; this._msgT=this.t;
          if(window.AUDIO) AUDIO.play('night');
        }
      }
    }
    this.monsters=this.monsters.filter(m=>m.alive && m.y<this.world.h*TS+400);

    // 玩家投射物与召唤物
    this.updateArrows();
    this.updateMinions();
    // 蜂后毒刺
    this.updateStingers();
    // 掉落物
    this.updateDrops();
    // 成就检查
    this.checkAchievements();
    // 通关结算（月亮领主后）
    if((p.bossDown && p.bossDown.moonlord && this._pendingVictory) || (this._pendingVictory && !this.boss)){
      this._pendingVictory=false;
      this.showVictory();
    }
    // 丛林偶发黄蜂
    if(Math.random()<0.002 && this.monsters.length<10){
      const bx=Math.floor((this.cam.x+this.canvas.width/2)/TS);
      if(this.world.biomeMap && this.world.biomeMap[Math.max(0,Math.min(this.world.w-1,bx))]==='jungle'){
        const side=Math.random()<0.5?-1:1;
        const sx=Math.floor((this.cam.x+(side<0?-40:this.canvas.width+40))/TS);
        const gy=this.world.heightMap[Math.max(0,Math.min(this.world.w-1,sx))]-2;
        this.monsters.push(this.scaleEntity(new Bee(this.world,sx*TS,gy*TS)));
      }
    }
    // 地狱恶魔
    if(this.world.hellY!=null && p.y/TS>this.world.hellY && Math.random()<0.004 && this.monsters.length<12){
      const side=Math.random()<0.5?-1:1;
      const sx=p.x+(side<0?-120:120)+(Math.random()*40-20);
      const sy=p.y-40-Math.random()*60;
      this.monsters.push(this.scaleEntity(new Demon(this.world,sx,sy)));
    }
    // 岩浆伤害
    {
      const ftx=Math.floor((p.x+p.w/2)/TS), fty=Math.floor((p.y+p.h-2)/TS);
      if(this.world.get(ftx,fty)===27 || this.world.get(ftx,fty+1)===27){
        // 熔岩套可大幅减伤（简化：有熔岩套则伤害更低）
        const molten=p.equip.head==='i_helm_molten'&&p.equip.body==='i_chest_molten'&&p.equip.legs==='i_legs_molten';
        p.tryHurt(molten?4:14);
      }
    }

    // 跌落物？这里简化：挖掉方块直接给物品
    // 粒子
    for(const pt of this.particles){ pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=0.2; pt.life--; }
    this.particles=this.particles.filter(p=>p.life>0);
    for(const d of this.damageTexts){d.y+=d.vy;d.vy*=0.96;d.life--;}
    this.damageTexts=this.damageTexts.filter(d=>d.life>0);

    // 死亡
    if(p.hp<=0){ this.die(); }
    // 自动存档：每 30 秒
    this._autoSaveT=(this._autoSaveT||0)+dt;
    if(this._autoSaveT>1800){ this._autoSaveT=0; this.save(); }
  };

  Game.prototype.dropMonster=function(m){
    const drops=DATA.DROPS[m.constructor.name.toLowerCase()] || DATA.DROPS[m.type];
    if(!drops) return;
    const mx=m.x+m.w/2, my=m.y+m.h/2;
    for(const [item,min,max,ch] of drops){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n<=0) continue;
        this.spawnDrop(mx,my,item,n);
      }
    }
  };
  // 生成一个掉落实体（喷出→落地→靠近拾取）
  Game.prototype.spawnDrop=function(x,y,item,n){
    // 金币直接入钱包
    if(item==='i_copper_coin'||item==='i_silver_coin'||item==='i_gold_coin'||item==='i_platinum_coin'){
      this.player.give(item,n);
      return;
    }
    this.drops.push({
      x, y, w:10, h:10,
      vx:(Math.random()-0.5)*3, vy:-Math.random()*4-1,
      item, n,
      life: 720,           // 存在时间（约12秒后消失）
      onGround:false
    });
  };
  // 更新掉落物（重力/落地/拾取）
  Game.prototype.updateDrops=function(){
    const p=this.player;
    const pcx=p.x+p.w/2, pcy=p.y+p.h/2;
    for(const d of this.drops){
      d.vy += 0.3; if(d.vy>8)d.vy=8;
      d.x += d.vx; d.y += d.vy;
      // 水平碰撞
      const tx0=Math.floor(d.x/TS), ty0=Math.floor(d.y/TS);
      // 落地（垂直）
      const footY=d.y+d.h;
      if(this.world.isSolid(Math.floor(d.x/TS), Math.floor(footY/TS))){
        // 找地面
        if(d.vy>0){ d.y=Math.floor(d.y/TS)*TS - d.h; d.vy=0; d.onGround=true; }
      }
      // 丢弃延迟：短时不可拾取
      if(d.noPickup>0){ d.noPickup--; d.life--; continue; }
      // 拾取：玩家靠近即吸引
      const dx=pcx-(d.x+d.w/2), dy=pcy-(d.y+d.h/2);
      const dist=Math.hypot(dx,dy);
      if(dist<48){
        d.x += (dx/Math.max(1,dist))*4.5;
        d.y += (dy/Math.max(1,dist))*4.5;
      }
      if(dist<16){
        p.give(d.item,d.n);
        if(window.AUDIO) AUDIO.play('pickup');
        d.n=0;
      }
      d.life--;
    }
    this.drops=this.drops.filter(d=>d.n>0 && d.life>0);
  };

  // 工具类型：pick 镐(石/矿)、axe 斧(木)、sword 剑(草/叶/无)，否则手
  // tile 分类
  function tileKind(t){
    if(t===1||t===2||t===18) return 'dirt';   // grass/dirt/snow 都按软土
    if(t===24||t===25) return 'dirt';         // 丛林草/泥
    if(t===38) return 'dirt';                 // 腐化草
    if(t===3||t===19||t===39||t===44) return 'stone'; // stone/ice/ebonstone/dungeon
    if(t>=20 && t<=23||t===28||t===29) return 'stone'; // 矿石
    if(t===4||t===5) return 'wood';
    if(t===6) return 'sand';
    if(t===7||t===8||t===10||t===11||t===12||t===13||t===14||t===15||t===16) return 'build';
    if(t===17||t===43) return 'misc'; // pot / larva
    if(t===41) return 'stone'; // hive
    if(t===45) return 'dirt'; // ash
    if(t===46||t===47||t===48||t===49||t===50||t===57) return 'stone'; // hellstone/hardmode/chlorophyte ores
    if(t===52||t===55) return 'stone'; // pearlstone / lihzahrd
    if(t===27) return 'misc'; // lava
    if(t===54||t===56) return 'misc'; // plantera bulb / temple altar
    if(t>=30 && t<=37) return 'stone'; // 水晶/宝石
    return 'misc';
  }
  function toolOf(item){
    if(!item) return 'hand';
    if(item.startsWith('i_pick')) return 'pick';
    if(item.startsWith('i_axe'))  return 'axe';
    if(item.startsWith('i_sword'))return 'sword';
    return 'hand';
  }
  function toolPower(item){
    const def=item && ITEM[item];
    if(!def) return 0;
    return def.power||1;
  }
  // 返回每帧挖掘进度增量
  function mineSpeed(t,item){
    const k=tileKind(t), tool=toolOf(item);
    const def=TILE[t] || {};
    const hard=def.hard||0;
    const base = {dirt:0.10, sand:0.16, wood:0.08, stone:0.05, build:0.07, misc:0.10}[k]||0.05;
    // 工具强度对照 hard：power >= hard+1 才能正常速度，否则减半
    const pw=toolPower(item);
    let matMul=1;
    if(tool==='pick'){
      matMul = pw>=hard+1 ? 1.6 : 0.5;
      if(item==='i_pick_wood') matMul=1.0;
      else if(item==='i_pick_copper') matMul=1.2;
      else if(item==='i_pick_iron') matMul=1.6;
      else if(item==='i_pick_silver') matMul=2.0;
      else if(item==='i_pick_gold') matMul=2.4;
      else if(item==='i_pick_demonite') matMul=3.0;
      else if(item==='i_pick_molten') matMul=3.6;
      else if(item==='i_pick_cobalt') matMul=4.0;
    } else if(tool==='axe'){
      matMul = item==='i_axe_iron'?1.6 : item==='i_axe_copper'?1.2 : item==='i_axe_gold'?2.0 : 1.0;
    } else {
      matMul = 0.5;
    }
    const right = (k==='stone' && tool==='pick') || (k==='wood' && tool==='axe')
               || ((k==='dirt'||k==='sand'||k==='misc') && (tool==='pick'||tool==='axe'||tool==='sword'||tool==='hand'))
               || (k==='build' && (tool==='pick'||tool==='axe'));
    let s = right ? base*matMul : base*0.15;
    if(tool==='hand') s = Math.min(s, 0.06);
    return s;
  }
  Game.prototype.mine=function(tx,ty,item){
    const W=this.world, t=W.get(tx,ty), d=W.getDef(t);
    if(t===0 || !d.sprite) return;
    if(!this.mining || this.mining.tx!==tx || this.mining.ty!==ty) this.mining={tx,ty,prog:0};
    const speed=mineSpeed(t,item);
    this.mining.prog += speed;
    this.mining.speed=speed;
    // 粒子（按方块色）
    if(Math.random()<0.4){
      const col={dirt:'#8a5a30',stone:'#6a6a72',wood:'#8a5a2a',leaves:'#3a8a3a',sand:'#d8c890',
        iron_ore:'#bdbdc8',gold_ore:'#e8c850',copper_ore:'#d08040',coal:'#202028'}[d.sprite]||'#888';
      this.particles.push({x:tx*TS+8,y:ty*TS+8,vx:(Math.random()-.5)*2.2,vy:-Math.random()*2.5-0.5,life:22,c:col});
    }
    // 完成音
    if(this.mining.prog>=1){
      // 暗影珠：召唤世界吞噬者
      if(t===40){
        this.breakShadowOrb(tx,ty);
      } else if(t===43){
        // 蜂巢幼虫：召唤蜂后
        this.breakLarva(tx,ty);
      } else if(t===51){
        // 恶魔祭坛：需神锤
        const hasHammer=(this.player.inv.i_pwnhammer||0)>0 || this.player.hotbar.indexOf('i_pwnhammer')!==-1;
        if(!hasHammer){
          this._msg='需要神锤（血肉墙掉落）才能打碎祭坛'; this._msgT=this.t;
          this.mining=null;
          return;
        }
        const r=this.world.breakAltar(tx,ty);
        if(r){
          this._msg='祭坛碎裂！新增 '+r.ores+' 个困难矿石（已打碎 '+r.broken+' 座）'; this._msgT=this.t;
          if(window.AUDIO) AUDIO.play('mine_done');
        }
      } else if(t===54){
        // 世纪之花花苞：召唤世纪之花
        this.world.set(tx,ty,0);
        if(this.boss){ this.mining=null; }
        else {
          this.boss=this.scaleEntity(new Plantera(this.world, tx*TS, ty*TS-30));
          if(window.AUDIO) AUDIO.play('night');
          this._msg='世纪之花苏醒！'; this._msgT=this.t;
        }
        if(this.world.planteraBulbs){
          this.world.planteraBulbs=this.world.planteraBulbs.filter(b=>!(b.x===tx&&b.y===ty));
        }
      } else if(t===56){
        // 神庙祭坛：需蜥蜴电池 + 神庙钥匙召唤石巨人
        const p=this.player;
        const hasKey=(p.inv.i_temple_key||0)>0 || p.bossDown.plantera;
        const hasBat=(p.inv.i_lihzahrd_battery||0)>0;
        if(!hasKey){ this._msg='需要神庙钥匙（世纪之花掉落）'; this._msgT=this.t; this.mining=null; return; }
        if(!hasBat){ this._msg='需要蜥蜴电池'; this._msgT=this.t; this.mining=null; return; }
        if(this.boss){ this.mining=null; return; }
        p.takeInv('i_lihzahrd_battery',1);
        this.boss=this.scaleEntity(new Golem(this.world, tx*TS, ty*TS-50));
        if(window.AUDIO) AUDIO.play('night');
        this._msg='石巨人苏醒！'; this._msgT=this.t;
      } else if(t===17){
        // 罐子：直接给随机杂物
        const loot=['i_copper_coin','i_heart','i_star','i_torch','i_mushroom','i_glass_bottle','i_fallen_star'];
        const k=loot[Math.floor(Math.random()*loot.length)];
        this.player.give(k, 1+Math.floor(Math.random()*4));
        if(window.AUDIO) AUDIO.play('craft');
      } else if(t===16){
        // 木宝箱：把已记录的物品给玩家
        const chest=this.world.chests.find(c=>c.x===tx && c.y===ty);
        if(chest){
          for(const k in chest.items) this.player.give(k, chest.items[k]);
          if(window.AUDIO) AUDIO.play('craft');
        }
      } else {
        const drop=d.drop;
        if(drop){
          const n = (t===5?2:1);
          // 方块掉落物：弹出可拾取（草/树叶→地只给泥土/木材）
          this.spawnDrop(tx*TS+8, ty*TS+8, 'i_'+drop, n);
          if(window.AUDIO) AUDIO.play('mine_done');
        }
      }
      // 破坏粒子爆
      for(let i=0;i<8;i++){
        const col={grass:'#5a8a3a',dirt:'#8a5a30',stone:'#6a6a72',wood:'#8a5a2a',
          leaves:'#3a8a3a',sand:'#d8c890',iron_ore:'#bdbdc8',gold_ore:'#e8c850',
          copper_ore:'#d08040',coal:'#202028',snow:'#e8e8f0',ice:'#a8c8e8',
          jungle_grass:'#3a8a3a',mud:'#5a4a3a',corruption_grass:'#6a3a8a',ebonstone:'#4a3a5a',
          pot:'#a89070',chest:'#a08050'}[d.sprite]||'#888';
        this.particles.push({x:tx*TS+8,y:ty*TS+8,vx:(Math.random()-.5)*4,vy:-Math.random()*3,life:26,c:col});
      }
      W.set(tx,ty,0);
      this.mining=null;
    } else if(window.AUDIO && this.t - (this._lastMineSnd||0) > 8){
      AUDIO.play('mine'); this._lastMineSnd=this.t;
    }
  };
  // 打碎暗影珠：最高几率降魔矿/饰品；第三颗召唤世界吞噬者
  Game.prototype.breakShadowOrb=function(tx,ty){
    const world=this.world;
    const cx=tx*TS+8, cy=ty*TS+8;
    // 掉落
    const r=Math.random();
    if(r<0.5) this.spawnDrop(cx,cy,'i_demonite_ore',5+Math.floor(Math.random()*5));
    else if(r<0.8) this.spawnDrop(cx,cy,'i_demonite_scale',2+Math.floor(Math.random()*3));
    else this.spawnDrop(cx,cy,'i_mushroom',1+Math.floor(Math.random()*3));
    // 暗影珠计数器
    if(!this._orbCount) this._orbCount=0;
    this._orbCount++;
    // 提示
    if(this._showMessage){ /* 预留 */ }
    if(this._orbCount>=3 && !this.boss && this.dayTime>0.55){
      this._orbCount=0;
      this.summonEoW(cx, cy);
      if(window.AUDIO) AUDIO.play('night');
    }
    if(window.AUDIO) AUDIO.play('mine_done');
    // 清掉珠子（用旁边的石头替代）
    world.set(tx,ty,0);
  };
  // 召唤世界吞噬者（从暗影珠处破地而出）
  Game.prototype.summonEoW=function(x,y){
    if(this.boss) return;
    this.boss=this.scaleEntity(new EoW(this.world, x, y-40));
    if(window.AUDIO) AUDIO.play('night');
  };
  // 破坏蜂巢幼虫 → 蜂后
  Game.prototype.breakLarva=function(tx,ty){
    this.world.set(tx,ty,0);
    if(window.AUDIO) AUDIO.play('mine_done');
    if(this.boss) return;
    this.boss=this.scaleEntity(new QueenBee(this.world, tx*TS, ty*TS-40));
    if(window.AUDIO) AUDIO.play('night');
    this._msg='蜂后苏醒了！'; this._msgT=this.t;
  };
  // ===== 月球事件 =====
  Game.prototype.trySpawnCultist=function(){
    if(!this.player.bossDown.golem || this.player.bossDown.cultist || this.player.bossDown.moonlord) return;
    if(this.boss || (this.pillars && this.pillars.length)) return;
    if(this._cultistSpawned) return;
    // 地牢入口附近
    const d=this.world.dungeon;
    if(!d) return;
    const x=d.x*TS+8, y=(d.y-2)*TS;
    this.boss=this.scaleEntity(new Cultist(this.world, x, y));
    this._cultistSpawned=true;
    this._msg='地牢入口出现了拜月邪教徒……'; this._msgT=this.t;
  };
  Game.prototype.startLunarEvent=function(){
    if(this.lunarActive) return;
    this.lunarActive=true;
    this.pillars=[];
    const p=this.player;
    const types=['solar','nebula','vortex','stardust'];
    const baseX=p.x;
    for(let i=0;i<4;i++){
      const px=baseX+(i-1.5)*420+(Math.random()*60-30);
      const gy=this.world.heightMap[Math.max(0,Math.min(this.world.w-1,Math.floor(px/TS)))]||40;
      const py=(gy-8)*TS;
      this.pillars.push(this.scaleEntity(new Pillar(this.world, px, py, types[i])));
    }
    this._msg='四天界柱降临世界！摧毁它们！'; this._msgT=this.t;
  };
  Game.prototype.onPillarDown=function(pillar){
    const left=this.pillars?this.pillars.filter(pl=>pl.alive).length:0;
    this._msg=(pillar.getName?pillar.getName():'天界柱')+' 崩塌！剩余 '+left+' 柱'; this._msgT=this.t;
  };

  // 向导巫毒娃娃：在地狱岩浆附近使用，召唤血肉墙
  Game.prototype.trySummonWof=function(){
    if(this.boss){ this._msg='已有 Boss 战斗中'; this._msgT=this.t; return false; }
    if(this.player.bossDown && this.player.bossDown.wof){ this._msg='血肉墙已被击败'; this._msgT=this.t; return false; }
    const p=this.player;
    // 需在地狱层
    if(this.world.hellY==null || p.y/TS < this.world.hellY-2){
      this._msg='只能在地狱使用巫毒娃娃'; this._msgT=this.t; return false;
    }
    // 附近需有岩浆
    const cx=Math.floor((p.x+p.w/2)/TS), cy=Math.floor((p.y+p.h/2)/TS);
    let nearLava=false;
    for(let dy=-3;dy<=4;dy++) for(let dx=-3;dx<=3;dx++){
      if(this.world.get(cx+dx,cy+dy)===27){ nearLava=true; break; }
    }
    if(!nearLava){ this._msg='需要靠近岩浆投入巫毒娃娃'; this._msgT=this.t; return false; }
    // 向导需存活
    const guide=this.npcs.find(n=>n instanceof Guide || (n.draw && n.constructor && n.constructor.name==='Guide'));
    // Guide may not set a flag - check by prototype
    let hasGuide=false;
    for(const n of this.npcs){
      if(n.constructor && n.constructor.name==='Guide'){ hasGuide=true; n.alive=false; break; }
    }
    // 也接受 window.Guide 实例
    if(!hasGuide){
      for(const n of this.npcs){ if(n.talk!==undefined && n.w===14 && n.h===28 && !n.buy && !n.heal && !n.isOldMan){ /* maybe guide */ } }
    }
    // 简化：只要有 Guide 类实例就移除
    this.npcs=this.npcs.filter(n=>{
      if(n instanceof window.Guide){ return false; }
      return true;
    });
    const dir = p.x < this.world.w*TS/2 ? 1 : -1;
    const spawnX = dir>0 ? p.x-180 : p.x+180;
    this.boss=this.scaleEntity(new WallOfFlesh(this.world, spawnX, p.y-20, dir));
    if(window.AUDIO) AUDIO.play('night');
    this._msg='血肉墙苏醒了！！逃向另一侧！'; this._msgT=this.t;
    return true;
  };
  // 地牢老人召唤骷髅王
  Game.prototype.tryOldManSummon=function(){
    const old=this.npcs.find(n=>n.isOldMan && n.spawned);
    if(!old) return;
    const p=this.player;
    if(Math.abs(p.x-old.x)>80 || Math.abs(p.y-old.y)>80) return;
    if(old.trySummon(this)){
      this._msg='骷髅王出现了！'; this._msgT=this.t;
    } else {
      this._msg='只能在夜晚解放老人…'; this._msgT=this.t;
    }
  };
  Game.prototype.useWeapon=function(itemKey,def){
    const p=this.player;
    if(p.weaponCooldown>0) return false;
    const stats=p.combatStats(def.damageClass);
    if(def.useStyle==='summon'){
      if(!this.summonMinion(itemKey,def)) return false;
      p.weaponCooldown=Math.max(2,(def.useTime||20)/stats.attackSpeed);
      p._heldItem=itemKey; p._usePose=p.weaponCooldown;
      if(window.AUDIO) AUDIO.play('summon');
      return true;
    }
    if(def.kind==='magic' && !p.spendMana(def.mana||1)){
      this._msg='魔力不足'; this._msgT=this.t; if(window.AUDIO) AUDIO.play('mine'); return false;
    }
    if(def.kind==='bow'){
      const ammoKey=def.ammo==='bullet'?'i_bullet':'i_arrow';
      if((p.inv[ammoKey]||0)<=0){ this._msg=def.ammo==='bullet'?'没有子弹':'没有箭矢'; this._msgT=this.t; if(window.AUDIO) AUDIO.play('mine'); return false; }
      if(Math.random()>=stats.ammoSave) p.takeInv(ammoKey,1);
    }
    p.weaponCooldown=Math.max(2,(def.useTime||20)/stats.attackSpeed);
    p.facing=this.mouse.wx>=p.x+p.w/2;
    if(def.useStyle==='swing'){
      p.swing=1; p._heldItem=itemKey; p._swingMax=p.weaponCooldown;
      this.meleeAttack(def,itemKey);
      if(def.projectile) this.spawnWeaponProjectile(itemKey,def);
      if(window.AUDIO) AUDIO.play('sword');
    } else if(def.useStyle==='throw'){
      p.swing=0.8; p._heldItem=itemKey; this.spawnWeaponProjectile(itemKey,def);
      if(window.AUDIO) AUDIO.play('sword');
    } else {
      p._heldItem=itemKey; p._usePose=Math.max(4,p.weaponCooldown);
      this.spawnWeaponProjectile(itemKey,def);
      if(window.AUDIO) AUDIO.play(def.useStyle==='gun'?'gun':def.useStyle==='beam'?'beam':'magic');
    }
    return true;
  };
  Game.prototype.makeHit=function(def,source){
    const stats=this.player.combatStats(def.damageClass);
    const crit=Math.random()*100<(def.crit||0)+stats.crit;
    const variance=0.9+Math.random()*0.2;
    return {damage:Math.max(1,Math.round((def.dmg||1)*stats.damage*variance*(crit?2:1))),damageClass:def.damageClass||'melee',crit,knockback:(def.knockback||0)*stats.knockback,source:source||'player',attackId:++this._attackSeq};
  };
  Game.prototype.showDamage=function(x,y,hit){
    this.damageTexts.push({x,y,text:String(hit.damage),life:42,vy:-0.7,crit:!!hit.crit,cls:hit.damageClass});
    this.spawnHitParticles(x,y,hit.damageClass,hit.crit);
    if(hit.crit&&window.AUDIO) AUDIO.play('crit');
  };
  Game.prototype.hitEntity=function(target,hit,x,y,part){
    if(!target||!target.alive) return false;
    const now=this.t;
    if(target._hitUntil && target._hitUntil>now && target._lastAttackId===hit.attackId) return false;
    let damage=hit.damage;
    if(target.def) damage=Math.max(1,Math.round(damage-target.def*0.5));
    let ok=true;
    if(part&&part.kind==='segment'&&target.hitSegment) target.hitSegment(part.index,damage);
    else if(target.hurtAt && part&&part.x!=null) ok=target.hurtAt(part.x,part.y,damage)!==false;
    else if(target.hurtMe) target.hurtMe(damage);
    else { target.hp-=damage; target.hurt=10; if(target.hp<=0) target.alive=false; }
    if(!ok) return false;
    target._lastAttackId=hit.attackId; target._hitUntil=now+4;
    if(target.vx!=null&&hit.knockback){ const dir=x>this.player.x?1:-1; target.vx+=dir*hit.knockback; }
    this.showDamage(x,y,Object.assign({},hit,{damage}));
    return true;
  };
  Game.prototype.meleeAttack=function(def,itemKey){
    if(typeof def==='number') def={dmg:def,damageClass:'melee',reach:40,knockback:3,crit:4};
    const hit=this.makeHit(def,itemKey);
    const p=this.player, reach=def.reach||44;
    const cx=p.x+p.w/2, cy=p.y+p.h/2;
    const targets=[];
    for(const m of this.monsters) if(m.alive) targets.push(m);
    if(this.boss && this.boss.alive) targets.push(this.boss);
    if(this.pillars) for(const pl of this.pillars) if(pl.alive) targets.push(pl);
    const inArc=(x,y,extra)=>{
      const dist=Math.hypot(x-cx,y-cy);
      if(dist>reach+(extra||0)) return false;
      const ang=Math.atan2(y-cy,x-cx), dir=p.facing?0:Math.PI;
      let da=Math.abs(ang-dir); if(da>Math.PI) da=2*Math.PI-da;
      return da<Math.PI*0.62;
    };
    for(const m of targets){
      const candidates=[];
      if(m.getSegments){
        const segs=m.getSegments();
        for(let i=0;i<segs.length;i++){
          const s=segs[i]; if(s.alive===false) continue;
          candidates.push({x:s.x+s.w/2,y:s.y+s.h/2,kind:'segment',index:i,extra:8});
        }
      } else {
        if(m.arms) for(const a of m.arms) if(a.alive) candidates.push({x:a.x+a.w/2,y:a.y+a.h/2,extra:12});
        if(m.fists) for(const f of m.fists) if(f.alive) candidates.push({x:f.x+f.w/2,y:f.y+f.h/2,extra:10});
        if(m.eyes){
          const bx=m.x+m.w/2, by=m.y+m.h/2;
          for(const e of m.eyes) if(e.alive) candidates.push({x:e.x!=null?e.x+e.w/2:bx+(e.ox||0),y:e.y!=null?e.y+e.h/2:by+(e.oy||0),extra:16});
          if(m.core&&m.core.exposed) candidates.push({x:bx+(m.core.ox||0),y:by+(m.core.oy||0),extra:18});
        }
        if(!candidates.length) candidates.push({x:m.x+m.w/2,y:m.y+m.h/2,extra:8});
      }
      let best=null,bestDist=Infinity;
      for(const c of candidates){
        const d=Math.hypot(c.x-cx,c.y-cy);
        if(inArc(c.x,c.y,c.extra)&&d<bestDist){best=c;bestDist=d;}
      }
      if(best) this.hitEntity(m,hit,best.x,best.y,best);
    }
  };
  Game.prototype.spawnWeaponProjectile=function(itemKey,def){
    const p=this.player, cx=p.x+p.w/2, cy=p.y+p.h/2-2;
    const dx=this.mouse.wx-cx, dy=this.mouse.wy-cy;
    let ang=Math.atan2(dy,dx)+(Math.random()-.5)*(def.spread||0);
    const speed=def.velocity||11;
    const hit=this.makeHit(def,itemKey);
    const type=def.projectile||(def.useStyle==='gun'?'bullet':'arrow');
    if(def.useStyle==='beam'){
      this.projectiles.push({x:cx,y:cy,vx:Math.cos(ang),vy:Math.sin(ang),ang,type,life:4,range:520,beam:true,hit,pierce:8,hitTargets:[]});
      return;
    }
    this.projectiles.push({
      x:cx,y:cy,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,ang,type,life:type==='hatchet'?100:90,
      hit,pierce:def.pierce||1,bounce:def.bounce||0,homing:!!def.homing,gravity:['arrow','fireArrow','holyArrow','catBlade'].includes(type)?0.08:0,
      explosion:def.explosion||0,hitTargets:[],owner:'player'
    });
  };
  Game.prototype.summonMinion=function(itemKey,def){
    const stats=this.player.combatStats('summon');
    const used=this.minions.reduce((n,m)=>n+(m.slots||1),0);
    if(used+(def.slots||1)>stats.maxMinions){
      this._msg='召唤栏已满 '+used+'/'+stats.maxMinions; this._msgT=this.t; return false;
    }
    if(!this.player.spendMana(def.mana||8)){ this._msg='魔力不足'; this._msgT=this.t; return false; }
    const p=this.player, index=this.minions.length;
    this.minions.push({
      x:p.x+(index%3-1)*18,y:p.y-28-Math.floor(index/3)*14,vx:0,vy:0,w:16,h:16,type:def.minion,item:itemKey,
      dmg:def.dmg||8,slots:def.slots||1,attackCool:0,hitCool:new Map(),phase:index*1.7
    });
    for(let i=0;i<18;i++)this.particles.push({x:p.x+p.w/2,y:p.y+p.h/2,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,life:24,c:'#ffd060'});
    return true;
  };
  Game.prototype.updateMinions=function(){
    const p=this.player;
    for(let i=0;i<this.minions.length;i++){
      const m=this.minions[i]; m.attackCool=Math.max(0,m.attackCool-1);
      const target=this.nearestCombatTarget(m.x,m.y,420);
      let tx=p.x+p.w/2+(i%4-1.5)*18, ty=p.y-24-Math.floor(i/4)*14+Math.sin(this.t*0.08+m.phase)*6;
      if(target){tx=target.x+target.w/2;ty=target.y+target.h/2;}
      const dx=tx-m.x,dy=ty-m.y,d=Math.hypot(dx,dy)||1;
      const ranged=['hornetMinion','impMinion','sphereMinion','stardustDragon'].includes(m.type);
      if(target&&ranged&&d<300){
        m.vx+=(dx/d)*0.08;m.vy+=(dy/d)*0.08;
        if(m.attackCool<=0){
          const def={dmg:m.dmg,damageClass:'summon',crit:0,knockback:1,projectile:m.type==='impMinion'?'impFire':m.type==='stardustDragon'?'stardustBolt':'minionBolt',velocity:m.type==='stardustDragon'?13:10,pierce:m.type==='stardustDragon'?2:1,homing:m.type!=='impMinion'};
          const hit=this.makeHit(def,m.item); const sp=def.velocity;
          this.projectiles.push({x:m.x,y:m.y,vx:dx/d*sp,vy:dy/d*sp,ang:Math.atan2(dy,dx),type:def.projectile,life:70,hit,pierce:def.pierce,bounce:0,homing:def.homing,gravity:0,explosion:0,hitTargets:[],owner:'minion'});
          m.attackCool=m.type==='stardustDragon'?20:35;
        }
      } else {
        const accel=target?0.28:0.16;m.vx+=dx/d*accel;m.vy+=dy/d*accel;
        if(target&&d<20&&m.attackCool<=0){
          const hit=this.makeHit({dmg:m.dmg,damageClass:'summon',crit:0,knockback:1.5},m.item);
          this.hitEntity(target,hit,target.x+target.w/2,target.y+target.h/2);
          m.attackCool=28;
        }
      }
      m.vx*=0.90;m.vy*=0.90;m.x+=m.vx;m.y+=m.vy;
      if(Math.hypot(m.x-p.x,m.y-p.y)>700){m.x=p.x;m.y=p.y-20;m.vx=m.vy=0;}
    }
  };
  Game.prototype.nearestCombatTarget=function(x,y,maxDist){
    let best=null,bd=maxDist==null?Infinity:maxDist;
    const list=this.monsters.filter(m=>m.alive);
    if(this.boss&&this.boss.alive) list.push(this.boss);
    if(this.pillars) for(const p of this.pillars) if(p.alive) list.push(p);
    for(const t of list){const tx=t.x+t.w/2,ty=t.y+t.h/2,d=Math.hypot(tx-x,ty-y);if(d<bd){best=t;bd=d;}}
    return best;
  };
  Game.prototype.projectileHitsTarget=function(a,target){
    if(a.hitTargets.indexOf(target)!==-1) return false;
    if(target.getSegments){
      const segs=target.getSegments();
      for(let i=0;i<segs.length;i++){const s=segs[i];if(s.alive===false)continue;if(a.x>s.x-5&&a.x<s.x+s.w+5&&a.y>s.y-5&&a.y<s.y+s.h+5){
        if(this.hitEntity(target,a.hit,a.x,a.y,{kind:'segment',index:i})){a.hitTargets.push(target);return true;}
      }}
      return false;
    }
    if(target.hurtAt){
      if(a.x>target.x-12&&a.x<target.x+target.w+12&&a.y>target.y-12&&a.y<target.y+target.h+12){
        if(this.hitEntity(target,a.hit,a.x,a.y,{x:a.x,y:a.y})){a.hitTargets.push(target);return true;}
      }
      return false;
    }
    if(a.x>target.x-5&&a.x<target.x+target.w+5&&a.y>target.y-5&&a.y<target.y+target.h+5){
      if(this.hitEntity(target,a.hit,a.x,a.y)){a.hitTargets.push(target);return true;}
    }
    return false;
  };
  Game.prototype.explodeProjectile=function(a){
    if(!a.explosion) return;
    const targets=this.monsters.filter(m=>m.alive);
    if(this.boss&&this.boss.alive) targets.push(this.boss);
    if(this.pillars) for(const p of this.pillars) if(p.alive) targets.push(p);
    for(const t of targets){const x=t.x+t.w/2,y=t.y+t.h/2;if(Math.hypot(x-a.x,y-a.y)<=a.explosion&&a.hitTargets.indexOf(t)===-1)this.hitEntity(t,a.hit,x,y);}
    for(let i=0;i<18;i++)this.particles.push({x:a.x,y:a.y,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,life:25,c:'#ffb040'});
    if(window.AUDIO) AUDIO.play('explosion');
  };
  // 旧调用兼容
  Game.prototype.shootArrow=function(bowItem,bowDef){ return this.useWeapon(bowItem,bowDef); };
  Game.prototype.updateArrows=function(){
    const targets=()=>{
      const all=this.monsters.filter(m=>m.alive);
      if(this.boss&&this.boss.alive) all.push(this.boss);
      if(this.pillars) for(const p of this.pillars) if(p.alive) all.push(p);
      return all;
    };
    for(const a of this.projectiles){
      a.life--;
      if(a.beam){
        const ox=this.player.x+this.player.w/2, oy=this.player.y+this.player.h/2-2;
        a.x=ox; a.y=oy; a.ang=Math.atan2(this.mouse.wy-oy,this.mouse.wx-ox); a.vx=Math.cos(a.ang); a.vy=Math.sin(a.ang);
        let end=a.range;
        for(let d=8;d<=a.range;d+=8){if(this.world.isSolid(Math.floor((ox+a.vx*d)/TS),Math.floor((oy+a.vy*d)/TS))){end=d;break;}}
        a.endX=ox+a.vx*end; a.endY=oy+a.vy*end;
        for(const t of targets()){
          const tx=t.x+t.w/2,ty=t.y+t.h/2;
          const along=(tx-ox)*a.vx+(ty-oy)*a.vy;
          const perp=Math.abs((tx-ox)*a.vy-(ty-oy)*a.vx);
          if(along>0&&along<end&&perp<Math.max(t.w,t.h)/2+8)this.hitEntity(t,a.hit,tx,ty,{x:tx,y:ty});
        }
        continue;
      }
      if(a.homing){
        const target=this.nearestCombatTarget(a.x,a.y,280);
        if(target){const dx=target.x+target.w/2-a.x,dy=target.y+target.h/2-a.y,d=Math.hypot(dx,dy)||1,sp=Math.hypot(a.vx,a.vy);a.vx=a.vx*0.88+dx/d*sp*0.12;a.vy=a.vy*0.88+dy/d*sp*0.12;}
      }
      a.vy+=(a.gravity||0); a.x+=a.vx; a.y+=a.vy; a.ang=Math.atan2(a.vy,a.vx);
      const tx=Math.floor(a.x/TS),ty=Math.floor(a.y/TS);
      if(this.world.isSolid(tx,ty)){
        if(a.bounce>0){a.vy*=-0.8;a.vx*=0.9;a.bounce--;a.y-=a.vy;}
        else a.life=0;
      }
      if(a.life>0){
        for(const t of targets()) if(this.projectileHitsTarget(a,t)){
          a.pierce--;
          if(a.type==='beeArrow'&&Math.random()<0.55){
            const beeDef={dmg:Math.max(1,Math.round(a.hit.damage*0.45)),damageClass:'ranged',crit:0,knockback:1};
            this.projectiles.push({x:a.x,y:a.y,vx:(Math.random()-.5)*5,vy:-2-Math.random()*2,ang:0,type:'bee',life:50,hit:this.makeHit(beeDef,'bee'),pierce:1,bounce:0,homing:true,gravity:0,explosion:0,hitTargets:[],owner:'player'});
          }
          if(a.pierce<=0){a.life=0;break;}
        }
      }
      if(a.life<=0) this.explodeProjectile(a);
      else {
        const cols={fireArrow:'#ff7020',holyArrow:'#fff080',vortexBullet:'#40ffe0',luminiteBullet:'#80ffd0',amethystBolt:'#d080ff',topazBolt:'#ffd050',sapphireBolt:'#60a0ff',demonScythe:'#a060d0',fireball:'#ff6030',crystal:'#80e8ff',note:'#ff80d0',leafBolt:'#70e050',nebulaFlame:'#d060ff',catBlade:'#ff80c0',hatchet:'#d0c050'};
        if(cols[a.type]&&Math.random()<0.8)this.particles.push({x:a.x,y:a.y,vx:-a.vx*0.1,vy:-a.vy*0.1,life:12,c:cols[a.type]});
      }
    }
    this.projectiles=this.projectiles.filter(a=>a.life>0);
    this.arrows=this.projectiles;
  };
  // 蜂后毒刺弹
  Game.prototype.updateStingers=function(){
    if(!this.stingers) this.stingers=[];
    const p=this.player;
    for(const s of this.stingers){
      s.x+=s.vx; s.y+=s.vy; s.life--;
      const tx=Math.floor(s.x/TS), ty=Math.floor(s.y/TS);
      if(this.world.isSolid(tx,ty)) s.life=0;
      if(s.x>p.x && s.x<p.x+p.w && s.y>p.y && s.y<p.y+p.h){
        p.tryHurt(s.dmg||8); s.life=0;
      }
    }
    this.stingers=this.stingers.filter(s=>s.life>0);
  };
  Game.prototype.spawnHitParticles=function(x,y,damageClass,crit){
    const colors={melee:'#ff8060',ranged:'#80e080',magic:'#a080ff',summon:'#ffd060'};
    const c=crit?'#fff080':(colors[damageClass]||'#e88');
    const n=crit?10:5;
    for(let i=0;i<n;i++) this.particles.push({x,y,vx:(Math.random()-.5)*(crit?5:3),vy:-Math.random()*(crit?5:3),life:crit?22:14,c});
  };

  Game.prototype.summonBoss=function(bossKey){
    if(this.boss) return false;
    const p=this.player;
    const x=p.x + (p.facing?120:-120);
    const y=p.y - 80;
    if(bossKey==='eoc'){
      this.boss=this.scaleEntity(new EoC(this.world, x, y));
      if(window.AUDIO) AUDIO.play('night');
      return true;
    } else if(bossKey==='queenbee'){
      this.boss=this.scaleEntity(new QueenBee(this.world, x, y));
      if(window.AUDIO) AUDIO.play('night');
      return true;
    } else if(bossKey==='destroyer'){
      this.boss=this.scaleEntity(new Destroyer(this.world, x, y));
      if(window.AUDIO) AUDIO.play('night');
      return true;
    } else if(bossKey==='twins'){
      this.boss=this.scaleEntity(new Twins(this.world, x, y));
      if(window.AUDIO) AUDIO.play('night');
      return true;
    } else if(bossKey==='prime'){
      this.boss=this.scaleEntity(new SkeletronPrime(this.world, x, y));
      if(window.AUDIO) AUDIO.play('night');
      return true;
    } else if(bossKey==='plantera'){
      this.boss=this.scaleEntity(new Plantera(this.world, x, y));
      if(window.AUDIO) AUDIO.play('night');
      return true;
    } else if(bossKey==='moonlord'){
      this.boss=this.scaleEntity(new MoonLord(this.world, x-50, y-70));
      if(window.AUDIO) AUDIO.play('night');
      return true;
    }
    return false;
  };
  Game.prototype.die=function(){
    this.running=false;
    this.projectiles=[]; this.arrows=this.projectiles; this.minions=[];
    // 按难度掉落金币
    if(this.player){
      const loss=this.diff?this.diff.coinLoss:0.5;
      this.player.coins=Math.floor(this.player.coins*(1-loss));
    }
    const sub=document.getElementById('overlay-sub');
    if(sub){
      const name=this.diff?this.diff.name:'经典';
      const pct=Math.round((this.diff?this.diff.coinLoss:0.5)*100);
      sub.textContent='难度「'+name+'」· 失去 '+pct+'% 金币…';
    }
    document.getElementById('overlay').classList.remove('hidden');
  };

  // 护士治疗粒子
  Game.prototype.spawnHealParticles=function(player){
    for(let i=0;i<10;i++){
      this.particles.push({x:player.x+player.w/2, y:player.y+player.h/2, vx:(Math.random()-.5)*2, vy:-Math.random()*2.5-0.5, life:40, c:'#7ee87e'});
    }
  };

  // 探索玩家附近的合格房间（含背景墙 + 家具 + 内部有空气的封闭空间）
  Game.prototype.findHouse=function(){
    const W=this.world, p=this.player;
    const pcx=Math.floor((p.x+p.w/2)/TS), pcy=Math.floor((p.y+p.h/2)/TS);
    // 搜索半径
    for(let r=6;r<30;r+=2){
      for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
        if(Math.abs(dx)>r||Math.abs(dy)>r) continue;
        const cx=pcx+dx, cy=pcy+dy;
        const t=W.get(cx,cy);
        // 家具判定：工作台(11)/熔炉(14)/铁砧(15)/火把(9)
        if(t!==11 && t!==14 && t!==15 && t!==9) continue;
        // 检查头顶 3 格是空气（人站的空间）且有背景墙
        let ok=true, wall=false;
        for(let yy=cy-1; yy>=cy-3; yy--){
          if(W.get(cx,yy)!==0){ ok=false; break; }
          if(W.bg[yy*W.w+cx]>0) wall=true;
        }
        // 检查脚下是实心
        if(W.get(cx,cy+1)===0 && W.get(cx,cy+2)===0 && W.get(cx,cy+3)===0) ok=false; // 无地板
        if(ok && wall) return {x:cx, y:cy-1};
      }
    }
    return null;
  };

  // NPC 入住：若玩家建造了合格房屋，把已满足入住条件的 NPC 移入其中
  Game.prototype.updateHousing=function(p){
    if(this._houseCheckT===undefined) this._houseCheckT=0;
    this._houseCheckT++;
    if(this._houseCheckT<6) return; // 节流
    this._houseCheckT=0;
    const house=this.findHouse();
    if(!house){ this.npcHome=null; return; }
    this.npcHome=house;
    for(const n of this.npcs){
      if(!n.spawned) continue;
      if(!n.settled || n.settled!==house.x+','+house.y){
        // 把 NPC 移入房屋（放在家具旁），并固定在屋内
        n.homeX=house.x*TS; n.homeY=house.y*TS;
        n.x=house.x*TS + (n===this.npcs[1]?10:(n===this.npcs[2]?-10:0));
        n.y=house.y*TS + 10;
        n.settled=house.x+','+house.y;
      }
    }
  };

  Game.prototype.drawShop=function(ctx,canvasW,canvasH,mouse,merch){
    const SHOP=window.SHOP, NAMES=window.ITEMS.NAMES, SPR=window.ASSETS.sprites;
    const W=200, H=440;
    const px=Math.floor(canvasW-W-20), py=Math.floor((canvasH-H)/2);
    ctx.fillStyle='rgba(10,18,30,.9)';ctx.fillRect(px,py,W,H);
    ctx.fillStyle='rgb(70,50,30)';ctx.fillRect(px,py,W,30);
    ctx.fillStyle='rgb(245,215,110)';ctx.font='14px sans-serif';ctx.textBaseline='top';
    ctx.fillText('商人 · 商店', px+8, py+8);
    ctx.fillStyle='#cfcfcf';ctx.font='11px sans-serif';
    ctx.fillText('左键购买 · 1 个', px+8, py+H-18);
    const keys=Object.keys(SHOP);
    let yy=py+38;
    this.ui.shopSlots=[];
    for(const k of keys){
      const price=SHOP[k];
      const hot=mouse.x>=px+4 && mouse.x<px+W-4 && mouse.y>=yy && mouse.y<yy+28;
      ctx.fillStyle=hot?'rgb(90,80,60)':'rgb(50,40,30)';
      ctx.fillRect(px+4,yy,W-8,28);
      ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.strokeRect(px+4,yy,W-8,28);
      const sp=SPR[k]; if(sp) ctx.drawImage(sp, px+8, yy+2, 24, 24);
      ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.textBaseline='top';
      ctx.fillText(NAMES[k]||k, px+36, yy+4);
      ctx.fillStyle='rgb(220,180,60)';ctx.font='10px sans-serif';
      let priceStr;
      if(price>=10000) priceStr=Math.floor(price/10000)+'金';
      else if(price>=100) priceStr=Math.floor(price/100)+'银';
      else priceStr=price+'铜';
      ctx.fillText(priceStr, px+W-50, yy+12);
      if(hot) this.ui.shopSlots.push({x:px+4,y:yy,w:W-8,h:28,item:k});
      yy+=32;
      if(yy>py+H-30) break;
    }
  };

  // ---------- 渲染 ----------
  Game.prototype.render=function(){
    const ctx=this.ctx, c=this.canvas;
    // 天空（昼夜 / 血月偏红）
    const dt=this.dayTime;
    let skyTop=this.skyColor(dt);
    let skyBot=this.skyColor((dt+0.5)%1);
    if(this.bloodMoon){
      skyTop='#4a1020'; skyBot='#2a0810';
    }
    const g=ctx.createLinearGradient(0,0,0,c.height);
    g.addColorStop(0,skyTop); g.addColorStop(1,skyBot);
    ctx.fillStyle=g; ctx.fillRect(0,0,c.width,c.height);

    // 太阳 / 月亮
    const ang=dt*Math.PI*2;
    const cx=c.width/2, cy=c.height*0.95;
    const R=Math.min(c.width,c.height)*0.45;
    const sx=cx+Math.cos(ang-Math.PI/2)*R, sy=cy+Math.sin(ang-Math.PI/2)*R;
    if(dt<0.5){
      ctx.drawImage(SPR.sun,sx-16,sy-16,32,32);
    } else {
      ctx.drawImage(SPR.moon,sx-16,sy-16,32,32);
    }
    // 星星（夜晚）
    if(dt>0.55 || dt<0.05){
      ctx.fillStyle='rgba(255,255,255,.7)';
      for(let i=0;i<40;i++){
        const sxp=(i*97% c.width), syp=(i*53%(c.height*0.6));
        ctx.fillRect(sxp,syp,1,1);
      }
    }
    // 远山（视差）
    ctx.fillStyle='rgba(60,80,110,.5)';
    for(let i=0;i<5;i++){
      const ox=(-this.cam.x*0.2+i*300)%(c.width+300);
      ctx.beginPath();ctx.moveTo(ox,c.height);ctx.lineTo(ox+150,c.height-200);ctx.lineTo(ox+300,c.height);ctx.closePath();ctx.fill();
    }
    // 云
    for(let i=0;i<3;i++){
      const cx2=((this.t*0.3+i*400)%(c.width+128))-64;
      const cy2=60+i*40;
      ctx.drawImage(SPR.cloud,cx2,cy2,128,48);
    }

    // 背景墙
    this.drawBg(ctx);
    // 瓦片
    this.drawTiles(ctx);
    // 树（背景大图，drawn 由 tile 决定位置——这里简单画叶子周围）
    // 实体
    for(const n of this.npcs) n.draw(ctx,this.cam);
    for(const m of this.monsters) m.draw(ctx,this.cam);
    if(this.pillars) for(const pl of this.pillars) if(pl.alive) pl.draw(ctx,this.cam);
    if(this.boss) this.boss.draw(ctx,this.cam);
    this.player.draw(ctx,this.cam);
    // 挖掘进度
    if(this.mining){
      const tx=this.mining.tx, ty=this.mining.ty;
      const px=tx*TS-this.cam.x, py=ty*TS-this.cam.y;
      const pr=this.mining.prog;
      // 黑色覆盖加深
      ctx.fillStyle=`rgba(0,0,0,${0.25+pr*0.35})`;
      ctx.fillRect(px,py,16,16);
      // 分阶段裂纹（3 段）
      ctx.strokeStyle=`rgba(20,15,10,${0.5+pr*0.4})`;
      ctx.lineWidth=1;
      ctx.beginPath();
      ctx.moveTo(px+2,py+4); ctx.lineTo(px+7,py+8); ctx.lineTo(px+6,py+13);
      if(pr>0.33){ ctx.moveTo(px+13,py+3); ctx.lineTo(px+9,py+7); ctx.lineTo(px+12,py+12); }
      if(pr>0.66){ ctx.moveTo(px+4,py+12); ctx.lineTo(px+10,py+9); ctx.lineTo(px+14,py+14); }
      ctx.stroke();
      // 进度条（瓦片上方）
      ctx.fillStyle='rgba(0,0,0,.7)'; ctx.fillRect(px-2,py-6,20,4);
      ctx.fillStyle='#7ad36a'; ctx.fillRect(px-1,py-5,18*pr,2);
    }
    // 粒子
    for(const pt of this.particles){ ctx.fillStyle=pt.c; ctx.fillRect(pt.x-this.cam.x,pt.y-this.cam.y,2,2); }
    // 掉落物（物品光球）
    const NAMES=window.ITEMS.NAMES;
    for(const d of this.drops){
      const sp=SPR[d.item];
      const sx=d.x-this.cam.x, sy=d.y-this.cam.y;
      if(sp){
        // 会发光的背景光晕
        ctx.fillStyle='rgba(255,255,120,.25)';
        ctx.beginPath(); ctx.arc(sx+5,sy+5,8,0,Math.PI*2); ctx.fill();
        // 闪烁
        if(Math.floor(this.t*3)%2===0) ctx.globalAlpha=0.85;
        ctx.drawImage(sp,sx,sy,10,10);
        ctx.globalAlpha=1;
      } else {
        ctx.fillStyle='rgba(255,255,120,.5)'; ctx.fillRect(sx,sy,8,8);
      }
      ctx.fillStyle='#fff'; ctx.font='8px sans-serif'; ctx.textBaseline='top';
      ctx.fillText(d.n>1?d.n:'',sx+9,sy-2);
    }
    // 玩家投射物 / 光束
    for(const a of this.projectiles){
      if(a.beam){
        const hues=['#ff4050','#ffb040','#fff060','#50ff90','#40bfff','#a060ff'];
        ctx.save();ctx.globalAlpha=.75;ctx.lineWidth=7;
        for(let i=0;i<hues.length;i++){ctx.strokeStyle=hues[(i+Math.floor(this.t/2))%hues.length];ctx.lineWidth=8-i;ctx.beginPath();ctx.moveTo(a.x-this.cam.x,a.y-this.cam.y+i-2);ctx.lineTo(a.endX-this.cam.x,a.endY-this.cam.y+i-2);ctx.stroke();}
        ctx.restore();continue;
      }
      ctx.save();ctx.translate(a.x-this.cam.x,a.y-this.cam.y);ctx.rotate(a.ang);
      const sp=SPR['proj_'+a.type]||SPR.proj_arrow;
      if(sp)ctx.drawImage(sp,-8,-4,16,8);
      else {ctx.fillStyle='#fff';ctx.fillRect(-4,-2,8,4);}
      ctx.restore();
    }
    // 召唤物
    for(const m of this.minions){
      const sp=SPR['minion_'+m.type];
      const sx=m.x-this.cam.x-8,sy=m.y-this.cam.y-8;
      if(sp)ctx.drawImage(sp,sx,sy,16,16);else{ctx.fillStyle='#ffd060';ctx.fillRect(sx+3,sy+3,10,10);}
    }
    // 伤害数字
    for(const d of this.damageTexts){
      const cols={melee:'#ff8060',ranged:'#80e080',magic:'#b090ff',summon:'#ffd060'};
      ctx.fillStyle=d.crit?'#fff060':(cols[d.cls]||'#fff');ctx.font=(d.crit?'bold 16':'12')+'px sans-serif';ctx.textBaseline='top';
      ctx.fillText(d.text,d.x-this.cam.x,d.y-this.cam.y);
    }
    // 蜂后毒刺
    if(this.stingers){
      for(const s of this.stingers){
        ctx.fillStyle='rgb(80,200,60)';
        ctx.fillRect(s.x-this.cam.x-2, s.y-this.cam.y-1, 6, 2);
      }
    }

    // 鼠标光标高亮
    const mp=this.mouseTile();
    ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1;
    ctx.strokeRect(mp.tx*TS-this.cam.x,mp.ty*TS-this.cam.y,16,16);

    // HUD
    this.ui.drawHUD(ctx,c.width,c.height);
    // 小地图
    if(this.ui.minimap && !this.ui.invOpen && !this.ui.achOpen) this.ui.drawMinimap(ctx,c.width,c.height);
    // 临时提示消息（如“金币不足”）
    if(this._msg && this._msgT && this.t-this._msgT<120){
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.font='14px sans-serif';ctx.textBaseline='middle';
      const tw=ctx.measureText(this._msg).width;
      ctx.fillRect(c.width/2-tw/2-8, c.height-130, tw+16, 24);
      ctx.fillStyle='#ffd76e';ctx.fillText(this._msg, c.width/2, c.height-118);
    } else this._msg=null;
    // 护士提示：靠近护士按 H 治疗
    const nur=this.npcs.find(n=>n.heal && n.spawned);
    if(nur && !this.ui.invOpen){
      const dx=this.player.x-nur.x, dy=this.player.y-nur.y;
      if(Math.abs(dx)<80 && Math.abs(dy)<80 && this.player.hp<this.player.maxHp){
        ctx.fillStyle='rgba(0,0,0,.55)';ctx.font='12px sans-serif';ctx.textBaseline='middle';
        const s='护士：按 H 花金币治疗';
        const sw2=ctx.measureText(s).width;
        ctx.fillRect(c.width/2-sw2/2-6, c.height-158, sw2+12, 20);
        ctx.fillStyle='#cfc';ctx.fillText(s, c.width/2, c.height-148);
      }
    }
    // 攻击挥动光弧
    if(this.player.swing>0){
      const p=this.player;
      const cxw=p.x+p.w/2-this.cam.x, cyw=p.y+p.h/2-this.cam.y;
      ctx.strokeStyle=`rgba(255,255,200,${0.6*p.swing})`;
      ctx.lineWidth=3;
      ctx.beginPath();
      const a0=p.facing?-0.9:Math.PI-(-0.9);
      const a1=p.facing?0.4:Math.PI-0.4;
      ctx.arc(cxw,cyw,28,Math.min(a0,a1),Math.max(a0,a1));
      ctx.stroke();
    }
    // 背包
    if(this.ui.invOpen) this.ui.drawInventory(ctx,c.width,c.height,this.mouse);
    // 商店面板：玩家在商人附近且背包打开
    if(this.ui.invOpen){
      const merch=this.npcs.find(n=>n.spawned && n.buy);
      if(merch){
        const dx=this.player.x - merch.x, dy=this.player.y - merch.y;
        if(Math.hypot(dx,dy) < 80) this.drawShop(ctx,c.width,c.height,this.mouse,merch);
      }
    }
    // 成就面板
    if(this.ui.achOpen) this.ui.drawAchievements(ctx,c.width,c.height);
  };
  Game.prototype.skyColor=function(dt){
    // 0=黎明粉橙，0.25=正午蓝，0.5=黄昏橙紫，0.75=午夜深蓝
    const keys=[[0,'#f5a878'],[0.15,'#9bc4e8'],[0.45,'#e0a060'],[0.55,'#3a2a5a'],[0.75,'#10183a'],[1,'#f5a878']];
    for(let i=0;i<keys.length-1;i++){
      if(dt>=keys[i][0] && dt<=keys[i+1][0]){
        const t=(dt-keys[i][0])/(keys[i+1][0]-keys[i][0]);
        return lerpHex(keys[i][1],keys[i+1][1],t);
      }
    }
    return '#10183a';
  };
  function lerpHex(a,b,t){
    const pa=hexToRgb(a), pb=hexToRgb(b);
    const r=Math.round(pa.r+(pb.r-pa.r)*t);
    const g=Math.round(pa.g+(pb.g-pa.g)*t);
    const bl=Math.round(pa.b+(pb.b-pa.b)*t);
    return `rgb(${r},${g},${bl})`;
  }
  function hexToRgb(h){const v=parseInt(h.slice(1),16);return{r:(v>>16)&255,g:(v>>8)&255,b:v&255}}

  Game.prototype.drawBg=function(ctx){
    const W=this.world, c=this.canvas;
    const x0=Math.floor(this.cam.x/TS), x1=Math.ceil((this.cam.x+c.width)/TS);
    const y0=Math.floor(this.cam.y/TS), y1=Math.ceil((this.cam.y+c.height)/TS);
    for(let ty=y0;ty<=y1;ty++) for(let tx=x0;tx<=x1;tx++){
      if(tx<0||ty<0||tx>=W.w||ty>=W.h) continue;
      const bg=W.bg[ty*W.w+tx];
      if(bg===1){
        ctx.fillStyle='#3a2a1a';
        ctx.fillRect(tx*TS-this.cam.x,ty*TS-this.cam.y,16,16);
      }
    }
  };
  Game.prototype.drawTiles=function(ctx){
    const W=this.world, c=this.canvas;
    const x0=Math.max(0,Math.floor(this.cam.x/TS));
    const x1=Math.min(W.w-1,Math.ceil((this.cam.x+c.width)/TS));
    const y0=Math.max(0,Math.floor(this.cam.y/TS));
    const y1=Math.min(W.h-1,Math.ceil((this.cam.y+c.height)/TS));
    for(let ty=y0;ty<=y1;ty++) for(let tx=x0;tx<=x1;tx++){
      const t=W.get(tx,ty), d=TILE[t];
      if(!d || !d.sprite) continue;
      const sp=SPR[d.sprite];
      ctx.drawImage(sp, tx*TS-this.cam.x, ty*TS-this.cam.y, TS, TS);
    }
  };

  window.Game=Game;
  window.DIFFS=DIFFS;

  // ========== 设置模块（独立于 Game，主菜单 / 游戏内通用） ==========
  const S={ open:false, cursorInfo:false };
  function setVol(v){
    S.vol=v;
    if(window.AUDIO) window.AUDIO.setVolume(v);
    const el=document.getElementById('s-vol');
    if(el) el.value=Math.round(v*100);
    const val=document.getElementById('s-vol-val');
    if(val) val.textContent=Math.round(v*100)+'%';
  }
  function setMute(m){
    const btn=document.getElementById('btn-s-mute');
    if(btn) btn.textContent=m?'已静音':'开启';
  }
  function setCursorInfo(on){
    S.cursorInfo=!!on;
    const ci=document.getElementById('s-cursorinfo');
    if(ci) ci.checked=!!on;
    try{ localStorage.setItem('terraria_web_cursorinfo', on?'1':'0'); }catch(e){}
  }
  window.AIM={ setVolDisplay:(v)=>{ S.vol=v; const val=document.getElementById('s-vol-val'); if(val) val.textContent=Math.round(v*100)+'%'; }, setMuteDisplay:setMute, setVol };
  function refreshSettings(){
    S.vol = window.AUDIO ? window.AUDIO.getVolume() : (S.vol||0.7);
    setVol(S.vol);
    setMute(window.AUDIO?window.AUDIO.isMuted():false);
    let ciOn=false;
    try{ ciOn=localStorage.getItem('terraria_web_cursorinfo')==='1'; }catch(e){}
    S.cursorInfo=ciOn;
    const ci=document.getElementById('s-cursorinfo');
    if(ci) ci.checked=ciOn;
  }
  function openSettings(){
    S.open=true;
    document.getElementById('settings').classList.remove('hidden');
    refreshSettings();
    if(window.game) window.game.settingsOpen=true;
  }
  function closeSettings(){
    S.open=false;
    document.getElementById('settings').classList.add('hidden');
    if(window.game) window.game.settingsOpen=false;
    if(window.AUDIO) AUDIO.play('open');
  }
  function toggleSettings(){
    if(S.open) closeSettings(); else openSettings();
  }
  window.SETTINGS={ open:()=>openSettings(), close:closeSettings, toggle:toggleSettings, isOpen:()=>S.open, getCursorInfo:()=>!!S.cursorInfo, setCursorInfo };

  // 绑定设置 DOM 事件
  function bindSettings(){
    const close=document.getElementById('btn-settings-close');
    if(close) close.onclick=closeSettings;
    const vol=document.getElementById('s-vol');
    if(vol){ vol.addEventListener('input',()=>setVol(vol.value/100)); }
    const mute=document.getElementById('btn-s-mute');
    if(mute) mute.onclick=()=>{ if(window.AUDIO) window.AUDIO.toggleMute(); setMute(window.AUDIO?window.AUDIO.isMuted():false); };
    const ci=document.getElementById('s-cursorinfo');
    if(ci){ ci.addEventListener('change',()=>setCursorInfo(ci.checked)); }
    const menu=document.getElementById('btn-s-menu');
    if(menu) menu.onclick=()=>location.reload();
    const resume=document.getElementById('btn-s-resume');
    if(resume) resume.onclick=closeSettings;
    const creative=document.getElementById('btn-s-creative');
    if(creative) creative.onclick=()=>{ closeSettings(); openConsole(); };
  }
  // 全局 Esc：主菜单 / 游戏内打开设置；创造模式打开时 Esc 关闭它
  window.addEventListener('keydown',e=>{
    if(e.repeat) return;
    if(consoleOpen()){
      if(e.code==='Escape') closeConsole();
      return;
    }
    if(e.code==='Escape'){
      if(S.open){ closeSettings(); }
      else if(window.game && window.game.ui.invOpen){ window.game.ui.invOpen=false; }
      else if(window.game && window.game.player){ openSettings(); }
      else { openSettings(); }
    }
  });

  // ========== 创造模式（F1） ==========
  function consoleOpen(){ const el=document.getElementById('console'); return el && !el.classList.contains('hidden'); }
  // 创造模式开关：onclick 属性直接赋值（最可靠，可重复调用幂等）
  function bindCreativeToggles(){
    const labels=document.querySelectorAll('.c-toggle');
    for(let i=0;i<labels.length;i++){
      const lb=labels[i];
      lb.onclick=function(e){
        e.preventDefault();
        const name=lb.getAttribute('data-toggle');
        const p=window.game&&window.game.player;
        if(!p){
          const h=document.querySelector('.creative-hint');
          if(h) h.textContent='未开始游戏：请先从主菜单点「新游戏」或「继续游戏」';
          return;
        }
        const cur=name==='fly'?p.flyMode:name==='ghost'?p.ghostMode:p.godMode;
        applyToggle(name,!cur);
      };
    }
  }

  const CREATIVE_CATS=[
    {id:'all',name:'全部',filter:()=>true},
    {id:'melee',name:'近战',filter:it=>it.kind==='sword'},
    {id:'ranged',name:'远程',filter:it=>it.kind==='bow'},
    {id:'magic',name:'魔法',filter:it=>it.kind==='magic'},
    {id:'summon',name:'召唤',filter:it=>it.kind==='minionStaff'},
    {id:'armor',name:'护甲',filter:it=>it.kind==='armor'},
    {id:'acc',name:'饰品',filter:it=>it.kind==='acc'},
    {id:'tool',name:'工具',filter:it=>it.kind==='pick'||it.kind==='axe'},
    {id:'place',name:'方块',filter:it=>it.kind==='place'},
    {id:'ammo',name:'弹药',filter:it=>it.kind==='ammo'},
    {id:'consume',name:'消耗品',filter:it=>it.kind==='potion'||it.kind==='consumable'||it.kind==='crystal'},
    {id:'bossSummon',name:'Boss',filter:it=>it.kind==='summon'},
    {id:'material',name:'材料',filter:it=>it.kind==='material'},
  ];
  let _creativeCat='all';
  const _iconCache={};
  function iconDataURL(key){
    if(key in _iconCache) return _iconCache[key];
    let url='';
    try{ const sp=window.ASSETS&&window.ASSETS.sprites&&window.ASSETS.sprites[key];
      if(sp&&typeof sp.toDataURL==='function') url=sp.toDataURL(); }catch(e){}
    _iconCache[key]=url; return url;
  }
  function setToggleState(name,on){
    const box=document.querySelector('.c-toggle[data-toggle="'+name+'"]');
    if(!box) return;
    box.classList.toggle('on',!!on);
    const st=box.querySelector('.ct-state'); if(st) st.textContent=on?'开':'关';
  }
  function refreshToggles(){
    const p=window.game&&window.game.player; if(!p) return;
    setToggleState('fly',p.flyMode); setToggleState('ghost',p.ghostMode); setToggleState('god',p.godMode);
    const h=document.querySelector('.creative-hint');
    if(h&&consoleOpen()){
      const on=[];
      if(p.flyMode) on.push('飞行');
      if(p.ghostMode) on.push('穿墙');
      if(p.godMode) on.push('无敌');
      h.textContent=on.length
        ?'已开启：'+on.join('、')+'  ✓  F1 关闭面板后，按住空格上升 / S 下降'
        :'左键物品获取 1 个 · 右键获取 99 个 · F1 / Esc 关闭';
    }
  }
  function applyToggle(name,on){
    const p=window.game&&window.game.player; if(!p) return;
    if(name==='fly'){ p.flyMode=on; if(on&&!p.ghostMode) p.ghostMode=true; }
    else if(name==='ghost'){ p.ghostMode=on; if(on&&!p.flyMode) p.flyMode=true; }
    else if(name==='god'){ p.godMode=on; }
    refreshToggles();
  }
  function giveItem(key,n){
    const p=window.game&&window.game.player; if(!p||!window.DATA.ITEM[key]) return;
    p.give(key,Math.max(1,n));
  }
  function renderCreativeGrid(){
    const grid=document.getElementById('creative-grid'); if(!grid) return;
    grid.innerHTML='';
    const ITEM=window.DATA.ITEM, NAMES=window.ITEMS.NAMES;
    const cat=CREATIVE_CATS.find(c=>c.id===_creativeCat)||CREATIVE_CATS[0];
    for(const k in ITEM){
      if(ITEM[k].kind==='coin') continue;
      if(!cat.filter(ITEM[k])) continue;
      const card=document.createElement('div'); card.className='c-item'; card.title=NAMES[k]||k;
      const img=document.createElement('img'); const url=iconDataURL(k);
      if(url) img.src=url; else img.style.background='#5a4630';
      const name=document.createElement('span'); name.className='ci-name'; name.textContent=NAMES[k]||k;
      card.appendChild(img); card.appendChild(name);
      card.addEventListener('click',()=>giveItem(k,1));
      card.addEventListener('contextmenu',e=>{ e.preventDefault(); giveItem(k,99); });
      grid.appendChild(card);
    }
  }
  function buildCreativeTabs(){
    const tabs=document.getElementById('creative-tabs'); if(!tabs) return;
    tabs.innerHTML='';
    for(const c of CREATIVE_CATS){
      const b=document.createElement('button'); b.type='button';
      b.className='c-tab'+(c.id===_creativeCat?' on':'');
      b.textContent=c.name;
      b.onclick=()=>{ _creativeCat=c.id; for(const x of tabs.children) x.classList.remove('on'); b.classList.add('on'); renderCreativeGrid(); };
      tabs.appendChild(b);
    }
  }
  function openConsole(){
    if(window.SETTINGS&&window.SETTINGS.isOpen()) window.SETTINGS.close();
    bindCreativeToggles();
    buildCreativeTabs();
    renderCreativeGrid();
    refreshToggles();
    const hint=document.querySelector('.creative-hint');
    if(hint){
      hint.textContent=(window.game&&window.game.player)
        ?'左键物品获取 1 个 · 右键获取 99 个 · F1 / Esc 关闭'
        :'请先开始游戏后再使用创造模式';
    }
    document.getElementById('console').classList.remove('hidden');
    if(window.AUDIO) AUDIO.play('open');
  }
  function closeConsole(){
    document.getElementById('console').classList.add('hidden');
    if(window.AUDIO) AUDIO.play('open');
  }
  function toggleConsole(){ if(consoleOpen()) closeConsole(); else openConsole(); }
  function setupConsole(){
    bindCreativeToggles();
    buildCreativeTabs();
    renderCreativeGrid();
  }

  window.CONSOLE={ open:openConsole, close:closeConsole, toggle:toggleConsole, isOpen:consoleOpen, give:giveItem, refreshToggles, renderGrid:renderCreativeGrid, applyToggle };

  window.addEventListener('load',()=>{
    bindSettings();
    setupConsole();
    window.game=new Game();
  });
})();
