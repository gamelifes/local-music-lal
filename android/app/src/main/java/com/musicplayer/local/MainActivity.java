package com.musicplayer.local;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends Activity {
    private WebView webView;
    private JsBridge jsBridge;
    private ServerSocket serverSocket;
    private ExecutorService executor;
    private volatile boolean running = true;

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

        executor = Executors.newFixedThreadPool(4);

        new Thread(() -> {
            try {
                serverSocket = new ServerSocket(0);
                int port = serverSocket.getListeningPort();
                jsBridge.httpServerPort = port;
                webView.post(() -> webView.loadUrl("http://127.0.0.1:" + port + "/index.html"));

                while (running) {
                    final Socket client = serverSocket.accept();
                    executor.execute(() -> handleClient(client));
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }).start();

        webView.setWebViewClient(new WebViewClient() {
            public boolean shouldOverrideUrlLoading(WebView view, String url) { return false; }
        });
        webView.setWebChromeClient(new WebChromeClient());
    }

    private void handleClient(Socket client) {
        try {
            String request = readRequest(client);
            if (request == null || request.isEmpty()) {
                client.close();
                return;
            }

            String[] lines = request.split("\r\n");
            if (lines.length == 0) {
                client.close();
                return;
            }

            String requestLine = lines[0];
            String[] parts = requestLine.split(" ");
            if (parts.length < 2) {
                client.close();
                return;
            }

            String method = parts[0];
            String rawPath = parts[1];
            String path = decodeUri(rawPath);

            if (path.equals("/") || path.equals("/index.html")) {
                serveAsset(client, "index.html", "text/html");
                return;
            }

            if (path.startsWith("/ext/")) {
                String rel = path.substring(5);
                String absPath = "/storage/emulated/0/" + rel;
                serveFile(client, absPath);
                return;
            }

            serveAsset(client, path.substring(1), null);
        } catch (Exception e) {
            try { client.close(); } catch (IOException ignored) {}
        }
    }

    private String readRequest(Socket client) throws IOException {
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(client.getInputStream(), StandardCharsets.UTF_8), 8192);
        StringBuilder sb = new StringBuilder();
        while (true) {
            int c = reader.read();
            if (c == -1) return sb.toString();
            sb.append((char) c);
            if (sb.length() > 4 && sb.substring(sb.length() - 4).equals("\r\n\r\n")) break;
            if (sb.length() > 16384) break;
        }
        return sb.toString();
    }

    private String decodeUri(String uri) {
        try {
            java.net.URI javaUri = new java.net.URI(uri);
            return javaUri.getPath();
        } catch (Exception e) {
            int q = uri.indexOf('?');
            return q >= 0 ? uri.substring(0, q) : uri;
        }
    }

    private void serveAsset(Socket client, String assetPath, String fallbackMime) throws IOException {
        try {
            android.content.res.AssetManager assets = getAssets();
            java.io.InputStream is = assets.open(assetPath);
            byte[] data = readAllBytes(is);
            is.close();
            String mime = fallbackMime != null ? fallbackMime : mimeFor(assetPath);
            sendResponse(client, 200, mime, data);
        } catch (java.io.FileNotFoundException e) {
            sendResponse(client, 404, "text/plain", "Not Found".getBytes(StandardCharsets.UTF_8));
        }
    }

    private void serveFile(Socket client, String absPath) throws IOException {
        File file = new File(absPath);
        if (!file.exists() || !file.isFile()) {
            sendResponse(client, 404, "text/plain", "Not Found".getBytes(StandardCharsets.UTF_8));
            return;
        }
        byte[] data = Files.readAllBytes(file.toPath());
        String mime = mimeFor(absPath);
        sendResponse(client, 200, mime, data);
    }

    private void sendResponse(Socket client, int status, String mime, byte[] body) throws IOException {
        OutputStream out = client.getOutputStream();
        String statusLine = "HTTP/1.1 " + status + " " + statusText(status) + "\r\n";
        String headers = "Content-Type: " + mime + "\r\n" +
                         "Content-Length: " + body.length + "\r\n" +
                         "Connection: close\r\n" +
                         "Access-Control-Allow-Origin: *\r\n" +
                         "\r\n";
        out.write(statusLine.getBytes(StandardCharsets.UTF_8));
        out.write(headers.getBytes(StandardCharsets.UTF_8));
        out.write(body);
        out.flush();
        client.close();
    }

    private String statusText(int code) {
        switch (code) {
            case 200: return "OK";
            case 404: return "Not Found";
            case 500: return "Internal Server Error";
            default: return "Unknown";
        }
    }

    private String mimeFor(String path) {
        if (path.endsWith(".html")) return "text/html; charset=utf-8";
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
        if (path.endsWith(".lrc")) return "text/plain; charset=utf-8";
        if (path.endsWith(".txt")) return "text/plain; charset=utf-8";
        return "application/octet-stream";
    }

    private byte[] readAllBytes(java.io.InputStream is) throws IOException {
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = is.read(buf)) != -1) bos.write(buf, 0, n);
        return bos.toByteArray();
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
        running = false;
        if (webView != null) webView.destroy();
        if (serverSocket != null) {
            try { serverSocket.close(); } catch (IOException ignored) {}
        }
        if (executor != null) executor.shutdownNow();
        super.onDestroy();
    }
}