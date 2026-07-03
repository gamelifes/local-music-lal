package com.musicplayer.local;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.provider.DocumentsContract;

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

    public JsBridge(Activity activity) {
        this.activity = activity;
    }

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
