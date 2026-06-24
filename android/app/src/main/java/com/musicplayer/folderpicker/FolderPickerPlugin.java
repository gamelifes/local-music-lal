package com.musicplayer.folderpicker;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.ActivityCallback;

@CapacitorPlugin(name = "FolderPicker")
public class FolderPickerPlugin extends Plugin {

    private static final int PICK_FOLDER_REQUEST = 12345;

    @PluginMethod
    public void pickFolder(PluginCall call) {
        try {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
            startActivityForResult(call, intent, "handleFolderPickResult");
        } catch (Exception e) {
            call.reject("Failed to open folder picker", e);
        }
    }

    @ActivityCallback
    private void handleFolderPickResult(PluginCall call, Activity activity, Intent data) {
        if (activity == null || data == null) {
            call.reject("No folder selected");
            return;
        }

        Uri treeUri = data.getData();
        if (treeUri == null) {
            call.reject("No folder selected");
            return;
        }

        try {
            // Take persistent permission
            activity.getContentResolver().takePersistableUriPermission(
                treeUri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            );

            // Get the path from the URI
            String path = treeUri.getPath();
            if (path == null) {
                path = treeUri.toString();
            }

            // Decode the path - content URI format
            // content://com.android.externalstorage.documents/tree/primary%3AMusic
            // We need to extract "Music" from this
            String folderName = extractFolderName(treeUri);

            JSObject result = new JSObject();
            result.put("path", path);
            result.put("folderName", folderName);
            result.put("uri", treeUri.toString());

            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to process folder", e);
        }
    }

    private String extractFolderName(Uri uri) {
        String uriString = uri.toString();
        // Try to extract folder name from content URI
        // Format: content://com.android.externalstorage.documents/tree/primary%3AMusic
        if (uriString.contains("%3A")) {
            String[] parts = uriString.split("%3A");
            if (parts.length > 1) {
                String folderPart = parts[parts.length - 1];
                // Remove any trailing slashes or encoding
                folderPart = folderPart.split("/")[0];
                try {
                    return java.net.URLDecoder.decode(folderPart, "UTF-8");
                } catch (Exception e) {
                    return folderPart;
                }
            }
        }
        // Fallback: use the last path segment
        String lastPath = uri.getLastPathSegment();
        if (lastPath != null) {
            return lastPath;
        }
        return "Music";
    }
}
