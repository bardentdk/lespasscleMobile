import { Tabs } from 'expo-router';
import { Calendar, FolderOpen, LayoutDashboard, User, UserCheck } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const role = user?.profile?.role;

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, 
        tabBarActiveTintColor: '#006eb8', 
        tabBarInactiveTintColor: '#94a3b8', 
        tabBarLabelPosition: 'below-icon', // Force le texte sous l'icône
        tabBarStyle: { 
          backgroundColor: '#ffffff', 
          borderTopWidth: 1, 
          borderTopColor: '#f1f5f9', 
          // On augmente à 75px sur Android pour éviter l'écrasement
          height: Platform.OS === 'android' ? 75 + insets.bottom : 85,
          // On centre verticalement en jouant sur le padding global
          paddingBottom: Platform.OS === 'android' ? (insets.bottom > 0 ? insets.bottom + 8 : 12) : insets.bottom,
          paddingTop: 12,
        }, 
        tabBarLabelStyle: { 
          fontFamily: 'System', 
          fontWeight: '900', 
          fontSize: 10, 
          textTransform: 'uppercase',
          marginTop: 4, // Espace constant entre l'icône et le texte
        },
        // On supprime le padding individuel qui causait le décalage
        tabBarItemStyle: {
          height: 50,
        }
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Accueil', 
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} /> 
        }} 
      />
      
      <Tabs.Screen 
        name="planning" 
        options={{ 
          title: 'Planning', 
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} /> 
        }} 
      />
      
      <Tabs.Screen 
        name="suivi" 
        options={{ 
          title: 'Appel', 
          tabBarIcon: ({ color }) => <UserCheck size={24} color={color} />,
          href: (role === 'admin' || role === 'formateur') ? '/suivi' : null 
        }} 
      />
      
      <Tabs.Screen 
        name="dossier" 
        options={{ 
          title: 'Dossier', 
          tabBarIcon: ({ color }) => <FolderOpen size={24} color={color} />,
          href: (role === 'admin' || role === 'apprenant') ? '/dossier' : null 
        }} 
      />
      
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profil', 
          tabBarIcon: ({ color }) => <User size={24} color={color} /> 
        }} 
      />
    </Tabs>
  );
}