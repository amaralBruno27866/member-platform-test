# Product Metrics & Reports - Implementation Plan

**Date:** January 19, 2026  
**Status:** 📋 Planned (Not Started)  
**Priority:** Medium (Post Multi-Tenant Integration)

---

## 📊 Overview

Sistema de métricas e relatórios para gestão de produtos por organização. Cada tenant gerencia seus próprios produtos com métricas padrão da indústria e relatórios exportáveis em PDF.

---

## 🎯 Objetivos

1. **Inventory Health Monitoring** - Alertas de estoque baixo, produtos parados
2. **Sales Performance Analysis** - Top sellers, dead stock identification
3. **Financial Insights** - Valor total em estoque, produtos mais rentáveis
4. **Automated Reporting** - Relatórios agendados por email (futuro)
5. **Insurance Certificates** - Geração de PDFs para certificados (use case futuro)

---

## ⏱️ Time Estimates

### Phase 1: Basic Metrics (MVP)
**Time:** 4-6 hours  
**Difficulty:** 🟢 Low-Medium  
**Priority:** 🔴 High

**Tasks:**
- [ ] Create `ProductMetricsResponseDto` (30 min)
- [ ] Implement `ProductMetricsService.calculate()` (1.5h)
- [ ] Add endpoint `GET /private/products/metrics` (30 min)
- [ ] Unit tests (100% coverage) (1.5h)
- [ ] OpenAPI documentation (30 min)

**Deliverable:**
```typescript
GET /private/products/metrics
Response: {
  organizationId: string;
  metrics: {
    inventory: { outOfStock, lowStock, total },
    sales: { topSelling, slowMoving },
    financial: { totalValue, deadStockValue }
  }
}
```

---

### Phase 2: Configurable Thresholds
**Time:** 3-4 hours  
**Difficulty:** 🟡 Medium  
**Priority:** 🟡 Medium

**Tasks:**
- [ ] Dataverse table: `osot_table_organization_settings` (1h manual)
- [ ] Create `OrganizationMetricsSettingsDto` (30 min)
- [ ] Endpoint `PATCH /organizations/:id/settings/metrics` (1h)
- [ ] Integrate settings with metrics calculation (1h)
- [ ] Tests (1h)

**Deliverable:**
```typescript
PATCH /private/organizations/:id/settings/metrics
Body: {
  lowStockThreshold: 5,      // Default: 10
  slowMovingDays: 60,        // Default: 90
  deadStockDays: 180         // Default: 180
}
```

---

### Phase 3: Puppeteer + PDF Generation
**Time:** 6-8 hours  
**Difficulty:** 🟡 Medium  
**Priority:** 🟡 Medium-High

**Tasks:**
- [ ] Install dependencies (`puppeteer`, `handlebars`) (30 min)
- [ ] Create `PdfGeneratorService` (generic) (2h)
- [ ] HTML template: product metrics report (2h)
- [ ] Endpoint: `GET /private/products/metrics/pdf` (1h)
- [ ] Tests (mocking Puppeteer) (1.5h)
- [ ] Optimization (PDF cache, async jobs) (1h)

**Deliverable:**
```typescript
GET /private/products/metrics/pdf
Response: application/pdf (buffer download)
```

**Dependencies:**
```bash
npm install puppeteer handlebars
npm install -D @types/puppeteer
```

---

### Phase 4: Scheduled Reports (Future)
**Time:** 8-10 hours  
**Difficulty:** 🔴 High  
**Priority:** 🔵 Low (Nice-to-have)

**Tasks:**
- [ ] Install `@nestjs/schedule` (15 min)
- [ ] Dataverse table: `osot_table_scheduled_reports` (1h)
- [ ] CRUD for report schedules (3h)
- [ ] Cron jobs for execution (2h)
- [ ] Queue (Bull/Redis) for async processing (2h)
- [ ] Email integration (1h)
- [ ] E2E tests (2h)

**Deliverable:**
```typescript
POST /private/reports/schedule
Body: {
  type: 'product-metrics',
  frequency: 'weekly',
  format: 'pdf',
  recipients: ['admin@org.com']
}
```

---

## 📊 Industry-Standard Metrics

### 1. Inventory Health
```typescript
{
  // 🔴 Critical Alerts
  outOfStock: 5,              // Products with inventory = 0
  lowStock: 12,               // Products with inventory < threshold (default: 10)
  
  // 🟡 Performance Alerts
  slowMoving: 8,              // No sales in 90+ days
  deadStock: 3,               // No sales in 180+ days
  
  // 🟢 Positive Metrics
  wellStocked: 45,            // Inventory > 10 units
  turnoverRate: 2.5,          // Average sales/stock ratio
  
  // 💰 Financial Value
  totalInventoryValue: 125000,  // Sum of (price × inventory)
  deadStockValue: 15000         // Capital tied up in unsold products
}
```

**Reference:** Amazon Seller Central, Shopify Analytics, WooCommerce

---

### 2. Sales Performance
```typescript
{
  // 📊 Top Performers
  topSellingProducts: [
    { productCode: 'MEMBERSHIP-2025', sales: 150, revenue: 15000 },
    { productCode: 'CONF-2025', sales: 80, revenue: 20000 }
  ],
  
  // 📉 Bottom Performers
  bottomSellingProducts: [
    { productCode: 'WORKSHOP-OLD', sales: 2, daysSinceLaunch: 180 }
  ],
  
  // 💵 Revenue Metrics
  totalRevenue: 150000,
  averageOrderValue: 250,
  revenueByCategory: [
    { category: 'MEMBERSHIP', revenue: 50000, percentage: 33.3 },
    { category: 'CONFERENCE', revenue: 70000, percentage: 46.7 }
  ]
}
```

**Reference:** Google Analytics 4, Stripe Dashboard, Square Analytics

---

### 3. Product Lifecycle
```typescript
{
  // 🆕 New Products (launched < 30 days ago)
  newProducts: 5,
  newProductsSales: 25,
  
  // 🔥 Trending Products (growth >20% last month)
  trendingProducts: 8,
  
  // 📅 Seasonal Products (based on product_year)
  seasonalProducts: {
    current: 20,      // Current year products
    expired: 5,       // Past year products
    upcoming: 3       // Future start_date
  },
  
  // ⚠️ Action Required
  productsNeedingReview: 12  // Draft >30 days or discontinued with inventory
}
```

**Reference:** BigCommerce, Magento Commerce

---

### 4. Pricing & Profitability
```typescript
{
  // 💰 Price Analysis
  averageProductPrice: 5500,
  priceRange: { min: 50, max: 25000 },
  
  // 📊 Price Distribution
  priceDistribution: [
    { range: '0-100', count: 5 },
    { range: '101-500', count: 15 },
    { range: '501-1000', count: 10 }
  ],
  
  // 🎯 Category Pricing
  categoryPricing: [
    { category: 'MEMBERSHIP', avgPrice: 8000, margin: '45%' },
    { category: 'COURSE', avgPrice: 2500, margin: '65%' }
  ]
}
```

**Reference:** QuickBooks Commerce, NetSuite

---

### 5. Operational Metrics
```typescript
{
  // ⏱️ Time Metrics
  averageDaysToSell: 45,        // From creation to first sale
  averageTimeInDraft: 12,       // Time in DRAFT status
  
  // 📦 Catalog Efficiency
  catalogEfficiency: 0.85,      // % AVAILABLE products / total
  productUtilization: 0.72,     // % products with sales / total
  
  // 🔄 Updates
  productsUpdatedThisMonth: 18,
  productsCreatedThisMonth: 5
}
```

**Reference:** Zoho Inventory, TradeGecko (QuickBooks Commerce)

---

## 🏗️ Architecture: Hybrid Approach

### MVP: Fixed Metrics with Configurable Thresholds

```typescript
// Fixed metrics (all organizations have these)
const STANDARD_METRICS = [
  'outOfStock',
  'lowStock',
  'slowMoving',
  'deadStock',
  'topSellingProducts',
  'revenueByCategory',
  'catalogEfficiency',
  'totalInventoryValue'
];

// Per-organization configuration
interface OrganizationMetricsConfig {
  organizationId: string;
  
  // Adjustable thresholds
  thresholds: {
    lowStockAlert: 10,      // Default: 10
    slowMovingDays: 90,     // Default: 90
    deadStockDays: 180      // Default: 180
  };
  
  // Choose which metrics to display on dashboard
  enabledMetrics: string[];  // Subset of STANDARD_METRICS
  
  // Email alerts
  alerts: {
    outOfStock: true,
    lowStock: true,
    deadStock: false
  };
}
```

**Advantage:**
- ✅ Standardized but flexible
- ✅ Easy to implement
- ✅ Used by Shopify, BigCommerce

---

## 📄 PDF Generation with Puppeteer

### Why Puppeteer?

#### ✅ Advantages:
1. **Template Reusability**
   ```
   reports/
     product-metrics.hbs         ← Product reports
     insurance-certificate.hbs   ← Insurance certificates
     invoice.hbs                 ← Future: invoices
     membership-card.hbs         ← Future: membership cards
   ```

2. **Familiar Design (HTML/CSS)**
   ```html
   <!-- product-metrics.hbs -->
   <div class="metrics-card">
     <h2>📦 Inventory Health</h2>
     <div class="alert alert-danger">
       <strong>{{outOfStock}}</strong> out of stock products
     </div>
   </div>
   ```

3. **Visual Charts (Chart.js, D3.js)**
   ```html
   <canvas id="categoryChart"></canvas>
   <script>
     new Chart(ctx, {
       type: 'pie',
       data: { labels: {{categories}}, datasets: [...] }
     });
   </script>
   ```

4. **Consistent Branding**
   - Organization logo
   - Custom colors per tenant
   - Corporate fonts

---

### Performance Optimization

#### ❌ Problem: Launching browser per request (slow)
```typescript
const browser = await puppeteer.launch();  // 2-3 seconds
```

#### ✅ Solution: Browser pool
```typescript
class PuppeteerPool {
  private browsers: Browser[] = [];
  
  async getBrowser(): Promise<Browser> {
    if (this.browsers.length > 0) {
      return this.browsers.pop();
    }
    return puppeteer.launch({ headless: 'new' });
  }
  
  releaseBrowser(browser: Browser) {
    this.browsers.push(browser);
  }
}
```

**Performance:**
- Without pool: 3-5 seconds per PDF
- With pool: 500-800ms per PDF ✅

---

### Production Deployment (Docker)

```yaml
# docker-compose.yml
services:
  backend:
    image: node:20-alpine
    environment:
      - PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    depends_on:
      - chrome
  
  chrome:
    image: browserless/chrome:latest
    environment:
      - MAX_CONCURRENT_SESSIONS=10
      - CONNECTION_TIMEOUT=60000
```

**Advantages:**
- ✅ Chromium separated from backend
- ✅ Scalable (multiple instances)
- ✅ Used by DocuSign, Calendly

---

### Error Handling with Fallback

```typescript
async generatePDF(html: string): Promise<Buffer> {
  const maxRetries = 3;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.puppeteerGenerate(html);
    } catch (error) {
      this.logger.warn(`PDF generation failed (attempt ${i+1}/${maxRetries})`);
      
      if (i === maxRetries - 1) {
        // Fallback: send HTML via email or use simple PDFKit
        return this.fallbackToPDFKit(html);
      }
    }
  }
}
```

---

## 📁 Recommended File Structure

```
src/reports/
├── reports.module.ts
├── services/
│   ├── pdf-generator.service.ts       # Core: Puppeteer logic
│   ├── template-renderer.service.ts   # Handlebars rendering
│   └── browser-pool.service.ts        # Browser reuse
├── templates/
│   ├── layouts/
│   │   └── base.hbs                   # Common layout (header/footer)
│   ├── product-metrics.hbs
│   ├── insurance-certificate.hbs
│   └── partials/
│       ├── header.hbs
│       └── footer.hbs
├── styles/
│   └── report.css                     # Shared styles
└── interfaces/
    └── pdf-options.interface.ts

src/classes/others/product/
├── dtos/
│   ├── product-metrics-response.dto.ts    # NEW
│   └── product-metrics-settings.dto.ts    # NEW (Phase 2)
├── services/
│   ├── product-metrics.service.ts         # NEW - Metrics calculation
│   ├── product-crud.service.ts
│   └── product-lookup.service.ts
└── controllers/
    └── private-product.controller.ts      # Add metrics endpoints
```

---

## 💰 Operational Costs

### Puppeteer in Production:

| Resource | Monthly Cost | Notes |
|----------|--------------|-------|
| Browserless (SaaS) | $0-99 | 1000 PDFs/month free |
| Self-hosted (VPS) | $10-20 | DigitalOcean Droplet 2GB |
| AWS Lambda + Puppeteer | $0.20/1000 | Serverless (cold start slow) |
| Render.com (Docker) | $7 | 512MB RAM sufficient |

**Recommendation:** Self-hosted Docker with browserless/chrome

---

## 📋 Implementation Checklist

### Phase 1: MVP (4-6h)
```typescript
// Files to create:
src/classes/others/product/dtos/product-metrics-response.dto.ts
src/classes/others/product/services/product-metrics.service.ts

// Files to modify:
src/classes/others/product/controllers/private-product.controller.ts
src/classes/others/product/modules/product.module.ts
```

- [ ] Create `ProductMetricsResponseDto`
- [ ] Implement `ProductMetricsService.calculate()`
- [ ] Add endpoint `GET /private/products/metrics`
- [ ] Unit tests (80%+ coverage)
- [ ] Swagger documentation

---

### Phase 2: Thresholds (3-4h)
```typescript
// Dataverse changes:
osot_table_organization_settings (new fields or table)

// Files to create:
src/classes/others/organization/dtos/organization-metrics-settings.dto.ts
src/classes/others/organization/interfaces/organization-settings.interface.ts
```

- [ ] Add fields to `osot_table_organization`
- [ ] Create `OrganizationMetricsSettingsDto`
- [ ] Endpoint `PATCH /organizations/:id/settings/metrics`
- [ ] Integrate settings with metrics calculation

---

### Phase 3: PDF (6-8h)
```bash
# Dependencies:
npm install puppeteer handlebars
npm install -D @types/puppeteer
```

```typescript
// Files to create:
src/reports/reports.module.ts
src/reports/services/pdf-generator.service.ts
src/reports/services/template-renderer.service.ts
src/reports/services/browser-pool.service.ts
src/reports/templates/product-metrics.hbs
src/reports/templates/layouts/base.hbs
src/reports/styles/report.css
```

- [ ] Install `puppeteer` + `handlebars`
- [ ] Create `PdfGeneratorService`
- [ ] HTML template for product metrics
- [ ] Endpoint `GET /private/products/metrics/pdf`
- [ ] Browser pool (optimization)
- [ ] Tests with mocking

---

### Phase 4: Scheduled Reports (8-10h) - FUTURE
```bash
# Dependencies:
npm install @nestjs/schedule bull
npm install -D @types/bull
```

```typescript
// Dataverse changes:
osot_table_scheduled_reports (new table)

// Files to create:
src/reports/schedulers/report.scheduler.ts
src/reports/queues/report.processor.ts
src/classes/others/scheduled-reports/ (full CRUD)
```

- [ ] Install `@nestjs/schedule`
- [ ] Dataverse table: `osot_table_scheduled_reports`
- [ ] CRUD for schedule management
- [ ] Cron jobs for execution
- [ ] Queue (Bull/Redis) for async processing
- [ ] Email integration
- [ ] E2E tests

---

## 🎯 Roadmap Summary

| Phase | Time | Difficulty | Priority | Status |
|-------|------|------------|----------|--------|
| 1. Basic Metrics | 4-6h | 🟢 Low-Medium | 🔴 High | ⏳ Pending |
| 2. Thresholds | 3-4h | 🟡 Medium | 🟡 Medium | ⏳ Pending |
| 3. Puppeteer + PDF | 6-8h | 🟡 Medium | 🟡 Medium-High | ⏳ Pending |
| 4. Scheduled Reports | 8-10h | 🔴 High | 🔵 Low | ⏳ Future |
| **TOTAL (Phases 1-3)** | **13-18h** | | | |

---

## 🚀 Next Steps (When Ready)

### Option A: Incremental Implementation (Recommended)
1. **Week 1:** Implement Phase 1 (basic metrics) → 4-6h
2. **Week 2:** Test + adjust
3. **Week 3:** Phase 2 (thresholds) + Phase 3 (Puppeteer)

### Option B: Complete Implementation
- All phases in 2-3 dedicated work days
- Risk: may block other features

---

## 📚 References

### Platforms Doing This Well:
1. **Shopify Analytics** → Fixed metrics + configurable dashboards
2. **WooCommerce + WooCommerce Analytics** → Weekly PDF reports
3. **Square Dashboard** → Real-time low stock alerts
4. **QuickBooks Commerce** → Dead stock analysis, turnover rate
5. **Zoho Inventory** → Configurable reorder points per product

---

## 🔗 Related Documentation
- [Product Architecture](./PRODUCT_FRONTEND_INTEGRATION_GUIDE.md)
- [Multi-Tenant Organization Integration](./copilot-instructions.md)
- [Email Service](./FRONTEND_EMAIL_VERIFICATION_REQUIREMENTS.md)

---

**Last Updated:** January 19, 2026  
**Next Review:** When starting metrics implementation
