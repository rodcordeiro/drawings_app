import React from 'react';
import { View, Dimensions, Text, StyleSheet, Pressable } from 'react-native';

const { width, height } = Dimensions.get('window');

const Home: React.FC<ScreenProps<'Home'>> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Aqui está meu desafio de desenho. Você terá 30 minutos para completar
        este desenho. Lembrando que este desenho serve principalmente como um
        treino, então não se preocupe em deixá-lo igual ou perfeito. A ideia é
        fazer refazer esta referência no seu estilo ou em um novo estilo que
        deseje estudar. Após o fim do tempo, a imagem irá ser substituída.
      </Text>
      <Pressable
        onPress={() => navigation.push('Drawing')}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Começar</Text>
      </Pressable>
    </View>
  );
};

export default React.memo(Home);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width,
    height,
  },
  text: {
    textAlign: 'justify',
    width: width * 0.8,
  },
  button: {
    width: width * 0.8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8A2BE2',
  },
  buttonText: {
    color: 'white',
  },
});
