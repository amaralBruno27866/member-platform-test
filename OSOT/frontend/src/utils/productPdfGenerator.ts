/**
 * Product PDF Generator
 * Generates professional PDF reports for product details including audience targeting
 */

import jsPDF from 'jspdf';
import type { ProductResponse } from '@/types/product';
import type { AudienceTargetResponse } from '@/services/audienceTargetService';

interface PdfGeneratorOptions {
  product: ProductResponse;
  audienceTarget?: AudienceTargetResponse | null;
  audienceLabels?: Record<string, string[]>;
}

export const generateProductPDF = async ({ product, audienceTarget, audienceLabels }: PdfGeneratorOptions): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add section
  const addSection = (title: string, content: Array<[string, string]>) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    // Section title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(49, 67, 121); // Brand blue #314379
    doc.text(title, 14, yPosition);
    yPosition += 7;

    // Section content
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    content.forEach(([label, value]) => {
      if (value && value.trim() !== '') {
        // Check if we need a new page
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

        // Label
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 14, yPosition);
        
        // Value (handle long text with wrapping)
        doc.setFont('helvetica', 'normal');
        const maxWidth = pageWidth - 84; // 70 (label position) + 14 (right margin)
        const lines = doc.splitTextToSize(value, maxWidth);
        doc.text(lines, 70, yPosition);
        yPosition += lines.length * 5;
      }
    });

    yPosition += 5; // Add spacing after section
  };

  // Header with logo and title
  // Logo configuration (easily adjustable)
  const logoPath = '/OSOTLogo.png';
  const logoSize = 21; // Reduced by 30% (was 30)
  const logoMargin = 14;
  const headerPadding = 8; // Space above and below logo
  const headerHeight = headerPadding + logoSize + headerPadding;
  const linePosition = headerHeight;
  
  try {
    doc.addImage(logoPath, 'PNG', logoMargin, headerPadding, logoSize, logoSize);
  } catch {
    // Fallback to text if logo loading fails
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(49, 67, 121);
    doc.text('OSOT', logoMargin, headerPadding + logoSize / 2);
  }
  
  // Company name (vertically centered with logo)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(49, 67, 121); // Brand blue #314379
  doc.text('Ontario Society of Occupational Therapists', logoMargin + logoSize + 6, headerPadding + logoSize / 2);
  
  // Document title (top right)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PRODUCT REPORT', pageWidth - 14, headerPadding + 8, { align: 'right' });

  // Date (below title)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(currentDate, pageWidth - 14, headerPadding + 16, { align: 'right' });

  // Brand blue line at bottom of header (3px)
  doc.setDrawColor(49, 67, 121); // Brand blue #314379
  doc.setLineWidth(0.8); // ~3px
  doc.line(0, linePosition, pageWidth, linePosition);

  yPosition = linePosition + 10;

  // Product Name (Highlighted)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(49, 67, 121); // Brand blue #314379
  doc.text(product.productName, 14, yPosition);
  yPosition += 10;

  // Basic Information
  addSection('Basic Information', [
    ['Product Code', product.productCode],
    ['Product ID', product.productId || '—'],
    ['Category', product.productCategory],
    ['Status', product.productStatus],
    ['GL Code', product.productGlCode || '—'],
    ['Year', product.productYear || '—'],
    ['Description', product.productDescription],
  ]);

  // Pricing Information
  const priceEntries: Array<[string, string]> = [];
  if (product.prices.general) priceEntries.push(['General Price', `$${product.prices.general.toFixed(2)}`]);
  if (product.prices.otStu) priceEntries.push(['OT Student', `$${product.prices.otStu.toFixed(2)}`]);
  if (product.prices.otNg) priceEntries.push(['OT New Grad', `$${product.prices.otNg.toFixed(2)}`]);
  if (product.prices.otPr) priceEntries.push(['OT Practicing', `$${product.prices.otPr.toFixed(2)}`]);
  if (product.prices.otNp) priceEntries.push(['OT Non-Practicing', `$${product.prices.otNp.toFixed(2)}`]);
  if (product.prices.otRet) priceEntries.push(['OT Retired', `$${product.prices.otRet.toFixed(2)}`]);
  if (product.prices.otLife) priceEntries.push(['OT Lifetime', `$${product.prices.otLife.toFixed(2)}`]);
  if (product.prices.otaStu) priceEntries.push(['OTA Student', `$${product.prices.otaStu.toFixed(2)}`]);
  if (product.prices.otaNg) priceEntries.push(['OTA New Grad', `$${product.prices.otaNg.toFixed(2)}`]);
  if (product.prices.otaNp) priceEntries.push(['OTA Non-Practicing', `$${product.prices.otaNp.toFixed(2)}`]);
  if (product.prices.otaRet) priceEntries.push(['OTA Retired', `$${product.prices.otaRet.toFixed(2)}`]);
  if (product.prices.otaPr) priceEntries.push(['OTA Practicing', `$${product.prices.otaPr.toFixed(2)}`]);
  if (product.prices.otaLife) priceEntries.push(['OTA Lifetime', `$${product.prices.otaLife.toFixed(2)}`]);
  if (product.prices.assoc) priceEntries.push(['Associate', `$${product.prices.assoc.toFixed(2)}`]);
  if (product.prices.affPrim) priceEntries.push(['Affiliate Primary', `$${product.prices.affPrim.toFixed(2)}`]);
  if (product.prices.affPrem) priceEntries.push(['Affiliate Premium', `$${product.prices.affPrem.toFixed(2)}`]);

  if (priceEntries.length > 0) {
    addSection('Pricing', priceEntries);
  }

  // Additional Information
  const additionalInfo: Array<[string, string]> = [];
  if (product.taxes) additionalInfo.push(['Tax Rate', `${product.taxes}%`]);
  if (product.shipping) additionalInfo.push(['Shipping Cost', `$${product.shipping.toFixed(2)}`]);
  if (product.inventory !== undefined) additionalInfo.push(['Inventory', product.inventory.toString()]);
  if (product.privilege) additionalInfo.push(['Privilege Level', product.privilege]);
  if (product.accessModifiers) additionalInfo.push(['Access Modifier', product.accessModifiers]);

  if (additionalInfo.length > 0) {
    addSection('Additional Information', additionalInfo);
  }

  // Access Control
  const accessControl: Array<[string, string]> = [];
  if (product.activeMembershipOnly !== undefined) {
    accessControl.push(['Members Only', product.activeMembershipOnly ? 'Yes' : 'No']);
  }
  
  if (accessControl.length > 0) {
    addSection('Access Control', accessControl);
  }

  // Availability Dates
  const dateInfo: Array<[string, string]> = [];
  if (product.startDate) {
    dateInfo.push(['Start Date', new Date(product.startDate).toLocaleDateString()]);
  }
  if (product.endDate) {
    dateInfo.push(['End Date', new Date(product.endDate).toLocaleDateString()]);
  }

  if (dateInfo.length > 0) {
    addSection('Availability Period', dateInfo);
  }

  // Administrative Notes
  if (product.postPurchaseInfo && product.postPurchaseInfo.trim() !== '') {
    addSection('Post-Purchase Information', [
      ['Notes', product.postPurchaseInfo],
    ]);
  }

  // Audience Targeting
  if (audienceTarget && audienceLabels) {
    const audienceInfo: Array<[string, string]> = [];
    
    // Check if any targeting is configured
    const hasTargeting = Object.entries(audienceTarget).some(([key, value]) => {
      return key.startsWith('osot_') && Array.isArray(value) && value.length > 0;
    });

    if (hasTargeting) {
      // Account & Identity
      if (audienceTarget.osot_account_group?.length) {
        audienceInfo.push(['Account Groups', audienceLabels.osot_account_group?.join(', ') || '—']);
      }
      if (audienceTarget.osot_membership_gender?.length) {
        audienceInfo.push(['Gender', audienceLabels.osot_membership_gender?.join(', ') || '—']);
      }
      if (audienceTarget.osot_indigenous_details?.length) {
        audienceInfo.push(['Indigenous Details', audienceLabels.osot_indigenous_details?.join(', ') || '—']);
      }
      if (audienceTarget.osot_membership_language?.length) {
        audienceInfo.push(['Languages', audienceLabels.osot_membership_language?.join(', ') || '—']);
      }
      if (audienceTarget.osot_membership_race?.length) {
        audienceInfo.push(['Race', audienceLabels.osot_membership_race?.join(', ') || '—']);
      }

      // Location
      if (audienceTarget.osot_affiliate_city?.length) {
        audienceInfo.push(['Affiliate Cities', audienceLabels.osot_affiliate_city?.join(', ') || '—']);
      }
      if (audienceTarget.osot_affiliate_province?.length) {
        audienceInfo.push(['Affiliate Provinces', audienceLabels.osot_affiliate_province?.join(', ') || '—']);
      }
      if (audienceTarget.osot_membership_city?.length) {
        audienceInfo.push(['Membership Cities', audienceLabels.osot_membership_city?.join(', ') || '—']);
      }
      if (audienceTarget.osot_province?.length) {
        audienceInfo.push(['Provinces', audienceLabels.osot_province?.join(', ') || '—']);
      }

      // Membership
      if (audienceTarget.osot_affiliate_area?.length) {
        audienceInfo.push(['Affiliate Areas', audienceLabels.osot_affiliate_area?.join(', ') || '—']);
      }
      if (audienceTarget.osot_eligibility_affiliate?.length) {
        audienceInfo.push(['Eligibility Affiliate', audienceLabels.osot_eligibility_affiliate?.join(', ') || '—']);
      }
      if (audienceTarget.osot_membership_category?.length) {
        audienceInfo.push(['Membership Categories', audienceLabels.osot_membership_category?.join(', ') || '—']);
      }

      // Employment
      if (audienceTarget.osot_earnings?.length) {
        audienceInfo.push(['Earnings', audienceLabels.osot_earnings?.join(', ') || '—']);
      }
      if (audienceTarget.osot_earnings_selfdirect?.length) {
        audienceInfo.push(['Self-Direct Earnings', audienceLabels.osot_earnings_selfdirect?.join(', ') || '—']);
      }
      if (audienceTarget.osot_earnings_selfindirect?.length) {
        audienceInfo.push(['Self-Indirect Earnings', audienceLabels.osot_earnings_selfindirect?.join(', ') || '—']);
      }
      if (audienceTarget.osot_employment_benefits?.length) {
        audienceInfo.push(['Employment Benefits', audienceLabels.osot_employment_benefits?.join(', ') || '—']);
      }
      if (audienceTarget.osot_employment_status?.length) {
        audienceInfo.push(['Employment Status', audienceLabels.osot_employment_status?.join(', ') || '—']);
      }
      if (audienceTarget.osot_position_funding?.length) {
        audienceInfo.push(['Position Funding', audienceLabels.osot_position_funding?.join(', ') || '—']);
      }
      if (audienceTarget.osot_practice_years?.length) {
        audienceInfo.push(['Practice Years', audienceLabels.osot_practice_years?.join(', ') || '—']);
      }
      if (audienceTarget.osot_role_description?.length) {
        audienceInfo.push(['Role Description', audienceLabels.osot_role_description?.join(', ') || '—']);
      }
      if (audienceTarget.osot_work_hours?.length) {
        audienceInfo.push(['Work Hours', audienceLabels.osot_work_hours?.join(', ') || '—']);
      }

      // Practice
      if (audienceTarget.osot_client_age?.length) {
        audienceInfo.push(['Client Age', audienceLabels.osot_client_age?.join(', ') || '—']);
      }
      if (audienceTarget.osot_practice_area?.length) {
        audienceInfo.push(['Practice Areas', audienceLabels.osot_practice_area?.join(', ') || '—']);
      }
      if (audienceTarget.osot_practice_services?.length) {
        audienceInfo.push(['Practice Services', audienceLabels.osot_practice_services?.join(', ') || '—']);
      }
      if (audienceTarget.osot_practice_settings?.length) {
        audienceInfo.push(['Practice Settings', audienceLabels.osot_practice_settings?.join(', ') || '—']);
      }

      // Preferences
      if (audienceTarget.osot_membership_search_tools?.length) {
        audienceInfo.push(['Search Tools', audienceLabels.osot_membership_search_tools?.join(', ') || '—']);
      }
      if (audienceTarget.osot_practice_promotion?.length) {
        audienceInfo.push(['Practice Promotion', audienceLabels.osot_practice_promotion?.join(', ') || '—']);
      }
      if (audienceTarget.osot_psychotherapy_supervision?.length) {
        audienceInfo.push(['Psychotherapy Supervision', audienceLabels.osot_psychotherapy_supervision?.join(', ') || '—']);
      }
      if (audienceTarget.osot_third_parties?.length) {
        audienceInfo.push(['Third Parties', audienceLabels.osot_third_parties?.join(', ') || '—']);
      }

      // Education - OT
      if (audienceTarget.osot_coto_status?.length) {
        audienceInfo.push(['COTO Status', audienceLabels.osot_coto_status?.join(', ') || '—']);
      }
      if (audienceTarget.osot_ot_grad_year?.length) {
        audienceInfo.push(['OT Graduation Year', audienceLabels.osot_ot_grad_year?.join(', ') || '—']);
      }
      if (audienceTarget.osot_ot_university?.length) {
        audienceInfo.push(['OT University', audienceLabels.osot_ot_university?.join(', ') || '—']);
      }

      // Education - OTA
      if (audienceTarget.osot_ota_grad_year?.length) {
        audienceInfo.push(['OTA Graduation Year', audienceLabels.osot_ota_grad_year?.join(', ') || '—']);
      }
      if (audienceTarget.osot_ota_college?.length) {
        audienceInfo.push(['OTA College', audienceLabels.osot_ota_college?.join(', ') || '—']);
      }

      if (audienceInfo.length > 0) {
        addSection('Audience Targeting', audienceInfo);
      } else {
        addSection('Audience Targeting', [['Status', 'Public (No targeting configured)']]);
      }
    } else {
      addSection('Audience Targeting', [['Status', 'Public (No targeting configured)']]);
    }
  }

  // Footer on last page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'OSOT - Ontario Society of Occupational Therapists',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // Open PDF in new tab
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};
