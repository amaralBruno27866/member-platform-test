import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  showBrandPanel?: boolean;
  brandContent?: ReactNode;
  animateIn?: boolean;
  formType?: 'login' | 'secondary' | 'register-selection'; // 'login' = painel à direita, 'secondary' = painel à esquerda cobrindo login, 'register-selection' = painel cobre login
  secondaryContent?: ReactNode; // Conteúdo para mostrar quando painel desliza (forgot/register)
  fullWidthSecondary?: boolean; // Se true, secondary content usa toda a largura disponível
}

/**
 * Modern authentication layout with animated orange brand panel
 * Based on Figma design with split-screen layout and sliding animation
 */
export function AuthLayout({ 
  children, 
  showBrandPanel = true, 
  brandContent,
  animateIn = true,
  formType = 'login',
  secondaryContent,
  fullWidthSecondary = false
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-white">
      {/* Left Side - Login Form / Mobile All Content */}
      <div className="w-full flex items-center justify-center lg:w-1/2 relative z-10">
        <div className="w-full max-w-md px-4 sm:px-6 md:px-8 py-8 sm:py-12">
          {/* Mobile Logo Header - Only visible on mobile */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 rounded-2xl flex items-center justify-center p-3">
                <img 
                  src="/osot.svg" 
                  alt="OSOT Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-1 text-brand-500">
              OSOT
            </h2>
            <p className="text-sm text-gray-600">
              Ontario Society of Occupational Therapists
            </p>
          </div>

          <AnimatePresence mode="wait">
            {formType === 'login' && (
              <motion.div
                key="login-form"
                initial={animateIn ? { opacity: 0, x: -20 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            )}
            
            {/* Mobile: Show secondary content here when not login */}
            {(formType === 'secondary' || formType === 'register-selection') && secondaryContent && (
              <motion.div
                key="secondary-form-mobile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="lg:hidden"
              >
                {secondaryContent}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Side - Desktop Only Secondary Forms */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative">
        {fullWidthSecondary ? (
          <div className="w-full h-full">
            <AnimatePresence mode="wait">
              {(formType === 'secondary' || formType === 'register-selection') && secondaryContent && (
                <motion.div
                  key="secondary-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="w-full h-full"
                >
                  {secondaryContent}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="w-full max-w-md px-4 sm:px-6 md:px-8 py-8 sm:py-12">
            <AnimatePresence mode="wait">
              {(formType === 'secondary' || formType === 'register-selection') && secondaryContent && (
                <motion.div
                  key="secondary-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  {secondaryContent}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Orange Brand Panel - Slides to cover login when formType changes */}
      {showBrandPanel && (
        <motion.div
          className="hidden lg:flex absolute top-0 right-0 h-full w-1/2 lg:w-1/2 items-center justify-center overflow-hidden"
          initial={{ x: 0 }}
          animate={{
            x: formType === 'secondary' ? '-100%' : 
               formType === 'register-selection' ? '-100%' : '0%'
          }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 200
          }}
        >
          {/* Background Video */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="https://res.cloudinary.com/dfq7rpyh3/video/upload/v1765651070/DemoVideo_iv2i5s.mp4" type="video/mp4" />
          </video>
          
          {/* Orange Overlay - 75% opacity */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-600 opacity-75" />
          
          {/* Content Layer - stays on top */}
          <div className="relative z-10 text-center px-12">
            {brandContent || (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl p-4"
                >
                  <img 
                    src="/osot.svg" 
                    alt="OSOT Logo" 
                    className="w-full h-full object-contain"
                  />
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <h2 className="text-white text-4xl font-bold mb-4">
                    Welcome to OSOT
                  </h2>
                  <p className="text-brand-100 text-lg">
                    Ontario Society of Occupational Therapists
                  </p>
                </motion.div>
              </>
            )}
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl z-[5]" />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl z-[5]" />
        </motion.div>
      )}
    </div>
  );
}

interface AuthFormContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  backLink?: ReactNode;
}

/**
 * Container for auth forms with consistent styling
 */
export function AuthFormContainer({ 
  title, 
  description, 
  children, 
  backLink 
}: AuthFormContainerProps) {
  return (
    <div className="space-y-6">
      {backLink && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {backLink}
        </motion.div>
      )}
      
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-gray-600">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

interface AuthInputProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  icon?: ReactNode;
  error?: string;
  register?: Record<string, unknown>;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

/**
 * Styled input component matching Figma design
 */
export function AuthInput({
  label,
  id,
  type = 'text',
  placeholder,
  icon,
  error,
  register,
  disabled,
  value,
  onChange,
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
}: AuthInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={onChange}
          className={`
            w-full py-3 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
            transition-all duration-200
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${icon ? 'pl-11' : 'pl-4'}
            ${showPasswordToggle ? 'pr-11' : 'pr-4'}
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
          {...register}
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

interface AuthButtonProps {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Styled button component matching Figma design
 */
export function AuthButton({
  children,
  type = 'button',
  variant = 'primary',
  isLoading,
  disabled,
  onClick,
  className = '',
}: AuthButtonProps) {
  const baseStyles = 'w-full py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
    secondary: 'bg-white text-brand-500 border-2 border-brand-500 hover:bg-brand-50',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
