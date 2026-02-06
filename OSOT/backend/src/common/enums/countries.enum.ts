/**
 * Enum: Country
 * Objective: Define the available country options for address and demographic management.
 * Functionality: Provides comprehensive international country choices synchronized with Dataverse global choices.
 * Expected Result: Accurate geographical classification for global address management.
 *
 * Note: This enum corresponds to the Choices_Countries global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Country in Table_Address.
 * This enum contains 170+ countries and territories from official ISO sources.
 */
export enum Country {
  OTHER = 0,
  CANADA = 1,
  USA = 2,
  AFGHANISTAN = 3,
  ALBANIA = 4,
  ALGERIA = 5,
  ANDORRA = 6,
  ANGOLA = 7,
  ANTIGUA = 8,
  ARGENTINA = 9,
  ARUBA = 10,
  AUSTRALIA = 11,
  AUSTRIA = 12,
  BAHAMAS = 13,
  BAHRAIN = 14,
  BANGLADESH = 15,
  BARBADOS = 16,
  BASUTOLAND = 17,
  BELGIUM = 18,
  BELIZE = 19,
  BENIN = 20,
  BERMUDA = 21,
  BHUTAN = 22,
  BOLIVIA = 23,
  BOPHUTHATSWANA = 24,
  BORNEO = 25,
  BOTSWANA = 26,
  BRAZIL = 27,
  BRUNEI = 28,
  BULGARIA = 29,
  BURMA = 30,
  BURUNDI = 31,
  CAMBODIA = 32,
  CAMEROON = 33,
  CANAL_ZONE = 34,
  CANARY_ISLANDS = 35,
  CAYMEN_ISLANDS = 36,
  CHANNEL_ISLAND = 37,
  CHILE = 38,
  COLOMBIA = 39,
  COOK_ISLAND = 40,
  COSTA_RICA = 41,
  CUBA = 42,
  CURACAO = 43,
  CWTH_IND_ST = 44,
  CYPRUS = 45,
  CZECH_SLOVAK = 46,
  DAHOMEY = 47,
  DENMARK = 48,
  DOMINICAN_REPUBLIC = 49,
  ECUADOR = 50,
  EGYPT = 51,
  EL_SALVADOR = 52,
  ENGLAND = 53,
  ETHIOPIA = 54,
  FALKLAND_ISLANDS = 55,
  FINLAND = 56,
  FRANCE = 57,
  FRENCH_GUIANA = 58,
  FRENCH_POLYNESIA = 59,
  GABON = 60,
  GAMBIA = 61,
  GERMANY = 62,
  GHANA = 63,
  GIBRALTER = 64,
  GRANADA = 65,
  GREECE = 66,
  GREENLAND = 67,
  GUADELOUPE = 68,
  GUATEMALA = 69,
  GUINEA = 70,
  GUYANA = 71,
  HAITI = 72,
  HONDURAS = 73,
  HONG_KONG = 74,
  HUNGARY = 75,
  ICELAND = 76,
  INDIA = 77,
  INDONESIA = 78,
  IRAN = 79,
  IRAQ = 80,
  IRELAND = 81,
  ISRAEL = 82,
  ITALY = 83,
  IVORY_COAST = 84,
  JAMAICA = 85,
  JAPAN = 86,
  JORDAN = 87,
  KENYA = 88,
  KOREA = 89,
  KUWAIT = 90,
  LAOS = 91,
  LEBANON = 92,
  LESOTHO = 93,
  LIBERIA = 94,
  LIBYA = 95,
  LIECHTENSTEIN = 96,
  LUXEMBOURG = 97,
  MADAGASCAR = 98,
  MALAWI = 99,
  MALAYSIA = 100,
  MALI = 101,
  MALTA = 102,
  MARTINIQUE = 103,
  MAURITIUS = 104,
  MEXICO = 105,
  MONACE = 106,
  MONGOLIA = 107,
  MOROCCO = 108,
  MOZAMBIQUE = 109,
  NEPAL = 110,
  NETHERLANDS = 111,
  NEW_CALEDONIA = 112,
  NEW_GUINEA = 113,
  NEW_ZEALAND = 114,
  NICARAGUA = 115,
  NIGER = 116,
  NIGERIA = 117,
  NORTH_IRELAND = 118,
  OMAN = 119,
  PAKISTAN = 120,
  PANAMA = 121,
  PARAGUAY = 122,
  PEOPLES_REPUBLIC_OF_CHINA = 123,
  PEOPLES_REPUBLIC_OF_CONGO = 124,
  PERU = 125,
  PHILIPPINES = 126,
  POLAND = 127,
  PORTUGAL = 128,
  QATAR = 129,
  REPUBLIC_OF_SOUTH_AFRICA = 130,
  REPUBLIC_OF_ZAIRE = 131,
  ROMANIA = 132,
  RWANDA = 133,
  SAINT_VINCENT = 134,
  SANTA_LUCIA = 135,
  SAUDI_ARABIA = 136,
  SCOTLAND = 137,
  SENEGAL = 138,
  SEYCHELLES = 139,
  SIERRA_LEONE = 140,
  SINGAPORE = 141,
  SLOVINIA = 142,
  SOMALI_REPUBLIC = 143,
  SOUTHWEST_AFRICA = 144,
  SPAIN = 145,
  SRI_LANKA = 146,
  SUDAN = 147,
  SURINAM = 148,
  SWAZILAND = 149,
  SWEDEN = 150,
  SWITZERLAND = 151,
  SYRIA = 152,
  TAIWAN = 153,
  TANZANIA = 154,
  TASMANIA = 155,
  THAILAND = 156,
  TOGO = 157,
  TONGA = 158,
  TRINIDAD = 159,
  TUNISIA = 160,
  TURKEY = 161,
  UAE = 162,
  UGANDA = 163,
  UPPER_VOLTA = 164,
  URUGUAY = 165,
  VATICAN_CITY = 166,
  VENEZUELA = 167,
  VIETNAM = 168,
  VIRGIN_ISLANDS = 169,
  WALES = 170,
  WESTERN_SAMOA = 171,
  YEMEN = 172,
  ZAMBIA = 173,
  ZIMBABWE = 174,
}

/**
 * Helper function to get country display name
 */
export function getCountryDisplayName(country: Country): string {
  switch (country) {
    case Country.OTHER:
      return 'Other';
    case Country.CANADA:
      return 'Canada';
    case Country.USA:
      return 'USA';
    case Country.AFGHANISTAN:
      return 'Afghanistan';
    case Country.ALBANIA:
      return 'Albania';
    case Country.ALGERIA:
      return 'Algeria';
    case Country.ANDORRA:
      return 'Andorra';
    case Country.ANGOLA:
      return 'Angola';
    case Country.ANTIGUA:
      return 'Antigua';
    case Country.ARGENTINA:
      return 'Argentina';
    case Country.ARUBA:
      return 'Aruba';
    case Country.AUSTRALIA:
      return 'Australia';
    case Country.AUSTRIA:
      return 'Austria';
    case Country.BAHAMAS:
      return 'Bahamas';
    case Country.BAHRAIN:
      return 'Bahrain';
    case Country.BANGLADESH:
      return 'Bangladesh';
    case Country.BARBADOS:
      return 'Barbados';
    case Country.BASUTOLAND:
      return 'Basutoland';
    case Country.BELGIUM:
      return 'Belgium';
    case Country.BELIZE:
      return 'Belize';
    case Country.BENIN:
      return 'Benin';
    case Country.BERMUDA:
      return 'Bermuda';
    case Country.BHUTAN:
      return 'Bhutan';
    case Country.BOLIVIA:
      return 'Bolivia';
    case Country.BOPHUTHATSWANA:
      return 'Bophuthatswana';
    case Country.BORNEO:
      return 'Borneo';
    case Country.BOTSWANA:
      return 'Botswana';
    case Country.BRAZIL:
      return 'Brazil';
    case Country.BRUNEI:
      return 'Brunei';
    case Country.BULGARIA:
      return 'Bulgaria';
    case Country.BURMA:
      return 'Burma';
    case Country.BURUNDI:
      return 'Burundi';
    case Country.CAMBODIA:
      return 'Cambodia';
    case Country.CAMEROON:
      return 'Cameroon';
    case Country.CANAL_ZONE:
      return 'Canal Zone';
    case Country.CANARY_ISLANDS:
      return 'Canary Islands';
    case Country.CAYMEN_ISLANDS:
      return 'Caymen Islands';
    case Country.CHANNEL_ISLAND:
      return 'Channel Island';
    case Country.CHILE:
      return 'Chile';
    case Country.COLOMBIA:
      return 'Colombia';
    case Country.COOK_ISLAND:
      return 'Cook Island';
    case Country.COSTA_RICA:
      return 'Costa Rica';
    case Country.CUBA:
      return 'Cuba';
    case Country.CURACAO:
      return 'Curacao';
    case Country.CWTH_IND_ST:
      return 'Cwth Ind St';
    case Country.CYPRUS:
      return 'Cyprus';
    case Country.CZECH_SLOVAK:
      return 'Czech Slovak';
    case Country.DAHOMEY:
      return 'Dahomey';
    case Country.DENMARK:
      return 'Denmark';
    case Country.DOMINICAN_REPUBLIC:
      return 'Dominican Republic';
    case Country.ECUADOR:
      return 'Ecuador';
    case Country.EGYPT:
      return 'Egypt';
    case Country.EL_SALVADOR:
      return 'El Salvador';
    case Country.ENGLAND:
      return 'England';
    case Country.ETHIOPIA:
      return 'Ethiopia';
    case Country.FALKLAND_ISLANDS:
      return 'Falkland Islands';
    case Country.FINLAND:
      return 'Finland';
    case Country.FRANCE:
      return 'France';
    case Country.FRENCH_GUIANA:
      return 'French Guiana';
    case Country.FRENCH_POLYNESIA:
      return 'French Polynesia';
    case Country.GABON:
      return 'Gabon';
    case Country.GAMBIA:
      return 'Gambia';
    case Country.GERMANY:
      return 'Germany';
    case Country.GHANA:
      return 'Ghana';
    case Country.GIBRALTER:
      return 'Gibralter';
    case Country.GRANADA:
      return 'Granada';
    case Country.GREECE:
      return 'Greece';
    case Country.GREENLAND:
      return 'Greenland';
    case Country.GUADELOUPE:
      return 'Guadeloupe';
    case Country.GUATEMALA:
      return 'Guatemala';
    case Country.GUINEA:
      return 'Guinea';
    case Country.GUYANA:
      return 'Guyana';
    case Country.HAITI:
      return 'Haiti';
    case Country.HONDURAS:
      return 'Honduras';
    case Country.HONG_KONG:
      return 'Hong Kong';
    case Country.HUNGARY:
      return 'Hungary';
    case Country.ICELAND:
      return 'Iceland';
    case Country.INDIA:
      return 'India';
    case Country.INDONESIA:
      return 'Indonesia';
    case Country.IRAN:
      return 'Iran';
    case Country.IRAQ:
      return 'Iraq';
    case Country.IRELAND:
      return 'Ireland';
    case Country.ISRAEL:
      return 'Israel';
    case Country.ITALY:
      return 'Italy';
    case Country.IVORY_COAST:
      return 'Ivory Coast';
    case Country.JAMAICA:
      return 'Jamaica';
    case Country.JAPAN:
      return 'Japan';
    case Country.JORDAN:
      return 'Jordan';
    case Country.KENYA:
      return 'Kenya';
    case Country.KOREA:
      return 'Korea';
    case Country.KUWAIT:
      return 'Kuwait';
    case Country.LAOS:
      return 'Laos';
    case Country.LEBANON:
      return 'Lebanon';
    case Country.LESOTHO:
      return 'Lesotho';
    case Country.LIBERIA:
      return 'Liberia';
    case Country.LIBYA:
      return 'Libya';
    case Country.LIECHTENSTEIN:
      return 'Liechtenstein';
    case Country.LUXEMBOURG:
      return 'Luxembourg';
    case Country.MADAGASCAR:
      return 'Madagascar';
    case Country.MALAWI:
      return 'Malawi';
    case Country.MALAYSIA:
      return 'Malaysia';
    case Country.MALI:
      return 'Mali';
    case Country.MALTA:
      return 'Malta';
    case Country.MARTINIQUE:
      return 'Martinique';
    case Country.MAURITIUS:
      return 'Mauritius';
    case Country.MEXICO:
      return 'Mexico';
    case Country.MONACE:
      return 'Monace';
    case Country.MONGOLIA:
      return 'Mongolia';
    case Country.MOROCCO:
      return 'Morocco';
    case Country.MOZAMBIQUE:
      return 'Mozambique';
    case Country.NEPAL:
      return 'Nepal';
    case Country.NETHERLANDS:
      return 'Netherlands';
    case Country.NEW_CALEDONIA:
      return 'New Caledonia';
    case Country.NEW_GUINEA:
      return 'New Guinea';
    case Country.NEW_ZEALAND:
      return 'New Zealand';
    case Country.NICARAGUA:
      return 'Nicaragua';
    case Country.NIGER:
      return 'Niger';
    case Country.NIGERIA:
      return 'Nigeria';
    case Country.NORTH_IRELAND:
      return 'North Ireland';
    case Country.OMAN:
      return 'Oman';
    case Country.PAKISTAN:
      return 'Pakistan';
    case Country.PANAMA:
      return 'Panama';
    case Country.PARAGUAY:
      return 'Paraguay';
    case Country.PEOPLES_REPUBLIC_OF_CHINA:
      return 'Peoples Republic Of China';
    case Country.PEOPLES_REPUBLIC_OF_CONGO:
      return 'Peoples Republic Of Congo';
    case Country.PERU:
      return 'Peru';
    case Country.PHILIPPINES:
      return 'Philippines';
    case Country.POLAND:
      return 'Poland';
    case Country.PORTUGAL:
      return 'Portugal';
    case Country.QATAR:
      return 'Qatar';
    case Country.REPUBLIC_OF_SOUTH_AFRICA:
      return 'Republic Of South Africa';
    case Country.REPUBLIC_OF_ZAIRE:
      return 'Republic Of Zaire';
    case Country.ROMANIA:
      return 'Romania';
    case Country.RWANDA:
      return 'Rwanda';
    case Country.SAINT_VINCENT:
      return 'Saint Vincent';
    case Country.SANTA_LUCIA:
      return 'Santa Lucia';
    case Country.SAUDI_ARABIA:
      return 'Saudi Arabia';
    case Country.SCOTLAND:
      return 'Scotland';
    case Country.SENEGAL:
      return 'Senegal';
    case Country.SEYCHELLES:
      return 'Seychelles';
    case Country.SIERRA_LEONE:
      return 'Sierra Leone';
    case Country.SINGAPORE:
      return 'Singapore';
    case Country.SLOVINIA:
      return 'Slovinia';
    case Country.SOMALI_REPUBLIC:
      return 'Somali Republic';
    case Country.SOUTHWEST_AFRICA:
      return 'Southwest Africa';
    case Country.SPAIN:
      return 'Spain';
    case Country.SRI_LANKA:
      return 'Sri Lanka';
    case Country.SUDAN:
      return 'Sudan';
    case Country.SURINAM:
      return 'Surinam';
    case Country.SWAZILAND:
      return 'Swaziland';
    case Country.SWEDEN:
      return 'Sweden';
    case Country.SWITZERLAND:
      return 'Switzerland';
    case Country.SYRIA:
      return 'Syria';
    case Country.TAIWAN:
      return 'Taiwan';
    case Country.TANZANIA:
      return 'Tanzania';
    case Country.TASMANIA:
      return 'Tasmania';
    case Country.THAILAND:
      return 'Thailand';
    case Country.TOGO:
      return 'Togo';
    case Country.TONGA:
      return 'Tonga';
    case Country.TRINIDAD:
      return 'Trinidad';
    case Country.TUNISIA:
      return 'Tunisia';
    case Country.TURKEY:
      return 'Turkey';
    case Country.UAE:
      return 'UAE';
    case Country.UGANDA:
      return 'Uganda';
    case Country.UPPER_VOLTA:
      return 'Upper Volta';
    case Country.URUGUAY:
      return 'Uruguay';
    case Country.VATICAN_CITY:
      return 'Vatican City';
    case Country.VENEZUELA:
      return 'Venezuela';
    case Country.VIETNAM:
      return 'Vietnam';
    case Country.VIRGIN_ISLANDS:
      return 'Virgin Islands';
    case Country.WALES:
      return 'Wales';
    case Country.WESTERN_SAMOA:
      return 'Western Samoa';
    case Country.YEMEN:
      return 'Yemen';
    case Country.ZAMBIA:
      return 'Zambia';
    case Country.ZIMBABWE:
      return 'Zimbabwe';
    default:
      return 'Unknown';
  }
}
