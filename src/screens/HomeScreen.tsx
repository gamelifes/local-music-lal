import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { usePlayerStore } from '../store/playerStore';
import { scanFolder, AudioFile } from '../utils/fileSystem';
import { setupPlayer } from '../utils/player';

export default function HomeScreen({ navigation }: any) {
  const { songList, setSongList, playSong } = usePlayerStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setupPlayer();
  }, []);

  const handleScan = async () => {
    setLoading(true);
    try {
      // Scan Music directory
      const songs = await scanFolder('/storage/emulated/0/Music');
      setSongList(songs);
    } catch (error) {
      console.error('Scan failed:', error);
    }
    setLoading(false);
  };

  const handlePlay = (song: AudioFile) => {
    playSong(song, songList);
    navigation.navigate('Player');
  };

  const renderItem = ({ item }: { item: AudioFile }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handlePlay(item)}
    >
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <Text style={styles.songDuration}>
        {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, '0')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Music Player</Text>
        <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
          <Text style={styles.scanButtonText}>
            {loading ? '扫描中...' : '扫描音乐'}
          </Text>
        </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0A',
  },
  header: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1a1a16',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  scanButton: {
    backgroundColor: '#e8b43c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#000000',
    fontSize: 16,
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
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
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
