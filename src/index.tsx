import { StatusBar } from 'expo-status-bar';
import { Navigation } from './routes';
import { ReferenceHook } from './hooks/references';
import { Toasts } from '@backpackapp-io/react-native-toast';

export default function Drawings() {
  return (
    <ReferenceHook>
      <Navigation />
      <Toasts />
      <StatusBar style="auto" />
    </ReferenceHook>
  );
}
