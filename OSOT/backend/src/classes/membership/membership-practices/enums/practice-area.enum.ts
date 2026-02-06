/**
 * Enum: PracticeArea
 * Objective: Define the available practice areas for occupational therapy services.
 * Functionality: Provides standardized practice area choices synchronized with Dataverse global choices.
 * Expected Result: Consistent practice area classification for member practice information.
 *
 * Note: This enum corresponds to the Choices_Practice_Area global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Practice_Area in Table_Membership_Practice.
 */
export enum PracticeArea {
  OTHER = 0,
  NOT_APPLICABLE = 1,
  ACQUIRED_TRAUMATIC_BRAIN_INJURY = 2,
  AMPUTATIONS = 3,
  ANXIETY_DISORDERS = 4,
  AUTISM_SPECTRUM = 5,
  BIPOLAR_DISORDER = 6,
  BLINDNESS_LOW_VISION = 7,
  BURNS = 8,
  CEREBRAL_PALSY = 9,
  CHRONIC_PAIN = 10,
  CONCUSSION = 11,
  DEPRESSIVE_DISORDERS = 12,
  DEVELOPMENTAL_COORDINATION_DISORDER = 13,
  DEVELOPMENTAL_DISABILITY = 14,
  EATING_DISORDERS = 15,
  FETAL_ALCOHOL_SPECTRUM_DISORDER = 16,
  FORENSICS_CORRECTIONS = 17,
  FRAILTY = 18,
  GENERAL_MEDICINE = 19,
  GENETIC_DISORDERS = 20,
  HEARING_IMPAIRMENT = 21,
  HEART_ATTACK_CONDITIONS = 22,
  HIV_AIDS = 23,
  INDIGENOUS_HEALTH_SERVICES = 24,
  LEARNING_DISABILITIES = 25,
  MULTIPLE_SCLEROSIS = 26,
  MUSCULAR_DYSTROPHY = 27,
  NEONATOLOGY = 28,
  NEUROCOGNITIVE_DISORDERS_DEMENTIA = 29,
  NEUROLOGICAL_DISEASES = 30,
  ONCOLOGY = 31,
  ORTHOPEDICS = 32,
  PERSONALITY_DISORDERS = 33,
  PSYCHOTIC_DISORDERS = 34,
  PTSD_OTHER_TRAUMA_DISORDERS = 35,
  REPETITIVE_STRAIN_INJURIES = 36,
  RESPIROLOGY = 37,
  RHEUMATOLOGY = 38,
  SCHIZOPHRENIA = 39,
  SENSORY_PROCESSING = 40,
  SLEEP_WAKE_DISORDERS = 41,
  SOFT_TISSUE_INJURY = 42,
  SPINAL_CORD_INJURY = 43,
  STROKE = 44,
  SUBSTANCE_USE_ADDICTIVE_DISORDERS = 45,
  WOUND_CARE = 46,
}

/**
 * Helper function to get practice area display name
 */
export function getPracticeAreaDisplayName(practiceArea: PracticeArea): string {
  switch (practiceArea) {
    case PracticeArea.OTHER:
      return 'Other';
    case PracticeArea.NOT_APPLICABLE:
      return 'Not Applicable';
    case PracticeArea.ACQUIRED_TRAUMATIC_BRAIN_INJURY:
      return 'Acquired Traumatic Brain Injury';
    case PracticeArea.AMPUTATIONS:
      return 'Amputations';
    case PracticeArea.ANXIETY_DISORDERS:
      return 'Anxiety Disorders';
    case PracticeArea.AUTISM_SPECTRUM:
      return 'Autism Spectrum';
    case PracticeArea.BIPOLAR_DISORDER:
      return 'Bipolar Disorder';
    case PracticeArea.BLINDNESS_LOW_VISION:
      return 'Blindness / Low Vision';
    case PracticeArea.BURNS:
      return 'Burns';
    case PracticeArea.CEREBRAL_PALSY:
      return 'Cerebral Palsy';
    case PracticeArea.CHRONIC_PAIN:
      return 'Chronic Pain';
    case PracticeArea.CONCUSSION:
      return 'Concussion';
    case PracticeArea.DEPRESSIVE_DISORDERS:
      return 'Depressive Disorders';
    case PracticeArea.DEVELOPMENTAL_COORDINATION_DISORDER:
      return 'Developmental Coordination Disorder';
    case PracticeArea.DEVELOPMENTAL_DISABILITY:
      return 'Developmental Disability';
    case PracticeArea.EATING_DISORDERS:
      return 'Eating Disorders';
    case PracticeArea.FETAL_ALCOHOL_SPECTRUM_DISORDER:
      return 'Fetal Alcohol Spectrum Disorder';
    case PracticeArea.FORENSICS_CORRECTIONS:
      return 'Forensics / Corrections';
    case PracticeArea.FRAILTY:
      return 'Frailty';
    case PracticeArea.GENERAL_MEDICINE:
      return 'General Medicine';
    case PracticeArea.GENETIC_DISORDERS:
      return 'Genetic Disorders';
    case PracticeArea.HEARING_IMPAIRMENT:
      return 'Hearing Impairment';
    case PracticeArea.HEART_ATTACK_CONDITIONS:
      return 'Heart Attack / Conditions';
    case PracticeArea.HIV_AIDS:
      return 'HIV / AIDS';
    case PracticeArea.INDIGENOUS_HEALTH_SERVICES:
      return 'Indigenous Health Services';
    case PracticeArea.LEARNING_DISABILITIES:
      return 'Learning Disabilities';
    case PracticeArea.MULTIPLE_SCLEROSIS:
      return 'Multiple Sclerosis';
    case PracticeArea.MUSCULAR_DYSTROPHY:
      return 'Muscular Dystrophy';
    case PracticeArea.NEONATOLOGY:
      return 'Neonatology';
    case PracticeArea.NEUROCOGNITIVE_DISORDERS_DEMENTIA:
      return 'Neurocognitive Disorders / Dementia';
    case PracticeArea.NEUROLOGICAL_DISEASES:
      return 'Neurological Diseases';
    case PracticeArea.ONCOLOGY:
      return 'Oncology';
    case PracticeArea.ORTHOPEDICS:
      return 'Orthopedics';
    case PracticeArea.PERSONALITY_DISORDERS:
      return 'Personality Disorders';
    case PracticeArea.PSYCHOTIC_DISORDERS:
      return 'Psychotic Disorders';
    case PracticeArea.PTSD_OTHER_TRAUMA_DISORDERS:
      return 'PTSD / Other Trauma Disorders';
    case PracticeArea.REPETITIVE_STRAIN_INJURIES:
      return 'Repetitive Strain Injuries';
    case PracticeArea.RESPIROLOGY:
      return 'Respirology';
    case PracticeArea.RHEUMATOLOGY:
      return 'Rheumatology';
    case PracticeArea.SCHIZOPHRENIA:
      return 'Schizophrenia';
    case PracticeArea.SENSORY_PROCESSING:
      return 'Sensory Processing';
    case PracticeArea.SLEEP_WAKE_DISORDERS:
      return 'Sleep-Wake Disorders';
    case PracticeArea.SOFT_TISSUE_INJURY:
      return 'Soft Tissue Injury';
    case PracticeArea.SPINAL_CORD_INJURY:
      return 'Spinal Cord Injury';
    case PracticeArea.STROKE:
      return 'Stroke';
    case PracticeArea.SUBSTANCE_USE_ADDICTIVE_DISORDERS:
      return 'Substance Use / Addictive Disorders';
    case PracticeArea.WOUND_CARE:
      return 'Wound Care';
    default:
      return 'Unknown';
  }
}
