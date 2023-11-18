import React from 'react';
import { View, Dimensions, Text, StyleSheet, Image } from 'react-native';

import { references } from './utils/images';

const { height, width } = Dimensions.get('window');

const Home: React.FC<ScreenProps<'Home'>> = () => {
  const [clock, setClock] = React.useState<number>(5000);

  const [hideMessage, setHideMessage] = React.useState<boolean>(false);
  const [image, setImage] = React.useState<string>(
    references[Math.floor(Math.random() * references.length)],
  );

  console.log(references, references.length);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setClock((prev) => {
        if (prev - 1 === 0) {
          setHideMessage(false);
          setImage(references[Math.floor(Math.random() * references.length)]);
          return 5000;
        }
        if (prev < 4900) setHideMessage(true);
        return --prev;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.clock}>{clock}</Text>
      {!hideMessage && (
        <Text
          style={[
            styles.clock,
            {
              left: 10,
              top: 70,
              width: width * 0.9,
            },
          ]}>
          Tente fazer este desenho no seu estilo, o tempo contando é quanto
          tempo você tem antes de trocar a imagem.
        </Text>
      )}
      <Image
        source={{
          uri: image,
        }}
        width={width}
        height={height}
        resizeMode="contain"
      />
    </View>
  );
};

export default React.memo(Home);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clock: {
    top: 50,
    left: width / 2,
    position: 'absolute',
  },
});
