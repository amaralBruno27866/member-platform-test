$files = @(
    'src/classes/others/audience-target/dtos/audience-target-basic.dto.ts',
    'src/classes/others/audience-target/dtos/audience-target-create.dto.ts',
    'src/classes/others/audience-target/dtos/audience-target-update.dto.ts'
)

$replacements = @{
    'AccountGroup.OT' = 'AccountGroup.OCCUPATIONAL_THERAPIST'
    'AccountGroup.OTA' = 'AccountGroup.OCCUPATIONAL_THERAPIST_ASSISTANT'
    'AffiliateArea.EQUIPMENT' = 'AffiliateArea.HEALTHCARE_AND_LIFE_SCIENCES'
    'AffiliateArea.SOFTWARE' = 'AffiliateArea.INFORMATION_TECHNOLOGY_AND_SOFTWARE'
    'City.MISSISSAUGA' = 'City.MISSISSSAUGA'
    'Gender.WOMAN' = 'Gender.FEMALE'
    'Gender.MAN' = 'Gender.MALE'
    'Race.ASIAN' = 'Race.CHINESE'
    'AffiliateEligibility.ELIGIBLE' = 'AffiliateEligibility.PRIMARY'
    'AffiliateEligibility.MEMBER' = 'AffiliateEligibility.PREMIUM'
    'Category.FULL_MEMBER' = 'Category.GRADUATED'
    'HourlyEarnings.BETWEEN_30_40' = 'HourlyEarnings.BETWEEN_31_TO_40'
    'HourlyEarnings.BETWEEN_40_50' = 'HourlyEarnings.BETWEEN_41_TO_50'
    'HourlyEarnings.BETWEEN_50_60' = 'HourlyEarnings.BETWEEN_51_TO_60'
    'HourlyEarnings.OVER_60' = 'HourlyEarnings.BETWEEN_61_TO_70'
    'Benefits.HEALTH' = 'Benefits.EXTENDED_HEALTH_DENTAL_CARE'
    'Benefits.DENTAL' = 'Benefits.DISABILITY_INSURANCE'
    'EmploymentStatus.FULL_TIME' = 'EmploymentStatus.EMPLOYEE_SALARIED'
    'EmploymentStatus.PART_TIME' = 'EmploymentStatus.EMPLOYEE_CONTRACT'
    'Funding.PUBLIC' = 'Funding.PROVINCIAL_GOVERMENT_HEALTH'
    'Funding.PRIVATE' = 'Funding.PRIVATE_PAY_OUT_OF_POCKET'
    'PracticeYears.YEARS_0_5' = 'PracticeYears.NEW_GRADUATE'
    'PracticeYears.YEARS_5_10' = 'PracticeYears.BETWEEN_1_AND_2_YEARS'
    'RoleDescription.CLINICAL' = 'RoleDescription.DIRECT_INDIRECT_CARE_PROVIDER'
    'RoleDescription.MANAGER' = 'RoleDescription.ADMINISTRATION_MANAGEMENT'
    'PracticeSettings.HOSPITAL' = 'PracticeSettings.GENERAL_HOSPITAL'
    'PracticeSettings.CLINIC' = 'PracticeSettings.COMMUNITY_CLINIC_AGENCY'
    'SearchTools.GOOGLE' = 'SearchTools.PROFESSIONAL_NETWORKS'
    'SearchTools.OSOT_DIRECTORY' = 'SearchTools.POTENTIAL_MENTORING'
    'PracticePromotion.SOCIAL_MEDIA' = 'PracticePromotion.SELF'
    'PracticePromotion.WEBSITE' = 'PracticePromotion.EMPLOYER'
    'PsychotherapySupervision.GROUP' = 'PsychotherapySupervision.COGNITIVE_BEHAVIOURAL'
    'PsychotherapySupervision.INDIVIDUAL' = 'PsychotherapySupervision.DIALECTICAL_BEHAVIOURAL'
    'CotoStatus.PROVISIONAL' = 'CotoStatus.PROVISIONAL_TEMPORARY'
    'OtUniversity.MCGILL' = 'OtUniversity.MCMASTER_UNIVERSITY'
    'OtaCollege.HUMBER' = 'OtaCollege.HUMBER_COLLEGE'
    'OtaCollege.MOHAWK' = 'OtaCollege.MOHAWK_COLLEGE'
}

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $changeCount = 0
    
    foreach ($old in $replacements.Keys) {
        $new = $replacements[$old]
        if ($content -match [regex]::Escape($old)) {
            $content = $content -replace [regex]::Escape($old), $new
            $changeCount++
        }
    }
    
    Set-Content $file $content -NoNewline
    Write-Host "$file - $changeCount replacements"
}
