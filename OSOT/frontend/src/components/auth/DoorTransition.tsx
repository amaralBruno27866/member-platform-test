import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface DoorTransitionProps {
  children: ReactNode;
  isClosing?: boolean; // For logout - doors close over content
  isOpening?: boolean; // For login - doors open revealing content
  isLoadingBehindDoors?: boolean;
}

/**
 * Component that wraps dashboard content and animates a door closing/opening effect
 * Shows loading state when doors are closed
 */
export function DoorTransition({ children, isClosing = false, isOpening = false, isLoadingBehindDoors = false }: DoorTransitionProps) {
  const showDoors = isClosing || isLoadingBehindDoors || isOpening;
  
  return (
    <div className="relative min-h-screen">
      {/* Main content - render always when opening (behind doors), hide when closing */}
      {!isClosing && (
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.2,
            ease: 'easeOut'
          }}
        >
          {children}
        </motion.div>
      )}

      {/* Door animation overlays */}
      <AnimatePresence>
        {showDoors && (
          <>
            {/* Left door (white) - Hidden on mobile */}
            <motion.div
              initial={{ x: isOpening ? '0%' : '-100%' }}
              animate={{ 
                x: isOpening ? '-100%' : (isLoadingBehindDoors && !isClosing ? '-100%' : '0%')
              }}
              exit={{ x: '-100%' }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 150,
                duration: 0.8
              }}
              className="hidden lg:block fixed top-0 left-0 w-1/2 h-full bg-white z-50 shadow-2xl"
            />

            {/* Right door (brand blue) - Full width on mobile, half width on desktop */}
            <motion.div
              initial={{ x: isOpening ? '0%' : '100%', opacity: 1 }}
              animate={{ 
                x: isOpening ? '100%' : (isLoadingBehindDoors && !isClosing ? '100%' : '0%'),
                opacity: isClosing ? [1, 1, 0] : 1
              }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 150,
                duration: 0.8,
                opacity: {
                  duration: 0.4,
                  delay: isClosing ? 0.6 : 0,
                  ease: 'easeOut'
                }
              }}
              className="fixed top-0 right-0 w-full lg:w-1/2 h-full bg-gradient-to-br from-brand-500 to-brand-600 z-50 shadow-2xl"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
