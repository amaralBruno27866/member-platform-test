/**
 * ORDER SUMMARY - DATA SOURCE MAPPING REFERENCE
 *
 * Este documento mapeia cada campo do OrderSummaryResponseDto
 * para suas fontes de dados no sistema.
 *
 * LEGEND:
 * 🟡 Redis (In-Memory Cache) - Dados da sessão
 * 🔵 Dataverse (Entity) - Dados persistidos
 * 🟢 Calculated - Calculado em tempo real
 * 🔴 UNKNOWN - Precisa ser definido
 */

// ========================================
// SECTION 1: ORDER HEADER
// ========================================

/**
 * orderHeader.orderId
 * 📍 SOURCE: Redis
 * 🗝️  KEY: MEMBERSHIP_ORCHESTRATOR_REDIS_KEYS.ORDER_REFERENCE(sessionId)
 * 📝 DESCRIPTION: Order DRAFT ID criado em Step 5
 * 🔍 EXAMPLE: "osot_ord_0004321"
 * 📌 NOTES: Armazenado como string UUID
 */

/**
 * orderHeader.date
 * 📍 SOURCE: Calculated
 * 🔬 LOGIC: new Date().toISOString().split('T')[0]
 * 📝 DESCRIPTION: Data atual da criação do resumo
 * 🔍 EXAMPLE: "2026-02-03"
 * 📌 NOTES: ISO 8601 format (YYYY-MM-DD)
 */

/**
 * orderHeader.sessionId
 * 📍 SOURCE: Parameter
 * 🔀 FROM: initiateMembership(sessionId)
 * 📝 DESCRIPTION: ID único da sessão de membership
 * 🔍 EXAMPLE: "12345-abscu-78de4-a45e-88f70-0100q1"
 * 📌 NOTES: Passado como parâmetro direto
 */

// ========================================
// SECTION 2: USER DETAIL
// ========================================

/**
 * userDetail.name
 * 📍 SOURCE: Dataverse - Account
 * 🗝️  FIELDS: osot_first_name + " " + osot_last_name
 * 📝 DESCRIPTION: Nome completo do usuário
 * 🔍 EXAMPLE: "Bruno Amaral"
 * 📌 QUERY: Account.findById(userGuid) -> osot_first_name + osot_last_name
 */

/**
 * userDetail.email
 * 📍 SOURCE: Dataverse - Account
 * 🗝️  FIELD: osot_email
 * 📝 DESCRIPTION: Email do usuário
 * 🔍 EXAMPLE: "b.alencar.amaral@gmail.com"
 * 📌 QUERY: Account.findById(userGuid) -> osot_email
 */

/**
 * userDetail.phone
 * 📍 SOURCE: Dataverse - Account
 * 🗝️  FIELD: osot_phone_number
 * 📝 DESCRIPTION: Telefone formatado
 * 🔍 EXAMPLE: "437-313-0319"
 * 📌 QUERY: Account.findById(userGuid) -> osot_phone_number
 * ⚠️  TODO: Verificar se campo existe em Account ou em Contact
 */

/**
 * userDetail.address
 * 📍 SOURCE: Dataverse - Address
 * 🗝️  FIELDS: osot_address_1, osot_address_2, osot_city, osot_province, osot_postal_code
 * 📝 DESCRIPTION: Endereço completo formatado
 * 🔍 FORMAT: "{osot_address_1}, {osot_city} - {osot_province}, {osot_postal_code}"
 * 🔍 EXAMPLE: "19 Kew Gdns, Richmond Hill - ON, L4B-1R6"
 * 📌 QUERY: Address.findByAccountId(userGuid) -> [0]
 * 📌 NOTES: Usar primeiro endereço do array
 */

// ========================================
// SECTION 3: ORGANIZATION DETAIL
// ========================================

/**
 * organizationDetail.name
 * 📍 SOURCE: Dataverse - Organization
 * 🗝️  FIELD: osot_name
 * 📝 DESCRIPTION: Nome da organização
 * 🔍 EXAMPLE: "Ontario Society of Occupational Therapists"
 * 📌 QUERY: Organization.findById(organizationId) -> osot_name
 * 📌 NOTES: Vem do JWT criptografado (decryptOrganizationId)
 */

/**
 * organizationDetail.address
 * 📍 SOURCE: Dataverse - Organization
 * 🗝️  FIELDS: osot_address_1, osot_address_2, osot_city, osot_province, osot_postal_code
 * 📝 DESCRIPTION: Endereço completo da organização
 * 🔍 FORMAT: "{osot_address_1}, {osot_city}, {osot_province} {osot_postal_code}"
 * 🔍 EXAMPLE: "110 Sheppard Ave E Suite 810, North York, ON M2N 6Y8"
 * 📌 QUERY: Organization.findById(organizationId) -> address fields
 */

// ========================================
// SECTION 4: MEMBERSHIP DETAIL
// ========================================

/**
 * membershipDetail.category
 * 📍 SOURCE: Dataverse - MembershipCategory
 * 🗝️  FIELD: osot_name
 * 📝 DESCRIPTION: Nome da categoria de membership
 * 🔍 EXAMPLE: "OT - Practicing"
 * 📌 QUERY: MembershipCategory.findById(categoryGuid) -> osot_name
 * 📌 NOTES: Category GUID vem do CreateMembershipCategoryDto.categoryGuid
 */

/**
 * membershipDetail.period
 * 📍 SOURCE: Calculated + Dataverse
 * 🟢 LOGIC: 
 *   - startDate = today (Date.now())
 *   - endDate = MembershipSettings.osot_expires_date
 *   - Format: `From ${startDate.toLocaleDateString()} until ${endDate.toLocaleDateString()}`
 * 📝 DESCRIPTION: Período de validade do membership
 * 🔍 EXAMPLE: "From February 03, 2026 until October 14, 2026"
 * 📌 QUERY: MembershipSettings.findByMembershipYear(membershipYear) -> osot_expires_date
 */

/**
 * membershipDetail.status
 * 📍 SOURCE: Calculated + Redis
 * 🟢 LOGIC:
 *   - Check if account has previous membership in Dataverse
 *   - If exists AND expires_date > today: "Renewal"
 *   - Otherwise: "New member"
 *   - Could also be "Upgrade" (if changing category) or "Reinstatement"
 * 📝 DESCRIPTION: Tipo de membership (novo ou renovação)
 * 🔍 EXAMPLE: "New member"
 * 📌 QUERY: Account.findMembershipHistory(userGuid, organizationId) -> check previous memberships
 */

/**
 * membershipDetail.certificate
 * 📍 SOURCE: Dataverse - Account
 * 🗝️  FIELD: osot_certificate
 * 📝 DESCRIPTION: Número do certificado ou ID gerado
 * 🔍 EXAMPLE: "osot-0003519"
 * 📌 QUERY: Account.findById(userGuid) -> osot_certificate
 * ⚠️  TODO: Verificar se este campo existe; se não, gerar pattern como "osot-{counter}"
 */

// ========================================
// SECTION 5: PRODUCTS LIST
// ========================================

/**
 * products[i].id
 * 📍 SOURCE: Dataverse - OrderProduct
 * 🗝️  FIELD: osot_table_order_productid
 * 📝 DESCRIPTION: ID único da linha de produto no Order
 * 🔍 EXAMPLE: "prod-line-12345"
 * 📌 QUERY: OrderProduct.findByOrderId(orderId) -> osot_table_order_productid
 */

/**
 * products[i].productId
 * 📍 SOURCE: Dataverse - Product (via OrderProduct)
 * 🗝️  FIELD: _osot_product_id_value (lookup GUID)
 * 📝 DESCRIPTION: GUID do produto
 * 🔍 EXAMPLE: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 * 📌 QUERY: OrderProduct.findByOrderId(orderId) -> _osot_product_id_value
 * 📌 NOTES: Referência para rastrear qual produto foi selecionado
 */

/**
 * products[i].name
 * 📍 SOURCE: Dataverse - Product (via OrderProduct)
 * 🗝️  FIELD: osot_product_name
 * 📝 DESCRIPTION: Nome do produto
 * 🔍 EXAMPLE: "2025 2026 Membership"
 * 📌 QUERY: OrderProduct.findByOrderId(orderId) -> osot_product_name
 *           OU PreFilled em OrderProduct.osot_product_name
 */

/**
 * products[i].description
 * 📍 SOURCE: Dataverse - Product
 * 🗝️  FIELD: osot_description
 * 📝 DESCRIPTION: Descrição detalhada do produto
 * 🔍 EXAMPLE: "2025 Membership Fees - Expires on October 1st 2026"
 * 📌 QUERY: Product.findById(productId) -> osot_description
 * 📌 NOTES: Pode incluir datas de expiração, cobertura, etc
 */

/**
 * products[i].price
 * 📍 SOURCE: Dataverse - OrderProduct
 * 🗝️  FIELD: osot_selectedprice
 * 📝 DESCRIPTION: Preço unitário do produto (antes de imposto)
 * 🔍 EXAMPLE: 200.25
 * 📌 QUERY: OrderProduct.findByOrderId(orderId) -> osot_selectedprice
 * 📌 NOTES: Este campo foi preenchido em addMembershipToOrder(),
 *           addInsuranceToOrder(), addDonationToOrder()
 */

/**
 * products[i].tax
 * 📍 SOURCE: Dataverse - OrderProduct
 * 🗝️  FIELD: osot_taxamount
 * 📝 DESCRIPTION: Valor do imposto
 * 🔍 EXAMPLE: 16.02
 * 📌 QUERY: OrderProduct.findByOrderId(orderId) -> osot_taxamount
 */

/**
 * products[i].total
 * 📍 SOURCE: Dataverse - OrderProduct
 * 🗝️  FIELD: osot_itemtotal
 * 📝 DESCRIPTION: Total do item (preço + imposto)
 * 🔍 EXAMPLE: 216.27
 * 📌 QUERY: OrderProduct.findByOrderId(orderId) -> osot_itemtotal
 * 📌 NOTES: Já calculado em addXxxToOrder()
 */

/**
 * products[i].category
 * 📍 SOURCE: Dataverse - OrderProduct OR Product
 * 🗝️  FIELD: osot_product_category (ou ProductCategory enum)
 * 📝 DESCRIPTION: Categoria do produto (MEMBERSHIP, INSURANCE, DONATION)
 * 🔍 EXAMPLE: "MEMBERSHIP"
 * 📌 QUERY: OrderProduct.findByOrderId(orderId) -> osot_product_category
 *           OU Product.findById(productId) -> osot_product_category
 */

/**
 * products[i].validFrom
 * 📍 SOURCE: Calculated
 * 🟢 LOGIC:
 *   - MEMBERSHIP: today (Date.now())
 *   - INSURANCE: today + grace_period (7 dias típico)
 *   - DONATION: null (sem período)
 * 📝 DESCRIPTION: Data de início de validade
 * 🔍 EXAMPLE: "2026-02-03"
 * 📌 NOTES: Formato ISO 8601
 */

/**
 * products[i].validUntil
 * 📍 SOURCE: Dataverse - MembershipSettings OR Product
 * 🗝️  FIELD: osot_expires_date (para membership e insurance)
 * 📝 DESCRIPTION: Data de término de validade
 * 🔍 EXAMPLE: "2026-10-14"
 * 📌 QUERY: MembershipSettings.findByMembershipYear(membershipYear) -> osot_expires_date
 *           OU Product.findById(productId) -> osot_expires_date
 * 📌 NOTES: Formato ISO 8601; null para doações
 */

/**
 * products[i].coverage
 * 📍 SOURCE: Dataverse - Product
 * 🗝️  FIELD: osot_insurance_limit (para seguros)
 * 📝 DESCRIPTION: Cobertura do seguro (apenas para insurance products)
 * 🔍 EXAMPLE: "$6,000,000"
 * 📌 QUERY: Product.findById(productId) -> osot_insurance_limit
 * 📌 NOTES: Apenas para produtos com category = INSURANCE; null para outros
 */

/**
 * products[i].isTaxDeductible
 * 📍 SOURCE: Dataverse - Product
 * 🗝️  FIELD: osot_tax_deductible OR Calculated
 * 📝 DESCRIPTION: Se doação é dedutível de imposto (apenas para donations)
 * 🔍 EXAMPLE: false ou true
 * 📌 QUERY: Product.findById(productId) -> osot_tax_deductible
 * 📌 NOTES: true apenas para produtos com category = DONATION; undefined para outros
 * ⚠️  TODO: Verificar se campo existe no Product; se não, usar categoria como flag
 */

// ========================================
// SECTION 6: FINANCIAL SUMMARY
// ========================================

/**
 * financialSummary.subtotal
 * 📍 SOURCE: Calculated
 * 🟢 LOGIC: SUM(OrderProduct.osot_itemsubtotal for all products)
 *           OU SUM(OrderProduct.osot_selectedprice * osot_quantity)
 * 📝 DESCRIPTION: Subtotal de todos os produtos
 * 🔍 EXAMPLE: 557.50
 * 📌 QUERY: OrderProduct.findByOrderId(orderId) -> SUM(osot_itemsubtotal)
 */

/**
 * financialSummary.tax
 * 📍 SOURCE: Calculated
 * 🟢 LOGIC: SUM(OrderProduct.osot_taxamount for all products)
 * 📝 DESCRIPTION: Total de impostos
 * 🔍 EXAMPLE: 59.21
 * 📌 QUERY: OrderProduct.findByOrderId(orderId) -> SUM(osot_taxamount)
 */

/**
 * financialSummary.discount
 * 📍 SOURCE: Redis OR Dataverse
 * 🗝️  KEY: membership-orchestrator:coupon:{sessionId} OR Order.osot_discount_amount
 * 📝 DESCRIPTION: Desconto aplicado (se houver cupom)
 * 🔍 EXAMPLE: 0.0 or 50.0
 * 📌 QUERY: Redis.get(COUPON_KEY) OU Order.findById(orderId) -> osot_discount_amount
 * 📌 NOTES: Implementar se tiver sistema de cupons; por enquanto = 0
 */

/**
 * financialSummary.total
 * 📍 SOURCE: Calculated
 * 🟢 LOGIC: subtotal + tax - discount
 * 📝 DESCRIPTION: Total a ser pago
 * 🔍 EXAMPLE: 616.71
 */

/**
 * financialSummary.paymentMethod
 * 📍 SOURCE: Dataverse - Order OR DTO
 * 🗝️  FIELD: osot_payment_method (from PaymentInformationDto)
 * 📝 DESCRIPTION: Método de pagamento
 * 🔍 EXAMPLE: "credit_card"
 * 📌 QUERY: Order.findById(orderId) -> osot_payment_method
 *           OU CompleteMembershipRegistrationDto.paymentInfo.method
 * 📌 OPTIONS: credit_card, debit_card, bank_transfer, paypal
 */

/**
 * financialSummary.processor
 * 📍 SOURCE: Configuration OR Dataverse
 * 🗝️  FIELD: osot_payment_processor OR from config
 * 📝 DESCRIPTION: Processador de pagamento
 * 🔍 EXAMPLE: "PayPal" or "Stripe"
 * 📌 NOTES: Pode vir de config (process.env.PAYMENT_PROCESSOR)
 *           ou de Order.osot_payment_processor
 */

// ========================================
// TOTAL DATA SOURCES NEEDED
// ========================================

/**
 * Para popular OrderSummaryResponseDto, precisa fazer queries:
 *
 * 🔵 DATAVERSE QUERIES:
 * 1. Account.findById(userGuid)
 *    → osot_first_name, osot_last_name, osot_email, osot_phone_number, osot_certificate
 *
 * 2. Address.findByAccountId(userGuid)
 *    → [0]: osot_address_1, osot_address_2, osot_city, osot_province, osot_postal_code
 *
 * 3. Organization.findById(organizationId)
 *    → osot_name, osot_address_1, osot_address_2, osot_city, osot_province, osot_postal_code
 *
 * 4. MembershipCategory.findById(categoryGuid)
 *    → osot_name
 *
 * 5. MembershipSettings.findByMembershipYear(membershipYear)
 *    → osot_expires_date
 *
 * 6. OrderProduct.findByOrderId(orderId)
 *    → ALL fields (id, productId, name, description, price, tax, total, category)
 *    → For each product, may need to lookup Product.findById(productId)
 *      → osot_description, osot_insurance_limit, osot_tax_deductible
 *
 * 7. Order.findById(orderId)
 *    → osot_payment_method, osot_payment_processor, osot_discount_amount
 *
 * 🟡 REDIS QUERIES:
 * 1. Redis.get(ORDER_REFERENCE(sessionId)) → orderId
 *
 * 🟢 CALCULATED:
 * - date: today
 * - period: formatting
 * - status: logic-based
 * - validFrom/validUntil: calculated per product type
 * - subtotal, tax, total: SUM from OrderProducts
 */
