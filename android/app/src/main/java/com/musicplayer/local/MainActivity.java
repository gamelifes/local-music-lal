package com.musicplayer.local;

import android.app.Activity;
import android.content.Intent;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.net.URLConnection;

public class MainActivity extends Activity {
    private WebView webView;
    private JsBridge jsBridge;
    private LocalHttpServer server;

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

        server = new LocalHttpServer(0, this);
        try {
            server.start();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        int port = server.getListeningPort();
        String url = "http://127.0.0.1:" + port + "/index.html";
        webView.loadUrl(url);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 9999 && jsBridge != null) {
            jsBridge.handleDirectoryPicked(resultCode, data);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        if (server != null) {
            server.stop();
        }
        super.onDestroy();
    }

    private static class LocalHttpServer extends fi.iki.elonen.NanoHTTPD {
        private final android.content.Context context;

        LocalHttpServer(int port, android.content.Context context) {
            super(port);
            this.context = context;
        }

        @Override
        public String getMimeTypeForFile(String uri) {
            if (uri.endsWith(".html")) return "text/html";
            if (uri.endsWith(".js")) return "application/javascript";
            if (uri.endsWith(".css")) return "text/css";
            if (uri.endsWith(".json")) return "application/json";
            if (uri.endsWith(".png")) return "image/png";
            if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) return "image/jpeg";
            if (uri.endsWith(".svg")) return "image/svg+xml";
            if (uri.endsWith(".wasm")) return "application/wasm";
            if (uri.endsWith(".ico")) return "image/x-icon";
            if (uri.endsWith(".woff")) return "font/woff";
            if (uri.endsWith(".woff2")) return "font/woff2";
            String g = URLConnection.guessContentTypeFromName(uri);
            return g != null ? g : "application/octet-stream";
        }

        @Override
        public Response serve(IHTTPSession session) {
            String uri = session.getUri();
            String path = uri.equals("/") ? "index.html" : uri.substring(1);

            try {
                AssetManager assets = context.getAssets();
                InputStream is = assets.open(path);
                String text = readStream(is);
                String mime = getMimeTypeForFile(path);
                return newFixedLengthResponse(Response.Status.OK, mime, text);
            } catch (IOException e) {
                return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "Not Found: " + path);
            }
        }

        private String readStream(InputStream is) throws IOException {
            Reader reader = new InputStreamReader(is, StandardCharsets.UTF_8);
            StringBuilder sb = new StringBuilder();
            char[] buf = new char[4096];
            int n;
            while ((n = reader.read(buf)) != -1) {
                sb.append(buf, 0, n);
            }
            reader.close();
            return sb.toString();
        }
    }
}
