import { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, User, MapPin, Share2 } from 'lucide-react';
import { useAffiliate } from '@/hooks/useAffiliate';

export default function AffiliateProfilePage() {
  const { data: affiliate, isLoading } = useAffiliate();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    business: true,
    representative: false,
    address: false,
    social: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading affiliate information...</div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load affiliate information</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Affiliate Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your organization information</p>
      </div>

      {/* Business Information Section */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <button
          onClick={() => toggleSection('business')}
          className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-foreground">Business Information</h2>
          </div>
          {expandedSections.business ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {expandedSections.business && (
          <div className="p-6 pt-0 space-y-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Organization Name
                </label>
                <p className="text-foreground">{affiliate.osot_affiliate_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Business Area
                </label>
                <p className="text-foreground">
                  {typeof affiliate.osot_affiliate_area === 'object' 
                    ? affiliate.osot_affiliate_area?.label 
                    : affiliate.osot_affiliate_area || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <p className="text-foreground">{affiliate.osot_affiliate_email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone
                </label>
                <p className="text-foreground">{affiliate.osot_affiliate_phone}</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Website
                </label>
                <a 
                  href={affiliate.osot_affiliate_website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  {affiliate.osot_affiliate_website}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Representative Information Section */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <button
          onClick={() => toggleSection('representative')}
          className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-foreground">Representative Information</h2>
          </div>
          {expandedSections.representative ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {expandedSections.representative && (
          <div className="p-6 pt-0 space-y-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  First Name
                </label>
                <p className="text-foreground">{affiliate.osot_representative_first_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Last Name
                </label>
                <p className="text-foreground">{affiliate.osot_representative_last_name}</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Job Title
                </label>
                <p className="text-foreground">{affiliate.osot_representative_job_title}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address Information Section */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <button
          onClick={() => toggleSection('address')}
          className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-foreground">Address Information</h2>
          </div>
          {expandedSections.address ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {expandedSections.address && (
          <div className="p-6 pt-0 space-y-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Address Line 1
                </label>
                <p className="text-foreground">{affiliate.osot_affiliate_address_1}</p>
              </div>

              {affiliate.osot_affiliate_address_2 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Address Line 2
                  </label>
                  <p className="text-foreground">{affiliate.osot_affiliate_address_2}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  City
                </label>
                <p className="text-foreground">
                  {typeof affiliate.osot_affiliate_city === 'object'
                    ? affiliate.osot_affiliate_city?.label
                    : affiliate.osot_affiliate_city || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Province
                </label>
                <p className="text-foreground">
                  {typeof affiliate.osot_affiliate_province === 'object'
                    ? affiliate.osot_affiliate_province?.label
                    : affiliate.osot_affiliate_province || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Country
                </label>
                <p className="text-foreground">
                  {typeof affiliate.osot_affiliate_country === 'object'
                    ? affiliate.osot_affiliate_country?.label
                    : affiliate.osot_affiliate_country || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Postal Code
                </label>
                <p className="text-foreground">{affiliate.osot_affiliate_postal_code}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Social Media Section */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <button
          onClick={() => toggleSection('social')}
          className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <Share2 className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-foreground">Social Media</h2>
          </div>
          {expandedSections.social ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {expandedSections.social && (
          <div className="p-6 pt-0 space-y-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {affiliate.osot_affiliate_facebook && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Facebook
                  </label>
                  <a 
                    href={affiliate.osot_affiliate_facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline break-all"
                  >
                    {affiliate.osot_affiliate_facebook}
                  </a>
                </div>
              )}

              {affiliate.osot_affiliate_instagram && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Instagram
                  </label>
                  <a 
                    href={affiliate.osot_affiliate_instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline break-all"
                  >
                    {affiliate.osot_affiliate_instagram}
                  </a>
                </div>
              )}

              {affiliate.osot_affiliate_linkedin && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    LinkedIn
                  </label>
                  <a 
                    href={affiliate.osot_affiliate_linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline break-all"
                  >
                    {affiliate.osot_affiliate_linkedin}
                  </a>
                </div>
              )}

              {affiliate.osot_affiliate_tiktok && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    TikTok
                  </label>
                  <a 
                    href={affiliate.osot_affiliate_tiktok} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline break-all"
                  >
                    {affiliate.osot_affiliate_tiktok}
                  </a>
                </div>
              )}

              {!affiliate.osot_affiliate_facebook && 
               !affiliate.osot_affiliate_instagram && 
               !affiliate.osot_affiliate_linkedin && 
               !affiliate.osot_affiliate_tiktok && (
                <div className="md:col-span-2 text-muted-foreground text-sm">
                  No social media links available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
