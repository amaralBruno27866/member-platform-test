import { useState, useEffect, ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { MultiStepProgress, MultiStepFormContainer, type Step } from '@/components/auth/MultiStepLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, User, MapPin, Mail, Shield, GraduationCap, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { enumService, type EnumOption } from '@/services/enumService';
import { orchestratorService, type CompleteUserRegistrationData } from '@/services/orchestratorService';
import { extractErrorInfo } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import { toast } from 'sonner';
import { formatPhoneNumber } from '@/lib/formatters';
import RegisterProfessionalPage from './RegisterProfessionalPage';

interface RegisterProfessionalContentProps {
  onBrandContentChange?: (content: ReactNode) => void;
}

export function RegisterProfessionalContent({ onBrandContentChange }: RegisterProfessionalContentProps) {
  // Usar o componente original mas extrair o estado das etapas
  // Por enquanto, vou retornar o componente completo
  return <RegisterProfessionalPage renderContentOnly />;
}
