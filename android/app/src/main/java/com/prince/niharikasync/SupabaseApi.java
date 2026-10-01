package com.prince.niharikasync;

import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

public final class SupabaseApi {
    public static final String URL = "https://qcudkyyrhmnpuazlodyx.supabase.co";
    public static final String KEY = "sb_publishable_F3J_f_9ebNPs6eY3dSaisA_r4LqLcmw";
    public static final String BUCKET = "niharika-media";

    public static final class Session {
        public final String accessToken, refreshToken, userId;
        Session(String a, String r, String u){ accessToken=a; refreshToken=r; userId=u; }
    }

    public static Session signIn(String email, String password) throws Exception {
        JSONObject body=new JSONObject();
        body.put("email",email); body.put("password",password);
        JSONObject o=requestJson("POST",URL+"/auth/v1/token?grant_type=password",null,body.toString(),"application/json");
        JSONObject u=o.optJSONObject("user");
        return new Session(o.getString("access_token"),o.optString("refresh_token",""),u==null?"":u.getString("id"));
    }

    public static String refresh(String refreshToken) throws Exception {
        JSONObject body=new JSONObject(); body.put("refresh_token",refreshToken);
        JSONObject o=requestJson("POST",URL+"/auth/v1/token?grant_type=refresh_token",null,body.toString(),"application/json");
        return o.getString("access_token");
    }

    public static void upload(String token,String path,String mime,InputStream in,long length)throws Exception{
        String ep=URL+"/storage/v1/object/"+BUCKET+"/"+path;
        HttpURLConnection c=(HttpURLConnection)new URL(ep).openConnection();
        c.setRequestMethod("POST"); c.setDoOutput(true); c.setFixedLengthStreamingMode(length);
        headers(c,token);
        c.setRequestProperty("Content-Type",mime==null?"image/jpeg":mime);
        c.setRequestProperty("x-upsert","false");
        try(OutputStream out=c.getOutputStream()){
            byte[] b=new byte[64*1024]; int n;
            while((n=in.read(b))!=-1) out.write(b,0,n);
        }
        int code=c.getResponseCode();
        String body=read(code>=200&&code<300?c.getInputStream():c.getErrorStream());
        c.disconnect();
        if(code<200||code>=300)throw new IOException("Storage HTTP "+code+": "+body);
    }

    public static void insertMedia(String token,String ownerId,String storagePath,String title,String slotKey)throws Exception{
        JSONObject row=new JSONObject();
        row.put("owner_id",ownerId);
        row.put("storage_path",storagePath);
        row.put("slot_key",slotKey==null?"":slotKey);
        row.put("title",title);
        row.put("media_type","image");
        row.put("is_published",false);
        row.put("is_featured",false);
        JSONArray rows=new JSONArray(); rows.put(row);
        requestJson("POST",URL+"/rest/v1/media",token,rows.toString(),"application/json");
    }

    public static boolean exists(String token,String storagePath)throws Exception{
        String q=URL+"/rest/v1/media?select=id&storage_path=eq."+URLEncoder.encode(storagePath,"UTF-8")+"&limit=1";
        HttpURLConnection c=(HttpURLConnection)new URL(q).openConnection();
        c.setRequestMethod("GET"); headers(c,token);
        int code=c.getResponseCode();
        String body=read(code>=200&&code<300?c.getInputStream():c.getErrorStream());
        c.disconnect();
        if(code<200||code>=300)throw new IOException("Database HTTP "+code+": "+body);
        return new JSONArray(body).length()>0;
    }

    static JSONObject requestJson(String method,String ep,String token,String body,String contentType)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(ep).openConnection();
        c.setRequestMethod(method);
        if(body!=null){
            c.setDoOutput(true); c.setRequestProperty("Content-Type",contentType);
            try(OutputStream o=c.getOutputStream()){o.write(body.getBytes(StandardCharsets.UTF_8));}
        }
        headers(c,token);
        int code=c.getResponseCode();
        String text=read(code>=200&&code<300?c.getInputStream():c.getErrorStream());
        c.disconnect();
        if(code<200||code>=300)throw new IOException("HTTP "+code+": "+text);
        return text.isEmpty()?new JSONObject():new JSONObject(text);
    }

    static void headers(HttpURLConnection c,String token){
        c.setRequestProperty("apikey",KEY);
        c.setRequestProperty("Authorization",token==null?"Bearer "+KEY:"Bearer "+token);
        c.setRequestProperty("Accept","application/json");
    }

    static String read(InputStream in)throws Exception{
        if(in==null)return "";
        try(BufferedReader b=new BufferedReader(new InputStreamReader(in,StandardCharsets.UTF_8))){
            StringBuilder s=new StringBuilder(); String x;
            while((x=b.readLine())!=null)s.append(x);
            return s.toString();
        }
    }

    static String friendly(Exception e){
        String s=e.getMessage()==null?"Unknown error":e.getMessage();
        return s.replace("HTTP 400:","Request rejected:").replace("HTTP 401:","Session expired:").replace("HTTP 403:","Permission denied:");
    }
}
