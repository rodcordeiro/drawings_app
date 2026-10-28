import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toasts } from '@backpackapp-io/react-native-toast';

import { Navigation } from './routes';
import { ReferenceHook } from './hooks/references';

export default function Drawings() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ReferenceHook>
          <Navigation />
          <Toasts />
          <StatusBar style="auto" />
        </ReferenceHook>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
