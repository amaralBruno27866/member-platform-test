/**
 * Enum: GraduationYear
 * Objective: Define the available graduation year options for educational timeline classification.
 * Functionality: Provides standardized graduation year choices synchronized with Dataverse global choices.
 * Expected Result: Accurate educational timeline classification for both OT and non-OT degrees.
 *
 * Note: This enum corresponds to the Choices_Years global choice in Dataverse.
 * Values are synchronized with the Choice fields osot_OT_Grad_Year and osot_NonOT_Grad_Year in Table_OT_Education.
 * Years range from Pre-1960 (1) to 2027 (51), with decades and individual years.
 */
export enum GraduationYear {
  PRE_1960 = 1,
  DECADE_1960_1969 = 2,
  DECADE_1970_1979 = 3,
  YEAR_1980 = 4,
  YEAR_1981 = 5,
  YEAR_1982 = 6,
  YEAR_1983 = 7,
  YEAR_1984 = 8,
  YEAR_1985 = 9,
  YEAR_1986 = 10,
  YEAR_1987 = 11,
  YEAR_1988 = 12,
  YEAR_1989 = 13,
  YEAR_1990 = 14,
  YEAR_1991 = 15,
  YEAR_1992 = 16,
  YEAR_1993 = 17,
  YEAR_1994 = 18,
  YEAR_1995 = 19,
  YEAR_1996 = 20,
  YEAR_1997 = 21,
  YEAR_1998 = 22,
  YEAR_1999 = 23,
  YEAR_2000 = 24,
  YEAR_2001 = 25,
  YEAR_2002 = 26,
  YEAR_2003 = 27,
  YEAR_2004 = 28,
  YEAR_2005 = 29,
  YEAR_2006 = 30,
  YEAR_2007 = 31,
  YEAR_2008 = 32,
  YEAR_2009 = 33,
  YEAR_2010 = 34,
  YEAR_2011 = 35,
  YEAR_2012 = 36,
  YEAR_2013 = 37,
  YEAR_2014 = 38,
  YEAR_2015 = 39,
  YEAR_2016 = 40,
  YEAR_2017 = 41,
  YEAR_2018 = 42,
  YEAR_2019 = 43,
  YEAR_2020 = 44,
  YEAR_2021 = 45,
  YEAR_2022 = 46,
  YEAR_2023 = 47,
  YEAR_2024 = 48,
  YEAR_2025 = 49,
  YEAR_2026 = 50,
  YEAR_2027 = 51,
}

/**
 * Helper function to get graduation year display name
 */
export function getGraduationYearDisplayName(year: GraduationYear): string {
  switch (year) {
    case GraduationYear.PRE_1960:
      return 'Pre-1960';
    case GraduationYear.DECADE_1960_1969:
      return '1960-1969';
    case GraduationYear.DECADE_1970_1979:
      return '1970-1979';
    case GraduationYear.YEAR_1980:
      return '1980';
    case GraduationYear.YEAR_1981:
      return '1981';
    case GraduationYear.YEAR_1982:
      return '1982';
    case GraduationYear.YEAR_1983:
      return '1983';
    case GraduationYear.YEAR_1984:
      return '1984';
    case GraduationYear.YEAR_1985:
      return '1985';
    case GraduationYear.YEAR_1986:
      return '1986';
    case GraduationYear.YEAR_1987:
      return '1987';
    case GraduationYear.YEAR_1988:
      return '1988';
    case GraduationYear.YEAR_1989:
      return '1989';
    case GraduationYear.YEAR_1990:
      return '1990';
    case GraduationYear.YEAR_1991:
      return '1991';
    case GraduationYear.YEAR_1992:
      return '1992';
    case GraduationYear.YEAR_1993:
      return '1993';
    case GraduationYear.YEAR_1994:
      return '1994';
    case GraduationYear.YEAR_1995:
      return '1995';
    case GraduationYear.YEAR_1996:
      return '1996';
    case GraduationYear.YEAR_1997:
      return '1997';
    case GraduationYear.YEAR_1998:
      return '1998';
    case GraduationYear.YEAR_1999:
      return '1999';
    case GraduationYear.YEAR_2000:
      return '2000';
    case GraduationYear.YEAR_2001:
      return '2001';
    case GraduationYear.YEAR_2002:
      return '2002';
    case GraduationYear.YEAR_2003:
      return '2003';
    case GraduationYear.YEAR_2004:
      return '2004';
    case GraduationYear.YEAR_2005:
      return '2005';
    case GraduationYear.YEAR_2006:
      return '2006';
    case GraduationYear.YEAR_2007:
      return '2007';
    case GraduationYear.YEAR_2008:
      return '2008';
    case GraduationYear.YEAR_2009:
      return '2009';
    case GraduationYear.YEAR_2010:
      return '2010';
    case GraduationYear.YEAR_2011:
      return '2011';
    case GraduationYear.YEAR_2012:
      return '2012';
    case GraduationYear.YEAR_2013:
      return '2013';
    case GraduationYear.YEAR_2014:
      return '2014';
    case GraduationYear.YEAR_2015:
      return '2015';
    case GraduationYear.YEAR_2016:
      return '2016';
    case GraduationYear.YEAR_2017:
      return '2017';
    case GraduationYear.YEAR_2018:
      return '2018';
    case GraduationYear.YEAR_2019:
      return '2019';
    case GraduationYear.YEAR_2020:
      return '2020';
    case GraduationYear.YEAR_2021:
      return '2021';
    case GraduationYear.YEAR_2022:
      return '2022';
    case GraduationYear.YEAR_2023:
      return '2023';
    case GraduationYear.YEAR_2024:
      return '2024';
    case GraduationYear.YEAR_2025:
      return '2025';
    case GraduationYear.YEAR_2026:
      return '2026';
    case GraduationYear.YEAR_2027:
      return '2027';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to check if graduation year is recent (within last 5 years)
 */
export function isRecentGraduation(year: GraduationYear): boolean {
  const currentYear = new Date().getFullYear();
  const displayName = getGraduationYearDisplayName(year);

  // Skip non-numeric years (decades, pre-1960)
  if (displayName.includes('-') || displayName === 'Pre-1960') return false;

  const yearNumber = parseInt(displayName, 10);
  return yearNumber >= currentYear - 5 && yearNumber <= currentYear;
}

/**
 * Helper function to check if graduation year is in the future
 */
export function isFutureGraduation(year: GraduationYear): boolean {
  const currentYear = new Date().getFullYear();
  const displayName = getGraduationYearDisplayName(year);

  // Skip non-numeric years (decades, pre-1960)
  if (displayName.includes('-') || displayName === 'Pre-1960') return false;

  const yearNumber = parseInt(displayName);
  return yearNumber > currentYear;
}

/**
 * Helper function to get the current maximum year allowed (current year + 3)
 */
export function getCurrentMaxAllowedYear(): number {
  const currentYear = new Date().getFullYear();
  return currentYear + 3; // Allow up to 3 years in the future
}

/**
 * Type definition for graduation year option
 */
export interface GraduationYearOption {
  value: number;
  label: string;
}

/**
 * Helper function to get all valid graduation years based on current date
 * This function dynamically filters years to only include valid ones
 */
export function getValidGraduationYears(): GraduationYearOption[] {
  const maxAllowedYear = getCurrentMaxAllowedYear();
  const validYears: GraduationYearOption[] = [];

  // Always include historical ranges
  validYears.push({
    value: GraduationYear.PRE_1960,
    label: 'Pre-1960',
  });
  validYears.push({
    value: GraduationYear.DECADE_1960_1969,
    label: '1960-1969',
  });
  validYears.push({
    value: GraduationYear.DECADE_1970_1979,
    label: '1970-1979',
  });

  // Add individual years from enum that are still valid
  const allEnumYears = getAllGraduationYears();

  for (const year of allEnumYears) {
    const displayName = getGraduationYearDisplayName(year);

    // Skip if it's a decade range or pre-1960 (already added)
    if (displayName.includes('-') || displayName === 'Pre-1960') continue;

    const yearNumber = parseInt(displayName, 10);
    if (yearNumber >= 1980 && yearNumber <= maxAllowedYear) {
      validYears.push({ value: year, label: displayName });
    }
  }

  // Add dynamic years beyond the enum if needed
  const lastEnumYear = 2027; // Current enum goes up to 2027
  if (maxAllowedYear > lastEnumYear) {
    let nextEnumValue = 52; // Next value after YEAR_2027 = 51

    for (let year = lastEnumYear + 1; year <= maxAllowedYear; year++) {
      validYears.push({ value: nextEnumValue++, label: year.toString() });
    }
  }

  return validYears;
}

/**
 * Helper function to get dynamic graduation year mapping for years beyond the enum
 * This creates virtual enum values for future years
 */
export function getDynamicGraduationYearValue(year: number): number | null {
  const currentMaxYear = getCurrentMaxAllowedYear();

  if (year <= 2027) {
    // Year is within the static enum range, find its value
    const allYears = getAllGraduationYears();
    for (const enumYear of allYears) {
      const displayName = getGraduationYearDisplayName(enumYear);
      if (displayName === year.toString()) {
        return enumYear;
      }
    }
    return null;
  } else if (year <= currentMaxYear) {
    // Year is beyond enum but within allowed range, calculate dynamic value
    const yearsAfter2027 = year - 2027;
    return 51 + yearsAfter2027; // 51 is YEAR_2027, so 2028 = 52, 2029 = 53, etc.
  }

  return null; // Year is not allowed
}

/**
 * Helper function to get display name for dynamic year values
 */
export function getDynamicGraduationYearDisplayName(value: number): string {
  // First try the static enum
  const staticName = getGraduationYearDisplayName(value as GraduationYear);
  if (staticName !== 'Unknown') {
    return staticName;
  }

  // If not in static enum, calculate dynamic year
  if (value > 51) {
    // Values beyond YEAR_2027
    const year = 2027 + (value - 51);
    const maxAllowed = getCurrentMaxAllowedYear();

    if (year <= maxAllowed) {
      return year.toString();
    }
  }

  return 'Unknown';
}

/**
 * Helper function to check if a graduation year value is currently valid
 */
export function isValidGraduationYearValue(value: number): boolean {
  const validYears = getValidGraduationYears();
  return validYears.some((year) => year.value === value);
}

/**
 * Helper function to get graduation years for current decade (dynamic)
 */
export function getCurrentDecadeYears(): GraduationYearOption[] {
  const currentYear = new Date().getFullYear();
  const currentDecadeStart = Math.floor(currentYear / 10) * 10;
  const maxAllowedYear = getCurrentMaxAllowedYear();
  const validYears = getValidGraduationYears();

  return validYears.filter((year) => {
    if (year.label.includes('-') || year.label === 'Pre-1960') return false;

    const yearNumber = parseInt(year.label, 10);
    return yearNumber >= currentDecadeStart && yearNumber <= maxAllowedYear;
  });
}

/**
 * Helper function to get all graduation year values
 */
export function getAllGraduationYears(): GraduationYear[] {
  return Object.values(GraduationYear).filter(
    (value) => typeof value === 'number',
  ) as GraduationYear[];
}
