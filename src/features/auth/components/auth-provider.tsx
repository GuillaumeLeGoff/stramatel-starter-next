'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { log } from 'console';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth } = useAuth();
  const initialCheckDone = useRef(false);

  useEffect(() => {
    console.log("checkAuth");
    console.log("initialCheckDone", initialCheckDone.current);
    if (!initialCheckDone.current) {
      checkAuth();
      initialCheckDone.current = true;
    }
  }, [checkAuth]);

  return <>{children}</>;
} 