import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Bell, Calendar, CheckCircle2, Clock, LayoutDashboard, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface Seance {
  id: string; title: string; date: string; start_time: string; end_time: string;
  groupes: { name: string } | null;
  profiles: { first_name: string; last_name: string } | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [nextSeance, setNextSeance] = useState<Seance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      let query = supabase.from('seances')
        .select('*, groupes(name), profiles(first_name, last_name)')
        .gte('date', today)
        .order('date')
        .order('start_time')
        .limit(1);
        
      if (user?.profile?.role === 'formateur') query = query.eq('formateur_id', user.profile.id);
      
      const { data, error } = await query;
      if (!error && data && data.length > 0) setNextSeance(data[0] as unknown as Seance);
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  useEffect(() => { fetchDashboardData(); }, [user]);

  const roleColor = user?.profile?.role === 'apprenant' ? 'bg-accent-500' : 'bg-brand-500';

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboardData(); }} tintColor="#006eb8" />}
      >
        {/* HEADER */}
        <View 
          style={{ paddingTop: Math.max(insets.top, 20) }} 
          className="bg-brand-600 pb-16 px-6 rounded-b-[48px] shadow-sm relative overflow-hidden"
        >
          <View className="absolute -top-24 -right-12 w-64 h-64 bg-white/10 rounded-full" />
          <View className="absolute top-12 -left-12 w-32 h-32 bg-white/5 rounded-full" />

          <View className="flex-row justify-between items-center mt-2 relative z-10">
            <View className="flex-row items-center flex-1">
              <View className="h-12 w-12 bg-white/20 rounded-full items-center justify-center border border-white/30 mr-4">
                <Text className="text-white font-black text-lg">
                  {user?.profile?.first_name ? user.profile.first_name[0] : ''}
                  {user?.profile?.last_name ? user.profile.last_name[0] : ''}
                </Text>
              </View>
              <View>
                <Text className="text-brand-100 font-bold uppercase tracking-widest text-[10px] mb-0.5">
                  {`Espace ${user?.profile?.role || 'Utilisateur'}`}
                </Text>
                <Text className="text-white text-2xl font-black tracking-tight">
                  {`Bonjour, ${user?.profile?.first_name || ''} 👋`}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity className="bg-white/10 p-3 rounded-2xl border border-white/20">
              <View className="absolute top-2 right-2 w-2 h-2 bg-accent-500 rounded-full z-20" />
              <Bell size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTENT */}
        <View className="px-6 -mt-10 relative z-20">
          <View className="flex-row justify-between items-end mb-4 px-1">
            <Text className="text-xs font-black text-gray-800 uppercase tracking-widest">Prochaine séance</Text>
            {nextSeance ? (
              <Text className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-md">Aujourd'hui</Text>
            ) : null}
          </View>

          {loading ? (
            <View className="bg-white p-10 rounded-[32px] items-center justify-center shadow-lg shadow-gray-200/50 border border-gray-50">
              <ActivityIndicator color="#006eb8" size="large" />
            </View>
          ) : nextSeance ? (
            <TouchableOpacity 
              onPress={() => router.push('/planning')} 
              activeOpacity={0.8}
              className="bg-white rounded-[32px] shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden"
            >
              <View className={`h-2 w-full ${roleColor}`} />
              <View className="p-6">
                <Text className="text-gray-900 text-xl font-black leading-tight mb-5">{nextSeance.title}</Text>
                <View className="bg-gray-50 rounded-2xl p-4 flex-row flex-wrap gap-y-3">
                  <View className="w-1/2 flex-row items-center">
                    <Clock size={16} color="#006eb8" />
                    <Text className="text-gray-700 text-xs font-bold ml-2">
                      {`${nextSeance.start_time.slice(0, 5)} - ${nextSeance.end_time.slice(0, 5)}`}
                    </Text>
                  </View>
                  <View className="w-1/2 flex-row items-center">
                    <Calendar size={16} color="#006eb8" />
                    <Text className="text-gray-700 text-xs font-bold ml-2 capitalize">
                      {format(new Date(nextSeance.date), 'EEE d MMM', { locale: fr })}
                    </Text>
                  </View>
                  {nextSeance.profiles ? (
                    <View className="w-full flex-row items-center mt-1">
                      <User size={16} color="#94a3b8" />
                      <Text className="text-gray-500 text-xs font-bold ml-2">
                        {`Intervenant : ${nextSeance.profiles.first_name} ${nextSeance.profiles.last_name}`}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="bg-white p-8 rounded-[32px] border-2 border-dashed border-gray-200 items-center justify-center">
              <View className="bg-gray-50 p-4 rounded-full mb-3">
                <CheckCircle2 size={32} color="#94a3b8" />
              </View>
              <Text className="text-gray-800 font-black text-center text-lg">Tout est à jour</Text>
              <Text className="text-gray-400 font-bold mt-1 text-center text-xs">Aucune séance prévue pour le moment.</Text>
            </View>
          )}

          <Text className="text-xs font-black text-gray-800 uppercase tracking-widest px-1 mt-10 mb-4">Raccourcis</Text>
          <View className="flex-row justify-between gap-x-4">
            <QuickAction icon={<LayoutDashboard size={26} color="#006eb8" />} label="Mon Planning" color="bg-brand-50" onPress={() => router.push('/planning')} />
            <QuickAction icon={<Calendar size={26} color="#f59e0b" />} label="Présences" color="bg-accent-50" onPress={() => router.push('/suivi')} />
          </View>
        </View>
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: JSX.Element; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      className={`${color} flex-1 p-5 rounded-[28px] items-center shadow-sm border border-white justify-center h-32`}
    >
      <View className="bg-white p-3 rounded-2xl shadow-sm mb-3">{icon}</View>
      <Text className="text-gray-900 font-black text-[11px] uppercase tracking-tighter text-center">{label}</Text>
    </TouchableOpacity>
  );
}