/* ===== 音效系统（WebAudio 程序化合成，无外部资源） =====
 * 用法：window.AUDIO.play('mine') 等。
 * 首次用户交互后自动 resume。
 */
(function(){
  let ctx=null, master=null, musicGain=null, sfxGain=null;
  let started=false;
  let muted=false;

  function ensure(){
    if(started) return;
    started=true;
    try{
      ctx=new (window.AudioContext||window.webkitAudioContext)();
      master=ctx.createGain(); master.gain.value=0.7; master.connect(ctx.destination);
      musicGain=ctx.createGain(); musicGain.gain.value=0.0; musicGain.connect(master);
      sfxGain=ctx.createGain(); sfxGain.gain.value=0.6; sfxGain.connect(master);
    }catch(e){ console.warn('audio unavailable',e); }
  }
  function resume(){ if(ctx && ctx.state==='suspended') ctx.resume(); }

  // ---------- 基础合成 ----------
  function tone(freq,dur,type='square',gain=0.4,attack=0.005,decay=0.05){
    if(!ctx) return;
    const t=ctx.currentTime;
    const o=ctx.createOscillator(); o.type=type; o.frequency.setValueAtTime(freq,t);
    const g=ctx.createGain();
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(gain,t+attack);
    g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g).connect(sfxGain);
    o.start(t); o.stop(t+dur+0.02);
  }
  function noise(dur,gain=0.3,filterFreq=1000,type='lowpass'){
    if(!ctx) return;
    const t=ctx.currentTime;
    const n=Math.floor(ctx.sampleRate*dur);
    const buf=ctx.createBuffer(1,n,ctx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
    const src=ctx.createBufferSource(); src.buffer=buf;
    const f=ctx.createBiquadFilter(); f.type=type; f.frequency.value=filterFreq;
    const g=ctx.createGain(); g.gain.value=gain;
    src.connect(f).connect(g).connect(sfxGain);
    src.start(t);
  }
  function sweep(f0,f1,dur,type='square',gain=0.3){
    if(!ctx) return;
    const t=ctx.currentTime;
    const o=ctx.createOscillator(); o.type=type;
    o.frequency.setValueAtTime(f0,t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    const g=ctx.createGain();
    g.gain.setValueAtTime(gain,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g).connect(sfxGain);
    o.start(t); o.stop(t+dur+0.02);
  }

  // ---------- 音效库 ----------
  const SFX={
    mine(){ noise(0.08,0.25,800,'lowpass'); tone(120,0.06,'square',0.15); },
    mine_done(){ noise(0.12,0.3,600); sweep(300,120,0.12,'triangle',0.2); },
    place(){ tone(220,0.05,'square',0.18); tone(330,0.06,'square',0.15); },
    jump(){ sweep(220,520,0.12,'square',0.2); },
    land(){ noise(0.05,0.2,400); },
    sword(){ noise(0.06,0.25,2000,'bandpass'); sweep(800,400,0.08,'sawtooth',0.15); },
    bow(){ noise(0.15,0.3,900,'lowpass'); sweep(500,180,0.1,'triangle',0.2); },
    gun(){ noise(0.07,0.35,1800,'highpass'); tone(90,0.06,'square',0.25); },
    magic(){ sweep(420,920,0.16,'sine',0.22); tone(1180,0.08,'triangle',0.12); },
    beam(){ tone(180,0.09,'sawtooth',0.16); sweep(700,1200,0.08,'sine',0.1); },
    summon(){ tone(330,0.12,'triangle',0.18); tone(660,0.16,'sine',0.18); },
    explosion(){ noise(0.18,0.38,500,'lowpass'); sweep(160,55,0.2,'sawtooth',0.24); },
    crit(){ tone(880,0.06,'square',0.18); tone(1320,0.09,'triangle',0.2); },
    hurt(){ sweep(440,120,0.18,'sawtooth',0.3); },
    enemy_hurt(){ tone(200,0.06,'square',0.25); noise(0.04,0.15,1500); },
    enemy_die(){ sweep(300,80,0.25,'sawtooth',0.3); noise(0.15,0.2,500); },
    pickup(){ tone(660,0.05,'square',0.2); tone(880,0.06,'square',0.2); },
    craft(){ tone(440,0.05,'triangle',0.2); tone(660,0.06,'triangle',0.2); tone(880,0.08,'triangle',0.2); },
    potion(){ sweep(660,990,0.18,'sine',0.25); },
    open(){ tone(440,0.04,'square',0.15); tone(330,0.05,'square',0.12); },
    night(){ tone(110,0.6,'sine',0.15); },
    day(){ sweep(220,440,0.4,'triangle',0.15); }
  };

  // ---------- BGM：昼夜两段循环 ----------
  let bgmTimer=null, dayMode=null;
  function startMusic(){
    if(!ctx) return;
    const loopDay=()=>{
      // C 大调轻快循环
      const seq=[523,587,659,784, 659,587,523,440];
      seq.forEach((f,i)=>{
        const t=ctx.currentTime + i*0.32;
        const o=ctx.createOscillator(); o.type='triangle'; o.frequency.value=f;
        const g=ctx.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.08,t+0.02); g.gain.exponentialRampToValueAtTime(0.001,t+0.28);
        o.connect(g).connect(musicGain); o.start(t); o.stop(t+0.3);
        // 低音
        if(i%2===0){ const b=ctx.createOscillator();b.type='sine';b.frequency.value=f/2;
          const bg=ctx.createGain();bg.gain.setValueAtTime(0,t);bg.gain.linearRampToValueAtTime(0.06,t+0.02);bg.gain.exponentialRampToValueAtTime(0.001,t+0.6);
          b.connect(bg).connect(musicGain);b.start(t);b.stop(t+0.62); }
      });
    };
    const loopNight=()=>{
      // 缓慢 A 小调
      const seq=[220,262,330,262, 196,247,294,247];
      seq.forEach((f,i)=>{
        const t=ctx.currentTime + i*0.5;
        const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
        const g=ctx.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.06,t+0.05); g.gain.exponentialRampToValueAtTime(0.001,t+0.48);
        o.connect(g).connect(musicGain); o.start(t); o.stop(t+0.5);
      });
    };
    const tick=()=>{
      if(!ctx) return;
      const day = !(API.curDay>0.55 && API.curDay<0.95);
      // 切换
      if(dayMode!==day){
        dayMode=day;
        musicGain.gain.cancelScheduledValues(ctx.currentTime);
        musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime+0.5);
        setTimeout(()=>{ if(musicGain){ musicGain.gain.linearRampToValueAtTime(day?0.5:0.4, ctx.currentTime+1);} },600);
      }
      if(day) loopDay(); else loopNight();
    };
    bgmTimer=setInterval(tick, 2600);
    tick();
  }

  let masterVol=0.7;
  const API={
    init(){ ensure(); resume(); if(ctx && !bgmTimer) startMusic.call(this); },
    setDayPhase(p){ this.curDay=p; },
    play(name){ if(!ctx||muted) return; if(SFX[name]) SFX[name](); },
    toggleMute(){ muted=!muted; if(master) master.gain.value=muted?0:masterVol; return muted; },
    isMuted(){ return muted; },
    setVolume(v){ masterVol=Math.max(0,Math.min(1,v)); if(master) master.gain.value=muted?0:masterVol; return masterVol; },
    getVolume(){ return masterVol; }
  };
  window.AUDIO=API;
  // 首次任意交互解锁
  const unlock=()=>{ ensure(); resume(); if(!bgmTimer && ctx) startMusic.call(API); window.removeEventListener('keydown',unlock); window.removeEventListener('mousedown',unlock); };
  window.addEventListener('keydown',unlock);
  window.addEventListener('mousedown',unlock);
})();
