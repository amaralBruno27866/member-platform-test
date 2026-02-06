import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/osot.svg" 
              alt="OSOT Logo" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            OSOT Portal
          </h1>
          <p className="text-muted-foreground">
            Ontario Society of Occupational Therapists
          </p>
        </div>
        
        <div className="bg-card shadow-xl rounded-lg p-8 border border-border">
          <Outlet />
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          © 2025 OSOT Interface. All rights reserved.
        </div>
      </div>
    </div>
  );
}