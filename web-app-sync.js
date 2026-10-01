/* Niharika Studio dual-client bridge: website + Android use the same Supabase media rows.
   Additive helper; does not replace existing admin.js/public-site logic. */
(function(){
  window.NiharikaMediaBridge={
    version:"1.0.0",
    async published(supa,bucket){
      const {data,error}=await supa.from("media").select("id,slot_key,title,caption,media_type,storage_path,sort_order,is_featured").eq("is_published",true).order("sort_order",{ascending:true}).order("created_at",{ascending:false});
      if(error) throw error;
      return (data||[]).map(x=>({...x,url:supa.storage.from(bucket).getPublicUrl(x.storage_path).data.publicUrl}));
    },
    async syncManifest(supa,ownerId,items){
      if(!ownerId||!Array.isArray(items)) throw new Error("Invalid sync request");
      for(const item of items){
        await supa.from("media").upsert({owner_id:ownerId,storage_path:item.storage_path,slot_key:item.slot_key||"",title:item.title||"",caption:item.caption||"",media_type:item.media_type||"image",sort_order:item.sort_order||0,is_featured:!!item.is_featured,is_published:!!item.is_published,updated_at:new Date().toISOString()},{onConflict:"id"});
      }
    }
  };
})();