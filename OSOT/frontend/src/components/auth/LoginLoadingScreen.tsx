import { motion } from 'framer-motion';

/**
 * Loading screen shown after login while dashboard loads
 */
export function LoginLoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-50 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl w-32 h-32 flex items-center justify-center shadow-lg">
          <div className="bg-white rounded-2xl w-20 h-20 flex items-center justify-center">
            <span className="text-brand-500 text-2xl font-bold">OSOT</span>
          </div>
        </div>
        
        {/* Loading spinner */}
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        
        <p className="text-gray-600 text-lg font-medium">Loading Dashboard...</p>
      </div>
    </motion.div>
  );
}
