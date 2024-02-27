import React from 'react';
import {
  ScrollView,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';

import { useReferences } from '@/hooks/references';

const { width } = Dimensions.get('screen');
const ReferencesScreen: React.FC<ScreenProps<'References'>> = ({
  navigation,
}) => {
  const { references } = useReferences();
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ paddingBottom: 50 }}
    >
      {references.map((reference, idx) => (
        <Pressable
          key={`${idx}_${reference}`}
          onPress={() => navigation.push('Drawing', { image: reference })}
        >
          <Image source={{ uri: reference }} style={styles.image} />
        </Pressable>
      ))}
    </ScrollView>
  );
};

export default React.memo(ReferencesScreen);

const styles = StyleSheet.create({
  container: {
    paddingBottom: 250,
    flexDirection: 'row',
    flexWrap: 'wrap',
    // alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 10,
    marginTop: 100,
  },
  image: {
    width: 180,
    height: 180,
    resizeMode: 'cover',
  },
});
