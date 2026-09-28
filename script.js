const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const toast=(m)=>{const t=$('.toast');t.textContent=m;t.classList.add('show');clearTimeout(window.tt);window.tt=setTimeout(()=>t.classList.remove('show'),2200)};
const themes=['','rose','lavender','cream'];let themeIndex=Number(localStorage.getItem('piaTheme')||0);
function setTheme(i){themeIndex=(i+themes.length)%themes.length;document.documentElement.dataset.theme=themes[themeIndex];localStorage.setItem('piaTheme',themeIndex);toast(['Midnight mode','Rose mode','Lavender mode','Cream mode'][themeIndex])}
setTheme(themeIndex);
$('.theme').onclick=()=>setTheme(themeIndex+1);
window.addEventListener('scroll',()=>{const h=document.documentElement, p=scrollY/(h.scrollHeight-innerHeight)*100;$('.progress').style.width=p+'%'});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('on')}),{threshold:.1});$$('.reveal').forEach(x=>io.observe(x));
$$('[data-scroll]').forEach(b=>b.onclick=()=>document.querySelector(b.dataset.scroll).scrollIntoView({behavior:'smooth'}));
const messages=[
'Okay, the smile is doing a lot of work here.',
'Confidence looks suspiciously good on her.',
'That outfit understood the assignment.',
'The camera clearly has a favourite.',
'Pretty face, dangerous levels of presence.',
'She somehow makes “effortless” look expensive.',
'One more photo? Absolutely.',
'Respectfully: that silhouette is unfair.',
'The real flex is how naturally she carries it.',
'Yeah… we get why people look twice.'
];
$$('.fun').forEach((x,i)=>x.onclick=()=>{toast(messages[i%messages.length]);x.animate([{transform:'scale(1)'},{transform:'scale(.96)'},{transform:'scale(1)'}],{duration:280})});
$('.surprise').onclick=()=>{$('.modal').classList.add('open');$('.modal h3').textContent=messages[Math.floor(Math.random()*messages.length)]};
$('.close').onclick=()=>$('.modal').classList.remove('open');$('.modal').onclick=e=>{if(e.target===$('.modal'))$('.modal').classList.remove('open')};
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('.modal').classList.remove('open')});
$$('.photo').forEach((p,i)=>p.addEventListener('click',()=>{if(!p.classList.contains('ready'))toast('Add a photo or reel she wants featured here.')}));
// Keyboard-friendly theme shortcuts
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='t'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName))setTheme(themeIndex+1)});
