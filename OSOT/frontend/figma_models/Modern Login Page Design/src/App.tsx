import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';

type FormType = 'login' | 'register' | 'forgot';

export default function App() {
  const [formType, setFormType] = useState<FormType>('login');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* White Background - Always contains the forms */}
      <div className="w-full flex">
        {/* Left Side - Forms Area */}
        <div className="w-1/2 bg-white flex items-center justify-center">
          <div className="w-full max-w-md px-12">
            <AnimatePresence mode="wait">
              {formType === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="mb-2">Welcome Back</h1>
                  <p className="text-gray-600 mb-8">Please enter your details to sign in</p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm mb-2 text-gray-700">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm mb-2 text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          id="password"
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your password"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Remember me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setFormType('forgot')}
                        className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Sign In
                    </button>

                    <div className="text-center">
                      <span className="text-sm text-gray-600">Don't have an account? </span>
                      <button
                        type="button"
                        onClick={() => setFormType('register')}
                        className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                      >
                        Register now
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side - White background that shows register/forgot forms */}
        <div className="w-1/2 bg-white flex items-center justify-center">
          <div className="w-full max-w-md px-12">
            <AnimatePresence mode="wait">
              {formType === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <button
                    onClick={() => setFormType('login')}
                    className="flex items-center text-gray-700 mb-6 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to login
                  </button>

                  <h1 className="mb-2">Create Account</h1>
                  <p className="text-gray-600 mb-8">Sign up to get started</p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="reg-name" className="block text-sm mb-2 text-gray-700">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          id="reg-name"
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-email" className="block text-sm mb-2 text-gray-700">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          id="reg-email"
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-password" className="block text-sm mb-2 text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          id="reg-password"
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Create a password"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-confirm" className="block text-sm mb-2 text-gray-700">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          id="reg-confirm"
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Confirm your password"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Create Account
                    </button>
                  </form>
                </motion.div>
              )}

              {formType === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <button
                    onClick={() => setFormType('login')}
                    className="flex items-center text-gray-700 mb-6 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to login
                  </button>

                  <h1 className="mb-2">Reset Password</h1>
                  <p className="text-gray-600 mb-8">
                    Enter your email and we'll send you instructions to reset your password
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="forgot-email" className="block text-sm mb-2 text-gray-700">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          id="forgot-email"
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Send Reset Link
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Orange Panel - Slides over to cover login form */}
      <motion.div
        className="absolute top-0 right-0 h-full w-1/2 bg-orange-500 flex items-center justify-center"
        initial={{ x: 0 }}
        animate={{
          x: formType !== 'login' ? '-100%' : '0%'
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 200,
        }}
      >
        <div className="text-center">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-orange-500 text-5xl">🚀</span>
          </div>
          <h2 className="text-white text-3xl mb-4">Your Company</h2>
          <p className="text-orange-100 text-lg">Innovation & Excellence</p>
        </div>
      </motion.div>
    </div>
  );
}