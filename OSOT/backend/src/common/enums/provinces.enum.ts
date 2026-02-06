/**
 * Enum: Province
 * Objective: Define the available Canadian provinces and territories for address management.
 * Functionality: Provides standardized provincial choices synchronized with Dataverse global choices.
 * Expected Result: Accurate provincial classification for Canadian address management.
 *
 * Note: This enum corresponds to the Choices_Provinces global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Province in Table_Address.
 */
export enum Province {
  N_A = 0,
  ONTARIO = 1,
  ALBERTA = 2,
  BRITISH_COLUMBIA = 3,
  MANITOBA = 4,
  NEW_BRUNSWICK = 5,
  NEWFOUNDLAND_AND_LABRADOR = 6,
  NOVA_SCOTIA = 7,
  NORTHWEST_TERRITORIES = 8,
  NUNAVUT = 9,
  PRINCE_EDWARD_ISLAND = 10,
  QUEBEC = 11,
  SASKATCHEWAN = 12,
  YUKON = 13,
}

/**
 * Helper function to get province display name
 */
export function getProvinceDisplayName(province: Province): string {
  switch (province) {
    case Province.N_A:
      return 'N/A';
    case Province.ONTARIO:
      return 'Ontario';
    case Province.ALBERTA:
      return 'Alberta';
    case Province.BRITISH_COLUMBIA:
      return 'British Columbia';
    case Province.MANITOBA:
      return 'Manitoba';
    case Province.NEW_BRUNSWICK:
      return 'New Brunswick';
    case Province.NEWFOUNDLAND_AND_LABRADOR:
      return 'Newfoundland and Labrador';
    case Province.NOVA_SCOTIA:
      return 'Nova Scotia';
    case Province.NORTHWEST_TERRITORIES:
      return 'Northwest Territories';
    case Province.NUNAVUT:
      return 'Nunavut';
    case Province.PRINCE_EDWARD_ISLAND:
      return 'Prince Edward Island';
    case Province.QUEBEC:
      return 'Quebec';
    case Province.SASKATCHEWAN:
      return 'Saskatchewan';
    case Province.YUKON:
      return 'Yukon';
    default:
      return 'Unknown Province';
  }
}
