/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthLayoutContextType {
  isWithinAuthPagesLayout: boolean;
  setBrandContent?: (content: ReactNode) => void;
  triggerDoorClosing?: () => void;
  isDoorClosing?: boolean;
  triggerDoorOpening?: (onComplete?: () => void) => void;
  isDoorOpening?: boolean;
  triggerFadeOut?: (onComplete: () => void) => void;
}

const AuthLayoutContext = createContext<AuthLayoutContextType>({
  isWithinAuthPagesLayout: false,
  isDoorClosing: false,
  isDoorOpening: false,
});

export const useAuthLayoutContext = () => useContext(AuthLayoutContext);

export function AuthLayoutProvider({ 
  children, 
  value 
}: { 
  children: ReactNode; 
  value: AuthLayoutContextType;
}) {
  return (
    <AuthLayoutContext.Provider value={value}>
      {children}
    </AuthLayoutContext.Provider>
  );
}

// Global provider accessible from anywhere
export function GlobalAuthLayoutProvider({ children }: { children: ReactNode }) {
  const [isDoorClosing, setIsDoorClosing] = useState(false);
  
  const triggerDoorClosing = useCallback(() => {
    setIsDoorClosing(true);
    setTimeout(() => setIsDoorClosing(false), 1000);
  }, []);
  
  return (
    <AuthLayoutContext.Provider value={{ 
      isWithinAuthPagesLayout: false,
      triggerDoorClosing,
      isDoorClosing,
      triggerDoorOpening: undefined,
      isDoorOpening: false
    }}>
      {children}
    </AuthLayoutContext.Provider>
  );
}
