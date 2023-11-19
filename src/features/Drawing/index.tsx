import React from 'react';
import { View, Dimensions, Text, StyleSheet, Image } from 'react-native';

import { DRAWING_TIME } from '@/utils/contants.util';
import { GetDrawingReferences } from './api/drawing.api';
import { formatSeconds } from './utils/drawing.util';

const { height, width } = Dimensions.get('window');

const Drawing: React.FC<ScreenProps<'Drawing'>> = () => {
  const [clock, setClock] = React.useState<number>(DRAWING_TIME);
  const [references, setReferences] = React.useState<string[]>();
  const [image, setImage] = React.useState<string>(
    'https://i.pinimg.com/564x/d0/66/37/d0663796be02de85bed2f9f60aa5e688.jpg',
  );

  React.useLayoutEffect(() => {
    if (!references)
      GetDrawingReferences()
        .then((response) => {
          setReferences(response);
          setImage(response[Math.floor(Math.random() * response.length)]);
        })
        .catch((response) => {
          setReferences(response);
          setImage(response[Math.floor(Math.random() * response.length)]);
        });

    const interval = setInterval(() => {
      setClock((prev) => {
        if (prev - 1 === 0) {
          setImage(references![Math.floor(Math.random() * references!.length)]);
          return DRAWING_TIME;
        }
        return --prev;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={styles.container}>
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
    left: width / 2 - 10,
  },
  clockWarningColor: { color: 'black' },
  clockColor: { color: '#d33' },
  image: {
    width,
    height,
    resizeMode: 'contain',
  },
});
