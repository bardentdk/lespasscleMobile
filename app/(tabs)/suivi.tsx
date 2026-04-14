import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { ChevronLeft, Clock, Save, ArrowLeft, CheckCircle2, Lock } from 'lucide-react-native';

interface Seance { id: string; title: string; date: string; start_time: string; end_time: string; groupe_id: string; groupes: { name: string } | null; }
interface Apprenant { id: string; first_name: string; last_name: string; }
interface PresenceState { status: 'present' | 'absent' | 'retard' | 'excuse'; heures_validees: number; comment: string; justificatif_id?: string | null; }

const calculateDuration = (startTime: string, endTime: string) => Math.max(0, parseFloat(((parseInt(endTime.split(':')[0]) + parseInt(endTime.split(':')[1])/60) - (parseInt(startTime.split(':')[0]) + parseInt(startTime.split(':')[1])/60)).toFixed(2)));

export default function Suivi() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [seances, setSeances] = useState<Seance[]>([]);
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);
  const [apprenants, setApprenants] = useState<Apprenant[]>([]);
  const [presencesData, setPresencesData] = useState<Record<string, PresenceState>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAppelFait, setIsAppelFait] = useState(false);

  // L'appel est verrouillé si l'appel a déjà été fait ET que l'utilisateur n'est PAS admin.
  const isLocked = isAppelFait && user?.profile?.role !== 'admin';

  useEffect(() => { fetchSeances(); }, [selectedDate]);
  useEffect(() => { if (selectedSeance) fetchApprenantsAndPresences(selectedSeance); }, [selectedSeance]);

  const fetchSeances = async () => {
    setLoading(true);
    let query = supabase.from('seances').select('*, groupes(name)').eq('date', selectedDate).order('start_time');
    if (user?.profile?.role === 'formateur') query = query.eq('formateur_id', user.profile.id);
    const { data } = await query;
    setSeances((data as unknown as Seance[]) || []);
    setLoading(false);
  };

  const fetchApprenantsAndPresences = async (seance: Seance) => {
    setLoading(true);
    const [grpRes, presRes] = await Promise.all([
      supabase.from('groupes_apprenants').select('profiles(id, first_name, last_name)').eq('groupe_id', seance.groupe_id),
      supabase.from('presences').select('*').eq('seance_id', seance.id)
    ]);
    
    const apprenantsList = (grpRes.data?.map(g => g.profiles) as unknown as Apprenant[])?.sort((a, b) => a.last_name.localeCompare(b.last_name)) || [];
    setApprenants(apprenantsList);

    // Vérification si l'appel est déjà fait
    if (presRes.data && presRes.data.length > 0) setIsAppelFait(true);
    else setIsAppelFait(false);

    const duree = calculateDuration(seance.start_time, seance.end_time);
    const pMap: Record<string, PresenceState> = {};
    apprenantsList.forEach(app => {
      const ex = presRes.data?.find(p => p.apprenant_id === app.id);
      pMap[app.id] = ex 
        ? { status: ex.status, heures_validees: ex.heures_validees, comment: ex.comment || '', justificatif_id: ex.justificatif_id } 
        : { status: 'present', heures_validees: duree, comment: '' };
    });
    setPresencesData(pMap);
    setLoading(false);
  };

  const handleStatusChange = (id: string, st: 'present' | 'absent' | 'retard' | 'excuse') => {
    if (isLocked) return; // Bloqué !

    setPresencesData(p => {
      const c = p[id];
      const d = selectedSeance ? calculateDuration(selectedSeance.start_time, selectedSeance.end_time) : 0;
      return { 
        ...p, 
        [id]: { 
          ...c, 
          status: st, 
          heures_validees: (st === 'absent' || st === 'excuse') ? 0 : (c.heures_validees === 0 && st === 'present' ? d : c.heures_validees) 
        } 
      };
    });
  };

  const handleSave = async () => {
    if (!selectedSeance || isLocked) return;
    setSaving(true);
    const payload = Object.entries(presencesData).map(([appId, data]) => ({ 
      seance_id: selectedSeance.id, 
      apprenant_id: appId, 
      status: data.status, 
      heures_validees: data.heures_validees, 
      comment: data.comment 
    }));
    
    const { error } = await supabase.from('presences').upsert(payload, { onConflict: 'seance_id, apprenant_id' });
    setSaving(false);
    
    if (error) Alert.alert("Erreur", "Impossible de sauvegarder l'appel.");
    else { 
      Alert.alert("Succès", "Appel enregistré !"); 
      setIsAppelFait(true); 
    }
  };

  // --- VUE 1 : LISTE DES SÉANCES ---
  if (!selectedSeance) {
    return (
      <View className="flex-1 bg-gray-50">
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="bg-brand-600 pb-6 px-6 rounded-b-[40px] shadow-xl shadow-brand-900">
          <Text className="text-white text-2xl font-black uppercase tracking-tighter">Faire l'appel</Text>
        </View>
        <ScrollView className="flex-1 px-6 pt-6">
          {loading ? <ActivityIndicator color="#006eb8" /> : seances.map(s => (
            <TouchableOpacity key={s.id} onPress={() => setSelectedSeance(s)} className="bg-white p-6 rounded-[24px] mb-4 shadow-sm border border-gray-100 flex-row items-center">
              <View className="flex-1">
                <Text className="font-black text-gray-900 text-base">{s.title}</Text>
                <View className="flex-row items-center mt-2"><Clock size={14} color="#94a3b8" /><Text className="text-gray-500 font-bold text-xs ml-1">{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</Text></View>
              </View>
              <View className="bg-brand-50 p-3 rounded-2xl"><ChevronLeft size={20} color="#006eb8" style={{ transform: [{ rotate: '180deg' }] }} /></View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // --- VUE 2 : L'APPEL EN LUI-MÊME ---
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-gray-50">
      <View style={{ paddingTop: Math.max(insets.top, 10) }} className="bg-white pb-4 px-4 flex-row items-center border-b border-gray-100 shadow-sm z-10">
        <TouchableOpacity onPress={() => setSelectedSeance(null)} className="p-2 mr-2 bg-gray-50 rounded-xl"><ArrowLeft size={20} color="#0f172a" /></TouchableOpacity>
        <View className="flex-1"><Text className="font-black text-gray-900 text-lg" numberOfLines={1}>{selectedSeance.title}</Text></View>
      </View>
      
      <ScrollView className="flex-1 px-4 pt-4">
        {isAppelFait && (
           <View className="bg-blue-50 p-3 rounded-xl mb-4 flex-row items-center">
             <Lock size={16} color="#1e40af" />
             <Text className="text-blue-800 text-xs font-bold ml-2">
               {user?.profile?.role === 'admin' ? "Appel validé (Mode Admin : modification possible)." : "Cet appel est clôturé et verrouillé."}
             </Text>
           </View>
        )}

        {loading ? <ActivityIndicator color="#006eb8" /> : apprenants.map(app => {
          const state = presencesData[app.id] || { status: 'present', heures_validees: 0, comment: '' };
          return (
            <View key={app.id} className="bg-white p-4 rounded-[24px] mb-4 border border-gray-100 shadow-sm">
              <View className="flex-row items-center mb-4">
                <Text className="font-black text-gray-900 text-base">{app.first_name} <Text className="uppercase">{app.last_name}</Text></Text>
                {state.justificatif_id && <View className="ml-auto bg-green-50 px-2 py-1 rounded-lg flex-row items-center"><CheckCircle2 size={12} color="#16a34a" /><Text className="text-green-700 text-[10px] font-bold ml-1">Justifié</Text></View>}
              </View>
              <View className={`flex-row justify-between p-1 rounded-2xl ${isLocked ? 'bg-transparent' : 'bg-gray-50'}`}>
                {['present', 'absent', 'retard', 'excuse'].map((st) => (
                  <TouchableOpacity 
                    key={st} 
                    disabled={isLocked}
                    onPress={() => handleStatusChange(app.id, st as any)} 
                    className={`flex-1 py-2 mx-0.5 rounded-xl items-center 
                      ${state.status === st ? (st==='present'?'bg-green-500':st==='absent'?'bg-red-500':st==='retard'?'bg-orange-400':'bg-blue-500') : 'bg-transparent'}
                      ${isLocked && state.status !== st ? 'opacity-30' : ''}
                    `}
                  >
                    <Text className={`text-[10px] font-black uppercase ${state.status === st ? 'text-white' : 'text-gray-500'}`}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
        <View className="h-24" />
      </ScrollView>

      {/* BOUTON SAUVEGARDER */}
      <View className="absolute bottom-6 left-6 right-6">
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={saving || isLocked} 
          className={`py-4 rounded-2xl flex-row justify-center items-center shadow-2xl ${isLocked ? 'bg-gray-300' : 'bg-brand-600 shadow-brand-400'}`}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <><Save size={20} color="#fff" /><Text className="text-white font-black uppercase tracking-widest ml-2">{isLocked ? 'Verrouillé' : (isAppelFait ? 'Mettre à jour' : 'Enregistrer')}</Text></>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}