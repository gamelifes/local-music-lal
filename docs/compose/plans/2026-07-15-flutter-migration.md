# WebView → Flutter 原生迁移方案

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task.

**Goal:** 将当前 React/WebView 音乐播放器迁移到 Flutter 原生开发，实现后台播放和悬浮窗灵动岛功能。

**Architecture:** Flutter 原生 App，使用 `just_audio` 播放音频，`audio_service` 实现后台播放和通知控制，`system_alert_window` 实现悬浮窗。数据持久化使用 `sqflite`（替代 IndexedDB）。状态管理使用 `Riverpod`。

**Tech Stack:** Flutter 3.x, Dart, just_audio, audio_service, sqflite, path_provider, permission_handler, flutter_launcher_icons

---

## 现有功能清单（需迁移）

| 类别 | 功能 |
|------|------|
| 播放 | 播放/暂停/上一曲/下一曲、进度拖动、音量控制、循环模式（列表/随机/单曲） |
| 扫描 | 文件夹选择、递归扫描音频文件、元数据提取、实时进度显示 |
| 列表 | 歌曲列表、歌手浏览、专辑浏览、播放列表管理、搜索 |
| 歌词 | LRC 解析、逐字卡拉OK同步、歌词滚动 |
| 均衡器 | 10段EQ、预设管理、自定义预设 |
| 其他 | 睡眠定时、隐藏歌曲、文件信息、分享、音质检测、桌面歌词 |
| Android | HTTP 本地服务器（/ext/路由）、端口持久化、权限管理 |

---

## 项目结构

```
D:\MarivsProjects\MusicPlayerFlutter/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── models/
│   │   ├── song.dart
│   │   ├── playlist.dart
│   │   └── equalizer_preset.dart
│   ├── providers/
│   │   ├── player_provider.dart
│   │   ├── library_provider.dart
│   │   ├── scan_provider.dart
│   │   ├── equalizer_provider.dart
│   │   ├── sleep_provider.dart
│   │   └── app_provider.dart
│   ├── services/
│   │   ├── audio_service.dart
│   │   ├── background_audio.dart
│   │   ├── floating_service.dart
│   │   ├── scanner_service.dart
│   │   ├── database_service.dart
│   │   ├── metadata_service.dart
│   │   └── lyrics_service.dart
│   ├── pages/
│   │   ├── home_page.dart
│   │   ├── player_page.dart
│   │   ├── scan_page.dart
│   │   ├── search_page.dart
│   │   ├── equalizer_page.dart
│   │   ├── lyrics_page.dart
│   │   ├── artists_page.dart
│   │   ├── albums_page.dart
│   │   ├── playlists_page.dart
│   │   └── hidden_page.dart
│   ├── widgets/
│   │   ├── music_bar.dart
│   │   ├── song_table.dart
│   │   ├── drawer_nav.dart
│   │   ├── queue_modal.dart
│   │   ├── floating_island.dart
│   │   └── ...
│   └── utils/
│       ├── constants.dart
│       ├── theme.dart
│       └── helpers.dart
├── android/
│   └── app/src/main/kotlin/.../
│       ├── MainActivity.kt
│       ├── FloatingService.kt
│       └── MediaSessionHelper.kt
├── assets/
│   └── icons/
└── pubspec.yaml
```

---

## 分阶段实施

### 阶段一：项目骨架 + 核心播放（2-3天）

#### Task 1: Flutter 项目初始化

**Files:**
- Create: `D:\MarivsProjects\MusicPlayerFlutter\pubspec.yaml`
- Create: `D:\MarivsProjects\MusicPlayerFlutter\lib\main.dart`
- Create: `D:\MarivsProjects\MusicPlayerFlutter\lib\app.dart`
- Create: `D:\MarivsProjects\MusicPlayerFlutter\lib\utils\constants.dart`
- Create: `D:\MarivsProjects\MusicPlayerFlutter\lib\utils\theme.dart`

- [ ] **Step 1: 创建 Flutter 项目**

```bash
flutter create MusicPlayerFlutter --org com.musicplayer --platforms android
cd MusicPlayerFlutter
```

- [ ] **Step 2: 配置 pubspec.yaml**

```yaml
name: music_player_flutter
description: 本地音乐播放器
version: 1.0.0+1
environment:
  sdk: ^3.8.0

dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.6.1
  just_audio: ^0.9.43
  audio_service: ^0.18.17
  sqflite: ^2.4.2
  path_provider: ^2.1.5
  permission_handler: ^11.4.0
  path: ^1.9.1
  flutter_local_notifications: ^18.0.1
  system_alert_window: ^2.0.0
  shared_preferences: ^2.3.5
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0
  build_runner: ^2.4.15
  freezed_annotation: ^2.4.6
  json_annotation: ^4.9.0
```

- [ ] **Step 3: 配置 Android 权限**

修改 `android/app/src/main/AndroidManifest.xml` 添加：
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

- [ ] **Step 4: 创建基础 App 和 Theme**

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: MusicPlayerApp()));
}

// lib/app.dart
class MusicPlayerApp extends StatelessWidget {
  const MusicPlayerApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LMusic',
      theme: ThemeData(
        brightness: Brightness.dark,
        colorSchemeSeed: const Color(0xFFFFD700),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: Flutter project init with core dependencies"
```

---

#### Task 2: 数据模型 + 数据库

**Files:**
- Create: `lib/models/song.dart`
- Create: `lib/models/playlist.dart`
- Create: `lib/models/equalizer_preset.dart`
- Create: `lib/services/database_service.dart`

- [ ] **Step 1: 创建 Song 数据模型**

```dart
// lib/models/song.dart
class Song {
  final String id;
  final String title;
  final String artist;
  final String album;
  final double duration; // seconds
  final String filePath;
  final int size; // bytes
  final String format;
  final int bitrate;
  final int sampleRate;
  final int channels;
  final String quality; // lossless, high, standard, low
  final String folder;
  final bool hidden;
  final int addedAt;
  final String? cover; // base64

  Song({
    required this.id, required this.title, required this.artist,
    required this.album, required this.duration, required this.filePath,
    required this.size, required this.format, required this.bitrate,
    required this.sampleRate, required this.channels, required this.quality,
    required this.folder, required this.hidden, required this.addedAt,
    this.cover,
  });

  Map<String, dynamic> toMap() => {
    'id': id, 'title': title, 'artist': artist, 'album': album,
    'duration': duration, 'filePath': filePath, 'size': size,
    'format': format, 'bitrate': bitrate, 'sampleRate': sampleRate,
    'channels': channels, 'quality': quality, 'folder': folder,
    'hidden': hidden ? 1 : 0, 'addedAt': addedAt, 'cover': cover,
  };

  factory Song.fromMap(Map<String, dynamic> m) => Song(
    id: m['id'], title: m['title'], artist: m['artist'], album: m['album'],
    duration: (m['duration'] as num).toDouble(), filePath: m['filePath'],
    size: m['size'], format: m['format'], bitrate: m['bitrate'],
    sampleRate: m['sampleRate'], channels: m['channels'],
    quality: m['quality'], folder: m['folder'],
    hidden: m['hidden'] == 1, addedAt: m['addedAt'], cover: m['cover'],
  );
}
```

- [ ] **Step 2: 创建 Playlist 数据模型**

```dart
// lib/models/playlist.dart
class Playlist {
  final String id;
  final String name;
  final int createdAt;
  final int updatedAt;
  final List<String> songIds;

  Playlist({required this.id, required this.name, required this.createdAt,
      required this.updatedAt, required this.songIds});

  Map<String, dynamic> toMap() => {
    'id': id, 'name': name, 'createdAt': createdAt,
    'updatedAt': updatedAt,
  };
}
```

- [ ] **Step 3: 创建数据库服务**

```dart
// lib/services/database_service.dart
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/song.dart';

class DatabaseService {
  static Database? _database;
  
  Future<Database> get database async {
    _database ??= await openDatabase(
      join(await getDatabasesPath(), 'music_player.db'),
      version: 1,
      onCreate: _onCreate,
    );
    return _database!;
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE songs(
        id TEXT PRIMARY KEY, title TEXT, artist TEXT, album TEXT,
        duration REAL, filePath TEXT, size INTEGER, format TEXT,
        bitrate INTEGER, sampleRate INTEGER, channels INTEGER,
        quality TEXT, folder TEXT, hidden INTEGER, addedAt INTEGER, cover TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE playlists(
        id TEXT PRIMARY KEY, name TEXT, createdAt INTEGER, updatedAt INTEGER
      )
    ''');
    await db.execute('''
      CREATE TABLE playlist_songs(
        playlistId TEXT, songId TEXT, position INTEGER,
        PRIMARY KEY (playlistId, songId)
      )
    ''');
    await db.execute('''
      CREATE TABLE scan_history(
        folder TEXT PRIMARY KEY, path TEXT
      )
    ''');
  }

  Future<List<Song>> getAllSongs() async {
    final db = await database;
    final maps = await db.query('songs', orderBy: 'addedAt DESC');
    return maps.map((m) => Song.fromMap(m)).toList();
  }

  Future<void> insertSongs(List<Song> songs) async {
    final db = await database;
    final batch = db.batch();
    for (final song in songs) {
      batch.insert('songs', song.toMap(),
          conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<void> updateSong(Song song) async {
    final db = await database;
    await db.update('songs', song.toMap(),
        where: 'id = ?', whereArgs: [song.id]);
  }

  Future<List<String>> getHiddenIds() async {
    final db = await database;
    final maps = await db.query('songs', where: 'hidden = 1');
    return maps.map((m) => m['id'] as String).toList();
  }

  Future<void> toggleHidden(String songId, bool hidden) async {
    final db = await database;
    await db.update('songs', {'hidden': hidden ? 1 : 0},
        where: 'id = ?', whereArgs: [songId]);
  }

  Future<void> saveScanFolder(String folder, String path) async {
    final db = await database;
    await db.insert('scan_history', {'folder': folder, 'path': path},
        conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<Map<String, String>>> getScanFolders() async {
    final db = await database;
    return (await db.query('scan_history'))
        .map((m) => {'folder': m['folder'] as String, 'path': m['path'] as String})
        .toList();
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: data models + SQLite database service"
```

---

#### Task 3: 音频播放服务（核心）

**Files:**
- Create: `lib/services/audio_service.dart`
- Create: `lib/providers/player_provider.dart`

- [ ] **Step 1: 创建音频播放服务**

```dart
// lib/services/audio_service.dart
import 'package:just_audio/just_audio.dart';

class AudioPlayerService {
  final AudioPlayer _player = AudioPlayer();
  
  AudioPlayer get player => _player;
  
  Stream<Duration> get positionStream => _player.positionStream;
  Stream<Duration?> get durationStream => _player.durationStream;
  Stream<PlayerState> get stateStream => _player.playerStateStream;
  
  Future<void> play(String url) async {
    await _player.setUrl(url);
    await _player.play();
  }
  
  Future<void> pause() async => await _player.pause();
  Future<void> resume() async => await _player.play();
  Future<void> stop() async => await _player.stop();
  Future<void> seek(Duration position) async => await _player.seek(position);
  
  double get volume => _player.volume;
  Future<void> setVolume(double v) async => await _player.setVolume(v);
  
  bool get playing => _player.playing;
  Duration get position => _player.position;
  Duration get duration => _player.duration ?? Duration.zero;
  
  Future<void> dispose() async => await _player.dispose();
}
```

- [ ] **Step 2: 创建 Player Provider**

```dart
// lib/providers/player_provider.dart
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart';
import '../models/song.dart';
import '../services/audio_service.dart';

enum RepeatMode { all, shuffle, one }

class PlayerState {
  final Song? currentSong;
  final List<Song> songList;
  final int currentIndex;
  final bool isPlaying;
  final double progress; // 0-100
  final Duration currentTime;
  final Duration duration;
  final double volume;
  final RepeatMode repeatMode;

  PlayerState({
    this.currentSong, this.songList = const [], this.currentIndex = -1,
    this.isPlaying = false, this.progress = 0,
    this.currentTime = Duration.zero, this.duration = Duration.zero,
    this.volume = 0.8, this.repeatMode = RepeatMode.all,
  });

  PlayerState copyWith({
    Song? currentSong, List<Song>? songList, int? currentIndex,
    bool? isPlaying, double? progress, Duration? currentTime,
    Duration? duration, double? volume, RepeatMode? repeatMode,
  }) => PlayerState(
    currentSong: currentSong ?? this.currentSong,
    songList: songList ?? this.songList,
    currentIndex: currentIndex ?? this.currentIndex,
    isPlaying: isPlaying ?? this.isPlaying,
    progress: progress ?? this.progress,
    currentTime: currentTime ?? this.currentTime,
    duration: duration ?? this.duration,
    volume: volume ?? this.volume,
    repeatMode: repeatMode ?? this.repeatMode,
  );
}

class PlayerNotifier extends StateNotifier<PlayerState> {
  final AudioPlayerService _audioService;
  StreamSubscription? _positionSub;
  StreamSubscription? _stateSub;
  StreamSubscription? _durationSub;

  PlayerNotifier(this._audioService) : super(PlayerState()) {
    _positionSub = _audioService.positionStream.listen((pos) {
      final dur = _audioService.duration;
      final pct = dur.inMilliseconds > 0
          ? (pos.inMilliseconds / dur.inMilliseconds) * 100
          : 0.0;
      state = state.copyWith(currentTime: pos, progress: pct);
    });
    _durationSub = _audioService.durationStream.listen((dur) {
      if (dur != null) state = state.copyWith(duration: dur);
    });
  }

  Future<void> play(Song song, [List<Song>? list]) async {
    final songList = list ?? [song];
    final idx = list != null ? list.indexWhere((s) => s.id == song.id) : 0;
    state = state.copyWith(
      currentSong: song, songList: songList, currentIndex: idx,
      isPlaying: true, progress: 0, currentTime: Duration.zero,
    );
    final url = 'http://127.0.0.1:8888/ext/${Uri.encodeComponent(song.filePath)}';
    await _audioService.play(url);
  }

  Future<void> togglePlay() async {
    if (state.isPlaying) {
      await _audioService.pause();
      state = state.copyWith(isPlaying: false);
    } else {
      await _audioService.resume();
      state = state.copyWith(isPlaying: true);
    }
  }

  Future<void> nextSong() async {
    final { songList, currentIndex, repeatMode } = state;
    if (songList.isEmpty) return;

    int nextIdx;
    if (repeatMode == RepeatMode.shuffle) {
      nextIdx = (DateTime.now().millisecondsSinceEpoch % songList.length);
      while (nextIdx == currentIndex && songList.length > 1) {
        nextIdx = (DateTime.now().millisecondsSinceEpoch % songList.length);
      }
    } else if (repeatMode == RepeatMode.one) {
      nextIdx = currentIndex;
    } else {
      nextIdx = (currentIndex + 1) % songList.length;
    }
    await play(songList[nextIdx], songList);
  }

  Future<void> prevSong() async {
    if (state.currentTime.inSeconds > 3) {
      await _audioService.seek(Duration.zero);
    } else if (state.currentIndex > 0) {
      await play(state.songList[state.currentIndex - 1], state.songList);
    }
  }

  Future<void> seek(double pct) async {
    final dur = _audioService.duration;
    if (dur.inMilliseconds <= 0) return;
    final pos = Duration(milliseconds: ((pct / 100) * dur.inMilliseconds).round());
    await _audioService.seek(pos);
    state = state.copyWith(progress: pct, currentTime: pos);
  }

  void setVolume(double v) {
    _audioService.setVolume(v);
    state = state.copyWith(volume: v);
  }

  void toggleRepeatMode() {
    const modes = [RepeatMode.all, RepeatMode.shuffle, RepeatMode.one];
    final nextIdx = (modes.indexOf(state.repeatMode) + 1) % modes.length;
    state = state.copyWith(repeatMode: modes[nextIdx]);
  }

  @override
  void dispose() {
    _positionSub?.cancel();
    _stateSub?.cancel();
    _durationSub?.cancel();
    _audioService.dispose();
    super.dispose();
  }
}

final audioServiceProvider = Provider((_) => AudioPlayerService());
final playerProvider = StateNotifierProvider<PlayerNotifier, PlayerState>(
  (ref) => PlayerNotifier(ref.read(audioServiceProvider)),
);
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: audio player service + player provider with just_audio"
```

---

#### Task 4: 歌曲扫描服务

**Files:**
- Create: `lib/services/scanner_service.dart`
- Create: `lib/services/metadata_service.dart`
- Create: `lib/providers/scan_provider.dart`

- [ ] **Step 1: 创建扫描服务**

```dart
// lib/services/scanner_service.dart
import 'dart:io';
import 'package:path/path.dart' as p;
import '../models/song.dart';
import 'metadata_service.dart';
import 'database_service.dart';

class ScanResult {
  final List<Song> songs;
  ScanResult(this.songs);
}

class ScannerService {
  final DatabaseService _db;
  final MetadataService _metadata;

  ScannerService(this._db, this._metadata);

  static const audioExtensions = {'.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.ape', '.wma'};

  Future<ScanResult> scanDirectory(String dirPath, String folderName, {Function(int)? onProgress}) async {
    final songs = <Song>[];
    await _scanDir(Directory(dirPath), folderName, songs, onProgress);
    return ScanResult(songs);
  }

  Future<void> _scanDir(Directory dir, String folderName, List<Song> songs, Function(int)? onProgress) async {
    try {
      final entities = dir.listSync(followLinks: false);
      for (final entity in entities) {
        if (entity is Directory) {
          await _scanDir(entity, folderName, songs, onProgress);
        } else if (entity is File) {
          final ext = p.extension(entity.path).toLowerCase();
          if (audioExtensions.contains(ext)) {
            final meta = await _metadata.extract(entity.path);
            final stat = await entity.stat();
            final song = Song(
              id: entity.path.hashCode.toString(),
              title: meta['title'] ?? p.basenameWithoutExtension(entity.path),
              artist: meta['artist'] ?? 'Unknown Artist',
              album: meta['album'] ?? 'Unknown Album',
              duration: (meta['duration'] as num?)?.toDouble() ?? 0,
              filePath: entity.path,
              size: stat.size,
              format: ext.substring(1),
              bitrate: (meta['bitrate'] as num?)?.toInt() ?? 0,
              sampleRate: (meta['sampleRate'] as num?)?.toInt() ?? 0,
              channels: (meta['channels'] as num?)?.toInt() ?? 2,
              quality: _detectQuality(ext, (meta['bitrate'] as num?)?.toInt() ?? 0),
              folder: folderName,
              hidden: false,
              addedAt: DateTime.now().millisecondsSinceEpoch,
            );
            songs.add(song);
            onProgress?.call(songs.length);
          }
        }
      }
    } catch (_) {}
  }

  String _detectQuality(String ext, int bitrate) {
    if (ext == '.flac' || ext == '.ape' || ext == '.wav') return 'lossless';
    if (bitrate >= 320) return 'high';
    if (bitrate >= 192) return 'standard';
    return 'low';
  }
}
```

- [ ] **Step 2: 创建元数据提取服务**

```dart
// lib/services/metadata_service.dart
import 'dart:io';
import 'package:path/path.dart' as p;

class MetadataService {
  Future<Map<String, dynamic>> extract(String filePath) async {
    // Flutter 中使用 ffmpeg_flutter 或 native metadata 提取
    // 暂时返回基本元数据
    final file = File(filePath);
    final stat = await file.stat();
    return {
      'title': p.basenameWithoutExtension(filePath),
      'artist': 'Unknown Artist',
      'album': 'Unknown Album',
      'duration': 0.0,
      'bitrate': 0,
      'sampleRate': 0,
      'channels': 2,
    };
  }
}
```

- [ ] **Step 3: 创建 Scan Provider**

```dart
// lib/providers/scan_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/scanner_service.dart';
import '../services/database_service.dart';
import '../services/metadata_service.dart';

final databaseServiceProvider = Provider((_) => DatabaseService());
final metadataServiceProvider = Provider((_) => MetadataService());
final scannerServiceProvider = Provider((ref) => ScannerService(
    ref.read(databaseServiceProvider), ref.read(metadataServiceProvider)));

class ScanState {
  final bool scanning;
  final int scannedCount;
  final bool completed;
  final int completedCount;
  ScanState({this.scanning = false, this.scannedCount = 0,
      this.completed = false, this.completedCount = 0});
}

class ScanNotifier extends StateNotifier<ScanState> {
  final ScannerService _scanner;
  final DatabaseService _db;

  ScanNotifier(this._scanner, this._db) : super(ScanState());

  Future<void> scan(String dirPath, String folderName) async {
    state = ScanState(scanning: true);
    await _db.saveScanFolder(folderName, dirPath);
    final result = await _scanner.scanDirectory(dirPath, folderName,
        onProgress: (count) {
      state = ScanState(scanning: true, scannedCount: count);
    });
    await _db.insertSongs(result.songs);
    state = ScanState(completed: true, completedCount: result.songs.length);
  }
}

final scanProvider = StateNotifierProvider<ScanNotifier, ScanState>((ref) =>
    ScanNotifier(ref.read(scannerServiceProvider), ref.read(databaseServiceProvider)));
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: song scanner + metadata service + scan provider"
```

---

#### Task 5: 首页 + 歌曲列表

**Files:**
- Create: `lib/pages/home_page.dart`
- Create: `lib/widgets/song_table.dart`
- Create: `lib/widgets/music_bar.dart`
- Create: `lib/providers/library_provider.dart`

- [ ] **Step 1: 创建 Library Provider**

```dart
// lib/providers/library_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/song.dart';
import '../services/database_service.dart';

final libraryProvider = StateNotifierProvider<LibraryNotifier, List<Song>>((ref) =>
    LibraryNotifier(ref.read(databaseServiceProvider)));

class LibraryNotifier extends StateNotifier<List<Song>> {
  final DatabaseService _db;
  LibraryNotifier(this._db) : super([]);

  Future<void> loadSongs() async {
    state = await _db.getAllSongs();
  }

  Future<void> addSongs(List<Song> songs) async {
    await _db.insertSongs(songs);
    state = await _db.getAllSongs();
  }

  Future<void> toggleHidden(String songId) async {
    final song = state.firstWhere((s) => s.id == songId);
    await _db.toggleHidden(songId, !song.hidden);
    state = await _db.getAllSongs();
  }

  List<Song> getVisibleSongs() => state.where((s) => !s.hidden).toList();
}
```

- [ ] **Step 2: 创建首页**

```dart
// lib/pages/home_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/library_provider.dart';
import '../providers/player_provider.dart';
import '../widgets/song_table.dart';
import '../widgets/music_bar.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final songs = ref.watch(libraryProvider);
    final visibleSongs = songs.where((s) => !s.hidden).toList();

    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: SongTable(
              title: '我的音乐',
              songs: visibleSongs,
              onPlaySong: (song) {
                ref.read(playerProvider.notifier).play(song, visibleSongs);
              },
            ),
          ),
          const MusicBar(),
        ],
      ),
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: home page + song table + music bar + library provider"
```

---

### 阶段二：播放页面 + 歌词（2-3天）

#### Task 6: 播放页面

**Files:**
- Create: `lib/pages/player_page.dart`

- [ ] **Step 1: 创建播放页面（含进度条拖动）**

播放页面包含：专辑封面区域、歌曲信息、进度条（可拖动）、播放控制按钮、音量控制、循环模式切换。

关键实现点：
- 进度条使用 Slider 组件，支持拖动
- 拖动时暂停 updateProgress，释放后 seek
- 歌词/黑胶切换通过左右滑动

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: player page with draggable progress bar"
```

---

#### Task 7: 歌词服务 + LRC 解析

**Files:**
- Create: `lib/services/lyrics_service.dart`
- Create: `lib/models/lyrics.dart`

- [ ] **Step 1: 创建歌词解析器**

将现有 `src/lib/lyrics.ts` 的 LRC 解析逻辑移植到 Dart。核心逻辑：
- 解析 `[mm:ss.xx]歌词` 格式
- 支持逐字时间标签 `<xx.xx>字`
- 返回 `List<LyricLine>` 结构

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: lyrics parser (LRC format with word-by-word timing)"
```

---

### 阶段三：后台播放 + 悬浮窗（2-3天）

#### Task 8: 后台播放（audio_service）

**Files:**
- Create: `lib/services/background_audio.dart`
- Modify: `lib/providers/player_provider.dart`

- [ ] **Step 1: 实现后台音频服务**

使用 `audio_service` 包实现：
- 前台服务 + 通知栏控制
- MediaSession 集成
- 锁屏控制
- 系统 UI 控制

关键配置：
```dart
// android/app/src/main/AndroidManifest.xml
<service
    android:name="com.ryanheise.audioservice.AudioService"
    android:foregroundServiceType="mediaPlayback"
    android:exported="true">
    <intent-filter>
        <action android:name="android.media.browse.MediaBrowserService" />
    </intent-filter>
</service>
```

- [ ] **Step 2: 与 PlayerProvider 集成**

在 `PlayerNotifier` 中：
- `play()` 调用 `AudioService.start()` 启动后台服务
- 播放状态变化时更新 MediaSession
- 通知栏显示歌曲信息和控制按钮

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: background audio with audio_service + MediaSession"
```

---

#### Task 9: 悬浮窗灵动岛

**Files:**
- Create: `android/app/src/main/kotlin/.../FloatingService.kt`
- Create: `lib/widgets/floating_island.dart`
- Create: `lib/services/floating_service.dart`

- [ ] **Step 1: Android 原生悬浮窗服务**

使用 `system_alert_window` 包 + 原生 Kotlin 服务：
- 前台服务保活
- 悬浮窗 View（折叠/展开）
- MediaSession 回调
- WakeLock 防休眠

悬浮窗交互：
- 折叠态：歌曲名 + 封面缩略图 + 播放暂停
- 展开态：上一曲/播放/下一曲/关闭
- 拖拽移动

- [ ] **Step 2: Flutter 端集成**

检测 App 进入后台 → 显示悬浮窗
App 回到前台 → 隐藏悬浮窗

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: floating island with background playback"
```

---

### 阶段四：高级功能（2-3天）

#### Task 10: 搜索 + 歌手/专辑浏览

#### Task 11: 播放列表管理

#### Task 12: 均衡器

#### Task 13: 睡眠定时 + 隐藏歌曲 + 分享

#### Task 14: 桌面歌词

#### Task 15: 打包发布配置

---

## 迁移优先级

| 优先级 | 功能 | 原因 |
|--------|------|------|
| P0 | 音频播放 + 后台播放 | 核心功能，解决当前最大痛点 |
| P0 | 歌曲扫描 + 数据库 | 核心功能 |
| P0 | 播放页面 + 进度拖动 | 核心功能 |
| P1 | 悬浮窗灵动岛 | 用户明确需求 |
| P1 | 歌词同步 | 已有成熟实现 |
| P2 | 搜索 + 歌手/专辑 | 重要功能 |
| P2 | 播放列表 | 重要功能 |
| P3 | 均衡器 | 高级功能 |
| P3 | 睡眠定时 + 隐藏 | 辅助功能 |
| P3 | 桌面歌词 | 可选功能 |
