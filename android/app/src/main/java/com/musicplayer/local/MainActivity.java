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

import fi.iki.elonen.NanoHTTPD;
import fi.iki.elonen.NanoHTTPD.IHTTPSession;
import fi.iki.elonen.NanoHTTPD.Response;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;

public class MainActivity extends Activity {
    private WebView webView;
    private JsBridge jsBridge;
    private NanoHTTPD server;

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

        // Start local HTTP server to serve assets
        server = new MyHttpServer(0, this);
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

    private class MyHttpServer extends NanoHTTPD {
        private final android.content.Context context;

        public MyHttpServer(int port, android.content.Context context) {
            super(port);
            this.context = context;
        }

        @Override
        public Response serve(IHTTPSession session) {
            String uri = session.getUri();
            if (uri.equals("/")) {
                uri = "/index.html";
            }
            String path = uri.startsWith("/") ? uri.substring(1) : uri;
            try {
                AssetManager assets = context.getAssets();
                InputStream inputStream = assets.open(path);

                // Read full content to determine length for Response ctor
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int n;
                while ((n = inputStream.read(buf)) != -1) {
                    baos.write(buf, 0, n);
                }
                inputStream.close();
                byte[] data = baos.toByteArray();

                String mime = "application/octet-stream";
                if (path.endsWith(".html") || path.endsWith(".htm")) mime = "text/html";
                else if (path.endsWith(".js")) mime = "application/javascript";
                else if (path.endsWith(".css")) mime = "text/css";
                else if (path.endsWith(".json")) mime = "application/json";
                else if (path.endsWith(".png")) mime = "image/png";
                else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) mime = "image/jpeg";
                else if (path.endsWith(".svg")) mime = "image/svg+xml";
                else if (path.endsWith(".wasm")) mime = "application/wasm";
                else {
                    String guessed = URLConnection.guessContentTypeFromName(path);
                    if (guessed != null) mime = guessed;
                }

                return Response.newFixedLengthResponse(Response.Status.OK, mime, new ByteArrayInputStream(data), data.length);
            } catch (IOException e) {
                return Response.newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", new ByteArrayInputStream("Not Found".getBytes()), "Not Found".getBytes().length);
            }
        }
    }
}