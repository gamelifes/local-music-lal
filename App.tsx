import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import SearchScreen from './src/screens/SearchScreen';
import ScanScreen from './src/screens/ScanScreen';
import EqualizerScreen from './src/screens/EqualizerScreen';
import { setupPlayer } from './src/utils/player';
import { useLibraryStore } from './src/store/libraryStore';

const Stack = createNativeStackNavigator();

function App() {
  useEffect(() => {
    setupPlayer();
    useLibraryStore.getState().loadSongs();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F0F0A' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen name="Equalizer" component={EqualizerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
