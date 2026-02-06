import { useNavigate } from 'react-router-dom';
import { Building2, UserCog, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthFormContainer } from '@/components/auth/AuthLayout';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function RegisterSelectionContent() {
  const navigate = useNavigate();

  const handleSelectType = (type: 'professional' | 'affiliate') => {
    navigate(`/auth/register/${type}`);
  };

  return (
    <AuthFormContainer
      title="Create Your Account"
      description="Choose the account type that best describes you"
      backLink={
        <button
          onClick={() => navigate('/auth/login')}
          className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to login
        </button>
      }
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* OT/OTA Professional Option */}
        <motion.div variants={item}>
          <button
            onClick={() => handleSelectType('professional')}
            className="w-full group relative overflow-hidden rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100/50 p-4 sm:p-8 text-left transition-all duration-300 hover:border-brand-400 hover:shadow-xl hover:scale-[1.02]"
          >
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="flex-shrink-0">
                <div className="rounded-2xl bg-white p-3 sm:p-4 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <UserCog className="w-8 h-8 sm:w-12 sm:h-12 text-brand-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                  Individual
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  Register as an occupational therapist or occupational therapy assistant
                </p>
                <div className="flex items-center text-brand-600 font-semibold group-hover:-translate-x-2 transition-transform duration-300">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Get Started
                </div>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Affiliate Option */}
        <motion.div variants={item}>
          <button
            onClick={() => handleSelectType('affiliate')}
            className="w-full group relative overflow-hidden rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100/50 p-4 sm:p-8 text-left transition-all duration-300 hover:border-brand-400 hover:shadow-xl hover:scale-[1.02]"
          >
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="flex-shrink-0">
                <div className="rounded-2xl bg-white p-3 sm:p-4 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-brand-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                  Business
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  Register as an organization or business affiliate partner
                </p>
                <div className="flex items-center text-brand-600 font-semibold group-hover:-translate-x-2 transition-transform duration-300">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Get Started
                </div>
              </div>
            </div>
          </button>
        </motion.div>
      </motion.div>
    </AuthFormContainer>
  );
}
