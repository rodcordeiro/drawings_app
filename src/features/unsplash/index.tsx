import React from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { getRandomPhoto, type UnsplashPhoto } from '@/services/unsplash';
import { loadUnsplashSettings, type UnsplashSettings } from '@/stores/unsplashSettings';
import { useDrawingTimer } from '@/hooks/useDrawingTimer';

export default function UnsplashTrainingScreen() {
  const [settings, setSettings] = React.useState<UnsplashSettings>();
  const [photo, setPhoto] = React.useState<UnsplashPhoto>();
  const [nextPhoto, setNextPhoto] = React.useState<UnsplashPhoto>();
  const [loading, setLoading] = React.useState(true);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [error, setError] = React.useState('');
  const seen = React.useRef(new Set<string>());
  const busy = React.useRef(false);
  const alive = React.useRef(true);
  const timer = useDrawingTimer({durationSeconds: settings?.timerDurationSeconds ?? 60, enabled: !!settings?.timerEnabled, onComplete: () => { void advance(); }});
  const timerRef = React.useRef(timer);
  timerRef.current = timer;
  const fetchUnique = React.useCallback(async (config: UnsplashSettings) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = await getRandomPhoto({contentFilter: config.contentFilter});
      if (!seen.current.has(candidate.id)) return candidate;
    }
    throw new Error('Não foi possível encontrar outra fotografia.');
  }, []);
  React.useEffect(() => {
    alive.current = true;
    loadUnsplashSettings().then(async config => {
      if (!alive.current) return;
      setSettings(config);
      try {
        const initial = await fetchUnique(config);
        if (alive.current) { seen.current.add(initial.id); setPhoto(initial); setLoading(false); }
      } catch (e) { if (alive.current) { setError(e instanceof Error ? e.message : 'Falha ao carregar fotografia.'); setLoading(false); } }
    });
    return () => { alive.current = false; };
  }, [fetchUnique]);
  const advance = async () => {
    if (!settings || busy.current) return;
    busy.current = true;
    timerRef.current.pause();
    setLoading(true);
    try {
      const candidate = nextPhoto && !seen.current.has(nextPhoto.id) ? nextPhoto : await fetchUnique(settings);
      if (!alive.current) return;
      setNextPhoto(undefined);
      seen.current.add(candidate.id);
      setImageLoaded(false);
      setPhoto(candidate);
      setError('');
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'Falha ao carregar.'); }
    finally { if (alive.current) setLoading(false); busy.current = false; }
  };
  React.useEffect(() => {
    if (!settings || !photo || nextPhoto) return;
    let cancelled = false;
    fetchUnique(settings).then(candidate => { if (!cancelled && alive.current && candidate.id !== photo.id) setNextPhoto(candidate); }).catch(() => {});
    return () => { cancelled = true; };
  }, [settings, photo, nextPhoto, fetchUnique]);
  const ready = () => { setImageLoaded(true); timerRef.current.reset(!!settings?.timerEnabled); };
  return <View style={styles.container}>
    {photo && <Image source={{uri: photo.imageUrl}} style={styles.image} resizeMode="contain" onLoad={ready} onError={() => { setError('Falha ao carregar a imagem.'); timerRef.current.pause(); }}/>}
    {(loading || !photo) && <ActivityIndicator size="large" style={styles.loader}/>}
    {!!error && <View style={styles.message}><Text>{error}</Text><Pressable onPress={() => void advance()}><Text style={styles.link}>Tentar novamente</Text></Pressable></View>}
    <View style={styles.controls}>
      {settings?.timerEnabled && <><Text style={styles.label}>{timer.remainingSeconds}s</Text><Pressable onPress={() => timer.status === 'running' ? timer.pause() : timer.resume()}><Text style={styles.link}>{timer.status === 'running' ? 'Pausar' : 'Retomar'}</Text></Pressable><Pressable onPress={() => timer.reset(imageLoaded)}><Text style={styles.link}>Reiniciar</Text></Pressable></>}
      <Pressable disabled={loading} onPress={() => void advance()}><Text style={styles.link}>Próxima</Text></Pressable>
      {!!photo && <Pressable onPress={() => Alert.alert('Fotografia', 'Por ' + photo.photographerName, [
        {text: 'Fotógrafo', onPress: () => void Linking.openURL(photo.photographerUrl)},
        {text: 'Unsplash', onPress: () => void Linking.openURL(photo.photoUrl)}, {text: 'Fechar'}
      ])}><Text style={styles.link}>Créditos</Text></Pressable>}
    </View>
  </View>;
}
const styles = StyleSheet.create({container: {flex: 1, backgroundColor: '#111', justifyContent: 'center'}, image: {width: '100%', height: '100%'}, loader: {position: 'absolute', alignSelf: 'center'}, controls: {position: 'absolute', bottom: 30, left: 12, right: 12, padding: 12, borderRadius: 8, backgroundColor: '#eee', flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'center'}, link: {color: '#245bb0', fontWeight: '600'}, label: {fontWeight: 'bold'}, message: {position: 'absolute', alignSelf: 'center', backgroundColor: '#fff', padding: 14}});
