package com.musicplayer.local;

import android.media.MediaPlayer;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "AudioPlayer")
public class AudioPlayerPlugin extends Plugin {

    private MediaPlayer mediaPlayer;
    private String currentPath;

    @PluginMethod
    public void play(PluginCall call) {
        String path = call.getString("path");
        if (path == null) {
            call.reject("Missing path");
            return;
        }

        try {
            // Stop existing playback
            if (mediaPlayer != null) {
                mediaPlayer.release();
                mediaPlayer = null;
            }

            mediaPlayer = new MediaPlayer();
            currentPath = path;

            File file = new File(path);
            if (!file.exists()) {
                call.reject("File not found: " + path);
                return;
            }

            mediaPlayer.setDataSource(path);
            mediaPlayer.prepare();

            mediaPlayer.setOnPreparedListener(mp -> {
                mp.start();

                JSObject result = new JSObject();
                result.put("duration", mp.getDuration() / 1000.0);
                result.put("position", mp.getCurrentPosition() / 1000.0);
                call.resolve(result);
            });

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                call.reject("Playback error: " + what + " / " + extra);
                return true;
            });

            mediaPlayer.setOnCompletionListener(mp -> {
                JSObject data = new JSObject();
                data.put("finished", true);
                notifyListeners("trackComplete", data);
            });
        } catch (Exception e) {
            call.reject("Failed to play: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void pause(PluginCall call) {
        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
            mediaPlayer.pause();
        }
        call.resolve();
    }

    @PluginMethod
    public void resume(PluginCall call) {
        if (mediaPlayer != null && !mediaPlayer.isPlaying()) {
            mediaPlayer.start();
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
            currentPath = null;
        }
        call.resolve();
    }

    @PluginMethod
    public void seek(PluginCall call) {
        Double position = call.getDouble("position");
        if (mediaPlayer != null && position != null) {
            mediaPlayer.seekTo((int) (position * 1000));
        }
        call.resolve();
    }

    @PluginMethod
    public void getPosition(PluginCall call) {
        JSObject result = new JSObject();
        double position = 0;
        if (mediaPlayer != null) {
            position = mediaPlayer.getCurrentPosition() / 1000.0;
        }
        result.put("position", position);
        call.resolve(result);
    }

    @PluginMethod
    public void getDuration(PluginCall call) {
        JSObject result = new JSObject();
        double duration = 0;
        if (mediaPlayer != null) {
            duration = mediaPlayer.getDuration() / 1000.0;
        }
        result.put("duration", duration);
        call.resolve(result);
    }

    @PluginMethod
    public void getState(PluginCall call) {
        JSObject result = new JSObject();
        boolean playing = mediaPlayer != null && mediaPlayer.isPlaying();
        double position = mediaPlayer != null ? mediaPlayer.getCurrentPosition() / 1000.0 : 0;
        double duration = mediaPlayer != null ? mediaPlayer.getDuration() / 1000.0 : 0;
        result.put("playing", playing);
        result.put("position", position);
        result.put("duration", duration);
        result.put("path", currentPath);
        call.resolve(result);
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        Double volume = call.getDouble("volume");
        if (mediaPlayer != null && volume != null) {
            float vol = (float) Math.max(0, Math.min(1, volume));
            mediaPlayer.setVolume(vol, vol);
        }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (mediaPlayer != null) {
            mediaPlayer.release();
            mediaPlayer = null;
        }
    }
}
