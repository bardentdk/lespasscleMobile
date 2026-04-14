import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from '../../lib/supabase';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, User, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
interface Seance {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  groupes: { name: string } | null;
  profiles: { first_name: string; last_name: string } | null;
}

export default function Planning() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));

  const fetchSeances = async () => {
    setLoading(true);
    const { data } = await supabase.from('seances').select('*, groupes(name), profiles(first_name, last_name)').eq('date', format(selectedDate, 'yyyy-MM-dd')).order('start_time');
    setSeances((data as unknown as Seance[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSeances(); }, [selectedDate]);

  return (
    <View style={{ paddingTop: Math.max(insets.top, 20) }} className="flex-1 bg-white">
      <View className="bg-brand-600 pt-16 pb-6 px-4 rounded-b-[32px]">
        <View className="flex-row justify-between items-center mb-6 px-2">
          <Text className="text-white text-xl font-black uppercase tracking-tighter">{format(selectedDate, 'MMMM yyyy', { locale: fr })}</Text>
          <View className="flex-row space-x-4">
            <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, -7))}><ChevronLeft color="white" /></TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 7))}><ChevronRight color="white" /></TouchableOpacity>
          </View>
        </View>

        <View className="flex-row justify-between">
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            return (
              <TouchableOpacity key={i} onPress={() => setSelectedDate(day)} className={`items-center justify-center w-12 py-3 rounded-2xl ${isSelected ? 'bg-white' : 'bg-transparent'}`}>
                <Text className={`text-[10px] font-black uppercase ${isSelected ? 'text-brand-600' : 'text-white/60'}`}>{format(day, 'EEE', { locale: fr }).replace('.', '')}</Text>
                <Text className={`text-lg font-black mt-1 ${isSelected ? 'text-brand-600' : 'text-white'}`}>{format(day, 'd')}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="flex-1 px-6 pt-6">
        <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Programme du jour</Text>
        
        {loading ? <ActivityIndicator color="#006eb8" className="mt-10" /> : seances.length > 0 ? (
          <FlatList
            data={seances}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="flex-row mb-6">
                <View className="items-center mr-4 w-12">
                  <Text className="font-black text-gray-900">{item.start_time.slice(0, 5)}</Text>
                  <View className="w-[2px] flex-1 bg-gray-100 my-2" />
                </View>
                
                <TouchableOpacity className="flex-1 bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <Text className="text-brand-600 font-black text-xs uppercase mb-1">{item.groupes?.name || 'Sans groupe'}</Text>
                  <Text className="text-gray-900 font-black text-base mb-3 leading-tight">{item.title}</Text>
                  <View className="flex-row items-center space-x-4">
                    <View className="flex-row items-center"><Clock size={12} color="#94a3b8" /><Text className="text-gray-500 text-[10px] font-bold ml-1">Fin à {item.end_time.slice(0, 5)}</Text></View>
                    <View className="flex-row items-center"><User size={12} color="#94a3b8" /><Text className="text-gray-500 text-[10px] font-bold ml-1">{item.profiles?.first_name} {item.profiles?.last_name?.charAt(0)}.</Text></View>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <View className="flex-1 justify-center items-center pb-20"><Text className="text-gray-300 font-black uppercase text-center tracking-widest">Journée libre</Text></View>
        )}
      </View>
    </View>
  );
}