import React from 'react';
import {
  View,
  Dimensions,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { DRAWING_TIME } from '@/utils/contants.util';
import { useReferences } from '@/hooks/references';

import { formatSeconds } from './utils/drawing.util';

const { height, width } = Dimensions.get('window');

const Drawing: React.FC<ScreenProps<'Drawing'>> = ({ route }) => {
  const { references } = useReferences();
  const { setOptions } = useNavigation();
  const { params } = route;
  const [clock, setClock] = React.useState<number>(DRAWING_TIME);
  const [image, setImage] = React.useState<string>();

  function setRandomImage() {
    setImage(references![Math.floor(Math.random() * references!.length)]);
  }

  function resetImage() {
    setRandomImage();
    setClock((prev) => (prev === -1 ? -1 : DRAWING_TIME));
  }

  React.useLayoutEffect(() => {
    if (params?.image) {
      setImage(params.image);
      setClock(-1);
      return;
    }

    if (!image) setRandomImage();
    setOptions({
      headerRight: () => (
        <Pressable
          onPress={resetImage}
          style={{
            padding: 15,
          }}
        >
          <Feather name="refresh-ccw" size={25} />
        </Pressable>
      ),
    });

    if (params?.disableClock) {
      setClock(-1);
      return;
    }

    const interval = setInterval(() => {
      setClock((prev) => {
        if (prev - 1 === 0) {
          setRandomImage();
          return DRAWING_TIME;
        }
        return --prev;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [references, params]);

  return (
    <View style={styles.container}>
      {clock !== -1 && (
        <Text
          style={[
            styles.clock,
            clock < DRAWING_TIME * 0.25
              ? styles.clockWarningColor
              : styles.clockColor,
          ]}
        >
          {formatSeconds(clock)}
        </Text>
      )}
      <Image
        source={{
          uri: image,
        }}
        style={[StyleSheet.absoluteFill, styles.image]}
      />
    </View>
  );
};

export default React.memo(Drawing);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clock: {
    position: 'absolute',
    top: 50,
    left: width / 2 - 28,
    zIndex: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f0f0f0af',
    borderRadius: 5,
  },
  clockColor: { color: 'black' },
  clockWarningColor: { color: '#d33', transform: [{ scale: 1.5 }] },
  image: {
    width,
    height,
    resizeMode: 'contain',
  },
});
