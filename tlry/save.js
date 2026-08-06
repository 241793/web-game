/* ===== 存档系统（localStorage） =====
 * 保存：种子 / 背包 / 装备 / HP / MP / 金币 / Boss 状态 / NPC 已入住
 * 加载：把数据写回 Game 状态，世界用相同种子重生
 */
(function(){
  const KEY='terraria_web_save_v1';

  function save(game){
    try{
      const p=game.player;
      const data={
        version:3,
        seed:game.world.seed,
        worldW:game.world.w, worldH:game.world.h,
        x:p.x, y:p.y,
        hp:p.hp, mp:p.mp, maxHp:p.maxHp, maxMp:p.maxMp,
        coins:p.coins,
        inv:p.inv, hotbar:p.hotbar, equip:p.equip, cur:p.cur,
        bossDown:p.bossDown,
        merchantSpawned: game.npcs.some(n=>n.spawned),
        dayTime:game.dayTime,
        t:game.t,
        difficulty: game.diff?game.diff.key:'classic',
        hardmode: !!(game.hardmode || (game.world&&game.world.hardmode)),
        achievements: game.achievements||{},
        won: !!game._won,
        worldChanges: game.world.diffChanges(),
      };
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    }catch(e){ console.warn('save failed', e); return false; }
  }

  function load(){
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(e){ console.warn('load failed', e); return null; }
  }

  function applyTo(game, data){
    const p=game.player;
    if(data.hp!==undefined) p.hp=data.hp;
    if(data.mp!==undefined) p.mp=data.mp;
    if(data.maxHp!==undefined) p.maxHp=data.maxHp;
    if(data.maxMp!==undefined) p.maxMp=data.maxMp;
    if(data.coins!==undefined) p.coins=data.coins;
    if(data.inv) p.inv=data.inv;
    if(data.hotbar) p.hotbar=data.hotbar;
    if(data.equip) p.equip=data.equip;
    if(data.cur!==undefined) p.cur=data.cur;
    if(data.bossDown) p.bossDown=data.bossDown;
    // 世界尺寸/生成规则改变后，旧坐标可能埋在地下；旧档保留进度但回到新出生点
    const sameWorldSize=data.worldW===game.world.w && data.worldH===game.world.h;
    if(sameWorldSize && data.x!==undefined && data.y!==undefined){ p.x=data.x; p.y=data.y; }
    if(data.dayTime!==undefined) game.dayTime=data.dayTime;
    if(data.difficulty && window.DIFFS && window.DIFFS[data.difficulty]){
      game.diff=window.DIFFS[data.difficulty];
    }
    if(data.hardmode){
      game.hardmode=true;
      if(game.world && game.world.enableHardmode) game.world.enableHardmode();
    }
    if(data.achievements) game.achievements=data.achievements;
    if(data.won) game._won=true;
    // 恢复玩家改动过的世界方块（挖掉的洞、放置的方块等）
    if(data.worldChanges && game.world && game.world.applyChanges){
      game.world.applyChanges(data.worldChanges);
    }
  }

  function clear(){ localStorage.removeItem(KEY); }

  window.SAVE={save, load, applyTo, clear, KEY};
})();
