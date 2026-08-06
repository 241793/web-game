/* ===== 怪物 / NPC ===== */
(function(){
  const TS=16, SPR=window.ASSETS.sprites;

  // 共用轴分离碰撞：找最近一面墙推回，避免多瓦片穿墙
  function collideAxis(self,axis){
    const W=self.world;
    const x0=Math.floor(self.x/TS),x1=Math.floor((self.x+self.w-1)/TS);
    const y0=Math.floor(self.y/TS),y1=Math.floor((self.y+self.h-1)/TS);
    let best=null;
    for(let ty=y0;ty<=y1;ty++) for(let tx=x0;tx<=x1;tx++){
      if(!W.isSolid(tx,ty)) continue;
      const bx=tx*TS,by=ty*TS;
      if(axis==='x'){
        if(self.vx>0){const p=bx-self.w; if(best===null||p<best)best=p;}
        else if(self.vx<0){const p=bx+TS; if(best===null||p>best)best=p;}
      } else {
        if(self.vy>0){const p=by-self.h; if(best===null||p<best)best=p;}
        else if(self.vy<0){const p=by+TS; if(best===null||p>best)best=p;}
      }
    }
    if(best===null) return;
    if(axis==='x'){ self.x=best; self.vx=0; }
    else { if(self.vy>0) self.onGround=true; self.y=best; self.vy=0; }
  }

  function Slime(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=18; this.h=14;
    this.vx=0; this.vy=0;
    this.onGround=false;
    this.timer=30+Math.random()*40;
    this.facing=Math.random()<.5;
    this.hp=8; this.hurt=0;
    this.alive=true;
    this.frame=0;
    this.type='slime';
  }
  Slime.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0){ this.hurt--; }
    this.vy += 0.32; if(this.vy>14) this.vy=14;
    this.timer--;
    if(this.timer<=0 && this.onGround){
      // 朝玩家方向跳
      this.facing = (player.x > this.x);
      this.vx = this.facing?1.5:-1.5;
      this.vy = -6.5;
      this.onGround=false;
      this.timer = 60+Math.random()*40;
    }
    this.x += this.vx; this.collideX();
    this.y += this.vy; this.onGround=false; this.collideY();
    // 落地减速
    if(this.onGround) this.vx *= 0.6;
    // 接触玩家造成伤害
    if(this.aabb(player)){
      player.tryHurt(4);
      // 击退
      this.vx = (this.x<player.x?-2:2);
    }
    if(this.hp<=0) this.alive=false;
    this.frame=(this.frame+0.1)%2;
  };
  Slime.prototype.collideX=function(){ collideAxis(this,'x'); };
  Slime.prototype.collideY=function(){ collideAxis(this,'y'); };
  Slime.prototype.aabb=function(p){
    return this.x<p.x+p.w && this.x+this.w>p.x && this.y<p.y+p.h && this.y+this.h>p.y;
  };
  Slime.prototype.draw=function(ctx,cam){
    const sp = this.frame<1?SPR.slime1:SPR.slime2;
    // sprite 32x24，碰撞箱 18x14；脚底对齐
    const cx=this.x+this.w/2, cy=this.y+this.h;
    const sx=Math.round(cx-cam.x-16), sy=Math.round(cy-cam.y-24);
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=.4;
    ctx.drawImage(sp,sx,sy,32,24);
    ctx.globalAlpha=1;
  };

  function Zombie(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=14; this.h=28;
    this.vx=0; this.vy=0;
    this.onGround=false;
    this.facing=true;
    this.hp=14; this.hurt=0;
    this.alive=true;
    this.frame=0;
    this.jumpCool=0;
    this.type='zombie';
  }
  Zombie.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0) this.hurt--;
    this.vy += 0.32; if(this.vy>14) this.vy=14;
    // 追玩家
    const dir = (player.x > this.x)?1:-1;
    this.facing = dir>0;
    this.vx = dir*1.3;
    // 前方有墙就跳
    if(this.onGround && this.jumpCool<=0){
      const fx=Math.floor((this.x+ (dir>0?this.w+1:-1))/TS);
      const fy=Math.floor((this.y+this.h-4)/TS);
      if(this.world.isSolid(fx,fy)){ this.vy=-6.5; this.onGround=false; this.jumpCool=40; }
    }
    if(this.jumpCool>0) this.jumpCool--;
    this.x += this.vx; this.collideX();
    this.y += this.vy; this.onGround=false; this.collideY();
    if(this.aabb(player)){
      player.tryHurt(7);
      this.vx = (this.x<player.x?-2:2);
    }
    if(this.hp<=0) this.alive=false;
    if(this.onGround) this.frame=(this.frame+0.12)%3;
  };
  Zombie.prototype.collideX=function(){ collideAxis(this,'x'); };
  Zombie.prototype.collideY=function(){ collideAxis(this,'y'); };
  Zombie.prototype.aabb=Slime.prototype.aabb;
  Zombie.prototype.draw=function(ctx,cam){
    const f = this.frame|0;
    const sp = f===1?SPR.zombie1:f===2?SPR.zombie2:SPR.zombie1;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const sx=Math.round(cx-cam.x-16), sy=Math.round(cy-cam.y-16);
    if(!this.facing){ ctx.save(); ctx.translate(sx+16,sy); ctx.scale(-1,1); ctx.drawImage(sp,0,0,32,32); ctx.restore(); return; }
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=.4;
    ctx.drawImage(sp,sx,sy,32,32);
    ctx.globalAlpha=1;
  };

  function Guide(world,x,y){
    this.world=world; this.x=x; this.y=y; this.w=14; this.h=28;
    this.vy=0; this.onGround=false; this.alive=true;
    this.talk=0;
  }
  Guide.prototype.update=function(player){
    this.vy+=0.32; if(this.vy>14)this.vy=14;
    this.y+=this.vy; this.onGround=false;
    collideAxis(this,'y');
    if(this.aabb(player)) this.talk=120;
    if(this.talk>0) this.talk--;
  };
  Guide.prototype.aabb=Slime.prototype.aabb;
  Guide.prototype.draw=function(ctx,cam){
    const sp=SPR.guide;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const sx=Math.round(cx-cam.x-16),sy=Math.round(cy-cam.y-16);
    ctx.drawImage(sp,sx,sy,32,32);
    if(this.talk>0){
      ctx.fillStyle='rgba(255,255,220,.95)';
      ctx.fillRect(sx-6,sy-22,92,18);
      ctx.fillStyle='#000';ctx.font='11px sans-serif';ctx.textBaseline='top';
      ctx.fillText('欢迎来到 Terraria!',sx-2,sy-19);
    }
  };

  // 地狱恶魔：飞行，掉落巫毒娃娃
  function Demon(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=16; this.h=24;
    this.vx=0; this.vy=0;
    this.hp=40; this.hurt=0;
    this.alive=true;
    this.type='demon';
    this.timer=0;
  }
  Demon.prototype.update=function(player){
    if(!this.alive) return;
    if(this.hurt>0) this.hurt--;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const px=player.x+player.w/2, py=player.y+player.h/2;
    const dx=px-cx, dy=py-cy, d=Math.hypot(dx,dy)||1;
    this.vx+=(dx/d)*0.1; this.vy+=(dy/d)*0.1;
    this.vx*=0.94; this.vy*=0.94;
    this.x+=this.vx; this.y+=this.vy;
    if(this.x<player.x+player.w && this.x+this.w>player.x && this.y<player.y+player.h && this.y+this.h>player.y){
      player.tryHurt(12);
    }
    if(this.hp<=0) this.alive=false;
  };
  Demon.prototype.hurtMe=function(dmg){
    this.hp-=dmg; this.hurt=8;
    if(window.AUDIO) AUDIO.play('enemy_hurt');
    if(this.hp<=0){ this.alive=false; if(window.AUDIO) AUDIO.play('enemy_die'); }
  };
  Demon.prototype.draw=function(ctx,cam){
    const sp=SPR.demon;
    const sx=Math.round(this.x+this.w/2-cam.x-16);
    const sy=Math.round(this.y+this.h/2-cam.y-16);
    if(this.hurt>0 && Math.floor(this.hurt/2)%2===0) ctx.globalAlpha=.4;
    ctx.drawImage(sp,sx,sy,32,32);
    ctx.globalAlpha=1;
  };
  Demon.prototype.aabb=Slime.prototype.aabb;

  window.Slime=Slime; window.Zombie=Zombie; window.Guide=Guide; window.Demon=Demon;
})();
