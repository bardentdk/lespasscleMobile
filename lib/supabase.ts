import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// Remplace par tes VRAIES clés web
const supabaseUrl = 'https://qauhphlxiuwkhoxjaltk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdWhwaGx4aXV3a2hveGphbHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTk4MzgsImV4cCI6MjA5MTYzNTgzOH0.CxQVogzQOOpfeKcTeFTQMSSy9J0zQH9Put2rhr3-obA'; 

// Adaptateur de stockage "SSR-safe" (sécurisé pour le rendu serveur/statique)
const customStorage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return Promise.resolve(null);
      return Promise.resolve(window.localStorage.getItem(key));
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage, // On utilise notre adaptateur au lieu d'AsyncStorage direct
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});