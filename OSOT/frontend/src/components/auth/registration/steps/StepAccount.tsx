import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AccountGroup } from '@/types/registration';

export default function StepAccount() {
  const { register, setValue, watch, formState: { errors } } = useFormContext();
  const accountGroup = watch('account.osot_account_group');
  
  // Helper to safely get nested error messages
  const getErrorMessage = (path: string) => {
    const parts = path.split('.');
    let current: any = errors;
    for (const part of parts) {
      if (!current?.[part]) return undefined;
      current = current[part];
    }
    return current?.message as string | undefined;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="John"
            {...register('account.osot_first_name', { required: 'First name is required' })}
            className={getErrorMessage('account.osot_first_name') ? 'border-red-500' : ''}
          />
          {getErrorMessage('account.osot_first_name') && (
            <p className="text-sm text-red-500">{getErrorMessage('account.osot_first_name')}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            {...register('account.osot_last_name', { required: 'Last name is required' })}
            className={getErrorMessage('account.osot_last_name') ? 'border-red-500' : ''}
          />
          {getErrorMessage('account.osot_last_name') && (
            <p className="text-sm text-red-500">{getErrorMessage('account.osot_last_name')}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="john.doe@example.com"
          {...register('account.osot_email', { 
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address"
            }
          })}
          className={getErrorMessage('account.osot_email') ? 'border-red-500' : ''}
        />
        {getErrorMessage('account.osot_email') && (
          <p className="text-sm text-red-500">{getErrorMessage('account.osot_email')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          {...register('account.osot_password', { 
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' }
          })}
          className={getErrorMessage('account.osot_password') ? 'border-red-500' : ''}
        />
        {getErrorMessage('account.osot_password') && (
          <p className="text-sm text-red-500">{getErrorMessage('account.osot_password')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="mobilePhone">Mobile Phone</Label>
        <Input
          id="mobilePhone"
          placeholder="(555) 123-4567"
          {...register('account.osot_mobile_phone', { required: 'Mobile phone is required' })}
          className={getErrorMessage('account.osot_mobile_phone') ? 'border-red-500' : ''}
        />
        {getErrorMessage('account.osot_mobile_phone') && (
          <p className="text-sm text-red-500">{getErrorMessage('account.osot_mobile_phone')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          {...register('account.osot_date_of_birth', { required: 'Date of birth is required' })}
          className={getErrorMessage('account.osot_date_of_birth') ? 'border-red-500' : ''}
        />
        {getErrorMessage('account.osot_date_of_birth') && (
          <p className="text-sm text-red-500">{getErrorMessage('account.osot_date_of_birth')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountGroup">Account Type</Label>
        <Select 
          onValueChange={(value) => {
            const group = parseInt(value);
            setValue('account.osot_account_group', group);
            // Set education type based on group
            if (group === AccountGroup.OCCUPATIONAL_THERAPIST) {
              setValue('educationType', 'ot');
            } else if (group === AccountGroup.OCCUPATIONAL_THERAPIST_ASSISTANT) {
              setValue('educationType', 'ota');
            }
          }}
          defaultValue={accountGroup?.toString()}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AccountGroup.OCCUPATIONAL_THERAPIST.toString()}>Occupational Therapist</SelectItem>
            <SelectItem value={AccountGroup.OCCUPATIONAL_THERAPIST_ASSISTANT.toString()}>Occupational Therapist Assistant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 pt-4">
        <Checkbox 
          id="declaration" 
          onCheckedChange={(checked) => setValue('account.osot_account_declaration', checked)}
        />
        <Label htmlFor="declaration" className="text-sm">
          I declare that the information provided is accurate.
        </Label>
      </div>
    </div>
  );
}
