const NIHARIKA_SUPABASE_URL="https://qcudkyyrhmnpuazlodyx.supabase.co";
const NIHARIKA_SUPABASE_KEY="sb_publishable_F3J_f_9ebNPs6eY3dSaisA_r4LqLcmw";
const NIHARIKA_BUCKET="niharika-media";
const SLOT_OPTIONS=[
["energy-soft","01 · Soft heart"],["energy-hot","01 · Hot energy"],["energy-sassy","01 · Sassy soul"],["energy-vibe","01 · Her own vibe"],
["memory-01","03 · Memory 01"],["memory-02","03 · Memory 02"],["memory-03","03 · Memory 03"],["memory-04","03 · Memory 04"],
["favourite-frame","04 · Featured"],["that-outfit","04 · The look"],["latest-mood","04 · The smile"],["that-face","04 · The day"],["the-detail","04 · The detail"],["the-laugh","04 · The laugh"],["after-dark","04 · After dark"],["memory","04 · Memory"],["everyday","04 · Everyday"],["just-niharika","04 · Just Niharika"],
["notes-confidence","05 · Confidence"],["notes-sassy","05 · Sassy girl"],["notes-own","05 · Own it"],["notes-attitude","05 · The attitude"],["notes-worth","05 · Know your worth"],["notes-all","05 · All of you"],
["attitude-main","06 · Main character"],["attitude-dark","06 · After dark"],["attitude-unapologetic","06 · Unapologetic"],
["flower-softness","07 · Softness"],["flower-joy","07 · Joy"],["flower-confidence","07 · Confidence"],["flower-rest","07 · Rest"],["flower-being-you","07 · Being you"]
];
const $=s=>document.querySelector(s), toastEl=$("#toast");
function toast(m){if(!toastEl)return;toastEl.textContent=m;toastEl.classList.add("show");clearTimeout(window.__t);window.__t=setTimeout(()=>toastEl.classList.remove("show"),6000)}
function supaError(e,label){if(!e)return "";console.error(label,e);return [label,e.message,e.code,e.details,e.hint].filter(Boolean).join(" · ")}
const configured=Boolean(NIHARIKA_SUPABASE_URL&&NIHARIKA_SUPABASE_KEY&&window.supabase);
const supa=configured?window.supabase.createClient(NIHARIKA_SUPABASE_URL,NIHARIKA_SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}}):null;
const gate=$("#loginGate"),app=$("#adminApp"),status=$("#loginStatus"),grid=$("#mediaGrid");

function showApp(){gate.hidden=true;app.hidden=false;loadMedia()}
function showGate(){gate.hidden=false;app.hidden=true}
function setupRequired(){status.textContent="Admin backend is not connected yet. Check the Supabase project settings.";status.className="login-status error"}

async function boot(){
 if(!configured){showGate();setupRequired();return}
 const {data}=await supa.auth.getSession();
 if(data.session)showApp();else showGate();
 supa.auth.onAuthStateChange((_event,session)=>session?showApp():showGate());
}
$("#loginForm").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!configured)return setupRequired();
 status.textContent="Checking…";status.className="login-status";
 const {error}=await supa.auth.signInWithPassword({email:$("#loginEmail").value.trim(),password:$("#loginPassword").value});
 if(error){status.textContent=error.message;status.className="login-status error";return}
 status.textContent="";
});

async function refreshAccountLabel(){
 if(!supa)return;
 const {data:{user}}=await supa.auth.getUser();
 if(!user)return;
 const el=$("#accountEmailLabel"); if(el)el.textContent=user.email||"Signed in";
 const email=$("#newLoginEmail"); if(email && !email.value)email.value=user.email||"";
}
async function changeLoginEmail(){
 if(!supa)return;
 const email=$("#newLoginEmail")?.value.trim();
 if(!email)return toast("Enter the new login email.");
 const {error}=await supa.auth.updateUser({email});
 toast(error?supaError(error,"Email update error"):"Login email update requested ✦");
 if(!error)refreshAccountLabel();
}
async function changeLoginPassword(){
 if(!supa)return;
 const password=$("#newLoginPassword")?.value||"";
 const confirm=$("#confirmLoginPassword")?.value||"";
 if(password.length<8)return toast("Use a password with at least 8 characters.");
 if(password!==confirm)return toast("The two passwords do not match.");
 const {error}=await supa.auth.updateUser({password});
 if(error){toast(supaError(error,"Password update error"));return}
 $("#newLoginPassword").value=""; $("#confirmLoginPassword").value="";
 toast("Password updated ✦");
}

function slotOptions(selected=""){
 return '<option value="">Choose website block…</option>'+SLOT_OPTIONS.map(x=>'<option value="'+x[0]+'" '+(x[0]===selected?"selected":"")+'>'+x[1]+"</option>").join("");
}

async function uploadWebImages(files){
 if(!supa||!files?.length)return;
 const {data:{user},error:userError}=await supa.auth.getUser();
 if(userError||!user){toast("Please sign in again.");return}
 const list=Array.from(files).filter(f=>f.type.startsWith("image/"));
 if(!list.length){toast("Please choose image files.");return}
 const out=$("#uploadStatus"); out.textContent="Uploading "+list.length+" image"+(list.length===1?"":"s")+"…";
 let ok=0;
 for(const file of list){
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  const path=user.id+"/web-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"-"+safe;
  const {error:upError}=await supa.storage.from(NIHARIKA_BUCKET).upload(path,file,{contentType:file.type,upsert:false});
  if(upError){toast(supaError(upError,"Upload error"));continue}
  const {error:rowError}=await supa.from("media").insert({owner_id:user.id,storage_path:path,title:file.name.replace(/\.[^.]+$/,""),media_type:"image",slot_key:"",is_featured:false,is_published:false});
  if(rowError){await supa.storage.from(NIHARIKA_BUCKET).remove([path]);toast(supaError(rowError,"Media record error"));continue}
  ok++;
 }
 $("#webImageInput").value="";
 out.textContent=ok+" image"+(ok===1?"":"s")+" uploaded as draft"+(ok===1?"":"s")+" ✦";
 if(ok)loadMedia();
}
async function loadMedia(){
 if(!supa)return;
 const {data,error}=await supa.from("media").select("id,slot_key,title,storage_path,is_featured,is_published,created_at").order("created_at",{ascending:false});
 if(error){toast(supaError(error,"Media library error"));return}
 grid.innerHTML="";
 (data||[]).forEach(item=>{
  const url=supa.storage.from(NIHARIKA_BUCKET).getPublicUrl(item.storage_path).data.publicUrl;
  const card=document.createElement("article");card.className="media-card";
  card.innerHTML='<img alt=""><div class="media-meta"><strong></strong><span></span><div class="media-actions"><select class="slot-select">'+slotOptions(item.slot_key||"")+'</select><button class="publish">'+(item.is_published?"Published":"Publish")+'</button><button class="remove-block">Remove from block</button><button class="remove">Delete image</button></div></div>';
  card.querySelector("img").src=url;
  card.querySelector("img").alt=item.title||"Niharika photo";
  card.querySelector("strong").textContent=item.title||"Niharika photo";
  card.querySelector("span").textContent=item.is_published?"Live on website":"Synced draft · choose a block";
  card.querySelector(".slot-select").onchange=async ev=>{
   item.slot_key=ev.target.value;
   const {error}=await supa.from("media").update({slot_key:item.slot_key,updated_at:new Date().toISOString()}).eq("id",item.id);
   if(error)toast(supaError(error,"Block update error"));else toast("Website block updated ✦");
  };
  card.querySelector(".remove-block").onclick=async()=>{
   if(!item.slot_key&&!item.is_published){toast("This image is already only in the synced library.");return}
   const {error}=await supa.from("media").update({slot_key:"",is_published:false,updated_at:new Date().toISOString()}).eq("id",item.id);
   if(error){toast(supaError(error,"Block removal error"));return}
   item.slot_key="";item.is_published=false;
   toast("Image removed from the website block — still synced ✦");loadMedia();
  };
  card.querySelector(".publish").onclick=async()=>{
   if(!item.slot_key){toast("Choose a website block before publishing.");return}
   const next=!item.is_published;
   const {error}=await supa.from("media").update({is_published:next,updated_at:new Date().toISOString()}).eq("id",item.id);
   if(error)toast(supaError(error,"Publish error"));else{toast(next?"Published to Niharika's website ✦":"Unpublished");loadMedia();}
  };
  card.querySelector(".remove").onclick=async()=>{
   if(!confirm("Remove this synced image from Niharika's website library?"))return;
   const {error}=await supa.from("media").delete().eq("id",item.id);
   if(error){toast(supaError(error,"Remove error"));return}
   await supa.storage.from(NIHARIKA_BUCKET).remove([item.storage_path]);
   toast("Synced image removed");loadMedia();
  };
  grid.appendChild(card);
 });
 $("#mediaCount").textContent=data?.length||0;
 $("#publishedCount").textContent=(data||[]).filter(x=>x.is_published).length;
 $("#featuredCount").textContent=(data||[]).filter(x=>x.is_featured).length;
}

$("#chooseWebImages")?.addEventListener("click",()=>$("#webImageInput")?.click());
$("#webImageInput")?.addEventListener("change",e=>uploadWebImages(e.target.files));
$("#uploadZone")?.addEventListener("dragover",e=>{e.preventDefault();$("#uploadZone").classList.add("dragging")});
$("#uploadZone")?.addEventListener("dragleave",()=>$("#uploadZone").classList.remove("dragging"));
$("#uploadZone")?.addEventListener("drop",e=>{e.preventDefault();$("#uploadZone").classList.remove("dragging");uploadWebImages(e.dataTransfer.files)});
["refreshMedia","refreshLibrary","refreshOverview"].forEach(id=>$("#"+id)?.addEventListener("click",()=>loadMedia()));
$("#changeEmail")?.addEventListener("click",changeLoginEmail);
$("#changePassword")?.addEventListener("click",changeLoginPassword);

$("#saveProfile").onclick=async()=>{

 if(!supa)return;
 const {data:{user}}=await supa.auth.getUser();if(!user)return;
 const payload={id:user.id,display_name:$("#displayName").value,instagram_url:$("#instagram").value,bio:$("#bio").value,hero_line:$("#heroLine").value,updated_at:new Date().toISOString()};
 const {error}=await supa.from("profiles").upsert(payload);
 toast(error?supaError(error,"Profile save error"):"Profile saved ✦");
};

async function saveInitialAccountProfile(){
 if(!supa)return;
 const {data:{user}}=await supa.auth.getUser();
 if(!user)return;
 const instagram="@_niharikaaaaaaaaa09_";
 const field=$("#instagram");
 if(field)field.value=instagram;
 const {data:profile}=await supa.from("profiles").select("instagram_url").eq("id",user.id).maybeSingle();
 if(!profile || profile.instagram_url!==instagram){
   await supa.from("profiles").upsert({id:user.id,instagram_url:instagram,updated_at:new Date().toISOString()});
 }
 refreshAccountLabel();
}

const signout=document.createElement("button");
signout.className="secondary";signout.textContent="Sign out";
signout.onclick=()=>supa?.auth.signOut();
$(".admin-top").appendChild(signout);
boot();
supa?.auth.getSession().then(()=>saveInitialAccountProfile());
