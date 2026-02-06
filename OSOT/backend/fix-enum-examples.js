const fs = require('fs');

const files = [
  'src/classes/others/audience-target/dtos/audience-target-basic.dto.ts',
  'src/classes/others/audience-target/dtos/audience-target-create.dto.ts',
  'src/classes/others/audience-target/dtos/audience-target-update.dto.ts',
];

const replacements = [
  [/City\.MISSISSAUGA/g, 'City.MISSISSSAUGA'],
  [/Gender\.WOMAN/g, 'Gender.FEMALE'],
  [/Gender\.MAN/g, 'Gender.MALE'],
  [/Race\.ASIAN/g, 'Race.CHINESE'],
  [/AffiliateEligibility\.ELIGIBLE/g, 'AffiliateEligibility.PRIMARY'],
  [/AffiliateEligibility\.MEMBER/g, 'AffiliateEligibility.PREMIUM'],
  [/Category\.FULL_MEMBER/g, 'Category.OT_PR'],
  [/Category\.STUDENT/g, 'Category.OT_STU'],
  [/Category\.GRADUATED/g, 'Category.OT_PR'],
  [/Category\.NEW_GRADUATED/g, 'Category.OT_NG'],
  [/HourlyEarnings\.BETWEEN_30_40/g, 'HourlyEarnings.BETWEEN_31_TO_40'],
  [/HourlyEarnings\.BETWEEN_40_50/g, 'HourlyEarnings.BETWEEN_41_TO_50'],
  [/HourlyEarnings\.BETWEEN_50_60/g, 'HourlyEarnings.BETWEEN_51_TO_60'],
  [/HourlyEarnings\.OVER_60/g, 'HourlyEarnings.BETWEEN_61_TO_70'],
  [/Benefits\.HEALTH/g, 'Benefits.EXTENDED_HEALTH_DENTAL_CARE'],
  [/Benefits\.DENTAL/g, 'Benefits.DISABILITY_INSURANCE'],
  [/EmploymentStatus\.FULL_TIME/g, 'EmploymentStatus.EMPLOYEE_SALARIED'],
  [/EmploymentStatus\.PART_TIME/g, 'EmploymentStatus.EMPLOYEE_CONTRACT'],
  [/Funding\.PUBLIC/g, 'Funding.PROVINCIAL_GOVERMENT_HEALTH'],
  [/Funding\.PRIVATE(?!_PAY_OUT_OF_POCKET)/g, 'Funding.PRIVATE_PAY_OUT_OF_POCKET'],
  [/Funding\.PRIVATE_PAY_OUT_OF_POCKET_PAY_OUT_OF_POCKET/g, 'Funding.PRIVATE_PAY_OUT_OF_POCKET'],
  [/PracticeYears\.YEARS_0_5/g, 'PracticeYears.NEW_GRADUATE'],
  [/PracticeYears\.YEARS_5_10/g, 'PracticeYears.BETWEEN_1_AND_2_YEARS'],
  [/RoleDescription\.CLINICAL/g, 'RoleDescription.DIRECT_INDIRECT_CARE_PROVIDER'],
  [/RoleDescription\.MANAGER/g, 'RoleDescription.ADMINISTRATION_MANAGEMENT'],
  [/PracticeSettings\.HOSPITAL/g, 'PracticeSettings.GENERAL_HOSPITAL'],
  [/PracticeSettings\.CLINIC/g, 'PracticeSettings.COMMUNITY_CLINIC_AGENCY'],
  [/SearchTools\.GOOGLE/g, 'SearchTools.PROFESSIONAL_NETWORKS'],
  [/SearchTools\.OSOT_DIRECTORY/g, 'SearchTools.POTENTIAL_MENTORING'],
  [/PracticePromotion\.SOCIAL_MEDIA/g, 'PracticePromotion.SELF'],
  [/PracticePromotion\.WEBSITE/g, 'PracticePromotion.EMPLOYER'],
  [/PsychotherapySupervision\.GROUP/g, 'PsychotherapySupervision.COGNITIVE_BEHAVIOURAL'],
  [/PsychotherapySupervision\.INDIVIDUAL/g, 'PsychotherapySupervision.DIALECTICAL_BEHAVIOURAL'],
  [/CotoStatus\.PROVISIONAL(?!_TEMPORARY)/g, 'CotoStatus.PROVISIONAL_TEMPORARY'],
  [/OtUniversity\.MCGILL/g, 'OtUniversity.MCMASTER_UNIVERSITY'],
  [/OtaCollege\.HUMBER(?!_COLLEGE)/g, 'OtaCollege.HUMBER_COLLEGE'],
  [/OtaCollege\.MOHAWK(?!_COLLEGE)/g, 'OtaCollege.MOHAWK_COLLEGE'],
];

let totalChanges = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let fileChanges = 0;
  
  replacements.forEach(([pattern, replacement]) => {
    const matches = (content.match(pattern) || []).length;
    if (matches > 0) {
      content = content.replace(pattern, replacement);
      fileChanges += matches;
    }
  });
  
  if (fileChanges > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`${file}: ${fileChanges} replacements`);
    totalChanges += fileChanges;
  }
});

console.log(`\nTotal: ${totalChanges} replacements across all files`);
