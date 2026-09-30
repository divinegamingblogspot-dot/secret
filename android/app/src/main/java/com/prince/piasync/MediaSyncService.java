package com.prince.piasync;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.*;
import android.provider.MediaStore;
import java.io.*;
import java.util.*;

public class MediaSyncService extends Service {
    public static final String ACTION_SYNC="SYNC_ALL";
    public static volatile boolean isRunning=false;
    static final int NOTIFY=9911;
    NotificationManager nm;
    SharedPreferences prefs;

    @Override public void onCreate(){
        super.onCreate(); prefs=getSharedPreferences(MainActivity.PREFS,MODE_PRIVATE); createChannel();
    }

    @Override public int onStartCommand(Intent intent,int flags,int startId){
        if(intent==null || !ACTION_SYNC.equals(intent.getAction()) || isRunning)return START_NOT_STICKY;
        if(Build.VERSION.SDK_INT>=26)startForeground(NOTIFY,notification("Preparing Pia photo sync…"));
        isRunning=true;
        new Thread(this::syncAll).start();
        return START_NOT_STICKY;
    }

    void syncAll(){
        String token=prefs.getString("access_token",""), refresh=prefs.getString("refresh_token","");
        String uid=prefs.getString("user_id","");
        int scanned=0,uploaded=0,skipped=0,failed=0;
        try{
            if(token.isEmpty()||uid.isEmpty())throw new IOException("Please sign in again.");
            if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.READ_MEDIA_IMAGES)!=PackageManager.PERMISSION_GRANTED)
                throw new IOException("Full photo access is required.");
            Uri base=MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
            String[] p={MediaStore.Images.Media._ID,MediaStore.Images.Media.DISPLAY_NAME,MediaStore.Images.Media.MIME_TYPE,MediaStore.Images.Media.SIZE,MediaStore.Images.Media.DATE_MODIFIED};
            Cursor c=getContentResolver().query(base,p,null,null,MediaStore.Images.Media.DATE_MODIFIED+" DESC");
            if(c==null)throw new IOException("Phone gallery could not be read.");
            int total=c.getCount(), index=0;
            while(c.moveToNext()){
                index++; scanned++;
                update("Scanning "+index+" / "+total+" · uploaded "+uploaded+" · skipped "+skipped+" · failed "+failed);
                long id=c.getLong(0);
                String name=c.getString(1); if(name==null||name.isEmpty())name="photo-"+id+".jpg";
                String mime=c.getString(2); if(mime==null||!mime.startsWith("image/"))mime="image/jpeg";
                long size=c.getLong(3);
                String path=uid+"/phone/"+id+"-"+safeName(name);
                try{
                    if(SupabaseApi.exists(token,path)){skipped++;continue;}
                    Uri u=Uri.withAppendedPath(base,Long.toString(id));
                    InputStream in=getContentResolver().openInputStream(u);
                    if(in==null)throw new IOException("Cannot open image.");
                    try{
                        SupabaseApi.upload(token,path,mime,in,size);
                    }catch(Exception first){
                        if(refresh!=null&&!refresh.isEmpty() && first.getMessage()!=null && first.getMessage().contains("401")){
                            token=SupabaseApi.refresh(refresh);
                            prefs.edit().putString("access_token",token).apply();
                            InputStream retry=getContentResolver().openInputStream(u);
                            if(retry==null)throw first;
                            try{SupabaseApi.upload(token,path,mime,retry,size);}finally{retry.close();}
                        }else throw first;
                    }finally{in.close();}
                    try{
                        SupabaseApi.insertMedia(token,uid,path,name,prefs.getString("selected_slot",""));
                        uploaded++;
                    }catch(Exception db){
                        // Storage is left in place only when DB insertion failed after upload;
                        // the admin can safely see it only after a media row exists.
                        failed++;
                        update("Database record failed for "+name+" · "+db.getMessage());
                    }
                }catch(Exception ex){
                    failed++;
                    update("Skipped "+name+" · "+SupabaseApi.friendly(ex));
                }
            }
            c.close();
            update("Finished ✓ · scanned "+scanned+" · uploaded "+uploaded+" · already synced "+skipped+" · failed "+failed);
        }catch(Exception ex){update("Sync stopped: "+SupabaseApi.friendly(ex));}
        finally{isRunning=false;stopForeground(true);stopSelf();}
    }

    void update(String s){
        if(nm!=null)nm.notify(NOTIFY,notification(s));
        sendBroadcast(new Intent("com.prince.piasync.PROGRESS").putExtra("text",s));
    }

    Notification notification(String s){
        return new Notification.Builder(this,"pia_sync")
                .setContentTitle("Pia Sync").setContentText(s)
                .setSmallIcon(android.R.drawable.stat_sys_upload).setOngoing(isRunning).build();
    }

    void createChannel(){
        if(Build.VERSION.SDK_INT>=26){
            nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
            nm.createNotificationChannel(new NotificationChannel("pia_sync","Pia photo sync",NotificationManager.IMPORTANCE_LOW));
        }
    }

    static String extension(String n,String mime){
        int i=n.lastIndexOf('.'); if(i>=0)return n.substring(i).toLowerCase();
        if(mime.contains("png"))return ".png"; if(mime.contains("webp"))return ".webp"; return ".jpg";
    }
    static String safeName(String n){return n.replaceAll("[^A-Za-z0-9._-]","_");}
    @Override public IBinder onBind(Intent i){return null;}
}
