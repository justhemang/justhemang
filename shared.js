/* shared.js — JustHemang */

/* ── CURSOR ── */
;(function(){
  const ring = document.getElementById('cur-ring');
  const dot  = document.getElementById('cur-dot');
  if(!ring||!dot) return;
  let tx=0,ty=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;});
  (function loop(){
    rx+=(tx-rx)*.14; ry+=(ty-ry)*.14;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    dot.style.left=tx+'px';  dot.style.top=ty+'px';
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a,button').forEach(el=>{
    el.addEventListener('mouseenter',()=>document.body.classList.add('hov'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('hov'));
  });
})();

/* ── PARTICLE CANVAS ── */
;(function(){
  const c = document.getElementById('bg-canvas');
  if(!c) return;
  const ctx=c.getContext('2d');
  let W,H,pts=[];
  function resize(){W=c.width=window.innerWidth;H=c.height=window.innerHeight;}
  resize();
  window.addEventListener('resize',()=>{resize();init();});
  class P{
    constructor(){this.reset();}
    reset(){
      this.x=Math.random()*W; this.y=Math.random()*H;
      this.r=Math.random()*1.1+.2;
      this.vx=(Math.random()-.5)*.22; this.vy=(Math.random()-.5)*.22;
      this.a=Math.random()*.3+.06;
      this.cyan=Math.random()>.62;
    }
    tick(){
      this.x+=this.vx; this.y+=this.vy;
      if(this.x<0||this.x>W)this.vx*=-1;
      if(this.y<0||this.y>H)this.vy*=-1;
    }
    draw(){
      ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fillStyle=this.cyan?`rgba(62,207,220,${this.a})`:`rgba(80,80,82,${this.a*1.6})`;
      ctx.fill();
    }
  }
  function init(){
    pts=[];
    const n=Math.min(Math.floor(W*H/15000),110);
    for(let i=0;i<n;i++)pts.push(new P());
  }
  init();
  let mx=W/2,my=H/2;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;});
  (function frame(){
    ctx.clearRect(0,0,W,H);
    const cp=[];
    pts.forEach(p=>{
      const d=Math.hypot(p.x-mx,p.y-my);
      if(d<90){const f=(90-d)/90*.35;p.x+=((p.x-mx)/d)*f;p.y+=((p.y-my)/d)*f;}
      p.tick();p.draw();
      if(p.cyan)cp.push(p);
    });
    for(let i=0;i<cp.length;i++)for(let j=i+1;j<cp.length;j++){
      const d=Math.hypot(cp[i].x-cp[j].x,cp[i].y-cp[j].y);
      if(d<105){
        ctx.beginPath();
        ctx.strokeStyle=`rgba(62,207,220,${(1-d/105)*.055})`;
        ctx.lineWidth=.5;ctx.moveTo(cp[i].x,cp[i].y);ctx.lineTo(cp[j].x,cp[j].y);ctx.stroke();
      }
    }
    requestAnimationFrame(frame);
  })();
})();

/* ── NAV SOLID ON SCROLL ── */
;(function(){
  const nav=document.getElementById('nav');
  if(!nav)return;
  const check=()=>nav.classList.toggle('solid',window.scrollY>20);
  window.addEventListener('scroll',check,{passive:true});
  check();
})();

/* ── SCROLL REVEAL ── */
function initReveal(){
  const els=document.querySelectorAll('.sr');
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in');});
  },{threshold:.08});
  els.forEach(el=>obs.observe(el));
}

/* ── INNER PAGE LOADER ── */
;(function(){
  const ld=document.getElementById('loader');
  if(!ld||ld.dataset.skip)return;
  const fill=ld.querySelector('.ld-fill');
  const pct =ld.querySelector('.ld-pct');
  let v=0;
  const iv=setInterval(()=>{
    v+=Math.random()*15+6;
    if(v>=100){
      v=100;clearInterval(iv);
      fill.style.width='100%';
      if(pct)pct.textContent='100%';
      setTimeout(()=>{
        ld.style.transition='opacity .55s ease';
        ld.style.opacity='0';
        setTimeout(()=>{ld.remove();initReveal();},560);
      },150);
      return;
    }
    fill.style.width=v+'%';
    if(pct)pct.textContent=Math.floor(v)+'%';
  },55);
})();
