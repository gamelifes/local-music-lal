package com.musicplayer.local;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.musicplayer.folderpicker.FolderPickerPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Register custom plugins
        registerPlugin(FolderPickerPlugin.class);
    }
}
