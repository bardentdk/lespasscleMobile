import { useState } from 'react';

// 🚨 MODE EXPO GO : Désactivé pour éviter le crash SDK 53
export function useNotifications() {
  const [expoPushToken] = useState<string | undefined>(undefined);
  return { expoPushToken };
}