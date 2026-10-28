import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../features/home';
import DrawingScreen from '../features/Drawing';
import ReferencesScreen from '../features/references';
import UnsplashTrainingScreen from '../features/unsplash';
import UnsplashSettingsScreen from '../features/settings';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const Navigation = () => (
  <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        // headerShown: false,
        headerTransparent: true,
        headerTitle: '',
      }}
      initialRouteName="Home"
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Drawing" component={DrawingScreen} />
      <Stack.Screen name="References" component={ReferencesScreen} />
      <Stack.Screen name="Unsplash" component={UnsplashTrainingScreen} />
      <Stack.Screen name="UnsplashSettings" component={UnsplashSettingsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);
