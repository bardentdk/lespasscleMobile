import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from '../../lib/supabase';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, User, ChevronLeft, ChevronRight, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

interface Seance {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  groupe_id: string;
  groupes: { name: string } | null;
  profiles: { first_name: string; last_name: string } | null;
}

export default function Planning() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));

  const fetchSeances = async () => {
    if (!user?.profile) return;
    setLoading(true);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    let query = supabase
      .from('seances')
      .select('*, groupes(name), profiles(first_name, last_name)')
      .eq('date', dateStr)
      .order('start_time');

    // FILTRES DE SÉCURITÉ SELON LE RÔLE
    if (user.profile.role === 'formateur') {
      // Le formateur ne voit que ses propres séances
      query = query.eq('formateur_id', user.profile.id);
      
    } else if (user.profile.role === 'apprenant') {
      // 1. On cherche d'abord à quel(s) groupe(s) appartient l'apprenant
      const { data: userGroups } = await supabase
        .from('groupes_apprenants')
        .select('groupe_id')
        .eq('apprenant_id', user.profile.id);
        
      const groupIds = userGroups?.map(g => g.groupe_id) || [];
      
      // 2. On filtre les séances pour n'afficher que celles de son groupe
      if (groupIds.length > 0) {
        query = query.in('groupe_id', groupIds);
      } else {
        // S'il n'a pas de groupe, on force une requête vide (sécurité)
        query = query.eq('id', '00000000-0000-0000-0000-000000000000'); 
      }
    }

    const { data, error } = await query;
    if (error) {
        console.error("Erreur chargement planning:", error);
    }
    
    setSeances((data as unknown as Seance[]) || []);
    setLoading(false);
  };

  useEffect(() => { 
    fetchSeances(); 
  }, [selectedDate, user]);

  return (
    <View className="flex-1 bg-white">
      {/* HEADER AVEC GESTION DES SAFE AREAS */}
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="bg-brand-600 pb-6 px-4 rounded-b-[32px] shadow-lg shadow-brand-900/20">
        <View className="flex-row justify-between items-center mb-6 px-2">
          <View>
            <Text className="text-brand-100 font-bold text-[10px] uppercase tracking-widest mb-1">
              {user?.profile?.role === 'apprenant' ? 'Mon planning' : 'Planning des ateliers'}
            </Text>
            <Text className="text-white text-xl font-black uppercase tracking-tighter">
              {format(selectedDate, 'MMMM yyyy', { locale: fr })}
            </Text>
          </View>
          <View className="flex-row space-x-2 bg-white/10 rounded-full p-1 border border-white/20">
            <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, -7))} className="p-2 rounded-full hover:bg-white/20">
              <ChevronLeft color="white" size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 7))} className="p-2 rounded-full hover:bg-white/20">
              <ChevronRight color="white" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SÉLECTEUR DE JOURS */}
        <View className="flex-row justify-between px-1">
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            return (
              <TouchableOpacity 
                key={i} 
                onPress={() => setSelectedDate(day)} 
                className={`items-center justify-center w-[13%] py-3 rounded-2xl transition-all ${isSelected ? 'bg-white shadow-sm' : 'bg-transparent'}`}
              >
                <Text className={`text-[9px] font-black uppercase ${isSelected ? 'text-brand-600' : 'text-brand-100'}`}>
                  {format(day, 'EEE', { locale: fr }).substring(0, 3)}
                </Text>
                <Text className={`text-lg font-black mt-1 ${isSelected ? 'text-brand-600' : 'text-white'}`}>
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* LISTE DES SÉANCES */}
      <View className="flex-1 px-6 pt-6">
        <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Programme du jour</Text>
        
        {loading ? (
          <ActivityIndicator color="#006eb8" className="mt-10" />
        ) : seances.length > 0 ? (
          <FlatList
            data={seances}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }} // Espace pour la bottom bar
            renderItem={({ item }) => (
              <View className="flex-row mb-6">
                <View className="items-center mr-4 w-12">
                  <Text className="font-black text-gray-900">{item.start_time.slice(0, 5)}</Text>
                  <View className="w-[2px] flex-1 bg-gray-100 my-2 rounded-full" />
                </View>
                
                <TouchableOpacity activeOpacity={0.7} className="flex-1 bg-gray-50 p-5 rounded-3xl border border-gray-100 shadow-sm">
                  <View className="flex-row items-center mb-1">
                    <Users size={12} color="#006eb8" />
                    <Text className="text-brand-600 font-black text-[10px] uppercase ml-1.5">{item.groupes?.name || 'Sans groupe'}</Text>
                  </View>
                  <Text className="text-gray-900 font-black text-base mb-3 leading-tight">{item.title}</Text>
                  
                  <View className="flex-row items-center space-x-4 bg-white p-2.5 rounded-2xl border border-gray-100">
                    <View className="flex-row items-center">
                      <Clock size={12} color="#94a3b8" />
                      <Text className="text-gray-500 text-[10px] font-bold ml-1.5">Jusqu'à {item.end_time.slice(0, 5)}</Text>
                    </View>
                    <View className="w-[1px] h-3 bg-gray-200 mx-2" />
                    <View className="flex-row items-center flex-1">
                      <User size={12} color="#94a3b8" />
                      <Text className="text-gray-500 text-[10px] font-bold ml-1.5 truncate" numberOfLines={1}>
                        {item.profiles?.first_name} {item.profiles?.last_name?.charAt(0)}.
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <View className="flex-1 justify-center items-center pb-20">
            <View className="bg-gray-50 p-6 rounded-full mb-4 border border-dashed border-gray-200">
              <Clock size={32} color="#cbd5e1" />
            </View>
            <Text className="text-gray-400 font-black uppercase tracking-widest">Journée libre</Text>
            <Text className="text-gray-400 text-xs font-medium mt-1">Aucune séance prévue ce jour</Text>
          </View>
        )}
      </View>
    </View>
  );
}