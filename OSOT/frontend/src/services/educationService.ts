/**
 * Education Service
 * Handles API calls for both OT and OTA education based on account group
 * Endpoints: /private/ot-educations or /private/ota-educations
 */

import { api } from '@/lib/api';
import type {
  EducationResponse,
  UpdateEducationDto,
  OtEducationApiResponse,
  OtaEducationApiResponse,
  OtEducationUpdateApiResponse,
  OtaEducationUpdateApiResponse,
  UpdateOtEducationDto,
  UpdateOtaEducationDto,
} from '@/types/education';

/**
 * Get education record based on account group
 * Returns first education from array or null if empty
 */
export const getMyEducation = async (
  accountGroup: number
): Promise<EducationResponse | null> => {
  console.log('📞 [educationService] getMyEducation called with accountGroup:', accountGroup);
  
  // Determine endpoint based on account group
  // osot_account_group: 1 = OT, 2 = Admin, 3 = OTA, 4 = Staff
  const isOTA = accountGroup === 3;
  
  const endpoint = isOTA 
    ? '/private/ota-educations/me' 
    : '/private/ot-educations/me';

  console.log('🔗 [educationService] Using endpoint:', endpoint);

  if (isOTA) {
    const response = await api.get<OtaEducationApiResponse>(endpoint);
    console.log('✅ [educationService] Raw OTA response:', response.data);
    const educations = response.data.data;
    const result = educations && educations.length > 0 ? educations[0] : null;
    console.log('📦 [educationService] Processed OTA result:', result);
    return result;
  } else {
    const response = await api.get<OtEducationApiResponse>(endpoint);
    console.log('✅ [educationService] Raw OT response:', response.data);
    const educations = response.data.data;
    const result = educations && educations.length > 0 ? educations[0] : null;
    console.log('📦 [educationService] Processed OT result:', result);
    return result;
  }
};

/**
 * Update education record based on account group
 * Returns updated single education object
 */
export const updateMyEducation = async (
  accountGroup: number,
  data: UpdateEducationDto
): Promise<EducationResponse> => {
  // Determine endpoint based on account group
  // osot_account_group: 1 = OT, 2 = Admin, 3 = OTA, 4 = Staff
  const isOTA = accountGroup === 3;
  
  const endpoint = isOTA 
    ? '/private/ota-educations/me' 
    : '/private/ot-educations/me';

  if (isOTA) {
    const response = await api.patch<OtaEducationUpdateApiResponse>(
      endpoint,
      data as UpdateOtaEducationDto
    );
    return response.data.data;
  } else {
    const response = await api.patch<OtEducationUpdateApiResponse>(
      endpoint,
      data as UpdateOtEducationDto
    );
    return response.data.data;
  }
};

export const educationService = {
  getMyEducation,
  updateMyEducation,
};
