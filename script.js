const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const toast=m=>{const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),2600)};
const themes=["rose","velvet","champagne"];let ti=Number(localStorage.getItem("piaTheme")||0);if(!Number.isFinite(ti))ti=0;
function setTheme(n){ti=(n+themes.length)%themes.length;document.documentElement.dataset.theme=themes[ti];localStorage.setItem("piaTheme",ti);toast(themes[ti]+" mood ✦")}setTheme(ti);
window.addEventListener("load",()=>setTimeout(()=>$("#loader")?.classList.add("done"),1800));
window.addEventListener("pointermove",e=>{const c=$("#cursor");if(c){c.style.left=e.clientX+"px";c.style.top=e.clientY+"px"}});
window.addEventListener("scroll",()=>{const h=document.documentElement,p=Math.min(100,scrollY/(h.scrollHeight-innerHeight)*100);$(".progress").style.width=p+"%";$("#nav").classList.toggle("scrolled",scrollY>20)});
$("#themeBtn").onclick=()=>setTheme(ti+1);
$("#topBtn").onclick=()=>scrollTo({top:0,behavior:"smooth"});
$("#shareBtn").onclick=async()=>{try{if(navigator.share)await navigator.share({title:"Pia — Her World",text:"A little corner of the internet made for Pia.",url:location.href});else{await navigator.clipboard.writeText(location.href);toast("Page link copied ✦")}}catch(e){}};
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add("on")),{threshold:.1});$$(".reveal").forEach(x=>io.observe(x));
const appreciation=[
"You're beautiful, but the confidence behind it is what makes you magnetic.",
"That little bit of sass? Keep it. It suits you.",
"You don't have to compete with anyone. Your vibe is already your own.",
"Your smile can completely change the mood of a room.",
"You are allowed to look at yourself and think: yeah, I look good.",
"Soft, bold, dressed up, messy, playful — every version of you deserves love.",
"The outfit gets noticed. The personality is what makes it unforgettable.",
"You have that rare mix of sweetness and attitude that makes people remember you."
];
function showMessage(){const m=appreciation[Math.floor(Math.random()*appreciation.length)];$("#modalText").textContent=m;$("#modal").classList.add("open");$("#modal").setAttribute("aria-hidden","false")}
$("#complimentBtn").onclick=showMessage;$("#loveBtn").onclick=showMessage;
$$(".love-grid button").forEach(b=>b.onclick=()=>{toast(b.dataset.message);b.animate([{transform:"scale(1)"},{transform:"scale(.96)"},{transform:"scale(1)"}],{duration:260})});
$("#closeModal").onclick=()=>{$("#modal").classList.remove("open");$("#modal").setAttribute("aria-hidden","true")};
$("#modal").onclick=e=>{if(e.target===$("#modal"))$("#closeModal").click()};
const quotes=[
"She can be soft without being small, confident without apologising, and gorgeous without trying to prove it.",
"Pretty is the first impression. Her personality is the plot twist.",
"She doesn't need a spotlight. Somehow, she creates one.",
"A little sweetness, a little attitude, and a whole lot of her.",
"The best look is still the one where she feels completely herself.",
"She is allowed to take up space, look amazing, and enjoy every second of it."
];let qi=0;
$("#newQuote").onclick=()=>{qi=(qi+1)%quotes.length;const q=$("#quote");q.animate([{opacity:0,transform:"translateY(10px)"},{opacity:1,transform:"none"}],{duration:350});setTimeout(()=>q.textContent=quotes[qi],80)};
$$(".media").forEach(x=>x.onclick=()=>toast(x.dataset.name+" is ready for Pia's photo ✦"));
$("#moonBtn").onclick=()=>{document.body.classList.toggle("nightGlow");toast(document.body.classList.contains("nightGlow")?"Moonlight mode on ☾":"Moonlight mode off")};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#modal").classList.contains("open"))$("#closeModal").click();if(e.key.toLowerCase()==="t")setTheme(ti+1)});
