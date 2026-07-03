package com.musicplayer.local;

import android.app.Activity;
import android.content.Intent;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URLConnection;
import java.net.URLDecoder;

public class MainActivity extends Activity {
    private WebView webView;
    private JsBridge jsBridge;
    private fi.iki.elonen.NanoHTTPD server;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setDatabaseEnabled(true);

        jsBridge = new JsBridge(this);
        webView.addJavascriptInterface(jsBridge, "AndroidBridge");

        jsBridge.setDirectoryPickerCallback(path -> {
            webView.post(() -> {
                webView.evaluateJavascript(
                        "window._directoryPicked && window._directoryPicked('" + path.replace("'", "\\'") + "')",
                        null
                );
            });
        });

        server = new fi.iki.elonen.NanoHTTPD(0) {
            private final AssetManager assets = getAssets();

            @Override
            public fi.iki.elonen.NanoHTTPD.Response serve(fi.iki.elonen.NanoHTTPD.IHTTPSession session) {
                String uri = session.getUri();
                String path = uri.equals("/") ? "index.html" : uri.substring(1);

                // /ext/... → /storage/emulated/0/...
                if (path.startsWith("ext/")) {
                    String rel = path.substring(4);
                    String decoded = URLDecoder.decode(rel, "UTF-8");
                    String absPath = "/storage/emulated/0/" + decoded;
                    return serveFile(absPath);
                }

                // Otherwise serve from assets
                try {
                    InputStreamReader reader = new InputStreamReader(assets.open(path), "UTF-8");
                    StringBuilder sb = new StringBuilder();
                    char[] buf = new char[4096];
                    int n;
                    while ((n = reader.read(buf)) != -1) sb.append(buf, 0, n);
                    reader.close();
                    String mime = mimeFor(path);
                    return newFixedLengthResponse(fi.iki.elonen.NanoHTTPD.Response.Status.OK, mime, sb.toString());
                } catch (IOException e) {
                    return newFixedLengthResponse(fi.iki.elonen.NanoHTTPD.Response.Status.NOT_FOUND, "text/plain", "Not Found");
                }
            }

            private fi.iki.elonen.NanoHTTPD.Response serveFile(String absPath) {
                java.io.File file = new java.io.File(absPath);
                if (!file.exists() || !file.isFile()) {
                    return newFixedLengthResponse(fi.iki.elonen.NanoHTTPD.Response.Status.NOT_FOUND, "text/plain", "Not Found");
                }
                String mime = mimeFor(absPath);
                try {
                    byte[] data = java.nio.file.Files.readAllBytes(file.toPath());
                    java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(data);
                    fi.iki.elonen.NanoHTTPD.Response res = new fi.iki.elonen.NanoHTTPD.Response(
                            fi.iki.elonen.NanoHTTPD.Response.Status.OK, mime, bais, data.length);
                    return res;
                } catch (java.io.IOException e) {
                    return newFixedLengthResponse(fi.iki.elonen.NanoHTTPD.Response.Status.INTERNAL_ERROR, "text/plain", e.getMessage());
                }
            }

            private String mimeFor(String path) {
                if (path.endsWith(".html")) return "text/html";
                if (path.endsWith(".js")) return "application/javascript";
                if (path.endsWith(".css")) return "text/css";
                if (path.endsWith(".json")) return "application/json";
                if (path.endsWith(".png")) return "image/png";
                if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
                if (path.endsWith(".svg")) return "image/svg+xml";
                if (path.endsWith(".wasm")) return "application/wasm";
                if (path.endsWith(".ico")) return "image/x-icon";
                if (path.endsWith(".mp3")) return "audio/mpeg";
                if (path.endsWith(".flac")) return "audio/flac";
                if (path.endsWith(".wav")) return "audio/wav";
                if (path.endsWith(".ogg")) return "audio/ogg";
                if (path.endsWith(".m4a")) return "audio/mp4";
                if (path.endsWith(".aac")) return "audio/aac";
                if (path.endsWith(".ape")) return "audio/ape";
                if (path.endsWith(".lrc")) return "text/plain";
                String g = URLConnection.guessContentTypeFromName(path);
                return g != null ? g : "application/octet-stream";
            }
        };

        try {
            server.start();
            jsBridge.httpServerPort = server.getListeningPort();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        int port = server.getListeningPort();
        webView.loadUrl("http://127.0.0.1:" + port + "/index.html");

        webView.setWebViewClient(new WebViewClient() {
            public boolean shouldOverrideUrlLoading(WebView view, String url) { return false; }
        });
        webView.setWebChromeClient(new WebChromeClient());
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 9999 && jsBridge != null) jsBridge.handleDirectoryPicked(resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    public void onDestroy() {
        if (webView != null) webView.destroy();
        if (server != null) server.stop();
        super.onDestroy();
    }
}