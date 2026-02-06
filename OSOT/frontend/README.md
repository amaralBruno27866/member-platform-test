# OSOT API Interface

> Modern full-stack platform for the **Ontario Society of Occupational Therapists** membership management system

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</p>

---

## 📋 Overview

**OSOT API Interface** is a comprehensive membership management platform that combines a **React 19 frontend** with a **NestJS backend**, integrated with **Microsoft Dataverse**. This system handles professional and affiliate member registration, profile management, education tracking, and administrative workflows.

### Key Features

- 🔐 **Multi-tier Authentication** - JWT-based auth with role-based access control (viewer, owner, admin)
- 👥 **Dual User Types** - Professional OT/OTA members and Affiliate organizations
- 📝 **Registration Orchestration** - Multi-step registration wizard with email verification
- 🏢 **Dataverse Integration** - Seamless Microsoft Dynamics 365 backend integration
- 📊 **Admin Dashboard** - Comprehensive approval workflows and user management
- 🎓 **Education Management** - OT and OTA education tracking and certification
- 🌐 **Responsive Design** - Mobile-first UI built with Tailwind CSS and Shadcn/ui

---

## 🏗️ Architecture

This is a **monorepo** containing both frontend and backend applications:

```
osot-api-interface/
├── src/                        # Frontend React application
│   ├── components/            # React components (auth, layout, UI)
│   ├── pages/                 # Application pages and routes
│   ├── services/              # API client services
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript type definitions
│   └── lib/                   # Utilities and configurations
├── osot_api/                  # Backend NestJS application
│   ├── src/
│   │   ├── auth/             # Authentication & JWT strategies
│   │   ├── classes/          # Domain modules (account, identity, etc.)
│   │   ├── common/           # Shared utilities and enums
│   │   ├── emails/           # Email templates and service
│   │   └── integrations/     # Dataverse integration layer
│   └── scripts/              # Utility scripts and generators
├── docs/                      # Project documentation
└── tables/                    # Dataverse table schema definitions
```

### Technology Stack

#### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 3 + Shadcn/ui components
- **State Management:** TanStack React Query (React Query v5)
- **Forms:** React Hook Form + Zod validation
- **Routing:** React Router DOM v7
- **HTTP Client:** Axios

#### Backend
- **Framework:** NestJS 11 + TypeScript
- **Authentication:** Passport.js + JWT
- **Validation:** Class-validator + Class-transformer
- **Email:** Nodemailer with Handlebars templates
- **Integration:** Microsoft Dataverse (Dynamics 365)
- **Scheduling:** NestJS Schedule
- **Documentation:** Swagger/OpenAPI

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm 8+
- **Microsoft Dataverse** environment with API access
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:osot-bamaral/osot-api-interface.git
   cd osot-api-interface
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd osot_api
   npm install
   cd ..
   ```

4. **Configure environment variables**

   **Frontend** - Create `.env.local`:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_APP_NAME=OSOT Platform
   ```

   **Backend** - Create `osot_api/.env`:
   ```env
   # Dataverse Configuration
   DATAVERSE_URL=https://your-org.crm.dynamics.com
   DATAVERSE_CLIENT_ID=your-client-id
   DATAVERSE_CLIENT_SECRET=your-client-secret
   DATAVERSE_TENANT_ID=your-tenant-id

   # JWT Configuration
   JWT_SECRET=your-secret-key
   JWT_EXPIRATION=1h

   # Email Configuration (NodeMailer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=noreply@osot.org
   ```

### Running the Applications

#### Development Mode

**Frontend** (port 5173):
```bash
npm run dev
```

**Backend** (port 3000):
```bash
cd osot_api
npm run start:dev
```

#### Production Build

**Frontend**:
```bash
npm run build
npm run preview
```

**Backend**:
```bash
cd osot_api
npm run build
npm run start:prod
```

---

## 📚 Documentation

### Project Documentation

- **[Project Planning](./docs/PROJECT_PLANNING.md)** - Development roadmap and phase breakdown
- **[Frontend Specifications](./docs/FRONTEND_SPECIFICATIONS.md)** - UI/UX and component architecture
- **[Frontend Integration Guide](./docs/FRONTEND_INTEGRATION_GUIDE.md)** - API consumption patterns
- **[Error Handling Guide](./docs/ERROR_HANDLING_FRONTEND_GUIDE.md)** - Error management strategies
- **[Email Verification](./docs/EMAIL_VERIFICATION_URLS.md)** - Verification workflow documentation

### Backend Documentation

- **[Backend README](./osot_api/README.md)** - NestJS API comprehensive guide
- **[OpenAPI Documentation](./osot_api/openapi.json)** - Complete API schema
- **[Enum Endpoints](./osot_api/ENUM_ENDPOINTS_IMPLEMENTATION_COMPLETE.md)** - Enum reference guide

### API Documentation

When the backend is running, access interactive API documentation at:
- **Swagger UI:** http://localhost:3000/api/docs

---

## 🔑 Key Features

### Registration & Authentication

- **Multi-step Registration Wizard** - Guided account creation for professionals and affiliates
- **Email Verification** - Automated email confirmation with secure tokens
- **Admin Approval Workflow** - Manual review and approval for new accounts
- **JWT Authentication** - Secure token-based authentication with refresh tokens

### User Management

- **Profile Management** - Account, contact, identity, and address information
- **Education Tracking** - OT and OTA degree and certification management
- **Membership Categories** - Automated category calculation based on credentials
- **Address Management** - Multiple address types with validation

### Admin Features

- **Approval Dashboard** - Review and approve/reject pending accounts
- **User Administration** - Manage user accounts and permissions
- **Email Notifications** - Automated emails for registration, approval, and rejection
- **Audit Logging** - Complete activity tracking

### Data Integration

- **Dataverse Sync** - Real-time synchronization with Microsoft Dynamics 365
- **Orchestrator Service** - Coordinates complex multi-entity operations
- **Error Recovery** - Automatic retry logic with exponential backoff
- **Business Rules** - Validation and enforcement of business logic

---

## 🧪 Testing

### Frontend Testing
```bash
npm run lint                    # ESLint code quality checks
```

### Backend Testing
```bash
cd osot_api
npm run test                    # Unit tests
npm run test:cov               # Coverage report
npm run test:e2e               # End-to-end tests
npm run lint                   # ESLint checks
```

---

## 📁 Project Structure

### Frontend Key Directories

```
src/
├── components/
│   ├── auth/                  # Authentication components
│   │   └── registration/     # Registration wizard steps
│   ├── layout/               # Page layouts (Auth, Dashboard)
│   └── ui/                   # Shadcn/ui components
├── pages/
│   ├── auth/                 # Login, registration pages
│   ├── admin/                # Admin approval pages
│   ├── dashboard/            # User dashboard
│   ├── profile/              # Profile management pages
│   ├── education/            # Education management
│   └── verification/         # Email verification pages
├── services/                 # API client services
├── hooks/                    # Custom React hooks (useAuth, useAccount, etc.)
└── types/                    # TypeScript interfaces
```

### Backend Key Directories

```
osot_api/src/
├── auth/                     # Authentication & authorization
├── classes/
│   ├── orchestrator/        # Registration orchestration
│   ├── user-account/        # Account, contact, identity, address
│   └── membership/          # Membership categories and settings
├── common/
│   ├── enums/              # Shared enumerations
│   ├── errors/             # Error handling utilities
│   └── services/           # Shared services
├── emails/                  # Email templates and service
└── integrations/           # Dataverse integration layer
```

---

## 🔐 Environment Variables

### Required Frontend Variables
- `VITE_API_URL` - Backend API base URL

### Required Backend Variables
- `DATAVERSE_URL` - Microsoft Dataverse instance URL
- `DATAVERSE_CLIENT_ID` - Azure AD application client ID
- `DATAVERSE_CLIENT_SECRET` - Azure AD application secret
- `DATAVERSE_TENANT_ID` - Azure AD tenant ID
- `JWT_SECRET` - Secret key for JWT signing
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` - SMTP configuration

---

## 🤝 Contributing

This is a private repository. For internal team members:

1. Create a feature branch from `main`
2. Implement changes following existing patterns
3. Write/update tests as needed
4. Submit pull request with detailed description
5. Ensure all CI checks pass

### Code Standards
- TypeScript strict mode enabled
- ESLint configuration enforced
- Component-based architecture
- Type-safe API integration
- Comprehensive error handling

---

## 📄 License

**Private & Confidential** - Ontario Society of Occupational Therapists

This project is proprietary software. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 📞 Support

For questions or issues, contact the development team or create an issue in the repository.

---

**Built with ❤️ for the Ontario Society of Occupational Therapists**

_Last updated: December 2025_
