import { StatusBar } from 'expo-status-bar';
import { Navigation } from './routes';

export default function Drawings() {
  return (
    <>
      <Navigation />
      <StatusBar style="auto" />
    </>
  );
}
