import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { scanFolder, AudioFile } from '../utils/fileSystem';
import { setupPlayer } from '../utils/player';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }: any) {
  const { songList, setSongList, playSong, currentSong } = usePlayerStore();
  const { songs } = useLibraryStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setupPlayer();
  }, []);

  const handleScan = async () => {
    setLoading(true);
    try {
      const scannedSongs = await scanFolder('/storage/emulated/0/Music');
      setSongList(scannedSongs);
    } catch (error) {
      console.error('Scan failed:', error);
    }
    setLoading(false);
  };

  const handlePlay = (song: AudioFile) => {
    playSong(song, songList);
    navigation.navigate('Player');
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: AudioFile }) => {
    const isPlaying = currentSong?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.songItem, isPlaying && styles.songItemActive]}
        onPress={() => handlePlay(item)}
      >
        <View style={styles.songCover}>
          <Text style={styles.songCoverIcon}>♫</Text>
        </View>
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, isPlaying && styles.songTitleActive]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
        </View>
        <Text style={styles.songDuration}>{formatDuration(item.duration)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0A" />
      <View style={styles.header}>
        <Text style={styles.title}>全部歌曲</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Search')}>
            <Text style={styles.iconButtonText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Scan')}>
            <Text style={styles.iconButtonText}>📡</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Equalizer')}>
            <Text style={styles.iconButtonText}>🎛️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
            <Text style={styles.scanButtonText}>
              {loading ? '扫描中...' : '扫描'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#e8b43c" style={styles.loading} />
      ) : (
        <FlatList
          data={songList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0A',
  },
  header: {
    padding: 16,
    backgroundColor: '#1a1a16',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 18,
  },
  scanButton: {
    backgroundColor: '#e8b43c',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  loading: {
    marginTop: 50,
  },
  list: {
    padding: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  songItemActive: {
    backgroundColor: 'rgba(232, 180, 60, 0.1)',
  },
  songCover: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8b43c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  songCoverIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  songTitleActive: {
    color: '#e8b43c',
  },
  songArtist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  songDuration: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
