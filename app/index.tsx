import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RootIndex() {
  // 1. On récupère BIEN session et isLoading ici
  const { session, isLoading } = useAuth();

  // 2. On log pour débugger dans le terminal
  console.log("État actuel - Session:", !!session, "Chargement:", isLoading);

  // 3. Pendant le chargement, on affiche la roue
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#006eb8' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // 4. LA REDIRECTION : 
  // Si session est true -> Dashboard
  // Si session est false -> Login
  return session ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}