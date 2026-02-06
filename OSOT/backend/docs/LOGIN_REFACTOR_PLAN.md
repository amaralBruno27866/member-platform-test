# Login Refactor Plan – OSOT Dataverse API

## Objective

- Enable authentication for both person (Account) and company (Account Affiliate) users through a single login endpoint.
- Dynamically select the correct Dataverse app (owner, admin, main) based on user privilege.
- Ensure security, clarity, and flexibility for future improvements.

---

## Why Change?

- The current login only searches one table and does not distinguish user types.
- No dynamic app selection based on privilege.
- Simplifies maintenance, testing, and future optimizations.

---

## What Will Be Modified?

1. **AuthService**

   - Search for user by email in Account first, then Account Affiliate if not found.
   - Validate password and identify privilege.
   - Select the correct app (owner, admin, main) based on privilege.
   - Generate JWT with complete user info.

2. **TableAccountService & TableAccountAffiliateService**

   - Ensure both have methods to search by email.

3. **(Optional) LoginDto**

   - Add user type field if needed in the future.

4. **Documentation**
   - Update Swagger and endpoint documentation.

---

## Business Rules

- Search by email in Account. If not found, search in Account Affiliate.
- Validate password using bcrypt.
- Identify privilege using `osot_privilege`:
  - 2 = owner → use owner-app
  - 3 = admin → use admin-app
  - 4 = main → use main-app
- Return JWT and user data.
- If not found or password invalid, return 401 Unauthorized.

---

## Where Will Be Modified?

- `src/auth/auth.service.ts`
- `src/accounts/services/table-account.services.ts`
- `src/account-affiliate/table-account-affiliate.services.ts` (or equivalent)
- (Optional) `src/auth/login.dto.ts`
- `src/auth/auth.controller.ts` (if endpoint or docs change)

---

## Additional Recommendations

- Add automated tests for both person and company login.
- Update technical and API documentation.
- Log changes in a CHANGELOG file.

---

_This plan ensures a robust, flexible, and future-proof login process for the OSOT Dataverse API._
