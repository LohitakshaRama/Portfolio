/* ---------- helpers ---------- */
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const throttle=(fn,wait=16)=>{let t=0;return (...a)=>{const n=Date.now(); if(n-t>=wait){t=n;fn(...a)}}};

/* ---------- boot / preloader ---------- */
window.addEventListener('load', ()=>{
  document.body.classList.add('ready');
  const p=document.getElementById('preloader'); p.classList.add('hide');
});
/* hide via CSS class */
(() => {
  const style = document.createElement('style');
  style.textContent = `.preloader{position:fixed;inset:0;display:grid;place-items:center;background:radial-gradient(1200px 800px at 20% -10%,#0b1540 0%,#06091b 60%,#03040c 100%);z-index:9999;transition:opacity .5s ease,visibility .5s ease}
  .preloader.hide{opacity:0;visibility:hidden}
  .starspin{width:120px;height:120px;position:relative}
  .starspin:before,.starspin:after{content:"";position:absolute;inset:0;border-radius:50%;border:3px dashed rgba(122,226,255,.6);animation:spin 2.4s linear infinite}
  .starspin:after{border-color:rgba(199,125,255,.6);animation-direction:reverse;transform:scale(.8)}
  .loading-label{margin-top:14px;color:#a7b6e6;font-weight:800;letter-spacing:.2px;text-align:center}
  @keyframes spin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(style);
})();

/* ---------- nav active + smooth anchor transition + back-to-top ---------- */
const links=[...document.querySelectorAll('.menu a')];
const sections=[...document.querySelectorAll('section[id]')];
const toTop=document.getElementById('toTop');

document.querySelectorAll('[data-nav]').forEach(a=>{
  a.addEventListener('click', e=>{
    const href=a.getAttribute('href');
    if(href && href.startsWith('#')){
      e.preventDefault();
      document.body.style.opacity='.85';
      document.body.style.filter='blur(1px)';
      setTimeout(()=>{ location.hash = href; document.body.style.opacity='1'; document.body.style.filter='none'; },120);
    }
  });
});

window.addEventListener('scroll', throttle(()=>{
  const y=scrollY+120; let current=sections[0]?.id;
  for(const s of sections){ if(y>=s.offsetTop) current=s.id; }
  links.forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+current));
  toTop.classList.toggle('show', scrollY>360);
}, 90));

/* ---------- reveal on scroll ---------- */
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}})},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ---------- typer ---------- */
const lines=[
  "Integrated Master's (Chemical Sciences) — University of Hyderabad",
  "Computational Chemistry • Theoretical/Quantum Modeling",
  "Machine Learning: NumPy • Pandas • scikit-learn • TensorFlow",
  "Lead Review: Eicosanoid Signaling in Alzheimer’s (Elsevier, 2024)",
  "Books: It’s Your Life (2025) • Brainwaves of the Bold (2025)"
];
{
  let li=0, ci=0, dir=1, hold=0;
  const typer=document.getElementById('typer');
  (function loop(){
    const s=lines[li];
    if(dir>0 && ci<=s.length){ typer.textContent=s.slice(0,ci++); }
    else if(dir<0 && ci>=0){ typer.textContent=s.slice(0,ci--); }
    if(ci===s.length){ if(++hold>25){ dir=-1; hold=0; } }
    if(ci===0 && dir<0){ dir=1; li=(li+1)%lines.length; }
    setTimeout(loop, dir>0?22:12);
  })();
}

/* ---------- magnetic buttons + card hover spotlight ---------- */
document.querySelectorAll('.btn').forEach(btn=>{
  btn.addEventListener('pointermove', e=>{
    const r=btn.getBoundingClientRect();
    btn.style.setProperty('--mx', (e.clientX-r.left)+'px');
    btn.style.setProperty('--my', (e.clientY-r.top)+'px');
  });
});
document.querySelectorAll('.card').forEach(card=>{
  let raf=null;
  const spot=card.querySelector('.reveal-hover');
  card.addEventListener('pointermove', e=>{
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width*2-1, y=(e.clientY-r.top)/r.height*2-1;
    if(spot){ spot.style.setProperty('--mx', (e.clientX-r.left)+'px'); spot.style.setProperty('--my',(e.clientY-r.top)+'px'); }
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{ card.style.transform=`rotateX(${-y*5}deg) rotateY(${x*6}deg) translateY(-2px)`; });
  });
  card.addEventListener('pointerleave', ()=>{ card.style.transform=''; if(spot){ spot.style.opacity=0; }});
});

/* ---------- collapsibles (fixed: no CSS max-height conflicts) ---------- */
document.querySelectorAll('.collapsible-header').forEach(h=>{
  const d=h.nextElementSibling, t=h.querySelector('.toggle');
  h.setAttribute('aria-controls', (d.id || (d.id = 'coll-' + Math.random().toString(36).slice(2))));
  h.addEventListener('click', ()=>{
    const open = !d.classList.contains('show');
    h.setAttribute('aria-expanded', String(open));
    if(open){
      d.classList.add('show');
      d.style.maxHeight = d.scrollHeight + 'px';
      t.classList.add('open');
    }else{
      d.style.maxHeight = d.scrollHeight + 'px'; // set current height first to enable transition
      // next tick collapse
      requestAnimationFrame(()=>{
        d.classList.remove('show');
        d.style.maxHeight = '0px';
      });
      t.classList.remove('open');
    }
  });
  // on transition end, clean inline style when open
  d.addEventListener('transitionend', (ev)=>{
    if(ev.propertyName==='max-height' && d.classList.contains('show')){
      d.style.maxHeight = 'none';
    }
  });
});

/* ---------- year + CV filename ---------- */
document.getElementById('year').textContent=new Date().getFullYear();
const cv=document.getElementById('cvBtn'); if(cv) cv.setAttribute('download','Sita_final_CV.pdf');

/* ---------- starfield (canvas) with parallax & constellation lines ---------- */
(function(){
  const canvas=document.querySelector('canvas.stars'), ctx=canvas.getContext('2d');
  let DPR=1, W=innerWidth, H=innerHeight, N=170, stars=[], mouse={x:W/2,y:H/2,active:false}, scrollYPrev=0, scrollOffset=0;
  function resize(){
    DPR=Math.min(2, window.devicePixelRatio||1);
    W=canvas.width=innerWidth*DPR; H=canvas.height=innerHeight*DPR;
    canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    stars=[...Array(N)].map(()=>({
      x:Math.random()*innerWidth, y:Math.random()*innerHeight,
      vx:(Math.random()*2-1)*.15, vy:(Math.random()*2-1)*.15,
      r:Math.random()*1.4+.4, t:Math.random()*Math.PI*2, layer:Math.random()
    }));
  }
  function draw(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    ctx.globalCompositeOperation='lighter';
    for(const s of stars){
      s.x+=s.vx; s.y+=s.vy; s.t+=.02;
      if(s.x<-10)s.x=innerWidth+10; if(s.x>innerWidth+10)s.x=-10;
      if(s.y<-10)s.y=innerHeight+10; if(s.y>innerHeight+10)s.y=-10;
      if(mouse.active){ s.x += (mouse.x - s.x)*0.0005*(1+s.layer); s.y += (mouse.y - s.y)*0.0005*(1+s.layer); }
      const p=(Math.sin(s.t)+1)/2;
      ctx.beginPath();
      ctx.fillStyle=`rgba(255,255,255,${0.35+0.65*p})`;
      ctx.arc(s.x, s.y + scrollOffset*s.layer*0.15, s.r + p*.6, 0, Math.PI*2);
      ctx.fill();
    }
    // constellation lines
    for(let i=0;i<stars.length;i++){
      for(let j=i+1;j<stars.length;j++){
        const a=stars[i], b=stars[j];
        const dx=a.x-b.x, dy=(a.y+scrollOffset*a.layer*0.15)-(b.y+scrollOffset*b.layer*0.15), dist=Math.hypot(dx,dy);
        if(dist<120){
          const alpha=1-dist/120;
          ctx.strokeStyle=`rgba(122,226,255,${alpha*.35})`;
          ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y+scrollOffset*a.layer*0.15); ctx.lineTo(b.x, b.y+scrollOffset*b.layer*0.15); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  resize(); draw();
  addEventListener('resize', resize);
  addEventListener('pointermove', e=>{mouse.x=e.clientX; mouse.y=e.clientY});
  addEventListener('pointerenter', ()=>mouse.active=true);
  addEventListener('pointerleave', ()=>mouse.active=false);
  addEventListener('scroll', throttle(()=>{
    const dy=scrollY - scrollYPrev; scrollYPrev=scrollY; scrollOffset += dy;
  }, 16));
})();

/* ---------- shooting stars ---------- */
(function(){
  const host=document.querySelector('.shoots');
  function spawn(){
    const el=document.createElement('div');
    const y=Math.random()*innerHeight*0.7+30;
    const x=-100-Math.random()*200;
    const dx=innerWidth+320;
    const dur=1400+Math.random()*1200;
    el.style.cssText=`
      position:absolute; top:${y}px; left:${x}px; width:2px; height:2px; border-radius:50%;
      box-shadow: 0 0 0 2px rgba(255,255,255,.95), 0 0 10px 3px rgba(122,226,255,.7), 0 0 22px 10px rgba(199,125,255,.45);
      transform: translate3d(0,0,0) rotate(-18deg); opacity:0;`;
    const tail=document.createElement('span');
    tail.style.cssText=`
      position:absolute; left:-240px; top:50%; transform:translateY(-50%); height:2px; width:240px;
      background:linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.9));
      filter: drop-shadow(0 0 8px rgba(122,226,255,.6));`;
    el.appendChild(tail); host.appendChild(el);
    el.animate([
      {opacity:0, transform:`translate3d(0,0,0) rotate(-18deg)`},
      {opacity:1, offset:.08},
      {opacity:0, transform:`translate3d(${dx}px,-260px,0) rotate(-18deg)`}
    ], {duration:dur, easing:'cubic-bezier(.22,.61,.36,1)'});
    setTimeout(()=>el.remove(), dur+60);
  }
  setInterval(()=>{const n=Math.random()<.25?2:1; for(let i=0;i<n;i++) setTimeout(spawn,i*180);}, 1600);
})();

/* ---------- accessibility: reduce motion ---------- */
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.shoots,.liquid').forEach(el=>el.remove());
}
