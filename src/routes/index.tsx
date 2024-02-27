import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../features/home';
import DrawingScreen from '../features/Drawing';
import ReferencesScreen from '../features/references';

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
    </Stack.Navigator>
  </NavigationContainer>
);
