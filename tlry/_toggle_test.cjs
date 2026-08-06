const fs=require('fs'),path=require('path');const DIR=__dirname;
const sharedCtx=new Proxy({canvas:{width:800,height:600},imageSmoothingEnabled:false,fillStyle:'',strokeStyle:'',lineWidth:1,font:'',textBaseline:'top',globalAlpha:1,getImageData:()=>({data:new Uint8ClampedArray(4)}),measureText:()=>({width:40}),createPattern:()=>({}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get(t,p){if(p in t)return t[p];if(typeof p==='string'&&p!=='then')return()=>{};return t[p];}});
function mEl(tag){
  const el={tag,classes:new Set(),children:[],style:{},title:'',value:'',checked:false,className:'',_data:{},_listeners:{},onclick:null,
    classList:{add(c){el.classes.add(c);},remove(c){el.classes.delete(c);},toggle(c,on){const want=on===undefined?!el.classes.has(c):on;want?el.classes.add(c):el.classes.delete(c);},contains(c){return el.classes.has(c);}},
    appendChild(c){el.children.push(c);return c;},addEventListener(t,f){(el._listeners[t]=el._listeners[t]||[]).push(f);},
    setAttribute(k,v){el._data[k]=v;},getAttribute(k){return el._data[k];},focus(){},querySelectorAll(){return [];},
    querySelector(sel){ if(sel.indexOf('input')!==-1) return el._firstInput||null; if(sel.indexOf('.ct-state')!==-1) return el._ctState||null; return null; },
    getContext(){return sharedCtx;},toDataURL(){return 'data:img;base64,x';},
    get hidden(){return el.classes.has('hidden');}};
  let _html='',_text='';
  Object.defineProperty(el,'innerHTML',{get(){return _html;},set(v){_html=v;el.children.length=0;}});
  Object.defineProperty(el,'textContent',{get(){return _text;},set(v){_text=v;el.children.length=0;}});
  return el;
}
const els={};
const toggleBtns={};
for(const n of ['fly','ghost','god']){
  const btn=mEl('button'); btn.setAttribute('data-toggle',n);
  const st=mEl('span'); st.textContent='关'; btn._ctState=st; btn.appendChild(st);
  toggleBtns[n]=btn;
}
const documentMock={
  getElementById:id=>els[id]||(els[id]=mEl('div')),
  createElement:t=>mEl(t),
  querySelectorAll:sel=>sel.indexOf('.c-toggle')!==-1?Object.values(toggleBtns):[],
  querySelector:sel=>{const m=sel.match(/data-toggle="(\w+)"/);return m?toggleBtns[m[1]]||null:null;},
  addEventListener:()=>{},body:{},
};
const listeners={};
global.window=global;global.document=documentMock;
global.addEventListener=(t,f)=>{(listeners[t]=listeners[t]||[]).push(f);};
global.removeEventListener=()=>{};global.innerWidth=800;global.innerHeight=600;global.performance={now:()=>Date.now()};
global.localStorage={_d:{},getItem(k){return this._d[k]??null;},setItem(k,v){this._d[k]=String(v);},removeItem(k){delete this._d[k];}};
global.requestAnimationFrame=()=>0;global.navigator={};global.Image=function(){return{addEventListener(){},set src(v){},width:0,height:0};};
global.AUDIO={init(){},setDayPhase(){},play(){},toggleMute(){return false;},isMuted(){return false;},setVolume(v){return v;},getVolume(){return 0.7;}};
['audio.js','data.js','assets.js','world.js','player.js','entities.js','boss.js','npc.js','items.js','save.js','ui.js','main.js'].forEach(f=>{(new Function(fs.readFileSync(path.join(DIR,f),'utf8')))();});
(listeners['load']||[]).forEach(fn=>fn());
const g=window.game; if(!g) throw new Error('load 未创建 Game');
g.start(false);
const p=g.player, C=window.CONSOLE;
function assert(ok,msg){if(!ok)throw new Error(msg)}
const click=(n)=>{ const btn=toggleBtns[n]; if(typeof btn.onclick!=='function') throw new Error(n+' 未绑定 onclick'); btn.onclick({preventDefault(){}}); };

assert(typeof toggleBtns['fly'].onclick==='function','开关未绑定 onclick');
documentMock.getElementById('console').classes.add('hidden');
C.open();

// 点击切换 + 开/关文字 + 高亮
click('fly');
assert(p.flyMode===true,'飞行未开启');
assert(p.ghostMode===true,'飞行未同步穿墙');
assert(toggleBtns['fly'].classes.has('on'),'飞行未高亮');
assert(toggleBtns['fly']._ctState.textContent==='开','飞行开关文字未变「开」');
click('ghost');
assert(p.ghostMode===false,'穿墙关闭失败');
assert(toggleBtns['ghost']._ctState.textContent==='关','穿墙文字未变「关」');
click('ghost');
assert(p.ghostMode===true,'穿墙开启失败');
click('god');
assert(p.godMode===true,'无敌未开启');
const hp0=p.hp; p.tryHurt(999); assert(p.hp===hp0,'无敌未生效');
console.log('✓ button 点击开启/关闭 + 文字状态 + 无敌生效');

// 再点关闭
click('fly');
assert(p.flyMode===false,'飞行关闭失败');
assert(toggleBtns['fly']._ctState.textContent==='关','飞行文字未复位');
console.log('✓ 再次点击关闭复位');

// 顶部提示条显示已开启状态
click('fly');
assert((els['creative-hint']&&els['creative-hint'].textContent||'').indexOf('已开启')!==-1,'顶部未显示已开启状态');
console.log('✓ 顶部提示条显示已开启');

// 未开始游戏：提示且不崩
const g2=new window.Game(); window.game=g2;
click('fly');
assert((els['creative-hint']&&els['creative-hint'].textContent||'').indexOf('未开始游戏')!==-1,'未开始游戏未提示');
window.game=g;
console.log('✓ 未开始游戏提示');

console.log('=== 创造模式 button 开关回归通过 ===');
