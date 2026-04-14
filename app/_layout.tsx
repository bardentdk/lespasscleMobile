import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';

// 🚨 LE GARDIEN DE NAVIGATION
function AuthGuard() {
  const { session, isLoading } = useAuth();
  const segments = useSegments(); // Permet de savoir sur quelle page on est
  const router = useRouter();

  useEffect(() => {
    // 1. On attend que l'appli ait fini de vérifier le statut (AsyncStorage)
    if (isLoading) return;

    // 2. On analyse l'URL actuelle
    const inAuthGroup = segments[0] === '(auth)';
    const isUpdatePasswordPage = segments[0] === 'update-password';
    const isRoot = segments.length === 0;

    // 3. Les règles de téléportation automatique
    if (session && inAuthGroup) {
      // Cas A : L'utilisateur vient de se connecter et est encore sur la page Login
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup && !isUpdatePasswordPage && !isRoot) {
      // Cas B : L'utilisateur vient de se déconnecter et traîne dans le Dashboard
      router.replace('/(auth)/login');
    }
  }, [session, isLoading, segments]);

  // On retourne la hiérarchie normale de tes pages
  return <Stack screenOptions={{ headerShown: false }} />;
}

// LE LAYOUT PRINCIPAL
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          {/* On enveloppe notre app dans le Gardien */}
          <AuthGuard />
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}