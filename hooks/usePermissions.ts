import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const usePermissions = () => {
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission", "L'accès à l'appareil photo est nécessaire.");
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission", "L'accès à la galerie est nécessaire.");
      return false;
    }
    return true;
  };

  return { requestCameraPermission, requestGalleryPermission };
};