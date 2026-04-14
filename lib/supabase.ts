import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Remplace par tes VRAIES clés web
const supabaseUrl = 'https://qauhphlxiuwkhoxjaltk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdWhwaGx4aXV3a2hveGphbHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTk4MzgsImV4cCI6MjA5MTYzNTgzOH0.CxQVogzQOOpfeKcTeFTQMSSy9J0zQH9Put2rhr3-obA'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
