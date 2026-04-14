import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Écoute des nouvelles séances en temps réel via Supabase
    const channel = supabase.channel('public:seances')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'seances' }, (payload) => {
        const newSeance = payload.new;
        const newNotif = {
          id: newSeance.id,
          title: "Nouvelle séance programmée",
          message: `${newSeance.title} le ${format(parseISO(newSeance.date), 'dd MMM', { locale: fr })}`,
          read: false,
          timestamp: new Date()
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead, markAllAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);