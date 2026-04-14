import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';

// Comportement de la notification quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(userId?: string) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!userId) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // On sauvegarde le token dans le profil Supabase pour pouvoir lui envoyer des pushs depuis le web
        supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId).then();
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification touchée :", response);
    });

    return () => {
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [userId]);

  return { expoPushToken };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'LéspassClés',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#006eb8',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return undefined;

    try {
      // Pour Expo Go, pas besoin de projectId explicite, ça marchera tout seul
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } catch (e) {
      console.log("Erreur récupération token push", e);
    }
  }

  return token;
}