/**
 * Audience Target Form Component
 * Multi-select Checkboxes por Categoria
 * Permite configurar targeting de produtos usando enum arrays
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Save, AlertCircle, Users, MapPin, Briefcase, Stethoscope, Settings, GraduationCap, Globe2, CheckCircle2 } from 'lucide-react';
import { enumService, type EnumOption } from '@/services/enumService';
import { audienceTargetService, type AudienceTargetResponse, type UpdateAudienceTargetDto } from '@/services/audienceTargetService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { UseProductOrchestratorReturn } from '@/hooks/useProductOrchestrator';

interface AudienceEnums {
  // Account & Identity
  accountGroups: EnumOption[];
  genders: EnumOption[];
  indigenousDetails: EnumOption[];
  languages: EnumOption[];
  races: EnumOption[];
  
  // Location
  cities: EnumOption[];
  provinces: EnumOption[];
  
  // Membership
  affiliateAreas: EnumOption[];
  membershipCategories: EnumOption[];
  
  // Employment
  hourlyEarnings: EnumOption[];
  benefits: EnumOption[];
  employmentStatuses: EnumOption[];
  fundingSources: EnumOption[];
  practiceYears: EnumOption[];
  roleDescriptors: EnumOption[];
  workHours: EnumOption[];
  
  // Practice
  clientsAge: EnumOption[];
  practiceAreas: EnumOption[];
  practiceServices: EnumOption[];
  practiceSettings: EnumOption[];
  
  // Preferences
  searchTools: EnumOption[];
  practicePromotion: EnumOption[];
  psychotherapySupervision: EnumOption[];
  thirdParties: EnumOption[];
  
  // Education - OT
  cotoStatuses: EnumOption[];
  graduationYears: EnumOption[];
  otUniversities: EnumOption[];
  
  // Education - OTA
  otaColleges: EnumOption[];
}

interface AudienceTargetFormProps {
  productId?: string;
  targetId?: string;
  locked?: boolean;
  onSaveSuccess?: (target: AudienceTargetResponse) => void;
  orchestrator?: UseProductOrchestratorReturn; // Orchestrator for creation flow
  onTargetDataChange?: (data: UpdateAudienceTargetDto) => void; // Callback when data changes
}

export function AudienceTargetForm({ productId, targetId, locked = false, onSaveSuccess, orchestrator, onTargetDataChange }: AudienceTargetFormProps) {
  const [enums, setEnums] = useState<AudienceEnums | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadedTargetId, setLoadedTargetId] = useState<string | undefined>(targetId);
  
  // State for each field - arrays of selected enum values
  const [formData, setFormData] = useState<UpdateAudienceTargetDto>({});
  
  // Notify parent when formData changes (for orchestrator mode)
  useEffect(() => {
    if (orchestrator && onTargetDataChange) {
      onTargetDataChange(formData);
    }
  }, [formData, orchestrator, onTargetDataChange]);
  
  // Load enums on mount
  useEffect(() => {
    loadEnums();
  }, []);
  
  // Load existing target data when productId/targetId changes
  useEffect(() => {
    if (productId || targetId) {
      loadTargetData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, targetId]);

  const loadEnums = async () => {
    try {
      setLoading(true);
      
      // Fetch all enum categories in parallel using public methods
      const [
        accountGroups,
        genders,
        indigenousDetails,
        languages,
        races,
        cities,
        provinces,
        affiliateAreas,
        membershipCategories,
        hourlyEarnings,
        benefits,
        employmentStatuses,
        fundingSources,
        practiceYears,
        roleDescriptors,
        workHours,
        clientsAge,
        practiceAreas,
        practiceServices,
        practiceSettings,
        searchTools,
        practicePromotion,
        psychotherapySupervision,
        thirdParties,
        cotoStatuses,
        graduationYears,
        otUniversities,
        otaColleges,
      ] = await Promise.all([
        enumService.getAccountGroups(),
        enumService.getGenders(),
        enumService.getIndigenousDetails(),
        enumService.getLanguages(),
        enumService.getRaces(),
        enumService.getCities(),
        enumService.getProvinces(),
        enumService.getAffiliateAreas(),
        enumService.getMembershipCategories(),
        enumService.getHourlyEarnings(),
        enumService.getBenefits(),
        enumService.getEmploymentStatuses(),
        enumService.getFundingSources(),
        enumService.getPracticeYears(),
        enumService.getRoleDescriptors(),
        enumService.getWorkHours(),
        enumService.getClientsAge(),
        enumService.getPracticeAreas(),
        enumService.getPracticeServices(),
        enumService.getPracticeSettings(),
        enumService.getSearchTools(),
        enumService.getPracticePromotion(),
        enumService.getPsychotherapySupervision(),
        enumService.getThirdParties(),
        enumService.getCotoStatuses(),
        enumService.getGraduationYears(),
        enumService.getOtUniversities(),
        enumService.getOtaColleges(),
      ]);
      
      setEnums({
        accountGroups,
        genders,
        indigenousDetails,
        languages,
        races,
        cities,
        provinces,
        affiliateAreas,
        membershipCategories,
        hourlyEarnings,
        benefits,
        employmentStatuses,
        fundingSources,
        practiceYears,
        roleDescriptors,
        workHours,
        clientsAge,
        practiceAreas,
        practiceServices,
        practiceSettings,
        searchTools,
        practicePromotion,
        psychotherapySupervision,
        thirdParties,
        cotoStatuses,
        graduationYears,
        otUniversities,
        otaColleges,
      });
    } catch (error) {
      console.error('Error loading enums:', error);
      toast.error('Failed to load audience options');
    } finally {
      setLoading(false);
    }
  };

  const loadTargetData = async () => {
    try {
      let target: AudienceTargetResponse | null = null;
      
      if (targetId) {
        target = await audienceTargetService.getByTargetId(targetId);
      } else if (productId) {
        target = await audienceTargetService.getByProductId(productId);
      }
      
      if (target) {
        // Store the target ID for saving
        setLoadedTargetId(target.osot_target);
        
        // Extract all enum array fields
        const {
          osot_account_group,
          osot_membership_gender,
          osot_indigenous_details,
          osot_membership_language,
          osot_membership_race,
          osot_affiliate_city,
          osot_affiliate_province,
          osot_membership_city,
          osot_province,
          osot_affiliate_area,
          osot_eligibility_affiliate,
          osot_membership_category,
          osot_earnings,
          osot_earnings_selfdirect,
          osot_earnings_selfindirect,
          osot_employment_benefits,
          osot_employment_status,
          osot_position_funding,
          osot_practice_years,
          osot_role_description,
          osot_work_hours,
          osot_client_age,
          osot_practice_area,
          osot_practice_services,
          osot_practice_settings,
          osot_membership_search_tools,
          osot_practice_promotion,
          osot_psychotherapy_supervision,
          osot_third_parties,
          osot_coto_status,
          osot_ot_grad_year,
          osot_ot_university,
          osot_ota_grad_year,
          osot_ota_college,
        } = target;
        
        setFormData({
          osot_account_group: osot_account_group || [],
          osot_membership_gender: osot_membership_gender || [],
          osot_indigenous_details: osot_indigenous_details || [],
          osot_membership_language: osot_membership_language || [],
          osot_membership_race: osot_membership_race || [],
          osot_affiliate_city: osot_affiliate_city || [],
          osot_affiliate_province: osot_affiliate_province || [],
          osot_membership_city: osot_membership_city || [],
          osot_province: osot_province || [],
          osot_affiliate_area: osot_affiliate_area || [],
          osot_eligibility_affiliate: osot_eligibility_affiliate || [],
          osot_membership_category: osot_membership_category || [],
          osot_earnings: osot_earnings || [],
          osot_earnings_selfdirect: osot_earnings_selfdirect || [],
          osot_earnings_selfindirect: osot_earnings_selfindirect || [],
          osot_employment_benefits: osot_employment_benefits || [],
          osot_employment_status: osot_employment_status || [],
          osot_position_funding: osot_position_funding || [],
          osot_practice_years: osot_practice_years || [],
          osot_role_description: osot_role_description || [],
          osot_work_hours: osot_work_hours || [],
          osot_client_age: osot_client_age || [],
          osot_practice_area: osot_practice_area || [],
          osot_practice_services: osot_practice_services || [],
          osot_practice_settings: osot_practice_settings || [],
          osot_membership_search_tools: osot_membership_search_tools || [],
          osot_practice_promotion: osot_practice_promotion || [],
          osot_psychotherapy_supervision: osot_psychotherapy_supervision || [],
          osot_third_parties: osot_third_parties || [],
          osot_coto_status: osot_coto_status || [],
          osot_ot_grad_year: osot_ot_grad_year || [],
          osot_ot_university: osot_ot_university || [],
          osot_ota_grad_year: osot_ota_grad_year || [],
          osot_ota_college: osot_ota_college || [],
        });
      }
    } catch (error) {
      console.error('❌ [AudienceTargetForm] Error loading target data:', error);
    }
  };

  const handleCheckboxChange = (fieldName: keyof UpdateAudienceTargetDto, enumValue: number) => {
    setFormData(prev => {
      const currentValues = prev[fieldName] || [];
      const newValues = currentValues.includes(enumValue)
        ? currentValues.filter(v => v !== enumValue)
        : [...currentValues, enumValue];
      
      return {
        ...prev,
        [fieldName]: newValues,
      };
    });
  };

  const isChecked = (fieldName: keyof UpdateAudienceTargetDto, enumValue: number): boolean => {
    return (formData[fieldName] || []).includes(enumValue);
  };

  const handleSave = async () => {
    // Use orchestrator flow if orchestrator is available
    if (orchestrator) {
      // Validate that session exists and product was added
      if (!orchestrator.session) {
        toast.error('No active session', {
          description: 'Please save the product details first to create a session.',
        });
        return;
      }
      
      // CRITICAL: Validate that product data was added first (Step 2 in orchestrator flow)
      if (orchestrator.session.state === 'INITIATED') {
        toast.error('Product details required', {
          description: 'Please save the product details first before configuring audience targeting.',
        });
        return;
      }
      
      try {
        setSaving(true);
        
        // Add audience target to orchestrator session (Step 3)
        await orchestrator.addTarget(formData);
        
        toast.success('Audience targeting configured!', {
          description: isPublicProduct() 
            ? 'Product will be public (visible to everyone)'
            : 'Product will be restricted to selected audiences. Click "Commit & Create" to finalize.',
        });
        
        return; // Don't continue to old flow
      } catch (error) {
        console.error('Error configuring audience target in orchestrator:', error);
        toast.error('Failed to configure audience targeting');
      } finally {
        setSaving(false);
      }
      return;
    }
    
    // OLD FLOW: Direct update (editing mode)
    const activeTargetId = loadedTargetId || targetId;
    
    if (!activeTargetId) {
      toast.error('No target ID available. Please save product first.');
      return;
    }

    try {
      setSaving(true);
      const savedTarget = await audienceTargetService.update(activeTargetId, formData);
      
      toast.success('Audience targeting saved!', {
        description: isPublicProduct() 
          ? 'Product is now public (visible to everyone)'
          : 'Product is restricted to selected audiences',
      });
      
      onSaveSuccess?.(savedTarget);
    } catch (error) {
      console.error('Error saving audience target:', error);
      toast.error('Failed to save audience targeting');
    } finally {
      setSaving(false);
    }
  };

  const isPublicProduct = (): boolean => {
    return Object.values(formData).every(arr => !arr || arr.length === 0);
  };

  const getSelectedCount = (fieldName: keyof UpdateAudienceTargetDto): number => {
    return (formData[fieldName] || []).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!enums) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load audience options. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('space-y-6', locked && 'opacity-50 pointer-events-none')}>
      {/* Info Alert */}
      <Alert className={isPublicProduct() ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}>
        {isPublicProduct() ? (
          <>
            <Globe2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Public Product</strong>: All fields are empty. This product will be visible to everyone.
            </AlertDescription>
          </>
        ) : (
          <>
            <Users className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Members Only</strong>: At least one filter is active. Users matching <strong>any</strong> of the selected criteria can see this product (OR logic).
            </AlertDescription>
          </>
        )}
      </Alert>

      {locked && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please save the product first to configure audience targeting.
          </AlertDescription>
        </Alert>
      )}

      {/* Accordion for all categories */}
      <Accordion type="multiple" className="space-y-2">
        {/* Account & Identity */}
        <CheckboxGroup
          title="Account & Identity"
          icon={<Users className="h-5 w-5" />}
          fields={[
            { name: 'osot_account_group', label: 'Account Groups', options: enums.accountGroups },
            { name: 'osot_membership_gender', label: 'Gender', options: enums.genders },
            { name: 'osot_indigenous_details', label: 'Indigenous Details', options: enums.indigenousDetails },
            { name: 'osot_membership_language', label: 'Languages', options: enums.languages },
            { name: 'osot_membership_race', label: 'Race/Ethnicity', options: enums.races },
          ]}
          formData={formData}
          onCheckboxChange={handleCheckboxChange}
          isChecked={isChecked}
          getSelectedCount={getSelectedCount}
        />

        {/* Location */}
        <CheckboxGroup
          title="Location"
          icon={<MapPin className="h-5 w-5" />}
          fields={[
            { name: 'osot_affiliate_city', label: 'Affiliate City', options: enums.cities },
            { name: 'osot_affiliate_province', label: 'Affiliate Province', options: enums.provinces },
            { name: 'osot_membership_city', label: 'Member City', options: enums.cities },
            { name: 'osot_province', label: 'Member Province', options: enums.provinces },
          ]}
          formData={formData}
        onCheckboxChange={handleCheckboxChange}
        isChecked={isChecked}
        getSelectedCount={getSelectedCount}
      />

      {/* Membership */}
      <CheckboxGroup
        title="Membership"
        icon={<CheckCircle2 className="h-5 w-5" />}
        fields={[
          { name: 'osot_affiliate_area', label: 'Affiliate Areas', options: enums.affiliateAreas },
          { name: 'osot_membership_category', label: 'Membership Categories', options: enums.membershipCategories },
        ]}
        formData={formData}
        onCheckboxChange={handleCheckboxChange}
        isChecked={isChecked}
        getSelectedCount={getSelectedCount}
      />

      {/* Employment */}
      <CheckboxGroup
        title="Employment"
        icon={<Briefcase className="h-5 w-5" />}
        fields={[
          { name: 'osot_earnings', label: 'Earnings', options: enums.hourlyEarnings },
          { name: 'osot_earnings_selfdirect', label: 'Earnings (Self-Direct)', options: enums.hourlyEarnings },
          { name: 'osot_earnings_selfindirect', label: 'Earnings (Self-Indirect)', options: enums.hourlyEarnings },
          { name: 'osot_employment_benefits', label: 'Benefits', options: enums.benefits },
          { name: 'osot_employment_status', label: 'Employment Status', options: enums.employmentStatuses },
          { name: 'osot_position_funding', label: 'Position Funding', options: enums.fundingSources },
          { name: 'osot_practice_years', label: 'Practice Years', options: enums.practiceYears },
          { name: 'osot_role_description', label: 'Role Descriptors', options: enums.roleDescriptors },
          { name: 'osot_work_hours', label: 'Work Hours', options: enums.workHours },
        ]}
        formData={formData}
        onCheckboxChange={handleCheckboxChange}
        isChecked={isChecked}
        getSelectedCount={getSelectedCount}
      />

      {/* Practice */}
      <CheckboxGroup
        title="Practice"
        icon={<Stethoscope className="h-5 w-5" />}
        fields={[
          { name: 'osot_client_age', label: 'Client Age Groups', options: enums.clientsAge },
          { name: 'osot_practice_area', label: 'Practice Areas', options: enums.practiceAreas },
          { name: 'osot_practice_services', label: 'Practice Services', options: enums.practiceServices },
          { name: 'osot_practice_settings', label: 'Practice Settings', options: enums.practiceSettings },
        ]}
        formData={formData}
        onCheckboxChange={handleCheckboxChange}
        isChecked={isChecked}
        getSelectedCount={getSelectedCount}
      />

      {/* Preferences */}
      <CheckboxGroup
        title="Preferences"
        icon={<Settings className="h-5 w-5" />}
        fields={[
          { name: 'osot_membership_search_tools', label: 'Search Tools', options: enums.searchTools },
          { name: 'osot_practice_promotion', label: 'Practice Promotion', options: enums.practicePromotion },
          { name: 'osot_psychotherapy_supervision', label: 'Psychotherapy Supervision', options: enums.psychotherapySupervision },
          { name: 'osot_third_parties', label: 'Third Parties', options: enums.thirdParties },
        ]}
        formData={formData}
        onCheckboxChange={handleCheckboxChange}
        isChecked={isChecked}
        getSelectedCount={getSelectedCount}
      />

      {/* Education - OT */}
      <CheckboxGroup
        title="Education - OT"
        icon={<GraduationCap className="h-5 w-5" />}
        fields={[
          { name: 'osot_coto_status', label: 'COTO Status', options: enums.cotoStatuses },
          { name: 'osot_ot_grad_year', label: 'Graduation Year', options: enums.graduationYears },
          { name: 'osot_ot_university', label: 'OT Universities', options: enums.otUniversities },
        ]}
        formData={formData}
        onCheckboxChange={handleCheckboxChange}
        isChecked={isChecked}
        getSelectedCount={getSelectedCount}
      />

      {/* Education - OTA */}
      <CheckboxGroup
        title="Education - OTA"
        icon={<GraduationCap className="h-5 w-5" />}
        fields={[
          { name: 'osot_ota_grad_year', label: 'Graduation Year', options: enums.graduationYears },
          { name: 'osot_ota_college', label: 'OTA Colleges', options: enums.otaColleges },
        ]}
        formData={formData}
        onCheckboxChange={handleCheckboxChange}
        isChecked={isChecked}
        getSelectedCount={getSelectedCount}
      />
      </Accordion>

      {/* Save Button - Only for edit mode, not for orchestrator creation */}
      {!orchestrator && (
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving || locked}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Targeting
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Info for orchestrator mode */}
      {orchestrator && (
        <Alert className="mt-4">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            Your targeting configuration will be saved automatically when you click <strong>"Create Product"</strong> at the bottom of the dialog.
          </AlertDescription>
        </Alert>
      )}

      {/* Legend */}
      <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
        <p><strong>How it works:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>All empty</strong>: Product visible to everyone (public)</li>
          <li><strong>At least one selected</strong>: Only members matching ANY criterion can see (OR logic)</li>
          <li><strong>Multiple selected</strong>: User needs to match at least one to access</li>
        </ul>
      </div>
    </div>
  );
}

// Checkbox Group Component
interface CheckboxGroupProps {
  title: string;
  icon: React.ReactNode;
  fields: Array<{
    name: keyof UpdateAudienceTargetDto;
    label: string;
    options: EnumOption[];
  }>;
  formData: UpdateAudienceTargetDto;
  onCheckboxChange: (fieldName: keyof UpdateAudienceTargetDto, enumValue: number) => void;
  isChecked: (fieldName: keyof UpdateAudienceTargetDto, enumValue: number) => boolean;
  getSelectedCount: (fieldName: keyof UpdateAudienceTargetDto) => number;
}

function CheckboxGroup({ title, icon, fields, onCheckboxChange, isChecked, getSelectedCount }: CheckboxGroupProps) {
  const totalSelected = fields.reduce((sum, field) => sum + getSelectedCount(field.name), 0);
  
  return (
    <AccordionItem value={title}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold">{title}</span>
          </div>
          {totalSelected > 0 && (
            <Badge variant="secondary" className="ml-auto mr-2">
              {totalSelected} selected
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-6 pt-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">{field.label}</Label>
              {getSelectedCount(field.name) > 0 && (
                <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-medium">
                  {getSelectedCount(field.name)} selected
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {field.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.name}-${option.value}`}
                    checked={isChecked(field.name, option.value)}
                    onCheckedChange={() => onCheckboxChange(field.name, option.value)}
                  />
                  <label
                    htmlFor={`${field.name}-${option.value}`}
                    className="text-sm cursor-pointer hover:text-brand-600 transition-colors leading-tight"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}
