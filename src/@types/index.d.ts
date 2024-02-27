import type { NativeStackScreenProps } from '@react-navigation/native-stack';

declare global {
  type RootStackParamList = {
    Home: undefined;
    Drawing?: {
      image?: string;
      disableClock?: boolean;
    };
    References: undefined;
    RandomScreen: undefined;
  };

  type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
    RootStackParamList,
    T
  >;
}
