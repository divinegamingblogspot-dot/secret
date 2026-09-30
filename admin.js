const PIA_SUPABASE_URL="https://qcudkyyrhmnpuazlodyx.supabase.co";
const PIA_SUPABASE_KEY="sb_publishable_F3J_f_9ebNPs6eY3dSaisA_r4LqLcmw";
const PIA_BUCKET="pia-media";
const SLOT_OPTIONS=[
  ["energy-soft","01 · Soft heart"],["energy-hot","01 · Hot energy"],["energy-sassy","01 · Sassy soul"],["energy-vibe","01 · Her own vibe"],
  ["memory-01","03 · Memory 01"],["memory-02","03 · Memory 02"],["memory-03","03 · Memory 03"],["memory-04","03 · Memory 04"],
  ["favourite-frame","04 · Featured"],["that-outfit","04 · The look"],["latest-mood","04 · The smile"],["that-face","04 · The day"],["the-detail","04 · The detail"],["the-laugh","04 · The laugh"],["after-dark","04 · After dark"],["memory","04 · Memory"],["everyday","04 · Everyday"],["just-pia","04 · Just Pia"],
  ["notes-confidence","05 · Confidence"],["notes-sassy","05 · Sassy girl"],["notes-own","05 · Own it"],["notes-attitude","05 · The attitude"],["notes-worth","05 · Know your worth"],["notes-all","05 · All of you"],
  ["attitude-main","06 · Main character"],["attitude-dark","06 · After dark"],["attitude-unapologetic","06 · Unapologetic"],
  ["flower-softness","07 · Softness"],["flower-joy","07 · Joy"],["flower-confidence","07 · Confidence"],["flower-rest","07 · Rest"],["flower-being-you","07 · Being you"]
];
const $=s=>document.querySelector(s);
const toastEl=$("#toast");
function toast(m){if(!toastEl)return;toastEl.textContent=m;toastEl.classList.add("show");clearTimeout(window.__t);window.__t=setTimeout(()=>toastEl.classList.remove("show"),7000)}
function supaError(error,label){if(!error)return "";console.error(label,error);return [label,error.message,error.code,error.details,error.hint].filter(Boolean).join(" · ")}
const configured=Boolean(PIA_SUPABASE_URL&&PIA_SUPABASE_KEY&&window.supabase);
const ACCESS_KEY="pia_photo_access_v1";
let photoAccess=localStorage.getItem(ACCESS_KEY)==="granted";
function updateAccessUI(){
 const state=$("#accessState"),allow=$("#allowAccess"),sync=$("#syncImages");
 if(!state)return;
 state.textContent=photoAccess?"CONNECTED":"NOT CONNECTED";
 state.className="access-state "+(photoAccess?"connected":"");
 if(allow)allow.textContent=photoAccess?"Photo access connected ✓":"Allow photo access ✦";
 if(sync)sync.disabled=!photoAccess;
}
function requirePhotoAccess(){
 if(!photoAccess){toast("Allow photo access and sync your photos first.");document.querySelector("#access")?.scrollIntoView({behavior:"smooth"});return false}
 return true;
}
const supa=configured?window.supabase.createClient(PIA_SUPABASE_URL,PIA_SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}}):null;
const gate=$("#loginGate"),app=$("#adminApp"),status=$("#loginStatus");
function setupRequired(){status.textContent="Admin backend is not connected yet. Add the Supabase project URL and publishable key in admin.js.";status.className="login-status error"}
function showApp(){gate.hidden=true;app.hidden=false;loadMedia()}
function showGate(){gate.hidden=false;app.hidden=true}
async function boot(){
 if(!configured){showGate();return setupRequired()}
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
const grid=$("#mediaGrid");
function slotOptions(selected=""){return '<option value="">Choose website block…</option>'+SLOT_OPTIONS.map(x=>'<option value="'+x[0]+'" '+(x[0]===selected?"selected":"")+'>'+x[1]+"</option>").join("")}
async function loadMedia(){
 if(!supa){toast("Supabase client is not loaded");return}
 const {data,error}=await supa.from("media").select("id,slot_key,title,storage_path,is_featured,is_published,created_at").order("created_at",{ascending:false});
 if(error){toast(supaError(error,"Media library error"));return}
 grid.innerHTML="";
 (data||[]).forEach(item=>{
  const url=supa.storage.from(PIA_BUCKET).getPublicUrl(item.storage_path).data.publicUrl;
  const card=document.createElement("article");card.className="media-card";
  card.innerHTML='<img alt=""><div class="media-meta"><strong></strong><span></span><div class="media-actions"><select class="slot-select">'+slotOptions(item.slot_key||"")+'</select><button class="publish">'+(item.is_published?"Published":"Publish")+'</button><button class="remove">Remove</button></div></div>';
  card.querySelector("img").src=url;card.querySelector("img").alt=item.title||"Pia photo";card.querySelector("strong").textContent=item.title||"Pia photo";card.querySelector("span").textContent=item.is_published?"Live on website":"Draft";
  card.querySelector(".slot-select").onchange=async ev=>{const {error}=await supa.from("media").update({slot_key:ev.target.value,updated_at:new Date().toISOString()}).eq("id",item.id);if(error)toast(supaError(error,"Block update error"));else toast("Website block updated ✦")};
  card.querySelector(".publish").onclick=async()=>{const next=!item.is_published;const {error}=await supa.from("media").update({is_published:next,updated_at:new Date().toISOString()}).eq("id",item.id);if(error)toast(error.message);else{toast(next?"Published to Pia's website ✦":"Unpublished");loadMedia()}};
  card.querySelector(".remove").onclick=async()=>{if(!confirm("Remove this image from Pia's website?"))return;const {error}=await supa.from("media").delete().eq("id",item.id);if(error)toast(error.message);else{await supa.storage.from(PIA_BUCKET).remove([item.storage_path]);toast("Image removed");loadMedia()}};
  grid.appendChild(card);
 });
 $("#mediaCount").textContent=data?.length||0;$("#publishedCount").textContent=(data||[]).filter(x=>x.is_published).length;$("#featuredCount").textContent=(data||[]).filter(x=>x.is_featured).length;
}
async function syncFiles(list){
 if(!photoAccess)return;
 const files=Array.from(list||[]).filter(Boolean);
 if(!files.length){toast("No photos selected.");return}
 toast(files.length+" photo"+(files.length>1?"s":"")+" selected — syncing…");
 const slot=$("#uploadSlot")?.value||"";
 const {data:{user},error:userError}=await supa.auth.getUser();
 if(userError||!user){toast(supaError(userError,"Login check failed")||"Please log in again");showGate();return}
 for(const file of files){
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
  const path=user.id+"/synced-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+ext;
  const up=await supa.storage.from(PIA_BUCKET).upload(path,file,{contentType:file.type||"image/jpeg",cacheControl:"31536000",upsert:false});
  if(up.error){toast(supaError(up.error,"Sync upload error"));continue}
  const ins=await supa.from("media").insert({owner_id:user.id,storage_path:path,slot_key:slot||null,title:file.name,is_published:false,is_featured:false});
  if(ins.error){await supa.storage.from(PIA_BUCKET).remove([path]);toast(supaError(ins.error,"Sync database error"));continue}
 }
 toast("Photos synced into Pia Studio ✦");
 loadMedia();
}
async function uploadFiles(list){
 if(!requirePhotoAccess())return;
 toast("Upload started — checking connection…");
 if(!supa)return;
 const slot=$("#uploadSlot")?.value||"";
 if(!slot){toast("Choose a website block first");return}
 toast("Checking your login…"); const {data:{user},error:userError}=await supa.auth.getUser(); if(userError||!user){toast(supaError(userError,"Login check failed")||"Please log in again");showGate();return} toast("Login OK — preparing upload…")
 const {data:sessionData}=await supa.auth.getSession();if(!sessionData?.session){toast("Session expired — please log in again");showGate();return}
 const files=[...list].filter(f=>{
  if(!f)return false;
  const type=String(f.type||"").toLowerCase(),name=String(f.name||"").toLowerCase();
  return type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(name);
}); if(!files.length){toast("No image file reached the uploader. Please choose the image again.");return} toast(files.length+" image"+(files.length>1?"s":"")+" received — starting upload…"); for(const file of files){
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
  const path=user.id+"/"+slot+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+ext;
  toast("Contacting Pia storage for "+file.name+"…"); let up; try{up=await Promise.race([supa.storage.from(PIA_BUCKET).upload(path,file,{contentType:file.type,cacheControl:"31536000",upsert:false}),new Promise(resolve=>setTimeout(()=>resolve({error:{message:"Storage request timed out after 20 seconds"}}),20000))]);}catch(e){up={error:{message:e?.message||String(e)}}}
  if(up.error){toast(supaError(up.error,"Storage upload error"));continue}
  toast("Image uploaded — saving it to the media library…"); const ins=await Promise.race([supa.from("media").insert({owner_id:user.id,storage_path:path,slot_key:slot,title:file.name,is_published:true,is_featured:false}),new Promise(resolve=>setTimeout(()=>resolve({error:{message:"Database request timed out after 20 seconds"}}),20000))]);
  if(ins.error){await supa.storage.from(PIA_BUCKET).remove([path]);toast(supaError(ins.error,"Database insert error"));continue}
  toast(file.name+" is live on Pia's website ✦");
 }
 loadMedia();
}
const allowAccess=$("#allowAccess");
const syncInput=$("#syncInput");
const syncImages=$("#syncImages");
allowAccess?.addEventListener("click",()=>{syncInput?.click()});
syncInput?.addEventListener("change",e=>{
 const files=Array.from(e.target.files||[]);
 if(!files.length){toast("No photos selected.");return}
 photoAccess=true;localStorage.setItem(ACCESS_KEY,"granted");updateAccessUI();
 syncFiles(files);e.target.value="";
});
syncImages?.addEventListener("click",()=>syncInput?.click());
const uploadInput=$("#uploadInput");
const dz=$("#dropzone");
const slotWrap=document.createElement("div");slotWrap.className="upload-slot-wrap";slotWrap.innerHTML='<label>Put uploaded image into<select id="uploadSlot">'+slotOptions()+'</select></label>';
dz.parentNode.insertBefore(slotWrap,dz);
uploadInput.onchange=e=>{if(!requirePhotoAccess())return;const files=Array.from(e.target.files||[]);if(!files.length){toast("No image selected.");return}uploadFiles(files);e.target.value=""};
["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("drag")}));
["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("drag")}));
dz.addEventListener("drop",e=>uploadFiles(e.dataTransfer.files));
$("#saveProfile").onclick=async()=>{
 if(!supa)return;
 const {data:{user}}=await supa.auth.getUser();if(!user)return;
 const payload={id:user.id,display_name:$("#displayName").value,instagram_url:$("#instagram").value,bio:$("#bio").value,hero_line:$("#heroLine").value,updated_at:new Date().toISOString()};
 const {error}=await supa.from("profiles").upsert(payload);
 toast(error?supaError(error,"Profile save error"):"Profile saved ✦");
};
const signout=document.createElement("button");signout.className="secondary";signout.textContent="Sign out";signout.onclick=()=>supa?.auth.signOut();$(".admin-top").appendChild(signout);
updateAccessUI();\nboot();
