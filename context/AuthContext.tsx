import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

type UserProfile = { id: string; first_name: string; last_name: string; role: 'admin' | 'formateur' | 'apprenant'; email: string; };
type AuthContextType = { session: Session | null; user: { profile: UserProfile } | null; isLoading: boolean; };

const AuthContext = createContext<AuthContextType>({ session: null, user: null, isLoading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<{ profile: UserProfile } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setUser(null); setIsLoading(false); }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log("🔍 Tentative de récupération du profil pour l'ID :", userId);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error("❌ Erreur Supabase lors du fetch :", error.message);
        throw error;
      }

      if (data) {
        console.log("✅ Profil trouvé :", data.first_name);
        setUser({ profile: data as UserProfile });
      } else {
        console.error("⚠️ Aucun profil trouvé dans la table 'profiles' pour cet ID.");
        // On log les 5 premiers profils de la table pour voir ce qu'il y a dedans
        const { data: all } = await supabase.from('profiles').select('id').limit(5);
        console.log("Table profiles contient ces IDs :", all?.map(p => p.id));
      }
    } catch (e) {
      console.error("Erreur critique profil :", e);
    } finally {
      setIsLoading(false);
    }
  };

  return <AuthContext.Provider value={{ session, user, isLoading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);