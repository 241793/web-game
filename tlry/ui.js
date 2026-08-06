/* ===== UI：HUD、Hotbar、背包合成面板 ===== */
(function(){
  const SPR=window.ASSETS.sprites, NAMES=window.ITEMS.NAMES, RECIPES=window.ITEMS.RECIPES;

  function drawHeart(ctx,x,y,full){
    ctx.fillStyle=full?'rgb(200,40,40)':'rgb(80,30,30)';
    ctx.fillRect(x+2,y+4,3,2);ctx.fillRect(x+5,y+2,6,4);ctx.fillRect(x+11,y+4,3,2);
    ctx.fillRect(x+3,y+6,10,2);ctx.fillRect(x+4,y+8,8,2);ctx.fillRect(x+6,y+10,4,1);ctx.fillRect(x+7,y+11,2,1);
    if(full){ctx.fillStyle='rgb(255,150,150)';ctx.fillRect(x+5,y+4,2,2);}
  }
  function drawStar(ctx,x,y,full){
    ctx.fillStyle=full?'rgb(40,180,220)':'rgb(30,60,80)';
    ctx.fillRect(x+6,y+2,4,1);ctx.fillRect(x+5,y+3,6,1);
    ctx.fillRect(x+4,y+4,8,1);ctx.fillRect(x+3,y+5,10,1);ctx.fillRect(x+2,y+6,12,1);
    ctx.fillRect(x+3,y+7,10,1);ctx.fillRect(x+5,y+8,6,1);ctx.fillRect(x+6,y+9,4,1);
    ctx.fillRect(x+7,y+10,2,1);
    if(full){ctx.fillStyle='rgb(180,220,255)';ctx.fillRect(x+6,y+3,2,2);}
  }
  function drawItemIcon(ctx,item,x,y,size){
    if(!item) return;
    const sp=SPR[item];
    if(sp){ ctx.drawImage(sp,x,y,size,size); return; }
    // 缺失图标时画占位块，避免空白
    ctx.fillStyle='rgb(90,70,50)'; ctx.fillRect(x+2,y+2,size-4,size-4);
    ctx.strokeStyle='rgb(180,140,80)'; ctx.strokeRect(x+2,y+2,size-4,size-4);
    ctx.fillStyle='#f5d76e'; ctx.font=(size>20?'10':'8')+'px sans-serif'; ctx.textBaseline='middle';
    ctx.fillText('?', x+size/2-3, y+size/2);
  }

  // 方块中文名（TILES 的英文 name → 中文显示）
  const TILE_CN={
    air:'空气',grass:'草地',dirt:'泥土',stone:'石头',wood:'木材',leaves:'树叶',sand:'沙',
    plank:'木板',brick:'砖',torch:'火把',door:'木门',workbench:'工作台',platform:'平台',glass:'玻璃',
    furnace:'熔炉',anvil:'铁砧',chest:'宝箱',pot:'罐子',snow:'雪',ice:'冰',jungle_grass:'丛林草',
    mud:'泥',water:'水',lava:'岩浆',life_crystal:'生命水晶',mana_crystal:'魔力水晶',
    gem_amethyst:'紫晶',gem_topaz:'黄玉',gem_sapphire:'蓝玉',gem_emerald:'绿玉',gem_ruby:'红玉',gem_diamond:'钻石',
    corruption_grass:'腐化草',ebonstone:'黑曜石',shadow_orb:'暗影珠',hive:'蜂巢',honey:'蜂蜜',larva:'幼虫',
    dungeon_brick:'地牢砖',ash:'灰烬',hellstone:'狱石',hellbrick:'狱砖',
    cobalt_ore:'钴矿',mythril_ore:'秘银矿',adamantite_ore:'精金矿',demon_altar:'恶魔祭坛',
    pearlstone:'珍珠石',hallowed_grass:'神圣草',plantera_bulb:'世纪之花苞',lihzahrd_brick:'蜥蜴砖',
    temple_altar:'神庙祭坛',chlorophyte_ore:'叶绿矿',cloud:'云',
    copper_ore:'铜矿',iron_ore:'铁矿',gold_ore:'金矿',silver_ore:'银矿',coal:'煤矿',demonite_ore:'魔矿'
  };
  const ENT_CN={slime:'史莱姆',zombie:'僵尸',bee:'黄蜂',demon:'地狱恶魔',demon_eye:'魔眼',hornet:'黄蜂'};
  function entityName(ent){
    if(ent&&ent.getName){ const n=ent.getName(); if(n) return n; }
    return (ent&&ENT_CN[ent.type])||(ent&&ent.type)||'生物';
  }

  function weaponDescription(key){
    const d=window.DATA.ITEM[key]; if(!d) return TOOLTIP[key]||'';
    if(!['sword','bow','magic','minionStaff'].includes(d.kind)) return TOOLTIP[key]||'';
    const cls={melee:'近战',ranged:'远程',magic:'魔法',summon:'召唤'}[d.damageClass]||'';
    const speed=d.useTime<=8?'极快':d.useTime<=14?'快':d.useTime<=22?'普通':'慢';
    const parts=[`${d.dmg||0} ${cls}伤害`,`${d.crit||0}% 暴击`,`速度 ${speed}`,`击退 ${d.knockback||0}`];
    if(d.mana) parts.push(`魔力 ${d.mana}`);
    if(d.ammo) parts.push(d.ammo==='bullet'?'消耗子弹':'消耗箭矢');
    if(d.kind==='minionStaff') parts.push(`占用 ${d.slots||1} 召唤栏`);
    if(d.pierce>1) parts.push(`穿透 ${d.pierce}`);
    if(d.homing) parts.push('追踪');
    if(d.explosion) parts.push('爆炸');
    return parts.join(' · ');
  }

  function UI(game){
    this.game=game; this.invOpen=false;
    this.scroll=0; this.scrollTarget=0;
    this.dragBar=false;
    this.hoverSlot=null;
    this.hoverRecipe=null;
    this.achOpen=false;
    this.minimap=true;
  }
  UI.prototype.drawHUD=function(ctx,canvasW,canvasH){
    const p=this.game.player;
    // 心/星：每 20 点一格（更接近原版，避免 maxHp 变大后刷屏）
    const maxHearts=Math.max(1, Math.ceil(p.maxHp/20));
    const curHearts=p.hp/20;
    for(let i=0;i<maxHearts;i++){
      const row=Math.floor(i/10), col=i%10;
      drawHeart(ctx, 8+col*14, 8+row*14, i<curHearts);
    }
    const maxStars=Math.max(1, Math.ceil(p.maxMp/20));
    const curStars=p.mp/20;
    const starY=8+Math.ceil(maxHearts/10)*14+2;
    for(let i=0;i<maxStars;i++){
      const row=Math.floor(i/10), col=i%10;
      drawStar(ctx, 8+col*14, starY+row*14, i<curStars);
    }
    const infoY=starY+Math.ceil(maxStars/10)*14+6;
    // 金币
    ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(8,infoY,110,16);
    const gold=Math.floor(p.coins/10000), sil=Math.floor((p.coins%10000)/100), cop=p.coins%100;
    let cx=10;
    ctx.font='11px sans-serif';ctx.textBaseline='top';
    ctx.fillStyle='rgb(220,180,60)';ctx.fillText('金'+gold, cx, infoY+3); cx+=ctx.measureText('金'+gold).width+6;
    ctx.fillStyle='rgb(200,200,210)';ctx.fillText('银'+sil, cx, infoY+3); cx+=ctx.measureText('银'+sil).width+6;
    ctx.fillStyle='rgb(200,140,80)';ctx.fillText('铜'+cop, cx, infoY+3);
    // 难度 / 困难模式 / 血月
    let tagY=infoY+20;
    if(this.game.diff){
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(8,tagY,72,14);
      ctx.fillStyle='rgb(245,215,110)';ctx.font='11px sans-serif';
      ctx.fillText(this.game.diff.name+'模式', 12, tagY+2); tagY+=16;
    }
    if(this.game.hardmode || (this.game.world && this.game.world.hardmode)){
      ctx.fillStyle='rgba(80,0,0,.7)';ctx.fillRect(8,tagY,86,14);
      ctx.fillStyle='rgb(255,120,100)';ctx.font='11px sans-serif';
      ctx.fillText('困难模式', 12, tagY+2); tagY+=16;
    }
    if(this.game.bloodMoon){
      ctx.fillStyle='rgba(120,0,20,.8)';ctx.fillRect(8,tagY,72,14);
      ctx.fillStyle='rgb(255,90,90)';ctx.font='11px sans-serif';
      ctx.fillText('血月', 12, tagY+2); tagY+=16;
    }
    // 光标信息：左上角显示鼠标指向的方块 / 生物名称（设置开启时）
    if(window.SETTINGS && window.SETTINGS.getCursorInfo && window.SETTINGS.getCursorInfo()){
      const g=this.game, mp=g.mouseTile();
      const parts=[];
      const td=window.TILE_DEFS&&window.TILE_DEFS[g.world.get(mp.tx,mp.ty)];
      if(td&&td.name&&TILE_CN[td.name]) parts.push(TILE_CN[td.name]);
      const hit=g.entityAtMouse(mp.tx,mp.ty);
      if(hit) parts.push(entityName(hit.ent));
      if(parts.length){
        const txt=parts.join(' · ');
        ctx.font='12px sans-serif'; ctx.textBaseline='top';
        const tw=ctx.measureText(txt).width;
        ctx.fillStyle='rgba(0,0,0,.62)'; ctx.fillRect(8,tagY,tw+12,18);
        ctx.fillStyle='#ffe9a0'; ctx.fillText(txt,14,tagY+2);
      }
    }
    // 成就提示
    if(this.game._achToast && this.game._achToastT>0){
      const t=this.game._achToast;
      ctx.fillStyle='rgba(10,20,40,.88)';ctx.fillRect(canvasW/2-140, 48, 280, 36);
      ctx.strokeStyle='rgb(245,215,110)';ctx.strokeRect(canvasW/2-140, 48, 280, 36);
      ctx.fillStyle='rgb(245,215,110)';ctx.font='13px sans-serif';ctx.textBaseline='top';
      ctx.fillText('成就解锁：'+t, canvasW/2-130, 58);
      this.game._achToastT--;
    }
    // Boss 血条
    const boss=this.game.boss;
    if(boss && boss.alive){
      const bw=Math.min(canvasW-40, 600), bx=Math.floor((canvasW-bw)/2), by=canvasH-90;
      ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(bx-3,by-3,bw+6,18);
      ctx.fillStyle='rgb(60,30,30)';ctx.fillRect(bx,by,bw,12);
      const r=Math.max(0,Math.min(1,boss.hp/Math.max(1,boss.maxHp)));
      ctx.fillStyle='rgb(200,40,40)';ctx.fillRect(bx,by,bw*r,12);
      ctx.strokeStyle='rgb(200,200,200)';ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,12);
      ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.textBaseline='top';
      const bname = boss.getName ? boss.getName() : '克苏鲁之眼';
      ctx.fillText(bname+'  '+Math.ceil(boss.hp)+'/'+Math.ceil(boss.maxHp), bx+4, by-15);
    }
    // 天界柱小血条（最多4个）
    if(this.game.pillars && this.game.pillars.length){
      let py2=canvasH-120;
      for(const pl of this.game.pillars){
        if(!pl.alive) continue;
        const bw=180, bx=Math.floor((canvasW-bw)/2);
        ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(bx-2,py2-2,bw+4,12);
        ctx.fillStyle='rgb(40,40,60)';ctx.fillRect(bx,py2,bw,8);
        const r=Math.max(0,Math.min(1,pl.hp/Math.max(1,pl.maxHp)));
        const cols={solar:'#f80',nebula:'#c4f',vortex:'#4fc',stardust:'#8af'};
        ctx.fillStyle=cols[pl.type]||'#fff';ctx.fillRect(bx,py2,bw*r,8);
        ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.textBaseline='top';
        ctx.fillText((pl.getName?pl.getName():'柱')+' '+Math.ceil(pl.hp), bx+2, py2-12);
        py2-=22;
      }
    }
    const sw=44, gap=6, total=8*sw+7*gap;
    let hx=Math.floor((canvasW-total)/2);
    const hy=canvasH-56;
    // 召唤物数量（不遮挡心/星）
    const summStats=p.combatStats?p.combatStats('summon'):null;
    const used=this.game.minions?this.game.minions.reduce((n,m)=>n+(m.slots||1),0):0;
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(8,hy-24,120,18);
    ctx.fillStyle='#ffd06a';ctx.font='11px sans-serif';ctx.textBaseline='top';
    ctx.fillText('随从 '+used+'/'+(summStats?summStats.maxMinions:1), 12, hy-21);
    // 当前武器冷却条
    const curIt=p.hotbar[p.cur], curDef=curIt&&window.DATA.ITEM[curIt];
    if(curDef&&['sword','bow','magic','minionStaff'].includes(curDef.kind)&&p.weaponCooldown>0){
      const totalCd=Math.max(2,(curDef.useTime||20)/(p.combatStats?p.combatStats(curDef.damageClass).attackSpeed:1));
      const frac=Math.max(0,Math.min(1,p.weaponCooldown/totalCd));
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(8,hy-8,120,6);
      ctx.fillStyle='rgb(245,215,110)';ctx.fillRect(8,hy-8,120*(1-frac),6);
    }
    for(let i=0;i<8;i++){
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(hx+i*(sw+gap)-2,hy-2,sw+4,sw+4);
      ctx.fillStyle=i===p.cur?'rgb(245,215,110)':'rgb(120,120,130)';
      ctx.fillRect(hx+i*(sw+gap),hy,sw,sw);
      ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.strokeRect(hx+i*(sw+gap),hy,sw,sw);
      const it=p.hotbar[i];
      if(it){
        drawItemIcon(ctx,it,hx+i*(sw+gap)+6,hy+6,32);
        const n=p.inv[it]||0;
        if(n>1){ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.textBaseline='bottom';
          ctx.fillText(n, hx+i*(sw+gap)+4, hy+sw-4);}
      }
      ctx.fillStyle='rgba(255,255,255,.6)';ctx.font='10px sans-serif';ctx.textBaseline='top';
      ctx.fillText(i+1, hx+i*(sw+gap)+2, hy+2);
    }
  };

  // 面板布局常量（加宽中间装备栏，底部给快捷栏留空）
  const PW=760, PH=500, ITEM_AREA_W=230, EQUIP_W=130;
  const RCP_ROW_H=34, RCP_VIEW_H=300;
  const INV_BOTTOM=70; // 底部快捷栏预留
  const TOOLTIP={
    i_dirt:'泥土 · 可放置', i_stone:'石头 · 需镐', i_wood:'木材 · 砍树获得',
    i_plank:'木板 · 2 木材合成', i_brick:'砖 · 2 石头合成',
    i_torch:'火把 · 提供光源', i_glass:'玻璃 · 2 沙子合成', i_door:'木门 · 可通过',
    i_platform:'木板平台 · 可穿过的踏板', i_iron_bar:'铁锭 · 铁矿熔炼', i_gold_bar:'金锭',
    i_copper_bar:'铜锭', i_coal:'煤炭 · 燃料', i_mushroom:'蘑菇 · 可食用回血',
    i_heart:'生命药水 · H 使用回 100 血', i_star:'魔力药水 · M 使用回 100 魔',
    i_pick_wood:'木镐 · 挖石/矿', i_pick_iron:'铁镐 · 更快挖石/矿',
    i_axe_wood:'木斧 · 伐木', i_sword_wood:'木剑 · 近战', i_sword_iron:'铁剑 · 高伤害近战',
    i_bow:'木弓 · 远程射击，左键发射，消耗木箭',
    i_bee_gun:'蜂膝弓 · 高伤远程', i_sword_bee:'养蜂人 · 蜜蜂近战',
    i_helm_bee:'蜜蜂头盔', i_chest_bee:'蜜蜂胸甲', i_legs_bee:'蜜蜂护腿',
    i_abeemination:'蜜蜂分泌物 · 合成召唤物材料', i_boss_summon_qb:'蜜蜂分泌物 · 召唤蜂后',
    i_beeswax:'蜂蜡 · 蜂后掉落', i_stinger:'蜂刺 · 黄蜂/蜂后掉落', i_hive:'蜂巢块',
    i_dungeon_key:'金钥匙 · 击败骷髅王获得', i_bone:'骨头', i_dungeon_brick:'地牢砖',
    i_hellstone:'狱石 · 地狱开采，熔炼狱石锭', i_hellstone_bar:'狱石锭', i_ash:'灰烬',
    i_pick_molten:'熔岩镐 · 镐力 100%', i_sword_molten:'炽焰巨剑', i_voodoo_doll:'巫毒娃娃 · 地狱岩浆旁使用召唤血肉墙',
    i_pwnhammer:'神锤 · 血肉墙掉落，开启困难模式标志',
    i_cobalt_ore:'钴矿 · 困难模式', i_mythril_ore:'秘银矿', i_adamantite_ore:'精金矿',
    i_warrior_emblem:'战士徽章 · 近战', i_ranger_emblem:'游侠徽章', i_sorcerer_emblem:'巫师徽章',
    i_soul_might:'力量之魂 · 毁灭者掉落', i_soul_sight:'视域之魂 · 双子魔眼', i_soul_fright:'恐惧之魂 · 骷髅统帅',
    i_hallowed_bar:'神圣锭 · 三魂+精金合成', i_mech_worm:'机械蠕虫 · 召唤毁灭者',
    i_mech_eye:'机械眼球 · 召唤双子魔眼', i_mech_skull:'机械骷髅头 · 召唤骷髅统帅',
    i_pick_mythril:'秘银镐', i_pick_adamantite:'精金镐', i_sword_excalibur:'断钢剑 · 高伤近战',
    i_helm_hallowed:'神圣头盔', i_chest_hallowed:'神圣胸甲', i_legs_hallowed:'神圣护腿', i_pearlstone:'珍珠石 · 神圣之地',
    i_temple_key:'神庙钥匙 · 击败世纪之花获得', i_lihzahrd_brick:'蜥蜴砖 · 神庙建材',
    i_chlorophyte_ore:'叶绿矿 · 困难模式地下丛林', i_chlorophyte_bar:'叶绿锭', i_lihzahrd_battery:'蜥蜴电池 · 神庙祭坛召唤石巨人',
    i_plantera_bullet:'世纪之花种子 · 召唤世纪之花', i_pick_chlorophyte:'叶绿镐', i_sword_chlorophyte:'叶绿剑',
    i_golem_eye:'石巨人之眼 · 近战饰品', i_possessed_hatchet:'附魔战斧', i_stynger:'蜂刺发射器',
    i_solar_fragment:'日耀碎片 · 日耀柱', i_nebula_fragment:'星云碎片 · 星云柱',
    i_vortex_fragment:'星旋碎片 · 星旋柱', i_stardust_fragment:'星尘碎片 · 星尘柱',
    i_luminite:'夜明矿 · 月亮领主掉落', i_luminite_bar:'夜明锭',
    i_sword_meowmere:'喵刀 · 终极近战', i_gun_sdmg:'SDMG · 终极远程', i_staff_prism:'终极棱镜 · 终极魔法',
    i_helm_solar:'日耀头盔', i_chest_solar:'日耀胸甲', i_legs_solar:'日耀护腿',
    i_helm_nebula:'星云头盔', i_chest_nebula:'星云胸甲', i_legs_nebula:'星云护腿',
    i_wing_stardust:'星尘之翼 · 有限飞行', i_celestial_sigil:'天界符咒 · 召唤月亮领主',
    i_workbench:'工作台 · 解锁高级合成',
    i_furnace:'熔炉 · 冶炼矿石', i_anvil:'铁砧 · 制作金属装备',
    i_life_crystal:'生命水晶 · 永久 +20 最大HP(到400)', i_mana_crystal:'魔力水晶 · 永久 +20 最大MP(到200)',
    i_helm_iron:'铁头盔', i_chest_iron:'铁胸甲', i_legs_iron:'铁护腿',
    i_acc_cloud:'云瓶 · 二段跳', i_acc_hermes:'赫尔墨斯靴 · 加速奔跑', i_acc_shield:'克苏鲁之盾',
    i_boss_summon_eoc:'可疑眼球 · 夜晚召唤克苏鲁之眼',
    i_lens:'晶状体 · 击杀魔眼掉落', i_copper_coin:'铜币', i_silver_coin:'银币', i_gold_coin:'金币'
  };

  UI.prototype.drawInventory=function(ctx,canvasW,canvasH,mouse){
    const p=this.game.player;
    ctx.fillStyle='rgba(8,12,22,.93)'; ctx.fillRect(0,0,canvasW,canvasH);
    const px=Math.floor((canvasW-PW)/2), py=Math.floor((canvasH-PH)/2);
    // 主面板 + 内阴影边框
    ctx.fillStyle='rgb(32,42,62)'; ctx.fillRect(px,py,PW,PH);
    ctx.strokeStyle='rgb(140,160,190)'; ctx.lineWidth=3; ctx.strokeRect(px,py,PW,PH);
    ctx.strokeStyle='rgba(245,215,110,.35)'; ctx.lineWidth=1; ctx.strokeRect(px+4,py+4,PW-8,PH-8);
    // 标题
    ctx.fillStyle='rgb(245,215,110)'; ctx.font='bold 18px sans-serif'; ctx.textBaseline='top';
    ctx.fillText('背包 · 装备 · 合成', px+16, py+12);
    ctx.fillStyle='#9ab'; ctx.font='11px sans-serif';
    ctx.fillText('左键装快捷栏/合成 · 右键使用·穿戴 · T丢弃当前栏 · 滚轮配方 · E关闭', px+16, py+34);
    // 状态条：防御 / 四系加成 / 随从 / 套装（合并一行，避免文字重叠）
    const st=55;
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(px+16, py+st-3, PW-32, 18);
    ctx.font='11px sans-serif';
    ctx.fillStyle='rgb(180,210,235)';
    ctx.fillText('防御 '+p.totalDef(), px+22, py+st+1);
    let stx=px+22+ctx.measureText('防御 '+p.totalDef()).width+16;
    const clsDefs=[['melee','近战','#ff9a8a'],['ranged','远程','#8ad89a'],['magic','魔法','#b09aff'],['summon','召唤','#ffd06a']];
    for(const [key,label,color] of clsDefs){
      const s=p.combatStats(key);
      ctx.fillStyle=color;
      const txt=`${label}+${Math.round((s.damage-1)*100)}%`;
      ctx.fillText(txt, stx, py+st+1); stx+=ctx.measureText(txt).width+14;
    }
    const usedMinions=this.game.minions?this.game.minions.reduce((n,m)=>n+(m.slots||1),0):0;
    ctx.fillStyle='#ffe9c0';
    ctx.fillText('随从 '+usedMinions+'/'+p.combatStats('summon').maxMinions, stx, py+st+1);
    stx+=ctx.measureText('随从 '+usedMinions+'/'+p.combatStats('summon').maxMinions).width+14;
    const setBonus=p.setBonus?p.setBonus():null;
    if(setBonus&&setBonus.set){
      ctx.fillStyle='rgb(120,220,140)'; ctx.fillText('套装['+setBonus.set+']', stx, py+st+1);
    }

    const contentBottom = py+PH-INV_BOTTOM;

    // ===== 左：物品栏 =====
    const ix=px+18, iy=py+92;
    const cell=40, perRow=5, gap=5;
    ctx.fillStyle='#d0d8e8'; ctx.font='13px sans-serif';
    ctx.fillText('物品', ix, iy-18);
    ctx.fillStyle='rgba(0,0,0,.28)'; ctx.fillRect(ix-8, iy-8, ITEM_AREA_W+4, contentBottom-(iy-8));
    const allKeys=Object.keys(p.inv);
    this.invSlots=[];
    let hoverItem=null;
    for(let idx=0; idx<allKeys.length; idx++){
      const k=allKeys[idx];
      const r=Math.floor(idx/perRow), c=idx%perRow;
      const sx=ix+c*(cell+gap), sy=iy+r*(cell+gap);
      if(sy+cell>contentBottom-4) break;
      const hot = mouse.x>=sx && mouse.x<sx+cell && mouse.y>=sy && mouse.y<sy+cell;
      ctx.fillStyle=hot?'rgb(150,170,210)':'rgb(70,82,105)';
      ctx.fillRect(sx,sy,cell,cell);
      ctx.strokeStyle=hot?'rgb(245,215,110)':'#111'; ctx.lineWidth=1; ctx.strokeRect(sx,sy,cell,cell);
      drawItemIcon(ctx,k,sx+4,sy+4,32);
      ctx.fillStyle='#fff'; ctx.font='11px sans-serif'; ctx.textBaseline='bottom';
      ctx.fillText(p.inv[k],sx+3,sy+cell-2);
      this.invSlots.push({x:sx,y:sy,w:cell,h:cell,k});
      if(hot) hoverItem=k;
    }

    // ===== 中：装备槽（独立宽栏，不被合成遮挡） =====
    const ex=px+ITEM_AREA_W+28, ey=py+92;
    ctx.fillStyle='#d0d8e8'; ctx.font='13px sans-serif'; ctx.textBaseline='top';
    ctx.fillText('装备', ex, ey-18);
    ctx.fillStyle='rgba(0,0,0,.28)'; ctx.fillRect(ex-8, ey-8, EQUIP_W+8, contentBottom-(ey-8));
    this.equipSlots=[];
    const slots=[['head','头盔'],['body','胸甲'],['legs','护腿']];
    for(let i=0;i<3;i++){
      const sx=ex+8, sy=ey+i*50;
      ctx.fillStyle='rgb(55,65,90)';ctx.fillRect(sx,sy,42,42);
      ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.strokeRect(sx,sy,42,42);
      const it=p.equip[slots[i][0]];
      if(it) drawItemIcon(ctx,it,sx+5,sy+5,32);
      else {
        ctx.fillStyle='rgba(255,255,255,.12)'; ctx.font='18px sans-serif';
        ctx.fillText(i===0?'H':i===1?'B':'L', sx+14, sy+12);
      }
      this.equipSlots.push({x:sx,y:sy,w:42,h:42,slot:slots[i][0]});
      ctx.fillStyle='#b8c8dc';ctx.font='12px sans-serif';
      ctx.fillText(slots[i][1], sx+50, sy+14);
    }
    // 饰品 2 列 × 3 行，避免向下顶穿快捷栏
    ctx.fillStyle='#b8c8dc';ctx.font='12px sans-serif';
    ctx.fillText('饰品', ex+8, ey+160);
    this.accSlots=[];
    for(let i=0;i<5;i++){
      const col=i%2, row=Math.floor(i/2);
      const sx=ex+8+col*56, sy=ey+180+row*48;
      if(sy+42>contentBottom-8) break;
      ctx.fillStyle='rgb(55,65,90)';ctx.fillRect(sx,sy,42,42);
      ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.strokeRect(sx,sy,42,42);
      if(p.equip.acc[i]) drawItemIcon(ctx,p.equip.acc[i],sx+5,sy+5,32);
      this.accSlots.push({x:sx,y:sy,w:42,h:42,idx:i});
    }
    // 底部操作反馈
    if(this._invMsg && this._invMsgT>0){
      ctx.fillStyle='rgba(0,0,0,.7)'; ctx.font='12px sans-serif';
      const mw=ctx.measureText(this._invMsg).width;
      ctx.fillRect(px+ITEM_AREA_W+28-6, contentBottom-24, mw+12, 20);
      ctx.fillStyle='rgb(120,220,140)';
      ctx.fillText(this._invMsg, px+ITEM_AREA_W+28, contentBottom-20);
      this._invMsgT--;
    }

    // ===== 底部：快捷栏 =====
    this.hotSlots=[];
    const hbY=py+PH-48, hbSize=38, hbGap=5;
    const hbTotal=8*hbSize+7*hbGap;
    let hbx=px+Math.floor((PW-hbTotal)/2);
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(px+8, hbY-22, PW-16, 62);
    ctx.fillStyle='#cfd8e8'; ctx.font='11px sans-serif'; ctx.textBaseline='top';
    ctx.fillText('快捷栏 · 点格选中，再点左侧物品装入', px+18, hbY-18);
    for(let i=0;i<8;i++){
      const sx=hbx+i*(hbSize+hbGap);
      ctx.fillStyle=i===p.cur?'rgb(245,215,110)':'rgb(65,75,98)';
      ctx.fillRect(sx,hbY,hbSize,hbSize);
      ctx.strokeStyle=i===p.cur?'#fff':'#000';ctx.lineWidth=2;ctx.strokeRect(sx,hbY,hbSize,hbSize);
      if(p.hotbar[i]) drawItemIcon(ctx,p.hotbar[i],sx+3,hbY+3,32);
      ctx.fillStyle=i===p.cur?'#333':'rgba(255,255,255,.75)';ctx.font='10px sans-serif';
      ctx.fillText(String(i+1),sx+3,hbY+2);
      this.hotSlots.push({x:sx,y:hbY,w:hbSize,h:hbSize,i});
    }

    // ===== 右：合成列 =====
    const rx=px+ITEM_AREA_W+EQUIP_W+40, ry=py+92;
    const rcpW=PW-ITEM_AREA_W-EQUIP_W-58;
    const rcpViewH=Math.min(RCP_VIEW_H, contentBottom-ry-8);
    ctx.fillStyle='#d0d8e8'; ctx.font='13px sans-serif'; ctx.textBaseline='top';
    ctx.fillText('可合成', rx, ry-18);
    ctx.fillStyle='rgba(0,0,0,.28)'; ctx.fillRect(rx-6, ry-8, rcpW+12, rcpViewH+12);

    const station=this.nearStation();
    const rows=[]; // {out,r,ok}
    for(const out in RECIPES){
      const r=RECIPES[out];
      if(r.station==='workbench' && !station.workbench) continue;
      if(r.station==='furnace' && !station.furnace) continue;
      if(r.station==='anvil' && !station.anvil) continue;
      let ok=true;
      for(const m in r.need) if((p.inv[m]||0) < r.need[m]){ok=false;break;}
      rows.push({out,r,ok});
    }
    const contentH = rows.length*RCP_ROW_H;
    const maxScroll = Math.max(0, contentH - rcpViewH);
    // 平滑滚动
    this.scroll += (this.scrollTarget - this.scroll) * 0.25;
    if(this.scroll < 0) this.scroll = 0;
    if(this.scroll > maxScroll) this.scroll = maxScroll;
    if(this.scrollTarget < 0) this.scrollTarget = 0;
    if(this.scrollTarget > maxScroll) this.scrollTarget = maxScroll;

    // 裁剪可视区
    ctx.save();
    ctx.beginPath(); ctx.rect(rx, ry, rcpW, rcpViewH); ctx.clip();
    this.recipeSlots=[];
    let hoverRecipe=null;
    for(let i=0;i<rows.length;i++){
      const yy = ry + i*RCP_ROW_H - this.scroll;
      if(yy+RCP_ROW_H < ry || yy > ry+rcpViewH) continue; // 视口外不画
      const row=rows[i];
      const hot = mouse.x>=rx && mouse.x<rx+rcpW && mouse.y>=yy && mouse.y<yy+RCP_ROW_H-2;
      ctx.fillStyle = row.ok ? (hot?'rgb(90,140,90)':'rgb(70,110,70)') : (hot?'rgb(110,70,70)':'rgb(80,50,50)');
      ctx.fillRect(rx, yy, rcpW, RCP_ROW_H-2);
      ctx.strokeStyle='#000'; ctx.lineWidth=1; ctx.strokeRect(rx, yy, rcpW, RCP_ROW_H-2);
      drawItemIcon(ctx,row.out,rx+3,yy+2,28);
      ctx.fillStyle = row.ok?'#fff':'#aaa'; ctx.font='13px sans-serif'; ctx.textBaseline='top';
      ctx.fillText(NAMES[row.out]||row.out, rx+36, yy+4);
      ctx.font='10px sans-serif'; ctx.fillStyle='#cfc';
      let txt='';
      for(const m in row.r.need) txt+=`${NAMES[m]||m}×${row.r.need[m]} `;
      ctx.fillText(txt, rx+36, yy+19);
      ctx.fillStyle = row.ok? '#7d7':'#a77'; ctx.font='10px sans-serif';
      ctx.fillText(`×${row.r.n||1}`, rx+rcpW-22, yy+9);
      if(row.ok){ this.recipeSlots.push({x:rx,y:yy,w:rcpW,h:RCP_ROW_H-2,out:row.out,r:row.r}); }
      if(hot) hoverRecipe={out:row.out,r:row.r,ok:row.ok};
    }
    ctx.restore();

    // 滚动条
    if(contentH > rcpViewH){
      const barX = rx+rcpW+4, barY=ry, barH=rcpViewH;
      ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(barX,barY,6,barH);
      const thumbH = Math.max(20, barH * rcpViewH / contentH);
      const thumbY = barY + (barH-thumbH) * (this.scroll/maxScroll);
      ctx.fillStyle = this.dragBar?'rgb(245,215,110)':'rgba(200,200,220,.7)';
      ctx.fillRect(barX, thumbY, 6, thumbH);
      this.scrollBarRect={x:barX,y:barY,w:6,h:barH,thumbY,thumbH,maxScroll};
    } else this.scrollBarRect=null;

    // ===== Tooltip =====
    let tip=null;
    if(hoverItem) tip={name:NAMES[hoverItem]||hoverItem, desc:weaponDescription(hoverItem)||TOOLTIP[hoverItem]||''};
    else if(hoverRecipe) tip={name:NAMES[hoverRecipe.out]||hoverRecipe.out,
      desc:weaponDescription(hoverRecipe.out)||(TOOLTIP[hoverRecipe.out]||'')+(hoverRecipe.ok?'  [材料已足]':'  [材料不足]')};
    if(tip){
      const lines=[tip.name];
      if(tip.desc) lines.push(tip.desc);
      ctx.font='12px sans-serif';
      const w = Math.max(...lines.map(l=>ctx.measureText(l).width)) + 16;
      const h = 18 + lines.length*16;
      let tx=mouse.x+14, ty=mouse.y+14;
      if(tx+w > canvasW-4) tx = mouse.x - w - 14;
      if(ty+h > canvasH-4) ty = mouse.y - h - 6;
      ctx.fillStyle='rgba(15,20,35,.95)';
      ctx.fillRect(tx,ty,w,h);
      ctx.strokeStyle='rgb(120,140,170)'; ctx.lineWidth=2; ctx.strokeRect(tx,ty,w,h);
      ctx.fillStyle='rgb(245,215,110)'; ctx.textBaseline='top';
      ctx.fillText(tip.name, tx+8, ty+6);
      if(tip.desc){ ctx.fillStyle='#cfd6e2'; ctx.font='11px sans-serif'; ctx.fillText(tip.desc, tx+8, ty+24); }
    }

    this.invRect={x:px,y:py,w:PW,h:PH};
  };

  UI.prototype.nearWorkbench=function(){
    const p=this.game.player;
    const cx=Math.floor((p.x+p.w/2)/16), cy=Math.floor((p.y+p.h/2)/16);
    for(let dy=-3;dy<=3;dy++) for(let dx=-3;dx<=3;dx++){
      if(this.game.world.get(cx+dx,cy+dy)===11) return true;
    }
    return false;
  };
  UI.prototype.nearStation=function(){
    const p=this.game.player;
    const cx=Math.floor((p.x+p.w/2)/16), cy=Math.floor((p.y+p.h/2)/16);
    const r={workbench:false,furnace:false,anvil:false};
    for(let dy=-3;dy<=3;dy++) for(let dx=-3;dx<=3;dx++){
      const t=this.game.world.get(cx+dx,cy+dy);
      if(t===11) r.workbench=true;
      if(t===14) r.furnace=true;
      if(t===15) r.anvil=true;
    }
    return r;
  };

  // 滚动
  UI.prototype.scrollBy=function(dy){ this.scrollTarget += dy; };

  UI.prototype.flashMsg=function(msg){
    this._invMsg=msg; this._invMsgT=90;
  };

  // 鼠标事件（背包打开时）
  UI.prototype.mouseDown=function(mx,my,button){
    const p=this.game.player;
    // 右键：使用 / 穿戴 / 装备到快捷栏
    if(button===2){
      if(this.invSlots){
        for(const s of this.invSlots){
          if(mx>=s.x&&mx<s.x+s.w&&my>=s.y&&my<s.y+s.h){
            const r=p.useFromInv(s.k);
            if(r===true) this.flashMsg('已使用 '+ (window.ITEMS.NAMES[s.k]||s.k));
            else if(r==='hotbar') this.flashMsg('已装入快捷栏 '+(p.cur+1));
            else if(typeof r==='string' && r.startsWith('summon:')){
              this.invOpen=false;
              const ok=this.game.summonBoss(r.slice(7));
              if(ok!==false){
                p.takeInv(s.k,1);
                this.flashMsg('已使用召唤物');
              }
            } else if(r==='voodoo'){
              this.invOpen=false;
              if(this.game.trySummonWof()){
                p.takeInv(s.k,1);
                this.flashMsg('投入岩浆……血肉墙！');
              } else {
                this.flashMsg(this.game._msg||'无法召唤');
              }
            } else if(r===false){
              const def=window.DATA.ITEM[s.k];
              if(def && (def.kind==='potion'||def.kind==='consumable'||def.kind==='crystal'))
                this.flashMsg('无法使用（已满或已达上限）');
              else this.flashMsg('该物品无法在此使用');
            } else {
              this.flashMsg('已穿戴 '+ (window.ITEMS.NAMES[s.k]||s.k));
            }
            return;
          }
        }
      }
      // 右键快捷栏：卸下该格（物品仍在背包）
      if(this.hotSlots){
        for(const s of this.hotSlots){
          if(mx>=s.x&&mx<s.x+s.w&&my>=s.y&&my<s.y+s.h){
            if(p.hotbar[s.i]){ p.hotbar[s.i]=null; this.flashMsg('已从快捷栏卸下'); }
            return;
          }
        }
      }
      return;
    }
    if(button!==0) return;
    // 左键：物品 → 装入当前快捷栏
    if(this.invSlots){
      for(const s of this.invSlots){
        if(mx>=s.x&&mx<s.x+s.w&&my>=s.y&&my<s.y+s.h){
          p.setHotbar(s.k);
          this.flashMsg((window.ITEMS.NAMES[s.k]||s.k)+' → 快捷栏 '+(p.cur+1));
          return;
        }
      }
    }
    // 左键：点快捷栏格切换选中
    if(this.hotSlots){
      for(const s of this.hotSlots){
        if(mx>=s.x&&mx<s.x+s.w&&my>=s.y&&my<s.y+s.h){
          p.cur=s.i;
          this.flashMsg('选中快捷栏 '+(s.i+1)+(p.hotbar[s.i]?(' · '+(window.ITEMS.NAMES[p.hotbar[s.i]]||p.hotbar[s.i])):''));
          return;
        }
      }
    }
    // 左键：脱下身上装备 / 饰品
    if(this.equipSlots){
      for(const s of this.equipSlots){
        if(mx>=s.x&&mx<s.x+s.w&&my>=s.y&&my<s.y+s.h){
          if(p.equip[s.slot]){ p.unequipSlot(s.slot); this.flashMsg('已脱下装备'); }
          return;
        }
      }
    }
    if(this.accSlots){
      for(const s of this.accSlots){
        if(mx>=s.x&&mx<s.x+s.w&&my>=s.y&&my<s.y+s.h){
          if(p.equip.acc[s.idx]){ p.unequipAcc(s.idx); this.flashMsg('已脱下饰品'); }
          return;
        }
      }
    }
    // 滚动条拖动
    if(this.scrollBarRect){
      const r=this.scrollBarRect;
      if(mx>=r.x-2 && mx<=r.x+r.w+2 && my>=r.y && my<=r.y+r.h){
        this.dragBar=true;
        this._dragMy=my; this._dragScroll=this.scroll;
        return;
      }
    }
    // 商店购买
    if(this.shopSlots){
      for(const s of this.shopSlots){
        if(mx>=s.x&&mx<s.x+s.w&&my>=s.y&&my<s.y+s.h){
          const m=this.game.npcs.find(n=>n.spawned && n.buy);
          if(m){
            const ok=m.buy(s.item, this.game.player);
            this.flashMsg(ok?'购买成功':'金币不足');
          }
          return;
        }
      }
    }
    // 合成
    if(this.recipeSlots){
      for(const s of this.recipeSlots){
        if(mx>=s.x&&mx<s.x+s.w&&my>=s.y&&my<s.y+s.h){
          for(const m in s.r.need) if((p.inv[m]||0)<s.r.need[m]){ this.flashMsg('材料不足'); return; }
          for(const m in s.r.need) p.inv[m]-=s.r.need[m];
          for(const m in s.r.need) if(p.inv[m]<=0) delete p.inv[m];
          p.give(s.out, s.r.n||1, true);
          if(window.AUDIO) AUDIO.play('craft');
          this.flashMsg('合成 '+(window.ITEMS.NAMES[s.out]||s.out)+' ×'+(s.r.n||1));
          return;
        }
      }
    }
  };
  UI.prototype.mouseMove=function(mx,my){
    if(this.dragBar && this.scrollBarRect){
      const r=this.scrollBarRect;
      const dY = my - this._dragMy;
      const ratio = dY / (r.h - r.thumbH);
      this.scrollTarget = this._dragScroll + ratio * r.maxScroll;
    }
  };
  UI.prototype.mouseUp=function(){ this.dragBar=false; };

  // ===== 小地图 =====
  UI.prototype.drawMinimap=function(ctx,canvasW,canvasH){
    const g=this.game, W=g.world, p=g.player;
    if(!W||!p) return;
    const mw=148, mh=110, pad=10;
    const mx=canvasW-mw-pad, my=pad;
    ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(mx-3,my-3,mw+6,mh+6);
    ctx.strokeStyle='rgba(245,215,110,.5)'; ctx.strokeRect(mx-3,my-3,mw+6,mh+6);
    // 采样世界颜色
    const sx=Math.max(0, Math.floor((p.x/16)-mw/2));
    const sy=Math.max(0, Math.floor((p.y/16)-mh/2));
    for(let y=0;y<mh;y++){
      for(let x=0;x<mw;x++){
        const tx=sx+x, ty=sy+y;
        if(tx>=W.w||ty>=W.h){ ctx.fillStyle='#000'; ctx.fillRect(mx+x,my+y,1,1); continue; }
        const t=W.get(tx,ty);
        let col='#1a2840';
        if(t===0){
          if(ty>(W.heightMap[tx]||0)) col='#0a1420';
          else col=(g.bloodMoon?'#3a1020':'#3a5f8a');
        } else if(t===1||t===24||t===38||t===53) col='#3a8a3a';
        else if(t===2||t===25||t===45) col='#6a4a2a';
        else if(t===3||t===39||t===44||t===52||t===55) col='#6a6a72';
        else if(t===6) col='#d8c890';
        else if(t===18||t===19) col='#d0e0f0';
        else if(t===27) col='#e05020';
        else if(t===46||t===47) col='#c05020';
        else if(t===20||t===21||t===22||t===28||t===29||t===48||t===49||t===50||t===57) col='#e0c050';
        else if(t===4||t===5||t===7) col='#8a5a2a';
        else col='#888';
        ctx.fillStyle=col; ctx.fillRect(mx+x,my+y,1,1);
      }
    }
    // 玩家
    const px=Math.floor(p.x/16)-sx, py=Math.floor(p.y/16)-sy;
    if(px>=0&&px<mw&&py>=0&&py<mh){
      ctx.fillStyle='#fff'; ctx.fillRect(mx+px-1,my+py-1,3,3);
      ctx.fillStyle='#f55'; ctx.fillRect(mx+px,my+py,1,1);
    }
    // Boss
    if(g.boss&&g.boss.alive){
      const bx=Math.floor(g.boss.x/16)-sx, by=Math.floor(g.boss.y/16)-sy;
      if(bx>=0&&bx<mw&&by>=0&&by<mh){ ctx.fillStyle='#f0f'; ctx.fillRect(mx+bx-1,my+by-1,3,3); }
    }
    ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='10px sans-serif'; ctx.textBaseline='top';
    ctx.fillText('地图 N开关', mx+4, my+mh-12);
  };

  // ===== 成就面板 =====
  UI.prototype.drawAchievements=function(ctx,canvasW,canvasH){
    const g=this.game;
    const defs=window.ACH_DEFS||[];
    const ach=g.achievements||{};
    ctx.fillStyle='rgba(8,12,22,.92)'; ctx.fillRect(0,0,canvasW,canvasH);
    const pw=520, ph=Math.min(460, canvasH-40);
    const px=Math.floor((canvasW-pw)/2), py=Math.floor((canvasH-ph)/2);
    ctx.fillStyle='rgb(32,42,62)'; ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle='rgb(140,160,190)'; ctx.lineWidth=3; ctx.strokeRect(px,py,pw,ph);
    ctx.fillStyle='rgb(245,215,110)'; ctx.font='bold 18px sans-serif'; ctx.textBaseline='top';
    const done=defs.filter(a=>ach[a.id]).length;
    ctx.fillText('成就  '+done+'/'+defs.length, px+16, py+12);
    ctx.fillStyle='#9ab'; ctx.font='11px sans-serif';
    ctx.fillText('按 B 关闭', px+16, py+34);
    let yy=py+56;
    ctx.font='13px sans-serif';
    for(const a of defs){
      if(yy>py+ph-24) break;
      const ok=!!ach[a.id];
      ctx.fillStyle=ok?'rgba(40,90,50,.55)':'rgba(0,0,0,.25)';
      ctx.fillRect(px+12, yy-2, pw-24, 28);
      ctx.fillStyle=ok?'#7d7':'#888';
      ctx.fillText(ok?'✓ ':'○ ', px+18, yy+4);
      ctx.fillStyle=ok?'#f5d76e':'#aaa';
      ctx.fillText(a.name, px+40, yy+4);
      ctx.fillStyle=ok?'#cfd6e2':'#666';
      ctx.font='11px sans-serif';
      ctx.fillText(a.desc, px+160, yy+6);
      ctx.font='13px sans-serif';
      yy+=32;
    }
  };

  window.UI=UI;
})();
