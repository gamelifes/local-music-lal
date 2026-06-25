# MusicPlayer RN

React Native 本地音乐播放器

## 功能

- 本地音乐扫描
- 音频播放（支持 MP3/FLAC/WAV/OGG/AAC/M4A/APE）
- 播放控制（播放/暂停/上一曲/下一曲）
- 循环模式（顺序/列表循环/单曲循环）
- 进度条拖动
- 歌词显示

## 技术栈

- React Native 0.76.9
- react-native-fs（文件系统访问）
- react-native-track-player（音频播放）
- Zustand（状态管理）
- React Navigation（导航）

## 安装

```bash
npm install
cd ios && pod install
```

## 运行

```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

## 项目结构

```
src/
├── components/      # UI 组件
├── screens/         # 页面
│   ├── HomeScreen.tsx
│   └── PlayerScreen.tsx
├── store/           # 状态管理
│   └── playerStore.ts
├── utils/           # 工具函数
│   ├── fileSystem.ts
│   └── player.ts
└── types/           # 类型定义
    └── index.ts
```
