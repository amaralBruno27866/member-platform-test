/**
 * Enum: PracticeServices
 * Objective: Define the available occupational therapy practice services offered to clients.
 * Functionality: Provides standardized practice service choices synchronized with Dataverse global choices.
 * Expected Result: Consistent practice service classification for member practice information.
 *
 * Note: This enum corresponds to the Choices_Practice_Services global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Practice_Services in Table_Membership_Practice.
 * Associated text field: osot_Practice_Services_Other for OTHER value description.
 */
export enum PracticeServices {
  OTHER = 0,
  NOT_APPLICABLE = 1,
  ACCEPTANCE_AND_COMMITMENT_THERAPY = 2,
  ACTIVITIES_OF_DAILY_LIVING = 3,
  ACUPUNCTURE = 4,
  ASSESSMENT_FOR_BENEFITS = 5,
  ASSISTIVE_DEVICES_TECHNOLOGY = 6,
  CAREGIVER_SUPPORT_EDUCATION = 7,
  CASE_MANAGEMENT = 8,
  CHRONIC_DISEASE_MANAGEMENT = 9,
  COGNITIVE_ASSESSMENT_AND_TREATMENT = 10,
  COGNITIVE_BEHAVIOUR_THERAPY = 11,
  CO_OP = 12,
  CRISIS_EMERGENCY_SERVICE = 13,
  DIALECTIC_BEHAVIOUR_THERAPY = 14,
  DISABILITY_MANAGEMENT = 15,
  DRIVER_EVALUATION_TRAINING = 16,
  ENVIRONMENTAL_ACCESS_ADAPTATION = 17,
  EQUIPMENT_MATERIAL_SALES = 18,
  ERGONOMICS = 19,
  FALLS_PREVENTION = 20,
  FEEDING_SWALLOWING = 21,
  FERTILITY_CARE = 22,
  FINE_MOTOR_INTERVENTION = 23,
  FUNCTIONAL_ASSESSMENT_AND_TREATMENT = 24,
  GROUP_INTERVENTIONS = 25,
  HAND_REHABILITATION = 26,
  HEALTH_EDUCATION_DISEASE_PREVENTION = 27,
  HEALTH_PROMOTION_WELLNESS = 28,
  HOME_SAFETY = 29,
  INDEPENDENT_LIVING_ASSESSMENT = 30,
  LIFE_CARE_PLANNING_FUTURE_COST_OF_CARE = 31,
  LOBBYING_LEGISLATIVE_ADVOCACY = 32,
  MANAGEMENT_OF_RESPONSIVE_BEHAVIOURS = 33,
  MEDICAL_LEGAL = 34,
  MENTAL_HEALTH_SERVICES = 35,
  MINDFULNESS = 36,
  MOTIVATIONAL_INTERVIEWING = 37,
  NEURO_DEVELOPMENTAL_TREATMENT = 38,
  ORTHOTICS = 39,
  PAIN_MANAGEMENT = 40,
  PALLIATIVE_CARE = 41,
  PELVIC_HEALTH = 42,
  PRESSURE_INJURY_MANAGEMENT = 43,
  PROGRAM_COORDINATION_ADMINISTRATION = 44,
  PROGRAM_EVALUATION_RESEARCH = 45,
  PROSTHETICS = 46,
  PSYCHOTHERAPY = 47,
  QUALITY_IMPROVEMENT = 48,
  RETURN_TO_WORK = 49,
  SCHOOL_BASED_OT = 50,
  SEATING_MOBILITY = 51,
  SENSORY_INTEGRATION = 52,
  SPLINTING = 53,
  STRESS_MANAGEMENT = 54,
  SUPPORTIVE_COUNSELLING = 55,
  VOCATIONAL_REHABILITATION = 56,
  WOMENS_HEALTH = 57,
  WORKPLACE_HEALTH_AND_SAFETY = 58,
  WORKPLACE_MENTAL_HEALTH_EDUCATION = 59,
}

/**
 * Helper function to get practice services display name
 */
export function getPracticeServicesDisplayName(
  practiceService: PracticeServices,
): string {
  switch (practiceService) {
    case PracticeServices.OTHER:
      return 'Other';
    case PracticeServices.NOT_APPLICABLE:
      return 'Not Applicable';
    case PracticeServices.ACCEPTANCE_AND_COMMITMENT_THERAPY:
      return 'Acceptance and Commitment Therapy (ACT)';
    case PracticeServices.ACTIVITIES_OF_DAILY_LIVING:
      return 'Activities of Daily Living';
    case PracticeServices.ACUPUNCTURE:
      return 'Acupuncture';
    case PracticeServices.ASSESSMENT_FOR_BENEFITS:
      return 'Assessment for Benefits';
    case PracticeServices.ASSISTIVE_DEVICES_TECHNOLOGY:
      return 'Assistive Devices/Technology';
    case PracticeServices.CAREGIVER_SUPPORT_EDUCATION:
      return 'Caregiver Support/Education';
    case PracticeServices.CASE_MANAGEMENT:
      return 'Case Management';
    case PracticeServices.CHRONIC_DISEASE_MANAGEMENT:
      return 'Chronic Disease Management';
    case PracticeServices.COGNITIVE_ASSESSMENT_AND_TREATMENT:
      return 'Cognitive Assessment and Treatment';
    case PracticeServices.COGNITIVE_BEHAVIOUR_THERAPY:
      return 'Cognitive Behaviour Therapy';
    case PracticeServices.CO_OP:
      return 'CO-OP';
    case PracticeServices.CRISIS_EMERGENCY_SERVICE:
      return 'Crisis/Emergency Service';
    case PracticeServices.DIALECTIC_BEHAVIOUR_THERAPY:
      return 'Dialectic Behaviour Therapy';
    case PracticeServices.DISABILITY_MANAGEMENT:
      return 'Disability Management';
    case PracticeServices.DRIVER_EVALUATION_TRAINING:
      return 'Driver Evaluation/Training';
    case PracticeServices.ENVIRONMENTAL_ACCESS_ADAPTATION:
      return 'Environmental Access/Adaptation';
    case PracticeServices.EQUIPMENT_MATERIAL_SALES:
      return 'Equipment/Material Sales';
    case PracticeServices.ERGONOMICS:
      return 'Ergonomics';
    case PracticeServices.FALLS_PREVENTION:
      return 'Falls Prevention';
    case PracticeServices.FEEDING_SWALLOWING:
      return 'Feeding/Swallowing';
    case PracticeServices.FERTILITY_CARE:
      return 'Fertility Care';
    case PracticeServices.FINE_MOTOR_INTERVENTION:
      return 'Fine Motor Intervention';
    case PracticeServices.FUNCTIONAL_ASSESSMENT_AND_TREATMENT:
      return 'Functional Assessment and Treatment';
    case PracticeServices.GROUP_INTERVENTIONS:
      return 'Group Interventions';
    case PracticeServices.HAND_REHABILITATION:
      return 'Hand Rehabilitation';
    case PracticeServices.HEALTH_EDUCATION_DISEASE_PREVENTION:
      return 'Health Education/Disease Prevention';
    case PracticeServices.HEALTH_PROMOTION_WELLNESS:
      return 'Health Promotion/Wellness';
    case PracticeServices.HOME_SAFETY:
      return 'Home Safety';
    case PracticeServices.INDEPENDENT_LIVING_ASSESSMENT:
      return 'Independent Living Assessment';
    case PracticeServices.LIFE_CARE_PLANNING_FUTURE_COST_OF_CARE:
      return 'Life Care Planning/Future Cost of Care';
    case PracticeServices.LOBBYING_LEGISLATIVE_ADVOCACY:
      return 'Lobbying/Legislative Advocacy';
    case PracticeServices.MANAGEMENT_OF_RESPONSIVE_BEHAVIOURS:
      return 'Management of Responsive Behaviours';
    case PracticeServices.MEDICAL_LEGAL:
      return 'Medical Legal';
    case PracticeServices.MENTAL_HEALTH_SERVICES:
      return 'Mental Health Services';
    case PracticeServices.MINDFULNESS:
      return 'Mindfulness';
    case PracticeServices.MOTIVATIONAL_INTERVIEWING:
      return 'Motivational Interviewing';
    case PracticeServices.NEURO_DEVELOPMENTAL_TREATMENT:
      return 'Neuro Developmental Treatment';
    case PracticeServices.ORTHOTICS:
      return 'Orthotics';
    case PracticeServices.PAIN_MANAGEMENT:
      return 'Pain Management';
    case PracticeServices.PALLIATIVE_CARE:
      return 'Palliative Care';
    case PracticeServices.PELVIC_HEALTH:
      return 'Pelvic Health';
    case PracticeServices.PRESSURE_INJURY_MANAGEMENT:
      return 'Pressure Injury Management';
    case PracticeServices.PROGRAM_COORDINATION_ADMINISTRATION:
      return 'Program Coordination/Administration';
    case PracticeServices.PROGRAM_EVALUATION_RESEARCH:
      return 'Program Evaluation/Research';
    case PracticeServices.PROSTHETICS:
      return 'Prosthetics';
    case PracticeServices.PSYCHOTHERAPY:
      return 'Psychotherapy';
    case PracticeServices.QUALITY_IMPROVEMENT:
      return 'Quality Improvement';
    case PracticeServices.RETURN_TO_WORK:
      return 'Return to Work';
    case PracticeServices.SCHOOL_BASED_OT:
      return 'School-Based OT';
    case PracticeServices.SEATING_MOBILITY:
      return 'Seating/Mobility';
    case PracticeServices.SENSORY_INTEGRATION:
      return 'Sensory Integration';
    case PracticeServices.SPLINTING:
      return 'Splinting';
    case PracticeServices.STRESS_MANAGEMENT:
      return 'Stress Management';
    case PracticeServices.SUPPORTIVE_COUNSELLING:
      return 'Supportive Counselling';
    case PracticeServices.VOCATIONAL_REHABILITATION:
      return 'Vocational Rehabilitation';
    case PracticeServices.WOMENS_HEALTH:
      return "Women's Health";
    case PracticeServices.WORKPLACE_HEALTH_AND_SAFETY:
      return 'Workplace Health and Safety';
    case PracticeServices.WORKPLACE_MENTAL_HEALTH_EDUCATION:
      return 'Workplace Mental Health Education';
    default:
      return 'Unknown';
  }
}
