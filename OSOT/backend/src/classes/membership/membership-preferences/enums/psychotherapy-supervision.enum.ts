/**
 * Enum: PsychotherapySupervision
 * Objective: Define the available psychotherapy supervision approaches for membership settings.
 * Functionality: Provides standardized psychotherapy supervision type choices synchronized with Dataverse global choices.
 * Expected Result: Consistent psychotherapy supervision preference management for professional development and mentoring.
 *
 * Note: This enum corresponds to the Choices_Psychotherapy global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Psychotherapy_Supervision in Table_Membership_Preferences.
 */
export enum PsychotherapySupervision {
  ACCEPTANCE_AND_COMMITMENT = 1,
  BRIEF_AND_NARRATIVE = 2,
  COGNITIVE_BEHAVIOURAL = 3,
  DIALECTICAL_BEHAVIOURAL = 4,
  DEVELOPMENTAL_SOMATIC = 5,
  EMOTION_FOCUSED = 6,
  EYE_MOVEMENT = 7,
  GESTALT = 8,
  HYPNOTHERAPY = 9,
  INTERPERSONAL = 10,
  INTEGRATIVE = 11,
  MINDFULNESS = 12,
  PROGRESSIVE_GOAL_ATTAINMENT = 13,
  RELATIONAL = 14,
  SOLUTION_FOCUSED_BEHAVIOUR = 15,
}

/**
 * Helper function to get psychotherapy supervision display name
 */
export function getPsychotherapySupervisionDisplayName(
  supervision: PsychotherapySupervision,
): string {
  switch (supervision) {
    case PsychotherapySupervision.ACCEPTANCE_AND_COMMITMENT:
      return 'Acceptance and Commitment';
    case PsychotherapySupervision.BRIEF_AND_NARRATIVE:
      return 'Brief and Narrative';
    case PsychotherapySupervision.COGNITIVE_BEHAVIOURAL:
      return 'Cognitive Behavioural';
    case PsychotherapySupervision.DIALECTICAL_BEHAVIOURAL:
      return 'Dialectical Behavioural';
    case PsychotherapySupervision.DEVELOPMENTAL_SOMATIC:
      return 'Developmental Somatic';
    case PsychotherapySupervision.EMOTION_FOCUSED:
      return 'Emotion Focused';
    case PsychotherapySupervision.EYE_MOVEMENT:
      return 'Eye Movement';
    case PsychotherapySupervision.GESTALT:
      return 'Gestalt';
    case PsychotherapySupervision.HYPNOTHERAPY:
      return 'Hypnotherapy';
    case PsychotherapySupervision.INTERPERSONAL:
      return 'Interpersonal';
    case PsychotherapySupervision.INTEGRATIVE:
      return 'Integrative';
    case PsychotherapySupervision.MINDFULNESS:
      return 'Mindfulness';
    case PsychotherapySupervision.PROGRESSIVE_GOAL_ATTAINMENT:
      return 'Progressive Goal Attainment';
    case PsychotherapySupervision.RELATIONAL:
      return 'Relational';
    case PsychotherapySupervision.SOLUTION_FOCUSED_BEHAVIOUR:
      return 'Solution-Focused Behaviour';
    default:
      return 'Unknown';
  }
}
