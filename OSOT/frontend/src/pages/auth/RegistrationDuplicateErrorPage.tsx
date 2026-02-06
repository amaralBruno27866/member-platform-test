/**
 * RegistrationDuplicateErrorPage
 * 
 * This file is kept for route compatibility but the actual rendering
 * is handled by AuthPagesLayout which displays RegistrationDuplicateErrorContent
 * with the sliding panel animation.
 * 
 * Redirect to the route that AuthPagesLayout handles.
 */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function RegistrationDuplicateErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to the route handled by AuthPagesLayout, preserving state
    navigate('/auth/register/duplicate-error', { 
      replace: true,
      state: location.state 
    });
  }, [navigate, location.state]);

  return null;
}
