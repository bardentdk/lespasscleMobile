import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, Search, UserPlus, Mail, Shield, Trash2, X, Check, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AdminUsers() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'formateur' | 'apprenant'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('last_name');

    if (error) console.error(error);
    else setUsers(data || []);
    setLoading(false);
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const roles: ('admin' | 'formateur' | 'apprenant')[] = ['admin', 'formateur', 'apprenant'];
    
    Alert.alert(
      "Changer le rôle",
      "Sélectionnez le nouveau rôle pour cet utilisateur :",
      roles.map(role => ({
        text: role.toUpperCase(),
        onPress: async () => {
          const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
          if (!error) fetchUsers();
        }
      }))
    );
  };

  const handleDelete = (userId: string, name: string) => {
    Alert.alert(
      "Supprimer l'utilisateur",
      `Êtes-vous sûr de vouloir supprimer le profil de ${name} ? Cette action est définitive.`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive", 
          onPress: async () => {
            // Note: Dans une vraie app, il faudrait aussi supprimer l'utilisateur de Auth (via Edge Function)
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (!error) fetchUsers();
          } 
        }
      ]
    );
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.role === filter;
    return matchSearch && matchFilter;
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* HEADER */}
      <View style={{ paddingTop: Math.max(insets.top, 10) }} className="bg-white pb-4 px-4 border-b border-gray-100 shadow-sm z-10">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2 bg-gray-50 rounded-xl">
            <ChevronLeft size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="font-black text-gray-900 text-lg flex-1">Équipe & Stagiaires</Text>
        </View>

        {/* BARRE DE RECHERCHE */}
        <View className="relative mb-2">
          <View className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
            <Search size={18} color="#94a3b8" />
          </View>
          <TextInput
            placeholder="Nom, prénom ou email..."
            value={search}
            onChangeText={setSearch}
            className="bg-gray-100 rounded-2xl pl-12 pr-4 py-3 font-medium text-gray-900"
          />
        </View>

        {/* FILTRES RAPIDES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mt-2">
          {['all', 'admin', 'formateur', 'apprenant'].map((f) => (
            <TouchableOpacity 
              key={f} 
              onPress={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full mr-2 border ${filter === f ? 'bg-brand-600 border-brand-600' : 'bg-white border-gray-200'}`}
            >
              <Text className={`text-[10px] font-black uppercase tracking-widest ${filter === f ? 'text-white' : 'text-gray-500'}`}>
                {f === 'all' ? 'Tous' : f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {loading ? (
          <ActivityIndicator color="#006eb8" className="mt-10" />
        ) : filteredUsers.length === 0 ? (
          <Text className="text-center text-gray-400 font-medium mt-10 italic">Aucun utilisateur trouvé.</Text>
        ) : (
          filteredUsers.map((item) => (
            <View key={item.id} className="bg-white p-5 rounded-[32px] mb-4 border border-gray-100 shadow-sm">
              <View className="flex-row items-center mb-4">
                <View className="h-12 w-12 bg-brand-50 rounded-2xl items-center justify-center mr-4">
                  <Text className="text-brand-600 font-black text-lg">{item.first_name[0]}{item.last_name[0]}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-black text-gray-900 text-base">{item.first_name} {item.last_name}</Text>
                  <View className="flex-row items-center mt-0.5">
                    <Shield size={10} color={item.role === 'admin' ? '#9333ea' : item.role === 'formateur' ? '#006eb8' : '#f59e0b'} />
                    <Text className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">{item.role}</Text>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center bg-gray-50 p-3 rounded-2xl mb-4">
                <Mail size={14} color="#94a3b8" />
                <Text className="text-gray-600 text-xs font-medium ml-2">{item.email}</Text>
              </View>

              <View className="flex-row space-x-3">
                <TouchableOpacity 
                  onPress={() => handleChangeRole(item.id, item.role)}
                  className="flex-1 bg-white border border-gray-200 py-3 rounded-xl items-center"
                >
                  <Text className="text-gray-700 text-[10px] font-black uppercase tracking-widest">Modifier Rôle</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDelete(item.id, `${item.first_name} ${item.last_name}`)}
                  className="p-3 bg-red-50 rounded-xl"
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}