import React from 'react';
import { View, Dimensions, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DRAWING_TIME } from '@/utils/contants.util';
import { useReferences } from '@/hooks/references';
import { useDrawingTimer } from '@/hooks/useDrawingTimer';
import { formatSeconds } from './utils/drawing.util';

const { height, width } = Dimensions.get('window');

const Drawing: React.FC<ScreenProps<'Drawing'>> = ({ route }) => {
  const { references } = useReferences();
  const { setOptions } = useNavigation();
  const { params } = route;
  const enabled = !params?.image && !params?.disableClock;
  const [image, setImage] = React.useState<string | undefined>(params?.image);
  const timerRef = React.useRef<ReturnType<typeof useDrawingTimer> | null>(null);
  const pickRandom = React.useCallback(() => {
    if (!references?.length) return;
    setImage(references[Math.floor(Math.random() * references.length)]);
  }, [references]);
  const timer = useDrawingTimer({
    durationSeconds: DRAWING_TIME,
    enabled,
    onComplete: () => { pickRandom(); timerRef.current?.reset(true); },
  });
  timerRef.current = timer;
  const resetImage = React.useCallback(() => {
    pickRandom();
    if (enabled) timerRef.current?.reset(true);
  }, [pickRandom, enabled]);
  React.useEffect(() => {
    if (params?.image) { setImage(params.image); return; }
    if (references?.length) pickRandom();
  }, [params?.image, references, pickRandom]);
  React.useLayoutEffect(() => {
    if (params?.image) return;
    setOptions({headerRight: () => <Pressable onPress={resetImage} style={{padding: 15}}><Feather name="refresh-ccw" size={25}/></Pressable>});
  }, [params?.image, resetImage, setOptions]);
  return <View style={styles.container}>
    {enabled && <Text style={[styles.clock, timer.remainingSeconds < DRAWING_TIME * 0.25 ? styles.clockWarningColor : styles.clockColor]}>{formatSeconds(timer.remainingSeconds)}</Text>}
    <Image source={{uri: image}} style={[StyleSheet.absoluteFill, styles.image]} onLoad={() => { if (enabled && timerRef.current?.status === 'paused') timerRef.current.start(); }}/>
  </View>;
};
export default React.memo(Drawing);
const styles = StyleSheet.create({
  container: {justifyContent: 'center', alignItems: 'center'},
  clock: {position: 'absolute', top: 50, left: width / 2 - 28, zIndex: 100, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#f0f0f0af', borderRadius: 5},
  clockColor: {color: 'black'},
  clockWarningColor: {color: '#d33', transform: [{scale: 1.5}]},
  image: {width, height, resizeMode: 'contain'},
});
