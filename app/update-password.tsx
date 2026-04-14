import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { KeyRound, ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleUpdate = async () => {
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      Alert.alert('Erreur', "La mise à jour a échoué. Le lien est peut-être expiré.");
      setLoading(false);
    } else {
      Alert.alert('Succès', "Mot de passe enregistré ! Vous êtes connecté.");
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-gray-50">
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="flex-1 px-6 justify-center">
        
        <View className="items-center mb-10">
          <View className="h-20 w-20 bg-brand-50 rounded-full items-center justify-center mb-6">
            <ShieldCheck size={40} color="#006eb8" />
          </View>
          <Text className="text-3xl font-black text-center text-gray-900 tracking-tight">Bienvenue !</Text>
          <Text className="text-center text-gray-500 mt-2 font-medium">Veuillez définir votre mot de passe pour sécuriser votre compte.</Text>
        </View>

        <View className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Nouveau mot de passe</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 mb-6">
            <KeyRound size={20} color="#94a3b8" />
            <TextInput
              className="flex-1 ml-3 font-medium text-gray-900"
              placeholder="Minimum 6 caractères"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            onPress={handleUpdate} 
            disabled={loading} 
            className="bg-brand-600 py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-brand-200"
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase tracking-widest">Enregistrer & Démarrer</Text>}
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}