/* ===== 克苏鲁之眼 Boss =====
 * 两阶段：阶段1 闲游+冲锋+召唤仆从；阶段2 凶瞳+频繁冲锋
 * 死亡掉落：魔矿、暗影鳞片、金币、克苏鲁之盾(40%)
 */
(function(){
  const TS=16, SPR=window.ASSETS.sprites;
  const DATA=window.DATA;

  function EoC(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=40; this.h=40;
    this.vx=0; this.vy=0;
    this.hp=2800; this.maxHp=2800;
    this.phase=1;
    this.timer=180;
    this.state='idle';   // idle/charge/spawn
    this.facing=true;
    this.hurt=0;
    this.alive=true;
    this.servants=0;
  }

  EoC.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0) this.hurt--;
    // 阶段切换
    if(this.phase===1 && this.hp<=1400){ this.phase=2; this.state='idle'; this.timer=60; if(window.AUDIO) AUDIO.play('night'); }

    this.timer--;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const px=player.x+player.w/2, py=player.y+player.h/2;
    const dx=px-cx, dy=py-cy;
    const dist=Math.hypot(dx,dy)||1;

    if(this.timer<=0){
      if(this.phase===1){
        // 阶段1：70% 冲锋，30% 召唤仆从
        if(Math.random()<0.3 && this.servants<4){
          this.state='spawn';
          this.spawnServant(player);
          this.timer=80;
        } else {
          this.state='charge';
          this._cdir={x:dx/dist, y:dy/dist};
          this._chargeT=40;
          this.timer=80;
        }
      } else {
        // 阶段2：连续冲锋
        this.state='charge';
        this._cdir={x:dx/dist, y:dy/dist};
        this._chargeT=28;
        this.timer=45;
      }
    }

    if(this.state==='charge' && this._chargeT>0){
      const sp=this.phase===2?6:4;
      this.vx=this._cdir.x*sp;
      this.vy=this._cdir.y*sp;
      this._chargeT--;
      if(this._chargeT<=0){ this.state='idle'; this.vx*=0.3; this.vy*=0.3; }
    } else {
      // 闲游：跟随玩家但保持距离
      const target=200;
      const ratio=(dist-target)/Math.max(1,dist);
      this.vx += (dx/dist)*ratio*0.3;
      this.vy += (dy/dist)*ratio*0.3;
      this.vx*=0.95; this.vy*=0.95;
    }
    this.facing = dx>0;
    this.x += this.vx;
    this.y += this.vy;
    // 软限制：飞离玩家太远会被拉回
    if(Math.abs(this.x-player.x)>600) this.x -= Math.sign(this.x-player.x)*4;
    if(Math.abs(this.y-player.y)>400) this.y -= Math.sign(this.y-player.y)*4;

    // 接触玩家造成伤害
    if(this.x<player.x+player.w && this.x+this.w>player.x && this.y<player.y+player.h && this.y+this.h>player.y){
      player.tryHurt(this.phase===2?20:12);
    }
  };

  EoC.prototype.spawnServant=function(player){
    if(window.game) window.game.monsters.push(new DemonEye(this.world, this.x, this.y));
    this.servants++;
  };

  EoC.prototype.hurtMe=function(dmg){
    this.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(this.hp<=0){
      this.alive=false;
      if(window.AUDIO) AUDIO.play('enemy_die');
      this.dropLoot();
    }
  };

  EoC.prototype.dropLoot=function(){
    if(!window.game) return;
    const g=window.game, p=g.player;
    const drops=DATA.DROPS.eoc;
    for(const [item,min,max,ch] of drops){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n<=0) continue;
        // 金币走 coins，其他走 inv
        if(item==='i_gold_coin' || item==='i_silver_coin' || item==='i_copper_coin') p.give(item,n);
        else p.give(item,n);
      }
    }
    p.bossDown.eoc=true;
  };

  EoC.prototype.getName=function(){ return '克苏鲁之眼'; };
  EoC.prototype.draw=function(ctx,cam){
    const sp=this.phase===2?SPR.eoc_phase2:SPR.eoc_phase1;
    const sx=Math.round(this.x+this.w/2-cam.x-24);
    const sy=Math.round(this.y+this.h/2-cam.y-24);
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
    ctx.drawImage(sp,sx,sy,48,48);
    ctx.globalAlpha=1;
    // Boss 血条（屏幕顶部）
  };

  // 仆从：飞行小眼
  function DemonEye(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=24; this.h=18;
    this.vx=0; this.vy=0;
    this.hp=12; this.hurt=0;
    this.alive=true;
    this.timer=0;
    this.type='demon_eye';
  }
  DemonEye.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0) this.hurt--;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const px=player.x+player.w/2, py=player.y+player.h/2;
    const dx=px-cx, dy=py-cy, d=Math.hypot(dx,dy)||1;
    // 慢速向玩家
    this.vx += (dx/d)*0.08; this.vy += (dy/d)*0.08;
    this.vx*=0.94; this.vy*=0.94;
    this.x += this.vx; this.y += this.vy;
    if(this.x<player.x+player.w && this.x+this.w>player.x && this.y<player.y+player.h && this.y+this.h>player.y){
      player.tryHurt(8);
    }
    if(this.hp<=0) this.alive=false;
  };
  DemonEye.prototype.hurtMe=function(dmg){
    this.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(this.hp<=0){ this.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); }
  };
  DemonEye.prototype.draw=function(ctx,cam){
    const sp=SPR.demon_eye;
    const sx=Math.round(this.x+this.w/2-cam.x-16);
    const sy=Math.round(this.y+this.h/2-cam.y-12);
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
    ctx.drawImage(sp,sx,sy,32,24);
    ctx.globalAlpha=1;
  };
  DemonEye.prototype.aabb=function(p){
    return this.x<p.x+p.w && this.x+this.w>p.x && this.y<p.y+p.h && this.y+this.h>p.y;
  };

  window.EoC=EoC;
  window.DemonEye=DemonEye;

  // ===== 世界吞噬者（Eater of Worlds）=====
  // 分段蠕虫 Boss：头部+多身体段。蛇形追踪玩家，每段独立生命，
  // 段被打断会从身体断裂（简化：段 HP 归零即消失并掉落），全部段消失即击杀。
  function EoW(world,x,y){
    this.world=world;
    this.x=x; this.y=y;
    const total=14;
    this.segments=[];
    this.totalHp=0; this.maxHp=0;
    for(let i=0;i<total;i++){
      const isHead=i===0, isTail=i===total-1;
      const w2=isHead?36:isTail?28:26;
      const h2=isHead?24:22;
      const hp=isHead?90: isTail?35:55;
      // 生成为一条横向的蛇
      this.segments.push({
        x:x - i*22, y:y + (i%2===0?0:10),
        w:w2, h:h2, hp, maxHp:hp,
        vx:0, vy:0, life:110,
        isHead, isTail,
        rails:[] // 蛇形轨迹点，用于身体跟随
      });
      this.totalHp+=hp; this.maxHp+=hp;
    }
    this.alive=true; this.hurt=0; this.facing=true; this.segAnim=0;
    const self=this;
    Object.defineProperty(this,'hp',{ get(){ return self.segCount()>0? self.totalHp : 0; } });
    Object.defineProperty(this,'maxHp',{ get(){ return self.maxTotalHp; } });
    this.maxTotalHp=this.totalHp; this.totalHp=this.hpLeft();
  }
  EoW.prototype.segCount=function(){ return this.segments.length; };
  EoW.prototype.getSegments=function(){ return this.segments; };
  EoW.prototype.getName=function(){ return '世界吞噬者'; };
  EoW.prototype.hpLeft=function(){ let s=0; for(const g of this.segments) s+=g.hp; return s; };

  EoW.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0) this.hurt--;
    this.segAnim++;
    const head=this.segments[0];
    if(!head) { this.alive=false; return; }
    const px=player.x+player.w/2, py=player.y+player.h/2;
    const hx=head.x+head.w/2, hy=head.y+head.h/2;
    const dx=px-hx, dy=py-hy, dist=Math.hypot(dx,dy)||1;
    this.facing = dx>0;
    // 头部朝玩家加速
    head.vx += (dx/dist)*0.22;
    head.vy += (dy/dist)*0.22;
    head.vx = Math.max(-4,Math.min(4,head.vx));
    head.vy = Math.max(-4,Math.min(4,head.vy));
    // 蛇形摆动
    head.vy += Math.sin((this.segAnim+0)*0.1)*0.12;
    // 头部与玩家保持一点距离避免贴脸
    const keep=40;
    if(dist<keep){ const pull=(keep-dist)/keep; head.vx-= (dx/dist)*pull*0.5; head.vy-= (dy/dist)*pull*0.5; }
    head.x += head.vx; head.y += head.vy;
    // 记录头轨迹
    head.rails.push({x:head.x+head.w/2, y:head.y+head.h/2});

    // 身体段跟随（蛇形：每段追踪前一段的位置）
    for(let i=1;i<this.segments.length;i++){
      const seg=this.segments[i], prev=this.segments[i-1];
      const tx=prev.x+prev.w/2 - seg.w/2;
      const ty=prev.y+prev.h/2 - seg.h/2;
      const gx=tx-seg.x, gy=ty-seg.y, gd=Math.hypot(gx,gy)||1;
      // 软跟随
      const sp=Math.min(1, gd/40);
      seg.x += gx*sp*0.16;
      seg.y += gy*sp*0.16;
      // 轻微横向摆动
      seg.x += Math.sin((this.segAnim+i)*0.15)*0.2;
    }
    // 轨迹点太多则删
    if(this.segments[0].rails.length>60) this.segments[0].rails.shift();

    // 每段碰撞玩家伤害
    for(const seg of this.segments){
      if(seg.x<player.x+player.w && seg.x+seg.w>player.x && seg.y<player.y+player.h && seg.y+seg.h>player.y){
        player.tryHurt(this.segCount()>6?10:12);
      }
    }
  };

  EoW.prototype.hurtMe=function(dmg){
    // 普通伤害打到头部
    this.hitSegment(0, dmg);
  };
  // 打到指定段
  EoW.prototype.hitSegment=function(idx, dmg){
    const seg=this.segments[idx];
    if(!seg) return;
    seg.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(seg.hp<=0) this.breakSegment(idx);
  };
  // 该段死亡（断裂）：提供判定是否整条死亡
  EoW.prototype.breakSegment=function(idx){
    const seg=this.segments[idx];
    if(window.AUDIO) AUDIO.play('enemy_die');
    // 掉落魔矿/暗影鳞片
    if(window.game){
      const cx2=seg.x+seg.w/2, cy2=seg.y+seg.h/2;
      window.game.spawnDrop(cx2, cy2, 'i_demonite_ore', 2+Math.floor(Math.random()*3));
      if(Math.random()<0.5) window.game.spawnDrop(cx2, cy2, 'i_demonite_scale', 1+Math.floor(Math.random()*2));
    }
    // 移除该段（若头部死亡，新头部是其下一段）
    this.segments.splice(idx,1);
    this.totalHp = this.hpLeft();
    if(this.segments.length<=0){ this.alive=false; this.dropLoot(); }
  };

  EoW.prototype.dropLoot=function(){
    if(window.game && window.game.player){
      window.game.player.bossDown.eow=true;
    }
  };

  EoW.prototype.draw=function(ctx,cam){
    // 先画尾部再画头（身体在上）
    const segs=[...this.segments].reverse();
    for(const seg of segs){
      const sx=Math.round(seg.x+seg.w/2-cam.x - (seg.isHead?18:13));
      const sy=Math.round(seg.y+seg.h/2-cam.y - (seg.isHead?12:11));
      if(seg.isHead){
        // 头部：带嘴的头
        const sp=SPR.eow_head;
        if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
        ctx.drawImage(sp,sx,sy,36,24);
        ctx.globalAlpha=1;
      } else {
        const sp=seg.isTail?SPR.eow_tail:SPR.eow_body;
        if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
        ctx.drawImage(sp,sx,sy, seg.isTail?28:26,22);
        ctx.globalAlpha=1;
      }
    }
  };

  window.EoW=EoW;

  // ===== 蜂后（Queen Bee）=====
  // 冲锋 + 悬停吐毒刺弹幕 + 召唤小蜜蜂
  function QueenBee(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=44; this.h=32;
    this.vx=0; this.vy=0;
    this.hp=3400; this.maxHp=3400;
    this.timer=90;
    this.state='hover'; // hover/charge/sting/spawn
    this.facing=true;
    this.hurt=0;
    this.alive=true;
    this._chargeT=0;
    this._cdir={x:0,y:0};
    this.bees=0;
  }
  QueenBee.prototype.getName=function(){ return '蜂后'; };
  QueenBee.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0) this.hurt--;
    this.timer--;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const px=player.x+player.w/2, py=player.y+player.h/2;
    const dx=px-cx, dy=py-cy, dist=Math.hypot(dx,dy)||1;
    this.facing=dx>0;
    if(this.timer<=0){
      const r=Math.random();
      if(r<0.35 && this.bees<5){
        this.state='spawn'; this.timer=50;
        if(window.game) window.game.monsters.push(new Bee(this.world,this.x,this.y));
        this.bees++;
      } else if(r<0.7){
        this.state='charge';
        this._cdir={x:dx/dist,y:dy/dist};
        this._chargeT=36;
        this.timer=70;
      } else {
        this.state='sting'; this.timer=55;
        // 发射 3 枚毒刺粒子弹（简化为朝玩家瞬时伤害区 + 粒子）
        if(window.game){
          for(let i=0;i<3;i++){
            const ang=Math.atan2(dy,dx)+(i-1)*0.18;
            window.game.stingers=window.game.stingers||[];
            window.game.stingers.push({
              x:cx, y:cy, vx:Math.cos(ang)*7, vy:Math.sin(ang)*7,
              life:50, dmg:8
            });
          }
        }
      }
    }
    if(this.state==='charge' && this._chargeT>0){
      this.vx=this._cdir.x*5.2; this.vy=this._cdir.y*5.2;
      this._chargeT--;
      if(this._chargeT<=0){ this.state='hover'; this.vx*=0.2; this.vy*=0.2; }
    } else {
      // 悬停：保持在玩家上方
      const tx=px, ty=py-90;
      this.vx+=(tx-cx)*0.01; this.vy+=(ty-cy)*0.01;
      this.vx*=0.92; this.vy*=0.92;
    }
    this.x+=this.vx; this.y+=this.vy;
    if(Math.abs(this.x-player.x)>700) this.x-=Math.sign(this.x-player.x)*5;
    if(Math.abs(this.y-player.y)>450) this.y-=Math.sign(this.y-player.y)*5;
    if(this.x<player.x+player.w && this.x+this.w>player.x && this.y<player.y+player.h && this.y+this.h>player.y){
      player.tryHurt(14);
    }
  };
  QueenBee.prototype.hurtMe=function(dmg){
    this.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(this.hp<=0){
      this.alive=false;
      if(window.AUDIO) AUDIO.play('enemy_die');
      this.dropLoot();
    }
  };
  QueenBee.prototype.dropLoot=function(){
    if(!window.game) return;
    const p=window.game.player, drops=DATA.DROPS.queenbee||[];
    for(const [item,min,max,ch] of drops){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n>0) window.game.spawnDrop(this.x+this.w/2,this.y+this.h/2,item,n);
      }
    }
    p.bossDown.queenbee=true;
  };
  QueenBee.prototype.draw=function(ctx,cam){
    const sp=SPR.queen_bee;
    const sx=Math.round(this.x+this.w/2-cam.x-24);
    const sy=Math.round(this.y+this.h/2-cam.y-20);
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
    if(!this.facing){ ctx.save(); ctx.translate(sx+48,sy); ctx.scale(-1,1); ctx.drawImage(sp,0,0,48,40); ctx.restore(); }
    else ctx.drawImage(sp,sx,sy,48,40);
    ctx.globalAlpha=1;
  };

  // 小蜜蜂仆从 / 黄蜂
  function Bee(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=16; this.h=12;
    this.vx=0; this.vy=0;
    this.hp=18; this.hurt=0;
    this.alive=true;
    this.type='hornet';
  }
  Bee.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0) this.hurt--;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const px=player.x+player.w/2, py=player.y+player.h/2;
    const dx=px-cx, dy=py-cy, d=Math.hypot(dx,dy)||1;
    this.vx+=(dx/d)*0.12; this.vy+=(dy/d)*0.12;
    this.vx*=0.93; this.vy*=0.93;
    this.x+=this.vx; this.y+=this.vy;
    if(this.x<player.x+player.w && this.x+this.w>player.x && this.y<player.y+player.h && this.y+this.h>player.y){
      player.tryHurt(6);
    }
    if(this.hp<=0) this.alive=false;
  };
  Bee.prototype.hurtMe=function(dmg){
    this.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(this.hp<=0){ this.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); }
  };
  Bee.prototype.draw=function(ctx,cam){
    const sp=SPR.bee;
    const sx=Math.round(this.x+this.w/2-cam.x-10);
    const sy=Math.round(this.y+this.h/2-cam.y-8);
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
    ctx.drawImage(sp,sx,sy,20,16);
    ctx.globalAlpha=1;
  };
  Bee.prototype.aabb=function(p){
    return this.x<p.x+p.w && this.x+this.w>p.x && this.y<p.y+p.h && this.y+this.h>p.y;
  };

  // ===== 骷髅王（Skeletron）=====
  // 头部 + 双臂；先打手臂，手臂死后头部加速
  function Skeletron(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=36; this.h=36;
    this.vx=0; this.vy=0;
    this.hp=4400; this.maxHp=4400;
    this.hurt=0; this.alive=true;
    this.timer=60; this.state='idle';
    this.arms=[
      {side:-1, x:x-40, y:y, w:28, h:12, hp:800, maxHp:800, alive:true, ang:0},
      {side:1,  x:x+40, y:y, w:28, h:12, hp:800, maxHp:800, alive:true, ang:0}
    ];
    this.spin=0;
  }
  Skeletron.prototype.getName=function(){ return '骷髅王'; };
  Skeletron.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0) this.hurt--;
    this.timer--; this.spin+=0.08;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const px=player.x+player.w/2, py=player.y+player.h/2;
    const dx=px-cx, dy=py-cy, dist=Math.hypot(dx,dy)||1;
    const armsAlive=this.arms.filter(a=>a.alive).length;
    const sp=armsAlive>0?2.2:4.0;
    // 头部环绕/追击
    if(this.timer<=0){
      this.state=Math.random()<0.5?'charge':'orbit';
      this.timer=this.state==='charge'?40:80;
      if(this.state==='charge') this._cdir={x:dx/dist,y:dy/dist};
    }
    if(this.state==='charge' && this.timer>40){ /* noop */ }
    if(this.state==='charge'){
      this.vx=this._cdir.x*sp*1.6; this.vy=this._cdir.y*sp*1.6;
    } else {
      this.vx+=(dx/dist)*0.15; this.vy+=(dy/dist)*0.12;
      this.vx*=0.94; this.vy*=0.94;
    }
    this.x+=this.vx; this.y+=this.vy;
    // 手臂绕头旋转并挥扫
    for(const arm of this.arms){
      if(!arm.alive) continue;
      arm.ang+=armsAlive===1?0.12:0.07;
      const r=55;
      arm.x=cx + Math.cos(arm.ang*arm.side)*r - arm.w/2;
      arm.y=cy + Math.sin(arm.ang)*r*0.6 - arm.h/2;
      // 手臂砸玩家
      if(arm.x<player.x+player.w && arm.x+arm.w>player.x && arm.y<player.y+player.h && arm.y+arm.h>player.y){
        player.tryHurt(12);
      }
    }
    if(this.x<player.x+player.w && this.x+this.w>player.x && this.y<player.y+player.h && this.y+this.h>player.y){
      player.tryHurt(armsAlive>0?10:16);
    }
  };
  Skeletron.prototype.hurtMe=function(dmg){
    // 优先打活着的手臂
    for(const arm of this.arms){
      if(!arm.alive) continue;
      // 若调用者走通用 hurtMe（打头），仍允许伤害头
      break;
    }
    this.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(this.hp<=0){
      this.alive=false;
      if(window.AUDIO) AUDIO.play('enemy_die');
      this.dropLoot();
    }
  };
  Skeletron.prototype.hurtAt=function(x,y,dmg){
    // 优先命中手臂
    for(const arm of this.arms){
      if(!arm.alive) continue;
      if(x>arm.x-4 && x<arm.x+arm.w+4 && y>arm.y-4 && y<arm.y+arm.h+4){
        arm.hp-=dmg; this.hurt=6;
        if(window.AUDIO) AUDIO.play('enemy_hurt');
        if(arm.hp<=0){
          arm.alive=false;
          if(window.AUDIO) AUDIO.play('enemy_die');
          if(window.game) window.game.spawnDrop(arm.x,arm.y,'i_bone',3+Math.floor(Math.random()*4));
        }
        return true;
      }
    }
    if(x>this.x-4 && x<this.x+this.w+4 && y>this.y-4 && y<this.y+this.h+4){
      this.hurtMe(dmg); return true;
    }
    return false;
  };
  Skeletron.prototype.dropLoot=function(){
    if(!window.game) return;
    const p=window.game.player, drops=DATA.DROPS.skeletron||[];
    for(const [item,min,max,ch] of drops){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n>0) window.game.spawnDrop(this.x+this.w/2,this.y+this.h/2,item,n);
      }
    }
    p.bossDown.skeletron=true;
    // 解锁地牢
    if(window.game.world && window.game.world.dungeon) window.game.world.dungeon.locked=false;
  };
  Skeletron.prototype.draw=function(ctx,cam){
    // 手臂
    for(const arm of this.arms){
      if(!arm.alive) continue;
      const sx=Math.round(arm.x-cam.x), sy=Math.round(arm.y-cam.y);
      if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
      ctx.drawImage(SPR.skeletron_arm,sx,sy,28,12);
      ctx.globalAlpha=1;
    }
    const sx=Math.round(this.x+this.w/2-cam.x-20);
    const sy=Math.round(this.y+this.h/2-cam.y-20);
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
    ctx.drawImage(SPR.skeletron_head,sx,sy,40,40);
    ctx.globalAlpha=1;
  };

  window.QueenBee=QueenBee;
  window.Bee=Bee;
  window.Skeletron=Skeletron;

  // ===== 血肉墙（Wall of Flesh）=====
  // 横向推进的巨型墙体；碰撞箱为口器，墙体全高绘制
  function WallOfFlesh(world,x,y,dir){
    this.world=world;
    this.dir=dir||1;
    this.x=x;
    this.mouthY=y;
    this.y=y; // 与口器同步，供通用 AABB
    this.w=56; this.h=64;
    this.vx=this.dir*1.15;
    this.hp=8000; this.maxHp=8000;
    this.hurt=0; this.alive=true;
    this.timer=0;
    this.segH=64;
  }
  WallOfFlesh.prototype.getName=function(){ return '血肉墙'; };
  WallOfFlesh.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0) this.hurt--;
    this.timer++;
    this.x+=this.vx;
    const target=player.y+player.h/2-this.h/2;
    this.mouthY+=(target-this.mouthY)*0.04;
    this.y=this.mouthY;
    const ratio=Math.max(0,this.hp/this.maxHp);
    this.vx=this.dir*(1.15+(1-ratio)*2.4);
    if(this.timer%90===0 && window.game){
      const mx=this.x+this.w/2, my=this.y+this.h/2;
      const px=player.x+player.w/2, py=player.y+player.h/2;
      const dx=px-mx, dy=py-my, d=Math.hypot(dx,dy)||1;
      window.game.stingers=window.game.stingers||[];
      window.game.stingers.push({x:mx,y:my,vx:(dx/d)*6.5,vy:(dy/d)*6.5,life:80,dmg:16,c:'#f44'});
    }
    if(player.x<this.x+this.w && player.x+player.w>this.x &&
       player.y<this.y+this.h && player.y+player.h>this.y){
      player.tryHurt(18);
    }
    if(this.dir>0 && player.x<this.x-8){ player.x=this.x-8; player.tryHurt(6); }
    if(this.dir<0 && player.x+player.w>this.x+this.w+8){ player.x=this.x+this.w+8-player.w; player.tryHurt(6); }
    if(Math.abs(this.x-player.x)>900) this.x=player.x-this.dir*220;
  };
  WallOfFlesh.prototype.hurtMe=function(dmg){
    this.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(this.hp<=0){
      this.alive=false;
      if(window.AUDIO) AUDIO.play('enemy_die');
      this.dropLoot();
    }
  };
  WallOfFlesh.prototype.dropLoot=function(){
    if(!window.game) return;
    const g=window.game, p=g.player;
    const drops=DATA.DROPS.wof||[];
    const emblems=drops.filter(d=>d[0].indexOf('emblem')!==-1);
    const others=drops.filter(d=>d[0].indexOf('emblem')===-1);
    for(const [item,min,max,ch] of others){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n>0) g.spawnDrop(this.x+20, this.y+30, item, n);
      }
    }
    if(emblems.length){
      const e=emblems[Math.floor(Math.random()*emblems.length)];
      g.spawnDrop(this.x+20, this.y+20, e[0], 1);
    }
    p.bossDown.wof=true;
    if(g.world && g.world.enableHardmode){
      g.world.enableHardmode();
      g.hardmode=true;
      g._msg='世界震动……困难模式开启！'; g._msgT=g.t||0;
    }
  };
  WallOfFlesh.prototype.draw=function(ctx,cam){
    const startY=Math.floor(cam.y/this.segH)*this.segH-this.segH;
    const endY=cam.y+ctx.canvas.height+this.segH;
    for(let y=startY;y<endY;y+=this.segH){
      const sx=Math.round(this.x-cam.x);
      const sy=Math.round(y-cam.y);
      if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.55;
      if(this.dir<0){
        ctx.save(); ctx.translate(sx+32,sy); ctx.scale(-1,1);
        ctx.drawImage(SPR.wof_wall,0,0,32,64);
        ctx.restore();
      } else ctx.drawImage(SPR.wof_wall,sx,sy,32,64);
      ctx.globalAlpha=1;
    }
    const mx=Math.round(this.x-cam.x-4);
    const my=Math.round(this.y-cam.y);
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.55;
    if(this.dir<0){
      ctx.save(); ctx.translate(mx+64,my); ctx.scale(-1,1);
      ctx.drawImage(SPR.wof_mouth,0,0,64,64);
      ctx.restore();
    } else ctx.drawImage(SPR.wof_mouth,mx,my,64,64);
    ctx.globalAlpha=1;
  };

  window.WallOfFlesh=WallOfFlesh;

  // ===== 毁灭者（机械蠕虫）=====
  function Destroyer(world,x,y){
    this.world=world;
    this.x=x; this.y=y;
    const total=18;
    this.segments=[];
    this.totalHp=0;
    for(let i=0;i<total;i++){
      const isHead=i===0, isTail=i===total-1;
      const hp=isHead?200:isTail?80:120;
      this.segments.push({
        x:x-i*20, y:y+(i%2?6:0),
        w:isHead?34:24, h:isHead?22:20,
        hp, maxHp:hp, isHead, isTail, vx:0, vy:0
      });
      this.totalHp+=hp;
    }
    this.maxTotalHp=this.totalHp;
    this.alive=true; this.hurt=0; this.timer=0; this.segAnim=0;
    const self=this;
    Object.defineProperty(this,'hp',{get(){return self.segCount()>0?self.hpLeft():0;}});
    Object.defineProperty(this,'maxHp',{get(){return self.maxTotalHp;}});
  }
  Destroyer.prototype.getName=function(){return '毁灭者';};
  Destroyer.prototype.segCount=function(){return this.segments.length;};
  Destroyer.prototype.getSegments=function(){return this.segments;};
  Destroyer.prototype.hpLeft=function(){let s=0;for(const g of this.segments)s+=g.hp;return s;};
  Destroyer.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0)this.hurt--;
    this.timer++; this.segAnim++;
    const head=this.segments[0]; if(!head){this.alive=false;return;}
    const px=player.x+player.w/2, py=player.y+player.h/2;
    const hx=head.x+head.w/2, hy=head.y+head.h/2;
    const dx=px-hx, dy=py-hy, dist=Math.hypot(dx,dy)||1;
    head.vx+=(dx/dist)*0.28; head.vy+=(dy/dist)*0.28;
    head.vx=Math.max(-5,Math.min(5,head.vx));
    head.vy=Math.max(-5,Math.min(5,head.vy));
    head.x+=head.vx; head.y+=head.vy;
    for(let i=1;i<this.segments.length;i++){
      const seg=this.segments[i], prev=this.segments[i-1];
      const gx=(prev.x+prev.w/2-seg.w/2)-seg.x, gy=(prev.y+prev.h/2-seg.h/2)-seg.y;
      const gd=Math.hypot(gx,gy)||1;
      seg.x+=gx*Math.min(1,gd/36)*0.2;
      seg.y+=gy*Math.min(1,gd/36)*0.2;
    }
    // 激光
    if(this.timer%70===0 && window.game){
      const i=1+Math.floor(Math.random()*(this.segments.length-1));
      const s=this.segments[i];
      const mx=s.x+s.w/2, my=s.y+s.h/2;
      const ddx=px-mx, ddy=py-my, dd=Math.hypot(ddx,ddy)||1;
      window.game.stingers=window.game.stingers||[];
      window.game.stingers.push({x:mx,y:my,vx:(ddx/dd)*7,vy:(ddy/dd)*7,life:60,dmg:14,c:'#f66'});
    }
    for(const seg of this.segments){
      if(seg.x<player.x+player.w&&seg.x+seg.w>player.x&&seg.y<player.y+player.h&&seg.y+seg.h>player.y)
        player.tryHurt(14);
    }
  };
  Destroyer.prototype.hurtMe=function(dmg){this.hitSegment(0,dmg);};
  Destroyer.prototype.hitSegment=function(idx,dmg){
    const seg=this.segments[idx]; if(!seg) return;
    seg.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(seg.hp<=0) this.breakSegment(idx);
  };
  Destroyer.prototype.breakSegment=function(idx){
    const seg=this.segments.splice(idx,1)[0];
    if(window.game) window.game.spawnDrop(seg.x,seg.y,'i_soul_might',1+Math.floor(Math.random()*2));
    if(window.AUDIO) AUDIO.play('enemy_die');
    this.totalHp=this.hpLeft();
    if(this.segments.length<=0){ this.alive=false; this.dropLoot(); }
  };
  Destroyer.prototype.dropLoot=function(){
    if(!window.game) return;
    const p=window.game.player, drops=DATA.DROPS.destroyer||[];
    for(const [item,min,max,ch] of drops){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n>0) window.game.spawnDrop(this.x,this.y,item,n);
      }
    }
    p.bossDown.destroyer=true;
  };
  Destroyer.prototype.draw=function(ctx,cam){
    const segs=[...this.segments].reverse();
    for(const seg of segs){
      const sx=Math.round(seg.x-cam.x), sy=Math.round(seg.y-cam.y);
      if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
      if(seg.isHead){
        ctx.fillStyle='rgb(140,140,160)'; ctx.fillRect(sx,sy,seg.w,seg.h);
        ctx.fillStyle='#f44'; ctx.fillRect(sx+seg.w-8,sy+4,6,seg.h-8);
        ctx.fillStyle='#fff'; ctx.fillRect(sx+4,sy+4,4,4);
      } else {
        ctx.fillStyle=seg.isTail?'rgb(100,100,120)':'rgb(120,120,140)';
        ctx.fillRect(sx,sy,seg.w,seg.h);
        ctx.fillStyle='rgb(200,60,60)'; ctx.fillRect(sx+seg.w/2-1,sy+2,2,seg.h-4);
      }
      ctx.globalAlpha=1;
    }
  };

  // ===== 双子魔眼 =====
  function Twins(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=36; this.h=36;
    this.retinazer={x:x-40,y:y,w:32,h:32,vx:0,vy:0,hp:2000,maxHp:2000,alive:true,phase:1};
    this.spazmatism={x:x+40,y:y,w:32,h:32,vx:0,vy:0,hp:2000,maxHp:2000,alive:true,phase:1};
    this.hp=4000; this.maxHp=4000;
    this.hurt=0; this.alive=true; this.timer=0;
  }
  Twins.prototype.getName=function(){return '双子魔眼';};
  Twins.prototype._syncHp=function(){
    this.hp=(this.retinazer.alive?this.retinazer.hp:0)+(this.spazmatism.alive?this.spazmatism.hp:0);
  };
  Twins.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0) this.hurt--;
    this.timer++;
    const px=player.x+player.w/2, py=player.y+player.h/2;
    const eyes=[this.retinazer,this.spazmatism];
    for(let i=0;i<eyes.length;i++){
      const e=eyes[i]; if(!e.alive) continue;
      if(e.hp<=e.maxHp*0.5) e.phase=2;
      const cx=e.x+e.w/2, cy=e.y+e.h/2;
      const dx=px-cx, dy=py-cy, d=Math.hypot(dx,dy)||1;
      if(e.phase===1){
        // 绕飞 + 间歇冲锋
        const ang=this.timer*0.04+i*Math.PI;
        const tx=px+Math.cos(ang)*120, ty=py+Math.sin(ang)*80-40;
        e.vx+=(tx-cx)*0.02; e.vy+=(ty-cy)*0.02;
        e.vx*=0.92; e.vy*=0.92;
        if(this.timer%100===i*40 && window.game){
          window.game.stingers=window.game.stingers||[];
          window.game.stingers.push({x:cx,y:cy,vx:(dx/d)*6,vy:(dy/d)*6,life:55,dmg:12,c:i? '#8f8':'#f66'});
        }
      } else {
        // 二阶段狂暴冲锋
        e.vx+=(dx/d)*0.35; e.vy+=(dy/d)*0.35;
        e.vx*=0.9; e.vy*=0.9;
      }
      e.x+=e.vx; e.y+=e.vy;
      if(e.x<player.x+player.w&&e.x+e.w>player.x&&e.y<player.y+player.h&&e.y+e.h>player.y)
        player.tryHurt(e.phase===2?16:11);
    }
    this.x=this.retinazer.alive?this.retinazer.x:(this.spazmatism.x);
    this.y=this.retinazer.alive?this.retinazer.y:(this.spazmatism.y);
    this._syncHp();
    if(!this.retinazer.alive && !this.spazmatism.alive){
      this.alive=false; this.dropLoot();
    }
  };
  Twins.prototype.hurtMe=function(dmg){
    // 打最近的一只
    const eyes=[this.retinazer,this.spazmatism].filter(e=>e.alive);
    if(!eyes.length) return;
    eyes.sort((a,b)=>a.hp-b.hp);
    const e=eyes[0];
    e.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(e.hp<=0){ e.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); }
    this._syncHp();
    if(!this.retinazer.alive && !this.spazmatism.alive){ this.alive=false; this.dropLoot(); }
  };
  Twins.prototype.hurtAt=function(x,y,dmg){
    for(const e of [this.retinazer,this.spazmatism]){
      if(!e.alive) continue;
      if(x>e.x-4&&x<e.x+e.w+4&&y>e.y-4&&y<e.y+e.h+4){
        e.hp-=dmg; this.hurt=8;
        if(window.AUDIO) AUDIO.play('enemy_hurt');
        if(e.hp<=0){ e.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); }
        this._syncHp();
        if(!this.retinazer.alive && !this.spazmatism.alive){ this.alive=false; this.dropLoot(); }
        return true;
      }
    }
    return false;
  };
  Twins.prototype.dropLoot=function(){
    if(!window.game) return;
    const p=window.game.player, drops=DATA.DROPS.twins||[];
    for(const [item,min,max,ch] of drops){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n>0) window.game.spawnDrop(this.x,this.y,item,n);
      }
    }
    p.bossDown.twins=true;
  };
  Twins.prototype.draw=function(ctx,cam){
    for(const e of [this.retinazer,this.spazmatism]){
      if(!e.alive) continue;
      const sx=Math.round(e.x-cam.x), sy=Math.round(e.y-cam.y);
      if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
      // 复用克苏鲁之眼小图或画圆
      const sp=e.phase===2?SPR.eoc_phase2:SPR.eoc_phase1;
      if(sp) ctx.drawImage(sp,sx-8,sy-8,48,48);
      else { ctx.fillStyle='#eee'; ctx.beginPath(); ctx.arc(sx+16,sy+16,14,0,Math.PI*2); ctx.fill(); }
      ctx.globalAlpha=1;
    }
  };

  // ===== 骷髅统帅 =====
  function SkeletronPrime(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=40; this.h=40;
    this.vx=0; this.vy=0;
    this.hp=6000; this.maxHp=6000;
    this.hurt=0; this.alive=true; this.timer=0; this.spin=0;
    // 四臂：锯/激光/炮/钳 简化为4个可打部件
    this.arms=[];
    for(let i=0;i<4;i++){
      this.arms.push({
        i, x:x, y:y, w:24, h:12, hp:1000, maxHp:1000, alive:true, ang:i*Math.PI/2
      });
    }
  }
  SkeletronPrime.prototype.getName=function(){return '骷髅统帅';};
  SkeletronPrime.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0)this.hurt--;
    this.timer++; this.spin+=0.1;
    const px=player.x+player.w/2, py=player.y+player.h/2;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const dx=px-cx, dy=py-cy, d=Math.hypot(dx,dy)||1;
    const armsAlive=this.arms.filter(a=>a.alive).length;
    const sp=armsAlive>0?2.4:4.2;
    this.vx+=(dx/d)*0.18; this.vy+=(dy/d)*0.18;
    this.vx*=0.93; this.vy*=0.93;
    if(this.timer%80<25){ this.vx=(dx/d)*sp*1.5; this.vy=(dy/d)*sp*1.5; }
    this.x+=this.vx; this.y+=this.vy;
    for(const arm of this.arms){
      if(!arm.alive) continue;
      arm.ang+=0.09+(4-armsAlive)*0.02;
      const r=60;
      arm.x=cx+Math.cos(arm.ang+arm.i)*r-arm.w/2;
      arm.y=cy+Math.sin(arm.ang+arm.i*0.7)*r*0.7-arm.h/2;
      if(arm.x<player.x+player.w&&arm.x+arm.w>player.x&&arm.y<player.y+player.h&&arm.y+arm.h>player.y)
        player.tryHurt(13);
    }
    if(this.timer%100===0 && window.game){
      window.game.stingers=window.game.stingers||[];
      window.game.stingers.push({x:cx,y:cy,vx:(dx/d)*7,vy:(dy/d)*7,life:50,dmg:15,c:'#fa0'});
    }
    if(this.x<player.x+player.w&&this.x+this.w>player.x&&this.y<player.y+player.h&&this.y+this.h>player.y)
      player.tryHurt(armsAlive?12:18);
  };
  SkeletronPrime.prototype.hurtMe=function(dmg){
    this.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(this.hp<=0){ this.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); this.dropLoot(); }
  };
  SkeletronPrime.prototype.hurtAt=function(x,y,dmg){
    for(const arm of this.arms){
      if(!arm.alive) continue;
      if(x>arm.x-4&&x<arm.x+arm.w+4&&y>arm.y-4&&y<arm.y+arm.h+4){
        arm.hp-=dmg; this.hurt=6;
        if(window.AUDIO) AUDIO.play('enemy_hurt');
        if(arm.hp<=0){
          arm.alive=false;
          if(window.AUDIO) AUDIO.play('enemy_die');
          if(window.game) window.game.spawnDrop(arm.x,arm.y,'i_soul_fright',2);
        }
        return true;
      }
    }
    if(x>this.x-4&&x<this.x+this.w+4&&y>this.y-4&&y<this.y+this.h+4){
      this.hurtMe(dmg); return true;
    }
    return false;
  };
  SkeletronPrime.prototype.dropLoot=function(){
    if(!window.game) return;
    const p=window.game.player, drops=DATA.DROPS.prime||[];
    for(const [item,min,max,ch] of drops){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n>0) window.game.spawnDrop(this.x,this.y,item,n);
      }
    }
    p.bossDown.prime=true;
  };
  SkeletronPrime.prototype.draw=function(ctx,cam){
    for(const arm of this.arms){
      if(!arm.alive) continue;
      const sx=Math.round(arm.x-cam.x), sy=Math.round(arm.y-cam.y);
      if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
      ctx.fillStyle='rgb(160,160,180)'; ctx.fillRect(sx,sy,arm.w,arm.h);
      ctx.fillStyle='#f80'; ctx.fillRect(sx+arm.w-6,sy+2,5,arm.h-4);
      ctx.globalAlpha=1;
    }
    const sx=Math.round(this.x-cam.x-4), sy=Math.round(this.y-cam.y-4);
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
    if(SPR.skeletron_head) ctx.drawImage(SPR.skeletron_head,sx,sy,48,48);
    else { ctx.fillStyle='#ddd'; ctx.fillRect(sx,sy,40,40); }
    // 机械感
    ctx.strokeStyle='#888'; ctx.lineWidth=2; ctx.strokeRect(sx+4,sy+4,40,40);
    ctx.globalAlpha=1;
  };

  window.Destroyer=Destroyer;
  window.Twins=Twins;
  window.SkeletronPrime=SkeletronPrime;

  // ===== 世纪之花（Plantera）=====
  // 阶段1：缓慢漂浮追踪；阶段2：HP<50% 加速+发射尖刺弹
  function Plantera(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=44; this.h=44;
    this.vx=0; this.vy=0;
    this.hp=30000; this.maxHp=30000;
    this.phase=1; this.timer=0;
    this.hurt=0; this.alive=true;
    this.tendX=x; this.tendY=y;
  }
  Plantera.prototype.getName=function(){return '世纪之花';};
  Plantera.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0)this.hurt--;
    this.timer++;
    if(this.phase===1 && this.hp<=this.maxHp*0.5){
      this.phase=2;
      if(window.AUDIO) AUDIO.play('night');
    }
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const px=player.x+player.w/2, py=player.y+player.h/2;
    const dx=px-cx, dy=py-cy, d=Math.hypot(dx,dy)||1;
    const sp=this.phase===1?0.06:0.16;
    this.vx+=(dx/d)*sp; this.vy+=(dy/d)*sp;
    this.vx*=0.93; this.vy*=0.93;
    this.x+=this.vx; this.y+=this.vy;
    // 尖刺弹
    if(this.phase===2 && this.timer%40===0 && window.game){
      for(let i=0;i<3;i++){
        const a=Math.atan2(dy,dx)+(i-1)*0.25;
        window.game.stingers=window.game.stingers||[];
        window.game.stingers.push({x:cx,y:cy,vx:Math.cos(a)*5.5,vy:Math.sin(a)*5.5,life:55,dmg:18,c:'#f8a'});
      }
    }
    if(this.x<player.x+player.w&&this.x+this.w>player.x&&this.y<player.y+player.h&&this.y+this.h>player.y)
      player.tryHurt(this.phase===2?22:14);
  };
  Plantera.prototype.hurtMe=function(dmg){
    this.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(this.hp<=0){ this.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); this.dropLoot(); }
  };
  Plantera.prototype.dropLoot=function(){
    if(!window.game) return;
    const g=window.game, p=g.player, drops=DATA.DROPS.plantera||[];
    for(const [item,min,max,ch] of drops){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n>0) g.spawnDrop(this.x+this.w/2,this.y+this.h/2,item,n);
      }
    }
    p.bossDown.plantera=true;
    // 解锁神庙
    if(g.world && g.world.temple) g.world.temple.locked=false;
    g._msg='击败世纪之花！地牢升级，神庙开启'; g._msgT=g.t||0;
  };
  Plantera.prototype.draw=function(ctx,cam){
    const sp=SPR.plantera;
    const sx=Math.round(this.x+this.w/2-cam.x-28);
    const sy=Math.round(this.y+this.h/2-cam.y-28);
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
    ctx.drawImage(sp,sx,sy,56,56);
    ctx.globalAlpha=1;
    // 阶段2嘴部更红
    if(this.phase===2){ ctx.fillStyle='rgba(255,80,80,.4)'; ctx.beginPath(); ctx.arc(sx+28,sy+28,28,0,Math.PI*2); ctx.fill(); }
  };

  // ===== 石巨人（Golem）=====
  // 头部+双拳。先打双拳，再打头；阶段2头飞起
  function Golem(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=40; this.h=44;
    this.vx=0; this.vy=0;
    this.hp=35000; this.maxHp=35000;
    this.hurt=0; this.alive=true; this.timer=0; this.phase=1;
    this.fists=[
      {x:x-30,y:y,w:12,h:14,vx:0,vy:0,hp:3500,maxHp:3500,alive:true,recoil:0},
      {x:x+30,y:y,w:12,h:14,vx:0,vy:0,hp:3500,maxHp:3500,alive:true,recoil:0}
    ];
  }
  Golem.prototype.getName=function(){return '石巨人';};
  Golem.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0)this.hurt--;
    this.timer++;
    if(this.phase===1 && this.hp<=this.maxHp*0.5){ this.phase=2; }
    const px=player.x+player.w/2, py=player.y+player.h/2;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    // 身体轻微浮动
    this.y+=Math.sin(this.timer*0.04)*0.4;
    // 双拳朝玩家冲撞
    for(const f of this.fists){
      if(!f.alive) continue;
      if(f.recoil>0){ f.recoil--; continue; }
      const fx=f.x+f.w/2, fy=f.y+f.h/2;
      const dx=px-fx, dy=py-fy, d=Math.hypot(dx,dy)||1;
      f.vx+=(dx/d)*0.12; f.vy+=(dy/d)*0.12;
      f.vx*=0.94; f.vy*=0.94;
      f.x+=f.vx; f.y+=f.vy;
      if(f.x<player.x+player.w&&f.x+f.w>player.x&&f.y<player.y+player.h&&f.y+f.h>player.y){
        player.tryHurt(20);
        f.recoil=40; f.vx*=-0.6; f.vy*=-0.6;
      }
    }
    // 头部激光
    if(this.timer%80===0 && window.game){
      const dx=px-cx, dy=py-cy, d=Math.hypot(dx,dy)||1;
      window.game.stingers=window.game.stingers||[];
      window.game.stingers.push({x:cx,y:cy-22,vx:(dx/d)*7,vy:(dy/d)*7,life:60,dmg:18,c:'#fa0'});
    }
    // 接触伤害
    if(this.x<player.x+player.w&&this.x+this.w>player.x&&this.y<player.y+player.h&&this.y+this.h>player.y)
      player.tryHurt(18);
  };
  Golem.prototype.hurtMe=function(dmg){
    this.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(this.hp<=0){ this.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); this.dropLoot(); }
  };
  Golem.prototype.hurtAt=function(x,y,dmg){
    for(const f of this.fists){
      if(!f.alive) continue;
      if(x>f.x-4&&x<f.x+f.w+4&&y>f.y-4&&y<f.y+f.h+4){
        f.hp-=dmg; this.hurt=6;
        if(window.AUDIO) AUDIO.play('enemy_hurt');
        if(f.hp<=0){ f.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); }
        return true;
      }
    }
    if(x>this.x-4&&x<this.x+this.w+4&&y>this.y-4&&y<this.y+this.h+4){
      this.hurtMe(dmg); return true;
    }
    return false;
  };
  Golem.prototype.dropLoot=function(){
    if(!window.game) return;
    const g=window.game, p=g.player, drops=DATA.DROPS.golem||[];
    for(const [item,min,max,ch] of drops){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n>0) g.spawnDrop(this.x+this.w/2,this.y+this.h/2,item,n);
      }
    }
    p.bossDown.golem=true;
    g._msg='击败石巨人！'; g._msgT=g.t||0;
  };
  Golem.prototype.draw=function(ctx,cam){
    // 拳
    for(const f of this.fists){
      if(!f.alive) continue;
      const sx=Math.round(f.x-cam.x), sy=Math.round(f.y-cam.y);
      ctx.fillStyle='rgb(200,160,40)'; ctx.fillRect(sx,sy,f.w,f.h);
      ctx.strokeStyle='#3a2a10'; ctx.lineWidth=2; ctx.strokeRect(sx,sy,f.w,f.h);
    }
    const sx=Math.round(this.x-cam.x-4), sy=Math.round(this.y-cam.y-12);
    const sp=SPR.golem;
    if(sp){ if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5; ctx.drawImage(sp,sx,sy,48,56); ctx.globalAlpha=1; }
    else {
      ctx.fillStyle='rgb(200,160,40)';
      ctx.fillRect(sx+12,sy+2,24,18);
      ctx.fillRect(sx+8,sy+22,32,28);
    }
  };

  window.Plantera=Plantera;
  window.Golem=Golem;

  // ===== 拜月邪教徒（Lunatic Cultist）=====
  // 传送 + 发射弹幕；击败后触发月球事件
  function Cultist(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=28; this.h=40;
    this.vx=0; this.vy=0;
    this.hp=32000; this.maxHp=32000;
    this.hurt=0; this.alive=true; this.timer=0;
    this._tp=0;
  }
  Cultist.prototype.getName=function(){return '拜月邪教徒';};
  Cultist.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0)this.hurt--;
    this.timer++;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const px=player.x+player.w/2, py=player.y+player.h/2;
    // 悬停在玩家侧上方
    const tx=px+(Math.sin(this.timer*0.03)*160), ty=py-100;
    this.vx+=(tx-cx)*0.02; this.vy+=(ty-cy)*0.02;
    this.vx*=0.9; this.vy*=0.9;
    this.x+=this.vx; this.y+=this.vy;
    // 传送
    this._tp++;
    if(this._tp>180){ this._tp=0; this.x=px+(Math.random()<0.5?-200:200); this.y=py-120; }
    // 弹幕：环形/追踪
    if(this.timer%50===0 && window.game){
      window.game.stingers=window.game.stingers||[];
      if(Math.random()<0.5){
        for(let i=0;i<6;i++){
          const a=(i/6)*Math.PI*2;
          window.game.stingers.push({x:cx,y:cy,vx:Math.cos(a)*4.5,vy:Math.sin(a)*4.5,life:70,dmg:18,c:'#b9f'});
        }
      } else {
        const dx=px-cx, dy=py-cy, d=Math.hypot(dx,dy)||1;
        window.game.stingers.push({x:cx,y:cy,vx:(dx/d)*7,vy:(dy/d)*7,life:70,dmg:22,c:'#f9f'});
      }
    }
    if(this.x<player.x+player.w&&this.x+this.w>player.x&&this.y<player.y+player.h&&this.y+this.h>player.y)
      player.tryHurt(20);
  };
  Cultist.prototype.hurtMe=function(dmg){
    this.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(this.hp<=0){ this.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); this.dropLoot(); }
  };
  Cultist.prototype.dropLoot=function(){
    if(!window.game) return;
    const g=window.game, p=g.player, drops=DATA.DROPS.cultist||[];
    for(const [item,min,max,ch] of drops){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n>0) g.spawnDrop(this.x+this.w/2,this.y+this.h/2,item,n);
      }
    }
    p.bossDown.cultist=true;
    // 触发月球事件
    if(g.startLunarEvent) g.startLunarEvent();
    g._msg='邪教徒陨落……月球事件开始！四天界柱降临'; g._msgT=g.t||0;
  };
  Cultist.prototype.draw=function(ctx,cam){
    const sx=Math.round(this.x-cam.x), sy=Math.round(this.y-cam.y);
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
    // 长袍
    ctx.fillStyle='rgb(230,230,245)'; ctx.fillRect(sx,sy+8,this.w,this.h-8);
    ctx.fillStyle='rgb(180,180,220)'; ctx.fillRect(sx+4,sy+20,this.w-8,4);
    // 兜帽
    ctx.fillStyle='rgb(200,60,80)'; ctx.fillRect(sx+4,sy,this.w-8,12);
    ctx.fillStyle='#000'; ctx.fillRect(sx+8,sy+5,4,3);ctx.fillRect(sx+16,sy+5,4,3);
    ctx.globalAlpha=1;
  };

  // ===== 天界柱（Celestial Pillar）=====
  // 四种：solar/nebula/vortex/stardust。护盾需清杀周围小怪解除（简化为血量），然后可破
  function Pillar(world,x,y,type){
    this.world=world;
    this.type=type; // solar/nebula/vortex/stardust
    this.x=x; this.y=y; this.w=40; this.h=120;
    this.hp=20000; this.maxHp=20000;
    this.shield=100; // 护盾值，攻击玩家周围减少（简化：直接可打，护盾做视觉）
    this.hurt=0; this.alive=true; this.timer=0;
    this.colors={solar:'#f80',nebula:'#c4f',vortex:'#4fc',stardust:'#8af'};
  }
  Pillar.prototype.getName=function(){
    return {solar:'日耀柱',nebula:'星云柱',vortex:'星旋柱',stardust:'星尘柱'}[this.type];
  };
  Pillar.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0)this.hurt--;
    this.timer++;
    // 周期发射对应弹幕
    if(this.timer%70===0 && window.game){
      const cx=this.x+this.w/2, cy=this.y+20;
      const px=player.x+player.w/2, py=player.y+player.h/2;
      const dx=px-cx, dy=py-cy, d=Math.hypot(dx,dy)||1;
      window.game.stingers=window.game.stingers||[];
      window.game.stingers.push({x:cx,y:cy,vx:(dx/d)*5,vy:(dy/d)*5,life:90,dmg:16,c:this.colors[this.type]});
    }
    // 接触伤害
    if(this.x<player.x+player.w&&this.x+this.w>player.x&&this.y<player.y+player.h&&this.y+this.h>player.y)
      player.tryHurt(16);
  };
  Pillar.prototype.hurtMe=function(dmg){
    this.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(this.hp<=0){ this.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); this.dropLoot(); }
  };
  Pillar.prototype.dropLoot=function(){
    if(!window.game) return;
    const g=window.game, drops=DATA.DROPS['pillar_'+this.type]||[];
    for(const [item,min,max,ch] of drops){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n>0) g.spawnDrop(this.x+this.w/2,this.y+40,item,n);
      }
    }
    if(g.onPillarDown) g.onPillarDown(this);
  };
  Pillar.prototype.draw=function(ctx,cam){
    const sx=Math.round(this.x-cam.x), sy=Math.round(this.y-cam.y);
    const col=this.colors[this.type];
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
    // 柱身
    ctx.fillStyle='rgba(30,30,50,.9)'; ctx.fillRect(sx,sy,this.w,this.h);
    ctx.fillStyle=col; ctx.fillRect(sx+6,sy+6,this.w-12,this.h-12);
    ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillRect(sx+this.w/2-3,sy+10,6,this.h-20);
    // 顶部水晶
    ctx.fillStyle=col;
    ctx.beginPath(); ctx.arc(sx+this.w/2,sy-4,10,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
  };

  // ===== 月亮领主（Moon Lord）=====
  // 三只眼（双手+额头）+ 心脏。眼睛全灭后心脏暴露
  function MoonLord(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=100; this.h=140;
    this.vx=0; this.vy=0;
    this.hp=150000; this.maxHp=150000;
    this.hurt=0; this.alive=true; this.timer=0;
    this.eyes=[
      {name:'left',ox:-40,oy:20,w:28,h:28,hp:25000,maxHp:25000,alive:true},
      {name:'right',ox:40,oy:20,w:28,h:28,hp:25000,maxHp:25000,alive:true},
      {name:'head',ox:0,oy:-30,w:32,h:32,hp:30000,maxHp:30000,alive:true}
    ];
    this.core={ox:0,oy:50,w:36,h:36,hp:70000,maxHp:70000,exposed:false};
    this._syncHp();
  }
  MoonLord.prototype.getName=function(){return '月亮领主';};
  MoonLord.prototype._syncHp=function(){
    let s=0; for(const e of this.eyes) if(e.alive) s+=e.hp;
    if(this.core.exposed) s+=this.core.hp;
    this.hp=s;
  };
  MoonLord.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0)this.hurt--;
    this.timer++;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const px=player.x+player.w/2, py=player.y+player.h/2;
    // 缓慢跟随
    this.vx+=((px-cx)*0.006); this.vy+=((py-100-cy)*0.006);
    this.vx*=0.93; this.vy*=0.93;
    this.x+=this.vx; this.y+=this.vy;
    // 眼睛全灭 → 心脏暴露
    if(!this.core.exposed && this.eyes.every(e=>!e.alive)){
      this.core.exposed=true;
      if(window.AUDIO) AUDIO.play('night');
      if(window.game){ window.game._msg='心脏暴露！全力攻击！'; window.game._msgT=window.game.t||0; }
    }
    // 弹幕
    if(this.timer%55===0 && window.game){
      window.game.stingers=window.game.stingers||[];
      // 从活着的眼睛发射
      const src=this.eyes.filter(e=>e.alive);
      for(const e of src){
        const ex=cx+e.ox, ey=cy+e.oy;
        const dx=px-ex, dy=py-ey, d=Math.hypot(dx,dy)||1;
        window.game.stingers.push({x:ex,y:ey,vx:(dx/d)*6,vy:(dy/d)*6,life:80,dmg:24,c:'#8ff'});
      }
      // 死亡之息（大威胁弹）
      if(this.core.exposed){
        const dx=px-cx, dy=py-cy, d=Math.hypot(dx,dy)||1;
        window.game.stingers.push({x:cx,y:cy+this.core.oy,vx:(dx/d)*4,vy:(dy/d)*4,life:120,dmg:40,c:'#0ff'});
      }
    }
    // 接触伤害
    if(this.x<player.x+player.w&&this.x+this.w>player.x&&this.y<player.y+player.h&&this.y+this.h>player.y)
      player.tryHurt(30);
  };
  MoonLord.prototype.hurtMe=function(dmg){ this.hurtAt(this.x+this.w/2,this.y+this.h/2,dmg); };
  MoonLord.prototype.hurtAt=function(x,y,dmg){
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    // 优先眼睛
    for(const e of this.eyes){
      if(!e.alive) continue;
      const ex=cx+e.ox-e.w/2, ey=cy+e.oy-e.h/2;
      if(x>ex-6&&x<ex+e.w+6&&y>ey-6&&y<ey+e.h+6){
        e.hp-=dmg; this.hurt=6;
        if(window.AUDIO) AUDIO.play('enemy_hurt');
        if(e.hp<=0){ e.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); }
        if(!this.core.exposed && this.eyes.every(ee=>!ee.alive)){
          this.core.exposed=true;
          if(window.AUDIO) AUDIO.play('night');
          if(window.game){ window.game._msg='心脏暴露！全力攻击！'; window.game._msgT=window.game.t||0; }
        }
        this._syncHp();
        return true;
      }
    }
    // 心脏
    if(this.core.exposed){
      const hx=cx+this.core.ox-this.core.w/2, hy=cy+this.core.oy-this.core.h/2;
      if(x>hx-8&&x<hx+this.core.w+8&&y>hy-8&&y<hy+this.core.h+8){
        this.core.hp-=dmg; this.hurt=6;
        if(window.AUDIO) AUDIO.play('enemy_hurt');
        this._syncHp();
        if(this.core.hp<=0){ this.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); this.dropLoot(); }
        return true;
      }
    }
    return false;
  };
  MoonLord.prototype.dropLoot=function(){
    if(!window.game) return;
    const g=window.game, p=g.player, drops=DATA.DROPS.moonlord||[];
    for(const [item,min,max,ch] of drops){
      if(Math.random()<=ch){
        const n=min+Math.floor(Math.random()*(max-min+1));
        if(n>0) g.spawnDrop(this.x+this.w/2,this.y+this.h/2,item,n);
      }
    }
    p.bossDown.moonlord=true;
    g._msg='★ 月亮领主陨落！你征服了泰拉瑞亚！★'; g._msgT=(g.t||0)+600;
    // 由主循环 showVictory 弹出结算（不在这里置 _won）
    g._pendingVictory=true;
  };
  MoonLord.prototype.draw=function(ctx,cam){
    const cx=this.x+this.w/2-cam.x, cy=this.y+this.h/2-cam.y;
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=0.5;
    // 身体
    ctx.fillStyle='rgb(90,140,150)'; ctx.fillRect(cx-this.w/2,cy-this.h/2,this.w,this.h);
    ctx.fillStyle='rgb(60,110,120)'; ctx.fillRect(cx-this.w/2+8,cy-this.h/2+8,this.w-16,this.h-16);
    // 眼睛
    for(const e of this.eyes){
      const ex=cx+e.ox, ey=cy+e.oy;
      if(e.alive){
        ctx.fillStyle='#eef'; ctx.beginPath(); ctx.arc(ex,ey,e.w/2,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#0cf'; ctx.beginPath(); ctx.arc(ex,ey,e.w/4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#000'; ctx.fillRect(ex-2,ey-2,4,4);
      } else {
        ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(ex,ey,e.w/2,0,Math.PI*2); ctx.fill();
      }
    }
    // 心脏
    if(this.core.exposed){
      const hx=cx+this.core.ox, hy=cy+this.core.oy;
      ctx.fillStyle='#0ff'; ctx.beginPath(); ctx.arc(hx,hy,this.core.w/2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#8ff'; ctx.beginPath(); ctx.arc(hx,hy,this.core.w/4,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
  };

  window.Cultist=Cultist;
  window.Pillar=Pillar;
  window.MoonLord=MoonLord;
})();
