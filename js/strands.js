(function(){
'use strict';
var $ = function(s){return document.querySelector(s)};
var root = document.documentElement;
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var small = window.matchMedia('(max-width: 820px)').matches;
var clamp = function(x,a,b){return Math.max(a,Math.min(b,x))};
var lerp = function(a,b,t){return a+(b-a)*t};
var sstep = function(a,b,x){var t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
var ease = function(t){t=clamp(t,0,1);return 1-Math.pow(1-t,3)};

if(!reduce) root.classList.add('enhanced');

/* ---------- time of day: the page follows the salon's 7 am to 11 pm ---------- */
function hex(h){return [parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255]}
var SKY = [
  {b1:'#3A1830',b2:'#14080F',a:'#FFAFC0',c:'#FFD7A3'}, /* dawn */
  {b1:'#0E3347',b2:'#07131B',a:'#A9DDF7',c:'#EAE6FF'}, /* midday */
  {b1:'#43200F',b2:'#170A0A',a:'#FFB347',c:'#FF6F91'}, /* golden hour */
  {b1:'#1A1442',b2:'#08061A',a:'#8F7BFF',c:'#FF8FD0'}  /* night */
].map(function(k){return {b1:hex(k.b1),b2:hex(k.b2),a:hex(k.a),c:hex(k.c)}});
function mix3(a,b,t){return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]}
function css(c){return 'rgb('+Math.round(c[0]*255)+','+Math.round(c[1]*255)+','+Math.round(c[2]*255)+')'}
function sky(p){
  var f = clamp(p,0,1)*3, i = Math.min(2,Math.floor(f)), t = sstep(0,1,f-i);
  var A = SKY[i], B = SKY[i+1];
  return {b1:mix3(A.b1,B.b1,t),b2:mix3(A.b2,B.b2,t),a:mix3(A.a,B.a,t),c:mix3(A.c,B.c,t)};
}

/* ---------- WebGL: strands of hair-like light ---------- */
var canvas = $('#gl'), gl = null;
try{ gl = canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true}); }catch(e){}
if(!gl){ root.classList.add('no-gl'); }

var progS, progP, bufS, bufI, bufP, nIdx = 0, nPart = 0, locS = {}, locP = {};
function shader(type, src){
  var s = gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){ throw new Error(gl.getShaderInfoLog(s)); }
  return s;
}
function program(vs, fs){
  var p = gl.createProgram();
  gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){ throw new Error(gl.getProgramInfoLog(p)); }
  return p;
}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

if(gl){
try{
  progS = program(
  'attribute vec4 aSeed;uniform mat4 uVP;uniform float uTime,uTwist,uRing,uSpread,uReveal,uWave,uAlpha;'+
  'varying float vA,vMix;const float TAU=6.2831853;'+
  'vec3 spine(float u){'+
  '  vec3 line=vec3(sin(u*3.4+uTime*.18)*1.1,(.5-u)*13.,cos(u*2.6+uTime*.14)*1.1);'+
  '  float g=u*TAU+uTime*.05;'+
  '  vec3 circ=vec3(cos(g)*3.7,sin(g)*3.4,sin(g*2.+uTime*.2)*.9);'+
  '  return mix(line,circ,uRing);}'+
  'void main(){'+
  '  float u=aSeed.x,r1=aSeed.y,r2=aSeed.z,r3=aSeed.w;'+
  '  vec3 p=spine(u);'+
  '  float ph=r1*TAU+u*uTwist+uTime*.12*(r3-.5);'+
  '  float rad=(.12+.88*r2)*uSpread;'+
  '  vec3 off=vec3(cos(ph),sin(ph)*.85,sin(ph+u*2.))*rad;'+
  '  float wig=sin(u*11.+r3*TAU*3.+uTime*.45)*.22*uWave*(.3+r2);'+
  '  off+=vec3(wig,wig*.4,-wig);'+
  '  p+=off;'+
  '  float rv=smoothstep(0.,1.,uReveal*1.6-u*.6-r1*.25);'+
  '  gl_Position=uVP*vec4(p,1.);'+
  '  float shimmer=.55+.45*sin(u*28.+r1*40.+uTime*.8);'+
  '  float depth=clamp(1.6-gl_Position.w*.07,.25,1.);'+
  '  vA=(.07+.16*r2)*shimmer*rv*depth*uAlpha*(1.-smoothstep(.88,1.,u))*smoothstep(0.,.06,u);'+
  '  vMix=r3;}',
  'precision mediump float;uniform vec3 uA,uC;varying float vA,vMix;'+
  'void main(){vec3 c=mix(uA,uC,vMix);gl_FragColor=vec4(c*vA,vA);}'
  );
  progP = program(
  'attribute vec4 aP;uniform mat4 uVP;uniform float uTime,uPx,uAlpha;varying float vA;'+
  'void main(){'+
  '  vec3 p=aP.xyz*vec3(9.,7.,7.);'+
  '  p.y=mod(p.y+uTime*(.12+.2*aP.w)+7.,14.)-7.;'+
  '  p.x+=sin(uTime*.3+aP.w*20.)*.3;'+
  '  gl_Position=uVP*vec4(p,1.);'+
  '  gl_PointSize=uPx*(1.4+3.2*aP.w)*(9./gl_Position.w);'+
  '  vA=(.25+.5*aP.w)*uAlpha;}',
  'precision mediump float;uniform vec3 uC;varying float vA;'+
  'void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d)*vA;gl_FragColor=vec4(uC*a,a);}'
  );
  ['aSeed'].forEach(function(n){locS[n]=gl.getAttribLocation(progS,n)});
  ['uVP','uTime','uTwist','uRing','uSpread','uReveal','uWave','uAlpha','uA','uC'].forEach(function(n){locS[n]=gl.getUniformLocation(progS,n)});
  locP.aP = gl.getAttribLocation(progP,'aP');
  ['uVP','uTime','uPx','uAlpha','uC'].forEach(function(n){locP[n]=gl.getUniformLocation(progP,n)});

  var N = small ? 220 : 380, M = small ? 90 : 150, rand = rng(7);
  var verts = new Float32Array(N*M*4), idx = new Uint16Array(N*(M-1)*2), k = 0;
  for(var i=0;i<N;i++){
    var r1=rand(), r2=rand(), r3=rand();
    for(var j=0;j<M;j++){
      var b=(i*M+j)*4; verts[b]=j/(M-1); verts[b+1]=r1; verts[b+2]=r2; verts[b+3]=r3;
      if(j<M-1){ idx[k++]=i*M+j; idx[k++]=i*M+j+1; }
    }
  }
  nIdx = idx.length;
  bufS = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,bufS); gl.bufferData(gl.ARRAY_BUFFER,verts,gl.STATIC_DRAW);
  bufI = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,bufI); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);

  nPart = small ? 140 : 300;
  var pv = new Float32Array(nPart*4), rp = rng(99);
  for(var q=0;q<nPart;q++){ pv[q*4]=rp()*2-1; pv[q*4+1]=rp()*2-1; pv[q*4+2]=rp()*2-1; pv[q*4+3]=rp(); }
  bufP = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,bufP); gl.bufferData(gl.ARRAY_BUFFER,pv,gl.STATIC_DRAW);

  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0,0,0,0);
}catch(err){
  if(window.console) console.warn('WebGL disabled:', err.message);
  gl = null; root.classList.add('no-gl');
}
}

/* tiny matrix helpers (column-major) */
function persp(fovy,asp,n,f){var t=1/Math.tan(fovy/2),m=new Float32Array(16);m[0]=t/asp;m[5]=t;m[10]=(f+n)/(n-f);m[11]=-1;m[14]=2*f*n/(n-f);return m}
function look(e,c,u){
  var zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2],zl=Math.hypot(zx,zy,zz);zx/=zl;zy/=zl;zz/=zl;
  var xx=u[1]*zz-u[2]*zy,xy=u[2]*zx-u[0]*zz,xz=u[0]*zy-u[1]*zx,xl=Math.hypot(xx,xy,xz);xx/=xl;xy/=xl;xz/=xl;
  var yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
  return new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0, -(xx*e[0]+xy*e[1]+xz*e[2]),-(yx*e[0]+yy*e[1]+yz*e[2]),-(zx*e[0]+zy*e[1]+zz*e[2]),1]);
}
function mul(a,b){var o=new Float32Array(16);for(var c=0;c<4;c++)for(var r=0;r<4;r++){var s=0;for(var k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o}
function shiftX(m,s){m[0]+=s*m[3];m[4]+=s*m[7];m[8]+=s*m[11];m[12]+=s*m[15]}

var W = 0, H = 0, dpr = 1;
function resize(){
  small = window.matchMedia('(max-width: 820px)').matches;
  dpr = Math.min(window.devicePixelRatio||1, small ? 1.25 : 1.5);
  W = Math.floor(innerWidth*dpr); H = Math.floor(innerHeight*dpr);
  if(canvas.width!==W||canvas.height!==H){ canvas.width=W; canvas.height=H; }
  if(gl) gl.viewport(0,0,W,H);
}
window.addEventListener('resize', resize); resize();

/* ---------- elements ---------- */
var drum = $('#services'), voices = $('#reviews'), visit = $('#visit');
var cyl = $('#cyl'), items = [].slice.call(document.querySelectorAll('.cyl-item'));
var svcs = [].slice.call(document.querySelectorAll('.svc'));
var quotes = [].slice.call(document.querySelectorAll('.quote'));
var clockEl = $('#clockTime'), markEl = $('#mark'), hint = $('#hint');
var quicknav = document.querySelector('.quicknav');
var lastClock = '', lastActive = -1;

function prog(el,y){
  var top = el.offsetTop, h = el.offsetHeight - innerHeight;
  return h>0 ? clamp((y-top)/h,0,1) : 0;
}
function fmtClock(p){
  var hf = 7 + clamp(p,0,1)*16, h = Math.floor(hf), m = Math.min(59,Math.floor((hf-h)*60));
  var ap = h>=12 ? 'pm' : 'am', h12 = h%12===0 ? 12 : h%12;
  return h12+':'+(m<10?'0':'')+m+' '+ap;
}

function update(y, t, reveal){
  var vh = innerHeight, max = Math.max(1, document.documentElement.scrollHeight - vh);
  var p = clamp(y/max,0,1);
  var heroOut = clamp(y/(vh*.9),0,1);
  var enh = root.classList.contains('enhanced');
  var dQ = enh ? prog(drum,y) : 0, vQ = enh ? prog(voices,y) : 0;
  var endIn = clamp((y - (voices.offsetTop + voices.offsetHeight - vh*1.2))/(vh*.9),0,1);

  /* page colour and clock follow the day */
  var s = sky(p);
  root.style.setProperty('--bg1', css(s.b1)); root.style.setProperty('--bg2', css(s.b2));
  var c = fmtClock(p); if(c!==lastClock){ clockEl.textContent = c; lastClock = c; }
  markEl.classList.toggle('on', y > vh*.6);
  if(quicknav) quicknav.classList.toggle('on', y > vh*.6);
  hint.style.opacity = String(1 - clamp(y/(vh*.25),0,1));

  /* services drum */
  if(enh){
    var x = dQ*4, fl = Math.floor(x), fr = x-fl;
    var rot = (fl + sstep(.3,.7,fr))*72;
    cyl.style.transform = 'rotateX('+rot+'deg)';
    for(var i=0;i<items.length;i++){
      var a = i*72 - rot, o = Math.cos(a*Math.PI/180);
      items[i].style.opacity = o>0 ? String(Math.pow(o,2.2).toFixed(3)) : '0';
    }
    var act = clamp(Math.round(rot/72),0,4);
    if(act!==lastActive){ svcs.forEach(function(n,k){ n.classList.toggle('on',k===act); }); lastActive = act; }
    /* flying reviews */
    var n = quotes.length;
    quotes.forEach(function(q,k){
      var u = vQ*n - k, a1 = ease(u/.3), b1 = (k===n-1) ? 0 : ease((u-.7)/.3);
      var vis = (u>0 && u<1.0001) ? a1*(1-b1) : 0;
      var z = lerp(-1100,0,a1) + lerp(0,700,b1), ry = 22*(1-a1);
      q.style.opacity = String(vis.toFixed(3));
      q.style.transform = 'translate3d(0,0,'+z.toFixed(1)+'px) rotateY('+ry.toFixed(2)+'deg)';
      q.style.visibility = vis<=0.002 ? 'hidden' : 'visible';
    });
  }

  if(!gl) return;

  /* camera and strand shape, driven by scroll */
  var twist = 2 + 9*heroOut + 6*dQ;
  var spread = lerp(2.7,1.05,sstep(0,1,heroOut)) + 1.1*sstep(0,1,endIn);
  var ring = sstep(.62,1,dQ)*(1-sstep(.45,1,vQ));
  var wave = 1 - .7*heroOut + .5*endIn;
  var yaw = -.3 + 2.3*p, dist = lerp(11.5,9,heroOut) - 1.2*ring + 2.4*endIn;
  var pitch = .1 + .16*Math.sin(p*6.283);
  var eye = [Math.sin(yaw)*dist, pitch*dist*.6, Math.cos(yaw)*dist];
  var asp = innerWidth/innerHeight;
  var P = persp(small ? 1.0 : .82, asp, .1, 60);
  var V = look(eye,[0,0,0],[0,1,0]);
  var VP = mul(P,V);
  var sh = small ? 0 : (.30*(1-heroOut) + .2*sstep(0,.3,vQ)*(1-sstep(.7,1,vQ)) + .28*endIn);
  shiftX(VP, sh);

  var alpha = (small ? .62 : 1) * (1 - .22*sstep(0,1,dQ)*(1-sstep(.9,1,dQ)));

  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(progS);
  gl.bindBuffer(gl.ARRAY_BUFFER,bufS); gl.enableVertexAttribArray(locS.aSeed); gl.vertexAttribPointer(locS.aSeed,4,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,bufI);
  gl.uniformMatrix4fv(locS.uVP,false,VP);
  gl.uniform1f(locS.uTime,t); gl.uniform1f(locS.uTwist,twist); gl.uniform1f(locS.uRing,ring);
  gl.uniform1f(locS.uSpread,spread); gl.uniform1f(locS.uReveal,reveal); gl.uniform1f(locS.uWave,wave); gl.uniform1f(locS.uAlpha,alpha);
  gl.uniform3fv(locS.uA,s.a); gl.uniform3fv(locS.uC,s.c);
  gl.drawElements(gl.LINES,nIdx,gl.UNSIGNED_SHORT,0);

  gl.useProgram(progP);
  gl.bindBuffer(gl.ARRAY_BUFFER,bufP); gl.enableVertexAttribArray(locP.aP); gl.vertexAttribPointer(locP.aP,4,gl.FLOAT,false,0,0);
  gl.uniformMatrix4fv(locP.uVP,false,VP);
  gl.uniform1f(locP.uTime,t); gl.uniform1f(locP.uPx,dpr*(small?.8:1)); gl.uniform1f(locP.uAlpha,reveal);
  gl.uniform3fv(locP.uC,s.c);
  gl.drawArrays(gl.POINTS,0,nPart);
}

/* ---------- loop ---------- */
var t0 = performance.now(), last = t0, curY = window.scrollY;
function frame(now){
  var dt = Math.min(.05,(now-last)/1000); last = now;
  var k = reduce ? 1 : 1 - Math.exp(-dt*5.5);
  curY += (window.scrollY - curY)*k;
  if(Math.abs(window.scrollY-curY)<.05) curY = window.scrollY;
  var reveal = reduce ? 1 : ease((now-t0)/2800);
  update(curY, reduce ? 4 : (now-t0)/1000, reveal);
  requestAnimationFrame(frame);
}
if(reduce){
  var once = function(){ update(window.scrollY,4,1); };
  window.addEventListener('scroll', once, {passive:true}); window.addEventListener('resize', once); once();
}else{
  requestAnimationFrame(frame);
}
window.addEventListener('load', function(){ if(window.scrollY===0) curY = 0; });
})();
