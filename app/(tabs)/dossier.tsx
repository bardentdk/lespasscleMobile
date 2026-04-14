import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import * as ImagePicker from 'expo-image-picker';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Camera, Image as ImageIcon, UploadCloud, Loader2 } from 'lucide-react-native';

interface Document {
  id: string;
  title: string;
  file_path: string;
  created_at: string;
}

export default function Dossier() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { requestCameraPermission, requestGalleryPermission } = usePermissions();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user?.profile?.id) fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('apprenant_id', user?.profile?.id)
      .order('created_at', { ascending: false });

    if (!error && data) setDocuments(data as Document[]);
    setLoading(false);
  };

  const handlePickImage = async (useCamera: boolean) => {
    const hasPermission = useCamera ? await requestCameraPermission() : await requestGalleryPermission();
    if (!hasPermission) return;

    let result;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: false });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: false });
    }

    if (!result.canceled && result.assets[0]) {
      uploadDocument(result.assets[0].uri);
    }
  };

  const uploadDocument = async (uri: string) => {
    if (!user) return;
    setUploading(true);

    try {
      // 1. Préparer le fichier pour Supabase Storage
      const fileName = `${user.profile.id}/${Date.now()}-justificatif.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();

      // 2. Upload dans le bucket 'dossiers'
      const { error: storageError } = await supabase.storage
        .from('dossiers')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (storageError) throw storageError;

      // 3. Enregistrer dans la table 'documents'
      const { error: dbError } = await supabase.from('documents').insert([{
        apprenant_id: user.profile.id,
        title: `Justificatif mobile du ${format(new Date(), 'dd/MM')}`,
        file_path: fileName,
        file_type: 'image/jpeg',
        uploaded_by: user.profile.id
      }]);

      if (dbError) throw dbError;

      Alert.alert("Succès", "Votre justificatif a été envoyé avec succès !");
      fetchDocuments();
    } catch (error: any) {
      Alert.alert("Erreur d'envoi", error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header respectant la Safe Area */}
      <View 
        style={{ paddingTop: Math.max(insets.top, 20) }} 
        className="bg-brand-600 pb-8 px-6 rounded-b-[40px] shadow-xl shadow-brand-900"
      >
        <Text className="text-white text-2xl font-black uppercase tracking-tighter">Mon Dossier</Text>
        <Text className="text-brand-100 font-bold mt-1 text-xs">Gérez vos justificatifs médicaux</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        
        {/* Zone d'Upload */}
        <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-8">
          <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Envoyer un document
          </Text>
          
          <View className="flex-row justify-between space-x-4">
            <TouchableOpacity 
              onPress={() => handlePickImage(true)}
              disabled={uploading}
              className="flex-1 bg-brand-50 p-4 rounded-[24px] items-center border border-brand-100 active:bg-brand-100"
            >
              <Camera size={24} color="#006eb8" />
              <Text className="text-brand-700 font-black text-[10px] uppercase mt-2">Appareil Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handlePickImage(false)}
              disabled={uploading}
              className="flex-1 bg-accent-50 p-4 rounded-[24px] items-center border border-accent-100 active:bg-accent-100"
            >
              <ImageIcon size={24} color="#f59e0b" />
              <Text className="text-accent-700 font-black text-[10px] uppercase mt-2">Galerie</Text>
            </TouchableOpacity>
          </View>

          {uploading && (
            <View className="mt-4 flex-row items-center justify-center bg-gray-50 p-3 rounded-xl">
              <Loader2 size={16} color="#006eb8" className="animate-spin mr-2" />
              <Text className="text-gray-500 text-xs font-bold">Envoi en cours...</Text>
            </View>
          )}
        </View>

        {/* Liste des documents */}
        <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
          Mes documents transmis
        </Text>

        {loading ? (
          <ActivityIndicator color="#006eb8" />
        ) : documents.length === 0 ? (
          <View className="bg-white p-8 rounded-[32px] border border-dashed border-gray-200 items-center">
            <UploadCloud size={32} color="#cbd5e1" />
            <Text className="text-gray-400 font-bold mt-2 text-center">Aucun document transmis.</Text>
          </View>
        ) : (
          documents.map(doc => (
            <View key={doc.id} className="bg-white p-4 rounded-[24px] mb-4 border border-gray-100 shadow-sm flex-row items-center">
              <View className="bg-brand-50 p-3 rounded-2xl mr-4">
                <FileText size={20} color="#006eb8" />
              </View>
              <View className="flex-1">
                <Text className="font-black text-gray-900 text-sm leading-tight">{doc.title}</Text>
                <Text className="text-gray-400 text-xs font-bold mt-1">
                  Transmis le {format(parseISO(doc.created_at), 'dd/MM/yyyy')}
                </Text>
              </View>
            </View>
          ))
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}