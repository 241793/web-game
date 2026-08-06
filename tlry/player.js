/* ===== 玩家 =====
 * 引用 data.js 的 ITEM / PLACE_TILE
 * 装备槽：head/body/legs，提供 def 防御减伤
 * 生命/魔力水晶使用提升上限；金币（铜币/银币/金币）
 */
(function(){
  const TS=16, SPR=window.ASSETS.sprites;
  const DATA=window.DATA;
  const TILE=DATA.TILES, BYNAME=DATA.TILE_BY_NAME;
  const ITEM=DATA.ITEM, PLACE_TILE=DATA.PLACE_TILE;

  function Player(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=14; this.h=28;
    this.vx=0; this.vy=0;
    this.onGround=false;
    this.facing=true;
    this.walkT=0;
    this.maxHp=20; this.hp=20;     // 上限可由 life_crystal 提升到 400
    this.maxMp=10; this.mp=10;     // 上限可由 mana_crystal 提升到 200
    this.hurtCool=0;
    this.swing=0;
    this.invuln=0;
    this.inv={};
    this.hotbar=[null,null,null,null,null,null,null,null];
    this.cur=0;
    this.reach=4*TS;
    this.atk=8;
    this.equip={head:null, body:null, legs:null, acc:[]};
    this.def=0;
    this.coins=0;                  // 单位：铜币（1银=100，1金=10000）
    this.weaponCooldown=0;
    this.manaRegenDelay=0;
    this.flyMode=false;            // 开发者模式：自由飞行
    this.ghostMode=false;          // 开发者模式：穿墙无碰撞
    this.godMode=false;            // 开发者模式：无敌
    this.bossDown={eoc:false,eow:false,queenbee:false,skeletron:false,wof:false,destroyer:false,twins:false,prime:false,plantera:false,golem:false,cultist:false,moonlord:false};
  }

  Player.prototype.give=function(itemKey,n,silent){
    if(n===undefined)n=1;
    // 金币自动合并到 coins
    if(itemKey==='i_copper_coin'){ this.coins+=n; return; }
    if(itemKey==='i_silver_coin'){ this.coins+=n*100; return; }
    if(itemKey==='i_gold_coin'){ this.coins+=n*10000; return; }
    if(itemKey==='i_platinum_coin'){ this.coins+=n*1000000; return; }
    this.inv[itemKey]=(this.inv[itemKey]||0)+n;
    if(!silent && window.AUDIO) AUDIO.play('pickup');
    if(this.hotbar.indexOf(itemKey)===-1){
      const e=this.hotbar.indexOf(null);
      if(e!==-1) this.hotbar[e]=itemKey;
    }
  };

  // 扣除背包物品，同步清理 hotbar
  Player.prototype.takeInv=function(itemKey,n){
    if(n===undefined)n=1;
    if((this.inv[itemKey]||0)<n) return false;
    this.inv[itemKey]-=n;
    if(this.inv[itemKey]<=0){
      delete this.inv[itemKey];
      for(let i=0;i<this.hotbar.length;i++) if(this.hotbar[i]===itemKey) this.hotbar[i]=null;
    }
    return true;
  };

  // 把物品装到当前 Hotbar 格（背包左键）
  Player.prototype.setHotbar=function(itemKey,slot){
    if(slot===undefined) slot=this.cur;
    if((this.inv[itemKey]||0)<=0) return false;
    this.hotbar[slot]=itemKey;
    this.cur=slot;
    if(window.AUDIO) AUDIO.play('open');
    return true;
  };

  // 从背包直接使用物品（药水/水晶/消耗品/装备/召唤）
  // 返回 true | false | 'summon:xxx' | 'hotbar'
  Player.prototype.useFromInv=function(itemKey){
    if((this.inv[itemKey]||0)<=0) return false;
    const def=ITEM[itemKey];
    if(!def) return false;

    if(def.kind==='armor'||def.kind==='acc') return this.equipItem(itemKey);

    if(def.kind==='potion'){
      if(itemKey==='i_heart'){
        if(this.hp>=this.maxHp) return false;
        this.hp=Math.min(this.maxHp,this.hp+(def.hp||100));
        this.takeInv(itemKey,1);
        if(window.AUDIO) AUDIO.play('potion');
        return true;
      }
      if(itemKey==='i_star'){
        if(this.mp>=this.maxMp) return false;
        this.mp=Math.min(this.maxMp,this.mp+(def.mp||100));
        this.takeInv(itemKey,1);
        if(window.AUDIO) AUDIO.play('potion');
        return true;
      }
      // 增益药水：简化为回少量血+音效
      if(def.buff){
        this.takeInv(itemKey,1);
        if(def.def) this._buffDef={v:def.def,t:def.dur||480};
        if(def.spd) this._buffSpd={v:def.spd,t:def.dur||480};
        if(window.AUDIO) AUDIO.play('potion');
        return true;
      }
      return false;
    }

    if(def.kind==='crystal'){
      if(itemKey==='i_life_crystal' && this.maxHp<400){
        this.maxHp+=20; this.hp+=20;
        this.takeInv(itemKey,1);
        if(window.AUDIO) AUDIO.play('craft');
        return true;
      }
      if(itemKey==='i_mana_crystal' && this.maxMp<200){
        this.maxMp+=20; this.mp+=20;
        this.takeInv(itemKey,1);
        if(window.AUDIO) AUDIO.play('craft');
        return true;
      }
      return false;
    }

    if(def.kind==='consumable'){
      if(def.special==='voodoo') return 'voodoo';
      if(def.special==='battery') return 'battery';
      if(this.hp>=this.maxHp) return false;
      this.hp=Math.min(this.maxHp, this.hp+(def.hp||15));
      this.takeInv(itemKey,1);
      if(window.AUDIO) AUDIO.play('potion');
      return true;
    }

    if(def.kind==='summon') return 'summon:'+def.boss;

    // 工具/武器/方块：装到当前快捷栏
    if(def.kind==='pick'||def.kind==='axe'||def.kind==='sword'||def.kind==='bow'||def.kind==='magic'||def.kind==='minionStaff'||def.kind==='place'||def.kind==='ammo'){
      this.setHotbar(itemKey);
      return 'hotbar';
    }
    return false;
  };

  // 从背包穿装备/饰品到指定槽位（右键点击物品时调用）
  Player.prototype.equipItem=function(itemKey){
    const it=ITEM[itemKey];
    if(!it) return false;
    if((this.inv[itemKey]||0)<=0) return false;
    const take=()=>{ this.inv[itemKey]--; if(this.inv[itemKey]<=0){delete this.inv[itemKey]; const i=this.hotbar.indexOf(itemKey); if(i!==-1)this.hotbar[i]=null;} };
    if(it.kind==='armor'){
      const slot=it.slot;
      if(this.equip[slot]!==null) this.give(this.equip[slot],1);
      this.equip[slot]=itemKey;
      take();
      if(window.AUDIO) AUDIO.play('craft');
      return true;
    }
    if(it.kind==='acc'){
      if(this.equip.acc.length>=5) return false;
      this.equip.acc.push(itemKey);
      take();
      if(window.AUDIO) AUDIO.play('craft');
      return true;
    }
    return false;
  };
  // 脱下一件装备回背包
  Player.prototype.unequipSlot=function(slot){
    const it=this.equip[slot];
    if(!it) return false;
    this.give(it,1);
    this.equip[slot]=null;
    if(window.AUDIO) AUDIO.play('craft');
    return true;
  };
  Player.prototype.unequipAcc=function(idx){
    const it=this.equip.acc[idx];
    if(!it) return false;
    this.give(it,1);
    this.equip.acc.splice(idx,1);
    if(window.AUDIO) AUDIO.play('craft');
    return true;
  };

  Player.prototype.setBonus=function(){
    if(this.equip.head && this.equip.body && this.equip.legs){
      const s=ITEM[this.equip.head]&&ITEM[this.equip.head].set;
      if(s && ITEM[this.equip.body]&&ITEM[this.equip.body].set===s && ITEM[this.equip.legs]&&ITEM[this.equip.legs].set===s){
        const def=DATA.SET_BONUSES&&DATA.SET_BONUSES[s];
        if(def) return Object.assign({set:s},def);
      }
    }
    return {set:null,def:0,desc:''};
  };
  Player.prototype.totalDef=function(){
    let d=0;
    for(const k in this.equip){
      if(k==='acc') continue;
      const it=this.equip[k];
      if(it && ITEM[it] && ITEM[it].def) d+=ITEM[it].def;
    }
    return d+(this.setBonus().def||0);
  };
  Player.prototype.combatStats=function(damageClass){
    const cls=damageClass||'melee';
    const stats={damage:1,crit:0,attackSpeed:1,knockback:1,manaCost:1,ammoSave:0,maxMinions:1};
    const apply=b=>{
      if(!b) return;
      if(b[cls+'Damage']) stats.damage+=b[cls+'Damage'];
      if(b[cls+'Crit']) stats.crit+=b[cls+'Crit'];
      if(b.attackSpeed) stats.attackSpeed+=b.attackSpeed;
      if(b.knockback) stats.knockback+=b.knockback;
      if(b.manaCost) stats.manaCost+=b.manaCost;
      if(b.ammoSave) stats.ammoSave+=b.ammoSave;
      if(b.minions) stats.maxMinions+=b.minions;
    };
    for(const slot of ['head','body','legs']){
      const key=this.equip[slot], def=key&&ITEM[key];
      if(def&&def.bonuses) apply(def.bonuses);
    }
    apply(this.setBonus());
    for(const key of this.equip.acc){
      const def=ITEM[key]; if(!def) continue;
      if(def.effect==='meleeDmg'&&cls==='melee') stats.damage+=0.15;
      if(def.effect==='rangedDmg'&&cls==='ranged') stats.damage+=0.15;
      if(def.effect==='magicDmg'&&cls==='magic') stats.damage+=0.15;
      if(def.effect==='summonDmg'&&cls==='summon') stats.damage+=0.15;
    }
    stats.damage=Math.max(0.1,stats.damage);
    stats.attackSpeed=Math.max(0.25,stats.attackSpeed);
    stats.manaCost=Math.max(0.2,stats.manaCost);
    stats.ammoSave=Math.min(0.75,Math.max(0,stats.ammoSave));
    stats.maxMinions=Math.max(1,Math.floor(stats.maxMinions));
    return stats;
  };
  Player.prototype.spendMana=function(cost){
    const n=Math.max(1,Math.ceil(cost*this.combatStats('magic').manaCost));
    if(this.mp<n) return false;
    this.mp-=n; this.manaRegenDelay=90;
    return true;
  };

  Player.prototype.tryHurt=function(d){
    if(this.godMode) return;       // 开发者无敌
    if(this.invuln>0) return;
    // 难度伤害倍率
    let mul=1;
    if(window.game && window.game.diff) mul=window.game.diff.dmgMul||1;
    if(window.game && window.game.bloodMoon) mul*=1.35;
    d=d*mul;
    let def=this.totalDef();
    if(this._buffDef && this._buffDef.t>0) def+=this._buffDef.v;
    // 徽章近战减伤简化：战士徽章略增有效防御感——改为攻击侧，这里不改
    const eff=Math.max(1, d - def*0.5);
    this.hp-=Math.round(eff);
    this.invuln=40;
    this.hurtCool=20;
    if(this.hp<0) this.hp=0;
    if(window.AUDIO) AUDIO.play('hurt');
  };

  Player.prototype.useItem=function(wx,wy,mx,my){
    const it=this.hotbar[this.cur];
    if(!it) return false;
    const def=ITEM[it];
    if(!def) return false;

    // 工具/武器：左键已处理，右键不动作
    if(def.kind==='pick'||def.kind==='axe'||def.kind==='bow'||def.kind==='magic'||def.kind==='minionStaff') return false;
    if(def.kind==='sword'){
      this.swing=1;
      return false;
    }

    // 药水
    if(def.kind==='potion'){
      if(it==='i_heart'){
        if(this.hp>=this.maxHp) return false;
        this.hp=Math.min(this.maxHp,this.hp+def.hp);
        this.inv[it]--; if(this.inv[it]<=0){delete this.inv[it]; this.hotbar[this.hotbar.indexOf(it)]=null;}
        if(window.AUDIO) AUDIO.play('potion');
        return true;
      }
      if(it==='i_star'){
        if(this.mp>=this.maxMp) return false;
        this.mp=Math.min(this.maxMp,this.mp+def.mp);
        this.inv[it]--; if(this.inv[it]<=0){delete this.inv[it]; this.hotbar[this.hotbar.indexOf(it)]=null;}
        if(window.AUDIO) AUDIO.play('potion');
        return true;
      }
    }

    // 水晶：永久提升上限
    if(def.kind==='crystal'){
      if(it==='i_life_crystal' && this.maxHp<400){
        this.maxHp+=20; this.hp+=20;
        this.inv[it]--; if(this.inv[it]<=0){delete this.inv[it]; this.hotbar[this.hotbar.indexOf(it)]=null;}
        if(window.AUDIO) AUDIO.play('craft');
        return true;
      }
      if(it==='i_mana_crystal' && this.maxMp<200){
        this.maxMp+=20; this.mp+=20;
        this.inv[it]--; if(this.inv[it]<=0){delete this.inv[it]; this.hotbar[this.hotbar.indexOf(it)]=null;}
        if(window.AUDIO) AUDIO.play('craft');
        return true;
      }
      return false;
    }

    // 装备/饰品：右键穿上
    if(def.kind==='armor'||def.kind==='acc'){
      return this.equipItem(it);
    }

    // 召唤物：交给 main.js 处理 Boss 召唤
    if(def.kind==='summon'){
      return 'summon:'+def.boss;
    }

    // 可食用（蘑菇等）/ 巫毒娃娃 / 蜥蜴电池
    if(def.kind==='consumable'){
      if(def.special==='voodoo') return 'voodoo';
      if(def.special==='battery') return 'battery';
      if(this.hp>=this.maxHp) return false;
      this.hp=Math.min(this.maxHp, this.hp+(def.hp||15));
      this.inv[it]--; if(this.inv[it]<=0){delete this.inv[it]; const i=this.hotbar.indexOf(it); if(i!==-1)this.hotbar[i]=null;}
      if(window.AUDIO) AUDIO.play('potion');
      return true;
    }

    // 可放置物
    if(def.kind==='place' && PLACE_TILE[it]){
      if(this.inv[it]<=0) return false;
      const tx=Math.floor(wx/TS), ty=Math.floor(wy/TS);
      const cx=this.x+this.w/2, cy=this.y+this.h/2;
      if(Math.abs((tx+0.5)*TS-cx)>this.reach || Math.abs((ty+0.5)*TS-cy)>this.reach) return false;
      const hasN=this.world.isSolid(tx-1,ty)||this.world.isSolid(tx+1,ty)
              ||this.world.isSolid(tx,ty-1)||this.world.isSolid(tx,ty+1)
              ||this.world.bg[ty*this.world.w+tx];
      if(!hasN) return false;
      const bx=tx*TS,by=ty*TS;
      if(bx<this.x+this.w && bx+TS>this.x && by<this.y+this.h && by+TS>this.y) return false;
      this.world.set(tx,ty,PLACE_TILE[it]);
      this.inv[it]--;
      if(this.inv[it]<=0){ delete this.inv[it]; const i=this.hotbar.indexOf(it); if(i!==-1)this.hotbar[i]=null; }
      return true;
    }

    return false;
  };

  Player.prototype.update=function(input,dt){
    const W=this.world;
    let ax=0;
    if(input.left){ax-=1; this.facing=false;}
    if(input.right){ax+=1; this.facing=true;}
    // buff 计时
    if(this._buffDef && this._buffDef.t>0) this._buffDef.t--;
    if(this._buffSpd && this._buffSpd.t>0) this._buffSpd.t--;
    let spd=2.2;
    // 饰品：赫尔墨斯靴加速
    if(this.equip.acc.indexOf('i_acc_hermes')!==-1) spd=3.4;
    if(this._buffSpd && this._buffSpd.t>0) spd*=this._buffSpd.v;
    this.vx=ax*spd;
    // 开发者飞行：免重力自由移动（jump 上 / down 下）
    if(this.flyMode){
      const fspd=4.0;
      this.vx=ax*fspd;
      let vy=0;
      if(input.jump) vy-=fspd;
      if(input.down) vy+=fspd;
      this.vy=vy;
      this.x+=this.vx; this.y+=this.vy;
      this.onGround=false; this.walkT=0; this._doubleJumped=false; this._flyFuel=120;
      if(this.invuln>0) this.invuln--;
      if(this.swing>0) this.swing-=0.15;
      if(this.hurtCool>0) this.hurtCool--;
      if(this.weaponCooldown>0) this.weaponCooldown=Math.max(0,this.weaponCooldown-dt);
      if(this.manaRegenDelay>0) this.manaRegenDelay=Math.max(0,this.manaRegenDelay-dt);
      if(this.manaRegenDelay<=0 && this.mp<this.maxMp) this.mp=Math.min(this.maxMp,this.mp+0.04);
      if(this.y>W.h*TS+400) this.tryHurt(999);
      return;
    }
    // 星尘之翼：有限飞行
    const hasWing=this.equip.acc.indexOf('i_wing_stardust')!==-1;
    if(hasWing){
      if(this._flyFuel===undefined) this._flyFuel=120;
      if(input.jump && !this.onGround && this._flyFuel>0){
        this.vy=Math.max(this.vy-0.55, -5.2);
        this._flyFuel--;
      }
      if(this.onGround) this._flyFuel=120;
    }
    if(input.jump && this.onGround){
      this.vy=-6.5; this.onGround=false;
      if(window.AUDIO) AUDIO.play('jump');
      // 云瓶二段跳
      if(this._doubleJumped===undefined) this._doubleJumped=false;
    }
    // 二段跳：腾空再按 jump
    if(input.jump && !this.onGround && !this._doubleJumped && this.equip.acc.indexOf('i_acc_cloud')!==-1 && this.vy>0){
      this.vy=-5.5; this._doubleJumped=true;
      if(window.AUDIO) AUDIO.play('jump');
    }
    if(this.onGround) this._doubleJumped=false;
    this.vy += hasWing && input.jump && this._flyFuel>0 ? 0.18 : 0.32;
    if(this.vy>14) this.vy=14;
    if(ax!==0 && this.onGround) this.walkT=(this.walkT+0.25)%4; else if(!this.onGround) this.walkT=0;
    const wasGround=this.onGround;
    this.x += this.vx;
    this.collideAxis('x');
    this.vyPrev=this.vy;
    this.y += this.vy;
    this.onGround=false;
    this.collideAxis('y');
    if(this.onGround && !wasGround && this.vyPrev>4){ if(window.AUDIO) AUDIO.play('land'); }
    if(this.y>W.h*TS+200){ this.tryHurt(999); }
    if(this.invuln>0) this.invuln--;
    if(this.swing>0) this.swing-=0.15;
    if(this.hurtCool>0) this.hurtCool--;
    if(this.weaponCooldown>0) this.weaponCooldown=Math.max(0,this.weaponCooldown-dt);
    if(this.manaRegenDelay>0) this.manaRegenDelay=Math.max(0,this.manaRegenDelay-dt);
    // 停止施法后恢复魔力
    if(this.manaRegenDelay<=0 && this.mp<this.maxMp) this.mp=Math.min(this.maxMp,this.mp+0.04);
  };

  Player.prototype.collideAxis=function(axis){
    if(this.ghostMode) return;    // 开发者穿墙：跳过一切碰撞
    const W=this.world;
    const x0=Math.floor(this.x/TS), x1=Math.floor((this.x+this.w-1)/TS);
    const y0=Math.floor(this.y/TS), y1=Math.floor((this.y+this.h-1)/TS);
    let best=null;
    for(let ty=y0;ty<=y1;ty++) for(let tx=x0;tx<=x1;tx++){
      if(!W.isSolid(tx,ty)) continue;
      const bx=tx*TS, by=ty*TS;
      if(axis==='x'){
        if(this.vx>0){ const p=bx-this.w; if(best===null||p<best) best=p; }
        else if(this.vx<0){ const p=bx+TS; if(best===null||p>best) best=p; }
      } else {
        if(this.vy>0){ const p=by-this.h; if(best===null||p<best) best=p; }
        else if(this.vy<0){ const p=by+TS; if(best===null||p>best) best=p; }
      }
    }
    if(best===null) return;
    if(axis==='x'){ this.x=best; this.vx=0; }
    else { if(this.vy>0) this.onGround=true; this.y=best; this.vy=0; }
  };

  Player.prototype.spriteKey=function(){
    const dir=this.facing?'r':'l';
    if(!this.onGround) return 'player_walk1_'+dir;
    if(this.vx!==0){
      const f=(this.walkT|0)+1;
      return 'player_walk'+(f>4?1:f)+'_'+dir;
    }
    return 'player_idle_'+dir;
  };
  Player.prototype.draw=function(ctx,cam){
    const sp=SPR[this.spriteKey()];
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const sx=Math.round(cx-cam.x-16);
    const sy=Math.round(cy-cam.y-16);
    if(this.invuln>0 && Math.floor(this.invuln/3)%2===0) ctx.globalAlpha=0.5;
    // 星尘之翼（画在身体后方，飞行时展开扇动）
    if(this.equip.acc.indexOf('i_wing_stardust')!==-1){
      const flying=!this.onGround && window.game&&window.game.input&&window.game.input.jump;
      const flap=flying?0.85:0.15;
      const wx=Math.round(cx-cam.x), wy=Math.round(cy-cam.y-4);
      ctx.save(); ctx.translate(wx,wy);
      ctx.save(); ctx.scale(-1,1); ctx.rotate(-flap); ctx.drawImage(SPR.wing,-2,-18,40,40); ctx.restore();
      ctx.save(); ctx.rotate(-flap); ctx.drawImage(SPR.wing,2,-18,40,40); ctx.restore();
      ctx.restore();
    }
    ctx.drawImage(sp, sx, sy, 32, 32);
    // 穿戴护甲：腿→身→头
    if(this.equip.legs && SPR['worn_'+this.equip.legs]) ctx.drawImage(SPR['worn_'+this.equip.legs], sx, sy, 32, 32);
    if(this.equip.body && SPR['worn_'+this.equip.body]) ctx.drawImage(SPR['worn_'+this.equip.body], sx, sy, 32, 32);
    if(this.equip.head && SPR['worn_'+this.equip.head]) ctx.drawImage(SPR['worn_'+this.equip.head], sx, sy, 32, 32);
    ctx.globalAlpha=1;
    const held=this._heldItem||this.hotbar[this.cur], def=held&&ITEM[held], weapon=held&&SPR[held];
    if(def&&weapon&&['sword','bow','magic','minionStaff'].includes(def.kind)){
      const active=this.swing>0||this.weaponCooldown>0||(this._usePose||0)>0;
      if(active){
        let ang=this.facing?0:Math.PI;
        if(def.useStyle==='swing'){
          const t=Math.max(0,Math.min(1,1-this.swing));
          ang=(this.facing?-1.15:Math.PI+1.15)+(this.facing?1:-1)*t*1.75;
        } else {
          ang=Math.atan2((window.game&&window.game.mouse?window.game.mouse.wy:cy)-cy,(window.game&&window.game.mouse?window.game.mouse.wx:cx)-cx);
        }
        ctx.save();ctx.translate(Math.round(cx-cam.x),Math.round(cy-cam.y));ctx.rotate(ang);
        if(!this.facing&&def.useStyle==='swing')ctx.scale(1,-1);
        const recoil=def.useStyle==='gun'&&active?3:0;
        ctx.drawImage(weapon,4-recoil,-8,20,20);
        if(def.kind==='magic'||def.kind==='minionStaff'){
          ctx.globalAlpha=.6+Math.sin(Date.now()/80)*.2;ctx.fillStyle=def.damageClass==='summon'?'#ffd060':'#b080ff';ctx.beginPath();ctx.arc(22,0,3,0,Math.PI*2);ctx.fill();
        }
        ctx.restore();ctx.globalAlpha=1;
      }
    }
    if(this._usePose>0) this._usePose--;
  };

  window.Player=Player;
})();
