import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthLayoutProvider, useAuthLayoutContext } from '@/contexts/AuthLayoutContext';
import LoginPageContent from './LoginPageContent';
import ForgotPasswordPageContent from './ForgotPasswordPageContent';
import ResetPasswordPage from './ResetPasswordPage';
import RegisterSelectionContent from './RegisterSelectionContent';
import RegisterProfessionalPage from './RegisterProfessionalPage';
import RegisterAffiliatePage from './RegisterAffiliatePage';
import RegistrationSuccessContent from './RegistrationSuccessContent';
import RegistrationDuplicateErrorContent from './RegistrationDuplicateErrorContent';

/**
 * Layout wrapper that keeps AuthLayout mounted while switching between auth pages
 * This ensures animations work smoothly without component remounting
 */
export default function AuthPagesLayout() {
  const location = useLocation();
  const path = location.pathname;
  const [brandContent, setBrandContentState] = useState<ReactNode>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const globalContext = useAuthLayoutContext();
  
  const triggerFadeOut = (onComplete: () => void) => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };
  
  const setBrandContent = useCallback((content: ReactNode) => {
    setBrandContentState(content);
  }, []);
  
  const isLogin = path === '/auth/login';
  const isForgotPassword = path === '/auth/forgot-password';
  const isResetPassword = path === '/auth/reset-password';
  const isRegisterSelection = path === '/auth/register';
  const isRegisterProfessional = path === '/auth/register/professional';
  const isRegisterAffiliate = path === '/auth/register/affiliate';
  const isRegistrationSuccess = path.startsWith('/auth/register/success');
  const isRegistrationError = path === '/auth/register/duplicate-error';
  
  // Success and error pages need full width
  const fullWidthSecondary = isRegistrationSuccess || isRegistrationError;

  // Reset brand content when not in registration forms (so logo reappears)
  useEffect(() => {
    if (!isRegisterProfessional && !isRegisterAffiliate) {
      setBrandContentState(null);
    }
  }, [isRegisterProfessional, isRegisterAffiliate]);

  // Determine form type for panel animation
  let formType: 'login' | 'secondary' | 'register-selection' = 'login';
  if (isForgotPassword || isResetPassword || isRegistrationSuccess || isRegistrationError) {
    formType = 'secondary';
  } else if (isRegisterSelection) {
    formType = 'register-selection';
  } else if (isRegisterProfessional || isRegisterAffiliate) {
    // Forms de registro: painel volta para direita (formType = 'login')
    formType = 'login';
  }
  
  // Determine what content to show on main (left) or secondary (right) side
  let mainContent = null;
  let secondaryContent = null;
  
  if (isLogin) {
    mainContent = <LoginPageContent />;
  } else if (isForgotPassword) {
    secondaryContent = <ForgotPasswordPageContent />;
  } else if (isResetPassword) {
    secondaryContent = <ResetPasswordPage />;
  } else if (isRegisterSelection) {
    secondaryContent = <RegisterSelectionContent />;
  } else if (isRegisterProfessional) {
    mainContent = <RegisterProfessionalPage renderContentOnly />;
  } else if (isRegisterAffiliate) {
    mainContent = <RegisterAffiliatePage renderContentOnly />;
  } else if (isRegistrationSuccess) {
    secondaryContent = <RegistrationSuccessContent />;
  } else if (isRegistrationError) {
    secondaryContent = <RegistrationDuplicateErrorContent />;
  }

  return (
    <div 
      className="transition-opacity duration-500"
      style={{ opacity: isFadingOut ? 0 : 1 }}
    >
      <AuthLayoutProvider value={{ 
        isWithinAuthPagesLayout: true, 
        setBrandContent,
        triggerDoorClosing: globalContext.triggerDoorClosing,
        isDoorClosing: globalContext.isDoorClosing,
        triggerFadeOut
      }}>
        <AuthLayout
          formType={formType}
          showBrandPanel={true}
          secondaryContent={secondaryContent}
          brandContent={brandContent}
          fullWidthSecondary={fullWidthSecondary}
        >
          <AnimatePresence mode="wait">
            {mainContent}
          </AnimatePresence>
        </AuthLayout>
      </AuthLayoutProvider>
    </div>
  );
}
