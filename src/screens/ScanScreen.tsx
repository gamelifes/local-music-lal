import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLibraryStore } from '../store/libraryStore';
import { scanFolder } from '../utils/fileSystem';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanScreen({ navigation }: any) {
  const { songs, addSongs } = useLibraryStore();
  const [scanning, setScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const handleScan = async () => {
    setScanning(true);
    setScannedCount(0);
    setCompleted(false);

    try {
      const songs = await scanFolder('/storage/emulated/0/Music');
      setScannedCount(songs.length);
      await addSongs(songs);
      setCompletedCount(songs.length);
      setCompleted(true);
    } catch (error) {
      Alert.alert('扫描失败', '无法访问音乐文件夹');
    }

    setScanning(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>扫描音乐</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>{completed ? '✅' : scanning ? '📡' : '📁'}</Text>
        <Text style={styles.title}>
          {completed ? '扫描完成' : scanning ? '正在扫描...' : '扫描音乐文件夹'}
        </Text>
        <Text style={styles.subtitle}>
          {completed
            ? `共发现 ${completedCount} 首歌曲`
            : scanning
              ? `已发现 ${scannedCount} 首歌曲`
              : '点击下方按钮开始扫描'}
        </Text>

        {scanning && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color="#e8b43c" />
          </View>
        )}

        <View style={styles.buttonContainer}>
          {completed ? (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
                <Text style={styles.primaryButtonText}>查看歌曲</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleScan}>
                <Text style={styles.secondaryButtonText}>重新扫描</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, scanning && styles.disabledButton]}
              onPress={handleScan}
              disabled={scanning}
            >
              <Text style={styles.primaryButtonText}>
                {scanning ? '扫描中...' : '开始扫描'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a16',
  },
  backButton: {
    fontSize: 24,
    color: '#ffffff',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#e8b43c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
