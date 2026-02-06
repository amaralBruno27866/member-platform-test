import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface Step {
  number: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  fields?: string[];
}

/**
 * Multi-step progress panel for the orange brand side
 */
export function MultiStepProgress({ steps, currentStep }: { steps: Step[]; currentStep: number }) {
  return (
    <div className="text-center px-12">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-white text-4xl font-bold mb-4">
          Create Your Account
        </h2>
        <p className="text-brand-100 text-lg">
          Join Ontario Society of Occupational Therapists
        </p>
      </motion.div>

      <div className="space-y-6">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.number}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted ? 'bg-white text-brand-500' : ''}
                  ${isCurrent ? 'bg-white text-brand-500 ring-4 ring-white/30' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-white/20 text-white' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              <div className="text-left">
                <div
                  className={`
                    text-sm font-medium transition-all duration-300
                    ${isCurrent ? 'text-white' : 'text-brand-100'}
                  `}
                >
                  Step {step.number} of {steps.length}
                </div>
                <div
                  className={`
                    text-lg font-semibold transition-all duration-300
                    ${isCurrent ? 'text-white' : 'text-brand-100/70'}
                  `}
                >
                  {step.title}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-12"
      >
        <div className="w-full bg-white/20 rounded-full h-2">
          <motion.div
            className="bg-white h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-brand-100 text-sm mt-3">
          {currentStep} of {steps.length} steps completed
        </p>
      </motion.div>
    </div>
  );
}

interface MultiStepFormContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  showNavigation?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isNextDisabled?: boolean;
  backLink?: ReactNode;
}

/**
 * Container for multi-step form content
 */
export function MultiStepFormContainer({
  title,
  description,
  children,
  showNavigation = false,
  onNext,
  onPrevious,
  isFirstStep = false,
  isLastStep = false,
  isNextDisabled = false,
  backLink,
}: MultiStepFormContainerProps) {
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

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-base text-gray-600">{description}</p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-6"
      >
        {children}
      </motion.div>

      {showNavigation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex gap-4 pt-4"
        >
          {!isFirstStep && (
            <button
              type="button"
              onClick={onPrevious}
              className="flex-1 py-3 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              Previous
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            className={`
              py-3 rounded-lg font-medium transition-all duration-200
              ${isFirstStep ? 'w-full' : 'flex-1'}
              ${isLastStep ? 'bg-green-600 hover:bg-green-700' : 'bg-brand-500 hover:bg-brand-600'}
              text-white disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLastStep ? 'Complete Registration' : 'Continue'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
