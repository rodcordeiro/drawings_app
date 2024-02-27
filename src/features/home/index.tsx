import React from 'react';
import { View, Dimensions, Text, StyleSheet, Pressable } from 'react-native';

import Album from '../../assets/album.svg';
import Random from '../../assets/random.svg';
import Clock from '../../assets/clock.svg';
import { version } from '@/../package.json';

const { width, height } = Dimensions.get('window');

const Home: React.FC<ScreenProps<'Home'>> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, { backgroundColor: '#7db1b1' }]}
        onPress={() => navigation.push('References')}
      >
        <Text style={styles.buttonText}>Referências</Text>
        <Album style={styles.image} />
      </Pressable>
      <Pressable
        style={[styles.button, { backgroundColor: '#8A2BE2' }]}
        onPress={() => navigation.push('Drawing', { disableClock: true })}
      >
        <Text style={styles.buttonText}>Aleatório</Text>
        <Random style={styles.image} />
      </Pressable>
      <Pressable
        style={[styles.button, { backgroundColor: '#e0c341' }]}
        onPress={() => navigation.push('Drawing')}
      >
        <Text style={styles.buttonText}>Contagem regressiva</Text>
        <Clock style={[styles.image, { right: -15, top: -10 }]} />
      </Pressable>
      {/* <Pressable style={[styles.button, { backgroundColor: '#8A2BE2' }]}>
        <Text style={styles.buttonText}>Configurações</Text>
      </Pressable> */}
      <Text style={styles.version}>v{version}</Text>
    </View>
  );
};

export default React.memo(Home);

const styles = StyleSheet.create({
  container: {
    width,
    height,
    padding: 20,
    alignItems: 'center',
    marginTop: 40,
  },
  image: {
    width: 80,
    height: 80,
    position: 'absolute',
    right: -10,
    top: 0,
    opacity: 0.65,
    transform: [
      {
        rotate: '-45deg',
      },
    ],
  },
  button: {
    width: width * 0.85,
    height: 100,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    justifyContent: 'flex-end',
    // alignItems: 'center',
    backgroundColor: '#8A2BE2',
    borderRadius: 5,
    overflow: 'hidden',
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '200',
  },
  version: {
    position: 'absolute',
    bottom: 10,
    fontSize: 14,
    color: '#6e6e6e',
  },
});
