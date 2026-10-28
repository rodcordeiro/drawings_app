import React from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useDrawingTimer } from '@/hooks/useDrawingTimer';
import { useUnsplashSession } from '@/hooks/useUnsplashSession';
import { loadUnsplashSettings, type UnsplashSettings } from '@/stores/unsplashSettings';
import { formatSeconds } from '@/features/Drawing/utils/drawing.util';

function ZoomablePhoto({uri, onLoad, onError}: {uri: string; onLoad: () => void; onError: () => void}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const pinch = Gesture.Pinch().onUpdate(event => { scale.value = Math.max(1, Math.min(5, savedScale.value * event.scale)); }).onEnd(() => { savedScale.value = scale.value; });
  const pan = Gesture.Pan().onUpdate(event => {
    if (scale.value > 1) { tx.value = savedX.value + event.translationX; ty.value = savedY.value + event.translationY; }
  }).onEnd(() => { savedX.value = tx.value; savedY.value = ty.value; });
  const style = useAnimatedStyle(() => ({transform: [{translateX: tx.value}, {translateY: ty.value}, {scale: scale.value}]}));
  return <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
    <Animated.View style={[styles.image, style]}><Image source={{uri}} resizeMode="contain" style={styles.image} onLoad={onLoad} onError={onError}/></Animated.View>
  </GestureDetector>;
}

export default function UnsplashTrainingScreen() {
  const [settings, setSettings] = React.useState<UnsplashSettings>();
  const [durationText, setDurationText] = React.useState('');
  const session = useUnsplashSession(settings);
  const sessionRef = React.useRef(session);
  sessionRef.current = session;
  const timer = useDrawingTimer({
    durationSeconds: settings?.timerDurationSeconds ?? 60,
    enabled: !!settings?.timerEnabled,
    onComplete: () => { const current = sessionRef.current; if (settings) void current.next(settings); },
  });
  const timerRef = React.useRef(timer);
  timerRef.current = timer;
  React.useEffect(() => {
    let active = true;
    loadUnsplashSettings().then(config => { if (active) { setSettings(config); setDurationText(String(config.timerDurationSeconds)); } });
    return () => { active = false; };
  }, []);
  React.useEffect(() => {
    if (session.status !== 'ready') timerRef.current.pause();
  }, [session.status]);
  React.useEffect(() => {
    if (session.readyGeneration > 0) timerRef.current.reset(!!settings?.timerEnabled);
  }, [session.readyGeneration]);
  const changeDuration = () => {
    if (!settings) return;
    const value = Number(durationText);
    if (!Number.isInteger(value) || value < 10 || value > 7200) {
      Alert.alert('Duração inválida', 'Informe um valor de 10 a 7200 segundos.');
      setDurationText(String(settings.timerDurationSeconds));
      return;
    }
    setSettings({...settings, timerDurationSeconds: value});
    timer.setDuration(value, session.status === 'ready' && settings.timerEnabled);
  };
  const advance = () => {
    if (!settings || session.status === 'waiting_next' || session.status === 'transitioning' || session.status === 'loading_initial') return;
    timer.pause();
    void session.next(settings);
  };
  const showCredits = () => {
    const photo = session.currentPhoto;
    if (!photo) return;
    Alert.alert('Fotografia de ' + photo.photographerName, 'Unsplash', [
      {text: 'Fotógrafo', onPress: () => { void Linking.openURL(photo.photographerUrl); }},
      {text: 'Fotografia', onPress: () => { void Linking.openURL(photo.photoUrl); }},
      {text: 'Fechar', style: 'cancel'},
    ]);
  };
  const busy = session.status === 'waiting_next' || session.status === 'transitioning' || session.status === 'loading_initial';
  return <GestureHandlerRootView style={styles.container}>
    {session.currentPhoto && <ZoomablePhoto key={session.currentPhoto.id} uri={session.currentPhoto.imageUrl}
      onLoad={() => { if (settings) session.markLoaded(settings, session.currentPhoto!.id); }}
      onError={() => session.markFailed(session.currentPhoto!.id)}/>}
    {busy && <View style={styles.loader}><ActivityIndicator size="large" color="#fff"/><Text style={styles.white}>Carregando fotografia...</Text></View>}
    {!!session.notice && <Text style={styles.notice}>{session.notice}</Text>}
    {!!session.error && <View style={styles.message}><Text>{session.error}</Text><Pressable onPress={() => { if (settings) void session.retry(settings); }}><Text style={styles.link}>Tentar novamente</Text></Pressable></View>}
    <View style={styles.controls}>
      {settings?.timerEnabled && <>
        <Text style={styles.label}>{formatSeconds(timer.remainingSeconds)}</Text>
        <Pressable disabled={session.status !== 'ready'} onPress={() => timer.status === 'running' ? timer.pause() : timer.resume()}><Text style={styles.link}>{timer.status === 'running' ? 'Pausar' : 'Retomar'}</Text></Pressable>
        <Pressable disabled={session.status !== 'ready'} onPress={() => timer.reset(true)}><Text style={styles.link}>Reiniciar</Text></Pressable>
      </>}
      <Pressable disabled={busy} onPress={advance}><Text style={styles.link}>Próxima</Text></Pressable>
      <Pressable onPress={showCredits}><Text style={styles.link}>Créditos</Text></Pressable>
      <TextInput style={styles.input} keyboardType="number-pad" value={durationText} onChangeText={setDurationText} placeholder="Segundos"/>
      <Pressable onPress={changeDuration}><Text style={styles.link}>Aplicar tempo</Text></Pressable>
    </View>
  </GestureHandlerRootView>;
}
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#111', justifyContent: 'center', overflow: 'hidden'},
  image: {width: '100%', height: '100%'},
  loader: {position: 'absolute', alignSelf: 'center', alignItems: 'center', gap: 8},
  white: {color: 'white'}, notice: {position: 'absolute', top: 85, alignSelf: 'center', color: '#fff', backgroundColor: '#333', padding: 8},
  controls: {position: 'absolute', bottom: 25, left: 12, right: 12, padding: 12, borderRadius: 8, backgroundColor: '#eee', flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'center'},
  link: {color: '#245bb0', fontWeight: '600', padding: 4}, label: {fontWeight: 'bold'},
  message: {position: 'absolute', top: '35%', alignSelf: 'center', backgroundColor: '#fff', padding: 14, maxWidth: '90%'},
  input: {borderWidth: 1, borderColor: '#888', borderRadius: 4, width: 80, padding: 5},
});
