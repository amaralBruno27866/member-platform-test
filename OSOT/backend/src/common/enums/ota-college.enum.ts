/**
 * Enum: OtaCollege
 * Objective: Define the available OTA college options for education records.
 * Functionality: Provides standardized list of colleges that offer Occupational Therapy Assistant programs.
 * Expected Result: Consistent college selection across the application.
 *
 * Note: Based on the Choices_OTA_Colleges from the Dataverse table definition.
 */

export enum OtaCollege {
  OTHER = 0,
  NOT_APPLICABLE = 1,
  ALGONQUIN_COLLEGE = 2,
  ANDERSON_COLLEGE = 3,
  CAMBRIAN = 4,
  CANADORE_COLLEGE = 5,
  CDI_COLLEGE = 6,
  CENTENNIAL_COLLEGE = 7,
  COLLEGE_BOREAL = 8,
  CONESTOGA_COLLEGE = 9,
  DURHAM_COLLEGE = 10,
  FANSHAWE_COLLEGE = 11,
  FLEMING_COLLEGE = 12,
  GEORGIAN_COLLEGE = 13,
  HUMBER_COLLEGE = 14,
  KLC_COLLEGE = 15,
  LA_CITE = 16,
  LAMBTON_COLLEGE = 17,
  LOYALIST_COLLEGE = 18,
  MOHAWK_COLLEGE = 19,
  NIAGARA_COLLEGE = 20,
  NORTHERN_COLLEGE = 21,
  OXFORD_COLLEGE = 22,
  SAULT_COLLEGE = 23,
  SENECA_COLLEGE = 24,
  ST_CLAIR_COLLEGE = 25,
  TRIOS_COLLEGE = 26,
}

/**
 * Helper function to get OTA college display name
 */
export function getOtaCollegeDisplayName(college: OtaCollege): string {
  switch (college) {
    case OtaCollege.OTHER:
      return 'Other';
    case OtaCollege.NOT_APPLICABLE:
      return 'N/A';
    case OtaCollege.ALGONQUIN_COLLEGE:
      return 'Algonquin College';
    case OtaCollege.ANDERSON_COLLEGE:
      return 'Anderson College';
    case OtaCollege.CAMBRIAN:
      return 'Cambrian';
    case OtaCollege.CANADORE_COLLEGE:
      return 'Canadore College';
    case OtaCollege.CDI_COLLEGE:
      return 'CDI College';
    case OtaCollege.CENTENNIAL_COLLEGE:
      return 'Centennial College';
    case OtaCollege.COLLEGE_BOREAL:
      return 'Collège Boréal';
    case OtaCollege.CONESTOGA_COLLEGE:
      return 'Conestoga College';
    case OtaCollege.DURHAM_COLLEGE:
      return 'Durham College';
    case OtaCollege.FANSHAWE_COLLEGE:
      return 'Fanshawe College';
    case OtaCollege.FLEMING_COLLEGE:
      return 'Fleming College';
    case OtaCollege.GEORGIAN_COLLEGE:
      return 'Georgian College';
    case OtaCollege.HUMBER_COLLEGE:
      return 'Humber College';
    case OtaCollege.KLC_COLLEGE:
      return 'KLC College';
    case OtaCollege.LA_CITE:
      return 'La Cité';
    case OtaCollege.LAMBTON_COLLEGE:
      return 'Lambton College';
    case OtaCollege.LOYALIST_COLLEGE:
      return 'Loyalist College';
    case OtaCollege.MOHAWK_COLLEGE:
      return 'Mohawk College';
    case OtaCollege.NIAGARA_COLLEGE:
      return 'Niagara College';
    case OtaCollege.NORTHERN_COLLEGE:
      return 'Northern College';
    case OtaCollege.OXFORD_COLLEGE:
      return 'Oxford College';
    case OtaCollege.SAULT_COLLEGE:
      return 'Sault College';
    case OtaCollege.SENECA_COLLEGE:
      return 'Seneca College';
    case OtaCollege.ST_CLAIR_COLLEGE:
      return 'St. Clair College';
    case OtaCollege.TRIOS_COLLEGE:
      return 'TRIOS College';
    default:
      return 'Unknown';
  }
}
