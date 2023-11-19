import React from 'react';
import { View, Dimensions, Text, StyleSheet, Pressable } from 'react-native';

import { DRAWING_TIME } from '@/utils/contants.util';

const { width } = Dimensions.get('window');

const Home: React.FC<ScreenProps<'Home'>> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text>
        Aqui está meu desafio de desenho. Você terá {DRAWING_TIME} segundos para
        completar este desenho. Lembrando que este desenho serve principalmente
        como um treino, então não se preocupe em deixá-lo igual ou perfeito. A
        ideia é fazer refazer esta referência no seu estilo ou em um novo estilo
        que deseje estudar. Após o fim do tempo, a imagem irá ser substituída.
      </Text>
      <Pressable onPress={() => navigation.push('Drawing')}>
        <Text>Começar</Text>
      </Pressable>
    </View>
  );
};

export default React.memo(Home);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textAlign: 'justify',
    width: width / 3,
  },
  button: {
    width: width / 3,
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
