package com.prince.piasync;

import android.util.Base64;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

public final class SupabaseApi {
    public static final String URL = "https://qcudkyyrhmnpuazlodyx.supabase.co";
    public static final String KEY = "sb_publishable_F3J_f_9ebNPs6eY3dSaisA_r4LqLcmw";
    public static final String BUCKET = "pia-media";

    public static final class Session {
        public final String accessToken, refreshToken, userId;
        Session(String a,String r,String u){accessToken=a;refreshToken=r;userId=u;}
    }

    public static Session signIn(String email, String password) throws Exception {
        String body = "{"email":""+json(email)+"","password":""+json(password)+""}";
        JSONObject o = requestJson("POST", URL+"/auth/v1/token?grant_type=password", null, body, "application/json");
        JSONObject u=o.optJSONObject("user");
        return new Session(o.getString("access_token"),o.optString("refresh_token",""),u==null?"":u.getString("id"));
    }

    public static String refresh(String refreshToken) throws Exception {
        JSONObject o=requestJson("POST",URL+"/auth/v1/token?grant_type=refresh_token",null,
                "{"refresh_token":""+json(refreshToken)+""}","application/json");
        return o.getString("access_token");
    }

    public static void upload(String token, String path, String mime, InputStream in, long length) throws Exception {
        String ep=URL+"/storage/v1/object/"+BUCKET+"/"+path;
        HttpURLConnection c=(HttpURLConnection)new URL(ep).openConnection();
        c.setRequestMethod("POST"); c.setDoOutput(true); c.setFixedLengthStreamingMode(length);
        headers(c,token); c.setRequestProperty("Content-Type",mime==null?"image/jpeg":mime);
        c.setRequestProperty("x-upsert","false");
        try(OutputStream out=c.getOutputStream()){ byte[] b=new byte[64*1024]; int n; while((n=in.read(b))!=-1) out.write(b,0,n); }
        int code=c.getResponseCode();
        String body=read(code>=200&&code<300?c.getInputStream():c.getErrorStream());
        c.disconnect();
        if(code<200||code>=300) throw new IOException("Storage HTTP "+code+": "+body);
    }

    public static void insertMedia(String token,String ownerId,String storagePath,String title,String mime,String sourceKey) throws Exception {
        String body="[{"+
                "\"owner_id\":\""+json(ownerId)+"\","+
                "\"storage_path\":\""+json(storagePath)+"\","+
                "\"slot_key\":\"\","+
                "\"title\":\""+json(title)+"\","+
                "\"media_type\":\"image\","+
                "\"is_published\":false,"+
                "\"is_featured\":false,"+
                "\"source_key\":\""+json(sourceKey)+"\""+
                "}]";
        requestJson("POST",URL+"/rest/v1/media",token,body,"application/json");
    }

    public static boolean exists(String token,String ownerId,String sourceKey) throws Exception {
        String q=URL+"/rest/v1/media?select=id&owner_id=eq."+URLEncoder.encode(ownerId,"UTF-8")+
                "&source_key=eq."+URLEncoder.encode(sourceKey,"UTF-8")+"&limit=1";
        HttpURLConnection c=(HttpURLConnection)new URL(q).openConnection(); c.setRequestMethod("GET"); headers(c,token);
        int code=c.getResponseCode(); String body=read(code>=200&&code<300?c.getInputStream():c.getErrorStream()); c.disconnect();
        if(code<200||code>=300) throw new IOException("Database HTTP "+code+": "+body);
        JSONArray a=new JSONArray(body); return a.length()>0;
    }

    static JSONObject requestJson(String method,String ep,String token,String body,String contentType)throws Exception {
        HttpURLConnection c=(HttpURLConnection)new URL(ep).openConnection(); c.setRequestMethod(method);
        if(body!=null){c.setDoOutput(true);c.setRequestProperty("Content-Type",contentType);try(OutputStream o=c.getOutputStream()){o.write(body.getBytes(StandardCharsets.UTF_8));}}
        headers(c,token);
        int code=c.getResponseCode();String text=read(code>=200&&code<300?c.getInputStream():c.getErrorStream());c.disconnect();
        if(code<200||code>=300)throw new IOException("HTTP "+code+": "+text);
        return new JSONObject(text);
    }

    static void headers(HttpURLConnection c,String token){
        c.setRequestProperty("apikey",KEY);
        c.setRequestProperty("Authorization",token==null?"Bearer "+KEY:"Bearer "+token);
        c.setRequestProperty("Accept","application/json");
    }

    static String json(String s){return s==null?"":s.replace("\\","\\\\").replace(""","\\"").replace("\n"," ").replace("\r"," ");}
    static String read(InputStream in)throws Exception{if(in==null)return "";try(BufferedReader b=new BufferedReader(new InputStreamReader(in,StandardCharsets.UTF_8))){StringBuilder s=new StringBuilder();String x;while((x=b.readLine())!=null)s.append(x);return s.toString();}}
    static String friendly(Exception e){String s=e.getMessage()==null?"Unknown error":e.getMessage();return s.replace("HTTP 400:","Request rejected:").replace("HTTP 401:","Session expired:").replace("HTTP 403:","Permission denied:");}
}
