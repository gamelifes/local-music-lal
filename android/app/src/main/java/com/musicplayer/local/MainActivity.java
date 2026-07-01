package com.musicplayer.local;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;
    private JsBridge jsBridge;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Full screen
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        webView = new WebView(this);
        setContentView(webView);

        // Configure WebView
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setDatabaseEnabled(true);

        // JavaScript bridge
        jsBridge = new JsBridge(this);
        webView.addJavascriptInterface(jsBridge, "AndroidBridge");

        // Handle directory picker results
        jsBridge.setDirectoryPickerCallback(path -> {
            webView.post(() -> {
                webView.evaluateJavascript(
                    "window._directoryPicked && window._directoryPicked('" + path.replace("'", "\\'") + "')",
                    null
                );
            });
        });

        // WebViewClient — handle link navigation
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return false;
            }
        });

        // WebChromeClient — handle console logs
        webView.setWebChromeClient(new WebChromeClient());

        // Load the app
        webView.loadUrl("file:///android_asset/public/index.html");
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
        super.onDestroy();
    }
}
