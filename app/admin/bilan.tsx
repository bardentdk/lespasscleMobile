import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, Search, TrendingUp, Clock, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface BilanApprenant {
  id: string;
  first_name: string;
  last_name: string;
  totalHeures: number;
  objectifHeures: number;
  progression: number;
}

export default function AdminBilan() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [bilans, setBilans] = useState<BilanApprenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBilans();
  }, []);

  const fetchBilans = async () => {
    setLoading(true);
    try {
      // 1. Récupérer tous les apprenants
      const { data: profils } = await supabase.from('profiles').select('id, first_name, last_name').eq('role', 'apprenant');
      
      // 2. Récupérer toutes les présences validées
      const { data: presences } = await supabase.from('presences').select('apprenant_id, heures_validees').eq('status', 'present');
      
      // 3. Récupérer les objectifs d'heures via les groupes
      const { data: groupesData } = await supabase.from('groupes_apprenants').select('apprenant_id, groupes(objectif_heures)');

      if (!profils) return;

      const stats = profils.map(profil => {
        // Calcul des heures
        const heuresEleve = presences?.filter(p => p.apprenant_id === profil.id).reduce((acc, curr) => acc + (Number(curr.heures_validees) || 0), 0) || 0;
        
        // Récupération de l'objectif (150h par défaut)
        const groupeInfo = groupesData?.find(g => g.apprenant_id === profil.id);
        const objectif = groupeInfo?.groupes?.objectif_heures || 150;
        
        // Progression (max 100%)
        const progression = Math.min(100, (heuresEleve / objectif) * 100);

        return {
          ...profil,
          totalHeures: heuresEleve,
          objectifHeures: objectif,
          progression: Math.round(progression)
        };
      });

      // Trier par ceux qui ont le plus d'heures
      setBilans(stats.sort((a, b) => b.totalHeures - a.totalHeures));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBilans = bilans.filter(b => 
    `${b.first_name} ${b.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ paddingTop: Math.max(insets.top, 10) }} className="bg-white pb-4 px-4 border-b border-gray-100 shadow-sm z-10">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2 bg-gray-50 rounded-xl">
            <ChevronLeft size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="font-black text-gray-900 text-lg flex-1">Suivi des Heures</Text>
        </View>

        <View className="relative mb-2">
          <View className="absolute left-4 top-1/2 -translate-y-1/2 z-20"><Search size={18} color="#94a3b8" /></View>
          <TextInput placeholder="Chercher un élève..." value={search} onChangeText={setSearch} className="bg-gray-100 rounded-2xl pl-12 pr-4 py-3 font-medium text-gray-900" />
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {loading ? (
          <ActivityIndicator color="#006eb8" className="mt-10" />
        ) : filteredBilans.map((bilan) => (
          <View key={bilan.id} className="bg-white p-5 rounded-[32px] mb-4 border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-start mb-3">
              <Text className="font-black text-gray-900 text-base">{bilan.first_name} {bilan.last_name}</Text>
              <View className="bg-brand-50 px-3 py-1 rounded-full flex-row items-center">
                <Clock size={12} color="#006eb8" />
                <Text className="text-brand-700 font-black text-xs ml-1">{bilan.totalHeures}h</Text>
              </View>
            </View>

            <View className="space-y-2 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progression</Text>
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Objectif : {bilan.objectifHeures}h</Text>
              </View>
              <View className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <View style={{ width: `${bilan.progression}%` }} className={`h-full rounded-full ${bilan.progression >= 100 ? 'bg-green-500' : 'bg-brand-600'}`} />
              </View>
            </View>

            {bilan.totalHeures < bilan.objectifHeures && (
              <View className="flex-row items-center mt-4 bg-amber-50 p-2.5 rounded-xl">
                <AlertTriangle size={14} color="#f59e0b" />
                <Text className="text-amber-700 text-[10px] font-bold ml-2">
                  Reste {bilan.objectifHeures - bilan.totalHeures}h à valider
                </Text>
              </View>
            )}
          </View>
        ))}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}