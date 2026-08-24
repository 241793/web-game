(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=e(i);fetch(i.href,r)}})();const Ht=105,ge=68,re=11,Ie=3.6,ns=2.6,oi=16.5,ur=40,xs=-30,Pe=.45,Nh=.62,ao=.985,oo=.995,zh=.12,lo=.9,Fh=1.35,xa=7.6,Rn=12.4,Bn=.5,ir=.8,fr=10.5,Wo=12,Sc=.55,bc=.35,Oh=1.2,Bh=1.2,Gh=7.6,Tc=.62,va=.4,Hh=.06,wc=.22,Vh=9.6,Wh=1.4,Ec=.14,As=.35,pr=.5,Ac=.5,Xh=.4,Xo=.25,qh=1.45,$h=3.2,Yh=.9,qo=5,$o=.45,Kh=.32,Yo=.4,di=.42,Cs=1.3,Zh=8.5,jh=.9,Jh=.7,Qh=.7,Ko=.28,Vi=100,mr=15,td=10,Fr=7,ed=7.5,nd=.32,li=19,on=25,vs=34,Cc=7.5,Gn=100,Zo=26,jo=12,Jo=.55,id=5.5,sd=.35,rd=90,ad=6,od=.55,ld=4,cd=2,hd=3,dd=3.4,Rs=854,Si=480,Wi={banana:{id:"banana",name:"香蕉回旋",color:16113981,color2:16754237,speed:1,curve:34,wave:0,waveFreq:0,lift:.9,gravityScale:.25,knockdown:!1,ground:!1,fxStyle:"arc",trailScale:1,flash:!0},cyclone:{id:"cyclone",name:"龙卷旋风",color:4052469,color2:13170175,speed:.92,curve:0,wave:6,waveFreq:9,lift:1,gravityScale:.1,knockdown:!0,ground:!1,fxStyle:"spiral",trailScale:1.3,flash:!0},phantom:{id:"phantom",name:"幻影分身",color:12598773,color2:16099071,speed:1.08,curve:0,wave:10,waveFreq:14,lift:.7,gravityScale:.15,knockdown:!1,ground:!1,fxStyle:"clone",trailScale:.9,flash:!1},blast:{id:"blast",name:"轰天爆裂",color:16083517,color2:16742954,speed:1.2,curve:0,wave:0,waveFreq:0,lift:.8,gravityScale:.12,knockdown:!0,ground:!1,fxStyle:"blast",trailScale:1.5,flash:!1},drill:{id:"drill",name:"螺旋钻地",color:11072829,color2:14221178,speed:1.05,curve:0,wave:2.4,waveFreq:22,lift:.1,gravityScale:0,knockdown:!0,ground:!0,fxStyle:"groundspark",trailScale:1.1,flash:!0},meteor:{id:"meteor",name:"陨石坠击",color:16072026,color2:16765501,speed:.95,curve:0,wave:0,waveFreq:0,lift:2.6,gravityScale:1.6,knockdown:!0,ground:!1,fxStyle:"meteor",trailScale:1.8,flash:!0},serpent:{id:"serpent",name:"灵蛇游走",color:4060554,color2:8060872,speed:.98,curve:0,wave:7,waveFreq:6,lift:.15,gravityScale:0,knockdown:!1,ground:!0,fxStyle:"serpent",trailScale:.8,flash:!1},freeze:{id:"freeze",name:"寒冰冻结",color:10148095,color2:5941503,speed:.88,curve:12,wave:3,waveFreq:5,lift:1.1,gravityScale:.08,knockdown:!0,ground:!1,fxStyle:"ice",trailScale:.9,flash:!1},luohan:{id:"luohan",name:"罗汉伏虎",color:16097312,color2:14169386,speed:1.18,curve:0,wave:0,waveFreq:0,lift:.85,gravityScale:.12,knockdown:!0,ground:!1,fxStyle:"fist",trailScale:1.6,flash:!0},sweep:{id:"sweep",name:"扫堂腿",color:16106813,color2:9067040,speed:1.02,curve:8,wave:2,waveFreq:7,lift:.1,gravityScale:0,knockdown:!0,ground:!0,fxStyle:"groundspark",trailScale:1.2,flash:!0},eagle:{id:"eagle",name:"鹰击长空",color:16315608,color2:16103741,speed:1.25,curve:10,wave:0,waveFreq:0,lift:2.4,gravityScale:1.45,knockdown:!0,ground:!1,fxStyle:"meteor",trailScale:1.4,flash:!0},mirage:{id:"mirage",name:"沙漠幻影",color:4060616,color2:16113981,speed:1.12,curve:0,wave:9,waveFreq:11,lift:.6,gravityScale:.1,knockdown:!0,ground:!1,fxStyle:"serpent",trailScale:1.15,flash:!0}};class ud{constructor(){this.x=0,this.y=Pe,this.z=0,this.prevX=0,this.prevY=Pe,this.prevZ=0,this.vx=0,this.vy=0,this.vz=0,this.spin=0,this.swerve=0,this.owner=null,this.lastKicker=null,this.lastTeam=-1,this.special=null,this.specialT=0,this.specialDirX=0,this.specialDirZ=0,this.specialSide=1,this.untouchable=0,this.flightId=0}reset(t=0,e=0){this.x=this.prevX=t,this.z=this.prevZ=e,this.y=this.prevY=Pe,this.vx=this.vy=this.vz=0,this.swerve=0,this.owner=null,this.special=null,this.untouchable=0}kick(t,e,n,i,r=null,a=0){if(this.prevX=this.x,this.prevY=this.y,this.prevZ=this.z,this.flightId++,this.owner=null,this.vx=t,this.vy=e,this.vz=n,this.lastKicker=i,i&&(this.lastTeam=i.team),this.untouchable=.25,this.special=r,this.swerve=r?0:a,this.specialT=0,r){const o=Math.hypot(t,n)||1;this.specialDirX=t/o,this.specialDirZ=n/o,this.specialSide=Math.random()<.5?1:-1,this.untouchable=.35}}update(t,e,n,i=ao){var a;if(this.prevX=this.x,this.prevY=this.y,this.prevZ=this.z,this.untouchable>0&&(this.untouchable=Math.max(0,this.untouchable-t)),this.owner){const o=this.owner,l=1.35;this.x=o.x+o.faceX*l,this.z=o.z+o.faceZ*l,this.y=Pe+(o.y>0?o.y:0),this.vx=this.vy=this.vz=0,this.spin=Math.hypot(o.vx,o.vz)*.6;return}const r=this.special;if(r){this.specialT+=t;const o=vs*r.speed,l=this.specialT,c=-this.specialDirZ,h=this.specialDirX;let u=r.curve*this.specialSide*l;r.wave>0&&(u+=Math.sin(l*r.waveFreq)*r.wave),this.vx=this.specialDirX*o+c*u,this.vz=this.specialDirZ*o+h*u,this.vy+=xs*r.gravityScale*t,r.ground&&(this.y=Pe,this.vy=0),this.spin=40,this.specialT>2.2&&(this.special=null)}else{this.vy+=xs*t,this.vx+=e*t,this.vz+=n*t;const o=Math.hypot(this.vx,this.vz);if(o>3&&Math.abs(this.swerve)>.01){const h=this.swerve*Math.min(1,o/26),u=-this.vz/o,f=this.vx/o;this.vx+=u*h*t,this.vz+=f*h*t,this.swerve*=Math.exp(-1.65*t)}const l=this.y<=Pe+.01?i:oo,c=Math.pow(l,t*60);this.vx*=c,this.vz*=c,this.spin=Math.max(0,this.spin-t*20)}this.x+=this.vx*t,this.y+=this.vy*t,this.z+=this.vz*t,this.y<Pe&&(this.y=Pe,this.vy<0&&(this.vy=-this.vy*Nh,Math.abs(this.vy)<2&&(this.vy=0),(a=this.special)!=null&&a.ground&&(this.vy=0)))}speed(){return Math.hypot(this.vx,this.vz)}}class fd{constructor(t,e,n){this.x=0,this.y=0,this.z=0,this.vx=0,this.vy=0,this.vz=0,this.faceX=1,this.faceZ=0,this.state="idle",this.stateT=0,this.homeX=0,this.homeZ=0,this.dashT=0,this.dashCd=0,this.dribbleCd=0,this.dribbleDirX=0,this.dribbleDirZ=0,this.dribbleStartThreat=0,this.wasDribbling=!1,this.shootChargeT=-1,this.shootAimX=0,this.shootAimZ=0,this.fakeShotT=0,this.passCallT=0,this.passCallDirX=0,this.passCallDirZ=0,this.keeperDiveChargeT=-1,this.divePower=0,this.chipRequestT=0,this.trickType="none",this.trickT=0,this.trickDoubleT=0,this.trickFired=!1,this.landingGraceT=0,this.shieldActive=!1,this.celebrateStyle=0,this.controlled=!1,this.kickCd=0,this.stunned=0,this.animT=0,this.stamina=Vi,this.team=t,this.index=e,this.def=n}get isKeeper(){return this.index===0}get busy(){return this.state==="fallen"||this.state==="slide"||this.state==="tackle"||this.state==="kick"||this.state==="dribble"||this.state==="dive"||this.stunned>0}get onGround(){return this.y<=.001}face(t,e){const n=Math.hypot(t,e);n>.001&&(this.faceX=t/n,this.faceZ=e/n)}setState(t){this.state=t,this.stateT=0}moveSpeed(){let t=xa*this.def.speed;this.isKeeper&&(t=Gh*this.def.speed),this.state==="dash"&&(t=Rn*this.def.speed);const e=.8+.2*Math.sqrt(this.stamina/Vi);return t*e}consumeStamina(t){return this.stamina+1e-6<t?!1:(this.stamina=Math.max(0,this.stamina-t),!0)}knockdown(t,e,n=10){this.state!=="fallen"&&(this.setState("fallen"),this.vx=t*n,this.vz=e*n,this.vy=6)}update(t){this.stateT+=t,this.animT+=t,this.wasDribbling=this.state==="dribble",this.kickCd>0&&(this.kickCd=Math.max(0,this.kickCd-t)),this.dashCd>0&&(this.dashCd=Math.max(0,this.dashCd-t)),this.dribbleCd>0&&(this.dribbleCd=Math.max(0,this.dribbleCd-t)),this.fakeShotT>0&&(this.fakeShotT=Math.max(0,this.fakeShotT-t)),this.passCallT>0&&(this.passCallT=Math.max(0,this.passCallT-t)),this.chipRequestT>0&&(this.chipRequestT=Math.max(0,this.chipRequestT-t)),this.trickT>0&&(this.trickT=Math.max(0,this.trickT-t)),this.trickDoubleT>0&&(this.trickDoubleT=Math.max(0,this.trickDoubleT-t)),this.landingGraceT>0&&(this.landingGraceT=Math.max(0,this.landingGraceT-t)),this.stunned>0&&(this.stunned=Math.max(0,this.stunned-t),this.vx=0,this.vz=0);const e=Math.hypot(this.vx,this.vz)>1;switch(this.state==="dash"?this.stamina=Math.max(0,this.stamina-6*t):this.state==="dribble"?this.stamina=Math.max(0,this.stamina-3*t):this.state==="run"&&e?this.stamina=Math.max(0,this.stamina-nd*t):(this.state==="idle"||this.state==="kick"||this.state==="fallen")&&(this.stamina=Math.min(Vi,this.stamina+ed*t)),(this.y>0||this.vy>0)&&(this.vy+=xs*t,this.y+=this.vy*t,this.y<=0&&(this.y=0,this.vy=0,(this.state==="jump"||this.state==="headbutt")&&this.setState("idle"))),this.state){case"dash":this.dashT-=t,this.dashT<=0&&this.setState("run");break;case"dribble":{if(this.trickType==="roulette"){const a=this.stateT<di?4.5:6,o=Math.sign(this.dribbleDirX*-this.faceZ+this.dribbleDirZ*this.faceX)||1;this.vx=this.faceX*-o*a*.5,this.vz=this.faceZ*-o*a*.5,this.stateT>=di&&(this.face(this.dribbleDirX,this.dribbleDirZ),this.setState("run"));break}if(this.trickType==="stepover"){const a=Math.sin(this.stateT*26)*3.2,o=-this.dribbleDirZ,l=this.dribbleDirX;this.vx=o*a+this.dribbleDirX*2.2,this.vz=l*a+this.dribbleDirZ*2.2,this.stateT>=di&&(this.face(this.dribbleDirX,this.dribbleDirZ),this.vx=this.dribbleDirX*9,this.vz=this.dribbleDirZ*9,this.setState("run"));break}if(this.trickType==="rainbow"){const a=1.25+this.stateT*.6;this.vx=this.dribbleDirX*8.5*a,this.vz=this.dribbleDirZ*8.5*a,this.stateT>=.5&&(this.face(this.dribbleDirX,this.dribbleDirZ),this.setState("run"));break}if(this.trickType==="elastico"){const a=-this.dribbleDirZ,o=this.dribbleDirX;this.stateT<.18?(this.vx=(a+this.dribbleDirX*.3)*5,this.vz=(o+this.dribbleDirZ*.3)*5):(this.vx=(-a*1.1+this.dribbleDirX*.55)*11,this.vz=(-o*1.1+this.dribbleDirZ*.55)*11,this.trickFired||(this.trickFired=!0,this.face(-a+this.dribbleDirX,-o+this.dribbleDirZ))),this.stateT>=.45&&(this.face(this.dribbleDirX,this.dribbleDirZ),this.vx=this.dribbleDirX*10,this.vz=this.dribbleDirZ*10,this.setState("run"));break}if(this.trickType==="croqueta"){const a=-this.dribbleDirZ,o=this.dribbleDirX,l=this.stateT<.12?12:7;this.vx=a*l,this.vz=o*l,this.stateT>=.3&&this.setState("run");break}const r=this.stateT<Hh?6:this.stateT<wc?Vh:4;this.vx=this.dribbleDirX*r,this.vz=this.dribbleDirZ*r,this.stateT>=va&&this.setState("run");break}case"slide":case"tackle":{const r=Math.pow(.94,t*60);this.vx*=r,this.vz*=r,this.stateT>=Sc&&this.setState("idle");break}case"dive":{const r=Math.pow(.975,t*60);this.vx*=r,this.vz*=r,this.stateT>=Tc&&this.onGround&&this.setState("idle");break}case"fallen":{const r=Math.pow(.9,t*60);this.vx*=r,this.vz*=r,this.stateT>=Bh&&this.onGround&&this.setState("idle");break}case"kick":this.stateT>=.28&&this.setState("idle");break;case"celebrateSlide":{const r=Math.pow(.965,t*60);this.vx*=r,this.vz*=r,this.stateT>=2.2&&(this.vx=this.vz=0,this.setState("idle"));break}case"celebrateFly":case"celebrateCradle":case"celebrate":{this.stateT>=3&&this.onGround&&this.setState("idle");break}}this.x+=this.vx*t,this.z+=this.vz*t;const n=Ht/2+3,i=ge/2+3;this.x=Math.max(-n,Math.min(n,this.x)),this.z=Math.max(-i,Math.min(i,this.z))}}const ee=(s,t,e)=>Math.max(t,Math.min(e,s));function co(s,t,e=oo){const n=Math.pow(e,60);let i;Math.abs(n-1)<1e-6?i=t:i=(Math.pow(n,t)-1)/Math.log(n);const r=Math.hypot(s.vx,s.vz)||1,a=-s.vz/r,o=s.vx/r,l=s.swerve*t*t*.32;return{x:s.x+s.vx*i+a*l,z:s.z+s.vz*i+o*l}}function _a(s,t,e=.2,n=2.8){if(s.owner)return{x:s.owner.x,z:s.owner.z,time:0,reachable:s.owner===t,error:Math.hypot(t.x-s.owner.x,t.z-s.owner.z)};const i=.08,r=Math.max(2,t.moveSpeed());let a={x:s.x,z:s.z,time:n,reachable:!1,error:1/0};for(let o=i;o<=n+1e-6;o+=i){const l=co(s,o,s.y<=Pe+.05?ao:oo),c=Math.hypot(l.x-t.x,l.z-t.z),h=Math.max(0,o-e)*r+lo,u=c-h;if(u<a.error&&(a={...l,time:o,reachable:u<=0,error:u}),u<=0)return{...l,time:o,reachable:!0,error:u}}return a}function Qo(s,t,e,n,i,r){const a=i-e,o=r-n,l=a*a+o*o||1,c=ee(((s-e)*a+(t-n)*o)/l,0,1),h=e+a*c,u=n+o*c;return{u:c,distance:Math.hypot(s-h,t-u)}}function Ar(s,t,e,n,i=.2){const r=Math.hypot(t.x-s.x,t.z-s.z);if(r<.1)return 0;let a=1;for(const o of e){if(o.state==="fallen"||o.stunned>0)continue;const l=Qo(o.x,o.z,s.x,s.z,t.x,t.z);if(l.u<.06||l.u>1.03)continue;const c=r*l.u/Math.max(8,n),h=Math.min(.55,c),u=o.x+o.vx*h,f=o.z+o.vz*h,d=Qo(u,f,s.x,s.z,t.x,t.z),g=Math.max(0,c-i)*o.moveSpeed(),x=lo+.9,m=d.distance-(g+x),p=ee((2.4-m)/4.8,0,1);a*=1-p*.82}return ee(a,0,1)}function pd(s,t,e,n){const i=Math.hypot(t-s.x,s.z),r=Math.atan2(re/2-s.z,Math.abs(t-s.x))-Math.atan2(-11/2-s.z,Math.abs(t-s.x)),a=ee(Math.abs(r)/.55,.15,1),o=1/(1+Math.exp((i-23)/5.5)),l=ee((e-1.5)/6,.42,1),c=ee(Math.abs(n-s.z*.12)/(re/2),.65,1.08);return ee(o*a*l*c,.02,.88)}function md(s,t,e,n=Math.random){const i=re/2-Pe-.28,r=t>=0?-1:1,o=(s>re/2?-1:s<-11/2?1:r)*i*(.68+n()*.22);return ee(o+(n()-.5)*e,-i,i)}function gd(s,t,e,n,i){const r=t.x*i;if(r<=0)return!1;const a=n.filter(l=>l.state!=="fallen").map(l=>l.x*i).sort((l,c)=>c-l);if(a.length<2)return!1;const o=a[1];return r>Math.max(e*i,o)+.35}const tl=()=>({possession:0,shots:0,onTarget:0,tackleAttempts:0,tackles:0,specials:0,saves:0,passAttempts:0,passCompleted:0,interceptions:0,fouls:0,offsides:0,woodwork:0}),xd=[[-.46,0],[-.28,-.28],[-.28,.28],[-.05,0],[-.12,-.42],[-.12,.42]];class Rc{constructor(t,e){this.ball=new ud,this.players=[],this.playersByTeam=[[],[]],this.score=[0,0],this.time=0,this.half=1,this.phase="kickoff",this.phaseT=0,this.energy=[0,0],this.wind={x:0,z:0},this.windTimer=0,this.events=[],this.controlledIdx=[3,3],this.kickoffTeam=0,this.restartPos={x:0,z:0},this.lastSpecial=null,this.humanTeam=0,this.aiLevel=1,this.ruleset="arcade",this.halfDuration=rd,this.energyGainScale=1,this.tactics=["balanced","balanced"],this.combo=[0,0],this.comboT=[0,0],this.goldenGoal=!1,this.training=!1,this.trainingDrill="free",this.drillGoal=1,this.drillProgress=0,this.drillStreak=0,this.drillDone=!1,this.drillCelebrated=!1,this.keeperDrillShots=0,this.keeperDrillTimer=0,this.keeperDrillShooter=null,this.soloNpcFrozen=!1,this.lastLossT=[-99,-99],this.sprintBackCd=[0,0],this.dashTapT=[0,0],this.weather="clear",this.stats=[tl(),tl()],this.humans=[0],this.shootout=null,this.shootoutWinner=-1,this.endsSwapped=!1,this.passFlight=null,this.shotFlight=null,this.specialHitFlight=-1,this.specialHitPlayers=new Set,this.specialFlightTeam=-1,this.pickupTieTeam=0,this.intendedReceiver=null,this.restartTeam=0,this.teams=[t,e];for(let n=0;n<2;n++)for(let i=0;i<ad;i++){const r=new fd(n,i,this.teams[n].players[i]);this.players.push(r),this.playersByTeam[n].push(r)}this.randomWind(),this.setupKickoff(0)}emit(t){var n;this.events.push(t);const e=(n=t.player)==null?void 0:n.team;if(e!==void 0){const i=this.stats[e];t.type==="shoot"&&i.shots++,t.type==="special"&&(i.shots++,i.specials++),t.type==="tackle"&&i.tackleAttempts++,t.type==="save"&&i.saves++,t.type==="pass"&&(i.passAttempts++,this.passFlight={id:this.ball.flightId,team:e},this.shotFlight=null),(t.type==="shoot"||t.type==="special")&&(this.shotFlight={id:this.ball.flightId,team:e,onTarget:!1},this.passFlight=null,t.type==="special"&&(this.specialFlightTeam=e))}}teamPlayers(t){return this.playersByTeam[t]}energyFull(t){return this.energy[t]>=Gn-3}tacticLabel(t){return this.tactics[t]==="attack"?"强攻":this.tactics[t]==="defend"?"固守":"均衡"}gainEnergy(t,e){const n=1+Math.min(6,this.combo[t])*.06;this.energy[t]=Math.min(Gn,this.energy[t]+e*n*this.energyGainScale)}cycleTactic(t){const e=["balanced","attack","defend"];this.tactics[t]=e[(e.indexOf(this.tactics[t])+1)%e.length],this.refreshHomePositions(),this.emit({type:"tactic",team:t})}refreshHomePositions(){for(const t of this.players){const e=this.attackDir(t.team),[n,i]=xd[t.index],r=this.tactics[t.team],a=r==="attack"?t.index===0?1:t.index<=2?4:8:r==="defend"?t.index===0?0:t.index<=2?-3:-7:0;t.homeX=n*Ht*e+a*e,t.homeZ=i*ge*(r==="attack"?1.06:r==="defend"?.9:1)}}attackDir(t){const e=t===0?1:-1;return this.endsSwapped?-e:e}isOffsideTarget(t,e){return gd(t,e,this.ball.x,this.teamPlayers(1-t),this.attackDir(t))}winner(){return this.score[0]!==this.score[1]?this.score[0]>this.score[1]?0:1:this.shootoutWinner}randomWind(){const t=Math.random()*Math.PI*2,e=this.weather==="clear"?5.5:8,n=Math.random()*e;this.wind.x=Math.cos(t)*n,this.wind.z=Math.sin(t)*n*.6}rollWeather(){const t=Math.random();this.weather=t<.55?"clear":t<.8?"rain":"snow",this.randomWind()}groundFriction(){return this.weather==="rain"?.992:this.weather==="snow"?.972:ao}playerSpeedScale(){return this.weather==="snow"?.88:1}setupKickoff(t){this.phase="kickoff",this.phaseT=0,this.kickoffTeam=t,this.ball.reset(0,0),this.intendedReceiver=null,this.combo[0]=this.combo[1]=0,this.comboT[0]=this.comboT[1]=0,this.refreshHomePositions();for(const n of this.players){const i=this.attackDir(n.team);n.x=n.homeX,n.z=n.homeZ,n.y=0,n.vx=n.vy=n.vz=0,n.setState("idle"),n.stunned=0,n.kickCd=0,n.dashCd=0,n.dashT=0,n.dribbleCd=0,n.shootChargeT=-1,n.shootAimZ=0,n.fakeShotT=0,n.passCallT=0,n.passCallDirX=0,n.passCallDirZ=0,n.keeperDiveChargeT=-1,n.divePower=0,n.chipRequestT=0,n.trickType="none",n.trickT=0,n.face(i,0)}const e=this.teamPlayers(t)[3];e.x=-this.attackDir(t)*2.2,e.z=0,this.emit({type:"whistle"})}update(t,e){this.phaseT+=t,this.windTimer+=t;for(let n=0;n<2;n++)this.comboT[n]>0?this.comboT[n]=Math.max(0,this.comboT[n]-t):this.combo[n]=0;if(this.windTimer>18&&(this.windTimer=0,this.randomWind()),this.lastSpecial&&(this.lastSpecial.t-=t,this.lastSpecial.t<=0&&(this.lastSpecial=null)),this.phase==="shootout"){const n=this.shootout,i=e[n.shooterTeam],r=e[1-n.shooterTeam];this.updateShootout(t,(i==null?void 0:i.dirZ)??0,(i==null?void 0:i.shootPressed)??!1,(r==null?void 0:r.dirZ)??0);for(const a of this.players)a.animT+=t;return}if(this.phase==="play"){if(this.training||(this.time+=t),!this.training&&this.time>=this.halfDuration)if(this.half===1){this.half=2,this.time=0,this.endsSwapped=!0;for(const n of this.players)n.stamina=Math.min(Vi,n.stamina+24);this.phase="halftime",this.phaseT=0,this.ball.reset(0,0),this.emit({type:"whistle"});return}else if(this.half===2&&this.goldenGoal&&this.score[0]===this.score[1]){this.half=3,this.time=0,this.phase="halftime",this.phaseT=0,this.ball.reset(0,0),this.emit({type:"whistle"});return}else if(this.half===3&&this.goldenGoal&&this.score[0]===this.score[1]){this.startShootout();return}else{this.phase="fulltime",this.emit({type:"whistle"});return}this.training?(this.energy[0]=Gn,this.energy[1]=Gn):(this.energy[0]=Math.max(0,this.energy[0]-Jo*t),this.energy[1]=Math.max(0,this.energy[1]-Jo*t))}if(this.phase==="goal"&&this.phaseT>dd&&this.setupKickoff(1-(this.ball.lastTeam===0?0:1)),this.phase==="halftime"&&this.phaseT>2.2&&this.setupKickoff(1-this.kickoffTeam),this.phase==="kickoff"&&this.phaseT>.8){this.phase="play";const n=this.teamPlayers(this.kickoffTeam)[3];this.ball.owner=n,this.ball.lastTeam=this.kickoffTeam,this.emit({type:"phaseChange"})}(this.phase==="throwin"||this.phase==="corner"||this.phase==="goalkick"||this.phase==="freekick")&&this.phaseT>1.2&&this.doRestart();for(const n of this.humans){const i=e[n];if(i&&(i.tacticPressed&&this.phase==="play"&&this.cycleTactic(n),this.phase==="goal"&&i)){const r=this.getControlled(n);i.passPressed?r.celebrateStyle=0:i.shootPressed?r.celebrateStyle=1:i.skillPressed?r.celebrateStyle=2:i.jumpPressed&&(r.celebrateStyle=3),(i.passPressed||i.shootPressed||i.skillPressed||i.jumpPressed)&&this.setCelebration(r)}}for(let n=0;n<2;n++)this.sprintBackCd[n]>0&&(this.sprintBackCd[n]-=t),this.dashTapT[n]>0&&(this.dashTapT[n]-=t);for(const n of this.players){const i=this.humans.includes(n.team)&&n===this.getControlled(n.team),r=i?e[n.team]:null;if(this.training&&this.trainingDrill==="solo"&&this.soloNpcFrozen&&!i){n.vx=0,n.vz=0;continue}r&&this.phase==="play"&&this.applyInput(n,r,t);const a=n.y>.05,o=n.wasDribbling;n.update(t),a&&n.onGround&&this.energyFull(n.team)&&(n.landingGraceT=sd),o&&n.state!=="dribble"&&this.phase==="play"&&this.ball.owner===n&&this.nearestOpponentDist(n)>n.dribbleStartThreat+1.5&&this.emit({type:"dribbleWin",player:n,x:n.x,z:n.z,team:n.team})}if(this.playerCollisions(),this.phase==="play"||this.phase==="kickoff")this.ball.update(t,this.wind.x,this.wind.z,this.groundFriction()),this.ballSpecialHits(),this.checkBounds(),this.phase==="play"&&this.ballPickup();else{this.ball.update(t,0,0,this.groundFriction());const n=Ht/2,i=ge/2;(Math.abs(this.ball.x)>n+6||Math.abs(this.ball.z)>i+6)&&(this.ball.special=null,this.ball.vx*=.5,this.ball.vz*=.5,this.ball.x=Math.max(-n,Math.min(n,this.ball.x)),this.ball.z=Math.max(-i,Math.min(i,this.ball.z)))}if(this.training&&this.trainingDrill==="keeper"&&this.phase==="play"){const n=this.keeperDrillShooter;this.teamPlayers(this.humanTeam)[0];const i=-this.attackDir(1-this.humanTeam);if(n&&!this.drillDone&&(n.vx=n.vz=0,n.face(i,0),this.keeperDrillTimer-=t,this.keeperDrillTimer<=0&&!this.ball.owner&&this.keeperDrillShots<this.drillGoal)){const r=(Math.random()*2-1)*(re/2+1),a=i*Ht/2-this.ball.x,o=r-this.ball.z,l=Math.hypot(a,o)||1,c=on*(.85+Math.random()*.3);this.ball.kick(a/l*c,2+Math.random()*4,o/l*c,n),this.ball.lastTeam=n.team,this.keeperDrillShots++,this.keeperDrillTimer=2.6+Math.random()*1.4,this.emit({type:"shoot",player:n})}}this.phase==="play"&&this.ball.owner&&(this.stats[this.ball.owner.team].possession+=t)}getControlled(t){const e=this.teamPlayers(t);return e[this.controlledIdx[t]]??e[0]}applyInput(t,e,n){const i=t.fakeShotT>As-Xo;if(t.state==="kick"&&i&&this.ball.owner===t&&e.skillPressed){const l=t.state,c=t.dribbleCd;t.setState("idle"),t.dribbleCd=0;const h=t.stamina;this.doDribble(t,e.dirX,e.dirZ,e.dash)?(t.stamina=h+Fr*.5,t.fakeShotT=0):(t.setState(l),t.dribbleCd=c);return}if(t.busy||t.state==="fallen")return;const r=this.ball.owner===t;if(!r&&t.shootChargeT>=0&&(t.shootChargeT=-1,t.shootAimZ=0),t.shieldActive=r&&e.tactic&&t.onGround,t.shieldActive&&this.gainEnergy(t.team,ld*n),!r&&e.dashPressed){const l=t.team;if(this.time-this.lastLossT[l]<cd&&this.dashTapT[l]>0&&this.sprintBackCd[l]<=0){this.sprintBackCd[l]=hd,this.dashTapT[l]=0;const h=-this.attackDir(l);t.setState("dash"),t.dashT=Bn,t.dashCd=Bn+ir,t.vx=h*Rn*t.def.speed,t.vz=0,t.face(h,0);return}this.dashTapT[l]=Ko}if(t.isKeeper&&!r){this.applyKeeperInput(t,e,n);return}if(r&&e.skillPressed&&(t.state==="idle"||t.state==="run")){const l=t.fakeShotT>As-Xo;let c="auto";const h=Math.hypot(e.dirX,e.dirZ)>=.2;if(t.trickDoubleT<=0?t.trickDoubleT=Ko:(t.trickDoubleT=0,c="rainbow"),c==="auto"&&e.jump&&(c="elastico"),c==="auto"&&!h&&t.state==="idle"&&(c="croqueta"),l){const u=t.dribbleCd;t.dribbleCd=0;const f=t.stamina;this.doDribble(t,e.dirX,e.dirZ,e.dash,c)?(t.stamina=f+Fr*.5,t.chipRequestT=0):(t.dribbleCd=u,t.dribbleCd<=0&&this.ball.owner===t&&(t.chipRequestT=Yo))}else t.dribbleCd<=0&&(c!=="rainbow"&&(t.chipRequestT=Yo),this.doDribble(t,e.dirX,e.dirZ,e.dash,c)&&(t.chipRequestT=0))}const o=r&&t.onGround&&t.shootChargeT>=0;if(t.state!=="kick"){const l=t.moveSpeed()*this.playerSpeedScale(),c=t.shieldActive?od:1,h=o?l*Xh*c:l*c;e.dirX!==0||e.dirZ!==0?(t.vx=e.dirX*h,t.vz=e.dirZ*h,t.face(e.dirX,e.dirZ),t.state==="idle"&&t.setState("run")):t.onGround&&t.state!=="dash"&&(t.vx=0,t.vz=0,t.state==="run"&&!o&&t.setState("idle"))}if(!o&&e.dashPressed&&t.dashCd<=0&&t.onGround&&t.consumeStamina(mr)&&(t.setState("dash"),t.dashT=Bn,t.dashCd=Bn+ir,t.vx=t.faceX*Rn*t.def.speed,t.vz=t.faceZ*Rn*t.def.speed),!o&&e.jumpPressed&&t.onGround&&(t.consumeStamina(2),t.vy=fr,t.state==="dash"?(t.setState("headbutt"),t.vy=fr*.9):t.setState("jump"),this.emit({type:"jump",player:t})),r)if(t.isKeeper&&e.passPressed&&!e.shoot)this.doKeeperThrow(t);else{if(!t.onGround)e.shootPressed&&this.doShoot(t,e),e.passPressed&&this.doPass(t);else if(e.shoot){if(t.shootChargeT<0&&t.state!=="kick"){t.shootChargeT=0,t.vx*=.35,t.vz*=.35;const c=Math.hypot(e.dirX,e.dirZ);c>.25?(t.shootAimX=e.dirX/c,t.shootAimZ=e.dirZ/c):(t.shootAimX=0,t.shootAimZ=0)}if(t.shootChargeT>=0){t.shootChargeT=Math.min(pr,t.shootChargeT+n);const c=Math.hypot(e.dirX,e.dirZ);c>.25&&(t.shootAimX=e.dirX/c,t.shootAimZ=e.dirZ/c)}}else if(t.shootChargeT>=0){const c=t.shootChargeT,h=t.shootAimX,u=t.shootAimZ,f=t.chipRequestT>0,d=e.dash;t.shootChargeT=-1,t.shootAimX=0,t.shootAimZ=0,t.chipRequestT=0,c<Ec&&!f?this.doFakeShot(t):this.doShoot(t,e,c/pr,u,f,d,h)}!(t.isKeeper&&e.passPressed)&&e.passPressed&&!e.shoot&&this.doPass(t)}else{const l=!!this.ball.owner&&this.ball.owner.team===t.team;e.passPressed&&(l?this.requestPass(t,e.dirX,e.dirZ):t.onGround&&this.doSlideTackle(t)),e.shootPressed&&!l&&this.tryKickLooseBall(t)}}setCelebration(t){const e=t.celebrateStyle;t.setState(e===0?"celebrateSlide":e===1?"celebrateFly":e===2?"celebrateCradle":"celebrate")}requestPass(t,e,n){t.passCallT=Yh;const i=Math.hypot(e,n);i>.25?(t.passCallDirX=e/i,t.passCallDirZ=n/i):(t.passCallDirX=0,t.passCallDirZ=0),this.emit({type:"callForPass",player:t,x:t.x,z:t.z})}applyKeeperInput(t,e,n){const i=t.keeperDiveChargeT>=0;if(!i){if(t.state!=="kick"&&t.state!=="dive"){const r=t.moveSpeed()*this.playerSpeedScale();e.dirX!==0||e.dirZ!==0?(t.vx=e.dirX*r,t.vz=e.dirZ*r,t.face(e.dirX,e.dirZ),t.state==="idle"&&t.setState("run")):t.onGround&&t.state!=="dash"&&(t.vx=0,t.vz=0,t.state==="run"&&t.setState("idle"))}if(e.dashPressed&&t.dashCd<=0&&t.onGround&&t.consumeStamina(mr)&&(t.setState("dash"),t.dashT=Bn,t.dashCd=Bn+ir,t.vx=t.faceX*Rn*t.def.speed,t.vz=t.faceZ*Rn*t.def.speed),e.passPressed&&t.kickCd<=0&&t.onGround){this.doSlideTackle(t);return}e.shootPressed&&t.kickCd<=0&&this.tryKickLooseBall(t)}if(e.jump&&!i&&t.onGround)t.keeperDiveChargeT=0,t.vx*=.2,t.vz*=.2;else if(e.jump&&i)t.keeperDiveChargeT=Math.min($o,t.keeperDiveChargeT+n);else if(!e.jump&&i){const r=t.keeperDiveChargeT;if(t.keeperDiveChargeT=-1,r>=Kh)this.doKeeperPunch(t,e.dirX,e.dirZ);else{const a=ee(r/$o,.15,1);this.doKeeperDive(t,e.dirX,e.dirZ,a)}}}doKeeperDive(t,e,n,i){if(t.kickCd>0||!t.isKeeper)return;t.setState("dive"),t.kickCd=Tc+.15,t.divePower=ee(i,0,1);const r=Math.hypot(e,n);if(r>.15)t.vx=e/r*(9+t.divePower*7),t.vz=n/r*(10+t.divePower*8),t.face(e/r,n/r);else{const a=Math.random()<.5?-1:1;t.vx=0,t.vz=a*(10+t.divePower*8)}t.vy=2.6+t.divePower*3.2,this.emit({type:"jump",player:t})}doKeeperPunch(t,e,n){if(t.kickCd>0)return;t.setState("kick"),t.kickCd=.35,t.divePower=0;const i=this.ball,r=Math.hypot(e,n)>.2?Math.hypot(e,n):1,a=(Math.abs(e)>.2?e:this.attackDir(t.team))/r,o=(Math.abs(n)>.2?n:-t.z*.05)/r,l=Math.hypot(a,o)||1,c=Math.hypot(i.x-t.x,i.z-t.z);!i.owner&&c<3.2&&i.y<3.4&&(i.kick(a/l*on*1.25,6.5,o/l*on*1.25,t),i.lastTeam=t.team,this.emit({type:"kick",player:t}))}doKeeperThrow(t){if(t.kickCd>0||this.ball.owner!==t)return;const e=this.findBestPassTarget(t);if(t.setState("kick"),t.kickCd=.25,!e){const o=this.attackDir(t.team);this.ball.kick(o*li*1.1,.8,(Math.random()-.5)*6,t),this.ball.lastTeam=t.team,this.emit({type:"kick",player:t});return}const n=e.x-t.x,i=e.z-t.z,r=Math.hypot(n,i)||1,a=li*1.1;this.ball.kick(n/r*a,.8,i/r*a,t),this.intendedReceiver=e,this.gainEnergy(t.team,Zo),this.emit({type:"pass",player:t})}doFakeShot(t){this.ball.owner!==t||t.busy||(t.fakeShotT=As,t.setState("kick"),t.kickCd=As,this.emit({type:"fakeShot",player:t,x:t.x,z:t.z,team:t.team}))}nearestOpponentDist(t){let e=1/0;for(const n of this.teamPlayers(1-t.team)){if(n.busy)continue;const i=Math.hypot(n.x-t.x,n.z-t.z);i<e&&(e=i)}return e}doDribble(t,e,n,i=!1,r="auto"){if(this.ball.owner!==t||!t.onGround||t.dribbleCd>0||t.state!=="idle"&&t.state!=="run")return!1;let a=e,o=n;const l=Math.hypot(a,o)>=.2;if(!l&&r==="auto"){let f=null,d=1/0;for(const g of this.teamPlayers(1-t.team)){const x=Math.hypot(g.x-t.x,g.z-t.z);!g.busy&&x<d&&(d=x,f=g)}if(f){const g=Math.sign((f.x-t.x)*-t.faceZ+(f.z-t.z)*t.faceX)||1;a=t.faceX*.55+t.faceZ*g,o=t.faceZ*.55-t.faceX}else a=t.faceX*.55+t.faceZ,o=t.faceZ*.55-t.faceX}const c=Math.hypot(a,o)||1;if(t.dribbleDirX=a/c,t.dribbleDirZ=o/c,!t.consumeStamina(Fr))return!1;t.trickType="none",t.trickFired=!1;let h=va,u=va+Wh;if(r==="rainbow"){t.trickType="rainbow",h=.5,u=.5+Cs;const f=this.ball;return f.owner=null,f.kick(t.dribbleDirX*xa*.62,Zh,t.dribbleDirZ*xa*.62,t),f.untouchable=jh,t.trickT=h,t.dribbleCd=u,t.dribbleStartThreat=this.nearestOpponentDist(t),t.setState("dribble"),this.emit({type:"dribble",player:t,x:t.x,z:t.z,trick:"rainbow"}),!0}if(r==="elastico"&&l){t.trickType="elastico",h=.45,u=.45+Cs;for(const f of this.teamPlayers(1-t.team)){if(f.busy||this.humans.includes(f.team)&&f===this.getControlled(f.team))continue;Math.hypot(f.x-t.x,f.z-t.z)<2.8&&f.stunned<=0&&(f.stunned=Jh)}}else if(r==="croqueta")t.trickType="croqueta",h=.3,u=Qh;else if(r==="auto"&&l){if(a/c*t.faceX+o/c*t.faceZ<-.6)t.trickType="roulette",h=di,u=di+Cs;else if(i){t.trickType="stepover",h=di,u=di+Cs;for(const d of this.teamPlayers(1-t.team)){if(d.busy||this.humans.includes(d.team)&&d===this.getControlled(d.team))continue;Math.hypot(d.x-t.x,d.z-t.z)<2.5&&d.stunned<=0&&(d.stunned=.5)}}}return t.face(t.dribbleDirX,t.dribbleDirZ),t.dribbleCd=u,t.dribbleStartThreat=this.nearestOpponentDist(t),t.setState("dribble"),t.trickT=h,this.emit({type:"dribble",player:t,x:t.x,z:t.z,trick:t.trickType!=="none"?t.trickType:void 0}),!0}passTargetScore(t,e,n=2.4){if(e===t||e.state==="fallen"||e.stunned>0)return-1/0;const i=e.x-t.x,r=e.z-t.z,a=Math.hypot(i,r)||1;if(a<3||a>52)return-1/0;const o=i/a*t.faceX+r/a*t.faceZ,l=i*this.attackDir(t.team),c=li*Math.min(1.25,.65+a/30),h=Ar(t,e,this.teamPlayers(1-t.team),c,.18);let u=0;for(const g of this.teamPlayers(1-t.team)){const x=Math.hypot(g.x-e.x,g.z-e.z);x<7&&(u+=(7-x)/7)}const f=this.ruleset==="classic"&&this.isOffsideTarget(t.team,e)?20:0,d=e.isKeeper&&l>-4?4:0;return o*n+l*.055+h*5.2-u*2.4-a*.018-f-d}findBestPassTarget(t,e=2.4){let n=null,i=-1/0;for(const r of this.teamPlayers(t.team)){const a=this.passTargetScore(t,r,e);a>i&&(i=a,n=r)}return n}executePass(t,e,n=0,i=!1,r=0,a=0){if(t.kickCd>0||this.ball.owner!==t||e.team!==t.team)return!1;if(this.ruleset==="classic"&&this.isOffsideTarget(t.team,e))return this.stats[t.team].offsides++,this.beginRestart("freekick",1-t.team,e.x,e.z),this.emit({type:"offside",player:e,team:t.team,x:e.x,z:e.z}),this.emit({type:"whistle"}),!1;const o=e.x-t.x,l=e.z-t.z,c=Math.hypot(o,l)||1,h=li*Math.min(1.28,.66+c/29),u=c/h,f=ee(u*(i?.95:.62),.16,.72),d=this.attackDir(t.team),g=Math.hypot(r,a)>.01,x=Ht/2-1,m=ge/2-1;let p,v;g?(p=Math.max(-x,Math.min(x,e.x+r)),v=Math.max(-m,Math.min(m,e.z+a))):(p=e.x+e.vx*f+(i?d*3.5:0),v=e.z+e.vz*f),p+=(Math.random()-.5)*n,v+=(Math.random()-.5)*n;const _=Math.hypot(p-t.x,v-t.z)||1,S=c>25?7.6:c>16?3.6:1.45;return this.ball.kick((p-t.x)/_*h,S,(v-t.z)/_*h,t),this.intendedReceiver=e,t.setState("kick"),t.kickCd=.3,this.gainEnergy(t.team,Zo),this.emit({type:"pass",player:t}),!0}doPass(t){const e=this.findBestPassTarget(t);if(!e)return;const n=t.state==="dash";if(e&&this.executePass(t,e)&&n){const i=Math.hypot(this.ball.vx,this.ball.vz);if(i>1){const r=i*1.3/i;this.ball.vx*=r,this.ball.vz*=r,this.ball.vy=Math.min(this.ball.vy,1)}}}doShoot(t,e,n=0,i,r=!1,a=!1,o){if(t.kickCd>0||this.ball.owner!==t)return;const l=this.attackDir(t.team),c=o??0,h=i??e.dirZ,u=Math.hypot(c,h)>.25;let f,d;const g=l*Ht/2,x=re/2-Pe-.25,m=g-t.x,p=-t.z*.08,v=Math.hypot(m,p)||1,_=n>=Ac,S=_?.65:u?1:.6;if(u)if((c*m+h*p)/v>.35){const st=ee(h*x*S-t.z*.08,-x,x),ot=g-t.x,ft=st-t.z,pt=Math.hypot(ot,ft)||1;f=ot/pt,d=ft/pt}else f=c,d=h;else{const st=ee(h*x*S-t.z*.08,-x,x),ot=g-t.x,ft=st-t.z,pt=Math.hypot(ot,ft)||1;f=ot/pt,d=ft/pt}const P=!t.onGround&&t.y>.6,w=n>=.999,E=this.energyFull(t.team)&&(P||t.landingGraceT>0),L=this.energyFull(t.team)&&w;if(E||L){const O=Wi[t.def.special];this.energy[t.team]=0,t.landingGraceT=0;let st=f,ot=d;if((f*m+d*p)/v>.3){const pt=ee(d*30*.75,-x+t.z,x+t.z),ct=Math.hypot(m,pt-t.z)||1;st=m/ct,ot=(pt-t.z)/ct}this.ball.kick(st*vs*O.speed,Cc*O.lift,ot*vs*O.speed,t,O),this.lastSpecial={def:O,t:2.2},t.setState("kick"),t.kickCd=.3,this.emit({type:"special",special:O,player:t,x:t.x,z:t.z});return}if(r){const O=on*.72*t.def.power;this.ball.kick(f*O,9.5+Math.random()*1.5,d*O,t),this.intendedReceiver=null,t.setState("kick"),t.kickCd=.3,this.emit({type:"shoot",player:t});return}if(a){const O=on*1.22*t.def.power*(1+n*.18);this.ball.kick(f*O,.8,d*O,t,null,ee(h*4.5,-6,6)),this.intendedReceiver=null,t.setState("kick"),t.kickCd=.3,this.emit({type:"shoot",player:t});return}if(w){const O=on*t.def.power*qh;this.ball.kick(f*O,Math.min(2.2,$h),d*O,t,null,ee(h*2.2,-5,5)),this.intendedReceiver=null,t.setState("kick"),t.kickCd=.3,this.emit({type:"shoot",player:t});return}const T=t.state==="dash",y=1+n*.28,C=on*t.def.power*(T?1.18:1)*y,U=Math.hypot(g-t.x,t.z),z=t.isKeeper?7.4:1.2,G=T?5.5:8.2,q=P?4.2:ee(1.6+U*.045-n*.8,z,G),W=_?.5:1,Z=ee((h*3.2+t.vz*.12+(T?Math.sign(d||1)*1.2:0))*W,-6,6);this.ball.kick(f*C,q,d*C,t,null,Z),this.intendedReceiver=null,t.setState("kick"),t.kickCd=.3,this.emit({type:"shoot",player:t})}doSlideTackle(t){t.kickCd>0||!t.onGround||t.busy||!t.consumeStamina(td)||(t.setState("slide"),t.kickCd=Sc+.2,t.vx=t.faceX*Wo,t.vz=t.faceZ*Wo,this.emit({type:"tackle",player:t}))}tryKickLooseBall(t){if(t.kickCd>0)return;const e=Math.hypot(t.x-this.ball.x,t.z-this.ball.z),n=this.ball.y<=2.4||t.y>=this.ball.y-2.2;if(e<2.6&&n&&!this.ball.owner){const a=this.attackDir(t.team)*Ht/2-t.x,o=-t.z*.5,l=Math.hypot(a,o)||1;this.ball.kick(a/l*on*t.def.power,6,o/l*on*t.def.power,t),t.setState("kick"),t.kickCd=.3,this.emit({type:"shoot",player:t})}}clearFlights(){var t;this.training&&this.trainingDrill==="pass"&&((t=this.passFlight)==null?void 0:t.team)===this.humanTeam&&(this.drillStreak=0),this.passFlight=null,this.shotFlight=null,this.specialFlightTeam=-1,this.intendedReceiver=null}markShotOnTarget(){const t=this.shotFlight;!t||t.id!==this.ball.flightId||t.onTarget||(t.onTarget=!0,this.stats[t.team].onTarget++,this.training&&this.trainingDrill==="special"&&t.team===this.humanTeam&&this.specialFlightTeam===t.team&&!this.drillDone&&(this.drillProgress=Math.min(this.drillGoal,this.drillProgress+1),this.drillProgress>=this.drillGoal&&(this.drillDone=!0)))}recordPossession(t){const e=this.passFlight;(e==null?void 0:e.id)===this.ball.flightId&&(e.team===t.team?(this.stats[t.team].passCompleted++,this.combo[t.team]=Math.min(9,this.combo[t.team]+1),this.comboT[t.team]=id,this.training&&this.trainingDrill==="pass"&&e.team===this.humanTeam&&!this.drillDone&&(this.drillStreak++,this.drillStreak>=this.drillGoal&&(this.drillDone=!0,this.drillProgress=this.drillGoal))):this.training&&this.trainingDrill==="pass"&&e.team===this.humanTeam&&(this.drillStreak=0),e.team!==t.team&&(this.stats[t.team].interceptions++,this.combo[e.team]=0,this.comboT[e.team]=0),this.passFlight=null),this.intendedReceiver=null,this.shotFlight=null,this.specialFlightTeam=-1,this.training&&!this.drillDone&&(this.trainingDrill==="tackle"&&t.team===this.humanTeam?this.drillTackleRefeed():this.trainingDrill==="special"&&t.team===this.humanTeam&&this.drillSpecialReposition())}ballPickup(){const t=this.ball;if(t.owner||t.special)return;let e=1/0,n=null,i=null,r=!1;for(const o of this.players){const l=o.isKeeper&&o.state==="dive";if(o.busy&&!l||t.untouchable>0&&o===t.lastKicker)continue;const c=Math.hypot(o.x-t.x,o.z-t.z),h=o.isKeeper?l?2.6+o.divePower*1.2:2.6:1.7;c>h||t.y>2.4&&o.y<t.y-2.2||(c<e-.02?(e=c,n=o,i=o.team===this.pickupTieTeam?o:null,r=!1):Math.abs(c-e)<.02&&n&&(o.team!==n.team&&(r=!0),o.team===this.pickupTieTeam&&(i=o)))}const a=i??n;if(a){if(r&&(this.pickupTieTeam=1-a.team),a.isKeeper&&t.speed()>21){this.markShotOnTarget();const o=t.speed(),l=a.stamina/Vi,c=0,h=ee((t.y-1.2)/5,0,.2),u=a.state==="dive",f=u?1:ee(.42+(a.def.toughness-1)*.34+l*.14-ee((o-24)/55,0,.34)-c-h,.1,.84);if(Math.random()<f){const d=u?1:ee(.78-(o-21)*.025-c*1.5,.18,.78);if(Math.random()<d)t.owner=a,t.lastTeam=a.team,t.special=null,this.recordPossession(a),this.gainEnergy(a.team,jo*1.5);else{const g=this.shotFlight,x=Math.sign(a.z-t.z)||(Math.random()<.5?-1:1);t.kick(-Math.sign(t.vx||1)*(8+Math.random()*7),5.5,x*(10+Math.random()*8),a),g&&(g.id=t.flightId),t.lastTeam=a.team}this.emit({type:"save",player:a}),this.training&&this.trainingDrill==="keeper"&&a.team===this.humanTeam&&!this.drillDone&&(this.drillProgress=Math.min(this.drillGoal,this.drillProgress+1),this.drillProgress>=this.drillGoal&&(this.drillDone=!0),this.keeperDrillTimer=1.6)}return}if(t.speed()>20&&!a.isKeeper)t.vx*=.25,t.vz*=.25,t.vy=Math.min(t.vy,2),t.untouchable=.1,t.lastKicker=null,this.emit({type:"bounce"});else{const o=ee(.94+(a.def.toughness-1)*.18+a.stamina/Vi*.06-Math.max(0,t.speed()-11)*.025,.5,.99);if(!a.isKeeper&&t.speed()>11&&Math.random()>o){t.vx*=.34,t.vz*=.34,t.vy=Math.min(2.2,Math.abs(t.vy)*.3+.8),t.lastTeam=a.team,t.untouchable=.08,this.emit({type:"bounce"});return}t.owner=a,t.lastTeam=a.team,t.special=null,this.recordPossession(a)}}}ballSpecialHits(){var h;const t=this.ball,e=t.special;if(!e)return;this.specialHitFlight!==t.flightId&&(this.specialHitFlight=t.flightId,this.specialHitPlayers.clear());const n=t.prevX,i=t.prevY,r=t.prevZ,a=t.x-n,o=t.y-i,l=t.z-r,c=a*a+o*o+l*l;for(const u of this.players){if(u.team===((h=t.lastKicker)==null?void 0:h.team)||u===t.lastKicker||this.specialHitPlayers.has(u))continue;const f=u.y+1.15,d=c>0?Math.max(0,Math.min(1,((u.x-n)*a+(f-i)*o+(u.z-r)*l)/c)):0,g=n+a*d,x=i+o*d,m=r+l*d,p=u.isKeeper?2.8:1.8;if(!(Math.hypot(u.x-g,f-x,u.z-m)>p)){if(this.specialHitPlayers.add(u),u.isKeeper&&(this.markShotOnTarget(),Math.random()<.16*u.def.toughness)){const v=this.shotFlight;t.special=null,t.kick(-t.vx*.4,8,(Math.random()-.5)*14,u),v&&(v.id=t.flightId,this.shotFlight=null),this.emit({type:"save",player:u});return}e.knockdown&&(u.knockdown(Math.sign(t.vx)||1,Math.random()-.5,u.isKeeper?14:12),e.id==="freeze"&&(u.stunned=1.6),this.emit({type:"knockdown",player:u}))}}}playerCollisions(){for(let t=0;t<this.players.length;t++)for(let e=t+1;e<this.players.length;e++){const n=this.players[t],i=this.players[e],r=i.x-n.x,a=i.z-n.z,o=Math.hypot(r,a),l=lo*2;if(o>=l||o===0||Math.abs(n.y-i.y)>2.2)continue;const c=r/o,h=a/o,u=this.slideMissesAirborne(n,i),f=this.slideMissesAirborne(i,n);if(!u&&!f){const d=(l-o)/2;n.x-=c*d,n.z-=h*d,i.x+=c*d,i.z+=h*d}n.team!==i.team&&(u||this.resolveContact(n,i,c,h),f||this.resolveContact(i,n,-c,-h))}}slideMissesAirborne(t,e){const n=t.state==="slide"||t.state==="tackle",r=(e.state==="jump"||e.state==="headbutt")&&e.vy>0||e.y>bc;return n&&r}isKeeperInterference(t){const n=-this.attackDir(t.team)*Ht/2;return Math.abs(t.x-n)<oi+2&&Math.abs(t.z)<ur/2+2||this.ball.owner===t}callKeeperInterference(t,e,n,i){this.stats[t.team].fouls++,this.combo[t.team]=0,this.comboT[t.team]=0,e.knockdown(n,i,7),this.beginRestart("freekick",e.team,e.x,e.z),this.emit({type:"foul",player:t,team:t.team,x:e.x,z:e.z}),this.emit({type:"whistle"})}resolveContact(t,e,n,i){if(e.state==="fallen")return;const r=t.state==="slide"||t.state==="tackle",a=t.state==="dash";if(!r&&!a||r&&this.slideMissesAirborne(t,e)||a&&Math.abs(t.y-e.y)>Oh)return;if(e.isKeeper&&e.team!==t.team&&this.isKeeperInterference(e)){this.callKeeperInterference(t,e,n,i);return}const o=r?.9:.65,l=e.shieldActive&&this.ball.owner===e?.5:1;if(Math.random()<o*l/e.def.toughness){const c=e.state==="dribble";e.knockdown(n,i,r?11:13),this.emit({type:"collide",player:e}),this.ball.owner===e&&(this.ball.owner=null,this.lastLossT[e.team]=this.time,this.ball.kick(n*8+(Math.random()-.5)*6,5,i*8+(Math.random()-.5)*6,null),this.ball.lastTeam=t.team,this.clearFlights(),c&&this.emit({type:"dribbleFail",player:e,x:e.x,z:e.z,team:e.team}),r&&(this.stats[t.team].tackles++,this.training&&this.trainingDrill==="tackle"&&t.team===this.humanTeam&&!this.drillDone&&(this.drillProgress=Math.min(this.drillGoal,this.drillProgress+1),this.drillProgress>=this.drillGoal&&(this.drillDone=!0))),this.gainEnergy(t.team,jo))}}beginRestart(t,e,n,i){const r=Ht/2,a=ge/2;this.phase=t,this.phaseT=0,this.restartTeam=e,this.restartPos={x:ee(n,-r+.8,r-.8),z:ee(i,-a+.8,a-.8)},this.ball.special=null,this.clearFlights(),this.ball.reset(this.restartPos.x,this.restartPos.z);for(const o of this.players)o.vx*=.15,o.vz*=.15,o.shootChargeT=-1,o.shootAimZ=0}resolveGoalFrameCollision(t){var i;const e=this.ball,n=zh+Pe*.82;for(const r of[-1,1]){const a=r*t;if(!(r>0?e.prevX<a&&e.x>=a:e.prevX>a&&e.x<=a))continue;const l=(a-e.prevX)/(e.x-e.prevX||1),c=e.prevZ+(e.z-e.prevZ)*l,h=e.prevY+(e.y-e.prevY)*l,u=Math.abs(Math.abs(c)-re/2)<=n&&h<=Ie+n,f=Math.abs(h-Ie)<=n&&Math.abs(c)<=re/2+n;if(!u&&!f)continue;if(e.x=r*(t-Pe*.5),e.vx=-r*Math.max(5,Math.abs(e.vx)*.62),u&&(e.z=Math.sign(c||1)*(re/2-n-.03),e.vz=-Math.sign(c||1)*Math.max(3,Math.abs(e.vz)*.55+2)),f){const g=h<=Ie;e.y=Ie+(g?-n:n),e.vy=(g?-1:1)*Math.max(3,Math.abs(e.vy)*.58)}e.special=null;const d=(i=this.shotFlight)==null?void 0:i.team;return d!==void 0&&this.stats[d].woodwork++,this.emit({type:"post"}),!0}return!1}checkBounds(){var i;const t=this.ball,e=Ht/2,n=ge/2;if(t.owner&&(Math.abs(t.x)>e||Math.abs(t.z)>n)&&(t.lastTeam=t.owner.team,t.owner=null,t.vx=t.vy=t.vz=0,this.clearFlights()),!this.resolveGoalFrameCollision(e)){if(Math.abs(t.x)>e){const r=Math.abs(t.z)<re/2-Pe*.35,a=t.y<Ie-Pe*.35;if(r&&a){const l=this.attackDir(0)===Math.sign(t.x)?0:1;this.score[l]++,this.markShotOnTarget(),this.clearFlights(),t.lastTeam=l,t.vx*=.1,t.vz*=.1,t.special=null;const c=((i=t.lastKicker)==null?void 0:i.team)===l?t.lastKicker:this.teamPlayers(l).find(u=>!u.isKeeper&&u.state!=="fallen")??null;let h=0;for(const u of this.teamPlayers(l))u.state==="fallen"||u.stunned>0||(u.celebrateStyle=u===c?0:1+h++%3,u.vx=u.vz=0,this.setCelebration(u));if(c&&(c.vx=this.attackDir(l)*6),this.emit({type:"goal",team:l,player:c??void 0}),this.goldenGoal&&this.half>=3){this.phase="fulltime",this.emit({type:"whistle"});return}this.phase="goal",this.phaseT=0;return}const o=this.attackDir(0)===Math.sign(t.x)?1:0;t.lastTeam===o?this.beginRestart("corner",1-o,Math.sign(t.x)*(e-1),Math.sign(t.z||1)*(n-1)):this.beginRestart("goalkick",o,Math.sign(t.x)*(e-8),0),this.emit({type:"whistle"});return}Math.abs(t.z)>n&&(this.beginRestart("throwin",t.lastTeam===0?1:0,ee(t.x,-e+2,e-2),Math.sign(t.z)*(n-.8)),this.emit({type:"whistle"}))}}startShootout(){this.phase="shootout",this.phaseT=0,this.shootout={scores:[0,0],attempts:[0,0],shooterTeam:0,shooterIdx:1,stage:"setup",stageT:0,resultText:"",keeperTargetZ:0,aiDelay:0},this.emit({type:"whistle"})}shootoutSetup(){const t=this.shootout,e=Ht/2,n=e-11;this.ball.reset(n,0);const i=this.teamPlayers(t.shooterTeam)[t.shooterIdx],r=this.teamPlayers(1-t.shooterTeam)[0];for(const a of this.players)a.setState("idle"),a.vx=a.vz=0,a.y=0,a.stunned=0,a===i?(a.x=n-3,a.z=0,a.face(1,0)):a===r?(a.x=e-.8,a.z=0,a.face(-1,0)):(a.x=n-22,a.z=(a.team===0?-1:1)*(8+a.index*3));t.stage="aim",t.stageT=0,t.keeperTargetZ=0,t.aiDelay=.8+Math.random()*1.2}updateShootout(t,e,n,i){const r=this.shootout;if(!r)return;r.stageT+=t;const a=Ht/2,o=this.teamPlayers(r.shooterTeam)[r.shooterIdx],l=this.teamPlayers(1-r.shooterTeam)[0],c=this.humans.includes(r.shooterTeam),h=this.humans.includes(1-r.shooterTeam);switch(r.stage){case"setup":r.stageT>.8&&this.shootoutSetup();break;case"aim":{const u=h?i*(re/2-.6):Math.sin(r.stageT*2.2)*(re/2-1.5);if(l.z+=(u-l.z)*Math.min(1,t*8),l.face(-1,0),c?n:r.stageT>=r.aiDelay){const d=c?e*(re/2-.4):(Math.random()*2-1)*(re/2-.5)*(.55+.45*this.aiLevel/2),g=a-this.ball.x,x=d-this.ball.z,m=Math.hypot(g,x)||1,p=on*1.05*o.def.power;this.ball.kick(g/m*p,2.5+Math.random()*2.5,x/m*p,o),o.setState("kick"),r.stage="live",r.stageT=0,this.emit({type:"shoot",player:o})}break}case"live":{this.ball.update(t,0,0,this.groundFriction());const u=this.ball;if(u.x>a-2.2&&u.x<a+1){const f=2+l.def.toughness*.6;if(Math.abs(u.z-l.z)<f&&u.y<Ie*.9){u.kick(-14-Math.random()*8,5,(Math.random()-.5)*12,l),l.setState("dive"),r.stage="result",r.stageT=0,r.resultText="SAVE",r.attempts[r.shooterTeam]++,this.emit({type:"save",player:l});break}}if(u.x>a&&Math.abs(u.z)<re/2&&u.y<Ie){r.scores[r.shooterTeam]++,r.attempts[r.shooterTeam]++,r.stage="result",r.stageT=0,r.resultText="GOAL",this.stats[r.shooterTeam].onTarget++,this.emit({type:"goal",team:r.shooterTeam});break}(u.x>a+3||Math.abs(u.z)>re/2+4||r.stageT>3)&&(r.attempts[r.shooterTeam]++,r.stage="result",r.stageT=0,r.resultText="MISS",this.emit({type:"whistle"}));break}case"result":{if(r.stageT<1.6)break;const[u,f]=r.scores,[d,g]=r.attempts,x=Math.max(0,5-d),m=Math.max(0,5-g);if(d>=5&&g>=5&&d===g&&u!==f||u>f+m||f>u+x){this.shootoutWinner=u>f?0:1,this.phase="fulltime",this.emit({type:"whistle"});return}r.shooterTeam=1-r.shooterTeam,r.shooterTeam===0&&(r.shooterIdx=r.shooterIdx%5+1),r.stage="setup",r.stageT=0;break}}}drillLabel(){switch(this.trainingDrill){case"pass":return`连续传球 ${this.drillStreak}/${this.drillGoal}`;case"tackle":return`铲断抢球 ${this.drillProgress}/${this.drillGoal}`;case"special":return`必杀射正 ${this.drillProgress}/${this.drillGoal}`;case"keeper":return`扑救特训 ${this.drillProgress}/${this.drillGoal}`;case"solo":return"单人练习场";default:return"自由练习 · R 重置"}}drillFrac(){const t=this.trainingDrill==="pass"?this.drillStreak:this.drillProgress;return Math.min(1,t/this.drillGoal)}trainingReset(){this.drillProgress=0,this.drillStreak=0,this.drillDone=!1,this.drillCelebrated=!1,this.keeperDrillShots=0,this.keeperDrillTimer=0,this.setupTrainingDrill()}setupTrainingDrill(){this.drillGoal=this.trainingDrill==="pass"?6:this.trainingDrill==="tackle"?3:this.trainingDrill==="keeper"?5:this.trainingDrill==="special"?2:1;const t=this.getControlled(this.humanTeam);if(this.trainingDrill==="keeper"){const e=this.teamPlayers(this.humanTeam)[0];this.controlledIdx[this.humanTeam]=e.index,e.x=-this.attackDir(this.humanTeam)*(Ht/2-1.8),e.z=0,e.vx=e.vz=0,e.face(this.attackDir(this.humanTeam),0);const n=this.teamPlayers(1-this.humanTeam).filter(i=>!i.isKeeper);n.length&&(this.keeperDrillShooter=n[1]??n[0],this.keeperDrillShooter.x=-this.attackDir(this.humanTeam)*(Ht/2-13),this.keeperDrillShooter.z=(Math.random()-.5)*10,this.keeperDrillShooter.vx=this.keeperDrillShooter.vz=0,this.keeperDrillTimer=1.2);for(const i of this.players)i!==e&&i!==this.keeperDrillShooter&&(i.x=40+i.index*2,i.z=i.team===0?-30:30);this.ball.reset(this.keeperDrillShooter.x+this.attackDir(1-this.humanTeam)*2,this.keeperDrillShooter.z),this.ball.owner=null,this.ball.lastTeam=1-this.humanTeam,this.phase!=="play"&&(this.phase="play",this.phaseT=0);return}if(this.trainingDrill==="tackle"){const e=this.teamPlayers(1-this.humanTeam).filter(n=>!n.isKeeper);if(e.length){const n=e.reduce((i,r)=>Math.hypot(r.x-t.x,r.z-t.z)<Math.hypot(i.x-t.x,i.z-t.z)?r:i,e[0]);n.x=t.x+6,n.z=t.z+2,this.ball.reset(n.x+n.faceX*1.2,n.z+n.faceZ*1.2),this.ball.owner=n,this.ball.lastTeam=n.team,this.phase!=="play"&&(this.phase="play",this.phaseT=0)}return}if(this.trainingDrill==="special"){t.x=this.attackDir(this.humanTeam)*(Ht/2-22),t.z=0,t.vx=t.vz=0,t.face(this.attackDir(this.humanTeam),0),t.setState("idle"),this.ball.reset(t.x+t.faceX*1.4,t.z),this.ball.owner=t,this.ball.lastTeam=t.team,this.phase!=="play"&&(this.phase="play",this.phaseT=0);return}if(this.trainingDrill==="solo"){this.soloReset();return}this.ball.reset(t.x+t.faceX*1.5,t.z+t.faceZ*1.5),this.ball.owner=t,this.ball.lastTeam=t.team,this.phase!=="play"&&(this.phase="play",this.phaseT=0)}soloReset(t=!0){const e=this.getControlled(this.humanTeam);for(const n of this.players)n!==e&&(n.x=60+n.index*4+n.team*30,n.z=-40-n.index*3,n.vx=n.vz=0,n.setState("idle"));e.x=0,e.z=0,e.y=0,e.vx=e.vz=0,e.face(this.attackDir(this.humanTeam),0),e.setState("idle"),this.ball.reset(0,2.5),t&&(this.ball.owner=e),this.energy[0]=Gn,this.energy[1]=Gn,this.phase!=="play"&&(this.phase="play",this.phaseT=0)}drillTackleRefeed(){const t=this.ball.owner,e=this.teamPlayers(1-this.humanTeam).filter(i=>!i.isKeeper);if(!t||!e.length)return;const n=e.reduce((i,r)=>Math.hypot(r.x-t.x,r.z-t.z)<Math.hypot(i.x-t.x,i.z-t.z)?r:i,e[0]);n.x=t.x+6,n.z=t.z+2,this.ball.reset(n.x+n.faceX*1.2,n.z+n.faceZ*1.2),this.ball.owner=n,this.ball.lastTeam=n.team}drillSpecialReposition(){const t=this.getControlled(this.humanTeam);t.x=this.attackDir(this.humanTeam)*(Ht/2-22),t.z=0,t.vx=t.vz=0,t.face(this.attackDir(this.humanTeam),0),t.setState("idle"),this.ball.reset(t.x+t.faceX*1.4,t.z),this.ball.owner=t,this.ball.lastTeam=t.team,this.phase!=="play"&&(this.phase="play",this.phaseT=0)}doRestart(){const t=this.phase,e=this.restartTeam,n=this.teamPlayers(e).filter(v=>t==="goalkick"?v.isKeeper:!v.isKeeper);let i=n[0]??this.teamPlayers(e)[0],r=1/0;for(const v of n){const _=Math.hypot(v.x-this.restartPos.x,v.z-this.restartPos.z);_<r&&(r=_,i=v)}i.x=this.restartPos.x,i.z=this.restartPos.z,i.y=0,i.vx=i.vz=0,i.kickCd=0,i.setState("idle");const a=Math.hypot(i.x,i.z)||1;i.face(-i.x/a,-i.z/a);const o=this.teamPlayers(e).filter(v=>v!==i&&v.state!=="fallen");let l=null;if(t==="corner"){const v=this.attackDir(e)*Ht/2;l=o.filter(_=>!_.isKeeper).reduce((_,S)=>{if(!_)return S;const P=-Math.hypot(S.x-(v-this.attackDir(e)*9),S.z)+S.def.toughness*3,w=-Math.hypot(_.x-(v-this.attackDir(e)*9),_.z)+_.def.toughness*3;return P>w?S:_},null)}else t==="goalkick"?l=o.filter(v=>!v.isKeeper).reduce((v,_)=>!v||(_.x-i.x)*this.attackDir(e)>(v.x-i.x)*this.attackDir(e)?_:v,null):l=o.reduce((v,_)=>{const S=this.passTargetScore(i,_,t==="throwin"?.8:1.5);return!v||S>this.passTargetScore(i,v,t==="throwin"?.8:1.5)?_:v},null);if(this.phase="play",this.phaseT=0,this.ball.reset(this.restartPos.x,this.restartPos.z),this.ball.owner=i,this.ball.lastTeam=e,!l)return;const c=l.x-i.x,h=l.z-i.z,u=Math.hypot(c,h)||1,f=t==="corner"?.45:.3,d=l.x+l.vx*f,g=l.z+l.vz*f,x=Math.hypot(d-i.x,g-i.z)||1,m=t==="goalkick"?31:t==="corner"?27:li,p=t==="goalkick"?10.5:t==="corner"?11.5:t==="throwin"?7.2:u>22?7:2.8;this.ball.kick((d-i.x)/x*m,p,(g-i.z)/x*m,i),this.intendedReceiver=l,i.setState("kick"),i.kickCd=.3,this.emit({type:t==="goalkick"?"kick":"pass",player:i})}}const el=new WeakMap;function ho(s){let t=el.get(s);return t||(t={thinkCd:0,tx:s.x,tz:s.z,role:"home",markTarget:null,tackleCd:0},el.set(s,t)),t}const vd=[{think:1.16,speed:.93,tackleCd:3.8,shootErr:4.1,passErr:3,supportDist:16,predict:.2,reaction:.42,risk:.35},{think:.65,speed:.98,tackleCd:2.7,shootErr:2.2,passErr:1.5,supportDist:13,predict:.68,reaction:.24,risk:.58},{think:.32,speed:1,tackleCd:1.9,shootErr:.85,passErr:.45,supportDist:10.5,predict:1,reaction:.12,risk:.78}];function en(s,t){return vd[s.humans.includes(t)?1:s.aiLevel]}function _d(s,t){if(!(s.phase!=="play"&&s.phase!=="kickoff"))for(const e of s.players){const n=ho(e);n.thinkCd-=t,n.tackleCd-=t,!(gr(s,e)||e.busy)&&(e.isKeeper?yd(s,e):Md(s,e))}}function gr(s,t){return s.humans.includes(t.team)&&t.index===s.controlledIdx[t.team]}function Cn(s,t,e,n,i=1){const r=e-t.x,a=n-t.z,o=Math.hypot(r,a);if(o<.6)return t.vx*=.8,t.vz*=.8,t.state==="run"&&o<.3&&t.setState("idle"),!0;const l=t.moveSpeed()*i*en(s,t.team).speed*s.playerSpeedScale();return t.vx=r/o*l,t.vz=a/o*l,t.face(r,a),t.state==="idle"&&t.setState("run"),!1}function yd(s,t,e){const n=s.attackDir(t.team),i=-n*(Ht/2-1.6),r=s.ball,a=en(s,t.team),o=Math.abs(r.x- -n*Ht/2)<oi&&Math.abs(r.z)<ur/2+4;let l=i;o&&!r.owner&&(l=i+n*Math.min(6.5,Math.abs(r.x-i)*.42));let c=Math.max(-11/2-.6,Math.min(re/2+.6,r.z*.68)),h=1/0,u=r.y;const f=-n*Ht/2;if(!r.owner&&Math.abs(r.vx)>1&&(f-r.x)/r.vx>0&&(h=(f-r.x)/r.vx,h<2.4)){const p=co(r,h);c=Math.max(-11/2+.2,Math.min(re/2-.2,p.z)),u=r.y+r.vy*h+xs*h*h*.5,l=i}const d=r.owner;if(d&&d.team!==t.team&&d.fakeShotT>0&&a.predict>0&&Math.random()<.6){const p=(Math.random()<.5?1:-1)*re/2*.8;c=Math.max(-11/2-.5,Math.min(re/2+.5,p))}Cn(s,t,l,c);const g=Math.hypot(t.x-r.x,t.z-r.z),x=h<.56+a.reaction*.35,m=Math.abs(c-t.z);if(x&&m>1.35&&t.onGround&&t.stamina>8){const p=ee(Math.abs(c-t.z)/6,.3,1);s.doKeeperDive(t,0,Math.sign(c-t.z),p)}else!r.owner&&g<4.8&&(r.y>1.55||u>1.7)&&t.onGround&&r.speed()>11&&(t.vy=fr*.9,t.setState("jump"));if(r.owner===t&&t.kickCd<=0){const p=s.teamPlayers(t.team).filter(S=>!S.isKeeper);let v=p[0],_=-1/0;for(const S of p){const P=(S.x-t.x)*n,w=Ar(t,S,s.teamPlayers(1-t.team),30,a.reaction),E=P*.12+w*7-Math.abs(S.z)*.02;E>_&&(_=E,v=S)}v&&s.executePass(t,v,a.passErr*.65,!0)}}function Md(s,t,e){const n=s.ball;if(n.owner===t){wd(s,t);return}const i=ho(t),r=n.owner?n.owner.team===t.team:!1,a=!n.owner;switch(i.thinkCd<=0&&(i.thinkCd=en(s,t.team).think*(.8+Math.random()*.4),r?Sd(s,t,i):a?bd(s,t,i):Td(s,t,i)),i.role){case"chase":{const o=_a(n,t,en(s,t.team).reaction,2.8);Cn(s,t,o.x,o.z,o.reachable?1:.94),nl(s,t,i);break}case"press":{const o=n.owner;o?(Cn(s,t,o.x+o.vx*.15,o.z+o.vz*.15),nl(s,t,i)):i.thinkCd=0;break}case"cut":{const o=n.owner;if(o){const l=-s.attackDir(t.team)*Ht/2;o.state==="dribble"&&en(s,t.team).predict>0?Cn(s,t,o.x+o.dribbleDirX*3,o.z+o.dribbleDirZ*3):Cn(s,t,(o.x+l)/2,o.z*.6)}else i.thinkCd=0;break}case"mark":{const o=i.markTarget;if(o&&o.state!=="fallen"){if(en(s,t.team).predict>0){const c=n.owner;if(c){Cn(s,t,(c.x+o.x)/2,(c.z+o.z)/2);break}}const l=-s.attackDir(t.team)*Ht/2;Cn(s,t,o.x+Math.sign(l-o.x)*2,o.z)}else i.thinkCd=0;break}default:Cn(s,t,i.tx,i.tz,i.role==="home"?.85:1);break}}function nl(s,t,e){const i=s.ball.owner;if(!i||i.team===t.team||(i.state==="jump"||i.state==="headbutt")&&i.vy>0||i.y>bc)return;const a=Math.hypot(t.x-i.x,t.z-i.z),o=en(s,t.team),l=o.predict;let c=.48+o.risk*.28,h=3;if(l>0&&i.state==="dribble"&&i.stateT<wc&&(c=.58+l*.28,h=3.6),s.ruleset==="classic"){const u=t.x-i.x,f=t.z-i.z,d=Math.hypot(u,f)||1;u/d*i.faceX+f/d*i.faceZ<-.25&&(c*=.28+(1-o.predict)*.2)}a<h&&t.onGround&&t.kickCd<=0&&e.tackleCd<=0&&Math.random()<c&&(e.tackleCd=o.tackleCd,t.face(i.x-t.x,i.z-t.z),s.doSlideTackle(t))}function uo(s,t){const e=s.ball,n=en(s,t.team).reaction,i=_a(e,t,n,2.8),r=i.time+Math.max(0,i.error)/Math.max(3,t.moveSpeed());let a=0;for(const o of s.teamPlayers(t.team)){if(o===t||o.isKeeper||o.busy||gr(s,o))continue;const l=_a(e,o,n,2.8);l.time+Math.max(0,l.error)/Math.max(3,o.moveSpeed())<r-.01&&a++}return a}function Sd(s,t,e){const n=s.ball,i=n.owner,r=s.attackDir(t.team),a=en(s,t.team),o=s.tactics[t.team];if(uo(s,t)===0&&Math.hypot(t.x-n.x,t.z-n.z)>26){e.role="support",e.tx=i.x-r*6,e.tz=i.z+(t.z>i.z?8:-8);return}e.role="support";const c=r*(o==="attack"?25:o==="defend"?10:18);let h=t.homeX+c,u=t.homeZ;(t.homeX-i.x)*r>0?(h=i.x+r*a.supportDist*(o==="attack"?1.65:o==="defend"?1.05:1.4),u=t.homeZ*.5+i.z*.3+(Math.random()-.5)*8):(h=i.x-r*a.supportDist*.7,u=i.z+(t.homeZ>i.z?a.supportDist:-a.supportDist)*.8);for(const x of s.teamPlayers(t.team)){if(x===t||x.isKeeper)continue;const m=Math.hypot(x.x-h,x.z-u);m<7&&(u+=(u>x.z?1:-1)*(7-m))}const d=Ht/2-3,g=ge/2-2;e.tx=Math.max(-d,Math.min(d,h)),e.tz=Math.max(-g,Math.min(g,u))}function bd(s,t,e){if(uo(s,t)<=1){e.role="chase";return}const i=s.ball;e.role="support",e.tx=t.homeX*.5+(i.x+i.vx*.5)*.5,e.tz=t.homeZ*.5+(i.z+i.vz*.5)*.5}function Td(s,t,e){const n=s.ball,i=n.owner,r=s.attackDir(t.team),a=uo(s,t),o=s.tactics[t.team];if(a===0){e.role="press";return}if(a===1&&o!=="defend"){e.role="cut";return}const l=s.teamPlayers(1-t.team).filter(u=>!u.isKeeper&&u!==i);let c=null,h=1/0;for(const u of l){const f=Math.hypot(u.x-t.x,u.z-t.z),d=(u.x-0)*r<0?0:12,g=(u.x-i.x)*r,x=g>0?-Math.min(8,g*.3):0;f+d+x<h&&(h=f+d+x,c=u)}if(c&&h<30)e.role="mark",e.markTarget=c;else{e.role="home";const u=-r*Ht/2;e.tx=(t.homeX+u)/2*.8+n.x*.2,e.tz=t.homeZ*.7+n.z*.3}}function wd(s,t){const e=s.ball,n=s.attackDir(t.team),i=n*Ht/2,r=Math.abs(i-t.x),a=en(s,t.team),o=ho(t);if(t.kickCd<=0&&!t.onGround&&t.y>1.1&&s.energyFull(t.team)){const p=Wi[t.def.special],v=i-t.x,_=-t.z*.5,S=Math.hypot(v,_)||1;s.energy[t.team]=0,e.kick(v/S*vs*p.speed,Cc*p.lift,_/S*vs*p.speed,t,p),s.lastSpecial={def:p,t:2.2},t.setState("kick"),t.kickCd=.3,s.emit({type:"special",special:p,player:t,x:t.x,z:t.z});return}let l=1/0,c=null;for(const p of s.teamPlayers(1-t.team)){if(p.busy)continue;const v=Math.hypot(p.x-t.x,p.z-t.z);v<l&&(l=v,c=p)}const h=s.teamPlayers(1-t.team)[0],u=pd(t,i,l,(h==null?void 0:h.z)??0),f=s.findBestPassTarget(t,.9);let d=0;if(f){const p=Math.hypot(f.x-t.x,f.z-t.z),v=li*Math.min(1.25,.65+p/30);d=Ar(t,f,s.teamPlayers(1-t.team),v,a.reaction)}if(o.thinkCd<=0&&t.kickCd<=0){if(o.thinkCd=a.think*(.72+Math.random()*.45),r<32&&s.energyFull(t.team)&&t.onGround&&u>.12){t.vy=fr,t.setState("jump"),s.emit({type:"jump",player:t});return}const p=.43-a.risk*.2;if(u>=p||u>.16&&Math.random()<u*(.3+a.risk*.52)){ya(s,t);return}const v=h?Math.abs(h.x-i)>5.2:!1;if(r<38&&v&&l>7&&Math.random()<.2+a.predict*.18){ya(s,t,!0);return}if(f&&(l<6.2||d>.72)&&d>.26+(1-a.risk)*.18){il(s,t,f);return}const _=s.humans.includes(t.team)?1:s.aiLevel,S=[0,.22,.42][_];if(c&&l>=2.5&&l<5.5&&t.dribbleCd<=0&&Math.random()<S){const P=t.x-c.x,w=t.z-c.z;if(s.doDribble(t,n*.55+P,w))return}if(f&&l<5.5&&Math.random()<.58+a.predict*.25){il(s,t,f);return}if(l>9&&t.onGround&&t.dashCd<=0&&t.stamina>mr&&r>25&&Math.random()<.24+a.risk*.2){t.face(n,0),t.consumeStamina(mr),t.setState("dash"),t.dashT=Bn,t.dashCd=Bn+ir,t.vx=t.faceX*Rn*t.def.speed,t.vz=t.faceZ*Rn*t.def.speed;return}}let g=t.z*.82;if(c&&l<7){const p=t.z-c.z;g=t.z+(p===0?Math.random()<.5?1:-1:Math.sign(p))*7}const x=ge/2-3,m=i*(s.tactics[t.team]==="attack"?.965:s.tactics[t.team]==="defend"?.88:.94);Cn(s,t,m,Math.max(-x,Math.min(x,g)))}function ya(s,t,e=!1){if(t.kickCd>0||s.ball.owner!==t)return;const n=en(s,t.team),i=s.attackDir(t.team)*Ht/2,r=s.teamPlayers(1-t.team)[0],a=md(t.z,(r==null?void 0:r.z)??0,n.shootErr),o=i-t.x,l=a-t.z,c=Math.hypot(o,l)||1,h=on*t.def.power,u=e?10.5+Math.random()*1.5:Math.max(3.2,Math.min(7.8,3.1+c*.105+(Math.random()-.5)*n.shootErr*.18)),f=Math.max(-7,Math.min(7,(a-((r==null?void 0:r.z)??0))*.7));s.ball.kick(o/c*h,u,l/c*h,t,null,f),t.setState("kick"),t.kickCd=.3,s.emit({type:"shoot",player:t})}function il(s,t,e=null){if(t.kickCd>0||s.ball.owner!==t)return;const n=en(s,t.team),i=s.attackDir(t.team),r=s.teamPlayers(t.team).filter(f=>f!==t&&f.state!=="fallen"&&!(s.ruleset==="classic"&&s.isOffsideTarget(t.team,f)));let a=null,o=-1/0;for(const f of r){const d=(f.x-t.x)*i,g=Math.hypot(f.x-t.x,f.z-t.z);if(g<5||g>48)continue;const x=li*Math.min(1.25,.65+g/30),m=Ar(t,f,s.teamPlayers(1-t.team),x,n.reaction);let p=s.passTargetScore(t,f,.75)+m*4+d*.025;f===e&&(p+=1.6),gr(s,f)&&f.passCallT>0&&f.state!=="fallen"&&m>.42&&(p+=2.5),p>o&&(o=p,a=f)}if(!a){ya(s,t);return}const c=(a.x-t.x)*i>11&&s.tactics[t.team]!=="defend"&&n.predict>.45;let h=0,u=0;gr(s,a)&&a.passCallT>0&&Math.hypot(a.passCallDirX,a.passCallDirZ)>.1&&(h=a.passCallDirX*qo,u=a.passCallDirZ*qo),s.executePass(t,a,n.passErr,c,h,u)}/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const fo="166",Ed=0,sl=1,Ad=2,Pc=1,Lc=2,An=3,Xn=0,Ue=1,Ye=2,Vn=0,Xi=1,Ma=2,rl=3,al=4,Cd=5,ci=100,Rd=101,Pd=102,Ld=103,Dd=104,Id=200,kd=201,Ud=202,Nd=203,Sa=204,ba=205,zd=206,Fd=207,Od=208,Bd=209,Gd=210,Hd=211,Vd=212,Wd=213,Xd=214,qd=0,$d=1,Yd=2,xr=3,Kd=4,Zd=5,jd=6,Jd=7,po=0,Qd=1,tu=2,Wn=0,eu=1,nu=2,iu=3,Dc=4,su=5,ru=6,au=7,Ic=300,Yi=301,Ki=302,Ta=303,wa=304,Cr=306,ui=1e3,fi=1001,Ea=1002,ke=1003,ou=1004,Ps=1005,tn=1006,Or=1007,pi=1008,Ln=1009,kc=1010,Uc=1011,_s=1012,mo=1013,xi=1014,xn=1015,Ss=1016,go=1017,xo=1018,Zi=1020,Nc=35902,zc=1021,Fc=1022,hn=1023,Oc=1024,Bc=1025,qi=1026,ji=1027,vo=1028,_o=1029,Gc=1030,yo=1031,Mo=1033,sr=33776,rr=33777,ar=33778,or=33779,Aa=35840,Ca=35841,Ra=35842,Pa=35843,La=36196,Da=37492,Ia=37496,ka=37808,Ua=37809,Na=37810,za=37811,Fa=37812,Oa=37813,Ba=37814,Ga=37815,Ha=37816,Va=37817,Wa=37818,Xa=37819,qa=37820,$a=37821,lr=36492,Ya=36494,Ka=36495,Hc=36283,Za=36284,ja=36285,Ja=36286,lu=3200,cu=3201,So=0,hu=1,Hn="",cn="srgb",$n="srgb-linear",bo="display-p3",Rr="display-p3-linear",vr="linear",se="srgb",_r="rec709",yr="p3",bi=7680,ol=519,du=512,uu=513,fu=514,Vc=515,pu=516,mu=517,gu=518,xu=519,ll=35044,cl="300 es",Pn=2e3,Mr=2001;class Qi{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const i=this._listeners[t];if(i!==void 0){const r=i.indexOf(e);r!==-1&&i.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const i=n.slice(0);for(let r=0,a=i.length;r<a;r++)i[r].call(this,t);t.target=null}}}const Ee=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Br=Math.PI/180,Qa=180/Math.PI;function bs(){const s=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ee[s&255]+Ee[s>>8&255]+Ee[s>>16&255]+Ee[s>>24&255]+"-"+Ee[t&255]+Ee[t>>8&255]+"-"+Ee[t>>16&15|64]+Ee[t>>24&255]+"-"+Ee[e&63|128]+Ee[e>>8&255]+"-"+Ee[e>>16&255]+Ee[e>>24&255]+Ee[n&255]+Ee[n>>8&255]+Ee[n>>16&255]+Ee[n>>24&255]).toLowerCase()}function we(s,t,e){return Math.max(t,Math.min(e,s))}function vu(s,t){return(s%t+t)%t}function Gr(s,t,e){return(1-e)*s+e*t}function is(s,t){switch(t.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function Fe(s,t){switch(t.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}class gt{constructor(t=0,e=0){gt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(we(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),i=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*i+t.x,this.y=r*i+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ot{constructor(t,e,n,i,r,a,o,l,c){Ot.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,r,a,o,l,c)}set(t,e,n,i,r,a,o,l,c){const h=this.elements;return h[0]=t,h[1]=i,h[2]=o,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],f=n[2],d=n[5],g=n[8],x=i[0],m=i[3],p=i[6],v=i[1],_=i[4],S=i[7],P=i[2],w=i[5],E=i[8];return r[0]=a*x+o*v+l*P,r[3]=a*m+o*_+l*w,r[6]=a*p+o*S+l*E,r[1]=c*x+h*v+u*P,r[4]=c*m+h*_+u*w,r[7]=c*p+h*S+u*E,r[2]=f*x+d*v+g*P,r[5]=f*m+d*_+g*w,r[8]=f*p+d*S+g*E,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*r*h+n*o*l+i*r*c-i*a*l}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],u=h*a-o*c,f=o*l-h*r,d=c*r-a*l,g=e*u+n*f+i*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/g;return t[0]=u*x,t[1]=(i*c-h*n)*x,t[2]=(o*n-i*a)*x,t[3]=f*x,t[4]=(h*e-i*l)*x,t[5]=(i*r-o*e)*x,t[6]=d*x,t[7]=(n*l-c*e)*x,t[8]=(a*e-n*r)*x,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,r,a,o){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-i*c,i*l,-i*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(Hr.makeScale(t,e)),this}rotate(t){return this.premultiply(Hr.makeRotation(-t)),this}translate(t,e){return this.premultiply(Hr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Hr=new Ot;function Wc(s){for(let t=s.length-1;t>=0;--t)if(s[t]>=65535)return!0;return!1}function Sr(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function _u(){const s=Sr("canvas");return s.style.display="block",s}const hl={};function Xc(s){s in hl||(hl[s]=!0,console.warn(s))}function yu(s,t,e){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(t,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}const dl=new Ot().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),ul=new Ot().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Ls={[$n]:{transfer:vr,primaries:_r,toReference:s=>s,fromReference:s=>s},[cn]:{transfer:se,primaries:_r,toReference:s=>s.convertSRGBToLinear(),fromReference:s=>s.convertLinearToSRGB()},[Rr]:{transfer:vr,primaries:yr,toReference:s=>s.applyMatrix3(ul),fromReference:s=>s.applyMatrix3(dl)},[bo]:{transfer:se,primaries:yr,toReference:s=>s.convertSRGBToLinear().applyMatrix3(ul),fromReference:s=>s.applyMatrix3(dl).convertLinearToSRGB()}},Mu=new Set([$n,Rr]),Qt={enabled:!0,_workingColorSpace:$n,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(s){if(!Mu.has(s))throw new Error(`Unsupported working color space, "${s}".`);this._workingColorSpace=s},convert:function(s,t,e){if(this.enabled===!1||t===e||!t||!e)return s;const n=Ls[t].toReference,i=Ls[e].fromReference;return i(n(s))},fromWorkingColorSpace:function(s,t){return this.convert(s,this._workingColorSpace,t)},toWorkingColorSpace:function(s,t){return this.convert(s,t,this._workingColorSpace)},getPrimaries:function(s){return Ls[s].primaries},getTransfer:function(s){return s===Hn?vr:Ls[s].transfer}};function $i(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function Vr(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}let Ti;class Su{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Ti===void 0&&(Ti=Sr("canvas")),Ti.width=t.width,Ti.height=t.height;const n=Ti.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Ti}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Sr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const i=n.getImageData(0,0,t.width,t.height),r=i.data;for(let a=0;a<r.length;a++)r[a]=$i(r[a]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor($i(e[n]/255)*255):e[n]=$i(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let bu=0;class qc{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:bu++}),this.uuid=bs(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?r.push(Wr(i[a].image)):r.push(Wr(i[a]))}else r=Wr(i);n.url=r}return e||(t.images[this.uuid]=n),n}}function Wr(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?Su.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Tu=0;class Le extends Qi{constructor(t=Le.DEFAULT_IMAGE,e=Le.DEFAULT_MAPPING,n=fi,i=fi,r=tn,a=pi,o=hn,l=Ln,c=Le.DEFAULT_ANISOTROPY,h=Hn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Tu++}),this.uuid=bs(),this.name="",this.source=new qc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new gt(0,0),this.repeat=new gt(1,1),this.center=new gt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ot,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Ic)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case ui:t.x=t.x-Math.floor(t.x);break;case fi:t.x=t.x<0?0:1;break;case Ea:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case ui:t.y=t.y-Math.floor(t.y);break;case fi:t.y=t.y<0?0:1;break;case Ea:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Le.DEFAULT_IMAGE=null;Le.DEFAULT_MAPPING=Ic;Le.DEFAULT_ANISOTROPY=1;class ve{constructor(t=0,e=0,n=0,i=1){ve.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*i+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*i+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*i+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*i+a[15]*r,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,r;const l=t.elements,c=l[0],h=l[4],u=l[8],f=l[1],d=l[5],g=l[9],x=l[2],m=l[6],p=l[10];if(Math.abs(h-f)<.01&&Math.abs(u-x)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+x)<.1&&Math.abs(g+m)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const _=(c+1)/2,S=(d+1)/2,P=(p+1)/2,w=(h+f)/4,E=(u+x)/4,L=(g+m)/4;return _>S&&_>P?_<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(_),i=w/n,r=E/n):S>P?S<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(S),n=w/i,r=L/i):P<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(P),n=E/r,i=L/r),this.set(n,i,r,e),this}let v=Math.sqrt((m-g)*(m-g)+(u-x)*(u-x)+(f-h)*(f-h));return Math.abs(v)<.001&&(v=1),this.x=(m-g)/v,this.y=(u-x)/v,this.z=(f-h)/v,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class wu extends Qi{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ve(0,0,t,e),this.scissorTest=!1,this.viewport=new ve(0,0,t,e);const i={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:tn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new Le(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new qc(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class qn extends wu{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class $c extends Le{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=ke,this.minFilter=ke,this.wrapR=fi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Eu extends Le{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=ke,this.minFilter=ke,this.wrapR=fi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ts{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,r,a,o){let l=n[i+0],c=n[i+1],h=n[i+2],u=n[i+3];const f=r[a+0],d=r[a+1],g=r[a+2],x=r[a+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u;return}if(o===1){t[e+0]=f,t[e+1]=d,t[e+2]=g,t[e+3]=x;return}if(u!==x||l!==f||c!==d||h!==g){let m=1-o;const p=l*f+c*d+h*g+u*x,v=p>=0?1:-1,_=1-p*p;if(_>Number.EPSILON){const P=Math.sqrt(_),w=Math.atan2(P,p*v);m=Math.sin(m*w)/P,o=Math.sin(o*w)/P}const S=o*v;if(l=l*m+f*S,c=c*m+d*S,h=h*m+g*S,u=u*m+x*S,m===1-o){const P=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=P,c*=P,h*=P,u*=P}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,i,r,a){const o=n[i],l=n[i+1],c=n[i+2],h=n[i+3],u=r[a],f=r[a+1],d=r[a+2],g=r[a+3];return t[e]=o*g+h*u+l*d-c*f,t[e+1]=l*g+h*f+c*u-o*d,t[e+2]=c*g+h*d+o*f-l*u,t[e+3]=h*g-o*u-l*f-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,i=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(i/2),u=o(r/2),f=l(n/2),d=l(i/2),g=l(r/2);switch(a){case"XYZ":this._x=f*h*u+c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u-f*d*g;break;case"YXZ":this._x=f*h*u+c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u+f*d*g;break;case"ZXY":this._x=f*h*u-c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u-f*d*g;break;case"ZYX":this._x=f*h*u-c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u+f*d*g;break;case"YZX":this._x=f*h*u+c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u-f*d*g;break;case"XZY":this._x=f*h*u-c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u+f*d*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],i=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],u=e[10],f=n+o+u;if(f>0){const d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-l)*d,this._y=(r-c)*d,this._z=(a-i)*d}else if(n>o&&n>u){const d=2*Math.sqrt(1+n-o-u);this._w=(h-l)/d,this._x=.25*d,this._y=(i+a)/d,this._z=(r+c)/d}else if(o>u){const d=2*Math.sqrt(1+o-n-u);this._w=(r-c)/d,this._x=(i+a)/d,this._y=.25*d,this._z=(l+h)/d}else{const d=2*Math.sqrt(1+u-n-o);this._w=(a-i)/d,this._x=(r+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(we(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,i=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+i*c-r*l,this._y=i*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-i*o,this._w=a*h-n*o-i*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,i=this._y,r=this._z,a=this._w;let o=a*t._w+n*t._x+i*t._y+r*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=n,this._y=i,this._z=r,this;const l=1-o*o;if(l<=Number.EPSILON){const d=1-e;return this._w=d*a+e*this._w,this._x=d*n+e*this._x,this._y=d*i+e*this._y,this._z=d*r+e*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-e)*h)/c,f=Math.sin(e*h)/c;return this._w=a*u+this._w*f,this._x=n*u+this._x*f,this._y=i*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class D{constructor(t=0,e=0,n=0){D.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(fl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(fl.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,i=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*i,this.y=r[1]*e+r[4]*n+r[7]*i,this.z=r[2]*e+r[5]*n+r[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*i+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*i+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*i+r[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,i=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*i-o*n),h=2*(o*e-r*i),u=2*(r*n-a*e);return this.x=e+l*c+a*u-o*h,this.y=n+l*h+o*c-r*u,this.z=i+l*u+r*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,i=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*i,this.y=r[1]*e+r[5]*n+r[9]*i,this.z=r[2]*e+r[6]*n+r[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,i=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=i*l-r*o,this.y=r*a-n*l,this.z=n*o-i*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Xr.copy(this).projectOnVector(t),this.sub(Xr)}reflect(t){return this.sub(Xr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(we(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Xr=new D,fl=new Ts;class _i{constructor(t=new D(1/0,1/0,1/0),e=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(sn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(sn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=sn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,sn):sn.fromBufferAttribute(r,a),sn.applyMatrix4(t.matrixWorld),this.expandByPoint(sn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Ds.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ds.copy(n.boundingBox)),Ds.applyMatrix4(t.matrixWorld),this.union(Ds)}const i=t.children;for(let r=0,a=i.length;r<a;r++)this.expandByObject(i[r],e);return this}containsPoint(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)}intersectsSphere(t){return this.clampPoint(t.center,sn),sn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(ss),Is.subVectors(this.max,ss),wi.subVectors(t.a,ss),Ei.subVectors(t.b,ss),Ai.subVectors(t.c,ss),kn.subVectors(Ei,wi),Un.subVectors(Ai,Ei),Kn.subVectors(wi,Ai);let e=[0,-kn.z,kn.y,0,-Un.z,Un.y,0,-Kn.z,Kn.y,kn.z,0,-kn.x,Un.z,0,-Un.x,Kn.z,0,-Kn.x,-kn.y,kn.x,0,-Un.y,Un.x,0,-Kn.y,Kn.x,0];return!qr(e,wi,Ei,Ai,Is)||(e=[1,0,0,0,1,0,0,0,1],!qr(e,wi,Ei,Ai,Is))?!1:(ks.crossVectors(kn,Un),e=[ks.x,ks.y,ks.z],qr(e,wi,Ei,Ai,Is))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,sn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(sn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Sn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Sn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Sn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Sn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Sn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Sn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Sn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Sn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Sn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Sn=[new D,new D,new D,new D,new D,new D,new D,new D],sn=new D,Ds=new _i,wi=new D,Ei=new D,Ai=new D,kn=new D,Un=new D,Kn=new D,ss=new D,Is=new D,ks=new D,Zn=new D;function qr(s,t,e,n,i){for(let r=0,a=s.length-3;r<=a;r+=3){Zn.fromArray(s,r);const o=i.x*Math.abs(Zn.x)+i.y*Math.abs(Zn.y)+i.z*Math.abs(Zn.z),l=t.dot(Zn),c=e.dot(Zn),h=n.dot(Zn);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const Au=new _i,rs=new D,$r=new D;class ts{constructor(t=new D,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Au.setFromPoints(t).getCenter(n);let i=0;for(let r=0,a=t.length;r<a;r++)i=Math.max(i,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;rs.subVectors(t,this.center);const e=rs.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(rs,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):($r.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(rs.copy(t.center).add($r)),this.expandByPoint(rs.copy(t.center).sub($r))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const bn=new D,Yr=new D,Us=new D,Nn=new D,Kr=new D,Ns=new D,Zr=new D;class Yc{constructor(t=new D,e=new D(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,bn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=bn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(bn.copy(this.origin).addScaledVector(this.direction,e),bn.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){Yr.copy(t).add(e).multiplyScalar(.5),Us.copy(e).sub(t).normalize(),Nn.copy(this.origin).sub(Yr);const r=t.distanceTo(e)*.5,a=-this.direction.dot(Us),o=Nn.dot(this.direction),l=-Nn.dot(Us),c=Nn.lengthSq(),h=Math.abs(1-a*a);let u,f,d,g;if(h>0)if(u=a*l-o,f=a*o-l,g=r*h,u>=0)if(f>=-g)if(f<=g){const x=1/h;u*=x,f*=x,d=u*(u+a*f+2*o)+f*(a*u+f+2*l)+c}else f=r,u=Math.max(0,-(a*f+o)),d=-u*u+f*(f+2*l)+c;else f=-r,u=Math.max(0,-(a*f+o)),d=-u*u+f*(f+2*l)+c;else f<=-g?(u=Math.max(0,-(-a*r+o)),f=u>0?-r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c):f<=g?(u=0,f=Math.min(Math.max(-r,-l),r),d=f*(f+2*l)+c):(u=Math.max(0,-(a*r+o)),f=u>0?r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c);else f=a>0?-r:r,u=Math.max(0,-(a*f+o)),d=-u*u+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(Yr).addScaledVector(Us,f),d}intersectSphere(t,e){bn.subVectors(t.center,this.origin);const n=bn.dot(this.direction),i=bn.dot(bn)-n*n,r=t.radius*t.radius;if(i>r)return null;const a=Math.sqrt(r-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,r,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return c>=0?(n=(t.min.x-f.x)*c,i=(t.max.x-f.x)*c):(n=(t.max.x-f.x)*c,i=(t.min.x-f.x)*c),h>=0?(r=(t.min.y-f.y)*h,a=(t.max.y-f.y)*h):(r=(t.max.y-f.y)*h,a=(t.min.y-f.y)*h),n>a||r>i||((r>n||isNaN(n))&&(n=r),(a<i||isNaN(i))&&(i=a),u>=0?(o=(t.min.z-f.z)*u,l=(t.max.z-f.z)*u):(o=(t.max.z-f.z)*u,l=(t.min.z-f.z)*u),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,bn)!==null}intersectTriangle(t,e,n,i,r){Kr.subVectors(e,t),Ns.subVectors(n,t),Zr.crossVectors(Kr,Ns);let a=this.direction.dot(Zr),o;if(a>0){if(i)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Nn.subVectors(this.origin,t);const l=o*this.direction.dot(Ns.crossVectors(Nn,Ns));if(l<0)return null;const c=o*this.direction.dot(Kr.cross(Nn));if(c<0||l+c>a)return null;const h=-o*Nn.dot(Zr);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ne{constructor(t,e,n,i,r,a,o,l,c,h,u,f,d,g,x,m){ne.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,r,a,o,l,c,h,u,f,d,g,x,m)}set(t,e,n,i,r,a,o,l,c,h,u,f,d,g,x,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=i,p[1]=r,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=f,p[3]=d,p[7]=g,p[11]=x,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ne().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,i=1/Ci.setFromMatrixColumn(t,0).length(),r=1/Ci.setFromMatrixColumn(t,1).length(),a=1/Ci.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,i=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){const f=a*h,d=a*u,g=o*h,x=o*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=d+g*c,e[5]=f-x*c,e[9]=-o*l,e[2]=x-f*c,e[6]=g+d*c,e[10]=a*l}else if(t.order==="YXZ"){const f=l*h,d=l*u,g=c*h,x=c*u;e[0]=f+x*o,e[4]=g*o-d,e[8]=a*c,e[1]=a*u,e[5]=a*h,e[9]=-o,e[2]=d*o-g,e[6]=x+f*o,e[10]=a*l}else if(t.order==="ZXY"){const f=l*h,d=l*u,g=c*h,x=c*u;e[0]=f-x*o,e[4]=-a*u,e[8]=g+d*o,e[1]=d+g*o,e[5]=a*h,e[9]=x-f*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){const f=a*h,d=a*u,g=o*h,x=o*u;e[0]=l*h,e[4]=g*c-d,e[8]=f*c+x,e[1]=l*u,e[5]=x*c+f,e[9]=d*c-g,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){const f=a*l,d=a*c,g=o*l,x=o*c;e[0]=l*h,e[4]=x-f*u,e[8]=g*u+d,e[1]=u,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=d*u+g,e[10]=f-x*u}else if(t.order==="XZY"){const f=a*l,d=a*c,g=o*l,x=o*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=f*u+x,e[5]=a*h,e[9]=d*u-g,e[2]=g*u-d,e[6]=o*h,e[10]=x*u+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Cu,t,Ru)}lookAt(t,e,n){const i=this.elements;return Xe.subVectors(t,e),Xe.lengthSq()===0&&(Xe.z=1),Xe.normalize(),zn.crossVectors(n,Xe),zn.lengthSq()===0&&(Math.abs(n.z)===1?Xe.x+=1e-4:Xe.z+=1e-4,Xe.normalize(),zn.crossVectors(n,Xe)),zn.normalize(),zs.crossVectors(Xe,zn),i[0]=zn.x,i[4]=zs.x,i[8]=Xe.x,i[1]=zn.y,i[5]=zs.y,i[9]=Xe.y,i[2]=zn.z,i[6]=zs.z,i[10]=Xe.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],f=n[9],d=n[13],g=n[2],x=n[6],m=n[10],p=n[14],v=n[3],_=n[7],S=n[11],P=n[15],w=i[0],E=i[4],L=i[8],T=i[12],y=i[1],C=i[5],U=i[9],z=i[13],G=i[2],q=i[6],W=i[10],Z=i[14],O=i[3],st=i[7],ot=i[11],ft=i[15];return r[0]=a*w+o*y+l*G+c*O,r[4]=a*E+o*C+l*q+c*st,r[8]=a*L+o*U+l*W+c*ot,r[12]=a*T+o*z+l*Z+c*ft,r[1]=h*w+u*y+f*G+d*O,r[5]=h*E+u*C+f*q+d*st,r[9]=h*L+u*U+f*W+d*ot,r[13]=h*T+u*z+f*Z+d*ft,r[2]=g*w+x*y+m*G+p*O,r[6]=g*E+x*C+m*q+p*st,r[10]=g*L+x*U+m*W+p*ot,r[14]=g*T+x*z+m*Z+p*ft,r[3]=v*w+_*y+S*G+P*O,r[7]=v*E+_*C+S*q+P*st,r[11]=v*L+_*U+S*W+P*ot,r[15]=v*T+_*z+S*Z+P*ft,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],i=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],u=t[6],f=t[10],d=t[14],g=t[3],x=t[7],m=t[11],p=t[15];return g*(+r*l*u-i*c*u-r*o*f+n*c*f+i*o*d-n*l*d)+x*(+e*l*d-e*c*f+r*a*f-i*a*d+i*c*h-r*l*h)+m*(+e*c*u-e*o*d-r*a*u+n*a*d+r*o*h-n*c*h)+p*(-i*o*h-e*l*u+e*o*f+i*a*u-n*a*f+n*l*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],u=t[9],f=t[10],d=t[11],g=t[12],x=t[13],m=t[14],p=t[15],v=u*m*c-x*f*c+x*l*d-o*m*d-u*l*p+o*f*p,_=g*f*c-h*m*c-g*l*d+a*m*d+h*l*p-a*f*p,S=h*x*c-g*u*c+g*o*d-a*x*d-h*o*p+a*u*p,P=g*u*l-h*x*l-g*o*f+a*x*f+h*o*m-a*u*m,w=e*v+n*_+i*S+r*P;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const E=1/w;return t[0]=v*E,t[1]=(x*f*r-u*m*r-x*i*d+n*m*d+u*i*p-n*f*p)*E,t[2]=(o*m*r-x*l*r+x*i*c-n*m*c-o*i*p+n*l*p)*E,t[3]=(u*l*r-o*f*r-u*i*c+n*f*c+o*i*d-n*l*d)*E,t[4]=_*E,t[5]=(h*m*r-g*f*r+g*i*d-e*m*d-h*i*p+e*f*p)*E,t[6]=(g*l*r-a*m*r-g*i*c+e*m*c+a*i*p-e*l*p)*E,t[7]=(a*f*r-h*l*r+h*i*c-e*f*c-a*i*d+e*l*d)*E,t[8]=S*E,t[9]=(g*u*r-h*x*r-g*n*d+e*x*d+h*n*p-e*u*p)*E,t[10]=(a*x*r-g*o*r+g*n*c-e*x*c-a*n*p+e*o*p)*E,t[11]=(h*o*r-a*u*r-h*n*c+e*u*c+a*n*d-e*o*d)*E,t[12]=P*E,t[13]=(h*x*i-g*u*i+g*n*f-e*x*f-h*n*m+e*u*m)*E,t[14]=(g*o*i-a*x*i-g*n*l+e*x*l+a*n*m-e*o*m)*E,t[15]=(a*u*i-h*o*i+h*n*l-e*u*l-a*n*f+e*o*f)*E,this}scale(t){const e=this.elements,n=t.x,i=t.y,r=t.z;return e[0]*=n,e[4]*=i,e[8]*=r,e[1]*=n,e[5]*=i,e[9]*=r,e[2]*=n,e[6]*=i,e[10]*=r,e[3]*=n,e[7]*=i,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),i=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,h*o+n,h*l-i*a,0,c*l-i*o,h*l+i*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,r,a){return this.set(1,n,r,0,t,1,a,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){const i=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,h=a+a,u=o+o,f=r*c,d=r*h,g=r*u,x=a*h,m=a*u,p=o*u,v=l*c,_=l*h,S=l*u,P=n.x,w=n.y,E=n.z;return i[0]=(1-(x+p))*P,i[1]=(d+S)*P,i[2]=(g-_)*P,i[3]=0,i[4]=(d-S)*w,i[5]=(1-(f+p))*w,i[6]=(m+v)*w,i[7]=0,i[8]=(g+_)*E,i[9]=(m-v)*E,i[10]=(1-(f+x))*E,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){const i=this.elements;let r=Ci.set(i[0],i[1],i[2]).length();const a=Ci.set(i[4],i[5],i[6]).length(),o=Ci.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),t.x=i[12],t.y=i[13],t.z=i[14],rn.copy(this);const c=1/r,h=1/a,u=1/o;return rn.elements[0]*=c,rn.elements[1]*=c,rn.elements[2]*=c,rn.elements[4]*=h,rn.elements[5]*=h,rn.elements[6]*=h,rn.elements[8]*=u,rn.elements[9]*=u,rn.elements[10]*=u,e.setFromRotationMatrix(rn),n.x=r,n.y=a,n.z=o,this}makePerspective(t,e,n,i,r,a,o=Pn){const l=this.elements,c=2*r/(e-t),h=2*r/(n-i),u=(e+t)/(e-t),f=(n+i)/(n-i);let d,g;if(o===Pn)d=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===Mr)d=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=d,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,i,r,a,o=Pn){const l=this.elements,c=1/(e-t),h=1/(n-i),u=1/(a-r),f=(e+t)*c,d=(n+i)*h;let g,x;if(o===Pn)g=(a+r)*u,x=-2*u;else if(o===Mr)g=r*u,x=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-d,l[2]=0,l[6]=0,l[10]=x,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Ci=new D,rn=new ne,Cu=new D(0,0,0),Ru=new D(1,1,1),zn=new D,zs=new D,Xe=new D,pl=new ne,ml=new Ts;class un{constructor(t=0,e=0,n=0,i=un.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const i=t.elements,r=i[0],a=i[4],o=i[8],l=i[1],c=i[5],h=i[9],u=i[2],f=i[6],d=i[10];switch(e){case"XYZ":this._y=Math.asin(we(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-we(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(we(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-we(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(we(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-we(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return pl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(pl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return ml.setFromEuler(this),this.setFromQuaternion(ml,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}un.DEFAULT_ORDER="XYZ";class Kc{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Pu=0;const gl=new D,Ri=new Ts,Tn=new ne,Fs=new D,as=new D,Lu=new D,Du=new Ts,xl=new D(1,0,0),vl=new D(0,1,0),_l=new D(0,0,1),yl={type:"added"},Iu={type:"removed"},Pi={type:"childadded",child:null},jr={type:"childremoved",child:null};class xe extends Qi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Pu++}),this.uuid=bs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=xe.DEFAULT_UP.clone();const t=new D,e=new un,n=new Ts,i=new D(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new ne},normalMatrix:{value:new Ot}}),this.matrix=new ne,this.matrixWorld=new ne,this.matrixAutoUpdate=xe.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=xe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Kc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Ri.setFromAxisAngle(t,e),this.quaternion.multiply(Ri),this}rotateOnWorldAxis(t,e){return Ri.setFromAxisAngle(t,e),this.quaternion.premultiply(Ri),this}rotateX(t){return this.rotateOnAxis(xl,t)}rotateY(t){return this.rotateOnAxis(vl,t)}rotateZ(t){return this.rotateOnAxis(_l,t)}translateOnAxis(t,e){return gl.copy(t).applyQuaternion(this.quaternion),this.position.add(gl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(xl,t)}translateY(t){return this.translateOnAxis(vl,t)}translateZ(t){return this.translateOnAxis(_l,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Tn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Fs.copy(t):Fs.set(t,e,n);const i=this.parent;this.updateWorldMatrix(!0,!1),as.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Tn.lookAt(as,Fs,this.up):Tn.lookAt(Fs,as,this.up),this.quaternion.setFromRotationMatrix(Tn),i&&(Tn.extractRotation(i.matrixWorld),Ri.setFromRotationMatrix(Tn),this.quaternion.premultiply(Ri.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(yl),Pi.child=t,this.dispatchEvent(Pi),Pi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Iu),jr.child=t,this.dispatchEvent(jr),jr.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Tn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Tn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Tn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(yl),Pi.child=t,this.dispatchEvent(Pi),Pi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(as,t,Lu),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(as,Du,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const u=l[c];r(t.shapes,u)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));i.material=o}else i.material=r(t.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];i.animations.push(r(t.animations,l))}}if(e){const o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),u=a(t.shapes),f=a(t.skeletons),d=a(t.animations),g=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),d.length>0&&(n.animations=d),g.length>0&&(n.nodes=g)}return n.object=i,n;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const i=t.children[n];this.add(i.clone())}return this}}xe.DEFAULT_UP=new D(0,1,0);xe.DEFAULT_MATRIX_AUTO_UPDATE=!0;xe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const an=new D,wn=new D,Jr=new D,En=new D,Li=new D,Di=new D,Ml=new D,Qr=new D,ta=new D,ea=new D;class gn{constructor(t=new D,e=new D,n=new D){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),an.subVectors(t,e),i.cross(an);const r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(t,e,n,i,r){an.subVectors(i,e),wn.subVectors(n,e),Jr.subVectors(t,e);const a=an.dot(an),o=an.dot(wn),l=an.dot(Jr),c=wn.dot(wn),h=wn.dot(Jr),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;const f=1/u,d=(c*l-o*h)*f,g=(a*h-o*l)*f;return r.set(1-d-g,g,d)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,En)===null?!1:En.x>=0&&En.y>=0&&En.x+En.y<=1}static getInterpolation(t,e,n,i,r,a,o,l){return this.getBarycoord(t,e,n,i,En)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,En.x),l.addScaledVector(a,En.y),l.addScaledVector(o,En.z),l)}static isFrontFacing(t,e,n,i){return an.subVectors(n,e),wn.subVectors(t,e),an.cross(wn).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return an.subVectors(this.c,this.b),wn.subVectors(this.a,this.b),an.cross(wn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return gn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return gn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,r){return gn.getInterpolation(t,this.a,this.b,this.c,e,n,i,r)}containsPoint(t){return gn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return gn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,i=this.b,r=this.c;let a,o;Li.subVectors(i,n),Di.subVectors(r,n),Qr.subVectors(t,n);const l=Li.dot(Qr),c=Di.dot(Qr);if(l<=0&&c<=0)return e.copy(n);ta.subVectors(t,i);const h=Li.dot(ta),u=Di.dot(ta);if(h>=0&&u<=h)return e.copy(i);const f=l*u-h*c;if(f<=0&&l>=0&&h<=0)return a=l/(l-h),e.copy(n).addScaledVector(Li,a);ea.subVectors(t,r);const d=Li.dot(ea),g=Di.dot(ea);if(g>=0&&d<=g)return e.copy(r);const x=d*c-l*g;if(x<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(n).addScaledVector(Di,o);const m=h*g-d*u;if(m<=0&&u-h>=0&&d-g>=0)return Ml.subVectors(r,i),o=(u-h)/(u-h+(d-g)),e.copy(i).addScaledVector(Ml,o);const p=1/(m+x+f);return a=x*p,o=f*p,e.copy(n).addScaledVector(Li,a).addScaledVector(Di,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Zc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Fn={h:0,s:0,l:0},Os={h:0,s:0,l:0};function na(s,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?s+(t-s)*6*e:e<1/2?t:e<2/3?s+(t-s)*6*(2/3-e):s}class Bt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=cn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Qt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,i=Qt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Qt.toWorkingColorSpace(this,i),this}setHSL(t,e,n,i=Qt.workingColorSpace){if(t=vu(t,1),e=we(e,0,1),n=we(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=na(a,r,t+1/3),this.g=na(a,r,t),this.b=na(a,r,t-1/3)}return Qt.toWorkingColorSpace(this,i),this}setStyle(t,e=cn){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=i[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=cn){const n=Zc[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=$i(t.r),this.g=$i(t.g),this.b=$i(t.b),this}copyLinearToSRGB(t){return this.r=Vr(t.r),this.g=Vr(t.g),this.b=Vr(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=cn){return Qt.fromWorkingColorSpace(Ae.copy(this),t),Math.round(we(Ae.r*255,0,255))*65536+Math.round(we(Ae.g*255,0,255))*256+Math.round(we(Ae.b*255,0,255))}getHexString(t=cn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Qt.workingColorSpace){Qt.fromWorkingColorSpace(Ae.copy(this),e);const n=Ae.r,i=Ae.g,r=Ae.b,a=Math.max(n,i,r),o=Math.min(n,i,r);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(i-r)/u+(i<r?6:0);break;case i:l=(r-n)/u+2;break;case r:l=(n-i)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Qt.workingColorSpace){return Qt.fromWorkingColorSpace(Ae.copy(this),e),t.r=Ae.r,t.g=Ae.g,t.b=Ae.b,t}getStyle(t=cn){Qt.fromWorkingColorSpace(Ae.copy(this),t);const e=Ae.r,n=Ae.g,i=Ae.b;return t!==cn?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(Fn),this.setHSL(Fn.h+t,Fn.s+e,Fn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Fn),t.getHSL(Os);const n=Gr(Fn.h,Os.h,e),i=Gr(Fn.s,Os.s,e),r=Gr(Fn.l,Os.l,e);return this.setHSL(n,i,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,i=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*i,this.g=r[1]*e+r[4]*n+r[7]*i,this.b=r[2]*e+r[5]*n+r[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ae=new Bt;Bt.NAMES=Zc;let ku=0;class yi extends Qi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:ku++}),this.uuid=bs(),this.name="",this.type="Material",this.blending=Xi,this.side=Xn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Sa,this.blendDst=ba,this.blendEquation=ci,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Bt(0,0,0),this.blendAlpha=0,this.depthFunc=xr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ol,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=bi,this.stencilZFail=bi,this.stencilZPass=bi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Xi&&(n.blending=this.blending),this.side!==Xn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Sa&&(n.blendSrc=this.blendSrc),this.blendDst!==ba&&(n.blendDst=this.blendDst),this.blendEquation!==ci&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==xr&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==ol&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==bi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==bi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==bi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){const a=[];for(const o in r){const l=r[o];delete l.metadata,a.push(l)}return a}if(e){const r=i(t.textures),a=i(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const i=e.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}onBeforeRender(){console.warn("Material: onBeforeRender() has been removed.")}}class Ce extends yi{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Bt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new un,this.combine=po,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const me=new D,Bs=new gt;class Ne{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=ll,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=xn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return Xc("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Bs.fromBufferAttribute(this,e),Bs.applyMatrix3(t),this.setXY(e,Bs.x,Bs.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)me.fromBufferAttribute(this,e),me.applyMatrix3(t),this.setXYZ(e,me.x,me.y,me.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)me.fromBufferAttribute(this,e),me.applyMatrix4(t),this.setXYZ(e,me.x,me.y,me.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)me.fromBufferAttribute(this,e),me.applyNormalMatrix(t),this.setXYZ(e,me.x,me.y,me.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)me.fromBufferAttribute(this,e),me.transformDirection(t),this.setXYZ(e,me.x,me.y,me.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=is(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Fe(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=is(e,this.array)),e}setX(t,e){return this.normalized&&(e=Fe(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=is(e,this.array)),e}setY(t,e){return this.normalized&&(e=Fe(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=is(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Fe(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=is(e,this.array)),e}setW(t,e){return this.normalized&&(e=Fe(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Fe(e,this.array),n=Fe(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=Fe(e,this.array),n=Fe(n,this.array),i=Fe(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,r){return t*=this.itemSize,this.normalized&&(e=Fe(e,this.array),n=Fe(n,this.array),i=Fe(i,this.array),r=Fe(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==ll&&(t.usage=this.usage),t}}class jc extends Ne{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Jc extends Ne{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class ce extends Ne{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Uu=0;const Je=new ne,ia=new xe,Ii=new D,qe=new _i,os=new _i,Me=new D;class ze extends Qi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Uu++}),this.uuid=bs(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Wc(t)?Jc:jc)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Ot().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Je.makeRotationFromQuaternion(t),this.applyMatrix4(Je),this}rotateX(t){return Je.makeRotationX(t),this.applyMatrix4(Je),this}rotateY(t){return Je.makeRotationY(t),this.applyMatrix4(Je),this}rotateZ(t){return Je.makeRotationZ(t),this.applyMatrix4(Je),this}translate(t,e,n){return Je.makeTranslation(t,e,n),this.applyMatrix4(Je),this}scale(t,e,n){return Je.makeScale(t,e,n),this.applyMatrix4(Je),this}lookAt(t){return ia.lookAt(t),ia.updateMatrix(),this.applyMatrix4(ia.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ii).negate(),this.translate(Ii.x,Ii.y,Ii.z),this}setFromPoints(t){const e=[];for(let n=0,i=t.length;n<i;n++){const r=t[n];e.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new ce(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new _i);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){const r=e[n];qe.setFromBufferAttribute(r),this.morphTargetsRelative?(Me.addVectors(this.boundingBox.min,qe.min),this.boundingBox.expandByPoint(Me),Me.addVectors(this.boundingBox.max,qe.max),this.boundingBox.expandByPoint(Me)):(this.boundingBox.expandByPoint(qe.min),this.boundingBox.expandByPoint(qe.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ts);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(t){const n=this.boundingSphere.center;if(qe.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){const o=e[r];os.setFromBufferAttribute(o),this.morphTargetsRelative?(Me.addVectors(qe.min,os.min),qe.expandByPoint(Me),Me.addVectors(qe.max,os.max),qe.expandByPoint(Me)):(qe.expandByPoint(os.min),qe.expandByPoint(os.max))}qe.getCenter(n);let i=0;for(let r=0,a=t.count;r<a;r++)Me.fromBufferAttribute(t,r),i=Math.max(i,n.distanceToSquared(Me));if(e)for(let r=0,a=e.length;r<a;r++){const o=e[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Me.fromBufferAttribute(o,c),l&&(Ii.fromBufferAttribute(t,c),Me.add(Ii)),i=Math.max(i,n.distanceToSquared(Me))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,i=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ne(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],l=[];for(let L=0;L<n.count;L++)o[L]=new D,l[L]=new D;const c=new D,h=new D,u=new D,f=new gt,d=new gt,g=new gt,x=new D,m=new D;function p(L,T,y){c.fromBufferAttribute(n,L),h.fromBufferAttribute(n,T),u.fromBufferAttribute(n,y),f.fromBufferAttribute(r,L),d.fromBufferAttribute(r,T),g.fromBufferAttribute(r,y),h.sub(c),u.sub(c),d.sub(f),g.sub(f);const C=1/(d.x*g.y-g.x*d.y);isFinite(C)&&(x.copy(h).multiplyScalar(g.y).addScaledVector(u,-d.y).multiplyScalar(C),m.copy(u).multiplyScalar(d.x).addScaledVector(h,-g.x).multiplyScalar(C),o[L].add(x),o[T].add(x),o[y].add(x),l[L].add(m),l[T].add(m),l[y].add(m))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let L=0,T=v.length;L<T;++L){const y=v[L],C=y.start,U=y.count;for(let z=C,G=C+U;z<G;z+=3)p(t.getX(z+0),t.getX(z+1),t.getX(z+2))}const _=new D,S=new D,P=new D,w=new D;function E(L){P.fromBufferAttribute(i,L),w.copy(P);const T=o[L];_.copy(T),_.sub(P.multiplyScalar(P.dot(T))).normalize(),S.crossVectors(w,T);const C=S.dot(l[L])<0?-1:1;a.setXYZW(L,_.x,_.y,_.z,C)}for(let L=0,T=v.length;L<T;++L){const y=v[L],C=y.start,U=y.count;for(let z=C,G=C+U;z<G;z+=3)E(t.getX(z+0)),E(t.getX(z+1)),E(t.getX(z+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Ne(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,d=n.count;f<d;f++)n.setXYZ(f,0,0,0);const i=new D,r=new D,a=new D,o=new D,l=new D,c=new D,h=new D,u=new D;if(t)for(let f=0,d=t.count;f<d;f+=3){const g=t.getX(f+0),x=t.getX(f+1),m=t.getX(f+2);i.fromBufferAttribute(e,g),r.fromBufferAttribute(e,x),a.fromBufferAttribute(e,m),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let f=0,d=e.count;f<d;f+=3)i.fromBufferAttribute(e,f+0),r.fromBufferAttribute(e,f+1),a.fromBufferAttribute(e,f+2),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Me.fromBufferAttribute(t,e),Me.normalize(),t.setXYZ(e,Me.x,Me.y,Me.z)}toNonIndexed(){function t(o,l){const c=o.array,h=o.itemSize,u=o.normalized,f=new c.constructor(l.length*h);let d=0,g=0;for(let x=0,m=l.length;x<m;x++){o.isInterleavedBufferAttribute?d=l[x]*o.data.stride+o.offset:d=l[x]*h;for(let p=0;p<h;p++)f[g++]=c[d++]}return new Ne(f,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new ze,n=this.index.array,i=this.attributes;for(const o in i){const l=i[o],c=t(l,n);e.setAttribute(o,c)}const r=this.morphAttributes;for(const o in r){const l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){const f=c[h],d=t(f,n);l.push(d)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const i={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let u=0,f=c.length;u<f;u++){const d=c[u];h.push(d.toJSON(t.data))}h.length>0&&(i[l]=h,r=!0)}r&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const i=t.attributes;for(const c in i){const h=i[c];this.setAttribute(c,h.clone(e))}const r=t.morphAttributes;for(const c in r){const h=[],u=r[c];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let c=0,h=a.length;c<h;c++){const u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Sl=new ne,jn=new Yc,Gs=new ts,bl=new D,ki=new D,Ui=new D,Ni=new D,sa=new D,Hs=new D,Vs=new gt,Ws=new gt,Xs=new gt,Tl=new D,wl=new D,El=new D,qs=new D,$s=new D;class at extends xe{constructor(t=new ze,e=new Ce){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){const n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(i,t);const o=this.morphTargetInfluences;if(r&&o){Hs.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const h=o[l],u=r[l];h!==0&&(sa.fromBufferAttribute(u,t),a?Hs.addScaledVector(sa,h):Hs.addScaledVector(sa.sub(e),h))}e.add(Hs)}return e}raycast(t,e){const n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Gs.copy(n.boundingSphere),Gs.applyMatrix4(r),jn.copy(t.ray).recast(t.near),!(Gs.containsPoint(jn.origin)===!1&&(jn.intersectSphere(Gs,bl)===null||jn.origin.distanceToSquared(bl)>(t.far-t.near)**2))&&(Sl.copy(r).invert(),jn.copy(t.ray).applyMatrix4(Sl),!(n.boundingBox!==null&&jn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,jn)))}_computeIntersections(t,e,n){let i;const r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,f=r.groups,d=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,x=f.length;g<x;g++){const m=f[g],p=a[m.materialIndex],v=Math.max(m.start,d.start),_=Math.min(o.count,Math.min(m.start+m.count,d.start+d.count));for(let S=v,P=_;S<P;S+=3){const w=o.getX(S),E=o.getX(S+1),L=o.getX(S+2);i=Ys(this,p,t,n,c,h,u,w,E,L),i&&(i.faceIndex=Math.floor(S/3),i.face.materialIndex=m.materialIndex,e.push(i))}}else{const g=Math.max(0,d.start),x=Math.min(o.count,d.start+d.count);for(let m=g,p=x;m<p;m+=3){const v=o.getX(m),_=o.getX(m+1),S=o.getX(m+2);i=Ys(this,a,t,n,c,h,u,v,_,S),i&&(i.faceIndex=Math.floor(m/3),e.push(i))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,x=f.length;g<x;g++){const m=f[g],p=a[m.materialIndex],v=Math.max(m.start,d.start),_=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let S=v,P=_;S<P;S+=3){const w=S,E=S+1,L=S+2;i=Ys(this,p,t,n,c,h,u,w,E,L),i&&(i.faceIndex=Math.floor(S/3),i.face.materialIndex=m.materialIndex,e.push(i))}}else{const g=Math.max(0,d.start),x=Math.min(l.count,d.start+d.count);for(let m=g,p=x;m<p;m+=3){const v=m,_=m+1,S=m+2;i=Ys(this,a,t,n,c,h,u,v,_,S),i&&(i.faceIndex=Math.floor(m/3),e.push(i))}}}}function Nu(s,t,e,n,i,r,a,o){let l;if(t.side===Ue?l=n.intersectTriangle(a,r,i,!0,o):l=n.intersectTriangle(i,r,a,t.side===Xn,o),l===null)return null;$s.copy(o),$s.applyMatrix4(s.matrixWorld);const c=e.ray.origin.distanceTo($s);return c<e.near||c>e.far?null:{distance:c,point:$s.clone(),object:s}}function Ys(s,t,e,n,i,r,a,o,l,c){s.getVertexPosition(o,ki),s.getVertexPosition(l,Ui),s.getVertexPosition(c,Ni);const h=Nu(s,t,e,n,ki,Ui,Ni,qs);if(h){i&&(Vs.fromBufferAttribute(i,o),Ws.fromBufferAttribute(i,l),Xs.fromBufferAttribute(i,c),h.uv=gn.getInterpolation(qs,ki,Ui,Ni,Vs,Ws,Xs,new gt)),r&&(Vs.fromBufferAttribute(r,o),Ws.fromBufferAttribute(r,l),Xs.fromBufferAttribute(r,c),h.uv1=gn.getInterpolation(qs,ki,Ui,Ni,Vs,Ws,Xs,new gt)),a&&(Tl.fromBufferAttribute(a,o),wl.fromBufferAttribute(a,l),El.fromBufferAttribute(a,c),h.normal=gn.getInterpolation(qs,ki,Ui,Ni,Tl,wl,El,new D),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a:o,b:l,c,normal:new D,materialIndex:0};gn.getNormal(ki,Ui,Ni,u.normal),h.face=u}return h}class vn extends ze{constructor(t=1,e=1,n=1,i=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:r,depthSegments:a};const o=this;i=Math.floor(i),r=Math.floor(r),a=Math.floor(a);const l=[],c=[],h=[],u=[];let f=0,d=0;g("z","y","x",-1,-1,n,e,t,a,r,0),g("z","y","x",1,-1,n,e,-t,a,r,1),g("x","z","y",1,1,t,n,e,i,a,2),g("x","z","y",1,-1,t,n,-e,i,a,3),g("x","y","z",1,-1,t,e,n,i,r,4),g("x","y","z",-1,-1,t,e,-n,i,r,5),this.setIndex(l),this.setAttribute("position",new ce(c,3)),this.setAttribute("normal",new ce(h,3)),this.setAttribute("uv",new ce(u,2));function g(x,m,p,v,_,S,P,w,E,L,T){const y=S/E,C=P/L,U=S/2,z=P/2,G=w/2,q=E+1,W=L+1;let Z=0,O=0;const st=new D;for(let ot=0;ot<W;ot++){const ft=ot*C-z;for(let pt=0;pt<q;pt++){const ct=pt*y-U;st[x]=ct*v,st[m]=ft*_,st[p]=G,c.push(st.x,st.y,st.z),st[x]=0,st[m]=0,st[p]=w>0?1:-1,h.push(st.x,st.y,st.z),u.push(pt/E),u.push(1-ot/L),Z+=1}}for(let ot=0;ot<L;ot++)for(let ft=0;ft<E;ft++){const pt=f+ft+q*ot,ct=f+ft+q*(ot+1),F=f+(ft+1)+q*(ot+1),X=f+(ft+1)+q*ot;l.push(pt,ct,X),l.push(ct,F,X),O+=6}o.addGroup(d,O,T),d+=O,f+=Z}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new vn(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Ji(s){const t={};for(const e in s){t[e]={};for(const n in s[e]){const i=s[e][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone():Array.isArray(i)?t[e][n]=i.slice():t[e][n]=i}}return t}function De(s){const t={};for(let e=0;e<s.length;e++){const n=Ji(s[e]);for(const i in n)t[i]=n[i]}return t}function zu(s){const t=[];for(let e=0;e<s.length;e++)t.push(s[e].clone());return t}function Qc(s){const t=s.getRenderTarget();return t===null?s.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Qt.workingColorSpace}const Fu={clone:Ji,merge:De};var Ou=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Bu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Dn extends yi{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Ou,this.fragmentShader=Bu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Ji(t.uniforms),this.uniformsGroups=zu(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const i in this.uniforms){const a=this.uniforms[i].value;a&&a.isTexture?e.uniforms[i]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[i]={type:"m4",value:a.toArray()}:e.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class th extends xe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ne,this.projectionMatrix=new ne,this.projectionMatrixInverse=new ne,this.coordinateSystem=Pn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const On=new D,Al=new gt,Cl=new gt;class Qe extends th{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Qa*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Br*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Qa*2*Math.atan(Math.tan(Br*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){On.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(On.x,On.y).multiplyScalar(-t/On.z),On.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(On.x,On.y).multiplyScalar(-t/On.z)}getViewSize(t,e){return this.getViewBounds(t,Al,Cl),e.subVectors(Cl,Al)}setViewOffset(t,e,n,i,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Br*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,r=-.5*i;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*i/l,e-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const zi=-90,Fi=1;class Gu extends xe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new Qe(zi,Fi,t,e);i.layers=this.layers,this.add(i);const r=new Qe(zi,Fi,t,e);r.layers=this.layers,this.add(r);const a=new Qe(zi,Fi,t,e);a.layers=this.layers,this.add(a);const o=new Qe(zi,Fi,t,e);o.layers=this.layers,this.add(o);const l=new Qe(zi,Fi,t,e);l.layers=this.layers,this.add(l);const c=new Qe(zi,Fi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,i,r,a,o,l]=e;for(const c of e)this.remove(c);if(t===Pn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Mr)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,l,c,h]=this.children,u=t.getRenderTarget(),f=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,i),t.render(e,r),t.setRenderTarget(n,1,i),t.render(e,a),t.setRenderTarget(n,2,i),t.render(e,o),t.setRenderTarget(n,3,i),t.render(e,l),t.setRenderTarget(n,4,i),t.render(e,c),n.texture.generateMipmaps=x,t.setRenderTarget(n,5,i),t.render(e,h),t.setRenderTarget(u,f,d),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class eh extends Le{constructor(t,e,n,i,r,a,o,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:Yi,super(t,e,n,i,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Hu extends qn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new eh(i,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:tn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new vn(5,5,5),r=new Dn({name:"CubemapFromEquirect",uniforms:Ji(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ue,blending:Vn});r.uniforms.tEquirect.value=e;const a=new at(i,r),o=e.minFilter;return e.minFilter===pi&&(e.minFilter=tn),new Gu(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,n,i){const r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,i);t.setRenderTarget(r)}}const ra=new D,Vu=new D,Wu=new Ot;class ii{constructor(t=new D(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const i=ra.subVectors(n,e).cross(Vu.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(ra),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Wu.getNormalMatrix(t),i=this.coplanarPoint(ra).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Jn=new ts,Ks=new D;class To{constructor(t=new ii,e=new ii,n=new ii,i=new ii,r=new ii,a=new ii){this.planes=[t,e,n,i,r,a]}set(t,e,n,i,r,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Pn){const n=this.planes,i=t.elements,r=i[0],a=i[1],o=i[2],l=i[3],c=i[4],h=i[5],u=i[6],f=i[7],d=i[8],g=i[9],x=i[10],m=i[11],p=i[12],v=i[13],_=i[14],S=i[15];if(n[0].setComponents(l-r,f-c,m-d,S-p).normalize(),n[1].setComponents(l+r,f+c,m+d,S+p).normalize(),n[2].setComponents(l+a,f+h,m+g,S+v).normalize(),n[3].setComponents(l-a,f-h,m-g,S-v).normalize(),n[4].setComponents(l-o,f-u,m-x,S-_).normalize(),e===Pn)n[5].setComponents(l+o,f+u,m+x,S+_).normalize();else if(e===Mr)n[5].setComponents(o,u,x,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Jn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Jn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Jn)}intersectsSprite(t){return Jn.center.set(0,0,0),Jn.radius=.7071067811865476,Jn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Jn)}intersectsSphere(t){const e=this.planes,n=t.center,i=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const i=e[n];if(Ks.x=i.normal.x>0?t.max.x:t.min.x,Ks.y=i.normal.y>0?t.max.y:t.min.y,Ks.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(Ks)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function nh(){let s=null,t=!1,e=null,n=null;function i(r,a){e(r,a),n=s.requestAnimationFrame(i)}return{start:function(){t!==!0&&e!==null&&(n=s.requestAnimationFrame(i),t=!0)},stop:function(){s.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){s=r}}}function Xu(s){const t=new WeakMap;function e(o,l){const c=o.array,h=o.usage,u=c.byteLength,f=s.createBuffer();s.bindBuffer(l,f),s.bufferData(l,c,h),o.onUploadCallback();let d;if(c instanceof Float32Array)d=s.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=s.HALF_FLOAT:d=s.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=s.SHORT;else if(c instanceof Uint32Array)d=s.UNSIGNED_INT;else if(c instanceof Int32Array)d=s.INT;else if(c instanceof Int8Array)d=s.BYTE;else if(c instanceof Uint8Array)d=s.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,l,c){const h=l.array,u=l._updateRange,f=l.updateRanges;if(s.bindBuffer(c,o),u.count===-1&&f.length===0&&s.bufferSubData(c,0,h),f.length!==0){for(let d=0,g=f.length;d<g;d++){const x=f[d];s.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}u.count!==-1&&(s.bufferSubData(c,u.offset*h.BYTES_PER_ELEMENT,h,u.offset,u.count),u.count=-1),l.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(s.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isGLBufferAttribute){const h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}o.isInterleavedBufferAttribute&&(o=o.data);const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:i,remove:r,update:a}}class Be extends ze{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};const r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(i),c=o+1,h=l+1,u=t/o,f=e/l,d=[],g=[],x=[],m=[];for(let p=0;p<h;p++){const v=p*f-a;for(let _=0;_<c;_++){const S=_*u-r;g.push(S,-v,0),x.push(0,0,1),m.push(_/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let v=0;v<o;v++){const _=v+c*p,S=v+c*(p+1),P=v+1+c*(p+1),w=v+1+c*p;d.push(_,S,w),d.push(S,P,w)}this.setIndex(d),this.setAttribute("position",new ce(g,3)),this.setAttribute("normal",new ce(x,3)),this.setAttribute("uv",new ce(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Be(t.width,t.height,t.widthSegments,t.heightSegments)}}var qu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,$u=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Yu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Ku=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Zu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ju=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ju=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Qu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,tf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,ef=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,nf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,sf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,rf=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,af=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,of=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,lf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,cf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,hf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,df=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,uf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,ff=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,pf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,mf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,gf=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,xf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,vf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,_f=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,yf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Mf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Sf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,bf="gl_FragColor = linearToOutputTexel( gl_FragColor );",Tf=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,wf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Ef=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Af=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Cf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Rf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Pf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Lf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Df=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,If=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,kf=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Uf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Nf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,zf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Ff=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Of=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Bf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Gf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Hf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Vf=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Wf=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Xf=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,qf=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,$f=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Yf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Kf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Zf=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,jf=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Jf=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Qf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,tp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,ep=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,np=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ip=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,sp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,rp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,ap=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,op=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,lp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,cp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,hp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,dp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,up=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,fp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,pp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,mp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,gp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,xp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,vp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,_p=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,yp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Mp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Sp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,bp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Tp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,wp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ep=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ap=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Cp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Rp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Pp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Lp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Dp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Ip=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,kp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Up=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Np=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,zp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Fp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Op=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Bp=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Gp=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Hp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Vp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Wp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Xp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const qp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,$p=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Yp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Kp=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,jp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Jp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Qp=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,tm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,em=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,nm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,im=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,sm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,rm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,am=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,om=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cm=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,dm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,um=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,fm=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,pm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,mm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gm=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,xm=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,_m=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ym=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Mm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Sm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,bm=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Tm=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,wm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ft={alphahash_fragment:qu,alphahash_pars_fragment:$u,alphamap_fragment:Yu,alphamap_pars_fragment:Ku,alphatest_fragment:Zu,alphatest_pars_fragment:ju,aomap_fragment:Ju,aomap_pars_fragment:Qu,batching_pars_vertex:tf,batching_vertex:ef,begin_vertex:nf,beginnormal_vertex:sf,bsdfs:rf,iridescence_fragment:af,bumpmap_pars_fragment:of,clipping_planes_fragment:lf,clipping_planes_pars_fragment:cf,clipping_planes_pars_vertex:hf,clipping_planes_vertex:df,color_fragment:uf,color_pars_fragment:ff,color_pars_vertex:pf,color_vertex:mf,common:gf,cube_uv_reflection_fragment:xf,defaultnormal_vertex:vf,displacementmap_pars_vertex:_f,displacementmap_vertex:yf,emissivemap_fragment:Mf,emissivemap_pars_fragment:Sf,colorspace_fragment:bf,colorspace_pars_fragment:Tf,envmap_fragment:wf,envmap_common_pars_fragment:Ef,envmap_pars_fragment:Af,envmap_pars_vertex:Cf,envmap_physical_pars_fragment:Of,envmap_vertex:Rf,fog_vertex:Pf,fog_pars_vertex:Lf,fog_fragment:Df,fog_pars_fragment:If,gradientmap_pars_fragment:kf,lightmap_pars_fragment:Uf,lights_lambert_fragment:Nf,lights_lambert_pars_fragment:zf,lights_pars_begin:Ff,lights_toon_fragment:Bf,lights_toon_pars_fragment:Gf,lights_phong_fragment:Hf,lights_phong_pars_fragment:Vf,lights_physical_fragment:Wf,lights_physical_pars_fragment:Xf,lights_fragment_begin:qf,lights_fragment_maps:$f,lights_fragment_end:Yf,logdepthbuf_fragment:Kf,logdepthbuf_pars_fragment:Zf,logdepthbuf_pars_vertex:jf,logdepthbuf_vertex:Jf,map_fragment:Qf,map_pars_fragment:tp,map_particle_fragment:ep,map_particle_pars_fragment:np,metalnessmap_fragment:ip,metalnessmap_pars_fragment:sp,morphinstance_vertex:rp,morphcolor_vertex:ap,morphnormal_vertex:op,morphtarget_pars_vertex:lp,morphtarget_vertex:cp,normal_fragment_begin:hp,normal_fragment_maps:dp,normal_pars_fragment:up,normal_pars_vertex:fp,normal_vertex:pp,normalmap_pars_fragment:mp,clearcoat_normal_fragment_begin:gp,clearcoat_normal_fragment_maps:xp,clearcoat_pars_fragment:vp,iridescence_pars_fragment:_p,opaque_fragment:yp,packing:Mp,premultiplied_alpha_fragment:Sp,project_vertex:bp,dithering_fragment:Tp,dithering_pars_fragment:wp,roughnessmap_fragment:Ep,roughnessmap_pars_fragment:Ap,shadowmap_pars_fragment:Cp,shadowmap_pars_vertex:Rp,shadowmap_vertex:Pp,shadowmask_pars_fragment:Lp,skinbase_vertex:Dp,skinning_pars_vertex:Ip,skinning_vertex:kp,skinnormal_vertex:Up,specularmap_fragment:Np,specularmap_pars_fragment:zp,tonemapping_fragment:Fp,tonemapping_pars_fragment:Op,transmission_fragment:Bp,transmission_pars_fragment:Gp,uv_pars_fragment:Hp,uv_pars_vertex:Vp,uv_vertex:Wp,worldpos_vertex:Xp,background_vert:qp,background_frag:$p,backgroundCube_vert:Yp,backgroundCube_frag:Kp,cube_vert:Zp,cube_frag:jp,depth_vert:Jp,depth_frag:Qp,distanceRGBA_vert:tm,distanceRGBA_frag:em,equirect_vert:nm,equirect_frag:im,linedashed_vert:sm,linedashed_frag:rm,meshbasic_vert:am,meshbasic_frag:om,meshlambert_vert:lm,meshlambert_frag:cm,meshmatcap_vert:hm,meshmatcap_frag:dm,meshnormal_vert:um,meshnormal_frag:fm,meshphong_vert:pm,meshphong_frag:mm,meshphysical_vert:gm,meshphysical_frag:xm,meshtoon_vert:vm,meshtoon_frag:_m,points_vert:ym,points_frag:Mm,shadow_vert:Sm,shadow_frag:bm,sprite_vert:Tm,sprite_frag:wm},lt={common:{diffuse:{value:new Bt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ot},alphaMap:{value:null},alphaMapTransform:{value:new Ot},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ot}},envmap:{envMap:{value:null},envMapRotation:{value:new Ot},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ot}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ot}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ot},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ot},normalScale:{value:new gt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ot},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ot}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ot}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ot}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Bt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Bt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ot},alphaTest:{value:0},uvTransform:{value:new Ot}},sprite:{diffuse:{value:new Bt(16777215)},opacity:{value:1},center:{value:new gt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ot},alphaMap:{value:null},alphaMapTransform:{value:new Ot},alphaTest:{value:0}}},mn={basic:{uniforms:De([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.fog]),vertexShader:Ft.meshbasic_vert,fragmentShader:Ft.meshbasic_frag},lambert:{uniforms:De([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,lt.lights,{emissive:{value:new Bt(0)}}]),vertexShader:Ft.meshlambert_vert,fragmentShader:Ft.meshlambert_frag},phong:{uniforms:De([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,lt.lights,{emissive:{value:new Bt(0)},specular:{value:new Bt(1118481)},shininess:{value:30}}]),vertexShader:Ft.meshphong_vert,fragmentShader:Ft.meshphong_frag},standard:{uniforms:De([lt.common,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.roughnessmap,lt.metalnessmap,lt.fog,lt.lights,{emissive:{value:new Bt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ft.meshphysical_vert,fragmentShader:Ft.meshphysical_frag},toon:{uniforms:De([lt.common,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.gradientmap,lt.fog,lt.lights,{emissive:{value:new Bt(0)}}]),vertexShader:Ft.meshtoon_vert,fragmentShader:Ft.meshtoon_frag},matcap:{uniforms:De([lt.common,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,{matcap:{value:null}}]),vertexShader:Ft.meshmatcap_vert,fragmentShader:Ft.meshmatcap_frag},points:{uniforms:De([lt.points,lt.fog]),vertexShader:Ft.points_vert,fragmentShader:Ft.points_frag},dashed:{uniforms:De([lt.common,lt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ft.linedashed_vert,fragmentShader:Ft.linedashed_frag},depth:{uniforms:De([lt.common,lt.displacementmap]),vertexShader:Ft.depth_vert,fragmentShader:Ft.depth_frag},normal:{uniforms:De([lt.common,lt.bumpmap,lt.normalmap,lt.displacementmap,{opacity:{value:1}}]),vertexShader:Ft.meshnormal_vert,fragmentShader:Ft.meshnormal_frag},sprite:{uniforms:De([lt.sprite,lt.fog]),vertexShader:Ft.sprite_vert,fragmentShader:Ft.sprite_frag},background:{uniforms:{uvTransform:{value:new Ot},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ft.background_vert,fragmentShader:Ft.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ot}},vertexShader:Ft.backgroundCube_vert,fragmentShader:Ft.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ft.cube_vert,fragmentShader:Ft.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ft.equirect_vert,fragmentShader:Ft.equirect_frag},distanceRGBA:{uniforms:De([lt.common,lt.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ft.distanceRGBA_vert,fragmentShader:Ft.distanceRGBA_frag},shadow:{uniforms:De([lt.lights,lt.fog,{color:{value:new Bt(0)},opacity:{value:1}}]),vertexShader:Ft.shadow_vert,fragmentShader:Ft.shadow_frag}};mn.physical={uniforms:De([mn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ot},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ot},clearcoatNormalScale:{value:new gt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ot},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ot},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ot},sheen:{value:0},sheenColor:{value:new Bt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ot},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ot},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ot},transmissionSamplerSize:{value:new gt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ot},attenuationDistance:{value:0},attenuationColor:{value:new Bt(0)},specularColor:{value:new Bt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ot},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ot},anisotropyVector:{value:new gt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ot}}]),vertexShader:Ft.meshphysical_vert,fragmentShader:Ft.meshphysical_frag};const Zs={r:0,b:0,g:0},Qn=new un,Em=new ne;function Am(s,t,e,n,i,r,a){const o=new Bt(0);let l=r===!0?0:1,c,h,u=null,f=0,d=null;function g(v){let _=v.isScene===!0?v.background:null;return _&&_.isTexture&&(_=(v.backgroundBlurriness>0?e:t).get(_)),_}function x(v){let _=!1;const S=g(v);S===null?p(o,l):S&&S.isColor&&(p(S,1),_=!0);const P=s.xr.getEnvironmentBlendMode();P==="additive"?n.buffers.color.setClear(0,0,0,1,a):P==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(s.autoClear||_)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function m(v,_){const S=g(_);S&&(S.isCubeTexture||S.mapping===Cr)?(h===void 0&&(h=new at(new vn(1,1,1),new Dn({name:"BackgroundCubeMaterial",uniforms:Ji(mn.backgroundCube.uniforms),vertexShader:mn.backgroundCube.vertexShader,fragmentShader:mn.backgroundCube.fragmentShader,side:Ue,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(P,w,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),Qn.copy(_.backgroundRotation),Qn.x*=-1,Qn.y*=-1,Qn.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(Qn.y*=-1,Qn.z*=-1),h.material.uniforms.envMap.value=S,h.material.uniforms.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=_.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Em.makeRotationFromEuler(Qn)),h.material.toneMapped=Qt.getTransfer(S.colorSpace)!==se,(u!==S||f!==S.version||d!==s.toneMapping)&&(h.material.needsUpdate=!0,u=S,f=S.version,d=s.toneMapping),h.layers.enableAll(),v.unshift(h,h.geometry,h.material,0,0,null)):S&&S.isTexture&&(c===void 0&&(c=new at(new Be(2,2),new Dn({name:"BackgroundMaterial",uniforms:Ji(mn.background.uniforms),vertexShader:mn.background.vertexShader,fragmentShader:mn.background.fragmentShader,side:Xn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=S,c.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,c.material.toneMapped=Qt.getTransfer(S.colorSpace)!==se,S.matrixAutoUpdate===!0&&S.updateMatrix(),c.material.uniforms.uvTransform.value.copy(S.matrix),(u!==S||f!==S.version||d!==s.toneMapping)&&(c.material.needsUpdate=!0,u=S,f=S.version,d=s.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null))}function p(v,_){v.getRGB(Zs,Qc(s)),n.buffers.color.setClear(Zs.r,Zs.g,Zs.b,_,a)}return{getClearColor:function(){return o},setClearColor:function(v,_=1){o.set(v),l=_,p(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(v){l=v,p(o,l)},render:x,addToRenderList:m}}function Cm(s,t){const e=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=f(null);let r=i,a=!1;function o(y,C,U,z,G){let q=!1;const W=u(z,U,C);r!==W&&(r=W,c(r.object)),q=d(y,z,U,G),q&&g(y,z,U,G),G!==null&&t.update(G,s.ELEMENT_ARRAY_BUFFER),(q||a)&&(a=!1,S(y,C,U,z),G!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,t.get(G).buffer))}function l(){return s.createVertexArray()}function c(y){return s.bindVertexArray(y)}function h(y){return s.deleteVertexArray(y)}function u(y,C,U){const z=U.wireframe===!0;let G=n[y.id];G===void 0&&(G={},n[y.id]=G);let q=G[C.id];q===void 0&&(q={},G[C.id]=q);let W=q[z];return W===void 0&&(W=f(l()),q[z]=W),W}function f(y){const C=[],U=[],z=[];for(let G=0;G<e;G++)C[G]=0,U[G]=0,z[G]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:C,enabledAttributes:U,attributeDivisors:z,object:y,attributes:{},index:null}}function d(y,C,U,z){const G=r.attributes,q=C.attributes;let W=0;const Z=U.getAttributes();for(const O in Z)if(Z[O].location>=0){const ot=G[O];let ft=q[O];if(ft===void 0&&(O==="instanceMatrix"&&y.instanceMatrix&&(ft=y.instanceMatrix),O==="instanceColor"&&y.instanceColor&&(ft=y.instanceColor)),ot===void 0||ot.attribute!==ft||ft&&ot.data!==ft.data)return!0;W++}return r.attributesNum!==W||r.index!==z}function g(y,C,U,z){const G={},q=C.attributes;let W=0;const Z=U.getAttributes();for(const O in Z)if(Z[O].location>=0){let ot=q[O];ot===void 0&&(O==="instanceMatrix"&&y.instanceMatrix&&(ot=y.instanceMatrix),O==="instanceColor"&&y.instanceColor&&(ot=y.instanceColor));const ft={};ft.attribute=ot,ot&&ot.data&&(ft.data=ot.data),G[O]=ft,W++}r.attributes=G,r.attributesNum=W,r.index=z}function x(){const y=r.newAttributes;for(let C=0,U=y.length;C<U;C++)y[C]=0}function m(y){p(y,0)}function p(y,C){const U=r.newAttributes,z=r.enabledAttributes,G=r.attributeDivisors;U[y]=1,z[y]===0&&(s.enableVertexAttribArray(y),z[y]=1),G[y]!==C&&(s.vertexAttribDivisor(y,C),G[y]=C)}function v(){const y=r.newAttributes,C=r.enabledAttributes;for(let U=0,z=C.length;U<z;U++)C[U]!==y[U]&&(s.disableVertexAttribArray(U),C[U]=0)}function _(y,C,U,z,G,q,W){W===!0?s.vertexAttribIPointer(y,C,U,G,q):s.vertexAttribPointer(y,C,U,z,G,q)}function S(y,C,U,z){x();const G=z.attributes,q=U.getAttributes(),W=C.defaultAttributeValues;for(const Z in q){const O=q[Z];if(O.location>=0){let st=G[Z];if(st===void 0&&(Z==="instanceMatrix"&&y.instanceMatrix&&(st=y.instanceMatrix),Z==="instanceColor"&&y.instanceColor&&(st=y.instanceColor)),st!==void 0){const ot=st.normalized,ft=st.itemSize,pt=t.get(st);if(pt===void 0)continue;const ct=pt.buffer,F=pt.type,X=pt.bytesPerElement,it=F===s.INT||F===s.UNSIGNED_INT||st.gpuType===mo;if(st.isInterleavedBufferAttribute){const rt=st.data,Et=rt.stride,Pt=st.offset;if(rt.isInstancedInterleavedBuffer){for(let kt=0;kt<O.locationSize;kt++)p(O.location+kt,rt.meshPerAttribute);y.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let kt=0;kt<O.locationSize;kt++)m(O.location+kt);s.bindBuffer(s.ARRAY_BUFFER,ct);for(let kt=0;kt<O.locationSize;kt++)_(O.location+kt,ft/O.locationSize,F,ot,Et*X,(Pt+ft/O.locationSize*kt)*X,it)}else{if(st.isInstancedBufferAttribute){for(let rt=0;rt<O.locationSize;rt++)p(O.location+rt,st.meshPerAttribute);y.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=st.meshPerAttribute*st.count)}else for(let rt=0;rt<O.locationSize;rt++)m(O.location+rt);s.bindBuffer(s.ARRAY_BUFFER,ct);for(let rt=0;rt<O.locationSize;rt++)_(O.location+rt,ft/O.locationSize,F,ot,ft*X,ft/O.locationSize*rt*X,it)}}else if(W!==void 0){const ot=W[Z];if(ot!==void 0)switch(ot.length){case 2:s.vertexAttrib2fv(O.location,ot);break;case 3:s.vertexAttrib3fv(O.location,ot);break;case 4:s.vertexAttrib4fv(O.location,ot);break;default:s.vertexAttrib1fv(O.location,ot)}}}}v()}function P(){L();for(const y in n){const C=n[y];for(const U in C){const z=C[U];for(const G in z)h(z[G].object),delete z[G];delete C[U]}delete n[y]}}function w(y){if(n[y.id]===void 0)return;const C=n[y.id];for(const U in C){const z=C[U];for(const G in z)h(z[G].object),delete z[G];delete C[U]}delete n[y.id]}function E(y){for(const C in n){const U=n[C];if(U[y.id]===void 0)continue;const z=U[y.id];for(const G in z)h(z[G].object),delete z[G];delete U[y.id]}}function L(){T(),a=!0,r!==i&&(r=i,c(r.object))}function T(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:L,resetDefaultState:T,dispose:P,releaseStatesOfGeometry:w,releaseStatesOfProgram:E,initAttributes:x,enableAttribute:m,disableUnusedAttributes:v}}function Rm(s,t,e){let n;function i(c){n=c}function r(c,h){s.drawArrays(n,c,h),e.update(h,n,1)}function a(c,h,u){u!==0&&(s.drawArraysInstanced(n,c,h,u),e.update(h,n,u))}function o(c,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,u);let d=0;for(let g=0;g<u;g++)d+=h[g];e.update(d,n,1)}function l(c,h,u,f){if(u===0)return;const d=t.get("WEBGL_multi_draw");if(d===null)for(let g=0;g<c.length;g++)a(c[g],h[g],f[g]);else{d.multiDrawArraysInstancedWEBGL(n,c,0,h,0,f,0,u);let g=0;for(let x=0;x<u;x++)g+=h[x];for(let x=0;x<f.length;x++)e.update(g,n,f[x])}}this.setMode=i,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function Pm(s,t,e,n){let i;function r(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const w=t.get("EXT_texture_filter_anisotropic");i=s.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(w){return!(w!==hn&&n.convert(w)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(w){const E=w===Ss&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(w!==Ln&&n.convert(w)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE)&&w!==xn&&!E)}function l(w){if(w==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const u=e.logarithmicDepthBuffer===!0,f=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),d=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),g=s.getParameter(s.MAX_TEXTURE_SIZE),x=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),m=s.getParameter(s.MAX_VERTEX_ATTRIBS),p=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),v=s.getParameter(s.MAX_VARYING_VECTORS),_=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),S=d>0,P=s.getParameter(s.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,maxTextures:f,maxVertexTextures:d,maxTextureSize:g,maxCubemapSize:x,maxAttributes:m,maxVertexUniforms:p,maxVaryings:v,maxFragmentUniforms:_,vertexTextures:S,maxSamples:P}}function Lm(s){const t=this;let e=null,n=0,i=!1,r=!1;const a=new ii,o=new Ot,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){const d=u.length!==0||f||n!==0||i;return i=f,n=u.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){e=h(u,f,0)},this.setState=function(u,f,d){const g=u.clippingPlanes,x=u.clipIntersection,m=u.clipShadows,p=s.get(u);if(!i||g===null||g.length===0||r&&!m)r?h(null):c();else{const v=r?0:n,_=v*4;let S=p.clippingState||null;l.value=S,S=h(g,f,_,d);for(let P=0;P!==_;++P)S[P]=e[P];p.clippingState=S,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,f,d,g){const x=u!==null?u.length:0;let m=null;if(x!==0){if(m=l.value,g!==!0||m===null){const p=d+x*4,v=f.matrixWorldInverse;o.getNormalMatrix(v),(m===null||m.length<p)&&(m=new Float32Array(p));for(let _=0,S=d;_!==x;++_,S+=4)a.copy(u[_]).applyMatrix4(v,o),a.normal.toArray(m,S),m[S+3]=a.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,m}}function Dm(s){let t=new WeakMap;function e(a,o){return o===Ta?a.mapping=Yi:o===wa&&(a.mapping=Ki),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===Ta||o===wa)if(t.has(a)){const l=t.get(a).texture;return e(l,a.mapping)}else{const l=a.image;if(l&&l.height>0){const c=new Hu(l.height);return c.fromEquirectangularTexture(s,a),t.set(a,c),a.addEventListener("dispose",i),e(c.texture,a.mapping)}else return null}}return a}function i(a){const o=a.target;o.removeEventListener("dispose",i);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class wo extends th{constructor(t=-1,e=1,n=1,i=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let r=n-t,a=n+t,o=i+e,l=i-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Gi=4,Rl=[.125,.215,.35,.446,.526,.582],hi=20,aa=new wo,Pl=new Bt;let oa=null,la=0,ca=0,ha=!1;const si=(1+Math.sqrt(5))/2,Oi=1/si,Ll=[new D(-si,Oi,0),new D(si,Oi,0),new D(-Oi,0,si),new D(Oi,0,si),new D(0,si,-Oi),new D(0,si,Oi),new D(-1,1,-1),new D(1,1,-1),new D(-1,1,1),new D(1,1,1)];class Dl{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,i=100){oa=this._renderer.getRenderTarget(),la=this._renderer.getActiveCubeFace(),ca=this._renderer.getActiveMipmapLevel(),ha=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,i,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ul(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=kl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(oa,la,ca),this._renderer.xr.enabled=ha,t.scissorTest=!1,js(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Yi||t.mapping===Ki?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),oa=this._renderer.getRenderTarget(),la=this._renderer.getActiveCubeFace(),ca=this._renderer.getActiveMipmapLevel(),ha=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:tn,minFilter:tn,generateMipmaps:!1,type:Ss,format:hn,colorSpace:$n,depthBuffer:!1},i=Il(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Il(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Im(r)),this._blurMaterial=km(r,t,e)}return i}_compileMaterial(t){const e=new at(this._lodPlanes[0],t);this._renderer.compile(e,aa)}_sceneToCubeUV(t,e,n,i){const o=new Qe(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,f=h.toneMapping;h.getClearColor(Pl),h.toneMapping=Wn,h.autoClear=!1;const d=new Ce({name:"PMREM.Background",side:Ue,depthWrite:!1,depthTest:!1}),g=new at(new vn,d);let x=!1;const m=t.background;m?m.isColor&&(d.color.copy(m),t.background=null,x=!0):(d.color.copy(Pl),x=!0);for(let p=0;p<6;p++){const v=p%3;v===0?(o.up.set(0,l[p],0),o.lookAt(c[p],0,0)):v===1?(o.up.set(0,0,l[p]),o.lookAt(0,c[p],0)):(o.up.set(0,l[p],0),o.lookAt(0,0,c[p]));const _=this._cubeSize;js(i,v*_,p>2?_:0,_,_),h.setRenderTarget(i),x&&h.render(g,o),h.render(t,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=f,h.autoClear=u,t.background=m}_textureToCubeUV(t,e){const n=this._renderer,i=t.mapping===Yi||t.mapping===Ki;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ul()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=kl());const r=i?this._cubemapMaterial:this._equirectMaterial,a=new at(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=t;const l=this._cubeSize;js(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,aa)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const i=this._lodPlanes.length;for(let r=1;r<i;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=Ll[(i-r-1)%Ll.length];this._blur(t,r-1,r,a,o)}e.autoClear=n}_blur(t,e,n,i,r){const a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,i,"latitudinal",r),this._halfBlur(a,t,n,n,i,"longitudinal",r)}_halfBlur(t,e,n,i,r,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,u=new at(this._lodPlanes[i],c),f=c.uniforms,d=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*hi-1),x=r/g,m=isFinite(r)?1+Math.floor(h*x):hi;m>hi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${hi}`);const p=[];let v=0;for(let E=0;E<hi;++E){const L=E/x,T=Math.exp(-L*L/2);p.push(T),E===0?v+=T:E<m&&(v+=2*T)}for(let E=0;E<p.length;E++)p[E]=p[E]/v;f.envMap.value=t.texture,f.samples.value=m,f.weights.value=p,f.latitudinal.value=a==="latitudinal",o&&(f.poleAxis.value=o);const{_lodMax:_}=this;f.dTheta.value=g,f.mipInt.value=_-n;const S=this._sizeLods[i],P=3*S*(i>_-Gi?i-_+Gi:0),w=4*(this._cubeSize-S);js(e,P,w,3*S,2*S),l.setRenderTarget(e),l.render(u,aa)}}function Im(s){const t=[],e=[],n=[];let i=s;const r=s-Gi+1+Rl.length;for(let a=0;a<r;a++){const o=Math.pow(2,i);e.push(o);let l=1/o;a>s-Gi?l=Rl[a-s+Gi-1]:a===0&&(l=0),n.push(l);const c=1/(o-2),h=-c,u=1+c,f=[h,h,u,h,u,u,h,h,u,u,h,u],d=6,g=6,x=3,m=2,p=1,v=new Float32Array(x*g*d),_=new Float32Array(m*g*d),S=new Float32Array(p*g*d);for(let w=0;w<d;w++){const E=w%3*2/3-1,L=w>2?0:-1,T=[E,L,0,E+2/3,L,0,E+2/3,L+1,0,E,L,0,E+2/3,L+1,0,E,L+1,0];v.set(T,x*g*w),_.set(f,m*g*w);const y=[w,w,w,w,w,w];S.set(y,p*g*w)}const P=new ze;P.setAttribute("position",new Ne(v,x)),P.setAttribute("uv",new Ne(_,m)),P.setAttribute("faceIndex",new Ne(S,p)),t.push(P),i>Gi&&i--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Il(s,t,e){const n=new qn(s,t,e);return n.texture.mapping=Cr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function js(s,t,e,n,i){s.viewport.set(t,e,n,i),s.scissor.set(t,e,n,i)}function km(s,t,e){const n=new Float32Array(hi),i=new D(0,1,0);return new Dn({name:"SphericalGaussianBlur",defines:{n:hi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Eo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function kl(){return new Dn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Eo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function Ul(){return new Dn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Eo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Vn,depthTest:!1,depthWrite:!1})}function Eo(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Um(s){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){const l=o.mapping,c=l===Ta||l===wa,h=l===Yi||l===Ki;if(c||h){let u=t.get(o);const f=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==f)return e===null&&(e=new Dl(s)),u=c?e.fromEquirectangular(o,u):e.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,t.set(o,u),u.texture;if(u!==void 0)return u.texture;{const d=o.image;return c&&d&&d.height>0||h&&d&&i(d)?(e===null&&(e=new Dl(s)),u=c?e.fromEquirectangular(o):e.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,t.set(o,u),o.addEventListener("dispose",r),u.texture):null}}}return o}function i(o){let l=0;const c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function r(o){const l=o.target;l.removeEventListener("dispose",r);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:a}}function Nm(s){const t={};function e(n){if(t[n]!==void 0)return t[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const i=e(n);return i===null&&Xc("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function zm(s,t,e,n){const i={},r=new WeakMap;function a(u){const f=u.target;f.index!==null&&t.remove(f.index);for(const g in f.attributes)t.remove(f.attributes[g]);for(const g in f.morphAttributes){const x=f.morphAttributes[g];for(let m=0,p=x.length;m<p;m++)t.remove(x[m])}f.removeEventListener("dispose",a),delete i[f.id];const d=r.get(f);d&&(t.remove(d),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,e.memory.geometries--}function o(u,f){return i[f.id]===!0||(f.addEventListener("dispose",a),i[f.id]=!0,e.memory.geometries++),f}function l(u){const f=u.attributes;for(const g in f)t.update(f[g],s.ARRAY_BUFFER);const d=u.morphAttributes;for(const g in d){const x=d[g];for(let m=0,p=x.length;m<p;m++)t.update(x[m],s.ARRAY_BUFFER)}}function c(u){const f=[],d=u.index,g=u.attributes.position;let x=0;if(d!==null){const v=d.array;x=d.version;for(let _=0,S=v.length;_<S;_+=3){const P=v[_+0],w=v[_+1],E=v[_+2];f.push(P,w,w,E,E,P)}}else if(g!==void 0){const v=g.array;x=g.version;for(let _=0,S=v.length/3-1;_<S;_+=3){const P=_+0,w=_+1,E=_+2;f.push(P,w,w,E,E,P)}}else return;const m=new(Wc(f)?Jc:jc)(f,1);m.version=x;const p=r.get(u);p&&t.remove(p),r.set(u,m)}function h(u){const f=r.get(u);if(f){const d=u.index;d!==null&&f.version<d.version&&c(u)}else c(u);return r.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function Fm(s,t,e){let n;function i(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function l(f,d){s.drawElements(n,d,r,f*a),e.update(d,n,1)}function c(f,d,g){g!==0&&(s.drawElementsInstanced(n,d,r,f*a,g),e.update(d,n,g))}function h(f,d,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,f,0,g);let m=0;for(let p=0;p<g;p++)m+=d[p];e.update(m,n,1)}function u(f,d,g,x){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<f.length;p++)c(f[p]/a,d[p],x[p]);else{m.multiDrawElementsInstancedWEBGL(n,d,0,r,f,0,x,0,g);let p=0;for(let v=0;v<g;v++)p+=d[v];for(let v=0;v<x.length;v++)e.update(p,n,x[v])}}this.setMode=i,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function Om(s){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case s.TRIANGLES:e.triangles+=o*(r/3);break;case s.LINES:e.lines+=o*(r/2);break;case s.LINE_STRIP:e.lines+=o*(r-1);break;case s.LINE_LOOP:e.lines+=o*r;break;case s.POINTS:e.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function Bm(s,t,e){const n=new WeakMap,i=new ve;function r(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0;let f=n.get(o);if(f===void 0||f.count!==u){let T=function(){E.dispose(),n.delete(o),o.removeEventListener("dispose",T)};f!==void 0&&f.texture.dispose();const d=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,x=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],v=o.morphAttributes.color||[];let _=0;d===!0&&(_=1),g===!0&&(_=2),x===!0&&(_=3);let S=o.attributes.position.count*_,P=1;S>t.maxTextureSize&&(P=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);const w=new Float32Array(S*P*4*u),E=new $c(w,S,P,u);E.type=xn,E.needsUpdate=!0;const L=_*4;for(let y=0;y<u;y++){const C=m[y],U=p[y],z=v[y],G=S*P*4*y;for(let q=0;q<C.count;q++){const W=q*L;d===!0&&(i.fromBufferAttribute(C,q),w[G+W+0]=i.x,w[G+W+1]=i.y,w[G+W+2]=i.z,w[G+W+3]=0),g===!0&&(i.fromBufferAttribute(U,q),w[G+W+4]=i.x,w[G+W+5]=i.y,w[G+W+6]=i.z,w[G+W+7]=0),x===!0&&(i.fromBufferAttribute(z,q),w[G+W+8]=i.x,w[G+W+9]=i.y,w[G+W+10]=i.z,w[G+W+11]=z.itemSize===4?i.w:1)}}f={count:u,texture:E,size:new gt(S,P)},n.set(o,f),o.addEventListener("dispose",T)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(s,"morphTexture",a.morphTexture,e);else{let d=0;for(let x=0;x<c.length;x++)d+=c[x];const g=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(s,"morphTargetBaseInfluence",g),l.getUniforms().setValue(s,"morphTargetInfluences",c)}l.getUniforms().setValue(s,"morphTargetsTexture",f.texture,e),l.getUniforms().setValue(s,"morphTargetsTextureSize",f.size)}return{update:r}}function Gm(s,t,e,n){let i=new WeakMap;function r(l){const c=n.render.frame,h=l.geometry,u=t.get(l,h);if(i.get(u)!==c&&(t.update(u),i.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),i.get(l)!==c&&(e.update(l.instanceMatrix,s.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,s.ARRAY_BUFFER),i.set(l,c))),l.isSkinnedMesh){const f=l.skeleton;i.get(f)!==c&&(f.update(),i.set(f,c))}return u}function a(){i=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:a}}class ih extends Le{constructor(t,e,n,i,r,a,o,l,c,h=qi){if(h!==qi&&h!==ji)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===qi&&(n=xi),n===void 0&&h===ji&&(n=Zi),super(null,i,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:ke,this.minFilter=l!==void 0?l:ke,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const sh=new Le,Nl=new ih(1,1),rh=new $c,ah=new Eu,oh=new eh,zl=[],Fl=[],Ol=new Float32Array(16),Bl=new Float32Array(9),Gl=new Float32Array(4);function es(s,t,e){const n=s[0];if(n<=0||n>0)return s;const i=t*e;let r=zl[i];if(r===void 0&&(r=new Float32Array(i),zl[i]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,s[a].toArray(r,o)}return r}function _e(s,t){if(s.length!==t.length)return!1;for(let e=0,n=s.length;e<n;e++)if(s[e]!==t[e])return!1;return!0}function ye(s,t){for(let e=0,n=t.length;e<n;e++)s[e]=t[e]}function Pr(s,t){let e=Fl[t];e===void 0&&(e=new Int32Array(t),Fl[t]=e);for(let n=0;n!==t;++n)e[n]=s.allocateTextureUnit();return e}function Hm(s,t){const e=this.cache;e[0]!==t&&(s.uniform1f(this.addr,t),e[0]=t)}function Vm(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(_e(e,t))return;s.uniform2fv(this.addr,t),ye(e,t)}}function Wm(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(s.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(_e(e,t))return;s.uniform3fv(this.addr,t),ye(e,t)}}function Xm(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(_e(e,t))return;s.uniform4fv(this.addr,t),ye(e,t)}}function qm(s,t){const e=this.cache,n=t.elements;if(n===void 0){if(_e(e,t))return;s.uniformMatrix2fv(this.addr,!1,t),ye(e,t)}else{if(_e(e,n))return;Gl.set(n),s.uniformMatrix2fv(this.addr,!1,Gl),ye(e,n)}}function $m(s,t){const e=this.cache,n=t.elements;if(n===void 0){if(_e(e,t))return;s.uniformMatrix3fv(this.addr,!1,t),ye(e,t)}else{if(_e(e,n))return;Bl.set(n),s.uniformMatrix3fv(this.addr,!1,Bl),ye(e,n)}}function Ym(s,t){const e=this.cache,n=t.elements;if(n===void 0){if(_e(e,t))return;s.uniformMatrix4fv(this.addr,!1,t),ye(e,t)}else{if(_e(e,n))return;Ol.set(n),s.uniformMatrix4fv(this.addr,!1,Ol),ye(e,n)}}function Km(s,t){const e=this.cache;e[0]!==t&&(s.uniform1i(this.addr,t),e[0]=t)}function Zm(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(_e(e,t))return;s.uniform2iv(this.addr,t),ye(e,t)}}function jm(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(_e(e,t))return;s.uniform3iv(this.addr,t),ye(e,t)}}function Jm(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(_e(e,t))return;s.uniform4iv(this.addr,t),ye(e,t)}}function Qm(s,t){const e=this.cache;e[0]!==t&&(s.uniform1ui(this.addr,t),e[0]=t)}function t0(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(_e(e,t))return;s.uniform2uiv(this.addr,t),ye(e,t)}}function e0(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(_e(e,t))return;s.uniform3uiv(this.addr,t),ye(e,t)}}function n0(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(_e(e,t))return;s.uniform4uiv(this.addr,t),ye(e,t)}}function i0(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?(Nl.compareFunction=Vc,r=Nl):r=sh,e.setTexture2D(t||r,i)}function s0(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||ah,i)}function r0(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTextureCube(t||oh,i)}function a0(s,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||rh,i)}function o0(s){switch(s){case 5126:return Hm;case 35664:return Vm;case 35665:return Wm;case 35666:return Xm;case 35674:return qm;case 35675:return $m;case 35676:return Ym;case 5124:case 35670:return Km;case 35667:case 35671:return Zm;case 35668:case 35672:return jm;case 35669:case 35673:return Jm;case 5125:return Qm;case 36294:return t0;case 36295:return e0;case 36296:return n0;case 35678:case 36198:case 36298:case 36306:case 35682:return i0;case 35679:case 36299:case 36307:return s0;case 35680:case 36300:case 36308:case 36293:return r0;case 36289:case 36303:case 36311:case 36292:return a0}}function l0(s,t){s.uniform1fv(this.addr,t)}function c0(s,t){const e=es(t,this.size,2);s.uniform2fv(this.addr,e)}function h0(s,t){const e=es(t,this.size,3);s.uniform3fv(this.addr,e)}function d0(s,t){const e=es(t,this.size,4);s.uniform4fv(this.addr,e)}function u0(s,t){const e=es(t,this.size,4);s.uniformMatrix2fv(this.addr,!1,e)}function f0(s,t){const e=es(t,this.size,9);s.uniformMatrix3fv(this.addr,!1,e)}function p0(s,t){const e=es(t,this.size,16);s.uniformMatrix4fv(this.addr,!1,e)}function m0(s,t){s.uniform1iv(this.addr,t)}function g0(s,t){s.uniform2iv(this.addr,t)}function x0(s,t){s.uniform3iv(this.addr,t)}function v0(s,t){s.uniform4iv(this.addr,t)}function _0(s,t){s.uniform1uiv(this.addr,t)}function y0(s,t){s.uniform2uiv(this.addr,t)}function M0(s,t){s.uniform3uiv(this.addr,t)}function S0(s,t){s.uniform4uiv(this.addr,t)}function b0(s,t,e){const n=this.cache,i=t.length,r=Pr(e,i);_e(n,r)||(s.uniform1iv(this.addr,r),ye(n,r));for(let a=0;a!==i;++a)e.setTexture2D(t[a]||sh,r[a])}function T0(s,t,e){const n=this.cache,i=t.length,r=Pr(e,i);_e(n,r)||(s.uniform1iv(this.addr,r),ye(n,r));for(let a=0;a!==i;++a)e.setTexture3D(t[a]||ah,r[a])}function w0(s,t,e){const n=this.cache,i=t.length,r=Pr(e,i);_e(n,r)||(s.uniform1iv(this.addr,r),ye(n,r));for(let a=0;a!==i;++a)e.setTextureCube(t[a]||oh,r[a])}function E0(s,t,e){const n=this.cache,i=t.length,r=Pr(e,i);_e(n,r)||(s.uniform1iv(this.addr,r),ye(n,r));for(let a=0;a!==i;++a)e.setTexture2DArray(t[a]||rh,r[a])}function A0(s){switch(s){case 5126:return l0;case 35664:return c0;case 35665:return h0;case 35666:return d0;case 35674:return u0;case 35675:return f0;case 35676:return p0;case 5124:case 35670:return m0;case 35667:case 35671:return g0;case 35668:case 35672:return x0;case 35669:case 35673:return v0;case 5125:return _0;case 36294:return y0;case 36295:return M0;case 36296:return S0;case 35678:case 36198:case 36298:case 36306:case 35682:return b0;case 35679:case 36299:case 36307:return T0;case 35680:case 36300:case 36308:case 36293:return w0;case 36289:case 36303:case 36311:case 36292:return E0}}class C0{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=o0(e.type)}}class R0{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=A0(e.type)}}class P0{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const i=this.seq;for(let r=0,a=i.length;r!==a;++r){const o=i[r];o.setValue(t,e[o.id],n)}}}const da=/(\w+)(\])?(\[|\.)?/g;function Hl(s,t){s.seq.push(t),s.map[t.id]=t}function L0(s,t,e){const n=s.name,i=n.length;for(da.lastIndex=0;;){const r=da.exec(n),a=da.lastIndex;let o=r[1];const l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===i){Hl(e,c===void 0?new C0(o,s,t):new R0(o,s,t));break}else{let u=e.map[o];u===void 0&&(u=new P0(o),Hl(e,u)),e=u}}}class cr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){const r=t.getActiveUniform(e,i),a=t.getUniformLocation(e,r.name);L0(r,a,this)}}setValue(t,e,n,i){const r=this.map[e];r!==void 0&&r.setValue(t,n,i)}setOptional(t,e,n){const i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let r=0,a=e.length;r!==a;++r){const o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,i)}}static seqWithValue(t,e){const n=[];for(let i=0,r=t.length;i!==r;++i){const a=t[i];a.id in e&&n.push(a)}return n}}function Vl(s,t,e){const n=s.createShader(t);return s.shaderSource(n,e),s.compileShader(n),n}const D0=37297;let I0=0;function k0(s,t){const e=s.split(`
`),n=[],i=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=i;a<r;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}function U0(s){const t=Qt.getPrimaries(Qt.workingColorSpace),e=Qt.getPrimaries(s);let n;switch(t===e?n="":t===yr&&e===_r?n="LinearDisplayP3ToLinearSRGB":t===_r&&e===yr&&(n="LinearSRGBToLinearDisplayP3"),s){case $n:case Rr:return[n,"LinearTransferOETF"];case cn:case bo:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",s),[n,"LinearTransferOETF"]}}function Wl(s,t,e){const n=s.getShaderParameter(t,s.COMPILE_STATUS),i=s.getShaderInfoLog(t).trim();if(n&&i==="")return"";const r=/ERROR: 0:(\d+)/.exec(i);if(r){const a=parseInt(r[1]);return e.toUpperCase()+`

`+i+`

`+k0(s.getShaderSource(t),a)}else return i}function N0(s,t){const e=U0(t);return`vec4 ${s}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function z0(s,t){let e;switch(t){case eu:e="Linear";break;case nu:e="Reinhard";break;case iu:e="OptimizedCineon";break;case Dc:e="ACESFilmic";break;case ru:e="AgX";break;case au:e="Neutral";break;case su:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+s+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}function F0(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ds).join(`
`)}function O0(s){const t=[];for(const e in s){const n=s[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function B0(s,t){const e={},n=s.getProgramParameter(t,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const r=s.getActiveAttrib(t,i),a=r.name;let o=1;r.type===s.FLOAT_MAT2&&(o=2),r.type===s.FLOAT_MAT3&&(o=3),r.type===s.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:s.getAttribLocation(t,a),locationSize:o}}return e}function ds(s){return s!==""}function Xl(s,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function ql(s,t){return s.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const G0=/^[ \t]*#include +<([\w\d./]+)>/gm;function to(s){return s.replace(G0,V0)}const H0=new Map;function V0(s,t){let e=Ft[t];if(e===void 0){const n=H0.get(t);if(n!==void 0)e=Ft[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return to(e)}const W0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function $l(s){return s.replace(W0,X0)}function X0(s,t,e,n){let i="";for(let r=parseInt(t);r<parseInt(e);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Yl(s){let t=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?t+=`
#define HIGH_PRECISION`:s.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function q0(s){let t="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===Pc?t="SHADOWMAP_TYPE_PCF":s.shadowMapType===Lc?t="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===An&&(t="SHADOWMAP_TYPE_VSM"),t}function $0(s){let t="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case Yi:case Ki:t="ENVMAP_TYPE_CUBE";break;case Cr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Y0(s){let t="ENVMAP_MODE_REFLECTION";if(s.envMap)switch(s.envMapMode){case Ki:t="ENVMAP_MODE_REFRACTION";break}return t}function K0(s){let t="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case po:t="ENVMAP_BLENDING_MULTIPLY";break;case Qd:t="ENVMAP_BLENDING_MIX";break;case tu:t="ENVMAP_BLENDING_ADD";break}return t}function Z0(s){const t=s.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function j0(s,t,e,n){const i=s.getContext(),r=e.defines;let a=e.vertexShader,o=e.fragmentShader;const l=q0(e),c=$0(e),h=Y0(e),u=K0(e),f=Z0(e),d=F0(e),g=O0(r),x=i.createProgram();let m,p,v=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(ds).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(ds).join(`
`),p.length>0&&(p+=`
`)):(m=[Yl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ds).join(`
`),p=[Yl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Wn?"#define TONE_MAPPING":"",e.toneMapping!==Wn?Ft.tonemapping_pars_fragment:"",e.toneMapping!==Wn?z0("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Ft.colorspace_pars_fragment,N0("linearToOutputTexel",e.outputColorSpace),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(ds).join(`
`)),a=to(a),a=Xl(a,e),a=ql(a,e),o=to(o),o=Xl(o,e),o=ql(o,e),a=$l(a),o=$l(o),e.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===cl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===cl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const _=v+m+a,S=v+p+o,P=Vl(i,i.VERTEX_SHADER,_),w=Vl(i,i.FRAGMENT_SHADER,S);i.attachShader(x,P),i.attachShader(x,w),e.index0AttributeName!==void 0?i.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&i.bindAttribLocation(x,0,"position"),i.linkProgram(x);function E(C){if(s.debug.checkShaderErrors){const U=i.getProgramInfoLog(x).trim(),z=i.getShaderInfoLog(P).trim(),G=i.getShaderInfoLog(w).trim();let q=!0,W=!0;if(i.getProgramParameter(x,i.LINK_STATUS)===!1)if(q=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,x,P,w);else{const Z=Wl(i,P,"vertex"),O=Wl(i,w,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(x,i.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+U+`
`+Z+`
`+O)}else U!==""?console.warn("THREE.WebGLProgram: Program Info Log:",U):(z===""||G==="")&&(W=!1);W&&(C.diagnostics={runnable:q,programLog:U,vertexShader:{log:z,prefix:m},fragmentShader:{log:G,prefix:p}})}i.deleteShader(P),i.deleteShader(w),L=new cr(i,x),T=B0(i,x)}let L;this.getUniforms=function(){return L===void 0&&E(this),L};let T;this.getAttributes=function(){return T===void 0&&E(this),T};let y=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return y===!1&&(y=i.getProgramParameter(x,D0)),y},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=I0++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=P,this.fragmentShader=w,this}let J0=0;class Q0{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,i=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(i)===!1&&(a.add(i),i.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new tg(t),e.set(t,n)),n}}class tg{constructor(t){this.id=J0++,this.code=t,this.usedTimes=0}}function eg(s,t,e,n,i,r,a){const o=new Kc,l=new Q0,c=new Set,h=[],u=i.logarithmicDepthBuffer,f=i.vertexTextures;let d=i.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(T){return c.add(T),T===0?"uv":`uv${T}`}function m(T,y,C,U,z){const G=U.fog,q=z.geometry,W=T.isMeshStandardMaterial?U.environment:null,Z=(T.isMeshStandardMaterial?e:t).get(T.envMap||W),O=Z&&Z.mapping===Cr?Z.image.height:null,st=g[T.type];T.precision!==null&&(d=i.getMaxPrecision(T.precision),d!==T.precision&&console.warn("THREE.WebGLProgram.getParameters:",T.precision,"not supported, using",d,"instead."));const ot=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,ft=ot!==void 0?ot.length:0;let pt=0;q.morphAttributes.position!==void 0&&(pt=1),q.morphAttributes.normal!==void 0&&(pt=2),q.morphAttributes.color!==void 0&&(pt=3);let ct,F,X,it;if(st){const qt=mn[st];ct=qt.vertexShader,F=qt.fragmentShader}else ct=T.vertexShader,F=T.fragmentShader,l.update(T),X=l.getVertexShaderID(T),it=l.getFragmentShaderID(T);const rt=s.getRenderTarget(),Et=z.isInstancedMesh===!0,Pt=z.isBatchedMesh===!0,kt=!!T.map,ie=!!T.matcap,R=!!Z,de=!!T.aoMap,Jt=!!T.lightMap,te=!!T.bumpMap,bt=!!T.normalMap,ue=!!T.displacementMap,Dt=!!T.emissiveMap,Ut=!!T.metalnessMap,A=!!T.roughnessMap,M=T.anisotropy>0,V=T.clearcoat>0,j=T.dispersion>0,J=T.iridescence>0,K=T.sheen>0,Tt=T.transmission>0,ht=M&&!!T.anisotropyMap,xt=V&&!!T.clearcoatMap,zt=V&&!!T.clearcoatNormalMap,Q=V&&!!T.clearcoatRoughnessMap,mt=J&&!!T.iridescenceMap,Vt=J&&!!T.iridescenceThicknessMap,Lt=K&&!!T.sheenColorMap,vt=K&&!!T.sheenRoughnessMap,It=!!T.specularMap,Gt=!!T.specularColorMap,ae=!!T.specularIntensityMap,I=Tt&&!!T.transmissionMap,tt=Tt&&!!T.thicknessMap,$=!!T.gradientMap,Y=!!T.alphaMap,nt=T.alphaTest>0,At=!!T.alphaHash,Xt=!!T.extensions;let fe=Wn;T.toneMapped&&(rt===null||rt.isXRRenderTarget===!0)&&(fe=s.toneMapping);const be={shaderID:st,shaderType:T.type,shaderName:T.name,vertexShader:ct,fragmentShader:F,defines:T.defines,customVertexShaderID:X,customFragmentShaderID:it,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:d,batching:Pt,batchingColor:Pt&&z._colorsTexture!==null,instancing:Et,instancingColor:Et&&z.instanceColor!==null,instancingMorph:Et&&z.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:rt===null?s.outputColorSpace:rt.isXRRenderTarget===!0?rt.texture.colorSpace:$n,alphaToCoverage:!!T.alphaToCoverage,map:kt,matcap:ie,envMap:R,envMapMode:R&&Z.mapping,envMapCubeUVHeight:O,aoMap:de,lightMap:Jt,bumpMap:te,normalMap:bt,displacementMap:f&&ue,emissiveMap:Dt,normalMapObjectSpace:bt&&T.normalMapType===hu,normalMapTangentSpace:bt&&T.normalMapType===So,metalnessMap:Ut,roughnessMap:A,anisotropy:M,anisotropyMap:ht,clearcoat:V,clearcoatMap:xt,clearcoatNormalMap:zt,clearcoatRoughnessMap:Q,dispersion:j,iridescence:J,iridescenceMap:mt,iridescenceThicknessMap:Vt,sheen:K,sheenColorMap:Lt,sheenRoughnessMap:vt,specularMap:It,specularColorMap:Gt,specularIntensityMap:ae,transmission:Tt,transmissionMap:I,thicknessMap:tt,gradientMap:$,opaque:T.transparent===!1&&T.blending===Xi&&T.alphaToCoverage===!1,alphaMap:Y,alphaTest:nt,alphaHash:At,combine:T.combine,mapUv:kt&&x(T.map.channel),aoMapUv:de&&x(T.aoMap.channel),lightMapUv:Jt&&x(T.lightMap.channel),bumpMapUv:te&&x(T.bumpMap.channel),normalMapUv:bt&&x(T.normalMap.channel),displacementMapUv:ue&&x(T.displacementMap.channel),emissiveMapUv:Dt&&x(T.emissiveMap.channel),metalnessMapUv:Ut&&x(T.metalnessMap.channel),roughnessMapUv:A&&x(T.roughnessMap.channel),anisotropyMapUv:ht&&x(T.anisotropyMap.channel),clearcoatMapUv:xt&&x(T.clearcoatMap.channel),clearcoatNormalMapUv:zt&&x(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Q&&x(T.clearcoatRoughnessMap.channel),iridescenceMapUv:mt&&x(T.iridescenceMap.channel),iridescenceThicknessMapUv:Vt&&x(T.iridescenceThicknessMap.channel),sheenColorMapUv:Lt&&x(T.sheenColorMap.channel),sheenRoughnessMapUv:vt&&x(T.sheenRoughnessMap.channel),specularMapUv:It&&x(T.specularMap.channel),specularColorMapUv:Gt&&x(T.specularColorMap.channel),specularIntensityMapUv:ae&&x(T.specularIntensityMap.channel),transmissionMapUv:I&&x(T.transmissionMap.channel),thicknessMapUv:tt&&x(T.thicknessMap.channel),alphaMapUv:Y&&x(T.alphaMap.channel),vertexTangents:!!q.attributes.tangent&&(bt||M),vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,pointsUvs:z.isPoints===!0&&!!q.attributes.uv&&(kt||Y),fog:!!G,useFog:T.fog===!0,fogExp2:!!G&&G.isFogExp2,flatShading:T.flatShading===!0,sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:u,skinning:z.isSkinnedMesh===!0,morphTargets:q.morphAttributes.position!==void 0,morphNormals:q.morphAttributes.normal!==void 0,morphColors:q.morphAttributes.color!==void 0,morphTargetsCount:ft,morphTextureStride:pt,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:T.dithering,shadowMapEnabled:s.shadowMap.enabled&&C.length>0,shadowMapType:s.shadowMap.type,toneMapping:fe,decodeVideoTexture:kt&&T.map.isVideoTexture===!0&&Qt.getTransfer(T.map.colorSpace)===se,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===Ye,flipSided:T.side===Ue,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:Xt&&T.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Xt&&T.extensions.multiDraw===!0||Pt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return be.vertexUv1s=c.has(1),be.vertexUv2s=c.has(2),be.vertexUv3s=c.has(3),c.clear(),be}function p(T){const y=[];if(T.shaderID?y.push(T.shaderID):(y.push(T.customVertexShaderID),y.push(T.customFragmentShaderID)),T.defines!==void 0)for(const C in T.defines)y.push(C),y.push(T.defines[C]);return T.isRawShaderMaterial===!1&&(v(y,T),_(y,T),y.push(s.outputColorSpace)),y.push(T.customProgramCacheKey),y.join()}function v(T,y){T.push(y.precision),T.push(y.outputColorSpace),T.push(y.envMapMode),T.push(y.envMapCubeUVHeight),T.push(y.mapUv),T.push(y.alphaMapUv),T.push(y.lightMapUv),T.push(y.aoMapUv),T.push(y.bumpMapUv),T.push(y.normalMapUv),T.push(y.displacementMapUv),T.push(y.emissiveMapUv),T.push(y.metalnessMapUv),T.push(y.roughnessMapUv),T.push(y.anisotropyMapUv),T.push(y.clearcoatMapUv),T.push(y.clearcoatNormalMapUv),T.push(y.clearcoatRoughnessMapUv),T.push(y.iridescenceMapUv),T.push(y.iridescenceThicknessMapUv),T.push(y.sheenColorMapUv),T.push(y.sheenRoughnessMapUv),T.push(y.specularMapUv),T.push(y.specularColorMapUv),T.push(y.specularIntensityMapUv),T.push(y.transmissionMapUv),T.push(y.thicknessMapUv),T.push(y.combine),T.push(y.fogExp2),T.push(y.sizeAttenuation),T.push(y.morphTargetsCount),T.push(y.morphAttributeCount),T.push(y.numDirLights),T.push(y.numPointLights),T.push(y.numSpotLights),T.push(y.numSpotLightMaps),T.push(y.numHemiLights),T.push(y.numRectAreaLights),T.push(y.numDirLightShadows),T.push(y.numPointLightShadows),T.push(y.numSpotLightShadows),T.push(y.numSpotLightShadowsWithMaps),T.push(y.numLightProbes),T.push(y.shadowMapType),T.push(y.toneMapping),T.push(y.numClippingPlanes),T.push(y.numClipIntersection),T.push(y.depthPacking)}function _(T,y){o.disableAll(),y.supportsVertexTextures&&o.enable(0),y.instancing&&o.enable(1),y.instancingColor&&o.enable(2),y.instancingMorph&&o.enable(3),y.matcap&&o.enable(4),y.envMap&&o.enable(5),y.normalMapObjectSpace&&o.enable(6),y.normalMapTangentSpace&&o.enable(7),y.clearcoat&&o.enable(8),y.iridescence&&o.enable(9),y.alphaTest&&o.enable(10),y.vertexColors&&o.enable(11),y.vertexAlphas&&o.enable(12),y.vertexUv1s&&o.enable(13),y.vertexUv2s&&o.enable(14),y.vertexUv3s&&o.enable(15),y.vertexTangents&&o.enable(16),y.anisotropy&&o.enable(17),y.alphaHash&&o.enable(18),y.batching&&o.enable(19),y.dispersion&&o.enable(20),y.batchingColor&&o.enable(21),T.push(o.mask),o.disableAll(),y.fog&&o.enable(0),y.useFog&&o.enable(1),y.flatShading&&o.enable(2),y.logarithmicDepthBuffer&&o.enable(3),y.skinning&&o.enable(4),y.morphTargets&&o.enable(5),y.morphNormals&&o.enable(6),y.morphColors&&o.enable(7),y.premultipliedAlpha&&o.enable(8),y.shadowMapEnabled&&o.enable(9),y.doubleSided&&o.enable(10),y.flipSided&&o.enable(11),y.useDepthPacking&&o.enable(12),y.dithering&&o.enable(13),y.transmission&&o.enable(14),y.sheen&&o.enable(15),y.opaque&&o.enable(16),y.pointsUvs&&o.enable(17),y.decodeVideoTexture&&o.enable(18),y.alphaToCoverage&&o.enable(19),T.push(o.mask)}function S(T){const y=g[T.type];let C;if(y){const U=mn[y];C=Fu.clone(U.uniforms)}else C=T.uniforms;return C}function P(T,y){let C;for(let U=0,z=h.length;U<z;U++){const G=h[U];if(G.cacheKey===y){C=G,++C.usedTimes;break}}return C===void 0&&(C=new j0(s,y,T,r),h.push(C)),C}function w(T){if(--T.usedTimes===0){const y=h.indexOf(T);h[y]=h[h.length-1],h.pop(),T.destroy()}}function E(T){l.remove(T)}function L(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:S,acquireProgram:P,releaseProgram:w,releaseShaderCache:E,programs:h,dispose:L}}function ng(){let s=new WeakMap;function t(r){let a=s.get(r);return a===void 0&&(a={},s.set(r,a)),a}function e(r){s.delete(r)}function n(r,a,o){s.get(r)[a]=o}function i(){s=new WeakMap}return{get:t,remove:e,update:n,dispose:i}}function ig(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.material.id!==t.material.id?s.material.id-t.material.id:s.z!==t.z?s.z-t.z:s.id-t.id}function Kl(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.z!==t.z?t.z-s.z:s.id-t.id}function Zl(){const s=[];let t=0;const e=[],n=[],i=[];function r(){t=0,e.length=0,n.length=0,i.length=0}function a(u,f,d,g,x,m){let p=s[t];return p===void 0?(p={id:u.id,object:u,geometry:f,material:d,groupOrder:g,renderOrder:u.renderOrder,z:x,group:m},s[t]=p):(p.id=u.id,p.object=u,p.geometry=f,p.material=d,p.groupOrder=g,p.renderOrder=u.renderOrder,p.z=x,p.group=m),t++,p}function o(u,f,d,g,x,m){const p=a(u,f,d,g,x,m);d.transmission>0?n.push(p):d.transparent===!0?i.push(p):e.push(p)}function l(u,f,d,g,x,m){const p=a(u,f,d,g,x,m);d.transmission>0?n.unshift(p):d.transparent===!0?i.unshift(p):e.unshift(p)}function c(u,f){e.length>1&&e.sort(u||ig),n.length>1&&n.sort(f||Kl),i.length>1&&i.sort(f||Kl)}function h(){for(let u=t,f=s.length;u<f;u++){const d=s[u];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:e,transmissive:n,transparent:i,init:r,push:o,unshift:l,finish:h,sort:c}}function sg(){let s=new WeakMap;function t(n,i){const r=s.get(n);let a;return r===void 0?(a=new Zl,s.set(n,[a])):i>=r.length?(a=new Zl,r.push(a)):a=r[i],a}function e(){s=new WeakMap}return{get:t,dispose:e}}function rg(){const s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new D,color:new Bt};break;case"SpotLight":e={position:new D,direction:new D,color:new Bt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new D,color:new Bt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new D,skyColor:new Bt,groundColor:new Bt};break;case"RectAreaLight":e={color:new Bt,position:new D,halfWidth:new D,halfHeight:new D};break}return s[t.id]=e,e}}}function ag(){const s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new gt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new gt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new gt,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[t.id]=e,e}}}let og=0;function lg(s,t){return(t.castShadow?2:0)-(s.castShadow?2:0)+(t.map?1:0)-(s.map?1:0)}function cg(s){const t=new rg,e=ag(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new D);const i=new D,r=new ne,a=new ne;function o(c){let h=0,u=0,f=0;for(let T=0;T<9;T++)n.probe[T].set(0,0,0);let d=0,g=0,x=0,m=0,p=0,v=0,_=0,S=0,P=0,w=0,E=0;c.sort(lg);for(let T=0,y=c.length;T<y;T++){const C=c[T],U=C.color,z=C.intensity,G=C.distance,q=C.shadow&&C.shadow.map?C.shadow.map.texture:null;if(C.isAmbientLight)h+=U.r*z,u+=U.g*z,f+=U.b*z;else if(C.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(C.sh.coefficients[W],z);E++}else if(C.isDirectionalLight){const W=t.get(C);if(W.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const Z=C.shadow,O=e.get(C);O.shadowIntensity=Z.intensity,O.shadowBias=Z.bias,O.shadowNormalBias=Z.normalBias,O.shadowRadius=Z.radius,O.shadowMapSize=Z.mapSize,n.directionalShadow[d]=O,n.directionalShadowMap[d]=q,n.directionalShadowMatrix[d]=C.shadow.matrix,v++}n.directional[d]=W,d++}else if(C.isSpotLight){const W=t.get(C);W.position.setFromMatrixPosition(C.matrixWorld),W.color.copy(U).multiplyScalar(z),W.distance=G,W.coneCos=Math.cos(C.angle),W.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),W.decay=C.decay,n.spot[x]=W;const Z=C.shadow;if(C.map&&(n.spotLightMap[P]=C.map,P++,Z.updateMatrices(C),C.castShadow&&w++),n.spotLightMatrix[x]=Z.matrix,C.castShadow){const O=e.get(C);O.shadowIntensity=Z.intensity,O.shadowBias=Z.bias,O.shadowNormalBias=Z.normalBias,O.shadowRadius=Z.radius,O.shadowMapSize=Z.mapSize,n.spotShadow[x]=O,n.spotShadowMap[x]=q,S++}x++}else if(C.isRectAreaLight){const W=t.get(C);W.color.copy(U).multiplyScalar(z),W.halfWidth.set(C.width*.5,0,0),W.halfHeight.set(0,C.height*.5,0),n.rectArea[m]=W,m++}else if(C.isPointLight){const W=t.get(C);if(W.color.copy(C.color).multiplyScalar(C.intensity),W.distance=C.distance,W.decay=C.decay,C.castShadow){const Z=C.shadow,O=e.get(C);O.shadowIntensity=Z.intensity,O.shadowBias=Z.bias,O.shadowNormalBias=Z.normalBias,O.shadowRadius=Z.radius,O.shadowMapSize=Z.mapSize,O.shadowCameraNear=Z.camera.near,O.shadowCameraFar=Z.camera.far,n.pointShadow[g]=O,n.pointShadowMap[g]=q,n.pointShadowMatrix[g]=C.shadow.matrix,_++}n.point[g]=W,g++}else if(C.isHemisphereLight){const W=t.get(C);W.skyColor.copy(C.color).multiplyScalar(z),W.groundColor.copy(C.groundColor).multiplyScalar(z),n.hemi[p]=W,p++}}m>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=lt.LTC_FLOAT_1,n.rectAreaLTC2=lt.LTC_FLOAT_2):(n.rectAreaLTC1=lt.LTC_HALF_1,n.rectAreaLTC2=lt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=f;const L=n.hash;(L.directionalLength!==d||L.pointLength!==g||L.spotLength!==x||L.rectAreaLength!==m||L.hemiLength!==p||L.numDirectionalShadows!==v||L.numPointShadows!==_||L.numSpotShadows!==S||L.numSpotMaps!==P||L.numLightProbes!==E)&&(n.directional.length=d,n.spot.length=x,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=v,n.directionalShadowMap.length=v,n.pointShadow.length=_,n.pointShadowMap.length=_,n.spotShadow.length=S,n.spotShadowMap.length=S,n.directionalShadowMatrix.length=v,n.pointShadowMatrix.length=_,n.spotLightMatrix.length=S+P-w,n.spotLightMap.length=P,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=E,L.directionalLength=d,L.pointLength=g,L.spotLength=x,L.rectAreaLength=m,L.hemiLength=p,L.numDirectionalShadows=v,L.numPointShadows=_,L.numSpotShadows=S,L.numSpotMaps=P,L.numLightProbes=E,n.version=og++)}function l(c,h){let u=0,f=0,d=0,g=0,x=0;const m=h.matrixWorldInverse;for(let p=0,v=c.length;p<v;p++){const _=c[p];if(_.isDirectionalLight){const S=n.directional[u];S.direction.setFromMatrixPosition(_.matrixWorld),i.setFromMatrixPosition(_.target.matrixWorld),S.direction.sub(i),S.direction.transformDirection(m),u++}else if(_.isSpotLight){const S=n.spot[d];S.position.setFromMatrixPosition(_.matrixWorld),S.position.applyMatrix4(m),S.direction.setFromMatrixPosition(_.matrixWorld),i.setFromMatrixPosition(_.target.matrixWorld),S.direction.sub(i),S.direction.transformDirection(m),d++}else if(_.isRectAreaLight){const S=n.rectArea[g];S.position.setFromMatrixPosition(_.matrixWorld),S.position.applyMatrix4(m),a.identity(),r.copy(_.matrixWorld),r.premultiply(m),a.extractRotation(r),S.halfWidth.set(_.width*.5,0,0),S.halfHeight.set(0,_.height*.5,0),S.halfWidth.applyMatrix4(a),S.halfHeight.applyMatrix4(a),g++}else if(_.isPointLight){const S=n.point[f];S.position.setFromMatrixPosition(_.matrixWorld),S.position.applyMatrix4(m),f++}else if(_.isHemisphereLight){const S=n.hemi[x];S.direction.setFromMatrixPosition(_.matrixWorld),S.direction.transformDirection(m),x++}}}return{setup:o,setupView:l,state:n}}function jl(s){const t=new cg(s),e=[],n=[];function i(h){c.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function a(h){n.push(h)}function o(){t.setup(e)}function l(h){t.setupView(e,h)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:i,state:c,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function hg(s){let t=new WeakMap;function e(i,r=0){const a=t.get(i);let o;return a===void 0?(o=new jl(s),t.set(i,[o])):r>=a.length?(o=new jl(s),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}class dg extends yi{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=lu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class ug extends yi{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const fg=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,pg=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function mg(s,t,e){let n=new To;const i=new gt,r=new gt,a=new ve,o=new dg({depthPacking:cu}),l=new ug,c={},h=e.maxTextureSize,u={[Xn]:Ue,[Ue]:Xn,[Ye]:Ye},f=new Dn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new gt},radius:{value:4}},vertexShader:fg,fragmentShader:pg}),d=f.clone();d.defines.HORIZONTAL_PASS=1;const g=new ze;g.setAttribute("position",new Ne(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new at(g,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Pc;let p=this.type;this.render=function(w,E,L){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||w.length===0)return;const T=s.getRenderTarget(),y=s.getActiveCubeFace(),C=s.getActiveMipmapLevel(),U=s.state;U.setBlending(Vn),U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);const z=p!==An&&this.type===An,G=p===An&&this.type!==An;for(let q=0,W=w.length;q<W;q++){const Z=w[q],O=Z.shadow;if(O===void 0){console.warn("THREE.WebGLShadowMap:",Z,"has no shadow.");continue}if(O.autoUpdate===!1&&O.needsUpdate===!1)continue;i.copy(O.mapSize);const st=O.getFrameExtents();if(i.multiply(st),r.copy(O.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/st.x),i.x=r.x*st.x,O.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/st.y),i.y=r.y*st.y,O.mapSize.y=r.y)),O.map===null||z===!0||G===!0){const ft=this.type!==An?{minFilter:ke,magFilter:ke}:{};O.map!==null&&O.map.dispose(),O.map=new qn(i.x,i.y,ft),O.map.texture.name=Z.name+".shadowMap",O.camera.updateProjectionMatrix()}s.setRenderTarget(O.map),s.clear();const ot=O.getViewportCount();for(let ft=0;ft<ot;ft++){const pt=O.getViewport(ft);a.set(r.x*pt.x,r.y*pt.y,r.x*pt.z,r.y*pt.w),U.viewport(a),O.updateMatrices(Z,ft),n=O.getFrustum(),S(E,L,O.camera,Z,this.type)}O.isPointLightShadow!==!0&&this.type===An&&v(O,L),O.needsUpdate=!1}p=this.type,m.needsUpdate=!1,s.setRenderTarget(T,y,C)};function v(w,E){const L=t.update(x);f.defines.VSM_SAMPLES!==w.blurSamples&&(f.defines.VSM_SAMPLES=w.blurSamples,d.defines.VSM_SAMPLES=w.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new qn(i.x,i.y)),f.uniforms.shadow_pass.value=w.map.texture,f.uniforms.resolution.value=w.mapSize,f.uniforms.radius.value=w.radius,s.setRenderTarget(w.mapPass),s.clear(),s.renderBufferDirect(E,null,L,f,x,null),d.uniforms.shadow_pass.value=w.mapPass.texture,d.uniforms.resolution.value=w.mapSize,d.uniforms.radius.value=w.radius,s.setRenderTarget(w.map),s.clear(),s.renderBufferDirect(E,null,L,d,x,null)}function _(w,E,L,T){let y=null;const C=L.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(C!==void 0)y=C;else if(y=L.isPointLight===!0?l:o,s.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0){const U=y.uuid,z=E.uuid;let G=c[U];G===void 0&&(G={},c[U]=G);let q=G[z];q===void 0&&(q=y.clone(),G[z]=q,E.addEventListener("dispose",P)),y=q}if(y.visible=E.visible,y.wireframe=E.wireframe,T===An?y.side=E.shadowSide!==null?E.shadowSide:E.side:y.side=E.shadowSide!==null?E.shadowSide:u[E.side],y.alphaMap=E.alphaMap,y.alphaTest=E.alphaTest,y.map=E.map,y.clipShadows=E.clipShadows,y.clippingPlanes=E.clippingPlanes,y.clipIntersection=E.clipIntersection,y.displacementMap=E.displacementMap,y.displacementScale=E.displacementScale,y.displacementBias=E.displacementBias,y.wireframeLinewidth=E.wireframeLinewidth,y.linewidth=E.linewidth,L.isPointLight===!0&&y.isMeshDistanceMaterial===!0){const U=s.properties.get(y);U.light=L}return y}function S(w,E,L,T,y){if(w.visible===!1)return;if(w.layers.test(E.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&y===An)&&(!w.frustumCulled||n.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,w.matrixWorld);const z=t.update(w),G=w.material;if(Array.isArray(G)){const q=z.groups;for(let W=0,Z=q.length;W<Z;W++){const O=q[W],st=G[O.materialIndex];if(st&&st.visible){const ot=_(w,st,T,y);w.onBeforeShadow(s,w,E,L,z,ot,O),s.renderBufferDirect(L,null,z,ot,w,O),w.onAfterShadow(s,w,E,L,z,ot,O)}}}else if(G.visible){const q=_(w,G,T,y);w.onBeforeShadow(s,w,E,L,z,q,null),s.renderBufferDirect(L,null,z,q,w,null),w.onAfterShadow(s,w,E,L,z,q,null)}}const U=w.children;for(let z=0,G=U.length;z<G;z++)S(U[z],E,L,T,y)}function P(w){w.target.removeEventListener("dispose",P);for(const L in c){const T=c[L],y=w.target.uuid;y in T&&(T[y].dispose(),delete T[y])}}}function gg(s){function t(){let I=!1;const tt=new ve;let $=null;const Y=new ve(0,0,0,0);return{setMask:function(nt){$!==nt&&!I&&(s.colorMask(nt,nt,nt,nt),$=nt)},setLocked:function(nt){I=nt},setClear:function(nt,At,Xt,fe,be){be===!0&&(nt*=fe,At*=fe,Xt*=fe),tt.set(nt,At,Xt,fe),Y.equals(tt)===!1&&(s.clearColor(nt,At,Xt,fe),Y.copy(tt))},reset:function(){I=!1,$=null,Y.set(-1,0,0,0)}}}function e(){let I=!1,tt=null,$=null,Y=null;return{setTest:function(nt){nt?it(s.DEPTH_TEST):rt(s.DEPTH_TEST)},setMask:function(nt){tt!==nt&&!I&&(s.depthMask(nt),tt=nt)},setFunc:function(nt){if($!==nt){switch(nt){case qd:s.depthFunc(s.NEVER);break;case $d:s.depthFunc(s.ALWAYS);break;case Yd:s.depthFunc(s.LESS);break;case xr:s.depthFunc(s.LEQUAL);break;case Kd:s.depthFunc(s.EQUAL);break;case Zd:s.depthFunc(s.GEQUAL);break;case jd:s.depthFunc(s.GREATER);break;case Jd:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}$=nt}},setLocked:function(nt){I=nt},setClear:function(nt){Y!==nt&&(s.clearDepth(nt),Y=nt)},reset:function(){I=!1,tt=null,$=null,Y=null}}}function n(){let I=!1,tt=null,$=null,Y=null,nt=null,At=null,Xt=null,fe=null,be=null;return{setTest:function(qt){I||(qt?it(s.STENCIL_TEST):rt(s.STENCIL_TEST))},setMask:function(qt){tt!==qt&&!I&&(s.stencilMask(qt),tt=qt)},setFunc:function(qt,Mn,fn){($!==qt||Y!==Mn||nt!==fn)&&(s.stencilFunc(qt,Mn,fn),$=qt,Y=Mn,nt=fn)},setOp:function(qt,Mn,fn){(At!==qt||Xt!==Mn||fe!==fn)&&(s.stencilOp(qt,Mn,fn),At=qt,Xt=Mn,fe=fn)},setLocked:function(qt){I=qt},setClear:function(qt){be!==qt&&(s.clearStencil(qt),be=qt)},reset:function(){I=!1,tt=null,$=null,Y=null,nt=null,At=null,Xt=null,fe=null,be=null}}}const i=new t,r=new e,a=new n,o=new WeakMap,l=new WeakMap;let c={},h={},u=new WeakMap,f=[],d=null,g=!1,x=null,m=null,p=null,v=null,_=null,S=null,P=null,w=new Bt(0,0,0),E=0,L=!1,T=null,y=null,C=null,U=null,z=null;const G=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let q=!1,W=0;const Z=s.getParameter(s.VERSION);Z.indexOf("WebGL")!==-1?(W=parseFloat(/^WebGL (\d)/.exec(Z)[1]),q=W>=1):Z.indexOf("OpenGL ES")!==-1&&(W=parseFloat(/^OpenGL ES (\d)/.exec(Z)[1]),q=W>=2);let O=null,st={};const ot=s.getParameter(s.SCISSOR_BOX),ft=s.getParameter(s.VIEWPORT),pt=new ve().fromArray(ot),ct=new ve().fromArray(ft);function F(I,tt,$,Y){const nt=new Uint8Array(4),At=s.createTexture();s.bindTexture(I,At),s.texParameteri(I,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(I,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Xt=0;Xt<$;Xt++)I===s.TEXTURE_3D||I===s.TEXTURE_2D_ARRAY?s.texImage3D(tt,0,s.RGBA,1,1,Y,0,s.RGBA,s.UNSIGNED_BYTE,nt):s.texImage2D(tt+Xt,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,nt);return At}const X={};X[s.TEXTURE_2D]=F(s.TEXTURE_2D,s.TEXTURE_2D,1),X[s.TEXTURE_CUBE_MAP]=F(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),X[s.TEXTURE_2D_ARRAY]=F(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),X[s.TEXTURE_3D]=F(s.TEXTURE_3D,s.TEXTURE_3D,1,1),i.setClear(0,0,0,1),r.setClear(1),a.setClear(0),it(s.DEPTH_TEST),r.setFunc(xr),te(!1),bt(sl),it(s.CULL_FACE),de(Vn);function it(I){c[I]!==!0&&(s.enable(I),c[I]=!0)}function rt(I){c[I]!==!1&&(s.disable(I),c[I]=!1)}function Et(I,tt){return h[I]!==tt?(s.bindFramebuffer(I,tt),h[I]=tt,I===s.DRAW_FRAMEBUFFER&&(h[s.FRAMEBUFFER]=tt),I===s.FRAMEBUFFER&&(h[s.DRAW_FRAMEBUFFER]=tt),!0):!1}function Pt(I,tt){let $=f,Y=!1;if(I){$=u.get(tt),$===void 0&&($=[],u.set(tt,$));const nt=I.textures;if($.length!==nt.length||$[0]!==s.COLOR_ATTACHMENT0){for(let At=0,Xt=nt.length;At<Xt;At++)$[At]=s.COLOR_ATTACHMENT0+At;$.length=nt.length,Y=!0}}else $[0]!==s.BACK&&($[0]=s.BACK,Y=!0);Y&&s.drawBuffers($)}function kt(I){return d!==I?(s.useProgram(I),d=I,!0):!1}const ie={[ci]:s.FUNC_ADD,[Rd]:s.FUNC_SUBTRACT,[Pd]:s.FUNC_REVERSE_SUBTRACT};ie[Ld]=s.MIN,ie[Dd]=s.MAX;const R={[Id]:s.ZERO,[kd]:s.ONE,[Ud]:s.SRC_COLOR,[Sa]:s.SRC_ALPHA,[Gd]:s.SRC_ALPHA_SATURATE,[Od]:s.DST_COLOR,[zd]:s.DST_ALPHA,[Nd]:s.ONE_MINUS_SRC_COLOR,[ba]:s.ONE_MINUS_SRC_ALPHA,[Bd]:s.ONE_MINUS_DST_COLOR,[Fd]:s.ONE_MINUS_DST_ALPHA,[Hd]:s.CONSTANT_COLOR,[Vd]:s.ONE_MINUS_CONSTANT_COLOR,[Wd]:s.CONSTANT_ALPHA,[Xd]:s.ONE_MINUS_CONSTANT_ALPHA};function de(I,tt,$,Y,nt,At,Xt,fe,be,qt){if(I===Vn){g===!0&&(rt(s.BLEND),g=!1);return}if(g===!1&&(it(s.BLEND),g=!0),I!==Cd){if(I!==x||qt!==L){if((m!==ci||_!==ci)&&(s.blendEquation(s.FUNC_ADD),m=ci,_=ci),qt)switch(I){case Xi:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Ma:s.blendFunc(s.ONE,s.ONE);break;case rl:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case al:s.blendFuncSeparate(s.ZERO,s.SRC_COLOR,s.ZERO,s.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}else switch(I){case Xi:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Ma:s.blendFunc(s.SRC_ALPHA,s.ONE);break;case rl:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case al:s.blendFunc(s.ZERO,s.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}p=null,v=null,S=null,P=null,w.set(0,0,0),E=0,x=I,L=qt}return}nt=nt||tt,At=At||$,Xt=Xt||Y,(tt!==m||nt!==_)&&(s.blendEquationSeparate(ie[tt],ie[nt]),m=tt,_=nt),($!==p||Y!==v||At!==S||Xt!==P)&&(s.blendFuncSeparate(R[$],R[Y],R[At],R[Xt]),p=$,v=Y,S=At,P=Xt),(fe.equals(w)===!1||be!==E)&&(s.blendColor(fe.r,fe.g,fe.b,be),w.copy(fe),E=be),x=I,L=!1}function Jt(I,tt){I.side===Ye?rt(s.CULL_FACE):it(s.CULL_FACE);let $=I.side===Ue;tt&&($=!$),te($),I.blending===Xi&&I.transparent===!1?de(Vn):de(I.blending,I.blendEquation,I.blendSrc,I.blendDst,I.blendEquationAlpha,I.blendSrcAlpha,I.blendDstAlpha,I.blendColor,I.blendAlpha,I.premultipliedAlpha),r.setFunc(I.depthFunc),r.setTest(I.depthTest),r.setMask(I.depthWrite),i.setMask(I.colorWrite);const Y=I.stencilWrite;a.setTest(Y),Y&&(a.setMask(I.stencilWriteMask),a.setFunc(I.stencilFunc,I.stencilRef,I.stencilFuncMask),a.setOp(I.stencilFail,I.stencilZFail,I.stencilZPass)),Dt(I.polygonOffset,I.polygonOffsetFactor,I.polygonOffsetUnits),I.alphaToCoverage===!0?it(s.SAMPLE_ALPHA_TO_COVERAGE):rt(s.SAMPLE_ALPHA_TO_COVERAGE)}function te(I){T!==I&&(I?s.frontFace(s.CW):s.frontFace(s.CCW),T=I)}function bt(I){I!==Ed?(it(s.CULL_FACE),I!==y&&(I===sl?s.cullFace(s.BACK):I===Ad?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):rt(s.CULL_FACE),y=I}function ue(I){I!==C&&(q&&s.lineWidth(I),C=I)}function Dt(I,tt,$){I?(it(s.POLYGON_OFFSET_FILL),(U!==tt||z!==$)&&(s.polygonOffset(tt,$),U=tt,z=$)):rt(s.POLYGON_OFFSET_FILL)}function Ut(I){I?it(s.SCISSOR_TEST):rt(s.SCISSOR_TEST)}function A(I){I===void 0&&(I=s.TEXTURE0+G-1),O!==I&&(s.activeTexture(I),O=I)}function M(I,tt,$){$===void 0&&(O===null?$=s.TEXTURE0+G-1:$=O);let Y=st[$];Y===void 0&&(Y={type:void 0,texture:void 0},st[$]=Y),(Y.type!==I||Y.texture!==tt)&&(O!==$&&(s.activeTexture($),O=$),s.bindTexture(I,tt||X[I]),Y.type=I,Y.texture=tt)}function V(){const I=st[O];I!==void 0&&I.type!==void 0&&(s.bindTexture(I.type,null),I.type=void 0,I.texture=void 0)}function j(){try{s.compressedTexImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function J(){try{s.compressedTexImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function K(){try{s.texSubImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Tt(){try{s.texSubImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function ht(){try{s.compressedTexSubImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function xt(){try{s.compressedTexSubImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function zt(){try{s.texStorage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Q(){try{s.texStorage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function mt(){try{s.texImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Vt(){try{s.texImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Lt(I){pt.equals(I)===!1&&(s.scissor(I.x,I.y,I.z,I.w),pt.copy(I))}function vt(I){ct.equals(I)===!1&&(s.viewport(I.x,I.y,I.z,I.w),ct.copy(I))}function It(I,tt){let $=l.get(tt);$===void 0&&($=new WeakMap,l.set(tt,$));let Y=$.get(I);Y===void 0&&(Y=s.getUniformBlockIndex(tt,I.name),$.set(I,Y))}function Gt(I,tt){const Y=l.get(tt).get(I);o.get(tt)!==Y&&(s.uniformBlockBinding(tt,Y,I.__bindingPointIndex),o.set(tt,Y))}function ae(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),c={},O=null,st={},h={},u=new WeakMap,f=[],d=null,g=!1,x=null,m=null,p=null,v=null,_=null,S=null,P=null,w=new Bt(0,0,0),E=0,L=!1,T=null,y=null,C=null,U=null,z=null,pt.set(0,0,s.canvas.width,s.canvas.height),ct.set(0,0,s.canvas.width,s.canvas.height),i.reset(),r.reset(),a.reset()}return{buffers:{color:i,depth:r,stencil:a},enable:it,disable:rt,bindFramebuffer:Et,drawBuffers:Pt,useProgram:kt,setBlending:de,setMaterial:Jt,setFlipSided:te,setCullFace:bt,setLineWidth:ue,setPolygonOffset:Dt,setScissorTest:Ut,activeTexture:A,bindTexture:M,unbindTexture:V,compressedTexImage2D:j,compressedTexImage3D:J,texImage2D:mt,texImage3D:Vt,updateUBOMapping:It,uniformBlockBinding:Gt,texStorage2D:zt,texStorage3D:Q,texSubImage2D:K,texSubImage3D:Tt,compressedTexSubImage2D:ht,compressedTexSubImage3D:xt,scissor:Lt,viewport:vt,reset:ae}}function Jl(s,t,e,n){const i=xg(n);switch(e){case zc:return s*t;case Oc:return s*t;case Bc:return s*t*2;case vo:return s*t/i.components*i.byteLength;case _o:return s*t/i.components*i.byteLength;case Gc:return s*t*2/i.components*i.byteLength;case yo:return s*t*2/i.components*i.byteLength;case Fc:return s*t*3/i.components*i.byteLength;case hn:return s*t*4/i.components*i.byteLength;case Mo:return s*t*4/i.components*i.byteLength;case sr:case rr:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case ar:case or:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case Ca:case Pa:return Math.max(s,16)*Math.max(t,8)/4;case Aa:case Ra:return Math.max(s,8)*Math.max(t,8)/2;case La:case Da:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case Ia:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case ka:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case Ua:return Math.floor((s+4)/5)*Math.floor((t+3)/4)*16;case Na:return Math.floor((s+4)/5)*Math.floor((t+4)/5)*16;case za:return Math.floor((s+5)/6)*Math.floor((t+4)/5)*16;case Fa:return Math.floor((s+5)/6)*Math.floor((t+5)/6)*16;case Oa:return Math.floor((s+7)/8)*Math.floor((t+4)/5)*16;case Ba:return Math.floor((s+7)/8)*Math.floor((t+5)/6)*16;case Ga:return Math.floor((s+7)/8)*Math.floor((t+7)/8)*16;case Ha:return Math.floor((s+9)/10)*Math.floor((t+4)/5)*16;case Va:return Math.floor((s+9)/10)*Math.floor((t+5)/6)*16;case Wa:return Math.floor((s+9)/10)*Math.floor((t+7)/8)*16;case Xa:return Math.floor((s+9)/10)*Math.floor((t+9)/10)*16;case qa:return Math.floor((s+11)/12)*Math.floor((t+9)/10)*16;case $a:return Math.floor((s+11)/12)*Math.floor((t+11)/12)*16;case lr:case Ya:case Ka:return Math.ceil(s/4)*Math.ceil(t/4)*16;case Hc:case Za:return Math.ceil(s/4)*Math.ceil(t/4)*8;case ja:case Ja:return Math.ceil(s/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function xg(s){switch(s){case Ln:case kc:return{byteLength:1,components:1};case _s:case Uc:case Ss:return{byteLength:2,components:1};case go:case xo:return{byteLength:2,components:4};case xi:case mo:case xn:return{byteLength:4,components:1};case Nc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${s}.`)}function vg(s,t,e,n,i,r,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new gt,h=new WeakMap;let u;const f=new WeakMap;let d=!1;try{d=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(A,M){return d?new OffscreenCanvas(A,M):Sr("canvas")}function x(A,M,V){let j=1;const J=Ut(A);if((J.width>V||J.height>V)&&(j=V/Math.max(J.width,J.height)),j<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){const K=Math.floor(j*J.width),Tt=Math.floor(j*J.height);u===void 0&&(u=g(K,Tt));const ht=M?g(K,Tt):u;return ht.width=K,ht.height=Tt,ht.getContext("2d").drawImage(A,0,0,K,Tt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+K+"x"+Tt+")."),ht}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),A;return A}function m(A){return A.generateMipmaps&&A.minFilter!==ke&&A.minFilter!==tn}function p(A){s.generateMipmap(A)}function v(A,M,V,j,J=!1){if(A!==null){if(s[A]!==void 0)return s[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let K=M;if(M===s.RED&&(V===s.FLOAT&&(K=s.R32F),V===s.HALF_FLOAT&&(K=s.R16F),V===s.UNSIGNED_BYTE&&(K=s.R8)),M===s.RED_INTEGER&&(V===s.UNSIGNED_BYTE&&(K=s.R8UI),V===s.UNSIGNED_SHORT&&(K=s.R16UI),V===s.UNSIGNED_INT&&(K=s.R32UI),V===s.BYTE&&(K=s.R8I),V===s.SHORT&&(K=s.R16I),V===s.INT&&(K=s.R32I)),M===s.RG&&(V===s.FLOAT&&(K=s.RG32F),V===s.HALF_FLOAT&&(K=s.RG16F),V===s.UNSIGNED_BYTE&&(K=s.RG8)),M===s.RG_INTEGER&&(V===s.UNSIGNED_BYTE&&(K=s.RG8UI),V===s.UNSIGNED_SHORT&&(K=s.RG16UI),V===s.UNSIGNED_INT&&(K=s.RG32UI),V===s.BYTE&&(K=s.RG8I),V===s.SHORT&&(K=s.RG16I),V===s.INT&&(K=s.RG32I)),M===s.RGB&&V===s.UNSIGNED_INT_5_9_9_9_REV&&(K=s.RGB9_E5),M===s.RGBA){const Tt=J?vr:Qt.getTransfer(j);V===s.FLOAT&&(K=s.RGBA32F),V===s.HALF_FLOAT&&(K=s.RGBA16F),V===s.UNSIGNED_BYTE&&(K=Tt===se?s.SRGB8_ALPHA8:s.RGBA8),V===s.UNSIGNED_SHORT_4_4_4_4&&(K=s.RGBA4),V===s.UNSIGNED_SHORT_5_5_5_1&&(K=s.RGB5_A1)}return(K===s.R16F||K===s.R32F||K===s.RG16F||K===s.RG32F||K===s.RGBA16F||K===s.RGBA32F)&&t.get("EXT_color_buffer_float"),K}function _(A,M){let V;return A?M===null||M===xi||M===Zi?V=s.DEPTH24_STENCIL8:M===xn?V=s.DEPTH32F_STENCIL8:M===_s&&(V=s.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):M===null||M===xi||M===Zi?V=s.DEPTH_COMPONENT24:M===xn?V=s.DEPTH_COMPONENT32F:M===_s&&(V=s.DEPTH_COMPONENT16),V}function S(A,M){return m(A)===!0||A.isFramebufferTexture&&A.minFilter!==ke&&A.minFilter!==tn?Math.log2(Math.max(M.width,M.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?M.mipmaps.length:1}function P(A){const M=A.target;M.removeEventListener("dispose",P),E(M),M.isVideoTexture&&h.delete(M)}function w(A){const M=A.target;M.removeEventListener("dispose",w),T(M)}function E(A){const M=n.get(A);if(M.__webglInit===void 0)return;const V=A.source,j=f.get(V);if(j){const J=j[M.__cacheKey];J.usedTimes--,J.usedTimes===0&&L(A),Object.keys(j).length===0&&f.delete(V)}n.remove(A)}function L(A){const M=n.get(A);s.deleteTexture(M.__webglTexture);const V=A.source,j=f.get(V);delete j[M.__cacheKey],a.memory.textures--}function T(A){const M=n.get(A);if(A.depthTexture&&A.depthTexture.dispose(),A.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(M.__webglFramebuffer[j]))for(let J=0;J<M.__webglFramebuffer[j].length;J++)s.deleteFramebuffer(M.__webglFramebuffer[j][J]);else s.deleteFramebuffer(M.__webglFramebuffer[j]);M.__webglDepthbuffer&&s.deleteRenderbuffer(M.__webglDepthbuffer[j])}else{if(Array.isArray(M.__webglFramebuffer))for(let j=0;j<M.__webglFramebuffer.length;j++)s.deleteFramebuffer(M.__webglFramebuffer[j]);else s.deleteFramebuffer(M.__webglFramebuffer);if(M.__webglDepthbuffer&&s.deleteRenderbuffer(M.__webglDepthbuffer),M.__webglMultisampledFramebuffer&&s.deleteFramebuffer(M.__webglMultisampledFramebuffer),M.__webglColorRenderbuffer)for(let j=0;j<M.__webglColorRenderbuffer.length;j++)M.__webglColorRenderbuffer[j]&&s.deleteRenderbuffer(M.__webglColorRenderbuffer[j]);M.__webglDepthRenderbuffer&&s.deleteRenderbuffer(M.__webglDepthRenderbuffer)}const V=A.textures;for(let j=0,J=V.length;j<J;j++){const K=n.get(V[j]);K.__webglTexture&&(s.deleteTexture(K.__webglTexture),a.memory.textures--),n.remove(V[j])}n.remove(A)}let y=0;function C(){y=0}function U(){const A=y;return A>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+i.maxTextures),y+=1,A}function z(A){const M=[];return M.push(A.wrapS),M.push(A.wrapT),M.push(A.wrapR||0),M.push(A.magFilter),M.push(A.minFilter),M.push(A.anisotropy),M.push(A.internalFormat),M.push(A.format),M.push(A.type),M.push(A.generateMipmaps),M.push(A.premultiplyAlpha),M.push(A.flipY),M.push(A.unpackAlignment),M.push(A.colorSpace),M.join()}function G(A,M){const V=n.get(A);if(A.isVideoTexture&&ue(A),A.isRenderTargetTexture===!1&&A.version>0&&V.__version!==A.version){const j=A.image;if(j===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{ct(V,A,M);return}}e.bindTexture(s.TEXTURE_2D,V.__webglTexture,s.TEXTURE0+M)}function q(A,M){const V=n.get(A);if(A.version>0&&V.__version!==A.version){ct(V,A,M);return}e.bindTexture(s.TEXTURE_2D_ARRAY,V.__webglTexture,s.TEXTURE0+M)}function W(A,M){const V=n.get(A);if(A.version>0&&V.__version!==A.version){ct(V,A,M);return}e.bindTexture(s.TEXTURE_3D,V.__webglTexture,s.TEXTURE0+M)}function Z(A,M){const V=n.get(A);if(A.version>0&&V.__version!==A.version){F(V,A,M);return}e.bindTexture(s.TEXTURE_CUBE_MAP,V.__webglTexture,s.TEXTURE0+M)}const O={[ui]:s.REPEAT,[fi]:s.CLAMP_TO_EDGE,[Ea]:s.MIRRORED_REPEAT},st={[ke]:s.NEAREST,[ou]:s.NEAREST_MIPMAP_NEAREST,[Ps]:s.NEAREST_MIPMAP_LINEAR,[tn]:s.LINEAR,[Or]:s.LINEAR_MIPMAP_NEAREST,[pi]:s.LINEAR_MIPMAP_LINEAR},ot={[du]:s.NEVER,[xu]:s.ALWAYS,[uu]:s.LESS,[Vc]:s.LEQUAL,[fu]:s.EQUAL,[gu]:s.GEQUAL,[pu]:s.GREATER,[mu]:s.NOTEQUAL};function ft(A,M){if(M.type===xn&&t.has("OES_texture_float_linear")===!1&&(M.magFilter===tn||M.magFilter===Or||M.magFilter===Ps||M.magFilter===pi||M.minFilter===tn||M.minFilter===Or||M.minFilter===Ps||M.minFilter===pi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(A,s.TEXTURE_WRAP_S,O[M.wrapS]),s.texParameteri(A,s.TEXTURE_WRAP_T,O[M.wrapT]),(A===s.TEXTURE_3D||A===s.TEXTURE_2D_ARRAY)&&s.texParameteri(A,s.TEXTURE_WRAP_R,O[M.wrapR]),s.texParameteri(A,s.TEXTURE_MAG_FILTER,st[M.magFilter]),s.texParameteri(A,s.TEXTURE_MIN_FILTER,st[M.minFilter]),M.compareFunction&&(s.texParameteri(A,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(A,s.TEXTURE_COMPARE_FUNC,ot[M.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(M.magFilter===ke||M.minFilter!==Ps&&M.minFilter!==pi||M.type===xn&&t.has("OES_texture_float_linear")===!1)return;if(M.anisotropy>1||n.get(M).__currentAnisotropy){const V=t.get("EXT_texture_filter_anisotropic");s.texParameterf(A,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,i.getMaxAnisotropy())),n.get(M).__currentAnisotropy=M.anisotropy}}}function pt(A,M){let V=!1;A.__webglInit===void 0&&(A.__webglInit=!0,M.addEventListener("dispose",P));const j=M.source;let J=f.get(j);J===void 0&&(J={},f.set(j,J));const K=z(M);if(K!==A.__cacheKey){J[K]===void 0&&(J[K]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,V=!0),J[K].usedTimes++;const Tt=J[A.__cacheKey];Tt!==void 0&&(J[A.__cacheKey].usedTimes--,Tt.usedTimes===0&&L(M)),A.__cacheKey=K,A.__webglTexture=J[K].texture}return V}function ct(A,M,V){let j=s.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(j=s.TEXTURE_2D_ARRAY),M.isData3DTexture&&(j=s.TEXTURE_3D);const J=pt(A,M),K=M.source;e.bindTexture(j,A.__webglTexture,s.TEXTURE0+V);const Tt=n.get(K);if(K.version!==Tt.__version||J===!0){e.activeTexture(s.TEXTURE0+V);const ht=Qt.getPrimaries(Qt.workingColorSpace),xt=M.colorSpace===Hn?null:Qt.getPrimaries(M.colorSpace),zt=M.colorSpace===Hn||ht===xt?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,M.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,M.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,zt);let Q=x(M.image,!1,i.maxTextureSize);Q=Dt(M,Q);const mt=r.convert(M.format,M.colorSpace),Vt=r.convert(M.type);let Lt=v(M.internalFormat,mt,Vt,M.colorSpace,M.isVideoTexture);ft(j,M);let vt;const It=M.mipmaps,Gt=M.isVideoTexture!==!0,ae=Tt.__version===void 0||J===!0,I=K.dataReady,tt=S(M,Q);if(M.isDepthTexture)Lt=_(M.format===ji,M.type),ae&&(Gt?e.texStorage2D(s.TEXTURE_2D,1,Lt,Q.width,Q.height):e.texImage2D(s.TEXTURE_2D,0,Lt,Q.width,Q.height,0,mt,Vt,null));else if(M.isDataTexture)if(It.length>0){Gt&&ae&&e.texStorage2D(s.TEXTURE_2D,tt,Lt,It[0].width,It[0].height);for(let $=0,Y=It.length;$<Y;$++)vt=It[$],Gt?I&&e.texSubImage2D(s.TEXTURE_2D,$,0,0,vt.width,vt.height,mt,Vt,vt.data):e.texImage2D(s.TEXTURE_2D,$,Lt,vt.width,vt.height,0,mt,Vt,vt.data);M.generateMipmaps=!1}else Gt?(ae&&e.texStorage2D(s.TEXTURE_2D,tt,Lt,Q.width,Q.height),I&&e.texSubImage2D(s.TEXTURE_2D,0,0,0,Q.width,Q.height,mt,Vt,Q.data)):e.texImage2D(s.TEXTURE_2D,0,Lt,Q.width,Q.height,0,mt,Vt,Q.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){Gt&&ae&&e.texStorage3D(s.TEXTURE_2D_ARRAY,tt,Lt,It[0].width,It[0].height,Q.depth);for(let $=0,Y=It.length;$<Y;$++)if(vt=It[$],M.format!==hn)if(mt!==null)if(Gt){if(I)if(M.layerUpdates.size>0){const nt=Jl(vt.width,vt.height,M.format,M.type);for(const At of M.layerUpdates){const Xt=vt.data.subarray(At*nt/vt.data.BYTES_PER_ELEMENT,(At+1)*nt/vt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,$,0,0,At,vt.width,vt.height,1,mt,Xt,0,0)}M.clearLayerUpdates()}else e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,$,0,0,0,vt.width,vt.height,Q.depth,mt,vt.data,0,0)}else e.compressedTexImage3D(s.TEXTURE_2D_ARRAY,$,Lt,vt.width,vt.height,Q.depth,0,vt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Gt?I&&e.texSubImage3D(s.TEXTURE_2D_ARRAY,$,0,0,0,vt.width,vt.height,Q.depth,mt,Vt,vt.data):e.texImage3D(s.TEXTURE_2D_ARRAY,$,Lt,vt.width,vt.height,Q.depth,0,mt,Vt,vt.data)}else{Gt&&ae&&e.texStorage2D(s.TEXTURE_2D,tt,Lt,It[0].width,It[0].height);for(let $=0,Y=It.length;$<Y;$++)vt=It[$],M.format!==hn?mt!==null?Gt?I&&e.compressedTexSubImage2D(s.TEXTURE_2D,$,0,0,vt.width,vt.height,mt,vt.data):e.compressedTexImage2D(s.TEXTURE_2D,$,Lt,vt.width,vt.height,0,vt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Gt?I&&e.texSubImage2D(s.TEXTURE_2D,$,0,0,vt.width,vt.height,mt,Vt,vt.data):e.texImage2D(s.TEXTURE_2D,$,Lt,vt.width,vt.height,0,mt,Vt,vt.data)}else if(M.isDataArrayTexture)if(Gt){if(ae&&e.texStorage3D(s.TEXTURE_2D_ARRAY,tt,Lt,Q.width,Q.height,Q.depth),I)if(M.layerUpdates.size>0){const $=Jl(Q.width,Q.height,M.format,M.type);for(const Y of M.layerUpdates){const nt=Q.data.subarray(Y*$/Q.data.BYTES_PER_ELEMENT,(Y+1)*$/Q.data.BYTES_PER_ELEMENT);e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,Y,Q.width,Q.height,1,mt,Vt,nt)}M.clearLayerUpdates()}else e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,Q.width,Q.height,Q.depth,mt,Vt,Q.data)}else e.texImage3D(s.TEXTURE_2D_ARRAY,0,Lt,Q.width,Q.height,Q.depth,0,mt,Vt,Q.data);else if(M.isData3DTexture)Gt?(ae&&e.texStorage3D(s.TEXTURE_3D,tt,Lt,Q.width,Q.height,Q.depth),I&&e.texSubImage3D(s.TEXTURE_3D,0,0,0,0,Q.width,Q.height,Q.depth,mt,Vt,Q.data)):e.texImage3D(s.TEXTURE_3D,0,Lt,Q.width,Q.height,Q.depth,0,mt,Vt,Q.data);else if(M.isFramebufferTexture){if(ae)if(Gt)e.texStorage2D(s.TEXTURE_2D,tt,Lt,Q.width,Q.height);else{let $=Q.width,Y=Q.height;for(let nt=0;nt<tt;nt++)e.texImage2D(s.TEXTURE_2D,nt,Lt,$,Y,0,mt,Vt,null),$>>=1,Y>>=1}}else if(It.length>0){if(Gt&&ae){const $=Ut(It[0]);e.texStorage2D(s.TEXTURE_2D,tt,Lt,$.width,$.height)}for(let $=0,Y=It.length;$<Y;$++)vt=It[$],Gt?I&&e.texSubImage2D(s.TEXTURE_2D,$,0,0,mt,Vt,vt):e.texImage2D(s.TEXTURE_2D,$,Lt,mt,Vt,vt);M.generateMipmaps=!1}else if(Gt){if(ae){const $=Ut(Q);e.texStorage2D(s.TEXTURE_2D,tt,Lt,$.width,$.height)}I&&e.texSubImage2D(s.TEXTURE_2D,0,0,0,mt,Vt,Q)}else e.texImage2D(s.TEXTURE_2D,0,Lt,mt,Vt,Q);m(M)&&p(j),Tt.__version=K.version,M.onUpdate&&M.onUpdate(M)}A.__version=M.version}function F(A,M,V){if(M.image.length!==6)return;const j=pt(A,M),J=M.source;e.bindTexture(s.TEXTURE_CUBE_MAP,A.__webglTexture,s.TEXTURE0+V);const K=n.get(J);if(J.version!==K.__version||j===!0){e.activeTexture(s.TEXTURE0+V);const Tt=Qt.getPrimaries(Qt.workingColorSpace),ht=M.colorSpace===Hn?null:Qt.getPrimaries(M.colorSpace),xt=M.colorSpace===Hn||Tt===ht?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,M.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,M.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,xt);const zt=M.isCompressedTexture||M.image[0].isCompressedTexture,Q=M.image[0]&&M.image[0].isDataTexture,mt=[];for(let Y=0;Y<6;Y++)!zt&&!Q?mt[Y]=x(M.image[Y],!0,i.maxCubemapSize):mt[Y]=Q?M.image[Y].image:M.image[Y],mt[Y]=Dt(M,mt[Y]);const Vt=mt[0],Lt=r.convert(M.format,M.colorSpace),vt=r.convert(M.type),It=v(M.internalFormat,Lt,vt,M.colorSpace),Gt=M.isVideoTexture!==!0,ae=K.__version===void 0||j===!0,I=J.dataReady;let tt=S(M,Vt);ft(s.TEXTURE_CUBE_MAP,M);let $;if(zt){Gt&&ae&&e.texStorage2D(s.TEXTURE_CUBE_MAP,tt,It,Vt.width,Vt.height);for(let Y=0;Y<6;Y++){$=mt[Y].mipmaps;for(let nt=0;nt<$.length;nt++){const At=$[nt];M.format!==hn?Lt!==null?Gt?I&&e.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Y,nt,0,0,At.width,At.height,Lt,At.data):e.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Y,nt,It,At.width,At.height,0,At.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Gt?I&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Y,nt,0,0,At.width,At.height,Lt,vt,At.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Y,nt,It,At.width,At.height,0,Lt,vt,At.data)}}}else{if($=M.mipmaps,Gt&&ae){$.length>0&&tt++;const Y=Ut(mt[0]);e.texStorage2D(s.TEXTURE_CUBE_MAP,tt,It,Y.width,Y.height)}for(let Y=0;Y<6;Y++)if(Q){Gt?I&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,0,0,mt[Y].width,mt[Y].height,Lt,vt,mt[Y].data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,It,mt[Y].width,mt[Y].height,0,Lt,vt,mt[Y].data);for(let nt=0;nt<$.length;nt++){const Xt=$[nt].image[Y].image;Gt?I&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Y,nt+1,0,0,Xt.width,Xt.height,Lt,vt,Xt.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Y,nt+1,It,Xt.width,Xt.height,0,Lt,vt,Xt.data)}}else{Gt?I&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,0,0,Lt,vt,mt[Y]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0,It,Lt,vt,mt[Y]);for(let nt=0;nt<$.length;nt++){const At=$[nt];Gt?I&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Y,nt+1,0,0,Lt,vt,At.image[Y]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Y,nt+1,It,Lt,vt,At.image[Y])}}}m(M)&&p(s.TEXTURE_CUBE_MAP),K.__version=J.version,M.onUpdate&&M.onUpdate(M)}A.__version=M.version}function X(A,M,V,j,J,K){const Tt=r.convert(V.format,V.colorSpace),ht=r.convert(V.type),xt=v(V.internalFormat,Tt,ht,V.colorSpace);if(!n.get(M).__hasExternalTextures){const Q=Math.max(1,M.width>>K),mt=Math.max(1,M.height>>K);J===s.TEXTURE_3D||J===s.TEXTURE_2D_ARRAY?e.texImage3D(J,K,xt,Q,mt,M.depth,0,Tt,ht,null):e.texImage2D(J,K,xt,Q,mt,0,Tt,ht,null)}e.bindFramebuffer(s.FRAMEBUFFER,A),bt(M)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,j,J,n.get(V).__webglTexture,0,te(M)):(J===s.TEXTURE_2D||J>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,j,J,n.get(V).__webglTexture,K),e.bindFramebuffer(s.FRAMEBUFFER,null)}function it(A,M,V){if(s.bindRenderbuffer(s.RENDERBUFFER,A),M.depthBuffer){const j=M.depthTexture,J=j&&j.isDepthTexture?j.type:null,K=_(M.stencilBuffer,J),Tt=M.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ht=te(M);bt(M)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,ht,K,M.width,M.height):V?s.renderbufferStorageMultisample(s.RENDERBUFFER,ht,K,M.width,M.height):s.renderbufferStorage(s.RENDERBUFFER,K,M.width,M.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,Tt,s.RENDERBUFFER,A)}else{const j=M.textures;for(let J=0;J<j.length;J++){const K=j[J],Tt=r.convert(K.format,K.colorSpace),ht=r.convert(K.type),xt=v(K.internalFormat,Tt,ht,K.colorSpace),zt=te(M);V&&bt(M)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,zt,xt,M.width,M.height):bt(M)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,zt,xt,M.width,M.height):s.renderbufferStorage(s.RENDERBUFFER,xt,M.width,M.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function rt(A,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(s.FRAMEBUFFER,A),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(M.depthTexture).__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),G(M.depthTexture,0);const j=n.get(M.depthTexture).__webglTexture,J=te(M);if(M.depthTexture.format===qi)bt(M)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,j,0,J):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,j,0);else if(M.depthTexture.format===ji)bt(M)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,j,0,J):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,j,0);else throw new Error("Unknown depthTexture format")}function Et(A){const M=n.get(A),V=A.isWebGLCubeRenderTarget===!0;if(A.depthTexture&&!M.__autoAllocateDepthBuffer){if(V)throw new Error("target.depthTexture not supported in Cube render targets");rt(M.__webglFramebuffer,A)}else if(V){M.__webglDepthbuffer=[];for(let j=0;j<6;j++)e.bindFramebuffer(s.FRAMEBUFFER,M.__webglFramebuffer[j]),M.__webglDepthbuffer[j]=s.createRenderbuffer(),it(M.__webglDepthbuffer[j],A,!1)}else e.bindFramebuffer(s.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer=s.createRenderbuffer(),it(M.__webglDepthbuffer,A,!1);e.bindFramebuffer(s.FRAMEBUFFER,null)}function Pt(A,M,V){const j=n.get(A);M!==void 0&&X(j.__webglFramebuffer,A,A.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),V!==void 0&&Et(A)}function kt(A){const M=A.texture,V=n.get(A),j=n.get(M);A.addEventListener("dispose",w);const J=A.textures,K=A.isWebGLCubeRenderTarget===!0,Tt=J.length>1;if(Tt||(j.__webglTexture===void 0&&(j.__webglTexture=s.createTexture()),j.__version=M.version,a.memory.textures++),K){V.__webglFramebuffer=[];for(let ht=0;ht<6;ht++)if(M.mipmaps&&M.mipmaps.length>0){V.__webglFramebuffer[ht]=[];for(let xt=0;xt<M.mipmaps.length;xt++)V.__webglFramebuffer[ht][xt]=s.createFramebuffer()}else V.__webglFramebuffer[ht]=s.createFramebuffer()}else{if(M.mipmaps&&M.mipmaps.length>0){V.__webglFramebuffer=[];for(let ht=0;ht<M.mipmaps.length;ht++)V.__webglFramebuffer[ht]=s.createFramebuffer()}else V.__webglFramebuffer=s.createFramebuffer();if(Tt)for(let ht=0,xt=J.length;ht<xt;ht++){const zt=n.get(J[ht]);zt.__webglTexture===void 0&&(zt.__webglTexture=s.createTexture(),a.memory.textures++)}if(A.samples>0&&bt(A)===!1){V.__webglMultisampledFramebuffer=s.createFramebuffer(),V.__webglColorRenderbuffer=[],e.bindFramebuffer(s.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let ht=0;ht<J.length;ht++){const xt=J[ht];V.__webglColorRenderbuffer[ht]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,V.__webglColorRenderbuffer[ht]);const zt=r.convert(xt.format,xt.colorSpace),Q=r.convert(xt.type),mt=v(xt.internalFormat,zt,Q,xt.colorSpace,A.isXRRenderTarget===!0),Vt=te(A);s.renderbufferStorageMultisample(s.RENDERBUFFER,Vt,mt,A.width,A.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ht,s.RENDERBUFFER,V.__webglColorRenderbuffer[ht])}s.bindRenderbuffer(s.RENDERBUFFER,null),A.depthBuffer&&(V.__webglDepthRenderbuffer=s.createRenderbuffer(),it(V.__webglDepthRenderbuffer,A,!0)),e.bindFramebuffer(s.FRAMEBUFFER,null)}}if(K){e.bindTexture(s.TEXTURE_CUBE_MAP,j.__webglTexture),ft(s.TEXTURE_CUBE_MAP,M);for(let ht=0;ht<6;ht++)if(M.mipmaps&&M.mipmaps.length>0)for(let xt=0;xt<M.mipmaps.length;xt++)X(V.__webglFramebuffer[ht][xt],A,M,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+ht,xt);else X(V.__webglFramebuffer[ht],A,M,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+ht,0);m(M)&&p(s.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Tt){for(let ht=0,xt=J.length;ht<xt;ht++){const zt=J[ht],Q=n.get(zt);e.bindTexture(s.TEXTURE_2D,Q.__webglTexture),ft(s.TEXTURE_2D,zt),X(V.__webglFramebuffer,A,zt,s.COLOR_ATTACHMENT0+ht,s.TEXTURE_2D,0),m(zt)&&p(s.TEXTURE_2D)}e.unbindTexture()}else{let ht=s.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(ht=A.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(ht,j.__webglTexture),ft(ht,M),M.mipmaps&&M.mipmaps.length>0)for(let xt=0;xt<M.mipmaps.length;xt++)X(V.__webglFramebuffer[xt],A,M,s.COLOR_ATTACHMENT0,ht,xt);else X(V.__webglFramebuffer,A,M,s.COLOR_ATTACHMENT0,ht,0);m(M)&&p(ht),e.unbindTexture()}A.depthBuffer&&Et(A)}function ie(A){const M=A.textures;for(let V=0,j=M.length;V<j;V++){const J=M[V];if(m(J)){const K=A.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:s.TEXTURE_2D,Tt=n.get(J).__webglTexture;e.bindTexture(K,Tt),p(K),e.unbindTexture()}}}const R=[],de=[];function Jt(A){if(A.samples>0){if(bt(A)===!1){const M=A.textures,V=A.width,j=A.height;let J=s.COLOR_BUFFER_BIT;const K=A.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,Tt=n.get(A),ht=M.length>1;if(ht)for(let xt=0;xt<M.length;xt++)e.bindFramebuffer(s.FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+xt,s.RENDERBUFFER,null),e.bindFramebuffer(s.FRAMEBUFFER,Tt.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+xt,s.TEXTURE_2D,null,0);e.bindFramebuffer(s.READ_FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),e.bindFramebuffer(s.DRAW_FRAMEBUFFER,Tt.__webglFramebuffer);for(let xt=0;xt<M.length;xt++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(J|=s.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(J|=s.STENCIL_BUFFER_BIT)),ht){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,Tt.__webglColorRenderbuffer[xt]);const zt=n.get(M[xt]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,zt,0)}s.blitFramebuffer(0,0,V,j,0,0,V,j,J,s.NEAREST),l===!0&&(R.length=0,de.length=0,R.push(s.COLOR_ATTACHMENT0+xt),A.depthBuffer&&A.resolveDepthBuffer===!1&&(R.push(K),de.push(K),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,de)),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,R))}if(e.bindFramebuffer(s.READ_FRAMEBUFFER,null),e.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),ht)for(let xt=0;xt<M.length;xt++){e.bindFramebuffer(s.FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+xt,s.RENDERBUFFER,Tt.__webglColorRenderbuffer[xt]);const zt=n.get(M[xt]).__webglTexture;e.bindFramebuffer(s.FRAMEBUFFER,Tt.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+xt,s.TEXTURE_2D,zt,0)}e.bindFramebuffer(s.DRAW_FRAMEBUFFER,Tt.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.resolveDepthBuffer===!1&&l){const M=A.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[M])}}}function te(A){return Math.min(i.maxSamples,A.samples)}function bt(A){const M=n.get(A);return A.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function ue(A){const M=a.render.frame;h.get(A)!==M&&(h.set(A,M),A.update())}function Dt(A,M){const V=A.colorSpace,j=A.format,J=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||V!==$n&&V!==Hn&&(Qt.getTransfer(V)===se?(j!==hn||J!==Ln)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",V)),M}function Ut(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=U,this.resetTextureUnits=C,this.setTexture2D=G,this.setTexture2DArray=q,this.setTexture3D=W,this.setTextureCube=Z,this.rebindTextures=Pt,this.setupRenderTarget=kt,this.updateRenderTargetMipmap=ie,this.updateMultisampleRenderTarget=Jt,this.setupDepthRenderbuffer=Et,this.setupFrameBufferTexture=X,this.useMultisampledRTT=bt}function _g(s,t){function e(n,i=Hn){let r;const a=Qt.getTransfer(i);if(n===Ln)return s.UNSIGNED_BYTE;if(n===go)return s.UNSIGNED_SHORT_4_4_4_4;if(n===xo)return s.UNSIGNED_SHORT_5_5_5_1;if(n===Nc)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===kc)return s.BYTE;if(n===Uc)return s.SHORT;if(n===_s)return s.UNSIGNED_SHORT;if(n===mo)return s.INT;if(n===xi)return s.UNSIGNED_INT;if(n===xn)return s.FLOAT;if(n===Ss)return s.HALF_FLOAT;if(n===zc)return s.ALPHA;if(n===Fc)return s.RGB;if(n===hn)return s.RGBA;if(n===Oc)return s.LUMINANCE;if(n===Bc)return s.LUMINANCE_ALPHA;if(n===qi)return s.DEPTH_COMPONENT;if(n===ji)return s.DEPTH_STENCIL;if(n===vo)return s.RED;if(n===_o)return s.RED_INTEGER;if(n===Gc)return s.RG;if(n===yo)return s.RG_INTEGER;if(n===Mo)return s.RGBA_INTEGER;if(n===sr||n===rr||n===ar||n===or)if(a===se)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===sr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===rr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ar)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===or)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===sr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===rr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ar)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===or)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Aa||n===Ca||n===Ra||n===Pa)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Aa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ca)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ra)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Pa)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===La||n===Da||n===Ia)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===La||n===Da)return a===se?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ia)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===ka||n===Ua||n===Na||n===za||n===Fa||n===Oa||n===Ba||n===Ga||n===Ha||n===Va||n===Wa||n===Xa||n===qa||n===$a)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===ka)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Ua)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Na)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===za)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Fa)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Oa)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ba)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ga)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ha)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Va)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Wa)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Xa)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===qa)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===$a)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===lr||n===Ya||n===Ka)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===lr)return a===se?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Ya)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ka)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Hc||n===Za||n===ja||n===Ja)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===lr)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Za)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===ja)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ja)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Zi?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:e}}class yg extends Qe{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class He extends xe{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Mg={type:"move"};class ua{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new He,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new He,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new He,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,r=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(const x of t.hand.values()){const m=e.getJointPose(x,n),p=this._getHandJoint(c,x);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,g=.005;c.inputState.pinching&&f>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&f<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Mg)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new He;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const Sg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,bg=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Tg{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const i=new Le,r=t.properties.get(i);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Dn({vertexShader:Sg,fragmentShader:bg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new at(new Be(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class wg extends Qi{constructor(t,e){super();const n=this;let i=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,f=null,d=null,g=null;const x=new Tg,m=e.getContextAttributes();let p=null,v=null;const _=[],S=[],P=new gt;let w=null;const E=new Qe;E.layers.enable(1),E.viewport=new ve;const L=new Qe;L.layers.enable(2),L.viewport=new ve;const T=[E,L],y=new yg;y.layers.enable(1),y.layers.enable(2);let C=null,U=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(F){let X=_[F];return X===void 0&&(X=new ua,_[F]=X),X.getTargetRaySpace()},this.getControllerGrip=function(F){let X=_[F];return X===void 0&&(X=new ua,_[F]=X),X.getGripSpace()},this.getHand=function(F){let X=_[F];return X===void 0&&(X=new ua,_[F]=X),X.getHandSpace()};function z(F){const X=S.indexOf(F.inputSource);if(X===-1)return;const it=_[X];it!==void 0&&(it.update(F.inputSource,F.frame,c||a),it.dispatchEvent({type:F.type,data:F.inputSource}))}function G(){i.removeEventListener("select",z),i.removeEventListener("selectstart",z),i.removeEventListener("selectend",z),i.removeEventListener("squeeze",z),i.removeEventListener("squeezestart",z),i.removeEventListener("squeezeend",z),i.removeEventListener("end",G),i.removeEventListener("inputsourceschange",q);for(let F=0;F<_.length;F++){const X=S[F];X!==null&&(S[F]=null,_[F].disconnect(X))}C=null,U=null,x.reset(),t.setRenderTarget(p),d=null,f=null,u=null,i=null,v=null,ct.stop(),n.isPresenting=!1,t.setPixelRatio(w),t.setSize(P.width,P.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(F){r=F,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(F){o=F,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(F){c=F},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(F){if(i=F,i!==null){if(p=t.getRenderTarget(),i.addEventListener("select",z),i.addEventListener("selectstart",z),i.addEventListener("selectend",z),i.addEventListener("squeeze",z),i.addEventListener("squeezestart",z),i.addEventListener("squeezeend",z),i.addEventListener("end",G),i.addEventListener("inputsourceschange",q),m.xrCompatible!==!0&&await e.makeXRCompatible(),w=t.getPixelRatio(),t.getSize(P),i.renderState.layers===void 0){const X={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(i,e,X),i.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),v=new qn(d.framebufferWidth,d.framebufferHeight,{format:hn,type:Ln,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let X=null,it=null,rt=null;m.depth&&(rt=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,X=m.stencil?ji:qi,it=m.stencil?Zi:xi);const Et={colorFormat:e.RGBA8,depthFormat:rt,scaleFactor:r};u=new XRWebGLBinding(i,e),f=u.createProjectionLayer(Et),i.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),v=new qn(f.textureWidth,f.textureHeight,{format:hn,type:Ln,depthTexture:new ih(f.textureWidth,f.textureHeight,it,void 0,void 0,void 0,void 0,void 0,void 0,X),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),ct.setContext(i),ct.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function q(F){for(let X=0;X<F.removed.length;X++){const it=F.removed[X],rt=S.indexOf(it);rt>=0&&(S[rt]=null,_[rt].disconnect(it))}for(let X=0;X<F.added.length;X++){const it=F.added[X];let rt=S.indexOf(it);if(rt===-1){for(let Pt=0;Pt<_.length;Pt++)if(Pt>=S.length){S.push(it),rt=Pt;break}else if(S[Pt]===null){S[Pt]=it,rt=Pt;break}if(rt===-1)break}const Et=_[rt];Et&&Et.connect(it)}}const W=new D,Z=new D;function O(F,X,it){W.setFromMatrixPosition(X.matrixWorld),Z.setFromMatrixPosition(it.matrixWorld);const rt=W.distanceTo(Z),Et=X.projectionMatrix.elements,Pt=it.projectionMatrix.elements,kt=Et[14]/(Et[10]-1),ie=Et[14]/(Et[10]+1),R=(Et[9]+1)/Et[5],de=(Et[9]-1)/Et[5],Jt=(Et[8]-1)/Et[0],te=(Pt[8]+1)/Pt[0],bt=kt*Jt,ue=kt*te,Dt=rt/(-Jt+te),Ut=Dt*-Jt;X.matrixWorld.decompose(F.position,F.quaternion,F.scale),F.translateX(Ut),F.translateZ(Dt),F.matrixWorld.compose(F.position,F.quaternion,F.scale),F.matrixWorldInverse.copy(F.matrixWorld).invert();const A=kt+Dt,M=ie+Dt,V=bt-Ut,j=ue+(rt-Ut),J=R*ie/M*A,K=de*ie/M*A;F.projectionMatrix.makePerspective(V,j,J,K,A,M),F.projectionMatrixInverse.copy(F.projectionMatrix).invert()}function st(F,X){X===null?F.matrixWorld.copy(F.matrix):F.matrixWorld.multiplyMatrices(X.matrixWorld,F.matrix),F.matrixWorldInverse.copy(F.matrixWorld).invert()}this.updateCamera=function(F){if(i===null)return;x.texture!==null&&(F.near=x.depthNear,F.far=x.depthFar),y.near=L.near=E.near=F.near,y.far=L.far=E.far=F.far,(C!==y.near||U!==y.far)&&(i.updateRenderState({depthNear:y.near,depthFar:y.far}),C=y.near,U=y.far,E.near=C,E.far=U,L.near=C,L.far=U,E.updateProjectionMatrix(),L.updateProjectionMatrix(),F.updateProjectionMatrix());const X=F.parent,it=y.cameras;st(y,X);for(let rt=0;rt<it.length;rt++)st(it[rt],X);it.length===2?O(y,E,L):y.projectionMatrix.copy(E.projectionMatrix),ot(F,y,X)};function ot(F,X,it){it===null?F.matrix.copy(X.matrixWorld):(F.matrix.copy(it.matrixWorld),F.matrix.invert(),F.matrix.multiply(X.matrixWorld)),F.matrix.decompose(F.position,F.quaternion,F.scale),F.updateMatrixWorld(!0),F.projectionMatrix.copy(X.projectionMatrix),F.projectionMatrixInverse.copy(X.projectionMatrixInverse),F.isPerspectiveCamera&&(F.fov=Qa*2*Math.atan(1/F.projectionMatrix.elements[5]),F.zoom=1)}this.getCamera=function(){return y},this.getFoveation=function(){if(!(f===null&&d===null))return l},this.setFoveation=function(F){l=F,f!==null&&(f.fixedFoveation=F),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=F)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(y)};let ft=null;function pt(F,X){if(h=X.getViewerPose(c||a),g=X,h!==null){const it=h.views;d!==null&&(t.setRenderTargetFramebuffer(v,d.framebuffer),t.setRenderTarget(v));let rt=!1;it.length!==y.cameras.length&&(y.cameras.length=0,rt=!0);for(let Pt=0;Pt<it.length;Pt++){const kt=it[Pt];let ie=null;if(d!==null)ie=d.getViewport(kt);else{const de=u.getViewSubImage(f,kt);ie=de.viewport,Pt===0&&(t.setRenderTargetTextures(v,de.colorTexture,f.ignoreDepthValues?void 0:de.depthStencilTexture),t.setRenderTarget(v))}let R=T[Pt];R===void 0&&(R=new Qe,R.layers.enable(Pt),R.viewport=new ve,T[Pt]=R),R.matrix.fromArray(kt.transform.matrix),R.matrix.decompose(R.position,R.quaternion,R.scale),R.projectionMatrix.fromArray(kt.projectionMatrix),R.projectionMatrixInverse.copy(R.projectionMatrix).invert(),R.viewport.set(ie.x,ie.y,ie.width,ie.height),Pt===0&&(y.matrix.copy(R.matrix),y.matrix.decompose(y.position,y.quaternion,y.scale)),rt===!0&&y.cameras.push(R)}const Et=i.enabledFeatures;if(Et&&Et.includes("depth-sensing")){const Pt=u.getDepthInformation(it[0]);Pt&&Pt.isValid&&Pt.texture&&x.init(t,Pt,i.renderState)}}for(let it=0;it<_.length;it++){const rt=S[it],Et=_[it];rt!==null&&Et!==void 0&&Et.update(rt,X,c||a)}ft&&ft(F,X),X.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:X}),g=null}const ct=new nh;ct.setAnimationLoop(pt),this.setAnimationLoop=function(F){ft=F},this.dispose=function(){}}}const ti=new un,Eg=new ne;function Ag(s,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,Qc(s)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function i(m,p,v,_,S){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),u(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p)):p.isMeshStandardMaterial?(r(m,p),f(m,p),p.isMeshPhysicalMaterial&&d(m,p,S)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),x(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,v,_):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Ue&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Ue&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const v=t.get(p),_=v.envMap,S=v.envMapRotation;_&&(m.envMap.value=_,ti.copy(S),ti.x*=-1,ti.y*=-1,ti.z*=-1,_.isCubeTexture&&_.isRenderTargetTexture===!1&&(ti.y*=-1,ti.z*=-1),m.envMapRotation.value.setFromMatrix4(Eg.makeRotationFromEuler(ti)),m.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,v,_){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*v,m.scale.value=_*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function f(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,v){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ue&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=v.texture,m.transmissionSamplerSize.value.set(v.width,v.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function x(m,p){const v=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(v.matrixWorld),m.nearDistance.value=v.shadow.camera.near,m.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function Cg(s,t,e,n){let i={},r={},a=[];const o=s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,_){const S=_.program;n.uniformBlockBinding(v,S)}function c(v,_){let S=i[v.id];S===void 0&&(g(v),S=h(v),i[v.id]=S,v.addEventListener("dispose",m));const P=_.program;n.updateUBOMapping(v,P);const w=t.render.frame;r[v.id]!==w&&(f(v),r[v.id]=w)}function h(v){const _=u();v.__bindingPointIndex=_;const S=s.createBuffer(),P=v.__size,w=v.usage;return s.bindBuffer(s.UNIFORM_BUFFER,S),s.bufferData(s.UNIFORM_BUFFER,P,w),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,_,S),S}function u(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(v){const _=i[v.id],S=v.uniforms,P=v.__cache;s.bindBuffer(s.UNIFORM_BUFFER,_);for(let w=0,E=S.length;w<E;w++){const L=Array.isArray(S[w])?S[w]:[S[w]];for(let T=0,y=L.length;T<y;T++){const C=L[T];if(d(C,w,T,P)===!0){const U=C.__offset,z=Array.isArray(C.value)?C.value:[C.value];let G=0;for(let q=0;q<z.length;q++){const W=z[q],Z=x(W);typeof W=="number"||typeof W=="boolean"?(C.__data[0]=W,s.bufferSubData(s.UNIFORM_BUFFER,U+G,C.__data)):W.isMatrix3?(C.__data[0]=W.elements[0],C.__data[1]=W.elements[1],C.__data[2]=W.elements[2],C.__data[3]=0,C.__data[4]=W.elements[3],C.__data[5]=W.elements[4],C.__data[6]=W.elements[5],C.__data[7]=0,C.__data[8]=W.elements[6],C.__data[9]=W.elements[7],C.__data[10]=W.elements[8],C.__data[11]=0):(W.toArray(C.__data,G),G+=Z.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,U,C.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)}function d(v,_,S,P){const w=v.value,E=_+"_"+S;if(P[E]===void 0)return typeof w=="number"||typeof w=="boolean"?P[E]=w:P[E]=w.clone(),!0;{const L=P[E];if(typeof w=="number"||typeof w=="boolean"){if(L!==w)return P[E]=w,!0}else if(L.equals(w)===!1)return L.copy(w),!0}return!1}function g(v){const _=v.uniforms;let S=0;const P=16;for(let E=0,L=_.length;E<L;E++){const T=Array.isArray(_[E])?_[E]:[_[E]];for(let y=0,C=T.length;y<C;y++){const U=T[y],z=Array.isArray(U.value)?U.value:[U.value];for(let G=0,q=z.length;G<q;G++){const W=z[G],Z=x(W),O=S%P;O!==0&&P-O<Z.boundary&&(S+=P-O),U.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),U.__offset=S,S+=Z.storage}}}const w=S%P;return w>0&&(S+=P-w),v.__size=S,v.__cache={},this}function x(v){const _={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(_.boundary=4,_.storage=4):v.isVector2?(_.boundary=8,_.storage=8):v.isVector3||v.isColor?(_.boundary=16,_.storage=12):v.isVector4?(_.boundary=16,_.storage=16):v.isMatrix3?(_.boundary=48,_.storage=48):v.isMatrix4?(_.boundary=64,_.storage=64):v.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",v),_}function m(v){const _=v.target;_.removeEventListener("dispose",m);const S=a.indexOf(_.__bindingPointIndex);a.splice(S,1),s.deleteBuffer(i[_.id]),delete i[_.id],delete r[_.id]}function p(){for(const v in i)s.deleteBuffer(i[v]);a=[],i={},r={}}return{bind:l,update:c,dispose:p}}class Rg{constructor(t={}){const{canvas:e=_u(),context:n=null,depth:i=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=t;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=a;const d=new Uint32Array(4),g=new Int32Array(4);let x=null,m=null;const p=[],v=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=cn,this.toneMapping=Wn,this.toneMappingExposure=1;const _=this;let S=!1,P=0,w=0,E=null,L=-1,T=null;const y=new ve,C=new ve;let U=null;const z=new Bt(0);let G=0,q=e.width,W=e.height,Z=1,O=null,st=null;const ot=new ve(0,0,q,W),ft=new ve(0,0,q,W);let pt=!1;const ct=new To;let F=!1,X=!1;const it=new ne,rt=new D,Et=new ve,Pt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let kt=!1;function ie(){return E===null?Z:1}let R=n;function de(b,k){return e.getContext(b,k)}try{const b={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${fo}`),e.addEventListener("webglcontextlost",$,!1),e.addEventListener("webglcontextrestored",Y,!1),e.addEventListener("webglcontextcreationerror",nt,!1),R===null){const k="webgl2";if(R=de(k,b),R===null)throw de(k)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(b){throw console.error("THREE.WebGLRenderer: "+b.message),b}let Jt,te,bt,ue,Dt,Ut,A,M,V,j,J,K,Tt,ht,xt,zt,Q,mt,Vt,Lt,vt,It,Gt,ae;function I(){Jt=new Nm(R),Jt.init(),It=new _g(R,Jt),te=new Pm(R,Jt,t,It),bt=new gg(R),ue=new Om(R),Dt=new ng,Ut=new vg(R,Jt,bt,Dt,te,It,ue),A=new Dm(_),M=new Um(_),V=new Xu(R),Gt=new Cm(R,V),j=new zm(R,V,ue,Gt),J=new Gm(R,j,V,ue),Vt=new Bm(R,te,Ut),zt=new Lm(Dt),K=new eg(_,A,M,Jt,te,Gt,zt),Tt=new Ag(_,Dt),ht=new sg,xt=new hg(Jt),mt=new Am(_,A,M,bt,J,f,l),Q=new mg(_,J,te),ae=new Cg(R,ue,te,bt),Lt=new Rm(R,Jt,ue),vt=new Fm(R,Jt,ue),ue.programs=K.programs,_.capabilities=te,_.extensions=Jt,_.properties=Dt,_.renderLists=ht,_.shadowMap=Q,_.state=bt,_.info=ue}I();const tt=new wg(_,R);this.xr=tt,this.getContext=function(){return R},this.getContextAttributes=function(){return R.getContextAttributes()},this.forceContextLoss=function(){const b=Jt.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){const b=Jt.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return Z},this.setPixelRatio=function(b){b!==void 0&&(Z=b,this.setSize(q,W,!1))},this.getSize=function(b){return b.set(q,W)},this.setSize=function(b,k,B=!0){if(tt.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}q=b,W=k,e.width=Math.floor(b*Z),e.height=Math.floor(k*Z),B===!0&&(e.style.width=b+"px",e.style.height=k+"px"),this.setViewport(0,0,b,k)},this.getDrawingBufferSize=function(b){return b.set(q*Z,W*Z).floor()},this.setDrawingBufferSize=function(b,k,B){q=b,W=k,Z=B,e.width=Math.floor(b*B),e.height=Math.floor(k*B),this.setViewport(0,0,b,k)},this.getCurrentViewport=function(b){return b.copy(y)},this.getViewport=function(b){return b.copy(ot)},this.setViewport=function(b,k,B,H){b.isVector4?ot.set(b.x,b.y,b.z,b.w):ot.set(b,k,B,H),bt.viewport(y.copy(ot).multiplyScalar(Z).round())},this.getScissor=function(b){return b.copy(ft)},this.setScissor=function(b,k,B,H){b.isVector4?ft.set(b.x,b.y,b.z,b.w):ft.set(b,k,B,H),bt.scissor(C.copy(ft).multiplyScalar(Z).round())},this.getScissorTest=function(){return pt},this.setScissorTest=function(b){bt.setScissorTest(pt=b)},this.setOpaqueSort=function(b){O=b},this.setTransparentSort=function(b){st=b},this.getClearColor=function(b){return b.copy(mt.getClearColor())},this.setClearColor=function(){mt.setClearColor.apply(mt,arguments)},this.getClearAlpha=function(){return mt.getClearAlpha()},this.setClearAlpha=function(){mt.setClearAlpha.apply(mt,arguments)},this.clear=function(b=!0,k=!0,B=!0){let H=0;if(b){let N=!1;if(E!==null){const et=E.texture.format;N=et===Mo||et===yo||et===_o}if(N){const et=E.texture.type,dt=et===Ln||et===xi||et===_s||et===Zi||et===go||et===xo,_t=mt.getClearColor(),yt=mt.getClearAlpha(),Ct=_t.r,Rt=_t.g,wt=_t.b;dt?(d[0]=Ct,d[1]=Rt,d[2]=wt,d[3]=yt,R.clearBufferuiv(R.COLOR,0,d)):(g[0]=Ct,g[1]=Rt,g[2]=wt,g[3]=yt,R.clearBufferiv(R.COLOR,0,g))}else H|=R.COLOR_BUFFER_BIT}k&&(H|=R.DEPTH_BUFFER_BIT),B&&(H|=R.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),R.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",$,!1),e.removeEventListener("webglcontextrestored",Y,!1),e.removeEventListener("webglcontextcreationerror",nt,!1),ht.dispose(),xt.dispose(),Dt.dispose(),A.dispose(),M.dispose(),J.dispose(),Gt.dispose(),ae.dispose(),K.dispose(),tt.dispose(),tt.removeEventListener("sessionstart",fn),tt.removeEventListener("sessionend",zo),Yn.stop()};function $(b){b.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),S=!0}function Y(){console.log("THREE.WebGLRenderer: Context Restored."),S=!1;const b=ue.autoReset,k=Q.enabled,B=Q.autoUpdate,H=Q.needsUpdate,N=Q.type;I(),ue.autoReset=b,Q.enabled=k,Q.autoUpdate=B,Q.needsUpdate=H,Q.type=N}function nt(b){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function At(b){const k=b.target;k.removeEventListener("dispose",At),Xt(k)}function Xt(b){fe(b),Dt.remove(b)}function fe(b){const k=Dt.get(b).programs;k!==void 0&&(k.forEach(function(B){K.releaseProgram(B)}),b.isShaderMaterial&&K.releaseShaderCache(b))}this.renderBufferDirect=function(b,k,B,H,N,et){k===null&&(k=Pt);const dt=N.isMesh&&N.matrixWorld.determinant()<0,_t=Dh(b,k,B,H,N);bt.setMaterial(H,dt);let yt=B.index,Ct=1;if(H.wireframe===!0){if(yt=j.getWireframeAttribute(B),yt===void 0)return;Ct=2}const Rt=B.drawRange,wt=B.attributes.position;let $t=Rt.start*Ct,oe=(Rt.start+Rt.count)*Ct;et!==null&&($t=Math.max($t,et.start*Ct),oe=Math.min(oe,(et.start+et.count)*Ct)),yt!==null?($t=Math.max($t,0),oe=Math.min(oe,yt.count)):wt!=null&&($t=Math.max($t,0),oe=Math.min(oe,wt.count));const le=oe-$t;if(le<0||le===1/0)return;Gt.setup(N,H,_t,B,yt);let Ve,Yt=Lt;if(yt!==null&&(Ve=V.get(yt),Yt=vt,Yt.setIndex(Ve)),N.isMesh)H.wireframe===!0?(bt.setLineWidth(H.wireframeLinewidth*ie()),Yt.setMode(R.LINES)):Yt.setMode(R.TRIANGLES);else if(N.isLine){let St=H.linewidth;St===void 0&&(St=1),bt.setLineWidth(St*ie()),N.isLineSegments?Yt.setMode(R.LINES):N.isLineLoop?Yt.setMode(R.LINE_LOOP):Yt.setMode(R.LINE_STRIP)}else N.isPoints?Yt.setMode(R.POINTS):N.isSprite&&Yt.setMode(R.TRIANGLES);if(N.isBatchedMesh)if(N._multiDrawInstances!==null)Yt.renderMultiDrawInstances(N._multiDrawStarts,N._multiDrawCounts,N._multiDrawCount,N._multiDrawInstances);else if(Jt.get("WEBGL_multi_draw"))Yt.renderMultiDraw(N._multiDrawStarts,N._multiDrawCounts,N._multiDrawCount);else{const St=N._multiDrawStarts,Te=N._multiDrawCounts,Kt=N._multiDrawCount,nn=yt?V.get(yt).bytesPerElement:1,Mi=Dt.get(H).currentProgram.getUniforms();for(let We=0;We<Kt;We++)Mi.setValue(R,"_gl_DrawID",We),Yt.render(St[We]/nn,Te[We])}else if(N.isInstancedMesh)Yt.renderInstances($t,le,N.count);else if(B.isInstancedBufferGeometry){const St=B._maxInstanceCount!==void 0?B._maxInstanceCount:1/0,Te=Math.min(B.instanceCount,St);Yt.renderInstances($t,le,Te)}else Yt.render($t,le)};function be(b,k,B){b.transparent===!0&&b.side===Ye&&b.forceSinglePass===!1?(b.side=Ue,b.needsUpdate=!0,Es(b,k,B),b.side=Xn,b.needsUpdate=!0,Es(b,k,B),b.side=Ye):Es(b,k,B)}this.compile=function(b,k,B=null){B===null&&(B=b),m=xt.get(B),m.init(k),v.push(m),B.traverseVisible(function(N){N.isLight&&N.layers.test(k.layers)&&(m.pushLight(N),N.castShadow&&m.pushShadow(N))}),b!==B&&b.traverseVisible(function(N){N.isLight&&N.layers.test(k.layers)&&(m.pushLight(N),N.castShadow&&m.pushShadow(N))}),m.setupLights();const H=new Set;return b.traverse(function(N){const et=N.material;if(et)if(Array.isArray(et))for(let dt=0;dt<et.length;dt++){const _t=et[dt];be(_t,B,N),H.add(_t)}else be(et,B,N),H.add(et)}),v.pop(),m=null,H},this.compileAsync=function(b,k,B=null){const H=this.compile(b,k,B);return new Promise(N=>{function et(){if(H.forEach(function(dt){Dt.get(dt).currentProgram.isReady()&&H.delete(dt)}),H.size===0){N(b);return}setTimeout(et,10)}Jt.get("KHR_parallel_shader_compile")!==null?et():setTimeout(et,10)})};let qt=null;function Mn(b){qt&&qt(b)}function fn(){Yn.stop()}function zo(){Yn.start()}const Yn=new nh;Yn.setAnimationLoop(Mn),typeof self<"u"&&Yn.setContext(self),this.setAnimationLoop=function(b){qt=b,tt.setAnimationLoop(b),b===null?Yn.stop():Yn.start()},tt.addEventListener("sessionstart",fn),tt.addEventListener("sessionend",zo),this.render=function(b,k){if(k!==void 0&&k.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(S===!0)return;if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),tt.enabled===!0&&tt.isPresenting===!0&&(tt.cameraAutoUpdate===!0&&tt.updateCamera(k),k=tt.getCamera()),b.isScene===!0&&b.onBeforeRender(_,b,k,E),m=xt.get(b,v.length),m.init(k),v.push(m),it.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),ct.setFromProjectionMatrix(it),X=this.localClippingEnabled,F=zt.init(this.clippingPlanes,X),x=ht.get(b,p.length),x.init(),p.push(x),tt.enabled===!0&&tt.isPresenting===!0){const et=_.xr.getDepthSensingMesh();et!==null&&kr(et,k,-1/0,_.sortObjects)}kr(b,k,0,_.sortObjects),x.finish(),_.sortObjects===!0&&x.sort(O,st),kt=tt.enabled===!1||tt.isPresenting===!1||tt.hasDepthSensing()===!1,kt&&mt.addToRenderList(x,b),this.info.render.frame++,F===!0&&zt.beginShadows();const B=m.state.shadowsArray;Q.render(B,b,k),F===!0&&zt.endShadows(),this.info.autoReset===!0&&this.info.reset();const H=x.opaque,N=x.transmissive;if(m.setupLights(),k.isArrayCamera){const et=k.cameras;if(N.length>0)for(let dt=0,_t=et.length;dt<_t;dt++){const yt=et[dt];Oo(H,N,b,yt)}kt&&mt.render(b);for(let dt=0,_t=et.length;dt<_t;dt++){const yt=et[dt];Fo(x,b,yt,yt.viewport)}}else N.length>0&&Oo(H,N,b,k),kt&&mt.render(b),Fo(x,b,k);E!==null&&(Ut.updateMultisampleRenderTarget(E),Ut.updateRenderTargetMipmap(E)),b.isScene===!0&&b.onAfterRender(_,b,k),Gt.resetDefaultState(),L=-1,T=null,v.pop(),v.length>0?(m=v[v.length-1],F===!0&&zt.setGlobalState(_.clippingPlanes,m.state.camera)):m=null,p.pop(),p.length>0?x=p[p.length-1]:x=null};function kr(b,k,B,H){if(b.visible===!1)return;if(b.layers.test(k.layers)){if(b.isGroup)B=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(k);else if(b.isLight)m.pushLight(b),b.castShadow&&m.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||ct.intersectsSprite(b)){H&&Et.setFromMatrixPosition(b.matrixWorld).applyMatrix4(it);const dt=J.update(b),_t=b.material;_t.visible&&x.push(b,dt,_t,B,Et.z,null)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||ct.intersectsObject(b))){const dt=J.update(b),_t=b.material;if(H&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Et.copy(b.boundingSphere.center)):(dt.boundingSphere===null&&dt.computeBoundingSphere(),Et.copy(dt.boundingSphere.center)),Et.applyMatrix4(b.matrixWorld).applyMatrix4(it)),Array.isArray(_t)){const yt=dt.groups;for(let Ct=0,Rt=yt.length;Ct<Rt;Ct++){const wt=yt[Ct],$t=_t[wt.materialIndex];$t&&$t.visible&&x.push(b,dt,$t,B,Et.z,wt)}}else _t.visible&&x.push(b,dt,_t,B,Et.z,null)}}const et=b.children;for(let dt=0,_t=et.length;dt<_t;dt++)kr(et[dt],k,B,H)}function Fo(b,k,B,H){const N=b.opaque,et=b.transmissive,dt=b.transparent;m.setupLightsView(B),F===!0&&zt.setGlobalState(_.clippingPlanes,B),H&&bt.viewport(y.copy(H)),N.length>0&&ws(N,k,B),et.length>0&&ws(et,k,B),dt.length>0&&ws(dt,k,B),bt.buffers.depth.setTest(!0),bt.buffers.depth.setMask(!0),bt.buffers.color.setMask(!0),bt.setPolygonOffset(!1)}function Oo(b,k,B,H){if((B.isScene===!0?B.overrideMaterial:null)!==null)return;m.state.transmissionRenderTarget[H.id]===void 0&&(m.state.transmissionRenderTarget[H.id]=new qn(1,1,{generateMipmaps:!0,type:Jt.has("EXT_color_buffer_half_float")||Jt.has("EXT_color_buffer_float")?Ss:Ln,minFilter:pi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Qt.workingColorSpace}));const et=m.state.transmissionRenderTarget[H.id],dt=H.viewport||y;et.setSize(dt.z,dt.w);const _t=_.getRenderTarget();_.setRenderTarget(et),_.getClearColor(z),G=_.getClearAlpha(),G<1&&_.setClearColor(16777215,.5),kt?mt.render(B):_.clear();const yt=_.toneMapping;_.toneMapping=Wn;const Ct=H.viewport;if(H.viewport!==void 0&&(H.viewport=void 0),m.setupLightsView(H),F===!0&&zt.setGlobalState(_.clippingPlanes,H),ws(b,B,H),Ut.updateMultisampleRenderTarget(et),Ut.updateRenderTargetMipmap(et),Jt.has("WEBGL_multisampled_render_to_texture")===!1){let Rt=!1;for(let wt=0,$t=k.length;wt<$t;wt++){const oe=k[wt],le=oe.object,Ve=oe.geometry,Yt=oe.material,St=oe.group;if(Yt.side===Ye&&le.layers.test(H.layers)){const Te=Yt.side;Yt.side=Ue,Yt.needsUpdate=!0,Bo(le,B,H,Ve,Yt,St),Yt.side=Te,Yt.needsUpdate=!0,Rt=!0}}Rt===!0&&(Ut.updateMultisampleRenderTarget(et),Ut.updateRenderTargetMipmap(et))}_.setRenderTarget(_t),_.setClearColor(z,G),Ct!==void 0&&(H.viewport=Ct),_.toneMapping=yt}function ws(b,k,B){const H=k.isScene===!0?k.overrideMaterial:null;for(let N=0,et=b.length;N<et;N++){const dt=b[N],_t=dt.object,yt=dt.geometry,Ct=H===null?dt.material:H,Rt=dt.group;_t.layers.test(B.layers)&&Bo(_t,k,B,yt,Ct,Rt)}}function Bo(b,k,B,H,N,et){b.onBeforeRender(_,k,B,H,N,et),b.modelViewMatrix.multiplyMatrices(B.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),N.transparent===!0&&N.side===Ye&&N.forceSinglePass===!1?(N.side=Ue,N.needsUpdate=!0,_.renderBufferDirect(B,k,H,N,b,et),N.side=Xn,N.needsUpdate=!0,_.renderBufferDirect(B,k,H,N,b,et),N.side=Ye):_.renderBufferDirect(B,k,H,N,b,et),b.onAfterRender(_,k,B,H,N,et)}function Es(b,k,B){k.isScene!==!0&&(k=Pt);const H=Dt.get(b),N=m.state.lights,et=m.state.shadowsArray,dt=N.state.version,_t=K.getParameters(b,N.state,et,k,B),yt=K.getProgramCacheKey(_t);let Ct=H.programs;H.environment=b.isMeshStandardMaterial?k.environment:null,H.fog=k.fog,H.envMap=(b.isMeshStandardMaterial?M:A).get(b.envMap||H.environment),H.envMapRotation=H.environment!==null&&b.envMap===null?k.environmentRotation:b.envMapRotation,Ct===void 0&&(b.addEventListener("dispose",At),Ct=new Map,H.programs=Ct);let Rt=Ct.get(yt);if(Rt!==void 0){if(H.currentProgram===Rt&&H.lightsStateVersion===dt)return Ho(b,_t),Rt}else _t.uniforms=K.getUniforms(b),b.onBeforeCompile(_t,_),Rt=K.acquireProgram(_t,yt),Ct.set(yt,Rt),H.uniforms=_t.uniforms;const wt=H.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(wt.clippingPlanes=zt.uniform),Ho(b,_t),H.needsLights=kh(b),H.lightsStateVersion=dt,H.needsLights&&(wt.ambientLightColor.value=N.state.ambient,wt.lightProbe.value=N.state.probe,wt.directionalLights.value=N.state.directional,wt.directionalLightShadows.value=N.state.directionalShadow,wt.spotLights.value=N.state.spot,wt.spotLightShadows.value=N.state.spotShadow,wt.rectAreaLights.value=N.state.rectArea,wt.ltc_1.value=N.state.rectAreaLTC1,wt.ltc_2.value=N.state.rectAreaLTC2,wt.pointLights.value=N.state.point,wt.pointLightShadows.value=N.state.pointShadow,wt.hemisphereLights.value=N.state.hemi,wt.directionalShadowMap.value=N.state.directionalShadowMap,wt.directionalShadowMatrix.value=N.state.directionalShadowMatrix,wt.spotShadowMap.value=N.state.spotShadowMap,wt.spotLightMatrix.value=N.state.spotLightMatrix,wt.spotLightMap.value=N.state.spotLightMap,wt.pointShadowMap.value=N.state.pointShadowMap,wt.pointShadowMatrix.value=N.state.pointShadowMatrix),H.currentProgram=Rt,H.uniformsList=null,Rt}function Go(b){if(b.uniformsList===null){const k=b.currentProgram.getUniforms();b.uniformsList=cr.seqWithValue(k.seq,b.uniforms)}return b.uniformsList}function Ho(b,k){const B=Dt.get(b);B.outputColorSpace=k.outputColorSpace,B.batching=k.batching,B.batchingColor=k.batchingColor,B.instancing=k.instancing,B.instancingColor=k.instancingColor,B.instancingMorph=k.instancingMorph,B.skinning=k.skinning,B.morphTargets=k.morphTargets,B.morphNormals=k.morphNormals,B.morphColors=k.morphColors,B.morphTargetsCount=k.morphTargetsCount,B.numClippingPlanes=k.numClippingPlanes,B.numIntersection=k.numClipIntersection,B.vertexAlphas=k.vertexAlphas,B.vertexTangents=k.vertexTangents,B.toneMapping=k.toneMapping}function Dh(b,k,B,H,N){k.isScene!==!0&&(k=Pt),Ut.resetTextureUnits();const et=k.fog,dt=H.isMeshStandardMaterial?k.environment:null,_t=E===null?_.outputColorSpace:E.isXRRenderTarget===!0?E.texture.colorSpace:$n,yt=(H.isMeshStandardMaterial?M:A).get(H.envMap||dt),Ct=H.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,Rt=!!B.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),wt=!!B.morphAttributes.position,$t=!!B.morphAttributes.normal,oe=!!B.morphAttributes.color;let le=Wn;H.toneMapped&&(E===null||E.isXRRenderTarget===!0)&&(le=_.toneMapping);const Ve=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,Yt=Ve!==void 0?Ve.length:0,St=Dt.get(H),Te=m.state.lights;if(F===!0&&(X===!0||b!==T)){const je=b===T&&H.id===L;zt.setState(H,b,je)}let Kt=!1;H.version===St.__version?(St.needsLights&&St.lightsStateVersion!==Te.state.version||St.outputColorSpace!==_t||N.isBatchedMesh&&St.batching===!1||!N.isBatchedMesh&&St.batching===!0||N.isBatchedMesh&&St.batchingColor===!0&&N.colorTexture===null||N.isBatchedMesh&&St.batchingColor===!1&&N.colorTexture!==null||N.isInstancedMesh&&St.instancing===!1||!N.isInstancedMesh&&St.instancing===!0||N.isSkinnedMesh&&St.skinning===!1||!N.isSkinnedMesh&&St.skinning===!0||N.isInstancedMesh&&St.instancingColor===!0&&N.instanceColor===null||N.isInstancedMesh&&St.instancingColor===!1&&N.instanceColor!==null||N.isInstancedMesh&&St.instancingMorph===!0&&N.morphTexture===null||N.isInstancedMesh&&St.instancingMorph===!1&&N.morphTexture!==null||St.envMap!==yt||H.fog===!0&&St.fog!==et||St.numClippingPlanes!==void 0&&(St.numClippingPlanes!==zt.numPlanes||St.numIntersection!==zt.numIntersection)||St.vertexAlphas!==Ct||St.vertexTangents!==Rt||St.morphTargets!==wt||St.morphNormals!==$t||St.morphColors!==oe||St.toneMapping!==le||St.morphTargetsCount!==Yt)&&(Kt=!0):(Kt=!0,St.__version=H.version);let nn=St.currentProgram;Kt===!0&&(nn=Es(H,k,N));let Mi=!1,We=!1,Ur=!1;const pe=nn.getUniforms(),In=St.uniforms;if(bt.useProgram(nn.program)&&(Mi=!0,We=!0,Ur=!0),H.id!==L&&(L=H.id,We=!0),Mi||T!==b){pe.setValue(R,"projectionMatrix",b.projectionMatrix),pe.setValue(R,"viewMatrix",b.matrixWorldInverse);const je=pe.map.cameraPosition;je!==void 0&&je.setValue(R,rt.setFromMatrixPosition(b.matrixWorld)),te.logarithmicDepthBuffer&&pe.setValue(R,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&pe.setValue(R,"isOrthographic",b.isOrthographicCamera===!0),T!==b&&(T=b,We=!0,Ur=!0)}if(N.isSkinnedMesh){pe.setOptional(R,N,"bindMatrix"),pe.setOptional(R,N,"bindMatrixInverse");const je=N.skeleton;je&&(je.boneTexture===null&&je.computeBoneTexture(),pe.setValue(R,"boneTexture",je.boneTexture,Ut))}N.isBatchedMesh&&(pe.setOptional(R,N,"batchingTexture"),pe.setValue(R,"batchingTexture",N._matricesTexture,Ut),pe.setOptional(R,N,"batchingIdTexture"),pe.setValue(R,"batchingIdTexture",N._indirectTexture,Ut),pe.setOptional(R,N,"batchingColorTexture"),N._colorsTexture!==null&&pe.setValue(R,"batchingColorTexture",N._colorsTexture,Ut));const Nr=B.morphAttributes;if((Nr.position!==void 0||Nr.normal!==void 0||Nr.color!==void 0)&&Vt.update(N,B,nn),(We||St.receiveShadow!==N.receiveShadow)&&(St.receiveShadow=N.receiveShadow,pe.setValue(R,"receiveShadow",N.receiveShadow)),H.isMeshGouraudMaterial&&H.envMap!==null&&(In.envMap.value=yt,In.flipEnvMap.value=yt.isCubeTexture&&yt.isRenderTargetTexture===!1?-1:1),H.isMeshStandardMaterial&&H.envMap===null&&k.environment!==null&&(In.envMapIntensity.value=k.environmentIntensity),We&&(pe.setValue(R,"toneMappingExposure",_.toneMappingExposure),St.needsLights&&Ih(In,Ur),et&&H.fog===!0&&Tt.refreshFogUniforms(In,et),Tt.refreshMaterialUniforms(In,H,Z,W,m.state.transmissionRenderTarget[b.id]),cr.upload(R,Go(St),In,Ut)),H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(cr.upload(R,Go(St),In,Ut),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&pe.setValue(R,"center",N.center),pe.setValue(R,"modelViewMatrix",N.modelViewMatrix),pe.setValue(R,"normalMatrix",N.normalMatrix),pe.setValue(R,"modelMatrix",N.matrixWorld),H.isShaderMaterial||H.isRawShaderMaterial){const je=H.uniformsGroups;for(let zr=0,Uh=je.length;zr<Uh;zr++){const Vo=je[zr];ae.update(Vo,nn),ae.bind(Vo,nn)}}return nn}function Ih(b,k){b.ambientLightColor.needsUpdate=k,b.lightProbe.needsUpdate=k,b.directionalLights.needsUpdate=k,b.directionalLightShadows.needsUpdate=k,b.pointLights.needsUpdate=k,b.pointLightShadows.needsUpdate=k,b.spotLights.needsUpdate=k,b.spotLightShadows.needsUpdate=k,b.rectAreaLights.needsUpdate=k,b.hemisphereLights.needsUpdate=k}function kh(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return P},this.getActiveMipmapLevel=function(){return w},this.getRenderTarget=function(){return E},this.setRenderTargetTextures=function(b,k,B){Dt.get(b.texture).__webglTexture=k,Dt.get(b.depthTexture).__webglTexture=B;const H=Dt.get(b);H.__hasExternalTextures=!0,H.__autoAllocateDepthBuffer=B===void 0,H.__autoAllocateDepthBuffer||Jt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),H.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(b,k){const B=Dt.get(b);B.__webglFramebuffer=k,B.__useDefaultFramebuffer=k===void 0},this.setRenderTarget=function(b,k=0,B=0){E=b,P=k,w=B;let H=!0,N=null,et=!1,dt=!1;if(b){const yt=Dt.get(b);yt.__useDefaultFramebuffer!==void 0?(bt.bindFramebuffer(R.FRAMEBUFFER,null),H=!1):yt.__webglFramebuffer===void 0?Ut.setupRenderTarget(b):yt.__hasExternalTextures&&Ut.rebindTextures(b,Dt.get(b.texture).__webglTexture,Dt.get(b.depthTexture).__webglTexture);const Ct=b.texture;(Ct.isData3DTexture||Ct.isDataArrayTexture||Ct.isCompressedArrayTexture)&&(dt=!0);const Rt=Dt.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Rt[k])?N=Rt[k][B]:N=Rt[k],et=!0):b.samples>0&&Ut.useMultisampledRTT(b)===!1?N=Dt.get(b).__webglMultisampledFramebuffer:Array.isArray(Rt)?N=Rt[B]:N=Rt,y.copy(b.viewport),C.copy(b.scissor),U=b.scissorTest}else y.copy(ot).multiplyScalar(Z).floor(),C.copy(ft).multiplyScalar(Z).floor(),U=pt;if(bt.bindFramebuffer(R.FRAMEBUFFER,N)&&H&&bt.drawBuffers(b,N),bt.viewport(y),bt.scissor(C),bt.setScissorTest(U),et){const yt=Dt.get(b.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_CUBE_MAP_POSITIVE_X+k,yt.__webglTexture,B)}else if(dt){const yt=Dt.get(b.texture),Ct=k||0;R.framebufferTextureLayer(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,yt.__webglTexture,B||0,Ct)}L=-1},this.readRenderTargetPixels=function(b,k,B,H,N,et,dt){if(!(b&&b.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let _t=Dt.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&dt!==void 0&&(_t=_t[dt]),_t){bt.bindFramebuffer(R.FRAMEBUFFER,_t);try{const yt=b.texture,Ct=yt.format,Rt=yt.type;if(!te.textureFormatReadable(Ct)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!te.textureTypeReadable(Rt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=b.width-H&&B>=0&&B<=b.height-N&&R.readPixels(k,B,H,N,It.convert(Ct),It.convert(Rt),et)}finally{const yt=E!==null?Dt.get(E).__webglFramebuffer:null;bt.bindFramebuffer(R.FRAMEBUFFER,yt)}}},this.readRenderTargetPixelsAsync=async function(b,k,B,H,N,et,dt){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let _t=Dt.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&dt!==void 0&&(_t=_t[dt]),_t){bt.bindFramebuffer(R.FRAMEBUFFER,_t);try{const yt=b.texture,Ct=yt.format,Rt=yt.type;if(!te.textureFormatReadable(Ct))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!te.textureTypeReadable(Rt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(k>=0&&k<=b.width-H&&B>=0&&B<=b.height-N){const wt=R.createBuffer();R.bindBuffer(R.PIXEL_PACK_BUFFER,wt),R.bufferData(R.PIXEL_PACK_BUFFER,et.byteLength,R.STREAM_READ),R.readPixels(k,B,H,N,It.convert(Ct),It.convert(Rt),0),R.flush();const $t=R.fenceSync(R.SYNC_GPU_COMMANDS_COMPLETE,0);await yu(R,$t,4);try{R.bindBuffer(R.PIXEL_PACK_BUFFER,wt),R.getBufferSubData(R.PIXEL_PACK_BUFFER,0,et)}finally{R.deleteBuffer(wt),R.deleteSync($t)}return et}}finally{const yt=E!==null?Dt.get(E).__webglFramebuffer:null;bt.bindFramebuffer(R.FRAMEBUFFER,yt)}}},this.copyFramebufferToTexture=function(b,k=null,B=0){b.isTexture!==!0&&(console.warn("WebGLRenderer: copyFramebufferToTexture function signature has changed."),k=arguments[0]||null,b=arguments[1]);const H=Math.pow(2,-B),N=Math.floor(b.image.width*H),et=Math.floor(b.image.height*H),dt=k!==null?k.x:0,_t=k!==null?k.y:0;Ut.setTexture2D(b,0),R.copyTexSubImage2D(R.TEXTURE_2D,B,0,0,dt,_t,N,et),bt.unbindTexture()},this.copyTextureToTexture=function(b,k,B=null,H=null,N=0){b.isTexture!==!0&&(console.warn("WebGLRenderer: copyTextureToTexture function signature has changed."),H=arguments[0]||null,b=arguments[1],k=arguments[2],N=arguments[3]||0,B=null);let et,dt,_t,yt,Ct,Rt;B!==null?(et=B.max.x-B.min.x,dt=B.max.y-B.min.y,_t=B.min.x,yt=B.min.y):(et=b.image.width,dt=b.image.height,_t=0,yt=0),H!==null?(Ct=H.x,Rt=H.y):(Ct=0,Rt=0);const wt=It.convert(k.format),$t=It.convert(k.type);Ut.setTexture2D(k,0),R.pixelStorei(R.UNPACK_FLIP_Y_WEBGL,k.flipY),R.pixelStorei(R.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),R.pixelStorei(R.UNPACK_ALIGNMENT,k.unpackAlignment);const oe=R.getParameter(R.UNPACK_ROW_LENGTH),le=R.getParameter(R.UNPACK_IMAGE_HEIGHT),Ve=R.getParameter(R.UNPACK_SKIP_PIXELS),Yt=R.getParameter(R.UNPACK_SKIP_ROWS),St=R.getParameter(R.UNPACK_SKIP_IMAGES),Te=b.isCompressedTexture?b.mipmaps[N]:b.image;R.pixelStorei(R.UNPACK_ROW_LENGTH,Te.width),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,Te.height),R.pixelStorei(R.UNPACK_SKIP_PIXELS,_t),R.pixelStorei(R.UNPACK_SKIP_ROWS,yt),b.isDataTexture?R.texSubImage2D(R.TEXTURE_2D,N,Ct,Rt,et,dt,wt,$t,Te.data):b.isCompressedTexture?R.compressedTexSubImage2D(R.TEXTURE_2D,N,Ct,Rt,Te.width,Te.height,wt,Te.data):R.texSubImage2D(R.TEXTURE_2D,N,Ct,Rt,et,dt,wt,$t,Te),R.pixelStorei(R.UNPACK_ROW_LENGTH,oe),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,le),R.pixelStorei(R.UNPACK_SKIP_PIXELS,Ve),R.pixelStorei(R.UNPACK_SKIP_ROWS,Yt),R.pixelStorei(R.UNPACK_SKIP_IMAGES,St),N===0&&k.generateMipmaps&&R.generateMipmap(R.TEXTURE_2D),bt.unbindTexture()},this.copyTextureToTexture3D=function(b,k,B=null,H=null,N=0){b.isTexture!==!0&&(console.warn("WebGLRenderer: copyTextureToTexture3D function signature has changed."),B=arguments[0]||null,H=arguments[1]||null,b=arguments[2],k=arguments[3],N=arguments[4]||0);let et,dt,_t,yt,Ct,Rt,wt,$t,oe;const le=b.isCompressedTexture?b.mipmaps[N]:b.image;B!==null?(et=B.max.x-B.min.x,dt=B.max.y-B.min.y,_t=B.max.z-B.min.z,yt=B.min.x,Ct=B.min.y,Rt=B.min.z):(et=le.width,dt=le.height,_t=le.depth,yt=0,Ct=0,Rt=0),H!==null?(wt=H.x,$t=H.y,oe=H.z):(wt=0,$t=0,oe=0);const Ve=It.convert(k.format),Yt=It.convert(k.type);let St;if(k.isData3DTexture)Ut.setTexture3D(k,0),St=R.TEXTURE_3D;else if(k.isDataArrayTexture||k.isCompressedArrayTexture)Ut.setTexture2DArray(k,0),St=R.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}R.pixelStorei(R.UNPACK_FLIP_Y_WEBGL,k.flipY),R.pixelStorei(R.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),R.pixelStorei(R.UNPACK_ALIGNMENT,k.unpackAlignment);const Te=R.getParameter(R.UNPACK_ROW_LENGTH),Kt=R.getParameter(R.UNPACK_IMAGE_HEIGHT),nn=R.getParameter(R.UNPACK_SKIP_PIXELS),Mi=R.getParameter(R.UNPACK_SKIP_ROWS),We=R.getParameter(R.UNPACK_SKIP_IMAGES);R.pixelStorei(R.UNPACK_ROW_LENGTH,le.width),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,le.height),R.pixelStorei(R.UNPACK_SKIP_PIXELS,yt),R.pixelStorei(R.UNPACK_SKIP_ROWS,Ct),R.pixelStorei(R.UNPACK_SKIP_IMAGES,Rt),b.isDataTexture||b.isData3DTexture?R.texSubImage3D(St,N,wt,$t,oe,et,dt,_t,Ve,Yt,le.data):k.isCompressedArrayTexture?R.compressedTexSubImage3D(St,N,wt,$t,oe,et,dt,_t,Ve,le.data):R.texSubImage3D(St,N,wt,$t,oe,et,dt,_t,Ve,Yt,le),R.pixelStorei(R.UNPACK_ROW_LENGTH,Te),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,Kt),R.pixelStorei(R.UNPACK_SKIP_PIXELS,nn),R.pixelStorei(R.UNPACK_SKIP_ROWS,Mi),R.pixelStorei(R.UNPACK_SKIP_IMAGES,We),N===0&&k.generateMipmaps&&R.generateMipmap(St),bt.unbindTexture()},this.initRenderTarget=function(b){Dt.get(b).__webglFramebuffer===void 0&&Ut.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?Ut.setTextureCube(b,0):b.isData3DTexture?Ut.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?Ut.setTexture2DArray(b,0):Ut.setTexture2D(b,0),bt.unbindTexture()},this.resetState=function(){P=0,w=0,E=null,bt.reset(),Gt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Pn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===bo?"display-p3":"srgb",e.unpackColorSpace=Qt.workingColorSpace===Rr?"display-p3":"srgb"}}class Ao{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new Bt(t),this.near=e,this.far=n}clone(){return new Ao(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class Ql extends xe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new un,this.environmentIntensity=1,this.environmentRotation=new un,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class Pg extends Le{constructor(t=null,e=1,n=1,i,r,a,o,l,c=ke,h=ke,u,f){super(null,a,o,l,c,h,i,r,u,f),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class tc extends Ne{constructor(t,e,n,i=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Bi=new ne,ec=new ne,Js=[],nc=new _i,Lg=new ne,ls=new at,cs=new ts;class ic extends at{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new tc(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,Lg)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new _i),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Bi),nc.copy(t.boundingBox).applyMatrix4(Bi),this.boundingBox.union(nc)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new ts),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Bi),cs.copy(t.boundingSphere).applyMatrix4(Bi),this.boundingSphere.union(cs)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=i[a+o]}raycast(t,e){const n=this.matrixWorld,i=this.count;if(ls.geometry=this.geometry,ls.material=this.material,ls.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),cs.copy(this.boundingSphere),cs.applyMatrix4(n),t.ray.intersectsSphere(cs)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,Bi),ec.multiplyMatrices(n,Bi),ls.matrixWorld=ec,ls.raycast(t,Js);for(let a=0,o=Js.length;a<o;a++){const l=Js[a];l.instanceId=r,l.object=this,e.push(l)}Js.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new tc(new Float32Array(this.instanceMatrix.count*3),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Pg(new Float32Array(i*this.count),i,this.count,vo,xn));const r=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=i*t;r[l]=o,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class lh extends yi{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Bt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const sc=new ne,eo=new Yc,Qs=new ts,tr=new D;class ch extends xe{constructor(t=new ze,e=new lh){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Qs.copy(n.boundingSphere),Qs.applyMatrix4(i),Qs.radius+=r,t.ray.intersectsSphere(Qs)===!1)return;sc.copy(i).invert(),eo.copy(t.ray).applyMatrix4(sc);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,u=n.attributes.position;if(c!==null){const f=Math.max(0,a.start),d=Math.min(c.count,a.start+a.count);for(let g=f,x=d;g<x;g++){const m=c.getX(g);tr.fromBufferAttribute(u,m),rc(tr,m,l,i,t,e,this)}}else{const f=Math.max(0,a.start),d=Math.min(u.count,a.start+a.count);for(let g=f,x=d;g<x;g++)tr.fromBufferAttribute(u,g),rc(tr,g,l,i,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function rc(s,t,e,n,i,r,a){const o=eo.distanceSqToPoint(s);if(o<e){const l=new D;eo.closestPointToPoint(s,l),l.applyMatrix4(n);const c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,object:a})}}class ri extends Le{constructor(t,e,n,i,r,a,o,l,c){super(t,e,n,i,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class yn{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,i=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),r+=n.distanceTo(i),e.push(r),i=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let i=0;const r=n.length;let a;e?a=e:a=t*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(i=Math.floor(o+(l-o)/2),c=n[i]-a,c<0)o=i+1;else if(c>0)l=i-1;else{l=i;break}if(i=l,n[i]===a)return i/(r-1);const h=n[i],f=n[i+1]-h,d=(a-h)/f;return(i+d)/(r-1)}getTangent(t,e){let i=t-1e-4,r=t+1e-4;i<0&&(i=0),r>1&&(r=1);const a=this.getPoint(i),o=this.getPoint(r),l=e||(a.isVector2?new gt:new D);return l.copy(o).sub(a).normalize(),l}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new D,i=[],r=[],a=[],o=new D,l=new ne;for(let d=0;d<=t;d++){const g=d/t;i[d]=this.getTangentAt(g,new D)}r[0]=new D,a[0]=new D;let c=Number.MAX_VALUE;const h=Math.abs(i[0].x),u=Math.abs(i[0].y),f=Math.abs(i[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),f<=c&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],o),a[0].crossVectors(i[0],r[0]);for(let d=1;d<=t;d++){if(r[d]=r[d-1].clone(),a[d]=a[d-1].clone(),o.crossVectors(i[d-1],i[d]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(we(i[d-1].dot(i[d]),-1,1));r[d].applyMatrix4(l.makeRotationAxis(o,g))}a[d].crossVectors(i[d],r[d])}if(e===!0){let d=Math.acos(we(r[0].dot(r[t]),-1,1));d/=t,i[0].dot(o.crossVectors(r[0],r[t]))>0&&(d=-d);for(let g=1;g<=t;g++)r[g].applyMatrix4(l.makeRotationAxis(i[g],d*g)),a[g].crossVectors(i[g],r[g])}return{tangents:i,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Co extends yn{constructor(t=0,e=0,n=1,i=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(t,e=new gt){const n=e,i=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(a?r=0:r=i),this.aClockwise===!0&&!a&&(r===i?r=-i:r=r-i);const o=this.aStartAngle+t*r;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),f=l-this.aX,d=c-this.aY;l=f*h-d*u+this.aX,c=f*u+d*h+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class Dg extends Co{constructor(t,e,n,i,r,a){super(t,e,n,n,i,r,a),this.isArcCurve=!0,this.type="ArcCurve"}}function Ro(){let s=0,t=0,e=0,n=0;function i(r,a,o,l){s=r,t=o,e=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){i(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,u){let f=(a-r)/c-(o-r)/(c+h)+(o-a)/h,d=(o-a)/h-(l-a)/(h+u)+(l-o)/u;f*=h,d*=h,i(a,o,f,d)},calc:function(r){const a=r*r,o=a*r;return s+t*r+e*a+n*o}}}const er=new D,fa=new Ro,pa=new Ro,ma=new Ro;class Ig extends yn{constructor(t=[],e=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=i}getPoint(t,e=new D){const n=e,i=this.points,r=i.length,a=(r-(this.closed?0:1))*t;let o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=i[(o-1)%r]:(er.subVectors(i[0],i[1]).add(i[0]),c=er);const u=i[o%r],f=i[(o+1)%r];if(this.closed||o+2<r?h=i[(o+2)%r]:(er.subVectors(i[r-1],i[r-2]).add(i[r-1]),h=er),this.curveType==="centripetal"||this.curveType==="chordal"){const d=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(u),d),x=Math.pow(u.distanceToSquared(f),d),m=Math.pow(f.distanceToSquared(h),d);x<1e-4&&(x=1),g<1e-4&&(g=x),m<1e-4&&(m=x),fa.initNonuniformCatmullRom(c.x,u.x,f.x,h.x,g,x,m),pa.initNonuniformCatmullRom(c.y,u.y,f.y,h.y,g,x,m),ma.initNonuniformCatmullRom(c.z,u.z,f.z,h.z,g,x,m)}else this.curveType==="catmullrom"&&(fa.initCatmullRom(c.x,u.x,f.x,h.x,this.tension),pa.initCatmullRom(c.y,u.y,f.y,h.y,this.tension),ma.initCatmullRom(c.z,u.z,f.z,h.z,this.tension));return n.set(fa.calc(l),pa.calc(l),ma.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new D().fromArray(i))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function ac(s,t,e,n,i){const r=(n-t)*.5,a=(i-e)*.5,o=s*s,l=s*o;return(2*e-2*n+r+a)*l+(-3*e+3*n-2*r-a)*o+r*s+e}function kg(s,t){const e=1-s;return e*e*t}function Ug(s,t){return 2*(1-s)*s*t}function Ng(s,t){return s*s*t}function ps(s,t,e,n){return kg(s,t)+Ug(s,e)+Ng(s,n)}function zg(s,t){const e=1-s;return e*e*e*t}function Fg(s,t){const e=1-s;return 3*e*e*s*t}function Og(s,t){return 3*(1-s)*s*s*t}function Bg(s,t){return s*s*s*t}function ms(s,t,e,n,i){return zg(s,t)+Fg(s,e)+Og(s,n)+Bg(s,i)}class hh extends yn{constructor(t=new gt,e=new gt,n=new gt,i=new gt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new gt){const n=e,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(ms(t,i.x,r.x,a.x,o.x),ms(t,i.y,r.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Gg extends yn{constructor(t=new D,e=new D,n=new D,i=new D){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new D){const n=e,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(ms(t,i.x,r.x,a.x,o.x),ms(t,i.y,r.y,a.y,o.y),ms(t,i.z,r.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class dh extends yn{constructor(t=new gt,e=new gt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new gt){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new gt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Hg extends yn{constructor(t=new D,e=new D){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new D){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new D){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class uh extends yn{constructor(t=new gt,e=new gt,n=new gt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new gt){const n=e,i=this.v0,r=this.v1,a=this.v2;return n.set(ps(t,i.x,r.x,a.x),ps(t,i.y,r.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Vg extends yn{constructor(t=new D,e=new D,n=new D){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new D){const n=e,i=this.v0,r=this.v1,a=this.v2;return n.set(ps(t,i.x,r.x,a.x),ps(t,i.y,r.y,a.y),ps(t,i.z,r.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class fh extends yn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new gt){const n=e,i=this.points,r=(i.length-1)*t,a=Math.floor(r),o=r-a,l=i[a===0?a:a-1],c=i[a],h=i[a>i.length-2?i.length-1:a+1],u=i[a>i.length-3?i.length-1:a+2];return n.set(ac(o,l.x,c.x,h.x,u.x),ac(o,l.y,c.y,h.y,u.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new gt().fromArray(i))}return this}}var oc=Object.freeze({__proto__:null,ArcCurve:Dg,CatmullRomCurve3:Ig,CubicBezierCurve:hh,CubicBezierCurve3:Gg,EllipseCurve:Co,LineCurve:dh,LineCurve3:Hg,QuadraticBezierCurve:uh,QuadraticBezierCurve3:Vg,SplineCurve:fh});class Wg extends yn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new oc[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),i=this.getCurveLengths();let r=0;for(;r<i.length;){if(i[r]>=n){const a=i[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,i=this.curves.length;n<i;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let i=0,r=this.curves;i<r.length;i++){const a=r[i],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,l=a.getPoints(o);for(let c=0;c<l.length;c++){const h=l[c];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(i.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const i=this.curves[e];t.curves.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(new oc[i.type]().fromJSON(i))}return this}}class Xg extends Wg{constructor(t){super(),this.type="Path",this.currentPoint=new gt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new dh(this.currentPoint.clone(),new gt(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,i){const r=new uh(this.currentPoint.clone(),new gt(t,e),new gt(n,i));return this.curves.push(r),this.currentPoint.set(n,i),this}bezierCurveTo(t,e,n,i,r,a){const o=new hh(this.currentPoint.clone(),new gt(t,e),new gt(n,i),new gt(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new fh(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,i,r,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,n,i,r,a),this}absarc(t,e,n,i,r,a){return this.absellipse(t,e,n,n,i,r,a),this}ellipse(t,e,n,i,r,a,o,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+c,e+h,n,i,r,a,o,l),this}absellipse(t,e,n,i,r,a,o,l){const c=new Co(t,e,n,i,r,a,o,l);if(this.curves.length>0){const u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class Po extends ze{constructor(t=[new gt(0,-.5),new gt(.5,0),new gt(0,.5)],e=12,n=0,i=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:i},e=Math.floor(e),i=we(i,0,Math.PI*2);const r=[],a=[],o=[],l=[],c=[],h=1/e,u=new D,f=new gt,d=new D,g=new D,x=new D;let m=0,p=0;for(let v=0;v<=t.length-1;v++)switch(v){case 0:m=t[v+1].x-t[v].x,p=t[v+1].y-t[v].y,d.x=p*1,d.y=-m,d.z=p*0,x.copy(d),d.normalize(),l.push(d.x,d.y,d.z);break;case t.length-1:l.push(x.x,x.y,x.z);break;default:m=t[v+1].x-t[v].x,p=t[v+1].y-t[v].y,d.x=p*1,d.y=-m,d.z=p*0,g.copy(d),d.x+=x.x,d.y+=x.y,d.z+=x.z,d.normalize(),l.push(d.x,d.y,d.z),x.copy(g)}for(let v=0;v<=e;v++){const _=n+v*h*i,S=Math.sin(_),P=Math.cos(_);for(let w=0;w<=t.length-1;w++){u.x=t[w].x*S,u.y=t[w].y,u.z=t[w].x*P,a.push(u.x,u.y,u.z),f.x=v/e,f.y=w/(t.length-1),o.push(f.x,f.y);const E=l[3*w+0]*S,L=l[3*w+1],T=l[3*w+0]*P;c.push(E,L,T)}}for(let v=0;v<e;v++)for(let _=0;_<t.length-1;_++){const S=_+v*t.length,P=S,w=S+t.length,E=S+t.length+1,L=S+1;r.push(P,w,L),r.push(E,L,w)}this.setIndex(r),this.setAttribute("position",new ce(a,3)),this.setAttribute("uv",new ce(o,2)),this.setAttribute("normal",new ce(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Po(t.points,t.segments,t.phiStart,t.phiLength)}}class Lr extends Po{constructor(t=1,e=1,n=4,i=8){const r=new Xg;r.absarc(0,-e/2,t,Math.PI*1.5,0),r.absarc(0,e/2,t,0,Math.PI*.5),super(r.getPoints(n),i),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:n,radialSegments:i}}static fromJSON(t){return new Lr(t.radius,t.length,t.capSegments,t.radialSegments)}}class gs extends ze{constructor(t=1,e=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:i},e=Math.max(3,e);const r=[],a=[],o=[],l=[],c=new D,h=new gt;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,f=3;u<=e;u++,f+=3){const d=n+u/e*i;c.x=t*Math.cos(d),c.y=t*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[f]/t+1)/2,h.y=(a[f+1]/t+1)/2,l.push(h.x,h.y)}for(let u=1;u<=e;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new ce(a,3)),this.setAttribute("normal",new ce(o,3)),this.setAttribute("uv",new ce(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new gs(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class dn extends ze{constructor(t=1,e=1,n=1,i=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};const c=this;i=Math.floor(i),r=Math.floor(r);const h=[],u=[],f=[],d=[];let g=0;const x=[],m=n/2;let p=0;v(),a===!1&&(t>0&&_(!0),e>0&&_(!1)),this.setIndex(h),this.setAttribute("position",new ce(u,3)),this.setAttribute("normal",new ce(f,3)),this.setAttribute("uv",new ce(d,2));function v(){const S=new D,P=new D;let w=0;const E=(e-t)/n;for(let L=0;L<=r;L++){const T=[],y=L/r,C=y*(e-t)+t;for(let U=0;U<=i;U++){const z=U/i,G=z*l+o,q=Math.sin(G),W=Math.cos(G);P.x=C*q,P.y=-y*n+m,P.z=C*W,u.push(P.x,P.y,P.z),S.set(q,E,W).normalize(),f.push(S.x,S.y,S.z),d.push(z,1-y),T.push(g++)}x.push(T)}for(let L=0;L<i;L++)for(let T=0;T<r;T++){const y=x[T][L],C=x[T+1][L],U=x[T+1][L+1],z=x[T][L+1];h.push(y,C,z),h.push(C,U,z),w+=6}c.addGroup(p,w,0),p+=w}function _(S){const P=g,w=new gt,E=new D;let L=0;const T=S===!0?t:e,y=S===!0?1:-1;for(let U=1;U<=i;U++)u.push(0,m*y,0),f.push(0,y,0),d.push(.5,.5),g++;const C=g;for(let U=0;U<=i;U++){const G=U/i*l+o,q=Math.cos(G),W=Math.sin(G);E.x=T*W,E.y=m*y,E.z=T*q,u.push(E.x,E.y,E.z),f.push(0,y,0),w.x=q*.5+.5,w.y=W*.5*y+.5,d.push(w.x,w.y),g++}for(let U=0;U<i;U++){const z=P+U,G=C+U;S===!0?h.push(G,G+1,z):h.push(G+1,G,z),L+=3}c.addGroup(p,L,S===!0?1:2),p+=L}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new dn(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Lo extends dn{constructor(t=1,e=1,n=32,i=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,i,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:i,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new Lo(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Hi extends ze{constructor(t=.5,e=1,n=32,i=1,r=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:i,thetaStart:r,thetaLength:a},n=Math.max(3,n),i=Math.max(1,i);const o=[],l=[],c=[],h=[];let u=t;const f=(e-t)/i,d=new D,g=new gt;for(let x=0;x<=i;x++){for(let m=0;m<=n;m++){const p=r+m/n*a;d.x=u*Math.cos(p),d.y=u*Math.sin(p),l.push(d.x,d.y,d.z),c.push(0,0,1),g.x=(d.x/e+1)/2,g.y=(d.y/e+1)/2,h.push(g.x,g.y)}u+=f}for(let x=0;x<i;x++){const m=x*(n+1);for(let p=0;p<n;p++){const v=p+m,_=v,S=v+n+1,P=v+n+2,w=v+1;o.push(_,S,w),o.push(S,P,w)}}this.setIndex(o),this.setAttribute("position",new ce(l,3)),this.setAttribute("normal",new ce(c,3)),this.setAttribute("uv",new ce(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Hi(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class mi extends ze{constructor(t=1,e=32,n=16,i=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:i,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const h=[],u=new D,f=new D,d=[],g=[],x=[],m=[];for(let p=0;p<=n;p++){const v=[],_=p/n;let S=0;p===0&&a===0?S=.5/e:p===n&&l===Math.PI&&(S=-.5/e);for(let P=0;P<=e;P++){const w=P/e;u.x=-t*Math.cos(i+w*r)*Math.sin(a+_*o),u.y=t*Math.cos(a+_*o),u.z=t*Math.sin(i+w*r)*Math.sin(a+_*o),g.push(u.x,u.y,u.z),f.copy(u).normalize(),x.push(f.x,f.y,f.z),m.push(w+S,1-_),v.push(c++)}h.push(v)}for(let p=0;p<n;p++)for(let v=0;v<e;v++){const _=h[p][v+1],S=h[p][v],P=h[p+1][v],w=h[p+1][v+1];(p!==0||a>0)&&d.push(_,S,w),(p!==n-1||l<Math.PI)&&d.push(S,P,w)}this.setIndex(d),this.setAttribute("position",new ce(g,3)),this.setAttribute("normal",new ce(x,3)),this.setAttribute("uv",new ce(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new mi(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class ln extends yi{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Bt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Bt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=So,this.normalScale=new gt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new un,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class lc extends yi{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Bt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Bt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=So,this.normalScale=new gt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new un,this.combine=po,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Do extends xe{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Bt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class qg extends Do{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(xe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Bt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const ga=new ne,cc=new D,hc=new D;class $g{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new gt(512,512),this.map=null,this.mapPass=null,this.matrix=new ne,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new To,this._frameExtents=new gt(1,1),this._viewportCount=1,this._viewports=[new ve(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;cc.setFromMatrixPosition(t.matrixWorld),e.position.copy(cc),hc.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(hc),e.updateMatrixWorld(),ga.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ga),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ga)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class Yg extends $g{constructor(){super(new wo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class dc extends Do{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(xe.DEFAULT_UP),this.updateMatrix(),this.target=new xe,this.shadow=new Yg}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class Kg extends Do{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:fo}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=fo);const _n=new Map;function uc(s,t,e){const n=`${e}:${s.toFixed(3)}:${t.toFixed(3)}`;let i=_n.get(n);return i||(i=new Lr(s,t,3,8),_n.set(n,i)),i}function ei(s,t){const e=`${t}:${s.toFixed(3)}`;let n=_n.get(e);return n||(n=new mi(s,12,10),_n.set(e,n)),n}function pn(s,t,e,n){const i=`${n}:${s}:${t}:${e}`;let r=_n.get(i);return r||(r=new vn(s,t,e),_n.set(i,r)),r}function fc(s,t,e){const n=`${e}:${s}:${t}`;let i=_n.get(n);return i||(i=new Lo(s,t,6),_n.set(n,i)),i}function ni(s,t,e,n){const i=`${n}:${s.toFixed(3)}:${t.toFixed(3)}:${e.toFixed(3)}`;let r=_n.get(i);return r||(r=new dn(s,t,e,10),_n.set(i,r)),r}const pc=new Map;function Oe(s,t=.85,e=.02){const n=`${s}:${t}:${e}`;let i=pc.get(n);return i||(i=new ln({color:s,roughness:t,metalness:e}),pc.set(n,i)),i}function mc(s,t){const e=Math.round((s>>16&255)*t),n=Math.round((s>>8&255)*t),i=Math.round((s&255)*t);return e<<16|n<<8|i}function Zt(s){return s.castShadow=!0,s}function Zg(s,t,e){if(s.appearance)return s.appearance;const n=e||s.toughness>=1.2?"heavy":s.speed>=1.15?"slim":"medium",i=Math.round(s.power*20+s.speed*17+s.toughness*13+t*7),r=e?"short":["short","spiky","long","bald","mohawk","ponytail","curly","buzz"][i%8],a=["normal","smile","frown"][i%3];return{build:n,hairStyle:r,face:a}}const jt={legUpper:.44,legLower:.42,footY:.06,torsoH:.62,torsoR:.17,armUpper:.3,armLower:.28,headR:.13},us=jt.footY+jt.legLower+jt.legUpper+.05,jg=us+jt.torsoH,Jg=jg+.19;function Qg(s,t){const e=document.createElement("canvas");e.width=64,e.height=64;const n=e.getContext("2d");n.clearRect(0,0,64,64);const i=(t>>16&255)/255,r=(t>>8&255)/255,a=(t&255)/255,o=.299*i+.587*r+.114*a;return n.fillStyle=o>.55?"#101014":"#f4f4f8",n.font='bold 46px "Courier New",monospace',n.textAlign="center",n.textBaseline="middle",n.fillText(String(s+1),32,34),new ri(e)}function tx(s,t,e,n,i=1){const r=new He;r.scale.setScalar(Fh);const a=new He;r.add(a);const o=Zg(s,i,n),l=o.build==="heavy"?1.22:o.build==="slim"?.9:1,c=(jt.torsoR+.045)*l,h=.065*(l*.82+.18),u=.055*(l*.75+.25),f=n?mc(t,.45):t,d=n?14211146:e,g=Oe(s.skin,.75),x=Oe(f,.72,.04),m=Oe(d,.72,.04),p=Oe(d,.85),v=Oe(1579036,.55,.06),_=new He;_.position.y=us,a.add(_);const S=Zt(new at(uc(c,jt.torsoH-.24,"chest"),x));S.position.y=jt.torsoH/2+.05,_.add(S);const P=c*(o.build==="heavy"?.82:o.build==="slim"?.62:.72),w=Zt(new at(ni(c*.94,P,jt.torsoH*.42,"waist"),x));w.position.y=jt.torsoH*.24,_.add(w);for(const pt of[-1,1]){const ct=Zt(new at(ei(c*.52,"shoulderBall"),x));ct.position.set(pt*(c+u*.4),jt.torsoH-.06,0),_.add(ct)}for(const pt of[-.55,.55]){const ct=new at(new vn(.03,jt.torsoH-.28,.02),new Ce({color:d,transparent:!0,opacity:.85}));ct.position.set(pt*c*1.9,jt.torsoH/2,-c-.005),_.add(ct);const F=ct.clone();F.position.z=c+.005,_.add(F)}const E=Zt(new at(pn(.4*l,.075,.26*l,"hem"),m));E.position.y=.1,_.add(E);const L=Qg(i,f),T=Zt(new at(new Be(.16,.16),new Ce({map:L,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-1})));T.position.set(0,jt.torsoH/2,c+.012),_.add(T);const y=Zt(new at(new Be(.18,.18),new Ce({map:L,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-1})));y.position.set(0,jt.torsoH/2,-c-.012),y.rotation.y=Math.PI,_.add(y);const C=Zt(new at(ni(.042,.062,.09,"neck"),g));C.position.y=jt.torsoH+.05,_.add(C);const U=Zt(new at(ei(jt.headR,"head"),g));U.scale.set(1,1.08,.98),U.position.y=Jg-us,_.add(U);for(const pt of[-1,1]){const ct=new at(ei(.028,"ear"),g);ct.scale.set(.5,1,.8),ct.position.set(pt*(jt.headR-.004),.005,0),U.add(ct)}const z=pt=>{const ct=new at(ei(.02,"eyeWhite"),Oe(16052972,.4));ct.scale.set(1,1.15,.45),ct.position.set(pt*.045,.038,jt.headR*.92+.004),U.add(ct);const F=new at(pn(.016,.022,.012,"pupil"),Oe(1315868,.35));F.position.set(pt*.045,.038,jt.headR*.98+.006),U.add(F);const X=Zt(new at(pn(.046,.016,.014,"brow"),Oe(s.hair,.85)));X.position.set(pt*.047,o.face==="frown"?.082:.076,jt.headR*.96+.006),X.rotation.z=pt*(o.face==="frown"?-.28:o.face==="smile"?.1:0),U.add(X)};z(-1),z(1);const G=Zt(new at(pn(.06,.014,.014,"mouth"),Oe(5906464,.5)));if(G.position.set(0,o.face==="frown"?-.09:-.05,jt.headR+.006),(o.face==="smile"||o.face==="frown")&&(G.rotation.z=0),U.add(G),o.hairStyle!=="bald"){const pt=ei(jt.headR+.015,"hair"),ct=Oe(s.hair,.95);if(o.hairStyle==="short"){const F=Zt(new at(pt,ct));F.scale.set(1,.72,1),F.position.y=.05,U.add(F)}else if(o.hairStyle==="spiky"){const F=Zt(new at(pt,ct));F.scale.set(1,.8,1),F.position.y=.07,U.add(F);for(let X=0;X<5;X++){const it=Zt(new at(fc(.028,.11,"spike"),ct)),rt=X/5*Math.PI*2;it.position.set(Math.cos(rt)*.09,.16+Math.sin(X*1.7)*.04,Math.sin(rt)*.09),it.rotation.z=Math.cos(rt)*.4,it.rotation.x=-Math.sin(rt)*.4,U.add(it)}}else if(o.hairStyle==="long"){const F=Zt(new at(pt,ct));F.scale.set(1.06,.78,1.06),F.position.y=.05,U.add(F);const X=Zt(new at(pn(.16,.2,.08,"longhair"),ct));X.position.set(0,-.1,-.1),U.add(X)}else if(o.hairStyle==="mohawk"){const F=Zt(new at(pt,ct));F.scale.set(.72,.5,1),F.position.y=.02,U.add(F);for(let X=-2;X<=2;X++){const it=Zt(new at(fc(.03,.13-Math.abs(X)*.02,"mohawkSpike"),ct));it.position.set(0,.14,X*.05),U.add(it)}}else if(o.hairStyle==="ponytail"){const F=Zt(new at(pt,ct));F.scale.set(1,.76,1),F.position.y=.04,U.add(F);const X=Zt(new at(uc(.035,.16,"ponytail"),ct));X.position.set(0,.02,-.15),X.rotation.x=.5,U.add(X)}else if(o.hairStyle==="curly"){const F=Zt(new at(pt,ct));F.scale.set(1.12,.9,1.12),F.position.y=.06,U.add(F);for(let X=0;X<6;X++){const it=Zt(new at(ei(.052,"curl"),ct)),rt=X/6*Math.PI*2;it.position.set(Math.cos(rt)*.085,.12+X%2*.04,Math.sin(rt)*.085),U.add(it)}}else if(o.hairStyle==="buzz"){const F=Oe(mc(s.hair,.7),.95),X=new at(pt,F);X.scale.set(.99,.62,.99),X.position.y=.03,U.add(X)}}const q=pt=>{const ct=new He;ct.position.set(pt*(c+.06),jt.torsoH-.05,0),_.add(ct);const F=Zt(new at(ni(u+.006,u*.82,jt.armUpper*.62,"sleeve"),x));F.position.y=-.3*.3,ct.add(F);const X=new at(new dn(u*.85,u*.85,.03,10),m);if(X.position.y=-.3*.62,ct.add(X),i===3&&pt===-1&&!n){const kt=new at(new dn(u*.92,u*.92,.055,10),Oe(16110397,.5,.08));kt.position.y=-.3*.42,ct.add(kt)}const it=Zt(new at(ni(u*.8,u*.62,jt.armUpper*.55,"armU"),g));it.position.y=-.3*.62,ct.add(it);const rt=n?x:g,Et=Zt(new at(ni(u*.6,u*.42,jt.armLower*.9,"armL"),rt));Et.position.y=-.3-jt.armLower/2+.02,ct.add(Et);const Pt=Zt(new at(ei(.05,"hand"),n?m:g));return Pt.scale.set(.72,.95,.5),Pt.position.set(0,-.3-jt.armLower+.01,.01),ct.add(Pt),ct},W=q(-1),Z=q(1),O=Zt(new at(pn(.36*l,.2,.24*l,"shorts"),m));O.position.y=us-.06,a.add(O);const st=pt=>{const ct=new He;ct.position.set(pt*.1,us-.1,0),a.add(ct);const F=Zt(new at(ni(h+.02,h*.72,jt.legUpper*.92,"thigh"),g));F.position.y=-.44/2,ct.add(F);const X=new He;X.position.y=-.44,ct.add(X);const it=Zt(new at(ni(.058,.036,jt.legLower*.82,"calf"),p));it.position.y=-.42/2,X.add(it);const rt=new at(new dn(.062,.062,.03,10),Oe(15921906,.85));rt.position.y=-.42*.24,X.add(rt);const Et=new at(pn(.1,.022,.24,"sole"),Oe(15527148,.5));Et.position.set(0,-.42-.052,.05),X.add(Et);const Pt=Zt(new at(pn(.09,.05,.09,"heel"),v));Pt.position.set(0,-.42-.018,-.04),X.add(Pt);const kt=Zt(new at(pn(.092,.036,.15,"forefoot"),v));kt.position.set(0,-.42-.03,.08),X.add(kt);const ie=new at(pn(.05,.016,.07,"lace"),m);return ie.position.set(0,-.42-.006,.06),X.add(ie),{hip:ct,knee:X}},ot=st(-1),ft=st(1);return{root:r,body:a,head:U,hipL:ot.hip,hipR:ft.hip,kneeL:ot.knee,kneeR:ft.knee,shoulderL:W,shoulderR:Z,torso:_,lastPose:[0,0,.02,.02,0,0]}}function ex(s,t,e,n,i,r,a=.5,o=0){const l=s.body;l.position.y=i,l.rotation.x=0,l.rotation.z=0,s.torso.rotation.x=0,s.hipL.rotation.z=0,s.hipR.rotation.z=0,s.shoulderL.rotation.z=0,s.shoulderR.rotation.z=0;const c=[0,0,.02,.02,0,0],h=(d,g,x,m,p,v)=>{c[0]=d,c[1]=g,c[2]=x,c[3]=m,c[4]=p,c[5]=v},u=8+Math.max(0,Math.min(1,a))*9;switch(t){case"run":{const d=Math.sin(e*u),g=.6+a*.3;h(d*g,-d*g,Math.max(0,-d)*(.9+a*.5),Math.max(0,d)*(.9+a*.5),-d*g*.9,d*g*.9),s.hipL.rotation.z=d*.07*a,s.hipR.rotation.z=-d*.07*a,s.shoulderL.rotation.z=-.1-a*.05,s.shoulderR.rotation.z=.1+a*.05,s.torso.rotation.x=.06+a*.18,l.position.y=i+Math.abs(Math.sin(e*u))*.04;break}case"dash":{const d=Math.sin(e*(u+2));h(d,-d,Math.max(0,-d)*1.4,Math.max(0,d)*1.4,-d-.4,d-.4),s.hipL.rotation.z=d*.09,s.hipR.rotation.z=-d*.09,s.shoulderL.rotation.z=-.14,s.shoulderR.rotation.z=.14,s.torso.rotation.x=.38;break}case"dribble":{if(r==="rainbow"){const g=Math.min(1,e%1*3);h(-1.5+g*.9,.35,.8,.3,-1.2,1.4),s.torso.rotation.x=-.18;break}if(r==="elastico"){const g=Math.sin(e*30)*.32;h(g*.7,-g*.7,.45,.45,-g,g),l.rotation.z=g,s.torso.rotation.x=.24;break}if(r==="croqueta"){const g=Math.sin(e*34);h(g*.55,-g*.55,.4,.4,-g*.6,g*.6),l.rotation.z=g*.12,s.torso.rotation.x=.16;break}const d=Math.sin(e*24);h(d*.45,-d*.45,.55,.25,-d*.7,d*.7),l.rotation.z=d*.16,s.torso.rotation.x=.22;break}case"jump":case"headbutt":h(-.5,.4,1,.5,-2.7,-2.7);break;case"slide":case"tackle":l.rotation.x=-1.15,l.position.y=i+.18,h(.25,-1,.1,.4,1.3,-1.5);break;case"dive":l.rotation.x=-1.2,l.position.y=i+.28,h(.3,-.4,.5,.7,-1.5,-1.5),s.torso.rotation.x=.12;break;case"fallen":l.rotation.x=-Math.PI/2,l.position.y=i+.22,h(.12,-.12,.15,.15,.5,-.5);break;case"kick":{if(o<.09){const d=o/.09;h(d*.55,-d*.7,d*.3,.5+d*.4,d*.5,-d*.5),s.torso.rotation.x=-.12*d}else if(o<.16){const d=(o-.09)/.07;h(.55-d*.25,-.7+d*-.9,.3,.9-d*.55,.5,-.5),s.torso.rotation.x=-.12+d*.34,l.position.y=i+d*.06}else{const d=Math.min(1,(o-.16)/.12);h(.3-d*.05,-1.6+d*1.3,.2,.35-d*.15,.9-d*.6,-.9+d*.6),s.torso.rotation.x=.22-d*.04}break}case"celebrate":h(-Math.abs(Math.sin(e*8))*.5,Math.abs(Math.sin(e*8+1))*.5,.4,.4,-2.9+Math.sin(e*8)*.4,-2.9-Math.sin(e*8)*.4),l.position.y=i+Math.abs(Math.sin(e*8))*.22,s.torso.rotation.x=-.12;break;case"celebrateSlide":{l.rotation.x=.85,l.position.y=i+.12;const d=Math.sin(e*6)*.25;h(-1.35,-1.35,.15,.15,-2.4+d,-2.4-d),s.torso.rotation.x=-.3;break}case"celebrateFly":{l.position.y=i+Math.abs(Math.sin(e*5))*.16,h(0,0,.15,.15,-1.55,-1.55),s.torso.rotation.x=.08;break}case"celebrateCradle":{const d=Math.sin(e*4)*.35;h(0,0,.1,.1,-1.9+d,-1.9-d),s.shoulderL.rotation.z=.9,s.shoulderR.rotation.z=-.9,s.torso.rotation.x=.14;break}default:{const d=Math.sin(e*2.4),g=d*.045;h(0,0,.02,.02,g,-g),s.shoulderL.rotation.z=-.06,s.shoulderR.rotation.z=.06,l.position.y=i+d*.014;break}}const f=s.lastPose;for(let d=0;d<6;d++)f[d]+=(c[d]-f[d])*.55;s.hipL.rotation.x=f[0],s.hipR.rotation.x=f[1],s.kneeL.rotation.x=f[2],s.kneeR.rotation.x=f[3],s.shoulderL.rotation.x=f[4],s.shoulderR.rotation.x=f[5]}const hs=900;class nx{constructor(t){this.parts=[],this.geo=new ze;for(let n=0;n<hs;n++)this.parts.push({active:!1,x:0,y:-100,z:0,vx:0,vy:0,vz:0,life:0,maxLife:1,size:1,color:new Bt,gravity:0});this.posAttr=new Ne(new Float32Array(hs*3),3),this.colAttr=new Ne(new Float32Array(hs*3),3),this.sizeAttr=new Ne(new Float32Array(hs),1),this.geo.setAttribute("position",this.posAttr),this.geo.setAttribute("color",this.colAttr),this.geo.setAttribute("psize",this.sizeAttr);const e=new Dn({transparent:!0,depthWrite:!1,blending:Ma,vertexShader:`
        attribute float psize;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = psize * (180.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,fragmentShader:`
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.1, d);
          gl_FragColor = vec4(vColor, a);
        }`,vertexColors:!0});this.points=new ch(this.geo,e),this.points.frustumCulled=!1,t.add(this.points)}spawn(t,e){let n=0;for(const i of this.parts){if(n>=t)break;i.active||(i.active=!0,e(i),n++)}}fireworks(t,e){const n=[16765501,16079421,4060554,4052469,12598773,16777215];for(let i=0;i<4;i++){const r=t+(Math.random()-.5)*16,a=e+(Math.random()-.5)*10,o=8+Math.random()*7,l=new Bt(n[Math.random()*n.length|0]);this.spawn(46,c=>{const h=Math.random()*Math.PI*2,u=Math.acos(Math.random()*2-1),f=6+Math.random()*9;c.x=r,c.y=o,c.z=a,c.vx=Math.sin(u)*Math.cos(h)*f,c.vy=Math.cos(u)*f,c.vz=Math.sin(u)*Math.sin(h)*f,c.life=c.maxLife=1.1+Math.random()*.7,c.size=1.4+Math.random(),c.color.copy(l).offsetHSL((Math.random()-.5)*.08,0,0),c.gravity=-9})}}dust(t,e,n=10,i=3.5,r=10127976){this.spawn(n,a=>{const o=Math.random()*Math.PI*2,l=1+Math.random()*i;a.x=t,a.y=.2+Math.random()*.4,a.z=e,a.vx=Math.cos(o)*l,a.vy=1.5+Math.random()*2,a.vz=Math.sin(o)*l,a.life=a.maxLife=.4+Math.random()*.4,a.size=1.2+Math.random()*1.4,a.color.setHex(r),a.gravity=-8})}burst(t,e,n,i){this.spawn(60,r=>{const a=Math.random()*Math.PI*2,o=5+Math.random()*10;r.x=t,r.y=e+.5,r.z=n,r.vx=Math.cos(a)*o,r.vy=Math.random()*4,r.vz=Math.sin(a)*o,r.life=r.maxLife=.5+Math.random()*.5,r.size=1.6+Math.random()*1.2,r.color.setHex(i),r.gravity=-2})}weatherTick(t,e,n,i){if(t==="clear")return;const r=t==="rain"?300:130,a=Math.floor(r*i+(Math.random()<r*i%1?1:0));this.spawn(a,o=>{o.x=e+(Math.random()-.5)*110,o.z=n+(Math.random()-.5)*90-20,o.y=26+Math.random()*8,t==="rain"?(o.vx=-3,o.vy=-42,o.vz=0,o.life=o.maxLife=.9,o.size=.9,o.color.setHex(8035039),o.gravity=0):(o.vx=(Math.random()-.5)*2.5,o.vy=-4.5-Math.random()*2,o.vz=(Math.random()-.5)*2.5,o.life=o.maxLife=6,o.size=1.1+Math.random()*.7,o.color.setHex(15660287),o.gravity=0)})}update(t){const e=this.posAttr.array,n=this.colAttr.array,i=this.sizeAttr.array;for(let r=0;r<hs;r++){const a=this.parts[r];if(!a.active){e[r*3+1]=-100,i[r]=0;continue}if(a.life-=t,a.life<=0||a.y<-1){a.active=!1,e[r*3+1]=-100,i[r]=0;continue}a.vy+=a.gravity*t,a.x+=a.vx*t,a.y+=a.vy*t,a.z+=a.vz*t,a.y<.05&&a.gravity===0&&(a.active=!1);const o=Math.min(1,a.life/(a.maxLife*.5));e[r*3]=a.x,e[r*3+1]=a.y,e[r*3+2]=a.z,n[r*3]=a.color.r*o,n[r*3+1]=a.color.g*o,n[r*3+2]=a.color.b*o,i[r]=a.size*(.6+.4*o)}this.posAttr.needsUpdate=!0,this.colAttr.needsUpdate=!0,this.sizeAttr.needsUpdate=!0}dispose(){this.geo.dispose(),this.points.material.dispose(),this.points.removeFromParent()}}class ph{constructor(t,e){this.match=e,this.scene=new Ql,this.quadScene=new Ql,this.quadCam=new wo(-1,1,1,-1,0,1),this.rigs=[],this.crowdHypeT=0,this.crowdBodies=[],this.crowdHeads=[],this.crowdBases=[],this.shake=0,this.fxGroup=new He,this.trail=[],this.trailIdx=0,this.nameTags=[],this.tagEls=[],this.camPos=new D(0,22,36),this.camLook=new D,this.camMode="follow",this.camT=0,this.specialFocus=new D,this.reducedMotion=!1,this.followHeight=22,this.followDistance=36,this.onResize=()=>this.resize(),this.disposed=!1,this.reducedMotion=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches,this.renderer=new Rg({canvas:t,antialias:!0}),this.renderer.setPixelRatio(1),this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=Lc,this.renderer.toneMapping=Dc,this.renderer.toneMappingExposure=1.1,this.rt=new qn(Rs,Si,{minFilter:tn,magFilter:ke,samples:this.reducedMotion||navigator.maxTouchPoints>0?1:4});const n=new at(new Be(2,2),new Ce({map:this.rt.texture}));this.quadScene.add(n),this.camera=new Qe(40,Rs/Si,1,600),this.buildSky(e.weather==="snow"),this.buildLights(),this.buildField(),this.buildStadium(),this.buildBall(),this.buildBallVisuals(),this.buildPlayers(),this.scene.add(this.fxGroup),this.buildTrailPool(),this.buildMarker(),this.buildBallArrow(t),this.particles=new nx(this.scene),this.resize(),window.addEventListener("resize",this.onResize)}resize(){const t=window.innerWidth,e=window.innerHeight;this.renderer.setSize(t,e,!1);const n=t/e,r=navigator.maxTouchPoints>0&&Math.min(t,e)<900?Math.min(t,e)<500?340:460:Si,a=Math.min(1,r/Si);let o,l;n>=Rs/Si?(l=Math.max(90,Math.round(Si*a)),o=Math.max(160,Math.round(l*n))):(o=Math.max(160,Math.round(Rs*a)),l=Math.max(90,Math.round(o/n))),(o!==this.rt.width||l!==this.rt.height)&&this.rt.setSize(o,l),this.camera.aspect=n,this.camera.fov=n<.85?48:n<1.2?44:40,this.followHeight=n<.85?25:n<1.2?23:22,this.followDistance=n<.85?43:n<1.2?39:36,this.camera.updateProjectionMatrix()}buildSky(t=!1){const e=document.createElement("canvas");e.width=1024,e.height=512;const n=e.getContext("2d"),i=n.createLinearGradient(0,0,0,512);t?(i.addColorStop(0,"#090b15"),i.addColorStop(.55,"#1d2432"),i.addColorStop(.82,"#49515b"),i.addColorStop(1,"#787b7a")):(i.addColorStop(0,"#04070b"),i.addColorStop(.52,"#101d24"),i.addColorStop(.8,"#273c40"),i.addColorStop(1,"#5c6a61")),n.fillStyle=i,n.fillRect(0,0,1024,512);const r=n.createRadialGradient(775,118,6,775,118,57);r.addColorStop(0,"rgba(255,244,188,.98)"),r.addColorStop(.62,"rgba(242,207,116,.82)"),r.addColorStop(1,"rgba(221,165,70,0)"),n.fillStyle=r,n.beginPath(),n.arc(775,118,64,0,Math.PI*2),n.fill(),n.fillStyle="rgba(255,241,202,.72)",n.beginPath(),n.arc(775,118,37,0,Math.PI*2),n.fill(),n.lineCap="round";for(let d=0;d<11;d++){const g=170+d*17+Math.sin(d*1.9)*9;n.strokeStyle=`rgba(210,219,205,${.035+d%3*.018})`,n.lineWidth=7+d%4*3,n.beginPath(),n.moveTo(d*139%940-80,g),n.bezierCurveTo(210+d*32,g-28,430+d*17,g+24,710+d*23,g-2),n.stroke()}const a=(d,g,x,m)=>{n.beginPath(),n.moveTo(0,512),n.lineTo(0,d);for(let p=0;p<=1024;p+=10){const v=d-Math.abs(Math.sin(p*.009+m))*g-Math.abs(Math.sin(p*.024+m*1.7))*g*.38;n.lineTo(p,v)}n.lineTo(1024,512),n.closePath(),n.fillStyle=x,n.fill()};a(405,90,t?"rgba(57,65,74,.46)":"rgba(18,38,35,.43)",.8),a(438,68,t?"rgba(41,47,54,.64)":"rgba(10,29,27,.62)",2.4),a(474,46,t?"rgba(25,29,34,.82)":"rgba(7,20,18,.83)",4.2);for(let d=0;d<7200;d++){const g=Math.random()*.025;n.fillStyle=Math.random()<.5?`rgba(255,244,220,${g})`:`rgba(0,0,0,${g})`,n.fillRect(Math.random()*1024,Math.random()*512,1.5,1.5)}const o=new ri(e);o.colorSpace=cn;const l=new mi(450,24,16),c=new Ce({map:o,side:Ue,depthWrite:!1});this.scene.add(new at(l,c));const h=new ze,u=210,f=new Float32Array(u*3);for(let d=0;d<u;d++){const g=Math.random()*Math.PI*2,x=Math.random()*Math.PI*.42,m=430;f[d*3]=m*Math.sin(x)*Math.cos(g),f[d*3+1]=m*Math.cos(x)+40,f[d*3+2]=m*Math.sin(x)*Math.sin(g)}h.setAttribute("position",new Ne(f,3)),this.scene.add(new ch(h,new lh({color:15259296,size:1.35,sizeAttenuation:!1}))),this.scene.fog=new Ao(t?1975856:596245,175,420)}buildLights(){this.scene.add(new Kg(4872842,.55)),this.scene.add(new qg(9347800,1714714,.5));const t=new dc(16774368,1.6);t.position.set(-45,85,55),t.castShadow=!0,t.shadow.mapSize.set(2048,2048);const e=80;t.shadow.camera.left=-e,t.shadow.camera.right=e,t.shadow.camera.top=e,t.shadow.camera.bottom=-e,t.shadow.camera.far=250,t.shadow.bias=-.0015,this.scene.add(t);const n=new dc(13490431,.45);n.position.set(50,60,-40),this.scene.add(n)}grassTexture(){const t=this.match.weather==="snow",e=document.createElement("canvas");e.width=1024,e.height=664;const n=e.getContext("2d"),i=14;for(let o=0;o<i;o++)t?n.fillStyle=o%2===0?"#c8d2e0":"#bcc8da":n.fillStyle=o%2===0?"#2c7a34":"#256b2d",n.fillRect(1024/i*o,0,1024/i+1,664);if(t){for(let l=0;l<5e3;l++)n.fillStyle=`rgba(255,255,255,${Math.random()*.25})`,n.fillRect(Math.random()*1024,Math.random()*664,2,2);const o=new ri(e);return o.anisotropy=4,o}for(let o=0;o<9e3;o++){const l=Math.random()*.06;n.fillStyle=Math.random()<.5?`rgba(255,255,220,${l})`:`rgba(0,40,0,${l+.02})`,n.fillRect(Math.random()*1024,Math.random()*664,2,2)}const r=n.createRadialGradient(512,332,30,512,332,330);r.addColorStop(0,"rgba(120,110,60,0.10)"),r.addColorStop(1,"rgba(0,0,0,0)"),n.fillStyle=r,n.fillRect(0,0,1024,664);const a=new ri(e);return a.anisotropy=4,a}buildField(){const t=Ht/2,e=ge/2,n=new at(new Be(Ht+8,ge+8),new ln({map:this.grassTexture(),roughness:.95}));n.rotation.x=-Math.PI/2,n.receiveShadow=!0,this.scene.add(n);const i=new at(new Be(Ht+46,ge+42),new ln({color:2770480,roughness:1}));i.rotation.x=-Math.PI/2,i.position.y=-.03,i.receiveShadow=!0,this.scene.add(i);const r=new Ce({color:15921906}),a=(h,u,f,d)=>{const g=new at(new Be(h,u),r);g.rotation.x=-Math.PI/2,g.position.set(f,.02,d),this.scene.add(g)},o=.28;a(Ht,o,0,-e),a(Ht,o,0,e),a(o,ge,-t,0),a(o,ge,t,0),a(o,ge,0,0);const l=new at(new Hi(9.15,9.15+o,48),r);l.rotation.x=-Math.PI/2,l.position.y=.02,this.scene.add(l);const c=new at(new gs(.25,12),r);c.rotation.x=-Math.PI/2,c.position.y=.02,this.scene.add(c);for(const h of[-1,1]){a(o,ur,h*(t-oi),0),a(oi,o,h*(t-oi/2),-40/2),a(oi,o,h*(t-oi/2),ur/2);const u=5.5,f=18.3;a(o,f,h*(t-u),0),a(u,o,h*(t-u/2),-f/2),a(u,o,h*(t-u/2),f/2);const d=new at(new gs(.22,10),r);d.rotation.x=-Math.PI/2,d.position.set(h*(t-11),.02,0),this.scene.add(d)}this.buildGoals(t),this.buildCornerFlags(t,e)}buildGoals(t){const e=new ln({color:16316664,roughness:.35,metalness:.3}),n=document.createElement("canvas");n.width=n.height=64;const i=n.getContext("2d");i.clearRect(0,0,64,64),i.strokeStyle="rgba(230,235,255,0.75)",i.lineWidth=1.5;for(let o=0;o<=64;o+=8)i.beginPath(),i.moveTo(o,0),i.lineTo(o,64),i.stroke(),i.beginPath(),i.moveTo(0,o),i.lineTo(64,o),i.stroke();const r=new ri(n);r.wrapS=r.wrapT=ui;const a=new Ce({map:r,transparent:!0,side:Ye,depthWrite:!1});for(const o of[-1,1]){const l=o*t,c=.09,h=new dn(c,c,Ie,10);for(const d of[-11/2,re/2]){const g=new at(h,e);g.position.set(l,Ie/2,d),g.castShadow=!0,this.scene.add(g)}const u=new at(new dn(c,c,re,10),e);u.rotation.x=Math.PI/2,u.position.set(l,Ie,0),u.castShadow=!0,this.scene.add(u);const f=(d,g,x,m,p,v,_,S,P)=>{const w=new at(new Be(d,g),a.clone());w.material.map=r.clone();const E=w.material.map;E.wrapS=E.wrapT=ui,E.repeat.set(S,P),w.position.set(x,m,p),w.rotation.x=v,w.rotation.y=_,this.scene.add(w)};f(re,Ie,l+o*ns,Ie/2,0,0,Math.PI/2,10,4),f(ns,re,l+o*ns/2,Ie-.02,0,-Math.PI/2,Math.PI/2,3,10);for(const d of[-11/2,re/2])f(ns,Ie,l+o*ns/2,Ie/2,d,0,0,3,4)}}buildCornerFlags(t,e){const n=new ln({color:15263976,roughness:.5}),i=new Ce({color:16106813,side:Ye});for(const r of[-1,1])for(const a of[-1,1]){const o=new at(new dn(.03,.03,1.6,6),n);o.position.set(r*t,.8,a*e),this.scene.add(o);const l=new at(new Be(.5,.35),i);l.position.set(r*t+.28,1.4,a*e),this.scene.add(l)}}buildStadium(){const t=Ht/2,e=ge/2,n=this.match.teams[0],i=this.match.teams[1],r=document.createElement("canvas");r.width=1024,r.height=64;const a=r.getContext("2d"),o=["NEKKETSU STORM","PIXEL SPORTS","THUNDER COLA","DRAGON GEAR","STAR FM 88.8"],l=["#d83a2a","#2a5ad8","#1a8a4a","#8a2ad8","#d8882a"];for(let d=0;d<8;d++)a.fillStyle=l[d%l.length],a.fillRect(d*128,0,128,64),a.fillStyle="#fff",a.font="bold 17px monospace",a.textAlign="center",a.fillText(o[d%o.length],d*128+64,38,120);const c=new ri(r);c.wrapS=ui;const h=(d,g,x,m,p)=>{const v=new ln({map:c.clone(),roughness:.6,emissive:2236962});v.map.wrapS=ui,v.map.repeat.set(p,1);const _=new at(new Be(d,1.1),v);_.position.set(g,.55,x),_.rotation.y=m,_.castShadow=!0,this.scene.add(_)};h(Ht+10,0,e+5,Math.PI,6),h(Ht+10,0,-e-5,0,6),h(ge+6,-t-6,0,Math.PI/2,4),h(ge+6,t+6,0,-Math.PI/2,4);const u=new ln({color:2568527,roughness:.9}),f=(d,g,x,m,p=3,v=!0)=>{const _=new He;for(let S=0;S<p;S++){const P=new at(new vn(d,2.6,5),u);P.position.set(0,1.3+S*2.4,8+S*4.4),P.castShadow=!0,_.add(P);const w=2,E=Math.floor(d/1.1),L=w*E,T=new ic(new Lr(.24,.34,3,6),new lc,L),y=new ic(new mi(.21,6,5),new lc,L),C=new xe,U=[15250570,13208927,9067064,1578e4],z=[n.color,n.color2,i.color,i.color2,14177866,4877016,15263976,3357269],G=[];let q=0;for(let W=0;W<w;W++)for(let Z=0;Z<E;Z++){const O=-d/2+Z*1.1+Math.random()*.5,st=2.75+S*2.4+W*.5+Math.random()*.2,ot=7+S*4.4+W*2+Math.random()*.6;C.position.set(O,st,ot),C.updateMatrix(),T.setMatrixAt(q,C.matrix),T.setColorAt(q,new Bt(z[Math.random()*z.length|0])),C.position.set(O,st+.52,ot),C.updateMatrix(),y.setMatrixAt(q,C.matrix),y.setColorAt(q,new Bt(U[Math.random()*U.length|0])),G.push({x:O,y:st,z:ot,phase:Math.random()*Math.PI*2}),q++}_.add(T),_.add(y),this.crowdBodies.push(T),this.crowdHeads.push(y),this.crowdBases.push(G)}if(v){const S=new at(new vn(d+4,.5,16),new ln({color:1712696,roughness:.7}));S.position.set(0,10.5,13),S.rotation.x=.12,_.add(S)}_.position.set(g,0,x),_.rotation.y=m,this.scene.add(_)};f(Ht+20,0,e+8,0,1,!1),f(Ht+20,0,-e-8,Math.PI),f(ge+14,t+9,0,Math.PI/2),f(ge+14,-t-9,0,-Math.PI/2);for(const d of[-1,1])for(const g of[-1,1]){const x=new He,m=new at(new dn(.45,.7,34,8),new ln({color:3752287,roughness:.6}));m.position.y=17,x.add(m);const p=new at(new vn(7,4.5,.8),new ln({color:2239039,emissive:16117968,emissiveIntensity:1.4}));p.position.y=35,p.lookAt(new D(0,2,0).sub(new D(d*(t+18),0,g*(e+18)))),x.add(p);const v=new at(new Be(13,9),new Ce({color:16775389,transparent:!0,opacity:.16,depthWrite:!1}));v.position.copy(p.position),v.quaternion.copy(p.quaternion),v.translateZ(.8),x.add(v),x.position.set(d*(t+18),0,g*(e+18)),this.scene.add(x)}}buildBall(){this.ballMesh=new He;const t=document.createElement("canvas");t.width=256,t.height=128;const e=t.getContext("2d");e.fillStyle="#f4f4f2",e.fillRect(0,0,256,128),e.strokeStyle="rgba(40,40,48,0.55)",e.lineWidth=1.5;const n=(l,c,h)=>{e.beginPath();for(let u=0;u<5;u++){const f=u/5*Math.PI*2-Math.PI/2,d=l+Math.cos(f)*h,g=c+Math.sin(f)*h;u===0?e.moveTo(d,g):e.lineTo(d,g)}e.closePath(),e.fillStyle="#191919",e.fill(),e.stroke()},i=5,r=2;for(let l=0;l<r;l++)for(let c=0;c<i;c++){const h=26+c*51+(l%2===0?0:25),u=26+l*76;n(h,u,15)}n(128,22,15),n(128,106,15);for(let l=0;l<260;l++)e.fillStyle=`rgba(70,110,60,${Math.random()*.16})`,e.fillRect(Math.random()*256,Math.random()*128,3,2);const a=new ri(t),o=new at(new mi(Pe,20,14),new ln({map:a,roughness:.42,metalness:.03}));o.castShadow=!0,this.ballMesh.add(o),this.scene.add(this.ballMesh)}buildPlayers(){for(let t=0;t<this.match.players.length;t++){const e=this.match.players[t],n=this.match.teams[e.team],i=tx(e.def,n.color,n.color2,e.isKeeper,e.index);this.rigs.push(i),this.scene.add(i.root)}}buildTrailPool(){const t=new mi(.42,8,6);for(let e=0;e<28;e++){const n=new at(t,new Ce({color:16777215,transparent:!0,opacity:0}));n.visible=!1,this.fxGroup.add(n),this.trail.push(n)}}buildMarker(){this.markerRing=new at(new Hi(.85,1.1,24),new Ce({color:16769597,transparent:!0,opacity:.9,depthWrite:!1,depthTest:!1})),this.markerRing.renderOrder=999,this.markerRing.rotation.x=-Math.PI/2,this.scene.add(this.markerRing),this.auraRing=new at(new Hi(1,1.55,28),new Ce({color:4060641,transparent:!0,opacity:.75,depthWrite:!1,side:Ye})),this.auraRing.rotation.x=-Math.PI/2,this.auraRing.visible=!1,this.scene.add(this.auraRing)}buildBallVisuals(){this.ballShadow=new at(new gs(.5,20),new Ce({color:0,transparent:!0,opacity:.35,depthWrite:!1})),this.ballShadow.rotation.x=-Math.PI/2,this.ballShadow.position.y=.03,this.scene.add(this.ballShadow),this.landingRing=new at(new Hi(.5,.72,20),new Ce({color:16769597,transparent:!0,opacity:.75,depthWrite:!1,side:Ye})),this.landingRing.rotation.x=-Math.PI/2,this.landingRing.visible=!1,this.scene.add(this.landingRing)}buildBallArrow(t){this.ballArrow=document.createElement("div"),this.ballArrow.dataset.testid="ball-arrow",this.ballArrow.style.cssText='position:absolute;display:none;font-size:14px;font-weight:bold;color:#ffe23d;text-shadow:0 2px 3px #000;pointer-events:none;z-index:5;white-space:nowrap;font-family:"Courier New",monospace;',(t.parentElement??document.body).appendChild(this.ballArrow)}updateNameTags(){const t=this.ballArrow.parentElement;if(t){for(;this.tagEls.length<this.nameTags.length;){const e=document.createElement("div");e.style.cssText='position:absolute;display:none;font-size:12px;font-weight:bold;padding:1px 8px;border-radius:2px;pointer-events:none;z-index:4;white-space:nowrap;font-family:"Courier New","SimHei",monospace;text-shadow:0 1px 0 #000;',e.dataset.testid="player-nametag",t.appendChild(e),this.tagEls.push(e)}for(let e=0;e<this.tagEls.length;e++){const n=this.tagEls[e],i=this.nameTags[e];if(!i){n.style.display="none";continue}const r=this.match.getControlled(i.team);if(!r){n.style.display="none";continue}const a=new D(r.x,r.y+2.6,r.z).project(this.camera);if(a.z>=1||Math.abs(a.x)>1||a.y>1||a.y<-1){n.style.display="none";continue}const o="#"+this.match.teams[i.team].color.toString(16).padStart(6,"0");n.textContent=i.nick,n.style.color=i.team===this.match.humanTeam?"#ffe23d":"#ffffff",n.style.background=o+"aa",n.style.border=`1px solid ${o}`,n.style.display="block",n.style.left=`${(a.x+1)/2*100}%`,n.style.top=`${(1-a.y)/2*100}%`,n.style.transform="translate(-50%,-100%)"}}}handleEvents(t){const e=this.match.ball;for(const n of t)switch(n.type){case"special":this.shake=this.reducedMotion?0:Math.max(this.shake,.7),this.crowdHypeT=Math.max(this.crowdHypeT,2),n.special&&(this.particles.burst(n.x??e.x,1,n.z??e.z,n.special.color),this.reducedMotion||(this.camMode="special",this.camT=.45));break;case"goal":{this.shake=this.reducedMotion?0:Math.max(this.shake,1),this.crowdHypeT=Math.max(this.crowdHypeT,3.5);const i=e.x>0?Ht/2:-105/2;this.particles.fireworks(i*.85,0),this.reducedMotion||(this.camMode="goal",this.camT=2.2,this.specialFocus.set(i*.9,1,0));break}case"knockdown":case"collide":this.shake=this.reducedMotion?0:Math.max(this.shake,.3),n.player&&this.particles.dust(n.player.x,n.player.z,12,4);break;case"tackle":n.player&&this.particles.dust(n.player.x,n.player.z,8,3);break;case"dribble":if(n.player){const i=n.trick==="rainbow"?16110397:n.trick==="elastico"?4052469:n.trick==="croqueta"?16777215:10127976;n.trick?this.particles.burst(n.player.x,1,n.player.z,i):this.particles.dust(n.player.x,n.player.z,10,2.5)}break;case"dribbleWin":n.player&&this.particles.burst(n.player.x,1,n.player.z,4060554),this.shake=this.reducedMotion?0:Math.max(this.shake,.2);break;case"dribbleFail":n.player&&this.particles.dust(n.player.x,n.player.z,14,3.5,16071997);break;case"fakeShot":n.player&&this.particles.dust(n.player.x,n.player.z,8,2,16110397);break;case"shoot":case"kick":n.player&&this.particles.dust(n.player.x,n.player.z,5,2);break;case"save":n.player&&this.particles.dust(n.player.x,n.player.z,10,3),this.crowdHypeT=Math.max(this.crowdHypeT,1.2);break}}updateBallArrow(){const t=this.match.ball,e=this.match.humanTeam>=0?this.match.getControlled(this.match.humanTeam):null;if(!e){this.ballArrow.style.display="none";return}const n=new D(t.x,t.y,t.z).project(this.camera),i=.1,r=.18;if(n.z<1&&Math.abs(n.x)<1-i&&n.y<1-r&&n.y>-1+.14){this.ballArrow.style.display="none";return}const o=n.x===0?1/0:(n.x>0?1-i:-.9)/n.x,l=n.y===0?1/0:(n.y>0?1-r:-.86)/n.y,c=Math.min(o,l),h=n.x*c,u=n.y*c,f=Math.round(Math.hypot(t.x-e.x,t.z-e.z));this.ballArrow.textContent=`▶ ${f}m`,this.ballArrow.style.display="block",this.ballArrow.style.left=`${(h+1)/2*100}%`,this.ballArrow.style.top=`${(1-u)/2*100}%`,this.ballArrow.style.transform=`translate(-50%,-50%) rotate(${Math.atan2(-n.y,n.x)}rad)`}dispose(){this.disposed=!0,window.removeEventListener("resize",this.onResize),this.ballArrow.remove();for(const e of this.tagEls)e.remove();this.tagEls.length=0,this.particles.dispose(),this.rt.dispose();const t=e=>{var r;const n=e,i=n.material?Array.isArray(n.material)?n.material:[n.material]:[];for(const a of i)a.map&&a.map.dispose(),a.dispose&&a.dispose();(r=n.geometry)!=null&&r.dispose&&n.geometry.dispose()};this.scene.traverse(t),this.quadScene.traverse(t),this.renderer.dispose()}update(t){const e=this.match,n=e.ball;this.ballMesh.position.set(n.x,n.y,n.z),this.ballMesh.rotation.x+=n.spin*t*.6,this.ballMesh.rotation.z+=n.spin*t*.35,this.ballShadow.position.set(n.x,.03,n.z);const i=Math.max(0,n.y);if(this.ballShadow.scale.setScalar(Math.max(.35,1-i/14)),this.ballShadow.material.opacity=Math.max(.12,.4-i*.02),!n.special&&!n.owner&&n.y>2&&n.vy<0){const p=Math.abs(xs),v=(n.vy+Math.sqrt(n.vy*n.vy+2*p*n.y))/p,_=co(n,Math.min(v,2));this.landingRing.visible=!0,this.landingRing.position.set(_.x,.05,_.z)}else this.landingRing.visible=!1;if(n.special){const p=n.special,v=this.trail[this.trailIdx++%this.trail.length],_=v.material;v.visible=!0;const S=1*p.trailScale;let P=0,w=0,E=0,L=p.color,T=.8,y=S;switch(p.fxStyle){case"serpent":{const C=-n.specialDirZ,U=n.specialDirX,z=Math.sin(n.specialT*24)*1.1;P=C*z,E=U*z,L=p.color,y=S*.9;break}case"meteor":L=Math.random()<.4?p.color2:p.color,y=S*(1.4+Math.random()*1.1);break;case"arc":L=Math.random()<.5?p.color2:p.color,y=S*.9;break;case"groundspark":w=-n.y+.1,L=Math.random()<.4?p.color2:p.color,y=S*(.7+Math.random()*.6);break;case"ice":L=Math.random()<.5?14676735:p.color,y=S*.85,T=.9;break;case"clone":v.position.set(n.prevX,n.prevY,n.prevZ),L=p.color,y=S*.9,T=.45;break;case"spiral":L=Math.random()<.5?p.color2:p.color,y=S*1.1;break;case"fist":L=Math.random()<.5?p.color2:p.color,y=S*(1.1+Math.abs(Math.sin(n.specialT*30))*.8);break;default:L=Math.random()<.35?p.color2:p.color,y=S*(1.2+Math.random()*.7);break}v.position.set(n.x+P,n.y+w,n.z+E),_.color.setHex(L),_.opacity=T,v.scale.setScalar(y)}for(const p of this.trail){if(!p.visible)continue;const v=p.material;v.opacity-=t*2.2,p.scale.multiplyScalar(1-t*1.5),v.opacity<=0&&(p.visible=!1)}for(let p=0;p<e.players.length;p++){const v=e.players[p],_=this.rigs[p];_.root.position.set(v.x,0,v.z),_.body.rotation.y=Math.atan2(v.faceX,v.faceZ),v.state==="celebrateFly"&&(_.body.rotation.y=Math.atan2(v.faceX,v.faceZ)+v.animT*6),v.state==="celebrateSlide"&&Math.hypot(v.vx,v.vz)>2&&(performance.now()|0)%3===0&&this.particles.dust(v.x,v.z,4,1.5,13616296);const S=Math.hypot(v.vx,v.vz)>1,P=Math.min(1,Math.hypot(v.vx,v.vz)/(Rn*v.def.speed));ex(_,v.stunned>0?"fallen":v.state,v.animT,S,v.y,v.state==="dribble"&&v.trickType!=="none"?v.trickType:void 0,P,v.stateT)}const r=e.humanTeam>=0?e.getControlled(e.humanTeam):null;if(r){this.markerRing.visible=!0,this.markerRing.position.set(r.x,.04,r.z);const v=r.passCallT>0?1+Math.sin(performance.now()/70)*.3:1+Math.sin(performance.now()/150)*.1;this.markerRing.scale.setScalar(v)}else this.markerRing.visible=!1;const a=n.owner;if(a&&e.energyFull(a.team)){this.auraRing.visible=!0,this.auraRing.position.set(a.x,.06,a.z);const p=performance.now()/90;this.auraRing.scale.setScalar(1+Math.sin(p)*.22),this.auraRing.material.color.setHSL(p*.02%1,.9,.6)}else this.auraRing.visible=!1;if(this.crowdHypeT>0&&(this.crowdHypeT=Math.max(0,this.crowdHypeT-t)),this.crowdBodies.length){const p=this.crowdHypeT>0,v=performance.now()/1e3,_=(p?.42:.09)*(this.reducedMotion?0:1),S=p?9:2.2,P=new xe;for(let w=0;w<this.crowdBodies.length;w++){const E=this.crowdBodies[w],L=this.crowdHeads[w],T=this.crowdBases[w];let y=!1;for(let C=0;C<T.length;C++){const U=T[C],z=Math.sin(v*S+U.phase),G=p&&Math.sin(v*S+U.phase*3)>.2?_*Math.abs(Math.sin(v*S*2+U.phase)):_*(z*.5+.5)*.5;Math.abs(G-(U.lastJump??-99))<.004||(U.lastJump=G,y=!0,P.position.set(U.x,U.y+G,U.z),P.updateMatrix(),E.setMatrixAt(C,P.matrix),P.position.set(U.x,U.y+.52+G,U.z),P.updateMatrix(),L.setMatrixAt(C,P.matrix))}y&&(E.instanceMatrix.needsUpdate=!0,L.instanceMatrix.needsUpdate=!0)}}this.particles.weatherTick(e.weather,this.camPos.x,0,t),this.particles.update(t),this.camT>0?this.camT-=t:this.camMode="follow";const o=this.camT>0&&!this.reducedMotion,l=this.shake;this.shake>0&&(this.shake=Math.max(0,this.shake-t*2.2));let c,h,u,f;if(o)if(this.camMode==="special"){const p=r;if(p){const v=Math.max(-10,Math.min(10,(n.x-p.x)*.22)),_=Math.max(-5,Math.min(5,(n.z-p.z)*.22));c=p.x+v,h=p.z+_}else c=n.x,h=n.z;u=this.followHeight,f=this.followDistance*.85}else c=this.specialFocus.x,h=this.specialFocus.z,u=11,f=24;else{const p=r??e.getControlled(e.humanTeam>=0?e.humanTeam:0),v=Math.max(-8,Math.min(8,(n.x-p.x)*.2)),_=Math.max(-4,Math.min(4,(n.z-p.z)*.2));c=p.x+p.vx*.35+v,h=p.z+p.vz*.35+_,u=this.followHeight,f=this.followDistance}c=Math.max(-105/2+6,Math.min(Ht/2-6,c)),h=Math.max(-68/2+8,Math.min(ge/2-8,h));const d=1-Math.exp(-5*t),g=1-Math.exp(-4*t);this.camLook.x+=(c-this.camLook.x)*d,this.camLook.z+=(h-this.camLook.z)*d,this.camPos.x+=(c-this.camPos.x)*g,this.camPos.y+=(u-this.camPos.y)*g,this.camPos.z+=(h+f-this.camPos.z)*g;let x=0,m=0;o&&l>0&&(x=(Math.random()-.5)*l*1.6,m=(Math.random()-.5)*l*1.6),this.camera.position.set(this.camPos.x+x,this.camPos.y+m,this.camPos.z),this.camera.lookAt(this.camLook.x,1.6,this.camLook.z),this.renderer.setRenderTarget(this.rt),this.renderer.render(this.scene,this.camera),this.renderer.setRenderTarget(null),this.renderer.render(this.quadScene,this.quadCam),this.updateBallArrow(),this.nameTags.length&&this.updateNameTags()}}class ix{constructor(){this.keys=new Set,this.prev={pass:!1,shoot:!1,dash:!1,jump:!1,skill:!1,tactic:!1},this.prevStart=!1,this.state={dirX:0,dirZ:0,pass:!1,shoot:!1,dash:!1,jump:!1,skill:!1,tactic:!1,passPressed:!1,shootPressed:!1,dashPressed:!1,jumpPressed:!1,skillPressed:!1,tacticPressed:!1},this.touchDir={x:0,z:0,active:!1},this.touchBtn={pass:!1,shoot:!1,dash:!1,jump:!1,skill:!1,tactic:!1},this.startPressed=!1,window.addEventListener("keydown",t=>{["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Tab"].includes(t.key)&&t.preventDefault(),this.keys.add(t.key.toLowerCase())}),window.addEventListener("keyup",t=>this.keys.delete(t.key.toLowerCase())),window.addEventListener("blur",()=>{this.keys.clear(),this.touchDir.active=!1,this.touchDir.x=0,this.touchDir.z=0,this.touchBtn.pass=this.touchBtn.shoot=this.touchBtn.dash=this.touchBtn.jump=this.touchBtn.skill=!1,this.touchBtn.tactic=!1})}key(...t){return t.some(e=>this.keys.has(e))}gpPad(){var e;const t=(e=navigator.getGamepads)==null?void 0:e.call(navigator);if(!t)return null;for(let n=0;n<t.length;n++){const i=t[n];if(i&&i.connected)return i}return null}update(){var x,m,p,v,_,S,P,w,E,L,T,y,C;const t=this.state,e=this.gpPad();let n=0,i=0;this.key("arrowleft","a")&&(n-=1),this.key("arrowright","d")&&(n+=1),this.key("arrowup","w")&&(i-=1),this.key("arrowdown","s")&&(i+=1);let r=0,a=0;if(e){const z=e.axes[0]??0,G=e.axes[1]??0;Math.abs(z)>.2&&(r=(z-Math.sign(z)*.2)/(1-.2)),Math.abs(G)>.2&&(a=(G-Math.sign(G)*.2)/(1-.2));const q=e.buttons;(x=q[12])!=null&&x.pressed&&(a=-1),(m=q[13])!=null&&m.pressed&&(a=1),(p=q[14])!=null&&p.pressed&&(r=-1),(v=q[15])!=null&&v.pressed&&(r=1)}this.touchDir.active&&(n=this.touchDir.x,i=this.touchDir.z),e&&(r!==0||a!==0)&&(n=r,i=a);const o=Math.hypot(n,i);o>1&&(n/=o,i/=o),t.dirX=n,t.dirZ=i;const l=this.key("j","z")||this.touchBtn.pass||!!((_=e==null?void 0:e.buttons[2])!=null&&_.pressed),c=this.key("k","x")||this.touchBtn.shoot||!!((S=e==null?void 0:e.buttons[1])!=null&&S.pressed),h=this.key("l","c","shift")||this.touchBtn.dash||!!((P=e==null?void 0:e.buttons[3])!=null&&P.pressed)||(((w=e==null?void 0:e.buttons[6])==null?void 0:w.value)??0)>.5,u=this.key("i"," ","v")||this.touchBtn.jump||!!((E=e==null?void 0:e.buttons[0])!=null&&E.pressed)||(((L=e==null?void 0:e.buttons[7])==null?void 0:L.value)??0)>.5,f=this.key("q","u")||this.touchBtn.skill||!!((T=e==null?void 0:e.buttons[5])!=null&&T.pressed),d=this.key("t")||this.touchBtn.tactic||!!((y=e==null?void 0:e.buttons[10])!=null&&y.pressed);t.passPressed=l&&!this.prev.pass,t.shootPressed=c&&!this.prev.shoot,t.dashPressed=h&&!this.prev.dash,t.jumpPressed=u&&!this.prev.jump,t.skillPressed=f&&!this.prev.skill,t.tacticPressed=d&&!this.prev.tactic,t.pass=l,t.shoot=c,t.dash=h,t.jump=u,t.skill=f,t.tactic=d,this.prev={pass:l,shoot:c,dash:h,jump:u,skill:f,tactic:d};const g=!!((C=e==null?void 0:e.buttons[9])!=null&&C.pressed);this.startPressed=g&&!this.prevStart,this.prevStart=g}}class mh{constructor(t,e){this.match=e,this.energyBars=[],this.comboEls=[],this.chargeLabelEl=null,this.lastInputDash=!1,this.bannerT=0,this.root=document.createElement("div"),this.root.dataset.testid="match-hud",this.root.style.cssText='position:absolute;inset:0;pointer-events:none;color:#f8f0dc;font-family:"STKaiti","KaiTi","Noto Serif SC",serif;';const n=document.createElement("style");n.textContent=`
      @keyframes hudSeal { 0% { transform:translate(-50%,-50%) scale(1.34);opacity:0;filter:blur(3px); } 18% { transform:translate(-50%,-50%) scale(.96);opacity:1;filter:blur(0); } 26% { transform:translate(-50%,-50%) scale(1); } }
      .hud-ink-panel { background:linear-gradient(135deg,rgba(18,15,13,.92),rgba(49,24,18,.83));border:1px solid #d4ad5b;box-shadow:0 5px 24px #0009,inset 0 0 0 1px #f4d88b22;backdrop-filter:blur(7px); }
      .hud-team { position:absolute;top:14px;width:clamp(130px,21vw,228px);padding:8px 11px 9px; }
      .hud-team::after { content:"";position:absolute;bottom:-5px;width:34px;height:9px;background:#a62e25;border:1px solid #d4ad5b;transform:skewX(-28deg); }
      .hud-team-left { left:14px;border-radius:2px 12px 2px 2px; }
      .hud-team-left::after { left:12px; }
      .hud-team-right { right:14px;border-radius:12px 2px 2px 2px;text-align:right; }
      .hud-team-right::after { right:12px; }
      .hud-center { position:absolute;top:8px;left:50%;transform:translateX(-50%);padding:5px 18px 7px;min-width:min(390px,45vw);text-align:center;clip-path:polygon(8% 0,92% 0,100% 22%,94% 100%,6% 100%,0 22%); }
      .hud-status { position:absolute;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);min-width:min(430px,64vw);padding:6px 14px 8px;text-align:center;font-size:12px;letter-spacing:1px; }
      .hud-banner { animation:hudSeal .28s cubic-bezier(.2,.9,.28,1.2); }
      @media (max-width: 700px) {
        .hud-center { top:max(5px,env(safe-area-inset-top));min-width:50vw;padding:4px 8px 5px; }
        .hud-team { top:max(58px,calc(env(safe-area-inset-top) + 54px));width:min(39vw,158px);padding:6px 8px; }
        .hud-team-left { left:max(7px,env(safe-area-inset-left)); }
        .hud-team-right { right:max(7px,env(safe-area-inset-right)); }
        .hud-wind { top:max(105px,calc(env(safe-area-inset-top) + 101px)) !important;max-width:78vw; }
        .hud-drill { top:max(127px,calc(env(safe-area-inset-top) + 123px)) !important; }
        .hud-status { min-width:min(54vw,310px);font-size:10px;bottom:max(5px,env(safe-area-inset-bottom));padding:4px 8px 6px; }
      }
      @media (max-height: 500px) and (orientation:landscape) {
        .hud-team { top:max(7px,env(safe-area-inset-top));width:min(18vw,150px); }
        .hud-team-left { left:max(58px,calc(env(safe-area-inset-left) + 54px)); }
        .hud-center { min-width:38vw; }
        .hud-wind { top:max(52px,calc(env(safe-area-inset-top) + 46px)) !important; }
        .hud-drill { top:max(70px,calc(env(safe-area-inset-top) + 64px)) !important; }
        .hud-status { bottom:max(4px,env(safe-area-inset-bottom)); }
      }
      @media (prefers-reduced-motion:reduce) { .hud-banner { animation:none; } }
    `,this.root.appendChild(n),t.appendChild(this.root);const i=document.createElement("div");i.className="hud-center hud-ink-panel",this.root.appendChild(i),this.scoreEl=document.createElement("div"),this.scoreEl.style.cssText="font-size:clamp(17px,3.2vw,28px);font-weight:800;color:#f4d88b;text-shadow:0 2px 0 #000;letter-spacing:2px;white-space:nowrap;",i.appendChild(this.scoreEl),this.timeEl=document.createElement("div"),this.timeEl.style.cssText="font-size:clamp(11px,1.8vw,14px);color:#e9dfc9;letter-spacing:2px;margin-top:1px;",i.appendChild(this.timeEl);for(let o=0;o<2;o++){const l=document.createElement("div");l.className=`hud-team hud-team-${o===0?"left":"right"} hud-ink-panel`;const c=document.createElement("div");c.innerHTML=`<b>${this.match.teams[o].name}</b> <span style="opacity:.55;font-size:10px;">气势</span>`,c.style.cssText="display:flex;justify-content:space-between;gap:8px;font-size:clamp(10px,1.7vw,14px);text-shadow:0 1px 2px #000;margin-bottom:5px;";const h=document.createElement("span");h.style.cssText="color:#f2c45f;font-size:10px;min-height:12px;",c.appendChild(h),this.comboEls.push(h),l.appendChild(c);const u=document.createElement("div");u.style.cssText="height:9px;padding:1px;background:#090807;border:1px solid #a98b52;overflow:hidden;";const f=document.createElement("div");f.style.cssText="height:100%;width:0;background:linear-gradient(90deg,#8f201c,#ef8d32,#f4d36c);transition:width .14s ease;",u.appendChild(f),l.appendChild(u),this.energyBars.push(f),this.root.appendChild(l)}this.windEl=document.createElement("div"),this.windEl.className="hud-wind",this.windEl.style.cssText="position:absolute;top:67px;left:50%;transform:translateX(-50%);font-size:clamp(10px,1.6vw,13px);text-shadow:0 2px 3px #000;color:#e7dcc6;white-space:nowrap;",this.root.appendChild(this.windEl),this.statusEl=document.createElement("div"),this.statusEl.className="hud-status hud-ink-panel";const r=document.createElement("div");r.style.cssText="height:4px;background:#0c0b09;margin-top:4px;border:1px solid #6f5a36;",this.staminaBar=document.createElement("div"),this.staminaBar.style.cssText="height:100%;width:100%;background:linear-gradient(90deg,#9e2f26,#d7b45c,#79c796);transition:width .16s;",r.appendChild(this.staminaBar),this.statusEl.appendChild(r),this.root.appendChild(this.statusEl),this.chargeEl=document.createElement("div"),this.chargeEl.style.cssText="position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 62px);transform:translateX(-50%);width:min(180px,34vw);height:7px;background:#17120e;border:1px solid #a98b52;display:none;",this.chargeBar=document.createElement("div"),this.chargeBar.style.cssText="height:100%;width:0;background:linear-gradient(90deg,#3df5e1,#f5d33d,#f53d3d);",this.chargeEl.appendChild(this.chargeBar);const a=document.createElement("div");a.style.cssText=`position:absolute;top:-2px;bottom:-2px;left:${Ec/pr*100}%;width:1px;background:rgba(255,255,255,.75);`,this.chargeEl.appendChild(a),this.root.appendChild(this.chargeEl),this.chargeLabelEl=document.createElement("div"),this.chargeLabelEl.style.cssText="position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 74px);transform:translateX(-50%);font-size:12px;color:#ffe23d;text-shadow:0 1px 2px #000;display:none;letter-spacing:2px;",this.root.appendChild(this.chargeLabelEl),this.bannerEl=document.createElement("div"),this.bannerEl.className="hud-banner",this.bannerEl.style.cssText="position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);padding:.12em .45em .22em;font-size:clamp(28px,7vw,66px);font-weight:900;text-shadow:0 4px 0 #160d08,0 0 18px #000;display:none;white-space:nowrap;letter-spacing:.16em;border-top:2px solid currentColor;border-bottom:2px solid currentColor;background:linear-gradient(90deg,transparent,#170c08bb 18%,#170c08bb 82%,transparent);",this.root.appendChild(this.bannerEl),this.drillEl=document.createElement("div"),this.drillEl.className="hud-drill",this.drillEl.style.cssText="position:absolute;top:88px;left:50%;transform:translateX(-50%);font-size:clamp(11px,1.8vw,14px);text-shadow:0 2px 2px #000;display:none;text-align:center;color:#f4d88b;",this.drillLabelEl=document.createElement("div"),this.drillEl.appendChild(this.drillLabelEl),this.drillBar=document.createElement("div"),this.drillBar.style.cssText="width:min(220px,60vw);height:5px;background:#17120e;border:1px solid #a98b52;margin:4px auto 0;display:none;",this.drillBarInner=document.createElement("div"),this.drillBarInner.style.cssText="height:100%;width:0;background:linear-gradient(90deg,#a62e25,#e4c46b);",this.drillBar.appendChild(this.drillBarInner),this.drillEl.appendChild(this.drillBar),this.root.appendChild(this.drillEl)}setDashHeld(t){this.lastInputDash=t}banner(t,e="#f4d88b",n=2){this.bannerEl.textContent=t,this.bannerEl.style.color=e,this.bannerEl.style.display="block",this.bannerEl.classList.remove("hud-banner"),this.bannerEl.offsetWidth,this.bannerEl.classList.add("hud-banner"),this.bannerT=n}update(t){var u;const e=this.match;this.scoreEl.textContent=`${e.teams[0].name}  ${e.score[0]} · ${e.score[1]}  ${e.teams[1].name}`;const n=Math.floor(e.time);if(e.phase==="shootout"&&e.shootout){const f=e.shootout,d=e.teams[f.shooterTeam].players[f.shooterIdx].name,g=f.shooterTeam===e.humanTeam?`${d} 主罚 · ↑↓瞄准 K射门`:"门将扑救 · ↑↓移动";this.timeEl.textContent=`点球 ${f.scores[0]} 比 ${f.scores[1]} · ${g}`}else{const f=e.training?"演武场":e.half===1?"上半场":e.half===2?"下半场":"金球加时",d=e.phase==="freekick"?" · 任意球":e.phase==="corner"?" · 角球":e.phase==="throwin"?" · 界外球":e.phase==="goalkick"?" · 球门球":"";this.timeEl.textContent=e.training?`${f} · R 重置`:`${f}${d}  ${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`}for(let f=0;f<2;f++){const d=e.energy[f];this.energyBars[f].style.width=`${d}%`,this.energyBars[f].style.background=d>=Gn-1?"linear-gradient(90deg,#f3c857,#fff0a1,#df3f2f)":"linear-gradient(90deg,#8f201c,#ef8d32,#f4d36c)",this.energyBars[f].style.boxShadow=d>=Gn-1?"0 0 10px #f4d36c":"none",this.comboEls[f].textContent=e.combo[f]>=2?`连携×${e.combo[f]}`:""}const i=e.humanTeam>=0&&e.energyFull(e.humanTeam);if(this.timeEl.style.color=i?"#ffe23d":"#e9dfc9",i){Math.sin(performance.now()/180)>0;const f=" ★必杀就绪 跳跃+射门★";(u=this.timeEl.textContent)!=null&&u.includes("必杀就绪")||(this.timeEl.textContent+=f)}const r=e.humanTeam>=0?e.getControlled(e.humanTeam):null;if(this.lastInputDash,r){const f=Math.round(r.stamina);let d=this.statusEl.querySelector('[data-role="status-text"]');d||(d=document.createElement("div"),d.dataset.role="status-text",this.statusEl.insertBefore(d,this.statusEl.firstChild)),d.textContent=r.isKeeper?`${r.def.name}　体力 ${f}${r.shieldActive?"　🛡护球中":""}　扑救: 按住跳跃蓄力+方向 · T 战术`:`${r.isKeeper?"门神":"执掌"} · ${r.def.name}　体力 ${f}${r.shieldActive?"　🛡护球中":""}　战术「${e.tacticLabel(e.humanTeam)}」　固定位置 · T 战术`,this.staminaBar.style.width=`${f}%`;const g=r.shootChargeT>=0&&e.ball.owner===r;if(this.chargeEl.style.display=g?"block":"none",g){const x=Math.min(1,r.shootChargeT/pr);this.chargeBar.style.width=`${x*100}%`,x>=.999?(this.chargeBar.style.background="#ffd23d",this.chargeEl.style.boxShadow="0 0 10px #ffd23d",this.chargeLabelEl.textContent=e.energyFull(e.humanTeam)?"松开=必杀!":"松开=重炮!",this.chargeLabelEl.style.display="block",this.chargeLabelEl.style.color="#ffd23d"):x>=Ac?(this.chargeBar.style.background="linear-gradient(90deg,#3df5e1,#f5d33d,#f53d3d)",this.chargeEl.style.boxShadow=`0 0 ${6+Math.sin(performance.now()/90)*4}px #ffffff88`,this.chargeLabelEl.style.display="none"):(this.chargeBar.style.background="linear-gradient(90deg,#3df5e1,#f5d33d,#f53d3d)",this.chargeEl.style.boxShadow="none",this.chargeLabelEl.style.display="none")}else this.chargeEl.style.boxShadow="none",this.chargeLabelEl.style.display="none"}e.training?(this.drillEl.style.display="block",this.drillBar.style.display=e.trainingDrill==="free"?"none":"block",this.drillLabelEl.textContent=e.drillLabel(),this.drillLabelEl.style.color=e.drillDone?"#7fe0a1":"#f4d88b",this.drillBarInner.style.width=`${e.drillFrac()*100}%`):(this.drillEl.style.display="none",this.drillBar.style.display="none");const a=e.wind,o=Math.hypot(a.x,a.z),l=Math.abs(a.x)>Math.abs(a.z)?a.x>0?"东 →":"← 西":a.z>0?"南 ↓":"↑ 北",c=e.weather==="rain"?"雨战":e.weather==="snow"?"雪战":"晴夜",h=e.ruleset==="classic"?"竞技":"热血";this.windEl.textContent=`${c} · ${h}规则 · ${o<1?"无风":`${l} ${o.toFixed(1)}`}`,this.bannerT>0&&(this.bannerT-=t,this.bannerT<=0&&(this.bannerEl.style.display="none"))}destroy(){this.root.remove()}}const sx="modulepreload",rx=function(s,t){return new URL(s,t).href},gc={},ax=function(t,e,n){let i=Promise.resolve();if(e&&e.length>0){const a=document.getElementsByTagName("link"),o=document.querySelector("meta[property=csp-nonce]"),l=(o==null?void 0:o.nonce)||(o==null?void 0:o.getAttribute("nonce"));i=Promise.allSettled(e.map(c=>{if(c=rx(c,n),c in gc)return;gc[c]=!0;const h=c.endsWith(".css"),u=h?'[rel="stylesheet"]':"";if(!!n)for(let g=a.length-1;g>=0;g--){const x=a[g];if(x.href===c&&(!h||x.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${u}`))return;const d=document.createElement("link");if(d.rel=h?"stylesheet":sx,h||(d.as="script"),d.crossOrigin="",d.href=c,l&&d.setAttribute("nonce",l),document.head.appendChild(d),h)return new Promise((g,x)=>{d.addEventListener("load",g),d.addEventListener("error",()=>x(new Error(`Unable to preload CSS for ${c}`)))})}))}function r(a){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=a,window.dispatchEvent(o),!o.defaultPrevented)throw a}return i.then(a=>{for(const o of a||[])o.status==="rejected"&&r(o.reason);return t().catch(r)})},Se=[{id:"cn",name:"中国龙焰",nameEn:"DRAGON CN",color:14170666,color2:16110397,players:[{name:"石墙",speed:.9,power:.9,toughness:1.2,special:"blast",skin:1578e4,hair:2105376},{name:"烈风",speed:1.15,power:1.1,toughness:1,special:"cyclone",skin:1578e4,hair:2105376},{name:"铁牛",speed:.9,power:1.2,toughness:1.25,special:"blast",skin:15251592,hair:3811866},{name:"小燕",speed:1.2,power:.9,toughness:.85,special:"serpent",skin:16308400,hair:4860432},{name:"雷鸣",speed:1,power:1.15,toughness:1.1,special:"meteor",skin:1578e4,hair:2105376},{name:"追云",speed:1.1,power:1,toughness:.95,special:"banana",skin:1578e4,hair:2105376}]},{id:"jp",name:"樱岛疾风",nameEn:"SAKURA JP",color:16777215,color2:14170666,players:[{name:"岩守",speed:.9,power:.9,toughness:1.15,special:"blast",skin:16109736,hair:1052688},{name:"隼人",speed:1.2,power:1.05,toughness:.95,special:"phantom",skin:16109736,hair:1052688},{name:"武藏",speed:.95,power:1.2,toughness:1.2,special:"blast",skin:15251592,hair:1052688},{name:"枫",speed:1.15,power:.95,toughness:.85,special:"banana",skin:16308400,hair:5913120},{name:"狮童",speed:1,power:1.1,toughness:1.1,special:"meteor",skin:1578e4,hair:1052688},{name:"疾风",speed:1.25,power:1,toughness:.9,special:"phantom",skin:16109736,hair:1052688}]},{id:"br",name:"桑巴烈日",nameEn:"SAMBA BR",color:15910205,color2:2783802,players:[{name:"巨岩",speed:.9,power:.95,toughness:1.2,special:"blast",skin:10512448,hair:2102544},{name:"燃舞",speed:1.25,power:1.05,toughness:.9,special:"serpent",skin:9065776,hair:2102544},{name:"狂欢",speed:1.15,power:1.1,toughness:.95,special:"banana",skin:10512448,hair:2102544},{name:"晨星",speed:1.1,power:1,toughness:.9,special:"cyclone",skin:12617816,hair:2759184},{name:"雨林",speed:1,power:1.15,toughness:1.05,special:"meteor",skin:9065776,hair:2102544},{name:"海浪",speed:1.1,power:1.05,toughness:.95,special:"serpent",skin:10512448,hair:2102544}]},{id:"de",name:"钢铁风暴",nameEn:"STAHL DE",color:2763306,color2:15921906,players:[{name:"堡垒",speed:.85,power:1,toughness:1.3,special:"blast",skin:16308408,hair:13150280},{name:"铁锤",speed:1,power:1.25,toughness:1.2,special:"blast",skin:16308408,hair:13150280},{name:"装甲",speed:.9,power:1.15,toughness:1.25,special:"meteor",skin:1578e4,hair:9067050},{name:"闪电",speed:1.15,power:1.05,toughness:1,special:"drill",skin:16308408,hair:15259784},{name:"寒霜",speed:1.05,power:1.1,toughness:1.1,special:"freeze",skin:16308408,hair:13150280},{name:"风车",speed:1.1,power:1.05,toughness:1.05,special:"cyclone",skin:1578e4,hair:9067050}]},{id:"gb",name:"雾都骑士",nameEn:"KNIGHT GB",color:2767498,color2:15921906,players:[{name:"城门",speed:.9,power:.9,toughness:1.2,special:"blast",skin:16308408,hair:6965802},{name:"长弓",speed:1.1,power:1.1,toughness:1,special:"banana",skin:16308408,hair:11040824},{name:"圆桌",speed:.95,power:1.1,toughness:1.15,special:"meteor",skin:1578e4,hair:3811866},{name:"迷雾",speed:1.15,power:.95,toughness:.9,special:"phantom",skin:16308408,hair:6965802},{name:"风笛",speed:1.05,power:1.05,toughness:1,special:"cyclone",skin:16308408,hair:13130282},{name:"王冠",speed:1.1,power:1.05,toughness:1,special:"drill",skin:16308408,hair:6965802}]},{id:"us",name:"自由猛鹰",nameEn:"EAGLE US",color:3824328,color2:14170666,players:[{name:"磐石",speed:.9,power:1,toughness:1.25,special:"blast",skin:9065776,hair:2102544},{name:"火箭",speed:1.2,power:1.1,toughness:1,special:"meteor",skin:16308408,hair:13150280},{name:"巨兽",speed:.9,power:1.25,toughness:1.3,special:"blast",skin:10512448,hair:2102544},{name:"星条",speed:1.15,power:1,toughness:.95,special:"drill",skin:16308408,hair:9067050},{name:"荒野",speed:1.05,power:1.1,toughness:1.1,special:"cyclone",skin:1578e4,hair:3811866},{name:"雄鹰",speed:1.1,power:1.05,toughness:1,special:"banana",skin:16308408,hair:13150280}]}];Se.push({id:"it",name:"亚平宁蓝狼",nameEn:"AZZURRI IT",color:1727176,color2:15921906,players:[{name:"铁闸",speed:.9,power:.9,toughness:1.3,special:"blast",skin:1578e4,hair:2759184},{name:"美声",speed:1.1,power:1.1,toughness:1,special:"banana",skin:1578e4,hair:1710618},{name:"石柱",speed:.9,power:1.15,toughness:1.25,special:"meteor",skin:15251592,hair:2759184},{name:"疾影",speed:1.2,power:.95,toughness:.9,special:"phantom",skin:1578e4,hair:1710618},{name:"琴弦",speed:1.05,power:1.05,toughness:1,special:"serpent",skin:16308400,hair:3811866},{name:"斜塔",speed:1,power:1.1,toughness:1.1,special:"drill",skin:1578e4,hair:2759184}]},{id:"es",name:"斗牛烈焰",nameEn:"TORO ES",color:14169386,color2:15910205,players:[{name:"斗篷",speed:.9,power:.95,toughness:1.2,special:"blast",skin:15251592,hair:1710618},{name:"弗拉门",speed:1.2,power:1,toughness:.9,special:"serpent",skin:15251592,hair:1710618},{name:"公牛",speed:.95,power:1.25,toughness:1.25,special:"blast",skin:14198904,hair:1710618},{name:"烈阳",speed:1.1,power:1.05,toughness:1,special:"cyclone",skin:15251592,hair:2759184},{name:"红缨",speed:1.15,power:1,toughness:.95,special:"banana",skin:1578e4,hair:3809296},{name:"海风",speed:1.05,power:1.1,toughness:1.05,special:"freeze",skin:15251592,hair:1710618}]},{id:"sl",name:"少林铁僧",nameEn:"SHAOLIN",color:16097312,color2:14169386,players:[{name:"铜人",speed:.88,power:.95,toughness:1.3,special:"blast",skin:15251592,hair:0,appearance:{build:"heavy",hairStyle:"bald",face:"normal"}},{name:"罗汉",speed:1,power:1.2,toughness:1.15,special:"luohan",skin:15251592,hair:0,appearance:{build:"medium",hairStyle:"bald",face:"frown"}},{name:"达摩",speed:.9,power:1.2,toughness:1.25,special:"sweep",skin:14198904,hair:0,appearance:{build:"heavy",hairStyle:"bald",face:"normal"}},{name:"慧空",speed:1.2,power:.95,toughness:.9,special:"serpent",skin:1578e4,hair:0,appearance:{build:"slim",hairStyle:"bald",face:"smile"}},{name:"玄铁",speed:1,power:1.15,toughness:1.1,special:"meteor",skin:15251592,hair:0,appearance:{build:"medium",hairStyle:"bald",face:"normal"}},{name:"疾影",speed:1.15,power:1,toughness:.95,special:"cyclone",skin:1578e4,hair:0,appearance:{build:"slim",hairStyle:"bald",face:"normal"}}]});Se.push({id:"ar",name:"沙漠猎鹰",nameEn:"FALCON AR",color:1739338,color2:15921906,players:[{name:"沙堡",speed:.92,power:.95,toughness:1.25,special:"blast",skin:12617816,hair:1052688,appearance:{build:"heavy",hairStyle:"short",face:"normal"}},{name:"猎鹰",speed:1.22,power:1.05,toughness:.95,special:"eagle",skin:12617816,hair:1052688,appearance:{build:"slim",hairStyle:"spiky",face:"normal"}},{name:"热风",speed:1.18,power:1,toughness:.95,special:"mirage",skin:12089928,hair:2102544,appearance:{build:"slim",hairStyle:"long",face:"smile"}},{name:"驼铃",speed:1.1,power:1.05,toughness:1,special:"banana",skin:12617816,hair:1052688,appearance:{build:"medium",hairStyle:"mohawk",face:"smile"}},{name:"星月",speed:1.05,power:1.15,toughness:1.1,special:"meteor",skin:13144670,hair:1052688,appearance:{build:"medium",hairStyle:"short",face:"normal"}},{name:"绿洲",speed:1.15,power:1,toughness:.98,special:"serpent",skin:12617816,hair:2759184,appearance:{build:"medium",hairStyle:"ponytail",face:"smile"}}]},{id:"fr",name:"高卢雄鸡",nameEn:"GALLIC FR",color:2771656,color2:14170666,players:[{name:"凯旋",speed:.9,power:1,toughness:1.28,special:"blast",skin:1578e4,hair:2760728,appearance:{build:"heavy",hairStyle:"short",face:"frown"}},{name:"雄鸡",speed:1.15,power:1.15,toughness:1.1,special:"eagle",skin:1578e4,hair:3811866,appearance:{build:"medium",hairStyle:"spiky",face:"normal"}},{name:"铁塔",speed:.92,power:1.25,toughness:1.22,special:"meteor",skin:15251592,hair:2759184,appearance:{build:"heavy",hairStyle:"short",face:"normal"}},{name:"鸢尾",speed:1.18,power:.98,toughness:.92,special:"phantom",skin:16308400,hair:1710618,appearance:{build:"slim",hairStyle:"ponytail",face:"smile"}},{name:"塞纳",speed:1.08,power:1.08,toughness:1.05,special:"cyclone",skin:1578e4,hair:2760728,appearance:{build:"medium",hairStyle:"long",face:"normal"}},{name:"马赛曲",speed:1.12,power:1.02,toughness:1,special:"mirage",skin:15251592,hair:3811866,appearance:{build:"medium",hairStyle:"mohawk",face:"smile"}}]});function Re(s){return Se.find(t=>t.id===s)??Se[0]}function xc(s){return s.players.reduce((t,e)=>t+e.speed+e.power+e.toughness,0)}class ox{constructor(){this.ctx=null,this.crowdNode=null,this.crowdGain=null,this.crowdExciteT=0,this.muted=!1}ensure(){if(this.ctx){this.ctx.state==="suspended"&&this.ctx.resume();return}this.ctx=new AudioContext,this.master=this.ctx.createGain(),this.master.gain.value=.5,this.master.connect(this.ctx.destination),this.startCrowd()}toggleMute(){return this.muted=!this.muted,this.master&&(this.master.gain.value=this.muted?0:.5),this.muted}tone(t,e,n,i=.3,r,a=0){if(!this.ctx)return;const o=this.ctx.currentTime+a,l=this.ctx.createOscillator(),c=this.ctx.createGain();l.type=t,l.frequency.setValueAtTime(e,o),r!==void 0&&l.frequency.exponentialRampToValueAtTime(Math.max(20,r),o+n),c.gain.setValueAtTime(i,o),c.gain.exponentialRampToValueAtTime(.001,o+n),l.connect(c).connect(this.master),l.start(o),l.stop(o+n+.02)}noise(t,e=.25,n=1200,i=0){if(!this.ctx)return;const r=this.ctx.currentTime+i,a=Math.floor(this.ctx.sampleRate*t),o=this.ctx.createBuffer(1,a,this.ctx.sampleRate),l=o.getChannelData(0);for(let f=0;f<a;f++)l[f]=Math.random()*2-1;const c=this.ctx.createBufferSource();c.buffer=o;const h=this.ctx.createBiquadFilter();h.type="lowpass",h.frequency.value=n;const u=this.ctx.createGain();u.gain.setValueAtTime(e,r),u.gain.exponentialRampToValueAtTime(.001,r+t),c.connect(h).connect(u).connect(this.master),c.start(r)}startCrowd(){if(!this.ctx)return;const t=this.ctx.sampleRate*2,e=this.ctx.createBuffer(1,t,this.ctx.sampleRate),n=e.getChannelData(0);let i=0;for(let o=0;o<t;o++)i=i*.97+(Math.random()*2-1)*.03,n[o]=i*6;const r=this.ctx.createBufferSource();r.buffer=e,r.loop=!0;const a=this.ctx.createGain();a.gain.value=.09,r.connect(a).connect(this.master),r.start(),this.crowdNode=r,this.crowdGain=a}crowdExcite(t=1){if(!this.ctx||!this.crowdGain)return;this.crowdExciteT=Math.max(this.crowdExciteT,t>=1?3.2:t>=.5?1.6:.8),this.noise(t>=1?1.6:.7,t>=1?.3:.16,t>=1?2600:2e3);const e=t>=1?5:3;for(let n=0;n<e;n++)this.tone("square",1500+Math.random()*900,.16+Math.random()*.2,t>=1?.06:.035,1800+Math.random()*600,Math.random()*(t>=1?1.1:.45))}updateCrowd(t){if(!this.ctx||!this.crowdGain)return;this.crowdExciteT>0&&(this.crowdExciteT-=t);const e=this.muted?0:this.crowdExciteT>0?.22:.09,n=this.crowdGain.gain.value,i=n+(e-n)*Math.min(1,t*3);Math.abs(i-n)>.001&&(this.crowdGain.gain.value=i)}kick(){this.noise(.08,.35,900),this.tone("square",180,.07,.15,90)}pass(){this.noise(.06,.25,1200),this.tone("square",260,.05,.12,160)}shoot(){this.noise(.1,.4,800),this.tone("square",140,.12,.22,60)}bounce(){this.tone("triangle",220,.08,.2,120)}jump(){this.tone("square",300,.12,.15,620)}dribble(){this.noise(.07,.18,1500),this.tone("triangle",360,.09,.12,520)}rainbow(){this.tone("sine",320,.22,.16,880),this.tone("square",1200,.1,.08,1600,.12)}elastico(){this.tone("triangle",520,.06,.14),this.tone("triangle",700,.07,.14,void 0,.08)}croqueta(){this.tone("square",440,.04,.11),this.tone("square",560,.045,.11,void 0,.05)}dribbleWin(){this.tone("square",520,.08,.16,720),this.tone("square",780,.12,.14,void 0,.06)}fakeShot(){this.noise(.08,.2,1800),this.tone("square",200,.07,.12,90)}tackle(){this.noise(.15,.3,500)}collide(){this.noise(.12,.4,600),this.tone("square",90,.15,.3,40)}post(){this.tone("square",520,.3,.3,500)}save(){this.noise(.1,.3,1e3),this.tone("square",200,.1,.2)}callForPass(){this.tone("triangle",880,.07,.1,1040)}tactic(){this.tone("sine",150,.34,.18,92),this.tone("triangle",310,.22,.1,180),this.noise(.18,.09,1800)}whistle(){if(this.ctx)for(let t=0;t<2;t++)this.tone("square",2350,.16,.12,2300,t*.2),this.tone("square",2410,.16,.08,2350,t*.2)}special(){[330,440,554,660,880].forEach((e,n)=>this.tone("square",e,.09,.2,void 0,n*.05)),this.noise(.35,.35,700,.25),this.tone("sawtooth",110,.4,.25,45,.25)}knockdown(){this.tone("square",400,.25,.25,60),this.noise(.2,.3,400,.05)}goal(){const t=[[523,.12],[659,.12],[784,.12],[1047,.3],[784,.12],[1047,.45]];let e=0;for(const[n,i]of t)this.tone("square",n,i,.22,void 0,e),this.tone("triangle",n/2,i,.18,void 0,e),e+=i+.02;this.noise(1.4,.28,2400,.1)}menuMove(){this.tone("square",660,.05,.12)}menuOk(){this.tone("square",523,.07,.15),this.tone("square",784,.12,.15,void 0,.07)}}const Mt=new ox,Io="nekketsu_campaign_v1";function vc(){try{const s=localStorage.getItem(Io);if(!s)return null;const t=JSON.parse(s);return!Se.some(e=>e.id===t.teamId)||![t.stage,t.wins,t.losses].every(Number.isInteger)||t.stage<0||t.stage>Se.length-1||t.wins<0||t.losses<0?null:t}catch{return null}}function gh(s){try{localStorage.setItem(Io,JSON.stringify(s))}catch{}}function _c(){try{localStorage.removeItem(Io)}catch{}}function lx(s){const t={teamId:s,stage:0,wins:0,losses:0};return gh(t),t}function xh(s){return Se.filter(t=>t.id!==s.teamId)}function cx(s){const t=xh(s);return s.stage<t.length?t[s.stage]:null}function vh(s){return xh(s).length}function hx(s){const t=vh(s);return s.stage<2?0:s.stage>=t-2?2:1}const ko="nekketsu_tournament_v1",nr=s=>typeof s=="string"&&Se.some(t=>t.id===s),hr=["四分之一决赛","半决赛","决赛"];function no(){try{const s=localStorage.getItem(ko);if(!s)return null;const t=JSON.parse(s);if(!nr(t.playerTeam)||!Number.isInteger(t.round)||t.round<0||t.round>3||typeof t.eliminated!="boolean"||!Array.isArray(t.bracket)||t.bracket.length<1||t.bracket.length>3||t.round<3&&!Array.isArray(t.bracket[t.round]))return null;for(let e=0;e<t.bracket.length;e++){const n=t.bracket[e];if(!Array.isArray(n)||n.length!==4>>e)return null;for(const i of n)if(!i||!nr(i.a)||!nr(i.b)||i.a===i.b||(i.scoreA!==void 0||i.scoreB!==void 0)&&(!Number.isInteger(i.scoreA)||!Number.isInteger(i.scoreB))||i.winner!==void 0&&i.winner!==i.a&&i.winner!==i.b||(i.shootoutA!==void 0||i.shootoutB!==void 0)&&(!Number.isInteger(i.shootoutA)||!Number.isInteger(i.shootoutB)))return null}return t.champion!==void 0&&!nr(t.champion)?null:t}catch{return null}}function Uo(s){try{localStorage.setItem(ko,JSON.stringify(s))}catch{}}function io(){try{localStorage.removeItem(ko)}catch{}}function _h(s){const t=Se.map(r=>r.id).filter(r=>r!==s);for(let r=t.length-1;r>0;r--){const a=Math.random()*(r+1)|0;[t[r],t[a]]=[t[a],t[r]]}const e=[s,...t.slice(0,7)];for(let r=e.length-1;r>0;r--){const a=Math.random()*(r+1)|0;[e[r],e[a]]=[e[a],e[r]]}const n=[];for(let r=0;r<8;r+=2)n.push({a:e[r],b:e[r+1]});const i={playerTeam:s,round:0,bracket:[n],eliminated:!1};return Uo(i),i}function yh(s,t){const e=xc(Re(s)),n=xc(Re(t)),i=(e-n)*.35,r=Math.random()*2;let a=Math.max(0,Math.round(r+i+(Math.random()-.4)*2)),o=Math.max(0,Math.round(r-i+(Math.random()-.4)*2));return a===o&&(Math.random()<.5+(e-n)*.05?a++:o++),[Math.min(a,9),Math.min(o,9)]}function Mh(s){return s.round>=3||s.eliminated?null:s.bracket[s.round].find(e=>(e.a===s.playerTeam||e.b===s.playerTeam)&&e.scoreA===void 0)??null}function Sh(s,t){const e=s.bracket[s.round];for(const i of e){if(i.scoreA!==void 0)continue;if((i.a===s.playerTeam||i.b===s.playerTeam)&&t&&!s.eliminated){const a=i.a===s.playerTeam;i.scoreA=a?t.score[0]:t.score[1],i.scoreB=a?t.score[1]:t.score[0],i.winner=t.winner===0?s.playerTeam:a?i.b:i.a,t.shootout&&(i.shootoutA=a?t.shootout[0]:t.shootout[1],i.shootoutB=a?t.shootout[1]:t.shootout[0]),i.winner!==s.playerTeam&&(s.eliminated=!0)}else[i.scoreA,i.scoreB]=yh(i.a,i.b),i.winner=i.scoreA>i.scoreB?i.a:i.b}const n=e.map(i=>i.winner??(i.scoreA>i.scoreB?i.a:i.b));if(s.round===2)s.champion=n[0],s.round=3;else{const i=[];for(let r=0;r<n.length;r+=2)i.push({a:n[r],b:n[r+1]});s.bracket.push(i),s.round++}Uo(s)}const dx=Object.freeze(Object.defineProperty({__proto__:null,ROUND_NAMES:hr,advance:Sh,clearTournament:io,loadTournament:no,newTournament:_h,playerMatch:Mh,saveTournament:Uo,simulateScore:yh},Symbol.toStringTag,{value:"Module"})),bh="nekketsu_progress_v1",br=10;function Dr(){try{const s=localStorage.getItem(bh);if(!s)return{players:{},recruits:{}};const t=JSON.parse(s),e=t.players&&typeof t.players=="object"&&!Array.isArray(t.players)?t.players:{},n=t.recruits&&typeof t.recruits=="object"&&!Array.isArray(t.recruits)?t.recruits:{},i={},r=new Set(Se.flatMap(o=>o.players.map((l,c)=>No(o.id,c))));for(const[o,l]of Object.entries(e))!r.has(o)||!l||!Number.isFinite(l.xp)||!Number.isInteger(l.level)||(i[o]={xp:Math.max(0,l.xp),level:Math.max(1,Math.min(br,l.level))});const a={};for(const[o,l]of Object.entries(n)){if(!Se.some(h=>h.id===o)||!Array.isArray(l))continue;const c=new Map;for(const h of l)!h||!Se.some(u=>u.id===h.fromTeam)||!Number.isInteger(h.playerIdx)||h.playerIdx<1||h.playerIdx>5||!Number.isInteger(h.replaceIdx)||h.replaceIdx<1||h.replaceIdx>5||c.set(h.replaceIdx,h);a[o]=[...c.values()]}return{players:i,recruits:a}}catch{}return{players:{},recruits:{}}}function Th(s){try{localStorage.setItem(bh,JSON.stringify(s))}catch{}}function so(s){return s*100}function No(s,t){return`${s}:${t}`}function wh(s,t,e){return s.players[No(t,e)]??{xp:0,level:1}}function ux(s,t){const e=Dr(),n=40+(t.win?40:10)+t.goals*15+t.specials*10,i=[];for(let r=0;r<6;r++){const a=No(s,r),o=e.players[a]??{xp:0,level:1};for(o.xp+=n;o.level<br&&o.xp>=so(o.level);)o.xp-=so(o.level),o.level++,i.push(r);e.players[a]=o}return Th(e),i}function fx(s){return 1+(s-1)*.022}function px(s,t,e,n){const i=Dr(),a=(i.recruits[s]??[]).filter(o=>o.replaceIdx!==n);a.push({fromTeam:t,playerIdx:e,replaceIdx:n}),i.recruits[s]=a,Th(i)}function ro(s){const t=Dr(),e=Re(s),n=e.players.map(i=>({...i}));for(const i of t.recruits[s]??[]){const r=Re(i.fromTeam).players[i.playerIdx];r&&(n[i.replaceIdx]={...r})}return n.forEach((i,r)=>{const a=wh(t,s,r).level,o=fx(a);i.speed*=o,i.power*=o,i.toughness*=o}),{...e,players:n}}class mx{constructor(t){this.onStart=()=>{},this.onOnline=()=>{},this.onOnlineCancel=()=>{},this.root=document.createElement("div"),this.root.style.cssText=`position:absolute;inset:0;background:
      radial-gradient(ellipse at 50% 30%, #1a2a4a 0%, #0a0f1e 70%);
      color:#fff;font-family:"Courier New","SimHei",monospace;display:flex;flex-direction:column;
      align-items:center;justify-content:flex-start;gap:2vh;overflow-y:auto;overflow-x:hidden;`;const e=document.createElement("style");e.textContent=`
      @keyframes menuFloat { 0% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(18px,-26px) rotate(180deg); } 100% { transform: translate(0,0) rotate(360deg); } }
      @keyframes menuStreak { 0% { transform: translateX(-30vw); opacity: 0; } 15% { opacity: .5; } 100% { transform: translateX(130vw); opacity: 0; } }
    `,document.head.appendChild(e);const n=document.createElement("div");n.style.cssText="position:absolute;inset:0;overflow:hidden;pointer-events:none;";for(let i=0;i<8;i++){const r=document.createElement("div"),a=14+Math.random()*26;r.textContent="⚽",r.style.cssText=`position:absolute;left:${Math.random()*92}%;top:${Math.random()*88}%;
        font-size:${a}px;opacity:${.05+Math.random()*.12};
        animation:menuFloat ${9+Math.random()*14}s ease-in-out infinite;
        animation-delay:-${Math.random()*10}s;`,n.appendChild(r)}for(let i=0;i<4;i++){const r=document.createElement("div");r.style.cssText=`position:absolute;top:${8+Math.random()*80}%;left:0;width:180px;height:2px;
        background:linear-gradient(90deg,transparent,#3dd5f5aa,transparent);
        animation:menuStreak ${5+Math.random()*6}s linear infinite;
        animation-delay:-${Math.random()*8}s;`,n.appendChild(r)}this.root.appendChild(n),this.content=document.createElement("div"),this.content.style.cssText="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:2vh;width:100%;min-height:100%;padding:4vh 12px;box-sizing:border-box;",this.root.appendChild(this.content),t.appendChild(this.root),this.showTitle()}clear(){this.content.innerHTML=""}mkBtn(t,e,n,i="#f5d33d"){const r=document.createElement("div");return r.textContent=t,r.style.cssText=`font-size:clamp(15px,3vw,24px);padding:10px 40px;letter-spacing:4px;cursor:${e?"pointer":"default"};
      color:${e?"#fff":"#555"};text-shadow:2px 2px 0 #000;border:3px solid ${e?i:"#333"};
      background:${e?"#d83a2a33":"transparent"};min-width:min(320px,64vw);text-align:center;`,e&&n&&(r.onmouseenter=()=>{r.style.background="#d83a2a88",Mt.ensure(),Mt.menuMove()},r.onmouseleave=()=>r.style.background="#d83a2a33",r.onclick=()=>{Mt.ensure(),Mt.menuOk(),n()}),this.content.appendChild(r),r}mkBack(t){const e=document.createElement("div");e.textContent="← 返回",e.style.cssText="font-size:16px;padding:8px 24px;cursor:pointer;border:2px solid #888;margin-top:8px;",e.onclick=()=>{Mt.menuOk(),t()},this.content.appendChild(e)}showTitle(){this.clear();const t=document.createElement("div");t.innerHTML=`
      <div style="font-size:clamp(30px,8vw,72px);font-weight:bold;letter-spacing:6px;
        color:#f5d33d;text-shadow:4px 4px 0 #d83a2a, 8px 8px 0 #000;">热血风暴</div>
      <div style="font-size:clamp(14px,3vw,24px);letter-spacing:8px;text-align:center;margin-top:8px;
        color:#3dd5f5;text-shadow:2px 2px 0 #000;">NEKKETSU STORM SOCCER</div>`,this.content.appendChild(t);const e=document.createElement("div");e.textContent="— 致敬街机热血足球的原创作品 —",e.style.cssText="font-size:clamp(11px,2vw,15px);opacity:.6;margin-bottom:2vh;",this.content.appendChild(e);const n=vc(),i=no();this.mkBtn("友谊赛  EXHIBITION",!0,()=>this.showTeamSelect()),this.mkBtn(n?`征战之路  第 ${n.stage+1} 关 (继续)`:"征战之路  CAMPAIGN",!0,()=>this.showCampaign(),"#3df58a"),this.mkBtn(i&&i.round<3?`锦标赛  ${hr[i.round]} (继续)`:"锦标赛  TOURNAMENT",!0,()=>this.showTournament(),"#f5a63d"),this.mkBtn("训练场  TRAINING",!0,()=>this.showTrainingSelect(),"#3dd5f5"),this.mkBtn("联机对战  ONLINE (Beta)",!0,()=>this.showOnline(),"#c03df5");const r=document.createElement("div");r.innerHTML=`键盘: 方向键/WASD 移动 · J/Z 传球/要球/铲球 · K/X 射门(按住蓄力,蓄力中可慢移瞄准) · L/C/Shift 冲刺 · I/空格 跳跃 · Q/U 过人<br>
      手柄: 左摇杆移动 · X 传球/要球/铲球 · B 射门 · Y 冲刺 · A 跳跃 · RB 过人 · Start 暂停<br>
      连招: 冲刺+传球=低平快传 · 冲刺+射门=强力抽射 · 冲刺+跳=鱼跃冲顶 · 假射后立刻过人=假射真扣<br>
      花式过人: 双击过人键=彩虹过人 · 过人键+跳=牛尾巴 · 静止按过人键=油炸丸子<br>
      　　　　 拉后方向+过人键=马赛回旋 · 过人键+冲刺=踩单车 · 移动中过人键=基础变向<br>
      射门变体: 蓄力中推方向=朝该方向踢 · 过人键+射门=吊射 · 蓄力+冲刺=贴地斩<br>
      触屏: 虚拟摇杆 + 右侧传射/冲跳/过人按键<br>
      金圈标记整场固定操控的中场核心(门将模式则固定门将),传球与定位球均不切换操控<br>
      队友持球时按传球键 = 要球,配合方向键可要前方空间球<br>
      能量槽积满后 跳跃+射门 = 必杀射门!传球与铲球可积攒能量`,r.style.cssText="font-size:clamp(10px,1.8vw,14px);opacity:.7;text-align:center;line-height:1.8;margin-top:3vh;",this.content.appendChild(r)}teamGrid(t,e){const n=document.createElement("div");n.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,240px));gap:14px;justify-content:center;padding:10px;max-width:900px;";for(const i of Se){if(i.id===e)continue;const r=document.createElement("div"),a="#"+i.color.toString(16).padStart(6,"0"),o="#"+i.color2.toString(16).padStart(6,"0"),l=i.players.slice(1).map(c=>`<div style="display:flex;justify-content:space-between;font-size:11px;opacity:.85;">
          <span>${c.name}</span><span style="color:${o}">${Wi[c.special].name}</span></div>`).join("");r.innerHTML=`
        <div style="font-size:18px;font-weight:bold;color:${a};text-shadow:1px 1px 0 #000;-webkit-text-stroke:.5px #fff3;">${i.name}</div>
        <div style="font-size:11px;letter-spacing:2px;opacity:.6;margin-bottom:6px;">${i.nameEn}</div>
        ${l}`,r.style.cssText=`border:3px solid ${a};padding:10px 14px;cursor:pointer;background:#00000055;transition:transform .1s;`,r.onmouseenter=()=>{r.style.transform="scale(1.04)",Mt.ensure(),Mt.menuMove()},r.onmouseleave=()=>r.style.transform="scale(1)",r.onclick=()=>{Mt.ensure(),Mt.menuOk(),t(i.id)},n.appendChild(r)}return this.content.appendChild(n),n}heading(t,e=""){const n=document.createElement("div");if(n.textContent=t,n.style.cssText="font-size:clamp(20px,5vw,36px);color:#f5d33d;text-shadow:3px 3px 0 #000;letter-spacing:4px;",this.content.appendChild(n),e){const i=document.createElement("div");i.textContent=e,i.style.cssText="font-size:clamp(11px,2vw,15px);opacity:.7;",this.content.appendChild(i)}return n}showTeamSelect(){this.clear();let t=null,e=1,n="classic",i="random",r=90,a=1;const o=this.heading("选择你的队伍","(先选我方,再选对手)");let l=!1;const c=document.createElement("div");c.style.cssText="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;";const h=["容易","普通","困难"],u=[];h.forEach((x,m)=>{const p=document.createElement("div");p.textContent=x,p.style.cssText=`padding:6px 20px;border:2px solid ${m===1?"#f5d33d":"#666"};cursor:pointer;font-size:15px;`,p.onclick=()=>{e=m,u.forEach((v,_)=>v.style.borderColor=_===m?"#f5d33d":"#666"),Mt.menuMove()},u.push(p),c.appendChild(p)});const f=document.createElement("div");f.textContent="🧤 当门将",f.style.cssText="padding:6px 20px;border:2px solid #666;cursor:pointer;font-size:15px;margin-left:16px;",f.onclick=()=>{l=!l,f.style.borderColor=l?"#3dd5f5":"#666",f.style.color=l?"#3dd5f5":"#fff",Mt.menuMove()},c.appendChild(f),this.content.appendChild(c);const d=document.createElement("div");d.style.cssText="display:grid;grid-template-columns:repeat(2,minmax(240px,1fr));gap:8px 18px;max-width:min(760px,92vw);font-size:12px;";const g=(x,m,p,v)=>{const _=document.createElement("div");_.style.cssText="display:flex;align-items:center;gap:6px;flex-wrap:wrap;";const S=document.createElement("span");S.textContent=x,S.style.cssText="color:#d9c28d;min-width:52px;",_.appendChild(S);const P=[];m.forEach(w=>{const E=document.createElement("div");E.textContent=w.text,E.style.cssText=`padding:4px 9px;border:1px solid ${w.value===p()?"#f5d33d":"#59616d"};cursor:pointer;background:#080d16aa;`,E.onclick=()=>{v(w.value),P.forEach((L,T)=>L.style.borderColor=m[T].value===p()?"#f5d33d":"#59616d"),Mt.menuMove()},P.push(E),_.appendChild(E)}),d.appendChild(_)};g("规则",[{value:"classic",text:"竞技"},{value:"arcade",text:"热血"}],()=>n,x=>{n=x}),g("时长",[{value:60,text:"闪电"},{value:90,text:"标准"},{value:120,text:"鏖战"}],()=>r,x=>{r=x}),g("天气",[{value:"random",text:"随机"},{value:"clear",text:"晴"},{value:"rain",text:"雨"},{value:"snow",text:"雪"}],()=>i,x=>{i=x}),g("必杀",[{value:"normal",text:"标准"},{value:"frenzy",text:"狂热"}],()=>a>1?"frenzy":"normal",x=>{a=x==="frenzy"?1.6:1}),this.content.appendChild(d),this.teamGrid(x=>{t?x!==t&&this.onStart({teamA:t,teamB:x,aiLevel:e,goldenGoal:!1,training:!1,playAsKeeper:l,ruleset:n,weather:i,halfDuration:r,energyGainScale:a}):(t=x,o.textContent=`我方: ${Re(x).name} · 选择对手`)}),this.mkBack(()=>this.showTitle())}showCampaign(){this.clear();const t=vc();if(!t){this.heading("征战之路","选择你的队伍,依次击败其余强队!平局将进入金球加时"),this.teamGrid(e=>{const n=lx(e);this.showCampaignStage(n)}),this.mkBack(()=>this.showTitle());return}this.showCampaignStage(t)}showCampaignStage(t){this.clear();const e=cx(t),n=vh(t),i=Re(t.teamId);if(!e){this.heading("🏆 冠军!",`${i.name} 完成征战之路!战绩 ${t.wins} 胜 ${t.losses} 负`),this.mkBtn("重新开始征战",!0,()=>{_c(),this.showCampaign()},"#3df58a"),this.mkBack(()=>this.showTitle());return}this.heading(`征战之路 · 第 ${t.stage+1} / ${n} 关`,`${i.name}  VS  ${e.name} · 战绩 ${t.wins}胜${t.losses}负`);const r=document.createElement("div");r.style.cssText="display:flex;gap:6px;margin:8px 0;";for(let c=0;c<n;c++){const h=document.createElement("div");h.style.cssText=`width:26px;height:10px;border:2px solid #888;
        background:${c<t.stage?"#3df58a":c===t.stage?"#f5d33d":"transparent"};`,r.appendChild(h)}this.content.appendChild(r);const a=hx(t),o=["容易","普通","困难"][a],l=document.createElement("div");l.textContent=`本关难度: ${o} · 平局进入金球加时`,l.style.cssText="font-size:14px;opacity:.75;",this.content.appendChild(l),this.mkBtn(`开战!VS ${e.name}`,!0,()=>{this.onStart({teamA:t.teamId,teamB:e.id,aiLevel:a,goldenGoal:!0,training:!1,campaign:t,ruleset:"classic",weather:"random",halfDuration:90})},"#3df58a"),this.mkBtn("查看阵容",!0,()=>this.showSquad(t.teamId,()=>this.showCampaignStage(t)),"#3dd5f5"),this.mkBtn("放弃进度",!0,()=>{_c(),this.showTitle()},"#f55"),this.mkBack(()=>this.showTitle())}showRecruit(t,e){this.clear();const n=Re(e),i=ro(t.teamId);this.heading("招募球星!",`击败 ${n.name},可挑选一名对方球员加入(替换同位置)`);const r=document.createElement("div");r.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,210px));gap:12px;justify-content:center;padding:8px;max-width:820px;";for(let a=1;a<=5;a++){const o=n.players[a],l=i.players[a],c=document.createElement("div");c.innerHTML=`
        <div style="font-size:16px;font-weight:bold;color:#f5a63d;">${o.name}</div>
        <div style="font-size:11px;opacity:.75;line-height:1.7;">
          必杀: ${Wi[o.special].name}<br>
          速度 ${o.speed.toFixed(2)} · 力量 ${o.power.toFixed(2)} · 韧性 ${o.toughness.toFixed(2)}</div>
        <div style="font-size:11px;opacity:.5;margin-top:5px;border-top:1px solid #334;padding-top:4px;">
          替换我方: ${l.name}</div>`,c.style.cssText="border:2px solid #f5a63d88;padding:10px 12px;cursor:pointer;background:#00000055;",c.onmouseenter=()=>{c.style.borderColor="#f5a63d",Mt.menuMove()},c.onmouseleave=()=>c.style.borderColor="#f5a63d88",c.onclick=()=>{Mt.menuOk(),px(t.teamId,e,a,a),this.showCampaignStage(t)},r.appendChild(c)}this.content.appendChild(r),this.mkBtn("不招募,继续前进 →",!0,()=>this.showCampaignStage(t),"#3df58a")}showSquad(t,e){this.clear();const n=ro(t),i=Dr();this.heading(`${n.name} · 阵容`,"等级由比赛经验积累,属性随等级提升");const r=document.createElement("div");r.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,220px));gap:12px;justify-content:center;padding:8px;max-width:860px;",n.players.forEach((a,o)=>{const l=wh(i,t,o),c=so(l.level),h=l.level>=br?100:Math.round(l.xp/c*100),u=document.createElement("div");u.innerHTML=`
        <div style="display:flex;justify-content:space-between;">
          <b style="color:#3dd5f5;">${o===0?"🧤":""}${a.name}</b>
          <span style="color:#f5d33d;">Lv.${l.level}</span></div>
        <div style="font-size:11px;opacity:.75;line-height:1.7;">
          ${o===0?"门将":"必杀: "+Wi[a.special].name}<br>
          速 ${a.speed.toFixed(2)} · 力 ${a.power.toFixed(2)} · 韧 ${a.toughness.toFixed(2)}</div>
        <div style="height:7px;background:#1a2238;border:1px solid #445;margin-top:5px;">
          <div style="height:100%;width:${h}%;background:#3df58a;"></div></div>
        <div style="font-size:10px;opacity:.5;">${l.level>=br?"MAX":`EXP ${l.xp}/${c}`}</div>`,u.style.cssText="border:2px solid #33507a;padding:10px 12px;background:#00000055;",r.appendChild(u)}),this.content.appendChild(r),this.mkBack(e)}showTournament(){this.clear();const t=no();if(!t){this.heading("锦标赛","8 队单败淘汰!选择你的队伍"),this.teamGrid(e=>{const n=_h(e);this.showBracket(n)}),this.mkBack(()=>this.showTitle());return}this.showBracket(t)}showBracket(t){this.clear();const e=Re(t.playerTeam);if(t.round>=3){const i=Re(t.champion),r=t.champion===t.playerTeam;this.heading(r?"🏆 夺冠!":"锦标赛结束",r?`${e.name} 捧起奖杯!`:`冠军: ${i.name}`),this.renderBracketTable(t),this.mkBtn("再来一届",!0,()=>{io(),this.showTournament()},"#f5a63d"),this.mkBack(()=>this.showTitle());return}this.heading(`锦标赛 · ${hr[t.round]}`,t.eliminated?"你已被淘汰,可继续观战模拟":`${e.name} 出战!淘汰赛平局进入金球加时`),this.renderBracketTable(t);const n=Mh(t);if(n&&!t.eliminated){const i=Re(n.a===t.playerTeam?n.b:n.a),r=t.round===0?1:2;this.mkBtn(`开战!VS ${i.name}`,!0,()=>{this.onStart({teamA:t.playerTeam,teamB:i.id,aiLevel:r,goldenGoal:!0,training:!1,tournament:t,ruleset:"classic",weather:"random",halfDuration:90})},"#f5a63d")}else this.mkBtn("模拟本轮比赛 ▶",!0,()=>{ax(()=>Promise.resolve().then(()=>dx),void 0,import.meta.url).then(i=>{i.advance(t),this.showBracket(t)})},"#f5a63d");this.mkBtn("放弃本届",!0,()=>{io(),this.showTitle()},"#f55"),this.mkBack(()=>this.showTitle())}renderBracketTable(t){const e=document.createElement("div");e.style.cssText="display:flex;gap:26px;align-items:center;justify-content:center;flex-wrap:wrap;padding:8px;";for(let n=0;n<t.bracket.length;n++){const i=document.createElement("div");i.style.cssText="display:flex;flex-direction:column;gap:10px;";const r=document.createElement("div");r.textContent=hr[n],r.style.cssText="font-size:12px;opacity:.6;text-align:center;letter-spacing:2px;",i.appendChild(r);for(const a of t.bracket[n]){const o=Re(a.a),l=Re(a.b),c=a.scoreA!==void 0,h=document.createElement("div"),u=a.a===t.playerTeam||a.b===t.playerTeam,f=(g,x,m,p)=>`
          <div style="display:flex;justify-content:space-between;gap:10px;min-width:150px;
            ${p?"color:#f5d33d;font-weight:bold;":c?"opacity:.55;":""}">
            <span>${g.id===t.playerTeam?"★ ":""}${g.name}</span><span>${x??"-"}${m===void 0?"":` (${m})`}</span></div>`,d=a.winner??(c?a.scoreA>a.scoreB?a.a:a.b:"");h.innerHTML=f(o,a.scoreA,a.shootoutA,d===a.a)+f(l,a.scoreB,a.shootoutB,d===a.b),h.style.cssText=`border:2px solid ${u?"#f5a63d":"#445"};padding:7px 12px;
          background:#00000066;font-size:13px;line-height:1.7;`,i.appendChild(h)}e.appendChild(i)}if(t.champion){const n=document.createElement("div");n.innerHTML=`<div style="font-size:12px;opacity:.6;letter-spacing:2px;text-align:center;">冠军</div>
        <div style="border:2px solid #f5d33d;padding:10px 14px;color:#f5d33d;font-weight:bold;background:#00000066;">
        🏆 ${Re(t.champion).name}</div>`,n.style.cssText="display:flex;flex-direction:column;gap:10px;",e.appendChild(n)}this.content.appendChild(e)}showOnline(){this.clear(),this.heading("联机对战 (Beta)","一人创建房间获得房间码,朋友输入房间码加入 · 走 Dreamin 云端中继");let t=Se[0].id;const e=localStorage.getItem("nk-nick")||"球员"+Math.floor(Math.random()*1e3),n=document.createElement("div");n.style.cssText="display:flex;gap:10px;align-items:center;";const i=document.createElement("div");i.textContent="昵称",i.style.cssText="font-size:15px;opacity:.8;";const r=document.createElement("input");r.value=e,r.maxLength=12,r.style.cssText=`width:160px;padding:8px;font-size:16px;text-align:center;
      background:#0d1428;border:2px solid #3dd5f5;color:#fff;font-family:inherit;outline:none;`,r.oninput=()=>localStorage.setItem("nk-nick",r.value.trim()||e),n.appendChild(i),n.appendChild(r),this.content.appendChild(n);const a=document.createElement("div");a.style.cssText="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:760px;";const o=[];for(const _ of Se){const S="#"+_.color.toString(16).padStart(6,"0"),P=document.createElement("div");P.textContent=_.name,P.style.cssText=`padding:6px 14px;border:2px solid ${_.id===t?"#f5d33d":S+"88"};
        cursor:pointer;font-size:13px;background:#00000055;`,P.onclick=()=>{t=_.id,o.forEach((w,E)=>w.style.borderColor=Se[E].id===t?"#f5d33d":"#"+Se[E].color.toString(16).padStart(6,"0")+"88"),Mt.menuMove()},o.push(P),a.appendChild(P)}this.content.appendChild(a);let l=90,c=1;const h=document.createElement("div");h.style.cssText="display:flex;gap:18px;flex-wrap:wrap;justify-content:center;font-size:12px;";const u=(_,S,P,w)=>{const E=document.createElement("div");E.style.cssText="display:flex;align-items:center;gap:6px;";const L=document.createElement("span");L.textContent=_,L.style.cssText="color:#d9c28d;",E.appendChild(L);const T=[];return S.forEach(y=>{const C=document.createElement("div");C.textContent=y.text,C.style.cssText=`padding:4px 10px;border:1px solid ${y.value===P()?"#f5d33d":"#59616d"};cursor:pointer;background:#080d16aa;`,C.onclick=()=>{w(y.value),T.forEach((U,z)=>U.style.borderColor=S[z].value===P()?"#f5d33d":"#59616d"),Mt.menuMove()},T.push(C),E.appendChild(C)}),E};h.appendChild(u("时长",[{value:60,text:"60秒"},{value:90,text:"90秒"},{value:120,text:"120秒"}],()=>l,_=>{l=_})),h.appendChild(u("场次",[{value:1,text:"单场"},{value:3,text:"三局两胜"}],()=>c,_=>{c=_})),this.content.appendChild(h);const f=document.createElement("div");f.textContent="比赛设置由创建房间的玩家决定",f.style.cssText="font-size:11px;opacity:.45;",this.content.appendChild(f);const d=()=>(localStorage.getItem("nk-nick")||e).slice(0,24),g=()=>String(Math.floor(1e3+Math.random()*9e3));this.mkBtn("创建房间(主机)",!0,()=>this.onOnline(!0,t,g(),d(),{halfDuration:l,bestOf:c}),"#c03df5");const x=document.createElement("div");x.style.cssText="display:flex;gap:10px;align-items:center;";const m=document.createElement("input");m.placeholder="房间码",m.maxLength=4,m.style.cssText=`width:110px;padding:9px;font-size:19px;text-align:center;letter-spacing:5px;
      background:#0d1428;border:2px solid #c03df5;color:#fff;font-family:inherit;outline:none;`;const p=document.createElement("div");p.textContent="加入房间",p.style.cssText="padding:9px 22px;border:2px solid #c03df5;cursor:pointer;font-size:16px;background:#d83a2a33;",p.onclick=()=>{m.value.length===4&&(Mt.menuOk(),this.onOnline(!1,t,m.value,d()))},x.appendChild(m),x.appendChild(p),this.content.appendChild(x);const v=document.createElement("div");v.innerHTML="无需自建服务器:联机经 <b>ai.dreamin.cn</b> 云端中继,双方联网即可对战<br>把创建后显示的 4 位房间码告诉朋友即可加入",v.style.cssText="font-size:12px;opacity:.55;margin-top:8px;text-align:center;line-height:1.8;",this.content.appendChild(v),this.mkBack(()=>{this.onOnlineCancel(),this.showTitle()})}showWaiting(t,e){this.clear(),this.heading("等待对手加入…","把房间码告诉你的朋友");const n=document.createElement("div");n.textContent=t,n.style.cssText=`font-size:64px;font-weight:bold;letter-spacing:16px;color:#c03df5;
      text-shadow:3px 3px 0 #000;border:3px dashed #c03df5;padding:12px 30px;`,this.content.appendChild(n),this.mkBtn("取消",!0,e,"#f55")}showTrainingSelect(){this.clear(),this.heading("训练场","先选训练项目,再选你的队伍(能量恒满 · 不计时 · R 键重置)");const t=[{id:"free",label:"自由练习",desc:"任意踢球 · 熟悉操控",color:"#3dd5f5"},{id:"solo",label:"单人练习场",desc:"全场只留你 · 带控制台",color:"#f5d33d"},{id:"pass",label:"连续传球",desc:"连传 6 次不丢球",color:"#3df58a"},{id:"tackle",label:"铲断抢球",desc:"铲下对手 3 次球权",color:"#f5a63d"},{id:"special",label:"必杀射门",desc:"跳跃必杀射正 2 次",color:"#f53d5a"},{id:"keeper",label:"扑救特训",desc:"操控门将扑出 5 脚射门",color:"#c03df5"}];let e="free";const n=document.createElement("div");n.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;max-width:720px;width:100%;";const i=[];t.forEach(r=>{const a=document.createElement("div");a.innerHTML=`<div style="font-size:16px;font-weight:bold;">${r.label}</div>
        <div style="font-size:11px;opacity:.7;margin-top:3px;">${r.desc}</div>`,a.style.cssText=`border:3px solid ${r.color};padding:10px 12px;cursor:pointer;background:#00000066;text-align:center;`;const o=()=>{i.forEach(l=>l.style.background="#00000066"),a.style.background=`${r.color}44`};a.onmouseenter=()=>{Mt.ensure(),Mt.menuMove()},a.onclick=()=>{Mt.ensure(),Mt.menuOk(),e=r.id,o()},i.push(a),n.appendChild(a)}),this.content.appendChild(n),this.heading("","选择你的队伍"),this.teamGrid(r=>{const a=Se.filter(l=>l.id!==r),o=a[Math.random()*a.length|0];this.onStart({teamA:r,teamB:o.id,aiLevel:0,goldenGoal:!1,training:!0,trainingDrill:e,ruleset:"arcade",weather:"clear"})}),this.mkBack(()=>this.showTitle())}hide(){this.root.style.display="none"}show(){this.root.style.display="flex",this.showTitle()}}const yc=1/20,gx=1/15,xx="nekketsu-storm-soccer";function vx(s){return("n-"+s).toLowerCase().replace(/[^a-z0-9-]/g,"-").slice(0,63)}function _x(s){return[Math.round(s.dirX*100)/100,Math.round(s.dirZ*100)/100,s.pass?1:0,s.shoot?1:0,s.dash?1:0,s.jump?1:0,s.skill?1:0,s.tactic?1:0,s.passPressed?1:0,s.shootPressed?1:0,s.dashPressed?1:0,s.jumpPressed?1:0,s.skillPressed?1:0,s.tacticPressed?1:0]}function yx(s){const t=e=>!!e;return{dirX:s[0],dirZ:s[1],pass:t(s[2]),shoot:t(s[3]),dash:t(s[4]),jump:t(s[5]),skill:t(s[6]),tactic:t(s[7]),passPressed:t(s[8]),shootPressed:t(s[9]),dashPressed:t(s[10]),jumpPressed:t(s[11]),skillPressed:t(s[12]),tacticPressed:t(s[13])}}class Mx{constructor(){this.d=null,this.room=null,this.roomName="",this.role="host",this.connected=!1,this.onStart=()=>{},this.onCreated=()=>{},this.onError=()=>{},this.onPeerLeft=()=>{},this.onDisconnected=()=>{},this.remoteInput=bx(),this.snapA=null,this.snapB=null,this.snapT=0,this.sendT=0,this.remoteEvents=[],this.started=!1,this.myTeam="",this.myNick="",this.peerTeam="",this.peerNick="",this.halfDuration=90,this.bestOf=1}async connect(t,e,n,i,r){if(!window.Dreamin)throw new Error("联机 SDK 未加载,请检查网络后刷新页面");this.d=await window.Dreamin.init({work:xx,nickname:t}),this.myTeam=i,this.myNick=t,e&&(this.halfDuration=(r==null?void 0:r.halfDuration)??90,this.bestOf=(r==null?void 0:r.bestOf)??1),await this.joinRoom(e,n),this.d.socket.on("disconnect",()=>{this.connected=!1,this.started&&(this.started=!1,this.onDisconnected())}),this.d.socket.on("connect",()=>{this.joinRoom(this.role==="host",n)})}async joinRoom(t,e){const n=vx(e);try{this.room=await this.d.room.join(n)}catch(i){const r=String((i==null?void 0:i.message)??i);r.includes("room-full")?this.onError("房间已满"):r.includes("server-full")?this.onError("服务器繁忙,稍后再试"):this.onError("进入房间失败:"+r);return}this.connected=!0,this.snapA=null,this.snapB=null,this.remoteEvents.length=0,this.room.onPeer(({type:i})=>{i==="join"?(this.peerTeam="",this.peerNick="",this.room.send({t:"hello",team:this.myTeam,nick:this.myNick})):this.started&&(this.started=!1,this.peerTeam="",this.peerNick="",this.onPeerLeft())}),this.room.onState(i=>{this.role==="guest"?(this.snapA=this.snapB,this.snapB=i,this.snapT=0):this.remoteInput=yx(i)}),this.room.onMessage(i=>{(i==null?void 0:i.t)==="hello"&&i.team!==this.myTeam?(this.peerTeam=i.team,this.peerNick=typeof i.nick=="string"?String(i.nick).slice(0,24):"",this.role==="guest"&&(typeof i.halfDuration=="number"&&(this.halfDuration=i.halfDuration),(i.bestOf===1||i.bestOf===3)&&(this.bestOf=i.bestOf)),this.started||this.room.send({t:"hello",team:this.myTeam,nick:this.myNick,halfDuration:this.halfDuration,bestOf:this.bestOf}),this.tryStart()):this.role==="guest"&&(i==null?void 0:i.t)==="event"&&this.remoteEvents.push(...i.evs)}),this.room.onError(i=>{i.code!=="rate-limited"&&this.onError(`联机错误:${i.code}`)}),this.role=t?"host":"guest",this.room.send({t:"hello",team:this.myTeam,nick:this.myNick,halfDuration:this.halfDuration,bestOf:this.bestOf}),t&&this.onCreated(e)}tryStart(){if(this.started||!this.peerTeam)return;this.started=!0;const t=this.peerTeam,e=this.peerNick||"对手";this.onStart({role:this.role,myTeam:this.myTeam,oppTeam:t,myNick:this.myNick,oppNick:e,halfDuration:this.halfDuration,bestOf:this.bestOf})}close(){var t;(t=this.room)==null||t.leave(),this.room=null,this.d=null,this.connected=!1}hostTick(t,e){if(this.room&&(this.sendT+=e,this.sendT>=yc&&(this.sendT=0,this.room.sendState(Sx(t))),t.events.length>0)){const n=t.events.map(i=>{var r,a;return{type:i.type,team:i.team,x:i.x,z:i.z,special:i.special?{name:i.special.name,color:i.special.color}:void 0,px:(r=i.player)==null?void 0:r.x,pz:(a=i.player)==null?void 0:a.z}});this.room.send({t:"event",evs:n})}}guestTick(t,e){this.room&&(this.sendT+=e,this.sendT>=gx&&(this.sendT=0,this.room.sendState(_x(t))))}applySnapshot(t,e){if(!this.snapB)return;this.snapT+=e;const n=this.snapA,i=this.snapB,r=n?Math.min(1,this.snapT/yc):1,a=(o,l)=>o+(l-o)*r;n?(t.ball.x=a(n.bx,i.bx),t.ball.y=a(n.by,i.by),t.ball.z=a(n.bz,i.bz)):(t.ball.x=i.bx,t.ball.y=i.by,t.ball.z=i.bz),t.ball.spin=i.bs,t.ball.special=i.sp?Wi[i.sp]:null;for(let o=0;o<t.players.length&&o<i.ps.length;o++){const l=t.players[o],c=i.ps[o],h=n==null?void 0:n.ps[o];h?(l.x=a(h[0],c[0]),l.y=a(h[1],c[1]),l.z=a(h[2],c[2])):(l.x=c[0],l.y=c[1],l.z=c[2]),l.faceX=c[3],l.faceZ=c[4],l.state=c[5],l.animT=c[6],l.stamina=c[7]}t.score[0]=i.sc[0],t.score[1]=i.sc[1],t.energy[0]=i.en[0],t.energy[1]=i.en[1],t.combo[0]=i.combo[0],t.combo[1]=i.combo[1],t.tactics[0]=i.tactics[0],t.tactics[1]=i.tactics[1],t.ruleset=i.ruleset,t.controlledIdx[0]=i.ctrl[0],t.controlledIdx[1]=i.ctrl[1],t.wind.x=i.wind[0],t.wind.z=i.wind[1],t.weather=i.weather,t.shootout=i.shootout?{...i.shootout,scores:[...i.shootout.scores],attempts:[...i.shootout.attempts]}:null,t.shootoutWinner=i.shootoutWinner,t.time=i.time,t.half=i.half,t.phase=i.phase}}function Sx(s){var t;return{bx:s.ball.x,by:s.ball.y,bz:s.ball.z,bs:s.ball.spin,sp:((t=s.ball.special)==null?void 0:t.id)??null,ps:s.players.map(e=>[e.x,e.y,e.z,e.faceX,e.faceZ,e.state,e.animT,e.stamina]),sc:[s.score[0],s.score[1]],en:[s.energy[0],s.energy[1]],combo:[s.combo[0],s.combo[1]],tactics:[s.tactics[0],s.tactics[1]],ruleset:s.ruleset,ctrl:[s.controlledIdx[0],s.controlledIdx[1]],wind:[s.wind.x,s.wind.z],weather:s.weather,shootout:s.shootout?{...s.shootout,scores:[...s.shootout.scores],attempts:[...s.shootout.attempts]}:null,shootoutWinner:s.shootoutWinner,time:s.time,half:s.half,phase:s.phase}}function bx(){return{dirX:0,dirZ:0,pass:!1,shoot:!1,dash:!1,jump:!1,skill:!1,tactic:!1,passPressed:!1,shootPressed:!1,dashPressed:!1,jumpPressed:!1,skillPressed:!1,tacticPressed:!1}}class Tx{constructor(t,e){this.input=e,this.stickActive=!1,this.stickId=null,this.stickCenter={x:0,y:0},this.onPause=()=>{},this.root=document.createElement("div"),this.root.style.cssText="position:absolute;inset:0;pointer-events:none;display:none;",t.appendChild(this.root),this.isTouchDevice()&&(this.root.style.display="block"),this.buildStick(),this.buildButtons(),this.buildPause(),window.addEventListener("blur",()=>this.reset()),document.addEventListener("visibilitychange",()=>{document.hidden&&this.reset()})}isTouchDevice(){return"ontouchstart"in window||navigator.maxTouchPoints>0}reset(){this.stickActive=!1,this.stickId=null,this.input.touchDir={x:0,z:0,active:!1},this.input.touchBtn={pass:!1,shoot:!1,dash:!1,jump:!1,skill:!1,tactic:!1},this.stickKnob.style.transform="translate(-50%,-50%)"}buildStick(){const t="calc(env(safe-area-inset-left, 0px) + 3vw)",e="calc(env(safe-area-inset-bottom, 0px) + 4vh)";this.stickBase=document.createElement("div"),this.stickBase.style.cssText=`position:absolute;left:${t};bottom:${e};width:clamp(96px,14vw,124px);height:clamp(96px,14vw,124px);border-radius:50%;
      background:rgba(255,255,255,.08);border:3px solid rgba(255,255,255,.35);pointer-events:auto;touch-action:none;user-select:none;`,this.stickKnob=document.createElement("div"),this.stickKnob.style.cssText=`position:absolute;left:50%;top:50%;width:44px;height:44px;border-radius:50%;
      background:rgba(255,255,255,.4);transform:translate(-50%,-50%);pointer-events:none;`,this.stickBase.appendChild(this.stickKnob),this.root.appendChild(this.stickBase);const n=(r,a)=>{const o=r-this.stickCenter.x,l=a-this.stickCenter.y,c=Math.hypot(o,l),h=this.stickBase.clientWidth/2-10,u=Math.min(c,h),f=c>4?o/c:0,d=c>4?l/c:0;this.stickKnob.style.transform=`translate(calc(-50% + ${f*u}px), calc(-50% + ${d*u}px))`,this.input.touchDir.x=f*(u/h),this.input.touchDir.z=d*(u/h),this.input.touchDir.active=!0};this.stickBase.addEventListener("pointerdown",r=>{r.preventDefault(),this.stickBase.setPointerCapture(r.pointerId),this.stickId=r.pointerId,this.stickActive=!0;const a=this.stickBase.getBoundingClientRect();this.stickCenter={x:a.left+a.width/2,y:a.top+a.height/2},n(r.clientX,r.clientY)}),this.stickBase.addEventListener("pointermove",r=>{this.stickActive&&r.pointerId===this.stickId&&n(r.clientX,r.clientY)});const i=r=>{r.pointerId===this.stickId&&(this.stickId=null,this.stickActive=!1,this.input.touchDir={x:0,z:0,active:!1},this.stickKnob.style.transform="translate(-50%,-50%)")};this.stickBase.addEventListener("pointerup",i),this.stickBase.addEventListener("pointercancel",i)}buildButtons(){const t="calc(env(safe-area-inset-right, 0px) + 3vw)",e="calc(env(safe-area-inset-bottom, 0px) + 4vh)",n=[{key:"pass",label:"传/要/铲",transform:"translate(calc(-1 * clamp(84px,14vw,112px)), -3vh)",color:"#3a8af5"},{key:"shoot",label:"射门",transform:"translate(0, -3vh)",color:"#f53d3d"},{key:"jump",label:"跳",transform:"translate(0, calc(-3vh - clamp(72px,12vw,88px)))",color:"#3df58a"},{key:"dash",label:"冲刺",transform:"translate(calc(-1 * clamp(84px,14vw,112px)), calc(-3vh - clamp(72px,12vw,88px)))",color:"#f5a63d"},{key:"skill",label:"过人",transform:"translate(calc(-.5 * clamp(84px,14vw,112px)), calc(-3vh - clamp(144px,24vw,176px)))",color:"#c56af5"}];for(const r of n){const a=document.createElement("div");a.textContent=r.label,a.style.cssText=`position:absolute;right:${t};bottom:${e};width:clamp(56px,11vw,72px);height:clamp(56px,11vw,72px);border-radius:50%;
        background:${r.color}55;border:3px solid ${r.color};color:#fff;display:flex;align-items:center;justify-content:center;
        font-size:13px;font-weight:bold;pointer-events:auto;touch-action:none;user-select:none;text-shadow:1px 1px 0 #000;transform:${r.transform};`;const o=c=>this.input.touchBtn[r.key]=c;a.addEventListener("pointerdown",c=>{c.preventDefault(),a.setPointerCapture(c.pointerId),o(!0),a.style.background=`${r.color}aa`});const l=()=>{o(!1),a.style.background=`${r.color}55`};a.addEventListener("pointerup",l),a.addEventListener("pointercancel",l),this.root.appendChild(a)}const i=[{key:"tactic",label:"战术",color:"#d84a3a",offset:0}];for(const r of i){const a=document.createElement("div");a.textContent=r.label,a.style.cssText=`position:absolute;left:calc(env(safe-area-inset-left, 0px) + 3vw + ${r.offset}px);bottom:calc(env(safe-area-inset-bottom, 0px) + 4vh + clamp(108px,16vw,142px));
        width:52px;height:34px;border-radius:17px;background:${r.color}55;border:2px solid ${r.color};
        color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;
        pointer-events:auto;touch-action:none;user-select:none;text-shadow:1px 1px 0 #000;`;const o=c=>this.input.touchBtn[r.key]=c;a.addEventListener("pointerdown",c=>{c.preventDefault(),a.setPointerCapture(c.pointerId),o(!0),a.style.background=`${r.color}aa`});const l=()=>{o(!1),a.style.background=`${r.color}55`};a.addEventListener("pointerup",l),a.addEventListener("pointercancel",l),this.root.appendChild(a)}}buildPause(){const t=document.createElement("div");t.textContent="⏸",t.style.cssText=`position:absolute;top:calc(env(safe-area-inset-top, 0px) + 8px);left:10px;width:clamp(36px,8vw,48px);height:clamp(36px,8vw,48px);
      border-radius:50%;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.4);color:#fff;display:flex;align-items:center;justify-content:center;
      font-size:18px;pointer-events:auto;touch-action:none;user-select:none;`,t.addEventListener("pointerdown",e=>{e.preventDefault(),this.onPause()}),this.root.appendChild(t)}show(t){this.root.style.display=t&&this.isTouchDevice()?"block":"none",t||this.reset()}}function wx(s,t,e){const n=document.createElement("div");n.style.cssText=`position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    background:rgba(4,8,18,.82);color:#fff;font-family:"Courier New","SimHei",monospace;z-index:30;`;const[i,r]=t.stats,a=i.possession+r.possession||1,o=Math.round(i.possession/a*100),l=100-o,[c,h]=t.score,u=t.winner(),f=t.humanTeam>=0?t.humanTeam:0,d=u===f,g=d?"胜利!":u>=0?"败北…":"平局",x=(P,w,E)=>`
    <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:14px;font-size:15px;line-height:2;">
      <span style="text-align:right;color:#ffd76a;">${w}</span>
      <span style="opacity:.65;min-width:120px;text-align:center;">${P}</span>
      <span style="text-align:left;color:#7ec8ff;">${E}</span>
    </div>`,m=document.createElement("div");m.style.cssText=`border:3px solid #f5d33d;background:#0d1428ee;padding:26px 40px;text-align:center;
    box-shadow:0 0 40px #000;max-width:min(92vw,560px);`,m.innerHTML=`
    <div style="font-size:26px;font-weight:bold;letter-spacing:4px;color:${d?"#f5d33d":u>=0?"#8899aa":"#3dd5f5"};
      text-shadow:2px 2px 0 #000;margin-bottom:4px;">${g}</div>
    <div style="font-size:20px;margin-bottom:14px;">
      ${t.teams[0].name} <b style="font-size:28px;color:#f5d33d;">${c} - ${h}</b> ${t.teams[1].name}
      ${t.shootoutWinner>=0&&t.shootout?`<div style="font-size:13px;opacity:.75;">点球 ${t.shootout.scores[0]} - ${t.shootout.scores[1]}</div>`:""}</div>
    <div style="border-top:1px solid #334;padding-top:10px;">
      ${x("控球率",o+"%",l+"%")}
      ${x("射门 (射正)",`${i.shots} (${i.onTarget})`,`${r.shots} (${r.onTarget})`)}
      ${x("传球 (成功/尝试)",`${i.passCompleted}/${i.passAttempts}`,`${r.passCompleted}/${r.passAttempts}`)}
      ${x("拦截",i.interceptions,r.interceptions)}
      ${x("铲球 (成功/尝试)",`${i.tackles}/${i.tackleAttempts}`,`${r.tackles}/${r.tackleAttempts}`)}
      ${x("犯规 / 越位",`${i.fouls} / ${i.offsides}`,`${r.fouls} / ${r.offsides}`)}
      ${x("击中门框",i.woodwork,r.woodwork)}
      ${x("必杀射门",i.specials,r.specials)}
      ${x("门将扑救",i.saves,r.saves)}
    </div>
    <div style="margin-top:16px;font-size:13px;opacity:.6;">点击任意处继续</div>`,n.appendChild(m),s.appendChild(n);let p=!1,v=!0,_=0;const S=()=>{p||(p=!0,window.clearTimeout(_),n.remove(),v&&e())};return n.addEventListener("click",S),_=window.setTimeout(S,9e3),{dismiss(){v=!1,S()}}}class Ex{constructor(t,e){this.visible=!1,this.trainingResetBtn=null,this.quitArmed=!1,this.quitTimer=0,this.onResume=e.onResume,this.onQuit=e.onQuit,this.onTrainingReset=e.onTrainingReset,this.isTraining=e.isTraining,this.root=document.createElement("div"),this.root.style.cssText=`position:absolute;inset:0;display:none;align-items:center;justify-content:center;
      background:rgba(4,8,18,.8);z-index:40;font-family:"Courier New","SimHei",monospace;`,t.appendChild(this.root);const n=document.createElement("div");n.style.cssText="border:3px solid #f5d33d;background:#0d1428f0;padding:28px 44px;text-align:center;max-width:min(90vw,420px);";const i=document.createElement("div");i.textContent="暂停",i.style.cssText="font-size:30px;letter-spacing:8px;color:#f5d33d;text-shadow:2px 2px 0 #000;margin-bottom:18px;",n.appendChild(i);const r=(o,l,c)=>{const h=document.createElement("button");return h.textContent=o,h.type="button",h.style.cssText=`display:block;width:100%;margin:8px 0;padding:10px 0;font-size:18px;letter-spacing:3px;cursor:pointer;
        color:#fff;background:#d83a2a22;border:2px solid ${l};font-family:inherit;`,h.onclick=()=>{Mt.ensure(),Mt.menuOk(),c()},n.appendChild(h),h};r("继续比赛","#3df58a",()=>this.hide());const a=r("","#3dd5f5",()=>{const o=Mt.toggleMute();a.textContent=o?"🔇 恢复声音":"🔊 静音"});a.textContent=Mt.muted?"🔇 恢复声音":"🔊 静音",this.onTrainingReset&&(this.trainingResetBtn=r("重置训练 (R)","#f5a63d",()=>{var o;this.isTraining()&&((o=this.onTrainingReset)==null||o.call(this))})),this.quitBtn=r("退出比赛","#f55",()=>this.armQuit()),n.appendChild(this.quitBtn),this.root.appendChild(n)}armQuit(){if(this.quitArmed){this.onQuit();return}this.quitArmed=!0,this.quitTimer=3,this.quitBtn.textContent="再按一次确认退出",this.quitBtn.style.borderColor="#fff"}update(t){this.quitArmed&&(this.quitTimer-=t,this.quitTimer<=0&&(this.quitArmed=!1,this.quitBtn.textContent="退出比赛",this.quitBtn.style.borderColor="#f55"))}toggle(){this.visible?this.hide():this.show()}isVisible(){return this.visible}show(){this.visible=!0,this.trainingResetBtn&&(this.trainingResetBtn.style.display=this.isTraining()?"block":"none"),this.root.style.display="flex";const t=this.root.querySelector("button");t==null||t.focus()}hide(){this.visible=!1,this.quitArmed=!1,this.quitBtn.textContent="退出比赛",this.quitBtn.style.borderColor="#f55",this.root.style.display="none",this.onResume()}destroy(){this.root.remove()}}function Ax(s,t,e){const n=document.createElement("div");n.dataset.testid="training-console",n.style.cssText=`position:absolute;right:10px;top:calc(env(safe-area-inset-top,0px) + 120px);z-index:20;
    background:#0d1428e6;border:2px solid #3dd5f5;padding:10px 12px;color:#fff;
    font-family:"Courier New","SimHei",monospace;min-width:150px;user-select:none;`;const i=document.createElement("div");i.textContent="⚙ 控制台",i.style.cssText="font-size:13px;color:#3dd5f5;letter-spacing:2px;margin-bottom:8px;text-align:center;",n.appendChild(i);const r=(l,c)=>{const h=document.createElement("div");return h.textContent=l,h.style.cssText=`padding:6px 10px;margin:5px 0;font-size:12px;cursor:pointer;text-align:center;
      border:1px solid #3a5ac8;background:#d83a2a22;color:#fff;letter-spacing:1px;`,h.onmouseenter=()=>h.style.background="#d83a2a66",h.onmouseleave=()=>h.style.background="#d83a2a22",h.onclick=()=>c(),n.appendChild(h),h};r("球复位(脚下)",()=>{const l=t.getControlled(t.humanTeam);t.ball.reset(l.x+l.faceX*1.5,l.z+l.faceZ*1.5),t.ball.owner=l,e("球已复位")}),r("回中圈",()=>{t.ball.reset(0,0),t.ball.owner=null,e("球回到中圈")}),r("能量充满",()=>{t.energy[t.humanTeam]=100,e("能量已充满")}),r("体力恢复",()=>{t.getControlled(t.humanTeam);for(const l of t.teamPlayers(t.humanTeam))l.stamina=100;e("体力已恢复")}),r("切换门将/中场",()=>{const l=t.controlledIdx[t.humanTeam];t.controlledIdx[t.humanTeam]=l===0?3:0;const c=t.controlledIdx[t.humanTeam]===0,h=t.getControlled(t.humanTeam);c&&(h.x=-t.attackDir(t.humanTeam)*51.5,h.z=0),e(c?"已切至门将位":"已切至中场核心")});const a=r("冻结NPC",()=>{t.soloNpcFrozen=!t.soloNpcFrozen,a.textContent=t.soloNpcFrozen?"解冻NPC":"冻结NPC",a.style.borderColor=t.soloNpcFrozen?"#f5a63d":"#3a5ac8",e(t.soloNpcFrozen?"NPC 已冻结":"NPC 已解冻")});let o=!1;return r("NPC上场陪练",()=>{const l=t.getControlled(t.humanTeam);if(o)t.soloReset(),e("已清场,球回脚下");else{const c=t.teamPlayers(1-t.humanTeam).filter(h=>!h.isKeeper);c.forEach((h,u)=>{h.x=l.x+(u===0?6:-8-u*4),h.z=l.z+(u===0?3:u===1?-7:7),h.vx=h.vz=0,h.setState("idle")}),c.length&&(t.ball.reset(c[0].x+c[0].faceX*1.2,c[0].z),t.ball.owner=c[0],t.ball.lastTeam=1-t.humanTeam),e("陪练已上场")}o=!o}),s.appendChild(n),{destroy(){n.remove()}}}const Eh=document.getElementById("game"),vi=document.getElementById("ui-root"),ai=new ix,Ir=new Tx(vi,ai),Ke=new mx(vi);let ut=null,Ze=null,Nt=null,he=null,$e=null,Wt=null,Ah="host",ys=0,gi=null,fs=null;const Tr=new Set;let Mc=performance.now();function dr(s,t,e=ys){const n=window.setTimeout(()=>{Tr.delete(n),e===ys&&s()},t);return Tr.add(n),n}function Ms(){ys++;for(const s of Tr)window.clearTimeout(s);Tr.clear(),gi==null||gi.dismiss(),gi=null,fs==null||fs.destroy(),fs=null}he=new Ex(vi,{onResume:()=>{},onQuit:()=>{he==null||he.hide(),wr()},onTrainingReset:()=>{ut!=null&&ut.training&&(ut.trainingReset(),Nt==null||Nt.banner("重置","#3dd5f5",.6))},isTraining:()=>(ut==null?void 0:ut.training)??!1});Ir.onPause=()=>he==null?void 0:he.show();Ke.onOnlineCancel=()=>{Ms(),Wt==null||Wt.close(),Wt=null};Ke.onStart=s=>{Ms(),Mt.ensure(),Ke.hide(),Ir.show(!0),$e=s,ut=new Rc(ro(s.teamA),Re(s.teamB)),ut.humanTeam=0,ut.controlledIdx[0]=s.playAsKeeper?0:3,ut.aiLevel=s.aiLevel,ut.goldenGoal=s.goldenGoal,ut.training=s.training,ut.ruleset=s.ruleset??"arcade",ut.halfDuration=s.halfDuration??90,ut.energyGainScale=s.energyGainScale??1,s.training&&(ut.trainingDrill=s.trainingDrill??"free",ut.setupTrainingDrill(),ut.trainingDrill==="solo"&&(fs=Ax(vi,ut,n=>Nt==null?void 0:Nt.banner(n,"#3dd5f5",.8)))),s.training||(!s.weather||s.weather==="random"?ut.rollWeather():(ut.weather=s.weather,ut.randomWind())),Ze=new ph(Eh,ut),Nt=new mh(vi,ut);const t={clear:"",rain:" · 雨战",snow:" · 雪战"}[ut.weather],e=ut.ruleset==="classic"?" · 竞技规则":" · 热血规则";Nt.banner(s.training?"自由训练开始":`开 球!${t}${e}`,"#d9b45b",1.8)};function wr(s=!1){const t=$e;Ms(),he==null||he.hide(),Nt==null||Nt.destroy(),Nt=null,Ze==null||Ze.dispose(),Ze=null,ut=null,Wt==null||Wt.close(),Wt=null,Ir.show(!1),Ke.show(),t!=null&&t.campaign?s?Ke.showRecruit(t.campaign,t.teamB):Ke.showCampaignStage(t.campaign):t!=null&&t.tournament&&Ke.showBracket(t.tournament),$e=null}function Cx(){if(!ut||!Nt)return;const s=ut,t=ys,e=Nt,[n,i]=s.score,r=s.winner(),a=s.humanTeam>=0?s.humanTeam:0,o=r===a;if(Wt&&Er===3&&r>=0){Ge[r]++;const f=Ge[0]===2||Ge[1]===2;e.banner(f?`系列赛结束 ${Ge[0]}-${Ge[1]} · ${r===a?"你赢了!":"你输了"}`:`本局 ${n}-${i} · 大比分 ${Ge[0]}-${Ge[1]}`,r===a?"#f5d33d":"#8899aa",2.6),dr(()=>{ut!==s||Nt!==e||(f?wr():(Ze==null||Ze.dispose(),Ph()))},2600,t);return}const l=$e==null?void 0:$e.campaign;l&&(o?(l.stage++,l.wins++):l.losses++,gh(l));const c=$e==null?void 0:$e.tournament;c&&r>=0&&Sh(c,{score:[n,i],winner:r,shootout:s.shootoutWinner>=0&&s.shootout?[s.shootout.scores[0],s.shootout.scores[1]]:void 0});let h=[];if($e&&!$e.training&&!Wt&&(h=ux($e.teamA,{win:o,goals:s.score[a],specials:s.stats[a].specials})),h.length>0){const f=h.map(d=>s.teams[a].players[d].name).join("、");dr(()=>e.banner(`${f} 升级!`,"#3df58a",2),1200,t)}const u=s.shootoutWinner>=0?` (点球 ${s.shootout.scores[0]}-${s.shootout.scores[1]})`:"";e.banner(`比赛结束 ${n}-${i}${u}`,o?"#f5d33d":"#8899aa",2),dr(()=>{ut!==s||Nt!==e||(gi=wx(vi,s,()=>{gi=null,ut===s&&wr(o&&!!l)}))},2100,t)}let Ch=90,Er=1,Ge=[0,0],Rh=null;function Ph(){const s=Rh;s&&(Ke.hide(),Ir.show(!0),$e={teamA:s.teamA,teamB:s.teamB,aiLevel:1,goldenGoal:!0,training:!1,ruleset:"arcade",weather:"random"},ut=new Rc(Re(s.teamA),Re(s.teamB)),ut.humans=[0,1],ut.humanTeam=s.role==="host"?0:1,ut.goldenGoal=!0,ut.ruleset="arcade",ut.halfDuration=Ch,ut.rollWeather(),Ze=new ph(Eh,ut),Ze.nameTags=s.role==="host"?[{team:0,nick:s.myNick},{team:1,nick:s.oppNick}]:[{team:0,nick:s.oppNick},{team:1,nick:s.myNick}],Nt=new mh(vi,ut),Er===3&&Ge[0]+Ge[1]>0?Nt.banner(`第 ${Ge[0]+Ge[1]+1} 局 · 大比分 ${Ge[0]}-${Ge[1]}`,"#c03df5",2):Nt.banner(Er===3?"三局两胜 · 第 1 局开始!":"联机对战开始!","#c03df5",2))}Ke.onOnline=async(s,t,e,n,i)=>{Ms(),Mt.ensure(),Wt=new Mx;const r=Wt,a=ys;r.onError=o=>{Wt===r&&(alert(o),ut||(r.close(),Wt=null,Ke.showTitle()))},r.onCreated=o=>{Wt===r&&Ke.showWaiting(o,()=>{Wt===r&&(Wt=null),r.close(),Ms(),Ke.showTitle()})},r.onPeerLeft=()=>{Wt===r&&(Nt==null||Nt.banner("对手已离开","#f55",3),dr(()=>{Wt===r&&(r.close(),Wt=null,wr())},2e3,a))},r.onDisconnected=()=>{Wt!==r||!Nt||Nt.banner("连接中断,重连中…","#f5a63d",2.5)},r.onStart=o=>{if(Wt!==r)return;Ah=o.role,Ch=o.halfDuration,Er=o.bestOf,Ge=[0,0];const l=o.role==="host"?o.myTeam:o.oppTeam,c=o.role==="host"?o.oppTeam:o.myTeam;Rh={role:o.role,teamA:l,teamB:c,myNick:o.myNick,oppNick:o.oppNick},Ph()};try{await r.connect(n,s,e,t,s?{halfDuration:(i==null?void 0:i.halfDuration)??90,bestOf:(i==null?void 0:i.bestOf)??1}:void 0)}catch(o){if(Wt!==r)return;alert("联机连接失败:"+((o==null?void 0:o.message)??o)),r.close(),Wt=null,Ke.showTitle()}};window.addEventListener("keydown",s=>{if(ut){if(s.key==="Escape"){s.preventDefault(),he==null||he.toggle();return}(s.key==="r"||s.key==="R")&&ut.training&&(ut.trainingReset(),Nt==null||Nt.banner("重置","#3dd5f5",.6))}});function Lh(){requestAnimationFrame(Lh);const s=performance.now();let t=Math.min(.033,(s-Mc)/1e3);if(Mc=s,ai.update(),ut&&Ze&&Nt)if(he!=null&&he.isVisible())he.update(t),ai.startPressed&&he.hide();else{if(gi)return;{ai.startPressed&&(he==null||he.show());const e=ut.phase;if(Wt&&Ah==="guest"){Wt.guestTick(ai.state,t),Wt.applySnapshot(ut,t);for(const n of Wt.remoteEvents)ut.events.push({type:n.type,team:n.team,x:n.x,z:n.z,special:n.special?{...n.special}:void 0,player:n.px!==void 0?{x:n.px,z:n.pz,team:n.team??0}:void 0});Wt.remoteEvents.length=0}else{_d(ut,t);const n=Wt?Wt.remoteInput:null;ut.update(t,[ut.humanTeam===0||Wt?ai.state:null,n]),Wt&&Wt.hostTick(ut,t)}for(const n of ut.events)switch(n.type){case"pass":Mt.pass();break;case"shoot":Mt.shoot();break;case"kick":Mt.kick();break;case"bounce":Mt.bounce();break;case"jump":Mt.jump();break;case"dribble":{Mt.dribble(),n.trick==="rainbow"?(Mt.rainbow(),Nt.banner("彩虹过人!","#f5d33d",.6)):n.trick==="elastico"?(Mt.elastico(),Nt.banner("牛尾巴!","#3dd5f5",.6)):n.trick==="croqueta"&&(Mt.croqueta(),Nt.banner("油炸丸子!","#ffffff",.6));break}case"dribbleWin":Mt.dribbleWin(),Nt.banner("过人!","#3df58a",.8);break;case"dribbleFail":Mt.tackle();break;case"fakeShot":Mt.fakeShot();break;case"tackle":Mt.tackle();break;case"collide":Mt.collide();break;case"knockdown":Mt.knockdown();break;case"post":Mt.post(),Mt.crowdExcite(.3);break;case"save":Mt.save(),Mt.crowdExcite(.5);break;case"offside":Mt.whistle(),Nt.banner("越 位","#f5d33d",1.2);break;case"foul":Mt.whistle(),Nt.banner("干扰门将 · 任意球","#efb24d",1.2);break;case"callForPass":Mt.callForPass();break;case"tactic":Mt.tactic(),n.team===ut.humanTeam&&Nt.banner(`战术 · ${ut.tacticLabel(n.team)}`,"#d9b45b",.8);break;case"whistle":Mt.whistle();break;case"special":Mt.special(),Mt.crowdExcite(.5),n.special&&Nt.banner(`必杀!${n.special.name}!!`,"#"+n.special.color.toString(16).padStart(6,"0"),1.6);break;case"goal":Mt.goal(),Mt.crowdExcite(1),Nt.banner(ut.goldenGoal&&ut.half>=3?"金球绝杀!!":"GOAL!!!","#f5d33d",2.4);break}Ze.handleEvents(ut.events),ut.events.length=0,e!=="halftime"&&ut.phase==="halftime"&&Nt.banner(ut.half===3?"进入金球加时!":"中场休息","#3dd5f5",2),e!=="fulltime"&&ut.phase==="fulltime"&&Cx(),ut.training&&ut.trainingDrill!=="free"&&ut.drillDone&&!ut.drillCelebrated&&(ut.drillCelebrated=!0,Nt.banner("训练完成!","#3df58a",2)),Ze.update(t),Mt.updateCrowd(t),Nt.setDashHeld(ai.state.dash),Nt.update(t)}}}Lh();window.addEventListener("pointerdown",()=>Mt.ensure(),{once:!0});window.addEventListener("keydown",()=>Mt.ensure(),{once:!0});
