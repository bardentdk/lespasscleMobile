import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import * as ImagePicker from 'expo-image-picker';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Camera, Image as ImageIcon, UploadCloud, Loader2, Users, ArrowLeft } from 'lucide-react-native';

// NOUVEL IMPORT OBLIGATOIRE POUR LE MOBILE
import { decode } from 'base64-arraybuffer';

interface Document { id: string; title: string; file_url: string; created_at: string; }
interface Apprenant { id: string; first_name: string; last_name: string; email: string; }

export default function Dossier() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { requestCameraPermission, requestGalleryPermission } = usePermissions();
  
  const isApprenant = user?.profile?.role === 'apprenant';
  
  const [apprenants, setApprenants] = useState<Apprenant[]>([]);
  const [selectedApprenant, setSelectedApprenant] = useState<Apprenant | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isApprenant && user?.profile) {
      setSelectedApprenant(user.profile as Apprenant);
    } else {
      fetchApprenants();
    }
  }, [user]);

  useEffect(() => {
    if (selectedApprenant) fetchDocuments(selectedApprenant.id);
  }, [selectedApprenant]);

  const fetchApprenants = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('role', 'apprenant').order('last_name');
    setApprenants(data || []);
    setLoading(false);
  };

  const fetchDocuments = async (appId: string) => {
    setLoading(true);
    const { data } = await supabase.from('documents').select('*').eq('apprenant_id', appId).order('created_at', { ascending: false });
    setDocuments(data || []);
    setLoading(false);
  };

  const handlePickImage = async (useCamera: boolean) => {
    const hasPermission = useCamera ? await requestCameraPermission() : await requestGalleryPermission();
    if (!hasPermission) return;

    let result;
    if (useCamera) {
      // CORRECTION : On demande spécifiquement le format base64 (base64: true)
      result = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true });
    } else {
      // CORRECTION : On demande spécifiquement le format base64 (base64: true)
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, base64: true });
    }

    if (!result.canceled && result.assets[0]) {
      // On passe l'objet asset en entier
      uploadDocument(result.assets[0]);
    }
  };

  const uploadDocument = async (asset: ImagePicker.ImagePickerAsset) => {
    // On s'assure que le base64 est bien présent
    if (!user || !selectedApprenant || !asset.base64) return;
    setUploading(true);

    try {
      const fileName = `${selectedApprenant.id}/${Date.now()}-photo.jpg`;

      // CORRECTION MAJEURE : On utilise decode() pour envoyer le fichier correctement à Supabase
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(fileName, decode(asset.base64), { 
          contentType: 'image/jpeg' 
        });
        
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('documents').insert([{
        apprenant_id: selectedApprenant.id,
        title: `Justificatif mobile du ${format(new Date(), 'dd/MM')}`,
        file_url: fileName,
        type: 'image/jpeg',
        uploaded_by: user.profile.id
      }]);

      if (dbError) throw dbError;

      Alert.alert("Succès", "Le document a été sauvegardé !");
      fetchDocuments(selectedApprenant.id);
    } catch (error: any) {
      Alert.alert("Erreur d'envoi", error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isApprenant && !selectedApprenant) {
    return (
      <View className="flex-1 bg-gray-50">
        <View style={{ paddingTop: Math.max(insets.top, 20) }} className="bg-brand-600 pb-6 px-6 rounded-b-[40px] shadow-xl">
          <Text className="text-white text-2xl font-black uppercase tracking-tighter">Dossiers</Text>
          <Text className="text-brand-100 font-bold mt-1 text-xs">Sélectionnez un stagiaire</Text>
        </View>
        <ScrollView className="flex-1 px-6 pt-6">
          {loading ? <ActivityIndicator color="#006eb8" /> : apprenants.map(app => (
            <TouchableOpacity key={app.id} onPress={() => setSelectedApprenant(app)} className="bg-white p-4 rounded-2xl mb-3 shadow-sm flex-row items-center border border-gray-100">
              <View className="h-10 w-10 bg-brand-50 rounded-full items-center justify-center mr-4">
                <Users size={20} color="#006eb8" />
              </View>
              <View>
                <Text className="font-black text-gray-900">{app.first_name} {app.last_name}</Text>
                <Text className="text-xs text-gray-400 font-medium">{app.email}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View className="h-10" />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ paddingTop: Math.max(insets.top, 20) }} className="bg-brand-600 pb-8 px-6 rounded-b-[40px] shadow-xl">
        {!isApprenant && (
          <TouchableOpacity onPress={() => setSelectedApprenant(null)} className="mb-4 flex-row items-center">
            <ArrowLeft size={20} color="white" />
            <Text className="text-white font-bold ml-2">Retour aux dossiers</Text>
          </TouchableOpacity>
        )}
        <Text className="text-white text-2xl font-black uppercase tracking-tighter">
          {isApprenant ? 'Mon Dossier' : `Dossier de ${selectedApprenant?.first_name}`}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-8">
          <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Ajouter un document</Text>
          <View className="flex-row justify-between space-x-4">
            <TouchableOpacity onPress={() => handlePickImage(true)} disabled={uploading} className="flex-1 bg-brand-50 p-4 rounded-[24px] items-center border border-brand-100">
              <Camera size={24} color="#006eb8" />
              <Text className="text-brand-700 font-black text-[10px] uppercase mt-2 text-center">Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handlePickImage(false)} disabled={uploading} className="flex-1 bg-accent-50 p-4 rounded-[24px] items-center border border-accent-100">
              <ImageIcon size={24} color="#f59e0b" />
              <Text className="text-accent-700 font-black text-[10px] uppercase mt-2 text-center">Galerie</Text>
            </TouchableOpacity>
          </View>
          {uploading && (
            <View className="mt-4 flex-row items-center justify-center"><Loader2 size={16} color="#006eb8" className="animate-spin mr-2" /><Text className="text-gray-500 text-xs font-bold">Envoi...</Text></View>
          )}
        </View>

        <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Documents transmis</Text>

        {loading ? <ActivityIndicator color="#006eb8" /> : documents.length === 0 ? (
          <View className="bg-white p-8 rounded-[32px] border border-dashed border-gray-200 items-center">
            <UploadCloud size={32} color="#cbd5e1" />
            <Text className="text-gray-400 font-bold mt-2">Aucun document.</Text>
          </View>
        ) : documents.map(doc => (
          <View key={doc.id} className="bg-white p-4 rounded-[24px] mb-4 border border-gray-100 shadow-sm flex-row items-center">
            <View className="bg-brand-50 p-3 rounded-2xl mr-4"><FileText size={20} color="#006eb8" /></View>
            <View className="flex-1">
              <Text className="font-black text-gray-900 text-sm leading-tight">{doc.title}</Text>
              <Text className="text-gray-400 text-xs font-bold mt-1">Le {format(parseISO(doc.created_at), 'dd/MM/yyyy')}</Text>
            </View>
          </View>
        ))}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}