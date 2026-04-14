import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, LogOut } from 'lucide-react-native';

export default function Profile() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: async () => { setLoggingOut(true); await supabase.auth.signOut(); } }
    ]);
  };

  if (!user?.profile) return null;

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="bg-brand-600 pb-8 px-6 rounded-b-[40px] items-center">
        <View className="h-24 w-24 rounded-full bg-white items-center justify-center mb-4"><Text className="text-3xl font-black text-brand-600">{user.profile.first_name[0]}{user.profile.last_name[0]}</Text></View>
        <Text className="text-white text-2xl font-black uppercase tracking-tighter">{user.profile.first_name} {user.profile.last_name}</Text>
      </View>
      <ScrollView className="flex-1 px-6 pt-8">
        <View className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-8">
          <View className="flex-row items-center p-5 border-b border-gray-50"><View className="bg-brand-50 p-3 rounded-2xl mr-4"><Mail size={20} color="#006eb8" /></View><View><Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</Text><Text className="font-bold text-gray-900 mt-1">{user.profile.email}</Text></View></View>
          <View className="flex-row items-center p-5"><View className="bg-brand-50 p-3 rounded-2xl mr-4"><Shield size={20} color="#006eb8" /></View><View><Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rôle</Text><Text className="font-bold text-gray-900 mt-1 capitalize">{user.profile.role}</Text></View></View>
        </View>
        <TouchableOpacity onPress={handleLogout} disabled={loggingOut} className="bg-red-50 p-4 rounded-2xl flex-row justify-center items-center border border-red-100">
          {loggingOut ? <ActivityIndicator color="#ef4444" /> : <><LogOut size={20} color="#ef4444" /><Text className="text-red-600 font-black uppercase tracking-widest ml-2 text-sm">Se déconnecter</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}