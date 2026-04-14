import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext'; // On a besoin de l'utilisateur pour filtrer
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export type Notification = { id: string; title: string; message: string; read: boolean; timestamp: Date; };
type NotificationContextType = { 
  notifications: Notification[]; 
  markAsRead: (id: string) => void; 
  markAllAsRead: () => void; 
  unreadCount: number; 
};

const NotificationContext = createContext<NotificationContextType>({ notifications: [], markAsRead: () => {}, markAllAsRead: () => {}, unreadCount: 0 });

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<string[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  // 1. Récupérer les groupes de l'apprenant pour le filtrage
  useEffect(() => {
    if (user?.profile?.role === 'apprenant') {
      supabase
        .from('groupes_apprenants')
        .select('groupe_id')
        .eq('apprenant_id', user.profile.id)
        .then(({ data }) => {
          if (data) setMyGroupIds(data.map(g => g.groupe_id));
        });
    }
  }, [user]);

  // 2. Écouteur temps-réel avec filtrage logique
  useEffect(() => {
    if (!user?.profile) return;

    const channel = supabase.channel('public:seances')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'seances' }, (payload) => {
        const newSeance = payload.new;
        let shouldNotify = false;

        // LOGIQUE DE FILTRAGE
        if (user.profile.role === 'admin') {
          shouldNotify = true; // L'admin voit tout
        } else if (user.profile.role === 'formateur') {
          shouldNotify = newSeance.formateur_id === user.profile.id; // Son cours ?
        } else if (user.profile.role === 'apprenant') {
          shouldNotify = myGroupIds.includes(newSeance.groupe_id); // Son groupe ?
        }

        if (shouldNotify) {
          const newNotif = {
            id: Math.random().toString(),
            title: "Nouveau cours programmé !",
            message: `${newSeance.title} prévu le ${format(parseISO(newSeance.date), 'dd MMMM', { locale: fr })}`,
            read: false,
            timestamp: new Date()
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, myGroupIds]);

  const markAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead, markAllAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);