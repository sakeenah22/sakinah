/* Sakeenah demonstrator figure v2 — clearer, more human proportions and shading.
   Still an illustrated figure (not a real person): a 3D joint skeleton projected and painted on canvas. */
(function(SK){
  const V = (x,y,z) => ({x,y,z});
  const add = (a,b) => V(a.x+b.x, a.y+b.y, a.z+b.z), mul = (a,k) => V(a.x*k, a.y*k, a.z*k);
  const norm = a => { const l = Math.hypot(a.x,a.y,a.z) || 1; return V(a.x/l, a.y/l, a.z/l); };
  const lerpV = (a,b,t) => norm(V(a.x+(b.x-a.x)*t, a.y+(b.y-a.y)*t, a.z+(b.z-a.z)*t));
  const ease = t => t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
  // bone directions in figure space (x = figure's left, y = up, z = toward viewer) + head yaw + palm (0 down … 1 forward/up)
  const P = {
    rest:  { lU:V( .10,-1, .02), lF:V( .04,-1, .10), rU:V(-.10,-1, .02), rF:V(-.04,-1, .10), head:0, palm:0 },
    raise: { lU:V( .58,-.62,.30), lF:V(-.04, 1, .10), rU:V(-.58,-.62,.30), rF:V( .04, 1, .10), head:0, palm:1 },
    fold:  { lU:V( .20,-.95,.24), lF:V(-.94, .18,.30), rU:V(-.20,-.95,.28), rF:V( .94, .22,.40), head:0, palm:.4 },
    salamR:{ lU:V( .20,-.95,.24), lF:V(-.94, .18,.30), rU:V(-.20,-.95,.28), rF:V( .94, .22,.40), head:-1.0, palm:.4 },
    salamL:{ lU:V( .20,-.95,.24), lF:V(-.94, .18,.30), rU:V(-.20,-.95,.28), rF:V( .94, .22,.40), head: 1.0, palm:.4 }
  };
  const C = { robe:'#F6F1E6', robeMid:'#E9E1D0', robeDark:'#CFC4AE', fold:'rgba(160,145,118,.35)', skin:'#C99F7A', skinLight:'#DDB894', skinDark:'#A57E5B', hair:'#3A2E26', cap:'#FFFFFF', capShade:'#E6E2DA', shadow:'rgba(0,0,0,.22)', gold:'#C9A45C' };
  function mix(a,b,t){ const o={}; for (const k in a) o[k] = typeof a[k]==='number' ? a[k]+(b[k]-a[k])*t : lerpV(a[k], b[k], t); return o; }

  function create(canvas){
    const ctx = canvas.getContext('2d');
    let pose = { ...P.rest }, anim = null, yaw = -0.12, raf = 0, speed = 1, cue = null, t0 = performance.now();
    const proj = (p) => { const c = Math.cos(yaw), s = Math.sin(yaw);
      const x = p.x*c + p.z*s, z = -p.x*s + p.z*c, W = canvas.width, H = canvas.height;
      const k = Math.min(H*0.74/2.05, W*0.9/0.95) * 3.4 / (3.4 - z);
      return { x: W/2 + x*k, y: H*0.84 - p.y*k, z, k }; };
    // tapered limb as a filled shape with lengthwise shading
    function limb(a, b, ra, rb, c1, c2){
      const A = proj(a), B = proj(b), dx = B.x-A.x, dy = B.y-A.y, l = Math.hypot(dx,dy) || 1, nx = -dy/l, ny = dx/l;
      const wa = ra*A.k, wb = rb*B.k;
      const g = ctx.createLinearGradient(A.x+nx*wa, A.y+ny*wa, A.x-nx*wa, A.y-ny*wa); g.addColorStop(0,c2); g.addColorStop(.5,c1); g.addColorStop(1,c2);
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(A.x+nx*wa, A.y+ny*wa); ctx.lineTo(B.x+nx*wb, B.y+ny*wb); ctx.lineTo(B.x-nx*wb, B.y-ny*wb); ctx.lineTo(A.x-nx*wa, A.y-ny*wa); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(A.x, A.y, wa, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(B.x, B.y, wb, 0, Math.PI*2); ctx.fill();
      if (c1 === C.robe){ ctx.strokeStyle = 'rgba(95,82,60,.35)'; ctx.lineWidth = Math.max(1, A.k*0.004); ctx.beginPath(); ctx.moveTo(A.x+nx*wa, A.y+ny*wa); ctx.lineTo(B.x+nx*wb, B.y+ny*wb); ctx.moveTo(A.x-nx*wa, A.y-ny*wa); ctx.lineTo(B.x-nx*wb, B.y-ny*wb); ctx.stroke(); }
      return { A, B };
    }
    function hand(wrist, dir, palm, side){
      const W0 = proj(wrist), tip = proj(add(wrist, mul(dir, 0.17))), k = W0.k;
      const ang = Math.atan2(tip.y - W0.y, tip.x - W0.x);
      ctx.save(); ctx.translate(W0.x, W0.y); ctx.rotate(ang);
      const len = 0.17*k, w = 0.082*k*(0.75 + 0.25*palm);
      const g = ctx.createLinearGradient(0,-w/2,0,w/2); g.addColorStop(0,C.skinLight); g.addColorStop(1,C.skinDark);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(len*0.32, 0, len*0.34, w*0.5, 0, 0, Math.PI*2); ctx.fill();             // palm
      ctx.strokeStyle = C.skin; ctx.lineCap = 'round';
      for (let f = 0; f < 4; f++){ const off = (-1.5 + f) * w*0.22; ctx.lineWidth = w*0.2; ctx.beginPath(); ctx.moveTo(len*0.55, off*0.9); ctx.lineTo(len*(0.95 - Math.abs(f-1.5)*0.07), off); ctx.stroke(); }
      ctx.lineWidth = w*0.22; ctx.beginPath(); ctx.moveTo(len*0.2, side*w*0.45); ctx.lineTo(len*0.45, side*w*0.78); ctx.stroke();   // thumb
      ctx.restore();
    }
    function draw(ts = performance.now()){
      const W = canvas.width, H = canvas.height; ctx.clearRect(0,0,W,H);
      const breath = Math.sin((ts - t0)/900) * 0.004;                        // gentle idle breathing (not a religious movement)
      // ground shadow
      const c0 = proj(V(0,0,0)); const sg = ctx.createRadialGradient(c0.x, c0.y, 0, c0.x, c0.y, c0.k*0.42);
      sg.addColorStop(0, C.shadow); sg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(c0.x, c0.y, c0.k*0.42, c0.k*0.09, 0, 0, Math.PI*2); ctx.fill();
      const shY = 1.56 + breath, shL = V(0.205, shY, 0), shR = V(-0.205, shY, 0);
      const elL = add(shL, mul(pose.lU, 0.29)), elR = add(shR, mul(pose.rU, 0.29));
      const wrL = add(elL, mul(pose.lF, 0.25)), wrR = add(elR, mul(pose.rF, 0.25));
      const parts = [];
      parts.push({ z:-0.02, f:() => { // thobe body
        const top = proj(V(0, shY+0.06, 0)), sL = proj(V(0.215, shY-0.02, 0.01)), sR = proj(V(-0.215, shY-0.02, 0.01)),
              wL = proj(V(0.185, 1.0, 0.03)), wR = proj(V(-0.185, 1.0, 0.03)), hL = proj(V(0.245, 0.07, 0.05)), hR = proj(V(-0.245, 0.07, 0.05));
        const g = ctx.createLinearGradient(hR.x, 0, hL.x, 0); g.addColorStop(0, C.robeDark); g.addColorStop(.32, C.robe); g.addColorStop(.6, C.robe); g.addColorStop(1, C.robeMid);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sR.x, sR.y);
        ctx.quadraticCurveTo(top.x, top.y - top.k*0.02, sL.x, sL.y);
        ctx.quadraticCurveTo(sL.x + sL.k*0.01, (sL.y+wL.y)/2, wL.x, wL.y); ctx.lineTo(hL.x, hL.y);
        ctx.quadraticCurveTo((hL.x+hR.x)/2, hL.y + hL.k*0.012, hR.x, hR.y); ctx.lineTo(wR.x, wR.y);
        ctx.quadraticCurveTo(sR.x - sR.k*0.01, (sR.y+wR.y)/2, sR.x, sR.y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(95,82,60,.45)'; ctx.lineWidth = Math.max(1.5, top.k*0.006); ctx.stroke();
        ctx.strokeStyle = C.fold; ctx.lineWidth = Math.max(1, top.k*0.004);           // soft folds
        [[-0.06,0.95,-0.1,0.1],[0.07,0.9,0.12,0.1],[0.0,0.6,0.01,0.1]].forEach(([x1,y1,x2,y2]) => { const a = proj(V(x1,y1,0.05)), b = proj(V(x2,y2,0.06)); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.quadraticCurveTo(a.x+(b.x-a.x)*0.4+3, (a.y+b.y)/2, b.x, b.y); ctx.stroke(); });
        const cA = proj(V(0, shY+0.03, 0.06)), cB = proj(V(0, shY-0.2, 0.08));      // collar placket
        ctx.strokeStyle = 'rgba(150,135,110,.45)'; ctx.beginPath(); ctx.moveTo(cA.x, cA.y); ctx.lineTo(cB.x, cB.y); ctx.stroke();
        [0.085,-0.085].forEach(x => { const f = proj(V(x,0.03,0.11)); ctx.fillStyle = C.skinDark; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.k*0.05, f.k*0.022, 0, 0, Math.PI*2); ctx.fill(); });   // feet
      }});
      parts.push({ z:0.0, f:() => { // neck + head (no facial features)
        const n = proj(V(0, shY+0.04, 0)), hc = proj(V(0, shY+0.25+breath, 0)), r = hc.k*0.118;
        limb(V(0,shY+0.0,0), V(0,shY+0.12,0), 0.036, 0.034, C.skin, C.skinDark);
        const fy = pose.head + yaw, side = Math.sin(fy), front = Math.cos(fy);
        const hg = ctx.createRadialGradient(hc.x - r*0.3 + side*r*0.3, hc.y - r*0.3, r*0.2, hc.x, hc.y, r*1.2);
        hg.addColorStop(0, C.skinLight); hg.addColorStop(1, C.skinDark);
        ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(hc.x, hc.y, r*0.86, r*1.06, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = C.skinDark; ctx.beginPath(); ctx.ellipse(hc.x - side*r*0.82, hc.y + r*0.08, r*0.12*Math.max(.35,Math.abs(side)+.3), r*0.21, 0, 0, Math.PI*2); ctx.fill();   // ear shows the head turn
        ctx.fillStyle = 'rgba(255,240,220,.35)'; ctx.beginPath(); ctx.ellipse(hc.x + side*r*0.38, hc.y + r*0.1, r*0.38*Math.max(.35,front), r*0.62, 0, 0, Math.PI*2); ctx.fill();   // lit side of the face
        const cg = ctx.createLinearGradient(hc.x - r, 0, hc.x + r, 0); cg.addColorStop(0, C.capShade); cg.addColorStop(.5, C.cap); cg.addColorStop(1, C.capShade);
        ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(hc.x + side*r*0.12, hc.y - r*0.5, r*0.88, r*0.62, 0, Math.PI, 0); ctx.lineTo(hc.x + r*0.88, hc.y - r*0.45); ctx.lineTo(hc.x - r*0.88, hc.y - r*0.45); ctx.fill();
      }});
      const arm = (sh, el, wr, F, side) => () => {
        limb(sh, el, 0.07, 0.058, C.robe, C.robeDark); limb(el, add(el, mul(F, 0.21)), 0.058, 0.05, C.robe, C.robeDark);
        limb(add(el, mul(F, 0.19)), wr, 0.034, 0.03, C.skin, C.skinDark);           // wrist
        hand(wr, F, pose.palm, side);
      };
      const zOf = p => proj(p).z;
      parts.push({ z:(zOf(elL)+zOf(wrL))/2 + 0.05, f:arm(shL, elL, wrL, pose.lF, -1) });
      parts.push({ z:(zOf(elR)+zOf(wrR))/2 + 0.07, f:arm(shR, elR, wrR, pose.rF, 1) });   // right hand drawn over the left
      parts.sort((a,b) => a.z - b.z).forEach(p => p.f());
      // motion cue: soft gold arrows beside the hands while they rise (does not cover the figure)
      if (cue && cue.until > ts){ const a = Math.min(1, (cue.until - ts)/400);
        [wrL, wrR].forEach((w,i) => { const p = proj(add(w, V(i ? -0.16 : 0.16, 0.02, 0))); ctx.globalAlpha = a*0.9; ctx.strokeStyle = C.gold; ctx.lineWidth = p.k*0.012; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(p.x, p.y + p.k*0.09); ctx.lineTo(p.x, p.y - p.k*0.03); ctx.moveTo(p.x - p.k*0.03, p.y); ctx.lineTo(p.x, p.y - p.k*0.035); ctx.lineTo(p.x + p.k*0.03, p.y); ctx.stroke(); ctx.globalAlpha = 1; }); }
    }
    function frame(ts){
      if (anim){ const t = Math.min(1, (ts - anim.t0) / anim.dur); pose = mix(anim.from, anim.to, ease(t));
        if (t >= 1){ const done = anim.done; anim = null; done && done(); } }
      draw(ts); raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    const api = {
      POSES:P, setSpeed(x){ speed = x || 1; },
      set(name){ pose = { ...P[name] }; anim = null; draw(); },
      to(name, dur=700){ if (name === 'raise') cue = { until: performance.now() + dur/speed + 300 }; return new Promise(res => { anim = { from:{...pose}, to:P[name], dur: dur/speed, t0:performance.now(), done:res }; }); },
      play(seq, onDone){ let cancelled = false, i = 0, timer = 0;
        const step = () => { if (cancelled) return; if (i >= seq.length){ onDone && onDone(); return; }
          const [name, ms, hold=0] = seq[i++]; api.to(name, ms * 1.25).then(() => { if (!cancelled) timer = setTimeout(step, hold / speed); }); };   // slower, calmer pace for beginners
        step(); return () => { cancelled = true; clearTimeout(timer); anim = null; }; },
      resize(){ const r = canvas.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio||1); canvas.width = Math.round(r.width*d); canvas.height = Math.round(r.height*d); draw(); },
      destroy(){ cancelAnimationFrame(raf); }, draw, get pose(){ return pose; }
    };
    draw(); return api;
  }
  SK.figure = { create, POSES:P };
})(window.SK);
