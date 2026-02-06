import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { router } from './lib/router'
import { queryClient } from './lib/react-query'
import { enumService } from './services/enumService'
import { Toaster } from './components/ui/sonner'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { GlobalAuthLayoutProvider } from './contexts/AuthLayoutContext'

// Preload enums on app startup for better UX
enumService.preloadEnums()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <GlobalAuthLayoutProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster />
          </QueryClientProvider>
        </GlobalAuthLayoutProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
