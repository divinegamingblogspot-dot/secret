package com.prince.niharikasync;

import android.Manifest;
import android.app.Activity;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.*;
import android.view.*;
import android.widget.*;
import java.util.*;

public class MainActivity extends Activity {
    static final int REQ_MEDIA = 701;
    static final String PREFS = "niharika_sync";
    LinearLayout root;
    EditText email, password;
    Button login, permission, sync; Spinner block;
    TextView status, progress;
    android.content.SharedPreferences prefs;

    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        build();
        refreshState();
    }

    TextView text(String s, int size) {
        TextView t = new TextView(this);
        t.setText(s); t.setTextSize(size); t.setTextColor(Color.WHITE);
        t.setPadding(dp(4), dp(6), dp(4), dp(6));
        return t;
    }

    Button btn(String s) {
        Button b = new Button(this);
        b.setText(s); b.setAllCaps(false); b.setTextSize(13);
        b.setMinHeight(0); b.setMinimumHeight(0);
        b.setPadding(dp(12), dp(10), dp(12), dp(10));
        return b;
    }

    void build() {
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(22), dp(34), dp(22), dp(22));
        root.setBackgroundColor(Color.rgb(9,7,11));

        TextView title = text("Niharika Sync", 30);
        title.setTypeface(null, 1);
        root.addView(title);
        TextView sub = text("Sync Niharika's phone gallery into the private Niharika Studio.", 14);
        sub.setTextColor(Color.LTGRAY);
        root.addView(sub);

        email = new EditText(this); email.setHint("Niharika email"); email.setSingleLine(true);
        password = new EditText(this); password.setHint("Password"); password.setSingleLine(true);
        password.setInputType(0x81);
        root.addView(email, lp());
        root.addView(password, lp());

        login = btn("Sign in to Niharika Studio");
        root.addView(login, lp());
        login.setOnClickListener(v -> signIn());

        permission = btn("Allow access to all photos");
        root.addView(permission, lp());
        permission.setOnClickListener(v -> requestMedia());

        sync = btn("Sync all photos");
        root.addView(sync, lp());
        block = new Spinner(this);
        ArrayAdapter<String> ba = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, blockLabels());
        ba.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        block.setAdapter(ba);
        root.addView(block, lp());
        sync.setOnClickListener(v -> startSync());

        progress = text("", 13);
        progress.setTextColor(Color.LTGRAY);
        root.addView(progress);

        status = text("", 12);
        status.setTextColor(Color.rgb(220,170,195));
        root.addView(status);

        TextView note = text("First sync uploads the photos currently on the phone. Later syncs skip photos already synced. Nothing is published automatically.", 11);
        note.setTextColor(Color.GRAY);
        root.addView(note);

        setContentView(root);
    }

    LinearLayout.LayoutParams lp() {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, -2);
        p.setMargins(0, dp(8), 0, 0); return p;
    }

    void refreshState() {
        boolean logged = prefs.getString("access_token", "").length() > 10;
        boolean access = hasFullImageAccess();
        login.setEnabled(!logged);
        email.setEnabled(!logged); password.setEnabled(!logged);
        permission.setEnabled(logged && !access);
        sync.setEnabled(logged && access && !MediaSyncService.isRunning);
        permission.setText(access ? "Photo access granted ✓" : "Allow access to all photos");
        if (logged) {
            status.setText(access ? "Ready — the phone gallery is available." : "Sign in, then allow full photo access.");
        } else status.setText("Sign in with the same Niharika Supabase account used by the website.");
    }

    void signIn() {
        String e=email.getText().toString().trim(), p=password.getText().toString();
        if(e.isEmpty() || p.isEmpty()){ status.setText("Enter the Niharika email and password."); return; }
        login.setEnabled(false); status.setText("Signing in…");
        new Thread(() -> {
            try {
                SupabaseApi.Session s = SupabaseApi.signIn(e,p);
                prefs.edit().putString("access_token",s.accessToken).putString("refresh_token",s.refreshToken).putString("user_id",s.userId).apply();
                runOnUiThread(() -> { status.setText("Signed in ✓"); refreshState(); });
            } catch(Exception ex) {
                runOnUiThread(() -> { status.setText("Sign in failed: "+SupabaseApi.friendly(ex)); login.setEnabled(true); });
            }
        }).start();
    }

    boolean hasFullImageAccess() {
        if (Build.VERSION.SDK_INT >= 34) {
            return checkSelfPermission(Manifest.permission.READ_MEDIA_IMAGES)==PackageManager.PERMISSION_GRANTED;
        }
        if (Build.VERSION.SDK_INT >= 33) {
            return checkSelfPermission(Manifest.permission.READ_MEDIA_IMAGES)==PackageManager.PERMISSION_GRANTED;
        }
        return checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE)==PackageManager.PERMISSION_GRANTED;
    }

    void requestMedia() {
        if (Build.VERSION.SDK_INT >= 34) {
            requestPermissions(new String[]{Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED}, REQ_MEDIA);
        } else if (Build.VERSION.SDK_INT >= 33) {
            requestPermissions(new String[]{Manifest.permission.READ_MEDIA_IMAGES}, REQ_MEDIA);
        } else {
            requestPermissions(new String[]{Manifest.permission.READ_EXTERNAL_STORAGE}, REQ_MEDIA);
        }
    }

    void startSync() {
        if (!hasFullImageAccess()) { requestMedia(); return; }
        if (prefs.getString("access_token","").isEmpty()) { status.setText("Sign in first."); return; }
        prefs.edit().putString("selected_slot", slotKeys()[block.getSelectedItemPosition()]).apply();
        Intent i = new Intent(this, MediaSyncService.class).setAction(MediaSyncService.ACTION_SYNC);
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(i); else startService(i);
        status.setText("Sync started. You can leave the app open while it works.");
        refreshState();
    }

    public void onRequestPermissionsResult(int r, String[] p, int[] g) {
        super.onRequestPermissionsResult(r,p,g);
        if (r==REQ_MEDIA) {
            if (hasFullImageAccess()) status.setText("Full photo access granted ✓");
            else status.setText("Android gave partial/no access. Choose “Allow all photos” in the permission dialog or Settings.");
            refreshState();
        }
    }

    void setProgress(String s) {
        runOnUiThread(() -> progress.setText(s));
    }

    int dp(int n){ return (int)(n*getResources().getDisplayMetrics().density+0.5f); }
    String[] slotKeys(){ return new String[]{"","energy-soft","energy-hot","energy-sassy","energy-vibe","memory-01","memory-02","memory-03","memory-04","favourite-frame","that-outfit","latest-mood","that-face","the-detail","the-laugh","after-dark","memory","everyday","just-niharika","notes-confidence","notes-sassy","notes-own","notes-attitude","notes-worth","notes-all","attitude-main","attitude-dark","attitude-unapologetic","flower-softness","flower-joy","flower-confidence","flower-rest","flower-being-you"}; }
    String[] blockLabels(){ return new String[]{"No block — library draft","01 · Soft heart","01 · Hot energy","01 · Sassy soul","01 · Her own vibe","03 · Memory 01","03 · Memory 02","03 · Memory 03","03 · Memory 04","04 · Featured","04 · The look","04 · The smile","04 · The day","04 · The detail","04 · The laugh","04 · After dark","04 · Memory","04 · Everyday","04 · Just Niharika","05 · Confidence","05 · Sassy girl","05 · Own it","05 · The attitude","05 · Know your worth","05 · All of you","06 · Main character","06 · After dark","06 · Unapologetic","07 · Softness","07 · Joy","07 · Confidence","07 · Rest","07 · Being you"}; }

}
