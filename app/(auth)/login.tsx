import { AlertCircle, KeyRound, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
// @ts-ignore
import Logo from "../../assets/images/lespasscles.png";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) return setError("Remplissez tous les champs.");
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError("Identifiants incorrects.");
    setLoading(false);
  };

  const handleReset = async () => {
    if (!email) return setError("Saisissez votre email.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'lespasscle://update-password' });
    if (error) setError(error.message);
    else Alert.alert("Succès", "Email envoyé !");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ 
          flexGrow: 1, 
          justifyContent: 'center', 
          paddingHorizontal: 24, 
          paddingVertical: 40 
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <Image source={Logo} className="h-24 w-48 mb-10" resizeMode="contain" />
          <View className="w-full bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200 border border-gray-100">
            <Text className="text-2xl font-black text-center uppercase tracking-tighter mb-6">Espace <Text className="text-brand-600">Léspass</Text><Text className="text-accent-500">Clé</Text></Text>
            {error && <View className="bg-red-50 p-4 rounded-xl flex-row items-center mb-6"><AlertCircle size={20} color="#ef4444" /><Text className="text-red-700 text-xs font-bold ml-2 flex-1">{error}</Text></View>}
            
            <View className="space-y-4">
              <View>
                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Email</Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3"><Mail size={20} color="#94a3b8" /><TextInput className="flex-1 ml-3 font-medium text-gray-900" placeholder="nom@exemple.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /></View>
              </View>
              <View>
                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Mot de passe</Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3"><KeyRound size={20} color="#94a3b8" /><TextInput className="flex-1 ml-3 font-medium text-gray-900" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry /></View>
              </View>
            </View>

            <TouchableOpacity onPress={handleLogin} disabled={loading} className="bg-brand-600 mt-8 py-4 rounded-2xl flex-row justify-center items-center"><Text className="text-white font-black uppercase tracking-widest mr-2">{loading ? <ActivityIndicator color="#fff" /> : 'Se connecter'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleReset} className="mt-6"><Text className="text-center text-xs font-bold text-brand-600 uppercase">Mot de passe oublié ?</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}