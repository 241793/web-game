/* ===== NPC：商人（Merchant） =====
 * 入住条件：玩家拥有 50 银币（5000 铜币）以上
 * 商人出现在地表出生点附近，玩家接近时弹出商店
 */
(function(){
  const TS=16, SPR=window.ASSETS.sprites;
  const DATA=window.DATA;
  const SHOP=DATA.SHOP;
  const TILES=DATA.TILES;

  function Merchant(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=14; this.h=28;
    this.vx=0; this.vy=0;
    this.onGround=false;
    this.alive=true;
    this.talk=0;
    this.facing=true;
    this.spawned=false;
  }

  function collideAxis(self,axis){
    const W=self.world;
    const x0=Math.floor(self.x/TS), x1=Math.floor((self.x+self.w-1)/TS);
    const y0=Math.floor(self.y/TS), y1=Math.floor((self.y+self.h-1)/TS);
    let best=null;
    for(let ty=y0;ty<=y1;ty++) for(let tx=x0;tx<=x1;tx++){
      if(!W.isSolid(tx,ty)) continue;
      const bx=tx*TS, by=ty*TS;
      if(axis==='x'){
        if(self.vx>0){ const p=bx-self.w; if(best===null||p<best)best=p; }
        else if(self.vx<0){ const p=bx+TS; if(best===null||p>best)best=p; }
      } else {
        if(self.vy>0){ const p=by-self.h; if(best===null||p<best)best=p; }
        else if(self.vy<0){ const p=by+TS; if(best===null||p>best)best=p; }
      }
    }
    if(best===null) return;
    if(axis==='x'){ self.x=best; self.vx=0; }
    else { if(self.vy>0) self.onGround=true; self.y=best; self.vy=0; }
  }

  Merchant.prototype.update=function(player){
    if(!this.alive) return;
    if(!this.spawned && player.coins>=5000){
      this.spawned=true;
      if(window.AUDIO) AUDIO.play('craft');
    }
    if(!this.spawned) return;
    this.vy+=0.32; if(this.vy>14)this.vy=14;
    // 简单 AI：在原地附近 4 格内散步
    if(this.onGround && Math.random()<0.005){
      this.vx = (Math.random()<0.5?-1:1)*1.0;
    }
    if(this.onGround && Math.random()<0.005) this.vx=0;
    this.x += this.vx; collideAxis(this,'x');
    this.y += this.vy; this.onGround=false; collideAxis(this,'y');
    if(player.x < this.x) this.facing=false; else this.facing=true;
    if(this.aabb(player)) this.talk=120;
    if(this.talk>0) this.talk--;
  };

  Merchant.prototype.aabb=function(p){
    return this.x<p.x+p.w && this.x+this.w>p.x && this.y<p.y+p.h && this.y+this.h>p.y;
  };

  Merchant.prototype.draw=function(ctx,cam){
    if(!this.spawned) return;
    const sp=SPR.merchant;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const sx=Math.round(cx-cam.x-16);
    const sy=Math.round(cy-cam.y-16);
    if(!this.facing){ ctx.save(); ctx.translate(sx+16,sy); ctx.scale(-1,1); ctx.drawImage(sp,0,0,32,32); ctx.restore(); }
    else ctx.drawImage(sp,sx,sy,32,32);
    if(this.talk>0){
      ctx.fillStyle='rgba(255,255,220,.95)';
      ctx.fillRect(sx-6,sy-22,72,18);
      ctx.fillStyle='#000';ctx.font='11px sans-serif';ctx.textBaseline='top';
      ctx.fillText('买东西?',sx-2,sy-19);
    }
  };

  // 购买
  Merchant.prototype.buy=function(itemKey, player){
    const price=SHOP[itemKey];
    if(price===undefined) return false;
    if(player.coins < price) return false;
    player.coins -= price;
    player.give(itemKey, 1);
    if(window.AUDIO) AUDIO.play('craft');
    return true;
  };

  // 护士：入住条件 玩家最大生命 > 100。靠近时花金币回满血
  function Nurse(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=14; this.h=28;
    this.vx=0; this.vy=0;
    this.onGround=false;
    this.alive=true;
    this.talk=0;
    this.facing=true;
    this.spawned=false;
  }
  Nurse.prototype.collideX=function(){collideAxis(this,'x');};
  Nurse.prototype.collideY=function(){collideAxis(this,'y');};
  Nurse.prototype.update=function(player){
    if(!this.alive) return;
    if(!this.spawned && player.maxHp>100){ this.spawned=true; if(window.AUDIO) AUDIO.play('craft'); }
    if(!this.spawned) return;
    this.vy+=0.32; if(this.vy>14)this.vy=14;
    // 入住后留在屋内
    if(this.homeX!==undefined && this.homeY!==undefined){
      const dx=this.homeX-this.x;
      this.vx = Math.abs(dx)>4 ? (dx>0?0.8:-0.8) : 0;
    } else if(this.onGround && Math.random()<0.005){
      this.vx = (Math.random()<0.5?-1:1)*0.8;
    }
    if(this.onGround && Math.random()<0.005) this.vx=0;
    this.x += this.vx; this.collideX();
    this.y += this.vy; this.onGround=false; this.collideY();
    if(player.x < this.x) this.facing=false; else this.facing=true;
    if(this.aabb(player)) this.talk=120;
    if(this.talk>0) this.talk--;
  };
  Nurse.prototype.aabb=Merchant.prototype.aabb;
  Nurse.prototype.draw=function(ctx,cam){
    if(!this.spawned) return;
    const sp=SPR.nurse;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const sx=Math.round(cx-cam.x-16);
    const sy=Math.round(cy-cam.y-16);
    if(!this.facing){ ctx.save(); ctx.translate(sx+16,sy); ctx.scale(-1,1); ctx.drawImage(sp,0,0,32,32); ctx.restore(); }
    else ctx.drawImage(sp,sx,sy,32,32);
    if(this.talk>0){
      ctx.fillStyle='rgba(255,255,220,.95)';
      ctx.fillRect(sx-6,sy-22,96,18);
      ctx.fillStyle='#000';ctx.font='11px sans-serif';ctx.textBaseline='top';
      ctx.fillText('要我治疗吗?',sx-2,sy-19);
    }
  };
  // 治疗：费用金币，回满血
  Nurse.prototype.heal=function(player){
    const cost=Math.min(500, Math.max(50, (player.maxHp-player.hp)*5));
    if(player.hp>=player.maxHp) return 0;
    if(player.coins<cost) return -1; // 钱不够
    player.coins-=cost;
    player.hp=player.maxHp;
    if(window.game) window.game.spawnHealParticles(player);
    if(window.AUDIO) AUDIO.play('potion');
    return cost;
  };

  // 地牢老人：站在地牢入口，夜晚对话召唤骷髅王
  function OldMan(world,x,y){
    this.world=world;
    this.x=x; this.y=y; this.w=14; this.h=28;
    this.vx=0; this.vy=0;
    this.onGround=false;
    this.alive=true;
    this.talk=0;
    this.spawned=true;
    this.isOldMan=true;
  }
  OldMan.prototype.update=function(player){
    if(!this.alive) return;
    this.vy+=0.32; if(this.vy>14)this.vy=14;
    this.y+=this.vy; this.onGround=false;
    collideAxis(this,'y');
    if(this.aabb(player)) this.talk=90;
    if(this.talk>0) this.talk--;
  };
  OldMan.prototype.aabb=Merchant.prototype.aabb;
  OldMan.prototype.draw=function(ctx,cam){
    if(!this.spawned) return;
    const sp=SPR.oldman;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const sx=Math.round(cx-cam.x-16), sy=Math.round(cy-cam.y-16);
    ctx.drawImage(sp,sx,sy,32,32);
    if(this.talk>0){
      ctx.fillStyle='rgba(255,255,220,.95)';
      ctx.fillRect(sx-20,sy-36,120,32);
      ctx.fillStyle='#000';ctx.font='10px sans-serif';ctx.textBaseline='top';
      const night=window.game && window.game.dayTime>0.55 && window.game.dayTime<0.95;
      if(night){
        ctx.fillText('诅咒……按 F 解放我',sx-16,sy-32);
        ctx.fillText('(召唤骷髅王)',sx-16,sy-18);
      } else {
        ctx.fillText('白天我还算正常…',sx-16,sy-28);
      }
    }
  };
  OldMan.prototype.trySummon=function(game){
    if(!game || game.boss) return false;
    const night=game.dayTime>0.55 && game.dayTime<0.95;
    if(!night) return false;
    if(game.player.bossDown && game.player.bossDown.skeletron) return false;
    game.boss=game.scaleEntity?game.scaleEntity(new Skeletron(game.world, this.x, this.y-40)):new Skeletron(game.world, this.x, this.y-40);
    this.alive=false; // 老人被诅咒取代
    this.spawned=false;
    if(window.AUDIO) AUDIO.play('night');
    return true;
  };

  window.Merchant=Merchant;
  window.Nurse=Nurse;
  window.OldMan=OldMan;
  window.SHOP=SHOP;
})();
