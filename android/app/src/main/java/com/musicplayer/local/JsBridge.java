package com.musicplayer.local;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.webkit.JavascriptInterface;
import android.provider.DocumentsContract;
import android.provider.Settings;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Base64;

public class JsBridge {
    private final Activity activity;
    private DirectoryPickerCallback callback;
    public int httpServerPort = 0;

    public interface DirectoryPickerCallback {
        void onResult(String path);
    }

    public JsBridge(Activity activity) {
        this.activity = activity;
    }

    private static final int PERMISSION_REQUEST_CODE = 10001;

    public void setDirectoryPickerCallback(DirectoryPickerCallback cb) {
        this.callback = cb;
    }

    @JavascriptInterface
    public String getPlatform() {
        return "android";
    }

    @JavascriptInterface
    public int getHttpServerPort() {
        return httpServerPort;
    }

private static final String NAV_DEFAULT = "{\"type\":\"back\",\"source\":\"\"}";

@JavascriptInterface
public void exitApp() {
    activity.runOnUiThread(() -> {
        activity.finish();
        System.exit(0);
    });
}

@JavascriptInterface
public void close(String entryJson) {
    activity.runOnUiThread(() -> {
        String target = entryJson != null && !entryJson.isEmpty() ? entryJson : NAV_DEFAULT;
        activity.getIntent().putExtra("closeEntry", target);
        activity.setResult(Activity.RESULT_OK, activity.getIntent());
        activity.finish();
    });
}

    @JavascriptInterface
    public String readdir(String dirPath) throws Exception {
        JSONArray result = new JSONArray();
        File dir = new File(dirPath);
        if (!dir.exists() || !dir.isDirectory()) {
            return result.toString();
        }
        File[] files = dir.listFiles();
        if (files != null) {
            for (File file : files) {
                JSONObject obj = new JSONObject();
                obj.put("name", file.getName());
                obj.put("type", file.isDirectory() ? "directory" : "file");
                obj.put("size", file.length());
                result.put(obj);
            }
        }
        return result.toString();
    }

    @JavascriptInterface
    public String readFileChunk(String filePath, int offset, int length) throws Exception {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new Exception("File not found: " + filePath);
        }
        byte[] buffer = new byte[length];
        try (FileInputStream fis = new FileInputStream(file)) {
            if (offset > 0) {
                fis.skip(offset);
            }
            int bytesRead = fis.read(buffer, 0, length);
            if (bytesRead < length) {
                byte[] trimmed = new byte[bytesRead];
                System.arraycopy(buffer, 0, trimmed, 0, bytesRead);
                return Base64.getEncoder().encodeToString(trimmed);
            }
        }
        return Base64.getEncoder().encodeToString(buffer);
    }

    @JavascriptInterface
    public String readFileText(String filePath) throws Exception {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new Exception("File not found: " + filePath);
        }
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(file), "UTF-8"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append('\n');
            }
        }
        return sb.toString();
    }

    @JavascriptInterface
    public long getFileSize(String filePath) {
        File file = new File(filePath);
        return file.exists() ? file.length() : 0;
    }

    @JavascriptInterface
    public boolean checkStoragePermission() {
        String perm;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            perm = android.Manifest.permission.READ_MEDIA_AUDIO;
        } else {
            perm = android.Manifest.permission.READ_EXTERNAL_STORAGE;
        }
        return ContextCompat.checkSelfPermission(activity, perm) == PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface
    public void requestStoragePermission() {
        activity.runOnUiThread(() -> {
            String[] perms;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                perms = new String[]{
                    android.Manifest.permission.READ_MEDIA_AUDIO
                };
            } else {
                perms = new String[]{
                    android.Manifest.permission.READ_EXTERNAL_STORAGE,
                    android.Manifest.permission.WRITE_EXTERNAL_STORAGE
                };
            }
            ActivityCompat.requestPermissions(activity, perms, PERMISSION_REQUEST_CODE);
        });
    }

    @JavascriptInterface
    public void openAppSettings() {
        activity.runOnUiThread(() -> {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.fromParts("package", activity.getPackageName(), null));
            activity.startActivity(intent);
        });
    }

    public void handlePermissionResult(int requestCode, int[] grantResults) {
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            final String result = granted ? "granted" : "denied";
            final android.webkit.WebView wv = getWebView();
            if (wv != null) {
                activity.runOnUiThread(() -> wv.evaluateJavascript("window._onPermissionResult('" + result + "')", null));
            }
        }
    }

    @JavascriptInterface
    public boolean checkOverlayPermission() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && android.provider.Settings.canDrawOverlays(activity);
    }

    @JavascriptInterface
    public void requestOverlayPermission() {
        activity.runOnUiThread(() -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + activity.getPackageName()));
                activity.startActivity(intent);
            }
        });
    }

    @JavascriptInterface
    public void showFloatingPlayer(String title, String artist) {
        activity.runOnUiThread(() -> {
            Intent intent = new Intent(activity, FloatingService.class);
            intent.putExtra("title", title);
            intent.putExtra("artist", artist);
            activity.startService(intent);
        });
    }

    @JavascriptInterface
    public void hideFloatingPlayer() {
        activity.runOnUiThread(() -> {
            Intent intent = new Intent(activity, FloatingService.class);
            intent.setAction("STOP");
            activity.startService(intent);
        });
    }

    @JavascriptInterface
    public void updateFloatingState(boolean playing) {
        FloatingService.setCallback(new FloatingService.FloatingCallback() {
            @Override public void onPlayPause() {
                final android.webkit.WebView wv = getWebView();
                if (wv != null) activity.runOnUiThread(() ->
                    wv.evaluateJavascript("window._onFloatingAction('togglePlay')", null));
            }
            @Override public void onNext() {
                final android.webkit.WebView wv = getWebView();
                if (wv != null) activity.runOnUiThread(() ->
                    wv.evaluateJavascript("window._onFloatingAction('next')", null));
            }
            @Override public void onPrev() {
                final android.webkit.WebView wv = getWebView();
                if (wv != null) activity.runOnUiThread(() ->
                    wv.evaluateJavascript("window._onFloatingAction('prev')", null));
            }
            @Override public void onClick() {
                final android.webkit.WebView wv = getWebView();
                if (wv != null) activity.runOnUiThread(() ->
                    wv.evaluateJavascript("window._onFloatingAction('open')", null));
            }
        });
    }

    private android.webkit.WebView getWebView() {
        try {
            java.lang.reflect.Field f = activity.getClass().getDeclaredField("webView");
            f.setAccessible(true);
            return (android.webkit.WebView) f.get(activity);
        } catch (Exception e) {
            return null;
        }
    }

    @JavascriptInterface
    public void pickDirectory() {
        activity.runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                activity.startActivityForResult(intent, 9999);
            } catch (Exception e) {
                if (callback != null) {
                    callback.onResult("");
                }
            }
        });
    }

    public void handleDirectoryPicked(int resultCode, Intent data) {
        if (resultCode == Activity.RESULT_OK && data != null && data.getData() != null) {
            Uri treeUri = data.getData();
            String path = getRealPathFromTreeUri(treeUri);
            if (callback != null) {
                callback.onResult(path != null ? path : "");
            }
        } else {
            if (callback != null) {
                callback.onResult("");
            }
        }
    }

    private String getRealPathFromTreeUri(Uri treeUri) {
        try {
            String docId = DocumentsContract.getTreeDocumentId(treeUri);
            String[] split = docId.split(":");
            String volumeId = split[0];
            String relativePath = split.length > 1 ? split[1] : "";
            if ("primary".equals(volumeId)) {
                return "/storage/emulated/0" + (relativePath.isEmpty() ? "" : "/" + relativePath);
            }
            return "/storage/" + volumeId + (relativePath.isEmpty() ? "" : "/" + relativePath);
        } catch (Exception e) {
            try {
                final int TAKE_FLAGS = Intent.FLAG_GRANT_READ_URI_PERMISSION;
                activity.getContentResolver().takePersistableUriPermission(treeUri, TAKE_FLAGS);
                String path = treeUri.getPath();
                if (path != null && path.startsWith("/tree/")) {
                    path = "/storage/emulated/0/" + path.substring("/tree/".length()).replace(":", "/");
                }
                return path;
            } catch (Exception e2) {
                return treeUri.toString();
            }
        }
    }
}
