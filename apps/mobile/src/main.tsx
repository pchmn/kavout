import '@/core/i18n';

import { UiProvider } from '@kavout/react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { firebase } from '@react-native-firebase/functions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AndroidImportance, setNotificationChannelAsync } from 'expo-notifications';
import { preventAutoHideAsync } from 'expo-splash-screen';
import { getSystemTheme } from 'expo-system-theme';
import { Platform } from 'react-native';
import * as Sentry from 'sentry-expo';

import App from './App';

Sentry.init({
  dsn: 'https://2f1bdcf4041c4a1f8aae0f6950e15224@o4504771591274496.ingest.sentry.io/4504774174703616',
  enableInExpoDevelopment: true,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

preventAutoHideAsync();

const queryClient = new QueryClient();

if (__DEV__) {
  firestore().useEmulator('192.168.1.10', 8080);
  auth().useEmulator('http://192.168.1.10:9099');
  firebase.app().functions('europe-west1').useEmulator('192.168.1.10', 5001);
}

if (Platform.OS === 'android') {
  setNotificationChannelAsync('Messages', {
    name: 'Messages',
    importance: AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

export default function Main() {
  const theme = getSystemTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <UiProvider baseColor={theme?.baseColor}>
        <App />
      </UiProvider>
    </QueryClientProvider>
  );
}
