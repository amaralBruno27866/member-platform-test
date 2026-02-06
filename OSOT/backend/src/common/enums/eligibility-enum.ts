export enum MembershipEligilibility {
  NONE = 0,
  QUESTION_1 = 1,
  QUESTION_2 = 2,
  QUESTION_3 = 3,
  QUESTION_4 = 4,
  QUESTION_5 = 5,
  QUESTION_6 = 6,
  QUESTION_7 = 7,
}

export function getEligibilityDisplayName(
  eligibility: MembershipEligilibility,
): string {
  switch (eligibility) {
    case MembershipEligilibility.NONE:
      return 'None of the options';
    case MembershipEligilibility.QUESTION_1:
      return 'Living and working as an occupational therapist (clinical or non-clinical) in Ontario';
    case MembershipEligilibility.QUESTION_2:
      return 'Presently registering with the College in Ontario';
    case MembershipEligilibility.QUESTION_3:
      return 'Living and working as an assistant taking assignments from a registered occupational therapist in Ontario';
    case MembershipEligilibility.QUESTION_4:
      return 'Previously worked as an assistant took assignments from a registered occupational therapist';
    case MembershipEligilibility.QUESTION_5:
      return 'Retired or resigned from practice';
    case MembershipEligilibility.QUESTION_6:
      return 'On Parental leave';
    case MembershipEligilibility.QUESTION_7:
      return 'Life membership';
    default:
      return 'Unknown';
  }
}
