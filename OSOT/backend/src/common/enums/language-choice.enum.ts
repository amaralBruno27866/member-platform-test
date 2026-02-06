/**
 * Enum: Language
 * Objective: Define the available language options for Table_Identity entity.
 * Functionality: Provides standardized language choices synchronized with Dataverse global choices.
 * Expected Result: Consistent language selection across the system.
 *
 * Note: This enum corresponds to the Choices_Languages global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Language in Table_Identity.
 */
export enum Language {
  OTHER = 0,
  ENGLISH = 1,
  FRENCH = 2,
  AFRIKAANS = 3,
  ARABIC = 4,
  ARMENIAN = 5,
  AUGMENTATIVE_COMMUNICATION = 6,
  BENGALI = 7,
  BISAYAN = 8,
  CANTONESE = 9,
  CHINESE = 10,
  COORGI = 11,
  CROATIAN = 12,
  CREOLE = 13,
  CZECH = 14,
  DUTCH = 15,
  ESPERANTO = 16,
  FARSI = 17,
  FILIPINO = 18,
  FINNISH = 19,
  FULANI = 20,
  GAELIC = 21,
  GERMAN = 22,
  GHANAIAN = 23,
  GREEK = 24,
  GUJARATI = 25,
  HEBREW = 26,
  HINDI = 27,
  HUNGARIAN = 28,
  ICELANDIC = 29,
  IRANIAN = 30,
  ITALIAN = 31,
  JAPANESE = 32,
  KANNADA = 33,
  KISWAHILI = 34,
  KOREAN = 35,
  KURDISH = 36,
  LATVIAN = 37,
  LITHUANIAN = 38,
  MANDARIN = 39,
  MALAYALAM = 40,
  MANCHURIAN = 41,
  MARATHI = 42,
  MOHAWK = 43,
  NORWEGIAN = 44,
  PUNJABI = 45,
  PERSIAN = 46,
  POLISH = 47,
  PORTUGUESE = 48,
  ROMANIAN = 49,
  RUSSIAN = 50,
  SERBIAN = 51,
  SINHALESE = 52,
  SIGN_LANGUAGE = 53,
  SLOVAK = 54,
  SPANISH = 55,
  SRILANYESE = 56,
  SWAHILI = 57,
  SWEDISH = 58,
  TAGALOG = 59,
  TAIWANESE = 60,
  TAMIL = 61,
  TELUGU = 62,
  TURKISH = 63,
  UKRAINIAN = 64,
  VIETNAMESE = 65,
}

/**
 * Helper function to get language display name
 */
export function getLanguageDisplayName(language: Language): string {
  switch (language) {
    case Language.OTHER:
      return 'Other';
    case Language.ENGLISH:
      return 'English';
    case Language.FRENCH:
      return 'French';
    case Language.AFRIKAANS:
      return 'Afrikaans';
    case Language.ARABIC:
      return 'Arabic';
    case Language.ARMENIAN:
      return 'Armenian';
    case Language.AUGMENTATIVE_COMMUNICATION:
      return 'Augmentative Communication';
    case Language.BENGALI:
      return 'Bengali';
    case Language.BISAYAN:
      return 'Bisayan';
    case Language.CANTONESE:
      return 'Cantonese';
    case Language.CHINESE:
      return 'Chinese';
    case Language.COORGI:
      return 'Coorgi';
    case Language.CROATIAN:
      return 'Croatian';
    case Language.CREOLE:
      return 'Creole';
    case Language.CZECH:
      return 'Czech';
    case Language.DUTCH:
      return 'Dutch';
    case Language.ESPERANTO:
      return 'Esperanto';
    case Language.FARSI:
      return 'Farsi';
    case Language.FILIPINO:
      return 'Filipino';
    case Language.FINNISH:
      return 'Finnish';
    case Language.FULANI:
      return 'Fulani';
    case Language.GAELIC:
      return 'Gaelic';
    case Language.GERMAN:
      return 'German';
    case Language.GHANAIAN:
      return 'Ghanaian';
    case Language.GREEK:
      return 'Greek';
    case Language.GUJARATI:
      return 'Gujarati';
    case Language.HEBREW:
      return 'Hebrew';
    case Language.HINDI:
      return 'Hindi';
    case Language.HUNGARIAN:
      return 'Hungarian';
    case Language.ICELANDIC:
      return 'Icelandic';
    case Language.IRANIAN:
      return 'Iranian';
    case Language.ITALIAN:
      return 'Italian';
    case Language.JAPANESE:
      return 'Japanese';
    case Language.KANNADA:
      return 'Kannada';
    case Language.KISWAHILI:
      return 'Kiswahili';
    case Language.KOREAN:
      return 'Korean';
    case Language.KURDISH:
      return 'Kurdish';
    case Language.LATVIAN:
      return 'Latvian';
    case Language.LITHUANIAN:
      return 'Lithuanian';
    case Language.MANDARIN:
      return 'Mandarin';
    case Language.MALAYALAM:
      return 'Malayalam';
    case Language.MANCHURIAN:
      return 'Manchurian';
    case Language.MARATHI:
      return 'Marathi';
    case Language.MOHAWK:
      return 'Mohawk';
    case Language.NORWEGIAN:
      return 'Norwegian';
    case Language.PUNJABI:
      return 'Punjabi';
    case Language.PERSIAN:
      return 'Persian';
    case Language.POLISH:
      return 'Polish';
    case Language.PORTUGUESE:
      return 'Portuguese';
    case Language.ROMANIAN:
      return 'Romanian';
    case Language.RUSSIAN:
      return 'Russian';
    case Language.SERBIAN:
      return 'Serbian';
    case Language.SINHALESE:
      return 'Sinhalese';
    case Language.SIGN_LANGUAGE:
      return 'Sign Language';
    case Language.SLOVAK:
      return 'Slovak';
    case Language.SPANISH:
      return 'Spanish';
    case Language.SRILANYESE:
      return 'Srilanyese';
    case Language.SWAHILI:
      return 'Swahili';
    case Language.SWEDISH:
      return 'Swedish';
    case Language.TAGALOG:
      return 'Tagalog';
    case Language.TAIWANESE:
      return 'Taiwanese';
    case Language.TAMIL:
      return 'Tamil';
    case Language.TELUGU:
      return 'Telugu';
    case Language.TURKISH:
      return 'Turkish';
    case Language.UKRAINIAN:
      return 'Ukrainian';
    case Language.VIETNAMESE:
      return 'Vietnamese';
    default:
      return 'Unknown';
  }
}
