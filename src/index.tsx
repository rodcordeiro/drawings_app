import { StatusBar } from 'expo-status-bar';
import { Navigation } from './routes';
import { ReferenceHook } from './hooks/references';

export default function Drawings() {
  return (
    <ReferenceHook>
      <Navigation />
      <StatusBar style="auto" />
    </ReferenceHook>
  );
}
