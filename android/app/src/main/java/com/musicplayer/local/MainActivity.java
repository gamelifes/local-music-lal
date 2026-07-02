package com.musicplayer.local;

import android.app.Activity;
import android.content.Intent;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.URLConnection;

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

            public fi.iki.elonen.NanoHTTPD.Response serve(fi.iki.elonen.NanoHTTPD.IHTTPSession session) {
                String uri = session.getUri();
                String path = uri.equals("/") ? "index.html" : uri.substring(1);
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
                String g = URLConnection.guessContentTypeFromName(path);
                return g != null ? g : "application/octet-stream";
            }
        };

        try {
            server.start();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        webView.loadUrl("http://127.0.0.1:" + server.getListeningPort() + "/index.html");

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