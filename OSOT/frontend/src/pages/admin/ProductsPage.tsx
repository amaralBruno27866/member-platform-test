/**
 * Products Page (Admin/Main Only)
 * CRUD management for products
 */

import { useState, useEffect, useMemo } from 'react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, usePermanentDeleteProduct } from '@/hooks/useProducts';
import { useProductOrchestrator } from '@/hooks/useProductOrchestrator';
import { enumService, type EnumOption } from '@/services/enumService';
import type { UpdateAudienceTargetDto } from '@/services/audienceTargetService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CloudinaryUploadWidget } from '@/components/upload/CloudinaryUploadWidget';
import {
  Package,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  LayoutGrid,
  LayoutList,
  X,
  Check,
  ArrowUpDown,
  Settings,
  Calendar,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorInfo } from '@/lib/errorHandler';
import { getErrorMessage } from '@/lib/errorMessages';
import { getDirectImageUrl } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import { generateProductPDF } from '@/utils/productPdfGenerator';
import { audienceTargetService } from '@/services/audienceTargetService';
import type { AudienceTargetResponse } from '@/services/audienceTargetService';
import type { ProductResponse, CreateProductDto, UpdateProductDto } from '@/types/product';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { AudienceTargetForm } from '@/components/admin/AudienceTargetForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Import constants and utils from shared modules
import { ProductCard } from '@/components/products/ProductCard';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  PRIVILEGE_LEVELS,
  ACCESS_MODIFIERS,
} from '@/utils/productConstants';
import {
  getActivePrices,
  getDisplayPrice,
  isVisibleInStore,
} from '@/utils/productUtils';

export default function ProductsPage() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20;

  const { data: products, isLoading, error, refetch } = useProducts({ take: 100 });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const permanentDeleteProduct = usePermanentDeleteProduct();
  
  // Orchestrator for new product creation flow (enables Audience Target during creation)
  const orchestrator = useProductOrchestrator();

  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showVisibleOnly, setShowVisibleOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest' | 'oldest'>('newest');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [productForDialog, setProductForDialog] = useState<ProductResponse | undefined>(undefined);
  const [activeViewTab, setActiveViewTab] = useState<'details' | 'audience'>('details');
  const [useOrchestratorMode, setUseOrchestratorMode] = useState(false); // Track if using orchestrator

  // Dynamic enums from backend
  const [productGlCodes, setProductGlCodes] = useState<EnumOption[]>([]);
  const [isLoadingEnums, setIsLoadingEnums] = useState(true);

  // Load GL Codes from backend
  useEffect(() => {
    const loadGlCodes = async () => {
      try {
        const glCodes = await enumService.getProductGlCodes();
        setProductGlCodes(glCodes);
      } catch (error) {
        console.error('Failed to load GL Codes:', error);
        toast.error('Failed to load GL Codes');
      } finally {
        setIsLoadingEnums(false);
      }
    };
    loadGlCodes();
  }, []);

  // Sync formData when edit dialog opens with selected product
  useEffect(() => {
    if (showEditDialog && selectedProduct && productGlCodes.length > 0) {
      // Map GL Code robustly: try exact label, then match by code digits
      const glCodeMatch = () => {
        const exact = productGlCodes.find((g) => g.label === selectedProduct.productGlCode);
        if (exact) return exact.value;
        const digits = selectedProduct.productGlCode?.match(/\d+/)?.[0];
        if (digits) {
          const byCode = productGlCodes.find((g) => g.label.includes(digits));
          if (byCode) return byCode.value;
        }
        return undefined;
      };

      const normalizeDate = (value?: string) =>
        value ? value.split('T')[0] : undefined; // Input type=date needs YYYY-MM-DD

      setFormData({
        productName: selectedProduct.productName,
        productCode: selectedProduct.productCode,
        productDescription: selectedProduct.productDescription,
        productCategory: PRODUCT_CATEGORIES.find((c) => c.label === selectedProduct.productCategory)?.value,
        productPicture: selectedProduct.productPicture || '',
        productStatus: PRODUCT_STATUSES.find((s) => s.label === selectedProduct.productStatus)?.value,
        productGlCode: glCodeMatch(),
        privilege: PRIVILEGE_LEVELS.find((p) => p.label === selectedProduct.privilege)?.value || 1,
        accessModifiers: ACCESS_MODIFIERS.find((a) => a.label === selectedProduct.accessModifiers)?.value || 1,
        activeMembershipOnly: selectedProduct.activeMembershipOnly ?? false,
        // Prices
        generalPrice: selectedProduct.prices.general,
        otStuPrice: selectedProduct.prices.otStu,
        otNgPrice: selectedProduct.prices.otNg,
        otPrPrice: selectedProduct.prices.otPr,
        otNpPrice: selectedProduct.prices.otNp,
        otRetPrice: selectedProduct.prices.otRet,
        otLifePrice: selectedProduct.prices.otLife,
        otaStuPrice: selectedProduct.prices.otaStu,
        otaNgPrice: selectedProduct.prices.otaNg,
        otaNpPrice: selectedProduct.prices.otaNp,
        otaRetPrice: selectedProduct.prices.otaRet,
        otaPrPrice: selectedProduct.prices.otaPr,
        otaLifePrice: selectedProduct.prices.otaLife,
        assocPrice: selectedProduct.prices.assoc,
        affPrimPrice: selectedProduct.prices.affPrim,
        affPremPrice: selectedProduct.prices.affPrem,
        // Other
        taxes: selectedProduct.taxes,
        inventory: selectedProduct.inventory,
        shipping: selectedProduct.shipping,
        // Dates (convert ISO to YYYY-MM-DD)
        startDate: normalizeDate(selectedProduct.startDate),
        endDate: normalizeDate(selectedProduct.endDate),
      });
    }
  }, [showEditDialog, selectedProduct, productGlCodes]);

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<CreateProductDto>>({
    productName: '',
    productCode: '',
    productDescription: '',
    productCategory: undefined,
    productPicture: '',
    productStatus: 1, // Available by default
    productGlCode: undefined,
    privilege: 1, // Owner by default
    accessModifiers: 1, // Public by default
    // Prices
    generalPrice: undefined,
    otStuPrice: undefined,
    otNgPrice: undefined,
    otPrPrice: undefined,
    otNpPrice: undefined,
    otRetPrice: undefined,
    otLifePrice: undefined,
    otaStuPrice: undefined,
    otaNgPrice: undefined,
    otaNpPrice: undefined,
    otaRetPrice: undefined,
    otaPrPrice: undefined,
    otaLifePrice: undefined,
    assocPrice: undefined,
    affPrimPrice: undefined,
    affPremPrice: undefined,
    // Other
    taxes: 13,
    inventory: 0,
    shipping: 0,
    // Dates
    startDate: undefined,
    endDate: undefined,
    // NEW FIELDS
    activeMembershipOnly: false, // Default: false (not restricted to members)
    postPurchaseInfo: '', // Optional administrative field
    productYear: new Date().getFullYear().toString(), // Default: current year
  });

  // Filter and sort products by search query
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    // Filter by search query
    let filtered = products.filter(
      (product) =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productDescription.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // ADMIN PAGE: Show ALL products regardless of membership status
    // (membership filtering only applies to public store page)
    
    // Filter by year
    if (yearFilter !== 'all') {
      filtered = filtered.filter(product => product.productYear === yearFilter);
    }
    
    // Filter by category
    if (categoryFilter !== 'all') {
      const selectedCategoryLabel = PRODUCT_CATEGORIES.find(c => c.value.toString() === categoryFilter)?.label;
      filtered = filtered.filter(product => product.productCategory === selectedCategoryLabel);
    }
    
    // Filter by visibility (show only products visible in store)
    if (showVisibleOnly) {
      filtered = filtered.filter(isVisibleInStore);
    }
    
    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.productName.localeCompare(b.productName);
        case 'name-desc':
          return b.productName.localeCompare(a.productName);
        case 'price-asc':
          return (a.prices.general || 0) - (b.prices.general || 0);
        case 'price-desc':
          return (b.prices.general || 0) - (a.prices.general || 0);
        case 'newest':
          // Use productId for sorting (newer products last in array)
          return (b.productId || '').localeCompare(a.productId || '');
        case 'oldest':
          return (a.productId || '').localeCompare(b.productId || '');
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [products, searchQuery, sortBy, yearFilter, categoryFilter, showVisibleOnly]);

  // Pagination calculations
  const totalProducts = filteredProducts?.length || 0;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  
  // Get paginated products
  const paginatedProducts = useMemo(() => {
    return filteredProducts?.slice(startIndex, endIndex) || [];
  }, [filteredProducts, startIndex, endIndex]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, yearFilter, categoryFilter, showVisibleOnly, sortBy]);

  // Get unique years from products for filter dropdown
  const availableYears = useMemo(() => {
    if (!products) return [];
    const years = new Set(products.map(p => p.productYear).filter(Boolean));
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // Descending order
  }, [products]);

  const handleCreateClick = async () => {
    setProductForDialog(undefined); // Novo produto sem ID
    setFormData({
      productName: '',
      productCode: '',
      productDescription: '',
      productCategory: undefined,
      productPicture: '',
      productStatus: 1,
      productGlCode: undefined,
      privilege: 1,
      accessModifiers: 1,
      generalPrice: undefined,
      otStuPrice: undefined,
      otNgPrice: undefined,
      otPrPrice: undefined,
      otNpPrice: undefined,
      otRetPrice: undefined,
      otLifePrice: undefined,
      otaStuPrice: undefined,
      otaNgPrice: undefined,
      otaNpPrice: undefined,
      otaRetPrice: undefined,
      otaPrPrice: undefined,
      otaLifePrice: undefined,
      assocPrice: undefined,
      affPrimPrice: undefined,
      affPremPrice: undefined,
      taxes: 13,
      inventory: 0,
      shipping: 0,
      startDate: undefined,
      endDate: undefined,
    });
    
    // Enable orchestrator mode (session will be created when user clicks "Save Details")
    setUseOrchestratorMode(true);
    setShowCreateDialog(true);
  };

  const handleEditClick = (product: ProductResponse) => {
    setProductForDialog(product); // Produto existente com ID - desbloqueia audience tab
    setSelectedProduct(product);
    setShowEditDialog(true);
    // formData will be populated by useEffect when dialog opens
  };

  const handleViewClick = (product: ProductResponse) => {
    setSelectedProduct(product);
    setActiveViewTab('details'); // Reset to details tab
    setShowViewDialog(true);
  };

  const handleDeleteClick = (product: ProductResponse) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  const handleGeneratePDF = async (product: ProductResponse) => {
    try {
      // Show loading toast
      toast.loading('Generating PDF report...');

      let audienceTarget: AudienceTargetResponse | null = null;
      let audienceLabels: Record<string, string[]> = {};

      // Try to fetch audience target data
      if (product.id) {
        try {
          audienceTarget = await audienceTargetService.getByProductId(product.id);
          
          if (audienceTarget) {
            // Fetch all enum labels in parallel
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

            // Build label maps
            const getLabelsByValues = (options: EnumOption[], values: number[] | undefined) => {
              if (!values || values.length === 0) return [];
              return values.map(v => options.find(o => o.value === v)?.label || String(v));
            };

            audienceLabels = {
              osot_account_group: getLabelsByValues(accountGroups, audienceTarget.osot_account_group),
              osot_membership_gender: getLabelsByValues(genders, audienceTarget.osot_membership_gender),
              osot_indigenous_details: getLabelsByValues(indigenousDetails, audienceTarget.osot_indigenous_details),
              osot_membership_language: getLabelsByValues(languages, audienceTarget.osot_membership_language),
              osot_membership_race: getLabelsByValues(races, audienceTarget.osot_membership_race),
              osot_affiliate_city: getLabelsByValues(cities, audienceTarget.osot_affiliate_city),
              osot_affiliate_province: getLabelsByValues(provinces, audienceTarget.osot_affiliate_province),
              osot_membership_city: getLabelsByValues(cities, audienceTarget.osot_membership_city),
              osot_province: getLabelsByValues(provinces, audienceTarget.osot_province),
              osot_affiliate_area: getLabelsByValues(affiliateAreas, audienceTarget.osot_affiliate_area),
              osot_eligibility_affiliate: getLabelsByValues(affiliateAreas, audienceTarget.osot_eligibility_affiliate),
              osot_membership_category: getLabelsByValues(membershipCategories, audienceTarget.osot_membership_category),
              osot_earnings: getLabelsByValues(hourlyEarnings, audienceTarget.osot_earnings),
              osot_earnings_selfdirect: getLabelsByValues(hourlyEarnings, audienceTarget.osot_earnings_selfdirect),
              osot_earnings_selfindirect: getLabelsByValues(hourlyEarnings, audienceTarget.osot_earnings_selfindirect),
              osot_employment_benefits: getLabelsByValues(benefits, audienceTarget.osot_employment_benefits),
              osot_employment_status: getLabelsByValues(employmentStatuses, audienceTarget.osot_employment_status),
              osot_position_funding: getLabelsByValues(fundingSources, audienceTarget.osot_position_funding),
              osot_practice_years: getLabelsByValues(practiceYears, audienceTarget.osot_practice_years),
              osot_role_description: getLabelsByValues(roleDescriptors, audienceTarget.osot_role_description),
              osot_work_hours: getLabelsByValues(workHours, audienceTarget.osot_work_hours),
              osot_client_age: getLabelsByValues(clientsAge, audienceTarget.osot_client_age),
              osot_practice_area: getLabelsByValues(practiceAreas, audienceTarget.osot_practice_area),
              osot_practice_services: getLabelsByValues(practiceServices, audienceTarget.osot_practice_services),
              osot_practice_settings: getLabelsByValues(practiceSettings, audienceTarget.osot_practice_settings),
              osot_membership_search_tools: getLabelsByValues(searchTools, audienceTarget.osot_membership_search_tools),
              osot_practice_promotion: getLabelsByValues(practicePromotion, audienceTarget.osot_practice_promotion),
              osot_psychotherapy_supervision: getLabelsByValues(psychotherapySupervision, audienceTarget.osot_psychotherapy_supervision),
              osot_third_parties: getLabelsByValues(thirdParties, audienceTarget.osot_third_parties),
              osot_coto_status: getLabelsByValues(cotoStatuses, audienceTarget.osot_coto_status),
              osot_ot_grad_year: getLabelsByValues(graduationYears, audienceTarget.osot_ot_grad_year),
              osot_ot_university: getLabelsByValues(otUniversities, audienceTarget.osot_ot_university),
              osot_ota_grad_year: getLabelsByValues(graduationYears, audienceTarget.osot_ota_grad_year),
              osot_ota_college: getLabelsByValues(otaColleges, audienceTarget.osot_ota_college),
            };
          }
        } catch (error) {
          console.warn('Could not fetch audience target data:', error);
          // Continue without audience data
        }
      }

      // Generate PDF
      await generateProductPDF({
        product,
        audienceTarget,
        audienceLabels,
      });

      toast.dismiss();
      toast.success('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to generate PDF');
    }
  };

  // State to hold audience target data from child component
  const [audienceTargetData, setAudienceTargetData] = useState<UpdateAudienceTargetDto | null>(null);

  const handleCreateSubmit = async () => {
    try {
      // Validation
      if (!formData.productName || !formData.productCode || !formData.productDescription) {
        toast.error('Validation Error', {
          description: 'Product name, code, and description are required.',
        });
        return;
      }

      if (formData.productCategory === undefined || formData.productGlCode === undefined) {
        toast.error('Validation Error', {
          description: 'Product category and GL code are required.',
        });
        return;
      }

      // Validate productYear (YYYY format)
      if (!formData.productYear || !/^\d{4}$/.test(formData.productYear)) {
        toast.error('Validation Error', {
          description: 'Product year is required and must be in YYYY format (e.g., 2025).',
        });
        return;
      }

      // Check if at least one price is provided
      const hasPriceField = 
        formData.generalPrice !== undefined ||
        formData.otStuPrice !== undefined ||
        formData.otNgPrice !== undefined ||
        formData.otPrPrice !== undefined ||
        formData.otNpPrice !== undefined ||
        formData.otRetPrice !== undefined ||
        formData.otLifePrice !== undefined ||
        formData.otaStuPrice !== undefined ||
        formData.otaNgPrice !== undefined ||
        formData.otaNpPrice !== undefined ||
        formData.otaRetPrice !== undefined ||
        formData.otaPrPrice !== undefined ||
        formData.otaLifePrice !== undefined ||
        formData.assocPrice !== undefined ||
        formData.affPrimPrice !== undefined ||
        formData.affPremPrice !== undefined;

      if (!hasPriceField) {
        toast.error('Validation Error', {
          description: 'At least one price field is required.',
        });
        return;
      }

      // Use orchestrator flow if enabled - CREATE PRODUCT ATOMICALLY
      if (useOrchestratorMode) {
        toast.loading('Creating product...', { id: 'create-product' });
        
        try {
          // Debug: Log what we're sending
          console.log('📦 [Orchestrator] Sending product data:', formData);
          
          // Step 1: Create session (always create new session for fresh state)
          const session = await orchestrator.createSession();
          console.log('✅ Session created:', session.sessionId);
          
          // Step 2: Add product data (pass session explicitly to avoid state race condition)
          const productStep = await orchestrator.addProduct(formData as CreateProductDto, session);
          console.log('✅ Product data added, state:', productStep.state);
          
          // Step 3: Add targeting if user configured it (pass productStep which has updated session)
          if (audienceTargetData && Object.keys(audienceTargetData).length > 0) {
            const targetStep = await orchestrator.addTarget(audienceTargetData, productStep);
            console.log('✅ Target data added, state:', targetStep.state);
            
            // Step 4: Commit atomically (use targetStep)
            const result = await orchestrator.commit(targetStep);
            console.log('✅ Orchestrator commit result:', result);
            
            if (result.success && result.productId) {
              toast.success('Product Created Successfully!', {
                id: 'create-product',
                description: `Product "${formData.productName}" has been created.`,
              });
              
              // Reset and close
              setUseOrchestratorMode(false);
              setShowCreateDialog(false);
              setAudienceTargetData(null);
              orchestrator.reset();
              refetch();
            } else {
              throw new Error(result.message || 'Failed to create product');
            }
          } else {
            // No targeting - commit with just product data
            const result = await orchestrator.commit(productStep);
            console.log('✅ Orchestrator commit result:', result);
            
            if (result.success && result.productId) {
              toast.success('Product Created Successfully!', {
                id: 'create-product',
                description: `Product "${formData.productName}" has been created.`,
              });
              
              // Reset and close
              setUseOrchestratorMode(false);
              setShowCreateDialog(false);
              setAudienceTargetData(null);
              orchestrator.reset();
              refetch();
            } else {
              throw new Error(result.message || 'Failed to create product');
            }
          }
        } catch (err) {
          console.error('Orchestrator create error:', err);
          const { code } = extractErrorInfo(err);
          const errorMessage = getErrorMessage(code, 'Failed to create product. Please try again.');
          toast.error('Error', { id: 'create-product', description: errorMessage });
        }
        
        return;
      }

      // OLD FLOW: Direct creation (fallback if orchestrator not available)
      const savedProduct = await createProduct.mutateAsync(formData as CreateProductDto);

      // IMPORTANTE: Atualizar o productForDialog com o produto salvo para desbloquear a aba Audience Target
      setProductForDialog(savedProduct);

      toast.success('Product Created!', {
        description: `Product "${formData.productName}" has been created successfully. You can now configure audience targeting.`,
      });

      // NÃO fechar o dialog - deixar aberto para configurar audience
      // setShowCreateDialog(false);
      refetch();
    } catch (err) {
      console.error('Create product error:', err);
      const { code } = extractErrorInfo(err);
      const errorMessage = getErrorMessage(code, 'Failed to create product. Please try again.');
      toast.error('Error', { description: errorMessage });
    }
  };



  const handleEditSubmit = async () => {
    if (!selectedProduct?.id) return;

    console.log('[Product Edit] Selected Product:', selectedProduct);
    console.log('[Product Edit] Form Data:', formData);

    try {
      const updateData: UpdateProductDto = {};

      // Basic fields
      if (formData.productName !== selectedProduct.productName) {
        updateData.productName = formData.productName;
      }
      if (formData.productDescription !== selectedProduct.productDescription) {
        updateData.productDescription = formData.productDescription;
      }
      if (formData.productPicture !== selectedProduct.productPicture) {
        updateData.productPicture = formData.productPicture;
      }

      // Category
      if (formData.productCategory !== undefined) {
        const currentCategory = PRODUCT_CATEGORIES.find(
          (c) => c.label === selectedProduct.productCategory
        )?.value;
        if (formData.productCategory !== currentCategory) {
          updateData.productCategory = formData.productCategory;
        }
      }

      // Status
      if (formData.productStatus !== undefined) {
        const currentStatus = PRODUCT_STATUSES.find(
          (s) => s.label === selectedProduct.productStatus
        )?.value;
        if (formData.productStatus !== currentStatus) {
          updateData.productStatus = formData.productStatus;
        }
      }

      // GL Code
      if (formData.productGlCode !== undefined) {
        const currentGlCode = productGlCodes.find(
          (g) => g.label === selectedProduct.productGlCode
        )?.value;
        if (formData.productGlCode !== currentGlCode) {
          updateData.productGlCode = formData.productGlCode;
        }
      }

      // Privilege
      if (formData.privilege !== undefined) {
        const currentPrivilege = PRIVILEGE_LEVELS.find(
          (p) => p.label === selectedProduct.privilege
        )?.value;
        if (formData.privilege !== currentPrivilege) {
          updateData.privilege = formData.privilege;
        }
      }

      // Access Modifiers
      if (formData.accessModifiers !== undefined) {
        const currentAccessModifiers = ACCESS_MODIFIERS.find(
          (a) => a.label === selectedProduct.accessModifiers
        )?.value;
        if (formData.accessModifiers !== currentAccessModifiers) {
          updateData.accessModifiers = formData.accessModifiers;
        }
      }

      // Prices - check all price fields
      if (formData.generalPrice !== selectedProduct.prices.general) {
        updateData.generalPrice = formData.generalPrice;
      }
      if (formData.otStuPrice !== selectedProduct.prices.otStu) {
        updateData.otStuPrice = formData.otStuPrice;
      }
      if (formData.otNgPrice !== selectedProduct.prices.otNg) {
        updateData.otNgPrice = formData.otNgPrice;
      }
      if (formData.otPrPrice !== selectedProduct.prices.otPr) {
        updateData.otPrPrice = formData.otPrPrice;
      }
      if (formData.otNpPrice !== selectedProduct.prices.otNp) {
        updateData.otNpPrice = formData.otNpPrice;
      }
      if (formData.otRetPrice !== selectedProduct.prices.otRet) {
        updateData.otRetPrice = formData.otRetPrice;
      }
      if (formData.otLifePrice !== selectedProduct.prices.otLife) {
        updateData.otLifePrice = formData.otLifePrice;
      }
      if (formData.otaStuPrice !== selectedProduct.prices.otaStu) {
        updateData.otaStuPrice = formData.otaStuPrice;
      }
      if (formData.otaNgPrice !== selectedProduct.prices.otaNg) {
        updateData.otaNgPrice = formData.otaNgPrice;
      }
      if (formData.otaNpPrice !== selectedProduct.prices.otaNp) {
        updateData.otaNpPrice = formData.otaNpPrice;
      }
      if (formData.otaRetPrice !== selectedProduct.prices.otaRet) {
        updateData.otaRetPrice = formData.otaRetPrice;
      }
      if (formData.otaPrPrice !== selectedProduct.prices.otaPr) {
        updateData.otaPrPrice = formData.otaPrPrice;
      }
      if (formData.otaLifePrice !== selectedProduct.prices.otaLife) {
        updateData.otaLifePrice = formData.otaLifePrice;
      }
      if (formData.assocPrice !== selectedProduct.prices.assoc) {
        updateData.assocPrice = formData.assocPrice;
      }
      if (formData.affPrimPrice !== selectedProduct.prices.affPrim) {
        updateData.affPrimPrice = formData.affPrimPrice;
      }
      if (formData.affPremPrice !== selectedProduct.prices.affPrem) {
        updateData.affPremPrice = formData.affPremPrice;
      }

      // Other fields
      if (formData.taxes !== selectedProduct.taxes) {
        updateData.taxes = formData.taxes;
      }
      if (formData.inventory !== selectedProduct.inventory) {
        updateData.inventory = formData.inventory;
      }
      if (formData.shipping !== selectedProduct.shipping) {
        updateData.shipping = formData.shipping;
      }

      // Date fields - check if dates were modified
      if (formData.startDate !== selectedProduct.startDate) {
        updateData.startDate = formData.startDate;
      }
      if (formData.endDate !== selectedProduct.endDate) {
        updateData.endDate = formData.endDate;
      }

      // New fields - Access Control & Administrative
      if (formData.activeMembershipOnly !== selectedProduct.activeMembershipOnly) {
        updateData.activeMembershipOnly = formData.activeMembershipOnly;
      }
      if (formData.postPurchaseInfo !== selectedProduct.postPurchaseInfo) {
        updateData.postPurchaseInfo = formData.postPurchaseInfo;
      }
      // Note: productYear is NOT editable, so we don't check it here

      if (Object.keys(updateData).length === 0) {
        toast.info('No Changes', {
          description: 'No fields were modified.',
        });
        setShowEditDialog(false);
        return;
      }

      console.log('[Product Update] Sending payload:', updateData);

      await updateProduct.mutateAsync({ id: selectedProduct.id, data: updateData });

      toast.success('Product Updated!', {
        description: `Product "${selectedProduct.productName}" has been updated successfully.`,
      });

      setShowEditDialog(false);
      refetch();
    } catch (err) {
      console.error('Update product error:', err);
      const { code } = extractErrorInfo(err);
      const errorMessage = getErrorMessage(code, 'Failed to update product. Please try again.');
      toast.error('Error', { description: errorMessage });
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedProduct?.id) return;

    try {
      await deleteProduct.mutateAsync(selectedProduct.id);

      toast.success('Product Deleted!', {
        description: `Product "${selectedProduct.productName}" has been set to discontinued.`,
      });

      setShowDeleteDialog(false);
      refetch();
    } catch (err) {
      console.error('Delete product error:', err);
      const { code } = extractErrorInfo(err);
      const errorMessage = getErrorMessage(code, 'Failed to delete product. Please try again.');
      toast.error('Error', { description: errorMessage });
    }
  };

  const handlePermanentDeleteClick = () => {
    setShowEditDialog(false);
    setShowPermanentDeleteDialog(true);
  };

  const handlePermanentDeleteSubmit = async () => {
    if (!selectedProduct?.id || !deletePassword) {
      toast.error('Password Required', {
        description: 'Please enter your password to confirm permanent deletion.',
      });
      return;
    }

    try {
      // TODO: Validate password with backend authentication endpoint
      // For now, we'll proceed with deletion
      // In production, add: await authService.validatePassword(deletePassword);

      await permanentDeleteProduct.mutateAsync(selectedProduct.id);

      toast.success('Product Permanently Deleted!', {
        description: `Product "${selectedProduct.productName}" has been permanently removed.`,
      });

      setShowPermanentDeleteDialog(false);
      setDeletePassword('');
      refetch();
    } catch (err) {
      console.error('Permanent delete error:', err);
      const { code } = extractErrorInfo(err);
      const errorMessage = getErrorMessage(code, 'Failed to permanently delete product. Please try again.');
      toast.error('Error', { description: errorMessage });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products Management</h1>
          <p className="text-muted-foreground mt-2">Loading products...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products Management</h1>
        </div>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load products. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage products, pricing, and inventory
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex border rounded-lg p-1 bg-muted">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8"
            >
              <LayoutList className="h-4 w-4 mr-2" />
              Table
            </Button>
          </div>
          
          {/* Sort Dropdown */}
          <div className="flex border rounded-lg p-1 bg-muted">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="h-8 px-3 text-xs border-0 shadow-none bg-transparent hover:bg-accent hover:text-accent-foreground focus:ring-0">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="price-asc">Price (Low-High)</SelectItem>
                <SelectItem value="price-desc">Price (High-Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex border rounded-lg p-1 bg-muted">
            <Button onClick={handleCreateClick} className="h-8 px-3 text-xs bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Store Visibility Stats */}
            {filteredProducts && filteredProducts.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-brand-50 rounded-lg border border-brand-200">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-brand-600" />
                  <span className="text-sm font-medium text-brand-900">
                    Public Store Visibility:
                  </span>
                  <span className="text-sm text-brand-700">
                    {filteredProducts.filter(isVisibleInStore).length} of {filteredProducts.length} products visible
                  </span>
                </div>
                <span className="text-xs text-brand-600">
                  Products must be "Available" and within date range to appear in store
                </span>
              </div>
            )}
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Pagination and Filters Container */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Pagination Controls */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium whitespace-nowrap">
                  Page {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Filters Row */}
              <div className="flex items-center gap-4 flex-wrap">
              {/* Year Filter */}
              <div className="flex items-center gap-2">
                <Label htmlFor="yearFilter" className="text-sm font-medium whitespace-nowrap">
                  Year:
                </Label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger id="yearFilter" className="w-[160px]">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>
                        {year} ({products?.filter(p => p.productYear === year).length} products)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {yearFilter !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setYearFilter('all')}
                    className="h-9 px-2"
                    title="Clear year filter"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Label htmlFor="categoryFilter" className="text-sm font-medium whitespace-nowrap">
                  Category:
                </Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="categoryFilter" className="w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {PRODUCT_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value.toString()}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoryFilter !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategoryFilter('all')}
                    className="h-9 px-2"
                    title="Clear category filter"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Visibility Filter */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  id="showVisibleOnly"
                  checked={showVisibleOnly}
                  onChange={(e) => setShowVisibleOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="showVisibleOnly" className="text-sm font-medium cursor-pointer whitespace-nowrap">
                  Visible in store only
                </Label>
              </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List - Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => handleViewClick(product)}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onGeneratePDF={handleGeneratePDF}
              isAdmin={true}
            />
          ))}
        </div>
      )}

      {/* Products List - Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">ID</TableHead>
                  <TableHead className="text-center">Product</TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts?.map((product) => (
                  <TableRow 
                    key={product.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewClick(product)}
                  >
                    <TableCell className="text-center">
                      <span className="text-xs font-mono text-muted-foreground">
                        {product.productId?.slice(-3) || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.productName}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {product.productDescription}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-green-600">
                          ${getDisplayPrice(product.prices).toFixed(2)}
                        </span>
                        {(() => {
                          const activePrices = getActivePrices(product.prices);
                          const otherPricesCount = activePrices.length - (product.prices.general ? 1 : 0);
                          if (otherPricesCount > 0) {
                            return (
                              <span className="text-xs text-brand-600">
                                + {otherPricesCount} more
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          product.productStatus === 'Available'
                            ? 'bg-green-100 text-green-700'
                            : product.productStatus === 'Draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {product.productStatus}
                        </span>
                        {product.activeMembershipOnly && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium" title="Only visible to active members">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Members
                          </span>
                        )}
                        {isVisibleInStore(product) && (
                          <span className="text-xs px-2 py-1 rounded bg-brand-100 text-brand-700 font-medium" title="Visible in public store">
                            👁️ Public
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(product)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, totalProducts)} of {totalProducts} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredProducts?.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No products found matching your search.'
                  : 'No products available. Create your first product to get started.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Product Dialog */}
      <ProductFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        product={productForDialog}
        isEditMode={false}
        useOrchestrator={useOrchestratorMode}
        orchestrator={orchestrator}
        onTargetDataChange={setAudienceTargetData}
        onProductSaved={(savedProduct) => {
          setProductForDialog(savedProduct);
          setUseOrchestratorMode(false);
          refetch();
        }}
        footer={
          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowCreateDialog(false);
                if (useOrchestratorMode) {
                  orchestrator.reset();
                  setUseOrchestratorMode(false);
                }
                setAudienceTargetData(null);
              }}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              
              {/* Single "Create Product" button for orchestrator mode */}
              <Button 
                className="flex-1" 
                onClick={handleCreateSubmit} 
                disabled={orchestrator.loading || createProduct.isPending}
              >
                {(orchestrator.loading || createProduct.isPending) ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                ) : (
                  <><Check className="mr-2 h-4 w-4" />Create Product</>
                )}
              </Button>
            </div>
          </DialogFooter>
        }
      >
            {/* Basic Information Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Basic Information</h4>
              </div>
              
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="productName" className="text-sm font-medium">Product Name *</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g., OSOT Membership 2025"
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="productCode" className="text-sm font-medium">Product Code *</Label>
                    <Input
                      id="productCode"
                      value={formData.productCode}
                      onChange={(e) => setFormData({ ...formData, productCode: e.target.value.toUpperCase() })}
                      placeholder="e.g., MEM-2025"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productCategory" className="text-sm font-medium">Category *</Label>
                    <Select
                      value={formData.productCategory?.toString()}
                      onValueChange={(value) => setFormData({ ...formData, productCategory: parseInt(value) })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value.toString()}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="productDescription" className="text-sm font-medium">Description *</Label>
                  <Textarea
                    id="productDescription"
                    value={formData.productDescription}
                    onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                    placeholder="Describe your product..."
                    rows={3}
                    className="mt-1.5 resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="productPicture" className="text-sm font-medium">Product Image</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="productPicture"
                      value={formData.productPicture}
                      onChange={(e) => setFormData({ ...formData, productPicture: e.target.value })}
                      placeholder="https://..."
                    />
                    <CloudinaryUploadWidget
                      onUploadSuccess={(url) => setFormData({ ...formData, productPicture: url })}
                      buttonText="Upload"
                      folder="products"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Configuration Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Configuration</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="productStatus" className="text-sm font-medium">Status *</Label>
                  <Select
                    value={formData.productStatus?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, productStatus: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value.toString()}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="productGlCode" className="text-sm font-medium">GL Code *</Label>
                  <Select
                    value={formData.productGlCode?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, productGlCode: parseInt(value) })}
                    disabled={isLoadingEnums}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder={isLoadingEnums ? "Loading..." : "Select GL code"} />
                    </SelectTrigger>
                    <SelectContent>
                      {productGlCodes.map((code) => (
                        <SelectItem key={code.value} value={code.value.toString()}>
                          {code.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="privilege" className="text-sm font-medium">Privilege Level</Label>
                  <Select
                    value={formData.privilege?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, privilege: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select privilege" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIVILEGE_LEVELS.map((priv) => (
                        <SelectItem key={priv.value} value={priv.value.toString()}>
                          {priv.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="accessModifiers" className="text-sm font-medium">Access Modifier</Label>
                  <Select
                    value={formData.accessModifiers?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, accessModifiers: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select access" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_MODIFIERS.map((access) => (
                        <SelectItem key={access.value} value={access.value.toString()}>
                          {access.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Pricing Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold text-sm">💰 Pricing</h4>
              </div>
              
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="generalPrice" className="text-sm font-medium">General Price * <span className="text-xs text-muted-foreground">(Default for all users)</span></Label>
                  <Input
                    id="generalPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.generalPrice ?? ''}
                    onChange={(e) => setFormData({ ...formData, generalPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                    className="mt-1.5"
                  />
                </div>

                {/* Category-specific pricing in accordion */}
                <details className="group">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent transition-colors">
                      <span className="text-sm font-medium">Category-Specific Pricing (Optional)</span>
                      <span className="text-xs text-muted-foreground group-open:hidden">Click to expand</span>
                    </div>
                  </summary>
                  <div className="mt-2 space-y-2 p-3 bg-muted/30 rounded-md">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor="otStuPrice" className="text-xs">OT Student</Label>
                        <Input
                          id="otStuPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.otStuPrice ?? ''}
                          onChange={(e) => setFormData({ ...formData, otStuPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })}
                          placeholder="0.00"
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="otNgPrice" className="text-xs">OT New Grad</Label>
                        <Input id="otNgPrice" type="number" step="0.01" min="0" value={formData.otNgPrice ?? ''} onChange={(e) => setFormData({ ...formData, otNgPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="otPrPrice" className="text-xs">OT Professional</Label>
                        <Input id="otPrPrice" type="number" step="0.01" min="0" value={formData.otPrPrice ?? ''} onChange={(e) => setFormData({ ...formData, otPrPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="otNpPrice" className="text-xs">OT Non-Practicing</Label>
                        <Input id="otNpPrice" type="number" step="0.01" min="0" value={formData.otNpPrice ?? ''} onChange={(e) => setFormData({ ...formData, otNpPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="otRetPrice" className="text-xs">OT Retired</Label>
                        <Input id="otRetPrice" type="number" step="0.01" min="0" value={formData.otRetPrice ?? ''} onChange={(e) => setFormData({ ...formData, otRetPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="otLifePrice" className="text-xs">OT Lifetime</Label>
                        <Input id="otLifePrice" type="number" step="0.01" min="0" value={formData.otLifePrice ?? ''} onChange={(e) => setFormData({ ...formData, otLifePrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="otaStuPrice" className="text-xs">OTA Student</Label>
                        <Input id="otaStuPrice" type="number" step="0.01" min="0" value={formData.otaStuPrice ?? ''} onChange={(e) => setFormData({ ...formData, otaStuPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="otaNgPrice" className="text-xs">OTA New Grad</Label>
                        <Input id="otaNgPrice" type="number" step="0.01" min="0" value={formData.otaNgPrice ?? ''} onChange={(e) => setFormData({ ...formData, otaNgPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="otaPrPrice" className="text-xs">OTA Professional</Label>
                        <Input id="otaPrPrice" type="number" step="0.01" min="0" value={formData.otaPrPrice ?? ''} onChange={(e) => setFormData({ ...formData, otaPrPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="otaNpPrice" className="text-xs">OTA Non-Practicing</Label>
                        <Input id="otaNpPrice" type="number" step="0.01" min="0" value={formData.otaNpPrice ?? ''} onChange={(e) => setFormData({ ...formData, otaNpPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="otaRetPrice" className="text-xs">OTA Retired</Label>
                        <Input id="otaRetPrice" type="number" step="0.01" min="0" value={formData.otaRetPrice ?? ''} onChange={(e) => setFormData({ ...formData, otaRetPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="otaLifePrice" className="text-xs">OTA Lifetime</Label>
                        <Input id="otaLifePrice" type="number" step="0.01" min="0" value={formData.otaLifePrice ?? ''} onChange={(e) => setFormData({ ...formData, otaLifePrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="assocPrice" className="text-xs">Associate</Label>
                        <Input id="assocPrice" type="number" step="0.01" min="0" value={formData.assocPrice ?? ''} onChange={(e) => setFormData({ ...formData, assocPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="affPrimPrice" className="text-xs">Affiliate Primary</Label>
                        <Input id="affPrimPrice" type="number" step="0.01" min="0" value={formData.affPrimPrice ?? ''} onChange={(e) => setFormData({ ...formData, affPrimPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor="affPremPrice" className="text-xs">Affiliate Premium</Label>
                        <Input id="affPremPrice" type="number" step="0.01" min="0" value={formData.affPremPrice ?? ''} onChange={(e) => setFormData({ ...formData, affPremPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1 h-8 text-sm" />
                      </div>
                    </div>
                  </div>
                </details>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="taxes" className="text-sm font-medium">Taxes (%) *</Label>
                    <Input id="taxes" type="number" step="0.01" min="0" max="100" value={formData.taxes || ''} onChange={(e) => setFormData({ ...formData, taxes: parseFloat(e.target.value) })} placeholder="13.00" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="inventory" className="text-sm font-medium">Inventory</Label>
                    <Input id="inventory" type="number" min="0" value={formData.inventory || ''} onChange={(e) => setFormData({ ...formData, inventory: parseInt(e.target.value) || 0 })} placeholder="0 = unlimited" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="shipping" className="text-sm font-medium">Shipping</Label>
                    <Input id="shipping" type="number" step="0.01" min="0" value={formData.shipping || ''} onChange={(e) => setFormData({ ...formData, shipping: parseFloat(e.target.value) || 0 })} placeholder="0.00" className="mt-1.5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Advanced Settings Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Advanced Settings</h4>
              </div>
              
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                    <Input id="startDate" type="date" value={formData.startDate || ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value || undefined })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                    <Input id="endDate" type="date" value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })} min={formData.startDate || undefined} className="mt-1.5" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="productYear" className="text-sm font-medium">Product Year * (YYYY)</Label>
                  <Input id="productYear" type="text" placeholder="e.g., 2025" value={formData.productYear}
                  onChange={(e) => setFormData({ ...formData, productYear: e.target.value })}
                  maxLength={4}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground">4-digit year. Not editable after creation.</p>
              </div>

              <div className="flex items-start space-x-2 p-2 rounded-md bg-accent/30">
                <input
                  type="checkbox"
                  id="activeMembershipOnly"
                  checked={formData.activeMembershipOnly || false}
                  onChange={(e) => setFormData({ ...formData, activeMembershipOnly: e.target.checked })}
                  className="mt-1 h-4 w-4"
                />
                <div className="flex-1">
                  <Label htmlFor="activeMembershipOnly" className="text-sm font-medium cursor-pointer">Members Only</Label>
                  <p className="text-xs text-muted-foreground">Only active members can view/purchase</p>
                </div>
              </div>

              <div>
                <Label htmlFor="postPurchaseInfo" className="text-sm font-medium">Post-Purchase Info <span className="text-xs text-muted-foreground">(Optional, for email receipts)</span></Label>
                <Textarea
                  id="postPurchaseInfo"
                  value={formData.postPurchaseInfo || ''}
                  onChange={(e) => setFormData({ ...formData, postPurchaseInfo: e.target.value })}
                  placeholder="Additional info for receipt email (e.g., delivery instructions, event details)"
                  rows={3}
                  maxLength={4000}
                  className="resize-none mt-1.5 text-sm"
                />
                <p className="text-xs text-muted-foreground">{formData.postPurchaseInfo?.length || 0}/4000 characters</p>
              </div>
              </div>
            </div>
        </ProductFormDialog>

      {/* Edit Product Dialog */}
      <ProductFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        product={productForDialog}
        isEditMode={true}
        onProductSaved={(savedProduct) => {
          setProductForDialog(savedProduct);
          refetch();
        }}
      >
          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">Basic Information</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editProductName">Product Name *</Label>
                  <Input
                    id="editProductName"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="editProductCode">Product Code (Read-only)</Label>
                    <Input
                      id="editProductCode"
                      value={formData.productCode}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editProductPicture">Picture URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="editProductPicture"
                        value={formData.productPicture}
                        onChange={(e) => setFormData({ ...formData, productPicture: e.target.value })}
                        placeholder="https://..."
                      />
                      <CloudinaryUploadWidget
                        onUploadSuccess={(url) => setFormData({ ...formData, productPicture: url })}
                        buttonText="Upload"
                        folder="products"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editProductDescription">Description *</Label>
                  <Textarea
                    id="editProductDescription"
                    value={formData.productDescription}
                    onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editProductCategory">Category *</Label>
                  <Select
                    value={formData.productCategory?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, productCategory: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value.toString()}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editProductStatus">Status *</Label>
                  <Select
                    value={formData.productStatus?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, productStatus: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value.toString()}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editProductGlCode">GL Code *</Label>
                  <Select
                    value={formData.productGlCode?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, productGlCode: parseInt(value) })}
                    disabled={isLoadingEnums}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingEnums ? "Loading..." : undefined} />
                    </SelectTrigger>
                    <SelectContent>
                      {productGlCodes.map((code) => (
                        <SelectItem key={code.value} value={code.value.toString()}>
                          {code.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editPrivilege">Privilege</Label>
                  <Select
                    value={formData.privilege?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, privilege: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIVILEGE_LEVELS.map((priv) => (
                        <SelectItem key={priv.value} value={priv.value.toString()}>
                          {priv.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editAccessModifiers">Access Modifier</Label>
                  <Select
                    value={formData.accessModifiers?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, accessModifiers: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_MODIFIERS.map((access) => (
                        <SelectItem key={access.value} value={access.value.toString()}>
                          {access.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* General Pricing */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">General Pricing</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editGeneralPrice">General Price *</Label>
                  <Input
                    id="editGeneralPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.generalPrice ?? ''}
                    onChange={(e) => setFormData({ ...formData, generalPrice: e.target.value !== '' ? parseFloat(e.target.value) : undefined })}
                  />
                  <p className="text-xs text-muted-foreground">Default price for all users</p>
                </div>
              </div>
            </div>

            {/* Pricing - OT Categories */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">Category-Specific Pricing (Optional)</h3>
              <p className="text-sm text-muted-foreground -mt-2 mb-3">Set prices for specific membership categories. Leave empty to use general price.</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editOtStuPrice">OT Student</Label>
                  <Input
                    id="editOtStuPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otStuPrice || ''}
                    onChange={(e) => setFormData({ ...formData, otStuPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editOtNgPrice">OT New Grad</Label>
                  <Input
                    id="editOtNgPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otNgPrice || ''}
                    onChange={(e) => setFormData({ ...formData, otNgPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editOtPrPrice">OT Practicing</Label>
                  <Input
                    id="editOtPrPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otPrPrice || ''}
                    onChange={(e) => setFormData({ ...formData, otPrPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editOtNpPrice">OT Non-Practicing</Label>
                  <Input
                    id="editOtNpPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otNpPrice || ''}
                    onChange={(e) => setFormData({ ...formData, otNpPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editOtRetPrice">OT Retired</Label>
                  <Input
                    id="editOtRetPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otRetPrice || ''}
                    onChange={(e) => setFormData({ ...formData, otRetPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editOtLifePrice">OT Lifetime</Label>
                  <Input
                    id="editOtLifePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otLifePrice || ''}
                    onChange={(e) => setFormData({ ...formData, otLifePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
              </div>
            </div>

            {/* Pricing - OTA Categories */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">Pricing - OTA Categories</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editOtaStuPrice">OTA Student</Label>
                  <Input
                    id="editOtaStuPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otaStuPrice || ''}
                    onChange={(e) => setFormData({ ...formData, otaStuPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editOtaNgPrice">OTA New Grad</Label>
                  <Input
                    id="editOtaNgPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otaNgPrice || ''}
                    onChange={(e) => setFormData({ ...formData, otaNgPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editOtaNpPrice">OTA Non-Practicing</Label>
                  <Input
                    id="editOtaNpPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otaNpPrice || ''}
                    onChange={(e) => setFormData({ ...formData, otaNpPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editOtaRetPrice">OTA Retired</Label>
                  <Input
                    id="editOtaRetPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otaRetPrice || ''}
                    onChange={(e) => setFormData({ ...formData, otaRetPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editOtaPrPrice">OTA Practicing</Label>
                  <Input
                    id="editOtaPrPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otaPrPrice || ''}
                    onChange={(e) => setFormData({ ...formData, otaPrPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editOtaLifePrice">OTA Lifetime</Label>
                  <Input
                    id="editOtaLifePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otaLifePrice || ''}
                    onChange={(e) => setFormData({ ...formData, otaLifePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
              </div>
            </div>

            {/* Pricing - Other Categories */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">Pricing - Other Categories</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editAssocPrice">Associate</Label>
                  <Input
                    id="editAssocPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.assocPrice || ''}
                    onChange={(e) => setFormData({ ...formData, assocPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editAffPrimPrice">Affiliate Primary</Label>
                  <Input
                    id="editAffPrimPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.affPrimPrice || ''}
                    onChange={(e) => setFormData({ ...formData, affPrimPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editAffPremPrice">Affiliate Premium</Label>
                  <Input
                    id="editAffPremPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.affPremPrice || ''}
                    onChange={(e) => setFormData({ ...formData, affPremPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
              </div>
            </div>

            {/* Other Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">Other Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editTaxes">Taxes (%) *</Label>
                  <Input
                    id="editTaxes"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.taxes || ''}
                    onChange={(e) => setFormData({ ...formData, taxes: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editInventory">Inventory (0 = unlimited)</Label>
                  <Input
                    id="editInventory"
                    type="number"
                    min="0"
                    value={formData.inventory || ''}
                    onChange={(e) => setFormData({ ...formData, inventory: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editShipping">Shipping Cost</Label>
                  <Input
                    id="editShipping"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.shipping || ''}
                    onChange={(e) => setFormData({ ...formData, shipping: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Date Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">Availability Period (Optional)</h3>
              <p className="text-sm text-muted-foreground -mt-2 mb-3">
                Set start and end dates for time-limited products (promotions, seasonal items). Leave empty for always available.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editStartDate">Start Date</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value || undefined })}
                  />
                  <p className="text-xs text-muted-foreground">Product becomes available from this date</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEndDate">End Date</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
                    min={formData.startDate || undefined}
                  />
                  <p className="text-xs text-muted-foreground">Product expires after this date</p>
                </div>
              </div>
            </div>

            {/* Access Control & Administrative */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">Access Control & Administrative</h3>
              
              {/* Members Only Toggle */}
              <div className="flex items-start space-x-3 bg-muted/30 p-4 rounded-lg border border-border">
                <Checkbox
                  id="editActiveMembershipOnly"
                  checked={formData.activeMembershipOnly || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, activeMembershipOnly: checked === true })}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="editActiveMembershipOnly" className="text-base cursor-pointer font-medium">
                    Members Only Product
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict this product to active members only. Users without active membership will not see this product in the store.
                  </p>
                </div>
              </div>

              {/* Product Year - DISABLED (not editable) */}
              <div className="grid gap-2">
                <Label htmlFor="editProductYear">Product Year (Not Editable)</Label>
                <Input
                  id="editProductYear"
                  type="text"
                  value={formData.productYear || ''}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ Product year cannot be changed after creation. This is used for administrative filtering only.
                </p>
              </div>

              {/* Post-Purchase Info */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="editPostPurchaseInfo">Post-Purchase Information (Optional)</Label>
                  <span className="text-xs text-muted-foreground">
                    {(formData.postPurchaseInfo || '').length} / 4000 characters
                  </span>
                </div>
                <Textarea
                  id="editPostPurchaseInfo"
                  placeholder="Additional instructions sent to customers after purchase (e.g., access links, credentials, setup steps)..."
                  value={formData.postPurchaseInfo || ''}
                  onChange={(e) => {
                    if (e.target.value.length <= 4000) {
                      setFormData({ ...formData, postPurchaseInfo: e.target.value });
                    }
                  }}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  📧 This text is included in the purchase confirmation email sent to customers. Use it for access instructions, download links, or next steps.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handlePermanentDeleteClick}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowEditDialog(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleEditSubmit} disabled={updateProduct.isPending}>
                {updateProduct.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </ProductFormDialog>

      {/* View Product Dialog (Read-only with Tabs) */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              View product information and audience configuration
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <>
              {/* Tabs Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveViewTab('details')}
                    className={cn(
                      'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm',
                      activeViewTab === 'details'
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Package className="h-5 w-5" />
                    Product Details
                  </button>

                  <button
                    onClick={() => setActiveViewTab('audience')}
                    className={cn(
                      'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm',
                      activeViewTab === 'audience'
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Users className="h-5 w-5" />
                    Audience Target
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              {activeViewTab === 'details' ? (
            <div className="grid gap-6 py-4">
              {/* Product Image */}
              {selectedProduct.productPicture && (
                <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={getDirectImageUrl(selectedProduct.productPicture)}
                    alt={selectedProduct.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Failed to load image in view:', selectedProduct.productPicture);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Product Name</Label>
                    <p className="font-medium">{selectedProduct.productName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Product Code</Label>
                    <p className="font-medium">{selectedProduct.productCode}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="font-medium whitespace-pre-line leading-relaxed">
                      {selectedProduct.productDescription}
                    </p>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium">{selectedProduct.productCategory}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p className={`font-medium inline-flex items-center px-2 py-1 rounded text-sm ${
                      selectedProduct.productStatus === 'Available'
                        ? 'bg-green-100 text-green-700'
                        : selectedProduct.productStatus === 'Draft'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedProduct.productStatus}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">GL Code</Label>
                    <p className="font-medium">{selectedProduct.productGlCode}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Privilege</Label>
                    <p className="font-medium">{selectedProduct.privilege || 'Owner'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Access Modifier</Label>
                    <p className="font-medium">{selectedProduct.accessModifiers || 'Public'}</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">Pricing</h3>
                {(() => {
                  const activePrices = getActivePrices(selectedProduct.prices);
                  if (activePrices.length === 0) {
                    return <p className="text-sm text-muted-foreground">No prices configured</p>;
                  }
                  return (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {activePrices.map((price) => (
                        <div key={price.label}>
                          <Label className="text-muted-foreground">{price.label}</Label>
                          <p className="font-medium text-green-600">${price.value.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Other Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">Other Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Taxes</Label>
                    <p className="font-medium">{selectedProduct.taxes}%</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Inventory</Label>
                    <p className="font-medium">{selectedProduct.inventory || 'Unlimited'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Shipping</Label>
                    <p className="font-medium">${selectedProduct.shipping?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              {/* Availability Period */}
              {(selectedProduct.startDate || selectedProduct.endDate) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold border-b pb-2">Availability Period</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedProduct.startDate && (
                      <div>
                        <Label className="text-muted-foreground">Start Date</Label>
                        <p className="font-medium">
                          {new Date(selectedProduct.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Product available from this date
                        </p>
                      </div>
                    )}
                    {selectedProduct.endDate && (
                      <div>
                        <Label className="text-muted-foreground">End Date</Label>
                        <p className="font-medium">
                          {new Date(selectedProduct.endDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Product expires after this date
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedProduct.isActive !== undefined && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                          selectedProduct.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedProduct.isActive ? '✓ Currently Active' : '✗ Not Active'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {selectedProduct.isActive 
                            ? 'Product is within availability period' 
                            : 'Product is outside availability period'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* No dates set - Always available */}
              {!selectedProduct.startDate && !selectedProduct.endDate && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold border-b pb-2">Availability Period</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 font-medium">
                      ∞ Always Available
                    </span>
                    <span className="text-muted-foreground">
                      No time restrictions
                    </span>
                  </div>
                </div>
              )}
              
              {/* Access Control & Administrative */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">Access Control & Administrative</h3>
                
                {/* Members Only Badge */}
                <div className="flex items-center gap-3">
                  <Label className="text-muted-foreground">Access Restriction</Label>
                  {selectedProduct.activeMembershipOnly ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Members Only
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Public Access
                    </span>
                  )}
                </div>

                {/* Product Year */}
                <div>
                  <Label className="text-muted-foreground">Product Year</Label>
                  <p className="font-medium text-lg">{selectedProduct.productYear}</p>
                  <p className="text-xs text-muted-foreground mt-1">Administrative year classification</p>
                </div>

                {/* Post-Purchase Info (Admin Only) */}
                {selectedProduct.postPurchaseInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <Label className="text-blue-900 font-semibold">Post-Purchase Information</Label>
                    <p className="text-sm text-blue-800 mt-2 whitespace-pre-wrap leading-relaxed">
                      {selectedProduct.postPurchaseInfo}
                    </p>
                    <p className="text-xs text-blue-600 mt-2 italic">
                      📧 This information is sent to customers in the purchase confirmation email
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Audience Target Tab (Read-only) */
            <div className="py-6">
              <AudienceTargetForm
                productId={selectedProduct.id}
                locked={true}
              />
            </div>
          )}
          </>
          )}
          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setShowViewDialog(false)}>
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
              <Button className="flex-1" onClick={() => {
                setShowViewDialog(false);
                if (selectedProduct) handleEditClick(selectedProduct);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This will set the status to "Discontinued".
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <Alert>
              <AlertDescription>
                <strong>{selectedProduct.productName}</strong>
                <br />
                Code: {selectedProduct.productCode}
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteSubmit}
                disabled={deleteProduct.isPending}
              >
                {deleteProduct.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog open={showPermanentDeleteDialog} onOpenChange={(open) => {
        setShowPermanentDeleteDialog(open);
        if (!open) setDeletePassword('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Permanent Delete Warning</DialogTitle>
            <DialogDescription>
              This action <strong>CANNOT be undone</strong>. The product will be permanently removed from the database.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You are about to permanently delete:
                  <br />
                  <strong>{selectedProduct.productName}</strong> ({selectedProduct.productCode})
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  placeholder="Your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && deletePassword) {
                      handlePermanentDeleteSubmit();
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Type your password and press Enter or click Delete to confirm.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowPermanentDeleteDialog(false);
                  setDeletePassword('');
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handlePermanentDeleteSubmit}
                disabled={!deletePassword || permanentDeleteProduct.isPending}
              >
                {permanentDeleteProduct.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

