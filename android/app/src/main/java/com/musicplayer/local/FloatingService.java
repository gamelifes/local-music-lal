package com.musicplayer.local;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.RemoteViews;
import android.widget.TextView;

public class FloatingService extends Service {
    private static final String CHANNEL_ID = "music_floating";
    private static final int NOTIFICATION_ID = 1001;

    private WindowManager windowManager;
    private View floatingView;
    private WindowManager.LayoutParams params;

    private boolean isExpanded = false;
    private String songTitle = "";
    private String songArtist = "";

    public interface FloatingCallback {
        void onPlayPause();
        void onNext();
        void onPrev();
        void onClick();
    }

    private static FloatingCallback callback;

    public static void setCallback(FloatingCallback cb) {
        callback = cb;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "STOP".equals(intent.getAction())) {
            hideFloating();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        if (intent != null) {
            String title = intent.getStringExtra("title");
            String artist = intent.getStringExtra("artist");
            if (title != null) showFloating(title, artist);
        }

        startForeground(NOTIFICATION_ID, buildNotification());
        return START_STICKY;
    }

        startForeground(NOTIFICATION_ID, buildNotification());
        return START_STICKY;
    }

    public void showFloating(String title, String artist) {
        this.songTitle = title;
        this.songArtist = artist;

        if (floatingView != null) {
            updateContent();
            return;
        }

        floatingView = LayoutInflater.from(this).inflate(R.layout.floating_player, null);

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        params.y = dpToPx(40);

        setupListeners();
        updateContent();

        windowManager.addView(floatingView, params);
    }

    public void hideFloating() {
        if (floatingView != null) {
            windowManager.removeView(floatingView);
            floatingView = null;
            isExpanded = false;
        }
    }

    public void updateState(boolean playing) {
        if (floatingView == null) return;
        ImageButton playBtn = floatingView.findViewById(R.id.floating_play_pause);
        if (playBtn != null) {
            playBtn.setImageResource(playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play);
        }
    }

    private void setupListeners() {
        View collapsed = floatingView.findViewById(R.id.floating_collapsed);
        View expanded = floatingView.findViewById(R.id.floating_expanded);
        ImageButton playBtn = floatingView.findViewById(R.id.floating_play_pause);
        ImageButton nextBtn = floatingView.findViewById(R.id.floating_next);
        ImageButton prevBtn = floatingView.findViewById(R.id.floating_prev);
        ImageButton closeBtn = floatingView.findViewById(R.id.floating_close);

        collapsed.setOnClickListener(v -> {
            if (expanded.getVisibility() == View.VISIBLE) {
                expanded.setVisibility(View.GONE);
                isExpanded = false;
            } else {
                expanded.setVisibility(View.VISIBLE);
                isExpanded = true;
            }
        });

        if (playBtn != null) playBtn.setOnClickListener(v -> {
            if (callback != null) callback.onPlayPause();
        });

        if (nextBtn != null) nextBtn.setOnClickListener(v -> {
            if (callback != null) callback.onNext();
        });

        if (prevBtn != null) prevBtn.setOnClickListener(v -> {
            if (callback != null) callback.onPrev();
        });

        if (closeBtn != null) closeBtn.setOnClickListener(v -> {
            hideFloating();
        });

        setupDrag();
    }

    private void setupDrag() {
        floatingView.setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float initialTouchX, initialTouchY;
            private boolean isDragging = false;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        isDragging = false;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx = event.getRawX() - initialTouchX;
                        float dy = event.getRawY() - initialTouchY;
                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                            isDragging = true;
                            params.x = initialX + (int) dx;
                            params.y = initialY + (int) dy;
                            windowManager.updateViewLayout(floatingView, params);
                        }
                        return true;
                    case MotionEvent.ACTION_UP:
                        if (!isDragging) {
                            v.performClick();
                        }
                        return true;
                }
                return false;
            }
        });
    }

    private void updateContent() {
        if (floatingView == null) return;

        TextView titleView = floatingView.findViewById(R.id.floating_title);
        TextView artistView = floatingView.findViewById(R.id.floating_artist);

        if (titleView != null) titleView.setText(songTitle);
        if (artistView != null) artistView.setText(songArtist);
    }

    private Notification buildNotification() {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        return builder
                .setContentTitle(songTitle.isEmpty() ? "LMusic" : songTitle)
                .setContentText(songArtist.isEmpty() ? "正在播放" : songArtist)
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "音乐播放", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("音乐播放控制");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        hideFloating();
        super.onDestroy();
    }
}
