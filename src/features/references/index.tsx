import React from 'react';
import { ScrollView, Image, Pressable, StyleSheet } from 'react-native';

import { useReferences } from '@/hooks/references';

const ReferencesScreen: React.FC<ScreenProps<'References'>> = ({
  navigation,
}) => {
  const { references, getReferencies } = useReferences();

  React.useLayoutEffect(() => {
    getReferencies();
  }, []);

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

export default ReferencesScreen;

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
