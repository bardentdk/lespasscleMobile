import { Tabs } from 'expo-router';
import { Calendar, FolderOpen, LayoutDashboard, User, UserCheck } from 'lucide-react-native';
import React from 'react';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#006eb8', tabBarInactiveTintColor: '#94a3b8', tabBarStyle: { backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9', height: 60, paddingBottom: 8, paddingTop: 8 }, tabBarLabelStyle: { fontFamily: 'System', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' } }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} /> }} />
      <Tabs.Screen name="planning" options={{ title: 'Planning', tabBarIcon: ({ color }) => <Calendar size={24} color={color} /> }} />
      <Tabs.Screen name="suivi" options={{ title: 'Appel', tabBarIcon: ({ color }) => <UserCheck size={24} color={color} /> }} />
      <Tabs.Screen name="dossier" options={{ title: 'Dossier', tabBarIcon: ({ color }) => <FolderOpen size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <User size={24} color={color} /> }} />
    </Tabs>
  );
}