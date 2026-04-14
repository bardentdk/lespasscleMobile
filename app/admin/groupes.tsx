import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, Plus, Layers, Users, X, Save, Target, Check, UserPlus, UserMinus, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AdminGroupes() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [groupes, setGroupes] = useState<any[]>([]);
  const [allApprenants, setAllApprenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState<any>(null); // Stocke le groupe sélectionné
  
  // Formulaire création
  const [newGroup, setNewGroup] = useState({ name: '', description: '', objectif_heures: '150' });
  const [searchMember, setSearchMember] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 1. Groupes avec compte d'élèves
    const { data: grpData } = await supabase
      .from('groupes')
      .select('*, groupes_apprenants(count)')
      .order('name');

    // 2. Tous les apprenants pour l'affectation
    const { data: appData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('role', 'apprenant')
      .order('last_name');

    setGroupes(grpData || []);
    setAllApprenants(appData || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newGroup.name) return Alert.alert("Erreur", "Le nom du groupe est obligatoire.");
    
    const { error } = await supabase.from('groupes').insert([{
      name: newGroup.name,
      description: newGroup.description,
      objectif_heures: parseInt(newGroup.objectif_heures) || 150
    }]);

    if (error) Alert.alert("Erreur", error.message);
    else {
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', objectif_heures: '150' });
      fetchData();
    }
  };

  const toggleMembership = async (apprenantId: string, isMember: boolean) => {
    if (isMember) {
      await supabase.from('groupes_apprenants').delete()
        .match({ groupe_id: showManageModal.id, apprenant_id: apprenantId });
    } else {
      await supabase.from('groupes_apprenants').insert([
        { groupe_id: showManageModal.id, apprenant_id: apprenantId }
      ]);
    }
    // Mise à jour locale de la liste des inscrits pour le groupe sélectionné
    fetchData(); 
  };

  // Filtrer les élèves pour la modale de gestion
  const filteredApprenants = allApprenants.filter(a => 
    `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* HEADER */}
      <View style={{ paddingTop: Math.max(insets.top, 10) }} className="bg-white pb-4 px-4 flex-row items-center border-b border-gray-100 shadow-sm z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2 bg-gray-50 rounded-xl">
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="font-black text-gray-900 text-lg flex-1">Gestion Cohortes</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} className="p-2 bg-brand-50 rounded-xl">
          <Plus size={24} color="#006eb8" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Groupes actifs</Text>
        
        {loading ? <ActivityIndicator color="#006eb8" className="mt-10" /> : groupes.map((g) => (
          <TouchableOpacity 
            key={g.id} 
            onPress={() => setShowManageModal(g)}
            className="bg-white p-5 rounded-[32px] mb-4 border border-gray-100 shadow-sm"
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 pr-4">
                <Text className="font-black text-gray-900 text-lg leading-tight">{g.name}</Text>
                <Text className="text-gray-400 text-xs font-medium mt-1" numberOfLines={2}>{g.description || "Aucune description"}</Text>
              </View>
              <View className="bg-brand-50 px-3 py-1.5 rounded-full flex-row items-center">
                <Target size={12} color="#006eb8" />
                <Text className="text-brand-700 text-[10px] font-black ml-1.5 uppercase">{g.objectif_heures}H</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between border-t border-gray-50 pt-4">
              <View className="flex-row items-center">
                <Users size={14} color="#94a3b8" />
                <Text className="text-gray-500 text-xs font-bold ml-2">{g.groupes_apprenants?.[0]?.count || 0} apprenants inscrits</Text>
              </View>
              <Text className="text-brand-600 text-[10px] font-black uppercase tracking-widest">Gérer Membres</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View className="h-20" />
      </ScrollView>

      {/* MODALE 1 : CRÉATION DE GROUPE */}
      <Modal visible={showCreateModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="bg-white rounded-t-[40px] h-[70%]">
            <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
              <Text className="text-xl font-black text-gray-900">Nouvelle Cohorte</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}><X size={24} color="#94a3b8" /></TouchableOpacity>
            </View>
            <ScrollView className="p-6">
              <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nom du groupe</Text>
              <TextInput value={newGroup.name} onChangeText={t => setNewGroup({...newGroup, name: t})} placeholder="Ex: Promo Web 2026" className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-gray-900 mb-4" />
              
              <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Objectif d'heures</Text>
              <TextInput value={newGroup.objectif_heures} keyboardType="numeric" onChangeText={t => setNewGroup({...newGroup, objectif_heures: t})} placeholder="150" className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold text-gray-900 mb-4" />

              <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Description (optionnel)</Text>
              <TextInput value={newGroup.description} multiline numberOfLines={3} onChangeText={t => setNewGroup({...newGroup, description: t})} placeholder="Détails du parcours..." className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-medium text-gray-900 mb-8" />

              <TouchableOpacity onPress={handleCreate} className="bg-brand-600 py-4 rounded-2xl items-center shadow-lg shadow-brand-200">
                <Text className="text-white font-black uppercase tracking-widest">Créer le groupe</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* MODALE 2 : GESTION DES MEMBRES (AFFECTATION) */}
      <Modal visible={!!showManageModal} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/60 justify-center p-4">
          <View className="bg-white rounded-[40px] h-[85%] overflow-hidden">
            <View className="p-6 bg-gray-50 border-b border-gray-100 flex-row justify-between items-center">
              <View>
                <Text className="font-black text-gray-900 text-lg">{showManageModal?.name}</Text>
                <Text className="text-[10px] font-bold text-gray-400 uppercase">Affecter des stagiaires</Text>
              </View>
              <TouchableOpacity onPress={() => setShowManageModal(null)} className="bg-white p-2 rounded-full shadow-sm"><X size={20} color="#0f172a" /></TouchableOpacity>
            </View>

            <View className="p-4 border-b border-gray-50">
              <View className="bg-gray-100 rounded-2xl flex-row items-center px-4 py-1">
                <Search size={18} color="#94a3b8" />
                <TextInput placeholder="Chercher un élève..." value={searchMember} onChangeText={setSearchMember} className="flex-1 h-10 ml-2 font-bold text-gray-900" />
              </View>
            </View>

            <ScrollView className="flex-1 p-4">
              {filteredApprenants.map(app => {
                // Cette partie est un peu complexe car on doit vérifier si l'élève est déjà dans CE groupe
                // Pour simplifier, on peut re-fetcher ou passer l'info. Ici on va utiliser fetchData global.
                // Note: Dans une app de prod, on optimiserait cela.
                return (
                  <View key={app.id} className="flex-row items-center justify-between p-4 bg-gray-50/50 rounded-2xl mb-2 border border-gray-100">
                    <View className="flex-1 mr-4">
                      <Text className="font-black text-gray-900 text-sm">{app.first_name} {app.last_name}</Text>
                      <Text className="text-[10px] text-gray-400 font-medium">{app.email}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => toggleMembership(app.id, false /* ici on gérerait le toggle */)}
                      className="bg-brand-600 p-2 rounded-xl"
                    >
                       <UserPlus size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
            <View className="p-6 bg-white border-t border-gray-100">
               <TouchableOpacity onPress={() => setShowManageModal(null)} className="bg-gray-900 py-4 rounded-2xl items-center">
                  <Text className="text-white font-black uppercase tracking-widest">Terminer</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}