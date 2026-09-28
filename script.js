const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const toast=m=>{const t=$('.toast');t.textContent=m;t.classList.add('show');clearTimeout(window.tt);window.tt=setTimeout(()=>t.classList.remove('show'),2400)};
const themes=['cream','champagne','blush','pearl'],themeNames=['Cream mode','Champagne mode','Blush mode','Pearl mode'];
let themeIndex=Math.max(0,Math.min(3,Number(localStorage.getItem('piaTheme')||0)));
function setTheme(i,silent=false){themeIndex=(i+themes.length)%themes.length;document.documentElement.dataset.theme=themes[themeIndex];localStorage.setItem('piaTheme',themeIndex);if(!silent)toast(themeNames[themeIndex])}
setTheme(themeIndex,true);

window.addEventListener('load',()=>setTimeout(()=>$('#loader')?.classList.add('done'),1700));
const cursor=$('.cursor-glow');
window.addEventListener('pointermove',e=>{if(cursor){cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'}});
const sparkleBox=$('.sparkles');
function sparkle(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const s=document.createElement('i');s.className='sparkle';s.style.left=Math.random()*100+'%';s.style.bottom='-5px';s.style.animationDuration=(5+Math.random()*7)+'s';s.style.animationDelay=Math.random()*2+'s';s.style.opacity=.2+Math.random()*.6;sparkleBox.appendChild(s);setTimeout(()=>s.remove(),14000)}
setInterval(sparkle,650);

$('.theme')?.addEventListener('click',()=>setTheme(themeIndex+1));
window.addEventListener('scroll',()=>{
 const h=document.documentElement,p=Math.min(100,scrollY/(h.scrollHeight-innerHeight)*100);
 $('.progress').style.width=p+'%';$('#backTop').classList.toggle('show',scrollY>600);$('#top').classList.toggle('scrolled',scrollY>20);
});
$('#backTop').onclick=()=>scrollTo({top:0,behavior:'smooth'});

const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('on')}),{threshold:.1});
$$('.reveal').forEach(x=>io.observe(x));

const navLinks=$$('.nav-link'),sections=$$('main section[id]');
const navIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))}}),{rootMargin:'-35% 0px -55% 0px'});
sections.forEach(s=>navIO.observe(s));

const messages=[
'That smile belongs in a gallery.','Her confidence makes every frame feel intentional.',
'That outfit understood the assignment.','The camera clearly has a favourite.',
'Pretty face, memorable presence.','She makes effortless look beautifully put together.',
'One more photo? Absolutely.','That style deserves its own highlight.',
'The real flex is how naturally she carries it.','Some moments are impossible not to remember.',
'The glow is not exactly playing fair.','That look has absolutely no business being this good.'
];
$$('.fun').forEach((x,i)=>x.onclick=()=>{toast(messages[i%messages.length]);x.animate([{transform:'scale(1)'},{transform:'scale(.96)'},{transform:'scale(1)'}],{duration:280})});

function openModal(){const m=$('.modal');m.classList.add('open');m.setAttribute('aria-hidden','false');$('.modal h3').textContent=messages[Math.floor(Math.random()*messages.length)]}
$$('.surprise').forEach(b=>b.onclick=openModal);
$('.close').onclick=()=>{$('.modal').classList.remove('open');$('.modal').setAttribute('aria-hidden','true')};
$('.modal').onclick=e=>{if(e.target===$('.modal'))$('.close').click()};

const quotes=[
'Beautiful gets attention. Confidence keeps it. And somehow, she has both.',
'Some people enter a room. Some people change its atmosphere.',
'The best accessory is knowing exactly who you are.',
'Style gets noticed. Presence gets remembered.',
'There is a reason the camera keeps finding her.',
'Soft smile. Strong energy. Very unfair combination.'
];
let qi=0;$('#quoteRefresh').onclick=()=>{$('#quoteText').animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:350});qi=(qi+1)%quotes.length;setTimeout(()=>$('#quoteText').textContent=quotes[qi],80)};

$$('.media-slot').forEach(p=>p.onclick=()=>{$('#lightboxTitle').textContent=p.dataset.label||'Featured';$('#lightbox').classList.add('open');$('#lightbox').setAttribute('aria-hidden','false')});
function closeLight(){ $('#lightbox').classList.remove('open');$('#lightbox').setAttribute('aria-hidden','true') }
$('.lightbox-close').onclick=closeLight;$('#lightbox').onclick=e=>{if(e.target===$('#lightbox'))closeLight()};

$$('[data-tilt]').forEach(el=>{el.addEventListener('pointermove',e=>{if(innerWidth<800)return;const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.classList.add('tilt-active');el.style.transform='perspective(900px) rotateX('+(-y*5)+'deg) rotateY('+(x*5)+'deg) translateY(-2px)'});
el.addEventListener('pointerleave',()=>{el.classList.remove('tilt-active');el.style.transform=''})});

$$('.magnetic').forEach(el=>{el.addEventListener('pointermove',e=>{if(innerWidth<800)return;const r=el.getBoundingClientRect();el.style.transform='translate('+(e.clientX-(r.left+r.width/2))*.08+'px,'+(e.clientY-(r.top+r.height/2))*.08+'px)'});el.addEventListener('pointerleave',()=>el.style.transform='')});

async function sharePage(){
 const data={title:'Pia — Her Space',text:"Pia's personal visual space — her photos, moments, style and story.",url:location.href};
 try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(location.href);toast('Page link copied ✦')}}catch(e){}
}
$('#shareBtn').onclick=sharePage;
$('#copyBtn').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast('Page link copied ✦')}catch(e){toast('Copy the address from your browser')}};

document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if($('.modal').classList.contains('open'))$('.close').click();if($('#lightbox').classList.contains('open'))closeLight()}
 if(e.key.toLowerCase()==='t'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName))setTheme(themeIndex+1);
 if(e.key==='Home'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName))scrollTo({top:0,behavior:'smooth'});
});

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=5').catch(()=>{}));}

const fs=document.querySelector('#flowerScene'),bb=document.querySelector('#bloomBtn');if(fs){let drag=0,sx=0,sy=0,rx=-8,ry=-12;const paint=()=>fs.style.transform='rotateX('+rx+'deg) rotateY('+ry+'deg)';paint();fs.onpointerdown=e=>{drag=1;sx=e.clientX;sy=e.clientY;fs.classList.add('touched')};fs.onpointermove=e=>{if(!drag)return;ry=Math.max(-55,Math.min(55,ry+(e.clientX-sx)*.22));rx=Math.max(-32,Math.min(32,rx-(e.clientY-sy)*.18));sx=e.clientX;sy=e.clientY;paint()};fs.onpointerup=()=>drag=0;fs.onpointercancel=()=>drag=0;fs.onwheel=e=>{e.preventDefault();ry=Math.max(-55,Math.min(55,ry+e.deltaY*.08));paint()}}if(fs&&bb)bb.onclick=()=>{fs.classList.toggle('bloomed');toast(fs.classList.contains('bloomed')?'The garden is blooming ✦':'Bloom mode off')};
const ps=document.querySelector('#privateSetup');if(ps)ps.onclick=()=>toast('Private gallery needs a storage backend + two-person login to sync safely.');