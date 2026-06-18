# MusicPlayer 本地音乐播放器开发计划

## 项目目标

开发一款纯本地使用的音乐播放器，支持 PWA + Capacitor Android APK。核心功能：本地扫描、逻辑删除、音效增强、音质识别、自定义均衡器、逐字歌词、桌面歌词浮窗。

## 技术栈

- Vite + React 18 + TypeScript
- Zustand (状态管理)
- Tailwind CSS (样式)
- Howler.js (音频播放)
- Web Audio API (均衡器)
- IndexedDB via idb (本地存储)
- File System Access API (文件访问)
- Capacitor 6 (Android 打包)

---

## 开发阶段

### 阶段一：项目基础 (Day 1)

**目标：** 搭建项目骨架，实现基础数据流

1. **项目初始化**
   - Vite + React + TypeScript
   - 安装依赖：howler, idb, zustand, react-router-dom
   - 配置 Tailwind CSS
   - 创建目录结构

2. **类型定义**
   - `src/types/song.ts` — Song 接口
   - `src/types/eq.ts` — 均衡器预设类型
   - `src/types/lyrics.ts` — 歌词格式类型

3. **数据层**
   - `src/lib/db.ts` — IndexedDB 封装 (idb)
   - `src/lib/scanner.ts` — 文件扫描逻辑
   - `src/lib/audio.ts` — Howler.js 播放器封装

4. **状态管理**
   - `src/store/player.ts` — 播放状态
   - `src/store/library.ts` — 歌曲库状态
   - `src/store/eq.ts` — 均衡器状态

---

### 阶段二：核心音频系统 (Day 2-3)

**目标：** 实现真实的音频播放和均衡器

1. **音频播放器**
   - Howler.js 封装，支持播放/暂停/seek/切歌
   - 进度追踪和时间显示
   - 播放队列管理

2. **文件扫描**
   - File System Access API 选择文件夹
   - 递归遍历音频文件
   - music-metadata 解析 ID3 标签
   - 扫描进度回调

3. **IndexedDB 存储**
   - 歌曲库表 (songs)
   - 隐藏列表表 (hiddenSongs)
   - 均衡器预设表 (eqPresets)
   - 扫描历史表 (scanHistory)

4. **均衡器系统**
   - Web Audio API 音频处理链
   - 5 段 BiquadFilter (60/230/910/3.6k/14k Hz)
   - 预设管理 (正常/流行/摇滚/爵士/古典/人声/自定义)
   - 自定义预设保存/加载

---

### 阶段三：UI 页面 (Day 4-5)

**目标：** 实现所有页面，连接真实功能

1. **首页**
   - 歌曲列表（从 IndexedDB 加载）
   - 搜索过滤
   - 底部播放栏

2. **播放页**
   - 黑胶唱片动画
   - 进度条拖动
   - 播放控制
   - 歌词滑动切换

3. **扫描页**
   - 文件夹选择
   - 扫描进度
   - 结果展示

4. **均衡器页**
   - Canvas 波形编辑器
   - 预设按钮
   - 自定义保存

5. **歌词系统**
   - LRC 解析器
   - 逐字卡拉OK动画
   - 歌词同步

---

### 阶段四：高级功能 (Day 6-7)

**目标：** 完善用户体验

1. **睡眠模式**
   - 定时关闭
   - 播完当前曲

2. **音质检测**
   - 根据格式/码率分级
   - 标签显示

3. **搜索功能**
   - 实时过滤
   - 搜索历史

4. **桌面歌词浮窗** (PWA)
   - PiP/Popup API
   - 歌词同步

---

### 阶段五：Capacitor 打包 (Day 8)

**目标：** 打包 Android APK

1. **Capacitor 配置**
   - 添加 Android 平台
   - 配置权限
   - 前台 Service

2. **原生桥接**
   - 文件系统访问
   - 媒体会话
   - 通知栏控制

3. **构建测试**
   - Debug APK 构建
   - 功能验证

---

## 文件结构

```
src/
├── types/          # TypeScript 类型定义
│   ├── song.ts
│   ├── eq.ts
│   └── lyrics.ts
├── lib/            # 核心库
│   ├── db.ts       # IndexedDB 封装
│   ├── scanner.ts  # 文件扫描
│   ├── audio.ts    # 播放器封装
│   ├── equalizer.ts # 均衡器
│   └── lyrics.ts   # 歌词解析
├── store/          # Zustand 状态
│   ├── player.ts
│   ├── library.ts
│   └── eq.ts
├── components/     # UI 组件
│   ├── Layout.tsx
│   ├── PhoneFrame.tsx
│   ├── MusicBar.tsx
│   ├── Drawer.tsx
│   └── modals/
├── pages/          # 页面
│   ├── Home.tsx
│   ├── Player.tsx
│   ├── Scan.tsx
│   ├── Equalizer.tsx
│   ├── Lyrics.tsx
│   ├── Hidden.tsx
│   └── Search.tsx
├── hooks/          # 自定义 Hooks
│   ├── usePlayer.ts
│   ├── useScanner.ts
│   └── useEqualizer.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## 优先级

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P0 | 音频播放 | 核心功能，必须先实现 |
| P0 | 文件扫描 | 获取音乐文件的唯一途径 |
| P0 | IndexedDB | 持久化存储 |
| P1 | 播放控制 | 播放/暂停/切歌/进度 |
| P1 | 歌曲列表 | 展示扫描结果 |
| P1 | 均衡器 | 音效增强核心 |
| P2 | 歌词系统 | 体验增强 |
| P2 | 睡眠模式 | 辅助功能 |
| P3 | 桌面歌词 | PWA 特有功能 |
| P3 | Capacitor 打包 | 最终发布 |

---

## 验证标准

每个阶段完成后必须：
1. `npm run build` 无错误
2. `npm run dev` 可正常运行
3. 核心功能可演示
4. 代码提交到 git
