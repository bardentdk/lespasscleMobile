import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Award, Calendar,
  CheckCircle2,
  Clock,
  LogOut,
  Mail,
  TrendingUp
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface StatState {
  totalHeures: number;
  objectifHeures: number; // <-- NOUVEAU
  seancesEffectuees: number;
  tauxPresence: number;
  progression: number;
}

export default function BilanProfile() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState<StatState>({
    totalHeures: 0,
    objectifHeures: 150,
    seancesEffectuees: 0,
    tauxPresence: 0,
    progression: 0
  });
  const [activites, setActivites] = useState<any[]>([]);

  useEffect(() => {
    if (user?.profile?.id) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.profile?.id) return;
    setLoading(true);
    try {
      // 1. Récupérer l'objectif d'heures du groupe de l'apprenant
      const { data: grpData } = await supabase
        .from('groupes_apprenants')
        .select('groupes(objectif_heures)')
        .eq('apprenant_id', user.profile.id)
        .limit(1)
        .maybeSingle();
      
      const objectif = grpData?.groupes?.objectif_heures || 150; // 150 par défaut si non trouvé

      // 2. Récupérer les présences
      const { data: presences, error } = await supabase
        .from('presences')
        .select(`
          status,
          heures_validees,
          seances (title, date)
        `)
        .eq('apprenant_id', user.profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 3. Calculs dynamiques
      const totalH = presences.reduce((acc, p) => acc + (Number(p.heures_validees) || 0), 0);
      const presents = presences.filter(p => p.status === 'present').length;
      const taux = presences.length > 0 ? (presents / presences.length) * 100 : 0;
      const progressionCalculated = Math.min(100, (totalH / objectif) * 100);

      setStats({
        totalHeures: totalH,
        objectifHeures: objectif,
        seancesEffectuees: presents,
        tauxPresence: Math.round(taux),
        progression: Math.round(progressionCalculated)
      });
      setActivites(presences);
    } catch (err) {
      console.error("Erreur Bilan Mobile:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Souhaitez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: async () => { 
          setLoggingOut(true); 
          await supabase.auth.signOut(); 
        } 
      }
    ]);
  };

  if (!user?.profile) return null;

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="bg-brand-600 pb-8 px-6 rounded-b-[40px] items-center shadow-xl shadow-brand-900/30">
        <View className="h-24 w-24 rounded-full bg-white/20 border-4 border-white/30 items-center justify-center mb-4">
          <Text className="text-3xl font-black text-white">{user.profile.first_name[0]}{user.profile.last_name[0]}</Text>
        </View>
        <Text className="text-white text-2xl font-black uppercase tracking-tighter">{user.profile.first_name} {user.profile.last_name}</Text>
        <View className="bg-white/10 px-4 py-1 rounded-full mt-2 border border-white/20">
          <Text className="text-white text-[10px] font-black uppercase tracking-widest">{user.profile.role}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}>
        
        <View className="flex-row space-x-3 mb-6">
          <View className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 items-center">
            <Clock size={20} color="#006eb8" />
            <Text className="text-gray-900 font-black text-lg mt-1">{stats.totalHeures}h</Text>
            <Text className="text-gray-400 text-[8px] font-bold uppercase">Heures</Text>
          </View>
          <View className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 items-center">
            <Award size={20} color="#f59e0b" />
            <Text className="text-gray-900 font-black text-lg mt-1">{stats.tauxPresence}%</Text>
            <Text className="text-gray-400 text-[8px] font-bold uppercase">Assiduité</Text>
          </View>
          <View className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 items-center">
            <TrendingUp size={20} color="#16a34a" />
            <Text className="text-gray-900 font-black text-lg mt-1">{stats.progression}%</Text>
            <Text className="text-gray-400 text-[8px] font-bold uppercase">Objectif</Text>
          </View>
        </View>

        <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-6">
          <View className="flex-row justify-between items-end mb-3">
            <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Progression Parcours</Text>
            {/* AFFICHAGE DE L'OBJECTIF DYNAMIQUE */}
            <Text className="text-brand-600 font-black">{stats.totalHeures}/{stats.objectifHeures}h</Text>
          </View>
          <View className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <View style={{ width: `${stats.progression}%` }} className="h-full bg-brand-600 rounded-full" />
          </View>
        </View>

        <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Dernières activités</Text>
        {loading ? (
          <ActivityIndicator color="#006eb8" />
        ) : activites.length === 0 ? (
          <View className="bg-white p-8 rounded-[32px] border border-dashed border-gray-200 items-center mb-6">
            <Calendar size={32} color="#cbd5e1" />
            <Text className="text-gray-400 font-bold mt-2">Aucune activité enregistrée.</Text>
          </View>
        ) : (
          activites.slice(0, 5).map((item, idx) => (
            <View key={idx} className="bg-white p-4 rounded-2xl mb-3 border border-gray-50 shadow-sm flex-row items-center">
              <View className={`p-2 rounded-xl mr-4 ${item.status === 'present' ? 'bg-green-50' : 'bg-red-50'}`}>
                <CheckCircle2 size={18} color={item.status === 'present' ? '#16a34a' : '#ef4444'} />
              </View>
              <View className="flex-1">
                <Text className="font-black text-gray-900 text-xs" numberOfLines={1}>{item.seances?.title}</Text>
                <Text className="text-gray-400 text-[10px] font-bold mt-0.5">
                  {format(parseISO(item.seances?.date), 'dd MMMM', { locale: fr })}
                </Text>
              </View>
              <Text className="font-black text-brand-600 text-xs">+{item.heures_validees}h</Text>
            </View>
          ))
        )}

        <View className="mt-6 mb-12">
          <View className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-4">
            <View className="flex-row items-center p-5 border-b border-gray-50">
              <View className="bg-brand-50 p-3 rounded-2xl mr-4"><Mail size={18} color="#006eb8" /></View>
              <View>
                <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Email</Text>
                <Text className="font-bold text-gray-900 text-xs mt-1">{user.profile.email}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} disabled={loggingOut} className="bg-red-50 p-5 rounded-[28px] flex-row justify-center items-center border border-red-100 active:bg-red-100">
            {loggingOut ? <ActivityIndicator color="#ef4444" /> : <><LogOut size={20} color="#ef4444" /><Text className="text-red-600 font-black uppercase tracking-widest ml-2 text-sm">Quitter l'application</Text></>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}