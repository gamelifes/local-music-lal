import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import TrackPlayer, { useProgress, Event } from 'react-native-track-player';
import { usePlayerStore } from '../store/playerStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PlayerScreen({ navigation }: any) {
  const { currentSong, isPlaying, togglePlay, nextSong, prevSong, repeatMode, setRepeatMode, lyrics, activeLine, setActiveLine, activeWord, setActiveWord } = usePlayerStore();
  const { position, duration } = useProgress();

  const vinylRotation = useRef(new Animated.Value(0)).current;
  const lyricsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(vinylRotation, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      vinylRotation.stopAnimation();
    }
  }, [isPlaying]);

  useEffect(() => {
    Animated.timing(lyricsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [activeLine]);

  useEffect(() => {
    const setup = async () => {
      await TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
        usePlayerStore.getState().updateProgress(event.position, event.duration);
      });
    };
    setup();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const toggleRepeat = () => {
    const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return '↻₁';
      case 'all':
        return '↻';
      default:
        return '↻';
    }
  };

  const spin = vinylRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentSong?.title || 'No Song'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.coverContainer}>
        <Animated.View style={[styles.cover, { transform: [{ rotate: spin }] }]}>
          <Text style={styles.coverIcon}>♫</Text>
        </Animated.View>
      </View>

      <Text style={styles.artistName}>{currentSong?.artist || 'Unknown Artist'}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(position / duration) * 100 || 0}%` }]} />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleRepeat} style={styles.controlButton}>
          <Text style={[styles.controlIcon, repeatMode !== 'none' && styles.activeIcon]}>
            {getRepeatIcon()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={prevSong} style={styles.controlButton}>
          <Text style={styles.controlIcon}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={nextSong} style={styles.controlButton}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>

        <View style={{ width: 40 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0A',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  backButton: {
    fontSize: 24,
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  coverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cover: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  coverIcon: {
    fontSize: 64,
    color: '#e8b43c',
  },
  artistName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 30,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e8b43c',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 30,
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeIcon: {
    color: '#e8b43c',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e8b43c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 28,
    color: '#ffffff',
  },
});
