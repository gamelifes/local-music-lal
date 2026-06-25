import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const { songs } = useLibraryStore();
  const { playSong, songList } = usePlayerStore();

  const results = query
    ? songs.filter(s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.artist.toLowerCase().includes(query.toLowerCase()) ||
        s.album.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handlePlay = (song: any) => {
    playSong(song, results.length > 0 ? results : songs);
    navigation.navigate('Player');
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.songItem} onPress={() => handlePlay(item)}>
      <View style={styles.songCover}>
        <Text style={styles.songCoverIcon}>♫</Text>
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <Text style={styles.songDuration}>{formatDuration(item.duration)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索歌曲、歌手、专辑..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      {!query && (
        <Text style={styles.emptyText}>输入关键词开始搜索</Text>
      )}
      {query && results.length === 0 && (
        <Text style={styles.emptyText}>无搜索结果</Text>
      )}
      {results.length > 0 && (
        <FlatList
          data={results}
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
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 48,
    color: 'rgba(255,255,255,0.6)',
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
