import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, Plus, Clock, Users, User, Save, X, Trash2, Calendar as CalendarIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminSeances() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [seances, setSeances] = useState<any[]>([]);
  const [groupes, setGroupes] = useState<any[]>([]);
  const [formateurs, setFormateurs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    start_time: '09:00', 
    end_time: '12:00', 
    groupe_id: '', 
    formateur_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // On charge en parallèle les séances à venir, les groupes, et les formateurs
    const [seancesRes, groupesRes, formateursRes] = await Promise.all([
      supabase.from('seances')
        .select('*, groupes(name), profiles(first_name, last_name)')
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date').order('start_time'),
      supabase.from('groupes').select('id, name').order('name'),
      supabase.from('profiles').select('id, first_name, last_name').eq('role', 'formateur').order('last_name')
    ]);

    setSeances(seancesRes.data || []);
    setGroupes(groupesRes.data || []);
    setFormateurs(formateursRes.data || []);
    
    // Pré-sélection par défaut si données disponibles
    if (groupesRes.data && formateursRes.data && groupesRes.data.length > 0 && formateursRes.data.length > 0) {
      setForm(prev => ({ ...prev, groupe_id: groupesRes.data[0].id, formateur_id: formateursRes.data[0].id }));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.date || !form.start_time || !form.end_time || !form.groupe_id || !form.formateur_id) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('seances').insert([form]);
    setSaving(false);
    
    if (error) {
      Alert.alert("Erreur", "Impossible de créer la séance : " + error.message);
    } else {
      setShowModal(false);
      setForm({ ...form, title: '' }); // On ne vide que le titre pour enchaîner les créations
      fetchData();
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Annuler la séance", "Cette action est irréversible. Les présences liées seront supprimées. Continuer ?", [
      { text: "Non", style: "cancel" },
      { text: "Oui, annuler", style: "destructive", onPress: async () => {
          const { error } = await supabase.from('seances').delete().eq('id', id);
          if (!error) fetchData();
      }}
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ paddingTop: Math.max(insets.top, 10) }} className="bg-white pb-4 px-4 flex-row items-center border-b border-gray-100 shadow-sm z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2 bg-gray-50 rounded-xl">
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-black text-gray-900 text-lg">Gestion Séances</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} className="p-2 bg-brand-50 rounded-xl">
          <Plus size={24} color="#006eb8" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Séances à venir</Text>
        
        {loading ? (
          <ActivityIndicator color="#006eb8" className="mt-10" />
        ) : seances.length === 0 ? (
          <Text className="text-center text-gray-400 font-medium mt-10 italic">Aucune séance programmée.</Text>
        ) : (
          seances.map((seance) => (
            <View key={seance.id} className="bg-white p-5 rounded-3xl mb-4 border border-gray-100 shadow-sm flex-row items-center">
              <View className="flex-1">
                <Text className="text-brand-600 font-black text-[10px] uppercase mb-1">{format(parseISO(seance.date), 'EEEE dd MMM', { locale: fr })}</Text>
                <Text className="font-black text-gray-900 text-base leading-tight mb-2">{seance.title}</Text>
                <View className="flex-row items-center space-x-3">
                  <View className="flex-row items-center"><Clock size={12} color="#94a3b8" /><Text className="text-gray-500 text-[10px] font-bold ml-1">{seance.start_time.slice(0,5)} - {seance.end_time.slice(0,5)}</Text></View>
                  <View className="flex-row items-center"><Users size={12} color="#94a3b8" /><Text className="text-gray-500 text-[10px] font-bold ml-1" numberOfLines={1}>{seance.groupes?.name}</Text></View>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(seance.id)} className="p-3 bg-red-50 rounded-xl ml-3">
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
        <View className="h-20" />
      </ScrollView>

      {/* MODALE DE CRÉATION */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="bg-white rounded-t-[40px] h-[90%] overflow-hidden shadow-2xl">
            <View className="flex-row justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <Text className="text-xl font-black text-gray-900">Nouvelle séance</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} className="bg-white p-2 rounded-full shadow-sm"><X size={20} color="#64748b" /></TouchableOpacity>
            </View>
            
            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
              
              <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Titre de l'atelier</Text>
              <TextInput value={form.title} onChangeText={t => setForm({...form, title: t})} placeholder="Ex: Rédaction de CV" className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-gray-900 mb-4" />

              <View className="flex-row space-x-4 mb-4">
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date (YYYY-MM-DD)</Text>
                  <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3"><CalendarIcon size={16} color="#94a3b8" /><TextInput value={form.date} onChangeText={t => setForm({...form, date: t})} placeholder="2026-05-14" className="flex-1 ml-2 font-bold text-gray-900" /></View>
                </View>
              </View>

              <View className="flex-row space-x-4 mb-4">
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Début</Text>
                  <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3"><Clock size={16} color="#94a3b8" /><TextInput value={form.start_time} onChangeText={t => setForm({...form, start_time: t})} placeholder="09:00" className="flex-1 ml-2 font-bold text-gray-900" /></View>
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Fin</Text>
                  <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3"><Clock size={16} color="#94a3b8" /><TextInput value={form.end_time} onChangeText={t => setForm({...form, end_time: t})} placeholder="12:00" className="flex-1 ml-2 font-bold text-gray-900" /></View>
                </View>
              </View>

              <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-2 ml-1">Cohorte (Groupe)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
                {groupes.map(g => (
                  <TouchableOpacity key={g.id} onPress={() => setForm({...form, groupe_id: g.id})} className={`px-5 py-3 rounded-2xl mr-3 border ${form.groupe_id === g.id ? 'bg-brand-50 border-brand-500' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <Text className={`font-black ${form.groupe_id === g.id ? 'text-brand-700' : 'text-gray-600'}`}>{g.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Formateur assigné</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-8">
                {formateurs.map(f => (
                  <TouchableOpacity key={f.id} onPress={() => setForm({...form, formateur_id: f.id})} className={`px-5 py-3 rounded-2xl mr-3 border ${form.formateur_id === f.id ? 'bg-purple-50 border-purple-500' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <Text className={`font-black ${form.formateur_id === f.id ? 'text-purple-700' : 'text-gray-600'}`}>{f.first_name} {f.last_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-brand-600 py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-brand-200 mb-10">
                {saving ? <ActivityIndicator color="#fff" /> : <><Save size={20} color="#fff" /><Text className="text-white font-black uppercase tracking-widest ml-2">Programmer la séance</Text></>}
              </TouchableOpacity>
              
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}